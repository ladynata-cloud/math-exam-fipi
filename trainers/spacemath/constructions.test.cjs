'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
const C = require('./constructions.js');
const p = (id, x, y, extra = {}) => ({ id, type: 'point', label: id.toUpperCase(), x, y, ...extra });
const o = (id, type, parents, extra = {}) => ({ id, type, label: id, parents, ...extra });
const state = objects => ({ ...M.empty(), objects });
const apply = (model, tool, parents, param) => {
  const batch = C.build(model, tool, parents, param);
  return { ...batch, model: { ...model, objects: batch.objects } };
};
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≈ ${b}`);
const coords = value => [value.x, value.y];
const signedArea = vertices => vertices.reduce((sum, a, i) => {
  const b = vertices[(i + 1) % vertices.length];
  return sum + a[0] * b[1] - a[1] * b[0];
}, 0) / 2;
const perimeter = vertices => vertices.reduce((sum, a, i) => {
  const b = vertices[(i + 1) % vertices.length];
  return sum + Math.hypot(a[0] - b[0], a[1] - b[1]);
}, 0);

test('fixed-length segment follows direction, preserves length and recovers with the same IDs', () => {
  const source = state([p('a', 0, 0), p('b', 4, 0)]), before = JSON.stringify(source);
  const batch = apply(source, 'fixedLength', ['a', 'b'], 3), model = batch.model;
  assert.equal(JSON.stringify(source), before);
  assert.equal(batch.objects.length, 4);
  assert.deepEqual(coords(M.evaluate(model)[batch.parameterId]), [3, 0]);
  model.objects[1].x = 0; model.objects[1].y = 4;
  assert.deepEqual(coords(M.evaluate(model)[batch.parameterId]), [0, 3]);
  model.objects[1].y = 0;
  assert.equal(M.evaluate(model)[batch.selectedId].defined, false);
  model.objects[1].x = -8;
  assert.deepEqual(coords(M.evaluate(model)[batch.parameterId]), [-3, 0]);
  model.objects.find(item => item.id === batch.parameterId).length = 0;
  assert.deepEqual(coords(M.evaluate(model)[batch.parameterId]), [0, 0]);
  assert.equal(M.evaluate(model)[batch.selectedId].defined, false);
});

test('fixed angle creates live sides and a visible magnitude with editable signed direction', () => {
  const batch = apply(state([p('a', 2, 0), p('o', 0, 0)]), 'fixedAngle', ['a', 'o'], { angle: 90 });
  assert.equal(batch.objects.length, 6);
  assert.equal(batch.objects.filter(item => item.type === 'ray').length, 2);
  const measure = batch.objects.find(item => item.type === 'angle');
  assert.deepEqual(coords(M.evaluate(batch.model)[batch.parameterId]), [0, 2]);
  assert.deepEqual(M.evaluate(batch.model)[batch.selectedId].domain, [0, Infinity]);
  assert.equal(M.evaluate(batch.model)[measure.id].value, 90);
  batch.objects.find(item => item.id === batch.parameterId).angle = -90;
  batch.objects[0].x = 4;
  assert.deepEqual(coords(M.evaluate(batch.model)[batch.parameterId]), [0, -4]);
  assert.equal(M.evaluate(batch.model)[measure.id].value, 90);
  batch.objects.find(item => item.id === batch.parameterId).angle = 60;
  const values = M.evaluate(batch.model);
  close(values[measure.id].value, 60);
  close(values[batch.parameterId].x, 2);
  close(values[batch.parameterId].y, 2 * Math.sqrt(3));
});

test('regular polygons have equal sides, correct signed area and direct shared-side dependencies', () => {
  for (const sides of [3, 4, 6, 30]) for (const orientation of [-1, 1]) {
    const batch = apply(state([p('a', 1, 2), p('b', 3, 2)]), 'regularPolygon', ['a', 'b'], { sides, orientation });
    const vertices = M.evaluate(batch.model)[batch.selectedId].vertices;
    assert.equal(vertices.length, sides);
    for (let i = 0; i < sides; i++) close(Math.hypot(vertices[i][0] - vertices[(i + 1) % sides][0], vertices[i][1] - vertices[(i + 1) % sides][1]), 2);
    close(signedArea(vertices), orientation * sides / Math.tan(Math.PI / sides));
    for (const vertex of batch.objects.filter(item => item.type === 'regularVertex')) assert.deepEqual(vertex.parents, ['a', 'b']);
    const ids = batch.objects.map(item => item.id);
    batch.objects[1].x = 1; batch.objects[1].y = 2;
    assert.equal(M.evaluate(batch.model)[batch.selectedId].defined, false);
    batch.objects[1].y = 6;
    const changed = M.evaluate(batch.model)[batch.selectedId].vertices;
    close(perimeter(changed), 4 * sides);
    assert.deepEqual(batch.objects.map(item => item.id), ids);
  }
});

test('all image polygon vertices follow one shared transformation parameter and changed originals', () => {
  const source = state([p('a', 0, 0), p('b', 2, 0), p('c', 0, 1), o('triangle', 'polygon', ['a', 'b', 'c']), p('origin', 1, 1)]);
  const batch = apply(source, 'transformFigure', ['triangle', 'origin'], { mode: 'rotate', angle: 90 });
  const descriptor = batch.objects.find(item => item.id === batch.parameterId);
  const copies = batch.objects.filter(item => item.type === 'transformedPoint');
  assert.equal(copies.length, 3);
  for (const copy of copies) assert.equal(copy.parents[1], descriptor.id);
  assert.deepEqual(M.evaluate(batch.model)[batch.selectedId].vertices, [[2, 0], [2, 2], [1, 0]]);
  descriptor.angle = 180;
  assert.deepEqual(M.evaluate(batch.model)[batch.selectedId].vertices, [[2, 2], [0, 2], [2, 1]]);
  batch.objects[1].x = 3;
  assert.deepEqual(M.evaluate(batch.model)[batch.selectedId].vertices[1], [-1, 2]);
  assert.deepEqual(source.objects[1], p('b', 2, 0));
});

test('reflection reverses orientation; negative homothety preserves it and scales area by k squared', () => {
  const source = state([p('a', 0, 0), p('b', 2, 0), p('c', 0, 1), o('triangle', 'polygon', ['a', 'b', 'c']), o('axis', 'line', ['a', 'b'])]);
  const original = M.evaluate(source).triangle.vertices;
  const reflected = apply(source, 'transformFigure', ['triangle', 'axis'], { mode: 'reflectLine' });
  const reflection = M.evaluate(reflected.model)[reflected.selectedId].vertices;
  close(signedArea(reflection), -signedArea(original));
  close(perimeter(reflection), perimeter(original));
  const dilated = apply(source, 'transformFigure', ['triangle', 'a'], { mode: 'dilate', factor: -2 });
  let image = M.evaluate(dilated.model)[dilated.selectedId];
  close(signedArea(image.vertices), 4 * signedArea(original));
  close(perimeter(image.vertices), 2 * perimeter(original));
  dilated.objects.find(item => item.id === dilated.parameterId).factor = 0;
  assert.equal(M.evaluate(dilated.model)[dilated.selectedId].defined, false);
  dilated.objects.find(item => item.id === dilated.parameterId).factor = 1;
  assert.deepEqual(M.evaluate(dilated.model)[dilated.selectedId].vertices, original);
});

test('primitive and derived line images preserve line, ray and segment domains', () => {
  const source = state([
    p('a', 0, 0), p('b', 2, 0), p('c', 0, 2), p('d', 1, 1),
    o('segment', 'segment', ['a', 'b']), o('ray', 'ray', ['a', 'b']),
    o('axis', 'line', ['a', 'b']), o('parallel', 'parallel', ['axis', 'd']),
    o('bisector', 'bisector', ['b', 'a', 'c'])
  ]);
  for (const [id, domain] of [['segment', [0, 1]], ['ray', [0, Infinity]], ['parallel', [-Infinity, Infinity]], ['bisector', [0, Infinity]]]) {
    const batch = apply(source, 'transformFigure', [id, 'a'], { mode: 'rotate', angle: 90 });
    const value = M.evaluate(batch.model)[batch.selectedId];
    assert.equal(value.defined, true, id);
    assert.deepEqual(value.domain, domain, id);
    if (id === 'parallel') {
      assert.equal(batch.objects.length, source.objects.length + 2);
      batch.objects.find(item => item.id === 'd').x = 3;
      assert.equal(M.evaluate(batch.model)[batch.selectedId].a[1], 3);
    }
  }
});

test('identity line and vector images do not lose a tiny direction at a large anchor', () => {
  const source = state([
    p('a', 0, 0), p('b', 1e-20, 0), p('anchor', 1000000, 0),
    o('base', 'line', ['a', 'b']), o('parallel', 'parallel', ['base', 'anchor']),
    o('smallvector', 'vector', ['a', 'b']), o('offset', 'vector', ['a', 'anchor'])
  ]);
  const line = apply(source, 'transformFigure', ['parallel', 'a'], { mode: 'dilate', factor: 1 });
  const lineValues = M.evaluate(line.model);
  assert.equal(lineValues.parallel.defined, true);
  assert.deepEqual(lineValues[line.selectedId], lineValues.parallel);
  const vector = apply(source, 'transformFigure', ['smallvector', 'offset'], { mode: 'translate' });
  assert.deepEqual(M.evaluate(vector.model)[vector.selectedId].a, [1000000, 0]);
  assert.deepEqual(M.evaluate(vector.model)[vector.selectedId].d, [1e-20, 0]);
  const identity = apply(vector.model, 'transformFigure', [vector.selectedId, 'a'], { mode: 'dilate', factor: 1 });
  assert.deepEqual(M.evaluate(identity.model)[identity.selectedId], M.evaluate(vector.model)[vector.selectedId]);
});

test('circle images follow the original radius and a shared signed dilation factor', () => {
  const source = state([p('a', 1, 1), p('origin', 0, 0), o('circle', 'circleRadius', ['a'], { radius: 3 })]);
  const batch = apply(source, 'transformFigure', ['circle', 'origin'], { mode: 'dilate', factor: 2 });
  let value = M.evaluate(batch.model)[batch.selectedId];
  assert.deepEqual(value.c, [2, 2]); close(value.r, 6);
  batch.objects.find(item => item.id === 'circle').radius = 4;
  batch.objects.find(item => item.id === batch.parameterId).factor = -3;
  value = M.evaluate(batch.model)[batch.selectedId];
  assert.deepEqual(value.c, [-3, -3]); close(value.r, 12);
  assert.equal(batch.objects.length, source.objects.length + 2);
  assert.deepEqual(batch.objects.find(item => item.id === batch.selectedId).parents, ['circle', batch.parameterId]);
  batch.objects.find(item => item.id === batch.parameterId).factor = 0;
  assert.equal(M.evaluate(batch.model)[batch.selectedId].defined, false);
  batch.objects.find(item => item.id === batch.parameterId).factor = 1;
  assert.equal(M.evaluate(batch.model)[batch.selectedId].r, 4);
});

test('an identity circle image preserves a tiny radius at a large center', () => {
  const source = state([p('center', 1000000, 0), p('origin', 0, 0), o('circle', 'circleRadius', ['center'], { radius: 1e-20 })]);
  const batch = apply(source, 'transformFigure', ['circle', 'origin'], { mode: 'dilate', factor: 1 });
  const values = M.evaluate(batch.model);
  assert.equal(values.circle.defined, true);
  assert.deepEqual(values[batch.selectedId], values.circle);
});

test('circle through three moving points transforms through its live center, not copied coordinates', () => {
  const source = state([p('a', 1, 0), p('b', -1, 0), p('c', 0, 1), p('origin', 2, 0), o('circle', 'circle3', ['a', 'b', 'c'])]);
  const batch = apply(source, 'transformFigure', ['circle', 'origin'], { mode: 'reflectPoint' });
  let values = M.evaluate(batch.model);
  close(values[batch.selectedId].c[0], 4); close(values[batch.selectedId].c[1], 0); close(values[batch.selectedId].r, 1);
  batch.objects[2].y = 2;
  values = M.evaluate(batch.model);
  close(values[batch.selectedId].c[0], 4 - values.circle.c[0]);
  close(values[batch.selectedId].c[1], -values.circle.c[1]);
  close(values[batch.selectedId].r, values.circle.r);
});

test('point and vector translations retain vector dependencies, including a zero vector', () => {
  const source = state([p('a', 1, 2), p('b', 4, 6), p('origin', 0, 0), o('vector', 'vector', ['a', 'b']), o('zero', 'vector', ['a', 'a'])]);
  const point = apply(source, 'transformFigure', ['origin', 'vector'], { mode: 'translate' });
  assert.deepEqual(coords(M.evaluate(point.model)[point.selectedId]), [3, 4]);
  point.objects[1].x = 6;
  assert.deepEqual(coords(M.evaluate(point.model)[point.selectedId]), [5, 4]);
  const vector = apply(source, 'transformFigure', ['vector', 'zero'], { mode: 'translate' });
  assert.deepEqual(M.evaluate(vector.model)[vector.selectedId].d, [3, 4]);
  assert.deepEqual(M.evaluate(vector.model)[vector.selectedId].a, [1, 2]);
});

test('batch allocation produces unique IDs and point labels and preserves source appearance without aliasing', () => {
  const source = state([p('o1', 0, 0, { label: 'A', appearance: { visible: false, color: '#123456' } }), p('o3', 2, 0, { label: 'B' })]);
  const before = JSON.stringify(source);
  const regular = apply(source, 'regularPolygon', ['o1', 'o3'], 6);
  const transformed = apply(regular.model, 'transformFigure', [regular.selectedId, 'o1'], { mode: 'rotate', angle: 60 });
  const ids = transformed.objects.map(item => item.id);
  const labels = transformed.objects.filter(item => M.pointTypes.includes(item.type)).map(item => item.label);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(labels).size, labels.length);
  const hiddenImage = transformed.objects.find(item => item.type === 'transformedPoint' && item.parents[0] === 'o1');
  assert.deepEqual(hiddenImage.appearance, { visible: false, color: '#123456' });
  hiddenImage.appearance.color = '#654321';
  assert.equal(source.objects[0].appearance.color, '#123456');
  assert.equal(JSON.stringify(source), before);
});

test('overflow and invalid parameters reject the complete batch without partial mutation', () => {
  const crowded = state(Array.from({ length: 159 }, (_, i) => p('p' + i, i, 0))), before = JSON.stringify(crowded);
  assert.throws(() => C.build(crowded, 'regularPolygon', ['p0', 'p1'], 3), /не более|много объектов/);
  assert.equal(JSON.stringify(crowded), before);
  const angleCrowded = state(crowded.objects.slice(0, 157)), angleBefore = JSON.stringify(angleCrowded);
  assert.throws(() => C.build(angleCrowded, 'fixedAngle', ['p0', 'p1'], 60), /не более|много объектов/);
  assert.equal(JSON.stringify(angleCrowded), angleBefore);
  const simple = state([p('a', 0, 0), p('b', 2, 0)]);
  for (const param of [2, 31, 3.5, Infinity, { sides: 4, orientation: 0 }, { sides: 4, script: 'bad' }]) assert.throws(() => C.build(simple, 'regularPolygon', ['a', 'b'], param));
  for (const param of [-1, Infinity, M.MAX_COORD + 1, '3']) assert.throws(() => C.build(simple, 'fixedLength', ['a', 'b'], param));
  for (const param of [{ mode: 'eval' }, { mode: 'rotate', angle: 90, x: 1 }, { mode: 'dilate', factor: Infinity }]) assert.throws(() => C.build(simple, 'transformFigure', ['a', 'b'], param));
  assert.throws(() => C.build(simple, 'fixedAngle', ['a', 'missing'], 90), /не найден/);
  assert.throws(() => C.build(simple, 'unknown', ['a', 'b'], 1), /Неизвестное/);
});
