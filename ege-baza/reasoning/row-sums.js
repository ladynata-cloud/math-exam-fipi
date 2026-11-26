(function (root) {
  'use strict';

  const math = typeof module !== 'undefined' && module.exports
    ? require('./math.js') : root.ReasoningMath;

  // Strict lower bound, strict upper bound, sums of the columns.
  const bank = {
    practice: [
      [27, 32, [90, 102, 114]],
      [22, 27, [83, 43, 56]],
      [25, 29, [70, 81, 60, 101]],
      [25, 34, [73, 8, 68, 93]],
      [27, 30, [51, 40, 34, 46]],
      [21, 24, [71, 63, 51, 68]],
      [25, 29, [82, 63, 89]],
      [21, 28, [13, 169, 166]],
      [25, 28, [101, 149, 150]],
      [28, 32, [209, 121, 104]],
      [17, 20, [44, 29, 28, 43]],
      [23, 34, [100, 97, 116, 10]]
    ],
    check: [
      [17, 21, [42, 29, 51, 47]],
      [18, 21, [71, 72, 69, 48]],
      [7, 10, [21, 14, 13]],
      [24, 32, [10, 144, 138]],
      [23, 27, [104, 109, 76]],
      [19, 22, [52, 63, 53]],
      [21, 24, [62, 93, 70, 83]],
      [8, 15, [28, 32, 7, 27]],
      [25, 28, [65, 69, 82, 75]],
      [22, 26, [57, 39, 66, 63]],
      [20, 23, [84, 87, 144]],
      [13, 22, [81, 146, 12]]
    ]
  };

  function task(mode, index) {
    if (!Object.hasOwn(bank, mode) || !Number.isInteger(index) || index < 0 || index >= bank[mode].length) {
      throw new RangeError('Нет такого варианта');
    }
    const [above, below, columns] = bank[mode][index];
    return { above, below, columns: columns.slice() };
  }

  function analyze(problem) {
    if (!problem || !Array.isArray(problem.columns) || !problem.columns.length) return null;
    const { above, below, columns } = problem;
    if (!Number.isSafeInteger(above) || !Number.isSafeInteger(below) || above >= below || below <= 1) return null;

    let total = 0, smallestColumn = Infinity;
    for (const column of columns) {
      if (!Number.isSafeInteger(column) || column < 1) return null;
      total += column;
      smallestColumn = Math.min(smallestColumn, column);
    }
    if (!Number.isSafeInteger(total)) return null;

    // Each positive cell already contributes one to the row and to its column.
    const minRow = Math.max(above + 1, columns.length), maxRow = below - 1;
    const minRows = Math.ceil(total / maxRow);
    const maxRows = Math.min(Math.floor(total / minRow), smallestColumn);
    const answer = minRows === maxRows && minRow <= maxRow ? minRows : null;
    return { total, minRow, maxRow, minRows, maxRows, answer };
  }

  function witness(problem, n) {
    const bounds = analyze(problem);
    if (!bounds || !Number.isSafeInteger(n) || n < bounds.minRows || n > bounds.maxRows
        || bounds.minRow > bounds.maxRow || n > 0xffffffff) return null;
    return math.construct(problem.columns, n, bounds.minRow, bounds.maxRow);
  }

  const api = { count: bank.practice.length, task, analyze, witness };
  root.EgeRowSums = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
