'use strict';

// Synthetic attempts only: exercise the real renderer and optional help together.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const contracts = require('../board-server/learning-contracts');
const remediation = require('../trainers/oge-basics/learning-contracts');
const repo = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(repo, 'trainers/oge-basics', name), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));

function mount(t, contentId, options = {}) {
  const envelope = options.envelope || contracts.create('oge-basics', contentId, 17);
  const dom = new JSDOM('<main id="learning-remediation-root"></main>', { url: 'https://example.test/?learning=1', runScripts: 'outside-only' });
  const { window } = dom, events = [];
  Object.assign(window, {
    MathExamRemediationManaged: true,
    DivisionLab: require('../trainers/oge-basics/multiplication-division/division-lab-core'),
    DivisionCourse: require('../trainers/oge-basics/multiplication-division/division-course-core'),
    MultiplicationColumn: require('../trainers/oge-basics/multiplication-division/multiplication-column-core'),
    ArithmeticCourse: require('../learning/division-course-map'),
    MathExamRemediation: remediation,
    LearningScaffolds: require('../trainers/oge-basics/learning-scaffolds')
  });
  let bridge;
  window.MathExamLearning = { register(value) { bridge = value; } };
  if (!options.lateHelp) window.eval(source('basics-help.js'));
  window.eval(source('learning-managed.js'));
  bridge.subscribe(event => events.push(clone(event)));
  bridge.applyState({ ...clone(envelope), readOnly: !!options.readOnly });
  t.after(() => dom.window.close());
  const $ = selector => window.document.querySelector(selector);
  const state = () => clone(bridge.getState());
  const type = (selector, value) => {
    const field = $(selector); assert(field, selector);
    field.value = value; field.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const echo = readOnly => bridge.applyState({ taskSpec: clone(envelope.taskSpec), state: state(), readOnly: !!readOnly });
  return { window, $, state, events, bridge, envelope, type, echo };
}

test('task is immediate; optional notes and topic tools start collapsed', t => {
  const f = mount(t, 'percentages/percent-of-number-and-whole');
  assert(f.$('#lm-answer'));
  assert.equal(f.$('#lm-tools').open, false);
  assert.equal(f.$('#lm-notes').open, false);
  assert.equal(f.$('.bh-panel').hidden, true);
  assert.equal(f.$('.bh-toggle').textContent, 'Нужна помощь?');
  assert.equal(f.events.length, 0);
  assert.equal(f.$('.lm-scaffold'), null, 'No answer-bearing scaffold is rendered before explicit help');
});

test('six help levels preserve the real task, child draft, focus and notes across bridge echoes', async t => {
  const f = mount(t, 'percentages/percent-of-number-and-whole');
  f.type('#lm-answer', 'draft 47');
  f.$('#lm-notes').open = true; await tick();
  f.type('#lm-note', 'Моя незаконченная запись');
  const answer = f.$('#lm-answer'), before = f.state();
  f.$('.bh-toggle').click();
  assert.equal(f.$('#lm-answer'), answer, 'Opening help does not replace the task field');
  assert.equal(f.events.filter(e => e.kind === 'hint').length, 1);
  for (const skill of ['percent-part', 'divide', 'quotient', 'multiply', 'add', 'count']) {
    f.$('.bh-frame:not([hidden]) .bh-deeper[data-bh-skill="' + skill + '"]').click();
  }
  assert.equal(f.$('.bh-panel').dataset.bhDepth, '6');
  const child = f.$('[data-bh-node="count"] .bh-answer');
  child.value = 'six?'; child.focus(); child.setSelectionRange(2, 3);
  f.echo();
  assert.equal(f.$('[data-bh-node="count"] .bh-answer'), child, 'A server echo preserves the exact child DOM');
  assert.equal(child.value, 'six?');
  assert.equal(f.window.document.activeElement, child);
  assert.equal(child.selectionStart, 2);
  assert.equal(f.$('.bh-panel').dataset.bhDepth, '6');
  assert.equal(f.$('#lm-answer').value, 'draft 47');
  assert.equal(f.$('#lm-note').value, before.note);
  assert.equal(f.$('#lm-notes').open, true);
  const checks = f.events.filter(e => e.kind === 'check').length;
  child.value = '8'; f.$('[data-bh-node="count"] .bh-check').click();
  assert.equal(f.$('[data-bh-node="count"]').dataset.bhSolved, 'true');
  assert.equal(f.events.filter(e => e.kind === 'check').length, checks, 'Child success earns no parent credit');
  assert.equal(f.state().step, before.step);
  assert.deepEqual(f.state().answers, before.answers);
  f.$('.bh-back').click();
  assert.equal(f.$('.bh-panel').dataset.bhDepth, '5');
  f.$('.bh-root').click();
  assert.equal(f.$('.bh-panel').dataset.bhDepth, '0');
  assert.equal(f.$('#lm-answer').value, 'draft 47');
  f.$('.bh-close').click();
  assert.equal(f.$('.bh-panel').hidden, true);
  assert.equal(f.state().answer, before.answer);
});

test('a newly accepted division step resets help while all accepted work stays visible', t => {
  const f = mount(t, 'multiplication-division/course-whole-simple');
  f.$('.bh-toggle').click();
  f.$('.bh-frame:not([hidden]) .bh-deeper').click();
  assert.notEqual(f.$('.bh-panel').dataset.bhDepth, '0');
  f.type('#lm-answer', String(f.envelope.taskSpec.steps[0].answer));
  f.$('#lm-check').click();
  assert.equal(f.state().step, 1);
  assert.equal(f.$('.bh-panel').hidden, true);
  assert.equal(f.$('.bh-panel').dataset.bhDepth, '0');
  assert.equal(f.$('.lm-division').closest('details,[hidden]'), null);
  assert.equal(f.$('.lm-current-help').textContent, '', 'The preceding step hint cannot leak into the next step');
  f.$('.bh-toggle').click();
  assert.equal(f.$('.bh-frame:not([hidden]) .bh-deeper').dataset.bhSkill, 'quotient');
});

test('checkpoint scaffolds appear only on request; saved help restores without extra events', t => {
  const id = 'multiplication-division/course-independent-check';
  const f = mount(t, id);
  assert.equal(f.$('.lm-scaffold'), null);
  f.$('.bh-toggle').click();
  assert(f.$('.lm-feedback.hint'));
  const envelope = { taskSpec: clone(f.envelope.taskSpec), state: f.state() };
  const restored = mount(t, id, { envelope });
  assert.equal(restored.$('.bh-panel').hidden, false);
  assert(restored.$('.lm-feedback.hint'));
  assert.deepEqual(restored.state(), envelope.state);
  assert.equal(restored.events.length, 0, 'Restoring an already disclosed hint does not add assistance');
});

test('a wrong parent check retains disclosed help beside its new feedback', t => {
  const f = mount(t, 'percentages/percent-of-number-and-whole');
  f.$('.bh-toggle').click();
  const hint = f.$('.lm-current-help').textContent;
  f.type('#lm-answer', '-12345'); f.$('#lm-check').click();
  assert.equal(f.state().feedback.kind, 'incorrect');
  assert(f.$('.lm-feedback.incorrect'));
  assert.equal(f.$('.lm-current-help').textContent, hint);
  assert.equal(f.$('.bh-panel').hidden, false);
  assert.equal(f.events.filter(e => e.kind === 'hint').length, 1);
});

test('read-only state closes help and blocks retained parent and child controls', t => {
  const f = mount(t, 'percentages/percent-of-number-and-whole');
  f.$('.bh-toggle').click(); f.$('.bh-deeper').click();
  const child = f.$('.bh-frame:not([hidden]) .bh-answer'); child.value = '20';
  const check = f.$('.bh-frame:not([hidden]) .bh-check'), oldHint = f.$('#lm-hint'), oldMain = f.$('#lm-check');
  f.echo(true);
  const before = f.state(), eventCount = f.events.length;
  assert.equal(f.$('.bh-panel').hidden, true);
  assert.equal(f.$('.lm-feedback.hint').closest('[hidden],details:not([open])'), null, 'The observer still sees the saved parent hint');
  for (const control of f.window.document.querySelectorAll('button,input')) assert(control.disabled, control.outerHTML);
  assert(f.$('#lm-note').readOnly);
  check.click(); oldHint.click(); oldMain.click(); f.$('.bh-toggle').click();
  assert.equal(f.events.length, eventCount);
  assert.deepEqual(f.state(), before);
  assert.equal(f.$('.bh-panel').hidden, true);
});

test('late optional helper replaces fallback without changing the saved task draft', t => {
  const f = mount(t, 'percentages/percent-of-number-and-whole', { lateHelp: true });
  assert(f.$('.lm-help-fallback'));
  f.type('#lm-answer', '39');
  const before = f.state();
  f.window.eval(source('basics-help.js'));
  assert(f.$('.bh-toggle'));
  assert.equal(f.$('.lm-help-fallback'), null);
  assert.equal(f.$('#lm-answer').value, '39');
  assert.deepEqual(f.state(), before);
  assert.equal(f.events.filter(e => e.kind === 'hint').length, 0);
});

test('public wrapper opens the saved task immediately without rewriting its record', t => {
  const id = 'multiplication-division/course-whole-simple';
  const made = remediation.create(id, 17, { generatorVersion: 1 });
  made.state.answer = 'unfinished'; made.state.note = 'Запись до перезагрузки';
  const record = JSON.stringify({ version: 1, seed: 17, state: made.state, assisted: false, errors: 0 });
  const key = 'mathExamBasics.divisionCourse.v1.' + id, writes = [];
  const dom = new JSDOM('<body data-course-id="' + id + '"><div class="course-practice-start"><button id="practice">Начать</button></div><section id="view-practice" hidden><div id="course-local-root"></div></section></body>', { url: 'https://example.test/trainers/oge-basics/' + id + '.html', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const { window } = dom;
  Object.defineProperty(window, 'localStorage', { value: { getItem: name => name === key ? record : null, setItem: (...args) => writes.push(args) } });
  Object.assign(window, {
    MathExamRemediation: remediation,
    DivisionCourse: require('../trainers/oge-basics/multiplication-division/division-course-core'),
    DivisionLab: require('../trainers/oge-basics/multiplication-division/division-lab-core')
  });
  window.eval(source('basics-help.js'));
  window.eval(source('multiplication-division/division-course-practice.js'));
  window.eval(source('learning-managed.js'));
  assert.equal(window.document.querySelector('#view-practice').hidden, false);
  assert.equal(window.document.querySelector('.course-practice-start').hidden, true);
  assert.equal(window.document.querySelector('#lm-answer').value, 'unfinished');
  assert.equal(window.document.querySelector('#lm-note').value, made.state.note);
  assert.equal(window.document.querySelector('.course-local-notice').hidden, true);
  assert.deepEqual(writes, []);
});
