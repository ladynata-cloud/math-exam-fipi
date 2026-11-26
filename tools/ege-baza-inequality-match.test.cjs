const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createSet, intervalText, modelAt } = require('../ege-baza/inequality-match/lesson.js');

const modes = ['practice', 'check'];
const relations = ['<', '≤', '>', '≥'];
const sampleCount = 24;

function contains(interval, x) {
  const above = interval.lower === null || x > interval.lower ||
    (interval.includeLower && x === interval.lower);
  const below = interval.upper === null || x < interval.upper ||
    (interval.includeUpper && x === interval.upper);
  return above && below;
}

// Evaluate the original expression. Use a small equality tolerance because
// log(b ** k) / log(b) can be a few floating-point ulps away from k.
function compare(left, relation, right) {
  const equal = Math.abs(left - right) <= 1e-10 * Math.max(1, Math.abs(right));
  switch (relation) {
    case '<': return !equal && left < right;
    case '>': return !equal && left > right;
    case '≤': return equal || left < right;
    case '≥': return equal || left > right;
    default: throw new Error('Unknown relation ' + relation);
  }
}

function numericLabel(label) {
  const value = label.replaceAll('−', '-').replace(',', '.');
  assert.match(value, /^-?\d+(?:\.\d+)?(?:\/\d+)?$/);
  const [numerator, denominator = 1] = value.split('/').map(Number);
  assert.notEqual(denominator, 0);
  return numerator / denominator;
}

function verifyPrintedInterval(interval) {
  const printed = intervalText(interval).replace(/\s/g, '');
  const bounds = printed.slice(1, -1).split(';');
  assert.equal(bounds.length, 2, printed);
  assert.equal(printed[0], interval.includeLower ? '[' : '(');
  assert.equal(printed.at(-1), interval.includeUpper ? ']' : ')');
  if (interval.lower === null) {
    assert.equal(bounds[0], '−∞');
    assert.equal(interval.includeLower, false);
  } else assert.equal(numericLabel(bounds[0]), interval.lower);
  if (interval.upper === null) {
    assert.equal(bounds[1], '+∞');
    assert.equal(interval.includeUpper, false);
  } else assert.equal(numericLabel(bounds[1]), interval.upper);
}

// Read signed coefficients from the student-facing left side, independently
// of the parameters used by the generator to produce the answer.
function linearTerms(label) {
  const compact = label.replace(/\s/g, '').replaceAll('−', '-');
  if (/^[+-]?\d+$/.test(compact)) return [0, Number(compact)];
  const parts = /^([+-]?)(\d*)x([+-]\d+)?$/.exec(compact);
  assert.ok(parts, 'Линейное выражение: ' + label);
  return [(parts[1] === '-' ? -1 : 1) * Number(parts[2] || 1), Number(parts[3] || 0)];
}

function printedProblem(row) {
  if (row.kind === 'linear') {
    const [m, b] = linearTerms(row.leftLabel);
    const right = numericLabel(row.rightLabel);
    assert.deepEqual([m, b, right], [row.coefficient, row.constant, row.right]);
    assert.notEqual(m, 0);
    return { critical: [(right - b) / m], test: x => compare(m * x + b, row.relation, right) };
  }
  if (row.kind === 'rational') {
    const [m, b] = linearTerms(row.numeratorLabel);
    const [d, e] = linearTerms(row.denominatorLabel);
    const right = numericLabel(row.rightLabel);
    assert.ok(m === row.numeratorSlope && b === row.numeratorConstant, row.expression);
    assert.equal(d, 1);
    assert.equal(e + row.pole, 0);
    assert.equal(right, 0);
    const critical = [-e / d];
    if (m !== 0) critical.push(-b / m);
    return {
      critical,
      test: x => d * x + e !== 0 && compare((m * x + b) / (d * x + e), row.relation, right)
    };
  }
  assert.ok(['log', 'exp'].includes(row.kind), row.kind);
  assert.ok(row.base > 0 && row.base !== 1);
  assert.ok(Number.isFinite(row.shift) && Number.isFinite(row.level));
  const argument = /^x(?:\s*([+−-])\s*(\d+))?$/.exec(row.argument);
  assert.ok(argument, 'Аргумент в условии: ' + row.argument);
  const constant = argument[1] ? Number(argument[2]) * (argument[1] === '+' ? 1 : -1) : 0;
  assert.equal(row.shift + constant, 0, row.expression);
  assert.equal(numericLabel(row.baseLabel), row.base);
  const right = numericLabel(row.rightLabel);
  const expectedRight = row.kind === 'exp' ? row.base ** row.level : row.level;
  assert.ok(Math.abs(right - expectedRight) < 1e-10, row.expression);
  // Raise the numerator and denominator separately: (1 / 3) ** -2
  // as a binary float can leave the point slightly above the endpoint 9.
  const [p, q = 1] = row.baseLabel.split('/').map(Number);
  const magnitude = Math.abs(row.level);
  const power = row.level < 0 ? q ** magnitude / p ** magnitude : p ** magnitude / q ** magnitude;
  const equality = row.shift + (row.kind === 'exp' ? row.level : power);
  return {
    critical: [equality, -constant],
    test(x) {
      if (row.kind === 'log' && x + constant <= 0) return false;
      const left = row.kind === 'exp' ? row.base ** (x + constant) : Math.log(x + constant) / Math.log(row.base);
      return compare(left, row.relation, right);
    }
  };
}

function probes(critical, choices) {
  const endpoints = [...critical, -2.5, -1, 0, 0.25, 1, 2];
  for (const { lower, upper } of choices) {
    if (lower !== null) endpoints.push(lower);
    if (upper !== null) endpoints.push(upper);
  }
  const points = [...new Set(endpoints)].sort((a, b) => a - b);
  // A midpoint in every open elementary interval distinguishes any two
  // possible ranges even if their difference contains no integer.
  const midpoints = points.slice(1).map((point, i) => (point + points[i]) / 2);
  return [points[0] - 2, ...points, ...midpoints, points.at(-1) + 2];
}

for (const mode of modes) {
  test(mode + ' — четыре однозначных ответа проверяются прямой подстановкой', () => {
    for (let variant = 0; variant < sampleCount; variant++) {
      const { rows, choices, answer } = createSet(mode, variant);
      assert.equal(rows.length, 4);
      assert.equal(choices.length, 4);
      assert.match(answer, /^[1-4]{4}$/);
      assert.equal(new Set(answer).size, 4);
      assert.equal(new Set(choices.map(intervalText)).size, 4, 'Записи вариантов должны различаться');
      for (const interval of choices) {
        verifyPrintedInterval(interval);
        assert.ok(interval.lower === null || Number.isFinite(interval.lower));
        assert.ok(interval.upper === null || Number.isFinite(interval.upper));
        if (interval.lower !== null && interval.upper !== null) assert.ok(interval.lower < interval.upper);
      }
      for (const [i, row] of rows.entries()) {
        const problem = printedProblem(row);
        const points = probes(problem.critical, choices);
        const equivalent = interval => points.every(x => contains(interval, x) === problem.test(x));
        assert.ok(equivalent(row.solution), row.expression);
        const correct = choices.flatMap((interval, j) => equivalent(interval) ? [j + 1] : []);
        assert.deepEqual(correct, [Number(answer[i])], mode + ' ' + variant + ': ' + row.expression);
      }
    }
  });
}

test('Каждый третий набор переносит способ решения на четыре вида неравенств', () => {
  for (const mode of modes) {
    let mixedCount = 0;
    for (let variant = 0; variant < sampleCount; variant++) {
      const { rows } = createSet(mode, variant);
      const kinds = rows.map(row => row.kind).sort();
      if ((variant + 1) % 3 === 0) {
        assert.deepEqual(kinds, ['exp', 'linear', 'log', 'rational']);
        mixedCount++;
      } else {
        assert.deepEqual(kinds, ['exp', 'exp', 'log', 'log']);
      }
    }
    assert.equal(mixedCount, 8);
  }
});

test('Новые варианты меняют условия, сохраняя разделение тренировки и контроля', () => {
  const bank = {};
  for (const mode of modes) {
    const conditions = new Set();
    const differentSets = new Set();
    const keys = new Set();
    const covered = new Set();
    const signs = new Set();
    for (let variant = 0; variant < sampleCount; variant++) {
      const set = createSet(mode, variant);
      assert.deepEqual(set, createSet(mode, variant), 'Открытый вариант должен воспроизводиться');
      const items = set.rows.map(row => row.expression);
      for (const item of items) conditions.add(item);
      differentSets.add(items.sort().join('|'));
      keys.add(set.answer);
      for (const row of set.rows) {
        if (row.kind === 'exp' || row.kind === 'log') {
          covered.add(row.kind + (row.base > 1 ? '-grows' : '-decreases'));
        }
        signs.add(row.relation);
      }
    }
    assert.equal(differentSets.size, sampleCount, mode + ': наборы отличаются самими условиями');
    assert.ok(keys.size > 1, mode + ': ключ не должен запоминаться по порядку');
    assert.deepEqual(covered, new Set(['exp-grows', 'exp-decreases', 'log-grows', 'log-decreases']));
    assert.deepEqual(signs, new Set(relations));
    bank[mode] = conditions;
  }
  for (const entry of bank.check) assert.ok(!bank.practice.has(entry), 'Условие контроля встречалось в тренировке: ' + entry);
});

test('Разобранные примеры, модель и задача на бумаге не раскрывают строки контроля', () => {
  const html = readFileSync(path.join(__dirname, '../ege-baza/inequality-match/index.html'), 'utf8');
  const compact = text => text.replaceAll('½', '1/2').replaceAll('¼', '1/4').replace(/\s/g, '');
  const printed = compact(html.replace(/<sub>(.*?)<\/sub>/g, '[$1]')
    .replace(/<sup>(.*?)<\/sup>/g, '^($1)').replace(/<[^>]+>/g, '')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&nbsp;', ' '));
  const formulaPattern = /(?:log\[(?:\d+(?:\/\d+)?|a)\]\(x(?:[+−-]\d+)?\)|(?:\(\d+\/\d+\)|\d+)\^\(x(?:[+−-]\d+)?\))(?:≤|≥|<|>)[−-]?\d+(?:\/\d+)?/g;
  const printedFormulas = new Set(printed.match(formulaPattern));
  assert.ok(printedFormulas.size >= 8, 'Два разбора, разминка, модель и четыре бумажных строки');
  for (const formula of [...printedFormulas]) {
    if (formula.includes('[a]')) {
      for (const base of ['2', '1/2']) printedFormulas.add(formula.replace('[a]', '[' + base + ']'));
    }
  }
  for (let variant = 0; variant < sampleCount; variant++) {
    for (const row of createSet('check', variant).rows) {
      const expression = compact(row.expression);
      assert.ok(!printedFormulas.has(expression), 'Уже разобрано на странице: ' + row.expression);
      // Also recognise algebraic transfer tasks on the static page. Bound
      // both ends so a short expression does not match part of a coefficient.
      if (row.kind === 'linear' || row.kind === 'rational') {
        const escaped = expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exact = new RegExp('(?:^|[^0-9x−+/])' + escaped + '(?![0-9/])');
        assert.ok(!exact.test(printed), 'Уже разобрано на странице: ' + row.expression);
      }
    }
  }
});

test('Для модели logₐ(x − 1) ≤ 1 проверены ОДЗ, обе границы и вся шкала', () => {
  for (const base of [2, 0.5]) {
    const boundary = 1 + base;
    for (let quarter = -4; quarter <= 20; quarter++) {
      const x = quarter / 4;
      const result = modelAt(base, x);
      const expected = base === 2 ? x > 1 && x <= 3 : x >= 1.5;
      assert.equal(result.boundary, boundary);
      assert.equal(result.defined, x > 1);
      assert.equal(contains(result.solution, x), expected);
      if (x <= 1) {
        assert.equal(result.value, null);
        assert.equal(result.matches, null);
      } else {
        assert.equal(result.matches, expected, 'a=' + base + ', x=' + x);
        const exact = Math.log2(x - 1) * (base === 2 ? 1 : -1);
        assert.ok(Math.abs(result.value - exact) < 1e-10);
      }
    }
  }
});
