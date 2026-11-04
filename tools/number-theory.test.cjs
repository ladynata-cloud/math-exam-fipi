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

// Explicit historical IDs are independent of the current array positions. A
// saved room snapshot must continue to refer to the same numbers and level.
// Columns: id, level, first number, second number, expected GCD, expected LCM.
const legacyBank = [
  ['nt-1-1', 1, 4, 6, 2, 12], ['nt-1-2', 1, 6, 8, 2, 24],
  ['nt-1-3', 1, 8, 12, 4, 24], ['nt-1-4', 1, 6, 9, 3, 18],
  ['nt-1-5', 1, 12, 18, 6, 36], ['nt-1-6', 1, 10, 15, 5, 30],
  ['nt-1-7', 1, 8, 16, 8, 16], ['nt-1-8', 1, 12, 12, 12, 12],
  ['nt-2-1', 2, 18, 24, 6, 72], ['nt-2-2', 2, 20, 30, 10, 60],
  ['nt-2-3', 2, 24, 36, 12, 72], ['nt-2-4', 2, 28, 42, 14, 84],
  ['nt-2-5', 2, 36, 48, 12, 144], ['nt-2-6', 2, 18, 30, 6, 90],
  ['nt-2-7', 2, 8, 15, 1, 120], ['nt-2-8', 2, 14, 25, 1, 350],
  ['nt-3-1', 3, 36, 54, 18, 108], ['nt-3-2', 3, 45, 75, 15, 225],
  ['nt-3-3', 3, 48, 72, 24, 144], ['nt-3-4', 3, 60, 84, 12, 420],
  ['nt-3-5', 3, 72, 90, 18, 360], ['nt-3-6', 3, 84, 126, 42, 252],
  ['nt-3-7', 3, 96, 144, 48, 288], ['nt-3-8', 3, 45, 180, 45, 180]
];

const advancedBank = [
  ['nt-1-9', 1, 16, 24, 8, 48], ['nt-1-10', 1, 20, 28, 4, 140],
  ['nt-1-11', 1, 24, 40, 8, 120], ['nt-1-12', 1, 27, 45, 9, 135],
  ['nt-1-13', 1, 32, 48, 16, 96], ['nt-1-14', 1, 75, 25, 25, 75],
  ['nt-1-15', 1, 22, 33, 11, 66], ['nt-1-16', 1, 26, 39, 13, 78],
  ['nt-2-9', 2, 66, 44, 22, 132], ['nt-2-10', 2, 39, 65, 13, 195],
  ['nt-2-11', 2, 34, 85, 17, 170], ['nt-2-12', 2, 38, 95, 19, 190],
  ['nt-2-13', 2, 92, 69, 23, 276], ['nt-2-14', 2, 58, 145, 29, 290],
  ['nt-2-15', 2, 93, 124, 31, 372], ['nt-2-16', 2, 74, 111, 37, 222],
  ['nt-2-17', 2, 82, 123, 41, 246], ['nt-2-18', 2, 86, 129, 43, 258],
  ['nt-2-19', 2, 141, 94, 47, 282], ['nt-2-20', 2, 55, 77, 11, 385],
  ['nt-3-9', 3, 132, 88, 44, 264], ['nt-3-10', 3, 99, 165, 33, 495],
  ['nt-3-11', 3, 104, 156, 52, 312], ['nt-3-12', 3, 117, 195, 39, 585],
  ['nt-3-13', 3, 68, 102, 34, 204], ['nt-3-14', 3, 76, 114, 38, 228],
  ['nt-3-15', 3, 121, 143, 11, 1573], ['nt-3-16', 3, 169, 143, 13, 1859],
  ['nt-3-17', 3, 22, 65, 1, 1430], ['nt-3-18', 3, 26, 77, 1, 2002],
  ['nt-3-19', 3, 34, 57, 1, 1938], ['nt-3-20', 3, 116, 58, 58, 116]
];
const expectedBank = new Map([...legacyBank, ...advancedBank].map(row => [row[0], row]));

test('all 24 published task IDs retain their original numbers and levels', () => {
  assert.equal(legacyBank.length, 24);
  for (const [id, level, a, b] of legacyBank) {
    assert.deepEqual(math.bank.find(task => task.id === id), { id, level, a, b }, id + ': saved work must remain valid');
  }
});

test('56 distinct pairs have verified fixed answers and the 16/20/20 level distribution', () => {
  assert.equal(math.bank.length, 56);
  assert.equal(advancedBank.length, 32);
  assert.equal(new Set(math.bank.map(task => task.id)).size, 56);
  assert.equal(new Set(math.bank.map(task => [task.a, task.b].sort((a, b) => a - b).join(','))).size, 56);
  assert.deepEqual([1, 2, 3].map(level => math.bank.filter(task => task.level === level).length), [16, 20, 20]);
  assert.deepEqual(math.bank.map(task => task.id).sort(), [...expectedBank.keys()].sort());
  for (const task of math.bank) {
    const [id, level, a, b, gcd, lcm] = expectedBank.get(task.id);
    assert.deepEqual(Object.keys(task).sort(), ['a', 'b', 'id', 'level']);
    assert.deepEqual(task, { id, level, a, b });
    assert.equal(math.validatePair(a, b), true, id + ': keep the existing numeric domain');
    assert.equal(bruteGcd(a, b), gcd, id + ': independent GCD');
    assert.equal(bruteLcm(a, b), lcm, id + ': independent LCM');
    assert.equal(math.gcd(a, b), gcd, id + ': implemented GCD');
    assert.equal(math.lcm(a, b), lcm, id + ': implemented LCM');
  }
  assert.ok(math.bank.some(task => task.a === task.b));
  assert.ok(math.bank.some(task => task.a !== task.b && task.b % task.a === 0));
  assert.ok(math.bank.some(task => bruteGcd(task.a, task.b) === 1));
});

test('advanced tasks exercise every prime-button value through 47 with bounded arithmetic and both number orders', () => {
  const buttonPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  const usedPrimes = new Set(math.bank.flatMap(task => [...math.factorize(task.a), ...math.factorize(task.b)]));
  assert.deepEqual([...usedPrimes].sort((a, b) => a - b), buttonPrimes);
  for (const prime of buttonPrimes) assert.ok(math.primes.includes(prime) && isPrime(prime));
  for (const prime of buttonPrimes.filter(prime => prime > 7)) {
    assert.ok(advancedBank.some(([, , a, b]) => a % prime === 0 && b % prime === 0), 'Common large prime ' + prime);
  }
  assert.equal(advancedBank.filter(([, , a, b]) => a > b).length, 7, 'Do not teach that the larger number is always on the right');
  assert.equal(advancedBank.filter(([, , , , gcd]) => gcd === 1).length, 3, 'Coprime composite numbers remain a distinct case');
  assert.equal(advancedBank.filter(([, , a, b]) => a % b === 0 || b % a === 0).length, 2, 'Exact divisibility must not add unnecessary factors');
  assert.equal(Math.max(...math.bank.map(task => bruteLcm(task.a, task.b))), 2002, 'Arithmetic stays within the reviewed bank');
  assert.ok(advancedBank.some(([, , a, b]) => a === 121 || b === 121), 'Repeated factor 11');
  assert.ok(advancedBank.some(([, , a, b]) => a === 169 || b === 169), 'Repeated factor 13');
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
  assert.deepEqual(math.bank.find(task => task.id === 'nt-3-9'), { id: 'nt-3-9', level: 3, a: 132, b: 88 });
  assert.deepEqual(math.analyze(132, 88), {
    aFactors: [2, 2, 3, 11], bFactors: [2, 2, 2, 11], commonFactors: [2, 2, 11],
    missingFromLarger: [2], larger: 132, smaller: 88, gcd: 44, lcm: 264
  });
  assert.deepEqual(math.analyze(88, 132).missingFromLarger, [2]);
  assert.deepEqual(math.analyze(121, 143).commonFactors, [11]);
  assert.deepEqual(math.analyze(121, 143).missingFromLarger, [11]);
  assert.deepEqual(math.analyze(169, 143).commonFactors, [13]);
  assert.deepEqual(math.analyze(169, 143).missingFromLarger, [11]);
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
  assert.equal(browserMath.bank.length, 56);
  assert.equal(browserMath.gcd(12, 18), 6);
  assert.equal(browserMath.lcm(12, 18), 36);
  assert.deepEqual(Array.from(browserMath.factorize(12)), [2, 2, 3]);
  assert.equal(browserMath.evaluateAnswer('nok', 12, 18, '36').status, 'correct');
  assert.equal(browserMath.evaluateAnswer('nod', 132, 88, '44').status, 'correct');
  assert.equal(browserMath.evaluateAnswer('nok', 132, 88, '264').status, 'correct');
});
