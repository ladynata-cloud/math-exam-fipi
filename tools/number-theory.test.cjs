'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const math = require('../trainers/number-theory/math.js');

// Independent integer searches: no Euclidean algorithm or stored answer is used.
function bruteGcd(a, b) {
  let greatest = 1;
  for (let candidate = 2; candidate <= Math.min(a, b); candidate++) {
    if (a % candidate === 0 && b % candidate === 0) greatest = candidate;
  }
  return greatest;
}

function bruteLcm(a, b) {
  const step = Math.max(a, b);
  let candidate = step;
  while (candidate % a !== 0 || candidate % b !== 0) candidate += step;
  return candidate;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let divisor = 2; divisor < n; divisor++) if (n % divisor === 0) return false;
  return true;
}

function product(values) {
  return values.reduce((result, value) => result * value, 1);
}

const expectedBank = [
  [1, 4, 6, 2, 12], [1, 6, 8, 2, 24], [1, 8, 12, 4, 24], [1, 6, 9, 3, 18],
  [1, 12, 18, 6, 36], [1, 10, 15, 5, 30], [1, 8, 16, 8, 16], [1, 12, 12, 12, 12],
  [2, 18, 24, 6, 72], [2, 20, 30, 10, 60], [2, 24, 36, 12, 72], [2, 28, 42, 14, 84],
  [2, 36, 48, 12, 144], [2, 18, 30, 6, 90], [2, 8, 15, 1, 120], [2, 14, 25, 1, 350],
  [3, 36, 54, 18, 108], [3, 45, 75, 15, 225], [3, 48, 72, 24, 144], [3, 60, 84, 12, 420],
  [3, 72, 90, 18, 360], [3, 84, 126, 42, 252], [3, 96, 144, 48, 288], [3, 45, 180, 45, 180]
];

test('24 distinct pairs cover three levels, repeated primes and the special cases', () => {
  assert.equal(math.bank.length, 24);
  assert.equal(new Set(math.bank.map(task => task.id)).size, 24);
  assert.equal(new Set(math.bank.map(task => [task.a, task.b].sort((a, b) => a - b).join(','))).size, 24);
  assert.deepEqual([1, 2, 3].map(level => math.bank.filter(task => task.level === level).length), [8, 8, 8]);
  for (const [index, task] of math.bank.entries()) {
    const [level, a, b, gcd, lcm] = expectedBank[index];
    assert.deepEqual(Object.keys(task).sort(), ['a', 'b', 'id', 'level']);
    assert.deepEqual([task.level, task.a, task.b], [level, a, b]);
    assert.equal(bruteGcd(a, b), gcd);
    assert.equal(bruteLcm(a, b), lcm);
    assert.equal(math.gcd(a, b), gcd);
    assert.equal(math.lcm(a, b), lcm);
  }
  assert.ok(math.bank.some(task => task.a === task.b));
  assert.ok(math.bank.some(task => task.a !== task.b && task.b % task.a === 0));
  assert.ok(math.bank.some(task => bruteGcd(task.a, task.b) === 1));
});

test('pair validation uses integer numbers with inclusive 2..200 bounds', () => {
  for (let a = 2; a <= 200; a++) for (let b = 2; b <= 200; b++) {
    assert.equal(math.validatePair(a, b), true);
  }
  const invalid = [undefined, null, true, false, '', '12', [], {}, NaN, Infinity, -Infinity, 0, -2, 1, 201, 2.5];
  for (const value of invalid) {
    assert.equal(math.validatePair(value, 12), false);
    assert.equal(math.validatePair(12, value), false);
    assert.throws(() => math.analyze(value, 12), RangeError);
  }
});

test('prime catalogue and every factorization preserve prime multiplicity', () => {
  const expectedPrimes = [];
  for (let n = 2; n <= 200; n++) if (isPrime(n)) expectedPrimes.push(n);
  assert.deepEqual(math.primes, expectedPrimes);
  assert.deepEqual(math.factorize(1), []);
  for (let n = 2; n <= 200; n++) {
    const factors = math.factorize(n);
    assert.ok(factors.length > 0);
    assert.equal(product(factors), n, 'factor product: ' + n);
    assert.ok(factors.every(isPrime), 'all factors are prime: ' + n);
    assert.deepEqual(factors, factors.slice().sort((a, b) => a - b));
  }
  assert.deepEqual(math.factorize(12), [2, 2, 3]);
  assert.deepEqual(math.factorize(128), [2, 2, 2, 2, 2, 2, 2]);
  for (const invalid of [0, -1, 1.5, 201, '12', null, NaN, Infinity]) {
    assert.throws(() => math.factorize(invalid), RangeError);
  }
});

test('all 39,601 ordered pairs agree with independent brute-force GCD and LCM', () => {
  for (let a = 2; a <= 200; a++) for (let b = 2; b <= 200; b++) {
    const expectedGcd = bruteGcd(a, b);
    const expectedLcm = bruteLcm(a, b);
    const analysis = math.analyze(a, b);
    assert.equal(math.gcd(a, b), expectedGcd);
    assert.equal(math.lcm(a, b), expectedLcm);
    assert.equal(analysis.gcd, expectedGcd);
    assert.equal(analysis.lcm, expectedLcm);
    assert.equal(product(analysis.aFactors), a);
    assert.equal(product(analysis.bFactors), b);
    assert.equal(product(analysis.commonFactors), expectedGcd);
    assert.equal(product(analysis.missingFromLarger) * analysis.larger, expectedLcm);
    assert.equal(analysis.larger, Math.max(a, b));
    assert.equal(analysis.smaller, Math.min(a, b));
    assert.equal(expectedGcd * expectedLcm, a * b);
    for (const kind of ['nod', 'nok']) {
      const expected = kind === 'nod' ? expectedGcd : expectedLcm;
      assert.equal(math.evaluateAnswer(kind, a, b, String(expected)).status, 'correct');
      assert.equal(math.evaluateAnswer(kind, a, b, String(expected + 1)).status, 'wrong');
    }
  }
});

test('analysis distinguishes matched occurrences, missing factors and no matches', () => {
  assert.deepEqual(math.analyze(12, 18), {
    aFactors: [2, 2, 3], bFactors: [2, 3, 3], commonFactors: [2, 3],
    missingFromLarger: [2], larger: 18, smaller: 12, gcd: 6, lcm: 36
  });
  assert.deepEqual(math.analyze(12, 12).missingFromLarger, []);
  assert.deepEqual(math.analyze(8, 16).missingFromLarger, []);
  assert.deepEqual(math.analyze(8, 15).commonFactors, []);
  assert.deepEqual(math.analyze(8, 15).missingFromLarger, [2, 2, 2]);
  assert.equal(math.analyze(8, 15).gcd, 1);
  assert.deepEqual(math.analyze(96, 144).commonFactors, [2, 2, 2, 2, 3]);
  assert.deepEqual(math.analyze(96, 144).missingFromLarger, [2]);
});

test('empty and malformed answers never receive mathematical credit', () => {
  for (const raw of [undefined, null, '', ' ', '\n\t']) {
    assert.equal(math.evaluateAnswer('nod', 12, 18, raw).status, 'empty');
  }
  for (const raw of [
    '6e0', '1e2', '0x6', '+6', '-6', '6.0', '6,0', '12/2', '6 + 0', '6foo', '6 0',
    '0', '000', 'Infinity', 'NaN', '9007199254740992', '６', [], [6], {}, true, false, -6, 0, 6.5, Infinity, NaN,
    { toString() { throw new Error('Objects must not be coerced'); } }
  ]) {
    const result = math.evaluateAnswer('nod', 12, 18, raw);
    assert.equal(result.status, 'invalid');
    assert.equal(result.code, 'positive-integer');
  }
  for (const raw of ['6', ' 6 ', '\n6\t', '006', 6]) {
    assert.equal(math.evaluateAnswer('nod', 12, 18, raw).status, 'correct');
  }
  assert.equal(math.evaluateAnswer('gcd', 8, 15, '1').status, 'correct');
  assert.equal(math.evaluateAnswer('lcm', 8, 15, '120').status, 'correct');
});

test('wrong answers receive specific feedback without the final answer', () => {
  const cases = [
    ['nod', 12, 18, '36', 'confused-kind'],
    ['nod', 12, 18, '24', 'too-large-divisor'],
    ['nod', 12, 18, '4', 'not-common-divisor'],
    ['nod', 12, 18, '3', 'not-greatest-divisor'],
    ['nod', 8, 15, '2', 'not-common-divisor'],
    ['nok', 12, 18, '6', 'confused-kind'],
    ['nok', 12, 18, '12', 'too-small-multiple'],
    ['nok', 12, 18, '24', 'not-common-multiple'],
    ['nok', 12, 18, '216', 'duplicated-common-factors'],
    ['nok', 12, 18, '72', 'not-least-multiple'],
    ['nok', 8, 15, '240', 'not-least-multiple']
  ];
  for (const [kind, a, b, raw, code] of cases) {
    const result = math.evaluateAnswer(kind, a, b, raw);
    assert.equal(result.status, 'wrong');
    assert.equal(result.code, code);
    assert.ok(result.message.length > 20);
    assert.doesNotMatch(result.message, /\d/, 'feedback must not reveal the final numeric answer');
    assert.deepEqual(Object.keys(result).sort(), ['code', 'message', 'status']);
  }
});

test('invalid task metadata fails safely before checking a submitted answer', () => {
  assert.deepEqual(math.evaluateAnswer('other', 12, 18, '6'), {
    status: 'invalid', code: 'kind', message: 'Выбери задание НОК или НОД.'
  });
  assert.equal(math.evaluateAnswer('nod', 1, 18, '1').code, 'pair');
  assert.equal(math.evaluateAnswer('nok', '12', 18, '36').code, 'pair');
});

test('generic integer GCD and LCM reject unsafe values instead of rounding', () => {
  assert.equal(math.gcd(1, 200), 1);
  assert.equal(math.lcm(1, 200), 200);
  assert.equal(math.gcd(Number.MAX_SAFE_INTEGER, 1), 1);
  for (const invalid of [0, -1, 1.5, '12', null, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => math.gcd(invalid, 12), RangeError);
    assert.throws(() => math.lcm(12, invalid), RangeError);
  }
  assert.throws(() => math.lcm(Number.MAX_SAFE_INTEGER, 2), RangeError);
});

test('browser UMD provides the same API without requiring Node globals', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../trainers/number-theory/math.js'), 'utf8'), sandbox);
  const browserMath = sandbox.window.NumberTheoryMath;
  assert.ok(browserMath);
  assert.equal(browserMath.bank.length, 24);
  assert.equal(browserMath.gcd(12, 18), 6);
  assert.equal(browserMath.lcm(12, 18), 36);
  assert.deepEqual(Array.from(browserMath.factorize(12)), [2, 2, 3]);
  assert.equal(browserMath.evaluateAnswer('nok', 12, 18, '36').status, 'correct');
});
