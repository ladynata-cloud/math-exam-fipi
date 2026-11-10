'use strict';

// Independently worked answers and intermediate values for the 27 PR #539
// equations. These fixtures do not call the trainer solver or the shared oracle.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
let trainer, parse, equal;
before(async () => {
  const math = await import('./oge-algebra-contract.lib.mjs');
  trainer = math.loadTrainer('trainers/oge-task9-equations.html');
  parse = math.parseNum;
  equal = math.eq;
});

const n = (...values) => values.map(String);
const linear = (k, m, root, prefix = []) => [...prefix, n(k, m), n(root)];
const square = (c, lo, hi, answer) => [n(c), n(lo, hi), n(answer)];
const full = (a, b, c, d, sqrt, lo, hi, answer) => [n(a, b, c), n(d), n(sqrt), n(lo, hi), n(answer)];
const fixtures = [
  ['demo-2027', ['-32'], null, linear(1, -32, -32, [n(3, 24), n(-2, 16), n(1, 40)])],
  ['demo-2026', ['0.5', '1'], 'min', full(2, -3, 1, 1, 1, 0.5, 1, 0.5)],
  ['483ABF', ['7.25'], null, linear(4, 29, 7.25, [n(4, -24)])],
  ['36E26B', ['-12', '12'], 'max', square(144, -12, 12, 12)],
  ['AB4778', ['-0.4'], null, linear(-5, 2, -0.4)],
  ['286CF5', ['0', '5'], 'min', [['4x^2-20x=0'], n(4, -20), n(0, 5), n(0)]],
  ['two-brackets-1', ['4'], null, linear(3, 12, 4, [n(5, -15), n(-2, -8), n(3, -23)])],
  ['540ABC', ['5', '6'], 'min', full(1, -11, 30, 1, 1, 5, 6, 5)],
  ['28287F', ['-0.7'], null, linear(10, -7, -0.7)],
  ['46C337', ['-5', '5'], 'max', square(25, -5, 5, 5)],
  ['5572B4', ['-5.8'], null, linear(5, -29, -5.8, [n(5, 20)])],
  ['nonmonic-1', ['-1.2', '1'], 'max', full(5, 1, -6, 121, 11, -1.2, 1, 1)],
  ['one-bracket-x', ['3.25'], null, linear(4, 13, 3.25, [n(5, -15)])],
  ['69EC44', ['-3', '3'], 'min', square(9, -3, 3, -3)],
  ['4F57B2', ['-0.9'], null, linear(-10, 9, -0.9)],
  ['4318F0', ['2', '9'], 'max', full(1, -11, 18, 49, 7, 2, 9, 9)],
  ['01DB8F', ['-10.6'], null, linear(5, -53, -10.6, [n(5, 45)])],
  ['factor-x-max', ['0', '2.5'], 'max', [n(6, -15), n(0, 2.5), n(2.5)]],
  ['two-brackets-2', ['-6.5'], null, linear(-4, 26, -6.5, [n(3, -12), n(7, 14)])],
  ['EA4046', ['3', '6'], 'min', full(1, -9, 18, 9, 3, 3, 6, 3)],
  ['E1A33F', ['0.5'], null, linear(4, 2, 0.5)],
  ['nonmonic-2', ['-0.5', '1.5'], 'min', full(4, -4, -3, 64, 8, -0.5, 1.5, -0.5)],
  ['two-brackets-3', ['-2.4'], null, linear(5, -12, -2.4, [n(7, 21), n(-2, -2), n(5, 19)])],
  ['30344D', ['1', '5'], 'min', full(1, -6, 5, 16, 4, 1, 5, 1)],
  ['transfer-1', ['1.625'], null, linear(8, 13, 1.625)],
  ['9937FD', ['0', '5'], 'min', [['x^2-5x=0'], n(1, -5), n(0, 5), n(0)]],
  ['02AAF8', ['2', '10'], 'max', full(1, -12, 20, 64, 8, 2, 10, 10)],
];
const vietaFixtures = [
  ['540ABC', [n(-11, 30), n(11, 30), n(5, 6), n(5)]],
  ['4318F0', [n(-11, 18), n(11, 18), n(2, 9), n(9)]],
  ['EA4046', [n(-9, 18), n(9, 18), n(3, 6), n(3)]],
  ['30344D', [n(-6, 5), n(6, 5), n(1, 5), n(1)]],
  ['02AAF8', [n(-12, 20), n(12, 20), n(2, 10), n(10)]],
];

function getTask(code) {
  return trainer.run('EXAM_BANK').find(task => task.id === 'exam-' + code);
}

function verifySteps(code, expected, method) {
  const factories = trainer.run('taskSteps')(getTask(code), method);
  assert.equal(factories.length, expected.length, code + ': all steps covered');
  const state = {};
  for (let i = 0; i < factories.length; i++) {
    const def = factories[i](state), want = expected[i];
    const context = code + ' ' + (method || 'default') + ' step ' + (i + 1);
    assert.ok(def.q && def.hint && def.reveal.html, context + ': explanation exists');
    assert.doesNotMatch(def.q + def.hint + def.reveal.html, /undefined|NaN|Infinity|\[object /, context);
    assert.equal(def.reveal.vals.length, want.length, context);
    for (let j = 0; j < want.length; j++) {
      if (def.ui.type === 'eqn') assert.equal(def.reveal.vals[j], want[j], context);
      else assert.ok(equal(parse(def.reveal.vals[j]), parse(want[j])), context + ': independently worked intermediate value');
      const bad = want.slice();
      bad[j] = def.ui.type === 'eqn' ? 'x=999' : '999';
      assert.equal(def.check(bad, state).ok, false, context + ': rejects an incorrect field');
      const empty = want.slice(); empty[j] = '';
      assert.equal(def.check(empty, state).need, true, context + ': empty field is not an error attempt');
    }
    assert.equal(def.check(want, state).ok, true, context + ': accepts worked solution');
    if (def.ui.type === 'num2' && !def.ordered && /корн/i.test(def.q)) {
      assert.equal(def.check(want.slice().reverse(), state).ok, true, context + ': roots can be written in either order');
    }
  }
}

test('independent review preserves the original 27 exam tasks in their original order', () => {
  assert.deepEqual(Array.from(trainer.run('EXAM_BANK').slice(0, 27), task => task.id), fixtures.map(([id]) => 'exam-' + id));
});
for (const [code, roots, ask, steps] of fixtures) {
  test(code + ': independently worked roots, chosen answer and every default step', () => {
    const task = getTask(code), actual = trainer.run('taskSolve')(task).roots;
    assert.equal(task.ask, ask);
    assert.equal(actual.length, roots.length);
    actual.forEach((root, i) => assert.ok(equal(root, parse(roots[i])), code + ': root ' + i));
    const answer = ask === 'max' ? roots.at(-1) : roots[0];
    assert.ok(equal(parse(task.exp), parse(answer)), code + ': stored answer');
    assert.equal(trainer.run('checkFinal')(task, answer).ok, true);
    if (roots.length === 2) {
      const other = ask === 'max' ? roots[0] : roots[1];
      assert.equal(trainer.run('checkFinal')(task, other).ok, false, code + ': rejects other root');
    }
    verifySteps(code, steps);
  });
}
for (const [code, steps] of vietaFixtures) {
  test(code + ': every Vieta step matches independently worked sum and product', () => verifySteps(code, steps, 'vieta'));
}

test('equivalent scaled factorisation explains the extra equation transformation', () => {
  const task = getTask('286CF5'), factories = trainer.run('taskSteps')(task), state = {};
  assert.equal(factories[0](state).check(['x^2-5x=0'], state).ok, true);
  const factor = factories[1](state), result = factor.check(['1', '-5'], state);
  assert.equal(result.ok, true);
  assert.match(result.msg || '', /равносильн|умнож|раздел/i, 'scaling must not masquerade as factoring the original expression');
});

test('negative quadratic coefficients keep root order free and the final selection correct', () => {
  const task = getTask('demo-2026'), factories = trainer.run('taskSteps')(task), state = {};
  const values = [n(-2, 3, -1), n(1), n(1), n(1, 0.5), n(0.5)];
  values.forEach((v, i) => {
    const def = factories[i](state);
    if (i === 3) {
      assert.match(def.hint, /любом порядке/);
      assert.doesNotMatch(def.hint, /x₁\s*=/, 'formula order must not conflict with the sorted reveal labels');
    }
    assert.equal(def.check(v, state).ok, true, 'negative-a step ' + i);
  });
});
