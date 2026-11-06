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
const STORE = 'mathExam.collegeLogarithms.v1';
const URL_PATH = '/trainers/college-logarithms/index.html';
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
  const api = w.LogCourseBoard;
  assert.ok(api && registration, 'Actual trainer entry loads and registers its semantic adapter');
  assert.equal(registration.id, 'college-logarithms');
  assert.equal(registration.version, '1.0.0');
  assert.equal(registration.stateSchemaVersion, 1);
  const f = {
    w, api, p, stats, messages, diagnostics, closed: false,
    q(selector) { const el = w.document.querySelector(selector); assert.ok(el, 'Missing control ' + selector); return el; },
    all(selector) { return [...w.document.querySelectorAll(selector)]; },
    state() { return clone(api.getState()); },
    snapshot() { return clone(w.LogCourseApp.snapshot()); },
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


function answer(f,value){f.fill('#answer',value);f.click('#check');}
test('real teacher/pupil room preserves input, errors, hints, notes, parameters and reverse control',async t=>{
 const p=await pair(t),{a,b}=p;
 await mirrored(a,b,()=>answer(a,'Недопустимо'));assert.equal(b.state().errors,1);assert.equal(a.q('#feedback').textContent,b.q('#feedback').textContent);
 await mirrored(a,b,()=>a.click('#hint'));await mirrored(a,b,()=>a.click('#hint'));assert.equal(b.state().hint,2);
 await mirrored(a,b,()=>answer(a,'Допустимо'));assert.equal(b.state().stage,1);
 await mirrored(a,b,()=>a.fill('#notes','ОДЗ: аргумент > 0; мой вопрос'));assert.equal(b.q('#notes').value,a.q('#notes').value);
 await mirrored(a,b,()=>a.click('#lab > summary'));
 await mirrored(a,b,()=>a.fill('#base','0.5'));
 await mirrored(a,b,()=>a.fill('#shift-h','2'));
 await mirrored(a,b,()=>a.fill('#shift-k','-1'));
 assert.equal(a.q('#lab-graph').outerHTML,b.q('#lab-graph').outerHTML);assert.equal(a.q('#lab-facts').textContent,b.q('#lab-facts').textContent);
 await grant(p,true);await mirrored(b,a,()=>b.fill('#chapter','inequalities'));await mirrored(b,a,()=>b.fill('#task','inequalities-3'));
 await mirrored(b,a,()=>answer(b,'Допустимо'));await mirrored(b,a,()=>b.fill('#answer','(2;'));
 assert.equal(a.q('#answer').value,'(2;');assert.deepEqual(await roomSnapshot(p),a.state());
 const seed=await roomSnapshot(p);b.close();p.student.socket.disconnect();p.student=await participant(p.room,'student');t.after(()=>p.student.socket.disconnect());
 const reload=surface(t,p.student,p.room,{storageBlocked:true});reload.send('mathexam:hydrate',p.student.joined.state.latestTrainerState.state,{mode:'state'});assert.deepEqual(reload.state(),seed);assert.equal(reload.q('#answer').value,'(2;');await grant(p,true);
 await mirrored(reload,a,()=>answer(reload,'(2; inf)'));await mirrored(reload,a,()=>answer(reload,'Меняется'));await mirrored(reload,a,()=>answer(reload,'9/4'));await mirrored(reload,a,()=>answer(reload,'(2;9/4)'));
 assert.equal(a.state().stage,5);assert.equal(a.q('#history').children.length,5);assert.deepEqual(a.snapshot().attempts,{});assert.deepEqual(reload.snapshot().attempts,{});
});
test('real transport keeps computed points and final curve equal; rejects observer writes and forged accepted steps',async t=>{
 const p=await pair(t),{a,b}=p;await mirrored(a,b,()=>a.fill('#chapter','graphs'));await mirrored(a,b,()=>a.fill('#task','graphs-2'));
 for(const s of Data.tasks.find(t=>t.id==='graphs-2').steps){await mirrored(a,b,()=>answer(a,s.kind==='point'?s.answer.join('; '):s.answer));assert.equal(a.q('#task-graph').outerHTML,b.q('#task-graph').outerHTML);}
 assert.equal(b.all('#task-graph [data-point]').length,3);assert.equal(b.all('#task-graph [data-curve]').length,1);
 const good=b.state(),forged={...good,stage:99};assert.equal(b.api.validateState(b.w.JSON.parse(JSON.stringify(forged))),false);b.send('mathexam:apply-trainer-state',forged);assert.deepEqual(b.state(),good);
 const wrong={...good,drafts:good.drafts.map(()=>'-99')};b.send('mathexam:apply-trainer-state',wrong);assert.deepEqual(b.state(),good);
 p.student.socket.emit('board:trainer-state-change',{roomId:p.room.roomId,token:p.student.token,trainerId:'college-logarithms',trainer:'college-logarithms',protocolVersion:1,trainerVersion:'1.0.0',stateSchemaVersion:1,state:{...good,note:'observer write'}});
 await pause(100);assert.deepEqual(await roomSnapshot(p),good);
 await grant(p,true);await mirrored(b,a,()=>b.click('#test'));assert.equal(a.state().mode,'test');assert.equal(a.state().hint,0);assert.equal(a.q('#lab').hidden,true);
});
