'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const express = require('express');
const { createLearningApi } = require('../learning-api');
const { LearningStore } = require('../learning-store');
const { hashPassword, tokenHash } = require('../learning-auth');

// Local test credentials only; these tests never connect to a real cabinet.
const PASSWORD = 'teacher test password for backup codes';
const NEW_PASSWORD = 'changed teacher test password after recovery';
const passwordHash = hashPassword(PASSWORD);
const newPasswordHash = hashPassword(NEW_PASSWORD);
const ORIGIN = 'https://cabinet.example.test';
const ROUTE = '/teacher/recovery-codes';

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-recovery-codes-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1700000000000;
  const clock = () => now;
  const api = createLearningApi({ filePath, clock, publicOrigin: ORIGIN, secureCookies: false });
  const store = api.store;
  const invitation = store.bootstrap({ login: 'teacher', name: 'Test Teacher' });
  const teacher = store.activate(invitation.invitationToken, await passwordHash);
  const secondSession = store.createSession(teacher.account.id);
  const student = store.createStudent(teacher.account, { login: 'student', name: 'Test Student' }, await passwordHash);
  const studentSession = store.createSession(student.student.id);
  const app = express(); app.use(express.json()); app.use('/api/learning', api.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    api.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(route, session = teacher, body, extraHeaders = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(session ? { Cookie: `mathexam_learning_local=${session.sessionToken}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': tokenHash(`learning-csrf:${session.sessionToken}`) } : {}) }),
        ...extraHeaders
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, data: await response.json(), headers: response.headers };
  }
  const codes = () => store.rows('SELECT * FROM recovery_codes WHERE account_id=? ORDER BY hash', teacher.account.id);
  return { api, store, teacher, secondSession, studentSession, request, filePath, clock, codes, advance: ms => { now += ms; } };
}

test('reissuing codes requires a teacher session, same origin, CSRF, JSON and exact request fields', async t => {
  const f = await fixture(t), previous = f.codes();
  assert.equal((await f.request(ROUTE, null, { password: PASSWORD })).status, 401);
  assert.equal((await f.request(ROUTE, f.studentSession, { password: PASSWORD })).status, 403);
  for (const headers of [{ Origin: 'https://trainer.example.test' }, { Origin: '' }, { 'X-CSRF-Token': '' }, { 'X-CSRF-Token': 'wrong' }]) {
    assert.equal((await f.request(ROUTE, f.teacher, { password: PASSWORD }, headers)).status, 403);
  }
  assert.equal((await f.request(ROUTE, f.teacher, { password: PASSWORD }, { 'Content-Type': 'text/plain' })).status, 415);
  for (const body of [{}, { password: PASSWORD, login: 'student' }, { password: PASSWORD, recoveryCodes: ['chosen-code'] }]) {
    assert.equal((await f.request(ROUTE, f.teacher, body)).status, 400);
  }
  assert.deepEqual(f.codes(), previous);
});

test('incorrect or invalid passwords receive the generic credential error without altering codes', async t => {
  const f = await fixture(t), previous = f.codes();
  for (const password of ['wrong sufficiently long password', 'short', null]) {
    const denied = await f.request(ROUTE, f.teacher, { password });
    assert.equal(denied.status, 401);
    assert.deepEqual(denied.data, { ok: false, error: 'LEARNING_ACCESS_INVALID' });
  }
  assert.deepEqual(f.codes(), previous);
  assert.equal((await f.request('/session')).status, 200);
});

test('rotation invalidates old codes, preserves password and sessions, and new codes recover exactly once', async t => {
  const f = await fixture(t), before = f.store.account(f.teacher.account.id);
  const response = await f.request(ROUTE, f.teacher, { password: PASSWORD });
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.data), ['recoveryCodes']);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  const codes = response.data.recoveryCodes;
  assert.equal(codes.length, 8); assert.equal(new Set(codes).size, 8);
  assert(codes.every(code => /^[A-Za-z0-9_-]{24}$/.test(code)));
  for (const old of f.teacher.recoveryCodes) assert.throws(() => f.store.recovery('teacher', old), { code: 'LEARNING_ACCESS_INVALID' });
  for (const code of codes) assert.equal(f.store.recovery('teacher', code).account.id, f.teacher.account.id);
  assert.deepEqual(f.store.account(f.teacher.account.id), before);
  assert.equal((await f.request('/session', f.teacher)).status, 200);
  assert.equal((await f.request('/session', f.secondSession)).status, 200);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: PASSWORD })).status, 200);

  const recovered = await f.request('/recover', null, { login: 'teacher', code: codes[0], password: NEW_PASSWORD });
  assert.equal(recovered.status, 200);
  assert.equal((await f.request('/session', f.teacher)).status, 401);
  assert.equal((await f.request('/session', f.secondSession)).status, 401);
  const reused = await f.request('/recover', null, { login: 'teacher', code: codes[0], password: PASSWORD });
  assert.equal(reused.status, 401); assert.equal(reused.data.error, 'LEARNING_ACCESS_INVALID');
  assert.equal(f.store.recovery('teacher', codes[1]).account.id, f.teacher.account.id);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: PASSWORD })).status, 401);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: NEW_PASSWORD })).status, 200);
});

test('password attempt limit applies to the account across sessions and expires after its bounded window', async t => {
  const f = await fixture(t), previous = f.codes();
  for (let i = 0; i < 8; i++) {
    assert.equal((await f.request(ROUTE, i % 2 ? f.teacher : f.secondSession, { password: 'short' })).status, 401);
  }
  const limited = await f.request(ROUTE, f.secondSession, { password: PASSWORD });
  assert.equal(limited.status, 429); assert.equal(limited.data.error, 'LEARNING_RATE_LIMITED');
  assert.equal(limited.headers.get('retry-after'), '60');
  assert.deepEqual(f.codes(), previous);
  assert.equal((await f.request('/session')).status, 200);
  f.advance(15 * 60000);
  assert.equal((await f.request(ROUTE, f.teacher, { password: PASSWORD })).status, 200);
});

test('logout while password verification awaits prevents rotation', async t => {
  const f = await fixture(t), previous = f.codes();
  const account = f.store.account.bind(f.store);
  let scheduled = false;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) { scheduled = true; queueMicrotask(() => f.store.logout(f.teacher.sessionToken)); }
    return result;
  });
  const denied = await f.request(ROUTE, f.teacher, { password: PASSWORD });
  assert(scheduled); assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_UNAUTHORIZED');
  assert.deepEqual(f.codes(), previous);
});

test('teacher recovery during password verification revokes the pending rotation', async t => {
  const f = await fixture(t), replacementHash = await newPasswordHash;
  const account = f.store.account.bind(f.store);
  let scheduled = false, recovered;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => { recovered = f.store.recoverTeacher('teacher', f.teacher.recoveryCodes[0], replacementHash); });
    }
    return result;
  });
  const denied = await f.request(ROUTE, f.teacher, { password: PASSWORD });
  assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_UNAUTHORIZED');
  assert.equal(f.codes().length, 8); assert.equal(f.codes().filter(code => code.used_at != null).length, 1);
  assert.equal(f.store.session(recovered.sessionToken).id, f.teacher.account.id);
  assert.equal(account(f.teacher.account.id).password_hash, replacementHash);
});

test('atomic issuance rejects a stale verified password hash or auth epoch', async t => {
  const f = await fixture(t), account = f.store.account(f.teacher.account.id), previous = f.codes();
  for (const [hash, epoch] of [[await newPasswordHash, account.auth_epoch], [account.password_hash, account.auth_epoch - 1]]) {
    assert.throws(() => f.store.rotateTeacherRecoveryCodes(f.teacher.sessionToken, hash, epoch), { code: 'LEARNING_ACCESS_INVALID' });
  }
  assert.throws(() => f.store.rotateTeacherRecoveryCodes(f.studentSession.sessionToken, account.password_hash, account.auth_epoch), { code: 'LEARNING_FORBIDDEN' });
  assert.deepEqual(f.codes(), previous);
});

test('an insertion failure rolls back the entire code replacement', async t => {
  const f = await fixture(t), previous = f.codes(), run = f.store.run.bind(f.store);
  let inserts = 0;
  t.mock.method(f.store, 'run', (sql, ...args) => {
    if (sql.startsWith('INSERT INTO recovery_codes') && ++inserts === 2) throw new Error('simulated storage failure');
    return run(sql, ...args);
  });
  const failed = await f.request(ROUTE, f.teacher, { password: PASSWORD });
  assert.equal(failed.status, 500); assert.deepEqual(failed.data, { ok: false, error: 'LEARNING_INTERNAL_ERROR' });
  assert.deepEqual(f.codes(), previous);
  for (const code of f.teacher.recoveryCodes) assert.equal(f.store.recovery('teacher', code).account.id, f.teacher.account.id);
});

test('only code hashes persist; replacement and current sessions survive a database reopen', async t => {
  const f = await fixture(t);
  const response = await f.request(ROUTE, f.teacher, { password: PASSWORD });
  assert.equal(response.status, 200);
  const codes = response.data.recoveryCodes;
  const stored = f.codes();
  assert.deepEqual(stored.map(row => row.hash).sort(), codes.map(tokenHash).sort());
  assert(stored.every(row => row.account_id === f.teacher.account.id && row.used_at === null));
  f.api.close();
  const databaseBytes = fs.readFileSync(f.filePath);
  for (const value of [...codes, ...f.teacher.recoveryCodes, PASSWORD]) assert(!databaseBytes.includes(Buffer.from(value)));
  const reopened = new LearningStore({ filePath: f.filePath, clock: f.clock });
  try {
    assert.equal(reopened.available, true);
    assert.equal(reopened.session(f.teacher.sessionToken).id, f.teacher.account.id);
    for (const old of f.teacher.recoveryCodes) assert.throws(() => reopened.recovery('teacher', old), { code: 'LEARNING_ACCESS_INVALID' });
    assert.equal(reopened.recovery('teacher', codes[0]).account.id, f.teacher.account.id);
  } finally { reopened.close(); }
});
