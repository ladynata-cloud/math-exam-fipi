(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProfileExamMap = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  // Official display numbers are not routing, lesson or saved-progress keys.
  // Source: FIPI 2027 mathematics specification; approved H02 task table.
  const YEAR = 2027;
  const teachingEntry = {1: 'geo-right', 6: 'eq-linear', 7: 'expr-powers'};
  const define = (number, id, title, source, legacy, lessonIds, preparationIds = []) => Object.freeze({
    year: YEAR, number, id, title, source,
    part: number == null ? null : number <= 12 ? 1 : 2,
    points: number == null ? null : number <= 12 ? 1 : [2, 3, 2, 2, 3, 4, 4][number - 13],
    legacyStart: source === 'start' ? legacy : number === 15 ? 16 : null,
    legacyPartTwo: source === 'part-two' ? legacy : null,
    lessonIds: Object.freeze(lessonIds), preparationIds: Object.freeze(preparationIds),
    entry: teachingEntry[number] || lessonIds[0]
  });
  const entries = Object.freeze([
    define(1, 'planimetry', 'Планиметрия', 'start', 1,
      ['geo-angles', 'geo-right', 'geo-similarity', 'geo-area', 'geo-quadrilaterals', 'geo-circle']),
    define(2, 'vectors', 'Векторы', 'start', 2,
      ['vec-coordinates', 'vec-length', 'vec-operations', 'vec-dot'],
      ['vec-basics-reading', 'vec-basics-equality', 'vec-basics-triangle', 'vec-basics-parallelogram',
        'vec-basics-difference', 'vec-basics-scale', 'vec-basics-coordinates', 'vec-basics-length', 'vec-basics-dot']),
    define(3, 'stereometry', 'Стереометрия', 'start', 3,
      ['stereo-box', 'stereo-cube', 'stereo-prism', 'stereo-pyramid', 'stereo-cylinder', 'stereo-cone', 'stereo-sphere', 'stereo-compound']),
    define(4, 'probability', 'Простая вероятность', 'start', 4,
      ['prob-count', 'prob-complement', 'prob-range']),
    define(5, 'compound-probability', 'Вероятности сложных событий', 'start', 5,
      ['prob-independent', 'prob-conditional', 'prob-exact']),
    define(6, 'equations', 'Уравнения первой части', 'start', 7,
      ['algebra-exponential', 'algebra-logarithmic', 'eq-linear', 'eq-rational', 'eq-quadratic', 'eq-root']),
    define(7, 'expressions', 'Вычисления и преобразования', 'start', 8,
      ['algebra-cosine', 'algebra-double-angle', 'expr-powers', 'expr-roots', 'expr-fractions', 'expr-logarithms'],
      ['trig-angle', 'trig-coordinates', 'trig-special', 'trig-tangent']),
    define(8, 'derivative', 'Производная и первообразная', 'start', 9,
      ['calc-tangent', 'calc-sign', 'calc-graph', 'calc-integral'], ['calc-value', 'calc-special']),
    define(9, 'formulas', 'Прикладные формулы', 'start', 10,
      ['applied-formula', 'applied-formula-limit']),
    define(10, 'word-problems', 'Текстовые задачи', 'start', 11,
      ['applied-motion', 'applied-work', 'applied-mixture']),
    define(11, 'functions', 'Функции и графики', 'start', 12,
      ['fn-line', 'fn-parabola', 'fn-hyperbola', 'fn-explog']),
    define(12, 'extrema', 'Наибольшее и наименьшее значение', 'start', 9,
      ['calc-extreme'], ['calc-value', 'calc-special']),
    define(13, 'part-two-equations', 'Уравнения второй части', 'part-two', 14,
      ['p14-circle-selection', 'p14-trig-factors', 'p14-exponential-substitution', 'p14-log-domain', 'p14-radical-check', 'p14-rational-hole']),
    define(14, 'part-two-stereometry', 'Стереометрия с доказательством', 'part-two', 15,
      ['p2-15-projection', 'p2-15-line-plane', 'p2-15-dihedral', 'p2-15-distance', 'p2-15-section-volume', 'p2-15-coordinate-angle']),
    define(15, 'inequalities', 'Неравенства', 'part-two', 16,
      ['p16-repeated-root', 'p16-exponential-interval', 'p16-fixed-log', 'p16-variable-base', 'p16-radical-inequality', 'p16-cancelled-hole']),
    define(16, 'finance', 'Экономическая задача', 'start', 13,
      ['applied-percent', 'applied-loan-linear', 'applied-loan-equal',
        'finance-lesson-01-ledger', 'finance-lesson-02-deposits', 'finance-lesson-03-interest-progression',
        'finance-lesson-04-first-last-payment', 'finance-lesson-05-balance-tables', 'finance-lesson-06-payment-bounds',
        'finance-lesson-07-equal-payments', 'finance-lesson-08-unknown-in-ledger', 'finance-lesson-09-rates',
        'finance-lesson-10-inverse-equal-payments', 'finance-lesson-11-changing-conditions', 'finance-lesson-12-calendar',
        'finance-lesson-13-two-stages']),
    define(17, 'part-two-planimetry', 'Планиметрия с доказательством', 'part-two', 18,
      ['p2-18-similarity', 'p2-18-tangents', 'p2-18-cyclic', 'p2-18-bisector', 'p2-18-cevians', 'p2-18-altitude']),
    define(18, 'parameters', 'Задачи с параметром', 'part-two', 19,
      ['param-linear', 'param-positive-roots', 'param-modules', 'param-hole', 'param-tangent', 'param-system']),
    define(19, 'numbers', 'Числа и их свойства', 'part-two', 20,
      ['numbers-remainders', 'numbers-digits', 'numbers-extremum', 'numbers-counterexample', 'numbers-invariant', 'numbers-diophantine'])
  ]);
  const extras = Object.freeze([
    define(null, 'random-variables', 'Случайные величины', 'start', 6,
      ['prob-distribution', 'prob-variance', 'prob-continuous']),
    define(null, 'optimization', 'Моделирование и оптимизация', 'part-two', 17,
      ['model-fence', 'model-revenue', 'model-boundary', 'model-discrete', 'model-box', 'model-motion'])
  ]);
  // Keep the earlier topic URL as an exact entrance to the same lesson.
  const integral = define(8, 'integral', 'Первообразная и площадь', 'start', 9, ['calc-integral']);
  const calculus = define(null, 'calculus-legacy', 'Производная, экстремумы и первообразная', 'start', 9,
    ['calc-tangent', 'calc-sign', 'calc-graph', 'calc-value', 'calc-special', 'calc-extreme', 'calc-integral']);
  const all = [...entries, ...extras];
  const numberValue = value => typeof value === 'number' && Number.isInteger(value) ? value :
    typeof value === 'string' && /^(?:[1-9]|1[0-9]|20)$/.test(value) ? Number(value) : null;
  const get = number => entries.find(item => item.number === numberValue(number)) || null;
  const topics = [...all, calculus, integral];
  const topic = id => typeof id === 'string' ? topics.find(item => item.id === id) || null : null;
  const resolve = value => value && typeof value === 'object' ? topic(value.id) : get(value) || topic(value);
  const fromLegacyStart = value => {
    const number = numberValue(value);
    if (number === 9) return calculus;
    return number == null ? null : all.find(item => item.legacyStart === number) || null;
  };
  const fromLegacyPartTwo = value => {
    const number = numberValue(value);
    return number == null ? null : all.find(item => item.legacyPartTwo === number) || null;
  };
  const forLesson = id => typeof id === 'string' ? all.find(item => item.lessonIds.includes(id)) ||
    all.find(item => item.preparationIds.includes(id)) || null : null;
  const label = value => { const item = resolve(value); return item ? item.number == null ? 'Дополнительная тема' : '№ ' + item.number : ''; };
  const hash = value => {
    const item = resolve(value);
    return item ? item.number == null ? '#topic/' + item.id : '#fipi/' + YEAR + '/' + item.number : '';
  };
  const href = value => {
    const item = resolve(value);
    return item ? '/ege-profil/' + item.source + '/' + hash(item) : '';
  };
  return Object.freeze({YEAR, entries, extras, get, topic, fromLegacyStart, fromLegacyPartTwo, forLesson, label, hash, href});
});
