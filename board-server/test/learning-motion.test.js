'use strict';
// Authored bank, answer proofs and durable account state; synthetic learners only.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const C = require('../../trainers/motion-grade6/learning-contracts');
const core = require('../../trainers/motion-grade6/course-core');
const catalog = require('../../learning/catalog');
const contracts = require('../learning-contracts');
const { LearningStore } = require('../learning-store');
const { getRewards } = require('../learning-rewards');
const clone = value => structuredClone(value);
const op = () => crypto.randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);

function finalState(spec, before, index, answer = String(spec.items[index].answer)) {
  const state = clone(before);
  state.view = 'train'; state.taskIndex = index; state.help = false; state.exampleStep = 0; state.modelTime = 0; state.modelOpen = false;
  state.records[index].draft = C.correct(answer, spec.items[index].answer) ? '' : answer;
  if (C.correct(answer, spec.items[index].answer)) state.records[index].finalAnswer = answer;
  return { state, details: { scope: 'final', taskIndex: index, answer } };
}
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-motion-'));
  const filePath = path.join(dir, 'learning.sqlite');
  let store = new LearningStore({ filePath, contracts });
  assert.equal(store.available, true);
  const teacher = store.activate(store.bootstrap({ name: 'Fixture teacher', login: 'motion_teacher' }).invitationToken, HASH).account;
  const student = store.activate(store.createStudent(teacher, { name: 'Fixture learner', login: 'motion_student' }).invitationToken, HASH).account;
  const peer = store.activate(store.createStudent(teacher, { name: 'Fixture peer', login: 'motion_peer' }).invitationToken, HASH).account;
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  return { teacher, student, peer, get store() { return store; },
    reopen() { store.close(); store = new LearningStore({ filePath, contracts }); assert.equal(store.available, true); },
    attempt(contentId = 'distance', learner = student) {
      return store.createAttempt(learner, { opId: op(), trainerId: 'motion-grade6', contentId, fresh: true }).attempt;
    },
    check(attempt, index, answer = String(attempt.taskSpec.items[index].answer), learner = student) {
      return store.action(learner, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'check',
        payload: finalState(attempt.taskSpec, attempt.state, index, answer) });
    },
    finish(attempt, learner = student) {
      for (let index = 0; index < 12; index++) attempt = this.check(attempt, index, undefined, learner).attempt;
      return attempt;
    }
  };
}

test('catalog exposes exactly the original twelve lessons and 144 authored exercises', () => {
  const items = catalog.items.filter(item => item.trainerId === 'motion-grade6');
  assert.equal(items.length, 12);
  assert.deepEqual(items.map(item => item.contentId), core.ids);
  assert.equal(catalog.items.filter(item => item.trainerId === 'ege-path' && !item.geometryRebuild).length, 169);
  for (const [lessonIndex, item] of items.entries()) {
    const generated = contracts.create(item.trainerId, item.contentId, 17), spec = generated.taskSpec;
    assert.equal(spec.lessonIndex, lessonIndex); assert.equal(spec.items.length, 12);
    assert.equal(spec.title, core.lessons[lessonIndex][0]); assert.equal(item.title, spec.title);
    assert.equal(item.taskCount, 12); assert.equal(item.position, null);
    assert.deepEqual(spec.items, Array.from({ length: 12 }, (_, index) => core.task(lessonIndex, index)));
    assert.deepEqual(C.normalize(spec, generated.state), generated.state);
    assert.equal(C.status(spec, generated.state).completed, 0);
    assert.equal(C.assistance(spec, generated.state), false);
    assert.equal(contracts.questionIdentity(spec), contracts.questionIdentity(contracts.create(item.trainerId, item.contentId, 9999).taskSpec), 'A changed seed cannot invent a new question bank.');
    assert(fs.existsSync(path.resolve(__dirname, '../..', item.url.split('#')[0].slice(1))));
  }
  assert.throws(() => contracts.create('motion-grade6', 'unlisted', 1), { code: 'LEARNING_TRAINER_UNKNOWN' });
});

test('all 144 final answers are checked and a lesson completes only after all twelve', () => {
  for (const contentId of core.ids) {
    let { taskSpec: spec, state } = C.create(contentId, 42);
    for (let index = 0; index < 12; index++) {
      const answer = String(spec.items[index].answer).replace('.', ',');
      const payload = finalState(spec, state, index, answer);
      state = C.normalize(spec, payload.state);
      const evaluation = contracts.evaluate('motion-grade6', spec, payload.details, state);
      assert.equal(evaluation.correct, true); assert.equal(evaluation.complete, index === 11);
      assert.equal(evaluation.assisted, false); assert.equal(C.status(spec, state).completed, index + 1);
    }
    assert.deepEqual(C.status(spec, state), { completed: 12, total: 12, independent: 12, assisted: 0 });
  }
});

test('guided prefixes are validated for every exercise, including fraction input and a cleared draft', () => {
  for (const contentId of core.ids) {
    let { taskSpec: spec, state } = C.create(contentId, 7);
    state.help = true;
    for (let index = 0; index < 12; index++) {
      state.taskIndex = index;
      const record = state.records[index];
      for (let step = 0; step < spec.items[index].steps.length; step++) {
        const answer = String(spec.items[index].steps[step].a * 4) + '/4';
        const details = { scope: 'step', taskIndex: index, step, answer, answers: [...record.answers] };
        record.answers.push(answer); record.draft = ''; record.assisted = true;
        const evaluation = C.evaluate(spec, details, state);
        assert.equal(evaluation.correct, true); assert.equal(evaluation.assisted, true);
        assert.equal(evaluation.complete, index === 11 && step === spec.items[index].steps.length - 1);
      }
    }
    assert.deepEqual(C.status(spec, C.normalize(spec, state)), { completed: 12, total: 12, independent: 0, assisted: 12 });
  }
});

test('state validation rejects fabricated completion, wrong prefixes and another lesson', () => {
  const { taskSpec: spec, state } = C.create('round-trip', 17);
  const mutations = [
    value => { value.completed = true; }, value => { value.contentId = 'distance'; },
    value => { value.seed++; }, value => { value.records[0].finalAnswer = '999'; },
    value => { value.records[0].answers = ['999']; }, value => { value.records[0].solved = true; },
    value => { value.records.length = 11; }, value => { value.taskIndex = 12; },
    value => { value.exampleStep = 99; }, value => { value.modelTime = Infinity; },
    value => { value.records[0].draft = 'x'.repeat(201); }, value => { value.help = 'false'; }
  ];
  for (const mutate of mutations) { const bad = clone(state); mutate(bad); assert.throws(() => C.normalize(spec, bad)); }
  const badSpec = clone(spec); badSpec.items[0].answer++;
  assert.throws(() => C.normalize(badSpec, state));
  assert.throws(() => contracts.normalize('motion-grade6', spec, { ...state, version: 2 }), { code: 'LEARNING_STATE_INVALID' });
});

test('grading binds the checked answer and task to saved state rather than client flags', () => {
  const { taskSpec: spec, state } = C.create('meeting', 4);
  let payload = finalState(spec, state, 0);
  assert.equal(C.evaluate(spec, payload.details, payload.state).correct, true);
  assert.throws(() => C.evaluate(spec, payload.details, state), /Сохранённый итоговый/);
  assert.throws(() => C.evaluate(spec, { ...payload.details, taskIndex: 1 }, payload.state), /другая задача/);
  assert.throws(() => C.evaluate(spec, { ...payload.details, complete: true }, payload.state), /поля/);
  payload = finalState(spec, state, 0, '999');
  assert.deepEqual(C.evaluate(spec, payload.details, payload.state), { correct: false, complete: false, assisted: false });
  payload.state.records[0].draft = 'different';
  assert.throws(() => C.evaluate(spec, payload.details, payload.state), /Сохранённый ответ/);
  const guided = clone(state); guided.help = true;
  const answer = String(spec.items[0].steps[1].a);
  guided.records[0].answers = [String(spec.items[0].steps[0].a), answer];
  assert.throws(() => C.evaluate(spec, { scope: 'step', taskIndex: 0, step: 1, answer, answers: [] }, guided), /предыдущие шаги/);
});

test('partial progress and drafts survive SQLite reopen and remain private to the learner', t => {
  const f = fixture(t);
  let attempt = f.attempt();
  const first = f.check(attempt, 0); attempt = first.attempt;
  assert.equal(first.evaluation.complete, false); assert.equal(attempt.outcome, 'started');
  const state = clone(attempt.state); state.taskIndex = 1; state.records[1].draft = '3/';
  attempt = f.store.action(f.student, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'state', payload: { state } }).attempt;
  f.reopen();
  const restored = f.store.getAttempt(f.student, attempt.id);
  assert.deepEqual(restored.state, attempt.state); assert.equal(C.status(restored.taskSpec, restored.state).completed, 1);
  assert.throws(() => f.store.getAttempt(f.peer, attempt.id), { code: 'LEARNING_NOT_FOUND' });
  assert.equal(f.store.getAttempt(f.teacher, attempt.id).state.records[1].draft, '3/');
  for (let index = 1; index < 12; index++) attempt = f.check(attempt, index).attempt;
  assert.equal(attempt.outcome, 'independent');
  assert.equal(f.store.progress(f.student)[0].completed, true);
});

test('repeating this exact bank is familiar practice; hints and teacher work retain precedence', t => {
  const f = fixture(t);
  const first = f.finish(f.attempt()); assert.equal(first.outcome, 'independent');
  assert.equal(getRewards(f.store, f.student).totalPoints, 15);
  f.reopen();
  assert.equal(f.finish(f.attempt()).outcome, 'practiced');
  assert.equal(getRewards(f.store, f.student).totalPoints, 15, 'A repeat of the same twelve tasks cannot earn points again.');
  assert.equal(f.finish(f.attempt('distance', f.peer), f.peer).outcome, 'independent');
  let hinted = f.attempt('speed');
  hinted = f.store.action(f.student, hinted.id, { opId: op(), expectedVersion: hinted.version, type: 'hint', payload: {} }).attempt;
  assert.equal(f.finish(hinted).outcome, 'hinted');
  let together = f.attempt('time');
  together = f.store.action(f.teacher, together.id, { opId: op(), expectedVersion: together.version, type: 'control', payload: { controller: 'teacher' } }).attempt;
  assert.equal(f.finish(together, f.teacher).outcome, 'together');
});
