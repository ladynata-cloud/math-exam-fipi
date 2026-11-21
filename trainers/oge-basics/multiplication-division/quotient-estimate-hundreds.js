(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./quotient-estimate-core.js'));
  else root.QuotientEstimateHundreds = factory(root.QuotientEstimate);
})(typeof globalThis === 'undefined' ? this : globalThis, function(core) {
  'use strict';

  const examples = [
    [364,52], [138,46], [159,53], [198,24], [1242,348], [1799,251],
    [386,52], [249,48], [274,48], [145,23], [284,58], [457,102],
    [1799,248], [1774,279], [3186,415], [4807,598], [5581,684], [3203,841],
    [350,46], [150,39], [850,96], [995,182]
  ];

  function make(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw Error('Некорректный вариант задания.');
    const [n,d] = examples[(seed === 0 ? 0 : seed - 1) % examples.length];
    const steps = [];
    function add(kind, prompt, answer, hint, record) {
      steps.push({kind, prompt, answer: String(answer), hint,
        error: 'Проверь это действие ещё раз. Если трудно, нажми «Подсказка».', record});
    }
    function round(value, place, prefix) {
      const nextDigit = Math.floor(value / (place / 10)) % 10;
      const rounded = Math.floor((value + place / 2) / place) * place;
      const target = place === 100 ? 'до сотен' : 'до десятков';
      const digitName = place === 100 ? 'Цифра десятков' : 'Цифра единиц';
      const middle = place === 100 ? 'десятки и единицы' : 'единицы';
      const placeName = place === 100 ? 'сотен' : 'десятков';
      const change = (nextDigit < 5 ? 'Оставь цифру ' : 'Увеличь цифру ') + placeName + (nextDigit < 5 ? '.' : ' на 1.');
      add('round', prefix + ' ' + value + ' ' + target + '.', rounded,
        digitName + ' — ' + nextDigit + '. ' + change + ' Замени ' + middle + ' нулями. Получается ' + rounded + '.',
        'Для прикидки: ' + value + ' → ' + rounded + '.');
      return rounded;
    }

    const divisorPlace = d < 100 ? 10 : 100;
    const roundedD = round(d, divisorPlace, 'Округли');
    const roundedN = round(n, 100, 'Теперь округли');
    const estimate = roundedN / roundedD;
    if (!Number.isInteger(estimate)) throw Error('В этом режиме круглые числа должны делиться без остатка.');
    let trial = Math.min(9, estimate);
    add('estimate', 'Прикинь: ' + roundedN + ' : ' + roundedD + ' = ?', estimate,
      'У круглых чисел можно убрать ' + (divisorPlace === 100 ? 'по два нуля' : 'по одному нулю') + ': ' +
      roundedN / divisorPlace + ' : ' + roundedD / divisorPlace + ' = ' + estimate + '. Это пока только прикидка.',
      'Прикидка: ' + roundedN + ' : ' + roundedD + ' = ' + estimate + '.');
    add('digit', estimate > 9 ? 'Прикидка дала число из двух цифр. Нам нужна одна цифра. Какую самую большую цифру попробуем?' :
      'Какую цифру попробуем первой? Возьми её из прикидки.', trial,
      estimate > 9 ? 'Самая большая цифра — 9. Начнём с неё и проверим.' :
        'Прикидка дала ' + estimate + '. Попробуем эту цифру, затем проверим по исходным числам.',
      'Первая проба: ' + trial + '.');

    function product(candidate) {
      const result = candidate * d;
      const multiplication = candidate + ' × ' + d + ' = ' + result;
      const comparison = result > n ? 'больше' : result < n ? 'меньше' : 'ровно';
      add('product', 'Проверь по исходному числу: ' + candidate + ' × ' + d + ' = ?', result,
        multiplication + '. Сравни результат с ' + n + '.', multiplication + ' — ' + comparison + ' ' + n + '.');
      return result;
    }
    let result = product(trial);
    if (result > n) {
      // The last rejected product already proves that the lower fitting digit is maximal.
      while (result > n) {
        const next = trial - 1;
        add('digit', result + ' больше ' + n + '. Уменьши проверенную цифру на 1. Какую цифру попробуем?', next,
          'Пробовали ' + trial + '. Уменьшаем на 1: ' + trial + ' − 1 = ' + next + '.',
          'Уменьшаем пробу: ' + trial + ' → ' + next + '.');
        trial = next;
        result = product(trial);
      }
    } else {
      while (result < n && trial < 9) {
        const next = trial + 1;
        add('digit', result + ' меньше ' + n + '. Проверим, можно ли больше. Увеличь проверенную цифру на 1.', next,
          'Пробовали ' + trial + '. Увеличиваем на 1: ' + trial + ' + 1 = ' + next + '.',
          'Проверяем следующую цифру: ' + trial + ' → ' + next + '.');
        const nextProduct = product(next);
        if (nextProduct > n) break;
        trial = next;
        result = nextProduct;
      }
    }

    const exact = trial + ' × ' + d + ' = ' + result;
    const proof = result === n ? exact + ' — совпало точно.' : trial === 9 ?
      exact + ' — не больше ' + n + '. 9 — самая большая цифра.' :
      exact + ', а ' + (trial + 1) + ' × ' + d + ' = ' + (trial + 1) * d + ' — уже больше ' + n + '.';
    const conclusion = proof + ' Берём ' + trial + '.';
    add('digit', 'Проверка закончена. Какую одну цифру выбираем для ' + n + ' : ' + d + '?',
      trial, conclusion, conclusion);
    return {family: 'division', title: core.title,
      rule: 'Сначала прикинь на круглых числах. Затем умножь выбранную цифру на исходное число. Если много — уменьши цифру. Если можно больше — проверь следующую цифру.',
      task: {kind: 'input', prompt: 'Подбери одну цифру для ' + n + ' : ' + d + '. Сначала прикинь, затем проверь.'}, steps};
  }
  return Object.freeze({make});
});
