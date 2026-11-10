'use strict';
// Missing input is interface feedback, not a mathematical attempt.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'trainers/oge-1-5-trainers');
const stories = ['roads-grid', 'roads-schema', 'apartments', 'land-plots', 'stoves', 'tariffs', 'paper-sheets'];
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

class Local extends ResourceLoader {
  fetch(url) {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://mathexam.space') return null;
    if (parsed.pathname.endsWith('/board-bridge.js')) return Promise.resolve(Buffer.from(''));
    const filename = path.join(root, parsed.pathname);
    return fs.existsSync(filename) && fs.statSync(filename).isFile()
      ? Promise.resolve(fs.readFileSync(filename)) : null;
  }
}
async function open(story, shared = false) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => {
    if (!/scrollTo|navigation|HTMLCanvasElement.prototype.getContext/.test(error.message)) errors.push(error.message);
  });
  const dom = new JSDOM(fs.readFileSync(path.join(directory, 'practice-1-5-' + story + '.html'), 'utf8'), {
    url: 'https://mathexam.space/trainers/oge-1-5-trainers/practice-1-5-' + story + '.html' + (shared ? '?board=1' : ''),
    runScripts: 'dangerously', resources: new Local(), pretendToBeVisual: true, virtualConsole: console,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.confirm = () => true;
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      window.MathExamBoard = { register() {} };
      window.localStorage.setItem('unrelated-pupil-draft', '{"value":"keep"}');
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await settle();
  assert.deepEqual(errors, [], story + ': page loads');
  assert.equal(dom.window.document.documentElement.dataset.practicalVariant, 'ready');
  return { dom, window: dom.window, document: dom.window.document, errors };
}
function stored(window) {
  return ['localStorage', 'sessionStorage'].map(name => [
    name, Object.keys(window[name]).sort().map(key => [key, window[name].getItem(key)])
  ]);
}
function edit(context, field, value) {
  field.value = value;
  field.dispatchEvent(new context.window.Event(field.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}
async function submit(context, card) {
  card.querySelector('form').dispatchEvent(new context.window.Event('submit', { bubbles: true, cancelable: true }));
  await settle();
}
function neutral(card) {
  assert.notEqual(card.dataset.result, 'incorrect', 'missing input is not a mathematical mistake');
  assert.notEqual(card.dataset.result, 'correct', 'missing input cannot earn credit');
  assert.equal(card.querySelector('.pv-feedback').classList.contains('pv-incorrect'), false);
  assert.equal(card.querySelector('.pv-feedback').classList.contains('pv-correct'), false);
  assert.equal(card.querySelector('.pv-check').disabled, false, 'the learner can complete the answer');
  assert.equal(card.__practicalQuestion.capture().checked, false, 'no checked result is sent to the board');
  assert.equal(card.__practicalQuestion.capture().helpUsed, false, 'field guidance is not mathematical help');
}

for (const shared of [false, true]) for (const story of stories) {
  test(story + ': empty forms keep attempts, progress and board state untouched (' + (shared ? 'shared' : 'personal') + ')', async () => {
    const context = await open(story, shared);
    try {
      const cards = Array.from(context.document.querySelectorAll('.pv-task-stream > .pv-question'));
      assert.equal(cards.length, 5);
      for (const card of cards) {
        const fields = Array.from(card.querySelectorAll('[data-pv-field]'));
        assert.ok(fields.length);
        for (const field of fields) edit(context, field, field.tagName === 'SELECT' ? '' : ' \u00a0 ');
        const before = stored(context.window);
        let calls = 0;
        const original = card.__practicalQuestion.options.check;
        card.__practicalQuestion.options.check = values => { calls++; return original(values); };
        await submit(context, card);
        assert.equal(calls, 0, 'the native mathematics checker must not receive an incomplete answer');
        assert.deepEqual(stored(context.window), before, 'a prompt cannot consume an attempt or write a result');
        neutral(card);
        assert.equal(context.document.activeElement, fields[0]);
        assert.equal(fields[0].getAttribute('aria-invalid'), 'true');
        assert.ok(card.querySelector('.pv-feedback').textContent.includes(fields[0].getAttribute('aria-label')));
        assert.ok(fields.every(field => !field.disabled));
      }
      assert.deepEqual(context.errors, []);
    } finally { context.dom.window.close(); }
  });
}

test('partial matching points to the first missing item and preserves the other answers and working table', async () => {
  const context = await open('roads-grid');
  try {
    const cards = Array.from(context.document.querySelectorAll('.pv-task-stream > .pv-question'));
    const card = cards[0], fields = Array.from(card.querySelectorAll('[data-pv-field]'));
    assert.ok(fields.length > 2, 'the actual matching exercise has several entries');
    const firstValue = Array.from(fields[0].options).find(option => option.value).value;
    edit(context, fields[0], firstValue);
    edit(context, cards[1].querySelector('[data-pv-field]'), '12,75');
    const before = stored(context.window);
    await submit(context, card);
    neutral(card);
    assert.equal(context.document.activeElement, fields[1]);
    assert.equal(fields[0].value, firstValue);
    assert.equal(cards[1].querySelector('[data-pv-field]').value, '12,75');
    assert.deepEqual(stored(context.window), before);
    assert.equal(fields[0].hasAttribute('aria-invalid'), false);
    assert.equal(fields[1].getAttribute('aria-invalid'), 'true');
  } finally { context.dom.window.close(); }
});

test('zero is a complete answer and an explicitly optional note stays optional', async () => {
  const context = await open('tariffs');
  try {
    let calls = 0, received;
    const card = context.window.PracticalVariant.question({
      id: 'zero-input-regression', number: 1, page: 'tariffs', helpType: 'bill',
      condition: 'Из 350 рублей вычли 350 рублей. Сколько осталось?',
      fields: [{ key: 'answer', label: 'Остаток в рублях' }, { key: 'note', label: 'Необязательное пояснение', required: false }],
      check(values) { calls++; received = values; return { ok: values.answer === '0', message: 'Верно: остаток равен нулю.' }; }
    });
    context.document.body.append(card);
    const field = card.querySelector('[data-pv-field="answer"]');
    await submit(context, card);
    assert.equal(calls, 0);
    edit(context, field, '0');
    assert.equal(field.hasAttribute('aria-invalid'), false, 'typing clears the field prompt');
    await submit(context, card);
    assert.equal(calls, 1);
    assert.equal(received.answer, '0');
    assert.equal(received.note, '');
    assert.equal(card.dataset.result, 'correct');
    assert.equal(card.__practicalQuestion.capture().checked, true);
    assert.equal(card.__practicalQuestion.capture().helpUsed, false);
  } finally { context.dom.window.close(); }
});
