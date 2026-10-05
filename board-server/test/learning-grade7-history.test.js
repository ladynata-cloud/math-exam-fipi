'use strict';
// Real generated tasks and durable SQLite; all learner identities are synthetic.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { LearningStore } = require('../learning-store');
const contracts = require('../learning-contracts');
const CONTENT = 'grade7-g-angle-bisector';
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const op = () => crypto.randomUUID();
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-g7-history-'));
  const filePath = path.join(dir, 'learning.sqlite');
  let seeds = [], fallback = 0, calls = 0;
  const controlled = { ...contracts, create: (trainerId, contentId) => {
    calls++; return contracts.create(trainerId, contentId, seeds.length ? seeds.shift() : fallback);
  } };
  let store = new LearningStore({ filePath, contracts: controlled, clock: () => 1800000000000 });
  assert.equal(store.available, true);
  const teacher = store.activate(store.bootstrap({ login: 'history_teacher', name: 'Fixture teacher' }).invitationToken, HASH).account;
  const student = store.activate(store.createStudent(teacher, { login: 'history_student', name: 'Fixture student' }).invitationToken, HASH).account;
  const peer = store.activate(store.createStudent(teacher, { login: 'history_peer', name: 'Fixture peer' }).invitationToken, HASH).account;
  t.after(() => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  const f = { teacher, student, peer, get store() { return store; }, get calls() { return calls; },
    sequence(values, last = 0) { seeds = [...values]; fallback = last; calls = 0; },
    reopen() { store.close(); store = new LearningStore({ filePath, contracts: controlled }); assert(store.available); },
    attempt(seed, source = null, learner = student, contentId = CONTENT) {
      return store.newAttempt(learner.id, teacher.id, 'ege-path', contracts.create('ege-path', contentId, seed), source?.id || null);
    },
    check(attempt, { learner = student, answer = contracts.expectedText(attempt.taskSpec) } = {}) {
      const state = structuredClone(attempt.state), correct = contracts.evaluate('ege-path', attempt.taskSpec, { scope: 'final', answer }).correct;
      state.work.done = correct; state.work.attempted = true; state.work.draft = answer;
      return store.action(learner, attempt.id, { opId: op(), expectedVersion: attempt.version, type: 'check',
        payload: { state, details: { scope: 'final', answer } } }).attempt;
    }
  };
  return f;
}

test('grade7 A → B → A compares the complete question history, not only the source', t => {
  const f = fixture(t);
  const a = f.check(f.attempt(0)), b = f.check(f.attempt(1, a));
  const again = f.attempt(45, b);
  assert.equal(contracts.questionIdentity(a.taskSpec), contracts.questionIdentity(again.taskSpec));
  assert.notEqual(contracts.questionIdentity(a.taskSpec), contracts.questionIdentity(b.taskSpec));
  assert.equal(a.outcome, 'independent'); assert.equal(b.outcome, 'repeated');
  assert.equal(f.check(again).outcome, 'practiced');
  assert.equal(f.check(f.attempt(90)).outcome, 'practiced', 'Omitting source cannot restore an unseen label.');
  assert.equal(f.check(f.attempt(2)).outcome, 'independent', 'A genuinely new question without a source stays independent.');
  assert.equal(f.check(f.attempt(3, b)).outcome, 'repeated', 'A genuinely new follow-up stays repeated.');
});

test('started questions count as exposure and grading rechecks attempts created afterwards', t => {
  const f = fixture(t), first = f.attempt(0), later = f.attempt(45);
  assert.equal(f.store.getAttempt(f.student, later.id).outcome, 'started');
  assert.equal(f.check(first).outcome, 'practiced', 'Completion rechecks the live history, even for an older open attempt.');
  assert.equal(f.check(later).outcome, 'practiced');
});

test('exposure is isolated by learner, and attempts remain private to their owner', t => {
  const f = fixture(t), peerAttempt = f.check(f.attempt(0, null, f.peer), { learner: f.peer });
  assert.equal(peerAttempt.outcome, 'independent');
  assert.throws(() => f.store.getAttempt(f.student, peerAttempt.id), { code: 'LEARNING_NOT_FOUND' });
  assert.equal(f.check(f.attempt(45)).outcome, 'independent');
  assert.equal(f.store.getAttempt(f.peer, peerAttempt.id).outcome, 'independent');
});

test('wrong answers and hint/teacher assistance keep their existing precedence', t => {
  const f = fixture(t); f.check(f.attempt(0));
  let wrong = f.attempt(45);
  wrong = f.check(wrong, { answer: '999999' }); assert.equal(wrong.outcome, 'started');
  assert.equal(f.check(wrong).outcome, 'practiced');
  let hinted = f.attempt(90);
  hinted = f.store.action(f.student, hinted.id, { opId: op(), expectedVersion: hinted.version, type: 'hint', payload: {} }).attempt;
  assert.equal(f.check(hinted).outcome, 'hinted');
  let together = f.attempt(135);
  together = f.store.action(f.teacher, together.id, { opId: op(), expectedVersion: together.version, type: 'control', payload: { controller: 'teacher' } }).attempt;
  assert.equal(f.check(together, { learner: f.teacher }).outcome, 'together');
});

test('fresh grade7 generation skips older familiar questions and its operation is idempotent', t => {
  const f = fixture(t), a = f.check(f.attempt(0)), b = f.check(f.attempt(1, a));
  f.sequence([45, 46, 2]);
  const body = { opId: op(), trainerId: 'ege-path', contentId: CONTENT, fresh: true, sourceAttemptId: b.id };
  const created = f.store.createAttempt(f.student, body);
  assert.equal(f.calls, 3); assert.equal(created.attempt.taskSpec.seed, 2);
  assert.equal(f.check(created.attempt).outcome, 'repeated');
  assert.equal(f.store.createAttempt(f.student, body).duplicate, true); assert.equal(f.calls, 3);
});

test('a finite bank may repeat after bounded retries, but cannot claim new independent success', t => {
  const f = fixture(t), a = f.attempt(0); f.sequence([], 45);
  const created = f.store.createAttempt(f.student, { opId: op(), trainerId: 'ege-path', contentId: CONTENT, fresh: true, sourceAttemptId: a.id }).attempt;
  assert.equal(f.calls, 16, 'One initial generation plus at most fifteen retries.');
  assert.equal(f.check(created).outcome, 'practiced');
});

test('reset archives progress but retains question exposure after durable reopen', t => {
  const f = fixture(t), prior = f.check(f.attempt(0));
  f.store.run('UPDATE attempts SET archived_at=?,version=version+1,trainer_version=trainer_version+1 WHERE id=?', 1800000000001, prior.id);
  assert.equal(f.store.listAttempts(f.student).length, 0);
  f.reopen(); assert.equal(f.check(f.attempt(45)).outcome, 'practiced');
  assert.equal(f.store.getAttempt(f.teacher, prior.id).outcome, 'independent', 'Historical results are not rewritten.');
});

test('unpublished homework drafts do not count as learner exposure', t => {
  const f = fixture(t); f.sequence([0]);
  const assignment = f.store.createAssignments(f.teacher, { opId: op(), learnerIds: [f.student.id], title: 'Fixture homework', trainerId: 'ege-path', contentId: CONTENT }).assignments[0];
  assert.equal(assignment.status, 'draft');
  assert.throws(() => f.store.getAttempt(f.student, assignment.attemptId), { code: 'LEARNING_NOT_FOUND' });
  assert.equal(f.check(f.attempt(45)).outcome, 'independent');
});

test('published and archived homework retain exposure, with archived publication uncertainty treated conservatively', t => {
  const f = fixture(t); f.sequence([0]);
  const assignment = f.store.createAssignments(f.teacher, { opId: op(), learnerIds: [f.student.id], title: 'Fixture homework', trainerId: 'ege-path', contentId: CONTENT }).assignments[0];
  f.store.run("UPDATE assignments SET status='published' WHERE id=?", assignment.id);
  assert.equal(f.check(f.attempt(45)).outcome, 'practiced');
  f.sequence([1]);
  const archived = f.store.createAssignments(f.teacher, { opId: op(), learnerIds: [f.student.id], title: 'Archived fixture', trainerId: 'ege-path', contentId: CONTENT }).assignments[0];
  f.store.run("UPDATE assignments SET status='published' WHERE id=?", archived.id);
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', 1800000000001, archived.attemptId);
  f.store.run("UPDATE assignments SET status='archived' WHERE id=?", archived.id);
  assert.equal(f.check(f.attempt(46)).outcome, 'practiced', 'Archived homework is not made unseen by resetting its result.');
  f.sequence([0]);
  const uncertain = f.store.createAssignments(f.teacher, { opId: op(), learnerIds: [f.peer.id], title: 'Archived draft fixture', trainerId: 'ege-path', contentId: CONTENT }).assignments[0];
  f.store.run('UPDATE attempts SET archived_at=? WHERE id=?', 1800000000001, uncertain.attemptId);
  f.store.run("UPDATE assignments SET status='archived' WHERE id=?", uncertain.id);
  assert.equal(f.check(f.attempt(45, null, f.peer), { learner: f.peer }).outcome, 'practiced', 'Lost prior publication status cannot certify that a question is unseen.');
});

test('the bounded history scan is conservative on overflow and only counts the same content family', t => {
  const f = fixture(t);
  f.store.transaction(() => { for (let i = 0; i < 501; i++) f.attempt(0, null, f.student, 'grade7-b-mixed-borrow'); });
  const novel = f.check(f.attempt(0)); assert.equal(novel.outcome, 'independent', 'Other families do not consume the family history budget.');
  f.store.transaction(() => { for (let i = 0; i < 500; i++) f.attempt(0); });
  assert.notEqual(contracts.questionIdentity(contracts.create('ege-path', CONTENT, 1).taskSpec), contracts.questionIdentity(novel.taskSpec));
  assert.equal(f.check(f.attempt(1)).outcome, 'practiced', 'A truncated scan never awards false independent evidence.');
});

test('legacy task outcomes retain their previous source-only behavior', t => {
  const f = fixture(t), id = 'equations-linear';
  const a = f.check(f.attempt(0, null, f.student, id)), b = f.check(f.attempt(1, a, f.student, id));
  assert.equal(a.outcome, 'independent'); assert.equal(b.outcome, 'repeated');
  assert.equal(f.check(f.attempt(240, b, f.student, id)).outcome, 'repeated');
  assert.equal(f.check(f.attempt(480, null, f.student, id)).outcome, 'independent');
  assert.equal(f.check(f.attempt(720, a, f.student, id)).outcome, 'practiced');
});
