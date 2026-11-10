/* OGE algebra skill maps: 12 public maps, 72 finite learning nodes, 216 original questions.
 * Native inventory is read from the trainers named in each map, not from legacy registry types.
 * Explain prompts are student-written reasoning; their criteria are not an automatic proof grade.
 * New independent oracle kinds:
 * reduced-numerator: normalize exact rational eval(expr), then compare its integer numerator.
 * quadratic-root: a*x^2+b*x+c=0; other=-b/a-x; selection larger/smaller;
 *   excluded[] forbids listed values, domain.min/max are optional inclusive exact bounds.
 * dice-sum: count ordered pairs 1..sides whose sum equals sum; divide by sides^2.
 * visual-coordinate: find the unique visual.points label and read axis value/x/y.
 * Existing expression/choice-expression, linear, floor-division, square-root semantics are reused.
 * A resource visit or stored written explanation does not by itself establish independent mastery.
 */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.OgeAlgebraSkillMaps=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){'use strict';
return [
  {
    "id": "oge-6",
    "taskNumbers": [
      6
    ],
    "title": "№6. Вычисления с понятным планом",
    "goal": "Переходить от понятной записи числа к целому выражению и требуемому ответу.",
    "transferGoal": "Реши 3 новые карточки из разных блоков исходного тренажёра. Для каждой сохрани порядок действий и проверку ответа.",
    "source": {
      "href": "/trainers/oge-task6-fractions.html",
      "title": "ОГЭ №6 · исходный тренажёр",
      "trainerId": "oge-t6-vychisleniya"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task6-fractions.html",
      "selector": "CATS: кнопки категорий заданий; TASKS[].cat (174 карточки)",
      "types": [
        {
          "id": "bank",
          "title": "банк заданий"
        },
        {
          "id": "dec",
          "title": "Десятичные дроби"
        },
        {
          "id": "frac",
          "title": "Обыкновенные дроби"
        },
        {
          "id": "combo",
          "title": "Комбинированные"
        },
        {
          "id": "progon",
          "title": "Полный прогон"
        },
        {
          "id": "adv",
          "title": "Продвинутый уровень"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-6-decimal",
        "title": "Сначала понятные десятичные",
        "goal": "Разметить запятые и оценить величину результата.",
        "dependsOn": [],
        "foundations": [
          "decimal-place-value",
          "decimal-add-subtract",
          "decimal-multiply"
        ],
        "covers": [
          "dec"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №6",
            "href": "/trainers/oge-task6-fractions.html",
            "instruction": "Открой блок «Десятичные дроби». Перед каждым вычислением прикинь, между какими целыми будет ответ.",
            "finish": "Реши 3 задания и сравни ответы с прикидкой."
          }
        ],
        "explain": {
          "prompt": "Как запятая и прикидка помогают заметить ошибку?",
          "criteria": [
            "Назван разряд каждого числа.",
            "Показано выбранное действие.",
            "Ответ сопоставлен с разумными границами."
          ]
        },
        "misconception": "Переносят запятую без связи со значением числа.",
        "finish": "Реши 3 задания и сравни ответы с прикидкой."
      },
      {
        "id": "oge-6-fraction",
        "title": "Дроби: общие доли и сокращение",
        "goal": "Согласовать доли, вычислить и сократить.",
        "dependsOn": [
          "oge-6-decimal"
        ],
        "foundations": [
          "fraction-equivalent",
          "fraction-common-denominator",
          "fraction-product",
          "fraction-division"
        ],
        "covers": [
          "frac"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №6",
            "href": "/trainers/oge-task6-fractions.html",
            "instruction": "Открой «Обыкновенные дроби». В каждом примере сначала подпиши знаменатели, затем решай.",
            "finish": "Выполни 3 примера: сумму, разность и деление."
          }
        ],
        "explain": {
          "prompt": "Почему знаменатели нельзя просто сложить?",
          "criteria": [
            "Объяснено, какие доли сравниваются.",
            "Найден общий знаменатель или обратная дробь для деления.",
            "Выполнена проверка сокращения."
          ]
        },
        "misconception": "Складывают числители и знаменатели отдельно.",
        "finish": "Выполни 3 примера: сумму, разность и деление."
      },
      {
        "id": "oge-6-order",
        "title": "Собираем смешанное выражение",
        "goal": "Удержать скобки и порядок действий в разных записях.",
        "dependsOn": [
          "oge-6-fraction"
        ],
        "foundations": [
          "fraction-order",
          "operation-order"
        ],
        "covers": [
          "combo"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №6",
            "href": "/trainers/oge-task6-fractions.html",
            "instruction": "В блоке «Комбинированные» пронумеруй действия до вычисления. Меняй запись числа только там, где это упрощает пример.",
            "finish": "Реши 3 выражения с записью промежуточного результата."
          }
        ],
        "explain": {
          "prompt": "Какой шаг здесь первый и почему?",
          "criteria": [
            "Отмечены скобки.",
            "Умножение и деление стоят до сложения и вычитания.",
            "Промежуточные результаты подставлены без потери знаков."
          ]
        },
        "misconception": "Выполняют действия подряд слева направо, не замечая скобок.",
        "finish": "Реши 3 выражения с записью промежуточного результата."
      },
      {
        "id": "oge-6-signed",
        "title": "Знаки в заданиях из банка",
        "goal": "Отделить знак действия от знака числа.",
        "dependsOn": [
          "oge-6-order"
        ],
        "foundations": [
          "signed-subtraction",
          "signed-fractions",
          "signed-multiplication"
        ],
        "covers": [
          "bank"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №6",
            "href": "/trainers/oge-task6-fractions.html",
            "instruction": "Открой «банк заданий». Выбери 3 карточки, в которых встречаются отрицательные числа или вычитание дробей; сначала перепиши знаки.",
            "finish": "Закончи 3 карточки и проверь знак каждого ответа."
          }
        ],
        "explain": {
          "prompt": "Как ты определил знак до окончательного вычисления?",
          "criteria": [
            "Вычитание отрицательного заменено прибавлением.",
            "Для произведения отдельно определён знак.",
            "Для суммы сравниваются модули или общие доли."
          ]
        },
        "misconception": "Минус перед отрицательным числом считают ещё одним отрицательным слагаемым.",
        "finish": "Закончи 3 карточки и проверь знак каждого ответа."
      },
      {
        "id": "oge-6-method",
        "title": "Выбираем способ и замечаем ошибку",
        "goal": "Объяснить, какое преобразование сохраняет значение.",
        "dependsOn": [
          "oge-6-signed"
        ],
        "foundations": [
          "fraction-division",
          "smart-calculation"
        ],
        "covers": [
          "progon"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №6",
            "href": "/trainers/oge-task6-fractions.html",
            "instruction": "В «Полном прогоне» остановись после 3 карточек. Для одной запиши второй способ, для другой объясни возможную ошибку.",
            "finish": "Реши 3 карточки; к одной оставь проверку другим способом."
          }
        ],
        "explain": {
          "prompt": "Что именно неверно в выбранном неправильном способе?",
          "criteria": [
            "Названо действие исходного выражения.",
            "Показано равносильное преобразование.",
            "Ошибочный шаг сопоставлен с правилом, а не только с ответом."
          ]
        },
        "misconception": "При делении переворачивают первую дробь или обе дроби.",
        "finish": "Реши 3 карточки; к одной оставь проверку другим способом."
      },
      {
        "id": "oge-6-numerator",
        "title": "Читаем, что надо записать в ответ",
        "goal": "Отделить значение выражения от требуемого числителя.",
        "dependsOn": [
          "oge-6-method"
        ],
        "foundations": [
          "fraction-equivalent",
          "fraction-order"
        ],
        "covers": [
          "adv"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №6",
            "href": "/trainers/oge-task6-fractions.html",
            "instruction": "Открой «Продвинутый уровень». Подчеркни вопрос; если нужен числитель, сначала получи несократимую дробь.",
            "finish": "Реши 2 карточки на числитель и 1 обычную карточку."
          }
        ],
        "explain": {
          "prompt": "Почему ответом иногда служит число из числителя, а не вся дробь?",
          "criteria": [
            "Выписано значение выражения.",
            "Дробь сокращена до несократимой.",
            "В ответ перенесено именно то, что требует вопрос."
          ]
        },
        "misconception": "Записывают числитель ещё не сокращённой дроби.",
        "finish": "Реши 2 карточки на числитель и 1 обычную карточку."
      }
    ],
    "questions": [
      {
        "id": "oge-6-01",
        "nodeId": "oge-6-decimal",
        "prompt": "Вычисли 1,2 + 0,35.",
        "input": "number",
        "answer": "1.55",
        "hint": "Совмести разряды: 1,2 можно записать как 1,20.",
        "explanation": "1,20 + 0,35 = 1,55.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1.2",
            "0.35"
          ]
        }
      },
      {
        "id": "oge-6-02",
        "nodeId": "oge-6-fraction",
        "prompt": "Вычисли 3/4 + 1/6.",
        "input": "number",
        "answer": "11/12",
        "hint": "Найди одинаковые доли для четвертей и шестых.",
        "explanation": "3/4 = 9/12, 1/6 = 2/12. Сумма равна 11/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "3/4",
            "1/6"
          ]
        }
      },
      {
        "id": "oge-6-03",
        "nodeId": "oge-6-order",
        "prompt": "Вычисли 0,8 + (1,2 − 0,3) · 2.",
        "input": "number",
        "answer": "2.6",
        "hint": "Сначала закончи действие в скобках.",
        "explanation": "1,2 − 0,3 = 0,9; 0,9 · 2 = 1,8; 0,8 + 1,8 = 2,6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "0.8",
            [
              "mul",
              [
                "sub",
                "1.2",
                "0.3"
              ],
              2
            ]
          ]
        }
      },
      {
        "id": "oge-6-04",
        "nodeId": "oge-6-signed",
        "prompt": "Вычисли −2,5 − (−1,75).",
        "input": "number",
        "answer": "-0.75",
        "hint": "Замени вычитание отрицательного числа прибавлением.",
        "explanation": "−2,5 + 1,75 = −0,75.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-2.5",
            "-1.75"
          ]
        }
      },
      {
        "id": "oge-6-05",
        "nodeId": "oge-6-method",
        "prompt": "Какая запись верно заменяет 3/5 : 2/7?",
        "input": "choice",
        "answer": "3/5 · 7/2",
        "choices": [
          "5/3 · 2/7",
          "3/5 · 2/7",
          "3/5 · 7/2"
        ],
        "hint": "При делении на дробь подумай, какую именно дробь нужно заменить обратной.",
        "explanation": "Делитель 2/7 заменяется обратной дробью 7/2: 3/5 : 2/7 = 3/5 · 7/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "3/5",
            "2/7"
          ],
          "values": [
            [
              "mul",
              "5/3",
              "2/7"
            ],
            [
              "mul",
              "3/5",
              "2/7"
            ],
            [
              "mul",
              "3/5",
              "7/2"
            ]
          ]
        }
      },
      {
        "id": "oge-6-06",
        "nodeId": "oge-6-numerator",
        "prompt": "Вычисли 2/3 − 1/4. Запиши числитель несократимой дроби.",
        "input": "number",
        "answer": "5",
        "hint": "Сначала вычисли всё выражение и сократи результат.",
        "explanation": "2/3 − 1/4 = 8/12 − 3/12 = 5/12. Дробь несократима; её числитель — 5.",
        "oracle": {
          "kind": "reduced-numerator",
          "expr": [
            "sub",
            "2/3",
            "1/4"
          ]
        }
      },
      {
        "id": "oge-6-07",
        "nodeId": "oge-6-decimal",
        "prompt": "Вычисли 2,5 − 0,8.",
        "input": "number",
        "answer": "1.7",
        "hint": "Представь обе дроби в десятых.",
        "explanation": "25 десятых − 8 десятых = 17 десятых = 1,7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "2.5",
            "0.8"
          ]
        }
      },
      {
        "id": "oge-6-08",
        "nodeId": "oge-6-fraction",
        "prompt": "Вычисли 5/6 − 1/4.",
        "input": "number",
        "answer": "7/12",
        "hint": "Подбери общий знаменатель, кратный 6 и 4.",
        "explanation": "5/6 = 10/12, 1/4 = 3/12. Разность равна 7/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "5/6",
            "1/4"
          ]
        }
      },
      {
        "id": "oge-6-09",
        "nodeId": "oge-6-order",
        "prompt": "Вычисли (3/4 + 1/8) : 7/8.",
        "input": "number",
        "answer": "1",
        "hint": "Прежде чем делить, найди сумму в скобках.",
        "explanation": "3/4 + 1/8 = 7/8; 7/8 : 7/8 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              "3/4",
              "1/8"
            ],
            "7/8"
          ]
        }
      },
      {
        "id": "oge-6-10",
        "nodeId": "oge-6-signed",
        "prompt": "Вычисли −3/4 + 5/8.",
        "input": "number",
        "answer": "-1/8",
        "hint": "Приведи дроби к одинаковым долям, сохраняя знаки.",
        "explanation": "−3/4 = −6/8; −6/8 + 5/8 = −1/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "-3/4",
            "5/8"
          ]
        }
      },
      {
        "id": "oge-6-11",
        "nodeId": "oge-6-method",
        "prompt": "Как правильно переписать 7/8 : 3/4?",
        "input": "choice",
        "answer": "7/8 · 4/3",
        "choices": [
          "7/8 · 3/4",
          "7/8 · 4/3",
          "8/7 · 3/4"
        ],
        "hint": "Сохрани делимое и замени деление на умножение.",
        "explanation": "Обратная дробь нужна только делителю: 7/8 · 4/3 = 7/6.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "7/8",
            "3/4"
          ],
          "values": [
            [
              "mul",
              "7/8",
              "3/4"
            ],
            [
              "mul",
              "7/8",
              "4/3"
            ],
            [
              "mul",
              "8/7",
              "3/4"
            ]
          ]
        }
      },
      {
        "id": "oge-6-12",
        "nodeId": "oge-6-numerator",
        "prompt": "Вычисли 5/6 − 1/3. Запиши числитель несократимой дроби.",
        "input": "number",
        "answer": "1",
        "hint": "Не останавливайся на общем знаменателе: проверь сокращение.",
        "explanation": "5/6 − 2/6 = 3/6 = 1/2. Числитель несократимой дроби — 1.",
        "oracle": {
          "kind": "reduced-numerator",
          "expr": [
            "sub",
            "5/6",
            "1/3"
          ]
        }
      },
      {
        "id": "oge-6-13",
        "nodeId": "oge-6-decimal",
        "prompt": "Вычисли 0,6 · 0,25.",
        "input": "number",
        "answer": "0.15",
        "hint": "Четверть от числа меньше самого числа.",
        "explanation": "0,25 = 1/4, поэтому 0,6 · 0,25 = 0,6 : 4 = 0,15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "0.6",
            "0.25"
          ]
        }
      },
      {
        "id": "oge-6-14",
        "nodeId": "oge-6-fraction",
        "prompt": "Вычисли 2/5 + 1/3.",
        "input": "number",
        "answer": "11/15",
        "hint": "Найди число долей, подходящее обоим знаменателям.",
        "explanation": "2/5 = 6/15, 1/3 = 5/15. Сумма равна 11/15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "2/5",
            "1/3"
          ]
        }
      },
      {
        "id": "oge-6-15",
        "nodeId": "oge-6-order",
        "prompt": "Вычисли 1,2 − (1/3 + 1/6).",
        "input": "number",
        "answer": "0.7",
        "hint": "Сначала сложи дроби в скобках; затем выбери удобную запись.",
        "explanation": "1/3 + 1/6 = 1/2 = 0,5; 1,2 − 0,5 = 0,7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "1.2",
            [
              "add",
              "1/3",
              "1/6"
            ]
          ]
        }
      },
      {
        "id": "oge-6-16",
        "nodeId": "oge-6-signed",
        "prompt": "Вычисли (−0,6) · (−1,5).",
        "input": "number",
        "answer": "0.9",
        "hint": "Определи знак произведения отдельно от его модуля.",
        "explanation": "Произведение двух отрицательных положительно. 0,6 · 1,5 = 0,9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "-0.6",
            "-1.5"
          ]
        }
      },
      {
        "id": "oge-6-17",
        "nodeId": "oge-6-method",
        "prompt": "Выбери верное преобразование 5/12 : 2/9.",
        "input": "choice",
        "answer": "5/12 · 9/2",
        "choices": [
          "5/12 · 9/2",
          "12/5 · 2/9",
          "5/12 · 2/9"
        ],
        "hint": "Какое число при умножении на делитель даст единицу?",
        "explanation": "Делитель 2/9 имеет обратную дробь 9/2. Получаем 5/12 · 9/2 = 15/8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "5/12",
            "2/9"
          ],
          "values": [
            [
              "mul",
              "5/12",
              "9/2"
            ],
            [
              "mul",
              "12/5",
              "2/9"
            ],
            [
              "mul",
              "5/12",
              "2/9"
            ]
          ]
        }
      },
      {
        "id": "oge-6-18",
        "nodeId": "oge-6-numerator",
        "prompt": "Вычисли 7/10 − 1/4. Запиши числитель несократимой дроби.",
        "input": "number",
        "answer": "9",
        "hint": "Сначала приведи к общему знаменателю, затем проверь общий делитель.",
        "explanation": "7/10 − 1/4 = 14/20 − 5/20 = 9/20. Дробь несократима, числитель — 9.",
        "oracle": {
          "kind": "reduced-numerator",
          "expr": [
            "sub",
            "7/10",
            "1/4"
          ]
        }
      }
    ]
  },
  {
    "id": "oge-7",
    "taskNumbers": [
      7
    ],
    "title": "№7. Числа, точки и разумные границы",
    "goal": "Читать числовую прямую и сравнивать дроби и корни с точными ориентирами.",
    "transferGoal": "Выполни 4 задания: по рисунку, с дробью, с корнем и на соответствие точкам. Для каждого запиши хотя бы одну числовую проверку.",
    "source": {
      "href": "/trainers/oge-task7-number-line.html",
      "title": "ОГЭ №7 · исходный тренажёр",
      "trainerId": "oge-t7-pryamaya"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task7-number-line.html",
      "selector": "#stepGroups и #stepSubs (STEP_GROUPS, кроме mix)",
      "types": [
        {
          "id": "ris/one",
          "title": "По рисунку: утверждения — одно число"
        },
        {
          "id": "ris/two",
          "title": "По рисунку: утверждения — два числа"
        },
        {
          "id": "ris/diff",
          "title": "По рисунку: утверждения — разности"
        },
        {
          "id": "ris/abs",
          "title": "По рисунку: утверждения — модули"
        },
        {
          "id": "frac/betint",
          "title": "Оценка: дроби — между целыми"
        },
        {
          "id": "frac/tenths",
          "title": "Оценка: дроби — до десятых"
        },
        {
          "id": "frac/inrange",
          "title": "Оценка: дроби — какая из дробей в отрезке"
        },
        {
          "id": "root/betint",
          "title": "Оценка: корни — между целыми"
        },
        {
          "id": "root/inrange",
          "title": "Оценка: корни — какой из корней в отрезке"
        },
        {
          "id": "pts/root",
          "title": "Точки и числа — корень"
        },
        {
          "id": "pts/frac",
          "title": "Точки и числа — дробь"
        },
        {
          "id": "pts/dec",
          "title": "Точки и числа — десятичные"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-7-coordinate",
        "title": "Где находится число",
        "goal": "Прочитать ноль, направление и цену деления.",
        "dependsOn": [],
        "foundations": [
          "signed-number-line",
          "data-scales"
        ],
        "covers": [
          "ris/one",
          "pts/dec"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №7",
            "href": "/trainers/oge-task7-number-line.html",
            "instruction": "В «Пошагово» выбери «По рисунку: утверждения → одно число», затем «Точки и числа → десятичные».",
            "finish": "Прочитай координаты 3 точек на разных шкалах."
          }
        ],
        "explain": {
          "prompt": "Как определить координату, если подписаны не все деления?",
          "criteria": [
            "Найден ноль и положительное направление.",
            "Цена деления вычислена по двум подписям.",
            "Посчитаны промежутки от известной точки."
          ]
        },
        "misconception": "Число штрихов путают с числом промежутков.",
        "finish": "Прочитай координаты 3 точек на разных шкалах."
      },
      {
        "id": "oge-7-compare",
        "title": "Сравниваем две точки",
        "goal": "Связать порядок чисел с положением на прямой.",
        "dependsOn": [
          "oge-7-coordinate"
        ],
        "foundations": [
          "decimal-compare",
          "fraction-compare",
          "signed-number-line"
        ],
        "covers": [
          "ris/two"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №7",
            "href": "/trainers/oge-task7-number-line.html",
            "instruction": "Выбери «По рисунку: утверждения → два числа». Перед ответом расположи обе точки относительно нуля.",
            "finish": "Реши 3 сравнения и объясни одно из них словами «левее» и «правее»."
          }
        ],
        "explain": {
          "prompt": "Почему большее по модулю отрицательное число может быть меньше?",
          "criteria": [
            "Указано положение обоих чисел.",
            "Знак сравнения соответствует порядку слева направо.",
            "Модуль отделён от самого числа."
          ]
        },
        "misconception": "Сравнивают отрицательные числа только по цифрам.",
        "finish": "Реши 3 сравнения и объясни одно из них словами «левее» и «правее»."
      },
      {
        "id": "oge-7-difference",
        "title": "Разность и расстояние",
        "goal": "Различать направленную разность и модуль расстояния.",
        "dependsOn": [
          "oge-7-compare"
        ],
        "foundations": [
          "signed-subtraction",
          "signed-opposite-absolute"
        ],
        "covers": [
          "ris/diff",
          "ris/abs"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №7",
            "href": "/trainers/oge-task7-number-line.html",
            "instruction": "В «По рисунку: утверждения» чередуй «разности» и «модули». Для каждого условия нарисуй короткую прямую.",
            "finish": "Реши по 2 задачи каждого подтипа."
          }
        ],
        "explain": {
          "prompt": "Чем a − b отличается от расстояния между a и b?",
          "criteria": [
            "Разность сохраняет знак направления.",
            "Расстояние записано модулем разности.",
            "Проверено, что расстояние неотрицательно."
          ]
        },
        "misconception": "Расстояние записывают отрицательным или всегда убирают знак у разности.",
        "finish": "Реши по 2 задачи каждого подтипа."
      },
      {
        "id": "oge-7-fraction-bounds",
        "title": "Дробь между ориентирами",
        "goal": "Сравнить дробь с целыми числами и десятыми без длинного деления.",
        "dependsOn": [
          "oge-7-compare"
        ],
        "foundations": [
          "fraction-number-line",
          "fraction-compare",
          "decimal-place-value"
        ],
        "covers": [
          "frac/betint",
          "frac/tenths",
          "frac/inrange"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №7",
            "href": "/trainers/oge-task7-number-line.html",
            "instruction": "Выбери «Оценка: дроби». Сделай по одному примеру «между целыми», «до десятых» и «какая из дробей в отрезке».",
            "finish": "Закончи 3 оценки, записав обе границы."
          }
        ],
        "explain": {
          "prompt": "Как проверить две границы дроби умножением?",
          "criteria": [
            "Знаменатель положительный или знак учтён.",
            "Проверены обе границы.",
            "Указана точность: целые или десятые."
          ]
        },
        "misconception": "Проверяют только одну границу и забывают вторую.",
        "finish": "Закончи 3 оценки, записав обе границы."
      },
      {
        "id": "oge-7-root-bounds",
        "title": "Корень между квадратами",
        "goal": "Найти соседние квадраты и проверить попадание в промежуток.",
        "dependsOn": [
          "oge-7-fraction-bounds"
        ],
        "foundations": [
          "expression-powers-roots",
          "natural-compare"
        ],
        "covers": [
          "root/betint",
          "root/inrange"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №7",
            "href": "/trainers/oge-task7-number-line.html",
            "instruction": "Выбери «Оценка: корни». Найди соседние квадраты до выбора ответа.",
            "finish": "Реши 2 задачи «между целыми» и 1 «какой из корней в отрезке»."
          }
        ],
        "explain": {
          "prompt": "Почему сравнение квадратов даёт границы арифметического корня?",
          "criteria": [
            "Все сравниваемые границы неотрицательны.",
            "Названы квадрат нижней и квадрат верхней границы.",
            "Вывод записан в том же порядке."
          ]
        },
        "misconception": "Округляют подкоренное число вместо оценки самого корня.",
        "finish": "Реши 2 задачи «между целыми» и 1 «какой из корней в отрезке»."
      },
      {
        "id": "oge-7-match",
        "title": "Соединяем разные записи и точки",
        "goal": "Узнать одно число в виде дроби, корня или десятичной записи.",
        "dependsOn": [
          "oge-7-root-bounds",
          "oge-7-difference"
        ],
        "foundations": [
          "fraction-number-line",
          "decimal-compare",
          "expression-powers-roots"
        ],
        "covers": [
          "pts/root",
          "pts/frac"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №7",
            "href": "/trainers/oge-task7-number-line.html",
            "instruction": "В «Точки и числа» реши по одному примеру с корнем и дробью, затем ещё один со смешанными ориентирами.",
            "finish": "Соедини числа и точки в 3 заданиях и проверь порядок всех точек."
          }
        ],
        "explain": {
          "prompt": "Как исключить неподходящие точки до точного вычисления?",
          "criteria": [
            "Каждое число ограничено двумя ориентирами.",
            "Проверен порядок значений.",
            "Соответствие обосновано координатами, а не внешним видом записи."
          ]
        },
        "misconception": "Приближённую оценку считают точным равенством.",
        "finish": "Соедини числа и точки в 3 заданиях и проверь порядок всех точек."
      }
    ],
    "questions": [
      {
        "id": "oge-7-01",
        "nodeId": "oge-7-coordinate",
        "prompt": "На прямой отмечена точка A. Какова её координата?",
        "input": "number",
        "answer": "-3",
        "hint": "Начни от нуля и учитывай направление влево.",
        "explanation": "A находится на три единичных промежутка левее нуля, поэтому её координата −3.",
        "oracle": {
          "kind": "visual-coordinate",
          "label": "A",
          "axis": "value"
        },
        "visual": {
          "type": "numberLine",
          "min": -5,
          "max": 3,
          "points": [
            {
              "value": -3,
              "label": "A"
            }
          ],
          "step": 1
        }
      },
      {
        "id": "oge-7-02",
        "nodeId": "oge-7-compare",
        "prompt": "Какое число наибольшее: −0,7; −3/4; −0,8?",
        "input": "choice",
        "answer": "−0,7",
        "choices": [
          "−3/4",
          "−0,8",
          "−0,7"
        ],
        "hint": "Удобно записать все три числа десятичными дробями.",
        "explanation": "−3/4 = −0,75. На прямой −0,7 правее −0,75 и −0,8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "max",
            "-0.7",
            "-3/4",
            "-0.8"
          ],
          "values": [
            "-3/4",
            "-0.8",
            "-0.7"
          ]
        }
      },
      {
        "id": "oge-7-03",
        "nodeId": "oge-7-difference",
        "prompt": "Вычисли |−6| − |2|.",
        "input": "number",
        "answer": "4",
        "hint": "Сначала замени каждый модуль расстоянием до нуля.",
        "explanation": "|−6| = 6, |2| = 2; разность равна 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "abs",
              -6
            ],
            [
              "abs",
              2
            ]
          ]
        }
      },
      {
        "id": "oge-7-04",
        "nodeId": "oge-7-fraction-bounds",
        "prompt": "Между какими соседними целыми находится 19/4? Запиши меньшее целое.",
        "input": "number",
        "answer": "4",
        "hint": "Сравни числитель с ближайшими кратными знаменателя.",
        "explanation": "16 < 19 < 20, поэтому 4 < 19/4 < 5. Меньшее целое — 4.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 19,
          "divisor": 4
        }
      },
      {
        "id": "oge-7-05",
        "nodeId": "oge-7-root-bounds",
        "prompt": "Выбери верные границы для √31.",
        "input": "choice",
        "answer": "5 < √31 < 6",
        "choices": [
          "4 < √31 < 5",
          "6 < √31 < 7",
          "5 < √31 < 6"
        ],
        "hint": "Сравни 31 с квадратами границ.",
        "explanation": "25 < 31 < 36, следовательно 5 < √31 < 6.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            31,
            0
          ],
          "values": [
            [
              "mul",
              [
                "cmp",
                31,
                16
              ],
              [
                "cmp",
                25,
                31
              ]
            ],
            [
              "mul",
              [
                "cmp",
                31,
                36
              ],
              [
                "cmp",
                49,
                31
              ]
            ],
            [
              "mul",
              [
                "cmp",
                31,
                25
              ],
              [
                "cmp",
                36,
                31
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-7-06",
        "nodeId": "oge-7-match",
        "prompt": "Точка P имеет координату 1,5. Какая дробь обозначает P?",
        "input": "choice",
        "answer": "3/2",
        "choices": [
          "7/4",
          "3/2",
          "5/4"
        ],
        "hint": "Сравни каждую дробь с полутора единицами.",
        "explanation": "1,5 = 15/10 = 3/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            15,
            10
          ],
          "values": [
            "7/4",
            "3/2",
            "5/4"
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 3,
          "points": [
            {
              "value": 1.5,
              "label": "P"
            }
          ],
          "step": 0.5
        }
      },
      {
        "id": "oge-7-07",
        "nodeId": "oge-7-coordinate",
        "prompt": "Каждое деление соответствует 0,5. Найди координату B.",
        "input": "number",
        "answer": "2.5",
        "hint": "Считай промежутки от нуля, а не количество подписей.",
        "explanation": "До B пять промежутков по 0,5: 5 · 0,5 = 2,5.",
        "oracle": {
          "kind": "visual-coordinate",
          "label": "B",
          "axis": "value"
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 4,
          "points": [
            {
              "value": 2.5,
              "label": "B"
            }
          ],
          "step": 0.5
        }
      },
      {
        "id": "oge-7-08",
        "nodeId": "oge-7-compare",
        "prompt": "Какое число наибольшее: −5/6; −0,9; −4/5?",
        "input": "choice",
        "answer": "−4/5",
        "choices": [
          "−4/5",
          "−5/6",
          "−0,9"
        ],
        "hint": "Найди, какое из отрицательных чисел ближе к нулю.",
        "explanation": "−4/5 = −0,8, а −5/6 меньше −0,8. Также −0,9 < −0,8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "max",
            "-5/6",
            "-0.9",
            "-4/5"
          ],
          "values": [
            "-4/5",
            "-5/6",
            "-0.9"
          ]
        }
      },
      {
        "id": "oge-7-09",
        "nodeId": "oge-7-difference",
        "prompt": "Точки C и D имеют координаты −3 и 5. Найди расстояние CD.",
        "input": "number",
        "answer": "8",
        "hint": "Расстояние — модуль разности координат.",
        "explanation": "CD = |5 − (−3)| = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              5,
              -3
            ]
          ]
        }
      },
      {
        "id": "oge-7-10",
        "nodeId": "oge-7-fraction-bounds",
        "prompt": "Между какими соседними целыми находится 35/6? Запиши меньшее целое.",
        "input": "number",
        "answer": "5",
        "hint": "Подбери два соседних кратных 6.",
        "explanation": "30 < 35 < 36, поэтому 5 < 35/6 < 6.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 35,
          "divisor": 6
        }
      },
      {
        "id": "oge-7-11",
        "nodeId": "oge-7-root-bounds",
        "prompt": "В каком промежутке лежит √58?",
        "input": "choice",
        "answer": "7 < √58 < 8",
        "choices": [
          "8 < √58 < 9",
          "7 < √58 < 8",
          "6 < √58 < 7"
        ],
        "hint": "Выпиши квадраты предложенных целых границ.",
        "explanation": "49 < 58 < 64, поэтому 7 < √58 < 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            58,
            0
          ],
          "values": [
            [
              "mul",
              [
                "cmp",
                58,
                64
              ],
              [
                "cmp",
                81,
                58
              ]
            ],
            [
              "mul",
              [
                "cmp",
                58,
                49
              ],
              [
                "cmp",
                64,
                58
              ]
            ],
            [
              "mul",
              [
                "cmp",
                58,
                36
              ],
              [
                "cmp",
                49,
                58
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-7-12",
        "nodeId": "oge-7-match",
        "prompt": "Точка Q имеет координату −1,25. Какая дробь ей соответствует?",
        "input": "choice",
        "answer": "−5/4",
        "choices": [
          "−5/4",
          "−3/2",
          "−6/5"
        ],
        "hint": "Сначала переведи четверти или пятые в десятичную запись.",
        "explanation": "−1,25 = −125/100 = −5/4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            -125,
            100
          ],
          "values": [
            "-5/4",
            "-3/2",
            "-6/5"
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -2,
          "max": 0,
          "points": [
            {
              "value": -1.25,
              "label": "Q"
            }
          ],
          "step": 0.25
        }
      },
      {
        "id": "oge-7-13",
        "nodeId": "oge-7-coordinate",
        "prompt": "На шкале шаг равен 0,5. Какова координата C?",
        "input": "number",
        "answer": "-1.5",
        "hint": "От нуля влево координаты уменьшаются.",
        "explanation": "C на три промежутка по 0,5 левее нуля: −3 · 0,5 = −1,5.",
        "oracle": {
          "kind": "visual-coordinate",
          "label": "C",
          "axis": "value"
        },
        "visual": {
          "type": "numberLine",
          "min": -3,
          "max": 1,
          "points": [
            {
              "value": -1.5,
              "label": "C"
            }
          ],
          "step": 0.5
        }
      },
      {
        "id": "oge-7-14",
        "nodeId": "oge-7-compare",
        "prompt": "Выбери наибольшее число: −7/8; −0,85; −9/10.",
        "input": "choice",
        "answer": "−0,85",
        "choices": [
          "−7/8",
          "−0,85",
          "−9/10"
        ],
        "hint": "Сравни десятичные записи с одинаковым числом разрядов.",
        "explanation": "−7/8 = −0,875, −9/10 = −0,9. Наибольшее число — −0,85.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "max",
            "-7/8",
            "-0.85",
            "-9/10"
          ],
          "values": [
            "-7/8",
            "-0.85",
            "-9/10"
          ]
        }
      },
      {
        "id": "oge-7-15",
        "nodeId": "oge-7-difference",
        "prompt": "Вычисли |−8| − |−5|.",
        "input": "number",
        "answer": "3",
        "hint": "Модуль отрицательного числа неотрицателен.",
        "explanation": "|−8| = 8 и |−5| = 5, поэтому 8 − 5 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "abs",
              -8
            ],
            [
              "abs",
              -5
            ]
          ]
        }
      },
      {
        "id": "oge-7-16",
        "nodeId": "oge-7-fraction-bounds",
        "prompt": "Между какими соседними целыми находится 50/7? Запиши меньшее целое.",
        "input": "number",
        "answer": "7",
        "hint": "Сравни 50 с двумя соседними кратными 7.",
        "explanation": "49 < 50 < 56, поэтому 7 < 50/7 < 8.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 50,
          "divisor": 7
        }
      },
      {
        "id": "oge-7-17",
        "nodeId": "oge-7-root-bounds",
        "prompt": "Выбери верную оценку √83.",
        "input": "choice",
        "answer": "9 < √83 < 10",
        "choices": [
          "9 < √83 < 10",
          "8 < √83 < 9",
          "10 < √83 < 11"
        ],
        "hint": "Квадрат какого целого чуть меньше 83, а следующего — больше?",
        "explanation": "81 < 83 < 100, поэтому 9 < √83 < 10.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            83,
            0
          ],
          "values": [
            [
              "mul",
              [
                "cmp",
                83,
                81
              ],
              [
                "cmp",
                100,
                83
              ]
            ],
            [
              "mul",
              [
                "cmp",
                83,
                64
              ],
              [
                "cmp",
                81,
                83
              ]
            ],
            [
              "mul",
              [
                "cmp",
                83,
                100
              ],
              [
                "cmp",
                121,
                83
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-7-18",
        "nodeId": "oge-7-match",
        "prompt": "Координата R равна 2,75. Выбери соответствующую дробь.",
        "input": "choice",
        "answer": "11/4",
        "choices": [
          "5/2",
          "14/5",
          "11/4"
        ],
        "hint": "Раздели целую часть и дробную или переведи дроби в десятичные.",
        "explanation": "2,75 = 275/100 = 11/4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            275,
            100
          ],
          "values": [
            "5/2",
            "14/5",
            "11/4"
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 2,
          "max": 4,
          "points": [
            {
              "value": 2.75,
              "label": "R"
            }
          ],
          "step": 0.25
        }
      }
    ]
  },
  {
    "id": "oge-8",
    "taskNumbers": [
      8
    ],
    "title": "№8. Степени, корни и полезные преобразования",
    "goal": "Выбирать преобразование по устройству выражения, сохранять ограничения и знаки.",
    "transferGoal": "Реши 4 новые карточки из разных групп. Одну проверь подстановкой, одну — обратным возведением в квадрат, к одной запиши название использованной формулы.",
    "source": {
      "href": "/trainers/oge-task8-powers-roots.html",
      "title": "ОГЭ №8 · исходный тренажёр",
      "trainerId": "oge-t8-stepeni"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task8-powers-roots.html",
      "selector": "GROUPS[].k: выбор группы в марафоне",
      "types": [
        {
          "id": "rootdeg",
          "title": "Корень из степени"
        },
        {
          "id": "letters",
          "title": "Корни с буквами"
        },
        {
          "id": "sqroot",
          "title": "Квадрат бьёт корень"
        },
        {
          "id": "prod",
          "title": "Произведение корней"
        },
        {
          "id": "dsq",
          "title": "Разность квадратов"
        },
        {
          "id": "sqsum",
          "title": "Квадрат суммы"
        },
        {
          "id": "fold",
          "title": "Свернуть в квадрат"
        },
        {
          "id": "pow1",
          "title": "Степени: одно основание"
        },
        {
          "id": "pow2",
          "title": "Степени: два основания"
        },
        {
          "id": "sci",
          "title": "Стандартный вид числа"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-8-same-base",
        "title": "Степени одного основания",
        "goal": "Считать показатели по выбранному действию.",
        "dependsOn": [],
        "foundations": [
          "powers",
          "expression-powers-roots"
        ],
        "covers": [
          "pow1"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №8",
            "href": "/trainers/oge-task8-powers-roots.html",
            "instruction": "Выбери «Степени: одно основание». Для произведения, частного и степени степени назови правило до вычисления.",
            "finish": "Реши 3 разных по действию примера."
          }
        ],
        "explain": {
          "prompt": "Почему при делении показатели вычитаются?",
          "criteria": [
            "Основания действительно одинаковые.",
            "Действие с показателями соответствует операции.",
            "Обоснована хотя бы одна запись через повторное умножение."
          ]
        },
        "misconception": "При возведении степени в степень складывают показатели.",
        "finish": "Реши 3 разных по действию примера."
      },
      {
        "id": "oge-8-bases-scale",
        "title": "Разные основания и стандартный вид",
        "goal": "Увидеть общие множители и порядок величины.",
        "dependsOn": [
          "oge-8-same-base"
        ],
        "foundations": [
          "decimal-multiply",
          "powers",
          "expression-structure"
        ],
        "covers": [
          "pow2",
          "sci"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №8",
            "href": "/trainers/oge-task8-powers-roots.html",
            "instruction": "Чередуй «Степени: два основания» и «Стандартный вид числа». Перепиши основание или степень десяти до подстановки.",
            "finish": "Реши 2 примера с двумя основаниями и 1 со стандартным видом."
          }
        ],
        "explain": {
          "prompt": "Как выбранная степень десяти меняет величину числа?",
          "criteria": [
            "Преобразование оснований обосновано.",
            "В стандартном виде коэффициент проверен на диапазон от 1 до 10.",
            "Прикидка согласуется с количеством разрядов."
          ]
        },
        "misconception": "Показатель степени десяти принимают за число нулей при любом коэффициенте.",
        "finish": "Реши 2 примера с двумя основаниями и 1 со стандартным видом."
      },
      {
        "id": "oge-8-root-sign",
        "title": "Корень из квадрата и знак буквы",
        "goal": "Сохранять модуль при извлечении корня.",
        "dependsOn": [
          "oge-8-same-base"
        ],
        "foundations": [
          "signed-opposite-absolute",
          "expression-substitution",
          "expression-powers-roots"
        ],
        "covers": [
          "rootdeg",
          "letters"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №8",
            "href": "/trainers/oge-task8-powers-roots.html",
            "instruction": "Выбери «Корень из степени», затем «Корни с буквами». До вычисления выпиши знак заданной буквы.",
            "finish": "Реши 3 примера, в одном буква должна быть отрицательной."
          }
        ],
        "explain": {
          "prompt": "Почему √(a²) не всегда равно a?",
          "criteria": [
            "Арифметический корень назван неотрицательным.",
            "Квадрат распознан как квадрат целого выражения.",
            "Модуль раскрыт с учётом знака."
          ]
        },
        "misconception": "Теряют модуль и получают отрицательный арифметический корень.",
        "finish": "Реши 3 примера, в одном буква должна быть отрицательной."
      },
      {
        "id": "oge-8-root-products",
        "title": "Произведение и частное корней",
        "goal": "Собирать удобный подкоренный квадрат.",
        "dependsOn": [
          "oge-8-root-sign"
        ],
        "foundations": [
          "fraction-product",
          "fraction-division",
          "expression-powers-roots"
        ],
        "covers": [
          "prod",
          "sqroot"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №8",
            "href": "/trainers/oge-task8-powers-roots.html",
            "instruction": "Выбери «Произведение корней» и «Квадрат бьёт корень». Сначала проверь допустимость выражения.",
            "finish": "Реши 3 примера и покажи обратную проверку квадратом."
          }
        ],
        "explain": {
          "prompt": "Когда можно объединить два корня в один?",
          "criteria": [
            "Подкоренные выражения неотрицательны.",
            "Делитель при необходимости ненулевой.",
            "Полученное значение проверено квадратом."
          ]
        },
        "misconception": "Объединяют корни в сумме так же, как в произведении.",
        "finish": "Реши 3 примера и покажи обратную проверку квадратом."
      },
      {
        "id": "oge-8-identities",
        "title": "Формулы убирают сложность",
        "goal": "Узнать разность квадратов и квадрат суммы.",
        "dependsOn": [
          "oge-8-root-products"
        ],
        "foundations": [
          "expression-identities",
          "expression-multiply-brackets"
        ],
        "covers": [
          "dsq",
          "sqsum"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №8",
            "href": "/trainers/oge-task8-powers-roots.html",
            "instruction": "Выбери «Разность квадратов», затем «Квадрат суммы». В одном примере разверни формулу, в другом используй её сразу.",
            "finish": "Реши по 2 примера обоих типов."
          }
        ],
        "explain": {
          "prompt": "Какие слагаемые сократились и почему?",
          "criteria": [
            "Верно выделены оба выражения в формуле.",
            "В квадрате суммы сохранён удвоенный продукт.",
            "Сокращаются именно противоположные слагаемые."
          ]
        },
        "misconception": "Пишут (a+b)² = a²+b².",
        "finish": "Реши по 2 примера обоих типов."
      },
      {
        "id": "oge-8-fold",
        "title": "Сворачиваем и объясняем",
        "goal": "Узнать полный квадрат под корнем и проверить знак.",
        "dependsOn": [
          "oge-8-identities",
          "oge-8-root-sign"
        ],
        "foundations": [
          "expression-identities",
          "signed-opposite-absolute"
        ],
        "covers": [
          "fold"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №8",
            "href": "/trainers/oge-task8-powers-roots.html",
            "instruction": "Открой «Свернуть в квадрат». После свёртки отдельно выпиши модуль, а только затем подставь число.",
            "finish": "Реши 3 примера и запиши одну проверку развёртыванием."
          }
        ],
        "explain": {
          "prompt": "Как убедиться, что трёхчлен действительно полный квадрат?",
          "criteria": [
            "Проверены крайние квадраты.",
            "Средний член равен удвоенному произведению с нужным знаком.",
            "После корня сохранён и раскрыт модуль."
          ]
        },
        "misconception": "Распознают похожий трёхчлен по двум крайним слагаемым.",
        "finish": "Реши 3 примера и запиши одну проверку развёртыванием."
      }
    ],
    "questions": [
      {
        "id": "oge-8-01",
        "nodeId": "oge-8-same-base",
        "prompt": "Вычисли 2³ · 2⁴ : 2⁵.",
        "input": "number",
        "answer": "4",
        "hint": "Для одного основания сначала выполни действия с показателями.",
        "explanation": "2³ · 2⁴ : 2⁵ = 2^(3+4−5) = 2² = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              [
                "pow",
                2,
                3
              ],
              [
                "pow",
                2,
                4
              ]
            ],
            [
              "pow",
              2,
              5
            ]
          ]
        }
      },
      {
        "id": "oge-8-02",
        "nodeId": "oge-8-bases-scale",
        "prompt": "Вычисли (2 · 5)³ : 10².",
        "input": "number",
        "answer": "10",
        "hint": "Заметь общее основание в числителе и знаменателе.",
        "explanation": "2 · 5 = 10, значит 10³ : 10² = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "pow",
              [
                "mul",
                2,
                5
              ],
              3
            ],
            [
              "pow",
              10,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-8-03",
        "nodeId": "oge-8-root-sign",
        "prompt": "Найди √(a²), если a = −3.",
        "input": "number",
        "answer": "3",
        "hint": "Арифметический корень должен быть неотрицательным.",
        "explanation": "√(a²) = |a|; при a = −3 получаем 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            -3
          ]
        }
      },
      {
        "id": "oge-8-04",
        "nodeId": "oge-8-root-products",
        "prompt": "Вычисли √12 · √3.",
        "input": "number",
        "answer": "6",
        "hint": "Объедини произведение под одним корнем.",
        "explanation": "√12 · √3 = √36 = 6.",
        "oracle": {
          "kind": "square-root",
          "radicand": 36
        }
      },
      {
        "id": "oge-8-05",
        "nodeId": "oge-8-identities",
        "prompt": "Вычисли (√3 + 2)² − 4√3.",
        "input": "number",
        "answer": "7",
        "hint": "Раскрой квадрат суммы и собери противоположные слагаемые.",
        "explanation": "(√3 + 2)² = 3 + 4√3 + 4. После вычитания 4√3 остаётся 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            3,
            [
              "pow",
              2,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-8-06",
        "nodeId": "oge-8-fold",
        "prompt": "Найди √(x² − 6x + 9), если x = −2.",
        "input": "number",
        "answer": "5",
        "hint": "Сверни подкоренное выражение в квадрат разности.",
        "explanation": "x² − 6x + 9 = (x−3)². Корень равен |x−3| = |−5| = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              -2,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-8-07",
        "nodeId": "oge-8-same-base",
        "prompt": "Вычисли 3⁵ : 3³.",
        "input": "number",
        "answer": "9",
        "hint": "Деление одинаковых степенных оснований сокращает множители.",
        "explanation": "3⁵ : 3³ = 3² = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "pow",
              3,
              5
            ],
            [
              "pow",
              3,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-8-08",
        "nodeId": "oge-8-bases-scale",
        "prompt": "Вычисли (3² · 4²) : 6².",
        "input": "number",
        "answer": "4",
        "hint": "Сначала объедини множители с одинаковым показателем.",
        "explanation": "3² · 4² = 12²; 12² : 6² = (12:6)² = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              [
                "pow",
                3,
                2
              ],
              [
                "pow",
                4,
                2
              ]
            ],
            [
              "pow",
              6,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-8-09",
        "nodeId": "oge-8-root-sign",
        "prompt": "Найди √(a⁶), если a = −5.",
        "input": "number",
        "answer": "125",
        "hint": "Представь a⁶ как квадрат a³ и учти знак.",
        "explanation": "√(a⁶) = |a³|. При a = −5 это |−125| = 125.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "pow",
              -5,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-8-10",
        "nodeId": "oge-8-root-products",
        "prompt": "Вычисли √18 : √2.",
        "input": "number",
        "answer": "3",
        "hint": "Объедини частное под одним корнем.",
        "explanation": "√18 : √2 = √9 = 3.",
        "oracle": {
          "kind": "square-root",
          "radicand": 9
        }
      },
      {
        "id": "oge-8-11",
        "nodeId": "oge-8-identities",
        "prompt": "Вычисли (√5 − 3)² + 6√5.",
        "input": "number",
        "answer": "14",
        "hint": "В квадрате разности среднее слагаемое имеет минус.",
        "explanation": "(√5 − 3)² = 5 − 6√5 + 9; после прибавления 6√5 остаётся 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            5,
            [
              "pow",
              3,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-8-12",
        "nodeId": "oge-8-fold",
        "prompt": "Найди √(x² − 4x + 4), если x = −4.",
        "input": "number",
        "answer": "6",
        "hint": "Распознай квадрат разности и не теряй модуль.",
        "explanation": "x² − 4x + 4 = (x−2)². Корень равен |−4−2| = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              -4,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-8-13",
        "nodeId": "oge-8-same-base",
        "prompt": "Вычисли (5²)³ : 5⁴.",
        "input": "number",
        "answer": "25",
        "hint": "Степень степени и деление требуют разных действий с показателями.",
        "explanation": "(5²)³ : 5⁴ = 5^(2·3−4) = 5² = 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "pow",
              [
                "pow",
                5,
                2
              ],
              3
            ],
            [
              "pow",
              5,
              4
            ]
          ]
        }
      },
      {
        "id": "oge-8-14",
        "nodeId": "oge-8-bases-scale",
        "prompt": "Число записали как 2,4 · 10³. Найди его обычное числовое значение.",
        "input": "number",
        "answer": "2400",
        "hint": "Степень десяти показывает множитель, а не число слагаемых.",
        "explanation": "10³ = 1000, поэтому 2,4 · 1000 = 2400.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "2.4",
            [
              "pow",
              10,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-8-15",
        "nodeId": "oge-8-root-sign",
        "prompt": "Найди √(16a²), если a = −2.",
        "input": "number",
        "answer": "8",
        "hint": "Выдели квадрат произведения и найди его модуль.",
        "explanation": "√(16a²) = 4|a| = 4 · 2 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            [
              "abs",
              -2
            ]
          ]
        }
      },
      {
        "id": "oge-8-16",
        "nodeId": "oge-8-root-products",
        "prompt": "Вычисли √8 · √2.",
        "input": "number",
        "answer": "4",
        "hint": "В произведении положительные подкоренные числа можно перемножить.",
        "explanation": "√8 · √2 = √16 = 4.",
        "oracle": {
          "kind": "square-root",
          "radicand": 16
        }
      },
      {
        "id": "oge-8-17",
        "nodeId": "oge-8-identities",
        "prompt": "Вычисли (√11 − 2)(√11 + 2).",
        "input": "number",
        "answer": "7",
        "hint": "Это произведение разности и суммы одинаковых выражений.",
        "explanation": "По формуле разности квадратов получаем 11 − 2² = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            11,
            [
              "pow",
              2,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-8-18",
        "nodeId": "oge-8-fold",
        "prompt": "Найди √(x² − 10x + 25), если x = 1.",
        "input": "number",
        "answer": "4",
        "hint": "Сверни трёхчлен и проверь знак разности под модулем.",
        "explanation": "x² − 10x + 25 = (x−5)²; корень равен |1−5| = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              1,
              5
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-9",
    "taskNumbers": [
      9
    ],
    "title": "№9. От линейного уравнения к выбору метода",
    "goal": "Различать линейные, квадратные и дробные семейства; сохранять все корни и ограничения.",
    "transferGoal": "Возьми по одному новому линейному, квадратному и дробному уравнению. Запиши выбранный метод, ограничения и проверку; затем попробуй один пример с заменой.",
    "source": {
      "href": "/trainers/oge-task9-equations.html",
      "title": "ОГЭ №9 · исходный тренажёр",
      "trainerId": "oge-t9-uravneniya"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task9-equations.html",
      "selector": "TYPE_IDS и TYPE_NAMES: семейства уравнений",
      "types": [
        {
          "id": "L",
          "title": "Линейное: перенос слагаемых"
        },
        {
          "id": "LB",
          "title": "Линейное со скобками"
        },
        {
          "id": "LF",
          "title": "Линейное с дробями"
        },
        {
          "id": "LSQ",
          "title": "Сводится к линейному через квадраты"
        },
        {
          "id": "QNB",
          "title": "Неполное квадратное: без b"
        },
        {
          "id": "QNC",
          "title": "Неполное квадратное: без c"
        },
        {
          "id": "QNCm",
          "title": "Неполное квадратное: x² = kx"
        },
        {
          "id": "QF",
          "title": "Полное квадратное: дискриминант"
        },
        {
          "id": "QR",
          "title": "x² с обеих сторон — перенести и привести"
        },
        {
          "id": "QP",
          "title": "Квадратное с произведением скобок"
        },
        {
          "id": "PROP",
          "title": "Пропорция"
        },
        {
          "id": "Z",
          "title": "Сумма двух дробей равна нулю"
        },
        {
          "id": "NZ",
          "title": "Дробь равна нулю, в числителе квадратный трёхчлен"
        },
        {
          "id": "XF",
          "title": "Вида x + a/x = b"
        },
        {
          "id": "S2",
          "title": "Сумма двух дробей равна числу"
        },
        {
          "id": "SB",
          "title": "Замена t = 1/(x − k)"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-9-linear",
        "title": "Равенство и линейные шаги",
        "goal": "Сохранять равенство при скобках, дробных коэффициентах и сокращении одинаковых квадратов.",
        "dependsOn": [],
        "foundations": [
          "equation-linear",
          "equation-brackets",
          "equation-denominators",
          "expression-identities"
        ],
        "covers": [
          "L",
          "LB",
          "LF",
          "LSQ"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №9",
            "href": "/trainers/oge-task9-equations.html",
            "instruction": "Выбери линейный раздел. Реши по одному уравнению с переносом, со скобками и с дробями; отдельно просмотри случай квадратов с обеих сторон.",
            "finish": "Закончи 3 решения и проверь каждое подстановкой."
          },
          {
            "title": "Линейные уравнения по коротким шагам",
            "href": "/equations/linear-pilot/",
            "instruction": "Если первые преобразования пока трудны, пройди одну учебную последовательность в линейном тренажёре; затем вернись к карте №9.",
            "finish": "Закончи одну последовательность и реши 2 уравнения самостоятельно."
          }
        ],
        "explain": {
          "prompt": "Какое действие выполнено одновременно с обеими частями?",
          "criteria": [
            "Указано одинаковое действие с обеими частями.",
            "Скобки раскрыты без потери слагаемых.",
            "Корень проверен в исходном равенстве."
          ]
        },
        "misconception": "Меняют знак слагаемого без объяснения, какую операцию сделали.",
        "finish": "Закончи 3 решения и проверь каждое подстановкой."
      },
      {
        "id": "oge-9-proportion",
        "title": "Пропорция и ненулевые знаменатели",
        "goal": "Перейти от равенства дробей к равенству произведений.",
        "dependsOn": [
          "oge-9-linear"
        ],
        "foundations": [
          "percent-proportion",
          "equation-fraction-answer"
        ],
        "covers": [
          "PROP"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №9",
            "href": "/trainers/oge-task9-equations.html",
            "instruction": "В дробном разделе выбери «Пропорция». Перед умножением подпиши, какие знаменатели должны быть ненулевыми.",
            "finish": "Реши 3 пропорции, одну проверь точной дробью."
          }
        ],
        "explain": {
          "prompt": "Почему перекрёстное умножение допустимо в этой записи?",
          "criteria": [
            "Знаменатели проверены на ноль.",
            "Выписаны правильные перекрёстные произведения.",
            "Найденный корень проверен до сокращений."
          ]
        },
        "misconception": "Умножают числитель на числитель, забывая структуру пропорции.",
        "finish": "Реши 3 пропорции, одну проверь точной дробью."
      },
      {
        "id": "oge-9-factor",
        "title": "Неполное квадратное и нулевое произведение",
        "goal": "Получать все корни без потери нуля или отрицательного корня.",
        "dependsOn": [
          "oge-9-linear"
        ],
        "foundations": [
          "expression-common-factor",
          "expression-powers-roots",
          "equation-exam-transfer"
        ],
        "covers": [
          "QNB",
          "QNC",
          "QNCm",
          "QP"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №9",
            "href": "/trainers/oge-task9-equations.html",
            "instruction": "Выбери неполные квадратные и произведение скобок. В одном случае вынеси x, в другом извлеки корень из x².",
            "finish": "Реши 3 разных уравнения и перечисли все их корни."
          }
        ],
        "explain": {
          "prompt": "На каком шаге легко потерять корень?",
          "criteria": [
            "Из нулевого произведения рассмотрен каждый множитель.",
            "При x² = a учтены оба знака, когда a положительно.",
            "Деление на выражение с x отдельно обосновано или не используется."
          ]
        },
        "misconception": "Делят на x и теряют корень 0.",
        "finish": "Реши 3 разных уравнения и перечисли все их корни."
      },
      {
        "id": "oge-9-quadratic",
        "title": "Полное квадратное: выбираем способ",
        "goal": "Привести к стандартному виду и выбрать дискриминант или Виета.",
        "dependsOn": [
          "oge-9-factor"
        ],
        "foundations": [
          "expression-like-terms",
          "expression-identities",
          "equation-exam-transfer"
        ],
        "covers": [
          "QF",
          "QR"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №9",
            "href": "/trainers/oge-task9-equations.html",
            "instruction": "Выбери полное квадратное, затем случай x² с обеих сторон. Одно уравнение реши дискриминантом, второе — подбором по Виету.",
            "finish": "Реши 2 уравнения обоими способами и сравни пары корней."
          }
        ],
        "explain": {
          "prompt": "Как проверить найденные корни без повторения всего решения?",
          "criteria": [
            "Названы a, b и c с их знаками.",
            "Вычислен дискриминант или сумма и произведение корней.",
            "Выбран именно тот корень, который просит вопрос."
          ]
        },
        "misconception": "Подставляют b без минуса или забывают знаменатель 2a.",
        "finish": "Реши 2 уравнения обоими способами и сравни пары корней."
      },
      {
        "id": "oge-9-rational",
        "title": "Дробные уравнения и отбор",
        "goal": "Не принимать запрещённое значение за корень.",
        "dependsOn": [
          "oge-9-proportion",
          "oge-9-quadratic"
        ],
        "foundations": [
          "fraction-common-denominator",
          "equation-denominators",
          "equation-exam-transfer"
        ],
        "covers": [
          "Z",
          "NZ",
          "XF",
          "S2"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №9",
            "href": "/trainers/oge-task9-equations.html",
            "instruction": "В дробном разделе чередуй «Дробь равна нулю», «x и дробь с x» и «Сумма двух дробей». Выпиши ограничения до преобразований.",
            "finish": "Реши 3 уравнения и отметь каждый исключённый кандидат."
          }
        ],
        "explain": {
          "prompt": "Почему ноль числителя может не дать решения дробного уравнения?",
          "criteria": [
            "Выписаны нули исходных знаменателей.",
            "Кандидаты найдены после равносильных действий на допустимой области.",
            "Каждый кандидат проверен на ограничения и исходное равенство."
          ]
        },
        "misconception": "Сокращение множителя считают разрешением подставить его ноль.",
        "finish": "Реши 3 уравнения и отметь каждый исключённый кандидат."
      },
      {
        "id": "oge-9-substitution",
        "title": "Замена и возврат к x",
        "goal": "Узнать повторяющуюся дробь, решить уравнение в новой букве и вернуться.",
        "dependsOn": [
          "oge-9-rational"
        ],
        "foundations": [
          "equation-inverse",
          "fraction-division",
          "equation-fraction-answer"
        ],
        "covers": [
          "SB"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №9",
            "href": "/trainers/oge-task9-equations.html",
            "instruction": "Открой тип «Замена t = 1/(x − k)». Сначала реши уравнение для t, затем отдельно восстанови x из каждого допустимого t.",
            "finish": "Разбери 2 примера с заменой и проверь оба этапа подстановкой."
          }
        ],
        "explain": {
          "prompt": "Почему найденное t ещё не является ответом задачи?",
          "criteria": [
            "Замена записана вместе с ограничениями.",
            "Для каждого допустимого t восстановлен x.",
            "В исходное уравнение подставлен x, а не t."
          ]
        },
        "misconception": "Записывают корни вспомогательного уравнения вместо исходной переменной.",
        "finish": "Разбери 2 примера с заменой и проверь оба этапа подстановкой."
      }
    ],
    "questions": [
      {
        "id": "oge-9-01",
        "nodeId": "oge-9-linear",
        "prompt": "Реши уравнение 2(x − 3) = 10.",
        "input": "number",
        "answer": "8",
        "hint": "Можно сначала разделить обе части на множитель перед скобками.",
        "explanation": "x − 3 = 5, значит x = 8. Проверка: 2 · (8−3) = 10.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": -6,
          "c": 10
        }
      },
      {
        "id": "oge-9-02",
        "nodeId": "oge-9-proportion",
        "prompt": "Реши пропорцию (x + 1)/3 = 4/6.",
        "input": "number",
        "answer": "1",
        "hint": "Умножь обе части на ненулевой общий знаменатель.",
        "explanation": "6(x+1) = 12; x+1 = 2; x = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              [
                "mul",
                3,
                4
              ],
              6
            ],
            1
          ]
        }
      },
      {
        "id": "oge-9-03",
        "nodeId": "oge-9-factor",
        "prompt": "Реши x² − 5x = 0. Запиши ненулевой корень.",
        "input": "number",
        "answer": "5",
        "hint": "Вынеси общий множитель, не деля на неизвестное.",
        "explanation": "x(x−5) = 0; корни 0 и 5. Ненулевой корень — 5.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -5,
          "c": 0,
          "selection": "larger"
        }
      },
      {
        "id": "oge-9-04",
        "nodeId": "oge-9-quadratic",
        "prompt": "Найди больший корень уравнения x² − 7x + 10 = 0.",
        "input": "number",
        "answer": "5",
        "hint": "Подбери два числа с нужными суммой и произведением.",
        "explanation": "x² − 7x + 10 = (x−2)(x−5). Корни 2 и 5; больший — 5.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -7,
          "c": 10,
          "selection": "larger"
        }
      },
      {
        "id": "oge-9-05",
        "nodeId": "oge-9-rational",
        "prompt": "Реши (x² − 9)/(x − 3) = 0.",
        "input": "number",
        "answer": "-3",
        "hint": "Ноль числителя должен быть допустим для исходного знаменателя.",
        "explanation": "x ≠ 3. Числитель равен нулю при x = −3 или 3. Допустим только x = −3.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 0,
          "c": -9,
          "selection": "smaller",
          "excluded": [
            3
          ]
        }
      },
      {
        "id": "oge-9-06",
        "nodeId": "oge-9-substitution",
        "prompt": "При замене t = 1/(x − 2) получено t = −1/3. Найди соответствующее x.",
        "input": "number",
        "answer": "-1",
        "hint": "Сначала восстанови x − 2 из обратной дроби.",
        "explanation": "1/(x−2) = −1/3, значит x−2 = −3 и x = −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            [
              "div",
              1,
              "-1/3"
            ]
          ]
        }
      },
      {
        "id": "oge-9-07",
        "nodeId": "oge-9-linear",
        "prompt": "Реши уравнение 3(2x + 1) = 21.",
        "input": "number",
        "answer": "3",
        "hint": "Убери общий множитель, затем изолируй слагаемое с x.",
        "explanation": "2x+1 = 7; 2x = 6; x = 3. Подстановка даёт 21.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": 3,
          "c": 21
        }
      },
      {
        "id": "oge-9-08",
        "nodeId": "oge-9-proportion",
        "prompt": "Реши (x − 2)/5 = 6/10.",
        "input": "number",
        "answer": "5",
        "hint": "Умножь числители на противоположные знаменатели.",
        "explanation": "10(x−2) = 30; x−2 = 3; x = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            [
              "div",
              [
                "mul",
                5,
                6
              ],
              10
            ]
          ]
        }
      },
      {
        "id": "oge-9-09",
        "nodeId": "oge-9-factor",
        "prompt": "Найди отрицательный корень уравнения x² = 64.",
        "input": "number",
        "answer": "-8",
        "hint": "Квадрат положительного и противоположного ему числа одинаков.",
        "explanation": "x = ±8, поэтому отрицательный корень равен −8.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 0,
          "c": -64,
          "selection": "smaller"
        }
      },
      {
        "id": "oge-9-10",
        "nodeId": "oge-9-quadratic",
        "prompt": "Найди больший корень уравнения 2x² − 10x + 12 = 0.",
        "input": "number",
        "answer": "3",
        "hint": "Сначала сократи все коэффициенты на общий множитель.",
        "explanation": "После деления на 2: x²−5x+6 = 0 = (x−2)(x−3). Больший корень — 3.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 2,
          "b": -10,
          "c": 12,
          "selection": "larger"
        }
      },
      {
        "id": "oge-9-11",
        "nodeId": "oge-9-rational",
        "prompt": "Реши (x² − 16)/(x + 4) = 0.",
        "input": "number",
        "answer": "4",
        "hint": "Проверь, какой ноль числителя запрещён знаменателем.",
        "explanation": "x ≠ −4. Кандидаты −4 и 4; подходит только 4.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 0,
          "c": -16,
          "selection": "larger",
          "excluded": [
            -4
          ]
        }
      },
      {
        "id": "oge-9-12",
        "nodeId": "oge-9-substitution",
        "prompt": "После замены t = 1/(x + 1) найдено t = 2/5. Найди x.",
        "input": "number",
        "answer": "3/2",
        "hint": "Перейди от значения обратной дроби к x + 1.",
        "explanation": "x+1 = 5/2, поэтому x = 5/2−1 = 3/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              1,
              "2/5"
            ],
            1
          ]
        }
      },
      {
        "id": "oge-9-13",
        "nodeId": "oge-9-linear",
        "prompt": "Реши уравнение (4x − 2)/3 = 6.",
        "input": "number",
        "answer": "5",
        "hint": "Сначала умножь обе части на знаменатель.",
        "explanation": "4x−2 = 18; 4x = 20; x = 5. Проверка: (20−2):3 = 6.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": -2,
          "c": 18
        }
      },
      {
        "id": "oge-9-14",
        "nodeId": "oge-9-proportion",
        "prompt": "Реши пропорцию (x + 3)/4 = 9/12.",
        "input": "number",
        "answer": "0",
        "hint": "Сократи правую дробь или выполни перекрёстное умножение.",
        "explanation": "12(x+3) = 36; x+3 = 3; x = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              [
                "mul",
                4,
                9
              ],
              12
            ],
            3
          ]
        }
      },
      {
        "id": "oge-9-15",
        "nodeId": "oge-9-factor",
        "prompt": "Найди больший корень уравнения (x + 3)(x − 7) = 0.",
        "input": "number",
        "answer": "7",
        "hint": "Произведение равно нулю, если хотя бы один множитель нулевой.",
        "explanation": "Корни −3 и 7. Больший корень — 7.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -4,
          "c": -21,
          "selection": "larger"
        }
      },
      {
        "id": "oge-9-16",
        "nodeId": "oge-9-quadratic",
        "prompt": "Найди меньший корень уравнения x² + 2x − 15 = 0.",
        "input": "number",
        "answer": "-5",
        "hint": "Ищи числа с произведением −15 и суммой −2.",
        "explanation": "(x+5)(x−3) = 0; корни −5 и 3. Меньший — −5.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 2,
          "c": -15,
          "selection": "smaller"
        }
      },
      {
        "id": "oge-9-17",
        "nodeId": "oge-9-rational",
        "prompt": "Реши (x² − 25)/(x − 5) = 0.",
        "input": "number",
        "answer": "-5",
        "hint": "Сохрани ограничение исходной дроби после разложения числителя.",
        "explanation": "x ≠ 5. Из (x−5)(x+5) = 0 получаются кандидаты 5 и −5; остаётся −5.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 0,
          "c": -25,
          "selection": "smaller",
          "excluded": [
            5
          ]
        }
      },
      {
        "id": "oge-9-18",
        "nodeId": "oge-9-substitution",
        "prompt": "При замене t = 1/(x − 3) получено t = −2/7. Найди x.",
        "input": "number",
        "answer": "-1/2",
        "hint": "Обрати дробь, затем верни сдвиг переменной.",
        "explanation": "x−3 = −7/2, поэтому x = 3−7/2 = −1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            3,
            [
              "div",
              1,
              "-2/7"
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-10",
    "taskNumbers": [
      10
    ],
    "title": "№10. Вероятность через состав опыта",
    "goal": "Понимать, что выбирается, какие исходы равновозможны и как меняется состав опыта.",
    "transferGoal": "Реши 3 новых задачи из разных типов; к одной нарисуй дерево, к одной таблицу или диаграмму, к одной объясни знаменатель вероятности.",
    "source": {
      "href": "/trainers/oge-task10-probability.html",
      "title": "ОГЭ №10 · исходный тренажёр",
      "trainerId": "oge-t10-veroyatnost"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task10-probability.html",
      "selector": "TYPE_IDS: типы 10.1–10.7",
      "types": [
        {
          "id": "10_1",
          "title": "Равновозможные исходы"
        },
        {
          "id": "10_2",
          "title": "Один выбор предмета"
        },
        {
          "id": "10_3",
          "title": "Выбор без возвращения"
        },
        {
          "id": "10_4",
          "title": "Монета и частоты"
        },
        {
          "id": "10_5",
          "title": "Две игральные кости"
        },
        {
          "id": "10_6",
          "title": "Дерево вероятностей"
        },
        {
          "id": "10_7",
          "title": "Диаграмма Эйлера"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-10-outcomes",
        "title": "Благоприятные и все",
        "goal": "Определить равновозможные исходы и нужное событие.",
        "dependsOn": [],
        "foundations": [
          "data-probability",
          "fraction-part-whole"
        ],
        "covers": [
          "10_1",
          "10_2"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №10",
            "href": "/trainers/oge-task10-probability.html",
            "instruction": "Выбери «Равновозможные исходы», затем «Один выбор предмета». До дроби подпиши два количества.",
            "finish": "Реши 3 задачи и назови числитель и знаменатель каждой вероятности."
          }
        ],
        "explain": {
          "prompt": "Почему в знаменателе именно все возможные исходы этого опыта?",
          "criteria": [
            "Опыт назван точно.",
            "Обоснована равновозможность используемых исходов.",
            "Благоприятные исходы входят в общее количество."
          ]
        },
        "misconception": "Делят число нужных предметов на число ненужных.",
        "finish": "Реши 3 задачи и назови числитель и знаменатель каждой вероятности."
      },
      {
        "id": "oge-10-removed",
        "title": "Первый предмет уже вынут",
        "goal": "Обновить состав после известного первого выбора.",
        "dependsOn": [
          "oge-10-outcomes"
        ],
        "foundations": [
          "fraction-meaning",
          "data-probability"
        ],
        "covers": [
          "10_3"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №10",
            "href": "/trainers/oge-task10-probability.html",
            "instruction": "Выбери «Выбор без возвращения». Нарисуй состав до и после первого известного выбора.",
            "finish": "Реши 3 задачи с разными цветами вынутого предмета."
          }
        ],
        "explain": {
          "prompt": "Что изменилось в числителе и знаменателе второго выбора?",
          "criteria": [
            "Общее число уменьшено на один.",
            "Число нужных предметов изменено только при нужном первом цвете.",
            "Использовано условие известного первого выбора."
          ]
        },
        "misconception": "Оставляют прежний знаменатель после извлечения.",
        "finish": "Реши 3 задачи с разными цветами вынутого предмета."
      },
      {
        "id": "oge-10-frequency",
        "title": "Модель и результаты опытов",
        "goal": "Различать вероятность по модели и относительную частоту по данным.",
        "dependsOn": [
          "oge-10-outcomes"
        ],
        "foundations": [
          "data-tables",
          "data-probability"
        ],
        "covers": [
          "10_4"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №10",
            "href": "/trainers/oge-task10-probability.html",
            "instruction": "В «Монета и частоты» сначала реши задачу по исходам, затем по наблюдаемой частоте.",
            "finish": "Сделай 3 задачи и подпиши, где модель, а где данные опыта."
          }
        ],
        "explain": {
          "prompt": "Почему наблюдаемая доля может отличаться от вероятности по модели?",
          "criteria": [
            "Показано, какие числа получены в опыте.",
            "Частота найдена как отношение к числу испытаний.",
            "Равновозможность не приписана произвольным группам исходов."
          ]
        },
        "misconception": "Реальную частоту объявляют обязательным точным результатом следующей серии.",
        "finish": "Сделай 3 задачи и подпиши, где модель, а где данные опыта."
      },
      {
        "id": "oge-10-pairs",
        "title": "Две кости: считаем пары",
        "goal": "Учитывать порядок двух различимых результатов.",
        "dependsOn": [
          "oge-10-outcomes"
        ],
        "foundations": [
          "equal-groups",
          "data-tables",
          "data-probability"
        ],
        "covers": [
          "10_5"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №10",
            "href": "/trainers/oge-task10-probability.html",
            "instruction": "Выбери «Две игральные кости». Выпиши подходящие упорядоченные пары или отметь их в таблице 6 × 6.",
            "finish": "Реши 3 задачи на разные суммы."
          }
        ],
        "explain": {
          "prompt": "Почему пара (1;4) отличается от (4;1) в пространстве исходов?",
          "criteria": [
            "Описаны две различимые кости.",
            "Общее число исходов равно 6 · 6.",
            "Каждая подходящая пара учтена один раз."
          ]
        },
        "misconception": "Считают 11 возможных сумм равновозможными исходами.",
        "finish": "Реши 3 задачи на разные суммы."
      },
      {
        "id": "oge-10-tree",
        "title": "Два этапа опыта",
        "goal": "Умножать вдоль ветви и складывать несовместные пути.",
        "dependsOn": [
          "oge-10-removed",
          "oge-10-frequency"
        ],
        "foundations": [
          "fraction-product",
          "fraction-common-denominator",
          "data-probability"
        ],
        "covers": [
          "10_6"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №10",
            "href": "/trainers/oge-task10-probability.html",
            "instruction": "В «Дерево вероятностей» подпиши вероятность каждой ветви. Для выбранного события выдели все подходящие пути.",
            "finish": "Реши 3 задачи; хотя бы в одной событие получается двумя путями."
          }
        ],
        "explain": {
          "prompt": "Где ты умножал, а где складывал, и почему?",
          "criteria": [
            "Вероятности относятся к правильным этапам.",
            "Вдоль одного пути выполнено умножение.",
            "Сложены только отдельные подходящие пути."
          ]
        },
        "misconception": "Складывают вероятности последовательных этапов вместо умножения.",
        "finish": "Реши 3 задачи; хотя бы в одной событие получается двумя путями."
      },
      {
        "id": "oge-10-sets",
        "title": "Две группы и их пересечение",
        "goal": "Избежать двойного счёта и найти нужную часть множества.",
        "dependsOn": [
          "oge-10-outcomes",
          "oge-10-tree"
        ],
        "foundations": [
          "data-tables",
          "fraction-part-whole"
        ],
        "covers": [
          "10_7"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №10",
            "href": "/trainers/oge-task10-probability.html",
            "instruction": "Выбери «Диаграмма Эйлера». Заполни сначала пересечение, затем оставшиеся области.",
            "finish": "Реши 3 задачи: «только», «хотя бы одно» и «ни одного»."
          }
        ],
        "explain": {
          "prompt": "Какая область отвечает формулировке вопроса?",
          "criteria": [
            "Пересечение учтено один раз.",
            "Различены «только одно» и «хотя бы одно».",
            "Сумма непересекающихся областей даёт общее число."
          ]
        },
        "misconception": "При сложении двух групп дважды учитывают их пересечение.",
        "finish": "Реши 3 задачи: «только», «хотя бы одно» и «ни одного»."
      }
    ],
    "questions": [
      {
        "id": "oge-10-01",
        "nodeId": "oge-10-outcomes",
        "prompt": "В коробке 3 красных и 7 синих одинаковых на ощупь шаров. Наугад берут один. Какова вероятность красного?",
        "input": "number",
        "answer": "3/10",
        "hint": "Сначала посчитай все шары в коробке.",
        "explanation": "Всего 3+7=10 шаров, красных 3. Вероятность 3/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            [
              "add",
              3,
              7
            ]
          ]
        }
      },
      {
        "id": "oge-10-02",
        "nodeId": "oge-10-removed",
        "prompt": "Было 3 красных и 7 синих шаров. Первый вынутый шар оказался красным и не возвращён. Следующий шар берут наугад. Какова вероятность, что он будет красным?",
        "input": "number",
        "answer": "2/9",
        "hint": "Пересчитай состав оставшейся коробки.",
        "explanation": "Осталось 2 красных и 7 синих, всего 9. Вероятность 2/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              3,
              1
            ],
            [
              "sub",
              [
                "add",
                3,
                7
              ],
              1
            ]
          ]
        }
      },
      {
        "id": "oge-10-03",
        "nodeId": "oge-10-frequency",
        "prompt": "В 100 бросках монеты орёл выпал 37 раз. Найди относительную частоту орла.",
        "input": "number",
        "answer": "37/100",
        "hint": "Используй наблюдаемые данные, а не предполагаемую честность монеты.",
        "explanation": "Относительная частота равна 37:100 = 0,37.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            37,
            100
          ]
        }
      },
      {
        "id": "oge-10-04",
        "nodeId": "oge-10-pairs",
        "prompt": "Бросили две различимые честные шестигранные кости. Найди вероятность суммы 5.",
        "input": "number",
        "answer": "1/9",
        "hint": "Выпиши подходящие упорядоченные пары; все 36 пар равновозможны.",
        "explanation": "Подходящие упорядоченные пары: (1;4), (2;3), (3;2), (4;1). Всего равновозможных пар 6·6=36, поэтому вероятность 1/9.",
        "oracle": {
          "kind": "dice-sum",
          "sides": 6,
          "sum": 5
        }
      },
      {
        "id": "oge-10-05",
        "nodeId": "oge-10-tree",
        "prompt": "Две независимые проверки проходят успешно с вероятностями 0,8 и 0,9. Какова вероятность успеха обеих?",
        "input": "number",
        "answer": "0.72",
        "hint": "Это один путь из двух последовательных независимых успехов.",
        "explanation": "Для независимых событий вероятность обоих равна 0,8 · 0,9 = 0,72.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "0.8",
            "0.9"
          ]
        }
      },
      {
        "id": "oge-10-06",
        "nodeId": "oge-10-sets",
        "prompt": "Из 30 участников 18 занимаются шахматами, 14 — плаванием, 6 — обоими занятиями. Случайно выбран участник. Какова вероятность, что он занимается только шахматами?",
        "input": "number",
        "answer": "2/5",
        "hint": "Убери из шахматной группы её пересечение с плаванием.",
        "explanation": "Только шахматами занимаются 18−6=12 участников. Вероятность 12/30 = 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              18,
              6
            ],
            30
          ]
        }
      },
      {
        "id": "oge-10-07",
        "nodeId": "oge-10-outcomes",
        "prompt": "В мешке 5 зелёных и 3 белых одинаковых на ощупь жетона. Какова вероятность зелёного при одном случайном выборе?",
        "input": "number",
        "answer": "5/8",
        "hint": "Благоприятные жетоны являются частью всех жетонов.",
        "explanation": "Всего 8 жетонов; зелёных 5, поэтому вероятность 5/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            [
              "add",
              5,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-10-08",
        "nodeId": "oge-10-removed",
        "prompt": "В мешке 5 синих и 4 зелёных жетона. Известно, что сначала вынули зелёный и не вернули. Следующий жетон берут наугад. Какова вероятность, что он будет синим?",
        "input": "number",
        "answer": "5/8",
        "hint": "Подумай, изменилось ли число синих жетонов.",
        "explanation": "Синих осталось 5, всех жетонов 8. Вероятность 5/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            [
              "sub",
              [
                "add",
                5,
                4
              ],
              1
            ]
          ]
        }
      },
      {
        "id": "oge-10-09",
        "nodeId": "oge-10-frequency",
        "prompt": "Честную монету бросают два раза независимо. Какова вероятность двух орлов?",
        "input": "number",
        "answer": "1/4",
        "hint": "Перечисли четыре возможные пары результатов.",
        "explanation": "Равновозможны ОО, ОР, РО, РР. Подходит только ОО: вероятность 1/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "mul",
              2,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-10-10",
        "nodeId": "oge-10-pairs",
        "prompt": "Бросили две различимые честные шестигранные кости. Найди вероятность суммы 8.",
        "input": "number",
        "answer": "5/36",
        "hint": "Выпиши подходящие упорядоченные пары; все 36 пар равновозможны.",
        "explanation": "Подходящие упорядоченные пары: (2;6), (3;5), (4;4), (5;3), (6;2). Всего равновозможных пар 6·6=36, поэтому вероятность 5/36.",
        "oracle": {
          "kind": "dice-sum",
          "sides": 6,
          "sum": 8
        }
      },
      {
        "id": "oge-10-11",
        "nodeId": "oge-10-tree",
        "prompt": "Первый мешок выбирают с вероятностью 1/3, второй — с вероятностью 2/3. В первом доля красных шаров 2/5, во втором 3/4. После выбора мешка берут случайный шар. Найди вероятность красного.",
        "input": "number",
        "answer": "19/30",
        "hint": "Красный шар можно получить двумя несовместными путями.",
        "explanation": "(1/3)·(2/5) + (2/3)·(3/4) = 2/15 + 1/2 = 19/30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              "1/3",
              "2/5"
            ],
            [
              "mul",
              "2/3",
              "3/4"
            ]
          ]
        }
      },
      {
        "id": "oge-10-12",
        "nodeId": "oge-10-sets",
        "prompt": "Из 40 участников 22 посещают кружок A, 18 — кружок B, 8 — оба. Какова вероятность, что случайный участник посещает хотя бы один кружок?",
        "input": "number",
        "answer": "4/5",
        "hint": "При сложении численностей групп пересечение будет посчитано дважды.",
        "explanation": "Хотя бы один кружок посещают 22+18−8=32 человека. Вероятность 32/40 = 4/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              [
                "add",
                22,
                18
              ],
              8
            ],
            40
          ]
        }
      },
      {
        "id": "oge-10-13",
        "nodeId": "oge-10-outcomes",
        "prompt": "В коробке 4 зелёных и 5 белых одинаковых на ощупь шаров. Найди вероятность белого при одном случайном выборе.",
        "input": "number",
        "answer": "5/9",
        "hint": "В знаменателе нужно число всех доступных шаров.",
        "explanation": "Всего 9 шаров, белых 5. Вероятность 5/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            [
              "add",
              4,
              5
            ]
          ]
        }
      },
      {
        "id": "oge-10-14",
        "nodeId": "oge-10-removed",
        "prompt": "Было 6 белых и 5 чёрных шаров. Первый оказался белым и не возвращён. Следующий шар берут наугад. Найди вероятность, что он будет белым.",
        "input": "number",
        "answer": "1/2",
        "hint": "После известного белого шара изменяются оба нужных количества.",
        "explanation": "Белых осталось 5, всего 10. Вероятность 5/10 = 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              6,
              1
            ],
            [
              "sub",
              [
                "add",
                6,
                5
              ],
              1
            ]
          ]
        }
      },
      {
        "id": "oge-10-15",
        "nodeId": "oge-10-frequency",
        "prompt": "В 150 испытаниях событие произошло 60 раз. Найди его относительную частоту.",
        "input": "number",
        "answer": "2/5",
        "hint": "Раздели количество наступлений события на число испытаний.",
        "explanation": "60/150 = 2/5 = 0,4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            60,
            150
          ]
        }
      },
      {
        "id": "oge-10-16",
        "nodeId": "oge-10-pairs",
        "prompt": "Бросили две различимые честные шестигранные кости. Найди вероятность суммы 10.",
        "input": "number",
        "answer": "1/12",
        "hint": "Выпиши подходящие упорядоченные пары; все 36 пар равновозможны.",
        "explanation": "Подходящие упорядоченные пары: (4;6), (5;5), (6;4). Всего равновозможных пар 6·6=36, поэтому вероятность 1/12.",
        "oracle": {
          "kind": "dice-sum",
          "sides": 6,
          "sum": 10
        }
      },
      {
        "id": "oge-10-17",
        "nodeId": "oge-10-tree",
        "prompt": "Две независимые проверки успешны с вероятностями 0,6 и 0,7. Какова вероятность неуспеха обеих?",
        "input": "number",
        "answer": "0.12",
        "hint": "Сначала найди вероятность противоположного события для каждого этапа.",
        "explanation": "Вероятности неуспеха равны 0,4 и 0,3. Их произведение 0,12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "sub",
              1,
              "0.6"
            ],
            [
              "sub",
              1,
              "0.7"
            ]
          ]
        }
      },
      {
        "id": "oge-10-18",
        "nodeId": "oge-10-sets",
        "prompt": "Из 25 участников 13 изучают язык A, 12 — язык B, 5 — оба. Какова вероятность, что случайный участник не изучает ни одного из этих языков?",
        "input": "number",
        "answer": "1/5",
        "hint": "Сначала найди объединение двух групп, затем дополнение.",
        "explanation": "Хотя бы один язык изучают 13+12−5=20 человек. Ни одного — 5; вероятность 5/25 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              25,
              [
                "sub",
                [
                  "add",
                  13,
                  12
                ],
                5
              ]
            ],
            25
          ]
        }
      }
    ]
  },
  {
    "id": "oge-11",
    "taskNumbers": [
      11
    ],
    "title": "№11. График как зависимость: от точки к объяснению",
    "goal": "Пройти координаты, зависимость, таблицу и формулу, построение, параметры и обоснованное сопоставление.",
    "transferGoal": "Построй график по новой формуле, проверь дополнительную точку, затем реши одно смешанное сопоставление. Сохрани объяснение двумя признаками; просмотр модели сам по себе не подтверждает навык.",
    "source": {
      "href": "/trainers/oge-task11-graphs-trainer.html",
      "title": "ОГЭ №11 · исходный тренажёр",
      "trainerId": "oge-t11-grafiki"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task11-graphs-trainer.html",
      "selector": "SKILLS (9 навыков); #m4 [data-t] (5 видов сопоставления). Режимы m1–m6 — способы работы",
      "types": [
        {
          "id": "lin_k",
          "title": "Прямые: знак k (возрастает/убывает)"
        },
        {
          "id": "lin_b",
          "title": "Прямые: коэффициент b и ось y"
        },
        {
          "id": "par_a",
          "title": "Параболы: направление ветвей (знак a)"
        },
        {
          "id": "par_c",
          "title": "Параболы: пересечение с осью y (знак c)"
        },
        {
          "id": "par_vertex",
          "title": "Параболы: вершина и формула x₀ = −b/(2a)"
        },
        {
          "id": "hyp",
          "title": "Гиперболы: четверти и коэффициент"
        },
        {
          "id": "family",
          "title": "Узнавание семейства графика"
        },
        {
          "id": "build",
          "title": "Построение графика по точкам"
        },
        {
          "id": "oge",
          "title": "ОГЭ-сопоставление"
        },
        {
          "id": "t43",
          "title": "Сопоставление: Прямые"
        },
        {
          "id": "t42",
          "title": "Сопоставление: Формулы парабол"
        },
        {
          "id": "t44",
          "title": "Сопоставление: Гиперболы"
        },
        {
          "id": "t45",
          "title": "Сопоставление: Смешанные"
        },
        {
          "id": "t41",
          "title": "Сопоставление: Знаки a и c"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-11-coordinates",
        "title": "Координаты и семейства графиков",
        "goal": "Читать точку как пару значений, а не узнавать рисунок на глаз.",
        "dependsOn": [],
        "foundations": [
          "data-coordinates",
          "data-scales"
        ],
        "covers": [
          "family"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №11",
            "href": "/trainers/oge-task11-graphs-trainer.html",
            "instruction": "В режиме «Разминка: читаем график» сначала назови оси и координаты двух точек. Затем определи семейство графика.",
            "finish": "Прочитай 3 точки и различи 3 семейства."
          }
        ],
        "explain": {
          "prompt": "Что означают первая и вторая координаты точки на графике функции?",
          "criteria": [
            "Сначала прочитана горизонтальная координата x.",
            "Вертикальная координата y отнесена к тому же x.",
            "Использован масштаб каждой оси."
          ]
        },
        "misconception": "Переставляют x и y или считают один масштаб обязательным для обеих осей.",
        "finish": "Прочитай 3 точки и различи 3 семейства."
      },
      {
        "id": "oge-11-dependency",
        "title": "Как y зависит от x",
        "goal": "Связать изменение аргумента с изменением значения функции.",
        "dependsOn": [
          "oge-11-coordinates"
        ],
        "foundations": [
          "data-tables",
          "proportion-direct",
          "proportion-inverse"
        ],
        "covers": [
          "lin_k",
          "hyp"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №11",
            "href": "/trainers/oge-task11-graphs-trainer.html",
            "instruction": "В «Конструкторе функций» сравни прямую и гиперболу. Выбери два значения x и вычисли соответствующие y; затем исследуй модель гиперболы ниже.",
            "finish": "Сделай 2 пары вычислений и одно исследование модели."
          },
          {
            "title": "Гипербола: сдвиги и особый ноль",
            "href": "/trainers/oge-task11-graphs-trainer.html#oge-video-models",
            "instruction": "Открой страницу отдельно, разверни «Разобраться на модели» и выбери «Гипербола: сдвиги и особый ноль». Изменяй только a, затем только b; отдельно проверь k = 0.",
            "finish": "Сделай 3 наблюдения и запиши запрещённое значение x для каждого.",
            "investigationId": "hyperbola-domain"
          }
        ],
        "explain": {
          "prompt": "Всегда ли одинаковый шаг x даёт одинаковый шаг y?",
          "criteria": [
            "Для обеих точек подставлены конкретные x.",
            "Разность y сравнена с шагом x.",
            "Для гиперболы сохранён запрет нуля знаменателя."
          ]
        },
        "misconception": "Правило постоянного наклона прямой автоматически переносят на гиперболу.",
        "finish": "Сделай 2 пары вычислений и одно исследование модели."
      },
      {
        "id": "oge-11-table-formula",
        "title": "Таблица ↔ формула",
        "goal": "Проверить формулу по нескольким парам, включая x = 0, когда он допустим.",
        "dependsOn": [
          "oge-11-dependency"
        ],
        "foundations": [
          "data-tables",
          "expression-substitution"
        ],
        "covers": [
          "lin_b",
          "par_c"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №11",
            "href": "/trainers/oge-task11-graphs-trainer.html",
            "instruction": "В «Конструкторе функций» выпиши таблицу из 3 точек. По таблице предложи формулу и проверь каждую строку.",
            "finish": "Проверь 2 формулы по трём значениям x."
          }
        ],
        "explain": {
          "prompt": "Почему совпадения только в одной точке недостаточно?",
          "criteria": [
            "Проверены как минимум две различные точки.",
            "Свободный член связан со значением при x = 0, если оно существует.",
            "Все строки таблицы согласованы с формулой."
          ]
        },
        "misconception": "Выбирают формулу по одному совпавшему числу.",
        "finish": "Проверь 2 формулы по трём значениям x."
      },
      {
        "id": "oge-11-build",
        "title": "От таблицы к построению",
        "goal": "Построить подходящие точки и соединить их с учётом вида функции.",
        "dependsOn": [
          "oge-11-table-formula"
        ],
        "foundations": [
          "data-graph-building",
          "data-coordinates"
        ],
        "covers": [
          "build"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №11",
            "href": "/trainers/oge-task11-graphs-trainer.html",
            "instruction": "В режиме «Строим сами» сначала вычисли значения таблицы и построй график в тетради. Затем сравни его с графиком, который построит тренажёр после заполнения таблицы. Для гиперболы не соединяй ветви через разрыв.",
            "finish": "Построй 2 графика в тетради, сравни с тренажёром и проверь ещё одну точку каждого."
          }
        ],
        "explain": {
          "prompt": "Как ты проверил график точкой, которой не было в начальной таблице?",
          "criteria": [
            "Точки поставлены по вычисленным парам.",
            "Учитываются вид функции и допустимые x.",
            "Дополнительная точка лежит на построенном графике."
          ]
        },
        "misconception": "Соединяют любые точки одной ломаной и забывают об области определения.",
        "finish": "Построй 2 графика в тетради, сравни с тренажёром и проверь ещё одну точку каждого."
      },
      {
        "id": "oge-11-parameters",
        "title": "Параметры меняют определённые свойства",
        "goal": "Разделить наклон, сдвиг, направление ветвей и вершину.",
        "dependsOn": [
          "oge-11-build"
        ],
        "foundations": [
          "data-graph-reading",
          "equation-linear",
          "expression-substitution"
        ],
        "covers": [
          "par_a",
          "par_vertex",
          "t41",
          "t43"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №11",
            "href": "/trainers/oge-task11-graphs-trainer.html",
            "instruction": "Используй «Конструктор функций» и сопоставление «Знаки a и c» / «Прямые». Затем сравни k и b в модели прямой.",
            "finish": "Разбери 3 изменения параметров, каждый раз меняя только один."
          },
          {
            "title": "Прямая: наклон и сдвиг",
            "href": "/trainers/oge-task11-graphs-trainer.html#oge-video-models",
            "instruction": "На полной странице открой «Разобраться на модели» → «Прямая: наклон и сдвиг». Сначала меняй k при постоянном b, затем b при постоянном k.",
            "finish": "Сравни 2 пары графиков и запиши, что изменилось.",
            "investigationId": "line-parameters"
          }
        ],
        "explain": {
          "prompt": "Какой параметр отвечает за наблюдаемое изменение?",
          "criteria": [
            "Назван изменённый параметр.",
            "Остальные параметры оставлены постоянными.",
            "Для прямой проверены наклон и пересечение с осью y; для параболы — вершина или направление ветвей."
          ]
        },
        "misconception": "Путают вертикальный сдвиг и наклон или читают знак горизонтального сдвига буквально.",
        "finish": "Разбери 3 изменения параметров, каждый раз меняя только один."
      },
      {
        "id": "oge-11-explain-match",
        "title": "Сопоставляем и обосновываем",
        "goal": "Связать формулу с несколькими проверяемыми свойствами графика.",
        "dependsOn": [
          "oge-11-parameters"
        ],
        "foundations": [
          "data-graph-reading",
          "expression-powers-roots",
          "signed-multiplication"
        ],
        "covers": [
          "oge",
          "t42",
          "t44",
          "t45"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №11",
            "href": "/trainers/oge-task11-graphs-trainer.html",
            "instruction": "В сопоставлении реши «Формулы парабол», «Гиперболы» и «Смешанные». Для каждой выбранной пары назови два признака.",
            "finish": "Закончи 3 сопоставления и сохрани обоснование одной пары."
          }
        ],
        "explain": {
          "prompt": "Какие два независимых признака подтверждают твоё соответствие?",
          "criteria": [
            "Совпадает семейство и направление ветвей или монотонность.",
            "Проверена заметная точка, вершина или асимптота.",
            "Отклонён хотя бы один другой вариант с конкретной причиной."
          ]
        },
        "misconception": "Соответствие выбирают только по общему силуэту.",
        "finish": "Закончи 3 сопоставления и сохрани обоснование одной пары."
      }
    ],
    "questions": [
      {
        "id": "oge-11-01",
        "nodeId": "oge-11-coordinates",
        "prompt": "На координатной сетке отмечена точка A. Чему равна её координата y?",
        "input": "number",
        "answer": "3",
        "hint": "Координата y читается по вертикальной оси.",
        "explanation": "Точка A имеет координаты (−2;3), поэтому y = 3.",
        "oracle": {
          "kind": "visual-coordinate",
          "label": "A",
          "axis": "y"
        },
        "visual": {
          "type": "graph",
          "xmin": -5,
          "xmax": 5,
          "ymin": -4,
          "ymax": 5,
          "step": 1,
          "points": [
            {
              "x": -2,
              "y": 3,
              "label": "A"
            }
          ],
          "segments": []
        }
      },
      {
        "id": "oge-11-02",
        "nodeId": "oge-11-dependency",
        "prompt": "Дана функция y = −2x + 5. Аргумент x увеличили на 3. На сколько изменилось y? Запиши изменение со знаком.",
        "input": "number",
        "answer": "-6",
        "hint": "У прямой свободный член при вычитании двух значений сократится.",
        "explanation": "Δy = −2 · Δx = −2 · 3 = −6: значение уменьшилось на 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -2,
            3
          ]
        }
      },
      {
        "id": "oge-11-03",
        "nodeId": "oge-11-table-formula",
        "prompt": "Какая формула согласуется со всеми строками таблицы?",
        "input": "choice",
        "answer": "y = 2x + 3",
        "choices": [
          "y = −2x + 3",
          "y = 2x + 3",
          "y = 3x + 2"
        ],
        "hint": "Подставь в каждый вариант как минимум два разных x.",
        "explanation": "При y = 2x+3 получаем значения 1,3,5 для x = −1,0,1. Остальные варианты не совпадают со всей таблицей.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        -1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -2,
                      -1
                    ],
                    3
                  ],
                  1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -2,
                      0
                    ],
                    3
                  ],
                  3
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -2,
                      1
                    ],
                    3
                  ],
                  5
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        -1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      -1
                    ],
                    3
                  ],
                  1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      0
                    ],
                    3
                  ],
                  3
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      1
                    ],
                    3
                  ],
                  5
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        -1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      3,
                      -1
                    ],
                    2
                  ],
                  1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      3,
                      0
                    ],
                    2
                  ],
                  3
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      3,
                      1
                    ],
                    2
                  ],
                  5
                ],
                2
              ]
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "x",
            "y"
          ],
          "rows": [
            [
              -1,
              1
            ],
            [
              0,
              3
            ],
            [
              1,
              5
            ]
          ]
        }
      },
      {
        "id": "oge-11-04",
        "nodeId": "oge-11-build",
        "prompt": "Строят график y = 2x − 1. Какую координату y имеет его точка с x = 3?",
        "input": "number",
        "answer": "5",
        "hint": "Подставь абсциссу в формулу до нанесения точки.",
        "explanation": "y = 2·3−1 = 5. На графике ставится точка (3;5).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              3
            ],
            1
          ]
        }
      },
      {
        "id": "oge-11-05",
        "nodeId": "oge-11-parameters",
        "prompt": "Парабола задана формулой y = 3(x − 2)² − 4. Найди x её вершины.",
        "input": "number",
        "answer": "2",
        "hint": "В вершине квадрат в этой записи обращается в ноль.",
        "explanation": "x−2 = 0, значит x = 2; вершина (2;−4).",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -2,
          "c": 0
        }
      },
      {
        "id": "oge-11-06",
        "nodeId": "oge-11-explain-match",
        "prompt": "Гипербола y = k/x проходит через точку (2;−3). Найди k.",
        "input": "number",
        "answer": "-6",
        "hint": "Умножь равенство y = k/x на ненулевое x.",
        "explanation": "k = x·y = 2·(−3) = −6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            -3
          ]
        }
      },
      {
        "id": "oge-11-07",
        "nodeId": "oge-11-coordinates",
        "prompt": "У точки B на сетке найди координату x.",
        "input": "number",
        "answer": "3",
        "hint": "Абсцисса читается по горизонтальной оси.",
        "explanation": "B имеет координаты (3;−1), поэтому x = 3.",
        "oracle": {
          "kind": "visual-coordinate",
          "label": "B",
          "axis": "x"
        },
        "visual": {
          "type": "graph",
          "xmin": -5,
          "xmax": 5,
          "ymin": -4,
          "ymax": 5,
          "step": 1,
          "points": [
            {
              "x": 3,
              "y": -1,
              "label": "B"
            }
          ],
          "segments": []
        }
      },
      {
        "id": "oge-11-08",
        "nodeId": "oge-11-dependency",
        "prompt": "Для y = 6/x аргумент изменили с 2 до 3. Найди изменение y: новое значение минус старое.",
        "input": "number",
        "answer": "-1",
        "hint": "Вычисли оба значения по формуле; здесь нет постоянного наклона.",
        "explanation": "При x=2 значение 3, при x=3 значение 2. Изменение 2−3 = −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              6,
              3
            ],
            [
              "div",
              6,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-11-09",
        "nodeId": "oge-11-table-formula",
        "prompt": "Выбери формулу, которая задаёт таблицу.",
        "input": "choice",
        "answer": "y = x² − 1",
        "choices": [
          "y = x² − 1",
          "y = x² + 1",
          "y = 2x − 1"
        ],
        "hint": "Проверь все три строки: две разные формулы иногда совпадают в отдельных точках.",
        "explanation": "x²−1 даёт −1,0,3 при x=0,1,2. Линейный вариант не совпадает при x=1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      0
                    ],
                    -1
                  ],
                  -1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      1
                    ],
                    -1
                  ],
                  0
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      2
                    ],
                    -1
                  ],
                  3
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      0
                    ],
                    1
                  ],
                  -1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      1
                    ],
                    1
                  ],
                  0
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      2
                    ],
                    1
                  ],
                  3
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      0
                    ],
                    -1
                  ],
                  -1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      1
                    ],
                    -1
                  ],
                  0
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      2
                    ],
                    -1
                  ],
                  3
                ],
                2
              ]
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "x",
            "y"
          ],
          "rows": [
            [
              0,
              -1
            ],
            [
              1,
              0
            ],
            [
              2,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-11-10",
        "nodeId": "oge-11-build",
        "prompt": "Строят y = (x + 1)². Найди y точки с x = −3.",
        "input": "number",
        "answer": "4",
        "hint": "Сначала выполни действие в скобках, затем возведи в квадрат.",
        "explanation": "y = (−3+1)² = (−2)² = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            [
              "add",
              -3,
              1
            ],
            2
          ]
        }
      },
      {
        "id": "oge-11-11",
        "nodeId": "oge-11-parameters",
        "prompt": "Прямая проходит через (−1;5) и (2;−1). Найди её коэффициент k.",
        "input": "number",
        "answer": "-2",
        "hint": "Раздели изменение y на соответствующее изменение x.",
        "explanation": "k = (−1−5)/(2−(−1)) = −6/3 = −2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              -1,
              5
            ],
            [
              "sub",
              2,
              -1
            ]
          ]
        }
      },
      {
        "id": "oge-11-12",
        "nodeId": "oge-11-explain-match",
        "prompt": "Какая прямая проходит через обе точки (0;−2) и (2;4)?",
        "input": "choice",
        "answer": "y = 3x − 2",
        "choices": [
          "y = 3x − 2",
          "y = 2x − 2",
          "y = −3x + 2"
        ],
        "hint": "Одна точка проверит свободный член, другая — наклон.",
        "explanation": "Для y=3x−2: при x=0 получается −2, при x=2 получается 4. Оба условия выполнены.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      3,
                      0
                    ],
                    -2
                  ],
                  -2
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      3,
                      2
                    ],
                    -2
                  ],
                  4
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      0
                    ],
                    -2
                  ],
                  -2
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      2,
                      2
                    ],
                    -2
                  ],
                  4
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -3,
                      0
                    ],
                    2
                  ],
                  -2
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -3,
                      2
                    ],
                    2
                  ],
                  4
                ],
                2
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-11-13",
        "nodeId": "oge-11-coordinates",
        "prompt": "Прочитай координату y отмеченной точки C.",
        "input": "number",
        "answer": "-2",
        "hint": "Не перепутай горизонтальное и вертикальное расстояния от осей.",
        "explanation": "C имеет координаты (−4;−2). Вертикальная координата равна −2.",
        "oracle": {
          "kind": "visual-coordinate",
          "label": "C",
          "axis": "y"
        },
        "visual": {
          "type": "graph",
          "xmin": -5,
          "xmax": 5,
          "ymin": -4,
          "ymax": 5,
          "step": 1,
          "points": [
            {
              "x": -4,
              "y": -2,
              "label": "C"
            }
          ],
          "segments": []
        }
      },
      {
        "id": "oge-11-14",
        "nodeId": "oge-11-dependency",
        "prompt": "Для y = 1,5x − 4 аргумент увеличили на 2. Найди изменение y со знаком.",
        "input": "number",
        "answer": "3",
        "hint": "Для прямой используй коэффициент при x и величину шага.",
        "explanation": "Δy = 1,5 · 2 = 3; значение увеличилось на 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "1.5",
            2
          ]
        }
      },
      {
        "id": "oge-11-15",
        "nodeId": "oge-11-table-formula",
        "prompt": "Какая зависимость соответствует таблице?",
        "input": "choice",
        "answer": "y = 8/x",
        "choices": [
          "y = 4/x",
          "y = 8x",
          "y = 8/x"
        ],
        "hint": "Проверь больше одной строки; при обратной зависимости произведение x·y постоянно.",
        "explanation": "Для всех строк x·y = 8, поэтому y = 8/x. Здесь x не равен нулю.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "div",
                    4,
                    1
                  ],
                  8
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "div",
                    4,
                    2
                  ],
                  4
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "div",
                    4,
                    4
                  ],
                  2
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "mul",
                    8,
                    1
                  ],
                  8
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "mul",
                    8,
                    2
                  ],
                  4
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "mul",
                    8,
                    4
                  ],
                  2
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "div",
                    8,
                    1
                  ],
                  8
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "div",
                    8,
                    2
                  ],
                  4
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "div",
                    8,
                    4
                  ],
                  2
                ],
                2
              ]
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "x",
            "y"
          ],
          "rows": [
            [
              1,
              8
            ],
            [
              2,
              4
            ],
            [
              4,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-11-16",
        "nodeId": "oge-11-build",
        "prompt": "На графике y = 12/x нужна точка с x = −4. Найди её y.",
        "input": "number",
        "answer": "-3",
        "hint": "Проверь допустимость x, затем выполни деление со знаком.",
        "explanation": "x = −4 допустимо; y = 12:(−4) = −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            -4
          ]
        }
      },
      {
        "id": "oge-11-17",
        "nodeId": "oge-11-parameters",
        "prompt": "Найди абсциссу вершины параболы y = −2(x + 3)² + 1.",
        "input": "number",
        "answer": "-3",
        "hint": "Обнули выражение внутри скобок, которое возводится в квадрат; знак перед квадратом не меняет x вершины.",
        "explanation": "x+3 = 0, поэтому x = −3; вершина (−3;1).",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 3,
          "c": 0
        }
      },
      {
        "id": "oge-11-18",
        "nodeId": "oge-11-explain-match",
        "prompt": "Парабола проходит через (0;4), (1;3) и (2;0). Какая формула подходит?",
        "input": "choice",
        "answer": "y = 4 − x²",
        "choices": [
          "y = x² + 4",
          "y = 4 − 2x",
          "y = 4 − x²"
        ],
        "hint": "Сравни все три пары координат, а не только пересечение с осью y.",
        "explanation": "4−x² даёт 4,3,0 при x=0,1,2. Линейный вариант ошибается при x=1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      0
                    ],
                    4
                  ],
                  4
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      1
                    ],
                    4
                  ],
                  3
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      1,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      2
                    ],
                    4
                  ],
                  0
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -2,
                      0
                    ],
                    4
                  ],
                  4
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -2,
                      1
                    ],
                    4
                  ],
                  3
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      0,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      -2,
                      2
                    ],
                    4
                  ],
                  0
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      -1,
                      [
                        "pow",
                        0,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      0
                    ],
                    4
                  ],
                  4
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      -1,
                      [
                        "pow",
                        1,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      1
                    ],
                    4
                  ],
                  3
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "add",
                    [
                      "mul",
                      -1,
                      [
                        "pow",
                        2,
                        2
                      ]
                    ],
                    [
                      "mul",
                      0,
                      2
                    ],
                    4
                  ],
                  0
                ],
                2
              ]
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-12",
    "taskNumbers": [
      12
    ],
    "title": "№12. Формула: смысл, преобразование, проверка",
    "goal": "Читать формулу вместе с величинами и единицами, уверенно находить неизвестное.",
    "transferGoal": "Реши 3 карточки: прямую подстановку, выражение неизвестной и задачу с переводом единиц. Сохрани формулу до чисел и обратную проверку хотя бы одной задачи.",
    "source": {
      "href": "/trainers/oge-task12-formulas-trainer.html",
      "title": "ОГЭ №12 · исходный тренажёр",
      "trainerId": "oge-t12-formuly"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task12-formulas-trainer.html",
      "selector": "TYPES: карточки типов 1–10",
      "types": [
        {
          "id": "1",
          "title": "Прямая подстановка"
        },
        {
          "id": "2",
          "title": "Выразить неизвестную"
        },
        {
          "id": "3",
          "title": "Сумма и произведение"
        },
        {
          "id": "4",
          "title": "Формула с дробью"
        },
        {
          "id": "5",
          "title": "Квадрат и степень"
        },
        {
          "id": "6",
          "title": "Корень"
        },
        {
          "id": "7",
          "title": "Десятичные дроби"
        },
        {
          "id": "8",
          "title": "Отрицательные числа"
        },
        {
          "id": "9",
          "title": "Большие числа"
        },
        {
          "id": "10",
          "title": "Внимание к условию"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-12-read",
        "title": "Какая величина нужна",
        "goal": "Отделить цель и нужные данные от лишних чисел.",
        "dependsOn": [],
        "foundations": [
          "percent-read-question",
          "expression-structure"
        ],
        "covers": [
          "10"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №12",
            "href": "/trainers/oge-task12-formulas-trainer.html",
            "instruction": "В типе «Внимание к условию» сначала выпиши искомую букву и формулу, затем зачеркни данные, которых в ней нет.",
            "finish": "Реши 3 карточки, в одной должны быть лишние данные."
          }
        ],
        "explain": {
          "prompt": "Какие данные ты использовал и почему остальные не понадобились?",
          "criteria": [
            "Названа искомая величина.",
            "Каждое используемое число связано с буквой формулы.",
            "Лишнее число исключено с объяснением."
          ]
        },
        "misconception": "Подставляют все числа из текста в произвольном порядке.",
        "finish": "Реши 3 карточки, в одной должны быть лишние данные."
      },
      {
        "id": "oge-12-substitute",
        "title": "Подставляем числа со знаками",
        "goal": "Заменить каждую букву её значением, сохранив скобки.",
        "dependsOn": [
          "oge-12-read"
        ],
        "foundations": [
          "expression-substitution",
          "signed-brackets"
        ],
        "covers": [
          "1",
          "8"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №12",
            "href": "/trainers/oge-task12-formulas-trainer.html",
            "instruction": "Чередуй «Прямая подстановка» и «Отрицательные числа». Отрицательные значения сначала заключай в скобки.",
            "finish": "Сделай 3 подстановки с полной промежуточной записью."
          }
        ],
        "explain": {
          "prompt": "Где в твоей записи находится знак каждого подставленного числа?",
          "criteria": [
            "Каждая буква заменена именно своим значением.",
            "Отрицательные числа заключены в скобки в произведениях и разностях.",
            "Вычисление следует порядку действий."
          ]
        },
        "misconception": "Теряют минус при подстановке или подставляют значение соседней буквы.",
        "finish": "Сделай 3 подстановки с полной промежуточной записью."
      },
      {
        "id": "oge-12-isolate",
        "title": "Выражаем неизвестную",
        "goal": "Обратить формулу до подстановки или решить полученное равенство.",
        "dependsOn": [
          "oge-12-substitute"
        ],
        "foundations": [
          "equation-inverse",
          "equation-linear",
          "percent-proportion"
        ],
        "covers": [
          "2"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №12",
            "href": "/trainers/oge-task12-formulas-trainer.html",
            "instruction": "Выбери «Выразить неизвестную». Один раз сначала преобразуй буквенную формулу, другой — подставь числа и реши равенство.",
            "finish": "Найди 3 неизвестные величины и проверь обратной подстановкой."
          }
        ],
        "explain": {
          "prompt": "Какое обратное действие возвращает неизвестную?",
          "criteria": [
            "Неизвестная выделена после равносильного действия.",
            "Делитель проверен на ноль.",
            "Подстановка найденного значения восстанавливает данное равенство."
          ]
        },
        "misconception": "Умножают вместо деления или делят только часть суммы.",
        "finish": "Найди 3 неизвестные величины и проверь обратной подстановкой."
      },
      {
        "id": "oge-12-structure",
        "title": "Формула с суммой и дробью",
        "goal": "Увидеть целый числитель и целый знаменатель.",
        "dependsOn": [
          "oge-12-isolate"
        ],
        "foundations": [
          "expression-structure",
          "fraction-order"
        ],
        "covers": [
          "3",
          "4"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №12",
            "href": "/trainers/oge-task12-formulas-trainer.html",
            "instruction": "Выбери «Сумма и произведение», затем «Формула с дробью». Обведи числитель и знаменатель до вычисления.",
            "finish": "Реши 3 задачи и пронумеруй действия."
          }
        ],
        "explain": {
          "prompt": "Какие части формулы должны быть вычислены целиком?",
          "criteria": [
            "Сумма в числителе или знаменателе сохранена скобками.",
            "Умножение выполнено до сложения там, где нет скобок.",
            "Последнее деление относится ко всему числителю."
          ]
        },
        "misconception": "Делят только последнее слагаемое числителя.",
        "finish": "Реши 3 задачи и пронумеруй действия."
      },
      {
        "id": "oge-12-power-root",
        "title": "Квадрат и обратное действие",
        "goal": "Различать удвоение, квадрат и арифметический корень.",
        "dependsOn": [
          "oge-12-structure"
        ],
        "foundations": [
          "expression-powers-roots",
          "equation-exam-transfer"
        ],
        "covers": [
          "5",
          "6"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №12",
            "href": "/trainers/oge-task12-formulas-trainer.html",
            "instruction": "В типах «Квадрат и степень» и «Корень» запиши отдельно степень или корень, а затем верни остальные множители.",
            "finish": "Реши по 2 задачи на квадрат и корень."
          }
        ],
        "explain": {
          "prompt": "Как можно проверить найденную положительную величину?",
          "criteria": [
            "Степень вычислена как повторное умножение.",
            "Корень выбран с допустимым знаком для величины.",
            "Обратная проверка восстановила исходный квадрат."
          ]
        },
        "misconception": "Заменяют v² на 2v или забывают коэффициент перед корнем.",
        "finish": "Реши по 2 задачи на квадрат и корень."
      },
      {
        "id": "oge-12-units",
        "title": "Единицы и величина результата",
        "goal": "Согласовать время, длину и десятичный масштаб.",
        "dependsOn": [
          "oge-12-power-root"
        ],
        "foundations": [
          "geometry-units",
          "decimal-multiply",
          "division-decimal-divisor"
        ],
        "covers": [
          "7",
          "9"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №12",
            "href": "/trainers/oge-task12-formulas-trainer.html",
            "instruction": "Чередуй «Десятичные дроби» и «Большие числа». До формулы переведи все данные в совместимые единицы.",
            "finish": "Реши 3 задачи и подпиши единицы ответа."
          }
        ],
        "explain": {
          "prompt": "Как перевод единиц повлиял на число в формуле?",
          "criteria": [
            "Все величины приведены к согласованным единицам.",
            "Разряды при умножении или делении проверены.",
            "Единица и порядок величины ответа соответствуют вопросу."
          ]
        },
        "misconception": "Подставляют минуты в формулу со скоростью в километрах в час.",
        "finish": "Реши 3 задачи и подпиши единицы ответа."
      }
    ],
    "questions": [
      {
        "id": "oge-12-01",
        "nodeId": "oge-12-read",
        "prompt": "По формуле S = vt нужно найти путь. Дано v = 12 км/ч, t = 3 ч, масса груза 2 кг. Какое вычисление нужно?",
        "input": "choice",
        "answer": "12 · 3",
        "choices": [
          "12 · 3",
          "12 + 3",
          "12 · 2"
        ],
        "hint": "Сопоставь буквы формулы с величинами, а не со всеми числами подряд.",
        "explanation": "В формуле пути участвуют скорость и время: S = 12·3. Масса груза не используется.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            12,
            3
          ],
          "values": [
            [
              "mul",
              12,
              3
            ],
            [
              "add",
              12,
              3
            ],
            [
              "mul",
              12,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-12-02",
        "nodeId": "oge-12-substitute",
        "prompt": "Найди y = 2x − 3 при x = −4.",
        "input": "number",
        "answer": "-11",
        "hint": "Подставь отрицательное число в скобках.",
        "explanation": "y = 2·(−4)−3 = −8−3 = −11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              -4
            ],
            3
          ]
        }
      },
      {
        "id": "oge-12-03",
        "nodeId": "oge-12-isolate",
        "prompt": "Из U = IR найди R, если U = 24 и I = 3.",
        "input": "number",
        "answer": "8",
        "hint": "Раздели обе части формулы на известный ненулевой множитель.",
        "explanation": "R = U/I = 24/3 = 8. Проверка: 3·8 = 24.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 0,
          "c": 24
        }
      },
      {
        "id": "oge-12-04",
        "nodeId": "oge-12-structure",
        "prompt": "По формуле h = at²/2 найди h при a = 4, t = 3.",
        "input": "number",
        "answer": "18",
        "hint": "Сначала вычисли степень, затем произведение и деление.",
        "explanation": "h = 4·3²/2 = 4·9/2 = 18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              [
                "pow",
                3,
                2
              ]
            ],
            2
          ]
        }
      },
      {
        "id": "oge-12-05",
        "nodeId": "oge-12-power-root",
        "prompt": "По формуле T = 2√L найди T, если L = 9.",
        "input": "number",
        "answer": "6",
        "hint": "Сначала извлеки корень, а затем умножь на коэффициент.",
        "explanation": "√9 = 3, поэтому T = 2·3 = 6.",
        "oracle": {
          "kind": "square-root",
          "radicand": 36
        }
      },
      {
        "id": "oge-12-06",
        "nodeId": "oge-12-units",
        "prompt": "Мощность P = UI. Найди P в ваттах при U = 220 В и I = 0,05 А.",
        "input": "number",
        "answer": "11",
        "hint": "Умножение на 0,05 можно проверить как деление на 20.",
        "explanation": "P = 220·0,05 = 11 Вт.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            220,
            "0.05"
          ]
        }
      },
      {
        "id": "oge-12-07",
        "nodeId": "oge-12-read",
        "prompt": "Площадь прямоугольника S = ab. Стороны 4 м и 7 м, масса покрытия 3 кг. Как вычислить площадь?",
        "input": "choice",
        "answer": "4 · 7",
        "choices": [
          "4 + 7",
          "2 · (4 + 7)",
          "4 · 7"
        ],
        "hint": "Найди величины, обозначенные a и b.",
        "explanation": "Площадь равна произведению сторон 4·7; масса покрытия в эту формулу не входит.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            4,
            7
          ],
          "values": [
            [
              "add",
              4,
              7
            ],
            [
              "mul",
              2,
              [
                "add",
                4,
                7
              ]
            ],
            [
              "mul",
              4,
              7
            ]
          ]
        }
      },
      {
        "id": "oge-12-08",
        "nodeId": "oge-12-substitute",
        "prompt": "Найди s = s₀ + vt при s₀ = 10, v = −2, t = 3.",
        "input": "number",
        "answer": "4",
        "hint": "Сохрани знак скорости в произведении.",
        "explanation": "s = 10 + (−2)·3 = 10−6 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            10,
            [
              "mul",
              -2,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-12-09",
        "nodeId": "oge-12-isolate",
        "prompt": "Из S = ab найди b при S = 45 и a = 5.",
        "input": "number",
        "answer": "9",
        "hint": "Обрати умножение, выделив искомую сторону.",
        "explanation": "b = S/a = 45/5 = 9. Проверка: 5·9 = 45.",
        "oracle": {
          "kind": "linear",
          "a": 5,
          "b": 0,
          "c": 45
        }
      },
      {
        "id": "oge-12-10",
        "nodeId": "oge-12-structure",
        "prompt": "Площадь трапеции S = (a+b)h/2. Найди S при a = 4, b = 8, h = 5.",
        "input": "number",
        "answer": "30",
        "hint": "В дроби делится весь числитель, включая сумму оснований.",
        "explanation": "S = (4+8)·5/2 = 12·5/2 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              [
                "add",
                4,
                8
              ],
              5
            ],
            2
          ]
        }
      },
      {
        "id": "oge-12-11",
        "nodeId": "oge-12-power-root",
        "prompt": "По формуле E = mv²/2 найди положительную скорость v, если E = 50, m = 4.",
        "input": "number",
        "answer": "5",
        "hint": "Сначала выдели v², затем найди положительный корень.",
        "explanation": "v² = 2E/m = 100/4 = 25. Положительная скорость v = 5.",
        "oracle": {
          "kind": "square-root",
          "radicand": 25
        }
      },
      {
        "id": "oge-12-12",
        "nodeId": "oge-12-units",
        "prompt": "Путь S = vt. Скорость 72 км/ч, время 30 минут. Найди путь в километрах.",
        "input": "number",
        "answer": "36",
        "hint": "Скорость дана за час, поэтому время тоже нужно выразить в часах.",
        "explanation": "30 минут = 1/2 часа. S = 72·1/2 = 36 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            72,
            [
              "div",
              30,
              60
            ]
          ]
        }
      },
      {
        "id": "oge-12-13",
        "nodeId": "oge-12-read",
        "prompt": "Масса m = ρV. Плотность 2,5 г/см³, объём 4 см³, температура 20 °C. Как вычислить массу?",
        "input": "choice",
        "answer": "2,5 · 4",
        "choices": [
          "2,5 : 4",
          "2,5 · 4",
          "2,5 · 20"
        ],
        "hint": "Прочитай смысл каждой буквы в данной формуле.",
        "explanation": "m = ρV = 2,5·4. Температура не является отдельным множителем в этой формуле.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "2.5",
            4
          ],
          "values": [
            [
              "div",
              "2.5",
              4
            ],
            [
              "mul",
              "2.5",
              4
            ],
            [
              "mul",
              "2.5",
              20
            ]
          ]
        }
      },
      {
        "id": "oge-12-14",
        "nodeId": "oge-12-substitute",
        "prompt": "Найди t = 2a − b при a = −3 и b = −5.",
        "input": "number",
        "answer": "-1",
        "hint": "Минус перед b остаётся действием вычитания.",
        "explanation": "t = 2·(−3)−(−5) = −6+5 = −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              -3
            ],
            -5
          ]
        }
      },
      {
        "id": "oge-12-15",
        "nodeId": "oge-12-isolate",
        "prompt": "В формуле y = 3x + 2 известно y = 17. Найди x.",
        "input": "number",
        "answer": "5",
        "hint": "Сначала убери свободное слагаемое, затем коэффициент.",
        "explanation": "3x+2 = 17; 3x = 15; x = 5.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 2,
          "c": 17
        }
      },
      {
        "id": "oge-12-16",
        "nodeId": "oge-12-structure",
        "prompt": "Средняя скорость v = (s₁+s₂)/(t₁+t₂). Дано s₁ = 12 км, s₂ = 18 км, t₁ = 0,5 ч, t₂ = 1 ч. Найди v в км/ч.",
        "input": "number",
        "answer": "20",
        "hint": "Сложи весь путь и всё время отдельно.",
        "explanation": "v = (12+18)/(0,5+1) = 30/1,5 = 20 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              12,
              18
            ],
            [
              "add",
              "0.5",
              1
            ]
          ]
        }
      },
      {
        "id": "oge-12-17",
        "nodeId": "oge-12-power-root",
        "prompt": "По формуле A = 3r² найди A, если r = 4.",
        "input": "number",
        "answer": "48",
        "hint": "Квадрат относится только к r; коэффициент умножается после него.",
        "explanation": "A = 3·4² = 3·16 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "pow",
              4,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-12-18",
        "nodeId": "oge-12-units",
        "prompt": "Масса m = ρV. Плотность 7800 кг/м³, объём 0,002 м³. Найди массу в килограммах.",
        "input": "number",
        "answer": "15.6",
        "hint": "Прикинь: объём составляет две тысячные кубического метра.",
        "explanation": "m = 7800·0,002 = 15,6 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7800,
            "0.002"
          ]
        }
      }
    ]
  },
  {
    "id": "oge-13",
    "taskNumbers": [
      13
    ],
    "title": "№13. Неравенство, промежуток и проверка",
    "goal": "Согласовать преобразование, границы и множество решений для линейных, квадратных неравенств и систем.",
    "transferGoal": "Реши одно линейное, одно квадратное неравенство и одну систему. Для каждого проверь границу, внутреннюю и внешнюю точку; одно обоснование запиши своими словами.",
    "source": {
      "href": "/trainers/oge13-inequalities-series.html",
      "title": "ОГЭ №13 · исходный тренажёр",
      "trainerId": "oge13InequalitiesSeries"
    },
    "inventory": {
      "sourcePath": "trainers/oge13-inequalities-series.html",
      "selector": "#taskPicker: DATA[module][index], значение module:index",
      "types": [
        {
          "id": "linear:0",
          "title": "Линейные — 1"
        },
        {
          "id": "linear:1",
          "title": "Линейные — 2"
        },
        {
          "id": "linear:2",
          "title": "Линейные — 3"
        },
        {
          "id": "linear:3",
          "title": "Линейные — 4"
        },
        {
          "id": "linear:4",
          "title": "Линейные — 5"
        },
        {
          "id": "linear:5",
          "title": "Линейные — 6"
        },
        {
          "id": "quad:0",
          "title": "Квадратные — 1"
        },
        {
          "id": "quad:1",
          "title": "Квадратные — 2"
        },
        {
          "id": "quad:2",
          "title": "Квадратные — 3"
        },
        {
          "id": "quad:3",
          "title": "Квадратные — 4"
        },
        {
          "id": "quad:4",
          "title": "Квадратные — 5"
        },
        {
          "id": "quad:5",
          "title": "Квадратные — 6"
        },
        {
          "id": "quad:6",
          "title": "Квадратные — 7"
        },
        {
          "id": "quad:7",
          "title": "Квадратные — 8"
        },
        {
          "id": "graph:0",
          "title": "По рисунку — 1"
        },
        {
          "id": "graph:1",
          "title": "По рисунку — 2"
        },
        {
          "id": "graph:2",
          "title": "По рисунку — 3"
        },
        {
          "id": "graph:3",
          "title": "По рисунку — 4"
        },
        {
          "id": "special:0",
          "title": "Нет/любое — 1"
        },
        {
          "id": "special:1",
          "title": "Нет/любое — 2"
        },
        {
          "id": "special:2",
          "title": "Нет/любое — 3"
        },
        {
          "id": "special:3",
          "title": "Нет/любое — 4"
        },
        {
          "id": "systems:0",
          "title": "Системы — 1"
        },
        {
          "id": "systems:1",
          "title": "Системы — 2"
        },
        {
          "id": "systems:2",
          "title": "Системы — 3"
        },
        {
          "id": "systems:3",
          "title": "Системы — 4"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-13-linear",
        "title": "Равносильные преобразования",
        "goal": "Переносить слагаемые и учитывать знак делителя.",
        "dependsOn": [],
        "foundations": [
          "inequality-linear",
          "signed-division"
        ],
        "covers": [
          "linear:0",
          "linear:1",
          "linear:2"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №13",
            "href": "/trainers/oge13-inequalities-series.html",
            "instruction": "В разделе «Линейные» реши задания 1–3. Под каждым делением подпиши знак делителя.",
            "finish": "Закончи 3 линейных неравенства с проверкой одного подходящего числа."
          }
        ],
        "explain": {
          "prompt": "Почему после деления знак сохранился или изменился?",
          "criteria": [
            "Одно действие сделано с обеими частями.",
            "Знак делителя назван явно.",
            "Пример подстановки подтверждает выбранное направление."
          ]
        },
        "misconception": "Меняют знак неравенства при любом переносе или не меняют при делении на отрицательное.",
        "finish": "Закончи 3 линейных неравенства с проверкой одного подходящего числа."
      },
      {
        "id": "oge-13-interval",
        "title": "Граница и её включение",
        "goal": "Перевести неравенство в промежуток и обратно.",
        "dependsOn": [
          "oge-13-linear"
        ],
        "foundations": [
          "inequality-number-line",
          "signed-number-line"
        ],
        "covers": [
          "linear:3",
          "linear:4",
          "linear:5",
          "graph:0",
          "graph:1",
          "graph:2",
          "graph:3"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №13",
            "href": "/trainers/oge13-inequalities-series.html",
            "instruction": "Закончи «Линейные» 4–6, затем в «По рисунку» сравни пустые и закрашенные граничные точки.",
            "finish": "Реши 2 линейные задачи и 2 задачи по рисунку."
          }
        ],
        "explain": {
          "prompt": "Чем строгая граница отличается от нестрогой при проверке числа?",
          "criteria": [
            "Граничное значение найдено.",
            "Равенство включено только при ≤ или ≥.",
            "Направление отмеченного промежутка проверено точкой."
          ]
        },
        "misconception": "Рисуют закрашенную точку при строгом неравенстве.",
        "finish": "Реши 2 линейные задачи и 2 задачи по рисунку."
      },
      {
        "id": "oge-13-quadratic",
        "title": "Квадратное неравенство: знаки по промежуткам",
        "goal": "Разделить ось корнями и выбрать нужные знаки.",
        "dependsOn": [
          "oge-13-interval"
        ],
        "foundations": [
          "expression-common-factor",
          "expression-powers-roots",
          "inequality-number-line"
        ],
        "covers": [
          "quad:0",
          "quad:1",
          "quad:2",
          "quad:3",
          "quad:4",
          "quad:5",
          "quad:6",
          "quad:7"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №13",
            "href": "/trainers/oge13-inequalities-series.html",
            "instruction": "В «Квадратные» выбери пример с квадратом и пример с произведением скобок. Отметь корни и проверь знак между ними и снаружи.",
            "finish": "Реши 3 квадратных неравенства разных знаков."
          }
        ],
        "explain": {
          "prompt": "Почему выбран именно этот промежуток?",
          "criteria": [
            "Найдены все действительные корни.",
            "Указан знак выражения на каждом промежутке.",
            "Границы включены или исключены по исходному знаку."
          ]
        },
        "misconception": "Механически выбирают промежуток между корнями для любого неравенства.",
        "finish": "Реши 3 квадратных неравенства разных знаков."
      },
      {
        "id": "oge-13-systems",
        "title": "Система: общая часть решений",
        "goal": "Найти числа, подходящие каждому условию одновременно.",
        "dependsOn": [
          "oge-13-interval",
          "oge-13-quadratic"
        ],
        "foundations": [
          "inequality-number-line",
          "inequality-linear"
        ],
        "covers": [
          "systems:0",
          "systems:1",
          "systems:2",
          "systems:3"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №13",
            "href": "/trainers/oge13-inequalities-series.html",
            "instruction": "В «Системы» реши каждое неравенство отдельно и отметь их на одной оси разными линиями.",
            "finish": "Закончи 3 системы, в одной проверь граничную точку."
          }
        ],
        "explain": {
          "prompt": "Почему объединение двух ответов не является решением системы?",
          "criteria": [
            "Каждое неравенство решено отдельно.",
            "Выбрано пересечение, а не объединение.",
            "Проверено число в общей части и число вне неё."
          ]
        },
        "misconception": "Соединяют все подходящие хотя бы одному условию числа.",
        "finish": "Закончи 3 системы, в одной проверь граничную точку."
      },
      {
        "id": "oge-13-all-none",
        "title": "Нет решений или подходят все",
        "goal": "Использовать неотрицательность квадрата как доказательство.",
        "dependsOn": [
          "oge-13-quadratic"
        ],
        "foundations": [
          "expression-powers-roots",
          "signed-opposite-absolute"
        ],
        "covers": [
          "special:0",
          "special:1",
          "special:2",
          "special:3"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №13",
            "href": "/trainers/oge13-inequalities-series.html",
            "instruction": "В «Нет/любое» сравни x²+c с нулём для положительного c. Затем проверь, как меняется ответ при знаке неравенства.",
            "finish": "Разбери 2 задачи без решений и 2 с любым действительным x."
          }
        ],
        "explain": {
          "prompt": "Что в выражении остаётся верным при любом x?",
          "criteria": [
            "Названо неотрицательное выражение.",
            "Найдена его минимальная величина или нижняя граница.",
            "Вывод связан с конкретным знаком <, ≤, > или ≥."
          ]
        },
        "misconception": "Проверку на одном числе выдают за доказательство для всех чисел.",
        "finish": "Разбери 2 задачи без решений и 2 с любым действительным x."
      },
      {
        "id": "oge-13-counterexample",
        "title": "Проверяем ответ контрпримером",
        "goal": "Найти число, которое обнаруживает ошибочное преобразование.",
        "dependsOn": [
          "oge-13-systems",
          "oge-13-all-none"
        ],
        "foundations": [
          "inequality-linear",
          "expression-substitution"
        ],
        "covers": [
          "linear:0",
          "linear:1",
          "linear:2",
          "linear:3",
          "linear:4",
          "linear:5",
          "quad:0",
          "quad:1",
          "quad:2",
          "quad:3",
          "quad:4",
          "quad:5",
          "quad:6",
          "quad:7",
          "graph:0",
          "graph:1",
          "graph:2",
          "graph:3",
          "special:0",
          "special:1",
          "special:2",
          "special:3",
          "systems:0",
          "systems:1",
          "systems:2",
          "systems:3"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №13",
            "href": "/trainers/oge13-inequalities-series.html",
            "instruction": "Возьми одно решённое линейное и одно квадратное неравенство. Для каждого проверь число внутри ответа, вне ответа и на границе.",
            "finish": "Сделай 3 подстановки для каждого из 2 решений."
          }
        ],
        "explain": {
          "prompt": "Как выбранное число показывает ошибку, а не просто неудачный ответ?",
          "criteria": [
            "Названы исходное и предложенное условия.",
            "Одно и то же число подставлено в оба.",
            "Показано, в каком условии оно подходит, а в каком нет."
          ]
        },
        "misconception": "Проверяют число только в преобразованном ответе.",
        "finish": "Сделай 3 подстановки для каждого из 2 решений."
      }
    ],
    "questions": [
      {
        "id": "oge-13-01",
        "nodeId": "oge-13-linear",
        "prompt": "Найди наибольшее целое решение неравенства 2x + 3 < 11.",
        "input": "number",
        "answer": "3",
        "hint": "Сначала реши неравенство, затем учти строгую целую границу.",
        "explanation": "2x < 8, x < 4. Наибольшее целое меньше 4 равно 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              [
                "sub",
                11,
                3
              ],
              2
            ],
            1
          ]
        }
      },
      {
        "id": "oge-13-02",
        "nodeId": "oge-13-interval",
        "prompt": "Какое из чисел удовлетворяет x > −2?",
        "input": "choice",
        "answer": "0",
        "choices": [
          "−2",
          "0",
          "−3"
        ],
        "hint": "Проверь отдельно граничное число и числа по обе стороны.",
        "explanation": "−2 не подходит из-за строгого знака; −3 меньше границы. Подходит 0.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "max",
              [
                "cmp",
                -2,
                -2
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                0,
                -2
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                -3,
                -2
              ],
              0
            ]
          ]
        }
      },
      {
        "id": "oge-13-03",
        "nodeId": "oge-13-quadratic",
        "prompt": "Какое из чисел является решением x² < 16?",
        "input": "choice",
        "answer": "−3",
        "choices": [
          "5",
          "−3",
          "−4"
        ],
        "hint": "Возведи каждое число в квадрат и сравни с правой частью.",
        "explanation": "(−3)² = 9 < 16. Для −4 получается равенство, для 5 — 25 > 16.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "max",
              [
                "neg",
                [
                  "cmp",
                  [
                    "pow",
                    5,
                    2
                  ],
                  16
                ]
              ],
              0
            ],
            [
              "max",
              [
                "neg",
                [
                  "cmp",
                  [
                    "pow",
                    -3,
                    2
                  ],
                  16
                ]
              ],
              0
            ],
            [
              "max",
              [
                "neg",
                [
                  "cmp",
                  [
                    "pow",
                    -4,
                    2
                  ],
                  16
                ]
              ],
              0
            ]
          ]
        }
      },
      {
        "id": "oge-13-04",
        "nodeId": "oge-13-systems",
        "prompt": "Какое число подходит системе x > −2 и x ≤ 3?",
        "input": "choice",
        "answer": "3",
        "choices": [
          "−2",
          "3",
          "4"
        ],
        "hint": "Оба условия должны выполняться для одного числа.",
        "explanation": "3 больше −2 и не больше 3. Число −2 не проходит первое условие, 4 — второе.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  -2,
                  -2
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -2,
                    3
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  3,
                  -2
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    3,
                    3
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  4,
                  -2
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    4,
                    3
                  ],
                  0
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-05",
        "nodeId": "oge-13-all-none",
        "prompt": "Каково наименьшее значение x² + 7 при действительных x?",
        "input": "number",
        "answer": "7",
        "hint": "Квадрат неотрицателен; проверь, достижима ли нижняя граница.",
        "explanation": "x² ≥ 0, равенство достигается при x=0. Минимум x²+7 равен 7; поэтому x²+7<0 решений не имеет.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              [
                "mul",
                4,
                1,
                7
              ],
              [
                "pow",
                0,
                2
              ]
            ],
            [
              "mul",
              4,
              1
            ]
          ]
        }
      },
      {
        "id": "oge-13-06",
        "nodeId": "oge-13-counterexample",
        "prompt": "Ученик из −2x < 8 получил x < −4. Какое число подходит исходному неравенству, но не подходит его ответу?",
        "input": "choice",
        "answer": "−3",
        "choices": [
          "−4",
          "−3",
          "−5"
        ],
        "hint": "Подставь каждое число и в исходное условие, и в предложенный ответ.",
        "explanation": "При x=−3: 6<8 верно, но −3<−4 неверно. Ошибка — не изменён знак при делении на −2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "max",
                [
                  "neg",
                  [
                    "cmp",
                    [
                      "mul",
                      -2,
                      -4
                    ],
                    8
                  ]
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "neg",
                    [
                      "cmp",
                      -4,
                      -4
                    ]
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "neg",
                  [
                    "cmp",
                    [
                      "mul",
                      -2,
                      -3
                    ],
                    8
                  ]
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "neg",
                    [
                      "cmp",
                      -3,
                      -4
                    ]
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "neg",
                  [
                    "cmp",
                    [
                      "mul",
                      -2,
                      -5
                    ],
                    8
                  ]
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "neg",
                    [
                      "cmp",
                      -5,
                      -4
                    ]
                  ],
                  0
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-07",
        "nodeId": "oge-13-linear",
        "prompt": "Найди наибольшее целое решение 5 − 3x ≥ 14.",
        "input": "number",
        "answer": "-3",
        "hint": "При делении на отрицательный коэффициент поменяй направление сравнения.",
        "explanation": "−3x ≥ 9, поэтому x ≤ −3. Наибольшее целое решение — −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              14,
              5
            ],
            -3
          ]
        }
      },
      {
        "id": "oge-13-08",
        "nodeId": "oge-13-interval",
        "prompt": "Какое из чисел удовлетворяет x ≤ 4?",
        "input": "choice",
        "answer": "4",
        "choices": [
          "6",
          "4",
          "5"
        ],
        "hint": "Нестрогий знак разрешает равенство на границе.",
        "explanation": "4 ≤ 4 верно. Числа 5 и 6 больше верхней границы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  6,
                  4
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  4,
                  4
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  5,
                  4
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-09",
        "nodeId": "oge-13-quadratic",
        "prompt": "Выбери решение (x − 2)(x − 6) ≤ 0 из предложенных чисел.",
        "input": "choice",
        "answer": "4",
        "choices": [
          "1",
          "4",
          "7"
        ],
        "hint": "Определи знаки двух множителей при каждом кандидате.",
        "explanation": "При x=4 произведение 2·(−2)=−4 ≤ 0. При 1 и 7 оба множителя одного знака.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "mul",
                    [
                      "sub",
                      1,
                      2
                    ],
                    [
                      "sub",
                      1,
                      6
                    ]
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "mul",
                    [
                      "sub",
                      4,
                      2
                    ],
                    [
                      "sub",
                      4,
                      6
                    ]
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "mul",
                    [
                      "sub",
                      7,
                      2
                    ],
                    [
                      "sub",
                      7,
                      6
                    ]
                  ],
                  0
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-10",
        "nodeId": "oge-13-systems",
        "prompt": "Какое число решает систему x ≥ 1 и x < 5?",
        "input": "choice",
        "answer": "3",
        "choices": [
          "3",
          "5",
          "0"
        ],
        "hint": "Проверь нижнюю и верхнюю границы одновременно.",
        "explanation": "3 ≥ 1 и 3 < 5. Ноль ниже нижней границы, а 5 исключено строгим знаком.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "neg",
                    [
                      "cmp",
                      3,
                      1
                    ]
                  ],
                  0
                ]
              ],
              [
                "max",
                [
                  "neg",
                  [
                    "cmp",
                    3,
                    5
                  ]
                ],
                0
              ]
            ],
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "neg",
                    [
                      "cmp",
                      5,
                      1
                    ]
                  ],
                  0
                ]
              ],
              [
                "max",
                [
                  "neg",
                  [
                    "cmp",
                    5,
                    5
                  ]
                ],
                0
              ]
            ],
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "neg",
                    [
                      "cmp",
                      0,
                      1
                    ]
                  ],
                  0
                ]
              ],
              [
                "max",
                [
                  "neg",
                  [
                    "cmp",
                    0,
                    5
                  ]
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-11",
        "nodeId": "oge-13-all-none",
        "prompt": "Найди наименьшее значение (x − 2)² + 5 при действительных x.",
        "input": "number",
        "answer": "5",
        "hint": "Выбери x, при котором квадрат обращается в ноль.",
        "explanation": "(x−2)² ≥ 0; при x=2 он равен 0. Минимум равен 5, поэтому выражение положительно при любом x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              [
                "mul",
                4,
                1,
                9
              ],
              [
                "pow",
                -4,
                2
              ]
            ],
            [
              "mul",
              4,
              1
            ]
          ]
        }
      },
      {
        "id": "oge-13-12",
        "nodeId": "oge-13-counterexample",
        "prompt": "Из 3 − x > 5 получили неверный ответ x > −2. Какое число подходит исходному неравенству, но не этому ответу?",
        "input": "choice",
        "answer": "−3",
        "choices": [
          "−3",
          "0",
          "−2"
        ],
        "hint": "Проверь каждое число в обеих записях.",
        "explanation": "При x=−3: 3−(−3)=6>5, но −3>−2 неверно. Верное преобразование даёт x<−2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  [
                    "sub",
                    3,
                    -3
                  ],
                  5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -3,
                    -2
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  [
                    "sub",
                    3,
                    0
                  ],
                  5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    0,
                    -2
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  [
                    "sub",
                    3,
                    -2
                  ],
                  5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -2,
                    -2
                  ],
                  0
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-13",
        "nodeId": "oge-13-linear",
        "prompt": "Найди наименьшее целое решение 4x − 7 > 5.",
        "input": "number",
        "answer": "4",
        "hint": "После решения учти, что точка строгой границы не входит.",
        "explanation": "4x > 12, x > 3. Наименьшее целое решение — 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "add",
                5,
                7
              ],
              4
            ],
            1
          ]
        }
      },
      {
        "id": "oge-13-14",
        "nodeId": "oge-13-interval",
        "prompt": "Какое число лежит в промежутке −5 < x ≤ −2?",
        "input": "choice",
        "answer": "−2",
        "choices": [
          "−5",
          "−2",
          "0"
        ],
        "hint": "У левой и правой границы разные знаки включения.",
        "explanation": "−2 разрешено нестрогой верхней границей; −5 исключено, а 0 слишком велико.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  -5,
                  -5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -5,
                    -2
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  -2,
                  -5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -2,
                    -2
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  0,
                  -5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    0,
                    -2
                  ],
                  0
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-15",
        "nodeId": "oge-13-quadratic",
        "prompt": "Какое число удовлетворяет x² − 9 ≤ 0?",
        "input": "choice",
        "answer": "3",
        "choices": [
          "3",
          "5",
          "−4"
        ],
        "hint": "Можно сравнить квадрат каждого кандидата с 9.",
        "explanation": "При x=3 получается 9−9=0, что допустимо. При −4 и 5 выражение положительно.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "sub",
                    [
                      "pow",
                      3,
                      2
                    ],
                    9
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "sub",
                    [
                      "pow",
                      5,
                      2
                    ],
                    9
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "sub",
                    [
                      "pow",
                      -4,
                      2
                    ],
                    9
                  ],
                  0
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-16",
        "nodeId": "oge-13-systems",
        "prompt": "Выбери решение системы x > −5 и x ≤ −1.",
        "input": "choice",
        "answer": "−1",
        "choices": [
          "2",
          "−5",
          "−1"
        ],
        "hint": "Решением является только общая часть двух условий.",
        "explanation": "−1 больше −5 и не больше −1. −5 исключается первым условием, 2 — вторым.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  2,
                  -5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    2,
                    -1
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  -5,
                  -5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -5,
                    -1
                  ],
                  0
                ]
              ]
            ],
            [
              "mul",
              [
                "max",
                [
                  "cmp",
                  -1,
                  -5
                ],
                0
              ],
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    -1,
                    -1
                  ],
                  0
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-13-17",
        "nodeId": "oge-13-all-none",
        "prompt": "Найди наименьшее значение 3(x + 1)² + 4 при действительных x.",
        "input": "number",
        "answer": "4",
        "hint": "Положительный коэффициент сохраняет неотрицательность квадрата.",
        "explanation": "3(x+1)² ≥ 0; при x=−1 оно равно нулю. Минимальное значение всего выражения — 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              [
                "mul",
                4,
                3,
                7
              ],
              [
                "pow",
                6,
                2
              ]
            ],
            [
              "mul",
              4,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-13-18",
        "nodeId": "oge-13-counterexample",
        "prompt": "Ученик решил −4x ≤ 12 как x ≤ −3. Какое число подходит исходному неравенству, но не его ответу?",
        "input": "choice",
        "answer": "−2",
        "choices": [
          "−4",
          "−3",
          "−2"
        ],
        "hint": "Отдели знак деления от самого граничного числа.",
        "explanation": "При x=−2: 8≤12 верно, а −2≤−3 неверно. После деления на −4 нужен знак x≥−3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    [
                      "mul",
                      -4,
                      -4
                    ],
                    12
                  ],
                  0
                ]
              ],
              [
                "sub",
                1,
                [
                  "sub",
                  1,
                  [
                    "max",
                    [
                      "cmp",
                      -4,
                      -3
                    ],
                    0
                  ]
                ]
              ]
            ],
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    [
                      "mul",
                      -4,
                      -3
                    ],
                    12
                  ],
                  0
                ]
              ],
              [
                "sub",
                1,
                [
                  "sub",
                  1,
                  [
                    "max",
                    [
                      "cmp",
                      -3,
                      -3
                    ],
                    0
                  ]
                ]
              ]
            ],
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    [
                      "mul",
                      -4,
                      -2
                    ],
                    12
                  ],
                  0
                ]
              ],
              [
                "sub",
                1,
                [
                  "sub",
                  1,
                  [
                    "max",
                    [
                      "cmp",
                      -2,
                      -3
                    ],
                    0
                  ]
                ]
              ]
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-14",
    "taskNumbers": [
      14
    ],
    "title": "№14. Последовательность: шаг, сумма и первый подходящий номер",
    "goal": "Различать прибавление и умножение, находить нужный член, общую сумму и порог.",
    "transferGoal": "Реши 3 новые задачи: на член или сумму, на повторное изменение и на первый подходящий номер. Проверь одну короткой таблицей, другую — соседним номером.",
    "source": {
      "href": "/trainers/oge-task14-progressions.html",
      "title": "ОГЭ №14 · исходный тренажёр",
      "trainerId": "oge-t14-progressii"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task14-progressions.html",
      "selector": "GENS и TYPE_IDS: выбор сюжетного типа",
      "types": [
        {
          "id": "AP-VAL",
          "title": "Значение на n-м шаге"
        },
        {
          "id": "AP-SUM",
          "title": "Сумма первых n шагов"
        },
        {
          "id": "AP-2PT",
          "title": "Прибавка по двум известным шагам"
        },
        {
          "id": "AP-SUM2DAY",
          "title": "Известна вся сумма: найти нужный день"
        },
        {
          "id": "GP-VAL",
          "title": "Умножаем или делим каждые N минут"
        },
        {
          "id": "GP-COMPL",
          "title": "Осталось и образовалось"
        },
        {
          "id": "THRESH",
          "title": "Сколько шагов до условия"
        },
        {
          "id": "PIC",
          "title": "Задача с рисунком"
        },
        {
          "id": "TAXI",
          "title": "Старт плюс плата за минуту"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-14-pattern",
        "title": "Первый член и шаг",
        "goal": "Различать номер члена, значение и число переходов.",
        "dependsOn": [],
        "foundations": [
          "operation-order",
          "data-tables",
          "equal-groups"
        ],
        "covers": [
          "AP-VAL",
          "PIC"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №14",
            "href": "/trainers/oge-task14-progressions.html",
            "instruction": "Выбери «Значение на n-м шаге», затем «Задача с рисунком». Сначала построй короткую таблицу из 4 членов.",
            "finish": "Реши 3 задачи и подпиши номера членов."
          }
        ],
        "explain": {
          "prompt": "Почему от первого до n-го члена не n переходов?",
          "criteria": [
            "Первый член связан с номером 1.",
            "Разность соседних членов постоянна.",
            "Количество переходов равно n−1."
          ]
        },
        "misconception": "Прибавляют разность n раз вместо n−1.",
        "finish": "Реши 3 задачи и подпиши номера членов."
      },
      {
        "id": "oge-14-two-terms",
        "title": "Восстанавливаем шаг по двум членам",
        "goal": "Разделить изменение значений на изменение номеров.",
        "dependsOn": [
          "oge-14-pattern"
        ],
        "foundations": [
          "equation-linear",
          "proportion-direct"
        ],
        "covers": [
          "AP-2PT"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №14",
            "href": "/trainers/oge-task14-progressions.html",
            "instruction": "Выбери «Прибавка по двум известным шагам». Нанеси оба номера на шкалу и посчитай промежутки между ними.",
            "finish": "Реши 3 задачи с разными промежутками между номерами."
          }
        ],
        "explain": {
          "prompt": "Как ты отделил изменение за несколько шагов от изменения за один?",
          "criteria": [
            "Найдена разность значений.",
            "Найдена разность номеров.",
            "Полученная разность проверена возвратом к известному члену."
          ]
        },
        "misconception": "Делят на больший номер, а не на разность номеров.",
        "finish": "Реши 3 задачи с разными промежутками между номерами."
      },
      {
        "id": "oge-14-sum",
        "title": "От отдельного члена к общей сумме",
        "goal": "Использовать пары крайних членов и различать aₙ и Sₙ.",
        "dependsOn": [
          "oge-14-two-terms"
        ],
        "foundations": [
          "data-mean",
          "expression-structure",
          "equation-linear"
        ],
        "covers": [
          "AP-SUM",
          "AP-SUM2DAY"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №14",
            "href": "/trainers/oge-task14-progressions.html",
            "instruction": "Чередуй «Сумма первых n шагов» и «Известна вся сумма: найти нужный день». Один раз проверь сумму коротким перечислением.",
            "finish": "Реши 3 задачи, включая одну с известной суммой."
          }
        ],
        "explain": {
          "prompt": "Почему формула суммы содержит деление на 2?",
          "criteria": [
            "Первый и последний члены найдены правильно.",
            "Пары имеют одинаковую сумму.",
            "Количество членов не перепутано с количеством переходов."
          ]
        },
        "misconception": "Ответ на вопрос о сумме заменяют последним членом.",
        "finish": "Реши 3 задачи, включая одну с известной суммой."
      },
      {
        "id": "oge-14-geometric",
        "title": "Постоянный множитель",
        "goal": "Отличить умножение от прибавления и найти оставшуюся долю.",
        "dependsOn": [
          "oge-14-pattern"
        ],
        "foundations": [
          "powers",
          "percent-change",
          "fraction-part-whole"
        ],
        "covers": [
          "GP-VAL",
          "GP-COMPL"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №14",
            "href": "/trainers/oge-task14-progressions.html",
            "instruction": "Выбери «Умножаем или делим каждые N минут», затем «Осталось и образовалось». Запиши три первых изменения.",
            "finish": "Реши 3 задачи; в одной нужно найти дополнение до целого."
          }
        ],
        "explain": {
          "prompt": "Что остаётся одинаковым: разность соседних значений или их отношение?",
          "criteria": [
            "Постоянный множитель назван.",
            "Число применений множителя определено по времени или номеру.",
            "При необходимости остаток отделён от израсходованной части."
          ]
        },
        "misconception": "Повторное процентное изменение считают от первоначального числа каждый раз.",
        "finish": "Реши 3 задачи; в одной нужно найти дополнение до целого."
      },
      {
        "id": "oge-14-threshold",
        "title": "Первое достижение условия",
        "goal": "Найти первый подходящий номер и проверить соседний.",
        "dependsOn": [
          "oge-14-sum",
          "oge-14-geometric"
        ],
        "foundations": [
          "inequality-linear",
          "rounding"
        ],
        "covers": [
          "THRESH"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №14",
            "href": "/trainers/oge-task14-progressions.html",
            "instruction": "В «Сколько шагов до условия» после расчёта обязательно проверь найденный номер и предыдущий.",
            "finish": "Реши 3 задачи на первое достижение или превышение порога."
          }
        ],
        "explain": {
          "prompt": "Как доказать, что подходит именно первый номер?",
          "criteria": [
            "Найденный член удовлетворяет условию.",
            "Предыдущий член не удовлетворяет условию.",
            "Учтено различие между «не меньше» и «больше»."
          ]
        },
        "misconception": "Округляют номер без проверки строгого или нестрогого условия.",
        "finish": "Реши 3 задачи на первое достижение или превышение порога."
      },
      {
        "id": "oge-14-tariff",
        "title": "Стартовая часть и одинаковые добавки",
        "goal": "Выделить уже оплаченную часть и число дополнительных шагов.",
        "dependsOn": [
          "oge-14-threshold"
        ],
        "foundations": [
          "word-change",
          "expression-substitution",
          "word-afford"
        ],
        "covers": [
          "TAXI"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №14",
            "href": "/trainers/oge-task14-progressions.html",
            "instruction": "Открой «Старт плюс плата за минуту». Раздели стоимость на фиксированную часть и дополнительные минуты.",
            "finish": "Реши 3 тарифные задачи и проверь одну прямым перечислением добавок."
          }
        ],
        "explain": {
          "prompt": "Какие минуты уже входят в стартовую оплату?",
          "criteria": [
            "Названа фиксированная сумма.",
            "Вычтено количество включённых минут.",
            "Добавлена плата только за дополнительные минуты."
          ]
        },
        "misconception": "Повторно оплачивают минуты, входящие в стартовую сумму.",
        "finish": "Реши 3 тарифные задачи и проверь одну прямым перечислением добавок."
      }
    ],
    "questions": [
      {
        "id": "oge-14-01",
        "nodeId": "oge-14-pattern",
        "prompt": "Арифметическая прогрессия начинается с 4, разность равна 3. Найди a₆.",
        "input": "number",
        "answer": "19",
        "hint": "От первого члена до шестого пять переходов.",
        "explanation": "a₆ = 4+(6−1)·3 = 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            [
              "mul",
              [
                "sub",
                6,
                1
              ],
              3
            ]
          ]
        }
      },
      {
        "id": "oge-14-02",
        "nodeId": "oge-14-two-terms",
        "prompt": "В арифметической прогрессии a₂ = 7, a₆ = 19. Найди разность.",
        "input": "number",
        "answer": "3",
        "hint": "Посчитай промежутки между вторым и шестым членами.",
        "explanation": "d = (19−7)/(6−2) = 12/4 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              19,
              7
            ],
            [
              "sub",
              6,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-14-03",
        "nodeId": "oge-14-sum",
        "prompt": "Найди сумму первых 6 членов арифметической прогрессии, если a₁ = 2 и a₆ = 12.",
        "input": "number",
        "answer": "42",
        "hint": "Сложи крайние члены и учти число пар.",
        "explanation": "S₆ = (2+12)·6/2 = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              [
                "add",
                2,
                12
              ],
              6
            ],
            2
          ]
        }
      },
      {
        "id": "oge-14-04",
        "nodeId": "oge-14-geometric",
        "prompt": "Количество бактерий удваивается каждый час. Было 30. Сколько будет после 3 часов?",
        "input": "number",
        "answer": "240",
        "hint": "Каждый час умножение применяется к новому количеству.",
        "explanation": "30·2³ = 30·8 = 240.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            30,
            [
              "pow",
              2,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-14-05",
        "nodeId": "oge-14-threshold",
        "prompt": "В первый день изготовили 5 деталей, каждый следующий день на 3 больше. В какой день впервые изготовят за этот день больше 20 деталей?",
        "input": "number",
        "answer": "7",
        "hint": "Найди день с ровно 20 деталями и проверь следующий.",
        "explanation": "aₙ = 5+3(n−1). На шестой день 20, на седьмой 23; впервые больше 20 в день 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "sub",
                20,
                5
              ],
              3
            ],
            2
          ]
        }
      },
      {
        "id": "oge-14-06",
        "nodeId": "oge-14-tariff",
        "prompt": "Поездка стоит 50 ₽ за первые 2 минуты и 10 ₽ за каждую дополнительную минуту. Сколько стоят 8 минут?",
        "input": "number",
        "answer": "110",
        "hint": "Не начисляй дополнительную оплату за уже включённые минуты.",
        "explanation": "Дополнительных минут 8−2=6. Стоимость 50+6·10 = 110 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            50,
            [
              "mul",
              [
                "sub",
                8,
                2
              ],
              10
            ]
          ]
        }
      },
      {
        "id": "oge-14-07",
        "nodeId": "oge-14-pattern",
        "prompt": "У арифметической прогрессии a₁ = 21, d = −2. Найди a₇.",
        "input": "number",
        "answer": "9",
        "hint": "Знак разности показывает уменьшение на каждом шаге.",
        "explanation": "a₇ = 21+(7−1)·(−2) = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            21,
            [
              "mul",
              [
                "sub",
                7,
                1
              ],
              -2
            ]
          ]
        }
      },
      {
        "id": "oge-14-08",
        "nodeId": "oge-14-two-terms",
        "prompt": "В арифметической прогрессии a₃ = 20 и a₈ = 5. Найди d.",
        "input": "number",
        "answer": "-3",
        "hint": "Изменение значений и номеров вычитай в одном порядке.",
        "explanation": "d = (5−20)/(8−3) = −15/5 = −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              5,
              20
            ],
            [
              "sub",
              8,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-14-09",
        "nodeId": "oge-14-sum",
        "prompt": "Сумма первых 5 членов арифметической прогрессии равна 45, а пятый член равен 13. Найди первый член.",
        "input": "number",
        "answer": "5",
        "hint": "Вырази первый член из формулы суммы крайних членов.",
        "explanation": "45 = (a₁+13)·5/2; a₁+13 = 18; a₁ = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              [
                "mul",
                45,
                2
              ],
              5
            ],
            13
          ]
        }
      },
      {
        "id": "oge-14-10",
        "nodeId": "oge-14-geometric",
        "prompt": "После каждого часа остаётся половина вещества. Сначала было 80 г. Сколько граммов останется через 3 часа?",
        "input": "number",
        "answer": "10",
        "hint": "Половина берётся от остатка предыдущего часа.",
        "explanation": "80·(1/2)³ = 10 г.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            80,
            [
              "pow",
              "1/2",
              3
            ]
          ]
        }
      },
      {
        "id": "oge-14-11",
        "nodeId": "oge-14-threshold",
        "prompt": "В первый день было 4 заявки, каждый следующий день на 4 больше. В какой день число заявок за этот день впервые станет больше 28?",
        "input": "number",
        "answer": "8",
        "hint": "Проверь целый номер на пороге и следующий номер.",
        "explanation": "a₇ = 4+6·4 = 28, a₈ = 32. Впервые больше 28 — в восьмой день.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "sub",
                28,
                4
              ],
              4
            ],
            2
          ]
        }
      },
      {
        "id": "oge-14-12",
        "nodeId": "oge-14-tariff",
        "prompt": "Прокат стоит 40 ₽ за первые 3 минуты и 8 ₽ за каждую следующую. Сколько стоят 10 минут?",
        "input": "number",
        "answer": "96",
        "hint": "Отдели стартовую оплату от доплаты за оставшееся время.",
        "explanation": "Дополнительных минут 10−3=7. Стоимость 40+7·8 = 96 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            40,
            [
              "mul",
              [
                "sub",
                10,
                3
              ],
              8
            ]
          ]
        }
      },
      {
        "id": "oge-14-13",
        "nodeId": "oge-14-pattern",
        "prompt": "В первом ряду 8 мест, в каждом следующем на 4 больше. Сколько мест в пятом ряду?",
        "input": "number",
        "answer": "24",
        "hint": "Между первым и пятым рядами четыре увеличения.",
        "explanation": "a₅ = 8+(5−1)·4 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            8,
            [
              "mul",
              [
                "sub",
                5,
                1
              ],
              4
            ]
          ]
        }
      },
      {
        "id": "oge-14-14",
        "nodeId": "oge-14-two-terms",
        "prompt": "Известно a₄ = 11 и a₉ = 31 арифметической прогрессии. Найди её разность.",
        "input": "number",
        "answer": "4",
        "hint": "Сопоставь изменение значения с количеством переходов.",
        "explanation": "d = (31−11)/(9−4) = 20/5 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              31,
              11
            ],
            [
              "sub",
              9,
              4
            ]
          ]
        }
      },
      {
        "id": "oge-14-15",
        "nodeId": "oge-14-sum",
        "prompt": "Найди сумму первых 8 членов арифметической прогрессии с a₁ = 3 и a₈ = 17.",
        "input": "number",
        "answer": "80",
        "hint": "Все пары первого и последнего, второго и предпоследнего дают одну сумму.",
        "explanation": "S₈ = (3+17)·8/2 = 80.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              [
                "add",
                3,
                17
              ],
              8
            ],
            2
          ]
        }
      },
      {
        "id": "oge-14-16",
        "nodeId": "oge-14-geometric",
        "prompt": "Каждый час остаётся половина вещества. Было 64 г. Сколько граммов распалось за 2 часа?",
        "input": "number",
        "answer": "48",
        "hint": "Вопрос спрашивает распавшуюся часть, поэтому сначала найди остаток.",
        "explanation": "Через 2 часа осталось 64·(1/2)²=16 г. Распалось 64−16=48 г.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            64,
            [
              "mul",
              64,
              [
                "pow",
                "1/2",
                2
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-14-17",
        "nodeId": "oge-14-threshold",
        "prompt": "В первый день собрали 10 кг, каждый следующий день на 5 кг больше. В какой день впервые соберут за этот день больше 40 кг?",
        "input": "number",
        "answer": "8",
        "hint": "Отличай условие «больше» от «не меньше».",
        "explanation": "В день 7 соберут 10+6·5=40 кг, в день 8 — 45 кг. Ответ 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "sub",
                40,
                10
              ],
              5
            ],
            2
          ]
        }
      },
      {
        "id": "oge-14-18",
        "nodeId": "oge-14-tariff",
        "prompt": "Тариф: 60 ₽ за первые 4 минуты и 5 ₽ за каждую дополнительную. Найди стоимость 9 минут.",
        "input": "number",
        "answer": "85",
        "hint": "Найди число минут сверх уже включённых четырёх.",
        "explanation": "9−4=5 дополнительных минут. Стоимость 60+5·5=85 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            60,
            [
              "mul",
              [
                "sub",
                9,
                4
              ],
              5
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-20",
    "taskNumbers": [
      20
    ],
    "title": "№20. Алгебра: метод, ограничения и полное решение",
    "goal": "Выбирать преобразование по структуре, возвращаться из замены и проверять все условия.",
    "transferGoal": "Выбери 3 новых задания разных модулей. Запиши полный ход: метод, ограничения, случаи, отбор и проверку. Автоматическая короткая проверка проверяет опорные действия; полноту записи сверяй по критериям узла.",
    "source": {
      "href": "/trainers/oge-task20-equations.html",
      "title": "ОГЭ №20 · исходный тренажёр",
      "trainerId": "oge-t20-algebra"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task20-equations.html",
      "selector": "#picker: MODULES и ORDER, 13 модулей",
      "types": [
        {
          "id": "A",
          "title": "Значение выражения"
        },
        {
          "id": "B1",
          "title": "Кубическое: группировка"
        },
        {
          "id": "B2",
          "title": "Уравнение с корнем"
        },
        {
          "id": "RAZL",
          "title": "Разложение на множители"
        },
        {
          "id": "B5",
          "title": "Дробно-рациональные"
        },
        {
          "id": "BIQ",
          "title": "Замена переменной"
        },
        {
          "id": "SQ",
          "title": "Равенство квадратов"
        },
        {
          "id": "POW",
          "title": "Дробь со степенями"
        },
        {
          "id": "SYS",
          "title": "Системы уравнений"
        },
        {
          "id": "INEQ",
          "title": "Неравенства"
        },
        {
          "id": "DR",
          "title": "Дробное неравенство"
        },
        {
          "id": "QIDS",
          "title": "Квадратные неравенства"
        },
        {
          "id": "SYM",
          "title": "Симметричные системы"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-20-structure",
        "title": "Выражение и условие: увидеть нужную комбинацию",
        "goal": "Преобразовать условие и выделить именно выражение из вопроса.",
        "dependsOn": [],
        "foundations": [
          "expression-structure",
          "expression-like-terms",
          "expression-powers-roots",
          "percent-proportion"
        ],
        "covers": [
          "A",
          "POW"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №20",
            "href": "/trainers/oge-task20-equations.html",
            "instruction": "В «Значение выражения» выдели комбинацию букв из вопроса. Затем реши один пример «Дробь со степенями», сначала упрощая показатели.",
            "finish": "Разбери 2 задания по условию и 1 со степенями."
          }
        ],
        "explain": {
          "prompt": "Почему можно найти выражение, не находя отдельно каждую букву?",
          "criteria": [
            "Условие преобразовано при ненулевом знаменателе.",
            "Выделена нужная линейная комбинация или общая степень.",
            "Последняя подстановка относится к выражению из вопроса."
          ]
        },
        "misconception": "Пытаются найти все буквы, хотя условие определяет только их комбинацию.",
        "finish": "Разбери 2 задания по условию и 1 со степенями."
      },
      {
        "id": "oge-20-factor",
        "title": "Группировка, произведение и равенство квадратов",
        "goal": "Разложить выражение так, чтобы были видны все случаи.",
        "dependsOn": [
          "oge-20-structure"
        ],
        "foundations": [
          "expression-common-factor",
          "expression-identities",
          "equation-exam-transfer"
        ],
        "covers": [
          "B1",
          "RAZL",
          "SQ"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №20",
            "href": "/trainers/oge-task20-equations.html",
            "instruction": "Чередуй «Кубическое: группировка», «Разложение на множители» и «Равенство квадратов». После разложения перечисли все варианты зануления.",
            "finish": "Реши 3 задачи разными приёмами и проверь все полученные корни."
          }
        ],
        "explain": {
          "prompt": "Как разложение помогает увидеть случаи, которые нельзя отбросить?",
          "criteria": [
            "Раскрытие скобок восстанавливает исходное выражение.",
            "Для произведения учтён каждый нулевой множитель.",
            "Для равенства квадратов рассмотрены оба знака; для суммы квадратов — одновременное равенство нулю."
          ]
        },
        "misconception": "Делят на общий множитель с неизвестным и теряют целую ветвь решений.",
        "finish": "Реши 3 задачи разными приёмами и проверь все полученные корни."
      },
      {
        "id": "oge-20-domain",
        "title": "ОДЗ до преобразований",
        "goal": "Сохранить ограничения корней и знаменателей при отборе.",
        "dependsOn": [
          "oge-20-factor"
        ],
        "foundations": [
          "equation-denominators",
          "inequality-linear",
          "expression-powers-roots"
        ],
        "covers": [
          "B2",
          "B5"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №20",
            "href": "/trainers/oge-task20-equations.html",
            "instruction": "Выбери «Уравнение с корнем», затем «Дробно-рациональные». Напиши ОДЗ до сокращения или вычитания одинаковых выражений.",
            "finish": "Реши 3 уравнения и объясни судьбу каждого кандидата."
          }
        ],
        "explain": {
          "prompt": "Почему кандидат из упрощённого уравнения может не подходить исходному?",
          "criteria": [
            "Выписаны исходные ограничения.",
            "Кандидаты получены без деления на неизвестный ноль.",
            "Каждый кандидат отдельно сопоставлен с ОДЗ и исходной записью."
          ]
        },
        "misconception": "После исчезновения корня или знаменателя забывают его ограничения.",
        "finish": "Реши 3 уравнения и объясни судьбу каждого кандидата."
      },
      {
        "id": "oge-20-substitution",
        "title": "Замена повторяющегося выражения",
        "goal": "Свести уравнение к знакомому и вернуться ко всем допустимым x.",
        "dependsOn": [
          "oge-20-domain"
        ],
        "foundations": [
          "expression-powers-roots",
          "equation-exam-transfer",
          "signed-opposite-absolute"
        ],
        "covers": [
          "BIQ"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №20",
            "href": "/trainers/oge-task20-equations.html",
            "instruction": "Открой «Замена переменной». Для биквадратного уравнения запиши t=x² и ограничение t≥0, затем восстанови оба знака x.",
            "finish": "Разбери 2 уравнения с заменой и проверь все возвращённые x."
          }
        ],
        "explain": {
          "prompt": "Какие ограничения есть у новой переменной и сколько x даёт одно t?",
          "criteria": [
            "Замена и её область записаны.",
            "Недопустимые значения новой переменной исключены.",
            "Обратный переход учитывает все допустимые знаки."
          ]
        },
        "misconception": "Записывают только положительный корень или принимают t<0 при t=x².",
        "finish": "Разбери 2 уравнения с заменой и проверь все возвращённые x."
      },
      {
        "id": "oge-20-systems",
        "title": "Система как общая проверка",
        "goal": "Решить связанную пару условий, используя сумму, разность или симметрию.",
        "dependsOn": [
          "oge-20-substitution"
        ],
        "foundations": [
          "equation-linear",
          "expression-substitution",
          "expression-identities"
        ],
        "covers": [
          "SYS",
          "SYM"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №20",
            "href": "/trainers/oge-task20-equations.html",
            "instruction": "Выбери «Системы уравнений», затем «Симметричные системы». Подставь найденную пару в оба исходных равенства.",
            "finish": "Реши по 2 системы обычного и симметричного вида."
          }
        ],
        "explain": {
          "prompt": "Почему проверять только одно уравнение недостаточно?",
          "criteria": [
            "Одно преобразование объединяет оба исходных условия.",
            "Получена пара значений, а не одна несвязанная переменная.",
            "Оба равенства проверены; порядок пары сохранён."
          ]
        },
        "misconception": "Считают любую пару из корней отдельного уравнения решением системы.",
        "finish": "Реши по 2 системы обычного и симметричного вида."
      },
      {
        "id": "oge-20-inequalities",
        "title": "Неравенство и полное множество решений",
        "goal": "Отобрать интервалы с учётом нулей и запрещённых точек.",
        "dependsOn": [
          "oge-20-systems",
          "oge-20-domain"
        ],
        "foundations": [
          "inequality-linear",
          "inequality-number-line",
          "expression-common-factor"
        ],
        "covers": [
          "INEQ",
          "DR",
          "QIDS"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №20",
            "href": "/trainers/oge-task20-equations.html",
            "instruction": "Чередуй «Неравенства», «Дробное неравенство» и «Квадратные неравенства». Отдельно отмечай нули числителя и знаменателя.",
            "finish": "Реши 3 неравенства; проверь один интервал подстановкой и все границы."
          }
        ],
        "explain": {
          "prompt": "Почему ноль знаменателя исключается даже при нестрогом знаке?",
          "criteria": [
            "Найдены все точки изменения знака.",
            "На каждом интервале определён знак.",
            "Нули знаменателя исключены, а нули числителя обработаны по знаку неравенства."
          ]
        },
        "misconception": "Закрашивают запрещённую точку вместе с обычным нулём выражения.",
        "finish": "Реши 3 неравенства; проверь один интервал подстановкой и все границы."
      }
    ],
    "questions": [
      {
        "id": "oge-20-01",
        "nodeId": "oge-20-structure",
        "prompt": "Известно (a − 3b + 4)/(3a − b + 4) = 2; знаменатель ненулевой. Найди 5a + b + 9.",
        "input": "number",
        "answer": "5",
        "hint": "Умножь равенство на знаменатель и выдели комбинацию 5a+b.",
        "explanation": "a−3b+4 = 6a−2b+8, поэтому 5a+b = −4. Тогда 5a+b+9 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              [
                "sub",
                1,
                2
              ],
              4
            ],
            9
          ]
        }
      },
      {
        "id": "oge-20-02",
        "nodeId": "oge-20-factor",
        "prompt": "Какое разложение равно x³ + 2x² − 9x − 18?",
        "input": "choice",
        "answer": "(x + 2)(x² − 9)",
        "choices": [
          "(x − 2)(x² + 9)",
          "(x + 2)(x² + 9)",
          "(x + 2)(x² − 9)"
        ],
        "hint": "Сгруппируй первые два и последние два слагаемых, затем проверь раскрытием.",
        "explanation": "x²(x+2)−9(x+2) = (x+2)(x²−9).",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  1,
                  1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  -2,
                  2
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  9,
                  -9
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "mul",
                    -2,
                    9
                  ],
                  -18
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  1,
                  1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  2,
                  2
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  9,
                  -9
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "mul",
                    2,
                    9
                  ],
                  -18
                ],
                2
              ]
            ],
            [
              "add",
              [
                "pow",
                [
                  "sub",
                  1,
                  1
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  2,
                  2
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  -9,
                  -9
                ],
                2
              ],
              [
                "pow",
                [
                  "sub",
                  [
                    "mul",
                    2,
                    -9
                  ],
                  -18
                ],
                2
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-20-03",
        "nodeId": "oge-20-domain",
        "prompt": "Реши x² − 3x + √(2 − x) = √(2 − x) + 10.",
        "input": "number",
        "answer": "-2",
        "hint": "Сначала запиши ограничение для корня, затем вычти одинаковые корни из обеих частей.",
        "explanation": "ОДЗ: x≤2. После вычитания корня: x²−3x−10=0, кандидаты −2 и 5. Подходит только −2.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -3,
          "c": -10,
          "selection": "smaller",
          "domain": {
            "max": 2
          }
        }
      },
      {
        "id": "oge-20-04",
        "nodeId": "oge-20-substitution",
        "prompt": "Какое из чисел является положительным корнем x⁴ − 13x² + 36 = 0?",
        "input": "choice",
        "answer": "3",
        "choices": [
          "3",
          "4",
          "5"
        ],
        "hint": "Положи t=x² и проверь кандидаты через вспомогательное квадратное уравнение.",
        "explanation": "t²−13t+36=(t−4)(t−9). Возвращаясь к x, получаем ±2 и ±3. Из предложенных чисел подходит 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                3,
                4
              ],
              [
                "mul",
                -13,
                [
                  "pow",
                  3,
                  2
                ]
              ],
              36
            ],
            [
              "add",
              [
                "pow",
                4,
                4
              ],
              [
                "mul",
                -13,
                [
                  "pow",
                  4,
                  2
                ]
              ],
              36
            ],
            [
              "add",
              [
                "pow",
                5,
                4
              ],
              [
                "mul",
                -13,
                [
                  "pow",
                  5,
                  2
                ]
              ],
              36
            ]
          ]
        }
      },
      {
        "id": "oge-20-05",
        "nodeId": "oge-20-systems",
        "prompt": "Реши систему x+y=7, x−y=1. Найди x.",
        "input": "number",
        "answer": "4",
        "hint": "Сложение равенств уберёт y.",
        "explanation": "2x=8, x=4; тогда y=3. Проверка: 4+3=7 и 4−3=1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              7,
              1
            ],
            2
          ]
        }
      },
      {
        "id": "oge-20-06",
        "nodeId": "oge-20-inequalities",
        "prompt": "Какое число удовлетворяет (x − 2)/(x + 1) > 0?",
        "input": "choice",
        "answer": "−2",
        "choices": [
          "2",
          "−2",
          "−0,5"
        ],
        "hint": "Проверь знак числителя и знаменателя, не умножая неравенство на неизвестный по знаку знаменатель.",
        "explanation": "При x=−2 дробь (−4)/(−1)=4 положительна. При −0,5 она отрицательна, при 2 равна нулю.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "max",
              [
                "cmp",
                [
                  "div",
                  [
                    "sub",
                    2,
                    2
                  ],
                  [
                    "add",
                    2,
                    1
                  ]
                ],
                0
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                [
                  "div",
                  [
                    "sub",
                    -2,
                    2
                  ],
                  [
                    "add",
                    -2,
                    1
                  ]
                ],
                0
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                [
                  "div",
                  [
                    "sub",
                    "-0.5",
                    2
                  ],
                  [
                    "add",
                    "-0.5",
                    1
                  ]
                ],
                0
              ],
              0
            ]
          ]
        }
      },
      {
        "id": "oge-20-07",
        "nodeId": "oge-20-structure",
        "prompt": "Дано (a − 2b + 1)/(2a − b + 1) = 3, знаменатель не равен нулю. Найди 5a − b + 10.",
        "input": "number",
        "answer": "8",
        "hint": "Приведи равенство к комбинации, которая спрашивается.",
        "explanation": "a−2b+1=6a−3b+3, поэтому 5a−b=−2. Искомое значение −2+10=8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              [
                "sub",
                1,
                3
              ],
              1
            ],
            10
          ]
        }
      },
      {
        "id": "oge-20-08",
        "nodeId": "oge-20-factor",
        "prompt": "Найди сумму всех корней уравнения (x + 3)² = 16.",
        "input": "number",
        "answer": "-6",
        "hint": "Рассмотри оба знака квадратного корня.",
        "explanation": "x+3=4 или x+3=−4, поэтому x=1 или x=−7. Сумма равна −6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              4,
              3
            ],
            [
              "sub",
              -4,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-20-09",
        "nodeId": "oge-20-domain",
        "prompt": "Реши x² − x + √(2 − x) = √(2 − x) + 12.",
        "input": "number",
        "answer": "-3",
        "hint": "Ограничение из подкоренного выражения сохраняется после его вычитания.",
        "explanation": "ОДЗ: x≤2. x²−x−12=(x−4)(x+3)=0. Кандидат 4 не подходит; ответ −3.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -1,
          "c": -12,
          "selection": "smaller",
          "domain": {
            "max": 2
          }
        }
      },
      {
        "id": "oge-20-10",
        "nodeId": "oge-20-substitution",
        "prompt": "Какое из чисел является положительным корнем x⁴ − 20x² + 64 = 0?",
        "input": "choice",
        "answer": "4",
        "choices": [
          "3",
          "5",
          "4"
        ],
        "hint": "Сначала рассмотри значения x² как новую переменную.",
        "explanation": "t²−20t+64=(t−4)(t−16). Корни исходного уравнения ±2 и ±4; из вариантов подходит 4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                3,
                4
              ],
              [
                "mul",
                -20,
                [
                  "pow",
                  3,
                  2
                ]
              ],
              64
            ],
            [
              "add",
              [
                "pow",
                5,
                4
              ],
              [
                "mul",
                -20,
                [
                  "pow",
                  5,
                  2
                ]
              ],
              64
            ],
            [
              "add",
              [
                "pow",
                4,
                4
              ],
              [
                "mul",
                -20,
                [
                  "pow",
                  4,
                  2
                ]
              ],
              64
            ]
          ]
        }
      },
      {
        "id": "oge-20-11",
        "nodeId": "oge-20-systems",
        "prompt": "Два действительных числа имеют сумму 9 и произведение 14. Найди большее из них.",
        "input": "number",
        "answer": "7",
        "hint": "Оба числа являются корнями одного квадратного уравнения.",
        "explanation": "Числа — корни t²−9t+14=0, то есть 2 и 7. Большее равно 7.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -9,
          "c": 14,
          "selection": "larger"
        }
      },
      {
        "id": "oge-20-12",
        "nodeId": "oge-20-inequalities",
        "prompt": "Выбери решение неравенства (x − 1)(x − 4) ≤ 0.",
        "input": "choice",
        "answer": "2",
        "choices": [
          "0",
          "2",
          "5"
        ],
        "hint": "Сравни знаки множителей на трёх предложенных точках.",
        "explanation": "При x=2 произведение 1·(−2)=−2≤0. При 0 и 5 произведения положительны.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "mul",
                    [
                      "sub",
                      0,
                      1
                    ],
                    [
                      "sub",
                      0,
                      4
                    ]
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "mul",
                    [
                      "sub",
                      2,
                      1
                    ],
                    [
                      "sub",
                      2,
                      4
                    ]
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "mul",
                    [
                      "sub",
                      5,
                      1
                    ],
                    [
                      "sub",
                      5,
                      4
                    ]
                  ],
                  0
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-20-13",
        "nodeId": "oge-20-structure",
        "prompt": "Известно (a − 4b + 3)/(4a − b + 3) = 2 при ненулевом знаменателе. Найди 7a + 2b + 10.",
        "input": "number",
        "answer": "7",
        "hint": "После перекрёстного умножения собери нужные коэффициенты при a и b.",
        "explanation": "a−4b+3=8a−2b+6, поэтому 7a+2b=−3. Искомое значение −3+10=7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              [
                "sub",
                1,
                2
              ],
              3
            ],
            10
          ]
        }
      },
      {
        "id": "oge-20-14",
        "nodeId": "oge-20-factor",
        "prompt": "Для действительных x,y выполнено (x − 2)² + (y + 3)² = 0. Найди x+y.",
        "input": "number",
        "answer": "-1",
        "hint": "Два неотрицательных слагаемых дают ноль только одновременно.",
        "explanation": "Оба квадрата равны нулю: x=2 и y=−3. Поэтому x+y=−1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            [
              "neg",
              3
            ]
          ]
        }
      },
      {
        "id": "oge-20-15",
        "nodeId": "oge-20-domain",
        "prompt": "Реши x² + 2x + √(1 − x) = √(1 − x) + 8.",
        "input": "number",
        "answer": "-4",
        "hint": "Сначала определи допустимые x, затем реши квадратное уравнение.",
        "explanation": "ОДЗ: x≤1. x²+2x−8=(x+4)(x−2)=0. Кандидат 2 исключается; остаётся −4.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 2,
          "c": -8,
          "selection": "smaller",
          "domain": {
            "max": 1
          }
        }
      },
      {
        "id": "oge-20-16",
        "nodeId": "oge-20-substitution",
        "prompt": "Какое из чисел является положительным корнем x⁴ − 34x² + 225 = 0?",
        "input": "choice",
        "answer": "5",
        "choices": [
          "6",
          "5",
          "4"
        ],
        "hint": "После замены t=x² проверь сумму и произведение корней вспомогательного уравнения.",
        "explanation": "t²−34t+225=(t−9)(t−25). Получаем x=±3,±5. Из предложенных подходит 5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 0,
          "values": [
            [
              "add",
              [
                "pow",
                6,
                4
              ],
              [
                "mul",
                -34,
                [
                  "pow",
                  6,
                  2
                ]
              ],
              225
            ],
            [
              "add",
              [
                "pow",
                5,
                4
              ],
              [
                "mul",
                -34,
                [
                  "pow",
                  5,
                  2
                ]
              ],
              225
            ],
            [
              "add",
              [
                "pow",
                4,
                4
              ],
              [
                "mul",
                -34,
                [
                  "pow",
                  4,
                  2
                ]
              ],
              225
            ]
          ]
        }
      },
      {
        "id": "oge-20-17",
        "nodeId": "oge-20-systems",
        "prompt": "В системе 2x+y=14, x−y=1 найди x.",
        "input": "number",
        "answer": "5",
        "hint": "Сложи равенства, чтобы исключить y.",
        "explanation": "3x=15, значит x=5; y=4. Проверка: 10+4=14 и 5−4=1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              14,
              1
            ],
            3
          ]
        }
      },
      {
        "id": "oge-20-18",
        "nodeId": "oge-20-inequalities",
        "prompt": "Какое число удовлетворяет (x + 2)/(x − 3) ≤ 0?",
        "input": "choice",
        "answer": "−2",
        "choices": [
          "−3",
          "4",
          "−2"
        ],
        "hint": "Отдельно учитывай ноль числителя и запрещённый ноль знаменателя.",
        "explanation": "При x=−2 дробь равна 0, знаменатель −5 ненулевой. При −3 и 4 дроби положительны.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 1,
          "values": [
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "div",
                    [
                      "add",
                      -3,
                      2
                    ],
                    [
                      "sub",
                      -3,
                      3
                    ]
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "div",
                    [
                      "add",
                      4,
                      2
                    ],
                    [
                      "sub",
                      4,
                      3
                    ]
                  ],
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  [
                    "div",
                    [
                      "add",
                      -2,
                      2
                    ],
                    [
                      "sub",
                      -2,
                      3
                    ]
                  ],
                  0
                ],
                0
              ]
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-21",
    "taskNumbers": [
      21
    ],
    "title": "№21. Текстовая задача: модель и проверка смысла",
    "goal": "Строить короткую модель для движения, работы, смесей и сушки, сохраняя единицы и смысл неизвестного.",
    "transferGoal": "Реши одну новую задачу о движении и одну о работе или веществе. Сохрани таблицу величин, уравнение, ограничения и проверку ответа исходными данными.",
    "source": {
      "href": "/trainers/oge-task21-word-problems.html",
      "title": "ОГЭ №21 · исходный тренажёр",
      "trainerId": "oge-t21-tekst"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task21-word-problems.html",
      "selector": "MODULES[].key: 11 сюжетов",
      "types": [
        {
          "id": "t1",
          "title": "Навстречу"
        },
        {
          "id": "t2",
          "title": "Туда и обратно"
        },
        {
          "id": "t3",
          "title": "Пробег"
        },
        {
          "id": "t4",
          "title": "Две половины"
        },
        {
          "id": "t5",
          "title": "По кругу"
        },
        {
          "id": "t6",
          "title": "По реке"
        },
        {
          "id": "t7",
          "title": "Длина поезда"
        },
        {
          "id": "t8",
          "title": "Средняя скорость"
        },
        {
          "id": "t9",
          "title": "Работа"
        },
        {
          "id": "t10",
          "title": "Сушка фруктов"
        },
        {
          "id": "t11",
          "title": "Сплавы и смеси"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-21-timeline",
        "title": "Текст → время и путь",
        "goal": "Согласовать время движения, остановку и общий путь.",
        "dependsOn": [],
        "foundations": [
          "word-distance",
          "word-meeting",
          "geometry-units",
          "equation-linear"
        ],
        "covers": [
          "t1"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №21",
            "href": "/trainers/oge-task21-word-problems.html",
            "instruction": "В «Навстречу» нарисуй две временные линии и подпиши остановку. Только затем составь равенство суммы путей.",
            "finish": "Реши 2 задачи со встречей и остановкой."
          }
        ],
        "explain": {
          "prompt": "Как остановка вошла во время движения одного участника?",
          "criteria": [
            "Общее время до встречи одинаково.",
            "Из времени движения остановившегося вычтена длительность остановки.",
            "Сумма пройденных путей равна расстоянию между пунктами."
          ]
        },
        "misconception": "Остановку прибавляют к расстоянию или вычитают из времени обоих участников.",
        "finish": "Реши 2 задачи со встречей и остановкой."
      },
      {
        "id": "oge-21-segments",
        "title": "Разные участки — отдельные строки",
        "goal": "Разделить туда/обратно, половины пути и разные скорости.",
        "dependsOn": [
          "oge-21-timeline"
        ],
        "foundations": [
          "word-distance",
          "word-average-speed",
          "equation-fraction-answer"
        ],
        "covers": [
          "t2",
          "t3",
          "t4"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №21",
            "href": "/trainers/oge-task21-word-problems.html",
            "instruction": "Чередуй «Туда и обратно», «Пробег» и «Две половины». Для каждого участка сделай строку s,v,t.",
            "finish": "Закончи по одной задаче каждого сюжета."
          }
        ],
        "explain": {
          "prompt": "Что одинаково на участках: путь, время или скорость?",
          "criteria": [
            "Для каждого участка верна связь t=s/v.",
            "Общая величина названа по условию.",
            "Суммируются совместимые величины с одинаковыми единицами."
          ]
        },
        "misconception": "Равные расстояния считают доказательством равных времён.",
        "finish": "Закончи по одной задаче каждого сюжета."
      },
      {
        "id": "oge-21-relative",
        "title": "Относительная скорость и длина",
        "goal": "Посчитать сближение или путь длинного объекта.",
        "dependsOn": [
          "oge-21-segments"
        ],
        "foundations": [
          "word-meeting",
          "geometry-segments",
          "geometry-units"
        ],
        "covers": [
          "t5",
          "t7"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №21",
            "href": "/trainers/oge-task21-word-problems.html",
            "instruction": "В «По кругу» отметь полный круг как относительный путь. В «Длина поезда» нарисуй передний и задний край поезда.",
            "finish": "Реши 2 задачи по кругу и 1 о длине поезда."
          }
        ],
        "explain": {
          "prompt": "Какое расстояние должен пройти объект относительно другого?",
          "criteria": [
            "Выбрана сумма или разность скоростей по направлению движения.",
            "При догонке по кругу учтена длина полного круга.",
            "При прохождении моста учтены и мост, и поезд."
          ]
        },
        "misconception": "Время прохождения моста считают только по длине моста.",
        "finish": "Реши 2 задачи по кругу и 1 о длине поезда."
      },
      {
        "id": "oge-21-river-average",
        "title": "Река и средняя скорость",
        "goal": "Отличить собственную скорость, скорость по берегу и отношение всего пути ко всему времени.",
        "dependsOn": [
          "oge-21-relative"
        ],
        "foundations": [
          "word-river",
          "word-average-speed",
          "fraction-division"
        ],
        "covers": [
          "t6",
          "t8"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №21",
            "href": "/trainers/oge-task21-word-problems.html",
            "instruction": "Чередуй «По реке» и «Средняя скорость». Для реки подпиши направление течения, для среднего найди общий путь и общее время.",
            "finish": "Реши 3 задачи и сравни собственную и путевую скорости."
          }
        ],
        "explain": {
          "prompt": "Почему нельзя просто усреднить две скорости?",
          "criteria": [
            "Скорость по течению увеличена, против течения уменьшена.",
            "В средней скорости сложен весь путь и всё время.",
            "Формула соответствует единицам и направлению движения."
          ]
        },
        "misconception": "Считают среднее арифметическое скоростей для равных расстояний.",
        "finish": "Реши 3 задачи и сравни собственную и путевую скорости."
      },
      {
        "id": "oge-21-work",
        "title": "Производительность вместо времени",
        "goal": "Складывать доли работы за единицу времени.",
        "dependsOn": [
          "oge-21-segments"
        ],
        "foundations": [
          "word-work",
          "fraction-common-denominator",
          "fraction-division"
        ],
        "covers": [
          "t9"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №21",
            "href": "/trainers/oge-task21-word-problems.html",
            "instruction": "В «Работа» прими всю работу за единицу и составь таблицу производительностей.",
            "finish": "Реши 3 задачи; одну проверь суммой долей выполненной работы."
          }
        ],
        "explain": {
          "prompt": "Почему складываются не времена выполнения?",
          "criteria": [
            "Для каждого исполнителя найдена производительность 1/t.",
            "Для совместной работы производительности сложены.",
            "Общее время проверено суммой выполненных долей."
          ]
        },
        "misconception": "Складывают или усредняют времена вместо скоростей работы.",
        "finish": "Реши 3 задачи; одну проверь суммой долей выполненной работы."
      },
      {
        "id": "oge-21-substance",
        "title": "Что сохраняется в смеси и сушке",
        "goal": "Отделить массу вещества от меняющейся общей массы.",
        "dependsOn": [
          "oge-21-work"
        ],
        "foundations": [
          "percent-part-whole-rate",
          "percent-change",
          "equation-linear"
        ],
        "covers": [
          "t10",
          "t11"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №21",
            "href": "/trainers/oge-task21-word-problems.html",
            "instruction": "Выбери «Сушка фруктов», затем «Сплавы и смеси». Для каждой ситуации назови сохраняющуюся массу.",
            "finish": "Реши 2 задачи на сушку и 1 на смешивание."
          }
        ],
        "explain": {
          "prompt": "Какая масса не изменилась и как из неё восстановить целое?",
          "criteria": [
            "Процент переведён в долю.",
            "Сохраняется сухое или растворённое вещество, указанное в модели.",
            "Новая концентрация считается от новой общей массы."
          ]
        },
        "misconception": "Сохраняют процент воды вместо массы сухого вещества.",
        "finish": "Реши 2 задачи на сушку и 1 на смешивание."
      }
    ],
    "questions": [
      {
        "id": "oge-21-01",
        "nodeId": "oge-21-timeline",
        "prompt": "Два автомобиля выехали одновременно навстречу из пунктов на расстоянии 100 км со скоростями 40 и 60 км/ч. До встречи первый сделал остановку на 0,5 часа. Через сколько часов после выезда они встретились?",
        "input": "number",
        "answer": "1.2",
        "hint": "Пусть t — общее время; первый двигался на полчаса меньше.",
        "explanation": "40(t−0,5)+60t=100; 100t=120; t=1,2 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              100,
              [
                "mul",
                40,
                "0.5"
              ]
            ],
            [
              "add",
              40,
              60
            ]
          ]
        }
      },
      {
        "id": "oge-21-02",
        "nodeId": "oge-21-segments",
        "prompt": "В одну сторону путь 24 км. Туда двигались со скоростью 6 км/ч, обратно 8 км/ч. Сколько часов заняла вся дорога без остановок?",
        "input": "number",
        "answer": "7",
        "hint": "Равенство путей не означает равенства времени.",
        "explanation": "Туда: 24/6=4 ч; обратно: 24/8=3 ч. Всего 7 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              24,
              6
            ],
            [
              "div",
              24,
              8
            ]
          ]
        }
      },
      {
        "id": "oge-21-03",
        "nodeId": "oge-21-relative",
        "prompt": "По круговой дорожке длиной 600 м из одной точки одновременно побежали в одном направлении со скоростями 5 и 3 м/с. Через сколько секунд быстрый впервые после старта догонит медленного?",
        "input": "number",
        "answer": "300",
        "hint": "Для первой догонки быстрый должен выиграть целый круг.",
        "explanation": "Относительная скорость 5−3=2 м/с. Время 600/2=300 с.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            600,
            [
              "sub",
              5,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-21-04",
        "nodeId": "oge-21-river-average",
        "prompt": "Собственная скорость лодки 15 км/ч, скорость течения 3 км/ч. Сколько часов нужно на 36 км против течения?",
        "input": "number",
        "answer": "3",
        "hint": "Против течения скорость по берегу меньше собственной.",
        "explanation": "Скорость против течения 15−3=12 км/ч. Время 36/12=3 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            36,
            [
              "sub",
              15,
              3
            ]
          ]
        }
      },
      {
        "id": "oge-21-05",
        "nodeId": "oge-21-work",
        "prompt": "Первая труба наполняет бассейн за 6 часов, вторая за 3 часа. За сколько часов они наполнят его вместе?",
        "input": "number",
        "answer": "2",
        "hint": "Найди долю бассейна, которую каждая труба заполняет за час.",
        "explanation": "За час заполняется 1/6+1/3=1/2 бассейна. Весь бассейн заполнится за 2 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "add",
              "1/6",
              "1/3"
            ]
          ]
        }
      },
      {
        "id": "oge-21-06",
        "nodeId": "oge-21-substance",
        "prompt": "В 10 кг свежих фруктов 80% воды. После сушки вода составляет 50% массы. Масса сухого вещества не меняется. Какова новая масса фруктов в кг?",
        "input": "number",
        "answer": "4",
        "hint": "Сохраняется сухое вещество, а не процент воды.",
        "explanation": "Сухого вещества 10·0,2=2 кг. Теперь это половина всей массы, значит масса 2/0,5=4 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              10,
              [
                "sub",
                1,
                "0.8"
              ]
            ],
            [
              "sub",
              1,
              "0.5"
            ]
          ]
        }
      },
      {
        "id": "oge-21-07",
        "nodeId": "oge-21-timeline",
        "prompt": "Из пунктов в 150 км одновременно навстречу выехали два автомобиля со скоростями 30 и 45 км/ч. Первый до встречи стоял 1 час. Через сколько часов после выезда они встретились?",
        "input": "number",
        "answer": "2.4",
        "hint": "Составь сумму путей, вычитая остановку только из одного времени движения.",
        "explanation": "30(t−1)+45t=150; 75t=180; t=2,4 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              150,
              [
                "mul",
                30,
                1
              ]
            ],
            [
              "add",
              30,
              45
            ]
          ]
        }
      },
      {
        "id": "oge-21-08",
        "nodeId": "oge-21-segments",
        "prompt": "Весь путь равен 60 км. Первую половину проехали со скоростью 10 км/ч, вторую — 15 км/ч. Сколько часов занял весь путь?",
        "input": "number",
        "answer": "5",
        "hint": "Сначала найди длину каждой половины.",
        "explanation": "Каждая половина 30 км. Время 30/10+30/15=3+2=5 часов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "div",
                60,
                2
              ],
              10
            ],
            [
              "div",
              [
                "div",
                60,
                2
              ],
              15
            ]
          ]
        }
      },
      {
        "id": "oge-21-09",
        "nodeId": "oge-21-relative",
        "prompt": "Поезд движется со скоростью 20 м/с и полностью проходит мост длиной 180 м за 15 с. Найди длину поезда в метрах.",
        "input": "number",
        "answer": "120",
        "hint": "Передняя часть поезда за это время проходит мост и длину поезда.",
        "explanation": "Пройдено 20·15=300 м. Длина поезда 300−180=120 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              20,
              15
            ],
            180
          ]
        }
      },
      {
        "id": "oge-21-10",
        "nodeId": "oge-21-river-average",
        "prompt": "Первые 60 км ехали со скоростью 30 км/ч, следующие 60 км — 60 км/ч. Найди среднюю скорость всего пути в км/ч.",
        "input": "number",
        "answer": "40",
        "hint": "Раздели весь путь на всё затраченное время.",
        "explanation": "Всего 120 км; время 60/30+60/60=3 ч. Средняя скорость 120/3=40 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              60,
              60
            ],
            [
              "add",
              [
                "div",
                60,
                30
              ],
              [
                "div",
                60,
                60
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-21-11",
        "nodeId": "oge-21-work",
        "prompt": "Один насос заполняет резервуар за 12 часов, другой за 6 часов. Сколько часов нужно при совместной работе?",
        "input": "number",
        "answer": "4",
        "hint": "Сложи производительности, затем обрати полученную долю.",
        "explanation": "1/12+1/6=1/4 резервуара в час. Время совместной работы 4 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "add",
              "1/12",
              "1/6"
            ]
          ]
        }
      },
      {
        "id": "oge-21-12",
        "nodeId": "oge-21-substance",
        "prompt": "Смешали 2 кг 10%-го раствора и 3 кг 20%-го раствора одного вещества. Потерь массы нет. Какова концентрация смеси в процентах?",
        "input": "number",
        "answer": "16",
        "hint": "Сначала сложи массы чистого вещества, потом раздели на массу всей смеси.",
        "explanation": "Чистого вещества 2·0,1+3·0,2=0,8 кг, смеси 5 кг. Концентрация 0,8/5·100=16%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "add",
                [
                  "mul",
                  2,
                  "0.1"
                ],
                [
                  "mul",
                  3,
                  "0.2"
                ]
              ],
              [
                "add",
                2,
                3
              ]
            ],
            100
          ]
        }
      },
      {
        "id": "oge-21-13",
        "nodeId": "oge-21-timeline",
        "prompt": "Два автомобиля одновременно выехали навстречу из пунктов в 90 км со скоростями 30 и 45 км/ч. Первый до встречи остановился на 20 минут. Через сколько часов после выезда произошла встреча?",
        "input": "number",
        "answer": "4/3",
        "hint": "Переведи остановку в часы и вычти её только из времени первого.",
        "explanation": "20 минут = 1/3 часа. 30(t−1/3)+45t=90; 75t=100; t=4/3 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              90,
              [
                "mul",
                30,
                [
                  "div",
                  20,
                  60
                ]
              ]
            ],
            [
              "add",
              30,
              45
            ]
          ]
        }
      },
      {
        "id": "oge-21-14",
        "nodeId": "oge-21-segments",
        "prompt": "Первый участник пробегает 12 км за 1 час. Второй движется на 3 км/ч быстрее. За сколько часов второй пробежит 12 км?",
        "input": "number",
        "answer": "0.8",
        "hint": "Сначала найди скорость первого, затем скорость второго.",
        "explanation": "Скорость второго 12/1+3=15 км/ч. Время 12/15=0,8 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            [
              "add",
              [
                "div",
                12,
                1
              ],
              3
            ]
          ]
        }
      },
      {
        "id": "oge-21-15",
        "nodeId": "oge-21-relative",
        "prompt": "На круговой дорожке длиной 800 м два участника одновременно стартуют из одной точки навстречу друг другу со скоростями 4 и 6 м/с. Через сколько секунд будет первая встреча после старта?",
        "input": "number",
        "answer": "80",
        "hint": "При встречном движении относительные скорости складываются.",
        "explanation": "Суммарная скорость 4+6=10 м/с. До первой встречи вместе пройден круг: 800/10=80 с.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            800,
            [
              "add",
              4,
              6
            ]
          ]
        }
      },
      {
        "id": "oge-21-16",
        "nodeId": "oge-21-river-average",
        "prompt": "Собственная скорость катера 10 км/ч, течение 2 км/ч. Сколько часов займёт путь 48 км по течению?",
        "input": "number",
        "answer": "4",
        "hint": "По течению скорость по берегу увеличивается.",
        "explanation": "Скорость 10+2=12 км/ч. Время 48/12=4 часа.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            48,
            [
              "add",
              10,
              2
            ]
          ]
        }
      },
      {
        "id": "oge-21-17",
        "nodeId": "oge-21-work",
        "prompt": "Один исполнитель делает всю работу за 10 часов, другой за 15 часов. За сколько часов они выполнят её вместе?",
        "input": "number",
        "answer": "6",
        "hint": "При совместной работе сложи доли выполненной работы за час.",
        "explanation": "1/10+1/15=3/30+2/30=1/6 работы в час. Нужно 6 часов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "add",
              "1/10",
              "1/15"
            ]
          ]
        }
      },
      {
        "id": "oge-21-18",
        "nodeId": "oge-21-substance",
        "prompt": "Есть 6 кг плодов с содержанием воды 75%. После сушки воды стало 40%; сухое вещество сохранилось. Найди новую массу плодов в кг.",
        "input": "number",
        "answer": "2.5",
        "hint": "Сухая часть сначала равна четверти массы, а после сушки — оставшейся доле.",
        "explanation": "Сухого вещества 6·0,25=1,5 кг. Теперь это 60% массы: 1,5/0,6=2,5 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              6,
              [
                "sub",
                1,
                "0.75"
              ]
            ],
            [
              "sub",
              1,
              "0.4"
            ]
          ]
        }
      }
    ]
  },
  {
    "id": "oge-22",
    "taskNumbers": [
      22
    ],
    "title": "№22. График с условиями: границы, отверстия, пересечения",
    "goal": "Строить каждую часть на своей области, сохранять выколотые точки и считать разные пересечения при изменении параметра.",
    "transferGoal": "Выполни одно новое полное задание: выпиши область определения, построй ветви, отметь границы и отверстия, реши уравнения пересечения и обоснуй число различных точек. Сравни соседний параметр; текст объяснения сохраняется отдельно от числового ответа.",
    "source": {
      "href": "/trainers/oge-task22-functions-graphs.html",
      "title": "ОГЭ №22 · исходный тренажёр",
      "trainerId": "oge-t22-grafiki"
    },
    "inventory": {
      "sourcePath": "trainers/oge-task22-functions-graphs.html",
      "selector": "MODULES[0..2].subs[].k, кроме «Все»: 2 + 4 + 3 подтипа",
      "types": [
        {
          "id": "parline",
          "title": "Кусочная: парабола + прямая"
        },
        {
          "id": "parhyp",
          "title": "Кусочная: парабола + гипербола"
        },
        {
          "id": "absquad",
          "title": "Модуль квадратного трёхчлена"
        },
        {
          "id": "xabsx",
          "title": "x|x|"
        },
        {
          "id": "sqminuslin",
          "title": "x² − |линейное выражение|"
        },
        {
          "id": "alinplusquad",
          "title": "a|x+p| + квадрат"
        },
        {
          "id": "inv_kx",
          "title": "Гипербола 1/x с отверстием"
        },
        {
          "id": "shift_m",
          "title": "Сдвинутая гипербола с отверстием"
        },
        {
          "id": "parab_kx",
          "title": "Парабола с отверстием"
        }
      ]
    },
    "nodes": [
      {
        "id": "oge-22-domain",
        "title": "Область определения раньше рисунка",
        "goal": "Отметить запрещённые x и границы формул.",
        "dependsOn": [],
        "foundations": [
          "equation-denominators",
          "inequality-number-line",
          "expression-substitution"
        ],
        "covers": [
          "parline",
          "parhyp",
          "absquad",
          "xabsx",
          "sqminuslin",
          "alinplusquad",
          "inv_kx",
          "shift_m",
          "parab_kx"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №22",
            "href": "/trainers/oge-task22-functions-graphs.html",
            "instruction": "Перед работой в любом модуле выпиши все знаменатели и условия ветвей. Начни с «Дробь с выколотой точкой».",
            "finish": "Для 3 формул выпиши область определения до построения."
          }
        ],
        "explain": {
          "prompt": "Какие x нельзя подставлять в исходную запись?",
          "criteria": [
            "Проверены исходные знаменатели.",
            "Учтены условия каждого куска.",
            "Ограничения сохранены после упрощения."
          ]
        },
        "misconception": "Рисуют упрощённую формулу на всех x.",
        "finish": "Для 3 формул выпиши область определения до построения."
      },
      {
        "id": "oge-22-boundary",
        "title": "Каждая ветвь на своей области",
        "goal": "Назначить граничную точку правильной формуле.",
        "dependsOn": [
          "oge-22-domain"
        ],
        "foundations": [
          "inequality-number-line",
          "data-graph-building"
        ],
        "covers": [
          "parline",
          "parhyp"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №22",
            "href": "/trainers/oge-task22-functions-graphs.html",
            "instruction": "В «Кусочные функции» разбери «Парабола + прямая» и «Парабола + гипербола». Построй оба графика в тетради. На границе вычисли обе формулы, но включи только разрешённую условием. Сравни построение с разбором тренажёра.",
            "finish": "Построй 2 кусочных графика в тетради и выполни 3 проверки модели границы."
          },
          {
            "title": "Кусочная функция: чья граничная точка",
            "href": "/trainers/oge-task22-functions-graphs.html#oge-video-models",
            "instruction": "В исследовании сравни уровни прямой c=1, c=3 и c=4. Перед подсчётом укажи, какая ветвь содержит свою границу.",
            "finish": "Сделай 3 предсказания, проверь моделью и объясни хотя бы одно расхождение.",
            "investigationId": "piecewise-boundary"
          }
        ],
        "explain": {
          "prompt": "Почему на одной вертикали могут быть открытая и закрытая точки разных ветвей?",
          "criteria": [
            "У каждой ветви записан свой промежуток.",
            "На границе проверены строгий и нестрогий знаки.",
            "В график включено только допустимое значение функции."
          ]
        },
        "misconception": "Включают в график обе формулы на общей границе.",
        "finish": "Построй 2 кусочных графика в тетради и выполни 3 проверки модели границы."
      },
      {
        "id": "oge-22-hole",
        "title": "Сокращение сохраняет отверстие",
        "goal": "Различать асимптоту и выколотую точку.",
        "dependsOn": [
          "oge-22-boundary"
        ],
        "foundations": [
          "fraction-equivalent",
          "expression-common-factor",
          "data-coordinates"
        ],
        "covers": [
          "inv_kx",
          "shift_m",
          "parab_kx"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №22",
            "href": "/trainers/oge-task22-functions-graphs.html",
            "instruction": "В «Дробь с выколотой точкой» сравни «Гипербола 1/x», «Сдвинутая гипербола» и «Парабола с дыркой». После сокращения верни все запреты на рисунок.",
            "finish": "Разбери по одному примеру каждого подтипа и проверь модель отверстия."
          },
          {
            "title": "Сократили дробь — сохранили отверстие",
            "href": "/trainers/oge-task22-functions-graphs.html#oge-video-models",
            "instruction": "Меняй наклон k: сравни 0, 1/4 и 1/2. Сохрани все запрещённые значения x после сокращения.",
            "finish": "Сделай 3 проверки и объясни случай одного пересечения.",
            "investigationId": "cancelled-hole"
          }
        ],
        "explain": {
          "prompt": "Как найти положение отверстия, если в исходную формулу это x подставить нельзя?",
          "criteria": [
            "Найден запрещённый ноль сокращённого множителя.",
            "Ордината отверстия вычислена по продолженной упрощённой формуле.",
            "Значение исходной функции в отверстии не объявлено существующим."
          ]
        },
        "misconception": "Сокращённый множитель исчезает вместе с запретом.",
        "finish": "Разбери по одному примеру каждого подтипа и проверь модель отверстия."
      },
      {
        "id": "oge-22-modulus",
        "title": "Модуль и число разных пересечений",
        "goal": "Построить отражённые ветви и различать касание и два пересечения.",
        "dependsOn": [
          "oge-22-boundary"
        ],
        "foundations": [
          "signed-opposite-absolute",
          "expression-powers-roots",
          "data-graph-reading"
        ],
        "covers": [
          "absquad",
          "xabsx"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №22",
            "href": "/trainers/oge-task22-functions-graphs.html",
            "instruction": "В «Параболы с модулем» сравни «|квадрат|» и «x|x|». Разбей ось по знаку выражения под модулем и построй оба графика в тетради. Сравни своё построение с разбором тренажёра.",
            "finish": "Построй 2 графика в тетради и исследуй 3 уровня горизонтали в модели."
          },
          {
            "title": "Модуль: когда исчезают два корня",
            "href": "/trainers/oge-task22-functions-graphs.html#oge-video-models",
            "instruction": "Сравни высоты c=2, c=9/4 и c=3. До изменения модели предскажи число различных пересечений.",
            "finish": "Проверь 3 уровня и опиши, где два пересечения сливаются.",
            "investigationId": "absolute-intersections"
          }
        ],
        "explain": {
          "prompt": "Что модуль меняет на отрицательной части выражения?",
          "criteria": [
            "Определены промежутки знака.",
            "Отражены только нужные части графика.",
            "Совпавшие корни учтены один раз."
          ]
        },
        "misconception": "Отражают весь график целиком или считают касание двумя точками.",
        "finish": "Построй 2 графика в тетради и исследуй 3 уровня горизонтали в модели."
      },
      {
        "id": "oge-22-intersections",
        "title": "Уравнения пересечения и отбор по ветви",
        "goal": "Приравнять формулы, затем проверить области каждой ветви.",
        "dependsOn": [
          "oge-22-modulus",
          "oge-22-hole"
        ],
        "foundations": [
          "equation-exam-transfer",
          "expression-identities",
          "inequality-number-line"
        ],
        "covers": [
          "sqminuslin",
          "alinplusquad"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №22",
            "href": "/trainers/oge-task22-functions-graphs.html",
            "instruction": "В «Параболы с модулем» выбери «x² − |лин|» и «a|x+p| + квадрат». Для каждой области реши своё уравнение пересечения.",
            "finish": "Реши 2 задачи; выпиши все кандидаты с отметкой подходящей ветви."
          }
        ],
        "explain": {
          "prompt": "Почему корень уравнения одной ветви может не лежать на исходном графике?",
          "criteria": [
            "Модуль раскрыт по конкретному условию на x.",
            "Уравнение пересечения решено для этой ветви.",
            "Кандидат проверен по области ветви и исходной формуле."
          ]
        },
        "misconception": "Собирают корни всех формул без проверки промежутков.",
        "finish": "Реши 2 задачи; выпиши все кандидаты с отметкой подходящей ветви."
      },
      {
        "id": "oge-22-explain-count",
        "title": "Параметр и итоговое число точек",
        "goal": "Объяснить, почему число различных пересечений меняется.",
        "dependsOn": [
          "oge-22-intersections"
        ],
        "foundations": [
          "data-graph-reading",
          "equation-exam-transfer",
          "signed-opposite-absolute"
        ],
        "covers": [
          "parline",
          "parhyp",
          "absquad",
          "xabsx",
          "sqminuslin",
          "alinplusquad",
          "inv_kx",
          "shift_m",
          "parab_kx"
        ],
        "resources": [
          {
            "title": "Тренажёр ОГЭ №22",
            "href": "/trainers/oge-task22-functions-graphs.html",
            "instruction": "В каждом из трёх модулей выбери один готовый график и сравни три положения проверяющей прямой. В итоговой записи отдельно укажи исключённые точки.",
            "finish": "Закончи одно полное решение на число пересечений и проверь соседний параметр."
          }
        ],
        "explain": {
          "prompt": "Почему одно пересечение не обязательно означает касание?",
          "criteria": [
            "Перечислены или обоснованно посчитаны все кандидаты.",
            "Убраны запрещённые точки и дубликаты на границах.",
            "Для выбранного параметра объяснён именно итоговый счёт разных точек."
          ]
        },
        "misconception": "Любое единственное пересечение автоматически называют касанием.",
        "finish": "Закончи одно полное решение на число пересечений и проверь соседний параметр."
      }
    ],
    "questions": [
      {
        "id": "oge-22-01",
        "nodeId": "oge-22-domain",
        "prompt": "Для функции y = 1/(x − 3) найди единственное запрещённое значение x.",
        "input": "number",
        "answer": "3",
        "hint": "Знаменатель не может обращаться в ноль.",
        "explanation": "x−3=0 при x=3. Это значение исключено из области определения.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -3,
          "c": 0
        }
      },
      {
        "id": "oge-22-02",
        "nodeId": "oge-22-boundary",
        "prompt": "Функция задана: y=x+4 при x<1; y=x²+1 при x≥1. Найди y при x=1.",
        "input": "number",
        "answer": "2",
        "hint": "Сначала выбери ветвь по её условию, потом подставляй.",
        "explanation": "При x=1 действует ветвь x≥1: y=1²+1=2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "pow",
              1,
              2
            ],
            1
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Условие",
            "Формула"
          ],
          "rows": [
            [
              "x < 1",
              "y = x + 4"
            ],
            [
              "x ≥ 1",
              "y = x² + 1"
            ]
          ]
        }
      },
      {
        "id": "oge-22-03",
        "nodeId": "oge-22-hole",
        "prompt": "Дан график y = (x − 2)/(x(x − 2)). При x=2 находится отверстие. Найди ординату этой выколотой точки.",
        "input": "number",
        "answer": "1/2",
        "hint": "Сократи общий множитель для допустимых x и вычисли ординату продолженного графика.",
        "explanation": "При x≠0,2 формула равна 1/x. Отверстие имеет координаты (2;1/2); значение исходной функции при x=2 не существует.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            2
          ]
        }
      },
      {
        "id": "oge-22-04",
        "nodeId": "oge-22-modulus",
        "prompt": "Сколько различных точек пересечения у y = |x² − 4| и y = 1?",
        "input": "number",
        "answer": "4",
        "hint": "Раздели равенство с модулем на два случая и не повторяй одинаковые корни.",
        "explanation": "x²−4=1 или −1, то есть x²=5 или x²=3. Каждый случай даёт два разных корня; всего 4 точки.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "add",
              1,
              [
                "cmp",
                [
                  "add",
                  4,
                  1
                ],
                0
              ]
            ],
            [
              "add",
              1,
              [
                "cmp",
                [
                  "sub",
                  4,
                  1
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-22-05",
        "nodeId": "oge-22-intersections",
        "prompt": "Найди положительную абсциссу пересечения y = x² − |x| и y = 2.",
        "input": "number",
        "answer": "2",
        "hint": "На положительной полуоси |x|=x. После решения проверь знак x.",
        "explanation": "Для x>0 получаем x²−x−2=0: кандидаты 2 и −1. Положительная абсцисса — 2.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -1,
          "c": -2,
          "selection": "larger",
          "domain": {
            "min": 0
          }
        }
      },
      {
        "id": "oge-22-06",
        "nodeId": "oge-22-explain-count",
        "prompt": "Сколько различных точек пересечения у y = (x − 2)/(x(x − 2)) и y = x/9?",
        "input": "number",
        "answer": "2",
        "hint": "После сокращения сохрани оба запрета и проверь кандидатов пересечения.",
        "explanation": "x≠0,2. Из 1/x=x/9 получаем x²=9, то есть x=±3. Оба допустимы; точек 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              [
                "max",
                [
                  "cmp",
                  "1/9",
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "abs",
                [
                  "cmp",
                  [
                    "mul",
                    "1/9",
                    [
                      "pow",
                      2,
                      2
                    ]
                  ],
                  1
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-22-07",
        "nodeId": "oge-22-domain",
        "prompt": "Найди запрещённое значение x для y = 2/(x + 4).",
        "input": "number",
        "answer": "-4",
        "hint": "Приравняй знаменатель к нулю только для поиска запрета.",
        "explanation": "x+4=0 при x=−4; это значение исключается.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 4,
          "c": 0
        }
      },
      {
        "id": "oge-22-08",
        "nodeId": "oge-22-boundary",
        "prompt": "Дано y=2x−1 при x≤2; y=x² при x>2. Найди y при x=2.",
        "input": "number",
        "answer": "3",
        "hint": "Равенство на границе относится только к одной ветви.",
        "explanation": "При x=2 используется первая ветвь: y=2·2−1=3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              2
            ],
            1
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Условие",
            "Формула"
          ],
          "rows": [
            [
              "x ≤ 2",
              "y = 2x − 1"
            ],
            [
              "x > 2",
              "y = x²"
            ]
          ]
        }
      },
      {
        "id": "oge-22-09",
        "nodeId": "oge-22-hole",
        "prompt": "У y = (x + 3)/(x(x + 3)) выколота точка с x=−3. Найди её ординату.",
        "input": "number",
        "answer": "-1/3",
        "hint": "Упрощённая формула задаёт продолженный график, но исходный запрет остаётся.",
        "explanation": "При x≠0,−3 имеем y=1/x. Ордината отверстия равна 1/(−3)=−1/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            -3
          ]
        }
      },
      {
        "id": "oge-22-10",
        "nodeId": "oge-22-modulus",
        "prompt": "Сколько различных пересечений имеют y = |x² − 9| и y = 9?",
        "input": "number",
        "answer": "3",
        "hint": "В одном из двух случаев квадрат может равняться нулю.",
        "explanation": "x²=18 даёт два корня, x²=0 — только один корень x=0. Всего 3 различные точки.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "add",
              1,
              [
                "cmp",
                [
                  "add",
                  9,
                  9
                ],
                0
              ]
            ],
            [
              "add",
              1,
              [
                "cmp",
                [
                  "sub",
                  9,
                  9
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-22-11",
        "nodeId": "oge-22-intersections",
        "prompt": "Графики y = 2|x + 1| + x² и y = 5 пересекаются. Найди абсциссу пересечения на ветви x≥−1.",
        "input": "number",
        "answer": "1",
        "hint": "На указанной ветви замени модуль на x+1 и проверь найденные корни.",
        "explanation": "x²+2x+2=5, то есть x²+2x−3=0. Кандидаты 1 и −3; условию x≥−1 соответствует 1.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": 2,
          "c": -3,
          "selection": "larger",
          "domain": {
            "min": -1
          }
        }
      },
      {
        "id": "oge-22-12",
        "nodeId": "oge-22-explain-count",
        "prompt": "Сколько различных точек пересечения у y = (x − 3)/(x(x − 3)) и y = x/9?",
        "input": "number",
        "answer": "1",
        "hint": "Один из кандидатов упрощённого уравнения может совпасть с отверстием.",
        "explanation": "x≠0,3. Уравнение 1/x=x/9 даёт x=±3. Точка при x=3 выколота; остаётся одна точка при x=−3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              [
                "max",
                [
                  "cmp",
                  "1/9",
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "abs",
                [
                  "cmp",
                  [
                    "mul",
                    "1/9",
                    [
                      "pow",
                      3,
                      2
                    ]
                  ],
                  1
                ]
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-22-13",
        "nodeId": "oge-22-domain",
        "prompt": "Для y = 1/(2x − 5) найди запрещённое значение аргумента.",
        "input": "number",
        "answer": "5/2",
        "hint": "Запрет определяется нулём всего знаменателя.",
        "explanation": "2x−5=0, поэтому x=5/2 запрещено.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": -5,
          "c": 0
        }
      },
      {
        "id": "oge-22-14",
        "nodeId": "oge-22-boundary",
        "prompt": "Дано y=6/x при x<3, x≠0; y=x²−4 при x≥3. Найди y при x=3.",
        "input": "number",
        "answer": "5",
        "hint": "Не используй формулу ветви, которая не содержит границу.",
        "explanation": "При x=3 действует вторая ветвь: y=3²−4=5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              3,
              2
            ],
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Условие",
            "Формула"
          ],
          "rows": [
            [
              "x < 3, x ≠ 0",
              "y = 6/x"
            ],
            [
              "x ≥ 3",
              "y = x² − 4"
            ]
          ]
        }
      },
      {
        "id": "oge-22-15",
        "nodeId": "oge-22-hole",
        "prompt": "График y = ((x − 4)(x + 1))/(x − 4) имеет отверстие при x=4. Найди ординату выколотой точки.",
        "input": "number",
        "answer": "5",
        "hint": "После сокращения получится прямая, но одно исходное значение x останется запрещённым.",
        "explanation": "Для x≠4 имеем y=x+1. На продолженной прямой при x=4 ордината 5, поэтому отверстие (4;5).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            1
          ]
        }
      },
      {
        "id": "oge-22-16",
        "nodeId": "oge-22-modulus",
        "prompt": "Сколько различных точек пересечения у y = |x² − 4| и y = 5?",
        "input": "number",
        "answer": "2",
        "hint": "Один случай может потребовать отрицательного значения квадрата.",
        "explanation": "Получаем x²=9 или x²=−1. Второй случай невозможен над действительными числами; первый даёт x=±3. Всего 2 точки.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "add",
              1,
              [
                "cmp",
                [
                  "add",
                  4,
                  5
                ],
                0
              ]
            ],
            [
              "add",
              1,
              [
                "cmp",
                [
                  "sub",
                  4,
                  5
                ],
                0
              ]
            ]
          ]
        }
      },
      {
        "id": "oge-22-17",
        "nodeId": "oge-22-intersections",
        "prompt": "Найди положительную абсциссу пересечения y = x² − |2x| и y = 3.",
        "input": "number",
        "answer": "3",
        "hint": "Для x>0 выражение |2x| равно 2x.",
        "explanation": "На положительной полуоси x²−2x−3=0, кандидаты 3 и −1. Подходит x=3.",
        "oracle": {
          "kind": "quadratic-root",
          "a": 1,
          "b": -2,
          "c": -3,
          "selection": "larger",
          "domain": {
            "min": 0
          }
        }
      },
      {
        "id": "oge-22-18",
        "nodeId": "oge-22-explain-count",
        "prompt": "Сколько точек пересечения у y = (x + 2)/(x(x + 2)) и y = −x?",
        "input": "number",
        "answer": "0",
        "hint": "Сохрани запреты, затем посмотри, какое значение потребуется от x².",
        "explanation": "При x≠0,−2 уравнение имеет вид 1/x=−x, то есть x²=−1. Действительных решений нет; пересечений 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              [
                "max",
                [
                  "cmp",
                  -1,
                  0
                ],
                0
              ]
            ],
            [
              "sub",
              1,
              [
                "abs",
                [
                  "cmp",
                  [
                    "mul",
                    -1,
                    [
                      "pow",
                      -2,
                      2
                    ]
                  ],
                  1
                ]
              ]
            ]
          ]
        }
      }
    ]
  }
];
});
