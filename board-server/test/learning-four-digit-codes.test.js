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

// Synthetic credentials for isolated local databases; no production access.
const LEGACY_TEACHER = 'legacy teacher password for PIN tests';
const LEGACY_STUDENT = 'legacyP8';
const teacherHash = hashPassword(LEGACY_TEACHER);
const ORIGIN = 'https://cabinet.example.test';

async function fixture(t, { pendingTeacher = false } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-four-digit-codes-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1700000000000;
  const clock = () => now;
  const api = createLearningApi({ filePath, clock, publicOrigin: ORIGIN, secureCookies: false });
  const store = api.store;
  const invitation = store.bootstrap({ login: 'teacher', name: 'Fixture Teacher' });
  const teacher = pendingTeacher ? null : store.activate(invitation.invitationToken, await teacherHash);
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
    return { status: response.status, data: await response.json(), headers: response.headers,
      cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const login = (login, password, expectedRole) => request('/login', { login, password, ...(expectedRole ? { expectedRole } : {}) }, null);
  const snapshot = () => Object.fromEntries(['accounts', 'sessions', 'invitations', 'recovery_codes']
    .map(table => [table, store.rows(`SELECT * FROM ${table} ORDER BY rowid`)]));
  return { api, store, invitation, teacher, request, login, snapshot, filePath, clock, advance: ms => { now += ms; } };
}

test('issuance accepts exactly four ASCII digits or the existing role-specific password lengths', async () => {
  const invalid = ['123', '12345', '12a4', 'abcd', '１２３４', '١٢٣٤', ' 1234', '1234 ', '1234\n',
    '12 4', '12-4', '', 1234, null, undefined, ['1234'], { password: '1234' }];
  for (const role of ['teacher', 'student', 'parent']) {
    for (const code of ['0000', '0123', '1234', '9999']) assert.equal(passwordValid(code, role), true);
    for (const value of invalid) {
      assert.equal(passwordValid(value, role), false);
      await assert.rejects(hashPassword(value, role),
        { code: role === 'student' ? 'LEARNING_STUDENT_PASSWORD_INVALID' : 'LEARNING_PASSWORD_INVALID' });
    }
    for (const length of [7, 8, 11, 12, 128, 129]) {
      assert.equal(passwordValid('x'.repeat(length), role), length >= (role === 'student' ? 8 : 12) && length <= 128);
    }
  }
  for (const role of [undefined, 'unknown', { role: 'student' }]) {
    assert.equal(passwordValid('0123', role), true);
    assert.equal(passwordValid('student8', role), false);
  }
});

test('unknown accounts and invalid stored hashes still execute scrypt for a four-digit code', () => {
  // A separate process instruments crypto before learning-auth captures scrypt.
  execFileSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const crypto = require('node:crypto');
    const original = crypto.scrypt;
    let calls = 0;
    crypto.scrypt = function (...args) { calls++; return original.apply(this, args); };
    const { verifyPassword } = require('./learning-auth');
    (async () => {
      assert.equal(await verifyPassword('0123', null), false);
      assert.equal(calls, 1);
      assert.equal(await verifyPassword('0123', 'invalid-hash'), false);
      assert.equal(calls, 2);
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
});

test('teacher bootstrap activation and login preserve leading zeroes and ordinary session identity', async t => {
  const f = await fixture(t, { pendingTeacher: true });
  const activated = await f.request('/activate', { token: f.invitation.invitationToken, password: '0123' }, null);
  assert.equal(activated.status, 200); assert.equal(activated.data.account.role, 'teacher');
  assert.equal(activated.data.recoveryCodes.length, 8);
  const stored = f.store.accountByLogin('teacher');
  assert.match(stored.password_hash, /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.equal(await verifyPassword('0123', stored.password_hash), true);
  const loggedIn = await f.login('teacher', '0123', 'teacher');
  assert.equal(loggedIn.status, 200); assert.equal(loggedIn.data.account.id, stored.id);
  assert.deepEqual(Object.keys(loggedIn.data).sort(), ['account', 'csrfToken']);
  assert.equal((await f.request('/session', undefined, loggedIn)).status, 200);
  for (const password of ['123', 123, '0124', ' 0123']) {
    const denied = await f.login('teacher', password);
    assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID');
    assert.equal(denied.cookie, undefined);
  }
  assert.equal((await f.login('teacher', '0123', 'student')).status, 409);
  assert.equal((await f.request('/activate', { token: f.invitation.invitationToken, password: '4567' }, null)).status, 401);
});

test('a teacher can change to a PIN, reissue backup codes with that PIN, and recover to another PIN', async t => {
  const f = await fixture(t), other = f.store.createSession(f.teacher.account.id);
  const before = f.store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(f.teacher.sessionToken));
  const changed = await f.request('/teacher/password', { password: '0042' });
  assert.equal(changed.status, 200); assert.deepEqual(changed.data, { ok: true, account: f.teacher.account });
  assert.equal(changed.cookie, undefined);
  assert.equal((await f.request('/session')).status, 200);
  assert.equal((await f.request('/session', undefined, other)).status, 401);
  assert.equal(f.store.row('SELECT * FROM sessions WHERE hash=?', before.hash).expires_at, before.expires_at);
  assert.equal((await f.login('teacher', LEGACY_TEACHER)).status, 401);
  assert.equal((await f.login('teacher', '0042')).status, 200);
  const codes = await f.request('/teacher/recovery-codes', { password: '0042' });
  assert.equal(codes.status, 200); assert.equal(codes.data.recoveryCodes.length, 8);
  const body = { login: 'teacher', code: codes.data.recoveryCodes[0], password: '0007' };
  const recovered = await f.request('/recover', body, null);
  assert.equal(recovered.status, 200); assert.equal(recovered.data.account.id, f.teacher.account.id);
  assert.equal((await f.request('/session')).status, 401);
  assert.equal((await f.request('/session', undefined, recovered)).status, 200);
  assert.equal((await f.login('teacher', '0042')).status, 401);
  assert.equal((await f.login('teacher', '0007')).status, 200);
  assert.equal((await f.request('/recover', body, null)).status, 401);
});

test('owner-issued teacher recovery accepts a PIN and consumes the link once', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher');
  const body = { token: link.invitationToken, password: '0018' };
  const recovered = await f.request('/teacher/password-recovery', body, null);
  assert.equal(recovered.status, 200); assert.equal(recovered.data.account.role, 'teacher');
  assert.deepEqual(Object.keys(recovered.data).sort(), ['account', 'csrfToken']);
  assert.equal((await f.request('/session', undefined, recovered)).status, 200);
  assert.equal((await f.request('/session')).status, 401);
  assert.equal((await f.login('teacher', LEGACY_TEACHER)).status, 401);
  assert.equal((await f.login('teacher', '0018')).status, 200);
  assert.equal((await f.request('/teacher/password-recovery', body, null)).status, 401);
  assert.equal(f.store.rows('SELECT * FROM recovery_codes').length, 0);
});

test('teacher pupil creation and password reset accept leading-zero PINs and revoke old pupil sessions', async t => {
  const f = await fixture(t);
  const created = await f.request('/teacher/students', { name: 'Fixture Pupil', login: 'pupil', password: '0064' });
  assert.equal(created.status, 201); assert.deepEqual(Object.keys(created.data), ['student']);
  const pupil = await f.login('pupil', '0064', 'student');
  assert.equal(pupil.status, 200); assert.equal(pupil.data.account.id, created.data.student.id);
  const before = f.store.account(created.data.student.id);
  assert.match(before.password_hash, /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/);
  const reset = await f.request(`/teacher/students/${created.data.student.id}/password`, { password: '0032' });
  assert.equal(reset.status, 200); assert.equal(reset.data.student.id, created.data.student.id);
  assert.equal(f.store.account(created.data.student.id).auth_epoch, before.auth_epoch + 1);
  assert.equal((await f.request('/session', undefined, pupil)).status, 401);
  assert.equal((await f.login('pupil', '0064')).status, 401);
  const loggedIn = await f.login('pupil', '0032');
  assert.equal(loggedIn.status, 200); assert.equal((await f.request('/session')).status, 200);
  f.api.close();
  const reopened = new LearningStore({ filePath: f.filePath, clock: f.clock });
  try {
    assert.equal(await verifyPassword('0032', reopened.account(created.data.student.id).password_hash), true);
    assert.equal(reopened.session(loggedIn.cookie.split('=')[1]).id, created.data.student.id);
  } finally { reopened.close(); }
});

test('existing pupil activation and recovery invitations can be redeemed with four-digit codes', async t => {
  const f = await fixture(t);
  const invitation = f.store.createStudent(f.teacher.account, { name: 'Invited Pupil', login: 'invited' });
  const activated = await f.request('/activate', { token: invitation.invitationToken, password: '0011' }, null);
  assert.equal(activated.status, 200); assert.equal(activated.data.account.role, 'student');
  assert.equal((await f.login('invited', '0011')).status, 200);
  const recovery = await f.request(`/teacher/students/${invitation.student.id}/recovery`, {});
  assert.equal(recovery.status, 200);
  const recovered = await f.request('/activate', { token: recovery.data.invitationToken, password: '0022' }, null);
  assert.equal(recovered.status, 200);
  assert.equal((await f.request('/session', undefined, activated)).status, 401);
  assert.equal((await f.login('invited', '0011')).status, 401);
  assert.equal((await f.login('invited', '0022')).status, 200);
});

test('existing long teacher and pupil passwords still log in and can still be issued', async t => {
  const f = await fixture(t);
  assert.equal((await f.login('teacher', LEGACY_TEACHER)).status, 200);
  const studentHash = await hashPassword(LEGACY_STUDENT, 'student');
  const pupil = f.store.createStudent(f.teacher.account, { name: 'Legacy Pupil', login: 'legacy' }, studentHash);
  assert.equal((await f.login('legacy', LEGACY_STUDENT)).status, 200);
  assert.equal(await verifyPassword(LEGACY_STUDENT, studentHash), true);
  const nextTeacher = 'another legacy teacher password';
  assert.equal((await f.request('/teacher/password', { password: nextTeacher })).status, 200);
  assert.equal((await f.login('teacher', nextTeacher)).status, 200);
  const nextStudent = 'longer legacy pupil password';
  assert.equal((await f.request(`/teacher/students/${pupil.student.id}/password`, { password: nextStudent })).status, 200);
  assert.equal((await f.login('legacy', nextStudent)).status, 200);
});

test('every teacher and pupil issuance route rejects malformed codes without changing stored credentials', async t => {
  // Helper tests cover the full malformed-input matrix; each API boundary gets
  // one representative rejection to confirm it uses the trusted account role.
  for (const [flow, password] of [
    ['teacher-activate', 1234], ['teacher-change', '12345'], ['teacher-backup', '١٢٣٤'],
    ['teacher-owner', null], ['pupil-create', '123'], ['pupil-reset', '１２３４'], ['pupil-activate', '12a4']
  ]) {
    await t.test(flow, async child => {
      const f = await fixture(child, { pendingTeacher: flow === 'teacher-activate' });
      let route, body, session = f.teacher;
      if (flow === 'teacher-activate') { route = '/activate'; body = { token: f.invitation.invitationToken }; }
      if (flow === 'teacher-change') { route = '/teacher/password'; body = {}; }
      if (flow === 'teacher-backup') { route = '/recover'; body = { login: 'teacher', code: f.teacher.recoveryCodes[0] }; session = null; }
      if (flow === 'teacher-owner') { route = '/teacher/password-recovery'; body = { token: f.store.issueTeacherRecovery('teacher').invitationToken }; session = null; }
      if (flow === 'pupil-create') { route = '/teacher/students'; body = { name: 'New Pupil', login: 'newpupil' }; }
      if (flow === 'pupil-reset' || flow === 'pupil-activate') {
        const pupil = f.store.createStudent(f.teacher.account, { name: 'Fixture Pupil', login: 'pupil' }, flow === 'pupil-reset' ? await teacherHash : null);
        route = flow === 'pupil-reset' ? `/teacher/students/${pupil.student.id}/password` : '/activate';
        body = flow === 'pupil-reset' ? {} : { token: pupil.invitationToken };
        if (flow === 'pupil-activate') session = null;
      }
      const before = f.snapshot();
      const denied = await f.request(route, { ...body, password }, session);
      assert.equal(denied.status, 400);
      assert.equal(denied.data.error, flow.startsWith('pupil-') ? 'LEARNING_STUDENT_PASSWORD_INVALID' : 'LEARNING_PASSWORD_INVALID');
      assert.equal(denied.cookie, undefined);
      assert.deepEqual(f.snapshot(), before);
    });
  }
});

test('PIN issuance keeps teacher authorization, same-origin JSON, CSRF and strict request fields', async t => {
  const f = await fixture(t);
  const pupil = f.store.createStudent(f.teacher.account, { name: 'Existing Pupil', login: 'existing' }, await teacherHash);
  const student = f.store.createSession(pupil.student.id), before = f.snapshot();
  for (const [route, body] of [
    ['/teacher/password', { password: '1234' }],
    ['/teacher/students', { name: 'New Pupil', login: 'newpupil', password: '1234' }],
    [`/teacher/students/${pupil.student.id}/password`, { password: '1234' }]
  ]) {
    assert.equal((await f.request(route, body, null)).status, 401);
    assert.equal((await f.request(route, body, student)).status, 403);
    for (const headers of [{ Origin: '' }, { Origin: 'https://other.example.test' }, { 'X-CSRF-Token': '' }, { 'X-CSRF-Token': 'wrong' }]) {
      assert.equal((await f.request(route, body, f.teacher, headers)).status, 403);
    }
    assert.equal((await f.request(route, body, f.teacher, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await f.request(route, { ...body, role: 'student' })).status, 400);
  }
  assert.deepEqual(f.snapshot(), before);
});

test('PIN login, activation and teacher recovery remain same-origin JSON operations', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher');
  const pupil = f.store.createStudent(f.teacher.account, { name: 'Invited Pupil', login: 'invited' });
  const before = f.snapshot();
  for (const [route, body] of [
    ['/login', { login: 'teacher', password: '0123' }],
    ['/activate', { token: pupil.invitationToken, password: '0123' }],
    ['/recover', { login: 'teacher', code: f.teacher.recoveryCodes[0], password: '0123' }],
    ['/teacher/password-recovery', { token: link.invitationToken, password: '0123' }]
  ]) {
    for (const headers of [{ Origin: '' }, { Origin: 'https://other.example.test' }]) {
      const denied = await f.request(route, body, null, headers);
      assert.equal(denied.status, 403); assert.equal(denied.cookie, undefined);
    }
    assert.equal((await f.request(route, body, null, { 'Content-Type': 'text/plain' })).status, 415);
  }
  assert.deepEqual(f.snapshot(), before);
});

test('eight incorrect PINs retain the login rate limit and do not revoke an existing teacher session', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/teacher/password', { password: '0077' })).status, 200);
  for (let attempt = 0; attempt < 8; attempt++) {
    const denied = await f.login('teacher', '0088');
    assert.equal(denied.status, 401); assert.deepEqual(denied.data, { ok: false, error: 'LEARNING_ACCESS_INVALID' });
    assert.equal(denied.cookie, undefined);
  }
  const limited = await f.login('teacher', '0077');
  assert.equal(limited.status, 429); assert.equal(limited.data.error, 'LEARNING_RATE_LIMITED');
  assert.equal(limited.headers.get('retry-after'), '60');
  assert.equal((await f.request('/session')).status, 200);
  f.advance(15 * 60000);
  assert.equal((await f.login('teacher', '0077')).status, 200);
});
