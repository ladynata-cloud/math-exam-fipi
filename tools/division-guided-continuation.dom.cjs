'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM} = require('jsdom');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core');
const base = path.resolve(__dirname, '../trainers/oge-basics');
const sub = 'multiplication-division/';
const KEY = 'mathExamBasics.guidedDivision.v1';
const html = fs.readFileSync(path.join(base, sub, 'long-division-from-simple-to-decimals.html'), 'utf8');
const scripts = ['basics-help.js', ...[
  'division-lab-core.js', 'division-guided-core.js', '../arithmetic-route.js',
  'decimal-shift.js', 'multiplication-refresh.js', 'division-guided.js'
].map(file => sub + file)];

function open(t, topic = 'start', saved) {
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/trainers/oge-basics/' + sub + 'long-division-from-simple-to-decimals.html#' + topic,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.structuredClone = structuredClone;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (saved) w.localStorage.setItem(KEY, typeof saved === 'string' ? saved : JSON.stringify(saved));
  for (const file of scripts) w.eval(fs.readFileSync(path.join(base, file), 'utf8'));
  return {
    w, d, $: selector => d.querySelector(selector),
    state: () => w.__divisionGuidedDebug.state(),
    session() { const s = this.state(); return s.sessions[s.active]; },
    plan: () => w.__divisionGuidedDebug.plan(),
    stored: () => w.localStorage.getItem(KEY)
  };
}

function submit(f, value) {
  const action = f.plan().actions[f.session().step];
  if (action.options) {
    if (value !== '') f.$('[data-option="' + value + '"]').click();
  } else {
    f.$('#answer').value = value;
    f.$('#answer').dispatchEvent(new f.w.Event('input', {bubbles: true}));
  }
  f.$('#answer-form').dispatchEvent(new f.w.Event('submit', {cancelable: true}));
}

function complete(f) {
  for (let guard = 0; guard < 220 && !f.session().done; guard++) {
    submit(f, f.plan().actions[f.session().step].answer);
  }
  assert.equal(f.session().done, true, 'the example finishes');
}

for (const topic of G.topics) test(topic.id + ': each mathematical action needs one successful submission', t => {
  const f = open(t, topic.id), actions = f.plan().actions, original = f.$('#problem').textContent;
  assert.equal(f.session().answers.length, 0);
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const before = f.session();
    assert.equal(before.step, index, action.kind + ': no action skipped');
    submit(f, '');
    assert.deepEqual(f.session().answers, before.answers, action.kind + ': empty answer does not advance');
    assert.equal(f.session().errors, before.errors, 'an empty answer is not counted as a mathematical error');
    const wrong = action.options ? action.options.find(o => o.value !== action.answer).value : '9999999';
    submit(f, wrong);
    assert.equal(f.session().step, index, action.kind + ': wrong answer stays on the same question');
    assert.deepEqual(f.session().answers, before.answers);
    assert.equal(f.session().errors, before.errors + 1);
    submit(f, action.answer);
    const after = f.session();
    assert.equal(after.answers.length, index + 1, action.kind + ': accepted exactly once');
    assert.equal(after.answers[index], action.answer);
    assert.equal(f.$('#problem').textContent, original, 'the original problem stays visible');
    if (index < actions.length - 1) {
      assert.equal(after.step, index + 1);
      assert.equal(after.accepted, false, 'there is no intermediate confirmation screen');
      assert.equal(after.draft, '');
      assert.equal(f.$('#answer').value, '');
      assert.equal(f.$('#primary').textContent, 'Проверить');
      const target = actions[index + 1].options ? f.$('[data-option]') : f.$('#answer');
      assert.equal(f.d.activeElement, target, 'focus follows the next mathematical action');
    } else {
      assert.equal(after.done, true);
      assert.equal(f.$('#completion').hidden, false);
      assert.equal(f.d.activeElement, f.$('#next-example'));
    }
  }
  assert.equal(f.state().records.length, 1);
  assert.equal(f.session().answers.length, actions.length);
  assert.equal(f.session().hints, 0, 'automatic continuation does not count as assistance');
  assert.equal(f.session().reveals, 0);
  if (!f.plan().micropractice) {
    assert.equal(f.$('.quotient').textContent.replaceAll('·', ''), f.plan().quotient);
    assert(f.$('.subtraction'), 'completed calculations remain in the notebook');
  }
  f.$('#answer-form').dispatchEvent(new f.w.Event('submit', {cancelable: true}));
  assert.equal(f.state().records.length, 1, 'a repeated final submit does not record completion twice');
  const resumed = open(t, topic.id, f.stored());
  assert.equal(resumed.session().done, true);
  assert.equal(resumed.state().records.length, 1, 'reload retains exactly one completion');
});

test('legacy accepted v1 sessions resume once and retain earned answers and assistance', t => {
  const initial = open(t), legacy = initial.state(), session = legacy.sessions.start;
  const answer = initial.plan().actions[0].answer;
  Object.assign(session, {step: 0, answers: [answer], accepted: true, draft: answer, hints: 2, reveals: 1, errors: 3});
  const resumed = open(t, 'start', legacy);
  assert.equal(resumed.$('#storage-notice').hidden, true, 'legacy work is valid');
  assert.equal(resumed.session().step, 1);
  assert.equal(resumed.session().accepted, false);
  assert.equal(resumed.session().draft, '');
  assert.deepEqual(resumed.session().answers, [answer]);
  for (const [key, value] of Object.entries({hints: 2, reveals: 1, errors: 3})) assert.equal(resumed.session()[key], value);
  const reloaded = open(t, 'start', resumed.stored());
  assert.equal(reloaded.session().step, 1, 'a second reload does not advance again');
  assert.deepEqual(reloaded.session().answers, [answer]);
  complete(reloaded);
  assert.equal(reloaded.state().records.length, 1);
  assert.equal(reloaded.state().records[0].hints, 2);
  assert.equal(reloaded.state().records[0].reveals, 1);
  assert.equal(reloaded.state().records[0].errors, 3);
  assert.match(reloaded.$('#completion-text').textContent, /помощью/);
});

test('contextual help closes on success while its assistance survives continuation and reload', t => {
  const f = open(t);
  f.$('.bh-toggle').click();
  assert.equal(f.$('.bh-panel').hidden, false);
  assert.equal(f.session().hints, 1);
  f.$('#reveal').click();
  assert.equal(f.session().reveals, 1);
  assert(f.$('#revealed').textContent.includes(f.plan().actions[0].answer));
  submit(f, f.plan().actions[0].answer);
  assert.equal(f.session().step, 1);
  assert.equal(f.$('.bh-panel').hidden, true, 'the previous explanation is not carried into a different step');
  assert.equal(f.$('#revealed').textContent, '');
  assert.equal(f.session().hints, 1);
  assert.equal(f.session().reveals, 1);
  f.$('#answer').value = '2';
  f.$('#answer').dispatchEvent(new f.w.Event('input', {bubbles: true}));
  const resumed = open(t, 'start', f.stored());
  assert.equal(resumed.session().step, 1);
  assert.equal(resumed.$('#answer').value, '2', 'a pending draft survives reload');
  assert.equal(resumed.session().hints, 1);
  assert.equal(resumed.session().reveals, 1);
  assert.equal(resumed.$('.bh-panel').hidden, true);
  complete(resumed);
  assert.match(resumed.$('#completion-text').textContent, /помощью/);
  assert.equal(resumed.state().records[0].hints, 1);
  assert.equal(resumed.state().records[0].reveals, 1);
});
