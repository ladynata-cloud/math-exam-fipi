/* One exam selection policy shared by browser and account-backed runs. */
(function (root) {
  'use strict';
  const fixed = Object.freeze({
    2: ['practice-units-match'],
    7: ['practice-graph-match', 'practice-tangent-match'],
    8: ['practice-logic-order', 'practice-logic-all'],
    14: ['practice-fraction-expression', 'practice-decimals', 'practice-decimal-division'],
    18: ['practice-number-match', 'practice-inequality-match'],
    20: ['practice-meeting', 'practice-river', 'practice-work', 'practice-average-speed', 'motion', 'mixtures']
  });
  function select(meta, position) {
    return meta.filter(item => item.pos === position && (fixed[position] ? fixed[position].includes(item.id) : (item.expanded || item.id === 'triangle') && !item.trainingOnly));
  }
  function planBrowserRun(meta, serial) {
    const ids = [], taskSeeds = [];
    for (let position = 1; position <= 21; position++) {
      const pool = select(meta, position);
      const cycle = Math.floor((serial + 1) / pool.length);
      ids.push(pool[(serial + 1) % pool.length].id);
      // A family's seed advances each time that family recurs.
      taskSeeds.push(cycle + position - 1);
    }
    return { ids, taskSeeds };
  }
  root.PathExamPool = { select, planBrowserRun };
  if (typeof module !== 'undefined') module.exports = root.PathExamPool;
})(typeof window === 'undefined' ? globalThis : window);
