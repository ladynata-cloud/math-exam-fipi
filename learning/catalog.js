/* One identity per learning item. Topic and exam views are projections of it.
 * Path rows mirror PathData.meta; tools/learning-catalog-reference-test.cjs
 * checks the catalogue against all three source data modules. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LearningCatalog = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const pathRows = [
    ["round",1,"Покупка целых упаковок","rounding",false],
    ["units",2,"Величины в реальном мире","units",false],
    ["data",3,"Читать таблицу и диаграмму","add",false],
    ["formulas",4,"Подстановка в формулу","order",false],
    ["probability",5,"Доля подходящих исходов","fraction",false],
    ["choice",6,"Цена с доставкой и ограничениями","percent",false],
    ["graphs",7,"Наклон, изменение и производная","signs",false],
    ["logic",8,"Все, некоторые, ни один","logic",false],
    ["grid",9,"Площадь по клеткам","fraction",false],
    ["practical",10,"План, масштаб и площадь","units",false],
    ["box",11,"Объём и поверхность коробки","units",false],
    ["triangle",12,"Высота и теорема Пифагора","powers",false],
    ["quadrilateral",12,"Параллелограмм и трапеция","fraction",false],
    ["circle",12,"Окружность, хорда и угол","powers",false],
    ["roundbody",13,"Цилиндр, конус и шар","formulas",false],
    ["pyramid",13,"Призма, пирамида и высота","triangle",false],
    ["scale",13,"Подобие и сечения","powers",false],
    ["fractions",14,"Дроби в одном выражении","fraction",false],
    ["percent",15,"Процент от нужного целого","percent",false],
    ["powers",16,"Степени и корни","signs",false],
    ["expressions",16,"Сокращение выражений и ОДЗ","identities",false],
    ["functions",16,"Логарифмы и круг","powers",false],
    ["equations",17,"Уравнения: сохранить равенство","signs",false],
    ["numberline",18,"Числа и условия на оси","signs",false],
    ["integers",19,"Вычеркнуть цифры: делимость на 22","divisibility",false],
    ["motion",20,"Средняя скорость на трёх участках","division",false],
    ["mixtures",20,"Растворы и сохранение вещества","percent",false],
    ["reasoning",21,"Кольцо с неизвестной длиной","logic",false],
    ["practice-change",1,"Покупка и сдача","order",false],
    ["practice-afford",1,"На сколько покупок хватит денег","division",false],
    ["practice-transport",1,"Места для всех пассажиров","division",false],
    ["practice-units-match",2,"Соотнести величину и единицу","units",false],
    ["practice-time",2,"Часы, минуты и секунды","units",false],
    ["practice-area-units",2,"Перевод единиц площади","units",false],
    ["practice-chart",3,"Максимум и минимум на диаграмме","add",false],
    ["practice-ranking",3,"Место команды в таблице","add",false],
    ["practice-interval-data",3,"Сумма за нужный промежуток","add",false],
    ["practice-electric",4,"Квадрат в физической формуле","powers",false],
    ["practice-temperature",4,"Линейная формула и отрицательные числа","signs",false],
    ["practice-inverse-formula",4,"Найти неизвестное из формулы","division",false],
    ["practice-probability-draw",5,"Равновозможный выбор","fraction",false],
    ["practice-probability-opposite",5,"Противоположное событие","fraction",false],
    ["practice-delivery",6,"Бесплатная доставка: строгое условие","percent",false],
    ["practice-luggage",6,"Отбор по нескольким ограничениям","logic",false],
    ["practice-rental",6,"Аренда плюс расход топлива","proportion",false],
    ["practice-graph-match",7,"Соотнести участки графика и изменение","signs",false],
    ["practice-graph-slope",7,"Наклон прямой по двум точкам","signs",false],
    ["practice-logic-order",8,"Что обязательно следует из сравнения","logic",false],
    ["practice-logic-all",8,"Все, некоторые и обратное утверждение","logic",false],
    ["practice-grid-cut",9,"Площадь фигуры с вырезом","fraction",false],
    ["practice-grid-parallelogram",9,"Наклонная сторона и высота","fraction",false],
    ["practice-free-area",10,"Площадь участка без постройки","units",false],
    ["practice-fence",10,"Забор и проезд","units",false],
    ["practice-spokes",10,"Равные углы вокруг точки","division",false],
    ["practice-displacement",11,"Объём погружённой детали","proportion",false],
    ["practice-pour",11,"Переливание: радиус и уровень","proportion",false],
    ["practice-joined-surface",11,"Поверхность склеенных тел","units",false],
    ["practice-faces",11,"Считать внешние грани","logic",false],
    ["practice-right-ratio",12,"Синус и косинус в прямоугольном треугольнике","fraction",false],
    ["practice-triangle-angle",12,"Углы треугольника","add",false],
    ["practice-parallelogram",12,"Площадь через высоту","fraction",false],
    ["practice-diameter-chord",12,"Треугольник на диаметре","powers",false],
    ["practice-cone-area",13,"Боковая поверхность конуса","proportion",false],
    ["practice-pyramid-lateral",13,"Боковая площадь правильной пирамиды","powers",false],
    ["practice-box-diagonal",13,"Объём через диагональ грани","powers",false],
    ["practice-similar-volume",13,"Подобие: восстановить объём","powers",false],
    ["practice-fraction-add",14,"Дроби: общий размер доли","fractions",false],
    ["practice-fraction-divide",14,"Деление на дробь","fractions",false],
    ["practice-fraction-expression",14,"Порядок действий с дробями","fractions",false],
    ["practice-decimals",14,"Десятичные дроби: умножение и сложение","decimals",false],
    ["practice-decimal-division",14,"Деление на десятичную дробь","decimals",false],
    ["practice-fraction-percent",15,"Доля, десятичная дробь и процент","fractions",false],
    ["practice-percent-part",15,"Найти часть от целого","percent",false],
    ["practice-percent-whole",15,"Найти целое по его части","percent",false],
    ["practice-percent-rate",15,"Сколько процентов одно число от другого","percent",false],
    ["practice-ratio-parts",15,"Разделить в отношении","proportion",false],
    ["practice-direct-proportion",15,"Прямая пропорциональность","proportion",false],
    ["practice-inverse-proportion",15,"Обратная пропорциональность","proportion",false],
    ["practice-percent-change",15,"Цена после скидки или роста","percent",false],
    ["practice-percent-reverse",15,"Цена до изменения","percent",false],
    ["practice-percent-chain",15,"Два изменения — две базы","change",false],
    ["practice-root-product",16,"Корни и произведения","powers",false],
    ["practice-power-rules",16,"Действия со степенями","powers",false],
    ["practice-log-value",16,"Логарифм как показатель степени","powers",false],
    ["practice-identity-product",16,"Разность квадратов","identities",false],
    ["practice-trig-angle",16,"Тригонометрия: полный оборот","powers",false],
    ["practice-quadratic",17,"Квадратное уравнение: выбрать корень","equations",false],
    ["practice-radical-equation",17,"Уравнение с квадратным корнем","equations",false],
    ["practice-log-equation",17,"Логарифмическое уравнение","equations",false],
    ["practice-exponential-equation",17,"Показательное уравнение","equations",false],
    ["practice-rational-equation",17,"Дробное уравнение и запрет нуля","equations",false],
    ["practice-number-match",18,"Числа на оси: корни и логарифмы","powers",false],
    ["practice-inequality-match",18,"Сопоставить неравенства и промежутки","signs",false],
    ["practice-digits-multiple",19,"Число по признакам делимости","divisibility",false],
    ["practice-digits-product",19,"Делимость и произведение цифр","divisibility",false],
    ["practice-meeting",20,"Движение навстречу","proportion",false],
    ["practice-river",20,"Движение по течению и против","proportion",false],
    ["practice-work",20,"Совместная работа через доли","fractions",false],
    ["practice-mixture-water",20,"Добавить воду до нужной концентрации","percent",false],
    ["practice-average-speed",20,"Средняя скорость: не среднее чисел","proportion",false],
    ["practice-sets",21,"Два множества и пересечение","logic",false],
    ["practice-integer-budget",21,"Баллы за верные и неверные ответы","logic",false],
    ["practice-whole-count",21,"Оценка числа участников","logic",false],
    ["equations-linear",17,"Линейные: как в первом разборе","equations",true],
    ["equations-signs",17,"Линейные: минусы и отрицательные корни","equations",true],
    ["equations-fractions",17,"Линейные: дробный ответ","equations",true],
    ["equations-brackets",17,"Линейные: сначала раскрой скобки","equations",true]
  ];
  const topicDefinitions = [
    ['numbers', 'Числа, величины и вычисления'],
    ['fractions', 'Обыкновенные и десятичные дроби'],
    ['percent', 'Проценты и пропорции'],
    ['algebra', 'Выражения, уравнения и неравенства'],
    ['data', 'Таблицы, графики и вероятность'],
    ['plane', 'Планиметрия и геометрия на клетках'],
    ['solid', 'Объёмы и поверхности тел'],
    ['word', 'Движение, работа и смеси'],
    ['reasoning', 'Логика, числа и рассуждения'],
    ['foundation', 'Устранить пробелы']
  ];
  const positionTitles = [
    'Покупки и округление', 'Величины и единицы', 'Таблицы и диаграммы',
    'Вычисления по формуле', 'Вероятность', 'Выбор с ограничениями',
    'Графики и изменение', 'Логические утверждения', 'Геометрия на клетках',
    'Практическая геометрия', 'Модели пространственных тел', 'Планиметрия',
    'Стереометрия', 'Вычисления с числами', 'Проценты и пропорции',
    'Преобразование выражений', 'Уравнения', 'Числа и неравенства на оси',
    'Целые числа и делимость', 'Текстовые задачи', 'Логика и оценка'
  ];
  function topicFor(position) {
    if ([1, 2, 4].includes(position)) return 'numbers';
    if (position === 14) return 'fractions';
    if ([6, 15].includes(position)) return 'percent';
    if ([16, 17, 18].includes(position)) return 'algebra';
    if ([3, 5, 7].includes(position)) return 'data';
    if ([9, 10, 12].includes(position)) return 'plane';
    if ([11, 13].includes(position)) return 'solid';
    if (position === 20) return 'word';
    return 'reasoning';
  }
  const items = pathRows.map(([contentId, position, title, gap, trainingOnly]) => Object.freeze({
    id: 'path:' + contentId, trainerId: 'ege-path', contentId, title, position,
    topicId: topicFor(position), gap, trainingOnly, contentVersion: 1,
    url: '/ege-baza/path/index.html#lesson=' + encodeURIComponent(contentId),
    family: 'path'
  }));
  const remediationRows = [
    ["decimal-add-subtract","Десятичные дроби: сложение и вычитание"],
    ["fraction-common-denominator","Дроби: общий знаменатель и сложение"],
    ["fraction-meaning","Дробь: часть, целое и равные записи"],
    ["multiplication-division","Умножение и деление: одна семья действий"],
    ["multiplication-division/column-multiplication-one-digit","Умножение столбиком на одну цифру — по разрядам"],
    ["multiplication-division/column-multiplication-two-digit","Умножение столбиком на двузначное число — два произведения"],
    ["multiplication-division/decimal-division-natural","Десятичная дробь ÷ натуральное число"],
    ["multiplication-division/decimal-divisor-shift","Десятичная дробь ÷ десятичную"],
    ["multiplication-division/division-append-zeros","Деление не нацело: дописываем нули"],
    ["multiplication-division/division-lab","Лаборатория деления уголком"],
    ["multiplication-division/division-with-remainder","Деление с остатком: частное, остаток и проверка"],
    ["multiplication-division/long-division-from-simple-to-decimals","Деление уголком: от первого шага до десятичных дробей"],
    ["multiplication-division/long-division-mixed-checkpoint","Смешанная проверка: деление уголком"],
    ["multiplication-division/long-division-one-digit","Деление уголком на одну цифру — пошагово"],
    ["multiplication-division/long-division-quotient-digit","Цифра частного и линейка кратных"],
    ["multiplication-division/long-division-two-digit","Деление уголком на двузначный делитель"],
    ["multiplication-division/long-division-with-remainder","Деление уголком с остатком"],
    ["multiplication-division/long-division-zero-in-quotient","Нули в частном — не теряем разряд"],
    ["multiplication-division/multiplication-ladder","Таблица умножения: лесенка одной таблицы"],
    ["multiplication-division/multiplication-meaning","Умножение: смысл, группы и прямоугольные ряды"],
    ["multiplication-division/multiplication-mixed","Таблица умножения вперемешку и неизвестный множитель"],
    ["multiplication-division/multiplication-pythagoras-table","Таблица Пифагора: находим произведение по строке и столбцу"],
    ["multiplication-division/multiplication-tricks","Таблица умножения: понятные приёмы вместо угадывания"],
    ["multiplication-division/tabular-division","Табличное деление: умножение наоборот"],
    ["negative-add-subtract","Отрицательные числа: сложение и вычитание"],
    ["negative-number-line","Отрицательные числа на прямой"],
    ["order-of-operations","Порядок действий без путаницы"],
    ["percentages/percent-change","Увеличение, уменьшение и изменение"],
    ["percentages/percent-choose-question","Что спрашивают в задаче"],
    ["percentages/percent-final-checkpoint","Итоговая проверка по процентам"],
    ["percentages/percent-meaning","100%, 1% и доля"],
    ["percentages/percent-of-number-and-whole","Три вопроса о проценте"],
    ["percentages/proportion","Пропорция"],
    ["rounding","Округление: четыре шага и упаковки"],
    ["units-area","Квадратные единицы без ловушек"],
    ["units-length-time","Единицы длины и времени"]
  ];
  items.push(...remediationRows.map(([contentId, title]) => Object.freeze({
    id: 'oge-basics:' + contentId, trainerId: 'oge-basics', contentId, title,
    contentVersion: 1, position: null, topicId: 'foundation', family: 'remediation',
    url: '/trainers/oge-basics/' + contentId + '.html'
  })));
  const byId = Object.create(null);
  for (const item of items) {
    if (byId[item.id]) throw new Error('Duplicate learning item: ' + item.id);
    byId[item.id] = item;
  }
  const topics = topicDefinitions.map(([id, title]) => Object.freeze({
    id, title,
    positions: Object.freeze([...new Set(items.filter(item => item.topicId === id && item.position !== null).map(item => item.position))].sort((a, b) => a - b))
  }));
  const positions = positionTitles.map((title, index) => Object.freeze({ position: index + 1, title }));
  return Object.freeze({
    version: 1, items: Object.freeze(items), topics: Object.freeze(topics),
    positions: Object.freeze(positions), byId: Object.freeze(byId),
    get: id => byId[id] || null,
    byPosition: position => items.filter(item => item.position === Number(position)),
    byTopic: id => items.filter(item => item.topicId === id)
  });
});
