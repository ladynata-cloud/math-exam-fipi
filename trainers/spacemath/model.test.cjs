'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
const p = (id, x, y) => ({ id, type: 'point', label: id.toUpperCase(), x, y });
const o = (id, type, parents, extra = {}) => ({ id, type, label: id, parents, ...extra });
const construction = objects => ({ ...M.empty(), objects });
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' ≈ ' + expected);

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
