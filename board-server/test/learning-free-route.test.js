'use strict';

// Real local HTTP, durable SQLite and existing password hashing. All accounts
// and photos here are synthetic fixtures, never production pupil credentials.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { createLearningRunsRouter } = require('../learning-runs');
const { tokenHash, verifyPassword } = require('../learning-auth');
const contracts = require('../learning-contracts');
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const ORIGIN = 'https://cabinet.example.test';
const op = () => crypto.randomUUID();

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-free-route-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts, clock: () => 1800000000000 });
  assert(store.available);
  const invitation = store.bootstrap({ login: 'test_teacher', name: 'Test teacher' });
  const teacher = store.activate(invitation.invitationToken, HASH);
  const students = [1, 2].map(i => {
    const invited = store.createStudent(teacher.account, { login: 'test_student_' + i, name: 'Test student ' + i });
    return store.activate(invited.invitationToken, HASH);
  });
  const app = express(); app.use(express.json({ limit: '6mb' }));
  const api = createLearningApi({ store, publicOrigin: ORIGIN, secureCookies: true });
  const teaching = createTeachingRouter(api), runs = createLearningRunsRouter(api);
  app.use('/api/learning', api.router, teaching, runs.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    store.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(session, route, body, headers = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning` + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': tokenHash('learning-csrf:' + session.sessionToken) } : {}) }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function attempt(session = students[0]) {
    const result = await request(session, '/attempts', { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear', fresh: true });
    assert.equal(result.status, 201); return result.body.attempt;
  }
  async function photo(assignmentId, kind = 'solution', session = students[0]) {
    const sharp = require('sharp');
    const data = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#f0f5ff' } }).png().toBuffer();
    const result = await request(session, '/assignments/' + assignmentId + '/photos', {
      opId: op(), kind, filename: 'synthetic-test.png', mime: 'image/png', data: data.toString('base64')
    });
    assert.equal(result.status, 201); return result.body.photo;
  }
  return { store, api, teacher, students, request, attempt, photo, filePath };
}

test('preassigned login/password is immediately usable; only the scrypt hash persists and DTOs never echo it', async t => {
  const f = await fixture(t), password = 'synthetic unique password 83';
  let result = await f.request(f.teacher, '/teacher/students', { name: 'Test pupil', login: ' Preassigned.Pupil ', password });
  assert.equal(result.status, 201); assert.deepEqual(Object.keys(result.body), ['student']);
  const student = result.body.student;
  assert.equal(student.active, true); assert.equal(student.login, 'preassigned.pupil');
  const stored = f.store.account(student.id);
  assert.match(stored.password_hash, /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert(await verifyPassword(password, stored.password_hash));
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM invitations WHERE account_id=?', student.id).n, 0);
  for (const value of [password, stored.password_hash]) assert(!JSON.stringify(result.body).includes(value));
  result = await f.request(null, '/login', { login: student.login, password });
  assert.equal(result.status, 200); assert.equal(result.body.account.id, student.id); assert.match(result.cookie, /HttpOnly/);
  const teacherList = await f.request(f.teacher, '/teacher/students');
  assert(!JSON.stringify(teacherList.body).includes(password)); assert(!JSON.stringify(teacherList.body).includes(stored.password_hash));
  for (const table of ['operations', 'events']) assert(!JSON.stringify(f.store.rows('SELECT * FROM ' + table)).includes(password));
  assert(!fs.readFileSync(f.filePath).includes(Buffer.from(password)), 'Raw password must not enter SQLite pages');
});

test('password creation requires teacher, CSRF and strict request shape; it cannot reset an existing account', async t => {
  const f = await fixture(t), body = { name: 'Test pupil', login: 'preassigned_pupil', password: 'synthetic unique password 83' };
  assert.equal((await f.request(null, '/teacher/students', body)).status, 401);
  assert.equal((await f.request(f.students[0], '/teacher/students', { ...body, password: 'short' })).status, 403);
  assert.equal((await f.request(f.teacher, '/teacher/students', body, { 'X-CSRF-Token': 'invalid' })).status, 403);
  assert.equal((await f.request(f.teacher, '/teacher/students', body, { Origin: 'https://other.example' })).status, 403);
  for (const bad of [{ ...body, passwordHash: HASH }, { ...body, role: 'teacher' }, { ...body, password: '' }, { ...body, password: null }, { ...body, password: 'x'.repeat(129) }]) {
    assert.equal((await f.request(f.teacher, '/teacher/students', bad)).status, 400);
  }
  assert.equal(f.store.accountByLogin(body.login), undefined);
  const original = f.store.account(f.students[0].account.id);
  assert.equal((await f.request(f.teacher, '/teacher/students', { ...body, login: original.login })).status, 409);
  assert.deepEqual(f.store.account(original.id), original);
  assert.throws(() => f.store.createStudent(f.teacher.account, { name: body.name, login: body.login, password: body.password }));
  assert.throws(() => f.store.createStudent(f.teacher.account, { name: body.name, login: body.login }, body.password));
});

test('session revocation during asynchronous password hashing prevents account creation', async t => {
  const f = await fixture(t);
  const lookup = f.store.accountByLogin.bind(f.store);
  let entered;
  const observed = new Promise(resolve => { entered = resolve; });
  f.store.accountByLogin = login => { const result = lookup(login); if (login === 'revoked_creation') entered(); return result; };
  const pending = f.request(f.teacher, '/teacher/students', { name: 'Test pupil', login: 'revoked_creation', password: 'synthetic revoked password' });
  await observed; f.store.logout(f.teacher.sessionToken);
  const result = await pending;
  assert.equal(result.status, 401); assert.equal(lookup('revoked_creation'), undefined);
});

test('omitting password preserves one-use invitation activation', async t => {
  const f = await fixture(t);
  const result = await f.request(f.teacher, '/teacher/students', { name: 'Invited pupil', login: 'invited_pupil' });
  assert.equal(result.status, 201); assert.equal(result.body.student.active, false);
  assert.equal(typeof result.body.invitationToken, 'string'); assert.equal(typeof result.body.expiresAt, 'number');
  const active = f.store.activate(result.body.invitationToken, HASH);
  assert.equal(active.account.active, true);
  assert.throws(() => f.store.activate(result.body.invitationToken, HASH), { code: 'LEARNING_ACCESS_INVALID' });
});

test('student plan is bound to own session; cross-student queries and plan mutations stay forbidden', async t => {
  const f = await fixture(t), [student, peer] = f.students;
  const plan = { opId: op(), items: [{ catalogId: 'path:equations-linear', reason: 'Test recommendation', priority: 'normal' }], note: 'Student-specific route' };
  assert.equal((await f.request(f.teacher, '/teacher/students/' + student.account.id + '/plan', plan)).status, 200);
  const own = await f.request(student, '/plan');
  assert.equal(own.status, 200); assert.deepEqual(own.body.items, plan.items); assert.equal(own.body.note, plan.note);
  assert.deepEqual((await f.request(peer, '/plan')).body, { items: [], note: '', updatedAt: null });
  assert.equal((await f.request(null, '/plan')).status, 401);
  assert.equal((await f.request(f.teacher, '/plan')).status, 403);
  assert.equal((await f.request(peer, '/plan?studentId=' + student.account.id)).status, 400);
  assert.equal((await f.request(peer, '/teacher/students/' + student.account.id + '/plan')).status, 403);
  assert.equal((await f.request(student, '/teacher/students/' + student.account.id + '/plan', plan)).status, 403);
});

test('self-study submission is durable, idempotent, versioned and never claims successful solving', async t => {
  const f = await fixture(t), student = f.students[0], attempt = await f.attempt();
  const body = { opId: op(), expectedVersion: attempt.version };
  let result = await f.request(student, '/attempts/' + attempt.id + '/submit', body);
  assert.equal(result.status, 200); assert.equal(result.body.duplicate, false);
  assert.equal(result.body.attempt.version, attempt.version); assert.equal(result.body.attempt.outcome, 'started');
  assert.deepEqual(result.body.attempt.submission, { submittedAt: 1800000000000, attemptVersion: 0, revision: 1, photoIds: [], stale: false, status: 'submitted' });
  result = await f.request(student, '/attempts/' + attempt.id + '/submit', body);
  assert.equal(result.status, 200); assert.equal(result.body.duplicate, true);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_submissions').n, 1);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM events WHERE attempt_id=?', attempt.id).n, 0);
  result = await f.request(student, '/attempts/' + attempt.id + '/actions', { opId: op(), expectedVersion: attempt.version, type: 'hint', payload: {} });
  assert.equal(result.status, 200); assert.equal(result.body.attempt.submission.stale, true);
  assert.equal(f.store.getAttempt(student.account, attempt.id).submission.stale, true);
  assert.equal((await f.request(student, '/attempts/' + attempt.id + '/submit', { opId: op(), expectedVersion: 0 })).status, 409);
  result = await f.request(student, '/attempts/' + attempt.id + '/submit', { opId: op(), expectedVersion: 1 });
  assert.equal(result.status, 200); assert.equal(result.body.attempt.submission.stale, false); assert.equal(result.body.attempt.assistance.hints, true);
  const listed = await f.request(f.teacher, '/attempts');
  assert.equal(listed.body.attempts.find(row => row.id === attempt.id).submission.attemptVersion, 1);
  const report = await f.request(f.teacher, '/teacher/students/' + student.account.id + '/report');
  assert.equal(report.body.attempts.find(row => row.id === attempt.id).submission.attemptVersion, 1);
  f.store.close();
  const restored = new LearningStore({ filePath: f.filePath, contracts });
  t.after(() => restored.close());
  createTeachingRouter(createLearningApi({ store: restored, publicOrigin: ORIGIN }));
  assert.equal(restored.getAttempt(student.account, attempt.id).submission.attemptVersion, 1);
});

test('submission rejects anonymous, teacher, peer, stale, archived, unpublished and active-exam attempts', async t => {
  const f = await fixture(t), student = f.students[0], attempt = await f.attempt();
  const submit = session => f.request(session, '/attempts/' + attempt.id + '/submit', { opId: op(), expectedVersion: 0 });
  assert.equal((await submit(null)).status, 401); assert.equal((await submit(f.teacher)).status, 403);
  assert.equal((await submit(f.students[1])).status, 404);
  assert.equal((await f.request(student, '/attempts/' + attempt.id + '/submit', { opId: op(), expectedVersion: 0 }, { 'X-CSRF-Token': 'invalid' })).status, 403);
  assert.equal((await f.request(student, '/attempts/' + attempt.id + '/submit', { opId: op(), expectedVersion: 0, outcome: 'independent' })).status, 400);
  let result = await f.request(f.teacher, '/assignments', { opId: op(), learnerIds: [student.account.id], title: 'Draft', trainerId: 'ege-path', contentId: 'equations-linear' });
  assert.equal((await f.request(student, '/attempts/' + result.body.assignments[0].attemptId + '/submit', { opId: op(), expectedVersion: 0 })).status, 404);
  result = await f.request(student, '/runs', { opId: op(), kind: 'exam' });
  assert.equal(result.status, 201);
  assert.equal((await f.request(student, '/attempts/' + result.body.run.questions[0].attemptId + '/submit', { opId: op(), expectedVersion: 0 })).status, 409);
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', 1800000000000, attempt.id);
  assert.equal((await submit(student)).status, 409);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_submissions').n, 0);
});

test('homework submission snapshots photos and feedback generations, even when every timestamp ties', async t => {
  const f = await fixture(t), student = f.students[0];
  let result = await f.request(f.teacher, '/assignments', { opId: op(), learnerIds: [student.account.id], title: 'Photo homework', trainerId: 'ege-path', contentId: 'equations-linear' });
  const assignment = result.body.assignments[0], route = '/attempts/' + assignment.attemptId + '/submit';
  await f.photo(assignment.id, 'task', f.teacher);
  assert.equal((await f.request(f.teacher, '/assignments/' + assignment.id + '/publish', { opId: op() })).status, 200);
  assert.equal((await f.request(student, route, { opId: op(), expectedVersion: 0 })).body.error, 'LEARNING_SOLUTION_PHOTO_REQUIRED');
  const first = await f.photo(assignment.id);
  const initialBody = { opId: op(), expectedVersion: 0 };
  result = await f.request(student, route, initialBody);
  assert.equal(result.status, 200); assert.deepEqual(result.body.attempt.submission.photoIds, [first.id]);
  const feedback = async status => {
    const detail = await f.request(f.teacher, '/assignments/' + assignment.id);
    return f.request(f.teacher, '/assignments/' + assignment.id + '/feedback', { opId: op(), text: 'Synthetic feedback', status, reviewRevision: detail.body.reviewRevision });
  };
  assert.equal((await feedback('revise')).status, 200);
  assert.equal(f.store.getAttempt(student.account, assignment.attemptId).submission.status, 'revise');
  const second = await f.photo(assignment.id);
  assert.equal(f.store.getAttempt(student.account, assignment.attemptId).submission.stale, true);
  result = await f.request(student, route, { opId: op(), expectedVersion: 0 });
  assert.equal(result.body.attempt.submission.status, 'submitted'); assert.equal(result.body.attempt.submission.stale, false);
  assert.deepEqual(result.body.attempt.submission.photoIds, [first.id, second.id].sort());
  assert.equal((await feedback('accepted')).status, 200);
  assert.equal(f.store.getAttempt(student.account, assignment.attemptId).submission.status, 'accepted');
  const reviewedDetail = await f.request(f.teacher, '/assignments/' + assignment.id);
  assert.equal(reviewedDetail.body.feedback[0].status, 'accepted');
  const reviewedReport = await f.request(f.teacher, '/teacher/students/' + student.account.id + '/report');
  assert.equal(reviewedReport.body.assignments.find(row => row.id === assignment.id).photoReview.status, 'accepted');
  // A lost acknowledgement from the earlier submit must not replace the newer snapshot.
  result = await f.request(student, route, initialBody);
  assert.equal(result.body.duplicate, true); assert.equal(result.body.attempt.submission.status, 'accepted');
  assert.equal(result.body.attempt.submission.photoIds.length, 2);
  const snapshot = f.store.getAttempt(student.account, assignment.attemptId);
  assert.equal(snapshot.outcome, 'started'); assert.equal(snapshot.version, 0);
});

test('stale teacher view cannot review an unseen submission or newly added photos, even with identical timestamps and attempt versions', async t => {
  const f = await fixture(t), student = f.students[0];
  let result = await f.request(f.teacher, '/assignments', { opId: op(), learnerIds: [student.account.id], title: 'Review conflict', trainerId: 'ege-path', contentId: 'equations-linear' });
  const assignment = result.body.assignments[0], route = '/assignments/' + assignment.id;
  await f.photo(assignment.id, 'task', f.teacher);
  assert.equal((await f.request(f.teacher, route + '/publish', { opId: op() })).status, 200);
  await f.photo(assignment.id);
  const view = async () => (await f.request(f.teacher, route)).body;
  const review = (detail, opId = op()) => f.request(f.teacher, route + '/feedback', {
    opId, text: 'I inspected the displayed snapshot', status: 'accepted', reviewRevision: detail.reviewRevision
  });
  const submit = () => f.request(student, '/attempts/' + assignment.attemptId + '/submit', { opId: op(), expectedVersion: 0 });
  const legacy = await view();
  // The legacy unsubmitted photo workflow also protects the photo snapshot.
  await f.photo(assignment.id);
  assert.equal((await review(legacy)).body.error, 'LEARNING_REVIEW_CONFLICT');
  assert.equal((await f.request(f.teacher, route + '/feedback', { opId: op(), text: 'Missing snapshot', status: 'accepted' })).status, 400);
  const latestLegacy = await view(), legacyReviewOp = op();
  assert.equal((await review(latestLegacy, legacyReviewOp)).status, 200);
  assert.equal((await submit()).status, 200);
  const firstSubmission = await view();
  assert.equal(firstSubmission.attempt.submission.revision, 1);
  assert.equal((await submit()).status, 200);
  const secondSubmission = await view();
  assert.equal(secondSubmission.attempt.submission.revision, 2);
  assert.equal(firstSubmission.attempt.version, secondSubmission.attempt.version);
  assert.equal(firstSubmission.attempt.submission.submittedAt, secondSubmission.attempt.submission.submittedAt);
  assert.notEqual(firstSubmission.reviewRevision, secondSubmission.reviewRevision);
  assert.equal((await review(firstSubmission)).body.error, 'LEARNING_REVIEW_CONFLICT');
  await f.photo(assignment.id);
  assert.equal((await review(secondSubmission)).body.error, 'LEARNING_REVIEW_CONFLICT');
  const dirtySubmission = await view();
  assert.equal(dirtySubmission.attempt.submission.stale, true);
  assert.equal((await review(dirtySubmission)).body.error, 'LEARNING_REVIEW_CONFLICT', 'New photos must be explicitly submitted before reviewing a submitted workflow');
  assert.equal((await submit()).status, 200);
  const cleanSubmission = await view(), acceptedOp = op();
  assert.equal((await review(cleanSubmission, acceptedOp)).status, 200);
  assert.equal(f.store.getAttempt(student.account, assignment.attemptId).submission.status, 'accepted');
  // Lost acknowledgements are replayed without applying the old verdict to the
  // newer submission, and without inserting another feedback row.
  assert.equal((await submit()).status, 200);
  result = await review(cleanSubmission, acceptedOp);
  assert.equal(result.status, 200); assert.equal(result.body.duplicate, true);
  assert.equal(f.store.getAttempt(student.account, assignment.attemptId).submission.status, 'submitted');
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_feedback WHERE assignment_id=?', assignment.id).n, 2);
  result = await review(latestLegacy, legacyReviewOp);
  assert.equal(result.body.duplicate, true);
  assert.equal(f.store.getAttempt(student.account, assignment.attemptId).submission.status, 'submitted');
});
