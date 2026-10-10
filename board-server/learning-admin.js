#!/usr/bin/env node
'use strict';

// Operator-only account maintenance. Run against the private database while
// its single server process is stopped. Nothing is sent to an external service.
const fs = require('node:fs');
const path = require('node:path');
const { LearningStore } = require('./learning-store');
const { backupLearning, restoreLearning } = require('./learning-backup');
const { requireValue } = require('./learning-auth');

function writeTeacherRecovery(store, login, destination, publicOrigin) {
  let origin;
  try { origin = new URL(publicOrigin); } catch (_) {}
  requireValue(origin?.protocol === 'https:' && origin.origin === publicOrigin, 'LEARNING_ORIGIN_INVALID');
  requireValue(typeof destination === 'string' && path.isAbsolute(destination), 'LEARNING_RECOVERY_TARGET_INVALID');
  const directory = path.dirname(destination);
  requireValue(fs.lstatSync(directory).isDirectory() && !fs.lstatSync(directory).isSymbolicLink(), 'LEARNING_RECOVERY_TARGET_INVALID');
  // Exclusive creation never overwrites an existing file or follows a symlink.
  const fd = fs.openSync(destination, 'wx', 0o600);
  let committed = false;
  try {
    const result = store.issueTeacherRecovery(login, issued => {
      const link = new URL('/learning/teacher-recovery.html', origin);
      link.hash = 'token=' + issued.invitationToken;
      fs.writeFileSync(fd, link.href + '\n', 'utf8'); fs.fsyncSync(fd);
      const directoryFd = fs.openSync(directory, 'r');
      try { fs.fsyncSync(directoryFd); } finally { fs.closeSync(directoryFd); }
    });
    committed = true;
    return { created: true, expiresAt: result.expiresAt };
  } finally {
    fs.closeSync(fd);
    if (!committed) fs.unlinkSync(destination);
  }
}

function applyBootstrapEnvironment(store, environment = process.env) {
  if (!store.available) return { applied: false, reason: store.reason, status: 'unavailable' };
  const teacher = store.row("SELECT id,password_hash FROM accounts WHERE role='teacher'");
  // A leftover deployment secret can never reset an activated account.
  if (teacher?.password_hash) return { applied: false, reason: null, status: 'active' };
  const secret = environment.LEARNING_BOOTSTRAP_TOKEN;
  const login = environment.LEARNING_TEACHER_LOGIN;
  const name = environment.LEARNING_TEACHER_NAME;
  if (![secret, login, name].some(value => value !== undefined && value !== '')) return { applied: false, reason: null, status: 'not-configured' };
  try {
    if (typeof secret !== 'string' || !/^[A-Za-z0-9_-]{43,100}$/.test(secret) || new Set(secret).size < 16
      || typeof login !== 'string' || !login || typeof name !== 'string' || !name) throw new Error('Invalid bootstrap configuration');
    if (teacher) {
      const status = store.syncPendingBootstrap(login, secret);
      return { applied: status === 'pending-refreshed', reason: null, status };
    }
    store.bootstrap({ login, name, invitationToken: secret });
    return { applied: true, reason: null, status: 'created' };
  } catch (error) {
    // A failed repair leaves the existing invitation/account available.
    // The status is operator-only and never includes supplied values.
    if (teacher) return { applied: false, reason: null, status:
      error.code === 'LEARNING_BOOTSTRAP_LOGIN_MISMATCH' ? 'pending-login-mismatch' :
      error.code === 'LEARNING_BOOTSTRAP_TOKEN_REVOKED' ? 'pending-token-revoked' : 'pending-configuration-invalid' };
    // Disable this new capability only. Never print or echo a supplied value.
    store.available = false; store.reason = 'LEARNING_BOOTSTRAP_CONFIG_INVALID';
    return { applied: false, reason: store.reason, status: 'invalid-configuration' };
  }
}

function main(args = process.argv.slice(2)) {
  if (!((['bootstrap', 'teacher-recovery'].includes(args[0]) && args.length === 3) || (['renew-bootstrap', 'backup', 'restore'].includes(args[0]) && args.length === 2)) || !process.env.LEARNING_DB_PATH) {
    process.stderr.write('Usage: LEARNING_DB_PATH=/private/learning.sqlite node learning-admin.js bootstrap LOGIN "Teacher name"\nOr: node learning-admin.js renew-bootstrap LOGIN (only an unactivated teacher)\nOr: LEARNING_PUBLIC_ORIGIN=https://your-cabinet.example node learning-admin.js teacher-recovery LOGIN /private/new-recovery-link.txt\nOr: node learning-admin.js backup /private/new-backup.sqlite\nOr: LEARNING_DB_PATH=/private/new-database.sqlite node learning-admin.js restore /private/backup.sqlite\n');
    return 2;
  }
  let store;
  try {
    if (args[0] === 'restore') {
      const result = restoreLearning(args[1], process.env.LEARNING_DB_PATH);
      process.stdout.write(JSON.stringify({ restoredBytes: result.bytes }) + '\n'); return 0;
    }
    store = new LearningStore();
    if (args[0] === 'teacher-recovery') {
      const result = writeTeacherRecovery(store, args[1], args[2], process.env.LEARNING_PUBLIC_ORIGIN);
      process.stdout.write(JSON.stringify(result) + '\n'); return 0;
    }
    if (args[0] === 'backup') {
      const result = backupLearning(store, args[1]);
      process.stdout.write(JSON.stringify({ backupBytes: result.bytes }) + '\n'); return 0;
    }
    const result = args[0] === 'bootstrap' ? store.bootstrap({ login: args[1], name: args[2] }) : store.renewBootstrap(args[1]);
    process.stdout.write(JSON.stringify({ login: result.account.login, invitationToken: result.invitationToken, expiresAt: result.expiresAt }) + '\n');
    return 0;
  } catch (error) {
    process.stderr.write(`${error.code && /^LEARNING_[A-Z_]+$/.test(error.code) ? error.code : 'LEARNING_ADMIN_FAILED'}\n`);
    return 1;
  } finally { store?.close(); }
}
if (require.main === module) process.exitCode = main();
module.exports = { main, applyBootstrapEnvironment, writeTeacherRecovery };
