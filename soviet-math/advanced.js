(function (root) {
  'use strict';

  // Textbooks supply the sequence of skills; every exercise below is authored
  // for this course. Division keeps the existing, independently checked core.
  const D = typeof module !== 'undefined' && module.exports
    ? require('../trainers/oge-basics/multiplication-division/division-guided-core.js')
    : root.DivisionGuided;
  if (!D) throw Error('Сначала подключите division-guided-core.js.');

  const topics = [
    ['divide-simple', 'Деление уголком: первые шаги', 'division', 'Подбираем цифру, умножаем и вычитаем. Весь уголок остаётся на экране.'],
    ['divide-zero', 'Ноль в частном', 'division', 'Сохраняем место разряда, даже когда очередное число меньше делителя.'],
    ['divide-remainder', 'Деление с остатком', 'division', 'Находим частное и остаток, проверяем результат умножением.'],
    ['divide-two', 'Деление на двузначное число', 'division', 'Подбираем цифру частного в отдельной области рядом с уголком.'],
    ['divide-decimal-natural', 'Десятичную дробь делим на натуральное число', 'division', 'Ставим запятую в частном и продолжаем делить по разрядам.'],
    ['fraction-meaning', 'Что означает дробь', 'fractions', 'Считаем равные части целого и выбранные части.'],
    ['fraction-reduce', 'Сокращение дробей', 'fractions', 'Делим числитель и знаменатель на одно и то же число.'],
    ['fraction-add', 'Сложение дробей', 'fractions', 'Находим общий знаменатель, складываем и сокращаем.'],
    ['fraction-multiply', 'Умножение дробей', 'fractions', 'Умножаем числители и знаменатели, затем сокращаем.'],
    ['fraction-divide', 'Деление дробей', 'fractions', 'Заменяем деление умножением на обратную дробь.'],
    ['decimal-add', 'Сложение десятичных дробей', 'applications', 'Складываем одинаковые разряды, сохраняя смысл десятых и сотых.'],
    ['divide-decimal', 'Деление на десятичную дробь', 'applications', 'Убираем запятую в делителе, одинаково изменяя оба числа.'],
    ['percent-part', 'Найти часть по процентам', 'applications', 'Сопоставляем целое со 100% и составляем пропорцию.'],
    ['percent-whole', 'Найти целое по его части', 'applications', 'По известной части и её проценту восстанавливаем целое.'],
    ['percent-ratio', 'Сколько процентов составляет часть', 'applications', 'Сравниваем часть с целым через пропорцию.']
  ].map(([id, title, stage, description]) => ({ id, title, stage, description, source: 'princev' }));
  const topicMap = Object.fromEntries(topics.map(topic => [topic.id, topic]));
  const divisionMap = {
    'divide-simple': 'start', 'divide-zero': 'zero', 'divide-remainder': 'remainder',
    'divide-two': 'twoDigit', 'divide-decimal-natural': 'decimalNatural',
    'divide-decimal': 'decimalDivisor'
  };
  const data = {
    meaning: [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 8], [7, 10]],
    reduce: [[2, 4], [3, 6], [4, 6], [6, 8], [6, 9], [8, 10], [10, 15], [12, 18], [15, 20], [18, 24], [21, 28], [24, 36]],
    add: [[1, 2, 1, 4], [1, 3, 1, 6], [2, 5, 1, 10], [1, 4, 1, 6], [1, 2, 2, 3], [3, 8, 1, 4], [1, 6, 1, 9], [2, 3, 1, 12], [3, 10, 1, 5], [5, 12, 1, 8], [2, 7, 3, 14], [5, 6, 1, 3]],
    multiply: [[1, 2, 1, 3], [2, 3, 3, 4], [3, 5, 5, 6], [2, 7, 7, 8], [3, 4, 2, 9], [5, 6, 3, 10], [4, 5, 5, 8], [5, 9, 3, 5], [7, 10, 5, 14], [3, 8, 4, 9], [5, 12, 6, 7], [7, 9, 3, 14]],
    divide: [[1, 2, 1, 4], [2, 3, 1, 6], [3, 4, 3, 8], [2, 5, 4, 5], [5, 6, 5, 9], [3, 7, 6, 7], [4, 9, 2, 3], [5, 8, 5, 12], [7, 10, 7, 15], [3, 5, 9, 10], [5, 12, 5, 6], [7, 8, 7, 10]],
    decimal: [[120, 35], [245, 130], [308, 270], [456, 78], [675, 225], [84, 190], [730, 405], [999, 101], [1250, 375], [608, 92], [1425, 86], [1870, 245]],
    percent: [[80, 25], [120, 15], [240, 20], [360, 35], [500, 12], [600, 8], [160, 75], [420, 30], [700, 14], [900, 18], [1250, 16], [2500, 7]]
  };

  function gcd(a, b) { while (b) { const r = a % b; a = b; b = r; } return a; }
  function fraction(n, d) {
    const g = gcd(n, d);
    return d / g === 1 ? String(n / g) : (n / g) + '/' + (d / g);
  }
  function step(prompt, answer, explanation, record, helper, checkKind) {
    return { prompt, answer: String(answer), hint: explanation + ' Ответ: ' + answer + '.', record, helper, ...(checkKind ? { checkKind } : {}) };
  }
  function standard(topicId, index, prompt, answer, steps, visual) {
    return { topicId, index, prompt, answer: String(answer), kind: 'standard', steps, ...(visual ? { visual } : {}) };
  }

  function divisionRecord(action, p) {
    const cycle = Number.isInteger(action.cycle) ? p.cycles[action.cycle] : null;
    switch (action.kind) {
      case 'shift-count': return 'Переносим запятые на ' + action.answer + ' разр.';
      case 'shift-factor': return 'Оба числа умножаем на ' + action.answer;
      case 'shift-divisor': return p.task.divisor + ' × ' + 10 ** D.number(p.task.divisor).places + ' = ' + action.answer;
      case 'shift-dividend': return p.task.dividend + ' × ' + 10 ** D.number(p.task.divisor).places + ' = ' + action.answer;
      case 'start': return 'Первое неполное делимое: ' + action.answer;
      case 'count': return 'Цифр в целой части частного: ' + action.answer;
      case 'digit': return 'Следующая цифра частного: ' + action.answer;
      case 'product': return p.normalizedDivisor + ' × ' + cycle.qd + ' = ' + action.answer;
      case 'subtract': return cycle.partial + ' − ' + cycle.product + ' = ' + action.answer;
      case 'remainder-check': return cycle.remainder + ' < ' + p.normalizedDivisor + ': остаток подходит';
      case 'bring': return 'Сносим цифру ' + action.answer;
      case 'partial': return 'Новое неполное делимое: ' + action.answer;
      case 'comma': return 'Целая часть и запятая: ' + action.answer;
      case 'answer': return 'Частное: ' + action.answer;
      case 'final-remainder': return 'Остаток: ' + action.answer;
      case 'verify': return 'Проверка вернула делимое: ' + action.answer;
      default: return action.answer;
    }
  }

  function divisionHelper(action, p) {
    const cycle = Number.isInteger(action.cycle) ? p.cycles[action.cycle] : null;
    const d = p.normalizedDivisor;
    switch (action.kind) {
      case 'shift-count': return ['Цель: убрать запятую в делителе.', 'Делитель: ' + p.task.divisor, 'Посчитай цифры после запятой.'];
      case 'shift-factor': return ['Оба числа меняем одинаково.', 'Одно место вправо: ×10.', 'Два места вправо: ×100.'];
      case 'shift-divisor': return ['Переносим запятую вправо.', 'В делителе должна исчезнуть запятая.'];
      case 'shift-dividend': return ['Повтори тот же перенос в делимом.', 'В делимом запятая может остаться.'];
      case 'start': return ['Читаем делимое слева направо.', 'Берём столько цифр, чтобы начать деление.'];
      case 'count': return ['Первая часть даёт первую цифру частного.', 'Дальше каждой цифре до запятой — своё место.'];
      case 'digit': return [d + ' × ? ≤ ' + cycle.partial, 'Пробуем цифры от 0 до 9.', 'Выбираем самую большую подходящую.'];
      case 'product': return [d + ' × ' + cycle.qd + ' = ?', 'Умножаем делитель на выбранную цифру.'];
      case 'subtract': return [cycle.partial + ' − ' + cycle.product + ' = ?', 'Вычитаем произведение из неполного делимого.'];
      case 'remainder-check': return ['Остаток: ' + cycle.remainder, 'Делитель: ' + d, 'Сравни эти два числа.'];
      case 'bring': return ['В уголке ищем следующую цифру делимого.', 'Сносим ровно одну цифру.'];
      case 'partial': return ['Остаток × 10 + снесённая цифра.', 'Читаем получившееся число.'];
      case 'comma': return ['Целая часть делимого уже использована.', 'Перед десятыми ставим запятую в частном.'];
      case 'answer': return ['Прочитай частное справа под чертой.', 'Сохрани все нули и запятую.'];
      case 'final-remainder': return ['Остаток — последняя разность в уголке.'];
      case 'verify': return [p.task.divisor + ' × ' + p.quotient + (p.task.level === 'remainder' ? ' + ' + p.remainder : '') + ' = ?', 'Проверяем деление обратным действием.'];
      default: return ['Уголок сохраняет все предыдущие действия.'];
    }
  }

  function makeDivision(topicId, index) {
    const p = D.plan(D.make(divisionMap[topicId], index));
    return {
      topicId, index, kind: 'division', division: p,
      prompt: 'Выполни деление уголком: ' + p.task.dividend + ' : ' + p.task.divisor + (p.task.level === 'remainder' ? ' (с остатком)' : ''),
      answer: p.task.level === 'remainder' ? p.quotient + ' (ост. ' + p.remainder + ')' : p.quotient,
      steps: p.actions.map(action => ({ ...step(action.prompt, action.answer, action.hint, divisionRecord(action, p), divisionHelper(action, p)), raw: action }))
    };
  }

  function make(topicId, index = 0) {
    if (!Object.hasOwn(topicMap, topicId)) throw Error('Неизвестная тема курса.');
    if (!Number.isSafeInteger(index) || index < 0 || index > 1000000) throw Error('Неверный номер упражнения.');
    if (Object.hasOwn(divisionMap, topicId)) return makeDivision(topicId, index);
    const k = index % 12;

    if (topicId === 'fraction-meaning') {
      const [n, d] = data.meaning[k], result = n + '/' + d;
      return standard(topicId, index, 'Какая часть целого выделена цветом?', result, [
        step('На сколько равных частей разделено целое?', d, 'Посчитай все части, в том числе невыделенные.', 'Всего равных частей: ' + d, ['Знаменатель показывает число всех равных частей.', 'Рассмотри целое на рисунке.']),
        step('Сколько частей выделено цветом?', n, 'Посчитай только выделенные части.', 'Выделено частей: ' + n, ['Числитель показывает, сколько частей взято.', 'Каждая часть имеет одинаковый размер.']),
        step('Запиши выделенную часть дробью.', result, 'Сверху запиши число выделенных частей, снизу — число всех частей.', 'Выделенная часть: ' + result, ['Взято частей: ' + n, 'Всего частей: ' + d, 'Запись ответа: числитель/знаменатель.'])
      ], { kind: 'fraction', n, d });
    }

    if (topicId === 'fraction-reduce') {
      const [n, d] = data.reduce[k], g = gcd(n, d), result = fraction(n, d);
      return standard(topicId, index, 'Сократи дробь ' + n + '/' + d + '.', result, [
        step('На какое наибольшее число делятся и ' + n + ', и ' + d + '?', g, 'Ищем общий делитель числителя и знаменателя.', 'Общий делитель: ' + g, ['Нужен делитель обоих чисел.', n + ' : ? и ' + d + ' : ? — без остатка.']),
        step('Раздели числитель: ' + n + ' : ' + g + '.', n / g, 'Делим число над дробной чертой на общий делитель.', n + ' : ' + g + ' = ' + n / g, ['Числитель: ' + n, 'Оба числа делим на ' + g + '.']),
        step('Раздели знаменатель: ' + d + ' : ' + g + '.', d / g, 'Число под дробной чертой делим на тот же делитель.', d + ' : ' + g + ' = ' + d / g, ['Знаменатель: ' + d, 'Нельзя менять только одно число дроби.']),
        step('Запиши полученную несократимую дробь.', result, 'Используй найденные числитель и знаменатель.', n + '/' + d + ' = ' + result, ['Новый числитель: ' + n / g, 'Новый знаменатель: ' + d / g], 'reduced-fraction')
      ], { kind: 'fraction', n, d });
    }

    if (topicId === 'fraction-add') {
      const [a, b, c, d] = data.add[k], common = b * d / gcd(b, d), an = a * common / b, cn = c * common / d;
      const sum = an + cn, result = fraction(sum, common), expression = a + '/' + b + ' + ' + c + '/' + d;
      return standard(topicId, index, 'Вычисли: ' + expression + '.', result, [
        step('Найди наименьший общий знаменатель для ' + b + ' и ' + d + '.', common, 'Найди наименьшее положительное число, которое делится на оба знаменателя.', 'Общий знаменатель: ' + common, ['Складывать будем доли одинакового размера.', 'Ищем общее кратное ' + b + ' и ' + d + '.']),
        step('Приведи ' + a + '/' + b + ' к знаменателю ' + common + '. Какой числитель получится?', an, 'Умножь числитель на ' + common / b + ', как и знаменатель.', a + '/' + b + ' = ' + an + '/' + common, [common + ' : ' + b + ' = ' + common / b, 'Числитель тоже умножаем на ' + common / b + '.']),
        step('Приведи ' + c + '/' + d + ' к знаменателю ' + common + '. Какой числитель получится?', cn, 'Умножь числитель на ' + common / d + ', как и знаменатель.', c + '/' + d + ' = ' + cn + '/' + common, [common + ' : ' + d + ' = ' + common / d, 'Числитель тоже умножаем на ' + common / d + '.']),
        step('Сложи новые числители: ' + an + ' + ' + cn + '.', sum, 'Знаменатель оставляем прежним: складываем число одинаковых долей.', an + ' + ' + cn + ' = ' + sum, ['Общий знаменатель остаётся ' + common + '.', 'Складываем только числители.']),
        step('Запиши ответ и сократи дробь, если это возможно.', result, 'Получилась дробь ' + sum + '/' + common + '. Раздели оба числа на их наибольший общий делитель.', expression + ' = ' + result, ['До сокращения: ' + sum + '/' + common, 'Целое число можно записать без знаменателя 1.'], 'reduced-fraction')
      ]);
    }

    if (topicId === 'fraction-multiply' || topicId === 'fraction-divide') {
      const divide = topicId === 'fraction-divide';
      const [a, b, c, d] = (divide ? data.divide : data.multiply)[k];
      const secondN = divide ? d : c, secondD = divide ? c : d;
      const n = a * secondN, den = b * secondD, g = gcd(n, den), result = fraction(n, den);
      const expression = a + '/' + b + (divide ? ' : ' : ' × ') + c + '/' + d;
      const steps = [];
      if (divide) steps.push(step('Запиши дробь, обратную ' + c + '/' + d + '.', d + '/' + c, 'Поменяй местами числитель и знаменатель делителя.', 'Деление заменяем: × ' + d + '/' + c, ['Первую дробь оставляем прежней.', 'Деление заменяем умножением.', 'Переворачиваем только вторую дробь.']));
      steps.push(
        step('Умножь числители: ' + a + ' × ' + secondN + '.', n, 'Найди произведение чисел над дробными чертами.', 'Числитель: ' + a + ' × ' + secondN + ' = ' + n, ['Вычисляем ' + a + '/' + b + ' × ' + secondN + '/' + secondD + '.', 'Умножаем числитель на числитель.']),
        step('Умножь знаменатели: ' + b + ' × ' + secondD + '.', den, 'Найди произведение чисел под дробными чертами.', 'Знаменатель: ' + b + ' × ' + secondD + ' = ' + den, ['Умножаем знаменатель на знаменатель.', 'Числитель уже найден: ' + n + '.']),
        step('На какое наибольшее число делятся ' + n + ' и ' + den + '?', g, g === 1 ? 'Общего делителя больше 1 нет: дробь уже несократима.' : 'Найди общий делитель, чтобы сократить результат.', 'Общий делитель: ' + g, ['Получилась дробь ' + n + '/' + den + '.', 'Если общего делителя больше 1 нет, запиши 1.']),
        step('Запиши окончательный ответ.', result, 'Раздели оба числа дроби на ' + g + '. Если знаменатель равен 1, запиши целое число.', expression + ' = ' + result, [n + ' : ' + g + ' — новый числитель.', den + ' : ' + g + ' — новый знаменатель.'], 'reduced-fraction')
      );
      return standard(topicId, index, 'Вычисли: ' + expression + '.', result, steps);
    }

    if (topicId === 'decimal-add') {
      const [a, b] = data.decimal[k], av = D.decimal(a, 2), bv = D.decimal(b, 2), result = D.decimal(a + b, 2);
      return standard(topicId, index, 'Вычисли: ' + av + ' + ' + bv + '.', result, [
        step('Сколько сотых всего в числе ' + av + '?', a, 'Одна целая — 100 сотых, одна десятая — 10 сотых.', av + ' = ' + a + ' сотых', ['Выражаем оба числа в одинаковых долях.', '1 целая = 100 сотых.', '1 десятая = 10 сотых.']),
        step('Сколько сотых всего в числе ' + bv + '?', b, 'Сосчитай сотые во всех целых, десятых и сотых второго числа.', bv + ' = ' + b + ' сотых', ['Снова считаем сотые.', 'Ноль справа после запятой не меняет число.']),
        step('Сколько сотых получится вместе: ' + a + ' + ' + b + '?', a + b, 'Складываем число одинаковых долей — сотых.', a + ' + ' + b + ' = ' + (a + b) + ' сотых', ['Разряды складываем с одноимёнными разрядами.', 'При переходе через десяток переносим единицу.']),
        step('Запиши ' + (a + b) + ' сотых десятичной дробью.', result, 'Отдели запятой две цифры справа. Ненужный ноль в конце можно убрать.', av + ' + ' + bv + ' = ' + result, ['Каждые 100 сотых дают 1 целую.', 'После запятой: десятые, затем сотые.'])
      ]);
    }

    const [whole, percent] = data.percent[k], part = whole * percent / 100;
    const visual = { kind: 'percent', whole, percent, part };
    if (topicId === 'percent-part') {
      return standard(topicId, index, 'В библиотеке ' + whole + ' книг. Научно-популярные книги составляют ' + percent + '%. Сколько таких книг в библиотеке?', part, [
        step('Сколько процентов составляют все ' + whole + ' книг?', 100, 'Все книги — это целое, поэтому ему соответствуют 100%.', whole + ' книг ↔ 100%', ['Целое: все книги.', 'Искомая часть: научно-популярные книги.']),
        step('Какой процент соответствует искомому количеству x книг?', percent, 'Возьми процент научно-популярных книг из условия.', 'x книг ↔ ' + percent + '%; x/' + whole + ' = ' + percent + '/100', ['Величины располагаем в одном порядке.', 'Часть / целое = процент части / 100.']),
        step('По пропорции 100 × x = ' + whole + ' × ' + percent + '. Вычисли правую часть.', whole * percent, 'Перемножаем крайние и средние члены пропорции.', '100 × x = ' + whole * percent, ['Пропорция: x/' + whole + ' = ' + percent + '/100.', 'Произведения крест-накрест равны.']),
        step('Найди x: ' + (whole * percent) + ' : 100.', part, 'Чтобы найти неизвестный множитель, раздели произведение на 100.', 'x = ' + part + ' книг', ['100 × x = ' + whole * percent + '.', 'Ищем число книг.']),
        step('Проверка: ' + part + ' × 100 : ' + whole + '. Какой процент получился?', percent, 'Сравниваем найденную часть со всем количеством.', 'Проверка: ' + part + '/' + whole + ' = ' + percent + '/100', ['Часть делим на целое и умножаем на 100.', 'Результат должен совпасть с условием.'])
      ], { ...visual, unknown: 'part' });
    }
    if (topicId === 'percent-whole') {
      return standard(topicId, index, 'В библиотеке ' + part + ' научно-популярных книг — это ' + percent + '% всех книг. Сколько всего книг в библиотеке?', whole, [
        step('Сколько процентов соответствует всем книгам, которых x?', 100, 'Искомое целое всегда соответствует 100%.', 'x книг ↔ 100%', ['Часть известна: ' + part + ' книг.', 'Этой части соответствует ' + percent + '%.']),
        step('Пропорция: ' + part + '/x = ' + percent + '/100. Какое число умножается на x при умножении крест-накрест?', percent, 'Знаменатель x умножается на числитель ' + percent + ' справа.', percent + ' × x = ' + part + ' × 100', ['Часть / целое = процент части / 100.', part + ' книг ↔ ' + percent + '%.']),
        step('Вычисли ' + part + ' × 100.', part * 100, 'Находим произведение в правой части равенства.', percent + ' × x = ' + part * 100, ['В пропорции произведения крест-накрест равны.', 'Количество всех книг пока неизвестно.']),
        step('Найди x: ' + (part * 100) + ' : ' + percent + '.', whole, 'Раздели произведение на известный множитель.', 'x = ' + whole + ' книг', [percent + ' × x = ' + part * 100 + '.', 'Результат — целое количество книг.']),
        step('Проверка: найди ' + percent + '% от ' + whole + ': ' + whole + ' × ' + percent + ' : 100.', part, 'Должно получиться известное количество научно-популярных книг.', 'Проверка: ' + whole + ' × ' + percent + ' : 100 = ' + part, ['Теперь целое известно.', 'Восстанавливаем указанную в условии часть.'])
      ], { ...visual, unknown: 'whole' });
    }
    return standard(topicId, index, 'В библиотеке ' + whole + ' книг, из них ' + part + ' научно-популярных. Сколько процентов составляют научно-популярные книги?', percent, [
      step('Сколько процентов соответствуют всем ' + whole + ' книгам?', 100, 'Всему количеству книг соответствует 100%.', whole + ' книг ↔ 100%', ['Целое: ' + whole + ' книг.', 'Часть: ' + part + ' книг.']),
      step('Составляем пропорцию: x/100 = ' + part + '/?. Какое число поставим в знаменатель справа?', whole, 'Сравниваем часть с целым. В знаменателе должно стоять целое.', 'Пропорция: x/100 = ' + part + '/' + whole, [part + ' книг ↔ x%.', 'Процент части / 100 = часть / целое.']),
      step('По пропорции ' + whole + ' × x = ' + part + ' × 100. Вычисли правую часть.', part * 100, 'Находим произведение при умножении крест-накрест.', whole + ' × x = ' + part * 100, ['Произведения крест-накрест равны.', 'Ищем процент, поэтому часть сопоставлена с x.']),
      step('Найди x: ' + (part * 100) + ' : ' + whole + '.', percent, 'Раздели произведение на известный множитель.', 'x = ' + percent + '%', [whole + ' × x = ' + part * 100 + '.', 'Ответ выражен в процентах.']),
      step('Проверка: найди ' + percent + '% от ' + whole + ': ' + whole + ' × ' + percent + ' : 100.', part, 'Должно получиться число научно-популярных книг из условия.', 'Проверка: ' + whole + ' × ' + percent + ' : 100 = ' + part, ['Найденный процент сопоставляем с частью.', 'Целое по-прежнему соответствует 100%.'])
    ], { ...visual, unknown: 'percent' });
  }

  const api = { topics, make };
  root.SovietAdvanced = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
