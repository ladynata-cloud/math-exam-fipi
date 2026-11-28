(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProfileEquationFields = api;
})(globalThis, function() {
  'use strict';

  const angularInterval = Object.freeze(['0', '2', true, true]);
  const general = Object.freeze({ key: 'general', label: 'а) Общее решение', type: 'periodic-pi',
    format: 'Запишите серии вида x = aπ + bπn, где n — целое число. Можно написать pi. Несколько серий разделите точкой с запятой или словом «или».' });
  const selected = Object.freeze({ key: 'selected', label: 'б) Корни в заданном промежутке', type: 'finite-pi',
    format: 'Запишите углы с π или pi через точку с запятой. Ноль запишите как 0. Если таких корней нет, введите «нет корней» или ∅.' });
  const roots = Object.freeze({ key: 'roots', label: 'Все корни уравнения', type: 'finite-rational',
    format: 'Запишите числа через точку с запятой в любом порядке. Если корней нет, введите «нет решений» или ∅.' });
  const trigFields = Object.freeze([general, selected]);
  const numberFields = Object.freeze([roots]);

  function legacy(task) {
    const meta = task.meta;
    if (meta.kind === 'trig-selection' || meta.kind === 'trig-factor') {
      // Legacy fields hold exact rational aliases followed by numeric aliases.
      // Use the first aliases without reconstituting the fractions from floats.
      const finite = task.final.map(field => String(field.answers[0]));
      const families = meta.kind === 'trig-selection' ? finite.map(value => [value, '2']) :
        [['0', '1'], [finite[1], '2'], [finite[3], '2']];
      const prompt = task.prompt
        .replace(/ В поля для корней вводите коэффициенты при π в возрастающем порядке\.$/u, '')
        .replace(/ Запишите все пять коэффициентов при π в возрастающем порядке\.$/u, '');
      return { prompt, answer: { type: 'finite-pi', general: families, finite, interval: angularInterval } };
    }
    const answer = { type: 'finite-rational' };
    switch (meta.kind) {
      case 'exponential-equation':
        answer.finite = [String(meta.p), String(meta.q)];
        break;
      case 'log-equation':
        answer.finite = [String(meta.r)];
        answer.domain = { interval: [String(Math.max(meta.a, meta.c)), null, false, false] };
        break;
      case 'radical-equation':
        answer.finite = [String(meta.r)];
        answer.domain = { interval: [String(-meta.a), null, true, false] };
        break;
      case 'rational-equation':
        answer.finite = meta.roots.map(String);
        answer.domain = { excluded: [String(meta.a)] };
        break;
      default:
        throw new TypeError('Unexpected legacy equation family');
    }
    return { prompt: task.independentFinal?.prompt || task.prompt, answer };
  }

  function forTask(lesson, task, mode, independentEligible) {
    if (lesson.exam !== 14) return null;
    const model = task.equationAnswer ? { prompt: task.prompt, answer: task.equationAnswer } :
      mode === 'independent' && (independentEligible || task.id === 'p14-circle-selection-1') ? legacy(task) : null;
    if (!model) return null;
    return { ...model, fields: model.answer.type === 'finite-pi' ? trigFields : numberFields };
  }

  return Object.freeze({ forTask });
});
