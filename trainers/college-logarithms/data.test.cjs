'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./data.js');

// These final-answer fixtures were solved separately from the bank builders.
// They supplement numerical substitution/interval sampling below: neither the
// engine's checker nor a data.js evaluator is used as the mathematical oracle.
const I = (lo, hi, loClosed = false, hiClosed = false) => ({lo, hi, loClosed, hiClosed});
const point = (x, y) => ({x, y});
const finalAnswers = {
  diagnostic: [8, 1, 1 / 4, 9, 4, 2],
  meaning: [3, 2, 0, 1, -3, 1 / 2],
  domain: ['positive', 'positive', I(3, null), I(null, 5), I(-2, null), I(null, 3 / 2)],
  product: [5, 2, 2, 3, 2, 2],
  powers: [6, 6, -2, 7, 1 / 2, 'no'],
  'change-base': [2, 2 / 3, 1 / 2, -3, 2, 1 / 2],
  'graph-up': [1, 'up', I(0, null), 'negative', 'no', 0],
  'graph-down': ['down', 'positive', I(0, null), 'up', 'greater', 'ox'],
  'graph-moves': [point(3, 0), point(-1, 0), point(1, 2), point(1, -1), point(2, -1), point(2, 1)],
  equations: [8, 10, -1, 5, 1 / 2, 4],
  'equal-logs': [4, 4, 2, 4, 3, 'none'],
  'property-equations': [8, 18, 3, 3, 4, 3],
  inequalities: [I(2, null), I(1, 10, false, true), I(-2, -1), I(0, 1 / 2), I(1, 3), I(1, null, true, false)],
  base: [5, -3, 0, 2, 5, 3, 3, 5, 13, 3, 8, 1],
  profile: [-1 / 2, 4, 2, -1, 6, 7, 5, 9 / 2, 2, -1, 4, -2]
};
const close = (actual, expected, label) => assert.ok(
  Number.isFinite(actual) && Number.isFinite(expected) &&
    Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(actual), Math.abs(expected)),
  `${label}: ${actual} != ${expected}`
);
const answerEqual = (actual, expected, label) => {
  if (typeof expected === 'number') close(actual, expected, label);
  else assert.deepEqual(actual, expected, label);
};

function evaluate(expression, x) {
  if (typeof expression === 'number') return expression;
  assert.ok(expression && typeof expression === 'object', 'well-formed numeric descriptor');
  switch (expression.op) {
    case 'variable': return x;
    case 'log': {
      const base = evaluate(expression.base, x), value = evaluate(expression.value, x);
      if (!(base > 0) || base === 1 || !(value > 0)) return NaN;
      return Math.log(value) / Math.log(base);
    }
    case 'power': return evaluate(expression.base, x) ** evaluate(expression.exponent, x);
    case 'add': return evaluate(expression.left, x) + evaluate(expression.right, x);
    case 'subtract': return evaluate(expression.left, x) - evaluate(expression.right, x);
    case 'multiply': return evaluate(expression.left, x) * evaluate(expression.right, x);
    case 'divide': return evaluate(expression.left, x) / evaluate(expression.right, x);
    default: assert.fail(`Unknown mathematical descriptor ${expression.op}`);
  }
}
function accepts(condition, x) {
  if (condition.all) return condition.all.every(c => accepts(c, x));
  const left = evaluate(condition.left, x), right = evaluate(condition.right, x);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  // At an exact mathematical boundary Math.log can have tiny rounding noise.
  const difference = Math.abs(left - right) < 1e-11 ? 0 : left - right;
  switch (condition.relation) {
    case '>': return difference > 0;
    case '<': return difference < 0;
    case '>=': return difference >= 0;
    case '<=': return difference <= 0;
    default: assert.fail(`Unknown comparison ${condition.relation}`);
  }
}
function member(set, x) {
  return (set.lo === null || x > set.lo || set.loClosed && x === set.lo) &&
    (set.hi === null || x < set.hi || set.hiClosed && x === set.hi);
}
function checkInterval(set, condition, label) {
  assert.ok(set.lo === null || Number.isFinite(set.lo));
  assert.ok(set.hi === null || Number.isFinite(set.hi));
  assert.equal(typeof set.loClosed, 'boolean');
  assert.equal(typeof set.hiClosed, 'boolean');
  if (set.lo === null) assert.equal(set.loClosed, false, 'infinity cannot be included');
  if (set.hi === null) assert.equal(set.hiClosed, false, 'infinity cannot be included');
  if (set.lo !== null && set.hi !== null) assert.ok(set.lo < set.hi, 'ordered nonempty interval');
  const samples = [-1e6, -100, -10, -1e-6, -1e-7, 0, 1e-7, 1e-6, 1 / 3, 100, 1e6];
  for (let i = -160; i <= 160; i++) samples.push(i / 8);
  for (const edge of [set.lo, set.hi]) {
    if (edge === null) continue;
    const epsilon = 1e-6 * Math.max(1, Math.abs(edge));
    samples.push(edge, edge - epsilon, edge + epsilon, edge - 0.25, edge + 0.25);
  }
  for (const x of samples) assert.equal(member(set, x), accepts(condition, x), `${label}, x=${x}`);
}
function model(p, x) {
  return x > p.h ? p.sign * Math.log(x - p.h) / Math.log(p.base) + p.k : NaN;
}

test('102 tasks in 15 ordered modules; 6 diagnostic + 72 learning + 24 assessment', () => {
  assert.deepEqual(D.modules.map(m => m.id), Object.keys(finalAnswers));
  assert.equal(D.tasks.length, 102);
  assert.equal(new Set(D.tasks.map(t => t.id)).size, 102);
  for (const m of D.modules) {
    assert.equal(D.tasks.filter(t => t.moduleId === m.id).length, finalAnswers[m.id].length, m.id);
    assert.ok(m.title && m.summary && m.lessonHtml);
    assert.ok(['diagnostic', 'learn', 'base', 'profile'].includes(m.kind));
  }
  assert.equal(D.modules.filter(m => m.kind === 'learn').length, 12);
  assert.equal(D.tasks.reduce((n, t) => n + t.steps.length, 0), 236);
  assert.equal(D.getTask('unknown'), null);
  assert.equal(D.getModule('unknown'), null);
});

test('Every step has an unambiguous prompt, stable ID, supported answer and explanatory feedback', () => {
  for (const t of D.tasks) {
    assert.equal(D.getTask(t.id), t);
    assert.ok(t.title && t.promptHtml && t.promptText, t.id);
    assert.ok(t.steps.length > 0, t.id);
    assert.deepEqual(t.steps.map(s => s.id), t.steps.map((_, i) => `s${i + 1}`), t.id);
    for (const s of t.steps) {
      const label = `${t.id}/${s.id}`;
      assert.ok(s.prompt && s.explanation, label);
      assert.ok(['choice', 'number', 'interval', 'point', 'transform'].includes(s.kind), label);
      if (D.getModule(t.moduleId).kind === 'learn') assert.ok(s.hint, label + ' contextual hint');
      if (s.kind === 'number') assert.ok(Number.isFinite(s.answer), label);
      if (s.kind === 'choice') {
        assert.ok(s.options.length >= 3, label);
        assert.equal(new Set(s.options.map(o => o.value)).size, s.options.length, label);
        assert.equal(new Set(s.options.map(o => o.labelHtml)).size, s.options.length, label + ' distinct visible choices');
        assert.equal(s.options.filter(o => o.value === s.answer).length, 1, label + ' one correct option');
        for (const o of s.options) assert.ok(o.value && o.labelHtml, label);
      }
      if (s.kind === 'point') {
        assert.ok(Number.isFinite(s.answer.x) && Number.isFinite(s.answer.y), label);
        assert.ok(s.promptHtml.includes('x = '), label + ' fixed abscissa visible');
      }
    }
  }
});

test('Choice positions vary deterministically and assessments use one short-answer step', () => {
  const positions = new Set();
  for (const t of D.tasks) {
    for (const s of t.steps.filter(s => s.kind === 'choice')) positions.add(s.options.findIndex(o => o.value === s.answer));
    if (D.getModule(t.moduleId).kind !== 'learn') {
      assert.equal(t.steps.length, 1, t.id);
      assert.equal(t.steps[0].kind, 'number', t.id);
      assert.equal(t.steps[0].hint, '', t.id);
    } else assert.ok(t.steps.length >= 2, t.id + ' guided sequence');
  }
  assert.ok(positions.size >= 3, 'correct choices do not always occupy one position');
  assert.ok(D.tasks.filter(t => t.moduleId === 'profile').every(t => t.steps[0].kind !== 'interval'));
});

test('Authored mathematical HTML uses horizontal fractions and does not contain executable markup', () => {
  const html = D.modules.map(m => m.lessonHtml).concat(D.tasks.flatMap(t => [t.promptHtml,
    ...t.steps.flatMap(s => [s.promptHtml || '', s.hint || '', s.explanation, ...(s.options || []).map(o => o.labelHtml)])]));
  for (const content of html) {
    assert.doesNotMatch(content, /<\s*(script|iframe|object|embed)\b|javascript:|\bon\w+\s*=/i);
    assert.doesNotMatch(content, /\d\s*\/\s*\d/, 'visible ordinary fractions need a bar');
  }
  assert.ok(html.filter(h => h.includes('class="fraction"')).length > 25, 'fraction examples are present');
});

test('Trusted bank round-trips as JSON without losing finite mathematical values', () => {
  const visit = value => {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    else assert.ok(['string', 'boolean', 'undefined'].includes(typeof value) || value === null);
  };
  visit(D.tasks);
  assert.deepEqual(JSON.parse(JSON.stringify(D.tasks)), D.tasks);
});

for (const t of D.tasks) {
  test(`Independent mathematics: ${t.id}`, () => {
    const index = Number(t.id.slice(t.id.lastIndexOf('-') + 1)) - 1;
    answerEqual(t.steps.at(-1).answer, finalAnswers[t.moduleId][index], t.id + ' final fixture');
    for (const check of t.audit.checks) {
      const s = t.steps.find(step => step.id === check.step);
      assert.ok(s, t.id + ' audit refers to an existing step');
      const label = `${t.id}/${s.id}`;
      switch (check.type) {
        case 'value':
          close(s.answer, evaluate(check.expression), label);
          break;
        case 'equation': {
          const left = evaluate(check.left, s.answer), right = evaluate(check.right, s.answer);
          close(left, right, label + ' satisfies the original equation and domains');
          for (const x of t.excludedCandidates || []) {
            const l = evaluate(check.left, x), r = evaluate(check.right, x);
            assert.ok(!Number.isFinite(l) || !Number.isFinite(r) || Math.abs(l - r) > 1e-8,
              `${label}: extraneous candidate ${x} must fail the original equation`);
          }
          break;
        }
        case 'set':
          checkInterval(s.answer, check.condition, label);
          break;
        case 'point': {
          const p = t.targetGraph || t.graph;
          assert.ok(p && s.answer.x > p.h, label + ' point lies in domain');
          close(s.answer.y, model(p, s.answer.x), label + ' point lies on graph');
          break;
        }
        case 'transform':
          assert.deepEqual(s.answer, t.targetGraph, label);
          break;
        default:
          assert.fail('unknown audit type ' + check.type);
      }
    }
  });
}

const lb = (base, x) => x > 0 ? Math.log(x) / Math.log(base) : NaN;
// These graph functions are written directly from the printed conditions.
const graphOracles = {
  'graph-up-01': x => lb(2, x), 'graph-up-02': x => lb(3, x),
  'graph-up-03': x => lb(4, x), 'graph-up-04': x => lb(2, x),
  'graph-up-05': x => lb(3, x), 'graph-up-06': x => lb(5, x),
  'graph-down-01': x => lb(1 / 2, x), 'graph-down-02': x => lb(1 / 3, x),
  'graph-down-03': x => lb(1 / 4, x), 'graph-down-04': x => lb(1 / 2, x),
  'graph-down-05': x => lb(1 / 3, x), 'graph-down-06': x => -lb(2, x),
  'graph-moves-01': x => lb(2, x - 2), 'graph-moves-02': x => lb(2, x + 2),
  'graph-moves-03': x => lb(3, x) + 2, 'graph-moves-04': x => lb(2, x) - 1,
  'graph-moves-05': x => -lb(2, x), 'graph-moves-06': x => lb(1 / 2, x - 1) + 1,
  'inequalities-01': x => lb(2, x), 'inequalities-02': x => lb(3, x - 1),
  'inequalities-03': x => lb(2, x + 2), 'inequalities-04': x => lb(1 / 2, x),
  'inequalities-05': x => lb(1 / 2, x - 1), 'inequalities-06': x => lb(1 / 3, x + 2),
  'profile-09': x => lb(2, x - 2), 'profile-10': x => lb(3, x) - 1,
  'profile-11': x => lb(4, x), 'profile-12': x => lb(1 / 2, x - 1)
};
test('All 28 graph models agree with separately written formulas, including forbidden x', () => {
  assert.deepEqual(D.tasks.filter(t => t.graph).map(t => t.id), Object.keys(graphOracles));
  const xs = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.125, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 9, 10, 16];
  for (const [id, reference] of Object.entries(graphOracles)) {
    const t = D.getTask(id), p = t.targetGraph || t.graph;
    assert.ok(p.base > 0 && p.base !== 1 && [1, -1].includes(p.sign), id);
    assert.ok(p.h >= -2 && p.h <= 2 && p.k >= -2 && p.k <= 2, id);
    for (const x of xs) {
      const actual = model(p, x), expected = reference(x);
      if (Number.isNaN(expected)) assert.ok(Number.isNaN(actual), `${id}, forbidden x=${x}`);
      else close(actual, expected, `${id}, x=${x}`);
    }
    for (const pt of t.graph.points) close(pt.y, model(t.graph, pt.x), id + ' plotted source point');
  }
});

test('Transformation targets are deliberate horizontal/vertical/reflection changes', () => {
  const targets = [
    {base: 2, h: 2, k: 0, sign: 1}, {base: 2, h: -2, k: 0, sign: 1},
    {base: 3, h: 0, k: 2, sign: 1}, {base: 2, h: 0, k: -1, sign: 1},
    {base: 2, h: 0, k: 0, sign: -1}, {base: 1 / 2, h: 1, k: 1, sign: 1}
  ];
  for (let i = 0; i < targets.length; i++) {
    const t = D.getTask(`graph-moves-0${i + 1}`);
    assert.deepEqual(t.targetGraph, targets[i]);
    assert.deepEqual(t.steps.find(s => s.kind === 'transform').answer, targets[i]);
    assert.equal(t.graph.h, 0); assert.equal(t.graph.k, 0); assert.equal(t.graph.sign, 1);
    assert.notDeepEqual(t.targetGraph, {base: t.graph.base, h: 0, k: 0, sign: 1});
  }
});

test('Graph construction reveals work progressively; four graph assessments provide exact source points', () => {
  for (const t of D.tasks.filter(t => ['graph-up', 'graph-down'].includes(t.moduleId))) {
    assert.equal(t.graph.showCurve, false, t.id);
    assert.notEqual(t.graph.revealPoints, true, t.id);
    assert.equal(t.steps.filter(s => s.kind === 'point').length, 3, t.id);
  }
  for (const t of D.tasks.filter(t => t.moduleId === 'profile' && t.graph)) {
    assert.equal(t.graph.revealPoints, true, t.id);
    assert.equal(t.graph.showCurve, true, t.id);
    assert.ok(t.graph.points.length >= 3, t.id);
  }
});

test('Known traps: argument zero, base one, negative argument, extraneous candidates and decreasing inequalities', () => {
  assert.ok(Number.isNaN(evaluate({op: 'log', base: 2, value: 0})));
  assert.ok(Number.isNaN(evaluate({op: 'log', base: 2, value: -1})));
  assert.ok(Number.isNaN(evaluate({op: 'log', base: 1, value: 2})));
  assert.ok(Number.isNaN(evaluate({op: 'log', base: -2, value: 4})));
  assert.ok(Number.isNaN(evaluate({op: 'log', base: 0, value: 2})));
  assert.equal(D.getTask('powers-06').steps.at(-1).answer, 'no');
  assert.ok(Number.isFinite(lb(2, (-3) ** 2)));
  assert.ok(Number.isNaN(2 * lb(2, -3)));

  // 3x-1=x-3 yields -1 but both original logarithms are undefined.
  assert.equal(3 * (-1) - 1, (-1) - 3);
  assert.ok(Number.isNaN(lb(2, 3 * (-1) - 1)));
  assert.ok(Number.isNaN(lb(2, -1 - 3)));
  assert.equal(D.getTask('equal-logs-06').steps.at(-1).answer, 'none');

  // Products at excluded roots are positive: losing the individual domains
  // would incorrectly retain them even though each logarithm is undefined.
  assert.equal((-2) * (-2 - 2), 8);
  assert.equal((-1) * (-1 - 2), 3);
  assert.ok(Number.isNaN(lb(2, -2) + lb(2, -4)));
  assert.ok(Number.isNaN(lb(3, -1) + lb(3, -3)));

  const decreasing = D.getTask('inequalities-05').steps.at(-1).answer;
  assert.equal(member(decreasing, 1), false);
  assert.equal(member(decreasing, 2), true);
  assert.equal(member(decreasing, 3), false);
  assert.equal(member(decreasing, 4), false);
  assert.ok(lb(1 / 2, 2 - 1) > -1);
  assert.ok(!(lb(1 / 2, 4 - 1) > -1));
  const inclusive = D.getTask('inequalities-06').steps.at(-1).answer;
  assert.equal(member(inclusive, 1), true);
  assert.equal(member(inclusive, 0), false);
  assert.equal(member(inclusive, -2), false);
});

test('The six inequality graphs show the actual comparison level', () => {
  const levels = [1, 2, 0, 1, -1, -1];
  for (let i = 0; i < levels.length; i++) {
    const t = D.getTask(`inequalities-0${i + 1}`);
    assert.equal(t.graph.guideY, levels[i]);
    const x = t.steps.find(s => s.kind === 'number').answer;
    close(model(t.graph, x), levels[i], t.id + ' boundary matches drawn horizontal line');
  }
});
