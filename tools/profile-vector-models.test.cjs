'use strict';
const assert = require('node:assert/strict');
const lessons = require('../ege-profil/start/geometry-data.js');
const { ids, sceneFor } = require('../ege-profil/start/vector-tasks.js');
const tasks = lessons.filter(l => l.group === 'vectors').flatMap(l => l.tasks);
const byId = new Map(tasks.map(t => [t.id, t]));
assert.equal(tasks.length, 24);
assert.deepEqual([...ids].sort(), tasks.map(t => t.id).sort());
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const vector = v => [v.to[0] - v.from[0], v.to[1] - v.from[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = a => Math.hypot(...a);
const complete = t => sceneFor(t, { mode: 'guided', step: t.steps.length - 1, solved: true });
let scenes = 0;
for (const task of tasks) {
  assert.equal(typeof globalThis.ProfileTaskModels[task.id], 'function');
  for (const mode of ['guided', 'independent']) for (let step = 0; step < task.steps.length; step++) {
    for (const solved of [false, true]) for (const helper of [false, true]) {
      const s = sceneFor(task, { mode, step, solved }, { projection: helper, construction: helper });
      assert.ok(s.caption.length > 15, task.id);
      for (const p of s.points.map(p => p.at).concat(s.vectors.flatMap(v => [v.from, v.to]))) {
        assert.equal(p.length, 2); assert.ok(p.every(Number.isFinite), task.id);
      }
      scenes++;
    }
  }
}

// Verify the endpoints from their named point givens, including BA metadata.
for (const [id, a, b, label] of [
  ['vec-coordinates-x', [-3, 2], [5, -4], 'AB'],
  ['vec-coordinates-y', [4, 7], [-2, -5], 'AB'],
  ['vec-coordinates-reverse', [-5, 8], [2, -3], 'BA']
]) {
  const s = complete(byId.get(id));
  assert.deepEqual(s.vectors[0].from, a); assert.deepEqual(s.vectors[0].to, b);
  assert.equal(s.vectors[0].label, label);
}

// No endpoint inferred from the answer is put on a graduated grid before it is earned.
for (const [id, absent, expected] of [
  ['vec-coordinates-end', 'B', [3, -3]],
  ['vec-coordinates-start', 'A', [11, -8]],
  ['vec-coordinates-equal', 'D', [11, 3]]
]) {
  const task = byId.get(id);
  for (const mode of ['guided', 'independent']) {
    const s = sceneFor(task, { mode, step: 0, solved: false }, { construction: true, projection: true });
    assert.ok(!s.points.some(p => p.label === absent), id + ' revealed ' + absent);
    if (id !== 'vec-coordinates-equal') assert.deepEqual(s.vectors[0].from, [0, 0], id + ' must show displacement separately');
  }
  assert.deepEqual(complete(task).points.find(p => p.label === absent).at, expected);
}
for (const id of ['vec-length-unknown', 'vec-dot-perpendicular', 'vec-dot-cosine']) {
  const task = byId.get(id), s = sceneFor(task, { mode: 'independent', solved: false }, { projection: true, construction: true });
  assert.ok(s.schematic, id); assert.equal(s.coordinates, false); assert.equal(s.vectors.length, 0);
}
for (const task of tasks.filter(t => t.id.startsWith('vec-operations-'))) {
  const s = sceneFor(task, { mode: 'independent', solved: false }, { construction: true });
  assert.equal(s.construction, null);
  for (const v of s.vectors) assert.deepEqual(v.from, [0, 0]);
  const done = complete(task);
  const final = done.vectors.at(-1);
  if (task.id === 'vec-operations-difference-length') close(norm(vector(final)), task.answer);
  else close(vector(final)[task.meta.axis], task.answer);
}
for (const task of tasks.filter(t => ['vec-length-basic', 'vec-length-negative', 'vec-length-axis', 'vec-length-points'].includes(t.id))) {
  close(norm(vector(complete(task).vectors[0])), task.answer);
}
const unknown = complete(byId.get('vec-length-unknown')).vectors[0];
close(norm(vector(unknown)), 15); assert.deepEqual(vector(unknown), [12, 9]);
const perpendicular = complete(byId.get('vec-dot-perpendicular')).vectors;
close(dot(vector(perpendicular[0]), vector(perpendicular[1])), 0);
for (const task of tasks.filter(t => ['vec-dot-positive', 'vec-dot-negative', 'vec-dot-self', 'vec-dot-angle'].includes(t.id))) {
  const s = complete(task), a = vector(s.vectors[0]), b = vector(s.vectors[1] || s.vectors[0]);
  close(dot(a, b), task.answer);
}
const cosine = complete(byId.get('vec-dot-cosine')).vectors.map(vector);
close(dot(cosine[0], cosine[1]) / (norm(cosine[0]) * norm(cosine[1])), -.5);
console.log('PROFILE_VECTOR_MODELS_OK: 24 task-bound models; ' + scenes + ' finite scenes; unknowns withheld; geometry verified.');
