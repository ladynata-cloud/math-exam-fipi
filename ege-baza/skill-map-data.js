/* Learning routes for the existing EGE base trainers.
 * Read-only editorial data: viewing a route never changes learner results.
 * practiceIds name focused exercises, not proof that every listed action is mastered.
 * Empty practiceIds occur only in supplementary legacy routes where the main
 * 111-family bank has no separate focused exercise for that action.
 */
(function (root) {
  'use strict';
  const skillDefinitions = {
  "total-cost": {
    "id": "total-cost",
    "title": "Стоимость покупки",
    "description": "Умножить цену одной вещи на количество.",
    "practiceIds": [
      "practice-change",
      "choice"
    ]
  },
  "change": {
    "id": "change",
    "title": "Сдача",
    "description": "Вычесть стоимость покупки из переданной суммы.",
    "practiceIds": [
      "practice-change"
    ]
  },
  "count-total": {
    "id": "count-total",
    "title": "Общее количество",
    "description": "Учесть все группы людей или предметов из условия.",
    "practiceIds": [
      "practice-transport"
    ]
  },
  "remainder": {
    "id": "remainder",
    "title": "Целое частное и остаток",
    "description": "Определить, сколько полных групп получается и что остаётся.",
    "practiceIds": [
      "round",
      "practice-afford"
    ]
  },
  "round-up": {
    "id": "round-up",
    "title": "Округление вверх по смыслу",
    "description": "Округлить частное вверх, если целого количества должно хватить для выполнения условия.",
    "practiceIds": [
      "round",
      "practice-transport"
    ]
  },
  "round-down": {
    "id": "round-down",
    "title": "Округление вниз по смыслу",
    "description": "Выбрать наибольшее целое количество, не превышающее вычисленного значения.",
    "practiceIds": [
      "practice-afford"
    ]
  },
  "count-check": {
    "id": "count-check",
    "title": "Проверка целого количества",
    "description": "Умножить выбранное количество на цену или вместимость и сравнить с условием.",
    "practiceIds": [
      "round",
      "practice-afford",
      "practice-transport"
    ]
  },
  "read-units": {
    "id": "read-units",
    "title": "Величина и единица",
    "description": "Определить, что измеряется и в каких единицах дан результат.",
    "practiceIds": [
      "practice-units-match"
    ]
  },
  "size-estimate": {
    "id": "size-estimate",
    "title": "Оценка величины",
    "description": "Сопоставить числовое значение с реальным размером предмета.",
    "practiceIds": [
      "practice-units-match"
    ]
  },
  "length-factor": {
    "id": "length-factor",
    "title": "Перевод единиц длины",
    "description": "Использовать соотношение миллиметров, сантиметров, дециметров, метров и километров.",
    "practiceIds": [
      "practice-units-match",
      "practical"
    ]
  },
  "area-factor": {
    "id": "area-factor",
    "title": "Перевод единиц площади",
    "description": "Возвести коэффициент перевода длины в квадрат.",
    "practiceIds": [
      "practice-area-units"
    ]
  },
  "volume-factor": {
    "id": "volume-factor",
    "title": "Перевод единиц объёма",
    "description": "Учесть три измерения; связать литр с кубическим дециметром.",
    "practiceIds": [
      "units"
    ]
  },
  "power-factor": {
    "id": "power-factor",
    "title": "Квадрат и куб коэффициента",
    "description": "Различить коэффициенты перевода длины, площади и объёма.",
    "practiceIds": [
      "practice-area-units",
      "units"
    ]
  },
  "hours-minutes": {
    "id": "hours-minutes",
    "title": "Часы и минуты",
    "description": "Перевести каждый час в 60 минут.",
    "practiceIds": [
      "practice-time"
    ]
  },
  "mixed-time": {
    "id": "mixed-time",
    "title": "Составное значение времени",
    "description": "Сложить минуты, полученные из часов, с оставшимися минутами.",
    "practiceIds": [
      "practice-time"
    ]
  },
  "same-units": {
    "id": "same-units",
    "title": "Одинаковые единицы",
    "description": "Привести части расчёта к одной единице перед сложением или сравнением.",
    "practiceIds": [
      "practice-time",
      "practical"
    ]
  },
  "read-data": {
    "id": "read-data",
    "title": "Чтение таблицы",
    "description": "Найти значение на пересечении нужной строки и столбца.",
    "practiceIds": [
      "data",
      "practice-ranking"
    ]
  },
  "read-scale": {
    "id": "read-scale",
    "title": "Шкала диаграммы",
    "description": "Определить цену деления и считать значение столбца.",
    "practiceIds": [
      "practice-chart",
      "practice-interval-data"
    ]
  },
  "select-data": {
    "id": "select-data",
    "title": "Данные по условию",
    "description": "Выбрать только нужные дни, команды или промежутки.",
    "practiceIds": [
      "data",
      "practice-interval-data"
    ]
  },
  "sum-data": {
    "id": "sum-data",
    "title": "Сумма данных",
    "description": "Сложить выбранные значения, не пропуская и не повторяя их.",
    "practiceIds": [
      "data",
      "practice-interval-data",
      "practice-ranking"
    ]
  },
  "max-min": {
    "id": "max-min",
    "title": "Наибольшее и наименьшее",
    "description": "Сравнить значения и выбрать нужное по вопросу.",
    "practiceIds": [
      "practice-chart"
    ]
  },
  "rank": {
    "id": "rank",
    "title": "Место по результату",
    "description": "Посчитать участников с большим результатом и определить место.",
    "practiceIds": [
      "practice-ranking"
    ]
  },
  "answer-quantity": {
    "id": "answer-quantity",
    "title": "Величина в ответе",
    "description": "Отличить само значение от номера дня, места или подписи.",
    "practiceIds": [
      "practice-chart",
      "practice-ranking"
    ]
  },
  "formula-values": {
    "id": "formula-values",
    "title": "Подстановка в формулу",
    "description": "Поставить каждое значение на место соответствующей буквы.",
    "practiceIds": [
      "formulas",
      "practice-electric",
      "practice-temperature"
    ]
  },
  "formula-power": {
    "id": "formula-power",
    "title": "Степень в формуле",
    "description": "Возвести в степень именно указанную величину.",
    "practiceIds": [
      "formulas",
      "practice-electric"
    ]
  },
  "operation-order": {
    "id": "operation-order",
    "title": "Порядок вычислений",
    "description": "Сначала выполнить действия в скобках. Затем степени, умножение и деление, после них сложение и вычитание. Действия одной ступени выполнять слева направо.",
    "practiceIds": [
      "practice-fraction-expression",
      "practice-decimals"
    ]
  },
  "signed-product": {
    "id": "signed-product",
    "title": "Умножение со знаком",
    "description": "Определить знак произведения и вычислить его модуль.",
    "practiceIds": [
      "practice-temperature"
    ]
  },
  "signed-sum": {
    "id": "signed-sum",
    "title": "Сложение чисел разных знаков",
    "description": "Из большего модуля вычесть меньший и взять знак числа с большим модулем. При равных модулях сумма равна нулю.",
    "practiceIds": [
      "practice-temperature"
    ]
  },
  "formula-unknown": {
    "id": "formula-unknown",
    "title": "Неизвестное в формуле",
    "description": "Выразить нужную величину одинаковыми действиями с обеими частями.",
    "practiceIds": [
      "practice-inverse-formula"
    ]
  },
  "formula-check": {
    "id": "formula-check",
    "title": "Проверка подстановкой",
    "description": "Подставить найденное значение обратно в заданную зависимость.",
    "practiceIds": [
      "practice-inverse-formula"
    ]
  },
  "event": {
    "id": "event",
    "title": "Событие по условию",
    "description": "Указать, какие результаты выбора подходят к вопросу.",
    "practiceIds": [
      "practice-probability-draw",
      "probability"
    ]
  },
  "all-outcomes": {
    "id": "all-outcomes",
    "title": "Все исходы",
    "description": "Определить общее число равновозможных исходов.",
    "practiceIds": [
      "practice-probability-draw"
    ]
  },
  "favorable": {
    "id": "favorable",
    "title": "Благоприятные исходы",
    "description": "Посчитать подходящие исходы из того же множества.",
    "practiceIds": [
      "practice-probability-draw",
      "probability"
    ]
  },
  "probability": {
    "id": "probability",
    "title": "Вероятность как доля",
    "description": "Разделить число подходящих равновозможных исходов на число всех исходов.",
    "practiceIds": [
      "practice-probability-draw"
    ]
  },
  "opposite-event": {
    "id": "opposite-event",
    "title": "Противоположное событие",
    "description": "Вычесть вероятность противоположного события из единицы.",
    "practiceIds": [
      "practice-probability-opposite"
    ]
  },
  "full-cost": {
    "id": "full-cost",
    "title": "Полные расходы",
    "description": "Сложить все обязательные расходы для каждого варианта.",
    "practiceIds": [
      "choice",
      "practice-delivery",
      "practice-rental"
    ]
  },
  "compare-cost": {
    "id": "compare-cost",
    "title": "Выгодный подходящий вариант",
    "description": "Сравнить полные расходы только у допустимых вариантов.",
    "practiceIds": [
      "choice",
      "practice-delivery",
      "practice-rental"
    ]
  },
  "delivery": {
    "id": "delivery",
    "title": "Условие доставки",
    "description": "Проверить порог по стоимости товаров, затем добавить нужную плату.",
    "practiceIds": [
      "practice-delivery"
    ]
  },
  "strict-boundary": {
    "id": "strict-boundary",
    "title": "Строгое и нестрогое условие",
    "description": "Различить «больше» и «не меньше», «меньше» и «не больше».",
    "practiceIds": [
      "practice-delivery",
      "practice-luggage"
    ]
  },
  "all-conditions": {
    "id": "all-conditions",
    "title": "Все ограничения сразу",
    "description": "Проверить каждый показатель: вариант подходит, если выполнены все условия.",
    "practiceIds": [
      "practice-luggage"
    ]
  },
  "select-all": {
    "id": "select-all",
    "title": "Все подходящие варианты",
    "description": "Проверить весь список и записать номера только подходящих вариантов.",
    "practiceIds": [
      "practice-luggage"
    ]
  },
  "fuel-rate": {
    "id": "fuel-rate",
    "title": "Расход на весь путь",
    "description": "Пересчитать расход на 100 километров на длину поездки.",
    "practiceIds": [
      "practice-rental"
    ]
  },
  "graph-value": {
    "id": "graph-value",
    "title": "Значение функции",
    "description": "Найти ординату точки при заданной абсциссе.",
    "practiceIds": [
      "graphs"
    ]
  },
  "graph-change": {
    "id": "graph-change",
    "title": "Изменение на промежутке",
    "description": "Сравнить значение в конце промежутка со значением в начале.",
    "practiceIds": [
      "practice-graph-match",
      "practice-graph-slope"
    ]
  },
  "rise-fall": {
    "id": "rise-fall",
    "title": "Возрастание и убывание",
    "description": "Определить направление изменения при движении слева направо.",
    "practiceIds": [
      "practice-graph-match"
    ]
  },
  "change-rate": {
    "id": "change-rate",
    "title": "Скорость изменения",
    "description": "Сравнить изменения по вертикали на одинаковых промежутках по горизонтали.",
    "practiceIds": [
      "practice-graph-match"
    ]
  },
  "coordinate-difference": {
    "id": "coordinate-difference",
    "title": "Разности координат",
    "description": "Вычесть координаты в одном порядке: конечное значение минус начальное.",
    "practiceIds": [
      "practice-graph-slope"
    ]
  },
  "slope": {
    "id": "slope",
    "title": "Угловой коэффициент",
    "description": "Разделить изменение ординаты на ненулевое изменение абсциссы.",
    "practiceIds": [
      "practice-graph-slope"
    ]
  },
  "derivative": {
    "id": "derivative",
    "title": "Производная и касательная",
    "description": "Связать производную в точке с угловым коэффициентом касательной.",
    "practiceIds": [
      "graphs"
    ]
  },
  "value-vs-slope": {
    "id": "value-vs-slope",
    "title": "Значение и наклон",
    "description": "Различить высоту точки графика и наклон касательной.",
    "practiceIds": [
      "graphs",
      "practice-graph-slope"
    ]
  },
  "set-inclusion": {
    "id": "set-inclusion",
    "title": "Включение множеств",
    "description": "Понять, какая группа целиком входит в другую.",
    "practiceIds": [
      "logic",
      "practice-logic-all"
    ]
  },
  "set-difference": {
    "id": "set-difference",
    "title": "Оставшаяся часть группы",
    "description": "Вычесть количество элементов подгруппы из общего количества.",
    "practiceIds": [
      "logic",
      "practice-integer-budget"
    ]
  },
  "logic-words": {
    "id": "logic-words",
    "title": "Все и некоторые",
    "description": "Различить утверждение обо всех объектах и существование хотя бы одного.",
    "practiceIds": [
      "practice-logic-all"
    ]
  },
  "implication": {
    "id": "implication",
    "title": "Что следует из условия",
    "description": "Не заменять прямое утверждение обратным и не добавлять новых условий.",
    "practiceIds": [
      "practice-logic-all",
      "practice-logic-order"
    ]
  },
  "order-chain": {
    "id": "order-chain",
    "title": "Цепочка сравнений",
    "description": "Объединить сравнения, в которых есть общий участник.",
    "practiceIds": [
      "practice-logic-order"
    ]
  },
  "counterexample": {
    "id": "counterexample",
    "title": "Проверка вывода",
    "description": "Найти допустимый случай, в котором спорное утверждение неверно.",
    "practiceIds": [
      "practice-logic-order",
      "practice-logic-all"
    ]
  },
  "grid-length": {
    "id": "grid-length",
    "title": "Длина по клеткам",
    "description": "Посчитать промежутки между линиями сетки с учётом стороны клетки.",
    "practiceIds": [
      "grid",
      "practice-grid-parallelogram"
    ]
  },
  "rectangle-area": {
    "id": "rectangle-area",
    "title": "Площадь прямоугольника",
    "description": "Перемножить длины двух перпендикулярных сторон.",
    "practiceIds": [
      "practice-grid-cut",
      "practice-free-area"
    ]
  },
  "triangle-area": {
    "id": "triangle-area",
    "title": "Площадь треугольника",
    "description": "Взять половину произведения основания на соответствующую высоту.",
    "practiceIds": [
      "grid",
      "triangle"
    ]
  },
  "area-subtract": {
    "id": "area-subtract",
    "title": "Площадь оставшейся части",
    "description": "Вычесть площадь выреза или постройки из площади всей фигуры.",
    "practiceIds": [
      "practice-grid-cut",
      "practice-free-area"
    ]
  },
  "height": {
    "id": "height",
    "title": "Основание и высота",
    "description": "Найти высоту, перпендикулярную прямой выбранного основания.",
    "practiceIds": [
      "practice-grid-parallelogram",
      "practice-parallelogram"
    ]
  },
  "parallelogram-area": {
    "id": "parallelogram-area",
    "title": "Площадь параллелограмма",
    "description": "Умножить основание на проведённую к нему высоту.",
    "practiceIds": [
      "practice-parallelogram",
      "practice-grid-parallelogram"
    ]
  },
  "scale-length": {
    "id": "scale-length",
    "title": "Длина на плане и на местности",
    "description": "Применить масштаб к длине и перевести результат в нужные единицы.",
    "practiceIds": [
      "practical"
    ]
  },
  "square-area": {
    "id": "square-area",
    "title": "Площадь квадрата",
    "description": "Возвести длину стороны квадрата в квадрат.",
    "practiceIds": [
      "practice-free-area",
      "pyramid"
    ]
  },
  "perimeter": {
    "id": "perimeter",
    "title": "Периметр прямоугольника",
    "description": "Сложить длины всех четырёх сторон.",
    "practiceIds": [
      "practice-fence"
    ]
  },
  "fence-gap": {
    "id": "fence-gap",
    "title": "Незагороженная часть",
    "description": "Из полного периметра вычесть ширину проезда.",
    "practiceIds": [
      "practice-fence"
    ]
  },
  "full-turn": {
    "id": "full-turn",
    "title": "Полный угол",
    "description": "Использовать равенство полного угла 360°.",
    "practiceIds": [
      "practice-spokes"
    ]
  },
  "equal-angles": {
    "id": "equal-angles",
    "title": "Равные угловые промежутки",
    "description": "Определить количество одинаковых промежутков вокруг центра.",
    "practiceIds": [
      "practice-spokes"
    ]
  },
  "divide-angle": {
    "id": "divide-angle",
    "title": "Угол между соседними лучами",
    "description": "Разделить полный угол на число равных промежутков.",
    "practiceIds": [
      "practice-spokes"
    ]
  },
  "box-volume": {
    "id": "box-volume",
    "title": "Объём параллелепипеда",
    "description": "Умножить площадь основания на высоту.",
    "practiceIds": [
      "box",
      "practice-box-diagonal"
    ]
  },
  "box-surface": {
    "id": "box-surface",
    "title": "Площадь поверхности коробки",
    "description": "Сложить площади всех внешних граней.",
    "practiceIds": [
      "box",
      "practice-joined-surface"
    ]
  },
  "level-volume": {
    "id": "level-volume",
    "title": "Уровень и объём",
    "description": "В сосуде с постоянной площадью сечения связать высоту с объёмом.",
    "practiceIds": [
      "practice-displacement",
      "practice-pour"
    ]
  },
  "displacement": {
    "id": "displacement",
    "title": "Вытесненный объём",
    "description": "Найти увеличение объёма под уровнем воды при полном погружении детали.",
    "practiceIds": [
      "practice-displacement"
    ]
  },
  "volume-preserved": {
    "id": "volume-preserved",
    "title": "Сохранение объёма",
    "description": "При переливании без потерь сохранить объём жидкости.",
    "practiceIds": [
      "practice-pour"
    ]
  },
  "circle-area-ratio": {
    "id": "circle-area-ratio",
    "title": "Радиус и площадь круга",
    "description": "Изменить площадь в квадрат отношения радиусов раз.",
    "practiceIds": [
      "practice-pour"
    ]
  },
  "inverse-height": {
    "id": "inverse-height",
    "title": "Площадь дна и высота",
    "description": "При неизменном объёме уменьшить высоту во столько раз, во сколько выросла площадь дна.",
    "practiceIds": [
      "practice-pour"
    ]
  },
  "hidden-faces": {
    "id": "hidden-faces",
    "title": "Склеенные грани",
    "description": "Исключить из внешней поверхности обе соприкасающиеся грани.",
    "practiceIds": [
      "practice-joined-surface",
      "practice-faces"
    ]
  },
  "face-count": {
    "id": "face-count",
    "title": "Число внешних граней",
    "description": "Посчитать грани исходных тел и учесть склеивание.",
    "practiceIds": [
      "practice-faces"
    ]
  },
  "face-area": {
    "id": "face-area",
    "title": "Площадь одной грани",
    "description": "Распознать фигуру грани и вычислить её площадь.",
    "practiceIds": [
      "practice-joined-surface",
      "practice-pyramid-lateral"
    ]
  },
  "isosceles-height": {
    "id": "isosceles-height",
    "title": "Высота равнобедренного треугольника",
    "description": "Разделить основание пополам высотой, проведённой к нему.",
    "practiceIds": [
      "triangle",
      "practice-pyramid-lateral"
    ]
  },
  "pythagoras": {
    "id": "pythagoras",
    "title": "Теорема Пифагора",
    "description": "Связать квадраты гипотенузы и катетов прямоугольного треугольника.",
    "practiceIds": [
      "triangle",
      "practice-diameter-chord",
      "practice-box-diagonal"
    ]
  },
  "positive-length": {
    "id": "positive-length",
    "title": "Положительная длина",
    "description": "Извлечь неотрицательный корень из найденного квадрата длины.",
    "practiceIds": [
      "triangle",
      "circle",
      "practice-box-diagonal"
    ]
  },
  "trapezoid-midline": {
    "id": "trapezoid-midline",
    "title": "Средняя линия трапеции",
    "description": "Найти половину суммы оснований.",
    "practiceIds": [
      "quadrilateral"
    ]
  },
  "trapezoid-area": {
    "id": "trapezoid-area",
    "title": "Площадь трапеции",
    "description": "Умножить среднюю линию на высоту.",
    "practiceIds": [
      "quadrilateral"
    ]
  },
  "chord-bisector": {
    "id": "chord-bisector",
    "title": "Перпендикуляр к хорде",
    "description": "Использовать то, что перпендикуляр из центра делит хорду пополам.",
    "practiceIds": [
      "circle"
    ]
  },
  "chord-triangle": {
    "id": "chord-triangle",
    "title": "Треугольник с радиусом",
    "description": "Связать радиус, расстояние до хорды и половину хорды теоремой Пифагора.",
    "practiceIds": [
      "circle"
    ]
  },
  "whole-chord": {
    "id": "whole-chord",
    "title": "Длина всей хорды",
    "description": "Удвоить найденную половину хорды.",
    "practiceIds": [
      "circle"
    ]
  },
  "hypotenuse": {
    "id": "hypotenuse",
    "title": "Катеты и гипотенуза",
    "description": "Найти сторону против прямого угла и катеты относительно выбранного острого угла.",
    "practiceIds": [
      "practice-right-ratio",
      "practice-diameter-chord"
    ]
  },
  "right-ratio": {
    "id": "right-ratio",
    "title": "Синус и косинус острого угла",
    "description": "Для синуса взять противолежащий катет, для косинуса — прилежащий. Разделить выбранный катет на гипотенузу.",
    "practiceIds": [
      "practice-right-ratio"
    ]
  },
  "triangle-angles": {
    "id": "triangle-angles",
    "title": "Сумма углов треугольника",
    "description": "Использовать равенство суммы внутренних углов треугольника 180°.",
    "practiceIds": [
      "practice-triangle-angle"
    ]
  },
  "radius-diameter": {
    "id": "radius-diameter",
    "title": "Радиус и диаметр",
    "description": "Удвоить радиус, чтобы найти диаметр.",
    "practiceIds": [
      "practice-diameter-chord"
    ]
  },
  "diameter-angle": {
    "id": "diameter-angle",
    "title": "Угол на диаметре",
    "description": "Распознать прямой вписанный угол, опирающийся на диаметр.",
    "practiceIds": [
      "practice-diameter-chord"
    ]
  },
  "solid-formula": {
    "id": "solid-formula",
    "title": "Формула для тела",
    "description": "Выбрать формулу объёма цилиндра, конуса или шара.",
    "practiceIds": [
      "roundbody"
    ]
  },
  "radius-power": {
    "id": "radius-power",
    "title": "Степень радиуса",
    "description": "Учесть квадрат радиуса в площади основания и куб радиуса в объёме шара.",
    "practiceIds": [
      "roundbody"
    ]
  },
  "pi-factor": {
    "id": "pi-factor",
    "title": "Множитель π",
    "description": "Сохранить или сократить множитель π в соответствии с вопросом.",
    "practiceIds": [
      "roundbody",
      "practice-cone-area"
    ]
  },
  "pyramid-height": {
    "id": "pyramid-height",
    "title": "Высота пирамиды",
    "description": "Использовать расстояние от вершины до плоскости основания.",
    "practiceIds": [
      "pyramid"
    ]
  },
  "pyramid-volume": {
    "id": "pyramid-volume",
    "title": "Объём пирамиды",
    "description": "Взять треть произведения площади основания на высоту.",
    "practiceIds": [
      "pyramid"
    ]
  },
  "similar-lengths": {
    "id": "similar-lengths",
    "title": "Коэффициент подобия",
    "description": "Найти отношение соответствующих линейных размеров подобных тел.",
    "practiceIds": [
      "scale",
      "practice-similar-volume"
    ]
  },
  "similar-volumes": {
    "id": "similar-volumes",
    "title": "Отношение объёмов",
    "description": "Возвести отношение соответствующих длин в куб.",
    "practiceIds": [
      "scale",
      "practice-similar-volume"
    ]
  },
  "restore-volume": {
    "id": "restore-volume",
    "title": "Найти объём по отношению",
    "description": "Умножить или разделить известный объём на отношение объёмов.",
    "practiceIds": [
      "scale",
      "practice-similar-volume"
    ]
  },
  "cone-generatrix": {
    "id": "cone-generatrix",
    "title": "Радиус и образующая",
    "description": "Различить радиус, вертикальную высоту и образующую конуса.",
    "practiceIds": [
      "practice-cone-area"
    ]
  },
  "cone-lateral": {
    "id": "cone-lateral",
    "title": "Боковая площадь конуса",
    "description": "Использовать произведение π, радиуса и образующей.",
    "practiceIds": [
      "practice-cone-area"
    ]
  },
  "area-ratio": {
    "id": "area-ratio",
    "title": "Отношение площадей",
    "description": "Разделить площадь второй поверхности на площадь первой.",
    "practiceIds": [
      "practice-cone-area"
    ]
  },
  "pyramid-face-height": {
    "id": "pyramid-face-height",
    "title": "Высота боковой грани",
    "description": "Найти высоту равнобедренного треугольника боковой грани.",
    "practiceIds": [
      "practice-pyramid-lateral"
    ]
  },
  "pyramid-lateral": {
    "id": "pyramid-lateral",
    "title": "Боковая поверхность пирамиды",
    "description": "Сложить площади всех боковых граней.",
    "practiceIds": [
      "practice-pyramid-lateral"
    ]
  },
  "face-diagonal": {
    "id": "face-diagonal",
    "title": "Диагональ грани",
    "description": "Найти прямоугольный треугольник, образованный диагональю и рёбрами грани.",
    "practiceIds": [
      "practice-box-diagonal"
    ]
  },
  "common-denominator": {
    "id": "common-denominator",
    "title": "Общий знаменатель",
    "description": "Найти общий размер доли для обеих дробей.",
    "practiceIds": [
      "practice-fraction-add"
    ]
  },
  "equivalent-fraction": {
    "id": "equivalent-fraction",
    "title": "Равные дроби",
    "description": "Умножить числитель и знаменатель на одно и то же ненулевое число.",
    "practiceIds": [
      "practice-fraction-add"
    ]
  },
  "fraction-sum": {
    "id": "fraction-sum",
    "title": "Сумма дробей",
    "description": "Сложить числители дробей с общим знаменателем.",
    "practiceIds": [
      "practice-fraction-add"
    ]
  },
  "reciprocal": {
    "id": "reciprocal",
    "title": "Обратная дробь",
    "description": "Поменять местами числитель и знаменатель ненулевой дроби.",
    "practiceIds": [
      "practice-fraction-divide"
    ]
  },
  "fraction-product": {
    "id": "fraction-product",
    "title": "Произведение дробей",
    "description": "Перемножить числители и знаменатели, сократить результат.",
    "practiceIds": [
      "practice-fraction-divide"
    ]
  },
  "fraction-division": {
    "id": "fraction-division",
    "title": "Деление на дробь",
    "description": "Заменить деление умножением на обратную ненулевую дробь.",
    "practiceIds": [
      "practice-fraction-divide"
    ]
  },
  "decimal-product": {
    "id": "decimal-product",
    "title": "Умножение десятичных дробей",
    "description": "Выполнить умножение и учесть число знаков после запятой.",
    "practiceIds": [
      "practice-decimals"
    ]
  },
  "decimal-sum": {
    "id": "decimal-sum",
    "title": "Сложение по разрядам",
    "description": "Записать запятые друг под другом и сложить одинаковые разряды.",
    "practiceIds": [
      "practice-decimals"
    ]
  },
  "decimal-shift": {
    "id": "decimal-shift",
    "title": "Перенос запятой при делении",
    "description": "Умножить делимое и делитель на одну степень десяти.",
    "practiceIds": [
      "practice-decimal-division"
    ]
  },
  "integer-divisor": {
    "id": "integer-divisor",
    "title": "Целый делитель",
    "description": "Выбрать степень десяти, которая превращает делитель в целое число.",
    "practiceIds": [
      "practice-decimal-division"
    ]
  },
  "division-check": {
    "id": "division-check",
    "title": "Проверка деления",
    "description": "Умножить частное на делитель и сравнить с делимым.",
    "practiceIds": [
      "practice-decimal-division",
      "practice-fraction-divide"
    ]
  },
  "percent-base": {
    "id": "percent-base",
    "title": "Величина за 100%",
    "description": "Назвать целое, относительно которого считаются проценты.",
    "practiceIds": [
      "practice-percent-part",
      "practice-percent-rate"
    ]
  },
  "fraction-decimal": {
    "id": "fraction-decimal",
    "title": "Дробь в десятичной записи",
    "description": "Разделить числитель на знаменатель.",
    "practiceIds": [
      "practice-fraction-percent"
    ]
  },
  "percent-convert": {
    "id": "percent-convert",
    "title": "Доля и процент",
    "description": "Умножить долю на 100 для перехода к процентам; разделить процент на 100 для перехода к доле.",
    "practiceIds": [
      "practice-fraction-percent"
    ]
  },
  "one-percent": {
    "id": "one-percent",
    "title": "Один процент",
    "description": "Связать 1% с одной сотой выбранного целого.",
    "practiceIds": [
      "practice-percent-part",
      "practice-percent-whole"
    ]
  },
  "percent-part": {
    "id": "percent-part",
    "title": "Часть по проценту",
    "description": "Умножить целое на долю, соответствующую проценту.",
    "practiceIds": [
      "practice-percent-part"
    ]
  },
  "percent-whole": {
    "id": "percent-whole",
    "title": "Целое по части",
    "description": "Разделить известную часть на её долю от целого.",
    "practiceIds": [
      "practice-percent-whole"
    ]
  },
  "percent-rate": {
    "id": "percent-rate",
    "title": "Процентное отношение",
    "description": "Разделить часть на выбранное целое и умножить на 100%.",
    "practiceIds": [
      "practice-percent-rate"
    ]
  },
  "ratio-parts": {
    "id": "ratio-parts",
    "title": "Количество равных долей",
    "description": "Сложить числа в отношении и найти общее число долей.",
    "practiceIds": [
      "practice-ratio-parts"
    ]
  },
  "unit-part": {
    "id": "unit-part",
    "title": "Размер одной доли",
    "description": "Разделить всё количество на число равных долей.",
    "practiceIds": [
      "practice-ratio-parts"
    ]
  },
  "selected-parts": {
    "id": "selected-parts",
    "title": "Нужное число долей",
    "description": "Умножить размер одной доли на нужное количество долей.",
    "practiceIds": [
      "practice-ratio-parts"
    ]
  },
  "unit-price": {
    "id": "unit-price",
    "title": "Цена одной единицы",
    "description": "Разделить стоимость на количество одинаковых предметов.",
    "practiceIds": [
      "practice-direct-proportion"
    ]
  },
  "direct-proportion": {
    "id": "direct-proportion",
    "title": "Прямая пропорциональность",
    "description": "При постоянной цене изменить стоимость во столько же раз, во сколько количество.",
    "practiceIds": [
      "practice-direct-proportion"
    ]
  },
  "inverse-proportion": {
    "id": "inverse-proportion",
    "title": "Обратная пропорциональность",
    "description": "Для одного объёма работы сохранить произведение числа одинаковых исполнителей на время.",
    "practiceIds": [
      "practice-inverse-proportion"
    ]
  },
  "factor-change": {
    "id": "factor-change",
    "title": "Во сколько раз изменилась величина",
    "description": "Разделить новое значение на прежнее и применить этот коэффициент.",
    "practiceIds": [
      "practice-inverse-proportion",
      "practice-direct-proportion"
    ]
  },
  "percent-change": {
    "id": "percent-change",
    "title": "Изменение в процентах",
    "description": "Найти процент от прежней величины и прибавить его или вычесть.",
    "practiceIds": [
      "practice-percent-change"
    ]
  },
  "remaining-percent": {
    "id": "remaining-percent",
    "title": "Оставшийся процент",
    "description": "Определить, сколько процентов прежней величины составляет новая.",
    "practiceIds": [
      "practice-percent-reverse"
    ]
  },
  "reverse-change": {
    "id": "reverse-change",
    "title": "Величина до изменения",
    "description": "Восстановить прежнюю величину по новой и соответствующей ей доле.",
    "practiceIds": [
      "practice-percent-reverse"
    ]
  },
  "new-base": {
    "id": "new-base",
    "title": "Новая база процентов",
    "description": "На следующем шаге считать проценты от уже изменённой величины.",
    "practiceIds": [
      "practice-percent-chain",
      "percent"
    ]
  },
  "successive-change": {
    "id": "successive-change",
    "title": "Последовательные изменения",
    "description": "Выполнить изменения по порядку, сохраняя промежуточную величину.",
    "practiceIds": [
      "practice-percent-chain",
      "percent"
    ]
  },
  "power-product": {
    "id": "power-product",
    "title": "Произведение степеней",
    "description": "Для одинакового основания сложить показатели.",
    "practiceIds": [
      "practice-power-rules"
    ]
  },
  "power-quotient": {
    "id": "power-quotient",
    "title": "Частное степеней",
    "description": "Для одинакового ненулевого основания вычесть показатели.",
    "practiceIds": [
      "practice-power-rules"
    ]
  },
  "power-value": {
    "id": "power-value",
    "title": "Значение степени",
    "description": "Вычислить степень с найденным целым показателем.",
    "practiceIds": [
      "practice-power-rules",
      "practice-exponential-equation"
    ]
  },
  "root-product": {
    "id": "root-product",
    "title": "Произведение квадратных корней",
    "description": "Для неотрицательных подкоренных чисел объединить корни в один.",
    "practiceIds": [
      "practice-root-product"
    ]
  },
  "arithmetic-root": {
    "id": "arithmetic-root",
    "title": "Арифметический квадратный корень",
    "description": "Найти неотрицательное число с заданным квадратом.",
    "practiceIds": [
      "practice-root-product"
    ]
  },
  "root-of-square": {
    "id": "root-of-square",
    "title": "Корень из квадрата",
    "description": "Использовать √(a²)=|a|, сохраняя неотрицательный результат.",
    "practiceIds": [
      "powers"
    ]
  },
  "difference-squares": {
    "id": "difference-squares",
    "title": "Разность квадратов",
    "description": "Применить равенство (a−b)(a+b)=a²−b².",
    "practiceIds": [
      "practice-identity-product",
      "expressions"
    ]
  },
  "factor-cancel": {
    "id": "factor-cancel",
    "title": "Сокращение множителей",
    "description": "Сократить общий ненулевой множитель, сохранив ограничения исходной дроби.",
    "practiceIds": [
      "expressions"
    ]
  },
  "fraction-domain": {
    "id": "fraction-domain",
    "title": "Ненулевой знаменатель",
    "description": "Исключить значения, обращающие исходный знаменатель в ноль.",
    "practiceIds": [
      "expressions",
      "practice-rational-equation"
    ]
  },
  "expression-value": {
    "id": "expression-value",
    "title": "Значение выражения",
    "description": "Подставить заданное значение после допустимых преобразований.",
    "practiceIds": [
      "expressions",
      "practice-identity-product"
    ]
  },
  "log-definition": {
    "id": "log-definition",
    "title": "Определение логарифма",
    "description": "Найти показатель, в который нужно возвести основание для получения аргумента.",
    "practiceIds": [
      "practice-log-value"
    ]
  },
  "log-domain": {
    "id": "log-domain",
    "title": "Допустимость логарифма",
    "description": "Проверить: основание положительно и не равно 1, аргумент положителен.",
    "practiceIds": [
      "practice-log-equation",
      "practice-log-value"
    ]
  },
  "trig-period": {
    "id": "trig-period",
    "title": "Полные обороты",
    "description": "Убрать целое число оборотов по 360°, сохраняя синус и косинус.",
    "practiceIds": [
      "practice-trig-angle"
    ]
  },
  "trig-value": {
    "id": "trig-value",
    "title": "Значение синуса",
    "description": "Найти синус известного угла по единичной окружности.",
    "practiceIds": [
      "practice-trig-angle",
      "functions"
    ]
  },
  "trig-product": {
    "id": "trig-product",
    "title": "Множитель перед синусом",
    "description": "Умножить найденное значение синуса на коэффициент.",
    "practiceIds": [
      "practice-trig-angle"
    ]
  },
  "equality": {
    "id": "equality",
    "title": "Равносильные преобразования",
    "description": "Выполнить одно и то же допустимое действие с обеими частями уравнения.",
    "practiceIds": [
      "equations-linear"
    ]
  },
  "collect-terms": {
    "id": "collect-terms",
    "title": "Приведение подобных",
    "description": "Собрать слагаемые с неизвестным и отдельно свободные слагаемые.",
    "practiceIds": [
      "equations-linear",
      "equations-signs"
    ]
  },
  "signed-coefficient": {
    "id": "signed-coefficient",
    "title": "Коэффициент со знаком",
    "description": "Разделить обе части на ненулевой коэффициент вместе с его знаком.",
    "practiceIds": [
      "equations-signs"
    ]
  },
  "fraction-root": {
    "id": "fraction-root",
    "title": "Точный дробный корень",
    "description": "Сохранить частное в виде дроби, если целого корня нет.",
    "practiceIds": [
      "equations-fractions"
    ]
  },
  "distributive": {
    "id": "distributive",
    "title": "Раскрытие скобок",
    "description": "Умножить на коэффициент перед скобкой каждое слагаемое внутри.",
    "practiceIds": [
      "equations-brackets"
    ]
  },
  "root-check": {
    "id": "root-check",
    "title": "Проверка корня",
    "description": "Подставить корень в исходное уравнение и проверить допустимость.",
    "practiceIds": [
      "practice-rational-equation",
      "practice-radical-equation"
    ]
  },
  "quadratic-roots": {
    "id": "quadratic-roots",
    "title": "Корни квадратного уравнения",
    "description": "Найти корни через разложение на множители, теорему Виета или дискриминант.",
    "practiceIds": [
      "practice-quadratic"
    ]
  },
  "required-root": {
    "id": "required-root",
    "title": "Корень по вопросу",
    "description": "Выбрать меньший или больший корень в соответствии с условием.",
    "practiceIds": [
      "practice-quadratic"
    ]
  },
  "radical-equation": {
    "id": "radical-equation",
    "title": "Уравнение с корнем",
    "description": "Учесть неотрицательность корня, возвести обе части в квадрат и проверить результат.",
    "practiceIds": [
      "practice-radical-equation"
    ]
  },
  "log-equation": {
    "id": "log-equation",
    "title": "Логарифмическое уравнение",
    "description": "Перейти от логарифма к степени и найти неизвестное в аргументе.",
    "practiceIds": [
      "practice-log-equation"
    ]
  },
  "exponential-equation": {
    "id": "exponential-equation",
    "title": "Показательное уравнение",
    "description": "Представить обе части степенями одного подходящего основания и сравнить показатели.",
    "practiceIds": [
      "practice-exponential-equation"
    ]
  },
  "rational-equation": {
    "id": "rational-equation",
    "title": "Дробное уравнение",
    "description": "Найти значение знаменателя и неизвестного с учётом запрета нуля.",
    "practiceIds": [
      "practice-rational-equation"
    ]
  },
  "interval-ends": {
    "id": "interval-ends",
    "title": "Границы промежутка",
    "description": "Проверить, включается ли каждая граница по знаку неравенства.",
    "practiceIds": [
      "numberline",
      "practice-inequality-match"
    ]
  },
  "integer-ends": {
    "id": "integer-ends",
    "title": "Крайние целые числа",
    "description": "Найти первое и последнее целое число в заданном промежутке.",
    "practiceIds": [
      "numberline"
    ]
  },
  "integer-count": {
    "id": "integer-count",
    "title": "Количество целых чисел",
    "description": "Если целые числа есть, из последнего вычесть первое и прибавить единицу. Если их нет, ответ равен нулю.",
    "practiceIds": [
      "numberline"
    ]
  },
  "compare-roots": {
    "id": "compare-roots",
    "title": "Сравнение корней",
    "description": "Оценить корень через соседние квадраты целых чисел.",
    "practiceIds": [
      "practice-number-match"
    ]
  },
  "compare-logs": {
    "id": "compare-logs",
    "title": "Оценка логарифмов",
    "description": "Сравнить аргумент со степенями данного основания.",
    "practiceIds": [
      "practice-number-match"
    ]
  },
  "number-order": {
    "id": "number-order",
    "title": "Порядок чисел на оси",
    "description": "Расположить меньшие числа левее больших.",
    "practiceIds": [
      "practice-number-match"
    ]
  },
  "inequality-sign": {
    "id": "inequality-sign",
    "title": "Действие с отрицательным числом",
    "description": "При умножении или делении неравенства на отрицательное число изменить его знак.",
    "practiceIds": [
      "practice-inequality-match"
    ]
  },
  "interval-signs": {
    "id": "interval-signs",
    "title": "Знаки на промежутках",
    "description": "Найти нули и запрещённые точки, проверить знак произведения или частного между ними.",
    "practiceIds": [
      "practice-inequality-match"
    ]
  },
  "even-last": {
    "id": "even-last",
    "title": "Чётность числа",
    "description": "Определить чётность по последней цифре.",
    "practiceIds": [
      "integers",
      "practice-digits-delete"
    ]
  },
  "divisibility-eleven": {
    "id": "divisibility-eleven",
    "title": "Делимость на 11",
    "description": "Проверить, делится ли разность сумм цифр на чередующихся местах на 11.",
    "practiceIds": [
      "integers",
      "practice-digits-delete"
    ]
  },
  "delete-order": {
    "id": "delete-order",
    "title": "Порядок оставшихся цифр",
    "description": "Вычеркнуть нужное число цифр, не меняя порядок остальных.",
    "practiceIds": [
      "practice-digits-delete",
      "integers"
    ]
  },
  "digit-sum": {
    "id": "digit-sum",
    "title": "Делимость на 3 и 9",
    "description": "Проверить делимость суммы цифр на 3 или 9.",
    "practiceIds": [
      "practice-digits-multiple",
      "practice-digits-product"
    ]
  },
  "last-digits": {
    "id": "last-digits",
    "title": "Делимость по последним цифрам",
    "description": "Использовать последнюю цифру для делимости на 5 и две последние — на 4.",
    "practiceIds": [
      "practice-digits-multiple",
      "practice-digits-product"
    ]
  },
  "digit-product": {
    "id": "digit-product",
    "title": "Произведение цифр",
    "description": "Разложить заданное произведение на возможные цифры числа.",
    "practiceIds": [
      "practice-digits-product"
    ]
  },
  "digit-constraints": {
    "id": "digit-constraints",
    "title": "Ограничения на цифры",
    "description": "Проверить разрядность, отсутствие ведущего нуля и дополнительные условия на цифры.",
    "practiceIds": [
      "practice-digits-multiple",
      "practice-digits-product",
      "practice-digits-delete"
    ]
  },
  "bounded-search": {
    "id": "bounded-search",
    "title": "Организованный перебор",
    "description": "Ограничить возможные варианты условиями и проверить каждый оставшийся.",
    "practiceIds": [
      "practice-digits-product",
      "practice-digits-multiple"
    ]
  },
  "distance-time": {
    "id": "distance-time",
    "title": "Путь, скорость и время",
    "description": "Использовать s=vt и t=s/v в согласованных единицах.",
    "practiceIds": [
      "practice-meeting",
      "practice-average-speed"
    ]
  },
  "closing-speed": {
    "id": "closing-speed",
    "title": "Скорость сближения",
    "description": "При встречном движении сложить скорости участников.",
    "practiceIds": [
      "practice-meeting",
      "practice-ring-meeting"
    ]
  },
  "river-speed": {
    "id": "river-speed",
    "title": "Скорость по течению и против",
    "description": "Прибавить скорость течения к собственной или вычесть её.",
    "practiceIds": [
      "practice-river"
    ]
  },
  "segment-time": {
    "id": "segment-time",
    "title": "Время отдельных участков",
    "description": "Разделить длину каждого участка на его скорость.",
    "practiceIds": [
      "practice-river",
      "practice-average-three"
    ]
  },
  "total-time": {
    "id": "total-time",
    "title": "Всё время движения",
    "description": "Сложить времена всех участков.",
    "practiceIds": [
      "practice-river",
      "practice-average-three"
    ]
  },
  "average-speed": {
    "id": "average-speed",
    "title": "Средняя скорость",
    "description": "Разделить весь путь на всё время, не усредняя сами скорости.",
    "practiceIds": [
      "practice-average-speed",
      "practice-average-three"
    ]
  },
  "unit-work": {
    "id": "unit-work",
    "title": "Доля работы за единицу времени",
    "description": "Разделить единицу работы на время её выполнения.",
    "practiceIds": [
      "practice-work"
    ]
  },
  "joint-rate": {
    "id": "joint-rate",
    "title": "Совместная производительность",
    "description": "Сложить производительности независимо работающих исполнителей.",
    "practiceIds": [
      "practice-work"
    ]
  },
  "work-time": {
    "id": "work-time",
    "title": "Время совместной работы",
    "description": "Разделить весь объём работы на общую производительность.",
    "practiceIds": [
      "practice-work"
    ]
  },
  "solute-mass": {
    "id": "solute-mass",
    "title": "Масса вещества",
    "description": "Умножить массу раствора на долю вещества.",
    "practiceIds": [
      "mixtures",
      "practice-mixture-water"
    ]
  },
  "solute-preserved": {
    "id": "solute-preserved",
    "title": "Сохранение вещества",
    "description": "При добавлении чистой воды сохранить массу растворённого вещества.",
    "practiceIds": [
      "practice-mixture-water",
      "mixtures"
    ]
  },
  "mixture-mass": {
    "id": "mixture-mass",
    "title": "Масса раствора после изменения",
    "description": "Учесть добавленную воду или найти массу по известной массе вещества и его доле.",
    "practiceIds": [
      "practice-mixture-water",
      "mixtures"
    ]
  },
  "concentration": {
    "id": "concentration",
    "title": "Концентрация раствора",
    "description": "Разделить массу вещества на массу раствора и выразить долю в процентах.",
    "practiceIds": [
      "mixtures"
    ]
  },
  "relative-speed": {
    "id": "relative-speed",
    "title": "Относительная скорость",
    "description": "Выбрать сумму скоростей при встречном движении и разность при движении в одну сторону.",
    "practiceIds": [
      "practice-ring-meeting"
    ]
  },
  "one-lap": {
    "id": "one-lap",
    "title": "Путь до новой встречи",
    "description": "После общего старта связать первую следующую встречу с относительным путём в один круг.",
    "practiceIds": [
      "practice-ring-meeting"
    ]
  },
  "set-overlap": {
    "id": "set-overlap",
    "title": "Пересечение множеств",
    "description": "Определить, какие объекты посчитаны дважды.",
    "practiceIds": [
      "practice-sets"
    ]
  },
  "set-union": {
    "id": "set-union",
    "title": "Объединение множеств",
    "description": "Связать сумму численностей групп, пересечение и общее количество.",
    "practiceIds": [
      "practice-sets"
    ]
  },
  "score-model": {
    "id": "score-model",
    "title": "Расчёт баллов",
    "description": "Рассчитать результат при условии, что все ответы верны.",
    "practiceIds": [
      "practice-integer-budget"
    ]
  },
  "error-cost": {
    "id": "error-cost",
    "title": "Изменение баллов при ошибке",
    "description": "Учесть и потерю баллов за верный ответ, и штраф за неверный.",
    "practiceIds": [
      "practice-integer-budget"
    ]
  },
  "wrong-count": {
    "id": "wrong-count",
    "title": "Количество ошибочных ответов",
    "description": "Разделить потерю баллов на уменьшение результата из-за одной ошибки.",
    "practiceIds": [
      "practice-integer-budget"
    ]
  },
  "integer-bounds": {
    "id": "integer-bounds",
    "title": "Целочисленные границы",
    "description": "Получить нижнюю и верхнюю границы количества и округлить их в нужную сторону.",
    "practiceIds": [
      "practice-whole-count"
    ]
  },
  "range-intersection": {
    "id": "range-intersection",
    "title": "Общее решение ограничений",
    "description": "Выбрать целое число, удовлетворяющее одновременно обеим границам.",
    "practiceIds": [
      "practice-whole-count"
    ]
  },
  "ring-arcs": {
    "id": "ring-arcs",
    "title": "Две дуги кольца",
    "description": "Для двух точек рассмотреть оба направления и выбрать кратчайшее расстояние.",
    "practiceIds": [
      "reasoning",
      "practice-ring-route"
    ]
  },
  "ring-cases": {
    "id": "ring-cases",
    "title": "Расположение точек на кольце",
    "description": "Проверить случаи расположения по одну и по разные стороны от выбранной точки.",
    "practiceIds": [
      "reasoning",
      "practice-ring-route"
    ]
  },
  "ring-check": {
    "id": "ring-check",
    "title": "Проверка расстояний на кольце",
    "description": "По найденной длине кольца и расположению точек проверить все заданные кратчайшие расстояния.",
    "practiceIds": [
      "reasoning",
      "practice-ring-route"
    ]
  },
  "ring-length": {
    "id": "ring-length",
    "title": "Длина кольца из условия",
    "description": "Сложить две дополняющие друг друга дуги, не назначая длину произвольно.",
    "practiceIds": [
      "reasoning",
      "practice-ring-route"
    ]
  },
  "solid-faces": {
    "id": "solid-faces",
    "title": "Грани, рёбра и вершины",
    "description": "Различить плоские грани тела, линии их пересечения и вершины.",
    "practiceIds": [
      "practice-faces"
    ]
  },
  "unknown-angle": {
    "id": "unknown-angle",
    "title": "Неизвестный угол",
    "description": "Вычесть сумму известных углов из 180°.",
    "practiceIds": [
      "practice-triangle-angle"
    ]
  },
  "root-domain": {
    "id": "root-domain",
    "title": "Допустимость квадратного корня",
    "description": "Проверить неотрицательность подкоренного выражения.",
    "practiceIds": [
      "practice-root-product",
      "practice-radical-equation"
    ]
  },
  "square-product": {
    "id": "square-product",
    "title": "Квадрат произведения",
    "description": "Возвести в квадрат каждый множитель произведения.",
    "practiceIds": [
      "practice-identity-product"
    ]
  },
  "part-ratio": {
    "id": "part-ratio",
    "title": "Отношение части к целому",
    "description": "Разделить величину части на величину выбранного целого.",
    "practiceIds": [
      "practice-percent-rate",
      "practice-fraction-percent"
    ]
  },
  "exact-quotient": {
    "id": "exact-quotient",
    "title": "Точное значение частного",
    "description": "Записать частное обыкновенной дробью без округления.",
    "practiceIds": [
      "practice-average-three",
      "equations-fractions"
    ]
  },
  "fixed-work": {
    "id": "fixed-work",
    "title": "Неизменный объём работы",
    "description": "Сравнивать число исполнителей и время для одной и той же работы.",
    "practiceIds": [
      "practice-inverse-proportion",
      "practice-work"
    ]
  },
  "work-portion": {
    "id": "work-portion",
    "title": "Объём выполненной работы",
    "description": "Умножить производительность на время работы.",
    "practiceIds": []
  },
  "work-stage": {
    "id": "work-stage",
    "title": "Этапы работы",
    "description": "Разделить решение на этапы с разным составом работников.",
    "practiceIds": []
  },
  "work-remaining": {
    "id": "work-remaining",
    "title": "Остаток работы",
    "description": "Вычесть выполненную часть из всего объёма работы.",
    "practiceIds": []
  },
  "work-all-time": {
    "id": "work-all-time",
    "title": "Полное время работы",
    "description": "Сложить времена этапов, начиная с указанного в вопросе момента.",
    "practiceIds": []
  },
  "finished-gardens": {
    "id": "finished-gardens",
    "title": "Целиком законченные огороды",
    "description": "Считать законченные огороды каждого работника отдельно; не объединять части разных огородов.",
    "practiceIds": []
  },
  "rate-difference": {
    "id": "rate-difference",
    "title": "Производительность одного работника",
    "description": "Вычесть известный вклад из общей производительности.",
    "practiceIds": []
  },
  "rate-ratio": {
    "id": "rate-ratio",
    "title": "Отношение производительностей",
    "description": "Связать «в несколько раз быстрее» с объёмом за одинаковое время.",
    "practiceIds": []
  },
  "person-time": {
    "id": "person-time",
    "title": "Человеко-часы и человеко-дни",
    "description": "Умножить число одинаково работающих людей на время работы.",
    "practiceIds": []
  },
  "work-per-unit": {
    "id": "work-per-unit",
    "title": "Труд на единицу работы",
    "description": "Разделить суммарный труд на число одинаковых объектов.",
    "practiceIds": []
  },
  "crew-count": {
    "id": "crew-count",
    "title": "Число работников по сроку",
    "description": "Разделить нужные трудозатраты на время, доступное одному работнику.",
    "practiceIds": []
  },
  "same-sign-sum": {
    "id": "same-sign-sum",
    "title": "Сумма чисел одного знака",
    "description": "Сложить модули и сохранить общий знак.",
    "practiceIds": []
  },
  "subtract-opposite": {
    "id": "subtract-opposite",
    "title": "Вычитание отрицательного числа",
    "description": "Заменить вычитание прибавлением противоположного числа.",
    "practiceIds": []
  },
  "signed-division": {
    "id": "signed-division",
    "title": "Знак частного",
    "description": "При одинаковых знаках получить положительное частное, при разных — отрицательное.",
    "practiceIds": []
  },
  "sign-rules": {
    "id": "sign-rules",
    "title": "Правило знаков для действия",
    "description": "Не переносить правило умножения отрицательных чисел на сложение.",
    "practiceIds": []
  },
  "mixed-fraction": {
    "id": "mixed-fraction",
    "title": "Смешанное число",
    "description": "Умножить целую часть на знаменатель и прибавить числитель, сохранив знаменатель.",
    "practiceIds": []
  },
  "mixed-negative": {
    "id": "mixed-negative",
    "title": "Знак смешанного числа",
    "description": "Отнести минус ко всему смешанному числу.",
    "practiceIds": []
  },
  "decimal-fraction": {
    "id": "decimal-fraction",
    "title": "Десятичная дробь как обыкновенная",
    "description": "Записать дробь со знаменателем 10, 100, 1000 и сократить.",
    "practiceIds": []
  },
  "whole-work": {
    "id": "whole-work",
    "title": "Целая работа как единица",
    "description": "Принять весь огород или весь объём работы за единицу.",
    "practiceIds": [
      "practice-work"
    ]
  },
  "decimal-difference": {
    "id": "decimal-difference",
    "title": "Вычитание по разрядам",
    "description": "Вычесть одинаковые разряды, при необходимости заняв единицу соседнего разряда.",
    "practiceIds": []
  }
};
  const prerequisiteDefinitions = {
  "arithmetic": {
    "title": "Умножение и деление",
    "href": "/trainers/oge-basics/multiplication-division.html",
    "reason": "Чтобы уверенно выполнять расчёты."
  },
  "remainder": {
    "title": "Деление с остатком",
    "href": "/trainers/oge-basics/multiplication-division/division-with-remainder.html",
    "reason": "Чтобы отделить целое частное от остатка."
  },
  "rounding": {
    "title": "Округление чисел",
    "href": "/trainers/oge-basics/rounding.html",
    "reason": "Чтобы понимать приближение и разряды."
  },
  "signs": {
    "title": "Действия с отрицательными числами",
    "href": "/trainers/oge-basics/negative-add-subtract.html",
    "reason": "Чтобы не терять знак при вычислении."
  },
  "line": {
    "title": "Числа на координатной прямой",
    "href": "/trainers/oge-basics/negative-number-line.html",
    "reason": "Чтобы сравнивать числа и читать условия на оси."
  },
  "order": {
    "title": "Порядок действий",
    "href": "/trainers/oge-basics/order-of-operations.html",
    "reason": "Чтобы соблюдать порядок вычислений."
  },
  "fraction": {
    "title": "Смысл дроби",
    "href": "/trainers/oge-basics/fraction-meaning.html",
    "reason": "Чтобы связать часть и целое."
  },
  "denominator": {
    "title": "Общий знаменатель",
    "href": "/trainers/oge-basics/fraction-common-denominator.html",
    "reason": "Чтобы складывать и вычитать одинаковые доли."
  },
  "decimal": {
    "title": "Десятичные дроби",
    "href": "/trainers/oge-basics/decimal-add-subtract.html",
    "reason": "Чтобы выполнять действия по разрядам."
  },
  "decimalDivision": {
    "title": "Деление на десятичную дробь",
    "href": "/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html",
    "reason": "Чтобы одинаково изменить делимое и делитель."
  },
  "percent": {
    "title": "Процент, часть и целое",
    "href": "/trainers/oge-basics/percentages/percent-of-number-and-whole.html",
    "reason": "Чтобы выбрать величину, принятую за 100%."
  },
  "percentChange": {
    "title": "Процентное изменение",
    "href": "/trainers/oge-basics/percentages/percent-change.html",
    "reason": "Чтобы вычислять изменение относительно нужного целого."
  },
  "proportion": {
    "title": "Пропорции",
    "href": "/trainers/oge-basics/percentages/proportion.html",
    "reason": "Чтобы установить связь двух величин."
  },
  "units": {
    "title": "Единицы длины и времени",
    "href": "/trainers/oge-basics/units-length-time.html",
    "reason": "Чтобы привести данные к одинаковым единицам."
  },
  "areaUnits": {
    "title": "Единицы площади",
    "href": "/trainers/oge-basics/units-area.html",
    "reason": "Чтобы учитывать квадрат коэффициента перевода."
  },
  "powers": {
    "title": "Степени и корни",
    "href": "/trainers/oge-task8-powers-roots.html",
    "reason": "Чтобы вычислять степени и извлекать корни."
  },
  "equations": {
    "title": "Простые уравнения",
    "href": "/trainers/simple-equations-stepwise.html",
    "reason": "Чтобы выполнять одинаковые действия с обеими частями."
  }
};
  const lessonDefinitions = [
  {
    "id": "round",
    "skills": [
      "remainder",
      "round-up",
      "count-check"
    ],
    "prerequisites": [
      "remainder",
      "arithmetic"
    ],
    "goal": "Найти наименьшее целое число упаковок, которого хватит.",
    "pos": 1,
    "title": "Покупка целых упаковок",
    "nextIds": [
      "practice-change"
    ]
  },
  {
    "id": "practice-change",
    "skills": [
      "total-cost",
      "change",
      "operation-order"
    ],
    "prerequisites": [
      "arithmetic",
      "order"
    ],
    "goal": "Посчитать стоимость покупки и сдачу.",
    "pos": 1,
    "title": "Покупка и сдача",
    "nextIds": [
      "practice-afford"
    ]
  },
  {
    "id": "practice-afford",
    "skills": [
      "remainder",
      "round-down",
      "count-check"
    ],
    "prerequisites": [
      "remainder",
      "arithmetic"
    ],
    "goal": "Определить, на сколько целых покупок хватает денег.",
    "pos": 1,
    "title": "На сколько покупок хватит денег",
    "nextIds": [
      "practice-transport"
    ]
  },
  {
    "id": "practice-transport",
    "skills": [
      "count-total",
      "remainder",
      "round-up",
      "count-check"
    ],
    "prerequisites": [
      "arithmetic",
      "remainder"
    ],
    "goal": "Учесть всех пассажиров и выбрать достаточное число автобусов.",
    "pos": 1,
    "title": "Места для всех пассажиров",
    "nextIds": []
  },
  {
    "id": "units",
    "skills": [
      "length-factor",
      "volume-factor",
      "power-factor"
    ],
    "prerequisites": [
      "units",
      "powers"
    ],
    "goal": "Перевести литры в кубические сантиметры.",
    "pos": 2,
    "title": "Величины в реальном мире",
    "nextIds": [
      "practice-units-match"
    ]
  },
  {
    "id": "practice-units-match",
    "skills": [
      "read-units",
      "size-estimate",
      "length-factor"
    ],
    "prerequisites": [
      "units"
    ],
    "goal": "Сопоставить предмет, реальный размер и единицу измерения.",
    "pos": 2,
    "title": "Соотнести величину и единицу",
    "nextIds": [
      "practice-time"
    ]
  },
  {
    "id": "practice-time",
    "skills": [
      "hours-minutes",
      "mixed-time",
      "same-units"
    ],
    "prerequisites": [
      "units",
      "arithmetic"
    ],
    "goal": "Перевести часы и минуты в одну единицу времени.",
    "pos": 2,
    "title": "Часы, минуты и секунды",
    "nextIds": [
      "practice-area-units"
    ]
  },
  {
    "id": "practice-area-units",
    "skills": [
      "length-factor",
      "area-factor",
      "power-factor"
    ],
    "prerequisites": [
      "areaUnits",
      "decimal"
    ],
    "goal": "Перевести площадь с учётом квадрата коэффициента.",
    "pos": 2,
    "title": "Перевод единиц площади",
    "nextIds": []
  },
  {
    "id": "data",
    "skills": [
      "read-data",
      "select-data",
      "sum-data"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти нужные данные и сложить их.",
    "pos": 3,
    "title": "Читать таблицу и диаграмму",
    "nextIds": [
      "practice-chart"
    ]
  },
  {
    "id": "practice-chart",
    "skills": [
      "read-scale",
      "max-min",
      "answer-quantity"
    ],
    "prerequisites": [
      "line",
      "arithmetic"
    ],
    "goal": "Считать диаграмму и ответить о нужной величине.",
    "pos": 3,
    "title": "Максимум и минимум на диаграмме",
    "nextIds": [
      "practice-ranking"
    ]
  },
  {
    "id": "practice-ranking",
    "skills": [
      "read-data",
      "sum-data",
      "rank",
      "answer-quantity"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Сложить баллы и определить место команды.",
    "pos": 3,
    "title": "Место команды в таблице",
    "nextIds": [
      "practice-interval-data"
    ]
  },
  {
    "id": "practice-interval-data",
    "skills": [
      "read-scale",
      "select-data",
      "sum-data"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти сумму значений за указанный промежуток.",
    "pos": 3,
    "title": "Сумма за нужный промежуток",
    "nextIds": []
  },
  {
    "id": "formulas",
    "skills": [
      "formula-values",
      "formula-power",
      "operation-order"
    ],
    "prerequisites": [
      "order",
      "powers"
    ],
    "goal": "Подставить величины и вычислить значение формулы.",
    "pos": 4,
    "title": "Подстановка в формулу",
    "nextIds": [
      "practice-electric"
    ]
  },
  {
    "id": "practice-electric",
    "skills": [
      "formula-values",
      "formula-power",
      "operation-order"
    ],
    "prerequisites": [
      "powers",
      "order"
    ],
    "goal": "Правильно вычислить квадрат величины в физической формуле.",
    "pos": 4,
    "title": "Квадрат в физической формуле",
    "nextIds": [
      "practice-temperature"
    ]
  },
  {
    "id": "practice-temperature",
    "skills": [
      "formula-values",
      "signed-product",
      "signed-sum",
      "operation-order"
    ],
    "prerequisites": [
      "signs",
      "decimal"
    ],
    "goal": "Подставить отрицательное число в линейную формулу.",
    "pos": 4,
    "title": "Линейная формула и отрицательные числа",
    "nextIds": [
      "practice-inverse-formula"
    ]
  },
  {
    "id": "practice-inverse-formula",
    "skills": [
      "formula-unknown",
      "equality",
      "operation-order",
      "formula-check"
    ],
    "prerequisites": [
      "equations",
      "arithmetic"
    ],
    "goal": "Выразить и вычислить неизвестную величину из формулы.",
    "pos": 4,
    "title": "Найти неизвестное из формулы",
    "nextIds": []
  },
  {
    "id": "probability",
    "skills": [
      "event",
      "favorable",
      "all-outcomes",
      "probability"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "goal": "Найти долю исправных деталей среди всех деталей.",
    "pos": 5,
    "title": "Доля подходящих исходов",
    "nextIds": [
      "practice-probability-draw"
    ]
  },
  {
    "id": "practice-probability-draw",
    "skills": [
      "event",
      "all-outcomes",
      "favorable",
      "probability"
    ],
    "prerequisites": [
      "fraction"
    ],
    "goal": "Посчитать подходящие равновозможные исходы и вероятность.",
    "pos": 5,
    "title": "Равновозможный выбор",
    "nextIds": [
      "practice-probability-opposite"
    ]
  },
  {
    "id": "practice-probability-opposite",
    "skills": [
      "event",
      "probability",
      "opposite-event"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "goal": "Найти вероятность через противоположное событие.",
    "pos": 5,
    "title": "Противоположное событие",
    "nextIds": []
  },
  {
    "id": "choice",
    "skills": [
      "total-cost",
      "full-cost",
      "compare-cost"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Сравнить расходы с учётом доставки.",
    "pos": 6,
    "title": "Цена с доставкой и ограничениями",
    "nextIds": [
      "practice-delivery"
    ]
  },
  {
    "id": "practice-delivery",
    "skills": [
      "total-cost",
      "strict-boundary",
      "delivery",
      "full-cost",
      "compare-cost"
    ],
    "prerequisites": [
      "arithmetic",
      "line"
    ],
    "goal": "Учесть точный порог бесплатной доставки и выбрать меньшую сумму.",
    "pos": 6,
    "title": "Бесплатная доставка: строгое условие",
    "nextIds": [
      "practice-luggage"
    ]
  },
  {
    "id": "practice-luggage",
    "skills": [
      "strict-boundary",
      "all-conditions",
      "select-all"
    ],
    "prerequisites": [
      "line",
      "units"
    ],
    "goal": "Проверить одновременно все ограничения на багаж.",
    "pos": 6,
    "title": "Отбор по нескольким ограничениям",
    "nextIds": [
      "practice-rental"
    ]
  },
  {
    "id": "practice-rental",
    "skills": [
      "fuel-rate",
      "total-cost",
      "full-cost",
      "compare-cost"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Сравнить аренду с учётом топлива на весь маршрут.",
    "pos": 6,
    "title": "Аренда плюс расход топлива",
    "nextIds": []
  },
  {
    "id": "graphs",
    "skills": [
      "graph-value",
      "formula-values",
      "derivative",
      "value-vs-slope"
    ],
    "prerequisites": [
      "signs",
      "powers"
    ],
    "goal": "Отличить значение функции от наклона касательной.",
    "pos": 7,
    "title": "Наклон, изменение и производная",
    "nextIds": [
      "practice-graph-match"
    ]
  },
  {
    "id": "practice-graph-match",
    "skills": [
      "graph-change",
      "rise-fall",
      "change-rate"
    ],
    "prerequisites": [
      "line",
      "signs"
    ],
    "goal": "Сопоставить участки графика с характером изменения.",
    "pos": 7,
    "title": "Соотнести участки графика и изменение",
    "nextIds": [
      "practice-graph-slope"
    ]
  },
  {
    "id": "practice-graph-slope",
    "skills": [
      "coordinate-difference",
      "slope",
      "value-vs-slope"
    ],
    "prerequisites": [
      "signs",
      "arithmetic"
    ],
    "goal": "Найти угловой коэффициент по двум точкам.",
    "pos": 7,
    "title": "Наклон прямой по двум точкам",
    "nextIds": []
  },
  {
    "id": "logic",
    "skills": [
      "set-inclusion",
      "count-total",
      "set-difference"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти участников группы, не входящих в указанную подгруппу.",
    "pos": 8,
    "title": "Все, некоторые, ни один",
    "nextIds": [
      "practice-logic-order"
    ]
  },
  {
    "id": "practice-logic-order",
    "skills": [
      "order-chain",
      "implication",
      "counterexample",
      "select-all"
    ],
    "prerequisites": [
      "line"
    ],
    "goal": "Выбрать только выводы, которые обязательно следуют из сравнений.",
    "pos": 8,
    "title": "Что обязательно следует из сравнения",
    "nextIds": [
      "practice-logic-all"
    ]
  },
  {
    "id": "practice-logic-all",
    "skills": [
      "logic-words",
      "set-inclusion",
      "implication",
      "counterexample"
    ],
    "prerequisites": [],
    "goal": "Различить всеобщность, существование и обратное утверждение.",
    "pos": 8,
    "title": "Все, некоторые и обратное утверждение",
    "nextIds": []
  },
  {
    "id": "grid",
    "skills": [
      "grid-length",
      "rectangle-area",
      "triangle-area"
    ],
    "prerequisites": [
      "fraction",
      "arithmetic"
    ],
    "goal": "Найти площадь прямоугольного треугольника на клетках.",
    "pos": 9,
    "title": "Площадь по клеткам",
    "nextIds": [
      "practice-grid-cut"
    ]
  },
  {
    "id": "practice-grid-cut",
    "skills": [
      "grid-length",
      "rectangle-area",
      "area-subtract"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Вычесть площадь выреза из площади достроенного прямоугольника.",
    "pos": 9,
    "title": "Площадь фигуры с вырезом",
    "nextIds": [
      "practice-grid-parallelogram"
    ]
  },
  {
    "id": "practice-grid-parallelogram",
    "skills": [
      "grid-length",
      "height",
      "parallelogram-area"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти основание и перпендикулярную высоту на сетке.",
    "pos": 9,
    "title": "Наклонная сторона и высота",
    "nextIds": []
  },
  {
    "id": "practical",
    "skills": [
      "scale-length",
      "same-units",
      "rectangle-area",
      "area-factor"
    ],
    "prerequisites": [
      "units",
      "proportion",
      "areaUnits"
    ],
    "goal": "Перейти от размеров на плане к площади настоящего участка.",
    "pos": 10,
    "title": "План, масштаб и площадь",
    "nextIds": [
      "practice-free-area"
    ]
  },
  {
    "id": "practice-free-area",
    "skills": [
      "square-area",
      "rectangle-area",
      "area-subtract"
    ],
    "prerequisites": [
      "arithmetic",
      "areaUnits"
    ],
    "goal": "Найти площадь участка, свободную от постройки.",
    "pos": 10,
    "title": "Площадь участка без постройки",
    "nextIds": [
      "practice-fence"
    ]
  },
  {
    "id": "practice-fence",
    "skills": [
      "same-units",
      "perimeter",
      "fence-gap"
    ],
    "prerequisites": [
      "units",
      "arithmetic"
    ],
    "goal": "Посчитать периметр и исключить незагороженный проезд.",
    "pos": 10,
    "title": "Забор и проезд",
    "nextIds": [
      "practice-spokes"
    ]
  },
  {
    "id": "practice-spokes",
    "skills": [
      "full-turn",
      "equal-angles",
      "divide-angle"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Разделить полный угол на число одинаковых промежутков.",
    "pos": 10,
    "title": "Равные углы вокруг точки",
    "nextIds": []
  },
  {
    "id": "box",
    "skills": [
      "rectangle-area",
      "box-volume",
      "box-surface",
      "same-units"
    ],
    "prerequisites": [
      "arithmetic",
      "areaUnits"
    ],
    "goal": "Различить объём коробки и площадь её поверхности.",
    "pos": 11,
    "title": "Объём и поверхность коробки",
    "nextIds": [
      "practice-displacement"
    ]
  },
  {
    "id": "practice-displacement",
    "skills": [
      "level-volume",
      "displacement",
      "volume-factor"
    ],
    "prerequisites": [
      "proportion",
      "units"
    ],
    "goal": "Найти объём детали по подъёму воды в сосуде.",
    "pos": 11,
    "title": "Объём погружённой детали",
    "nextIds": [
      "practice-pour"
    ]
  },
  {
    "id": "practice-pour",
    "skills": [
      "volume-preserved",
      "circle-area-ratio",
      "inverse-height"
    ],
    "prerequisites": [
      "proportion",
      "powers"
    ],
    "goal": "Найти новый уровень воды после переливания без потерь.",
    "pos": 11,
    "title": "Переливание: радиус и уровень",
    "nextIds": [
      "practice-joined-surface"
    ]
  },
  {
    "id": "practice-joined-surface",
    "skills": [
      "square-area",
      "face-area",
      "hidden-faces",
      "box-surface"
    ],
    "prerequisites": [
      "arithmetic",
      "areaUnits"
    ],
    "goal": "Посчитать только внешнюю поверхность склеенных кубов.",
    "pos": 11,
    "title": "Поверхность склеенных тел",
    "nextIds": [
      "practice-faces"
    ]
  },
  {
    "id": "practice-faces",
    "skills": [
      "solid-faces",
      "face-count",
      "hidden-faces"
    ],
    "prerequisites": [],
    "goal": "Посчитать внешние грани тела после склеивания.",
    "pos": 11,
    "title": "Считать внешние грани",
    "nextIds": []
  },
  {
    "id": "triangle",
    "skills": [
      "isosceles-height",
      "pythagoras",
      "positive-length",
      "triangle-area"
    ],
    "prerequisites": [
      "powers",
      "arithmetic"
    ],
    "goal": "Найти высоту равнобедренного треугольника и его площадь.",
    "pos": 12,
    "title": "Высота и теорема Пифагора",
    "nextIds": [
      "quadrilateral"
    ]
  },
  {
    "id": "quadrilateral",
    "skills": [
      "height",
      "trapezoid-midline",
      "trapezoid-area"
    ],
    "prerequisites": [
      "fraction",
      "arithmetic"
    ],
    "goal": "Выбрать высоту трапеции и найти площадь через основания.",
    "pos": 12,
    "title": "Параллелограмм и трапеция",
    "nextIds": [
      "circle"
    ]
  },
  {
    "id": "circle",
    "skills": [
      "chord-bisector",
      "chord-triangle",
      "positive-length",
      "whole-chord"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Найти хорду по радиусу и расстоянию от центра до хорды.",
    "pos": 12,
    "title": "Окружность, хорда и угол",
    "nextIds": [
      "practice-right-ratio"
    ]
  },
  {
    "id": "practice-right-ratio",
    "skills": [
      "hypotenuse",
      "right-ratio",
      "fraction-decimal"
    ],
    "prerequisites": [
      "fraction"
    ],
    "goal": "Выбрать стороны для синуса или косинуса данного острого угла.",
    "pos": 12,
    "title": "Синус и косинус в прямоугольном треугольнике",
    "nextIds": [
      "practice-triangle-angle"
    ]
  },
  {
    "id": "practice-triangle-angle",
    "skills": [
      "triangle-angles",
      "sum-data",
      "unknown-angle"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти третий угол по двум известным.",
    "pos": 12,
    "title": "Углы треугольника",
    "nextIds": [
      "practice-parallelogram"
    ]
  },
  {
    "id": "practice-parallelogram",
    "skills": [
      "height",
      "parallelogram-area",
      "same-units"
    ],
    "prerequisites": [
      "arithmetic",
      "areaUnits"
    ],
    "goal": "Использовать высоту, проведённую к выбранному основанию.",
    "pos": 12,
    "title": "Площадь через высоту",
    "nextIds": [
      "practice-diameter-chord"
    ]
  },
  {
    "id": "practice-diameter-chord",
    "skills": [
      "radius-diameter",
      "diameter-angle",
      "hypotenuse",
      "pythagoras",
      "positive-length"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Распознать прямоугольный треугольник на диаметре.",
    "pos": 12,
    "title": "Треугольник на диаметре",
    "nextIds": []
  },
  {
    "id": "roundbody",
    "skills": [
      "solid-formula",
      "radius-power",
      "formula-values",
      "pi-factor"
    ],
    "prerequisites": [
      "powers",
      "order"
    ],
    "goal": "Выбрать формулу тела и найти объём, делённый на π.",
    "pos": 13,
    "title": "Цилиндр, конус и шар",
    "nextIds": [
      "pyramid"
    ]
  },
  {
    "id": "pyramid",
    "skills": [
      "square-area",
      "pyramid-height",
      "box-volume",
      "pyramid-volume"
    ],
    "prerequisites": [
      "powers",
      "arithmetic"
    ],
    "goal": "Связать объём пирамиды с площадью основания и высотой.",
    "pos": 13,
    "title": "Призма, пирамида и высота",
    "nextIds": [
      "scale"
    ]
  },
  {
    "id": "scale",
    "skills": [
      "similar-lengths",
      "similar-volumes",
      "restore-volume"
    ],
    "prerequisites": [
      "powers",
      "proportion"
    ],
    "goal": "Найти объём малого конуса по отношению высот.",
    "pos": 13,
    "title": "Подобие и сечения",
    "nextIds": [
      "practice-cone-area"
    ]
  },
  {
    "id": "practice-cone-area",
    "skills": [
      "cone-generatrix",
      "cone-lateral",
      "pi-factor",
      "area-ratio"
    ],
    "prerequisites": [
      "proportion",
      "powers"
    ],
    "goal": "Сравнить боковые площади конусов по радиусам и образующим.",
    "pos": 13,
    "title": "Боковая поверхность конуса",
    "nextIds": [
      "practice-pyramid-lateral"
    ]
  },
  {
    "id": "practice-pyramid-lateral",
    "skills": [
      "isosceles-height",
      "pyramid-face-height",
      "pythagoras",
      "triangle-area",
      "pyramid-lateral"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Найти высоту боковой грани и всю боковую поверхность пирамиды.",
    "pos": 13,
    "title": "Боковая площадь правильной пирамиды",
    "nextIds": [
      "practice-box-diagonal"
    ]
  },
  {
    "id": "practice-box-diagonal",
    "skills": [
      "face-diagonal",
      "pythagoras",
      "positive-length",
      "rectangle-area",
      "box-volume"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Найти высоту по диагонали грани, затем объём тела.",
    "pos": 13,
    "title": "Объём через диагональ грани",
    "nextIds": [
      "practice-similar-volume"
    ]
  },
  {
    "id": "practice-similar-volume",
    "skills": [
      "similar-lengths",
      "similar-volumes",
      "restore-volume"
    ],
    "prerequisites": [
      "powers",
      "proportion"
    ],
    "goal": "Восстановить объём большого конуса по объёму малого.",
    "pos": 13,
    "title": "Подобие: восстановить объём",
    "nextIds": []
  },
  {
    "id": "fractions",
    "skills": [
      "operation-order",
      "reciprocal",
      "fraction-division",
      "common-denominator",
      "fraction-sum"
    ],
    "prerequisites": [
      "fraction",
      "denominator",
      "order"
    ],
    "goal": "Выполнить деление дробей до сложения.",
    "pos": 14,
    "title": "Дроби в одном выражении",
    "nextIds": [
      "practice-fraction-add"
    ]
  },
  {
    "id": "practice-fraction-add",
    "skills": [
      "common-denominator",
      "equivalent-fraction",
      "fraction-sum"
    ],
    "prerequisites": [
      "fraction",
      "arithmetic"
    ],
    "goal": "Привести дроби к общему знаменателю и сложить.",
    "pos": 14,
    "title": "Дроби: общий размер доли",
    "nextIds": [
      "practice-fraction-divide"
    ]
  },
  {
    "id": "practice-fraction-divide",
    "skills": [
      "reciprocal",
      "fraction-product",
      "fraction-division",
      "division-check"
    ],
    "prerequisites": [
      "fraction"
    ],
    "goal": "Разделить на ненулевую дробь через обратную.",
    "pos": 14,
    "title": "Деление на дробь",
    "nextIds": [
      "practice-fraction-expression"
    ]
  },
  {
    "id": "practice-fraction-expression",
    "skills": [
      "operation-order",
      "fraction-division",
      "common-denominator",
      "fraction-sum"
    ],
    "prerequisites": [
      "denominator",
      "order"
    ],
    "goal": "Сохранить порядок действий при вычислении выражения с дробями.",
    "pos": 14,
    "title": "Порядок действий с дробями",
    "nextIds": [
      "practice-decimals"
    ]
  },
  {
    "id": "practice-decimals",
    "skills": [
      "operation-order",
      "decimal-product",
      "decimal-sum"
    ],
    "prerequisites": [
      "decimal",
      "order"
    ],
    "goal": "Выполнить умножение, затем сложить десятичные дроби.",
    "pos": 14,
    "title": "Десятичные дроби: умножение и сложение",
    "nextIds": [
      "practice-decimal-division"
    ]
  },
  {
    "id": "practice-decimal-division",
    "skills": [
      "integer-divisor",
      "decimal-shift",
      "division-check"
    ],
    "prerequisites": [
      "decimalDivision",
      "arithmetic"
    ],
    "goal": "Превратить делитель в целое число, не изменив частное.",
    "pos": 14,
    "title": "Деление на десятичную дробь",
    "nextIds": []
  },
  {
    "id": "percent",
    "skills": [
      "percent-base",
      "percent-change",
      "new-base",
      "successive-change"
    ],
    "prerequisites": [
      "percent",
      "percentChange"
    ],
    "goal": "Посчитать два изменения цены, каждый раз выбирая верное целое.",
    "pos": 15,
    "title": "Процент от нужного целого",
    "nextIds": [
      "practice-fraction-percent"
    ]
  },
  {
    "id": "practice-fraction-percent",
    "skills": [
      "percent-base",
      "fraction-decimal",
      "percent-convert"
    ],
    "prerequisites": [
      "fraction",
      "decimal"
    ],
    "goal": "Перевести долю целого в проценты.",
    "pos": 15,
    "title": "Доля, десятичная дробь и процент",
    "nextIds": [
      "practice-percent-part"
    ]
  },
  {
    "id": "practice-percent-part",
    "skills": [
      "percent-base",
      "one-percent",
      "percent-part"
    ],
    "prerequisites": [
      "percent",
      "arithmetic"
    ],
    "goal": "Найти указанное число процентов от целого.",
    "pos": 15,
    "title": "Найти часть от целого",
    "nextIds": [
      "practice-percent-whole"
    ]
  },
  {
    "id": "practice-percent-whole",
    "skills": [
      "percent-base",
      "one-percent",
      "percent-whole"
    ],
    "prerequisites": [
      "percent",
      "arithmetic"
    ],
    "goal": "Восстановить всё количество по известной части.",
    "pos": 15,
    "title": "Найти целое по его части",
    "nextIds": [
      "practice-percent-rate"
    ]
  },
  {
    "id": "practice-percent-rate",
    "skills": [
      "percent-base",
      "part-ratio",
      "percent-rate"
    ],
    "prerequisites": [
      "percent",
      "fraction"
    ],
    "goal": "Найти, сколько процентов составляет часть от целого.",
    "pos": 15,
    "title": "Сколько процентов одно число от другого",
    "nextIds": [
      "practice-ratio-parts"
    ]
  },
  {
    "id": "practice-ratio-parts",
    "skills": [
      "ratio-parts",
      "unit-part",
      "selected-parts"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Разделить всё количество на части в заданном отношении.",
    "pos": 15,
    "title": "Разделить в отношении",
    "nextIds": [
      "practice-direct-proportion"
    ]
  },
  {
    "id": "practice-direct-proportion",
    "skills": [
      "unit-price",
      "direct-proportion",
      "total-cost"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Найти стоимость нового количества одинаковых предметов.",
    "pos": 15,
    "title": "Прямая пропорциональность",
    "nextIds": [
      "practice-inverse-proportion"
    ]
  },
  {
    "id": "practice-inverse-proportion",
    "skills": [
      "fixed-work",
      "inverse-proportion",
      "factor-change"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Пересчитать время при изменении числа одинаковых исполнителей.",
    "pos": 15,
    "title": "Обратная пропорциональность",
    "nextIds": [
      "practice-percent-change"
    ]
  },
  {
    "id": "practice-percent-change",
    "skills": [
      "percent-base",
      "percent-part",
      "percent-change"
    ],
    "prerequisites": [
      "percent"
    ],
    "goal": "Посчитать цену после одного процентного изменения.",
    "pos": 15,
    "title": "Цена после скидки или роста",
    "nextIds": [
      "practice-percent-reverse"
    ]
  },
  {
    "id": "practice-percent-reverse",
    "skills": [
      "remaining-percent",
      "percent-whole",
      "reverse-change"
    ],
    "prerequisites": [
      "percent",
      "percentChange"
    ],
    "goal": "Восстановить цену до скидки.",
    "pos": 15,
    "title": "Цена до изменения",
    "nextIds": [
      "practice-percent-chain"
    ]
  },
  {
    "id": "practice-percent-chain",
    "skills": [
      "percent-change",
      "new-base",
      "successive-change"
    ],
    "prerequisites": [
      "percent",
      "percentChange"
    ],
    "goal": "Посчитать последовательные изменения от разных исходных цен.",
    "pos": 15,
    "title": "Два изменения — две базы",
    "nextIds": []
  },
  {
    "id": "powers",
    "skills": [
      "root-of-square",
      "power-product",
      "power-quotient",
      "power-value",
      "operation-order"
    ],
    "prerequisites": [
      "powers",
      "signs"
    ],
    "goal": "Применить свойства степеней и сохранить знак квадратного корня.",
    "pos": 16,
    "title": "Степени и корни",
    "nextIds": [
      "expressions"
    ]
  },
  {
    "id": "expressions",
    "skills": [
      "fraction-domain",
      "difference-squares",
      "factor-cancel",
      "expression-value"
    ],
    "prerequisites": [
      "powers",
      "equations"
    ],
    "goal": "Сократить общий множитель и сохранить исходное ограничение.",
    "pos": 16,
    "title": "Сокращение выражений и ОДЗ",
    "nextIds": [
      "functions"
    ]
  },
  {
    "id": "functions",
    "skills": [
      "log-definition",
      "log-domain",
      "trig-period",
      "trig-value",
      "trig-product"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Вычислять логарифмы и значения синуса по определениям и свойствам.",
    "pos": 16,
    "title": "Логарифмы и круг",
    "nextIds": [
      "practice-root-product"
    ]
  },
  {
    "id": "practice-root-product",
    "skills": [
      "root-domain",
      "root-product",
      "arithmetic-root"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Объединить квадратные корни и вычислить результат.",
    "pos": 16,
    "title": "Корни и произведения",
    "nextIds": [
      "practice-power-rules"
    ]
  },
  {
    "id": "practice-power-rules",
    "skills": [
      "power-product",
      "power-quotient",
      "power-value"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Выполнить действия со степенями одинакового основания.",
    "pos": 16,
    "title": "Действия со степенями",
    "nextIds": [
      "practice-log-value"
    ]
  },
  {
    "id": "practice-log-value",
    "skills": [
      "log-domain",
      "log-definition",
      "power-value"
    ],
    "prerequisites": [
      "powers"
    ],
    "goal": "Найти логарифм как показатель степени.",
    "pos": 16,
    "title": "Логарифм как показатель степени",
    "nextIds": [
      "practice-identity-product"
    ]
  },
  {
    "id": "practice-identity-product",
    "skills": [
      "difference-squares",
      "square-product",
      "expression-value"
    ],
    "prerequisites": [
      "powers",
      "order"
    ],
    "goal": "Применить разность квадратов к выражению с корнем.",
    "pos": 16,
    "title": "Разность квадратов",
    "nextIds": [
      "practice-trig-angle"
    ]
  },
  {
    "id": "practice-trig-angle",
    "skills": [
      "trig-period",
      "trig-value",
      "trig-product"
    ],
    "prerequisites": [
      "powers",
      "arithmetic"
    ],
    "goal": "Убрать полные обороты и вычислить произведение с синусом.",
    "pos": 16,
    "title": "Тригонометрия: полный оборот",
    "nextIds": []
  },
  {
    "id": "equations",
    "skills": [
      "equality",
      "quadratic-roots",
      "radical-equation",
      "log-equation",
      "exponential-equation",
      "root-check"
    ],
    "prerequisites": [
      "equations",
      "powers"
    ],
    "goal": "Выбрать способ решения по виду уравнения и проверить корень.",
    "pos": 17,
    "title": "Уравнения: сохранить равенство",
    "nextIds": [
      "equations-linear"
    ]
  },
  {
    "id": "practice-quadratic",
    "skills": [
      "quadratic-roots",
      "required-root",
      "root-check"
    ],
    "prerequisites": [
      "powers",
      "equations"
    ],
    "goal": "Найти оба корня и выбрать указанный в вопросе.",
    "pos": 17,
    "title": "Квадратное уравнение: выбрать корень",
    "nextIds": [
      "practice-radical-equation"
    ]
  },
  {
    "id": "practice-radical-equation",
    "skills": [
      "root-domain",
      "radical-equation",
      "equality",
      "root-check"
    ],
    "prerequisites": [
      "powers",
      "equations"
    ],
    "goal": "Решить уравнение с квадратным корнем и проверить подстановкой.",
    "pos": 17,
    "title": "Уравнение с квадратным корнем",
    "nextIds": [
      "practice-log-equation"
    ]
  },
  {
    "id": "practice-log-equation",
    "skills": [
      "log-domain",
      "log-definition",
      "log-equation",
      "root-check"
    ],
    "prerequisites": [
      "powers",
      "equations"
    ],
    "goal": "Перейти к степени и проверить положительность аргумента.",
    "pos": 17,
    "title": "Логарифмическое уравнение",
    "nextIds": [
      "practice-exponential-equation"
    ]
  },
  {
    "id": "practice-exponential-equation",
    "skills": [
      "power-value",
      "exponential-equation",
      "equality",
      "root-check"
    ],
    "prerequisites": [
      "powers",
      "equations"
    ],
    "goal": "Привести части к одному основанию и найти неизвестный показатель.",
    "pos": 17,
    "title": "Показательное уравнение",
    "nextIds": [
      "practice-rational-equation"
    ]
  },
  {
    "id": "practice-rational-equation",
    "skills": [
      "fraction-domain",
      "rational-equation",
      "equality",
      "root-check"
    ],
    "prerequisites": [
      "fraction",
      "equations"
    ],
    "goal": "Найти корень дробного уравнения с ненулевым знаменателем.",
    "pos": 17,
    "title": "Дробное уравнение и запрет нуля",
    "nextIds": [
      "equations-linear"
    ]
  },
  {
    "id": "equations-linear",
    "skills": [
      "equality",
      "collect-terms",
      "signed-coefficient",
      "root-check"
    ],
    "prerequisites": [
      "equations",
      "signs"
    ],
    "goal": "Собрать неизвестные и числа, затем разделить на коэффициент.",
    "pos": 17,
    "title": "Линейные: как в первом разборе",
    "nextIds": [
      "equations-signs"
    ]
  },
  {
    "id": "equations-signs",
    "skills": [
      "equality",
      "signed-sum",
      "collect-terms",
      "signed-coefficient",
      "root-check"
    ],
    "prerequisites": [
      "signs",
      "equations"
    ],
    "goal": "Решить линейное уравнение, сохраняя знаки коэффициентов.",
    "pos": 17,
    "title": "Линейные: минусы и отрицательные корни",
    "nextIds": [
      "equations-brackets"
    ]
  },
  {
    "id": "equations-fractions",
    "skills": [
      "equality",
      "collect-terms",
      "fraction-root",
      "root-check"
    ],
    "prerequisites": [
      "fraction",
      "equations"
    ],
    "goal": "Найти точный дробный корень без округления.",
    "pos": 17,
    "title": "Линейные: дробный ответ",
    "nextIds": [
      "practice-quadratic"
    ]
  },
  {
    "id": "equations-brackets",
    "skills": [
      "distributive",
      "equality",
      "collect-terms",
      "signed-coefficient",
      "root-check"
    ],
    "prerequisites": [
      "order",
      "signs",
      "equations"
    ],
    "goal": "Раскрыть скобки и решить равносильное линейное уравнение.",
    "pos": 17,
    "title": "Линейные: сначала раскрой скобки",
    "nextIds": [
      "equations-fractions"
    ]
  },
  {
    "id": "numberline",
    "skills": [
      "interval-ends",
      "integer-ends",
      "integer-count"
    ],
    "prerequisites": [
      "line"
    ],
    "goal": "Посчитать целые числа с учётом строгих и нестрогих границ.",
    "pos": 18,
    "title": "Числа и условия на оси",
    "nextIds": [
      "practice-number-match"
    ]
  },
  {
    "id": "practice-number-match",
    "skills": [
      "compare-roots",
      "compare-logs",
      "number-order"
    ],
    "prerequisites": [
      "powers",
      "line"
    ],
    "goal": "Сопоставить корни и логарифмы с точками на оси.",
    "pos": 18,
    "title": "Числа на оси: корни и логарифмы",
    "nextIds": [
      "practice-inequality-match"
    ]
  },
  {
    "id": "practice-inequality-match",
    "skills": [
      "inequality-sign",
      "interval-signs",
      "fraction-domain",
      "interval-ends"
    ],
    "prerequisites": [
      "signs",
      "equations",
      "line"
    ],
    "goal": "Сопоставить неравенства с их промежутками решений.",
    "pos": 18,
    "title": "Сопоставить неравенства и промежутки",
    "nextIds": []
  },
  {
    "id": "integers",
    "skills": [
      "even-last",
      "divisibility-eleven",
      "delete-order",
      "digit-constraints"
    ],
    "prerequisites": [
      "remainder",
      "arithmetic"
    ],
    "goal": "Вычеркнуть цифры, сохранив порядок и делимость на 22.",
    "pos": 19,
    "title": "Вычеркнуть цифры: делимость на 22",
    "nextIds": [
      "practice-digits-multiple"
    ]
  },
  {
    "id": "practice-digits-multiple",
    "skills": [
      "digit-sum",
      "last-digits",
      "digit-constraints",
      "bounded-search"
    ],
    "prerequisites": [
      "remainder",
      "arithmetic"
    ],
    "goal": "Подобрать число, одновременно выполняющее условия на цифры и делимость.",
    "pos": 19,
    "title": "Число по признакам делимости",
    "nextIds": [
      "practice-digits-product"
    ]
  },
  {
    "id": "practice-digits-product",
    "skills": [
      "digit-product",
      "digit-sum",
      "last-digits",
      "digit-constraints",
      "bounded-search"
    ],
    "prerequisites": [
      "arithmetic",
      "remainder"
    ],
    "goal": "Подобрать цифры по произведению и проверить делимость числа.",
    "pos": 19,
    "title": "Делимость и произведение цифр",
    "nextIds": [
      "practice-digits-delete"
    ]
  },
  {
    "id": "practice-digits-delete",
    "skills": [
      "delete-order",
      "even-last",
      "divisibility-eleven",
      "digit-constraints"
    ],
    "prerequisites": [
      "remainder",
      "arithmetic"
    ],
    "goal": "Найти допустимое пятизначное число после вычёркивания трёх цифр.",
    "pos": 19,
    "title": "Вычеркнуть цифры: все подходящие ответы",
    "nextIds": []
  },
  {
    "id": "motion",
    "skills": [
      "segment-time",
      "sum-data",
      "total-time",
      "average-speed"
    ],
    "prerequisites": [
      "proportion",
      "fraction"
    ],
    "goal": "Найти среднюю скорость через весь путь и всё время.",
    "pos": 20,
    "title": "Средняя скорость на трёх участках",
    "nextIds": [
      "mixtures"
    ]
  },
  {
    "id": "mixtures",
    "skills": [
      "solute-mass",
      "solute-preserved",
      "mixture-mass",
      "concentration"
    ],
    "prerequisites": [
      "percent",
      "fraction"
    ],
    "goal": "Учесть неизменную массу вещества при добавлении воды.",
    "pos": 20,
    "title": "Растворы и сохранение вещества",
    "nextIds": [
      "practice-meeting"
    ]
  },
  {
    "id": "practice-meeting",
    "skills": [
      "closing-speed",
      "distance-time",
      "same-units"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Найти скорость сближения и время до встречи.",
    "pos": 20,
    "title": "Движение навстречу",
    "nextIds": [
      "practice-river"
    ]
  },
  {
    "id": "practice-river",
    "skills": [
      "river-speed",
      "segment-time",
      "total-time",
      "same-units"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Отдельно рассчитать движение по течению и против него.",
    "pos": 20,
    "title": "Движение по течению и против",
    "nextIds": [
      "practice-work"
    ]
  },
  {
    "id": "practice-work",
    "skills": [
      "unit-work",
      "joint-rate",
      "work-time",
      "fraction-sum"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "goal": "Сложить доли работы за час и найти время совместной работы.",
    "pos": 20,
    "title": "Совместная работа через доли",
    "nextIds": [
      "practice-mixture-water"
    ]
  },
  {
    "id": "practice-mixture-water",
    "skills": [
      "solute-mass",
      "solute-preserved",
      "mixture-mass",
      "percent-whole"
    ],
    "prerequisites": [
      "percent"
    ],
    "goal": "Найти, сколько воды нужно добавить для заданной концентрации.",
    "pos": 20,
    "title": "Добавить воду до нужной концентрации",
    "nextIds": [
      "practice-average-speed"
    ]
  },
  {
    "id": "practice-average-speed",
    "skills": [
      "segment-time",
      "sum-data",
      "total-time",
      "average-speed"
    ],
    "prerequisites": [
      "proportion",
      "fraction"
    ],
    "goal": "Посчитать среднюю скорость для двух участков.",
    "pos": 20,
    "title": "Средняя скорость: не среднее чисел",
    "nextIds": [
      "practice-average-three"
    ]
  },
  {
    "id": "practice-average-three",
    "skills": [
      "segment-time",
      "sum-data",
      "total-time",
      "average-speed",
      "exact-quotient"
    ],
    "prerequisites": [
      "proportion",
      "fraction"
    ],
    "goal": "Сложить пути и времена трёх участков, сохранив точный ответ.",
    "pos": 20,
    "title": "Три разных участка: путь и время",
    "nextIds": [
      "practice-ring-meeting"
    ]
  },
  {
    "id": "practice-ring-meeting",
    "skills": [
      "relative-speed",
      "one-lap",
      "distance-time"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "goal": "Найти время до следующей встречи на круговой дорожке.",
    "pos": 20,
    "title": "Движение по кольцу: встреча и обгон",
    "nextIds": []
  },
  {
    "id": "reasoning",
    "skills": [
      "ring-arcs",
      "ring-cases",
      "ring-length",
      "ring-check"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Восстановить расположение точек и кратчайшее расстояние на кольце.",
    "pos": 21,
    "title": "Кольцо с неизвестной длиной",
    "nextIds": [
      "practice-sets"
    ]
  },
  {
    "id": "practice-sets",
    "skills": [
      "set-overlap",
      "sum-data",
      "set-union"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти пересечение двух групп, не считая участников дважды.",
    "pos": 21,
    "title": "Два множества и пересечение",
    "nextIds": [
      "practice-integer-budget"
    ]
  },
  {
    "id": "practice-integer-budget",
    "skills": [
      "score-model",
      "error-cost",
      "wrong-count",
      "set-difference"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Найти число верных ответов по общей сумме баллов.",
    "pos": 21,
    "title": "Баллы за верные и неверные ответы",
    "nextIds": [
      "practice-whole-count"
    ]
  },
  {
    "id": "practice-whole-count",
    "skills": [
      "integer-bounds",
      "round-up",
      "round-down",
      "range-intersection"
    ],
    "prerequisites": [
      "remainder",
      "rounding"
    ],
    "goal": "Ограничить возможное целое число участников сверху и снизу.",
    "pos": 21,
    "title": "Оценка числа участников",
    "nextIds": [
      "practice-ring-route"
    ]
  },
  {
    "id": "practice-ring-route",
    "skills": [
      "ring-arcs",
      "ring-cases",
      "ring-length",
      "ring-check"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "goal": "Восстановить длину кольца и выбрать меньшую из двух дуг.",
    "pos": 21,
    "title": "Восстановить кольцо по кратчайшим расстояниям",
    "nextIds": []
  }
];
  const legacyDefinitions = [
  {
    "id": "legacy-m01-decimal",
    "module": "m01",
    "skill": "decimal",
    "pos": 14,
    "title": "Числа без путаницы",
    "goal": "Связать простую дробь с десятичной записью и действиями по разрядам.",
    "skills": [
      "fraction-decimal",
      "decimal-sum",
      "decimal-difference",
      "decimal-product"
    ],
    "prerequisites": [
      "fraction",
      "decimal"
    ],
    "nextIds": [
      "practice-fraction-percent",
      "practice-decimals"
    ]
  },
  {
    "id": "legacy-m01-division",
    "module": "m01",
    "skill": "division",
    "pos": 14,
    "title": "Деление с запятой",
    "goal": "Получить целый делитель и проверить частное обратным действием.",
    "skills": [
      "integer-divisor",
      "decimal-shift",
      "division-check"
    ],
    "prerequisites": [
      "decimalDivision",
      "arithmetic"
    ],
    "nextIds": [
      "practice-decimal-division",
      "practice-fraction-divide"
    ]
  },
  {
    "id": "legacy-m01-rounding",
    "module": "m01",
    "skill": "rounding",
    "pos": 1,
    "title": "Количество и единицы",
    "goal": "Согласовать единицы и выбрать округление по смыслу задачи.",
    "skills": [
      "same-units",
      "round-up",
      "round-down",
      "count-check"
    ],
    "prerequisites": [
      "units",
      "rounding",
      "remainder"
    ],
    "nextIds": [
      "practice-time",
      "practical",
      "round"
    ]
  },
  {
    "id": "legacy-m01-percent",
    "module": "m01",
    "skill": "percent",
    "pos": 15,
    "title": "Часть и целое",
    "goal": "Различить поиск части, целого и процентного отношения.",
    "skills": [
      "percent-base",
      "percent-part",
      "percent-whole",
      "percent-rate"
    ],
    "prerequisites": [
      "percent",
      "fraction"
    ],
    "nextIds": [
      "practice-percent-part",
      "practice-percent-rate",
      "practice-percent-whole"
    ]
  },
  {
    "id": "legacy-m01-change",
    "module": "m01",
    "skill": "change",
    "pos": 15,
    "title": "Цена меняется",
    "goal": "Вычислить новую и прежнюю цену, учитывая последовательные изменения.",
    "skills": [
      "percent-change",
      "reverse-change",
      "new-base",
      "successive-change"
    ],
    "prerequisites": [
      "percent",
      "percentChange"
    ],
    "nextIds": [
      "practice-percent-change",
      "practice-percent-reverse",
      "practice-percent-chain"
    ]
  },
  {
    "id": "legacy-m01-choice",
    "module": "m01",
    "skill": "choice",
    "pos": 6,
    "title": "Выбираем с расчётом",
    "goal": "Учесть цену единицы, количество и дополнительные расходы.",
    "skills": [
      "total-cost",
      "full-cost",
      "compare-cost",
      "answer-quantity"
    ],
    "prerequisites": [
      "arithmetic"
    ],
    "nextIds": [
      "practice-change",
      "choice",
      "practice-delivery"
    ]
  },
  {
    "id": "legacy-m02-data",
    "module": "m02",
    "skill": "data",
    "pos": 3,
    "title": "Таблицы и диаграммы",
    "goal": "Прочитать масштаб, выбрать нужные данные и выполнить расчёт.",
    "skills": [
      "read-data",
      "read-scale",
      "select-data",
      "sum-data",
      "max-min",
      "answer-quantity"
    ],
    "prerequisites": [
      "arithmetic",
      "decimal"
    ],
    "nextIds": [
      "data",
      "practice-ranking",
      "practice-chart"
    ]
  },
  {
    "id": "legacy-m02-probability",
    "module": "m02",
    "skill": "probability",
    "pos": 5,
    "title": "Вероятность",
    "goal": "Посчитать равновозможные исходы и использовать противоположное событие.",
    "skills": [
      "event",
      "all-outcomes",
      "favorable",
      "probability",
      "opposite-event"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "nextIds": [
      "practice-probability-draw",
      "probability",
      "practice-probability-opposite"
    ]
  },
  {
    "id": "legacy-m02-graphs",
    "module": "m02",
    "skill": "graphs",
    "pos": 7,
    "title": "График рассказывает",
    "goal": "Различить значение функции, изменение и наклон касательной.",
    "skills": [
      "graph-value",
      "graph-change",
      "rise-fall",
      "slope",
      "derivative",
      "value-vs-slope"
    ],
    "prerequisites": [
      "line",
      "signs"
    ],
    "nextIds": [
      "graphs",
      "practice-graph-match",
      "practice-graph-slope"
    ]
  },
  {
    "id": "legacy-m02-logic",
    "module": "m02",
    "skill": "logic",
    "pos": 8,
    "title": "Что следует из условия",
    "goal": "Отличить необходимый вывод от возможного и найти контрпример.",
    "skills": [
      "logic-words",
      "order-chain",
      "implication",
      "counterexample"
    ],
    "prerequisites": [
      "line"
    ],
    "nextIds": [
      "practice-logic-all",
      "practice-logic-order"
    ]
  },
  {
    "id": "legacy-work-rate-share",
    "module": "work-rate",
    "skill": "share",
    "pos": 20,
    "title": "Часть работы за час",
    "goal": "Связать время всей работы с долей за час и выполненной частью.",
    "skills": [
      "whole-work",
      "unit-work",
      "work-portion"
    ],
    "prerequisites": [
      "fraction",
      "arithmetic"
    ],
    "nextIds": [
      "practice-work"
    ]
  },
  {
    "id": "legacy-work-rate-joint",
    "module": "work-rate",
    "skill": "joint",
    "pos": 20,
    "title": "Два землекопа вместе",
    "goal": "Сложить производительности и найти время одной общей работы.",
    "skills": [
      "unit-work",
      "joint-rate",
      "work-time",
      "fraction-sum"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "nextIds": [
      "practice-work",
      "practice-fraction-add"
    ]
  },
  {
    "id": "legacy-work-rate-gardens",
    "module": "work-rate",
    "skill": "gardens",
    "pos": 20,
    "title": "Огороды один за другим",
    "goal": "Различить выполненный объём и число целиком готовых огородов.",
    "skills": [
      "unit-work",
      "work-portion",
      "finished-gardens",
      "round-down"
    ],
    "prerequisites": [
      "fraction",
      "remainder"
    ],
    "nextIds": [
      "practice-work",
      "practice-afford"
    ]
  },
  {
    "id": "legacy-work-rate-delay",
    "module": "work-rate",
    "skill": "delay",
    "pos": 20,
    "title": "Один начал раньше",
    "goal": "Учесть работу до прихода второго и полное время от начала.",
    "skills": [
      "work-stage",
      "work-portion",
      "work-remaining",
      "joint-rate",
      "work-time",
      "work-all-time"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "nextIds": [
      "practice-work"
    ]
  },
  {
    "id": "legacy-work-rate-leave",
    "module": "work-rate",
    "skill": "leave",
    "pos": 20,
    "title": "Один ушёл",
    "goal": "Найти остаток и учесть изменившийся состав работников.",
    "skills": [
      "work-stage",
      "joint-rate",
      "work-portion",
      "work-remaining",
      "work-time",
      "work-all-time"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "nextIds": [
      "practice-work"
    ]
  },
  {
    "id": "legacy-work-rate-reverse",
    "module": "work-rate",
    "skill": "reverse",
    "pos": 20,
    "title": "Найти второго работника",
    "goal": "Вычесть вклад первого из общего и найти время второго.",
    "skills": [
      "unit-work",
      "rate-difference",
      "work-time"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "nextIds": [
      "practice-work"
    ]
  },
  {
    "id": "legacy-work-rate-ratio",
    "module": "work-rate",
    "skill": "ratio",
    "pos": 20,
    "title": "Один работает быстрее",
    "goal": "Связать отношение производительностей с общей скоростью работы.",
    "skills": [
      "rate-ratio",
      "unit-work",
      "joint-rate",
      "work-time"
    ],
    "prerequisites": [
      "proportion",
      "fraction"
    ],
    "nextIds": [
      "practice-work"
    ]
  },
  {
    "id": "legacy-work-rate-crew",
    "module": "work-rate",
    "skill": "crew",
    "pos": 20,
    "title": "Бригада и срок",
    "goal": "Сохранить трудозатраты при изменении числа одинаковых работников.",
    "skills": [
      "person-time",
      "fixed-work",
      "inverse-proportion"
    ],
    "prerequisites": [
      "proportion",
      "arithmetic"
    ],
    "nextIds": [
      "practice-inverse-proportion",
      "practice-work"
    ]
  },
  {
    "id": "legacy-work-rate-minimum",
    "module": "work-rate",
    "skill": "minimum",
    "pos": 20,
    "title": "Сколько нужно людей",
    "goal": "Рассчитать трудозатраты и округлить нужное число работников вверх.",
    "skills": [
      "person-time",
      "work-per-unit",
      "crew-count",
      "round-up"
    ],
    "prerequisites": [
      "proportion",
      "remainder"
    ],
    "nextIds": [
      "round",
      "practice-transport"
    ]
  },
  {
    "id": "legacy-algebra-add",
    "module": "algebra",
    "skill": "add",
    "pos": 14,
    "title": "Сложение и вычитание со знаками",
    "goal": "Различить сложение чисел одинаковых и разных знаков и вычитание отрицательного.",
    "skills": [
      "same-sign-sum",
      "signed-sum",
      "subtract-opposite"
    ],
    "prerequisites": [
      "signs",
      "line"
    ],
    "nextIds": [
      "practice-temperature"
    ]
  },
  {
    "id": "legacy-algebra-multiply",
    "module": "algebra",
    "skill": "multiply",
    "pos": 14,
    "title": "Умножение, деление и порядок действий",
    "goal": "Выбрать правило знаков и сохранить порядок вычислений.",
    "skills": [
      "signed-product",
      "signed-division",
      "operation-order",
      "sign-rules"
    ],
    "prerequisites": [
      "signs",
      "order"
    ],
    "nextIds": [
      "practice-temperature",
      "practice-fraction-expression",
      "practice-decimals"
    ]
  },
  {
    "id": "legacy-algebra-mixed",
    "module": "algebra",
    "skill": "mixed",
    "pos": 14,
    "title": "Смешанные числа и переходы между дробями",
    "goal": "Перевести смешанные и десятичные числа в дроби, сохранив знак.",
    "skills": [
      "mixed-fraction",
      "mixed-negative",
      "decimal-fraction",
      "fraction-product",
      "fraction-division"
    ],
    "prerequisites": [
      "fraction",
      "denominator"
    ],
    "nextIds": [
      "practice-fraction-divide"
    ]
  }
];
  const positionTitles = [
  "Практические расчёты и округление",
  "Величины и единицы измерения",
  "Диаграммы и графики",
  "Вычисления по формулам",
  "Вероятность",
  "Таблицы и выгодный выбор",
  "Графики функций и производная",
  "Логические утверждения",
  "Площади на клетчатой сетке",
  "Геометрия в жизни",
  "Объёмы и поверхности в жизни",
  "Планиметрия",
  "Стереометрия",
  "Дроби и числовые выражения",
  "Проценты, доли и пропорции",
  "Степени, корни, логарифмы и тригонометрия",
  "Уравнения",
  "Числовая прямая и неравенства",
  "Числа, цифры и делимость",
  "Текстовые задачи",
  "Задачи на рассуждение"
];
  const href = id => '/ege-baza/path/index.html#lesson=' + encodeURIComponent(id);
  const definitionsById = new Map(lessonDefinitions.map(row => [row.id, row]));
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function materialize(row) {
    return freeze({
      id: row.id, pos: row.pos, title: row.title, goal: row.goal,
      ...(row.module ? {module: row.module, skill: row.skill, source: 'legacy'} : {source: 'path', href: href(row.id)}),
      prerequisites: row.prerequisites.map(id => prerequisiteDefinitions[id]),
      skills: row.skills.map(id => skillDefinitions[id]),
      next: row.nextIds.map(id => ({id, title: definitionsById.get(id).title, href: href(id)}))
    });
  }
  const lessons = Object.freeze(lessonDefinitions.map(materialize));
  const lessonMap = new Map(lessons.map(row => [row.id, row]));
  const legacyMap = new Map(legacyDefinitions.map(row => [row.module + '/' + row.skill, materialize(row)]));
  const unique = (items, key) => Array.from(new Map(items.map(item => [key(item), item])).values());
  const positions = positionTitles.map((title, index) => {
    const entries = lessons.filter(row => row.pos === index + 1);
    return freeze({
      pos: index + 1, title, lessons: entries,
      skills: unique(entries.flatMap(row => row.skills), skill => skill.id),
      prerequisites: unique(entries.flatMap(row => row.prerequisites), item => item.href)
    });
  });
  const api = Object.freeze({
    version: 1,
    all: () => lessons,
    lessons: () => lessons,
    forLesson: id => lessonMap.get(id) || null,
    forPosition: pos => Number.isInteger(pos) && pos >= 1 && pos <= 21 ? positions[pos - 1] : null,
    forLegacy: (module, skill) => legacyMap.get(module + '/' + skill) || null
  });
  root.EgeBazaSkillMaps = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
