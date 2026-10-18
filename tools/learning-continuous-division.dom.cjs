'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const contracts = require('../trainers/oge-basics/learning-contracts');
const division = require('../trainers/oge-basics/multiplication-division/division-lab-core');
const course = require('../trainers/oge-basics/multiplication-division/division-course-core');
const scaffolds = require('../trainers/oge-basics/learning-scaffolds');
const source = fs.readFileSync(require.resolve('../trainers/oge-basics/learning-managed'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const stageId = slug => {
  const stage = course.stages.find(value => value.slug === slug);
  assert(stage, 'The tested course stage exists: ' + slug);
  return stage.id;
};
function envelope(contentId, seed) {
  const value = contracts.create(contentId, seed);
  value.taskSpec.trainerId = 'oge-basics';
  value.taskSpec.id = contentId;
  return value;
}

function mount(contentId, { saved, readOnly = false, synchronousNext = false } = {}) {
  const dom = new JSDOM('<main id="learning-remediation-root"></main>', {
    url: 'https://example.test/?learning=1', runScripts: 'outside-only'
  });
  const { window } = dom, calls = [];
  let bridge, current = clone(saved || envelope(contentId, 1));
  window.MathExamRemediationManaged = true;
  window.MathExamRemediation = contracts;
  window.DivisionLab = division;
  window.DivisionCourse = course;
  window.LearningScaffolds = scaffolds;
  window.MathExamLearning = { register: value => { bridge = value; } };
  window.eval(source);
  function apply(value) {
    const before = JSON.stringify(value);
    current = clone(value);
    bridge.applyState({ ...clone(value), readOnly });
    assert.equal(JSON.stringify(value), before, 'Hydration must not mutate the supplied saved envelope');
  }
  bridge.subscribe(event => {
    calls.push(clone(event));
    if (event.kind === 'new-task' && synchronousNext) {
      assert.deepEqual(clone(event.details), { contentId }, 'Repeat requests the same topic');
      apply(envelope(contentId, current.taskSpec.seed + 1));
    }
  });
  apply(current);
  const host = window.document.querySelector('main');
  const state = () => clone(bridge.getState());
  const spec = () => current.taskSpec;
  const newCalls = () => calls.filter(event => event.kind === 'new-task');
  function answer(question) {
    const value = question.answer && typeof question.answer === 'object'
      ? question.answer.n + '/' + question.answer.d : String(question.answer);
    if (question.kind === 'choice') {
      const choice = [...host.querySelectorAll('[data-choice]')].find(button => button.dataset.choice === value);
      assert(choice, 'A canonical choice must have a visible control');
      choice.click();
    } else {
      const input = host.querySelector('#lm-answer');
      assert(input, 'One answer field is available for the current action');
      input.value = value;
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    }
    host.querySelector('#lm-check').click();
    assert.equal(calls.at(-1).kind, 'check');
    assert.equal(state().feedback.kind, 'correct');
    contracts.normalize(spec(), state());
  }
  function finish() {
    let remaining = 200;
    while (!state().completed) {
      assert(remaining-- > 0, 'A finite task must finish');
      const now = state(), task = spec();
      answer(task.steps.length ? task.steps[now.step] : task.items.length ? task.items[now.step] : task.task);
    }
  }
  return { dom, window, host, calls, bridge, apply, state, spec, newCalls, finish };
}

function trainingSelected(t) {
  const tab = t.host.querySelector('#lm-practice');
  assert.equal(tab.textContent, 'Тренировка');
  assert(tab.classList.contains('lm-selected'), 'Training remains the selected tab');
}
function completedAction(t, label) {
  assert.equal(t.state().completed, true);
  assert.equal(t.host.querySelector('#lm-answer'), null, 'The completed task is not silently replaced');
  const buttons = [...t.host.querySelectorAll('#lm-new')];
  assert.equal(buttons.length, 1, 'Only one new-example button is rendered');
  const button = buttons[0];
  assert.equal(button.textContent, label);
  assert(button.classList.contains('lm-primary'), 'Continuing practice is the primary completion action');
  for (const later of t.host.querySelectorAll('.lm-worklog, .lm-course-footer')) {
    assert(button.compareDocumentPosition(later) & t.window.Node.DOCUMENT_POSITION_FOLLOWING,
      'Continue appears before solution history and course navigation');
  }
  trainingSelected(t);
  return button;
}

const cases = [
  ['multiplication-division/long-division-quotient-digit', 'Следующий пример →'],
  [stageId('whole-two-digit'), 'Следующий пример →'],
  [stageId('whole-simple'), 'Ещё 2 примера →'],
  [stageId('independent-check'), 'Ещё 3 примера →']
];
let completedCycles = 0;
for (const [contentId, label] of cases) {
  const t = mount(contentId);
  for (let cycle = 0; cycle < 3; cycle++) {
    trainingSelected(t);
    const expectedSpec = clone(t.spec()), callsBefore = t.newCalls().length;
    t.finish();
    completedCycles++;
    assert.equal(t.newCalls().length, callsBefore, 'Solving never requests a new example automatically');
    const completed = t.state(), button = completedAction(t, label);
    assert.deepEqual(completed.answers, expectedSpec.steps.map(step => String(step.answer)));
    assert.equal(completed.hint, 0, 'Repeating does not manufacture a hint event');
    if (expectedSpec.divisionTask) assert(t.host.querySelector('.lm-division'), 'The completed corner remains visible');
    assert(t.host.querySelector('.lm-prompt').textContent.includes((expectedSpec.divisionTasks.at(-1) || expectedSpec.task).prompt),
      'The solved condition stays on screen until continuation');
    assert.deepEqual(t.state(), completed);

    const observer = mount(contentId, { saved: { taskSpec: expectedSpec, state: completed }, readOnly: true });
    const observedButton = completedAction(observer, label);
    assert(observedButton.disabled, 'Read-only completion cannot start a new task');
    observedButton.click();
    assert.equal(observer.calls.length, 0);
    assert.deepEqual(observer.state(), completed);
    observer.dom.window.close();

    button.click(); button.click();
    assert.equal(t.newCalls().length, callsBefore + 1, 'A rapid second click cannot duplicate the request');
    assert.deepEqual(t.newCalls().at(-1).details, { contentId });
    assert.deepEqual(t.newCalls().at(-1).state, completed, 'The new-task event retains the finished saved work');
    assert.deepEqual(t.state(), completed, 'The old solution remains while the new task is loading');
    assert(button.disabled);
    t.apply(envelope(contentId, expectedSpec.seed + 1));
    assert.equal(t.spec().contentId, contentId);
    assert.notEqual(t.spec().seed, expectedSpec.seed);
    assert.equal(t.state().completed, false);
    assert.equal(t.state().step, 0);
    assert.deepEqual(t.state().answers, []);
    assert.equal(t.state().hint, 0);
    assert.equal(t.host.querySelector('#lm-new').disabled, false);
  }
  t.dom.window.close();
}

// Public/local adapters may deliver the new envelope synchronously inside notify().
// Mutating a freshly queried button after send() would disable the next task's button.
const synchronous = mount(stageId('whole-simple'), { synchronousNext: true });
for (let cycle = 0; cycle < 3; cycle++) {
  synchronous.finish();
  const oldButton = completedAction(synchronous, 'Ещё 2 примера →'), seed = synchronous.spec().seed;
  oldButton.click(); oldButton.click();
  assert.equal(synchronous.newCalls().length, cycle + 1);
  assert(oldButton.disabled, 'The old button was disabled before sending the request');
  assert.equal(synchronous.spec().seed, seed + 1);
  assert.equal(synchronous.state().completed, false);
  const freshButton = synchronous.host.querySelector('#lm-new');
  assert.notEqual(freshButton, oldButton);
  assert.equal(freshButton.disabled, false, 'Synchronous hydration leaves the new task usable');
  assert.doesNotMatch(freshButton.textContent, /Запрашиваем/);
  assert(synchronous.host.querySelector('#lm-answer'));
  trainingSelected(synchronous);
}
synchronous.dom.window.close();

const other = mount('negative-add-subtract');
assert.equal(other.host.querySelector('#lm-practice').textContent, 'Моё задание', 'Other subject navigation is unchanged');
assert.equal(other.host.querySelector('#lm-new').textContent, 'Запросить другое условие');
other.finish();
assert.equal(other.host.querySelectorAll('#lm-new').length, 1);
assert.equal(other.host.querySelector('#lm-new').textContent, 'Новое условие →');
assert.equal(other.host.querySelector('#lm-new').classList.contains('lm-primary'), false);
assert.equal(other.newCalls().length, 0);
other.dom.window.close();

const localSource = fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/division-course-practice'), 'utf8');
function mountPublic(contentId, saved) {
  const dom = new JSDOM('<body><button id="practice">Начать</button><section id="view-practice" hidden><main id="course-local-root"></main></section></body>', {
    url: 'https://example.test/course-practice.html', runScripts: 'outside-only'
  });
  const { window } = dom, key = 'mathExamBasics.divisionCourse.v1.' + contentId;
  window.document.body.dataset.courseId = contentId;
  if (saved) window.localStorage.setItem(key, saved);
  window.MathExamRemediationManaged = false;
  window.MathExamRemediation = contracts;
  window.DivisionLab = division;
  window.DivisionCourse = course;
  window.LearningScaffolds = scaffolds;
  window.eval(localSource);
  let bridge;
  const register = window.MathExamLearning.register;
  window.MathExamLearning.register = value => { bridge = value; register(value); };
  window.eval(source);
  window.document.querySelector('#practice').click();
  const host = window.document.querySelector('#learning-remediation-root');
  return { dom, window, host, state: () => clone(bridge.getState()), saved: () => window.localStorage.getItem(key) };
}
async function publicRepeats() {
  for (const [contentId, label] of [[stageId('whole-simple'), 'Ещё 2 примера →'], [stageId('independent-check'), 'Ещё 3 примера →']]) {
    let t = mountPublic(contentId), seed = 1;
    for (let cycle = 0; cycle < 3; cycle++) {
      const spec = contracts.create(contentId, seed).taskSpec;
      trainingSelected(t);
      for (const question of spec.steps) {
        const input = t.host.querySelector('#lm-answer');
        input.value = String(question.answer);
        input.dispatchEvent(new t.window.Event('input', { bubbles: true }));
        t.host.querySelector('#lm-check').click();
      }
      completedAction(t, label);
      const saved = t.saved(), completed = t.state();
      assert.equal(JSON.parse(saved).seed, seed);
      assert.deepEqual(JSON.parse(saved).state, completed, 'The public adapter saves the completed work');
      t.dom.window.close();
      t = mountPublic(contentId, saved);
      assert.deepEqual(t.state(), completed, 'Reload restores the completed example before another is requested');
      const oldButton = completedAction(t, label);
      oldButton.click(); oldButton.click();
      assert.deepEqual(t.state(), completed, 'Public continuation waits for the requested fresh envelope');
      await Promise.resolve();
      seed++;
      assert.equal(JSON.parse(t.saved()).seed, seed, 'Only one public repeat request is applied');
      assert.equal(t.state().step, 0);
      assert.equal(t.state().completed, false);
      assert.equal(t.state().hint, 0);
      assert.deepEqual(t.state().answers, []);
      assert.equal(t.host.querySelector('#lm-new').disabled, false);
      assert(t.host.querySelector('#lm-answer'));
      trainingSelected(t);
    }
    t.dom.window.close();
  }
}
publicRepeats().then(() => {
  console.log('LEARNING_CONTINUOUS_DIVISION_DOM_OK (' + completedCycles + ' managed completed/repeated cycles; six public adapter repeats with reload; single/two/three examples; preserved solutions; selected training; read-only; synchronous hydration; other subjects unchanged)');
}).catch(error => { console.error(error); process.exitCode = 1; });
