'use strict';

// Two isolated, actual entry pages use the shared SDK and the real local
// Socket.IO service. Parent shims translate protocol envelopes only. The
// separate Chromium gate covers native events, board-host controls and layout.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { io } = require('../../board-server/node_modules/socket.io-client');
const D = require('./data.js');
const ROOT = path.resolve(__dirname, '../..');
const STORE = 'mathExam.collegeLogarithms.v1';
const URL_PATH = '/trainers/college-logarithms/index.html';
const ORIGIN = 'https://mathexam.space';
const clone = value => JSON.parse(JSON.stringify(value));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
// SVG accessibility/clip identifiers are unique per render, so a reloaded
// surface legitimately has different counters. Keep all geometry and labels.
const visibleMarkup = element => element.innerHTML.replace(/college-log-(plot|line)-\d+/g, 'college-log-$1-instance');
let server;

async function until(predicate, message, timeout = 4000) {
  const deadline = Date.now() + timeout;
  do { if (predicate()) return; await pause(10); } while (Date.now() < deadline);
  assert.fail(message);
}
function event(socket, name, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, receive); reject(new Error('Timed out: ' + name)); }, 4000);
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
    try { if ((await fetch(server.url + '/health')).ok) return; } catch (_) { /* Server is still binding. */ }
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
  return JSON.stringify({ version: 1, lastTask: role === 'teacher' ? 'profile-03' : 'base-02', attempts: {},
    results: { [role === 'teacher' ? 'profile-01' : 'base-01']: { completed: true, helpUsed: false, firstTry: true } } });
}
function surface(t, participant, room, options = {}) {
  const errors = [], messages = [];
  const stats = { reads: 0, writes: 0, network: 0, sent: 0, received: 0 };
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
    url: ORIGIN + URL_PATH + '?board=1', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole
  });
  const w = dom.window, seed = personalSeed(participant.role);
  w.localStorage.setItem(STORE, seed);
  w.localStorage.setItem('unrelated-personal-key', participant.role);
  const originalGet = w.Storage.prototype.getItem;
  const originalSet = w.Storage.prototype.setItem;
  const originalRemove = w.Storage.prototype.removeItem;
  const originalClear = w.Storage.prototype.clear;
  w.Storage.prototype.getItem = function (...args) { stats.reads++; return originalGet.apply(this, args); };
  w.Storage.prototype.setItem = function (...args) { stats.writes++; return originalSet.apply(this, args); };
  w.Storage.prototype.removeItem = function (...args) { stats.writes++; return originalRemove.apply(this, args); };
  w.Storage.prototype.clear = function (...args) { stats.writes++; return originalClear.apply(this, args); };
  if (options.storageBlocked) Object.defineProperty(w, 'localStorage', { get() { stats.reads++; throw new w.DOMException('Blocked', 'SecurityError'); } });
  w.fetch = () => { stats.network++; throw new Error('Shared trainer must not fetch personal data'); };
  w.XMLHttpRequest.prototype.send = () => { stats.network++; throw new Error('Shared trainer must not send personal data'); };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  const parent = { location: { origin: ORIGIN, pathname: '/trainers/trainer-board.html' }, postMessage(data, targetOrigin) {
    assert.equal(targetOrigin, ORIGIN, 'Exact trusted parent origin');
    messages.push(clone(data));
    if (data.type !== 'mathexam:trainer-state') return;
    stats.sent++;
    participant.socket.emit('board:trainer-state-change', { roomId: room.roomId, token: participant.token, ...clone(data), trainer: data.trainerId });
  } };
  Object.defineProperty(w, 'parent', { configurable: true, value: parent });
  for (const script of w.document.querySelectorAll('script[src]')) {
    const url = new URL(script.getAttribute('src'), w.location.href);
    assert.equal(url.origin, ORIGIN, 'Actual page uses local dependencies');
    w.eval(fs.readFileSync(path.join(ROOT, url.pathname), 'utf8') + '\n//# sourceURL=' + url.pathname);
  }
  const api = w.CollegeLogarithmsBoard;
  assert.ok(api && w.CollegeLogarithmsApp, 'Actual entry page registers its application and semantic adapter');
  const f = {
    w, api, stats, messages, closed: false,
    q(selector) { const el = w.document.querySelector(selector); assert.ok(el, 'Missing control ' + selector); return el; },
    all(selector) { return [...w.document.querySelectorAll(selector)]; },
    state() { return clone(api.getState()); },
    send(type, state, extra = {}) {
      const ready = messages.find(m => m.type === 'mathexam:trainer-ready');
      assert.ok(ready, 'Actual SDK announced readiness');
      const data = { ...ready, type, ...extra };
      if (state !== undefined) data.state = state;
      w.dispatchEvent(new w.MessageEvent('message', { data: w.JSON.parse(JSON.stringify(data)), origin: ORIGIN, source: parent }));
    },
    click(selector) {
      const el = f.q(selector); assert.notEqual(el.disabled, true); assert.equal(el.closest('[hidden]'), null, selector + ' must be visible'); el.click();
    },
    fill(selector, value) {
      const el = f.q(selector); assert.equal(el.closest('[hidden]'), null, selector + ' must be visible');
      el.value = String(value); el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    },
    checkClean() {
      assert.deepEqual(errors, [], 'No application runtime errors');
      assert.equal(stats.network, 0); assert.equal(stats.reads, 0); assert.equal(stats.writes, 0);
      if (!options.storageBlocked) {
        assert.equal(originalGet.call(w.localStorage, STORE), seed, 'Existing independent results remain byte-identical');
        assert.equal(originalGet.call(w.localStorage, 'unrelated-personal-key'), participant.role);
      }
      assert.equal(f.q('#personal-progress').hidden, true, 'Room does not claim personal independent credit');
      assert.equal(api.validateState(api.getState()), true);
    },
    close() {
      if (f.closed) return;
      f.checkClean(); f.closed = true; participant.socket.off('board:trainer-state-change', receive); api.destroy(); w.close();
    }
  };
  function receive(payload) { stats.received++; f.send('mathexam:apply-trainer-state', payload.state); }
  participant.socket.on('board:trainer-state-change', receive);
  t.after(() => f.close());
  return f;
}
async function pair(t) {
  const response = await fetch(server.url + '/api/rooms', { method: 'POST' });
  assert.equal(response.status, 201);
  const room = await response.json();
  const teacher = await participant(room, 'teacher'), student = await participant(room, 'student');
  t.after(() => { teacher.socket.disconnect(); student.socket.disconnect(); });
  const changed = event(student.socket, 'board:trainer-url-change');
  teacher.socket.emit('board:trainer-url-change', { roomId: room.roomId, token: teacher.token, trainerUrl: URL_PATH });
  assert.equal((await changed).trainerUrl, URL_PATH);
  const a = surface(t, teacher, room);
  a.send('mathexam:hydrate', undefined, { mode: 'empty' });
  const first = event(student.socket, 'board:trainer-state-change');
  a.send('mathexam:request-trainer-state');
  const payload = await first;
  const b = surface(t, student, room);
  b.send('mathexam:hydrate', payload.state, { mode: 'state' });
  assert.deepEqual(b.state(), a.state());
  return { room, teacher, student, a, b };
}
async function mirrored(writer, reader, action) {
  const sent = writer.stats.sent, echoed = reader.stats.sent, received = reader.stats.received;
  action();
  await until(() => writer.stats.sent > sent && reader.stats.received > received &&
    JSON.stringify(writer.state()) === JSON.stringify(reader.state()), 'Visible operation must mirror through the real local service');
  await pause(70);
  assert.equal(reader.stats.sent, echoed, 'Remote render must not echo');
}
function openModule(f, id) {
  if (!f.state().panels.route) f.click('#route-toggle');
  f.click('[data-module="' + id + '"]');
}
function answer(f, step) {
  if (step.kind === 'choice') f.click('[data-choice="' + step.answer + '"]');
  if (step.kind === 'number') f.fill('#answer', step.answer);
  if (step.kind === 'point') { f.fill('#point-x', step.answer.x); f.fill('#point-y', step.answer.y); }
  if (step.kind === 'interval') {
    const a = step.answer;
    f.fill('#interval-lo', a.lo === null ? '-inf' : a.lo); f.fill('#interval-hi', a.hi === null ? '+inf' : a.hi);
    f.fill('#interval-left', a.loClosed ? '[' : '('); f.fill('#interval-right', a.hiClosed ? ']' : ')');
  }
  if (step.kind === 'transform') for (const key of ['base', 'h', 'k', 'sign']) f.fill('#graph-' + key, step.answer[key]);
  f.click('#check');
}
async function grant(p, studentTurn) {
  const changed = event(p.student.socket, 'control:changed');
  p.teacher.socket.emit(studentTurn ? 'control:grant' : 'control:revoke', { roomId: p.room.roomId, token: p.teacher.token });
  await changed;
}
async function roomSnapshot(p) {
  const value = event(p.teacher.socket, 'room:state'); p.teacher.socket.emit('room:state');
  return (await value).state.latestTrainerState.state;
}

test('actual entry mirrors choices, errors, partial number and hints without touching either personal history', async t => {
  const p = await pair(t), { a, b } = p;
  assert.equal(a.state().taskId, 'meaning-01');
  assert.equal(b.stats.sent, 0);
  const task = D.getTask(a.state().taskId), first = task.steps[0];
  const wrong = first.options.find(o => o.value !== first.answer);
  await mirrored(a, b, () => { a.click('[data-choice="' + wrong.value + '"]'); a.click('#check'); });
  assert.equal(b.state().feedback, 'wrong'); assert.equal(b.state().errors.s1, 1);
  assert.equal(a.q('#feedback').textContent, b.q('#feedback').textContent);
  await mirrored(a, b, () => answer(a, first));
  assert.equal(b.state().stage, 1); assert.equal(b.all('#history .history-item').length, 1);
  await mirrored(a, b, () => a.fill('#answer', '1/'));
  assert.equal(b.q('#answer').value, '1/');
  await mirrored(a, b, () => a.click('#hint-toggle'));
  assert.equal(b.state().helpUsed, true); assert.equal(b.state().hintOpen, true);
  assert.equal(b.q('#answer').value, '1/'); assert.ok(b.q('#hint').textContent.trim());
  await mirrored(a, b, () => a.click('#hint-toggle'));
  assert.equal(b.state().hintOpen, false); assert.equal(b.state().helpUsed, true);
  await mirrored(a, b, () => answer(a, task.steps[1]));
  assert.equal(b.state().feedback, 'complete');
  assert.equal(b.all('#history .history-item').length, 2);
  assert.deepEqual(await roomSnapshot(p), b.state());
});

test('teacher and student build points, change the logarithm graph and solve an interval after handing over control', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => openModule(a, 'graph-up'));
  const task = D.getTask(a.state().taskId);
  assert.equal(a.all('[data-curve="function"]').length, 0, 'No curve is revealed before constructing points');
  await grant(p, true);
  for (const step of task.steps) await mirrored(b, a, () => answer(b, step));
  assert.equal(a.state().stage, task.steps.length);
  assert.equal(a.all('[data-point="checked"]').length, 3);
  assert.equal(a.all('[data-curve="function"]').length, 1);
  assert.equal(visibleMarkup(a.q('#visual')), visibleMarkup(b.q('#visual')), 'Both participants see identical plotted evidence');

  await mirrored(b, a, () => openModule(b, 'graph-moves'));
  const transformTask = D.getTask(b.state().taskId);
  await mirrored(b, a, () => answer(b, transformTask.steps[0]));
  await mirrored(b, a, () => b.fill('#graph-h', -2));
  assert.equal(a.state().graph.h, -2); assert.equal(a.q('#graph-h').value, '-2');
  await mirrored(b, a, () => answer(b, transformTask.steps[1]));
  await mirrored(b, a, () => b.click('#lab-toggle'));
  await mirrored(b, a, () => b.fill('#graph-h', -1));
  await mirrored(b, a, () => b.click('#lab-toggle'));
  assert.equal(a.state().graph.h, 2, 'Returning from exploration restores the accepted transformation for the pending point');
  assert.equal(a.state().stage, 2); assert.equal(a.all('#history .history-item').length, 2);
  await mirrored(b, a, () => answer(b, transformTask.steps[2]));
  assert.equal(a.state().graph.h, 2);
  assert.equal(visibleMarkup(a.q('#visual')), visibleMarkup(b.q('#visual')));

  await grant(p, false);
  await mirrored(a, b, () => openModule(a, 'inequalities'));
  for (const step of D.getTask(a.state().taskId).steps) await mirrored(a, b, () => answer(a, step));
  assert.equal(b.state().feedback, 'complete');
  assert.equal(visibleMarkup(a.q('[data-log-interval]')), visibleMarkup(b.q('[data-log-interval]')));
  assert.deepEqual(await roomSnapshot(p), b.state());
});

test('late join reload restores graph, unfinished coordinates and help with inaccessible personal storage', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => openModule(a, 'graph-down'));
  await mirrored(a, b, () => a.fill('#point-x', '1/'));
  await mirrored(a, b, () => a.click('#hint-toggle'));
  await mirrored(a, b, () => a.click('#lab-toggle'));
  await mirrored(a, b, () => a.fill('#graph-k', 2));
  const saved = await roomSnapshot(p);
  b.close(); p.student.socket.disconnect();
  p.student = await participant(p.room, 'student');
  t.after(() => p.student.socket.disconnect());
  const hydrated = p.student.joined.state.latestTrainerState.state;
  assert.deepEqual(hydrated, saved, 'Actual room retains the exact semantic snapshot');
  const reloaded = surface(t, p.student, p.room, { storageBlocked: true });
  reloaded.send('mathexam:hydrate', hydrated, { mode: 'state' });
  assert.deepEqual(reloaded.state(), a.state());
  assert.equal(reloaded.q('#point-x').value, '1/'); assert.equal(reloaded.q('#graph-k').value, '2');
  assert.equal(reloaded.state().hintOpen, true); assert.equal(reloaded.state().helpUsed, true);
  assert.equal(visibleMarkup(reloaded.q('#visual')), visibleMarkup(a.q('#visual')));
  assert.equal(reloaded.stats.sent, 0);
  await grant(p, true);
  await mirrored(reloaded, a, () => reloaded.click('#lab-toggle'));
  assert.equal(a.state().graph.k, 0); assert.equal(a.q('#point-x').value, '1/');
  assert.equal(a.state().helpUsed, true, 'Closing help does not erase its use');
});

test('an observer cannot change the authoritative room; valid navigation still works after rejection', async t => {
  const p = await pair(t), { a, b } = p;
  await mirrored(a, b, () => a.click('#route-toggle'));
  const before = await roomSnapshot(p), forged = clone(before); forged.panels.route = false;
  p.student.socket.emit('board:trainer-state-change', {
    roomId: p.room.roomId, token: p.student.token, trainer: 'college-logarithms', trainerId: 'college-logarithms',
    protocolVersion: 1, trainerVersion: '1.0.0', stateSchemaVersion: 1, state: forged
  });
  await pause(100);
  assert.deepEqual(await roomSnapshot(p), before);
  assert.deepEqual(a.state(), before); assert.deepEqual(b.state(), before);
  await mirrored(a, b, () => a.click('[data-module="base"]'));
  assert.equal(b.state().taskId, 'base-01'); assert.equal(b.q('#hint-toggle').hidden, true);
  assert.equal(b.q('#lab').hidden, true); assert.equal(b.q('#theory-toggle').hidden, true);
  await mirrored(a, b, () => answer(a, D.getTask('base-01').steps[0]));
  assert.equal(b.state().feedback, 'complete');
  assert.match(b.q('#completion').textContent, /осталось на доске/);
});
