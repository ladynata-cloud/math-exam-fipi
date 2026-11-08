'use strict';

// Native lesson preparation and resumable queues use disposable local accounts.
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
const { createLearningRunsRouter } = require('../learning-runs');
const { tokenHash } = require('../learning-auth');
const contracts = require('../learning-contracts');
const { loadTrainer } = require('../oge-native-math');
const op = () => randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const ORIGIN = 'https://lesson.example.test';
const material = (contentId = 'equations-linear', seed = 17) => ({ trainerId: 'ege-path', contentId, seed });

// Run the actual native generator, geometry adapter and managed hydration path.
// Only DOM/reference presentation is stubbed by the existing mathematics harness.
function gridAdapter(managed) {
  const engine = loadTrainer('trainers/oge-task18-grid.html', { search: managed ? '?learning=1' : '?board=1' });
  const document = Object.create(engine.ctx.document), elements = new Map(), getElement = document.getElementById;
  engine.ctx.document = document;
  document.getElementById = id => {
    if (!elements.has(id)) {
      const element = getElement(id);
      element.click = () => { if (!element.disabled) element.onclick(); };
      elements.set(id, element);
    }
    return elements.get(id);
  };
  document.body.dataset.ogeGeometry = '18';
  document.getElementById('courseHintPanel').hidden = true;
  const details = [0, 1].map(() => ({ open: false, matches: () => false }));
  Object.defineProperty(document, 'querySelectorAll', { value: selector => selector === '#courseHintPanel details' ? details : [] });
  engine.ctx.OgeGeometryDiscovery = { captureState: () => null, config: () => ['grid', [], []],
    validateState: model => model === null, applyState: model => assert.equal(model, null) };
  engine.ctx.OgeCourseReference = { topicCards() {}, sheetCards() {} };
  let learning;
  engine.ctx.MathExamLearning = { managed, register: adapter => { learning = adapter; } };
  engine.ctx.MathExamBoard = { register: config => managed ? engine.ctx.OgeLearningRegister(config) : undefined };
  for (const file of ['oge-geometry-board-mode.js', 'oge-learning.js', 'oge-geometry-board.js']) {
    engine.run(fs.readFileSync(path.join(__dirname, '../../trainers', file), 'utf8'));
  }
  const native = () => JSON.parse(engine.run('JSON.stringify({parameters:TR.task.p,answer:String(TR.task.ans),descriptor:getBoardTrainerState().task})'));
  return { engine, learning, native, document };
}

test('managed OGE18 recursive generation preserves the canonical condition across start and saved-state restore', () => {
  const adapter = gridAdapter(true), pinned = contracts.create('oge-public', '18', 223);
  const original = structuredClone(pinned);
  const expected = { parameters: [2, 8], answer: '4', descriptor: { key: 'segCmp', source: 'generator', value: 223 } };
  assert.deepEqual(pinned.taskSpec.task.parameters, expected.parameters);
  assert.equal(pinned.taskSpec.task.answer, expected.answer);
  adapter.learning.applyState(pinned);
  assert.deepEqual(adapter.native(), expected, 'initial managed hydration must use the server condition');
  const saved = adapter.learning.getState();
  saved.answer = saved.native.answer = '17';
  for (let repeat = 0; repeat < 3; repeat++) {
    adapter.learning.applyState(contracts.create('oge-public', '18', 133));
    adapter.learning.applyState({ taskSpec: pinned.taskSpec, state: saved });
    assert.deepEqual(adapter.native(), expected, 'native snapshot restoration must retain the same condition');
    assert.deepEqual(adapter.learning.getState(), saved, 'the pupil draft survives repeated hydration');
  }
  const completed = structuredClone(saved.native);
  completed.answer = '4'; completed.actions = [['check', '4', false]];
  adapter.engine.ctx.applyBoardTrainerState(completed);
  assert.deepEqual(adapter.native(), expected);
  assert.equal(adapter.engine.run('TR.done'), true, 'saved check replays against the canonical answer');
  assert.equal(adapter.document.getElementById('ansIn').disabled, true);
  assert.deepEqual(pinned, original, 'hydration never rewrites the authoritative task or initial state');
  for (let seed = 1; seed <= 600; seed++) {
    const sample = contracts.create('oge-public', '18', seed);
    adapter.learning.applyState(sample);
    assert.deepEqual(adapter.native(), { parameters: sample.taskSpec.task.parameters,
      answer: sample.taskSpec.task.answer, descriptor: sample.taskSpec.descriptor }, 'native/server seed ' + seed);
  }
});

test('public OGE18 board descriptors retain their existing seeded reconstruction and saved-check replay', () => {
  const adapter = gridAdapter(false);
  const descriptor = { key: 'segCmp', source: 'generator', value: 223 };
  const legacy = { parameters: [1, 2], answer: '2', descriptor };
  adapter.engine.ctx.OgeLearningNative.start(descriptor);
  assert.deepEqual(adapter.native(), legacy, 'existing public rooms must not acquire managed generator semantics');
  const saved = JSON.parse(adapter.engine.run('JSON.stringify(getBoardTrainerState())'));
  saved.answer = '2'; saved.actions = [['check', '2', false]];
  for (let repeat = 0; repeat < 3; repeat++) {
    adapter.engine.ctx.OgeLearningNative.start({ ...descriptor, value: 133 });
    // The stub DOM retains nodes that a native render replaces; reset its disabled controls.
    for (const id of ['chkBtn', 'ansIn', 'giveBtn']) adapter.document.getElementById(id).disabled = false;
    adapter.engine.ctx.applyBoardTrainerState(saved);
    assert.deepEqual(adapter.native(), legacy);
    assert.equal(adapter.engine.run('TR.done'), true);
    assert.equal(adapter.document.getElementById('ansIn').value, '2');
  }
  assert.equal(adapter.learning, undefined, 'public board does not register a managed learning adapter');
});

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-workspace-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts });
  assert.equal(store.available, true);
  const invitation = store.bootstrap({ name: 'Teacher', login: 'teacher' });
  const teacher = store.activate(invitation.invitationToken, HASH);
  const students = [1, 2].map(index => {
    const invite = store.createStudent(teacher.account, { name: 'Student ' + index, login: 'student_' + index });
    return store.activate(invite.invitationToken, HASH);
  });
  const api = createLearningApi({ store, publicOrigin: ORIGIN, secureCookies: true });
  const app = express(); app.use(express.json());
  app.use('/api/learning', api.router);
  app.use('/api/learning', createTeachingRouter(api));
  app.use('/api/learning', createLearningRunsRouter(api).router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const address = 'http://127.0.0.1:' + server.address().port + '/api/learning';
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    api.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(session, route, body, extraHeaders = {}) {
    const response = await fetch(address + route, { method: body === undefined ? 'GET' : 'POST', headers: {
      ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
        'X-CSRF-Token': tokenHash('learning-csrf:' + session.sessionToken) }), ...extraHeaders
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  }
  const create = (materials, learnerIds = [students[0].account.id]) => store.createLesson(teacher.account,
    { opId: op(), title: 'Individual lesson', learnerIds, ...(materials === undefined ? {} : { materials }) }).lesson;
  const action = (lesson, type, payload, opId = op()) => store.lessonAction(teacher.account, lesson.id,
    { opId, expectedVersion: lesson.version, type, payload }).lesson;
  return { store, filePath, teacher, students, request, create, action };
}
function snapshot(store) {
  return store.rows("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .map(({ name }) => [name, store.rows('SELECT * FROM "' + name.replaceAll('"', '""') + '"')]);
}
function save(f, auth, attempt, type, payload, lessonId) {
  return f.store.action(auth, attempt.id, { opId: op(), expectedVersion: attempt.version, type, payload,
    ...(lessonId ? { lessonId } : {}) }).attempt;
}

test('teacher rehearsal is authenticated, exact, fresh and entirely absent from durable learner results', async t => {
  const f = await fixture(t), learner = f.students[0].account;
  const original = f.store.createAttempt(learner, { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  const state = structuredClone(original.state); state.work.draft = '17';
  const saved = save(f, learner, original, 'state', { state });
  const before = snapshot(f.store), progress = f.store.progress(learner);
  const generated = await f.request(f.teacher, '/teacher/rehearsal', material());
  assert.equal(generated.status, 200);
  assert.deepEqual(generated.body.attempt.taskSpec, contracts.create('ege-path', 'equations-linear', 17).taskSpec);
  const result = await f.request(f.teacher, '/teacher/rehearsal', { attemptId: saved.id });
  assert.equal(result.status, 200);
  const rehearsal = result.body.attempt;
  assert.deepEqual(rehearsal.taskSpec, original.taskSpec);
  assert.deepEqual(rehearsal.state, original.state);
  assert.equal(rehearsal.state.work.draft, '');
  assert.deepEqual(rehearsal.strokes, []);
  assert.equal(rehearsal.learnerId, f.teacher.account.id);
  assert.equal(rehearsal.controller, 'teacher');
  assert.equal(rehearsal.sourceAttemptId, original.id);
  assert.notEqual(rehearsal.id, saved.id);
  assert.equal((await f.request(f.teacher, '/attempts/' + rehearsal.id)).status, 404);
  for (const [session, headers, expected] of [
    [f.students[0], {}, 403], [f.teacher, { Origin: 'https://other.example.test' }, 403],
    [f.teacher, { 'X-CSRF-Token': '' }, 403], [f.teacher, { 'X-Learning-Account': learner.id }, 409]
  ]) assert.equal((await f.request(session, '/teacher/rehearsal', material(), headers)).status, expected);
  assert.deepEqual(snapshot(f.store), before);
  assert.deepEqual(f.store.progress(learner), progress);
  assert.deepEqual(f.store.getAttempt(learner, saved.id), saved);
});

test('rehearsal and exact material copying reject malformed, archived, unpublished and active-exam sources', async t => {
  const f = await fixture(t), auth = f.teacher.account;
  const source = f.store.createAttempt(f.students[0].account, { opId: op(), trainerId: 'ege-path', contentId: 'percent' }).attempt;
  const draft = f.store.createAssignments(auth, { opId: op(), learnerIds: [f.students[0].account.id], title: 'Private draft', trainerId: 'ege-path', contentId: 'percent' }).assignments[0];
  for (const body of [{ ...material(), attemptId: source.id }, { ...material(), seed: -1 }, { ...material(), taskSpec: { answer: 'injected' } }, { trainerId: 'unknown', contentId: 'unknown' }, {}]) {
    assert.equal((await f.request(f.teacher, '/teacher/rehearsal', body)).status, 400);
  }
  assert.equal((await f.request(f.teacher, '/teacher/rehearsal', { attemptId: op() })).status, 404);
  assert.throws(() => f.store.teacherRehearsal({ ...auth, id: f.students[1].account.id }, { attemptId: source.id }), { code: 'LEARNING_NOT_FOUND' });
  for (const descriptor of [null, { ...material(), sourceAttemptId: source.id }, { sourceAttemptId: draft.attemptId }]) {
    const before = snapshot(f.store);
    assert.throws(() => f.create([descriptor]));
    assert.deepEqual(snapshot(f.store), before);
  }
  const run = await f.request(f.students[0], '/runs', { opId: op(), kind: 'exam' });
  assert.equal(run.status, 201);
  const examId = run.body.run.questions[0].attemptId;
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', Date.now(), source.id);
  for (const [attemptId, error] of [[source.id, 'LEARNING_ATTEMPT_ARCHIVED'], [draft.attemptId, 'LEARNING_HOMEWORK_DRAFT'], [examId, 'LEARNING_RUN_ACTIVE']]) {
    const before = snapshot(f.store);
    const result = await f.request(f.teacher, '/teacher/rehearsal', { attemptId });
    assert.equal(result.status, 409); assert.equal(result.body.error, error);
    assert.throws(() => f.create([{ sourceAttemptId: attemptId }]), { code: error });
    assert.deepEqual(snapshot(f.store), before);
  }
});

test('explicit lesson start clones the chosen ordered conditions once per pupil with private fresh work', async t => {
  const f = await fixture(t), first = f.students[0].account, second = f.students[1].account;
  const source = f.store.createAttempt(first, { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  const state = structuredClone(source.state); state.work.draft = 'private source draft';
  const saved = save(f, first, source, 'state', { state });
  const body = { opId: op(), title: 'Chosen materials', learnerIds: [first.id, second.id],
    materials: [{ sourceAttemptId: source.id }, material('percent', 33)] };
  const result = await f.request(f.teacher, '/lessons', body);
  assert.equal(result.status, 201);
  const lesson = result.body.lesson;
  assert.equal(lesson.seats.length, 2);
  assert.equal(lesson.common.controller, 'teacher');
  for (const seat of lesson.seats) {
    assert.equal(seat.materials.length, 2);
    assert.deepEqual(seat.materials.map(item => item.contentId), ['equations-linear', 'percent']);
    assert.equal(seat.attemptId, seat.materials[0].attemptId);
    assert.deepEqual(seat.attempt.taskSpec, source.taskSpec);
    assert.deepEqual(seat.attempt.state, source.state);
    assert.equal(seat.attempt.outcome, 'started');
    assert.deepEqual(seat.attempt.assistance, { teacher: false, hints: false });
    assert.deepEqual(f.store.getAttempt(f.teacher.account, seat.materials[1].attemptId).taskSpec, contracts.create('ege-path', 'percent', 33).taskSpec);
    assert.ok(seat.materials.every(item => typeof item.title === 'string' && item.title.length > 0));
  }
  assert.notEqual(lesson.seats[0].attemptId, lesson.seats[1].attemptId);
  assert.deepEqual(f.store.getAttempt(first, source.id), saved);
  const pupilLesson = f.store.getLesson(second, lesson.id);
  assert.deepEqual(pupilLesson.seats.map(seat => seat.learnerId), [second.id]);
  assert.equal(JSON.stringify(pupilLesson).includes(lesson.seats[0].attemptId), false);
  assert.equal(JSON.stringify(pupilLesson).includes(source.id), false);
  assert.deepEqual(f.store.listAssignments(first), []);
  const before = snapshot(f.store);
  const duplicate = await f.request(f.teacher, '/lessons', body);
  assert.equal(duplicate.body.duplicate, true); assert.equal(duplicate.body.lesson.id, lesson.id);
  assert.deepEqual(snapshot(f.store), before);
});

test('append, select and reopen retain the same attempt, authored ink, history, assistance and controller', async t => {
  const f = await fixture(t), learner = f.students[0].account;
  let lesson = f.create([material()]), attempt = lesson.seats[0].attempt;
  const originalId = attempt.id, state = structuredClone(attempt.state); state.work.draft = '17';
  attempt = save(f, learner, attempt, 'state', { state }, lesson.id);
  attempt = save(f, learner, attempt, 'stroke', { id: op(), points: [{ x: .2, y: .3 }], color: '#112233', width: 3 }, lesson.id);
  attempt = save(f, f.teacher.account, attempt, 'control', { controller: 'teacher' }, lesson.id);
  const history = f.store.history(f.teacher.account, originalId);
  lesson = f.action(lesson, 'present', { target: learner.id });
  lesson = f.action(lesson, 'assign', { learnerIds: [learner.id], ...material('percent'), activate: false });
  assert.equal(lesson.seats[0].attemptId, originalId); assert.equal(lesson.seats[0].materials.length, 2);
  assert.equal(lesson.presentation.attempt.id, originalId);
  const secondId = lesson.seats[0].materials[1].attemptId;
  lesson = f.action(lesson, 'attach', { learnerId: learner.id, attemptId: secondId });
  assert.equal(lesson.presentation.attempt.id, secondId);
  assert.throws(() => save(f, learner, attempt, 'stroke', { id: op(), points: [{ x: .1, y: .1 }], color: '#112233', width: 3 }, lesson.id), { code: 'LEARNING_SEAT_INVALID' });
  const requestId = op(), requestBody = { opId: requestId, expectedVersion: lesson.version, type: 'attach', payload: { learnerId: learner.id, attemptId: originalId } };
  lesson = f.store.lessonAction(f.teacher.account, lesson.id, requestBody).lesson;
  assert.deepEqual(lesson.seats[0].attempt, attempt);
  assert.deepEqual(f.store.history(f.teacher.account, originalId), history);
  assert.equal(f.store.lessonAction(f.teacher.account, lesson.id, requestBody).duplicate, true);
  assert.throws(() => f.store.lessonAction(f.teacher.account, lesson.id, { ...requestBody, opId: op() }), { code: 'LEARNING_STATE_CONFLICT' });
  assert.throws(() => f.store.lessonAction(learner, lesson.id, { ...requestBody, opId: op() }), { code: 'LEARNING_FORBIDDEN' });
  f.store.close();
  const reopened = new LearningStore({ filePath: f.filePath, contracts });
  try {
    assert.equal(reopened.available, true);
    assert.deepEqual(reopened.getLesson(f.teacher.account, lesson.id), lesson);
    assert.deepEqual(reopened.history(f.teacher.account, originalId), history);
  } finally { reopened.close(); }
});

test('native next example enters the queue atomically and the twelve-material bound rolls every mutation back', async t => {
  const f = await fixture(t), learner = f.students[0].account;
  let lesson = f.create([material()]), source = lesson.seats[0].attempt;
  const nextBody = { opId: op(), trainerId: source.trainerId, contentId: source.contentId,
    sourceAttemptId: source.id, fresh: true, lessonId: lesson.id };
  const next = f.store.createAttempt(learner, nextBody).attempt;
  lesson = f.store.getLesson(f.teacher.account, lesson.id);
  assert.deepEqual(lesson.seats[0].materials.map(item => item.attemptId), [source.id, next.id]);
  assert.equal(lesson.seats[0].attemptId, next.id);
  assert.equal(f.store.createAttempt(learner, nextBody).duplicate, true);
  assert.equal(f.store.getLesson(learner, lesson.id).version, lesson.version);
  while (lesson.seats[0].materials.length < 12) lesson = f.action(lesson, 'assign', { learnerIds: [learner.id], ...material('percent'), activate: false });
  const outside = f.store.createAttempt(learner, { opId: op(), trainerId: 'ege-path', contentId: 'percent', fresh: true }).attempt;
  for (const action of [
    () => f.action(lesson, 'assign', { learnerIds: [learner.id], ...material() }),
    () => f.action(lesson, 'attach', { learnerId: learner.id, attemptId: outside.id }),
    () => f.store.createAttempt(learner, { ...nextBody, opId: op(), sourceAttemptId: next.id })
  ]) {
    const before = snapshot(f.store);
    assert.throws(action, { code: 'LEARNING_LESSON_QUEUE_FULL' });
    assert.deepEqual(snapshot(f.store), before);
  }
  lesson = f.action(lesson, 'attach', { learnerId: learner.id, attemptId: source.id });
  assert.equal(lesson.seats[0].materials.length, 12); assert.equal(lesson.seats[0].attemptId, source.id);
  const before = snapshot(f.store);
  assert.throws(() => f.create(Array.from({ length: 13 }, () => material())), { code: 'LEARNING_LESSON_MATERIALS_INVALID' });
  assert.deepEqual(snapshot(f.store), before);
});

test('legacy lessons, multi-seat capacity, draft visibility and exact-source assignment retain ownership boundaries', async t => {
  const f = await fixture(t), first = f.students[0].account, second = f.students[1].account;
  const source = f.store.createAttempt(first, { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
  let lesson = f.create(undefined, [first.id, second.id]);
  // Exercise a pre-feature seats_json row without queue fields.
  f.store.run('UPDATE lessons SET seats_json=? WHERE id=?', JSON.stringify(lesson.seats.map(seat => ({ learnerId: seat.learnerId, attemptId: seat.attemptId }))), lesson.id);
  lesson = f.store.getLesson(f.teacher.account, lesson.id);
  assert.deepEqual(lesson.seats[0].materials.map(item => item.attemptId), [source.id]);
  lesson = f.action(lesson, 'assign', { learnerIds: [second.id], sourceAttemptId: source.id });
  assert.deepEqual(lesson.seats[1].attempt.taskSpec, source.taskSpec);
  assert.equal(lesson.seats[1].attempt.sourceAttemptId, null);
  while (lesson.seats[1].materials.length < 12) lesson = f.action(lesson, 'assign', { learnerIds: [second.id], ...material('percent') });
  const before = snapshot(f.store);
  assert.throws(() => f.action(lesson, 'assign', { learnerIds: [first.id, second.id], ...material() }), { code: 'LEARNING_LESSON_QUEUE_FULL' });
  assert.deepEqual(snapshot(f.store), before);
  assert.throws(() => f.action(lesson, 'attach', { learnerId: first.id, attemptId: lesson.seats[1].attemptId }), { code: 'LEARNING_ATTEMPT_INVALID' });
  const draft = f.store.createAssignments(f.teacher.account, { opId: op(), learnerIds: [first.id], title: 'Draft', trainerId: 'ege-path', contentId: 'percent' }).assignments[0];
  assert.throws(() => f.action(lesson, 'attach', { learnerId: first.id, attemptId: draft.attemptId }), { code: 'LEARNING_HOMEWORK_DRAFT' });
  // DTOs filter a legacy/private reference even when such a row is encountered.
  const seats = JSON.parse(f.store.lessonRow(f.teacher.account, lesson.id).seats_json);
  seats[0].materialIds = [source.id, draft.attemptId];
  f.store.run('UPDATE lessons SET seats_json=? WHERE id=?', JSON.stringify(seats), lesson.id);
  const pupilView = f.store.getLesson(first, lesson.id);
  assert.deepEqual(pupilView.seats[0].materials.map(item => item.attemptId), [source.id]);
  assert.equal(JSON.stringify(pupilView).includes(draft.attemptId), false);
});

test('reset prunes inactive materials, preserves the active presentation and archives history without reviving it', async t => {
  const f = await fixture(t), learner = f.students[0].account;
  let lesson = f.create([material('equations-linear'), material('percent')]);
  const [first, second] = lesson.seats[0].materials;
  lesson = f.action(lesson, 'present', { target: learner.id });
  let reset = await f.request(f.teacher, '/teacher/students/' + learner.id + '/reset',
    { opId: op(), scope: 'content', value: 'path:percent', reason: 'Repeat the topic' });
  assert.equal(reset.status, 200);
  lesson = f.store.getLesson(f.teacher.account, lesson.id);
  assert.deepEqual(lesson.seats[0].materials.map(item => item.attemptId), [first.attemptId]);
  assert.equal(lesson.presentation.attempt.id, first.attemptId);
  assert.throws(() => f.action(lesson, 'attach', { learnerId: learner.id, attemptId: second.attemptId }), { code: 'LEARNING_ATTEMPT_INVALID' });
  reset = await f.request(f.teacher, '/teacher/students/' + learner.id + '/reset',
    { opId: op(), scope: 'content', value: 'path:equations-linear', reason: 'Restart the topic' });
  assert.equal(reset.status, 200);
  lesson = f.store.getLesson(f.teacher.account, lesson.id);
  assert.deepEqual(lesson.seats[0].materials, []); assert.equal(lesson.seats[0].attemptId, null);
  assert.equal(lesson.presentation.target, null);
  assert.ok(f.store.history(f.teacher.account, first.attemptId).events.some(event => event.type === 'archive'));
});
