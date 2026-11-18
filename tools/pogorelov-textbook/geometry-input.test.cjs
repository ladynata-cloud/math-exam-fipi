'use strict';
const assert = require('node:assert/strict');
const companion = require('../../geometry-pogorelov/textbook/core.js');
const pogorelov = require('../../geometry-pogorelov/assets/tasks.js');
const merzlyak = require('../../geometry-merzlyak/assets/tasks.js');

const atlas = (name, api) => ({
  name,
  read: raw => api.number(raw),
  accepts: (raw, value) => api.equal(raw, value)
});
const validators = [
  atlas('Погорелов', pogorelov),
  atlas('Мерзляк', merzlyak),
  {name: 'Задачник', read: companion.parse, accepts: (raw, value) => companion.check(raw, {value})}
];
const valid = [
  ['3 / 4 π', 3*Math.PI/4], ['3/(4π)', 3/(4*Math.PI)], ['2·π²', 2*Math.PI**2],
  ['3√2', 3*Math.sqrt(2)], ['√(1+(2+1))', 2], ['√9²', 9], ['sqrt((−3)^2)', 3],
  ['(2+1)(3−1)', 6], ['3×2÷4', 1.5], ['3:2', 1.5], ['0,5', 0.5],
  ['2^-2', 0.25], ['2^3^2', 512], ['-2^2', -4], ['(-2)^2', 4],
  ['1 1/2', 1.5], ['−2 3/4', -2.75], ['35 200/2', 17600], ['0^2', 0], ['(-π)^0', 1], ['35 200', 35200], ['12\u202f345,5', 12345.5]
];
const undefinedForms = [
  '1/(1/0)', 'sqrt(-1)^0', '(0/0)^0', '0^0', '(0^-2)^0', '((-1)^0.5)^0',
  '((1/0)-(1/0))^0', '1/(((10^12)^12)^12)', '1..2', '2 3', '1 3/2', '1 234/567', '1.0 125', 's q r t(4)'
];
for (const {name, read, accepts} of validators) {
  for (const [raw, expected] of valid) {
    assert.ok(Math.abs(read(raw) - expected) < 1e-9, name + ' ' + raw);
    assert.ok(accepts(raw, expected), name + ' ' + raw);
  }
  for (const raw of undefinedForms) {
    let value = NaN;
    try { value = read(raw); } catch { /* Atlas parsers report invalid input by throwing. */ }
    assert.ok(Number.isNaN(value), name + ' invalid ' + raw);
    for (const expected of [0, 1, 2, 5.5, 23]) {
      assert.equal(accepts(raw, expected), false, name + ' ' + raw + ' ≠ ' + expected);
    }
  }
}
for (const api of [merzlyak, pogorelov]) {
  assert.equal(api.equal('1/(1/0);2', [0, 2]), false);
  assert.equal(api.equal('2π; √9', [2*Math.PI, 3]), true);
  assert.equal(api.equal("F'", 'F'), false);
  assert.equal(api.equal("A'B", 'A′B'), true);
}
const saved = {schema: 1, checked: true, drafts: ['sqrt(-1)^0'], done: 1,
  stepDrafts: ['1/(1/0)'], notes: 'Моё построение'};
const restored = companion.restore(JSON.stringify(saved), {answers: [{value: 1}], steps: [{value: 0}]});
assert.equal(restored.checked, false);
assert.equal(restored.done, 0);
assert.deepEqual(restored.drafts, saved.drafts);
assert.equal(restored.notes, saved.notes);
console.log('Geometry answer inputs passed for both atlases and the textbook companion.');
