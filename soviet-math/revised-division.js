(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../trainers/oge-basics/multiplication-division/division-guided-core.js'));
  else root.SovietRevisedDivision = factory(root.DivisionGuided);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (D) {
  'use strict';
  if (!D) throw Error('Сначала подключите division-guided-core.js.');

  // The arithmetic and the complete written angle belong to the shared core.
  // This adapter asks about decisions, while explaining routine preparations.
  // A checkpoint is an EXCLUSIVE count of visible base actions, not a step ID.
  var definitions = [
    ['divide-simple', 'start', 'Деление уголком: первые шаги', 'division', 'Подбираем цифры частного и находим остаток. Все вычисления остаются в уголке.'],
    ['divide-zero', 'zero', 'Ноль в частном', 'division', 'Учимся замечать разряд, в котором нужно записать ноль.'],
    ['divide-remainder', 'remainder', 'Деление с остатком', 'division', 'Находим частное и остаток, затем проверяем деление.'],
    ['divide-two', 'twoDigit', 'Деление на двузначное число', 'division', 'Пробуем подходящие произведения рядом с уголком.'],
    ['divide-decimal-natural', 'decimalNatural', 'Десятичную дробь делим на натуральное число', 'division', 'Переходим от целой части к дробной и сохраняем место запятой.'],
    ['divide-decimal', 'decimalDivisor', 'Деление на десятичную дробь', 'applications', 'Сначала одинаково изменяем оба числа, затем делим уголком.']
  ];
  var topics = definitions.map(function (item) {
    return { id: item[0], title: item[2], stage: item[3], description: item[4], source: 'princev' };
  });
  var divisionMap = Object.fromEntries(definitions.map(function (item) { return [item[0], item[1]]; }));

  function make(topicId, index) {
    if (!Object.hasOwn(divisionMap, topicId)) throw Error('Неизвестная тема курса.');
    if (index === undefined) index = 0;
    if (!Number.isSafeInteger(index) || index < 0 || index > 1000000) throw Error('Неверный номер упражнения.');
    var p = D.plan(D.make(divisionMap[topicId], index));
    var steps = [], checkpoints = [], d = Number(p.normalizedDivisor);
    var rawAt = Object.fromEntries(p.actions.filter(function (a) {
      return a.kind !== 'count' && a.kind !== 'remainder-check';
    }).map(function (a) { return [a.baseStep, a]; }));

    function add(raw, before, after, prompt, hint, record, helper, beforeHelper) {
      var previous = checkpoints.length ? checkpoints[checkpoints.length - 1].after : 0;
      if (before < previous || after <= before || after > p.baseActions.length) throw Error('Нарушен порядок решения.');
      steps.push({ prompt: prompt, answer: String(raw.answer), hint: hint, record: record,
        helper: helper || [], beforeHelper: beforeHelper || [], raw: raw });
      checkpoints.push({ before: before, after: after, automatic: p.baseActions.slice(previous, before), focus: raw });
    }

    p.baseActions.forEach(function (base, baseIndex) {
      var raw = rawAt[baseIndex], cycle, prior, bring, beforeHelper, hint, helper;
      if (base.kind === 'shift-factor') {
        var factor = raw.answer;
        add(raw, 0, p.normalizationEnd,
          'Чтобы делитель стал целым, выбери наименьший множитель: 10, 100 или 1000.',
          'Умножаем оба числа на ' + factor + '. Частное от этого не изменится. Теперь делим ' + p.normalizedDividend + ' на ' + p.normalizedDivisor + '.',
          p.task.dividend + ' : ' + p.task.divisor + ' = ' + p.normalizedDividend + ' : ' + p.normalizedDivisor,
          [p.task.dividend + ' × ' + factor + ' = ' + p.normalizedDividend,
            p.task.divisor + ' × ' + factor + ' = ' + p.normalizedDivisor],
          ['Удобнее делить на натуральное число.', 'Оба числа изменяем в одинаковое число раз.']);
      } else if (base.kind === 'partial') {
        var cycleIndex = p.cycles.findIndex(function (item) { return item.sourceIndex === base.sourceIndex; });
        prior = p.cycles[cycleIndex - 1];
        if (!prior || prior.remainder === 0) return;
        bring = rawAt[baseIndex - 1];
        beforeHelper = [
          'От предыдущего деления осталось ' + prior.remainder + '.',
          bring.appended ? 'Дописываем справа после запятой ноль.' : 'Сносим следующую цифру: ' + bring.answer + '.'
        ];
        add(raw, bring.baseStep, baseIndex + 1,
          'К остатку ' + prior.remainder + ' сносим цифру ' + bring.answer + '. Какое число будем делить дальше?',
          'Переходим к следующему разряду. К остатку ' + prior.remainder + ' приписываем справа ' + bring.answer + ': получается ' + raw.answer + '.',
          prior.remainder + ' × 10 + ' + bring.answer + ' = ' + raw.answer,
          [prior.remainder + ' × 10 + ' + bring.answer + ' = ' + raw.answer], beforeHelper);
      } else if (base.kind === 'digit') {
        cycle = p.cycles[base.cycle];
        prior = p.cycles[base.cycle - 1];
        beforeHelper = [];
        if (!prior) {
          var firstPrefix = Number(p.digits.slice(0, cycle.sourceIndex).join('') || '0');
          if (cycle.sourceIndex > 0 && firstPrefix > 0 && firstPrefix < d) beforeHelper.push(firstPrefix + ' меньше ' + d + ', поэтому берём ещё одну цифру.');
          var rankNames = ['единицы', 'десятки', 'сотни', 'тысячи', 'десятки тысяч', 'сотни тысяч'];
          var rank = p.intLen - cycle.sourceIndex - 1;
          beforeHelper.push(rankNames[rank] ? 'Сначала делим ' + rankNames[rank] + ': ' + cycle.partial + ' : ' + d + '.' : 'Начинаем делить число ' + cycle.partial + '.');
        } else if (prior.remainder === 0) {
          bring = p.baseActions.slice(prior.subtractAction + 1, baseIndex).find(function (a) { return a.kind === 'bring'; });
          beforeHelper.push('Остатка нет. Сносим следующую цифру: ' + bring.answer + '.');
          beforeHelper.push('Теперь делим ' + cycle.partial + ' на ' + d + '.');
        }
        if (cycle.qd === 0) {
          hint = cycle.partial + ' меньше ' + d + '. Пишем 0 в частном, чтобы не пропустить разряд. Остаток не изменится.';
          helper = [d + ' × 0 = 0', cycle.partial + ' − 0 = ' + cycle.remainder, 'Ноль сохраняет место разряда в частном.'];
        } else {
          hint = 'Пишем ' + cycle.qd + ' в частном: ' + d + ' × ' + cycle.qd + ' = ' + cycle.product + '. ' +
            (cycle.qd < 9 ? 'Следующее произведение ' + d * (cycle.qd + 1) + ' больше ' + cycle.partial + '.' : 'Подходит наибольшая цифра.');
          helper = [d + ' × ' + cycle.qd + ' = ' + cycle.product + ' ≤ ' + cycle.partial];
          if (cycle.qd < 9) helper.push(d + ' × ' + (cycle.qd + 1) + ' = ' + d * (cycle.qd + 1) + ' > ' + cycle.partial);
        }
        add(raw, baseIndex, cycle.qd === 0 ? cycle.subtractAction + 1 : baseIndex + 1,
          'Сколько раз ' + d + ' помещается в ' + cycle.partial + '?', hint,
          'Цифра частного: ' + cycle.qd + '; ' + d + ' × ' + cycle.qd + ' = ' + cycle.product,
          helper, beforeHelper);
      } else if (base.kind === 'subtract') {
        cycle = p.cycles[base.cycle];
        if (cycle.qd === 0) return;
        add(raw, baseIndex, baseIndex + 1,
          'Вычти ' + cycle.product + ' из ' + cycle.partial + '. Сколько осталось?',
          cycle.partial + ' − ' + cycle.product + ' = ' + cycle.remainder + '. ' + (cycle.remainder === 0 ? 'Это число разделили без остатка.' : 'Остаток меньше делителя ' + d + ', значит, цифра подобрана верно.'),
          cycle.partial + ' − ' + cycle.product + ' = ' + cycle.remainder,
          [cycle.partial + ' − ' + cycle.product + ' = ' + cycle.remainder, 'Остаток меньше делителя: ' + cycle.remainder + ' < ' + d],
          [d + ' × ' + cycle.qd + ' = ' + cycle.product, 'Записываем произведение под числом ' + cycle.partial + '.']);
      } else if (base.kind === 'comma') {
        add(raw, baseIndex, baseIndex + 1,
          'Целую часть разделили. Запиши найденную часть частного с запятой.',
          'Дальше делим десятые, поэтому после целой части частного ставим запятую: ' + raw.answer,
          'Перед десятыми ставим запятую: ' + raw.answer,
          ['Целая часть делимого закончилась.', 'Запятая отделяет целую часть частного от дробной.'],
          ['Переходим от целой части делимого к дробной.']);
      } else if (base.kind === 'verify') {
        var expression = p.task.divisor + ' × ' + p.quotient + (p.task.level === 'remainder' ? ' + ' + p.remainder : '');
        add(raw, baseIndex, p.baseActions.length,
          'Проверь деление: вычисли ' + expression + '.',
          expression + ' = ' + p.task.dividend + '. Получили исходное делимое, значит, деление выполнено верно.',
          'Проверка: ' + expression + ' = ' + p.task.dividend,
          [expression + ' = ' + p.task.dividend, 'Получили исходное делимое.'],
          [p.task.level === 'remainder' ? 'Умножаем частное на делитель и прибавляем остаток.' : 'Умножаем частное на делитель.']);
      }
    });

    return { topicId: topicId, index: index, kind: 'division',
      prompt: 'Вычисли уголком: ' + p.task.dividend + ' : ' + p.task.divisor + (p.task.level === 'remainder' ? '. Найди частное и остаток.' : '.'),
      answer: p.task.level === 'remainder' ? p.quotient + ' (ост. ' + p.remainder + ')' : p.quotient,
      steps: steps,
      division: Object.assign({}, p, { actions: steps.map(function (step) { return step.raw; }) }),
      divisionPresentation: { version: 1, checkpoints: checkpoints } };
  }
  return { topics: topics, make: make };
}));
