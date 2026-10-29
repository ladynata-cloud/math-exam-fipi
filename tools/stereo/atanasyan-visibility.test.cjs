'use strict';
// Independent world-space ray/triangle oracle for every legacy lesson and view.
// No production visibility helper is called: assertions inspect actual SVG.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const sync = require('./sync_atanasyan_visibility.cjs');
const root = path.resolve(__dirname, '../..');
const course = path.join(root, 'ege-profil/atanasyan-10-11');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
assert.equal(read(sync.targetPath), sync.build(), 'generated math and line drawing remain exact');
const lessons = [...require(path.join(course, 'lessons-a.js')), ...require(path.join(course, 'lessons-b.js'))];
assert.equal(lessons.length, 12);
assert.equal(lessons.reduce((n, l) => n + Object.keys(l.model.views).length, 0), 68);
const dom = new JSDOM('<style></style><main id="model"></main>', { url: 'https://example.test/ege-profil/atanasyan-10-11/lesson.html', runScripts: 'outside-only' });
const w = dom.window, document = w.document, host = document.getElementById('model'), errors = [];
w.addEventListener('error', event => errors.push(event.message));
document.querySelector('style').textContent = fs.readFileSync(path.join(course, 'model.css'), 'utf8');
w.eval(read(sync.targetPath));
const API = w.AtanasyanModel;
assert(API && typeof API.mount === 'function');
assert.equal(w.TaskSceneViewer, undefined, 'standalone route does not overwrite another viewer API');
const stats = { models: 0, authoredViews: 0, cameraViews: 0, paths: 0, hiddenPaths: 0, splitLines: 0, rays: 0, negativeControls: 0 };
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const at = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function oracle(model, checkClosed = true) {
  const values = Object.values(model.points);
  const center = [0, 1, 2].map(i => (Math.min(...values.map(p => p[i])) + Math.max(...values.map(p => p[i]))) / 2);
  const radius = Math.max(.001, ...values.map(p => Math.hypot(...sub(p, center))));
  const triangles = [], topology = new Map(), body = [...new Set((model.faces || []).flat())];
  for (const face of model.faces || []) {
    const points = face.map(n => model.points[n]);
    const normal = cross(sub(points[1], points[0]), sub(points[2], points[0])), length = Math.hypot(...normal);
    assert(length > 1e-10, 'nondegenerate authored face');
    assert(points.every(p => Math.abs(dot(normal, sub(p, points[0]))) / length < radius * 1e-9), 'planar authored face');
    // These twelve models have convex faces/solids. Verify the premise before
    // triangulating a face as a fan; open-plane fixtures use convex quads too.
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length], c = points[(i + 2) % points.length];
      assert(dot(cross(sub(b, a), sub(c, b)), normal) >= -1e-9, 'convex ordered face');
    }
    if (checkClosed) {
      const distances = body.map(n => dot(normal, sub(model.points[n], points[0])) / length);
      assert(Math.min(...distances) >= -radius * 1e-8 || Math.max(...distances) <= radius * 1e-8, 'complete convex authored body');
    }
    face.forEach((a, i) => { const key = JSON.stringify([a, face[(i + 1) % face.length]].sort()); topology.set(key, (topology.get(key) || 0) + 1); });
    for (let i = 1; i < points.length - 1; i++) triangles.push({ a: points[0], e1: sub(points[i], points[0]), e2: sub(points[i + 1], points[0]) });
  }
  if (checkClosed) assert([...topology.values()].every(n => n === 2), 'closed body, exactly two faces per boundary edge');
  return { model, center, radius, triangles };
}
function hidden(scene, point, camera) {
  stats.rays++;
  if (scene.model.planar) return false;
  const direction = [Math.sin(camera.yaw)*Math.cos(camera.pitch), Math.cos(camera.yaw)*Math.cos(camera.pitch), Math.sin(camera.pitch)];
  for (const triangle of scene.triangles) {
    const p = cross(direction, triangle.e2), determinant = dot(triangle.e1, p);
    if (Math.abs(determinant) < 1e-12 * Math.hypot(...triangle.e1) * Math.hypot(...triangle.e2)) continue;
    const inverse = 1 / determinant, s = sub(point, triangle.a), u = dot(s, p) * inverse;
    if (u < -1e-9 || u > 1 + 1e-9) continue;
    const q = cross(s, triangle.e1), v = dot(direction, q) * inverse;
    if (v < -1e-9 || u + v > 1 + 1e-9) continue;
    if (dot(triangle.e2, q) * inverse > scene.radius * 1e-7) return true;
  }
  return false;
}
function projected(scene, point, camera) {
  const [x, y, z] = sub(point, scene.center), depth = x*Math.sin(camera.yaw) + y*Math.cos(camera.yaw), scale = 125 / scene.radius;
  return [210 + (x*Math.cos(camera.yaw)-y*Math.sin(camera.yaw))*scale, 155 - (z*Math.cos(camera.pitch)-depth*Math.sin(camera.pitch))*scale];
}
function inspect(scene, viewer, key, label) {
  const camera = viewer.getState(), view = scene.model.views[key], expected = new Map(), groups = new Map();
  assert.equal(camera.view, key, label + ' legacy selected-view state');
  const add = (kind, pair) => expected.set(kind + '|' + pair.join('-'), pair);
  scene.model.edges.forEach(pair => add('edge', pair));
  view.segments.forEach(pair => add('segment', pair));
  view.polygon.forEach((a, i) => add('boundary', [a, view.polygon[(i + 1) % view.polygon.length]]));
  for (const fill of host.querySelectorAll('.am-face,.am-plane')) assert.equal(w.getComputedStyle(fill).stroke, 'none', label + ' fills never repaint lines');
  const paths = [...host.querySelectorAll('.am-edge,.am-segment,.am-plane-border')];
  assert.equal(paths.length, host.querySelectorAll('[data-edge],[data-segment],[data-boundary]').length, label + ' every line classified');
  for (const node of paths) {
    const kind = ['edge', 'segment', 'boundary'].find(k => node.hasAttribute('data-' + k));
    assert(kind, label + ' no unclassified stroke');
    const id = kind + '|' + node.getAttribute('data-' + kind), pair = expected.get(id);
    assert(pair, label + ' known identity ' + id);
    const start = Number(node.dataset.partStart), end = Number(node.dataset.partEnd), isHidden = node.dataset.hidden === 'true';
    assert(node.hasAttribute('data-part-start') && node.hasAttribute('data-part-end'), label + ' interval metadata');
    assert(Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end <= 1 && end > start, label + ' valid interval');
    assert(['true', 'false'].includes(node.dataset.hidden), label + ' explicit visibility');
    const a = scene.model.points[pair[0]], b = scene.model.points[pair[1]];
    const coordinates = node.getAttribute('d').match(/^M([\d.e+-]+) ([\d.e+-]+) L([\d.e+-]+) ([\d.e+-]+)$/);
    assert(coordinates, label + ' one actual SVG segment per interval');
    const expectedPoints = [...projected(scene, at(a, b, start), camera), ...projected(scene, at(a, b, end), camera)];
    coordinates.slice(1).map(Number).forEach((n, i) => assert(Math.abs(n - expectedPoints[i]) < .00051, label + ' actual endpoint'));
    for (const fraction of [.113, .371, .617, .887]) {
      const t = start + fraction * (end - start);
      assert.equal(isHidden, hidden(scene, at(a, b, t), camera), `${label} ${id} visibility at ${t}`);
    }
    const dash = w.getComputedStyle(node).strokeDasharray;
    assert.equal(Boolean(dash && dash !== 'none'), isHidden, label + ' actual computed dash style ' + id);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push({ start, end, hidden: isHidden });
    stats.paths++; if (isHidden) stats.hiddenPaths++;
  }
  assert.equal(groups.size, expected.size, label + ' all authored lines rendered');
  for (const [id, pair] of expected) {
    const parts = groups.get(id).sort((a, b) => a.start - b.start);
    assert.equal(parts[0].start, 0, label + ' complete start');
    assert.equal(parts.at(-1).end, 1, label + ' complete end');
    for (let i = 1; i < parts.length; i++) assert(Math.abs(parts[i].start - parts[i - 1].end) < 1e-10, label + ' no omitted or overlapping part');
    if (parts.length > 1) stats.splitLines++;
    for (let i = 0; i < 17; i++) {
      const t = (i + .371) / 17, part = parts.find(p => t >= p.start && t <= p.end);
      assert.equal(part.hidden, hidden(scene, at(scene.model.points[pair[0]], scene.model.points[pair[1]], t), camera), label + ' independent uniform probe ' + id);
    }
  }
}
function key(name, count = 1) {
  for (let i = 0; i < count; i++) host.querySelector('svg').dispatchEvent(new w.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
}
for (const file of ['lessons-a.js', 'lessons-b.js', 'lessons.js']) w.eval(fs.readFileSync(path.join(course, file), 'utf8'));
const sentinels = [...w.AtanasyanCourse.lessons].map(l => [l.storageKey, JSON.stringify({ draft: 'Незавершённое решение ' + l.id, step: 2 })]);
assert.equal(new Set(sentinels.map(([key]) => key)).size, 12, 'actual course storage keys remain distinct');
for (const [key, value] of sentinels) w.localStorage.setItem(key, value);
for (const lesson of lessons) {
  const original = JSON.stringify(lesson), scene = oracle(lesson.model), viewer = API.mount(host, lesson.model);
  stats.models++; stats.authoredViews += Object.keys(lesson.model.views).length;
  assert.equal(host.querySelector('.atanasyan-model').dataset.model, 'atanasyan-exact');
  assert.equal(host.querySelector('svg').getAttribute('viewBox'), '0 0 420 320');
  assert.equal(host.querySelectorAll('.am-button').length, 5, 'original five controls');
  for (let camera = 0; camera < 3; camera++) {
    if (camera === 1) { key('ArrowRight', 6); key('ArrowUp', 4); }
    if (camera === 2) { key('ArrowLeft', 13); key('ArrowDown', 9); }
    const before = viewer.getState();
    for (const view of Object.keys(lesson.model.views)) {
      assert.equal(viewer.setView(view), true);
      assert.equal(viewer.getState().yaw, before.yaw, 'highlight preserves camera');
      assert.equal(viewer.getState().pitch, before.pitch, 'highlight preserves inclination');
      inspect(scene, viewer, view, lesson.id + '/' + view + '/camera' + camera);
      stats.cameraViews++;
    }
  }
  viewer.reset();
  assert.equal(viewer.getState().yaw, -.62); assert.equal(viewer.getState().pitch, .43);
  assert.equal(viewer.setView('missing'), false); assert.equal(viewer.getState().view, 'neutral');
  assert.equal(JSON.stringify(lesson), original, 'coordinates, IDs, content and storage contract untouched');
  const replacement = API.mount(host, lesson.model);
  assert.equal(host.querySelectorAll('.atanasyan-model').length, 1, 'remount removes former model');
  assert.equal(viewer.setView('neutral'), false, 'remount destroys old API');
  replacement.destroy(); assert.equal(host.children.length, 0);
}
// Partial occlusion is checked independently of every authored line, so a
// regression back to whole-line/adjacency classification cannot pass this gate.
const partial = { points: { A: [-1, 0, -1], B: [1, 0, -1], C: [1, 0, 1], D: [-1, 0, 1], U: [-3, -1, 0], V: [3, -1, 0] }, edges: [['U', 'V']], faces: [['A', 'B', 'C', 'D']], views: { neutral: { label: 'Fixture', segments: [['V', 'U']], polygon: [] } } };
const partialScene = oracle(partial, false), partialViewer = API.mount(host, partial);
inspect(partialScene, partialViewer, 'neutral', 'partial open plane');
assert.equal(host.querySelectorAll('[data-edge]').length, 3, 'line enters and exits plane silhouette');
const middle = host.querySelector('[data-edge][data-hidden="true"]');
assert(middle, 'partial line has hidden interior');
middle.dataset.hidden = 'false';
assert.throws(() => inspect(partialScene, partialViewer, 'neutral', 'negative hidden flag'), /visibility/); stats.negativeControls++;
middle.dataset.hidden = 'true';
const savedEnd = middle.dataset.partEnd; middle.dataset.partEnd = String(Number(savedEnd) - .01);
assert.throws(() => inspect(partialScene, partialViewer, 'neutral', 'negative endpoint'), /actual endpoint/); stats.negativeControls++;
middle.dataset.partEnd = savedEnd;
const backwards = host.querySelector('[data-segment][data-hidden="true"]');
const p = middle.getAttribute('d').match(/[\d.e+-]+/g).map(Number), length = Math.hypot(p[2] - p[0], p[3] - p[1]);
const phase = Number(middle.getAttribute('stroke-dashoffset')), reversePhase = Number(backwards.getAttribute('stroke-dashoffset'));
const phaseRemainder = ((length + phase + reversePhase) % 10 + 10) % 10;
assert(Math.abs(phaseRemainder - 5) < .002, 'coincident reversed hidden line retains the same dash gaps');
partialViewer.destroy();
for (const [key, value] of sentinels) assert.equal(w.localStorage.getItem(key), value, 'existing drafts retained');
assert.equal(w.localStorage.length, sentinels.length, 'renderer introduces no storage keys');
assert.deepEqual(errors, []);
dom.window.close();
console.log('ATANASYAN_VISIBILITY_ORACLE_OK', JSON.stringify(stats));
