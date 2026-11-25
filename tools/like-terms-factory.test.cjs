'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { check } = require('../trainers/like-terms-factory-math.js');

function expect(status, input, expected, form) {
  assert.equal(check(input, expected, form).status, status, input + ' against ' + expected);
}

test('integer monomials, keyboard notation, commutativity and order', () => {
  for (const input of ['4ba - a', '−а + 4·bа', '-a+4*b*a', '-a+4×ab']) {
    expect('correct', input, '4ab−a');
  }
  for (const square of ['х²', 'х^2', 'x2', 'x**2']) {
    expect('correct', '3x - 2' + square, '-2x²+3x');
  }
  expect('correct', 'у³x+2', '2+xy^3');
  expect('correct', '-1x', '-x');
  expect('correct', '0', '0');
  expect('correct', '0', 'x-x');
  expect('wrong', 'x+y', 'xy');
  expect('wrong', '3x', '3x²');
  expect('wrong', '7x', '2x+5y');
  expect('wrong', 'x(x-1)(x+1)', '0'); // Coincides at -1, 0 and 1.
});

test('equivalent but unfinished sums and untouched brackets', () => {
  for (const input of ['x+2x', '3x+0', '4x−x', '0y+3x', '1*3x']) {
    expect('collect', input, '3x');
  }
  expect('collect', '0x', '0');
  expect('collect', 'xy−yx', '0');
  expect('collect', '0xy+4x', '4x');
  expect('expand', '-(x - 5)+3x', '2x+5');
  expect('expand', '2(3x - y)−(x−2y)', '5x');
  expect('expand', '(a + b)(b−a)', 'b²−a²');
  expect('wrong', '−(x+5)+3x', '2x+5');
  expect('wrong', '3(x+2)', '3x+2');
  expect('wrong', '0', 'x');
});

test('expanded line retains the signed terms of every group', () => {
  const target = '6x - 9 + x';
  for (const input of ['x−9+6x', '6*x+x-9', '-9 + 6x + x']) {
    expect('correct', input, target, 'expanded');
  }
  for (const input of ['7x-9', '5x - 9 + 2x', '6x−9+x+0']) {
    expect('terms', input, target, 'expanded');
  }
  expect('multiply', '2a+2*3-a', '2a+6-a', 'expanded');
  expect('multiply', '4a+4*2a-a', '4a+8a-a', 'expanded');
  expect('multiply', '4a+2a*4-a', '4a+8a-a', 'expanded');
  expect('correct', '4*a+8*a-a', '4a+8a-a', 'expanded');
  expect('expand', '3(2x−3)+x', target, 'expanded');
  expect('wrong', '6x−3+x', target, 'expanded');
  expect('correct', 'yx+2xy-xy', '2yx−xy+xy', 'expanded');
  expect('correct', 'x-x', '−x+x', 'expanded');
  expect('terms', '0', '−x+x', 'expanded');
});

test('syntax must consume the entire expression', () => {
  expect('empty', ' \t', 'x');
  for (const input of [
    '-', '*', '^2', 'a+', 'x++y', '2 3x', '2*', 'x/', 'x/y', '0.5x', '2x=2',
    '()', '(x', 'x)', 'x(+)', 'x^^2', 'x⁻²', 'x^200', '2x^2^3', 'NaN!', 'x[]',
    '2;;x', 'x'.repeat(241), '(x+y)'.repeat(12)
  ]) {
    expect('syntax', input, 'x');
  }
  expect('wrong', '9007199254740993x', '9007199254740992x');
  expect('collect', '9007199254740993x−9007199254740992x', 'x');
});

test('distribution of every sign combination with reordered constants and terms', () => {
  for (const k of [-3, -1, 1, 3]) {
    for (const a of [-2, 2]) {
      for (const b of [-4, 4]) {
        const signed = n => n >= 0 ? '+' + n : String(n);
        const original = k + '(' + a + 'x' + signed(b) + ')-x';
        const expanded = k * b + signed(k * a) + 'x-x';
        const result = (k * a - 1) + 'x' + signed(k * b);
        expect('expand', original, result);
        expect('correct', expanded, original, 'expanded');
        expect('correct', result, original);
        expect('wrong', (k * a - 1) + 'x' + signed(1 + k * b), original);
      }
    }
  }
});
