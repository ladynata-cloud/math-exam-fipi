'use strict';

// These are explanation/rendering regressions, not a claim that simulated
// learners establish educational efficacy. Bank-specific gates check the maths.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const Check = require('../ege-profil/start/checks.js');
const directory = path.resolve(__dirname, '../ege-profil/start');
const banks = ['geometry', 'stereo', 'algebra', 'probability', 'equations', 'functions', 'applied', 'readiness'];
const lessons = banks.flatMap(name => require(path.join(directory, name + '-data.js')));
const tasks = lessons.flatMap(lesson => lesson.tasks);

function fixture() {
  const dom = new JSDOM('<main id="solution"></main>', { runScripts: 'outside-only' });
  for (const name of ['planimetry-tasks', 'solution-details', 'solutions']) dom.window.eval(fs.readFileSync(path.join(directory, name + '.js'), 'utf8'));
  return { dom, w: dom.window, api: dom.window.ProfileSolutions, container: dom.window.document.getElementById('solution') };
}
function textOf(line) {
  if (typeof line === 'string') return line;
  if (line.formula) return line.formula;
  if (line.html !== undefined) return JSDOM.fragment(line.html).textContent;
  if (line.fraction) return Object.values(line.fraction).join(' ');
  if (line.proportion) return [...line.proportion.left, ...line.proportion.right].join(' ');
  assert.fail('Unsupported mathematical explanation line: ' + JSON.stringify(line));
}
function answerIsPresent(text, answer, label) {
  const match = [...text.matchAll(/Ответ:\s*([^\n]+)/gu)].at(-1);
  assert(match, label + ': explicit final answer');
  assert(Check.check(answer, match[1].trim().replace(/[\u00a0\u202f]/gu, '').replace(/[.。]$/u, '')), label + ': final answer agrees with the checked task: ' + match[1]);
}

test('all 408 tasks across all 13 positions have complete, readable worked solutions', () => {
  const f = fixture();
  try {
    assert.equal(lessons.length, 68); assert.equal(tasks.length, 408);
    for (let position = 1; position <= 13; position++) assert(lessons.some(lesson => lesson.position === position));
    for (const task of tasks) {
      const before = JSON.stringify(task), steps = f.api.steps(task);
      assert(Array.isArray(steps) && steps.length >= 2, task.id + ': method followed by final answer');
      assert.equal(JSON.stringify(task), before, task.id + ': reading an explanation does not mutate assessment data');
      for (const [index, step] of steps.entries()) {
        assert.equal(typeof step.title, 'string'); assert(step.title.trim().length >= 3, task.id + ': useful step heading');
        assert(Array.isArray(step.lines) && step.lines.length, task.id + ': nonempty step ' + index);
        const text = step.lines.map(textOf).join('\n');
        assert(text.trim().length >= 8, task.id + ': an explanation, not an empty action');
        assert.doesNotMatch(text, /undefined|\bNaN\b|\bInfinity\b|\[object Object\]/u, task.id);
      }
      answerIsPresent(steps.at(-1).lines.map(textOf).join('\n'), task.answer, task.id);
      // For the general adapter, every authored question, operation and reason
      // must survive. Dedicated geometry explanations have separate math oracles.
      if (!f.w.ProfileSolutionDetails?.[task.id] && !f.w.ProfileRightTrigSteps?.(task)) {
        const text = steps.map(step => [step.title, ...step.lines.map(textOf)].join('\n')).join('\n');
        const plain = value => {
          const p = f.w.document.createElement('p'); p.innerHTML = value;
          return p.textContent.replace(/\s+/gu, ' ').trim();
        };
        let expectedCount = task.steps.length + 1;
        for (const question of task.steps) {
          const parts = question.hint.split(/<br\s*\/?\s*>/iu);
          if (parts.length > 1 && parts.every(part => /^\s*\d+\.\s/u.test(part))) {
            expectedCount += parts.length;
            let previous = -1;
            for (const part of parts) {
              const content = plain(part.replace(/^\s*\d+\.\s*/u, ''));
              const indexes = steps.map((step, index) => step.lines.some(line => textOf(line).includes(content)) ? index : -1).filter(index => index >= 0);
              assert.equal(indexes.length, 1, task.id + ': keeps each numbered operation exactly once');
              assert(indexes[0] > previous, task.id + ': numbered operations appear on distinct steps in original order');
              previous = indexes[0];
            }
            const whyIndex = steps.findIndex(step => step.lines.some(line => textOf(line).includes(plain(question.why))));
            assert(whyIndex > previous, task.id + ': result follows every algebra operation');
          } else assert(text.includes(plain(question.hint)), task.id + ': keeps the operation');
          assert(text.includes(plain(question.why)), task.id + ': keeps the mathematical reason');
        }
        assert.equal(steps.length, expectedCount, task.id + ': every operation and the final answer has its own place');
      }
    }
  } finally { f.dom.window.close(); }
});

test('every task reveals only one new step, retains earlier work, and records help before content', () => {
  const f = fixture(); let count = 0;
  try {
    for (const task of tasks) {
      const expected = f.api.steps(task); let expectedCount = 0, helps = 0;
      f.container.replaceChildren();
      const cleanup = f.api.mount(f.container, task, { onHelp() {
        assert.equal(f.container.querySelectorAll('[data-solution-step]').length, expectedCount, task.id + ': assistance precedes disclosure');
        helps++; return true;
      } });
      assert.equal(typeof cleanup, 'function');
      assert.equal(f.container.querySelector('[data-solution-panel]'), null, task.id + ': no hidden future answers');
      const open = f.container.querySelector('[data-solution-open]'); assert(open);
      assert.equal(open.getAttribute('aria-expanded'), 'false');
      open.click(); expectedCount = 1;
      const panel = f.container.querySelector('[data-solution-panel]'); assert(panel && !panel.hidden);
      const next = panel.querySelector('[data-solution-next]'); assert(next);
      const history = [];
      for (let n = 1; n <= expected.length; n++) {
        const visible = [...panel.querySelectorAll('[data-solution-step]')];
        assert.equal(visible.length, n, task.id + ': one action per disclosure');
        assert.deepEqual(visible.map(node => Number(node.dataset.solutionStep)), Array.from({ length: n }, (_, i) => i + 1));
        assert.deepEqual(visible.slice(0, -1).map(node => node.textContent), history, task.id + ': earlier steps remain intact');
        assert.doesNotMatch(visible.at(-1).textContent, /<\/?(?:b|sup|sub|p|i)\b/u, task.id + ': no escaped teaching HTML');
        history.push(visible.at(-1).textContent);
        if (n < expected.length) { next.click(); expectedCount++; }
      }
      answerIsPresent(panel.querySelector('[data-solution-step]:last-child').lastElementChild.textContent, task.answer, task.id);
      assert(helps >= 1); assert.equal(next.getAttribute('aria-disabled'), 'true');
      next.click(); assert.equal(panel.querySelectorAll('[data-solution-step]').length, expected.length);
      open.click(); assert(panel.hidden); open.click(); assert(!panel.hidden);
      assert.deepEqual([...panel.querySelectorAll('[data-solution-step]')].map(node => node.textContent), history);
      const old = panel.textContent; cleanup(); next.click(); open.click();
      assert.equal(panel.textContent, old, task.id + ': disposed controls cannot change a past solution');
      count++;
    }
    assert.equal(count, 408);
  } finally { f.dom.window.close(); }
});

test('a stale or refused help callback prevents both initial and subsequent disclosure', () => {
  const f = fixture();
  try {
    let allowed = false, calls = 0;
    const cleanup = f.api.mount(f.container, tasks[0], { onHelp() { calls++; return allowed; } });
    const open = f.container.querySelector('[data-solution-open]');
    open.click(); assert.equal(calls, 1); assert.equal(f.container.querySelector('[data-solution-panel]'), null);
    allowed = true; open.click(); assert.equal(f.container.querySelectorAll('[data-solution-step]').length, 1);
    const next = f.container.querySelector('[data-solution-next]');
    allowed = false; next.click(); assert.equal(f.container.querySelectorAll('[data-solution-step]').length, 1);
    allowed = true; next.click(); assert.equal(f.container.querySelectorAll('[data-solution-step]').length, 2);
    open.click(); allowed = false; open.click();
    assert.equal(f.container.querySelector('[data-solution-panel]').hidden, true, 'Stale reopening does not show previously hidden worked answers');
    cleanup();
    f.container.replaceChildren();
    f.api.mount(f.container, tasks[0], { initialOpen: true, onHelp() { return false; } });
    assert.equal(f.container.querySelector('[data-solution-panel]'), null, 'Automatic example opening also respects cancellation');
  } finally { f.dom.window.close(); }
});

test('the requested similarity area example explains the square, cross multiplication and unknown factor', () => {
  const f = fixture();
  try {
    const task = tasks.find(task => task.id === 'geo-similarity-area');
    const steps = f.api.steps(task), text = steps.flatMap(step => step.lines.map(textOf)).join('\n');
    assert.match(text, /основан/iu); assert.match(text, /высот/iu);
    assert.match(text, /2\s*[·×]\s*2\s*=\s*4|2²\s*=\s*4/u);
    assert.match(text, /5\s*[·×]\s*5\s*=\s*25|5²\s*=\s*25/u);
    const proportions = steps.flatMap(step => step.lines).filter(line => line.proportion).map(line => line.proportion);
    assert(proportions.some(p => String(p.left[0]) === '4' && String(p.left[1]) === '25' && String(p.right[0]) === '12'), 'Uses squared side ratios for the areas');
    assert(text.includes('Произведение крайних членов пропорции равно произведению средних'));
    assert.match(text, /\S[^\n]*[·×]\s*4\s*=\s*12\s*[·×]\s*25/u, 'Unknown stays on the left of the cross product');
    assert.match(text, /300\s*[:/÷]\s*4\s*=\s*75/u);
    assert.match(text, /неизвестный множитель/iu);
    answerIsPresent(steps.at(-1).lines.map(textOf).join('\n'), 75, task.id);
  } finally { f.dom.window.close(); }
});

test('fractions keep parentheses, powers, roots and multiword trig quantities in their authored scope', () => {
  const f = fixture();
  try {
    const expressions = [
      ['12·(5/2)²', [['5', '2']]],
      ['√(100/16)', [['100', '16']]],
      ['56·5/(2+5)', [['5', '(2+5)']]],
      ['a/(b+c)', [['a', '(b+c)']]],
      ['(10 − 2)/(3 − 1)²', []],
      ['(2^(4) · 2^(3))/2^(5)', []],
      ['sin α / cos α', []],
      ['sqrt(2)/2', []],
      ['S бок/π', []]
    ];
    for (const [expression, expectedFractions] of expressions) {
      f.container.replaceChildren();
      f.w.ProfileSolutionDetails['scope-fixture'] = () => [{ title: 'Сохраняем запись выражения', lines: [{ formula: expression }] }];
      const task = { id: 'scope-fixture', answer: 0, steps: [], explanation: 'Только проверка математической записи.' };
      const cleanup = f.api.mount(f.container, task, { initialOpen: true });
      const row = f.container.querySelector('[data-solution-step] .profile-solution-formula');
      const pairs = [...row.querySelectorAll('.profile-solution-fraction')].map(node => [node.querySelector('.profile-solution-numerator').textContent, node.querySelector('.profile-solution-denominator').textContent]);
      assert.deepEqual(pairs, expectedFractions, expression + ': numerator and denominator have the intended scope');
      // Replacing each visual fraction by its source notation must reconstruct
      // the exact expression, including the outer square/root/product grouping.
      const clone = row.cloneNode(true);
      for (const node of clone.querySelectorAll('.profile-solution-fraction')) node.replaceWith(f.w.document.createTextNode(node.querySelector('.profile-solution-numerator').textContent + '/' + node.querySelector('.profile-solution-denominator').textContent));
      assert.equal(clone.textContent, expression);
      cleanup();
    }
  } finally { f.dom.window.close(); }
});

test('short stereometry explanations answer the requested coefficient or scale factor', () => {
  const f = fixture();
  try {
    const expectations = [
      ['stereo-cone-lateral', 60, /образующ/iu],
      ['stereo-cube-volume-scale', 27, /три|тр[её]х|3\s*[·×]\s*3/iu],
      ['stereo-cube-area-scale', 16, /два|двух|4\s*[·×]\s*4/iu],
      ['stereo-sphere-scale', 8, /тр[её]х|три|2³/iu]
    ];
    for (const [id, answer, reason] of expectations) {
      const task = tasks.find(task => task.id === id), steps = f.api.steps(task);
      const text = steps.flatMap(step => step.lines.map(textOf)).join('\n');
      assert.match(text, reason, id + ': explains which dimensions change');
      answerIsPresent(steps.at(-1).lines.map(textOf).join('\n'), answer, id);
      assert.doesNotMatch(steps.at(-1).lines.at(-1).formula, /π|см|м²|м³/u, id + ': the requested dimensionless value, not the physical total');
    }
  } finally { f.dom.window.close(); }
});

test('HTML exponents remain attached to their original denominator', () => {
  const f = fixture();
  try {
    f.w.ProfileSolutionDetails['html-power-fixture'] = () => [{ title: 'Степень в знаменателе', lines: [{ html: '1/x<sup>2</sup>' }] }];
    f.api.mount(f.container, { id: 'html-power-fixture', answer: 0, steps: [], explanation: 'Проверка записи.' }, { initialOpen: true });
    const step = f.container.querySelector('[data-solution-step]');
    assert.equal(step.querySelectorAll('.profile-solution-fraction').length, 0, 'Does not turn 1 divided by x squared into a squared quotient');
    assert.equal(step.querySelector('sup').textContent, '2');
    assert.equal(step.lastElementChild.textContent, '1/x2');
  } finally { f.dom.window.close(); }
});
