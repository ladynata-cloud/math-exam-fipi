'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const D = require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core.js');

// A separate integer-arithmetic oracle avoids verifying a division plan merely
// by asking its own answer checker whether it accepts its own answers.
function rational(text) {
  const parts = String(text).replace(',', '.').split('.');
  return { n: BigInt(parts.join('')), d: 10n ** BigInt((parts[1] || '').length) };
}
function assertArithmetic(p) {
  const a = rational(p.task.dividend), b = rational(p.task.divisor), q = rational(p.quotient);
  if (p.task.level === 'remainder') {
    assert.equal(a.d, 1n); assert.equal(b.d, 1n); assert.equal(q.d, 1n);
    assert.equal(a.n, b.n * q.n + BigInt(p.remainder));
  } else {
    assert.equal(a.n * b.d * q.d, b.n * q.n * a.d, 'exact rational quotient');
    assert.equal(p.remainder, 0);
  }
  const normalizedA = rational(p.normalizedDividend);
  assert.equal(a.n * b.d * normalizedA.d * BigInt(p.normalizedDivisor), normalizedA.n * a.d * b.n,
    'normalization preserves the ratio');
  p.cycles.forEach((cycle, index) => {
    const partial = BigInt(cycle.partial), divisor = BigInt(p.normalizedDivisor);
    assert.equal(BigInt(cycle.qd), partial / divisor);
    assert.equal(BigInt(cycle.product), divisor * BigInt(cycle.qd));
    assert.equal(BigInt(cycle.remainder), partial % divisor);
    assert(cycle.qd >= 0 && cycle.qd <= 9);
    if (index) {
      const previous = p.cycles[index - 1];
      assert.equal(cycle.sourceIndex, previous.sourceIndex + 1, 'exactly one digit is brought down');
      assert.equal(cycle.partial, previous.remainder * 10 + p.digits[cycle.sourceIndex]);
    } else {
      assert.equal(cycle.partial, Number(p.digits.slice(0, cycle.sourceIndex + 1).join('')));
    }
    assert.equal(p.baseActions[cycle.digitAction].answer, String(cycle.qd));
    assert.equal(p.baseActions[cycle.productAction].answer, String(cycle.product));
    assert.equal(p.baseActions[cycle.subtractAction].answer, String(cycle.remainder));
  });
}
function assertPlan(p) {
  assertArithmetic(p);
  assert.deepEqual(p.baseActions, D.plan(p.task).actions, 'shared core indices are unchanged');
  assert.equal(p.integerDigitCount, p.quotient.split(',')[0].length);
  let completed = 0;
  for (const [i, action] of p.actions.entries()) {
    assert.equal(action.guidedStep, i);
    assert(G.check(action.answer, action), action.kind + ': correct answer rejected');
    assert(!G.check('', action)); assert(!G.check('   ', action));
    assert(!G.check(null, action)); assert(!G.check(undefined, action));
    assert(!G.check({}, action)); assert(!G.check(true, action));
    assert(action.prompt.length > 0 && action.hint.length > 0);
    assert(Number.isInteger(action.visibleBaseStep));
    if (p.micropractice) continue;
    assert.equal(action.visibleBaseStep, completed, 'notebook only includes previous accepted base steps');
    if (['count', 'remainder-check'].includes(action.kind)) {
      assert.equal(action.baseStep, completed - 1);
    } else {
      assert.equal(action.baseStep, completed);
      assert.equal(action.kind, p.baseActions[completed].kind);
      assert.equal(action.answer, p.baseActions[completed].answer);
      completed++;
    }
  }
  if (p.micropractice) {
    assert.equal(p.actions.length, 1); assert.equal(p.actions[0].kind, 'digit');
    assert.equal(p.actions[0].visibleBaseStep, p.cycles[0].digitAction);
  } else {
    assert.equal(completed, p.baseActions.length);
    assert.equal(p.actions.filter(a => a.kind === 'count').length, 1);
    assert.equal(p.actions.filter(a => a.kind === 'remainder-check').length, p.cycles.length);
    assert.equal(p.actions.at(-1).kind, 'verify');
  }
}

const expected = {
  start: ['48', '2', '24'], oneDigit: ['72', '3', '24'], zero: ['1005', '5', '201'],
  remainder: ['29', '6', '4'], twoDigit: ['864', '36', '24'],
  decimalNatural: ['12,6', '3', '4,2'], appendZeros: ['1', '8', '0,125'],
  decimalDivisor: ['8', '2,5', '3,2'], quotientDigit: ['12', '3', '4']
};
assert.equal(new Set(G.topics.map(t => t.id)).size, Object.keys(expected).length);
for (const topic of G.topics) {
  const task = G.make(topic.id), p = G.plan(task);
  assert.deepEqual([task.dividend, task.divisor, p.quotient], expected[topic.id]);
  assert.deepEqual(topic.example, expected[topic.id].slice(0, 2));
  assertPlan(p);
}
assert.deepEqual([0, 1, 2, 3].map(i => G.make('start', i).dividend), ['48', '69', '84', '96']);
assert.deepEqual([0, 1, 2].map(i => G.make('oneDigit', i).dividend), ['72', '84', '735']);

const special = [
  { topicId: 'oneDigit', level: 'oneDigit', dividend: '0', divisor: '5', quotient: '0', digits: 1 },
  { topicId: 'appendZeros', level: 'appendZeros', dividend: '3', divisor: '8', quotient: '0,375', digits: 1 },
  { topicId: 'appendZeros', level: 'appendZeros', dividend: '1', divisor: '16', quotient: '0,0625', digits: 1 },
  { topicId: 'zero', level: 'zero', dividend: '10005', divisor: '5', quotient: '2001', digits: 4 },
  { topicId: 'remainder', level: 'remainder', dividend: '3', divisor: '8', quotient: '0', digits: 1 },
  { topicId: 'decimalNatural', level: 'decimalNatural', dividend: '0,25', divisor: '5', quotient: '0,05', digits: 1 },
  { topicId: 'decimalDivisor', level: 'decimalDivisor', dividend: '0,084', divisor: '0,4', quotient: '0,21', digits: 1 },
  { topicId: 'decimalDivisor', level: 'decimalDivisor', dividend: '1', divisor: '0,025', quotient: '40', digits: 2 }
];
for (const task of special) {
  const p = G.plan(task);
  assert.equal(p.quotient, task.quotient);
  assert.equal(p.integerDigitCount, task.digits);
  assertPlan(p);
}
const zeros = G.plan(special[3]);
assert.equal(zeros.cycles.filter(c => c.qd === 0).length, 2);
const append = G.plan(G.make('appendZeros'));
assert.equal(append.actions.filter(a => a.kind === 'bring' && a.appended).length, 3);
assert.equal(append.actions.filter(a => a.kind === 'comma').length, 1);
assert.equal(append.actions.find(a => a.kind === 'count').answer, '1', 'count does not reveal decimal tail length');
const shifted = G.plan(G.make('decimalDivisor'));
assert.deepEqual(shifted.actions.slice(0, 4).map(a => a.kind), ['shift-count', 'shift-factor', 'shift-divisor', 'shift-dividend']);
assert.equal(shifted.normalizationEnd, 4);
assert.equal(shifted.actions[4].kind, 'start');
assert.equal(shifted.actions[4].visibleBaseStep, 4);

for (const value of ['', ' ', '00', '0.0', '1e0', '-0', '0,', '<script>', 'NaN', 'Infinity']) {
  assert(!G.check(value, { kind: 'digit', answer: '0' }), 'reject non-single digit: ' + value);
}
assert(G.check('0', { kind: 'digit', answer: '0' }));
assert(G.check('0', { kind: 'bring', answer: '0' }));
assert(!G.check('00', { kind: 'bring', answer: '0' }));
assert(G.check('1,20', { kind: 'answer', answer: '1,2' }));
assert(G.check('1.20', { kind: 'answer', answer: '1,2' }));
assert(!G.check('1,2001', { kind: 'answer', answer: '1,2' }));
assert(G.check('0,', { kind: 'comma', answer: '0,' }));
assert(G.check('0.', { kind: 'comma', answer: '0,' }));
assert(!G.check('0', { kind: 'comma', answer: '0,' }));
assert(G.check('Да', { kind: 'remainder-check', answer: 'да' }));
assert(G.check('<', { kind: 'remainder-check', answer: 'да' }));
assert(!G.check('нет', { kind: 'remainder-check', answer: 'да' }));
assert(!G.check('2.0', { kind: 'count', answer: '2' }));
assert(!G.check('02', { kind: 'count', answer: '2' }));
assert(G.check('2', { kind: 'count', answer: '2' }));
for (const id of ['missing', '__proto__', 'toString', null]) assert.throws(() => G.make(id));
for (const sequence of [-1, 0.5, NaN, Infinity, '1', 1000001]) assert.throws(() => G.make('start', sequence));
assert.throws(() => G.plan({ topicId: 'start', level: 'remainder', dividend: '48', divisor: '2' }));
assert.throws(() => G.plan({ topicId: 'quotientDigit', level: 'remainder', dividend: '12', divisor: '12' }));
assert.throws(() => G.plan({ topicId: 'quotientDigit', level: 'remainder', dividend: '20', divisor: '2' }));
assert.throws(() => G.plan({ topicId: 'appendZeros', level: 'appendZeros', dividend: '1', divisor: '3' }));
assert.throws(() => G.plan({ topicId: 'start', level: 'oneDigit', dividend: '12', divisor: '0' }));
assert.throws(() => G.plan(null));

let count = 0;
for (const topic of G.topics) {
  for (let sequence = 0; sequence < 300; sequence++) {
    const task = G.make(topic.id, sequence);
    assert.deepEqual(task, G.make(topic.id, sequence), 'task generation is deterministic');
    const p = G.plan(task);
    assertPlan(p);
    assert(p.actions.length < 180);
    if (topic.id === 'start') {
      assert(/^[1-9][0-9]$/.test(task.dividend));
      assert(['2', '3'].includes(task.divisor));
      assert.equal(p.cycles.length, 2);
      assert(p.cycles.every(c => c.remainder === 0 && c.qd > 0));
    }
    if (topic.id === 'quotientDigit') {
      assert(Number(task.divisor) >= 2 && Number(task.divisor) <= 9);
      assert(Number(task.dividend) < 10 * Number(task.divisor));
    }
    count++;
  }
}
// Verify the same public API is usable by plain script tags, without CommonJS.
const context = vm.createContext({ window: {} });
for (const file of ['division-lab-core.js', 'division-guided-core.js']) {
  vm.runInContext(fs.readFileSync('trainers/oge-basics/multiplication-division/' + file, 'utf8'), context);
}
assert.equal(context.window.DivisionGuided.plan(context.window.DivisionGuided.make('start')).quotient, '24');
console.log('PASS: ' + count + ' deterministic guided plans; exact rational arithmetic; zero, remainder and decimal edges; cumulative notebook indices; input validation; browser API.');
