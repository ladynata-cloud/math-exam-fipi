'use strict';

// The real entry, adapter and SDK run in two isolated DOMs. Socket.IO and the
// room authorization are the actual local service. This parent shim transports
// SDK envelopes and mirrors host locks; browser.cjs covers the production host.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { io } = require('../../board-server/node_modules/socket.io-client');
const Data = require('./data.js');
const Core = require('./core.js');
const Plot = require('./plot.js');
const { createValidator } = require('./board.js');
const ROOT = path.resolve(__dirname, '../..');
const STORE = 'mathexam.vpr2027.offline.v1';
const URL_PATH = '/trainers/vpr-math/index.html';
const SELECTION = '?route=g5&lesson=g5-natural&task=g5-natural-3&mode=learn';
const ORIGIN = 'https://mathexam.space';
const clone = value => JSON.parse(JSON.stringify(value));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const panels = () => ({ theory: false, notes: false, plot: false, mobileLessons: false });
const validator = createValidator(Data, Core, Plot);
let server;

function blank(lesson = Data.lessons[0], task = lesson.tasks[0], mode = 'learn', route = lesson.routes[0]) {
  return { version: 1, view: { view: 'lesson', route, lesson: lesson.id, task: task.id, mode },
    attempt: { ...Core.blank(task, mode), plotPoints: [] }, history: [], feedback: null, panels: panels() };
}

async function until(predicate, message, timeout = 4000) {
  const deadline = Date.now() + timeout;
  do { if (predicate()) return; await pause(10); } while (Date.now() < deadline);
  assert.fail(message);
}

function event(socket, name, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, receive); reject(new Error('Timed out: ' + name)); }, 4000);
    function receive(value) { if (predicate(value)) { clearTimeout(timer); socket.off(name, receive); resolve(value); } }
    socket.on(name, receive);
  });
}

test.before(async () => {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port) };
  delete env.TRAINER_REGISTRY_PATH; delete env.PROGRESS_STORE_PATH; delete env.PROGRESS_PERSISTENCE_CONFIRMED;
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stdout.resume(); child.stderr.on('data', chunk => { stderr += chunk; });
  server = { child, url: 'http://127.0.0.1:' + port };
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    assert.equal(child.exitCode, null, 'Board server exited: ' + stderr);
    try { if ((await fetch(server.url + '/health')).ok) return; } catch (_) { /* Binding. */ }
    await pause(40);
  }
  assert.fail('Local board service did not start: ' + stderr);
});

test.after(async () => {
  if (!server || server.child.exitCode !== null) return;
  const exited = new Promise(resolve => server.child.once('exit', resolve));
  server.child.kill();
  const timer = setTimeout(() => server.child.kill('SIGKILL'), 2000);
  await exited; clearTimeout(timer);
});

async function participant(room, role) {
  const token = role === 'teacher' ? room.teacherToken : room.studentToken;
  const socket = io(server.url, { autoConnect: false, forceNew: true, reconnection: false, transports: ['websocket'] });
  const connected = event(socket, 'connect'); socket.connect(); await connected;
  const joined = event(socket, 'room:state');
  socket.emit('room:join', { roomId: room.roomId, role, token, proto: 2 });
  return { socket, token, role, joined: await joined };
}

function surface(t, participant, room, options = {}) {
  const errors = [], messages = [], diagnostics = [];
  const stats = { reads: 0, writes: 0, network: 0, sent: 0, received: 0, notifications: 0 };
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
    url: ORIGIN + URL_PATH + (options.selection || SELECTION), runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
  });
  const w = dom.window;
  const privateSeed = JSON.stringify({ version: 1, attempts: { 'personal-sentinel': participant.role }, diagnostics: { private: true } });
  w.localStorage.setItem(STORE, privateSeed);
  w.localStorage.setItem('unrelated-personal-key', participant.role);
  const originals = Object.fromEntries(['getItem', 'setItem', 'removeItem', 'clear'].map(name => [name, w.Storage.prototype[name]]));
  for (const name of Object.keys(originals)) w.Storage.prototype[name] = function (...args) {
    stats[name === 'getItem' ? 'reads' : 'writes']++; return originals[name].apply(this, args);
  };
  if (options.storageBlocked) Object.defineProperty(w, 'localStorage', { get() { stats.reads++; throw new w.DOMException('Blocked', 'SecurityError'); } });
  w.fetch = () => { stats.network++; throw new Error('A trainer must not fetch personal data'); };
  w.XMLHttpRequest.prototype.send = () => { stats.network++; throw new Error('A trainer must not send personal data'); };
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.confirm = () => true;
  const frame = w.document.createElement('iframe');
  Object.defineProperty(w, 'frameElement', { configurable: true, value: frame });
  const parent = {
    location: { origin: ORIGIN, pathname: options.group ? '/trainers/group-board.html' : '/trainers/trainer-board.html' },
    postMessage(data, targetOrigin) {
      assert.equal(targetOrigin, ORIGIN, 'SDK targets the exact parent origin');
      messages.push(clone(data));
      if (data.type !== 'mathexam:trainer-state' || !api.canWrite()) return;
      stats.sent++;
      participant.socket.emit('board:trainer-state-change', { roomId: room.roomId, token: participant.token, ...clone(data), trainer: data.trainerId });
    }
  };
  Object.defineProperty(w, 'parent', { configurable: true, value: parent });
  w.addEventListener('mathexam:bridge-diagnostic', e => diagnostics.push(clone(e.detail)));
  let registration, api;
  for (const script of w.document.querySelectorAll('script[src]')) {
    const url = new URL(script.src);
    assert.equal(url.origin, ORIGIN);
    w.eval(fs.readFileSync(path.join(ROOT, url.pathname), 'utf8') + '\n//# sourceURL=' + url.pathname);
    if (url.pathname.endsWith('/board-bridge.js')) {
      const sdk = w.MathExamBoard;
      w.MathExamBoard = Object.freeze({ ...sdk, register(config) {
        assert.equal(registration, undefined, 'One bridge registration'); registration = config;
        return sdk.register({ ...config, subscribe(notify) { return config.subscribe(() => { stats.notifications++; notify(); }); } });
      } });
    }
  }
  api = w.VPRBoard;
  assert.ok(api && registration, 'Entry loads the real semantic adapter');
  assert.equal(w.VPRBoardMode, true, 'Same-origin host is detected without a board query parameter');
  assert.equal(registration.id, 'vpr-math'); assert.equal(registration.version, '1.0.0'); assert.equal(registration.stateSchemaVersion, 1);
  const f = {
    w, api, stats, messages, diagnostics, participant, closed: false,
    q(selector) { const el = w.document.querySelector(selector); assert.ok(el, 'Missing control: ' + selector); return el; },
    state() { return clone(api.getState()); },
    snapshot() { return clone(w.VPRApp.snapshot()); },
    send(type, state, extra = {}, origin = ORIGIN, source = parent) {
      const ready = messages.find(message => message.type === 'mathexam:trainer-ready');
      assert.ok(ready, 'SDK announces readiness');
      const data = { ...ready, type, ...extra };
      if (state !== undefined) data.state = state;
      w.dispatchEvent(new w.MessageEvent('message', { data: w.JSON.parse(JSON.stringify(data)), origin, source }));
    },
    click(selector) { const el = f.q(selector); assert.notEqual(el.disabled, true, 'Enabled: ' + selector); el.click(); },
    fill(selector, value) { const el = f.q(selector); el.value = String(value); el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); },
    toggle(selector) { const el = f.q(selector); el.open = !el.open; el.dispatchEvent(new w.Event('toggle')); },
    writable(yes) { frame.inert = !yes; frame.style.pointerEvents = yes ? 'auto' : 'none'; w.document.body.inert = options.group && !yes; },
    checkClean() {
      assert.deepEqual(errors, [], 'No DOM runtime errors');
      assert.equal(stats.network, 0, 'No personal-service network traffic');
      assert.equal(stats.reads, 0, 'No personal storage reads in shared mode');
      assert.equal(stats.writes, 0, 'No personal storage writes in shared mode');
      if (!options.storageBlocked) {
        assert.equal(originals.getItem.call(w.localStorage, STORE), privateSeed);
        assert.equal(originals.getItem.call(w.localStorage, 'unrelated-personal-key'), participant.role);
      }
      assert.equal(api.validateState(api.getState()), true);
      const local = f.snapshot();
      for (const key of ['achievements', 'diagnostics', 'pendingSessions']) assert.deepEqual(local[key], {}, key + ' stays private');
      assert.equal(local.session, null);
    },
    close() { if (f.closed) return; f.checkClean(); f.closed = true; participant.socket.off('board:trainer-state-change', receive); participant.socket.off('control:changed', control); api.destroy(); w.close(); }
  };
  function receive(payload) { stats.received++; f.send('mathexam:apply-trainer-state', payload.state); }
  function control(payload) { f.writable(payload.control === participant.joined.you.participantId); }
  participant.socket.on('board:trainer-state-change', receive);
  participant.socket.on('control:changed', control);
  control(participant.joined);
  t.after(() => f.close());
  return f;
}

async function pair(t, options = {}) {
  const response = await fetch(server.url + '/api/rooms', { method: 'POST' });
  assert.equal(response.status, 201);
  const room = await response.json(), teacher = await participant(room, 'teacher'), student = await participant(room, 'student');
  t.after(() => { teacher.socket.disconnect(); student.socket.disconnect(); });
  const changed = event(student.socket, 'board:trainer-url-change');
  teacher.socket.emit('board:trainer-url-change', { roomId: room.roomId, token: teacher.token, trainerUrl: URL_PATH + SELECTION });
  await changed;
  const a = surface(t, teacher, room, options);
  a.send('mathexam:hydrate', undefined, { mode: 'empty' });
  const initial = event(student.socket, 'board:trainer-state-change');
  a.send('mathexam:request-trainer-state');
  const payload = await initial;
  const b = surface(t, student, room, options);
  b.send('mathexam:hydrate', payload.state, { mode: 'state' });
  assert.deepEqual(b.state(), a.state());
  return { room, teacher, student, a, b };
}

function visible(f) {
  const q = selector => f.w.document.querySelector(selector);
  return { condition: q('.task-prompt')?.textContent, current: q('.step.current h3')?.textContent,
    answers: [...f.w.document.querySelectorAll('[data-answer]')].map(el => el.value),
    checked: [...f.w.document.querySelectorAll('[role=radio][aria-checked=true]')].map(el => el.textContent),
    // Capacity alerts describe a rejected local edit; mathematical feedback is shared.
    notes: q('#task-notes')?.value, feedback: [...f.w.document.querySelectorAll('.feedback:not(#board-save-warning)')].map(el => el.textContent),
    graph: q('#interactive-plot')?.outerHTML, panels: f.state().panels };
}

async function mirrored(writer, reader, action) {
  const sent = writer.stats.sent, echoed = reader.stats.sent, received = reader.stats.received;
  await action();
  await until(() => writer.stats.sent > sent && reader.stats.received > received && JSON.stringify(writer.state()) === JSON.stringify(reader.state()), 'Action must arrive through the actual room transport and update the peer');
  await pause(70);
  assert.equal(reader.stats.sent, echoed, 'Remote application cannot echo');
  assert.deepEqual(visible(reader), visible(writer), 'Both rendered trainers show the same task and work');
}

async function grant(p, studentTurn) {
  const received = event(p.student.socket, 'control:changed');
  p.teacher.socket.emit(studentTurn ? 'control:grant' : 'control:revoke', { roomId: p.room.roomId, token: p.teacher.token });
  await received; await pause(10);
}

async function roomSnapshot(p) {
  const received = event(p.teacher.socket, 'room:state'); p.teacher.socket.emit('room:state');
  return (await received).state.latestTrainerState.state;
}

function answer(f, value) { f.fill('.step.current [data-answer]', value); f.click('.step.current [data-action=check]'); }
function selectTask(f, route, lesson, task, mode = 'learn') {
  f.w.location.hash = new URLSearchParams({ view: 'lesson', route, lesson, task, mode }).toString();
}

test('all published routes and task modes have a valid isolated initial snapshot', () => {
  for (const route of Data.routes) for (const lessonId of route.lessonIds) {
    const lesson = Data.lessons.find(item => item.id === lessonId);
    for (const task of lesson.tasks) for (const mode of ['learn', 'solo']) assert.equal(validator(blank(lesson, task, mode, route.id)), true, `${route.id}/${task.id}/${mode}`);
  }
  assert.equal(validator({ version: 1, view: { view: 'home' }, attempt: null, history: [], feedback: null, panels: panels() }), true);
});

test('semantic boundary rejects foreign selection, forged solved work, bad points, excess keys and non-JSON values', () => {
  const base = blank();
  const mutations = [
    s => { s.view.route = 'g10'; }, s => { s.view.lesson = Data.lessons[1].id; },
    s => { s.view.task = Data.lessons[1].tasks[0].id; }, s => { s.view.mode = 'test'; },
    s => { s.attempt.mode = 'solo'; }, s => { s.attempt.taskId = 'another-task'; },
    s => { s.attempt.solved[0] = true; s.attempt.answers[0] = '-987654'; },
    s => { s.attempt.answers[1] = 'hidden draft'; }, s => { s.attempt.hints[0] = true; },
    s => { s.attempt.shown[0] = true; }, s => { s.attempt.plotPoints = [[0, 0]]; },
    s => { s.feedback = { task: s.view.task, index: 1, text: 'wrong step' }; },
    s => { s.feedback = { task: 'foreign', index: 0, text: 'foreign task' }; },
    s => { s.feedback = { task: s.view.task, index: 0, text: '<img src=x>' }; },
    s => { s.panels.theory = 'true'; }, s => { s.panels.plot = true; },
    s => { s.attempt.notes = 'x'.repeat(10001); }, s => { s.attempt.updated = Infinity; },
    s => { s.personalProgress = {}; }, s => { s.view.learnerId = 'private'; },
    s => { s.attempt.history = []; }, s => { s.panels.extra = false; },
    s => { delete s.attempt.plotPoints; }, s => { delete s.attempt.answers[0]; },
    s => { s.attempt.answers.extra = 'bad'; }, s => { s[Symbol('hidden')] = true; },
    s => { s.attempt.notes = undefined; }, s => { s.attempt.updated = 1n; },
    s => { s.attempt.constructor = {}; }, s => { s.attempt.notes = s; }
  ];
  for (const mutate of mutations) { const state = clone(base); mutate(state); assert.equal(validator(state), false, String(mutate)); }
  let getterRead = false;
  const accessor = clone(base); Object.defineProperty(accessor.attempt, 'notes', { enumerable: true, get() { getterRead = true; return ''; } });
  assert.equal(validator(accessor), false); assert.equal(getterRead, false, 'Untrusted accessors are never executed');
  const choiceLesson = Data.lessons.find(lesson => lesson.tasks.some(task => task.steps[0].answer.kind === 'choice'));
  const choiceTask = choiceLesson.tasks.find(task => task.steps[0].answer.kind === 'choice');
  const choice = blank(choiceLesson, choiceTask); choice.attempt.answers[0] = choiceTask.steps[0].options.length;
  assert.equal(validator(choice), false, 'A choice must exist in this exact question');
  const plotLesson = Data.lessons.find(lesson => lesson.tasks.some(task => task.plot));
  const plotTask = plotLesson.tasks.find(task => task.plot), graph = blank(plotLesson, plotTask);
  graph.attempt.plotPoints = [[0, 1], [1, 3]]; assert.equal(validator(graph), true, 'Incomplete or incorrect construction is legitimate work');
  graph.attempt.plotPoints[0][0] = 1000; assert.equal(validator(graph), false);
  const large = clone(base); large.attempt.notes = '\u0001'.repeat(10000);
  assert.equal(validator(large), true, 'Bounded escaped notes fit transport');
});

test('shared history validates every task, mode and byte while excluding duplicate or private work', () => {
  const state = blank(), other = blank(Data.lessons[1]).attempt;
  other.notes = 'Разбор другой задачи в этой комнате.';
  state.history = [other];
  assert.equal(validator(state), true, 'An earlier task can be restored even when another lesson is active');
  const home = { version: 1, view: { view: 'home' }, attempt: null, history: [state.attempt, other], feedback: null, panels: panels() };
  assert.equal(validator(home), true, 'Home retains the room archive');
  const route = clone(home); route.view = { view: 'route', route: Data.routes[0].id };
  assert.equal(validator(route), true, 'Route navigation does not discard the room archive');
  const otherMode = blank(Data.lessons[0], Data.lessons[0].tasks[0], 'solo').attempt;
  const modes = clone(state); modes.history.push(otherMode);
  assert.equal(validator(modes), true, 'Learning and solo attempts are distinct for the same task');
  const mutations = [
    s => { delete s.history; }, s => { s.history = {}; },
    s => { s.history.push(clone(s.history[0])); },
    s => { s.history.push(clone(s.attempt)); },
    s => { s.history[0].taskId = 'another-task'; },
    s => { s.history[0].mode = 'private'; },
    s => { s.history[0].answers[1] = 'hidden future draft'; },
    s => { s.history[0].solved[0] = true; s.history[0].answers[0] = '-987654'; },
    s => { s.history[0].hints[0] = true; },
    s => { s.history[0].updated = 0.5; },
    s => { s.history[0].plotPoints = [[1, 2]]; },
    s => { delete s.history[0].plotPoints; },
    s => { s.history[0].privateProgress = {}; },
    s => { s.history[0].notes = '<img src=x>'; },
    s => { s.history[0].notes = '\u0001'.repeat(10000); s.attempt.notes = 'A'.repeat(10000); }
  ];
  for (const mutate of mutations) { const forged = clone(state); mutate(forged); assert.equal(validator(forged), false, String(mutate)); }
  let getterRead = false;
  const accessor = clone(state);
  Object.defineProperty(accessor.history[0], 'notes', { enumerable: true, get() { getterRead = true; return ''; } });
  assert.equal(validator(accessor), false); assert.equal(getterRead, false, 'Archived accessors are never evaluated');
});

test('a room apply cannot replace personal work on the independent practice page', () => {
  const w = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
    url: ORIGIN + URL_PATH + SELECTION, runScripts: 'outside-only', pretendToBeVisual: true
  }).window;
  try {
    w.scrollTo = () => {};
    const personal = blank(); personal.attempt.notes = 'Личная запись'; delete personal.attempt.plotPoints;
    const seed = { version: 1, attempts: { ['learn:' + personal.attempt.taskId]: personal.attempt } };
    w.localStorage.setItem(STORE, JSON.stringify(seed));
    for (const script of w.document.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(ROOT, new URL(script.src).pathname), 'utf8'));
    assert.equal(w.VPRBoardMode, false);
    const before = clone(w.VPRApp.snapshot()), saved = w.localStorage.getItem(STORE);
    const incoming = w.JSON.parse(JSON.stringify(blank()));
    assert.equal(w.VPRBoard.validateState(incoming), true);
    assert.throws(() => w.applyBoardTrainerState(incoming), /Invalid VPR board state/);
    assert.deepEqual(clone(w.VPRApp.snapshot()), before);
    assert.equal(w.localStorage.getItem(STORE), saved);
  } finally { w.close(); }
});

test('missing shared assets fail closed without consulting personal storage', () => {
  for (const missing of ['board-mode.js', 'board.js', 'board-bridge.js']) {
    const w = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
      url: ORIGIN + URL_PATH + SELECTION + '&board=1', runScripts: 'outside-only', pretendToBeVisual: true
    }).window;
    try {
      let reads = 0;
      Object.defineProperty(w, 'localStorage', { get() { reads++; throw new Error('Personal storage was touched'); } });
      w.scrollTo = () => {};
      for (const script of w.document.querySelectorAll('script[src]')) {
        const file = new URL(script.src).pathname;
        if (!file.endsWith('/' + missing)) w.eval(fs.readFileSync(path.join(ROOT, file), 'utf8'));
      }
      assert.equal(w.VPRBoardMode, true, missing);
      assert.equal(reads, 0, missing);
      if (missing === 'board-mode.js') {
        assert.equal(w.VPRBoard.canWrite(), true, 'The independent app privacy guard permits a working bridge');
      } else {
        const before = clone(w.VPRApp.snapshot());
        const input = w.document.querySelector('.step.current [data-answer]');
        input.value = '720'; input.dispatchEvent(new w.Event('input', { bubbles: true }));
        w.document.querySelector('.step.current [data-action=check]').click();
        assert.deepEqual(clone(w.VPRApp.snapshot()), before, missing + ' prevents an unsynchronized edit');
      }
      w.VPRBoard?.destroy();
    } finally { w.close(); }
  }
});

test('two real room participants share drafts, invalid feedback, errors, hints, shown steps, notes and reverse control', async t => {
  const p = await pair(t), { a, b } = p;
  assert.equal(a.state().view.task, 'g5-natural-3', 'A cabinet task survives empty-room hydration');
  await mirrored(a, b, () => answer(a, 'нет числа'));
  assert.equal(b.state().attempt.mistakes[0], 0); assert.ok(b.state().feedback.text.includes('Введи число'));
  await mirrored(a, b, () => answer(a, '-1'));
  await mirrored(a, b, () => a.click('.step.current [data-action=check]'));
  assert.equal(b.state().attempt.mistakes[0], 2);
  await mirrored(a, b, () => a.click('[data-action=hint]'));
  await mirrored(a, b, () => a.click('[data-action=solution]'));
  assert.equal(b.state().attempt.shown[0], true);
  await mirrored(a, b, () => a.toggle('.notes'));
  await mirrored(a, b, () => a.fill('#task-notes', 'Общее решение: 24 × x = 936. Личных данных здесь нет.'));
  await mirrored(a, b, () => a.toggle('.theory'));
  await mirrored(a, b, () => answer(a, '216'));
  await mirrored(a, b, () => a.fill('.step.current [data-answer]', '9/'));
  const before = b.state(), sent = b.stats.sent;
  b.fill('.step.current [data-answer]', '999'); b.click('[data-action=restart]');
  await pause(90); assert.deepEqual(b.state(), before); assert.equal(b.stats.sent, sent, 'Observer events cannot mutate or send');
  await grant(p, true); assert.equal(b.api.canWrite(), true); assert.equal(a.api.canWrite(), false);
  await mirrored(b, a, () => answer(b, '9'));
  await mirrored(b, a, () => answer(b, '39'));
  assert.equal(a.w.document.querySelectorAll('.step.done').length, 4);
  assert.deepEqual(await roomSnapshot(p), b.state());
});

test('previous tasks survive control transfer, a home-page reconnect and separate learning/practice attempts', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => answer(a, '-1'));
  await mirrored(a, b, () => a.click('.step.current [data-action=check]'));
  await mirrored(a, b, () => a.click('[data-action=hint]'));
  await mirrored(a, b, () => a.click('[data-action=solution]'));
  await mirrored(a, b, () => a.fill('.step.current [data-answer]', '21/'));
  await mirrored(a, b, () => a.fill('#task-notes', 'Первая задача: 936 = 720 + 216, черновик ещё не закончен.'));
  const first = a.state().attempt;

  await mirrored(a, b, () => selectTask(a, 'g10', 'g10-graphs-build', 'g10-graphs-build-1'));
  for (const [x, y] of [[1, -3], [0, -2], [2, -2]]) await mirrored(a, b, () => {
    a.fill('#plot-x', x); a.fill('#plot-y', y); a.click('[data-action=plot-add]');
  });
  await mirrored(a, b, () => a.fill('#task-notes', 'Вторая задача: три точки параболы; вернуться к первой.'));
  const graph = a.state().attempt;

  // The new controller must recover work received from the previous writer,
  // not a private cache left in the original teacher's browser.
  await grant(p, true);
  await mirrored(b, a, () => selectTask(b, 'g5', 'g5-natural', 'g5-natural-3'));
  assert.deepEqual(b.state().attempt, first, 'Returning as the pupil retains draft, notes, mistakes, hint and shown step');
  assert.equal(b.q('.step.current [data-answer]').value, '21/');
  assert.equal(b.q('#task-notes').value, first.notes);
  await mirrored(b, a, () => b.fill('#task-notes', first.notes + ' Проверено вместе.'));
  const revisedFirst = b.state().attempt;
  await mirrored(b, a, () => b.click('[data-action=home]'));
  assert.equal(a.state().view.view, 'home');
  assert.equal(a.state().attempt, null);
  const storedHome = await roomSnapshot(p);

  b.close(); p.student.socket.disconnect();
  p.student = await participant(p.room, 'student'); t.after(() => p.student.socket.disconnect());
  const reloaded = surface(t, p.student, p.room, { storageBlocked: true });
  reloaded.send('mathexam:hydrate', p.student.joined.state.latestTrainerState.state, { mode: 'state' });
  assert.deepEqual(reloaded.state(), storedHome, 'An empty visible home page still restores earlier room work');
  await grant(p, true);
  await mirrored(reloaded, a, () => selectTask(reloaded, 'g5', 'g5-natural', 'g5-natural-3'));
  assert.deepEqual(reloaded.state().attempt, revisedFirst, 'A fresh participant recovers the revised first attempt');
  await mirrored(reloaded, a, () => selectTask(reloaded, 'g10', 'g10-graphs-build', 'g10-graphs-build-1'));
  assert.deepEqual(reloaded.state().attempt, graph, 'The complete earlier graph and notes survive navigation and reconnect');
  assert.equal(reloaded.w.document.querySelectorAll('[data-user-curve]').length, 1);

  await mirrored(reloaded, a, () => reloaded.click('[data-action=mode][data-mode=solo]'));
  await mirrored(reloaded, a, () => reloaded.click('[data-action=choice][data-choice="2"]'));
  await mirrored(reloaded, a, () => reloaded.click('[data-action=check]'));
  await mirrored(reloaded, a, () => reloaded.fill('#task-notes', 'Самостоятельный ответ, отдельный от разбора графика.'));
  const solo = reloaded.state().attempt;
  await mirrored(reloaded, a, () => reloaded.click('[data-action=mode][data-mode=learn]'));
  assert.deepEqual(reloaded.state().attempt, graph, 'Learning and solo work retain separate answers, points and notes');
  await mirrored(reloaded, a, () => reloaded.click('[data-action=mode][data-mode=solo]'));
  assert.deepEqual(reloaded.state().attempt, solo);
  await grant(p, false);
  await mirrored(a, reloaded, () => selectTask(a, 'g5', 'g5-natural', 'g5-natural-3'));
  assert.deepEqual(a.state().attempt, revisedFirst, 'Returning control to the teacher retains the pupil correction');
  assert.deepEqual(await roomSnapshot(p), a.state());
});

test('an oversized shared edit keeps all accepted work and the current view instead of evicting an older task', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => a.fill('#task-notes', 'A'.repeat(10000)));
  const first = a.state().attempt;
  await mirrored(a, b, () => selectTask(a, 'g6', 'g6-geometry', 'g6-geometry-3', 'solo'));
  await mirrored(a, b, () => a.fill('.step.current [data-answer]', '-3;'));
  await mirrored(a, b, () => a.fill('#task-notes', 'Вторая сохранённая запись.'));
  const before = a.state(), sent = a.stats.sent;
  // JSON escapes these 10,000 code points as 60,000 bytes. The single current
  // attempt fits, but together with accepted first-task notes it exceeds 64 KiB.
  a.fill('#task-notes', '\u0001'.repeat(10000));
  await pause(100);
  assert.deepEqual(a.state(), before, 'Overflow rolls back the edit atomically without changing accepted work');
  assert.deepEqual(b.state(), before, 'The peer still sees the last accepted snapshot');
  assert.equal(a.q('#task-notes').value, before.attempt.notes, 'The editor shows the retained notes');
  const warning = a.q('#board-save-warning');
  assert.equal(warning.getAttribute('role'), 'alert');
  assert.ok(warning.textContent.trim() && !warning.hidden, 'Capacity failure is visible to the editor');
  assert.equal(a.stats.sent, sent, 'An oversized state is not sent or silently truncated');
  assert.deepEqual(await roomSnapshot(p), before);
  await grant(p, true);
  await mirrored(b, a, () => selectTask(b, 'g5', 'g5-natural', 'g5-natural-3'));
  assert.deepEqual(b.state().attempt, first, 'Capacity handling never evicts the previously accepted task');
});

test('graph points, current mode and tuple answer survive late join and reconnect with storage blocked', async t => {
  const p = await pair(t, { group: true }), { a, b } = p;
  await mirrored(a, b, () => selectTask(a, 'g10', 'g10-graphs-build', 'g10-graphs-build-1'));
  await mirrored(a, b, () => a.toggle('.plot-lab'));
  for (const [x, y] of [[1, -3], [0, -2], [2, -2]]) await mirrored(a, b, () => {
    a.fill('#plot-x', x); a.fill('#plot-y', y); a.click('[data-action=plot-add]');
  });
  assert.equal(a.w.document.querySelectorAll('[data-user-curve]').length, 1);
  assert.equal(b.state().attempt.plotPoints.length, 3);
  await mirrored(a, b, () => a.click('[data-action=mode][data-mode=solo]'));
  assert.equal(b.state().panels.plot, false); assert.equal(b.w.document.querySelector('.plot-lab'), null);
  const correct = b.w.document.querySelector('[data-action=choice][data-choice="2"]');
  assert.ok(correct, 'Final choice is available without preceding hints');
  await mirrored(a, b, () => a.click('[data-action=choice][data-choice="2"]'));
  await mirrored(a, b, () => a.click('[data-action=check]'));
  await mirrored(a, b, () => selectTask(a, 'g6', 'g6-geometry', 'g6-geometry-3', 'solo'));
  await mirrored(a, b, () => a.fill('.step.current [data-answer]', '-3;'));
  await mirrored(a, b, () => a.toggle('.notes'));
  await mirrored(a, b, () => a.fill('#task-notes', 'Центральная симметрия: меняем оба знака.'));
  const stored = await roomSnapshot(p);
  b.close(); p.student.socket.disconnect();
  p.student = await participant(p.room, 'student'); t.after(() => p.student.socket.disconnect());
  const reloaded = surface(t, p.student, p.room, { group: true, storageBlocked: true });
  reloaded.send('mathexam:hydrate', p.student.joined.state.latestTrainerState.state, { mode: 'state' });
  assert.deepEqual(reloaded.state(), stored); assert.deepEqual(visible(reloaded), visible(a));
  assert.equal(reloaded.q('.step.current [data-answer]').value, '-3;');
  await grant(p, true);
  await mirrored(reloaded, a, () => answer(reloaded, '-3; 2'));
  assert.equal(a.state().attempt.solved.at(-1), true);
  assert.equal(a.state().attempt.mode, 'solo');
});

test('SDK refuses wrong sender, origin, instance, metadata and semantic state; room refuses observer writes', async t => {
  const p = await pair(t), { a, b } = p, baseline = b.state();
  const changed = clone(baseline); changed.attempt.notes = 'forged';
  b.send('mathexam:apply-trainer-state', changed, {}, 'https://example.invalid');
  b.send('mathexam:apply-trainer-state', changed, {}, ORIGIN, {});
  for (const extra of [{ trainerId: 'college-logarithms' }, { protocolVersion: 99 }, { stateSchemaVersion: 99 }, { trainerVersion: '9.0.0' }, { bridgeInstanceId: 'stale-instance' }]) b.send('mathexam:apply-trainer-state', changed, extra);
  const foreign = clone(changed); foreign.view.route = 'g10'; b.send('mathexam:apply-trainer-state', foreign);
  assert.deepEqual(b.state(), baseline, 'Rejected envelopes leave visible state unchanged');
  p.student.socket.emit('board:trainer-state-change', { roomId: p.room.roomId, token: p.student.token, trainerId: 'vpr-math', trainer: 'vpr-math', protocolVersion: 1, trainerVersion: '1.0.0', stateSchemaVersion: 1, state: changed });
  await pause(100); assert.deepEqual(await roomSnapshot(p), baseline, 'The real server rejects non-controller writes');
  await mirrored(a, b, () => a.fill('.step.current [data-answer]', '72'));
  const exported = b.api.getState(); exported.attempt.notes = 'mutated returned object';
  assert.notEqual(b.state().attempt.notes, exported.attempt.notes, 'Export cannot mutate live state');
});

test('existing host preparation preserves a pre-room selection and draft without putting private state in the URL', async t => {
  const p = await pair(t), { a } = p;
  await mirrored(a, p.b, () => selectTask(a, 'g6', 'g6-geometry', 'g6-geometry-3', 'solo'));
  await mirrored(a, p.b, () => a.fill('.step.current [data-answer]', '-3;'));
  await mirrored(a, p.b, () => a.fill('#task-notes', 'Черновик перед созданием комнаты'));
  const host = fs.readFileSync(path.join(ROOT, 'trainers/trainer-board.html'), 'utf8');
  const source = host.slice(host.indexOf('    function prepareProfileTrainerForRoom('), host.indexOf('    function compatLabel('));
  const registryEntry = { trainerId: 'vpr-math', protocolVersion: 1, trainerVersion: '1.0.0', stateSchemaVersion: 1 };
  const context = {
    URL, URLSearchParams, JSON, frame: { contentWindow: a.w }, location: { origin: ORIGIN, href: ORIGIN + '/trainers/trainer-board.html' },
    normalizeTrainer: value => value,
    canonicalTrainerFileFromUrl: value => new URL(value, ORIGIN + '/trainers/trainer-board.html').pathname.slice(1),
    mirrorEntryFromUrl: () => registryEntry,
    MathExamBoard: { validateState: value => ({ ok: validator(value) }) },
    shared: { roomId: 'synthetic-room', role: 'teacher' }, canWrite: () => true,
    bridgeStateFromPayload: payload => payload.trainerId === 'vpr-math'
  };
  vm.createContext(context); vm.runInContext(source, context);
  const prepared = context.prepareProfileTrainerForRoom(URL_PATH + SELECTION + '&studentId=private-context');
  assert.ok(prepared);
  assert.equal(prepared.url, URL_PATH + '?route=g6&lesson=g6-geometry&task=g6-geometry-3&mode=solo');
  assert.deepEqual(prepared.payload.state, a.state());
  assert.equal(prepared.url.includes('Черновик'), false); assert.equal(prepared.url.includes('studentId'), false);
  context.shared.preparedProfileTrainer = { roomId: context.shared.roomId, ...prepared };
  assert.deepEqual(context.takePreparedProfileTrainer(null), prepared.payload);
  assert.equal(context.takePreparedProfileTrainer(null), null, 'Prepared draft can be consumed only once');
  context.shared.preparedProfileTrainer = { roomId: context.shared.roomId, ...prepared };
  assert.equal(context.takePreparedProfileTrainer({ latestTrainerState: {} }), null, 'Authoritative existing room always wins');
  const reloaded = surface(t, p.teacher, p.room, { selection: new URL(prepared.url, ORIGIN).search, storageBlocked: true });
  assert.equal(reloaded.state().view.task, 'g6-geometry-3', 'Fresh seeded URL retains changed selection');
  reloaded.send('mathexam:hydrate', prepared.payload.state, { mode: 'state' });
  assert.deepEqual(reloaded.state(), a.state(), 'Draft is restored through normal SDK hydration');
});
