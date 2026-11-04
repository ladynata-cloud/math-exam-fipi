'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');

const root = path.resolve(__dirname, '..');
const pathname = '/trainers/oge-1-5-trainers/percent-table-trainer.html';
const html = fs.readFileSync(path.join(root, pathname), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
const clone = value => JSON.parse(JSON.stringify(value));

class LocalResources extends ResourceLoader {
  fetch(url) {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://mathexam.space') return null;
    const file = path.join(root, parsed.pathname);
    return fs.existsSync(file) && fs.statSync(file).isFile()
      ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}

async function open(t, {skill = 'of', difficulty = 'standard', draws = []} = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const queue = [...draws];
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space' + pathname,
    resources: new LocalResources(), runScripts: 'dangerously',
    pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.Math.random = () => queue.length ? queue.shift() : 0.1;
      window.localStorage.setItem('percentTrainer.v1', JSON.stringify({skill, difficulty}));
    }
  });
  t.after(() => {
    dom.window.close();
    assert.deepEqual(errors, [], 'no runtime errors while navigating or checking');
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, {once: true}));
  await tick();
  const api = dom.window.__PERCENT_TRAINER_TEST__;
  assert.ok(api);
  assert.equal(dom.window.document.documentElement.dataset.practicalMinimal, 'ready');
  return {window: dom.window, doc: dom.window.document, api};
}

function shown(node) {
  if (!node) return false;
  for (let parent = node; parent && parent.nodeType === 1; parent = parent.parentElement) {
    if (parent.hidden) return false;
    if (parent.tagName === 'DETAILS' && !parent.open && node !== parent.querySelector(':scope > summary')) return false;
    const style = parent.ownerDocument.defaultView.getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

function fill(window, input, value) {
  input.value = value;
  input.dispatchEvent(new window.Event('input', {bubbles: true}));
}

function answerControls(doc, prefix) {
  const input = doc.getElementById(prefix + '-input');
  const label = doc.getElementById(prefix + '-answer-label');
  const hint = doc.getElementById(prefix + '-answer-hint');
  assert.ok(shown(input) && shown(label) && shown(hint), prefix + ': visible instructions beside input');
  assert.equal(label.htmlFor, input.id);
  assert.equal(input.getAttribute('aria-labelledby'), label.id);
  assert.ok(input.getAttribute('aria-describedby').split(/\s+/).includes(hint.id));
  assert.ok(label.textContent.trim().length > 15, 'a concrete question, not just “answer”');
  assert.match(hint.textContent, /[Вв]веди/);
  return {input, label, hint};
}

// These fixed examples specify the expected mathematical quantity independently
// of the new answerPrompt/inputHint metadata. RNG only selects the example.
const cases = [
  {name: 'percent of a number', skill: 'of', draws: [6.1 / 11, 2.1 / 9], answer: 80, unit: '', question: [/40\s*%/, /200/], label: [/40\s*%/, /200/], format: /число/},
  {name: 'expense share', skill: 'table', answer: 15, unit: '%', label: [/процент/, /расход/], format: /процент/},
  {name: 'percentage change', skill: 'change', answer: 10, unit: '%', label: [/На сколько процентов/, /цен/], format: /процент.*изменени/},
  {name: 'new price', skill: 'apply', answer: 132, unit: 'руб', label: [/после изменени/], format: /новую цену.*руб/},
  {name: 'original price', skill: 'reverse', answer: 120, unit: 'руб', label: [/до изменени/], format: /исходную цену.*руб/},
  {name: 'fractional percent', difficulty: 'advanced', draws: [0.1 / 5], answer: 4, unit: '', label: [/2,5\s*%/, /160/], format: /число/},
  {name: 'fractional share', difficulty: 'advanced', draws: [1.1 / 5], answer: 12.5, unit: '%', label: [/Сколько процентов/, /18/, /144/], format: /процент/},
  {name: 'comparison', difficulty: 'advanced', draws: [2.1 / 5], answer: 12.5, unit: '%', label: [/На сколько процентов/, /180/, /160/], format: /процент.*различи/},
  {name: 'two successive changes', difficulty: 'advanced', draws: [3.1 / 5], answer: 495, unit: 'руб', label: [/цен/, /обоих изменени/], format: /окончательную цену.*руб/},
  {name: 'more than 100 percent', difficulty: 'advanced', draws: [4.1 / 5], answer: 88, unit: '', label: [/110\s*%/, /80/], format: /число/}
];

for (const example of cases) test('specific input instructions and accepted quantity: ' + example.name, async t => {
  const {window, doc, api} = await open(t, example);
  const task = api.getState().current;
  const {input, label, hint} = answerControls(doc, 'practice');
  for (const pattern of example.question || []) assert.match(doc.getElementById('practice-question').textContent, pattern);
  for (const pattern of example.label) assert.match(label.textContent, pattern);
  assert.match(hint.textContent, example.format);
  assert.equal(doc.getElementById('practice-unit').textContent, example.unit);
  assert.equal(task.unit, example.unit);
  assert.ok(Math.abs(task.answer - example.answer) < 1e-9, 'correct quantity in the fixed example');
  assert.doesNotMatch(label.textContent + hint.textContent, /умнож|раздели|вычти|прибавь|÷|·| = /i, 'instructions do not reveal the solution method');
  fill(window, input, String(example.answer).replace('.', ','));
  doc.getElementById('practice-check').click();
  await tick();
  assert.equal(api.getState().taskState.outcome, 'independent');
  const after = clone(api.getState());
  doc.getElementById('practice-check').click();
  assert.deepEqual(clone(api.getState().stats), after.stats, 'checking twice cannot credit twice');
  assert.deepEqual(clone(api.getState().advanced), after.advanced);
});

test('40% of 200: basis hint does not turn the final-answer field into a basis question', async t => {
  const {window, doc, api} = await open(t, cases[0]);
  const {input, label} = answerControls(doc, 'practice');
  const originalQuestion = label.textContent;
  doc.getElementById('hint-btn').click();
  await tick();
  assert.match(doc.getElementById('hint-stack').textContent, /200.*100%/s);
  assert.match(doc.getElementById('practice-help').textContent, /промежуточные.*итог всей задачи/s);
  assert.equal(label.textContent, originalQuestion);
  fill(window, input, '200');
  doc.getElementById('practice-check').click();
  assert.equal(api.getState().taskState.answered, false, 'basis is not the requested result');
  fill(window, input, '80');
  doc.getElementById('practice-check').click();
  assert.equal(api.getState().taskState.outcome, 'supported');
  assert.equal(api.getState().stats.of.independent, 0);
  assert.equal(api.getState().stats.of.supported, 1);
});

test('return from help and reopen preserve task, draft and assistance across repeated navigation', async t => {
  const {window, doc, api} = await open(t, cases[0]);
  const input = doc.getElementById('practice-input');
  fill(window, input, '12,5');
  const question = doc.getElementById('practice-question').innerHTML;
  doc.getElementById('hint-btn').click();
  doc.getElementById('hint-btn').click();
  await tick();
  const helped = clone(api.getState());
  assert.equal(helped.taskState.hintLevel, 2);
  for (let i = 0; i < 3; i++) {
    assert.ok(shown(doc.getElementById('practice-return-answer')));
    doc.getElementById('practice-return-answer').click();
    await tick();
    assert.equal(shown(doc.getElementById('practice-help')), false);
    assert.equal(doc.activeElement, input);
    assert.equal(doc.getElementById('hint-btn').getAttribute('aria-expanded'), 'false');
    assert.equal(input.value, '12,5');
    assert.equal(api.getState().current.id, helped.current.id);
    assert.equal(api.getState().taskState.hintLevel, 2);
    assert.match(doc.getElementById('credit-chip').textContent, /подсказкой/);
    doc.getElementById('hint-btn').click();
    await tick();
    assert.ok(shown(doc.getElementById('practice-help')));
    assert.equal(doc.getElementById('hint-btn').getAttribute('aria-expanded'), 'true');
    assert.equal(doc.getElementById('hint-stack').children.length, 2);
    assert.equal(api.getState().taskState.hintLevel, 2, 'reopening is not the next hint');
  }
  assert.equal(doc.getElementById('practice-question').innerHTML, question);
  assert.deepEqual(clone(api.getState().stats), helped.stats);
  fill(window, input, '80');
  doc.getElementById('practice-check').click();
  assert.equal(api.getState().taskState.outcome, 'supported', 'hiding help does not erase its use');
});

test('two wrong answers expose the promised automatic hint without deleting the draft or errors', async t => {
  const {window, doc, api} = await open(t, cases[0]);
  const input = doc.getElementById('practice-input');
  const id = api.getState().current.id;
  fill(window, input, '-123456');
  doc.getElementById('practice-check').click();
  assert.equal(api.getState().taskState.hintLevel, 0);
  doc.getElementById('practice-check').click();
  await tick();
  assert.equal(api.getState().taskState.hintLevel, 1);
  assert.ok(shown(doc.getElementById('practice-help')), 'automatically offered hint is actually visible');
  assert.equal(doc.getElementById('hint-btn').getAttribute('aria-expanded'), 'true');
  assert.equal(doc.getElementById('hint-stack').children.length, 1);
  assert.match(doc.getElementById('hint-stack').textContent, /200.*100%/s);
  assert.equal(input.value, '-123456');
  assert.equal(api.getState().current.id, id);
  assert.equal(api.getState().taskState.wrongAttempts, 2);
  assert.equal(api.getState().stats.of.errors, 2);
  fill(window, input, '80');
  doc.getElementById('practice-check').click();
  assert.equal(api.getState().taskState.outcome, 'supported');
});

test('an intentionally closed hint stays closed after another wrong answer', async t => {
  const {window, doc, api} = await open(t, cases[0]);
  doc.getElementById('hint-btn').click();
  doc.getElementById('practice-return-answer').click();
  const input = doc.getElementById('practice-input');
  fill(window, input, '-123456');
  doc.getElementById('practice-check').click();
  doc.getElementById('practice-check').click();
  await tick();
  assert.equal(api.getState().taskState.hintLevel, 1);
  assert.equal(api.getState().taskState.wrongAttempts, 2);
  assert.equal(shown(doc.getElementById('practice-help')), false);
  assert.equal(doc.getElementById('hint-btn').getAttribute('aria-expanded'), 'false');
  assert.equal(input.value, '-123456');
  doc.getElementById('hint-btn').click();
  await tick();
  assert.ok(shown(doc.getElementById('practice-help')));
  assert.equal(api.getState().taskState.hintLevel, 1);
});

test('returning from explanation through either control retains the unfinished exercise', async t => {
  const {window, doc, api} = await open(t, cases[0]);
  const input = doc.getElementById('practice-input');
  fill(window, input, '12,5');
  doc.getElementById('hint-btn').click();
  await tick();
  const before = clone(api.getState());
  for (const returnSelector of ['#learn-return-task', '.main-nav [data-view="practice"]']) {
    doc.querySelector('.main-nav [data-view="learn"]').click();
    await tick();
    assert.equal(doc.getElementById('view-learn').hidden, false);
    assert.ok(shown(doc.getElementById('learn-return-task')));
    doc.querySelector(returnSelector).click();
    await tick();
    assert.equal(doc.getElementById('view-practice').hidden, false);
    assert.equal(doc.getElementById('practice-input'), input, 'same real input node');
    assert.equal(input.value, '12,5');
    assert.equal(api.getState().current.id, before.current.id);
    assert.equal(api.getState().taskState.hintLevel, before.taskState.hintLevel);
    assert.deepEqual(clone(api.getState().stats), before.stats);
  }
  const basics = doc.getElementById('basics-return');
  assert.ok(shown(basics), 'parent course is reachable without an open menu');
  assert.equal(new URL(basics.href).pathname, '/trainers/oge-basics/');
});

test('checkpoint gives the requested quantity and input format without answers or methods', async t => {
  const {window, doc, api} = await open(t, cases[0]);
  doc.querySelector('.main-nav [data-view="check"]').click();
  api.startCheckpoint('standard');
  await tick();
  const skills = new Set();
  for (let i = 0; i < 5; i++) {
    const cp = api.getState().checkpoint, task = cp.tasks[cp.index];
    skills.add(task.skill);
    const {input, label, hint} = answerControls(doc, 'check');
    assert.equal(input.value, '', 'no answer prefilled');
    assert.equal(doc.getElementById('check-unit').textContent, task.unit);
    assert.doesNotMatch(label.textContent + hint.textContent, /умнож|раздели|вычти|прибавь|пропорци|формул|÷|·| = /i);
    const answerToken = String(task.answer).replace('.', ',').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.doesNotMatch(label.textContent + hint.textContent, new RegExp('(^|[^\\d])' + answerToken + '($|[^\\d])'), 'the new instructions do not print the answer');
    assert.equal(doc.getElementById('check-active').querySelectorAll('.hint-card,.solution-step').length, 0);
    assert.equal(shown(doc.getElementById('practice-help')), false);
    assert.equal(shown(doc.getElementById('check-result')), false);
    assert.equal(doc.getElementById('check-feedback').textContent, '');
    fill(window, input, '999999');
    doc.getElementById('check-save').click();
    await tick();
  }
  assert.deepEqual([...skills].sort(), ['apply', 'change', 'of', 'reverse', 'table']);
  assert.equal(api.getState().checkpoint.score, 0);
  assert.equal(shown(doc.getElementById('check-result')), true);
});
