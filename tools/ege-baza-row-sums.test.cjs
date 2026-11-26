const test = require('node:test');
const assert = require('node:assert/strict');
const { count, task, analyze, witness } = require('../ege-baza/reasoning/row-sums.js');

const sum = values => values.reduce((a, b) => a + b, 0);
const validRow = (problem, total) => problem.above < total && total < problem.below;

// Give each cell one unit. Deal the rest of each column cyclically, carrying
// the row cursor across columns. All row totals then differ by at most one.
// Such balanced rows are feasible whenever any rows with that total can fit
// the same open interval. This oracle never calculates either row-count bound.
function canDeal(problem, n) {
  if (problem.columns.some(column => column < n)) return false;
  const totals = Array(n).fill(problem.columns.length);
  let row = 0;
  for (const column of problem.columns) {
    for (let unit = n; unit < column; unit++) {
      totals[row]++;
      row = (row + 1) % n;
    }
  }
  return totals.every(total => validRow(problem, total));
}

function possibleCounts(problem, isPossible = canDeal) {
  const counts = [];
  for (let n = 1; n <= Math.min(...problem.columns); n++) {
    if (isPossible(problem, n)) counts.push(n);
  }
  return counts;
}

function verifyWitness(problem, n, matrix) {
  assert.equal(matrix.length, n);
  for (const row of matrix) {
    assert.equal(row.length, problem.columns.length);
    assert.ok(row.every(value => Number.isInteger(value) && value > 0));
    assert.ok(validRow(problem, sum(row)), JSON.stringify({ problem, row }));
  }
  const columnSums = problem.columns.map((_, i) => sum(matrix.map(row => row[i])));
  assert.deepEqual(columnSums, problem.columns);
}

// For tiny examples enumerate all possible positive entries of the next
// row. This deliberately uses neither the balanced-deal theorem nor the
// formula for the number of rows.
function bruteForce(problem, n) {
  const memo = new Map();
  function fill(remaining, rowsLeft) {
    if (remaining.some(x => x < rowsLeft)) return false;
    if (rowsLeft === 1) return validRow(problem, sum(remaining));
    const key = rowsLeft + '/' + remaining.join(',');
    if (memo.has(key)) return memo.get(key);
    const row = [];
    function choose(i, total) {
      if (i === remaining.length) {
        return validRow(problem, total) && fill(remaining.map((x, j) => x - row[j]), rowsLeft - 1);
      }
      for (let value = 1; value <= remaining[i] - rowsLeft + 1; value++) {
        row[i] = value;
        if (choose(i + 1, total + value)) return true;
      }
      return false;
    }
    const result = choose(0, 0);
    memo.set(key, result);
    return result;
  }
  return fill(problem.columns, n);
}

function checkAnalysis(problem, feasible) {
  const analysis = analyze(problem);
  assert.equal(analysis.total, sum(problem.columns));
  assert.equal(analysis.answer, feasible.length === 1 ? feasible[0] : null, JSON.stringify(problem));
  const fromBounds = [];
  for (let n = 1; n <= Math.max(...problem.columns) + 1; n++) {
    if (n >= analysis.minRows && n <= analysis.maxRows) fromBounds.push(n);
    const matrix = witness(problem, n);
    if (feasible.includes(n)) verifyWitness(problem, n, matrix);
    else assert.equal(matrix, null, 'Невозможная таблица: ' + JSON.stringify({ problem, n }));
  }
  assert.deepEqual(fromBounds, feasible, JSON.stringify(problem));
  return analysis;
}

test('Все задачи тренировки и контроля имеют единственный ответ и положительное построение', () => {
  assert.equal(count, 12);
  // Reordering columns of a worked example leaves the mathematical task unchanged.
  const signature = columns => [...columns].sort((a, b) => a - b).join(',');
  const seenColumns = new Set([[48, 60, 67], [27, 36, 45], [8, 24, 34], [110, 115, 120]].map(signature));
  for (const mode of ['practice', 'check']) {
    const cases = { fractional: 0, exactLower: 0, exactUpper: 0, smallColumn: 0 };
    for (let i = 0; i < count; i++) {
      const problem = task(mode, i);
      assert.deepEqual(problem, task(mode, i));
      assert.ok(problem.columns.length >= 3);
      const key = signature(problem.columns);
      assert.ok(!seenColumns.has(key), 'Повтор сумм столбцов: ' + key);
      seenColumns.add(key);
      const feasible = possibleCounts(problem);
      assert.equal(feasible.length, 1, JSON.stringify(problem));
      const result = checkAnalysis(problem, feasible);
      const lo = Math.max(problem.above + 1, problem.columns.length);
      const hi = problem.below - 1;
      assert.equal(result.minRow, lo);
      assert.equal(result.maxRow, hi);
      const total = sum(problem.columns);
      // Find a candidate passing the strict row-sum bounds which cannot
      // exist because a column does not contain enough units for all rows.
      let columnDecides = false;
      for (let n = feasible[0] + 1; lo * n <= total; n++) {
        if (total <= n * hi && problem.columns.some(c => c < n)) columnDecides = true;
      }
      if (columnDecides) cases.smallColumn++;
      else if (total % hi === 0) cases.exactLower++;
      else if (total % lo === 0) cases.exactUpper++;
      else cases.fractional++;
    }
    assert.deepEqual(cases, { fractional: 3, exactLower: 3, exactUpper: 3, smallColumn: 3 });
  }
});

test('Оба опыта, пример с точным делением и старый разобранный пример имеют заявленные ответы', () => {
  for (const [columns, above, below, rows] of [
    [[48, 60, 67], 13, 16, 12],
    [[27, 36, 45], 10, 13, 9],
    [[8, 24, 34], 6, 10, 8],
    [[110, 115, 120], 20, 23, 16]
  ]) {
    const problem = { columns, above, below };
    assert.deepEqual(possibleCounts(problem), [rows]);
    checkAnalysis(problem, [rows]);
  }
});

test('При нескольких решениях и при несовместимых суммах кандидат не выбирается произвольно', () => {
  const cases = [
    [{ columns: [3, 3, 3], above: 2, below: 6 }, [2, 3]],
    [{ columns: [1, 3, 7], above: 3, below: 7 }, []],
    [{ columns: [3, 3, 3], above: 2, below: 3 }, []],
    [{ columns: [2, 2, 2], above: 0, below: 4 }, [2]],
    [{ columns: [2, 2, 2], above: 3, below: 5 }, []]
  ];
  for (const [problem, expected] of cases) {
    assert.deepEqual(possibleCounts(problem, bruteForce), expected);
    checkAnalysis(problem, expected);
  }
});

test('Полный перебор малых трёхстолбцовых таблиц подтверждает ответы и оба конца оценок', () => {
  for (let a = 1; a <= 4; a++) {
    for (let b = a; b <= 5; b++) {
      for (let c = b; c <= 6; c++) {
        for (const [above, below] of [[-1, 3], [0, 4], [2, 5], [3, 6], [4, 8], [7, 9]]) {
          const problem = { columns: [a, b, c], above, below };
          const feasible = possibleCounts(problem, bruteForce);
          assert.deepEqual(possibleCounts(problem), feasible);
          checkAnalysis(problem, feasible);
        }
      }
    }
  }
});
