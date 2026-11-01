import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { parseNumericAttempt, answerOffline, validateModelAnswer } from '../src/tutor.js';
import { prepareCabinetQuestion, answerCabinetOffline } from '../src/cabinet-topics.js';
import { createAssistantServer } from '../src/server.js';
import { fixture } from './helpers.js';

const plain = (question, attempt, extra = {}) => answerOffline({ topic: 'fractions', question, attempt, ...extra });
const cabinet = (question, attempt, extra = {}) => {
  const p = prepareCabinetQuestion({ profileId: 'peterson-decimals', topic: 'decimal-divide', question, attempt, mode: 'hint', ...extra });
  return answerCabinetOffline(p.input, p.cards);
};
const valid = answer => {
  validateModelAnswer(Object.fromEntries(['title', 'text', 'steps', 'check'].map(k => [k, answer[k]])));
  assert.equal(answer.verification, 'deterministic');
};

test('mixed numbers, equivalent fractions, signs and horizontal spaces share exact meaning', () => {
  for (const value of ['1 1/2', '+1 1/2', '1\u00a01/2', '1\u202f1 / 2', '1\t1/2',
    '3/2', '3 / 2', '-3/-2', '1,500000', '1.5', 'Ответ: 1 1/2', 'x = 1 1/2', 'Ответ: х = + 1 1/2']) {
    assert.deepEqual(parseNumericAttempt(value), { n: 3n, d: 2n }, value);
  }
  for (const value of ['-1 1/2', '−1 1/2', '— 1 1/2', '- 3 / 2', '3 / - 2', '-1,50']) {
    assert.deepEqual(parseNumericAttempt(value), { n: -3n, d: 2n }, value);
  }
  assert.deepEqual(parseNumericAttempt('-0 1/2'), { n: -1n, d: 2n });
  assert.deepEqual(parseNumericAttempt('-0 0/2'), { n: 0n, d: 1n });
  assert.deepEqual(parseNumericAttempt('2 0/4'), { n: 2n, d: 1n });
});

test('the reported mixed-number and split-digit false approvals are fixed in both entrypoints', () => {
  assert.match(plain('1/2 + 1/1', '1 1/2').text, /Твоё число подходит/);
  assert.doesNotMatch(plain('7/2 + 2/1', '1 1/2').text, /Твоё число подходит/);
  assert.match(cabinet('3 : 2', '1 1/2').text, /Твоё число подходит/);
  assert.doesNotMatch(cabinet('11 : 2', '1 1/2').text, /Твоё число подходит/);
  for (const answer of [plain('10/1 + 2/1', '1 2'), cabinet('24 : 2', '1 2')]) {
    valid(answer);
    assert.match(answer.text, /Такую запись ответа здесь не проверяю/);
    assert.doesNotMatch(answer.text, /Твоё число подходит|Похоже|другое число/);
  }
});

test('924 signed mixed answers agree with independent integer cross-products through both entrypoints', () => {
  let cases = 0, falseApprovals = 0;
  for (const sign of [-1, 1]) for (let whole = 0; whole <= 5; whole++) {
    for (let denominator = 2; denominator <= 12; denominator++) for (let numerator = 0; numerator < denominator; numerator++) {
      const n = sign * (whole * denominator + numerator);
      const attempt = `${sign < 0 ? '-' : ''}${whole} ${numerator}/${denominator}`;
      const parsed = parseNumericAttempt(attempt);
      assert.equal(parsed.n * BigInt(denominator), BigInt(n) * parsed.d, attempt);
      for (const answer of [plain(`${n}/${denominator} + 0/1`, attempt), cabinet(`${n} : ${denominator}`, attempt)]) {
        valid(answer); assert.match(answer.text, /Твоё число подходит/, attempt); assert.doesNotMatch(answer.text, /Похоже/);
      }
      // Independent negative control models the previous digit-concatenation
      // bug, except where that value happens to be mathematically equivalent.
      const concatenated = sign * Number(`${whole}${numerator}`);
      if (concatenated !== n) {
        for (const answer of [plain(`${concatenated}/${denominator} + 0/1`, attempt), cabinet(`${concatenated} : ${denominator}`, attempt)]) {
          assert.doesNotMatch(answer.text, /Твоё число подходит/, attempt);
        }
        falseApprovals++;
      }
      cases++;
    }
  }
  assert.equal(cases, 924); assert(falseApprovals > 500);
});

test('ambiguous separators, split digits, expressions and invalid mixed fractions are never silently checked', () => {
  const invalid = ['1 2', '1 000', '1, 5', '1 .5', '1. 5', '1 2/3 4', '1/2 3', '1/2/3',
    '1 2/2', '1 3/2', '1 -1/2', '1 +1/2', '1 1/-2', '1 1/0', '1/0', '0/0',
    '1 1 / +2', '1\n1/2', '1\r2', '1\u200b2', '1e2', '1+1/2', 'NaN', 'Infinity',
    '1½', 'Ответ: Ответ: 1', 'x=1=1', '1 1/2 руб', '<b>1</b>', '1/2; ответ 1', '', ' '.repeat(10)];
  for (const value of invalid) {
    assert.equal(parseNumericAttempt(value), null, value);
    if (value.trim()) {
      const answer = plain('1/2 + 1/1', value);
      valid(answer); assert.match(answer.text, /Такую запись ответа здесь не проверяю/, value);
      assert.doesNotMatch(answer.text, /Твоё число подходит|Похоже/);
    }
  }
  for (const value of [null, undefined, {}, 1, '1'.repeat(401), '1000000000000', '1/1000000000000',
    '1 1/1000000000000', '0,0000001']) assert.equal(parseNumericAttempt(value), null);
  assert.deepEqual(parseNumericAttempt('999999999999'), { n: 999999999999n, d: 1n });
  assert.deepEqual(parseNumericAttempt('0,000001'), { n: 1n, d: 1000000n });
  const largest = parseNumericAttempt('999999999999 1/999999999999');
  assert.equal(largest.n * 999999999999n, (999999999999n ** 2n + 1n) * largest.d);
});

test('mixed feedback preserves one-step hints, complete explanations and correct-answer precedence', () => {
  for (const simpler of [false, true]) for (let hintLevel = 1; hintLevel <= 5; hintLevel++) {
    for (const answer of [plain('3/4 + 3/4', '1 1/2', { simpler, hintLevel }), cabinet('3 : 2', '1 1/2', { simpler, hintLevel })]) {
      valid(answer); assert.match(answer.text, /Твоё число подходит/); assert.doesNotMatch(answer.text, /Похоже/);
      assert.equal(answer.steps.length, 1); assert.equal(answer.complete, false);
      assert.doesNotMatch(answer.steps.join(' '), /Ответ:/);
    }
  }
  for (const answer of [plain('3/4 + 3/4', '1 1/2', { mode: 'explain' }), cabinet('3 : 2', '1 1/2', { mode: 'full' })]) {
    valid(answer); assert.equal(answer.complete, true); assert(answer.steps.length <= 5);
  }
  assert.doesNotMatch(plain('1/2 + 1/1', '').text, /не проверяю/);
});

test('real local cabinet HTTP checks mixed answers without any external transport or money reservation', async t => {
  const key = 'test-only-answer-input-bridge-bbbbbbbbbbbbbbbbbbbbbbbb';
  const fx = fixture(t, { api: true, env: { ASSISTANT_CABINET_BRIDGE_KEY: key, ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' } });
  let calls = 0;
  const app = createAssistantServer({ config: fx.config, clock: fx.clock, fetchImpl: () => { calls++; throw Error('FORBIDDEN_MODEL_TRANSPORT'); } });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  const ask = (question, attempt) => new Promise((resolve, reject) => {
    const payload = JSON.stringify({ subject: 'a'.repeat(64), requestId: randomUUID(), profileId: 'peterson-decimals',
      topic: 'decimal-divide', question, attempt, mode: 'hint', hintLevel: 1, simpler: false, externalConsent: true });
    const req = http.request({ hostname: '127.0.0.1', port: app.server.address().port, path: '/internal/cabinet/ask', method: 'POST',
      headers: { Host: new URL(fx.config.publicOrigin).host, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
      let raw = ''; res.on('data', part => { raw += part; }); res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(raw) }));
    }); req.on('error', reject); req.end(payload);
  });
  for (const [question, attempt, expected] of [['3 : 2', '1 1/2', /Твоё число подходит/],
    ['-3 : 2', '-1\u00a01/2', /Твоё число подходит/], ['11 : 2', '1 1/2', /другое число/],
    ['24 : 2', '1 2', /Такую запись ответа здесь не проверяю/]]) {
    const result = await ask(question, attempt);
    assert.equal(result.status, 200); assert.equal(result.data.mode, 'offline'); valid(result.data.answer);
    assert.match(result.data.answer.text, expected); assert.equal(result.data.answer.steps.length, 1);
  }
  assert.equal(calls, 0); assert.equal(app.store.summary().day.api_requests, 0);
  assert.equal(app.store.summary().day.reserved_micros, 0);
});
