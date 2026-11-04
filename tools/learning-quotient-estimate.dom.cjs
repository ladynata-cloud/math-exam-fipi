'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const contracts = require('../board-server/learning-contracts');
const remediation = require('../trainers/oge-basics/learning-contracts');
const division = require('../trainers/oge-basics/multiplication-division/division-lab-core');
const scaffolds = require('../trainers/oge-basics/learning-scaffolds');
const managedSource = fs.readFileSync(require.resolve('../trainers/oge-basics/learning-managed'), 'utf8');
const contentId = 'multiplication-division/quotient-estimate';
const clone = value => JSON.parse(JSON.stringify(value));

function mount(envelope, readOnly = false) {
  const dom = new JSDOM('<main id="learning-remediation-root"></main>', {
    url: 'https://example.test/?learning=1', runScripts: 'outside-only'
  });
  const { window } = dom;
  const calls = [];
  let bridge;
  window.MathExamRemediationManaged = true;
  window.MathExamRemediation = remediation;
  window.DivisionLab = division;
  window.LearningScaffolds = scaffolds;
  window.MathExamLearning = { register: value => { bridge = value; } };
  window.eval(managedSource);
  bridge.subscribe(event => calls.push(clone(event)));
  const before = JSON.stringify(envelope);
  bridge.applyState({ ...envelope, readOnly });
  assert.equal(JSON.stringify(envelope), before, 'Hydration must not mutate the persisted server envelope');
  const host = window.document.querySelector('main');
  const state = () => clone(bridge.getState());
  const type = value => {
    const input = host.querySelector('#lm-answer');
    assert(input, 'This action must have one answer field');
    input.value = value;
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const check = value => {
    type(value);
    host.querySelector('#lm-check').click();
    const event = calls.at(-1);
    assert.equal(event.kind, 'check');
    const normalized = contracts.normalize('oge-basics', envelope.taskSpec, event.state);
    const verified = contracts.evaluate('oge-basics', envelope.taskSpec, event.details, normalized);
    assert.equal(event.state.feedback.kind, verified.correct ? 'correct' : 'incorrect');
    return { event, verified };
  };
  return { dom, host, calls, bridge, state, type, check };
}

function assertVisibleWork(t, answers) {
  const worklog = t.host.querySelector('.lm-estimate-trail');
  if (!answers.length) return;
  assert(worklog, 'Accepted actions must remain visible');
  assert.equal(worklog.querySelectorAll('p').length, answers.length);
  const details = worklog.closest('details');
  assert(!details || details.open, 'Accepted actions must not be hidden in collapsed history');
  assert(!worklog.closest('[hidden]'), 'Accepted actions must not be hidden');
  for (const answer of answers) assert(worklog.textContent.includes(answer));
}

let example;
for (let seed = 0; seed < 256; seed++) {
  const created = contracts.create('oge-basics', contentId, seed);
  if (/266\s*:\s*33/.test(created.taskSpec.task.prompt)) { example = created; break; }
}
assert(example, 'The introductory example 266 : 33 must be available');
const spec = example.taskSpec;
assert.equal(spec.title, 'Деление: округляем и прикидываем');
assert.equal(spec.divisionTask, null, 'This trainer practises selecting one digit, not an entire division');
assert.deepEqual(spec.items, []);
assert.deepEqual(spec.divisionTasks, []);
const estimateIndex = spec.steps.findIndex(step => step.kind === 'estimate');
const digitIndex = spec.steps.findLastIndex(step => step.kind === 'digit');
assert(estimateIndex >= 0 && estimateIndex < digitIndex);
assert.equal(String(spec.steps[estimateIndex].answer), '9', 'The approximate result is nine');
assert.equal(digitIndex, spec.steps.length - 1, 'The final action selects one digit');
assert.equal(String(spec.steps[digitIndex].answer), '8', 'The checked final digit is eight');

const t = mount(example);
assert.equal(t.host.querySelector('h1').textContent, spec.title);
assert.equal(t.calls.length, 0, 'Opening a saved task must not record progress');
assert.equal(contracts.assistance('oge-basics', spec, t.state()), false);
const snapshots = [];
for (let step = 0; step < spec.steps.length; step++) {
  assert.equal(t.state().step, step);
  assertVisibleWork(t, t.state().answers);
  const wrongDraft = '99999999';
  const failed = t.check(wrongDraft);
  assert.equal(failed.verified.correct, false);
  assert.equal(t.state().step, step);
  assert.equal(t.state().answer, wrongDraft);
  assert.equal(t.state().completed, false);
  snapshots.push({ taskSpec: spec, state: t.state() });

  const beforeHelp = t.state();
  const callsBeforeHelp = t.calls.length;
  t.host.querySelector('#lm-hint').click();
  const hinted = t.state();
  assert.equal(t.calls.length, callsBeforeHelp + 1);
  assert.equal(t.calls.at(-1).kind, 'hint');
  assert.equal(t.calls.at(-1).details.level, 2);
  assert.equal(hinted.hint, 2);
  assert.equal(hinted.step, step);
  assert.deepEqual(hinted.answers, beforeHelp.answers);
  assert.equal(hinted.answer, wrongDraft, 'Help must not fill or replace the answer');
  assert.equal(hinted.completed, false);
  assert.equal(contracts.assistance('oge-basics', spec, hinted), true);
  assert.equal(t.host.querySelector('#lm-answer').value, wrongDraft);
  assert.equal(t.host.querySelectorAll('.lm-feedback.hint').length, 1);
  assertVisibleWork(t, hinted.answers);
  contracts.normalize('oge-basics', spec, hinted);

  if (step === digitIndex) {
    assert.equal(t.host.querySelector('#lm-answer').getAttribute('aria-label'), 'Одна цифра от 0 до 9');
    assert.equal(t.host.querySelector('#lm-answer').getAttribute('inputmode'), 'numeric');
    for (const invalid of ['9', '264', '08', '8.0', '8/1', '+8', '80']) {
      assert.equal(t.check(invalid).verified.correct, false, 'Final digit rejected: ' + invalid);
      assert.equal(t.state().step, digitIndex);
      assert.equal(t.state().completed, false);
    }
  }
  const accepted = t.check(String(spec.steps[step].answer));
  assert.equal(accepted.verified.correct, true);
  assert.equal(t.state().step, step + 1);
  assert.equal(t.state().completed, step === digitIndex);
  assertVisibleWork(t, t.state().answers);
  if (step === estimateIndex) {
    assert.equal(t.state().answers[step], '9');
    assert.equal(t.state().completed, false, 'Accepting an estimate must not accept it as the final digit');
  }
}
assert.equal(t.host.querySelector('#lm-new').textContent, 'Следующий пример →');
assert.equal(t.state().answers.at(-1), '8');
const finished = { taskSpec: spec, state: t.state() };
t.dom.window.close();

// Restore each action, including a wrong draft and its feedback, in a new renderer.
for (const envelope of snapshots) {
  const restored = mount(envelope);
  assert.deepEqual(restored.state(), contracts.normalize('oge-basics', spec, envelope.state));
  assert.equal(restored.host.querySelector('#lm-answer').value, envelope.state.answer);
  assert.equal(restored.host.querySelectorAll('.lm-feedback.incorrect').length, 1);
  assert.equal(restored.calls.length, 0);
  assertVisibleWork(restored, envelope.state.answers);
  const step = envelope.state.step;
  assert.equal(restored.check(String(spec.steps[step].answer)).verified.correct, true);
  assert.equal(restored.state().step, step + 1);
  restored.dom.window.close();

  const observer = mount(envelope, true);
  const observedState = observer.state();
  assert(observer.host.querySelector('#lm-answer').disabled);
  assert(observer.host.querySelector('#lm-check').disabled);
  assert(observer.host.querySelector('#lm-hint').disabled);
  assert(observer.host.querySelector('#lm-note').readOnly);
  observer.host.querySelector('#lm-check').click();
  observer.host.querySelector('#lm-hint').click();
  assert.equal(observer.calls.length, 0);
  assert.deepEqual(observer.state(), observedState);
  assertVisibleWork(observer, envelope.state.answers);
  observer.dom.window.close();
}
const resumedComplete = mount(finished);
assert.equal(resumedComplete.state().completed, true);
assert.equal(resumedComplete.host.querySelector('#lm-answer'), null);
assertVisibleWork(resumedComplete, finished.state.answers);
resumedComplete.dom.window.close();

// Explicit worked help is recorded separately and still leaves the action for the pupil.
const worked = mount(example);
worked.host.querySelector('#lm-solution').click();
assert.equal(worked.state().hint, 3);
assert.equal(worked.calls.at(-1).details.level, 3);
assert.equal(worked.state().step, 0);
assert.equal(worked.state().answer, '');
assert.equal(worked.state().completed, false);
worked.dom.window.close();

// An answer from the approximate step cannot be used to forge a completed result.
const forged = clone(finished.state);
forged.answers[digitIndex] = '9';
assert.throws(() => contracts.normalize('oge-basics', spec, forged));
const skipped = clone(example.state);
skipped.step = 1;
assert.throws(() => contracts.normalize('oge-basics', spec, skipped));

// The public page uses the same actions while keeping its own browser-local draft.
const core = require('../trainers/oge-basics/multiplication-division/quotient-estimate-core');
const publicHtml = fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/quotient-estimate.html'), 'utf8');
const publicSource = fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/quotient-estimate'), 'utf8');
const publicScaffoldsSource = fs.readFileSync(require.resolve('../trainers/oge-basics/learning-scaffolds'), 'utf8');
const storageKey = 'mathExamBasics.quotientEstimate.v1';
function publicMount(saved, options = {}) {
  const dom = new JSDOM(publicHtml, { url: 'https://example.test/quotient-estimate.html', runScripts: 'outside-only' });
  const { window } = dom;
  if (saved !== undefined) window.localStorage.setItem(storageKey, saved);
  if (options.writeFailure) window.Storage.prototype.setItem = () => { throw Error('quota'); };
  window.MathExamRemediationManaged = false;
  window.QuotientEstimate = core;
  window.DivisionLab = division;
  // This page does not load DivisionCourse. Shared help must support that.
  window.eval(publicScaffoldsSource);
  window.eval(publicSource);
  const $ = id => window.document.getElementById(id);
  $('practice').click();
  assert.equal($('view-practice').hidden, false);
  const savedText = () => window.localStorage.getItem(storageKey);
  const state = () => JSON.parse(savedText()).state;
  const type = value => {
    $('estimate-answer').value = value;
    $('estimate-answer').dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const check = value => {
    type(value);
    $('estimate-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  };
  return { dom, $, state, savedText, type, check };
}
let standalone = publicMount();
const publicTask = core.makeV2(1);
assert.equal(standalone.savedText(), null, 'Opening a new page does not write progress');
assert.match(standalone.$('estimate-task').textContent, /266\s*:\s*33/);
for (let step = 0; step < publicTask.steps.length; step++) {
  standalone.check('99999999');
  assert.equal(standalone.state().answers.length, step);
  assert.equal(standalone.$('estimate-feedback').className, 'incorrect');
  assert.notEqual(standalone.$('estimate-feedback').textContent, publicTask.steps[step].hint, 'A wrong answer does not reveal worked help');
  standalone.$('estimate-hint').click();
  assert.equal(standalone.state().help, true);
  assert.equal(standalone.state().answers.length, step);
  assert.equal(standalone.$('estimate-answer').value, '99999999');
  assert.equal(standalone.$('estimate-help').hidden, false);
  assert.equal(standalone.$('estimate-help').querySelector('[data-scaffold-result]'), null, 'First help does not print the result');
  assert(!standalone.$('estimate-help').textContent.includes(publicTask.steps[step].hint), 'First help is the short contextual action, not the canonical answer');
  if (step === 0) {
    assert.equal(standalone.$('estimate-help').querySelector('[data-help-number]').textContent, '33');
    assert(!standalone.$('estimate-help').textContent.includes('Получается 30'));
  }
  const saved = standalone.savedText();
  assert.equal(JSON.parse(saved).generatorVersion, 2);
  standalone.dom.window.close();
  standalone = publicMount(saved);
  assert.equal(standalone.$('estimate-answer').value, '99999999');
  assert.equal(standalone.state().answers.length, step);
  assert.equal(standalone.$('estimate-trail').children.length, step);
  assert.equal(standalone.$('estimate-trail').hidden, false);
  standalone.check(publicTask.steps[step].answer);
  assert.equal(standalone.state().answers.length, step + 1);
  assert.equal(standalone.$('estimate-trail').children.length, step + 1);
}
assert.equal(standalone.$('estimate-form').hidden, true);
assert.match(standalone.$('estimate-feedback').textContent, /с подсказкой/);
assert.equal(standalone.state().answers.at(-1), '8');
const completedPublic = standalone.savedText();
standalone.dom.window.close();
standalone = publicMount(completedPublic);
assert.equal(standalone.$('estimate-form').hidden, true);
assert.equal(standalone.$('estimate-trail').children.length, publicTask.steps.length);
standalone.$('estimate-new').click();
assert.equal(JSON.parse(standalone.savedText()).seed, 2);
assert.equal(JSON.parse(standalone.savedText()).generatorVersion, 2);
assert.equal(standalone.state().answers.length, 0);
assert.equal(standalone.state().help, false);
assert.equal(standalone.$('estimate-task').textContent, core.makeV2(2).task.prompt);
standalone.dom.window.close();

// Explicit worked help is the only place that prints the selected answer.
standalone = publicMount();
standalone.type('123');
standalone.$('estimate-solution').click();
assert.equal(standalone.state().help, true);
assert.equal(standalone.state().answers.length, 0);
assert.equal(standalone.$('estimate-answer').value, '123');
assert.match(standalone.$('estimate-help').querySelector('[data-scaffold-result]').textContent, /30/);
const solutionSaved = standalone.savedText();
standalone.dom.window.close();
standalone = publicMount(solutionSaved);
assert.equal(standalone.$('estimate-answer').value, '123');
assert(standalone.$('estimate-help').querySelector('[data-scaffold-result]'));
assert.equal(standalone.savedText(), solutionSaved, 'Reloading help does not mutate the saved attempt');
standalone.dom.window.close();

const plainState = { answers: [], answer: '', help: false, feedback: null };
const finalPublic = JSON.stringify({ seed: 1, generatorVersion: 2, state: { ...plainState, answers: publicTask.steps.slice(0, -1).map(step => step.answer) } });
standalone = publicMount(finalPublic);
standalone.$('estimate-hint').click();
assert.equal(standalone.$('estimate-help').querySelector('.lm-scaffold-selected'), null, 'First help leaves the final digit for the pupil');
standalone.$('estimate-solution').click();
assert.equal(standalone.$('estimate-help').querySelector('.lm-scaffold-selected th').textContent, '8', 'The worked table highlights the correct row');
assert.equal(standalone.$('estimate-help').querySelectorAll('tbody tr').length, 10);
assert.equal(standalone.state().answers.length, publicTask.steps.length - 1, 'Worked help never completes the final digit');
assert.equal(standalone.$('estimate-answer').value, '');
standalone.dom.window.close();

const legacyTask = core.make(2);
assert.notEqual(legacyTask.task.prompt, core.makeV2(2).task.prompt);
const legacySaved = JSON.stringify({ seed: 2, state: { ...plainState, answers: [legacyTask.steps[0].answer], answer: '321', feedback: { kind: 'incorrect', text: '<img src=x onerror=alert(1)>' } } });
standalone = publicMount(legacySaved);
assert.equal(standalone.$('estimate-task').textContent, legacyTask.task.prompt);
assert.equal(standalone.$('estimate-answer').value, '321');
assert.equal(standalone.$('estimate-trail').children.length, 1);
assert.equal(standalone.savedText(), legacySaved, 'Unmarked legacy work is read without migration writes');
assert.equal(standalone.$('estimate-feedback').querySelector('img'), null);
assert(!standalone.$('estimate-feedback').textContent.includes('<img'), 'Stored feedback is regenerated, never interpreted as help');
standalone.check(legacyTask.steps[1].answer);
assert.equal(JSON.parse(standalone.savedText()).generatorVersion, 1, 'Continuing old work keeps the old generator');
assert.equal(standalone.state().answers.length, 2);
assert.equal(standalone.$('estimate-task').textContent, legacyTask.task.prompt);
standalone.$('estimate-new').click();
assert.equal(JSON.parse(standalone.savedText()).generatorVersion, 2, 'The next attempt opts in to the expanded generator');
assert.notEqual(standalone.$('estimate-task').textContent, legacyTask.task.prompt);
assert.equal(standalone.state().answers.length, 0);
assert.equal(standalone.state().help, false);
standalone.dom.window.close();

for (const version of [1, 2]) {
  const seed = 41, task = version === 1 ? core.make(seed) : core.makeV2(seed);
  const saved = JSON.stringify({ seed, generatorVersion: version, state: { ...plainState, answers: [task.steps[0].answer], answer: '999' } });
  standalone = publicMount(saved);
  assert.equal(standalone.$('estimate-task').textContent, task.task.prompt);
  assert.equal(standalone.$('estimate-answer').value, '999');
  assert.equal(standalone.$('estimate-trail').children.length, 1);
  assert.equal(standalone.savedText(), saved);
  standalone.dom.window.close();
}

const damaged = [
  '', '{not json', 'null', '[]',
  JSON.stringify({ seed: -1, state: plainState }),
  JSON.stringify({ seed: 1, generatorVersion: 3, state: plainState }),
  JSON.stringify({ seed: 1, state: { ...plainState, answers: ['999'] } }),
  JSON.stringify({ seed: 1, state: { ...plainState, answer: '1'.repeat(31) } }),
  JSON.stringify({ seed: 1, state: { ...plainState, help: 'yes' } }),
  JSON.stringify({ seed: 1, state: { ...plainState, feedback: [] } })
];
for (const saved of damaged) {
  standalone = publicMount(saved);
  assert.match(standalone.$('estimate-notice').textContent, /оставлена без изменений/);
  assert.equal(standalone.savedText(), saved);
  standalone.type('999');standalone.$('estimate-hint').click();standalone.$('estimate-solution').click();
  standalone.check(core.makeV2(1).steps[0].answer);
  standalone.$('estimate-new').click();
  assert.equal(standalone.savedText(), saved, 'A damaged record is not overwritten by any training action');
  assert.match(standalone.$('estimate-notice').textContent, /не сохранится/);
  standalone.dom.window.close();
}

standalone = publicMount();
const newConditions = new Set([standalone.$('estimate-task').textContent]);
let previousCondition = standalone.$('estimate-task').textContent;
for (let i = 0; i < 100; i++) {
  standalone.$('estimate-new').click();
  const condition = standalone.$('estimate-task').textContent;
  assert.notEqual(condition, previousCondition, 'Next never repeats the visible condition immediately');
  newConditions.add(condition);previousCondition = condition;
}
assert.equal(newConditions.size, 101, 'The public page no longer cycles after 37 examples');
standalone.dom.window.close();

standalone = publicMount(undefined, { writeFailure: true });
standalone.check(publicTask.steps[0].answer);
assert.match(standalone.$('estimate-notice').textContent, /Не удалось сохранить работу/);
assert.equal(standalone.savedText(), null);
assert.equal(standalone.$('estimate-trail').children.length, 1, 'Unavailable storage does not erase in-memory progress');
standalone.dom.window.close();
assert.match(publicHtml, /src="\.\.\/learning-scaffolds\.js(?:\?[^\"]*)?"/);

console.log('LEARNING_QUOTIENT_ESTIMATE_DOM_OK (managed and standalone; v1/v2 exact restore; checked prefix and wrong draft; non-answer first help; explicit worked help; read-only mirror; 101 distinct next examples; malformed storage preserved)');
