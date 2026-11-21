'use strict';

// Pass the extracted /data directory from a provider snapshot. Never open the
// server stores on the source. The only writable database and journals are copies.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { GroupLessonStore } = require('../board-server/group-lessons');
const { verifyDatabase } = require('../board-server/learning-backup');
const { validatePersistedStore } = require('../board-server/progress-store');

function requireEvidence(condition, code) {
  if (!condition) throw new Error(code);
}

function copyRegular(source, target) {
  requireEvidence(fs.lstatSync(source).isFile(), 'SOURCE_NOT_REGULAR');
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(target, 0o600);
}

function checkCabinet(source, scratch) {
  const name = 'learning.sqlite';
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const file = path.join(source, name + suffix);
    if (suffix && !fs.existsSync(file)) continue;
    copyRegular(file, path.join(scratch, name + suffix));
  }
  const wal = path.join(scratch, name + '-wal');
  const hasWal = fs.existsSync(wal) && fs.statSync(wal).size > 0;
  const db = new DatabaseSync(path.join(scratch, name));
  const consolidated = path.join(scratch, 'restored.sqlite');
  let accountCount, attempts;
  try {
    accountCount = db.prepare('SELECT count(*) AS n FROM accounts').get().n;
    attempts = db.prepare('SELECT count(*) AS n FROM attempts').get().n;
    requireEvidence(accountCount > 0, 'EMPTY_CABINET');
    db.prepare('VACUUM INTO ?').run(consolidated);
    db.prepare('ATTACH DATABASE ? AS recovered').run(consolidated);
    for (const table of ['accounts', 'attempts']) {
      for (const [from, to] of [['main', 'recovered'], ['recovered', 'main']]) {
        const mismatch = db.prepare(`SELECT EXISTS(SELECT * FROM ${from}.${table}
          EXCEPT SELECT * FROM ${to}.${table}) AS differs`).get();
        requireEvidence(!mismatch.differs, 'CABINET_RESTORE_MISMATCH');
      }
    }
  } finally { db.close(); }
  verifyDatabase(consolidated);
  const restored = new DatabaseSync(consolidated, { readOnly: true });
  try {
    requireEvidence(restored.prepare('PRAGMA foreign_key_check').get() === undefined, 'BROKEN_RELATIONS');
    requireEvidence(restored.prepare('SELECT count(*) AS n FROM accounts').get().n === accountCount &&
      restored.prepare('SELECT count(*) AS n FROM attempts').get().n === attempts, 'CABINET_RESTORE_MISMATCH');
  } finally { restored.close(); }
  return { sqlite: true, walPresent: hasWal, cabinetHasAttempts: attempts > 0 };
}

function checkLessons(source, scratch) {
  const originals = path.join(source, 'group-lessons');
  requireEvidence(fs.lstatSync(originals).isDirectory(), 'MISSING_LESSON_DIRECTORY');
  const directory = path.join(scratch, 'group-lessons');
  fs.mkdirSync(directory, { mode: 0o700 });
  const journals = fs.readdirSync(originals).filter(name => name.endsWith('.jsonl'));
  requireEvidence(journals.length > 0, 'NO_STORED_LESSONS');
  for (const name of journals) copyRegular(path.join(originals, name), path.join(directory, name));
  const store = new GroupLessonStore({ directory });
  try {
    requireEvidence(store.status().durable && store.lessons.size === journals.length, 'JOURNAL_REPLAY_FAILED');
    let historyFound = false;
    for (const entry of store.lessons.values()) {
      const participant = entry.header.students[0];
      const { auth } = store.authorize(entry.header.id, participant.studentToken);
      const view = store.snapshot(entry, auth);
      requireEvidence(view.students.length === 1 && view.common && view.students[0].workspace, 'MISSING_SHEETS');
      const teacher = { role: 'teacher', actor: 'teacher', seatId: null };
      for (const target of ['common', ...entry.header.students.map(student => student.id)]) {
        // The constructor already replays every committed event. Exercise the
        // same history reader that the teacher opens on a restored worksheet.
        const history = store.history(entry, teacher, { target, limit: 1 });
        requireEvidence(history.revision === view.revision && history.initialWorkspace, 'HISTORY_MISMATCH');
        if (history.events.length) historyFound = true;
      }
    }
    requireEvidence(historyFound, 'NO_LESSON_WITH_HISTORY');
    return { previousLessonOpened: true, sheets: true, history: true };
  } finally { store.close(); }
}

function verify(source) {
  requireEvidence(source && fs.lstatSync(source).isDirectory(), 'SNAPSHOT_DIRECTORY_REQUIRED');
  requireEvidence(fs.realpathSync(source) !== path.resolve('/data'), 'USE_EXTRACTED_SNAPSHOT');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-private-restore-'));
  try {
    fs.chmodSync(scratch, 0o700);
    const progress = path.join(scratch, 'progress.json');
    copyRegular(path.join(source, 'progress.json'), progress);
    const data = JSON.parse(fs.readFileSync(progress, 'utf8'));
    requireEvidence(validatePersistedStore(data), 'PROGRESS_INVALID');
    const cabinet = checkCabinet(source, scratch);
    const lessons = checkLessons(source, scratch);
    const hasRecordedAssignment = data.workspaces.some(w => w.assignments.some(a => a.revision > 0));
    requireEvidence(hasRecordedAssignment || cabinet.cabinetHasAttempts, 'NO_STORED_PROGRESS');
    return { ...cabinet, ...lessons, progress: true };
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}

module.exports = { verify };
if (require.main === module) {
  try { console.log(JSON.stringify(verify(process.argv[2]))); }
  catch (error) {
    // Never echo DB errors, filesystem paths, invitation values or journal data.
    const reason = /^[A-Z][A-Z_]{2,50}$/.test(error.message) ? error.message : 'SNAPSHOT_UNREADABLE';
    console.error('RESTORE_UNVERIFIED', reason);
    process.exitCode = 1;
  }
}
