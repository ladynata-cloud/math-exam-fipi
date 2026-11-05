import test from 'node:test';
import assert from 'node:assert/strict';
import { answerOffline, parseNumericAttempt, validateModelAnswer } from '../src/tutor.js';
import { parseLinearEquation, checkLinearStep } from '../src/extended-math.js';

const full = (topic, question, extra = {}) => answerOffline({ topic, question, mode: 'explain', ...extra });
const valid = answer => {
  assert.equal(answer.verification, 'deterministic');
  validateModelAnswer(Object.fromEntries(['title', 'text', 'steps', 'check'].map(k => [k, answer[k]])));
};
const value = answer => {
  valid(answer);
  const text = answer.steps.findLast(s => s.includes('Ответ:')).split('Ответ: ')[1].replace(/\.$/, '').replace(/%$/, '').replace(/^x = /, '');
  const parsed = parseNumericAttempt(text); assert(parsed, text); return parsed;
};
const same = (actual, n, d = 1) => assert.equal(actual.n * BigInt(d), BigInt(n) * actual.d);

test('expanded equations handle both sides, parentheses and exact decimal/fraction coefficients', () => {
  for (const [question, answer] of [['2(x+3)=x+9', '3'], ['0,5x+2=0,25x+5', '12'],
    ['(1/2)x + 1 = 3', '4'], ['x/2+1=3', '4'], ['1/2*x + 1=3', '4'],
    ['-(x-2)=3x+6', '-1'], ['2*(3*x-1)/4=x+2', '5'], ['2(0,5x+1)=x+2', null],
    ['2x+1=2x+3', null], ['x + x = 4', '2'], ['Реши уравнение 2 · (х + 3) = х + 9.', '3']]) {
    const result = full('linear-equations', question, { attempt: answer || '' }); valid(result);
    if (answer) { assert.deepEqual(value(result), parseNumericAttempt(answer)); assert.match(result.text, /Твоё число подходит/); }
    else assert.match(result.steps.at(-1), /любое действительное число|решений нет/);
  }
});

test('1,800 parenthesized equations satisfy independent original integer substitutions', () => {
  let count = 0;
  for (const a of [-4, -2, 1, 3, 5]) for (const c of [-3, 0, 2, 4, 6]) {
    for (const b of [-5, 0, 4]) for (const d of [-7, 2, 9]) for (const divisor of [1, 2, 3, 5, 7, 10, 11, 13]) {
      // a(x+b)/divisor = c*x+d. Oracle expands using only integer arithmetic.
      const coefficient = a - c * divisor, constant = d * divisor - a * b;
      const q = `${a}(x+${b})/${divisor}=${c}x+${d}`;
      const answer = full('linear-equations', q); valid(answer);
      if (!coefficient) assert.match(answer.steps.at(-1), constant ? /решений нет/ : /любое действительное число/);
      else { const r = value(answer); assert.equal(BigInt(a) * (r.n + BigInt(b) * r.d), BigInt(divisor) * (BigInt(c) * r.n + BigInt(d) * r.d), q); }
      count++;
    }
  }
  assert.equal(count, 1800);
});

test('equivalent intermediate equalities are distinguished from changed solutions and unknown syntax', () => {
  for (const [original, step] of [['3x+5=20', '3x=15'], ['2(x+3)=x+9', '2x+6=x+9'],
    ['2(x+3)=x+9', 'x+6=9'], ['2x+2=2(x+1)', '0=0'], ['2x+1=2x+3', '0=2']]) {
    assert.match(checkLinearStep(original, step), /сохраняет решения/);
    const answer = full('linear-equations', original, { attempt: step }); assert.match(answer.text, /сохраняет решения/);
  }
  for (const [original, step] of [['3x+5=20', '3x=25'], ['2(x+3)=x+9', '2x+3=x+9'],
    ['3x+5=20', '0x=0'], ['0x=0', 'x+1=2'], ['0x=2', '0x=0']]) {
    assert.match(checkLinearStep(original, step), /изменил решения/);
  }
  for (const step of ['x^2=9', '1 2x=24', 'x/0=2', 'x=3=3', 'x=alert(1)', 'x*x=9']) {
    assert.match(checkLinearStep('3x+5=20', step), /пока не проверяю/);
  }
  assert.match(full('linear-equations', '3x+5=20', { attempt: 'x = 5' }).text, /Твоё число подходит/);
});

test('nonlinear, ambiguous, oversized and executable notation is rejected without approximation', () => {
  for (const q of ['x*x=9', 'x(x+1)=6', 'x^2=9', '1/x=2', 'x/(x+1)=2', 'x/0=2',
    '1/2x=4', '1 2x=4', '0. 5x=2', '10001x=5', 'x=1e4', 'x=NaN', 'x=Infinity',
    'x=2;process.exit()', 'sin(x)=0', 'x==2', 'x=2=2', 'x + = 2', '2 ** x=4',
    '('.repeat(12) + 'x' + ')'.repeat(12) + '=1', 'x+' + '1+'.repeat(90) + '1=2',
    'x/999999/999999=999999', 'x\n+1=2']) {
    assert.equal(parseLinearEquation(q), null, q);
  }
});

test('standard percentage questions compute whole, ratio and changed amount rather than just the part', () => {
  for (const [q, expected] of [['Найди число, 15% которого равны 36', '240'], ['12,5% числа равны 10', '80'],
    ['Сколько процентов составляет 30 от 120?', '25'], ['30 от 120 в процентах', '25'],
    ['Увеличь 240 на 15%', '276'], ['Уменьши 240 на 15%', '204'], ['Уменьши 240 на 100%', '0'],
    ['Увеличьте 1,2 на 2,5%', '123/100'], ['Уменьшите 1,2 на 2,5%', '117/100'],
    ['0% числа равны 0', null], ['0% числа равны 4', null], ['Сколько процентов составляет 3 от 0?', null]]) {
    const answer = full('percentages', q); valid(answer);
    if (expected) assert.deepEqual(value(answer), parseNumericAttempt(expected), q);
    else assert.doesNotMatch(answer.steps.join(' '), /Ответ:\s*\d/);
  }
  assert.match(full('percentages', 'Сколько процентов составляет 30 от 120?', { attempt: '25 %' }).text, /Твоё число подходит/);
  assert.doesNotMatch(full('percentages', 'Уменьши 240 на 15%', { attempt: '36' }).text, /Твоё число подходит/);
  assert.equal(full('percentages', '999999 от 0,000001 в процентах').verification, 'needs-teacher');
});

test('720 percentage cases agree with independent rational formulas', () => {
  let count = 0;
  for (const base of [1, 7, 12, 31, 80, 240, 1000, -20, -7]) for (const p of [1, 2, 5, 12, 25, 50, 100, 150, 200, 999]) {
    for (const sign of [1, -1]) {
      same(value(full('percentages', `${sign > 0 ? 'Увеличь' : 'Уменьши'} ${base} на ${p}%`)), base * (100 + sign * p), 100); count++;
    }
    same(value(full('percentages', `${p}% числа равны ${base}`)), base * 100, p); count++;
    same(value(full('percentages', `${base} от ${p} в процентах`)), base * 100, p); count++;
  }
  // Repeat with exact tenths, using integer oracles rather than floating point.
  for (const n of [1, 2, 3, 7, 12, 25, 49, 99, 123]) for (const p of [1, 2, 5, 12, 25, 50, 100, 150, 200, 999]) {
    const dec = `${Math.floor(n / 10)},${n % 10}`;
    for (const sign of [1, -1]) { same(value(full('percentages', `${sign > 0 ? 'Увеличь' : 'Уменьши'} ${dec} на ${p}%`)), n * (100 + sign * p), 1000); count++; }
    same(value(full('percentages', `${p}% числа равны ${dec}`)), n * 10, p); count++;
    same(value(full('percentages', `${dec} от ${p} в процентах`)), n * 10, p); count++;
  }
  assert.equal(count, 720);
});

test('all new families retain one hint and an explicit bounded full explanation', () => {
  for (const [topic, question] of [['linear-equations', '2(x+3)=x+9'], ['linear-equations', '2x+1=2x+3'],
    ['percentages', '15% числа равны 36'], ['percentages', '30 от 120 в процентах'],
    ['percentages', 'Увеличь 240 на 15%'], ['percentages', 'Уменьши 240 на 15%'], ['percentages', '0% числа равны 4']]) {
    for (const simpler of [false, true]) for (let hintLevel = 1; hintLevel <= 5; hintLevel++) {
      const answer = answerOffline({ topic, question, simpler, hintLevel }); valid(answer);
      assert.equal(answer.steps.length, 1); assert.equal(answer.complete, false); assert.doesNotMatch(answer.steps[0], /Ответ:/);
    }
    const answer = full(topic, question); valid(answer); assert.equal(answer.complete, true); assert(answer.steps.length <= 5);
  }
});
