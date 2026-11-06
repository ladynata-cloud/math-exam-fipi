import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createAssistantServer } from '../src/server.js';
import { fixture, modelResponse } from './helpers.js';
const BRIDGE = 'test-only-math-verification-bridge-key-cccccccccccc';

test('real cabinet HTTP rejects wrong follow-up math, retains reserve and restart replay protection', async t => {
  const fx = fixture(t, { api: true, env: { ASSISTANT_CABINET_BRIDGE_KEY: BRIDGE, ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' } });
  let app, port, calls = 0;
  async function start() {
    app = createAssistantServer({ config: fx.config, clock: fx.clock, fetchImpl: async () => {
      calls++;
      return modelResponse({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        title: 'Деление', text: 'Сдвинем запятую.', steps: ['360/12=31', 'Ответ: 30'], check: 'Проверь.'
      }) } }] });
    } });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); port = app.server.address().port;
  }
  await start(); t.after(() => app.close());
  function ask(body) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const req = http.request({ hostname: '127.0.0.1', port, path: '/internal/cabinet/ask', method: 'POST',
        headers: { Host: new URL(fx.config.publicOrigin).host, Authorization: `Bearer ${BRIDGE}`,
          'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
        let text = ''; res.on('data', d => { text += d; });
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(text) }));
      }); req.on('error', reject); req.end(payload);
    });
  }
  const body = { subject: 'c'.repeat(64), requestId: randomUUID(), profileId: 'peterson-decimals',
    topic: 'decimal-divide', question: '3,6 : 0,12', attempt: '', mode: 'full', hintLevel: 1, simpler: false, externalConsent: true };
  const offline = await ask(body);
  assert.equal(offline.status, 200); assert.equal(offline.data.answer.verification, 'deterministic'); assert.equal(calls, 0);
  const { title, text, steps, check } = offline.data.answer;
  const followup = { ...body, requestId: randomUUID(), dialogue: { question: 'Почему делим так?',
    turns: [{ question: body.question, answer: { title, text, steps, check } }] } };
  const response = await ask(followup);
  assert.equal(response.status, 200); assert.equal(response.data.mode, 'offline');
  assert.equal(response.data.answer.verification, 'deterministic'); assert.equal(calls, 1);
  assert(!JSON.stringify(response.data.answer).includes('360/12=31'));
  assert.match(response.data.notice, /Повторного платного запроса не было/);
  const reserved = app.store.summary().day.reserved_micros;
  assert(reserved > 0); assert.equal(app.store.summary().day.api_requests, 1);
  await app.close(); await start();
  assert.equal((await ask(followup)).status, 409); assert.equal(calls, 1);
  assert.equal(app.store.summary().day.reserved_micros, reserved);
});
