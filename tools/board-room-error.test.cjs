'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://board-fixture.invalid';
const SERVER = 'https://transport-fixture.invalid';
const TRAINER = 'negative-numbers-line';
const TRAINER_URL = 'negative-numbers-line.html?seed=fixture-seed';
const REGISTRY = {
  schemaVersion: 1, digest: `sha256:${'a'.repeat(64)}`,
  trainers: [{ trainerId: TRAINER, file: 'trainers/negative-numbers-line.html',
    version: '1.0.0', stateSchemaVersion: 1, bridgeProtocolVersion: 1, allowLegacyHtml: false }]
};
const TERMINAL_ERRORS = ['Комната не найдена', 'Нет доступа к комнате', 'Нет участника комнаты'];
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const copy = value => JSON.parse(JSON.stringify(value));

// Execute the complete production page and its real scripts. Only browser
// rendering, HTTP, Socket.IO and the child frame's wire protocol are fixtures;
// no parent room/bridge handler is copied or replaced here.
async function createBoardFixture({ role = 'student', sourceOverride } = {}) {
  const errors = [], sockets = [], requests = [], registryRequests = [], timers = new Map();
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const query = role === 'teacher' ? '' : `?role=${role === 'student' ? 'student' : 'teacher'}&room=fixture-room&token=fixture-token&server=${encodeURIComponent(SERVER)}`;
  const html = sourceOverride ?? fs.readFileSync(path.join(ROOT, 'trainers/trainer-board.html'), 'utf8');
  const dom = new JSDOM(html, { url: `${ORIGIN}/trainers/trainer-board.html${query}`, runScripts: 'outside-only', virtualConsole });
  const w = dom.window, context = dom.getInternalVMContext();
  const evaluate = source => new vm.Script(source).runInContext(context);
  const inRealm = value => w.JSON.parse(JSON.stringify(value));
  let timerId = 0, holdRegistry = false, roomNumber = 0;
  w.setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  w.clearTimeout = id => timers.delete(id);
  w.requestAnimationFrame = () => ++timerId;
  w.cancelAnimationFrame = () => {};
  w.matchMedia = media => ({ media, matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({ canvas: this, measureText: value => ({ width: String(value).length * 8 }) }, {
      get(target, key) { return key in target ? target[key] : () => {}; }
    });
  };
  w.addEventListener('error', event => errors.push(event.error?.stack || event.message));
  w.localStorage.setItem('mathexam.trainerBoard.serverUrl', SERVER);
  w.localStorage.setItem('mathexam.trainerBoard.v1', JSON.stringify({
    current: 0, trainerUrl: TRAINER_URL, trainerHidden: false,
    pages: [{ id: 'fixture-page', bg: 'blank', strokes: [], redo: [] }]
  }));
  if (role === 'restored') w.sessionStorage.setItem('mathexam.trainerBoard.teacherRoomSession.v1', JSON.stringify({
    role: 'teacher', roomId: 'fixture-room', teacherToken: 'fixture-teacher-token',
    studentToken: 'fixture-student-token', server: SERVER
  }));

  class FakeSocket {
    constructor() { this.listeners = new Map(); this.sent = []; this.disconnected = false; }
    on(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); return this; }
    off(name, fn) { if (fn) this.listeners.get(name)?.delete(fn); else this.listeners.delete(name); return this; }
    removeAllListeners() { this.listeners.clear(); return this; }
    emit(name, payload) { this.sent.push({ name, payload: payload === undefined ? undefined : copy(payload) }); return this; }
    deliver(name, payload) { for (const fn of [...(this.listeners.get(name) || [])]) fn(payload === undefined ? undefined : inRealm(payload)); }
    disconnect() { this.disconnected = true; this.deliver('disconnect'); return this; }
  }
  w.io = () => { const socket = new FakeSocket(); sockets.push(socket); return socket; };
  const response = (data, url) => ({ ok: true, status: 200, url, headers: { get: () => null }, json: async () => inRealm(data) });
  w.fetch = async (input, options = {}) => {
    const url = new URL(String(input), w.location.href); requests.push({ url: url.href, method: options.method || 'GET' });
    if (url.origin === SERVER && url.pathname === '/api/trainer-registry') {
      if (!holdRegistry) return response(REGISTRY, url.href);
      return new Promise(resolve => registryRequests.push(data => resolve(response(data || REGISTRY, url.href))));
    }
    if (url.origin === SERVER && url.pathname === '/api/rooms' && options.method === 'POST') {
      return response({ roomId: `fixture-new-${++roomNumber}`, teacherToken: 'fixture-teacher-token', studentToken: 'fixture-student-token', state: { participants: [], control: '', controlVersion: 0 } }, url.href);
    }
    if (url.origin === ORIGIN && options.method === 'HEAD') return response({}, url.href);
    if (url.origin === ORIGIN && url.pathname.endsWith('/board-compat.json')) return response({ trainers: [] }, url.href);
    if (url.origin === ORIGIN && url.pathname.endsWith('/board-picker-data.json')) return response({ entries: [] }, url.href);
    errors.push(`Unexpected fetch: ${options.method || 'GET'} ${url.href}`);
    throw new Error('Unexpected fixture fetch');
  };

  const frame = w.document.getElementById('trainerFrame');
  const nativeGetAttribute = frame.getAttribute.bind(frame);
  const child = { instanceId: 'fixture-instance-0', version: '1.0.0', hydrated: false, draft: { answer: 'initial' }, messages: [], navigations: [] };
  let frameUrl = 'about:blank';
  const frameWindow = {
    location: new URL(`${ORIGIN}/trainers/negative-numbers-line.html`), addEventListener() {},
    postMessage(message, origin) {
      child.messages.push(copy(message));
      assert.equal(origin, ORIGIN);
      if (message.bridgeInstanceId !== child.instanceId) return;
      if (message.type === 'mathexam:hydrate' && !child.hydrated) {
        if (message.mode === 'state') child.draft = copy(message.state);
        child.hydrated = true;
      } else if (message.type === 'mathexam:apply-trainer-state' && child.hydrated) child.draft = copy(message.state);
      else if (message.type === 'mathexam:request-trainer-state' && child.hydrated) Promise.resolve().then(() => sendFrame('mathexam:trainer-state', { state: child.draft }));
    }
  };
  Object.defineProperty(frame, 'contentWindow', { get: () => frameWindow });
  frame.getAttribute = name => name === 'src' ? frameUrl : nativeGetAttribute(name);
  Object.defineProperty(frame, 'src', {
    get: () => new URL(frameUrl, w.location.href).href,
    set(value) {
      frameUrl = String(value); child.navigations.push(frameUrl);
      child.instanceId = `fixture-instance-${child.navigations.length}`;
      child.hydrated = false; child.draft = { answer: 'initial' };
      frameWindow.location = new URL(frameUrl, w.location.href);
    }
  });
  function sendFrame(type, extra = {}) {
    w.dispatchEvent(new w.MessageEvent('message', { source: frameWindow, origin: ORIGIN, data: inRealm({
      type, protocolVersion: 1, trainerId: TRAINER, trainerVersion: child.version,
      stateSchemaVersion: 1, bridgeInstanceId: child.instanceId, ...extra
    }) }));
  }

  for (const script of w.document.querySelectorAll('script')) {
    const src = script.getAttribute('src');
    const filename = src ? path.join(ROOT, 'trainers', src.split('?')[0]) : 'trainer-board.inline.js';
    new vm.Script(src ? fs.readFileSync(filename, 'utf8') : script.textContent, { filename }).runInContext(context);
  }
  await tick();
  assert.deepEqual(errors, [], 'the actual board page boots without runtime/network errors');

  const fixture = {
    w, dom, evaluate, errors, sockets, requests, registryRequests, timers, frame, child, sendFrame,
    snapshot: () => JSON.parse(evaluate('JSON.stringify(publicSnapshot())')),
    status: () => w.document.getElementById('mirrorStatus').dataset.mirrorStatus,
    socket: () => sockets.at(-1),
    holdRegistry(value = true) { holdRegistry = value; },
    async completeRegistry(data) { assert.ok(registryRequests.length, 'a registry request is pending'); registryRequests.shift()(data); await tick(); },
    async clickCreateRoom() { w.document.getElementById('createRoom').click(); await tick(); return fixture.socket(); },
    accept(socket = fixture.socket(), { empty = false } = {}) {
      const participantRole = role === 'student' ? 'student' : 'teacher';
      const participantId = `fixture-${participantRole}`;
      const roomState = { control: participantId, controlVersion: 4, participants: [{ id: participantId, role: participantRole, connected: true }] };
      if (!empty) Object.assign(roomState, fixture.snapshot(), { trainerUrl: TRAINER_URL });
      socket.deliver('room:state', { state: roomState, you: { participantId, role: participantRole } });
    },
    async connect() {
      const socket = role === 'teacher' ? await fixture.clickCreateRoom() : fixture.socket();
      assert.ok(socket, 'Socket.IO was created by the real page');
      socket.deliver('connect'); fixture.accept(socket);
      frame.onload(); sendFrame('mathexam:trainer-ready'); await tick();
      assert.equal(evaluate('!!bridgeSession?.hydrated'), true, 'real bridge handshake completes');
      assert.equal(fixture.status(), 'connected');
      return socket;
    },
    close() { dom.window.close(); assert.deepEqual(errors, [], 'no unexpected runtime or network errors'); }
  };
  return fixture;
}

function assertDisconnected(f, role) {
  assert.equal(f.evaluate('shared.connected'), false, 'terminal error must clear connected');
  assert.equal(f.evaluate('roomStateReceived'), false);
  assert.equal(f.evaluate('shared.socket'), null);
  for (const key of ['roomId', 'token', 'studentToken', 'studentLink', 'control']) assert.equal(f.evaluate(`shared.${key}`), '', key);
  assert.equal(f.evaluate('shared.controlVersion'), 0);
  assert.equal(f.evaluate('shared.me'), null);
  assert.equal(f.evaluate('shared.participants.length'), 0);
  for (const name of ['bridgeSession', 'readyCandidate', 'pendingTrainerState', 'latestTrainerState', 'bridgeHydrationTimer', 'legacyTrainerTimer']) assert.equal(f.evaluate(name), null, name);
  assert.equal(f.status(), 'room-unavailable');
  assert.equal(f.evaluate('canWrite()'), role !== 'student', 'teacher keeps local work; pupil stays locked');
  assert.equal(f.frame.inert, role === 'student');
  assert.equal(f.frame.tabIndex, role === 'student' ? -1 : 0);
  assert.equal(f.w.document.getElementById('controlToggle').disabled, true);
  assert.equal(f.w.document.getElementById('releaseControl').disabled, true);
}

for (const role of ['student', 'teacher', 'restored']) for (const message of TERMINAL_ERRORS) {
  test(`terminal room error ${message}: ${role} retains work and clears live authority`, async () => {
    const f = await createBoardFixture({ role });
    try {
      const socket = await f.connect();
      f.evaluate("state.pages[0].strokes.push({kind:'text',x:12,y:20,text:'fixture work',size:16,color:'#111'});pendingTrainerState={state:{answer:'queued'}};latestTrainerState={state:{answer:'stale'}};bridgeHydrationTimer=setTimeout(()=>{},10000);legacyTrainerTimer=setTimeout(()=>{},250)");
      f.child.draft = { answer: 'retained local draft' };
      const before = f.snapshot(), draft = copy(f.child.draft), navigationCount = f.child.navigations.length;
      socket.deliver('room:error', { message });
      assertDisconnected(f, role);
      assert.deepEqual(f.snapshot(), before);
      assert.deepEqual(f.child.draft, draft);
      assert.equal(f.child.navigations.length, navigationCount, 'terminal error does not reload the iframe');
      assert.equal(socket.disconnected, true);
      assert.equal(socket.listeners.size, 0, 'old socket listeners are detached');
      if (role !== 'student') {
        assert.equal(f.w.sessionStorage.getItem('mathexam.trainerBoard.teacherRoomSession.v1'), null);
        assert.equal(new URL(f.w.location.href).searchParams.has('room'), false);
      }
    } finally { f.close(); }
  });
}

for (const message of ['Нет прав на передачу хода', 'Некорректное состояние доски']) test(`recoverable denial keeps the room, control and hydrated frame: ${message}`, async () => {
  const f = await createBoardFixture();
  try {
    const socket = await f.connect(), before = f.snapshot(), instanceId = f.child.instanceId;
    socket.deliver('room:error', { message });
    assert.equal(f.evaluate('shared.connected && roomStateReceived && bridgeSession.hydrated'), true);
    assert.equal(f.evaluate('canWrite()'), true);
    assert.equal(f.frame.inert, false);
    assert.equal(socket.disconnected, false);
    assert.equal(f.status(), 'connected');
    assert.equal(f.child.instanceId, instanceId);
    assert.deepEqual(f.snapshot(), before);
  } finally { f.close(); }
});

test('late socket, ready and registry events cannot unlock a pupil after a terminal error', async () => {
  const f = await createBoardFixture();
  try {
    const oldSocket = await f.connect(), before = f.snapshot();
    f.holdRegistry();
    f.evaluate('loadTrainerRegistry({force:true})');
    const outgoing = oldSocket.sent.length;
    oldSocket.deliver('room:error', { message: TERMINAL_ERRORS[0] });
    for (const [name, payload] of [
      ['connect'], ['reconnect_attempt'],
      ['room:state', { state: { ...before, control: 'fixture-student', controlVersion: 99 }, you: { participantId: 'fixture-student', role: 'student' } }],
      ['control:changed', { control: 'fixture-student', controlVersion: 99 }],
      ['participants:state', { participants: [{ id: 'fixture-student', role: 'student' }] }],
      ['board:trainer-url-change', { trainerUrl: 'negative-numbers.html' }],
      ['board:trainer-state-change', { trainerId: TRAINER, state: { answer: 'late room state' } }],
      ['board:snapshot', { state: { ...before, pages: [{ id: 'late-page', bg: 'blank', strokes: [] }] } }]
    ]) oldSocket.deliver(name, payload);
    f.sendFrame('mathexam:trainer-ready');
    f.sendFrame('mathexam:trainer-state', { state: { answer: 'late iframe state' } });
    await f.completeRegistry();
    assertDisconnected(f, 'student');
    assert.deepEqual(f.snapshot(), before);
    assert.equal(oldSocket.sent.length, outgoing, 'late callbacks cannot publish through the rejected socket');
    assert.equal(f.evaluate("typeof pausedTrainerBridge !== 'undefined' && !!pausedTrainerBridge?.hydrated"), true, 'matching ready preserves only paused frame metadata');
  } finally { f.close(); }
});

for (const order of ['registry-first', 'room-first']) test(`new teacher room preserves current iframe draft after ${order} acceptance`, async () => {
  const f = await createBoardFixture({ role: 'teacher' });
  try {
    const oldSocket = await f.connect();
    f.child.draft = { answer: 'old published work' };
    f.sendFrame('mathexam:trainer-state', { state: f.child.draft });
    f.holdRegistry(); f.evaluate('loadTrainerRegistry({force:true})');
    oldSocket.deliver('room:error', { message: TERMINAL_ERRORS[1] });
    const before = f.snapshot(), instanceId = f.child.instanceId, navigationCount = f.child.navigations.length;
    const hydrationCount = f.child.messages.filter(item => item.type === 'mathexam:hydrate').length;
    f.child.draft = { answer: 'current local work after rejection' };
    f.sendFrame('mathexam:trainer-ready'); // A delayed announcement from the same hydrated document.
    const socket = await f.clickCreateRoom();
    assert.notEqual(socket, oldSocket);
    socket.deliver('connect');
    assert.equal(f.evaluate('bridgeSession'), null);
    if (order === 'registry-first') {
      await f.completeRegistry();
      assert.equal(f.evaluate('roomStateReceived'), false);
      assert.notEqual(f.status(), 'connected');
      assert.equal(f.evaluate('bridgeSession'), null);
      f.accept(socket, { empty: true });
    } else {
      f.accept(socket, { empty: true });
      assert.equal(f.evaluate('bridgeSession'), null);
      assert.notEqual(f.status(), 'connected');
      await f.completeRegistry();
    }
    await tick();
    assert.equal(f.evaluate('bridgeSession?.hydrated'), true);
    assert.equal(f.status(), 'connected');
    assert.equal(f.child.instanceId, instanceId);
    assert.equal(f.child.navigations.length, navigationCount, 'matching live frame does not reload');
    assert.equal(f.child.messages.filter(item => item.type === 'mathexam:hydrate').length, hydrationCount, 'already hydrated frame is not hydrated again');
    assert.deepEqual(f.snapshot(), before);
    const publications = socket.sent.filter(item => item.name === 'board:trainer-state-change');
    assert.equal(publications.length, 1, 'new accepted room requests one fresh frame snapshot');
    assert.deepEqual(publications[0].payload.state, { answer: 'current local work after rejection' });
    assert.equal(publications[0].payload.roomId, 'fixture-new-2');
    assert.equal(JSON.stringify(socket.sent).includes('old published work'), false, 'discarded cached trainer state never reaches the new room');
    oldSocket.deliver('room:error', { message: TERMINAL_ERRORS[0] });
    assert.equal(f.evaluate('shared.connected'), true, 'late rejection from old socket cannot terminate the new room');
  } finally { f.close(); }
});

for (const mismatch of ['url', 'generation', 'version']) test(`paused frame metadata cannot resume after ${mismatch} mismatch`, async () => {
  const f = await createBoardFixture({ role: 'teacher' });
  try {
    const oldSocket = await f.connect();
    oldSocket.deliver('room:error', { message: TERMINAL_ERRORS[0] });
    const oldInstance = f.child.instanceId, oldNavigationCount = f.child.navigations.length;
    if (mismatch === 'url') f.evaluate("state.trainerUrl='negative-numbers.html?seed=fixture-seed'");
    if (mismatch === 'generation') f.evaluate('frameGeneration++');
    if (mismatch === 'version') {
      f.holdRegistry(); f.evaluate('loadTrainerRegistry({force:true})');
      const changed = copy(REGISTRY); changed.trainers[0].version = '2.0.0';
      await f.completeRegistry(changed);
    }
    const socket = await f.clickCreateRoom(); socket.deliver('connect'); f.accept(socket, { empty: true });
    await tick();
    assert.equal(f.evaluate('!!bridgeSession?.hydrated'), false);
    assert.equal(f.evaluate("typeof pausedTrainerBridge !== 'undefined' && pausedTrainerBridge === null"), true);
    assert.notEqual(f.status(), 'connected');
    assert.equal(socket.sent.filter(item => item.name === 'board:trainer-state-change').length, 0);
    if (mismatch === 'url') {
      assert.equal(f.child.instanceId, oldInstance, 'unsupported URL cannot reuse a different registered trainer');
      assert.equal(f.status(), 'unsupported-trainer', 'accepted new room must not retain the old room-unavailable status');
    }
    else assert.equal(f.child.navigations.length, oldNavigationCount + 1, 'registered trainer gets a fresh controlled handshake');
  } finally { f.close(); }
});

test('a new iframe instance ready before onload cannot inherit paused hydration in a new room', async () => {
  const f = await createBoardFixture({ role: 'teacher' });
  try {
    const oldSocket = await f.connect();
    oldSocket.deliver('room:error', { message: TERMINAL_ERRORS[0] });
    const navigationCount = f.child.navigations.length;
    // A self-reload retains the WindowProxy/path and sends ready before onload.
    f.child.instanceId = 'fixture-self-reloaded-instance'; f.child.hydrated = false;
    f.child.draft = { answer: 'fresh document, never hydrated' };
    f.sendFrame('mathexam:trainer-ready');
    assert.equal(f.evaluate("typeof pausedTrainerBridge !== 'undefined' && pausedTrainerBridge === null"), true);
    const socket = await f.clickCreateRoom(); socket.deliver('connect'); f.accept(socket, { empty: true });
    assert.equal(f.evaluate('!!bridgeSession?.hydrated'), false);
    assert.equal(f.child.navigations.length, navigationCount + 1, 'new room reloads instead of restoring stale document metadata');
    assert.equal(socket.sent.filter(item => item.name === 'board:trainer-state-change').length, 0);
    f.frame.onload();
    f.sendFrame('mathexam:trainer-ready');
    await tick();
    assert.equal(f.evaluate('bridgeSession?.hydrated'), true);
    assert.equal(f.status(), 'connected');
    const publications = socket.sent.filter(item => item.name === 'board:trainer-state-change');
    assert.equal(publications.length, 1);
    assert.deepEqual(publications[0].payload.state, { answer: 'initial' });
  } finally { f.close(); }
});

test('opening a trainer after rejection rearms recovery for ready before room acceptance and onload', async () => {
  const f = await createBoardFixture({ role: 'teacher' });
  try {
    const oldSocket = await f.connect();
    oldSocket.deliver('room:error', { message: TERMINAL_ERRORS[0] });
    // Keep the seed so createRoom cannot mask the race with its own URL reload.
    f.evaluate("openTrainer('negative-numbers-line.html?fresh=1&seed=fixture-seed')");
    const navigationCount = f.child.navigations.length;
    assert.equal(f.evaluate('frameLoaded'), false);
    assert.equal(f.evaluate('bridgeReloadNeeded'), false);
    assert.equal(f.evaluate('pausedTrainerBridge'), null);
    f.sendFrame('mathexam:trainer-ready');
    assert.equal(f.evaluate('bridgeReloadNeeded'), true, 'rejected-room ready must rearm recovery after setTrainerFrameSrc cleared it');
    assert.equal(f.evaluate('bridgeSession'), null);
    const socket = await f.clickCreateRoom(); socket.deliver('connect'); f.accept(socket, { empty: true });
    assert.equal(f.child.navigations.length, navigationCount);
    assert.equal(f.evaluate('!!bridgeSession?.hydrated'), false);
    assert.equal(socket.sent.filter(item => item.name === 'board:trainer-state-change').length, 0);
    f.frame.onload();
    assert.equal(f.child.navigations.length, navigationCount + 1, 'one controlled reload follows acceptance and onload');
    f.frame.onload(); f.sendFrame('mathexam:trainer-ready'); await tick();
    assert.equal(f.evaluate('bridgeSession?.hydrated'), true);
    assert.equal(f.status(), 'connected');
    assert.equal(f.child.navigations.length, navigationCount + 1, 'recovery does not loop');
    assert.equal(socket.sent.filter(item => item.name === 'board:trainer-state-change').length, 1);
  } finally { f.close(); }
});

for (const order of ['registry-first', 'room-first']) test(`ordinary reconnect waits for accepted room state: ${order}`, async () => {
  const f = await createBoardFixture({ role: 'teacher' });
  try {
    const socket = await f.connect(), instanceId = f.child.instanceId, navigationCount = f.child.navigations.length;
    const initialPublications = socket.sent.filter(item => item.name === 'board:trainer-state-change').length;
    f.holdRegistry(); socket.deliver('disconnect'); socket.deliver('connect');
    assert.equal(f.evaluate('roomStateReceived'), false);
    assert.equal(f.evaluate('bridgeSession?.hydrated'), true, 'ordinary transport loss keeps the same hydrated frame');
    assert.notEqual(f.status(), 'connected');
    if (order === 'registry-first') {
      await f.completeRegistry();
      assert.equal(f.evaluate('roomStateReceived'), false);
      assert.notEqual(f.status(), 'connected', 'registry completion alone cannot show connected');
      f.accept(socket, { empty: true });
    } else {
      f.accept(socket, { empty: true });
      assert.notEqual(f.status(), 'connected', 'room acceptance still waits for registry');
      await f.completeRegistry();
    }
    await tick();
    assert.equal(f.status(), 'connected');
    assert.equal(f.child.instanceId, instanceId);
    assert.equal(f.child.navigations.length, navigationCount);
    const publications = socket.sent.filter(item => item.name === 'board:trainer-state-change');
    assert.equal(publications.length, initialPublications + (order === 'room-first' ? 1 : 0), 'status transition itself never publishes; registry reconciliation may request current state');
    if (order === 'registry-first') {
      const draft = copy(f.child.draft);
      socket.deliver('room:state', { state: { latestTrainerState: {
        trainerId: TRAINER, protocolVersion: 1, trainerVersion: '1.0.0', stateSchemaVersion: 1,
        state: { answer: '<b>invalid bridge payload</b>' }
      } } });
      assert.equal(f.status(), 'state-invalid', 'connection status refresh cannot overwrite subsequent validation failure');
      assert.deepEqual(f.child.draft, draft, 'invalid incoming state never reaches the child');
      assert.equal(socket.sent.filter(item => item.name === 'board:trainer-state-change').length, publications.length);
    }
  } finally { f.close(); }
});

module.exports = { createBoardFixture };
