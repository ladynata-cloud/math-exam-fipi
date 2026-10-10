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
const { FamilyAccess } = require('../learning-family');
const { hashPassword, verifyPassword, token, tokenHash } = require('../learning-auth');

// Synthetic credentials and isolated temporary SQLite databases only.
const PASSWORD = 'teacher password for local change tests';
const NEW_PASSWORD = 'new teacher password for local change tests';
const passwordHash = hashPassword(PASSWORD);
const replacementHash = hashPassword(NEW_PASSWORD);
const ORIGIN = 'https://cabinet.example.test';
const PASSWORD_ROUTE = '/teacher/password';
const RECOVERY_ROUTE = '/teacher/password-recovery';
const HOUR = 60 * 60 * 1000;

async function fixture(t, { pendingTeacher = false } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-teacher-password-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1700000000000;
  const clock = () => now;
  const api = createLearningApi({ filePath, clock, publicOrigin: ORIGIN, secureCookies: false });
  const store = api.store;
  const invitation = store.bootstrap({ login: 'teacher', name: 'Fixture Teacher' });
  const teacher = pendingTeacher ? null : store.activate(invitation.invitationToken, await passwordHash);
  const secondSession = teacher && store.createSession(teacher.account.id);
  const student = teacher && store.createStudent(teacher.account, { login: 'student', name: 'Fixture Pupil' }, await passwordHash);
  const studentSession = student && store.createSession(student.student.id);
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
        ...(session ? { Cookie: session.cookie || `mathexam_learning_local=${session.sessionToken}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': session.data?.csrfToken || tokenHash(`learning-csrf:${session.sessionToken}`) } : {}) }),
        ...extraHeaders
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const raw = await response.text();
    return { status: response.status,
      data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(raw) : null,
      headers: response.headers, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const teacherRows = () => ({
    account: store.account(teacher.account.id),
    sessions: store.rows('SELECT * FROM sessions WHERE account_id=? ORDER BY hash', teacher.account.id),
    invitations: store.rows('SELECT * FROM invitations WHERE account_id=? ORDER BY hash', teacher.account.id),
    codes: store.rows('SELECT * FROM recovery_codes WHERE account_id=? ORDER BY hash', teacher.account.id)
  });
  async function unrelatedAccess() {
    const quick = store.writeStudentQuickAccess(teacher.sessionToken, student.student.id, { expectedVersion: 0 });
    const quickSession = store.quickLogin(quick.quickToken);
    const pending = store.createStudent(teacher.account, { login: 'pending', name: 'Pending Pupil' });
    const family = new FamilyAccess(store);
    const parentInvitation = family.write(teacher.sessionToken, student.student.id, { name: 'Fixture Parent', expectedVersion: 0 });
    const parent = family.activate(parentInvitation.invitationToken, await passwordHash,
      family.invitation(parentInvitation.invitationToken).row, () => {});
    family.write(teacher.sessionToken, pending.student.id, { name: 'Pending Parent', expectedVersion: 0 });
    const attempt = store.newAttempt(student.student.id, teacher.account.id, 'fixture-trainer',
      { taskSpec: { question: 'synthetic exercise' }, state: { answer: 'saved response' } });
    store.run('INSERT INTO events(attempt_id,actor_id,actor_role,op_id,fingerprint,revision,type,payload_json,at) VALUES(?,?,?,?,?,?,?,?,?)',
      attempt.id, student.student.id, 'student', 'fixture-operation-001', tokenHash('fixture-event'), 1, 'state', '{"answer":"saved response"}', clock());
    const snapshot = () => ({
      accounts: store.rows('SELECT * FROM accounts WHERE id!=? ORDER BY id', teacher.account.id),
      sessions: store.rows('SELECT * FROM sessions WHERE account_id!=? ORDER BY hash', teacher.account.id),
      invitations: store.rows('SELECT * FROM invitations WHERE account_id!=? ORDER BY hash', teacher.account.id),
      ...Object.fromEntries(['learning_profiles', 'learning_quick_access', 'learning_quick_sessions',
        'learning_parents', 'learning_parent_invitations', 'learning_parent_sessions',
        'attempts', 'events', 'assignments', 'lessons', 'operations']
        .map(table => [table, store.rows(`SELECT * FROM ${table} ORDER BY rowid`)]))
    });
    return { quickSession, parent: { cookie: `mathexam_parent_local=${parent.sessionToken}` }, snapshot };
  }
  return { api, store, invitation, teacher, secondSession, studentSession, request, teacherRows, unrelatedAccess,
    filePath, clock, advance: ms => { now += ms; } };
}

test('teacher password change requires teacher, same origin, CSRF, JSON and an exact body', async t => {
  const f = await fixture(t), before = f.teacherRows();
  assert.equal((await f.request(PASSWORD_ROUTE, null, { password: NEW_PASSWORD })).status, 401);
  assert.equal((await f.request(PASSWORD_ROUTE, f.studentSession, { password: NEW_PASSWORD })).status, 403);
  for (const headers of [{ Origin: 'https://other.example.test' }, { Origin: '' }, { 'X-CSRF-Token': '' }, { 'X-CSRF-Token': 'wrong' }]) {
    assert.equal((await f.request(PASSWORD_ROUTE, f.teacher, { password: NEW_PASSWORD }, headers)).status, 403);
  }
  assert.equal((await f.request(PASSWORD_ROUTE, f.teacher, { password: NEW_PASSWORD }, { 'Content-Type': 'text/plain' })).status, 415);
  for (const body of [{}, [], { password: NEW_PASSWORD, currentPassword: PASSWORD }, { password: NEW_PASSWORD, role: 'student' }, { password: NEW_PASSWORD, login: 'student' }]) {
    const denied = await f.request(PASSWORD_ROUTE, f.teacher, body);
    assert.equal(denied.status, 400); assert.equal(denied.headers.get('set-cookie'), null);
  }
  assert.equal((await f.request(`${PASSWORD_ROUTE}?role=student`, f.teacher, { password: NEW_PASSWORD })).status, 400);
  assert.deepEqual(f.teacherRows(), before);
});

test('teacher password change retains the legacy 12–128 character policy', async t => {
  const f = await fixture(t), before = f.teacherRows();
  for (const password of ['student8', 'x'.repeat(11), 'x'.repeat(129), null, 123456789012]) {
    const denied = await f.request(PASSWORD_ROUTE, f.teacher, { password });
    assert.equal(denied.status, 400); assert.equal(denied.data.error, 'LEARNING_PASSWORD_INVALID');
  }
  assert.deepEqual(f.teacherRows(), before);
  for (const length of [12, 128]) {
    const password = 't'.repeat(length);
    assert.equal((await f.request(PASSWORD_ROUTE, f.teacher, { password })).status, 200);
    assert.equal(await verifyPassword(password, f.store.account(f.teacher.account.id).password_hash), true);
  }
});

test('password change keeps the current token and expiry, revokes other teacher access and preserves pupil, parent and history', async t => {
  const f = await fixture(t), unrelated = await f.unrelatedAccess();
  const link = f.store.issueTeacherRecovery('teacher');
  const before = f.teacherRows(), unrelatedBefore = unrelated.snapshot();
  const current = before.sessions.find(row => row.hash === tokenHash(f.teacher.sessionToken));
  f.advance(60000);
  const changed = await f.request(PASSWORD_ROUTE, f.teacher, { password: NEW_PASSWORD });
  assert.equal(changed.status, 200);
  assert.deepEqual(changed.data, { ok: true, account: f.teacher.account });
  assert.equal(changed.headers.get('cache-control'), 'no-store');
  assert.equal(changed.headers.get('set-cookie'), null);
  assert(!JSON.stringify(changed.data).includes(NEW_PASSWORD));
  const after = f.teacherRows();
  assert.equal(after.account.auth_epoch, before.account.auth_epoch + 1);
  assert.notEqual(after.account.password_hash, before.account.password_hash);
  assert.deepEqual(after.sessions.map(row => ({ ...row })), [{ ...current, epoch: after.account.auth_epoch }]);
  assert.equal(after.sessions[0].expires_at, current.expires_at);
  assert.deepEqual(after.codes, []); assert.deepEqual(after.invitations, []);
  assert.equal((await f.request('/session')).status, 200);
  assert.equal((await f.request('/session', f.secondSession)).status, 401);
  for (const code of f.teacher.recoveryCodes) assert.throws(() => f.store.recovery('teacher', code), { code: 'LEARNING_ACCESS_INVALID' });
  const denied = await f.request(RECOVERY_ROUTE, null, { token: link.invitationToken, password: PASSWORD });
  assert.equal(denied.status, 401);
  assert.deepEqual(unrelated.snapshot(), unrelatedBefore);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
  assert.equal((await f.request('/session', unrelated.quickSession)).status, 200);
  assert.equal((await f.request('/parent/session', unrelated.parent)).status, 200);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: PASSWORD })).status, 401);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: NEW_PASSWORD })).status, 200);
});

test('logout during asynchronous hashing rejects password change without changing credentials or recovery access', async t => {
  const f = await fixture(t);
  f.store.issueTeacherRecovery('teacher');
  const before = f.teacherRows(), account = f.store.account.bind(f.store);
  let scheduled = false;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) { scheduled = true; queueMicrotask(() => f.store.logout(f.teacher.sessionToken)); }
    return result;
  });
  const denied = await f.request(PASSWORD_ROUTE, f.teacher, { password: NEW_PASSWORD });
  assert(scheduled); assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_UNAUTHORIZED');
  const after = f.teacherRows();
  assert.deepEqual(after.account, before.account); assert.deepEqual(after.codes, before.codes);
  assert.deepEqual(after.invitations, before.invitations);
  assert.deepEqual(after.sessions, before.sessions.filter(row => row.hash !== tokenHash(f.teacher.sessionToken)));
  assert.equal(denied.headers.get('set-cookie'), null);
});

test('a concurrent recovery wins over an already hashing password change', async t => {
  const f = await fixture(t), newHash = await replacementHash;
  const account = f.store.account.bind(f.store);
  let scheduled = false, recovered;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => { recovered = f.store.recoverTeacher('teacher', f.teacher.recoveryCodes[0], newHash); });
    }
    return result;
  });
  const denied = await f.request(PASSWORD_ROUTE, f.teacher, { password: 'stale hashing request password' });
  assert(scheduled); assert.equal(denied.status, 401);
  assert.equal(account(f.teacher.account.id).password_hash, newHash);
  assert.equal((await f.request('/session', recovered)).status, 200);
  assert.equal((await f.request('/session', f.teacher)).status, 401);
  assert.equal(denied.headers.get('set-cookie'), null);
});

test('a concurrent password change using the same surviving session rejects the stale hash request', async t => {
  const f = await fixture(t), newHash = await replacementHash;
  const account = f.store.account.bind(f.store);
  let scheduled = false;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => f.store.replaceTeacherPassword(f.teacher.sessionToken, newHash, result.password_hash, result.auth_epoch));
    }
    return result;
  });
  const denied = await f.request(PASSWORD_ROUTE, f.teacher, { password: 'stale hashing request password' });
  assert(scheduled); assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID');
  assert.equal(account(f.teacher.account.id).password_hash, newHash);
  assert.equal((await f.request('/session', f.teacher)).status, 200);
  assert.equal((await f.request('/session', f.secondSession)).status, 401);
  assert.equal(denied.headers.get('set-cookie'), null);
});

test('atomic password commits fence both the prior hash and epoch independently', async t => {
  const f = await fixture(t), newHash = await replacementHash, link = f.store.issueTeacherRecovery('teacher');
  const before = f.teacherRows(), account = before.account;
  for (const [expectedHash, expectedEpoch] of [[newHash, account.auth_epoch], [account.password_hash, account.auth_epoch - 1]]) {
    assert.throws(() => f.store.replaceTeacherPassword(f.teacher.sessionToken, newHash, expectedHash, expectedEpoch),
      { code: 'LEARNING_ACCESS_INVALID' });
    assert.throws(() => f.store.recoverTeacherPassword(link.invitationToken, newHash, expectedHash, expectedEpoch),
      { code: 'LEARNING_ACCESS_INVALID' });
  }
  assert.deepEqual(f.teacherRows(), before);
  assert.equal((await f.request('/session')).status, 200);
});

test('password hashing attempts are limited across teacher sessions and the limit expires', async t => {
  const f = await fixture(t), before = f.teacherRows();
  for (let attempt = 0; attempt < 8; attempt++) {
    assert.equal((await f.request(PASSWORD_ROUTE, attempt % 2 ? f.teacher : f.secondSession, { password: 'short' })).status, 400);
  }
  const limited = await f.request(PASSWORD_ROUTE, f.secondSession, { password: NEW_PASSWORD });
  assert.equal(limited.status, 429); assert.equal(limited.data.error, 'LEARNING_RATE_LIMITED');
  assert.equal(limited.headers.get('retry-after'), '60'); assert.equal(limited.headers.get('set-cookie'), null);
  assert.deepEqual(f.teacherRows(), before);
  f.advance(15 * 60000);
  assert.equal((await f.request(PASSWORD_ROUTE, f.teacher, { password: NEW_PASSWORD })).status, 200);
});

test('issuing an operator recovery link is limited to an active teacher and only supersedes the previous link', async t => {
  const f = await fixture(t), before = f.teacherRows();
  for (const login of ['unknown', 'student']) assert.throws(() => f.store.issueTeacherRecovery(login));
  assert.deepEqual(f.teacherRows(), before);
  const first = f.store.issueTeacherRecovery('teacher');
  assert.deepEqual(Object.keys(first).sort(), ['account', 'expiresAt', 'invitationToken']);
  assert.deepEqual(first.account, f.teacher.account);
  assert.match(first.invitationToken, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(first.expiresAt, f.clock() + HOUR);
  const stored = f.store.teacherRecovery(first.invitationToken).invitation;
  assert.equal(stored.purpose, 'teacher-recovery'); assert.equal(stored.account_id, f.teacher.account.id);
  assert.equal(stored.hash, tokenHash(first.invitationToken));
  f.advance(1000);
  const second = f.store.issueTeacherRecovery('teacher');
  assert.notEqual(first.invitationToken, second.invitationToken);
  assert.equal(second.expiresAt, f.clock() + HOUR);
  assert.throws(() => f.store.teacherRecovery(first.invitationToken), { code: 'LEARNING_ACCESS_INVALID' });
  const after = f.teacherRows();
  assert.deepEqual(after.account, before.account); assert.deepEqual(after.sessions, before.sessions); assert.deepEqual(after.codes, before.codes);
  assert.equal((await f.request('/session')).status, 200);
  assert.equal((await f.request('/session', f.secondSession)).status, 200);
});

test('pending teacher activation cannot be replaced by operator password recovery', async t => {
  const f = await fixture(t, { pendingTeacher: true });
  const before = f.store.account(f.invitation.account.id);
  assert.throws(() => f.store.issueTeacherRecovery('teacher'));
  assert.deepEqual(f.store.account(f.invitation.account.id), before);
  assert.equal(f.store.invitation(f.invitation.invitationToken).purpose, 'activate');
  const secret = token();
  f.store.run('INSERT INTO invitations(hash,account_id,purpose,expires_at) VALUES(?,?,?,?)',
    tokenHash(secret), f.invitation.account.id, 'teacher-recovery', f.clock() + HOUR);
  const denied = await f.request(RECOVERY_ROUTE, null, { token: secret, password: 'short' });
  assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID');
  assert.deepEqual(f.store.account(f.invitation.account.id), before);
});

test('public recovery requires same-origin JSON and exactly token plus password, without requiring a teacher cookie or CSRF', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
  const body = { token: link.invitationToken, password: NEW_PASSWORD };
  for (const headers of [{ Origin: '' }, { Origin: 'https://other.example.test' }]) {
    assert.equal((await f.request(RECOVERY_ROUTE, null, body, headers)).status, 403);
  }
  assert.equal((await f.request(RECOVERY_ROUTE, null, body, { 'Content-Type': 'text/plain' })).status, 415);
  for (const invalid of [{}, { token: link.invitationToken }, { password: NEW_PASSWORD }, [], { ...body, role: 'student' }, { ...body, login: 'teacher' }]) {
    const denied = await f.request(RECOVERY_ROUTE, f.studentSession, invalid);
    assert.equal(denied.status, 400); assert.equal(denied.headers.get('set-cookie'), null);
  }
  assert.equal((await f.request(`${RECOVERY_ROUTE}?role=student`, null, body)).status, 400);
  assert.deepEqual(f.teacherRows(), before);
  const recovered = await f.request(RECOVERY_ROUTE, null, body);
  assert.equal(recovered.status, 200);
  assert.deepEqual(Object.keys(recovered.data).sort(), ['account', 'csrfToken']);
  assert.deepEqual(recovered.data.account, f.teacher.account);
  assert.equal((await f.request('/session', recovered)).status, 200);
});

test('the ordinary activation endpoint cannot redeem a teacher recovery link', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
  const denied = await f.request('/activate', f.studentSession, { token: link.invitationToken, password: 'short' });
  assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID');
  assert.equal(denied.headers.get('set-cookie'), null);
  assert.deepEqual(f.teacherRows(), before);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
});

test('invalid, expired, used, wrong-purpose and nonteacher links are rejected before password hashing', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher');
  const tokens = [token(), 'invalid-token', null, 1234, ['invalid']];
  function insertInvitation(accountId, purpose, expiresAt, usedAt = null) {
    const secret = token();
    f.store.run('INSERT INTO invitations(hash,account_id,purpose,expires_at,used_at) VALUES(?,?,?,?,?)',
      tokenHash(secret), accountId, purpose, expiresAt, usedAt);
    return secret;
  }
  tokens.push(insertInvitation(f.teacher.account.id, 'teacher-recovery', f.clock()));
  tokens.push(insertInvitation(f.teacher.account.id, 'teacher-recovery', f.clock() + HOUR, f.clock()));
  for (const purpose of ['activate', 'recovery', 'unknown']) tokens.push(insertInvitation(f.teacher.account.id, purpose, f.clock() + HOUR));
  tokens.push(insertInvitation(f.studentSession.account.id, 'teacher-recovery', f.clock() + HOUR));
  const before = f.teacherRows();
  // An invalid password would produce 400 if hashing/policy ran before link authorization.
  for (const secret of tokens) {
    const denied = await f.request(RECOVERY_ROUTE, f.studentSession, { token: secret, password: 'short' });
    assert.equal(denied.status, 401); assert.deepEqual(denied.data, { ok: false, error: 'LEARNING_ACCESS_INVALID' });
    assert.equal(denied.headers.get('set-cookie'), null);
  }
  assert.deepEqual(f.teacherRows(), before);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
  assert.equal(f.store.teacherRecovery(link.invitationToken).invitation.purpose, 'teacher-recovery');
});

test('valid recovery links retain teacher password policy and do not consume the link on invalid passwords', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
  for (const password of ['student8', 'x'.repeat(11), 'x'.repeat(129), null]) {
    const denied = await f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password });
    assert.equal(denied.status, 400); assert.equal(denied.data.error, 'LEARNING_PASSWORD_INVALID');
    assert.equal(denied.headers.get('set-cookie'), null);
  }
  assert.deepEqual(f.teacherRows(), before);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
  const recovered = await f.request(RECOVERY_ROUTE, null, { token: link.invitationToken, password: 't'.repeat(12) });
  assert.equal(recovered.status, 200);
});

test('reading a recovery URL and failed redemption preserve a pupil cookie; successful redemption replaces it with an ordinary teacher session', async t => {
  const f = await fixture(t), unrelated = await f.unrelatedAccess();
  const link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows(), unrelatedBefore = unrelated.snapshot();
  const read = await f.request(`${RECOVERY_ROUTE}?token=${link.invitationToken}`, f.studentSession);
  assert.equal(read.status, 404); assert.equal(read.headers.get('set-cookie'), null);
  assert.deepEqual(f.teacherRows(), before);
  const denied = await f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: 'short' });
  assert.equal(denied.status, 400); assert.equal(denied.headers.get('set-cookie'), null);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
  const recovered = await f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: NEW_PASSWORD });
  assert.equal(recovered.status, 200);
  assert.deepEqual(Object.keys(recovered.data).sort(), ['account', 'csrfToken']);
  assert.deepEqual(recovered.data.account, f.teacher.account);
  assert.match(recovered.headers.get('set-cookie'), /^mathexam_learning_local=[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Strict; Max-Age=2592000$/);
  assert.equal(recovered.headers.get('cache-control'), 'no-store');
  const secret = recovered.cookie.slice('mathexam_learning_local='.length);
  assert.equal(recovered.data.csrfToken, tokenHash(`learning-csrf:${secret}`));
  assert.equal((await f.request('/session', recovered)).status, 200);
  assert.equal((await f.request('/session', f.teacher)).status, 401);
  assert.equal((await f.request('/session', f.secondSession)).status, 401);
  assert.equal(f.teacherRows().account.auth_epoch, before.account.auth_epoch + 1);
  assert.deepEqual(f.teacherRows().codes, []);
  assert.throws(() => f.store.teacherRecovery(link.invitationToken), { code: 'LEARNING_ACCESS_INVALID' });
  for (const code of f.teacher.recoveryCodes) assert.throws(() => f.store.recovery('teacher', code), { code: 'LEARNING_ACCESS_INVALID' });
  const replay = await f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: PASSWORD });
  assert.equal(replay.status, 401); assert.equal(replay.headers.get('set-cookie'), null);
  assert.deepEqual(unrelated.snapshot(), unrelatedBefore);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
  assert.equal((await f.request('/session', unrelated.quickSession)).status, 200);
  assert.equal((await f.request('/parent/session', unrelated.parent)).status, 200);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: PASSWORD })).status, 401);
  assert.equal((await f.request('/login', null, { login: 'teacher', password: NEW_PASSWORD })).status, 200);
});

test('recovery link expiry is rechecked after asynchronous hashing', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
  const account = f.store.account.bind(f.store);
  let scheduled = false;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) { scheduled = true; queueMicrotask(() => f.advance(HOUR)); }
    return result;
  });
  const denied = await f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: NEW_PASSWORD });
  assert(scheduled); assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID');
  assert.equal(denied.headers.get('set-cookie'), null);
  assert.deepEqual(f.teacherRows(), before);
});

test('superseding a recovery link while hashing prevents the old redemption', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
  const account = f.store.account.bind(f.store);
  let scheduled = false, replacement;
  t.mock.method(f.store, 'account', id => {
    const result = account(id);
    if (!scheduled) { scheduled = true; queueMicrotask(() => { replacement = f.store.issueTeacherRecovery('teacher'); }); }
    return result;
  });
  const denied = await f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: NEW_PASSWORD });
  assert(scheduled); assert.equal(denied.status, 401); assert.equal(denied.headers.get('set-cookie'), null);
  const after = f.teacherRows();
  assert.deepEqual(after.account, before.account); assert.deepEqual(after.sessions, before.sessions); assert.deepEqual(after.codes, before.codes);
  assert.equal(f.store.teacherRecovery(replacement.invitationToken).invitation.purpose, 'teacher-recovery');
});

test('simultaneous redemption of one recovery link grants exactly one new session', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), epoch = f.teacherRows().account.auth_epoch;
  const results = await Promise.all([
    f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: NEW_PASSWORD }),
    f.request(RECOVERY_ROUTE, f.studentSession, { token: link.invitationToken, password: PASSWORD })
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 401]);
  const denied = results.find(result => result.status === 401), recovered = results.find(result => result.status === 200);
  assert.equal(denied.data.error, 'LEARNING_ACCESS_INVALID'); assert.equal(denied.headers.get('set-cookie'), null);
  assert.equal(f.teacherRows().account.auth_epoch, epoch + 1);
  assert.equal(f.teacherRows().sessions.length, 1);
  assert.equal((await f.request('/session', recovered)).status, 200);
  assert.equal((await f.request('/session', f.studentSession)).status, 200);
});

test('a storage failure rolls back password, session, invitation and recovery-code changes together', async t => {
  for (const route of [PASSWORD_ROUTE, RECOVERY_ROUTE]) await t.test(route, async child => {
    const f = await fixture(child), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
    const run = f.store.run.bind(f.store);
    child.mock.method(f.store, 'run', (sql, ...args) => {
      if (sql.startsWith('DELETE FROM recovery_codes')) throw new Error('simulated recovery-code storage failure');
      return run(sql, ...args);
    });
    const body = route === PASSWORD_ROUTE ? { password: NEW_PASSWORD } : { token: link.invitationToken, password: NEW_PASSWORD };
    const failed = await f.request(route, route === PASSWORD_ROUTE ? f.teacher : f.studentSession, body);
    assert.equal(failed.status, 500); assert.deepEqual(failed.data, { ok: false, error: 'LEARNING_INTERNAL_ERROR' });
    assert.equal(failed.headers.get('set-cookie'), null);
    assert.deepEqual(f.teacherRows(), before);
    assert.equal((await f.request('/session', f.teacher)).status, 200);
    assert.equal((await f.request('/session', f.studentSession)).status, 200);
  });
});

test('public recovery attempts are rate limited and a failed attempt leaves recovery usable after the window', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher'), before = f.teacherRows();
  for (let attempt = 0; attempt < 8; attempt++) {
    assert.equal((await f.request(RECOVERY_ROUTE, null, { token: link.invitationToken, password: 'short' })).status, 400);
  }
  const limited = await f.request(RECOVERY_ROUTE, null, { token: link.invitationToken, password: NEW_PASSWORD });
  assert.equal(limited.status, 429); assert.equal(limited.data.error, 'LEARNING_RATE_LIMITED');
  assert.equal(limited.headers.get('retry-after'), '60'); assert.equal(limited.headers.get('set-cookie'), null);
  assert.deepEqual(f.teacherRows(), before);
  f.advance(15 * 60000);
  assert.equal((await f.request(RECOVERY_ROUTE, null, { token: link.invitationToken, password: NEW_PASSWORD })).status, 200);
});

test('password hashes and the preserved current session survive reopening without storing plaintext credentials', async t => {
  const f = await fixture(t), link = f.store.issueTeacherRecovery('teacher');
  assert.equal((await f.request(PASSWORD_ROUTE, f.teacher, { password: NEW_PASSWORD })).status, 200);
  f.api.close();
  const bytes = fs.readFileSync(f.filePath);
  for (const value of [PASSWORD, NEW_PASSWORD, link.invitationToken, f.teacher.sessionToken, ...f.teacher.recoveryCodes]) {
    assert(!bytes.includes(Buffer.from(value)));
  }
  const reopened = new LearningStore({ filePath: f.filePath, clock: f.clock });
  try {
    assert.equal(reopened.available, true);
    assert.equal(await verifyPassword(NEW_PASSWORD, reopened.account(f.teacher.account.id).password_hash), true);
    assert.equal(reopened.session(f.teacher.sessionToken).id, f.teacher.account.id);
    assert.throws(() => reopened.session(f.secondSession.sessionToken), { code: 'LEARNING_UNAUTHORIZED' });
    assert.throws(() => reopened.teacherRecovery(link.invitationToken), { code: 'LEARNING_ACCESS_INVALID' });
  } finally { reopened.close(); }
});
