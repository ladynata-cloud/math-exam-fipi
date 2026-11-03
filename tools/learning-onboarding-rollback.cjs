'use strict';

// Run from the repository root. Reads an exact earlier Git object; creates only
// a temporary synthetic SQLite database. Never contacts a deployed cabinet.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const base = process.argv[2] || '37718f1c0138ba031314b8f4716b73c9d963bc81';
assert.match(base, /^[a-f0-9]{40}$/);
const root = process.cwd();
const { LearningStore } = require(path.join(root, 'board-server/learning-store.js'));
const oldSource = execFileSync('git', ['show', base + ':board-server/learning-store.js'], { cwd: root, encoding: 'utf8' });
const filename = path.join(root, 'board-server/learning-store.rollback-check.js');
const legacyModule = new Module(filename, module);
legacyModule.filename = filename;
legacyModule.paths = Module._nodeModulePaths(path.dirname(filename));
legacyModule._compile(oldSource, filename);
const LegacyStore = legacyModule.exports.LearningStore;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'onboarding-rollback-'));
const filePath = path.join(directory, 'learning.sqlite');
const hash = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
let current, legacy, restored;
try {
  current = new LearningStore({ filePath });
  assert(current.available);
  const invitation = current.bootstrap({ name: 'Synthetic Teacher', login: 'rollback_teacher' });
  const teacher = current.activate(invitation.invitationToken, hash);
  const input = current.studentOnboardingInput({ opId: randomUUID(), name: 'Synthetic Pupil', login: 'rollback_pupil',
    profile: { course: 'school', goal: null, focus: 'Initial program', program: { grade: 6, courseIds: ['vilenkin6-textbook', 'foundations'] } } });
  const created = current.createStudentOnboarding(teacher.sessionToken, input, hash), id = created.student.id;
  const pupil = current.createSession(id), before = current.account(id), program = current.rows('SELECT * FROM learning_programs');
  const attempt = current.newAttempt(id, teacher.account.id, 'synthetic', {
    taskSpec: { contentId: 'retained' }, state: { answer: '5', notes: 'Retain saved work' }
  });
  current.close();

  legacy = new LegacyStore({ filePath });
  assert(legacy.available);
  assert.deepEqual(legacy.account(id), before);
  assert.equal(legacy.session(pupil.sessionToken).id, id);
  assert.deepEqual(legacy.getAttempt(pupil.account, attempt.id), attempt);
  assert.deepEqual(legacy.rows('SELECT * FROM learning_programs'), program);
  const changed = legacy.saveStudentProfile(teacher.account, id, { opId: randomUUID(), expectedVersion: 1,
    course: 'school', goal: null, focus: 'Legacy runtime note' });
  assert.equal(changed.profile.version, 2);
  assert(!Object.hasOwn(changed.profile, 'program'));
  const oldCreated = legacy.createStudent(teacher.account, { name: 'Legacy Synthetic Pupil', login: 'legacy_during_rollback' }, hash);
  assert(oldCreated.student.id);
  legacy.close();

  restored = new LearningStore({ filePath });
  assert(restored.available);
  assert.deepEqual(restored.studentProfile(teacher.account, id).program, created.profile.program);
  assert.equal(restored.studentProfile(teacher.account, id).version, 2);
  assert.equal(restored.studentProfile(teacher.account, id).focus, 'Legacy runtime note');
  assert.deepEqual(restored.account(id), before);
  assert.deepEqual(restored.getAttempt(pupil.account, attempt.id), attempt);
  assert.equal(restored.session(pupil.sessionToken).id, id);
  assert(restored.account(oldCreated.student.id));
  assert.equal(restored.row('PRAGMA user_version').user_version, 1);
  process.stdout.write(JSON.stringify({ gate: 'ONBOARDING_OLD_RUNTIME_ROLLBACK_OK', base, checks: [
    'exact old runtime reopens upgraded database', 'old account, session and saved attempt unchanged',
    'old runtime edits profile and creates pupil', 'additive program retained through rollback and reapply', 'schema version remains 1'
  ] }) + '\n');
} finally {
  current?.close(); legacy?.close(); restored?.close();
  fs.rmSync(directory, { recursive: true, force: true });
}
