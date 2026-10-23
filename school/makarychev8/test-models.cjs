'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('./models.js').math;

test('rational cancellation retains the excluded value even though simplified expression exists', () => {
  assert.deepEqual(M.rational(2, 2), { defined: false, value: null });
  for (let a = 1; a <= 5; a++) for (let x = -6; x <= 6; x += 0.5) {
    const r = M.rational(x, a);
    if (x !== a) { assert.ok(r.defined); assert.equal(r.value, x + a); }
    else assert.equal(r.defined, false);
  }
  assert.equal(M.rational(NaN, 2).defined, false);
});

test('arithmetic roots are nonnegative and negative radicands have no real value', () => {
  assert.equal(M.rootValue(-1), null);
  assert.equal(M.rootValue(0), 0);
  assert.equal(M.rootValue(25), 5);
  for (let a = -10; a <= 10; a++) assert.equal(M.rootValue(a * a), Math.abs(a));
  assert.equal(M.rootValue(Infinity), null);
});

test('quadratic discriminant distinguishes two, one and no roots', () => {
  assert.deepEqual(M.quadratic(1, -2, -3), { type: 'quadratic', d: 16, roots: [-1, 3] });
  assert.deepEqual(M.quadratic(1, -4, 4), { type: 'quadratic', d: 0, roots: [2] });
  assert.deepEqual(M.quadratic(1, 0, 1), { type: 'quadratic', d: -4, roots: [] });
  const q = M.quadratic(-2, 1, 4);
  q.roots.forEach(x => assert.ok(Math.abs(-2 * x * x + x + 4) < 1e-10));
});

test('a = 0 is classified as linear, contradiction, or identity', () => {
  assert.deepEqual(M.quadratic(0, 2, -6), { type: 'linear', roots: [3] });
  assert.deepEqual(M.quadratic(0, 0, 2), { type: 'none', roots: [] });
  assert.deepEqual(M.quadratic(0, 0, 0), { type: 'all', roots: [] });
  assert.deepEqual(M.quadratic(NaN, 0, 0), { type: 'invalid', roots: [] });
});

test('negative multiplication reverses strict and inclusive rays; zero is rejected', () => {
  assert.deepEqual(M.scaledInequality(2, -3, false), { boundary: -6, direction: 'right', sign: '>' });
  assert.deepEqual(M.scaledInequality(-4, -2, true), { boundary: 8, direction: 'right', sign: '≥' });
  assert.deepEqual(M.scaledInequality(2, 3, true), { boundary: 6, direction: 'left', sign: '≤' });
  assert.equal(M.scaledInequality(2, 0, false), null);
  for (const multiplier of [-4, -1, 1, 4]) for (const x of [-5, 0, 2, 6]) {
    const r = M.scaledInequality(2, multiplier, false);
    assert.equal(x < 2, r.direction === 'left' ? multiplier * x < r.boundary : multiplier * x > r.boundary);
  }
});

test('function domains preserve forbidden zero even with zero numerator', () => {
  assert.equal(M.functionValue('hyperbola', 0, 0, 0), null);
  assert.equal(M.functionValue('hyperbola', -2, 0, 0), 0);
  assert.equal(M.functionValue('sqrt', -0.5, 2, 0), null);
  assert.equal(M.functionValue('sqrt', 0, 2, 0), 0);
  assert.equal(M.functionValue('inverse-square', 0, 0, 0), null);
  assert.equal(M.functionValue('inverse-square', -2, 0, 0), 0.25);
});

test('floor uses greatest integer below x, including negative inputs', () => {
  assert.equal(M.functionValue('floor', -1.5, 0, 0), -2);
  assert.equal(M.functionValue('floor', -2, 0, 0), -2);
  assert.equal(M.functionValue('floor', 1.5, 0, 0), 1);
});

test('scientific notation mantissa and exponent reconstruct large and small numbers', () => {
  assert.equal(M.scientific(0), null);
  assert.equal(M.scientific(Infinity), null);
  for (const value of [1e-6, 0.0032, 1, 9.9, 10, 320000, 1000000]) {
    const s = M.scientific(value);
    assert.ok(s.mantissa >= 1 && s.mantissa < 10);
    assert.ok(Math.abs(s.mantissa * Math.pow(10, s.exponent) / value - 1) < 1e-12);
  }
});
