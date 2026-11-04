'use strict';
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {corrections, restoreHistoricalBytes} = require('./oge-book-corrections.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
const negativeFile = 'trainers/oge-basics/negative-number-line.html';
const percentFile = 'trainers/oge-basics/percentages/percent-change.html';
const bankFile = 'trainers/oge-basics/learning-bank.js';
const bank = require('../trainers/oge-basics/learning-bank.js');
const functionSource = (file, name) => {
  const matches = [...read(file).matchAll(new RegExp('function ' + name + '\\(\\)\\{[\\s\\S]*?\\n\\}', 'g'))];
  assert.equal(matches.length, 1, file + ': one complete ' + name + ' function');
  return matches[0][0];
};
function evaluate(source, name, random, extras = {}) {
  const math = Object.create(Math); math.random = random;
  return vm.runInNewContext(source + ';' + name + '()', {Math:math, ...extras}, {timeout:1000});
}
function seeded(seed) {
  let n = seed >>> 0;
  return () => {n = (Math.imul(1664525, n) + 1013904223) >>> 0; return n / 4294967296;};
}
function assertComparison(task) {
  assert.equal(task.kind, 'choice');
  const values = task.options.map(option => Number(option.html));
  assert(values.every(Number.isInteger));
  assert.equal(new Set(values).size, 2, 'a greater-number question must offer two different numbers');
  assert.equal(Number(task.options.find(option => option.id === task.answer).html), Math.max(...values));
  assert.match(task.prompt, /Какое число больше/);
}

test('negative comparison has distinct choices for every input pair and the reported seed 21', () => {
  const source = functionSource(negativeFile, 'makePracticeTask');
  const seed21 = evaluate(source, 'makePracticeTask', seeded(21));
  assertComparison(seed21);
  assert.equal(Number(seed21.options[0].html), -6, 'same first number as the reproduced UI failure');
  for (let a = -9; a <= 9; a++) for (let b = -9; b <= 9; b++) {
    const replacement = a === 9 ? -9 : a + 1;
    const stream = [0, (a + 9 + .1) / 19, (b + 9 + .1) / 19, (replacement + 9 + .1) / 19];
    const task = evaluate(source, 'makePracticeTask', () => {
      assert(stream.length, 'comparison must terminate after a different number is drawn');
      return stream.shift();
    });
    assertComparison(task);
    assert.equal(Number(task.options[0].html), a);
    assert.equal(Number(task.options[1].html), a === b ? replacement : b);
  }
  let comparisons = 0;
  for (let seed = 0; seed < 1000; seed++) {
    const task = bank['negative-number-line']((seed * 2654435761) >>> 0).task;
    if (task.skill === 'compare') {assertComparison(task); comparisons++;}
  }
  assert(comparisons > 100, 'the generated remediation bank also exercises comparisons');
});

test('every listed percentage increase/decrease has a true worked equation', () => {
  const source = functionSource(percentFile, 'taskMeaning');
  const percentages = [110,115,120,125,140,150,160,180,90,85,80,75,60,45];
  for (const p of percentages) for (const back of [false,true]) {
    const task = evaluate(source, 'taskMeaning', () => back ? .25 : .75,
      {pick: () => p, r2: n => Math.round(n * 100) / 100});
    const plain = task.solution.replace(/<[^>]*>/g, '');
    assert.equal(task.answer, back ? p : Math.abs(p - 100));
    if (!back) {
      const m = plain.match(/Разница (\d+) − (\d+) = (\d+)%/);
      assert(m, plain);
      assert.equal(Number(m[1]) - Number(m[2]), Number(m[3]), plain);
      assert.equal(Number(m[3]), Math.abs(p - 100));
    } else {
      const m = plain.match(/100% ([+−]) (\d+)% = (\d+)%/);
      assert(m, plain);
      assert.equal(100 + (m[1] === '+' ? 1 : -1) * Number(m[2]), p, plain);
    }
  }
});

test('generated remediation bank remains byte-for-byte reproducible from trainer sources', () => {
  const result = execFileSync(process.execPath, ['tools/learning-remediation-bank.cjs', '--check'],
    {cwd:root, encoding:'utf8'});
  assert.match(result, /35 source trainers/);
});

test('preservation normalization rejects rollback, duplicates and any unrelated bank change', () => {
  const baseline = JSON.parse(read('docs/tasks/OGE_BASICS_CONTEXTUAL_ROUTES.json'));
  const source = read(bankFile), expected = baseline.unchangedContent[bankFile];
  const preserved = value => assert.equal(sha(restoreHistoricalBytes(bankFile, value)), expected);
  preserved(source);
  for (const {before, after} of Object.values(corrections)) {
    assert.throws(() => preserved(source.replace(after, before)), {name:'AssertionError'});
    assert.throws(() => preserved(source.replace(after, after + after)), {name:'AssertionError'});
    assert.throws(() => preserved(source.replace(after, after + '/* extra change */')), {name:'AssertionError'});
  }
  assert.throws(() => preserved(source + '\n// unrelated edit\n'), {name:'AssertionError'});
  for (const [file, expectedSha] of Object.entries(baseline.unchangedContent)) {
    if (file === bankFile) continue;
    assert.equal(sha(read(file)), expectedSha, file + ': all five other engines remain strictly unchanged');
  }
});
