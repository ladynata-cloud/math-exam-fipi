'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { LearningStore } = require('../learning-store');
const { writeTeacherRecovery } = require('../learning-admin');
const { tokenHash } = require('../learning-auth');

// Synthetic offline database only. No real account or hosting configuration.
const HASH = `scrypt1:${'a'.repeat(32)}:${'b'.repeat(64)}`;
const ORIGIN = 'https://cabinet.example.test';
function fixture(t, active = true) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-teacher-admin-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath });
  const pending = store.bootstrap({ login: 'fixture_teacher', name: 'Synthetic teacher' });
  const teacher = active ? store.activate(pending.invitationToken, HASH) : pending;
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { store, teacher, directory, filePath, destination: path.join(directory, 'new-private-link.txt') };
}
function credentials(store) {
  return ['accounts', 'sessions', 'recovery_codes'].map(table => store.rows(`SELECT * FROM ${table} ORDER BY 1`));
}

test('owner recovery writes only a private single-use URL without changing current credentials', t => {
  const f = fixture(t), before = credentials(f.store), now = Date.now();
  const result = writeTeacherRecovery(f.store, 'fixture_teacher', f.destination, ORIGIN);
  assert.deepEqual(Object.keys(result), ['created', 'expiresAt']);
  assert.equal(result.created, true);
  assert(result.expiresAt >= now + 3600000 && result.expiresAt <= Date.now() + 3600000);
  assert.equal(fs.statSync(f.destination).mode & 0o777, 0o600);
  const url = new URL(fs.readFileSync(f.destination, 'utf8').trim());
  assert.equal(url.origin, ORIGIN);
  assert.equal(url.pathname, '/learning/teacher-recovery.html');
  assert.equal(url.search, '');
  const token = new URLSearchParams(url.hash.slice(1)).get('token');
  assert(/^[A-Za-z0-9_-]{43}$/.test(token));
  const row = f.store.row('SELECT * FROM invitations WHERE hash=?', tokenHash(token));
  assert.equal(row.purpose, 'teacher-recovery');
  assert.equal(row.account_id, f.teacher.account.id);
  assert.equal(row.expires_at, result.expiresAt);
  assert.equal(JSON.stringify(f.store.rows('SELECT * FROM invitations')).includes(token), false);
  assert.deepEqual(credentials(f.store), before);
  assert.throws(() => f.store.invitation(token), { code: 'LEARNING_ACCESS_INVALID' });
  assert.throws(() => f.store.activate(token, HASH), { code: 'LEARNING_ACCESS_INVALID' });
});

test('file collision and symlink targets never overwrite a file or replace a prior owner proof', t => {
  const f = fixture(t), previous = f.store.issueTeacherRecovery('fixture_teacher');
  fs.writeFileSync(f.destination, 'existing private content', { mode: 0o600 });
  assert.throws(() => writeTeacherRecovery(f.store, 'fixture_teacher', f.destination, ORIGIN), { code: 'EEXIST' });
  assert.equal(fs.readFileSync(f.destination, 'utf8'), 'existing private content');
  const link = path.join(f.directory, 'symlink.txt'); fs.symlinkSync(f.destination, link);
  assert.throws(() => writeTeacherRecovery(f.store, 'fixture_teacher', link, ORIGIN), { code: 'EEXIST' });
  assert.equal(f.store.teacherRecovery(previous.invitationToken).account.id, f.teacher.account.id);
});

test('invalid origin or target does not create or replace an owner proof', t => {
  const f = fixture(t), previous = f.store.issueTeacherRecovery('fixture_teacher');
  for (const origin of [undefined, 'https://cabinet.example.test/path', 'https://person:secret@cabinet.example.test', 'http://cabinet.example.test']) {
    assert.throws(() => writeTeacherRecovery(f.store, 'fixture_teacher', f.destination, origin), { code: 'LEARNING_ORIGIN_INVALID' });
  }
  assert.throws(() => writeTeacherRecovery(f.store, 'fixture_teacher', 'relative-link.txt', ORIGIN), { code: 'LEARNING_RECOVERY_TARGET_INVALID' });
  assert.equal(fs.existsSync(f.destination), false);
  assert.equal(f.store.teacherRecovery(previous.invitationToken).account.id, f.teacher.account.id);
});

test('failed private-file publication rolls back issuance and removes its incomplete file', t => {
  const f = fixture(t), previous = f.store.issueTeacherRecovery('fixture_teacher'), before = credentials(f.store);
  t.mock.method(fs, 'writeFileSync', () => { throw Error('synthetic write failure'); });
  assert.throws(() => writeTeacherRecovery(f.store, 'fixture_teacher', f.destination, ORIGIN), /synthetic write failure/);
  t.mock.restoreAll();
  assert.equal(fs.existsSync(f.destination), false);
  assert.equal(f.store.teacherRecovery(previous.invitationToken).account.id, f.teacher.account.id);
  assert.deepEqual(credentials(f.store), before);
});

test('only an existing activated teacher can receive an operator recovery link', t => {
  const f = fixture(t);
  f.store.createStudent(f.teacher.account, { login: 'fixture_pupil', name: 'Synthetic pupil' }, HASH);
  const previous = f.store.issueTeacherRecovery('fixture_teacher');
  for (const login of ['fixture_pupil', 'unknown_teacher']) {
    assert.throws(() => writeTeacherRecovery(f.store, login, f.destination, ORIGIN), { code: 'LEARNING_TEACHER_RECOVERY_UNAVAILABLE' });
    assert.equal(fs.existsSync(f.destination), false);
    assert.equal(f.store.teacherRecovery(previous.invitationToken).account.id, f.teacher.account.id);
  }
  const pending = fixture(t, false);
  assert.throws(() => writeTeacherRecovery(pending.store, 'fixture_teacher', pending.destination, ORIGIN), { code: 'LEARNING_TEACHER_RECOVERY_UNAVAILABLE' });
  assert.equal(fs.existsSync(pending.destination), false);
  assert.equal(pending.store.account(pending.teacher.account.id).password_hash, null);
});

test('private CLI prints only status and expiry, never the recovery URL or token', t => {
  const f = fixture(t); f.store.close();
  const args = [path.resolve(__dirname, '../learning-admin.js'), 'teacher-recovery', 'fixture_teacher', f.destination];
  const environment = { LEARNING_DB_PATH: f.filePath, LEARNING_PUBLIC_ORIGIN: ORIGIN };
  const run = spawnSync(process.execPath, args, { env: environment, encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.equal(run.stderr, '');
  const result = JSON.parse(run.stdout);
  assert.deepEqual(Object.keys(result), ['created', 'expiresAt']);
  const url = new URL(fs.readFileSync(f.destination, 'utf8').trim());
  const secret = new URLSearchParams(url.hash.slice(1)).get('token');
  for (const value of [secret, url.href, 'fixture_teacher']) assert.equal((run.stdout + run.stderr).includes(value), false);
  const reopened = new LearningStore({ filePath: f.filePath });
  try {
    assert.equal(reopened.teacherRecovery(secret).account.id, f.teacher.account.id);
    assert.equal(reopened.session(f.teacher.sessionToken).id, f.teacher.account.id);
  } finally { reopened.close(); }
  const collision = spawnSync(process.execPath, args, { env: environment, encoding: 'utf8' });
  assert.equal(collision.status, 1);
  assert.equal(collision.stdout, '');
  assert.equal(collision.stderr.trim(), 'LEARNING_ADMIN_FAILED');
  assert.equal(collision.stderr.includes(secret), false);
});
