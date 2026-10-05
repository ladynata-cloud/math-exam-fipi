'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const express = require('express');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { LearningStore } = require('../learning-store');
const { hashPassword, verifyPassword, tokenHash } = require('../learning-auth');
const contracts = require('../learning-contracts');

// Synthetic credentials and isolated SQLite only. Never connects to a live pupil.
const TEACHER_PASSWORD = 'teacher access-card test password';
const OLD_PASSWORD = 'old-Test83';
const NEW_PASSWORD = 'new-Test49';
const teacherHash = hashPassword(TEACHER_PASSWORD);
const oldHash = hashPassword(OLD_PASSWORD, 'student');
const newHash = hashPassword(NEW_PASSWORD, 'student');
const ORIGIN = 'https://cabinet.example.test';

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-student-access-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1800000000000;
  const clock = () => now;
  const api = createLearningApi({ filePath, contracts, clock, publicOrigin: ORIGIN, secureCookies: false });
  const store = api.store;
  const invitation = store.bootstrap({ login: 'teacher', name: 'Test Teacher' });
  const teacher = store.activate(invitation.invitationToken, await teacherHash);
  const teacherPeer = store.createSession(teacher.account.id);
  const students = [];
  for (const login of ['pupil', 'peer']) {
    const created = store.createStudent(teacher.account, { name: 'Test Pupil', login }, await oldHash);
    students.push(store.createSession(created.student.id));
  }
  const [student, peer] = students;
  const studentPeer = store.createSession(student.account.id);
  const app = express(); app.use(express.json());
  app.use('/api/learning', api.router, createTeachingRouter(api));
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
  return { api, store, teacher, teacherPeer, student, studentPeer, peer, request, clock, filePath,
    route: `/teacher/students/${student.account.id}/password`, advance: ms => { now += ms; } };
}

test('new pupil password requires teacher ownership, same-origin JSON, CSRF and exact fields', async t => {
  const f = await fixture(t), previous = f.store.account(f.student.account.id), body = { password: NEW_PASSWORD };
  assert.equal((await f.request(f.route, body, null)).status, 401);
  assert.equal((await f.request(f.route, body, f.student)).status, 403);
  for (const headers of [{ Origin: '' }, { Origin: 'https://elsewhere.example.test' }, { 'X-CSRF-Token': '' }, { 'X-CSRF-Token': 'wrong' }]) {
    assert.equal((await f.request(f.route, body, f.teacher, headers)).status, 403);
  }
  assert.equal((await f.request(f.route, body, f.teacher, { 'Content-Type': 'text/plain' })).status, 415);
  for (const invalid of [{}, { ...body, login: 'peer' }, { ...body, role: 'teacher' }, { ...body, passwordHash: await newHash }]) {
    assert.equal((await f.request(f.route, invalid)).status, 400);
  }
  for (const id of ['nonexistent-student', f.teacher.account.id]) {
    assert.equal((await f.request(`/teacher/students/${id}/password`, body)).status, 404);
  }
  assert.deepEqual(f.store.account(f.student.account.id), previous);
  // Single-teacher production schema: a foreign owner ID is still rejected.
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', 'foreign-teacher-id', previous.id);
  assert.equal((await f.request(f.route, body)).status, 404);
  assert.equal(f.store.account(previous.id).password_hash, previous.password_hash);
});

test('invalid values never change access; an eight-character password logs in without plaintext in responses', async t => {
  const f = await fixture(t), previous = f.store.account(f.student.account.id);
  for (const password of ['seven77', 'x'.repeat(129), null, 12345678]) {
    const denied = await f.request(f.route, { password });
    assert.equal(denied.status, 400); assert.equal(denied.data.error, 'LEARNING_STUDENT_PASSWORD_INVALID');
  }
  assert.deepEqual(f.store.account(previous.id), previous);
  const password = 'Eight-49';
  const result = await f.request(f.route, { password });
  assert.equal(result.status, 200); assert.deepEqual(Object.keys(result.data), ['student']);
  assert.equal(result.data.student.id, previous.id); assert.equal(result.data.student.active, true);
  assert.equal(result.headers.get('cache-control'), 'no-store'); assert.equal(result.headers.get('set-cookie'), null);
  assert(!JSON.stringify(result.data).includes(password)); assert(!JSON.stringify(result.data).includes('scrypt1:'));
  assert.equal((await f.request('/login', { login: 'pupil', password }, null)).status, 200);
});

test('replacement revokes only pupil sessions and all old invitations while preserving work, history and plans', async t => {
  const f = await fixture(t), id = f.student.account.id;
  const before = f.store.account(id), teacherBefore = f.store.account(f.teacher.account.id);
  const oldInvitation = f.store.recoverStudent(f.teacher.account, id);
  const attempt = f.store.createAttempt(f.student.account, { opId: 'access_create_attempt', trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  f.store.action(f.student.account, attempt.id, { opId: 'access_reference_action', expectedVersion: 0, type: 'reference', payload: {} });
  f.store.createAssignments(f.teacher.account, { opId: 'access_create_assignment', learnerIds: [id], title: 'Keep this homework', trainerId: 'ege-path', contentId: 'equations-linear' });
  f.store.createLesson(f.teacher.account, { opId: 'access_create_lesson', title: 'Keep this lesson', learnerIds: [id, f.peer.account.id] });
  const plan = await f.request(`/teacher/students/${id}/plan`, { opId: 'access_create_plan', items: [{ catalogId: 'path:equations-linear', reason: 'Keep this recommendation', priority: 'normal' }], note: 'Keep this route' });
  assert.equal(plan.status, 200);
  const tables = ['attempts', 'assignments', 'events', 'lessons', 'lesson_operations', 'operations', 'learning_plans'];
  const records = Object.fromEntries(tables.map(table => [table, f.store.rows(`SELECT * FROM ${table}`)]));
  const result = await f.request(f.route, { password: NEW_PASSWORD });
  assert.equal(result.status, 200); assert.equal(result.data.student.id, id);
  for (const table of tables) assert.deepEqual(f.store.rows(`SELECT * FROM ${table}`), records[table]);
  assert.deepEqual(f.store.account(f.teacher.account.id), teacherBefore);
  const after = f.store.account(id);
  assert.deepEqual({ ...after, password_hash: before.password_hash, auth_epoch: before.auth_epoch }, { ...before });
  assert.equal(after.auth_epoch, before.auth_epoch + 1); assert.notEqual(after.password_hash, before.password_hash);
  for (const session of [f.student, f.studentPeer]) assert.equal((await f.request('/session', undefined, session)).status, 401);
  for (const session of [f.teacher, f.teacherPeer, f.peer]) assert.equal((await f.request('/session', undefined, session)).status, 200);
  assert.equal(f.store.rows('SELECT * FROM invitations WHERE account_id=?', id).length, 0);
  assert.equal((await f.request('/activate', { token: oldInvitation.invitationToken, password: OLD_PASSWORD }, null)).status, 401);
  assert.equal((await f.request('/login', { login: 'pupil', password: OLD_PASSWORD }, null)).status, 401);
  const signedIn = await f.request('/login', { login: 'pupil', password: NEW_PASSWORD }, null);
  assert.equal(signedIn.status, 200); assert.equal(signedIn.data.account.id, id);
  assert.equal((await f.request(`/attempts/${attempt.id}`, undefined, signedIn)).status, 200);
});

test('a pending pupil keeps the same account and loses the old activation invitation', async t => {
  const f = await fixture(t);
  const pending = f.store.createStudent(f.teacher.account, { name: 'Invited pupil', login: 'invited' });
  const result = await f.request(`/teacher/students/${pending.student.id}/password`, { password: NEW_PASSWORD });
  assert.equal(result.status, 200); assert.equal(result.data.student.id, pending.student.id); assert.equal(result.data.student.active, true);
  assert.equal((await f.request('/activate', { token: pending.invitationToken, password: OLD_PASSWORD }, null)).status, 401);
  assert.equal((await f.request('/login', { login: 'invited', password: NEW_PASSWORD }, null)).status, 200);
});

test('reset rate limit spans teacher sessions, is per pupil, and expires', async t => {
  const f = await fixture(t), previous = f.store.account(f.student.account.id);
  for (let i = 0; i < 8; i++) assert.equal((await f.request(f.route, { password: 'short' }, i % 2 ? f.teacher : f.teacherPeer)).status, 400);
  const denied = await f.request(f.route, { password: NEW_PASSWORD });
  assert.equal(denied.status, 429); assert.equal(denied.data.error, 'LEARNING_RATE_LIMITED'); assert.equal(denied.headers.get('retry-after'), '60');
  assert.deepEqual(f.store.account(previous.id), previous);
  assert.equal((await f.request(`/teacher/students/${f.peer.account.id}/password`, { password: NEW_PASSWORD })).status, 200);
  f.advance(15 * 60000);
  assert.equal((await f.request(f.route, { password: NEW_PASSWORD })).status, 200);
});

test('teacher logout during hashing prevents replacing pupil access', async t => {
  const f = await fixture(t), previous = f.store.account(f.student.account.id);
  const ownsStudent = f.store.ownsStudent.bind(f.store);
  let scheduled = false;
  t.mock.method(f.store, 'ownsStudent', (...args) => {
    const row = ownsStudent(...args);
    if (!scheduled) { scheduled = true; queueMicrotask(() => f.store.logout(f.teacher.sessionToken)); }
    return row;
  });
  const denied = await f.request(f.route, { password: NEW_PASSWORD });
  assert.equal(denied.status, 401); assert.equal(denied.data.error, 'LEARNING_UNAUTHORIZED');
  assert.deepEqual(f.store.account(previous.id), previous);
  assert.equal(f.store.session(f.student.sessionToken).id, previous.id);
});

test('pupil invitation recovery during hashing fences a stale password replacement', async t => {
  const f = await fixture(t), invitation = f.store.recoverStudent(f.teacher.account, f.student.account.id), replacementHash = await newHash;
  const ownsStudent = f.store.ownsStudent.bind(f.store);
  let scheduled = false, recovered;
  t.mock.method(f.store, 'ownsStudent', (...args) => {
    const row = ownsStudent(...args);
    if (!scheduled) { scheduled = true; queueMicrotask(() => { recovered = f.store.activate(invitation.invitationToken, replacementHash); }); }
    return row;
  });
  const denied = await f.request(f.route, { password: 'stale-Test57' });
  assert.equal(denied.status, 409); assert.equal(denied.data.error, 'LEARNING_CREDENTIALS_CHANGED');
  assert.equal(f.store.account(f.student.account.id).password_hash, replacementHash);
  assert.equal(f.store.session(recovered.sessionToken).id, f.student.account.id);
});

test('a concurrent reset wins once and a stale reset cannot revoke its newer session', async t => {
  const f = await fixture(t), replacementHash = await newHash;
  const ownsStudent = f.store.ownsStudent.bind(f.store);
  let scheduled = false, newerSession;
  t.mock.method(f.store, 'ownsStudent', (...args) => {
    const row = ownsStudent(...args);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => {
        f.store.replaceStudentPassword(f.teacherPeer.sessionToken, row.id, replacementHash, row.password_hash, row.auth_epoch);
        newerSession = f.store.createSession(row.id);
      });
    }
    return row;
  });
  const denied = await f.request(f.route, { password: 'stale-Test57' });
  assert.equal(denied.status, 409); assert.equal(denied.data.error, 'LEARNING_CREDENTIALS_CHANGED');
  assert.equal(f.store.account(f.student.account.id).password_hash, replacementHash);
  assert.equal(f.store.session(newerSession.sessionToken).id, f.student.account.id);
});

test('transaction rechecks ownership and both credential snapshot fields', async t => {
  const f = await fixture(t), before = f.store.account(f.student.account.id), replacementHash = await newHash;
  for (const [hash, epoch] of [[replacementHash, before.auth_epoch], [before.password_hash, before.auth_epoch - 1]]) {
    assert.throws(() => f.store.replaceStudentPassword(f.teacher.sessionToken, before.id, replacementHash, hash, epoch), { code: 'LEARNING_CREDENTIALS_CHANGED' });
  }
  assert.deepEqual(f.store.account(before.id), before);
  const ownsStudent = f.store.ownsStudent.bind(f.store);
  let scheduled = false;
  t.mock.method(f.store, 'ownsStudent', (...args) => {
    const row = ownsStudent(...args);
    if (!scheduled) { scheduled = true; queueMicrotask(() => f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', 'foreign-teacher-id', row.id)); }
    return row;
  });
  assert.equal((await f.request(f.route, { password: NEW_PASSWORD })).status, 404);
  assert.equal(f.store.account(before.id).password_hash, before.password_hash);
});

test('storage failure rolls back password, epoch, sessions and invitations together', async t => {
  const f = await fixture(t), id = f.student.account.id;
  const invitation = f.store.recoverStudent(f.teacher.account, id), before = f.store.account(id);
  const run = f.store.run.bind(f.store);
  t.mock.method(f.store, 'run', (sql, ...args) => {
    if (sql === 'DELETE FROM invitations WHERE account_id=?') throw new Error('simulated storage failure');
    return run(sql, ...args);
  });
  const denied = await f.request(f.route, { password: NEW_PASSWORD });
  assert.equal(denied.status, 500); assert.equal(denied.data.error, 'LEARNING_INTERNAL_ERROR');
  assert.deepEqual(f.store.account(id), before);
  assert.equal(f.store.session(f.student.sessionToken).id, id);
  assert.equal(f.store.session(f.studentPeer.sessionToken).id, id);
  assert.equal(f.store.invitation(invitation.invitationToken).account_id, id);
});

test('only hashes persist and replacement access survives reopening SQLite', async t => {
  const f = await fixture(t), id = f.student.account.id;
  assert.equal((await f.request(f.route, { password: NEW_PASSWORD })).status, 200);
  const stored = f.store.account(id);
  assert.match(stored.password_hash, /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.equal(await verifyPassword(NEW_PASSWORD, stored.password_hash), true);
  for (const table of ['operations', 'events']) assert(!JSON.stringify(f.store.rows(`SELECT * FROM ${table}`)).includes(NEW_PASSWORD));
  f.api.close();
  const bytes = fs.readFileSync(f.filePath);
  for (const password of [TEACHER_PASSWORD, OLD_PASSWORD, NEW_PASSWORD]) assert(!bytes.includes(Buffer.from(password)));
  const reopened = new LearningStore({ filePath: f.filePath, contracts, clock: f.clock });
  try {
    assert.equal(await verifyPassword(NEW_PASSWORD, reopened.account(id).password_hash), true);
    assert.equal(await verifyPassword(OLD_PASSWORD, reopened.account(id).password_hash), false);
    assert.equal(reopened.session(f.teacher.sessionToken).id, f.teacher.account.id);
    assert.throws(() => reopened.session(f.student.sessionToken), { code: 'LEARNING_UNAUTHORIZED' });
  } finally { reopened.close(); }
});
