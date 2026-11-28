'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { tasks } = require('./data.js');
const { JSDOM } = require('jsdom');
const { measure, drawSecant } = require('./rate-lab.js');

const task = id => tasks.find(item => item.id === id);

function checkInterval(id, a, b, left, right, rate) {
  const got = measure(task(id), a, b);
  const expected = { left, right, dx: b - a, dy: right - left, rate };
  for (const [key, value] of Object.entries(expected)) {
    assert.ok(Math.abs(got[key] - value) < 1e-9, id + ' [' + a + '; ' + b + '] ' + key);
  }
}

test('a positive parabola gives all three signs of average change', () => {
  checkInterval('C3', 0, 2, 5, 1, -2);
  checkInterval('C3', 2, 4, 1, 5, 2);
  checkInterval('C3', 0, 4, 5, 5, 0);
  checkInterval('C3', 1, 3, 2, 2, 0);
});

test('average change uses actual units, including fractional and shrinking steps', () => {
  checkInterval('C4', -2, -0.5, 3, 3.75, 0.5);
  checkInterval('C7', 1, 1.5, -6, -3.5, 5);
  checkInterval('C7', 1, 1.25, -6, -4.875, 4.5);
});

test('domain endpoints, piecewise boundaries and the branch owning the jump', () => {
  checkInterval('B1', -2, 2, 0, 2, 0.5);
  checkInterval('E1', -0.5, 1, -1, 1, 4 / 3);
  checkInterval('F8', -2, -1, -2, 0, 2);
  checkInterval('F8', 2, 3, 3, 3, 0);
  for (const [id, a, b] of [
    ['B1', -3, 2], ['E1', -1, 1], ['C3', 1, 1],
    ['C3', 2, 1], ['C3', NaN, 1], ['C3', 0, Infinity]
  ]) assert.equal(measure(task(id), a, b), null, id + ' ' + a + ' ' + b);
});

test('secant slopes agree with coordinate pairs in the original 40 exercises', () => {
  assert.equal(tasks.length, 40);
  for (const t of tasks) {
    const points = [...t.points].sort((p, q) => p.x - q.x);
    for (let i = 0; i < points.length; i++) {
      for (const q of points.slice(i + 1)) {
        const p = points[i];
        checkInterval(t.id, p.x, q.x, p.y, q.y, (q.y - p.y) / (q.x - p.x));
      }
    }
  }
});

test('board secants pass through both marked points at the correct coordinate scale', () => {
  const dom = new JSDOM('<svg></svg>');
  try {
    const svg = dom.window.document.querySelector('svg');
    for (const [id, a, b, expected] of [['C3', 0, 2, -2], ['C4', -3, 1, 0], ['C7', 0, 2, 4]]) {
      drawSecant(svg, task(id), a, b);
      const line = svg.querySelector('[data-secant]');
      const [x1, x2, y1, y2] = ['x1', 'x2', 'y1', 'y2'].map(name => Number(line.getAttribute(name)));
      const screenSlope = (y2 - y1) / (x2 - x1);
      assert.ok(Math.abs(-screenSlope - expected) < 1e-9, 'equal units on both axes for ' + id);
      const markers = svg.querySelectorAll('[data-point]');
      assert.equal(markers.length, 2);
      for (const dot of markers) {
        const x = Number(dot.getAttribute('cx')), y = Number(dot.getAttribute('cy'));
        assert.ok(Math.abs(y - (y1 + (x - x1) * screenSlope)) < 0.005, 'secant contains marker for ' + id);
      }
    }
  } finally { dom.window.close(); }
});
