import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTask, inferTopic, ambiguity, understanding } from '../public/study-tools.js';
import { checkSolutionLines } from '../src/solution-lines.js';
import { answerOffline } from '../src/tutor.js';

test('bounded Russian phrasings preserve operands and do not guess unknown topics', () => {
  for (const q of ['Вычисли: 1/2 + 1/3', 'Посчитайте 1/2 + 1/3.', 'Найдите значение выражения 1/2 + 1/3']) assert.equal(normalizeTask(q), '1/2 + 1/3');
  assert.equal(normalizeTask('Реши уравнение: 3x + 5 = 20'), '3x + 5 = 20');
  assert.equal(inferTopic('Найди корень уравнения 3x=9'), 'linear-equations');
  assert.equal(inferTopic('sqrt(unknown)'), null);
  assert.equal(normalizeTask('1 2/3 + 1/3'), '1 2/3 + 1/3');
  const a = ambiguity('12x + 1 0 = 22', 'linear-equations'); assert.equal('12x + 1 0 = 22'.slice(a.start, a.end), '1 0');
  assert.equal(ambiguity('1 1/2 + 1/3', 'fractions'), null);
  assert.equal(understanding('unknown'), null);
});
test('line checking rejects first non-equivalent transition and leaves later lines unchecked', () => {
  assert.equal(checkSolutionLines('3x+5=20', '3x=15\nx=5').status, 'correct');
  const bad = checkSolutionLines('3x+5=20', '3x=15\nx=15\nx=5');
  assert.equal(bad.status, 'incorrect'); assert.deepEqual(bad.lines, [{ line: 1, status: 'correct' }, { line: 2, status: 'incorrect' }]);
  assert.equal(checkSolutionLines('x=x', '0x=0').status, 'correct');
  assert.equal(checkSolutionLines('x=x', 'x=0').status, 'incorrect');
  assert.equal(checkSolutionLines('x=x+1', '0x=1').status, 'correct');
  assert.equal(checkSolutionLines('3x=9', 'divide by 3').status, 'unsupported');
  assert.equal(checkSolutionLines('3x=9', Array(7).fill('x=3').join('\n')).status, 'unsupported');
});
test('line checker agrees with independent integer affine construction for 240 transitions', () => {
  let count = 0;
  for (const a of [-5, -2, 1, 4]) for (const x of [-7, -1, 0, 2, 9]) for (const b of [-3, 0, 8]) for (const factor of [-3, -1, 2, 5]) {
    const q = `${a}x+(${b})=${a*x+b}`;
    const next = `${a*factor}x+(${b*factor})=${(a*x+b)*factor}`;
    assert.equal(checkSolutionLines(q, next).status, 'correct');
    assert.equal(checkSolutionLines(q, `${a*factor}x+(${b*factor})=${(a*x+b)*factor+1}`).status, 'incorrect'); count++;
  }
  assert.equal(count, 240);
});
test('attempt status comes from exact mathematics, not prose, and distinguishes a step from an answer', () => {
  const q = { topic: 'linear-equations', question: '3x+5=20', mode: 'hint', hintLevel: 1 };
  assert.equal(answerOffline({ ...q, attempt: '5' }).attemptStatus, 'correct');
  assert.equal(answerOffline({ ...q, attempt: '6' }).attemptStatus, 'incorrect');
  assert.equal(answerOffline({ ...q, attempt: 'не знаю' }).attemptStatus, 'unsupported');
  assert.equal(answerOffline({ ...q, attempt: '3x=15\nx=5' }).attemptKind, 'step');
  assert.equal(answerOffline({ ...q, attempt: '3x=15\nx=15' }).lineChecks[1].status, 'incorrect');
  const r = answerOffline({ topic: 'fractions', question: 'Вычисли: 1/2+1/3', attempt: '5/6', mode: 'hint' });
  assert.equal(r.attemptStatus, 'correct');
});
