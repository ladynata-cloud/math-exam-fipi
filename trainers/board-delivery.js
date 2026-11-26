/* Durable completed-ink outbox. One immutable operation per storage key avoids
   one tab overwriting another tab's queue. Credentials never enter this store. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoardDelivery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PREFIX = 'mathexam.boardInk.v1:';
  const copy = value => JSON.parse(JSON.stringify(value));
  class Outbox {
    constructor({ storage, scope, id, changed = () => {} }) {
      this.storage = storage; this.scope = copy(scope); this.id = id; this.changed = changed;
      this.prefix = PREFIX + [scope.server, scope.roomId, scope.participantId].map(encodeURIComponent).join(':') + ':';
      this.records = new Map(); this.fault = ''; this.busy = false; this.closed = false;
      this.load();
    }
    key(opId) { return this.prefix + opId; }
    valid(record, key) {
      return record?.version === 1 && record.scope?.server === this.scope.server
        && record.scope?.roomId === this.scope.roomId && record.scope?.participantId === this.scope.participantId
        && typeof record.opId === 'string' && /^[A-Za-z0-9_-]{6,96}$/.test(record.opId)
        && this.key(record.opId) === key && typeof record.pageId === 'string'
        && Number.isSafeInteger(record.pageEpoch) && record.pageEpoch >= 0
        && Number.isSafeInteger(record.controlVersion) && record.controlVersion >= 0
        && ['board:stroke-end', 'board:text-add'].includes(record.eventName)
        && record.stroke && typeof record.stroke === 'object'
        && ['pending', 'rejected', 'archived'].includes(record.status);
    }
    load() {
      try {
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (!key?.startsWith(this.prefix)) continue;
          const raw = this.storage.getItem(key), record = JSON.parse(raw);
          if (!this.valid(record, key)) throw new Error('invalid local record');
          if (!this.records.has(record.opId)) this.records.set(record.opId, record);
        }
      } catch (_) { this.fault = 'storage'; }
    }
    list() { return [...this.records.values()].sort((a, b) => a.createdAt - b.createdAt || a.opId.localeCompare(b.opId)); }
    pending() { return this.list().filter(item => item.status === 'pending'); }
    rejected() { return this.list().filter(item => item.status === 'rejected'); }
    active() { return this.list().filter(item => item.status !== 'archived'); }
    blocked() { return !!this.fault || this.active().length >= 256; }
    archiveRejected() {
      for (const record of this.rejected()) {
        try {
          const archived = { ...record, status: 'archived' };
          this.storage.setItem(this.key(record.opId), JSON.stringify(archived));
          this.records.set(record.opId, archived);
        } catch (_) { this.fault = 'storage'; break; }
      }
      this.changed();
    }
    enqueue({ pageId, pageEpoch, controlVersion, eventName, stroke }) {
      if (this.closed || this.blocked()) return null;
      const record = { version: 1, scope: copy(this.scope), opId: this.id(), pageId,
        pageEpoch, controlVersion, eventName, stroke: copy(stroke), createdAt: Date.now(), status: 'pending' };
      this.records.set(record.opId, record);
      try { this.storage.setItem(this.key(record.opId), JSON.stringify(record)); }
      catch (_) { this.fault = 'storage'; }
      this.changed();
      return record;
    }
    retryStorage() {
      // Invalid stored data must remain untouched and visible as a fault.
      this.fault = ''; this.load();
      if (this.fault) { this.changed(); return false; }
      try {
        for (const record of this.list()) {
          if (record.status === 'acknowledged') {
            this.storage.removeItem(this.key(record.opId)); this.records.delete(record.opId);
          } else this.storage.setItem(this.key(record.opId), JSON.stringify(record));
        }
      } catch (_) { this.fault = 'storage'; }
      this.changed(); return !this.fault;
    }
    accept(record, ack) {
      if (this.closed || this.records.get(record.opId) !== record) return false;
      if (ack?.ok === true && ack.opId === record.opId && ack.roomId === this.scope.roomId
        && ack.pageId === record.pageId && ack.pageEpoch === record.pageEpoch && ack.durable === true) {
        // Do not redraw the ACK's object: an accepted stroke may already have
        // been undone/cleared while its acknowledgement was lost.
        record.status = 'acknowledged';
        try { this.storage.removeItem(this.key(record.opId)); this.records.delete(record.opId); }
        catch (_) { this.fault = 'storage'; }
        this.changed(); return true;
      }
      if (ack?.ok === false && ack.opId === record.opId && ack.retryable === false) {
        record.status = 'rejected'; record.error = String(ack.error || 'REJECTED').slice(0, 100);
        try { this.storage.setItem(this.key(record.opId), JSON.stringify(record)); }
        catch (_) { this.fault = 'storage'; }
        this.changed();
      }
      return false;
    }
    async flush(send) {
      if (this.busy || this.closed || this.fault) return;
      this.busy = true;
      try {
        for (const record of this.pending()) {
          if (this.closed || this.fault) break;
          let ack;
          try { ack = await send(copy(record)); } catch (_) { break; }
          if (!this.accept(record, ack) && record.status === 'pending') break;
        }
      } finally { this.busy = false; this.changed(); }
    }
    export() {
      const damaged = [];
      try {
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key?.startsWith(this.prefix)) damaged.push({ key, value: this.storage.getItem(key) });
        }
      } catch (_) {}
      return { version: 1, scope: copy(this.scope), records: copy(this.list()), localRecords: damaged };
    }
    close() { this.closed = true; }
  }
  return { Outbox, PREFIX };
});
