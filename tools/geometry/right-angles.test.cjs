'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const data = name => JSON.parse(read(name));
const viewerSource = read('stereo-course/assets/task-scene-viewer.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const table = JSON.parse(viewerSource.match(/const textbookRightAngles = (\{[\s\S]*?\n  \});/)[1]);
const visited = new Set();
let models = 0, planarMarks = 0, stages = 0;
function checkRight(points, [a, vertex, b], tolerance, message) {
  const u = points[a].map((x, i) => x - points[vertex][i]);
  const v = points[b].map((x, i) => x - points[vertex][i]);
  const scale = Math.hypot(...u) * Math.hypot(...v);
  assert(scale > 0 && Math.abs(u.reduce((s, x, i) => s + x * v[i], 0)) <= tolerance * scale, message);
}
for (const course of ['merzlyak-10-base', 'textbook', 'shestakov-yaschenko-10-11', 'literacy']) {
  for (const lesson of data('stereo-course/' + course + '/data/course.json').lessons) {
    const marks = table[lesson.id];
    if (!marks) continue;
    const model = lesson.visualization.model;
    const checked = viewer.prepare(model, marks);
    for (const stage of Object.keys(marks)) assert(stage === '*' || Object.hasOwn(model.views, stage), lesson.id + ' stage ' + stage);
    for (const [stage, view] of Object.entries(checked.views)) {
      const expected = [...(marks['*'] || []), ...(marks[stage] || [])];
      for (const angle of expected) checkRight(model.points, angle, 1e-6, lesson.id + ': ' + angle);
      assert.deepEqual(view.rightAngles.map(a => a.names), expected, lesson.id + ' rays on the actual ' + stage + ' drawing');
      if (expected.length) stages++;
    }
    visited.add(lesson.id);
    models++;
  }
}
assert.deepEqual([...visited].sort(), Object.keys(table).sort(), 'all published references resolve');
for (const lesson of data('geometry-course/textbook/data/course.json').lessons) {
  const model = lesson.visualization.model;
  for (const [stage, view] of Object.entries(model.views)) {
    for (const { vertex, a, b } of view.rightAngles || []) {
      // Some earlier 2D cards round point coordinates for the printed scale.
      checkRight(model.points, [a, vertex, b], .002, lesson.id + ' ' + stage);
      planarMarks++;
    }
  }
}
assert(planarMarks > 3400);
const dom = new JSDOM('<div id="scene"></div>', { runScripts: 'outside-only' });
const win = dom.window, target = win.document.getElementById('scene');
win.eval(viewerSource);
const markers = () => [...new Set([...target.querySelectorAll('[data-right-angle]')].map(n => n.dataset.rightAngle))];
const id = 'merz-ex-10-032';
const model = data('stereo-course/merzlyak-10-base/lessons/ex-10-032.json').visualization.model;
const actual = win.TaskSceneViewer.mount(target, model, { lessonId: id });
assert.deepEqual(markers(), ['A H C', 'M A H']);
assert.match(target.querySelector('desc').textContent, /∠AHC, ∠MAH/);
const initialPath = target.querySelector('[data-right-angle]').getAttribute('d');
target.querySelector('svg').dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight' }));
assert.deepEqual(markers(), ['A H C', 'M A H']);
assert.notEqual(initialPath, target.querySelector('[data-right-angle]').getAttribute('d'));
actual.destroy();
const staged = { planar: true, points: { A: [0, 3, 0], H: [0, 0, 0], C: [4, 0, 0], D: [1, 2, 1] },
  edges: [['A', 'H'], ['H', 'C']], views: { neutral: { label: 'Условие' },
    proof: { label: 'Обоснование', rightAngles: [['A', 'H', 'C'], ['C', 'H', 'A'], ['A', 'H', 'D']] } } };
const interactive = win.TaskSceneViewer.mount(target, staged);
assert.deepEqual(markers(), [], 'a right-looking corner is no given');
interactive.setView('proof');
assert.deepEqual(markers(), ['A H C'], 'only the established, drawn right angle');
interactive.setView('neutral');
assert.deepEqual(markers(), [], 'returning to the question hides the proof');
interactive.destroy();
staged.edges.pop();
const undrawn = win.TaskSceneViewer.mount(target, staged);
undrawn.setView('proof');
assert.deepEqual(markers(), [], 'a named point alone does not draw a ray');
undrawn.destroy();
win.close();
console.log('GEOMETRY_RIGHT_ANGLES_OK', visited.size, 'reviewed cards,', stages, 'marked views,', planarMarks, 'planar marks, rotation and proof timing');
