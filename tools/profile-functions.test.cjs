'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const lessons = require('../ege-profil/start/functions-data.js');
const models = require('../ege-profil/start/functions-tasks.js');
const state = require('../ege-profil/start/state.js');
const root = path.resolve(__dirname, '..');
const tasks = lessons.flatMap(l => l.tasks);
const close = (a, b, title) => assert.ok(Number.isFinite(a) && Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b)), `${title}: ${a} != ${b}`);

// These oracles start from mathematical givens, never from authored answers,
// intermediate answers, renderer functions, or formatted solution strings.
function value(m, x) {
  switch (m.kind) {
    case 'tangent': return m.value + (m.b[1] - m.a[1]) / (m.b[0] - m.a[0]) * (x - m.x0) + m.curve * (x - m.x0) * (x - m.x0);
    case 'derivative-sign': return m.coefficient * (x - m.left) * (x - m.right);
    case 'derivative-touch': return m.coefficient * (x - m.zero) ** 2;
    case 'graph-negative-count': return m.scale * x * (x * x - 3 * m.a * m.a);
    case 'derivative-quadratic': return (m.a * x + m.b) * x + m.c;
    case 'derivative-cubic': return x * (m.a * x * x + m.b);
    case 'derivative-reciprocal': return x === 0 ? NaN : m.a / x;
    case 'derivative-exponential': return m.a * Math.exp(x);
    case 'derivative-logarithm': return x > 0 ? m.a * Math.log(x) : NaN;
    case 'derivative-root': return x >= 0 ? m.a * Math.sqrt(x) : NaN;
    case 'extreme-quadratic': return m.a * x * x - 2 * m.a * m.h * x + m.a * m.h * m.h + m.k;
    case 'extreme-cubic': return x * (x * x - 3 * m.a * m.a);
    case 'line-value': return (m.a[1] * (m.b[0] - x) + m.b[1] * (x - m.a[0])) / (m.b[0] - m.a[0]);
    case 'parabola-value': return m.k + (m.py - m.k) * ((x - m.h) / (m.px - m.h)) ** 2;
    case 'hyperbola-value': return x === m.h ? NaN : m.b + (m.py - m.b) * (m.px - m.h) / (x - m.h);
    case 'exponential-value': return Math.exp(Math.log(m.base) * x) + m.shift;
    case 'logarithm-value': return x > 0 ? Math.log2(x) / Math.log2(m.base) + m.shift : NaN;
    case 'integral-line': case 'primitive-value': return m.slope * x + m.intercept;
    case 'integral-crossing': return m.slope * x - m.slope * m.zero;
    default: throw Error('Missing value oracle ' + m.kind);
  }
}
function answer(m) {
  switch (m.kind) {
    case 'tangent': return (m.b[1] - m.a[1]) / (m.b[0] - m.a[0]);
    case 'derivative-sign': {
      // Sign at points directly on each side, rather than copying the authored
      // coefficient-to-root lookup. f' goes −/+ for a minimum, +/− for maximum.
      return [m.left, m.right].find(x => m.target === 'minimum'
        ? value(m, x - .001) < 0 && value(m, x + .001) > 0
        : value(m, x - .001) > 0 && value(m, x + .001) < 0);
    }
    case 'derivative-touch': return 0;
    case 'graph-negative-count': return m.marked.filter(x => 3 * m.scale * (x * x - m.a * m.a) < 0).length;
    case 'derivative-quadratic': return 2 * m.a * m.x + m.b;
    case 'derivative-cubic': return 3 * m.a * m.x * m.x + m.b;
    case 'derivative-reciprocal': return -m.a / (m.x * m.x);
    case 'derivative-exponential': return m.a * Math.exp(m.x);
    case 'derivative-logarithm': return m.a / m.x;
    case 'derivative-root': return m.a / (2 * Math.sqrt(m.x));
    case 'extreme-quadratic': case 'extreme-cubic': {
      const critical = m.kind === 'extreme-quadratic' ? [m.h] : [-m.a, m.a];
      const candidates = [m.left, m.right, ...critical.filter(x => x > m.left && x < m.right)];
      return (m.target === 'min' ? Math.min : Math.max)(...candidates.map(x => value(m, x)));
    }
    case 'line-value': case 'parabola-value': case 'hyperbola-value': case 'exponential-value': case 'logarithm-value': return value(m, m.target);
    case 'integral-line': return (value(m, m.left) + value(m, m.right)) * (m.right - m.left) / 2;
    case 'integral-crossing': return Math.abs(value(m, m.left)) * (m.zero - m.left) / 2 + Math.abs(value(m, m.right)) * (m.right - m.zero) / 2;
    case 'primitive-value': return m.y0 + (value(m, m.x0) + value(m, m.target)) * (m.target - m.x0) / 2;
    default: throw Error('Missing answer oracle ' + m.kind);
  }
}
function chain(m) {
  const end = answer(m);
  switch (m.kind) {
    case 'tangent': return [m.b[0] - m.a[0], m.b[1] - m.a[1], end];
    case 'derivative-sign': return [m.left, m.right, end];
    case 'derivative-touch': return [m.zero, 0, end];
    case 'graph-negative-count': {
      const xs = m.marked.filter(x => 3 * m.scale * (x * x - m.a * m.a) < 0);
      return [xs.filter(x => x < 0).length, xs.filter(x => x >= 0).length, end];
    }
    case 'derivative-quadratic': return [2 * m.a, 2 * m.a * m.x, end];
    case 'derivative-cubic': return [m.x ** 2, 3 * m.a * m.x ** 2, end];
    case 'derivative-reciprocal': return [m.x ** 2, end];
    case 'derivative-exponential': return [1, end];
    case 'derivative-logarithm': return [1 / m.x, end];
    case 'derivative-root': return [Math.sqrt(m.x), 2 * Math.sqrt(m.x), end];
    case 'extreme-quadratic': return [m.h, value(m, m.left), ...(m.h > m.left && m.h < m.right ? [value(m, m.h)] : []), value(m, m.right), end];
    case 'extreme-cubic': return [m.a, value(m, m.left), value(m, m.a), value(m, m.right), end];
    case 'line-value': {
      const k = (m.b[1] - m.a[1]) / (m.b[0] - m.a[0]);
      return [m.b[0] - m.a[0], m.b[1] - m.a[1], k, m.a[1] - k * m.a[0], end];
    }
    case 'parabola-value': return [(m.px - m.h) ** 2, m.py - m.k, (m.py - m.k) / (m.px - m.h) ** 2, end];
    case 'hyperbola-value': return [m.py - m.b, m.px - m.h, (m.py - m.b) * (m.px - m.h), end];
    case 'exponential-value': return [m.py - m.shift, Math.pow(m.py - m.shift, m.target), end];
    case 'logarithm-value': return [m.py - m.shift, Math.sqrt(m.px), Math.log2(m.target) / Math.log2(Math.sqrt(m.px)), end];
    case 'integral-line': return [m.slope * m.right ** 2 / 2 + m.intercept * m.right, m.slope * m.left ** 2 / 2 + m.intercept * m.left, end];
    case 'integral-crossing': return [m.zero, Math.abs(m.slope) * (m.zero - m.left) ** 2 / 2, Math.abs(m.slope) * (m.right - m.zero) ** 2 / 2, end];
    case 'primitive-value': { const start = m.slope * m.x0 ** 2 / 2 + m.intercept * m.x0; return [start, m.y0 - start, m.slope * m.target ** 2 / 2 + m.intercept * m.target, end]; }
    default: throw Error('Missing step oracle ' + m.kind);
  }
}

test('eleven themes cover №9 and №12; every new condition has its own numerical solution', () => {
  assert.equal(lessons.length, 11); assert.equal(tasks.length, 66);
  assert.equal(lessons.filter(l => l.position === 9).length, 7);
  assert.equal(lessons.filter(l => l.position === 12).length, 4);
  assert.equal(new Set(tasks.map(t => t.id)).size, tasks.length);
  assert.equal(new Set(tasks.map(t => t.prompt)).size, tasks.length);
  lessons.forEach(l => { assert.equal(l.tasks.length, 6); assert.ok(l.intro && l.why && l.prereq.text); });
  for (const task of tasks) {
    close(task.answer, answer(task.meta), task.id);
    const expected = chain(task.meta); assert.equal(task.steps.length, expected.length, task.id);
    task.steps.forEach((step, i) => { close(step.answer, expected[i], task.id + ' step ' + i); assert.ok(step.prompt && step.hint && step.why && step.focus, task.id); });
    close(task.steps.at(-1).answer, task.answer, task.id + ' last step');
  }
});

test('definition domains, endpoint extrema, and zero derivative without an extremum are respected', () => {
  for (const t of tasks) {
    const m = t.meta;
    if (m.kind === 'tangent' || m.kind === 'line-value') assert.ok(m.b[0] > m.a[0], t.id);
    if (m.kind === 'parabola-value') assert.notEqual(m.px, m.h, t.id);
    if (m.kind === 'hyperbola-value') { assert.notEqual(m.px, m.h); assert.notEqual(m.target, m.h); assert.ok(!Number.isFinite(models.functionFor(m)(m.h))); }
    if (m.kind === 'derivative-reciprocal') assert.notEqual(m.x, 0);
    if (['logarithm-value', 'exponential-value'].includes(m.kind)) assert.ok(m.base > 0 && m.base !== 1);
    if (m.kind === 'logarithm-value') { assert.ok(m.px > 0 && m.target > 0); assert.ok(!Number.isFinite(models.functionFor(m)(0))); assert.ok(!Number.isFinite(models.functionFor(m)(-1))); }
    if (['derivative-logarithm', 'derivative-root'].includes(m.kind)) assert.ok(m.x > 0);
    if (m.kind === 'derivative-touch') { assert.equal(Math.sign(value(m, m.zero - .1)), Math.sign(value(m, m.zero + .1))); close(value(m, m.zero), 0); }
    if (m.kind.startsWith('extreme-')) {
      assert.ok(m.left < m.right);
      // Dense independent interval scan catches selecting a stationary point
      // while forgetting a larger/smaller value at an endpoint.
      for (let i = 0; i <= 2000; i++) {
        const y = value(m, m.left + (m.right - m.left) * i / 2000);
        assert.ok(m.target === 'min' ? y >= t.answer - 1e-8 : y <= t.answer + 1e-8, t.id);
      }
    }
    if (m.kind === 'integral-line') assert.ok(value(m, m.left) > 0 && value(m, m.right) > 0);
    if (m.kind === 'integral-crossing') assert.ok(m.left < m.zero && m.zero < m.right);
  }
  const outside = tasks.find(t => t.id === 'calc-extreme-5');
  assert.ok(outside.meta.h > outside.meta.right); assert.equal(outside.steps.length, 4); close(outside.answer, value(outside.meta, outside.meta.right));
  assert.ok(tasks.find(t => t.id === 'calc-special-2').steps[0].why.includes('1/3'));
  assert.ok(!lessons.find(l => l.id === 'calc-extreme').summary.includes('середину'));
});

test('drawn function equals the givens, and tangent really touches the curve', () => {
  for (const task of tasks) {
    const m = task.meta, fn = models.functionFor(m), s = models.sceneFor(task, { mode: 'independent' });
    for (let i = 0; i <= 71; i++) {
      const x = s.minX + (s.maxX - s.minX) * i / 71, expected = value(m, x);
      if (Number.isFinite(expected)) close(fn(x), expected, task.id + ' at ' + x); else assert.ok(!Number.isFinite(fn(x)), task.id);
    }
    if (m.kind === 'tangent') {
      const slope = answer(m), delta = 1e-5;
      close((fn(m.x0 + delta) - fn(m.x0 - delta)) / (2 * delta), slope, task.id + ' derivative');
      close(fn(m.x0), m.a[1] + slope * (m.x0 - m.a[0]), task.id + ' contact');
    }
    if (m.px !== undefined) close(fn(m.px), m.py, task.id + ' known point');
    if (m.kind === 'line-value') { close(fn(m.a[0]), m.a[1]); close(fn(m.b[0]), m.b[1]); }
  }
});

test('all 66 models register, render finite SVG, distinguish f from f′, and conceal helpers initially', () => {
  const dom = new JSDOM('<div id="model"></div>', { runScripts: 'outside-only' });
  const w = dom.window, container = w.document.getElementById('model');
  w.eval(fs.readFileSync(path.join(root, 'ege-profil/start/functions-data.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(root, 'ege-profil/start/functions-tasks.js'), 'utf8'));
  for (const lesson of lessons) {
    assert.equal(typeof w.ProfileModels[lesson.model], 'function', lesson.id);
    for (const task of lesson.tasks) {
      assert.equal(typeof w.ProfileTaskModels[task.id], 'function', task.id);
      const clean = w.ProfileTaskModels[task.id](container, task, { mode: 'independent' });
      assert.equal(typeof clean, 'function'); const svg = container.querySelector('svg'); assert.ok(svg, task.id);
      assert.ok(!/NaN|Infinity|undefined/.test(svg.outerHTML), task.id);
      assert.equal(container.querySelector('[data-helper]'), null, task.id);
      assert.equal(container.querySelector('[data-revealed-value]'), null, task.id);
      assert.equal(container.querySelector('details').open, false, task.id);
      assert.equal(svg.querySelectorAll('[data-given="false"]').length, 0, task.id);
      const isDerivative = ['derivative-sign', 'derivative-touch'].includes(task.meta.kind);
      assert.equal(svg.querySelector('title').textContent.includes('производная'), isDerivative, task.id);
      if (task.meta.kind.startsWith('derivative-') && !isDerivative) assert.equal(svg.querySelector('[data-curve="tangent"]'), null, task.id);
      for (let completed = 1; completed < task.steps.length; completed++) {
        const partial = models.sceneFor(task, { mode: 'guided', completed, step: completed - 1, solved: true });
        assert.equal(partial.complete, false, task.id + ' partial completion ' + completed);
        assert.ok(partial.points.every(p => p.given), task.id + ' unreached answer marker');
      }
      const helpScene = models.sceneFor(task, { mode: 'independent' }, { help: true }); assert.equal(helpScene.help, true);
      const after = models.svgFor(task, { mode: 'independent', solved: true }, {}, 'complete').svg;
      assert.ok(!/NaN|Infinity|undefined/.test(after)); clean();
    }
  }
  dom.window.close();
});

test('asymptotes split the curves; undefined logarithm and root arguments never get plotted', () => {
  for (const task of tasks) {
    const s = models.sceneFor(task, { mode: 'independent' }), segments = models.curveSegments(s, s.curves[0]);
    for (const segment of segments) {
      assert.ok(segment.length > 0);
      for (const [x, y] of segment) { assert.ok(Number.isFinite(x) && Number.isFinite(y)); if (['logarithm-value', 'derivative-logarithm'].includes(task.meta.kind)) assert.ok(x > 0); if (task.meta.kind === 'derivative-root') assert.ok(x >= 0); }
      for (const pole of s.breaks) assert.ok(segment.every(p => p[0] < pole) || segment.every(p => p[0] > pole), task.id + ' curve crosses asymptote ' + pole);
    }
    if (['hyperbola-value', 'derivative-reciprocal'].includes(task.meta.kind)) assert.equal(segments.length, 2, task.id);
  }
});

test('independent assistance is recorded on reveal, survives visible helper state, and handlers clean up', () => {
  const dom = new JSDOM('<div id="model"></div>', { runScripts: 'outside-only' });
  const { document, Event } = dom.window, container = document.getElementById('model');
  for (const task of tasks) {
    let helps = 0;
    const cleanup = models.render(container, task, { mode: 'independent', onHelp: () => helps++ });
    assert.equal(helps, 0);
    const button = container.querySelector('button'), details = container.querySelector('details'), slider = container.querySelector('input');
    button.click(); assert.equal(helps, 1, task.id); assert.equal(button.getAttribute('aria-pressed'), 'true'); assert.ok(container.querySelector('[data-helper]'));
    button.click(); assert.equal(helps, 1, task.id); assert.equal(button.getAttribute('aria-pressed'), 'false');
    details.open = true; details.dispatchEvent(new Event('toggle')); assert.equal(helps, 2, task.id);
    slider.value = slider.max; slider.dispatchEvent(new Event('input')); assert.ok(container.querySelector('[data-revealed-value]')); assert.ok(container.querySelector('[data-cursor]'));
    cleanup(); assert.equal(button.onclick, null); assert.equal(details.ontoggle, null); assert.equal(slider.oninput, null);
    const completed = models.render(container, task, { mode: 'independent', solved: true, onHelp: () => helps++ });
    container.querySelector('button').click(); assert.equal(helps, 2, task.id); completed();
  }
  dom.window.close();
});

test('three independent tasks in each theme have unseen conditions after all guided tasks', () => {
  lessons.forEach(lesson => {
    const store = new Map(), model = state.create([lesson], { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) });
    const guided = new Set();
    for (let i = 0; i < 3; i++) { const s = model.start(lesson.id, 'guided', true); guided.add(s.taskId); model.finish(lesson.id, 'guided', s); }
    const independent = new Set();
    for (let i = 0; i < 3; i++) { const s = model.start(lesson.id, 'independent', true); assert.ok(!guided.has(s.taskId) && !s.familiar, lesson.id); independent.add(s.taskId); model.finish(lesson.id, 'independent', s); }
    assert.equal(independent.size, 3); assert.equal(model.record(lesson.id).independent.length, 3);
  });
});
