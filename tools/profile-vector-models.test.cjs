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

const starters = require('../ege-profil/start/vector-basics-data.js');
const basics = require('../ege-profil/start/vector-basics-models.js');
const checks = require('../ege-profil/start/checks.js');
const journey = require('../ege-profil/start/journey.js');
const stateApi = require('../ege-profil/start/state.js');
const exams = require('../ege-profil/start/calm-data.js').exams;
const vectorsExam = exams.find(e => e.number === 2);
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
assert.deepEqual(starters.map(lesson => lesson.id), vectorsExam.starterIds);
assert.equal(new Set(starters.flatMap(lesson => lesson.tasks.map(task => task.id))).size, 54);
for (const lesson of starters) {
  assert.equal(lesson.tasks.length, 6);
  assert.equal(typeof lesson.position, 'string');
  for (const task of lesson.tasks) {
    assert.equal(typeof globalThis.ProfileTaskModels[task.id], 'function');
    for (const question of [...task.steps, task]) {
      assert(checks.check(question.answer, String(question.answer), question.choices), task.id);
      if (question.choices) {
        assert.equal(question.choices.filter(value => checks.check(question.answer, value, question.choices)).length, 1, task.id);
      }
    }
    const before = basics.scene(task, { mode: 'independent', solved: false, completed: task.steps.length });
    const after = basics.scene(task, { mode: 'independent', solved: true });
    assert.deepEqual(before.shown, task.vectorDiagram.arrows);
    assert.equal(new Set(Object.values(after.points).map(String)).size, Object.keys(after.points).length, task.id + ' distinct labelled points');
    const displacement = arrow => subtract(after.points[arrow.to], after.points[arrow.from]);
    const [a, b] = before.shown.map(displacement);
    const answerArrow = after.shown.find(arrow => arrow.color === 'result');
    for (const arrow of after.shown) assert(displacement(arrow).every(Number.isFinite), task.id);
    if (answerArrow) {
      const actual = displacement(answerArrow);
      if (lesson.id.endsWith('-triangle') || lesson.id.endsWith('-parallelogram')) {
        assert.deepEqual(actual, add(a, b), task.id);
        assert.equal(answerArrow.from + answerArrow.to, task.answer);
        if (lesson.id.endsWith('-parallelogram')) {
          const [translatedB, translatedA] = after.shown.filter(arrow => arrow.color === 'guide').map(displacement);
          assert.deepEqual(translatedB, b); assert.deepEqual(translatedA, a);
        }
      } else if (lesson.id.endsWith('-difference')) {
        assert.deepEqual(actual, b ? subtract(a, b) : subtract([0, 0], a), task.id);
        assert.equal(answerArrow.from + answerArrow.to, task.answer);
      } else if (lesson.id.endsWith('-equality')) {
        assert.deepEqual(actual, a);
        assert.equal(answerArrow.to, task.answer);
      } else {
        assert.deepEqual(actual, a.map(value => Number(answerArrow.name.replace('−', '-').slice(0, -1)) * value || 0));
        assert.equal(answerArrow.to, task.answer);
      }
    } else if (lesson.id.endsWith('-reading')) {
      assert.equal(task.answer, norm(a) ? before.shown[0].from + before.shown[0].to : 0);
    } else if (lesson.id.endsWith('-equality')) {
      const cross = a[0] * b[1] - a[1] * b[0];
      assert.equal(task.answer, cross ? 'Не коллинеарны' : dot(a, b) < 0 ? 'Противоположно направлены'
        : norm(a) === norm(b) ? 'Векторы равны' : 'Сонаправлены, но длины разные');
    } else if (lesson.id.endsWith('-coordinates')) {
      assert.equal(task.answer, a[task.question.includes('первая') ? 0 : 1]);
    } else if (lesson.id.endsWith('-length')) {
      close(task.answer, norm(a));
    } else {
      close(task.answer, dot(a, b));
    }
  }
}

const values = new Map();
const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
const allVectorLessons = starters.concat(lessons.filter(lesson => lesson.position === 2));
let state = stateApi.create(allVectorLessons, storage);
const choose = () => journey.choose({ lessons: allVectorLessons, state, exam: vectorsExam });
assert.equal(choose().lessonId, starters[0].id);
for (const lesson of starters) {
  for (let index = 0; index < 3; index++) {
    assert.equal(choose().href, '#practice/' + lesson.id + '/guided');
    const attempt = state.start(lesson.id, 'guided', index > 0);
    assert.equal(attempt.taskId, lesson.tasks[index].id);
    attempt.answers = lesson.tasks[index].steps.map(question => String(question.answer));
    attempt.step = attempt.answers.length - 1;
    assert(state.finish(lesson.id, 'guided', attempt));
    state = stateApi.create(allVectorLessons, storage);
    assert.equal(journey.starterProgress(lesson, state), index + 1);
    assert.equal(state.record(lesson.id).independent.length, 0);
  }
}
assert.equal(choose().href, '#practice/vec-coordinates/independent');
const oldView = stateApi.create(lessons, storage);
oldView.start('vec-coordinates', 'guided');
state = stateApi.create(allVectorLessons, storage);
assert(starters.every(lesson => journey.starterProgress(lesson, state) === 3), 'Legacy narrow catalogs preserve the new work');
console.log('PROFILE_VECTOR_BASICS_OK: 54 drawings and answers; addition, differences, scaling and coordinates verified; all 27 guided conditions precede exam practice.');
