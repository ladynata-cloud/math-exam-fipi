import test from 'node:test';
import assert from 'node:assert/strict';
import { answerOffline, parseNumericAttempt, validateModelAnswer } from '../src/tutor.js';
import { answerCabinetOffline, prepareCabinetQuestion } from '../src/cabinet-topics.js';
import { containsSensitiveText } from '../src/privacy.js';

const plain = (question, extra = {}) => answerOffline({ topic: 'fractions', question, ...extra });
const cabinet = (question, attempt, topic = 'decimal-divide') => {
  const prepared = prepareCabinetQuestion({ profileId: 'peterson-decimals', topic, question, attempt, mode: 'full' });
  return answerCabinetOffline(prepared.input, prepared.cards);
};
const valid = answer => {
  validateModelAnswer(Object.fromEntries(['title', 'text', 'steps', 'check'].map(k => [k, answer[k]])));
  assert.equal(answer.verification, 'deterministic');
};
const result = answer => {
  valid(answer);
  const line = answer.steps.findLast(step => /Ответ:/.test(step));
  assert(line);
  const [n, d = '1'] = line.split('Ответ: ')[1].replace(/\.$/, '').split('/');
  return { n: BigInt(n), d: BigInt(d) };
};

test('mixed operands keep their meaning and negative signs through full explanations', () => {
  for (const [question, expected] of [
    ['1 1/2 + 1/2', '2'], ['-1 1/2 + 1/2', '-1'], ['2 - -1 1/2', '7/2'],
    ['-0 1/2 - -0 1/3', '-1/6'], ['1 0/2 + 1', '2'], ['2 + 3', '5'],
    ['Вычисли − 1\u00a01 / 2 + 2\u202f1/2.', '1'], ['1\t1/2-1\t1/2', '0'],
    ['10000 9999/10000 + 0/1', '100009999/10000'], ['10000/1 - 10000/1', '0']
  ]) {
    const answer = plain(question, { mode: 'explain', attempt: expected });
    assert.deepEqual(result(answer), parseNumericAttempt(expected), question);
    assert.match(answer.text, /Твоё число подходит/, question);
  }
  assert.doesNotMatch(plain('1 1/2 + 1/2', { attempt: '6' }).text, /Твоё число подходит/);
  assert.match(plain('-1 1/2 + 1/2', { mode: 'explain' }).steps[0], /-\(1 · 2 \+ 1\) \/ 2 = -3\/2/);
});

test('1,152 signed mixed expressions agree with an independent rational oracle', () => {
  let count = 0;
  for (let wholeA = 0; wholeA <= 3; wholeA++) for (let wholeB = 0; wholeB <= 2; wholeB++) {
    for (const da of [2, 3, 5, 7]) for (const db of [2, 3, 5]) {
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) for (const op of ['+', '-']) {
        const na = da - 1, nb = 1;
        const a = sa * (wholeA * da + na), b = sb * (wholeB * db + nb);
        const question = `${sa < 0 ? '-' : ''}${wholeA} ${na}/${da} ${op} ${sb < 0 ? '-' : ''}${wholeB} ${nb}/${db}`;
        const answer = plain(question, { mode: 'explain' });
        const actual = result(answer), expected = a * db + (op === '+' ? 1 : -1) * b * da;
        assert.equal(actual.n * BigInt(da * db), BigInt(expected) * actual.d, question);
        assert.equal(answer.steps.length, 5); count++;
      }
    }
  }
  assert.equal(count, 1152);
});

test('malformed operands and unsupported expressions are not repaired into other questions', () => {
  for (const question of ['1 2 + 3', '1/2 + 1 2', '1/2 + 1/2 3', '1 2/2 + 1/2', '1 3/2 + 1/2',
    '1 1/0 + 1/2', '1 1/-2 + 1/2', '1 -1/2 + 1/2', '1/2 + 1/3 + 1/4', '1,5 + 1/2', '1,(3) + 1/2', '1\n1/2 + 1/2', '1/2\n+1/2',
    '1 2/3 4 + 1/2', '10001/1 + 1/2', '10001 1/2 + 1/2', '1 1/10001 + 1/2',
    '1/2 + 1/2 = 1', '1/2 + 1/2 рублей']) {
    const answer = plain(question, { attempt: '6', mode: 'explain' });
    assert.equal(answer.verification, 'needs-teacher', question);
    assert.equal(answer.complete, false);
    assert.doesNotMatch(answer.text, /Твоё число подходит|Похоже/);
  }
});

test('ambiguous equations request a notation correction while operator spacing remains supported', () => {
  for (const question of ['1 2x + 5 = 29', '3x + 1 2 = 18', '3x + 5 = 2 0', '1\u00a02x = 24',
    '1\t2x = 24', '1\n2x = 24', '1\u202f2x = 24']) {
    for (const mode of ['hint', 'explain']) {
      const answer = answerOffline({ topic: 'linear-equations', question, attempt: '2', mode });
      assert.equal(answer.verification, 'needs-teacher', question);
      assert.equal(answer.complete, false); assert.equal(answer.steps.length, 1);
      assert.match(answer.text, /цифры одного числа пиши подряд/);
      assert.doesNotMatch(answer.text, /Твоё число подходит|Похоже/);
    }
  }
  for (const question of ['12x + 5 = 29', '12 x + 5 = 29', '12 · х + 5 = 29', 'Реши уравнение 12 * x + 5 = 29.']) {
    const answer = answerOffline({ topic: 'linear-equations', question, attempt: '2' });
    valid(answer); assert.match(answer.text, /Твоё число подходит/, question);
  }
});

// Independent long division constructs notation from a rational value. It does
// not use the parser formula, cabinet formatter or floating-point approximation.
function longDivision(numerator, denominator) {
  const negative = numerator < 0, n = Math.abs(numerator);
  const whole = Math.floor(n / denominator), seen = new Map(), digits = [];
  let remainder = n % denominator;
  while (remainder && !seen.has(remainder)) {
    seen.set(remainder, digits.length); remainder *= 10;
    digits.push(Math.floor(remainder / denominator)); remainder %= denominator;
  }
  if (!remainder) return null;
  const start = seen.get(remainder);
  return `${negative ? '-' : ''}${whole},${digits.slice(0, start).join('')}(${digits.slice(start).join('')})`;
}

test('repeating answers match independent long division and preserve cabinet privacy filtering', () => {
  let count = 0, checkedCabinet = 0, rejectedByPrivacy = 0;
  for (let n = -20; n <= 20; n++) for (let d = 2; d <= 40; d++) {
    const notation = longDivision(n, d);
    if (!notation) continue;
    const value = parseNumericAttempt(notation);
    assert.equal(value.n * BigInt(d), BigInt(n) * value.d, notation);
    const answers = [plain(`${n}/${d} + 0/1`, { attempt: notation })];
    // The existing public/cabinet privacy filter rejects long digit runs even
    // when they are a mathematical period. Keep that boundary; do not weaken it
    // merely to make a parser test pass. Use an ordinary fraction in the UI.
    if (containsSensitiveText(notation)) {
      assert.throws(() => cabinet(`${n} : ${d}`, notation), error => error.code === 'PERSONAL_DATA_REJECTED');
      rejectedByPrivacy++;
    } else {
      answers.push(cabinet(`${n} : ${d}`, notation)); checkedCabinet++;
    }
    for (const answer of answers) {
      valid(answer); assert.match(answer.text, /Твоё число подходит/, notation);
    }
    count++;
  }
  assert.equal(count, 1044);
  assert.equal(checkedCabinet, 754); assert.equal(rejectedByPrivacy, 290);
});

test('period notation covers zeros, nines, prefixes and strict length/token boundaries', () => {
  for (const [value, n, d] of [['0,(3)', 1n, 3n], ['0.1(6)', 1n, 6n], ['0,(9)', 1n, 1n],
    ['-0,(9)', -1n, 1n], ['1,2(9)', 13n, 10n], ['0,0(0)', 0n, 1n], ['-0,0(0)', 0n, 1n],
    ['0,(33)', 1n, 3n], ['Ответ: х = − 0,58(3)', -7n, 12n], ['000,00(03)', 1n, 3300n]]) {
    assert.deepEqual(parseNumericAttempt(value), { n, d }, value);
  }
  for (const value of ['0,(3 3)', '0, (3)', '0,( 3)', '0,(3 )', '0,(3)(3)', '0,()', '0(3)',
    '0,1(6)7', '0,1(6', '0,1(6))', '0,1(6\n)', '0,1(6)/2', '0,1(6)+1', '1 0,(3)',
    '0,12(3) руб', `0,(${'3'.repeat(65)})`, `0,1(${'3'.repeat(64)})`, '1000000000000,(3)']) {
    assert.equal(parseNumericAttempt(value), null, value);
  }
  assert(parseNumericAttempt(`0,(${'3'.repeat(64)})`));
  assert(parseNumericAttempt(`999999999999,${'0'.repeat(63)}(3)`));
  assert.equal(parseNumericAttempt('0,0000001'), null);
  assert.doesNotMatch(cabinet('1 : 3', '0,333333').text, /Твоё число подходит/);
  assert.match(cabinet('Переведи 7/12 в десятичную дробь', '0,58(3)', 'decimal-fractions').text, /Твоё число подходит/);
});

test('mixed arithmetic keeps one hint per request and explanation is explicit', () => {
  for (const question of ['1 1/2 + 1/2', '-1 1/2 - -2 1/3']) {
    for (const simpler of [false, true]) for (let hintLevel = 1; hintLevel <= 5; hintLevel++) {
      const answer = plain(question, { simpler, hintLevel }); valid(answer);
      assert.equal(answer.complete, false); assert.equal(answer.steps.length, 1);
      assert.doesNotMatch(answer.steps[0], /Ответ:|=\s*-?\d/);
    }
    const full = plain(question, { mode: 'explain' }); valid(full);
    assert.equal(full.complete, true); assert.equal(full.steps.length, 5);
  }
});

test('new exact arithmetic handles explicitly grouped and multiplied mixed operands', () => {
  for (const [question, attempt] of [['1 1/2 * 2','3'],['(1 1/2) + 1/2','2']]) {
    const answer=plain(question,{attempt});
    assert.equal(answer.verification,'deterministic');
    assert.equal(answer.attemptStatus,'correct');
  }
});
