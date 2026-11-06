'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const D = require('./data.js');
const E = require('./engine.js');
const Adapter = require('./board.js');
const clone = value => JSON.parse(JSON.stringify(value));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const ORIGIN = 'https://mathexam.space';
const learnTask = () => D.tasks.find(task => D.getModule(task.moduleId).kind === 'learn');

function draftFor(step) {
  if (step.kind === 'choice') return step.answer;
  if (step.kind === 'number') return String(step.answer);
  if (step.kind === 'point') return `${step.answer.x};${step.answer.y}`;
  if (step.kind === 'interval') {
    const a = step.answer;
    return (a.loClosed ? '[' : '(') + (a.lo === null ? '-inf' : a.lo) + ';' +
      (a.hi === null ? '+inf' : a.hi) + (a.hiClosed ? ']' : ')');
  }
  if (step.kind === 'transform') {
    const a = step.answer;
    return JSON.stringify([a.base, a.h, a.k, a.sign]);
  }
  throw new Error('Unexpected answer kind ' + step.kind);
}
function acceptedState(task, count = task.steps.length) {
  const state = E.initialState(task.id);
  for (const step of task.steps.slice(0, count)) {
    state.drafts[step.id] = draftFor(step);
    if (step.kind === 'transform') state.graph = clone(step.answer);
  }
  state.stage = count;
  const current = task.steps[count];
  if (current && current.kind === 'transform') state.drafts[current.id] = JSON.stringify([state.graph.base, state.graph.h, state.graph.k, state.graph.sign]);
  state.feedback = count === task.steps.length ? 'complete' : count > 0 ? 'correct' : 'none';
  return state;
}
function sample() { return E.initialState(learnTask().id); }
function graphSample() {
  const state = E.initialState(D.tasks.find(task => task.graph && !E.isAssessment(task)).id);
  state.panels.lab = true; state.helpUsed = true;
  return state;
}

test('all 102 tasks have valid initial and mathematically justified shared stages', () => {
  assert.equal(D.tasks.length, 102);
  for (const task of D.tasks) {
    assert.equal(Adapter.validateState(E.initialState(task.id)), true, task.id + ' initial');
    for (let stage = 1; stage <= task.steps.length; stage++) {
      const state = acceptedState(task, stage);
      assert.equal(Adapter.validateState(state), true, `${task.id} stage ${stage}`);
      const normalized = clone(state);
      assert.deepEqual(normalized, state, 'Snapshots are ordinary JSON data');
    }
  }
});

test('accepted choice, number, point, interval and transform proofs cannot be forged', () => {
  const replacements = {
    number: () => '999999', point: () => '999;999', interval: () => '(-inf;+inf)',
    transform: () => '[10,8,8,-1]',
    choice: step => step.options.find(option => option.value !== step.answer).value
  };
  for (const kind of Object.keys(replacements)) {
    const task = D.tasks.find(t => t.steps.some(s => s.kind === kind));
    assert.ok(task, 'Coverage for ' + kind);
    const index = task.steps.findIndex(s => s.kind === kind), step = task.steps[index];
    const state = acceptedState(task, index + 1);
    state.drafts[step.id] = replacements[kind](step);
    assert.equal(E.checkStep(step, state.drafts[step.id]).correct, false, 'Test corruption differs from the correct answer');
    assert.equal(Adapter.validateState(state), false, 'Reject false accepted ' + kind);
  }
});

test('unknown tasks, missing properties and extra fields are rejected at every record boundary', () => {
  const mutations = [
    s => { s.taskId = 'unknown-01'; }, s => { s.taskId = '../other-course'; }, s => { s.taskId = 1; },
    s => { s.stage = -1; }, s => { s.stage = 0.5; }, s => { s.stage = 1000; },
    s => { s.html = '<b>passed</b>'; }, s => { delete s.helpUsed; },
    s => { s.drafts.extra = '1'; }, s => { delete s.drafts[D.getTask(s.taskId).steps[0].id]; },
    s => { s.errors.extra = 0; }, s => { s.graph.points = []; }, s => { delete s.graph.base; },
    s => { s.panels.results = true; }, s => { delete s.panels.route; },
    s => { s.protocolVersion = 1; }, s => { s.results = { independent: true }; }
  ];
  for (const mutate of mutations) {
    const state = sample(); mutate(state);
    assert.equal(Adapter.validateState(state), false, mutate.toString());
  }
  for (const bad of [null, undefined, 0, '', [], new Date(), new Map(), Object.create({ taskId: 'meaning-01' })]) {
    assert.equal(Adapter.validateState(bad), false);
  }
});

test('accessors and hidden/symbol/prototype properties are refused without executing a getter', () => {
  let reads = 0;
  const cases = [];
  const top = sample();
  Object.defineProperty(top, 'taskId', { enumerable: true, get() { reads++; return 'meaning-01'; } });
  cases.push(top);
  const nested = sample();
  Object.defineProperty(nested.graph, 'base', { enumerable: true, get() { reads++; return 2; } });
  cases.push(nested);
  const draft = sample();
  Object.defineProperty(draft.drafts, D.getTask(draft.taskId).steps[0].id, { enumerable: true, get() { reads++; return '1'; } });
  cases.push(draft);
  const hidden = sample(); Object.defineProperty(hidden, 'hidden', { value: true }); cases.push(hidden);
  const symbol = sample(); symbol[Symbol('private')] = true; cases.push(symbol);
  const inherited = sample(); Object.setPrototypeOf(inherited.panels, { inherited: true }); cases.push(inherited);
  const pollution = sample(); Object.defineProperty(pollution.drafts, '__proto__', { value: {}, enumerable: true }); cases.push(pollution);
  for (const value of cases) assert.equal(Adapter.validateState(value), false);
  assert.equal(reads, 0, 'Reject property descriptors before reading them');
});

test('bounded drafts preserve incomplete work and forbid markup, control characters and oversized values', () => {
  const task = D.tasks.find(t => t.steps[0].kind === 'number');
  const key = task.steps[0].id;
  for (const text of ['', '-', '1/', '0,', 'не знаю', '1/2', '−2', 'x'.repeat(160)]) {
    const state = E.initialState(task.id); state.drafts[key] = text;
    assert.equal(Adapter.validateState(state), true, 'A safe unfinished answer can be mirrored: ' + text.slice(0, 10));
  }
  for (const text of ['<img src=x>', '<', '>', '1\n2', '\u0000', '\u007f', 'x'.repeat(161)]) {
    const state = E.initialState(task.id); state.drafts[key] = text;
    assert.equal(Adapter.validateState(state), false);
  }
  const choiceTask = D.tasks.find(t => t.steps[0].kind === 'choice');
  const state = E.initialState(choiceTask.id); state.drafts[choiceTask.steps[0].id] = 'forged-option';
  assert.equal(Adapter.validateState(state), false);
});

test('graph parameters reject invalid logarithms, infinities and out-of-range shifts', () => {
  const state = graphSample();
  for (const base of Adapter.graphBases) {
    state.graph.base = base;
    assert.equal(Adapter.validateState(state), true, 'Supported base ' + base);
  }
  const invalid = [
    ['base', 0], ['base', 1], ['base', -2], ['base', 7], ['base', 10], ['base', Infinity], ['base', NaN], ['base', '2'],
    ['h', 4.01], ['h', -4.01], ['h', Infinity], ['k', NaN], ['k', '1'], ['sign', 0], ['sign', 2]
  ];
  for (const [key, value] of invalid) {
    const changed = graphSample(); changed.graph[key] = value;
    assert.equal(Adapter.validateState(changed), false, key + '=' + value);
  }
});

test('current transform draft and visible slider model must describe the same graph', () => {
  const task = D.tasks.find(t => t.steps.some(s => s.kind === 'transform'));
  const index = task.steps.findIndex(step => step.kind === 'transform');
  const state = acceptedState(task, index);
  assert.equal(Adapter.validateState(state), true);
  state.graph.h += 1;
  assert.equal(Adapter.validateState(state), false, 'A different visible curve cannot accompany the previous transform draft');
  state.drafts[task.steps[index].id] = JSON.stringify([state.graph.base, state.graph.h, state.graph.k, state.graph.sign]);
  assert.equal(Adapter.validateState(state), true);
});

test('outside exploration a learning graph agrees with the task or its last accepted transformation', () => {
  const initialTask = D.tasks.find(t => t.graph && !E.isAssessment(t) && !t.steps.some(s => s.kind === 'transform'));
  const initial = E.initialState(initialTask.id), original = clone(initial.graph);
  initial.graph.h += 1;
  assert.equal(Adapter.validateState(initial), false, 'A task graph cannot silently change');
  initial.panels.lab = true; initial.helpUsed = true;
  assert.equal(Adapter.validateState(initial), true, 'The open lab may explore a different curve');
  initial.panels.lab = false;
  assert.equal(Adapter.validateState(initial), false, 'Closing the lab requires restoration');
  initial.graph = original;
  assert.equal(Adapter.validateState(initial), true);

  const task = D.getTask('graph-moves-01'), index = task.steps.findIndex(s => s.kind === 'transform');
  const state = acceptedState(task, index + 1), transformed = clone(state.graph);
  assert.equal(Adapter.validateState(state), true, 'The following point step uses the accepted transformed graph');
  assert.notDeepEqual(transformed, E.graphParams(task));
  state.graph = E.graphParams(task);
  assert.equal(Adapter.validateState(state), false, 'Restoring the original curve would contradict the retained point question');
  state.panels.lab = true; state.helpUsed = true;
  assert.equal(Adapter.validateState(state), true);
  state.panels.lab = false; state.graph = transformed;
  assert.equal(Adapter.validateState(state), true);

  const finished = acceptedState(task);
  assert.equal(Adapter.validateState(finished), true);
  finished.graph = E.graphParams(task);
  assert.equal(Adapter.validateState(finished), false, 'Completed plotted work retains the transformed model too');
});

test('tasks without a graph cannot hydrate an exploration panel or unrelated model', () => {
  for (const task of D.tasks.filter(t => !t.graph)) {
    const state = E.initialState(task.id);
    assert.equal(Adapter.validateState(state), true);
    state.panels.lab = true;
    assert.equal(Adapter.validateState(state), false, task.id + ' has no graph lab');
    state.panels.lab = false; state.graph.h = 1;
    assert.equal(Adapter.validateState(state), false, task.id + ' has only default graph parameters');
  }
});

test('feedback, counters and assistance cannot describe an impossible current stage', () => {
  const mutators = [
    s => { s.feedback = 'complete'; }, s => { s.feedback = 'correct'; }, s => { s.feedback = 'arbitrary'; },
    s => { s.feedback = 'wrong'; }, s => { s.helpUsed = 1; }, s => { s.hintOpen = true; },
    s => { s.panels.theory = true; }, s => { s.panels.route = 'true'; },
    s => { s.errors[D.getTask(s.taskId).steps[0].id] = -1; },
    s => { s.errors[D.getTask(s.taskId).steps[0].id] = 0.5; },
    s => { s.errors[D.getTask(s.taskId).steps[0].id] = 100001; }
  ];
  for (const mutate of mutators) {
    const state = sample(); mutate(state);
    assert.equal(Adapter.validateState(state), false, mutate.toString());
  }
  const helped = sample(); helped.helpUsed = true; helped.hintOpen = true; helped.panels.theory = true;
  assert.equal(Adapter.validateState(helped), true);
  const done = acceptedState(learnTask()); done.helpUsed = true; done.hintOpen = true;
  assert.equal(Adapter.validateState(done), false, 'There is no current hint after the final step');
  done.hintOpen = false; done.feedback = 'wrong';
  assert.equal(Adapter.validateState(done), false, 'Completed work cannot have a current wrong answer');
});

test('diagnostics and both exam blocks keep help closed and the observed graph fixed', () => {
  for (const moduleId of ['diagnostic', 'base', 'profile']) {
    for (const task of D.tasks.filter(t => t.moduleId === moduleId)) {
      for (const modify of [
        s => { s.helpUsed = true; }, s => { s.helpUsed = true; s.hintOpen = true; },
        s => { s.helpUsed = true; s.panels.theory = true; }, s => { s.panels.lab = true; },
        s => { s.graph.h += 1; }, s => { s.graph.sign *= -1; }
      ]) {
        const state = E.initialState(task.id); modify(state);
        assert.equal(Adapter.validateState(state), false, task.id + ': ' + modify.toString());
      }
      const route = E.initialState(task.id); route.panels.route = true;
      assert.equal(Adapter.validateState(route), true, 'Exam learner can still choose a topic');
    }
  }
});

function hostFor(initial) {
  const document = new EventTarget();
  let state = clone(initial), registration, unsubscribe, notifications = [], writes = 0, disposed = 0;
  const host = {
    document, location: { origin: ORIGIN }, setTimeout, clearTimeout,
    MathExamBoard: { register(config) {
      registration = config;
      unsubscribe = config.subscribe(() => { notifications.push(config.getState()); });
      return { destroy() { disposed++; unsubscribe(); } };
    } }
  };
  const api = Adapter.create({ read: () => state, write: value => { writes++; state = value; document.dispatchEvent(new Event('toggle')); } }, host);
  return { host, api, notifications, registration, read: () => state, replace: value => { state = value; },
    writes: () => writes, disposed: () => disposed, unsubscribe: () => unsubscribe() };
}

test('bridge registers the existing semantic protocol with the exact same origin', () => {
  const h = hostFor(sample());
  assert.equal(h.registration.id, 'college-logarithms');
  assert.equal(h.registration.version, '1.0.0');
  assert.equal(h.registration.stateSchemaVersion, 1);
  assert.equal(h.registration.parentOrigin, ORIGIN);
  assert.equal(h.host.CollegeLogarithmsBoard, h.api);
  assert.equal(h.host.getBoardTrainerState, h.api.getState);
  assert.equal(h.host.applyBoardTrainerState, h.api.applyState);
  h.api.destroy();
});

test('get/apply snapshots are detached and invalid remote state is rejected before any write', () => {
  const h = hostFor(sample());
  const exported = h.api.getState(); exported.panels.route = true;
  assert.equal(h.read().panels.route, false);
  const remote = sample(); remote.panels.route = true;
  h.api.applyState(remote); remote.panels.route = false;
  assert.equal(h.read().panels.route, true);
  const before = clone(h.read()), writes = h.writes();
  const bad = sample(); bad.stage = 999;
  assert.throws(() => h.api.applyState(bad), /Invalid college-logarithms board state/);
  assert.deepEqual(h.read(), before);
  assert.equal(h.writes(), writes);
  h.api.destroy();
});

test('capture-phase notification waits for settled application state and coalesces duplicates', async () => {
  const h = hostFor(sample());
  // This unit test checks scheduling. Native Chromium interaction is tested by
  // the separate browser gate; dispatchEvent alone cannot prove event ordering.
  h.host.document.dispatchEvent(new Event('input'));
  h.read().panels.route = true;
  h.api.changed(); h.api.changed();
  assert.equal(h.notifications.length, 0);
  await pause(20);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].panels.route, true);
  h.host.document.dispatchEvent(new Event('click'));
  await pause(20);
  assert.equal(h.notifications.length, 1, 'Unchanged clicks do not send a duplicate snapshot');
  h.api.destroy();
});

test('remote apply, including DOM events and a pending local notification, never echoes', async () => {
  const h = hostFor(sample());
  h.read().panels.route = true; h.api.changed();
  const remote = sample(); remote.helpUsed = true; remote.hintOpen = true;
  h.api.applyState(remote);
  await pause(30);
  assert.equal(h.notifications.length, 0);
  assert.deepEqual(h.api.getState(), remote);
  h.api.destroy();
});

test('destroy cancels queued work and unsubscribes; invalid local drafts are never sent', async () => {
  const h = hostFor(sample());
  h.read().graph.base = 1; h.api.changed();
  await pause(20);
  assert.equal(h.notifications.length, 0);
  assert.throws(() => h.api.getState(), /Invalid local/);
  h.replace(sample()); h.read().panels.route = true; h.api.changed();
  h.api.destroy(); h.api.destroy();
  h.host.document.dispatchEvent(new Event('click'));
  await pause(20);
  assert.equal(h.notifications.length, 0);
  assert.equal(h.disposed(), 1);
});

test('head board-mode detection uses trusted paths or explicit mode without touching storage', () => {
  const source = fs.readFileSync(path.join(__dirname, 'board-mode.js'), 'utf8');
  const cases = [
    { search: '', parentPath: '/trainers/trainer-board.html', origin: ORIGIN, expected: true },
    { search: '', parentPath: '/trainers/group-board.html', origin: ORIGIN, expected: true },
    { search: '', parentPath: '/trainers/trainer-board.html', origin: 'https://foreign.example', expected: false },
    { search: '', parentPath: '/learning/index.html', origin: ORIGIN, expected: false },
    { search: '?board=1', parentPath: '/unrelated', origin: ORIGIN, expected: true },
    { search: '?board=0', standalone: true, expected: false },
    { search: '', standalone: true, expected: false }
  ];
  for (const entry of cases) {
    const classes = new Set();
    const w = { location: { origin: ORIGIN, search: entry.search }, document: { documentElement: { classList: { add: x => classes.add(x) } } } };
    w.parent = entry.standalone ? w : { location: { origin: entry.origin, pathname: entry.parentPath } };
    Object.defineProperty(w, 'localStorage', { get() { throw new Error('Mode detection must precede storage'); } });
    vm.runInNewContext(source, { window: w, URLSearchParams });
    assert.equal(w.CollegeLogarithmsBoardMode, entry.expected);
    assert.equal(classes.has('logarithm-board-mode'), entry.expected);
  }
});

function surface(t, taskId) {
  const messages = [], diagnostics = [];
  const dom = new JSDOM('<!doctype html><html><body><button id="change">Выбрать</button></body></html>', {
    url: ORIGIN + '/trainers/college-logarithms/index.html?board=1', runScripts: 'outside-only',
    pretendToBeVisual: true, virtualConsole: new VirtualConsole()
  });
  const w = dom.window;
  const parent = { location: { origin: ORIGIN, pathname: '/trainers/trainer-board.html' }, postMessage(value, origin) {
    assert.equal(origin, ORIGIN); messages.push(clone(value));
  } };
  Object.defineProperty(w, 'parent', { configurable: true, value: parent });
  Object.defineProperty(w, 'localStorage', { get() { throw new Error('Shared adapter must not read personal progress'); } });
  w.addEventListener('mathexam:bridge-diagnostic', e => diagnostics.push(clone(e.detail)));
  for (const file of ['board-mode.js', '../board-bridge.js', 'data.js', 'engine.js', 'board.js']) {
    w.eval(fs.readFileSync(path.resolve(__dirname, file), 'utf8') + '\n//# sourceURL=' + file);
  }
  let state = w.CollegeLogarithmsEngine.initialState(taskId);
  const api = w.CollegeLogarithmsBoardAdapter.create({ read: () => state, write: value => { state = value; } });
  const s = {
    w, api, messages, diagnostics, state: () => clone(api.getState()),
    replace(value) { state = w.JSON.parse(JSON.stringify(value)); api.changed(); },
    send(type, value, extra = {}, origin = ORIGIN, source = parent) {
      const ready = messages.find(m => m.type === 'mathexam:trainer-ready');
      assert.ok(ready, 'SDK ready before hydration');
      const data = { ...ready, type, ...extra };
      if (value !== undefined) data.state = value;
      w.dispatchEvent(new w.MessageEvent('message', { data: w.JSON.parse(JSON.stringify(data)), origin, source }));
    },
    states() { return messages.filter(m => m.type === 'mathexam:trainer-state'); }
  };
  t.after(() => { api.destroy(); w.close(); });
  return s;
}
async function until(predicate, reason) {
  const limit = Date.now() + 2000;
  do { if (predicate()) return; await pause(10); } while (Date.now() < limit);
  assert.fail(reason);
}

test('actual SDK carries snapshots between two realms without HTML or echo; bad envelopes are ignored', async t => {
  const task = learnTask();
  const a = surface(t, task.id), b = surface(t, D.tasks.find(x => x.id !== task.id).id);
  a.send('mathexam:hydrate', undefined, { mode: 'empty' });
  a.send('mathexam:request-trainer-state');
  const first = a.states().at(-1);
  assert.ok(first);
  b.send('mathexam:hydrate', first.state, { mode: 'state' });
  assert.deepEqual(b.state(), a.state());
  assert.equal(b.states().length, 0);

  const updated = sample(); updated.helpUsed = true; updated.hintOpen = true; updated.panels.route = true;
  const previous = a.states().length;
  a.replace(updated);
  await until(() => a.states().length > previous, 'Settled adapter change reaches the real SDK');
  b.send('mathexam:apply-trainer-state', a.states().at(-1).state);
  await pause(70);
  assert.deepEqual(b.state(), updated);
  assert.equal(b.states().length, 0, 'Remote hydration and update do not echo');

  const before = b.state();
  b.send('mathexam:apply-trainer-state', sample(), {}, 'https://foreign.example');
  b.send('mathexam:apply-trainer-state', sample(), { bridgeInstanceId: 'previous-frame' });
  const forged = sample(); forged.stage = 1;
  b.send('mathexam:apply-trainer-state', forged);
  assert.deepEqual(b.state(), before, 'Malformed semantics or foreign/stale envelope leaves work intact');
  assert.ok(b.diagnostics.some(d => d.code === 'origin-mismatch'));
  assert.ok(b.diagnostics.some(d => d.code === 'remote-apply-failed'));
  assert.equal(b.states().length, 0);
});
