'use strict';

// Real local Socket.IO transport, native jsdom trainer adapters and synthetic
// rooms only. This does not connect to production or use learner credentials.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const { io } = require('../board-server/node_modules/socket.io-client');
const ROOT = path.resolve(__dirname, '..');
const ENTRIES = require('./fixtures/oge-course-board-entries.json').map(entry => [0, entry.trainerId, entry.file.replace(/^trainers\//, '')]);
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
class LocalSources extends ResourceLoader {
  fetch(value) {
    const url = new URL(value);
    if (url.origin !== 'https://mathexam.space') return null;
    // The parent message boundary is supplied by the harness; exercise each
    // real registered getState/applyState over the server's real wire contract.
    if (url.pathname.endsWith('/board-bridge.js')) return Promise.resolve(Buffer.from(''));
    const file = path.resolve(ROOT, '.' + url.pathname);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) return null;
    return Promise.resolve(fs.readFileSync(file));
  }
}
async function boot(t, entry) {
  const [number, id, filename] = entry, errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  let config, accesses = 0, notifications = 0, personalStore;
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'trainers', filename), 'utf8'), {
    url: 'https://mathexam.space/trainers/' + filename + '?board=1',
    runScripts: 'dangerously', resources: new LocalSources(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: false }); window.TextEncoder = TextEncoder;
      window.scrollTo = () => {}; window.HTMLElement.prototype.scrollIntoView = () => {};
      window.HTMLCanvasElement.prototype.getContext = () => null;
      Object.defineProperty(window, 'parent', { value: { location: { origin: window.location.origin, pathname: '/trainers/trainer-board.html' } } });
      personalStore = window.localStorage;
      personalStore.setItem('unrelated-fixture', 'unchanged');
      Object.defineProperty(window, 'localStorage', { get() { accesses++; throw Error('Shared room touched personal storage'); } });
      window.MathExamBoard = { register(value) { config = value; config.subscribe(() => notifications++); } };
    }
  });
  t.after(() => { dom.window.OgeCourseProof?.dispose(); dom.window.close(); });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await new Promise(resolve => setTimeout(resolve, 100));
  const w = dom.window;
  assert.deepEqual(errors, [], id);
  assert(config, id + ' must register its native adapter');
  assert.equal(config.id, id);
  function input(selector, value) {
    const node = w.document.querySelector(selector); assert(node, selector);
    node.value = String(value); node.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  function click(selector) { const node = w.document.querySelector(selector); assert(node, selector); node.click(); }
  function editableField() {
    const explicit = w.document.querySelector('#m4-answer'); if (explicit && !explicit.disabled) return explicit;
    return [...w.document.querySelectorAll('input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea')].find(el => !el.disabled && !el.readOnly && !el.closest('[hidden]') && el.type !== 'number') ||
      [...w.document.querySelectorAll('input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea')].find(el => !el.disabled && !el.readOnly && !el.closest('[hidden]'));
  }
  function inputElement(el, value) { el.value = String(value); el.dispatchEvent(new w.Event('input', { bubbles: true })); }
  return {
    w, config, state: () => copy(config.getState()),
    async apply(state) { config.applyState(w.JSON.parse(JSON.stringify(state))); await tick(); },
    async enrich() {
      // Detailed per-family suites solve the native exercises. This gate sends
      // real room snapshots with an answer draft and a native click, then
      // exercises server authorization, late joining and controller handoff.
      if (id === 'practice-1-5-entry-diagnostic-2026') click('#start-btn');
      if (id === 'practice-1-5-routes-checkpoint-2026') click('#start');
      const field = editableField();
      if (field) inputElement(field, '987654');
      const check = [...w.document.querySelectorAll('button')].find(el => !el.disabled && !el.closest('[hidden]') && /^(Проверить|Проверить ответ)$/.test(el.textContent.trim()));
      if (check) check.click();
      await tick();
    },
    async change(value) {
      if (id === 'oge-task7-number-line') { click('.oge-foundation-toolbar button:nth-of-type(2)'); await tick(); return; }
      if (id === 'oge-task13-inequalities') { click('#oge-board-toolbar button'); await tick(); return; }
      if (id === 'practice-1-5-plan-reading') { click('.option[data-index="'+(value==='123'?'0':'1')+'"]'); await tick(); return; }
      const field = editableField();
      assert(field, id + ' must expose a draft for the next controller');
      inputElement(field, value); await tick();
    },
    counters: () => ({ accesses, notifications }),
    assertIsolated() { assert.equal(accesses, 0); assert.equal(personalStore.getItem('unrelated-fixture'), 'unchanged'); assert.deepEqual(errors, []); }
  };
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
async function startServer(t) {
  const port = await freePort(), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'oge-course-transport-'));
  const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port) };
  for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|TRAINER_REGISTRY_PATH$)/.test(key)) delete env[key];
  env.LEARNING_DB_PATH = path.join(temp, 'fixture.sqlite');
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = ''; child.stderr.on('data', value => { stderr += value; });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 1000))]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
    fs.rmSync(temp, { recursive: true, force: true });
  });
  const baseUrl = 'http://127.0.0.1:' + port, deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw Error('Local server exited: ' + stderr);
    try { if ((await fetch(baseUrl + '/health')).ok) return baseUrl; } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw Error('Local server startup timed out: ' + stderr);
}
function event(socket, name, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(name, listener); reject(Error('Timed out: ' + name)); }, 3000);
    function listener(value) { if (!predicate(value)) return; clearTimeout(timer); socket.off(name, listener); resolve(value); }
    socket.on(name, listener);
  });
}
async function noEvent(socket, name, action) {
  let unexpected;
  const listener = value => { unexpected = value; };
  socket.on(name, listener);
  try { action(); await new Promise(resolve => setTimeout(resolve, 140)); assert.equal(unexpected, undefined, 'Unexpected ' + name); }
  finally { socket.off(name, listener); }
}
async function room(baseUrl) { const r = await fetch(baseUrl + '/api/rooms', { method: 'POST' }); assert.equal(r.status, 201); return r.json(); }
async function connect(t, baseUrl, currentRoom, role) {
  const token = role === 'teacher' ? currentRoom.teacherToken : currentRoom.studentToken;
  const socket = io(baseUrl, { autoConnect: false, forceNew: true, reconnection: false, transports: ['websocket'] });
  t.after(() => socket.disconnect());
  const connected = event(socket, 'connect'); socket.connect(); await connected;
  const state = event(socket, 'room:state');
  socket.emit('room:join', { roomId: currentRoom.roomId, role, token, proto: 2 });
  return { socket, token, state: await state };
}
const auth = (currentRoom, participant, extra = {}) => ({ roomId: currentRoom.roomId, token: participant.token, ...extra });
const packet = (currentRoom, participant, config, state) => auth(currentRoom, participant, {
  trainerId: config.id, trainer: config.id, protocolVersion: 1,
  trainerVersion: config.version, stateSchemaVersion: config.stateSchemaVersion, state
});
function depth(value, level = 1) { return value && typeof value === 'object' ? Math.max(level, ...Object.values(value).map(child => depth(child, level + 1))) : level; }

test('all newly mirrored OGE core trainers pass real transport, late joins and control authorization', { timeout: 180000 }, async t => {
  const baseUrl = await startServer(t);
  const registry = await (await fetch(baseUrl + '/api/trainer-registry')).json();
  const unrelatedRoom = await room(baseUrl), unrelated = await connect(t, baseUrl, unrelatedRoom, 'student');
  const leaks = []; unrelated.socket.on('board:trainer-state-change', value => leaks.push(value));
  for (const entry of ENTRIES) await t.test(entry[1], async st => {
    const [number, id, filename] = entry;
    const registered = registry.trainers.find(value => value.trainerId === id); assert(registered, id);
    assert.equal(registered.allowLegacyHtml, false);
    const teacherDom = await boot(st, entry), pupilDom = await boot(st, entry);
    await teacherDom.enrich();
    const original = teacherDom.state(), bytes = Buffer.byteLength(JSON.stringify(original)), maxDepth = depth(original);
    assert(bytes < 64 * 1024); assert(maxDepth <= 8);
    assert(!/"[^"\\]*html"\s*:/i.test(JSON.stringify(original))); assert(!/<\/?[a-z][^>]*>/i.test(JSON.stringify(original)));
    st.diagnostic('native snapshot ' + bytes + ' bytes; nesting depth ' + maxDepth);
    const currentRoom = await room(baseUrl), teacher = await connect(st, baseUrl, currentRoom, 'teacher'), pupil = await connect(st, baseUrl, currentRoom, 'student');
    const changedUrl = event(pupil.socket, 'board:trainer-url-change');
    teacher.socket.emit('board:trainer-url-change', auth(currentRoom, teacher, { trainerUrl: '/trainers/' + filename }));
    await changedUrl;
    const received = event(pupil.socket, 'board:trainer-state-change');
    teacher.socket.emit('board:trainer-state-change', packet(currentRoom, teacher, teacherDom.config, original));
    const envelope = await received;
    assert.equal(envelope.trainerId, id); assert.equal(envelope.protocolVersion, 1); assert.deepEqual(envelope.state, original);
    await pupilDom.apply(envelope.state); assert.deepEqual(pupilDom.state(), original); assert.equal(pupilDom.counters().notifications, 0);
    const late = await connect(st, baseUrl, currentRoom, 'student'), lateDom = await boot(st, entry);
    assert.deepEqual(late.state.state.latestTrainerState.state, original);
    await lateDom.apply(late.state.state.latestTrainerState.state); assert.deepEqual(lateDom.state(), original);

    await pupilDom.change('123'); const requested = pupilDom.state(); assert.notDeepEqual(requested, original);
    await noEvent(teacher.socket, 'board:trainer-state-change', () => pupil.socket.emit('board:trainer-state-change', packet(currentRoom, pupil, pupilDom.config, requested)));
    const afterDenied = await connect(st, baseUrl, currentRoom, 'student');
    assert.deepEqual(afterDenied.state.state.latestTrainerState.state, original);
    const grant = event(pupil.socket, 'control:changed'); teacher.socket.emit('control:grant', auth(currentRoom, teacher)); await grant;
    const accepted = event(teacher.socket, 'board:trainer-state-change');
    pupil.socket.emit('board:trainer-state-change', packet(currentRoom, pupil, pupilDom.config, requested));
    assert.deepEqual((await accepted).state, requested); await teacherDom.apply(requested); assert.deepEqual(teacherDom.state(), requested);
    const revoke = event(pupil.socket, 'control:changed'); teacher.socket.emit('control:revoke', auth(currentRoom, teacher)); await revoke;
    await pupilDom.change('456');
    await noEvent(teacher.socket, 'board:trainer-state-change', () => pupil.socket.emit('board:trainer-state-change', packet(currentRoom, pupil, pupilDom.config, pupilDom.state())));

    await noEvent(pupil.socket, 'board:trainer-state-change', () => teacher.socket.emit('board:trainer-state-change', auth(currentRoom, teacher, { trainer: id, state: { instrHtml: '<b>legacy must be denied</b>' } })));
    await noEvent(pupil.socket, 'board:trainer-state-change', () => teacher.socket.emit('board:trainer-state-change', packet(currentRoom, teacher, teacherDom.config, { ...requested, html: '<b>injected</b>' })));
    const finalReader = await connect(st, baseUrl, currentRoom, 'student');
    assert.deepEqual(finalReader.state.state.latestTrainerState.state, requested, 'denied writes never replace the stored native state');
    teacherDom.assertIsolated(); pupilDom.assertIsolated(); lateDom.assertIsolated();
    assert.deepEqual(leaks, [], 'other rooms do not receive course state');
  });
});
