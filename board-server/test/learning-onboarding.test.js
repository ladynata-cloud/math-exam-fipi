'use strict';

// Real HTTP, sessions and SQLite; every identity and credential is synthetic.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const express = require('express');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { LearningStore } = require('../learning-store');
const { tokenHash, verifyPassword } = require('../learning-auth');
const { backupLearning, restoreLearning } = require('../learning-backup');
const courseProgram = require('../../learning/course-program');
const ORIGIN = 'https://onboarding.example.test';
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const CODE = '0827';
const COURSE_IDS = ['vilenkin6-textbook', 'foundations'];
assert(COURSE_IDS.every(id => courseProgram.get(id)));
const copy = value => JSON.parse(JSON.stringify(value));
const op = () => crypto.randomUUID();
const input = (changes = {}) => ({ opId: op(), name: 'Synthetic Learner', login: 'synthetic_new', password: CODE,
  profile: { course: 'school', goal: null, focus: 'Keep earlier work', program: { grade: 6, courseIds: [...COURSE_IDS] } }, ...changes });
const edit = (profile, changes = {}) => ({ opId: op(), expectedVersion: profile.version,
  course: profile.course, goal: profile.goal, focus: profile.focus, program: copy(profile.program), ...changes });

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-onboarding-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const contracts = {
    list: () => [{ id: 'test-addition', trainerId: 'test-addition', contentId: 'addition' }],
    create: (_trainer, contentId) => ({ taskSpec: { contentId, task: { q: '2 + 3', answer: 5 } }, state: { work: { answer: '' } } }),
    normalize: (_trainer, _spec, state) => copy(state),
    evaluate: (_trainer, _spec, details) => ({ correct: details.answer === '5', complete: details.answer === '5' }),
    assistance: () => false
  };
  const store = new LearningStore({ filePath, contracts });
  assert.equal(store.available, true);
  const invited = store.bootstrap({ name: 'Synthetic Teacher', login: 'synthetic_teacher' });
  const teacher = store.activate(invited.invitationToken, HASH);
  const peer = store.createStudent(teacher.account, { name: 'Unchanged Synthetic Peer', login: 'synthetic_peer' }, HASH).student;
  const peerSession = store.createSession(peer.id);
  const api = createLearningApi({ store, publicOrigin: ORIGIN, secureCookies: false });
  const app = express(); app.use(express.json()); app.use('/api/learning', api.router); app.use('/api/learning', createTeachingRouter(api));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = `http://127.0.0.1:${server.address().port}/api/learning`;
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    store.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(route, body, session = teacher, headers = {}) {
    const response = await fetch(address + route, {
      method: body === undefined ? 'GET' : 'POST', headers: {
        ...(session ? { Cookie: session.cookie || 'mathexam_learning_local=' + session.sessionToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': session.data?.csrfToken || tokenHash('learning-csrf:' + session.sessionToken) } : {}) }), ...headers
      }, ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0],
      cache: response.headers.get('cache-control') };
  }
  return { store, api, teacher, peer, peerSession, request, filePath, directory, contracts, address };
}
const rows = (store, tables) => Object.fromEntries(tables.map(table => [table, store.rows('SELECT * FROM ' + table + ' ORDER BY rowid')]));
const count = (store, table) => store.row('SELECT COUNT(*) AS n FROM ' + table).n;

test('empty, null, array and non-object request bodies return a client error without creating an account', async t => {
  const f = await fixture(t), before = rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']);
  for (const body of ['', 'null', '[]', '{}', '42', '"synthetic"']) {
    const response = await fetch(f.address + '/teacher/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN,
        Cookie: 'mathexam_learning_local=' + f.teacher.sessionToken,
        'X-CSRF-Token': tokenHash('learning-csrf:' + f.teacher.sessionToken) }, body
    });
    assert.equal(response.status, 400, 'raw body: ' + JSON.stringify(body));
    await response.text();
  }
  assert.deepEqual(rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']), before);
});

test('one confirmed request creates a ready account and two-course program without modifying existing work', async t => {
  const f = await fixture(t), body = input({ name: '  Synthetic   Learner  ', login: ' Synthetic_New ' });
  body.profile.focus = '  Keep earlier work  ';
  const untouchedTables = ['sessions', 'invitations', 'recovery_codes', 'attempts', 'assignments', 'events', 'learning_plans'];
  const before = rows(f.store, untouchedTables), peer = f.store.account(f.peer.id);
  const result = await f.request('/teacher/students', body);
  assert.equal(result.status, 201); assert.equal(result.cache, 'no-store'); assert.equal(result.data.duplicate, false);
  assert.equal(result.data.student.name, 'Synthetic Learner'); assert.equal(result.data.student.login, 'synthetic_new');
  assert.equal(result.data.student.active, true);
  assert.deepEqual(result.data.profile.program, { grade: 6, courseIds: COURSE_IDS });
  assert.equal(result.data.profile.version, 1); assert.equal(result.data.profile.focus, 'Keep earlier work');
  assert.equal(count(f.store, 'accounts'), 3); assert.equal(count(f.store, 'learning_profiles'), 1); assert.equal(count(f.store, 'learning_programs'), 1);
  assert.deepEqual(rows(f.store, untouchedTables), before); assert.deepEqual(f.store.account(f.peer.id), peer);
  assert(!Object.hasOwn(result.data, 'password')); assert(!Object.hasOwn(result.data.student, 'password'));
  assert(!JSON.stringify(result.data).includes('scrypt1:'));
  const login = await f.request('/login', { login: 'synthetic_new', password: CODE, expectedRole: 'student' }, null);
  assert.equal(login.status, 200); assert.equal(login.data.account.id, result.data.student.id);
  assert.deepEqual((await f.request('/profile', undefined, login)).data.profile, result.data.profile);
  assert.deepEqual((await f.request('/teacher/students')).data.students.find(s => s.id === result.data.student.id).profile, result.data.profile);
});

test('lost-response replay uses the same account and code, and changed input cannot reuse its operation', async t => {
  const f = await fixture(t), body = input();
  const first = await f.request('/teacher/students', body), snapshot = rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']);
  assert.equal(first.status, 201);
  const replay = await f.request('/teacher/students', body);
  assert.equal(replay.status, 200); assert.deepEqual(replay.data, { ...first.data, duplicate: true });
  for (const change of [{ name: 'Another name' }, { login: 'different_login' }, { password: '0828' },
    { profile: { ...body.profile, program: { grade: 7, courseIds: COURSE_IDS } } }]) {
    const denied = await f.request('/teacher/students', { ...body, ...change });
    assert.equal(denied.status, 409); assert.equal(denied.data.error, 'LEARNING_OP_CONFLICT');
  }
  const conflict = await f.request('/teacher/students', { ...body, opId: op() });
  assert.equal(conflict.status, 409); assert.equal(conflict.data.error, 'LEARNING_LOGIN_EXISTS');
  assert.deepEqual(rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']), snapshot);
});

test('simultaneous identical submissions commit exactly one pupil and verify the duplicate code', async t => {
  const f = await fixture(t), body = input();
  const results = await Promise.all([f.request('/teacher/students', body), f.request('/teacher/students', body)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 201]);
  assert.equal(results[0].data.student.id, results[1].data.student.id);
  assert.deepEqual(results.map(r => r.data.duplicate).sort(), [false, true]);
  assert.equal(count(f.store, 'accounts'), 3); assert.equal(count(f.store, 'operations'), 1);
});

test('operation receipts contain no password, password hash or PIN-derived fingerprint', async t => {
  const f = await fixture(t), body = input();
  assert.equal((await f.request('/teacher/students', body)).status, 201);
  const receipt = f.store.row('SELECT * FROM operations WHERE op_id=?', body.opId), stored = f.store.accountByLogin(body.login);
  assert.deepEqual(Object.keys(JSON.parse(receipt.result_json)).sort(), ['authEpoch', 'learnerId', 'operation', 'profileVersion']);
  // Independent fixture, same public request, different secret: a receipt's
  // fingerprint must be identical, unlike each account's salted password hash.
  const other = await fixture(t);
  assert.equal((await other.request('/teacher/students', { ...body, password: '9176' })).status, 201);
  assert.equal(receipt.fingerprint, other.store.row('SELECT fingerprint FROM operations WHERE op_id=?', body.opId).fingerprint);
  assert.notEqual(stored.password_hash, other.store.accountByLogin(body.login).password_hash);
  assert(!Object.values(JSON.parse(receipt.result_json)).includes(CODE)); assert(!JSON.stringify(receipt).includes(stored.password_hash));
  assert.notEqual(receipt.fingerprint, tokenHash(CODE));
  assert.equal(await verifyPassword(CODE, stored.password_hash), true);
});

test('a failed program or receipt write rolls back the entire account creation and can be retried', async t => {
  const f = await fixture(t);
  for (const table of ['learning_profiles', 'learning_programs', 'operations']) {
    const body = input({ login: 'rollback_' + table }), before = rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']);
    f.store.db.exec(`CREATE TEMP TRIGGER fail_onboarding BEFORE INSERT ON ${table} BEGIN SELECT RAISE(ABORT, 'synthetic write failure'); END;`);
    const failed = await f.request('/teacher/students', body);
    assert.equal(failed.status, 500); assert.deepEqual(rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']), before);
    f.store.db.exec('DROP TRIGGER fail_onboarding');
    assert.equal((await f.request('/teacher/students', body)).status, 201);
  }
});

test('invalid grade, course membership, duplicate IDs and malformed onboarding are rejected before creation', async t => {
  const f = await fixture(t), base = input();
  const programs = [null, {}, [], { grade: 6 }, { courseIds: COURSE_IDS },
    ...[-1, 0, 12, 6.5, '6', true].map(grade => ({ grade, courseIds: COURSE_IDS })),
    ...[[], ['missing-course'], [COURSE_IDS[0], COURSE_IDS[0]], [null], [1], COURSE_IDS[0],
      Array(courseProgram.MAX_COURSES + 1).fill(COURSE_IDS[0])].map(courseIds => ({ grade: 6, courseIds })),
    { grade: 6, courseIds: COURSE_IDS, learnerId: f.peer.id }];
  for (const program of programs) {
    const result = await f.request('/teacher/students', { ...base, profile: { ...base.profile, program } });
    assert.equal(result.status, 400, JSON.stringify(program));
  }
  for (const field of ['opId', 'profile', 'password']) {
    const body = copy(base); delete body[field]; assert.equal((await f.request('/teacher/students', body)).status, 400);
  }
  for (const change of [{ opId: {} }, { profile: { ...base.profile, course: 'unknown' } },
    { profile: { ...base.profile, goal: 'grade5' } }, { profile: { ...base.profile, focus: 'x'.repeat(1201) } }, { password: 'abc' }]) {
    assert.equal((await f.request('/teacher/students', { ...base, ...change })).status, 400);
  }
  assert.equal(count(f.store, 'accounts'), 2); assert.equal(count(f.store, 'learning_profiles'), 0); assert.equal(count(f.store, 'operations'), 0);
  const optionalGrade = copy(base); optionalGrade.profile.program.grade = null;
  assert.equal((await f.request('/teacher/students', optionalGrade)).status, 201);
});

test('onboarding and program mutation preserve role, CSRF, Origin and pupil ownership checks', async t => {
  const f = await fixture(t), body = input();
  assert.equal((await f.request('/teacher/students', body, null)).status, 401);
  assert.equal((await f.request('/teacher/students', body, f.peerSession)).status, 403);
  assert.equal((await f.request('/teacher/students', body, f.teacher, { Origin: 'https://untrusted.example.test' })).status, 403);
  assert.equal((await f.request('/teacher/students', body, f.teacher, { 'X-CSRF-Token': 'wrong' })).status, 403);
  assert.equal((await f.request('/teacher/students', body, f.teacher, { 'X-Learning-Account': f.peer.id })).status, 409);
  assert.equal((await f.request('/teacher/students?learnerId=' + f.peer.id, body)).status, 400);
  const created = await f.request('/teacher/students', body), route = '/teacher/students/' + created.data.student.id + '/profile';
  assert.equal((await f.request(route, edit(created.data.profile), f.peerSession)).status, 403);
  assert.equal((await f.request('/teacher/students/not-owned/profile', edit(created.data.profile))).status, 404);
  assert.equal((await f.request('/profile?learnerId=' + created.data.student.id, undefined, f.peerSession)).status, 400);
  assert.equal(Object.hasOwn((await f.request('/profile', undefined, f.peerSession)).data.profile, 'program'), false);
});

test('teacher logout while hashing aborts account creation', async t => {
  const f = await fixture(t), original = f.store.studentOnboardingReceipt.bind(f.store);
  let scheduled = false;
  f.store.studentOnboardingReceipt = (auth, body) => {
    const result = original(auth, body);
    if (!scheduled) { scheduled = true; setImmediate(() => f.store.logout(f.teacher.sessionToken)); }
    return result;
  };
  const result = await f.request('/teacher/students', input());
  assert.equal(result.status, 401); assert.equal(count(f.store, 'accounts'), 2); assert.equal(count(f.store, 'learning_programs'), 0);
  assert.equal(count(f.store, 'operations'), 0);
});

test('teacher logout during duplicate password verification aborts the replay', async t => {
  const f = await fixture(t), body = input();
  assert.equal((await f.request('/teacher/students', body)).status, 201);
  const original = f.store.studentOnboardingReceipt.bind(f.store);
  let scheduled = false;
  f.store.studentOnboardingReceipt = (auth, values) => {
    const result = original(auth, values);
    if (!scheduled) { scheduled = true; setImmediate(() => f.store.logout(f.teacher.sessionToken)); }
    return result;
  };
  const result = await f.request('/teacher/students', body);
  assert.equal(result.status, 401); assert.equal(count(f.store, 'accounts'), 3); assert.equal(count(f.store, 'operations'), 1);
});

test('replay refuses obsolete program or credentials, including a password reset to the same digits', async t => {
  const f = await fixture(t), body = input();
  const first = await f.request('/teacher/students', body), id = first.data.student.id;
  const route = '/teacher/students/' + id + '/profile';
  assert.equal((await f.request(route, edit(first.data.profile, { focus: 'A later teacher decision' }))).status, 200);
  const stale = await f.request('/teacher/students', body);
  assert.equal(stale.status, 409); assert.equal(stale.data.error, 'LEARNING_ONBOARDING_CHANGED');
  const secondBody = input({ login: 'synthetic_changed_code' }), second = await f.request('/teacher/students', secondBody);
  assert.equal((await f.request('/teacher/students/' + second.data.student.id + '/password', { password: CODE })).status, 200);
  const changed = await f.request('/teacher/students', secondBody);
  assert.equal(changed.status, 409); assert.equal(changed.data.error, 'LEARNING_ONBOARDING_CHANGED');
});

test('credential or profile changes during replay verification are fenced inside the final transaction', async t => {
  const f = await fixture(t);
  for (const kind of ['profile', 'credentials']) {
    const body = input({ login: 'race_' + kind }), created = await f.request('/teacher/students', body), id = created.data.student.id;
    const original = f.store.studentOnboardingReceipt.bind(f.store);
    let scheduled = false;
    f.store.studentOnboardingReceipt = (auth, values) => {
      const receipt = original(auth, values);
      if (!scheduled) {
        scheduled = true;
        setImmediate(() => {
          if (kind === 'profile') f.store.saveStudentProfile(f.teacher.account, id, edit(created.data.profile, { focus: 'Newer program' }));
          else { const row = f.store.account(id); f.store.replaceStudentPassword(f.teacher.sessionToken, id, HASH, row.password_hash, row.auth_epoch); }
        });
      }
      return receipt;
    };
    const result = await f.request('/teacher/students', body);
    assert.equal(result.status, 409); assert.equal(result.data.error, 'LEARNING_ONBOARDING_CHANGED');
    f.store.studentOnboardingReceipt = original;
  }
});

test('program edits are versioned and idempotent, retain existing plans/work, and preserve program for old clients', async t => {
  const f = await fixture(t), created = await f.request('/teacher/students', input()), id = created.data.student.id;
  const pupil = f.store.createSession(id), route = '/teacher/students/' + id + '/profile';
  const attempt = f.store.createAttempt(pupil.account, { opId: op(), trainerId: 'test-addition', contentId: 'addition' }).attempt;
  f.store.action(pupil.account, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'check',
    payload: { state: { work: { answer: '5' } }, details: { answer: '5' } } });
  assert.equal((await f.request('/teacher/students/' + id + '/plan', { opId: op(), items: [{ catalogId: 'test-addition', reason: 'Keep this', priority: 'high' }], note: 'Keep the original plan' })).status, 200);
  const homework = f.store.createAssignments(f.teacher.account, { opId: op(), learnerIds: [id], title: 'Existing assignment', trainerId: 'test-addition', contentId: 'addition' });
  assert.equal(homework.assignments.length, 1);
  const protectedTables = ['accounts', 'sessions', 'attempts', 'events', 'assignments', 'learning_plans'];
  const before = rows(f.store, protectedTables);
  const changes = edit(created.data.profile, { course: 'oge', goal: 'pass', program: { grade: 9, courseIds: [COURSE_IDS[1]] } });
  const saved = await f.request(route, changes);
  assert.equal(saved.status, 200); assert.equal(saved.data.profile.version, 2);
  assert.deepEqual(saved.data.profile.program, changes.program);
  assert.deepEqual((await f.request(route, changes)).data, { ...saved.data, duplicate: true });
  const stale = await f.request(route, { ...changes, opId: op() });
  assert.equal(stale.status, 409); assert.equal(stale.data.error, 'LEARNING_PROFILE_CONFLICT');
  const mutated = await f.request(route, { ...changes, focus: 'Different request' });
  assert.equal(mutated.status, 409); assert.equal(mutated.data.error, 'LEARNING_OP_CONFLICT');
  const oldClient = edit(saved.data.profile, { focus: 'An old client edits only its fields' }); delete oldClient.program;
  const oldSave = await f.request(route, oldClient);
  assert.equal(oldSave.status, 200); assert.equal(oldSave.data.profile.version, 3); assert.deepEqual(oldSave.data.profile.program, changes.program);
  assert.deepEqual(rows(f.store, protectedTables), before);
  assert.equal(f.store.getAttempt(pupil.account, attempt.id).outcome, 'independent');
  assert.deepEqual((await f.request('/teacher/students/' + id + '/report')).data.attempts.map(a => a.id).sort(),
    f.store.rows('SELECT id FROM attempts WHERE learner_id=?', id).map(a => a.id).sort());
});

test('a lost program-save acknowledgement cannot confirm a different newer program; old-client replay stays compatible', async t => {
  const f = await fixture(t), created = await f.request('/teacher/students', input()), id = created.data.student.id;
  const route = '/teacher/students/' + id + '/profile';
  const firstInput = edit(created.data.profile, { program: { grade: 6, courseIds: ['foundations'] } });
  const first = await f.request(route, firstInput);
  assert.equal(first.status, 200); assert.equal(first.data.profile.version, 2);
  assert.deepEqual((await f.request(route, firstInput)).data, { ...first.data, duplicate: true });
  const competing = await f.request(route, edit(first.data.profile, {
    course: 'oge', goal: 'pass', program: { grade: 9, courseIds: ['oge'] }
  }));
  assert.equal(competing.status, 200); assert.equal(competing.data.profile.version, 3);
  const beforeReplay = rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']);
  const replay = await f.request(route, firstInput);
  assert.equal(replay.status, 409); assert.equal(replay.data.error, 'LEARNING_PROFILE_CONFLICT');
  assert.deepEqual(rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'operations']), beforeReplay);
  assert.deepEqual((await f.request(route)).data.profile, competing.data.profile);

  const legacyInput = edit(competing.data.profile, { focus: 'Old client note' }); delete legacyInput.program;
  const legacySaved = await f.request(route, legacyInput);
  assert.equal(legacySaved.status, 200);
  const later = await f.request(route, edit(legacySaved.data.profile, { program: { grade: 7, courseIds: ['school7'] } }));
  assert.equal(later.status, 200);
  assert.deepEqual((await f.request(route, legacyInput)).data, { ...legacySaved.data, duplicate: true });
  assert.deepEqual((await f.request(route)).data.profile, later.data.profile);
});

test('a failed program edit rolls back its profile version and operation receipt', async t => {
  const f = await fixture(t), created = await f.request('/teacher/students', input()), id = created.data.student.id;
  const before = rows(f.store, ['learning_profiles', 'learning_programs', 'operations']);
  const body = edit(created.data.profile, { program: { grade: 7, courseIds: [COURSE_IDS[1]] } });
  f.store.db.exec("CREATE TEMP TRIGGER fail_program BEFORE UPDATE ON learning_programs BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;");
  const result = await f.request('/teacher/students/' + id + '/profile', body);
  assert.equal(result.status, 500); assert.deepEqual(rows(f.store, ['learning_profiles', 'learning_programs', 'operations']), before);
  f.store.db.exec('DROP TRIGGER fail_program');
  assert.equal((await f.request('/teacher/students/' + id + '/profile', body)).status, 200);
});

test('legacy registration and profiles keep their response shape and never gain a program implicitly', async t => {
  const f = await fixture(t), pending = await f.request('/teacher/students', { name: 'Legacy pending', login: 'legacy_pending' });
  assert.equal(pending.status, 201); assert.deepEqual(Object.keys(pending.data).sort(), ['expiresAt', 'invitationToken', 'student']);
  const ready = await f.request('/teacher/students', { name: 'Legacy ready', login: 'legacy_ready', password: CODE });
  assert.equal(ready.status, 201); assert.deepEqual(Object.keys(ready.data), ['student']);
  const profile = f.store.studentProfile(f.teacher.account, ready.data.student.id);
  assert.deepEqual(profile, { course: 'school', goal: null, focus: '', version: 0, updatedAt: null });
  assert.equal(count(f.store, 'learning_programs'), 0);
  const saved = f.store.saveStudentProfile(f.teacher.account, ready.data.student.id,
    { opId: op(), expectedVersion: 0, course: 'foundations', goal: null, focus: 'Old route' });
  assert.deepEqual(Object.keys(saved.profile).sort(), ['course', 'focus', 'goal', 'updatedAt', 'version']);
  assert.equal(count(f.store, 'learning_programs'), 0);
});

test('program, managed result, account and retry receipts survive logout, new login, restart and backup restore', async t => {
  const f = await fixture(t), body = input(), created = await f.request('/teacher/students', body), id = created.data.student.id;
  const login = await f.request('/login', { login: body.login, password: CODE }, null);
  const pupil = f.store.session(login.cookie.split('=')[1]);
  const work = f.store.createAttempt(pupil, { opId: op(), trainerId: 'test-addition', contentId: 'addition' }).attempt;
  const result = f.store.action(pupil, work.id, { opId: op(), expectedVersion: work.version, type: 'check',
    payload: { state: { work: { answer: '5' } }, details: { answer: '5' } } }).attempt;
  assert.equal(result.outcome, 'independent');
  assert.equal((await f.request('/logout', {}, login)).status, 200);
  const again = await f.request('/login', { login: body.login, password: CODE }, null);
  assert.equal(again.status, 200); assert.equal(again.data.account.id, id);
  assert.deepEqual((await f.request('/profile', undefined, again)).data.profile, created.data.profile);
  assert.deepEqual((await f.request('/attempts/' + work.id, undefined, again)).data, result);
  const backup = path.join(f.directory, 'backup.sqlite'), restoredPath = path.join(f.directory, 'restored.sqlite');
  backupLearning(f.store, backup); restoreLearning(backup, restoredPath);
  const baseline = rows(f.store, ['accounts', 'learning_profiles', 'learning_programs', 'attempts', 'events', 'operations']);
  f.store.close();
  for (const filePath of [f.filePath, restoredPath]) {
    const restored = new LearningStore({ filePath, contracts: f.contracts });
    try {
      assert.equal(restored.available, true); assert.equal(restored.row('PRAGMA user_version').user_version, 1);
      assert.deepEqual(rows(restored, Object.keys(baseline)), baseline);
      assert.equal(restored.session(again.cookie.split('=')[1]).id, id);
      assert.deepEqual(restored.studentProfile(pupil, id), created.data.profile);
      assert.deepEqual(restored.getAttempt(pupil, work.id), result);
      assert.equal(await verifyPassword(CODE, restored.account(id).password_hash), true);
      const { password, ...values } = body, normalized = restored.studentOnboardingInput(values);
      const receipt = restored.studentOnboardingReceipt(restored.session(f.teacher.sessionToken), normalized);
      assert.equal(restored.replayStudentOnboarding(f.teacher.sessionToken, normalized, receipt.passwordHash, receipt.authEpoch).duplicate, true);
    } finally { restored.close(); }
  }
});
