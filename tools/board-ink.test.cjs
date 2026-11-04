'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ink = require('../trainers/board-ink.js');

const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9,
  (label || 'value') + ': ' + actual + ' != ' + expected);
const nearPoint = (actual, expected) => { near(actual.x, expected.x, 'x'); near(actual.y, expected.y, 'y'); };

test('the helper also loads as a browser global without CommonJS or DOM dependencies', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../trainers/board-ink.js'), 'utf8'), context);
  assert.equal(typeof context.BoardInk.drawStroke, 'function');
  assert.equal(typeof context.BoardInk.shapePoints, 'function');
  assert.deepEqual(JSON.parse(JSON.stringify(context.BoardInk.screenToWorld({ x: 20, y: 30 }, { scale: 2, x: 4, y: 6 }))), { x: 8, y: 12 });
});

test('ellipse points close the intended conic and reverse drags produce the same figure', () => {
  const start = Object.freeze({ x: -30, y: 20 }), end = Object.freeze({ x: 170, y: 120 });
  const points = ink.shapePoints('ellipse', start, end);
  assert.ok(points.length >= 33 && points.length <= 129, 'bounded, sufficiently smooth outline');
  assert.deepEqual(points[0], points.at(-1), 'closed ellipse');
  assert.deepEqual(ink.shapePoints('ellipse', end, start), points);
  for (const p of points) near(((p.x - 70) / 100) ** 2 + ((p.y - 70) / 50) ** 2, 1, 'ellipse equation');
  near(Math.min(...points.map(p => p.x)), -30);
  near(Math.max(...points.map(p => p.x)), 170);
  near(Math.min(...points.map(p => p.y)), 20);
  near(Math.max(...points.map(p => p.y)), 120);
});

test('triangle is a closed three-corner outline; zero-size and invalid shapes stay bounded', () => {
  const points = ink.shapePoints('triangle', { x: 120, y: 90 }, { x: 20, y: -10 });
  assert.equal(points.length, 4);
  assert.deepEqual(points[0], points[3]);
  assert.equal(new Set(points.map(p => p.x + ',' + p.y)).size, 3);
  const area = Math.abs(points[0].x * (points[1].y - points[2].y)
    + points[1].x * (points[2].y - points[0].y) + points[2].x * (points[0].y - points[1].y)) / 2;
  near(area, 5000);
  for (const tool of ['arrow', 'ellipse', 'triangle']) {
    assert.ok(ink.shapePoints(tool, { x: 4, y: 5 }, { x: 4, y: 5 }).every(p => p.x === 4 && p.y === 5));
    assert.deepEqual(ink.shapePoints(tool, { x: NaN, y: 0 }, { x: 5, y: 6 }), []);
  }
  assert.deepEqual(ink.shapePoints('unknown', { x: 1, y: 2 }, { x: 3, y: 4 }), []);
});

test('arrow points preserve the shaft endpoint and symmetric, bounded head wings', () => {
  const start = { x: 20, y: 30 }, end = { x: 120, y: 130 };
  const points = ink.shapePoints('arrow', start, end);
  assert.equal(points.length, 5);
  assert.deepEqual(points[0], start);
  assert.deepEqual(points[1], end);
  assert.deepEqual(points[3], end);
  const left = points[2], right = points[4];
  near(Math.hypot(left.x - end.x, left.y - end.y), Math.hypot(right.x - end.x, right.y - end.y));
  near((left.x + right.x) / 2 - end.x, (left.y + right.y) / 2 - end.y, 'head centred on shaft');
  assert.ok(left.x < end.x && left.y < end.y && right.x < end.x && right.y < end.y);
  const tiny = ink.shapePoints('arrow', { x: 0, y: 0 }, { x: 1, y: 0 });
  assert.ok(tiny.every(p => p.x >= 0 && p.x <= 1 && Math.abs(p.y) <= 0.5));
});

test('Shift constrains square/circle and snaps an arrow without mutating drag endpoints', () => {
  const start = Object.freeze({ x: 100, y: 80 }), end = Object.freeze({ x: 60, y: 100 });
  const square = ink.constrainEnd('rect', start, end, true);
  assert.deepEqual(square, { x: 60, y: 120 });
  const circle = ink.shapePoints('ellipse', start, end, { shift: true });
  for (const p of circle) near(Math.hypot(p.x - 80, p.y - 100), 20, 'circle radius');
  const snapped = ink.constrainEnd('arrow', { x: 0, y: 0 }, { x: 100, y: 13 }, true);
  near(snapped.y, 0);
  near(Math.hypot(snapped.x, snapped.y), Math.hypot(100, 13));
  assert.deepEqual(ink.constrainEnd('rect', start, end, false), end);
});

test('bounds include stroke thickness for paths, lines and reversed rectangles, excluding eraser extent', () => {
  const strokes = [
    { kind: 'path', tool: 'pen', size: 6, points: [{ x: -10, y: 20 }, { x: 30, y: 40 }] },
    { kind: 'line', tool: 'line', size: 2, start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
    { kind: 'rect', tool: 'rect', size: 4, start: { x: 100, y: 80 }, end: { x: 50, y: 60 } },
    { kind: 'path', tool: 'eraser', size: 34, points: [{ x: 9000, y: 9000 }] }
  ];
  const before = structuredClone(strokes);
  assert.deepEqual(ink.strokeBounds(strokes[0]), { minX: -13, minY: 17, maxX: 33, maxY: 43 });
  assert.deepEqual(ink.strokeBounds(strokes[2]), { minX: 48, minY: 58, maxX: 102, maxY: 82 });
  assert.deepEqual(ink.drawingBounds(strokes), { minX: -13, minY: -1, maxX: 102, maxY: 82 });
  assert.equal(ink.drawingBounds([strokes[3]]), null);
  assert.equal(ink.drawingBounds([]), null);
  assert.deepEqual(strokes, before);
});

test('text bounds cover all real and legacy newline lines, measured glyphs and fallback wide characters', () => {
  const ctx = new RecordingContext();
  const stroke = { kind: 'text', tool: 'text', size: 5, x: 10, y: 20, text: 'abc\nd' };
  const measured = ink.strokeBounds(stroke, ctx);
  assert.equal(measured.minX, 6, 'left glyph overhang plus padding');
  assert.equal(measured.maxX, 43, 'measured right glyph overhang plus padding');
  assert.ok(measured.maxY >= 20 + 27 * 2 * 1.25);
  assert.deepEqual(ink.strokeBounds({ ...stroke, text: 'abc\\nd' }, ctx), measured);
  const fallback = ink.strokeBounds({ ...stroke, text: '界😀' });
  assert.ok(fallback.maxX >= 10 + 27 * 2);
  assert.equal(ctx.font, '12px initial', 'measurement restores context');
});

test('screen/world transformations roundtrip independently of DPR and preserve the original viewport', () => {
  const view = Object.freeze({ scale: 1.75, x: -120, y: 80 });
  for (const p of [{ x: 0, y: 0 }, { x: 500, y: 300 }, { x: -33.5, y: 1000.25 }]) {
    nearPoint(ink.screenToWorld(ink.worldToScreen(p, view), view), p);
  }
  assert.deepEqual(ink.pan(view, 25, -30), { scale: 1.75, x: -95, y: 50 });
  assert.deepEqual(ink.screenToWorld({ x: 5, y: 8 }, null), { x: 5, y: 8 });
});

test('zoom keeps the world point under its screen anchor, including clamped limits', () => {
  const view = Object.freeze({ scale: 1, x: -80, y: 40 }), anchor = Object.freeze({ x: 240, y: 160 });
  const world = ink.screenToWorld(anchor, view);
  for (const factor of [0.01, 0.5, 1.25, 100]) {
    const next = ink.zoomAt(view, anchor, factor);
    assert.ok(next.scale >= ink.MIN_SCALE && next.scale <= ink.MAX_SCALE);
    nearPoint(ink.worldToScreen(world, next), anchor);
  }
  assert.equal(ink.zoomAt(view, anchor, 20, { minScale: 0.1, maxScale: 2 }).scale, 2);
  assert.deepEqual(ink.zoomAt(view, anchor, NaN), view);
});

test('fit centres all ink with padding and obeys explicit zoom limits without changing bounds', () => {
  const bounds = Object.freeze({ minX: -50, minY: -20, maxX: 350, maxY: 180 });
  const fit = ink.fitToBounds(bounds, { width: 840, height: 440 }, { padding: 20 });
  assert.equal(fit.scale, 2);
  nearPoint(ink.worldToScreen({ x: bounds.minX, y: bounds.minY }, fit), { x: 20, y: 20 });
  nearPoint(ink.worldToScreen({ x: bounds.maxX, y: bounds.maxY }, fit), { x: 820, y: 420 });
  const limited = ink.fitToBounds(bounds, { width: 840, height: 440 }, { padding: 20, maxScale: 1 });
  assert.equal(limited.scale, 1);
  nearPoint(ink.worldToScreen({ x: 150, y: 80 }, limited), { x: 420, y: 220 });
  assert.deepEqual(ink.fitToBounds(null, { width: 500, height: 300 }), { scale: 1, x: 0, y: 0 });
});

class RecordingContext {
  constructor() {
    this.canvas = { width: 1200, height: 800 };
    this.transform = [2, 0, 0, 2, 30, 40];
    this.globalAlpha = 0.7;
    this.globalCompositeOperation = 'source-in';
    this.font = '12px initial';
    this.calls = [];
    this.stack = [];
  }
  save() {
    const state = {};
    for (const key of ['transform', 'globalAlpha', 'globalCompositeOperation', 'font', 'lineCap', 'lineJoin',
      'lineWidth', 'strokeStyle', 'fillStyle', 'textBaseline', 'textAlign']) state[key] = this[key];
    this.stack.push(state);
  }
  restore() { Object.assign(this, this.stack.pop()); }
  setTransform(...args) { this.transform = args; }
  clearRect(...args) { this.record('clear', args); }
  beginPath() { this.path = []; }
  moveTo(...args) { this.path.push(['move', ...args]); }
  lineTo(...args) { this.path.push(['line', ...args]); }
  arc(...args) { this.path.push(['arc', ...args]); }
  stroke() { this.record('stroke', structuredClone(this.path)); }
  fill() { this.record('fill', structuredClone(this.path)); }
  strokeRect(...args) { this.record('rect', args); }
  fillText(...args) { this.record('text', args); }
  measureText(value) { return { width: value.length * 10, actualBoundingBoxLeft: 2, actualBoundingBoxRight: value.length * 10 + 1 }; }
  record(kind, data) {
    this.calls.push({ kind, data, transform: [...this.transform], alpha: this.globalAlpha,
      composite: this.globalCompositeOperation, width: this.lineWidth, font: this.font });
  }
}

test('drawing preserves caller transform/style and retains existing pen, marker, eraser and text semantics', () => {
  const ctx = new RecordingContext(), transform = [...ctx.transform];
  const strokes = [
    { kind: 'path', tool: 'pen', size: 5, points: [{ x: 20, y: 30 }] },
    { kind: 'path', tool: 'marker', size: 12, points: [{ x: 0, y: 0 }, { x: 100, y: 20 }] },
    { kind: 'path', tool: 'eraser', size: 20, points: [{ x: 10, y: 0 }, { x: 10, y: 50 }] },
    { kind: 'rect', tool: 'rect', size: 2, start: { x: 80, y: 60 }, end: { x: 20, y: 10 } },
    { kind: 'text', tool: 'text', size: 5, x: 10, y: 20, text: 'a\nb' }
  ];
  const before = structuredClone(strokes);
  for (const stroke of strokes) assert.equal(ink.drawStroke(ctx, stroke), true);
  assert.equal(ctx.calls[0].kind, 'fill', 'single-point pen remains a visible round dot');
  assert.equal(ctx.calls[0].data[0][3], 2.5);
  assert.equal(ctx.calls[1].alpha, 0.32);
  assert.equal(ctx.calls[2].composite, 'destination-out');
  assert.deepEqual(ctx.calls[3].data, [20, 10, 60, 50]);
  assert.deepEqual(ctx.calls.filter(c => c.kind === 'text').map(c => c.data), [['a', 10, 20], ['b', 10, 53.75]]);
  for (const call of ctx.calls) assert.deepEqual(call.transform, transform);
  assert.equal(ctx.globalAlpha, 0.7);
  assert.equal(ctx.globalCompositeOperation, 'source-in');
  assert.equal(ctx.font, '12px initial');
  assert.deepEqual(strokes, before);
});

test('the transparent layer is fully cleared in backing pixels before ink and preview, preserving its viewport', () => {
  const ctx = new RecordingContext(), transform = [...ctx.transform];
  const pen = { kind: 'path', tool: 'pen', points: [{ x: 10, y: 20 }] };
  const eraser = { kind: 'path', tool: 'eraser', points: [{ x: 10, y: 20 }] };
  assert.equal(ink.renderLayer(ctx, [pen], eraser), ctx.canvas);
  assert.deepEqual(ctx.calls[0].data, [0, 0, 1200, 800]);
  assert.deepEqual(ctx.calls[0].transform, [1, 0, 0, 1, 0, 0]);
  assert.equal(ctx.calls[1].composite, 'source-over');
  assert.equal(ctx.calls[2].composite, 'destination-out');
  assert.deepEqual(ctx.calls[1].transform, transform);
  assert.deepEqual(ctx.transform, transform);
  assert.equal(ctx.stack.length, 0);
});
