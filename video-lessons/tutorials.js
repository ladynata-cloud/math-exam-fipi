/* Fixed reusable recordings of the actual public trainer interfaces. */
(function (root) {
  'use strict';
  const items = [
  {
    "id": "negative-numbers",
    "title": "Как заниматься: Отрицательные числа",
    "file": "using-negative-numbers.mp4",
    "trainerUrl": "https://mathexam.space/trainers/oge-basics/negative-add-subtract.html?practice=1",
    "durationSeconds": 34.87,
    "bytes": 1081465
  },
  {
    "id": "fractions",
    "title": "Как заниматься: Дроби: общий знаменатель",
    "file": "using-fractions.mp4",
    "trainerUrl": "https://mathexam.space/trainers/oge-basics/fraction-common-denominator.html?practice=1",
    "durationSeconds": 34.53,
    "bytes": 1167046
  },
  {
    "id": "brackets",
    "title": "Как заниматься: Раскрытие скобок в уравнении",
    "file": "using-brackets.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=equations-brackets",
    "durationSeconds": 29.3,
    "bytes": 851067
  },
  {
    "id": "linear-equation",
    "title": "Как заниматься: Линейные уравнения",
    "file": "using-linear-equation.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=equations-linear",
    "durationSeconds": 29.07,
    "bytes": 857070
  },
  {
    "id": "proportions",
    "title": "Как заниматься: Пропорции",
    "file": "using-proportions.mp4",
    "trainerUrl": "https://mathexam.space/trainers/oge-basics/percentages/proportion.html?practice=1",
    "durationSeconds": 32.1,
    "bytes": 915660
  },
  {
    "id": "percentages",
    "title": "Как заниматься: Проценты: часть, целое или процент",
    "file": "using-percentages.mp4",
    "trainerUrl": "https://mathexam.space/trainers/oge-basics/percentages/percent-of-number-and-whole.html?practice=1",
    "durationSeconds": 33,
    "bytes": 929131
  },
  {
    "id": "adjacent-angles",
    "title": "Как заниматься: Смежные и вертикальные углы",
    "file": "using-adjacent-angles.mp4",
    "trainerUrl": "https://mathexam.space/geometry-course/trainers/ch1-p6-t2-angle-problems.html",
    "durationSeconds": 30.17,
    "bytes": 970051
  },
  {
    "id": "numeric-expressions",
    "title": "Как заниматься: Числовые выражения",
    "file": "using-numeric-expressions.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-calculation-plan",
    "durationSeconds": 33.13,
    "bytes": 932962
  },
  {
    "id": "variable-expressions",
    "title": "Как заниматься: Выражения с переменными",
    "file": "using-variable-expressions.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-expression-language",
    "durationSeconds": 33.8,
    "bytes": 1011894
  },
  {
    "id": "compare-expressions",
    "title": "Как заниматься: Сравнение значений выражений",
    "file": "using-compare-expressions.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-compare-difference",
    "durationSeconds": 33.53,
    "bytes": 944963
  },
  {
    "id": "arithmetic-properties",
    "title": "Как заниматься: Свойства действий",
    "file": "using-arithmetic-properties.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-convenient-calculation",
    "durationSeconds": 33.7,
    "bytes": 963209
  },
  {
    "id": "identities",
    "title": "Как заниматься: Тождества и преобразования",
    "file": "using-identities.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-identity-check",
    "durationSeconds": 33.5,
    "bytes": 1071975
  },
  {
    "id": "equation-roots",
    "title": "Как заниматься: Корень уравнения",
    "file": "using-equation-roots.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-equation-root",
    "durationSeconds": 33.9,
    "bytes": 1064963
  },
  {
    "id": "linear-cases",
    "title": "Как заниматься: Линейное уравнение: три случая",
    "file": "using-linear-cases.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-equation-cases",
    "durationSeconds": 34.27,
    "bytes": 1043769
  },
  {
    "id": "equation-word-problems",
    "title": "Как заниматься: Задача с помощью уравнения",
    "file": "using-equation-word-problems.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-word-parts",
    "durationSeconds": 33.23,
    "bytes": 1092237
  },
  {
    "id": "grade7-a-opposite-expression",
    "title": "Как заниматься: Минус перед выражением",
    "file": "using-grade7-a-opposite-expression.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-a-opposite-expression",
    "durationSeconds": 35.166667,
    "bytes": 1263787
  },
  {
    "id": "grade7-a-two-variable-collect",
    "title": "Как заниматься: Подобные слагаемые с двумя буквами",
    "file": "using-grade7-a-two-variable-collect.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-a-two-variable-collect",
    "durationSeconds": 34.9,
    "bytes": 1310986
  },
  {
    "id": "grade7-a-equation-two-brackets",
    "title": "Как заниматься: Уравнение со скобками в обеих частях",
    "file": "using-grade7-a-equation-two-brackets.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-a-equation-two-brackets",
    "durationSeconds": 37.466667,
    "bytes": 1119509
  },
  {
    "id": "grade7-a-equation-denominators",
    "title": "Как заниматься: Уравнение: убираем знаменатели",
    "file": "using-grade7-a-equation-denominators.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-a-equation-denominators",
    "durationSeconds": 37.133333,
    "bytes": 1301844
  },
  {
    "id": "grade7-a-equation-decimals",
    "title": "Как заниматься: Уравнение с десятичными числами",
    "file": "using-grade7-a-equation-decimals.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-a-equation-decimals",
    "durationSeconds": 37.5,
    "bytes": 1327372
  },
  {
    "id": "grade7-g-segment-order",
    "title": "Как заниматься: Отрезки: порядок точек",
    "file": "using-grade7-g-segment-order.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-segment-order",
    "durationSeconds": 37.533333,
    "bytes": 1031732
  },
  {
    "id": "grade7-g-midpoint-chain",
    "title": "Как заниматься: Середина отрезка",
    "file": "using-grade7-g-midpoint-chain.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-midpoint-chain",
    "durationSeconds": 35.733333,
    "bytes": 1211444
  },
  {
    "id": "grade7-g-angle-addition",
    "title": "Как заниматься: Сложение углов",
    "file": "using-grade7-g-angle-addition.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-angle-addition",
    "durationSeconds": 36.3,
    "bytes": 994083
  },
  {
    "id": "grade7-g-angle-bisector",
    "title": "Как заниматься: Биссектриса угла",
    "file": "using-grade7-g-angle-bisector.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-angle-bisector",
    "durationSeconds": 37.166667,
    "bytes": 1096095
  },
  {
    "id": "grade7-g-adjacent-equation",
    "title": "Как заниматься: Смежные углы и уравнение",
    "file": "using-grade7-g-adjacent-equation.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-adjacent-equation",
    "durationSeconds": 36.8,
    "bytes": 1177985
  },
  {
    "id": "grade7-b-mixed-borrow",
    "title": "Как заниматься: Смешанные числа: занимаем единицу",
    "file": "using-grade7-b-mixed-borrow.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-b-mixed-borrow",
    "durationSeconds": 36.066667,
    "bytes": 1204299
  },
  {
    "id": "grade7-b-fraction-product-cancel",
    "title": "Как заниматься: Умножение дробей: сокращаем множители",
    "file": "using-grade7-b-fraction-product-cancel.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-b-fraction-product-cancel",
    "durationSeconds": 36.433333,
    "bytes": 1388921
  },
  {
    "id": "grade7-b-decimal-divisor-scale",
    "title": "Как заниматься: Деление на десятичную дробь",
    "file": "using-grade7-b-decimal-divisor-scale.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-b-decimal-divisor-scale",
    "durationSeconds": 35.766667,
    "bytes": 1204821
  },
  {
    "id": "grade7-b-signed-fraction-sum",
    "title": "Как заниматься: Дроби с разными знаками",
    "file": "using-grade7-b-signed-fraction-sum.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-b-signed-fraction-sum",
    "durationSeconds": 35.8,
    "bytes": 1099340
  },
  {
    "id": "grade7-b-percent-proportion",
    "title": "Как заниматься: Проценты через пропорцию",
    "file": "using-grade7-b-percent-proportion.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-b-percent-proportion",
    "durationSeconds": 35.8,
    "bytes": 1132158
  }
];
  const byId = Object.create(null);
  for (const item of items) byId[item.id] = Object.freeze(item);
  const api = Object.freeze({ revision: 'grade7-next-20261006', items: Object.freeze(items), get: id => typeof id === 'string' ? byId[id] || null : null });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MathExamTutorials = api;
})(typeof window === 'undefined' ? globalThis : window);
