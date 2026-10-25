'use strict';

// Actual entry page, adapter and shared SDK in two isolated DOMs, connected by
// the real local Socket.IO service. The small parent transport below translates
// SDK envelopes only; it never reads or mutates the trainer's application state.
// Browser layout and the production board host are separate release checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { io } = require('../../board-server/node_modules/socket.io-client');
const Data = require('./data.js');
const ROOT = path.resolve(__dirname, '../..');
const STORE = 'mathExam.collegeFunctions.v1';
const URL_PATH = '/trainers/college-functions/index.html';
const ORIGIN = 'https://mathexam.space';
const clone = value => JSON.parse(JSON.stringify(value));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let server;

async function until(predicate, message, timeout = 3500) {
  const deadline = Date.now() + timeout;
  do {
    if (predicate()) return;
    await pause(10);
  } while (Date.now() < deadline);
  assert.fail(message);
}

function event(socket, name, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, receive); reject(new Error('Timed out: ' + name)); }, 3500);
    function receive(value) {
      if (!predicate(value)) return;
      clearTimeout(timer); socket.off(name, receive); resolve(value);
    }
    socket.on(name, receive);
  });
}

test.before(async () => {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port) };
  delete env.TRAINER_REGISTRY_PATH;
  delete env.PROGRESS_STORE_PATH;
  delete env.PROGRESS_PERSISTENCE_CONFIRMED;
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stdout.resume(); child.stderr.on('data', chunk => { stderr += chunk; });
  server = { child, url: 'http://127.0.0.1:' + port };
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    assert.equal(child.exitCode, null, 'Board server exited: ' + stderr);
    try { if ((await fetch(server.url + '/health')).ok) return; } catch (_) { /* Port still binding. */ }
    await pause(40);
  }
  assert.fail('Local board server did not become healthy: ' + stderr);
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

function personalSeed(role) {
  return JSON.stringify({ attempts: {}, results: { ['test:' + (role === 'teacher' ? 'E3' : 'F4')]: { completed: true, fresh: true, helpUsed: false, errors: 0 } }, seen: { F8: true }, last: { id: 'F8', mode: 'test' }, diagnostic: { correct: 7, date: 123 } });
}

function surface(t, p, room, options = {}) {
  const errors = [], messages = [], diagnostics = [];
  const stats = { reads: 0, writes: 0, network: 0, sent: 0, received: 0, notifications: 0 };
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
    url: ORIGIN + URL_PATH + '?board=1', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
  });
  const w = dom.window;
  const seed = personalSeed(p.role);
  w.localStorage.setItem(STORE, seed);
  w.localStorage.setItem('unrelated-personal-key', p.role);
  const originalGet = w.Storage.prototype.getItem;
  const originalSet = w.Storage.prototype.setItem;
  const originalRemove = w.Storage.prototype.removeItem;
  const originalClear = w.Storage.prototype.clear;
  w.Storage.prototype.getItem = function (...args) { stats.reads++; return originalGet.apply(this, args); };
  w.Storage.prototype.setItem = function (...args) { stats.writes++; return originalSet.apply(this, args); };
  w.Storage.prototype.removeItem = function (...args) { stats.writes++; return originalRemove.apply(this, args); };
  w.Storage.prototype.clear = function (...args) { stats.writes++; return originalClear.apply(this, args); };
  if (options.storageBlocked) Object.defineProperty(w, 'localStorage', { get() { stats.reads++; throw new w.DOMException('Blocked', 'SecurityError'); } });
  w.fetch = () => { stats.network++; throw new Error('Trainer must not fetch personal data'); };
  w.XMLHttpRequest.prototype.send = () => { stats.network++; throw new Error('Trainer must not send XHR'); };
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  w.confirm = () => true;
  const parent = {
    location: { origin: ORIGIN, pathname: '/trainers/trainer-board.html' },
    postMessage(data, targetOrigin) {
      assert.equal(targetOrigin, ORIGIN, 'SDK uses an exact parent origin');
      messages.push(clone(data));
      if (data.type !== 'mathexam:trainer-state') return;
      stats.sent++;
      p.socket.emit('board:trainer-state-change', { roomId: room.roomId, token: p.token, ...clone(data), trainer: data.trainerId });
    }
  };
  Object.defineProperty(w, 'parent', { configurable: true, value: parent });
  w.addEventListener('mathexam:bridge-diagnostic', e => diagnostics.push(clone(e.detail)));
  let registration, bridge;
  for (const script of w.document.querySelectorAll('script[src]')) {
    const url = new URL(script.getAttribute('src'), w.location.href);
    assert.equal(url.origin, ORIGIN, 'Trainer dependencies remain local');
    w.eval(fs.readFileSync(path.join(ROOT, url.pathname), 'utf8') + '\n//# sourceURL=' + url.pathname);
    if (url.pathname.endsWith('/board-bridge.js')) {
      const sdk = w.MathExamBoard;
      w.MathExamBoard = Object.freeze({ ...sdk, register(config) {
        assert.equal(registration, undefined, 'The app registers one shared bridge');
        registration = config;
        bridge = sdk.register({ ...config, subscribe(notify) {
          return config.subscribe(() => { stats.notifications++; notify(); });
        } });
        return bridge;
      } });
    }
  }
  const api = w.CollegeFunctionsBoard;
  assert.ok(api && registration, 'Actual trainer entry loads and registers its semantic adapter');
  assert.equal(registration.id, 'college-functions');
  assert.equal(registration.version, '1.0.0');
  assert.equal(registration.stateSchemaVersion, 1);
  const f = {
    w, api, p, stats, messages, diagnostics, closed: false,
    q(selector) { const el = w.document.querySelector(selector); assert.ok(el, 'Missing control ' + selector); return el; },
    all(selector) { return [...w.document.querySelectorAll(selector)]; },
    state() { return clone(api.getState()); },
    snapshot() { return clone(w.CollegeFunctionsApp.snapshot()); },
    send(type, state, extra = {}) {
      const ready = messages.find(m => m.type === 'mathexam:trainer-ready');
      assert.ok(ready, 'SDK announces readiness before hydration');
      const data = { ...ready, type, ...extra };
      if (state !== undefined) data.state = state;
      w.dispatchEvent(new w.MessageEvent('message', { data: w.JSON.parse(JSON.stringify(data)), origin: ORIGIN, source: parent }));
    },
    click(selector) { const el = f.q(selector); assert.notEqual(el.disabled, true, selector + ' enabled'); el.click(); },
    fill(selector, value) {
      const el = f.q(selector); el.value = String(value);
      el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    },
    checkClean() {
      assert.deepEqual(errors, [], 'No browser runtime errors');
      assert.equal(stats.network, 0, 'The trainer makes no personal-service calls');
      assert.equal(stats.reads, 0, 'Board mode never reads personal browser storage');
      assert.equal(stats.writes, 0, 'Board mode never changes personal browser storage');
      if (!options.storageBlocked) {
        assert.equal(originalGet.call(w.localStorage, STORE), seed, 'Existing independent work is untouched');
        assert.equal(originalGet.call(w.localStorage, 'unrelated-personal-key'), p.role);
      }
      assert.equal(api.validateState(api.getState()), true, 'Visible state passes strict semantic validation');
    },
    close() { if (f.closed) return; f.checkClean(); f.closed = true; p.socket.off('board:trainer-state-change', receive); bridge.destroy(); w.close(); }
  };
  function receive(payload) { stats.received++; f.send('mathexam:apply-trainer-state', payload.state); }
  p.socket.on('board:trainer-state-change', receive);
  t.after(() => f.close());
  return f;
}

async function pair(t) {
  const response = await fetch(server.url + '/api/rooms', { method: 'POST' });
  assert.equal(response.status, 201);
  const room = await response.json();
  const teacher = await participant(room, 'teacher');
  const student = await participant(room, 'student');
  t.after(() => { teacher.socket.disconnect(); student.socket.disconnect(); });
  const changed = event(student.socket, 'board:trainer-url-change');
  teacher.socket.emit('board:trainer-url-change', { roomId: room.roomId, token: teacher.token, trainerUrl: URL_PATH });
  assert.equal((await changed).trainerUrl, URL_PATH);
  const a = surface(t, teacher, room);
  a.send('mathexam:hydrate', undefined, { mode: 'empty' });
  const initial = event(student.socket, 'board:trainer-state-change');
  a.send('mathexam:request-trainer-state');
  const payload = await initial;
  const b = surface(t, student, room);
  b.send('mathexam:hydrate', payload.state, { mode: 'state' });
  assert.deepEqual(b.state(), a.state());
  return { room, teacher, student, a, b };
}

async function mirrored(writer, reader, action) {
  const sent = writer.stats.sent, echoed = reader.stats.sent, received = reader.stats.received;
  action();
  await until(() => writer.stats.sent > sent && reader.stats.received > received && JSON.stringify(writer.state()) === JSON.stringify(reader.state()), 'Local action must arrive through Socket.IO and update the other rendered trainer');
  await pause(70); // Greater than the SDK's 40 ms debounce: a delayed echo is observable.
  assert.equal(reader.stats.sent, echoed, 'Applying a remote state must not echo it back');
  assert.equal(writer.api.validateState(writer.api.getState()), true);
  assert.equal(reader.api.validateState(reader.api.getState()), true);
}

async function grant(p, studentTurn) {
  const received = event(p.student.socket, 'control:changed');
  p.teacher.socket.emit(studentTurn ? 'control:grant' : 'control:revoke', { roomId: p.room.roomId, token: p.teacher.token });
  await received;
}

async function roomSnapshot(p) {
  const received = event(p.teacher.socket, 'room:state');
  p.teacher.socket.emit('room:state');
  return (await received).state.latestTrainerState.state;
}

function answer(f, values) {
  for (const [key, value] of Object.entries(values)) f.fill('[data-answer="' + key + '"]', value);
  f.click('#check-step');
}

test('the real standalone entry preserves personal resume and leaves the board adapter inactive', t => {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
    url: ORIGIN + URL_PATH, runScripts: 'outside-only', virtualConsole
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  const saved = JSON.parse(personalSeed('teacher'));
  w.localStorage.setItem(STORE, JSON.stringify(saved));
  for (const script of w.document.querySelectorAll('script[src]')) {
    const url = new URL(script.getAttribute('src'), w.location.href);
    assert.equal(url.origin, ORIGIN);
    w.eval(fs.readFileSync(path.join(ROOT, url.pathname), 'utf8'));
  }
  const state = clone(w.CollegeFunctionsApp.snapshot());
  assert.equal(state.taskId, 'F8'); assert.equal(state.mode, 'test');
  assert.deepEqual(state.store.results, saved.results);
  assert.equal(w.CollegeFunctionsBoard, undefined, 'Standalone does not register a board session');
  assert.match(w.document.querySelector('#progress-count').textContent, /1 самостоятельно/);
  assert.deepEqual(errors, []);
});

test('another-task navigation mirrors the full family cycle without depending on personal seen history', async t => {
  const { a, b } = await pair(t);
  for (const taskId of ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B1']) {
    await mirrored(a, b, () => a.click('#next-task'));
    assert.equal(b.state().taskId, taskId);
    assert.equal(b.state().stage, 0);
    assert.equal(b.q('#task-select').value, taskId);
  }
  a.checkClean(); b.checkClean();
});

test('initial hydration ignores both personal histories; task, mode, incomplete drafts and hints mirror without echoes', async t => {
  const p = await pair(t), { a, b } = p;
  assert.equal(a.state().taskId, 'B1');
  assert.equal(a.state().stage, 0);
  assert.equal(a.state().mode, 'learn');
  assert.equal(b.stats.sent, 0, 'Hydration does not publish the reader\'s state');
  assert.equal(a.snapshot().attempt.fresh, false, 'Shared work cannot start an independent attempt');
  for (const forbidden of ['store', 'results', 'seen', 'last', 'fresh', 'accepted']) assert.equal(Object.hasOwn(a.state(), forbidden), false, forbidden + ' stays outside shared state');
  await mirrored(a, b, () => a.fill('[data-answer="domain"]', '[-2;'));
  assert.equal(b.q('[data-answer="domain"]').value, '[-2;', 'Incomplete mathematical input is not normalized away');
  await mirrored(a, b, () => a.click('#toggle-help'));
  assert.equal(b.state().hintOpen, true); assert.equal(b.state().helpUsed, true);
  assert.equal(b.q('[data-answer="domain"]').value, '[-2;');
  assert.ok(b.q('#help-area').textContent.trim());
  await mirrored(a, b, () => a.click('#more-help'));
  assert.equal(b.state().hintLevel, 2);
  await mirrored(a, b, () => a.click('#close-help'));
  assert.equal(b.state().hintOpen, false); assert.equal(b.state().helpUsed, true);
  await mirrored(a, b, () => a.click('#test-mode'));
  assert.equal(b.state().mode, 'test'); assert.equal(b.state().taskId, 'B2');
  assert.equal(b.all('#toggle-help').length, 0);
  assert.equal(b.snapshot().attempt.fresh, false);
  await mirrored(a, b, () => a.click('[data-family="piecewise"]'));
  await mirrored(a, b, () => a.fill('#task-select', 'F4'));
  assert.equal(b.q('#task-id').textContent, 'F4');
  assert.match(b.q('#formula').textContent, /2x/);
  await mirrored(a, b, () => a.click('#learn-mode'));
  assert.equal(b.q('#learn-mode').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(await roomSnapshot(p), b.state(), 'Server stores the exact semantic state, including mode and task');
  a.checkClean(); b.checkClean();
});

test('teacher and student take turns through all eight steps: row feedback, plotted points, curve and completion remain identical', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => answer(a, { domain: 'R' }));
  assert.equal(b.state().stage, 0); assert.equal(b.state().errors, 1);
  assert.match(b.q('#feedback .bad').textContent, /допустимые x/);
  assert.equal(b.q('#feedback .bad').textContent, a.q('#feedback .bad').textContent);
  assert.equal(b.q('[data-answer="domain"]').value, 'R');
  await mirrored(a, b, () => answer(a, { domain: '[-2; +∞)' }));
  assert.equal(b.state().stage, 1); assert.equal(b.all('#history .done-step').length, 1);
  assert.ok(b.q('#feedback .good').textContent.length > 0, 'Correctness feedback is reconstructed on the reader');
  await mirrored(a, b, () => answer(a, { y0: '0', y1: '9', y2: '2', y3: '3' }));
  assert.equal(b.state().stage, 1);
  assert.equal(b.q('[data-answer="y0"]').classList.contains('valid'), true);
  assert.equal(b.q('[data-answer="y1"]').classList.contains('invalid'), true);
  assert.ok(b.q('#row-status-0').textContent.length > 0);
  assert.ok(b.q('#row-status-1').textContent.length > 0);
  await mirrored(a, b, () => answer(a, { y1: '1' }));
  assert.equal(b.state().stage, 2); assert.equal(b.all('#graph [data-curve]').length, 0);
  await grant(p, true);
  await mirrored(b, a, () => { b.fill('#plot-x', '-2'); b.fill('#plot-y', '8'); b.click('#place-point'); });
  assert.equal(a.state().marked, 0); assert.ok(a.q('#feedback .bad').textContent);
  for (const [x, y] of [[-2, 0], [-1, 1], [2, 2], [7, 3]]) {
    await mirrored(b, a, () => { b.fill('#plot-x', x); b.fill('#plot-y', y); b.click('#place-point'); });
    assert.equal(a.all('#graph [data-point="checked"]').length, b.state().marked);
  }
  assert.equal(a.state().stage, 3); assert.ok(a.all('#graph [data-curve]').length > 0);
  assert.deepEqual(a.all('#graph [data-curve]').map(el => el.getAttribute('d')), b.all('#graph [data-curve]').map(el => el.getAttribute('d')));
  await mirrored(b, a, () => answer(b, { range: '[0; +∞)' }));
  await mirrored(b, a, () => answer(b, { zeros: '-2' }));
  await grant(p, false);
  await mirrored(a, b, () => answer(a, { positive: '(-2; +∞)', negative: 'нет' }));
  await mirrored(a, b, () => answer(a, { up: '[-2; +∞)', down: 'нет', constant: 'нет' }));
  await mirrored(a, b, () => answer(a, { parity: 'neither' }));
  assert.equal(a.state().stage, 8); assert.equal(b.state().stage, 8);
  assert.equal(a.all('#history .done-step').length, 8);
  assert.equal(b.all('#history .done-step').length, 8);
  assert.match(b.q('#current-step').textContent, /График исследован/);
  assert.equal(a.snapshot().attempt.fresh, false); assert.equal(b.snapshot().attempt.fresh, false);
  assert.equal(Object.keys(a.snapshot().store.results).length, 0, 'Board completion creates no personal result');
  assert.equal(Object.keys(b.snapshot().store.results).length, 0, 'Reader completion creates no personal result');
  a.checkClean(); b.checkClean();
});

test('diagnostic choices, dialog and reference panels survive server hydration and a reload with inaccessible personal storage', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => a.fill('[data-answer="domain"]', '[-2;'));
  await mirrored(a, b, () => a.click('.reference > summary'));
  assert.equal(b.q('.reference').open, true);
  await mirrored(a, b, () => a.click('.course-tools > details:last-child > summary'));
  assert.equal(b.q('.course-tools > details:last-child').open, true);
  await mirrored(a, b, () => a.click('#diagnose'));
  assert.equal(b.q('#diagnostic-dialog').open, true);
  for (let i = 0; i < 3; i++) await mirrored(a, b, () => a.click('[data-diag="' + Data.diagnostics[i].correctId + '"]'));
  assert.equal(b.state().diagnostic.index, 3);
  assert.match(b.q('#diagnostic-body').textContent, /Вопрос 4 из 8/);
  const saved = await roomSnapshot(p);
  b.close();
  p.student.socket.disconnect();
  p.student = await participant(p.room, 'student');
  t.after(() => p.student.socket.disconnect());
  const hydrated = p.student.joined.state.latestTrainerState.state;
  assert.deepEqual(hydrated, saved, 'A late join receives the saved state from the real room service');
  const reloaded = surface(t, p.student, p.room, { storageBlocked: true });
  reloaded.send('mathexam:hydrate', hydrated, { mode: 'state' });
  assert.deepEqual(reloaded.state(), a.state());
  assert.equal(reloaded.q('[data-answer="domain"]').value, '[-2;');
  assert.equal(reloaded.q('#diagnostic-dialog').open, true);
  assert.equal(reloaded.q('.reference').open, true);
  assert.equal(reloaded.q('.course-tools > details:last-child').open, true);
  assert.equal(reloaded.stats.sent, 0, 'Reload hydration produces no echo');
  await grant(p, true);
  for (let i = 3; i < 8; i++) await mirrored(reloaded, a, () => reloaded.click('[data-diag="' + Data.diagnostics[i].correctId + '"]'));
  assert.match(a.q('#diagnostic-body').textContent, /8 \/ 8/);
  assert.equal(a.state().diagnostic.answers.length, 8);
  await mirrored(reloaded, a, () => reloaded.click('#close-diagnostic'));
  assert.equal(a.q('#diagnostic-dialog').open, false);
  assert.equal(a.q('[data-answer="domain"]').value, '[-2;');
  await mirrored(reloaded, a, () => reloaded.click('.reference > summary'));
  assert.equal(a.q('.reference').open, false);
  assert.deepEqual(await roomSnapshot(p), a.state());
  a.checkClean(); reloaded.checkClean();
});

test('a flawless shared test-mode solution earns no independent credit and cannot be restored with forged accepted answers', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => a.click('#test-mode'));
  assert.equal(b.state().taskId, 'B2');
  await mirrored(a, b, () => answer(a, { domain: '[3; +∞)' }));
  await mirrored(a, b, () => answer(a, { y0: '0', y1: '1', y2: '2', y3: '3' }));
  for (const [x, y] of [[3, 0], [4, 1], [7, 2], [12, 3]]) {
    await mirrored(a, b, () => { a.fill('#plot-x', x); a.fill('#plot-y', y); a.click('#place-point'); });
  }
  for (const values of [{ range: '[0; +∞)' }, { zeros: '3' }, { positive: '(3; +∞)', negative: 'нет' },
    { up: '[3; +∞)', down: 'нет', constant: 'нет' }, { parity: 'neither' }]) {
    await mirrored(a, b, () => answer(a, values));
  }
  assert.equal(b.state().stage, 8);
  assert.equal(b.state().errors, 0); assert.equal(b.state().helpUsed, false);
  for (const f of [a, b]) {
    assert.equal(f.snapshot().attempt.fresh, false);
    assert.deepEqual(f.snapshot().store.results, {}, 'Even perfect shared work cannot count as a personal independent result');
    assert.doesNotMatch(f.q('#current-step').textContent, /Новая задача решена самостоятельно/);
  }
  const completed = b.state();
  for (const [field, wrong] of Object.entries({ domain: 'R', y0: '99', range: 'R', zeros: 'нет', positive: 'R', negative: 'R', up: 'нет', down: 'R', constant: 'R', parity: 'even' })) {
    const forged = { ...completed, drafts: { ...completed.drafts, [field]: wrong } };
    assert.equal(b.api.validateState(b.w.JSON.parse(JSON.stringify(forged))), false, 'Accepted ' + field + ' must be rechecked on hydration');
    b.send('mathexam:apply-trainer-state', forged);
    assert.deepEqual(b.state(), completed, 'Rejected accepted answers do not alter completion');
  }
  a.checkClean(); b.checkClean();
});

test('strict semantic rejection is atomic; stale envelopes and observer writes cannot corrupt the mirrored work', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => answer(a, { domain: '[-2; +∞)' }));
  const good = b.state();
  const invalid = [
    { ...good, taskId: 'not-a-task' },
    { ...good, mode: 'admin' },
    { ...good, stage: 9 },
    { ...good, stage: 3 },
    { ...good, marked: 99 },
    { ...good, drafts: { ...good.drafts, domain: 'R' } },
    { ...good, drafts: { ...good.drafts, domain: 'x'.repeat(201) } },
    { ...good, drafts: { ...good.drafts, extra: 'unexpected' } },
    { ...good, errors: -1 },
    { ...good, feedback: 'arbitrary-html' },
    { ...good, diagnostic: { open: true, index: 1, answers: ['unknown-choice'] } },
    { ...good, diagnostic: { open: true, index: 2, answers: ['0'] } },
    { ...good, panels: { reference: 'yes', cheatsheet: false } },
    { ...good, store: { results: { injected: true } } }
  ];
  const beforeSent = b.stats.sent;
  for (const state of invalid) {
    assert.equal(b.api.validateState(b.w.JSON.parse(JSON.stringify(state))), false, 'Reject malformed semantic state: ' + JSON.stringify(state));
    b.send('mathexam:apply-trainer-state', state);
    assert.deepEqual(b.state(), good, 'Rejected state cannot partially mutate the active task');
    assert.equal(b.q('#task-id').textContent, 'B1');
    assert.equal(b.all('#history .done-step').length, 1);
  }
  const replacement = { ...good, drafts: { ...good.drafts, y0: '9' } };
  for (const extra of [{ trainerVersion: '0.0.0' }, { stateSchemaVersion: 99 }, { bridgeInstanceId: 'old-frame' }]) {
    b.send('mathexam:apply-trainer-state', replacement, extra);
    assert.deepEqual(b.state(), good, 'Old iframe/version envelopes are ignored');
  }
  p.student.socket.emit('board:trainer-state-change', {
    roomId: p.room.roomId, token: p.student.token, trainerId: 'college-functions', trainer: 'college-functions',
    protocolVersion: 1, trainerVersion: '1.0.0', stateSchemaVersion: 1, state: replacement
  });
  await pause(100);
  assert.deepEqual(await roomSnapshot(p), good, 'Server rejects writes from the participant without the turn');
  assert.deepEqual(a.state(), good); assert.deepEqual(b.state(), good);
  assert.equal(b.stats.sent, beforeSent, 'Rejected incoming messages never trigger outgoing state');
  await mirrored(a, b, () => a.fill('[data-answer="y0"]', '0'));
  assert.equal(b.q('[data-answer="y0"]').value, '0', 'Valid work still synchronizes after rejection');
  a.checkClean(); b.checkClean();
});
