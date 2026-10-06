'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const lessons = require('../ege-profil/atanasyan-10-11/lessons-a.js');
const textbook = require('../stereo-course/data/textbook.json');
const course = require('../stereo-course/data/course.json');
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => Math.hypot(...a);
const distance = (a, b) => norm(sub(a, b));
const midpoint = (a, b) => a.map((v, i) => (v + b[i]) / 2);
const triangleArea = (a, b, c) => norm(cross(sub(b, a), sub(c, a))) / 2;
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`);
const samePoint = (a, b, message) => a.forEach((v, i) => near(v, b[i], `${message}, coordinate ${i}`));
const parallel = (a, b) => near(norm(cross(a, b)), 0, 'vectors must be parallel');
const perpendicular = (a, b) => near(dot(a, b), 0, 'vectors must be perpendicular');
const degrees = (a, b) => Math.acos(dot(a, b) / norm(a) / norm(b)) * 180 / Math.PI;
const field = (lesson, id) => {
  const result = lesson.steps.flatMap(s => s.fields).find(f => f.id === id);
  assert.ok(result, `${lesson.id} has field ${id}`);
  return result;
};

test('six original lessons expose one supported answer field per small step', () => {
  assert.deepEqual(lessons.map(l => l.id), ['section-1', 'section-2', 'line-plane-1', 'line-plane-2', 'dihedral-1', 'dihedral-2']);
  const points = new Set(textbook.topics.map(p => p.point));
  const units = new Set(course.units.map(u => u.id));
  for (const lesson of lessons) {
    for (const key of ['title', 'problemHtml', 'reportProblem', 'reportAnswer', 'answerHtml']) assert.equal(typeof lesson[key], 'string', `${lesson.id}.${key}`);
    assert.ok(lesson.problemHtml.includes('а)') && lesson.problemHtml.includes('б)'));
    assert.ok(lesson.bookPoints.every(p => points.has(p)), `${lesson.id} has real textbook points`);
    assert.ok(lesson.unitIds.every(id => units.has(id)), `${lesson.id} has real course links`);
    assert.ok(lesson.steps.length >= 7 && lesson.steps.length <= 11);
    assert.ok(lesson.steps.some(s => s.phase === 'а) Доказательство'));
    assert.ok(lesson.steps.some(s => s.phase === 'б) Вычисление'));
    let calculationStarted = false;
    const fieldIds = new Set();
    for (const step of lesson.steps) {
      for (const key of ['title', 'body', 'hint', 'record', 'modelView']) assert.ok(typeof step[key] === 'string' && step[key].length, `${lesson.id}: ${key}`);
      assert.equal(/<[^>]*>/.test(step.hint), false, 'hints are plain text');
      assert.ok(['а) Доказательство', 'б) Вычисление'].includes(step.phase));
      if (step.phase === 'б) Вычисление') calculationStarted = true;
      if (calculationStarted) assert.equal(step.phase, 'б) Вычисление', 'proof precedes computation');
      assert.ok(lesson.model.views[step.modelView], `${lesson.id} references an existing model view`);
      assert.equal(step.fields.length, 1, 'one question per step');
      const f = step.fields[0];
      assert.ok(!fieldIds.has(f.id), 'field IDs are unique within a lesson');
      fieldIds.add(f.id);
      assert.equal(typeof f.label, 'string');
      assert.equal(typeof f.correct, 'string');
      if (f.kind === 'number') {
        assert.match(f.correct, /^-?\d+(?:\.\d+)?$/, 'the shared engine accepts decimal or integer input');
        assert.ok(Number.isFinite(Number(f.correct)));
      } else {
        assert.equal(f.kind, 'choice');
        assert.ok(f.options.length >= 3);
        assert.equal(new Set(f.options.map(o => o.id)).size, f.options.length);
        assert.equal(f.options.filter(o => o.id === f.correct).length, 1);
        assert.ok(f.options.every(o => typeof o.html === 'string' && o.html.length));
      }
    }
    assert.ok(lesson.model.views.neutral);
    assert.ok(Object.values(lesson.model.points).every(p => p.length === 3 && p.every(Number.isFinite)));
    const knownPoint = p => assert.ok(Object.hasOwn(lesson.model.points, p), `unknown point ${p}`);
    for (const edge of lesson.model.edges) edge.forEach(knownPoint);
    for (const face of lesson.model.faces) face.forEach(knownPoint);
    for (const v of Object.values(lesson.model.views)) {
      assert.equal(typeof v.label, 'string');
      assert.doesNotMatch(v.label, /\d|[=°]/, 'model captions reveal names, not computed values');
      v.segments.forEach(segment => {
        assert.equal(segment.length, 2);
        segment.forEach(knownPoint);
      });
      v.polygon.forEach(knownPoint);
    }
  }
});

test('browser and CommonJS exports contain the same lesson data', () => {
  const source = fs.readFileSync(path.join(__dirname, '../ege-profil/atanasyan-10-11/lessons-a.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.AtanasyanLessonsA)), lessons);
});

for (const [id, ab, ac, area] of [['section-1', 12, 8, 12], ['section-2', 10, 12, 15]]) {
  test(`${id}: three true midpoints give a parallel triangular section of area ${area}`, () => {
    const lesson = lessons.find(l => l.id === id);
    const { A, B, C, S, M, N, P } = lesson.model.points;
    near(distance(A, B), ab, 'AB agrees with the condition');
    near(distance(A, C), ac, 'AC agrees with the condition');
    perpendicular(sub(B, A), sub(C, A));
    assert.ok(Math.abs(dot(sub(S, A), cross(sub(B, A), sub(C, A)))) > 1e-9, 'tetrahedron is not degenerate');
    samePoint(M, midpoint(S, A), 'M is midpoint of SA');
    samePoint(N, midpoint(S, B), 'N is midpoint of SB');
    samePoint(P, midpoint(S, C), 'P is midpoint of SC');
    parallel(sub(N, M), sub(B, A));
    parallel(sub(P, M), sub(C, A));
    parallel(sub(P, N), sub(C, B));
    const baseNormal = cross(sub(B, A), sub(C, A));
    const sectionNormal = cross(sub(N, M), sub(P, M));
    parallel(baseNormal, sectionNormal);
    assert.ok(Math.abs(dot(baseNormal, sub(M, A))) > 1e-9, 'the two planes are distinct');
    // The plane separates S from each base vertex, so its three edge intersections form the full section.
    const signed = X => dot(sectionNormal, sub(X, M));
    for (const X of [A, B, C]) assert.ok(signed(X) * signed(S) < 0);
    near(triangleArea(M, N, P), area, 'independent vector area of section');
    near(triangleArea(M, N, P) / triangleArea(A, B, C), 0.25, 'area ratio');
    near(distance(M, N) / distance(A, B), Number(field(lesson, 'side-ratio').correct), 'linear ratio answer');
    near(triangleArea(M, N, P) / triangleArea(A, B, C), Number(field(lesson, 'area-ratio').correct), 'area ratio answer');
    near(triangleArea(A, B, C), Number(field(lesson, 'base-area').correct), 'base area answer');
    near(triangleArea(M, N, P), Number(field(lesson, 'section-area').correct), 'section area answer');
  });
}

for (const [id, ab, ad, height, expectedAngle] of [['line-plane-1', 3, 4, 5, 45], ['line-plane-2', 6, 8, 10 * Math.sqrt(3), 60]]) {
  test(`${id}: perpendicular projection and dot products independently give ${expectedAngle}°`, () => {
    const lesson = lessons.find(l => l.id === id);
    const p = lesson.model.points;
    near(distance(p.A, p.B), ab, 'AB agrees with the condition');
    near(distance(p.A, p.D), ad, 'AD agrees with the condition');
    near(distance(p.A, p['A₁']), height, 'AA₁ agrees with the condition');
    const x = sub(p.B, p.A), y = sub(p.D, p.A), z = sub(p['A₁'], p.A);
    perpendicular(x, y); perpendicular(x, z); perpendicular(y, z);
    for (const name of ['A', 'B', 'C', 'D']) samePoint(sub(p[`${name}₁`], p[name]), z, `parallel equal edge ${name}`);
    const baseNormal = cross(x, y);
    const foot = p['C₁'].map((v, i) => v - baseNormal[i] * dot(sub(p['C₁'], p.A), baseNormal) / dot(baseNormal, baseNormal));
    samePoint(foot, p.C, 'orthogonal projection of C₁ equals C');
    const spatialDiagonal = sub(p['C₁'], p.A);
    const projectedDiagonal = sub(foot, p.A);
    near(degrees(spatialDiagonal, projectedDiagonal), expectedAngle, 'angle between line and its projection');
    near(distance(p.A, p.C) ** 2, Number(field(lesson, 'diagonal-square').correct), 'Pythagorean square answer');
    near(distance(p.A, p.C), Number(field(lesson, 'diagonal').correct), 'base diagonal answer');
    const tanValue = field(lesson, 'tangent').correct === 'one' ? 1 : Math.sqrt(3);
    near(distance(p.C, p['C₁']) / distance(p.A, p.C), tanValue, 'exact tangent option');
    near(Number(field(lesson, 'angle-degrees').correct), expectedAngle, 'final angle answer');
    assert.equal(field(lesson, 'segment-projection').correct, 'ac');
    assert.equal(field(lesson, 'angle').correct, 'c1ac');
  });
}

for (const [id, side, height, expectedAngle] of [['dihedral-1', 12, 6, 45], ['dihedral-2', 10, 5 * Math.sqrt(3), 60]]) {
  test(`${id}: regular pyramid and perpendicular section independently give ${expectedAngle}°`, () => {
    const lesson = lessons.find(l => l.id === id);
    const { A, B, C, D, S, O, M } = lesson.model.points;
    const baseVertices = [A, B, C, D];
    for (let i = 0; i < 4; i++) {
      near(distance(baseVertices[i], baseVertices[(i + 1) % 4]), side, 'base side agrees with the condition');
      perpendicular(sub(baseVertices[(i + 1) % 4], baseVertices[i]), sub(baseVertices[(i + 3) % 4], baseVertices[i]));
      near(distance(S, baseVertices[i]), distance(S, A), 'all lateral edges are equal');
    }
    samePoint(O, midpoint(A, C), 'O bisects AC');
    samePoint(O, midpoint(B, D), 'O bisects BD');
    samePoint(M, midpoint(A, B), 'M bisects AB');
    near(distance(S, O), height, 'height agrees with the condition');
    perpendicular(sub(S, O), sub(B, A));
    perpendicular(sub(S, O), sub(D, A));
    perpendicular(sub(S, M), sub(B, A));
    perpendicular(sub(O, M), sub(B, A));
    perpendicular(sub(S, O), sub(M, O));
    near(degrees(sub(S, M), sub(O, M)), expectedAngle, 'angle of the two inward perpendicular rays');
    // Compare the acute angle of plane normals as a second route, independent of triangle tangent.
    const baseNormal = cross(sub(B, A), sub(D, A));
    const faceNormal = cross(sub(B, A), sub(S, A));
    const normalAngle = degrees(baseNormal, faceNormal);
    near(Math.min(normalAngle, 180 - normalAngle), expectedAngle, 'angle between base and side planes');
    near(distance(O, M), Number(field(lesson, 'center-side').correct), 'OM answer');
    const tanValue = field(lesson, 'tangent-value').correct === 'one' ? 1 : Math.sqrt(3);
    near(distance(S, O) / distance(O, M), tanValue, 'exact tangent option');
    near(Number(field(lesson, 'dihedral-degrees').correct), expectedAngle, 'final dihedral answer');
    assert.equal(field(lesson, 'linear-angle').correct, 'smo');
    assert.equal(field(lesson, 'normal-section').correct, 'perpendicular');
    assert.equal(field(lesson, 'tangent-ratio').correct, 'so-om');
  });
}
