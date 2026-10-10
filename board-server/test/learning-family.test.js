'use strict';

// Real HTTP + SQLite; all people and credentials below are synthetic fixtures.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { createLearningRunsRouter } = require('../learning-runs');
const { FamilyAccess } = require('../learning-family');
const { hashPassword, tokenHash } = require('../learning-auth');
const contracts = require('../learning-contracts');
const ORIGIN = 'https://family.example.test', DAY = 86400000;
const PASSWORD = 'synthetic family password';
const hashed = hashPassword(PASSWORD);
const secret = () => randomBytes(32).toString('base64url');

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-family-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1800000000000;
  const store = new LearningStore({ filePath, contracts, clock: () => now }); assert(store.available);
  const teacher = store.activate(store.bootstrap({ login: 'family_teacher', name: 'Fixture teacher' }).invitationToken, await hashed);
  const pending = store.createStudent(teacher.account, { login: 'family_pending', name: 'Fixture pending pupil' });
  const student = store.createSession(store.createStudent(teacher.account, { login: 'family_pupil', name: 'Fixture pupil' }, await hashed).student.id);
  const peer = store.createSession(store.createStudent(teacher.account, { login: 'family_peer', name: 'Fixture peer' }, await hashed).student.id);
  const api = createLearningApi({ store, clock: () => now, publicOrigin: ORIGIN, secureCookies: true });
  const runs = createLearningRunsRouter(api), teaching = createTeachingRouter(api), family = new FamilyAccess(store);
  const app = express(); app.use(express.json()); app.use('/api/learning', api.router, runs.router, teaching);
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
  const route = id => '/teacher/students/' + id + '/parent-access';
  async function issue(id = student.account.id) {
    const before = await request(route(id)); assert.equal(before.status, 200);
    const result = await request(route(id), { name: 'Fixture parent', expectedVersion: before.body.parentAccess.version });
    assert.equal(result.status, 200); return result.body;
  }
  const activate = (invitationToken, password = PASSWORD) => request('/parent/activate', { token: invitationToken, password }, null);
  const login = (login, password = PASSWORD, session = null) => request('/parent/login', { login, password }, session);
  async function activated(id = student.account.id) { const issued = await issue(id), parent = await activate(issued.invitationToken); assert.equal(parent.status, 200); return { issued, parent }; }
  return { store, family, runs, filePath, api, teacher, student, peer, pending, request, route, issue, activate, activated, login, now: () => now, advance: ms => { now += ms; } };
}

test('parent invitation keeps legacy long credentials, one-use activation and separate 30-day sessions', async t => {
  const f = await fixture(t), id = f.pending.student.id;
  assert.deepEqual((await f.request(f.route(id))).body.parentAccess,
    { exists: false, name: '', login: '', enabled: false, active: false, version: 0, invitationExpiresAt: null });
  const issued = await f.issue(id); assert.match(issued.invitationToken, /^[A-Za-z0-9_-]{43}$/);
  assert.match(issued.parentAccess.login, /^parent-[a-z0-9_-]{16}$/);
  assert.deepEqual(issued.parentAccess, { exists: true, name: 'Fixture parent', login: issued.parentAccess.login,
    enabled: true, active: false, version: 1, invitationExpiresAt: f.now() + 7 * DAY });
  assert.equal((await f.request('/parent/activate', { token: issued.invitationToken, password: '12345678' }, null)).status, 400);
  const parent = await f.activate(issued.invitationToken); assert.equal(parent.status, 200);
  assert.deepEqual(parent.body.parent, { name: 'Fixture parent', login: issued.parentAccess.login });
  assert.match(parent.cookie, /^__Host-mathexam_parent=/);
  assert.match(parent.headers.get('set-cookie'), /Path=\/; HttpOnly; SameSite=Strict; Secure; Max-Age=2592000/);
  assert.equal(parent.headers.get('cache-control'), 'no-store');
  assert.equal((await f.activate(issued.invitationToken)).status, 401);
  assert.equal((await f.request('/parent/session', undefined, parent)).status, 200);
  assert.equal((await f.login(issued.parentAccess.login)).status, 200);
  assert.equal((await f.request('/parent/session', undefined, f.teacher)).status, 401);
  assert.equal((await f.request('/session', undefined, parent)).status, 401);
  assert.equal(f.store.account(id).password_hash, null);
  assert.equal(f.store.invitation(f.pending.invitationToken).used_at, null);
  const metadata = (await f.request(f.route(id))).body.parentAccess;
  assert.equal(metadata.version, 2); assert.equal(metadata.active, true); assert.equal(metadata.invitationExpiresAt, null);
});

test('management checks teacher ownership, exact bodies, version CAS, Origin and CSRF; no raw token receipts', async t => {
  const f = await fixture(t), route = f.route(f.student.account.id), body = { name: 'Fixture parent', expectedVersion: 0 };
  for (const endpoint of [route, route + '/revoke']) {
    assert.equal((await f.request(endpoint, body, null)).status, 401);
    assert.equal((await f.request(endpoint, body, f.student)).status, 403);
    assert.equal((await f.request(endpoint, body, f.teacher, { Origin: 'https://outside.example.test' })).status, 403);
    assert.equal((await f.request(endpoint, body, f.teacher, { 'X-CSRF-Token': 'wrong' })).status, 403);
    assert.equal((await f.request(endpoint, body, f.teacher, { 'Content-Type': 'text/plain' })).status, 415);
  }
  assert.equal((await f.request(route, undefined, f.peer)).status, 403);
  assert.equal((await f.request(f.route(f.teacher.account.id))).status, 404);
  const foreign = f.store.createStudent(f.teacher.account, { login: 'foreign_fixture', name: 'Foreign fixture pupil' }).student;
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', f.peer.account.id, foreign.id);
  assert.equal((await f.request(f.route(foreign.id), body)).status, 404);
  for (const invalid of [{}, { ...body, expectedVersion: -1 }, { ...body, expectedVersion: '0' }, { ...body, expectedVersion: Number.MAX_SAFE_INTEGER },
    { ...body, name: '<script>' }, { ...body, opId: 'forbidden-receipt' }]) assert.equal((await f.request(route, invalid)).status, 400);
  assert.equal((await f.request(route + '?token=not-accepted')).status, 400);
  const issued = await f.issue();
  const retry = await f.request(route, body); assert.equal(retry.status, 409); assert.equal(retry.body.error, 'LEARNING_PARENT_CONFLICT');
  assert.equal((await f.request(route)).body.parentAccess.version, 1);
  const stored = f.store.row('SELECT * FROM learning_parent_invitations');
  assert.equal(stored.hash, tokenHash(issued.invitationToken));
  assert(!JSON.stringify(f.store.rows('SELECT * FROM operations')).includes(issued.invitationToken));
  assert(!JSON.stringify((await f.request(route)).body).includes(issued.invitationToken));
  assert(!fs.readFileSync(f.filePath).includes(Buffer.from(issued.invitationToken)));
});

test('rotation/revocation invalidate only parent credentials immediately; tombstones survive activation and prevent stale issue', async t => {
  const f = await fixture(t), id = f.student.account.id, childBefore = f.store.account(id), { issued, parent } = await f.activated();
  const second = await f.issue();
  assert.equal(second.parentAccess.version, 3); assert.equal(second.parentAccess.login, issued.parentAccess.login);
  assert.equal((await f.request('/parent/session', undefined, parent)).status, 401);
  assert.equal((await f.login(issued.parentAccess.login)).status, 401);
  assert.equal((await f.activate(issued.invitationToken)).status, 401);
  const newParent = await f.activate(second.invitationToken); assert.equal(newParent.status, 200);
  assert.equal((await f.request(f.route(id), { name: 'Fixture parent', expectedVersion: 3 })).status, 409);
  const revoked = await f.request(f.route(id) + '/revoke', { expectedVersion: 4 });
  assert.deepEqual(revoked.body.parentAccess, { exists: true, name: 'Fixture parent', login: issued.parentAccess.login,
    enabled: false, active: false, version: 5, invitationExpiresAt: null });
  assert.equal((await f.request('/parent/overview', undefined, newParent)).status, 401);
  assert.equal((await f.login(issued.parentAccess.login)).status, 401);
  assert.deepEqual(f.store.account(id), childBefore);
  for (const actor of [f.student, f.teacher, f.peer]) assert.equal((await f.request('/session', undefined, actor)).status, 200);
  const renewed = await f.issue(); assert.equal(renewed.parentAccess.version, 6);
  assert.equal((await f.login(issued.parentAccess.login)).status, 401);
  assert.equal((await f.activate(renewed.invitationToken)).status, 200);
});

test('child password/invitation/QR changes leave parent access intact', async t => {
  const f = await fixture(t), id = f.student.account.id, { parent } = await f.activated();
  const quick = f.store.writeStudentQuickAccess(f.teacher.sessionToken, id, { expectedVersion: 0 });
  f.store.quickLogin(quick.quickToken);
  const original = f.store.account(id);
  f.store.replaceStudentPassword(f.teacher.sessionToken, id, await hashed, original.password_hash, original.auth_epoch);
  assert.equal((await f.request('/parent/overview', undefined, parent)).status, 200);
  const invite = f.store.recoverStudent(f.teacher.account, id); f.store.activate(invite.invitationToken, await hashed);
  assert.equal((await f.request('/parent/session', undefined, parent)).status, 200);
  const version = f.store.studentQuickAccess(f.teacher.account, id).version;
  f.store.writeStudentQuickAccess(f.teacher.sessionToken, id, { expectedVersion: version }, true);
  assert.equal((await f.request('/parent/overview', undefined, parent)).status, 200);
});

test('parent principal cannot read or mutate any student/teacher resources, and signed-in parents cannot switch silently', async t => {
  const f = await fixture(t), { parent, issued } = await f.activated(), other = await f.issue(f.peer.account.id);
  for (const route of ['/session', '/profile', '/attempts', '/assignments', '/teacher/students', '/teacher/students/' + f.student.account.id + '/report', '/progress', '/rewards']) {
    assert.equal((await f.request(route, undefined, parent)).status, 401, route);
  }
  assert.equal((await f.request('/attempts', {}, parent)).status, 401);
  assert.equal((await f.request('/parent/attempts', {}, parent)).status, 404);
  assert.equal((await f.request('/parent/unknown', undefined, null)).status, 404);
  assert.equal((await f.request('/parent/activate', { token: other.invitationToken, password: PASSWORD }, parent)).body.error, 'LEARNING_PARENT_ALREADY_SIGNED_IN');
  assert.equal((await f.login(issued.parentAccess.login, PASSWORD, parent)).body.error, 'LEARNING_PARENT_ALREADY_SIGNED_IN');
  const both = { cookie: parent.cookie + '; __Host-mathexam_learning=' + f.teacher.sessionToken, body: parent.body };
  assert.equal((await f.request('/session', undefined, both)).body.account.role, 'teacher');
  assert.equal((await f.request('/parent/session', undefined, both)).body.parent.login, issued.parentAccess.login);
  assert.equal((await f.request('/parent/logout', {}, parent, { 'X-CSRF-Token': 'wrong' })).status, 403);
  assert.equal((await f.request('/parent/logout', {}, both)).status, 200);
  assert.equal((await f.request('/session', undefined, f.teacher)).status, 200);
  assert.equal((await f.request('/parent/session', undefined, parent)).status, 401);
});

test('safe overview counts all eligible attempts and published homework, excludes private payloads and active exams before aggregation', async t => {
  const f = await fixture(t), { parent } = await f.activated(), id = f.student.account.id, tid = f.teacher.account.id;
  const generated = contracts.create('ege-path', 'equations-linear', 42), ids = [];
  f.store.transaction(() => {
    for (let i = 0; i < 205; i++) {
      const attempt = f.store.newAttempt(id, tid, 'ege-path', generated); ids.push(attempt.id);
      f.store.run('UPDATE attempts SET outcome=?,updated_at=? WHERE id=?', i === 0 ? 'independent' : 'started', f.now() + i, attempt.id);
    }
    const hidden = ['archived', 'draft', 'archived-assignment', 'active-exam'];
    for (const kind of hidden) {
      const attempt = f.store.newAttempt(id, tid, 'ege-path', generated);
      f.store.run("UPDATE attempts SET outcome='independent',updated_at=? WHERE id=?", f.now() + 1000, attempt.id);
      if (kind === 'archived') f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', f.now(), attempt.id);
      if (kind === 'draft' || kind === 'archived-assignment') f.store.run('INSERT INTO assignments(id,title,learner_id,teacher_id,attempt_id,status,created_at) VALUES(?,?,?,?,?,?,?)', secret(), 'PRIVATE_HIDDEN_TITLE', id, tid, attempt.id, kind === 'draft' ? 'draft' : 'archived', f.now());
      if (kind === 'active-exam') {
        const rid = secret();
        f.store.run('INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,started_at) VALUES(?,?,?,?,?,?,?)', rid, id, tid, 'fixture', '[]', '{}', f.now());
        f.store.run('INSERT INTO learning_run_attempts(attempt_id,run_id,position) VALUES(?,?,?)', attempt.id, rid, 0);
      }
    }
    f.store.newAttempt(f.peer.account.id, tid, 'ege-path', generated);
    for (let i = 0; i < 25; i++) f.store.run('INSERT INTO assignments(id,title,learner_id,teacher_id,attempt_id,status,created_at) VALUES(?,?,?,?,?,?,?)', 'visible_hw_' + i, 'Published practice ' + i, id, tid, ids[i], 'published', f.now() + i);
    f.store.run('INSERT INTO learning_submissions VALUES(?,?,?,?,?,?,?,?)', ids[24], id, 0, f.now(), 'visible_hw_24', '[]', 0, 1);
    f.store.run('INSERT INTO learning_profiles VALUES(?,?,?,?,?,?,?)', id, tid, 'oge', 'pass', 'PRIVATE_TEACHER_FOCUS', 1, f.now());
    f.store.run('INSERT INTO learning_feedback VALUES(?,?,?,?,?,?)', secret(), 'visible_hw_24', tid, 'PRIVATE_FEEDBACK', 'reviewed', f.now());
  });
  const result = await f.request('/parent/overview', undefined, parent); assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body).sort(), ['fetchedAt', 'homework', 'profile', 'progress', 'student']);
  assert.deepEqual(result.body.student, { name: 'Fixture pupil' }); assert.deepEqual(result.body.profile, { course: 'oge', goal: 'pass' });
  assert.equal(result.body.fetchedAt, f.now());
  const p = result.body.progress;
  assert.equal(p.totalAttempts, 205); assert.equal(p.completedAttempts, 1); assert.equal(p.independentAttempts, 1); assert.equal(p.startedAttempts, 204);
  assert.equal(p.recent.length, 20); assert.equal(p.lastActivityAt, f.now() + 204);
  assert.equal(p.recent[0].title, contracts.list().find(item => item.contentId === 'equations-linear').title);
  assert.deepEqual(Object.keys(p.recent[0]).sort(), ['outcome', 'title', 'updatedAt']);
  assert.equal(result.body.homework.total, 25); assert.equal(result.body.homework.recent.length, 20);
  assert.equal(result.body.homework.recent[0].submittedAt, f.now());
  assert(!JSON.stringify(result.body).includes('PRIVATE_'));
  for (const forbidden of ['taskSpec', 'teacherId', 'learnerId', 'state', 'strokes', 'answer', 'photo', 'feedback', 'sessionToken']) assert(!JSON.stringify(result.body).includes('"' + forbidden + '"'));
  f.store.run('UPDATE attempts SET version=1 WHERE id=?', ids[24]);
  assert.equal((await f.request('/parent/overview', undefined, parent)).body.homework.recent[0].submittedAt, null);
  f.store.run('UPDATE attempts SET version=0 WHERE id=?', ids[24]);
  f.store.run('INSERT INTO learning_photo_files VALUES(?,?,?)', 'fixture_file_hash', 1, Buffer.from('x'));
  f.store.run('INSERT INTO learning_photos VALUES(?,?,?,?,?,?,?,?,?,?,?)', 'PRIVATE_PHOTO_ID', 'visible_hw_24', id,
    'solution', 'image/png', 'fixture.png', 1, 1, 1, 'fixture_file_hash', f.now());
  assert.equal((await f.request('/parent/overview', undefined, parent)).body.homework.recent[0].submittedAt, null);
  f.store.run('DELETE FROM learning_photos WHERE id=?', 'PRIVATE_PHOTO_ID');
  f.store.run('INSERT INTO learning_feedback VALUES(?,?,?,?,?,?)', secret(), 'visible_hw_24', tid, 'PRIVATE_REVISION_NOTE', 'revise', f.now());
  assert.equal((await f.request('/parent/overview', undefined, parent)).body.homework.recent[0].submittedAt, null);
});

test('pupil initial/replacement and parent invitations last seven days and expire at the exact boundary', async t => {
  const f = await fixture(t), issued = await f.issue(), recovery = f.store.recoverStudent(f.teacher.account, f.student.account.id), pupilHash = await hashed;
  const expiresAt = f.now() + 7 * DAY;
  assert.equal(f.pending.expiresAt, expiresAt);
  assert.equal(recovery.expiresAt, expiresAt);
  assert.equal(issued.parentAccess.invitationExpiresAt, expiresAt);
  f.advance(7 * DAY - 1);
  assert.equal(f.store.invitation(f.pending.invitationToken).account_id, f.pending.student.id);
  assert.equal(f.store.invitation(recovery.invitationToken).account_id, f.student.account.id);
  assert.equal(f.family.invitation(issued.invitationToken).invitation.expires_at, expiresAt);
  assert.equal((await f.request(f.route(f.student.account.id))).body.parentAccess.invitationExpiresAt, expiresAt);
  f.advance(1);
  assert.equal((await f.activate(issued.invitationToken)).status, 401);
  const expiredMetadata = (await f.request(f.route(f.student.account.id))).body.parentAccess;
  assert.equal(expiredMetadata.invitationExpiresAt, expiresAt, 'Expired metadata retains the exact deadline instead of reporting an invitation as waiting');
  assert.equal(expiredMetadata.active, false);
  assert.equal(expiredMetadata.enabled, true);
  assert(!JSON.stringify(expiredMetadata).includes(issued.invitationToken));
  assert.equal(f.store.students(f.teacher.account).find(row => row.id === f.pending.student.id).invitationExpiresAt, expiresAt);
  assert.throws(() => f.store.activate(f.pending.invitationToken, pupilHash), /LEARNING_ACCESS_INVALID/);
  assert.throws(() => f.store.invitation(recovery.invitationToken), /LEARNING_ACCESS_INVALID/);
  const { parent } = await f.activated();
  f.advance(30 * DAY - 1); assert.equal((await f.request('/parent/session', undefined, parent)).status, 200);
  f.advance(1); assert.equal((await f.request('/parent/session', undefined, parent)).status, 401);
});

test('persisted three-day invitations retain their original expiry after reopen; replacements receive a new week', async t => {
  const f = await fixture(t), issued = await f.issue(), originalExpiry = f.now() + 3 * DAY;
  // Model invitations saved by the prior release; a new binary must not extend them.
  f.store.run('UPDATE invitations SET expires_at=? WHERE hash=?', originalExpiry, tokenHash(f.pending.invitationToken));
  f.store.run('UPDATE learning_parent_invitations SET expires_at=? WHERE hash=?', originalExpiry, tokenHash(issued.invitationToken));
  f.store.close();
  const reopened = new LearningStore({ filePath: f.filePath, contracts, clock: f.now });
  try {
    const family = new FamilyAccess(reopened);
    assert.equal(reopened.invitation(f.pending.invitationToken).expires_at, originalExpiry);
    assert.equal(family.invitation(issued.invitationToken).invitation.expires_at, originalExpiry);
    f.advance(3 * DAY - 1);
    assert.equal(reopened.invitation(f.pending.invitationToken).account_id, f.pending.student.id);
    assert.equal(family.metadata(f.student.account.id).invitationExpiresAt, originalExpiry);
    f.advance(1);
    assert.throws(() => reopened.invitation(f.pending.invitationToken), /LEARNING_ACCESS_INVALID/);
    assert.throws(() => family.invitation(issued.invitationToken), /LEARNING_PARENT_INVITATION_INVALID/);
    const pupilReplacement = reopened.recoverStudent(f.teacher.account, f.pending.student.id);
    const parentReplacement = family.write(f.teacher.sessionToken, f.student.account.id,
      { name: 'Fixture parent', expectedVersion: issued.parentAccess.version });
    assert.equal(pupilReplacement.expiresAt, f.now() + 7 * DAY);
    assert.equal(parentReplacement.parentAccess.invitationExpiresAt, f.now() + 7 * DAY);
    assert.throws(() => reopened.invitation(f.pending.invitationToken), /LEARNING_ACCESS_INVALID/);
    assert.throws(() => family.invitation(issued.invitationToken), /LEARNING_PARENT_INVITATION_INVALID/);
  } finally { reopened.close(); }
});

test('persistence keeps parent sessions and version tombstones without altering ordinary account/session schema', async t => {
  const f = await fixture(t), { parent, issued } = await f.activated();
  const sessionToken = parent.cookie.split('=')[1];
  assert.equal(f.store.row('PRAGMA user_version').user_version, 1);
  assert.equal(f.store.rows('PRAGMA table_info(sessions)').length, 4);
  f.store.close();
  const reopened = new LearningStore({ filePath: f.filePath, contracts, clock: f.now });
  try {
    const family = new FamilyAccess(reopened);
    assert.equal(family.session(sessionToken).login, issued.parentAccess.login);
    assert.equal(family.metadata(f.student.account.id).version, 2);
    const revoked = family.write(f.teacher.sessionToken, f.student.account.id, { expectedVersion: 2 }, true);
    assert.equal(revoked.parentAccess.version, 3);
    assert.throws(() => family.session(sessionToken), /LEARNING_PARENT_ACCESS_INVALID/);
    assert.equal(reopened.session(f.student.sessionToken).id, f.student.account.id);
    assert(!fs.readFileSync(f.filePath).includes(Buffer.from(issued.invitationToken)));
  } finally { reopened.close(); }
});

test('parent activation and password verification cannot race past teacher reset or revoked authority', async t => {
  const f = await fixture(t), issued = await f.issue(), originalRow = f.store.row.bind(f.store);
  let intercepted = false;
  f.store.row = function(sql, ...args) {
    const value = originalRow(sql, ...args);
    if (!intercepted && sql === 'SELECT * FROM learning_parent_invitations WHERE hash=?') {
      intercepted = true;
      queueMicrotask(() => f.family.write(f.teacher.sessionToken, f.student.account.id, { expectedVersion: 1 }, true));
    }
    return value;
  };
  assert.equal((await f.activate(issued.invitationToken)).status, 401); assert(intercepted);
  f.store.row = originalRow;
  const next = await f.activated(); intercepted = false;
  f.store.row = function(sql, ...args) {
    const value = originalRow(sql, ...args);
    if (!intercepted && sql === 'SELECT * FROM learning_parents WHERE login=?') {
      intercepted = true;
      queueMicrotask(() => f.family.write(f.teacher.sessionToken, f.student.account.id, { expectedVersion: 4 }, true));
    }
    return value;
  };
  assert.equal((await f.login(next.issued.parentAccess.login)).status, 401); assert(intercepted);
  f.store.row = originalRow;
  f.store.logout(f.teacher.sessionToken);
  assert.throws(() => f.family.write(f.teacher.sessionToken, f.student.account.id, { name: 'Fixture parent', expectedVersion: 5 }), /LEARNING_UNAUTHORIZED/);
});

test('family namespace rejects unexpected keys and Origin, bounds guessing, and does not crash absent storage', async t => {
  const f = await fixture(t), issued = await f.issue();
  assert.equal((await f.request('/parent/activate', { token: issued.invitationToken, password: PASSWORD, learnerId: f.peer.account.id }, null)).status, 400);
  assert.equal((await f.request('/parent/activate?token=leak', { token: issued.invitationToken, password: PASSWORD }, null)).status, 400);
  assert.equal((await f.request('/parent/activate', { token: issued.invitationToken, password: PASSWORD }, null, { Origin: 'https://outside.example.test' })).status, 403);
  assert.equal((await f.request('/parent/login', { login: issued.parentAccess.login, password: PASSWORD, role: 'teacher' }, null)).status, 400);
  const parent = await f.activate(issued.invitationToken); assert.equal(parent.status, 200);
  for (const route of ['/parent/session', '/parent/overview']) assert.equal((await f.request(route + '?learnerId=other', undefined, parent)).status, 400);
  for (let i = 0; i < 8; i++) assert.equal((await f.login('parent-0000000000000000', 'x')).status, 401);
  assert.equal((await f.login('parent-0000000000000000', 'x')).status, 429);
  assert.doesNotThrow(() => createLearningApi({ store: new LearningStore({ filePath: null, contracts }), publicOrigin: ORIGIN }));
});


test('pupil roster invitation metadata is read-only, expiry-accurate and never contains invitation credentials', async t => {
  const f = await fixture(t);
  const read = () => f.store.students(f.teacher.account).find(student => student.id === f.pending.student.id);
  const before = f.store.row('SELECT COUNT(*) AS count FROM invitations').count;
  assert.equal(read().invitationExpiresAt, f.pending.expiresAt);
  assert(!JSON.stringify(read()).includes(f.pending.invitationToken));
  assert.equal(read().invitationExpiresAt, f.pending.expiresAt);
  assert.equal(f.store.row('SELECT COUNT(*) AS count FROM invitations').count, before);
  const activated = f.store.activate(f.pending.invitationToken, await hashed);
  assert.equal(read().invitationExpiresAt, null); assert.equal(read().passwordReady, true);
  const replacement = f.store.recoverStudent(f.teacher.account, f.pending.student.id);
  assert.equal(read().invitationExpiresAt, replacement.expiresAt);
  assert.equal(f.store.session(activated.sessionToken).id, f.pending.student.id, 'Issuing invitation alone does not reset pupil password sessions');
  f.advance(7 * DAY);
  assert.equal(read().invitationExpiresAt, replacement.expiresAt, 'Expired pending invitation is distinguishable from no invitation');
  assert.throws(() => f.store.invitation(replacement.invitationToken), /LEARNING_ACCESS_INVALID/);
  const next = f.store.recoverStudent(f.teacher.account, f.pending.student.id);
  assert.equal(read().invitationExpiresAt, next.expiresAt);
  assert(next.expiresAt > replacement.expiresAt);
});

test('parent identity fence rejects stale-tab projection and logout without affecting either parent or learning cookie', async t => {
  const f = await fixture(t), first = await f.activated(), second = await f.activated(f.peer.account.id);
  const header = { 'X-Learning-Parent': first.issued.parentAccess.login };
  const denied = await f.request('/parent/overview', undefined, second.parent, header);
  assert.equal(denied.status, 409); assert.deepEqual(denied.body, { ok: false, error: 'LEARNING_PARENT_ACCOUNT_CHANGED' });
  const logout = await f.request('/parent/logout', {}, second.parent, header);
  assert.equal(logout.status, 409); assert.equal(logout.cookie, undefined);
  assert.equal((await f.request('/parent/session', undefined, second.parent)).status, 200);
  assert.equal((await f.request('/parent/session', undefined, first.parent)).status, 200);
  assert.equal((await f.request('/parent/overview', undefined, second.parent,
    { 'X-Learning-Parent': second.issued.parentAccess.login })).body.student.name, 'Fixture peer');
  assert.equal((await f.request('/session')).status, 200);
});


test('parent chooses a four-digit code once, including leading zero, then logs in directly on another device', async t => {
  const f = await fixture(t), issued = await f.issue(), code = '0427';
  const activated = await f.activate(issued.invitationToken, code);
  assert.equal(activated.status, 200); assert.match(activated.cookie, /^__Host-mathexam_parent=/);
  assert.equal(activated.body.parent.login, issued.parentAccess.login);
  assert.equal(activated.body.requirePasswordChange, undefined);
  const metadata = (await f.request(f.route(f.student.account.id))).body.parentAccess;
  assert.equal(metadata.active, true); assert.equal(metadata.invitationExpiresAt, null);
  const row = f.store.row('SELECT * FROM learning_parents WHERE login=?', issued.parentAccess.login);
  assert.match(row.password_hash, /^scrypt1:/); assert.notEqual(row.password_hash, code);
  assert.equal((await f.request('/parent/overview', undefined, activated)).status, 200);
  const secondDevice = await f.login(issued.parentAccess.login, code);
  assert.equal(secondDevice.status, 200);
  assert.equal((await f.request('/parent/overview', undefined, secondDevice)).status, 200);
  assert.equal((await f.login(issued.parentAccess.login, '427')).status, 401, 'Leading zero is part of the credential');
  assert.equal((await f.activate(issued.invitationToken, code)).status, 401, 'PIN does not change one-use invitation semantics');
  assert.equal((await f.request('/session')).status, 200, 'Parent PIN flow never replaces the teacher cookie');
});

test('parent activation rejects malformed short codes without consuming the invitation', async t => {
  const f = await fixture(t), issued = await f.issue();
  for (const password of ['123', '12345', '12a4', '１２３４', 1234, '1234 ', '1234\n']) {
    const response = await f.activate(issued.invitationToken, password);
    assert.equal(response.status, 400); assert.equal(response.body.error, 'LEARNING_PASSWORD_INVALID');
    assert.equal(response.cookie, undefined);
  }
  assert.equal((await f.activate(issued.invitationToken, '0042')).status, 200);
});

test('parent replacement invitation can change a legacy password to a PIN without changing the child', async t => {
  const f = await fixture(t), original = await f.activated(), childBefore = f.store.account(f.student.account.id);
  assert.equal((await f.login(original.issued.parentAccess.login)).status, 200, 'Legacy long parent password remains valid');
  const replacement = await f.issue();
  assert.equal((await f.request('/parent/session', undefined, original.parent)).status, 401);
  const changed = await f.activate(replacement.invitationToken, '0731'); assert.equal(changed.status, 200);
  assert.equal((await f.login(original.issued.parentAccess.login, PASSWORD)).status, 401);
  const signedIn = await f.login(original.issued.parentAccess.login, '0731'); assert.equal(signedIn.status, 200);
  assert.equal((await f.request('/parent/overview', undefined, signedIn)).status, 200);
  assert.deepEqual(f.store.account(f.student.account.id), childBefore);
  assert.equal(f.store.session(f.student.sessionToken).id, f.student.account.id);
});

test('four-digit parent code guesses keep the same per-credential attempt limiter', async t => {
  const f = await fixture(t), issued = await f.issue();
  assert.equal((await f.activate(issued.invitationToken, '0492')).status, 200);
  for (let index = 0; index < 8; index++) assert.equal((await f.login(issued.parentAccess.login, '9900')).status, 401);
  const blocked = await f.login(issued.parentAccess.login, '0492');
  assert.equal(blocked.status, 429); assert.equal(blocked.cookie, undefined);
});

test('teacher prepares a ready parent PIN without an invitation or changing the child', async t => {
  const f = await fixture(t), childBefore = f.store.account(f.pending.student.id);
  const receiptsBefore = f.store.rows('SELECT * FROM operations');
  const result = await f.request(f.route(f.pending.student.id) + '/password', { name: 'Ready parent', password: '0427', expectedVersion: 0 });
  assert.equal(result.status, 200); assert.equal(result.cookie, undefined);
  assert.deepEqual(Object.keys(result.body), ['parentAccess']);
  const access = result.body.parentAccess;
  assert.deepEqual(access, { exists: true, name: 'Ready parent', login: access.login,
    enabled: true, active: true, version: 1, invitationExpiresAt: null });
  assert.match(access.login, /^parent-[a-z0-9_-]{16}$/);
  const row = f.store.row('SELECT * FROM learning_parents WHERE learner_id=?', f.pending.student.id);
  assert.match(row.password_hash, /^scrypt1:/); assert.notEqual(row.password_hash, '0427');
  assert.equal(f.store.rows('SELECT * FROM learning_parent_invitations').length, 0);
  assert.deepEqual(f.store.rows('SELECT * FROM operations'), receiptsBefore, 'No plaintext credential can enter an operation receipt');
  assert.deepEqual(f.store.account(f.pending.student.id), childBefore);
  assert.equal(f.store.invitation(f.pending.invitationToken).account_id, f.pending.student.id);
  const parent = await f.login(access.login, '0427'); assert.equal(parent.status, 200);
  assert.equal((await f.request('/parent/overview', undefined, parent)).body.student.name, f.pending.student.name);
  assert.equal((await f.login(access.login, '427')).status, 401);
  assert.equal((await f.request('/session')).status, 200);
});

test('ready parent PIN replacement preserves identity and learner history while revoking only target parent credentials', async t => {
  const f = await fixture(t), original = await f.activated(), other = await f.activated(f.peer.account.id);
  const originalRow = f.store.row('SELECT * FROM learning_parents WHERE learner_id=?', f.student.account.id);
  const attempt = f.store.newAttempt(f.student.account.id, f.teacher.account.id, 'ege-path', contracts.create('ege-path', 'equations-linear', 42));
  f.store.run('INSERT INTO assignments(id,title,learner_id,teacher_id,attempt_id,status,created_at) VALUES(?,?,?,?,?,?,?)',
    'fixture_ready_parent_homework', 'Preserved homework', f.student.account.id, f.teacher.account.id, attempt.id, 'published', f.now());
  const before = { accounts: f.store.rows('SELECT * FROM accounts'), attempts: f.store.rows('SELECT * FROM attempts'), assignments: f.store.rows('SELECT * FROM assignments') };
  const result = await f.request(f.route(f.student.account.id) + '/password', { name: 'Updated parent name', password: '0681', expectedVersion: originalRow.version });
  assert.equal(result.status, 200); assert.equal(result.body.parentAccess.login, original.issued.parentAccess.login);
  const afterRow = f.store.row('SELECT * FROM learning_parents WHERE learner_id=?', f.student.account.id);
  assert.equal(afterRow.id, originalRow.id); assert.equal(afterRow.login, originalRow.login);
  assert.equal(afterRow.epoch, originalRow.epoch + 1); assert.equal(afterRow.version, originalRow.version + 1);
  assert.equal((await f.request('/parent/session', undefined, original.parent)).status, 401);
  assert.equal((await f.login(originalRow.login, PASSWORD)).status, 401);
  assert.equal((await f.login(originalRow.login, '0681')).status, 200);
  assert.equal((await f.request('/parent/session', undefined, other.parent)).status, 200);
  assert.equal(f.store.session(f.student.sessionToken).id, f.student.account.id);
  assert.equal(f.store.session(f.teacher.sessionToken).id, f.teacher.account.id);
  assert.deepEqual({ accounts: f.store.rows('SELECT * FROM accounts'), attempts: f.store.rows('SELECT * FROM attempts'), assignments: f.store.rows('SELECT * FROM assignments') }, before);
  const invited = await f.issue();
  const ready = await f.request(f.route(f.student.account.id) + '/password', { name: 'Ready again', password: '0941', expectedVersion: invited.parentAccess.version });
  assert.equal(ready.status, 200); assert.equal(ready.body.parentAccess.login, originalRow.login);
  assert.equal(ready.body.parentAccess.invitationExpiresAt, null);
  assert.equal((await f.activate(invited.invitationToken)).status, 401, 'Ready PIN invalidates the older pending invitation');
});

test('ready parent issuance checks exact PIN/body/query, role, ownership, origin, CSRF and current account', async t => {
  const f = await fixture(t), route = f.route(f.student.account.id) + '/password';
  const body = { name: 'Ready parent', password: '0731', expectedVersion: 0 };
  assert.equal((await f.request(route, body, null)).status, 401);
  assert.equal((await f.request(route, body, f.student)).status, 403);
  for (const headers of [{ Origin: 'https://outside.example.test' }, { 'X-CSRF-Token': 'wrong' }])
    assert.equal((await f.request(route, body, f.teacher, headers)).status, 403);
  assert.equal((await f.request(route, body, f.teacher, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await f.request(route, body, f.teacher, { 'X-Learning-Account': f.student.account.id })).status, 409);
  assert.equal((await f.request(f.route(f.teacher.account.id) + '/password', body)).status, 404);
  const foreign = f.store.createStudent(f.teacher.account, { login: 'ready_foreign', name: 'Foreign pupil' }).student;
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', f.peer.account.id, foreign.id);
  assert.equal((await f.request(f.route(foreign.id) + '/password', body)).status, 404);
  for (const password of ['731', '07311', '07x1', '０７３１', 731, '0731\n', PASSWORD])
    assert.equal((await f.request(route, { ...body, password })).status, 400);
  for (const invalid of [{}, { ...body, role: 'parent' }, { ...body, login: 'client_chosen' }, { ...body, opId: secret() },
    { ...body, expectedVersion: -1 }, { ...body, expectedVersion: '0' }, { ...body, expectedVersion: Number.MAX_SAFE_INTEGER }, { ...body, name: '<script>' }])
    assert.equal((await f.request(route, invalid)).status, 400);
  assert.equal((await f.request(route + '?password=forbidden', body)).status, 400);
  assert.equal(f.family.metadata(f.student.account.id).exists, false);
  const created = await f.request(route, body); assert.equal(created.status, 200);
  const stale = await f.request(route, body); assert.equal(stale.status, 409); assert.equal(stale.body.error, 'LEARNING_PARENT_CONFLICT');
  assert.equal(f.family.metadata(f.student.account.id).version, 1);
});

test('parent ready PIN hashing cannot race past teacher logout or teacher credential replacement retaining the session', async t => {
  for (const kind of ['logout', 'teacher-code-change']) await t.test(kind, async sub => {
    const f = await fixture(sub), nextHash = await hashPassword('0481'), originalAccount = f.store.account.bind(f.store);
    let intercepted = false;
    f.store.account = function(id) {
      const value = originalAccount(id);
      if (!intercepted && id === f.teacher.account.id) {
        intercepted = true;
        queueMicrotask(() => {
          if (kind === 'logout') f.store.logout(f.teacher.sessionToken);
          else f.store.replaceTeacherPassword(f.teacher.sessionToken, nextHash, value.password_hash, value.auth_epoch);
        });
      }
      return value;
    };
    const result = await f.request(f.route(f.student.account.id) + '/password', { name: 'Do not create', password: '0319', expectedVersion: 0 });
    f.store.account = originalAccount; assert(intercepted);
    assert.equal(result.status, kind === 'logout' ? 401 : 409);
    assert.equal(result.body.error, kind === 'logout' ? 'LEARNING_UNAUTHORIZED' : 'LEARNING_CREDENTIALS_CHANGED');
    assert.equal(f.family.metadata(f.student.account.id).exists, false);
    if (kind === 'teacher-code-change') assert.equal(f.store.session(f.teacher.sessionToken).id, f.teacher.account.id, 'Surviving session alone does not bypass the credential snapshot fence');
  });
});

test('parent ready PIN hashing cannot overwrite a concurrent invitation, revocation or PIN change', async t => {
  for (const kind of ['invitation', 'revocation', 'password']) await t.test(kind, async sub => {
    const f = await fixture(sub), original = await f.activated(), snapshot = f.store.account(f.teacher.account.id);
    const current = f.family.metadata(f.student.account.id), originalAccount = f.store.account.bind(f.store), winningHash = await hashPassword('0629', 'parent');
    let intercepted = false, winner;
    f.store.account = function(id) {
      const value = originalAccount(id);
      if (!intercepted && id === f.teacher.account.id) {
        intercepted = true;
        queueMicrotask(() => {
          winner = kind === 'password'
            ? f.family.writePassword(f.teacher.sessionToken, f.student.account.id, { name: 'Winning parent', expectedVersion: current.version }, winningHash, snapshot)
            : f.family.write(f.teacher.sessionToken, f.student.account.id,
              kind === 'revocation' ? { expectedVersion: current.version } : { name: 'Winning parent', expectedVersion: current.version }, kind === 'revocation');
        });
      }
      return value;
    };
    const result = await f.request(f.route(f.student.account.id) + '/password', { name: 'Losing parent', password: '0537', expectedVersion: current.version });
    f.store.account = originalAccount; assert(intercepted); assert(winner);
    assert.equal(result.status, 409); assert.equal(result.body.error, 'LEARNING_PARENT_CONFLICT');
    assert.deepEqual(f.family.metadata(f.student.account.id), winner.parentAccess);
    assert.equal((await f.login(original.issued.parentAccess.login, '0537')).status, 401);
    if (kind === 'invitation') assert.equal(f.family.invitation(winner.invitationToken).row.login, original.issued.parentAccess.login);
    if (kind === 'password') assert.equal((await f.login(original.issued.parentAccess.login, '0629')).status, 200);
  });
});

test('ready parent PIN write is atomic on a storage failure and response contains no credential', async t => {
  const f = await fixture(t), original = await f.activated(), version = f.family.metadata(f.student.account.id).version;
  const before = { parents: f.store.rows('SELECT * FROM learning_parents'), sessions: f.store.rows('SELECT * FROM learning_parent_sessions'), invitations: f.store.rows('SELECT * FROM learning_parent_invitations') };
  const run = f.store.run.bind(f.store);
  f.store.run = (sql, ...args) => {
    if (sql.startsWith('UPDATE learning_parents SET name=?,password_hash=?')) throw Error('simulated private failure');
    return run(sql, ...args);
  };
  const result = await f.request(f.route(f.student.account.id) + '/password', { name: 'Must roll back', password: '0347', expectedVersion: version });
  f.store.run = run;
  assert.equal(result.status, 500); assert.deepEqual(result.body, { ok: false, error: 'LEARNING_INTERNAL_ERROR' });
  assert.deepEqual({ parents: f.store.rows('SELECT * FROM learning_parents'), sessions: f.store.rows('SELECT * FROM learning_parent_sessions'), invitations: f.store.rows('SELECT * FROM learning_parent_invitations') }, before);
  assert.equal((await f.request('/parent/session', undefined, original.parent)).status, 200);
  assert.equal((await f.login(original.issued.parentAccess.login)).status, 200);
});

test('ready parent PIN expensive work is limited per teacher across different children', async t => {
  const f = await fixture(t);
  for (let index = 0; index < 8; index++) {
    const id = index % 2 ? f.student.account.id : f.peer.account.id, version = f.family.metadata(id).version;
    const response = await f.request(f.route(id) + '/password', { name: 'Rate fixture parent', password: '0481', expectedVersion: version });
    assert.equal(response.status, 200);
  }
  const denied = await f.request(f.route(f.pending.student.id) + '/password', { name: 'Do not create', password: '0427', expectedVersion: 0 });
  assert.equal(denied.status, 429); assert.equal(denied.headers.get('retry-after'), '60');
  assert.equal(f.family.metadata(f.pending.student.id).exists, false);
});
