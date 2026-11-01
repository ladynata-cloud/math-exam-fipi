import test from 'node:test';
import assert from 'node:assert/strict';
import { listCabinetProfiles, prepareCabinetQuestion, answerCabinetOffline, buildCabinetMessages } from '../src/cabinet-topics.js';
import { validateModelAnswer } from '../src/tutor.js';

function bundle(topic, question, extra = {}) {
  return prepareCabinetQuestion({ profileId: 'vilenkin-grade6', topic, question, mode: 'full', hintLevel: 1, ...extra });
}
function answer(topic, question, extra) {
  const { input, cards } = bundle(topic, question, extra);
  return answerCabinetOffline(input, cards);
}
function value(result) {
  assert.equal(result.verification, 'deterministic');
  const final = result.steps.find(step => step.startsWith('Ответ: '));
  assert.ok(final);
  return Number(final.match(/= (\d+)\.$/)[1]);
}

test('Vilenkin profile uses existing course and both trainers, with no personal identity', () => {
  const profile = listCabinetProfiles().find(row => row.id === 'vilenkin-grade6');
  assert.deepEqual(profile.topics.map(topic => topic.id), ['divisibility-gcd', 'divisibility-lcm']);
  assert.equal(profile.links.length, 3);
  assert.throws(() => bundle('decimal-divide', '3,6 : 0,12'));
  for (const topic of profile.topics) {
    const { input, cards } = bundle(topic.id, topic.example);
    const result = answerCabinetOffline(input, cards);
    validateModelAnswer(Object.fromEntries(['title', 'text', 'steps', 'check'].map(key => [key, result[key]])));
    assert.match(buildCabinetMessages(input, cards)[1].content, /divisibility-/);
    assert.equal(result.sources[0].id, 'cabinet-' + topic.id);
  }
});

test('gcd/lcm checked against independent enumeration for all pairs 1–20', () => {
  for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) {
    let divisor = 1;
    for (let d = 1; d <= Math.min(a, b); d++) if (a % d === 0 && b % d === 0) divisor = d;
    let multiple = Math.max(a, b);
    while (multiple % a || multiple % b) multiple++;
    assert.equal(value(answer('divisibility-gcd', `НОД ${a} и ${b}`)), divisor);
    assert.equal(value(answer('divisibility-lcm', `НОК ${a} и ${b}`)), multiple);
  }
});

test('repeated factors, coprimes, ones and large exact results remain correct', () => {
  for (const [a, b, divisor, multiple] of [[24,36,12,72], [8,12,4,24], [13,17,1,221], [1,1,1,1], [1,97,1,97], [999999,999998,1,999997000002]]) {
    assert.equal(value(answer('divisibility-gcd', `Найдите НОД(${a}; ${b}).`)), divisor);
    assert.equal(value(answer('divisibility-lcm', `НОК(${a},${b})`)), multiple);
  }
  assert.match(answer('divisibility-lcm', 'НОК 8 и 12').steps[1], /2 · 2 · 2 · 3/);
  assert.match(answer('divisibility-gcd', 'НОД 13 и 17').steps[1], /нет/);
});

test('hint progression does not reveal final result; full solution is explicit', () => {
  for (const topic of ['divisibility-gcd', 'divisibility-lcm']) {
    const question = topic.endsWith('gcd') ? 'НОД 24 и 36' : 'НОК 24 и 36';
    for (const simpler of [false, true]) for (let hintLevel = 1; hintLevel <= 8; hintLevel++) {
      const result = answer(topic, question, { mode: 'hint', hintLevel, simpler });
      assert.equal(result.steps.length, 1);
      assert.equal(result.complete, false);
      assert.doesNotMatch(result.steps.join(' '), /Ответ:|= 12|= 72/);
    }
  }
  assert.match(answer('divisibility-gcd', 'НОД 24 и 36', { attempt: '12' }).text, /подходит/);
  assert.match(answer('divisibility-gcd', 'НОД 24 и 36', { attempt: '6' }).text, /другое число/);
});

test('invalid, mismatched and unsupported numeric tasks are never labelled checked', () => {
  for (const question of ['НОД 0 и 12', 'НОД -4 и 12', 'НОД 1,5 и 12', 'НОД 12 и 18 и 24', 'НОД 1000000 и 2', 'НОК 12 и 18', 'Задача 12: найди НОД']) {
    assert.equal(answer('divisibility-gcd', question).verification, 'needs-teacher', question);
  }
  assert.equal(answer('divisibility-lcm', 'НОД 12 и 18').verification, 'needs-teacher');
  assert.equal(answer('divisibility-lcm', 'Что такое НОК?').verification, 'curated-guidance');
  assert.equal(answer('divisibility-gcd', 'Как найти НОД?').verification, 'curated-guidance');
});
