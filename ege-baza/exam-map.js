(function (root) {
  'use strict';
  // Editorial labels follow the base-level FIPI 2027 draft. The lesson bank
  // remains the source of family IDs; this read-only view never writes progress.
  const definitions = [
    ['Практические расчёты и округление', 'Покупки, упаковки, поездки и округление ответа по смыслу.'],
    ['Величины и единицы измерения', 'Сопоставление величин и перевод единиц.'],
    ['Диаграммы и графики', 'Чтение данных, шкал и изменений величин.'],
    ['Вычисления по формулам', 'Подстановка значений и расчёт нужной величины.'],
    ['Вероятность', 'Подходящие исходы и вероятность события.'],
    ['Таблицы и выгодный выбор', 'Сравнение вариантов с учётом цены и ограничений.'],
    ['Графики функций и производная', 'Значения, рост, убывание и скорость изменения.'],
    ['Логические утверждения', 'Верные выводы, условия и контрпримеры.'],
    ['Площади на клетчатой сетке', 'Фигуры на клетках: разбиение и достраивание.'],
    ['Геометрия в жизни', 'Планы, масштаб, длины и площади.'],
    ['Объёмы и поверхности в жизни', 'Коробки, ёмкости и пространственные размеры.'],
    ['Планиметрия', 'Треугольники, четырёхугольники и окружности.'],
    ['Стереометрия', 'Призмы, пирамиды, цилиндры, конусы и шары.'],
    ['Дроби и числовые выражения', 'Порядок действий и вычисления с дробями.'],
    ['Проценты, доли и пропорции', 'Доли, изменение величины и восстановление целого.'],
    ['Степени, корни, логарифмы и тригонометрия', 'Значения и преобразования выражений.'],
    ['Уравнения', 'Поиск корней и проверка допустимых значений.'],
    ['Числовая прямая и неравенства', 'Сравнение чисел, интервалы и условия на оси.'],
    ['Числа, цифры и делимость', 'Подбор чисел, остатки и признаки делимости.'],
    ['Текстовые задачи', 'Движение, работа, смеси и зависимости величин.'],
    ['Задачи на рассуждение', 'Поиск закономерности, перебор и оценка результата.']
  ];
  const meta = () => (root.PathData?.meta || []).filter(item => !item.grade7 && !item.pre7 && Number.isInteger(item.pos) && item.pos >= 1 && item.pos <= 21);
  const href = pos => '#task?pos=' + pos;
  function catalog(journey) {
    const rows = new Map((journey?.lines || []).filter(line => line.id !== 'm07').flatMap(line => line.items || []).map(item => [item.id, item]));
    const seen = new Set();
    const families = meta().filter(item => !seen.has(item.id) && seen.add(item.id));
    return definitions.map(([title, description], index) => {
      const pos = index + 1;
      const items = families.filter(item => item.pos === pos).map(item => rows.get(item.id) || {
        id: item.id, title: item.title, href: '/ege-baza/path/index.html#lesson=' + item.id,
        source: 'path', status: 'unknown', started: null, independent: null, confirmed: null, resume: false
      });
      const count = field => items.some(item => typeof item[field] !== 'boolean') ? null : items.filter(item => item[field]).length;
      return { pos, title, description, href: href(pos), items, total: items.length, started: count('started'), independent: count('independent') };
    });
  }
  function forLesson(id) {
    const item = meta().find(item => item.id === id);
    return item ? { pos: item.pos, title: 'Задание №' + item.pos + ' · ' + definitions[item.pos - 1][0], href: '/ege-baza/index.html' + href(item.pos) } : null;
  }
  function nextLesson(id) {
    const item = meta().find(item => item.id === id);
    if (!item) return null;
    const group = meta().filter(candidate => candidate.pos === item.pos);
    const next = group[group.findIndex(candidate => candidate.id === id) + 1];
    return next ? { id: next.id, title: next.title, href: '/ege-baza/path/index.html#lesson=' + next.id } : null;
  }
  root.EgeBazaExamMap = Object.freeze({ catalog, forLesson, nextLesson });
})(typeof globalThis === 'object' ? globalThis : this);
