'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./plot.js');
const model = (base = 2, h = 0, k = 0, sign = 1) => ({base, h, k, sign});
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
function screenPoints(path) {
  return [...path.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m => ({x: Number(m[1]), y: Number(m[2])}));
}

test('logarithm values respect powers, fractional bases, shifts and reflections', () => {
  for (const base of [2, 3, .5, 1 / 3]) for (const h of [-4, 0, 4]) for (const k of [-4, 0, 4]) for (const sign of [-1, 1]) {
    const m = model(base, h, k, sign);
    for (const power of [-3, -2, -1, 0, 1, 2, 3]) {
      near(P.valueAt(h + base ** power, m), sign * power + k, 1e-10);
    }
    assert.ok(Number.isNaN(P.valueAt(h, m)));
    assert.ok(Number.isNaN(P.valueAt(h - 1, m)));
  }
});

test('coordinate transforms preserve points and include the origin and asymptote in every viewport', () => {
  for (const h of [-4, -1, 0, 2, 4]) for (const k of [-4, -1, 0, 2, 4]) {
    const m = model(2, h, k), b = P.bounds(m);
    assert.ok(b.xmin < h && b.xmax > h && b.xmin <= 0 && b.xmax >= 0);
    assert.ok(b.ymin <= 0 && b.ymax >= 0);
    for (const point of [{x: h + .5, y: k - 1}, {x: h + 1, y: k}, {x: h + 4, y: k + 2}]) {
      const pixel = P.toPixel(point.x, point.y, m), recovered = P.toData(pixel.x, pixel.y, m);
      near(point.x, recovered.x); near(point.y, recovered.y);
    }
    const leftBottom = P.toData(P.frame.left, P.frame.bottom, m);
    near(leftBottom.x, b.xmin); near(leftBottom.y, b.ymin);
    const rightTop = P.toData(P.frame.right, P.frame.top, m);
    near(rightTop.x, b.xmax); near(rightTop.y, b.ymax);
  }
});

test('curve geometry remains in the visible valid domain without crossing the asymptote', () => {
  for (const base of [2, 3, .5, 1 / 3]) for (const h of [-4, 0, 4]) for (const k of [-4, 0, 4]) for (const sign of [-1, 1]) {
    const m = model(base, h, k, sign), path = P.curvePath(m), points = screenPoints(path), b = P.bounds(m);
    assert.ok(points.length >= 2);
    assert.equal((path.match(/M/g) || []).length, 1);
    assert.doesNotMatch(path, /NaN|Infinity|undefined/);
    const increasing = sign / Math.log(base) > 0;
    let previous = null;
    for (const point of points) {
      assert.ok(point.x >= P.frame.left - 1e-7 && point.x <= P.frame.right + 1e-7);
      assert.ok(point.y >= P.frame.top - 1e-7 && point.y <= P.frame.bottom + 1e-7);
      const data = P.toData(point.x, point.y, m);
      assert.ok(data.x > h, `forbidden x=${data.x}, boundary=${h}`);
      assert.ok(data.x <= b.xmax + 1e-7);
      // This oracle evaluates the original logarithm, not the inverse sampler.
      near(data.y, sign * Math.log(data.x - h) / Math.log(base) + k, .00008);
      if (previous) assert.ok(increasing ? data.x >= previous.x - 1e-7 : data.x <= previous.x + 1e-7);
      previous = data;
    }
  }
});

test('the dashed reference curve is reprojected into the current graph coordinates', () => {
  const shifted = model(2, 3, 2), original = model(2);
  const svg = P.renderGraph(shifted, {referenceModel: original});
  const d = svg.match(/data-curve="reference" d="([^"]+)"/)[1];
  for (const p of screenPoints(d)) {
    const q = P.toData(p.x, p.y, shifted);
    assert.ok(q.x > 0);
    near(q.y, Math.log2(q.x), .00001);
  }
});

test('unrevealed exercise points and curves never appear in the graph markup', () => {
  const m = {...model(), showCurve: false, points: [{x: .5, y: -1}, {x: 1, y: 0}, {x: 2, y: 1}]};
  const hidden = P.renderGraph(m, {markedPoints: [{x: .5, y: -1}], candidate: {x: 1, y: 1}});
  assert.equal((hidden.match(/data-point="checked"/g) || []).length, 1);
  assert.equal((hidden.match(/data-point="candidate"/g) || []).length, 1);
  assert.doesNotMatch(hidden, /data-point="reference"|data-curve="function"/);
  assert.doesNotMatch(hidden, /data-x="2" data-y="1"/);
  const shown = P.renderGraph(m, {showCurve: true, revealPoints: true});
  assert.equal((shown.match(/data-point="reference"/g) || []).length, 3);
  assert.match(shown, /data-curve="function"/);
});

test('SVG renderers expose accessible descriptions and use different clipping ids', () => {
  const first = P.renderGraph({...model(.5, 1), guideY: -1});
  const second = P.renderGraph(model());
  assert.match(first, /viewBox="0 0 640 400"/);
  assert.match(first, /role="img" aria-labelledby="[^"]+"/);
  assert.match(first, /Область определения: x больше 1/);
  assert.match(first, /data-guide="horizontal"/);
  assert.match(first, /data-asymptote="true" data-x="1"/);
  assert.notEqual(first.match(/clipPath id="([^"]+)"/)[1], second.match(/clipPath id="([^"]+)"/)[1]);
  const maliciousPoint = P.renderGraph(model(), {candidate: {x: '<script>', y: 1}});
  assert.doesNotMatch(maliciousPoint, /<script>|data-point="candidate"/);
});

test('graph descriptions expose only visible evidence rather than hidden base or shift answers', () => {
  const svg = P.renderGraph({...model(4, 0, -1), points: [{x: 1, y: -1}, {x: 4, y: 0}]}, {revealPoints: true});
  const description = svg.match(/<desc[^>]*>(.*?)<\/desc>/)[1];
  assert.match(description, /График возрастает/);
  assert.match(description, /Отмеченные точки: \(1; −1\), \(4; 0\)/);
  assert.doesNotMatch(description, /основанием|log|k =|y =/);
  const hidden = P.renderGraph({...model(), showCurve: false, points: [{x: 4, y: 2}]});
  assert.doesNotMatch(hidden.match(/<desc[^>]*>(.*?)<\/desc>/)[1], /возрастает|Отмеченные точки|\(4; 2\)/);
});

test('numeric interval endpoints preserve open, closed and infinite boundaries', () => {
  for (const loClosed of [true, false]) for (const hiClosed of [true, false]) {
    const svg = P.renderInterval({lo: 1, hi: 3, loClosed, hiClosed});
    assert.match(svg, new RegExp('data-bound="lo" data-value="1" data-closed="' + loClosed + '"'));
    assert.match(svg, new RegExp('data-bound="hi" data-value="3" data-closed="' + hiClosed + '"'));
    assert.doesNotMatch(svg, /data-ray=/);
  }
  const right = P.renderInterval({lo: 3, hi: null, loClosed: true, hiClosed: false});
  assert.match(right, /data-ray="right"/);
  assert.equal((right.match(/data-bound=/g) || []).length, 1);
  const left = P.renderInterval({lo: null, hi: 1, loClosed: false, hiClosed: false});
  assert.match(left, /data-ray="left"/);
  assert.equal((left.match(/data-bound=/g) || []).length, 1);
  const all = P.renderInterval({lo: null, hi: null, loClosed: false, hiClosed: false});
  assert.equal((all.match(/data-ray=/g) || []).length, 2);
});

test('a singleton has one filled point; an empty interval has no solution segment', () => {
  const singleton = P.renderInterval({lo: 0, hi: 0, loClosed: true, hiClosed: true});
  assert.equal((singleton.match(/data-bound=/g) || []).length, 1);
  assert.match(singleton, /data-closed="true"/);
  assert.doesNotMatch(singleton, /data-solution-segment=/);
  const empty = P.renderInterval({lo: 0, hi: 0, loClosed: false, hiClosed: true});
  assert.match(empty, /нет решений/);
  assert.doesNotMatch(empty, /data-bound=|data-solution-segment=/);
});

test('fractional bounds are exact and a candidate is distinct from a verified interval', () => {
  const svg = P.renderInterval({lo: 1 / 3, hi: 2, loClosed: false, hiClosed: true},
    {candidate: {lo: 1 / 3, hi: 2, loClosed: true, hiClosed: true}});
  assert.match(svg, /data-fraction="1\/3"/);
  assert.match(svg, /data-interval="solution"/);
  assert.match(svg, /data-interval="candidate"/);
  assert.match(svg, /Ваш промежуток/);
  const blank = P.renderInterval(null);
  assert.doesNotMatch(blank, /data-interval=|data-bound=|data-solution-segment=/);
  // The answer parser accepts numbers up to 1e9. A large, incorrect student
  // draft still needs to render safely rather than crashing the exercise.
  const large = P.renderInterval(null, {candidate: {lo: -1e9, hi: 1e9, loClosed: false, hiClosed: true}});
  assert.match(large, /data-interval="candidate"/);
  assert.doesNotMatch(large, /NaN|Infinity|undefined/);
});

test('invalid bases, non-finite coordinates and impossible intervals fail explicitly', () => {
  for (const base of [0, 1, -2, NaN, Infinity, '2']) assert.throws(() => P.renderGraph(model(base)));
  for (const bad of [{h: NaN}, {k: Infinity}, {sign: 0}, {h: '<svg>'}]) assert.throws(() => P.renderGraph({...model(), ...bad}));
  assert.throws(() => P.toData(NaN, 0, model()));
  assert.throws(() => P.toPixel(0, Infinity, model()));
  for (const invalid of [
    {lo: 3, hi: 1, loClosed: false, hiClosed: false},
    {lo: null, hi: 1, loClosed: true, hiClosed: false},
    {lo: 1, hi: null, loClosed: false, hiClosed: true},
    {lo: NaN, hi: 3, loClosed: false, hiClosed: true},
    {lo: '-inf', hi: 3, loClosed: false, hiClosed: true}
  ]) assert.throws(() => P.renderInterval(invalid));
});
