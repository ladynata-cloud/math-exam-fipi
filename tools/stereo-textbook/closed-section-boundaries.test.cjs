'use strict';

const assert = require('node:assert/strict');
const {cards: receipts} = require('./closed-section-boundaries.json');
const {previousCard} = require('./closed-section-boundaries.cjs');
const bank = require('../../stereo-course/textbook/data/course.json');
const distance = (a, b) => Math.hypot(...a.map((coordinate, axis) => coordinate - b[axis]));
const area = points => Math.abs(points.reduce((sum, p, i) => {
  const q = points[(i + 1) % points.length];
  return sum + p[0] * q[1] - p[1] * q[0];
}, 0)) / 2;
let outlines = 0;
for (const [id, receipt] of Object.entries(receipts)) {
  const card = bank.lessons.find(lesson => lesson.id === id);
  const original = previousCard(card);
  const model = card.visualization.model;
  assert.deepEqual(original.visualization.model.points, model.points);
  for (const [view, , removed, retained] of receipt.restore) {
    assert(distance(model.points[removed], model.points[retained]) < 1e-12);
    assert(!model.views[view].polygon.includes(removed));
    assert(model.views[view].polygon.includes(retained));
  }
  // Only the mathematically coincident endpoint may be removed. A moved
  // vertex or a changed learner hint may never inherit the old review.
  const moved = structuredClone(card);
  const first = receipt.restore[0][3];
  moved.visualization.model.points[first][0] += .01;
  assert.throws(() => previousCard(moved), /current reviewed section/);
  const changed = structuredClone(card);
  changed.help[0].text += '!';
  assert.throws(() => previousCard(changed), /current reviewed section/);
  for (const view of new Set(receipt.restore.map(row => row[0]))) {
    const names = model.views[view].polygon;
    const points = names.map(name => model.points[name]);
    const before = original.visualization.model.views[view].polygon.map(name => model.points[name]);
    const actual = area(points);
    assert(Math.abs(area(before) - actual) < 1e-10, 'same oriented boundary area: ' + id);
    assert(points.every((p, i) => points.slice(i+1).every(q => distance(p,q) > 1e-6)));
    if (id === 'ex-main-0509') {
      assert.equal(names.length, 128);
      const radius = distance(model.points.O, model.points.P);
      const exact = 2 * radius**2 * Math.acos(.5) - Math.sqrt(3) * radius**2 / 2;
      assert(Math.abs(actual / exact - 1) < .0004, 'two circular segments bounded by the common chord');
      const half = model.views.half.polygon.map(name => model.points[name]);
      assert(Math.abs(2 * area(half) - actual) < 1e-10, 'two congruent half lenses');
    } else {
      assert.equal(points.length, 64);
      const center = points.reduce((sum, p) => sum.map((n,i) => n + p[i] / points.length), [0,0,0]);
      const radius = distance(points[0], center);
      for (const p of points) assert(Math.abs(distance(p,center) - radius) < 1e-10);
      const regularArea = points.length / 2 * radius**2 * Math.sin(2*Math.PI / points.length);
      assert(Math.abs(actual - regularArea) < 1e-10, id + ' regular cross-section');
    }
    outlines++;
  }
}
assert.equal(Object.keys(receipts).length, 8);
assert.equal(outlines, 15);
console.log('CLOSED_SECTION_BOUNDARIES_OK: 15 simple filled sections, exact historical inverse and 16 rejected mutations');
