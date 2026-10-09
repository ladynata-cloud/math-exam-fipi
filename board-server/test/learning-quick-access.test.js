'use strict';

// Real local HTTP and SQLite. Every account, token and credential is synthetic.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomBytes, randomUUID } = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { hashPassword, tokenHash } = require('../learning-auth');
const contracts = require('../learning-contracts');
const ORIGIN = 'https://cabinet.example.test', DAY = 86400000;
const PASSWORD = 'synthetic quick access password';
const hashed = hashPassword(PASSWORD);
const secret = () => randomBytes(32).toString('base64url');

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-quick-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1800000000000;
  const store = new LearningStore({ filePath, contracts, clock: () => now }); assert(store.available);
  const teacher = store.activate(store.bootstrap({ login: 'quick_teacher', name: 'Fixture teacher' }).invitationToken, await hashed);
  const pending = store.createStudent(teacher.account, { login: 'quick_pending', name: 'Fixture pending pupil' });
  const student = store.createSession(store.createStudent(teacher.account, { login: 'quick_pupil', name: 'Fixture pupil' }, await hashed).student.id);
  const peer = store.createSession(store.createStudent(teacher.account, { login: 'quick_peer', name: 'Fixture peer' }, await hashed).student.id);
  const api = createLearningApi({ store, clock: () => now, publicOrigin: ORIGIN, secureCookies: true });
  const app = express(); app.use(express.json()); app.use('/api/learning', api.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  async function request(route, body, session = teacher, extra = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning${route}`, {
      method: body === undefined ? 'GET' : 'POST', headers: {
        ...(session ? { Cookie: session.cookie || '__Host-mathexam_learning=' + session.sessionToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': session.body?.csrfToken || tokenHash('learning-csrf:' + session.sessionToken) } : {}) }), ...extra
      }, ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json(), headers: response.headers,
      cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const route = id => '/teacher/students/' + id + '/quick-access';
  async function issue(id = pending.student.id) {
    const before = await request(route(id)); assert.equal(before.status, 200);
    const result = await request(route(id), { expectedVersion: before.body.quickAccess.version }); assert.equal(result.status, 200);
    return result.body;
  }
  const login = token => request('/quick-login', { token }, null);
  return { store, filePath, api, teacher, student, peer, pending, request, route, issue, login, now: () => now, advance: ms => { now += ms; } };
}

test('pending pupil uses the same 30-day QR on phone and laptop without any password hash or invitation activation', async t => {
  const f = await fixture(t), id = f.pending.student.id, before = f.store.account(id);
  const issued = await f.issue(); assert.match(issued.quickToken, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(issued.quickAccess, { active: true, expiresAt: f.now() + 30 * DAY, version: 1 });
  const phone = await f.login(issued.quickToken), laptop = await f.login(issued.quickToken);
  for (const client of [phone, laptop]) {
    assert.equal(client.status, 200); assert.equal(client.body.account.id, id);
    assert.equal(client.body.account.active, true); assert.equal(client.body.account.passwordReady, false);
    assert.match(client.headers.get('set-cookie'), /HttpOnly; SameSite=Strict; Secure/);
    assert.equal((await f.request('/session', undefined, client)).status, 200);
    assert(!JSON.stringify(client.body).includes(issued.quickToken));
  }
  assert.notEqual(phone.cookie, laptop.cookie); assert.deepEqual(f.store.account(id), before);
  assert.equal(f.store.account(id).password_hash, null);
  assert.equal(f.store.invitation(f.pending.invitationToken).used_at, null);
  const roster = (await f.request('/teacher/students')).body.students.find(row => row.id === id);
  assert.equal(roster.active, true); assert.equal(roster.passwordReady, false); assert.deepEqual(roster.quickAccess, issued.quickAccess);
  const attempt = await f.request('/attempts', { opId: randomUUID(), trainerId: 'ege-path', contentId: 'equations-linear', fresh: false }, phone);
  assert.equal(attempt.status, 201);
  assert.equal((await f.request('/attempts/' + attempt.body.attempt.id, undefined, laptop)).status, 200);
  assert.equal((await f.request('/attempts/' + attempt.body.attempt.id, undefined, f.peer)).status, 404);
});

test('rotation and revocation remove prior QR sessions only, preserving password sessions and learning history', async t => {
  const f = await fixture(t), id = f.student.account.id, path = f.route(id), account = f.store.account(id);
  const attempt = f.store.newAttempt(id, f.teacher.account.id, 'ege-path', contracts.create('ege-path', 'equations-linear', 44));
  const first = await f.issue(id), phone = await f.login(first.quickToken), laptop = await f.login(first.quickToken);
  const rotated = await f.request(path, { expectedVersion: first.quickAccess.version });
  assert.equal(rotated.status, 200); assert.equal(rotated.body.quickAccess.version, 2);
  for (const client of [phone, laptop]) assert.equal((await f.request('/session', undefined, client)).status, 401);
  assert.equal((await f.login(first.quickToken)).status, 401);
  for (const client of [f.teacher, f.student, f.peer]) assert.equal((await f.request('/session', undefined, client)).status, 200);
  const current = await f.login(rotated.body.quickToken); assert.equal(current.status, 200);
  const revoked = await f.request(path + '/revoke', { expectedVersion: 2 });
  assert.deepEqual(revoked.body, { quickAccess: { active: false, expiresAt: null, version: 3 } });
  assert.equal((await f.request('/session', undefined, current)).status, 401);
  assert.equal((await f.login(rotated.body.quickToken)).status, 401);
  assert.deepEqual(f.store.account(id), account); assert.deepEqual(f.store.getAttempt(f.student.account, attempt.id), attempt);
  assert.equal((await f.request('/session', undefined, f.student)).status, 200);
  assert.equal(f.store.row('SELECT COUNT(*) n FROM learning_quick_sessions').n, 0);
});

test('teacher ownership, CSRF, exact request shapes and student-only targets protect key management', async t => {
  const f = await fixture(t), path = f.route(f.pending.student.id), body = { expectedVersion: 0 };
  for (const endpoint of [path, path + '/revoke']) {
    assert.equal((await f.request(endpoint, body, null)).status, 401);
    assert.equal((await f.request(endpoint, body, f.student)).status, 403);
    assert.equal((await f.request(endpoint, body, f.teacher, { Origin: 'https://other.example.test' })).status, 403);
    assert.equal((await f.request(endpoint, body, f.teacher, { 'X-CSRF-Token': 'bad' })).status, 403);
    assert.equal((await f.request(endpoint, body, f.teacher, { 'Content-Type': 'text/plain' })).status, 415);
  }
  assert.equal((await f.request(path, undefined, f.student)).status, 403);
  assert.equal((await f.request(path + '?token=anything')).status, 400);
  for (const invalid of [{}, { expectedVersion: -1 }, { expectedVersion: '0' }, { expectedVersion: 0.5 },
    { expectedVersion: Number.MAX_SAFE_INTEGER }, { ...body, role: 'teacher' }, { ...body, opId: randomUUID() }]) {
    assert.equal((await f.request(path, invalid)).status, 400);
  }
  assert.equal((await f.request(f.route(f.teacher.account.id), body)).status, 404);
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', 'other_teacher_fixture', f.pending.student.id);
  assert.equal((await f.request(path)).status, 404);
  assert.equal((await f.request(path, body)).status, 404);
  assert.equal(f.store.row('SELECT COUNT(*) n FROM learning_quick_access').n, 0);
});

test('a signed-in browser cannot be silently switched; exchange requires exact same-origin JSON', async t => {
  const f = await fixture(t), issued = await f.issue(), client = await f.login(issued.quickToken);
  for (const actor of [f.teacher, f.student, f.peer, client]) {
    const result = await f.request('/quick-login', { token: issued.quickToken }, actor);
    assert.equal(result.status, 409); assert.equal(result.body.error, 'LEARNING_ALREADY_SIGNED_IN'); assert.equal(result.cookie, undefined);
  }
  const duplicateCookie = '__Host-mathexam_learning=bad; __Host-mathexam_learning=' + f.teacher.sessionToken;
  assert.equal((await f.request('/quick-login', { token: issued.quickToken }, null, { Cookie: duplicateCookie })).status, 409);
  assert.equal((await f.request('/quick-login', { token: issued.quickToken }, null, { Origin: 'https://other.example.test' })).status, 403);
  assert.equal((await f.request('/quick-login', { token: issued.quickToken }, null, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await f.request('/quick-login', { token: issued.quickToken, login: f.student.account.login }, null)).status, 400);
  assert.equal((await f.request('/quick-login?token=anything', { token: issued.quickToken }, null)).status, 400);
  assert.equal((await f.request('/session')).body.account.id, f.teacher.account.id);
  const recovered = await f.request('/quick-login', { token: issued.quickToken }, null, { Cookie: '__Host-mathexam_learning=' + secret() });
  assert.equal(recovered.status, 200, 'A revoked or expired cookie does not block a fresh QR login');
});

test('CAS fences duplicate/lost issuance and concurrent screens; revoked keys retain a version tombstone', async t => {
  const f = await fixture(t), path = f.route(f.pending.student.id), body = { expectedVersion: 0 };
  const competing = await Promise.all([f.request(path, body), f.request(path, body)]);
  assert.deepEqual(competing.map(r => r.status).sort(), [200, 409]);
  const issued = competing.find(r => r.status === 200).body;
  const lostRetry = await f.request(path, body);
  assert.equal(lostRetry.body.error, 'LEARNING_QUICK_CONFLICT'); assert(!Object.hasOwn(lostRetry.body, 'quickToken'));
  assert.equal((await f.login(issued.quickToken)).status, 200);
  assert.deepEqual((await f.request(path)).body, { quickAccess: issued.quickAccess });
  assert.equal((await f.request(path + '/revoke', { expectedVersion: 1 })).status, 200);
  assert.equal((await f.request(path, body)).status, 409);
  assert.equal((await f.request(path + '/revoke', { expectedVersion: 1 })).status, 409);
  assert.deepEqual((await f.request(path)).body.quickAccess, { active: false, expiresAt: null, version: 2 });
  assert.equal(f.store.row('SELECT COUNT(*) n FROM operations').n, 0);
});

test('expiry bounds new sessions and is checked again on every request', async t => {
  const f = await fixture(t), issued = await f.issue();
  f.advance(29 * DAY);
  const client = await f.login(issued.quickToken); assert.equal(client.status, 200);
  const sessionHash = tokenHash(client.cookie.split('=')[1]);
  assert.equal(f.store.row('SELECT expires_at FROM sessions WHERE hash=?', sessionHash).expires_at, issued.quickAccess.expiresAt);
  const laterTeacher = f.store.createSession(f.teacher.account.id);
  f.advance(DAY);
  assert.equal((await f.request('/session', undefined, client)).status, 401);
  assert.equal((await f.login(issued.quickToken)).status, 401);
  const status = await f.request(f.route(f.pending.student.id), undefined, laterTeacher);
  assert.equal(status.body.quickAccess.active, false); assert.equal(status.body.quickAccess.version, 1);
  assert.equal(status.body.quickAccess.expiresAt, issued.quickAccess.expiresAt);
});

test('password change invalidates the QR and its version; the original activation invitation stays coherent', async t => {
  const f = await fixture(t), pendingId = f.pending.student.id, issued = await f.issue(), client = await f.login(issued.quickToken);
  const activated = await f.request('/activate', { token: f.pending.invitationToken, password: PASSWORD }, null);
  assert.equal(activated.status, 200); assert.equal(activated.body.account.id, pendingId);
  assert.equal((await f.login(issued.quickToken)).status, 401);
  assert.equal((await f.request('/session', undefined, client)).status, 401);
  assert.equal((await f.request(f.route(pendingId), { expectedVersion: 1 })).status, 409);
  assert.equal((await f.request(f.route(pendingId))).body.quickAccess.version, 2);
  const after = await f.issue(pendingId), qr = await f.login(after.quickToken);
  assert.equal(qr.body.account.passwordReady, true);
  const changed = await f.request('/teacher/students/' + pendingId + '/password', { password: 'replacement synthetic password' });
  assert.equal(changed.status, 200);
  assert.equal((await f.login(after.quickToken)).status, 401);
  assert.equal((await f.request(f.route(pendingId), { expectedVersion: after.quickAccess.version })).status, 409);
  assert.equal((await f.request('/session')).status, 200);
});

test('missing grants cannot fall through to password authentication and tokens cannot cross invitation or teacher boundaries', async t => {
  const f = await fixture(t), issued = await f.issue(f.student.account.id), client = await f.login(issued.quickToken);
  assert.equal((await f.login(f.pending.invitationToken)).status, 401);
  assert.equal((await f.request('/activate', { token: issued.quickToken, password: PASSWORD }, null)).status, 401);
  f.store.run('DELETE FROM learning_quick_access WHERE account_id=?', f.student.account.id);
  assert.equal(f.store.row('SELECT COUNT(*) n FROM learning_quick_sessions').n, 1, 'Binding survives grant deletion');
  assert.equal((await f.request('/session', undefined, client)).status, 401);
  assert.equal((await f.request('/session', undefined, f.student)).status, 200);
  const forged = secret(), teacher = f.store.account(f.teacher.account.id);
  f.store.run('INSERT INTO learning_quick_access VALUES(?,?,?,?,?,?)', teacher.id, tokenHash(forged), teacher.auth_epoch, f.now() + DAY, 1, f.now());
  assert.equal((await f.login(forged)).status, 401, 'Even an invalid internal teacher grant cannot authenticate a teacher');
});

test('grant and session transactions roll back together on write failure, with generic errors', async t => {
  const f = await fixture(t), issued = await f.issue(), client = await f.login(issued.quickToken);
  const original = f.store.run.bind(f.store);
  f.store.run = (sql, ...args) => { if (sql.startsWith('INSERT INTO learning_quick_access')) throw Error('Synthetic grant write failure'); return original(sql, ...args); };
  const failed = await f.request(f.route(f.pending.student.id), { expectedVersion: 1 });
  f.store.run = original;
  assert.equal(failed.status, 500); assert.equal(failed.body.error, 'LEARNING_INTERNAL_ERROR');
  assert.equal((await f.request('/session', undefined, client)).status, 200);
  assert.deepEqual((await f.request(f.route(f.pending.student.id))).body.quickAccess, issued.quickAccess);
  const count = f.store.row('SELECT COUNT(*) n FROM sessions').n;
  f.store.run = (sql, ...args) => { if (sql.startsWith('INSERT INTO learning_quick_sessions')) throw Error('Synthetic binding write failure'); return original(sql, ...args); };
  const bindingFailure = await f.login(issued.quickToken); f.store.run = original;
  assert.equal(bindingFailure.status, 500); assert.equal(f.store.row('SELECT COUNT(*) n FROM sessions').n, count);
  f.store.logout(f.teacher.sessionToken);
  assert.throws(() => f.store.writeStudentQuickAccess(f.teacher.sessionToken, f.pending.student.id, { expectedVersion: 1 }), { code: 'LEARNING_UNAUTHORIZED' });
});

test('raw keys never enter SQLite and grants, bindings, pending access and CAS survive reopening', async t => {
  const f = await fixture(t), issued = await f.issue(), client = await f.login(issued.quickToken);
  assert.equal(f.store.row('SELECT hash FROM learning_quick_access WHERE account_id=?', f.pending.student.id).hash, tokenHash(issued.quickToken));
  assert(!JSON.stringify(f.store.rows('SELECT * FROM operations')).includes(issued.quickToken));
  f.store.close(); assert(!fs.readFileSync(f.filePath).includes(Buffer.from(issued.quickToken)));
  const restored = new LearningStore({ filePath: f.filePath, contracts, clock: f.now });
  try {
    assert(restored.available); assert.equal(restored.row('PRAGMA user_version').user_version, 1);
    assert.equal(restored.session(client.cookie.split('=')[1]).id, f.pending.student.id);
    assert.equal(restored.quickLogin(issued.quickToken).account.passwordReady, false);
    assert.equal(restored.account(f.pending.student.id).password_hash, null);
    assert.equal(restored.studentQuickAccess(restored.session(f.teacher.sessionToken), f.pending.student.id).version, 1);
    assert.throws(() => restored.writeStudentQuickAccess(f.teacher.sessionToken, f.pending.student.id, { expectedVersion: 0 }), { code: 'LEARNING_QUICK_CONFLICT' });
  } finally { restored.close(); }
});

test('additive schema migration retains four-column legacy sessions and their authentication', async t => {
  const f = await fixture(t), accounts = f.store.rows('SELECT * FROM accounts');
  f.store.db.exec('DROP TABLE learning_quick_sessions; DROP TABLE learning_quick_access;'); f.store.close();
  const restored = new LearningStore({ filePath: f.filePath, clock: f.now });
  try {
    assert(restored.available); assert.equal(restored.rows('PRAGMA table_info(sessions)').length, 4);
    assert.deepEqual(restored.rows('SELECT * FROM accounts'), accounts);
    assert.equal(restored.session(f.teacher.sessionToken).role, 'teacher');
    const raw = secret(), pupil = restored.account(f.student.account.id);
    restored.run('INSERT INTO sessions VALUES(?,?,?,?)', tokenHash(raw), pupil.id, pupil.auth_epoch, f.now() + DAY);
    assert.equal(restored.session(raw).id, pupil.id, 'Legacy INSERT shape remains compatible');
  } finally { restored.close(); }
});

test('anonymous guessing and repeated key changes are rate limited without storing raw request tokens', async t => {
  const f = await fixture(t), bad = secret();
  for (let i = 0; i < 8; i++) assert.equal((await f.login(bad)).status, 401);
  const limited = await f.login(bad); assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '60');
  const path = f.route(f.pending.student.id);
  for (let i = 0; i < 12; i++) assert.equal((await f.request(path + '/revoke', { expectedVersion: i })).status, 200);
  assert.equal((await f.request(path, { expectedVersion: 12 })).status, 429);
  assert.equal((await f.request(path)).body.quickAccess.version, 12);
});
