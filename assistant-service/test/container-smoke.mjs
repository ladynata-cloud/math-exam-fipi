import http from 'node:http';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const port = Number(process.env.ASSISTANT_CONTAINER_TEST_PORT || 43128);
const name = process.env.ASSISTANT_CONTAINER_TEST_NAME || 'mathexam-assistant-test';
const pilotKey = process.env.ASSISTANT_CONTAINER_TEST_KEY;
assert(pilotKey && port > 1024 && port < 65536);
assert(/^[a-z0-9-]{1,60}$/.test(name));
const origin = 'https://assistant.example.test';
function request(route, method = 'GET', body, session) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers: {
      Host: 'assistant.example.test', Origin: origin,
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(session ? { Cookie: session.cookie, 'X-Assistant-CSRF': session.csrf } : {})
    } }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(Buffer.concat(chunks)) }); }
        catch (error) { reject(error); }
      });
    });
    req.on('error', reject); req.setTimeout(3000, () => req.destroy(new Error('LOCAL_CONTAINER_TIMEOUT'))); req.end(payload);
  });
}
async function ready() {
  for (let i = 0; i < 30; i++) {
    try { if ((await request('/healthz')).status === 200) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('LOCAL_CONTAINER_NOT_READY');
}
await ready();
assert.equal((await request('/api/topics')).status, 401);
const login = await request('/api/session', 'POST', { pilotKey });
assert.equal(login.status, 201); assert.match(login.headers['set-cookie'][0], /Secure/);
const session = { cookie: login.headers['set-cookie'][0].split(';')[0], csrf: login.data.csrf };
const body = { topic: 'fractions', question: '1/2 + 1/3', attempt: '', mode: 'explain', hintLevel: 5,
  externalConsent: false, requestId: randomUUID() };
const answer = await request('/api/ask', 'POST', body, session);
assert.equal(answer.status, 200); assert.match(answer.data.answer.steps.join(' '), /5\/6/);
assert.equal((await request('/api/feedback', 'POST', { answerId: answer.data.answer.id, rating: 'unclear' }, session)).status, 200);
assert.equal(execFileSync('docker', ['exec', name, 'id', '-u'], { encoding: 'utf8' }).trim(), '1000');
execFileSync('docker', ['exec', name, 'node', 'src/operator.js', 'backup', '/data/verified-backup.sqlite'], { stdio: 'pipe' });
execFileSync('docker', ['restart', name], { stdio: 'pipe' }); await ready();
assert.equal((await request('/api/topics', 'GET', undefined, session)).status, 200, 'Session must survive a container restart.');
assert.equal((await request('/api/ask', 'POST', body, session)).status, 409, 'Committed request IDs must survive restart.');
const status = JSON.parse(execFileSync('docker', ['exec', name, 'node', 'src/operator.js', 'status'], { encoding: 'utf8' }));
// Read all persisted daily buckets: restart may cross UTC midnight. Monthly
// aggregates duplicate the daily counts and must not be included in this sum.
const persistedUsage = JSON.parse(execFileSync('docker', ['exec', name, 'node', '--input-type=module', '-e', `
  import { DatabaseSync } from 'node:sqlite';
  const db = new DatabaseSync(process.env.ASSISTANT_DB_PATH, { readOnly: true });
  try {
    console.log(JSON.stringify(db.prepare(
      'SELECT COALESCE(SUM(requests), 0) AS requests, COALESCE(SUM(api_requests), 0) AS api_requests FROM usage_totals WHERE length(period)=10'
    ).get()));
  } finally { db.close(); }
`], { encoding: 'utf8' }));
assert.equal(persistedUsage.requests, 1, 'The committed daily request count must survive restart, including UTC midnight.');
assert.equal(persistedUsage.api_requests, 0, 'The offline smoke test must never reserve a model API call.');
assert.equal(status.feedback[0].count, 1);
assert.equal((await request('/api/session', 'DELETE', undefined, session)).status, 200);
assert.equal((await request('/api/topics', 'GET', undefined, session)).status, 401);
console.log('ASSISTANT_CONTAINER_OK: nonroot, private API, exact math, durable restart, backup, deletion, zero model calls');
