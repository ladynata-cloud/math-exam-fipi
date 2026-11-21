'use strict';

// Independent wire-level acceptance: only synthetic rooms in private temporary
// directories. Exercise the actual Socket.IO process, including crash/restart.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const test = require('node:test');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const { io } = createRequire(path.join(ROOT, 'board-server/package.json'))('socket.io-client');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

function event(socket, name, predicate = () => true, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, received);
      reject(new Error('Missing Socket.IO event: ' + name));
    }, timeout);
    function received(data) {
      if (!predicate(data)) return;
      clearTimeout(timer);
      socket.off(name, received);
      resolve(data);
    }
    socket.on(name, received);
  });
}

async function fixture(t, { durable = true } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-ink-delivery-'));
  const storeDirectory = path.join(directory, 'rooms');
  const sockets = new Set();
  let child = null;
  let baseUrl;
  const output = [];
  async function stop(signal = 'SIGTERM') {
    for (const socket of sockets) socket.disconnect();
    sockets.clear();
    if (!child || child.exitCode !== null || child.signalCode) return;
    const stopped = new Promise(resolve => child.once('exit', resolve));
    child.kill(signal);
    await Promise.race([stopped, pause(3000).then(() => {
      if (child.exitCode === null && !child.signalCode) child.kill('SIGKILL');
    })]);
    await stopped;
  }
  async function start() {
    const port = await freePort();
    baseUrl = 'http://127.0.0.1:' + port;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port),
      BOARD_ROOM_STORE_DIR: durable ? storeDirectory : '',
      LEARNING_DB_PATH: '', GROUP_LESSON_STORE_DIR: '',
      PROGRESS_STORE_PATH: '', PROGRESS_PERSISTENCE_CONFIRMED: '',
      LEARNING_BOOTSTRAP_LOGIN: '', LEARNING_BOOTSTRAP_NAME: '',
      ROOM_TTL_MS: String(24 * 60 * 60 * 1000) };
    child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env,
      stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', bytes => output.push(bytes.toString()));
    child.stderr.on('data', bytes => output.push(bytes.toString()));
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error('Server exited before health: ' + output.join('').slice(-2000));
      try { if ((await fetch(baseUrl + '/health')).ok) return; } catch (_) {}
      await pause(40);
    }
    throw new Error('Server startup timeout: ' + output.join('').slice(-2000));
  }
  async function createRoom() {
    const response = await fetch(baseUrl + '/api/rooms', { method: 'POST' });
    assert.equal(response.status, 201);
    return response.json();
  }
  async function connect(room, role = 'teacher', expectRejection = false) {
    const socket = io(baseUrl, { autoConnect: false, reconnection: false, forceNew: true,
      transports: ['websocket'] });
    sockets.add(socket);
    const connected = event(socket, 'connect');
    socket.connect();
    await connected;
    const joined = event(socket, expectRejection ? 'room:error' : 'room:state');
    const auth = { roomId: room.roomId, role, token: room[role + 'Token'] };
    socket.emit('room:join', { ...auth, proto: 2 });
    return { socket, auth, joined: await joined };
  }
  t.after(async () => { await stop(); fs.rmSync(directory, { recursive: true, force: true }); });
  await start();
  return { createRoom, connect, stop, start, storeDirectory };
}

async function snapshot(participant) {
  const received = event(participant.socket, 'room:state');
  participant.socket.emit('room:state');
  return (await received).state;
}

function ink(participant, state, extra = {}) {
  const id = crypto.randomUUID();
  return { ...participant.auth, opId: id, pageId: state.pages[state.currentPage].id,
    pageEpoch: state.pages[state.currentPage].pageEpoch || 0,
    controlVersion: state.controlVersion, eventName: 'board:stroke-end',
    stroke: { objectId: crypto.randomUUID(), kind: 'path', tool: 'pen', size: 3,
      color: '#172033', points: [{ x: 21, y: 34 }, { x: 55, y: 89 }] }, ...extra };
}

function commit(participant, payload) {
  return new Promise((resolve, reject) => {
    participant.socket.timeout(5000).emit('board:ink-commit', payload, (error, ack) => {
      if (error) reject(error); else resolve(ack);
    });
  });
}

function confirmed(ack, payload) {
  assert.equal(ack?.ok, true);
  assert.equal(ack.durable, true);
  assert.equal(ack.opId, payload.opId);
  assert.equal(ack.roomId, payload.roomId);
  assert.equal(ack.pageId, payload.pageId);
  assert.equal(ack.pageEpoch, payload.pageEpoch);
}

function refused(ack, payload) {
  assert.equal(ack?.ok, false);
  assert.equal(ack.opId, payload.opId);
  assert.equal(ack.retryable, false);
}

test('lost acknowledgement then process crash: restored room and exact retry contain one stroke', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  let teacher = await f.connect(room);
  const viewer = await f.connect(room, 'student');
  const before = await snapshot(teacher);
  assert.deepEqual(before.inkDelivery, { version: 1, durable: true });
  const payload = ink(teacher, before);
  const echoed = event(viewer.socket, 'board:stroke-end');
  // No ACK callback represents the sender losing confirmation after delivery.
  teacher.socket.emit('board:ink-commit', payload);
  await echoed;
  await f.stop('SIGKILL');
  await f.start();
  teacher = await f.connect(room);
  let state = await snapshot(teacher);
  assert.equal(state.pages[0].strokes.length, 1);
  assert.equal(state.pages[0].strokes[0].objectId, payload.stroke.objectId);
  assert.equal(teacher.joined.you.participantId, before.control, 'stable author survives restart');
  confirmed(await commit(teacher, payload), payload);
  confirmed(await commit(teacher, payload), payload);
  state = await snapshot(teacher);
  assert.equal(state.pages[0].strokes.length, 1);
  assert.equal(state.participants.find(p => p.role === 'student').onlineCount, 0,
    'presence is reconstructed, not restored as an online socket');
  const publicJson = JSON.stringify(state);
  assert.ok(!publicJson.includes(room.teacherToken));
  assert.ok(!publicJson.includes(room.studentToken));
});

test('restart gives an old recovered room time to reconnect instead of expiring its last saved work immediately', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const payload = ink(teacher, await snapshot(teacher));
  confirmed(await commit(teacher, payload), payload);
  await f.stop('SIGKILL');
  const filename = path.join(f.storeDirectory, room.roomId + '.json');
  const persisted = JSON.parse(fs.readFileSync(filename, 'utf8'));
  // Model a room used only for reading for longer than TTL before a crash.
  persisted.room.lastActivityAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  fs.writeFileSync(filename, JSON.stringify(persisted));
  await f.start();
  const returned = await f.connect(room);
  assert.equal((await snapshot(returned)).pages[0].strokes[0].objectId, payload.stroke.objectId);
  confirmed(await commit(returned, payload), payload);
});

test('unreadable durable room storage does not report that an existing room or its credentials are gone', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  await f.stop();
  fs.writeFileSync(path.join(f.storeDirectory, room.roomId + '.json'), '{corrupted synthetic snapshot');
  await f.start();
  const denied = await f.connect(room, 'teacher', true);
  assert.ok(denied.joined.message);
  assert.ok(!['Комната не найдена', 'Нет доступа к комнате', 'Нет участника комнаты'].includes(denied.joined.message),
    'a storage outage must not trigger the browser terminal-room credential cleanup');
  assert.equal(fs.readFileSync(path.join(f.storeDirectory, room.roomId + '.json'), 'utf8'), '{corrupted synthetic snapshot');
});

test('duplicate is acknowledged after control transfer; fresh stale action and altered duplicate are rejected', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const student = await f.connect(room, 'student');
  const changed = event(student.socket, 'control:changed');
  teacher.socket.emit('control:grant', teacher.auth);
  await changed;
  const state = await snapshot(student);
  const payload = ink(student, state);
  confirmed(await commit(student, payload), payload);
  const revoked = event(student.socket, 'control:changed');
  teacher.socket.emit('control:revoke', teacher.auth);
  await revoked;
  confirmed(await commit(student, payload), payload);
  const late = ink(student, state);
  refused(await commit(student, late), late);
  const altered = structuredClone(payload);
  altered.stroke.points[0].x += 100;
  refused(await commit(student, altered), altered);
  assert.equal((await snapshot(teacher)).pages[0].strokes.length, 1);
});

test('stable page identity survives insertion, but deleted page is never substituted by its old index', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const first = await snapshot(teacher);
  const payload = ink(teacher, first);
  teacher.socket.emit('board:page-add', { ...teacher.auth, pageIndex: 0,
    page: { id: 'inserted-page-0001', bg: 'grid' } });
  let state = await snapshot(teacher);
  assert.equal(state.pages[1].id, payload.pageId);
  confirmed(await commit(teacher, payload), payload);
  state = await snapshot(teacher);
  assert.equal(state.pages[0].strokes.length, 0);
  assert.equal(state.pages[1].strokes.length, 1);
  teacher.socket.emit('board:page-delete', { ...teacher.auth, pageIndex: 1 });
  await snapshot(teacher);
  confirmed(await commit(teacher, payload), payload);
  const unknown = ink(teacher, first);
  refused(await commit(teacher, unknown), unknown);
  state = await snapshot(teacher);
  assert.equal(state.pages.length, 1);
  assert.equal(state.pages[0].strokes.length, 0);
});

test('duplicate page identities are rejected before they can redirect a queued stroke', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const original = await snapshot(teacher);
  teacher.socket.emit('board:page-add', { ...teacher.auth, pageIndex: 0,
    page: { id: original.pages[0].id, bg: 'lined' } });
  let state = await snapshot(teacher);
  assert.equal(state.pages.length, 1, 'a new page cannot reuse an existing stable ID');
  assert.deepEqual(state.pages, original.pages);
  const freshRoom = await f.createRoom();
  const freshTeacher = await f.connect(freshRoom);
  const freshState = await snapshot(freshTeacher);
  freshTeacher.socket.emit('board:snapshot', { ...freshTeacher.auth, state: {
    currentPage: 0, trainerUrl: freshState.trainerUrl,
    pages: [{ id: 'duplicate-page-0001', bg: 'grid', strokes: [] },
      { id: 'duplicate-page-0001', bg: 'lined', strokes: [] }] } });
  state = await snapshot(freshTeacher);
  assert.deepEqual(state.pages, freshState.pages, 'initial seed with duplicate IDs is rejected atomically');
});

test('clear and undo fence old unknown operations while accepted retries never resurrect removed ink', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const original = await snapshot(teacher);
  const accepted = ink(teacher, original);
  const unreceived = ink(teacher, original);
  confirmed(await commit(teacher, accepted), accepted);
  teacher.socket.emit('board:clear-page', { ...teacher.auth, pageIndex: 0 });
  let state = await snapshot(teacher);
  assert.ok(state.pages[0].pageEpoch > (original.pages[0].pageEpoch || 0));
  confirmed(await commit(teacher, accepted), accepted);
  refused(await commit(teacher, unreceived), unreceived);
  assert.equal((await snapshot(teacher)).pages[0].strokes.length, 0);
  const next = ink(teacher, state);
  confirmed(await commit(teacher, next), next);
  teacher.socket.emit('board:stroke-undo', { ...teacher.auth, pageIndex: 0 });
  state = await snapshot(teacher);
  confirmed(await commit(teacher, next), next);
  assert.equal((await snapshot(teacher)).pages[0].strokes.length, 0);
  await f.stop('SIGKILL');
  await f.start();
  const returned = await f.connect(room);
  confirmed(await commit(returned, next), next);
  assert.equal((await snapshot(returned)).pages[0].strokes.length, 0,
    'tombstone and idempotency survive process loss together');
});

test('role, room and token spoofing never obtain a successful durable ACK or alter the board', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const other = await f.createRoom();
  const teacher = await f.connect(room);
  const state = await snapshot(teacher);
  const variants = [{ role: 'student' }, { token: 'invalid-token-000000' },
    { roomId: other.roomId, token: other.teacherToken }];
  for (const extra of variants) {
    const payload = ink(teacher, state, extra);
    refused(await commit(teacher, payload), payload);
  }
  assert.equal((await snapshot(teacher)).pages[0].strokes.length, 0);
});

test('disk write failure gives no saved ACK and does not mutate the last confirmed room', async t => {
  const f = await fixture(t);
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const before = await snapshot(teacher);
  const accepted = ink(teacher, before);
  confirmed(await commit(teacher, accepted), accepted);
  const state = await snapshot(teacher);
  fs.renameSync(f.storeDirectory, f.storeDirectory + '-offline');
  fs.writeFileSync(f.storeDirectory, 'synthetic storage outage');
  const pending = ink(teacher, state);
  const ack = await commit(teacher, pending);
  assert.equal(ack?.ok, false);
  assert.equal(ack.opId, pending.opId);
  assert.equal(ack.retryable, true);
  const after = await snapshot(teacher);
  assert.deepEqual(after.pages, state.pages, 'failed persistence must not leak a RAM-only accepted action');
});

test('unconfigured legacy server does not advertise durable storage or confirm durable ink', async t => {
  const f = await fixture(t, { durable: false });
  const room = await f.createRoom();
  const teacher = await f.connect(room);
  const state = await snapshot(teacher);
  assert.notEqual(state.inkDelivery?.durable, true);
  const payload = ink(teacher, state);
  assert.notEqual((await commit(teacher, payload))?.ok, true);
  assert.equal((await snapshot(teacher)).pages[0].strokes.length, 0);
});

const { Outbox } = require('../trainers/board-delivery.js');
function memoryStorage() {
  const values = new Map();
  return { failWrite: false, failRemove: false, values,
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { if (this.failWrite) throw new Error('quota'); values.set(key, value); },
    removeItem(key) { if (this.failRemove) throw new Error('storage disabled'); values.delete(key); } };
}
function queued(storage, overrides = {}) {
  return new Outbox({ storage, scope: { server: 'https://board.example.test', roomId: 'room-0001',
    participantId: 'author-0001', ...overrides }, id: () => crypto.randomUUID() });
}
function entry() {
  return { pageId: 'page-0001', pageEpoch: 0, controlVersion: 4, eventName: 'board:stroke-end',
    stroke: { objectId: crypto.randomUUID(), kind: 'path', tool: 'pen', size: 3,
      points: [{ x: 7, y: 11 }, { x: 13, y: 17 }] } };
}
function acknowledgement(record) {
  return { ok: true, durable: true, roomId: record.scope.roomId, opId: record.opId,
    pageId: record.pageId, pageEpoch: record.pageEpoch };
}

test('outbox reload retains the exact immutable operation and isolates server, room and participant', () => {
  const storage = memoryStorage();
  const original = queued(storage);
  const supplied = entry();
  const record = original.enqueue(supplied);
  supplied.stroke.points[0].x = 9999;
  assert.equal(record.stroke.points[0].x, 7, 'caller mutation cannot alter queued identity');
  original.close();
  const reloaded = queued(storage);
  assert.deepEqual(reloaded.pending(), [record]);
  for (const other of [{ server: 'https://elsewhere.example.test' }, { roomId: 'room-0002' },
    { participantId: 'author-0002' }]) assert.equal(queued(storage, other).list().length, 0);
});

test('outbox rejects mismatched success ACKs and retains the operation until exact durable confirmation', () => {
  const storage = memoryStorage();
  const queue = queued(storage);
  const record = queue.enqueue(entry());
  for (const changed of [{ opId: 'unrelated-op' }, { roomId: 'room-0002' }, { pageId: 'page-0002' },
    { pageEpoch: 1 }, { durable: false }, { ok: false }]) {
    assert.equal(queue.accept(record, { ...acknowledgement(record), ...changed }), false);
    assert.equal(queue.pending().length, 1);
    assert.equal(storage.length, 1);
  }
  assert.equal(queue.accept(record, acknowledgement(record)), true);
  assert.equal(queue.list().length, 0);
  assert.equal(storage.length, 0);
});

test('two tabs keep separate operations and lost ACK replay cannot overwrite another tab queue', async () => {
  const storage = memoryStorage();
  const a = queued(storage), b = queued(storage);
  const first = a.enqueue(entry()), second = b.enqueue(entry());
  assert.equal(storage.length, 2);
  assert.notEqual(first.opId, second.opId);
  await a.flush(async () => { throw new Error('offline'); });
  assert.equal(storage.length, 2);
  await b.flush(async record => acknowledgement(record));
  assert.equal(storage.length, 1);
  assert.deepEqual(queued(storage).pending().map(record => record.opId), [first.opId]);
  await a.flush(async record => acknowledgement(record));
  assert.equal(storage.length, 0);
});

test('storage quota before send retains the in-memory work and blocks network until storage is repaired', async () => {
  const storage = memoryStorage(), queue = queued(storage);
  storage.failWrite = true;
  const record = queue.enqueue(entry());
  assert.equal(queue.blocked(), true);
  assert.equal(queue.pending().length, 1);
  assert.equal(queue.export().records[0].opId, record.opId);
  let sent = false;
  await queue.flush(async item => { sent = true; return acknowledgement(item); });
  assert.equal(sent, false);
  assert.equal(queue.enqueue(entry()), null, 'do not accumulate more memory-only work');
  storage.failWrite = false;
  assert.equal(queue.retryStorage(), true);
  assert.equal(queued(storage).pending()[0].opId, record.opId);
});

test('storage removal failure after ACK never loses the confirmed record and recovers without resending it', async () => {
  const storage = memoryStorage(), queue = queued(storage);
  const record = queue.enqueue(entry());
  storage.failRemove = true;
  assert.equal(queue.accept(record, acknowledgement(record)), true);
  assert.equal(queue.blocked(), true);
  assert.equal(queue.export().records[0].opId, record.opId);
  let sent = 0;
  await queue.flush(async item => { sent++; return acknowledgement(item); });
  assert.equal(sent, 0);
  storage.failRemove = false;
  assert.equal(queue.retryStorage(), true);
  assert.equal(queue.list().length, 0);
  assert.equal(storage.length, 0);
});

test('permanent rejection and damaged local data remain recoverable and never become an empty successful queue', () => {
  const storage = memoryStorage(), queue = queued(storage);
  const record = queue.enqueue(entry());
  queue.accept(record, { ok: false, opId: record.opId, error: 'PAGE_CHANGED', retryable: false });
  const restored = queued(storage);
  assert.equal(restored.rejected().length, 1);
  assert.equal(restored.export().records[0].stroke.points.length, 2);
  const damagedKey = queue.prefix + 'damaged-operation';
  storage.setItem(damagedKey, '{broken');
  const damaged = queued(storage);
  assert.equal(damaged.blocked(), true);
  assert.equal(damaged.retryStorage(), false);
  assert.equal(storage.getItem(damagedKey), '{broken');
  assert.ok(damaged.export().localRecords.some(item => item.key === damagedKey && item.value === '{broken'));
});

function deliveryUiFixture() {
  const storage = memoryStorage(), queue = queued(storage), elements = new Map();
  for (const id of ['inkSaveStatus', 'inkRetentionNote', 'downloadPendingInk', 'retryPendingInk', 'archiveRejectedInk']) elements.set(id, {
    textContent: '', className: '', hidden: false, dataset: {} });
  const context = vm.createContext({ document: { getElementById: id => elements.get(id) },
    shared: { server: queue.scope.server, roomId: queue.scope.roomId,
      me: { participantId: queue.scope.participantId }, connected: true, controlVersion: 4 },
    editor: { classList: { contains: () => true }, value: '' }, drawing: false,
    roomStateReceived: true, pendingHistory: null, providedQueue: queue,
    boardMessage() {}, scheduleRender() {}, clearTimeout() {}, setTimeout() { return 1; } });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'trainers/board-delivery-ui.js'), 'utf8'), context);
  vm.runInContext('inkOutbox = providedQueue; inkDeliveryCapability = true; inkSnapshotConfirmed = true;', context);
  return { queue, elements, context, run: code => vm.runInContext(code, context) };
}

test('UI says saved only after ACK, and unfinished, rejected, disconnected or storage-failed work prevents it', () => {
  const f = deliveryUiFixture(), output = f.elements.get('inkSaveStatus');
  f.run('updateInkDeliveryStatus()');
  assert.equal(output.dataset.delivery, 'saved');
  f.run('drawing = true; updateInkDeliveryStatus()');
  assert.notEqual(output.dataset.delivery, 'saved');
  f.run('drawing = false');
  const record = f.queue.enqueue(entry());
  f.run('updateInkDeliveryStatus()');
  assert.notEqual(output.dataset.delivery, 'saved');
  assert.equal(f.elements.get('downloadPendingInk').hidden, false);
  f.queue.accept(record, { ok: false, opId: record.opId, retryable: false, error: 'PAGE_CHANGED' });
  f.run('updateInkDeliveryStatus()');
  assert.equal(output.dataset.delivery, 'blocked');
  f.queue.records.clear();
  f.run('shared.connected = false; updateInkDeliveryStatus()');
  assert.notEqual(output.dataset.delivery, 'saved');
  f.run('shared.connected = true');
  f.queue.fault = 'storage';
  f.run('updateInkDeliveryStatus()');
  assert.equal(output.dataset.delivery, 'blocked');
});

test('UI restores pending ink above a snapshot exactly once and never overlays it on a cleared generation', () => {
  const f = deliveryUiFixture(), record = f.queue.enqueue(entry());
  f.context.sheet = { id: record.pageId, pageEpoch: 0, strokes: [] };
  assert.equal(f.run('strokesWithPendingInk(sheet).length'), 1);
  f.context.sheet.strokes.push(structuredClone(record.stroke));
  assert.equal(f.run('strokesWithPendingInk(sheet).length'), 1);
  f.context.sheet.strokes = [];
  f.context.sheet.pageEpoch = 1;
  assert.equal(f.run('strokesWithPendingInk(sheet).length'), 0);
  assert.equal(f.queue.export().records.length, 1, 'stale ink remains recoverable in local export');
  f.context.sheet.pageEpoch = 0;
  f.run('shared.me.participantId = "different-author"');
  assert.equal(f.run('strokesWithPendingInk(sheet).length'), 0);
  assert.equal(f.run('deliveryBlocksWriting()'), true);
});

test('UI cannot silently downgrade a durable room after repeated unavailable snapshots', () => {
  const f = deliveryUiFixture();
  f.run('activateInkDelivery({inkDelivery:{version:1,durable:false}})');
  assert.equal(f.run('deliveryBlocksWriting()'), true);
  f.run('activateInkDelivery({inkDelivery:{version:1,durable:false}})');
  assert.equal(f.run('deliveryBlocksWriting()'), true, 'a second outage response must remain blocked');
  f.run('activateInkDelivery({inkDelivery:{version:1,durable:true}})');
  assert.equal(f.run('deliveryBlocksWriting()'), false);
});

test('explicit rejected archive preserves exact local work across reload and permits continuing without deleting it', async () => {
  const storage = memoryStorage(), queue = queued(storage);
  const pending = queue.enqueue(entry()), rejected = queue.enqueue(entry());
  queue.accept(rejected, { ok: false, opId: rejected.opId, retryable: false, error: 'PAGE_CHANGED' });
  queue.archiveRejected();
  assert.equal(queue.rejected().length, 0);
  assert.deepEqual(queue.active().map(record => record.opId), [pending.opId]);
  const restored = queued(storage);
  const archived = restored.list().find(record => record.opId === rejected.opId);
  assert.equal(archived.status, 'archived');
  assert.deepEqual(archived.stroke, rejected.stroke);
  assert.equal(restored.export().records.length, 2);
  const sent = [];
  await restored.flush(async record => { sent.push(record.opId); return acknowledgement(record); });
  assert.deepEqual(sent, [pending.opId]);
  assert.equal(restored.active().length, 0);
  assert.equal(restored.list().length, 1);
  assert.equal(storage.length, 1, 'archive is retained even after all live operations are confirmed');
});

test('failed rejected archive retains rejection and storage fault instead of silently enabling history', () => {
  const storage = memoryStorage(), queue = queued(storage);
  const record = queue.enqueue(entry());
  queue.accept(record, { ok: false, opId: record.opId, retryable: false, error: 'PAGE_CHANGED' });
  storage.failWrite = true;
  queue.archiveRejected();
  assert.equal(queue.blocked(), true);
  assert.equal(queue.rejected()[0].opId, record.opId);
  assert.equal(queue.active().length, 1);
  assert.equal(queued(storage).rejected()[0].opId, record.opId);
  storage.failWrite = false;
  assert.equal(queue.retryStorage(), true);
  queue.archiveRejected();
  assert.equal(queue.blocked(), false);
  assert.equal(queue.active().length, 0);
  assert.equal(queue.export().records[0].opId, record.opId);
});

test('UI archive action releases history while leaving the local export available', () => {
  const f = deliveryUiFixture();
  const rejected = f.queue.enqueue(entry());
  f.queue.accept(rejected, { ok: false, opId: rejected.opId, retryable: false, error: 'PAGE_CHANGED' });
  assert.equal(f.run('deliveryAllowsHistory()'), false);
  f.queue.archiveRejected();
  f.run('updateInkDeliveryStatus()');
  assert.equal(f.run('deliveryAllowsHistory()'), true);
  assert.equal(f.elements.get('downloadPendingInk').hidden, false);
  assert.equal(f.elements.get('archiveRejectedInk').hidden, true);
  assert.notEqual(f.elements.get('inkSaveStatus').dataset.delivery, 'saved', 'local archive is never described as server-saved');
  assert.match(f.elements.get('inkSaveStatus').textContent, /локальн/);
  assert.equal(f.queue.export().records[0].status, 'archived');
});

test('replacement socket resumes an outstanding queue after the old connection ACK times out', async () => {
  const f = deliveryUiFixture(), record = f.queue.enqueue(entry()), timers = [];
  let oldCallback, deliveries = 0;
  f.context.roomPayload = extra => ({ roomId: f.queue.scope.roomId, ...extra });
  f.context.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
  f.context.shared.socket = { timeout() { return { emit(_name, _payload, callback) { oldCallback = callback; } }; } };
  const waiting = f.run('flushPendingInk()');
  assert.equal(f.queue.busy, true);
  assert.equal(typeof oldCallback, 'function');
  f.context.shared.socket = { emit() {}, timeout() { return { emit(name, payload, callback) {
    assert.equal(name, 'board:ink-commit');
    assert.equal(payload.opId, record.opId);
    deliveries++;
    callback(null, acknowledgement(record));
  } }; } };
  // A reconnect's room state arrives before the old transport reports timeout.
  f.run('activateInkDelivery({state:{inkDelivery:{version:1,durable:true}}})');
  assert.equal(deliveries, 0);
  oldCallback(new Error('old socket ACK timed out'));
  await waiting;
  assert.equal(f.queue.busy, false);
  assert.equal(timers.length, 1, 'the accepted replacement connection schedules a fresh delivery');
  assert.equal(timers[0].delay, 0);
  timers[0].callback();
  for (let i = 0; i < 6; i++) await Promise.resolve();
  assert.equal(deliveries, 1);
  assert.equal(f.queue.pending().length, 0);
});

test('actual room-state handler never describes an unconfirmed initial seed as saved', () => {
  const f = deliveryUiFixture(), seedStates = [];
  const html = fs.readFileSync(path.join(ROOT, 'trainers/trainer-board.html'), 'utf8');
  const match = html.match(/shared\.socket\.on\('room:state',payload=>\{([\s\S]*?)\n        \}\);/);
  assert.ok(match, 'exercise the real production room-state handler');
  const noops = ['clearPendingHistory', 'setControlState', 'setSharedMe', 'updateMirrorStatusForCurrentTrainer',
    'applySnapshot', 'reconcileTrainerMirror', 'recoverExpiredBridgeOnce', 'maybeHydrateTrainer',
    'scheduleLegacyTrainerRequest', 'fallbackSharedMe', 'setStatus', 'emitWriter'];
  for (const name of noops) f.context[name] = () => {};
  Object.assign(f.context, { roomStateReceived: false, latestTrainerState: null,
    pausedTrainerBridge: null, bridgeReloadNeeded: false, canWrite: () => true,
    takePreparedProfileTrainer: () => null,
    updateControlUi: () => f.run('updateInkDeliveryStatus()'),
    emitSnapshot: () => seedStates.push({ received: f.run('roomStateReceived'), confirmed: f.run('inkSnapshotConfirmed'),
      status: f.elements.get('inkSaveStatus').dataset.delivery }) });
  f.context.document.body = { classList: { remove() {} } };
  f.context.shared.role = 'teacher';
  f.context.shared.socket = { emit() {} };
  const receive = f.run('(payload) => {' + match[1] + '\n}');
  receive({ state: null, inkDelivery: { version: 1, durable: true } });
  assert.equal(seedStates.length, 1);
  assert.equal(seedStates[0].received, true, 'accepted membership keeps the existing trainer bridge contract');
  assert.equal(seedStates[0].confirmed, false, 'durable ink still awaits its first complete snapshot');
  assert.notEqual(seedStates[0].status, 'saved');
  assert.notEqual(f.elements.get('inkSaveStatus').dataset.delivery, 'saved');
  receive({ state: { inkDelivery: { version: 1, durable: true } } });
  assert.equal(f.run('roomStateReceived'), true);
  assert.equal(f.run('inkSnapshotConfirmed'), true);
  assert.equal(f.elements.get('inkSaveStatus').dataset.delivery, 'saved');
});

test('accepted room membership cannot flush pending ink until its full board snapshot is confirmed', async () => {
  const f = deliveryUiFixture(), record = f.queue.enqueue(entry());
  let deliveries = 0;
  f.context.roomPayload = extra => ({ roomId: f.queue.scope.roomId, ...extra });
  f.context.shared.socket = { emit() {}, timeout() { return { emit(name, payload, callback) {
    assert.equal(name, 'board:ink-commit');
    assert.equal(payload.opId, record.opId);
    deliveries++;
    callback(null, acknowledgement(record));
  } }; } };
  f.run('roomStateReceived = true; inkSnapshotConfirmed = false;');
  await f.run('flushPendingInk()');
  assert.equal(deliveries, 0, 'accepted membership alone does not permit durable retry');
  assert.equal(f.queue.pending().length, 1);
  f.run('inkSnapshotConfirmed = true;');
  await f.run('flushPendingInk()');
  assert.equal(deliveries, 1);
  assert.equal(f.queue.pending().length, 0);
});

test('actual writing permission blocks offline room reload before capability negotiation but keeps standalone writing', () => {
  const html = fs.readFileSync(path.join(ROOT, 'trainers/trainer-board.html'), 'utf8');
  const match = html.match(/function canWrite\(\)\{[^\n]+\}/);
  assert.ok(match, 'exercise the real production writing permission');
  const shared = { roomId: 'restored-room', connected: false, role: 'teacher', me: null, control: '' };
  let blocked = false;
  const context = vm.createContext({ shared, deliveryBlocksWriting: () => blocked });
  vm.runInContext(match[0], context);
  const allowed = () => vm.runInContext('canWrite()', context);
  assert.equal(allowed(), false, 'restored room cannot create local-only ink before Socket.IO loads');
  shared.connected = true;
  assert.equal(allowed(), false, 'connection still requires a joined writer identity');
  shared.me = { participantId: 'teacher' }; shared.control = 'teacher';
  assert.equal(allowed(), true);
  shared.control = 'student';
  assert.equal(allowed(), false, 'joined teacher obeys current writing control');
  shared.roomId = ''; shared.connected = false;
  assert.equal(allowed(), true, 'standalone teacher board remains writable');
  blocked = true;
  assert.equal(allowed(), false, 'unsaved previous scope still blocks replacement ink');
  blocked = false; shared.role = 'student';
  assert.equal(allowed(), false, 'disconnected student has no standalone write permission');
});
