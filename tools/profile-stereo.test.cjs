'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const lessons = require('../ege-profil/start/stereo-data.js');
const state = require('../ege-profil/start/state.js');
const root = path.resolve(__dirname, '..');
const tasks = lessons.flatMap(l => l.tasks);

// Independent formulae use the problem parameters, not the authored solution.
// Cylinder/cone/sphere coefficients are divided by pi as requested in the text.
function oracle(m) {
  switch (m.kind) {
    case 'box-volume': return m.a * m.b * m.h;
    case 'box-surface': return 2 * (m.a * m.b + m.a * m.h + m.b * m.h);
    case 'box-diagonal': return Math.hypot(m.a, m.b, m.h);
    case 'box-height': return m.volume / (m.a * m.b);
    case 'cube-volume': return m.a ** 3;
    case 'cube-edge': return Math.cbrt(m.volume);
    case 'cube-surface': return 6 * m.a ** 2;
    case 'volume-scale': return m.factor ** 3;
    case 'surface-scale': return m.factor ** 2;
    case 'scaled-volume': return m.volume * m.factor ** 3;
    case 'triangular-prism-volume': return m.a * m.b * m.h / 2;
    case 'prism-height': return m.volume / m.area;
    case 'prism-area': return m.volume / m.h;
    case 'prism-lateral': return m.sides.reduce((s, a) => s + a, 0) * m.h;
    case 'square-pyramid-volume': return m.a ** 2 * m.h / 3;
    case 'square-pyramid-height': return 3 * m.volume / m.a ** 2;
    case 'pyramid-from-prism': return m.prismVolume / 3;
    case 'pyramid-height': return 3 * m.volume / m.area;
    case 'pyramid-area': return 3 * m.volume / m.h;
    case 'cylinder-volume-coefficient': return m.r ** 2 * m.h;
    case 'cylinder-lateral-coefficient': return 2 * m.r * m.h;
    case 'cylinder-surface-coefficient': return 2 * m.r * (m.r + m.h);
    case 'cylinder-diameter-volume': return (m.diameter / 2) ** 2 * m.h;
    case 'cylinder-height': return m.volumeCoefficient / m.r ** 2;
    case 'cylinder-radius': return Math.sqrt(m.volumeCoefficient / m.h);
    case 'cone-volume-coefficient': return m.r ** 2 * m.h / 3;
    case 'cone-height-from-slant': return Math.sqrt((m.slant - m.r) * (m.slant + m.r));
    case 'cone-lateral-coefficient': return m.r * m.slant;
    case 'cone-slant': return Math.hypot(m.r, m.h);
    case 'cone-surface-coefficient': return m.r * (m.r + m.slant);
    case 'sphere-area-coefficient': return 4 * m.r ** 2;
    case 'sphere-volume-coefficient': return 4 * m.r ** 3 / 3;
    case 'sphere-radius-from-area': return Math.sqrt(m.areaCoefficient) / 2;
    case 'sphere-diameter-area': return m.diameter ** 2;
    case 'box-minus-cube': return m.a * m.b * m.h - m.cut ** 3;
    case 'tube-coefficient': return (m.outer - m.inner) * (m.outer + m.inner) * m.h;
    case 'cylinder-plus-cone': return m.r ** 2 * (m.cylinderHeight + m.coneHeight / 3);
    default: throw Error(`Missing independent formula: ${m.kind}`);
  }
}

// Audit every intermediate number too. The steps are recomputed from the
// givens, with no dependence on authored step answers or solution strings.
function chain(task) {
  const m = task.meta, end = oracle(m);
  switch (m.kind) {
    case 'box-volume': return [m.a * m.b, end];
    case 'box-surface': return task.steps.length === 5
      ? [m.a * m.b, m.a * m.h, m.b * m.h, end / 2, end] : [end / 2, end];
    case 'box-diagonal': return task.steps.length === 3
      ? [m.a ** 2 + m.b ** 2, m.a ** 2 + m.b ** 2 + m.h ** 2, end] : [m.a ** 2 + m.b ** 2 + m.h ** 2, end];
    case 'box-height': return [m.a * m.b, end];
    case 'cube-volume': return [m.a ** 2, end];
    case 'cube-edge': case 'volume-scale': case 'surface-scale':
    case 'prism-height': case 'prism-area': case 'pyramid-from-prism':
    case 'cone-lateral-coefficient': return [end];
    case 'cube-surface': return [m.a ** 2, end];
    case 'scaled-volume': return [m.factor ** 3, end];
    case 'triangular-prism-volume': return task.steps.length === 3
      ? [m.a * m.b, m.a * m.b / 2, end] : [m.a * m.b / 2, end];
    case 'prism-lateral': return [m.sides.reduce((s, a) => s + a, 0), end];
    case 'square-pyramid-volume': return [m.a ** 2, m.a ** 2 * m.h, end];
    case 'square-pyramid-height': return [m.a ** 2, 3 * m.volume, end];
    case 'pyramid-height': case 'pyramid-area': return [3 * m.volume, end];
    case 'cylinder-volume-coefficient': return [m.r ** 2, end];
    case 'cylinder-lateral-coefficient': return [2 * m.r, end];
    case 'cylinder-surface-coefficient': return [2 * m.r ** 2, 2 * m.r * m.h, end];
    case 'cylinder-diameter-volume': return [m.diameter / 2, (m.diameter / 2) ** 2, end];
    case 'cylinder-height': return [m.r ** 2, end];
    case 'cylinder-radius': return [m.volumeCoefficient / m.h, end];
    case 'cone-volume-coefficient': return task.steps.length === 3
      ? [m.r ** 2, m.r ** 2 * m.h, end] : [m.r ** 2 * m.h, end];
    case 'cone-height-from-slant': return [m.slant ** 2 - m.r ** 2, end];
    case 'cone-slant': return [m.r ** 2 + m.h ** 2, end];
    case 'cone-surface-coefficient': return [m.r ** 2, m.r * m.slant, end];
    case 'sphere-area-coefficient': return [m.r ** 2, end];
    case 'sphere-volume-coefficient': return [m.r ** 3, 4 * m.r ** 3, end];
    case 'sphere-radius-from-area': return [m.areaCoefficient / 4, end];
    case 'sphere-diameter-area': return [m.diameter / 2, (m.diameter / 2) ** 2, end];
    case 'box-minus-cube': return [m.a * m.b * m.h, m.cut ** 3, end];
    case 'tube-coefficient': return task.steps.length === 4
      ? [m.outer ** 2, m.inner ** 2, m.outer ** 2 - m.inner ** 2, end]
      : [m.outer ** 2 - m.inner ** 2, end];
    case 'cylinder-plus-cone': return [m.r ** 2 * m.cylinderHeight, m.r ** 2 * m.coneHeight / 3, end];
    default: throw Error(`Missing step audit: ${m.kind}`);
  }
}
const close = (a, b, name) => assert.ok(Math.abs(a - b) < 1e-9, `${name}: expected ${b}, got ${a}`);

test('eight themes have 24 guided and 24 separate independent author-written tasks', () => {
  assert.equal(lessons.length, 8); assert.equal(tasks.length, 48);
  const ids = new Set(), prompts = new Set();
  for (const l of lessons) {
    assert.equal(l.group, 'stereometry'); assert.equal(l.position, 3);
    assert.ok(l.id.startsWith('stereo-') && l.model && l.intro && l.why && l.prereq.text);
    assert.equal(l.tasks.length, 6, l.id);
    for (const task of l.tasks) {
      assert.ok(!ids.has(task.id), `Duplicate task ID: ${task.id}`); ids.add(task.id);
      assert.ok(!prompts.has(task.prompt), `Duplicate statement: ${task.id}`); prompts.add(task.prompt);
      assert.ok(task.steps.length >= 1 && task.steps.length <= 5, task.id);
      assert.ok(task.diagram && task.diagram.shape && task.diagram.labels && task.explanation);
      task.steps.forEach(s => assert.ok(s.prompt && s.hint && s.why && s.focus, task.id));
    }
  }
});

test('48 final answers and every intermediate numerical step agree with independent geometry', () => {
  for (const task of tasks) {
    const result = oracle(task.meta);
    assert.ok(Number.isFinite(result) && result > 0, task.id);
    close(task.answer, result, task.id);
    const steps = chain(task);
    assert.equal(steps.length, task.steps.length, task.id);
    steps.forEach((answer, i) => close(task.steps[i].answer, answer, `${task.id} step ${i + 1}`));
    close(task.steps.at(-1).answer, task.answer, `${task.id} final step`);
  }
});

test('geometric givens are possible; diameter/radius and height/slant traps remain explicit', () => {
  for (const { id, meta: m, diagram } of tasks) {
    for (const [key, value] of Object.entries(m)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value) && value > 0, `${id}: ${key}`);
    }
    if (m.slant) assert.ok(m.slant > m.r, id);
    if (m.kind === 'tube-coefficient') assert.ok(m.outer > m.inner && m.inner > 0, id);
    if (m.kind === 'box-minus-cube') assert.ok(m.cut < Math.min(m.a, m.b, m.h), id);
    if (m.kind === 'prism-lateral') {
      assert.ok(m.sides[0] + m.sides[1] > m.sides[2], id);
      close(Math.hypot(m.sides[0], m.sides[1]), m.sides[2], id);
    }
    assert.ok(diagram.dimensions.every(n => n === null || (Number.isFinite(n) && n > 0)), id);
    if (diagram.labels.h === '?') {
      const index = ['box', 'prism'].includes(diagram.shape) ? 2 : 1;
      assert.equal(diagram.dimensions[index], null, `${id}: unknown height must not contain its answer`);
    }
    if (diagram.labels.r === '?') assert.equal(diagram.dimensions[0], null, id);
  }
  assert.equal(tasks.filter(t => t.meta.diameter).length, 2);
  const cone = lessons.find(l => l.id === 'stereo-cone');
  assert.match(cone.intro, /перпендикулярная высота/);
  assert.match(cone.intro, /образующая, наклонный отрезок/);
  assert.match(lessons.find(l => l.id === 'stereo-cylinder').why, /Диаметр вдвое больше радиуса/);
});

test('all local links exist and all task models / lesson models register without rendering', () => {
  const tree = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim().split('\n'));
  lessons.forEach(l => [l.prereq, ...l.links].forEach(link => {
    const local = link.href.split(/[?#]/)[0].replace(/^\//, '');
    assert.ok(tree.has(local) || fs.existsSync(path.join(root, local)), `${l.id}: missing ${local}`);
  }));
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/stereo-data.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/stereo-tasks.js'), 'utf8'), context);
  for (const l of lessons) {
    assert.equal(typeof context.ProfileModels[l.model], 'function', l.id);
    for (const task of l.tasks) assert.equal(typeof context.ProfileTaskModels[task.id], 'function', task.id);
  }
});

test('engine preserves the three new independent conditions after guided practice', () => {
  for (const lesson of lessons) {
    const store = new Map();
    const model = state.create([lesson], { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) });
    const guided = new Set();
    for (let i = 0; i < 3; i++) { const s = model.start(lesson.id, 'guided', true); guided.add(s.taskId); model.finish(lesson.id, 'guided', s); }
    assert.equal(guided.size, 3, lesson.id);
    const independent = new Set();
    for (let i = 0; i < 3; i++) {
      const s = model.start(lesson.id, 'independent', true);
      assert.ok(!guided.has(s.taskId) && !s.familiar, `${lesson.id}: guided task leaked into independent pool`);
      independent.add(s.taskId); model.finish(lesson.id, 'independent', s);
    }
    assert.equal(independent.size, 3); assert.equal(model.record(lesson.id).independent.length, 3);
    assert.equal(model.start(lesson.id, 'independent', true).familiar, true, 'A fourth independent task must be marked as a repeat');
  }
});

test('every task renders finite SVG; cone radius and height form a visible triangle', () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><div id="model"></div>', { runScripts: 'outside-only' });
  const { window } = dom, container = window.document.getElementById('model');
  window.eval(fs.readFileSync(path.join(root, 'ege-profil/start/stereo-data.js'), 'utf8'));
  window.eval(fs.readFileSync(path.join(root, 'ege-profil/start/stereo-tasks.js'), 'utf8'));
  const lineVector = element => {
    assert.ok(element, 'Required geometric feature is visible');
    const values = element.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.equal(values.length, 4);
    return [values[2] - values[0], values[3] - values[1]];
  };
  for (const task of tasks) {
    const dispose = window.ProfileTaskModels[task.id](container, task, { mode: 'independent', step: 0, solved: false });
    const svg = container.querySelector('svg[data-stereo-view]');
    assert.ok(svg, task.id);
    assert.equal(svg.dataset.focus, 'neutral', `${task.id}: independent view must not reveal the first solution step`);
    assert.doesNotMatch(svg.innerHTML, /NaN|Infinity|undefined/, task.id);
    assert.equal(container.querySelectorAll('[data-known-label]').length, Object.keys(task.diagram.labels).length, task.id);
    if (task.diagram.shape === 'cone' && task.diagram.labels.h && task.diagram.labels.r) {
      const r = lineVector(svg.querySelector('[data-feature="radius"]'));
      const h = lineVector(svg.querySelector('[data-feature="height"]'));
      assert.ok(Math.abs(r[0] * h[1] - r[1] * h[0]) > 100, `${task.id}: radius and height collapsed into one screen line`);
    }
    const before = svg.dataset.yaw;
    svg.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.notEqual(svg.dataset.yaw, before, `${task.id}: keyboard rotation`);
    const after = svg.dataset.yaw;
    dispose();
    svg.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(svg.dataset.yaw, after, `${task.id}: disposed controls must stop responding`);
  }
  dom.window.close();
});
