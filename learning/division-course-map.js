/* Navigation-only metadata. No tasks or answers.
 * Legacy stages stay in sync with division-course-core.js; tracks only arrange navigation. */
(function(root){
'use strict';
const rows=[
  {
    "id": "multiplication-division/course-multiply-bridge",
    "slug": "multiply-bridge",
    "title": "Умножение помогает делить",
    "goal": "Узнать, какую цифру умножили.",
    "action": "Умножь, затем найди эту цифру при делении.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 1,
    "prerequisite": null
  },
  {
    "id": "multiplication-division/course-digit-choice",
    "slug": "digit-choice",
    "title": "Подбираем одну цифру",
    "goal": "Выбрать цифру от 0 до 9.",
    "action": "Умножь цифру и проверь следующую.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 2,
    "prerequisite": "multiplication-division/course-multiply-bridge"
  },
  {
    "id": "multiplication-division/course-multiply-two-digit",
    "slug": "multiply-two-digit",
    "title": "Умножаем на число из двух цифр",
    "goal": "Посчитать, например, 4 × 23.",
    "action": "Умножь на 20, затем на 3 и сложи.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 3,
    "prerequisite": "multiplication-division/course-digit-choice"
  },
  {
    "id": "multiplication-division/course-subtract",
    "slug": "subtract",
    "title": "Вычитаем по порядку",
    "goal": "Уверенно выполнить вычитание.",
    "action": "Сначала справа, затем слева.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 4,
    "prerequisite": "multiplication-division/course-multiply-two-digit"
  },
  {
    "id": "multiplication-division/course-first-part",
    "slug": "first-part",
    "title": "С каких цифр начать",
    "goal": "Выбрать первое число слева.",
    "action": "Если первой цифры мало, возьми ещё одну справа.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 5,
    "prerequisite": "multiplication-division/course-subtract"
  },
  {
    "id": "multiplication-division/course-bring-digit",
    "slug": "bring-digit",
    "title": "Переносим следующую цифру",
    "goal": "Продолжить запись после вычитания.",
    "action": "Перенеси ровно одну цифру и прочитай новое число.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 6,
    "prerequisite": "multiplication-division/course-first-part"
  },
  {
    "id": "multiplication-division/course-whole-simple",
    "slug": "whole-simple",
    "title": "Собираем всё деление",
    "goal": "Пройти весь уголок с небольшим числом справа.",
    "action": "Выбери цифру, умножь, вычти, перенеси следующую.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 7,
    "prerequisite": "multiplication-division/course-bring-digit"
  },
  {
    "id": "multiplication-division/course-simple-check",
    "slug": "simple-check",
    "title": "Проверяем себя: простое деление",
    "goal": "Решить три новых примера самостоятельно.",
    "action": "Реши в тетради и запиши ответы.",
    "guidance": "check",
    "support": "Самостоятельная проверка",
    "order": 8,
    "prerequisite": "multiplication-division/course-whole-simple"
  },
  {
    "id": "multiplication-division/course-estimate",
    "slug": "estimate",
    "title": "Округляем и прикидываем",
    "goal": "Начать подбор цифры с прикидки.",
    "action": "Округли, прикинь, проверь и поправь цифру.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 9,
    "prerequisite": "multiplication-division/course-simple-check"
  },
  {
    "id": "multiplication-division/course-whole-two-digit",
    "slug": "whole-two-digit",
    "title": "Делим на число из двух цифр",
    "goal": "Применить прикидку внутри уголка.",
    "action": "На каждом шаге проверь выбранную цифру умножением.",
    "guidance": "practice",
    "support": "Практика по шагам",
    "order": 10,
    "prerequisite": "multiplication-division/course-estimate"
  },
  {
    "id": "multiplication-division/course-zeros",
    "slug": "zeros",
    "title": "Не пропускаем ноль",
    "goal": "Сохранить ноль внутри ответа.",
    "action": "Если после переноса число мало, запиши 0.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 11,
    "prerequisite": "multiplication-division/course-whole-two-digit"
  },
  {
    "id": "multiplication-division/course-remainder",
    "slug": "remainder",
    "title": "Что осталось после деления",
    "goal": "Отдельно записать то, что осталось.",
    "action": "Проверь: осталось меньше числа справа.",
    "guidance": "practice",
    "support": "Практика по шагам",
    "order": 12,
    "prerequisite": "multiplication-division/course-zeros"
  },
  {
    "id": "multiplication-division/course-decimal-natural",
    "slug": "decimal-natural",
    "title": "Запятая в ответе",
    "goal": "Делить число с запятой на целое число.",
    "action": "Перешёл через запятую слева — поставь её в ответе.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 13,
    "prerequisite": "multiplication-division/course-remainder"
  },
  {
    "id": "multiplication-division/course-append-zeros",
    "slug": "append-zeros",
    "title": "Продолжаем после запятой",
    "goal": "Закончить деление, дописывая нули.",
    "action": "Осталось число — допиши 0 и продолжай.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 14,
    "prerequisite": "multiplication-division/course-decimal-natural"
  },
  {
    "id": "multiplication-division/course-decimal-divisor",
    "slug": "decimal-divisor",
    "title": "Убираем запятую справа",
    "goal": "Подготовить деление, когда справа есть запятая.",
    "action": "Перенеси запятую в обоих числах одинаково.",
    "guidance": "supported",
    "support": "Подробная помощь",
    "order": 15,
    "prerequisite": "multiplication-division/course-append-zeros"
  },
  {
    "id": "multiplication-division/course-mixed-guided",
    "slug": "mixed-guided",
    "title": "Три вида деления по шагам",
    "goal": "Выбрать нужные действия в разных примерах.",
    "action": "Пройди три разных уголка.",
    "guidance": "practice",
    "support": "Практика по шагам",
    "order": 16,
    "prerequisite": "multiplication-division/course-decimal-divisor"
  },
  {
    "id": "multiplication-division/course-independent-check",
    "slug": "independent-check",
    "title": "Делим самостоятельно",
    "goal": "Решить три новых разных примера.",
    "action": "Выполни уголки в тетради. Здесь введи только ответы.",
    "guidance": "check",
    "support": "Самостоятельная проверка",
    "order": 17,
    "prerequisite": "multiplication-division/course-mixed-guided"
  }
];
const stages=Object.freeze(rows.map(stage=>Object.freeze(stage)));
const byId=new Map(stages.map(stage=>[stage.id,stage]));
const has=id=>byId.has(id);
function stageFor(id){if(!has(id))throw Error('Неизвестная ступень курса деления.');return byId.get(id);}
function navigationStage(slug,title,goal,action){
 return Object.freeze({id:'multiplication-division/'+slug,slug,title,goal,action,guidance:'supported',support:'Объяснение и упражнения'});
}
const multiplication=Object.freeze([
 navigationStage('multiplication-meaning','Что значит умножить','Увидеть, как складывают одинаковые числа.','Посмотри на рисунок и посчитай.'),
 navigationStage('multiplication-pythagoras-table','Находим ответ в таблице','Найти ответ там, где встречаются строка и столбец.','Выбери два числа и найди ответ.'),
 navigationStage('multiplication-tricks','Как вспомнить ответ','Восстановить ответ, если забыл таблицу.','Начни со знакомого примера.'),
 navigationStage('multiplication-ladder','Учим одну таблицу за раз','Потренироваться умножать на одно число.','Решай по одному примеру.'),
 navigationStage('multiplication-mixed','Таблица вперемешку','Умножать числа от 1 до 9 в разном порядке.','Реши новые примеры.'),
 stageFor('multiplication-division/course-multiply-two-digit'),
 navigationStage('course-column-one-digit','Умножаем столбиком на одну цифру','Например, 24 × 3.','Начни справа. Записывай ответ по одной цифре.'),
 navigationStage('course-column-three-by-one','Три цифры умножаем на одну','Например, 324 × 7.','Считай справа налево. Прибавляй число, которое в уме.'),
 navigationStage('course-column-four-by-one','Четыре цифры умножаем на одну','Например, 2307 × 6.','Пройди все четыре цифры справа налево.'),
 navigationStage('course-column-two-digit','Умножаем столбиком на число из двух цифр','Например, 24 × 13.','Запиши две строки и сложи их.'),
 navigationStage('course-column-three-by-two','Три цифры умножаем на две','Например, 324 × 27.','Получи две строки. Вторую начни на одну клетку левее.'),
 navigationStage('course-column-two-by-three','Две цифры умножаем на три','Например, 24 × 136.','Получи три строки. Каждую следующую начни левее.'),
 navigationStage('course-column-three-by-three','Три цифры умножаем на три','Например, 324 × 267.','Умножь на каждую цифру. Затем сложи три строки.'),
 navigationStage('course-column-zeros','Нули внутри и в конце чисел','Например, 305 × 204 или 240 × 30.','Сохраняй место каждого нуля.'),
 navigationStage('course-column-mixed','Разные столбики вперемешку','Числа разной длины, с нулями и без нулей.','Считай по одной цифре.'),
 stageFor('multiplication-division/course-multiply-bridge')
]);
const division=Object.freeze(stages.filter(stage=>!['multiply-bridge','multiply-two-digit'].includes(stage.slug)));
const supplementGroups=Object.freeze([
 {id:"table-mental",title:"Таблица умножения и устный счёт",lead:"Повторить таблицу, найти неизвестное число и посчитать удобным способом.",items:[
  {"id":"oge-basics:multiplication-division","title":"Умножение и деление: одна семья действий","managedId":"oge-basics:multiplication-division","trainerId":"oge-basics","contentId":"multiplication-division","publicUrl":"/trainers/oge-basics/multiplication-division.html","goal":"","aliases":[]},
  {"id":"oge-basics:multiplication-division/tabular-division","title":"Табличное деление: умножение наоборот","managedId":"oge-basics:multiplication-division/tabular-division","trainerId":"oge-basics","contentId":"multiplication-division/tabular-division","publicUrl":"/trainers/oge-basics/multiplication-division/tabular-division.html","goal":"","aliases":[]},
  {"id":"path:pre7-smart-calculation","title":"Считаем удобным способом","managedId":"path:pre7-smart-calculation","trainerId":"ege-path","contentId":"pre7-smart-calculation","publicUrl":"/ege-baza/path/index.html#lesson=pre7-smart-calculation","goal":"","aliases":[]},
  {"id":"path:pre7-inverse-components","title":"Находим неизвестный компонент","managedId":"path:pre7-inverse-components","trainerId":"ege-path","contentId":"pre7-inverse-components","publicUrl":"/ege-baza/path/index.html#lesson=pre7-inverse-components","goal":"","aliases":[]},
  {"id":"arithmetic:t2a","title":"Наглядно: ряды точек","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=t2a","goal":"","aliases":[]},
  {"id":"arithmetic:t2b","title":"Лесенкой: таблица на одно число","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=t2b","goal":"","aliases":[]},
  {"id":"arithmetic:t2c","title":"Заполняем таблицу Пифагора","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=t2c","goal":"","aliases":[]},
  {"id":"arithmetic:n2d","title":"Вперемешку: проверь себя","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=n2d","goal":"","aliases":[]},
  {"id":"arithmetic:t2e","title":"Найди множитель","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=t2e","goal":"","aliases":[]},
  {"id":"arithmetic:n2e","title":"Табличное деление","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=n2e","goal":"","aliases":[]},
  {"id":"public:lift","title":"Таблица умножения — «Лифт»","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/multiplication-table/elevator-sprint.html","goal":"Дополнительная тренировка с таймером.","aliases":[]},
  {"id":"public:equations-multiply","title":"Неизвестный множитель","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/equations/index.html#multiply","goal":"","aliases":[]},
  {"id":"soviet:groups","title":"Одинаковые группы","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#groups","goal":"","aliases":[]},
  {"id":"soviet:times-table","title":"Таблица умножения","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#times-table","goal":"","aliases":[]},
  {"id":"soviet:multiply-by-ten-hundred","title":"Умножение на 10 и 100","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#multiply-by-ten-hundred","goal":"","aliases":[]},
  {"id":"soviet:zero-actions","title":"Действия с нулём","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#zero-actions","goal":"","aliases":[]},
  {"id":"school:multiply","title":"Умножение: группы и распределение","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/multiply","goal":"","aliases":[]},
  {"id":"school:v5f-natural-multiply","title":"Умножение как одинаковые группы","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-natural-multiply","goal":"","aliases":[]},
  {"id":"school:distribute","title":"Распределительное свойство","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/distribute","goal":"","aliases":[]},
  {"id":"school:v6f-distribute-add","title":"Раскрываем скобки при сложении","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-distribute-add","goal":"","aliases":[{"id":"school:v5f-distribute-add","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-distribute-add"}]},
  {"id":"school:v6f-distribute-sub","title":"Раскрываем скобки при вычитании","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-distribute-sub","goal":"","aliases":[{"id":"school:v5f-distribute-sub","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-distribute-sub"}]},
  {"id":"school:v6f-distribute-factor","title":"Выносим общий множитель","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-distribute-factor","goal":"","aliases":[{"id":"school:v5f-distribute-factor","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-distribute-factor"}]},
  {"id":"school:v6f-distribute-fractions","title":"Удобный счёт с дробями","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-distribute-fractions","goal":"","aliases":[]},
  {"id":"school:v6f-properties-product","title":"Удобное произведение","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-properties-product","goal":"","aliases":[]},
  {"id":"school:v6f-fraction-unknown","title":"Неизвестное в дробном умножении и делении","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-unknown","goal":"","aliases":[]}
 ]},
 {id:"column",title:"Умножение столбиком",lead:"Потренироваться в других упражнениях на умножение столбиком.",items:[
  {"id":"oge-basics:multiplication-division/column-multiplication-one-digit","title":"Умножение столбиком на одну цифру — по разрядам","managedId":"oge-basics:multiplication-division/column-multiplication-one-digit","trainerId":"oge-basics","contentId":"multiplication-division/column-multiplication-one-digit","publicUrl":"/trainers/oge-basics/multiplication-division/column-multiplication-one-digit.html","goal":"Реши столбик в тетради и введи ответ.","aliases":[]},
  {"id":"oge-basics:multiplication-division/column-multiplication-two-digit","title":"Умножение столбиком на двузначное число — два произведения","managedId":"oge-basics:multiplication-division/column-multiplication-two-digit","trainerId":"oge-basics","contentId":"multiplication-division/column-multiplication-two-digit","publicUrl":"/trainers/oge-basics/multiplication-division/column-multiplication-two-digit.html","goal":"Реши столбик в тетради и введи ответ.","aliases":[]},
  {"id":"arithmetic:n3c","title":"Умножение столбиком на одну цифру","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=n3c","goal":"","aliases":[]},
  {"id":"arithmetic:n4b","title":"Умножение на двузначное число","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=n4b","goal":"","aliases":[]},
  {"id":"public:long-multiplication-legacy","title":"Умножение столбиком — ОГЭ-режим","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/trainers/long-multiplication.html","goal":"","aliases":[]},
  {"id":"soviet:column-multiply","title":"Умножение столбиком","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#column-multiply","goal":"","aliases":[]},
  {"id":"school:v5f-multiply-column","title":"Умножаем многозначное число","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-multiply-column","goal":"","aliases":[]}
 ]},
 {id:"decimals",title:"Умножение десятичных дробей",lead:"Умножать числа с запятой и правильно записывать ответ.",items:[
  {"id":"path:practice-decimals","title":"Десятичные дроби: умножение и сложение","managedId":"path:practice-decimals","trainerId":"ege-path","contentId":"practice-decimals","publicUrl":"/ege-baza/path/index.html#lesson=practice-decimals","goal":"","aliases":[]},
  {"id":"arithmetic:n5c","title":"Умножение десятичных: счёт знаков","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/arifmetika.html?course=preoge&level=n5c","goal":"","aliases":[]},
  {"id":"public:decimal-level1","title":"Десятичные дроби — уровень 1","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/desyatichnye-drobi-level-1.html","goal":"","aliases":[]},
  {"id":"soviet:decimal-multiply","title":"Умножение десятичных дробей","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#decimal-multiply","goal":"","aliases":[]},
  {"id":"soviet:decimal-multiply-ten","title":"Умножение на 10, 100 и 1000","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#decimal-multiply-ten","goal":"","aliases":[]},
  {"id":"school:decimalmul","title":"Умножение десятичных дробей","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/decimalmul","goal":"","aliases":[]},
  {"id":"school:v5f-decimal-times-int","title":"Несколько одинаковых десятичных порций","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-decimal-times-int","goal":"","aliases":[]},
  {"id":"school:v5f-decimal-times-ten","title":"Увеличиваем в 10, 100, 1000 раз","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-decimal-times-ten","goal":"","aliases":[]},
  {"id":"school:v5f-decimal-multiply","title":"Произведение десятых даёт сотые","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-decimal-multiply","goal":"","aliases":[]},
  {"id":"school:v5f-decimal-small-product","title":"Умножаем на число меньше единицы","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-decimal-small-product","goal":"","aliases":[]}
 ]},
 {id:"fractions",title:"Умножение обыкновенных дробей",lead:"Умножать обычные дроби, смешанные числа и находить часть числа.",items:[
  {"id":"path:grade7-b-fraction-product-cancel","title":"Умножение дробей: сокращаем множители","managedId":"path:grade7-b-fraction-product-cancel","trainerId":"ege-path","contentId":"grade7-b-fraction-product-cancel","publicUrl":"/ege-baza/path/index.html#lesson=grade7-b-fraction-product-cancel","goal":"","aliases":[]},
  {"id":"public:fractions-oge-practice","title":"Дроби: учимся и тренируемся","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/drobi-oge-trainer.html","goal":"","aliases":[]},
  {"id":"public:fraction-part-whole","title":"Дроби: часть и целое","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/fractions-part-whole-assignment.html","goal":"","aliases":[]},
  {"id":"soviet:fraction-multiply","title":"Умножение дробей","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#fraction-multiply","goal":"","aliases":[]},
  {"id":"soviet:fraction-of-number","title":"Найти дробь от числа","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#fraction-of-number","goal":"","aliases":[]},
  {"id":"school:fractionmul","title":"Доля от доли","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/fractionmul","goal":"","aliases":[]},
  {"id":"school:v6-12","title":"12. Умножение смешанных чисел","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6-12","goal":"","aliases":[]},
  {"id":"school:v6f-fraction-times-int","title":"Умножаем дробь на натуральное число","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-times-int","goal":"","aliases":[{"id":"school:v5f-fraction-times-int","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-fraction-times-int"}]},
  {"id":"school:v6f-fraction-multiply","title":"Доля от доли: умножение дробей","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-multiply","goal":"","aliases":[{"id":"school:v5f-fraction-multiply","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-fraction-multiply"}]},
  {"id":"school:v6f-fraction-cancel","title":"Сокращаем до умножения","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-cancel","goal":"","aliases":[{"id":"school:v5f-fraction-cancel","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-fraction-cancel"}]},
  {"id":"school:v6f-mixed-multiply","title":"Умножение смешанных чисел","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-mixed-multiply","goal":"","aliases":[{"id":"school:v5f-mixed-multiply","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-mixed-multiply"}]},
  {"id":"school:v6f-fraction-area","title":"Площадь с дробными длинами","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-area","goal":"","aliases":[{"id":"school:v5f-fraction-area","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-fraction-area"}]},
  {"id":"school:v6f-fraction-part","title":"Находим дробь от количества","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-part","goal":"","aliases":[{"id":"school:v5f-fraction-part","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-fraction-part"}]},
  {"id":"school:v6f-fraction-of-remainder","title":"Доля от остатка: целое поменялось","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-of-remainder","goal":"","aliases":[{"id":"school:v5f-fraction-of-remainder","title":"Другой разбор: 5 класс","publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-fraction-of-remainder"}]}
 ]},
 {id:"further",title:"Дальнейшая практика и алгебра",lead:"Применить умножение в выражениях, задачах и алгебре.",items:[
  {"id":"oge-basics:order-of-operations","title":"Порядок действий без путаницы","managedId":"oge-basics:order-of-operations","trainerId":"oge-basics","contentId":"order-of-operations","publicUrl":"/trainers/oge-basics/order-of-operations.html","goal":"","aliases":[]},
  {"id":"path:practice-fraction-expression","title":"Порядок действий с дробями","managedId":"path:practice-fraction-expression","trainerId":"ege-path","contentId":"practice-fraction-expression","publicUrl":"/ege-baza/path/index.html#lesson=practice-fraction-expression","goal":"","aliases":[]},
  {"id":"path:fractions","title":"Дроби в одном выражении","managedId":"path:fractions","trainerId":"ege-path","contentId":"fractions","publicUrl":"/ege-baza/path/index.html#lesson=fractions","goal":"","aliases":[]},
  {"id":"public:fractions-task6-bank","title":"ОГЭ №6: действия с дробями","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/oge-task6-fractions.html","goal":"","aliases":[]},
  {"id":"public:formulas-long","title":"Формулы сокращённого умножения — линейка","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/formuly-sokrashchennogo-umnozheniya.html","goal":"","aliases":[]},
  {"id":"public:formulas-short","title":"Формулы сокращённого умножения — короткий тренажёр","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/trainers/formuly-sokrashchennogo-umnozheniya-trainer.html","goal":"","aliases":[]},
  {"id":"soviet:order","title":"Порядок действий","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/soviet-math/index.html#order","goal":"","aliases":[]},
  {"id":"school:signedmul","title":"Умножение чисел с разными знаками","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/signedmul","goal":"","aliases":[]},
  {"id":"school:v6-33","title":"33. Умножение чисел со знаками","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6-33","goal":"","aliases":[]},
  {"id":"school:v6f-multiply-sign","title":"Знак произведения","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-multiply-sign","goal":"","aliases":[]},
  {"id":"school:v6f-multiply-decimal","title":"Произведение десятичных чисел со знаками","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-multiply-decimal","goal":"","aliases":[]},
  {"id":"school:v6f-multiply-fractions","title":"Произведение дробей со знаками","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-multiply-fractions","goal":"","aliases":[]},
  {"id":"school:v6f-multiply-many","title":"Несколько отрицательных множителей и ноль","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-multiply-many","goal":"","aliases":[]},
  {"id":"school:m7f-signed-products","title":"Умножение и деление чисел со знаками","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=makarychev7-start#lesson/m7f-signed-products","goal":"","aliases":[]},
  {"id":"school:v6f-brackets-factor","title":"Множитель перед скобками","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-brackets-factor","goal":"","aliases":[]},
  {"id":"school:v6f-coefficient-product","title":"Находим коэффициент произведения","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-coefficient-product","goal":"","aliases":[]},
  {"id":"school:m7f-common-factor","title":"Общий множитель: собери сумму в произведение","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=makarychev7-start#lesson/m7f-common-factor","goal":"","aliases":[]},
  {"id":"school:order","title":"Скобки и порядок действий","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/order","goal":"","aliases":[]},
  {"id":"school:power","title":"Степень как повторное умножение","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html#lesson/power","goal":"","aliases":[]},
  {"id":"school:v5f-order-equal","title":"Умножение и деление равноправны","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin5#lesson/v5f-order-equal","goal":"","aliases":[]},
  {"id":"school:v6f-fraction-order","title":"Скобки, умножение, деление: сохраняем порядок","managedId":null,"trainerId":null,"contentId":null,"publicUrl":"/school/index.html?course=vilenkin6#lesson/v6f-fraction-order","goal":"","aliases":[]}
 ]}
].map(group=>Object.freeze({...group,items:Object.freeze(group.items.map(item=>Object.freeze({...item,aliases:Object.freeze(item.aliases.map(Object.freeze))})))})));
const tracks=Object.freeze([
 Object.freeze({id:'multiplication',title:'Умножение',lead:'Таблица, устный счёт и все виды умножения столбиком.',stages:multiplication,supplementGroups}),
 Object.freeze({id:'division',title:'Деление уголком',lead:'От подбора одной цифры к целому решению.',stages:division})
]);
const byTrackContent=new Map(tracks.flatMap(track=>track.stages.map(stage=>[stage.id,track])));
function trackFor(id){return byTrackContent.get(String(id||'').replace(/^oge-basics:/,''))||null;}
const api=Object.freeze({stages,has,stageFor,tracks,trackFor});
if(typeof module==='object'&&module.exports)module.exports=api;
else {root.ArithmeticCourse=api;if(!root.DivisionCourse?.make)root.DivisionCourse=api;}
})(typeof globalThis==='undefined'?this:globalThis);
