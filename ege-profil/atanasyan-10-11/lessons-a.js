/* Original problems. Textbook references name theory topics, never exercise numbers. */
(function () {
  'use strict';

  const proof = 'а) Доказательство';
  const calculation = 'б) Вычисление';
  const option = (id, html) => ({ id, html });
  const choice = (id, label, correct, options) => ({ id, kind: 'choice', label, correct, options });
  const number = (id, label, correct) => ({ id, kind: 'number', label, correct: String(correct) });
  const step = (title, phase, body, field, hint, record, modelView) => ({
    title, phase, body, fields: [field], hint, record, modelView
  });
  const view = (label, segments, polygon = []) => ({ label, segments, polygon });

  function sectionLesson(variant, ab, ac, height) {
    const baseArea = ab * ac / 2;
    const sectionArea = baseArea / 4;
    const problem = `В тетраэдре SABC точки M, N и P — середины рёбер SA, SB и SC соответственно. Треугольник ABC прямоугольный: ∠BAC = 90°, AB = ${ab}, AC = ${ac}.`;
    return {
      id: `section-${variant}`,
      family: 'section',
      title: `Сечение через середины рёбер · вариант ${variant}`,
      problemHtml: `<p>${problem}</p><p><strong>а)</strong> Докажите, что плоскость MNP параллельна плоскости ABC.</p><p><strong>б)</strong> Найдите площадь треугольника MNP.</p>`,
      reportProblem: `${problem} а) Докажите, что (MNP) ∥ (ABC). б) Найдите площадь MNP.`,
      reportAnswer: `а) (MNP) ∥ (ABC). б) ${sectionArea}.`,
      answerHtml: `<p><strong>а)</strong> MN и MP — средние линии треугольников SAB и SAC, поэтому MN ∥ AB и MP ∥ AC. Прямые MN и MP пересекаются в M, а AB и AC — в A. Плоскости различны, поэтому (MNP) ∥ (ABC).</p><p><strong>б)</strong> Все стороны MNP вдвое меньше соответствующих сторон ABC. Площади относятся как 1 : 4. Площадь ABC равна ${baseArea}, значит площадь MNP равна <strong>${sectionArea}</strong>.</p>`,
      bookPoints: [10, 12, 14],
      unitIds: ['parallel-planes', 'polyhedra', 'sections'],
      params: { ab, ac, height, baseArea, sectionArea },
      model: {
        points: {
          A: [0, 0, 0], B: [ab, 0, 0], C: [0, ac, 0], S: [2, 2, height],
          M: [1, 1, height / 2], N: [(ab + 2) / 2, 1, height / 2], P: [1, (ac + 2) / 2, height / 2]
        },
        edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['S', 'A'], ['S', 'B'], ['S', 'C']],
        faces: [['A', 'B', 'C'], ['S', 'A', 'B'], ['S', 'B', 'C'], ['S', 'C', 'A']],
        views: {
          neutral: { ...view('Тетраэдр SABC и середины рёбер', []), points: ['M', 'N', 'P'] },
          sab: view('Грань SAB: середины M и N', [['S', 'A'], ['S', 'B'], ['A', 'B'], ['M', 'N']], ['S', 'A', 'B']),
          sac: view('Грань SAC: середины M и P', [['S', 'A'], ['S', 'C'], ['A', 'C'], ['M', 'P']], ['S', 'A', 'C']),
          sbc: view('Грань SBC: середины N и P', [['S', 'B'], ['S', 'C'], ['B', 'C'], ['N', 'P']], ['S', 'B', 'C']),
          parallel: view('Две пары параллельных прямых', [['M', 'N'], ['M', 'P'], ['A', 'B'], ['A', 'C']], ['M', 'N', 'P']),
          triangles: view('Треугольники MNP и ABC', [['M', 'N'], ['N', 'P'], ['P', 'M'], ['A', 'B'], ['B', 'C'], ['C', 'A']], ['M', 'N', 'P']),
          base: view('Прямоугольный треугольник ABC', [['A', 'B'], ['A', 'C'], ['B', 'C']], ['A', 'B', 'C'])
        }
      },
      steps: [
        step('Найдём нужную грань', proof,
          '<p>M лежит на SA, а N — на SB. В каком треугольнике эти точки являются серединами двух сторон?</p>',
          choice('triangle', 'Выберите треугольник', 'sab', [option('abc', 'ABC'), option('sab', 'SAB'), option('sbc', 'SBC')]),
          'Нужный треугольник содержит обе стороны: SA и SB.',
          '<p>M и N — середины сторон SA и SB треугольника SAB.</p>', 'sab'),
        step('Применим теорему о средней линии', proof,
          '<p>Отрезок соединяет середины двух сторон треугольника — это средняя линия. Она параллельна третьей стороне и равна её половине. Что получаем в треугольнике SAB?</p>',
          choice('midline', 'Выберите верное утверждение', 'parallel-half', [option('parallel-full', 'MN ∥ AB, MN = AB'), option('perpendicular', 'MN ⟂ AB, MN = AB/2'), option('parallel-half', 'MN ∥ AB, MN = AB/2')]),
          'Третья сторона треугольника SAB — AB. Средняя линия вдвое короче неё.',
          '<p>MN — средняя линия треугольника SAB, поэтому MN ∥ AB и MN = AB/2.</p>', 'sab'),
        step('Получим вторую пару параллельных прямых', proof,
          '<p>M и P — середины SA и SC. Примените ту же теорему в треугольнике SAC.</p>',
          choice('second-midline', 'Что верно для MP?', 'ac', [option('sc', 'MP ∥ SC, MP = SC/2'), option('ac', 'MP ∥ AC, MP = AC/2'), option('ab', 'MP ∥ AB, MP = AB/2')]),
          'MP соединяет середины сторон SA и SC, значит сравниваем его с третьей стороной AC.',
          '<p>MP — средняя линия треугольника SAC, поэтому MP ∥ AC и MP = AC/2.</p>', 'sac'),
        step('Проверим третью сторону', proof,
          '<p>N и P — середины SB и SC. Какая связь следует из теоремы о средней линии треугольника SBC?</p>',
          choice('third-midline', 'Что верно для NP?', 'bc', [option('bc', 'NP ∥ BC, NP = BC/2'), option('sc', 'NP ∥ SC, NP = SC/2'), option('double', 'NP ∥ BC, NP = 2BC')]),
          'В треугольнике SBC третья сторона — BC.',
          '<p>NP — средняя линия треугольника SBC, поэтому NP ∥ BC и NP = BC/2.</p>', 'sbc'),
        step('Проверим пересечение прямых', proof,
          '<p>Для признака параллельности плоскостей нужны две пересекающиеся прямые в каждой из них. AB и AC пересекаются в A. В какой точке пересекаются MN и MP?</p>',
          choice('intersection', 'Выберите точку', 'm', [option('n', 'N'), option('p', 'P'), option('m', 'M')]),
          'Названия MN и MP содержат одну общую точку.',
          '<p>MN и MP пересекаются в M; AB и AC пересекаются в A. Соответствующие прямые параллельны.</p>', 'parallel'),
        step('Завершим доказательство', proof,
          '<p>M не лежит в плоскости ABC: прямая SA пересекает эту плоскость только в A. Значит, плоскости MNP и ABC различны. Почему они параллельны?</p>',
          choice('planes', 'Выберите основание', 'two-pairs', [option('one-pair', 'Для этого достаточно только MN ∥ AB.'), option('two-pairs', 'Две пересекающиеся прямые одной плоскости соответственно параллельны двум пересекающимся прямым другой.'), option('midpoints-only', 'Любая плоскость через три середины рёбер параллельна любой грани.')]),
          'Назовите обе пары: MN ∥ AB и MP ∥ AC. В каждой плоскости выбранные прямые пересекаются.',
          '<p>S не лежит в плоскости ABC, а прямая SA пересекает её только в A. M — внутренняя точка SA, поэтому M не лежит в плоскости ABC, и плоскости MNP и ABC различны. Прямые MN и MP пересекаются в M, прямые AB и AC — в A; MN ∥ AB и MP ∥ AC. По признаку параллельности плоскостей (MNP) ∥ (ABC). Пункт а) доказан.</p>', 'parallel'),
        step('Сравним длины', calculation,
          '<p>Мы получили MN = AB/2, MP = AC/2 и NP = BC/2. Поэтому треугольники MNP и ABC подобны по трём пропорциональным сторонам. Чему равно отношение MN/AB? Введите десятичную дробь.</p>',
          number('side-ratio', 'MN/AB =', 0.5),
          'Половина целого — это 0,5.',
          '<p>MN/AB = MP/AC = NP/BC = 0,5. Поэтому треугольники MNP и ABC подобны по трём пропорциональным сторонам. Отношение соответствующих сторон равно 0,5.</p>', 'triangles'),
        step('Перейдём от длин к площадям', calculation,
          '<p>Площади подобных треугольников относятся как квадраты соответствующих сторон. Вычислите отношение площади MNP к площади ABC: 0,5².</p>',
          number('area-ratio', 'Отношение площадей =', 0.25),
          'Нужно умножить 0,5 на 0,5.',
          '<p>Площади подобных треугольников относятся как квадраты соответствующих сторон. Поэтому отношение площади MNP к площади ABC равно 0,5² = 0,25. Площадь MNP составляет четверть площади ABC.</p>', 'triangles'),
        step('Найдём площадь основания', calculation,
          `<p>В треугольнике ABC стороны AB и AC перпендикулярны. Поэтому его площадь равна половине произведения катетов. Вычислите ${ab} · ${ac} / 2.</p>`,
          number('base-area', 'Площадь ABC =', baseArea),
          `Умножьте ${ab} на ${ac} и разделите результат на 2.`,
          `<p>Площадь ABC равна ${ab} · ${ac} / 2 = ${baseArea}.</p>`, 'base'),
        step('Найдём площадь сечения', calculation,
          `<p>Площадь MNP составляет четверть площади ABC. Вычислите ${baseArea} / 4.</p>`,
          number('section-area', 'Площадь MNP =', sectionArea),
          `Разделите ${baseArea} на 4.`,
          `<p>Площадь MNP равна ${baseArea} / 4 = <strong>${sectionArea}</strong>.</p>`, 'triangles')
      ]
    };
  }

  function linePlaneLesson(variant, ab, ad, heightFactor, angle) {
    const diagonal = Math.hypot(ab, ad);
    const height = diagonal * heightFactor;
    const exactHeight = heightFactor === 1 ? String(diagonal) : `${diagonal}√3`;
    const exactTangent = heightFactor === 1 ? '1' : '√3';
    const problem = `В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ даны AB = ${ab}, AD = ${ad}, AA₁ = ${exactHeight}.`;
    return {
      id: `line-plane-${variant}`,
      family: 'line-plane',
      title: `Диагональ и плоскость основания · вариант ${variant}`,
      problemHtml: `<p>${problem}</p><p><strong>а)</strong> Докажите, что AC — ортогональная проекция AC₁ на плоскость ABCD.</p><p><strong>б)</strong> Найдите угол между AC₁ и плоскостью ABCD.</p>`,
      reportProblem: `${problem} а) Докажите, что AC — ортогональная проекция AC₁ на (ABCD). б) Найдите угол между AC₁ и (ABCD).`,
      reportAnswer: `а) Проекция AC₁ — AC. б) ${angle}°.`,
      answerHtml: `<p><strong>а)</strong> CC₁ перпендикулярна пересекающимся прямым BC и CD, поэтому CC₁ ⟂ (ABCD). Точка C₁ проектируется в C, а A — в A. Значит, проекция AC₁ — AC.</p><p><strong>б)</strong> Нужный угол — ∠C₁AC. В прямоугольном треугольнике ABC имеем AC = √(${ab}² + ${ad}²) = ${diagonal}. В прямоугольном треугольнике ACC₁: tg ∠C₁AC = CC₁/AC = ${exactTangent}. Ответ: <strong>${angle}°</strong>.</p>`,
      bookPoints: [17, 21, 24],
      unitIds: ['perpendicular', 'projection', 'box'],
      params: { ab, ad, height, baseDiagonal: diagonal, angle },
      model: {
        points: {
          A: [0, 0, 0], B: [ab, 0, 0], C: [ab, ad, 0], D: [0, ad, 0],
          'A₁': [0, 0, height], 'B₁': [ab, 0, height], 'C₁': [ab, ad, height], 'D₁': [0, ad, height]
        },
        edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A₁', 'B₁'], ['B₁', 'C₁'], ['C₁', 'D₁'], ['D₁', 'A₁'], ['A', 'A₁'], ['B', 'B₁'], ['C', 'C₁'], ['D', 'D₁']],
        faces: [['A', 'B', 'C', 'D'], ['A₁', 'B₁', 'C₁', 'D₁'], ['A', 'B', 'B₁', 'A₁'], ['B', 'C', 'C₁', 'B₁'], ['C', 'D', 'D₁', 'C₁'], ['D', 'A', 'A₁', 'D₁']],
        views: {
          neutral: view('Параллелепипед и пространственная диагональ', [['A', 'C₁']]),
          sideBC: view('Прямоугольная грань BCC₁B₁', [['B', 'C'], ['C', 'C₁']], ['B', 'C', 'C₁', 'B₁']),
          sideCD: view('Прямоугольная грань DCC₁D₁', [['C', 'D'], ['C', 'C₁']], ['D', 'C', 'C₁', 'D₁']),
          perpendicular: view('CC₁ и две пересекающиеся прямые основания', [['C', 'C₁'], ['B', 'C'], ['C', 'D']], ['A', 'B', 'C', 'D']),
          projection: view('Отрезки AC₁, AC и CC₁', [['A', 'C₁'], ['A', 'C'], ['C', 'C₁']], ['A', 'C', 'C₁']),
          base: view('Прямоугольный треугольник ABC', [['A', 'B'], ['B', 'C'], ['A', 'C']], ['A', 'B', 'C'])
        }
      },
      steps: [
        step('Используем первую прямоугольную грань', proof,
          '<p>Все грани прямоугольного параллелепипеда — прямоугольники. В грани BCC₁B₁ рёбра BC и CC₁ — соседние стороны. Как они расположены?</p>',
          choice('bc-perpendicular', 'Выберите верное утверждение', 'perpendicular', [option('parallel', 'CC₁ ∥ BC'), option('perpendicular', 'CC₁ ⟂ BC'), option('equal', 'CC₁ = BC во всех прямоугольных параллелепипедах')]),
          'Соседние стороны прямоугольника образуют прямой угол.',
          '<p>Грань BCC₁B₁ — прямоугольник, поэтому CC₁ ⟂ BC.</p>', 'sideBC'),
        step('Используем вторую прямоугольную грань', proof,
          '<p>Теперь рассмотрим прямоугольную грань DCC₁D₁. Какая ещё прямая основания перпендикулярна CC₁?</p>',
          choice('cd-perpendicular', 'Выберите прямую', 'cd', [option('dc1', 'DC₁'), option('cc1', 'CC₁'), option('cd', 'CD')]),
          'Возьмите соседнюю с CC₁ сторону прямоугольника в плоскости основания.',
          '<p>Грань DCC₁D₁ — прямоугольник, поэтому CC₁ ⟂ CD.</p>', 'sideCD'),
        step('Докажем перпендикулярность плоскости', proof,
          '<p>BC и CD лежат в основании и пересекаются в C. Мы доказали CC₁ ⟂ BC и CC₁ ⟂ CD. Что следует по признаку перпендикулярности прямой и плоскости?</p>',
          choice('plane-perpendicular', 'Выберите вывод', 'perpendicular', [option('perpendicular', 'CC₁ ⟂ (ABCD)'), option('parallel', 'CC₁ ∥ (ABCD)'), option('lies', 'CC₁ лежит в плоскости ABCD')]),
          'Прямая, перпендикулярная двум пересекающимся прямым плоскости, перпендикулярна этой плоскости.',
          '<p>CC₁ перпендикулярна двум пересекающимся прямым BC и CD плоскости ABCD. Значит, CC₁ ⟂ (ABCD).</p>', 'perpendicular'),
        step('Найдём проекцию верхней вершины', proof,
          '<p>Ортогональная проекция точки — основание перпендикуляра из неё на плоскость. В какую точку основания проектируется C₁?</p>',
          choice('point-projection', 'Выберите точку', 'c', [option('a', 'A'), option('c', 'C'), option('d', 'D')]),
          'Уже доказано: C₁C перпендикулярна плоскости основания.',
          '<p>Ортогональная проекция C₁ на плоскость ABCD — точка C.</p>', 'projection'),
        step('Найдём проекцию диагонали', proof,
          '<p>A уже лежит в плоскости основания, поэтому проектируется сама в себя. C₁ проектируется в C. Какой отрезок соединяет проекции концов AC₁?</p>',
          choice('segment-projection', 'Выберите проекцию AC₁', 'ac', [option('cc1', 'CC₁'), option('ac1', 'AC₁'), option('ac', 'AC')]),
          'Соедините A и C — проекции двух концов исходного отрезка.',
          '<p>Проекции концов AC₁ — A и C. Поэтому ортогональная проекция AC₁ — AC. Пункт а) доказан.</p>', 'projection'),
        step('Назовём угол между прямой и плоскостью', calculation,
          '<p>Угол между наклонной и плоскостью — острый угол между наклонной и её ортогональной проекцией. Выберите угол между AC₁ и AC.</p>',
          choice('angle', 'Какой угол нужно найти?', 'c1ac', [option('c1ac', '∠C₁AC'), option('acc1', '∠ACC₁'), option('ac1c', '∠AC₁C')]),
          'Общая точка AC₁ и AC — A. Она должна стоять в середине названия угла.',
          '<p>Искомый угол между AC₁ и плоскостью ABCD равен ∠C₁AC.</p>', 'projection'),
        step('Применим теорему Пифагора в основании', calculation,
          `<p>В прямоугольнике ABCD имеем BC = AD = ${ad} и AB ⟂ BC. В прямоугольном треугольнике ABC: AC² = AB² + BC². Вычислите ${ab}² + ${ad}².</p>`,
          number('diagonal-square', 'AC² =', diagonal * diagonal),
          `Сложите ${ab * ab} и ${ad * ad}.`,
          `<p>AC² = ${ab}² + ${ad}² = ${diagonal * diagonal}.</p>`, 'base'),
        step('Найдём длину проекции', calculation,
          `<p>Мы получили AC² = ${diagonal * diagonal}. Длина положительна. Чему равна AC?</p>`,
          number('diagonal', 'AC =', diagonal),
          `Найдите положительное число, квадрат которого равен ${diagonal * diagonal}.`,
          `<p>AC = √${diagonal * diagonal} = ${diagonal}.</p>`, 'base'),
        step('Найдём тангенс угла', calculation,
          `<p>CC₁ ⟂ AC, поэтому треугольник ACC₁ прямоугольный. Для угла при A противолежащий катет — CC₁, прилежащий — AC. Рёбра CC₁ и AA₁ равны. Вычислите tg ∠C₁AC = ${exactHeight}/${diagonal}.</p>`,
          choice('tangent', 'Выберите точное значение', heightFactor === 1 ? 'one' : 'sqrt3', [option('sqrt3', '√3'), option('one', '1'), option('sqrt3-third', '√3/3')]),
          `Разделите ${exactHeight} на ${diagonal}. Для тангенса берём отношение катетов, а не гипотенузу.`,
          `<p>tg ∠C₁AC = CC₁/AC = ${exactHeight}/${diagonal} = ${exactTangent}.</p>`, 'projection'),
        step('Получим ответ в градусах', calculation,
          `<p>Искомый угол острый, его тангенс равен ${exactTangent}. Используйте табличные значения: tg 30° = √3/3, tg 45° = 1, tg 60° = √3. Введите только число градусов.</p>`,
          number('angle-degrees', 'Угол, ° =', angle),
          `Найдите в таблице значение тангенса ${exactTangent}.`,
          `<p>Угол между AC₁ и плоскостью ABCD равен <strong>${angle}°</strong>.</p>`, 'projection')
      ]
    };
  }

  function dihedralLesson(variant, side, heightFactor, angle) {
    const halfSide = side / 2;
    const height = halfSide * heightFactor;
    const exactHeight = heightFactor === 1 ? String(halfSide) : `${halfSide}√3`;
    const exactTangent = heightFactor === 1 ? '1' : '√3';
    const problem = `В правильной четырёхугольной пирамиде SABCD сторона основания AB = ${side}, высота SO = ${exactHeight}. O — центр квадрата ABCD, M — середина AB.`;
    return {
      id: `dihedral-${variant}`,
      family: 'dihedral',
      title: `Двугранный угол пирамиды · вариант ${variant}`,
      problemHtml: `<p>${problem}</p><p><strong>а)</strong> Докажите, что ∠SMO — линейный угол двугранного угла между гранью SAB и основанием при ребре AB.</p><p><strong>б)</strong> Найдите этот двугранный угол.</p>`,
      reportProblem: `${problem} а) Докажите, что ∠SMO — линейный угол двугранного угла при AB. б) Найдите этот угол.`,
      reportAnswer: `а) SM ⟂ AB и OM ⟂ AB, значит линейный угол — ∠SMO. б) ${angle}°.`,
      answerHtml: `<p><strong>а)</strong> SA = SB и OA = OB. M — середина AB, поэтому медианы SM и OM равнобедренных треугольников SAB и OAB перпендикулярны AB. Лучи MS и MO лежат в соответствующих гранях, значит ∠SMO — линейный угол двугранного угла при AB.</p><p><strong>б)</strong> SO ⟂ (ABCD), поэтому треугольник SOM прямоугольный. OM = AB/2 = ${halfSide}. Тогда tg ∠SMO = SO/OM = ${exactTangent}. Ответ: <strong>${angle}°</strong>.</p>`,
      bookPoints: [17, 22, 33],
      unitIds: ['perpendicular', 'dihedral', 'pyramid'],
      params: { side, height, halfSide, angle },
      model: {
        points: {
          A: [-halfSide, -halfSide, 0], B: [halfSide, -halfSide, 0], C: [halfSide, halfSide, 0], D: [-halfSide, halfSide, 0],
          O: [0, 0, 0], M: [0, -halfSide, 0], S: [0, 0, height]
        },
        edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['S', 'A'], ['S', 'B'], ['S', 'C'], ['S', 'D']],
        faces: [['A', 'B', 'C', 'D'], ['S', 'A', 'B'], ['S', 'B', 'C'], ['S', 'C', 'D'], ['S', 'D', 'A']],
        views: {
          neutral: { ...view('Пирамида SABCD, центр O и середина M', [['S', 'O']]), points: ['O', 'M'] },
          side: view('Равнобедренный треугольник SAB', [['S', 'A'], ['S', 'B'], ['A', 'B'], ['S', 'M']], ['S', 'A', 'B']),
          base: view('Равнобедренный треугольник OAB', [['O', 'A'], ['O', 'B'], ['A', 'B'], ['O', 'M']], ['O', 'A', 'B']),
          angle: view('Отрезки SM и OM при ребре AB', [['S', 'M'], ['O', 'M'], ['A', 'B']], ['S', 'O', 'M']),
          section: view('Перпендикулярный разрез SOM', [['S', 'M'], ['O', 'M'], ['S', 'O'], ['A', 'B']], ['S', 'O', 'M']),
          midline: view('OM — средняя линия треугольника ABD', [['A', 'B'], ['B', 'D'], ['D', 'A'], ['O', 'M']], ['A', 'B', 'D'])
        }
      },
      steps: [
        step('Найдём равные стороны боковой грани', proof,
          '<p>В правильной пирамиде все боковые рёбра равны. Какое равенство делает треугольник SAB равнобедренным?</p>',
          choice('side-equality', 'Выберите равенство', 'sa-sb', [option('sa-ab', 'SA = AB'), option('sa-sb', 'SA = SB'), option('sm-ab', 'SM = AB')]),
          'Два боковых ребра в треугольнике SAB идут от вершины S к A и B.',
          '<p>SA = SB как боковые рёбра правильной пирамиды, поэтому треугольник SAB равнобедренный.</p>', 'side'),
        step('Проведём перпендикуляр в боковой грани', proof,
          '<p>M — середина AB, поэтому SM — медиана равнобедренного треугольника SAB, проведённая к основанию. Такая медиана является высотой. Какой вывод верен?</p>',
          choice('side-altitude', 'Выберите вывод', 'perpendicular', [option('parallel', 'SM ∥ AB'), option('sa', 'SM ⟂ SA'), option('perpendicular', 'SM ⟂ AB')]),
          'Высота перпендикулярна той стороне, к которой её провели: AB.',
          '<p>Медиана SM равнобедренного треугольника SAB является высотой, поэтому SM ⟂ AB.</p>', 'side'),
        step('Найдём равные стороны в основании', proof,
          '<p>O — центр квадрата ABCD. Его расстояния до всех вершин квадрата равны. Какое равенство нужно для треугольника OAB?</p>',
          choice('base-equality', 'Выберите равенство', 'oa-ob', [option('oa-ob', 'OA = OB'), option('oa-ab', 'OA = AB'), option('om-oa', 'OM = OA')]),
          'OA и OB соединяют центр квадрата с двумя его вершинами.',
          '<p>OA = OB как расстояния от центра квадрата до его вершин. Треугольник OAB равнобедренный.</p>', 'base'),
        step('Проведём перпендикуляр в основании', proof,
          '<p>M — середина AB. Значит, OM — медиана равнобедренного треугольника OAB, проведённая к основанию AB. Какая перпендикулярность следует отсюда?</p>',
          choice('base-altitude', 'Выберите вывод', 'om-ab', [option('om-oa', 'OM ⟂ OA'), option('om-ab', 'OM ⟂ AB'), option('oa-ab', 'OA ⟂ AB')]),
          'Медиана к основанию равнобедренного треугольника является высотой.',
          '<p>OA = OB, поэтому треугольник OAB равнобедренный. M — середина AB, значит OM — медиана к основанию этого треугольника. Такая медиана является высотой, поэтому OM ⟂ AB.</p>', 'base'),
        step('Назовём линейный угол', proof,
          '<p>Две грани пересекаются по AB. В точке M луч MS лежит в боковой грани, луч MO — в основании, и оба перпендикулярны AB. Какой угол является линейным углом этого двугранного угла?</p>',
          choice('linear-angle', 'Выберите угол', 'smo', [option('sao', '∠SAO'), option('smo', '∠SMO'), option('mso', '∠MSO')]),
          'Угол образуют лучи MS и MO. Их общая вершина M стоит в середине названия.',
          '<p>MS ⟂ AB и MO ⟂ AB; лучи лежат в соответствующих гранях. Поэтому ∠SMO — линейный угол двугранного угла при AB. Пункт а) доказан.</p>', 'angle'),
        step('Проверим плоскость разреза', proof,
          '<p>SM и OM пересекаются в M и лежат в плоскости SOM. Прямая AB перпендикулярна каждой из них. Как расположены AB и плоскость SOM?</p>',
          choice('normal-section', 'Выберите верное утверждение', 'perpendicular', [option('lies', 'AB лежит в плоскости SOM.'), option('parallel', 'AB параллельна плоскости SOM.'), option('perpendicular', 'AB перпендикулярна плоскости SOM.')]),
          'Снова примените признак: прямая перпендикулярна двум пересекающимся прямым плоскости.',
          '<p>SM и OM пересекаются в M и лежат в плоскости SOM. Уже доказано: AB ⟂ SM и AB ⟂ OM. По признаку перпендикулярности прямой и плоскости AB ⟂ (SOM). Поэтому плоскость SOM задаёт разрез, перпендикулярный ребру двугранного угла.</p>', 'section'),
        step('Найдём расстояние от центра до стороны', calculation,
          `<p>Диагонали квадрата делятся точкой O пополам. В треугольнике ABD точки O и M — середины BD и AB, поэтому OM — средняя линия: OM = AD/2. В квадрате AD = AB = ${side}. Найдите OM.</p>`,
          number('center-side', 'OM =', halfSide),
          `Разделите сторону квадрата ${side} на 2.`,
          `<p>O — середина BD, так как диагонали квадрата делятся точкой пересечения пополам. M — середина AB по условию. Поэтому OM — средняя линия треугольника ABD и OM = AD/2. В квадрате AD = AB = ${side}, значит OM = ${side}/2 = ${halfSide}.</p>`, 'midline'),
        step('Выберем отношение для тангенса', calculation,
          '<p>SO — высота пирамиды, поэтому SO ⟂ (ABCD) и SO ⟂ OM. Треугольник SOM прямоугольный при O. Для угла SMO какой катет нужно разделить на какой?</p>',
          choice('tangent-ratio', 'Выберите формулу', 'so-om', [option('so-sm', 'tg ∠SMO = SO/SM'), option('om-so', 'tg ∠SMO = OM/SO'), option('so-om', 'tg ∠SMO = SO/OM')]),
          'Тангенс — противолежащий катет, делённый на прилежащий. Для угла при M это SO и OM.',
          '<p>SO — высота пирамиды, поэтому SO ⟂ (ABCD). Прямая OM лежит в этой плоскости, значит SO ⟂ OM. Треугольник SOM прямоугольный при O. Для угла SMO катет SO — противолежащий, OM — прилежащий, поэтому tg ∠SMO = SO/OM.</p>', 'section'),
        step('Вычислим тангенс', calculation,
          `<p>Подставьте найденные длины: tg ∠SMO = ${exactHeight}/${halfSide}. Выберите точное значение.</p>`,
          choice('tangent-value', 'tg ∠SMO =', heightFactor === 1 ? 'one' : 'sqrt3', [option('sqrt3-third', '√3/3'), option('sqrt3', '√3'), option('one', '1')]),
          `Разделите ${exactHeight} на ${halfSide}.`,
          `<p>tg ∠SMO = ${exactHeight}/${halfSide} = ${exactTangent}.</p>`, 'section'),
        step('Найдём двугранный угол', calculation,
          `<p>Угол SMO острый, поскольку это один из острых углов прямоугольного треугольника SOM. Его тангенс равен ${exactTangent}. Используйте tg 30° = √3/3, tg 45° = 1, tg 60° = √3. Введите число градусов.</p>`,
          number('dihedral-degrees', 'Двугранный угол, ° =', angle),
          `Сопоставьте ${exactTangent} с табличными значениями тангенса.`,
          `<p>Линейный угол SMO, а значит и двугранный угол при AB, равен <strong>${angle}°</strong>.</p>`, 'section')
      ]
    };
  }

  const lessons = [
    sectionLesson(1, 12, 8, 10),
    sectionLesson(2, 10, 12, 14),
    linePlaneLesson(1, 3, 4, 1, 45),
    linePlaneLesson(2, 6, 8, Math.sqrt(3), 60),
    dihedralLesson(1, 12, 1, 45),
    dihedralLesson(2, 10, Math.sqrt(3), 60)
  ];
  if (typeof window !== 'undefined') window.AtanasyanLessonsA = lessons;
  if (typeof module !== 'undefined' && module.exports) module.exports = lessons;
})();
