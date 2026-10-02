(function(root){
const data = {
  "lessons": {
    "geo-angles": {
      "id": "geo-angles",
      "title": "Углы: найти связь, затем считать",
      "engine": "start",
      "group": "geometry",
      "guidedIds": [
        "geo-angles-sum",
        "geo-angles-isosceles",
        "geo-angles-exterior"
      ],
      "independentIds": [
        "geo-angles-ratio",
        "geo-angles-bisector",
        "geo-angles-parallel"
      ]
    },
    "geo-right": {
      "id": "geo-right",
      "title": "Прямоугольный треугольник: стороны и отношения",
      "engine": "start",
      "group": "geometry",
      "guidedIds": [
        "geo-right-hypotenuse",
        "geo-right-leg",
        "geo-right-sine"
      ],
      "independentIds": [
        "geo-right-cosine",
        "geo-right-tangent",
        "geo-right-perimeter"
      ],
      "questions": [
        "Какая сторона — гипотенуза? Почему она не зависит от того, как повёрнут рисунок?",
        "Переместите вершину модели. Найдите катеты, затем объясните отношение катета к гипотенузе.",
        "Пусть ученик сначала назовёт нужную связь, а затем подставит числа."
      ]
    },
    "geo-similarity": {
      "id": "geo-similarity",
      "title": "Подобие: сначала соответствие вершин",
      "engine": "start",
      "group": "geometry",
      "guidedIds": [
        "geo-similarity-side",
        "geo-similarity-parallel",
        "geo-similarity-perimeter"
      ],
      "independentIds": [
        "geo-similarity-area",
        "geo-similarity-from-area",
        "geo-similarity-split"
      ]
    },
    "geo-area": {
      "id": "geo-area",
      "title": "Площади: выбрать основание и высоту",
      "engine": "start",
      "group": "geometry",
      "guidedIds": [
        "geo-area-triangle",
        "geo-area-height",
        "geo-area-parallelogram"
      ],
      "independentIds": [
        "geo-area-common-height",
        "geo-area-two-heights",
        "geo-area-exterior-height"
      ]
    },
    "geo-quadrilaterals": {
      "id": "geo-quadrilaterals",
      "title": "Четырёхугольники: полезная дополнительная линия",
      "engine": "start",
      "group": "geometry",
      "guidedIds": [
        "geo-quad-rectangle",
        "geo-quad-trapezoid",
        "geo-quad-rhombus"
      ],
      "independentIds": [
        "geo-quad-midline",
        "geo-quad-parallelogram-diagonal",
        "geo-quad-trapezoid-area"
      ]
    },
    "geo-circle": {
      "id": "geo-circle",
      "title": "Окружность: дуга, угол и касательная",
      "engine": "start",
      "group": "geometry",
      "guidedIds": [
        "geo-circle-inscribed",
        "geo-circle-central",
        "geo-circle-diameter"
      ],
      "independentIds": [
        "geo-circle-tangent",
        "geo-circle-major-arc",
        "geo-circle-two-tangents"
      ],
      "questions": [
        "На какую дугу опирается угол? Где находится вершина угла?",
        "Сравните центральный и вписанный углы на модели. Для касательной проведите радиус к точке касания.",
        "Попросите объяснить, откуда появился прямой угол, прежде чем применять теорему Пифагора."
      ]
    },
    "vec-coordinates": {
      "id": "vec-coordinates",
      "title": "Вектор: откуда и куда",
      "engine": "start",
      "group": "vectors",
      "guidedIds": [
        "vec-coordinates-x",
        "vec-coordinates-y",
        "vec-coordinates-end"
      ],
      "independentIds": [
        "vec-coordinates-start",
        "vec-coordinates-reverse",
        "vec-coordinates-equal"
      ],
      "questions": [
        "Где начало вектора и где его конец?",
        "Передвиньте начало и конец. Сначала проговорите перемещение вправо/влево, вверх/вниз.",
        "Поменяйте направление. Что изменится в координатах и что останется прежним?"
      ]
    },
    "vec-length": {
      "id": "vec-length",
      "title": "Длина вектора: Пифагор на координатной сетке",
      "engine": "start",
      "group": "vectors",
      "guidedIds": [
        "vec-length-basic",
        "vec-length-negative",
        "vec-length-points"
      ],
      "independentIds": [
        "vec-length-axis",
        "vec-length-unknown",
        "vec-length-scaled"
      ]
    },
    "vec-operations": {
      "id": "vec-operations",
      "title": "Сложение, разность и умножение на число",
      "engine": "start",
      "group": "vectors",
      "guidedIds": [
        "vec-operations-sum",
        "vec-operations-difference",
        "vec-operations-scale"
      ],
      "independentIds": [
        "vec-operations-combination",
        "vec-operations-equation",
        "vec-operations-difference-length"
      ]
    },
    "vec-dot": {
      "id": "vec-dot",
      "title": "Скалярное произведение: число и смысл угла",
      "engine": "start",
      "group": "vectors",
      "guidedIds": [
        "vec-dot-positive",
        "vec-dot-negative",
        "vec-dot-perpendicular"
      ],
      "independentIds": [
        "vec-dot-angle",
        "vec-dot-self",
        "vec-dot-cosine"
      ],
      "questions": [
        "Что получается при скалярном произведении: число или вектор?",
        "Сравните острый, прямой и тупой углы. Предскажите знак произведения до вычислений.",
        "Попросите ученика связать координатную формулу с длинами векторов и косинусом угла."
      ]
    },
    "trig-angle": {
      "id": "trig-angle",
      "title": "Угол: поворот, градусы и радианы",
      "engine": "start",
      "group": "trigonometry",
      "guidedIds": [
        "trig-angle-1",
        "trig-angle-2",
        "trig-angle-3"
      ],
      "independentIds": [
        "trig-angle-4",
        "trig-angle-5",
        "trig-angle-6"
      ]
    },
    "trig-coordinates": {
      "id": "trig-coordinates",
      "title": "Синус и косинус — координаты точки",
      "engine": "start",
      "group": "trigonometry",
      "guidedIds": [
        "trig-coordinates-1",
        "trig-coordinates-2",
        "trig-coordinates-3"
      ],
      "independentIds": [
        "trig-coordinates-4",
        "trig-coordinates-5",
        "trig-coordinates-6"
      ]
    },
    "trig-special": {
      "id": "trig-special",
      "title": "Точные значения и симметрия",
      "engine": "start",
      "group": "trigonometry",
      "guidedIds": [
        "trig-special-1",
        "trig-special-2",
        "trig-special-3"
      ],
      "independentIds": [
        "trig-special-4",
        "trig-special-5",
        "trig-special-6"
      ]
    },
    "trig-tangent": {
      "id": "trig-tangent",
      "title": "Тангенс: отношение и границы определения",
      "engine": "start",
      "group": "trigonometry",
      "guidedIds": [
        "trig-tangent-1",
        "trig-tangent-2",
        "trig-tangent-3"
      ],
      "independentIds": [
        "trig-tangent-4",
        "trig-tangent-5",
        "trig-tangent-6"
      ]
    },
    "algebra-exponential": {
      "id": "algebra-exponential",
      "title": "Показательное уравнение: одинаковые основания",
      "engine": "start",
      "group": "algebra",
      "guidedIds": [
        "algebra-exponential-1",
        "algebra-exponential-2",
        "algebra-exponential-3"
      ],
      "independentIds": [
        "algebra-exponential-4",
        "algebra-exponential-5",
        "algebra-exponential-6"
      ]
    },
    "algebra-logarithmic": {
      "id": "algebra-logarithmic",
      "title": "Логарифмическое уравнение и ОДЗ",
      "engine": "start",
      "group": "algebra",
      "guidedIds": [
        "algebra-logarithmic-1",
        "algebra-logarithmic-2",
        "algebra-logarithmic-3"
      ],
      "independentIds": [
        "algebra-logarithmic-4",
        "algebra-logarithmic-5",
        "algebra-logarithmic-6"
      ]
    },
    "algebra-cosine": {
      "id": "algebra-cosine",
      "title": "Восстановить косинус по синусу и четверти",
      "engine": "start",
      "group": "algebra",
      "guidedIds": [
        "algebra-cosine-1",
        "algebra-cosine-2",
        "algebra-cosine-3"
      ],
      "independentIds": [
        "algebra-cosine-4",
        "algebra-cosine-5",
        "algebra-cosine-6"
      ]
    },
    "algebra-double-angle": {
      "id": "algebra-double-angle",
      "title": "Двойной угол: узнать произведение",
      "engine": "start",
      "group": "algebra",
      "guidedIds": [
        "algebra-double-angle-1",
        "algebra-double-angle-2",
        "algebra-double-angle-3"
      ],
      "independentIds": [
        "algebra-double-angle-4",
        "algebra-double-angle-5",
        "algebra-double-angle-6"
      ]
    },
    "before-circle": {
      "id": "before-circle",
      "title": "Что делает окружность единичной",
      "engine": "circle",
      "chapter": 0,
      "guidedIds": [
        "prep-radius"
      ],
      "independentIds": [
        "prep-quarter"
      ],
      "taskIds": [
        "prep-radius",
        "prep-quarter",
        "prep-top"
      ]
    },
    "before-radians": {
      "id": "before-radians",
      "title": "Число превращается в путь",
      "engine": "circle",
      "chapter": 0,
      "guidedIds": [
        "prep-negative"
      ],
      "independentIds": [
        "prep-turns"
      ],
      "taskIds": [
        "prep-negative",
        "prep-turns",
        "prep-radians"
      ],
      "questions": [
        "Где начало отсчёта? В какую сторону идут положительные и отрицательные повороты?",
        "Поставьте π/2, затем добавьте 2π. Совпали точки — совпали ли сами числа?",
        "Пусть ученик сам поставит −π/2 и объяснит, почему это та же точка, что 3π/2."
      ],
      "homeGuided": "prep-turns",
      "homeIndependent": "prep-radians"
    },
    "m4-arc-length": {
      "id": "m4-arc-length",
      "title": "Окружность как числовая дорожка",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-1-am"
      ],
      "independentIds": [
        "m4-1-bk"
      ],
      "taskIds": [
        "m4-1-am",
        "m4-1-bk",
        "m4-1-mp",
        "m4-1-dc",
        "m4-1-ka",
        "m4-1-bp",
        "m4-1-cb",
        "m4-1-bc",
        "m4-2-am",
        "m4-2-bd",
        "m4-2-ck",
        "m4-2-mp",
        "m4-2-dm",
        "m4-2-mk",
        "m4-2-cp",
        "m4-2-pc"
      ]
    },
    "m4-arc-ratios": {
      "id": "m4-arc-ratios",
      "title": "Делим четверть в отношении",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-3-am"
      ],
      "independentIds": [
        "m4-3-mb"
      ],
      "taskIds": [
        "m4-3-am",
        "m4-3-mb",
        "m4-3-dm",
        "m4-3-mc",
        "m4-4-cp",
        "m4-4-pd",
        "m4-4-ap"
      ]
    },
    "m4-axis-turns": {
      "id": "m4-axis-turns",
      "title": "Четыре опорные точки и полные обороты",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-5-a"
      ],
      "independentIds": [
        "m4-5-b"
      ],
      "taskIds": [
        "m4-5-a",
        "m4-5-b",
        "m4-5-v",
        "m4-5-g",
        "m4-6-a",
        "m4-6-b",
        "m4-6-v",
        "m4-6-g"
      ]
    },
    "m4-fractional-turns": {
      "id": "m4-fractional-turns",
      "title": "Доли π внутри четвертей",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-7-a"
      ],
      "independentIds": [
        "m4-7-b"
      ],
      "taskIds": [
        "m4-7-a",
        "m4-7-b",
        "m4-7-v",
        "m4-7-g",
        "m4-8-a",
        "m4-8-b",
        "m4-8-v",
        "m4-8-g",
        "m4-9-a",
        "m4-9-b",
        "m4-9-v",
        "m4-9-g"
      ]
    },
    "m4-negative-large": {
      "id": "m4-negative-large",
      "title": "Отрицательные углы и много оборотов",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-10-a"
      ],
      "independentIds": [
        "m4-10-b"
      ],
      "taskIds": [
        "m4-10-a",
        "m4-10-b",
        "m4-10-v",
        "m4-10-g",
        "m4-11-a",
        "m4-11-b",
        "m4-11-v",
        "m4-11-g"
      ]
    },
    "m4-line-circle": {
      "id": "m4-line-circle",
      "title": "Одинаковые числа? Одинаковые точки?",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-12-a"
      ],
      "independentIds": [
        "m4-12-b"
      ],
      "taskIds": [
        "m4-12-a",
        "m4-12-b",
        "m4-12-v",
        "m4-12-g"
      ]
    },
    "m4-all-numbers": {
      "id": "m4-all-numbers",
      "title": "Все числа для одной точки и пары точек",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-13-a"
      ],
      "independentIds": [
        "m4-13-b"
      ],
      "taskIds": [
        "m4-13-a",
        "m4-13-b",
        "m4-13-v",
        "m4-13-g",
        "m4-14-a",
        "m4-14-b",
        "m4-14-v",
        "m4-15-a",
        "m4-15-b",
        "m4-15-v"
      ]
    },
    "m4-radians-without-pi": {
      "id": "m4-radians-without-pi",
      "title": "Радианы без символа π",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-16-a"
      ],
      "independentIds": [
        "m4-16-b"
      ],
      "taskIds": [
        "m4-16-a",
        "m4-16-b",
        "m4-16-v",
        "m4-16-g",
        "m4-17-a",
        "m4-17-b",
        "m4-17-v",
        "m4-17-g",
        "m4-18-a",
        "m4-18-b",
        "m4-18-v",
        "m4-18-g"
      ]
    },
    "m4-open-arcs": {
      "id": "m4-open-arcs",
      "title": "Открытые дуги и интервалы всех чисел",
      "engine": "circle",
      "chapter": 4,
      "guidedIds": [
        "m4-19-a"
      ],
      "independentIds": [
        "m4-19-b"
      ],
      "taskIds": [
        "m4-19-a",
        "m4-19-b",
        "m4-19-v",
        "m4-19-g",
        "m4-20-a",
        "m4-20-b",
        "m4-20-v",
        "m4-20-g"
      ]
    },
    "m5-coordinates": {
      "id": "m5-coordinates",
      "title": "Координаты точки единичной окружности",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-1-a"
      ],
      "independentIds": [
        "m5-1-b"
      ],
      "taskIds": [
        "m5-1-a",
        "m5-1-b",
        "m5-1-v",
        "m5-1-g"
      ],
      "questions": [
        "Что показывает горизонтальная проекция, а что вертикальная?",
        "Передвиньте точку через все четверти. Предсказывайте знаки координат до проверки.",
        "Свяжите координаты с cos t и sin t. Попросите объяснить, почему их значения не выходят за границы от −1 до 1."
      ],
      "homeGuided": "m5-1-b",
      "homeIndependent": "m5-1-v"
    },
    "m5-coordinate-turns": {
      "id": "m5-coordinate-turns",
      "title": "Координаты после нескольких оборотов",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-2-a"
      ],
      "independentIds": [
        "m5-2-b"
      ],
      "taskIds": [
        "m5-2-a",
        "m5-2-b",
        "m5-2-v",
        "m5-2-g",
        "m5-3-a",
        "m5-3-b",
        "m5-3-v",
        "m5-3-g"
      ]
    },
    "m5-coordinate-inverse": {
      "id": "m5-coordinate-inverse",
      "title": "От координат к положительному и отрицательному повороту",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-4-a"
      ],
      "independentIds": [
        "m5-4-b"
      ],
      "taskIds": [
        "m5-4-a",
        "m5-4-b",
        "m5-4-v",
        "m5-4-g",
        "m5-5-a",
        "m5-5-b",
        "m5-5-v",
        "m5-5-g"
      ]
    },
    "m5-ordinate-slices": {
      "id": "m5-ordinate-slices",
      "title": "Одинаковая ордината: одна или две точки?",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-6-a"
      ],
      "independentIds": [
        "m5-6-b"
      ],
      "taskIds": [
        "m5-6-a",
        "m5-6-b",
        "m5-6-v",
        "m5-6-g",
        "m5-7-a",
        "m5-7-b",
        "m5-7-v",
        "m5-7-g"
      ]
    },
    "m5-abscissa-slices": {
      "id": "m5-abscissa-slices",
      "title": "Одинаковая абсцисса: вертикальные сечения",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-8-a"
      ],
      "independentIds": [
        "m5-8-b"
      ],
      "taskIds": [
        "m5-8-a",
        "m5-8-b",
        "m5-8-v",
        "m5-8-g",
        "m5-9-a",
        "m5-9-b",
        "m5-9-v",
        "m5-9-g"
      ]
    },
    "m5-coordinate-signs": {
      "id": "m5-coordinate-signs",
      "title": "Знаки координат без вычисления их значений",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-10-a"
      ],
      "independentIds": [
        "m5-10-b"
      ],
      "taskIds": [
        "m5-10-a",
        "m5-10-b",
        "m5-10-v",
        "m5-10-g"
      ]
    },
    "m5-abscissa-inequalities": {
      "id": "m5-abscissa-inequalities",
      "title": "Неравенство по абсциссе: выбираем дугу",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-11-a"
      ],
      "independentIds": [
        "m5-11-b"
      ],
      "taskIds": [
        "m5-11-a",
        "m5-11-b",
        "m5-11-v",
        "m5-11-g",
        "m5-12-a",
        "m5-12-b",
        "m5-12-v",
        "m5-12-g"
      ]
    },
    "m5-ordinate-inequalities": {
      "id": "m5-ordinate-inequalities",
      "title": "Неравенство по ординате: выше или ниже?",
      "engine": "circle",
      "chapter": 5,
      "guidedIds": [
        "m5-13-a"
      ],
      "independentIds": [
        "m5-13-b"
      ],
      "taskIds": [
        "m5-13-a",
        "m5-13-b",
        "m5-13-v",
        "m5-13-g",
        "m5-14-a",
        "m5-14-b",
        "m5-14-v",
        "m5-14-g"
      ]
    },
    "m6-axis": {
      "id": "m6-axis",
      "title": "Синус, косинус и тангенс на осях",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-1-a"
      ],
      "independentIds": [
        "m6-1-b"
      ],
      "taskIds": [
        "m6-1-a",
        "m6-1-b",
        "m6-1-v",
        "m6-1-g",
        "m6-2-a",
        "m6-2-b",
        "m6-2-v",
        "m6-2-g"
      ]
    },
    "m6-special": {
      "id": "m6-special",
      "title": "Точные значения и несколько оборотов",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-3-a"
      ],
      "independentIds": [
        "m6-3-b"
      ],
      "taskIds": [
        "m6-3-a",
        "m6-3-b",
        "m6-3-v",
        "m6-3-g",
        "m6-4-a",
        "m6-4-b",
        "m6-4-v",
        "m6-4-g",
        "m6-5-a",
        "m6-5-b",
        "m6-5-v",
        "m6-5-g"
      ]
    },
    "m6-calculation": {
      "id": "m6-calculation",
      "title": "Вычисления: сначала функции, затем действия",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-6-a"
      ],
      "independentIds": [
        "m6-6-b"
      ],
      "taskIds": [
        "m6-6-a",
        "m6-6-b",
        "m6-6-v",
        "m6-6-g",
        "m6-7-a",
        "m6-7-b",
        "m6-8-a",
        "m6-8-b",
        "m6-8-v",
        "m6-8-g",
        "m6-9-a",
        "m6-9-b",
        "m6-9-v",
        "m6-9-g"
      ]
    },
    "m6-identities": {
      "id": "m6-identities",
      "title": "Тождества и область определения",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-10-a"
      ],
      "independentIds": [
        "m6-10-b"
      ],
      "taskIds": [
        "m6-10-a",
        "m6-10-b",
        "m6-10-v",
        "m6-10-g",
        "m6-11-a",
        "m6-11-b",
        "m6-11-v",
        "m6-11-g",
        "m6-12-a",
        "m6-12-b",
        "m6-12-v",
        "m6-12-g"
      ]
    },
    "m6-arguments": {
      "id": "m6-arguments",
      "title": "Аргумент функции и квадрат её значения",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-13-a"
      ],
      "independentIds": [
        "m6-13-b"
      ],
      "taskIds": [
        "m6-13-a",
        "m6-13-b",
        "m6-13-v",
        "m6-13-g",
        "m6-14-a",
        "m6-14-b",
        "m6-14-v",
        "m6-14-g"
      ]
    },
    "m6-range": {
      "id": "m6-range",
      "title": "Наименьшее и наибольшее значение",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-15-a"
      ],
      "independentIds": [
        "m6-15-b"
      ],
      "taskIds": [
        "m6-15-a",
        "m6-15-b",
        "m6-15-v",
        "m6-15-g"
      ]
    },
    "m6-equations": {
      "id": "m6-equations",
      "title": "Простейшие уравнения: все точки и все обороты",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-16-a"
      ],
      "independentIds": [
        "m6-16-b"
      ],
      "taskIds": [
        "m6-16-a",
        "m6-16-b",
        "m6-16-v",
        "m6-16-g",
        "m6-17-a",
        "m6-17-b",
        "m6-17-v",
        "m6-17-g",
        "m6-18-a",
        "m6-18-b",
        "m6-18-v",
        "m6-18-g"
      ]
    },
    "m6-undefined": {
      "id": "m6-undefined",
      "title": "Когда дробь не имеет смысла",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-19-a"
      ],
      "independentIds": [
        "m6-19-b"
      ],
      "taskIds": [
        "m6-19-a",
        "m6-19-b",
        "m6-19-v",
        "m6-19-g"
      ]
    },
    "m6-signs": {
      "id": "m6-signs",
      "title": "Знаки: от координат к выражению",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-20-a"
      ],
      "independentIds": [
        "m6-20-b"
      ],
      "taskIds": [
        "m6-20-a",
        "m6-20-b",
        "m6-20-v",
        "m6-20-g",
        "m6-21-a",
        "m6-21-b",
        "m6-21-v",
        "m6-21-g",
        "m6-22-a",
        "m6-22-b",
        "m6-22-v",
        "m6-22-g",
        "m6-23-a",
        "m6-23-b",
        "m6-23-v",
        "m6-23-g",
        "m6-24-a",
        "m6-24-b",
        "m6-24-v",
        "m6-24-g",
        "m6-25-a",
        "m6-25-b",
        "m6-25-v",
        "m6-25-g",
        "m6-26-a",
        "m6-26-b"
      ]
    },
    "m6b-identities": {
      "id": "m6b-identities",
      "title": "Упростить, прежде чем вычислять",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-27-a"
      ],
      "independentIds": [
        "m6-27-b"
      ],
      "taskIds": [
        "m6-27-a",
        "m6-27-b",
        "m6-28-a",
        "m6-28-b",
        "m6-29-a",
        "m6-29-b"
      ]
    },
    "m6b-equations": {
      "id": "m6b-equations",
      "title": "Все точки — все решения",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-30-a"
      ],
      "independentIds": [
        "m6-30-b"
      ],
      "taskIds": [
        "m6-30-a",
        "m6-30-b",
        "m6-30-v",
        "m6-30-g",
        "m6-31-a",
        "m6-31-b",
        "m6-32-a",
        "m6-32-b",
        "m6-32-v",
        "m6-32-g"
      ]
    },
    "m6-root-domain": {
      "id": "m6-root-domain",
      "title": "Когда квадратный корень существует",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-33-a"
      ],
      "independentIds": [
        "m6-33-b"
      ],
      "taskIds": [
        "m6-33-a",
        "m6-33-b",
        "m6-33-v",
        "m6-33-g"
      ]
    },
    "m6-comparison": {
      "id": "m6-comparison",
      "title": "Сравниваем и упорядочиваем",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-34-a"
      ],
      "independentIds": [
        "m6-34-b"
      ],
      "taskIds": [
        "m6-34-a",
        "m6-34-b",
        "m6-34-v",
        "m6-34-g",
        "m6-35-a",
        "m6-35-b",
        "m6-35-v",
        "m6-35-g",
        "m6-36-a",
        "m6-36-b",
        "m6-37-a",
        "m6-37-b",
        "m6-37-v",
        "m6-37-g",
        "m6-38-a",
        "m6-38-b"
      ]
    },
    "m6-inequalities": {
      "id": "m6-inequalities",
      "title": "Неравенство как дуга окружности",
      "engine": "circle",
      "chapter": 6,
      "guidedIds": [
        "m6-39-a"
      ],
      "independentIds": [
        "m6-39-b"
      ],
      "taskIds": [
        "m6-39-a",
        "m6-39-b",
        "m6-39-v",
        "m6-39-g",
        "m6-40-a",
        "m6-40-b",
        "m6-40-v",
        "m6-40-g",
        "m6-41-a",
        "m6-41-b",
        "m6-41-v",
        "m6-41-g"
      ]
    }
  },
  "routes": {
    "homework": {
      "title": "После урока: №1, №2 и тригонометрия",
      "short": "Домашка",
      "intro": "Закрепите урок: два блока планиметрии, два по векторам и два по тригонометрии. При необходимости восстановите правило и потренируйтесь по шагам, затем решите по одному самостоятельному условию в каждом блоке. Работу можно разделить на два подхода.",
      "path": "/ege-profil/homework/index.html",
      "groups": [
        {
          "title": "01 · Планиметрия · задание 1",
          "intro": "Стороны прямоугольного треугольника; углы и касательная к окружности.",
          "ids": [
            "geo-right",
            "geo-circle"
          ]
        },
        {
          "title": "02 · Векторы · задание 2",
          "intro": "Сначала направление и координаты, затем скалярное произведение.",
          "ids": [
            "vec-coordinates",
            "vec-dot"
          ]
        },
        {
          "title": "03 · Тригонометрия с начала",
          "intro": "Поворот и полные обороты. Затем — координаты точки на окружности.",
          "ids": [
            "before-radians",
            "m5-coordinates"
          ]
        }
      ]
    },
    "trigonometry": {
      "title": "Тригонометрия: от окружности к ЕГЭ",
      "short": "Тригонометрия",
      "intro": "Подробное начало по Мордковичу встроено в один маршрут. Сначала изучите смысл на окружности, затем закрепите его в коротких заданиях и преобразованиях для ЕГЭ.",
      "path": "/ege-profil/trigonometry/index.html",
      "groups": [
        {
          "title": "01 · Устроить окружность",
          "intro": "Радиус, направление, радианы и полные обороты. Два вводных урока перед учебником.",
          "ids": [
            "before-circle",
            "before-radians"
          ]
        },
        {
          "title": "02 · Число, точка и дуга · §4",
          "intro": "Отметить точку, отделить целые обороты, описать все числа дуги.",
          "ids": [
            "m4-arc-length",
            "m4-arc-ratios",
            "m4-axis-turns",
            "m4-fractional-turns",
            "m4-negative-large",
            "m4-line-circle",
            "m4-all-numbers",
            "m4-radians-without-pi",
            "m4-open-arcs"
          ]
        },
        {
          "title": "03 · Координаты · §5",
          "intro": "Проекции, симметрия, координатные сечения и дуги неравенств.",
          "ids": [
            "m5-coordinates",
            "m5-coordinate-turns",
            "m5-coordinate-inverse",
            "m5-ordinate-slices",
            "m5-abscissa-slices",
            "m5-coordinate-signs",
            "m5-abscissa-inequalities",
            "m5-ordinate-inequalities"
          ]
        },
        {
          "title": "04 · Функции и первые уравнения · §6",
          "intro": "Синус, косинус, тангенс и котангенс: смысл, значения, ограничения и преобразования.",
          "ids": [
            "m6-axis",
            "m6-special",
            "m6-calculation",
            "m6-identities",
            "m6-arguments",
            "m6-range",
            "m6-equations",
            "m6-undefined",
            "m6-signs",
            "m6b-identities",
            "m6b-equations",
            "m6-root-domain",
            "m6-comparison",
            "m6-inequalities"
          ]
        },
        {
          "title": "05 · Закрепить и применить на ЕГЭ",
          "intro": "Короткое повторение основ, восстановление функции по четверти и формула двойного угла. Следующий этап подготовки, а не полный охват второй части.",
          "ids": [
            "trig-angle",
            "trig-coordinates",
            "trig-special",
            "trig-tangent",
            "algebra-cosine",
            "algebra-double-angle"
          ]
        }
      ]
    },
    "lesson": {
      "title": "Урок: №1, №2 и начало тригонометрии",
      "short": "Урок с репетитором",
      "intro": "Общий маршрут для совместной работы. Начните с вопроса, дайте ученику управлять моделью, затем разберите задачу по шагам. Домашняя практика открывается отдельным режимом.",
      "path": "/ege-profil/lesson/index.html",
      "groups": [
        {
          "title": "01 · Планиметрия · задание 1",
          "intro": "Стороны прямоугольного треугольника; углы и касательная к окружности.",
          "ids": [
            "geo-right",
            "geo-circle"
          ]
        },
        {
          "title": "02 · Векторы · задание 2",
          "intro": "Сначала направление и координаты, затем скалярное произведение.",
          "ids": [
            "vec-coordinates",
            "vec-dot"
          ]
        },
        {
          "title": "03 · Тригонометрия с начала",
          "intro": "Поворот и полные обороты. Затем — координаты точки на окружности.",
          "ids": [
            "before-radians",
            "m5-coordinates"
          ]
        }
      ]
    }
  }
};
root.ProfileRoutes=data;if(typeof module!=="undefined")module.exports=data;
})(globalThis);
