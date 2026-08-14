'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ProgressStoreError,
  emptyProgress,
  loadProgressStore,
  normalizeProgressSnapshot,
  summarizeProgress
} = require('../progress-store');

function temporaryStore(t, allowed = new Set(['yashchenko-t12'])) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-progress-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'progress.json');
  const store = loadProgressStore({
    filePath,
    persistenceConfirmed: true,
    isTrainerAllowed: trainerId => allowed.has(trainerId)
  });
  assert.equal(store.ready, true);
  return { directory, filePath, store };
}

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    tasks: {},
    drill: { runs: 0, best: 0, passed: false },
    ...overrides
  };
}

test('missing confirmation and store path are fail-closed', () => {
  const unconfirmed = loadProgressStore({ filePath: 'progress.json' });
  assert.equal(unconfirmed.ready, false);
  assert.equal(unconfirmed.error, 'PROGRESS_PERSISTENCE_NOT_CONFIRMED');
  const store = loadProgressStore({ filePath: '', persistenceConfirmed: true });
  assert.equal(store.ready, false);
  assert.equal(store.error, 'PROGRESS_STORE_PATH_REQUIRED');
  assert.throws(
    () => store.createWorkspace(),
    error => error instanceof ProgressStoreError
      && error.code === 'PROGRESS_STORE_PATH_REQUIRED'
      && error.status === 503
  );
});

test('workspace and assignment codes are returned once and never persisted raw', t => {
  const { filePath, store } = temporaryStore(t);
  const workspace = store.createWorkspace();
  assert.match(workspace.workspaceId, /^[A-Za-z0-9_-]+$/);
  assert.match(workspace.teacherCode, /^[A-Za-z0-9_-]{32}$/);

  assert.throws(
    () => store.createAssignment(workspace.workspaceId, workspace.teacherCode, {
      studentLabel: 'Ученик 1',
      trainerId: 'unregistered-trainer'
    }),
    error => error.code === 'PROGRESS_TRAINER_NOT_AUTHORIZED'
  );

  const assignment = store.createAssignment(workspace.workspaceId, workspace.teacherCode, {
    studentLabel: '  Ученик   1  ',
    trainerId: 'yashchenko-t12'
  });
  assert.equal(assignment.studentLabel, 'Ученик 1');
  assert.match(assignment.studentCode, /^[A-Za-z0-9_-]{32}$/);

  const raw = fs.readFileSync(filePath, 'utf8');
  assert.equal(raw.includes(workspace.teacherCode), false);
  assert.equal(raw.includes(assignment.studentCode), false);
  assert.equal(raw.includes('teacherCode'), false);
  assert.equal(raw.includes('studentCode'), false);
  assert.equal(raw.includes('TokenHash'), true);

  assert.throws(
    () => store.listAssignments(workspace.workspaceId, assignment.studentCode),
    error => error.code === 'PROGRESS_ACCESS_DENIED'
  );
  assert.throws(
    () => store.getAssignment(assignment.assignmentId, workspace.teacherCode),
    error => error.code === 'PROGRESS_ACCESS_DENIED'
  );
});

test('progress survives reload and stale snapshots cannot erase stronger state', t => {
  const { filePath, store } = temporaryStore(t);
  const workspace = store.createWorkspace();
  const assignment = store.createAssignment(workspace.workspaceId, workspace.teacherCode, {
    studentLabel: 'Ирина',
    trainerId: 'yashchenko-t12'
  });

  const first = store.updateAssignment(assignment.assignmentId, assignment.studentCode, {
    trainerId: 'yashchenko-t12',
    progress: snapshot({
      tasks: {
        't1-17': { line: 1, state: 'helped', attempts: 3, errors: 2, hints: 1 },
        't2-4': { line: 2, state: 'seen', attempts: 1, errors: 1, hints: 3 }
      },
      drill: { runs: 1, best: 8, passed: false }
    })
  });
  assert.equal(first.revision, 1);
  assert.deepEqual(first.summary, {
    started: 2,
    solved: 1,
    clean: 0,
    helped: 1,
    seen: 1,
    attempts: 4,
    errors: 3,
    hints: 4,
    lines: {
      1: { started: 1, solved: 1, clean: 0, helped: 1, seen: 0 },
      2: { started: 1, solved: 0, clean: 0, helped: 0, seen: 1 }
    },
    drill: { runs: 1, best: 8, passed: false }
  });

  const stronger = store.updateAssignment(assignment.assignmentId, assignment.studentCode, {
    trainerId: 'yashchenko-t12',
    progress: snapshot({
      tasks: {
        't1-17': { line: 1, state: 'clean', attempts: 4, errors: 2, hints: 1 }
      },
      drill: { runs: 2, best: 11, passed: true }
    })
  });
  assert.equal(stronger.revision, 2);

  const stale = store.updateAssignment(assignment.assignmentId, assignment.studentCode, {
    trainerId: 'yashchenko-t12',
    progress: snapshot({
      tasks: {
        't1-17': { line: 1, state: 'seen', attempts: 1, errors: 1, hints: 0 }
      },
      drill: { runs: 1, best: 4, passed: false }
    })
  });
  assert.equal(stale.revision, 2);
  assert.deepEqual(stale.progress.tasks['t1-17'], {
    line: 1,
    state: 'clean',
    attempts: 4,
    errors: 2,
    hints: 1
  });
  assert.deepEqual(stale.progress.drill, { runs: 2, best: 11, passed: true });

  const reloaded = loadProgressStore({
    filePath,
    persistenceConfirmed: true,
    isTrainerAllowed: trainerId => trainerId === 'yashchenko-t12'
  });
  assert.equal(reloaded.ready, true);
  const afterRestart = reloaded.listAssignments(workspace.workspaceId, workspace.teacherCode);
  assert.equal(afterRestart.assignments.length, 1);
  assert.equal(afterRestart.assignments[0].revision, 2);
  assert.equal(afterRestart.assignments[0].summary.clean, 1);
  assert.equal(afterRestart.assignments[0].summary.seen, 1);
  assert.equal(JSON.stringify(afterRestart).includes('TokenHash'), false);
});

test('snapshot validator is closed and bounded', () => {
  assert.deepEqual(normalizeProgressSnapshot(emptyProgress()), emptyProgress());
  assert.throws(
    () => normalizeProgressSnapshot({ ...emptyProgress(), extra: true }),
    error => error.code === 'PROGRESS_SNAPSHOT_INVALID'
  );
  assert.throws(
    () => normalizeProgressSnapshot(snapshot({
      tasks: { 't1-17': { line: 2, state: 'clean', attempts: 1, errors: 0, hints: 0 } }
    })),
    error => error.code === 'PROGRESS_TASK_LINE_INVALID'
  );
  assert.throws(
    () => normalizeProgressSnapshot(snapshot({
      tasks: { 't1-17': { line: 1, state: 'clean', attempts: 1, errors: 2, hints: 0 } }
    })),
    error => error.code === 'PROGRESS_TASK_COUNTERS_INVALID'
  );
  assert.throws(
    () => normalizeProgressSnapshot(snapshot({
      tasks: { 't3-1': { line: 3, state: 'clean', attempts: 1, errors: 0, hints: 0 } }
    })),
    error => error.code === 'PROGRESS_TASK_INVALID'
  );
});

test('summary treats attempts without a result as started but not solved', () => {
  const summary = summarizeProgress(snapshot({
    tasks: {
      't1-1': { line: 1, state: null, attempts: 1, errors: 1, hints: 0 }
    }
  }));
  assert.equal(summary.started, 1);
  assert.equal(summary.solved, 0);
  assert.equal(summary.lines[1].started, 1);
});

test('invalid and unwritable stores remain unavailable without fallback', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-progress-invalid-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const corruptPath = path.join(directory, 'corrupt.json');
  fs.writeFileSync(corruptPath, '{"schemaVersion":1,"workspaces":"bad"}', 'utf8');
  const corrupt = loadProgressStore({ filePath: corruptPath, persistenceConfirmed: true });
  assert.equal(corrupt.ready, false);
  assert.equal(corrupt.error, 'PROGRESS_STORE_DATA_INVALID');

  const blocker = path.join(directory, 'not-a-directory');
  fs.writeFileSync(blocker, 'x', 'utf8');
  const unavailable = loadProgressStore({
    filePath: path.join(blocker, 'progress.json'),
    persistenceConfirmed: true
  });
  assert.equal(unavailable.ready, false);
  assert.equal(unavailable.error, 'PROGRESS_STORE_UNAVAILABLE');
});
