'use strict';

/* Independent mathematical contract checks. The assertions below use the
 * original logarithms, separate domain formulae and analytic equality cases,
 * rather than reconstructing an answer from the trainer's sign table. */
const assert = require('node:assert/strict');

function independentAst(node, x) {
  assert(node && typeof node.op === 'string', 'AST node is required');
  if (node.op === 'num') return node.value;
  if (node.op === 'var') return x;
  const a = (node.args || []).map(child => independentAst(child, x));
  switch (node.op) {
    case 'add': return a.reduce((s, v) => s + v, 0);
    case 'sub': return a[0] - a[1];
    case 'mul': return a.reduce((s, v) => s * v, 1);
    case 'div': return a[0] / a[1];
    case 'pow': return a[0] ** a[1];
    case 'log': return a[0] > 0 && a[0] !== 1 && a[1] > 0 ? Math.log(a[1]) / Math.log(a[0]) : NaN;
    case 'abs': return Math.abs(a[0]);
    case 'sqrt': return Math.sqrt(a[0]);
    default: assert.fail(`Unknown mathematical AST operator: ${node.op}`);
  }
}

function originalLog(base, argument) {
  return base > 0 && base !== 1 && argument > 0 ? Math.log(argument) / Math.log(base) : NaN;
}

function closeEnough(actual, expected, label) {
  assert(Number.isFinite(actual) && Number.isFinite(expected), `${label}: non-finite ${actual}/${expected}`);
  assert(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(actual), Math.abs(expected)), `${label}: ${actual} != ${expected}`);
}

function relationHolds(value, relation) {
  switch (relation) {
    case '>': case 'gt': return value > 0;
    case '>=': case '≥': case 'ge': return value >= 0;
    case '<': case 'lt': return value < 0;
    case '<=': case '≤': case 'le': return value <= 0;
    default: assert.fail(`Unknown comparison ${relation}`);
  }
}

// The engine import and family-specific oracles are intentionally supplied
// below when the public task contract is available.

const equal = (x, y) => Math.abs(x - y) <= 16 * Number.EPSILON * Math.max(1, Math.abs(x), Math.abs(y));
const gt = (x, y) => x > y && !equal(x, y);
const lt = (x, y) => x < y && !equal(x, y);
const ne = (x, y) => !equal(x, y);
const logarithm = (base, argument) => originalLog(base, argument);

// Each oracle states the mathematical source expression independently of the
// engine AST. Equality points come from exact algebra, not a floating point
// tolerance applied to a near-zero logarithm.
function oracle(task, x) {
  const p = task.params;
  const t = x - p.h;
  let domain, value, zeros = [], boundaries = [];
  switch (task.familyId) {
    case 'sign': {
      domain = gt(t, 0) && ne(t, 1) && gt(t + p.a, 0);
      value = logarithm(t, (t + p.a) / p.b);
      zeros = [p.b - p.a]; boundaries = [-p.a, 0, 1, ...zeros];
      break;
    }
    case 'compare': {
      const A = t + p.c, B = A + (t - p.r) * (t - p.s);
      domain = gt(A, 0) && ne(A, 1) && gt(B, 0);
      value = logarithm(A, B) - 1;
      zeros = [p.r, p.s]; boundaries = [-p.c, 1 - p.c, ...zeros];
      // The authored variants deliberately make B positive everywhere.
      assert((1 - p.r - p.s) ** 2 - 4 * (p.c + p.r * p.s) < 0, `${task.id}: B not globally positive`);
      break;
    }
    case 'multiplier': {
      domain = gt(t + p.a, 0) && ne(t + p.a, 1);
      value = (t - p.r) * logarithm(t + p.a, (t - p.b) ** 2 + 1);
      zeros = [p.r, p.b]; boundaries = [-p.a, 1 - p.a, ...zeros];
      break;
    }
    case 'reciprocal': {
      const B = p.B ?? p.r + (p.r + p.a) ** 2;
      domain = gt(t + p.a, 0) && ne(t + p.a, 1) && gt(B - t, 0) && ne(B - t, 1);
      const z = logarithm(t + p.a, B - t);
      value = z + 4 / z - 4;
      // z+4/z−4=(z−2)²/z. Its only zeros solve B−t=(t+a)².
      zeros = [p.r, -p.r - 2 * p.a - 1];
      boundaries = [-p.a, 1 - p.a, B - 1, B, ...zeros];
      break;
    }
    case 'log-denominator': {
      const v = t - p.d, base = p.c - t;
      domain = gt(v, 0) && gt(base, 0) && ne(base, 1) && ne(v, p.q ** p.m);
      value = logarithm(base, v ** 2) / (logarithm(p.q, v) - p.m);
      zeros = [p.d - 1, p.d + 1];
      boundaries = [p.d, p.c, p.c - 1, p.d + p.q ** p.m, ...zeros];
      break;
    }
    case 'chain': {
      const D = p.D ?? p.r + p.s, E = p.E ?? -p.r * p.s;
      domain = gt(p.a - t, 0) && ne(p.a - t, 1) && gt(t + p.b, 0) && ne(t + p.b, 1) && ne(t, 0) && gt(t + p.c, 0) && ne(t + p.c, 1) && gt(D * t + E, 0);
      value = logarithm(p.a - t, t + p.b) * logarithm(t + p.b, t ** 2) - logarithm(p.a - t, t + p.c) * logarithm(t + p.c, D * t + E);
      zeros = [p.r, p.s];
      boundaries = [p.a, p.a - 1, -p.b, 1 - p.b, 0, -p.c, 1 - p.c, -E / D, ...zeros];
      break;
    }
    case 'collect': {
      const Q = (t - p.u) * (t - p.v);
      domain = gt(p.a - t, 0) && ne(p.a - t, 1) && gt(Q, 0);
      value = (t - p.r) * (1 / logarithm(p.a - t, p.q) + logarithm(p.s, Q) + 1 + logarithm(1 / p.q, p.q * (p.a - t)) + t) + t - t ** 2 + p.r * (p.r - 1);
      const disc = Math.sqrt((p.u - p.v) ** 2 + 4 * p.s ** (p.r - 1));
      zeros = [p.r, (p.u + p.v - disc) / 2, (p.u + p.v + disc) / 2];
      boundaries = [p.a, p.a - 1, p.u, p.v, ...zeros];
      break;
    }
    case 'modulus': {
      const y = Math.abs(t), D = p.p * (y - p.u) * (y - p.v);
      const b = p.b ?? p.p * (p.r + p.s - p.u - p.v);
      assert(p.r * p.s === p.u * p.v && b > 0, `${task.id}: modulus construction identity`);
      domain = gt(y, 0) && ne(y, 1) && gt(D, 0);
      value = logarithm(y, b / D) + 1;
      zeros = [-p.r, p.r, -p.s, p.s];
      boundaries = [-p.u, p.u, -p.v, p.v, -1, 0, 1, ...zeros];
      break;
    }
    case 'powers': {
      domain = gt(t, 0) && ne(t, 1) && gt(t + p.a, 0) && ne(t, p.b);
      value = logarithm(Math.sqrt(t), t + p.a) - logarithm(t ** 2, (t + p.a) ** 2 * (t - p.b) ** 2);
      zeros = [(p.b - p.a) / 2];
      boundaries = [0, 1, -p.a, p.b, ...zeros];
      break;
    }
    case 'quadratic-log': {
      const a = p.a ?? p.r * (p.r - 1);
      domain = gt(t, 0) && ne(t, 1) && gt(t + a, 0);
      const z = logarithm(t, t + a);
      value = z ** 2 - 3 * z + 2;
      zeros = [p.r, 1 - p.r]; boundaries = [0, 1, -a, ...zeros];
      break;
    }
    case 'nested': {
      assert(p.m > p.k && p.k > 1, `${task.id}: nested parameters`);
      domain = gt(t, 0) && ne(t, 1) && (lt(t, 1 / p.k) || gt(t, 1));
      value = logarithm(logarithm(t, p.k * t), p.m * t);
      zeros = [1 / p.m]; boundaries = [0, 1, 1 / p.k, ...zeros];
      break;
    }
    case 'exponential-denominator': {
      domain = gt(t, 0) && ne(t, 1) && gt(p.a * t - p.b, 0) && gt(p.c - t, 0) && ne(t ** 2 - p.S * t, p.R);
      value = (logarithm(t, p.a * t - p.b) * logarithm(t, p.c - t) + 1 - logarithm(t, (p.a * t - p.b) * (p.c - t))) / (p.q ** (t ** 2 - p.S * t) - p.q ** p.R);
      zeros = [p.b / (p.a - 1), p.c / 2];
      const disc = Math.sqrt(p.S ** 2 + 4 * p.R);
      boundaries = [0, 1, p.b / p.a, p.c, (p.S - disc) / 2, (p.S + disc) / 2, ...zeros];
      break;
    }
    default: assert.fail(`Unreviewed family: ${task.familyId}`);
  }
  const isZero = domain && zeros.some(v => equal(t, v));
  return { domain, value: isZero ? 0 : value, rawValue: value, isZero, boundaries: boundaries.map(v => v + p.h) };
}

function probesForCell(points, index) {
  if (index % 2) return [points[(index - 1) / 2]];
  const i = index / 2, left = i ? points[i - 1] : -Infinity, right = i < points.length ? points[i] : Infinity;
  if (!Number.isFinite(left)) return [right - .001, right - .1, right - 1, right - 10, right - 100, right - 10000];
  if (!Number.isFinite(right)) return [left + .001, left + .1, left + 1, left + 10, left + 100, left + 10000];
  return [.001, .1, .25, .5, .75, .9, .999].map(f => left + (right - left) * f);
}

function conditionHolds(condition, x) {
  const a = independentAst(condition.left, x), b = independentAst(condition.right, x);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (condition.op === 'gt') return gt(a, b);
  if (condition.op === 'lt') return lt(a, b);
  if (condition.op === 'ne') return ne(a, b);
  assert.fail(`Unknown domain condition ${condition.op}`);
}

function checkSetFormatting(engine) {
  const task = { criticalPoints: [
    { value: -2, label: '−2' }, { value: 0, label: '0' }, { value: 3, label: '3' }
  ] };
  const compact = cells => engine.formatSet(task, cells.map(Boolean)).replace(/\s/g, '');
  assert.equal(compact([0, 0, 0, 0, 0, 0, 0]), '∅');
  assert.equal(compact([1, 1, 1, 1, 1, 1, 1]), '(−∞;+∞)');
  assert.equal(compact([0, 1, 1, 1, 1, 1, 0]), '[−2;3]', 'connected cells and both endpoints form one interval');
  assert.equal(compact([0, 1, 1, 1, 0, 0, 0]), '[−2;0]', 'two included endpoints must not create redundant singleton sets');
  assert.equal(compact([0, 0, 1, 0, 0, 0, 0]), '(−2;0)');
  assert.equal(compact([0, 0, 0, 1, 0, 0, 0]), '{0}', 'an isolated equality is a singleton');
  assert.equal(compact([0, 1, 0, 1, 0, 1, 0]), '{−2}∪{0}∪{3}');
  assert.equal(compact([1, 1, 1, 0, 1, 1, 1]), '(−∞;0)∪(0;+∞)', 'a forbidden point keeps the two intervals disconnected');
  assert.equal(compact([1, 0, 0, 0, 1, 1, 0]), '(−∞;−2)∪(0;3]');
  assert.throws(() => engine.formatSet(task, [true]), /cells/);
  assert.equal(engine.formatNumber(1 / 3), '1/3');
  assert.equal(engine.formatNumber(-5 / 2), '−5/2');
  assert.equal(engine.formatNumber(-0), '0');
  assert.equal(engine.getTask('not-a-task'), null);
}

function runMathematicalContract(engine) {
  assert.equal(engine.families.length, 12, 'twelve instructional families');
  assert.equal(engine.tasks.length, 48, 'four different authored variants per family');
  assert.equal(new Set(engine.tasks.map(t => t.id)).size, 48, 'task identities');
  assert.equal(new Set(engine.tasks.map(t => t.formulaText.replace(/\s+/g, ''))).size, 48, 'original conditions must differ');
  let probes = 0, equalityCases = 0, excludedPoints = 0, distractorCounterexamples = 0;
  for (const family of engine.families) {
    const tasks = engine.tasks.filter(t => t.familyId === family.id);
    assert.equal(tasks.length, 4, `${family.id}: variants`);
    assert.deepEqual(tasks.map(t => t.variant).sort(), [0, 1, 2, 3]);
  }
  for (const task of engine.tasks) {
    assert.equal(engine.getTask(task.id)?.id, task.id, `${task.id}: identity lookup`);
    assert(task.formulaHtml.includes('<math'), `${task.id}: semantic math required`);
    assert(task.metadata.originalAst && task.metadata.rationalAst, `${task.id}: mathematical source metadata`);
    assert(task.domainChoices.some(c => c.correct), `${task.id}: original domain requirements`);
    assert.equal(task.transformChoices.filter(c => c.correct).length, 1, `${task.id}: one equivalent transformation`);
    const points = task.criticalPoints.map(p => p.value), cellCount = 2 * points.length + 1;
    assert(points.every(Number.isFinite), `${task.id}: finite partition boundaries`);
    assert(points.every((p, i) => !i || p > points[i - 1]), `${task.id}: sorted distinct partition boundaries`);
    for (const array of [task.domainCells, task.rationalSigns, task.solutionCells]) assert.equal(array.length, cellCount, `${task.id}: partition dimensions`);
    const witnesses = new Map(task.transformChoices.filter(c => !c.correct).map(c => [c.id, false]));
    const domainWitnesses = new Map(task.domainChoices.filter(c => !c.correct).map(c => [c.id, false]));
    for (let cell = 0; cell < cellCount; cell++) {
      for (const x of probesForCell(points, cell)) {
        probes++;
        const label = `${task.id} cell ${cell}, x=${x}`;
        const expected = oracle(task, x);
        const original = engine.evaluateOriginal(task, x);
        assert.equal(task.metadata.domainConditions.every(c => conditionHolds(c, x)), expected.domain, `${label}: original domain formulae`);
        assert.equal(task.domainChoices.filter(c => c.correct).every(c => conditionHolds(c.condition, x)), expected.domain, `${label}: domain choices jointly describe the exact original domain`);
        if (expected.domain) for (const choice of task.domainChoices.filter(c => !c.correct)) {
          if (!conditionHolds(choice.condition, x)) domainWitnesses.set(choice.id, true);
        }
        assert.equal(original.defined, expected.domain, `${label}: original logarithm domain`);
        assert.equal(task.domainCells[cell], expected.domain, `${label}: domain atom`);
        const selected = expected.domain && relationHolds(expected.value, task.relation);
        assert.equal(task.solutionCells[cell], selected, `${label}: solution atom from original expression`);
        if (!expected.domain) {
          assert.equal(task.rationalSigns[cell], null, `${label}: no sign claimed outside domain`);
          if (cell % 2) excludedPoints++;
          continue;
        }
        assert(Number.isFinite(expected.value), `${label}: finite direct original expression`);
        closeEnough(original.value, expected.rawValue, `${label}: public original evaluator`);
        closeEnough(independentAst(task.metadata.originalAst, x), expected.rawValue, `${label}: independently evaluated original AST`);
        const rational = engine.evaluateRational(task, x);
        assert(rational.defined && Number.isFinite(rational.value), `${label}: equivalent expression defined on original domain`);
        const wantedSign = expected.isZero ? 0 : Math.sign(expected.value);
        assert.equal(task.rationalSigns[cell], wantedSign, `${label}: sign from original logarithms`);
        if (!expected.isZero) assert.equal(Math.sign(rational.value), wantedSign, `${label}: rationalized expression sign`);
        else {
          equalityCases++;
          assert(Math.abs(expected.rawValue) < 1e-8, `${label}: analytically proved equality agrees numerically`);
        }
        for (const choice of task.transformChoices) {
          assert(choice.ast, `${task.id}: transformation choices require verifiable expression`);
          const v = independentAst(choice.ast, x);
          const actual = Number.isFinite(v) && relationHolds(equal(v, 0) && expected.isZero ? 0 : v, task.relation);
          if (choice.correct) assert.equal(actual, selected, `${label}: correct transformation choice`);
          else if (actual !== selected) witnesses.set(choice.id, true);
        }
      }
    }
    for (const [id, found] of domainWitnesses) {
      assert(found, `${task.id}/${id}: wrong domain requirement must exclude an actually permissible x`);
    }
    for (const [id, found] of witnesses) {
      assert(found, `${task.id}/${id}: alleged wrong transformation has no counterexample on the original domain`);
      distractorCounterexamples++;
    }
    // A missing critical point is only acceptable when it is redundant: its
    // deletion must not hide a domain hole, an equality, or a sign transition.
    for (const boundary of oracle(task, 0).boundaries) {
      if (points.some(p => equal(p, boundary))) continue;
      const delta = 1e-4 * Math.max(1, Math.abs(boundary));
      const states = [boundary - delta, boundary, boundary + delta].map(x => {
        const result = oracle(task, x);
        return `${result.domain}/${result.domain && relationHolds(result.value, task.relation)}`;
      });
      assert(new Set(states).size === 1, `${task.id}: omitted relevant boundary ${boundary}: ${states}`);
    }
    assert.equal(engine.formatSet(task, task.solutionCells), task.answerText, `${task.id}: canonical answer formatting`);
  }
  assert(equalityCases > 50, 'boundary equality checks must cover all families');
  assert(excludedPoints > 100, 'original domain holes must be exercised');
  return { probes, equalityCases, excludedPoints, distractorCounterexamples };
}

const engine = require('../trainers/ege-profile/log-inequalities/engine.js');
checkSetFormatting(engine);
const result = runMathematicalContract(engine);
console.log('PROFILE_LOG_INEQUALITIES_MATH_OK: ' + JSON.stringify(result));
