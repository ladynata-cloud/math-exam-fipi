'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lessons = require('../ege-profil/start/geometry-data.js');
const root = path.resolve(__dirname, '..');

// An independent oracle uses problem parameters, never authored answers or steps.
function oracle(m) {
  switch (m.kind) {
    case 'triangle-angle': return 180 - m.angles.reduce((a, b) => a + b, 0);
    case 'isosceles-base': return (180 - m.vertex) / 2;
    case 'exterior-angle': return m.exterior - m.remote;
    case 'angle-ratio': return 180 * Math.max(...m.ratio) / m.ratio.reduce((a, b) => a + b, 0);
    case 'bisector-angle': return m.a / 2 + m.b;
    case 'hypotenuse': return Math.hypot(...m.legs);
    case 'right-leg': return Math.sqrt((m.hypotenuse - m.leg) * (m.hypotenuse + m.leg));
    case 'ratio-side': return m.whole * m.ratio;
    case 'inverse-ratio-side': return m.part / m.ratio;
    case 'right-perimeter': return m.hypotenuse + m.leg + Math.sqrt(m.hypotenuse ** 2 - m.leg ** 2);
    case 'similar-side': return m.side / m.from * m.to;
    case 'similar-area': return m.area * m.to ** 2 / m.from ** 2;
    case 'similar-from-area': return m.side * Math.sqrt(m.to / m.from);
    case 'similar-split': return m.ae * m.db / m.ad;
    case 'triangle-area': return m.base * m.height / 2;
    case 'triangle-height': return m.area / (m.base / 2);
    case 'parallelogram-area': return m.base * m.height;
    case 'area-part': return m.area * m.parts[m.selected] / m.parts.reduce((a, b) => a + b, 0);
    case 'other-height': return m.base / m.other * m.height;
    case 'trapezoid-height': return Math.sqrt(m.leg ** 2 - (m.a - m.b) ** 2 / 4);
    case 'trapezoid-area': return (m.a + m.b) * Math.sqrt(4 * m.leg ** 2 - (m.a - m.b) ** 2) / 4;
    case 'rhombus-side': return Math.hypot(...m.diagonals) / 2;
    case 'trapezoid-base': return 2 * m.midline - m.base;
    case 'double-area': return 2 * m.area;
    case 'inscribed-angle': return m.arc / 2;
    case 'central-angle': return 2 * m.inscribed;
    case 'major-inscribed': return 180 - m.minor / 2;
    case 'equal-tangents': return m.a * (m.d - m.b) / (m.a - m.c) + m.b;
    case 'displacement-coordinate': return m.b[m.axis] - m.a[m.axis];
    case 'endpoint-coordinate': return m.a[m.axis] + m.v[m.axis];
    case 'startpoint-coordinate': return m.b[m.axis] - m.v[m.axis];
    case 'translated-coordinate': return m.c[m.axis] + m.b[m.axis] - m.a[m.axis];
    case 'vector-length': return Math.hypot(...m.v);
    case 'point-distance': return Math.hypot(m.b[0] - m.a[0], m.b[1] - m.a[1]);
    case 'coordinate-from-length': return m.sign * Math.sqrt(m.length ** 2 - m.other ** 2);
    case 'scaled-length': return Math.abs(m.factor) * m.length;
    case 'linear-coordinate': return m.ka * m.a[m.axis] + m.kb * m.b[m.axis];
    case 'difference-length': return Math.hypot(m.a[0] - m.b[0], m.a[1] - m.b[1]);
    case 'dot': return m.a.reduce((sum, component, i) => sum + component * m.b[i], 0);
    case 'perpendicular-x': return -m.a[1] * m.by / m.a[0];
    case 'dot-angle': return m.lengths[0] * m.lengths[1] * Math.cos(m.angle * Math.PI / 180);
    case 'cosine-from-dot': return m.dot / m.lengths[0] / m.lengths[1];
    default: throw new Error(`Missing independent oracle for ${m.kind}`);
  }
}

test('six planimetry and four vector lessons keep three unused independent variants', () => {
  assert.equal(lessons.length, 10);
  assert.equal(lessons.filter(l => l.group === 'geometry').length, 6);
  assert.equal(lessons.filter(l => l.group === 'vectors').length, 4);
  const ids = new Set(), prompts = new Set();
  lessons.forEach(lesson => {
    assert.equal(lesson.tasks.length, 6, lesson.id);
    assert.ok(lesson.intro && lesson.why && lesson.prereq.text && lesson.prereq.href);
    const guided = new Set(lesson.tasks.slice(0, -3).map(t => t.id));
    lesson.tasks.slice(-3).forEach(task => assert.ok(!guided.has(task.id)));
    lesson.tasks.forEach(task => {
      assert.ok(!ids.has(task.id), `duplicate ID ${task.id}`); ids.add(task.id);
      assert.ok(!prompts.has(task.prompt), `duplicate prompt ${task.id}`); prompts.add(task.prompt);
      assert.equal(typeof task.answer, 'number');
      assert.ok(Number.isFinite(task.answer));
      assert.ok(task.steps.length >= 2 && task.steps.length <= 4);
      task.steps.forEach(step => {
        assert.ok(step.prompt && step.hint && step.why);
        assert.ok(typeof step.answer === 'number' ? Number.isFinite(step.answer) : step.choices.includes(step.answer));
      });
      assert.ok(task.explanation && task.meta);
    });
  });
  assert.equal(ids.size, 60);
});

test('all 60 final answers agree with independent geometry and coordinate formulae', () => {
  lessons.flatMap(l => l.tasks).forEach(task => {
    const expected = oracle(task.meta);
    assert.ok(Number.isFinite(expected), `invalid parameters: ${task.id}`);
    assert.ok(Math.abs(task.answer - expected) < 1e-9, `${task.id}: expected ${expected}, got ${task.answer}`);
  });
});

test('geometry is nondegenerate and sign/arc cases include meaningful traps', () => {
  const tasks = lessons.flatMap(l => l.tasks);
  tasks.forEach(({ id, meta: m }) => {
    if (m.kind === 'triangle-angle') assert.ok(m.angles.every(a => a > 0) && m.angles.reduce((a, b) => a + b) < 180, id);
    if (m.kind === 'right-leg' || m.kind === 'right-perimeter') assert.ok(m.hypotenuse > m.leg && m.leg > 0, id);
    if (m.kind.startsWith('trapezoid-') && 'leg' in m) assert.ok(m.a > m.b && m.b > 0 && m.leg > (m.a - m.b) / 2, id);
    if (m.kind === 'perpendicular-x') assert.notEqual(m.a[0], 0);
    if (m.kind === 'cosine-from-dot') assert.ok(Math.abs(oracle(m)) <= 1, id);
    if (m.kind === 'coordinate-from-length') assert.ok(m.length > Math.abs(m.other) && Math.abs(m.sign) === 1, id);
  });
  assert.ok(tasks.some(t => t.meta.kind === 'major-inscribed' && t.answer > 90));
  assert.ok(tasks.some(t => t.meta.kind === 'scaled-length' && t.meta.factor < 0 && t.answer > 0));
  assert.ok(tasks.some(t => t.meta.kind === 'dot' && t.answer < 0));
  assert.match(lessons.find(l => l.id === 'vec-dot').intro, /0° ≤ φ/);
});

test('all repair and continuation routes exist; all five labs register without side effects', () => {
  lessons.forEach(lesson => {
    [lesson.prereq, ...lesson.links].forEach(link => {
      assert.ok(link.href.startsWith('/'), `${lesson.id}: local route required`);
      const local = link.href.split(/[?#]/)[0].replace(/^\//, '');
      assert.ok(fs.existsSync(path.join(root, local)), `${lesson.id}: missing ${local}`);
    });
  });
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/geometry-models.js'), 'utf8'), context);
  assert.equal(Object.keys(context.ProfileModels).length, 5);
  lessons.forEach(lesson => assert.equal(typeof context.ProfileModels[lesson.model], 'function', lesson.id));
});
