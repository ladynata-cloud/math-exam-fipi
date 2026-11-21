'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { RoomStore } = require('../room-store');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-room-store-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function room() {
  return { roomId: 'room001ABCDE', teacherToken: 't'.repeat(24), studentToken: 's'.repeat(24),
    participants: [{ id: 'teacher001', role: 'teacher', connected: true, onlineCount: 2 },
      { id: 'student001', role: 'student', connected: true, onlineCount: 1 }],
    control: 'teacher001', controlVersion: 0, stateVersion: 0, currentPage: 0,
    pages: [{ id: 'page001', pageEpoch: 0, strokes: [] }], inkReceipts: {},
    redoStacks: {}, trainerUrl: 'negative-numbers-line.html', createdAt: '2026-11-19T00:00:00.000Z' };
}

test('unconfigured store explicitly reports memory-only compatibility', () => {
  const store = new RoomStore({ directory: '' });
  assert.deepEqual(store.capability(), { version: 1, durable: false });
  assert.equal(store.reason, 'ROOM_DURABILITY_UNAVAILABLE');
  store.save(room());
  assert.equal(store.rooms.size, 0);
});

test('private atomic snapshot restores tokens/receipts but never live socket presence', t => {
  const directory = fixture(t), store = new RoomStore({ directory });
  t.after(() => store.close());
  const original = room();
  original.inkReceipts['teacher001:operation001'] = { fingerprint: 'a'.repeat(64), pageId: 'page001', pageEpoch: 0,
    stroke: { objectId: 'object001', kind: 'path', points: [{ x: 3, y: 5 }] } };
  store.save(original);
  assert.equal(fs.statSync(path.join(directory, 'room001ABCDE.json')).mode & 0o777, 0o600);
  assert.equal(original.participants[0].onlineCount, 2, 'serializing does not mutate active presence');
  store.close();
  const reopened = new RoomStore({ directory });
  t.after(() => reopened.close());
  assert.equal(reopened.available, true);
  const restored = reopened.rooms.get(original.roomId);
  assert.equal(restored.teacherToken, original.teacherToken);
  assert.deepEqual(restored.inkReceipts, original.inkReceipts);
  assert.deepEqual(restored.participants.map(p => [p.connected, p.onlineCount]), [[false, 0], [false, 0]]);
});

test('failed pre-rename persistence keeps prior confirmed snapshot and fails closed', t => {
  const directory = fixture(t);
  let fail = false;
  const io = { ...fs, renameSync(...args) { if (fail) throw Error('synthetic disk error'); return fs.renameSync(...args); } };
  const store = new RoomStore({ directory, io });
  t.after(() => store.close());
  const original = room(); store.save(original);
  const confirmed = fs.readFileSync(path.join(directory, original.roomId + '.json'), 'utf8');
  fail = true;
  const changed = structuredClone(original); changed.stateVersion = 1; changed.pages[0].strokes.push({ objectId: 'later-stroke' });
  assert.throws(() => store.save(changed), { code: 'ROOM_STORAGE_WRITE_FAILED' });
  assert.deepEqual(store.capability(), { version: 1, durable: false });
  assert.equal(fs.readFileSync(path.join(directory, original.roomId + '.json'), 'utf8'), confirmed);
  fail = false;
  assert.throws(() => store.save(changed), { code: 'ROOM_STORAGE_WRITE_FAILED' }, 'must restart and reconcile uncertain writes');
  store.close();
  const reopened = new RoomStore({ directory }); t.after(() => reopened.close());
  assert.equal(reopened.rooms.get(original.roomId).stateVersion, 0);
});

test('directory sync failure never reports durable success; restart retains a complete snapshot', t => {
  const directory = fixture(t);
  let fail = false;
  const io = { ...fs, fsyncSync(fd) {
    if (fail && fs.fstatSync(fd).isDirectory()) throw Error('synthetic directory sync failure');
    return fs.fsyncSync(fd);
  } };
  const store = new RoomStore({ directory, io }); t.after(() => store.close());
  const original = room(); store.save(original); fail = true;
  const changed = structuredClone(original); changed.stateVersion = 1;
  assert.throws(() => store.save(changed), { code: 'ROOM_STORAGE_WRITE_FAILED' });
  assert.equal(store.capability().durable, false);
  store.close();
  const reopened = new RoomStore({ directory }); t.after(() => reopened.close());
  assert.equal(reopened.available, true);
  assert.equal(reopened.rooms.get(original.roomId).stateVersion, 1);
});

test('single writer lock refuses second process owner without deleting first lock', t => {
  const directory = fixture(t), first = new RoomStore({ directory });
  t.after(() => first.close());
  const second = new RoomStore({ directory }); t.after(() => second.close());
  assert.equal(first.available, true); assert.equal(second.available, false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, '.room-store.lock'))).id, first.lock.id);
  first.save(room());
});

test('stale lock reclamation serializes contenders before unlinking or replacing the owner', t => {
  const directory = fixture(t);
  const lockPath = path.join(directory, '.room-store.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 99999999, id: 'stale' }));
  let competitor;
  const io = { ...fs, unlinkSync(file) {
    if (file === lockPath && !competitor) competitor = new RoomStore({ directory });
    return fs.unlinkSync(file);
  } };
  const owner = new RoomStore({ directory, io }); t.after(() => owner.close());
  assert.equal(owner.available, true);
  assert.equal(competitor.available, false, 'contender cannot race the stale owner check');
  assert.equal(JSON.parse(fs.readFileSync(lockPath)).id, owner.lock.id);
});

test('orphan acquisition guard fails closed without removing unknown ownership evidence', t => {
  const directory = fixture(t), guard = path.join(directory, '.room-store.claim');
  fs.mkdirSync(guard);
  const store = new RoomStore({ directory }); t.after(() => store.close());
  assert.equal(store.available, false); assert.equal(fs.existsSync(guard), true);
});

test('malformed receipts and ambiguous pages are rejected on load instead of crashing an ink retry', t => {
  const invalid = [
    value => { value.inkReceipts = { 'teacher001:operation001': null }; },
    value => { value.inkReceipts = { 'teacher001:operation001': { fingerprint: 'a'.repeat(64), pageId: 'page001', pageEpoch: 0 } }; },
    value => { value.pages[0].strokes = [null]; },
    value => { value.pages.push(structuredClone(value.pages[0])); }
  ];
  for (const mutate of invalid) {
    const directory = fixture(t), value = room(); mutate(value);
    const serialized = JSON.stringify({ schemaVersion: 1, room: value });
    const file = path.join(directory, value.roomId + '.json'); fs.writeFileSync(file, serialized);
    const store = new RoomStore({ directory }); t.after(() => store.close());
    assert.equal(store.available, false); assert.equal(store.rooms.size, 0);
    assert.equal(fs.readFileSync(file, 'utf8'), serialized);
  }
});

test('corrupt persisted room fails closed and is preserved byte for byte', t => {
  const directory = fixture(t), file = path.join(directory, 'room001ABCDE.json');
  fs.writeFileSync(file, '{invalid data\n');
  const store = new RoomStore({ directory }); t.after(() => store.close());
  assert.equal(store.available, false); assert.equal(store.rooms.size, 0);
  assert.throws(() => store.save(room()), { code: 'ROOM_STORAGE_UNAVAILABLE' });
  assert.equal(fs.readFileSync(file, 'utf8'), '{invalid data\n');
});

test('room bounds reject a new write without disabling existing readable data', t => {
  const directory = fixture(t), store = new RoomStore({ directory, limits: { rooms: 1 } });
  t.after(() => store.close());
  store.save(room()); const second = room(); second.roomId = 'room002ABCDE';
  assert.throws(() => store.save(second), { code: 'ROOM_STORAGE_LIMIT' });
  assert.equal(store.available, true);
  assert.equal(fs.existsSync(path.join(directory, second.roomId + '.json')), false);
});

test('durably expired rooms do not reappear after restart', t => {
  const directory = fixture(t), store = new RoomStore({ directory }); t.after(() => store.close());
  store.save(room()); store.remove(room().roomId); store.close();
  const reopened = new RoomStore({ directory }); t.after(() => reopened.close());
  assert.equal(reopened.available, true); assert.equal(reopened.rooms.size, 0);
});
