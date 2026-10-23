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
    ["multiplication-division/course-column-one-digit","Умножаем столбиком на одну цифру"],
    ["multiplication-division/course-column-two-digit","Умножаем столбиком на число из двух цифр"],
    ["multiplication-division/course-column-three-by-one","Три цифры умножаем на одну"],
    ["multiplication-division/course-column-four-by-one","Четыре цифры умножаем на одну"],
    ["multiplication-division/course-column-three-by-two","Три цифры умножаем на две"],
    ["multiplication-division/course-column-two-by-three","Две цифры умножаем на три"],
    ["multiplication-division/course-column-three-by-three","Три цифры умножаем на три"],
    ["multiplication-division/course-column-zeros","Нули внутри и в конце чисел"],
    ["multiplication-division/course-column-mixed","Разные столбики вперемешку"],
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
    ["multiplication-division/long-division-quotient-digit","Деление: подбираем одну цифру"],
    ["multiplication-division/quotient-estimate","Деление: округляем и прикидываем"],
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
    ["units-length-time","Единицы длины и времени"],
    ["multiplication-division/course-multiply-bridge","Умножение помогает делить"],
    ["multiplication-division/course-digit-choice","Подбираем одну цифру"],
    ["multiplication-division/course-multiply-two-digit","Умножаем на число из двух цифр"],
    ["multiplication-division/course-subtract","Вычитаем по порядку"],
    ["multiplication-division/course-first-part","С каких цифр начать"],
    ["multiplication-division/course-bring-digit","Переносим следующую цифру"],
    ["multiplication-division/course-whole-simple","Собираем всё деление"],
    ["multiplication-division/course-simple-check","Проверяем себя: простое деление"],
    ["multiplication-division/course-estimate","Округляем и прикидываем"],
    ["multiplication-division/course-whole-two-digit","Делим на число из двух цифр"],
    ["multiplication-division/course-zeros","Не пропускаем ноль"],
    ["multiplication-division/course-remainder","Что осталось после деления"],
    ["multiplication-division/course-decimal-natural","Запятая в ответе"],
    ["multiplication-division/course-append-zeros","Продолжаем после запятой"],
    ["multiplication-division/course-decimal-divisor","Убираем запятую справа"],
    ["multiplication-division/course-mixed-guided","Три вида деления по шагам"],
    ["multiplication-division/course-independent-check","Делим самостоятельно"]
  ];
  items.push(...remediationRows.map(([contentId, title]) => Object.freeze({
    id: 'oge-basics:' + contentId, trainerId: 'oge-basics', contentId, title,
    contentVersion: 1, position: null, topicId: 'foundation', family: 'remediation',
    url: '/trainers/oge-basics/' + contentId + '.html'
  })));
  // Grade 7 is its own curriculum, never an exam position.
  const grade7Rows = [
  [
    "grade7-a-expression-structure",
    "Как устроено выражение",
    "algebra",
    "order"
  ],
  [
    "grade7-a-opposite-expression",
    "Минус перед выражением",
    "algebra",
    "signs"
  ],
  [
    "grade7-a-two-variable-collect",
    "Подобные слагаемые с двумя буквами",
    "algebra",
    "identities"
  ],
  [
    "grade7-a-substitution-negative-fraction",
    "Подстановка отрицательной дроби",
    "algebra",
    "fractions"
  ],
  [
    "grade7-a-equation-two-brackets",
    "Уравнение с двумя скобками",
    "algebra",
    "equations"
  ],
  [
    "grade7-a-equation-denominators",
    "Уравнение: убираем знаменатели",
    "algebra",
    "equations"
  ],
  [
    "grade7-a-equation-decimals",
    "Уравнение с десятичными дробями",
    "algebra",
    "decimals"
  ],
  [
    "grade7-a-equation-word-perimeter",
    "Периметр: составляем уравнение",
    "algebra",
    "equations"
  ],
  [
    "grade7-g-segment-order",
    "Отрезки: целое и части",
    "geometry",
    "units"
  ],
  [
    "grade7-g-midpoint-chain",
    "Середина отрезка и половины",
    "geometry",
    "division"
  ],
  [
    "grade7-g-angle-naming",
    "Название угла и его вершина",
    "geometry",
    "geometry"
  ],
  [
    "grade7-g-angle-addition",
    "Сложение и вычитание углов",
    "geometry",
    "add"
  ],
  [
    "grade7-g-angle-bisector",
    "Биссектриса: две равные части",
    "geometry",
    "division"
  ],
  [
    "grade7-g-adjacent-equation",
    "Смежные углы и уравнение",
    "geometry",
    "equations"
  ],
  [
    "grade7-g-vertical-chain",
    "Вертикальные и смежные углы",
    "geometry",
    "add"
  ],
  [
    "grade7-g-triangle-correspondence",
    "Равные треугольники: соответствие",
    "geometry",
    "geometry"
  ],
  [
    "grade7-b-mixed-borrow",
    "Смешанные числа: занимаем единицу",
    "foundation",
    "fractions"
  ],
  [
    "grade7-b-fraction-product-cancel",
    "Умножение дробей: сокращаем множители",
    "foundation",
    "fractions"
  ],
  [
    "grade7-b-fraction-division-meaning",
    "Деление дробей: что показывает частное",
    "foundation",
    "fractions"
  ],
  [
    "grade7-b-decimal-place-align",
    "Десятичные дроби: разряд под разрядом",
    "foundation",
    "decimals"
  ],
  [
    "grade7-b-decimal-divisor-scale",
    "Деление десятичных: делитель без запятой",
    "foundation",
    "division"
  ],
  [
    "grade7-b-signed-fraction-sum",
    "Дроби со знаками: общие доли",
    "foundation",
    "signs"
  ],
  [
    "grade7-b-ratio-units",
    "Отношения: сначала одинаковые единицы",
    "foundation",
    "proportion"
  ],
  [
    "grade7-b-percent-proportion",
    "Проценты через пропорцию",
    "foundation",
    "percent"
  ]
];
  grade7Rows.push(...[
  [
    "grade7-g-core-point-line-ray",
    "Точка, прямая, луч и отрезок",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-core-perpendicular",
    "Перпендикулярные прямые",
    "geometry",
    "angle"
  ],
  [
    "grade7-g-core-angle-measure",
    "Измеряем угол транспортиром",
    "geometry",
    "angle"
  ],
  [
    "grade7-g-core-triangle-elements",
    "Стороны, вершины и углы треугольника",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-core-triangle-perimeter",
    "Периметр треугольника",
    "geometry",
    "add"
  ],
  [
    "grade7-g-core-sas",
    "Первый признак равенства: две стороны и угол",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-core-median",
    "Медиана треугольника",
    "geometry",
    "fraction"
  ],
  [
    "grade7-g-core-bisector",
    "Биссектриса треугольника",
    "geometry",
    "fraction"
  ],
  [
    "grade7-g-core-altitude",
    "Высота внутри и вне треугольника",
    "geometry",
    "angle"
  ],
  [
    "grade7-g-core-isosceles-elements",
    "Равнобедренный треугольник: стороны и основание",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-core-isosceles-base-angles",
    "Равные углы при основании",
    "geometry",
    "angle"
  ],
  [
    "grade7-g-core-isosceles-vertex-line",
    "Три свойства линии из вершины",
    "geometry",
    "fraction"
  ]
]);
  grade7Rows.push(...[
  [
    "grade7-g-practice-segment-equation",
    "Отрезки: составь равенство из частей",
    "geometry",
    "add"
  ],
  [
    "grade7-g-practice-angle-parts",
    "Лучи и биссектрисы: найди нужную часть угла",
    "geometry",
    "angle"
  ],
  [
    "grade7-g-practice-vertical-proof",
    "Почему вертикальные углы равны",
    "geometry",
    "angle"
  ],
  [
    "grade7-g-practice-sas-common-side",
    "Первый признак: найди общую сторону",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-practice-sas-vertical",
    "Первый признак в пересекающихся отрезках",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-practice-cevian-reason",
    "Медиана, биссектриса или высота: что доказано?",
    "geometry",
    "logic"
  ],
  [
    "grade7-g-practice-isosceles-perimeter",
    "Равнобедренный треугольник: периметр и неизвестная сторона",
    "geometry",
    "add"
  ],
  [
    "grade7-g-practice-isosceles-proof",
    "Собери доказательство свойства равнобедренного треугольника",
    "geometry",
    "logic"
  ]
]);
  items.push(...grade7Rows.map(([contentId,title,subject,gap]) => Object.freeze({
    id: 'path:'+contentId, trainerId: 'ege-path', contentId, title, position: null,
    topicId: ({algebra:'algebra',geometry:'plane',foundation:'foundation'})[subject],
    gap, subject, grade7: true, trainingOnly: true, contentVersion: 1, family: 'path',
    url: '/ege-baza/path/index.html#lesson='+contentId
  })));
  // Original micro-lessons; metadata is checked against PathData by the integration gate.
  const geometryRebuildRows = [
    ["grade7-r-point-membership","Точка на прямой и на отрезке",1,[5,10],"Точка за концом отрезка может лежать на его прямой. Отрезок включает оба своих конца.",[]],
    ["grade7-r-segment-names","Концы и названия отрезка",1,[5,7],"Порядок концов отрезка можно поменять. У прямой нет концов, у луча одно начало.",["grade7-r-point-membership"]],
    ["grade7-r-segment-count","Все отрезки на рисунке",1,[7,10],"Два различных отмеченных конца задают один отрезок; обратное имя не создаёт нового отрезка.",["grade7-r-segment-names"]],
    ["grade7-r-ray-start","Начало и направление луча",2,[11,14],"Первая буква в имени луча — начало; вторая показывает направление.",["grade7-r-segment-names"]],
    ["grade7-r-ray-same","Разные названия одного луча",2,[11,13],"Одно начало и одно направление могут иметь несколько названий.",["grade7-r-ray-start"]],
    ["grade7-r-angle-vertex","Вершина и стороны угла",2,[11,14],"Вершина находится в середине трёхбуквенного названия. Обе стороны угла — лучи из этой вершины.",["grade7-r-ray-start"]],
    ["grade7-r-angle-count","Считаем неразвёрнутые углы",2,[13,14],"Каждая пара различных лучей задаёт угол; развёрнутые исключаем, если так требует вопрос.",["grade7-r-ray-same","grade7-r-angle-vertex"]],
    ["grade7-r-segment-part","Целый отрезок и его части",3,[15,17],"Если B между A и C, то AB + BC = AC.",["grade7-r-point-membership"]],
    ["grade7-r-midpoint","Середина отрезка",3,[15,17],"Середина принадлежит отрезку и делит его на две равные части.",["grade7-r-segment-part"]],
    ["grade7-r-equal-parts","Несколько равных частей",3,[16,17],"Одинаковые штрихи задают равные длины. Сначала считаем части, потом вычисляем.",["grade7-r-midpoint"]],
    ["grade7-r-angle-parts","Угол и его части",3,[18,20],"Внутренний луч делит угол на две части: целый угол равен их сумме.",["grade7-r-angle-vertex","grade7-r-segment-part"]],
    ["grade7-r-angle-bisector","Биссектриса делит угол пополам",3,[18,20],"Биссектриса — внутренний луч, делящий угол на два равных угла.",["grade7-r-angle-parts"]],
    ["grade7-r-angle-type","Острый, прямой, тупой угол",3,[18,20],"Сравни градусную меру с 90° и 180°. Границы проверяются отдельно.",["grade7-r-angle-vertex"]],
    ["grade7-r-angle-protractor","Транспортир: выбери начало отсчёта",3,[18,20],"Отсчёт начинают от нуля на стороне угла; два ненулевых отсчёта одной шкалы вычитают.",["grade7-r-angle-type"]],
    ["grade7-r-adjacent-identify","Когда углы смежные",4,[21,25],"Общая сторона обязательна, а две другие стороны должны быть противоположными лучами.",["grade7-r-angle-vertex","grade7-r-ray-same"]],
    ["grade7-r-adjacent-calc","Сумма смежных углов",4,[21,23],"Сумма смежных углов равна 180°.",["grade7-r-adjacent-identify"]],
    ["grade7-r-vertical-identify","Когда углы вертикальные",4,[21,25],"Для вертикальных углов стороны одного попарно противоположны сторонам другого.",["grade7-r-adjacent-identify"]],
    ["grade7-r-vertical-calc","Вертикальные и смежные углы",4,[22,26],"Вертикальный угол равен данному; смежный дополняет его до 180°.",["grade7-r-vertical-identify","grade7-r-adjacent-calc"]],
    ["grade7-r-adjacent-equation","Смежные углы: отношение и разность",4,[23,24],"Обозначь меньший угол x. Для «в k раз» запиши kx, для «на d°» — x + d.",["grade7-r-adjacent-calc"]],
    ["grade7-r-perpendicular","Перпендикулярные прямые",4,[21,26],"Перпендикулярные прямые образуют четыре прямых угла независимо от наклона рисунка.",["grade7-r-adjacent-calc","grade7-r-vertical-identify"]],
    ["grade7-r-triangle-elements","Вершины, стороны и углы треугольника",5,[27,28],"Противолежащая сторона не содержит выбранную вершину; угол между сторонами находится у их общего конца.",["grade7-r-angle-vertex"]],
    ["grade7-r-triangle-correspondence","Соответственные элементы равных треугольников",5,[29,32],"Равенство треугольников уже дано. Порядок букв указывает соответствие вершин, а затем сторон и углов.",["grade7-r-triangle-elements"]],
    ["grade7-r-perimeter-sum","Периметр и неизвестная сторона",5,[27,32],"Периметр — сумма трёх сторон. Для неизвестной стороны вычти две известные из периметра.",["grade7-r-triangle-elements","grade7-r-segment-part"]],
    ["grade7-r-perimeter-chain-more-half","Периметр: больше на и меньше вдвое",5,[27,32],"Сначала восстанови каждую сторону по условию, затем сложи три стороны.",["grade7-r-perimeter-sum"]],
    ["grade7-r-perimeter-chain-less-double","Периметр: меньше на и больше вдвое",5,[27,32],"Вычитание «на» и умножение «в» — разные действия. Сохраняй, с какой стороной идёт сравнение.",["grade7-r-perimeter-chain-more-half"]],
    ["grade7-r-perimeter-equation-fourfold","Периметр: уравнение с четырьмя долями",5,[27,32],"Обозначь первую сторону x, запиши две другие и сложи все три выражения.",["grade7-r-perimeter-chain-more-half"]],
    ["grade7-r-perimeter-equation-threefold","Периметр: уравнение с тремя долями",5,[27,32],"Проверяй, какая сторона больше на указанную величину, а какая — в несколько раз.",["grade7-r-perimeter-equation-fourfold"]],
    ["grade7-r-triangle-included-angle","Угол между двумя сторонами",6,[33,36],"Две выбранные стороны встречаются в вершине угла между ними.",[]],
    ["grade7-r-triangle-common-side","Общая сторона",6,[33,36],"Общий отрезок равен самому себе; это отдельное основание.",[]],
    ["grade7-r-triangle-vertical-angle","Вертикальные углы в доказательстве",6,[33,36],"Противоположные лучи образуют вертикальные углы; они равны.",["grade7-r-triangle-included-angle"]],
    ["grade7-r-triangle-proof-correspondence","Соответствующие вершины",6,[33,36],"Порядок букв фиксирует пары равных сторон и углов.",["grade7-r-triangle-included-angle"]],
    ["grade7-r-triangle-proof-reasons","Причина каждого равенства",6,[33,36],"Различай условие, общую сторону и свойство вертикальных углов.",["grade7-r-triangle-common-side","grade7-r-triangle-vertical-angle"]],
    ["grade7-r-triangle-sas-common","Первый признак и общая сторона",6,[33,36],"Две стороны и угол между ними дают первый признак.",["grade7-r-triangle-common-side","grade7-r-triangle-included-angle"]],
    ["grade7-r-triangle-sas-cross","Первый признак при пересечении",6,[33,36],"Равенство углов иногда нужно получить до применения признака.",["grade7-r-triangle-vertical-angle","grade7-r-triangle-proof-correspondence"]],
    ["grade7-r-triangle-sas-insufficient","Когда первый признак неприменим",6,[33,36],"Две стороны и угол, не заключённый между ними, не составляют признак равенства.",["grade7-r-triangle-included-angle"]],
    ["grade7-r-triangle-median","Медиана и половина стороны",7,[37,39],"Медиана соединяет вершину с серединой противоположной стороны.",[]],
    ["grade7-r-triangle-bisector","Биссектриса и половина угла",7,[37,39],"Биссектриса делит угол при вершине на два равных угла.",[]],
    ["grade7-r-triangle-altitude","Высота внутри и вне",7,[37,39],"Высота идёт из вершины перпендикулярно прямой противоположной стороны.",[]],
    ["grade7-r-triangle-cevian-choice","Медиана, биссектриса или высота",7,[37,39],"Название отрезка определяется данным свойством, а не его видом.",["grade7-r-triangle-median","grade7-r-triangle-bisector","grade7-r-triangle-altitude"]],
    ["grade7-r-triangle-isosceles-base","Основание равнобедренного треугольника",8,[40,42],"Основание лежит напротив вершины, где встречаются равные боковые стороны.",[]],
    ["grade7-r-triangle-isosceles-angle","Равные углы при основании",8,[40,42],"У равнобедренного треугольника равны именно углы при основании.",["grade7-r-triangle-isosceles-base"]],
    ["grade7-r-triangle-isosceles-cevian","Три свойства отрезка к основанию",8,[40,42],"Медиана, высота или биссектриса из вершины между равными сторонами к основанию имеет все три свойства.",["grade7-r-triangle-isosceles-base","grade7-r-triangle-cevian-choice","grade7-r-triangle-sas-common"]],
    ["grade7-r-triangle-asa-adjacent","Углы прилежащие к стороне",9,[43,46],"К стороне прилежат два угла при её концах.",["grade7-r-triangle-included-angle"]],
    ["grade7-r-triangle-asa-proof","Доказательство по второму признаку",9,[43,46],"Одна сторона и два прилежащих к ней угла дают второй признак.",["grade7-r-triangle-asa-adjacent","grade7-r-triangle-proof-correspondence"]],
    ["grade7-r-triangle-asa-consequence","Следствие второго признака",9,[43,46],"После доказательства равенства можно приравнять соответствующие элементы.",["grade7-r-triangle-asa-proof"]],
    ["grade7-r-triangle-sss-proof","Доказательство по трём сторонам",10,[47,50],"Три пары равных сторон дают третий признак без дополнительного условия об углах.",["grade7-r-triangle-common-side"]],
    ["grade7-r-triangle-congruence-choice","Первый, второй или третий признак",10,[47,50],"Выбирай признак по имеющимся данным, не по форме рисунка.",["grade7-r-triangle-sas-common","grade7-r-triangle-asa-proof","grade7-r-triangle-sss-proof"]],
    ["grade7-r-triangle-congruence-consequence","Равные элементы после доказательства",10,[47,50],"Сначала докажи равенство треугольников, затем используй правильное соответствие.",["grade7-r-triangle-sss-proof","grade7-r-triangle-proof-correspondence"]],
    ["grade7-r-circle-elements","Радиус, диаметр, хорда и дуга",11,[51,53],"Диаметр является хордой через центр; дуга — часть самой окружности.",[]],
    ["grade7-r-circle-radius-diameter","Связь радиуса и диаметра",11,[51,53],"Диаметр состоит из двух радиусов одной окружности.",["grade7-r-circle-elements"]],
    ["grade7-r-circle-isosceles","Равнобедренный треугольник из радиусов",11,[51,53],"Два радиуса одной окружности — равные стороны треугольника.",["grade7-r-circle-elements","grade7-r-triangle-isosceles-angle"]],
    ["grade7-r-circle-congruent-chords","Равные хорды через первый признак",11,[51,53],"Радиусы и вертикальные центральные углы дают равенство треугольников, затем хорд.",["grade7-r-circle-elements","grade7-r-triangle-sas-cross","grade7-r-triangle-congruence-consequence"]],
    ["grade7-r-parallel-pairs","Пары углов и секущая",12,[54,56],"Тип пары зависит от положения углов, а не от их номеров.",["grade7-r-adjacent-identify","grade7-r-vertical-identify"]],
    ["grade7-r-parallel-alternate","Признак: накрест лежащие углы",12,[57,59],"Равные накрест лежащие внутренние углы дают параллельность.",["grade7-r-parallel-pairs","grade7-r-adjacent-calc"]],
    ["grade7-r-parallel-corresponding","Признак: соответственные углы",12,[57,59],"Равные соответственные углы дают параллельность.",["grade7-r-parallel-pairs","grade7-r-adjacent-calc"]],
    ["grade7-r-parallel-sameside","Признак: сумма односторонних углов",12,[57,59],"Сумма 180° для односторонних внутренних углов даёт параллельность.",["grade7-r-parallel-pairs","grade7-r-adjacent-calc"]],
    ["grade7-r-parallel-equal-angles","Равные углы при параллельных прямых",13,[60,61],"Из известной параллельности получаем равенство углов — это свойство.",["grade7-r-parallel-alternate","grade7-r-parallel-corresponding"]],
    ["grade7-r-parallel-supplement","Односторонние углы: сумма 180°",13,[60,63],"При параллельных прямых односторонние внутренние углы дополняют друг друга до 180°.",["grade7-r-parallel-sameside"]],
    ["grade7-r-angle-parallel-sides","Углы с параллельными или перпендикулярными сторонами",13,[62,63],"Такие углы либо равны, либо имеют сумму 180°; выбираем по указанному виду угла.",["grade7-r-parallel-equal-angles","grade7-r-parallel-supplement","grade7-r-perpendicular"]],
    ["grade7-r-triangle-angle-sum","Третий угол треугольника",14,[64,65],"Сумма внутренних углов равна 180°; сначала отличаем внутренний угол от внешнего.",["grade7-r-triangle-elements","grade7-r-adjacent-calc","grade7-r-vertical-calc"]],
    ["grade7-r-triangle-angle-type","Вид треугольника по углам",14,[64,68],"Вид всего треугольника определяет его наибольший угол.",["grade7-r-triangle-angle-sum","grade7-r-angle-type"]],
    ["grade7-r-triangle-isosceles-angles","Углы равнобедренного треугольника",14,[65,66],"Равные боковые стороны дают равные углы при основании; затем используем 180°.",["grade7-r-triangle-angle-sum","grade7-r-triangle-isosceles-base"]],
    ["grade7-r-triangle-exterior-angle","Внешний угол треугольника",14,[67,68],"Внешний угол равен сумме двух внутренних, не смежных с ним.",["grade7-r-triangle-angle-sum","grade7-r-adjacent-identify"]],
    ["grade7-r-triangle-side-angle-order","Сторона и противолежащий угол",15,[69,72],"Наибольшей стороне противоположен наибольший угол; равных максимумов может быть несколько.",["grade7-r-triangle-angle-sum","grade7-r-triangle-elements"]],
    ["grade7-r-triangle-inequality","Существует ли треугольник",15,[71,72],"Длины положительны; сумма двух меньших строго больше наибольшей.",["grade7-r-triangle-side-angle-order"]],
    ["grade7-r-triangle-third-side","Допустимая третья сторона",15,[71,72],"Для третьей стороны c нужны строгие границы |a−b| < c < a+b.",["grade7-r-triangle-inequality"]],
    ["grade7-r-right-acute-angles","Острые углы прямоугольного треугольника",16,[73,76],"Два острых угла в сумме 90°; равные катеты дают 45° и 45°.",["grade7-r-triangle-angle-sum","grade7-r-triangle-isosceles-angles"]],
    ["grade7-r-right-thirty","Катет напротив 30°",16,[73,76],"Катет напротив 30° равен половине гипотенузы; обратное утверждение требует прямого угла.",["grade7-r-right-acute-angles"]],
    ["grade7-r-right-median","Медиана к гипотенузе",16,[73,76],"Медиана из прямого угла к гипотенузе равна половине гипотенузы.",["grade7-r-right-acute-angles","grade7-r-triangle-median","grade7-r-triangle-isosceles-angles"]],
    ["grade7-r-right-equal-legs","Равенство по двум катетам",17,[77,80],"Прямоугольность и две пары равных катетов позволяют переносить длины соответствующих элементов.",["grade7-r-right-acute-angles","grade7-r-triangle-proof-correspondence"]],
    ["grade7-r-right-leg-angle","Равенство по катету и прилежащему углу",17,[77,80],"Равные острые углы должны одинаково прилегать к выбранным катетам.",["grade7-r-right-equal-legs"]],
    ["grade7-r-right-hypotenuse-angle","Равенство по гипотенузе и острому углу",17,[77,80],"Различаем гипотенузу и катет; согласовываем острые вершины.",["grade7-r-right-equal-legs"]],
    ["grade7-r-right-hypotenuse-leg","Равенство по гипотенузе и катету",17,[77,80],"Это признак именно для двух прямоугольных треугольников.",["grade7-r-right-equal-legs"]],
    ["grade7-r-symbol-language","Переведи условие на язык символов",1,[8,10],"∈ — принадлежит; ∉ — не принадлежит; ∩ — пересечение.",[]],
    ["grade7-r-segment-network","Найди все отрезки, не считая дважды",1,[7,10],"Считай только нарисованные отрезки; обратное название не добавляет новый.",[]],
    ["grade7-r-construct-incidence","Построй отрезок по условию",1,[6,10],"Сначала выбери нужные концы; проверь, какие точки принадлежат отрезку.",[]],
    ["grade7-r-ray-count","Сколько лучей, а не сколько букв",2,[11,14],"Две точки в одном направлении от начала могут обозначать один луч.",[]],
    ["grade7-r-angle-region","Внутри угла, на стороне или снаружи",2,[12,14],"Точка на стороне не считается точкой внутренней области угла.",[]],
    ["grade7-r-angle-minutes","Градусы и угловые минуты",3,[18,20],"Один градус состоит из 60 угловых минут; минуты времени здесь не используются.",[]],
    ["grade7-r-construct-midpoint-bisector","Проверь построение середины и биссектрисы",3,[15,20],"Равные части нужно подтвердить отметками, а не внешним видом.",[]],
    ["grade7-r-construct-triangle-lines","Построй медиану, высоту или биссектрису",7,[37,39],"Выбирай отрезок по определению; три линии не обязаны совпадать.",[]],
    ["grade7-r-construct-secant","Построй секущую двух прямых",12,[54,59],"Секущая пересекает две прямые в двух разных точках.",[]],
    ["grade7-r-construct-exterior","Построй внешний угол",14,[67,68],"Для внешнего угла продли одну сторону за выбранную вершину.",[]],
    ["grade7-r-proof-builder-sas","Собери доказательство: первый признак",6,[33,36],"Собери основания по одному. Только после них сделай вывод.",[]],
    ["grade7-r-proof-builder-asa","Собери доказательство: второй признак",9,[43,46],"Собери основания по одному. Только после них сделай вывод.",[]],
    ["grade7-r-proof-builder-sss","Собери доказательство: третий признак",10,[47,50],"Собери основания по одному. Только после них сделай вывод.",[]],
    ["grade7-r-review-1","Найди ошибку: Точки и прямые",1,[5,10],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-2","Найди ошибку: Лучи и углы",2,[11,14],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-3","Найди ошибку: Части и измерение",3,[15,20],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-4","Найди ошибку: Смежные и вертикальные",4,[21,26],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-5","Найди ошибку: Треугольник",5,[27,32],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-6","Найди ошибку: Первый признак",6,[33,36],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-7","Найди ошибку: Медиана, высота, биссектриса",7,[37,39],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-8","Найди ошибку: Равнобедренный треугольник",8,[40,42],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-9","Найди ошибку: Второй признак",9,[43,46],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-10","Найди ошибку: Третий признак",10,[47,50],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-11","Найди ошибку: Окружность",11,[51,53],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-12","Найди ошибку: Признаки параллельности",12,[54,59],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-13","Найди ошибку: Свойства параллельных",13,[60,63],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-14","Найди ошибку: Углы треугольника",14,[64,68],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-15","Найди ошибку: Стороны и углы",15,[69,72],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-16","Найди ошибку: Прямоугольный треугольник",16,[73,76],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-review-17","Найди ошибку: Равенство прямоугольных",17,[77,80],"Проверь утверждение и объясни причину. Для опровержения достаточно одного контрпримера.",[]],
    ["grade7-r-photo-proof-1","По рисунку №1: первый признак",6,[],"Выбери треугольники, собери три основания и запиши вывод с верным соответствием.",[]],
    ["grade7-r-photo-proof-2","По рисунку №2: три стороны",10,[],"Выбери треугольники, собери три основания и запиши вывод с верным соответствием.",[]],
    ["grade7-r-photo-proof-3","По рисунку №3: первый признак",6,[],"Выбери треугольники, собери три основания и запиши вывод с верным соответствием.",[]]
  ];
  items.push(...geometryRebuildRows.map(([contentId,title,section,sourcePages,idea,prerequisites]) => Object.freeze({
    id: 'path:'+contentId, trainerId: 'ege-path', contentId, title, position: null,
    topicId: 'plane', gap: 'logic', subject: 'geometry', grade7: true, geometryRebuild: true,
    trainingOnly: true, contentVersion: 1, family: 'path', section, idea,
    sourcePages: Object.freeze(sourcePages), prerequisites: Object.freeze(prerequisites),
    url: '/ege-baza/path/index.html#lesson='+contentId
  })));
  // Earlier skills share the same saved attempts, with a separate course entry.
  const pre7Rows = [
  [
    "pre7-place-value",
    "Разряды числа и важные нули",
    "order"
  ],
  [
    "pre7-natural-compare",
    "Сравниваем натуральные числа",
    "order"
  ],
  [
    "pre7-add-carry",
    "Сложение с переносом разряда",
    "order"
  ],
  [
    "pre7-subtract-borrow",
    "Вычитание с разменом через нули",
    "order"
  ],
  [
    "pre7-smart-calculation",
    "Считаем удобным способом",
    "order"
  ],
  [
    "pre7-inverse-components",
    "Находим неизвестный компонент",
    "equations"
  ],
  [
    "pre7-divisibility",
    "Признаки делимости: замечаем закономерность",
    "division"
  ],
  [
    "pre7-scale-reading",
    "Шкала: деления и отметки",
    "reading"
  ],
  [
    "pre7-comparison-stories",
    "Задачи: на сколько и во сколько",
    "reading"
  ],
  [
    "pre7-fraction-line",
    "Дроби на числовом луче",
    "fractions"
  ],
  [
    "pre7-equivalent-fractions",
    "Равные дроби и сокращение",
    "fractions"
  ],
  [
    "pre7-fraction-compare",
    "Сравниваем обыкновенные дроби",
    "fractions"
  ],
  [
    "pre7-fraction-part-whole",
    "Доля, часть и целое",
    "fractions"
  ],
  [
    "pre7-decimal-compare",
    "Сравниваем десятичные дроби",
    "decimals"
  ],
  [
    "pre7-mass-capacity",
    "Масса и вместимость",
    "units"
  ],
  [
    "pre7-ruler-length",
    "Измеряем длину по линейке",
    "units"
  ],
  [
    "pre7-perimeter",
    "Периметр: обходим границу",
    "units"
  ],
  [
    "pre7-grid-area",
    "Площадь по клеткам",
    "units"
  ]
];
  items.push(...pre7Rows.map(([contentId,title,gap]) => Object.freeze({
    id: 'path:'+contentId, trainerId: 'ege-path', contentId, title, position: null,
    topicId: 'foundation', subject: 'foundation', gap, grade7: true, pre7: true,
    trainingOnly: true, contentVersion: 1, family: 'path',
    url: '/ege-baza/path/index.html#lesson='+contentId
  })));
  // The original 12 lessons / 144 exercises; each saved attempt is one full lesson.
  const motionRows = [
    ['distance', 'Находим путь'],
    ['speed', 'Находим скорость'],
    ['time', 'Находим время'],
    ['time-units', 'Часы и минуты'],
    ['meeting', 'Движение навстречу'],
    ['opposite-directions', 'В разные стороны'],
    ['catch-up', 'Вдогонку'],
    ['falling-behind', 'С отставанием'],
    ['downstream', 'По течению'],
    ['upstream', 'Против течения'],
    ['river-speeds', 'Узнаём скорости на реке'],
    ['round-trip', 'Туда и обратно']
  ];
  items.push(...motionRows.map(([contentId, title], lessonIndex) => Object.freeze({
    id: 'motion-grade6:' + contentId, trainerId: 'motion-grade6', contentId, title,
    contentVersion: 1, position: null, topicId: 'foundation', family: 'motion-grade6',
    grade6: true, trainingOnly: true, lessonIndex, taskCount: 12,
    url: '/trainers/motion-grade6/index.html#lesson=' + encodeURIComponent(contentId)
  })));
  // Published first part: one durable attempt for each of its 27 modules.
  const vilenkin6Rows = [
    [
        0,
        "Вспоминаем математику 5 класса",
        18
    ],
    [
        1,
        "Среднее арифметическое",
        18
    ],
    [
        2,
        "Проценты",
        18
    ],
    [
        3,
        "Круговые диаграммы",
        18
    ],
    [
        4,
        "Виды треугольников",
        18
    ],
    [
        5,
        "Множества",
        18
    ],
    [
        6,
        "Разложение числа на простые множители",
        15
    ],
    [
        7,
        "Наибольший общий делитель. Взаимно простые числа",
        15
    ],
    [
        8,
        "Наименьшее общее кратное натуральных чисел",
        18
    ],
    [
        9,
        "Приведение дробей к наименьшему общему знаменателю",
        17
    ],
    [
        10,
        "Сравнение, сложение и вычитание обыкновенных дробей",
        18
    ],
    [
        11,
        "Действия сложения и вычитания смешанных чисел",
        18
    ],
    [
        12,
        "Действие умножения смешанных чисел",
        18
    ],
    [
        13,
        "Нахождение дроби от числа",
        19
    ],
    [
        14,
        "Распределительное свойство умножения",
        18
    ],
    [
        15,
        "Деление смешанных чисел",
        20
    ],
    [
        16,
        "Нахождение числа по его дроби",
        15
    ],
    [
        17,
        "Дробные выражения",
        22
    ],
    [
        18,
        "Отношения",
        17
    ],
    [
        19,
        "Пропорция",
        17
    ],
    [
        20,
        "Прямая и обратная пропорциональные зависимости",
        15
    ],
    [
        21,
        "Масштаб",
        19
    ],
    [
        22,
        "Симметрии",
        18
    ],
    [
        23,
        "Длина окружности и площадь круга. Шар",
        21
    ],
    [
        24,
        "Применяем математику: покупки и данные",
        15
    ],
    [
        25,
        "Практикум: дроби в жизни",
        17
    ],
    [
        26,
        "Применяем математику: пропорции и измерения",
        15
    ]
];
  items.push(...vilenkin6Rows.map(([lessonId, title, taskCount]) => Object.freeze({
    id: 'vilenkin6-part1:lesson-' + lessonId, trainerId: 'vilenkin6-part1', contentId: 'lesson-' + lessonId,
    title, contentVersion: 1, position: null, topicId: 'foundation', family: 'vilenkin6-part1',
    grade6: true, trainingOnly: true, lessonId, taskCount,
    url: '/courses/vilenkin-6-part-1/index.html#lesson/' + lessonId + '/theory'
  })));
  items.push(Object.freeze({
    id: 'atanasyan-7-9:atanasyan-7-9-main-92-part-1', trainerId: 'atanasyan-7-9',
    contentId: 'atanasyan-7-9-main-92-part-1', title: 'Атанасян 7–9 · Задача 92а',
    contentVersion: 1, position: null, topicId: 'plane', family: 'atanasyan-7-9',
    grade7: true, trainingOnly: true, answerMode: 'manual', taskCount: 1,
    url: '/trainers/atanasyan-7-9.html'
  }));
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
    byPosition: position => items.filter(item => item.position === (position === null ? null : Number(position))),
    byTopic: id => items.filter(item => item.topicId === id)
  });
});
