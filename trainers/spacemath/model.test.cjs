'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
const p = (id, x, y) => ({ id, type: 'point', label: id.toUpperCase(), x, y });
const o = (id, type, parents, extra = {}) => ({ id, type, label: id, parents, ...extra });
const construction = objects => ({ ...M.empty(), objects });
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' ≈ ' + expected);

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
