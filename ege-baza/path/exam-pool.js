/* One exam selection policy shared by browser and account-backed runs. */
(function (root) {
  'use strict';
  const fixed = Object.freeze({
    2: ['practice-units-match'],
    7: ['practice-graph-match'],
    8: ['practice-logic-order', 'practice-logic-all'],
    14: ['practice-fraction-expression', 'practice-decimals', 'practice-decimal-division'],
    18: ['practice-number-match', 'practice-inequality-match'],
    20: ['practice-meeting', 'practice-river', 'practice-work', 'practice-average-speed']
  });
  function select(meta, position) {
    return meta.filter(item => item.pos === position && (fixed[position] ? fixed[position].includes(item.id) : item.expanded && !item.trainingOnly));
  }
  root.PathExamPool = { select };
  if (typeof module !== 'undefined') module.exports = root.PathExamPool;
})(typeof window === 'undefined' ? globalThis : window);
