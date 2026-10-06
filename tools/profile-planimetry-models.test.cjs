/* Regression checks against the geometry in the actual rendered SVG.
 * No browser/DOM dependency: the small DOM double only captures output nodes. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
class Node {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.children = []; this.style = {}; this.dataset = {}; this.handlers = {}; this.textContent = ''; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  append(...nodes) { nodes.forEach(n => { n.parentNode = this; this.children.push(n); }); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(n => n !== this); }
  addEventListener(event, f) { this.handlers[event] = f; }
  removeEventListener(event, f) { if (this.handlers[event] === f) delete this.handlers[event]; }
  click() { this.handlers.click?.(); }
}
const all = (node, tag) => node.children.flatMap(n => [ ...(n.tagName === tag || !tag ? [n] : []), ...all(n, tag)]);
const document = { createElement: n => new Node(n), createElementNS: (_, n) => new Node(n) };
const root = path.resolve(__dirname, '..');
const sandbox = vm.createContext({ document });
vm.runInContext(fs.readFileSync(path.join(root, 'ege-profil/start/planimetry-tasks.js'), 'utf8'), sandbox);
const tasks = require('../ege-profil/start/geometry-data.js').filter(l => l.group === 'geometry').flatMap(l => l.tasks);
const models = sandbox.ProfileTaskModels;
assert.equal(tasks.length, 36); assert.equal(Object.keys(models).length, 36);
const near = (actual, expected, title) => assert.ok(Math.abs(actual - expected) < 1e-7, `${title}: ${actual} ≠ ${expected}`);
const length = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const angle = (o, a, b) => Math.acos(Math.max(-1, Math.min(1, ((a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1])) / length(o, a) / length(o, b)))) * 180 / Math.PI;
const polygon = n => n.attrs.points.split(' ').map(p => p.split(',').map(Number));
const area = p => Math.abs(p.reduce((sum, v, i) => { const w = p[(i + 1) % p.length]; return sum + v[0] * w[1] - v[1] * w[0]; }, 0)) / 2;
function render(id, ctx = {}) { const task = tasks.find(t => t.id === id), host = new Node('div'), cleanup = models[id](host, task, ctx); return { host, task, cleanup, polygons: all(host, 'polygon').map(polygon), lines: all(host, 'line').map(n => [[+n.attrs.x1, +n.attrs.y1], [+n.attrs.x2, +n.attrs.y2]]) }; }
for (const task of tasks) {
  let helped = 0;
  const { host, cleanup } = render(task.id, { mode: 'independent', onHelp: () => helped++ });
  assert.equal(all(host, 'svg')[0].attrs['aria-label'], task.prompt);
  for (const node of all(host)) for (const v of Object.values(node.attrs)) assert.ok(!/NaN|Infinity|undefined/.test(v), task.id);
  const givenNumbers = new Set(task.prompt.match(/\d+(?:[,.]\d+)?/g));
  for (const text of all(host, 'text')) for (const n of text.textContent.match(/\d+(?:[,.]\d+)?/g) || []) assert.ok(givenNumbers.has(n), task.id + ' must not print a calculated number: ' + n);
  const buttons = all(host, 'button'); assert.ok(buttons.length >= 1 && buttons.length <= 2, task.id);
  for (const button of buttons) {
    assert.equal(button.type, 'button'); assert.equal(button.getAttribute('aria-pressed'), 'false');
    const count = helped; button.click(); assert.equal(helped, count + 1, task.id + ' help must be recorded'); assert.equal(button.getAttribute('aria-pressed'), 'true');
    button.click(); assert.equal(helped, count + 1, task.id + ' closing is not another hint'); assert.equal(button.getAttribute('aria-pressed'), 'false');
  }
  assert.ok(all(host, 'p').some(n => n.textContent.includes('подсказка')), task.id);
  cleanup(); assert.equal(host.children.length, 0, task.id + ' cleanup');
  buttons.forEach(b => assert.equal(b.handlers.click, undefined));
  for (const context of [{ mode: 'guided' }, { mode: 'independent', solved: true }]) { let count = 0; const r = render(task.id, { ...context, onHelp: () => count++ }); all(r.host, 'button').forEach(b => b.click()); assert.equal(count, 0); r.cleanup(); }
}
// All six angle conditions, including the important distinct interior/exterior arcs.
for (const [id, a, b] of [['sum', 48, 67], ['isosceles', 38, 71], ['exterior', 49, 75], ['ratio', 40, 60], ['bisector', 64, 46], ['parallel', 73, 58]]) {
  const [A, B, C] = render('geo-angles-' + id).polygons[0]; near(angle(A, B, C), a, id + ' angle A'); near(angle(B, A, C), b, id + ' angle B');
}
{ const r = render('geo-angles-bisector'), [A, B, C] = r.polygons[0], D = r.lines[0][1]; near(angle(A, B, D), angle(A, D, C), 'bisector halves'); near(angle(D, A, C), 78, 'target ADC'); }
// Pythagoras and the sine/cosine/tangent must refer to the shown angle.
for (const [id, ratio] of [['hypotenuse', 9 / 12], ['leg', 8 / 15], ['sine', 7 / 24], ['cosine', 9 / 12], ['tangent', 2.5], ['perimeter', 5 / 12]]) {
  const [O, R, T] = render('geo-right-' + id).polygons[0]; near(angle(O, R, T), 90, id + ' right angle'); near(length(O, T) / length(O, R), ratio, id + ' proportions');
}
for (const [id, k] of [['side', 2.5], ['perimeter', 2.4], ['area', 2.5], ['from-area', 2.5]]) {
  const [small, big] = render('geo-similarity-' + id).polygons; near(area(big) / area(small), k * k, id + ' area scale'); near(length(big[0], big[1]) / length(small[0], small[1]), k, id + ' length scale');
}
{ const [A, B, C] = render('geo-similarity-side').polygons[0]; near(length(B, C) / length(A, B), 8 / 6, 'given BC and AB'); }
for (const [id, base, height] of [['triangle', 14, 9], ['height', 12, 7], ['exterior-height', 16, 5]]) {
  const [A, B, C] = render('geo-area-' + id).polygons[0]; near(2 * area([A, B, C]) / length(B, C) ** 2, height / base, id + ' base-height ratio');
  if (id === 'exterior-height') assert.ok(A[0] < B[0], 'height foot is outside segment BC');
}
{ const p = render('geo-quad-rectangle').polygons[0]; for (let i = 0; i < 4; i++) near(angle(p[i], p[(i + 3) % 4], p[(i + 1) % 4]), 90, 'rectangle corner'); near(length(p[0], p[1]) / length(p[1], p[2]), 24 / 7, 'rectangle ratio'); }
for (const [id, a, b, leg] of [['trapezoid', 22, 12, 13], ['trapezoid-area', 18, 6, 10]]) { const [A, B, C, D] = render('geo-quad-' + id).polygons[0]; near(length(D, C) / length(A, B), b / a, id + ' bases'); near(length(A, D) / length(A, B), leg / a, id + ' leg'); near(length(A, D), length(B, C), id + ' equal legs'); }
{ const [A, B, C, D] = render('geo-quad-rhombus').polygons[0]; near(length(A, C) / length(B, D), 24 / 10, 'rhombus diagonals'); near(length(A, B), length(B, C), 'rhombus equal sides'); }
for (const [id, target, major] of [['inscribed', 56, false], ['central', 37, false], ['major-arc', 112, true]]) {
  const r = render('geo-circle-' + id), [CA, CB] = r.lines, C = CA[0], A = CA[1], B = CB[1]; near(angle(C, A, B), target, id + ' inscribed angle');
  const highlight = all(r.host, 'g').find(n => n.attrs['data-model-layer']); const arc = all(highlight, 'path')[0]; assert.ok(arc.attrs.d.includes(` 0 ${major ? 1 : 0} 0 `), id + ' correct arc');
}
{ const [A, B, C] = render('geo-circle-diameter').polygons[0]; near(angle(C, A, B), 90, 'diameter subtends right angle'); near(length(A, C) / length(A, B), 12 / 20, 'diameter given lengths'); }
{ const r = render('geo-circle-tangent'), [OT, TP, OP] = r.lines; near(angle(OT[1], OT[0], TP[1]), 90, 'radius perpendicular to tangent'); near(length(...OT) / length(...OP), 7 / 25, 'radius and hypotenuse ratio'); }
{ const r = render('geo-circle-two-tangents'), [PA, PB] = r.lines; near(length(...PA), length(...PB), 'two equal tangents'); const c = all(r.host, 'circle')[0], O = [+c.attrs.cx, +c.attrs.cy]; near(angle(PA[1], O, PA[0]), 90, 'first actual tangent'); near(angle(PB[1], O, PB[0]), 90, 'second actual tangent'); }
console.log('PROFILE_PLANIMETRY_MODELS_OK: 36 task drawings, geometry, controls, help accounting, cleanup');
