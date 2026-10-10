'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { execFileSync } = require('node:child_process');
const express = require('express');
const { createLearningApi } = require('../learning-api');
const { LearningStore } = require('../learning-store');
const { passwordValid, hashPassword, verifyPassword, tokenHash } = require('../learning-auth');

// Synthetic credentials for isolated local databases only.
const PASSWORD = 'teacher password for local policy tests';
const STUDENT_PASSWORD = 'q7J3k9R2';
const passwordHash = hashPassword(PASSWORD);
const ORIGIN = 'https://cabinet.example.test';

async function fixture(t, { pendingTeacher = false } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-student-passwords-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const api = createLearningApi({ filePath, publicOrigin: ORIGIN, secureCookies: false });
  const store = api.store;
  const invitation = store.bootstrap({ login: 'teacher', name: 'Test Teacher' });
  const teacher = pendingTeacher ? null : store.activate(invitation.invitationToken, await passwordHash);
  const app = express(); app.use(express.json()); app.use('/api/learning', api.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    api.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(route, body, session = teacher, extraHeaders = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(session ? { Cookie: session.cookie || `mathexam_learning_local=${session.sessionToken}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': session.data?.csrfToken || tokenHash(`learning-csrf:${session.sessionToken}`) } : {}) }),
        ...extraHeaders
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  return { api, store, invitation, teacher, request, filePath };
}

test('legacy creation policy keeps 8–128 characters for pupils and 12–128 for other roles', async () => {
  for (const length of [7, 8, 11, 12, 128, 129]) {
    const value = 'x'.repeat(length);
    assert.equal(passwordValid(value, 'student'), length >= 8 && length <= 128);
    for (const role of [undefined, 'teacher', 'unknown', { role: 'student' }]) {
      assert.equal(passwordValid(value, role), length >= 12 && length <= 128);
    }
  }
  for (const value of [undefined, null, 12345678, ['student8'], { password: 'student8' }]) {
    assert.equal(passwordValid(value, 'student'), false);
    await assert.rejects(hashPassword(value, 'student'), { code: 'LEARNING_STUDENT_PASSWORD_INVALID' });
  }
  for (const value of ['x'.repeat(7), 'x'.repeat(129)]) {
    await assert.rejects(hashPassword(value, 'student'), { code: 'LEARNING_STUDENT_PASSWORD_INVALID' });
  }
  for (const length of [8, 11]) await assert.rejects(hashPassword('x'.repeat(length)), { code: 'LEARNING_PASSWORD_INVALID' });
  // Preserve existing JS string length and exact-string semantics for Unicode.
  const unicode = 'ученик42';
  assert.equal(unicode.length, 8);
  const encoded = await hashPassword(unicode, 'student');
  assert.equal(await verifyPassword(unicode, encoded), true);
  assert.equal(await verifyPassword('Ученик42', encoded), false);
});

test('an unknown login with an 8-character password still executes scrypt', () => {
  // Isolate instrumentation from the API module and the shared hash queue.
  execFileSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const crypto = require('node:crypto');
    const original = crypto.scrypt;
    let calls = 0;
    crypto.scrypt = function (...args) { calls++; return original.apply(this, args); };
    const { verifyPassword } = require('./learning-auth');
    (async () => {
      assert.equal(await verifyPassword('student8', null), false);
      assert.equal(calls, 1);
      assert.equal(await verifyPassword('student8', 'invalid-hash'), false);
      assert.equal(calls, 2);
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
});

test('teacher provisioning accepts an 8-character learner password; login and persisted hashes work', async t => {
  const f = await fixture(t);
  for (const password of ['short77', 'x'.repeat(129)]) {
    const denied = await f.request('/teacher/students', { name: 'Test Pupil', login: 'pupil', password });
    assert.equal(denied.status, 400); assert.equal(denied.data.error, 'LEARNING_STUDENT_PASSWORD_INVALID');
    assert.equal(f.store.accountByLogin('pupil'), undefined);
  }
  const created = await f.request('/teacher/students', { name: 'Test Pupil', login: 'pupil', password: STUDENT_PASSWORD });
  assert.equal(created.status, 201); assert.equal(created.data.student.role, 'student');
  assert.deepEqual(Object.keys(created.data), ['student']);
  assert(!JSON.stringify(created.data).includes(STUDENT_PASSWORD));
  const stored = f.store.accountByLogin('pupil');
  assert.match(stored.password_hash, /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.equal(await verifyPassword(STUDENT_PASSWORD, stored.password_hash), true);
  const login = await f.request('/login', { login: 'pupil', password: STUDENT_PASSWORD }, null);
  assert.equal(login.status, 200); assert.equal(login.data.account.id, stored.id);
  assert.equal((await f.request('/session', undefined, login)).status, 200);
  const wrong = await f.request('/login', { login: 'pupil', password: 'incorrect8' }, null);
  const unknown = await f.request('/login', { login: 'unknown', password: STUDENT_PASSWORD }, null);
  assert.equal(wrong.status, 401); assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.data, unknown.data);
  f.api.close();
  assert(!fs.readFileSync(f.filePath).includes(Buffer.from(STUDENT_PASSWORD)));
  const reopened = new LearningStore({ filePath: f.filePath });
  try {
    assert.equal(await verifyPassword(STUDENT_PASSWORD, reopened.accountByLogin('pupil').password_hash), true);
    assert.equal(reopened.session(login.cookie.split('=')[1]).id, stored.id);
  } finally { reopened.close(); }
});

test('student invitation activation and teacher-assisted recovery accept 8 characters and revoke old access', async t => {
  const f = await fixture(t);
  const invite = f.store.createStudent(f.teacher.account, { name: 'Invited Pupil', login: 'invited' });
  const invalid = await f.request('/activate', { token: invite.invitationToken, password: 'seven77' }, null);
  assert.equal(invalid.status, 400); assert.equal(invalid.data.error, 'LEARNING_STUDENT_PASSWORD_INVALID');
  assert.equal(f.store.accountByLogin('invited').password_hash, null);
  const activated = await f.request('/activate', { token: invite.invitationToken, password: STUDENT_PASSWORD }, null);
  assert.equal(activated.status, 200); assert.equal(activated.data.account.role, 'student');
  const repeated = await f.request('/activate', { token: invite.invitationToken, password: STUDENT_PASSWORD }, null);
  assert.equal(repeated.status, 401);
  const recovery = await f.request(`/teacher/students/${invite.student.id}/recovery`, {});
  assert.equal(recovery.status, 200);
  const recovered = await f.request('/activate', { token: recovery.data.invitationToken, password: 'changed8' }, null);
  assert.equal(recovered.status, 200);
  assert.equal((await f.request('/session', undefined, activated)).status, 401);
  assert.equal((await f.request('/session', undefined, recovered)).status, 200);
  assert.equal((await f.request('/login', { login: 'invited', password: STUDENT_PASSWORD }, null)).status, 401);
  assert.equal((await f.request('/login', { login: 'invited', password: 'changed8' }, null)).status, 200);
});

test('legacy teacher activation and recovery retain 12-character minimum; callers cannot inject a weaker role', async t => {
  const f = await fixture(t, { pendingTeacher: true });
  const activation = { token: f.invitation.invitationToken, password: STUDENT_PASSWORD };
  for (const password of [STUDENT_PASSWORD, 'x'.repeat(11)]) {
    const denied = await f.request('/activate', { ...activation, password }, null);
    assert.equal(denied.status, 400); assert.equal(denied.data.error, 'LEARNING_PASSWORD_INVALID');
    assert.equal(f.store.accountByLogin('teacher').password_hash, null);
  }
  const injected = await f.request('/activate', { ...activation, role: 'student' }, null);
  assert.equal(injected.status, 400); assert.equal(injected.data.error, 'LEARNING_INVALID');
  const teacher = await f.request('/activate', { ...activation, password: 't'.repeat(12) }, null);
  assert.equal(teacher.status, 200); assert.equal(teacher.data.account.role, 'teacher');
  const body = { login: 'teacher', code: teacher.data.recoveryCodes[0], password: STUDENT_PASSWORD };
  const denied = await f.request('/recover', body, null);
  assert.equal(denied.status, 400); assert.equal(denied.data.error, 'LEARNING_PASSWORD_INVALID');
  assert.equal((await f.request('/recover', { ...body, role: 'student' }, null)).status, 400);
  assert.equal((await f.request('/session', undefined, teacher)).status, 200);
  assert.equal(f.store.recovery('teacher', body.code).account.id, teacher.data.account.id);
  const recovered = await f.request('/recover', { ...body, password: 'r'.repeat(12) }, null);
  assert.equal(recovered.status, 200);
  assert.equal((await f.request('/session', undefined, teacher)).status, 401);
});

test('student provisioning still requires the teacher, origin and CSRF; no role input or plaintext response', async t => {
  const f = await fixture(t);
  const pupil = f.store.createStudent(f.teacher.account, { name: 'Existing Pupil', login: 'existing' }, await passwordHash);
  const student = f.store.createSession(pupil.student.id);
  const body = { name: 'Pupil', login: 'pupil', password: STUDENT_PASSWORD };
  assert.equal((await f.request('/teacher/students', body, null)).status, 401);
  assert.equal((await f.request('/teacher/students', body, student)).status, 403);
  assert.equal((await f.request('/teacher/students', body, f.teacher, { Origin: 'https://other.example.test' })).status, 403);
  assert.equal((await f.request('/teacher/students', body, f.teacher, { 'X-CSRF-Token': '' })).status, 403);
  assert.equal((await f.request('/teacher/students', { ...body, role: 'teacher' })).status, 400);
  assert.equal(f.store.accountByLogin('pupil'), undefined);
});

test('eight-character wrong passwords keep the existing per-login attempt limit', async t => {
  const f = await fixture(t);
  const created = await f.request('/teacher/students', { name: 'Limited Pupil', login: 'limited', password: STUDENT_PASSWORD });
  assert.equal(created.status, 201);
  for (let attempt = 0; attempt < 8; attempt++) {
    const denied = await f.request('/login', { login: 'limited', password: 'wrong888' }, null);
    assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID');
  }
  const limited = await f.request('/login', { login: 'limited', password: STUDENT_PASSWORD }, null);
  assert.equal(limited.status, 429); assert.equal(limited.data.error, 'LEARNING_RATE_LIMITED');
  assert.equal((await f.request('/session')).status, 200);
});

test('existing long credentials and the 128-character maximum still activate and log in', async t => {
  const f = await fixture(t);
  const lengths = [11, 12, 128];
  for (const length of lengths) {
    const login = `pupil${length}`, password = 'p'.repeat(length);
    const invite = f.store.createStudent(f.teacher.account, { name: 'Length Pupil', login });
    const activated = await f.request('/activate', { token: invite.invitationToken, password }, null);
    assert.equal(activated.status, 200);
    assert.equal((await f.request('/login', { login, password }, null)).status, 200);
  }
  assert.equal((await f.request('/login', { login: 'teacher', password: PASSWORD }, null)).status, 200);
});
