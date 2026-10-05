'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LearningStore } = require('../learning-store');
const { token } = require('../learning-auth');
const { applyBootstrapEnvironment } = require('../learning-admin');
const HASH = `scrypt1:${'a'.repeat(32)}:${'b'.repeat(64)}`;
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-bootstrap-test-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { store, filePath };
}
test('private environment bootstrap is one-time, stores hashes and never reactivates after restart', t => {
  const { store, filePath } = fixture(t);
  const secret = token();
  const environment = { LEARNING_BOOTSTRAP_TOKEN: secret, LEARNING_TEACHER_LOGIN: 'teacher', LEARNING_TEACHER_NAME: 'Teacher' };
  const configured = applyBootstrapEnvironment(store, environment);
  assert.deepEqual(configured, { applied: true, reason: null, status: 'created' });
  assert.ok(!JSON.stringify(store.rows('SELECT * FROM invitations')).includes(secret));
  const activated = store.activate(secret, HASH);
  store.close();
  const reopened = new LearningStore({ filePath });
  try {
    assert.deepEqual(applyBootstrapEnvironment(reopened, environment), { applied: false, reason: null, status: 'active' });
    assert.throws(() => reopened.activate(secret, HASH), { code: 'LEARNING_ACCESS_INVALID' });
    assert.equal(reopened.session(activated.sessionToken).id, activated.account.id);
    assert.deepEqual(applyBootstrapEnvironment(reopened, { LEARNING_BOOTSTRAP_TOKEN: 'weak' }), { applied: false, reason: null, status: 'active' });
    assert.equal(reopened.available, true);
  } finally { reopened.close(); }
});
test('partial and weak bootstrap configuration fail closed without any teacher row or raw secret in the reason', t => {
  const { store } = fixture(t);
  const result = applyBootstrapEnvironment(store, { LEARNING_BOOTSTRAP_TOKEN: 'A'.repeat(43), LEARNING_TEACHER_LOGIN: 'teacher', LEARNING_TEACHER_NAME: 'Teacher' });
  assert.deepEqual(result, { applied: false, reason: 'LEARNING_BOOTSTRAP_CONFIG_INVALID', status: 'invalid-configuration' });
  assert.equal(store.available, false);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n, 0);
});
test('absent environment leaves operator CLI bootstrap available; missing one required variable disables only learning', t => {
  const { store } = fixture(t);
  assert.deepEqual(applyBootstrapEnvironment(store, {}), { applied: false, reason: null, status: 'not-configured' });
  assert.equal(store.available, true);
  assert.equal(applyBootstrapEnvironment(store, { LEARNING_BOOTSTRAP_TOKEN: token() }).reason, 'LEARNING_BOOTSTRAP_CONFIG_INVALID');
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n, 0);
});

function environment(secret, login = 'teacher') {
  return { LEARNING_BOOTSTRAP_TOKEN: secret, LEARNING_TEACHER_LOGIN: login, LEARNING_TEACHER_NAME: 'Teacher' };
}
function snapshot(store) {
  return ['accounts', 'invitations', 'sessions', 'recovery_codes'].map(table => store.rows(`SELECT * FROM ${table}`));
}
test('hosting changes repair only the pending invitation and preserve identity across restart', t => {
  const { store, filePath } = fixture(t), oldSecret = token(), newSecret = token();
  applyBootstrapEnvironment(store, environment(oldSecret));
  const before = store.rows('SELECT * FROM accounts');
  const repaired = applyBootstrapEnvironment(store, environment(newSecret, ' TEACHER '));
  assert.deepEqual(repaired, { applied: true, reason: null, status: 'pending-refreshed' });
  assert.deepEqual(store.rows('SELECT * FROM accounts'), before);
  assert.throws(() => store.activate(oldSecret, HASH), { code: 'LEARNING_ACCESS_INVALID' });
  assert.equal(store.rows('SELECT * FROM invitations').length, 2, 'revoked history is retained');
  const after = snapshot(store);
  assert.equal(applyBootstrapEnvironment(store, environment(newSecret)).status, 'pending-unchanged');
  assert.deepEqual(snapshot(store), after, 'idempotent startup leaves expiry and all auth data unchanged');
  assert.equal(applyBootstrapEnvironment(store, environment(oldSecret)).status, 'pending-token-revoked');
  assert.deepEqual(snapshot(store), after, 'rolling back environment cannot revive a revoked link');
  store.close();
  const reopened = new LearningStore({ filePath });
  try {
    assert.equal(applyBootstrapEnvironment(reopened, environment(newSecret)).status, 'pending-unchanged');
    const activated = reopened.activate(newSecret, HASH);
    const active = snapshot(reopened);
    assert.equal(applyBootstrapEnvironment(reopened, environment(token())).status, 'active');
    assert.equal(applyBootstrapEnvironment(reopened, environment(oldSecret)).status, 'active');
    assert.deepEqual(snapshot(reopened), active);
    assert.equal(reopened.session(activated.sessionToken).id, before[0].id);
    assert.throws(() => reopened.activate(newSecret, HASH), { code: 'LEARNING_ACCESS_INVALID' });
  } finally { reopened.close(); }
});
test('expired current invitation is never extended by restart; a fresh configured token is required', t => {
  const { store } = fixture(t), secret = token();
  let now = Date.now(); store.clock = () => now;
  applyBootstrapEnvironment(store, environment(secret));
  const before = snapshot(store);
  now += 4 * 86400000;
  assert.equal(applyBootstrapEnvironment(store, environment(secret)).status, 'pending-expired');
  assert.deepEqual(snapshot(store), before);
  assert.throws(() => store.activate(secret, HASH), { code: 'LEARNING_ACCESS_INVALID' });
  const replacement = token();
  assert.equal(applyBootstrapEnvironment(store, environment(replacement)).status, 'pending-refreshed');
  assert.ok(store.activate(replacement, HASH).account.active);
});
test('invalid or mismatched pending repair is non-mutating and does not disable a valid invitation', t => {
  const { store } = fixture(t), secret = token();
  applyBootstrapEnvironment(store, environment(secret));
  const before = snapshot(store);
  for (const env of [environment(token(), 'different'), environment(token(), 'invalid@address'), environment('A'.repeat(48)), { LEARNING_BOOTSTRAP_TOKEN: token() }, {}]) {
    const result = applyBootstrapEnvironment(store, env);
    assert.equal(result.applied, false);
    assert.equal(result.reason, null);
    assert.deepEqual(snapshot(store), before);
    assert.equal(store.available, true);
    assert.ok(!JSON.stringify(result).includes(env.LEARNING_BOOTSTRAP_TOKEN || 'NEVER-PRINTED'));
  }
  assert.ok(store.activate(secret, HASH).account.active);
});
test('CLI renewal keeps the history needed to reject an old deployment token', t => {
  const { store } = fixture(t), secret = token();
  applyBootstrapEnvironment(store, environment(secret));
  const renewed = store.renewBootstrap('teacher');
  const before = snapshot(store);
  assert.equal(applyBootstrapEnvironment(store, environment(secret)).status, 'pending-token-revoked');
  assert.deepEqual(snapshot(store), before);
  assert.throws(() => store.activate(secret, HASH), { code: 'LEARNING_ACCESS_INVALID' });
  assert.ok(store.activate(renewed.invitationToken, HASH).account.active);
  assert.throws(() => store.renewBootstrap('teacher'), { code: 'LEARNING_BOOTSTRAP_NOT_PENDING' });
});
test('failed invitation replacement rolls back revocation and never publishes bootstrap state', t => {
  const { store } = fixture(t), secret = token(), replacement = token();
  applyBootstrapEnvironment(store, environment(secret));
  const before = snapshot(store), status = store.status();
  store.db.exec("CREATE TEMP TRIGGER reject_bootstrap BEFORE INSERT ON invitations BEGIN SELECT RAISE(ABORT, 'test failure'); END;");
  assert.equal(applyBootstrapEnvironment(store, environment(replacement)).status, 'pending-configuration-invalid');
  assert.deepEqual(snapshot(store), before);
  assert.deepEqual(store.status(), status);
  for (const value of [secret, replacement, 'pending-configuration-invalid', 'teacher']) assert.ok(!JSON.stringify(status).includes(value));
  store.db.exec('DROP TRIGGER reject_bootstrap');
  assert.ok(store.activate(secret, HASH).account.active);
});
