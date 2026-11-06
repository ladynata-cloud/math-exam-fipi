/* Original logarithm learning sequence. No pupil identity, account or board state.
 * Reference scope: FIPI preparation navigators (2026), basic numbers/equations
 * and profile expressions/equations/functions. These are authored examples,
 * not copies of or claims to be numbered FIPI examination items.
 * Every answer is fixed; audit descriptors are consumed only by independent
 * mathematical tests. Graph: y = sign * log_base(x - h) + k, x > h.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CollegeLogarithmsData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function frac(top, bottom) {
    return '<span class="fraction"><span class="top">' + top + '</span><span class="bottom">' + bottom + '</span></span>';
  }
  function numberHtml(value) {
    if (typeof value === 'string') return value;
    if (Number.isInteger(value)) return String(value).replace('-', '−');
    for (var q = 2; q <= 100; q++) {
      var p = Math.round(value * q);
      if (Math.abs(p / q - value) < 1e-10) return frac(String(p).replace('-', '−'), q);
    }
    return String(value).replace('-', '−').replace('.', ',');
  }
  function log(base, argument) { return 'log<sub>' + numberHtml(base) + '</sub>(' + argument + ')'; }
  function power(base, exponent) {
    var b = numberHtml(base);
    if (typeof base === 'number' && (base < 0 || !Number.isInteger(base))) b = '(' + b + ')';
    return b + '<sup>' + numberHtml(exponent) + '</sup>';
  }
  function linear(m, b) {
    var result = m === 1 ? 'x' : m === -1 ? '−x' : numberHtml(m) + 'x';
    return result + (b > 0 ? ' + ' + numberHtml(b) : b < 0 ? ' − ' + numberHtml(-b) : '');
  }
  function interval(lo, hi, loClosed, hiClosed) {
    return {lo: lo, hi: hi, loClosed: lo !== null && !!loClosed, hiClosed: hi !== null && !!hiClosed};
  }
  function intervalHtml(s) {
    return (s.loClosed ? '[' : '(') + (s.lo === null ? '−∞' : numberHtml(s.lo)) + '; ' +
      (s.hi === null ? '+∞' : numberHtml(s.hi)) + (s.hiClosed ? ']' : ')');
  }
  function params(base, h, k, sign) { return {base: base, h: h || 0, k: k || 0, sign: sign || 1}; }
  function graphFormula(p) {
    return (p.sign === -1 ? '−' : '') + log(p.base, linear(1, -p.h)) +
      (p.k > 0 ? ' + ' + numberHtml(p.k) : p.k < 0 ? ' − ' + numberHtml(-p.k) : '');
  }
  function graph(p, points, showCurve) {
    return Object.assign({}, p, {points: points || [], showCurve: !!showCurve});
  }

  // Numeric expression descriptions contain no executable strings.
  var X = {op: 'variable'};
  function L(base, value) { return {op: 'log', base: base, value: value}; }
  function P(base, exponent) { return {op: 'power', base: base, exponent: exponent}; }
  function A(left, right) { return {op: 'add', left: left, right: right}; }
  function S(left, right) { return {op: 'subtract', left: left, right: right}; }
  function M(left, right) { return {op: 'multiply', left: left, right: right}; }
  function Q(left, right) { return {op: 'divide', left: left, right: right}; }
  function lin(m, b) { return A(M(m || 0, X), b || 0); }
  function valueAudit(expression) { return {type: 'value', expression: expression}; }
  function equationAudit(left, right) { return {type: 'equation', left: left, right: right}; }
  function predicate(relation, left, right) { return {relation: relation, left: left, right: right}; }
  function option(value, labelHtml) { return {value: value, labelHtml: labelHtml}; }
  function choice(prompt, options, answer, hint, explanation) {
    return {kind: 'choice', prompt: prompt, options: options, answer: answer, hint: hint, explanation: explanation};
  }
  function numeric(prompt, answer, hint, explanation, audit) {
    return {kind: 'number', prompt: prompt, answer: answer, hint: hint, explanation: explanation, _audit: audit};
  }
  function setStep(prompt, answer, hint, explanation, condition) {
    return {kind: 'interval', prompt: prompt, answer: answer, hint: hint, explanation: explanation,
      _audit: {type: 'set', condition: condition}};
  }
  function pointStep(point, hint) {
    return {kind: 'point', prompt: 'Для x = ' + String(point.x).replace('.', ',') + ' найдите y, затем отметьте точку или введите обе координаты.',
      promptHtml: 'Для x = ' + numberHtml(point.x) + ' найдите y. Отметьте точку или введите её координаты.',
      answer: {x: point.x, y: point.y}, hint: hint,
      explanation: 'Получилась точка (' + numberHtml(point.x) + '; ' + numberHtml(point.y) + ').', _audit: {type: 'point'}};
  }
  function transformStep(answer) {
    return {kind: 'transform', prompt: 'Сохраните основание исходного графика. Настройте сдвиги и отражение по формуле задания.',
      answer: Object.assign({}, answer),
      hint: 'В записи x − h число h задаёт горизонтальный сдвиг. Число k снаружи задаёт сдвиг по вертикали. Минус перед логарифмом отражает график относительно Ox.',
      explanation: 'Параметры соответствуют заданной формуле.', _audit: {type: 'transform'}};
  }

  var modules = [
    {id: 'diagnostic', title: 'С чего начать', kind: 'diagnostic', summary: '6 коротких вопросов о степенях, уравнении и координатах.',
      lessonHtml: '<p>Попробуйте решить самостоятельно. Здесь проверяем необходимые навыки перед логарифмами.</p>'},
    {id: 'meaning', title: '1. Смысл логарифма', kind: 'learn', summary: 'В какую степень нужно возвести основание?',
      lessonHtml: '<p>' + log('a', 'b') + ' = c означает ' + power('a', 'c') + ' = b.</p><p>Сначала найдите основание a, затем спросите: «В какую степень его возвести, чтобы получить b?»</p><p>Вспомним степени при a &gt; 0: ' + power('a', 0) + ' = 1; ' + power('a', '−n') + ' = ' + frac(1, power('a', 'n')) + '; ' + power('a', 0.5) + ' = √a.</p>'},
    {id: 'domain', title: '2. Когда логарифм существует', kind: 'learn', summary: 'Основание положительно и не равно 1; аргумент строго положителен.',
      lessonHtml: '<p>Для ' + log('a', 'b') + ' нужны три условия: <b>a &gt; 0, a ≠ 1, b &gt; 0</b>.</p><p>ОДЗ — область допустимых значений. Ноль под логарифмом запрещён, поэтому граница часто не входит в ответ.</p>'},
    {id: 'product', title: '3. Произведение и частное', kind: 'learn', summary: 'Собираем сумму или разность в один логарифм.',
      lessonHtml: '<p>При u &gt; 0 и v &gt; 0: ' + log('a', 'u') + ' + ' + log('a', 'v') + ' = ' + log('a', 'uv') + '.</p><p>' + log('a', 'u') + ' − ' + log('a', 'v') + ' = ' + log('a', frac('u', 'v')) + '.</p><p>Основания должны быть одинаковыми. Для ' + log('a', 'u + v') + ' такого правила сложения нет.</p>'},
    {id: 'powers', title: '4. Степень и тождества', kind: 'learn', summary: 'Выносим показатель и узнаём взаимно обратные действия.',
      lessonHtml: '<p>При u &gt; 0: ' + log('a', power('u', 'r')) + ' = r·' + log('a', 'u') + '.</p><p>' + log('a', power('a', 't')) + ' = t; ' + power('a', log('a', 'b')) + ' = b при b &gt; 0.</p><p>У всех оснований a &gt; 0, a ≠ 1. Условие u &gt; 0 при вынесении показателя нельзя терять.</p>'},
    {id: 'change-base', title: '5. Другое основание', kind: 'learn', summary: 'Связываем основания 2, 4, 8 и упрощаем отношения.',
      lessonHtml: '<p>' + log('a', 'b') + ' = ' + frac(log('c', 'b'), log('c', 'a')) + '.</p><p>В знаменатель идёт старое основание a. Нужно a &gt; 0, a ≠ 1, b &gt; 0, c &gt; 0, c ≠ 1.</p>'},
    {id: 'graph-up', title: '6. Возрастающий график', kind: 'learn', summary: 'Строим по точкам при основании больше 1.',
      lessonHtml: '<p>У y = ' + log('a', 'x') + ' при a &gt; 1 удобны точки (1; 0), (a; 1), (' + power('a', 2) + '; 2).</p><p>График идёт вверх слева направо. Он существует только при x &gt; 0; прямая x = 0 — асимптота, а не часть графика.</p>'},
    {id: 'graph-down', title: '7. Убывающий график', kind: 'learn', summary: 'Что меняется при основании между 0 и 1?',
      lessonHtml: '<p>При 0 &lt; a &lt; 1 график y = ' + log('a', 'x') + ' убывает. Точка (1; 0) остаётся.</p><p>Например, у основания ' + frac(1, 2) + ' увеличение x вдвое уменьшает y на 1. Область определения по-прежнему x &gt; 0.</p>'},
    {id: 'graph-moves', title: '8. Сдвиги и отражение', kind: 'learn', summary: 'Меняем график и следим за опорной точкой и асимптотой.',
      lessonHtml: '<p>В y = ' + log('a', 'x − h') + ' + k число h сдвигает график вправо, если h &gt; 0; число k поднимает его, если k &gt; 0.</p><p>Новая опорная точка — (h + 1; k), асимптота — x = h. Минус перед логарифмом отражает график относительно Ox.</p>'},
    {id: 'equations', title: '9. Первые уравнения', kind: 'learn', summary: 'Переводим логарифм в степень и проверяем корень.',
      lessonHtml: '<p>' + log('a', 'f(x)') + ' = c равносильно f(x) = ' + power('a', 'c') + ' при допустимом постоянном основании.</p><p>Сначала запишите f(x) &gt; 0. Затем найдите x и проверьте его в исходном выражении.</p>'},
    {id: 'equal-logs', title: '10. Равенство логарифмов', kind: 'learn', summary: 'Сравниваем аргументы при одинаковых основаниях.',
      lessonHtml: '<p>' + log('a', 'u') + ' = ' + log('a', 'v') + ' означает u = v, но оба аргумента должны быть положительными.</p><p>Равенство аргументов работает и при 0 &lt; a &lt; 1. Полученный корень обязательно проверьте по ОДЗ.</p>'},
    {id: 'property-equations', title: '11. Уравнения через свойства', kind: 'learn', summary: 'Собираем логарифмы, решаем и отбрасываем лишние корни.',
      lessonHtml: '<p>Запишите ОДЗ каждого исходного логарифма. Объедините сумму в произведение, разность — в частное.</p><p>После решения вернитесь к исходным ограничениям: положительное произведение не гарантирует, что каждый его множитель положителен.</p>'},
    {id: 'inequalities', title: '12. Простые неравенства', kind: 'learn', summary: 'Сопоставляем основание, график и числовую прямую.',
      lessonHtml: '<p>При a &gt; 1 знак при переходе от логарифмов к аргументам сохраняется. При 0 &lt; a &lt; 1 он меняется на противоположный.</p><p>Пересеките результат с ОДЗ. Строгая граница — пустая точка; допустимая граница со знаком ≤ или ≥ — закрашенная.</p>'},
    {id: 'base', title: 'Проверка: базовый ЕГЭ', kind: 'base', summary: '12 новых заданий: вычисления и небольшие уравнения.',
      lessonHtml: '<p>Работайте самостоятельно. Введите короткий числовой ответ. Подсказки доступны в учебных темах.</p>'},
    {id: 'profile', title: 'Проверка: профиль, краткий ответ', kind: 'profile', summary: '12 новых заданий: выражения, уравнения и графики.',
      lessonHtml: '<p>По четыре задания на преобразования, уравнения и чтение графика. В ответе нужно число; решение можно записать на доске или в тетради.</p>'}
  ];
  var tasks = [];
  function add(moduleId, index, title, promptHtml, promptText, steps, extra) {
    var task = Object.assign({id: moduleId + '-' + String(index).padStart(2, '0'), moduleId: moduleId,
      title: title, promptHtml: promptHtml, promptText: promptText, steps: steps}, extra || {});
    var checks = [];
    steps.forEach(function (s, i) {
      s.id = 's' + (i + 1);
      if (s._audit) { checks.push(Object.assign({step: s.id}, s._audit)); delete s._audit; }
      if (s.options) {
        // Fixed rotation avoids both answer-position clues and cross-client RNG.
        var shift = (index + i) % s.options.length;
        s.options = s.options.slice(shift).concat(s.options.slice(0, shift));
      }
    });
    task.audit = {checks: checks};
    tasks.push(task);
    return task;
  }

  // Six prerequisite checks. These do not expose help in assessment mode.
  [
    ['Степень', power(2, 3), 'Вычислите 2 в третьей степени.', 8, P(2, 3), '2·2·2 = 8.'],
    ['Нулевая степень', power(7, 0), 'Вычислите 7 в нулевой степени.', 1, P(7, 0), 'Ненулевое число в нулевой степени равно 1.'],
    ['Отрицательный показатель', power(2, -2), 'Вычислите 2 в степени минус 2.', 0.25, P(2, -2), 'Отрицательный показатель переводит степень в знаменатель: ' + frac(1, power(2, 2)) + ' = ' + frac(1, 4) + '.'],
    ['Квадратный корень', '√81', 'Найдите арифметический квадратный корень из 81.', 9, P(81, 0.5), '9² = 81, арифметический корень неотрицателен.'],
    ['Линейное уравнение', '3x + 2 = 14', 'Решите уравнение 3x + 2 = 14.', 4, Q(S(14, 2), 3), '3x = 12, откуда x = 4.'],
    ['Координаты', 'A(2; −1)', 'У точки A координаты (2; −1). Найдите её абсциссу x.', 2, 2, 'Первое число в паре — абсцисса x, второе — ордината y.']
  ].forEach(function (row, i) {
    add('diagnostic', i + 1, row[0], row[1], row[2], [numeric(i === 4 ? 'Введите найденное значение x.' : i === 5 ? 'Введите абсциссу точки A.' : 'Введите значение выражения.', row[3], '', row[5], valueAudit(row[4]))]);
  });

  [
    {a: 2, b: 8, answer: 3}, {a: 3, b: 9, answer: 2}, {a: 5, b: 1, answer: 0},
    {a: 7, b: 7, answer: 1}, {a: 2, b: 0.125, answer: -3}, {a: 9, b: 3, answer: 0.5}
  ].forEach(function (q, i) {
    add('meaning', i + 1, 'Найдите показатель', log(q.a, numberHtml(q.b)), 'Вычислите логарифм по определению.', [
      choice('Какое равенство нужно решить, если искомый логарифм обозначен t?', [
        option('definition', power(q.a, 't') + ' = ' + numberHtml(q.b)),
        option('swap', q.a === q.b ? power(q.a, q.b) + ' = t' : power(q.b, 't') + ' = ' + numberHtml(q.a)),
        option('multiply', numberHtml(q.a) + (q.b / q.a === q.answer ? ' + t = ' : '·t = ') + numberHtml(q.b))
      ], 'definition', 'Основание логарифма становится основанием степени, а результат логарифма — показателем.',
      'Нужно найти показатель t в равенстве ' + power(q.a, 't') + ' = ' + numberHtml(q.b) + '.'),
      numeric('Введите значение логарифма — показатель t.', q.answer,
        i === 2 ? 'Вспомните, какая степень любого положительного основания даёт 1.' :
        i === 4 ? 'Представьте дробь как единицу, делённую на степень основания. Показатель будет отрицательным.' :
        i === 5 ? 'Основание 9 равно 3². Подумайте, какой показатель вернёт число 3.' : 'Подбирайте показатель степени, а не множитель.',
        power(q.a, q.answer) + ' = ' + numberHtml(q.b) + ', поэтому логарифм равен ' + numberHtml(q.answer) + '.', valueAudit(L(q.a, q.b)))
    ]);
  });

  add('domain', 1, 'Допустимый логарифм', log('a', 'b'), 'Выберите допустимые основание a и аргумент b.', [
    choice('Какое число может быть основанием a?', [option('two', '2'), option('one', '1'), option('zero', '0'), option('negative', '−2')], 'two',
      'Основание должно быть положительным и отличаться от 1.', 'Основание 2 положительно и не равно 1.'),
    choice('Какое число может стоять под логарифмом?', [option('positive', '1'), option('zero', '0'), option('negative', '−5')], 'positive',
      'Аргумент должен быть строго больше нуля.', 'Аргумент 1 разрешён. Логарифм 1 равен нулю.')
  ]);
  add('domain', 2, 'Дробное основание', log('a', 'b'), 'Выберите допустимый логарифм с дробным основанием.', [
    choice('Какое основание разрешено?', [option('half', frac(1, 2)), option('one', '1'), option('zero', '0'), option('negative', '−' + frac(1, 2))], 'half',
      'Основание может быть меньше 1, если оно остаётся положительным.', 'Основание ' + frac(1, 2) + ' допустимо: оно между 0 и 1.'),
    choice('Какой аргумент разрешён при этом основании?', [option('positive', frac(1, 4)), option('zero', '0'), option('negative', '−3')], 'positive',
      'Требование к аргументу не меняется при дробном основании.', 'Положительная дробь под логарифмом разрешена.')
  ]);
  [
    {a: 2, m: 1, b: -3, domain: interval(3, null)},
    {a: 0.5, m: -1, b: 5, domain: interval(null, 5)},
    {a: 3, m: 2, b: 4, domain: interval(-2, null)},
    {a: 4, m: -2, b: 3, domain: interval(null, 1.5)}
  ].forEach(function (q, i) {
    var argument = linear(q.m, q.b);
    add('domain', i + 3, 'Найдите ОДЗ', log(q.a, argument), 'Найдите область допустимых значений x для логарифма.', [
      choice('Какое условие нужно наложить на аргумент?', [
        option('positive', argument + ' &gt; 0'), option('nonnegative', argument + ' ≥ 0'), option('nonzero', argument + ' ≠ 0')
      ], 'positive', 'Логарифм нуля и логарифм отрицательного числа в этом курсе не определены.', 'Нужно строгое неравенство ' + argument + ' &gt; 0.'),
      setStep('Введите промежуток допустимых значений x.', q.domain,
        q.m < 0 ? 'При делении неравенства на отрицательное число поменяйте его знак. Граничную точку не включайте.' : 'Решите полученное линейное неравенство. Граничную точку не включайте.',
        'ОДЗ: x ∈ ' + intervalHtml(q.domain) + '.', predicate('>', lin(q.m, q.b), 0))
    ]);
  });

  [
    {a: 2, u: 4, v: 8, operation: '+', argument: 32, answer: 5},
    {a: 3, u: 27, v: 3, operation: '−', argument: 9, answer: 2},
    {a: 5, u: 2, v: 12.5, operation: '+', argument: 25, answer: 2},
    {a: 2, u: 24, v: 3, operation: '−', argument: 8, answer: 3},
    {a: 3, u: 2, v: 4.5, operation: '+', argument: 9, answer: 2}
  ].forEach(function (q, i) {
    var plus = q.operation === '+';
    var expression = (plus ? A : S)(L(q.a, q.u), L(q.a, q.v));
    add('product', i + 1, plus ? 'Сумма логарифмов' : 'Разность логарифмов', log(q.a, numberHtml(q.u)) + ' ' + q.operation + ' ' + log(q.a, numberHtml(q.v)),
      'Объедините логарифмы и вычислите значение.', [
        choice('Как объединить аргументы?', [
          option('multiply', log(q.a, numberHtml(q.u) + '·' + numberHtml(q.v))),
          option('divide', log(q.a, frac(numberHtml(q.u), numberHtml(q.v)))),
          option('combine-wrong', log(q.a, numberHtml(q.u) + (plus ? ' + ' : ' − ') + numberHtml(q.v)))
        ], plus ? 'multiply' : 'divide', 'Сумме логарифмов соответствует произведение, разности — частное. Основания здесь одинаковы.',
        'После объединения получаем ' + log(q.a, numberHtml(q.argument)) + '.'),
        numeric('Введите значение всего выражения.', q.answer, 'Теперь найдите показатель степени основания.',
          'Значение выражения равно ' + numberHtml(q.answer) + '.', valueAudit(expression))
      ]);
  });
  add('product', 6, 'Три логарифма', log(2, 3) + ' + ' + log(2, frac(8, 3)) + ' − ' + log(2, 2),
    'Вычислите сумму и разность трёх логарифмов.', [
      numeric('Введите аргумент после объединения трёх логарифмов в один.', 4,
        'Сначала перемножьте аргументы двух слагаемых, затем разделите на аргумент вычитаемого.',
        'Общий аргумент: ' + frac('3·' + frac(8, 3), 2) + ' = 4.', valueAudit(Q(M(3, Q(8, 3)), 2))),
      numeric('Введите значение всего выражения.', 2, 'Остался логарифм числа 4 по основанию 2.', 'Получаем ' + log(2, 4) + ' = 2.',
        valueAudit(S(A(L(2, 3), L(2, Q(8, 3))), L(2, 2))))
    ]);

  [
    {a: 2, u: 8, r: 2, answer: 6}, {a: 3, u: 9, r: 3, answer: 6}
  ].forEach(function (q, i) {
    add('powers', i + 1, 'Выносим показатель', log(q.a, power(q.u, q.r)), 'Вычислите логарифм степени.', [
      choice('Как правильно вынести показатель?', [option('coefficient', numberHtml(q.r) + '·' + log(q.a, numberHtml(q.u))),
        option('power', power(log(q.a, numberHtml(q.u)), q.r)), option('sum', log(q.a, numberHtml(q.u)) + ' + ' + numberHtml(q.r))], 'coefficient',
      'Показатель степени становится множителем перед логарифмом.', 'Применяем свойство степени при положительном аргументе.'),
      numeric('Введите значение выражения.', q.answer, 'Сначала вычислите логарифм без степени, затем умножьте на вынесенный показатель.',
        'Значение равно ' + q.answer + '.', valueAudit(L(q.a, P(q.u, q.r))))
    ]);
  });
  add('powers', 3, 'Степень своего основания', log(5, power(5, -2)), 'Вычислите логарифм степени своего основания.', [
    choice('Какое действие выполняет этот логарифм?', [option('exponent', 'Возвращает показатель степени'), option('base', 'Возвращает основание степени'), option('square', 'Возводит результат в квадрат')], 'exponent',
      'Логарифм спрашивает, какой показатель уже стоит у основания 5.', 'Логарифм и степень с тем же основанием — взаимно обратные действия.'),
    numeric('Введите значение логарифма.', -2, 'Показатель может быть отрицательным; это не делает аргумент отрицательным.', 'Значение равно −2.', valueAudit(L(5, P(5, -2))))
  ]);
  add('powers', 4, 'Степень с логарифмом', power(2, log(2, 7)), 'Вычислите степень с логарифмом в показателе.', [
    choice('Какое условие позволяет использовать основное тождество?', [option('same', 'Основание степени совпадает с основанием логарифма'), option('seven', 'Число 7 больше основания'), option('integer', 'Показатель обязательно целый')], 'same',
      'Сравните два основания в выражении.', 'Здесь оба основания равны 2, а аргумент 7 положителен.'),
    numeric('Введите значение всей степени.', 7, 'По определению логарифма степень с таким показателем возвращает аргумент.', 'Получаем 7.', valueAudit(P(2, L(2, 7))))
  ]);
  add('powers', 5, 'Корень как степень', log(4, '√4'), 'Вычислите логарифм квадратного корня.', [
    choice('Как записать квадратный корень в виде степени?', [option('half', power(4, 0.5)), option('two', power(4, 2)), option('negative', power(4, -1))], 'half',
      'Квадратный корень соответствует показателю, который при умножении на 2 даёт 1.', '√4 = ' + power(4, 0.5) + '.'),
    numeric('Введите значение логарифма.', 0.5, 'Основания степени и логарифма совпадают.', 'Значение равно ' + frac(1, 2) + '.', valueAudit(L(4, P(4, 0.5))))
  ]);
  add('powers', 6, 'Не потеряйте условие', log(2, '(−3)²') + ' и 2·' + log(2, '−3'), 'Можно ли вынести показатель степени при отрицательном числе?', [
    numeric('Чему равен аргумент первого логарифма? Введите число (−3)².', 9, 'Возведение отрицательного числа в квадрат даёт положительное число.',
      'Первый аргумент равен 9, поэтому первый логарифм существует.', valueAudit(P(-3, 2))),
    choice('Можно ли заменить первое выражение вторым?', [option('no', 'Нет: во втором выражении логарифм отрицательного числа'), option('yes', 'Да: показатель всегда можно вынести'), option('neither', 'Нет: оба выражения не существуют')], 'no',
      'Проверьте аргумент каждого логарифма отдельно. У формулы вынесения показателя есть условие u > 0.',
      'Первое выражение существует, второе — нет. Свойство ' + log('a', power('u', 'r')) + ' = r·' + log('a', 'u') + ' в таком виде требует u &gt; 0.')
  ]);

  [
    {a: 4, b: 16, c: 2, numerator: 4, denominator: 2, answer: 2},
    {a: 8, b: 4, c: 2, numerator: 2, denominator: 3, answer: 2 / 3},
    {a: 9, b: 3, c: 3, numerator: 1, denominator: 2, answer: 0.5},
    {a: 0.5, b: 8, c: 2, numerator: 3, denominator: -1, answer: -3}
  ].forEach(function (q, i) {
    add('change-base', i + 1, 'Переходим к удобному основанию', log(q.a, numberHtml(q.b)), 'Вычислите логарифм через другое основание.', [
      choice('Как выглядит переход к основанию ' + q.c + '?', [
        option('correct', frac(log(q.c, numberHtml(q.b)), log(q.c, numberHtml(q.a)))),
        option('reverse', frac(log(q.c, numberHtml(q.a)), log(q.c, numberHtml(q.b)))),
        option('add', log(q.c, numberHtml(q.b)) + ' + ' + log(q.c, numberHtml(q.a)))
      ], 'correct', 'В числитель идёт логарифм аргумента, в знаменатель — логарифм старого основания.',
      'Получаем отношение ' + frac(numberHtml(q.numerator), numberHtml(q.denominator)) + '.'),
      numeric('Введите значение исходного логарифма.', q.answer, 'Вычислите числитель и знаменатель отдельно, затем разделите.',
        'Значение равно ' + numberHtml(q.answer) + '.', valueAudit(L(q.a, q.b)))
    ]);
  });
  add('change-base', 5, 'Взаимные логарифмы', log(2, 9) + '·' + log(3, 2), 'Вычислите произведение логарифмов.', [
    choice('Какая запись поможет сократить выражение?', [option('power', '2·' + log(2, 3) + '·' + log(3, 2)), option('add', log(2, 3) + ' + 2·' + log(3, 2)), option('one', log(2, 3) + '·' + log(3, 2))], 'power',
      'Представьте 9 как квадрат тройки.', 'Выносим показатель 2 из первого логарифма.'),
    numeric('Введите значение всего произведения.', 2, 'После перехода к одному основанию два взаимных логарифма дают произведение 1.',
      'Произведение равно 2.', valueAudit(M(L(2, 9), L(3, 2))))
  ]);
  add('change-base', 6, 'Отношение логарифмов', frac(log(5, 7), log(5, 49)), 'Вычислите отношение двух логарифмов.', [
    choice('Каким одним логарифмом можно заменить отношение?', [option('correct', log(49, 7)), option('reverse', log(7, 49)), option('difference', log(5, 42))], 'correct',
      'По формуле перехода старое основание определяется логарифмом в знаменателе.', 'Это ' + log(49, 7) + '.'),
    numeric('Введите значение отношения.', 0.5, 'Число 49 — квадрат числа 7.', 'Значение равно ' + frac(1, 2) + '.', valueAudit(Q(L(5, 7), L(5, 49))))
  ]);

  function plotTask(moduleId, index, p, points, conclusion) {
    var steps = points.map(function (point) {
      return pointStep(point, 'Найдите показатель, в который нужно возвести основание, чтобы получить x. Первая координата точки — x, вторая — y.');
    });
    steps.push(conclusion);
    return add(moduleId, index, 'Постройте график по точкам', 'y = ' + graphFormula(p),
      'Вычислите координаты опорных точек и исследуйте логарифмический график.', steps,
      {graph: graph(p, points, false)});
  }
  plotTask('graph-up', 1, params(2), [{x: 1, y: 0}, {x: 2, y: 1}, {x: 4, y: 2}],
    numeric('При каком x график пересекает ось Ox? Введите x.', 1, 'На оси Ox ордината y равна нулю.',
      'Точка пересечения — (1; 0).', equationAudit(L(2, X), 0)));
  plotTask('graph-up', 2, params(3), [{x: 1 / 3, y: -1}, {x: 1, y: 0}, {x: 3, y: 1}],
    choice('Как ведёт себя функция при движении слева направо?', [option('up', 'Возрастает'), option('down', 'Убывает'), option('constant', 'Не меняется')], 'up',
      'Сравните ординаты отмеченных точек при увеличении x.', 'Основание 3 больше 1: функция возрастает.'));
  plotTask('graph-up', 3, params(4), [{x: 0.25, y: -1}, {x: 1, y: 0}, {x: 4, y: 1}],
    setStep('Введите область определения функции.', interval(0, null), 'Аргументом логарифма является x. Он должен быть строго положительным.',
      'Область определения — (0; +∞).', predicate('>', X, 0)));
  plotTask('graph-up', 4, params(2), [{x: 0.25, y: -2}, {x: 0.5, y: -1}, {x: 1, y: 0}],
    choice('Каков знак y при 0 < x < 1?', [option('negative', 'y < 0'), option('positive', 'y > 0'), option('zero', 'y = 0')], 'negative',
      'Посмотрите, где находятся точки слева от x = 1 относительно оси Ox.', 'При основании больше 1 и 0 &lt; x &lt; 1 логарифм отрицателен.'));
  plotTask('graph-up', 5, params(3), [{x: 1, y: 0}, {x: 3, y: 1}, {x: 9, y: 2}],
    choice('Есть ли у всего графика самая высокая точка?', [option('no', 'Нет: y может расти дальше'), option('two', 'Да: самая высокая точка имеет y = 2'), option('nine', 'Да: самая высокая точка имеет x = 9')], 'no',
      'Край рисунка — только граница видимой области. Для следующей точки можно взять ещё большую степень основания.',
      'У логарифма нет наибольшего значения. Видимое окно не ограничивает саму функцию.'));
  plotTask('graph-up', 6, params(5), [{x: 0.2, y: -1}, {x: 1, y: 0}, {x: 5, y: 1}],
    numeric('Каково число c в уравнении вертикальной асимптоты x = c?', 0,
      'График приближается к вертикальной границе своей области определения, но не касается её.',
      'Вертикальная асимптота — x = 0.', valueAudit(0)));

  plotTask('graph-down', 1, params(0.5), [{x: 0.5, y: 1}, {x: 1, y: 0}, {x: 2, y: -1}],
    choice('Как ведёт себя функция при увеличении x?', [option('down', 'Убывает'), option('up', 'Возрастает'), option('constant', 'Не меняется')], 'down',
      'Сравните y у точки с меньшим x и у точки с большим x.', 'Основание между 0 и 1: функция убывает.'));
  plotTask('graph-down', 2, params(1 / 3), [{x: 1 / 3, y: 1}, {x: 1, y: 0}, {x: 3, y: -1}],
    choice('Каков знак y при 0 < x < 1?', [option('positive', 'y > 0'), option('negative', 'y < 0'), option('zero', 'y = 0')], 'positive',
      'Сравните положение точек с x меньше 1 с осью Ox.', 'У этого убывающего графика слева от (1; 0) значения положительные.'));
  plotTask('graph-down', 3, params(0.25), [{x: 0.25, y: 1}, {x: 1, y: 0}, {x: 4, y: -1}],
    setStep('Введите область определения функции.', interval(0, null), 'Дробное основание не меняет требование положительности аргумента.',
      'Область определения — (0; +∞).', predicate('>', X, 0)));
  plotTask('graph-down', 4, params(0.5), [{x: 0.25, y: 2}, {x: 0.5, y: 1}, {x: 1, y: 0}],
    choice('Что происходит с y, когда положительный x приближается к нулю?', [option('up', 'y растёт'), option('down', 'y уменьшается'), option('zero', 'y стремится к нулю')], 'up',
      'Прочитайте отмеченные точки справа налево: x уменьшается, а что делает y?', 'При приближении x к нулю справа у этого графика y неограниченно растёт.'));
  plotTask('graph-down', 5, params(1 / 3), [{x: 1, y: 0}, {x: 3, y: -1}, {x: 9, y: -2}],
    choice('Сравните значения функции при x = 3 и x = 9.', [option('greater', 'f(3) > f(9)'), option('less', 'f(3) < f(9)'), option('equal', 'f(3) = f(9)')], 'greater',
      'На убывающем графике меньшему x соответствует больший y.', '−1 &gt; −2, поэтому f(3) &gt; f(9).'));
  plotTask('graph-down', 6, params(0.5), [{x: 0.5, y: 1}, {x: 1, y: 0}, {x: 4, y: -2}],
    choice('Как получить этот график из y = log₂x?', [option('ox', 'Отразить относительно оси Ox'), option('oy', 'Отразить относительно оси Oy'), option('shift', 'Сдвинуть вправо на 1')], 'ox',
      'Сравните значения двух функций при одном и том же положительном x. Ординаты противоположны.',
      log(0.5, 'x') + ' = −' + log(2, 'x') + ': меняется знак y, координата x остаётся.'));

  [
    {p: params(2, 2, 0, 1), action: 'right', label: 'Вправо на 2', wrong: ['Влево на 2', 'Вверх на 2'], anchor: {x: 3, y: 0}},
    {p: params(2, -2, 0, 1), action: 'left', label: 'Влево на 2', wrong: ['Вправо на 2', 'Вниз на 2'], anchor: {x: -1, y: 0}},
    {p: params(3, 0, 2, 1), action: 'up', label: 'Вверх на 2', wrong: ['Вправо на 2', 'Вниз на 2'], anchor: {x: 1, y: 2}},
    {p: params(2, 0, -1, 1), action: 'down', label: 'Вниз на 1', wrong: ['Влево на 1', 'Вверх на 1'], anchor: {x: 1, y: -1}},
    {p: params(2, 0, 0, -1), action: 'reflect', label: 'Отразить относительно Ox', wrong: ['Отразить относительно Oy', 'Сдвинуть влево на 1'], anchor: {x: 2, y: -1}},
    {p: params(0.5, 1, 1, 1), action: 'both', label: 'Вправо на 1 и вверх на 1', wrong: ['Влево на 1 и вверх на 1', 'Вправо на 1 и вниз на 1'], anchor: {x: 2, y: 1}}
  ].forEach(function (q, i) {
    var start = params(q.p.base, 0, 0, 1);
    add('graph-moves', i + 1, 'Преобразуйте исходный график', 'y = ' + graphFormula(q.p), 'Получите заданный график из исходного логарифмического графика.', [
      choice('Как нужно изменить исходный график?', [option(q.action, q.label), option('wrong-a', q.wrong[0]), option('wrong-b', q.wrong[1])], q.action,
        'Сдвиг внутри аргумента действует по горизонтали; слагаемое снаружи — по вертикали. Минус перед всей функцией меняет знак y.',
        'Нужно выполнить действие: ' + q.label.toLowerCase() + '.'),
      transformStep(q.p),
      pointStep(q.anchor, 'Примените то же преобразование к опорной точке исходного графика. После настройки проверьте обе координаты.')
    ], {graph: graph(start, [], true), targetGraph: q.p});
  });

  [
    {a: 2, m: 1, b: 0, c: 3, argument: 8, x: 8, domain: interval(0, null)},
    {a: 3, m: 1, b: -1, c: 2, argument: 9, x: 10, domain: interval(1, null)},
    {a: 5, m: 1, b: 2, c: 0, argument: 1, x: -1, domain: interval(-2, null)},
    {a: 0.5, m: 1, b: -1, c: -2, argument: 4, x: 5, domain: interval(1, null)},
    {a: 4, m: 2, b: 1, c: 0.5, argument: 2, x: 0.5, domain: interval(-0.5, null)},
    {a: 3, m: -1, b: 7, c: 1, argument: 3, x: 4, domain: interval(null, 7)}
  ].forEach(function (q, i) {
    var argument = linear(q.m, q.b);
    add('equations', i + 1, 'Перейдите к степени', log(q.a, argument) + ' = ' + numberHtml(q.c), 'Решите логарифмическое уравнение по определению.', [
      setStep('Введите ОДЗ: при каких x исходный аргумент положителен?', q.domain, 'Потребуйте, чтобы ' + argument + ' было строго больше нуля.',
        'ОДЗ: x ∈ ' + intervalHtml(q.domain) + '.', predicate('>', lin(q.m, q.b), 0)),
      numeric('Какому числу должен равняться аргумент логарифма? Введите это число.', q.argument,
        'Возведите основание логарифма в степень, указанную справа. Это значение аргумента, пока ещё не обязательно x.',
        argument + ' = ' + power(q.a, q.c) + ' = ' + numberHtml(q.argument) + '.', valueAudit(P(q.a, q.c))),
      numeric('Решите полученное линейное уравнение. Введите x.', q.x, 'Теперь найдите x из равенства для аргумента и проверьте ограничение первого шага.',
        'x = ' + numberHtml(q.x) + '; значение входит в ОДЗ.', equationAudit(L(q.a, lin(q.m, q.b)), q.c))
    ]);
  });

  [
    {a: 2, m1: 1, b1: 1, m2: 0, b2: 5, x: 4, domain: interval(-1, null)},
    {a: 3, m1: 2, b1: -1, m2: 1, b2: 3, x: 4, domain: interval(0.5, null)},
    {a: 0.5, m1: 1, b1: 4, m2: 3, b2: 0, x: 2, domain: interval(0, null)},
    {a: 5, m1: -1, b1: 9, m2: 1, b2: 1, x: 4, domain: interval(-1, 9)},
    {a: 4, m1: 5, b1: -2, m2: 2, b2: 7, x: 3, domain: interval(0.4, null)}
  ].forEach(function (q, i) {
    var left = linear(q.m1, q.b1), right = q.m2 === 0 ? numberHtml(q.b2) : linear(q.m2, q.b2);
    add('equal-logs', i + 1, 'Приравняйте аргументы', log(q.a, left) + ' = ' + log(q.a, right), 'Решите уравнение с логарифмами одного основания.', [
      setStep('Введите общую ОДЗ для обоих логарифмов.', q.domain, 'Оба аргумента должны быть положительными одновременно.',
        'Общая ОДЗ: ' + intervalHtml(q.domain) + '.', {all: [predicate('>', lin(q.m1, q.b1), 0), predicate('>', lin(q.m2, q.b2), 0)]}),
      choice('Какое уравнение получаем на ОДЗ?', [option('equal', left + ' = ' + right), option('opposite', left + ' = −(' + right + ')'), option('sum', left + ' + ' + right + ' = 0')], 'equal',
        'Равные логарифмы с одинаковым допустимым основанием имеют равные аргументы.', 'На ОДЗ приравниваем аргументы. У равенства знак не переворачивается и при дробном основании.'),
      numeric('Введите корень уравнения x, учитывая ОДЗ.', q.x, 'Решите линейное уравнение и подставьте x в оба исходных аргумента.',
        'x = ' + numberHtml(q.x) + '; оба аргумента положительны.', equationAudit(L(q.a, lin(q.m1, q.b1)), L(q.a, lin(q.m2, q.b2))))
    ]);
  });
  add('equal-logs', 6, 'Проверьте найденный корень', log(2, '3x − 1') + ' = ' + log(2, 'x − 3'), 'Решите уравнение и проверьте, существует ли его корень.', [
    setStep('Введите общую ОДЗ двух логарифмов.', interval(3, null), 'Нужно одновременно 3x − 1 > 0 и x − 3 > 0.',
      'Общая ОДЗ: x &gt; 3.', {all: [predicate('>', lin(3, -1), 0), predicate('>', lin(1, -3), 0)]}),
    numeric('Решите равенство аргументов 3x − 1 = x − 3. Введите найденное число.', -1,
      'Перенесите слагаемые с x в одну сторону, числа — в другую. Потом ещё понадобится проверка.',
      'Алгебраическое равенство даёт x = −1.', valueAudit(Q(S(-3, -1), 2))),
    choice('Каков ответ исходного логарифмического уравнения?', [option('none', 'Решений нет'), option('minus-one', 'x = −1'), option('three', 'x = 3')], 'none',
      'Найденный кандидат должен входить в ОДЗ первого шага.', 'Кандидат −1 не удовлетворяет x &gt; 3. У исходного уравнения решений нет.')
  ]);

  add('property-equations', 1, 'Сумма с известным логарифмом', log(2, 'x') + ' + ' + log(2, 4) + ' = 5', 'Решите уравнение через свойство суммы логарифмов.', [
    setStep('Введите ОДЗ исходного уравнения.', interval(0, null), 'Единственный неизвестный аргумент — x.', 'ОДЗ: x &gt; 0.', predicate('>', X, 0)),
    choice('Как объединить левую часть?', [option('product', log(2, '4x') + ' = 5'), option('sum', log(2, 'x + 4') + ' = 5'), option('quotient', log(2, frac('x', 4)) + ' = 5')], 'product',
      'Сумма логарифмов превращается в логарифм произведения.', 'Получаем ' + log(2, '4x') + ' = 5.'),
    numeric('Введите корень уравнения x.', 8, 'Перейдите к равенству 4x = 2⁵ и разделите обе части на 4.',
      'x = 8, аргумент положителен.', equationAudit(A(L(2, X), L(2, 4)), 5))
  ]);
  add('property-equations', 2, 'Разность с известным логарифмом', log(3, 'x') + ' − ' + log(3, 2) + ' = 2', 'Решите уравнение через свойство разности логарифмов.', [
    setStep('Введите ОДЗ исходного уравнения.', interval(0, null), 'Аргумент x должен быть положительным.', 'ОДЗ: x &gt; 0.', predicate('>', X, 0)),
    choice('Как объединить левую часть?', [option('quotient', log(3, frac('x', 2)) + ' = 2'), option('difference', log(3, 'x − 2') + ' = 2'), option('product', log(3, '2x') + ' = 2')], 'quotient',
      'Разности логарифмов соответствует частное аргументов.', 'Получаем ' + log(3, frac('x', 2)) + ' = 2.'),
    numeric('Введите корень уравнения x.', 18, 'После перехода к степени получается x, делённое на 2. Умножьте обе части равенства на 2.',
      'x = 18, аргумент положителен.', equationAudit(S(L(3, X), L(3, 2)), 2))
  ]);
  [
    {a: 2, b1: 1, b2: -1, c: 1, ratio: 2, x: 3},
    {a: 3, b1: 3, b2: -1, c: 1, ratio: 3, x: 3}
  ].forEach(function (q, i) {
    var u = linear(1, q.b1), v = linear(1, q.b2);
    add('property-equations', i + 3, 'Разность двух логарифмов', log(q.a, u) + ' − ' + log(q.a, v) + ' = ' + q.c,
      'Решите уравнение с разностью двух логарифмов.', [
        setStep('Введите общую ОДЗ.', interval(1, null), 'Каждый из двух исходных аргументов должен быть положительным.',
          'Общая ОДЗ: x &gt; 1.', {all: [predicate('>', lin(1, q.b1), 0), predicate('>', lin(1, q.b2), 0)]}),
        numeric('Какому числу равно частное аргументов после перехода к степени?', q.ratio,
          'Объедините разность в логарифм частного. Затем возведите основание в степень правой части.',
          frac(u, v) + ' = ' + numberHtml(q.ratio) + '.', valueAudit(P(q.a, q.c))),
        numeric('Решите полученное уравнение. Введите допустимый x.', q.x,
          'На ОДЗ знаменатель положителен и не равен нулю. Умножьте на него обе части и решите линейное уравнение.',
          'x = ' + q.x + '; оба исходных аргумента положительны.', equationAudit(S(L(q.a, lin(1, q.b1)), L(q.a, lin(1, q.b2))), q.c))
      ]);
  });
  [
    {a: 2, c: 3, product: 8, x: 4, excluded: -2},
    {a: 3, c: 1, product: 3, x: 3, excluded: -1}
  ].forEach(function (q, i) {
    add('property-equations', i + 5, 'Сумма двух логарифмов', log(q.a, 'x') + ' + ' + log(q.a, 'x − 2') + ' = ' + q.c,
      'Решите уравнение с суммой двух логарифмов и отберите корень.', [
        setStep('Введите общую ОДЗ двух исходных логарифмов.', interval(2, null), 'Нужны одновременно x > 0 и x − 2 > 0.',
          'Общая ОДЗ: x &gt; 2.', {all: [predicate('>', X, 0), predicate('>', lin(1, -2), 0)]}),
        choice('Как объединить сумму?', [option('product', log(q.a, 'x(x − 2)')), option('sum', log(q.a, '2x − 2')), option('quotient', log(q.a, frac('x', 'x − 2')))], 'product',
          'Сумме логарифмов соответствует произведение аргументов.', 'Получаем логарифм произведения x(x − 2); исходную ОДЗ сохраняем.'),
        numeric('Какому числу должно равняться произведение x(x − 2)?', q.product,
          'Возведите основание в степень правой части уравнения.', 'x(x − 2) = ' + q.product + '.', valueAudit(P(q.a, q.c))),
        numeric('Введите допустимый корень полученного квадратного уравнения.', q.x,
          'Перенесите всё в левую часть и разложите квадратный трёхчлен на множители. Из двух корней выберите тот, который больше 2.',
          'Кандидаты: ' + q.x + ' и ' + numberHtml(q.excluded) + '. По ОДЗ подходит только x = ' + q.x + '.',
          equationAudit(A(L(q.a, X), L(q.a, lin(1, -2))), q.c))
      ], {excludedCandidates: [q.excluded]});
  });

  [
    {a: 2, h: 0, c: 1, relation: '>', symbol: '&gt;', boundary: 2, answer: interval(2, null)},
    {a: 3, h: 1, c: 2, relation: '<=', symbol: '≤', boundary: 10, answer: interval(1, 10, false, true)},
    {a: 2, h: -2, c: 0, relation: '<', symbol: '&lt;', boundary: -1, answer: interval(-2, -1)},
    {a: 0.5, h: 0, c: 1, relation: '>', symbol: '&gt;', boundary: 0.5, answer: interval(0, 0.5)},
    {a: 0.5, h: 1, c: -1, relation: '>', symbol: '&gt;', boundary: 3, answer: interval(1, 3)},
    {a: 1 / 3, h: -2, c: -1, relation: '<=', symbol: '≤', boundary: 1, answer: interval(1, null, true, false)}
  ].forEach(function (q, i) {
    var argument = linear(1, -q.h), p = params(q.a, q.h);
    add('inequalities', i + 1, 'График и промежуток', log(q.a, argument) + ' ' + q.symbol + ' ' + numberHtml(q.c),
      'Решите простейшее логарифмическое неравенство.', [
        setStep('Сначала введите ОДЗ исходного неравенства.', interval(q.h, null), 'Аргумент логарифма должен быть строго положительным.',
          'ОДЗ: x &gt; ' + numberHtml(q.h) + '.', predicate('>', lin(1, -q.h), 0)),
        choice('Как меняется знак при переходе от логарифма к аргументу?', [option('same', 'Сохраняется'), option('reverse', 'Меняется на противоположный'), option('equal', 'Всегда заменяется знаком равенства')], q.a > 1 ? 'same' : 'reverse',
          'Определите, возрастает или убывает логарифм. Сравните основание с 1.',
          q.a > 1 ? 'Основание больше 1, график возрастает: знак сохраняется.' : 'Основание между 0 и 1, график убывает: знак меняется.'),
        numeric('Найдите x на пересечении графика с горизонтальной прямой. Введите граничное значение x.', q.boundary,
          'Для границы замените знак неравенства на равенство и используйте определение логарифма.',
          'Граница найдена: x = ' + numberHtml(q.boundary) + '.', equationAudit(L(q.a, lin(1, -q.h)), q.c)),
        setStep('Введите итоговый промежуток решений с учётом ОДЗ.', q.answer,
          'Выберите нужную сторону от границы, пересеките её с ОДЗ и проверьте, входит ли граничная точка.',
          'Ответ: ' + intervalHtml(q.answer) + '.', predicate(q.relation, L(q.a, lin(1, -q.h)), q.c))
      ], {graph: Object.assign(graph(p, [], true), {guideY: q.c})});
  });

  // Fresh assessments use one short-answer step, no assistance or explorer.
  [
    {html: log(2, 32), answer: 5, expr: L(2, 32)},
    {html: log(3, frac(1, 27)), answer: -3, expr: L(3, Q(1, 27))},
    {html: log(7, 1), answer: 0, expr: L(7, 1)},
    {html: log(5, 25), answer: 2, expr: L(5, 25)},
    {html: log(2, 6) + ' + ' + log(2, frac(16, 3)), answer: 5, expr: A(L(2, 6), L(2, Q(16, 3)))},
    {html: log(3, 81) + ' − ' + log(3, 3), answer: 3, expr: S(L(3, 81), L(3, 3))},
    {html: log(4, power(4, 3)), answer: 3, expr: L(4, P(4, 3))},
    {html: power(3, log(3, 5)), answer: 5, expr: P(3, L(3, 5))}
  ].forEach(function (q, i) {
    add('base', i + 1, 'Вычислите значение', q.html, 'Вычислите значение логарифмического выражения.', [
      numeric('Введите значение всего выражения.', q.answer, '', 'Значение равно ' + numberHtml(q.answer) + '.', valueAudit(q.expr))
    ]);
  });
  [
    {a: 2, m: 1, b: 3, c: 4, x: 13}, {a: 5, m: 2, b: -1, c: 1, x: 3},
    {a: 0.5, m: 1, b: 0, c: -3, x: 8}, {a: 3, m: -1, b: 10, c: 2, x: 1}
  ].forEach(function (q, i) {
    add('base', i + 9, 'Найдите корень', log(q.a, linear(q.m, q.b)) + ' = ' + numberHtml(q.c), 'Решите логарифмическое уравнение.', [
      numeric('Введите корень уравнения x.', q.x, '', 'Корень: x = ' + numberHtml(q.x) + '.', equationAudit(L(q.a, lin(q.m, q.b)), q.c))
    ]);
  });
  [
    {html: log(4, 8) + ' + ' + log(2, frac(1, 4)), answer: -0.5, expr: A(L(4, 8), L(2, Q(1, 4)))},
    {html: log(2, 3) + '·' + log(3, 16), answer: 4, expr: M(L(2, 3), L(3, 16))},
    {html: log(5, 125) + ' − 2·' + log(5, '√5'), answer: 2, expr: S(L(5, 125), M(2, L(5, P(5, 0.5))))},
    {html: frac(log(3, 25), log(3, 5)) + ' + ' + log(2, frac(1, 8)), answer: -1, expr: A(Q(L(3, 25), L(3, 5)), L(2, Q(1, 8)))}
  ].forEach(function (q, i) {
    add('profile', i + 1, 'Преобразуйте выражение', q.html, 'Вычислите значение выражения, используя свойства логарифмов.', [
      numeric('Введите значение всего выражения.', q.answer, '', 'Значение равно ' + numberHtml(q.answer) + '.', valueAudit(q.expr))
    ]);
  });
  [
    {html: log(2, '3x − 2') + ' = 4', x: 6, left: L(2, lin(3, -2)), right: 4},
    {html: log(3, 'x + 6') + ' = ' + log(3, '2x − 1'), x: 7, left: L(3, lin(1, 6)), right: L(3, lin(2, -1))},
    {html: log(2, 'x + 3') + ' − ' + log(2, 'x − 1') + ' = 1', x: 5, left: S(L(2, lin(1, 3)), L(2, lin(1, -1))), right: 1},
    {html: log(4, '5 − x') + ' = −' + frac(1, 2), x: 4.5, left: L(4, lin(-1, 5)), right: -0.5}
  ].forEach(function (q, i) {
    add('profile', i + 5, 'Найдите допустимый корень', q.html, 'Решите уравнение, учитывая область допустимых значений.', [
      numeric('Введите корень исходного уравнения x.', q.x, '', 'Допустимый корень: x = ' + numberHtml(q.x) + '.', equationAudit(q.left, q.right))
    ]);
  });
  add('profile', 9, 'Параметр по графику', 'y = ' + log(2, 'x − h') + '. Найдите h.',
    'По графику функции y = log₂(x − h) найдите параметр h.', [
      numeric('Введите значение параметра h.', 2, '', 'При y = 0 аргумент равен 1. По точке (3; 0) получаем h = 2.', valueAudit(S(3, 1)))
    ], {graph: Object.assign(graph(params(2, 2), [{x: 3, y: 0}, {x: 4, y: 1}, {x: 6, y: 2}], true), {revealPoints: true})});
  add('profile', 10, 'Вертикальный сдвиг', 'y = ' + log(3, 'x') + ' + k. Найдите k.',
    'По графику функции y = log₃x + k найдите параметр k.', [
      numeric('Введите значение параметра k.', -1, '', 'При x = 1 логарифм равен 0. По точке (1; −1) получаем k = −1.', valueAudit(S(-1, L(3, 1))))
    ], {graph: Object.assign(graph(params(3, 0, -1), [{x: 1, y: -1}, {x: 3, y: 0}, {x: 9, y: 1}], true), {revealPoints: true})});
  add('profile', 11, 'Основание по графику', 'y = ' + log('a', 'x') + '. Найдите a.',
    'По графику функции y = log_a x найдите допустимое основание a.', [
      numeric('Введите значение основания a.', 4, '', 'В точке (4; 1) выполняется logₐ4 = 1, поэтому a = 4.', valueAudit(4))
    ], {graph: Object.assign(graph(params(4), [{x: 0.25, y: -1}, {x: 1, y: 0}, {x: 4, y: 1}], true), {revealPoints: true})});
  add('profile', 12, 'Прочитайте значение', 'y = ' + log(0.5, 'x − 1') + '. Найдите y при x = 5.',
    'По графику функции y = log по основанию одной второй от x − 1 найдите значение при x = 5.', [
      numeric('Введите значение функции y при x = 5.', -2, '', 'График проходит через точку (5; −2), поэтому y = −2.', valueAudit(L(0.5, S(5, 1))))
    ], {graph: Object.assign(graph(params(0.5, 1), [{x: 2, y: 0}, {x: 3, y: -1}, {x: 5, y: -2}], true), {revealPoints: true})});

  function getTask(id) { return tasks.find(function (task) { return task.id === id; }) || null; }
  function getModule(id) { return modules.find(function (item) { return item.id === id; }) || null; }
  return {version: 1, modules: modules, tasks: tasks, getTask: getTask, getModule: getModule};
});
