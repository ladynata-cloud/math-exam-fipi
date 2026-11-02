import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { createAssistantServer } from '../src/server.js';
import { fixture, question, modelResponse, NOW } from './helpers.js';

async function start(t, options = {}) {
  const fx = fixture(t, options); const app = createAssistantServer({ config: fx.config, clock: fx.clock, fetchImpl: options.fetchImpl || (() => { throw new Error('UNEXPECTED_NETWORK'); }) });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`, origin = fx.config.publicOrigin;
  const client = async (url, { method = 'GET', body, token, csrf, headers = {} } = {}) => {
    // Raw local HTTP deliberately exercises Host validation; Fetch controls its
    // own Host header and cannot emulate the configured reverse-proxy origin.
    const payload = body === undefined ? undefined : JSON.stringify(body);
    return new Promise((resolve, reject) => {
    const request = http.request(base + url, { method, headers: { Host: new URL(origin).host, Origin: origin,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Cookie: `mathexam_assistant=${token}` } : {}),
      ...(csrf ? { 'X-Assistant-CSRF': csrf } : {}), ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}), ...headers } }, incoming => {
      const chunks = []; incoming.on('data', chunk => chunks.push(chunk)); incoming.on('end', () => {
        try {
          const response = { status: incoming.statusCode, headers: new Headers(Object.entries(incoming.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value])) };
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ response, data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text });
        } catch (error) { reject(error); }
      });
    });
    request.on('error', reject); request.end(payload);
    });
  };
  const login = async () => {
    const { response, data } = await client('/api/session', { method: 'POST', body: { pilotKey: fx.config.pilotKey } });
    assert.equal(response.status, 201); const cookie = response.headers.get('set-cookie'); assert(cookie.includes('HttpOnly')); assert(cookie.includes('SameSite=Strict'));
    return { token: /^mathexam_assistant=([^;]+)/.exec(cookie)[1], csrf: data.csrf };
  };
  return { ...fx, app, client, login };
}

test('private API denies unauthenticated access; static assets carry CSP and noindex without secrets', async t => {
  const fx = await start(t);
  assert.equal((await fx.client('/api/topics')).response.status, 401);
  const page = await fx.client('/'); assert.equal(page.response.status, 200); assert.match(page.response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(page.response.headers.get('x-robots-tag'), /noindex/); assert.equal(page.response.headers.get('access-control-allow-origin'), null);
  for (const url of ['/src/config.js', '/knowledge/core.json', '/data/assistant.sqlite', '/.env', '/?key=secret']) assert.equal((await fx.client(url)).response.status, 404);
  assert.equal((await fx.client('/api/status', { headers: { Host: 'evil.example' } })).response.status, 403);
});
test('public version is host guarded, uncached, contains no private configuration', async t => {
  const fx = await start(t);
  const result = await fx.client('/api/version');
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(result.data).sort(), ['changes', 'label', 'ok', 'sourceCommit']);
  assert.equal((await fx.client('/api/version', { headers: { Host: 'evil.example' } })).response.status, 403);
});
test('origin and CSRF reject cross-site writes and guessed keys before any work', async t => {
  const fx = await start(t, { api: true });
  const bad = await fx.client('/api/session', { method: 'POST', body: { pilotKey: 'wrong' } }); assert.equal(bad.response.status, 401);
  const session = await fx.login();
  for (const options of [{ headers: { Origin: 'https://evil.example' } }, { csrf: 'wrong' }, { headers: { 'Sec-Fetch-Site': 'cross-site' } }]) {
    const result = await fx.client('/api/ask', { method: 'POST', body: question(), ...session, ...options }); assert.equal(result.response.status, 403);
  }
  assert.equal(fx.app.store.summary().day.requests, 0);
});
test('clarification, correction and reinforcement reuse the private API without external calls', async t => {
  let calls = 0;
  const fx = await start(t, { api: true, fetchImpl: async () => { calls++; throw Error('UNEXPECTED_MODEL_CALL'); } });
  const asset = await fx.client('/learning-aids.js');
  assert.equal(asset.response.status, 200); assert.match(asset.response.headers.get('content-type'), /javascript/);
  assert.match(asset.response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.doesNotMatch(asset.data, /test-only|pilotKey/);
  const session = await fx.login();
  for (const [topic, q, attempt, verification, text] of [
    ['percentages', '15% от', '', 'needs-teacher', /От какого числа/],
    ['percentages', '15% от 240', '36', 'deterministic', /Твоё число подходит/],
    ['fractions', '1 1/2 +', '', 'needs-teacher', /второе число/],
    ['fractions', '1 1/2 + 1/2', '2', 'deterministic', /Твоё число подходит/],
    ['fractions', '1 1/3 + 1/6', '1/2', 'deterministic', /другое число/],
    ['fractions', '1 1/3 + 1/6', '1 1/2', 'deterministic', /Твоё число подходит/],
  ]) {
    const result = await fx.client('/api/ask', { method: 'POST', ...session,
      body: question({ topic, question: q, attempt, externalConsent: false }) });
    assert.equal(result.response.status, 200); assert.equal(result.data.answer.verification, verification);
    assert.match(result.data.answer.text, text);
  }
  assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.api_requests, 0);
  assert.equal(fx.app.store.summary().day.reserved_micros, 0);
});
test('offline end-to-end hints, explicit explanation and feedback never call a model', async t => {
  let calls = 0; const fx = await start(t, { fetchImpl: async () => { calls++; throw new Error('UNEXPECTED'); } }); const session = await fx.login();
  const topics = await fx.client('/api/topics', session); assert.equal(topics.data.topics.length, 22);
  const first = await fx.client('/api/ask', { method: 'POST', body: question(), ...session }); assert.equal(first.response.status, 200);
  assert.equal(first.data.answer.steps.length, 1); assert.equal(first.data.answer.complete, false); assert.equal(first.data.answer.verification, 'deterministic');
  const feedback = await fx.client('/api/feedback', { method: 'POST', body: { answerId: first.data.answer.id, rating: 'unclear' }, ...session }); assert.equal(feedback.response.status, 200);
  const simple = await fx.client('/api/ask', { method: 'POST', body: question(), ...session }); assert.notDeepEqual(simple.data.answer.steps, first.data.answer.steps);
  const full = await fx.client('/api/ask', { method: 'POST', body: question({ mode: 'explain' }), ...session }); assert.equal(full.data.answer.complete, true); assert.match(full.data.answer.steps.join(' '), /x = 5/);
  assert.equal(calls, 0);
});
test('personal data, oversized input and arbitrary extra fields fail before storage/provider', async t => {
  let calls = 0; const fx = await start(t, { api: true, fetchImpl: async () => { calls++; return modelResponse(); } }); const session = await fx.login();
  for (const data of [question({ question: 'Мой телефон +7 999 123 45 67' }), question({ question: 'name@example.test' }),
    question({ question: 'Меня зовут Test, реши задачу' }), question({ question: 'https://example.test/task' }),
    question({ pupilId: 'do-not-accept' }), question({ question: 'x'.repeat(1001) }), question({ hintLevel: 6 }), question({ externalConsent: 'yes' }),
    question({ question: 'x\u0000y' }), question({ question: 'x'.repeat(9000) })]) {
    const result = await fx.client('/api/ask', { method: 'POST', body: data, ...session }); assert([400, 413].includes(result.response.status));
  }
  assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.requests, 0);
  const bytes = fs.readFileSync(fx.config.dbPath); assert(!bytes.includes(Buffer.from('name@example.test')));
});
test('feedback from another session and unknown routes cannot modify state', async t => {
  const fx = await start(t); const a = await fx.login(), b = await fx.login();
  const answer = await fx.client('/api/ask', { method: 'POST', body: question(), ...a });
  assert.equal((await fx.client('/api/feedback', { method: 'POST', body: { answerId: answer.data.answer.id, rating: 'incorrect' }, ...b })).response.status, 404);
  assert.equal((await fx.client('/api/knowledge/approve', { method: 'POST', body: {}, ...a })).response.status, 404);
});
test('external consent is required and exact arithmetic remains free even with consent', async t => {
  let calls = 0; const fx = await start(t, { api: true, fetchImpl: async () => { calls++; return modelResponse(); } }); const session = await fx.login();
  const general = question({ question: 'Что означает решить уравнение?' });
  await fx.client('/api/ask', { method: 'POST', body: general, ...session }); assert.equal(calls, 0);
  await fx.client('/api/ask', { method: 'POST', body: question({ externalConsent: true }), ...session }); assert.equal(calls, 0);
  const external = await fx.client('/api/ask', { method: 'POST', body: question({ question: general.question, externalConsent: true }), ...session });
  assert.equal(calls, 1); assert.equal(external.data.answer.verification, 'model-unverified'); assert(fx.app.store.summary().day.reserved_micros > 0);
});
test('mixed questions, corrected equations and periodic answers work through HTTP without model calls', async t => {
  let calls = 0;
  const fx = await start(t, { api: true, fetchImpl: async () => { calls++; throw Error('UNEXPECTED_MODEL_CALL'); } });
  const session = await fx.login();
  for (const [topic, q, attempt, verification, expected] of [
    ['fractions', '1 1/2 + 1/2', '6', 'deterministic', /другое число/],
    ['fractions', '1 1/2 + 1/2', '2', 'deterministic', /Твоё число подходит/],
    ['fractions', '-1\u00a01/2 + 1/2', '-1', 'deterministic', /Твоё число подходит/],
    ['linear-equations', '1 2x + 5 = 29', '2', 'needs-teacher', /цифры одного числа пиши подряд/],
    ['linear-equations', '12x + 5 = 29', '2', 'deterministic', /Твоё число подходит/],
    ['fractions', '1/3 + 0/1', '0,(3)', 'deterministic', /Твоё число подходит/],
    ['fractions', '1/6 + 0/1', '0,1(6)', 'deterministic', /Твоё число подходит/]
  ]) {
    const checked = await fx.client('/api/ask', { method: 'POST', ...session,
      body: question({ topic, question: q, attempt, externalConsent: verification === 'deterministic' }) });
    assert.equal(checked.response.status, 200);
    assert.equal(checked.data.answer.verification, verification); assert.match(checked.data.answer.text, expected);
    assert.equal(checked.data.answer.steps.length, 1); assert.equal(checked.data.answer.complete, false);
  }
  const blocked = await fx.client('/api/ask', { method: 'POST', ...session,
    body: question({ topic: 'fractions', question: '1/17 + 0/1', attempt: '0,(0588235294117647)' }) });
  assert.equal(blocked.response.status, 400); assert.equal(blocked.data.error, 'PERSONAL_DATA_REJECTED');
  assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.api_requests, 0);
  assert.equal(fx.app.store.summary().day.reserved_micros, 0);
});
test('request deduplication, budget exhaustion and failure fallback cannot issue a retry', async t => {
  let calls = 0; const fx = await start(t, { api: true, env: { ASSISTANT_DAILY_API_REQUESTS: '1' }, fetchImpl: async () => { calls++; throw new Error('secret-provider-body'); } });
  const session = await fx.login(), body = question({ question: 'Что означает решить уравнение?', externalConsent: true });
  const first = await fx.client('/api/ask', { method: 'POST', body, ...session }); assert.equal(first.response.status, 200); assert(first.data.notice);
  assert.equal(JSON.stringify(first.data).includes('secret-provider-body'), false); assert.equal(calls, 1);
  const duplicate = await fx.client('/api/ask', { method: 'POST', body, ...session }); assert.equal(duplicate.response.status, 409); assert.equal(calls, 1);
  const second = await fx.client('/api/ask', { method: 'POST', body: question({ question: body.question, externalConsent: true }), ...session });
  assert.equal(second.response.status, 200); assert(second.data.notice); assert.equal(calls, 1); assert.equal(fx.app.store.summary().day.api_requests, 1);
});

test('extended equations, intermediate steps and percentages stay deterministic through HTTP', async t => {
  let calls = 0;
  const fx = await start(t, { api: true, fetchImpl: async () => { calls++; throw Error('UNEXPECTED_MODEL_CALL'); } });
  const session = await fx.login();
  for (const [topic, q, attempt, expected] of [
    ['linear-equations', '2(x+3)=x+9', '2x+6=x+9', /сохраняет решения/],
    ['linear-equations', '2(x+3)=x+9', '2x+3=x+9', /изменил решения/],
    ['linear-equations', '0,5x+2=0,25x+5', '12', /Твоё число подходит/],
    ['percentages', 'Найди число, 15% которого равны 36', '240', /Твоё число подходит/],
    ['percentages', 'Сколько процентов составляет 30 от 120?', '25%', /Твоё число подходит/],
    ['percentages', 'Уменьши 240 на 15%', '204', /Твоё число подходит/],
    ['percentages', 'Увеличь 240 на 15%', '276', /Твоё число подходит/]
  ]) {
    const result = await fx.client('/api/ask', { method: 'POST', ...session,
      body: question({ topic, question: q, attempt, externalConsent: true }) });
    assert.equal(result.response.status, 200); assert.equal(result.data.answer.verification, 'deterministic');
    assert.match(result.data.answer.text, expected); assert.equal(result.data.answer.steps.length, 1);
  }
  assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.api_requests, 0);
  assert.equal(fx.app.store.summary().day.reserved_micros, 0);
});
test('understated budget prevents the first network call', async t => {
  let calls = 0; const fx = await start(t, { api: true, env: { ASSISTANT_DAILY_BUDGET: '0.000001' }, fetchImpl: async () => { calls++; return modelResponse(); } });
  const session = await fx.login();
  const result = await fx.client('/api/ask', { method: 'POST', body: question({ question: 'Как решить уравнение?', externalConsent: true }), ...session });
  assert.equal(result.response.status, 200); assert(result.data.notice); assert.equal(calls, 0);
});
test('unexpected provider token accounting durably disables further paid requests', async t => {
  let calls = 0; const fx = await start(t, { api: true, fetchImpl: async () => { calls++; return modelResponse({ usage: { prompt_tokens: 1000000, completion_tokens: 1000000 } }); } });
  const session = await fx.login();
  for (let i = 0; i < 2; i++) { const result = await fx.client('/api/ask', { method: 'POST', body: question({ question: 'Как решить уравнение?', externalConsent: true }), ...session }); assert(result.data.notice); }
  assert.equal(calls, 1); assert.equal(fx.app.store.summary().providerCircuit, 'PROVIDER_CONTRACT_CHANGED');
  assert.equal((await fx.client('/api/status')).data.externalEnabled, false);
});
test('forgetting deletes private session/answers/feedback and does not reset aggregate limits', async t => {
  const fx = await start(t); const session = await fx.login();
  const first = await fx.client('/api/ask', { method: 'POST', body: question(), ...session });
  await fx.client('/api/feedback', { method: 'POST', body: { answerId: first.data.answer.id, rating: 'unclear' }, ...session });
  const result = await fx.client('/api/session', { method: 'DELETE', ...session }); assert.equal(result.response.status, 200);
  assert.match(result.response.headers.get('set-cookie'), /Max-Age=0/); assert.equal(fx.app.store.summary().feedback.length, 0);
  assert.equal((await fx.client('/api/topics', session)).response.status, 401); assert.equal(fx.app.store.summary().day.requests, 1);
});
test('API price expiry while server runs falls back without external call', async t => {
  let now = NOW, calls = 0; const fx = await start(t, { api: true, clock: () => now, fetchImpl: async () => { calls++; return modelResponse(); } });
  now += 8 * 86400000; const session = await fx.login();
  const result = await fx.client('/api/ask', { method: 'POST', body: question({ question: 'Что означает решить уравнение?', externalConsent: true }), ...session });
  assert.equal(result.response.status, 200); assert(result.data.notice); assert.equal(calls, 0);
});

test('new exact arithmetic topics cannot expand the paid provider boundary', async t => {
  let calls=0;
  const fx=await start(t,{api:true,fetchImpl:async()=>{calls++;throw Error('UNEXPECTED');}}),session=await fx.login();
  for(const [topic,q] of [['arithmetic','(1/2+1/3)*6'],['arithmetic','arbitrary unsupported request'],['polynomials','Упрости: x*x']]){
    const r=await fx.client('/api/ask',{method:'POST',...session,body:question({topic,question:q,externalConsent:true})});
    assert.equal(r.response.status,200);assert.notEqual(r.data.answer.verification,'model-unverified');
  }
  assert.equal(calls,0);assert.equal(fx.app.store.summary().day.api_requests,0);
});
