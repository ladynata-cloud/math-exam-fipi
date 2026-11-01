import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { loadConfig, pricesFresh } from '../src/config.js';
import { prepareRequest, callProvider } from '../src/provider.js';
import { createAssistantServer } from '../src/server.js';
import { getBuiltinKnowledge } from '../src/tutor.js';
import { listCabinetProfiles } from '../src/cabinet-topics.js';
import { fixture, question, modelResponse, NOW } from './helpers.js';

const MODEL = 'gpt-5.4-mini-2026-03-17';
const ENV = { ASSISTANT_PROVIDER: 'openai', ASSISTANT_MODEL: MODEL,
  ASSISTANT_INPUT_PER_MILLION: '0.75', ASSISTANT_OUTPUT_PER_MILLION: '4.50' };
const BRIDGE = 'test-only-openai-bridge-cccccccccccccccccccccccccccc';
const SUBJECT = 'c'.repeat(64);
const response = (extra = {}) => modelResponse({ model: MODEL, service_tier: 'default', ...extra });
function preparedFixture(t, extra = {}) {
  const fx = fixture(t, { api: true, env: { ...ENV, ...extra } });
  const input = question({ question: 'Что означает решить уравнение?', externalConsent: true });
  const cards = getBuiltinKnowledge().filter(card => card.topic === input.topic);
  return { ...fx, input, cards, prepared: prepareRequest(fx.config, input, cards, NOW) };
}
function call(fx, fetchImpl) { return callProvider({ config: fx.config, prepared: fx.prepared, input: fx.input, cards: fx.cards, fetchImpl }); }

test('OpenAI key alone remains offline; every existing paid configuration gate still applies', t => {
  const offline = loadConfig({ ...ENV, ASSISTANT_API_KEY: 'fake-key-does-not-enable-anything' });
  assert.equal(offline.mode, 'offline'); assert.equal(offline.providerUrl, undefined);
  assert.equal(offline.apiKey, ''); assert.equal(offline.dailyBudgetMicros, 0);
  const fx = preparedFixture(t);
  for (const key of ['ASSISTANT_EXTERNAL_ENABLED', 'ASSISTANT_PROVIDER_DATA_REVIEWED', 'ASSISTANT_API_KEY',
    'ASSISTANT_PILOT_KEY', 'ASSISTANT_MODEL', 'ASSISTANT_CURRENCY', 'ASSISTANT_INPUT_PER_MILLION',
    'ASSISTANT_OUTPUT_PER_MILLION', 'ASSISTANT_DAILY_BUDGET', 'ASSISTANT_MONTHLY_BUDGET', 'ASSISTANT_PRICE_REVIEWED_ON']) {
    const env = { ...fx.env }; delete env[key]; assert.throws(() => loadConfig(env, NOW), key);
  }
  assert.equal(fx.config.providerUrl, 'https://api.openai.com/v1/chat/completions');
  assert.equal(fx.config.providerLabel, 'OpenAI API');
  assert.equal(pricesFresh(fx.config, NOW + 7 * 86400000), false);
});

test('OpenAI rejects aliases, other models, currencies, cached rates and understated output rates', t => {
  const fx = preparedFixture(t);
  for (const extra of [{ ASSISTANT_MODEL: 'gpt-5.4-mini' }, { ASSISTANT_MODEL: 'gpt-4.1-mini-2025-04-14' },
    { ASSISTANT_MODEL: 'gpt-5.4-pro' }, { ASSISTANT_CURRENCY: 'RUB' },
    { ASSISTANT_INPUT_PER_MILLION: '0.075' }, { ASSISTANT_INPUT_PER_MILLION: '0.749999' },
    { ASSISTANT_OUTPUT_PER_MILLION: '4.499999' }, { ASSISTANT_PRICE_REVIEWED_ON: '2026-10-19' }]) {
    assert.throws(() => loadConfig({ ...fx.env, ...extra }, NOW));
  }
  assert.equal(loadConfig({ ...fx.env, ASSISTANT_INPUT_PER_MILLION: '0.80', ASSISTANT_OUTPUT_PER_MILLION: '5' }, NOW).inputPriceMicros, 800000);
});

test('OpenAI sends one bounded standard-tier request with storage and reasoning disabled', async t => {
  const fx = preparedFixture(t); let calls = 0;
  const result = await call(fx, async (url, options) => {
    calls++; assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(options.redirect, 'error'); assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, `Bearer ${fx.config.apiKey}`);
    const body = JSON.parse(options.body);
    assert.deepEqual(Object.keys(body).sort(), ['max_completion_tokens', 'messages', 'model', 'reasoning_effort', 'response_format', 'service_tier', 'store', 'stream'].sort());
    assert.equal(body.model, MODEL); assert.equal(body.store, false); assert.equal(body.stream, false);
    assert.equal(body.reasoning_effort, 'none'); assert.equal(body.service_tier, 'default');
    assert.equal(body.max_completion_tokens, 500); assert.equal(body.response_format.type, 'json_object');
    for (const value of [fx.config.apiKey, fx.config.pilotKey, fx.input.requestId]) assert(!options.body.includes(value));
    // Independent integer oracle, including a full, uncached input allowance.
    assert.equal(fx.prepared.reservedMicros, Math.ceil((fx.prepared.inputBound * 750000 + 500 * 4500000) / 1000000));
    return response();
  });
  assert.equal(calls, 1); assert.equal(result.reportedModel, MODEL);
  assert.equal(result.answer.verification, 'model-unverified'); assert.equal(result.answer.complete, false);
});

test('OpenAI rejects model/tier drift and malformed or excess usage without retrying', async t => {
  const fx = preparedFixture(t);
  for (const data of [{ model: 'gpt-5.4-mini' }, { model: undefined }, { service_tier: 'priority' }, { service_tier: undefined },
    { usage: undefined }, { usage: { prompt_tokens: fx.prepared.inputBound + 1, completion_tokens: 1 } },
    { usage: { prompt_tokens: 20, completion_tokens: 501 } },
    { usage: { prompt_tokens: 20, completion_tokens: 40, total_tokens: 61 } },
    { usage: { prompt_tokens: 20, completion_tokens: 40, completion_tokens_details: { reasoning_tokens: 2 } } }]) {
    let calls = 0;
    await assert.rejects(call(fx, async () => { calls++; return response(data); }), /PROVIDER_USAGE_CONTRACT/);
    assert.equal(calls, 1);
  }
});

test('refusal, truncation, tool call, hidden reasoning and explicit final answer never become a hint', async t => {
  const fx = preparedFixture(t);
  const content = JSON.stringify({ title: 'Шаг', text: 'Рассмотри равенство.', steps: ['Сравни обе части.'], check: 'Какое действие подойдёт?' });
  for (const choice of [
    { finish_reason: 'stop', message: { content, refusal: 'Refusal fixture' } },
    { finish_reason: 'stop', message: { content: null, refusal: 'Refusal fixture' } },
    { finish_reason: 'length', message: { content } },
    { finish_reason: 'content_filter', message: { content } },
    { finish_reason: 'stop', message: { content, tool_calls: [{ id: 'untrusted-tool' }] } },
    { finish_reason: 'stop', message: { content, reasoning_content: 'hidden' } },
    { finish_reason: 'stop', message: { content: content.replace('Рассмотри равенство.', 'Ответ: x = 5.') } }
  ]) await assert.rejects(call(fx, async () => response({ choices: [choice] })), /PROVIDER_(RESPONSE_INVALID|USAGE_CONTRACT|HINT_CONTRACT)/);
});

test('OpenAI upstream errors, bad JSON, oversized replies and timeout stay bounded and secret-free', async t => {
  const fx = preparedFixture(t, { ASSISTANT_TIMEOUT_MS: '100' });
  for (const fetchImpl of [async () => new Response('upstream-secret', { status: 429 }),
    async () => new Response('{broken', { headers: { 'Content-Type': 'application/json' } }),
    async () => new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } }),
    async () => new Promise(() => {})]) {
    let calls = 0;
    await assert.rejects(call(fx, (...args) => { calls++; return fetchImpl(...args); }), error => {
      assert(!error.message.includes('upstream-secret'));
      return /^PROVIDER_/.test(error.message);
    });
    assert.equal(calls, 1);
  }
});

// Exercise the real HTTP bridge and durable store; only the model transport is
// replaced. No key, learner data, credit or external network is used.
async function bridgeFixture(t, { env = {}, fetchImpl } = {}) {
  const fx = fixture(t, { api: true, env: { ...ENV, ASSISTANT_CABINET_BRIDGE_KEY: BRIDGE,
    ASSISTANT_CABINET_EXTERNAL_ENABLED: '1', ...env } });
  let app, port;
  async function restart() {
    if (app) await app.close();
    app = createAssistantServer({ config: fx.config, clock: fx.clock, fetchImpl: fetchImpl || (() => { throw Error('UNEXPECTED_NETWORK'); }) });
    await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(0, '127.0.0.1', resolve); });
    port = app.server.address().port;
  }
  await restart(); t.after(() => app.close());
  function ask(body, key = BRIDGE) {
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const request = http.request({ hostname: '127.0.0.1', port, path: '/internal/cabinet/ask', method: 'POST',
        headers: { Host: new URL(fx.config.publicOrigin).host, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, incoming => {
        const chunks = []; incoming.on('data', part => chunks.push(part)); incoming.on('end', () => {
          try { resolve({ status: incoming.statusCode, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
          catch (error) { reject(error); }
        });
      }); request.on('error', reject); request.end(payload);
    });
  }
  return { ...fx, ask, restart, get app() { return app; } };
}
function cabinetQuestion(extra = {}) {
  const profile = listCabinetProfiles().find(value => value.id === 'triangle-congruence');
  return { subject: SUBJECT, requestId: randomUUID(), profileId: profile.id, topic: profile.topics[0].id,
    question: profile.topics[0].example, attempt: '', mode: 'hint', hintLevel: 1, simpler: false, externalConsent: true, ...extra };
}

test('OpenAI cabinet gates, consent and exact decimals preserve zero-spend paths', async t => {
  let calls = 0;
  const blocked = await bridgeFixture(t, { env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '0' }, fetchImpl: async () => { calls++; return response(); } });
  assert.equal((await blocked.ask(cabinetQuestion())).data.mode, 'offline');
  const allowed = await bridgeFixture(t, { fetchImpl: async () => { calls++; return response(); } });
  assert.equal((await allowed.ask(cabinetQuestion(), 'wrong-key')).status, 401);
  assert.equal((await allowed.ask(cabinetQuestion({ externalConsent: false }))).data.mode, 'offline');
  const decimal = cabinetQuestion({ profileId: 'peterson-decimals', topic: 'decimal-add-subtract', question: '1,2 + 3,45' });
  const exact = await allowed.ask(decimal);
  assert.equal(exact.status, 200); assert.equal(exact.data.answer.verification, 'deterministic');
  assert.equal(calls, 0); assert.equal(allowed.app.store.summary().day.api_requests, 0);
});

test('OpenAI cabinet reserves before transport, strips identity and retains replay protection on restart', async t => {
  let calls = 0, fx; const input = cabinetQuestion();
  fx = await bridgeFixture(t, { fetchImpl: async (url, options) => {
    calls++; assert.equal(fx.app.store.summary().day.api_requests, 1);
    assert(fx.app.store.summary().day.reserved_micros > 0);
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    for (const value of [SUBJECT, input.requestId, BRIDGE, fx.config.pilotKey, fx.config.apiKey]) assert(!options.body.includes(value));
    return response();
  } });
  const answer = await fx.ask(input);
  assert.equal(answer.status, 200); assert.equal(answer.data.mode, 'api');
  assert.equal(answer.data.answer.verification, 'model-unverified');
  const reserved = fx.app.store.summary().day.reserved_micros;
  await fx.restart();
  assert.equal((await fx.ask(input)).status, 409); assert.equal(calls, 1);
  assert.equal(fx.app.store.summary().day.reserved_micros, reserved);
});

test('OpenAI model/tier accounting drift trips the durable circuit and survives restart', async t => {
  let calls = 0;
  const fx = await bridgeFixture(t, { fetchImpl: async () => { calls++; return response({ service_tier: 'priority' }); } });
  const first = await fx.ask(cabinetQuestion());
  assert.equal(first.status, 200); assert.equal(first.data.mode, 'offline');
  assert.equal(fx.app.store.summary().providerCircuit, 'PROVIDER_CONTRACT_CHANGED');
  const reserved = fx.app.store.summary().day.reserved_micros; assert(reserved > 0);
  await fx.restart(); await fx.ask(cabinetQuestion());
  assert.equal(calls, 1); assert.equal(fx.app.store.summary().day.reserved_micros, reserved);
});

test('OpenAI budget denial and uncertain failure never refund or retry a possible bill', async t => {
  let calls = 0;
  const blocked = await bridgeFixture(t, { env: { ASSISTANT_DAILY_BUDGET: '0.000001' }, fetchImpl: async () => { calls++; return response(); } });
  assert.equal((await blocked.ask(cabinetQuestion())).data.mode, 'offline'); assert.equal(calls, 0);
  const failed = await bridgeFixture(t, { env: { ASSISTANT_DAILY_API_REQUESTS: '1' }, fetchImpl: async () => { calls++; throw Error('private-provider-error'); } });
  const input = cabinetQuestion(), result = await failed.ask(input);
  assert.equal(result.data.mode, 'offline'); assert(!JSON.stringify(result.data).includes('private-provider-error'));
  const reserved = failed.app.store.summary().day.reserved_micros; assert(reserved > 0);
  await failed.restart(); assert.equal((await failed.ask(input)).status, 409);
  await failed.ask(cabinetQuestion()); assert.equal(calls, 1);
  assert.equal(failed.app.store.summary().day.reserved_micros, reserved);
});
