'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const lessons = require('../ege-profil/atanasyan-10-11/lessons-b.js');
const textbook = require('../stereo-course/data/textbook.json');
const course = require('../stereo-course/data/course.json');

const sub = (a, b) => a.map((x, i) => x - b[i]);
const add = (a, b) => a.map((x, i) => x + b[i]);
const scale = (a, k) => a.map(x => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => Math.hypot(...a);
const distance = (a, b) => norm(sub(a, b));
const near = (actual, expected, context) => assert.ok(Math.abs(actual - expected) < 1e-8 * Math.max(1, Math.abs(expected)), `${context}: ${actual} ≠ ${expected}`);
const vectorNear = (a, b, context) => a.forEach((v, i) => near(v, b[i], `${context}, coordinate ${i}`));
const planeNormal = (a, b, c) => cross(sub(b, a), sub(c, a));
const volume = (a, b, c, d) => Math.abs(dot(sub(b, a), cross(sub(c, a), sub(d, a)))) / 6;

test('six original lessons have valid source references and guided fields', () => {
  assert.equal(lessons.length, 6);
  assert.equal(new Set(lessons.map(x => x.id)).size, 6);
  assert.deepEqual(lessons.map(x => x.id), ['distance-plane-1', 'distance-plane-2', 'volume-1', 'volume-2', 'skew-distance-1', 'skew-distance-2']);
  const pointIds = new Set(textbook.topics.map(x => x.point));
  const unitIds = new Set(course.units.map(x => x.id));
  for (const lesson of lessons) {
    assert.ok(lesson.problemHtml.includes('а)') && lesson.problemHtml.includes('б)'), lesson.id);
    assert.ok(lesson.steps.length >= 7 && lesson.steps.length <= 12, lesson.id);
    assert.ok(lesson.reportProblem && lesson.reportAnswer && lesson.answerHtml, lesson.id);
    assert.ok(lesson.bookPoints.length && lesson.bookPoints.every(id => pointIds.has(id)), lesson.id);
    assert.ok(lesson.unitIds.length && lesson.unitIds.every(id => unitIds.has(id)), lesson.id);
    assert.ok(lesson.steps.some(s => s.phase === 'а) Доказательство') && lesson.steps.some(s => s.phase === 'б) Вычисление'), lesson.id);
    const ids = new Set();
    for (const step of lesson.steps) {
      assert.ok(step.title && step.body && step.record && step.hint, lesson.id);
      assert.ok(lesson.model.views[step.modelView], `${lesson.id}: unknown view ${step.modelView}`);
      assert.equal(step.fields.length, 1, `${lesson.id}: one short action per step`);
      for (const field of step.fields) {
        assert.ok(field.id && field.label && !ids.has(field.id), lesson.id);
        ids.add(field.id);
        assert.equal(typeof field.correct, 'string', lesson.id);
        if (field.kind === 'number') {
          assert.match(field.correct, /^-?\d+(?:\.\d+)?$/, `${lesson.id}: number fields must not require roots or fractions`);
          assert.ok(Number.isFinite(Number(field.correct)), lesson.id);
        } else {
          assert.equal(field.kind, 'choice', lesson.id);
          assert.equal(new Set(field.options.map(x => x.id)).size, field.options.length, lesson.id);
          assert.equal(new Set(field.options.map(x => x.html)).size, field.options.length, lesson.id);
          assert.equal(field.options.filter(x => x.id === field.correct).length, 1, lesson.id);
          assert.ok(field.options.length >= 2 && field.options.every(x => x.html), lesson.id);
        }
      }
    }
  }
});

test('all displayed models have finite coordinates and planar nondegenerate faces', () => {
  for (const lesson of lessons) {
    const { points, edges, faces, views } = lesson.model;
    const point = name => { assert.ok(points[name], `${lesson.id}: missing point ${name}`); return points[name]; };
    for (const [name, p] of Object.entries(points)) {
      assert.equal(p.length, 3, `${lesson.id}/${name}`);
      assert.ok(p.every(Number.isFinite), `${lesson.id}/${name}`);
      assert.match(name, /^[A-Z][1]?$/, `${lesson.id}: point labels contain no computed answers`);
    }
    for (const edge of edges) {
      assert.equal(edge.length, 2, lesson.id);
      assert.ok(distance(point(edge[0]), point(edge[1])) > 0, lesson.id);
    }
    for (const face of faces) {
      assert.ok(face.length >= 3, lesson.id);
      const [a, b, c] = face.map(point);
      const normal = planeNormal(a, b, c);
      assert.ok(norm(normal) > 0, `${lesson.id}: degenerate face`);
      face.forEach(name => near(dot(sub(point(name), a), normal), 0, `${lesson.id}: planar face`));
    }
    for (const view of Object.values(views)) {
      assert.ok(view.label && Array.isArray(view.segments) && Array.isArray(view.polygon), lesson.id);
      view.segments.forEach(pair => {
        assert.equal(pair.length, 2, lesson.id);
        pair.forEach(point);
      });
      view.polygon.forEach(point);
    }
  }
});

for (const [index, expected] of [[1, 2 * Math.sqrt(3)], [2, 4 * Math.sqrt(3)]]) {
  test(`cube ${index}: perpendicular foot and distance independently from plane normal`, () => {
    const lesson = lessons.find(x => x.id === `distance-plane-${index}`);
    const { A, B, D, A1, C1, H } = lesson.model.points;
    const normal = planeNormal(B, D, A1);
    const diagonal = sub(C1, A);
    near(norm(cross(normal, diagonal)), 0, 'AC1 is normal to BDA1');
    near(dot(sub(H, B), normal), 0, 'H belongs to plane');
    near(norm(cross(sub(H, A), diagonal)), 0, 'H belongs to AC1');
    near(norm(cross(sub(C1, H), normal)), 0, 'C1H perpendicular to plane');
    const t = dot(sub(H, A), diagonal) / dot(diagonal, diagonal);
    assert.ok(t > 0 && t < 1, 'H is inside diagonal segment');
    near(t, 1 / 3, 'division of diagonal');
    const independentlyComputed = Math.abs(dot(sub(C1, B), normal)) / norm(normal);
    near(independentlyComputed, expected, 'point-plane distance');
    near(distance(C1, H), independentlyComputed, 'constructed segment realizes distance');
    near(lesson.params.distance, independentlyComputed, 'answer parameter');
    assert.ok(lesson.params.a > 0 && lesson.params.a <= 20, 'reasonable positive edge');
  });
}

for (const [index, expected] of [[1, 9 * Math.sqrt(3)], [2, 64 * Math.sqrt(3) / 3]]) {
  test(`hexagonal pyramid ${index}: regularity, plane angle, heights and determinant volume`, () => {
    const lesson = lessons.find(x => x.id === `volume-${index}`);
    const p = lesson.model.points;
    const { A, B, C, D, F, S, O, M, K, P } = p;
    const a = distance(A, B);
    const base = ['A', 'B', 'C', 'D', 'E', 'F'];
    base.forEach((name, i) => {
      near(distance(p[name], p[base[(i + 1) % base.length]]), a, 'equal sides');
      near(distance(p[name], O), a, 'equal base radii');
      near(p[name][2], 0, 'base plane');
      near(distance(p[name], S), distance(A, S), 'equal lateral edges');
    });
    vectorNear(M, scale(add(S, A), 0.5), 'M midpoint SA');
    vectorNear(K, scale(add(S, D), 0.5), 'K midpoint SD');
    vectorNear(P, scale(add(O, A), 0.5), 'P midpoint OA');
    near(norm(cross(sub(K, M), sub(C, B))), 0, 'MK parallel BC');
    near(dot(sub(M, B), sub(C, B)), 0, 'BM perpendicular BC');
    near(dot(sub(P, B), sub(C, B)), 0, 'BP perpendicular BC');
    near(dot(sub(M, P), sub(B, P)), 0, 'triangle MBP right at P');
    const normal = planeNormal(B, M, C);
    const angleCosine = Math.abs(normal[2]) / norm(normal);
    near(angleCosine, Math.sqrt(3) / 2, 'angle between planes is 30 degrees');
    near(distance(S, O), a, 'height of original pyramid');
    near(distance(M, P), a / 2, 'height of tetrahedron');
    const area = norm(cross(sub(B, A), sub(F, A))) / 2;
    near(area, Math.sqrt(3) * a * a / 4, 'area ABF');
    const computedVolume = volume(M, A, B, F);
    near(computedVolume, expected, 'determinant volume');
    near(lesson.params.volume, computedVolume, 'answer parameter');
    near(lesson.params.baseArea, area, 'area parameter');
    assert.ok(a > 0 && a < 12, 'original values distinct from example side 12');
    const finalField = lesson.steps.at(-1).fields[0];
    assert.equal(finalField.kind, 'choice', 'exact radical answer uses choice field');
    assert.ok(finalField.options.find(x => x.id === finalField.correct).html.includes('√3'));
  });
}

for (const [index, expected] of [[1, 12], [2, 15]]) {
  test(`box ${index}: genuine skew lines and common perpendicular give distance ${expected}`, () => {
    const lesson = lessons.find(x => x.id === `skew-distance-${index}`);
    const { A, B, C, C1, A1 } = lesson.model.points;
    const u = sub(B, A);
    const v = sub(C1, C);
    const w = sub(C, A);
    const normal = cross(u, v);
    assert.ok(norm(normal) > 0, 'directions not parallel');
    assert.ok(Math.abs(dot(w, normal)) > 0, 'noncoplanar, hence genuinely skew');
    near(dot(sub(C, B), u), 0, 'BC perpendicular AB');
    near(dot(sub(C, B), v), 0, 'BC perpendicular CC1');
    const independentlyComputed = Math.abs(dot(w, normal)) / norm(normal);
    near(independentlyComputed, expected, 'skew line distance');
    near(distance(B, C), independentlyComputed, 'common perpendicular realizes distance');
    near(distance(A, B), lesson.params.a, 'given AB');
    near(distance(A, C), lesson.params.diagonal, 'given base diagonal');
    near(distance(A, A1), lesson.params.h, 'given height');
    assert.ok(lesson.params.diagonal > lesson.params.a && lesson.params.h > 0, 'nondegenerate givens');
    assert.ok(lesson.params.preparatory && lesson.problemHtml.includes('Подготовительная'), 'introductory scope explicit');
    assert.equal(Number(lesson.steps.at(-1).fields[0].correct), independentlyComputed, 'numeric final answer');
  });
}
