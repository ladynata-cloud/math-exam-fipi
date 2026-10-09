'use strict';

// Synthetic accounts, a real HTTP boundary and a durable temporary SQLite file.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { initializeRuns } = require('../learning-runs');
const { tokenHash } = require('../learning-auth');
const ORIGIN = 'https://cabinet.example.test';
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const DEFAULT = { course: 'school', goal: null, focus: '', version: 0, updatedAt: null };
const op = () => crypto.randomUUID();
const input = (changes = {}) => ({ opId: op(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: 'Repeat fractions', ...changes });

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-profiles-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, clock: () => 1800000000000 });
  assert(store.available);
  const invited = store.bootstrap({ login: 'profile_teacher', name: 'Test teacher' });
  const teacher = store.activate(invited.invitationToken, HASH);
  const students = [1, 2].map(i => {
    const created = store.createStudent(teacher.account, { login: 'profile_pupil_' + i, name: 'Test pupil ' + i });
    return store.activate(created.invitationToken, HASH);
  });
  const api = createLearningApi({ store, publicOrigin: ORIGIN, secureCookies: true });
  const app = express(); app.use(express.json()); app.use('/api/learning', api.router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    store.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(session, route, body, extra = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': tokenHash('learning-csrf:' + session.sessionToken) } : {}) }), ...extra
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
  }
  return { store, filePath, teacher, students, request, route: '/teacher/students/' + students[0].account.id + '/profile' };
}

test('existing pupils default to school without database writes; profile reads never expose credentials', async t => {
  const f = await fixture(t), pupil = f.students[0];
  for (const [session, route] of [[pupil, '/profile'], [f.teacher, f.route]]) {
    const result = await f.request(session, route);
    assert.equal(result.status, 200); assert.deepEqual(result.body, { profile: DEFAULT });
    assert.equal(result.cache, 'no-store');
  }
  assert.deepEqual((await f.request(f.teacher, '/profile')).body, { profile: null });
  const roster = (await f.request(f.teacher, '/teacher/students')).body.students;
  assert.equal(roster.length, 2); roster.forEach(student => assert.deepEqual(student.profile, DEFAULT));
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_profiles').n, 0);
  assert(!JSON.stringify(roster).includes(HASH));
  assert(!Object.hasOwn((await f.request(pupil, '/session')).body.account, 'profile'), 'Authentication DTO stays unchanged');
});

test('teacher writes persist across a real restart and keep profiles separate from accounts and sessions', async t => {
  const f = await fixture(t), pupil = f.students[0], before = f.store.account(pupil.account.id);
  const result = await f.request(f.teacher, f.route, input({ goal: 'grade5', focus: '  Geometry\nProofs and explanations  ' }));
  const expected = { course: 'oge', goal: 'grade5', focus: 'Geometry\nProofs and explanations', version: 1, updatedAt: 1800000000000 };
  assert.equal(result.status, 200); assert.deepEqual(result.body, { profile: expected, duplicate: false });
  assert.deepEqual((await f.request(pupil, '/profile')).body.profile, expected);
  assert.deepEqual((await f.request(f.students[1], '/profile')).body.profile, DEFAULT);
  assert.deepEqual(f.store.account(pupil.account.id), before);
  f.store.close();
  const restored = new LearningStore({ filePath: f.filePath });
  try {
    assert(restored.available); assert.equal(restored.row('PRAGMA user_version').user_version, 1);
    assert.deepEqual(restored.studentProfile(restored.session(pupil.sessionToken), pupil.account.id), expected);
    assert.deepEqual(restored.students(restored.session(f.teacher.sessionToken)).find(student => student.id === pupil.account.id).profile, expected);
    assert.deepEqual(restored.account(pupil.account.id), before);
  } finally { restored.close(); }
});

test('additive initialization opens a pre-profile database without changing existing pupils or sessions', async t => {
  const f = await fixture(t), pupil = f.students[0], before = f.store.account(pupil.account.id);
  f.store.db.exec('DROP TABLE learning_profiles'); f.store.close();
  const restored = new LearningStore({ filePath: f.filePath });
  try {
    assert(restored.available); assert.equal(restored.row('PRAGMA user_version').user_version, 1);
    assert.deepEqual(restored.studentProfile(restored.session(pupil.sessionToken), pupil.account.id), DEFAULT);
    assert.deepEqual(restored.account(pupil.account.id), before);
    assert.equal(restored.row('SELECT COUNT(*) AS n FROM learning_profiles').n, 0);
  } finally { restored.close(); }
});

test('profile access enforces session, ownership, exact query shape, Origin and CSRF', async t => {
  const f = await fixture(t), pupil = f.students[0], body = input();
  assert.equal((await f.request(null, '/profile')).status, 401);
  assert.equal((await f.request(null, f.route, body)).status, 401);
  for (const session of f.students) {
    assert.equal((await f.request(session, f.route)).status, 403);
    assert.equal((await f.request(session, f.route, body)).status, 403);
  }
  assert.equal((await f.request(pupil, '/profile?learnerId=' + f.students[1].account.id)).status, 400);
  assert.equal((await f.request(f.teacher, f.route + '?learnerId=' + pupil.account.id)).status, 400);
  assert.equal((await f.request(f.teacher, f.route, body, { Origin: 'https://other.example.test' })).status, 403);
  assert.equal((await f.request(f.teacher, f.route, body, { 'X-CSRF-Token': 'invalid' })).status, 403);
  const absent = '/teacher/students/' + crypto.randomBytes(18).toString('base64url') + '/profile';
  assert.equal((await f.request(f.teacher, absent)).status, 404);
  assert.equal((await f.request(f.teacher, absent, body)).status, 404);
  assert.throws(() => f.store.studentProfile(pupil.account, f.students[1].account.id), { code: 'LEARNING_NOT_FOUND' });
  // Synthetic ownership change exercises the tenant boundary without weakening
  // the application's one-teacher constraint or creating another live account.
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', 'different_teacher_fixture', pupil.account.id);
  assert.equal((await f.request(f.teacher, f.route)).status, 404);
  assert.equal((await f.request(f.teacher, f.route, body)).status, 404);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_profiles').n, 0);
});

test('version fencing and operation receipts prevent stale writes and duplicate updates, including lost acknowledgements', async t => {
  const f = await fixture(t), first = input();
  const saved = await f.request(f.teacher, f.route, first);
  assert.equal(saved.status, 200); assert.equal(saved.body.profile.version, 1);
  const duplicate = await f.request(f.teacher, f.route, first);
  assert.equal(duplicate.status, 200); assert.equal(duplicate.body.duplicate, true);
  assert.deepEqual(duplicate.body.profile, saved.body.profile);
  assert.equal((await f.request(f.teacher, f.route, { ...first, goal: 'grade5' })).body.error, 'LEARNING_OP_CONFLICT');
  const stale = await f.request(f.teacher, f.route, input({ goal: 'grade5' }));
  assert.equal(stale.status, 409); assert.equal(stale.body.error, 'LEARNING_PROFILE_CONFLICT');
  const newer = await f.request(f.teacher, f.route, input({ expectedVersion: 1, goal: 'grade5' }));
  assert.equal(newer.status, 200); assert.equal(newer.body.profile.version, 2);
  const lateRetry = await f.request(f.teacher, f.route, first);
  assert.equal(lateRetry.body.duplicate, true); assert.equal(lateRetry.body.profile.version, 1);
  assert.deepEqual((await f.request(f.students[0], '/profile')).body.profile, newer.body.profile);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM operations').n, 2);
});

test('profile shape and values are bounded; OGE may have no goal and other courses cannot retain an OGE goal', async t => {
  const f = await fixture(t);
  const bad = [
    { course: 'unknown' }, { course: 'school', goal: 'pass' }, { course: 'foundations', goal: 'grade5' },
    { goal: '5' }, { goal: 5 }, { focus: null }, { focus: 'x'.repeat(1201) }, { focus: 'bad\u0000text' },
    { focus: 'bad\u202etext' }, { expectedVersion: -1 }, { expectedVersion: 0.5 }, { expectedVersion: '0' },
    { expectedVersion: Number.MAX_SAFE_INTEGER + 1 }, { teacherId: f.teacher.account.id }, { version: 5 }
  ];
  for (const change of bad) assert.equal((await f.request(f.teacher, f.route, input(change))).status, 400, JSON.stringify(change));
  const missing = input(); delete missing.focus;
  assert.equal((await f.request(f.teacher, f.route, missing)).status, 400);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_profiles').n, 0);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM operations').n, 0);
  let result = await f.request(f.teacher, f.route, input({ goal: null, focus: 'x'.repeat(1200) }));
  assert.equal(result.status, 200); assert.equal(result.body.profile.focus.length, 1200);
  for (const [index, course] of ['school', 'foundations', 'ege'].entries()) {
    result = await f.request(f.teacher, f.route, input({ expectedVersion: index + 1, course, goal: null, focus: '  ' }));
    assert.equal(result.status, 200); assert.equal(result.body.profile.course, course);
    assert.equal(result.body.profile.focus, ''); assert.equal(result.body.profile.goal, null);
  }
});

test('course progress includes achievements older than the recent 200 attempts and never exposes answer or state data', async t => {
  const f = await fixture(t), pupil = f.students[0];
  const make = (contentId, outcome, updatedAt, learner = pupil) => {
    const attempt = f.store.newAttempt(learner.account.id, f.teacher.account.id, 'ege-path', {
      taskSpec: { contentId, task: { q: 'Private question', answer: 'Private answer' } }, state: { draft: 'Private draft', done: true }
    });
    f.store.run('UPDATE attempts SET outcome=?,updated_at=? WHERE id=?', outcome, updatedAt, attempt.id);
    return attempt;
  };
  const old = make('older-completion', 'independent', 1800000000000);
  const later = make('older-completion', 'started', 1800000000001);
  const tied = make('older-completion', 'started', 1800000000001);
  for (let i = 0; i < 205; i++) make('recent-practice', 'started', 1800000000010 + i);
  assert.equal(f.store.listAttempts(pupil.account).length, 200);
  assert(!f.store.listAttempts(pupil.account).some(attempt => attempt.id === old.id));
  const response = await f.request(pupil, '/progress');
  assert.equal(response.status, 200); assert.equal(response.cache, 'no-store');
  assert.equal(response.body.progress.length, 2);
  assert.deepEqual(response.body.progress[1], {
    trainerId: 'ege-path', contentId: 'older-completion', completed: true,
    latest: { id: [later.id, tied.id].sort().at(-1), trainerId: 'ege-path', contentId: 'older-completion',
      outcome: 'started', updatedAt: 1800000000001, createdAt: 1800000000000 }
  });
  assert.equal(response.body.progress[0].completed, false, 'Client completion state never awards completion');
  assert(!JSON.stringify(response.body).includes('Private'));
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM operations').n, 0, 'Reading progress has no side effects');
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', 1800000000300, old.id);
  assert.equal((await f.request(pupil, '/progress')).body.progress[1].completed, false, 'Archived achievement no longer counts toward current progress');
});

test('progress is private, rejects query-selected pupils, and excludes unpublished, archived and board work', async t => {
  const f = await fixture(t), pupil = f.students[0], peer = f.students[1];
  const make = (learner, contentId) => f.store.newAttempt(learner.account.id, f.teacher.account.id, 'oge-basics', {
    taskSpec: { contentId }, state: {}
  });
  const draft = make(pupil, 'draft-private');
  f.store.run('INSERT INTO assignments(id,title,learner_id,teacher_id,attempt_id,created_at) VALUES(?,?,?,?,?,?)',
    crypto.randomBytes(18).toString('base64url'), 'Private draft', pupil.account.id, f.teacher.account.id, draft.id, 1800000000000);
  const archived = make(pupil, 'archived-work');
  f.store.run("UPDATE attempts SET archived_at=?,outcome='independent' WHERE id=?", 1800000000000, archived.id);
  f.store.newAttempt(pupil.account.id, f.teacher.account.id, 'board', { taskSpec: null, state: null });
  const peers = make(peer, 'peer-topic');
  assert.deepEqual((await f.request(pupil, '/progress')).body, { progress: [] });
  const other = (await f.request(peer, '/progress')).body.progress;
  assert.equal(other.length, 1); assert.equal(other[0].latest.id, peers.id);
  assert.equal((await f.request(null, '/progress')).status, 401);
  assert.equal((await f.request(f.teacher, '/progress')).status, 403);
  assert.equal((await f.request(pupil, '/progress?learnerId=' + peer.account.id)).status, 400);
  assert.equal((await f.request(pupil, '/progress?limit=200')).status, 400);
});

test('reward HTTP routes enforce session, teacher ownership and exact queries without exposing peer data', async t => {
  const f = await fixture(t), pupil = f.students[0], route = '/teacher/students/' + pupil.account.id + '/rewards';
  const own = await f.request(pupil, '/rewards');
  assert.equal(own.status, 200); assert.equal(own.body.totalPoints, 0); assert.equal(own.cache, 'no-store');
  assert.deepEqual((await f.request(f.teacher, route)).body, own.body);
  assert.equal((await f.request(null, '/rewards')).status, 401);
  assert.equal((await f.request(null, route)).status, 401);
  assert.equal((await f.request(f.teacher, '/rewards')).status, 403);
  assert.equal((await f.request(pupil, route)).status, 403);
  assert.equal((await f.request(f.students[1], route)).status, 403);
  assert.equal((await f.request(pupil, '/rewards?learnerId=' + f.students[1].account.id)).status, 400);
  assert.equal((await f.request(f.teacher, route + '?extra=1')).status, 400);
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', 'different_teacher_fixture', pupil.account.id);
  assert.equal((await f.request(f.teacher, route)).status, 404);
});

test('progress keeps active exam attempts behind the exam interface until the run finishes', async t => {
  const f = await fixture(t), pupil = f.students[0];
  initializeRuns(f.store);
  const attempt = f.store.newAttempt(pupil.account.id, f.teacher.account.id, 'ege-path', { taskSpec: { contentId: 'exam-topic' }, state: {} });
  const runId = crypto.randomBytes(18).toString('base64url');
  f.store.run(`INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,started_at)
    VALUES(?,?,?,'exam','[]','[]',?)`, runId, pupil.account.id, f.teacher.account.id, 1800000000000);
  f.store.run('INSERT INTO learning_run_attempts VALUES(?,?,1)', attempt.id, runId);
  assert.deepEqual((await f.request(pupil, '/progress')).body, { progress: [] });
  f.store.run("UPDATE attempts SET outcome='independent' WHERE id=?", attempt.id);
  f.store.run('UPDATE learning_runs SET finished_at=? WHERE id=?', 1800000000001, runId);
  const rows = (await f.request(pupil, '/progress')).body.progress;
  assert.equal(rows.length, 1); assert.equal(rows[0].latest.id, attempt.id); assert.equal(rows[0].completed, true);
});
