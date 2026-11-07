'use strict';

// Real HTTP and SQLite with disposable synthetic accounts. No production data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { FamilyAccess } = require('../learning-family');
const { tokenHash } = require('../learning-auth');
const contracts = require('../learning-contracts');
const model = require('../../trainers/spacemath/model');
const op = () => randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const ORIGIN = 'https://spacemath.example.test';
const graph = title => ({ version: 1, title, objects: [
  { id: 'a', type: 'point', label: 'A', x: -2, y: 1 },
  { id: 'b', type: 'point', label: 'B', x: 4, y: 3 },
  { id: 'm', type: 'midpoint', label: 'M', parents: ['a', 'b'] }
], view: { axes: true, grid: false } });

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-spacemath-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let store = new LearningStore({ filePath, contracts }), api, server, address;
  assert.equal(store.available, true);
  const teacher = store.activate(store.bootstrap({ name: 'Fixture teacher', login: 'geometry_teacher' }).invitationToken, HASH);
  const students = [1, 2].map(index => store.activate(store.createStudent(teacher.account,
    { name: 'Fixture pupil ' + index, login: 'geometry_pupil_' + index }).invitationToken, HASH));
  async function start() {
    api = createLearningApi({ store, publicOrigin: ORIGIN, secureCookies: true });
    const app = express(); app.use(express.json()); app.use('/api/learning', api.router, createTeachingRouter(api));
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    address = 'http://127.0.0.1:' + server.address().port + '/api/learning';
  }
  async function stop() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); api.close(); }
  await start();
  t.after(async () => { await stop(); fs.rmSync(directory, { recursive: true, force: true }); });
  async function request(session, route, body, extra = {}) {
    const response = await fetch(address + route, { method: body === undefined ? 'GET' : 'POST', headers: {
      ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
        ...(session ? { 'X-CSRF-Token': tokenHash('learning-csrf:' + session.sessionToken) } : {}) }), ...extra
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
  }
  async function create(session, body = {}) {
    const result = await request(session, '/spacemath/models', { opId: op(), ...body });
    assert.equal(result.status, 201, JSON.stringify(result.body)); return result.body.attempt;
  }
  async function action(session, attempt, type, payload, extra = {}) {
    return request(session, '/attempts/' + attempt.id + '/actions',
      { opId: op(), expectedVersion: attempt.version, type, payload, ...extra });
  }
  return { get store() { return store; }, teacher, students, request, create, action,
    async restart() { await stop(); store = new LearningStore({ filePath, contracts }); assert(store.available); await start(); } };
}

test('SpaceMath libraries enforce account, learner, source, CSRF and exact-input boundaries', async t => {
  const f = await fixture(t), [pupil, peer] = f.students;
  const privateModel = await f.create(f.teacher, { title: 'Private preparation' });
  const own = await f.create(pupil, { title: 'Pupil construction' });
  const other = await f.create(peer, { title: 'Peer construction' });
  assert.equal(privateModel.controller, 'teacher'); assert.equal(own.controller, 'student');
  const teacherModels = await f.request(f.teacher, '/spacemath/models');
  assert.deepEqual(teacherModels.body.models.map(row => row.id), [privateModel.id]);
  assert.match(teacherModels.cache, /no-store/);
  assert.deepEqual((await f.request(f.teacher, '/spacemath/models?learnerId=' + pupil.account.id)).body.models.map(row => row.id), [own.id]);
  assert.deepEqual((await f.request(pupil, '/spacemath/models')).body.models.map(row => row.id), [own.id]);
  for (const route of ['/spacemath/models?learnerId=' + peer.account.id, '/spacemath/models?learnerId=' + f.teacher.account.id,
    '/attempts/' + privateModel.id, '/attempts/' + other.id]) assert.equal((await f.request(pupil, route)).status, 404, route);
  for (const sourceAttemptId of [privateModel.id, other.id]) assert.equal((await f.request(pupil, '/spacemath/models', { opId: op(), sourceAttemptId })).status, 404);
  assert.equal((await f.request(pupil, '/spacemath/models', { opId: op(), learnerId: peer.account.id })).status, 404);
  assert.equal((await f.request(null, '/spacemath/models')).status, 401);
  assert.equal((await f.request(null, '/spacemath/models', { opId: op() })).status, 401);
  assert.equal((await f.request(pupil, '/spacemath/models', { opId: op() }, { Origin: 'https://other.example.test' })).status, 403);
  assert.equal((await f.request(pupil, '/spacemath/models', { opId: op() }, { 'X-CSRF-Token': 'invalid' })).status, 403);
  assert.equal((await f.request(pupil, '/spacemath/models', { opId: op(), state: model.empty() })).status, 400);
  for (const value of [[pupil.account.id], {}, null, 123]) {
    assert.equal((await f.request(f.teacher, '/spacemath/models', { opId: op(), learnerId: value })).status, 404);
    assert.equal((await f.request(f.teacher, '/spacemath/models', { opId: op(), sourceAttemptId: value })).status, 404);
  }
  assert.equal((await f.request(f.teacher, '/spacemath/models?learnerId[]=' + pupil.account.id)).status, 404);
  assert.equal((await f.request(f.teacher, '/spacemath/models', { opId: [op()] })).status, 400);
  assert.equal((await f.action(f.teacher, privateModel, 'control', { controller: 'student' })).status, 400);
});

test('SpaceMath mutations obey controller and revision fences; durable state/history survive API restart', async t => {
  const f = await fixture(t), pupil = f.students[0];
  let attempt = await f.create(pupil), state = graph('Moved midpoint');
  assert.equal((await f.action(f.teacher, attempt, 'state', { state })).status, 409);
  const body = { opId: op(), expectedVersion: attempt.version, type: 'state', payload: { state } };
  let result = await f.request(pupil, '/attempts/' + attempt.id + '/actions', body);
  assert.equal(result.status, 200); attempt = result.body.attempt;
  assert.equal((await f.request(pupil, '/attempts/' + attempt.id + '/actions', body)).body.duplicate, true);
  assert.equal((await f.action(pupil, { ...attempt, version: 0 }, 'state', { state: graph('Stale') })).status, 409);
  result = await f.action(f.teacher, attempt, 'control', { controller: 'teacher' });
  assert.equal(result.status, 200); attempt = result.body.attempt;
  assert.equal((await f.action(pupil, attempt, 'state', { state: graph('Unauthorized') })).status, 409);
  assert.equal((await f.action(pupil, attempt, 'control', { controller: 'student' })).status, 403);
  state.objects[1].x = 8; state.title = 'Persisted triangle';
  result = await f.action(f.teacher, attempt, 'state', { state });
  assert.equal(result.status, 200); attempt = result.body.attempt;
  assert.deepEqual(attempt.assistance, { teacher: false, hints: false });
  const beforeHistory = await f.request(pupil, '/attempts/' + attempt.id + '/history');
  assert.equal(beforeHistory.body.events.length, 3);
  assert.deepEqual(beforeHistory.body.initialAttempt.state, model.empty());
  await f.restart();
  assert.deepEqual((await f.request(pupil, '/attempts/' + attempt.id)).body, attempt);
  assert.deepEqual((await f.request(pupil, '/attempts/' + attempt.id + '/history')).body, beforeHistory.body);
  const summaries = (await f.request(pupil, '/spacemath/models')).body.models;
  assert.equal(summaries[0].title, state.title); assert.equal(summaries[0].objectCount, 3);
  assert.deepEqual(model.evaluate((await f.request(pupil, '/attempts/' + attempt.id)).body.state).m,
    { kind: 'point', defined: true, x: 3, y: 2 });
  assert.equal((await f.action(f.teacher, attempt, 'state', { state: { ...state, objects: [...state.objects, { id: 'late', type: 'midpoint', label: 'X', parents: ['future', 'a'] }] } })).status, 400);
  assert.equal((await f.request(pupil, '/attempts/' + attempt.id)).body.version, attempt.version);
});

test('SpaceMath copy receipts are idempotent and reauthorize current ownership without storing private snapshots', async t => {
  const f = await fixture(t), pupil = f.students[0];
  let source = await f.create(f.teacher, { title: 'Source' });
  source = (await f.action(f.teacher, source, 'state', { state: graph('Current source') })).body.attempt;
  const body = { opId: op(), learnerId: pupil.account.id, sourceAttemptId: source.id, title: 'Pupil copy' };
  const first = await f.request(f.teacher, '/spacemath/models', body);
  assert.equal(first.status, 201); let copy = first.body.attempt;
  assert.equal(copy.sourceAttemptId, null); assert.equal(copy.controller, 'student');
  assert.deepEqual(copy.state, { ...source.state, title: 'Pupil copy' });
  assert.deepEqual(copy.strokes, []); assert.equal(copy.version, 0);
  copy = (await f.action(pupil, copy, 'state', { state: { ...copy.state, title: 'Pupil updated' } })).body.attempt;
  const retry = await f.request(f.teacher, '/spacemath/models', body);
  assert.equal(retry.status, 200); assert.equal(retry.body.duplicate, true); assert.deepEqual(retry.body.attempt, copy);
  assert.deepEqual(JSON.parse(f.store.row('SELECT result_json FROM operations WHERE actor_id=? AND op_id=?', f.teacher.account.id, body.opId).result_json), { attemptId: copy.id });
  assert.equal((await f.request(f.teacher, '/spacemath/models', { ...body, title: 'Different request' })).status, 409);
  const ownCopy = await f.create(pupil, { sourceAttemptId: copy.id });
  assert.equal(ownCopy.sourceAttemptId, copy.id); assert.equal(ownCopy.state.title, 'Pupil updated');
  f.store.run('UPDATE accounts SET teacher_id=? WHERE id=?', f.students[1].account.id, pupil.account.id);
  assert.equal((await f.request(f.teacher, '/spacemath/models', body)).status, 404);
  assert.equal((await f.request(f.teacher, '/spacemath/models?learnerId=' + pupil.account.id)).status, 404);
});

test('SpaceMath lesson copies capture current construction and hide private lineage; pupil attachment continues the same attempt', async t => {
  const f = await fixture(t), pupil = f.students[0];
  let source = await f.create(f.teacher);
  source = (await f.action(f.teacher, source, 'state', { state: graph('Lesson preparation') })).body.attempt;
  const body = { opId: op(), title: 'Construction lesson', learnerIds: f.students.map(s => s.account.id), materials: [{ sourceAttemptId: source.id }] };
  let lesson = f.store.createLesson(f.teacher.account, body).lesson;
  const ownCopy = lesson.seats.find(seat => seat.learnerId === pupil.account.id).attempt;
  assert.notEqual(ownCopy.id, source.id); assert.deepEqual(ownCopy.state, source.state); assert.equal(ownCopy.sourceAttemptId, null);
  assert.equal(lesson.seats[0].materials[0].title, 'Lesson preparation');
  assert.deepEqual(f.store.getLesson(pupil.account, lesson.id).seats.map(seat => seat.learnerId), [pupil.account.id]);
  const own = await f.create(pupil, { title: 'Continue this model' });
  const before = f.store.row('SELECT COUNT(*) AS n FROM attempts').n;
  lesson = f.store.lessonAction(f.teacher.account, lesson.id, { opId: op(), expectedVersion: lesson.version,
    type: 'attach', payload: { learnerId: pupil.account.id, attemptId: own.id } }).lesson;
  assert.equal(lesson.seats.find(seat => seat.learnerId === pupil.account.id).attemptId, own.id);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM attempts').n, before);
  lesson = f.store.lessonAction(f.teacher.account, lesson.id, { opId: op(), expectedVersion: lesson.version,
    type: 'assign', payload: { learnerIds: ['common'], sourceAttemptId: source.id } }).lesson;
  const shared = f.store.getLesson(pupil.account, lesson.id).common;
  assert.deepEqual(shared.state, source.state); assert.equal(shared.sourceAttemptId, null);
  assert.equal((await f.request(pupil, '/attempts/' + source.id)).status, 404);
  assert.equal((await f.request(pupil, '/attempts/' + lesson.seats.find(seat => seat.learnerId !== pupil.account.id).attemptId)).status, 404);
  // The existing exercise contract continues to copy its initial condition.
  let exercise = f.store.createAttempt(pupil.account, { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  const initial = structuredClone(exercise.state), state = structuredClone(initial); state.work.draft = 'changed';
  exercise = f.store.action(pupil.account, exercise.id, { opId: op(), expectedVersion: exercise.version, type: 'state', payload: { state } }).attempt;
  assert.deepEqual(f.store.lessonMaterial(f.teacher.account, { sourceAttemptId: exercise.id }).generated.state, initial);
});

test('SpaceMath cannot grade, submit homework or contribute to progress, rewards and parent/teacher totals', async t => {
  const f = await fixture(t), pupil = f.students[0];
  const academic = f.store.createAttempt(pupil.account, { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  const family = new FamilyAccess(f.store);
  const invitation = family.write(f.teacher.sessionToken, pupil.account.id, { name: 'Fixture parent', expectedVersion: 0 });
  const parent = family.activate(invitation.invitationToken, HASH, family.invitation(invitation.invitationToken).row, () => {});
  const baseline = family.overview(parent.sessionToken);
  const progress = (await f.request(pupil, '/progress')).body;
  const rewards = (await f.request(pupil, '/rewards')).body;
  const modelAttempt = await f.create(pupil);
  for (const type of ['check', 'hint']) assert.equal((await f.action(pupil, modelAttempt, type, { state: modelAttempt.state, details: {} })).status, 400);
  assert.equal((await f.request(pupil, '/attempts/' + modelAttempt.id + '/submit', { opId: op(), expectedVersion: 0 })).status, 400);
  assert.equal((await f.request(f.teacher, '/assignments', { opId: op(), title: 'Not homework', learnerIds: [pupil.account.id], trainerId: 'spacemath', contentId: 'construction' })).status, 400);
  assert.deepEqual((await f.request(pupil, '/progress')).body, progress);
  assert.deepEqual((await f.request(pupil, '/rewards')).body, rewards);
  assert.deepEqual(family.overview(parent.sessionToken).progress, baseline.progress);
  const report = (await f.request(f.teacher, '/teacher/students/' + pupil.account.id + '/report')).body;
  assert.deepEqual(report.attempts.map(row => row.id), [academic.id]); assert.equal(report.counts.started, 1);
  assert.equal(f.store.getAttempt(pupil.account, modelAttempt.id).outcome, 'started');
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM events WHERE attempt_id=?', modelAttempt.id).n, 0);
});

for (const selection of [{ scope: 'all' }, { scope: 'topic', value: 'plane' }]) {
  test('academic reset ' + selection.scope + ' preserves the saved construction, history and active lesson material', async t => {
    const f = await fixture(t), pupil = f.students[0];
    let construction = await f.create(pupil);
    construction = (await f.action(pupil, construction, 'state', { state: graph('Keep this construction') })).body.attempt;
    let lesson = f.store.createLesson(f.teacher.account, { opId: op(), title: 'Geometry lesson', learnerIds: [pupil.account.id],
      materials: [{ trainerId: 'ege-path', contentId: 'triangle', seed: 17 }] }).lesson;
    const exercise = lesson.seats[0].attempt;
    lesson = f.store.lessonAction(f.teacher.account, lesson.id, { opId: op(), expectedVersion: lesson.version,
      type: 'attach', payload: { learnerId: pupil.account.id, attemptId: construction.id } }).lesson;
    lesson = f.store.lessonAction(f.teacher.account, lesson.id, { opId: op(), expectedVersion: lesson.version,
      type: 'present', payload: { target: pupil.account.id } }).lesson;
    const history = (await f.request(pupil, '/attempts/' + construction.id + '/history')).body;
    assert.deepEqual(lesson.seats[0].materials.map(item => item.attemptId), [exercise.id, construction.id]);

    const route = '/teacher/students/' + pupil.account.id + '/reset';
    const explicit = await f.request(f.teacher, route, { opId: op(), scope: 'content', value: 'spacemath:construction', reason: 'Academic reset' });
    assert.equal(explicit.status, 400); assert.equal(explicit.body.error, 'LEARNING_RESET_INVALID');
    assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_resets').n, 0);
    assert.deepEqual(f.store.getLesson(f.teacher.account, lesson.id), lesson, 'a document cannot be selected by a content reset');

    const reset = await f.request(f.teacher, route, { opId: op(), ...selection, reason: 'Repeat academic diagnosis' });
    assert.equal(reset.status, 200); assert.equal(reset.body.archived, 1); assert.equal(reset.body.preservedHistory, true);
    assert.deepEqual(f.store.getAttempt(pupil.account, construction.id), construction, 'all model state and revision metadata survive');
    assert.deepEqual((await f.request(pupil, '/attempts/' + construction.id + '/history')).body, history);
    assert.deepEqual((await f.request(pupil, '/spacemath/models')).body.models.map(item => item.id), [construction.id]);
    const after = f.store.getLesson(pupil.account, lesson.id);
    assert.equal(after.seats[0].attemptId, construction.id);
    assert.deepEqual(after.seats[0].materials.map(item => item.attemptId), [construction.id]);
    assert.equal(after.presentation.target, pupil.account.id); assert.equal(after.presentation.attempt.id, construction.id);
    assert.deepEqual(after.presentation.attempt.state, construction.state);
    const archived = f.store.getAttempt(pupil.account, exercise.id);
    assert.notEqual(archived.archivedAt, null); assert.deepEqual(archived.state, exercise.state);
    assert.equal(f.store.history(pupil.account, exercise.id).events.at(-1).type, 'archive');
  });
}
