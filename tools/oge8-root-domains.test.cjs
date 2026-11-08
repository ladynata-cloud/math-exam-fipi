'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../trainers/oge-task8-powers-roots.html'), 'utf8');
const learn = source.slice(source.indexOf('function buildLearn(){'), source.indexOf('/* --- лесенка --- */'));

test('teaching section places domain conditions beside the corresponding root identities', () => {
  assert.match(learn, /a<sup>n\/2<\/sup>.*?при a ≥ 0 и натуральном n/);
  assert.match(learn, /rt\("a"\).*?rt\("b"\).*?rt\("ab"\).*?при a ≥ 0 и b ≥ 0/);
  assert.match(learn, /Для дроби.*?rt\(fr\("a","b"\)\).*?при a ≥ 0 и b &gt; 0/);
});

test('the conditions exclude real-domain counterexamples and allow boundary cases', () => {
  assert.equal(Math.sqrt((-1) * (-1)), 1);
  assert.ok(Number.isNaN(Math.sqrt(-1)));
  assert.equal(Math.sqrt(0) * Math.sqrt(4), Math.sqrt(0 * 4));
  assert.equal(Math.sqrt(0) / Math.sqrt(4), Math.sqrt(0 / 4));
  assert.ok(Number.isNaN(Math.sqrt(1) / Math.sqrt(0) - Math.sqrt(1 / 0)));
  for (const a of [0, 1, 4, 9]) for (const n of [1, 2, 3, 4]) {
    assert.equal(Math.sqrt(a ** n), a ** (n / 2));
  }
});
