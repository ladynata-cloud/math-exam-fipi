'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LearningStore } = require('../learning-store');
const { createLearningRunsRouter } = require('../learning-runs');
const realContracts = require('../learning-contracts');
const HASH = `scrypt1:${'a'.repeat(32)}:${'b'.repeat(64)}`;
const fakeContracts = {
  list: () => Array.from({ length: 21 }, (_, i) => ({ trainerId: 'ege-path', contentId: `p${i + 1}`, position: i + 1, title: `Task ${i + 1}` })),
  examPool: position => [{ trainerId: 'ege-path', contentId: `p${position}`, position, title: `Task ${position}` }],
  create: (trainerId, contentId) => ({ taskSpec: { trainerId, contentId, id: contentId, seed: Math.random(), contentVersion: 1,
    task: { id: contentId, pos: Number(contentId.slice(1)), q: `Answer ${contentId.slice(1)}`, answer: Number(contentId.slice(1)), steps: [{ q: 'Solve', a: Number(contentId.slice(1)), why: 'Reason' }] } },
  state: { work: { stage: 3, draft: '', done: false, attempted: false, help: false }, view: {} } }),
  normalize: (_trainer, _task, state) => structuredClone(state),
  evaluate: (_trainer, task, details) => ({ correct: String(task.task.answer) === details.answer, complete: String(task.task.answer) === details.answer }),
  questionIdentity: task => task.task.q
};
function fixture(t, contracts = fakeContracts) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-runs-test-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts });
  const teacher = store.activate(store.bootstrap({ login: 'teacher', name: 'Teacher' }).invitationToken, HASH).account;
  const learner = store.activate(store.createStudent(teacher, { login: 'learner', name: 'Learner' }).invitationToken, HASH).account;
  const peer = store.activate(store.createStudent(teacher, { login: 'peer', name: 'Peer' }).invitationToken, HASH).account;
  const api = createLearningRunsRouter({ store, handler: f => f, authMiddleware: (_q, _r, next) => next(), mutationMiddleware: (_q, _r, next) => next() });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { store, teacher, learner, peer, api, filePath };
}

test('21 questions retain drafts without revealing answers, and cannot bypass run isolation through attempts', t => {
  const { store, teacher, learner, peer, api } = fixture(t);
  let run = api.create(learner, { opId: 'create_exam_operation', kind: 'exam' }).run;
  assert.deepEqual(run.questions.map(q => q.position), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.equal(run.result, null);
  for (const question of run.questions) {
    assert.ok(!('answer' in question.taskSpec.task)); assert.ok(!('steps' in question.taskSpec.task));
    assert.throws(() => store.getAttempt(learner, question.attemptId), { code: 'LEARNING_RUN_ACTIVE' });
    assert.throws(() => store.action(teacher, question.attemptId, { opId: 'teacher_exam_bypass', expectedVersion: 0, type: 'control', payload: { controller: 'teacher' } }), { code: 'LEARNING_RUN_ACTIVE' });
  }
  assert.equal(store.listAttempts(learner).length, 0);
  assert.throws(() => api.get(peer, run.id), { code: 'LEARNING_NOT_FOUND' });
  assert.throws(() => api.action(teacher, run.id, { opId: 'teacher_run_bypass', expectedVersion: 0, type: 'finish', payload: {} }), { code: 'LEARNING_FORBIDDEN' });
  run = api.action(learner, run.id, { opId: 'answer_exam_operation', expectedVersion: 0, type: 'answer', payload: { index: 0, answer: '1' } }).run;
  assert.equal(run.questions[0].answer, '1'); assert.equal(run.result, null); assert.equal(api.get(teacher, run.id).questions[0].answer, '1');
  assert.throws(() => api.action(learner, run.id, { opId: 'stale_exam_operation', expectedVersion: 0, type: 'answer', payload: { index: 0, answer: '99' } }), { code: 'LEARNING_STATE_CONFLICT' });
  assert.equal(api.get(learner, run.id).questions[0].answer, '1');
});

test('finishing grades atomically once, leaves skipped answers ungraded and rejects changed idempotency payloads', t => {
  const { store, learner, api } = fixture(t);
  let run = api.create(learner, { opId: 'create_exam_operation', kind: 'exam' }).run;
  for (let index = 0; index < 20; index++) run = api.action(learner, run.id, { opId: `answer_exam_operation_${index}`, expectedVersion: run.version, type: 'answer', payload: { index, answer: String(index + 1) } }).run;
  const finish = { opId: 'finish_exam_operation', expectedVersion: run.version, type: 'finish', payload: {} };
  run = api.action(learner, run.id, finish).run;
  assert.equal(run.result.correct, 20); assert.equal(run.result.answered, 20); assert.equal(run.result.total, 21);
  assert.equal(store.row('SELECT COUNT(*) AS n FROM events').n, 21);
  assert.equal(api.action(learner, run.id, finish).duplicate, true);
  assert.equal(store.row('SELECT COUNT(*) AS n FROM events').n, 21);
  assert.throws(() => api.action(learner, run.id, { ...finish, expectedVersion: finish.expectedVersion + 1 }), { code: 'LEARNING_OP_CONFLICT' });
  assert.equal(store.getAttempt(learner, run.questions[0].attemptId).outcome, 'independent');
  const skipped = store.getAttempt(learner, run.questions[20].attemptId);
  assert.equal(skipped.version, 1); assert.equal(skipped.outcome, 'started'); assert.equal(skipped.state.work.attempted, false);
  assert.equal(JSON.parse(store.row('SELECT payload_json FROM events WHERE attempt_id=?', skipped.id).payload_json).skipped, true);
  assert.equal(run.result.byPosition[0].expectedText, '1'); assert.equal(run.result.byPosition[0].steps.length, 1);
});

test('reusing a known concrete question is marked practiced despite a different seed', t => {
  const { learner, api } = fixture(t);
  let first = api.create(learner, { opId: 'first_exam_operation', kind: 'exam' }).run;
  first = api.action(learner, first.id, { opId: 'finish_first_operation', expectedVersion: 0, type: 'finish', payload: {} }).run;
  let next = api.create(learner, { opId: 'second_exam_operation', kind: 'exam' }).run;
  assert.ok(next.questions.every(question => question.previouslySeen));
  next = api.action(learner, next.id, { opId: 'answer_second_operation', expectedVersion: 0, type: 'answer', payload: { index: 0, answer: '1' } }).run;
  next = api.action(learner, next.id, { opId: 'finish_second_operation', expectedVersion: 1, type: 'finish', payload: {} }).run;
  assert.equal(next.result.byPosition[0].outcome, 'practiced');
});

test('archived attempts block grading; starting again cancels the interrupted run without changing history', t => {
  const { store, learner, api } = fixture(t);
  const first = api.create(learner, { opId: 'first_exam_operation', kind: 'exam' }).run;
  store.run('UPDATE attempts SET archived_at=?,version=version+1 WHERE id=?', Date.now(), first.questions[0].attemptId);
  assert.throws(() => api.action(learner, first.id, { opId: 'finish_archived_operation', expectedVersion: 0, type: 'finish', payload: {} }), { code: 'LEARNING_ATTEMPT_ARCHIVED' });
  assert.equal(store.row('SELECT COUNT(*) AS n FROM events').n, 0);
  const next = api.create(learner, { opId: 'replacement_exam_operation', kind: 'exam' }).run;
  assert.notEqual(next.id, first.id);
  assert.equal(api.get(learner, first.id).result.cancelled, true);
});

test('real task families build all 21 positions and preserve authoritative question data', t => {
  const { store, learner, api } = fixture(t, realContracts);
  let run = api.create(learner, { opId: 'actual_exam_operation', kind: 'diagnostic' }).run;
  assert.equal(run.questions.length, 21);
  const task = JSON.parse(store.row('SELECT task_json FROM attempts WHERE id=?', run.questions[0].attemptId).task_json);
  const answer = String(task.task.answer);
  run = api.action(learner, run.id, { opId: 'actual_answer_operation', expectedVersion: 0, type: 'answer', payload: { index: 0, answer } }).run;
  run = api.action(learner, run.id, { opId: 'actual_finish_operation', expectedVersion: 1, type: 'finish', payload: {} }).run;
  assert.equal(run.result.byPosition[0].correct, true); assert.equal(run.result.answered, 1);
});

test('recorded teaching in another trainer during a run prevents an independent verification label', t => {
  const { store, learner, api } = fixture(t);
  const practice = store.createAttempt(learner, { opId: 'practice_before_exam', trainerId: 'ege-path', contentId: 'p1' }).attempt;
  let run = api.create(learner, { opId: 'assisted_exam_operation', kind: 'exam' }).run;
  store.action(learner, practice.id, { opId: 'hint_during_exam', expectedVersion: 0, type: 'hint', payload: {} });
  run = api.action(learner, run.id, { opId: 'assisted_exam_answer', expectedVersion: 0, type: 'answer', payload: { index: 0, answer: '1' } }).run;
  run = api.action(learner, run.id, { opId: 'assisted_exam_finish', expectedVersion: 1, type: 'finish', payload: {} }).run;
  assert.equal(run.result.assisted, true); assert.equal(run.result.byPosition[0].outcome, 'hinted');
  assert.equal(store.getAttempt(learner, run.questions[0].attemptId).assistance.hints, true);
});

test('restart retains open-exam attempt protection before optional routers are mounted', t => {
  const { store, learner, api, filePath } = fixture(t);
  const run = api.create(learner, { opId: 'persistent_exam_operation', kind: 'exam' }).run;
  store.close();
  const reopened = new LearningStore({ filePath, contracts: fakeContracts });
  try { assert.throws(() => reopened.getAttempt(learner, run.questions[0].attemptId), { code: 'LEARNING_RUN_ACTIVE' }); }
  finally { reopened.close(); }
});

test('exam pool preserves canonical eligible families and finite short answers over 240 seeds', () => {
  const fixed = { 2: ['practice-units-match'], 7: ['practice-graph-match'], 8: ['practice-logic-order', 'practice-logic-all'],
    14: ['practice-fraction-expression', 'practice-decimals', 'practice-decimal-division'],
    18: ['practice-number-match', 'practice-inequality-match'], 20: ['practice-meeting', 'practice-river', 'practice-work', 'practice-average-speed'] };
  for (let position = 1; position <= 21; position++) {
    const pool = realContracts.examPool(position);
    assert.ok(pool.length > 0, `position ${position}`);
    if (fixed[position]) assert.deepEqual(pool.map(item => item.contentId).sort(), [...fixed[position]].sort());
    for (const item of pool) for (let seed = 0; seed < 240; seed++) {
      const task = realContracts.create(item.trainerId, item.contentId, seed).taskSpec;
      if (task.task.rule || task.task.answerKind === 'solutions') continue;
      const answer = realContracts.expectedText(task);
      assert.match(answer, /^-?\d+(?:,\d+)?$/, `${item.contentId} seed ${seed}: ${answer}`);
      assert.equal(realContracts.evaluate(item.trainerId, task, { scope: 'final', answer }).correct, true);
    }
  }
});
