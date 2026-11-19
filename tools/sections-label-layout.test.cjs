'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const course = require('../stereo-course/sections/data/course.json');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'stereo-course/sections/assets/app.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'stereo-course/sections/assets/style.css'), 'utf8');
const end = source.indexOf('/* Pure data and exact-coordinate activities. No network, eval or dependencies. */');
assert(end > 0, 'canonical lesson engine boundary');

// Actual Chromium glyph extents from the failing 320px final ii-example-7
// scene, workflow run 43765237685 / artifact 14182505738 / head 09934f48.
// The model's SVG viewBox was 267x205; all 26 labels must remain available.
// This regression makes the observed packing failure reproducible without
// pretending that jsdom measures fonts. The full browser gate remains required.
const glyphWidths = {
  K: 16.015869, W: 21.020828, A: 15.014877, 'A₁': 23.022811,
  B: 14.483100, 'B₁': 22.803844, C: 13.935683, 'C₁': 22.256429,
  D: 15.765621, 'D₁': 24.086362, E: 12.981610, 'E₁': 21.302354,
  F: 12.981613, 'F₁': 21.302356, H: 15.906385, M: 18.909358,
  N: 15.906385, P: 14.013881, Q: 16.156633, R: 15.014877,
  T: 13.012893, U: 15.421529, V: 15.014877, X: 15.014877,
  Y: 15.014877, Z: 13.779277
};
const glyphHeight = 22.021819;
const intersections = (a, b) => Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1;

test('the measured dense prism scene keeps all glyphs readable and every point uncovered', async () => {
  const lesson = course.lessons.find(item => item.id === 'ii-example-7');
  assert(lesson);
  const dom = new JSDOM('<!doctype html><head></head><body><div id="sections-app"></div></body>', {
    url: 'https://example.test/stereo-course/sections/#ii-example-7', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, errors = [];
  let scene;
  try {
    w.addEventListener('error', event => errors.push(event.error));
    w.TextEncoder = TextEncoder; w.scrollTo = () => {};
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.COURSE = w.JSON.parse(JSON.stringify({ ...course, lessons: [lesson], modules: [], learningPath: [] }));
    const css = w.document.createElement('style'); css.textContent = style; w.document.head.append(css);
    w.SVGElement.prototype.getBBox = function () {
      const width = glyphWidths[this.textContent];
      assert(Number.isFinite(width), 'measured metric exists for ' + this.textContent);
      return { x: Number(this.getAttribute('x') || 0), y: Number(this.getAttribute('y') || 0) - 16, width, height: glyphHeight };
    };
    w.eval(source.slice(0, end));
    const container = w.document.createElement('div'); w.document.body.append(container);
    scene = w.SECTIONS_APP.createScene(container, lesson, () => {});
    scene.width = 267; scene.height = 205; scene.svg.setAttribute('viewBox', '0 0 267 205');
    scene.update({ viewCount: lesson.steps.length, planeId: 'FF1A1A', planeView: false,
      camera: { yaw: -.65, pitch: .46 }, showHelpers: true, cleanView: false, showResult: true });
    const labels = [...scene.svg.querySelectorAll('[data-label]')].map(node => {
      const box = node.getBBox(), halo = parseFloat(w.getComputedStyle(node).strokeWidth) / 2;
      return { name: node.dataset.label, x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height, halo };
    });
    const points = [...scene.svg.querySelectorAll('[data-point]')].map(node => {
      const x = Number(node.getAttribute('cx')), y = Number(node.getAttribute('cy'));
      const radius = Number(node.getAttribute('r')) + parseFloat(w.getComputedStyle(node).strokeWidth) / 2;
      return { name: node.dataset.point, x: x - radius, right: x + radius, y: y - radius, bottom: y + radius };
    });
    assert.deepEqual(labels.map(label => label.name).sort(), Object.keys(lesson.model.points).sort());
    assert.equal(labels.length, 26); assert.equal(points.length, 26);
    const collisions = [];
    for (const label of labels) {
      assert(label.x - label.halo >= 0 && label.right + label.halo <= 267 && label.y - label.halo >= 0 && label.bottom + label.halo <= 205, 'painted label fits: ' + label.name);
      for (const point of points) if (intersections(label, point)) collisions.push(label.name + '/' + point.name);
    }
    assert.deepEqual(collisions, [], 'no glyph may hide a point; the original observed failure was Z/A1 and Z/B1');
    for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
      assert(!intersections(labels[i], labels[j]), 'readable distinct glyphs: ' + labels[i].name + '/' + labels[j].name);
    }
    assert(scene.svg.querySelector('[data-label="Z"]'), 'the crowded label is retained');
  } finally {
    scene?.destroy();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.deepEqual(errors, []);
    w.close();
  }
});
