import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hash } from '../src/store.js';
import { getBuiltinKnowledge } from '../src/tutor.js';
import { fixture, NOW } from './helpers.js';

test('session secrets are hashed, expire and csrf validation cannot use another session', t => {
  let now = NOW; const fx = fixture(t, { clock: () => now }); const store = fx.makeStore(); t.after(() => store.close());
  const a = store.createSession(), b = store.createSession(); const session = store.session(a.token);
  assert.notEqual(session.hash, a.token); assert.notEqual(session.csrf_hash, a.csrf);
  assert.doesNotThrow(() => store.verifyCsrf(session, a.csrf)); assert.throws(() => store.verifyCsrf(session, b.csrf));
  assert.throws(() => store.session('fabricated'));
  now += 3600001; assert.throws(() => store.session(a.token)); store.cleanup();
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
});
test('atomic reservations survive failure and restart; duplicates never spend twice', t => {
  const fx = fixture(t, { api: true, env: { ASSISTANT_DAILY_BUDGET: '0.001', ASSISTANT_MONTHLY_BUDGET: '0.002' } });
  let store = fx.makeStore(); const session = store.createSession(), requestId = randomUUID();
  const reservation = store.reserve({ sessionHash: hash(session.token), requestId, kind: 'api', reservedMicros: 700, inputBound: 100 });
  assert.throws(() => store.reserve({ sessionHash: hash(session.token), requestId, kind: 'api', reservedMicros: 700, inputBound: 100 }), /REQUEST_ALREADY_USED/);
  store.fail(reservation); store.close(); store = fx.makeStore(); t.after(() => store.close());
  assert.equal(store.summary().day.reserved_micros, 700);
  assert.throws(() => store.reserve({ sessionHash: hash(session.token), requestId: randomUUID(), kind: 'api', reservedMicros: 400, inputBound: 100 }), /BUDGET_EXHAUSTED/);
  assert.equal(store.summary().day.reserved_micros, 700);
});
test('two database connections cannot oversubscribe the shared daily limit', t => {
  const fx = fixture(t, { api: true, env: { ASSISTANT_DAILY_BUDGET: '0.001' } });
  const a = fx.makeStore(), b = fx.makeStore(); t.after(() => { a.close(); b.close(); });
  const sa = a.createSession(), sb = b.createSession();
  a.reserve({ sessionHash: hash(sa.token), requestId: randomUUID(), kind: 'api', reservedMicros: 800, inputBound: 100 });
  assert.throws(() => b.reserve({ sessionHash: hash(sb.token), requestId: randomUUID(), kind: 'api', reservedMicros: 800, inputBound: 100 }), /BUDGET_EXHAUSTED/);
  assert.equal(b.summary().day.reserved_micros, 800);
});
test('in-flight concurrency cannot be reset by deleting a session', t => {
  const fx = fixture(t, { api: true, env: { ASSISTANT_CONCURRENCY: '1' } }); const store = fx.makeStore(); t.after(() => store.close());
  const a = store.createSession(); store.reserve({ sessionHash: hash(a.token), requestId: randomUUID(), kind: 'api', reservedMicros: 100, inputBound: 100 });
  store.deleteSession(hash(a.token)); const b = store.createSession();
  assert.throws(() => store.reserve({ sessionHash: hash(b.token), requestId: randomUUID(), kind: 'api', reservedMicros: 100, inputBound: 100 }), /PROVIDER_BUSY/);
  assert.equal(store.summary().day.reserved_micros, 100);
});
test('global and monthly limits do not reset with a new session or next day', t => {
  let now = NOW; const fx = fixture(t, { api: true, clock: () => now,
    env: { ASSISTANT_DAILY_BUDGET: '0.001', ASSISTANT_MONTHLY_BUDGET: '0.001' } });
  const store = fx.makeStore(); t.after(() => store.close());
  const a = store.createSession(); store.reserve({ sessionHash: hash(a.token), requestId: randomUUID(), kind: 'api', reservedMicros: 800, inputBound: 100 });
  now += 86400000; store.cleanup(); const b = store.createSession();
  assert.equal(store.summary().day.reserved_micros, 0);
  assert.throws(() => store.reserve({ sessionHash: hash(b.token), requestId: randomUUID(), kind: 'api', reservedMicros: 800, inputBound: 100 }), /BUDGET_EXHAUSTED/);
});
test('feedback is scoped, deduplicated, simplifies next answer and explicit deletion removes it', t => {
  const fx = fixture(t); const store = fx.makeStore(); t.after(() => store.close());
  const a = store.createSession(), b = store.createSession(), sessionHash = hash(a.token);
  const reservation = store.reserve({ sessionHash, requestId: randomUUID() });
  const answer = store.finish(reservation, sessionHash, { topic: 'fractions', verification: 'deterministic', text: 'not persisted' });
  assert.throws(() => store.feedback(hash(b.token), answer.id, 'unclear'), /ANSWER_NOT_FOUND/);
  store.feedback(sessionHash, answer.id, 'unclear'); store.feedback(sessionHash, answer.id, 'unclear');
  assert.equal(store.summary().feedback[0].count, 1); assert.equal(store.session(a.token).simpler, 1);
  store.feedback(sessionHash, answer.id, 'helpful');
  assert.equal(store.summary().feedback.length, 1); assert.equal(store.summary().feedback[0].rating, 'helpful');
  store.deleteSession(sessionHash); assert.equal(store.summary().feedback.length, 0);
  assert.equal(store.summary().day.requests, 1); assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM answers').get().n, 0);
  assert.equal(fs.readFileSync(fx.config.dbPath).includes(Buffer.from('not persisted')), false);
});
test('expired session feedback becomes anonymous totals; retention purges them', t => {
  let now = NOW; const fx = fixture(t, { clock: () => now }); const store = fx.makeStore(); t.after(() => store.close());
  const a = store.createSession(), sessionHash = hash(a.token);
  const answer = store.finish(store.reserve({ sessionHash, requestId: randomUUID() }), sessionHash, { topic: 'fractions', verification: 'deterministic' });
  store.feedback(sessionHash, answer.id, 'incorrect'); now += 3600001; store.cleanup();
  assert.equal(store.summary().feedback[0].count, 1); assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM answers').get().n, 0);
  now += 31 * 86400000; store.cleanup(); assert.equal(store.summary().feedback.length, 0);
});
test('unreviewed knowledge is isolated; approve is explicit, immutable and restored from backup', async t => {
  const fx = fixture(t); let store = fx.makeStore();
  const card = getBuiltinKnowledge()[0], changed = { ...card, explanation: 'Проверенное оператором новое объяснение равенства.' };
  const id = store.propose(changed); assert.equal(store.knowledge(card.topic)[0].explanation, card.explanation);
  assert.throws(() => store.review(id, 'approve', 'real name@example.test'));
  const approved = store.review(id, 'approve', 'teacher'); assert.equal(approved.version, 2);
  assert.equal(store.knowledge(card.topic)[0].explanation, changed.explanation);
  assert.throws(() => store.review(id, 'approve', 'teacher'), /CANDIDATE_NOT_FOUND/);
  const backupPath = path.join(fx.directory, 'backup.sqlite'); await store.backupTo(backupPath); store.close();
  fs.copyFileSync(backupPath, fx.config.dbPath); store = fx.makeStore(); t.after(() => store.close());
  assert.equal(store.knowledge(card.topic)[0].version, 2);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM knowledge_revisions').get().n, 1);
  const invalid = { ...card, source: { label: 'source', url: 'https://evil.example/data' } };
  assert.throws(() => store.propose(invalid), /KNOWLEDGE_SOURCE_INVALID/);
});
test('explicitly reviewed new cards enter retrieval before builtins; pending cards never do', t => {
  const fx = fixture(t); const store = fx.makeStore(); t.after(() => store.close());
  const card = { ...getBuiltinKnowledge()[0], id: 'new-reviewed-equation-card', explanation: 'Одинаковое действие сохраняет равенство двух частей.' };
  const id = store.propose(card); assert.equal(store.knowledge(card.topic).some(value => value.id === card.id), false);
  store.review(id, 'approve', 'teacher'); assert.equal(store.knowledge(card.topic)[0].id, card.id);
});
test('feedback rechecks session expiry inside the write transaction', t => {
  let now = NOW; const fx = fixture(t, { clock: () => now }); const store = fx.makeStore(); t.after(() => store.close());
  const session = store.createSession(), sessionHash = hash(session.token);
  const answer = store.finish(store.reserve({ sessionHash, requestId: randomUUID() }), sessionHash, { topic: 'fractions', verification: 'deterministic' });
  now += 3600001;
  assert.throws(() => store.feedback(sessionHash, answer.id, 'unclear'), /SESSION_REQUIRED/);
  assert.equal(store.summary().feedback.length, 0);
});
test('backup exists with private permissions from the beginning of the asynchronous copy', async t => {
  const fx = fixture(t); const store = fx.makeStore(); t.after(() => store.close());
  const filename = path.join(fx.directory, 'secure-copy.sqlite');
  const pending = store.backupTo(filename);
  assert.equal(fs.statSync(filename).mode & 0o777, 0o600);
  await pending; assert.equal(fs.statSync(filename).mode & 0o777, 0o600);
});
test('spending currency and circuit breaker persist across restarts', t => {
  const fx = fixture(t, { api: true }); let store = fx.makeStore();
  store.tripCircuit(); store.close(); store = fx.makeStore(); t.after(() => store.close());
  assert.equal(store.summary().providerCircuit, 'PROVIDER_CONTRACT_CHANGED');
  const s = store.createSession(); assert.throws(() => store.reserve({ sessionHash: hash(s.token), requestId: randomUUID(), kind: 'api', reservedMicros: 100 }), /PROVIDER_DISABLED/);
});
