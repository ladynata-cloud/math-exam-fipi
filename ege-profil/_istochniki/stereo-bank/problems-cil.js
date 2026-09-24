const P_CIL = [
  {
    id: "cil-01", topic: "Цилиндр", group: "объём",
    cond: "Радиус основания цилиндра равен 4, высота равна 9. Найдите объём цилиндра, делённый на π.",
    ans: "144",
    scene: {
      bodies: [{
        kind: "cyl", r: 4, h: 9, centers: ["O", "O1"], axis: true,
        coordLabels: [
          { t: "4", p: [0, 9, 0], q: [2 * Math.cos(0.65), 9, 2 * Math.sin(0.65)] },
          { t: "9", p: [5.08 * Math.cos(0.65 - Math.PI), 0, 5.08 * Math.sin(0.65 - Math.PI)], q: [5.08 * Math.cos(0.65 - Math.PI), 9, 5.08 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    hint: "Объём цилиндра равен произведению площади основания на высоту: V = πr²h.",
    sol: [
      "V = πr²h = π · 4² · 9 = 144π.",
      "V/π = 144."
    ]
  },
  {
    id: "cil-02", topic: "Цилиндр", group: "объём",
    cond: "Объём цилиндра равен 63π, а его высота равна 7. Найдите радиус основания цилиндра.",
    ans: "3",
    scene: {
      bodies: [{
        kind: "cyl", r: 3, h: 7, centers: ["O", "O1"], axis: true,
        rim: { A: { ang: 0.65 } },
        coordLabels: [
          { t: "7", p: [3.84 * Math.cos(0.65 - Math.PI), 0, 3.84 * Math.sin(0.65 - Math.PI)], q: [3.84 * Math.cos(0.65 - Math.PI), 7, 3.84 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [["O", "A", "?"]],
    construct: { segments: [["O", "A", "?"]] },
    hint: "Выразите площадь основания из формулы V = πr²h, затем найдите радиус.",
    sol: [
      "πr² · 7 = 63π, откуда r² = 9.",
      "r = 3."
    ]
  },
  {
    id: "cil-04", topic: "Цилиндр", group: "поверхность",
    cond: "Радиус основания цилиндра равен 5, высота равна 8. Найдите площадь боковой поверхности цилиндра, делённую на π.",
    ans: "80",
    scene: {
      bodies: [{
        kind: "cyl", r: 5, h: 8, centers: ["O", "O1"], axis: true,
        coordLabels: [
          { t: "5", p: [0, 8, 0], q: [2.5 * Math.cos(0.65), 8, 2.5 * Math.sin(0.65)] },
          { t: "8", p: [6.2 * Math.cos(0.65 - Math.PI), 0, 6.2 * Math.sin(0.65 - Math.PI)], q: [6.2 * Math.cos(0.65 - Math.PI), 8, 6.2 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    hint: "Боковая поверхность цилиндра — развёрнутый прямоугольник со сторонами 2πr и h.",
    sol: [
      "S(бок) = 2πrh = 2π · 5 · 8 = 80π.",
      "S(бок)/π = 80."
    ]
  },
  {
    id: "cil-05", topic: "Цилиндр", group: "поверхность",
    cond: "Радиус основания цилиндра равен 2, высота равна 7. Найдите площадь полной поверхности цилиндра, делённую на π.",
    ans: "36",
    scene: {
      bodies: [{
        kind: "cyl", r: 2, h: 7, centers: ["O", "O1"], axis: true,
        coordLabels: [
          { t: "2", p: [2.9 * Math.cos(0.65), 7.4, 2.9 * Math.sin(0.65)], q: [2.9 * Math.cos(0.65), 7.4, 2.9 * Math.sin(0.65)] },
          { t: "7", p: [2.84 * Math.cos(0.65 - Math.PI), 0, 2.84 * Math.sin(0.65 - Math.PI)], q: [2.84 * Math.cos(0.65 - Math.PI), 7, 2.84 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    hint: "Полная поверхность — боковая поверхность и два круга оснований: S = 2πrh + 2πr².",
    sol: [
      "S = 2πr(r + h) = 2π · 2 · (2 + 7) = 36π.",
      "S/π = 36."
    ]
  },
  {
    id: "cil-06", topic: "Цилиндр", group: "осевое сечение",
    cond: "Радиус основания цилиндра равен 4, высота равна 6. Найдите площадь осевого сечения цилиндра.",
    ans: "48",
    scene: {
      bodies: [{
        kind: "cyl", r: 4, h: 6, ghost: true, centers: ["O", "O1"],
        rim: {
          A: { ang: 0.65 }, B: { ang: 0.65 - Math.PI },
          A1: { ang: 0.65, at: "top" }, B1: { ang: 0.65 - Math.PI, at: "top" }
        },
        gens: [["A", "A1"], ["B", "B1"]],
        coordLabels: [
          { t: "4", p: [0, 0, 0], q: [4 * Math.cos(0.65), 0, 4 * Math.sin(0.65)] },
          { t: "6", p: [4 * Math.cos(0.65 - Math.PI), 0, 4 * Math.sin(0.65 - Math.PI)], q: [4 * Math.cos(0.65 - Math.PI), 6, 4 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    construct: { segments: [["A", "B"], ["A1", "B1"]], fills: [["A", "B", "B1", "A1"]] },
    hint: "Осевое сечение цилиндра — прямоугольник ABB₁A₁ со сторонами, равными диаметру основания и высоте.",
    sol: [
      "Стороны осевого сечения: AB = 2r = 8 и AA₁ = h = 6.",
      "S = 8 · 6 = 48."
    ]
  },
  {
    id: "cil-07", topic: "Цилиндр", group: "вода",
    cond: "В цилиндрическом сосуде уровень воды достигает 24 см. Всю воду перелили во второй цилиндрический сосуд, диаметр основания которого в 2 раза больше диаметра первого. На какой высоте (в см) будет находиться уровень воды во втором сосуде?",
    ans: "6",
    scene: {
      bodies: [
        {
          kind: "cyl", r: 6, h: 30, ghost: true, hideLabels: true, centers: ["_a", "_a1"],
          water: { h: 24 },
          coordLabels: [
            { t: "24", p: [6 * Math.cos(2.8), 0, 6 * Math.sin(2.8)], q: [6 * Math.cos(2.8), 24, 6 * Math.sin(2.8)] }
          ]
        },
        { kind: "cyl", r: 12, h: 30, ghost: true, hideLabels: true, centers: ["_b", "_b1"], at: [24, 0, 0], water: { h: 6 } },
        {
          kind: "custom",
          pts: { M: [24 + 12 * Math.cos(2.2), 0, 12 * Math.sin(2.2)], N: [24 + 12 * Math.cos(2.2), 6, 12 * Math.sin(2.2)] },
          edges: [["M", "N"]]
        }
      ]
    },
    labels: [["M", "N", "?"]],
    hint: "Объём воды не меняется. Если радиус основания больше в 2 раза, то площадь основания больше в 4 раза.",
    sol: [
      "Диаметр больше в 2 раза, значит площадь основания больше в 2² = 4 раза.",
      "При том же объёме уровень в 4 раза ниже: MN = 24 : 4 = 6 см."
    ]
  },
  {
    id: "cil-08", topic: "Цилиндр", group: "два цилиндра",
    cond: "Во сколько раз увеличится объём цилиндра, если радиус его основания увеличить в 2 раза, а высоту оставить прежней?",
    ans: "4",
    scene: {
      bodies: [
        {
          kind: "cyl", r: 2, h: 5, hideLabels: true, centers: ["_a", "_a1"],
          coordLabels: [
            { t: "r", p: [0, 6.1, 0], q: [0, 6.1, 0] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 5, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cyl", r: 4, h: 5, hideLabels: true, centers: ["_b", "_b1"], at: [9, 0, 0],
          coordLabels: [
            { t: "2r", p: [9, 5, 0], q: [9, 5, 0] },
            { t: "h", p: [9 + 5 * Math.cos(0.65), 0, 5 * Math.sin(0.65)], q: [9 + 5 * Math.cos(0.65), 5, 5 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Подставьте в формулу V = πr²h вместо r удвоенный радиус и сравните объёмы.",
    sol: [
      "V₂ = π(2r)²h = 4πr²h = 4V₁.",
      "Объём увеличится в 4 раза."
    ]
  },
  {
    id: "cil-09", topic: "Цилиндр", group: "два цилиндра",
    cond: "Объём первого цилиндра равен 12. У второго цилиндра радиус основания в 3 раза больше, а высота в 4 раза меньше, чем у первого. Найдите объём второго цилиндра.",
    ans: "27",
    scene: {
      bodies: [
        {
          kind: "cyl", r: 2, h: 8, hideLabels: true, centers: ["_a", "_a1"],
          coordLabels: [
            { t: "r", p: [0, 9.3, 0], q: [0, 9.3, 0] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 8, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cyl", r: 6, h: 2, hideLabels: true, centers: ["_b", "_b1"], at: [11, 0, 0],
          coordLabels: [
            { t: "3r", p: [11, 2, 0], q: [11, 2, 0] },
            { t: "h/4", p: [11 + 7 * Math.cos(0.65), 0, 7 * Math.sin(0.65)], q: [11 + 7 * Math.cos(0.65), 2, 7 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Объём пропорционален квадрату радиуса и первой степени высоты.",
    sol: [
      "V₂/V₁ = (3r)²·(h/4) / (r²h) = 9/4.",
      "V₂ = 12 · 9/4 = 27."
    ]
  },
  {
    id: "cil-10", topic: "Цилиндр", group: "вода",
    cond: "В цилиндрический бак, частично заполненный водой, целиком погрузили деталь. Площадь основания бака равна 80 см². После погружения детали уровень воды в баке поднялся на 5 см. Найдите объём детали. Ответ дайте в кубических сантиметрах.",
    ans: "400",
    scene: {
      bodies: [
        {
          kind: "cyl", r: Math.sqrt(80 / Math.PI), h: 14, ghost: true, hideLabels: true, centers: ["_o", "_o1"],
          water: { h: 11 },
          coordLabels: [
            { t: "5", p: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 6, Math.sqrt(80 / Math.PI) * Math.sin(0.65)], q: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 11, Math.sqrt(80 / Math.PI) * Math.sin(0.65)] }
          ]
        },
        {
          kind: "custom",
          pts: {
            _m: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 6, Math.sqrt(80 / Math.PI) * Math.sin(0.65)],
            _n: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 11, Math.sqrt(80 / Math.PI) * Math.sin(0.65)]
          },
          edges: [["_m", "_n"]],
          circles: [{ c: [0, 6, 0], r: Math.sqrt(80 / Math.PI), plane: "h", col: "amber" }]
        }
      ]
    },
    labels: [],
    hint: "Объём детали равен объёму вытесненной воды — слою между старым и новым уровнями.",
    sol: [
      "Деталь вытеснила слой воды высотой 5 см с площадью основания 80 см².",
      "V = 80·5 = 400 см³."
    ]
  }
];
