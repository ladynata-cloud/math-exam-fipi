import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRequest, callProvider } from '../src/provider.js';
import { getBuiltinKnowledge } from '../src/tutor.js';
import { fixture, question, modelResponse, NOW } from './helpers.js';

test('provider prompt and reservation contain only bounded math data; server controls URL/model', async t => {
  const { config } = fixture(t, { api: true });
  const input = question({ externalConsent: true, question: 'Что означает решить уравнение?', pupilId: 'never-send-pupil', history: ['never-send-history'] });
  const cards = getBuiltinKnowledge().filter(card => card.topic === input.topic);
  const prepared = prepareRequest(config, input, cards, NOW);
  assert(prepared.inputBound >= Buffer.byteLength(JSON.stringify(prepared.body.messages)));
  assert(prepared.reservedMicros > 0); assert.deepEqual(prepared.body.thinking, { type: 'disabled' });
  const body = JSON.stringify(prepared.body); assert(!body.includes('never-send')); assert(!body.includes(input.requestId)); assert(!body.includes(config.apiKey));
  let calls = 0;
  const result = await callProvider({ config, prepared, input, cards, fetchImpl: async (url, opts) => {
    calls++; assert.equal(url, 'https://api.deepseek.com/chat/completions'); assert.equal(opts.redirect, 'error');
    assert.equal(opts.headers.Authorization, `Bearer ${config.apiKey}`); assert.equal(JSON.parse(opts.body).max_tokens, 500);
    return modelResponse();
  } });
  assert.equal(calls, 1); assert.equal(result.answer.verification, 'model-unverified'); assert.equal(result.answer.steps.length, 1);
});
test('provider failure never retries or exposes error bodies', async t => {
  const { config } = fixture(t, { api: true }); const input = question(), cards = getBuiltinKnowledge();
  const prepared = prepareRequest(config, input, cards, NOW); let calls = 0;
  await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => { calls++; return new Response('secret-upstream-error', { status: 503 }); } }), /PROVIDER_UNAVAILABLE/);
  assert.equal(calls, 1);
});
test('usage over the reserved input/output bound is a contract failure', async t => {
  const { config } = fixture(t, { api: true }); const input = question(), cards = getBuiltinKnowledge();
  const prepared = prepareRequest(config, input, cards, NOW);
  for (const usage of [undefined, { prompt_tokens: prepared.inputBound + 1, completion_tokens: 10 },
    { prompt_tokens: 10, completion_tokens: 501 }, { prompt_tokens: -1, completion_tokens: 2 },
    { prompt_tokens: 10, completion_tokens: 20, total_tokens: 40 }]) {
    await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => modelResponse({ usage }) }), /PROVIDER_USAGE_CONTRACT/);
  }
});
test('unexpected thinking, tools and truncated completions are rejected', async t => {
  const { config } = fixture(t, { api: true }); const input = question(), cards = getBuiltinKnowledge();
  const prepared = prepareRequest(config, input, cards, NOW);
  for (const choice of [{ finish_reason: 'length', message: {} }, { finish_reason: 'tool_calls', message: { tool_calls: [] } },
    { finish_reason: 'stop', message: { content: '{}', reasoning_content: 'unexpected reasoning' } }])
    await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => modelResponse({ choices: [choice] }) }));
});
test('bounded streaming body rejects malformed JSON, HTML, PII and oversized payloads', async t => {
  const { config } = fixture(t, { api: true }); const input = question(), cards = getBuiltinKnowledge();
  const prepared = prepareRequest(config, input, cards, NOW);
  const values = [new Response('not json', { headers: { 'Content-Type': 'application/json' } }),
    new Response('<html>bad</html>', { headers: { 'Content-Type': 'text/html' } }),
    new Response('x'.repeat(66000), { headers: { 'Content-Type': 'application/json' } })];
  for (const response of values) await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => response }));
  for (const text of ['<script>alert(1)</script>', 'Напиши name@example.test', 'https://evil.example', 'x'.repeat(2000)]) {
    const content = JSON.stringify({ title: 'Проверка', text, steps: ['Шаг'], check: 'Проверка' });
    await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => modelResponse({ choices: [{ finish_reason: 'stop', message: { content } }] }) }));
  }
});
test('timeout is bounded even if a fake upstream ignores abort; one call only', async t => {
  const { config } = fixture(t, { api: true, env: { ASSISTANT_TIMEOUT_MS: '100' } }); const input = question(), cards = getBuiltinKnowledge();
  const prepared = prepareRequest(config, input, cards, NOW); let calls = 0;
  await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => { calls++; return new Promise(() => {}); } }), /PROVIDER_TIMEOUT/);
  assert.equal(calls, 1);
});
test('offline and expired price acknowledgement cannot prepare a paid call', t => {
  const offline = fixture(t); assert.throws(() => prepareRequest(offline.config, question(), getBuiltinKnowledge(), NOW));
  const api = fixture(t, { api: true }); assert.throws(() => prepareRequest(api.config, question(), getBuiltinKnowledge(), NOW + 7 * 86400000));
});
test('a hint cannot silently become multiple steps or an explicit final answer', async t => {
  const { config } = fixture(t, { api: true }); const input = question(), cards = getBuiltinKnowledge();
  const prepared = prepareRequest(config, input, cards, NOW);
  for (const content of [{ title: 'Шаг', text: 'Ответ: x = 5.', steps: ['Проверим.'], check: 'Сравни.' },
    { title: 'Шаг', text: 'Решаем.', steps: ['Первый шаг.', 'Второй шаг.'], check: 'Сравни.' }]) {
    await assert.rejects(callProvider({ config, prepared, input, cards, fetchImpl: async () => modelResponse({
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(content) } }]
    }) }), /PROVIDER_HINT_CONTRACT/);
  }
});
