/* Fixed reusable recordings of the actual public trainer interfaces. */
(function (root) {
  'use strict';
  const items = [
  {
    "id": "negative-numbers",
    "title": "Как заниматься: Отрицательные числа",
    "file": "using-negative-numbers.mp4",
    "trainerUrl": "https://mathexam.space/trainers/oge-basics/negative-add-subtract.html?practice=1",
    "durationSeconds": 34.866667,
    "bytes": 1081465
  },
  {
    "id": "fractions",
    "title": "Как заниматься: Дроби: общий знаменатель",
    "file": "using-fractions.mp4",
    "trainerUrl": "https://mathexam.space/trainers/oge-basics/fraction-common-denominator.html?practice=1",
    "durationSeconds": 34.533333,
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
    "durationSeconds": 29.066667,
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
    "durationSeconds": 30.166667,
    "bytes": 970051
  },
  {
    "id": "numeric-expressions",
    "title": "Как заниматься: Числовые выражения",
    "file": "using-numeric-expressions.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-calculation-plan",
    "durationSeconds": 33.133333,
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
    "durationSeconds": 33.533333,
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
    "durationSeconds": 34.266667,
    "bytes": 1043769
  },
  {
    "id": "equation-word-problems",
    "title": "Как заниматься: Задача с помощью уравнения",
    "file": "using-equation-word-problems.mp4",
    "trainerUrl": "https://mathexam.space/school/index.html?course=makarychev7-start#lesson/m7f-word-parts",
    "durationSeconds": 33.233333,
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
  },
  {
    "id": "pre7-place-value",
    "title": "Как заниматься: Разряды числа и важные нули",
    "file": "using-pre7-place-value.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-place-value",
    "durationSeconds": 48.2,
    "bytes": 1566860
  },
  {
    "id": "pre7-natural-compare",
    "title": "Как заниматься: Сравниваем натуральные числа",
    "file": "using-pre7-natural-compare.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-natural-compare",
    "durationSeconds": 48.866667,
    "bytes": 1462731
  },
  {
    "id": "pre7-add-carry",
    "title": "Как заниматься: Сложение с переносом разряда",
    "file": "using-pre7-add-carry.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-add-carry",
    "durationSeconds": 48.4,
    "bytes": 1371918
  },
  {
    "id": "pre7-subtract-borrow",
    "title": "Как заниматься: Вычитание с разменом через нули",
    "file": "using-pre7-subtract-borrow.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-subtract-borrow",
    "durationSeconds": 47.433333,
    "bytes": 1352530
  },
  {
    "id": "pre7-smart-calculation",
    "title": "Как заниматься: Считаем удобным способом",
    "file": "using-pre7-smart-calculation.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-smart-calculation",
    "durationSeconds": 45.766667,
    "bytes": 1358150
  },
  {
    "id": "pre7-inverse-components",
    "title": "Как заниматься: Находим неизвестный компонент",
    "file": "using-pre7-inverse-components.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-inverse-components",
    "durationSeconds": 46.2,
    "bytes": 1538031
  },
  {
    "id": "pre7-divisibility",
    "title": "Как заниматься: Признаки делимости: замечаем закономерность",
    "file": "using-pre7-divisibility.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-divisibility",
    "durationSeconds": 46.633333,
    "bytes": 1434839
  },
  {
    "id": "pre7-scale-reading",
    "title": "Как заниматься: Шкала: деления и отметки",
    "file": "using-pre7-scale-reading.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-scale-reading",
    "durationSeconds": 46.766667,
    "bytes": 1518558
  },
  {
    "id": "pre7-comparison-stories",
    "title": "Как заниматься: Задачи: на сколько и во сколько",
    "file": "using-pre7-comparison-stories.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-comparison-stories",
    "durationSeconds": 45.533333,
    "bytes": 1372797
  },
  {
    "id": "pre7-fraction-line",
    "title": "Как заниматься: Дроби на числовом луче",
    "file": "using-pre7-fraction-line.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-fraction-line",
    "durationSeconds": 47.066667,
    "bytes": 1571190
  },
  {
    "id": "pre7-equivalent-fractions",
    "title": "Как заниматься: Равные дроби и сокращение",
    "file": "using-pre7-equivalent-fractions.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-equivalent-fractions",
    "durationSeconds": 46.8,
    "bytes": 1543108
  },
  {
    "id": "pre7-fraction-compare",
    "title": "Как заниматься: Сравниваем обыкновенные дроби",
    "file": "using-pre7-fraction-compare.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-fraction-compare",
    "durationSeconds": 46.766667,
    "bytes": 1410817
  },
  {
    "id": "pre7-fraction-part-whole",
    "title": "Как заниматься: Доля, часть и целое",
    "file": "using-pre7-fraction-part-whole.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-fraction-part-whole",
    "durationSeconds": 46.8,
    "bytes": 1467377
  },
  {
    "id": "pre7-decimal-compare",
    "title": "Как заниматься: Сравниваем десятичные дроби",
    "file": "using-pre7-decimal-compare.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-decimal-compare",
    "durationSeconds": 46.9,
    "bytes": 1364997
  },
  {
    "id": "pre7-mass-capacity",
    "title": "Как заниматься: Масса и вместимость",
    "file": "using-pre7-mass-capacity.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-mass-capacity",
    "durationSeconds": 47.433333,
    "bytes": 1332172
  },
  {
    "id": "pre7-ruler-length",
    "title": "Как заниматься: Измеряем длину по линейке",
    "file": "using-pre7-ruler-length.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-ruler-length",
    "durationSeconds": 46.333333,
    "bytes": 1328069
  },
  {
    "id": "pre7-perimeter",
    "title": "Как заниматься: Периметр: обходим границу",
    "file": "using-pre7-perimeter.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-perimeter",
    "durationSeconds": 46.733333,
    "bytes": 1459794
  },
  {
    "id": "pre7-grid-area",
    "title": "Как заниматься: Площадь по клеткам",
    "file": "using-pre7-grid-area.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=pre7-grid-area",
    "durationSeconds": 46.4,
    "bytes": 1337275
  },
  {
    "id": "grade7-g-core-point-line-ray",
    "title": "Как заниматься: Точка, прямая, луч и отрезок",
    "file": "using-grade7-g-core-point-line-ray.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-point-line-ray",
    "durationSeconds": 48.233333,
    "bytes": 1418610
  },
  {
    "id": "grade7-g-core-perpendicular",
    "title": "Как заниматься: Перпендикулярные прямые",
    "file": "using-grade7-g-core-perpendicular.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-perpendicular",
    "durationSeconds": 53.166667,
    "bytes": 1400988
  },
  {
    "id": "grade7-g-core-angle-measure",
    "title": "Как заниматься: Измеряем угол транспортиром",
    "file": "using-grade7-g-core-angle-measure.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-angle-measure",
    "durationSeconds": 50.7,
    "bytes": 1451927
  },
  {
    "id": "grade7-g-core-triangle-elements",
    "title": "Как заниматься: Стороны, вершины и углы треугольника",
    "file": "using-grade7-g-core-triangle-elements.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-triangle-elements",
    "durationSeconds": 46.5,
    "bytes": 1248015
  },
  {
    "id": "grade7-g-core-triangle-perimeter",
    "title": "Как заниматься: Периметр треугольника",
    "file": "using-grade7-g-core-triangle-perimeter.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-triangle-perimeter",
    "durationSeconds": 46.533333,
    "bytes": 1332923
  },
  {
    "id": "grade7-g-core-sas",
    "title": "Как заниматься: Первый признак равенства: две стороны и угол",
    "file": "using-grade7-g-core-sas.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-sas",
    "durationSeconds": 50.766667,
    "bytes": 1662585
  },
  {
    "id": "grade7-g-core-median",
    "title": "Как заниматься: Медиана треугольника",
    "file": "using-grade7-g-core-median.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-median",
    "durationSeconds": 53.933333,
    "bytes": 1743962
  },
  {
    "id": "grade7-g-core-bisector",
    "title": "Как заниматься: Биссектриса треугольника",
    "file": "using-grade7-g-core-bisector.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-bisector",
    "durationSeconds": 54.8,
    "bytes": 1721357
  },
  {
    "id": "grade7-g-core-altitude",
    "title": "Как заниматься: Высота внутри и вне треугольника",
    "file": "using-grade7-g-core-altitude.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-altitude",
    "durationSeconds": 51.833333,
    "bytes": 1817567
  },
  {
    "id": "grade7-g-core-isosceles-elements",
    "title": "Как заниматься: Равнобедренный треугольник: стороны и основание",
    "file": "using-grade7-g-core-isosceles-elements.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-isosceles-elements",
    "durationSeconds": 46.6,
    "bytes": 1367702
  },
  {
    "id": "grade7-g-core-isosceles-base-angles",
    "title": "Как заниматься: Равные углы при основании",
    "file": "using-grade7-g-core-isosceles-base-angles.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-isosceles-base-angles",
    "durationSeconds": 46.4,
    "bytes": 1413451
  },
  {
    "id": "grade7-g-core-isosceles-vertex-line",
    "title": "Как заниматься: Три свойства линии из вершины",
    "file": "using-grade7-g-core-isosceles-vertex-line.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-core-isosceles-vertex-line",
    "durationSeconds": 51.466667,
    "bytes": 1761209
  },
  {
    "id": "grade7-g-practice-segment-equation",
    "title": "Как заниматься: Отрезки: составь равенство из частей",
    "file": "using-grade7-g-practice-segment-equation.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-segment-equation",
    "durationSeconds": 47.466667,
    "bytes": 1403710
  },
  {
    "id": "grade7-g-practice-angle-parts",
    "title": "Как заниматься: Лучи и биссектрисы: найди нужную часть угла",
    "file": "using-grade7-g-practice-angle-parts.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-angle-parts",
    "durationSeconds": 53.5,
    "bytes": 1696533
  },
  {
    "id": "grade7-g-practice-vertical-proof",
    "title": "Как заниматься: Почему вертикальные углы равны",
    "file": "using-grade7-g-practice-vertical-proof.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-vertical-proof",
    "durationSeconds": 49.233333,
    "bytes": 1447918
  },
  {
    "id": "grade7-g-practice-sas-common-side",
    "title": "Как заниматься: Первый признак: найди общую сторону",
    "file": "using-grade7-g-practice-sas-common-side.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-sas-common-side",
    "durationSeconds": 52.8,
    "bytes": 1734721
  },
  {
    "id": "grade7-g-practice-sas-vertical",
    "title": "Как заниматься: Первый признак в пересекающихся отрезках",
    "file": "using-grade7-g-practice-sas-vertical.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-sas-vertical",
    "durationSeconds": 51.6,
    "bytes": 1638530
  },
  {
    "id": "grade7-g-practice-cevian-reason",
    "title": "Как заниматься: Медиана, биссектриса или высота: что доказано?",
    "file": "using-grade7-g-practice-cevian-reason.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-cevian-reason",
    "durationSeconds": 51.166667,
    "bytes": 1741460
  },
  {
    "id": "grade7-g-practice-isosceles-perimeter",
    "title": "Как заниматься: Равнобедренный треугольник: периметр и неизвестная сторона",
    "file": "using-grade7-g-practice-isosceles-perimeter.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-isosceles-perimeter",
    "durationSeconds": 45.4,
    "bytes": 1456716
  },
  {
    "id": "grade7-g-practice-isosceles-proof",
    "title": "Как заниматься: Собери доказательство свойства равнобедренного треугольника",
    "file": "using-grade7-g-practice-isosceles-proof.mp4",
    "trainerUrl": "https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=grade7-g-practice-isosceles-proof",
    "durationSeconds": 50.233333,
    "bytes": 1764716
  }
];
  const byId = Object.create(null);
  for (const item of items) byId[item.id] = Object.freeze(item);
  const api = Object.freeze({ revision: 'pre7-20261006', items: Object.freeze(items), get: id => typeof id === 'string' ? byId[id] || null : null });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MathExamTutorials = api;
})(typeof window === 'undefined' ? globalThis : window);
