'use strict';

const assert = require('node:assert/strict');
const { cards, transfers, model, checkAnswer } = require('../trainers/tyurin-statistics/condition-data.js');

function expectProbabilities(result, expected) {
  const fields = ['pA', 'pB', 'joint', 'givenB', 'givenA'];
  assert.deepEqual(fields.map(field => result[field]), expected);
  fields.forEach((field, index) => {
    if (expected[index] !== null) assert.equal(checkAnswer(expected[index], result, field).ok, true);
  });
}

const start = model(cards);
expectProbabilities(start, ['3/8', '1/3', '1/4', '3/4', '2/3']);
assert.deepEqual([start.minBoth, start.maxBoth, start.independentBoth], [0, 8, 3]);

for (let x = 0; x <= 8; x++) {
  const current = model(cards, x);
  // Build 24 actual cards by assigning stars inside and outside A separately.
  const deck = Array.from({ length: 24 }, (_, id) => ({
    a: id < 9,
    b: id < x || (id >= 9 && id < 9 + 8 - x)
  }));
  const count = predicate => deck.filter(predicate).length;
  assert.equal(current.onlyA, count(c => c.a && !c.b));
  assert.equal(current.onlyB, count(c => !c.a && c.b));
  assert.equal(current.neither, count(c => !c.a && !c.b));
  assert.equal(current.both, count(c => c.a && c.b));
  const subset = deck.filter(c => c.b);
  const share = subset.filter(c => c.a).length / subset.length;
  assert.equal(current.change, share > 3 / 8 ? 'up' : share < 3 / 8 ? 'down' : 'same');
  assert.equal(current.independent, x === 3);
  assert.equal(current.disjoint, x === 0);
}
assert.deepEqual(cards, { total: 24, a: 9, b: 8, both: 6 });

const cases = [
  ['envelopes', ['2/5', '1/4', '3/20', '3/5', '3/8'], 2, false, false],
  ['photos', ['2/5', '1/3', '2/15', '2/5', '1/3'], 4, true, false],
  ['books', ['1/4', '3/7', '0', '0', '0'], 3, false, true],
  ['seeds', ['1/3', '1/4', '1/36', '1/9', '1/12'], 3, false, false]
];
assert.equal(transfers.length, cases.length);
for (const [i, [id, probabilities, target, independent, disjoint]] of cases.entries()) {
  const context = transfers[i];
  assert.equal(context.id, id);
  const current = model(context);
  expectProbabilities(current, probabilities);
  assert.deepEqual([current.independentBoth, current.independent, current.disjoint], [target, independent, disjoint]);
  assert.equal(model(context, target).independent, true);
}

for (const correct of ['3/4', '06 / 08', '0.75', '0,7500', ',75']) {
  assert.equal(checkAnswer(correct, start, 'givenB').ok, true, correct);
}
for (const wrong of ['', '  ', '0/0', '3/0', '3,4/5', '-3/-4', '3/4/1', 'NaN', 'Infinity', '75%', '3x', '0,75000000000000001', '0.7.5']) {
  assert.equal(checkAnswer(wrong, start, 'givenB').ok, false, wrong);
}
assert.match(checkAnswer('6/24', start, 'givenB').message, /пересечения/);
assert.match(checkAnswer('6/9', start, 'givenB').message, /обратная/);
assert.match(checkAnswer('9/24', start, 'givenB').message, /всей группе/);
assert.match(checkAnswer('6/8', start, 'givenA').message, /обратная/);
assert.equal(checkAnswer('2.99999999999999999', start, 'independentBoth').ok, false);
assert.equal(checkAnswer('0.3333333', start, 'pB').ok, false);

const emptyB = model({ total: 4, a: 2, b: 0, both: 0 });
expectProbabilities(emptyB, ['1/2', '0', '0', null, '0']);
assert.deepEqual([emptyB.change, emptyB.independent, emptyB.disjoint], [null, true, true]);
assert.match(checkAnswer('0', emptyB, 'givenB').message, /не определена/);
const emptyA = model({ total: 4, a: 0, b: 1, both: 0 });
assert.equal(emptyA.givenA, null);
assert.equal(emptyA.givenB, '0');
const allB = model({ total: 4, a: 3, b: 4, both: 3 });
assert.deepEqual([allB.minBoth, allB.maxBoth, allB.givenB, allB.independent], [3, 3, '3/4', true]);
const noninteger = model({ total: 4, a: 1, b: 2, both: 1 });
assert.equal(noninteger.independentBoth, null);
assert.match(checkAnswer('0', noninteger, 'independentBoth').message, /невозможно/);
for (const invalid of [
  { total: 0, a: 0, b: 0, both: 0 }, { total: 4, a: 3, b: 4, both: 2 },
  { total: 4, a: 1, b: 2, both: 2 }, { total: 4, a: -1, b: 1, both: 0 },
  { total: 4, a: 2, b: 1.5, both: 1 }
]) assert.throws(() => model(invalid), RangeError);

console.log('Verified all 9 card tables, 4 transfer cases, exact answers, error feedback and boundary cases.');
