'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { GroupLessonStore } = require('../group-lessons');
const { verify } = require('../../tools/verify-unified-board-restore.cjs');

function makeSnapshot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'board-restore-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const database = new DatabaseSync(path.join(root, 'learning.sqlite'));
  t.after(() => { try { database.close(); } catch {} });
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; PRAGMA user_version=1;
    CREATE TABLE accounts(id INTEGER PRIMARY KEY);
    CREATE TABLE attempts(id INTEGER PRIMARY KEY, learner INTEGER REFERENCES accounts);
    PRAGMA wal_checkpoint(TRUNCATE);
    INSERT INTO accounts VALUES (1);
    INSERT INTO attempts VALUES (1,1);`);
  fs.writeFileSync(path.join(root, 'progress.json'), JSON.stringify({ schemaVersion: 1, workspaces: [] }));
  const directory = path.join(root, 'group-lessons');
  const store = new GroupLessonStore({ directory });
  try {
    const created = store.create({ title: 'Контрольный урок', names: ['Тест'] });
    const { entry, auth } = store.authorize(created.id, created.teacherToken);
    store.action(entry, auth, { type: 'stroke', target: 'common', opId: crypto.randomUUID(),
      assignmentId: entry.lesson.common.assignmentId, payload: { id: crypto.randomUUID(), color: '#15803d',
        width: 3, points: [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.6 }] } });
  } finally { store.close(); }
  const archive = path.join(root, 'snapshot');
  fs.mkdirSync(archive);
  // No writer runs between copying these synthetic, closed-to-writes files.
  for (const n of fs.readdirSync(root).filter(n => n !== 'snapshot')) {
    fs.cpSync(path.join(root, n), path.join(archive, n), { recursive: true });
  }
  database.close();
  return archive;
}

function fingerprints(root) {
  const result = {};
  for (const entry of fs.readdirSync(root, { recursive: true })) {
    const file = path.join(root, entry);
    if (fs.statSync(file).isFile()) result[entry] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  return result;
}

test('opens a previous worksheet and history from a private copy, including WAL-only work', t => {
  const root = makeSnapshot(t);
  const before = fingerprints(root);
  assert.deepEqual(verify(root), { sqlite: true, walPresent: true, cabinetHasAttempts: true,
    previousLessonOpened: true, sheets: true, history: true, progress: true });
  assert.deepEqual(fingerprints(root), before);
});

test('a missing WAL with required rows cannot pass as an empty successful recovery', t => {
  const root = makeSnapshot(t);
  fs.unlinkSync(path.join(root, 'learning.sqlite-wal'));
  assert.throws(() => verify(root), /EMPTY_CABINET/);
});

test('empty or damaged real journal and invalid progress cannot produce a pass', t => {
  const root = makeSnapshot(t), directory = path.join(root, 'group-lessons');
  const journal = path.join(directory, fs.readdirSync(directory).find(n => n.endsWith('.jsonl')));
  fs.appendFileSync(journal, 'broken\n');
  assert.throws(() => verify(root), /JOURNAL_REPLAY_FAILED/);
  fs.unlinkSync(journal);
  assert.throws(() => verify(root), /NO_STORED_LESSONS/);
  fs.writeFileSync(path.join(root, 'progress.json'), '{}');
  assert.throws(() => verify(root), /PROGRESS_INVALID/);
});
