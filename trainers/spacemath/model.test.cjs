'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
const p = (id, x, y) => ({ id, type: 'point', label: id.toUpperCase(), x, y });
const o = (id, type, parents, extra = {}) => ({ id, type, label: id, parents, ...extra });
const construction = objects => ({ ...M.empty(), objects });
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' ≈ ' + expected);

function regularPolygon(sides, orientation = 1, a = [0, 0], b = [2, 0]) {
  const objects = [p('a', ...a), p('b', ...b)], vertices = ['a', 'b'];
  for (let index = 2; index < sides; index++) {
    const id = 'v' + index; vertices.push(id);
    objects.push(o(id, 'regularVertex', ['a', 'b'], { sides, index, orientation }));
  }
  objects.push(o('shape', 'polygon', vertices), o('area', 'area', ['shape']), o('perimeter', 'perimeter', ['shape']));
  return construction(objects);
}
const signedArea = vertices => vertices.reduce((sum, a, i) => {
  const b = vertices[(i + 1) % vertices.length]; return sum + a[0] * b[1] - a[1] * b[0];
}, 0) / 2;

test('fixed distance follows direction and origin, supports zero length, and recovers after a collapsed direction', () => {
  const state = construction([
    p('a', 1, -2), p('direction', 4, 2),
    o('end', 'fixedDistance', ['a', 'direction'], { length: 10 }),
    o('segment', 'segment', ['a', 'end']), o('distance', 'distance', ['a', 'end'])
  ]);
  let result = M.evaluate(state);
  assert.deepEqual([result.end.x, result.end.y], [7, 6]);
  assert.equal(result.distance.value, 10);
  for (const [a, direction] of [[[2, 3], [2, 8]], [[-8, -4], [-11, -8]], [[0, 0], [Number.MIN_VALUE, 0]]]) {
    Object.assign(state.objects[0], { x: a[0], y: a[1] });
    Object.assign(state.objects[1], { x: direction[0], y: direction[1] });
    result = M.evaluate(state);
    assert.equal(result.end.defined, true);
    close(result.distance.value, 10, 1e-13);
  }
  assert.deepEqual([result.end.x, result.end.y], [10, 0]);
  state.objects[1].y = Number.MIN_VALUE;
  result = M.evaluate(state);
  close(result.end.x, 10 / Math.sqrt(2), 1e-14);
  close(result.end.y, 10 / Math.sqrt(2), 1e-14);
  close(result.distance.value, 10, 1e-14);
  state.objects[2].length = 0;
  result = M.evaluate(state);
  assert.deepEqual([result.end.x, result.end.y], [0, 0]);
  assert.equal(result.segment.defined, false);
  assert.equal(result.distance.value, 0);
  state.objects[1].x = state.objects[1].y = 0;
  assert.equal(M.evaluate(state).end.defined, false, 'even zero length cannot choose a missing direction');
  state.objects[2].length = M.MAX_COORD; state.objects[1].y = -1;
  result = M.evaluate(state);
  assert.deepEqual([result.end.x, result.end.y], [0, -M.MAX_COORD]);
  assert.deepEqual(M.descendants(state, 'direction'), ['direction', 'end', 'segment', 'distance']);
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(state))), state);
});

test('fixed distance does not silently represent a positive unresolvable length as a zero-length segment', () => {
  const state = construction([p('a', 1, 1), p('direction', 2, 1), o('end', 'fixedDistance', ['a', 'direction'], { length: Number.MIN_VALUE })]);
  assert.equal(M.evaluate(state).end.defined, false);
  state.objects[0].x = state.objects[0].y = 0;
  state.objects[1].y = 0;
  assert.equal(M.evaluate(state).end.defined, true);
});

test('fixed distance rejects large relative length errors from offset quantization without snapping the endpoint', () => {
  const state = construction([p('a', 999999, 0), p('direction', 1000000, 0), o('end', 'fixedDistance', ['a', 'direction'], { length: 6e-11 })]);
  for (const requested of [6e-11, 1e-10]) {
    state.objects[2].length = requested;
    const representedLength = 999999 + requested - 999999;
    assert.ok(Math.abs(representedLength / requested - 1) > .1, 'fixture reproduces the large relative error');
    const result = M.evaluate(state);
    assert.equal(result.end.defined, false);
    assert.match(result.end.reason, /точности/);
    assert.equal(state.objects[2].length, requested, 'requested length is retained, never rounded or replaced');
  }
  state.objects[2].length = 2 ** -33;
  let result = M.evaluate(state);
  assert.equal(result.end.defined, true, 'an exactly representable one-ULP length at the same offset remains valid');
  assert.equal(result.end.x - 999999, 2 ** -33);
  state.objects[2].length = 1;
  result = M.evaluate(state);
  assert.deepEqual([result.end.x, result.end.y], [1000000, 0]);
});

test('fixed-distance fidelity accepts ordinary translated, tiny and representable subnormal constructions', () => {
  const fixtures = [
    [[0, 0], [3, 4], 5], [[1000, -1000], [1003, -996], .1],
    [[999999, -999999], [1000000, -999998], 1],
    [[0, 0], [3e-300, 4e-300], 5e-300],
    [[0, 0], [Number.MIN_VALUE, 0], Number.MIN_VALUE],
    [[0, 0], [0, -Number.MIN_VALUE], 8 * Number.MIN_VALUE]
  ];
  for (const [origin, direction, requested] of fixtures) {
    const result = M.evaluate(construction([p('a', ...origin), p('direction', ...direction), o('end', 'fixedDistance', ['a', 'direction'], { length: requested })]));
    assert.equal(result.end.defined, true, JSON.stringify({ origin, direction, requested }));
    close(Math.hypot((result.end.x - origin[0]) / requested, (result.end.y - origin[1]) / requested), 1, 1e-8);
  }
  const diagonal = construction([p('a', 0, 0), p('direction', 2, 1), o('end', 'fixedDistance', ['a', 'direction'], { length: Number.MIN_VALUE })]);
  assert.equal(M.evaluate(diagonal).end.defined, false, 'a matching scalar length must not hide an unrepresentable direction');
  diagonal.objects[2].length = 1e-300;
  assert.equal(M.evaluate(diagonal).end.defined, true, 'the same source recovers once its vector is representable');
});

test('regular polygons retain equal sides, angles, area and perimeter at several scales and orientations', () => {
  for (let sides = 3; sides <= 30; sides++) for (const orientation of [-1, 1]) for (const scale of [1e-100, 1, 1e5]) {
    const result = M.evaluate(regularPolygon(sides, orientation, [0, 0], [2 * scale, 0]));
    const vertices = result.shape.vertices, edgeLength = 2 * scale;
    assert.equal(result.shape.defined, true);
    const edges = vertices.map((a, i) => {
      const b = vertices[(i + 1) % sides], dx = (b[0] - a[0]) / edgeLength, dy = (b[1] - a[1]) / edgeLength;
      close(Math.hypot(dx, dy), 1, 4e-14);
      return [dx, dy];
    });
    for (let i = 0; i < sides; i++) {
      const a = edges[i], b = edges[(i + 1) % sides];
      close(a[0] * b[0] + a[1] * b[1], Math.cos(2 * Math.PI / sides), 8e-14);
      close(a[0] * b[1] - a[1] * b[0], orientation * Math.sin(2 * Math.PI / sides), 8e-14);
    }
    close(result.perimeter.value / edgeLength, sides, 5e-13);
    close(result.area.value / (scale * scale), sides / Math.tan(Math.PI / sides), 5e-12);
    assert.equal(Math.sign(signedArea(vertices.map(v => v.map(x => x / scale)))), orientation);
  }
});

test('regular vertices follow rotated or reflected defining sides and recover with unchanged identities', () => {
  const state = regularPolygon(4), before = M.evaluate(state);
  assert.deepEqual(before.shape.vertices, [[0, 0], [2, 0], [2, 2], [0, 2]]);
  for (const object of state.objects.filter(item => item.type === 'point')) {
    const { x, y } = object; object.x = -y + 3; object.y = x - 1;
  }
  assert.deepEqual(M.evaluate(state).shape.vertices, before.shape.vertices.map(([x, y]) => [-y + 3, x - 1]));
  for (const object of state.objects.filter(item => item.type === 'point')) object.x = -object.x;
  for (const object of state.objects.filter(item => item.type === 'regularVertex')) object.orientation *= -1;
  const reflected = M.evaluate(state);
  assert.deepEqual(reflected.shape.vertices, before.shape.vertices.map(([x, y]) => [y - 3, x - 1]));
  assert.equal(reflected.area.value, before.area.value);
  const saved = JSON.parse(JSON.stringify(state));
  state.objects[1].x = state.objects[0].x; state.objects[1].y = state.objects[0].y;
  const collapsed = M.evaluate(state);
  for (const id of ['v2', 'v3', 'shape', 'area', 'perimeter']) assert.equal(collapsed[id].defined, false, id);
  state.objects[1] = saved.objects[1];
  assert.deepEqual(M.evaluate(state), reflected);
  assert.deepEqual(M.descendants(state, 'a'), ['a', 'v2', 'v3', 'shape', 'area', 'perimeter']);
});

test('fixed-distance and regular-vertex schemas reject wrong parents, bounds, types and unknown keys', () => {
  const base = [p('a', 0, 0), p('b', 1, 0), o('line', 'line', ['a', 'b'])];
  const regular = { sides: 4, index: 2, orientation: 1 };
  const invalid = [
    o('bad', 'fixedDistance', ['a'], { length: 1 }), o('bad', 'fixedDistance', ['a', 'line'], { length: 1 }),
    ...[-1, M.MAX_COORD + 1, '2', null, true, NaN, Infinity].map(length => o('bad', 'fixedDistance', ['a', 'b'], { length })),
    ...[2, 31, 3.5, '4'].map(sides => o('bad', 'regularVertex', ['a', 'b'], { ...regular, sides })),
    ...[0, 1, 4, 2.5, '2'].map(index => o('bad', 'regularVertex', ['a', 'b'], { ...regular, index })),
    ...[0, 2, '1', true].map(orientation => o('bad', 'regularVertex', ['a', 'b'], { ...regular, orientation })),
    o('bad', 'regularVertex', ['a', 'line'], regular), o('bad', 'regularVertex', ['a', 'b'], { ...regular, vertices: [] })
  ];
  for (const value of invalid) assert.throws(() => M.normalize(construction([...base, value])), JSON.stringify(value));
});

test('one transformation descriptor changes every dependent vertex and retains exact quarter-turn and identity semantics', () => {
  const state = construction([
    p('origin', 0, 0), p('a', 1, 0), p('b', 3, 0), p('c', 1, 2),
    o('turn', 'transformation', ['origin'], { mode: 'rotate', angle: 90 }),
    ...['a', 'b', 'c'].map(id => o(id + 'image', 'transformedPoint', [id, 'turn'])),
    o('shape', 'polygon', ['aimage', 'bimage', 'cimage']), o('area', 'area', ['shape'])
  ]);
  assert.deepEqual(M.evaluate(state).shape.vertices, [[0, 1], [0, 3], [-2, 1]]);
  const descriptor = state.objects.find(item => item.id === 'turn');
  for (const angle of [0, 90, 180, 270, 360, -90, 1e-15]) {
    descriptor.angle = angle;
    const withLegacy = JSON.parse(JSON.stringify(state));
    for (const id of ['a', 'b', 'c']) withLegacy.objects.push(o(id + 'legacy', 'rotate', [id, 'origin'], { angle }));
    const result = M.evaluate(withLegacy);
    for (const id of ['a', 'b', 'c']) assert.deepEqual(result[id + 'image'], result[id + 'legacy']);
    close(result.area.value, 2, 1e-14);
  }
  descriptor.mode = 'dilate'; delete descriptor.angle; descriptor.factor = -2;
  let result = M.evaluate(state);
  assert.deepEqual(result.shape.vertices, [[-2, 0], [-6, 0], [-2, -4]]);
  assert.equal(result.area.value, 8);
  assert.ok(signedArea(result.shape.vertices) > 0, 'negative scaling in two dimensions preserves orientation');
  descriptor.factor = 0; assert.equal(M.evaluate(state).shape.defined, false);
  descriptor.factor = 1; result = M.evaluate(state);
  assert.deepEqual(result.shape.vertices, [[1, 0], [3, 0], [1, 2]]);
  assert.deepEqual(M.descendants(state, 'turn'), ['turn', 'aimage', 'bimage', 'cimage', 'shape', 'area']);
});

test('shared reflection and translation respect live references, degeneracy and zero-vector identity', () => {
  const state = construction([
    p('o', 0, 0), p('direction', 1, 1), p('source', 3, 1),
    o('axis', 'line', ['o', 'direction']), o('vector', 'vector', ['o', 'direction']),
    o('mirror', 'transformation', ['axis'], { mode: 'reflectLine' }),
    o('central', 'transformation', ['o'], { mode: 'reflectPoint' }),
    o('shift', 'transformation', ['vector'], { mode: 'translate' }),
    o('reflected', 'transformedPoint', ['source', 'mirror']),
    o('opposite', 'transformedPoint', ['source', 'central']),
    o('translated', 'transformedPoint', ['source', 'shift'])
  ]);
  let result = M.evaluate(state);
  close(result.reflected.x, 1, 2e-15); close(result.reflected.y, 3, 2e-15);
  assert.deepEqual([result.opposite.x, result.opposite.y], [-3, -1]);
  assert.deepEqual([result.translated.x, result.translated.y], [4, 2]);
  state.objects[1].x = state.objects[1].y = 0;
  result = M.evaluate(state);
  assert.equal(result.mirror.defined, false); assert.equal(result.reflected.defined, false);
  assert.equal(result.shift.defined, true);
  assert.deepEqual([result.translated.x, result.translated.y], [3, 1]);
  state.objects[1].x = 2;
  result = M.evaluate(state);
  assert.deepEqual([result.reflected.x, result.reflected.y], [3, -1]);
  assert.deepEqual([result.translated.x, result.translated.y], [5, 1]);
});

test('circle centers and transformed circle helpers track radius, center and zero-factor recovery', () => {
  const state = construction([
    p('o', 1, 2), p('center', 3, 4), o('source', 'circleRadius', ['center'], { radius: 2 }),
    o('middle', 'circleCenter', ['source']), o('edge', 'pointOn', ['source'], { parameter: 0 }),
    o('scale', 'transformation', ['o'], { mode: 'dilate', factor: -3 }),
    o('middleimage', 'transformedPoint', ['middle', 'scale']), o('edgeimage', 'transformedPoint', ['edge', 'scale']),
    o('image', 'circle', ['middleimage', 'edgeimage'])
  ]);
  let result = M.evaluate(state);
  assert.deepEqual(result.image.c, [-5, -4]); assert.equal(result.image.r, 6);
  state.objects[1].x = 4; state.objects[2].radius = 5;
  result = M.evaluate(state);
  assert.deepEqual(result.image.c, [-8, -4]); assert.equal(result.image.r, 15);
  state.objects[5].factor = 0; assert.equal(M.evaluate(state).image.defined, false);
  state.objects[5].factor = -3; assert.deepEqual(M.evaluate(state).image, result.image);
  const degenerate = construction([p('a', 0, 0), p('b', 1, 0), p('c', 0, 1), o('circle', 'circle3', ['a', 'b', 'c']), o('center', 'circleCenter', ['circle'])]);
  assert.deepEqual([M.evaluate(degenerate).center.x, M.evaluate(degenerate).center.y], [.5, .5]);
  degenerate.objects[2].y = 0; assert.equal(M.evaluate(degenerate).center.defined, false);
  degenerate.objects[2].y = 2; assert.deepEqual([M.evaluate(degenerate).center.x, M.evaluate(degenerate).center.y], [.5, 1]);
});

test('direct transformed circles preserve tiny offset radii, shared changes, negative scale and path behavior', () => {
  const state = construction([
    p('o', 0, 0), p('center', M.MAX_COORD, 0), o('source', 'circleRadius', ['center'], { radius: 1e-20 }),
    o('scale', 'transformation', ['o'], { mode: 'dilate', factor: 1 }),
    o('image', 'transformedCircle', ['source', 'scale'], { appearance: { color: '#123456', visible: false } }),
    o('middle', 'circleCenter', ['image']), o('on', 'pointOn', ['image'], { parameter: .25 }),
    o('length', 'circumference', ['image']), o('area', 'area', ['image'])
  ]);
  let result = M.evaluate(state);
  assert.deepEqual(result.image, result.source, 'identity must preserve a tiny radius even when center+radius equals center');
  assert.deepEqual([result.middle.x, result.middle.y], [M.MAX_COORD, 0]);
  assert.equal(result.on.defined, true); assert.equal(result.on.y, 1e-20);
  assert.equal(M.projectParameter(result.image, M.MAX_COORD, 1), .25);
  close(result.length.value / 1e-20, 2 * Math.PI, 1e-14);
  close(result.area.value / 1e-40, Math.PI, 1e-14);
  state.objects[3].factor = -3;
  result = M.evaluate(state);
  assert.deepEqual(result.image.c, [-3 * M.MAX_COORD, 0]); close(result.image.r / 1e-20, 3, 1e-15);
  state.objects[3].factor = 0;
  for (const id of ['image', 'middle', 'on', 'length', 'area']) assert.equal(M.evaluate(state)[id].defined, false);
  state.objects[3].factor = -3; assert.deepEqual(M.evaluate(state).image, result.image);
  assert.deepEqual(M.normalize(state).objects[4].appearance, { visible: false, color: '#123456' });
  state.objects[2].radius = 2e-20; close(M.evaluate(state).image.r / 1e-20, 6, 2e-15);
});

test('direct transformed circles follow a three-point circle through reflection, rotation and degeneracy', () => {
  const state = construction([
    p('a', 1, 0), p('b', 0, 1), p('c', -1, 0), p('origin', 0, 0), p('axisend', 0, 2),
    o('source', 'circle3', ['a', 'b', 'c']), o('axis', 'line', ['origin', 'axisend']),
    o('mirror', 'transformation', ['axis'], { mode: 'reflectLine' }),
    o('image', 'transformedCircle', ['source', 'mirror']),
    o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 90 }), o('turned', 'transformedCircle', ['image', 'turn'])
  ]);
  let result = M.evaluate(state);
  close(result.image.c[0], 0, 5e-16); close(result.image.c[1], 0, 5e-16); close(result.image.r, 1, 5e-16);
  close(result.turned.c[0], 1, 5e-16); close(result.turned.c[1], -1, 5e-16); close(result.turned.r, 1, 5e-16);
  state.objects[1].y = 2;
  result = M.evaluate(state);
  close(result.image.c[1], .75, 1e-15); close(result.image.r, 1.25, 1e-15);
  state.objects[1].y = 0;
  assert.equal(M.evaluate(state).image.defined, false); assert.equal(M.evaluate(state).turned.defined, false);
  state.objects[1].y = 2; assert.deepEqual(M.evaluate(state).image, result.image);
  assert.deepEqual(M.descendants(state, 'source'), ['source', 'image', 'turned']);
});

test('a shared similarity preserves circle incidence for tangents without snapping independent near-rim points', () => {
  const state = construction([
    p('a', 0, 0), o('circle', 'circleRadius', ['a'], { radius: 1 }),
    o('on', 'pointOn', ['circle'], { parameter: .1 }), p('near', 1 + Number.EPSILON, 0),
    o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 1 }),
    o('circleimage', 'transformedCircle', ['circle', 'turn']),
    o('onimage', 'transformedPoint', ['on', 'turn']),
    o('first', 'tangent', ['circleimage', 'onimage'], { branch: 0 }),
    o('second', 'tangent', ['circleimage', 'onimage'], { branch: 1 }),
    o('identity', 'transformation', ['a'], { mode: 'rotate', angle: 0 }),
    o('independentcircle', 'transformedCircle', ['circle', 'identity']),
    o('independentpoint', 'transformedPoint', ['near', 'identity']),
    o('nearfirst', 'tangent', ['independentcircle', 'independentpoint'], { branch: 0 }),
    o('nearsecond', 'tangent', ['independentcircle', 'independentpoint'], { branch: 1 }),
    o('scale', 'transformation', ['a'], { mode: 'dilate', factor: -3 }),
    o('twicecircle', 'transformedCircle', ['circleimage', 'scale']),
    o('twicepoint', 'transformedPoint', ['onimage', 'scale']),
    o('twicefirst', 'tangent', ['twicecircle', 'twicepoint'], { branch: 0 }),
    o('twicesecond', 'tangent', ['twicecircle', 'twicepoint'], { branch: 1 })
  ]);
  for (const angle of [1, 7, 15, 273]) {
    state.objects[4].angle = angle;
    const result = M.evaluate(state);
    assert.equal(result.first.defined, true); assert.equal(result.second.defined, false);
    assert.equal(result.twicefirst.defined, true); assert.equal(result.twicesecond.defined, false);
    assert.equal(result.nearfirst.defined, true); assert.equal(result.nearsecond.defined, true);
  }
});

test('direct transformed lines preserve tiny directions at offset anchors instead of rebuilding rounded endpoints', () => {
  const state = construction([
    p('a', 0, 0), p('b', 1e-20, 0), p('offset', M.MAX_COORD, 0),
    o('base', 'line', ['a', 'b']), o('source', 'parallel', ['base', 'offset']),
    o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 0 }),
    o('image', 'transformedLine', ['source', 'turn'])
  ]);
  let result = M.evaluate(state);
  assert.equal(result.source.a[0] + result.source.d[0], result.source.a[0], 'the endpoint-based reconstruction would collapse');
  assert.deepEqual(result.image, result.source);
  state.objects[5].angle = 90; result = M.evaluate(state);
  assert.deepEqual(result.image.a, [0, M.MAX_COORD]); assert.deepEqual(result.image.d, [0, 1e-20]);
  state.objects[5].mode = 'dilate'; delete state.objects[5].angle; state.objects[5].factor = -2;
  result = M.evaluate(state);
  assert.deepEqual(result.image.a, [-2 * M.MAX_COORD, 0]);
  assert.equal(result.image.d[0], -2e-20); assert.equal(Math.abs(result.image.d[1]), 0);
  state.objects[5].factor = 0; assert.equal(M.evaluate(state).image.defined, false);
  state.objects[5].factor = -2; assert.deepEqual(M.evaluate(state).image, result.image);
});

test('transformed segment and ray chains retain their domains for validation, dragging and intersections', () => {
  const state = construction([
    p('a', 0, 0), p('b', 2, 0), p('left', -1, -2), p('right', 1, -2),
    o('segment', 'segment', ['a', 'b']), o('ray', 'ray', ['a', 'b']), o('line', 'line', ['a', 'b']),
    o('crossline', 'line', ['left', 'right']),
    o('scale', 'transformation', ['a'], { mode: 'dilate', factor: -2 }),
    o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 90 }),
    o('segmentimage', 'transformedLine', ['segment', 'scale']),
    o('rayimage', 'transformedLine', ['ray', 'scale']), o('lineimage', 'transformedLine', ['line', 'scale']),
    o('twice', 'transformedLine', ['segmentimage', 'turn']),
    o('on', 'pointOn', ['twice'], { parameter: .25 }), o('onray', 'pointOn', ['rayimage'], { parameter: 2 }),
    o('online', 'pointOn', ['lineimage'], { parameter: -2 }),
    o('cross', 'intersection', ['twice', 'crossline'], { branch: 0 })
  ]);
  const result = M.evaluate(state);
  assert.deepEqual(result.twice.domain, [0, 1]);
  assert.deepEqual(result.rayimage.domain, [0, Infinity]);
  assert.deepEqual(result.lineimage.domain, [-Infinity, Infinity]);
  assert.deepEqual([result.on.x, result.on.y], [0, -1]);
  assert.deepEqual([result.onray.x, result.onray.y], [-8, 0]);
  assert.deepEqual([result.online.x, result.online.y], [8, 0]);
  assert.deepEqual([result.cross.x, result.cross.y], [0, -2]);
  assert.equal(M.projectParameter(result.twice, 0, -100), 1);
  assert.equal(M.projectParameter(result.rayimage, 2, 0), 0);
  for (const [parent, parameter] of [['twice', -Number.EPSILON], ['twice', 1 + Number.EPSILON], ['rayimage', -Number.EPSILON], ['lineimage', M.MAX_COORD + 1]]) {
    assert.throws(() => M.normalize({ ...state, objects: [...state.objects, o('bad', 'pointOn', [parent], { parameter })] }));
  }
});

test('transformed vectors retain their linear component, accept zero scale and can drive another translation', () => {
  const state = construction([
    p('a', 0, 0), p('b', 1e-20, 0), p('far', M.MAX_COORD, 0), p('sample', 2, 3),
    o('source', 'vector', ['a', 'b']), o('shiftvector', 'vector', ['a', 'far']),
    o('shift', 'transformation', ['shiftvector'], { mode: 'translate' }),
    o('offsetvector', 'transformedVector', ['source', 'shift']),
    o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 90 }),
    o('turnedvector', 'transformedVector', ['offsetvector', 'turn']),
    o('move', 'transformation', ['turnedvector'], { mode: 'translate' }),
    o('direct', 'translate', ['a', 'turnedvector']), o('image', 'transformedPoint', ['a', 'move'])
  ]);
  let result = M.evaluate(state);
  assert.deepEqual(result.offsetvector.a, [M.MAX_COORD, 0]);
  assert.deepEqual(result.offsetvector.d, [1e-20, 0]);
  assert.deepEqual(result.turnedvector.a, [0, M.MAX_COORD]);
  assert.deepEqual(result.turnedvector.d, [0, 1e-20]);
  assert.deepEqual(result.direct, result.image); assert.equal(result.image.y, 1e-20);
  state.objects[8].mode = 'dilate'; delete state.objects[8].angle; state.objects[8].factor = 0;
  result = M.evaluate(state);
  assert.equal(result.turnedvector.defined, true); assert.deepEqual(result.turnedvector.d, [0, 0]);
  assert.deepEqual([result.image.x, result.image.y], [0, 0]);
  assert.deepEqual(M.vectorTypes, ['vector', 'transformedVector']);
});

test('nonzero vector underflow is undefined while genuine zero vectors and explicit zero scale remain valid', () => {
  const state = construction([
    p('a', 0, 0), p('b', Number.MIN_VALUE, 0), o('source', 'vector', ['a', 'b']),
    o('scale', 'transformation', ['a'], { mode: 'dilate', factor: .1 }),
    o('image', 'transformedVector', ['source', 'scale'])
  ]);
  assert.equal(M.evaluate(state).image.defined, false);
  state.objects[3].factor = 1;
  assert.deepEqual(M.evaluate(state).image.d, [Number.MIN_VALUE, 0]);
  state.objects[3].factor = 0;
  assert.equal(M.evaluate(state).image.defined, true); assert.deepEqual(M.evaluate(state).image.d, [0, 0]);
  state.objects[3].factor = .1; state.objects[1].x = 0;
  assert.equal(M.evaluate(state).image.defined, true); assert.deepEqual(M.evaluate(state).image.d, [0, 0]);
});

test('reflection descriptors normalize even subnormal reference directions without changing the angle', () => {
  const state = construction([
    p('a', 0, 0), p('b', Number.MIN_VALUE, Number.MIN_VALUE), p('source', 1, 0),
    o('axis', 'line', ['a', 'b']), o('reflection', 'transformation', ['axis'], { mode: 'reflectLine' }),
    o('image', 'transformedPoint', ['source', 'reflection']),
    o('vector', 'vector', ['a', 'source']), o('vectorimage', 'transformedVector', ['vector', 'reflection'])
  ]);
  const result = M.evaluate(state);
  close(result.image.x, 0, 3e-16); close(result.image.y, 1, 3e-16);
  close(result.vectorimage.d[0], 0, 3e-16); close(result.vectorimage.d[1], 1, 3e-16);
});

test('transformation schemas permit only a matching reference, bounded parameter and preceding descriptor', () => {
  const base = [p('a', 0, 0), p('b', 1, 0), o('axis', 'line', ['a', 'b']), o('v', 'vector', ['a', 'b']), o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 90 })];
  const invalid = [
    o('bad', 'transformation', ['a'], { mode: 'matrix', angle: 0 }),
    o('bad', 'transformation', ['v'], { mode: 'rotate', angle: 90 }),
    o('bad', 'transformation', ['a', 'b'], { mode: 'rotate', angle: 90 }),
    o('bad', 'transformation', ['a'], { mode: 'rotate', angle: 36001 }),
    o('bad', 'transformation', ['a'], { mode: 'rotate', angle: '90' }),
    o('bad', 'transformation', ['a'], { mode: 'rotate', angle: 90, factor: 1 }),
    o('bad', 'transformation', ['a'], { mode: 'dilate', factor: -1001 }),
    o('bad', 'transformation', ['a'], { mode: 'dilate', factor: null }),
    o('bad', 'transformation', ['a'], { mode: 'dilate', angle: 0 }),
    o('bad', 'transformation', ['a'], { mode: 'reflectLine' }),
    o('bad', 'transformation', ['axis'], { mode: 'reflectPoint' }),
    o('bad', 'transformation', ['v'], { mode: 'translate', angle: 0 }),
    o('bad', 'transformation', ['axis'], { mode: 'translate' }),
    o('bad', 'transformedPoint', ['a', 'v']), o('bad', 'transformedPoint', ['axis', 'turn']),
    o('bad', 'transformedPoint', ['a', 'missing']), o('bad', 'circleCenter', ['a']),
    o('bad', 'circleCenter', ['axis'], { radius: 1 }),
    o('bad', 'transformedCircle', ['axis', 'turn']), o('bad', 'transformedCircle', ['a', 'turn']),
    o('bad', 'transformedLine', ['v', 'turn']), o('bad', 'transformedLine', ['axis', 'a']),
    o('bad', 'transformedVector', ['axis', 'turn']), o('bad', 'transformedVector', ['v', 'a'])
  ];
  for (const item of invalid) assert.throws(() => M.normalize(construction([...base, item])), JSON.stringify(item));
});

test('optional partial appearance round-trips without changing geometry or adding fields to old models', () => {
  const state = regularPolygon(4);
  state.objects.push(o('f', 'functionGraph', [], { expression: 'x^2' }), o('table', 'functionTable', ['f'], { start: 0, end: 2, step: 1 }),
    o('turn', 'transformation', ['a'], { mode: 'rotate', angle: 90 }), o('image', 'transformedPoint', ['v2', 'turn']));
  const oldJSON = JSON.stringify(M.normalize(state)), expected = M.evaluate(state);
  assert.equal(JSON.stringify(M.normalize(state)), oldJSON);
  const legacy = construction([p('a', 1, 2), p('b', 3, 4), o('middle', 'midpoint', ['a', 'b']),
    { id: 'f', type: 'functionGraph', label: 'f', expression: 'x^2', parents: [] },
    { id: 'table', type: 'functionTable', label: 'table', start: 0, end: 2, step: 1, parents: ['f'] }]);
  assert.equal(JSON.stringify(M.normalize(legacy)), JSON.stringify(legacy), 'the canonical byte representation of legacy models does not gain appearance defaults');
  const full = { visible: false, labelVisible: false, color: '#aBc123', width: 6, dash: 2, fillOpacity: .6 };
  state.objects.forEach((item, i) => { item.appearance = i % 3 === 0 ? { ...full } : i % 3 === 1 ? { color: '#ff0000' } : {}; });
  const normalized = M.normalize(state);
  assert.deepEqual(normalized, state);
  assert.notEqual(normalized.objects[0].appearance, state.objects[0].appearance);
  assert.deepEqual(M.evaluate(state), expected, 'hidden parents still participate in every mathematical dependency');
  normalized.objects[0].appearance.visible = true;
  assert.equal(state.objects[0].appearance.visible, false);
  assert.equal(JSON.stringify(M.normalize(JSON.parse(oldJSON))), oldJSON);
});

test('appearance is data only: hostile colors, unknown fields, wrong types, prototypes and accessors are rejected', () => {
  const invalid = [
    null, [], 'red', { color: 'red' }, { color: '#fff' }, { color: '#000000ff' }, { color: 'url(javascript:alert(1))' },
    { color: '#123456;display:none' }, { color: '<svg>' }, { color: 123456 },
    { visible: 0 }, { labelVisible: 'false' }, { width: 0 }, { width: 7 }, { width: 1.5 }, { width: '2' },
    { dash: -1 }, { dash: 3 }, { dash: .5 }, { dash: true },
    { fillOpacity: -.01 }, { fillOpacity: .60001 }, { fillOpacity: '0.2' }, { fillOpacity: NaN },
    { fillOpacity: Infinity }, { onclick: 'alert(1)' }, { css: {} },
    JSON.parse('{"__proto__":{"visible":true}}'), Object.assign(Object.create({ color: '#ffffff' }), { visible: true })
  ];
  for (const appearance of invalid) assert.throws(() => M.normalize(construction([{ ...p('a', 0, 0), appearance }])));
  let invoked = 0;
  const accessor = Object.defineProperty({}, 'visible', { enumerable: true, get() { invoked++; return true; } });
  assert.throws(() => M.normalize(construction([{ ...p('a', 0, 0), appearance: accessor }])));
  assert.equal(invoked, 0, 'untrusted appearance accessors never execute');
});

test('constrained points follow changed parents, retain their parameters and recover after degeneracy', () => {
  const state = construction([
    p('a', 0, 0), p('b', 4, 0),
    o('segment', 'segment', ['a', 'b']), o('ray', 'ray', ['a', 'b']), o('line', 'line', ['a', 'b']),
    o('circle', 'circleRadius', ['b'], { radius: 3 }),
    o('s', 'pointOn', ['segment'], { parameter: .25 }), o('r', 'pointOn', ['ray'], { parameter: 2 }),
    o('l', 'pointOn', ['line'], { parameter: -1 }), o('c', 'pointOn', ['circle'], { parameter: .25 }),
    o('fullturn', 'pointOn', ['circle'], { parameter: 1 })
  ]);
  let result = M.evaluate(state);
  assert.deepEqual([result.s.x, result.s.y], [1, 0]);
  assert.deepEqual([result.r.x, result.r.y], [8, 0]);
  assert.deepEqual([result.l.x, result.l.y], [-4, 0]);
  assert.deepEqual([result.c.x, result.c.y], [4, 3]);
  assert.deepEqual([result.fullturn.x, result.fullturn.y], [7, 0]);
  state.objects[1].y = 4;
  result = M.evaluate(state);
  assert.deepEqual([result.s.x, result.s.y], [1, 1]);
  assert.deepEqual([result.c.x, result.c.y], [4, 7]);
  state.objects[1].x = state.objects[1].y = 0;
  result = M.evaluate(state);
  for (const id of ['s', 'r', 'l']) assert.equal(result[id].defined, false, id);
  assert.deepEqual([result.c.x, result.c.y], [0, 3]);
  state.objects[1].x = 8;
  assert.equal(M.evaluate(state).s.x, 2);
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(state))), state);
});

test('pointer projection clamps to the path, rejects invalid directions and works for a subnormal segment', () => {
  const result = M.evaluate(construction([
    p('a', 0, 0), p('b', 4, 0), p('tiny', 8 * Number.MIN_VALUE, 0),
    o('segment', 'segment', ['a', 'b']), o('ray', 'ray', ['a', 'b']), o('line', 'line', ['a', 'b']),
    o('circle', 'circleRadius', ['a'], { radius: 3 }), o('tinyseg', 'segment', ['a', 'tiny']),
    o('f', 'functionGraph', [], { expression: 'sqrt(x)' })
  ]));
  assert.equal(M.projectParameter(result.segment, 2, 7), .5);
  assert.equal(M.projectParameter(result.segment, -2, 7), 0);
  assert.equal(M.projectParameter(result.segment, 6, 7), 1);
  assert.equal(M.projectParameter(result.ray, -2, 7), 0);
  assert.equal(M.projectParameter(result.ray, 12, 7), 3);
  assert.equal(M.projectParameter(result.line, -2, 7), -.5);
  assert.equal(M.projectParameter(result.line, -1e20, 7), -M.MAX_COORD);
  assert.equal(M.projectParameter(result.circle, 0, -9), .75);
  assert.equal(M.projectParameter(result.circle, 0, 0), null);
  assert.equal(M.projectParameter(result.circle, NaN, 1), null);
  assert.equal(M.projectParameter(result.a, 0, 1), null);
  assert.equal(M.projectParameter(result.tinyseg, 4 * Number.MIN_VALUE, 0), .5);
  assert.equal(M.projectParameter(result.tinyseg, 1, 0), 1);
  assert.equal(M.projectParameter(result.f, -1e20, 7), -M.MAX_COORD);
});

test('a graph point and a table update from the same parameters and preserve undefined values', () => {
  const state = construction([
    o('a', 'slider', [], { name: 'a', min: -2, max: 2, step: 1, value: 1 }),
    o('f', 'functionGraph', ['a'], { expression: 'sqrt(x-a)' }),
    o('on', 'pointOn', ['f'], { parameter: 0 }),
    o('table', 'functionTable', ['f'], { start: -1, end: 2, step: 1 })
  ]);
  let result = M.evaluate(state);
  assert.equal(result.on.defined, false);
  assert.deepEqual(result.table.rows, [{ x: -1, y: null }, { x: 0, y: null }, { x: 1, y: 0 }, { x: 2, y: 1 }]);
  state.objects[0].value = -1;
  result = M.evaluate(state);
  assert.deepEqual([result.on.x, result.on.y], [0, 1]);
  assert.deepEqual(result.table.rows, [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: Math.sqrt(2) }, { x: 2, y: Math.sqrt(3) }]);
  assert.deepEqual(M.descendants(state, 'f'), ['f', 'on', 'table']);
});

test('decimal table grids include their aligned endpoint and do not hide a pole at zero', () => {
  const state = construction([
    o('f', 'functionGraph', [], { expression: '1/x' }),
    o('t', 'functionTable', ['f'], { start: -.3, end: .3, step: .1 }),
    o('u', 'functionTable', ['f'], { start: .1, end: .31, step: .1 }),
    o('v', 'functionTable', ['f'], { start: .3, end: .3, step: Number.MIN_VALUE })
  ]);
  const result = M.evaluate(state);
  assert.deepEqual(result.t.rows.map(row => row.x), [-.3, -.2, -.1, 0, .1, .2, .3]);
  assert.deepEqual(result.t.rows[3], { x: 0, y: null });
  assert.deepEqual(result.u.rows.map(row => row.x), [.1, .2, .3]);
  assert.equal(result.v.rows.length, 1);
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(state))), state);
});

test('vector translation follows endpoint edits and the zero vector acts as identity', () => {
  const state = construction([
    p('a', 2, -2), p('b', 6, 1), p('c', -1, 5),
    o('v', 'vector', ['a', 'b']), o('moved', 'translate', ['c', 'v']),
    o('segment', 'segment', ['c', 'moved'])
  ]);
  let result = M.evaluate(state);
  assert.deepEqual(result.v, { kind: 'vector', defined: true, a: [2, -2], d: [4, 3] });
  assert.deepEqual([result.moved.x, result.moved.y], [3, 8]);
  assert.deepEqual(result.segment.d, result.v.d);
  state.objects[1].x = 2; state.objects[1].y = -2;
  result = M.evaluate(state);
  assert.equal(result.v.defined, true);
  assert.deepEqual(result.v.d, [0, 0]);
  assert.deepEqual([result.moved.x, result.moved.y], [-1, 5]);
  assert.equal(result.segment.defined, false);
});

test('both tangents touch the circle, pass through the source point and recover at the same IDs', () => {
  for (const scale of [1, 1e-280, 1e5]) {
    const state = construction([
      p('center', 0, 0), p('external', 5 * scale, 0),
      o('circle', 'circleRadius', ['center'], { radius: 3 * scale }),
      o('upper', 'tangent', ['circle', 'external'], { branch: 0 }),
      o('lower', 'tangent', ['circle', 'external'], { branch: 1 })
    ]);
    let result = M.evaluate(state);
    for (const [id, sign] of [['upper', 1], ['lower', -1]]) {
      const tangent = result[id];
      assert.equal(tangent.defined, true);
      const [x, y] = tangent.a.map(value => value / scale), [dx, dy] = tangent.d;
      close(x, 9 / 5); close(y, sign * 12 / 5);
      close(Math.hypot(x, y), 3);
      close(x * dx + y * dy, 0);
      close((5 - x) * dy + y * dx, 0);
    }
    state.objects[1].x = 3 * scale;
    result = M.evaluate(state);
    assert.equal(result.upper.defined, true);
    close(result.upper.d[0], 0); close(result.upper.d[1], 1);
    assert.equal(result.lower.defined, false);
    state.objects[1].x = scale;
    result = M.evaluate(state);
    assert.equal(result.upper.defined, false);
    assert.equal(result.lower.defined, false);
    state.objects[1].x = 5 * scale;
    result = M.evaluate(state);
    assert.ok(result.upper.defined && result.lower.defined);
  }
});

test('tangency distinguishes a near-rim independent point from a point constrained to the circle', () => {
  const state = construction([
    p('center', 0, 0), p('p', 1 - Number.EPSILON, 0),
    o('circle', 'circleRadius', ['center'], { radius: 1 }),
    o('on', 'pointOn', ['circle'], { parameter: .1 }),
    o('near', 'tangent', ['circle', 'p'], { branch: 0 }),
    o('near2', 'tangent', ['circle', 'p'], { branch: 1 }),
    o('boundary', 'tangent', ['circle', 'on'], { branch: 0 }),
    o('boundary2', 'tangent', ['circle', 'on'], { branch: 1 })
  ]);
  let result = M.evaluate(state);
  assert.equal(result.near.defined, false);
  assert.equal(result.near2.defined, false);
  assert.equal(result.boundary.defined, true);
  assert.equal(result.boundary2.defined, false);
  state.objects[1].x = 1 + Number.EPSILON;
  result = M.evaluate(state);
  assert.equal(result.near.defined, true);
  assert.equal(result.near2.defined, true);
});

test('new construction schemas reject wrong parents, nonnumeric data and oversized tables', () => {
  const base = [
    p('a', 0, 0), p('b', 1, 0), o('segment', 'segment', ['a', 'b']), o('ray', 'ray', ['a', 'b']),
    o('circle', 'circleRadius', ['a'], { radius: 2 }), o('f', 'functionGraph', [], { expression: 'x' })
  ];
  const invalid = [
    o('bad', 'pointOn', ['a'], { parameter: .5 }), o('bad', 'pointOn', ['segment'], { parameter: 1.01 }),
    o('bad', 'pointOn', ['ray'], { parameter: -.01 }), o('bad', 'pointOn', ['circle'], { parameter: '0.5' }),
    o('bad', 'pointOn', ['f'], { parameter: M.MAX_COORD + 1 }),
    o('bad', 'circleRadius', ['a'], { radius: 0 }), o('bad', 'circleRadius', ['a'], { radius: M.MAX_COORD + 1 }),
    o('bad', 'vector', ['a', 'segment']), o('bad', 'translate', ['a', 'segment']),
    o('bad', 'tangent', ['circle', 'a'], { branch: 2 }), o('bad', 'tangent', ['a', 'circle'], { branch: 0 }),
    o('bad', 'functionTable', ['segment'], { start: 0, end: 1, step: .1 }),
    o('bad', 'functionTable', ['f'], { start: 0, end: 101, step: 1 }),
    o('bad', 'functionTable', ['f'], { start: 0, end: 1, step: 0 }),
    o('bad', 'functionTable', ['f'], { start: 1, end: 1.0000000000000002, step: 1e-16 }),
    o('bad', 'functionTable', ['f'], { start: 0, end: 1, step: .1, rows: [] })
  ];
  for (const item of invalid) assert.throws(() => M.normalize(construction([...base, item])), item.type);
  const tables = Array.from({ length: M.MAX_TABLES }, (_, i) => o('table' + i, 'functionTable', ['f'], { start: 0, end: 100, step: 1 }));
  assert.equal(M.evaluate(construction([...base, ...tables])).table0.rows.length, M.MAX_TABLE_ROWS);
  assert.throws(() => M.normalize(construction([...base, ...tables, o('extra', 'functionTable', ['f'], { start: 0, end: 1, step: 1 })])));
});

test('v1 is a strict, cloned, bounded JSON contract', () => {
  const state = construction([p('a', 0, 0), p('b', 4, 0), o('middle', 'midpoint', ['a', 'b'])]);
  const normalized = M.normalize(state);
  assert.equal(M.version, 1); assert.deepEqual(normalized, state); assert.notEqual(normalized, state); assert.notEqual(normalized.objects, state.objects);
  assert.ok(Buffer.byteLength(JSON.stringify(normalized)) < 65536);
  const deep = value => typeof value === 'object' && value !== null ? 1 + Math.max(0, ...Object.values(value).map(deep)) : 1;
  assert.ok(deep(normalized) <= 8);
});

test('median, altitude, intersection and right-angle measurement retain dependencies after movement', () => {
  const state = construction([p('a', -4, -2), p('b', 4, -2), p('c', 1, 4), o('ab', 'line', ['a', 'b']), o('m', 'midpoint', ['a', 'b']), o('median', 'segment', ['c', 'm']), o('alt', 'perpendicular', ['ab', 'c']), o('h', 'intersection', ['ab', 'alt'], { branch: 0 }), o('length', 'distance', ['c', 'h']), o('angle', 'angle', ['c', 'h', 'b'])]);
  let result = M.evaluate(state);
  assert.equal(result.m.x, 0); assert.equal(result.m.y, -2); close(result.h.x, 1); close(result.h.y, -2); close(result.length.value, 6); close(result.angle.value, 90);
  state.objects[1].y = 1; result = M.evaluate(state);
  close(result.m.y, -.5);
  const base = result.ab.d, altitude = result.alt.d; close(base[0] * altitude[0] + base[1] * altitude[1], 0); close(result.angle.value, 90);
});

test('line-circle intersections have two stable algebraic branches; tangency and missing roots are explicit', () => {
  const state = construction([p('a', -3, 0), p('b', 3, 0), p('center', 0, 0), p('rim', 0, 2), o('line', 'line', ['a', 'b']), o('circle', 'circle', ['center', 'rim']), o('i0', 'intersection', ['line', 'circle'], { branch: 0 }), o('i1', 'intersection', ['line', 'circle'], { branch: 1 })]);
  let result = M.evaluate(state); close(result.i0.x, -2); close(result.i1.x, 2);
  state.objects[0].y = state.objects[1].y = 2; result = M.evaluate(state); close(result.i0.x, 0); close(result.i0.y, 2); assert.equal(result.i1.defined, false);
  state.objects[0].y = state.objects[1].y = 3; result = M.evaluate(state); assert.equal(result.i0.defined, false); assert.equal(result.i1.defined, false);
  state.objects[0].y = state.objects[1].y = 0; result = M.evaluate(state); assert.equal(result.i0.defined, true); assert.equal(result.i1.defined, true);
});

test('large line offsets do not turn a missed small circle into a false tangent', () => {
  const state = construction([p('a', -1000000, 2), p('b', 1000000, 2), p('center', 0, 0), p('rim', 1, 0), o('line', 'line', ['a', 'b']), o('circle', 'circle', ['center', 'rim']), o('i', 'intersection', ['line', 'circle'], { branch: 0 })]);
  assert.equal(M.evaluate(state).i.defined, false);
  state.objects[0].y = state.objects[1].y = 0;
  close(M.evaluate(state).i.x, -1);
});

test('small-scale valid constructions survive and misses are never invented by a fixed tolerance floor', () => {
  for (const scale of [1, 1e-6, 1e-12]) {
    const state = construction([p('a', -3 * scale, 5 * scale), p('b', 3 * scale, 5 * scale), p('center', 0, 0), p('rim', scale, 0), p('other', 3 * scale, 0), p('other_rim', 4 * scale, 0), o('line', 'line', ['a', 'b']), o('circle', 'circle', ['center', 'rim']), o('other_circle', 'circle', ['other', 'other_rim']), o('i', 'intersection', ['line', 'circle'], { branch: 0 }), o('ci', 'intersection', ['circle', 'other_circle'], { branch: 0 }), o('triangle', 'polygon', ['a', 'b', 'center'])]);
    let result = M.evaluate(state); assert.equal(result.circle.defined, true); assert.equal(result.line.defined, true); assert.equal(result.triangle.defined, true); assert.equal(result.i.defined, false); assert.equal(result.ci.defined, false);
    state.objects[0].y = state.objects[1].y = 0; result = M.evaluate(state); assert.equal(result.i.defined, true); close(result.i.x / scale, -1);
    state.objects[4].x = scale; state.objects[5].x = 2 * scale; result = M.evaluate(state); assert.equal(result.ci.defined, true); close(result.ci.x / scale, .5); close(result.ci.y / scale, Math.sqrt(3) / 2);
  }
});

test('circle-circle intersections, tangency, separation, concentric and coincident cases', () => {
  const state = construction([p('a', 0, 0), p('ar', 2, 0), p('b', 2, 0), p('br', 4, 0), o('ca', 'circle', ['a', 'ar']), o('cb', 'circle', ['b', 'br']), o('i0', 'intersection', ['ca', 'cb'], { branch: 0 }), o('i1', 'intersection', ['ca', 'cb'], { branch: 1 })]);
  let r = M.evaluate(state); close(r.i0.x, 1); close(r.i0.y, Math.sqrt(3)); close(r.i1.y, -Math.sqrt(3));
  state.objects[2].x = 4; state.objects[3].x = 6; r = M.evaluate(state); close(r.i0.x, 2); assert.equal(r.i1.defined, false);
  state.objects[2].x = 5; state.objects[3].x = 7; assert.equal(M.evaluate(state).i0.defined, false);
  state.objects[2].x = 0; state.objects[3].x = 2; assert.equal(M.evaluate(state).i0.defined, false);
  state.objects[3].x = 1; assert.equal(M.evaluate(state).i0.defined, false);
});

test('intersection respects segment and ray domains without renumbering roots', () => {
  const state = construction([p('a', 0, 0), p('b', 1, 0), p('c', 2, -1), p('d', 2, 1), p('center', 0, 0), p('rim', 2, 0), o('segment', 'segment', ['a', 'b']), o('ray', 'ray', ['a', 'b']), o('vertical', 'line', ['c', 'd']), o('circle', 'circle', ['center', 'rim']), o('miss', 'intersection', ['segment', 'vertical'], { branch: 0 }), o('hit', 'intersection', ['ray', 'vertical'], { branch: 0 }), o('negative', 'intersection', ['ray', 'circle'], { branch: 0 }), o('positive', 'intersection', ['ray', 'circle'], { branch: 1 })]);
  const result = M.evaluate(state); assert.equal(result.miss.defined, false); close(result.hit.x, 2); assert.equal(result.negative.defined, false); close(result.positive.x, 2);
});

test('parallel and perpendicular lines, 0/90/180-degree angles, and internal bisector', () => {
  const state = construction([p('origin', 0, 0), p('x', 3, 0), p('y', 0, 4), p('negative', -2, 0), o('line', 'line', ['origin', 'x']), o('parallel', 'parallel', ['line', 'y']), o('perp', 'perpendicular', ['line', 'y']), o('right', 'angle', ['x', 'origin', 'y']), o('straight', 'angle', ['x', 'origin', 'negative']), o('zero', 'angle', ['x', 'origin', 'x']), o('bisector', 'bisector', ['x', 'origin', 'y']), o('ambiguous', 'bisector', ['x', 'origin', 'negative'])]);
  const r = M.evaluate(state); assert.deepEqual(r.parallel.d, [3, 0]); assert.deepEqual(r.perp.d, [-0, 3]); close(r.right.value, 90); close(r.straight.value, 180); close(r.zero.value, 0); close(r.bisector.d[0], r.bisector.d[1]); assert.equal(r.ambiguous.defined, false);
});

test('degenerate objects propagate undefined and recover, while zero distance remains meaningful', () => {
  const state = construction([p('a', 0, 0), p('b', 0, 0), p('c', 1, 2), o('line', 'line', ['a', 'b']), o('circle', 'circle', ['a', 'b']), o('parallel', 'parallel', ['line', 'c']), o('length', 'distance', ['a', 'b']), o('angle', 'angle', ['a', 'b', 'c']), o('polygon', 'polygon', ['a', 'b', 'c'])]);
  let result = M.evaluate(state); for (const id of ['line', 'circle', 'parallel', 'angle', 'polygon']) assert.equal(result[id].defined, false, id); assert.equal(result.length.value, 0);
  state.objects[1].x = 2; result = M.evaluate(state); for (const id of ['line', 'circle', 'parallel', 'angle', 'polygon']) assert.equal(result[id].defined, true, id);
});

test('cascading deletion includes transitive children, leaving independent work', () => {
  const state = construction([p('a', 0, 0), p('b', 2, 2), p('c', 4, 4), o('m', 'midpoint', ['a', 'b']), o('segment', 'segment', ['m', 'c']), o('distance', 'distance', ['m', 'b'])]);
  assert.deepEqual(M.descendants(state, 'a'), ['a', 'm', 'segment', 'distance']);
  const removed = M.descendants(state, 'a'); state.objects = state.objects.filter(item => !removed.includes(item.id)); assert.doesNotThrow(() => M.normalize(state));
});

test('rejects hostile or malformed imports before invoking property accessors', () => {
  const attacks = [];
  const invalid = (change) => { const state = construction([p('a', 0, 0)]); change(state); attacks.push(state); };
  invalid(s => { s.version = 2; }); invalid(s => { s.html = '<script>'; }); invalid(s => { s.title = '<img onerror=alert(1)>'; }); invalid(s => { s.objects[0].label = '<svg>'; });
  invalid(s => { s.objects[0].x = NaN; }); invalid(s => { s.objects[0].x = Infinity; }); invalid(s => { s.objects[0].x = 1000001; }); invalid(s => { s.objects[0].id = 'constructor'; });
  invalid(s => { s.objects.push(p('a', 2, 2)); }); invalid(s => { s.objects[0].type = 'function'; }); invalid(s => { s.objects[0].expression = 'fetch()'; });
  invalid(s => { s.objects.push(o('bad', 'midpoint', ['a', 'missing'])); }); invalid(s => { s.objects.push(o('bad', 'midpoint', ['a', 'bad'])); });
  invalid(s => { s.objects = Array.from({ length: 161 }, (_, i) => p('p' + i, 0, 0)); }); invalid(s => { s.objects = new Array(1); });
  invalid(s => { s.objects[0].label = 'a'.repeat(31); }); invalid(s => { s.title = 'a'.repeat(121); }); invalid(s => { s.view.grid = 1; });
  attacks.push(JSON.parse('{"version":1,"title":"","objects":[],"view":{"axes":true,"grid":true},"__proto__":{"polluted":true}}'));
  let executed = false; const getter = M.empty(); Object.defineProperty(getter, 'title', { enumerable: true, get() { executed = true; return ''; } }); attacks.push(getter);
  const cycle = M.empty(); cycle.objects.push(cycle); attacks.push(cycle);
  for (const attack of attacks) assert.throws(() => M.normalize(attack));
  assert.equal(executed, false); assert.equal({}.polluted, undefined);
});

test('parent kinds and branch selection are strict', () => {
  const base = [p('a', 0, 0), p('b', 1, 0), o('line', 'line', ['a', 'b'])];
  for (const item of [o('bad', 'circle', ['line', 'a']), o('bad', 'perpendicular', ['a', 'line']), o('bad', 'intersection', ['line', 'line'], { branch: 0 }), o('bad', 'intersection', ['a', 'line'], { branch: 0 }), o('bad', 'intersection', ['line', 'line'], { branch: 2 })]) assert.throws(() => M.normalize(construction([...base, item])));
});

test('legacy views gain a bounded, cloned canonical viewport', () => {
  const legacy = { version: 1, title: 'Старая модель', objects: [], view: { axes: true, grid: false } };
  const restored = M.normalize(legacy);
  assert.deepEqual(restored.view, { axes: true, grid: false, viewport: { x: 0, y: 0, span: 12 } });
  assert.deepEqual(legacy.view, { axes: true, grid: false });
  assert.deepEqual(M.empty().view.viewport, { x: 0, y: 0, span: 12 });
  const state = { ...legacy, view: { axes: false, grid: true, viewport: { x: -4000000, y: 4000000, span: 8000000 } } };
  const normalized = M.normalize(state);
  assert.deepEqual(normalized.view, state.view);
  assert.notEqual(normalized.view.viewport, state.view.viewport);
  state.view.viewport.span = 1e-9;
  assert.equal(M.normalize(state).view.viewport.span, 1e-9);
  for (const viewport of [
    null, [], { x: 0, y: 0 }, { x: 0, y: 0, span: 12, zoom: 1 },
    { x: '0', y: 0, span: 12 }, { x: 4000001, y: 0, span: 12 },
    { x: 0, y: -4000001, span: 12 }, { x: Infinity, y: 0, span: 12 },
    { x: 0, y: 0, span: 0 }, { x: 0, y: 0, span: 1e-10 },
    { x: 0, y: 0, span: 8000001 }, { x: 0, y: 0, span: NaN }
  ]) assert.throws(() => M.normalize({ ...legacy, view: { ...legacy.view, viewport } }));
  let executed = false;
  const viewport = { x: 0, y: 0 };
  Object.defineProperty(viewport, 'span', { enumerable: true, get() { executed = true; return 12; } });
  assert.throws(() => M.normalize({ ...legacy, view: { ...legacy.view, viewport } }));
  assert.equal(executed, false);
});

test('perpendicular bisector, projection and reflections follow their source geometry', () => {
  const state = construction([
    p('a', 0, 0), p('b', 4, 0), p('q', 6, 3), p('center', 1, 1),
    o('ab', 'segment', ['a', 'b']), o('bisector', 'perpendicularBisector', ['a', 'b']),
    o('foot', 'projection', ['ab', 'q']), o('mirror_line', 'reflectLine', ['ab', 'q']),
    o('mirror_center', 'reflectPoint', ['q', 'center']), o('child', 'segment', ['foot', 'mirror_line'])
  ]);
  let r = M.evaluate(state);
  close(r.bisector.a[0], 2); close(r.bisector.a[1], 0);
  close(r.bisector.d[0], 0); assert.ok(r.bisector.d[1] !== 0);
  // The projection is on the supporting line, even beyond a segment endpoint.
  close(r.foot.x, 6); close(r.foot.y, 0);
  close(r.mirror_line.x, 6); close(r.mirror_line.y, -3);
  close(r.mirror_center.x, -4); close(r.mirror_center.y, -1);
  assert.equal(r.child.defined, true);
  state.objects[1].x = 0; state.objects[1].y = 4;
  r = M.evaluate(state);
  close(r.foot.x, 0); close(r.foot.y, 3);
  close(r.mirror_line.x, -6); close(r.mirror_line.y, 3);
  close(r.bisector.a[0], 0); close(r.bisector.a[1], 2); close(r.bisector.d[1], 0);
  state.objects[1].y = 0;
  r = M.evaluate(state);
  for (const id of ['ab', 'bisector', 'foot', 'mirror_line', 'child']) assert.equal(r[id].defined, false, id);
  assert.equal(r.mirror_center.defined, true);
  state.objects[1].y = 4;
  r = M.evaluate(state);
  for (const id of ['ab', 'bisector', 'foot', 'mirror_line', 'child']) assert.equal(r[id].defined, true, id);
  assert.deepEqual(M.descendants(state, 'b'), ['b', 'ab', 'bisector', 'foot', 'mirror_line', 'child']);
});

test('rotated and dilated points stay dependent, including negative and zero scale', () => {
  const state = construction([
    p('p', 6, 3), p('center', 1, 1),
    o('rotated', 'rotate', ['p', 'center'], { angle: 90 }),
    o('dilated', 'dilate', ['p', 'center'], { factor: -2 }),
    o('collapsed', 'dilate', ['p', 'center'], { factor: 0 }),
    o('segment', 'segment', ['rotated', 'dilated'])
  ]);
  let r = M.evaluate(state);
  close(r.rotated.x, -1); close(r.rotated.y, 6);
  close(r.dilated.x, -9); close(r.dilated.y, -3);
  close(r.collapsed.x, 1); close(r.collapsed.y, 1);
  assert.equal(r.segment.defined, true);
  state.objects[0].x = 1; state.objects[0].y = 1;
  r = M.evaluate(state);
  for (const id of ['rotated', 'dilated', 'collapsed']) {
    assert.equal(r[id].defined, true); close(r[id].x, 1); close(r[id].y, 1);
  }
  assert.equal(r.segment.defined, false);
  state.objects[0].x = 6; state.objects[0].y = 3;
  state.objects[2].angle = -90; state.objects[3].factor = 2;
  r = M.evaluate(state);
  close(r.rotated.x, 3); close(r.rotated.y, -4);
  close(r.dilated.x, 11); close(r.dilated.y, 5);
  assert.equal(r.segment.defined, true);
});

test('three-point circles and measurements recover after collinearity', () => {
  const state = construction([
    p('a', 0, 0), p('b', 4, 0), p('c', 0, 3),
    o('triangle', 'polygon', ['a', 'b', 'c']), o('circle', 'circle3', ['a', 'b', 'c']),
    o('area', 'area', ['triangle']), o('perimeter', 'perimeter', ['triangle']),
    o('disk_area', 'area', ['circle']), o('circumference', 'circumference', ['circle']),
    o('line', 'line', ['a', 'b']), o('intersection', 'intersection', ['line', 'circle'], { branch: 0 })
  ]);
  let r = M.evaluate(state);
  assert.equal(r.circle.kind, 'circle'); close(r.circle.c[0], 2); close(r.circle.c[1], 1.5); close(r.circle.r, 2.5);
  close(r.area.value, 6); close(r.perimeter.value, 12);
  close(r.disk_area.value, 6.25 * Math.PI); close(r.circumference.value, 5 * Math.PI);
  assert.equal(r.intersection.defined, true);
  state.objects[2].x = 2; state.objects[2].y = 0;
  r = M.evaluate(state);
  for (const id of ['triangle', 'circle', 'area', 'disk_area', 'circumference', 'intersection']) assert.equal(r[id].defined, false, id);
  state.objects[2].x = 0; state.objects[2].y = 3;
  r = M.evaluate(state);
  for (const id of ['triangle', 'circle', 'area', 'perimeter', 'disk_area', 'circumference', 'intersection']) assert.equal(r[id].defined, true, id);
  close(r.area.value, 6);
});

test('three-point circles preserve small valid geometry and reject coincident points', () => {
  for (const scale of [1, 1e-6, 1e-12]) {
    const state = construction([p('a', 0, 0), p('b', 4 * scale, 0), p('c', 0, 3 * scale), o('circle', 'circle3', ['a', 'b', 'c'])]);
    const r = M.evaluate(state).circle;
    assert.equal(r.defined, true); close(r.c[0] / scale, 2); close(r.c[1] / scale, 1.5); close(r.r / scale, 2.5);
    state.objects[2].y = 0;
    assert.equal(M.evaluate(state).circle.defined, false);
  }
});

test('polygon area is orientation-independent and undefined for crossed boundaries', () => {
  const state = construction([
    p('a', 0, 0), p('b', 4, 0), p('c', 4, 3), p('d', 0, 3),
    o('forward', 'polygon', ['a', 'b', 'c', 'd']), o('reverse', 'polygon', ['d', 'c', 'b', 'a']),
    o('area', 'area', ['forward']), o('reverse_area', 'area', ['reverse']), o('perimeter', 'perimeter', ['forward'])
  ]);
  let r = M.evaluate(state);
  close(r.area.value, 12); close(r.reverse_area.value, 12); close(r.perimeter.value, 14);
  // This crossing has nonzero signed shoelace area, so a zero-area check alone is insufficient.
  state.objects[1].x = 4; state.objects[1].y = 4;
  state.objects[2].x = 0; state.objects[2].y = 4;
  state.objects[3].x = 3; state.objects[3].y = 0;
  r = M.evaluate(state);
  assert.equal(r.area.defined, false); assert.equal(r.reverse_area.defined, false);
  state.objects[1].x = 4; state.objects[1].y = 0;
  state.objects[2].x = 4; state.objects[2].y = 3;
  state.objects[3].x = 0; state.objects[3].y = 3;
  close(M.evaluate(state).area.value, 12);
});

test('new constructions reject wrong parents, extra fields and unbounded parameters', () => {
  const base = [p('a', 0, 0), p('b', 4, 0), p('c', 0, 3), o('line', 'line', ['a', 'b']), o('circle', 'circle', ['a', 'b']), o('polygon', 'polygon', ['a', 'b', 'c'])];
  const invalid = [
    o('bad', 'perpendicularBisector', ['line', 'a']), o('bad', 'projection', ['a', 'line']),
    o('bad', 'reflectPoint', ['a', 'line']), o('bad', 'reflectLine', ['circle', 'a']),
    o('bad', 'circle3', ['a', 'b']), o('bad', 'circle3', ['a', 'b', 'line']),
    o('bad', 'area', ['line']), o('bad', 'area', ['polygon', 'a']),
    o('bad', 'perimeter', ['circle']), o('bad', 'circumference', ['polygon']),
    o('bad', 'rotate', ['a', 'b']), o('bad', 'dilate', ['a', 'b']),
    o('bad', 'rotate', ['a', 'line'], { angle: 90 }), o('bad', 'dilate', ['a', 'line'], { factor: 2 }),
    o('bad', 'rotate', ['a', 'b'], { angle: 90, factor: 1 }), o('bad', 'reflectPoint', ['a', 'b'], { angle: 90 })
  ];
  for (const angle of [-36001, 36001, '90', NaN, Infinity]) invalid.push(o('bad', 'rotate', ['a', 'b'], { angle }));
  for (const factor of [-1001, 1001, '2', NaN, Infinity]) invalid.push(o('bad', 'dilate', ['a', 'b'], { factor }));
  for (const item of invalid) assert.throws(() => M.normalize(construction([...base, item])), item.type);
  for (const angle of [-36000, 0, 36000]) assert.doesNotThrow(() => M.normalize(construction([...base, o('valid', 'rotate', ['a', 'b'], { angle })])));
  for (const factor of [-1000, 0, 1000]) assert.doesNotThrow(() => M.normalize(construction([...base, o('valid', 'dilate', ['a', 'b'], { factor })])));
});

const slider = (id, name, extra = {}) => o(id, 'slider', [], { name, min: -5, max: 5, step: .1, value: 1, ...extra });
const graph = (id, expression, parents = []) => o(id, 'functionGraph', parents, { expression });

test('function graphs and sliders round-trip as declarative state and retain parameter dependencies', () => {
  const state = construction([
    slider('parameter_a', 'a', { value: 2 }), slider('parameter_b', 'b', { value: -3 }),
    graph('parabola', '  a*x^2+b  ', ['parameter_b', 'parameter_a']),
    graph('unparameterized', 'sin(x)+pi'), graph('repeated_parameter', 'a*x+a', ['parameter_a'])
  ]);
  // Existing files need no migration before adding functions.
  state.view = { axes: false, grid: true };
  const normalized = M.normalize(state);
  assert.equal(normalized.objects[2].expression, 'a*x^2+b');
  assert.deepEqual(normalized.objects[2].parents, ['parameter_b', 'parameter_a']);
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(normalized))), normalized);
  assert.deepEqual(normalized.view.viewport, { x: 0, y: 0, span: 12 });
  let result = M.evaluate(state);
  assert.equal(result.parameter_a.kind, 'slider'); assert.equal(result.parameter_a.value, 2);
  assert.equal(result.parabola.kind, 'functionGraph'); assert.equal(result.parabola.defined, true);
  assert.equal(result.parabola.expression, 'a*x^2+b');
  assert.deepEqual(result.parabola.parameters, { a: 2, b: -3 });
  assert.deepEqual(result.unparameterized.parameters, {});
  assert.deepEqual(result.repeated_parameter.parameters, { a: 2 });
  state.objects[0].value = -1.5;
  result = M.evaluate(state);
  assert.equal(result.parameter_a.value, -1.5);
  assert.deepEqual(result.parabola.parameters, { a: -1.5, b: -3 });
  assert.deepEqual(result.repeated_parameter.parameters, { a: -1.5 });
  assert.deepEqual(M.descendants(state, 'parameter_a'), ['parameter_a', 'parabola', 'repeated_parameter']);
  const removed = new Set(M.descendants(state, 'parameter_a'));
  const surviving = { ...state, objects: state.objects.filter(item => !removed.has(item.id)) };
  assert.doesNotThrow(() => M.normalize(surviving));
  assert.deepEqual(surviving.objects.map(item => item.id), ['parameter_b', 'unparameterized']);
});

test('graph parameters must match unique preceding slider parents exactly', () => {
  const base = [slider('parameter_a', 'a'), slider('parameter_b', 'b'), p('point', 0, 0), graph('independent', 'x')];
  for (const item of [
    graph('bad', 'a*x', []), graph('bad', 'a*x+b', ['parameter_a']),
    graph('bad', 'a*x', ['parameter_a', 'parameter_b']), graph('bad', 'x', ['parameter_a']),
    graph('bad', 'a*x', ['parameter_a', 'parameter_a']), graph('bad', 'a*x+b', ['parameter_a', 'parameter_a']),
    graph('bad', 'a*x', ['parameter_b']), graph('bad', 'a*x', ['point']),
    graph('bad', 'x', ['independent']), graph('bad', 'c*x', ['parameter_c']),
    { ...graph('bad', 'x'), parameters: { a: 1 } }
  ]) assert.throws(() => M.normalize(construction([...base, item])), item.expression);
  assert.throws(() => M.normalize(construction([graph('premature', 'a*x', ['later']), slider('later', 'a')])));
  assert.throws(() => M.normalize(construction([...base, slider('duplicate_name', 'a')])));
  assert.doesNotThrow(() => M.normalize(construction([
    slider('parameter_a', 'a'), slider('parameter_b', 'b'), slider('parameter_c', 'c'),
    graph('all_parameters', 'a*x^2+b*x+c', ['parameter_c', 'parameter_a', 'parameter_b'])
  ])));
});

test('slider names, ranges, steps, values and exact fields are bounded', () => {
  const invalid = [
    { name: 'x' }, { name: 'd' }, { name: 'A' }, { name: '__proto__' },
    { min: -1000001 }, { max: 1000001 }, { min: 5 }, { min: 6 },
    { min: '-5' }, { max: Infinity }, { step: '0.1' }, { step: NaN },
    { step: 0 }, { step: -1 }, { step: 1e-7 }, { step: 10.1 },
    { value: -5.1 }, { value: 5.1 }, { value: Infinity }, { value: '1' },
    { parents: ['point'] }, { expression: 'x' }
  ];
  for (const extra of invalid) assert.throws(() => M.normalize(construction([p('point', 0, 0), slider('bad', 'a', extra)])));
  for (const field of ['name', 'min', 'max', 'step', 'value', 'parents']) {
    const item = slider('bad', 'a'); delete item[field];
    assert.throws(() => M.normalize(construction([item])), field);
  }
  for (const extra of [
    { min: -1000000, max: 1000000, step: 2000000, value: -1000000 },
    { min: -1000000, max: 1000000, step: 1e-6, value: 1000000 },
    { min: 0, max: 1e-6, step: 1e-6, value: 0 }
  ]) assert.doesNotThrow(() => M.normalize(construction([slider('valid', 'c', extra)])));
});

test('graph imports reject executable or malformed expressions as data', () => {
  for (const expression of [
    '', '  ', 'x+', 'sin(', 'unknown(x)', 'y+x', 'globalThis.alert(1)',
    'fetch("https://example.invalid")', 'x.constructor', 'x;alert(1)',
    '(()=>1)()', 'x=1', 'Math.sin(x)', '<script>', '1'.repeat(513),
    null, 123, { source: 'x' }
  ]) assert.throws(() => M.normalize(construction([graph('bad', expression)])));
  let executed = false;
  const item = graph('bad', 'x');
  Object.defineProperty(item, 'expression', { enumerable: true, get() { executed = true; return 'x'; } });
  assert.throws(() => M.normalize(construction([item])));
  assert.equal(executed, false);
  assert.doesNotThrow(() => M.normalize(construction([graph('piecewise', 'If(x<0,-x,sqrt(x))')])));
});


test('graph count stays within a bounded rendering budget', () => {
  const model = M.empty();
  model.objects = Array.from({ length: M.MAX_GRAPHS }, (_, i) => ({ id: 'graph' + i, type: 'functionGraph', label: 'f' + i, parents: [], expression: 'sin(x)' }));
  assert.equal(M.normalize(model).objects.length, M.MAX_GRAPHS);
  model.objects.push({ id: 'extra', type: 'functionGraph', label: 'extra', parents: [], expression: 'x' });
  assert.throws(() => M.normalize(model), /12 графиков/);
});


test('unequal edge scales preserve real circles and simple polygon area', () => {
  const model = M.empty();
  model.objects = [
    { id: 'a', type: 'point', label: 'A', x: 0, y: 0 },
    { id: 'b', type: 'point', label: 'B', x: 1e-15, y: 0 },
    { id: 'c', type: 'point', label: 'C', x: 0, y: 1 },
    { id: 'd', type: 'point', label: 'D', x: 1, y: 1 },
    { id: 'circle', type: 'circle3', label: '', parents: ['a', 'b', 'c'] },
    { id: 'polygon', type: 'polygon', label: '', parents: ['a', 'b', 'd', 'c'] },
    { id: 'area', type: 'area', label: '', parents: ['polygon'] }
  ];
  const values = M.evaluate(model);
  assert.equal(values.circle.defined, true);
  assert.ok(Math.abs(values.circle.c[0] - 5e-16) < 1e-30);
  assert.equal(values.circle.c[1], .5);
  assert.equal(values.circle.r, .5);
  assert.equal(values.area.defined, true);
  assert.ok(Math.abs(values.area.value - .5000000000000005) < 2e-16);
});

test('undefined area preserves its specific explanation', () => {
  const model = M.empty();
  model.objects = [[0, 0], [4, 3], [0, 3], [3, 0]].map(([x, y], i) => ({ id: 'p' + i, type: 'point', label: '', x, y }));
  model.objects.push({ id: 'polygon', type: 'polygon', label: '', parents: ['p0', 'p1', 'p2', 'p3'] });
  model.objects.push({ id: 'area', type: 'area', label: '', parents: ['polygon'] });
  assert.match(M.evaluate(model).area.reason, /самопересекающегося/);
});


test('identity and quarter-turn transformations preserve exact coincidences', () => {
  const model = M.empty();
  model.objects = [p('o', 0, 0), p('a', 1, 0), p('far', 1e6, 0), p('tiny', 1e-12, 0), p('d', 2, 2), p('on', 1, 1), o('line', 'line', ['o', 'd'])];
  for (const angle of [0, 90, 180, 270, 360, -90]) model.objects.push(o('rot' + String(angle).replace('-', 'n'), 'rotate', ['a', 'o'], { angle }));
  model.objects.push(o('identity', 'rotate', ['tiny', 'far'], { angle: 0 }), o('scale', 'dilate', ['tiny', 'far'], { factor: 1 }));
  model.objects.push(o('foot', 'projection', ['line', 'on']), o('mirror', 'reflectLine', ['line', 'on']));
  model.objects.push(o('zero', 'circle', ['a', 'rot360']));
  const values = M.evaluate(model);
  for (const [id, x, y] of [['rot0', 1, 0], ['rot90', 0, 1], ['rot180', -1, 0], ['rot270', 0, -1], ['rot360', 1, 0], ['rotn90', 0, -1], ['identity', 1e-12, 0], ['scale', 1e-12, 0], ['foot', 1, 1], ['mirror', 1, 1]]) {
    assert.equal(values[id].x, x); assert.equal(values[id].y, y);
  }
  assert.equal(values.zero.defined, false);
});

test('slider values must agree with the step shown by the range control', () => {
  assert.throws(() => M.normalize(construction([slider('s', 'a', { min: 0, max: 1, step: .3, value: .99 })])), /шагу/);
  assert.doesNotThrow(() => M.normalize(construction([slider('s', 'a', { min: 0, max: 1, step: .1, value: .3 })])));
});


test('slider step alignment survives offset coordinates without accepting off-grid values', () => {
  assert.doesNotThrow(() => M.normalize(construction([slider('s', 'a', { min: 100000, max: 100001, step: .1, value: 100000.1 })])));
  assert.doesNotThrow(() => M.normalize(construction([slider('s', 'a', { min: 100000, max: 100000.000001, step: 1e-6, value: 100000 })])));
  assert.throws(() => M.normalize(construction([slider('s', 'a', { min: 100000, max: 100001, step: .1, value: 100000.11 })])));
});

test('tiny nonzero rotations are not rounded to an identity', () => {
  const result = M.evaluate(construction([p('a', 1, 0), p('o', 0, 0), o('r', 'rotate', ['a', 'o'], { angle: 1e-15 })]));
  assert.ok(result.r.y > 0);
  assert.ok(Math.abs(result.r.y - Math.PI / 180 * 1e-15) < 1e-31);
});


test('three-point circles use a stable anchor for all six selection orders', () => {
  const orders = [['a', 'b', 'c'], ['a', 'c', 'b'], ['b', 'a', 'c'], ['b', 'c', 'a'], ['c', 'a', 'b'], ['c', 'b', 'a']];
  for (const edge of [1e-15, 1e-150, 1e-320]) {
    let expected;
    for (const parents of orders) {
      const state = construction([p('a', 0, 0), p('b', edge, 0), p('c', 0, 1), o('circle', 'circle3', parents)]);
      const circle = M.evaluate(state).circle;
      assert.equal(circle.defined, true, edge + ': ' + parents.join(''));
      assert.equal(circle.c[0], edge / 2);
      assert.equal(circle.c[1], .5);
      assert.equal(circle.r, .5);
      if (expected) assert.deepEqual(circle, expected);
      else expected = circle;
      state.objects[2].y = 0;
      assert.equal(M.evaluate(state).circle.defined, false);
      state.objects[2].y = 1;
      assert.deepEqual(M.evaluate(state).circle, expected);
    }
  }
});
