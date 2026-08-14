'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const STORE_SCHEMA_VERSION = 1;
const PROGRESS_SCHEMA_VERSION = 1;
const MAX_ASSIGNMENTS_PER_WORKSPACE = 500;
const MAX_TASKS_PER_ASSIGNMENT = 200;
const MAX_WORKSPACES = 10_000;
const MAX_STORE_BYTES = 64 * 1024 * 1024;
const MAX_COUNTER = 1_000_000;
const WORKSPACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,64}$/;
const ASSIGNMENT_ID_PATTERN = /^[A-Za-z0-9_-]{10,64}$/;
const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;
const TRAINER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TASK_ID_PATTERN = /^t([12])-([1-9]|[1-9][0-9]{1,2})$/;
const UNSAFE_LABEL_PATTERN = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
const TASK_STATES = new Set(['seen', 'helped', 'clean']);
const STATE_RANK = Object.freeze({ seen: 1, helped: 2, clean: 3 });

class ProgressStoreError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = 'ProgressStoreError';
    this.code = code;
    this.status = status;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, keys) {
  if (!isPlainObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function isIsoTimestamp(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function makeId(size = 9) {
  return crypto.randomBytes(size).toString('base64url');
}

function makeAccessCode() {
  return crypto.randomBytes(24).toString('base64url');
}

function hashAccessCode(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function accessCodeMatches(value, expectedHash) {
  if (
    typeof value !== 'string'
    || value.length < 32
    || value.length > 256
    || !TOKEN_HASH_PATTERN.test(expectedHash || '')
  ) {
    return false;
  }
  const actual = Buffer.from(hashAccessCode(value), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function normalizeStudentLabel(value) {
  if (typeof value !== 'string') throw new ProgressStoreError('PROGRESS_LABEL_INVALID');
  const label = value.trim().replace(/\s+/g, ' ');
  if (!label || label.length > 80 || UNSAFE_LABEL_PATTERN.test(label)) {
    throw new ProgressStoreError('PROGRESS_LABEL_INVALID');
  }
  return label;
}

function normalizeTrainerId(value) {
  if (
    typeof value !== 'string'
    || value.length > 128
    || !TRAINER_ID_PATTERN.test(value)
  ) {
    throw new ProgressStoreError('PROGRESS_TRAINER_ID_INVALID');
  }
  return value;
}

function normalizeCounter(value, code) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_COUNTER) {
    throw new ProgressStoreError(code);
  }
  return value;
}

function normalizeTaskProgress(taskId, value) {
  const match = TASK_ID_PATTERN.exec(taskId);
  if (!match || !hasExactKeys(value, ['line', 'state', 'attempts', 'errors', 'hints'])) {
    throw new ProgressStoreError('PROGRESS_TASK_INVALID');
  }
  const line = Number(match[1]);
  if (value.line !== line) throw new ProgressStoreError('PROGRESS_TASK_LINE_INVALID');
  if (value.state !== null && !TASK_STATES.has(value.state)) {
    throw new ProgressStoreError('PROGRESS_TASK_STATE_INVALID');
  }
  const attempts = normalizeCounter(value.attempts, 'PROGRESS_TASK_ATTEMPTS_INVALID');
  const errors = normalizeCounter(value.errors, 'PROGRESS_TASK_ERRORS_INVALID');
  const hints = normalizeCounter(value.hints, 'PROGRESS_TASK_HINTS_INVALID');
  if (errors > attempts) throw new ProgressStoreError('PROGRESS_TASK_COUNTERS_INVALID');
  if (!value.state && attempts === 0 && hints === 0) {
    throw new ProgressStoreError('PROGRESS_TASK_EMPTY');
  }
  return { line, state: value.state, attempts, errors, hints };
}

function normalizeProgressSnapshot(value) {
  if (!hasExactKeys(value, ['schemaVersion', 'tasks', 'drill'])) {
    throw new ProgressStoreError('PROGRESS_SNAPSHOT_INVALID');
  }
  if (value.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    throw new ProgressStoreError('PROGRESS_SCHEMA_UNSUPPORTED');
  }
  if (!isPlainObject(value.tasks)) throw new ProgressStoreError('PROGRESS_TASKS_INVALID');
  const taskIds = Object.keys(value.tasks);
  if (taskIds.length > MAX_TASKS_PER_ASSIGNMENT) {
    throw new ProgressStoreError('PROGRESS_TASK_LIMIT_EXCEEDED');
  }
  const tasks = {};
  for (const taskId of taskIds.sort()) {
    tasks[taskId] = normalizeTaskProgress(taskId, value.tasks[taskId]);
  }
  if (!hasExactKeys(value.drill, ['runs', 'best', 'passed'])) {
    throw new ProgressStoreError('PROGRESS_DRILL_INVALID');
  }
  const runs = normalizeCounter(value.drill.runs, 'PROGRESS_DRILL_RUNS_INVALID');
  if (!Number.isInteger(value.drill.best) || value.drill.best < 0 || value.drill.best > 12) {
    throw new ProgressStoreError('PROGRESS_DRILL_BEST_INVALID');
  }
  if (typeof value.drill.passed !== 'boolean') {
    throw new ProgressStoreError('PROGRESS_DRILL_PASSED_INVALID');
  }
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    tasks,
    drill: { runs, best: value.drill.best, passed: value.drill.passed }
  };
}

function emptyProgress() {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    tasks: {},
    drill: { runs: 0, best: 0, passed: false }
  };
}

function strongerState(current, incoming) {
  if (!current) return incoming || null;
  if (!incoming) return current;
  return (STATE_RANK[incoming] || 0) > (STATE_RANK[current] || 0)
    ? incoming
    : current;
}

function mergeProgress(current, incoming) {
  const merged = cloneJson(current);
  for (const [taskId, nextTask] of Object.entries(incoming.tasks)) {
    const oldTask = merged.tasks[taskId];
    if (!oldTask) {
      merged.tasks[taskId] = cloneJson(nextTask);
      continue;
    }
    if (oldTask.line !== nextTask.line) {
      throw new ProgressStoreError('PROGRESS_TASK_LINE_CONFLICT');
    }
    merged.tasks[taskId] = {
      line: oldTask.line,
      state: strongerState(oldTask.state, nextTask.state),
      attempts: Math.max(oldTask.attempts, nextTask.attempts),
      errors: Math.max(oldTask.errors, nextTask.errors),
      hints: Math.max(oldTask.hints, nextTask.hints)
    };
  }
  merged.drill = {
    runs: Math.max(current.drill.runs, incoming.drill.runs),
    best: Math.max(current.drill.best, incoming.drill.best),
    passed: current.drill.passed || incoming.drill.passed
  };
  return merged;
}

function summarizeProgress(progress) {
  const summary = {
    started: 0,
    solved: 0,
    clean: 0,
    helped: 0,
    seen: 0,
    attempts: 0,
    errors: 0,
    hints: 0,
    lines: {
      1: { started: 0, solved: 0, clean: 0, helped: 0, seen: 0 },
      2: { started: 0, solved: 0, clean: 0, helped: 0, seen: 0 }
    },
    drill: cloneJson(progress.drill)
  };
  for (const task of Object.values(progress.tasks)) {
    const line = summary.lines[task.line];
    summary.started += 1;
    line.started += 1;
    summary.attempts += task.attempts;
    summary.errors += task.errors;
    summary.hints += task.hints;
    if (task.state === 'clean' || task.state === 'helped') {
      summary.solved += 1;
      line.solved += 1;
    }
    if (task.state) {
      summary[task.state] += 1;
      line[task.state] += 1;
    }
  }
  return summary;
}

function validatePersistedAssignment(value) {
  if (!hasExactKeys(value, [
    'assignmentId',
    'studentLabel',
    'trainerId',
    'studentTokenHash',
    'createdAt',
    'updatedAt',
    'revision',
    'progress'
  ])) {
    return false;
  }
  if (
    !ASSIGNMENT_ID_PATTERN.test(value.assignmentId || '')
    || typeof value.studentLabel !== 'string'
    || value.studentLabel !== value.studentLabel.trim()
    || !value.studentLabel
    || value.studentLabel.length > 80
    || UNSAFE_LABEL_PATTERN.test(value.studentLabel)
    || !TRAINER_ID_PATTERN.test(value.trainerId || '')
    || !TOKEN_HASH_PATTERN.test(value.studentTokenHash || '')
    || !isIsoTimestamp(value.createdAt)
    || !isIsoTimestamp(value.updatedAt)
    || !Number.isInteger(value.revision)
    || value.revision < 0
  ) {
    return false;
  }
  try {
    normalizeProgressSnapshot(value.progress);
  } catch (_error) {
    return false;
  }
  return true;
}

function validatePersistedWorkspace(value) {
  if (!hasExactKeys(value, [
    'workspaceId',
    'teacherTokenHash',
    'createdAt',
    'updatedAt',
    'assignments'
  ])) {
    return false;
  }
  if (
    !WORKSPACE_ID_PATTERN.test(value.workspaceId || '')
    || !TOKEN_HASH_PATTERN.test(value.teacherTokenHash || '')
    || !isIsoTimestamp(value.createdAt)
    || !isIsoTimestamp(value.updatedAt)
    || !Array.isArray(value.assignments)
    || value.assignments.length > MAX_ASSIGNMENTS_PER_WORKSPACE
    || value.assignments.some(assignment => !validatePersistedAssignment(assignment))
  ) {
    return false;
  }
  const assignmentIds = new Set(value.assignments.map(assignment => assignment.assignmentId));
  return assignmentIds.size === value.assignments.length;
}

function validatePersistedStore(value) {
  if (!hasExactKeys(value, ['schemaVersion', 'workspaces'])) return false;
  if (value.schemaVersion !== STORE_SCHEMA_VERSION || !Array.isArray(value.workspaces)) return false;
  if (value.workspaces.length > MAX_WORKSPACES) return false;
  if (value.workspaces.some(workspace => !validatePersistedWorkspace(workspace))) return false;
  const workspaceIds = new Set(value.workspaces.map(workspace => workspace.workspaceId));
  const assignmentIds = new Set();
  for (const workspace of value.workspaces) {
    for (const assignment of workspace.assignments) {
      if (assignmentIds.has(assignment.assignmentId)) return false;
      assignmentIds.add(assignment.assignmentId);
    }
  }
  return workspaceIds.size === value.workspaces.length;
}

function atomicWriteJson(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const serialized = `${JSON.stringify(value)}\n`;
  if (Buffer.byteLength(serialized, 'utf8') > MAX_STORE_BYTES) {
    throw new ProgressStoreError('PROGRESS_STORE_LIMIT_EXCEEDED', 507);
  }
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${makeId(6)}.tmp`
  );
  let handle;
  try {
    handle = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(handle, serialized, 'utf8');
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = null;
    fs.renameSync(temporary, filePath);
  } finally {
    if (handle !== null && handle !== undefined) {
      try { fs.closeSync(handle); } catch (_error) {}
    }
    try { fs.unlinkSync(temporary); } catch (_error) {}
  }
}

function publicAssignment(assignment) {
  return {
    assignmentId: assignment.assignmentId,
    studentLabel: assignment.studentLabel,
    trainerId: assignment.trainerId,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    lastActivityAt: assignment.updatedAt,
    revision: assignment.revision,
    progress: cloneJson(assignment.progress),
    summary: summarizeProgress(assignment.progress)
  };
}

class ProgressStore {
  constructor(filePath, data, options = {}) {
    this.filePath = filePath;
    this.data = data;
    this.ready = true;
    this.error = null;
    this.isTrainerAllowed = typeof options.isTrainerAllowed === 'function'
      ? options.isTrainerAllowed
      : () => false;
  }

  assertReady() {
    if (!this.ready) throw new ProgressStoreError(this.error || 'PROGRESS_STORE_UNAVAILABLE', 503);
  }

  persist(nextData) {
    this.assertReady();
    try {
      atomicWriteJson(this.filePath, nextData);
      this.data = nextData;
    } catch (_error) {
      this.ready = false;
      this.error = 'PROGRESS_STORE_WRITE_FAILED';
      throw new ProgressStoreError(this.error, 503);
    }
  }

  createWorkspace() {
    this.assertReady();
    if (this.data.workspaces.length >= MAX_WORKSPACES) {
      throw new ProgressStoreError('PROGRESS_WORKSPACE_LIMIT_EXCEEDED', 409);
    }
    const teacherCode = makeAccessCode();
    let workspaceId;
    do { workspaceId = makeId(9); }
    while (this.data.workspaces.some(workspace => workspace.workspaceId === workspaceId));
    const timestamp = nowIso();
    const workspace = {
      workspaceId,
      teacherTokenHash: hashAccessCode(teacherCode),
      createdAt: timestamp,
      updatedAt: timestamp,
      assignments: []
    };
    const nextData = cloneJson(this.data);
    nextData.workspaces.push(workspace);
    this.persist(nextData);
    return { workspaceId, teacherCode, createdAt: timestamp };
  }

  requireWorkspace(workspaceId, teacherCode) {
    this.assertReady();
    if (!WORKSPACE_ID_PATTERN.test(workspaceId || '')) {
      throw new ProgressStoreError('PROGRESS_WORKSPACE_NOT_FOUND', 404);
    }
    const workspace = this.data.workspaces.find(item => item.workspaceId === workspaceId);
    if (!workspace || !accessCodeMatches(teacherCode, workspace.teacherTokenHash)) {
      throw new ProgressStoreError('PROGRESS_ACCESS_DENIED', 403);
    }
    return workspace;
  }

  listAssignments(workspaceId, teacherCode) {
    const workspace = this.requireWorkspace(workspaceId, teacherCode);
    return {
      workspaceId: workspace.workspaceId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      assignments: workspace.assignments.map(publicAssignment)
    };
  }

  createAssignment(workspaceId, teacherCode, input) {
    const workspace = this.requireWorkspace(workspaceId, teacherCode);
    if (!hasExactKeys(input, ['studentLabel', 'trainerId'])) {
      throw new ProgressStoreError('PROGRESS_ASSIGNMENT_INVALID');
    }
    const studentLabel = normalizeStudentLabel(input.studentLabel);
    const trainerId = normalizeTrainerId(input.trainerId);
    if (!this.isTrainerAllowed(trainerId)) {
      throw new ProgressStoreError('PROGRESS_TRAINER_NOT_AUTHORIZED', 422);
    }
    if (workspace.assignments.length >= MAX_ASSIGNMENTS_PER_WORKSPACE) {
      throw new ProgressStoreError('PROGRESS_ASSIGNMENT_LIMIT_EXCEEDED', 409);
    }
    const studentCode = makeAccessCode();
    let assignmentId;
    const allAssignments = this.data.workspaces.flatMap(item => item.assignments);
    do { assignmentId = makeId(9); }
    while (allAssignments.some(assignment => assignment.assignmentId === assignmentId));
    const timestamp = nowIso();
    const assignment = {
      assignmentId,
      studentLabel,
      trainerId,
      studentTokenHash: hashAccessCode(studentCode),
      createdAt: timestamp,
      updatedAt: timestamp,
      revision: 0,
      progress: emptyProgress()
    };
    const nextData = cloneJson(this.data);
    const nextWorkspace = nextData.workspaces.find(item => item.workspaceId === workspaceId);
    nextWorkspace.assignments.push(assignment);
    nextWorkspace.updatedAt = timestamp;
    this.persist(nextData);
    return {
      assignmentId,
      studentLabel,
      trainerId,
      studentCode,
      createdAt: timestamp
    };
  }

  requireAssignment(assignmentId, studentCode) {
    this.assertReady();
    if (!ASSIGNMENT_ID_PATTERN.test(assignmentId || '')) {
      throw new ProgressStoreError('PROGRESS_ASSIGNMENT_NOT_FOUND', 404);
    }
    for (const workspace of this.data.workspaces) {
      const assignment = workspace.assignments.find(item => item.assignmentId === assignmentId);
      if (!assignment) continue;
      if (!accessCodeMatches(studentCode, assignment.studentTokenHash)) {
        throw new ProgressStoreError('PROGRESS_ACCESS_DENIED', 403);
      }
      return { workspace, assignment };
    }
    throw new ProgressStoreError('PROGRESS_ASSIGNMENT_NOT_FOUND', 404);
  }

  getAssignment(assignmentId, studentCode) {
    const { assignment } = this.requireAssignment(assignmentId, studentCode);
    return publicAssignment(assignment);
  }

  updateAssignment(assignmentId, studentCode, input) {
    const { workspace, assignment } = this.requireAssignment(assignmentId, studentCode);
    if (!hasExactKeys(input, ['trainerId', 'progress'])) {
      throw new ProgressStoreError('PROGRESS_UPDATE_INVALID');
    }
    const trainerId = normalizeTrainerId(input.trainerId);
    if (trainerId !== assignment.trainerId || !this.isTrainerAllowed(trainerId)) {
      throw new ProgressStoreError('PROGRESS_TRAINER_NOT_AUTHORIZED', 422);
    }
    const incoming = normalizeProgressSnapshot(input.progress);
    const merged = mergeProgress(assignment.progress, incoming);
    if (JSON.stringify(merged) === JSON.stringify(assignment.progress)) {
      return publicAssignment(assignment);
    }
    const timestamp = nowIso();
    const nextData = cloneJson(this.data);
    const nextWorkspace = nextData.workspaces.find(item => item.workspaceId === workspace.workspaceId);
    const nextAssignment = nextWorkspace.assignments.find(item => item.assignmentId === assignmentId);
    nextAssignment.progress = merged;
    nextAssignment.revision += 1;
    nextAssignment.updatedAt = timestamp;
    nextWorkspace.updatedAt = timestamp;
    this.persist(nextData);
    return publicAssignment(nextAssignment);
  }
}

function unavailableProgressStore(error) {
  const fail = () => { throw new ProgressStoreError(error, 503); };
  return {
    ready: false,
    error,
    createWorkspace: fail,
    createAssignment: fail,
    listAssignments: fail,
    getAssignment: fail,
    updateAssignment: fail
  };
}

function loadProgressStore(options = {}) {
  if (options.persistenceConfirmed !== true) {
    return unavailableProgressStore('PROGRESS_PERSISTENCE_NOT_CONFIRMED');
  }
  const configuredPath = typeof options.filePath === 'string'
    ? options.filePath.trim()
    : '';
  if (!configuredPath) return unavailableProgressStore('PROGRESS_STORE_PATH_REQUIRED');
  const baseDir = options.baseDir || __dirname;
  const filePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(baseDir, configuredPath);
  try {
    let data;
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).size > MAX_STORE_BYTES) {
        return unavailableProgressStore('PROGRESS_STORE_DATA_INVALID');
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
      if (!validatePersistedStore(data)) {
        return unavailableProgressStore('PROGRESS_STORE_DATA_INVALID');
      }
    } else {
      data = { schemaVersion: STORE_SCHEMA_VERSION, workspaces: [] };
      atomicWriteJson(filePath, data);
    }
    return new ProgressStore(filePath, data, options);
  } catch (_error) {
    return unavailableProgressStore('PROGRESS_STORE_UNAVAILABLE');
  }
}

module.exports = Object.freeze({
  MAX_ASSIGNMENTS_PER_WORKSPACE,
  MAX_STORE_BYTES,
  MAX_TASKS_PER_ASSIGNMENT,
  MAX_WORKSPACES,
  PROGRESS_SCHEMA_VERSION,
  STORE_SCHEMA_VERSION,
  ProgressStoreError,
  accessCodeMatches,
  emptyProgress,
  hashAccessCode,
  loadProgressStore,
  mergeProgress,
  normalizeProgressSnapshot,
  summarizeProgress,
  validatePersistedStore
});
