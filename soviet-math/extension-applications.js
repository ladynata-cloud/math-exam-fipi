(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SovietExtensionApplications = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Original exercises following the textbook topics. All decimal arithmetic
  // uses integers and a decimal scale, including the displayed intermediate work.
  var definitions = [
    ['decimal-place-value', 'Разряды десятичных дробей', 'Читаем целую и дробную части числа, различаем десятые, сотые и тысячные.'],
    ['decimal-compare', 'Сравнение десятичных дробей', 'Выражаем обе дроби в сотых и находим большее число.'],
    ['decimal-subtract', 'Вычитание десятичных дробей', 'Вычитаем одинаковые доли и записываем разность.'],
    ['decimal-multiply', 'Умножение десятичных дробей', 'Умножаем числа без запятых, затем определяем место запятой в произведении.'],
    ['decimal-multiply-ten', 'Умножение на 10, 100 и 1000', 'Увеличиваем число в несколько раз и прослеживаем изменение разрядов.'],
    ['decimal-divide-ten', 'Деление на 10, 100 и 1000', 'Уменьшаем число в несколько раз и переносим запятую влево.'],
    ['measure-length', 'Метры и сантиметры', 'Выражаем длину в сантиметрах, пользуясь соотношением единиц.'],
    ['measure-time', 'Часы и минуты', 'Переводим часы в минуты и находим всю продолжительность поездки.'],
    ['motion-distance', 'Задачи на нахождение расстояния', 'Находим путь по скорости и времени, затем проверяем решение.'],
    ['motion-speed', 'Задачи на нахождение скорости', 'Узнаём, какой путь пройден за один час равномерного движения.']
  ];
  var topics = definitions.map(function (item) {
    return { id: item[0], title: item[1], stage: 'more-applications', description: item[2], source: 'princev' };
  });
  var data = {
    place: [3405, 2070, 1056, 608, 7204, 9030, 4009, 2560, 8102, 12408, 5670, 304],
    compare: [[540, 508], [306, 360], [1205, 1250], [709, 790], [84, 8], [101, 110], [425, 405], [2080, 208], [590, 509], [1702, 1720], [990, 909], [603, 630]],
    subtract: [[520, 175], [804, 268], [730, 405], [902, 187], [640, 295], [1000, 375], [1206, 458], [405, 89], [1560, 785], [280, 96], [703, 426], [2005, 978]],
    multiply: [[12, 1, 35, 1], [24, 1, 15, 1], [125, 2, 24, 1], [36, 1, 8, 1], [75, 2, 16, 1], [205, 2, 3, 1], [18, 1, 25, 2], [42, 1, 15, 2], [32, 2, 45, 1], [14, 1, 14, 1], [225, 2, 12, 1], [64, 1, 25, 2]],
    timesTen: [[234, 10], [507, 100], [36, 1000], [1250, 10], [84, 100], [209, 1000], [680, 10], [405, 100], [72, 1000], [1025, 10], [315, 100], [906, 1000]],
    overTen: [[2340, 10], [5070, 100], [3600, 1000], [1250, 10], [8400, 100], [20900, 1000], [680, 10], [40500, 100], [720, 1000], [10250, 10], [31500, 100], [9060, 1000]],
    length: [[3, 45], [2, 8], [4, 60], [1, 75], [5, 20], [6, 4], [7, 35], [8, 50], [9, 9], [12, 40], [10, 25], [15, 6]],
    time: [[2, 35], [1, 45], [3, 20], [4, 5], [5, 15], [2, 50], [6, 30], [1, 8], [7, 40], [3, 55], [8, 10], [4, 25]],
    distance: [[4, 3], [3, 2], [5, 4], [6, 3], [4, 2], [5, 3], [3, 4], [6, 2], [4, 4], [5, 2], [3, 3], [6, 4]],
    speed: [[60, 3], [70, 2], [80, 4], [90, 3], [50, 5], [75, 2], [65, 4], [85, 2], [55, 3], [45, 4], [95, 2], [40, 5]]
  };

  function decimal(integer, places, fixed) {
    if (!Number.isSafeInteger(integer) || integer < 0 || !Number.isInteger(places) || places < 0 || places > 6) throw Error('Неверная десятичная запись.');
    if (!places) return String(integer);
    var digits = String(integer).padStart(places + 1, '0');
    var whole = digits.slice(0, -places), fraction = digits.slice(-places);
    if (!fixed) fraction = fraction.replace(/0+$/, '');
    return whole + (fraction ? ',' + fraction : '');
  }
  function step(prompt, answer, hint, record, helper, beforeHelper) {
    return { prompt: prompt, answer: String(answer), hint: hint + ' Ответ: ' + answer + '.', record: record, helper: helper, beforeHelper: beforeHelper || [] };
  }
  function plan(id, index, prompt, answer, steps, givens, model) {
    return { topicId: id, index: index, prompt: prompt, answer: String(answer), kind: 'standard', steps: steps,
      visual: Object.assign({}, model || { kind: 'facts' }, { rows: givens }) };
  }
  function make(id, index) {
    if (!topics.some(function (topic) { return topic.id === id; })) throw Error('Неизвестная тема: ' + id);
    if (index === undefined) index = 0;
    if (!Number.isSafeInteger(index) || index < 0 || index > 1000000) throw Error('Неверный номер упражнения.');
    var k = index % 12, selected, a, b, first, second, answer, steps, expression;

    if (id === 'decimal-place-value') {
      a = data.place[k];
      var whole = Math.floor(a / 1000), tenths = Math.floor(a / 100) % 10;
      var hundredths = Math.floor(a / 10) % 10, thousandths = a % 10;
      first = decimal(a, 3, true);
      steps = [
        step('Какая цифра показывает десятые в числе ' + first + '?', tenths,
          'Десятые стоят сразу после запятой. В этом числе их ' + tenths + '.', 'Десятых: ' + tenths,
          ['Первое место после запятой занимают десятые.'], ['Целая часть числа: ' + whole + '.', 'Разряды справа от запятой: десятые, сотые, тысячные.']),
        step('Какая цифра показывает сотые?', hundredths,
          'Сотые занимают второе место справа от запятой. Даже ноль занимает свой разряд.', 'Сотых: ' + hundredths,
          ['Десятые: ' + tenths + '. Сотые: ' + hundredths + '. Тысячные: ' + thousandths + '.']),
        step('Вырази всё число ' + first + ' в тысячных.', a,
          'В одной целой тысяча тысячных. ' + whole * 1000 + ' тысячных в целой части и ' + a % 1000 + ' в дробной; вместе ' + a + '.',
          first + ' = ' + a + ' тысячных',
          [whole + ' × 1000 + ' + a % 1000 + ' = ' + a, first + ' = ' + a + '/1000'],
          ['В одной целой 1000 тысячных.', whole ? 'Дробная часть: ' + a % 1000 + ' тысячных.' : 'Вспомни значения десятых, сотых и тысячных.'])
      ];
      return plan(id, index, 'Рассмотри число ' + first + '. Назови его разряды и вырази всё число в тысячных.', a, steps,
        ['Число: ' + first, 'Нужно выразить в тысячных.'],
        { kind: 'decimal-place', value: first, scaled: a, scale: 1000, whole: whole, tenths: tenths, hundredths: hundredths, thousandths: thousandths });
    }

    if (id === 'decimal-compare') {
      selected = data.compare[k]; a = selected[0]; b = selected[1];
      first = decimal(a, 2); second = decimal(b, 2); answer = decimal(Math.max(a, b), 2);
      steps = [
        step('Какое число больше: ' + first + ' или ' + second + '?', answer,
          'Выразим оба числа в сотых: ' + first + ' — это ' + a + ' сотых, а ' + second + ' — ' + b + ' сотых. Сравниваем одинаковые доли.',
          answer + ' > ' + decimal(Math.min(a, b), 2),
          [first + ' = ' + a + ' сотых', second + ' = ' + b + ' сотых', Math.max(a, b) + ' > ' + Math.min(a, b)],
          ['Сначала сравни целые части.', 'Если они равны, сравни десятые, затем сотые.'])
      ];
      return plan(id, index, 'Какое число больше: ' + first + ' или ' + second + '?', answer, steps,
        ['Первое число: ' + first, 'Второе число: ' + second],
        { kind: 'decimal-compare', a: first, b: second, aHundredths: a, bHundredths: b });
    }

    if (id === 'decimal-subtract') {
      selected = data.subtract[k]; a = selected[0]; b = selected[1];
      first = decimal(a, 2); second = decimal(b, 2); answer = decimal(a - b, 2); expression = first + ' − ' + second;
      steps = [
        step('Вычисли разность в сотых: ' + a + ' − ' + b + '.', a - b,
          'Оба числа выразили в сотых. Теперь вычитаем одинаковые доли: ' + a + ' − ' + b + ' = ' + (a - b) + '.',
          a + ' − ' + b + ' = ' + (a - b) + ' сотых',
          ['Полученная разность пока выражена в сотых.'],
          [first + ' = ' + a + ' сотых', second + ' = ' + b + ' сотых']),
        step('Запиши ' + (a - b) + ' сотых десятичной дробью.', answer,
          'Отделяем запятой две цифры справа: получаем ' + answer + '.', expression + ' = ' + answer,
          ['Сто сотых составляют одну целую.', 'После запятой стоят десятые и сотые.'])
      ];
      return plan(id, index, 'Вычисли: ' + expression + '.', answer, steps,
        ['Уменьшаемое: ' + first, 'Вычитаемое: ' + second],
        { kind: 'decimal-operation', operation: 'subtract', a: first, b: second, aInteger: a, bInteger: b, aPlaces: 2, bPlaces: 2, result: answer });
    }

    if (id === 'decimal-multiply') {
      selected = data.multiply[k]; a = selected[0]; b = selected[2];
      var placesA = selected[1], placesB = selected[3], places = placesA + placesB;
      first = decimal(a, placesA); second = decimal(b, placesB); answer = decimal(a * b, places);
      expression = first + ' × ' + second;
      steps = [
        step('Сначала умножь, не обращая внимания на запятые: ' + a + ' × ' + b + '.', a * b,
          'Выполняем умножение натуральных чисел. Получаем ' + a * b + '. Место запятой определим следующим действием.', a + ' × ' + b + ' = ' + a * b,
          ['Про запятые в исходных множителях не забываем.']),
        step('Поставь запятую в полученном числе. Чему равно ' + expression + '?', answer,
          'В множителях всего ' + places + ' цифры после запятых. Столько же цифр отделяем справа в произведении. Получаем ' + answer + '.', expression + ' = ' + answer,
          ['Если нужное число разрядов больше числа цифр, допиши слева нули.', 'Нули в конце дробной части можно отбросить.'],
          ['В первом множителе после запятой: ' + placesA + ' разр.', 'Во втором: ' + placesB + ' разр. Всего: ' + places + '.'])
      ];
      return plan(id, index, 'Вычисли: ' + expression + '.', answer, steps,
        ['Первый множитель: ' + first, 'Второй множитель: ' + second],
        { kind: 'decimal-operation', operation: 'multiply', a: first, b: second, aInteger: a, bInteger: b, aPlaces: placesA, bPlaces: placesB, result: answer });
    }

    if (id === 'decimal-multiply-ten') {
      selected = data.timesTen[k]; a = selected[0]; b = selected[1];
      var rightPlaces = String(b).length - 1;
      first = decimal(a, 2); answer = decimal(a * b, 2); expression = first + ' × ' + b;
      steps = [step('Вычисли: ' + expression + '.', answer,
        'Переносим запятую вправо на ' + rightPlaces + ' разр. Получаем ' + answer + '. Если цифр справа не хватает, дописываем нули.',
        expression + ' = ' + answer,
        ['Число увеличилось в ' + b + ' раз.', 'Запятая переместилась вправо на ' + rightPlaces + ' разр.'],
        ['В множителе ' + b + ' число нулей: ' + rightPlaces + '.', 'На столько мест переносим запятую вправо.'])];
      return plan(id, index, 'Вычисли: ' + expression + '.', answer, steps,
        ['Число: ' + first, 'Умножить на ' + b + '.'],
        { kind: 'decimal-shift', value: first, result: answer, direction: 'right', places: rightPlaces, factor: b, integer: a, scale: 100 });
    }

    if (id === 'decimal-divide-ten') {
      selected = data.overTen[k]; a = selected[0]; b = selected[1];
      var leftPlaces = String(b).length - 1;
      first = decimal(a, 2); answer = decimal(a, 2 + leftPlaces); expression = first + ' : ' + b;
      steps = [step('Вычисли: ' + expression + '.', answer,
        'Переносим запятую влево на ' + leftPlaces + ' разр. Получаем ' + answer + '. Если цифр слева не хватает, дописываем нули.',
        expression + ' = ' + answer,
        ['Число уменьшилось в ' + b + ' раз.', 'Запятая переместилась влево на ' + leftPlaces + ' разр.'],
        ['В делителе ' + b + ' число нулей: ' + leftPlaces + '.', 'На столько мест переносим запятую влево.'])];
      return plan(id, index, 'Вычисли: ' + expression + '.', answer, steps,
        ['Делимое: ' + first, 'Делитель: ' + b],
        { kind: 'decimal-shift', value: first, result: answer, direction: 'left', places: leftPlaces, factor: b, integer: a, scale: 100 });
    }

    if (id === 'measure-length') {
      selected = data.length[k]; a = selected[0]; b = selected[1]; answer = a * 100 + b;
      steps = [
        step('Сколько сантиметров в ' + a + ' м?', a * 100,
          'В каждом метре 100 сантиметров. Умножь ' + a + ' на 100.', a + ' м = ' + a * 100 + ' см',
          ['Пока переводим только полные метры.', 'Остальные ' + b + ' см прибавим затем.'], ['В одном метре 100 сантиметров.']),
        step('Прибавь оставшиеся ' + b + ' см. Какова длина всей ленты в сантиметрах?', answer,
          'Теперь обе части длины выражены в сантиметрах. Сложи ' + a * 100 + ' и ' + b + '.', a * 100 + ' + ' + b + ' = ' + answer + ' см',
          ['Складывать можно одинаковые единицы длины.', 'Учти и метры, и сантиметры из условия.'])
      ];
      return plan(id, index, 'Длина ленты ' + a + ' м ' + b + ' см. Вырази её длину в сантиметрах.', answer, steps,
        ['Длина ленты: ' + a + ' м ' + b + ' см', 'Ответ нужен в сантиметрах.'],
        { kind: 'measure', unit: 'length', major: a, minor: b, base: 100 });
    }

    if (id === 'measure-time') {
      selected = data.time[k]; a = selected[0]; b = selected[1]; answer = a * 60 + b;
      steps = [
        step('Сколько минут в ' + a + ' ч?', a * 60,
          'Умножь число часов на 60.', a + ' × 60 = ' + a * 60 + ' мин',
          ['Переводим в минуты только полные часы.', 'Остальные ' + b + ' мин пока сохраняем.'], ['В одном часе 60 минут.']),
        step('Сколько минут длилась вся поездка?', answer,
          'К ' + a * 60 + ' минутам прибавь оставшиеся ' + b + ' минут.', a * 60 + ' + ' + b + ' = ' + answer + ' мин',
          ['Обе части времени выражены в минутах.', 'Сложи их, чтобы узнать всё время.'])
      ];
      return plan(id, index, 'Поездка длилась ' + a + ' ч ' + b + ' мин. Сколько это минут?', answer, steps,
        ['Время поездки: ' + a + ' ч ' + b + ' мин', 'Ответ нужен в минутах.'],
        { kind: 'measure', unit: 'time', major: a, minor: b, base: 60 });
    }

    if (id === 'motion-distance') {
      selected = data.distance[k]; a = selected[0]; b = selected[1]; answer = a * b;
      steps = [
        step('Какое расстояние турист прошёл за ' + b + ' ч?', answer,
          'Чтобы найти расстояние, умножь скорость на время: ' + a + ' × ' + b + '.', 'Путь: ' + a + ' × ' + b + ' = ' + answer + ' км',
          ['Расстояние = скорость × время.', 'Каждый час турист проходил по ' + a + ' км.'], ['За каждый час турист проходил ' + a + ' км.', 'Таких часов было ' + b + '.']),
        step('Проверь: раздели ' + answer + ' км на ' + b + ' ч. Какая получится скорость?', a,
          'Найденный путь раздели на время. Должна получиться скорость из условия.', 'Проверка: ' + answer + ' : ' + b + ' = ' + a + ' км/ч',
          ['Скорость = расстояние : время.', 'Сравни результат с условием задачи.'])
      ];
      return plan(id, index, 'Турист шёл ' + b + ' ч со скоростью ' + a + ' км/ч. Какой путь он прошёл, если скорость не менялась?', answer, steps,
        ['Скорость: ' + a + ' км/ч', 'Время: ' + b + ' ч', 'Скорость не менялась.'],
        { kind: 'motion', speed: a, time: b, distance: answer, unknown: 'distance' });
    }

    selected = data.speed[k]; a = selected[0]; b = selected[1]; var distance = a * b;
    steps = [
      step('Сколько километров поезд проходил за один час?', a,
        'Раздели весь путь на время: ' + distance + ' : ' + b + '.', 'Скорость: ' + distance + ' : ' + b + ' = ' + a + ' км/ч',
        ['Скорость = расстояние : время.', 'Ответ показывает путь за один час.'], ['За каждый час поезд проходил одинаковый путь.', 'Разделим путь поровну между всеми часами.']),
      step('Проверь: какой путь поезд пройдёт за ' + b + ' ч с найденной скоростью?', distance,
        'Умножь скорость ' + a + ' км/ч на время ' + b + ' ч. Должен получиться путь из условия.', 'Проверка: ' + a + ' × ' + b + ' = ' + distance + ' км',
        ['Расстояние = скорость × время.', 'Сравни результат с условием задачи.'])
    ];
    return plan(id, index, 'Поезд за ' + b + ' ч прошёл ' + distance + ' км. С какой скоростью он шёл, если скорость не менялась?', a, steps,
      ['Путь: ' + distance + ' км', 'Время: ' + b + ' ч', 'Скорость не менялась.'],
      { kind: 'motion', speed: a, time: b, distance: distance, unknown: 'speed' });
  }

  return { topics: topics, make: make, examplesPerTopic: 12 };
}));
