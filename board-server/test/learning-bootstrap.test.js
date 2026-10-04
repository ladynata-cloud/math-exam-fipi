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
  assert.deepEqual(configured, { applied: true, reason: null });
  assert.ok(!JSON.stringify(store.rows('SELECT * FROM invitations')).includes(secret));
  const activated = store.activate(secret, HASH);
  store.close();
  const reopened = new LearningStore({ filePath });
  try {
    assert.deepEqual(applyBootstrapEnvironment(reopened, environment), { applied: false, reason: null });
    assert.throws(() => reopened.activate(secret, HASH), { code: 'LEARNING_ACCESS_INVALID' });
    assert.equal(reopened.session(activated.sessionToken).id, activated.account.id);
    assert.deepEqual(applyBootstrapEnvironment(reopened, { LEARNING_BOOTSTRAP_TOKEN: 'weak' }), { applied: false, reason: null });
    assert.equal(reopened.available, true);
  } finally { reopened.close(); }
});
test('partial and weak bootstrap configuration fail closed without any teacher row or raw secret in the reason', t => {
  const { store } = fixture(t);
  const result = applyBootstrapEnvironment(store, { LEARNING_BOOTSTRAP_TOKEN: 'A'.repeat(43), LEARNING_TEACHER_LOGIN: 'teacher', LEARNING_TEACHER_NAME: 'Teacher' });
  assert.deepEqual(result, { applied: false, reason: 'LEARNING_BOOTSTRAP_CONFIG_INVALID' });
  assert.equal(store.available, false);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n, 0);
});
test('absent environment leaves operator CLI bootstrap available; missing one required variable disables only learning', t => {
  const { store } = fixture(t);
  assert.deepEqual(applyBootstrapEnvironment(store, {}), { applied: false, reason: null });
  assert.equal(store.available, true);
  assert.equal(applyBootstrapEnvironment(store, { LEARNING_BOOTSTRAP_TOKEN: token() }).reason, 'LEARNING_BOOTSTRAP_CONFIG_INVALID');
  assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n, 0);
});
