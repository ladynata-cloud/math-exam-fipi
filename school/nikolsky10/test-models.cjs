'use strict';
const assert = require('node:assert/strict');
const M = require('./models.js');
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
assert.equal(M.factorial(0), 1); assert.equal(M.factorial(8), 40320); assert.ok(Number.isNaN(M.factorial(-1)));
assert.equal(M.choose(6, 2), 15); assert.equal(M.choose(6, 7), 0); assert.equal(M.choose(8, 0), 1);
for (let n = 1; n <= 10; n++) for (let t = 0; t <= 10; t++) {
  const p = t / 10, dist = M.binomial(n, p);
  assert.equal(dist.length, n + 1); near(dist.reduce((a, b) => a + b, 0), 1);
  near(dist.reduce((sum, prob, k) => sum + prob * k, 0), n * p);
  assert.ok(dist.every(v => v >= 0 && v <= 1));
}
assert.deepEqual(M.binomial(3, 0), [1, 0, 0, 0]); assert.deepEqual(M.binomial(3, 1), [0, 0, 0, 1]);
assert.equal(M.root(-16, 2), null); near(M.root(-27, 3), -3); assert.equal(M.root(0, 6), 0);
assert.equal(M.logarithm(0, 2), null); assert.equal(M.logarithm(3, 1), null); near(M.logarithm(8, 2), 3); near(M.logarithm(4, .5), -2);
assert.equal(M.trigValue('tan', Math.PI / 2), null); assert.equal(M.trigValue('cot', 0), null);
for (const kind of ['tan', 'cot']) {
  const lo = -2 * Math.PI, hi = 2 * Math.PI, poles = M.poles(kind, lo, hi), segments = M.curveSegments(x => M.trigValue(kind, x), lo, hi, poles, 4, 720);
  assert.ok(segments.length >= 4);
  for (const segment of segments) {
    assert.ok(segment.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(y) <= 4));
    for (const p of poles) assert.ok(!segment.some(v => v[0] < p) || !segment.some(v => v[0] > p), 'Curve crosses a pole');
  }
}
for (const kind of ['sin', 'cos']) for (let t = -4; t <= 4; t++) {
  const a = t / 4, roots = M.trigRoots(kind, a);
  assert.ok(roots.length >= 2 && roots.length <= 5);
  roots.forEach(x => { near(M.trigValue(kind, x), a); assert.ok(x >= -2 * Math.PI - 1e-9 && x <= 2 * Math.PI + 1e-9); });
  assert.equal(new Set(roots.map(x => x.toFixed(8))).size, roots.length);
}
assert.deepEqual(M.trigRoots('sin', 2), []); assert.equal(M.trigRoots('sin', 0).length, 5);
near(M.conditional(3, 5, true), 2 / 7); near(M.conditional(3, 5, false), 3 / 7); assert.equal(M.conditional(0, 3, true), null);
const lengths = [10, 11, 9, 8, 5, 6, 8, 6, 7, 4, 9, 2, 2, 3];
let count = 0;
lengths.forEach((length, i) => { for (let j = 1; j <= length; j++) { assert.ok(M.modelFor({ section: `${i + 1}.${j}` })); count++; } });
assert.equal(count, 90);
console.log('Model calculations passed: 90 topic routes, 110 binomial distributions, real-root/log domains, trig poles/roots, conditional probability.');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (_) { console.log('Model DOM pass not run: jsdom is not installed.'); }
if (JSDOM) {
  const dom = new JSDOM('<div id="host"></div>'), host = dom.window.document.getElementById('host');
  lengths.forEach((length, i) => { for (let j = 1; j <= length; j++) {
    const cleanup = M.mount(host, { section: `${i + 1}.${j}` });
    assert.equal(typeof cleanup, 'function'); assert.ok(host.querySelector('svg')); assert.ok(host.querySelector('[role="status"]').textContent.length > 8);
    for (const input of host.querySelectorAll('input')) {
      assert.ok(host.querySelector(`label[for="${input.id}"]`));
      for (const value of [input.min, input.max]) { input.value = value; input.dispatchEvent(new dom.window.Event('input')); assert.ok(!/NaN|undefined|Infinity/.test(host.textContent)); }
    }
    for (const select of host.querySelectorAll('select')) for (const option of select.options) { select.value = option.value; select.dispatchEvent(new dom.window.Event('change')); assert.ok(!/NaN|undefined|Infinity/.test(host.textContent)); }
    for (const attr of host.querySelectorAll('svg *')) assert.ok(!/NaN|Infinity/.test(attr.outerHTML));
    cleanup(); assert.equal(host.children.length, 0);
  } });
  dom.window.close(); console.log('Model DOM pass: all 90 topics, every control boundary, cleanup.');
}
