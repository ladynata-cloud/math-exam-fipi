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
  }
];
  const byId = Object.create(null);
  for (const item of items) byId[item.id] = Object.freeze(item);
  const api = Object.freeze({ revision: 'grade7-silent-motion-20261005', items: Object.freeze(items), get: id => typeof id === 'string' ? byId[id] || null : null });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MathExamTutorials = api;
})(typeof window === 'undefined' ? globalThis : window);
