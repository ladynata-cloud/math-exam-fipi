'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const M = require('./models.js').math;

test('open and closed interval endpoints, reversed bounds and singleton', () => {
  assert.equal(M.intervalContains(-2, -2, 3, false, true), false);
  assert.equal(M.intervalContains(-2, -2, 3, true, false), true);
  assert.equal(M.intervalContains(3, -2, 3, true, false), false);
  assert.equal(M.intervalContains(3, -2, 3, false, true), true);
  assert.equal(M.intervalContains(2, 2, 2, true, true), true);
  for (const left of [false, true]) for (const right of [false, true]) {
    if (!(left && right)) assert.equal(M.intervalContains(2, 2, 2, left, right), false);
    for (const x of [-9, 0, 3, 8]) assert.equal(M.intervalContains(x, 4, -4, left, right), false);
  }
  assert.equal(M.intervalContains(NaN, 0, 1, true, true), false);
});

test('linear equations preserve roots under allowed transformations and classify zero coefficients', () => {
  assert.deepEqual(M.linearSolution(0, 3, 3), { type: 'all' });
  assert.deepEqual(M.linearSolution(0, 3, -3), { type: 'none' });
  assert.deepEqual(M.linearSolution(3, 1, 2), { type: 'one', x: 1 / 3 });
  assert.deepEqual(M.linearSolution(NaN, 1, 2), { type: 'invalid' });
  for (let a = -4; a <= 4; a++) for (let b = -3; b <= 3; b++) for (let c = -3; c <= 3; c++) {
    if (!a) continue;
    const { x } = M.linearSolution(a, b, c);
    assert.ok(Math.abs(a * x + b - c) < 1e-10);
    assert.ok(Math.abs(a * x - (c - b)) < 1e-10);
  }
});

test('function formulas retain the chosen piecewise endpoint and parity', () => {
  assert.equal(M.functionValue('piecewise', -0.5), 0.5);
  assert.equal(M.functionValue('piecewise', 0), 1);
  assert.equal(M.functionValue('piecewise', 0.5), 1.5);
  assert.equal(M.functionValue('proportional', 0, -3, 20), 0);
  for (let x = -6; x <= 6; x += 0.5) {
    assert.equal(M.functionValue('square', -x), M.functionValue('square', x));
    assert.equal(M.functionValue('cube', -x) + M.functionValue('cube', x), 0);
  }
  assert.equal(M.functionValue('unknown', 2), null);
  assert.equal(M.functionValue('linear', Infinity, 2, 3), null);
});

test('natural powers distinguish negative bases from a leading minus', () => {
  assert.equal(M.naturalPower(-2, 4), 16);
  assert.equal(M.naturalPower(-2, 3), -8);
  assert.equal(M.naturalPower(0, 3), 0);
  assert.equal(M.naturalPower(2, 0), null);
  assert.equal(M.naturalPower(2, 1.5), null);
  for (const a of [-3, -1, 0, 1, 2]) for (const p of [1, 2, 3]) for (const q of [1, 2, 3]) {
    assert.equal(M.naturalPower(a, p) * M.naturalPower(a, q), M.naturalPower(a, p + q));
    assert.equal(M.naturalPower(M.naturalPower(a, p), q), M.naturalPower(a, p * q));
  }
});

test('prime factorization reconstructs each number and never labels one as prime', () => {
  assert.deepEqual(M.primeFactors(1), []);
  assert.equal(M.primeFactors(0), null);
  assert.equal(M.primeFactors(2.5), null);
  assert.deepEqual(M.primeFactors(84), [2, 2, 3, 7]);
  assert.deepEqual(M.primeFactors(97), [97]);
  for (let value = 2; value <= 100; value++) {
    const f = M.primeFactors(value);
    assert.equal(f.reduce((a, b) => a * b, 1), value);
    for (const p of f) for (let d = 2; d < p; d++) assert.notEqual(p % d, 0);
  }
});

test('Euclidean remainder stays nonnegative and below its positive divisor', () => {
  assert.deepEqual(M.euclideanDivision(30, 7), { q: 4, r: 2 });
  assert.deepEqual(M.euclideanDivision(-10, 3), { q: -4, r: 2 });
  assert.deepEqual(M.euclideanDivision(0, 3), { q: 0, r: 0 });
  assert.equal(M.euclideanDivision(5, 0), null);
  assert.equal(M.euclideanDivision(5, -2), null);
  for (let a = -100; a <= 100; a++) for (let b = 1; b <= 12; b++) {
    const { q, r } = M.euclideanDivision(a, b);
    assert.equal(b * q + r, a); assert.ok(r >= 0 && r < b);
  }
});

test('polynomial coefficients reproduce products even when middle terms cancel', () => {
  assert.deepEqual(M.polynomialProduct(1, -3, 1, 3), [1, 0, -9]);
  assert.deepEqual(M.polynomialProduct(-2, 3, 0, 4), [0, -8, 12]);
  for (const [a, b, c, d] of [[1, -3, 1, 3], [-2, 3, 4, -5], [0, 0, 1, 2], [2, 0, -3, 4]]) {
    const coeffs = M.polynomialProduct(a, b, c, d);
    for (let x = -5; x <= 5; x += 0.5) assert.equal(coeffs[0] * x * x + coeffs[1] * x + coeffs[2] + 0, (a * x + b) * (c * x + d) + 0);
  }
});

test('binomial rows and signed expansions agree with ordinary powers', () => {
  assert.deepEqual(M.binomialCoefficients(0), [1]);
  assert.deepEqual(M.binomialCoefficients(5), [1, 5, 10, 10, 5, 1]);
  assert.equal(M.binomialCoefficients(-1), null);
  for (let p = 0; p <= 8; p++) for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) {
    assert.equal(M.binomialValue(a, b, p), (a + b) ** p);
  }
});

test('systems distinguish a unique point, a line, the plane and contradictions', () => {
  assert.deepEqual(M.solveSystem(1, 1, 3, 1, -1, 1), { type: 'one', x: 2, y: 1 });
  assert.deepEqual(M.solveSystem(1, 2, 3, 2, 4, 6), { type: 'line' });
  assert.deepEqual(M.solveSystem(1, 2, 3, 2, 4, 7), { type: 'none' });
  assert.deepEqual(M.solveSystem(0, 0, 0, 0, 0, 0), { type: 'all' });
  assert.deepEqual(M.solveSystem(0, 0, 1, 0, 0, 0), { type: 'none' });
  assert.deepEqual(M.solveSystem(0, 0, 0, 0, 2, 4), { type: 'line' });
  const s = M.solveSystem(2, -3, 7, 4, 1, 2);
  assert.ok(Math.abs(2 * s.x - 3 * s.y - 7) < 1e-10);
  assert.ok(Math.abs(4 * s.x + s.y - 2) < 1e-10);
});

test('strict half-planes exclude their boundary and clipping preserves all constraints', () => {
  assert.equal(M.halfplaneContains(1, 1, 3, 1, 2, '≤'), true);
  assert.equal(M.halfplaneContains(1, 1, 3, 1, 2, '<'), false);
  assert.equal(M.halfplaneContains(-1, 0, 2, -3, 5, '≥'), true);
  const square = [[-8, -8], [8, -8], [8, 8], [-8, 8]];
  assert.deepEqual(M.clipHalfplane(square, 0, 0, 0, '<'), []);
  assert.deepEqual(M.clipHalfplane(square, 0, 0, 0, '≤'), square);
  for (const [a, b, c, sign] of [[1, 1, 3, '≤'], [-1, 0, 2, '≥'], [0, 2, 4, '≤'], [0, 0, -1, '≤']]) {
    const clipped = M.clipHalfplane(square, a, b, c, sign);
    for (const [x, y] of clipped) assert.equal(M.halfplaneContains(a, b, c, x, y, sign), true);
    const intersection = M.clipHalfplane(clipped, 0, 1, 0, '≥');
    for (const [x, y] of intersection) { assert.ok(y >= 0); assert.equal(M.halfplaneContains(a, b, c, x, y, sign), true); }
  }
});

if (process.argv.includes('--dom')) test('every topic model mounts, changes all controls and cleans up without runtime errors', () => {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const errors = [], virtualConsole = new VirtualConsole(); virtualConsole.on('jsdomError', e => errors.push(e));
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="host"></div></body></html>', { runScripts: 'outside-only', virtualConsole });
  const w = dom.window; w.eval(fs.readFileSync(__dirname + '/models.js', 'utf8'));
  const host = w.document.getElementById('host'); let mounts = 0, changes = 0;
  const modelFor = p => [1, 4, 11].includes(p) ? 'numberline' : [2, 3, 5, 6].includes(p) ? 'expression' : p <= 10 ? 'equation' : (p <= 17 || p === 23) ? 'function' : p <= 22 ? 'power' : [24, 31].includes(p) ? 'divisibility' : p <= 30 ? 'polynomial' : p <= 39 ? 'identity' : p <= 45 ? 'system' : 'halfplane';
  const inspect = () => {
    assert(!/NaN|Infinity|undefined/.test(host.textContent), host.textContent);
    assert(host.querySelector('.m7-result').textContent.length > 20);
    for (const node of host.querySelectorAll('svg *')) for (const attr of node.attributes) assert(!/NaN|Infinity/.test(attr.value), attr.value);
    for (const label of host.querySelectorAll('label')) assert(w.document.getElementById(label.htmlFor), label.outerHTML);
  };
  for (let order = 1; order <= 46; order++) {
    const cleanup = w.MakarychevModels.mount(host, { order, model: modelFor(order), title: 'Тема ' + order }); mounts++; inspect();
    for (const select of Array.from(host.querySelectorAll('select'))) for (const option of Array.from(select.options)) {
      select.value = option.value; select.dispatchEvent(new w.Event('change', { bubbles: true })); changes++; inspect();
    }
    for (const input of host.querySelectorAll('input[type="range"]')) for (const value of [input.min, input.max, (Number(input.min) + Number(input.max)) / 2]) {
      input.value = value; input.dispatchEvent(new w.Event('input', { bubbles: true })); changes++; inspect();
    }
    for (const button of host.querySelectorAll('button')) { button.click(); changes++; inspect(); }
    cleanup(); assert.equal(host.childElementCount, 0);
  }
  assert.equal(w.document.querySelectorAll('#makarychev7-model-styles').length, 1);
  assert.equal(errors.length, 0, errors.map(e => e.stack).join('\n'));
  dom.window.close(); console.log(JSON.stringify({ modelDOM: 'PASS', mounts, changes }));
});
