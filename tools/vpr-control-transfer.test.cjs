'use strict';

// Execute the committed host's transfer controls and message receiver. The
// native-browser acceptance separately covers two actual SDK/socket peers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const source = read('trainers/trainer-board.html');
const Data = require('../trainers/vpr-math/data.js');
const Core = require('../trainers/vpr-math/core.js');
const Plot = require('../trainers/vpr-math/plot.js');
const validate = require('../trainers/vpr-math/board.js').createValidator(Data, Core, Plot);
const ORIGIN = 'https://mathexam.space';
const FILE = 'trainers/vpr-math/index.html';
const clone = value => JSON.parse(JSON.stringify(value));
function part(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, 'Actual host section exists: ' + start);
  return source.slice(from, to);
}

function fixture(role = 'teacher') {
  const lesson = Data.lessons.find(item => item.id === 'g5-natural'), task = lesson.tasks[2];
  const selected = { version: 1, view: { view: 'lesson', route: 'g5', lesson: lesson.id, task: task.id, mode: 'learn' },
    attempt: { ...Core.blank(task, 'learn'), plotPoints: [] }, history: [], feedback: null,
    panels: { theory: false, notes: false, plot: false, mobileLessons: false } };
  assert.equal(validate(selected), true);
  const hash = '#' + new URLSearchParams(selected.view), requests = [], sent = [], notices = [];
  const listeners = new Set(), timers = new Map(), socketListeners = new Map(); let timerId = 0;
  const socket = { connected: true, emit: (name, value) => sent.push({ name, value: value === undefined ? undefined : clone(value) }),
    on(name, fn) { if (!socketListeners.has(name)) socketListeners.set(name, new Set()); socketListeners.get(name).add(fn); return socket; },
    off(name, fn) { socketListeners.get(name)?.delete(fn); return socket; } };
  const child = { location: new URL(ORIGIN + '/' + FILE + hash), VPRBoard: { getState: () => selected, validateState: validate },
    postMessage: (data, origin) => requests.push({ data: clone(data), origin }) };
  const entry = { trainerId: 'vpr-math', file: FILE, trainerVersion: '1.0.0', protocolVersion: 1, stateSchemaVersion: 1, allowLegacyHtml: false };
  const elements = Object.fromEntries(['boardControlStatus', 'boardControlToggle'].map(id => [id, {}]));
  const context = vm.createContext({ URL, URLSearchParams, TextEncoder, console,
    location: new URL(ORIGIN + '/trainers/trainer-board.html'),
    frame: { contentWindow: child, contentDocument: {}, inert: false, blur() {} }, frameLoaded: true, frameGeneration: 4,
    state: { trainerUrl: '/' + FILE + '?route=g5' }, roomStateReceived: true, latestTrainerState: null, vprControlTransfer: null,
    shared: { role, roomId: 'synthetic-room', token: role + '-synthetic-token', connected: true, roomError: '', control: role, controlVersion: 11,
      me: { participantId: role }, socket },
    trainerRegistry: { status: 'ready', byId: new Map([['vpr-math', entry]]), byFile: new Map([[FILE, entry]]) },
    bridgeSession: { trainerId: 'vpr-math', trainerVersion: '1.0.0', protocolVersion: 1, stateSchemaVersion: 1,
      bridgeInstanceId: 'actual-synthetic-bridge', generation: 4, source: child, origin: ORIGIN, canonicalFile: FILE, hydrated: true, timedOut: false },
    document: { activeElement: null, body: { classList: { toggle() {} } } },
    controlBadge: {}, controlToggle: {}, releaseControl: {},
    $: id => elements[id], buttons() {}, setMirrorStatus() {}, handleTrainerReady() {},
    boardMessage: value => notices.push(value),
    addEventListener: (name, fn) => { assert.equal(name, 'message'); listeners.add(fn); },
    removeEventListener: (name, fn) => { assert.equal(name, 'message'); listeners.delete(fn); },
    setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id)
  });
  context.controlHolder = () => ({ role: context.shared.control });
  context.controlLabel = () => context.shared.control === 'student' ? 'Ученик' : 'Учитель';
  vm.runInContext('window=globalThis', context);
  vm.runInContext(read('trainers/board-picker.js'), context);
  vm.runInContext(read('trainers/board-bridge.js'), context);
  context.normalizeTrainer = context.BoardPicker.normalize;
  vm.runInContext([
    part('const TRAINER_PATH_LIMITS=', 'const trainerRegistry='),
    part('function unsafePathText(', 'function validateTrainerRegistryResponse('),
    part('function mirrorEntryFromPayload(', 'function clearBridgeTimers('),
    part('function canWrite(){', 'function readonly(){'),
    part('function prepareProfileTrainerForRoom(', 'function takePreparedProfileTrainer('),
    part('function postTrainerMessage(', 'function plainTextFromHtml('),
    part('function bridgeStateFromPayload(', 'function requestTrainerState('),
    part('function flushVprControlState(', 'function scheduleLegacyTrainerRequest('),
    part('function bridgeMessageMatches(', 'function flushPendingTrainerState('),
    part('function updateControlUi(){', 'function genPageId('),
    part('function roomPayload(', 'function applySnapshot(').split('function publicSnapshot(')[0],
    part('function emitWriter(', 'function emitSnapshot('),
    part("addEventListener('message',event=>{", "$('openTrainer').onclick="),
    part('controlToggle.onclick=()=>{', 'bindBoardWriting();')
  ].join('\n'), context);
  context.updateControlUi();
  function respond(overrides = {}, eventOverrides = {}) {
    assert.ok(requests.length, 'The current SDK snapshot was requested');
    const response = { ...requests.at(-1).data, type: 'mathexam:trainer-state', state: selected, ...overrides };
    // A real postMessage crosses realms by structured cloning.
    const data = vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify(response)) + ')', context);
    const event = { data, source: child, origin: ORIGIN, ...eventOverrides };
    for (const listener of [...listeners]) listener(event);
  }
  function server(name, payload) {
    // The ordinary host listeners are registered before the temporary handoff
    // listeners, and update authoritative room/control fields first.
    if (name === 'control:changed' || name === 'room:state') {
      const state = payload.state || payload;
      if (state.control !== undefined) context.shared.control = state.control;
      if (state.controlVersion !== undefined) context.shared.controlVersion = state.controlVersion;
    } else if (name === 'disconnect') {
      context.shared.connected = false; socket.connected = false;
    } else if (name === 'room:error' && payload.message === 'Комната не найдена') {
      context.shared.roomError = payload.message; context.shared.connected = false; context.shared.roomId = '';
    }
    context.updateControlUi();
    for (const listener of [...(socketListeners.get(name) || [])]) listener(payload);
  }
  return { context, child, entry, selected, requests, sent, notices, elements, listeners, socketListeners, timers, respond, server,
    transfer: () => role === 'teacher' ? context.controlToggle.onclick() : context.releaseControl.onclick(),
    timeout() { const found = [...timers.entries()].find(([, item]) => item.ms === 2000); assert.ok(found); timers.delete(found[0]); found[1].fn(); } };
}

for (const role of ['teacher', 'student']) test(role + ': latest typed work leaves before voluntary control transfer', async () => {
  const f = fixture(role), { context: p } = f;
  f.selected.attempt.answers[0] = '123/'; f.selected.attempt.notes = 'Последняя запись до передачи';
  const expected = clone(f.selected), pending = f.transfer();
  assert.deepEqual(f.sent, [], 'Control cannot overtake the outstanding state request');
  assert.equal(p.frame.inert, true, 'Course input pauses while its snapshot is captured');
  assert.equal(p.controlToggle.disabled, true);
  assert.equal(p.releaseControl.disabled, true);
  assert.equal(f.requests[0].data.type, 'mathexam:request-trainer-state');
  f.respond(); await pending;
  assert.deepEqual(f.sent.map(item => item.name), ['board:trainer-state-change', role === 'teacher' ? 'control:grant' : 'control:release']);
  assert.deepEqual(f.sent[0].value.state, expected, 'Full current work is sent, including the final draft');
  assert.equal(p.frame.inert, true, 'Input stays locked after emission until the server acknowledges ownership');
  f.server('control:changed', { control: role === 'teacher' ? 'student' : 'teacher', controlVersion: 12 });
  assert.equal(p.vprControlTransfer, null, 'The temporary lock is released on authoritative acknowledgement');
  assert.equal(p.frame.inert, true, 'The former writer remains an observer under the acknowledged controller');
  assert.equal(f.listeners.size, 1, 'Only the ordinary host message listener remains');
  assert.equal(f.timers.size, 0);
});

test('a stale queued notification and foreign bridge messages cannot release the pending handoff', async () => {
  const f = fixture(), old = clone(f.selected);
  f.selected.attempt.notes = 'Latest draft'; const pending = f.transfer();
  f.respond({ state: old });
  f.respond({}, { origin: 'https://unrelated.example' });
  f.respond({}, { source: {} });
  f.respond({ bridgeInstanceId: 'previous-instance' });
  f.respond({ stateSchemaVersion: 2 });
  assert.equal(f.sent.some(item => item.name.startsWith('control:')), false);
  assert.equal(f.context.frame.inert, true);
  f.respond(); await pending;
  assert.deepEqual(f.sent.slice(-2).map(item => item.name), ['board:trainer-state-change', 'control:grant']);
  assert.equal(f.sent.at(-2).value.state.attempt.notes, 'Latest draft');
  f.server('control:changed', { control: 'student', controlVersion: 12 });
});

test('missing synchronization or invalid live work blocks transfer without clearing accepted work', async () => {
  const changes = [
    f => { f.context.trainerRegistry.status = 'pending'; },
    f => { f.context.trainerRegistry.byId.clear(); },
    f => { f.context.bridgeSession.hydrated = false; },
    f => { f.context.bridgeSession.timedOut = true; },
    f => { f.context.bridgeSession.generation--; },
    f => { f.context.bridgeSession.source = {}; },
    f => { f.context.bridgeSession.origin = 'https://unrelated.example'; },
    f => { f.entry.trainerVersion = '2.0.0'; },
    f => { f.context.roomStateReceived = false; },
    f => { f.context.shared.socket.connected = false; },
    f => { f.context.shared.roomError = 'not-found'; },
    f => { f.child.location.hash = '#view=home'; },
    f => { f.child.VPRBoard.validateState = () => false; },
    f => { f.child.VPRBoard.getState = () => { throw new Error('Invalid state'); }; },
    f => { f.selected.attempt.notes = '<img src=x>'; }
  ];
  for (const change of changes) {
    const f = fixture(); change(f); const original = clone(f.selected);
    await f.transfer();
    assert.deepEqual(f.sent, [], String(change));
    assert.equal(f.requests.length, 0, String(change));
    assert.deepEqual(f.selected, original, 'Rejected transfer never discards work');
    assert.equal(f.notices.length, 1, 'The failed handoff is visible');
  }
});

test('timeout restores controls and a subsequent transfer can complete', async () => {
  const f = fixture(), pending = f.transfer();
  await f.transfer(); assert.equal(f.requests.length, 1, 'Double click cannot create two outstanding transfers');
  f.timeout(); await pending;
  assert.deepEqual(f.sent, []); assert.equal(f.context.frame.inert, false);
  assert.equal(f.context.controlToggle.disabled, false); assert.equal(f.listeners.size, 1);
  assert.equal(f.notices.length, 1);
  const retry = f.transfer(); f.respond(); await retry;
  assert.equal(f.sent.at(-1).name, 'control:grant');
  f.server('control:changed', { control: 'student', controlVersion: 12 });
});

test('room, controller, frame and registry changes invalidate an outstanding handoff', async () => {
  const changes = [
    f => { f.context.shared.roomId = 'different-room'; },
    f => { f.context.shared.control = 'student'; },
    f => { f.context.shared.controlVersion += 2; },
    f => { f.context.shared.connected = false; },
    f => { f.context.shared.socket = { connected: true, emit: (name, value) => f.sent.push({ name, value: clone(value) }) }; },
    f => { f.context.frameGeneration++; },
    f => { f.context.frame.contentDocument = {}; },
    f => { f.context.bridgeSession = { ...f.context.bridgeSession }; },
    f => { f.entry.stateSchemaVersion = 2; },
    f => { f.context.trainerRegistry.status = 'failed'; }
  ];
  for (const change of changes) {
    const f = fixture(), pending = f.transfer(); change(f); f.respond(); await pending;
    assert.equal(f.sent.some(item => item.name.startsWith('control:')), false, String(change));
    assert.equal(f.listeners.size, 1); assert.equal(f.notices.length, 1);
  }
});

test('teacher to pupil to teacher cannot reuse an earlier pending controller generation', async () => {
  const f = fixture(), pending = f.transfer();
  f.server('control:changed', { control: 'student', controlVersion: 12 });
  f.server('control:changed', { control: 'teacher', controlVersion: 13 });
  f.respond(); await pending;
  assert.equal(f.sent.some(item => item.name.startsWith('control:')), false);
  assert.equal(f.context.vprControlTransfer, null);
  assert.equal(f.context.frame.inert, false, 'The newly acknowledged teacher turn remains usable');
});

test('a timeout after control emission refreshes authority without reopening edits on stale ownership', async () => {
  const f = fixture(), pending = f.transfer(); f.respond(); await pending;
  f.timeout();
  assert.equal(f.sent.at(-1).name, 'room:state');
  assert.equal(f.context.frame.inert, true);
  f.server('room:state', { state: { roomId: 'synthetic-room', control: 'teacher', controlVersion: 11 } });
  assert.equal(f.context.frame.inert, true, 'An older same-controller snapshot cannot prove the handoff failed');
  assert.notEqual(f.context.vprControlTransfer, null);
  f.server('room:state', { state: { roomId: 'synthetic-room', control: 'student', controlVersion: 12 } });
  assert.equal(f.context.vprControlTransfer, null);
  assert.equal(f.context.frame.inert, true, 'Authoritative new ownership keeps the old writer locked');
});

test('a rejected grant waits for a fresh room response before restoring the teacher turn', async () => {
  const f = fixture(), pending = f.transfer(); f.respond(); await pending;
  f.server('room:error', { message: 'Ученик не найден' });
  assert.equal(f.sent.at(-1).name, 'room:state');
  assert.equal(f.context.frame.inert, true);
  f.server('room:state', { state: { roomId: 'synthetic-room', control: 'teacher', controlVersion: 11 } });
  assert.equal(f.context.vprControlTransfer, null); assert.equal(f.context.frame.inert, false);
  assert.equal(f.context.controlToggle.disabled, false);
  assert.match(f.notices.at(-1), /Передать ход пока не удалось/);
});

test('disconnect and terminal room errors clean a pending handoff without locking a replacement room', async () => {
  for (const event of ['disconnect', 'room:error']) {
    const f = fixture(), pending = f.transfer(); f.respond(); await pending;
    const previousFinish = f.context.vprControlTransfer.finish;
    f.server(event, { message: 'Комната не найдена' });
    assert.equal(f.context.vprControlTransfer, null); assert.equal(f.timers.size, 0);
    for (const handlers of f.socketListeners.values()) assert.equal(handlers.size, 0);
    Object.assign(f.context.shared, { connected: true, roomError: '', roomId: 'replacement-room', control: 'teacher', controlVersion: 0 });
    f.context.shared.socket.connected = true; f.context.updateControlUi();
    const retry = f.transfer(); assert.equal(f.context.frame.inert, true);
    previousFinish(true);
    assert.equal(f.context.frame.inert, true, 'Late cleanup from the former room cannot unlock the replacement');
    f.respond(); await retry;
    f.server('control:changed', { control: 'student', controlVersion: 1 });
    assert.equal(f.context.vprControlTransfer, null);
  }
});

test('unrelated trainers and teacher revocation keep their established control path', async () => {
  for (const role of ['teacher', 'student']) {
    const f = fixture(role); f.context.state.trainerUrl = 'negative-numbers-line.html';
    f.child.VPRBoard.getState = () => assert.fail('Unrelated trainers must not read VPR');
    await f.transfer();
    assert.deepEqual(f.sent.map(item => item.name), [role === 'teacher' ? 'control:grant' : 'control:release']);
    assert.equal(f.requests.length, 0);
  }
  const f = fixture(); f.context.shared.control = 'student';
  await f.transfer();
  assert.deepEqual(f.sent.map(item => item.name), ['control:revoke']);
  assert.equal(f.requests.length, 0, 'The teacher cannot flush a remote pupil through a local frame');
});
