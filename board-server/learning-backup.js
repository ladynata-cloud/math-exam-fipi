'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { requireValue } = require('./learning-auth');

function privateTarget(destination) {
  requireValue(typeof destination === 'string' && path.isAbsolute(destination) && !fs.existsSync(destination), 'LEARNING_BACKUP_TARGET_INVALID');
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  requireValue(!fs.lstatSync(path.dirname(destination)).isSymbolicLink(), 'LEARNING_BACKUP_TARGET_INVALID');
  const temporary = destination + '.tmp-' + crypto.randomBytes(8).toString('hex');
  const fd = fs.openSync(temporary, 'wx', 0o600); fs.closeSync(fd);
  return temporary;
}
function commitFile(temporary, destination) {
  const fd = fs.openSync(temporary, 'r');
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  // link is exclusive: an existing backup is never replaced, even in a race.
  fs.linkSync(temporary, destination); fs.unlinkSync(temporary);
  const directory = fs.openSync(path.dirname(destination), 'r');
  try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
}
function verifyDatabase(filePath) {
  let db;
  try {
    db = new DatabaseSync(filePath, { readOnly: true });
    const rows = db.prepare('PRAGMA integrity_check').all();
    requireValue(rows.length === 1 && rows[0].integrity_check === 'ok', 'LEARNING_BACKUP_INVALID');
    requireValue(db.prepare('PRAGMA user_version').get().user_version === 1, 'LEARNING_SCHEMA_UNSUPPORTED');
    requireValue(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'").get(), 'LEARNING_BACKUP_INVALID');
  } finally { db?.close(); }
}
function backupLearning(store, destination) {
  store.ready(); const temporary = privateTarget(destination);
  try {
    store.db.prepare('VACUUM INTO ?').run(temporary);
    verifyDatabase(temporary); commitFile(temporary, destination);
    return { bytes: fs.statSync(destination).size };
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function restoreLearning(source, destination) {
  requireValue(typeof source === 'string' && path.isAbsolute(source) && fs.lstatSync(source).isFile() && !fs.lstatSync(source).isSymbolicLink(), 'LEARNING_BACKUP_INVALID');
  const temporary = privateTarget(destination);
  try {
    fs.copyFileSync(source, temporary); fs.chmodSync(temporary, 0o600);
    verifyDatabase(temporary); commitFile(temporary, destination);
    return { bytes: fs.statSync(destination).size };
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}

module.exports = { backupLearning, restoreLearning, verifyDatabase };
