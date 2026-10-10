(function (root) {
  'use strict';

  // Explicit teaching steps for tasks whose short answer explanation skips a
  // necessary mathematical link. Values are calculated from the task metadata.
  const number = value => String(Number(Number(value).toFixed(10))).replace('.', ',');
  const step = (title, ...lines) => ({ title, lines });
  const formula = value => ({ formula: value });
  const fraction = (before, numerator, denominator, after = '') => ({
    fraction: { before, numerator: String(numerator), denominator: String(denominator), after }
  });
  const proportion = (a, b, c, d) => ({
    proportion: { left: [String(a), String(b)], right: [String(c), String(d)] }
  });
  const crossRule = 'Произведение крайних членов пропорции равно произведению средних.';
  const factorRule = 'Чтобы найти неизвестный множитель, нужно произведение разделить на известный множитель.';
  const details = {};

  function solveFactor(symbol, coefficient, left, right) {
    const product = left * right;
    const answer = product / coefficient;
    return [
      step('Перемножим крестиком', crossRule,
        `Запишем произведение с неизвестным ${symbol} слева.`,
        formula(`${symbol} · ${number(coefficient)} = ${number(left)} · ${number(right)}`)),
      step('Вычислим известное произведение',
        formula(`${number(left)} · ${number(right)} = ${number(product)}`),
        formula(`${symbol} · ${number(coefficient)} = ${number(product)}`)),
      step('Найдём неизвестный множитель', factorRule,
        formula(`${symbol} = ${number(product)} : ${number(coefficient)} = ${number(answer)}`))
    ];
  }

  details['geo-similarity-side'] = task => {
    const { from, to, side } = task.meta;
    const answer = side * to / from;
    return [
      step('Сопоставим вершины',
        'По записи ΔABC ∼ ΔDEF вершинам A, B, C соответствуют вершины D, E, F.',
        'Значит, стороне AB соответствует DE, а стороне BC — EF.'),
      step('Обозначим неизвестную сторону',
        `Пусть x — длина EF. Из условия: AB = ${number(from)}, DE = ${number(to)}, BC = ${number(side)}.`),
      step('Запишем пропорцию',
        'Отношения соответствующих сторон подобных треугольников равны. В обеих дробях сверху берём сторону треугольника ABC, снизу — сторону треугольника DEF.',
        proportion('AB', 'DE', 'BC', 'EF'),
        proportion(number(from), number(to), number(side), 'x')),
      ...solveFactor('x', from, side, to),
      step('Проверим найденную сторону',
        `Подставим x = ${number(answer)} в равенство произведений.`,
        formula(`${number(answer)} · ${number(from)} = ${number(side * to)}`),
        formula(`${number(side)} · ${number(to)} = ${number(side * to)}`),
        `Получили равные числа. Искомая сторона EF = ${number(answer)}.`)
    ];
  };

  details['geo-similarity-parallel'] = task => {
    const { from, to, side } = task.meta;
    const answer = side * to / from;
    return [
      step('Обоснуем подобие',
        'У треугольников ADE и ABC общий угол A.',
        'Углы ADE и ABC равны как соответственные при DE ∥ BC. Значит, ΔADE ∼ ΔABC по двум углам.'),
      step('Найдём соответствующие стороны',
        'Вершинам A, D, E малого треугольника соответствуют A, B, C большого.',
        'Поэтому AD соответствует AB, а DE — BC. Пусть x — длина DE.'),
      step('Запишем пропорцию',
        'В каждой дроби сверху — сторона малого треугольника, снизу — соответствующая сторона большого.',
        proportion('AD', 'AB', 'DE', 'BC'),
        proportion(number(to), number(from), 'x', number(side))),
      ...solveFactor('x', from, to, side),
      step('Проверим отрезок DE',
        formula(`${number(answer)} · ${number(from)} = ${number(to * side)}`),
        formula(`${number(to)} · ${number(side)} = ${number(to * side)}`),
        `Произведения равны. DE = ${number(answer)}; этот отрезок короче BC = ${number(side)}.`)
    ];
  };

  details['geo-similarity-perimeter'] = task => {
    const { from, to, side } = task.meta;
    const answer = side * to / from;
    return [
      step('Обозначим неизвестный периметр',
        `Пусть P — периметр большого треугольника. Периметр малого равен ${number(side)}.`),
      step('Свяжем периметры со сторонами',
        'Периметр — сумма трёх сторон. При подобии каждая сторона увеличивается в одно и то же число раз, значит, во столько же раз увеличивается их сумма.',
        `Поэтому периметры относятся так же, как соответствующие стороны: ${number(from)} : ${number(to)}.`),
      step('Запишем пропорцию',
        'В обеих дробях сохраняем порядок: величина малого треугольника сверху, большого — снизу.',
        proportion(number(from), number(to), number(side), 'P')),
      ...solveFactor('P', from, side, to),
      step('Проверим периметр',
        formula(`${number(answer)} · ${number(from)} = ${number(side * to)}`),
        formula(`${number(side)} · ${number(to)} = ${number(side * to)}`),
        `Равенство верно. Периметр большого треугольника равен ${number(answer)}.`)
    ];
  };

  details['geo-similarity-area'] = task => {
    const { from, to, area } = task.meta;
    const fromSquare = from * from;
    const toSquare = to * to;
    const answer = area * toSquare / fromSquare;
    return [
      step('Обозначим неизвестную площадь',
        `Пусть S — площадь большего треугольника. Площадь меньшего равна ${number(area)}.`),
      step('Вспомним, от чего зависит площадь',
        'Площадь треугольника равна половине произведения основания a и высоты h, проведённой к нему.',
        fraction('Площадь = ', 'a · h', '2'),
        'У подобных треугольников в одинаковое число раз изменяются соответствующие основания и проведённые к ним высоты. Поэтому площадь изменяется в квадрат этого числа раз.'),
      step('Найдём отношение площадей',
        `Стороны относятся как ${number(from)} : ${number(to)}. Возведём оба числа в квадрат.`,
        formula(`${number(from)}² = ${number(fromSquare)}`),
        formula(`${number(to)}² = ${number(toSquare)}`),
        `Площади меньшего и большего треугольников относятся как ${number(fromSquare)} : ${number(toSquare)}.`),
      step('Запишем пропорцию для площадей',
        'В обеих дробях сверху — число для меньшего треугольника, снизу — для большего.',
        proportion(number(fromSquare), number(toSquare), number(area), 'S')),
      ...solveFactor('S', fromSquare, area, toSquare),
      step('Проверим площадь',
        `Подставим S = ${number(answer)} в равенство произведений.`,
        formula(`${number(answer)} · ${number(fromSquare)} = ${number(area * toSquare)}`),
        formula(`${number(area)} · ${number(toSquare)} = ${number(area * toSquare)}`),
        `Произведения равны. Площадь большего треугольника равна ${number(answer)}.`)
    ];
  };

  details['geo-similarity-from-area'] = task => {
    const { from, to, side } = task.meta;
    const smallRoot = Math.sqrt(from);
    const largeRoot = Math.sqrt(to);
    const answer = side * largeRoot / smallRoot;
    return [
      step('Обозначим неизвестную сторону',
        `Пусть x — сторона большего треугольника, соответствующая стороне ${number(side)} меньшего.`),
      step('Перейдём от площадей к длинам',
        'При подобии в одинаковое число раз изменяются соответствующие основания и проведённые к ним высоты. Поэтому отношение площадей равно квадрату отношения соответствующих сторон.',
        `Площади относятся как ${number(from)} : ${number(to)}. Для отношения сторон извлечём квадратный корень из каждого числа.`),
      step('Извлечём корни',
        formula(`√${number(from)} = ${number(smallRoot)}`),
        formula(`√${number(to)} = ${number(largeRoot)}`),
        `Соответствующие стороны меньшего и большего треугольников относятся как ${number(smallRoot)} : ${number(largeRoot)}.`),
      step('Запишем пропорцию для сторон',
        'В обеих дробях сверху — число для меньшего треугольника, снизу — для большего.',
        proportion(number(smallRoot), number(largeRoot), number(side), 'x')),
      ...solveFactor('x', smallRoot, side, largeRoot),
      step('Проверим найденную сторону',
        formula(`${number(answer)} · ${number(smallRoot)} = ${number(side * largeRoot)}`),
        formula(`${number(side)} · ${number(largeRoot)} = ${number(side * largeRoot)}`),
        `Произведения равны. Сторона большего треугольника равна ${number(answer)}.`)
    ];
  };

  details['geo-similarity-split'] = task => {
    const { ad, db, ae } = task.meta;
    const ab = ad + db;
    const ac = ae * ab / ad;
    const ec = ac - ae;
    return [
      step('Найдём всю сторону AB',
        'Точка D лежит на стороне AB. Поэтому AB состоит из отрезков AD и DB.',
        formula(`AB = ${number(ad)} + ${number(db)} = ${number(ab)}`)),
      step('Обоснуем подобие',
        'У треугольников ADE и ABC общий угол A. Углы ADE и ABC равны как соответственные при DE ∥ BC.',
        'Значит, ΔADE ∼ ΔABC по двум углам. Стороне AD соответствует AB, стороне AE — AC.'),
      step('Сначала обозначим всю сторону AC',
        'Пусть x — длина AC. Она состоит из AE и EC. После нахождения AC вычтем AE и получим нужный отрезок EC.'),
      step('Составим пропорцию',
        'В каждой дроби сверху — сторона малого треугольника, снизу — соответствующая сторона большого.',
        proportion('AD', 'AB', 'AE', 'AC'),
        proportion(number(ad), number(ab), number(ae), 'x')),
      ...solveFactor('x', ad, ae, ab),
      step('Найдём именно отрезок EC',
        `Мы нашли всю сторону AC = ${number(ac)}. Из неё вычтем известную часть AE = ${number(ae)}.`,
        formula(`EC = ${number(ac)} − ${number(ae)} = ${number(ec)}`)),
      step('Проверим длины',
        formula(`AE + EC = ${number(ae)} + ${number(ec)} = ${number(ac)}`),
        formula(`${number(ac)} · ${number(ad)} = ${number(ae * ab)}`),
        formula(`${number(ae)} · ${number(ab)} = ${number(ae * ab)}`),
        `Части дают всю сторону AC, и пропорция верна. Ответ: EC = ${number(ec)}.`)
    ];
  };

  details['stereo-cube-edge'] = task => {
    const { volume } = task.meta;
    const edge = Math.cbrt(volume);
    return [
      step('Обозначим ребро', 'Пусть a — длина ребра куба. Длина, ширина и высота куба равны a.'),
      step('Запишем формулу объёма',
        'Объём равен произведению длины, ширины и высоты.',
        formula('V = a · a · a = a³')),
      step('Подставим известный объём',
        formula(`a³ = ${number(volume)}`),
        `Нужно положительное число, которое при умножении само на себя три раза даёт ${number(volume)}.`),
      step('Найдём это число',
        `Подходит ${number(edge)}. Проверим по действиям.`,
        formula(`${number(edge)} · ${number(edge)} = ${number(edge * edge)}`),
        formula(`${number(edge * edge)} · ${number(edge)} = ${number(volume)}`)),
      step('Запишем длину ребра',
        `Получили заданный объём. Ребро куба равно ${number(edge)}.`)
    ];
  };

  details['stereo-cube-volume-scale'] = task => {
    const { factor } = task.meta;
    return [
      step('Вспомним формулу объёма куба',
        'Пусть a — прежняя длина ребра.', formula('V = a · a · a')),
      step('Посмотрим, какие длины изменились',
        `Каждое ребро стало в ${number(factor)} раза больше. Увеличились все три измерения: длина, ширина и высота.`,
        formula(`V новый = (${number(factor)}a) · (${number(factor)}a) · (${number(factor)}a)`)),
      step('Соберём множители увеличения',
        `Множитель ${number(factor)} появляется три раза.`,
        formula(`Множитель объёма = ${number(factor)} · ${number(factor)} · ${number(factor)}`)),
      step('Умножим первые два числа',
        formula(`${number(factor)} · ${number(factor)} = ${number(factor * factor)}`)),
      step('Умножим на третье число',
        formula(`${number(factor * factor)} · ${number(factor)} = ${number(factor ** 3)}`),
        `Объём увеличился в ${number(factor ** 3)} раз.`)
    ];
  };

  details['stereo-cube-area-scale'] = task => {
    const { factor } = task.meta;
    return [
      step('Рассмотрим одну грань',
        'Грань куба — квадрат. Пусть прежняя длина ребра равна a.',
        formula('Площадь грани = a · a')),
      step('Увеличим оба измерения грани',
        `Длина и ширина грани увеличились в ${number(factor)} раза.`,
        formula(`Новая площадь грани = (${number(factor)}a) · (${number(factor)}a)`)),
      step('Найдём множитель площади',
        formula(`${number(factor)} · ${number(factor)} = ${number(factor * factor)}`),
        `Площадь одной грани увеличилась в ${number(factor * factor)} раз.`),
      step('Перейдём ко всей поверхности',
        'У куба по-прежнему шесть равных граней. Площадь каждой увеличилась в одинаковое число раз, поэтому во столько же раз увеличилась их сумма.',
        `Площадь всей поверхности увеличилась в ${number(factor * factor)} раз.`)
    ];
  };

  function prismHeight(task) {
    const { area, volume } = task.meta;
    const height = volume / area;
    return [
      step('Обозначим величины',
        `Пусть h — неизвестная высота призмы. Площадь основания S = ${number(area)}, объём V = ${number(volume)}.`),
      step('Запишем связь объёма и высоты',
        'Объём призмы равен произведению площади основания на высоту.',
        formula('V = S · h')),
      step('Подставим известные числа',
        'Запишем произведение с неизвестной высотой слева.',
        formula(`h · ${number(area)} = ${number(volume)}`)),
      step('Найдём неизвестный множитель', factorRule,
        fraction('h = ', number(volume), number(area), ` = ${number(height)}`)),
      step('Проверим высоту',
        formula(`${number(area)} · ${number(height)} = ${number(volume)}`),
        `Получили заданный объём. Высота призмы равна ${number(height)}.`)
    ];
  }
  details['stereo-prism-height'] = prismHeight;
  details['stereo-prism-height-new'] = prismHeight;

  details['stereo-prism-area'] = task => {
    const { h, volume } = task.meta;
    const area = volume / h;
    return [
      step('Обозначим неизвестную площадь',
        `Пусть S — площадь основания призмы. Известны высота h = ${number(h)} и объём V = ${number(volume)}.`),
      step('Запишем формулу объёма',
        'Объём призмы равен произведению площади основания на высоту.',
        formula('V = S · h')),
      step('Подставим числа',
        'Произведение с неизвестной площадью поставим слева.',
        formula(`S · ${number(h)} = ${number(volume)}`)),
      step('Найдём неизвестный множитель', factorRule,
        fraction('S = ', number(volume), number(h), ` = ${number(area)}`)),
      step('Проверим площадь основания',
        formula(`${number(area)} · ${number(h)} = ${number(volume)}`),
        `Получили заданный объём. Площадь основания равна ${number(area)}.`)
    ];
  };

  details['stereo-pyramid-prism'] = task => {
    const { prismVolume } = task.meta;
    const volume = prismVolume / 3;
    return [
      step('Отметим равные величины',
        'По условию у призмы и пирамиды равны площади оснований и высоты. Обозначим их S и h.'),
      step('Запишем объём призмы',
        formula('V призмы = S · h'),
        formula(`S · h = ${number(prismVolume)}`)),
      step('Запишем объём пирамиды',
        'Объём пирамиды равен трети произведения площади основания и высоты.',
        fraction('V пирамиды = ', 'S · h', '3')),
      step('Подставим известное произведение',
        fraction('V пирамиды = ', number(prismVolume), '3'),
        `Произведение S · h уже известно: оно равно объёму призмы ${number(prismVolume)}.`),
      step('Выполним деление',
        formula(`${number(prismVolume)} : 3 = ${number(volume)}`),
        `Объём пирамиды равен ${number(volume)}. Проверка: ${number(volume)} · 3 = ${number(prismVolume)}.`)
    ];
  };

  details['stereo-cone-lateral'] = task => {
    const { r, slant } = task.meta;
    const coefficient = r * slant;
    return [
      step('Выберем нужные длины',
        `Радиус основания r = ${number(r)}, образующая l = ${number(slant)}. Для боковой поверхности конуса нужны радиус и образующая.`),
      step('Запишем формулу боковой площади',
        'Обозначим площадь боковой поверхности буквой S.',
        formula('S = π · r · l')),
      step('Учтём, что спрашивается',
        'В задаче нужна площадь, делённая на π. Разделим обе части формулы на π: множитель π сократится.',
        fraction('', 'S', 'π', ' = r · l')),
      step('Подставим длины',
        fraction('', 'S', 'π', ` = ${number(r)} · ${number(slant)}`)),
      step('Вычислим ответ',
        formula(`${number(r)} · ${number(slant)} = ${number(coefficient)}`),
        `Сама боковая площадь равна ${number(coefficient)}π. В ответ записываем её значение после деления на π: ${number(coefficient)}.`)
    ];
  };

  details['stereo-sphere-scale'] = task => {
    const { factor } = task.meta;
    return [
      step('Запишем формулу объёма шара',
        'Пусть r — прежний радиус.', fraction('V = ', '4πr³', '3')),
      step('Изменим радиус в формуле',
        `Новый радиус равен ${number(factor)}r. Числа 4, π и 3 в формуле остаются теми же. Меняется только куб радиуса.`,
        formula(`(${number(factor)}r)³ = (${number(factor)}r) · (${number(factor)}r) · (${number(factor)}r)`)),
      step('Соберём множители увеличения',
        `Множитель ${number(factor)} появляется три раза.`,
        formula(`Множитель объёма = ${number(factor)} · ${number(factor)} · ${number(factor)}`)),
      step('Умножим первые два множителя',
        formula(`${number(factor)} · ${number(factor)} = ${number(factor * factor)}`)),
      step('Умножим на третий множитель',
        formula(`${number(factor * factor)} · ${number(factor)} = ${number(factor ** 3)}`),
        `Объём шара увеличился в ${number(factor ** 3)} раз.`)
    ];
  };

  function complementChance(task) {
    const { p } = task.meta;
    const answer = 1 - p;
    return [
      step('Разделим все исходы',
        'По условию посылку доставят либо вовремя, либо с опозданием. Эти события не могут произойти одновременно и вместе охватывают все исходы.'),
      step('Запишем сумму вероятностей',
        'Вероятность всех исходов вместе равна 1. Пусть x — вероятность опоздания.',
        formula(`x + ${number(p)} = 1`)),
      step('Найдём неизвестное слагаемое',
        'Чтобы найти неизвестное слагаемое, нужно из суммы вычесть известное слагаемое.',
        formula(`x = 1 − ${number(p)}`)),
      step('Выполним вычитание',
        formula(`1 − ${number(p)} = ${number(answer)}`),
        `Вероятность опоздания равна ${number(answer)}.`),
      step('Проверим сумму',
        formula(`${number(answer)} + ${number(p)} = 1`),
        'Обе вероятности дают 1: все исходы учтены.')
    ];
  }
  ['prob-complement-chance-2', 'prob-complement-chance-5'].forEach(id => { details[id] = complementChance; });

  function bothSensors(task) {
    const { p, q } = task.meta;
    const answer = p * q;
    return [
      step('Уточним нужное событие',
        'Нужно, чтобы сработали оба датчика: и первый, и второй.',
        `Вероятность срабатывания первого равна ${number(p)}, второго — ${number(q)}.`),
      step('Выберем правило',
        'По условию датчики работают независимо. Вероятность одновременного наступления двух независимых событий равна произведению их вероятностей.',
        formula('P(оба) = P(первый) · P(второй)')),
      step('Подставим вероятности',
        formula(`P(оба) = ${number(p)} · ${number(q)}`)),
      step('Выполним умножение',
        formula(`${number(p)} · ${number(q)} = ${number(answer)}`),
        `Вероятность срабатывания обоих датчиков равна ${number(answer)}.`),
      step('Проверим смысл результата',
        `Число ${number(answer)} находится между 0 и 1 и не больше каждой из вероятностей ${number(p)} и ${number(q)}.`,
        'Срабатывание обоих датчиков — часть случаев, когда срабатывает каждый отдельный датчик.')
    ];
  }
  ['prob-both-1', 'prob-both-4'].forEach(id => { details[id] = bothSensors; });

  function standardDeviation(task) {
    const { variance } = task.meta;
    const answer = Math.sqrt(variance);
    return [
      step('Различим две величины',
        `Известна дисперсия D = ${number(variance)}. Требуется стандартное отклонение; обозначим его σ.`),
      step('Запишем связь величин',
        'Стандартное отклонение — неотрицательный квадратный корень из дисперсии.',
        formula('σ = √D')),
      step('Подставим дисперсию',
        formula(`σ = √${number(variance)}`),
        `Нужно неотрицательное число, которое при умножении само на себя даёт ${number(variance)}.`),
      step('Найдём и проверим корень',
        formula(`${number(answer)} · ${number(answer)} = ${number(variance)}`),
        formula(`√${number(variance)} = ${number(answer)}`)),
      step('Запишем ответ',
        `Стандартное отклонение σ = ${number(answer)}.`)
    ];
  }
  ['prob-standard-2', 'prob-standard-5'].forEach(id => { details[id] = standardDeviation; });

  function exponentialWait(task) {
    const { time, survive } = task.meta;
    const answer = survive * survive;
    return [
      step('Сравним два времени ожидания',
        `Известна вероятность ждать дольше ${number(time)} минут. Нужно найти вероятность ждать дольше ${number(2 * time)} минут.`,
        formula(`${number(2 * time)} = 2 · ${number(time)}`)),
      step('Возьмём свойство из условия',
        'Для данного показательного распределения вероятность ожидания дольше 2t равна квадрату вероятности ожидания дольше t.',
        formula('P(T > 2t) = P(T > t) · P(T > t)')),
      step('Подставим данную вероятность',
        formula(`P(T > ${number(2 * time)}) = ${number(survive)} · ${number(survive)}`)),
      step('Выполним умножение',
        formula(`${number(survive)} · ${number(survive)} = ${number(answer)}`),
        `Вероятность ждать дольше ${number(2 * time)} минут равна ${number(answer)}.`),
      step('Проверим смысл',
        `Число ${number(answer)} находится между 0 и 1 и не больше ${number(survive)}.`,
        'Случаев ожидания дольше удвоенного времени не может быть больше, чем случаев ожидания дольше первоначального времени.')
    ];
  }
  ['prob-exponential-3', 'prob-exponential-6'].forEach(id => { details[id] = exponentialWait; });

  root.ProfileSolutionDetails = details;
  if (typeof module !== 'undefined' && module.exports) module.exports = details;
})(typeof globalThis !== 'undefined' ? globalThis : this);
