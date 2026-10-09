'use strict';

// Disposable accounts and local SQLite only; never use deployed learner data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { LearningStore } = require('../learning-store');
const contracts = require('../learning-contracts');
const division = require('../../trainers/oge-basics/multiplication-division/division-lab-core');
const { getRewards } = require('../learning-rewards');
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const CONTENT = 'grade7-g-angle-bisector';

function fixture(t, source = contracts) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-rewards-'));
  const filePath = path.join(directory, 'learning.sqlite');
  let now = 1800000000000;
  const open = () => new LearningStore({ filePath, contracts: source, clock: () => ++now });
  let store = open(); assert.equal(store.available, true);
  const teacher = store.activate(store.bootstrap({ name: 'Fixture teacher', login: 'rewards_teacher' }).invitationToken, HASH).account;
  const student = store.activate(store.createStudent(teacher, { name: 'Fixture student', login: 'rewards_student' }).invitationToken, HASH).account;
  const peer = store.activate(store.createStudent(teacher, { name: 'Fixture peer', login: 'rewards_peer' }).invitationToken, HASH).account;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const f = {
    teacher, student, peer, get store() { return store; },
    reopen() { store.close(); store = open(); assert.equal(store.available, true); },
    attempt(seed = 0, { contentId = CONTENT, learner = student, previous = null } = {}) {
      return store.newAttempt(learner.id, teacher.id, 'ege-path', source.create('ege-path', contentId, seed), previous?.id || null);
    },
    action(attempt, type, payload, actor = student, opId = randomUUID()) {
      return store.action(actor, attempt.id, { opId, expectedVersion: attempt.version, type, payload });
    },
    check(attempt, { actor = student, answer = source.expectedText(attempt.taskSpec), opId } = {}) {
      const state = structuredClone(attempt.state);
      state.work.draft = answer; state.work.attempted = true;
      state.work.done = source.evaluate('ege-path', attempt.taskSpec, { scope: 'final', answer }).correct;
      return f.action(attempt, 'check', { state, details: { scope: 'final', answer } }, actor, opId);
    },
    rewards(learner = student) { return getRewards(store, learner); }
  };
  return f;
}

test('empty personal ledger is safe, read-only and contains no task or account data', t => {
  const f = fixture(t), before = f.store.row('SELECT COUNT(*) n FROM operations').n;
  assert.deepEqual(f.rewards(), {
    version: 1, totalPoints: 0, uniqueCompleted: 0, independentConditions: 0,
    completedThemes: 0, level: 1, levelSize: 100, nextLevelAt: 100,
    pointsWithinLevel: 0, badges: [], trustedBasis: 'server-graded-distinct-conditions', lifetime: true
  });
  assert.equal(f.store.row('SELECT COUNT(*) n FROM operations').n, before);
});

test('opening, saving client completion, hints and wrong answers do not mint points', t => {
  const f = fixture(t); let a = f.attempt();
  const state = structuredClone(a.state);
  state.work.draft = contracts.expectedText(a.taskSpec);
  state.work.done = true; state.work.attempted = true;
  a = f.action(a, 'state', { state }).attempt;
  assert.equal(a.outcome, 'started'); assert.equal(f.rewards().totalPoints, 0);
  a = f.action(a, 'reference', { id: 'allowed-formula-sheet' }).attempt;
  a = f.action(a, 'hint', {}).attempt;
  a = f.check(a, { answer: '99999999' }).attempt;
  assert.equal(a.outcome, 'started'); assert.equal(f.rewards().totalPoints, 0);
  a = f.check(a).attempt;
  assert.equal(a.outcome, 'hinted'); assert.equal(f.rewards().totalPoints, 10);
});

test('duplicate submissions and changed seeds for the same question earn only once', t => {
  const f = fixture(t), a = f.attempt(), opId = randomUUID();
  const first = f.check(a, { opId });
  assert.equal(first.attempt.outcome, 'independent');
  assert.equal(f.check(a, { opId }).duplicate, true);
  const same = f.attempt(45, { previous: first.attempt });
  assert.equal(f.store.taskFingerprint(same.taskSpec), f.store.taskFingerprint(a.taskSpec));
  assert.equal(f.check(same).attempt.outcome, 'practiced');
  f.check(first.attempt);
  assert.equal(f.rewards().totalPoints, 15);
  assert.equal(f.rewards().uniqueCompleted, 1);
  assert.equal(f.rewards().independentConditions, 1);
  f.check(f.attempt(1, { previous: first.attempt }));
  assert.equal(f.rewards().totalPoints, 30);
});

test('help earns base credit; known practice does not upgrade it; a new independent analogue does', t => {
  const f = fixture(t); let helped = f.attempt();
  helped = f.action(helped, 'hint', {}).attempt;
  helped = f.check(helped).attempt;
  assert.equal(f.rewards().totalPoints, 10);
  const familiar = f.check(f.attempt(45, { previous: helped })).attempt;
  assert.equal(familiar.outcome, 'practiced'); assert.equal(f.rewards().totalPoints, 10);
  const analogue = f.check(f.attempt(1, { previous: helped })).attempt;
  assert.equal(analogue.outcome, 'repeated');
  assert.equal(f.rewards().totalPoints, 25);
  assert.equal(f.rewards().independentConditions, 1);
  f.check(analogue); assert.equal(f.rewards().totalPoints, 25);
});

test('legacy fingerprint ignores seed/id and a trusted independent upgrade earns only five extra points', t => {
  const legacy = {
    create(trainerId, contentId, seed) {
      return { taskSpec: { trainerId, contentId, seed, task: { id: 'variant-' + seed, seed, q: '2 + 3', answer: 5 } },
        state: { work: { draft: '', attempted: false, done: false, help: false } } };
    },
    normalize: (_trainerId, _spec, state) => structuredClone(state),
    evaluate: (_trainerId, _spec, details) => ({ correct: details.answer === '5', complete: details.answer === '5' }),
    expectedText: () => '5'
  };
  const f = fixture(t, legacy); let a = f.attempt(1);
  a = f.action(a, 'hint', {}).attempt;
  f.check(a); assert.equal(f.rewards().totalPoints, 10);
  const b = f.check(f.attempt(2)).attempt;
  assert.equal(b.outcome, 'independent', 'Legacy grading outcome remains authoritative.');
  assert.equal(f.rewards().totalPoints, 15);
  f.check(f.attempt(3));
  assert.equal(f.rewards().totalPoints, 15);
  assert.equal(f.rewards().uniqueCompleted, 1);
});

test('academic reset and durable restart preserve lifetime credit without reminting it', t => {
  const f = fixture(t), a = f.check(f.attempt()).attempt;
  const earned = f.rewards();
  f.store.run('UPDATE attempts SET archived_at=?,version=version+1,trainer_version=trainer_version+1 WHERE id=?', 1800000000500, a.id);
  assert.equal(f.store.listAttempts(f.student).length, 0);
  f.reopen(); assert.deepEqual(f.rewards(), earned);
  const familiar = f.check(f.attempt(45)).attempt;
  assert.equal(familiar.outcome, 'practiced'); assert.deepEqual(f.rewards(), earned);
});

test('unpublished teacher work is excluded and archived published homework keeps credit', t => {
  const f = fixture(t);
  const assignment = f.store.createAssignments(f.teacher, {
    opId: randomUUID(), learnerIds: [f.student.id], title: 'Fixture homework', trainerId: 'ege-path', contentId: CONTENT
  }).assignments[0];
  let a = f.store.getAttempt(f.teacher, assignment.attemptId);
  a = f.action(a, 'control', { controller: 'teacher' }, f.teacher).attempt;
  a = f.check(a, { actor: f.teacher }).attempt;
  assert.equal(a.outcome, 'together'); assert.equal(f.rewards().totalPoints, 0);
  f.store.operation(f.teacher, { opId: randomUUID(), operation: 'publish-homework', assignmentId: assignment.id }, () => {
    f.store.run("UPDATE assignments SET status='published' WHERE id=?", assignment.id);
    return { assignment: { id: assignment.id, status: 'published' } };
  });
  assert.equal(f.rewards().totalPoints, 10);
  f.store.run("UPDATE assignments SET status='archived' WHERE id=?", assignment.id);
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', 1800000000500, a.id);
  f.reopen(); assert.equal(f.rewards().totalPoints, 10);
  assert.equal(f.rewards().independentConditions, 0);
});

test('archiving an unpublished teacher-solved draft cannot create lifetime points', t => {
  const f = fixture(t);
  const assignment = f.store.createAssignments(f.teacher, {
    opId: randomUUID(), learnerIds: [f.student.id], title: 'Unpublished fixture', trainerId: 'ege-path', contentId: CONTENT
  }).assignments[0];
  let a = f.store.getAttempt(f.teacher, assignment.attemptId);
  a = f.action(a, 'control', { controller: 'teacher' }, f.teacher).attempt;
  f.check(a, { actor: f.teacher }); assert.equal(f.rewards().totalPoints, 0);
  f.store.run("UPDATE assignments SET status='archived' WHERE id=?", assignment.id);
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', 1800000000500, a.id);
  f.reopen(); assert.equal(f.rewards().totalPoints, 0);
});

test('levels and meaningful badges derive from distinct verified conditions and themes', t => {
  const f = fixture(t);
  for (let seed = 0; seed < 10; seed++) f.check(f.attempt(seed));
  const others = contracts.list().filter(item => item.trainerId === 'ege-path'
    && item.contentId.startsWith('grade7-g-') && item.contentId !== CONTENT).slice(0, 4);
  assert.equal(others.length, 4);
  for (const item of others) f.check(f.attempt(0, { contentId: item.contentId }));
  const rewards = f.rewards();
  assert.equal(rewards.uniqueCompleted, 14); assert.equal(rewards.independentConditions, 14);
  assert.equal(rewards.completedThemes, 5); assert.equal(rewards.totalPoints, 210);
  assert.equal(rewards.level, 3); assert.equal(rewards.nextLevelAt, 300); assert.equal(rewards.pointsWithinLevel, 10);
  assert.deepEqual(rewards.badges.map(badge => badge.id), ['first-completion', 'five-themes', 'ten-independent']);
});

test('ledger is private to the learner and their teacher, with no peer task leakage', t => {
  const f = fixture(t); f.check(f.attempt());
  assert.equal(f.rewards(f.peer).totalPoints, 0);
  assert.deepEqual(getRewards(f.store, f.teacher, f.student.id), f.rewards());
  assert.throws(() => getRewards(f.store, f.peer, f.student.id), { code: 'LEARNING_NOT_FOUND' });
  assert.throws(() => getRewards(f.store, null, f.student.id), { code: 'LEARNING_FORBIDDEN' });
  assert.throws(() => getRewards(f.store, { role: 'teacher', id: f.peer.id }, f.student.id), { code: 'LEARNING_NOT_FOUND' });
  const serialized = JSON.stringify(f.rewards());
  for (const secret of [f.student.id, f.teacher.id, CONTENT, f.student.name, 'taskSpec', 'answer', 'seed']) assert.equal(serialized.includes(secret), false, secret);
});

function completeCheckpoint(f, generated) {
  let attempt = f.store.newAttempt(f.student.id, f.teacher.id, 'oge-basics', generated);
  const spec = attempt.taskSpec, questions = spec.steps.length ? spec.steps : spec.items;
  for (let step = 0; step < questions.length; step++) {
    const value = questions[step].answer;
    const answer = typeof value === 'object' ? value.n + '/' + value.d : String(value);
    const state = structuredClone(attempt.state), answers = state.answers.slice();
    state.answers.push(answer); state.step = state.answers.length;
    state.completed = state.step === questions.length; state.answer = '';
    state.feedback = { kind: 'correct', scope: spec.steps.length ? 'step' : 'practice', step, answer };
    attempt = f.store.action(f.student, attempt.id, {
      opId: randomUUID(), expectedVersion: attempt.version, type: 'check',
      payload: { state, details: { scope: state.feedback.scope, step, answer, answers } }
    }).attempt;
  }
  assert.equal(attempt.outcome, 'independent');
  return attempt;
}

test('percentage checkpoints sharing the first question earn for both complete distinct sets', t => {
  const f = fixture(t), id = 'percentages/percent-final-checkpoint';
  const first = contracts.create('oge-basics', id, 4), second = contracts.create('oge-basics', id, 7);
  assert.equal(f.store.taskFingerprint(first.taskSpec), f.store.taskFingerprint(second.taskSpec));
  assert.equal(first.taskSpec.items.length, 12);
  assert.equal(first.taskSpec.items.filter((item, i) => item.prompt !== second.taskSpec.items[i].prompt).length, 11);
  completeCheckpoint(f, first); completeCheckpoint(f, second);
  assert.equal(f.rewards().uniqueCompleted, 2); assert.equal(f.rewards().totalPoints, 30);
  const sameSet = structuredClone(first); sameSet.taskSpec.seed = 999;
  sameSet.taskSpec.items.reverse();
  for (const item of sameSet.taskSpec.items) {
    item.seed = 999;
    if (item.kind !== 'choice') continue;
    const correct = item.options.find(option => option.id === item.answer).html;
    item.options.reverse();
    item.options.forEach((option, index) => { option.id = 'reordered-' + index; });
    item.answer = item.options.find(option => option.html === correct).id;
  }
  sameSet.taskSpec.task = structuredClone(sameSet.taskSpec.items[0]);
  completeCheckpoint(f, sameSet);
  assert.equal(f.rewards().uniqueCompleted, 2, 'Seed, question order and option IDs/order do not create another condition.');
  assert.equal(f.rewards().totalPoints, 30);
  f.reopen(); assert.equal(f.rewards().totalPoints, 30);
});

test('mixed division checkpoints identify every operand pair, ignoring seeds and set order', t => {
  const f = fixture(t), id = 'multiplication-division/long-division-mixed-checkpoint';
  const first = contracts.create('oge-basics', id, 5), second = contracts.create('oge-basics', id, 162);
  assert.equal(f.store.taskFingerprint(first.taskSpec), f.store.taskFingerprint(second.taskSpec));
  assert.deepEqual(first.taskSpec.divisionTasks[0].task, second.taskSpec.divisionTasks[0].task);
  assert.notDeepEqual(first.taskSpec.divisionTasks.slice(1), second.taskSpec.divisionTasks.slice(1));
  completeCheckpoint(f, first); completeCheckpoint(f, second);
  assert.equal(f.rewards().uniqueCompleted, 2); assert.equal(f.rewards().totalPoints, 30);
  const sameSet = structuredClone(first); sameSet.taskSpec.seed = 777;
  sameSet.taskSpec.divisionTasks.reverse();
  sameSet.taskSpec.steps = [];
  sameSet.taskSpec.divisionTasks.forEach((item, taskIndex) => {
    item.task.seed = 777; item.startIndex = sameSet.taskSpec.steps.length;
    sameSet.taskSpec.steps.push(...division.plan(item.task).actions.map(action => ({ ...action, taskIndex })));
    item.endIndex = sameSet.taskSpec.steps.length;
  });
  sameSet.taskSpec.divisionTask = sameSet.taskSpec.divisionTasks[0].task;
  sameSet.taskSpec.task.prompt = sameSet.taskSpec.divisionTasks[0].prompt;
  completeCheckpoint(f, sameSet);
  assert.equal(f.rewards().uniqueCompleted, 2); assert.equal(f.rewards().totalPoints, 30);
});
