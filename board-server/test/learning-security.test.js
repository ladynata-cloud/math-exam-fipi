'use strict';

// Independent adversarial integration checks. All accounts and databases are
// disposable local fixtures; these tests never call the deployed service.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { LearningStore } = require('../learning-store');
const { tokenHash } = require('../learning-auth');
const op = () => randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const copy = x => JSON.parse(JSON.stringify(x));
const denied = (callback, code) => assert.throws(callback, error => error.code === code);

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-learning-review-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1700000000000, serial = 0;
  const contracts = {
    list: () => [{ trainerId: 'review', contentId: 'addition' }],
    create(trainerId, contentId) {
      assert.equal(trainerId, 'review'); assert.equal(contentId, 'addition');
      const seed = ++serial;
      return { taskSpec: { contentId, seed, task: { id: contentId, seed, q: 'Сколько будет 2 + 3?', answer: 5 } }, state: { work: { draft: '', help: false, done: false } } };
    },
    normalize(_trainerId, _spec, state) { return copy(state); },
    evaluate(_trainerId, _spec, details) { return { correct: details.answer === '5', complete: details.answer === '5' }; },
    assistance(_trainerId, _spec, state) { return state?.work?.help === true || state?.view === 'learn' || state?.hint > 0; }
  };
  const makeStore = () => new LearningStore({ filePath, clock: () => now, contracts });
  const store = makeStore(); assert.equal(store.available, true);
  const invite = store.bootstrap({ login: 'teacher', name: 'Преподаватель' });
  const teacherSession = store.activate(invite.invitationToken, HASH);
  const teacher = teacherSession.account;
  const students = [1, 2].map(i => {
    const invitation = store.createStudent(teacher, { name: 'Ученик ' + i, login: 'student' + i });
    const session = store.activate(invitation.invitationToken, HASH);
    return { ...session, invitation };
  });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { store, teacher, teacherSession, students, contracts, filePath, makeStore, advance: ms => { now += ms; } };
}
function attempt(f, index = 0, extras = {}) {
  return f.store.createAttempt(f.students[index].account, { opId: op(), trainerId: 'review', contentId: 'addition', fresh: true, ...extras }).attempt;
}
function action(f, auth, current, type, payload, extra = {}) {
  if (type === 'check' && !Object.hasOwn(payload, 'state')) payload = { state: copy(current.state), ...payload };
  return f.store.action(auth, current.id, { opId: op(), expectedVersion: current.version, type, payload, ...extra });
}

test('24 permanent learners remain independent while each separate lesson is limited to eight seats', t => {
  const f = fixture(t);
  for (let i = 3; i <= 24; i++) {
    const invitation = f.store.createStudent(f.teacher, { name: `Ученик ${i}`, login: `student${i}` });
    f.students.push({ ...f.store.activate(invitation.invitationToken, HASH), invitation });
  }
  const accountIds = f.students.map(student => student.account.id);
  assert.equal(new Set(accountIds).size, 24);
  const roster = f.store.students(f.teacher);
  assert.equal(roster.length, 24);
  assert.deepEqual(new Set(roster.map(student => student.id)), new Set(accountIds));
  assert.ok(roster.every(student => student.active));

  const lessons = [0, 8, 16].map((start, index) => f.store.createLesson(f.teacher, {
    opId: op(), title: `Группа ${index + 1}`, learnerIds: accountIds.slice(start, start + 8)
  }).lesson);
  assert.ok(lessons.every(lesson => lesson.seats.length === 8));
  assert.equal(f.store.listLessons(f.teacher).length, 3);
  for (let i = 0; i < 24; i++) {
    const personalLessons = f.store.listLessons(f.students[i].account);
    assert.equal(personalLessons.length, 1);
    assert.equal(personalLessons[0].id, lessons[Math.floor(i / 8)].id);
    assert.deepEqual(personalLessons[0].seats.map(seat => seat.learnerId), [accountIds[i]]);
  }
  denied(() => f.store.createLesson(f.teacher, {
    opId: op(), title: 'Девять мест недопустимы', learnerIds: accountIds.slice(0, 9)
  }), 'LEARNING_INVALID');
  assert.equal(f.store.listLessons(f.teacher).length, 3);
  assert.equal(f.store.students(f.teacher).length, 24);

  const ninth = f.students[8], original = attempt(f, 8);
  const saved = action(f, ninth.account, original, 'state', { state: { work: { draft: 'личная работа девятого ученика', help: false, done: false } } }).attempt;
  const recovery = f.store.recoverStudent(f.teacher, ninth.account.id);
  const recovered = f.store.activate(recovery.invitationToken, HASH);
  assert.equal(recovered.account.id, ninth.account.id);
  denied(() => f.store.session(ninth.sessionToken), 'LEARNING_UNAUTHORIZED');
  assert.equal(f.store.session(f.students[0].sessionToken).id, accountIds[0]);
  assert.equal(f.store.session(f.students[23].sessionToken).id, accountIds[23]);
  assert.equal(f.store.getAttempt(recovered.account, original.id).state.work.draft, saved.state.work.draft);
  denied(() => f.store.getAttempt(f.students[23].account, original.id), 'LEARNING_NOT_FOUND');

  f.store.close();
  const reopened = f.makeStore();
  try {
    assert.equal(reopened.students(f.teacher).length, 24);
    assert.equal(reopened.listLessons(f.teacher).length, 3);
    assert.equal(reopened.session(recovered.sessionToken).id, accountIds[8]);
    assert.equal(reopened.session(f.students[23].sessionToken).id, accountIds[23]);
    assert.equal(reopened.getAttempt(recovered.account, original.id).state.work.draft, saved.state.work.draft);
  } finally { reopened.close(); }
});

test('activation and recovery are one-use; reset revokes every previous session', t => {
  const f = fixture(t), s = f.students[0];
  denied(() => f.store.activate(s.invitation.invitationToken, HASH), 'LEARNING_ACCESS_INVALID');
  const second = f.store.createSession(s.account.id);
  const recovery = f.store.recoverStudent(f.teacher, s.account.id);
  const replacement = f.store.activate(recovery.invitationToken, HASH);
  for (const stale of [s.sessionToken, second.sessionToken]) denied(() => f.store.session(stale), 'LEARNING_UNAUTHORIZED');
  assert.equal(f.store.session(replacement.sessionToken).id, s.account.id);
  denied(() => f.store.activate(recovery.invitationToken, HASH), 'LEARNING_ACCESS_INVALID');
  f.store.logout(replacement.sessionToken);
  denied(() => f.store.session(replacement.sessionToken), 'LEARNING_UNAUTHORIZED');
  denied(() => f.store.recoverStudent(f.students[1].account, s.account.id), 'LEARNING_FORBIDDEN');
  const expired = f.store.recoverStudent(f.teacher, s.account.id);
  f.advance(30 * 60000 + 1);
  denied(() => f.store.activate(expired.invitationToken, HASH), 'LEARNING_ACCESS_INVALID');
});

test('teacher recovery codes cannot be reused or leave old sessions valid', t => {
  const f = fixture(t), original = f.teacherSession;
  assert.equal(original.recoveryCodes.length, 8);
  const reset = f.store.recoverTeacher('teacher', original.recoveryCodes[0], HASH);
  denied(() => f.store.session(original.sessionToken), 'LEARNING_UNAUTHORIZED');
  assert.equal(f.store.session(reset.sessionToken).id, f.teacher.id);
  denied(() => f.store.recoverTeacher('teacher', original.recoveryCodes[0], HASH), 'LEARNING_ACCESS_INVALID');
  denied(() => f.store.recoverTeacher('student1', original.recoveryCodes[1], HASH), 'LEARNING_ACCESS_INVALID');
  const records = f.store.rows('SELECT hash FROM recovery_codes');
  assert(!records.some(r => original.recoveryCodes.includes(r.hash)));
  assert(records.some(r => r.hash === tokenHash(original.recoveryCodes[0])));
});

test('another student cannot read attempts, history, or change control', t => {
  const f = fixture(t), a = attempt(f), owner = f.students[0].account, peer = f.students[1].account;
  denied(() => f.store.getAttempt(peer, a.id), 'LEARNING_NOT_FOUND');
  denied(() => f.store.history(peer, a.id), 'LEARNING_NOT_FOUND');
  denied(() => action(f, peer, a, 'state', { state: { work: { draft: 'stolen' } } }), 'LEARNING_NOT_FOUND');
  denied(() => action(f, owner, a, 'control', { controller: 'teacher' }), 'LEARNING_FORBIDDEN');
  assert.equal(f.store.getAttempt(owner, a.id).version, 0);
  assert.equal(f.store.listAttempts(peer).length, 0);
});

test('lost ACK deduplication cannot duplicate history or permit old-window overwrite', t => {
  const f = fixture(t), auth = f.students[0].account, a = attempt(f);
  const body = { opId: op(), expectedVersion: 0, type: 'state', payload: { state: { work: { draft: 'first', help: false } } } };
  const first = f.store.action(auth, a.id, body);
  const newer = action(f, auth, first.attempt, 'state', { state: { work: { draft: 'new device', help: false } } });
  const duplicate = f.store.action(auth, a.id, body);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.attempt.version, newer.attempt.version);
  assert.equal(duplicate.attempt.state.work.draft, 'new device');
  denied(() => f.store.action(auth, a.id, { ...body, opId: op() }), 'LEARNING_STATE_CONFLICT');
  denied(() => f.store.action(auth, a.id, { ...body, payload: { state: { work: { draft: 'changed' } } } }), 'LEARNING_OP_CONFLICT');
  assert.equal(f.store.history(auth, a.id).events.length, 2);
  assert.equal(f.store.getAttempt(auth, a.id).state.work.draft, 'new device');
});

test('teacher takeover fences student writes; authored handwriting can only be erased by its owner', t => {
  const f = fixture(t), auth = f.students[0].account;
  let a = attempt(f);
  a = action(f, f.teacher, a, 'control', { controller: 'teacher' }).attempt;
  denied(() => action(f, auth, a, 'state', { state: { work: { draft: 'late' } } }), 'LEARNING_CONTROL_REQUIRED');
  const teacherStroke = { id: op(), points: [{ x: .2, y: .3 }], color: '#112233', width: 3 };
  a = action(f, f.teacher, a, 'stroke', teacherStroke).attempt;
  assert.equal(a.strokes[0].author, f.teacher.id);
  denied(() => action(f, auth, a, 'erase', { strokeId: teacherStroke.id }), 'LEARNING_FORBIDDEN');
  a = action(f, f.teacher, a, 'erase', { strokeId: teacherStroke.id }).attempt;
  assert.equal(a.strokes.length, 0);
  a = action(f, f.teacher, a, 'control', { controller: 'student' }).attempt;
  a = action(f, auth, a, 'state', { state: { work: { draft: 'continued', help: false } } }).attempt;
  assert.equal(a.state.work.draft, 'continued');
});

test('two authors can append concurrent strokes but stale undo cannot erase unseen newer handwriting', t => {
  const f = fixture(t), auth = f.students[0].account, initial = attempt(f);
  const stroke = () => ({ id: op(), points: [{ x: .2, y: .3 }], color: '#112233', width: 3 });
  const teacherStroke = stroke(), studentStroke = stroke();
  const first = action(f, f.teacher, initial, 'stroke', teacherStroke).attempt;
  const second = action(f, auth, initial, 'stroke', studentStroke).attempt;
  assert.equal(first.version, 1); assert.equal(second.version, 2);
  assert.deepEqual(new Set(second.strokes.map(s => s.id)), new Set([teacherStroke.id, studentStroke.id]));
  const ownNewer = action(f, auth, second, 'stroke', stroke()).attempt;
  assert.equal(ownNewer.version, 3);
  denied(() => action(f, auth, second, 'undo', {}), 'LEARNING_STATE_CONFLICT');
  assert.equal(f.store.getAttempt(auth, initial.id).strokes.length, 3);
  // An erase identifies its target, so it remains safe across another append.
  const erased = action(f, auth, second, 'erase', { strokeId: studentStroke.id }).attempt;
  assert.equal(erased.strokes.length, 2);
  assert(!erased.strokes.some(s => s.id === studentStroke.id));
});

test('concurrent handwriting does not discard trainer input, while a trainer takeover invalidates stale input', t => {
  const f = fixture(t), auth = f.students[0].account, initial = attempt(f);
  assert.equal(initial.trainerVersion, 0);
  const ink = action(f, f.teacher, initial, 'stroke', { id: op(), points: [{ x: .2, y: .3 }], color: '#112233', width: 3 }).attempt;
  assert.equal(ink.version, 1); assert.equal(ink.trainerVersion, 0);
  const body = { opId: op(), expectedVersion: initial.version, expectedTrainerVersion: initial.trainerVersion,
    type: 'state', payload: { state: { work: { draft: 'input during teacher handwriting', help: false } } } };
  const input = f.store.action(auth, initial.id, body).attempt;
  assert.equal(input.version, 2); assert.equal(input.trainerVersion, 1);
  assert.equal(input.strokes.length, 1); assert.equal(input.state.work.draft, 'input during teacher handwriting');
  assert.equal(f.store.action(auth, initial.id, body).duplicate, true);
  const takeover = action(f, f.teacher, input, 'control', { controller: 'teacher' }, { expectedTrainerVersion: input.trainerVersion }).attempt;
  assert.equal(takeover.trainerVersion, 2);
  denied(() => f.store.action(auth, initial.id, { ...body, opId: op() }), 'LEARNING_STATE_CONFLICT');
  denied(() => action(f, auth, takeover, 'state', { state: input.state }, { expectedTrainerVersion: takeover.trainerVersion }), 'LEARNING_CONTROL_REQUIRED');
  denied(() => action(f, f.teacher, takeover, 'state', { state: input.state }, { expectedVersion: takeover.version + 1, expectedTrainerVersion: takeover.trainerVersion }), 'LEARNING_STATE_CONFLICT');
});

test('presentation discloses only the selected work and grants no write/history rights', t => {
  const f = fixture(t), a = attempt(f), b = attempt(f, 1), viewer = f.students[1].account;
  let lesson = f.store.createLesson(f.teacher, { opId: op(), title: 'Группа', learnerIds: f.students.map(s => s.account.id) }).lesson;
  let visible = f.store.getLesson(viewer, lesson.id);
  assert.deepEqual(visible.seats.map(s => s.learnerId), [viewer.id]);
  assert.equal(visible.seats[0].attempt.id, b.id);
  assert.equal(visible.presentation.target, null);
  assert(!JSON.stringify(visible).includes(a.id));
  lesson = f.store.lessonAction(f.teacher, lesson.id, { opId: op(), expectedVersion: lesson.version, type: 'present', payload: { target: f.students[0].account.id } }).lesson;
  visible = f.store.getLesson(viewer, lesson.id);
  assert.equal(visible.presentation.attempt.id, a.id);
  denied(() => f.store.getAttempt(viewer, a.id), 'LEARNING_NOT_FOUND');
  denied(() => f.store.history(viewer, a.id), 'LEARNING_NOT_FOUND');
  denied(() => action(f, viewer, a, 'stroke', { id: op(), points: [{ x: 0, y: 0 }], color: '#000000', width: 1 }), 'LEARNING_NOT_FOUND');
  lesson = f.store.lessonAction(f.teacher, lesson.id, { opId: op(), expectedVersion: lesson.version, type: 'present', payload: { target: null } }).lesson;
  assert(!JSON.stringify(f.store.getLesson(viewer, lesson.id)).includes(a.id));
  denied(() => f.store.getAttempt(viewer, lesson.commonAttemptId), 'LEARNING_NOT_FOUND');
});

test('a draft homework stays private even if its attempt ID is known', t => {
  const f = fixture(t), auth = f.students[0].account;
  const draft = f.store.createAssignments(f.teacher, { opId: op(), learnerIds: [auth.id], title: 'На завтра', trainerId: 'review', contentId: 'addition' }).assignments[0];
  assert.equal(draft.status, 'draft');
  denied(() => f.store.getAttempt(auth, draft.attemptId), 'LEARNING_NOT_FOUND');
  assert.equal(f.store.listAssignments(auth).length, 0);
  assert.equal(f.store.listAttempts(auth).length, 0);
  const lesson = f.store.createLesson(f.teacher, { opId: op(), title: 'Урок', learnerIds: [auth.id] }).lesson;
  denied(() => f.store.lessonAction(f.teacher, lesson.id, { opId: op(), expectedVersion: lesson.version, type: 'attach', payload: { learnerId: auth.id, attemptId: draft.attemptId } }), 'LEARNING_HOMEWORK_DRAFT');
});

test('client completion flags cannot award a result; ordinary reference does not count as a hint', t => {
  const f = fixture(t), auth = f.students[0].account;
  let a = attempt(f);
  a = action(f, auth, a, 'state', { state: { work: { done: true, help: false } } }).attempt;
  assert.equal(a.outcome, 'started');
  a = action(f, auth, a, 'check', { details: { answer: '99', correct: true, complete: true } }).attempt;
  assert.equal(a.outcome, 'started');
  a = action(f, auth, a, 'reference', { id: 'fipi-full' }).attempt;
  assert.equal(a.assistance.hints, false);
  a = action(f, auth, a, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(a.outcome, 'independent');
  a = action(f, auth, a, 'hint', { step: 0 }).attempt;
  assert.equal(a.outcome, 'independent', 'Later discussion must not rewrite how the original solution was completed');
});

test('hint history is monotonic before completion and a reused condition is not a new verification', t => {
  const f = fixture(t), auth = f.students[0].account;
  let a = attempt(f);
  a = action(f, auth, a, 'hint', { step: 0 }).attempt;
  a = action(f, auth, a, 'state', { state: { work: { help: false } } }).attempt;
  a = action(f, auth, a, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(a.outcome, 'hinted');
  a = action(f, auth, a, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(a.outcome, 'hinted', 'Submitting the same answer twice must not erase prior assistance');
  let repeated = attempt(f, 0, { sourceAttemptId: a.id });
  assert.notEqual(repeated.taskSpec.seed, a.taskSpec.seed);
  assert.equal(repeated.taskSpec.task.q, a.taskSpec.task.q);
  repeated = action(f, auth, repeated, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(repeated.outcome, 'practiced', 'A changed seed alone cannot award independent verification for the known question');
  repeated = action(f, auth, repeated, 'hint', {}).attempt;
  repeated = action(f, auth, repeated, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(repeated.outcome, 'practiced', 'First completion stays fixed after later discussion');
  const create = f.contracts.create;
  f.contracts.create = (trainerId, contentId) => {
    const generated = create(trainerId, contentId);
    generated.taskSpec.task.q = 'Сколько будет 1 + 4?';
    return generated;
  };
  let analogue = attempt(f, 0, { sourceAttemptId: a.id });
  analogue = action(f, auth, analogue, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(analogue.outcome, 'repeated', 'A different question after a completed source is a new independent repetition');
  let helped = attempt(f, 0, { sourceAttemptId: a.id });
  helped = action(f, auth, helped, 'hint', {}).attempt;
  helped = action(f, auth, helped, 'check', { details: { answer: '5' } }).attempt;
  assert.equal(helped.outcome, 'hinted', 'Assistance takes precedence over repetition status');
});

test('real Path and remediation contracts mark learning views as assistance in the atomic final check', t => {
  const f = fixture(t), auth = f.students[0].account;
  f.store.contracts = require('../learning-contracts');
  for (const [trainerId, contentId] of [['ege-path', 'practice-decimal-division'], ['oge-basics', 'decimal-add-subtract']]) {
    let a = f.store.createAttempt(auth, { opId: op(), trainerId, contentId, fresh: true }).attempt;
    const state = copy(a.state), answer = String(a.taskSpec.task.answer);
    const pathTrainer = trainerId === 'ege-path';
    if (pathTrainer) { state.work.stage = 1; state.work.help = false; }
    else state.view = 'learn';
    a = action(f, auth, a, 'check', { state, details: { scope: pathTrainer ? 'final' : 'practice', answer } }).attempt;
    assert.equal(a.outcome, 'hinted', trainerId + ': a learning view cannot be graded as unaided');
    assert.equal(a.assistance.hints, true);
    assert.deepEqual(a.state, state);
    assert.equal(f.store.history(auth, a.id).events.length, 1, 'State and check share one committed event');
  }
});

test('guided Path completion verifies the full prefix and saves a helped result atomically', t => {
  const f = fixture(t), auth = f.students[0].account;
  f.store.contracts = require('../learning-contracts');
  let a = f.store.createAttempt(auth, { opId: op(), trainerId: 'ege-path', contentId: 'practice-decimal-division', fresh: true }).attempt;
  const steps = a.taskSpec.task.steps;
  assert(steps.length > 1);
  const final = steps.length - 1, skipped = copy(a.state);
  skipped.work.stage = 2; skipped.work.step = final; skipped.work.answers = [];
  denied(() => action(f, auth, a, 'state', { state: skipped }), 'LEARNING_STATE_INVALID');
  for (let i = 0; i < steps.length; i++) {
    const answer = String(steps[i].a), state = copy(a.state), prefix = [...state.work.answers];
    state.work.stage = 2; state.work.help = true; state.work.step = i + 1; state.work.answers.push(answer);
    state.work.done = i === final; state.work.attempted = true;
    if (i === final) {
      denied(() => action(f, auth, a, 'check', { state, details: { scope: 'step', step: i, answer, answers: prefix.map(() => 'incorrect') } }), 'LEARNING_STEP_PREFIX_INVALID');
      assert.equal(f.store.getAttempt(auth, a.id).version, i, 'Rejected prefix cannot partially save the completed state');
    }
    const result = action(f, auth, a, 'check', { state, details: { scope: 'step', step: i, answer, answers: prefix } });
    assert.equal(result.evaluation.complete, i === final);
    a = result.attempt;
    assert.equal(a.outcome, i === final ? 'hinted' : 'started');
  }
  assert.equal(a.version, steps.length); assert.equal(a.assistance.hints, true);
  assert.equal(f.store.history(auth, a.id).events.length, steps.length);
});

test('committed state survives reopen and two server instances cannot own one database', t => {
  const f = fixture(t), auth = f.students[0].account;
  let a = attempt(f);
  a = action(f, auth, a, 'state', { state: { work: { draft: 'после перезапуска', help: false } } }).attempt;
  const competing = f.makeStore();
  assert.equal(competing.available, false); competing.close();
  f.store.close();
  const reopened = f.makeStore();
  try {
    assert.equal(reopened.available, true);
    assert.equal(reopened.session(f.students[0].sessionToken).id, auth.id);
    assert.equal(reopened.getAttempt(auth, a.id).state.work.draft, 'после перезапуска');
    assert.equal(reopened.history(auth, a.id).events.length, 1);
    const tokens = reopened.rows('SELECT hash FROM sessions').map(r => r.hash);
    assert(!tokens.includes(f.students[0].sessionToken));
    assert.equal(fs.statSync(f.filePath).mode & 0o777, 0o600);
  } finally { reopened.close(); }
});

test('HTTP endpoints require same-origin JSON and session-bound CSRF; secrets stay out of JSON', async t => {
  const express = require('express');
  const { createLearningApi } = require('../learning-api');
  const f = fixture(t), app = express();
  app.use(express.json());
  const api = createLearningApi({ store: f.store, publicOrigin: 'https://cabinet.example', secureCookies: true });
  app.use('/api/learning', api.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/learning`;
  const cookie = '__Host-mathexam_learning=' + f.students[0].sessionToken;
  const send = (route, method = 'GET', body, extra = {}) => fetch(base + route, { method, headers: { Cookie: cookie,
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  let response = await send('/session');
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  const session = await response.json();
  assert(session.csrfToken); assert(!JSON.stringify(session).includes(f.students[0].sessionToken));
  const body = { opId: op(), trainerId: 'review', contentId: 'addition' };
  for (const headers of [{}, { Origin: 'https://cabinet.example' }, { Origin: 'https://evil.example', 'x-csrf-token': session.csrfToken }, { Origin: 'https://cabinet.example', 'x-csrf-token': 'wrong' }]) {
    response = await send('/attempts', 'POST', body, headers); assert.equal(response.status, 403);
  }
  response = await send('/attempts', 'POST', body, { Origin: 'https://cabinet.example', 'x-csrf-token': session.csrfToken });
  assert.equal(response.status, 201);
  response = await send('/teacher/students'); assert.equal(response.status, 403);
  const peer = '__Host-mathexam_learning=' + f.students[1].sessionToken;
  response = await send('/attempts', 'POST', { ...body, opId: op() }, { Cookie: peer, Origin: 'https://cabinet.example', 'x-csrf-token': session.csrfToken });
  assert.equal(response.status, 403, 'CSRF token must belong to the active session');
  response = await send('/session', 'GET', undefined, { Cookie: cookie + '; ' + cookie }); assert.equal(response.status, 401);
  response = await send('/logout', 'POST', {}, { Origin: 'https://cabinet.example', 'x-csrf-token': session.csrfToken });
  assert.equal(response.status, 200);
  for (const flag of ['HttpOnly', 'SameSite=Strict', 'Secure', 'Max-Age=0']) assert(response.headers.get('set-cookie').includes(flag));
  response = await send('/session'); assert.equal(response.status, 401);
});
