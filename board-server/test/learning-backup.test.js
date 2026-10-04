'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LearningStore } = require('../learning-store');
const contracts = require('../learning-contracts');
const { initializeTeaching } = require('../learning-teaching');
const { initializeRuns } = require('../learning-runs');
const { backupLearning, restoreLearning } = require('../learning-backup');
const { token } = require('../learning-auth');

test('a verified private backup restores identity, drafts, photo bytes and consumed credentials without overwriting a file', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-backup-'));
  const store = new LearningStore({ filePath: path.join(directory, 'source.sqlite'), contracts });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  initializeTeaching(store); initializeRuns(store);
  const invitation = store.bootstrap({ login: 'test.teacher', name: 'Test Teacher' });
  const encoded = 'scrypt1:' + '1'.repeat(32) + ':' + '2'.repeat(64);
  const teacher = store.activate(invitation.invitationToken, encoded);
  const invite = store.createStudent(teacher.account, { login: 'test.student', name: 'Test Student' });
  const learner = store.activate(invite.invitationToken, encoded);
  const attempt = store.createAttempt(learner.account, { opId: token(), trainerId: 'ege-path', contentId: 'fractions' }).attempt;
  const state = structuredClone(attempt.state); state.work.draft = '3/';
  const edited = store.action(learner.account, attempt.id, { opId: token(), expectedVersion: attempt.version, expectedTrainerVersion: attempt.trainerVersion, type: 'state', payload: { state } });
  const fileHash = 'test-photo-blob'; const photo = Buffer.from('synthetic-private-photo-fixture');
  store.run('INSERT INTO learning_photo_files VALUES(?,?,?)', fileHash, photo.length, photo);
  const backup = path.join(directory, 'snapshot.sqlite');
  assert.ok(backupLearning(store, backup).bytes > 0);
  assert.equal(fs.statSync(backup).mode & 0o777, 0o600);
  assert.throws(() => backupLearning(store, backup), /LEARNING_BACKUP_TARGET_INVALID/);
  const destination = path.join(directory, 'restored.sqlite');
  restoreLearning(backup, destination);
  assert.throws(() => restoreLearning(backup, destination), /LEARNING_BACKUP_TARGET_INVALID/);
  const restored = new LearningStore({ filePath: destination, contracts });
  try {
    assert.equal(restored.available, true);
    assert.equal(restored.session(learner.sessionToken).id, learner.account.id);
    assert.deepEqual(restored.getAttempt(learner.account, attempt.id), edited.attempt);
    assert.equal(restored.getAttempt(learner.account, attempt.id).state.work.draft, '3/');
    assert.throws(() => restored.invitation(invite.invitationToken), /LEARNING_ACCESS_INVALID/);
    assert.deepEqual(Buffer.from(restored.row('SELECT data FROM learning_photo_files WHERE hash=?', fileHash).data), photo);
    assert.equal(restored.history(teacher.account, attempt.id).events.length, 1);
    assert.equal(fs.statSync(destination).mode & 0o777, 0o600);
  } finally { restored.close(); }
});

test('guided completion requires every actual step and cannot be described as an independent result', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-guided-grade-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const teacher = store.activate(store.bootstrap({ login: 'test.teacher', name: 'Test Teacher' }).invitationToken, 'scrypt1:' + '1'.repeat(32) + ':' + '2'.repeat(64));
  const learner = store.activate(store.createStudent(teacher.account, { login: 'test.student', name: 'Test Student' }).invitationToken, 'scrypt1:' + '1'.repeat(32) + ':' + '2'.repeat(64));
  const attempt = store.createAttempt(learner.account, { opId: token(), trainerId: 'ege-path', contentId: 'equations-fractions' }).attempt;
  const answers = attempt.taskSpec.task.steps.map(step => String(step.a));
  const details = { scope: 'step', step: answers.length - 1, answer: answers.at(-1), answers: answers.slice(0, -1) };
  assert.throws(() => contracts.evaluate('ege-path', attempt.taskSpec, { ...details, answers: [] }), /LEARNING_STEP_PREFIX_INVALID/);
  const state = structuredClone(attempt.state);
  state.work.answers = answers; state.work.step = answers.length; state.work.done = true;
  const result = store.action(learner.account, attempt.id, { opId: token(), expectedVersion: 0, type: 'check', payload: { details, state } });
  assert.equal(result.evaluation.complete, true);
  assert.equal(result.attempt.outcome, 'hinted');
});
