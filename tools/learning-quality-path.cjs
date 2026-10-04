'use strict';

// Independent pedagogical regression checks. These test the answer shown to a
// learner, rather than merely feeding the generator's numeric key back to it.
const assert = require('node:assert/strict');
const D = require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');

assert.equal(typeof D.answerText, 'function', 'Exact answer presentation is required');

const regressions = [
  ['practice-fraction-add', 0, 5, 12],
  ['practice-fraction-divide', 1, 5, 3],
  ['practice-mixture-water', 2, 4, 3],
  ['equations-fractions', 80, 1, 3]
];
for (const [id, seed, numerator, denominator] of regressions) {
  const task = D.task(id, seed), shown = D.answerText(task);
  assert(D.correct(task, shown), `${id}: the displayed answer ${shown} must be accepted`);
  assert.equal(D.parse(shown), numerator / denominator, `${id}: show the exact fraction`);
  assert(shown.includes('/'), `${id}: a recurring decimal requires exact fractional notation`);
  assert(!D.correct(task, String(Number((numerator / denominator).toFixed(6)))),
    `${id}: do not loosen correctness to accommodate a rounded display`);
}

let displayedAnswers = 0, generatedConditions = 0;
const lowDiversity = [];
for (const family of D.meta) {
  const questions = new Set(), answers = new Set();
  for (let seed = 0; seed < 240; seed++) {
    const task = D.task(family.id, seed);
    const fingerprint = JSON.stringify([task.q, task.display || null, task.labels || null, task.choices || null]);
    questions.add(fingerprint);
    answers.add(JSON.stringify(task.answer));
    generatedConditions++;
    for (const part of [task, ...task.steps]) {
      if (part.rule || (part.a === undefined && part.answer == null)) continue;
      const shown = D.answerText(part);
      assert.equal(typeof shown, 'string', `${family.id}: answer text type`);
      assert(D.correct(part, shown), `${family.id} seed ${seed}: displayed answer ${shown} is rejected for ${part.q}`);
      const expected = part.a ?? part.answer;
      if (typeof expected === 'number') {
        const parsed = D.parse(shown);
        assert(Number.isFinite(parsed), `${family.id}: nonnumeric display`);
        assert(Math.abs(parsed - expected) <= 1e-12 * Math.max(1, Math.abs(expected)),
          `${family.id}: displayed exact answer differs from the key`);
      }
      displayedAnswers++;
    }
  }
  // Coverage is reported, not silently treated as proof of mastery or as a
  // reason to rewrite legacy conditions and invalidate saved attempts.
  if (questions.size < 10) lowDiversity.push({ id: family.id, distinctConditions: questions.size, distinctAnswers: answers.size });
}

// Answer order is meaningful for matching, but not for a set of true claims.
const matching = D.task('practice-units-match', 0);
assert(!D.correct(matching, [...String(matching.answer)].reverse().join('')));
const claims = D.task('practice-logic-all', 0);
assert(D.correct(claims, [...String(claims.answer)].reverse().join('')));
assert(!D.correct(claims, String(claims.answer) + String(claims.answer)[0]));

// All admissible answers to the open digit task must work; an exemplar is not
// the unique solution. Verify the defining conditions independently.
for (const seed of [0, 1]) {
  const task = D.task('practice-digits-multiple', seed);
  let valid = 0;
  const divisor = seed === 0 ? 15 : 45;
  for (let n = 1000; n <= 9999; n++) {
    const digits = [...String(n)];
    const expected = n % divisor === 0 && new Set(digits).size === 4 && digits.every(d => Number(d) % 2 === 0);
    assert.equal(D.correct(task, String(n)), expected, `digit solution ${n}, divisor ${divisor}`);
    if (expected) valid++;
  }
  assert(valid > 1, 'The task must retain its multiple valid answers');
}

console.log(JSON.stringify({
  result: 'LEARNING_QUALITY_PATH_OK', families: D.meta.length,
  generatedConditions, displayedAnswers,
  coverageCaveat: 'Technical family coverage is not full subtype coverage or proof of mastery.',
  lowDiversity
}, null, 2));
