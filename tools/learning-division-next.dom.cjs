'use strict';

// Actual cabinet queue, API, next-task and navigation functions, with a local
// SQLite store and controlled transport acknowledgements. No live accounts.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { LearningStore } = require('../board-server/learning-store');
const contracts = require('../board-server/learning-contracts');
const appSource = fs.readFileSync(require.resolve('../learning/app'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../learning/index.html'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const contentId = 'multiplication-division/long-division-quotient-digit';
const passwordHash = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(condition) {
  for (let i = 0; i < 50; i++) { if (condition()) return; await tick(); }
  assert(condition(), 'Expected asynchronous cabinet transition');
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture(t, { lesson = false, role = 'student' } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'division-next-'));
  let seed = 1;
  const controlledContracts = { ...contracts, create(trainer, id, suppliedSeed) {
    return contracts.create(trainer, id, suppliedSeed === undefined ? ++seed : suppliedSeed);
  } };
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts: controlledContracts });
  const teacher = store.activate(store.bootstrap({ login: 'fixture-teacher', name: 'Fixture teacher' }).invitationToken, passwordHash).account;
  const student = store.activate(store.createStudent(teacher, { login: 'fixture-pupil', name: 'Fixture pupil' }).invitationToken, passwordHash).account;
  const source = store.newAttempt(student.id, teacher.id, 'oge-basics', contracts.create('oge-basics', contentId, 1));
  let liveLesson = lesson ? store.createLesson(teacher, { opId: crypto.randomUUID(), title: 'Fixture lesson', learnerIds: [student.id] }).lesson : null;
  if (liveLesson) liveLesson = store.lessonAction(teacher, liveLesson.id, { opId: crypto.randomUUID(), expectedVersion: liveLesson.version, type: 'present', payload: { target: student.id } }).lesson;
  const dom = new JSDOM(html, { url: 'https://cabinet.example.test/learning/#' + (lesson ? 'lesson=' + liveLesson.id : 'attempt=' + source.id), runScripts: 'outside-only' });
  const { window } = dom, updates = [], calls = [], deadlines = new Map(), apiDeadlines = new Map();
  const nativeTimeout = window.setTimeout.bind(window), nativeClear = window.clearTimeout.bind(window);
  let fakeTimer = 100000;
  window.setInterval = () => 0;
  window.setTimeout = (callback, delay, ...args) => {
    if (delay > 14000 && delay <= 15000) { const id = ++fakeTimer; deadlines.set(id, () => callback(...args)); return id; }
    if (delay === 12000) { const id = ++fakeTimer; apiDeadlines.set(id, () => callback(...args)); return id; }
    return nativeTimeout(callback, delay, ...args);
  };
  window.clearTimeout = id => { if (!deadlines.delete(id) && !apiDeadlines.delete(id)) nativeClear(id); };
  const item = { id: 'oge-basics/' + contentId, trainerId: 'oge-basics', contentId, title: 'Fixture division' };
  window.LearningCatalog = { items: [item], get: id => id === item.id || id === contentId ? item : null };
  const controls = ['archived-notice', 'control-notice', 'pen', 'eraser', 'pen-color', 'pen-width', 'undo-stroke', 'reference-host', 'watch-placeholder', 'watch-trainer', 'watch-drawing', 'watch-panel'];
  for (const id of controls) { const node = window.document.createElement('div'); node.id = id; window.document.getElementById('main').append(node); }
  const button = window.document.createElement('button'); button.id = 'fixture-next'; button.textContent = 'Следующий пример'; window.document.getElementById('main').append(button);
  const frame = { update(attempt, options) { updates.push(clone({ attempt, options })); if (options.force) button.disabled = options.readOnly; }, destroy() {} };
  const view = { id: source.id, learnerId: student.id, lesson, frame, draw: { update() {} } };
  // Remove only startup/session restoration. All functions under test remain
  // unchanged; closure hooks establish the fixture and simulate view changes.
  const startup = appSource.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");
  assert(startup > 0);
  window.eval(appSource.slice(0, startup) + `
    window.fixtureApp={
      mount(a,attempt,view,lesson){account=a;activeAttempt=attempt;attempts=[attempt];workspace=view;activeLesson=lesson;connected=true;authReady=false;},
      change:trainerChange,
      check(state,details){return action(activeAttempt.id,'check',{state,details});},
      inspect(){return {active:activeAttempt,attempts,outbox,rejected,pending:[...divisionNextRequests.values()].some(r=>r.pending),waiters:[...actionWaiters.values()].reduce((sum,a)=>sum+a.length,0)};},
      switch(kind){
        if(kind==='history')workspace.history={current:clone(activeAttempt)};
        if(kind==='control')activeAttempt={...activeAttempt,controller:'teacher',version:activeAttempt.version+5};
        if(kind==='lesson')activeLesson={...activeLesson,id:'another-lesson'};
        if(kind==='seat')workspace.learnerId='another-pupil';
        if(kind==='workspace')workspace={...workspace};
        if(kind==='attempt')activeAttempt={...activeAttempt,id:'another-attempt'};
        if(kind==='account'){account={...account,id:'another-account'};++authRevision;}
        if(kind==='auth')++authRevision;
        if(kind==='navigate'){history.replaceState(null,'','#practice');++routeNumber;}
      }
    };
  })();`);
  // Presentation is checked in the real store below; avoid mounting the unrelated
  // observer iframe inside this deliberately narrow cabinet fixture.
  window.fixtureApp.mount(clone(role === 'student' ? student : teacher), clone(role === 'teacher' ? { ...source, controller: 'teacher' } : source), view, liveLesson ? { ...clone(liveLesson), presentation: null } : null);
  const transport = { action: null, create: null };
  const response = data => ({ ok: true, status: 200, json: async () => clone(data) });
  window.fetch = async (url, options) => {
    const route = url.slice('/api/learning'.length), body = options.body ? JSON.parse(options.body) : null;
    const call = { route, body, signal: options.signal }; calls.push(call);
    if (route === '/attempts') {
      const create = () => store.createAttempt(student, body);
      return transport.create ? transport.create(create, call) : response(create());
    }
    if (route.endsWith('/actions')) {
      const save = () => store.action(student, source.id, body);
      return transport.action ? transport.action(save, call) : response(save());
    }
    if (route === '/attempts/' + source.id) return response(store.getAttempt(student, source.id));
    throw Error('Unexpected fixture request: ' + route);
  };
  const next = () => { window.fixtureApp.change({ kind: 'new-task', details: { contentId }, state: clone(source.state) }); button.disabled = true; };
  const finalCheck = () => {
    const answer = String(source.taskSpec.steps[0].answer), state = clone(source.state);
    Object.assign(state, { answer: '', answers: [answer], step: 1, completed: true, feedback: { kind: 'correct', scope: 'step', step: 0, answer } });
    return window.fixtureApp.check(state, { scope: 'step', step: 0, answer, answers: [] });
  };
  t.after(() => { dom.window.close(); store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { dom, window, app: window.fixtureApp, store, source, student, teacher, liveLesson, updates, calls, transport, response, button, next, finalCheck, deadlines, apiDeadlines, view,
    creations: () => calls.filter(call => call.route === '/attempts'),
    old: () => store.getAttempt(student, source.id),
    attempts: () => store.listAttempts(student) };
}

test('a final save acknowledgement unlocks exactly one fresh same-topic attempt and preserves the lesson mirror/history', async t => {
  const f = fixture(t, { lesson: true }), ack = deferred();
  f.transport.action = save => { const result = save(); return ack.promise.then(() => f.response(result)); };
  const saved = f.finalCheck();
  assert.equal(f.old().state.completed, true, 'The server has saved the final answer, but the browser has no acknowledgement yet');
  const oldRecord = clone(f.old()), oldHistory = clone(f.store.history(f.student, f.source.id));
  f.next(); f.next();
  await tick();
  assert.equal(f.creations().length, 0);
  ack.resolve(); await saved;
  await until(() => f.creations().length === 1 && !f.app.inspect().pending);
  const request = f.creations()[0].body;
  assert.equal(request.contentId, contentId); assert.equal(request.fresh, true);
  assert.equal(request.sourceAttemptId, f.source.id); assert.equal(request.lessonId, f.liveLesson.id);
  const fresh = f.attempts().find(a => a.id !== f.source.id);
  assert(fresh); assert.equal(f.attempts().length, 2);
  assert.equal(f.store.getAttempt(f.student, fresh.id).state.completed, false);
  assert.deepEqual(f.old(), oldRecord); assert.deepEqual(f.store.history(f.student, f.source.id), oldHistory);
  const mirrored = f.store.getLesson(f.teacher, f.liveLesson.id);
  assert.equal(mirrored.seats[0].attempt.id, fresh.id);
  assert.equal(mirrored.presentation.attempt.id, fresh.id, 'The existing presentation follows the new seat attempt');
});

test('duplicate next clicks during creation issue only one request', async t => {
  const f = fixture(t), ack = deferred();
  f.transport.create = create => { const result = create(); return ack.promise.then(() => f.response(result)); };
  f.next(); await until(() => f.creations().length === 1);
  f.next(); f.next(); await tick();
  assert.equal(f.creations().length, 1);
  ack.resolve(); await until(() => !f.app.inspect().pending);
  assert.equal(f.attempts().length, 2);
});

test('lost creation acknowledgement restores the button; explicit retry reuses the operation and cannot duplicate the attempt', async t => {
  const f = fixture(t);
  f.transport.create = create => { create(); throw TypeError('Fixture lost acknowledgement'); };
  f.next(); await until(() => !f.app.inspect().pending);
  assert.equal(f.button.disabled, false); assert(f.updates.some(update => update.options.force));
  assert.equal(f.attempts().length, 2); assert.equal(f.creations().length, 1);
  f.transport.create = null;
  f.next(); await until(() => !f.app.inspect().pending);
  assert.equal(f.creations().length, 2);
  assert.deepEqual(f.creations()[1].body, f.creations()[0].body, 'Manual retry uses the original idempotency key and request');
  assert.equal(f.attempts().length, 2, 'The uncertain first request cannot create a duplicate');
});

test('API timeout restores the next button and only an explicit retry reuses the uncertain creation', async t => {
  const f = fixture(t);
  f.transport.create = (create, call) => {
    create();
    return new Promise((resolve, reject) => call.signal.addEventListener('abort', () => reject(new f.window.DOMException('Fixture timeout', 'AbortError')), { once: true }));
  };
  f.next(); await until(() => f.creations().length === 1);
  assert.equal(f.apiDeadlines.size, 1);
  [...f.apiDeadlines.values()][0](); await until(() => !f.app.inspect().pending);
  assert.equal(f.button.disabled, false); assert.equal(f.apiDeadlines.size, 0);
  assert.equal(f.creations().length, 1); assert.equal(f.attempts().length, 2);
  f.transport.create = null; f.next(); await until(() => !f.app.inspect().pending);
  assert.deepEqual(f.creations()[1].body, f.creations()[0].body);
  assert.equal(f.attempts().length, 2);
});

test('a rejected final save restores a usable authoritative view and never creates another attempt', async t => {
  const f = fixture(t), ack = deferred();
  f.transport.action = () => ack.promise;
  const saved = f.finalCheck(); f.next();
  ack.resolve({ ok: false, status: 409, json: async () => ({ error: 'LEARNING_STATE_CONFLICT' }) });
  assert.equal(await saved, false); await until(() => !f.app.inspect().pending);
  assert.equal(f.creations().length, 0); assert.equal(f.attempts().length, 1);
  assert.equal(f.button.disabled, false); assert.equal(f.updates.at(-1).attempt.state.completed, false);
  assert.equal(f.app.inspect().rejected.length, 1, 'The rejected answer remains exportable');
});

test('bounded save wait releases only its own listener; a late acknowledgement does not auto-create', async t => {
  const f = fixture(t), ack = deferred();
  f.transport.action = save => { const result = save(); return ack.promise.then(() => f.response(result)); };
  const saved = f.finalCheck(); f.next();
  assert.equal(f.deadlines.size, 1); assert.equal(f.app.inspect().waiters, 2);
  [...f.deadlines.values()][0](); await until(() => !f.app.inspect().pending);
  assert.equal(f.app.inspect().waiters, 1, 'The pending answer keeps its own acknowledgement listener');
  assert.equal(f.button.disabled, false); assert.equal(f.creations().length, 0);
  ack.resolve(); assert.equal(await saved, true); await tick();
  assert.equal(f.creations().length, 0); assert.equal(f.app.inspect().waiters, 0);
  f.next(); await until(() => f.creations().length === 1 && !f.app.inspect().pending);
  assert.equal(f.attempts().length, 2);
});

for (const change of ['history', 'control', 'lesson', 'seat', 'workspace', 'attempt', 'account', 'auth', 'navigate']) {
  test('no deferred creation after context changes: ' + change, async t => {
    const f = fixture(t, { lesson: true }), ack = deferred();
    f.transport.action = save => { const result = save(); return ack.promise.then(() => f.response(result)); };
    const saved = f.finalCheck(); f.next(); f.app.switch(change); ack.resolve();
    await saved; await until(() => !f.app.inspect().pending);
    assert.equal(f.creations().length, 0); assert.equal(f.attempts().length, 1);
    if (['history', 'control'].includes(change)) assert.equal(f.updates.filter(u => u.options.force).at(-1).options.readOnly, true);
  });
}

test('late creation responses cannot navigate or hydrate a different workspace', async t => {
  const f = fixture(t), ack = deferred();
  f.transport.create = create => { const result = create(); return ack.promise.then(() => f.response(result)); };
  f.next(); await until(() => f.creations().length === 1);
  f.app.switch('navigate'); const updateCount = f.updates.length;
  ack.resolve(); await until(() => !f.app.inspect().pending);
  assert.equal(f.window.location.hash, '#practice');
  assert.equal(f.app.inspect().attempts.length, 1, 'The stale response cannot populate the replacement view');
  assert.equal(f.updates.length, updateCount);
  assert.equal(f.attempts().length, 2, 'A creation already acknowledged by the server remains a preserved attempt');
});

test('returning to the old work after an uncertain response reuses the original operation', async t => {
  const f = fixture(t), ack = deferred();
  f.transport.create = create => { const result = create(); return ack.promise.then(() => f.response(result)); };
  f.next(); await until(() => f.creations().length === 1);
  f.app.switch('navigate');
  f.window.history.replaceState(null, '', '#attempt=' + f.source.id);
  f.app.mount(clone(f.student), clone(f.source), { ...f.view }, null);
  const updatesBeforeAck = f.updates.length;
  ack.resolve(); await until(() => !f.app.inspect().pending);
  assert.equal(f.window.location.hash, '#attempt=' + f.source.id);
  assert.equal(f.updates.length, updatesBeforeAck, 'Matching route text alone cannot revive the old request');
  f.transport.create = null; f.next(); await until(() => !f.app.inspect().pending);
  assert.deepEqual(f.creations()[1].body, f.creations()[0].body);
  assert.equal(f.attempts().length, 2);
});

test('teacher control and history viewing cannot request fresh pupil attempts', async t => {
  const teacher = fixture(t, { role: 'teacher' });
  teacher.next(); await tick();
  assert.equal(teacher.creations().length, 0);
  assert.equal(teacher.button.disabled, false, 'The teacher view is restored after the rejected request');
  const history = fixture(t); history.app.switch('history'); history.next(); await tick();
  assert.equal(history.creations().length, 0);
  assert.equal(history.updates.at(-1).options.readOnly, true);
  const observer = fixture(t); observer.app.switch('control'); observer.next(); await tick();
  assert.equal(observer.creations().length, 0);
  assert.equal(observer.updates.at(-1).options.readOnly, true);
});
