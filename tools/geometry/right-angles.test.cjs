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
// Follow the exact production preparation before checking proof-dependent marks.
win.eval(read('assets/geometry-step-views.js'));
const preparedLesson = win.GeometryStepViews.prepare({lessons:[data('stereo-course/merzlyak-10-base/lessons/ex-10-032.json')]}).lessons[0];
const preparedBefore = JSON.stringify(preparedLesson.visualization.model);
const preparedView = win.TaskSceneViewer.mount(target, preparedLesson.visualization.model, {lessonId:id});
assert.deepEqual(markers(), [], 'the question does not draw the not-yet-constructed AH');
assert.doesNotMatch(target.querySelector('desc').textContent, /Прямые углы:/);
preparedView.setView('step-1');
assert.deepEqual(markers(), ['A H C'], 'the first step establishes the altitude only');
assert.equal(target.querySelectorAll('[data-segment^="_rH"]').length, 0, 'the obsolete decorative corner does not duplicate the standard mark');
assert(target.querySelector('[data-segment="A-H"]'), 'the actual constructed altitude stays drawn');
assert.doesNotMatch(target.querySelector('desc').textContent, /_r/, 'hidden decorative point IDs are not announced');
assert.match(target.querySelector('desc').textContent, /A — H/, 'the actual altitude is announced');
assert.doesNotMatch(target.querySelector('desc').textContent, /между прямой m и AH|∠mAH/);
for (const step of ['step-2','step-3']) {
  preparedView.setView(step);
  assert.deepEqual(markers(), ['A H C','M A H'], step + ': both proved perpendiculars are marked');
  assert.match(target.querySelector('desc').textContent, /∠AHC, между прямой m и AH/);
  assert.doesNotMatch(target.querySelector('desc').textContent, /∠mAH/);
  assert.equal(target.querySelectorAll('[data-segment^="_r"]').length, 0, 'one standard square per proved angle');
  assert(target.querySelector('[data-segment="A-H"]'), 'actual rays remain');
  assert.doesNotMatch(target.querySelector('desc').textContent, /_r/);
  assert.match(target.querySelector('desc').textContent, /A — H/);
}
preparedView.setView('neutral');
assert.deepEqual(markers(), [], 'return to the question hides proof-dependent signs');
preparedView.destroy();
assert.equal(JSON.stringify(preparedLesson.visualization.model), preparedBefore, 'draw filtering never mutates the authored source');
const extraSegment = JSON.parse(preparedBefore);
extraSegment.views['step-1'].segments.push(['_rH1','_rH3']);
const extraView = win.TaskSceneViewer.mount(target, extraSegment, {lessonId:id});
extraView.setView('step-1');
assert(target.querySelector('[data-segment="_rH1-_rH3"]'), 'only the two exact corner strokes are replaced, not another segment among those points');
extraView.destroy();
const withoutRay = JSON.parse(preparedBefore);
withoutRay.views['step-1'].segments = withoutRay.views['step-1'].segments.filter(edge => edge.join(' ') !== 'A H');
const fallbackView = win.TaskSceneViewer.mount(target, withoutRay, {lessonId:id});
fallbackView.setView('step-1');
assert.deepEqual(markers(), [], 'no valid mark when the altitude ray is absent');
assert.equal(target.querySelectorAll('[data-segment^="_rH"]').length, 2, 'without a validated standard mark the previous two strokes remain');
fallbackView.destroy();
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

// Exercise the real canvas consumers after composing the general standard with
// Pogorelov's topic guides: inferred-looking angles remain unmarked, constructed
// perpendiculars survive movement and undo, and the guide's label spacing stays.
for (const course of ['geometry-course', 'geometry-merzlyak', 'geometry-pogorelov']) {
  const d = new JSDOM('<main></main>', { runScripts: 'outside-only' });
  const w = d.window, strokes = [], labels = [];
  let current = [], style = '';
  const ctx = new Proxy({}, {
    get: (_, method) => (...args) => {
      if (method === 'beginPath') current = [];
      if (method === 'moveTo' || method === 'lineTo') current.push(args);
      if (method === 'stroke') strokes.push({ style, points: current.map(p => [...p]) });
      if (method === 'fillText') labels.push(args);
    },
    set: (_, key, value) => { if (key === 'strokeStyle') style = value; return true; }
  });
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  for (const asset of ['geometry.js', 'lab.js']) w.eval(read(course + '/assets/' + asset));
  const el = w.document.querySelector('main');
  const scene = { type: 'triangle', points: [
    { id: 'A', x: 140, y: 300, kind: 'free' },
    { id: 'B', x: 500, y: 300, kind: 'free' },
    { id: 'C', x: 140, y: 100, kind: 'free' }
  ], objects: [['A','B'], ['B','C'], ['C','A']].map(([a,b]) => ({id:a+b,a,b,type:'line',extent:'segment'})) };
  const lab = w.GeoLab.mount(el, { scene, figure: 'triangle', goal: 'explore' });
  const squares = () => strokes.filter(s => s.style === '#196a56' && s.points.length === 3);
  assert.equal(squares().length, 0, course + ': coordinates alone do not establish a right angle');
  lab.board.make('perpendicular', ['C', 'A', 'B']);
  strokes.length = 0; lab.redraw();
  assert.equal(squares().length, 1, course + ': a constructed perpendicular is marked without an opt-in flag');
  lab.board.move('B', 480, 250);
  strokes.length = 0; lab.redraw();
  assert.equal(squares().length, 1, course + ': movement retains the mark');
  const [a,b,c] = squares()[0].points;
  const u = [a[0]-b[0],a[1]-b[1]], v = [c[0]-b[0],c[1]-b[1]];
  assert(Math.abs(u[0]*v[0]+u[1]*v[1]) < 1e-8, course + ': mark rotates with its rays');
  strokes.length = 0; el.querySelector('[data-act="undo"]').click();
  assert.equal(squares().length, 0, course + ': undo removes the constructed mark');
  lab.destroy();
  if (course === 'geometry-pogorelov') {
    const linked = { ...scene, labelPartners: {C:'A'}, points: scene.points.map(p => ({...p})) };
    linked.points[2].x = 141; linked.points[2].y = 301;
    labels.length = 0;
    const guide = w.GeoLab.mount(el, {scene: linked, figure:'triangle', goal:'explore'});
    const A = labels.filter(p=>p[0]==='A').at(-1), C = labels.filter(p=>p[0]==='C').at(-1);
    assert(Math.abs(A[2]-C[2]) >= 20, 'Pogorelov guide keeps linked labels separated');
    guide.destroy();
  }
  w.close();
}
console.log('RIGHT_ANGLE_CANVAS_COMPOSITION_OK: three constructors, negative case, rotation, undo and Pogorelov labels');
