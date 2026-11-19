'use strict';

// Private, single-process persistence for the public mirror board. This store is
// deliberately separate from group lessons, cabinet SQLite and progress files.
// A snapshot contains the room bearer tokens, so it must never be served/exported.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOM_ID = /^[A-Za-z0-9_-]{12}$/;
const OBJECT_ID = /^[A-Za-z0-9_-]{6,64}$/;
const LIMITS = Object.freeze({ rooms: 500, roomBytes: 16 * 1024 * 1024, totalBytes: 128 * 1024 * 1024 });
const clone = value => JSON.parse(JSON.stringify(value));
class RoomStoreError extends Error {
  constructor(code) { super(code); this.name = 'RoomStoreError'; this.code = code; }
}
function processIdentity(procPid = 'self') {
  const stat = fs.readFileSync(`/proc/${procPid}/stat`, 'utf8');
  const bootId = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  return { procPid: Number(stat.slice(0, stat.indexOf(' '))), bootId,
    identity: `${bootId}:${stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19]}` };
}
function storedRoom(room) {
  const result = clone(room);
  // These counters belong to live sockets, never to a restored server process.
  for (const participant of result.participants || []) {
    participant.connected = false;
    participant.onlineCount = 0;
  }
  return result;
}
function validRoom(room) {
  return room && ROOM_ID.test(room.roomId) && /^[A-Za-z0-9_-]{24}$/.test(room.teacherToken || '')
    && /^[A-Za-z0-9_-]{24}$/.test(room.studentToken || '')
    && Array.isArray(room.pages) && room.pages.length > 0
    && new Set(room.pages.map(page => page?.id)).size === room.pages.length
    && room.pages.every(page => page && OBJECT_ID.test(page.id || '') && Array.isArray(page.strokes)
      && page.strokes.every(stroke => stroke && typeof stroke === 'object' && !Array.isArray(stroke))
      && Number.isSafeInteger(page.pageEpoch ?? 0) && (page.pageEpoch ?? 0) >= 0)
    && Array.isArray(room.participants) && room.participants.length === 2
    && ['teacher', 'student'].every(role => room.participants.some(participant => participant.role === role
      && typeof participant.id === 'string'))
    && room.participants.some(participant => participant.id === room.control)
    && Number.isSafeInteger(room.stateVersion) && room.stateVersion >= 0
    && Number.isSafeInteger(room.controlVersion) && room.controlVersion >= 0
    && Number.isInteger(room.currentPage) && room.currentPage >= 0 && room.currentPage < room.pages.length
    && room.inkReceipts && typeof room.inkReceipts === 'object' && !Array.isArray(room.inkReceipts)
    && Object.keys(room.inkReceipts).length <= 10000
    && Object.entries(room.inkReceipts).every(([key, receipt]) => {
      const [actor, opId, extra] = key.split(':');
      return extra === undefined && room.participants.some(participant => participant.id === actor)
        && /^[A-Za-z0-9_-]{8,80}$/.test(opId || '') && receipt && typeof receipt === 'object'
        && /^[a-f0-9]{64}$/.test(receipt.fingerprint || '') && OBJECT_ID.test(receipt.pageId || '')
        && Number.isSafeInteger(receipt.pageEpoch) && receipt.pageEpoch >= 0
        && receipt.stroke && typeof receipt.stroke === 'object' && OBJECT_ID.test(receipt.stroke.objectId || '');
    });
}

class RoomStore {
  constructor({ directory = process.env.BOARD_ROOM_STORE_DIR, io = fs, limits = {} } = {}) {
    this.io = io; this.limits = { ...LIMITS, ...limits }; this.rooms = new Map(); this.sizes = new Map();
    this.configured = !!directory; this.available = false;
    this.reason = this.configured ? 'ROOM_STORAGE_UNAVAILABLE' : 'ROOM_DURABILITY_UNAVAILABLE';
    if (!this.configured) return;
    this.directory = path.resolve(directory);
    try {
      io.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
      if (!io.lstatSync(this.directory).isDirectory()) throw Error('Invalid directory');
      this.acquireLock();
      for (const name of io.readdirSync(this.directory)) {
        if (name.startsWith('.')) continue;
        if (!/^[A-Za-z0-9_-]{12}\.json$/.test(name)) throw Error('Invalid room file');
        const file = path.join(this.directory, name), stat = io.lstatSync(file);
        if (!stat.isFile() || stat.size > this.limits.roomBytes) throw Error('Invalid room file');
        const record = JSON.parse(io.readFileSync(file, 'utf8'));
        if (record.schemaVersion !== 1 || !validRoom(record.room) || `${record.room.roomId}.json` !== name) throw Error('Invalid room record');
        this.rooms.set(record.room.roomId, storedRoom(record.room));
        this.sizes.set(record.room.roomId, stat.size);
      }
      if (this.rooms.size > this.limits.rooms || this.totalBytes() > this.limits.totalBytes) throw Error('Room limit');
      this.available = true; this.reason = null;
    } catch (_) {
      this.rooms.clear(); this.close();
    }
  }
  acquireLock() {
    // Every contender serializes the read/reclaim/create sequence. Merely
    // checking a stale PID before unlinking is racy: a second reclaimer could
    // unlink the first contender's newly acquired lock.
    const guard = path.join(this.directory, '.room-store.claim');
    this.io.mkdirSync(guard, { mode: 0o700 });
    try { this.acquireGuardedLock(); }
    finally { this.io.rmdirSync(guard); }
    // If a process is killed within this narrow acquisition phase, the guard
    // is deliberately not reclaimed automatically: fail closed for operator
    // recovery instead of introducing another unsafe recursive lock recovery.
  }
  acquireGuardedLock() {
    const lockPath = path.join(this.directory, '.room-store.lock');
    let identity = {};
    try { identity = processIdentity(); } catch (_) {}
    try {
      const existing = JSON.parse(this.io.readFileSync(lockPath, 'utf8'));
      if (existing.procPid && existing.identity && identity.identity) {
        if (existing.bootId === identity.bootId) {
          try {
            if (processIdentity(existing.procPid).identity === existing.identity) throw Error('Room store already owned');
          } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
      } else {
        try { process.kill(existing.pid, 0); throw Error('Room store already owned'); }
        catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
      this.io.unlinkSync(lockPath);
    } catch (error) { if (error.code !== 'ENOENT' && this.io.existsSync(lockPath)) throw error; }
    const fd = this.io.openSync(lockPath, 'wx', 0o600);
    this.lock = { pid: process.pid, ...identity, id: crypto.randomUUID() };
    try { this.io.writeFileSync(fd, JSON.stringify(this.lock)); this.io.fsyncSync(fd); }
    finally { this.io.closeSync(fd); }
    this.lockPath = lockPath;
  }
  close() {
    if (!this.lockPath) return;
    try {
      const lock = JSON.parse(this.io.readFileSync(this.lockPath, 'utf8'));
      if (lock.id === this.lock?.id) this.io.unlinkSync(this.lockPath);
    } catch (_) {}
    this.lockPath = null;
  }
  totalBytes() { return [...this.sizes.values()].reduce((sum, bytes) => sum + bytes, 0); }
  capability() { return { version: 1, durable: this.configured && this.available }; }
  ready() { if (!this.available) throw new RoomStoreError(this.reason || 'ROOM_STORAGE_UNAVAILABLE'); }
  save(room) {
    if (!this.configured) return;
    this.ready();
    if (!validRoom(room)) throw new RoomStoreError('ROOM_PAYLOAD_INVALID');
    const data = JSON.stringify({ schemaVersion: 1, room: storedRoom(room) }) + '\n';
    const bytes = Buffer.byteLength(data), previous = this.sizes.get(room.roomId) || 0;
    if (bytes > this.limits.roomBytes || this.totalBytes() - previous + bytes > this.limits.totalBytes
      || (!this.sizes.has(room.roomId) && this.sizes.size >= this.limits.rooms)) {
      throw new RoomStoreError('ROOM_STORAGE_LIMIT');
    }
    const temporary = path.join(this.directory, `.${room.roomId}.${crypto.randomUUID()}.tmp`);
    const destination = path.join(this.directory, `${room.roomId}.json`);
    let fd;
    try {
      fd = this.io.openSync(temporary, 'wx', 0o600);
      this.io.writeFileSync(fd, data); this.io.fsyncSync(fd);
      this.io.closeSync(fd); fd = undefined;
      this.io.renameSync(temporary, destination);
      const dirFd = this.io.openSync(this.directory, 'r');
      try { this.io.fsyncSync(dirFd); } finally { this.io.closeSync(dirFd); }
      this.sizes.set(room.roomId, bytes);
    } catch (_) {
      if (fd !== undefined) { try { this.io.closeSync(fd); } catch (_) {} }
      try { this.io.unlinkSync(temporary); } catch (_) {}
      // A rename may have reached disk before a failed directory sync. No ACK
      // may be sent in that uncertain state; restart reads whichever full file
      // survived and idempotent receipts resolve the client's retry.
      this.available = false; this.reason = 'ROOM_STORAGE_WRITE_FAILED';
      throw new RoomStoreError(this.reason);
    }
  }
  remove(roomId) {
    if (!this.configured) return;
    this.ready();
    if (!ROOM_ID.test(roomId)) throw new RoomStoreError('ROOM_PAYLOAD_INVALID');
    try {
      this.io.unlinkSync(path.join(this.directory, `${roomId}.json`));
      const fd = this.io.openSync(this.directory, 'r');
      try { this.io.fsyncSync(fd); } finally { this.io.closeSync(fd); }
      this.sizes.delete(roomId);
    } catch (_) {
      this.available = false; this.reason = 'ROOM_STORAGE_WRITE_FAILED';
      throw new RoomStoreError(this.reason);
    }
  }
}

module.exports = { RoomStore, RoomStoreError, LIMITS };
