/* Scoped to the two H35 trainers. Legacy aggregate storage is never written. */
(function (root) {
  'use strict';
  const PREFIX = 'mathExam.h35Algebra.v1.', LEGACY = 'mathExamCourseProgress.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  function number(raw) {
    const text = String(raw ?? '').trim().replaceAll('−', '-').replaceAll(',', '.');
    if (!text || text.length > 160) return null;
    // A bounded number or fraction, not JavaScript or a permissive parseFloat.
    const atom = '[+-]?(?:\\d{1,12}(?:\\.\\d{1,12})?|\\.\\d{1,12})';
    if (!new RegExp('^' + atom + '(?:\\s*/\\s*' + atom + ')?$').test(text)) return null;
    const parts = text.split('/').map(Number);
    if (parts.length === 2 && parts[1] === 0) return null;
    const value = parts.length === 2 ? parts[0] / parts[1] : parts[0];
    return Number.isFinite(value) && Math.abs(value) <= 1e12 ? value : null;
  }
  function pair(raw) {
    let text = String(raw ?? '').trim();
    if (text.startsWith('(') && text.endsWith(')')) text = text.slice(1, -1);
    const parts = text.split(';');
    if (parts.length !== 2) return null;
    const result = parts.map(number);
    return result.every(x => x !== null) ? result : null;
  }
  const equal = (a, b) => a !== null && Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(b));
  const format = n => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6))).replace('.', ',');
  const uuid = () => root.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  function blank(taskId, mode, familiar) {
    return { taskId, mode, phase: mode === 'solo' ? 3 : 0, step: 0, drafts: ['', '', '', ''],
      prediction: '', observations: [], probeX: 0, probeY: 0, zones: [false, false, false],
      endpoints: null, help: false, revealed: false, errors: 0, familiar: !!familiar,
      done: false, feedback: '', feedbackKind: 'info' };
  }
  function validState(s, ids) {
    return s && ids.has(s.taskId) && ['learn', 'solo'].includes(s.mode) &&
      Number.isInteger(s.phase) && s.phase >= 0 && s.phase <= 4 && Number.isInteger(s.step) && s.step >= 0 && s.step <= 4 &&
      Array.isArray(s.drafts) && s.drafts.length === 4 && s.drafts.every(x => typeof x === 'string' && x.length <= 160) &&
      typeof s.prediction === 'string' && s.prediction.length <= 80 &&
      Array.isArray(s.observations) && s.observations.length <= 12 && s.observations.every(x => typeof x === 'string' && x.length <= 80) &&
      [s.probeX, s.probeY].every(x => Number.isFinite(x) && Math.abs(x) <= 50) &&
      Array.isArray(s.zones) && s.zones.length === 3 && s.zones.every(x => typeof x === 'boolean') &&
      [true, false, null].includes(s.endpoints) && ['help', 'revealed', 'familiar', 'done'].every(k => typeof s[k] === 'boolean') &&
      Number.isInteger(s.errors) && s.errors >= 0 && s.errors <= 100000 &&
      typeof s.feedback === 'string' && s.feedback.length <= 1000 && ['info', 'ok', 'error'].includes(s.feedbackKind);
  }
  class Journal {
    constructor(course, ids, storage, options = {}) {
      this.course = course; this.ids = new Set(ids); this.storage = storage; this.events = new Map();
      this.prefix = PREFIX + course + '.'; this.limit = options.limit || 3000;
      this.makeId = options.makeId || uuid; this.clock = 0; this.issue = ''; this.corrupt = false; this.readFailed = false;
      this.read();
    }
    read() {
      if (!this.storage) { this.readFailed = true; this.issue = 'Хранилище недоступно. Работа останется в этом окне; новый самостоятельный результат пока не подтверждён.'; return; }
      try {
        const names = [];
        for (let i = 0; i < this.storage.length; i++) { const key = this.storage.key(i); if (key?.startsWith(this.prefix)) names.push(key); }
        if (names.length > this.limit) { this.corrupt = true; throw Error('limit'); }
        for (const key of names) {
          const text = this.storage.getItem(key);
          if (!text || text.length > 12000) { this.corrupt = true; continue; }
          let event; try { event = JSON.parse(text); } catch (_) { this.corrupt = true; continue; }
          if (!event || event.version !== 1 || event.course !== this.course || !/^[a-zA-Z0-9.-]{1,120}$/.test(event.id) ||
              key !== this.prefix + event.id || !/^[a-zA-Z0-9.-]{1,180}$/.test(event.attempt) ||
              !(event.parent === null || typeof event.parent === 'string' && /^[a-zA-Z0-9.-]{1,120}$/.test(event.parent)) ||
              !['snapshot', 'conflict'].includes(event.kind) || !Number.isSafeInteger(event.clock) || event.clock < 1 ||
              !validState(event.state, this.ids)) { this.corrupt = true; continue; }
          const previous = this.events.get(event.id);
          if (previous && JSON.stringify(previous.data) !== JSON.stringify(event)) { this.corrupt = true; continue; }
          this.events.set(event.id, { data: event, saved: true }); this.clock = Math.max(this.clock, event.clock);
        }
        this.readFailed = false;
        if (this.corrupt) this.issue = 'Найдена неподдерживаемая запись. Она сохранена без замены. Работа в этом окне доступна; подтверждение результата приостановлено.';
        else if ([...this.events.values()].every(e => e.saved)) this.issue = '';
      } catch (_) { this.readFailed = true; this.issue = 'Не удалось прочитать сохранение. Прежние записи не заменяются. Оставьте окно открытым и попробуйте сохранить ещё раз.'; }
    }
    ordered() { return [...this.events.values()].sort((a, b) => a.data.clock - b.data.clock || a.data.id.localeCompare(b.data.id)); }
    attempts() {
      const grouped = new Map(), all = [];
      for (const event of this.ordered()) { const list = grouped.get(event.data.attempt) || []; list.push(event); grouped.set(event.data.attempt, list); }
      for (const [id, events] of grouped) {
        const snapshots = events.filter(e => e.data.kind === 'snapshot'), last = snapshots.at(-1);
        if (!last) continue;
        const a = { id, state: clone(last.data.state), latest: last.data.id, clock: last.data.clock, saved: true, conflict: false, archives: [] };
        const byId = new Map(snapshots.map(e => [e.data.id, e.data])), children = new Map(), onCurrentBranch = new Set();
        let cursor = last.data;
        while (cursor && !onCurrentBranch.has(cursor.id)) { onCurrentBranch.add(cursor.id); cursor = byId.get(cursor.parent); }
        for (const event of snapshots) {
          const e = event.data, siblings = children.get(e.parent) || []; siblings.push(e); children.set(e.parent, siblings);
          if (e.parent !== null && (!byId.has(e.parent) || byId.get(e.parent).clock >= e.clock)) a.conflict = true;
        }
        // Two writers can both read the same parent before either append becomes
        // visible. A causal fork is a conflict even when the clocks are equal.
        if ([...children.values()].some(items => items.length > 1)) a.conflict = true;
        for (const event of events) {
          const e = event.data;
          if (e.kind === 'conflict') { a.conflict = true; a.archives.push({ id: e.id, state: clone(e.state) }); }
          else if (!onCurrentBranch.has(e.id) && !children.has(e.id)) a.archives.push({ id: e.id, state: clone(e.state) });
          a.state.help ||= e.state.help; a.state.revealed ||= e.state.revealed;
          a.state.errors = Math.max(a.state.errors, e.state.errors); a.state.familiar ||= e.state.familiar;
          a.saved &&= event.saved;
        }
        all.push(a);
      }
      return all.sort((a, b) => a.clock - b.clock || a.id.localeCompare(b.id));
    }
    get(id) { return this.attempts().find(a => a.id === id); }
    seen(taskId) { return this.attempts().some(a => a.state.taskId === taskId); }
    append(attempt, state, kind, parent = null) {
      const event = { version: 1, course: this.course, id: this.makeId(), attempt, parent, clock: ++this.clock, kind, state: clone(state) };
      if (!validState(state, this.ids)) throw Error('Invalid H35 state');
      this.events.set(event.id, { data: event, saved: false });
      this.flush(); return this.get(attempt);
    }
    begin(taskId, mode) {
      this.read();
      const familiar = this.seen(taskId), id = familiar ? taskId + '.' + this.makeId() : taskId + '.first';
      return this.append(id, blank(taskId, mode, familiar), 'snapshot');
    }
    update(id, next, expected) {
      this.read(); const current = this.get(id);
      if (!current) throw Error('Missing attempt');
      // A stale answer must never complete a different step. Keep the proposed
      // draft as a separate immutable event instead of overwriting newer work.
      const stale = current.latest !== expected;
      return { attempt: this.append(id, next, stale ? 'conflict' : 'snapshot', expected), stale };
    }
    flush() {
      if (!this.storage || this.corrupt) return false;
      try {
        const pending = [...this.events.values()].filter(e => !e.saved);
        if (this.events.size > this.limit) throw Error('limit');
        for (const event of pending) {
          const key = this.prefix + event.data.id, text = JSON.stringify(event.data), existing = this.storage.getItem(key);
          if (existing !== null && existing !== text) { this.corrupt = true; throw Error('collision'); }
          this.storage.setItem(key, text); event.saved = this.storage.getItem(key) === text;
          if (!event.saved) throw Error('write');
        }
        if (!this.readFailed) this.issue = ''; return !this.readFailed;
      } catch (_) {
        this.issue = this.events.size > this.limit ? 'Журнал достиг безопасного предела. Прежняя работа сохранена; новые действия остаются в этом окне без подтверждения самостоятельности.' :
          'Не удалось сохранить новые действия. Они остаются в этом окне. Не закрывайте его; кнопка «Повторить сохранение» попробует ещё раз.';
        return false;
      }
    }
    outcome(a) {
      if (!a.state.done) return 'unfinished';
      // A failed write in another attempt must not hide an already durable
      // result. Failed reads or unsupported records still block confirmation.
      if (!a.saved || this.readFailed || this.corrupt) return 'pending';
      if (a.state.help || a.state.revealed || a.state.mode === 'learn') return 'assisted';
      if (a.conflict) return 'conflict';
      if (a.state.errors) return 'corrected';
      if (a.state.familiar) return 'repeat';
      return 'independent';
    }
    stats() {
      const out = { independent: 0, assisted: 0, corrected: 0, repeat: 0, conflict: 0, pending: 0, unfinished: 0 }, independent = new Set();
      for (const a of this.attempts()) { const kind = this.outcome(a); if (kind === 'independent') independent.add(a.state.taskId); else out[kind]++; }
      out.independent = independent.size; return out;
    }
    legacy() {
      try {
        const data = JSON.parse(this.storage?.getItem(LEGACY) || '{}');
        return clone(this.course === 'systems' ? data?.topics?.linearSystemsTrainer ?? null : data?.quadraticInequalitiesLab ?? null);
      } catch (_) { return null; }
    }
  }
  const api = { PREFIX, LEGACY, Journal, blank, validState, number, pair, equal, format, clone };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.H35Core = api;
})(typeof globalThis === 'object' ? globalThis : this);
