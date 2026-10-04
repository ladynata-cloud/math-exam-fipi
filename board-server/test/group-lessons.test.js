'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const express = require('express');
const { GroupLessonStore, createGroupLessonsRouter } = require('../group-lessons');

const opId = () => crypto.randomUUID();
const negative = (a = -5, b = 3) => ({ seed: '', mode: 'add', level: 'easy', task: { a, b, op: '+', res: a + b, label: `${a} + ${b}` },
  phase: 'start', answer: '', correctAnswer: a + b, hintCount: 0, taskNo: 1,
  visual: { start: null, end: null, traveler: null, arc: null, wrong: null }, answerDisabled: true, checkDisabled: true,
  instructionText: 'Найдите первое число', instructionClass: 'instr', feedbackText: '', feedbackClass: 'feedback', hintText: '', hintVisible: false });
const inequality = () => ({ problemIndex: 0, taskIndex: 0, taskNumber: 1, currentStep: 0, shownSteps: [], answerSign: 'lt', answerValue: '',
  feedbackText: 'Выберите шаг', feedbackClass: 'fb', numberLine: { visible: false, sign: null, value: null }, done: false,
  problemText: '−3 − x > 4x + 7' });

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'group-lessons-test-'));
  const store = new GroupLessonStore({ directory, ...options });
  t.after(() => { store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const initial = store.create({ title: 'База ЕГЭ', names: Array.from({ length: 8 }, (_unused, i) => `Ученик ${i + 1}`) });
  const access = token => store.authorize(initial.id, token);
  const teacher = () => access(initial.teacherToken);
  const student = n => access(initial.invites[n - 1].studentToken);
  const act = (who, type, target, payload, extra = {}) => {
    const { entry, auth } = who();
    const work = target === 'common' ? entry.lesson.common : entry.lesson.students.find(item => item.id === target)?.workspace;
    return store.action(entry, auth, { opId: opId(), type, ...(target === undefined ? {} : { target }), payload,
      ...(type === 'assign' || type === 'present' ? {} : { assignmentId: work.assignmentId }), ...extra });
  };
  return { store, initial, directory, teacher, student, act };
}
function expectCode(action, code, status) {
  assert.throws(action, error => error.code === code && (status === undefined || error.status === status));
}
function replay(history) {
  let work = structuredClone(history.initialWorkspace);
  const snapshots = [];
  for (const event of history.events) {
    const payload = event.payload;
    if (event.type === 'assign') work = { assignmentId: payload.assignmentId, trainerId: payload.trainerId,
      trainerState: structuredClone(payload.initialState), strokes: [], controller: history.target === 'common' ? 'teacher' : 'student',
      revision: event.revision, trainerVersion: 0 };
    if (event.type === 'trainer') { work.trainerState = structuredClone(payload.state); work.trainerVersion++; }
    if (event.type === 'control') { work.controller = payload.controller; work.trainerVersion++; }
    if (event.type === 'stroke') work.strokes.push({ ...structuredClone(payload), author: event.actor, at: event.at });
    if (event.type === 'undo' || event.type === 'erase') work.strokes = work.strokes.filter(stroke => stroke.id !== payload.strokeId);
    work.revision = event.revision; snapshots.push(structuredClone(work));
  }
  return { work, snapshots };
}

test('eight independent seats: teacher sees all; learner sees only self, common, never invitation tokens', t => {
  const f = fixture(t);
  assert.equal(f.initial.students.length, 8);
  assert.equal(new Set(f.initial.invites.map(item => item.studentToken)).size, 8);
  for (let n = 1; n <= 8; n++) {
    const { entry, auth } = f.student(n), snapshot = f.store.snapshot(entry, auth);
    assert.equal(snapshot.students.length, 1); assert.equal(snapshot.students[0].id, `s${n}`);
    assert.equal(snapshot.students[0].online, true);
    assert.equal(snapshot.role, 'student'); assert.ok(snapshot.common);
    assert.equal(snapshot.invites, undefined); assert.equal(snapshot.teacherToken, undefined);
    for (const invite of f.initial.invites) assert.equal(JSON.stringify(snapshot).includes(invite.studentToken), false);
    if (n !== 1) expectCode(() => f.act(() => f.student(n), 'help', 's1', { active: true }), 'GROUP_FORBIDDEN', 403);
  }
  expectCode(() => f.act(() => f.student(1), 'assign', undefined,
    { targets: ['s1'], trainerId: 'negative-numbers-line' }), 'GROUP_FORBIDDEN', 403);
  expectCode(() => f.act(() => f.student(1), 'help', 'common', { active: true }), 'GROUP_FORBIDDEN', 403);
  expectCode(() => f.store.create({ title: 'Too many', names: Array(9).fill('Ученик') }), 'GROUP_PAYLOAD_INVALID');
});

test('same assignment clones are independent and per-seat trainer control does not pause other students', t => {
  const f = fixture(t), targets = f.initial.students.map(item => item.id);
  f.act(f.teacher, 'assign', undefined, { targets, trainerId: 'negative-numbers-line', initialState: negative() });
  const { entry } = f.teacher(), first = entry.lesson.students[0], second = entry.lesson.students[1];
  assert.notEqual(first.workspace.assignmentId, second.workspace.assignmentId);
  assert.notEqual(first.workspace.trainerState, second.workspace.trainerState);
  f.act(() => f.student(1), 'trainer', 's1', { state: { ...negative(), answer: '-2', phase: 'answer' } }, { expectedVersion: 0 });
  assert.equal(second.workspace.trainerState.answer, '');
  f.act(f.teacher, 'control', 's1', { controller: 'teacher' });
  expectCode(() => f.act(() => f.student(1), 'trainer', 's1', { state: negative() }, { expectedVersion: 2 }), 'GROUP_CONTROL_REQUIRED', 409);
  f.act(() => f.student(2), 'trainer', 's2', { state: { ...negative(), hintCount: 1 } }, { expectedVersion: 0 });
  f.act(f.teacher, 'trainer', 's1', { state: { ...negative(), phase: 'end' } }, { expectedVersion: 2 });
  f.act(f.teacher, 'control', 's1', { controller: 'student' });
  expectCode(() => f.act(f.teacher, 'trainer', 's1', { state: negative() }, { expectedVersion: 4 }), 'GROUP_CONTROL_REQUIRED', 409);
  f.act(() => f.student(1), 'trainer', 's1', { state: negative() }, { expectedVersion: 4 });
  f.act(f.teacher, 'assign', undefined, { targets: ['s2'], trainerId: 'linear-inequalities-stepwise', initialState: inequality() });
  assert.equal(entry.lesson.students[0].workspace.trainerId, 'negative-numbers-line');
  assert.equal(entry.lesson.students[1].workspace.trainerId, 'linear-inequalities-stepwise');
});

test('common workspace is teacher-controlled and all learners may observe its history', t => {
  const f = fixture(t);
  f.act(f.teacher, 'assign', undefined, { targets: ['common'], trainerId: 'linear-inequalities-stepwise', initialState: inequality() });
  f.act(f.teacher, 'trainer', 'common', { state: { ...inequality(), currentStep: 1 } }, { expectedVersion: 0 });
  const { entry, auth } = f.student(3);
  assert.equal(f.store.snapshot(entry, auth).common.trainerState.currentStep, 1);
  assert.equal(f.store.history(entry, auth, { target: 'common' }).events.length, 2);
  expectCode(() => f.act(() => f.student(3), 'trainer', 'common', { state: inequality() }, { expectedVersion: 1 }), 'GROUP_FORBIDDEN', 403);
  expectCode(() => f.store.history(entry, auth, { target: 's2' }), 'GROUP_FORBIDDEN', 403);
});

test('all four pilot inequalities, including a literal less-than variable, preserve complete valid states', t => {
  const f = fixture(t);
  const problems = ['−3 − x > 4x + 7', '5x + 4 < x + 6', '6x − 3(4x + 1) > 6', '8x − 3(3x + 8) ≥ 9'];
  problems.forEach((problemText, problemIndex) => {
    const state = { ...inequality(), problemIndex, taskIndex: problemIndex, taskNumber: problemIndex + 1, problemText };
    f.act(f.teacher, 'assign', undefined, { targets: ['s1'], trainerId: 'linear-inequalities-stepwise', initialState: state });
    f.act(() => f.student(1), 'trainer', 's1', { state }, { expectedVersion: 0 });
    assert.equal(f.teacher().entry.lesson.students[0].workspace.trainerState.problemText, problemText);
  });
});

test('partial polling carries statuses for all visible seats but only changed workspaces, never invites', t => {
  const f = fixture(t), teacher = f.teacher();
  let partial = f.store.snapshot(teacher.entry, teacher.auth, 0);
  assert.equal(partial.partial, true); assert.equal(partial.invites, undefined); assert.equal(partial.common, undefined);
  assert.equal(partial.students.length, 8); assert.ok(partial.students.every(student => student.workspace === undefined));
  f.act(() => f.student(1), 'help', 's1', { active: true });
  partial = f.store.snapshot(teacher.entry, teacher.auth, 0);
  assert.equal(partial.students[0].help, true); assert.ok(partial.students[0].workspace);
  assert.ok(partial.students.slice(1).every(student => student.workspace === undefined));
  const learner = f.student(2), privatePartial = f.store.snapshot(learner.entry, learner.auth, 0);
  assert.deepEqual(privatePartial.students.map(student => student.id), ['s2']); assert.equal(privatePartial.students[0].workspace, undefined);
  expectCode(() => f.store.snapshot(teacher.entry, teacher.auth, -1), 'GROUP_PAYLOAD_INVALID');
});

test('teacher explicitly shares one live peer workspace; observers retain only their own write/history access', t => {
  const f = fixture(t);
  f.act(f.teacher, 'assign', undefined, { targets: ['s1', 's2'], trainerId: 'negative-numbers-line', initialState: negative() });
  const observer = f.student(2);
  assert.deepEqual(f.store.snapshot(observer.entry, observer.auth).presentation, { target: null });
  f.act(f.teacher, 'present', 'common', { target: 's1' });
  let snapshot = f.store.snapshot(observer.entry, observer.auth);
  assert.equal(snapshot.presentation.target, 's1'); assert.equal(snapshot.presentation.name, 'Ученик 1');
  assert.deepEqual(snapshot.presentation.workspace, observer.entry.lesson.students[0].workspace);
  assert.deepEqual(snapshot.students.map(student => student.id), ['s2']); assert.equal(snapshot.invites, undefined);
  expectCode(() => f.act(() => f.student(2), 'present', 'common', { target: 's2' }), 'GROUP_FORBIDDEN', 403);
  expectCode(() => f.act(() => f.student(2), 'trainer', 's1', { state: negative() }, { expectedVersion: 0 }), 'GROUP_FORBIDDEN', 403);
  expectCode(() => f.store.history(observer.entry, observer.auth, { target: 's1' }), 'GROUP_FORBIDDEN', 403);
  f.act(() => f.student(1), 'trainer', 's1', { state: { ...negative(), answer: '-2' } }, { expectedVersion: 0 });
  snapshot = f.store.snapshot(observer.entry, observer.auth);
  assert.equal(snapshot.presentation.workspace.trainerState.answer, '-2');
  f.act(() => f.student(2), 'trainer', 's2', { state: { ...negative(), hintCount: 1 } }, { expectedVersion: 0 });
  assert.equal(observer.entry.lesson.students[1].workspace.trainerState.hintCount, 1);
  const teacher = f.teacher();
  assert.deepEqual(f.store.history(teacher.entry, teacher.auth, { target: 's1' }).events.map(event => event.type), ['assign', 'trainer']);
  assert.equal(f.store.history(observer.entry, observer.auth, { target: 'common' }).events.length, 0);
});

test('presentation partial polling follows live edits, switches old workspaces correctly and stops sharing', t => {
  const f = fixture(t), observer = f.student(8);
  f.act(f.teacher, 'assign', undefined, { targets: ['s1', 's2'], trainerId: 'negative-numbers-line', initialState: negative() });
  const beforePublish = observer.entry.lesson.revision;
  f.act(f.teacher, 'present', 'common', { target: 's1' });
  let partial = f.store.snapshot(observer.entry, observer.auth, beforePublish);
  assert.equal(partial.presentation.target, 's1'); assert.ok(partial.presentation.workspace);
  const published = partial.revision;
  partial = f.store.snapshot(observer.entry, observer.auth, published);
  assert.equal(partial.presentation.target, 's1'); assert.equal(partial.presentation.workspace, undefined);
  f.act(() => f.student(1), 'trainer', 's1', { state: { ...negative(), hintCount: 1 } }, { expectedVersion: 0 });
  partial = f.store.snapshot(observer.entry, observer.auth, published);
  assert.equal(partial.presentation.workspace.trainerState.hintCount, 1);
  const beforeSwitch = partial.revision;
  f.act(f.teacher, 'present', 'common', { target: 's2' });
  partial = f.store.snapshot(observer.entry, observer.auth, beforeSwitch);
  assert.equal(partial.presentation.target, 's2'); assert.ok(partial.presentation.workspace);
  assert.equal(partial.presentation.workspace.trainerState.hintCount, 0);
  const beforeCommon = partial.revision;
  f.act(f.teacher, 'present', 'common', { target: 'common' });
  partial = f.store.snapshot(observer.entry, observer.auth, beforeCommon);
  assert.equal(partial.presentation.target, 'common'); assert.deepEqual(partial.presentation.workspace, observer.entry.lesson.common);
  const beforeStop = partial.revision;
  f.act(f.teacher, 'present', 'common', { target: null });
  partial = f.store.snapshot(observer.entry, observer.auth, beforeStop);
  assert.deepEqual(partial.presentation, { target: null });
  assert.deepEqual(f.store.snapshot(observer.entry, observer.auth).presentation, { target: null });
  expectCode(() => f.act(f.teacher, 'present', 'common', { target: 's9' }), 'GROUP_TARGET_INVALID');
  expectCode(() => f.act(f.teacher, 'present', 's1', { target: 's1' }), 'GROUP_TARGET_INVALID');
});

test('presentation channel survives restart and its same-op retry does not change revision', t => {
  const f = fixture(t);
  f.act(f.teacher, 'assign', undefined, { targets: ['s3'], trainerId: 'linear-inequalities-stepwise', initialState: inequality() });
  const teacher = f.teacher(), action = { opId: opId(), type: 'present', target: 'common', payload: { target: 's3' } };
  f.store.action(teacher.entry, teacher.auth, action);
  const revision = teacher.entry.lesson.revision; f.store.close();
  const restarted = new GroupLessonStore({ directory: f.directory }); t.after(() => restarted.close());
  const observer = restarted.authorize(f.initial.id, f.initial.invites[0].studentToken);
  const snapshot = restarted.snapshot(observer.entry, observer.auth);
  assert.equal(snapshot.presentation.target, 's3'); assert.equal(snapshot.presentation.workspace.trainerId, 'linear-inequalities-stepwise');
  assert.deepEqual(snapshot.students.map(student => student.id), ['s1']);
  const restoredTeacher = restarted.authorize(f.initial.id, f.initial.teacherToken);
  assert.equal(restarted.action(restoredTeacher.entry, restoredTeacher.auth, action).duplicate, true);
  assert.equal(restoredTeacher.entry.lesson.revision, revision);
});

test('reassignment and version fences reject stale state and idempotent retries remain safe', t => {
  const f = fixture(t);
  f.act(f.teacher, 'assign', undefined, { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() });
  const { entry, auth } = f.student(1), firstAssignment = entry.lesson.students[0].workspace.assignmentId;
  const action = { opId: opId(), type: 'trainer', target: 's1', assignmentId: firstAssignment, expectedVersion: 0, payload: { state: negative() } };
  const accepted = f.store.action(entry, auth, action), count = entry.entries.length;
  assert.equal(f.store.action(entry, auth, action).duplicate, true); assert.equal(entry.entries.length, count);
  assert.equal(entry.lesson.revision, accepted.revision);
  expectCode(() => f.store.action(entry, auth, { ...action, payload: { state: negative(-4, 3) } }), 'GROUP_OP_ID_CONFLICT', 409);
  expectCode(() => f.store.action(entry, auth, { ...action, opId: opId() }), 'GROUP_STATE_CONFLICT', 409);
  f.act(f.teacher, 'assign', undefined, { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative(-4, 3) });
  expectCode(() => f.store.action(entry, auth, { ...action, opId: opId() }), 'GROUP_ASSIGNMENT_STALE', 409);
  assert.equal(f.store.action(entry, auth, action).duplicate, true);
  assert.equal(entry.lesson.students[0].workspace.trainerState.task.a, -4);
});

test('concurrent handwriting preserves separate authors, immutable IDs, own-only eraser and own-last undo', t => {
  const f = fixture(t), ink = id => ({ id, color: '#15803d', width: 3, points: [{ x: 0.1, y: 0.2 }, { x: 0.2, y: 0.3 }] });
  const a = opId(), b = opId(), c = opId();
  f.act(() => f.student(1), 'stroke', 's1', ink(a));
  f.act(f.teacher, 'stroke', 's1', ink(b));
  f.act(() => f.student(1), 'stroke', 's1', ink(c));
  let { entry } = f.teacher();
  assert.deepEqual(entry.lesson.students[0].workspace.strokes.map(s => s.author), ['s1', 'teacher', 's1']);
  expectCode(() => f.act(f.teacher, 'erase', 's1', { strokeId: a }), 'GROUP_FORBIDDEN', 403);
  expectCode(() => f.act(() => f.student(1), 'erase', 's1', { strokeId: b }), 'GROUP_FORBIDDEN', 403);
  f.act(f.teacher, 'undo', 's1', {});
  assert.deepEqual(entry.lesson.students[0].workspace.strokes.map(s => s.id), [a, c]);
  f.act(() => f.student(1), 'undo', 's1', {});
  assert.deepEqual(entry.lesson.students[0].workspace.strokes.map(s => s.id), [a]);
  f.act(() => f.student(1), 'erase', 's1', { strokeId: a });
  expectCode(() => f.act(() => f.student(1), 'stroke', 's1', ink(a)), 'GROUP_STROKE_ID_EXISTS', 409);
  const history = f.store.history(entry, f.teacher().auth, { target: 's1' });
  assert.equal(history.format, 'events-v1');
  const reconstructed = replay(history);
  assert.equal(reconstructed.snapshots[2].strokes.length, 3);
  assert.equal(reconstructed.work.strokes.length, 0);
  assert.deepEqual(reconstructed.work, entry.lesson.students[0].workspace);
  assert.ok(history.events.every(event => !Object.hasOwn(event, 'workspace')));
});

test('restart restores credentials, history, cloned assignments and dedup without token leaks in history', t => {
  const f = fixture(t);
  f.act(f.teacher, 'assign', undefined, { targets: ['s1', 's2'], trainerId: 'negative-numbers-line', initialState: negative() });
  f.act(() => f.student(1), 'help', 's1', { active: true });
  const { entry, auth } = f.student(1), action = { opId: opId(), type: 'trainer', target: 's1', expectedVersion: 0,
    assignmentId: entry.lesson.students[0].workspace.assignmentId, payload: { state: { ...negative(), hintCount: 2 } } };
  f.store.action(entry, auth, action);
  const original = f.store.snapshot(entry, f.teacher().auth);
  f.store.close();
  const restarted = new GroupLessonStore({ directory: f.directory }); t.after(() => restarted.close());
  assert.equal(restarted.status().available, true);
  const teacher = restarted.authorize(f.initial.id, f.initial.teacherToken);
  const restored = restarted.snapshot(teacher.entry, teacher.auth);
  assert.equal(restored.revision, original.revision); assert.deepEqual(restored.invites, original.invites);
  assert.equal(restored.students[0].help, true); assert.equal(restored.students[0].workspace.trainerState.hintCount, 2);
  const learner = restarted.authorize(f.initial.id, f.initial.invites[0].studentToken);
  assert.equal(restarted.action(learner.entry, learner.auth, action).duplicate, true);
  const page1 = restarted.history(learner.entry, learner.auth, { target: 's1', limit: 2 });
  assert.equal(page1.events.length, 2); assert.equal(page1.hasMore, true);
  const page2 = restarted.history(learner.entry, learner.auth, { target: 's1', after: page1.nextAfter, limit: 2 });
  assert.equal(page2.events.length, 1); assert.equal(page2.hasMore, false);
  assert.equal(JSON.stringify(page1).includes('s2'), false);
  assert.equal(JSON.stringify(page1).includes('studentToken'), false);
  assert.deepEqual(replay({ ...page1, events: [...page1.events, ...page2.events] }).work, learner.entry.lesson.students[0].workspace);
  assert.equal(fs.statSync(path.join(f.directory, `${f.initial.id}.jsonl`)).mode & 0o777, 0o600);
});

test('history pagination freezes its revision while new live work continues', t => {
  const f = fixture(t);
  f.act(f.teacher, 'assign', undefined, { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() });
  f.act(() => f.student(1), 'help', 's1', { active: true });
  const teacher = f.teacher(), page1 = f.store.history(teacher.entry, teacher.auth, { target: 's1', limit: 1 });
  f.act(() => f.student(1), 'trainer', 's1', { state: { ...negative(), hintCount: 1 } }, { expectedVersion: 0 });
  const page2 = f.store.history(teacher.entry, teacher.auth, { target: 's1', after: page1.nextAfter, through: page1.revision, limit: 1 });
  assert.equal(page2.revision, 2); assert.equal(page2.hasMore, false);
  assert.deepEqual([...page1.events, ...page2.events].map(event => event.type), ['assign', 'help']);
  assert.equal(teacher.entry.lesson.revision, 3);
});

test('schema rejects unsafe trainers, HTML in state, nonnumeric task values and malformed strokes', t => {
  const f = fixture(t), assign = state => f.act(f.teacher, 'assign', undefined,
    { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: state });
  expectCode(() => f.act(f.teacher, 'assign', undefined, { targets: ['s1'], trainerId: '../evil.html' }), 'GROUP_TRAINER_NOT_ALLOWED');
  expectCode(() => assign({ ...negative(), feedbackText: '<img src=x onerror=alert(1)>' }), 'GROUP_PAYLOAD_INVALID');
  expectCode(() => assign({ ...negative(), task: { ...negative().task, a: '<script>' } }), 'GROUP_PAYLOAD_INVALID');
  expectCode(() => assign({ ...negative(), task: { ...negative().task, a: '-5' } }), 'GROUP_PAYLOAD_INVALID');
  expectCode(() => assign({ ...negative(), task: { ...negative().task, res: 8 } }), 'GROUP_PAYLOAD_INVALID');
  expectCode(() => assign(JSON.parse('{"__proto__":{"bad":true}}')), 'GROUP_PAYLOAD_INVALID');
  expectCode(() => f.act(() => f.student(1), 'stroke', 's1', { id: opId(), color: 'red', width: 3, points: [{ x: 2, y: 1 }] }), 'GROUP_PAYLOAD_INVALID');
  expectCode(() => f.store.create({ title: '<svg onload=alert(1)>', names: ['Ученик'] }), 'GROUP_PAYLOAD_INVALID');
  assert.equal(f.teacher().entry.lesson.revision, 0);
});

test('storage failure never exposes or acknowledges a mutation; caps preserve previous history', t => {
  const f = fixture(t), { entry, auth } = f.student(1);
  const initialSize = fs.statSync(path.join(f.directory, `${f.initial.id}.jsonl`)).size;
  f.store.io = { ...fs, fsyncSync() { throw new Error('simulated disk failure'); } };
  expectCode(() => f.act(() => f.student(1), 'help', 's1', { active: true }), 'GROUP_STORAGE_WRITE_FAILED', 503);
  assert.equal(entry.lesson.revision, 0); assert.equal(entry.lesson.students[0].help, false);
  assert.equal(entry.entries.length, 0); assert.equal(f.store.status().available, false);
  assert.equal(fs.statSync(path.join(f.directory, `${f.initial.id}.jsonl`)).size, initialSize);
  const g = fixture(t, { limits: { events: 1 } });
  g.act(() => g.student(1), 'help', 's1', { active: true });
  expectCode(() => g.act(() => g.student(1), 'help', 's1', { active: false }), 'GROUP_STORE_LIMIT_EXCEEDED', 507);
  assert.equal(g.teacher().entry.entries.length, 1); assert.equal(g.teacher().entry.lesson.students[0].help, true);
  assert.equal(new GroupLessonStore({ directory: '' }).status().reason, 'GROUP_STORAGE_NOT_CONFIGURED');
  expectCode(() => new GroupLessonStore({ directory: '' }).create({ title: 'x', names: ['y'] }), 'GROUP_STORAGE_NOT_CONFIGURED', 503);
});

test('one process owns persistent directory; incomplete trailing append recovers without dropping committed events', t => {
  const f = fixture(t);
  const concurrent = new GroupLessonStore({ directory: f.directory });
  assert.equal(concurrent.status().available, false);
  f.act(() => f.student(1), 'help', 's1', { active: true });
  f.store.close();
  fs.appendFileSync(path.join(f.directory, `${f.initial.id}.jsonl`), '{"revision":2,"unfinished":');
  const restored = new GroupLessonStore({ directory: f.directory }); t.after(() => restored.close());
  assert.equal(restored.status().available, true);
  const { entry } = restored.authorize(f.initial.id, f.initial.teacherToken);
  assert.equal(entry.lesson.revision, 1); assert.equal(entry.lesson.students[0].help, true);
});

test('persistent lock permits a new process identity when its PID has been reused', t => {
  const f = fixture(t), lock = JSON.parse(fs.readFileSync(path.join(f.directory, '.group-lessons.lock'))); f.store.close();
  fs.writeFileSync(path.join(f.directory, '.group-lessons.lock'), JSON.stringify({ ...lock, identity: 'old-boot:old-start-time', id: 'stale-lock' }));
  const restarted = new GroupLessonStore({ directory: f.directory }); t.after(() => restarted.close());
  assert.equal(restarted.status().available, true);
  assert.equal(restarted.authorize(f.initial.id, f.initial.teacherToken).entry.lesson.students.length, 8);
});

test('HTTP routes require bearer authentication, reject token query strings and rate limit creation', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'group-lessons-http-'));
  const app = express(); app.use(express.json({ limit: '2mb' }));
  const { router, store } = createGroupLessonsRouter({ directory }); app.use('/api/group-lessons', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}/api/group-lessons`;
  const request = async (url, method = 'GET', body, token) => {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
  };
  assert.equal((await request(`${base}/status`)).body.available, true);
  const created = await request(base, 'POST', { title: 'Урок', names: ['Первый', 'Второй'] });
  assert.equal(created.status, 201); assert.equal(created.cache, 'no-store');
  const lesson = created.body;
  assert.equal((await request(`${base}/${lesson.id}?token=${lesson.teacherToken}`)).status, 401);
  const student = await request(`${base}/${lesson.id}`, 'GET', undefined, lesson.invites[0].studentToken);
  assert.equal(student.status, 200); assert.equal(student.body.students.length, 1); assert.equal(student.body.invites, undefined);
  const denied = await request(`${base}/${lesson.id}/history?target=s2`, 'GET', undefined, lesson.invites[0].studentToken);
  assert.equal(denied.status, 403);
  const another = await request(base, 'POST', { title: 'Другой', names: ['Третий'] });
  assert.equal((await request(`${base}/${another.body.id}`, 'GET', undefined, lesson.invites[0].studentToken)).status, 401);
  for (let i = 0; i < 8; i++) assert.equal((await request(base, 'POST', { title: 'Урок', names: ['Ученик'] })).status, 201);
  assert.equal((await request(base, 'POST', { title: 'Урок', names: ['Ученик'] })).status, 429);
});
