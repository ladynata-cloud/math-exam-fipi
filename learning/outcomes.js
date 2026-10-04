(function (root) {
  'use strict';
  const api = Object.freeze({ labels: Object.freeze({
    started: 'Начато', together: 'Разобрали вместе', hinted: 'Решено с подсказкой',
    independent: 'Решено самостоятельно', repeated: 'Самостоятельно повторено',
    practiced: 'Верно на знакомом задании'
  }), independent: Object.freeze(['independent', 'repeated']) });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LearningOutcomes = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
