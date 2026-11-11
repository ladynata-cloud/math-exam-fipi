'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const express = require('express');
const { GroupLessonStore, createGroupLessonsRouter } = require('../group-lessons');
const model = require('../../trainers/spacemath/model');

const uuid = () => crypto.randomUUID();
const construction = (x = 1 / 3) => ({ ...model.empty(), title: 'Треугольник', objects: [
  { id: 'A', type: 'point', label: 'A', x, y: 2 },
  { id: 'B', type: 'point', label: 'B', x: 4, y: -1 },
  { id: 'AB', type: 'segment', label: 'AB', parents: ['A', 'B'] }
] });
const negative = () => ({ task: { a: -5, b: 3, op: '+', res: -2 }, answer: '' });
const stroke = () => ({ id: uuid(), points: [{ x: .1, y: .2 }, { x: .3, y: .4 }], color: '#15803d', width: 3 });

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'group-geometry-'));
  const stores = [];
  let store = new GroupLessonStore({ directory }); stores.push(store);
  t.after(() => { stores.forEach(item => item.close()); fs.rmSync(directory, { recursive: true, force: true }); });
  const initial = store.create({ title: 'Единая доска', names: ['Первый', 'Второй', 'Третий'] });
  const token = role => role === 'teacher' ? initial.teacherToken : initial.invites[Number(role.slice(1)) - 1].studentToken;
  const auth = role => store.authorize(initial.id, token(role));
  const work = target => target === 'common' ? auth('teacher').entry.lesson.common : auth('teacher').entry.lesson.students.find(item => item.id === target).workspace;
  const action = (role, type, target, payload, extra = {}) => {
    const access = auth(role), body = { opId: uuid(), type, target, payload,
      ...(['assign', 'insert', 'present'].includes(type) ? {} : {
        assignmentId: ['geometry', 'geometry-control'].includes(type) ? work(target).geometryAssignmentId
          : ['stroke', 'erase', 'undo'].includes(type) ? work(target).boardAssignmentId : work(target).assignmentId
      }), ...extra };
    return store.action(access.entry, access.auth, body);
  };
  return { directory, initial, token, auth, work, action,
    get store() { return store; },
    restart() { store.close(); store = new GroupLessonStore({ directory }); stores.push(store); assert.equal(store.available, true); },
    snapshot(role, after) { const access = auth(role); return store.snapshot(access.entry, access.auth, after); },
    history(role, target) { const access = auth(role); return store.history(access.entry, access.auth, { target }); }
  };
}
function rejects(action, code, status = 400) {
  assert.throws(action, error => error.code === code && error.status === status);
}

test('geometry is immediately available without a trainer and remains independent for each seat', t => {
  const f = fixture(t);
  assert.deepEqual(f.work('s1').geometryState, model.empty());
  assert.equal(f.work('s1').geometryController, 'student');
  assert.equal(f.work('common').geometryController, 'teacher');
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  assert.deepEqual(f.work('s1').geometryState, construction());
  assert.deepEqual(f.work('s2').geometryState, model.empty());
  assert.equal(f.work('s1').trainerState, null);
  assert.equal(f.work('s1').trainerVersion, 0);
  assert.deepEqual(f.snapshot('s2').students.map(item => item.id), ['s2']);
  assert.equal(JSON.stringify(f.snapshot('s2')).includes('Треугольник'), false);
});

test('geometry permissions deny peer, observer, common and pupil control writes', t => {
  const f = fixture(t);
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'geometry' });
  for (const target of ['s1', 'common']) {
    rejects(() => f.action('s2', 'geometry', target, { state: construction() }, { expectedVersion: 0 }), 'GROUP_FORBIDDEN', 403);
    rejects(() => f.action('s2', 'geometry-control', target, { controller: 'student' }), 'GROUP_FORBIDDEN', 403);
  }
  rejects(() => f.action('s1', 'geometry-control', 's1', { controller: 'teacher' }), 'GROUP_FORBIDDEN', 403);
  rejects(() => f.action('teacher', 'geometry-control', 'common', { controller: 'student' }), 'GROUP_PAYLOAD_INVALID');
  rejects(() => f.history('s2', 's1'), 'GROUP_FORBIDDEN', 403);
  f.action('teacher', 'geometry', 'common', { state: construction(7) }, { expectedVersion: 0 });
  assert.equal(f.snapshot('s2').common.geometryState.objects[0].x, 7);
  assert.deepEqual(f.snapshot('s2').presentation.workspace.geometryState, model.empty());
});

test('geometry handoff fences obsolete edits without changing trainer control or version', t => {
  const f = fixture(t);
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  rejects(() => f.action('teacher', 'geometry', 's1', { state: construction(2) }, { expectedVersion: 1 }), 'GROUP_CONTROL_REQUIRED', 409);
  f.action('teacher', 'geometry-control', 's1', { controller: 'teacher' });
  assert.equal(f.work('s1').geometryVersion, 2);
  assert.equal(f.work('s1').controller, 'student');
  assert.equal(f.work('s1').trainerVersion, 0);
  rejects(() => f.action('s1', 'geometry', 's1', { state: construction(3) }, { expectedVersion: 2 }), 'GROUP_CONTROL_REQUIRED', 409);
  rejects(() => f.action('teacher', 'geometry', 's1', { state: construction(4) }, { expectedVersion: 1 }), 'GROUP_STATE_CONFLICT', 409);
  f.action('teacher', 'geometry', 's1', { state: construction(5) }, { expectedVersion: 2 });
  f.action('teacher', 'geometry-control', 's1', { controller: 'student' });
  rejects(() => f.action('s1', 'geometry', 's1', { state: construction(6) }), 'GROUP_STATE_CONFLICT', 409);
  f.action('s1', 'geometry', 's1', { state: construction(8) }, { expectedVersion: 4 });
  assert.equal(f.work('s1').geometryVersion, 5);
  assert.equal(f.work('s1').geometryState.objects[0].x, 8);
});

test('insertion preserves ink and geometry generations for in-flight writes while invalidating old trainer writes', t => {
  const f = fixture(t);
  const originalId = f.work('s1').assignmentId;
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  f.action('s1', 'stroke', 's1', stroke());
  f.action('teacher', 'stroke', 's1', stroke());
  f.action('teacher', 'geometry-control', 's1', { controller: 'teacher' });
  const before = structuredClone(f.work('s1'));
  f.action('teacher', 'insert', 's1', { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() });
  const after = f.work('s1');
  assert.notEqual(after.assignmentId, originalId);
  assert.deepEqual(after.geometryState, before.geometryState);
  assert.equal(after.geometryVersion, before.geometryVersion);
  assert.equal(after.geometryController, 'teacher');
  assert.deepEqual(after.strokes, before.strokes);
  assert.equal(after.trainerVersion, 0);
  assert.equal(after.controller, 'student');
  assert.equal(after.geometryAssignmentId, originalId);
  assert.equal(after.boardAssignmentId, originalId);
  // These requests were created before insertion but arrived afterwards. Their
  // own materials have not been replaced, so they must still be accepted.
  f.action('teacher', 'geometry', 's1', { state: construction(4) }, { assignmentId: originalId, expectedVersion: 2 });
  const delayedStroke = stroke();
  f.action('s1', 'stroke', 's1', delayedStroke, { assignmentId: originalId });
  assert.equal(f.work('s1').geometryState.objects[0].x, 4);
  assert.equal(f.work('s1').strokes.at(-1).id, delayedStroke.id);
  rejects(() => f.action('s1', 'trainer', 's1', { state: negative() }, { assignmentId: originalId, expectedVersion: 0 }), 'GROUP_ASSIGNMENT_STALE', 409);
  f.action('s1', 'trainer', 's1', { state: { ...negative(), answer: '-2' } }, { expectedVersion: 0 });
  const history = f.history('s1', 's1');
  assert.deepEqual(history.events.map(item => item.type), ['geometry', 'stroke', 'stroke', 'geometry-control', 'insert', 'geometry', 'stroke', 'trainer']);
  assert.equal(history.events[4].payload.assignmentId, after.assignmentId);
  assert.equal(history.events[4].payload.targets, undefined);
  assert.equal(history.events[4].payload.assignments, undefined);
  assert.deepEqual(history.initialWorkspace.geometryState, model.empty());
});

test('bulk insertion does not clone one pupil geometry or authored ink into another seat', t => {
  const f = fixture(t);
  f.action('s1', 'geometry', 's1', { state: construction(1) }, { expectedVersion: 0 });
  f.action('s2', 'geometry', 's2', { state: construction(2) }, { expectedVersion: 0 });
  f.action('s1', 'stroke', 's1', stroke());
  f.action('teacher', 'insert', 's1', { targets: ['s1', 's2', 'common'], trainerId: 'negative-numbers-line', initialState: negative() });
  assert.equal(f.work('s1').geometryState.objects[0].x, 1);
  assert.equal(f.work('s2').geometryState.objects[0].x, 2);
  assert.deepEqual(f.work('common').geometryState, model.empty());
  assert.equal(f.work('s1').strokes.length, 1);
  assert.equal(f.work('s2').strokes.length, 0);
  assert.equal(f.work('common').controller, 'teacher');
  assert.notEqual(f.work('s1').trainerState, f.work('s2').trainerState);
  rejects(() => f.action('s1', 'insert', 's1', { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() }), 'GROUP_FORBIDDEN', 403);
  rejects(() => f.action('teacher', 'insert', 's1', { targets: ['s1'], trainerId: 'spacemath', initialState: construction() }), 'GROUP_TRAINER_NOT_ALLOWED');
});

test('legacy assign intentionally starts a new whole work while old journals gain empty geometry defaults', t => {
  const f = fixture(t);
  const originalId = f.work('s1').assignmentId;
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  f.action('s1', 'stroke', 's1', stroke());
  f.action('teacher', 'assign', 's1', { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() });
  assert.deepEqual(f.work('s1').geometryState, model.empty());
  assert.equal(f.work('s1').geometryVersion, 0);
  assert.equal(f.work('s1').strokes.length, 0);
  assert.notEqual(f.work('s1').geometryAssignmentId, originalId);
  assert.notEqual(f.work('s1').boardAssignmentId, originalId);
  assert.equal(f.work('s1').geometryAssignmentId, f.work('s1').assignmentId);
  assert.equal(f.work('s1').boardAssignmentId, f.work('s1').assignmentId);
  for (const [role, type, payload] of [
    ['s1', 'geometry', { state: construction(4) }],
    ['teacher', 'geometry-control', { controller: 'teacher' }],
    ['s1', 'stroke', stroke()],
    ['s1', 'erase', { strokeId: uuid() }],
    ['s1', 'undo', {}],
    ['s1', 'trainer', { state: negative() }]
  ]) rejects(() => f.action(role, type, 's1', payload, { assignmentId: originalId, expectedVersion: 0 }), 'GROUP_ASSIGNMENT_STALE', 409);
  f.action('teacher', 'assign', 's2', { targets: ['s2'], trainerId: 'negative-numbers-line', initialState: negative() });
  f.restart();
  assert.deepEqual(f.work('s2').geometryState, model.empty());
  assert.equal(f.work('s2').geometryController, 'student');
  assert.deepEqual(f.work('s2').trainerState, negative());
});

test('all three surfaces and presentation restore after durable storage restart and late join', t => {
  const f = fixture(t);
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  f.action('s1', 'stroke', 's1', stroke());
  f.action('teacher', 'insert', 's1', { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() });
  f.action('s1', 'trainer', 's1', { state: { ...negative(), answer: '-2' } }, { expectedVersion: 0 });
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'geometry' });
  const before = structuredClone(f.work('s1'));
  f.restart();
  assert.deepEqual(f.work('s1'), before);
  const late = f.snapshot('s3');
  assert.deepEqual(late.presentation.workspace, before);
  assert.equal(late.presentation.surface, 'geometry');
  assert.equal(late.students.length, 1);
  for (const invite of f.initial.invites) assert.equal(JSON.stringify(late).includes(invite.studentToken), false);
  assert.equal(JSON.stringify(late).includes(f.initial.teacherToken), false);
  assert.deepEqual(f.history('s1', 's1').events.map(item => item.type), ['geometry', 'stroke', 'insert', 'trainer']);
});

test('graphs, dependent constructions and canonical viewport survive control, stale writes, presentation and restart', t => {
  const f = fixture(t);
  const state = {
    ...model.empty(), title: 'График и геометрия',
    view: { axes: true, grid: false, viewport: { x: 2.5, y: -1 / 3, span: 9.6 } },
    objects: [
      { id: 'A', type: 'point', label: 'A', x: 0, y: 0 },
      { id: 'B', type: 'point', label: 'B', x: 4, y: 0 },
      { id: 'C', type: 'point', label: 'C', x: 1, y: 3 },
      { id: 'base', type: 'line', label: 'AB', parents: ['A', 'B'] },
      { id: 'H', type: 'projection', label: 'H', parents: ['base', 'C'] },
      { id: 'circle', type: 'circle3', label: 'k', parents: ['A', 'B', 'C'] },
      { id: 'area', type: 'area', label: 'S', parents: ['circle'] },
      { id: 'a', type: 'slider', label: 'a', parents: [], name: 'a', min: -5, max: 5, step: .1, value: 2.5 },
      { id: 'b', type: 'slider', label: 'b', parents: [], name: 'b', min: -5, max: 5, step: .1, value: -1 },
      { id: 'graph', type: 'functionGraph', label: 'f', parents: ['a', 'b'], expression: 'a*x^2+b' }
    ]
  };
  f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 0 });
  assert.deepEqual(f.snapshot('s1').students[0].workspace.geometryState, state, 'exact graph, parents and camera round trip');
  let evaluated = model.evaluate(f.work('s1').geometryState);
  assert.deepEqual(evaluated.graph.parameters, { a: 2.5, b: -1 });
  assert.deepEqual([evaluated.H.x, evaluated.H.y], [1, 0]);
  assert.ok(Math.abs(evaluated.area.value - 5 * Math.PI) < 1e-12);
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'geometry' });
  assert.deepEqual(f.snapshot('s2').presentation.workspace.geometryState, state);
  f.action('teacher', 'geometry-control', 's1', { controller: 'teacher' });
  const edited = structuredClone(state);
  Object.assign(edited.objects.find(object => object.id === 'C'), { x: 2, y: 2 });
  edited.objects.find(object => object.id === 'a').value = -2;
  edited.view.viewport = { x: -3, y: 4, span: 6 };
  f.action('teacher', 'geometry', 's1', { state: edited }, { expectedVersion: 2 });
  f.action('teacher', 'geometry-control', 's1', { controller: 'student' });
  const before = structuredClone(f.work('s1'));
  rejects(() => f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 1 }), 'GROUP_STATE_CONFLICT', 409);
  assert.deepEqual(f.work('s1'), before, 'old parameter or viewport cannot overwrite teacher changes');
  f.restart();
  const restored = f.work('s1');
  assert.deepEqual(restored, before, 'controller, graph, dependency IDs and camera are durable');
  assert.deepEqual(f.snapshot('s3').presentation.workspace.geometryState, edited, 'late presentation sees saved function and viewport');
  evaluated = model.evaluate(restored.geometryState);
  assert.deepEqual(evaluated.graph.parameters, { a: -2, b: -1 });
  assert.deepEqual([evaluated.H.x, evaluated.H.y], [2, 0]);
  // Derived circle coordinates use floating arithmetic; persisted model data
  // above must still round-trip exactly, while geometry is checked to 1e-12.
  assert.ok(Math.abs(evaluated.circle.c[0] - 2) < 1e-12 && Math.abs(evaluated.circle.c[1]) < 1e-12);
  assert.ok(Math.abs(evaluated.circle.r - 2) < 1e-12);
  assert.ok(Math.abs(evaluated.area.value - 4 * Math.PI) < 1e-12);
  const history = f.history('s1', 's1');
  assert.deepEqual(history.events.filter(event => event.type === 'geometry').map(event => event.payload.state), [state, edited]);
  const resumed = structuredClone(edited); resumed.objects.find(object => object.id === 'b').value = .5;
  f.action('s1', 'geometry', 's1', { state: resumed }, { expectedVersion: restored.geometryVersion });
  assert.equal(model.evaluate(f.work('s1').geometryState).graph.parameters.b, .5, 'returned pupil control works after restart');
});

test('constrained points and value tables survive the shared journal with their canonical inputs', t => {
  const f = fixture(t);
  const state = { ...model.empty(), objects: [
    { id: 'A', type: 'point', label: 'A', x: 0, y: 0 },
    { id: 'B', type: 'point', label: 'B', x: 4, y: 0 },
    { id: 'segment', type: 'segment', label: 'AB', parents: ['A', 'B'] },
    { id: 'P', type: 'pointOn', label: 'P', parents: ['segment'], parameter: .25 },
    { id: 'vector', type: 'vector', label: 'u', parents: ['A', 'B'] },
    { id: 'Q', type: 'translate', label: 'Q', parents: ['P', 'vector'] },
    { id: 'circle', type: 'circleRadius', label: 'k', parents: ['A'], radius: 2 },
    { id: 'tangent', type: 'tangent', label: 't', parents: ['circle', 'Q'], branch: 0 },
    { id: 'a', type: 'slider', label: 'a', parents: [], name: 'a', min: 0, max: 5, step: 1, value: 1 },
    { id: 'graph', type: 'functionGraph', label: 'f', parents: ['a'], expression: 'sqrt(x)+a' },
    { id: 'G', type: 'pointOn', label: 'G', parents: ['graph'], parameter: 4 },
    { id: 'table', type: 'functionTable', label: 'Таблица f', parents: ['graph'], start: -1, end: 1, step: 1 }
  ] };
  f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 0 });
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'geometry' });
  assert.deepEqual(f.snapshot('s2').presentation.workspace.geometryState, state);
  assert.deepEqual(f.snapshot('s2').students[0].workspace.geometryState, model.empty());

  const edited = structuredClone(state);
  edited.objects.find(item => item.id === 'B').x = 8;
  edited.objects.find(item => item.id === 'a').value = 2;
  f.action('teacher', 'geometry-control', 's1', { controller: 'teacher' });
  f.action('teacher', 'geometry', 's1', { state: edited }, { expectedVersion: 2 });
  const invalid = structuredClone(edited);
  invalid.objects.find(item => item.id === 'P').parameter = 2;
  rejects(() => f.action('teacher', 'geometry', 's1', { state: invalid }, { expectedVersion: 3 }), 'GROUP_GEOMETRY_STATE_INVALID');
  f.restart();

  const restored = f.snapshot('s1').students[0].workspace;
  assert.equal(restored.geometryController, 'teacher');
  assert.equal(restored.geometryVersion, 3);
  assert.deepEqual(restored.geometryState, edited);
  const peer = f.snapshot('s3').presentation.workspace.geometryState;
  assert.deepEqual(peer, restored.geometryState);
  const result = model.evaluate(peer);
  assert.deepEqual([result.P.x, result.P.y, result.Q.x, result.Q.y], [2, 0, 10, 0]);
  assert.equal(result.tangent.defined, true);
  assert.deepEqual([result.G.x, result.G.y], [4, 4]);
  assert.deepEqual(result.table.rows, [{ x: -1, y: null }, { x: 0, y: 2 }, { x: 1, y: 3 }]);
});

test('presentation surface follows partial snapshots without altering personal work or granting rights', t => {
  const f = fixture(t);
  const before = structuredClone(f.work('s2'));
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'geometry' });
  const revision = f.snapshot('s2').revision;
  let partial = f.snapshot('s2', revision);
  assert.equal(partial.presentation.surface, 'geometry');
  assert.equal(partial.presentation.workspace, undefined);
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'board' });
  partial = f.snapshot('s2', revision);
  assert.equal(partial.presentation.surface, 'board');
  assert.ok(partial.presentation.workspace);
  assert.deepEqual(f.work('s2'), before);
  rejects(() => f.action('teacher', 'present', 'common', { target: 's1', surface: 'javascript:alert(1)' }), 'GROUP_PAYLOAD_INVALID');
  f.action('teacher', 'present', 'common', { target: 's1' });
  assert.equal(f.snapshot('s2').presentation.surface, 'split');
  f.action('teacher', 'present', 'common', { target: null });
  assert.deepEqual(f.snapshot('s2').presentation, { target: null });
});

test('geometry accepts canonical bounded models only and leaves rejected changes uncommitted', t => {
  const f = fixture(t);
  const invalid = [
    { ...construction(), expression: 'alert(1)' },
    { ...construction(), version: 2 },
    { ...construction(), objects: [{ id: 'A', type: 'point', label: 'A', x: 1000001, y: 0 }] },
    { ...construction(), objects: [{ id: 'AB', type: 'segment', label: '', parents: ['missing', 'A'] }] },
    { ...construction(), objects: [{ id: 'A', type: 'function', label: '', parents: [] }] },
    { ...construction(), view: { axes: true, grid: true, html: '' } }
  ];
  for (const state of invalid) rejects(() => f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 0 }), 'GROUP_GEOMETRY_STATE_INVALID');
  assert.equal(f.work('s1').geometryVersion, 0);
  assert.equal(f.history('s1', 's1').events.length, 0);
  f.action('s1', 'geometry', 's1', { state: construction(1 / 7) }, { expectedVersion: 0 });
  assert.equal(f.work('s1').geometryState.objects[0].x, 1 / 7);
});

test('geometry-specific byte ceiling does not widen trainer limits', t => {
  const f = fixture(t), points = Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`.padEnd(39, 'x'), type: 'point', label: 'Точка', x: i, y: i % 5 }));
  const polygons = Array.from({ length: 30 }, (_, i) => ({ id: `poly${i}`, type: 'polygon', label: 'Многоугольник', parents: points.map(point => point.id) }));
  const state = { ...model.empty(), objects: [...points, ...polygons] };
  assert.ok(Buffer.byteLength(JSON.stringify(state)) > 24 * 1024);
  assert.ok(Buffer.byteLength(JSON.stringify(state)) < 64 * 1024);
  f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 0 });
  assert.equal(f.work('s1').geometryState.objects.length, 60);
  const tooLarge = { ...state, objects: [...points, ...Array.from({ length: 65 }, (_, i) => ({ ...polygons[0], id: `polygon${i}` }))] };
  assert.ok(Buffer.byteLength(JSON.stringify(tooLarge)) > 64 * 1024);
  rejects(() => f.action('s1', 'geometry', 's1', { state: tooLarge }, { expectedVersion: 1 }), 'GROUP_STATE_TOO_LARGE');
  rejects(() => f.action('teacher', 'insert', 's1', { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: { ...negative(), data: 'x'.repeat(30000) } }), 'GROUP_PAYLOAD_INVALID');
  assert.equal(f.work('s1').geometryVersion, 1);
});

test('repeated geometry operation after lost acknowledgement stays idempotent across restart', t => {
  const f = fixture(t), body = { opId: uuid(), type: 'geometry', target: 's1', assignmentId: f.work('s1').assignmentId,
    expectedVersion: 0, payload: { state: construction() } };
  let access = f.auth('s1');
  const first = f.store.action(access.entry, access.auth, body);
  f.restart(); access = f.auth('s1');
  const second = f.store.action(access.entry, access.auth, body);
  assert.equal(first.revision, second.revision);
  assert.equal(second.duplicate, true);
  assert.equal(f.work('s1').geometryVersion, 1);
  rejects(() => f.store.action(access.entry, access.auth, { ...body, payload: { state: construction(3) } }), 'GROUP_OP_ID_CONFLICT', 409);
});

test('HTTP geometry uses bearer access, exact origin-independent state and capability discovery', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'group-geometry-http-'));
  const { router, store } = createGroupLessonsRouter({ directory });
  const app = express(); app.use(express.json({ limit: '128kb' })); app.use('/api/group-lessons', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const origin = `http://127.0.0.1:${server.address().port}/api/group-lessons`;
  const request = async (url, options = {}) => { const response = await fetch(origin + url, options); return { status: response.status, body: await response.json() }; };
  const capabilities = (await request('/status')).body;
  assert.equal(capabilities.geometry.id, 'spacemath');
  assert.deepEqual(capabilities.surfaces, ['board', 'geometry', 'trainer', 'split']);
  assert.equal(capabilities.insert, true);
  const created = await request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Проверка', names: ['Ученик'] }) });
  assert.equal(created.status, 201);
  const initial = created.body, token = initial.invites[0].studentToken;
  const payload = { opId: uuid(), type: 'geometry', target: 's1', assignmentId: initial.students[0].workspace.assignmentId, expectedVersion: 0, payload: { state: construction() } };
  const write = await request(`/${initial.id}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  assert.equal(write.status, 200);
  assert.deepEqual(write.body.students[0].workspace.geometryState, construction());
  const rejected = await request(`/${initial.id}?token=${token}`);
  assert.equal(rejected.status, 401);
});

test('graph roots and intersections: canonical journal, permissions, version fences and replay', t => {
  const f = fixture(t);
  const state = { ...model.empty(), objects: [
    { id: 'a', type: 'slider', label: 'a', parents: [], name: 'a', min: -5, max: 5, step: 1, value: -4 },
    { id: 'f', type: 'functionGraph', label: 'f', parents: ['a'], expression: 'x^2+a' },
    { id: 'g', type: 'functionGraph', label: 'g', parents: [], expression: '0' },
    { id: 'r0', type: 'functionRoot', label: 'R', parents: ['f'], branch: 0 },
    { id: 'r1', type: 'functionRoot', label: 'S', parents: ['f'], branch: 1 },
    { id: 'i0', type: 'functionIntersection', label: 'I', parents: ['f', 'g'], branch: 0 },
    { id: 'i1', type: 'functionIntersection', label: 'J', parents: ['f', 'g'], branch: 1 },
    { id: 'd', type: 'distance', label: 'd', parents: ['r0', 'r1'] }
  ] };
  f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 0 });
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'geometry' });
  assert.deepEqual(f.snapshot('teacher').students[0].workspace.geometryState, state);
  assert.deepEqual(f.snapshot('s2').presentation.workspace.geometryState, state);
  assert.deepEqual([model.evaluate(state).r0.x, model.evaluate(state).i1.x, model.evaluate(state).d.value], [-2, 2, 4]);
  rejects(() => f.action('s2', 'geometry', 's1', { state }, { expectedVersion: 1 }), 'GROUP_FORBIDDEN', 403);
  f.action('teacher', 'geometry-control', 's1', { controller: 'teacher' });
  rejects(() => f.action('s1', 'geometry', 's1', { state }, { expectedVersion: 1 }), 'GROUP_CONTROL_REQUIRED', 409);
  const states = [structuredClone(state)];
  for (const value of [0, 1, -1]) {
    const next = structuredClone(state); next.objects[0].value = value; states.push(next);
    f.action('teacher', 'geometry', 's1', { state: next }, { expectedVersion: f.work('s1').geometryVersion });
  }
  const before = structuredClone(f.work('s1'));
  const forged = structuredClone(state); forged.objects[3].x = 99;
  rejects(() => f.action('teacher', 'geometry', 's1', { state: forged }, { expectedVersion: before.geometryVersion }), 'GROUP_GEOMETRY_STATE_INVALID');
  rejects(() => f.action('teacher', 'geometry', 's1', { state }, { expectedVersion: 1 }), 'GROUP_STATE_CONFLICT', 409);
  assert.deepEqual(f.work('s1'), before);
  f.restart();
  assert.deepEqual(f.work('s1'), before);
  assert.deepEqual(f.history('teacher', 's1').events.filter(e => e.type === 'geometry').map(e => e.payload.state), states);
  assert.equal(model.evaluate(states[1]).r0.relation, 'tangent');
  assert.equal(model.evaluate(states[1]).r1.defined, false);
  assert.equal(model.evaluate(states[2]).i0.solutionStatus, 'none');
  assert.equal(model.evaluate(f.work('s1').geometryState).d.value, 2);
});


// Rehearse only on disposable synthetic journals. This does not claim that the
// production /data volume has been backed up or authorize a reader rollback.
test('a quiesced backup restores all materials, credentials, history and lost-ACK dedup into a separate directory', t => {
  const f = fixture(t);
  const ink = stroke(), opId = uuid(), boardId = f.work('s1').boardAssignmentId;
  f.action('s1', 'stroke', 's1', ink, { opId });
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  f.action('teacher', 'insert', 's1', { targets: ['s1'], trainerId: 'negative-numbers-line', initialState: negative() });
  f.action('s1', 'trainer', 's1', { state: { ...negative(), answer: '-2' } }, { expectedVersion: 0 });
  f.action('teacher', 'geometry-control', 's1', { controller: 'teacher' });
  f.action('teacher', 'present', 'common', { target: 's1', surface: 'split' });
  const work = structuredClone(f.work('s1')), history = structuredClone(f.history('s1', 's1'));
  const revision = f.snapshot('teacher').revision;
  f.store.close();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unified-restore-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const backup = path.join(root, 'backup'), restoredDir = path.join(root, 'restored');
  fs.cpSync(f.directory, backup, { recursive: true });
  fs.cpSync(backup, restoredDir, { recursive: true });
  const filename = `${f.initial.id}.jsonl`;
  const digest = dir => crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, filename))).digest('hex');
  const originalDigest = digest(f.directory);
  assert.equal(digest(backup), originalDigest); assert.equal(digest(restoredDir), originalDigest);
  const restored = new GroupLessonStore({ directory: restoredDir });
  t.after(() => restored.close());
  assert.equal(restored.status().available, true);
  const teacher = restored.authorize(f.initial.id, f.token('teacher'));
  const pupil = restored.authorize(f.initial.id, f.token('s1'));
  const observer = restored.authorize(f.initial.id, f.token('s2'));
  const snapshot = restored.snapshot(teacher.entry, teacher.auth);
  assert.equal(snapshot.revision, revision);
  assert.deepEqual(snapshot.students.find(s => s.id === 's1').workspace, work);
  assert.deepEqual(restored.history(pupil.entry, pupil.auth, { target: 's1' }), history);
  const projected = restored.snapshot(observer.entry, observer.auth);
  assert.equal(projected.presentation.surface, 'split');
  assert.deepEqual(projected.presentation.workspace, work);
  assert.deepEqual(projected.students.map(s => s.id), ['s2']);
  rejects(() => restored.history(observer.entry, observer.auth, { target: 's1' }), 'GROUP_FORBIDDEN', 403);
  const retry = { opId, type: 'stroke', target: 's1', assignmentId: boardId, payload: ink };
  assert.equal(restored.action(pupil.entry, pupil.auth, retry).duplicate, true);
  assert.equal(restored.snapshot(teacher.entry, teacher.auth).revision, revision);
  assert.equal(digest(restoredDir), originalDigest, 'lost ACK retry appends nothing after restore');
  restored.action(teacher.entry, teacher.auth, { opId: uuid(), type: 'stroke', target: 's1', assignmentId: boardId, payload: stroke() });
  assert.equal(restored.snapshot(teacher.entry, teacher.auth).revision, revision + 1);
  assert.notEqual(digest(restoredDir), originalDigest);
  assert.equal(digest(backup), originalDigest, 'reference backup remains unchanged');
  assert.equal(digest(f.directory), originalDigest, 'source journal is never modified by the rehearsal');
});

test('an incompatible complete event in a restored copy fails closed without rewriting source or backup', t => {
  const f = fixture(t);
  f.action('s1', 'geometry', 's1', { state: construction() }, { expectedVersion: 0 });
  f.store.close();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'unified-invalid-copy-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(f.directory, path.join(root, 'copy'), { recursive: true });
  const source = path.join(f.directory, `${f.initial.id}.jsonl`);
  const copied = path.join(root, 'copy', `${f.initial.id}.jsonl`);
  const original = fs.readFileSync(source, 'utf8');
  const rows = original.trimEnd().split('\n').map(line => JSON.parse(line));
  rows[1].type = 'unsupported-future-event';
  const incompatible = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
  fs.writeFileSync(copied, incompatible);
  const restored = new GroupLessonStore({ directory: path.join(root, 'copy') });
  t.after(() => restored.close());
  assert.equal(restored.status().available, false);
  rejects(() => restored.authorize(f.initial.id, f.token('teacher')), 'GROUP_STORAGE_UNAVAILABLE', 503);
  assert.equal(fs.readFileSync(source, 'utf8'), original);
  assert.equal(fs.readFileSync(copied, 'utf8'), incompatible, 'complete unsupported records are not silently removed');
});
