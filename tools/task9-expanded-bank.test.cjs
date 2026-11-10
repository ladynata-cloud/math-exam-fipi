'use strict';

// Exact, independent audit of the expanded №9 bank. Polynomial coefficients
// are expanded algebraically below, not taken from taskNorm/reveal.vals.
// Root answers are additionally checked by the separate interpolation oracle.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const kinds = ['linear-transfer', 'linear-one-bracket', 'linear-two-brackets', 'quad-square', 'quad-factor-x', 'quad-monic', 'quad-nonmonic'];
const snapshot = value => createHash('sha256').update(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v)).digest('hex');
let m, oracle, trainer, bank, fixture;
before(async () => {
  m = await import('./oge-algebra-contract.lib.mjs');
  oracle = await import('./oge-algebra-contract.t9.mjs');
  trainer = m.loadTrainer('trainers/oge-task9-equations.html');
  bank = trainer.run('EXAM_BANK');
  fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/task9-expanded-bank.json'), 'utf8'));
});

const q = value => typeof value === 'object' && value !== null && 'n' in value ? m.R(value.n, value.d) : m.parseNum(String(value).replace(/^\+/, ''));
const zeroPoly = () => [m.ZERO, m.ZERO, m.ZERO]; // constant, x, x²
const plusPoly = (left, right) => left.map((v, i) => m.add(v, right[i]));
const scalePoly = (poly, factor) => poly.map(value => m.mul(value, factor));
function polynomial(terms, fromFixture = false) {
  return terms.reduce((sum, term) => {
    let part;
    if ((!fromFixture && term.br) || (fromFixture && term.terms)) {
      const coefficient = q(fromFixture ? term.coefficient : term.br.k);
      const inner = fromFixture ? term.terms : term.br.inner;
      part = scalePoly(polynomial(inner, fromFixture), coefficient);
    } else {
      const power = fromFixture ? term.power : term.x;
      assert.ok(Number.isInteger(power) && power >= 0 && power <= 2, 'supported polynomial term');
      part = zeroPoly();
      part[power] = q(fromFixture ? term.coefficient : term.c);
      assert.ok(part[power], 'valid exact coefficient');
    }
    return plusPoly(sum, part);
  }, zeroPoly());
}
function normalized(task) {
  const left = polynomial(task.p.Lt), right = polynomial(task.p.Rt);
  return left.map((value, i) => m.sub(value, right[i]));
}
function equivalentKey(poly) {
  const lead = [...poly].reverse().find(value => !m.isZero(value));
  assert.ok(lead, 'nondegenerate equation');
  return poly.map(value => m.str(m.div(value, lead))).join(':');
}
function valueAt(poly, root) {
  return m.add(poly[0], m.add(m.mul(poly[1], root), m.mul(poly[2], m.mul(root, root))));
}
function decimalIsFinite(value) {
  let denominator = value.d;
  for (const prime of [2n, 5n]) while (denominator % prime === 0n) denominator /= prime;
  return denominator === 1n;
}
function equationText(poly) {
  const pieces = [];
  for (let power = 2; power >= 0; power--) {
    const value = poly[power];
    if (m.isZero(value)) continue;
    const suffix = power === 2 ? 'x^2' : power === 1 ? 'x' : '';
    const body = m.str(value) + suffix;
    pieces.push((pieces.length && value.n > 0n ? '+' : '') + body);
  }
  return (pieces.join('') || '0') + '=0';
}
function parseSimpleEquation(raw) {
  const sides = String(raw).replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(/²/g, '^2').split('=');
  assert.equal(sides.length, 2, 'one equals sign in revealed polynomial');
  function side(rawSide) {
    const result = zeroPoly();
    const terms = rawSide.match(/[+-]?[^+-]+/g) || [];
    assert.equal(terms.join(''), rawSide);
    for (const term of terms) {
      const match = term.match(/^([+-]?(?:(?:\d+(?:[.,]\d+)?)|(?:\d+\/\d+))?)(x(?:\^2)?)?$/);
      assert.ok(match, 'plain polynomial term: ' + term);
      const coefficient = /^(?:|\+|-)$/.test(match[1]) ? m.R(match[1] === '-' ? -1 : 1) : q(match[1]);
      const power = match[2] === 'x^2' ? 2 : match[2] === 'x' ? 1 : 0;
      result[power] = m.add(result[power], coefficient);
    }
    return result;
  }
  const left = side(sides[0]), right = side(sides[1]);
  return left.map((value, i) => m.sub(value, right[i]));
}
// Small independent parser for the fixture's human-readable equations:
// integer/decimal coefficients, x, parentheses, multiplication and x².
function parsePrintedEquation(raw) {
  const text = String(raw).replace(/[−–—]/g, '-').replace(/²/g, '^2').replace(/[,]/g, '.').replace(/[·×]/g, '*').replace(/\s+/g, '');
  const tokens = text.match(/\d+(?:\.\d+)?|x|\^|[+\-*=()]/g) || [];
  assert.equal(tokens.join(''), text, 'all printed equation tokens understood');
  let index = 0;
  function multiply(a, b) {
    const result = [m.ZERO, m.ZERO, m.ZERO, m.ZERO, m.ZERO];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) result[i + j] = m.add(result[i + j], m.mul(a[i], b[j]));
    assert.ok(m.isZero(result[3]) && m.isZero(result[4]), 'quadratic or linear expression');
    return result.slice(0, 3);
  }
  function atom() {
    if (tokens[index] === '+' || tokens[index] === '-') {
      const sign = tokens[index++];
      return scalePoly(atom(), m.R(sign === '-' ? -1 : 1));
    }
    let value;
    const token = tokens[index++];
    if (token === '(') { value = expression(); assert.equal(tokens[index++], ')'); }
    else if (token === 'x') value = [m.ZERO, m.ONE, m.ZERO];
    else { assert.match(token || '', /^\d+(?:\.\d+)?$/); value = [q(token), m.ZERO, m.ZERO]; }
    if (tokens[index] === '^') { index++; assert.equal(tokens[index++], '2'); value = multiply(value, value); }
    return value;
  }
  function product() {
    let value = atom();
    while (tokens[index] === '*' || tokens[index] === '(' || tokens[index] === 'x' || /^\d/.test(tokens[index] || '')) {
      if (tokens[index] === '*') index++;
      value = multiply(value, atom());
    }
    return value;
  }
  function expression() {
    let value = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const sign = tokens[index++], next = product();
      value = plusPoly(value, sign === '-' ? scalePoly(next, m.R(-1)) : next);
    }
    return value;
  }
  const left = expression(); assert.equal(tokens[index++], '='); const right = expression(); assert.equal(index, tokens.length);
  return left.map((value, i) => m.sub(value, right[i]));
}
const numericStep = (type, values, unordered = false) => ({ type, values, unordered });
function expectedSteps(task, method) {
  const poly = normalized(task), [c, b, a] = poly;
  const solution = oracle.answer(task), roots = solution.roots;
  assert.equal(solution.bad, undefined, task.id);
  const steps = [];
  const pick = () => numericStep('num', [solution.key]);
  if (task.fam === 'L' || task.fam === 'LB') {
    if (task.fam === 'LB') for (const side of [task.p.Lt, task.p.Rt]) {
      const brackets = side.filter(term => term.br);
      for (const term of brackets) {
        const expanded = polynomial([term]);
        steps.push(numericStep('lin2', [expanded[1], expanded[0]]));
      }
      if (brackets.length && side.length > 1) {
        const combined = polynomial(side);
        steps.push(numericStep('lin2', [combined[1], combined[0]]));
      }
    }
    steps.push(numericStep('canon', [b, m.neg(c)]), pick());
  } else if (task.fam === 'QNB') {
    steps.push(numericStep('num', [m.div(m.neg(c), a)]), numericStep('num2', roots, true), pick());
  } else if (['QNC', 'QNCm'].includes(task.fam)) {
    if (task.fam === 'QNCm') steps.push({ type: 'eqn', polynomial: poly, raw: equationText(poly) });
    steps.push(numericStep('fact', [a, b]), numericStep('num2', [m.ZERO, m.div(m.neg(b), a)], true), pick());
  } else if (task.fam === 'QF') {
    if (method === 'vieta') {
      const p = m.div(b, a), constant = m.div(c, a);
      steps.push(numericStep('num2', [p, constant]), numericStep('num2', [m.neg(p), constant]), numericStep('num2', roots, true), pick());
    } else {
      const d = m.sub(m.mul(b, b), m.mul(m.R(4), m.mul(a, c))), sqrt = m.sqrtExact(d);
      assert.ok(sqrt, task.id + ': exact square discriminant');
      steps.push(numericStep('coef3', [a, b, c]), numericStep('num', [d]), numericStep('num', [sqrt]), numericStep('num2', roots, true), pick());
    }
  } else assert.fail('Unreviewed family ' + task.fam);
  return steps;
}
function exerciseSteps(task, method) {
  const expected = expectedSteps(task, method), factories = trainer.run('taskSteps')(task, method), state = {};
  assert.equal(factories.length, expected.length, task.id + ': complete step sequence');
  for (let i = 0; i < expected.length; i++) {
    const want = expected[i], def = factories[i](state), context = task.id + ':' + (method || 'default') + ':' + (i + 1);
    assert.equal(def.ui.type, want.type, context + ': input meaning');
    assert.ok(def.q && def.hint && def.reveal.html, context + ': explanation');
    assert.doesNotMatch(def.q + def.hint + def.reveal.html, /undefined|NaN|Infinity|\[object /, context);
    const raw = want.type === 'eqn' ? [want.raw] : want.values.map(m.str);
    if (want.type === 'eqn') {
      const actual = parseSimpleEquation(def.reveal.vals[0]);
      assert.ok(actual.every((value, index) => m.eq(value, want.polynomial[index])), context + ': revealed coefficients');
    } else {
      const actual = Array.from(def.reveal.vals, q), values = [...want.values];
      if (want.unordered) { actual.sort(m.cmp); values.sort(m.cmp); }
      assert.equal(actual.length, values.length, context);
      assert.ok(actual.every((value, index) => value && m.eq(value, values[index])), context + ': independent intermediate result');
    }
    for (let field = 0; field < raw.length; field++) {
      const empty = raw.slice(); empty[field] = '';
      assert.equal(def.check(empty, state).need, true, context + ': empty field');
      const wrong = raw.slice();
      // For kx=0, replacing k by any other nonzero number is equivalent.
      // Use k=0 here so the deliberately wrong input really loses the root.
      wrong[field] = want.type === 'eqn' ? 'x=99999' : want.type === 'canon' && field === 0 && m.isZero(want.values[1]) ? '0' : '99999';
      assert.equal(def.check(wrong, state).ok, false, context + ': wrong field');
    }
    assert.equal(def.check(raw, state).ok, true, context + ': independently calculated step');
    if (want.unordered) assert.equal(def.check(raw.slice().reverse(), state).ok, true, context + ': either root order');
  }
  return expected.length;
}

test('expanded bank preserves all 162 previous indices and the original 27 exam cards byte for byte as data', () => {
  // Snapshots from reviewed commit 700a1d99680b4c8065627c8d897d2817317b9339.
  // Includes 135 historic cards followed by the original 27 EXAM_BANK cards.
  assert.equal(snapshot(trainer.run('BANK').slice(0, 162)), '43612c11381685478c098cf8ee7344b81a06db492ba57aa15e88b344559a1d6b');
  assert.equal(snapshot(bank.slice(0, 27)), '8548f27fb54dc42200bcef66ec9b5dea2028afddcc5ad253f17df903265e7708');
  assert.equal(trainer.run('BANK').length, 275);
});

test('140 tasks have distinct IDs, 20 per shape and explicit source provenance', () => {
  assert.equal(bank.length, 140);
  assert.equal(new Set(bank.map(task => task.id)).size, 140);
  assert.equal(fixture.schemaVersion, 1);
  assert.deepEqual(fixture.tasks.map(task => task.id), Array.from(bank, task => task.id));
  for (const kind of kinds) assert.equal(bank.filter(task => task.examKind === kind).length, 20, kind);
  for (const [source, count] of [['fipi', 17], ['fipi-demo', 2], ['catalog', 22], ['analog', 99]]) {
    assert.equal(bank.filter(task => task.src === source).length, count, source);
  }
  for (const row of fixture.tasks) {
    const task = bank.find(item => item.id === row.id), source = trainer.run('taskSourceHTML')(task);
    const [c, b, a] = normalized(task), brackets = [...task.p.Lt, ...task.p.Rt].filter(term => term.br).length;
    if (task.examKind.startsWith('linear')) {
      assert.ok(m.isZero(a) && !m.isZero(b), task.id + ': linear');
      assert.equal(brackets, { 'linear-transfer': 0, 'linear-one-bracket': 1, 'linear-two-brackets': 2 }[task.examKind]);
    } else {
      assert.ok(!m.isZero(a), task.id + ': quadratic');
      if (task.examKind === 'quad-square') assert.ok(m.isZero(b) && !m.isZero(c), task.id + ': square shape');
      if (task.examKind === 'quad-factor-x') assert.ok(m.isZero(c) && !m.isZero(b), task.id + ': factor-x shape');
      if (task.examKind === 'quad-monic') assert.ok(m.eq(a, m.ONE) && !m.isZero(b) && !m.isZero(c), task.id + ': full monic shape');
      if (task.examKind === 'quad-nonmonic') assert.ok(!m.eq(a, m.ONE) && !m.isZero(b) && !m.isZero(c), task.id + ': full nonmonic shape');
    }
    assert.equal(row.source, task.src, row.id);
    assert.equal(row.family, task.fam, row.id);
    assert.equal(row.examKind, task.examKind, row.id);
    if (task.src === 'analog') assert.match(source, /Авторское|Авторский/);
    if (task.src === 'catalog') {
      assert.equal(row.directOfficialCardVerified, false, row.id);
      assert.ok(row.evidence.length >= 1, row.id + ': catalog evidence');
      assert.match(source, /[Кк]аталог|прототип/);
      assert.match(source, /[Пп]рям|не провер/);
      assert.doesNotMatch(source, /Идентификатор указан в.*навигаторе/);
    }
  }
});

test('every expanded task and step agrees with independent exact mathematics', async t => {
  for (const task of bank) await t.test(task.id, () => {
    const row = fixture.tasks.find(item => item.id === task.id), poly = normalized(task);
    const left = polynomial(row.Lt, true), right = polynomial(row.Rt, true), fromFixture = left.map((v, i) => m.sub(v, right[i]));
    assert.ok(poly.every((v, i) => m.eq(v, fromFixture[i])), task.id + ': fixture statement');
    const printed = parsePrintedEquation(row.equation);
    assert.ok(poly.every((v, i) => m.eq(v, printed[i])), task.id + ': human-readable equation');
    assert.ok(poly.every((v, i) => m.eq(v, q(row.coefficients[['c', 'b', 'a'][i]]))), task.id + ': fixture coefficients');
    const result = oracle.answer(task);
    assert.equal(result.bad, undefined, task.id);
    assert.equal(row.ask, task.ask, task.id);
    assert.equal(row.roots.length, result.roots.length, task.id);
    result.roots.forEach((root, i) => {
      assert.ok(m.isZero(valueAt(poly, root)), task.id + ': substitution');
      assert.ok(m.eq(root, q(row.roots[i])), task.id + ': fixture root');
    });
    assert.ok(m.eq(q(row.answer), result.key), task.id + ': fixture answer');
    assert.ok(m.eq(q(task.exp), result.key), task.id + ': stored answer');
    assert.ok(decimalIsFinite(result.key), task.id + ': exam answer is finite decimal');
    assert.equal(trainer.run('checkFinal')(task, m.str(result.key)).ok, true, task.id);
    assert.equal(trainer.run('checkFinal')(task, '').need, true, task.id);
    const instruction = trainer.run('taskInstrHTML')(task);
    if (result.roots.length === 2) {
      assert.match(instruction, task.ask === 'min' ? /меньший/ : /больший/);
      const other = result.roots[task.ask === 'min' ? 1 : 0];
      assert.equal(trainer.run('checkFinal')(task, m.str(other)).ok, false, task.id + ': other root');
    }
    exerciseSteps(task);
    if (task.fam === 'QF') exerciseSteps(task, 'vieta'); // engine-level, not a claim about Mara UI
  });
});

test('the three introductory worked examples use the reviewed varied equations and complete valid steps', () => {
  const captured = trainer.run(`(() => {
    const original = worked, tasks = [];
    worked = task => { tasks.push(task); return document.createElement('div'); };
    try { buildLearnTab(document.createElement('div')); } finally { worked = original; }
    return tasks;
  })()`);
  const examples = [
    { family: 'L', coefficients: ['-17', '4', '0'], roots: ['17/4'] },
    { family: 'QNC', coefficients: ['0', '6', '3'], roots: ['-2', '0'] },
    { family: 'QF', coefficients: ['-2', '3', '5'], roots: ['-1', '2/5'] },
  ];
  for (const example of examples) {
    const found = captured.find(task => task.fam === example.family);
    assert.ok(found, example.family + ': worked example exists');
    const task = { ...found, id: 'intro-' + example.family }, poly = normalized(task), result = oracle.answer(task);
    assert.ok(poly.every((v, i) => m.eq(v, q(example.coefficients[i]))));
    assert.deepEqual(result.roots.map(m.str), example.roots);
    exerciseSteps(task);
  }
});

test('the extension introduces no new algebraically equivalent duplicate equation', () => {
  const seen = new Set(bank.slice(0, 27).map(task => equivalentKey(normalized(task))));
  for (const task of bank.slice(27)) {
    const key = equivalentKey(normalized(task));
    assert.equal(seen.has(key), false, task.id + ': duplicated normalized equation');
    seen.add(key);
  }
});

test('variety includes real changes of signs, divisors, root selection and fractions', () => {
  const linears = bank.filter(task => task.examKind.startsWith('linear'));
  const coefficients = linears.map(task => normalized(task)[1]);
  const moduli = coefficients.map(v => m.str(m.R(v.n < 0n ? -v.n : v.n, v.d)));
  assert.ok(new Set(moduli).size >= 10, 'at least ten absolute linear coefficients');
  assert.ok(moduli.filter(value => value === '2').length <= linears.length / 4, 'division by two remains occasional');
  assert.ok(coefficients.some(value => value.n < 0n), 'negative linear coefficient');
  const linearRoots = linears.map(task => oracle.answer(task).key);
  assert.ok(linearRoots.some(value => value.n === 0n), 'zero linear root');
  assert.ok(linearRoots.some(value => value.n < 0n) && linearRoots.some(value => value.n > 0n));
  assert.ok(linearRoots.filter(value => value.d !== 1n).length >= 15, 'fractional linear answers');
  for (const kind of kinds.filter(value => value.startsWith('quad'))) {
    const tasks = bank.filter(task => task.examKind === kind);
    assert.ok(tasks.filter(task => task.ask === 'min').length >= 5, kind + ': smaller root');
    assert.ok(tasks.filter(task => task.ask === 'max').length >= 5, kind + ': larger root');
  }
  for (const kind of ['quad-monic', 'quad-nonmonic']) {
    const tasks = bank.filter(task => task.examKind === kind), rootSets = tasks.map(task => oracle.answer(task).roots);
    assert.ok(rootSets.some(roots => roots.every(value => value.n > 0n)), kind + ': positive pair');
    assert.ok(rootSets.some(roots => roots.every(value => value.n < 0n)), kind + ': negative pair');
    assert.ok(rootSets.some(roots => roots[0].n < 0n && roots[1].n > 0n), kind + ': mixed pair');
    if (kind === 'quad-nonmonic') {
      assert.ok(tasks.filter(task => normalized(task)[2].n < 0n).length >= 3, 'negative leading coefficient');
      assert.ok(rootSets.filter(roots => roots.some(value => value.d !== 1n)).length >= 5, 'fractional roots of nonmonic quadratics');
    }
  }
});
