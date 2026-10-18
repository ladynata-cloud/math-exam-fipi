'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('../trainers/oge-basics/learning-contracts.js');
const D = require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const S = require('../learning/multiplication-support.js');

const prefix = 'multiplication-division/';
const table = prefix + 'multiplication-mixed';
const mental = prefix + 'course-multiply-two-digit';
const columnTwo = prefix + 'course-column-one-digit';
const columnThree = prefix + 'course-column-three-by-one';
const allowed = new Set(['digit', 'product', 'estimate']);
const clone = value => JSON.parse(JSON.stringify(value));
const ids = rows => rows.map(row => row.id.replace(/^oge-basics:/, ''));
const expected = n => n >= 10 && n <= 99 ? [table, mental, columnTwo]
  : n >= 100 && n <= 999 ? [table, columnThree] : [table];

function fixture(name, seed = 1) {
  return C.create(prefix + name, seed);
}

function at(created, step) {
  return C.normalize(created.taskSpec, {
    ...created.state,
    step,
    answers: created.taskSpec.steps.slice(0, step).map(q => q.answer)
  });
}

function recommend(created, step) {
  return S.forStep(created.taskSpec, at(created, step));
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

// Use the real contract envelope and real long-division actions for operands
// outside the small authored example pools, including normalized decimals.
function fullDivision(divisor) {
  const created = fixture('division-lab', 1);
  const numeric = Number(String(divisor).replace(',', '.'));
  const task = {
    level: String(divisor).includes(',') ? 'decimalDivisor' : 'twoDigit',
    dividend: String(Number((numeric * 28).toFixed(4))).replace('.', ','),
    divisor: String(divisor)
  };
  Object.assign(created.taskSpec, {
    task: {kind: 'input', prompt: task.dividend + ' : ' + task.divisor},
    divisionTask: task,
    divisionTasks: [],
    steps: D.plan(task).actions
  });
  return created;
}

test('the same dependency-free helper loads in Node and a browser', () => {
  assert.equal(typeof S.forStep, 'function');
  const sandbox = {window: {}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../learning/multiplication-support.js'), 'utf8'), sandbox);
  const browser = sandbox.window.MultiplicationSupport || sandbox.MultiplicationSupport;
  assert.equal(typeof browser?.forStep, 'function');
  const created = fixture('course-digit-choice', 17);
  assert.equal(JSON.stringify(browser.forStep(created.taskSpec, at(created, 0))),
    JSON.stringify(recommend(created, 0)));
});

test('single-digit multiplication and choosing one digit offer the table', () => {
  for (const seed of [0, 1, 7, 31, 12345, 4294967295]) {
    for (const name of ['course-multiply-bridge', 'course-digit-choice']) {
      const created = fixture(name, seed);
      created.taskSpec.steps.forEach((q, step) => {
        assert(allowed.has(q.kind));
        assert.deepEqual(ids(recommend(created, step)), [table], name + ' step ' + step);
      });
    }
  }
});

test('the visible multiplication wins over the wider example and cannot link to itself', () => {
  const created = fixture('course-multiply-two-digit', 1);
  assert.match(created.taskSpec.divisionTasks[0].prompt, /3 × 12/);
  assert.match(created.taskSpec.steps[0].prompt, /3 × 10/);
  assert.deepEqual(ids(recommend(created, 0)), [table, columnTwo]);
  assert.match(created.taskSpec.steps[1].prompt, /3 × 2/);
  assert.deepEqual(ids(recommend(created, 1)), [table]);
  assert.deepEqual(recommend(created, 2), [], 'adding the partial results is not a multiplication step');
});

test('legacy quotient-digit and rounding practice use the appropriate multiplication support', () => {
  const old = fixture('long-division-quotient-digit', 1);
  assert.equal(old.taskSpec.task.prompt, '91 : 16');
  assert.deepEqual(ids(recommend(old, 0)), expected(16));
  for (const name of ['quotient-estimate', 'course-estimate']) {
    for (const seed of [1, 7, 30, 37]) {
      const created = fixture(name, seed);
      created.taskSpec.steps.forEach((q, step) => {
        assert.deepEqual(ids(recommend(created, step)), allowed.has(q.kind) ? expected(33) : [],
          name + ' seed ' + seed + ' step ' + step);
      });
    }
  }
});

test('brief questions use the current segment, including the second and third examples', () => {
  const created = fixture('course-mixed-guided', 1);
  assert.deepEqual(created.taskSpec.divisionTasks.map(g => g.task.divisor), ['37', '5', '3,2']);
  for (const [groupIndex, divisor] of [[0, 37], [1, 5], [2, 32]]) {
    const group = created.taskSpec.divisionTasks[groupIndex];
    for (let step = group.startIndex; step < group.endIndex; step++) {
      const q = created.taskSpec.steps[step];
      if (!allowed.has(q.kind)) continue;
      assert.doesNotMatch(q.prompt, /\d/, 'this fixture needs the active segment, not numbers in the question');
      assert.deepEqual(ids(recommend(created, step)), expected(divisor), 'segment ' + groupIndex);
      const withoutIndex = clone(created);
      delete withoutIndex.taskSpec.steps[step].taskIndex;
      assert.deepEqual(ids(recommend(withoutIndex, step)), expected(divisor), 'segment range fallback ' + groupIndex);
      withoutIndex.taskSpec.steps[step].taskIndex = 0;
      assert.deepEqual(ids(recommend(withoutIndex, step)), expected(divisor), 'the actual segment range wins over stale metadata');
    }
  }
  const simple = fixture('course-whole-simple', 1);
  const second = simple.taskSpec.divisionTasks[1];
  const step = simple.taskSpec.steps.findIndex((q, i) => i >= second.startIndex && q.kind === 'product');
  assert.doesNotMatch(simple.taskSpec.steps[step].prompt, /\d/);
  assert.deepEqual(ids(recommend(simple, step)), [table]);
});

test('two- and three-digit operands select the matching column practice at numeric boundaries', () => {
  for (const divisor of [2, 9, 10, 12, 37, 99, 100, 101, 324, 999, 1000]) {
    const created = fullDivision(divisor);
    for (const kind of ['digit', 'product']) {
      const step = created.taskSpec.steps.findIndex(q => q.kind === kind);
      assert(step >= 0);
      assert.deepEqual(ids(recommend(created, step)), expected(divisor), divisor + ' / ' + kind);
    }
  }
});

test('decimal divisors are classified after moving the decimal point', () => {
  for (const [divisor, normalized] of [['0,09', 9], ['0,12', 12], ['3,2', 32], ['1,25', 125], ['9,99', 999]]) {
    const created = fullDivision(divisor);
    // Make the current prompts brief, as they are in the mixed guided course.
    created.taskSpec.steps.forEach(q => {
      if (q.kind === 'digit') q.prompt = 'Какую одну цифру запишем сейчас?';
      if (q.kind === 'product') q.prompt = 'Умножь выбранную цифру на число справа.';
    });
    for (const kind of ['digit', 'product']) {
      const step = created.taskSpec.steps.findIndex(q => q.kind === kind);
      assert.deepEqual(ids(recommend(created, step)), expected(normalized), divisor + ' / ' + kind);
    }
  }
});

test('visible products handle either operand order without recommending the wrong width', () => {
  for (const [a, b, result] of [[0, 9, [table]], [9, 0, [table]], [8, 9, [table]],
    [4, 12, expected(12)], [99, 7, expected(99)], [4, 100, expected(100)],
    [999, 9, expected(999)], [9, 1000, [table]], [12, 12, []]]) {
    const created = fixture('course-digit-choice', 1);
    created.taskSpec.steps[0] = {kind: 'product', prompt: 'Умножь: ' + a + ' × ' + b + ' = ?', answer: String(a * b)};
    assert.deepEqual(ids(recommend(created, 0)), result, a + ' × ' + b);
  }
});

test('other operations and the entire subtraction course never show multiplication support', () => {
  const names = ['course-subtract', 'course-first-part', 'course-bring-digit',
    'course-whole-simple', 'course-decimal-divisor', 'course-simple-check', 'course-independent-check'];
  for (const name of names) {
    const created = fixture(name, 1);
    created.taskSpec.steps.forEach((q, step) => {
      if (name === 'course-subtract' || !allowed.has(q.kind)) {
        assert.deepEqual(recommend(created, step), [], name + ' / ' + q.kind);
      }
    });
  }
  const other = fixture('course-column-one-digit', 1);
  other.taskSpec.steps.forEach((q, step) => assert.deepEqual(recommend(other, step), []));
});

test('missing, completed, inactive and malformed states safely produce no links', () => {
  const created = fixture('course-digit-choice', 1);
  const spec = created.taskSpec;
  for (const state of [null, undefined, {}, [], {...created.state, view: 'learn'},
    {...created.state, completed: true}, {...created.state, answers: null},
    {...created.state, answers: ['unaccepted']}, ...[-1, 0.5, NaN, Infinity, '0', spec.steps.length, spec.steps.length + 1]
      .map(step => ({...created.state, step}))]) {
    assert.deepEqual(S.forStep(spec, state), []);
  }
  for (const spec of [null, undefined, {}, {family: 'division'}, {...created.taskSpec, family: 'other'},
    {...created.taskSpec, steps: null}, {...created.taskSpec, steps: []},
    {...created.taskSpec, steps: [{kind: 'unknown', prompt: '3 × 12'}]}]) {
    assert.deepEqual(S.forStep(spec, created.state), []);
  }
  const done = at(created, spec.steps.length);
  assert.equal(done.completed, true);
  assert.deepEqual(S.forStep(spec, done), []);
});

test('recommendations contain only generic destinations, without duplicates or answer data', () => {
  const catalog = new Map(C.list().map(item => [item.id, item]));
  const titles = new Map();
  const cases = [fixture('course-digit-choice', 17), fixture('course-estimate', 1),
    fixture('course-mixed-guided', 1), fullDivision(324)];
  let checked = 0;
  for (const created of cases) {
    for (let step = 0; step < created.taskSpec.steps.length; step++) {
      if (!allowed.has(created.taskSpec.steps[step].kind)) continue;
      const state = at(created, step);
      const before = JSON.stringify([created.taskSpec, state]);
      const rows = S.forStep(freeze(clone(created.taskSpec)), freeze(clone(state)));
      assert.equal(JSON.stringify([created.taskSpec, state]), before);
      assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
      for (const row of rows) {
        assert.deepEqual(Object.keys(row).sort(), ['id', 'title', 'url']);
        assert.equal(typeof row.title, 'string');
        assert(row.title.length > 0 && row.title.length < 120);
        assert.notEqual(row.id, 'oge-basics:' + created.taskSpec.contentId);
        assert(catalog.has(row.id), 'support must point to registered content: ' + row.id);
        assert.equal(row.url, catalog.get(row.id).url);
        if (titles.has(row.id)) assert.equal(row.title, titles.get(row.id), 'titles do not depend on the answer');
        titles.set(row.id, row.title);
      }
      const hidden = clone(created.taskSpec);
      for (const key of ['answer', 'hint', 'error', 'record']) hidden.steps[step][key] = 'PRIVATE_ANSWER_8675309';
      const hiddenState = {...state, answer: 'PRIVATE_DRAFT_97531'};
      assert.deepEqual(S.forStep(hidden, hiddenState), rows, 'recommendations use visible operands, never hidden solutions');
      assert.doesNotMatch(JSON.stringify(rows), /PRIVATE_|8675309|97531/);
      checked++;
    }
  }
  assert(checked > 20);
  assert.deepEqual([...titles.keys()].sort(), [table, mental, columnTwo, columnThree].map(id => 'oge-basics:' + id).sort());
});

test('a destination matching the current content is removed once without losing other support', () => {
  for (const contentId of [table, mental, columnTwo, columnThree]) {
    const created = fullDivision(contentId === columnThree ? 324 : 37);
    created.taskSpec.contentId = contentId;
    const step = created.taskSpec.steps.findIndex(q => q.kind === 'product');
    const state = {...created.state, step, answers: created.taskSpec.steps.slice(0, step).map(q => q.answer)};
    const want = expected(contentId === columnThree ? 324 : 37).filter(id => id !== contentId);
    assert.deepEqual(ids(S.forStep(created.taskSpec, state)), want);
  }
});
