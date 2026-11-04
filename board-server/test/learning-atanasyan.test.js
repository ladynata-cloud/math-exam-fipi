'use strict';
// Public exercise data and synthetic accounts only; no real learner records.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../../geometry-course/textbook/learning-contracts');
const catalog = require('../../learning/catalog');
const contracts = require('../learning-contracts');
const { LearningStore } = require('../learning-store');
const { getRewards } = require('../learning-rewards');
const clone = value => structuredClone(value);
const op = () => crypto.randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const theoryId = number => 'atanasyan-7-9-theory-' + number + '-part-1';
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-atanasyan-'));
  const filePath = path.join(dir, 'learning.sqlite');
  let store = new LearningStore({ filePath, contracts });
  assert.equal(store.available, true);
  const teacher = store.activate(store.bootstrap({ name: 'Fixture teacher', login: 'atanasyan_teacher' }).invitationToken, HASH).account;
  const student = store.activate(store.createStudent(teacher, { name: 'Fixture learner', login: 'atanasyan_student' }).invitationToken, HASH).account;
  const peer = store.activate(store.createStudent(teacher, { name: 'Fixture peer', login: 'atanasyan_peer' }).invitationToken, HASH).account;
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { teacher, student, peer, get store() { return store; },
    reopen() { store.close(); store = new LearningStore({ filePath, contracts }); assert.equal(store.available, true); },
    attempt() { return store.createAttempt(student, { opId: op(), trainerId: C.TRAINER_ID, contentId: C.CONTENT_ID, fresh: true }).attempt; },
    save(attempt, state, actor = student) { return store.action(actor, attempt.id, { opId: op(), expectedVersion: attempt.version,
      expectedTrainerVersion: attempt.trainerVersion, type: 'state', payload: { state } }).attempt; }
  };
}
function guidedState() {
  const state = C.fresh();
  state.draft = 'Стороны MN, NP, PM. Углы NMP, MNP, MPN; вершина — средняя буква.';
  state.revealed = 2; state.assisted = true; state.submitted = true;
  state.mainView = { viewId: 'step-2', zoom: 1.5, maxStep: 2 };
  state.openDetails = [0, 4, 7];
  state.theory = [
    { id: theoryId(14), view: { viewId: 'step-3', zoom: 1.25, maxStep: 3 }, openDetails: [0, 7] },
    { id: theoryId(1), view: { viewId: 'step-6', zoom: 2.5, maxStep: 6 }, openDetails: [11, 12] }
  ];
  return state;
}

test('one fixed manual catalog item agrees with the released card and its four theory cards', () => {
  const items = catalog.items.filter(item => item.trainerId === C.TRAINER_ID);
  assert.equal(items.length, 1);
  const item = items[0];
  assert.equal(item.id, C.TRAINER_ID + ':' + C.CONTENT_ID);
  assert.equal(item.url, '/trainers/atanasyan-7-9.html');
  assert.equal(item.answerMode, 'manual'); assert.equal(item.trainingOnly, true); assert.equal(item.position, null);
  const course = require('../../geometry-course/textbook/data/course.json');
  const lesson = course.lessons.find(row => row.id === C.CONTENT_ID);
  const { taskSpec, state } = contracts.create(C.TRAINER_ID, C.CONTENT_ID, 17);
  assert.equal(taskSpec.revision, lesson.revision); assert.equal(taskSpec.contentVersion, item.contentVersion);
  assert.equal(taskSpec.prompt, lesson.statement.text); assert.equal(taskSpec.steps, lesson.steps.length);
  assert.equal(taskSpec.answerMode, lesson.answer.mode); assert.equal(taskSpec.title, item.title);
  assert.deepEqual(contracts.normalize(C.TRAINER_ID, taskSpec, state), C.fresh());
  assert.equal(contracts.describe(taskSpec).prompt, lesson.statement.text);
  assert.equal(contracts.expectedText(taskSpec), '', 'The cabinet cannot present an automatic answer key.');
  assert.equal(contracts.questionIdentity(taskSpec), contracts.questionIdentity(contracts.create(C.TRAINER_ID, C.CONTENT_ID, 999).taskSpec));
  for (const [id, meta] of Object.entries(C.THEORY)) {
    const theory = course.lessons.find(row => row.id === id);
    assert.equal(meta.steps, theory.steps.length);
    assert.equal(meta.details, 1 + theory.help.length + 2 * theory.steps.length);
    assert.deepEqual(Object.keys(theory.visualization.model.views), ['neutral', ...theory.steps.map(step => step.id)]);
  }
  for (const number of [1, 91, 93, 190]) assert.throws(() => contracts.create(C.TRAINER_ID, 'atanasyan-7-9-main-' + number + '-part-1', 1), { code: 'LEARNING_TRAINER_UNKNOWN' });
  assert.throws(() => contracts.create(C.TRAINER_ID, C.CONTENT_ID, -1), { code: 'LEARNING_TASK_INVALID' });
  assert.equal(contracts.examPool(12).some(row => row.trainerId === C.TRAINER_ID), false);
});

test('canonical task specs reject changed content, grading policy and revision', () => {
  const { taskSpec, state } = C.create(C.CONTENT_ID, 0);
  for (const [key, value] of Object.entries({ trainerId: 'ege-path', contentId: 'other', id: 'other', seed: NaN,
    contentVersion: 2, revision: 2, answerMode: 'auto', title: 'other', prompt: 'other', steps: 3, correct: true })) {
    assert.throws(() => contracts.normalize(C.TRAINER_ID, { ...taskSpec, [key]: value }, state), { code: 'LEARNING_STATE_INVALID' }, key);
  }
  const missing = clone(taskSpec); delete missing.revision;
  assert.throws(() => C.validateTaskSpec(missing));
});

test('manual snapshot round-trips all supported views and a legal theory back stack without completion', () => {
  const { taskSpec } = C.create(C.CONTENT_ID, 1);
  const sourceOnly = C.fresh(); sourceOnly.openDetails = [0];
  assert.equal(contracts.assistance(C.TRAINER_ID, taskSpec, sourceOnly), false);
  const state = guidedState(), normalized = contracts.normalize(C.TRAINER_ID, taskSpec, state);
  assert.deepEqual(normalized, state); assert.notEqual(normalized, state); assert.notEqual(normalized.mainView, state.mainView);
  assert.equal(contracts.assistance(C.TRAINER_ID, taskSpec, state), true);
  for (const first of [14, 4]) {
    const next = C.fresh(); next.assisted = true;
    next.theory = [{ id: theoryId(first), view: { viewId: 'neutral', zoom: 1, maxStep: 0 }, openDetails: [] }];
    assert.deepEqual(C.normalize(taskSpec, next), next);
  }
  const emptySaved = C.fresh(); emptySaved.submitted = true;
  assert.deepEqual(C.normalize(taskSpec, emptySaved), emptySaved, 'A save marker is not a homework submission or correctness claim.');
  const max = C.fresh(); max.draft = 'Я'.repeat(8000); assert.deepEqual(C.normalize(taskSpec, max), max);
});

test('snapshot validation rejects forged grades, scope escapes, future views and malformed values', () => {
  const { taskSpec } = C.create(C.CONTENT_ID, 2);
  const mutations = [
    s => { s.checked = true; }, s => { s.correct = true; }, s => { s.completed = true; }, s => { s.reviewStatus = 'accepted'; },
    s => { s.lessonId = 'atanasyan-7-9-main-92-part-2'; }, s => { s.draft = 'x'.repeat(8001); }, s => { s.draft = 1; },
    s => { s.stepDrafts['step-1'] = 'answer'; }, s => { s.revealed = 3; }, s => { s.revealed = 1.5; },
    s => { s.assisted = 'true'; }, s => { s.assisted = false; }, s => { s.submitted = 'true'; },
    s => { s.mainView.zoom = Infinity; }, s => { s.mainView.zoom = 0.9; }, s => { s.mainView.zoom = 2.51; },
    s => { s.mainView.maxStep = 1; }, s => { s.mainView.viewId = 'step-3'; }, s => { s.mainView.yaw = 0; },
    s => { s.openDetails = [8]; }, s => { s.openDetails = [1, 1]; }, s => { s.openDetails = [2, 1]; },
    s => { s.theory[0].id = theoryId(1); }, s => { s.theory[1].id = theoryId(4); },
    s => { s.theory.push(clone(s.theory[1])); }, s => { s.theory[1].view.maxStep = 7; },
    s => { s.theory[1].view.viewId = 'case-1'; }, s => { s.theory[1].openDetails = [13]; },
    s => { s.theory[1].view = { viewId: 'neutral', zoom: 1, maxStep: 0 }; },
    s => { s.theory[0].openDetails = [9]; },
    s => { s.theory[1].openDetails = [-1]; }, s => { s.theory[1].openDetails = [1.5]; }
  ];
  for (const mutate of mutations) { const bad = guidedState(); mutate(bad); assert.throws(() => contracts.normalize(C.TRAINER_ID, taskSpec, bad), { code: 'LEARNING_STATE_INVALID' }); }
  const future = C.fresh(); future.mainView.viewId = 'step-1';
  assert.throws(() => C.normalize(taskSpec, future));
  const hiddenAssistance = C.fresh(); hiddenAssistance.openDetails = [1];
  assert.throws(() => C.normalize(taskSpec, hiddenAssistance));
  const malicious = JSON.parse(JSON.stringify(C.fresh()).replace('"stepDrafts":{}', '"stepDrafts":{"__proto__":{}}'));
  assert.throws(() => contracts.normalize(C.TRAINER_ID, taskSpec, malicious), { code: 'LEARNING_STATE_INVALID' });
});

test('saved reasoning survives reopen and history while manual checks cannot award correctness or rewards', t => {
  const f = fixture(t);
  let attempt = f.attempt();
  const initial = clone(attempt);
  attempt = f.save(attempt, guidedState());
  assert.equal(attempt.outcome, 'started'); assert.equal(attempt.assistance.hints, true); assert.equal(attempt.submission, null);
  assert.equal(getRewards(f.store, f.student).totalPoints, 0);
  f.reopen();
  const restored = f.store.getAttempt(f.student, attempt.id);
  assert.deepEqual(restored.state, attempt.state); assert.equal(restored.outcome, 'started');
  assert.deepEqual(f.store.getAttempt(f.teacher, attempt.id).state, attempt.state);
  assert.throws(() => f.store.getAttempt(f.peer, attempt.id), { code: 'LEARNING_NOT_FOUND' });
  assert.throws(() => f.store.history(f.peer, attempt.id), { code: 'LEARNING_NOT_FOUND' });
  const history = f.store.history(f.student, attempt.id);
  assert.deepEqual(history.initialAttempt.state, initial.state);
  assert.equal(history.events.length, 1); assert.equal(history.events[0].type, 'state');
  assert.deepEqual(history.events[0].payload.state, attempt.state);
  for (const details of [{}, { scope: 'final', answer: attempt.state.draft }, { correct: true, complete: true }]) {
    assert.throws(() => f.store.action(f.student, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'check',
      payload: { state: attempt.state, details } }), { code: 'LEARNING_CHECK_INVALID' });
  }
  assert.deepEqual(f.store.getAttempt(f.student, attempt.id), restored, 'Rejected checks do not persist even an otherwise valid state.');
  assert.equal(f.store.history(f.student, attempt.id).events.length, 1);
  assert.equal(getRewards(f.store, f.student).totalPoints, 0);
  const progress = f.store.progress(f.student).find(row => row.contentId === C.CONTENT_ID);
  assert.equal(progress.completed, false); assert.equal(progress.latest.outcome, 'started');
  assert.equal(progress.latest.id, attempt.id);
});

test('public normalization rejects non-JSON properties before executing accessors', () => {
  const { taskSpec } = C.create(C.CONTENT_ID, 3);
  let reads = 0;
  for (const change of [
    value => Object.defineProperty(value, 'draft', { get() { reads++; return ''; }, enumerable: true }),
    value => Object.defineProperty(value, 'hidden', { value: true, enumerable: false }),
    value => { value[Symbol('hidden')] = true; },
    value => { value.theory = new Array(1); },
    value => { value.openDetails.extra = 1; },
    value => { value.theory = [value]; },
    value => { Object.setPrototypeOf(value, { unexpected: true }); },
    value => { value.draft = '<img src=x onerror=alert(1)>'; }
  ]) {
    const state = C.fresh(); change(state);
    assert.throws(() => C.normalizeState(state));
    assert.throws(() => contracts.normalize(C.TRAINER_ID, taskSpec, state), { code: 'LEARNING_STATE_INVALID' });
  }
  const maliciousSpec = clone(taskSpec);
  Object.defineProperty(maliciousSpec, 'seed', { get() { reads++; return 3; }, enumerable: true });
  assert.throws(() => C.validateTaskSpec(maliciousSpec));
  assert.equal(reads, 0);
  const mathematicalText = C.fresh(); mathematicalText.draft = 'MN < NP, 1 < 2 и 3 > 2';
  assert.deepEqual(C.normalizeState(mathematicalText), mathematicalText);
});

test('existing ownership, controller and stale-version guards protect manual draft mutation', t => {
  const f = fixture(t); let attempt = f.attempt();
  assert.throws(() => f.save(attempt, guidedState(), f.peer), { code: 'LEARNING_NOT_FOUND' });
  assert.throws(() => f.save(attempt, guidedState(), f.teacher), { code: 'LEARNING_CONTROL_REQUIRED' });
  const original = clone(attempt);
  attempt = f.store.action(f.teacher, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'control', payload: { controller: 'teacher' } }).attempt;
  assert.throws(() => f.save(attempt, guidedState()), { code: 'LEARNING_CONTROL_REQUIRED' });
  assert.throws(() => f.save(original, guidedState(), f.teacher), { code: 'LEARNING_STATE_CONFLICT' });
  attempt = f.save(attempt, guidedState(), f.teacher);
  assert.equal(attempt.assistance.teacher, true); assert.equal(attempt.outcome, 'started');
  attempt = f.store.action(f.teacher, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'control', payload: { controller: 'student' } }).attempt;
  const invalid = clone(attempt.state); invalid.checked = true;
  assert.throws(() => f.save(attempt, invalid), { code: 'LEARNING_STATE_INVALID' });
  assert.deepEqual(f.store.getAttempt(f.student, attempt.id), attempt);
});

test('creating the manual homework draft preserves existing attempts and publication boundaries', t => {
  const f = fixture(t);
  const old = f.store.createAttempt(f.student, { opId: op(), trainerId: 'ege-path', contentId: 'triangle', fresh: true }).attempt;
  const result = f.store.createAssignments(f.teacher, { opId: op(), learnerIds: [f.student.id], title: 'Fixture geometry assignment',
    trainerId: C.TRAINER_ID, contentId: C.CONTENT_ID });
  assert.equal(result.assignments.length, 1);
  const assignment = result.assignments[0];
  assert.equal(assignment.status, 'draft');
  assert.equal(f.store.listAssignments(f.student).length, 0);
  assert.equal(f.store.listAssignments(f.teacher).length, 1);
  assert.throws(() => f.store.getAttempt(f.student, assignment.attemptId), { code: 'LEARNING_NOT_FOUND' });
  assert.equal(f.store.getAttempt(f.teacher, assignment.attemptId).outcome, 'started');
  assert.deepEqual(f.store.getAttempt(f.student, old.id), old);
});

test('all three earlier contracts still create and normalize their own independent state', () => {
  for (const trainerId of ['ege-path', 'oge-basics', 'motion-grade6']) {
    const item = catalog.items.find(row => row.trainerId === trainerId);
    const { taskSpec, state } = contracts.create(trainerId, item.contentId, 19);
    assert.deepEqual(contracts.normalize(trainerId, taskSpec, state), state);
    assert.equal(contracts.describe(taskSpec).contentId, item.contentId);
  }
});

test('the server contract has no dependency on the public textbook bundle inside Docker', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atanasyan-container-contract-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'learning-contracts.js');
  fs.copyFileSync(path.resolve(__dirname, '../../geometry-course/textbook/learning-contracts.js'), target);
  const isolated = require(target);
  assert.deepEqual(isolated.create(C.CONTENT_ID, 5), C.create(C.CONTENT_ID, 5));
  const dockerfile = fs.readFileSync(path.resolve(__dirname, '../../Dockerfile'), 'utf8');
  assert(dockerfile.includes('COPY geometry-course/textbook/learning-contracts.js /app/geometry-course/textbook/learning-contracts.js'));
});
