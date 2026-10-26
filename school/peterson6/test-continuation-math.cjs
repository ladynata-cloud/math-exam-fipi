'use strict';

const assert = require('node:assert/strict');
const M = require('./math.js');

// Independent BigInt oracle for the intermediate answers. It deliberately
// does not call the production parser, arithmetic, or answer checker.
function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function normalize(n, d = 1n) {
  assert.notEqual(d, 0n, 'oracle denominator must be nonzero');
  if (d < 0n) { n = -n; d = -d; }
  const divisor = gcd(n, d);
  return [n / divisor, d / divisor];
}
function rational(value) {
  if (Array.isArray(value)) return value;
  const text = String(value).replace(',', '.');
  if (text.includes('/')) return normalize(...text.split('/').map(BigInt));
  if (text.includes('.')) {
    const parts = text.split('.');
    return normalize(BigInt(parts.join('')), 10n ** BigInt(parts[1].length));
  }
  return [BigInt(text), 1n];
}
function add(a, b) {
  a = rational(a); b = rational(b);
  return normalize(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
}
function negate(a) { a = rational(a); return [-a[0], a[1]]; }
function subtract(a, b) { return add(a, negate(b)); }
function multiply(a, b) {
  a = rational(a); b = rational(b);
  return normalize(a[0] * b[0], a[1] * b[1]);
}
function divide(a, b) {
  a = rational(a); b = rational(b);
  return normalize(a[0] * b[1], a[1] * b[0]);
}
function absolute(a) { a = rational(a); return [a[0] < 0n ? -a[0] : a[0], a[1]]; }
function sign(a) { a = rational(a)[0]; return a > 0n ? 1n : a < 0n ? -1n : 0n; }

const continuationSkills = [
  'ratio', 'scale', 'proportion', 'direct-proportion', 'inverse-proportion',
  'proportional-parts', 'signed-add', 'signed-subtract', 'signed-multiply',
  'signed-divide', 'integer-compare', 'absolute-value', 'number-base',
  'linear-equation', 'like-terms', 'angle-measure', 'unit-conversion',
  'rectangle-area', 'rectangular-volume', 'bracket-evaluate', 'coefficient',
  'point-distance', 'triangle-angle'
];
assert.deepEqual(M.skills.slice(20).map(skill => skill.id), continuationSkills);

function intermediateAnswers(id, c) {
  if (id === 'ratio') return [c.right, gcd(BigInt(c.left), BigInt(c.right))];
  if (id === 'scale') return [c.right, multiply(c.left, c.right)];
  if (id === 'proportion') return [multiply(c.left, c.third), c.right];
  if (id === 'direct-proportion') return [divide(c.right, c.left), c.third];
  if (id === 'inverse-proportion') return [multiply(c.left, c.right), c.third];
  if (id === 'proportional-parts') return [add(c.right, c.third), divide(c.left, add(c.right, c.third))];
  if (id === 'signed-add' || id === 'signed-subtract') {
    const a = rational(c.left), b = id === 'signed-add' ? rational(c.right) : negate(c.right);
    const denominator = a[1] * b[1] / gcd(a[1], b[1]);
    return [b, denominator, a[0] * (denominator / a[1]) + b[0] * (denominator / b[1])];
  }
  if (id === 'signed-multiply' || id === 'signed-divide') {
    return [sign(c.left) * sign(c.right),
      (id === 'signed-multiply' ? multiply : divide)(absolute(c.left), absolute(c.right))];
  }
  if (id === 'absolute-value') return [absolute(c.left), 0];
  if (id === 'integer-compare') return [subtract(c.left, c.right), sign(subtract(c.left, c.right))];
  if (id === 'number-base') {
    const first = BigInt(c.digits[0]) * BigInt(c.base) ** BigInt(c.digits.length - 1);
    let value = 0n;
    for (const digit of c.digits) value = value * BigInt(c.base) + BigInt(digit);
    return [first, value - first];
  }
  if (id === 'linear-equation') return [subtract(c.third, c.right), c.left];
  if (id === 'like-terms') return [add(c.left, c.right), c.third];
  if (id === 'angle-measure' || id === 'triangle-angle') return [180, add(c.left, c.right)];
  if (id === 'unit-conversion') return [c.right, c.left];
  if (id === 'rectangle-area' || id === 'rectangular-volume') return [c.left, multiply(c.left, c.right)];
  if (id === 'bracket-evaluate') return [subtract(c.right, c.third), subtract(c.third, c.right)];
  if (id === 'coefficient') return [multiply(c.left, c.right), c.third];
  if (id === 'point-distance') return [subtract(c.left, c.right), absolute(subtract(c.left, c.right))];
  throw new Error('Unreviewed continuation skill: ' + id);
}

let tasks = 0, steps = 0;
for (const id of continuationSkills) {
  for (let level = 1; level <= 3; level++) {
    for (let seed = 0; seed < 200; seed++) {
      const task = M.generate(id, seed, level);
      const expected = intermediateAnswers(id, task.calculation);
      const context = `${id}, level ${level}, seed ${seed}`;
      assert.equal(task.steps.length, expected.length, context + ': step count');
      for (let index = 0; index < expected.length; index++) {
        assert.deepEqual(rational(task.steps[index].answer), rational(expected[index]), context + ', step ' + (index + 1));
        steps++;
      }
      if (id === 'signed-add' || id === 'signed-subtract') {
        // The checker accepts only the least denominator; asking for any common
        // denominator would incorrectly reject equally valid larger multiples.
        assert.match(task.steps[1].prompt, /наименьший общий знаменатель/i, context);
      }
      tasks++;
    }
  }
}
console.log(JSON.stringify({ok: true, continuationSkills: continuationSkills.length, tasks, independentlyCheckedSteps: steps}));
