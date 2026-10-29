'use strict';
// Synthetic DOM/API fixtures. No real account, server mutation or provider call.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../learning/assistant.js'), 'utf8');
const profile = require('../board-server/assistant-profile-catalog.json').find(item => item.id === 'atanasyan-first-steps');
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function task() {
  return { id: 'synthetic-task-a', title: 'Точки и прямая', question: 'Какая точка лежит на прямой a?', stepIndex: 0,
    steps: [{ prompt: 'Рассмотри точку A.', explanation: 'Точка A находится на прямой a.', answer: 'A' },
      { prompt: 'Рассмотри точку B.', explanation: 'Точка B не находится на прямой a.', answer: 'B' }],
    selectedObjects: [{ label: 'Прямая a', description: 'Прямая проходит через точки A и C.' }] };
}
async function fixture(t, options = {}) {
  const dom = new JSDOM('<!doctype html><body><main><div id="host"></div></main></body>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only' });
  const { window } = dom, host = window.document.getElementById('host');
  const state = { active: true, canAsk: true, task: task(), status: { enabled: true, configuredEnabled: true, available: true, mode: 'offline', profile: copy(profile), dailyLimit: 10, remaining: 10, examActive: false, version: 1 },
    calls: [], hintCalls: [], answerCalls: [], before: async () => true, read: null };
  window.eval(source);
  const dispose = window.LearningAssistant.mount(host, { role: options.role || 'student', studentId: 'synthetic-pupil', lazy: options.lazy === true,
    isCurrent: () => state.active, canAsk: () => state.canAsk,
    localTask: () => state.task, localTaskUnavailable: 'Открой тренажёр задания.',
    api: async (route, request = {}) => {
      state.calls.push({ route, method: request.method || 'GET', body: request.body });
      const result = state.read ? await state.read(route, request) : state.status;
      return copy(result);
    },
    onBeforeLocalAsk: async details => { state.hintCalls.push(copy(details)); return state.before(details); },
    onAnswer: result => state.answerCalls.push(copy(result))
  });
  await settle();
  t.after(() => { dispose(); window.close(); });
  return { window, host, state, dispose, get panel() { return host.querySelector('.cabinet-assistant'); }, get launcher() { return host.querySelector('[data-assistant-launcher]'); },
    get answers() { return [...host.querySelectorAll('[data-assistant-local-answer]')]; },
    button(mode) { return host.querySelector('[data-assistant-local="' + mode + '"]'); },
    async ask(mode = 'hint') { this.button(mode).click(); await settle(); },
    open() { this.launcher.click(); },
    assertReadsOnly() { assert(state.calls.every(call => call.method === 'GET' && call.route === '/assistant')); }
  };
}

test('pupil dock starts closed, opening is read-only, Escape restores focus, teacher settings stay inline', async t => {
  const f = await fixture(t);
  assert(f.host.classList.contains('cabinet-assistant-dock'));
  assert(f.panel.hidden); assert.equal(f.launcher.getAttribute('aria-expanded'), 'false');
  assert.equal(f.panel.getAttribute('role'), 'dialog'); assert.equal(f.panel.getAttribute('aria-modal'), 'false');
  assert.equal(f.launcher.getAttribute('aria-controls'), f.panel.id);
  assert.equal(f.state.calls.length, 1); assert.equal(f.state.hintCalls.length, 0);
  f.open(); assert.equal(f.panel.hidden, false); assert.equal(f.launcher.getAttribute('aria-expanded'), 'true');
  assert.equal(f.window.document.activeElement, f.host.querySelector('[data-assistant-close]'));
  f.window.document.dispatchEvent(new f.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert(f.panel.hidden); assert.equal(f.window.document.activeElement, f.launcher);
  assert.equal(f.state.calls.length, 1); assert.equal(f.state.hintCalls.length, 0);
  f.dispose.open(); assert.equal(f.panel.hidden, false); f.dispose.close(); assert(f.panel.hidden);
  const teacher = await fixture(t, { role: 'teacher' });
  assert.equal(teacher.host.classList.contains('cabinet-assistant-dock'), false);
  assert.equal(teacher.launcher, null); assert.equal(teacher.panel.hidden, false);
  assert(teacher.host.querySelector('[name="assistant-profile"]'));
  assert.equal(teacher.state.calls[0].route, '/teacher/students/synthetic-pupil/assistant');
});

test('source hint appears only after acknowledgment and second permission read; no model or quota request', async t => {
  const f = await fixture(t), acknowledgment = deferred(), permission = deferred();
  f.state.before = () => acknowledgment.promise;
  let reads = 0; f.state.read = async () => ++reads === 2 ? permission.promise : f.state.status;
  f.open(); f.button('hint').click(); await settle();
  assert.equal(f.state.hintCalls.length, 1); assert.deepEqual(f.state.hintCalls[0], { mode: 'hint', stepIndex: 0, taskId: 'synthetic-task-a' });
  assert.equal(f.answers.length, 0); assert(f.button('hint').disabled);
  acknowledgment.resolve(true); await settle(); assert.equal(f.answers.length, 0, 'Post-ack permission refresh must finish');
  permission.resolve(f.state.status); await settle();
  assert.equal(f.answers.length, 1); assert.match(f.answers[0].textContent, /Точка A находится на прямой a/);
  assert.equal(f.state.calls.length, 3, 'Mount, pre-hint and post-ack status reads');
  assert.equal(f.state.status.remaining, 10); f.assertReadsOnly();
  assert.deepEqual(f.state.answerCalls, [{ contextMode: 'local-task' }]);
});

test('lazy native launcher makes no status request until opened and never charges on open or reopen', async t => {
  const f = await fixture(t, { lazy: true });
  assert(f.launcher); assert(f.panel.hidden); assert.equal(f.state.calls.length, 0); assert.equal(f.state.hintCalls.length, 0);
  f.open(); await settle();
  assert.equal(f.state.calls.length, 1); assert.equal(f.panel.hidden, false); assert.equal(f.state.hintCalls.length, 0);
  assert.equal(f.window.document.activeElement, f.host.querySelector('[data-assistant-close]'), 'Lazy replacement keeps keyboard focus in the opened panel');
  f.dispose.close(); f.open(); await settle(); assert.equal(f.state.calls.length, 1); assert.equal(f.state.hintCalls.length, 0);
  f.assertReadsOnly();
});

test('local source markup is text, full answer includes source steps, selected object has its own explanation', async t => {
  const f = await fixture(t);
  f.state.task.question = '<img src=x onerror="window.injected=true">';
  f.state.task.steps[0].explanation = '<script>window.injected=true</script>';
  f.state.task.selectedObjects = [{ label: '<b>Прямая a</b>', description: '<img src=x> через A и C.' }];
  f.dispose.refresh(); f.open(); await f.ask('full');
  assert.equal(f.answers.length, 1); assert.equal(f.answers[0].querySelectorAll('li').length, 2);
  assert.match(f.answers[0].textContent, /Ответ шага: A/); assert.match(f.answers[0].textContent, /Ответ шага: B/);
  await f.ask('object'); assert.equal(f.answers.length, 2); assert.match(f.answers[1].textContent, /Прямая a/);
  assert.equal(f.host.querySelectorAll('img,script,b,[onerror]').length, 0); assert.equal(f.window.injected, undefined);
  assert.match(f.host.querySelector('.cabinet-assistant-course-condition').textContent, /<img/); f.assertReadsOnly();
});

test('refresh preserves captured-step answers; closing during an in-flight hint never reopens the panel', async t => {
  const f = await fixture(t); f.open(); await f.ask();
  f.state.task.stepIndex = 1; f.dispose.refresh();
  assert.match(f.host.querySelector('.cabinet-assistant-course-task').textContent, /Шаг 2/);
  assert.match(f.answers[0].querySelector('.cabinet-assistant-question').textContent, /шаг 1/);
  const acknowledgment = deferred(); f.state.before = () => acknowledgment.promise;
  f.button('simpler').click(); await settle(); f.dispose.close();
  acknowledgment.resolve(true); await settle();
  assert(f.panel.hidden); assert.equal(f.launcher.getAttribute('aria-expanded'), 'false'); assert.equal(f.answers.length, 2);
  f.open(); assert.equal(f.answers.length, 2); assert.match(f.answers[1].querySelector('.cabinet-assistant-question').textContent, /шаг 2/);
});

test('failed, false or missing acknowledgment never reveals a source answer', async t => {
  for (const before of [async () => false, async () => undefined, async () => { throw Error('SYNTHETIC_SAVE_FAILED'); }]) {
    const f = await fixture(t); f.state.before = before; f.open(); await f.ask();
    assert.equal(f.answers.length, 0); assert.equal(f.state.answerCalls.length, 0); assert.equal(f.button('hint').disabled, false);
    assert.equal(f.state.calls.length, 2); f.assertReadsOnly();
  }
});

test('fresh pre-hint settings block disabled, assessment, changed-profile and unavailable cases', async t => {
  for (const change of [status => { status.enabled = false; }, status => { status.examActive = true; }, status => { status.profile.id = 'triangle-congruence'; }, status => { status.mode = 'unavailable'; }]) {
    const f = await fixture(t); change(f.state.status); f.open(); await f.ask();
    assert.equal(f.state.hintCalls.length, 0); assert.equal(f.answers.length, 0); assert(f.button('hint').disabled);
    assert.equal(f.state.calls.length, 2); f.assertReadsOnly();
  }
});

test('permission revoked or assessment begun while hint acknowledgment is pending blocks the answer', async t => {
  for (const change of [status => { status.enabled = false; }, status => { status.examActive = true; }, status => { status.profile.id = 'triangle-congruence'; }]) {
    const f = await fixture(t), acknowledgment = deferred(); f.state.before = () => acknowledgment.promise;
    f.open(); f.button('hint').click(); await settle(); change(f.state.status); acknowledgment.resolve(true); await settle();
    assert.equal(f.state.hintCalls.length, 1); assert.equal(f.answers.length, 0); assert.equal(f.state.answerCalls.length, 0);
    assert.equal(f.state.calls.length, 3); assert(f.button('hint').disabled); f.assertReadsOnly();
  }
});

test('task or step changes before fresh permission completes prevent a hint mutation', async t => {
  for (const change of [task => { task.id = 'synthetic-other-task'; }, task => { task.stepIndex = 1; }]) {
    const f = await fixture(t), permission = deferred(); f.state.read = () => permission.promise;
    f.open(); f.button('hint').click(); await settle(); change(f.state.task); permission.resolve(f.state.status); await settle();
    assert.equal(f.state.hintCalls.length, 0); assert.equal(f.answers.length, 0); f.assertReadsOnly();
  }
});

test('task, identity, control or lifecycle change during acknowledgment suppresses late results', async t => {
  for (const change of [f => { f.state.task.id = 'synthetic-other-task'; }, f => { f.state.active = false; }, f => { f.state.canAsk = false; }, f => f.dispose()]) {
    const f = await fixture(t), acknowledgment = deferred(); f.state.before = () => acknowledgment.promise;
    f.open(); f.button('hint').click(); await settle(); change(f); acknowledgment.resolve(true); await settle();
    assert.equal(f.state.hintCalls.length, 1); assert.equal(f.answers.length, 0); assert.equal(f.state.answerCalls.length, 0); f.assertReadsOnly();
  }
});

test('step, condition, source steps or selected object changes while acknowledgment is pending suppress stale help', async t => {
  for (const [mode, change] of [
    ['hint', value => { value.stepIndex = 1; }],
    ['hint', value => { value.question = 'Другое условие.'; }],
    ['hint', value => { value.steps[0].explanation = 'Другое объяснение.'; }],
    ['object', value => { value.selectedObjects = [{ label: 'Точка B', description: 'Точка вне прямой.' }]; }]
  ]) {
    const f = await fixture(t), acknowledgment = deferred(); f.state.before = () => acknowledgment.promise;
    f.open(); f.button(mode).click(); await settle(); change(f.state.task); acknowledgment.resolve(true); await settle();
    assert.equal(f.state.hintCalls.length, 1); assert.equal(f.answers.length, 0); assert.equal(f.state.answerCalls.length, 0); f.assertReadsOnly();
  }
});

test('malformed, absent and read-only task contexts disable source actions without requests', async t => {
  for (const change of [f => { f.state.task = null; }, f => { f.state.task.stepIndex = -1; }, f => { f.state.task.stepIndex = 2; }, f => { f.state.task.steps = []; }, f => { f.state.task.steps[0].explanation = undefined; }, f => { f.state.canAsk = false; }]) {
    const f = await fixture(t); change(f); f.dispose.refresh(); f.open();
    assert(f.button('hint').disabled); f.button('hint').click(); await settle();
    assert.equal(f.state.calls.length, 1); assert.equal(f.state.hintCalls.length, 0); assert.equal(f.answers.length, 0);
  }
});

test('status read failures preserve existing answers and do not retry or leak source content', async t => {
  const f = await fixture(t); f.open(); await f.ask(); const existing = f.answers[0].textContent;
  f.state.read = () => { throw Error('SYNTHETIC_NETWORK_FAILURE'); }; await f.ask();
  assert.equal(f.answers.length, 1); assert.equal(f.answers[0].textContent, existing); assert.equal(f.state.hintCalls.length, 1);
  assert.equal(f.state.calls.length, 4); assert.equal(f.state.calls.some(call => call.body !== undefined), false); f.assertReadsOnly();
});

test('disabled configuration initially hides pupil helper completely', async t => {
  const dom = new JSDOM('<!doctype html><div id="host"></div>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only' });
  const { window } = dom, host = window.document.querySelector('#host'); window.eval(source);
  let writes = 0;
  const dispose = window.LearningAssistant.mount(host, { role: 'student', localTask: task, api: async (_route, request = {}) => {
    if (request.method) writes++; return { enabled: false, profile: copy(profile), mode: 'offline' };
  } });
  t.after(() => { dispose(); window.close(); }); await settle();
  assert(host.hidden); assert.equal(host.querySelector('[data-assistant-launcher]'), null); assert.equal(writes, 0);
});
