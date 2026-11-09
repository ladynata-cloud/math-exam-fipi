'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./expression');
const M = require('./model');
const graph = (id, expression, parents = []) => ({ id, type: 'functionGraph', label: id, expression, parents });
const derived = (id, parents, branch = 0) => ({ id, type: parents.length === 1 ? 'functionRoot' : 'functionIntersection', label: id, parents, branch });
const state = objects => ({ ...M.empty(), objects });
const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(Math.abs(expected), 1e-300), `${actual} != ${expected}`);
const solutions = (f, g = '0', p = {}) => E.graphSolutions(f, p, g, p);
const xs = result => { assert.equal(result.status, 'finite'); result.roots.forEach(r => assert.equal(r.status, 'finite')); return result.roots.map(p => p.x); };

test('linear graphs: one root, constants, parallel and coincident lines', () => {
  assert.deepEqual(xs(solutions('2*x-6')), [3]);
  assert.deepEqual(xs(solutions('2*x+1', '-x+4')), [1]);
  assert.equal(solutions('2*x+1', '2*x+2').status, 'none');
  assert.equal(solutions('2*(x+1)', '2*x+2').status, 'infinite');
  assert.equal(solutions('0').status, 'infinite');
  assert.equal(solutions('5').status, 'none');
});

test('quadratic no/one/two solutions, line–parabola and parabola–parabola', () => {
  assert.deepEqual(xs(solutions('x^2-4')), [-2, 2]);
  assert.deepEqual(xs(solutions('(x-2)^2')), [2]);
  assert.equal(solutions('(x-2)^2').tangent, true);
  assert.equal(solutions('x^2+4').status, 'none');
  assert.deepEqual(xs(solutions('x^2', '2*x-1')), [1]);
  assert.deepEqual(xs(solutions('x^2', 'x+2')), [-1, 2]);
  assert.deepEqual(xs(solutions('x^2', '-x^2+8')), [-2, 2]);
  assert.deepEqual(xs(solutions('x^2+x', 'x^2+2')), [2]);
  assert.equal(solutions('x*x+1', 'x^2+1').status, 'infinite');
});

test('integer factor oracle: 441 quadratic cases with exact expected coordinates', () => {
  for (let r = -10; r <= 10; r++) for (let s = -10; s <= 10; s++) {
    const result = solutions(`(x-(${r}))*(x-(${s}))`);
    const expected = [...new Set([r, s])].sort((a, b) => a - b);
    const actual = xs(result); assert.equal(actual.length, expected.length); actual.forEach((x, i) => near(x, expected[i]));
    assert.equal(result.tangent, r === s);
  }
});

test('stable quadratic formula keeps a small root; tiny coefficients do not become zero', () => {
  const roots = xs(solutions('x^2+1e5*x+1'));
  near(roots[0], -99999.99999); near(roots[1], -0.000010000000001);
  near(roots[0] * roots[1], 1); near(roots[0] + roots[1], -1e5);
  for (const coefficient of ['1e-100', '1e-30', '1e30', '1e90']) assert.deepEqual(xs(solutions(`${coefficient}*(x^2-4)`)), [-2, 2]);
  xs(solutions('x^2-1e-100')).forEach((x, i) => near(x, i ? 1e-50 : -1e-50));
  assert.deepEqual(xs(solutions('1e-100*x-2e-100')), [2]);
  near(xs(solutions('x-1e-100'))[0], 1e-100);
});

test('exact discriminant sign does not invent tangencies, near-coincident roots are explicit', () => {
  assert.equal(solutions('(x-1)^2+1e-30').status, 'none');
  assert.equal(solutions('(x-1)^2').tangent, true);
  assert.equal(solutions('(x-1)^2-1e-30').status, 'uncertain');
  const roots = xs(solutions('(x-1)^2-1e-12'));
  near(roots[0], .999999); near(roots[1], 1.000001);
  assert.equal(solutions('x+1e-100', 'x').status, 'none');
});

test('domain is never inferred from samples or unsafe algebraic cancellation', () => {
  for (const formula of ['x/x', '(x^2-1)/(x-1)', '0*(1/x)', 'x^0', 'If(x>=0,x^2,0)', 'sqrt(x)^2', 'sin(x)', 'abs(x)', 'x^3', '1/(x-x)', 'x^-1']) {
    assert.ok(['unsupported', 'undefined'].includes(solutions(formula).status), formula);
  }
  assert.equal(solutions('x/a', '0', { a: 0 }).status, 'undefined');
  assert.deepEqual(xs(solutions('(x^2-4)/a', '0', { a: 2 })), [-2, 2]);
  assert.equal(solutions('a*x').status, 'undefined');
});

test('overflow, underflow, unresolvable and out-of-construction-range results are not plotted', () => {
  assert.equal(solutions('(1e100*10)-(1e100*10)').status, 'undefined');
  for (const formula of ['x-1e-400', 'x-(1e-100/1e100/1e100/1e100)', '(1e-100/1e100/1e100/1e100)*x']) assert.equal(solutions(formula).status, 'uncertain');
  assert.equal(solutions('x-1000001').roots[0].status, 'out-of-range');
  assert.equal(solutions('1e-100*x-1e100').roots[0].status, 'out-of-range');
  assert.equal(solutions('x+1000001', '-x+1000001').roots[0].status, 'out-of-range');
  // Algebra says x=2, but this source overflows the existing evaluator at x=2.
  assert.equal(solutions('1e100*x-1e100', '1e100').roots[0].status, 'undefined');
});

test('branch IDs survive zero/tangent/two roots and quadratic-to-linear degeneration', () => {
  const slider = { id: 'a', type: 'slider', label: 'a', parents: [], name: 'a', min: -5, max: 5, step: 1, value: 1 };
  const model = state([slider, graph('f', 'x^2+a', ['a']), derived('r0', ['f']), derived('r1', ['f'], 1), { id: 'mid', type: 'midpoint', label: 'M', parents: ['r0', 'r1'] }]);
  assert.equal(M.evaluate(model).r0.solutionStatus, 'none');
  slider.value = 0;
  let values = M.evaluate(model);
  assert.equal(values.r0.x, 0); assert.equal(values.r0.relation, 'tangent'); assert.equal(values.r1.defined, false); assert.equal(values.mid.defined, false);
  slider.value = -4;
  values = M.evaluate(model);
  assert.deepEqual([values.r0.x, values.r1.x, values.mid.x], [-2, 2, 0]);
  model.objects[1].expression = 'a*x^2+2*x-4'; slider.value = 0;
  values = M.evaluate(model); assert.equal(values.r0.x, 2); assert.equal(values.r1.solutionStatus, 'missing-branch');
  assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(model))), model);
  assert.deepEqual(M.descendants(model, 'f'), ['f', 'r0', 'r1', 'mid']);
});

test('intersection coordinates lie on both functions and derived constructions recompute', () => {
  const model = state([graph('f', 'x^2'), graph('g', 'x+2'), derived('i0', ['f', 'g']), derived('i1', ['f', 'g'], 1), { id: 'd', type: 'distance', label: 'd', parents: ['i0', 'i1'] }]);
  const values = M.evaluate(model);
  assert.deepEqual([values.i0.x, values.i0.y, values.i1.x, values.i1.y], [-1, 1, 2, 4]);
  near(values.d.value, Math.sqrt(18));
  const swapped = structuredClone(model); swapped.objects.filter(o => o.type === 'functionIntersection').forEach(o => o.parents.reverse());
  assert.deepEqual(M.evaluate(swapped), values);
  model.objects[1].expression = '-1';
  assert.equal(M.evaluate(model).d.defined, false);
  model.objects[1].expression = '0';
  assert.equal(M.evaluate(model).i0.relation, 'tangent');
});

test('strict model schema rejects forged coordinates, wrong parents, branch and forward refs', () => {
  const valid = state([graph('f', 'x^2'), derived('r', ['f'])]);
  for (const alteration of [r => r.branch = 2, r => r.x = 2, r => r.parents = ['missing'], r => r.parents = ['f', 'f'], r => r.branch = '0']) {
    const changed = structuredClone(valid); alteration(changed.objects[1]); assert.throws(() => M.normalize(changed));
  }
  assert.throws(() => M.normalize(state([{ id: 'p', type: 'point', label: '', x: 0, y: 0 }, derived('r', ['p'])])));
  assert.throws(() => M.normalize(state([derived('r', ['f']), graph('f', 'x')])));
  assert.throws(() => M.normalize(state([graph('f', 'x'), derived('r', ['f', 'f'])])));
});

test('decimal coefficient tangencies use the written mathematics, with floating drawing residual checked', () => {
  assert.deepEqual(xs(solutions('0.1*x^2+0.6*x+0.9')), [-3]);
  assert.equal(solutions('0.1*x^2+0.6*x+0.9').tangent, true);
  assert.deepEqual(xs(solutions('a*x^2+b*x+c', '0', { a: .1, b: .6, c: .9 })), [-3]);
  assert.equal(solutions('x-1e-9999999999999999999').status, 'uncertain');
  assert.equal(solutions('(9007199254740993-9007199254740992)+x').roots[0].status, 'uncertain');
});
