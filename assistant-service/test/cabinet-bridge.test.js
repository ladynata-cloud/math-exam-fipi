import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createAssistantServer } from '../src/server.js';
import { loadConfig } from '../src/config.js';
import { listCabinetProfiles } from '../src/cabinet-topics.js';
import { resolveCourseContext } from '../src/course-context.js';
import { fixture, modelResponse, NOW } from './helpers.js';

const BRIDGE_KEY = 'test-only-cabinet-bridge-key-bbbbbbbbbbbbbbbbbbbbbbb';
const SUBJECT_A = 'a'.repeat(64), SUBJECT_B = 'b'.repeat(64);
function question(extra = {}) {
  const profile = listCabinetProfiles().find(value => value.id === 'triangle-congruence');
  const topic = profile.topics[0];
  return { subject: SUBJECT_A, requestId: randomUUID(), profileId: profile.id, topic: topic.id,
    question: topic.example, attempt: '', mode: 'hint', hintLevel: 1, simpler: false, externalConsent: false, ...extra };
}
function courseQuestion(extra = {}) {
  const resolved = resolveCourseContext({ courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 0 });
  return { subject: SUBJECT_A, requestId: randomUUID(), profileId: 'atanasyan-first-steps', topic: resolved.topic,
    question: resolved.question, courseContext: resolved.courseContext, courseRevision: resolved.courseRevision,
    attempt: '', mode: 'hint', hintLevel: 1, simpler: false, externalConsent: false, ...extra };
}

async function start(t, options = {}) {
  const fx = fixture(t, { ...options, env: { ASSISTANT_CABINET_BRIDGE_KEY: BRIDGE_KEY, ...options.env } });
  const config = options.configOverrides ? Object.freeze({ ...fx.config, ...options.configOverrides }) : fx.config;
  let app, port;
  const restart = async () => {
    if (app) await app.close();
    app = createAssistantServer({ config, clock: fx.clock,
      fetchImpl: options.fetchImpl || (() => { throw Error('UNEXPECTED_NETWORK'); }) });
    await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(0, '127.0.0.1', resolve); });
    port = app.server.address().port;
  };
  await restart(); t.after(() => app.close());
  const request = (route, { body = {}, method = 'POST', key = BRIDGE_KEY, headers = {}, raw } = {}) => {
    const payload = raw === undefined ? JSON.stringify(body) : raw;
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: route, method,
        headers: { Host: new URL(fx.config.publicOrigin).host, 'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload), ...(key === null ? {} : { Authorization: `Bearer ${key}` }), ...headers } }, res => {
        const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => {
          try { resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
          catch (error) { reject(error); }
        });
      });
      req.on('error', reject); req.end(payload);
    });
  };
  return { ...fx, config, get app() { return app; }, request, restart,
    ask: (body, options = {}) => request('/internal/cabinet/ask', { body, ...options }),
    feedback: (body, options = {}) => request('/internal/cabinet/feedback', { body, ...options }),
    status: (options = {}) => request('/internal/cabinet/status', options) };
}

test('cabinet configuration is disabled by default and cannot reuse public or model credentials', t => {
  const fx = fixture(t);
  assert.equal(fx.config.cabinetBridgeKey, ''); assert.equal(fx.config.cabinetExternalEnabled, false);
  assert.throws(() => loadConfig({ ...fx.env, ASSISTANT_CABINET_BRIDGE_KEY: 'too-short' }), /CONFIG_CABINET_KEY_INVALID/);
  assert.throws(() => loadConfig({ ...fx.env, ASSISTANT_CABINET_BRIDGE_KEY: BRIDGE_KEY, ASSISTANT_PILOT_KEY: BRIDGE_KEY }), /CONFIG_CABINET_KEY_REUSED/);
  assert.throws(() => loadConfig({ ...fx.env, ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }), /CONFIG_CABINET_EXTERNAL_INVALID/);
  assert.throws(() => loadConfig({ ...fx.env, ASSISTANT_CABINET_BRIDGE_KEY: BRIDGE_KEY, ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }), /CONFIG_CABINET_EXTERNAL_INVALID/);
  const api = fixture(t, { api: true });
  assert.throws(() => loadConfig({ ...api.env, ASSISTANT_CABINET_BRIDGE_KEY: BRIDGE_KEY, ASSISTANT_API_KEY: BRIDGE_KEY }, NOW), /CONFIG_CABINET_KEY_REUSED/);
});

test('internal bridge requires its separate key and never makes a browser-origin or cookie exception', async t => {
  const disabled = await start(t, { env: { ASSISTANT_CABINET_BRIDGE_KEY: '' } });
  assert.equal((await disabled.status()).status, 404);
  const fx = await start(t);
  for (const key of [null, 'wrong', fx.config.pilotKey]) assert.equal((await fx.status({ key })).status, 401);
  for (const headers of [{ Origin: fx.config.publicOrigin }, { Cookie: '' }, { 'Sec-Fetch-Site': 'same-origin' },
    { 'Sec-Fetch-Dest': 'empty' }, { Authorization: [`Bearer ${BRIDGE_KEY}`, `Bearer ${BRIDGE_KEY}`] }]) {
    const result = await fx.status({ headers }); assert([401, 403].includes(result.status));
  }
  assert.equal((await fx.status({ headers: { Host: 'invalid.example' } })).status, 403);
  assert.equal((await fx.status({ method: 'GET' })).status, 404);
  assert.equal((await fx.request('/internal/cabinet/reset')).status, 404);
  assert.equal((await fx.request('/api/ask', { body: question() })).status, 403);
  const publicWithOrigin = await fx.request('/api/ask', { body: question(), headers: { Origin: fx.config.publicOrigin } });
  assert.equal(publicWithOrigin.status, 401);
  // Node fetch adds this metadata; no browser-origin/cookie identity is accepted.
  assert.equal((await fx.status({ headers: { 'Sec-Fetch-Mode': 'cors' } })).status, 200);
  assert.equal(fx.app.store.summary().day.requests, 0);
});

test('status reports actual external gates and model price/circuit state without consuming inference', async t => {
  let now = NOW, calls = 0;
  const fx = await start(t, { api: true, clock: () => now,
    env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async () => { calls++; return modelResponse(); } });
  const ready = await fx.status(); assert.equal(ready.data.protocolVersion, 1); assert.equal(ready.data.externalEnabled, true);
  assert.equal(ready.data.profiles.length, 4); assert.equal(ready.headers['set-cookie'], undefined);
  assert(!JSON.stringify(ready.data).includes(BRIDGE_KEY)); assert(!JSON.stringify(ready.data).includes(fx.config.apiKey));
  now += 8 * 86400000; assert.equal((await fx.status()).data.externalEnabled, false);
  now = NOW; fx.app.store.tripCircuit(); assert.equal((await fx.status()).data.externalEnabled, false);
  assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.requests, 0);
});

test('malformed JSON, personal data, foreign profile/topic and unbounded input fail before accounting', async t => {
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' } });
  const otherTopic = listCabinetProfiles().find(value => value.id === 'peterson-decimals').topics[0].id;
  const bad = [question({ subject: 'pupil-login' }), question({ subject: SUBJECT_A.toUpperCase() }),
    question({ requestId: 'request-from-a-name' }), question({ profileId: 'all-pupils' }),
    question({ topic: otherTopic }), question({ question: 'learner@example.test' }),
    question({ question: 'Мой телефон +7 999 123 45 67' }), question({ question: 'x'.repeat(1001) }),
    question({ attempt: BRIDGE_KEY }), question({ question: fx.config.apiKey }),
    question({ question: 'x\u0000y' }), question({ hintLevel: 9 }), question({ externalConsent: 'yes' }),
    question({ simpler: 'yes' }), question({ mode: 'explain' }), question({ model: 'arbitrary-provider' }), question({ history: ['do-not-send'] })];
  for (const body of bad) {
    const result = await fx.ask(body); assert([400, 403, 413].includes(result.status), result.data.error);
  }
  assert.equal((await fx.ask(question(), { raw: '{' })).status, 400);
  assert.equal((await fx.ask(question(), { raw: 'x'.repeat(8193) })).status, 413);
  assert.equal((await fx.status({ body: { subject: SUBJECT_A } })).status, 400);
  assert.equal(fx.app.store.summary().day.requests, 0);
  assert.equal(fx.app.store.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
});

test('source course works through the private bridge with zero model calls even when other API profiles are enabled', async t => {
  let calls = 0;
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' },
    fetchImpl: async () => { calls++; throw Error('No external request allowed for the source course'); } });
  const body = courseQuestion();
  const answer = await fx.ask(body);
  assert.equal(answer.status, 200);
  assert.equal(answer.data.mode, 'offline');
  assert.equal(answer.data.answer.verification, 'curated-guidance');
  assert.deepEqual(answer.data.answer.courseContext, body.courseContext);
  assert.equal(answer.data.answer.courseRevision, body.courseRevision);
  assert.deepEqual(answer.data.answer.steps, ['В каком направлении должна находиться C?']);
  assert.match(answer.data.notice, /Внешняя модель не вызывается/);
  const count = fx.app.store.summary().day.requests;
  for (const extra of [{ externalConsent: true }, { question: 'Forged textbook condition' }, { courseRevision: '0'.repeat(64) },
    { courseContext: { ...body.courseContext, stepIndex: 999 } }, { courseContext: { ...body.courseContext, lessonId: 'atanasyan-7-9-main-161-part-1' } }]) {
    const rejected = await fx.ask(courseQuestion(extra));
    assert(rejected.status >= 400);
  }
  const manual = courseQuestion(); delete manual.courseContext; delete manual.courseRevision;
  assert.equal((await fx.ask(manual)).data.error, 'CABINET_COURSE_INVALID');
  assert.equal(fx.app.store.summary().day.requests, count);
  assert.equal(calls, 0);
  assert.equal(fx.app.store.summary().day.api_requests, 0);
});

test('offline cabinet hints and feedback keep only bounded metadata and isolate subjects', async t => {
  let calls = 0; const fx = await start(t, { fetchImpl: () => { calls++; throw Error('UNEXPECTED'); } });
  const input = question(), first = await fx.ask(input);
  assert.equal(first.status, 200); assert.equal(first.data.mode, 'offline');
  assert.equal(first.data.answer.answerId, first.data.answer.id); assert.equal(first.data.answer.steps.length, 1);
  assert.notEqual(first.data.answer.verification, 'model-unverified'); assert(first.data.notice);
  assert.equal(first.headers['set-cookie'], undefined);
  assert.equal((await fx.feedback({ subject: SUBJECT_A, answerId: first.data.answer.answerId, rating: 'simpler' })).status, 200);
  await fx.ask(question({ subject: SUBJECT_B }));
  assert.equal((await fx.feedback({ subject: SUBJECT_B, answerId: first.data.answer.answerId, rating: 'incorrect' })).status, 404);
  assert.equal(fx.app.store.summary().feedback.find(value => value.rating === 'unclear').count, 1);
  assert.equal(fx.app.store.cabinetSession(SUBJECT_A).simpler, 1);
  assert.equal(fx.app.store.cabinetSession(SUBJECT_B).simpler, 0);
  const db = fs.readFileSync(fx.config.dbPath);
  for (const excluded of [BRIDGE_KEY, SUBJECT_A, SUBJECT_B, input.question, first.data.answer.steps[0]]) assert(!db.includes(Buffer.from(excluded)));
  assert.equal(calls, 0);
});

test('malformed feedback and cabinet pseudonyms cannot cross the browser-session boundary', async t => {
  const fx = await start(t);
  const response = await fx.ask(question()), answerId = response.data.answer.answerId;
  for (const body of [{ subject: SUBJECT_A, answerId }, { subject: SUBJECT_A, answerId, rating: 'unclear' },
    { subject: SUBJECT_A, answerId: 'not-an-answer', rating: 'helpful' },
    { subject: SUBJECT_A, answerId: randomUUID(), rating: 'helpful' },
    { subject: SUBJECT_A, answerId, rating: 'helpful', arbitrary: true }]) {
    assert([400, 404].includes((await fx.feedback(body)).status));
  }
  assert.equal(fx.app.store.summary().feedback.length, 0);
  const forged = await fx.request('/api/topics', { method: 'GET', headers: { Cookie: `mathexam_assistant=cabinet-session:${SUBJECT_A}` } });
  assert.equal(forged.status, 401);
  assert.equal(fx.app.store.summary().day.requests, 1);
});

test('external cabinet generation needs both service opt-in and explicit request consent', async t => {
  let calls = 0;
  const blocked = await start(t, { api: true, fetchImpl: async () => { calls++; return modelResponse(); } });
  assert.equal((await blocked.status()).data.externalEnabled, false);
  assert.equal((await blocked.ask(question({ externalConsent: true }))).data.mode, 'offline');
  const allowed = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async () => { calls++; return modelResponse(); } });
  await allowed.ask(question()); assert.equal(calls, 0);
  const result = await allowed.ask(question({ externalConsent: true }));
  assert.equal(result.status, 200); assert.equal(result.data.answer.verification, 'model-unverified');
  assert.equal(result.data.mode, 'api'); assert.equal(calls, 1);
});

test('paid cabinet payload excludes pupil pseudonym, request ID and authentication; reserve precedes transport', async t => {
  let calls = 0, fx; const input = question({ externalConsent: true });
  fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async (url, opts) => {
    calls++; assert.equal(fx.app.store.summary().day.api_requests, 1);
    assert(fx.app.store.summary().day.reserved_micros > 0);
    assert.equal(url, fx.config.providerUrl); assert.equal(opts.redirect, 'error');
    const body = JSON.parse(opts.body); assert.equal(body.max_tokens, 500); assert.deepEqual(body.thinking, { type: 'disabled' });
    for (const excluded of [SUBJECT_A, input.requestId, BRIDGE_KEY, fx.config.apiKey, fx.config.pilotKey]) assert(!opts.body.includes(excluded));
    return modelResponse();
  } });
  const result = await fx.ask(input); assert.equal(result.status, 200); assert.equal(calls, 1);
  assert.equal(fx.app.store.summary().day.input_tokens, 200);
});

test('supported exact decimal work remains free even with cabinet API and consent enabled', async t => {
  let calls = 0;
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async () => {
    calls++; return modelResponse();
  } });
  const result = await fx.ask(question({ profileId: 'peterson-decimals', topic: 'decimal-add-subtract',
    question: '0,1 + 0,2', mode: 'full', externalConsent: true }));
  assert.equal(result.status, 200); assert.equal(result.data.answer.verification, 'deterministic');
  assert.equal(result.data.answer.complete, true); assert.match(result.data.answer.steps.join(' '), /0,3/);
  assert.equal(result.data.mode, 'offline'); assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.reserved_micros, 0);
});

test('a cabinet prompt above the reserved input ceiling falls back before transport', async t => {
  let calls = 0;
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, configOverrides: { maxInputTokens: 100 },
    fetchImpl: async () => { calls++; return modelResponse(); } });
  const result = await fx.ask(question({ externalConsent: true }));
  assert.equal(result.status, 200); assert.equal(result.data.mode, 'offline'); assert(result.data.notice);
  assert.equal(calls, 0); assert.equal(fx.app.store.summary().day.api_requests, 0);
});

test('replay is rejected after session expiry, cleanup, UTC rollover and a process restart', async t => {
  let now = NOW, calls = 0;
  const fx = await start(t, { api: true, clock: () => now, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' },
    fetchImpl: async () => { calls++; throw Error('synthetic-upstream-error'); } });
  const body = question({ externalConsent: true });
  const result = await fx.ask(body); assert.equal(result.status, 200); assert(result.data.notice);
  const reserved = fx.app.store.summary().month.reserved_micros; assert(reserved > 0);
  assert.equal((await fx.ask(body)).status, 409);
  assert.equal((await fx.ask({ ...body, subject: SUBJECT_B })).status, 409);
  assert.equal((await fx.ask({ ...body, requestId: body.requestId.toUpperCase() })).status, 409);
  now += 86400000; fx.app.store.cleanup(); await fx.restart();
  assert.equal((await fx.ask(body)).status, 409); assert.equal(calls, 1);
  assert.equal(fx.app.store.summary().month.reserved_micros, reserved);
  assert.equal(fx.app.store.db.prepare('SELECT COUNT(*) AS n FROM cabinet_request_tombstones').get().n, 1);
  assert(!fs.readFileSync(fx.config.dbPath).includes(Buffer.from('synthetic-upstream-error')));
});

test('concurrent duplicate requests cannot send two model calls', { timeout: 5000 }, async t => {
  let release, entered, calls = 0;
  const started = new Promise(resolve => { entered = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async () => {
    calls++; entered(); await wait; return modelResponse();
  } });
  const body = question({ externalConsent: true }), first = fx.ask(body);
  try {
    await Promise.race([started, first.then(result => { throw Error(`First request did not reach transport: ${result.status} ${result.data.error}`); })]);
    assert.equal((await fx.ask(body)).status, 409); assert.equal(calls, 1);
  } finally { release(); }
  assert.equal((await first).status, 200);
  assert.equal(fx.app.store.summary().day.api_requests, 1);
});

test('bridge shares global spend limits; provider usage violations durably stop further paid calls', async t => {
  let calls = 0;
  const blocked = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1', ASSISTANT_DAILY_BUDGET: '0.000001' },
    fetchImpl: async () => { calls++; return modelResponse(); } });
  const noBudget = await blocked.ask(question({ externalConsent: true })); assert.equal(noBudget.status, 200); assert(noBudget.data.notice); assert.equal(calls, 0);
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async () => {
    calls++; return modelResponse({ usage: { prompt_tokens: 1000000, completion_tokens: 1000000 } });
  } });
  for (const subject of [SUBJECT_A, SUBJECT_B]) {
    const result = await fx.ask(question({ subject, externalConsent: true })); assert.equal(result.status, 200); assert(result.data.notice);
  }
  assert.equal(calls, 1); assert.equal((await fx.status()).data.externalEnabled, false);
  await fx.restart(); assert.equal((await fx.status()).data.externalEnabled, false);
});

test('a provider echo of any service credential is rejected and never stored or returned', async t => {
  let credential = BRIDGE_KEY, calls = 0;
  const fx = await start(t, { api: true, env: { ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' }, fetchImpl: async () => {
    calls++; return modelResponse({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
      title: 'Один шаг', text: credential, steps: ['Сравни данные.'], check: 'Проверь условие.'
    }) } }] });
  } });
  for (const value of [BRIDGE_KEY, fx.config.pilotKey, fx.config.apiKey]) {
    credential = value;
    const result = await fx.ask(question({ externalConsent: true })); assert.equal(result.status, 200);
    assert.notEqual(result.data.answer.verification, 'model-unverified'); assert(result.data.notice);
    assert(!JSON.stringify(result.data).includes(value)); assert(!fs.readFileSync(fx.config.dbPath).includes(Buffer.from(value)));
  }
  assert.equal(calls, 3); assert.equal(fx.app.store.summary().day.api_requests, 3);
});
