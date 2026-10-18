/* Navigation-only snapshot of the course metadata. No tasks or answers.
 * Keep in sync with division-course-core.js; the route gate verifies parity. */
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
root.DivisionCourse=Object.freeze({stages,has,stageFor});
})(typeof globalThis==='undefined'?this:globalThis);
