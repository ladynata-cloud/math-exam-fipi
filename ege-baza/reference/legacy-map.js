/* Explicit reference links for the existing fixed EGE tasks and two modules.
   No checking-phase tasks are mapped: references belong to learning only. */
(function (root) {
 'use strict';
 const taskSheets = {}, skillSheets = {}, pins = [];
 const tasks = [
  ["p1a", "Упаковки плитки", ["rounding"]],
  ["p1b", "Стоимость покупки и сдача", ["arithmetic"]],
  ["p1c", "Количество рейсов", ["rounding"]],
  ["p2a", "Оценка размеров", ["units"]],
  ["p2b", "Единицы времени", ["units"]],
  ["p2c", "Сравнение величин", ["units"]],
  ["p3a", "Максимум на диаграмме", ["graphs"]],
  ["p3b", "Минимум температуры", ["graphs"]],
  ["p3c", "Итоговое место команды", ["tables-choice"]],
  ["p4a", "Кинетическая энергия", ["formula", "powers-roots"]],
  ["p4b", "Формула площади трапеции", ["formula", "areas"]],
  ["p4c", "Перевод температуры", ["formula", "decimals"]],
  ["p5a", "Исправный товар", ["probability"]],
  ["p5b", "Жеребьёвка", ["probability"]],
  ["p5c", "Выбор автомобиля", ["probability"]],
  ["p6a", "Покупка с доставкой", ["tables-choice"]],
  ["p6b", "Ограничения ручной клади", ["tables-choice"]],
  ["p6c", "Аренда и топливо", ["tables-choice", "ratio"]],
  ["p7a", "Давление по периодам", ["graphs"]],
  ["p7b", "Изменение температуры", ["graphs"]],
  ["p8a", "Сравнение возраста", ["logic-sets"]],
  ["p8b", "Сравнение этажности", ["logic-sets"]],
  ["p8c", "Сравнение цен", ["logic-sets"]],
  ["p9a", "Площадь по клеткам", ["areas"]],
  ["p9b", "Треугольник на сетке", ["areas", "triangle"]],
  ["p9c", "Разбиение площади", ["areas"]],
  ["p10a", "Участок без постройки", ["areas"]],
  ["p10b", "Спицы колеса", ["circle"]],
  ["p10c", "Периметр и забор", ["areas"]],
  ["p11a", "Вытеснение воды", ["volume"]],
  ["p11b", "Поверхность тела", ["surface"]],
  ["p11c", "Переливание воды", ["volume", "ratio"]],
  ["p12a", "Медиана равнобедренного треугольника", ["triangle"]],
  ["p12b", "Треугольник на диаметре", ["circle", "triangle"]],
  ["p12c", "Косинус острого угла", ["trig", "triangle"]],
  ["p12d", "Площадь равнобедренного треугольника", ["triangle", "areas"]],
  ["p13a", "Боковая поверхность конусов", ["surface", "ratio"]],
  ["p13b", "Боковая поверхность пирамиды", ["surface", "triangle"]],
  ["p13c", "Параллельное сечение конуса", ["similarity", "volume"]],
  ["p14a", "Десятичные дроби и порядок действий", ["decimals", "arithmetic"]],
  ["p14b", "Деление на десятичную дробь", ["decimals"]],
  ["p14c", "Выражение с обыкновенными дробями", ["fractions", "arithmetic"]],
  ["p14d", "Обыкновенная и десятичная дроби", ["fractions", "decimals"]],
  ["p15a", "Повышение цены", ["percent-change"]],
  ["p15b", "Скидка", ["percent-change"]],
  ["p15c", "Деление в отношении", ["ratio"]],
  ["p15d", "Зарплата после налога", ["percent-change"]],
  ["p16a", "Произведение корней", ["powers-roots"]],
  ["p16b", "Синус и полный оборот", ["trig"]],
  ["p16c", "Разность квадратов", ["identities-domain", "powers-roots"]],
  ["p16d", "Логарифм степени", ["logarithm", "powers-roots"]],
  ["p17a", "Показательное уравнение", ["equations", "powers-roots"]],
  ["p17b", "Логарифмическое уравнение", ["equations", "logarithm"]],
  ["p17c", "Квадратное уравнение", ["equations"]],
  ["p17d", "Уравнение с корнем", ["equations", "powers-roots"]],
  ["p18a", "Корни и логарифмы на оси", ["inequality-line", "powers-roots", "logarithm"]],
  ["p18b", "Выражения с корнем на оси", ["inequality-line", "powers-roots"]],
  ["p19a", "Делимость на 15", ["divisibility"]],
  ["p19b", "Вычёркивание цифр", ["divisibility"]],
  ["p19c", "Делимость и произведение цифр", ["divisibility"]],
  ["p20a", "Встреча после разворота", ["motion"]],
  ["p20b", "Разбавление раствора", ["mixtures", "percent"]],
  ["p20c", "Средняя скорость", ["motion"]],
  ["p20d", "Движение навстречу", ["motion"]],
  ["p21a", "Баллы викторины", ["reasoning", "equations"]],
  ["p21b", "Периметры четырёх прямоугольников", ["reasoning", "areas"]],
  ["p21c", "Два пути по кольцу", ["reasoning", "motion"]],
  ["p21d", "Суммы строк и столбцов", ["reasoning"]]
 ];
 for (const [id, title, sheetIds] of tasks) {
  taskSheets[id] = sheetIds;
  pins.push({ id: 'legacy-' + id, title: 'Задание ' + id.match(/^p(\d+)/)[1] + ' · ' + title, href: '../../trainers/ege-baza/index.html#task=' + id, sheetIds });
 }
 const skills = [
  ["m01", "decimal", "Числа без путаницы", ["decimals", "fractions"]],
  ["m01", "division", "Деление с запятой", ["decimals"]],
  ["m01", "rounding", "Количество и единицы", ["rounding", "units"]],
  ["m01", "percent", "Часть и целое", ["percent", "fractions"]],
  ["m01", "change", "Цена меняется", ["percent-change"]],
  ["m01", "choice", "Выбираем с расчётом", ["tables-choice", "decimals", "ratio", "arithmetic"]],
  ["m02", "data", "Таблицы и диаграммы", ["graphs", "tables-choice"]],
  ["m02", "probability", "Вероятность", ["probability"]],
  ["m02", "graphs", "График рассказывает", ["graphs"]],
  ["m02", "logic", "Что следует из условия", ["logic-sets"]]
 ];
 // A skill can contain different kinds of tasks: choose rules for the exact
 // condition rather than inheriting every sheet from the skill's overview.
 const practiceSheets = {
  'decimal-practice-1': ['fractions', 'decimals'],
  'decimal-practice-2': ['decimals'],
  'decimal-practice-3': ['decimals'],
  'decimal-practice-4': ['decimals'],
  'division-practice-1': ['decimals'],
  'division-practice-2': ['decimals'],
  'division-practice-3': ['decimals'],
  'division-practice-4': ['decimals'],
  'rounding-practice-1': ['rounding', 'decimals'],
  'rounding-practice-2': ['rounding'],
  'rounding-practice-3': ['units', 'decimals'],
  'rounding-practice-4': ['units', 'decimals'],
  'percent-practice-1': ['percent'],
  'percent-practice-2': ['percent'],
  'percent-practice-3': ['percent'],
  'percent-practice-4': ['fractions'],
  'change-practice-1': ['percent-change'],
  'change-practice-2': ['percent-change'],
  'change-practice-3': ['percent-change'],
  'change-practice-4': ['percent-change'],
  'choice-practice-1': ['tables-choice'],
  'choice-practice-2': ['tables-choice'],
  'choice-practice-3': ['decimals', 'ratio'],
  'choice-practice-4': ['arithmetic'],
  'data-practice-1': ['tables-choice'],
  'data-practice-2': ['tables-choice', 'arithmetic'],
  'data-practice-3': ['graphs', 'arithmetic'],
  'data-practice-4': ['tables-choice', 'arithmetic'],
  'probability-practice-1': ['probability'],
  'probability-practice-2': ['probability'],
  'probability-practice-3': ['probability'],
  'probability-practice-4': ['probability', 'divisibility'],
  'graphs-practice-1': ['graphs'],
  'graphs-practice-2': ['graphs', 'arithmetic'],
  'graphs-practice-3': ['graphs'],
  'graphs-practice-4': ['graphs'],
  'logic-practice-1': ['logic-sets'],
  'logic-practice-2': ['logic-sets'],
  'logic-practice-3': ['logic-sets', 'divisibility'],
  'logic-practice-4': ['logic-sets', 'arithmetic']
 };
 for (const [moduleId, id, title, sheetIds] of skills) {
  const directory = moduleId === 'm01' ? 'course' : 'data-course';
  const href = '../../trainers/ege-baza/' + directory + '/index.html';
  skillSheets[moduleId + '-' + id] = sheetIds;
  pins.push({ id: 'legacy-' + moduleId + '-' + id, title, href: href + '#learn-' + id, sheetIds });
  for (let index = 0; index < 4; index++) {
   const taskId = id + '-practice-' + (index + 1);
   const taskSheetIds = practiceSheets[taskId];
   taskSheets[taskId] = taskSheetIds;
   pins.push({ id: 'legacy-' + moduleId + '-' + taskId, title: title + ' · практика ' + (index + 1), href: href + '#practice-' + id + '-' + index, sheetIds: taskSheetIds });
  }
 }
 root.EgeReferenceLegacy = { taskSheets, skillSheets, pins };
 if (typeof module !== 'undefined') module.exports = root.EgeReferenceLegacy;
})(typeof window === 'undefined' ? globalThis : window);
