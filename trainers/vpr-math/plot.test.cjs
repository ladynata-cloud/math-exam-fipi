'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Plot = require('./plot.js');

const line = {kind: 'line', k: 2, b: 1, minX: -5, maxX: 5, minY: -6, maxY: 6};
const parabola = {kind: 'parabola', h: -2, k: 3, minX: -5, maxX: 3, minY: -1, maxY: 10};

test('a line needs two distinct points on the specified graph', () => {
  assert.equal(Plot.correct([[0, 1], [1, 3]], line), true);
  for (const points of [[[0, 1], [0, 1]], [[0, 1], [1, 2]], [[0, 1]]]) {
    assert.equal(Plot.correct(points, line), false);
  }
});

test('a parabola needs three distinct points on the specified graph', () => {
  assert.equal(Plot.correct([[-2, 3], [-3, 4], [-1, 4]], parabola), true);
  assert.equal(Plot.correct([[-2, 3], [-3, 4]], parabola), false);
  assert.equal(Plot.correct([[-2, 3], [-3, 4], [-1, 5]], parabola), false);
  assert.equal(Plot.correct([[-2, 3], [-2, 3], [-1, 4]], parabola), false);
});

test('interpolation reproduces independently specified line and parabola values', () => {
  for (let x = -5; x <= 5; x += .25) {
    assert.ok(Math.abs(Plot.interpolate([[-2, 3], [-3, 4], [-1, 4]], x) - ((x + 2) ** 2 + 3)) < 1e-8);
    assert.ok(Math.abs(Plot.interpolate([[0, 1], [1, 3]], x) - (2 * x + 1)) < 1e-8);
  }
});

test('out-of-bounds, fractional, nonfinite and oversized point sets are rejected', () => {
  for (const points of [[[100, 1]], [[.5, 2]], [[0, Infinity]], [[0, 1, 2]], [[0, 1], [1, 3], [2, 5]], null]) {
    assert.equal(Plot.validPoints(points, line), false);
  }
});

test('pointer coordinates respect the plotted rectangle and translated bounds', () => {
  const task = {id: 'plot-parabola', plot: parabola};
  const html = Plot.render(task, {plotPoints: [[-5, 10], [-4, 9]]});
  const dots = Array.from(html.matchAll(/<circle cx="([^"]+)" cy="([^"]+)"/g), match => match.slice(1).map(Number));
  assert.equal(dots.length, 2);
  assert.equal(dots[1][0] - dots[0][0], dots[1][1] - dots[0][1]);

  const svg = {getBoundingClientRect: () => ({left: 10, top: 20, width: 500, height: 280})};
  const click = (x, y) => Plot.point({clientX: 10 + 70 + x, clientY: 20 + y}, svg, parabola);
  assert.deepEqual(click(...dots[0]), [-5, 10]);
  assert.deepEqual(click(...dots[1]), [-4, 9]);
  assert.equal(click(dots[0][0] - 1, dots[0][1]), null);

  for (const width of [258, 570]) {
    const scale = width / 360, left = 20.35, top = 100.35;
    const resized = {getBoundingClientRect: () => ({left, top, width, height: 280 * scale})};
    const clientX = Math.floor(left + dots[0][0] * scale), clientY = Math.floor(top + dots[0][1] * scale);
    assert.deepEqual(Plot.point({clientX, clientY}, resized, parabola), [-5, 10]);
    assert.equal(Plot.point({clientX: clientX - 2, clientY}, resized, parabola), null);
  }
});

test('a repeated abscissa is explained and does not render a singular curve', () => {
  const html = Plot.render({id: 'safe-id', plot: line}, {plotPoints: [[0, 1], [0, 2]]});
  assert.match(html, /Абсциссы совпали/);
  assert.doesNotMatch(html, /data-user-curve/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
