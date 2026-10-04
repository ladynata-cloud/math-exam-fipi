'use strict';

// Group lessons deliberately do not reuse legacy room tokens or volatile room data.
// A single server process owns this explicit persistent directory. Each accepted
// action is appended and fsynced before it is visible to any client.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const TRAINERS = Object.freeze([
  { id: 'negative-numbers-line', path: '/trainers/negative-numbers-line.html', title: 'Отрицательные числа на прямой' },
  { id: 'linear-inequalities-stepwise', path: '/trainers/linear-inequalities-stepwise.html', title: 'Линейные неравенства — пошагово' }
]);
const LIMITS = Object.freeze({ students: 8, lessons: 500, lessonBytes: 64 * 1024 * 1024,
  totalBytes: 512 * 1024 * 1024, actionBytes: 96 * 1024, stateBytes: 24 * 1024,
  events: 100000, strokes: 3000, points: 2000 });
const ID = /^[A-Za-z0-9_-]{8,80}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
// A less-than followed by a variable is ordinary mathematics. Reject complete
// markup rather than treating every '< x' as an HTML tag.
const UNSAFE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]|<\s*(?:\/?[a-z][a-z0-9:-]*(?:\s[^<>]*?)?\s*\/?>|!)|javascript\s*:|data\s*:\s*text\/html/iu;
const makeId = (bytes = 18) => crypto.randomBytes(bytes).toString('base64url');
const copy = value => JSON.parse(JSON.stringify(value));
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function processDescriptor(procPid = 'self') {
  // Read self's procfs PID too: process.pid can belong to an inner PID namespace
  // while /proc is mounted from its host namespace.
  const stat = fs.readFileSync(`/proc/${procPid}/stat`, 'utf8');
  const startTicks = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
  const bootId = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  return { procPid: Number(stat.slice(0, stat.indexOf(' '))), bootId, identity: `${bootId}:${startTicks}` };
}

class GroupLessonError extends Error {
  constructor(code, status = 400) { super(code); this.name = 'GroupLessonError'; this.code = code; this.status = status; }
}
function fail(code, status = 400) { throw new GroupLessonError(code, status); }
function requireValue(condition, code = 'GROUP_PAYLOAD_INVALID') { if (!condition) fail(code); }
function exactKeys(value, allowed, required = []) {
  requireValue(plain(value) && Object.keys(value).every(key => allowed.includes(key))
    && required.every(key => Object.hasOwn(value, key)));
}
function textValue(value, max = 1000, empty = true) {
  requireValue(typeof value === 'string' && value.length <= max && (empty || !!value.trim()) && !UNSAFE.test(value));
  return value;
}
function integer(value, min, max) { requireValue(Number.isInteger(value) && value >= min && value <= max); }
function safeJson(value, depth = 0) {
  requireValue(depth <= 10);
  if (typeof value === 'string') { textValue(value, 4000); return; }
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') { requireValue(Number.isFinite(value) && Math.abs(value) <= 1e9); return; }
  if (Array.isArray(value)) { requireValue(value.length <= 2000); value.forEach(item => safeJson(item, depth + 1)); return; }
  requireValue(plain(value) && Object.keys(value).length <= 80);
  for (const [key, item] of Object.entries(value)) {
    requireValue(!['__proto__', 'prototype', 'constructor'].includes(key));
    textValue(key, 80, false); safeJson(item, depth + 1);
  }
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (plain(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function matching(token, expectedHash) {
  if (!TOKEN.test(token || '') || !/^[a-f0-9]{64}$/.test(expectedHash || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(hash(token), 'hex'), Buffer.from(expectedHash, 'hex'));
}
function normalizeState(trainerId, state) {
  requireValue(plain(state), 'GROUP_TRAINER_STATE_INVALID');
  requireValue(Buffer.byteLength(JSON.stringify(state)) <= LIMITS.stateBytes, 'GROUP_STATE_TOO_LARGE');
  safeJson(state);
  if (trainerId === 'negative-numbers-line') {
    exactKeys(state, ['seed', 'mode', 'level', 'task', 'answer', 'correctAnswer', 'phase', 'hintCount', 'taskNo', 'visual',
      'answerDisabled', 'checkDisabled', 'instructionText', 'instructionClass', 'feedbackText', 'feedbackClass', 'hintText', 'hintVisible'], ['task']);
    exactKeys(state.task, ['a', 'b', 'op', 'res', 'label'], ['a', 'b', 'op', 'res']);
    for (const key of ['a', 'b', 'res']) integer(state.task[key], -10, 10);
    requireValue(['+', '-'].includes(state.task.op));
    if (state.task.label !== undefined) textValue(state.task.label, 120);
    requireValue(state.task.res === (state.task.op === '+' ? state.task.a + state.task.b : state.task.a - state.task.b));
    if (state.mode !== undefined) requireValue(['add', 'sub', 'mix'].includes(state.mode));
    if (state.level !== undefined) requireValue(['easy', 'med'].includes(state.level));
    if (state.phase !== undefined) requireValue(['start', 'end', 'answer', 'done'].includes(state.phase));
    if (state.hintCount !== undefined) integer(state.hintCount, 0, 1000000);
    if (state.taskNo !== undefined) integer(state.taskNo, 0, 1000000);
    if (state.correctAnswer !== undefined) requireValue(state.correctAnswer === state.task.res);
    if (state.visual !== undefined) {
      exactKeys(state.visual, ['start', 'end', 'traveler', 'arc', 'wrong']);
      for (const key of ['start', 'end', 'traveler', 'wrong']) {
        if (state.visual[key] !== undefined && state.visual[key] !== null) integer(state.visual[key], -10, 10);
      }
      if (state.visual.arc != null) {
        exactKeys(state.visual.arc, ['from', 'to'], ['from', 'to']);
        integer(state.visual.arc.from, -10, 10); integer(state.visual.arc.to, -10, 10);
      }
    }
  } else if (trainerId === 'linear-inequalities-stepwise') {
    exactKeys(state, ['problemIndex', 'taskIndex', 'taskNumber', 'currentStep', 'shownSteps', 'answerSign', 'answerValue',
      'feedbackText', 'feedbackClass', 'numberLine', 'done', 'problemText'], ['problemIndex', 'currentStep']);
    integer(state.problemIndex, 0, 3); integer(state.currentStep, 0, [3, 3, 4, 4][state.problemIndex]);
    if (state.taskIndex !== undefined) requireValue(state.taskIndex === state.problemIndex);
    if (state.taskNumber !== undefined) requireValue(state.taskNumber === state.problemIndex + 1);
    if (state.answerSign !== undefined) requireValue(['lt', 'lte', 'gt', 'gte'].includes(state.answerSign));
    if (state.shownSteps !== undefined) {
      requireValue(Array.isArray(state.shownSteps) && state.shownSteps.length <= 4);
      for (const step of state.shownSteps) {
        exactKeys(step, ['index', 'action', 'text'], ['index', 'action', 'text']);
        integer(step.index, 0, 3); requireValue(['expand', 'move', 'combine', 'divide'].includes(step.action)); textValue(step.text);
      }
    }
    if (state.numberLine !== undefined) {
      exactKeys(state.numberLine, ['visible', 'sign', 'value'], ['visible', 'sign', 'value']);
      requireValue(typeof state.numberLine.visible === 'boolean');
      requireValue(state.numberLine.sign === null || ['lt', 'lte', 'gt', 'gte'].includes(state.numberLine.sign));
      requireValue(state.numberLine.value === null || (typeof state.numberLine.value === 'number' && Number.isFinite(state.numberLine.value)));
    }
  } else fail('GROUP_TRAINER_NOT_ALLOWED');
  for (const key of ['answerDisabled', 'checkDisabled', 'hintVisible', 'done']) {
    if (state[key] !== undefined) requireValue(typeof state[key] === 'boolean');
  }
  for (const key of ['seed', 'answer', 'answerValue', 'instructionText', 'instructionClass', 'feedbackText', 'feedbackClass', 'hintText', 'problemText']) {
    if (state[key] !== undefined) textValue(state[key], key === 'answer' || key === 'answerValue' ? 160 : 1000);
  }
  return copy(state);
}
function blankWorkspace(id, controller) {
  return { assignmentId: id, trainerId: null, trainerState: null, strokes: [], controller, revision: 0, trainerVersion: 0 };
}
function fromHeader(header) {
  return { id: header.id, title: header.title, createdAt: header.createdAt, revision: 0,
    presentationTarget: null, presentationRevision: 0,
    students: header.students.map(student => ({ id: student.id, name: student.name, help: false,
      workspace: blankWorkspace(student.assignmentId, 'student') })),
    common: blankWorkspace(header.commonAssignmentId, 'teacher') };
}
function workspace(lesson, target) {
  if (target === 'common') return lesson.common;
  return lesson.students.find(student => student.id === target)?.workspace || null;
}
function affected(record) {
  if (record.type === 'present') return [];
  return record.type === 'assign' ? record.payload.targets : [record.target];
}
function applyRecord(lesson, record) {
  const { type, payload, actor, revision } = record;
  if (type === 'present') {
    lesson.presentationTarget = payload.target;
    lesson.presentationRevision = revision;
  } else if (type === 'assign') {
    for (const target of payload.targets) {
      const next = blankWorkspace(payload.assignments[target], target === 'common' ? 'teacher' : 'student');
      next.trainerId = payload.trainerId; next.trainerState = copy(payload.initialState);
      next.revision = revision;
      if (target === 'common') lesson.common = next;
      else { const student = lesson.students.find(item => item.id === target); student.workspace = next; student.help = false; }
    }
  } else {
    const work = workspace(lesson, record.target);
    if (type === 'trainer') { work.trainerState = copy(payload.state); work.trainerVersion++; }
    if (type === 'control') { work.controller = payload.controller; work.trainerVersion++; }
    if (type === 'stroke') work.strokes.push({ ...copy(payload), author: actor, at: record.at });
    if (type === 'undo' || type === 'erase') work.strokes = work.strokes.filter(stroke => stroke.id !== payload.strokeId);
    if (type === 'help') lesson.students.find(student => student.id === record.target).help = payload.active;
    work.revision = revision;
  }
  lesson.revision = revision;
}

class GroupLessonStore {
  constructor({ directory = process.env.GROUP_LESSON_STORE_DIR, io = fs, limits = {} } = {}) {
    this.io = io; this.limits = { ...LIMITS, ...limits }; this.lessons = new Map();
    this.online = new Map(); this.bytes = 0; this.available = false;
    this.reason = directory ? 'GROUP_STORAGE_UNAVAILABLE' : 'GROUP_STORAGE_NOT_CONFIGURED';
    if (!directory) return;
    this.directory = path.resolve(directory);
    try {
      io.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
      this.acquireLock();
      for (const name of io.readdirSync(this.directory)) {
        if (!/^[A-Za-z0-9_-]{24}\.jsonl$/.test(name)) continue;
        const filePath = path.join(this.directory, name), size = io.statSync(filePath).size;
        if (size > this.limits.lessonBytes || this.bytes + size > this.limits.totalBytes) fail('GROUP_STORE_LIMIT_EXCEEDED', 507);
        let raw = io.readFileSync(filePath, 'utf8');
        // An unacknowledged crash-torn final append is discarded, never a committed line.
        if (!raw.endsWith('\n')) {
          const end = raw.lastIndexOf('\n');
          if (end < 0) throw new Error('Incomplete lesson header');
          raw = raw.slice(0, end + 1);
          const fd = io.openSync(filePath, 'r+');
          try { io.ftruncateSync(fd, Buffer.byteLength(raw)); io.fsyncSync(fd); } finally { io.closeSync(fd); }
        }
        const rows = raw.trimEnd().split('\n').map(line => JSON.parse(line));
        const header = rows.shift(); this.validateHeader(header, name);
        requireValue(rows.length <= this.limits.events);
        const lesson = fromHeader(header), entries = [], dedup = new Map();
        for (const record of rows) {
          requireValue(record.revision === lesson.revision + 1 && ID.test(record.opId)
            && ['teacher', ...lesson.students.map(item => item.id)].includes(record.actor)
            && ['assign', 'trainer', 'stroke', 'undo', 'erase', 'help', 'control', 'present'].includes(record.type));
          applyRecord(lesson, record); entries.push(record); dedup.set(`${record.actor}:${record.opId}`, record.fingerprint);
        }
        const bytes = Buffer.byteLength(raw); this.bytes += bytes;
        this.lessons.set(header.id, { header, lesson, entries, dedup, bytes });
      }
      if (this.lessons.size > this.limits.lessons) fail('GROUP_STORE_LIMIT_EXCEEDED', 507);
      this.available = true; this.reason = null;
    } catch (_error) { this.close(); }
  }
  acquireLock() {
    const lockPath = path.join(this.directory, '.group-lessons.lock');
    let descriptor = {};
    try { descriptor = processDescriptor(); } catch (_error) {}
    try {
      const existing = JSON.parse(this.io.readFileSync(lockPath, 'utf8'));
      if (existing.procPid && existing.identity && descriptor.identity) {
        if (existing.bootId === descriptor.bootId) {
          try {
            if (processDescriptor(existing.procPid).identity === existing.identity) throw new Error('Group lesson directory already owned');
          } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
      } else {
        try { process.kill(existing.pid, 0); throw new Error('Group lesson directory already owned'); }
        catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
      this.io.unlinkSync(lockPath);
    } catch (error) { if (error.code !== 'ENOENT' && this.io.existsSync(lockPath)) throw error; }
    const fd = this.io.openSync(lockPath, 'wx', 0o600);
    this.lock = { pid: process.pid, ...descriptor, id: makeId() };
    try { this.io.writeFileSync(fd, JSON.stringify(this.lock)); this.io.fsyncSync(fd); }
    finally { this.io.closeSync(fd); }
    this.lockPath = lockPath;
  }
  close() {
    if (this.lockPath) {
      try {
        const lock = JSON.parse(this.io.readFileSync(this.lockPath, 'utf8'));
        if (lock.id === this.lock?.id) this.io.unlinkSync(this.lockPath);
      } catch (_error) {}
      this.lockPath = null;
    }
  }
  validateHeader(header, name) {
    requireValue(header?.schemaVersion === 1 && `${header.id}.jsonl` === name && Array.isArray(header.students)
      && header.students.length >= 1 && header.students.length <= 8 && /^[a-f0-9]{64}$/.test(header.teacherHash));
    textValue(header.title, 120, false); requireValue(ID.test(header.commonAssignmentId));
    header.students.forEach((student, index) => {
      requireValue(student.id === `s${index + 1}` && TOKEN.test(student.studentToken) && ID.test(student.assignmentId));
      textValue(student.name, 60, false);
    });
  }
  status() { return { available: this.available, durable: this.available, reason: this.reason,
    maxStudents: 8, trainers: TRAINERS, history: true, limits: { lessonBytes: this.limits.lessonBytes, strokes: this.limits.strokes } }; }
  ready() { if (!this.available) fail(this.reason, 503); }
  create(body) {
    this.ready(); exactKeys(body, ['title', 'names'], ['title', 'names']);
    const title = textValue(body.title, 120, false).trim();
    requireValue(Array.isArray(body.names) && body.names.length >= 1 && body.names.length <= 8);
    const names = body.names.map(name => textValue(name, 60, false).trim());
    if (this.lessons.size >= this.limits.lessons) fail('GROUP_STORE_LIMIT_EXCEEDED', 507);
    const teacherToken = makeId(32), id = makeId();
    const header = { schemaVersion: 1, id, title, createdAt: new Date().toISOString(), teacherHash: hash(teacherToken),
      commonAssignmentId: makeId(), students: names.map((name, index) => ({ id: `s${index + 1}`, name,
        studentToken: makeId(32), assignmentId: makeId() })) };
    const serialized = `${JSON.stringify(header)}\n`, bytes = Buffer.byteLength(serialized);
    if (this.bytes + bytes > this.limits.totalBytes || bytes > this.limits.lessonBytes) fail('GROUP_STORE_LIMIT_EXCEEDED', 507);
    const temporary = path.join(this.directory, `.${id}.${makeId(8)}.tmp`), filePath = path.join(this.directory, `${id}.jsonl`);
    let fd;
    try {
      fd = this.io.openSync(temporary, 'wx', 0o600); this.io.writeFileSync(fd, serialized); this.io.fsyncSync(fd);
      this.io.closeSync(fd); fd = undefined; this.io.renameSync(temporary, filePath);
      const directoryFd = this.io.openSync(this.directory, 'r');
      try { this.io.fsyncSync(directoryFd); } finally { this.io.closeSync(directoryFd); }
    } catch (_error) {
      if (fd !== undefined) { try { this.io.closeSync(fd); } catch (_closeError) {} }
      try { this.io.unlinkSync(temporary); } catch (_unlinkError) {}
      this.available = false; this.reason = 'GROUP_STORAGE_WRITE_FAILED'; fail(this.reason, 503);
    }
    const entry = { header, lesson: fromHeader(header), entries: [], dedup: new Map(), bytes };
    this.lessons.set(id, entry); this.bytes += bytes;
    return { ...this.snapshot(entry, { role: 'teacher', actor: 'teacher', seatId: null }), teacherToken };
  }
  authorize(id, token) {
    this.ready(); if (!ID.test(id || '')) fail('GROUP_NOT_FOUND', 404);
    const entry = this.lessons.get(id); if (!entry) fail('GROUP_NOT_FOUND', 404);
    if (matching(token, entry.header.teacherHash)) return { entry, auth: { role: 'teacher', actor: 'teacher', seatId: null } };
    const seat = entry.header.students.find(student => matching(token, hash(student.studentToken)));
    if (!seat) fail('GROUP_UNAUTHORIZED', 401);
    this.online.set(`${id}:${seat.id}`, Date.now());
    return { entry, auth: { role: 'student', actor: seat.id, seatId: seat.id } };
  }
  snapshot(entry, auth, after) {
    if (after !== undefined) integer(after, 0, Number.MAX_SAFE_INTEGER);
    const lesson = entry.lesson;
    const snapshot = { id: lesson.id, title: lesson.title, createdAt: lesson.createdAt, revision: lesson.revision,
      role: auth.role, seatId: auth.seatId, students: lesson.students.filter(student => auth.role === 'teacher' || student.id === auth.seatId)
        .map(student => ({ id: student.id, name: student.name, help: student.help,
          online: Date.now() - (this.online.get(`${lesson.id}:${student.id}`) || 0) < 15000,
          ...(after === undefined || student.workspace.revision > after ? { workspace: copy(student.workspace) } : {}) })),
      durable: true };
    if (after === undefined || lesson.common.revision > after) snapshot.common = copy(lesson.common);
    const presentationTarget = lesson.presentationTarget;
    snapshot.presentation = { target: presentationTarget };
    if (presentationTarget !== null) {
      const presentedWorkspace = workspace(lesson, presentationTarget);
      snapshot.presentation.name = presentationTarget === 'common' ? 'Общая доска'
        : lesson.students.find(student => student.id === presentationTarget).name;
      if (after === undefined || lesson.presentationRevision > after || presentedWorkspace.revision > after) {
        snapshot.presentation.workspace = copy(presentedWorkspace);
      }
    }
    if (after !== undefined) snapshot.partial = true;
    if (auth.role === 'teacher' && after === undefined) snapshot.invites = entry.header.students.map(student => ({ id: student.id, name: student.name, studentToken: student.studentToken }));
    return snapshot;
  }
  normalizeAction(entry, auth, action) {
    exactKeys(action, ['opId', 'target', 'type', 'payload', 'assignmentId', 'expectedVersion'], ['opId', 'type', 'payload']);
    requireValue(ID.test(action.opId || ''));
    requireValue(Buffer.byteLength(JSON.stringify(action)) <= this.limits.actionBytes, 'GROUP_ACTION_TOO_LARGE');
    safeJson(action);
    const { type, target, payload } = action, lesson = entry.lesson;
    requireValue(['assign', 'trainer', 'stroke', 'undo', 'erase', 'help', 'control', 'present'].includes(type));
    const record = { opId: action.opId, actor: auth.actor, revision: lesson.revision + 1, at: new Date().toISOString(),
      type, target: type === 'assign' ? null : target, payload: null, fingerprint: hash(canonical(action)) };
    if (type === 'present') {
      if (auth.role !== 'teacher') fail('GROUP_FORBIDDEN', 403);
      requireValue(target === 'common', 'GROUP_TARGET_INVALID');
      exactKeys(payload, ['target'], ['target']);
      requireValue(payload.target === null || !!workspace(lesson, payload.target), 'GROUP_TARGET_INVALID');
      record.payload = { target: payload.target };
      return record;
    }
    if (type === 'assign') {
      if (auth.role !== 'teacher') fail('GROUP_FORBIDDEN', 403);
      exactKeys(payload, ['targets', 'trainerId', 'initialState'], ['targets', 'trainerId']);
      requireValue(Array.isArray(payload.targets) && payload.targets.length >= 1 && payload.targets.length <= 9
        && new Set(payload.targets).size === payload.targets.length && payload.targets.every(item => !!workspace(lesson, item)));
      requireValue(payload.trainerId === null || TRAINERS.some(trainer => trainer.id === payload.trainerId), 'GROUP_TRAINER_NOT_ALLOWED');
      const initialState = payload.initialState == null ? null : normalizeState(payload.trainerId, payload.initialState);
      record.payload = { targets: [...payload.targets], trainerId: payload.trainerId, initialState,
        assignments: Object.fromEntries(payload.targets.map(item => [item, makeId()])) };
      return record;
    }
    const work = workspace(lesson, target); requireValue(!!work, 'GROUP_TARGET_INVALID');
    if (auth.role !== 'teacher' && (target !== auth.seatId || type === 'control')) fail('GROUP_FORBIDDEN', 403);
    if (action.assignmentId !== work.assignmentId) fail('GROUP_ASSIGNMENT_STALE', 409);
    record.assignmentId = action.assignmentId;
    if (type === 'trainer') {
      exactKeys(payload, ['state'], ['state']);
      if (work.controller !== auth.role) fail('GROUP_CONTROL_REQUIRED', 409);
      if (action.expectedVersion !== work.trainerVersion) fail('GROUP_STATE_CONFLICT', 409);
      record.payload = { state: normalizeState(work.trainerId, payload.state) };
    } else if (type === 'control') {
      exactKeys(payload, ['controller'], ['controller']);
      requireValue(['teacher', 'student'].includes(payload.controller) && (target !== 'common' || payload.controller === 'teacher'));
      record.payload = { controller: payload.controller };
    } else if (type === 'stroke') {
      exactKeys(payload, ['id', 'points', 'color', 'width'], ['id', 'points', 'color', 'width']);
      requireValue(ID.test(payload.id || '') && /^#[a-f0-9]{6}$/i.test(payload.color || '')
        && typeof payload.width === 'number' && payload.width >= 0.5 && payload.width <= 12);
      requireValue(Array.isArray(payload.points) && payload.points.length >= 1 && payload.points.length <= this.limits.points);
      for (const point of payload.points) {
        exactKeys(point, ['x', 'y'], ['x', 'y']);
        requireValue(typeof point.x === 'number' && point.x >= 0 && point.x <= 1 && typeof point.y === 'number' && point.y >= 0 && point.y <= 1);
      }
      if (entry.entries.some(previous => previous.type === 'stroke' && previous.payload.id === payload.id)) fail('GROUP_STROKE_ID_EXISTS', 409);
      if (work.strokes.length >= this.limits.strokes) fail('GROUP_STROKE_LIMIT_EXCEEDED', 507);
      record.payload = copy(payload);
    } else if (type === 'erase') {
      exactKeys(payload, ['strokeId'], ['strokeId']); requireValue(ID.test(payload.strokeId || ''));
      const stroke = work.strokes.find(item => item.id === payload.strokeId);
      if (!stroke) fail('GROUP_STROKE_NOT_FOUND', 409);
      if (stroke.author !== auth.actor) fail('GROUP_FORBIDDEN', 403);
      record.payload = { strokeId: stroke.id };
    } else if (type === 'undo') {
      exactKeys(payload, []);
      const stroke = [...work.strokes].reverse().find(item => item.author === auth.actor);
      if (!stroke) fail('GROUP_NOTHING_TO_UNDO', 409);
      record.payload = { strokeId: stroke.id };
    } else if (type === 'help') {
      exactKeys(payload, ['active'], ['active']); requireValue(target !== 'common' && typeof payload.active === 'boolean');
      record.payload = { active: payload.active };
    }
    return record;
  }
  action(entry, auth, action) {
    this.ready();
    const duplicate = plain(action) && ID.test(action.opId || '') && entry.dedup.get(`${auth.actor}:${action.opId}`);
    if (duplicate) {
      if (duplicate !== hash(canonical(action))) fail('GROUP_OP_ID_CONFLICT', 409);
      return { ...this.snapshot(entry, auth), opId: action.opId, duplicate: true };
    }
    const record = this.normalizeAction(entry, auth, action), serialized = `${JSON.stringify(record)}\n`, bytes = Buffer.byteLength(serialized);
    if (entry.entries.length >= this.limits.events || entry.bytes + bytes > this.limits.lessonBytes || this.bytes + bytes > this.limits.totalBytes) {
      fail('GROUP_STORE_LIMIT_EXCEEDED', 507);
    }
    const filePath = path.join(this.directory, `${entry.header.id}.jsonl`);
    let fd, appendStarted = false;
    try {
      fd = this.io.openSync(filePath, 'r+');
      requireValue(this.io.fstatSync(fd).size === entry.bytes, 'GROUP_STORAGE_CONFLICT');
      appendStarted = true;
      const buffer = Buffer.from(serialized); let written = 0;
      while (written < buffer.length) {
        const count = this.io.writeSync(fd, buffer, written, buffer.length - written, entry.bytes + written);
        if (!count) throw new Error('Incomplete write');
        written += count;
      }
      this.io.fsyncSync(fd);
    } catch (_error) {
      if (fd !== undefined && appendStarted) { try { this.io.ftruncateSync(fd, entry.bytes); this.io.fsyncSync(fd); } catch (_rollbackError) {} }
      this.available = false; this.reason = 'GROUP_STORAGE_WRITE_FAILED'; fail(this.reason, 503);
    } finally { if (fd !== undefined) { try { this.io.closeSync(fd); } catch (_error) {} } }
    // No observable state changes until the durable append succeeds.
    applyRecord(entry.lesson, record); entry.entries.push(record); entry.dedup.set(`${auth.actor}:${record.opId}`, record.fingerprint);
    entry.bytes += bytes; this.bytes += bytes;
    return { ...this.snapshot(entry, auth), opId: record.opId, duplicate: false };
  }
  history(entry, auth, { target, after = 0, limit = 100, through = entry.lesson.revision }) {
    requireValue(!!workspace(entry.lesson, target), 'GROUP_TARGET_INVALID');
    if (auth.role !== 'teacher' && target !== auth.seatId && target !== 'common') fail('GROUP_FORBIDDEN', 403);
    integer(through, 0, entry.lesson.revision); integer(after, 0, through); integer(limit, 1, 100);
    const initialWorkspace = copy(workspace(fromHeader(entry.header), target)), events = [];
    let hasMore = false, help = false;
    for (const record of entry.entries) {
      if (record.revision > through) break;
      if (!affected(record).includes(target)) continue;
      if (record.type === 'assign') help = false;
      if (record.type === 'help') help = record.payload.active;
      if (record.revision <= after) continue;
      if (events.length === limit) { hasMore = true; break; }
      const payload = record.type === 'assign'
        ? { trainerId: record.payload.trainerId, initialState: copy(record.payload.initialState), assignmentId: record.payload.assignments[target] }
        : copy(record.payload);
      events.push({ revision: record.revision, at: record.at, actor: record.actor, type: record.type, target, payload,
        help });
    }
    return { format: 'events-v1', initialWorkspace, target, events, nextAfter: events.at(-1)?.revision || after, hasMore, revision: through };
  }
}

function createGroupLessonsRouter(options = {}) {
  const store = new GroupLessonStore(options), router = express.Router(), buckets = new Map();
  function allow(key, capacity, refillPerSecond) {
    const now = Date.now(), current = buckets.get(key) || { at: now, tokens: capacity };
    current.tokens = Math.min(capacity, current.tokens + ((now - current.at) / 1000) * refillPerSecond); current.at = now;
    if (buckets.size > 10000) for (const [oldKey, bucket] of buckets) if (now - bucket.at > 3600000) buckets.delete(oldKey);
    if (!buckets.has(key) && buckets.size >= 10000) fail('GROUP_RATE_LIMITED', 429);
    buckets.set(key, current); if (current.tokens < 1) fail('GROUP_RATE_LIMITED', 429); current.tokens--;
  }
  function handler(callback) {
    return (req, res) => {
      try { callback(req, res); }
      catch (error) {
        const known = error instanceof GroupLessonError;
        res.status(known ? error.status : 500).json({ ok: false, error: known ? error.code : 'GROUP_INTERNAL_ERROR' });
      }
    };
  }
  function authRequest(req) {
    // Tokens deliberately never accepted in query strings or request bodies.
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('authorization') || '');
    return store.authorize(req.params.id, match?.[1] || '');
  }
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('Pragma', 'no-cache'); next(); });
  router.get('/status', (_req, res) => res.json(store.status()));
  router.post('/', handler((req, res) => {
    allow(`create:${req.socket.remoteAddress}`, 10, 10 / 3600);
    res.status(201).json(store.create(req.body));
  }));
  router.get('/:id', handler((req, res) => {
    const { entry, auth } = authRequest(req); allow(`read:${entry.header.id}:${auth.actor}`, 60, 10);
    res.json(store.snapshot(entry, auth, req.query.after === undefined ? undefined : Number(req.query.after)));
  }));
  router.post('/:id/actions', handler((req, res) => {
    const { entry, auth } = authRequest(req); allow(`write:${entry.header.id}:${auth.actor}`, 40, 10);
    res.json(store.action(entry, auth, req.body));
  }));
  router.get('/:id/history', handler((req, res) => {
    const { entry, auth } = authRequest(req); allow(`history:${entry.header.id}:${auth.actor}`, 10, 1);
    res.json(store.history(entry, auth, { target: req.query.target, after: Number(req.query.after || 0), limit: Number(req.query.limit || 100),
      ...(req.query.through === undefined ? {} : { through: Number(req.query.through) }) }));
  }));
  return { router, store };
}

module.exports = { createGroupLessonsRouter, GroupLessonStore, GroupLessonError, TRAINERS, LIMITS, normalizeState };
