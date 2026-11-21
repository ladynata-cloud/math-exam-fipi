(function (root) {
  'use strict';

  const cycle = names => names.map((name, i) => [name, names[(i + 1) % names.length]]);
  const view = (label, segments, polygon = [], rightAngles = []) => ({ label, segments, polygon, rightAngles });
  const neutral = label => view(label, []);

  function regularPyramid(sides, a, h) {
    const radius = a / (2 * Math.sin(Math.PI / sides));
    const vertices = Array.from('ABCDEF'.slice(0, sides));
    const bottom = cycle(vertices);
    const points = Object.fromEntries(vertices.map((name, i) => {
      const angle = Math.PI / 2 + (2 * i - 1) * Math.PI / sides;
      return [name, [radius * Math.cos(angle), radius * Math.sin(angle), 0]];
    }));
    const apothemBase = a / (2 * Math.tan(Math.PI / sides));
    Object.assign(points, { P: [0, 0, h], O: [0, 0, 0], M: [0, apothemBase, 0] });
    return {
      title: 'Правильная пирамида', points, labelNames: [...vertices, 'P', 'O', 'M'],
      edges: [...bottom, ...vertices.map(name => ['P', name])],
      faces: [vertices, ...bottom.map(edge => ['P', ...edge])],
      views: {
        neutral: neutral('P — вершина, O — центр основания, M — середина стороны AB.'),
        apothem: view('В треугольнике POM угол при O прямой. PM — апофема.', [['P', 'O'], ['O', 'M'], ['P', 'M']], ['P', 'O', 'M'], [['P', 'O', 'M']]),
        faceEdge: view('В боковой грани PAB треугольник PAM прямоугольный. PA — боковое ребро.', [['P', 'M'], ['A', 'M'], ['P', 'A']], ['P', 'A', 'M'], [['P', 'M', 'A']]),
        face: view('PM — высота боковой грани PAB.', [['P', 'M']], ['P', 'A', 'B'], [['P', 'M', 'A']])
      }
    };
  }

  function truncatedPyramid(a, b, h) {
    const lower = ['A', 'B', 'C', 'D'];
    const upper = lower.map(name => name + '1');
    const bottom = cycle(lower);
    const top = cycle(upper);
    const square = (names, s, z) => Object.fromEntries(names.map((name, i) => {
      const [x, y] = [[1, 1], [-1, 1], [-1, -1], [1, -1]][i];
      return [name, [x * s / 2, y * s / 2, z]];
    }));
    const points = {
      ...square(lower, a, 0), ...square(upper, b, h),
      O: [0, 0, 0], O1: [0, 0, h], M: [0, a / 2, 0], N: [0, b / 2, h], Q: [0, b / 2, 0]
    };
    return {
      title: 'Правильная усечённая пирамида', points,
      labelNames: [...lower, ...upper, 'O', 'O1', 'M', 'N', 'Q'],
      neutralPoints: [...lower, ...upper],
      edges: [...bottom, ...top, ...lower.map((name, i) => [name, upper[i]])],
      faces: [lower, upper, ...bottom.map(([a, b], i) => [a, b, top[i][1], top[i][0]])],
      views: {
        neutral: neutral('ABCD и A₁B₁C₁D₁ — параллельные квадратные основания.'),
        similar: view('Верхнее основание подобно нижнему.', [], upper),
        apothem: view('MN — высота боковой трапеции. O₁O — высота тела.', [['M', 'N'], ['O1', 'O']], ['A', 'B', 'B1', 'A1'], [['N', 'M', 'A']]),
        triangle: view('В прямоугольном треугольнике NQM отрезок NQ равен высоте, MQ — половине разности сторон квадратов.', [['N', 'Q'], ['Q', 'M'], ['M', 'N']], ['N', 'Q', 'M'], [['N', 'Q', 'M']])
      }
    };
  }

  function rhombusPyramid(a, ao, h) {
    const bo = Math.sqrt(a ** 2 - ao ** 2);
    const vertices = ['A', 'B', 'C', 'D'];
    const bottom = cycle(vertices);
    return {
      title: 'Пирамида над ромбом',
      points: { A: [ao, 0, 0], B: [0, bo, 0], C: [-ao, 0, 0], D: [0, -bo, 0], P: [0, 0, h], O: [0, 0, 0] },
      labelNames: ['A', 'B', 'C', 'D', 'P', 'O'],
      edges: [...bottom, ...vertices.map(name => ['P', name]), ['A', 'C'], ['B', 'D'], ['P', 'O']],
      faces: [vertices, ...bottom.map(edge => ['P', ...edge])],
      views: {
        neutral: neutral('O — точка пересечения диагоналей ромба. PO — высота пирамиды.'),
        base: view('Диагонали ромба пересекаются под прямым углом в точке O.', [['A', 'O'], ['B', 'O']], ['A', 'O', 'B'], [['A', 'O', 'B']]),
        long: view('PO и AO — катеты треугольника POA.', [['P', 'O'], ['O', 'A'], ['P', 'A']], ['P', 'O', 'A'], [['P', 'O', 'A']]),
        short: view('PO и BO — катеты треугольника POB.', [['P', 'O'], ['O', 'B'], ['P', 'B']], ['P', 'O', 'B'], [['P', 'O', 'B']])
      }
    };
  }

  const step = (label, answer, unit, hint, explanation, focus) => ({ label, answer, unit, hint, explanation, focus });
  const rootAnswer = square => ({ square });
  const guided = [
    {
      id: 'three-lengths', title: 'Высота, апофема и ребро',
      condition: 'В правильной четырёхугольной пирамиде PABCD сторона основания равна 6 см, высота PO равна 4 см. Точка M — середина AB. Найди апофему PM и боковое ребро PA.',
      figure: () => regularPyramid(4, 6, 4),
      steps: [
        step('Расстояние OM', 3, 'см', 'Отрезок из центра квадрата до середины стороны равен половине стороны.', 'OM = AB/2 = 3 см.', 'apothem'),
        step('Апофема PM', 5, 'см', 'Воспользуйся треугольником POM. У него прямой угол при O.', 'PM² = PO² + OM² = 16 + 9 = 25. Значит, PM = 5 см.', 'apothem'),
        step('Боковое ребро PA', rootAnswer(34), 'см', 'В треугольнике PAM прямой угол при M. Возьми апофему PM и половину AB как катеты.', 'PA² = PM² + AM² = 25 + 9 = 34. Поэтому PA = √34 см.', 'faceEdge')
      ]
    },
    {
      id: 'six-faces', title: 'Боковая поверхность пирамиды',
      condition: 'В основании правильной пирамиды лежит шестиугольник со стороной 4 см. Апофема равна 9 см. Найди площадь боковой поверхности.',
      figure: () => regularPyramid(6, 4, Math.sqrt(69)),
      steps: [
        step('Периметр основания', 24, 'см', 'Сосчитай все стороны шестиугольника.', 'P = 6 · 4 = 24 см.', 'face'),
        step('Боковая площадь', 108, 'см²', 'Сложи площади шести одинаковых треугольников с высотой 9 см.', 'Sбок = Pℓ/2 = 24 · 9/2 = 108 см².', 'face')
      ]
    },
    {
      id: 'similar-cut', title: 'От исходной пирамиды к усечённой',
      condition: 'Сторона основания правильной квадратной пирамиды равна 12 см, её высота равна 8 см. Параллельная основанию плоскость проходит на расстоянии 2 см от вершины. Найди сторону сечения, апофему и боковую площадь оставшейся усечённой пирамиды.',
      figure: () => truncatedPyramid(12, 3, 6),
      steps: [
        step('Сторона верхнего основания', 3, 'см', 'Отношение сторон равно отношению высот малой и полной пирамид, отсчитанных от вершины.', 'Коэффициент подобия равен 2/8 = 1/4. Сторона сечения равна 12/4 = 3 см.', 'similar'),
        step('Апофема исходной пирамиды', 10, 'см', 'Катеты равны высоте исходной пирамиды и половине стороны её основания.', 'Апофема исходной пирамиды равна √(8² + 6²) = 10 см.', 'neutral'),
        step('Апофема усечённой пирамиды', 7.5, 'см', 'От полной апофемы отними апофему малой пирамиды. Она в четыре раза меньше полной.', 'Апофема малой пирамиды равна 10/4 = 2,5 см. Апофема усечённой равна 10 − 2,5 = 7,5 см.', 'apothem'),
        step('Боковая площадь', 225, 'см²', 'Умножь полусумму периметров квадратов на апофему усечённой пирамиды.', 'Sбок = (48 + 12) · 7,5 / 2 = 225 см².', 'apothem')
      ]
    },
    {
      id: 'frustum-height', title: 'Высота дана. Где взять апофему?',
      condition: 'У правильной усечённой пирамиды стороны квадратных оснований равны 14 и 4 см, высота тела равна 12 см. Найди апофему и боковую площадь.',
      figure: () => truncatedPyramid(14, 4, 12),
      steps: [
        step('Горизонтальный катет MQ', 5, 'см', 'Из расстояния от центра нижнего квадрата до его стороны вычти такое же расстояние для верхнего квадрата.', 'MQ = 14/2 − 4/2 = 5 см.', 'triangle'),
        step('Апофема MN', 13, 'см', 'В треугольнике NQM катет NQ равен высоте тела, а MN — гипотенуза.', 'MN = √(12² + 5²) = 13 см.', 'triangle'),
        step('Боковая площадь', 468, 'см²', 'Периметры квадратов равны четырём сторонам каждого из них.', 'Sбок = (56 + 16) · 13/2 = 468 см².', 'apothem')
      ]
    },
    {
      id: '239', title: '№239. Боковые рёбра пирамиды над ромбом',
      condition: 'В основании пирамиды PABCD лежит ромб со стороной 5 см и диагональю AC = 8 см. Высота PO равна 7 см и проходит через точку O пересечения диагоналей. Найди все четыре боковых ребра.',
      figure: () => rhombusPyramid(5, 4, 7),
      steps: [
        step('Половина диагонали AO', 4, 'см', 'Точка O делит диагональ AC на две равные части.', 'AO = CO = 8/2 = 4 см.', 'base'),
        step('Половина другой диагонали BO', 3, 'см', 'Диагонали ромба перпендикулярны. В треугольнике AOB гипотенуза AB равна 5 см.', 'BO² = 5² − 4² = 9. Значит, BO = DO = 3 см.', 'base'),
        step('Равные рёбра PA и PC', rootAnswer(65), 'см', 'Высота PO перпендикулярна основанию, поэтому PO ⟂ AO. Сложи квадраты катетов.', 'PA² = PC² = 7² + 4² = 65. Поэтому PA = PC = √65 см.', 'long'),
        step('Равные рёбра PB и PD', rootAnswer(58), 'см', 'Для второй пары горизонтальный катет — BO или DO. Вспомни его длину.', 'PB² = PD² = 7² + 3² = 58. Поэтому PB = PD = √58 см. Рёбра образуют две пары, поскольку AO и BO имеют разные длины.', 'short')
      ]
    },
    {
      id: 'reverse', title: 'От боковой площади к высоте',
      condition: 'Боковая площадь правильной усечённой пирамиды равна 180 см². Стороны квадратных оснований равны 8 и 2 см. Найди апофему и высоту тела.',
      figure: () => truncatedPyramid(8, 2, Math.sqrt(72)),
      steps: [
        step('Апофема MN', 9, 'см', 'Боковая площадь равна произведению полусуммы периметров на апофему.', 'Полусумма периметров равна (32 + 8)/2 = 20 см. Поэтому MN = 180/20 = 9 см.', 'apothem'),
        step('Высота тела', rootAnswer(72), 'см', 'В прямоугольном треугольнике горизонтальный катет равен (8 − 2)/2. Из квадрата апофемы вычти квадрат этого катета.', 'h² = 9² − 3² = 72. Следовательно, h = √72 = 6√2 см.', 'triangle')
      ]
    }
  ];

  const homework = [
    {
      id: 'hw-square', title: 'Апофема и площадь',
      condition: 'Сторона основания правильной квадратной пирамиды равна 16 см, высота равна 15 см. Найди апофему и боковую площадь.',
      figure: () => regularPyramid(4, 16, 15),
      steps: [
        step('Апофема', 17, 'см', 'Половина стороны квадрата и высота тела — катеты.', 'ℓ = √(15² + 8²) = 17 см.', 'apothem'),
        step('Боковая площадь', 544, 'см²', 'Найди периметр квадрата и возьми половину его произведения на апофему.', 'Sбок = 64 · 17/2 = 544 см².', 'face')
      ]
    },
    {
      id: 'hw-triangle', title: 'Три боковые грани',
      condition: 'У правильной треугольной пирамиды сторона основания равна 7 см, апофема равна 6 см. Найди боковую площадь.',
      figure: () => regularPyramid(3, 7, Math.sqrt(36 - 49 / 12)),
      steps: [step('Боковая площадь', 63, 'см²', 'У пирамиды три одинаковые треугольные боковые грани.', 'Sбок = (3 · 7) · 6/2 = 63 см².', 'face')]
    },
    {
      id: 'hw-cut', title: 'Сечение на половине высоты',
      condition: 'У правильной квадратной пирамиды сторона основания равна 10 см, высота равна 12 см. Сечение, параллельное основанию, проходит на расстоянии 6 см от вершины. Найди сторону сечения, апофему и боковую площадь усечённой пирамиды.',
      figure: () => truncatedPyramid(10, 5, 6),
      steps: [
        step('Сторона сечения', 5, 'см', 'Сравни высоты малой и исходной пирамид.', 'Сторона равна 10 · (6/12) = 5 см.', 'similar'),
        step('Апофема усечённой пирамиды', 6.5, 'см', 'Найди полную апофему, затем вычти апофему малой пирамиды.', 'Полная апофема равна √(12² + 5²) = 13 см. Малая составляет её половину. Значит, ℓ = 6,5 см.', 'apothem'),
        step('Боковая площадь', 195, 'см²', 'Используй периметры двух квадратов и длину апофемы.', 'Sбок = (40 + 20) · 6,5/2 = 195 см².', 'apothem')
      ]
    },
    {
      id: 'hw-full', title: 'Боковая и полная площади',
      condition: 'Стороны квадратных оснований правильной усечённой пирамиды равны 16 и 6 см, высота равна 12 см. Найди площадь боковой и полной поверхностей.',
      figure: () => truncatedPyramid(16, 6, 12),
      steps: [
        step('Боковая площадь', 572, 'см²', 'Сначала найди апофему по высоте тела и половине разности сторон оснований.', 'ℓ = √(12² + 5²) = 13 см. Sбок = (64 + 24) · 13/2 = 572 см².', 'triangle'),
        step('Полная площадь', 864, 'см²', 'К боковой площади добавь площади обоих квадратов.', 'Sполн = 572 + 16² + 6² = 864 см².', 'similar')
      ]
    },
    {
      id: 'hw-rhombus', title: 'Две пары боковых рёбер',
      condition: 'Основание пирамиды PABCD — ромб со стороной 13 см и диагональю AC = 24 см. Высота PO равна 12 см и проходит через точку O пересечения диагоналей. Найди все четыре боковых ребра.',
      figure: () => rhombusPyramid(13, 12, 12),
      steps: [
        step('Рёбра PA и PC', rootAnswer(288), 'см', 'Один катет равен PO, другой — половине диагонали AC.', 'AO = CO = 12 см. Поэтому PA = PC = √(12² + 12²) = 12√2 см.', 'long'),
        step('Рёбра PB и PD', 13, 'см', 'Сначала найди BO в прямоугольном треугольнике AOB. Затем найди PB в треугольнике POB.', 'BO = DO = √(13² − 12²) = 5 см. Поэтому PB = PD = √(12² + 5²) = 13 см.', 'short')
      ]
    },
    {
      id: 'hw-reverse', title: 'Восстанови высоту по площади',
      condition: 'Стороны квадратных оснований правильной усечённой пирамиды равны 16 и 4 см, а боковая площадь равна 400 см². Найди высоту тела.',
      figure: () => truncatedPyramid(16, 4, 8),
      steps: [step('Высота тела', 8, 'см', 'Сначала найди апофему из формулы боковой площади. В прямоугольном треугольнике она играет роль гипотенузы.', 'ℓ = 400 / ((64 + 16)/2) = 10 см. Горизонтальный катет равен (16 − 4)/2 = 6 см. Высота равна √(10² − 6²) = 8 см.', 'triangle')]
    }
  ];

  const predictions = {
    section: { correct: 0, yes: 'Стороны сечения параллельны соответствующим сторонам квадрата. Сечение подобно основанию.', no: 'Посмотри на жёлтое сечение. Сколько у него сторон и какие стороны параллельны?' },
    side: { correct: 1, yes: 'Чем ближе плоскость к вершине, тем меньше сторона сечения.', no: 'Передвинь ползунок к 6 см и сравни длину стороны с положением на 2 см.' },
    face: { correct: 2, yes: 'Верхнее и нижнее рёбра грани параллельны. Боковые стороны трапеции равны.', no: 'Выбери переднюю зелёную грань. Сравни её верхнее и нижнее рёбра и пересчитай вершины.' }
  };

  const decimal = '(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
  const numericPattern = new RegExp(`^\\+?(${decimal})(?:/(${decimal}))?$`);
  const radicalPattern = new RegExp(`^\\+?(?:(${decimal})\\*?)?√(?:\\((\\d+)\\)|(\\d+))(?:/(${decimal}))?$`);

  function readLength(raw) {
    const input = raw.trim().replace(/\s/g, '').replaceAll(',', '.').replaceAll('·', '*')
      .replace(/\\?sqrt\{(\d+)\}/gi, '√($1)').replace(/sqrt/gi, '√');
    if (input.length > 48) return null;
    const radical = input.match(radicalPattern);
    if (radical) {
      const [, factor = '1', grouped, plain, denominator = '1'] = radical;
      const square = (Number(factor) / Number(denominator)) ** 2 * Number(grouped || plain);
      return Number.isFinite(square) ? { square } : null;
    }
    const numeric = input.match(numericPattern);
    if (!numeric) return null;
    const value = Number(numeric[1]) / Number(numeric[2] ?? 1);
    return Number.isFinite(value) ? { value } : null;
  }

  function checkAnswer(raw, expected) {
    const actual = readLength(raw);
    if (!actual) return 'format';
    if (typeof expected !== 'number' && actual.value !== undefined) return 'radical';
    if (actual.value !== undefined) return actual.value === expected ? 'correct' : 'wrong';
    const expectedSquare = typeof expected === 'number' ? expected ** 2 : expected.square;
    return Math.abs(actual.square - expectedSquare) <= 1e-10 ? 'correct' : 'wrong';
  }

  const api = { guided, homework, predictions, regularPyramid, truncatedPyramid, rhombusPyramid, checkAnswer };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PyramidLesson = api;
})(globalThis);
