/* Fixed authored movements. Tokens are plain text; no HTML, network or pupil state. */
(function (root) {
  'use strict';
  const n = value => String(value).replace(/-/g, '−').replace('.', ',');
  const term = value => (value < 0 ? '−' : '') + (Math.abs(value) === 1 ? '' : Math.abs(value)) + 'x';
  const signed = value => (value < 0 ? '−' : '+') + n(Math.abs(value));
  const signedTerm = value => (value < 0 ? '−' : '+') + (Math.abs(value) === 1 ? '' : Math.abs(value)) + 'x';
  const token = (text, tone = 'plain') => ({ text: String(text), tone });
  const letter = text => token(text, 'letter'), number = text => token(text, 'number'), equal = () => token('=');
  const link = (from, to) => ({ from, to });
  const arrows = (before, after, pairs, caption, moves = []) => ({ type: 'arrows', before, after, arrows: pairs.map(pair => link(...pair)), moves: moves.map(pair => link(...pair)), caption });
  function scene(id, title, narration, math, note, action = 'observe', extra = {}) {
    return { id, title, narration, math, note, action, click: false, record: null,
      duration_hint_ms: Math.max(6500, Math.min(12000, narration.length * 85)), ...extra };
  }
  const worked = (id, title, narration, math, note, motion) => scene(id, title, narration, math, note, 'correct',
    { record: math, ...(motion ? { motion, motion_ms: 3200 } : {}) });
  const last = prompt => scene('independent-task-12', 'Теперь реши самостоятельно', 'Реши новый пример в тетради. Сохрани все шаги и проверь ответ подстановкой.', prompt, 'Ответ к новому примеру не показан.', 'final');
  const equationData = [
    { a: 6, b: 4, c: -4, d: -11, answer: -3.5, fresh: '8x − 3 = 6x − 12' },
    { a: 7, b: 3, c: 5, d: 17, answer: 3, fresh: '9x + 7 = 5x + 19' },
    { a: 2, b: 5, c: -9, d: 6, answer: -5, fresh: '3x − 8 = 5x + 4' }
  ];
  function equations(p) {
    const k = p.a - p.b, c = p.d - p.c;
    const problem = `${term(p.a)} ${signed(p.c)} = ${term(p.b)} ${signed(p.d)}`;
    const gatheredLetters = `${term(p.a)} ${signedTerm(-p.b)} ${signed(p.c)} = ${n(p.d)}`;
    const gathered = `${term(p.a)} ${signedTerm(-p.b)} = ${n(p.d)} ${signed(-p.c)}`;
    const product = `${term(k)} = ${n(c)}`;
    const divide = `x = ${n(c)} : (${n(k)}) = ${n(p.answer)}`;
    const before = [letter(term(p.a)), number(signed(p.c)), equal(), letter(term(p.b)), number(signed(p.d))];
    const lettersLeft = [letter(term(p.a)), letter(signedTerm(-p.b)), number(signed(p.c)), equal(), number(n(p.d))];
    const numbersRight = [letter(term(p.a)), letter(signedTerm(-p.b)), equal(), number(n(p.d)), number(signed(-p.c))];
    const checkValue = p.a * p.answer + p.c;
    return [
      scene('read-condition-1', 'Буквы слева, числа справа', 'Найдём значение икс. Соберём слагаемые с икс слева, а известные числа — справа.', problem, 'Такой порядок удобен. Все преобразования должны сохранять равенство.'),
      scene('try-yourself-2', 'Наметь первый перенос', 'Какое слагаемое с икс находится справа? Представь, какой знак оно получит слева.', problem, 'Поставь видео на паузу и попробуй сама.'),
      scene('recall-rule-3', 'Почему меняется знак?', 'Перенос — короткая запись одинакового действия над обеими частями уравнения.', 'a + b = c  ⇔  a = c − b', 'Знак меняется при переносе через знак равенства. При перестановке внутри одной части знак сохраняется.', 'hint'),
      worked('move-letters-4', 'Переносим слагаемое с икс влево', `Вычтем ${term(p.b)} из обеих частей. Справа оно исчезнет, а слева появится ${term(-p.b)}.`, gatheredLetters, 'Переносим всё слагаемое вместе с его знаком.', arrows(before, lettersLeft, [[3, 1]], `${term(p.b)} справа → ${term(-p.b)} слева`, [[3, 1]])),
      worked('move-numbers-5', 'Переносим число вправо', `Теперь ${n(p.c)} переносим вправо. Его знак меняется на противоположный.`, gathered, `Это то же самое, что ${p.c < 0 ? 'прибавить' : 'вычесть'} ${n(Math.abs(p.c))} ${p.c < 0 ? 'к обеим частям' : 'из обеих частей'}.`, arrows(lettersLeft, numbersRight, [[2, 4]], `${n(p.c)} слева → ${signed(-p.c)} справа`, [[2, 4]])),
      worked('combine-like-6', 'Считаем каждую часть отдельно', 'Слева складываем коэффициенты при икс. Справа выполняем действие с числами.', product, `${p.a} − ${p.b} = ${n(k)}; ${n(p.d)} ${signed(-p.c)} = ${n(c)}.`, arrows(numbersRight, [letter(term(k)), equal(), number(n(c))], [[0, 0], [1, 0], [3, 2], [4, 2]], 'Слагаемые с икс объединяем; числа вычисляем.')),
      worked('divide-both-sides-10', 'Делим обе части', `Чтобы получить икс, делим обе части на ${n(k)}.`, divide, `${n(k)} ≠ 0, поэтому деление допустимо.`, arrows([letter(term(k)), equal(), number(n(c))], [letter('x'), equal(), number(`${n(c)} : (${n(k)})`), equal(), number(n(p.answer))], [[0, 0], [2, 2]], `Обе части делим на ${n(k)}.`)),
      scene('check-substitution-11', 'Проверяем в исходном уравнении', 'Подставь найденный корень в исходную левую и правую части. Получились одинаковые числа.', `${p.a} · (${n(p.answer)}) ${signed(p.c)} = ${p.b} · (${n(p.answer)}) ${signed(p.d)}`, `Обе части равны ${n(checkValue)}.`, 'correct', { record: `${n(checkValue)} = ${n(checkValue)}`, recordLabel: 'Проверка подстановкой' }),
      last(p.fresh)
    ];
  }
  const bracketData = [
    { first: '3', firstBracket: '2x − 1', firstX: '6x', firstC: '−3', second: '−4', secondBracket: 'x + 3', secondX: '−4x', secondC: '−12', rhs: 5, k: 2, sum: 20, answer: 10, firstProducts: '3 · 2x = 6x; 3 · (−1) = −3', secondProducts: '−4 · x = −4x; −4 · 3 = −12', check: '3 · (20 − 1) − 4 · (10 + 3) = 57 − 52 = 5', fresh: '2(3x − 2) − 3(x + 1) = 8' },
    { first: '2', firstBracket: '3x + 4', firstX: '6x', firstC: '+8', second: '−3', secondBracket: 'x − 2', secondX: '−3x', secondC: '+6', rhs: 20, k: 3, sum: 6, answer: 2, firstProducts: '2 · 3x = 6x; 2 · 4 = 8', secondProducts: '−3 · x = −3x; −3 · (−2) = +6', check: '2 · (6 + 4) − 3 · (2 − 2) = 20 − 0 = 20', fresh: '2(4x + 1) − 5(x − 2) = 21' },
    { first: '−2', firstBracket: '4x − 3', firstX: '−8x', firstC: '+6', second: '+5', secondBracket: 'x + 1', secondX: '+5x', secondC: '+5', rhs: 2, k: -3, sum: -9, answer: 3, firstProducts: '−2 · 4x = −8x; −2 · (−3) = +6', secondProducts: '5 · x = 5x; 5 · 1 = 5', check: '−2 · (12 − 3) + 5 · (3 + 1) = −18 + 20 = 2', fresh: '−3(2x − 4) + 4(x + 1) = 10' }
  ];
  function brackets(p) {
    const problem = `${p.first}(${p.firstBracket}) ${p.second}(${p.secondBracket}) = ${p.rhs}`;
    const first = `${p.firstX} ${p.firstC} ${p.second}(${p.secondBracket}) = ${p.rhs}`;
    const expanded = `${p.firstX} ${p.firstC} ${p.secondX} ${p.secondC} = ${p.rhs}`;
    const flip = text => text.startsWith('−') ? '+' + text.slice(1) : '−' + text.slice(1);
    const gathered = `${p.firstX} ${p.secondX} = ${p.rhs} ${flip(p.firstC)} ${flip(p.secondC)}`;
    const tokensFirst = [letter(p.firstX), number(p.firstC), number(p.second), letter(`(${p.secondBracket})`), equal(), number(p.rhs)];
    const tokensExpanded = [letter(p.firstX), number(p.firstC), letter(p.secondX), number(p.secondC), equal(), number(p.rhs)];
    const tokensGathered = [letter(p.firstX), letter(p.secondX), equal(), number(p.rhs), number(flip(p.firstC)), number(flip(p.secondC))];
    return [
      scene('read-condition-1', 'Уравнение с двумя скобками', 'Сначала раскроем обе скобки. Затем соберём слагаемые с икс слева, а числа справа.', problem, 'Работаем по одному действию. Уже полученные строки остаются на экране.'),
      scene('try-yourself-2', 'Посмотри на множители', 'У каждой скобки свой множитель. Второй множитель берём вместе со знаком перед ним.', problem, `Множители: ${p.first} и ${p.second}.`),
      scene('recall-rule-3', 'Умножаем каждое слагаемое', 'Число перед скобками умножаем на каждое слагаемое внутри. Знак слагаемого участвует в умножении.', 'a(b + c) = ab + ac', 'Одно слагаемое пропускать нельзя.', 'hint'),
      worked('expand-first-4', 'Раскрываем первую скобку', 'Две стрелки показывают два умножения. Вторую скобку пока переписываем без изменения.', first, p.firstProducts, arrows([number(p.first), letter(`(${p.firstBracket})`), number(p.second), letter(`(${p.secondBracket})`), equal(), number(p.rhs)], tokensFirst, [[0, 0], [0, 1]], p.firstProducts)),
      worked('correct-expansion-5', 'Раскрываем вторую скобку', 'Теперь второй множитель применяем к каждому слагаемому во второй скобке.', expanded, p.secondProducts, arrows(tokensFirst, tokensExpanded, [[2, 2], [2, 3]], p.secondProducts)),
      worked('move-numbers-6', 'Буквы остаются слева, числа уходят вправо', 'Переносим оба числовых слагаемых через знак равенства. Знак каждого меняется.', gathered, 'Буквенные слагаемые уже слева: при перестановке в левой части их знаки не меняются.', arrows(tokensExpanded, tokensGathered, [[1, 4], [3, 5]], 'Меняем знак только у перенесённых через равенство чисел.', [[1, 4], [3, 5]])),
      worked('combine-like-7', 'Приводим подобные слагаемые', 'Слева складываем коэффициенты при икс. Справа вычисляем сумму чисел.', `${term(p.k)} = ${n(p.sum)}`, 'Числа и буквенные слагаемые не складываем между собой.', arrows(tokensGathered, [letter(term(p.k)), equal(), number(n(p.sum))], [[0, 0], [1, 0], [3, 2], [4, 2], [5, 2]], 'Буквенные слагаемые — вместе; известные числа — вместе.')),
      worked('divide-both-sides-10', 'Находим корень', `Разделим обе части на ${n(p.k)}.`, `x = ${n(p.sum)} : (${n(p.k)}) = ${n(p.answer)}`, `${n(p.k)} ≠ 0.`, arrows([letter(term(p.k)), equal(), number(n(p.sum))], [letter('x'), equal(), number(`${n(p.sum)} : (${n(p.k)})`), equal(), number(n(p.answer))], [[0, 0], [2, 2]], 'Выполняем одинаковое деление слева и справа.')),
      scene('check-substitution-11', 'Проверяем обе скобки', 'Подставим найденное значение икс в исходное уравнение и вычислим левую часть.', p.check, `Получилось ${p.rhs}, как в правой части исходного уравнения.`, 'correct', { record: `${p.rhs} = ${p.rhs}`, recordLabel: 'Проверка подстановкой' }),
      last(p.fresh)
    ];
  }
  function percentages(index) {
    const p = [
      { title: 'Находим часть от целого', problem: 'Найди 20% от 150.', correspondence: '150 — 100%; x — 20%', relation: 'x/150 = 20/100', lhs: '100x', product: '150 · 20', division: 'x = 3000 : 100 = 30', check: '30/150 = 20/100 = 0,2', next: 'Найди 15% от 200.', before: [letter('x'), number('/150'), equal(), number('20'), number('/100')], after: [letter('100x'), equal(), number('150 · 20')], pairs: [[0, 0], [4, 0], [1, 2], [3, 2]], denominator: 100, answer: 30, symbol: 'x' },
      { title: 'Находим целое по части', problem: '30 — это 20% числа. Найди число.', correspondence: 'x — 100%; 30 — 20%', relation: 'x/30 = 100/20', lhs: '20x', product: '30 · 100', division: 'x = 3000 : 20 = 150', check: '30/150 = 20/100 = 0,2', next: '45 — это 15% числа. Найди число.', before: [letter('x'), number('/30'), equal(), number('100'), number('/20')], after: [letter('20x'), equal(), number('30 · 100')], pairs: [[0, 0], [4, 0], [1, 2], [3, 2]], denominator: 20, answer: 150, symbol: 'x' },
      { title: 'Находим число процентов', problem: 'Сколько процентов составляет 30 от 150?', correspondence: '150 — 100%; 30 — p%', relation: '30/150 = p/100', lhs: '150p', product: '30 · 100', division: 'p = 3000 : 150 = 20', check: '20% от 150: 150 · 20/100 = 30', next: 'Сколько процентов составляет 45 от 300?', before: [number('30'), number('/150'), equal(), letter('p'), number('/100')], after: [letter('150p'), equal(), number('30 · 100')], pairs: [[1, 0], [3, 0], [0, 2], [4, 2]], denominator: 150, answer: 20, symbol: 'p' }
    ][index];
    return [
      scene('read-condition-1', p.title, 'Сначала назови целое. Целому всегда соответствует сто процентов.', p.problem, 'Все три вида задач можно решать с помощью пропорции.'),
      scene('try-yourself-2', 'Записываем соответствие', 'Под каждой величиной мысленно поставь соответствующее число процентов.', p.correspondence, 'Не меняй порядок величин только в одном отношении.'),
      scene('recall-rule-3', 'Составляем пропорцию', 'Отношение величин равно отношению соответствующих чисел процентов. Сохраняем один и тот же порядок.', p.relation, 'Слева сравниваем величины, справа — соответствующие числа процентов.', 'hint', { record: p.relation }),
      worked('correct-step-5', 'Умножаем крест-накрест', 'Записываем равенство произведений крайних и средних членов. Неизвестное оставляем слева.', `${p.lhs} = ${p.product}`, 'Все знаменатели в этой пропорции ненулевые.', arrows(p.before, p.after, p.pairs, 'Перемножаем числитель каждого отношения и знаменатель другого.')),
      worked('compute-product-6', 'Вычисляем известное произведение', 'Выполним умножение в правой части.', `${p.lhs} = 3000`, 'Следующий шаг — одинаковое деление обеих частей.'),
      worked('simplify-result-7', 'Находим неизвестное', `Делим обе части на ${p.denominator}.`, p.division, p.symbol === 'p' ? 'p — число процентов. Ответ: 20%.' : `Искомая величина равна ${p.answer}.`, arrows([letter(p.lhs), equal(), number('3000')], [letter(p.symbol), equal(), number(`3000 : ${p.denominator}`), equal(), number(p.answer)], [[0, 0], [2, 2]], `Обе части делим на ${p.denominator}.`)),
      scene('check-result-8', 'Проверяем соответствие', 'Проверим, что найденное значение даёт указанное в условии соотношение.', p.check, 'Ответ должен относиться к вопросу задачи.', 'correct', { record: p.check, recordLabel: 'Проверка' }),
      last(p.next)
    ];
  }
  function decorate(task, preset, fallbackScenes) {
    const index = Number(preset) - 1;
    if (!Number.isInteger(index) || index < 0 || index > 2) throw new RangeError('Доступны варианты 1, 2 и 3.');
    if (task === 'linear-equation') return equations(equationData[index]);
    if (task === 'brackets') return brackets(bracketData[index]);
    if (task === 'percentages') return percentages(index);
    const scenes = fallbackScenes.map(entry => ({ ...entry }));
    function animate(id, motion, duration = 3200) {
      const entry = scenes.find(item => item.id === id);
      if (entry) Object.assign(entry, { motion, motion_ms: duration });
    }
    if (task === 'negative-numbers') {
      const [a, b] = [[7, 12], [11, 6], [8, 8]][index];
      animate('correct-step-5', arrows([number('−' + a), number(`−(−${b})`)], [number('−' + a), number('+' + b)], [[1, 1]], 'Вычесть отрицательное число — прибавить противоположное.', []));
      animate('simplify-result-6', { type: 'numberline', start: -a, delta: b, end: b - a, min: -a - 2, max: Math.max(2, b - a + 2), caption: `От ${n(-a)} идём вправо на ${b}. Получаем ${n(b - a)}.` });
    } else if (task === 'fractions') {
      const [a, b, c, d, common] = [[1, 3, 1, 4, 12], [2, 5, 1, 3, 15], [3, 4, 1, 6, 12]][index];
      animate('correct-step-5', arrows([number(`${a}/${b}`), token('+'), number(`${c}/${d}`)], [number(`${a * common / b}/${common}`), token('+'), number(`${c * common / d}/${common}`)], [[0, 0], [2, 2]], `Первую дробь расширяем в ${common / b} раза, вторую — в ${common / d} раза. Числитель и знаменатель умножаем вместе.`));
    } else if (task === 'proportions') {
      const [a, b, c] = [[6, 4, 3], [8, 3, 2], [15, 2, 5]][index];
      animate('correct-step-5', arrows([letter('x'), number('/' + a), equal(), number(b), number('/' + c)], [letter(c + 'x'), equal(), number(`${a} · ${b}`)], [[0, 0], [4, 0], [1, 2], [3, 2]], 'Произведение крайних членов равно произведению средних.'));
    } else if (task === 'adjacent-angles') {
      animate('read-diagram-1', { type: 'geometry', caption: 'Две прямые пересекаются в точке O. Читаем обозначения.' }, 2800);
      animate('adjacency-rule-3', { type: 'geometry', caption: 'Соседние дуги вместе образуют развёрнутый угол: 180°.' }, 3200);
      animate('distinguish-vertical-9', { type: 'geometry', caption: 'Углы напротив друг друга вертикальные. Их градусные меры равны.' }, 2800);
    }
    return scenes;
  }
  root.MathExamMotionTopics = Object.freeze({ decorate });
})(typeof window === 'undefined' ? globalThis : window);
