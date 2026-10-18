(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuotientEstimate = factory();
})(typeof globalThis === 'undefined' ? this : globalThis, function() {
  'use strict';
  const id = 'multiplication-division/quotient-estimate';
  const title = 'Деление: округляем и прикидываем';
  const rule = 'Сначала прикинь на круглых числах. Затем умножь выбранную цифру на исходное число. Если много — уменьши цифру. Если можно больше — проверь следующую цифру.';
  // The first examples introduce the different outcomes; later examples vary
  // the numbers. Every nonzero example has an exact rounded division.
  const examples = Object.freeze([
    [266,33], [84,21], [242,39], [184,26], [296,31], [64,14], [13,33],
    [84,37], [304,49], [246,46], [149,46], [150,27],
    [364,43], [86,32], [143,22], [241,34], [237,44],
    [244,25], [324,35], [235,25], [151,25], [207,25],
    [301,32], [303,34], [202,21], [303,33], [200,22],
    [177,24], [139,24], [269,34], [160,24], [135,23],
    [184,23], [150,30], [96,24], [164,41], [236,59]
  ].map(pair => Object.freeze(pair)));
  const round = value => Math.floor((value + 5) / 10) * 10;
  function roundHint(value) {
    const last = value % 10, rounded = round(value);
    return last === 0 ? value + ' уже оканчивается на 0. Оставь это число.'
      : 'Последняя цифра — ' + last + '. ' + (last < 5 ? 'Она меньше 5: берём предыдущее круглое число.' : 'Это 5 или больше: берём следующее круглое число.') + ' Получается ' + rounded + '.';
  }
  function plan(n, d) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d < 10 || d > 99 || n < 0 || n >= 10 * d) {
      throw Error('Нужен один шаг деления: целое число от 0 до 9 × второе число и ещё небольшой остаток.');
    }
    const steps = [];
    const add = (kind, prompt, answer, hint, record) => steps.push({kind, prompt, answer:String(answer), hint, error:'Проверь это действие ещё раз. Если трудно, нажми «Подсказка».', record});
    const digit = Math.floor(n / d);
    if (n < d) {
      add('product', 'Проверь самую маленькую ненулевую цифру: 1 × ' + d + ' = ?', d,
        'При умножении на 1 число не меняется: 1 × ' + d + ' = ' + d + '.', 'Пробуем 1: 1 × ' + d + ' = ' + d + ' — больше ' + n + '.');
      add('digit', 'Даже 1 × ' + d + ' больше ' + n + '. Какую цифру пишем на этом месте уголка?', 0,
        'Мы уже начали делить. После переноса очередной цифры получилось число меньше ' + d + '. На этом месте нужна цифра 0.', 'На этом месте уголка пишем 0. Затем можно перенести следующую цифру.');
      return {n,d,roundedN:null,roundedD:null,estimate:null,initialDigit:1,digit,steps};
    }
    const roundedN = round(n), roundedD = round(d);
    if (roundedN % roundedD !== 0) throw Error('В этом тренажёре круглые числа должны делиться без остатка.');
    const estimate = roundedN / roundedD, initialDigit = Math.min(9, estimate);
    add('round', 'Округли ' + d + ' до ближайшего числа с нулём на конце.', roundedD, roundHint(d), 'Для прикидки: ' + d + ' → ' + roundedD + '.');
    add('round', 'Теперь округли ' + n + ' до ближайшего числа с нулём на конце.', roundedN, roundHint(n), 'Для прикидки: ' + n + ' → ' + roundedN + '.');
    add('estimate', 'Прикинь: ' + roundedN + ' : ' + roundedD + ' = ?', estimate,
      'У круглых чисел можно убрать по одному нулю: ' + roundedN / 10 + ' : ' + roundedD / 10 + ' = ' + estimate + '. Это пока только прикидка.', 'Прикидка: ' + roundedN + ' : ' + roundedD + ' = ' + estimate + '.');
    add('digit', estimate > 9 ? 'Прикидка дала число из двух цифр. Нам нужна одна цифра. Какую самую большую цифру попробуем?' : 'Какую цифру попробуем первой? Возьми её из прикидки.', initialDigit,
      estimate > 9 ? 'Самая большая цифра — 9. Начнём с неё и проверим.' : 'Прикидка дала ' + estimate + '. Попробуем эту цифру, затем проверим по исходным числам.', 'Первая проба: ' + initialDigit + '.');
    let trial = initialDigit;
    const product = value => {
      const p = value * d;
      add('product', 'Проверь по исходному числу: ' + value + ' × ' + d + ' = ?', p,
        value + ' × ' + d + ' = ' + p + '. Сравни результат с ' + n + '.',
        value + ' × ' + d + ' = ' + p + (p > n ? ' — больше ' + n + '.' : p === n ? ' — ровно ' + n + '.' : ' — меньше ' + n + '.'));
      return p;
    };
    let p = product(trial);
    if (p > n) {
      // The last rejected trial proves that the next smaller successful trial
      // is maximal. Do not make the learner calculate that rejected row twice.
      while (p > n) {
        const next = trial - 1;
        add('digit', p + ' больше ' + n + '. Уменьши проверенную цифру на 1. Какую цифру попробуем?', next,
          'Пробовали ' + trial + '. Уменьшаем на 1: ' + trial + ' − 1 = ' + next + '.', 'Уменьшаем пробу: ' + trial + ' → ' + next + '.');
        trial = next; p = product(trial);
      }
    } else {
      // A product below n is not sufficient: check the next digit until it is
      // too large, or stop at equality / the largest possible digit.
      while (p < n && trial < 9) {
        const next = trial + 1;
        add('digit', p + ' меньше ' + n + '. Проверим, можно ли больше. Увеличь проверенную цифру на 1.', next,
          'Пробовали ' + trial + '. Увеличиваем на 1: ' + trial + ' + 1 = ' + next + '.', 'Проверяем следующую цифру: ' + trial + ' → ' + next + '.');
        const nextProduct = product(next);
        if (nextProduct > n) break;
        trial = next; p = nextProduct;
      }
    }
    const finalHint = trial * d === n ? trial + ' × ' + d + ' = ' + n + ' — совпало точно. Берём ' + trial + '.'
      : trial === 9 ? '9 × ' + d + ' = ' + 9 * d + ' — не больше ' + n + '. 9 — самая большая цифра. Берём 9.'
      : trial + ' × ' + d + ' = ' + trial * d + ', а ' + (trial + 1) + ' × ' + d + ' = ' + (trial + 1) * d + ' — уже больше ' + n + '. Берём ' + trial + '.';
    add('digit', 'Проверка закончена. Какую одну цифру выбираем для ' + n + ' : ' + d + '?', trial, finalHint, finalHint);
    return {n,d,roundedN,roundedD,estimate,initialDigit,digit,steps};
  }
  function lessons() {
    const lesson = (title, lead, html, prompt, answer, hint, good) => ({title,short:title,lead,html,question:{kind:'input',prompt,answer:String(answer),hint,good,bad:hint}});
    return [
      lesson('1. Округли', 'Для прикидки заменяем число близким круглым числом.', '<p>33 → 30, а 38 → 40. Если на конце 0, оставляем число.</p><p>На конце 1–4 — берём предыдущее круглое число. На конце 5–9 — следующее.</p>', 'Округли 47 до ближайшего числа с нулём на конце.', 50, 'Последняя цифра 7: берём следующее круглое число — 50.', '47 → 50. Теперь с числом проще прикидывать.'),
      lesson('2. Прикинь и проверь', 'Прикидка подсказывает, с какой цифры начать.', '<p>84 : 21 заменяем на 80 : 20.</p><p>80 : 20 = 4. Проверяем исходные числа: 4 × 21 = 84. Совпало точно.</p>', 'Для 122 : 31 округление дало 120 : 30. Какую цифру попробуем?', 4, '120 : 30 = 4. Сначала попробуем 4.', 'Да. Теперь надо проверить 4 × 31. Прикидка ещё не окончательный ответ.'),
      lesson('3. Если получилось много', 'Уменьши цифру на 1 и снова умножь.', '<p>266 : 33 → 270 : 30 = 9.</p><p>9 × 33 = 297 — много. 8 × 33 = 264 — подходит. Берём 8.</p>', 'Пробовали цифру 7. Получилось слишком много. Какую цифру попробуем теперь?', 6, 'Уменьши 7 на 1: получится 6.', 'Пробуем 6. Если всё ещё много, уменьшим ещё раз.'),
      lesson('4. Если можно больше', 'Проверь следующую цифру.', '<p>184 : 26 → 180 : 30 = 6.</p><p>6 × 26 = 156; 7 × 26 = 182; 8 × 26 = 208 — уже много. Берём 7.</p>', 'Пробовали цифру 5. Получилось меньше нужного числа. Какую следующую цифру проверим?', 6, 'Следующая после 5 цифра — 6.', 'Проверим 6. Не останавливаемся на первом маленьком результате.'),
      lesson('5. Нужна одна цифра', 'Прикидка иногда даёт 10 или больше.', '<p>296 : 31 → 300 : 30 = 10.</p><p>Нам нужна одна цифра. Начинаем с 9: 9 × 31 = 279. Берём 9.</p>', 'Прикидка дала 10. С какой самой большой цифры начнём проверку?', 9, 'Самая большая цифра — 9.', 'Начнём с 9 и умножим её на исходное число.'),
      lesson('6. Ноль внутри уголка', 'Мы уже начали делить и перенесли очередную цифру.', '<p>В делении 10032 : 33 после 100 − 99 переносим 3. Получается 13.</p><p>13 меньше 33. Здесь пишем 0, затем переносим 2. Получается 132.</p>', 'Внутри уголка после переноса получилось 12. Делим на 35. Какую цифру пишем на этом месте?', 0, 'Даже 1 × 35 больше 12. На этом месте пишем 0.', 'Пишем 0. Это место нельзя пропускать.')
    ];
  }
  function make(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw Error('Некорректный вариант задания.');
    const [n,d] = examples[(seed === 0 ? 0 : seed - 1) % examples.length];
    const p = plan(n,d);
    return {family:'division',title,rule,task:{kind:'input',prompt:n < d
      ? 'Внутри деления 10032 : 33 после 100 − 99 перенесли цифру 3. Получилось 13. Подбери одну цифру для этого места уголка.'
      : 'Подбери одну цифру для ' + n + ' : ' + d + '. Сначала прикинь, затем проверь.'},lessons:lessons(),steps:p.steps};
  }
  return Object.freeze({id,title,make,plan,examples});
});
