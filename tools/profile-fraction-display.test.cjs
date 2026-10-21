'use strict';

// Display-only regression: the written fraction must keep the authored scope,
// while answer values, controls, task banks and learner state stay untouched.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const directory = path.resolve(__dirname, '../ege-profil/start');

function fixture(html = '<main></main>') {
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  dom.window.eval(fs.readFileSync(path.join(directory, 'solutions.js'), 'utf8'));
  return { dom, w: dom.window, d: dom.window.document, api: dom.window.ProfileSolutions };
}
const pairs = container => [...container.querySelectorAll('.profile-solution-fraction')].map(node => [
  node.querySelector('.profile-solution-numerator').textContent,
  node.querySelector('.profile-solution-denominator').textContent
]);
function sourceText(node) {
  const copy = node.cloneNode(true);
  for (const fraction of copy.querySelectorAll('.profile-solution-fraction')) {
    fraction.replaceWith(copy.ownerDocument.createTextNode(
      fraction.querySelector('.profile-solution-numerator').textContent + '/' +
      fraction.querySelector('.profile-solution-denominator').textContent
    ));
  }
  return copy.textContent;
}
const compact = text => text.replace(/\s/gu, '');

test('parenthesized algebra and distance divided by speed retain their exact operands', () => {
  const f = fixture();
  try {
    for (const [expression, expected] of [
      ['(x² − 36)/(x + 6)', [['(x² − 36)', '(x + 6)']]],
      ['96/x', [['96', 'x']]],
      ['1/x²', [['1', 'x²']]],
      ['96/x − 96/(x + 6) = 2', [['96', 'x'], ['96', '(x + 6)']]],
      ['1/6 + 1/3', [['1', '6'], ['1', '3']]],
      ['(x + 6)/(x + 6)', [['(x + 6)', '(x + 6)']]]
    ]) {
      const row = f.d.createElement('p'); row.textContent = expression;
      f.api.formatFractions(row);
      assert.deepEqual(pairs(row), expected, expression);
      assert.equal(sourceText(row), expression, 'The display reconstructs the authored source exactly');
      for (const fraction of row.querySelectorAll('.profile-solution-fraction')) {
        assert.equal(fraction.getAttribute('role'), 'math');
        assert.match(fraction.getAttribute('aria-label'), /числитель.*знаменатель/u);
      }
      const first = row.innerHTML;
      f.api.formatFractions(row);
      assert.equal(row.innerHTML, first, 'Repeated formatting does not nest or duplicate fractions');
      const direct = f.d.createElement('p'); f.api.appendMathText(direct, expression);
      assert.deepEqual(pairs(direct), expected, 'The explicit model renderer uses the same operand boundaries');
    }
  } finally { f.w.close(); }
});

test('units, URLs, chained divisions and attached powers are not reinterpreted', () => {
  const f = fixture();
  try {
    for (const source of [
      'м/с', 'км/ч', 'кг/м³', 'Дж/(кг·°C)', 'см/с',
      'https://example.com/a/b', 'https://example.com/1/2?x=3/4', '/ege-profil/start/',
      '1/x^2', '(10 − 2)/(3 − 1)²', '(2^(4) · 2^(3))/2^(5)',
      'a/b/c', 'sqrt(2)/2', 'sin α / cos α'
    ]) {
      const row = f.d.createElement('p'); row.textContent = source;
      f.api.formatFractions(row);
      assert.equal(row.querySelectorAll('.profile-solution-fraction').length, 0, source);
      assert.equal(row.textContent, source);
    }
    for (const source of ['1/x<sup>2</sup>', '1/x<sub>2</sub>', 'x<sup>2</sup>/2']) {
      const row = f.d.createElement('p'); row.innerHTML = source;
      const before = row.innerHTML, power = row.querySelector('sup,sub');
      f.api.formatFractions(row);
      assert.equal(row.innerHTML, before, 'A separate HTML exponent or subscript remains attached');
      assert.equal(row.querySelector('sup,sub'), power, 'Existing semantic nodes are retained');
    }
  } finally { f.w.close(); }
});

test('formatting preserves tables, choice values, answer drafts, listeners and raw input instructions', () => {
  const f = fixture('<main><table><tbody><tr><td>96/x</td></tr></tbody></table>' +
    '<form><label><input id="answer" value="3/4">Ваш ответ</label>' +
    '<label><input type="radio" name="choice" value="1/2" checked><span>1/2</span></label>' +
    '<label><input type="radio" name="choice" value="1/3"><span>1/3</span></label>' +
    '<button type="button">Ввести 3/4</button><select><option value="1/2">1/2</option></select>' +
    '<textarea>1/2</textarea></form><a href="/1/2">3/4</a><code>1/2</code><pre>1/2</pre>' +
    '<p id="input-note">Введите 3/4</p><details class="number-help"><summary>Как ввести</summary>3/4</details>' +
    '<p data-raw-math>1/2</p><svg><text>1/2</text></svg></main>');
  try {
    const root = f.d.querySelector('main'), table = root.querySelector('table'), form = root.querySelector('form');
    const input = root.querySelector('#answer'), radios = [...root.querySelectorAll('[type=radio]')];
    const retained = [...root.querySelectorAll('a,button,select,textarea,code,pre,#input-note,.number-help,[data-raw-math],svg')];
    const raw = retained.map(node => node.outerHTML);
    let clicks = 0; root.querySelector('button').addEventListener('click', () => clicks++);
    input.value = '7/9';
    f.api.formatFractions(root);
    assert.equal(root.querySelector('table'), table); assert.equal(root.querySelector('form'), form);
    assert.equal(root.querySelector('#answer'), input); assert.equal(input.value, '7/9');
    assert.deepEqual(radios.map(node => node.value), ['1/2', '1/3']);
    assert.deepEqual(radios.map(node => node.checked), [true, false]);
    assert.equal(root.querySelectorAll('td .profile-solution-fraction').length, 1);
    assert.deepEqual(retained.map(node => node.outerHTML), raw);
    root.querySelector('button').click(); assert.equal(clicks, 1);
    const once = root.innerHTML; f.api.formatFractions(root); assert.equal(root.innerHTML, once);
  } finally { f.w.close(); }
});

function app(lesson, mode = 'independent', initialState = null) {
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/ege-profil/start/#practice/' + lesson + '/' + mode,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window;
  if (initialState) w.localStorage.setItem('mathexam.profileStart2027.v1', JSON.stringify(initialState));
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  let bankBefore;
  for (const script of w.document.querySelectorAll('script[src]')) {
    const file = path.resolve(directory, script.getAttribute('src').split(/[?#]/)[0]);
    if (path.basename(file) === 'app.js') bankBefore = JSON.stringify(w.ProfileLessons);
    w.eval(fs.readFileSync(file, 'utf8'));
  }
  assert(bankBefore, 'The fixture observes the bank before the learner renderer runs');
  const read = () => JSON.parse(w.localStorage.getItem('mathexam.profileStart2027.v1')).sessions[lesson + ':' + mode];
  return { dom, w, d: w.document, bankBefore, read };
}

test('real fraction-expression task uses stacked fractions in condition, question and visible model', () => {
  const f = app('expr-fractions');
  try {
    const task = f.w.ProfileLessons.find(lesson => lesson.id === 'expr-fractions').tasks.find(task => task.id === f.read().taskId);
    assert.equal(task.id, 'expr-fractions-4', 'Fresh independent practice keeps the original task allocation');
    for (const selector of ['.condition-panel .task-condition', '.current-question .question', '#task-model .profile-equation-formula']) {
      const display = f.d.querySelector(selector); assert(display, selector);
      assert(display.querySelector('.profile-solution-fraction'), selector + ': a real fraction bar');
      assert(compact(sourceText(display)).includes(compact(task.diagram.left)), selector + ': source formula has identical scope');
    }
    assert(f.d.querySelector('#task-model foreignObject .profile-solution-fraction'), 'The essential model is formatted too');
    const model = f.d.querySelector('#task-model'), modelHtml = model.innerHTML, input = f.d.querySelector('#answer');
    input.value = '7/9'; input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
    const before = f.read(); const hint = f.d.querySelector('#hint');
    hint.click(); hint.click(); hint.click();
    assert.equal(f.d.querySelector('#task-model'), model); assert.equal(model.innerHTML, modelHtml);
    assert.equal(f.d.querySelector('#answer'), input); assert.equal(input.value, '7/9');
    const after = f.read();
    for (const key of ['taskId', 'started', 'step', 'draft', 'answers', 'done', 'wrong']) assert.deepEqual(after[key], before[key], key);
    assert.equal(after.assisted, true, 'Formatting and collapse do not erase actual help usage');
    assert.equal(JSON.stringify(f.w.ProfileLessons), f.bankBefore, 'Rendering never changes task banks or answer keys');
  } finally { f.w.close(); }
});

test('real motion hint stacks distance over speed and leaves speed units and assessment unchanged', () => {
  const f = app('applied-motion');
  try {
    const task = f.w.ProfileLessons.find(lesson => lesson.id === 'applied-motion').tasks.find(task => task.id === f.read().taskId);
    const expected = task.steps[0].hint.match(/время\s+(\d+)\/x/u);
    assert(expected, 'Use the actual problem distance instead of assuming a fixed example');
    f.d.querySelector('#hint').click();
    const hint = f.d.querySelector('.short-hint');
    assert(pairs(hint).some(pair => pair[0] === expected[1] && pair[1] === 'x'), 'Time equals the actual distance divided by x');
    assert.match(f.d.querySelector('.condition-panel .task-condition').textContent, /км\/ч/u, 'Unit notation stays readable and conventional');
    assert.equal(f.d.querySelectorAll('.profile-solution-fraction .profile-solution-fraction').length, 0);
    assert.equal(JSON.stringify(f.w.ProfileLessons), f.bankBefore);
    assert.equal(f.read().answers.length, 0, 'Displaying a hint does not accept an answer');
  } finally { f.w.close(); }
});

test('written fraction choices retain their authored accessible names and values', () => {
  for (const taskId of ['geo-right-sine', 'geo-right-cosine', 'geo-right-tangent']) {
    const initial = { version: 1, records: {}, seen: { [taskId]: 1 }, sessions: {
      'geo-right:guided': { taskId, step: 0, wrong: false, assisted: true, familiar: false,
        done: false, draft: '', answers: [], started: '2026-10-22T00:00:00.000Z', registered: false }
    } };
    const f = app('geo-right', 'guided', initial);
    try {
      const task = f.w.ProfileLessons.find(l => l.id === 'geo-right').tasks.find(t => t.id === taskId);
      const inputs = [...f.d.querySelectorAll('#answer-form input[type=radio]')];
      assert.deepEqual(inputs.map(n => n.getAttribute('aria-label')), Array.from(task.steps[0].choices));
      assert.deepEqual(inputs.map(n => n.value), Array.from(task.steps[0].choices));
      assert(f.d.querySelector('#answer-form .profile-solution-fraction'), 'The visible choice still uses a fraction bar');
      for (const input of inputs) {
        input.click();
        assert.equal(f.read().draft, input.value, 'The authored option remains the stored draft');
        assert.equal(f.read().answers.length, 0, 'Selecting a choice does not submit it');
      }
      assert.equal(JSON.stringify(f.w.ProfileLessons), f.bankBefore);
    } finally { f.w.close(); }
  }
});
