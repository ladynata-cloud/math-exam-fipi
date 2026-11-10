/*
 * Practical OGE skill maps: 8 plots, 48 skill nodes, 57 exam entrances and
 * 2 tyre preparation entrances. Native selectors checked against commit
 * 19811cc15a33d63fc0fcc0b6a11c34863ec64d03.
 * Each map has practice[0..5], check A[6..11], check B[12..17].
 * Exact mathematical witnesses use the existing foundations oracle.
 * Explanations are reviewed separately; this module does not assess free text.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.OgePracticalSkillMaps=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  return [
  {
    "id": "practical-roads-grid",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Дороги по клеткам",
    "goal": "Прочитать план и выбрать маршрут по расстоянию, времени или полной стоимости.",
    "transferGoal": "На новой карте сначала назови критерий выбора и единицы, затем восстанови длины; знакомый рисунок не нужен.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
      "title": "Дороги по клеткам",
      "trainerId": "practiceRoadsGridTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
      "selector": "#task-stepper [data-task]",
      "types": [
        {
          "id": "0",
          "title": "№1 · Пункты",
          "kind": "exam"
        },
        {
          "id": "1",
          "title": "№2 · По шоссе",
          "kind": "exam"
        },
        {
          "id": "2",
          "title": "№3 · По прямой",
          "kind": "exam"
        },
        {
          "id": "3",
          "title": "№4 · Время",
          "kind": "exam"
        },
        {
          "id": "4",
          "title": "№5 · Магазин",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "grid-read-map",
        "title": "Прочитать план",
        "goal": "Связать описание, номера пунктов и условные обозначения.",
        "dependsOn": [],
        "foundations": [
          "data-tables",
          "geometry-segments"
        ],
        "resources": [
          {
            "title": "Пункты на плане",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
            "instruction": "Открой «№1 · пункты». Для одного сюжета сопоставь все названия и номера.",
            "finish": "Одна таблица соответствий заполнена и проверена."
          },
          {
            "title": "Чтение плана и условия",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-plan-reading.html",
            "instruction": "Выбери «Обучение», нажми «Начать» и пройди первые три задания: вопрос, масштаб, данные.",
            "finish": "Три ответа разобраны; в каждом названы искомая величина и нужные данные."
          }
        ],
        "explain": {
          "prompt": "Как ты установил название пункта, если его положение на листе изменилось?",
          "criteria": [
            "Назови связь из условия: поворот, соседний пункт или вид дороги.",
            "Проверь найденный номер по второму признаку."
          ]
        },
        "misconception": "Определять населённый пункт по похожей картинке или размеру значка.",
        "covers": [
          "0"
        ],
        "finish": "Для каждого пункта есть ссылка на текст условия."
      },
      {
        "id": "grid-scale-length",
        "title": "Клетки превращаются в километры",
        "goal": "Посчитать промежутки и применить масштаб к каждому участку.",
        "dependsOn": [
          "grid-read-map"
        ],
        "foundations": [
          "ratio-scale",
          "geometry-units"
        ],
        "resources": [
          {
            "title": "Шоссе и счёт клеток",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
            "instruction": "Выбери «№2 · по шоссе». При необходимости включи «парами» и «пройти по клеткам». Реши два задания с разными числами.",
            "finish": "Записаны число клеток, масштаб и длина двух маршрутов."
          }
        ],
        "explain": {
          "prompt": "Почему число точек на дороге отличается от числа клеток?",
          "criteria": [
            "Считай промежутки между соседними линиями сетки.",
            "Сложи длины частей и подпиши километры."
          ]
        },
        "misconception": "Считать линии вместо промежутков или забывать масштаб.",
        "covers": [
          "1"
        ],
        "finish": "Два пути переведены из клеток в километры."
      },
      {
        "id": "grid-shortcut",
        "title": "Найти прямую тропу",
        "goal": "Отличить сумму дорог от гипотенузы прямоугольного треугольника.",
        "dependsOn": [
          "grid-scale-length"
        ],
        "foundations": [
          "expression-powers-roots",
          "geometry-perpendicular"
        ],
        "resources": [
          {
            "title": "Тропа по прямой",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
            "instruction": "Открой «№3 · по прямой». Выдели два перпендикулярных участка; реши одну задачу и проверь её неравенством треугольника.",
            "finish": "Найдены катеты и длина тропы, меньшая их суммы."
          }
        ],
        "explain": {
          "prompt": "Почему диагональ нельзя считать как число клеток по горизонтали плюс число клеток по вертикали?",
          "criteria": [
            "Покажи прямой угол и два катета в одних единицах.",
            "Запиши квадрат длины тропы как сумму квадратов.",
            "Сравни ответ с каждым катетом и с их суммой."
          ]
        },
        "misconception": "Складывать катеты для прямой тропы или брать корень до сложения квадратов.",
        "covers": [
          "2"
        ],
        "finish": "Одна диагональ найдена и оценена по смыслу."
      },
      {
        "id": "grid-time",
        "title": "Сравнить время в пути",
        "goal": "Для каждого покрытия использовать свою скорость и перевести часы в минуты.",
        "dependsOn": [
          "grid-scale-length",
          "grid-shortcut"
        ],
        "foundations": [
          "word-distance",
          "geometry-units"
        ],
        "resources": [
          {
            "title": "Время по участкам",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
            "instruction": "Открой «№4 · время». Составь таблицу «участок — расстояние — скорость — время» для одного маршрута.",
            "finish": "Времена частей сложены; итог дан в единицах вопроса."
          }
        ],
        "explain": {
          "prompt": "Как проверить, что короткая тропа действительно быстрее длинного шоссе?",
          "criteria": [
            "Для каждого пути вычисли расстояние, делённое на его скорость.",
            "Переведи результаты в одинаковые единицы.",
            "Сравни времена, а не только расстояния."
          ]
        },
        "misconception": "Считать самым быстрым любой кратчайший путь; принимать 0,5 часа за 50 минут.",
        "covers": [
          "3"
        ],
        "finish": "Для двух способов поездки сопоставлены времена."
      },
      {
        "id": "grid-full-cost",
        "title": "Учесть всю стоимость",
        "goal": "Сложить цену покупки и поездки по условиям задачи.",
        "dependsOn": [
          "grid-time"
        ],
        "foundations": [
          "word-change",
          "decimal-multiply"
        ],
        "resources": [
          {
            "title": "Выбор магазина",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
            "instruction": "Выбери «№5 · магазин». Выпиши отдельно товар и дорогу; реши один пример выбора магазина.",
            "finish": "Для каждого магазина получена полная стоимость."
          }
        ],
        "explain": {
          "prompt": "Какие данные понадобятся, если дешевле товар, но дальше ехать?",
          "criteria": [
            "Выпиши число покупок, цену и все расходы на поездку.",
            "Уточни, включена ли обратная дорога.",
            "Сравни суммы для одинаковой покупки."
          ]
        },
        "misconception": "Сравнивать только ценник или дважды учитывать уже указанную стоимость туда и обратно.",
        "covers": [
          "4"
        ],
        "finish": "Решение опирается на полные суммы."
      },
      {
        "id": "grid-transfer",
        "title": "Проверить критерий и ответ",
        "goal": "Самостоятельно выбрать нужную модель на изменённой карте.",
        "dependsOn": [
          "grid-read-map",
          "grid-scale-length",
          "grid-shortcut",
          "grid-time",
          "grid-full-cost"
        ],
        "foundations": [
          "word-comparison",
          "rounding"
        ],
        "resources": [
          {
            "title": "Новый сюжет",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
            "instruction": "Выбери другой сюжет. Реши одну задачу на путь, одну на время и одну на магазин, каждый раз сначала произнеся вопрос.",
            "finish": "Три задачи решены по трём разным критериям."
          },
          {
            "title": "Входная диагностика № 1–5",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html",
            "instruction": "Нажми «Начать диагностику» и закончи все 10 коротких заданий. Затем открой разбор только своих ошибок.",
            "finish": "Получен стартовый маршрут; выбрано одно действие, которое нужно повторить."
          }
        ],
        "explain": {
          "prompt": "Что изменится в твоём решении, если попросят самый дешёвый путь вместо самого быстрого?",
          "criteria": [
            "Назови новую искомую величину и единицы.",
            "Укажи, какие прежние данные остаются нужны.",
            "Проверь, что итог отвечает именно новому вопросу."
          ]
        },
        "misconception": "Переносить готовый ответ между разными вопросами одного рисунка.",
        "covers": [
          "1",
          "2",
          "3",
          "4"
        ],
        "finish": "На новой карте названы критерий, модель и проверка ответа."
      }
    ],
    "questions": [
      {
        "prompt": "Нужно проехать из A в C через B. По таблице выбери выражение для длины этого пути.",
        "input": "choice",
        "answer": "6 + 8",
        "choices": [
          "6 + 10",
          "8 + 10",
          "6 + 8"
        ],
        "hint": "Проверь, какие два отрезка последовательно соединяют A, B и C.",
        "explanation": "Путь A–B–C состоит из AB и BC: 6 + 8 = 14 км.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            6,
            8
          ],
          "values": [
            [
              "add",
              6,
              10
            ],
            [
              "add",
              8,
              10
            ],
            [
              "add",
              6,
              8
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Дорога",
            "Длина, км"
          ],
          "rows": [
            [
              "AB",
              6
            ],
            [
              "BC",
              8
            ],
            [
              "AC, тропа",
              10
            ]
          ]
        },
        "id": "practical-roads-grid-practice-01",
        "nodeId": "grid-read-map"
      },
      {
        "prompt": "Маршрут по шоссе состоит из 4 горизонтальных и 3 вертикальных клеток. Сторона клетки соответствует 2 км. Какова длина маршрута в километрах?",
        "input": "number",
        "answer": "14",
        "hint": "Сначала посчитай все пройденные промежутки, затем примени масштаб.",
        "explanation": "(4 + 3) · 2 = 14 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              4,
              3
            ],
            2
          ]
        },
        "id": "practical-roads-grid-practice-02",
        "nodeId": "grid-scale-length"
      },
      {
        "prompt": "Два участка шоссе длиной 6 и 8 км образуют прямой угол. Тропа соединяет их свободные концы по прямой. Найди длину тропы в километрах.",
        "input": "number",
        "answer": "10",
        "hint": "Тропа — гипотенуза. Сложи квадраты двух катетов.",
        "explanation": "6² + 8² = 100, поэтому длина тропы 10 км.",
        "oracle": {
          "kind": "square-root",
          "radicand": 100
        },
        "id": "practical-roads-grid-practice-03",
        "nodeId": "grid-shortcut"
      },
      {
        "prompt": "Едут 12 км по шоссе со скоростью 40 км/ч и 6 км по тропе со скоростью 20 км/ч. Сколько минут займёт весь путь?",
        "input": "number",
        "answer": "36",
        "hint": "Для каждой части найди своё время. Переведи сумму часов в минуты.",
        "explanation": "12/40 + 6/20 = 0,6 ч; 0,6 · 60 = 36 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              [
                "div",
                12,
                40
              ],
              [
                "div",
                6,
                20
              ]
            ],
            60
          ]
        },
        "id": "practical-roads-grid-practice-04",
        "nodeId": "grid-time"
      },
      {
        "prompt": "Нужно купить 2 одинаковых товара. Поездка в таблице уже включает путь туда и обратно. Выбери меньшую полную стоимость.",
        "input": "choice",
        "answer": "340 руб.",
        "choices": [
          "340 руб.",
          "300 руб.",
          "360 руб."
        ],
        "hint": "В каждом магазине сложи цену двух товаров и одну указанную стоимость поездки.",
        "explanation": "Магазин А: 2 · 150 + 40 = 340 руб.; Б: 2 · 140 + 80 = 360 руб.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "add",
              [
                "mul",
                2,
                150
              ],
              40
            ],
            [
              "add",
              [
                "mul",
                2,
                140
              ],
              80
            ]
          ],
          "values": [
            340,
            300,
            360
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Магазин",
            "Цена товара, руб.",
            "Поездка, руб."
          ],
          "rows": [
            [
              "А",
              150,
              40
            ],
            [
              "Б",
              140,
              80
            ]
          ]
        },
        "id": "practical-roads-grid-practice-05",
        "nodeId": "grid-full-cost"
      },
      {
        "prompt": "До пункта можно проехать 10 км по шоссе со скоростью 50 км/ч или 8 км по тропе со скоростью 20 км/ч. На сколько минут путь по тропе дольше?",
        "input": "number",
        "answer": "12",
        "hint": "Кратчайший путь не обязательно самый быстрый. Сначала найди оба времени.",
        "explanation": "Тропа: 24 мин; шоссе: 12 мин. Разница 12 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              [
                "div",
                8,
                20
              ],
              60
            ],
            [
              "mul",
              [
                "div",
                10,
                50
              ],
              60
            ]
          ]
        },
        "id": "practical-roads-grid-practice-06",
        "nodeId": "grid-transfer"
      },
      {
        "prompt": "Маршрут состоит из AB, BC и CD. В таблице указан вид каждой дороги. Сколько километров этого маршрута проходит по грунтовой дороге?",
        "input": "number",
        "answer": "11",
        "hint": "Отбери только строки с нужным видом дороги.",
        "explanation": "Грунтовые участки AB и CD: 4 + 7 = 11 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            7
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Участок",
            "Вид",
            "Длина, км"
          ],
          "rows": [
            [
              "AB",
              "грунтовая",
              4
            ],
            [
              "BC",
              "шоссе",
              9
            ],
            [
              "CD",
              "грунтовая",
              7
            ]
          ]
        },
        "id": "practical-roads-grid-check-a-01",
        "nodeId": "grid-read-map"
      },
      {
        "prompt": "Прямой участок длиной 15 км занимает на плане ровно 6 клеточных промежутков. Сколько километров соответствует стороне одной клетки?",
        "input": "number",
        "answer": "2.5",
        "hint": "Раздели реальную длину поровну между шестью промежутками.",
        "explanation": "15 : 6 = 2,5 км на одну клетку.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            15,
            6
          ]
        },
        "id": "practical-roads-grid-check-a-02",
        "nodeId": "grid-scale-length"
      },
      {
        "prompt": "На плане две перпендикулярные дороги имеют длины 5 и 12 км. Их дальние концы соединены прямой тропой. Какова её длина в километрах?",
        "input": "number",
        "answer": "13",
        "hint": "Вычисли квадрат гипотенузы и затем извлеки корень.",
        "explanation": "5² + 12² = 169; тропа имеет длину 13 км.",
        "oracle": {
          "kind": "square-root",
          "radicand": 169
        },
        "id": "practical-roads-grid-check-a-03",
        "nodeId": "grid-shortcut"
      },
      {
        "prompt": "Пешеход прошёл по тропе 5 км за 1 час 15 минут. Найди его среднюю скорость в км/ч.",
        "input": "number",
        "answer": "4",
        "hint": "Переведи всё время в часы, затем раздели путь на время.",
        "explanation": "1 ч 15 мин = 1,25 ч; 5 : 1,25 = 4 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            [
              "div",
              75,
              60
            ]
          ]
        },
        "id": "practical-roads-grid-check-a-04",
        "nodeId": "grid-time"
      },
      {
        "prompt": "Покупают 5 пакетов по 96 рублей. Доставка всей покупки стоит 120 рублей. Из 700 рублей сколько останется после оплаты?",
        "input": "number",
        "answer": "100",
        "hint": "Найди полную сумму покупки и доставки, затем остаток денег.",
        "explanation": "5 · 96 + 120 = 600 руб.; 700 − 600 = 100 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            700,
            [
              "add",
              [
                "mul",
                5,
                96
              ],
              120
            ]
          ]
        },
        "id": "practical-roads-grid-check-a-05",
        "nodeId": "grid-full-cost"
      },
      {
        "prompt": "По расчёту время поездки равно 1,5 часа. Ученик записал ответ 150 минут. Какое число минут надо записать вместо этого?",
        "input": "number",
        "answer": "90",
        "hint": "Десятая доля часа не равна десяти минутам.",
        "explanation": "1,5 · 60 = 90 минут.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "1.5",
            60
          ]
        },
        "id": "practical-roads-grid-check-a-06",
        "nodeId": "grid-transfer"
      },
      {
        "prompt": "По условию надо проехать A–D через C, не заезжая в B. Выбери расчёт по таблице.",
        "input": "choice",
        "answer": "7 + 11",
        "choices": [
          "7 + 11",
          "4 + 7",
          "4 + 9"
        ],
        "hint": "Прочитай маршрут по названиям концов каждого отрезка.",
        "explanation": "Маршрут A–C–D использует AC и CD: 7 + 11 = 18 км.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            7,
            11
          ],
          "values": [
            [
              "add",
              7,
              11
            ],
            [
              "add",
              4,
              7
            ],
            [
              "add",
              4,
              9
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Участок",
            "Длина, км"
          ],
          "rows": [
            [
              "AB",
              4
            ],
            [
              "BD",
              9
            ],
            [
              "AC",
              7
            ],
            [
              "CD",
              11
            ]
          ]
        },
        "id": "practical-roads-grid-check-b-01",
        "nodeId": "grid-read-map"
      },
      {
        "prompt": "На плане путь по шоссе занимает 9 клеток. Сторона клетки соответствует 0,4 км. Найди длину пути в метрах.",
        "input": "number",
        "answer": "3600",
        "hint": "Сначала получи километры, затем переведи их в метры.",
        "explanation": "9 · 0,4 = 3,6 км = 3600 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            9,
            "0.4",
            1000
          ]
        },
        "id": "practical-roads-grid-check-b-02",
        "nodeId": "grid-scale-length"
      },
      {
        "prompt": "Шоссе образует прямой угол с участками 8 и 15 км. Прямая тропа соединяет их дальние концы. Найди её длину в километрах.",
        "input": "number",
        "answer": "17",
        "hint": "Используй длины катетов, а не их сумму.",
        "explanation": "8² + 15² = 289; тропа равна 17 км.",
        "oracle": {
          "kind": "square-root",
          "radicand": 289
        },
        "id": "practical-roads-grid-check-b-03",
        "nodeId": "grid-shortcut"
      },
      {
        "prompt": "Шоссе длиной 18 км проходят со скоростью 45 км/ч, тропу длиной 12 км — со скоростью 24 км/ч. Выбери самый быстрый вариант и его время.",
        "input": "choice",
        "answer": "Шоссе: 24 мин",
        "choices": [
          "Одинаково: 18 мин",
          "Тропа: 30 мин",
          "Шоссе: 24 мин"
        ],
        "hint": "Сравни два отношения «путь : скорость» в минутах.",
        "explanation": "Шоссе занимает 24 мин, тропа — 30 мин. Быстрее шоссе.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "mul",
              [
                "div",
                18,
                45
              ],
              60
            ],
            [
              "mul",
              [
                "div",
                12,
                24
              ],
              60
            ]
          ],
          "values": [
            18,
            30,
            24
          ]
        },
        "id": "practical-roads-grid-check-b-04",
        "nodeId": "grid-time"
      },
      {
        "prompt": "В магазине А товар стоит 480 рублей, а вся поездка — 90 рублей. В магазине Б тот же товар стоит 520 рублей, поездка — 40 рублей. На сколько рублей дешевле полная покупка в Б?",
        "input": "number",
        "answer": "10",
        "hint": "Сначала получи две полные суммы, затем их разницу.",
        "explanation": "В А: 570 руб.; в Б: 560 руб. В Б дешевле на 10 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              480,
              90
            ],
            [
              "add",
              520,
              40
            ]
          ]
        },
        "id": "practical-roads-grid-check-b-05",
        "nodeId": "grid-full-cost"
      },
      {
        "prompt": "До магазина 12 км. Машина расходует 5 л на 100 км, бензин стоит 60 руб./л. Сколько рублей стоит бензин на поездку туда и обратно?",
        "input": "number",
        "answer": "72",
        "hint": "В расходы входит удвоенное расстояние до магазина.",
        "explanation": "Всего 24 км; расход 24 · 5 / 100 = 1,2 л; стоимость 1,2 · 60 = 72 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "mul",
                2,
                12,
                5
              ],
              100
            ],
            60
          ]
        },
        "id": "practical-roads-grid-check-b-06",
        "nodeId": "grid-transfer"
      }
    ]
  },
  {
    "id": "practical-roads-schema",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Дороги без клеток",
    "goal": "Восстановить длины по схеме, рассчитать время и расход топлива.",
    "transferGoal": "Размеры рисунка не измеряются линейкой: каждое число следует из текста, геометрии или таблицы.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
      "title": "Дороги без клеток",
      "trainerId": "practiceRoadsSchemaTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
      "selector": ".tasktab[data-task]",
      "types": [
        {
          "id": "1",
          "title": "№1 · Названия пунктов",
          "kind": "exam"
        },
        {
          "id": "2",
          "title": "№2 · Длина дороги",
          "kind": "exam"
        },
        {
          "id": "3",
          "title": "№3 · Прямой путь",
          "kind": "exam"
        },
        {
          "id": "4",
          "title": "№4 · Время",
          "kind": "exam"
        },
        {
          "id": "5",
          "title": "№5 · Расход топлива",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "schema-relations",
        "title": "Связи вместо масштаба рисунка",
        "goal": "Определить порядок пунктов и виды дорог по описанию.",
        "dependsOn": [],
        "foundations": [
          "geometry-segments",
          "data-tables"
        ],
        "resources": [
          {
            "title": "Разметка схемы",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
            "instruction": "Открой режим разметки и размести названия пунктов. Затем проверь «№1» любого основного варианта.",
            "finish": "Одно соответствие названий и номеров проверено."
          },
          {
            "title": "Чтение плана и условия",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-plan-reading.html",
            "instruction": "Выбери «Обучение», нажми «Начать» и пройди первые три задания: вопрос, масштаб, данные.",
            "finish": "Три ответа разобраны; в каждом названы искомая величина и нужные данные."
          }
        ],
        "explain": {
          "prompt": "Почему нельзя измерять расстояние на этой схеме линейкой?",
          "criteria": [
            "Найди в условии источник длины.",
            "Объясни, что схема показывает связи и прямые углы, а не обязательный масштаб.",
            "Подтверди порядок двух пунктов."
          ]
        },
        "misconception": "Восстанавливать километры по длине нарисованной линии.",
        "covers": [
          "1"
        ],
        "finish": "Схема прочитана без измерения изображения."
      },
      {
        "id": "schema-segments",
        "title": "Целое и части дороги",
        "goal": "Получить недостающую длину сложением или вычитанием отрезков.",
        "dependsOn": [
          "schema-relations"
        ],
        "foundations": [
          "geometry-segments",
          "subtraction-borrow"
        ],
        "resources": [
          {
            "title": "Длина по шоссе",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
            "instruction": "В одном основном варианте открой «№2». Отметь начало и конец искомого участка; запиши одну проверку сложением.",
            "finish": "Длина найдена и восстановлено исходное целое."
          }
        ],
        "explain": {
          "prompt": "Когда расстояния на одной дороге надо складывать, а когда вычитать?",
          "criteria": [
            "Запиши порядок точек.",
            "Сопоставь целый отрезок и известную часть.",
            "После вычитания сложи части обратно."
          ]
        },
        "misconception": "Складывать любые два числа из условия независимо от порядка точек.",
        "covers": [
          "2"
        ],
        "finish": "Порядок точек объясняет выбранное действие."
      },
      {
        "id": "schema-right-triangle",
        "title": "Прямая дорога и прямой угол",
        "goal": "Использовать Пифагора только после выделения прямоугольного треугольника.",
        "dependsOn": [
          "schema-segments"
        ],
        "foundations": [
          "geometry-perpendicular",
          "expression-powers-roots"
        ],
        "resources": [
          {
            "title": "Прямое расстояние",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
            "instruction": "Открой «№3» в двух разных основных вариантах. Для каждого нарисуй маленький треугольник с подписями катетов.",
            "finish": "Два расстояния получены из своих катетов."
          }
        ],
        "explain": {
          "prompt": "Как ты проверишь, что найденные длины можно поставить в теорему Пифагора?",
          "criteria": [
            "Покажи прямой угол.",
            "Различи катеты и гипотенузу.",
            "Проверь размер ответа: гипотенуза больше каждого катета."
          ]
        },
        "misconception": "Применять Пифагора к любому треугольнику на схеме.",
        "covers": [
          "3"
        ],
        "finish": "Для прямого пути указан подходящий треугольник."
      },
      {
        "id": "schema-piecewise-time",
        "title": "Время по разным дорогам",
        "goal": "Сложить времена, вычисленные по своим скоростям.",
        "dependsOn": [
          "schema-segments",
          "schema-right-triangle"
        ],
        "foundations": [
          "word-distance",
          "word-average-speed"
        ],
        "resources": [
          {
            "title": "Маршрут из нескольких частей",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
            "instruction": "Выбери «№4» основного варианта. Раздели маршрут на шоссе и грунтовую дорогу, затем реши один пример.",
            "finish": "Есть отдельное время каждого типа покрытия и общий итог."
          }
        ],
        "explain": {
          "prompt": "Почему среднее арифметическое двух скоростей здесь может дать неверный результат?",
          "criteria": [
            "Сначала найди полное время как сумму времён частей.",
            "Сложи полные расстояния.",
            "Если нужна средняя скорость, раздели общий путь на общее время."
          ]
        },
        "misconception": "Делить весь путь на простое среднее двух скоростей.",
        "covers": [
          "4"
        ],
        "finish": "Итог учитывает время каждого участка."
      },
      {
        "id": "schema-fuel",
        "title": "Расход на 100 километров",
        "goal": "Составить баланс топлива и найти известный или неизвестный расход.",
        "dependsOn": [
          "schema-segments"
        ],
        "foundations": [
          "proportion-direct",
          "equation-linear",
          "decimal-multiply"
        ],
        "resources": [
          {
            "title": "Топливо и неизвестная норма",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
            "instruction": "Реши «№5» одного основного варианта и один пример из «Доп. задание 5». Подпиши литры и литры на 100 км.",
            "finish": "Два расчёта: прямой расход и восстановление неизвестной нормы."
          }
        ],
        "explain": {
          "prompt": "Чем расход 8 литров на 100 км отличается от 8 литров на всю поездку?",
          "criteria": [
            "Запиши топливо каждого участка: длина × норма / 100.",
            "Для неизвестной нормы вычти известный расход из общего.",
            "Проверь найденную норму подстановкой."
          ]
        },
        "misconception": "Не делить норму на 100 или смешивать нормы разных покрытий.",
        "covers": [
          "5"
        ],
        "finish": "Баланс топлива сходится после обратной подстановки."
      },
      {
        "id": "schema-route-check",
        "title": "Проверить решение для нового маршрута",
        "goal": "Обосновать выбранную цепочку дорог и проверить итог единицами.",
        "dependsOn": [
          "schema-relations",
          "schema-segments",
          "schema-right-triangle",
          "schema-piecewise-time",
          "schema-fuel"
        ],
        "foundations": [
          "ratio-common-units",
          "word-comparison"
        ],
        "resources": [
          {
            "title": "Другой основной вариант",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html",
            "instruction": "Переключись на ещё не разобранный основной вариант. Реши «№4» и «№5» с одним рисунком, но разными таблицами расчётов.",
            "finish": "Отдельно получены время и топливо одного маршрута."
          }
        ],
        "explain": {
          "prompt": "Какая часть решения сохранится, если скорости останутся прежними, а расход топлива поменяется?",
          "criteria": [
            "Отдели геометрические длины от условий движения.",
            "Назови величины, которые нужно пересчитать.",
            "Проверь единицы и порядок величины каждого ответа."
          ]
        },
        "misconception": "Считать один удачный расчёт универсальным для всех условий схемы.",
        "covers": [
          "2",
          "3",
          "4",
          "5"
        ],
        "finish": "Новое условие меняет только нужную часть модели."
      }
    ],
    "questions": [
      {
        "prompt": "Пункты P и Q находятся на одном прямом шоссе по одну сторону от O. OP = 9 км, OQ = 15 км. Найди PQ в километрах.",
        "input": "number",
        "answer": "6",
        "hint": "Сначала восстанови порядок точек от O.",
        "explanation": "Порядок O–P–Q, поэтому PQ = 15 − 9 = 6 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            15,
            9
          ]
        },
        "id": "practical-roads-schema-practice-01",
        "nodeId": "schema-relations"
      },
      {
        "prompt": "На прямом шоссе точки A, B, C, D идут в этом порядке. AD = 34 км, AB = 9 км, CD = 8 км. Найди BC.",
        "input": "number",
        "answer": "17",
        "hint": "Из целого пути исключи две известные крайние части.",
        "explanation": "BC = 34 − 9 − 8 = 17 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              34,
              9
            ],
            8
          ]
        },
        "id": "practical-roads-schema-practice-02",
        "nodeId": "schema-segments"
      },
      {
        "prompt": "Из пункта O дороги идут под прямым углом: OA = 7 км, OB = 24 км. Найди длину прямой дороги AB.",
        "input": "number",
        "answer": "25",
        "hint": "Сначала найди квадрат расстояния между дальними концами катетов.",
        "explanation": "AB² = 7² + 24² = 625; AB = 25 км.",
        "oracle": {
          "kind": "square-root",
          "radicand": 625
        },
        "id": "practical-roads-schema-practice-03",
        "nodeId": "schema-right-triangle"
      },
      {
        "prompt": "Маршрут включает 18 км шоссе со скоростью 60 км/ч и 8 км грунтовой дороги со скоростью 20 км/ч. Сколько минут длится поездка?",
        "input": "number",
        "answer": "42",
        "hint": "Времена участков складываются после отдельного деления пути на скорость.",
        "explanation": "18/60 + 8/20 = 0,7 ч = 42 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              [
                "div",
                18,
                60
              ],
              [
                "div",
                8,
                20
              ]
            ],
            60
          ]
        },
        "id": "practical-roads-schema-practice-04",
        "nodeId": "schema-piecewise-time"
      },
      {
        "prompt": "На шоссе расход равен 7 л на 100 км, на грунтовой дороге — 9 л на 100 км. Проехали 80 км по шоссе и 20 км по грунтовой дороге. Сколько литров израсходовано?",
        "input": "number",
        "answer": "7.4",
        "hint": "Для каждой нормы возьми только длину соответствующего покрытия.",
        "explanation": "По шоссе 5,6 л, по грунтовой дороге 1,8 л; всего 7,4 л.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "mul",
                80,
                7
              ],
              100
            ],
            [
              "div",
              [
                "mul",
                20,
                9
              ],
              100
            ]
          ]
        },
        "id": "practical-roads-schema-practice-05",
        "nodeId": "schema-fuel"
      },
      {
        "prompt": "Какой из двух маршрутов требует меньше топлива? Выбери маршрут и расход.",
        "input": "choice",
        "answer": "А: 2 л",
        "choices": [
          "Оба: 2,2 л",
          "А: 2 л",
          "Б: 2,4 л"
        ],
        "hint": "Не сравнивай только длины: нормы расхода различаются.",
        "explanation": "А: 40 · 5 / 100 = 2 л; Б: 30 · 8 / 100 = 2,4 л.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "div",
              [
                "mul",
                40,
                5
              ],
              100
            ],
            [
              "div",
              [
                "mul",
                30,
                8
              ],
              100
            ]
          ],
          "values": [
            "2.2",
            2,
            "2.4"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Маршрут",
            "Длина, км",
            "Литров на 100 км"
          ],
          "rows": [
            [
              "А",
              40,
              5
            ],
            [
              "Б",
              30,
              8
            ]
          ]
        },
        "id": "practical-roads-schema-practice-06",
        "nodeId": "schema-route-check"
      },
      {
        "prompt": "Пункты P и Q лежат на одной прямой по разные стороны от O. OP = 12 км, OQ = 5 км. Какова длина дороги PQ?",
        "input": "number",
        "answer": "17",
        "hint": "Проверь, находится ли O между концами искомой дороги.",
        "explanation": "O лежит между P и Q: PQ = 12 + 5 = 17 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            12,
            5
          ]
        },
        "id": "practical-roads-schema-check-a-01",
        "nodeId": "schema-relations"
      },
      {
        "prompt": "От A до B по шоссе 21 км, от B до C по следующему участку 14 км. Маршрут задан как A–B–C. Какое выражение найдёт длину всего маршрута?",
        "input": "choice",
        "answer": "21 + 14",
        "choices": [
          "21 · 14",
          "21 − 14",
          "21 + 14"
        ],
        "hint": "Маршрут состоит из двух последовательно пройденных частей.",
        "explanation": "Длина A–B–C равна 21 + 14 = 35 км.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            21,
            14
          ],
          "values": [
            [
              "mul",
              21,
              14
            ],
            [
              "sub",
              21,
              14
            ],
            [
              "add",
              21,
              14
            ]
          ]
        },
        "id": "practical-roads-schema-check-a-02",
        "nodeId": "schema-segments"
      },
      {
        "prompt": "Треугольник дорог прямоугольный. Прямая дорога между дальними пунктами — гипотенуза длиной 26 км. Один катет равен 10 км. Найди второй катет.",
        "input": "number",
        "answer": "24",
        "hint": "Квадрат неизвестного катета — разность квадрата гипотенузы и известного катета.",
        "explanation": "26² − 10² = 576; второй катет равен 24 км.",
        "oracle": {
          "kind": "square-root",
          "radicand": 576
        },
        "id": "practical-roads-schema-check-a-03",
        "nodeId": "schema-right-triangle"
      },
      {
        "prompt": "Поездка заняла 66 минут. Первые 30 км проехали по шоссе со скоростью 60 км/ч, затем 12 км по грунтовой дороге. Найди скорость на грунтовой дороге в км/ч.",
        "input": "number",
        "answer": "20",
        "hint": "Сначала исключи время шоссе из общего времени.",
        "explanation": "На шоссе ушло 30 мин, осталось 36 мин = 0,6 ч. Скорость 12 : 0,6 = 20 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            [
              "div",
              [
                "sub",
                66,
                [
                  "mul",
                  [
                    "div",
                    30,
                    60
                  ],
                  60
                ]
              ],
              60
            ]
          ]
        },
        "id": "practical-roads-schema-check-a-04",
        "nodeId": "schema-piecewise-time"
      },
      {
        "prompt": "Проехали 90 км по шоссе с расходом 6 л на 100 км и 40 км по грунтовой дороге. Всего потратили 9 л. Найди расход на грунтовой дороге в литрах на 100 км.",
        "input": "number",
        "answer": "9",
        "hint": "Вычти топливо шоссе. Оставшийся расход относится к 40 км, а нужен расход на 100 км.",
        "explanation": "Шоссе: 5,4 л; грунтовая дорога: 3,6 л. Норма 3,6 : 40 · 100 = 9 л/100 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                9,
                [
                  "div",
                  [
                    "mul",
                    90,
                    6
                  ],
                  100
                ]
              ],
              40
            ],
            100
          ]
        },
        "id": "practical-roads-schema-check-a-05",
        "nodeId": "schema-fuel"
      },
      {
        "prompt": "Маршрут А: 50 км с расходом 8 л/100 км. Маршрут Б: 60 км с расходом 6 л/100 км. Бензин стоит 60 руб./л. На сколько рублей поездка по Б дешевле?",
        "input": "number",
        "answer": "24",
        "hint": "Сравни сначала литры, затем переведи разницу в рубли.",
        "explanation": "А требует 4 л, Б — 3,6 л. Экономия 0,4 · 60 = 24 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "sub",
              [
                "div",
                [
                  "mul",
                  50,
                  8
                ],
                100
              ],
              [
                "div",
                [
                  "mul",
                  60,
                  6
                ],
                100
              ]
            ],
            60
          ]
        },
        "id": "practical-roads-schema-check-a-06",
        "nodeId": "schema-route-check"
      },
      {
        "prompt": "В условии сказано: на прямой дороге пункт C расположен между A и B. AB = 31 км, AC = 13 км. Какое расстояние отделяет C от B?",
        "input": "number",
        "answer": "18",
        "hint": "Используй указанное словами положение C, независимо от размеров рисунка.",
        "explanation": "AB = AC + CB; CB = 31 − 13 = 18 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            31,
            13
          ]
        },
        "id": "practical-roads-schema-check-b-01",
        "nodeId": "schema-relations"
      },
      {
        "prompt": "Маршрут состоит из двух участков; второй вдвое длиннее первого. Общая длина 45 км. Найди длину первого участка.",
        "input": "number",
        "answer": "15",
        "hint": "Представь длины как одну и две одинаковые части.",
        "explanation": "Весь путь — три части, поэтому первый участок 45 : 3 = 15 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            45,
            [
              "add",
              1,
              2
            ]
          ]
        },
        "id": "practical-roads-schema-check-b-02",
        "nodeId": "schema-segments"
      },
      {
        "prompt": "Две дороги выходят из одной точки под прямым углом. Их дальние концы соединены прямой дорогой длиной 29 км. Один из перпендикулярных участков имеет длину 20 км. Найди длину другого в километрах.",
        "input": "number",
        "answer": "21",
        "hint": "Прямая дорога соединяет дальние концы и является гипотенузой.",
        "explanation": "29² − 20² = 441; неизвестный катет равен 21 км.",
        "oracle": {
          "kind": "square-root",
          "radicand": 441
        },
        "id": "practical-roads-schema-check-b-03",
        "nodeId": "schema-right-triangle"
      },
      {
        "prompt": "Ехали 18 км со скоростью 45 км/ч, затем 12 км со скоростью 30 км/ч. Каково общее время в минутах?",
        "input": "number",
        "answer": "48",
        "hint": "Для двух частей найди времена в часах и только затем переведи сумму.",
        "explanation": "0,4 + 0,4 = 0,8 ч; это 48 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              [
                "div",
                18,
                45
              ],
              [
                "div",
                12,
                30
              ]
            ],
            60
          ]
        },
        "id": "practical-roads-schema-check-b-04",
        "nodeId": "schema-piecewise-time"
      },
      {
        "prompt": "В таблице дан расход для разных дорог. Сколько литров потребуется на 12 км грунтовой дороги и 28 км шоссе?",
        "input": "number",
        "answer": "2.56",
        "hint": "Не меняй местами нормы для двух покрытий.",
        "explanation": "Грунтовая дорога: 1,02 л; шоссе: 1,54 л. Всего 2,56 л.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "mul",
                12,
                "8.5"
              ],
              100
            ],
            [
              "div",
              [
                "mul",
                28,
                "5.5"
              ],
              100
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Покрытие",
            "Расход, л/100 км"
          ],
          "rows": [
            [
              "Шоссе",
              "5,5"
            ],
            [
              "Грунтовая дорога",
              "8,5"
            ]
          ]
        },
        "id": "practical-roads-schema-check-b-05",
        "nodeId": "schema-fuel"
      },
      {
        "prompt": "Половину пути, 20 км, проехали со скоростью 40 км/ч, вторую половину, 20 км, — со скоростью 60 км/ч. Найди среднюю скорость всего пути в км/ч.",
        "input": "number",
        "answer": "48",
        "hint": "Средняя скорость — весь путь, делённый на всё время.",
        "explanation": "Общий путь 40 км, время 1/2 + 1/3 = 5/6 ч. Средняя скорость 40 : (5/6) = 48 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              20,
              20
            ],
            [
              "add",
              [
                "div",
                20,
                40
              ],
              [
                "div",
                20,
                60
              ]
            ]
          ]
        },
        "id": "practical-roads-schema-check-b-06",
        "nodeId": "schema-route-check"
      }
    ]
  },
  {
    "id": "practical-tires",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Шины",
    "goal": "Прочитать маркировку, найти размеры колеса и проверить смысл изменения.",
    "transferGoal": "По новой маркировке собери величины B, p, d, H, D; сравнение всегда начинай с вопроса о диаметре, радиусе или процентах.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
      "title": "Шины",
      "trainerId": "practiceTiresTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-tires.html",
      "selector": "#step-stepper [data-step]",
      "types": [
        {
          "id": "0",
          "title": "Маркировка",
          "kind": "preparation"
        },
        {
          "id": "1",
          "title": "Таблица расчётов",
          "kind": "preparation"
        },
        {
          "id": "2",
          "title": "Задача 1 · Совместимость",
          "kind": "exam"
        },
        {
          "id": "3",
          "title": "Задача 2 · Высота профиля",
          "kind": "exam"
        },
        {
          "id": "4",
          "title": "Задача 3 · Диаметр",
          "kind": "exam"
        },
        {
          "id": "5",
          "title": "Задача 4 · Изменение размера",
          "kind": "exam"
        },
        {
          "id": "6",
          "title": "Задача 5 · Оборот и проценты",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "tire-marking",
        "title": "Расшифровать маркировку",
        "goal": "Различить ширину в миллиметрах, процент профиля и диаметр диска в дюймах.",
        "dependsOn": [],
        "foundations": [
          "percent-meaning",
          "geometry-units"
        ],
        "resources": [
          {
            "title": "Маркировка и устройство колеса",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
            "instruction": "Выбери «Маркировка». Разбери одну запись B/p Rd и найди на модели диск, боковину и наружный край.",
            "finish": "Три числа записаны с разными величинами и единицами."
          }
        ],
        "explain": {
          "prompt": "Что означает каждое число в маркировке и почему нельзя сложить их сразу?",
          "criteria": [
            "Назови B в миллиметрах, p в процентах от B, d в дюймах.",
            "Отличи диаметр диска от диаметра всего колеса.",
            "Укажи, какой перевод единиц потребуется."
          ]
        },
        "misconception": "Считать процент высотой в миллиметрах или путать диск с колесом.",
        "covers": [
          "0"
        ],
        "finish": "Все три числа имеют смысл и единицы."
      },
      {
        "id": "tire-compatibility",
        "title": "Прочитать таблицу совместимости",
        "goal": "Выбирать разрешённые сочетания до сравнения ширин.",
        "dependsOn": [
          "tire-marking"
        ],
        "foundations": [
          "data-tables",
          "natural-compare"
        ],
        "resources": [
          {
            "title": "Таблица совместимости · задача 1",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
            "instruction": "Открой «Задача 1». Найди столбец нужного диска, исключи пустые ячейки и реши один вопрос о минимальной или максимальной ширине.",
            "finish": "Ответ выбран только среди разрешённых сочетаний."
          }
        ],
        "explain": {
          "prompt": "Почему самая широкая шина во всей таблице может не подходить к выбранному диску?",
          "criteria": [
            "Сначала укажи столбец нужного диаметра.",
            "Отбери непустые допустимые строки.",
            "Только после отбора сравни ширины."
          ]
        },
        "misconception": "Искать минимум или максимум до проверки совместимости.",
        "covers": [
          "2"
        ],
        "finish": "Выбор проверен по строке и столбцу."
      },
      {
        "id": "tire-profile",
        "title": "Найти высоту одной боковины",
        "goal": "Превратить процент ширины в длину профиля.",
        "dependsOn": [
          "tire-marking"
        ],
        "foundations": [
          "percent-part-whole-rate",
          "decimal-multiply"
        ],
        "resources": [
          {
            "title": "Высота профиля · задача 2",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
            "instruction": "В «Таблице варианта» вычисли H для двух шин, затем реши «Задача 2» выбранного варианта.",
            "finish": "Две высоты получены как B · p / 100."
          },
          {
            "title": "Проценты через таблицу",
            "href": "/trainers/oge-1-5-trainers/percent-table-trainer.html",
            "instruction": "Выбери «Разобраться с нуля» и пройди первые три учебных экрана. Для своей задачи подпиши, что принято за 100%.",
            "finish": "В таблице различены целое, часть и процент."
          }
        ],
        "explain": {
          "prompt": "От какой величины берётся процент профиля?",
          "criteria": [
            "Выдели ширину шины как 100%.",
            "Умножь ширину на долю p/100.",
            "Проверь, что высота одной боковины меньше ширины при p<100."
          ]
        },
        "misconception": "Брать процент от диаметра диска или забывать деление на 100.",
        "covers": [
          "1",
          "3"
        ],
        "finish": "Высота относится к одной боковине."
      },
      {
        "id": "tire-diameter",
        "title": "Собрать наружный диаметр",
        "goal": "Сложить диаметр диска в миллиметрах и две высоты боковины.",
        "dependsOn": [
          "tire-profile"
        ],
        "foundations": [
          "geometry-units",
          "expression-substitution"
        ],
        "resources": [
          {
            "title": "Диаметр · задача 3",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
            "instruction": "Заполни d в миллиметрах, H и D в таблице одного варианта. Затем реши «Задача 3».",
            "finish": "Проверено равенство D = 25,4d + 2H."
          }
        ],
        "explain": {
          "prompt": "Почему в формуле наружного диаметра высота профиля встречается дважды?",
          "criteria": [
            "Покажи боковину по обе стороны диска.",
            "Переведи дюймы диска в миллиметры.",
            "Сравни наружный диаметр с диаметром диска."
          ]
        },
        "misconception": "Прибавлять одну боковину или складывать дюймы с миллиметрами.",
        "covers": [
          "1",
          "4"
        ],
        "finish": "Диаметр объяснён по устройству колеса."
      },
      {
        "id": "tire-change",
        "title": "Диаметр, радиус и база процента",
        "goal": "Различить абсолютную разницу, половину разницы и процент изменения.",
        "dependsOn": [
          "tire-diameter"
        ],
        "foundations": [
          "word-comparison",
          "percent-change"
        ],
        "resources": [
          {
            "title": "Изменение размера · задача 4",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
            "instruction": "Открой «Задача 4». Перед вычислением выпиши, спрашивают ли диаметр или радиус, увеличение или уменьшение.",
            "finish": "Один ответ проверен по направлению изменения и названию величины."
          }
        ],
        "explain": {
          "prompt": "Как связаны изменение диаметра и изменение радиуса?",
          "criteria": [
            "Сравни новые и старые диаметры в одинаковых единицах.",
            "Для радиуса возьми половину разницы диаметров.",
            "При процентах укажи исходный размер как 100%."
          ]
        },
        "misconception": "Ответить разностью диаметров на вопрос о радиусе; делить на новый размер при росте от старого.",
        "covers": [
          "5"
        ],
        "finish": "Выбраны нужная разница и исходное целое."
      },
      {
        "id": "tire-roll",
        "title": "Связать размер и путь за оборот",
        "goal": "Использовать отношение диаметров для сравнения длины окружности и пути.",
        "dependsOn": [
          "tire-diameter",
          "tire-change"
        ],
        "foundations": [
          "proportion-direct",
          "proportion-inverse",
          "percent-change"
        ],
        "resources": [
          {
            "title": "Обороты и проценты · задача 5",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tires.html",
            "instruction": "Реши «Задача 5» в одном новом варианте. Объясни, что остаётся одинаковым: число оборотов или пройденный путь.",
            "finish": "Сравнение подкреплено отношением диаметров."
          }
        ],
        "explain": {
          "prompt": "Почему при одном и том же числе оборотов большее колесо проходит больший путь?",
          "criteria": [
            "Запиши длину окружности πD.",
            "Сократи общий множитель π в отношении.",
            "Различи постоянное число оборотов и постоянное расстояние."
          ]
        },
        "misconception": "Считать, что увеличение диаметра увеличивает число оборотов на том же пути.",
        "covers": [
          "6"
        ],
        "finish": "Ответ согласуется с выбранной постоянной величиной."
      }
    ],
    "questions": [
      {
        "prompt": "Маркировка шины — 195/65 R15. Число после R задаёт диаметр диска в дюймах. Если 1 дюйм = 25,4 мм, чему равен диаметр диска в миллиметрах?",
        "input": "number",
        "answer": "381",
        "hint": "Возьми число после R и переведи только его в миллиметры.",
        "explanation": "Диаметр диска: 15 · 25,4 = 381 мм; ширина и процент в этом расчёте не участвуют.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            15,
            "25.4"
          ]
        },
        "id": "practical-tires-practice-01",
        "nodeId": "tire-marking"
      },
      {
        "prompt": "Тире в таблице означает, что сочетание запрещено. Какова минимальная разрешённая ширина шины для диска R16?",
        "input": "choice",
        "answer": "205 мм",
        "choices": [
          "205 мм",
          "215 мм",
          "195 мм"
        ],
        "hint": "Сначала отбери непустые ячейки столбца R16, затем сравни ширины.",
        "explanation": "Для R16 разрешены ширины 205 и 215 мм. Меньшая — 205 мм.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            205,
            215
          ],
          "values": [
            205,
            215,
            195
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Ширина, мм",
            "R15",
            "R16"
          ],
          "rows": [
            [
              195,
              "195/65",
              "—"
            ],
            [
              205,
              "205/60",
              "205/55"
            ],
            [
              215,
              "—",
              "215/50"
            ]
          ]
        },
        "id": "practical-tires-practice-02",
        "nodeId": "tire-compatibility"
      },
      {
        "prompt": "Ширина шины 200 мм, высота профиля составляет 55% ширины. Найди высоту одной боковины в миллиметрах.",
        "input": "number",
        "answer": "110",
        "hint": "За 100% принимается ширина, а не диаметр диска.",
        "explanation": "200 · 55 / 100 = 110 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              200,
              55
            ],
            100
          ]
        },
        "id": "practical-tires-practice-03",
        "nodeId": "tire-profile"
      },
      {
        "prompt": "Диаметр диска — 16 дюймов, высота одной боковины — 100 мм. При 1 дюйм = 25,4 мм найди наружный диаметр колеса в миллиметрах.",
        "input": "number",
        "answer": "606.4",
        "hint": "После перевода диска прибавь боковину с двух сторон.",
        "explanation": "16 · 25,4 + 2 · 100 = 606,4 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              16,
              "25.4"
            ],
            [
              "mul",
              2,
              100
            ]
          ]
        },
        "id": "practical-tires-practice-04",
        "nodeId": "tire-diameter"
      },
      {
        "prompt": "После замены наружный диаметр вырос с 640 до 660 мм. На сколько миллиметров увеличился радиус колеса?",
        "input": "number",
        "answer": "10",
        "hint": "Изменение радиуса составляет половину изменения диаметра.",
        "explanation": "Диаметр вырос на 20 мм; радиус — на 10 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              660,
              640
            ],
            2
          ]
        },
        "id": "practical-tires-practice-05",
        "nodeId": "tire-change"
      },
      {
        "prompt": "За один оборот колесо проходит 2000 мм. Сколько полных оборотов оно сделает на пути 100 м без проскальзывания?",
        "input": "number",
        "answer": "50",
        "hint": "Сначала запиши весь путь в тех же единицах, что и путь за оборот.",
        "explanation": "100 м = 100000 мм; 100000 : 2000 = 50 оборотов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              100,
              1000
            ],
            2000
          ]
        },
        "id": "practical-tires-practice-06",
        "nodeId": "tire-roll"
      },
      {
        "prompt": "В маркировке 215/65 R16 число 65 задаёт процент ширины. Какой десятичной дробью надо умножить ширину, чтобы получить высоту профиля?",
        "input": "number",
        "answer": "0.65",
        "hint": "Процент означает количество сотых долей целого.",
        "explanation": "65% = 65/100 = 0,65.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            65,
            100
          ]
        },
        "id": "practical-tires-check-a-01",
        "nodeId": "tire-marking"
      },
      {
        "prompt": "По таблице найди наибольшую ширину шины, разрешённую для диска R17. Ответ дай в миллиметрах.",
        "input": "number",
        "answer": "235",
        "hint": "Пустая ячейка не разрешает сочетание. Сравни только подходящие строки.",
        "explanation": "В столбце R17 есть варианты шириной 215 и 235 мм; максимум 235 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            215,
            235
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Ширина, мм",
            "R16",
            "R17"
          ],
          "rows": [
            [
              205,
              "205/55",
              "—"
            ],
            [
              215,
              "215/55",
              "215/50"
            ],
            [
              225,
              "225/50",
              "—"
            ],
            [
              235,
              "—",
              "235/45"
            ]
          ]
        },
        "id": "practical-tires-check-a-02",
        "nodeId": "tire-compatibility"
      },
      {
        "prompt": "Высота профиля равна 129 мм, ширина шины — 215 мм. Сколько процентов ширины составляет профиль?",
        "input": "number",
        "answer": "60",
        "hint": "Здесь известны часть и целое, а требуется процент.",
        "explanation": "129 : 215 · 100 = 60%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              129,
              215
            ],
            100
          ]
        },
        "id": "practical-tires-check-a-03",
        "nodeId": "tire-profile"
      },
      {
        "prompt": "Для шины 225/60 R17 найди наружный диаметр в миллиметрах. Высота профиля — 60% ширины, 1 дюйм = 25,4 мм.",
        "input": "number",
        "answer": "701.8",
        "hint": "Вычисли одну боковину, переведи диск, затем собери весь диаметр.",
        "explanation": "H = 135 мм; диск 431,8 мм; D = 431,8 + 270 = 701,8 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              17,
              "25.4"
            ],
            [
              "mul",
              2,
              [
                "div",
                [
                  "mul",
                  225,
                  60
                ],
                100
              ]
            ]
          ]
        },
        "id": "practical-tires-check-a-04",
        "nodeId": "tire-diameter"
      },
      {
        "prompt": "Наружный диаметр изменили с 600 до 630 мм. На сколько процентов новый диаметр больше исходного?",
        "input": "number",
        "answer": "5",
        "hint": "В знаменателе должно стоять исходное значение.",
        "explanation": "Прибавка 30 мм; 30 : 600 · 100 = 5%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                630,
                600
              ],
              600
            ],
            100
          ]
        },
        "id": "practical-tires-check-a-05",
        "nodeId": "tire-change"
      },
      {
        "prompt": "Колёса диаметром 600 мм за некоторое число оборотов проходят 12 км. Сколько километров пройдут колёса диаметром 660 мм за такое же число оборотов без проскальзывания?",
        "input": "number",
        "answer": "13.2",
        "hint": "При одинаковом числе оборотов путь меняется в отношении диаметров.",
        "explanation": "Отношение 660/600 = 1,1. Новый путь: 12 · 1,1 = 13,2 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            [
              "div",
              660,
              600
            ]
          ]
        },
        "id": "practical-tires-check-a-06",
        "nodeId": "tire-roll"
      },
      {
        "prompt": "Маркировка — 225/50 R18. Ширина указана в миллиметрах. Чему равна ширина этой шины в сантиметрах?",
        "input": "number",
        "answer": "22.5",
        "hint": "Используй первое число маркировки и соотношение миллиметров с сантиметрами.",
        "explanation": "225 мм = 22,5 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            225,
            10
          ]
        },
        "id": "practical-tires-check-b-01",
        "nodeId": "tire-marking"
      },
      {
        "prompt": "В каждой ячейке перечислены разрешённые маркировки для указанного диска. Сколько разных вариантов всего разрешено для R18?",
        "input": "number",
        "answer": "5",
        "hint": "Считай отдельные маркировки в нужном столбце, а не только непустые строки.",
        "explanation": "Для R18 указаны 2 + 1 + 2 = 5 вариантов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            1,
            2
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Ширина, мм",
            "R17",
            "R18"
          ],
          "rows": [
            [
              205,
              "205/50",
              "—"
            ],
            [
              215,
              "215/50",
              "215/45; 215/50"
            ],
            [
              225,
              "225/45",
              "225/40"
            ],
            [
              235,
              "235/45",
              "235/35; 235/40"
            ]
          ]
        },
        "id": "practical-tires-check-b-02",
        "nodeId": "tire-compatibility"
      },
      {
        "prompt": "У шины шириной 170 мм профиль составляет 65% ширины. Найди высоту одной боковины в миллиметрах.",
        "input": "number",
        "answer": "110.5",
        "hint": "Сначала запиши процент как долю ширины.",
        "explanation": "170 · 0,65 = 110,5 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              170,
              65
            ],
            100
          ]
        },
        "id": "practical-tires-check-b-03",
        "nodeId": "tire-profile"
      },
      {
        "prompt": "Наружный диаметр колеса 650 мм, высота каждой боковины 121,8 мм. Найди диаметр диска в дюймах, если 1 дюйм = 25,4 мм.",
        "input": "number",
        "answer": "16",
        "hint": "Убери две боковины из наружного диаметра, затем переведи оставшееся.",
        "explanation": "Диаметр диска: 650 − 243,6 = 406,4 мм; 406,4 : 25,4 = 16 дюймов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              650,
              [
                "mul",
                2,
                "121.8"
              ]
            ],
            "25.4"
          ]
        },
        "id": "practical-tires-check-b-04",
        "nodeId": "tire-diameter"
      },
      {
        "prompt": "Радиус колеса уменьшился на 7 мм. Прежний наружный диаметр был 704 мм. Найди новый наружный диаметр в миллиметрах.",
        "input": "number",
        "answer": "690",
        "hint": "Уменьшение диаметра вдвое больше уменьшения радиуса.",
        "explanation": "Диаметр уменьшился на 14 мм: 704 − 14 = 690 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            704,
            [
              "mul",
              2,
              7
            ]
          ]
        },
        "id": "practical-tires-check-b-05",
        "nodeId": "tire-change"
      },
      {
        "prompt": "На одном и том же пути колесо диаметром 600 мм сделало 100 оборотов. Сколько оборотов сделает колесо диаметром 750 мм без проскальзывания?",
        "input": "number",
        "answer": "80",
        "hint": "На фиксированном пути большему колесу нужно меньше оборотов.",
        "explanation": "Число оборотов обратно пропорционально диаметру: 100 · 600 / 750 = 80.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            100,
            [
              "div",
              600,
              750
            ]
          ]
        },
        "id": "practical-tires-check-b-06",
        "nodeId": "tire-roll"
      }
    ]
  },
  {
    "id": "practical-stoves",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Печи и парная",
    "goal": "Выбрать подходящую печь, рассчитать помещение, стоимость и геометрию арки.",
    "transferGoal": "В новой таблице сначала проверь ограничения по объёму, затем полную стоимость; арку объясни отдельным геометрическим построением.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
      "title": "Печи и парная",
      "trainerId": "practiceStovesTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-stoves.html",
      "selector": "#group-tabs [data-g], #chip-row [data-t]",
      "types": [
        {
          "id": "match:0",
          "title": "Сопоставление · масса",
          "kind": "exam"
        },
        {
          "id": "match:1",
          "title": "Сопоставление · цена",
          "kind": "exam"
        },
        {
          "id": "match:2",
          "title": "Сопоставление · наибольший объём",
          "kind": "exam"
        },
        {
          "id": "geom:0",
          "title": "Геометрия · объём",
          "kind": "exam"
        },
        {
          "id": "geom:1",
          "title": "Геометрия · пол",
          "kind": "exam"
        },
        {
          "id": "geom:2",
          "title": "Геометрия · стены",
          "kind": "exam"
        },
        {
          "id": "money:0",
          "title": "Деньги · дешевле",
          "kind": "exam"
        },
        {
          "id": "money:1",
          "title": "Деньги · доставка дровяной",
          "kind": "exam"
        },
        {
          "id": "money:2",
          "title": "Деньги · электрическая полностью",
          "kind": "exam"
        },
        {
          "id": "money:3",
          "title": "Деньги · скидка",
          "kind": "exam"
        },
        {
          "id": "money:4",
          "title": "Деньги · прошлый год",
          "kind": "exam"
        },
        {
          "id": "money:5",
          "title": "Деньги · скидка и доставка",
          "kind": "exam"
        },
        {
          "id": "arc:0",
          "title": "Арка · центр в основании",
          "kind": "exam"
        },
        {
          "id": "arc:1",
          "title": "Арка · через стрелку",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "stove-table",
        "title": "Различить данные таблицы",
        "goal": "Читать массу, цену и допустимый объём в своих столбцах.",
        "dependsOn": [],
        "foundations": [
          "data-tables",
          "geometry-mass-capacity"
        ],
        "resources": [
          {
            "title": "Сопоставление",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
            "instruction": "В группе «Сопоставление» реши по одному примеру «масса», «цена» и «наиб. объём».",
            "finish": "Три величины прочитаны без смешения единиц."
          }
        ],
        "explain": {
          "prompt": "По какому признаку ты отличаешь цену от массы и предельного объёма?",
          "criteria": [
            "Назови заголовок и единицу столбца.",
            "Найди строку конкретной печи.",
            "Проверь, что ответ принадлежит нужной величине."
          ]
        },
        "misconception": "Выбирать знакомое число из соседнего столбца.",
        "covers": [
          "match:0",
          "match:1",
          "match:2"
        ],
        "finish": "Три таблицы сопоставлены по смыслу."
      },
      {
        "id": "stove-room",
        "title": "Объём, пол и стены",
        "goal": "Отделить кубические единицы от квадратных и исключить дверной проём.",
        "dependsOn": [
          "stove-table"
        ],
        "foundations": [
          "geometry-area",
          "geometry-volume",
          "geometry-square-units"
        ],
        "resources": [
          {
            "title": "Геометрия парной",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
            "instruction": "В группе «Геометрия парной» реши по одному примеру «объём», «пол», «стены». Для стен отдельно подпиши площадь двери.",
            "finish": "Три разных вопроса дали три подходящие модели."
          }
        ],
        "explain": {
          "prompt": "Почему при поиске площади стен длина, ширина и высота не просто перемножаются?",
          "criteria": [
            "Для объёма используй три измерения.",
            "Для стен умножь периметр пола на высоту.",
            "Вычти только те проёмы, которые исключены условием."
          ]
        },
        "misconception": "Подменять площадь объёмом или вычитать дверь из площади пола.",
        "covers": [
          "geom:0",
          "geom:1",
          "geom:2"
        ],
        "finish": "Формула и единицы отвечают конкретному вопросу."
      },
      {
        "id": "stove-choice-cost",
        "title": "Отобрать подходящее и сравнить цену",
        "goal": "Учесть рабочий диапазон и полную сумму покупки, доставки, установки.",
        "dependsOn": [
          "stove-room"
        ],
        "foundations": [
          "word-change",
          "inequality-number-line"
        ],
        "resources": [
          {
            "title": "Деньги: полная стоимость",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
            "instruction": "Реши по одному примеру «дешевле», «доставка (дров.)», «эл. полностью». В каждом запиши все слагаемые цены.",
            "finish": "Три итога учитывают только указанные расходы."
          }
        ],
        "explain": {
          "prompt": "Почему самая дешёвая строка таблицы ещё не означает лучший выбор для парной?",
          "criteria": [
            "Проверь, попадает ли объём парной в допустимый диапазон.",
            "Сравни полные суммы только подходящих вариантов.",
            "Укажи, включены ли доставка и установка."
          ]
        },
        "misconception": "Брать самый низкий ценник без проверки объёма или дополнительных затрат.",
        "covers": [
          "match:2",
          "money:0",
          "money:1",
          "money:2"
        ],
        "finish": "Выбранная печь подходит и сравнивается по полной цене."
      },
      {
        "id": "stove-percent",
        "title": "Скидка и прежняя цена",
        "goal": "Определить своё целое при скидке, повышении и обратном вопросе.",
        "dependsOn": [
          "stove-choice-cost"
        ],
        "foundations": [
          "percent-change",
          "percent-part-whole-rate"
        ],
        "resources": [
          {
            "title": "Деньги: проценты",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
            "instruction": "В группе «Деньги» реши «скидка», «прошлый год» и «скидка + доставка». Отдельно отметь расходы без скидки.",
            "finish": "Три задачи решены с явно указанной базой процента."
          },
          {
            "title": "Проценты через таблицу",
            "href": "/trainers/oge-1-5-trainers/percent-table-trainer.html",
            "instruction": "Выбери «Разобраться с нуля» и пройди первые три учебных экрана. Для своей задачи подпиши, что принято за 100%.",
            "finish": "В таблице различены целое, часть и процент."
          }
        ],
        "explain": {
          "prompt": "На какую сумму действует скидка, если доставка оплачивается отдельно?",
          "criteria": [
            "Выпиши цену до изменения.",
            "Примени процент только к названной в условии сумме.",
            "При обратном вопросе дели на оставшуюся долю, затем проверяй прямым действием."
          ]
        },
        "misconception": "Вычитать процент от доставки без такого условия; считать старую цену обратным вычитанием.",
        "covers": [
          "money:3",
          "money:4",
          "money:5"
        ],
        "finish": "Процент относится к правильному целому."
      },
      {
        "id": "stove-arch-base",
        "title": "Радиус через половину ширины",
        "goal": "Построить прямоугольный треугольник от центра в середине основания.",
        "dependsOn": [
          "stove-room"
        ],
        "foundations": [
          "geometry-midpoint",
          "expression-powers-roots"
        ],
        "resources": [
          {
            "title": "Арка: центр в основании",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
            "instruction": "В группе «Арка кожуха» выбери «центр в основании». Реши один пример и подпиши катеты на своём эскизе.",
            "finish": "Радиус найден из половины ширины и высоты стенки."
          }
        ],
        "explain": {
          "prompt": "Почему катет равен половине ширины кожуха?",
          "criteria": [
            "Отметь центр в середине основания.",
            "Проведи радиус к верхнему углу.",
            "Используй прямой угол между вертикальной стенкой и основанием."
          ]
        },
        "misconception": "Брать полную ширину вместо половины или складывать катеты.",
        "covers": [
          "arc:0"
        ],
        "finish": "Построение объясняет формулу Пифагора."
      },
      {
        "id": "stove-arch-height",
        "title": "Радиус через хорду и стрелку",
        "goal": "Связать высоту сегмента с расстоянием R−h от центра до хорды.",
        "dependsOn": [
          "stove-arch-base"
        ],
        "foundations": [
          "expression-identities",
          "equation-linear"
        ],
        "resources": [
          {
            "title": "Арка: через стрелку",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-stoves.html",
            "instruction": "Выбери «через стрелку». Реши один пример: сначала запиши R² = (R−h)² + (w/2)², затем упрости и проверь радиус.",
            "finish": "Один радиус найден из уравнения; округление сделано в конце."
          }
        ],
        "explain": {
          "prompt": "Чем стрелка арки отличается от радиуса?",
          "criteria": [
            "Отметь хорду, её середину, вершину дуги и центр.",
            "Покажи отрезок R−h и половину хорды.",
            "После раскрытия скобок сократи R² и проверь найденный радиус."
          ]
        },
        "misconception": "Принимать высоту арки за радиус; округлять промежуточные квадраты.",
        "covers": [
          "arc:1"
        ],
        "finish": "Уравнение выведено из геометрии, а не выбрано по виду рисунка."
      }
    ],
    "questions": [
      {
        "prompt": "По таблице найди, на сколько килограммов печь А тяжелее печи Б.",
        "input": "number",
        "answer": "15",
        "hint": "Используй столбец массы, а не цены или объёма.",
        "explanation": "45 − 30 = 15 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            45,
            30
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Печь",
            "Масса, кг",
            "Цена, руб.",
            "Макс. объём, м³"
          ],
          "rows": [
            [
              "А",
              45,
              19500,
              19
            ],
            [
              "Б",
              30,
              20000,
              24
            ],
            [
              "В",
              36,
              18000,
              16
            ]
          ]
        },
        "id": "practical-stoves-practice-01",
        "nodeId": "stove-table"
      },
      {
        "prompt": "Парная имеет форму прямоугольного параллелепипеда: длина 3 м, ширина 2 м, высота 2,5 м. Найди объём в м³.",
        "input": "number",
        "answer": "15",
        "hint": "Объём учитывает число слоёв над площадью пола.",
        "explanation": "3 · 2 · 2,5 = 15 м³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            2,
            "2.5"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Длина, м",
            "Ширина, м",
            "Высота, м"
          ],
          "rows": [
            [
              3,
              2,
              "2,5"
            ]
          ]
        },
        "id": "practical-stoves-practice-02",
        "nodeId": "stove-room"
      },
      {
        "prompt": "Объём парной 18 м³. Границы допустимого диапазона включены. Выбери подходящую печь с меньшей полной стоимостью.",
        "input": "choice",
        "answer": "Б: 17000 руб.",
        "choices": [
          "Б: 17000 руб.",
          "В: 18000 руб.",
          "А: 12000 руб."
        ],
        "hint": "Сначала исключи неподходящий диапазон объёма. Потом добавь доставку.",
        "explanation": "А не рассчитана на 18 м³. Б стоит 17000 руб. с доставкой, В — 18000 руб.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "add",
              16000,
              1000
            ],
            [
              "add",
              15000,
              3000
            ]
          ],
          "values": [
            [
              "add",
              16000,
              1000
            ],
            [
              "add",
              15000,
              3000
            ],
            12000
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Печь",
            "Диапазон, м³",
            "Цена, руб.",
            "Доставка, руб."
          ],
          "rows": [
            [
              "А",
              "8–16",
              12000,
              0
            ],
            [
              "Б",
              "10–20",
              16000,
              1000
            ],
            [
              "В",
              "15–24",
              15000,
              3000
            ]
          ]
        },
        "id": "practical-stoves-practice-03",
        "nodeId": "stove-choice-cost"
      },
      {
        "prompt": "Печь стоит 24000 рублей. На саму печь действует скидка 10%, доставка без скидки стоит 1500 рублей. Сколько всего нужно заплатить?",
        "input": "number",
        "answer": "23100",
        "hint": "Скидка относится только к цене печи.",
        "explanation": "Печь после скидки стоит 21600 руб.; с доставкой 23100 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              24000,
              "0.9"
            ],
            1500
          ]
        },
        "id": "practical-stoves-practice-04",
        "nodeId": "stove-percent"
      },
      {
        "prompt": "Центр круглой арки находится в середине основания кожуха. Ширина кожуха 10 см, высота вертикальной стенки 12 см. Радиус проведён к верхнему углу стенки. Найди его длину в сантиметрах.",
        "input": "number",
        "answer": "13",
        "hint": "Катеты — половина ширины и высота стенки.",
        "explanation": "Половина ширины 5 см; R² = 5² + 12² = 169, значит R = 13 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": 169
        },
        "id": "practical-stoves-practice-05",
        "nodeId": "stove-arch-base"
      },
      {
        "prompt": "Хорда круглой арки имеет длину 12 см, стрелка арки — 2 см. Центр окружности расположен ниже хорды. Из R² = (R−2)² + 6² найди радиус R в сантиметрах.",
        "input": "number",
        "answer": "10",
        "hint": "Раскрой квадрат скобки и сократи одинаковые R².",
        "explanation": "R² = R² − 4R + 4 + 36; 4R = 40; R = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              [
                "pow",
                6,
                2
              ],
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
            ]
          ]
        },
        "id": "practical-stoves-practice-06",
        "nodeId": "stove-arch-height"
      },
      {
        "prompt": "В таблице масса печи указана в килограммах. Сколько граммов весит печь Б?",
        "input": "number",
        "answer": "38000",
        "hint": "Выбери нужную строку и переведи только массу.",
        "explanation": "Печь Б весит 38 кг = 38000 г.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            38,
            1000
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Печь",
            "Масса, кг",
            "Цена, руб."
          ],
          "rows": [
            [
              "А",
              42,
              21000
            ],
            [
              "Б",
              38,
              22500
            ],
            [
              "В",
              51,
              19800
            ]
          ]
        },
        "id": "practical-stoves-check-a-01",
        "nodeId": "stove-table"
      },
      {
        "prompt": "Пол прямоугольной парной имеет длину 3,2 м и ширину 2,5 м. Сколько квадратных метров покрытия нужно без запаса?",
        "input": "number",
        "answer": "8",
        "hint": "Здесь спрашивают площадь пола; высота помещения не нужна.",
        "explanation": "3,2 · 2,5 = 8 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "3.2",
            "2.5"
          ]
        },
        "id": "practical-stoves-check-a-02",
        "nodeId": "stove-room"
      },
      {
        "prompt": "Электрическая печь стоит 18000 рублей, проводка — 1200 рублей, установка — 2500 рублей. Дровяная печь с доставкой стоит 17500 рублей. На сколько дороже полный электрический вариант?",
        "input": "number",
        "answer": "4200",
        "hint": "Собери все расходы электрического варианта до сравнения.",
        "explanation": "18000 + 1200 + 2500 = 21700 руб.; 21700 − 17500 = 4200 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              18000,
              1200,
              2500
            ],
            17500
          ]
        },
        "id": "practical-stoves-check-a-03",
        "nodeId": "stove-choice-cost"
      },
      {
        "prompt": "После повышения цены на 20% печь стоит 26400 рублей. Сколько она стоила до повышения?",
        "input": "number",
        "answer": "22000",
        "hint": "Новая цена составляет больше одной полной исходной цены.",
        "explanation": "26400 : 1,2 = 22000 руб. Проверка: 22000 · 1,2 = 26400.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            26400,
            "1.2"
          ]
        },
        "id": "practical-stoves-check-a-04",
        "nodeId": "stove-percent"
      },
      {
        "prompt": "Центр арки — середина основания. Радиус до верхнего угла стенки равен 17 см, высота вертикальной стенки 15 см. Найди половину ширины кожуха в сантиметрах.",
        "input": "number",
        "answer": "8",
        "hint": "Радиус — гипотенуза, высота стенки — один катет.",
        "explanation": "Половина ширины равна √(17² − 15²) = √64 = 8 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": 64
        },
        "id": "practical-stoves-check-a-05",
        "nodeId": "stove-arch-base"
      },
      {
        "prompt": "У круглой арки длина хорды 20 см, стрелка 4 см; центр ниже хорды. По формуле R = ((w/2)² + h²)/(2h) найди радиус в сантиметрах.",
        "input": "number",
        "answer": "14.5",
        "hint": "В квадрат возводится половина хорды, а знаменатель равен двум стрелкам.",
        "explanation": "R = (10² + 4²) / 8 = 116/8 = 14,5 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              [
                "pow",
                [
                  "div",
                  20,
                  2
                ],
                2
              ],
              [
                "pow",
                4,
                2
              ]
            ],
            [
              "mul",
              2,
              4
            ]
          ]
        },
        "id": "practical-stoves-check-a-06",
        "nodeId": "stove-arch-height"
      },
      {
        "prompt": "При перевозке к массе печи В добавляется упаковка массой 1,5 кг. Найди общую массу в килограммах.",
        "input": "number",
        "answer": "37.5",
        "hint": "Найди массу печи В, затем прибавь упаковку.",
        "explanation": "36 + 1,5 = 37,5 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            36,
            "1.5"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Печь",
            "Масса, кг",
            "Макс. объём, м³"
          ],
          "rows": [
            [
              "А",
              29,
              14
            ],
            [
              "Б",
              40,
              22
            ],
            [
              "В",
              36,
              18
            ]
          ]
        },
        "id": "practical-stoves-check-b-01",
        "nodeId": "stove-table"
      },
      {
        "prompt": "Парная: длина 3 м, ширина 2 м, высота 2,4 м. Окон нет; дверь 0,8 м на 2 м не обшивают. Найди площадь всех четырёх стен без двери в м².",
        "input": "number",
        "answer": "22.4",
        "hint": "Площадь стен — периметр пола, умноженный на высоту. Пол и потолок не входят.",
        "explanation": "2 · (3 + 2) · 2,4 − 0,8 · 2 = 24 − 1,6 = 22,4 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              2,
              [
                "add",
                3,
                2
              ],
              "2.4"
            ],
            [
              "mul",
              "0.8",
              2
            ]
          ]
        },
        "id": "practical-stoves-check-b-02",
        "nodeId": "stove-room"
      },
      {
        "prompt": "Объём парной 24 м³; крайние значения диапазона допускаются. По таблице выбери подходящую печь и укажи её цену вместе с доставкой в рублях.",
        "input": "number",
        "answer": "20000",
        "hint": "Проверь обе границы каждого диапазона, включая равенство.",
        "explanation": "Только Б подходит: 14 ≤ 24 ≤ 24. Полная цена 19500 + 500 = 20000 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            19500,
            500
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Печь",
            "Диапазон, м³",
            "Цена, руб.",
            "Доставка, руб."
          ],
          "rows": [
            [
              "А",
              "8–20",
              17000,
              1000
            ],
            [
              "Б",
              "14–24",
              19500,
              500
            ],
            [
              "В",
              "25–30",
              18000,
              0
            ]
          ]
        },
        "id": "practical-stoves-check-b-03",
        "nodeId": "stove-choice-cost"
      },
      {
        "prompt": "За печь после скидки 20% и доставку заплатили 17000 рублей. Доставка стоила 1000 рублей, скидка на неё не действовала. Какова цена печи до скидки?",
        "input": "number",
        "answer": "20000",
        "hint": "Сначала убери доставку, потом восстанови целую цену по оставшейся доле.",
        "explanation": "Печь со скидкой стоила 16000 руб.; 16000 : 0,8 = 20000 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              17000,
              1000
            ],
            "0.8"
          ]
        },
        "id": "practical-stoves-check-b-04",
        "nodeId": "stove-percent"
      },
      {
        "prompt": "Центр окружности расположен в середине основания кожуха шириной 18 см. Высота его вертикальной стенки 40 см. Найди радиус до верхнего угла стенки в сантиметрах.",
        "input": "number",
        "answer": "41",
        "hint": "Используй половину ширины как горизонтальный катет.",
        "explanation": "R² = 9² + 40² = 1681; R = 41 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": 1681
        },
        "id": "practical-stoves-check-b-05",
        "nodeId": "stove-arch-base"
      },
      {
        "prompt": "Круглая арка имеет хорду 28 см и стрелку 7 см; её центр расположен ниже хорды. Найди радиус окружности в сантиметрах.",
        "input": "number",
        "answer": "17.5",
        "hint": "Соедини центр с концом хорды. Катеты полученного прямоугольного треугольника — половина хорды и R−h.",
        "explanation": "R² = (R−7)² + 14². После раскрытия скобок: 14R = 245; R = 17,5 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              [
                "pow",
                14,
                2
              ],
              [
                "pow",
                7,
                2
              ]
            ],
            [
              "mul",
              2,
              7
            ]
          ]
        },
        "id": "practical-stoves-check-b-06",
        "nodeId": "stove-arch-height"
      }
    ]
  },
  {
    "id": "practical-land-plots",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Участок и хозяйственные постройки",
    "goal": "Прочитать план участка и связать масштаб, площади, материалы и расходы.",
    "transferGoal": "На другом плане выдели нужную область, проверь единицы и только затем считай площадь, долю или стоимость.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
      "title": "Участок и хозяйственные постройки",
      "trainerId": "practiceLandPlotsTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
      "selector": "#task-tabs .ttab",
      "types": [
        {
          "id": "match",
          "title": "Сопоставление",
          "kind": "exam"
        },
        {
          "id": "geom",
          "title": "Геометрия",
          "kind": "exam"
        },
        {
          "id": "tiles",
          "title": "Плитка",
          "kind": "exam"
        },
        {
          "id": "percent",
          "title": "Проценты",
          "kind": "exam"
        },
        {
          "id": "econ",
          "title": "Экономика",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "land-locate",
        "title": "Найти объект по описанию",
        "goal": "Проверять расположение построек по нескольким признакам.",
        "dependsOn": [],
        "foundations": [
          "data-tables",
          "geometry-segments"
        ],
        "resources": [
          {
            "title": "Сопоставление объектов",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
            "instruction": "В одном варианте выбери «Сопоставление». Назови два признака каждого объекта перед вводом ответа.",
            "finish": "Один набор объектов сопоставлен с номерами."
          },
          {
            "title": "Как читать план",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-plan-reading.html",
            "instruction": "В «Обучении» выполни первые три задания; для каждого сначала назови вопрос и нужные данные.",
            "finish": "Три условия разобраны до вычислений."
          }
        ],
        "explain": {
          "prompt": "Как проверить название постройки, если соседние объекты похожи по размеру?",
          "criteria": [
            "Используй отношения «слева», «между», «около входа» из условия.",
            "Проверь найденный номер по второму признаку.",
            "Сохрани порядок объектов, указанный в вопросе."
          ]
        },
        "misconception": "Узнавать дом только по размеру рисунка или менять порядок цифр ответа.",
        "covers": [
          "match"
        ],
        "finish": "Каждый номер объясняется условием."
      },
      {
        "id": "land-length",
        "title": "Длина и масштаб участка",
        "goal": "Перевести клеточные размеры, найти периметр или недостающий участок.",
        "dependsOn": [
          "land-locate"
        ],
        "foundations": [
          "ratio-scale",
          "geometry-perimeter",
          "geometry-segments"
        ],
        "resources": [
          {
            "title": "Геометрия: длины",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
            "instruction": "Открой «Геометрия». До ответа на один текущий вопрос подпиши длины нужных участков: число клеток и масштаб. Выполни расчёт и вернись к своему маршруту.",
            "finish": "Для одного условия записаны реальные длины нужных участков."
          }
        ],
        "explain": {
          "prompt": "Почему масштаб 2 м на клетку не означает 2 м² на клетку?",
          "criteria": [
            "Назови длину стороны клетки.",
            "Для пути считай линейные промежутки.",
            "Для площади отдельно вычисли площадь одной клетки."
          ]
        },
        "misconception": "Использовать один и тот же масштаб для длины и площади.",
        "covers": [
          "geom"
        ],
        "finish": "Линейный расчёт отделён от площади."
      },
      {
        "id": "land-area",
        "title": "Площадь области",
        "goal": "Разбить участок на прямоугольники и использовать квадрат масштаба.",
        "dependsOn": [
          "land-length"
        ],
        "foundations": [
          "geometry-area",
          "geometry-square-units"
        ],
        "resources": [
          {
            "title": "Геометрия: площадь",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
            "instruction": "На плане выбери одну прямоугольную постройку. Вычисли её площадь в тетради двумя способами: число клеток × площадь клетки и произведение реальных сторон.",
            "finish": "Одна площадь совпала при двух способах; проверка выполнена в тетради."
          }
        ],
        "explain": {
          "prompt": "Как посчитать площадь составной постройки, если её контур не прямоугольный?",
          "criteria": [
            "Разбей область на части без перекрытия.",
            "Проверь, что каждая клетка учтена один раз.",
            "Умножь число клеток на квадрат стороны клетки."
          ]
        },
        "misconception": "Умножать площадь в клетках на линейный масштаб или считать пустой вырез.",
        "covers": [
          "geom"
        ],
        "finish": "Площадь получена с учётом формы и единиц."
      },
      {
        "id": "land-packs",
        "title": "Плитка целыми упаковками",
        "goal": "Найти площадь покрытия, запас по условию и минимальное число пачек.",
        "dependsOn": [
          "land-area"
        ],
        "foundations": [
          "word-afford",
          "division-remainder",
          "rounding"
        ],
        "resources": [
          {
            "title": "Плитка и упаковки",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
            "instruction": "Выбери «Плитка» и реши один пример. После деления проверь, хватило бы на одну упаковку меньше.",
            "finish": "Найдена минимальная целая покупка, которой достаточно."
          }
        ],
        "explain": {
          "prompt": "Почему 6,2 упаковки нельзя округлить до 6, если требуется покрыть всю площадь?",
          "criteria": [
            "Определи полезную площадь одной пачки.",
            "Проверь покрытие для соседних целых чисел.",
            "Применяй запас только когда он задан."
          ]
        },
        "misconception": "Округлять покупку к ближайшему целому или покупать долю пачки.",
        "covers": [
          "tiles"
        ],
        "finish": "Проверены достаточность и минимальность."
      },
      {
        "id": "land-percent",
        "title": "Доля участка",
        "goal": "Выбрать всё и часть перед вычислением процента.",
        "dependsOn": [
          "land-area"
        ],
        "foundations": [
          "percent-part-whole-rate",
          "percent-read-question"
        ],
        "resources": [
          {
            "title": "Проценты площадей",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
            "instruction": "Выполни одну задачу «Проценты». Нарисуй две подписанные области: что сравнивают и что принято за 100%.",
            "finish": "Процент связан с правильной площадью целого."
          },
          {
            "title": "Проценты: часть и целое",
            "href": "/trainers/oge-1-5-trainers/percent-table-trainer.html",
            "instruction": "Открой «Потренироваться», выбери базовый уровень и выполни три задачи. В каждой запиши, что принято за 100%.",
            "finish": "Три задачи разобраны с правильным целым."
          }
        ],
        "explain": {
          "prompt": "От какой площади нужно брать процент, если спрашивают долю огорода во всём участке?",
          "criteria": [
            "Подпиши площадь части и площадь целого.",
            "Приведи их к одинаковым квадратным единицам.",
            "Раздели часть на целое и умножь на 100."
          ]
        },
        "misconception": "Делить целое на часть или брать за 100% сумму только удобных объектов.",
        "covers": [
          "percent"
        ],
        "finish": "Выбранное целое соответствует формулировке."
      },
      {
        "id": "land-economy",
        "title": "Расходы и окупаемость",
        "goal": "Выбрать модель стоимости материала или экономии за час.",
        "dependsOn": [
          "land-packs",
          "land-percent"
        ],
        "foundations": [
          "word-change",
          "proportion-direct",
          "equation-linear"
        ],
        "resources": [
          {
            "title": "Экономика участка",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html",
            "instruction": "Выбери «Экономика». Реши один вопрос; для закупки составь сумму покупки и доставки, для окупаемости — дополнительная цена : экономия за час.",
            "finish": "Одна модель объяснена единицами и проверена обратным действием."
          }
        ],
        "explain": {
          "prompt": "Почему срок окупаемости измеряется временем, а не рублями?",
          "criteria": [
            "Найди дополнительную начальную стоимость.",
            "Вычисли экономию за единицу времени.",
            "Раздели стоимость на экономию и проверь произведением."
          ]
        },
        "misconception": "Делить на полные расходы вместо экономии или сравнивать цены без доставки.",
        "covers": [
          "econ"
        ],
        "finish": "Модель выбрана по вопросу, а итог проверен."
      }
    ],
    "questions": [
      {
        "prompt": "Вход находится на отметке 0 м. Все три постройки стоят справа вдоль одной прямой. По условию гараж — ближайшая к входу постройка. Какой это объект?",
        "input": "choice",
        "answer": "Объект 3",
        "choices": [
          "Объект 1",
          "Объект 3",
          "Объект 2"
        ],
        "hint": "Сравни расстояния от одного и того же входа.",
        "explanation": "Ближайшая отметка — 2 м, на ней стоит объект 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            5,
            8,
            2
          ],
          "values": [
            5,
            2,
            8
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Объект",
            "Отметка, м"
          ],
          "rows": [
            [
              1,
              5
            ],
            [
              2,
              8
            ],
            [
              3,
              2
            ]
          ]
        },
        "id": "practical-land-plots-practice-01",
        "nodeId": "land-locate"
      },
      {
        "prompt": "Прямоугольный участок занимает 7 клеток в длину и 5 в ширину. Сторона клетки соответствует 2 м. Найди периметр участка в метрах.",
        "input": "number",
        "answer": "48",
        "hint": "Переведи обе стороны в метры и обойди все четыре стороны.",
        "explanation": "Стороны 14 и 10 м; периметр 2 · (14 + 10) = 48 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              [
                "mul",
                7,
                2
              ],
              [
                "mul",
                5,
                2
              ]
            ]
          ]
        },
        "id": "practical-land-plots-practice-02",
        "nodeId": "land-length"
      },
      {
        "prompt": "Постройка занимает 9 квадратных клеток. Сторона каждой клетки соответствует 2 м. Какова площадь постройки в м²?",
        "input": "number",
        "answer": "36",
        "hint": "Сначала вычисли площадь одной клетки.",
        "explanation": "Одна клетка: 2 · 2 = 4 м²; вся постройка: 9 · 4 = 36 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            9,
            [
              "pow",
              2,
              2
            ]
          ]
        },
        "id": "practical-land-plots-practice-03",
        "nodeId": "land-area"
      },
      {
        "prompt": "Нужно покрыть плиткой 17 м². В одной целой упаковке плитки на 2,4 м²; запас не требуется. Какое минимальное число упаковок надо купить?",
        "input": "number",
        "answer": "8",
        "hint": "Проверь площадь, покрываемую двумя соседними целыми количествами.",
        "explanation": "7 упаковок дают 16,8 м² — мало; 8 дают 19,2 м² — достаточно.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "ceil",
            [
              "div",
              17,
              "2.4"
            ]
          ]
        },
        "id": "practical-land-plots-practice-04",
        "nodeId": "land-packs"
      },
      {
        "prompt": "Площадь всего участка 400 м², огород занимает 60 м². Сколько процентов участка занимает огород?",
        "input": "number",
        "answer": "15",
        "hint": "Назови целое, с которым сравнивают огород.",
        "explanation": "60 : 400 · 100 = 15%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              60,
              400
            ],
            100
          ]
        },
        "id": "practical-land-plots-practice-05",
        "nodeId": "land-percent"
      },
      {
        "prompt": "Экономичный обогреватель дороже обычного на 1800 рублей, но экономит 4,5 рубля за каждый час работы. Через сколько часов экономия сравняется с переплатой?",
        "input": "number",
        "answer": "400",
        "hint": "Сколько одинаковых часовых экономий нужно для возврата всей переплаты?",
        "explanation": "1800 : 4,5 = 400 часов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1800,
            "4.5"
          ]
        },
        "id": "practical-land-plots-practice-06",
        "nodeId": "land-economy"
      },
      {
        "prompt": "По описанию баня занимает 12 клеток. По таблице прямоугольных построек найди номер бани.",
        "input": "choice",
        "answer": "Объект 3",
        "choices": [
          "Объект 1",
          "Объект 3",
          "Объект 2"
        ],
        "hint": "Площадь прямоугольника в клетках — произведение двух его размеров.",
        "explanation": "Площади: 16, 10 и 12 клеток. Баня — объект 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 12,
          "values": [
            [
              "mul",
              4,
              4
            ],
            [
              "mul",
              3,
              4
            ],
            [
              "mul",
              2,
              5
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Объект",
            "Длина, клеток",
            "Ширина, клеток"
          ],
          "rows": [
            [
              1,
              4,
              4
            ],
            [
              2,
              2,
              5
            ],
            [
              3,
              3,
              4
            ]
          ]
        },
        "id": "practical-land-plots-check-a-01",
        "nodeId": "land-locate"
      },
      {
        "prompt": "Прямоугольный участок на плане имеет стороны 6 и 4 клетки. Его реальный периметр 60 м. Сколько метров соответствует стороне одной клетки?",
        "input": "number",
        "answer": "3",
        "hint": "Сначала найди периметр в клеточных промежутках.",
        "explanation": "На плане периметр 20 промежутков; 60 : 20 = 3 м на клетку.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            60,
            [
              "mul",
              2,
              [
                "add",
                6,
                4
              ]
            ]
          ]
        },
        "id": "practical-land-plots-check-a-02",
        "nodeId": "land-length"
      },
      {
        "prompt": "Площадь постройки получают из прямоугольника 12 × 8 м, убрав прямоугольный вырез 4 × 3 м. Найди площадь оставшейся части в м².",
        "input": "number",
        "answer": "84",
        "hint": "Вырез не относится к постройке.",
        "explanation": "12 · 8 − 4 · 3 = 96 − 12 = 84 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              12,
              8
            ],
            [
              "mul",
              4,
              3
            ]
          ]
        },
        "id": "practical-land-plots-check-a-03",
        "nodeId": "land-area"
      },
      {
        "prompt": "Площадь дорожки 6 м². Квадратная плитка имеет сторону 20 см, в упаковке 8 плиток. Какое минимальное число целых упаковок нужно без запаса?",
        "input": "number",
        "answer": "19",
        "hint": "Переведи сторону плитки в метры, найди площадь одной упаковки.",
        "explanation": "Одна плитка 0,04 м²; пачка 0,32 м². 18 пачек дают 5,76 м², поэтому нужно 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "ceil",
            [
              "div",
              6,
              [
                "mul",
                8,
                [
                  "pow",
                  [
                    "div",
                    20,
                    100
                  ],
                  2
                ]
              ]
            ]
          ]
        },
        "id": "practical-land-plots-check-a-04",
        "nodeId": "land-packs"
      },
      {
        "prompt": "Огород занимает 40% участка, его площадь 72 м². Найди площадь всего участка в м².",
        "input": "number",
        "answer": "180",
        "hint": "Известны часть и её доля; требуется целое.",
        "explanation": "72 : 0,4 = 180 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            72,
            "0.4"
          ]
        },
        "id": "practical-land-plots-check-a-05",
        "nodeId": "land-percent"
      },
      {
        "prompt": "Для покраски нужно 18 л краски. Банка вмещает 5 л и стоит 940 рублей, доставка всей покупки — 120 рублей. Сколько заплатят за минимально достаточное число банок?",
        "input": "number",
        "answer": "3880",
        "hint": "Банки продают целиком, доставку считают за всю покупку.",
        "explanation": "Нужны 4 банки; 4 · 940 + 120 = 3880 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              [
                "ceil",
                [
                  "div",
                  18,
                  5
                ]
              ],
              940
            ],
            120
          ]
        },
        "id": "practical-land-plots-check-a-06",
        "nodeId": "land-economy"
      },
      {
        "prompt": "Вдоль прямой границы вход стоит на отметке 3 м, калитка — на 7 м. По условию сарай находится строго между ними. Какой из отмеченных объектов — сарай?",
        "input": "choice",
        "answer": "Объект 2",
        "choices": [
          "Объект 1",
          "Объект 3",
          "Объект 2"
        ],
        "hint": "Смотри на положение относительно обеих границ промежутка.",
        "explanation": "Только отметка 5 лежит между 3 и 7; это объект 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            7,
            3
          ],
          "values": [
            [
              "add",
              [
                "abs",
                [
                  "sub",
                  2,
                  3
                ]
              ],
              [
                "abs",
                [
                  "sub",
                  7,
                  2
                ]
              ]
            ],
            [
              "add",
              [
                "abs",
                [
                  "sub",
                  8,
                  3
                ]
              ],
              [
                "abs",
                [
                  "sub",
                  7,
                  8
                ]
              ]
            ],
            [
              "add",
              [
                "abs",
                [
                  "sub",
                  5,
                  3
                ]
              ],
              [
                "abs",
                [
                  "sub",
                  7,
                  5
                ]
              ]
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 10,
          "step": 1,
          "points": [
            {
              "value": 2,
              "label": "№1"
            },
            {
              "value": 3,
              "label": "Вход"
            },
            {
              "value": 5,
              "label": "№2"
            },
            {
              "value": 7,
              "label": "Калитка"
            },
            {
              "value": 8,
              "label": "№3"
            }
          ]
        },
        "id": "practical-land-plots-check-b-01",
        "nodeId": "land-locate"
      },
      {
        "prompt": "Периметр участка 46 м. Проём ворот шириной 4 м оставляют без забора. Сколько метров забора нужно на остальную границу?",
        "input": "number",
        "answer": "42",
        "hint": "Проём — часть общей границы, которая не закрывается забором.",
        "explanation": "46 − 4 = 42 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            46,
            4
          ]
        },
        "id": "practical-land-plots-check-b-02",
        "nodeId": "land-length"
      },
      {
        "prompt": "На плане теплица — прямоугольник 6 × 5 клеток. Сторона клетки соответствует 0,5 м. Найди площадь теплицы в м².",
        "input": "number",
        "answer": "7.5",
        "hint": "Квадрат линейного масштаба переводит клеточную площадь в квадратные метры.",
        "explanation": "30 клеток по 0,25 м² дают 7,5 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            5,
            [
              "pow",
              "0.5",
              2
            ]
          ]
        },
        "id": "practical-land-plots-check-b-03",
        "nodeId": "land-area"
      },
      {
        "prompt": "Для дорожки площадью 37 м² покупают плитку упаковками по 3 м². Упаковка стоит 420 рублей. Сколько стоит минимально достаточное число упаковок без запаса?",
        "input": "number",
        "answer": "5460",
        "hint": "Округли число упаковок до достаточного целого, затем вычисли стоимость.",
        "explanation": "12 пачек дают только 36 м². Нужны 13: 13 · 420 = 5460 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "ceil",
              [
                "div",
                37,
                3
              ]
            ],
            420
          ]
        },
        "id": "practical-land-plots-check-b-04",
        "nodeId": "land-packs"
      },
      {
        "prompt": "Весь участок занимает 600 м², огород — 80 м², теплица — 20 м². Сколько процентов от площади огорода составляет площадь теплицы?",
        "input": "number",
        "answer": "25",
        "hint": "В вопросе целым названа площадь огорода; площадь всего участка здесь лишняя.",
        "explanation": "20 : 80 · 100 = 25%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              20,
              80
            ],
            100
          ]
        },
        "id": "practical-land-plots-check-b-05",
        "nodeId": "land-percent"
      },
      {
        "prompt": "Обычный обогреватель потребляет 1,2 кВт, экономичный — 0,8 кВт. Оба работают 300 часов. Электроэнергия стоит 5 руб./кВт·ч. На сколько рублей меньше потратит экономичный?",
        "input": "number",
        "answer": "600",
        "hint": "Экономия мощности сначала превращается в экономию энергии.",
        "explanation": "Разница 0,4 кВт; за 300 ч экономится 120 кВт·ч, то есть 600 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "sub",
              "1.2",
              "0.8"
            ],
            300,
            5
          ]
        },
        "id": "practical-land-plots-check-b-06",
        "nodeId": "land-economy"
      }
    ]
  },
  {
    "id": "practical-apartments",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "План квартиры",
    "goal": "Прочитать помещения на плане и рассчитать площади, ремонт и бытовые расходы.",
    "transferGoal": "Изменение расположения комнат не мешает: опирайся на связи помещений, масштаб и отдельный критерий каждого вопроса.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
      "title": "План квартиры",
      "trainerId": "practiceApartmentsTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-apartments.html",
      "selector": "#tabs .tab[data-g], .pill[data-view]",
      "types": [
        {
          "id": "1",
          "title": "№1 · Соответствие",
          "kind": "exam"
        },
        {
          "id": "2.1",
          "title": "№2.1 · Паркет в гостиной",
          "kind": "exam"
        },
        {
          "id": "2.2",
          "title": "№2.2 · Плитка лоджий",
          "kind": "exam"
        },
        {
          "id": "3.1",
          "title": "№3.1 · Площадь коридора",
          "kind": "exam"
        },
        {
          "id": "3.2",
          "title": "№3.2 · Площадь лоджии",
          "kind": "exam"
        },
        {
          "id": "3.x",
          "title": "№3 · Площадь помещения",
          "kind": "exam"
        },
        {
          "id": "4.1",
          "title": "№4.1 · Лоджия / кладовая",
          "kind": "exam"
        },
        {
          "id": "4.2",
          "title": "№4.2 · Кухня / санузел",
          "kind": "exam"
        },
        {
          "id": "4.x",
          "title": "№4 · Проценты",
          "kind": "exam"
        },
        {
          "id": "5.1",
          "title": "№5.1 · Стиральная машина",
          "kind": "exam"
        },
        {
          "id": "5.2",
          "title": "№5.2 · Интернет",
          "kind": "exam"
        },
        {
          "id": "5.3",
          "title": "№5.3 · Электроплита",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "apartment-plan",
        "title": "Связать комнаты и описание",
        "goal": "Определить помещение по входам, соседству и назначению.",
        "dependsOn": [],
        "foundations": [
          "data-tables",
          "geometry-segments"
        ],
        "resources": [
          {
            "title": "№1 · Соответствие",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
            "instruction": "Открой «№1». Сопоставь помещения, проверяя двери, соседство и выходы на лоджии.",
            "finish": "Один набор номеров комнат обоснован признаками."
          },
          {
            "title": "Как читать план",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-plan-reading.html",
            "instruction": "В «Обучении» выполни первые три задания; для каждого сначала назови вопрос и нужные данные.",
            "finish": "Три условия разобраны до вычислений."
          }
        ],
        "explain": {
          "prompt": "Как найти кухню без запоминания её цвета или положения на экране?",
          "criteria": [
            "Назови признаки из текста.",
            "Проследи связь с коридором и соседними помещениями.",
            "Проверь все названия в требуемом порядке."
          ]
        },
        "misconception": "Узнавать помещение по цвету заливки, а не по описанию.",
        "covers": [
          "1"
        ],
        "finish": "У каждого номера есть основание в условии."
      },
      {
        "id": "apartment-area",
        "title": "Измерить площадь комнаты",
        "goal": "Считать целые и составные области по масштабу.",
        "dependsOn": [
          "apartment-plan"
        ],
        "foundations": [
          "geometry-area",
          "geometry-square-units"
        ],
        "resources": [
          {
            "title": "№3 · Площадь",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
            "instruction": "В группе «№3» реши «площадь коридора», «площадь лоджии» и один случайный вопрос о помещении.",
            "finish": "Три площади получены с правильной площадью клетки."
          }
        ],
        "explain": {
          "prompt": "Как проверить площадь коридора с углом или вырезом?",
          "criteria": [
            "Раздели фигуру на неперекрывающиеся прямоугольники либо вычти вырез из большого.",
            "Переведи клеточные размеры в реальные.",
            "Сравни результат двух способов, если оба доступны."
          ]
        },
        "misconception": "Включать в площадь комнаты соседние клетки или забывать квадрат масштаба.",
        "covers": [
          "3.1",
          "3.2",
          "3.x"
        ],
        "finish": "Площадь связана с реальными границами помещения."
      },
      {
        "id": "apartment-material",
        "title": "Купить покрытие пола",
        "goal": "Применить площадь и округление к паркету, плитке и упаковкам.",
        "dependsOn": [
          "apartment-area"
        ],
        "foundations": [
          "word-afford",
          "division-remainder"
        ],
        "resources": [
          {
            "title": "№2 · Материалы",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
            "instruction": "Реши «паркет · гостиная» и «плитка · лоджии». Для каждого ответа проверь, хватило бы одной упаковки меньше.",
            "finish": "Две покупки достаточны и минимальны по условию."
          }
        ],
        "explain": {
          "prompt": "Когда можно сложить площади двух лоджий перед подсчётом плитки?",
          "criteria": [
            "Проверь, что покрытие и норма расхода одинаковы.",
            "Применяй указанный запас к нужной площади.",
            "Округляй число неделимых упаковок вверх."
          ]
        },
        "misconception": "Округлять площадь заранее или забывать вторую лоджию.",
        "covers": [
          "2.1",
          "2.2"
        ],
        "finish": "Количество материалов проверено площадью покрытия."
      },
      {
        "id": "apartment-percent",
        "title": "Сравнить площади в процентах",
        "goal": "Различить долю, превышение и уменьшение относительно выбранного помещения.",
        "dependsOn": [
          "apartment-area"
        ],
        "foundations": [
          "percent-read-question",
          "percent-change"
        ],
        "resources": [
          {
            "title": "№4 · Проценты",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
            "instruction": "Реши «лоджия / кладовая», «кухня / санузел» и один случайный пример. Подпиши знаменатель каждого отношения.",
            "finish": "Три процента вычислены от названной в вопросе базы."
          }
        ],
        "explain": {
          "prompt": "Одинаков ли процент, на который кухня больше санузла, и процент, на который санузел меньше кухни?",
          "criteria": [
            "Найди одну и ту же разницу площадей.",
            "Назови своё целое в каждом вопросе.",
            "Объясни разные знаменатели и проверь направление сравнения."
          ]
        },
        "misconception": "Использовать один процент в обоих направлениях сравнения.",
        "covers": [
          "4.1",
          "4.2",
          "4.x"
        ],
        "finish": "Процент согласован с точной формулировкой."
      },
      {
        "id": "apartment-fit",
        "title": "Выбрать подходящий прибор",
        "goal": "Сначала проверить размеры, затем сравнить допустимые цены.",
        "dependsOn": [
          "apartment-plan"
        ],
        "foundations": [
          "geometry-units",
          "data-tables"
        ],
        "resources": [
          {
            "title": "№5.1 · Стиральная машина",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
            "instruction": "Выбери «стиральная машина». Выпиши ограничения размеров, исключи неподходящие модели и сравни оставшиеся цены.",
            "finish": "Выбран прибор, удовлетворяющий всем ограничениям."
          }
        ],
        "explain": {
          "prompt": "Почему самая дешёвая модель может быть исключена до сравнения цен?",
          "criteria": [
            "Приведи размеры места и прибора к одинаковым единицам.",
            "Проверь каждое ограничение, включая равенство на границе.",
            "Сравни цены только допустимых моделей."
          ]
        },
        "misconception": "Игнорировать одно измерение или путать миллиметры и сантиметры.",
        "covers": [
          "5.1"
        ],
        "finish": "Выбор проходит все заданные ограничения."
      },
      {
        "id": "apartment-running-cost",
        "title": "Сравнить полные расходы",
        "goal": "Сложить подключение и платежи за одинаковый срок либо расход энергии и цену.",
        "dependsOn": [
          "apartment-fit"
        ],
        "foundations": [
          "proportion-direct",
          "decimal-multiply",
          "word-change"
        ],
        "resources": [
          {
            "title": "№5 · Интернет и электроплита",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-apartments.html",
            "instruction": "Реши по одному примеру «интернет» и «электроплита». Для тарифа укажи срок, для энергии — кВт·ч и руб./кВт·ч.",
            "finish": "Два расчёта сравнивают полные расходы в одних единицах."
          }
        ],
        "explain": {
          "prompt": "Почему меньшая абонплата не всегда означает меньшие расходы за первый год?",
          "criteria": [
            "Учти разовую плату за подключение.",
            "Умножь регулярный платёж на число месяцев.",
            "Сравни одинаковые сроки и проверь единицы итоговой стоимости."
          ]
        },
        "misconception": "Сравнивать только месячную плату или путать мощность с энергией.",
        "covers": [
          "5.2",
          "5.3"
        ],
        "finish": "Сравнение учитывает все расходы за заданный срок."
      }
    ],
    "questions": [
      {
        "prompt": "По описанию кладовая — самое маленькое из помещений без окна. По таблице найди её номер.",
        "input": "choice",
        "answer": "Комната 3",
        "choices": [
          "Комната 1",
          "Комната 3",
          "Комната 2"
        ],
        "hint": "Сначала оставь комнаты без окна, затем сравни их площади.",
        "explanation": "Без окна комнаты 1 и 3; меньшая площадь 4 м² у комнаты 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            6,
            4
          ],
          "values": [
            6,
            4,
            12
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Комната",
            "Площадь, м²",
            "Есть окно"
          ],
          "rows": [
            [
              1,
              6,
              "нет"
            ],
            [
              2,
              12,
              "да"
            ],
            [
              3,
              4,
              "нет"
            ]
          ]
        },
        "id": "practical-apartments-practice-01",
        "nodeId": "apartment-plan"
      },
      {
        "prompt": "План коридора получен из прямоугольника 8 × 5 м, из которого убран прямоугольный вырез 3 × 2 м. Найди площадь коридора в м².",
        "input": "number",
        "answer": "34",
        "hint": "Вычти из большой площади только площадь выреза.",
        "explanation": "8 · 5 − 3 · 2 = 40 − 6 = 34 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              8,
              5
            ],
            [
              "mul",
              3,
              2
            ]
          ]
        },
        "id": "practical-apartments-practice-02",
        "nodeId": "apartment-area"
      },
      {
        "prompt": "Площадь гостиной 19 м². Одна упаковка паркета покрывает 2,2 м². Запас не требуется. Сколько целых упаковок нужно купить как минимум?",
        "input": "number",
        "answer": "9",
        "hint": "После деления проверь достаточность целого количества.",
        "explanation": "8 пачек покрывают 17,6 м² — мало. 9 пачек покрывают 19,8 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "ceil",
            [
              "div",
              19,
              "2.2"
            ]
          ]
        },
        "id": "practical-apartments-practice-03",
        "nodeId": "apartment-material"
      },
      {
        "prompt": "Площадь кухни 12 м², санузла — 8 м². На сколько процентов кухня больше санузла?",
        "input": "number",
        "answer": "50",
        "hint": "Найди разницу и раздели её на площадь помещения, с которым сравнивают.",
        "explanation": "Разница 4 м²; 4 : 8 · 100 = 50%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                12,
                8
              ],
              8
            ],
            100
          ]
        },
        "id": "practical-apartments-practice-04",
        "nodeId": "apartment-percent"
      },
      {
        "prompt": "Место для стиральной машины: ширина не более 60 см, глубина не более 45 см. Дополнительные зазоры не требуются. Выбери самую дешёвую подходящую модель.",
        "input": "choice",
        "answer": "В: 20500 руб.",
        "choices": [
          "В: 20500 руб.",
          "А: 18000 руб.",
          "Б: 21000 руб."
        ],
        "hint": "До сравнения цен проверь обе размерные границы.",
        "explanation": "А слишком глубока. Б и В подходят; В дешевле.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            21000,
            20500
          ],
          "values": [
            20500,
            18000,
            21000
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Модель",
            "Ширина, см",
            "Глубина, см",
            "Цена, руб."
          ],
          "rows": [
            [
              "А",
              59,
              46,
              18000
            ],
            [
              "Б",
              60,
              44,
              21000
            ],
            [
              "В",
              58,
              45,
              20500
            ]
          ]
        },
        "id": "practical-apartments-practice-05",
        "nodeId": "apartment-fit"
      },
      {
        "prompt": "Какой интернет-план дешевле за первые 12 месяцев? Указанная плата за подключение вносится один раз.",
        "input": "choice",
        "answer": "Б: 5880 руб.",
        "choices": [
          "А: 5900 руб.",
          "Б: 5880 руб.",
          "А: 5400 руб."
        ],
        "hint": "Сравни подключение плюс двенадцать одинаковых месячных платежей.",
        "explanation": "А: 500 + 12 · 450 = 5900 руб.; Б: 12 · 490 = 5880 руб.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "add",
              500,
              [
                "mul",
                12,
                450
              ]
            ],
            [
              "add",
              0,
              [
                "mul",
                12,
                490
              ]
            ]
          ],
          "values": [
            5900,
            5880,
            5400
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "План",
            "Подключение, руб.",
            "В месяц, руб."
          ],
          "rows": [
            [
              "А",
              500,
              450
            ],
            [
              "Б",
              0,
              490
            ]
          ]
        },
        "id": "practical-apartments-practice-06",
        "nodeId": "apartment-running-cost"
      },
      {
        "prompt": "По описанию кухня состоит из двух прямоугольных частей площадью 6 и 4 м², которые не перекрываются. По таблице выбери её номер.",
        "input": "choice",
        "answer": "Комната 2",
        "choices": [
          "Комната 3",
          "Комната 2",
          "Комната 1"
        ],
        "hint": "Сначала найди общую площадь названных частей.",
        "explanation": "Кухня имеет площадь 6 + 4 = 10 м²; это комната 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            6,
            4
          ],
          "values": [
            12,
            10,
            9
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Комната",
            "Площадь, м²"
          ],
          "rows": [
            [
              1,
              9
            ],
            [
              2,
              10
            ],
            [
              3,
              12
            ]
          ]
        },
        "id": "practical-apartments-check-a-01",
        "nodeId": "apartment-plan"
      },
      {
        "prompt": "На клетчатом плане кладовая имеет стороны 6 и 4 клетки. Сторона клетки соответствует 0,4 м. Найди площадь кладовой в м².",
        "input": "number",
        "answer": "3.84",
        "hint": "Площадь клетки определяется квадратом её стороны.",
        "explanation": "24 клетки по 0,16 м² дают 3,84 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            4,
            [
              "pow",
              "0.4",
              2
            ]
          ]
        },
        "id": "practical-apartments-check-a-02",
        "nodeId": "apartment-area"
      },
      {
        "prompt": "Две лоджии имеют площади 3,2 и 4,8 м². Для общей площади берут 10% запаса. В упаковке 10 плиток, каждая 0,4 × 0,4 м. Сколько упаковок нужно как минимум?",
        "input": "number",
        "answer": "6",
        "hint": "Сложи площади, добавь запас и сравни с площадью целой упаковки.",
        "explanation": "Нужно 8 · 1,1 = 8,8 м²; пачка даёт 1,6 м². Требуется 6 пачек.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "ceil",
            [
              "div",
              [
                "mul",
                [
                  "add",
                  "3.2",
                  "4.8"
                ],
                "1.1"
              ],
              [
                "mul",
                10,
                "0.4",
                "0.4"
              ]
            ]
          ]
        },
        "id": "practical-apartments-check-a-03",
        "nodeId": "apartment-material"
      },
      {
        "prompt": "Площадь санузла 6 м², кухни — 10 м². На сколько процентов санузел меньше кухни?",
        "input": "number",
        "answer": "40",
        "hint": "За целое берётся кухня, с которой сравнивают санузел.",
        "explanation": "(10 − 6) : 10 · 100 = 40%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                10,
                6
              ],
              10
            ],
            100
          ]
        },
        "id": "practical-apartments-check-a-04",
        "nodeId": "apartment-percent"
      },
      {
        "prompt": "Ширина ниши 0,62 м. Машине требуется по 2 см свободного места слева и справа. Какова наибольшая допустимая ширина машины в сантиметрах?",
        "input": "number",
        "answer": "58",
        "hint": "Переведи нишу в сантиметры и учти два зазора.",
        "explanation": "Ниша 62 см; для машины остаётся 62 − 4 = 58 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              "0.62",
              100
            ],
            [
              "mul",
              2,
              2
            ]
          ]
        },
        "id": "practical-apartments-check-a-05",
        "nodeId": "apartment-fit"
      },
      {
        "prompt": "Электроприбор мощностью 1,5 кВт работает по 2 часа в день в течение 30 дней. Цена энергии 6 руб./кВт·ч. Сколько рублей составит расход?",
        "input": "number",
        "answer": "540",
        "hint": "Мощность сначала умножается на всё время работы — получится энергия.",
        "explanation": "Время 60 ч; энергия 90 кВт·ч; стоимость 90 · 6 = 540 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "1.5",
            2,
            30,
            6
          ]
        },
        "id": "practical-apartments-check-a-06",
        "nodeId": "apartment-running-cost"
      },
      {
        "prompt": "Коридор прямоугольный: его ширина 2 м, а длина вдвое больше. По таблице площадей найди номер коридора.",
        "input": "choice",
        "answer": "Комната 2",
        "choices": [
          "Комната 1",
          "Комната 3",
          "Комната 2"
        ],
        "hint": "Сначала восстанови длину, затем площадь коридора.",
        "explanation": "Длина 4 м, площадь 2 · 4 = 8 м²; это комната 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "mul",
              2,
              2
            ]
          ],
          "values": [
            6,
            10,
            8
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Комната",
            "Площадь, м²"
          ],
          "rows": [
            [
              1,
              6
            ],
            [
              2,
              8
            ],
            [
              3,
              10
            ]
          ]
        },
        "id": "practical-apartments-check-b-01",
        "nodeId": "apartment-plan"
      },
      {
        "prompt": "Коридор состоит из двух прямоугольных частей 3,5 × 2 м и 2 × 1,5 м, которые не перекрываются. Найди общую площадь в м².",
        "input": "number",
        "answer": "10",
        "hint": "У неперекрывающихся частей площади складываются.",
        "explanation": "3,5 · 2 + 2 · 1,5 = 7 + 3 = 10 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              "3.5",
              2
            ],
            [
              "mul",
              2,
              "1.5"
            ]
          ]
        },
        "id": "practical-apartments-check-b-02",
        "nodeId": "apartment-area"
      },
      {
        "prompt": "Комната имеет площадь 24 м². К этой площади добавляют 5% запаса паркета. Упаковка покрывает 1,8 м² и стоит 1100 рублей. Сколько стоят нужные упаковки?",
        "input": "number",
        "answer": "15400",
        "hint": "Запас относится к площади комнаты; покупка считается целыми упаковками.",
        "explanation": "Нужно 25,2 м², это 14 пачек; 14 · 1100 = 15400 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "ceil",
              [
                "div",
                [
                  "mul",
                  24,
                  "1.05"
                ],
                "1.8"
              ]
            ],
            1100
          ]
        },
        "id": "practical-apartments-check-b-03",
        "nodeId": "apartment-material"
      },
      {
        "prompt": "Площадь лоджии 3 м², кладовой — 5 м². Сколько процентов площади кладовой составляет площадь лоджии?",
        "input": "number",
        "answer": "60",
        "hint": "Спрашивают долю лоджии в площади кладовой, а не разницу площадей.",
        "explanation": "3 : 5 · 100 = 60%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              3,
              5
            ],
            100
          ]
        },
        "id": "practical-apartments-check-b-04",
        "nodeId": "apartment-percent"
      },
      {
        "prompt": "Ниша имеет ширину 58 см, машина — 56 см. Машину поставили посередине ниши. Какова ширина свободного зазора с каждой стороны в сантиметрах?",
        "input": "number",
        "answer": "1",
        "hint": "Оставшаяся ширина делится поровну между двумя сторонами.",
        "explanation": "Свободно 2 см; по 1 см с каждой стороны.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              58,
              56
            ],
            2
          ]
        },
        "id": "practical-apartments-check-b-05",
        "nodeId": "apartment-fit"
      },
      {
        "prompt": "Новый интернет-план требует разовой платы 900 рублей и экономит по 75 рублей в месяц относительно прежнего. Через сколько месяцев экономия полностью компенсирует разовый платёж?",
        "input": "number",
        "answer": "12",
        "hint": "Сравни накопленную экономию с одной первоначальной платой.",
        "explanation": "900 : 75 = 12 месяцев.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            900,
            75
          ]
        },
        "id": "practical-apartments-check-b-06",
        "nodeId": "apartment-running-cost"
      }
    ]
  },
  {
    "id": "practical-tariffs",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Связь и тарифы",
    "goal": "Прочитать использование услуг и рассчитать оплату с лимитами, пакетами и сроком.",
    "transferGoal": "На новом тарифе сначала отдели абонплату, включённый объём и доплату; сравни одинаковый набор услуг за одинаковый срок.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
      "title": "Связь и тарифы",
      "trainerId": "practiceTariffsTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
      "selector": "#task-tabs .ttab",
      "types": [
        {
          "id": "match",
          "title": "Сопоставление",
          "kind": "exam"
        },
        {
          "id": "bill",
          "title": "Стоимость месяца",
          "kind": "exam"
        },
        {
          "id": "count",
          "title": "Сколько месяцев",
          "kind": "exam"
        },
        {
          "id": "percent",
          "title": "Проценты",
          "kind": "exam"
        },
        {
          "id": "switch",
          "title": "Смена тарифа",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "tariff-read",
        "title": "Прочитать график и таблицу",
        "goal": "Связать месяц, показатель и его единицы.",
        "dependsOn": [],
        "foundations": [
          "data-tables",
          "data-scales"
        ],
        "resources": [
          {
            "title": "Сопоставление месяцев",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
            "instruction": "Выбери «Сопоставление». Для одного задания подпиши, какую линию читаешь: минуты или гигабайты.",
            "finish": "Данные нескольких месяцев прочитаны в нужном порядке."
          }
        ],
        "explain": {
          "prompt": "Как избежать чтения гигабайтов вместо минут на одном рисунке?",
          "criteria": [
            "Проверь условное обозначение показателя.",
            "Найди месяц и шкалу.",
            "Запиши число с единицей до сравнения."
          ]
        },
        "misconception": "Читать ближайшую точку без проверки легенды и шкалы.",
        "covers": [
          "match"
        ],
        "finish": "Значения связаны с правильным показателем."
      },
      {
        "id": "tariff-condition",
        "title": "Проверить условие для каждого месяца",
        "goal": "Отличить «больше», «не меньше», «не превысил» и совместные ограничения.",
        "dependsOn": [
          "tariff-read"
        ],
        "foundations": [
          "inequality-number-line",
          "natural-compare"
        ],
        "resources": [
          {
            "title": "Сколько месяцев",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
            "instruction": "Реши одну задачу «Сколько месяцев». Возле каждого месяца отметь выполнение точного условия, включая граничное значение.",
            "finish": "Число месяцев совпадает с числом отметок."
          }
        ],
        "explain": {
          "prompt": "Будет ли месяц ровно на границе входить в ответ?",
          "criteria": [
            "Переведи слова в знак сравнения.",
            "Отдельно проверь равенство лимиту.",
            "При нескольких ограничениях проверь их совместное выполнение."
          ]
        },
        "misconception": "Смешивать строгое и нестрогое неравенство или считать месяцы дважды.",
        "covers": [
          "count"
        ],
        "finish": "Каждый засчитанный месяц удовлетворяет всем условиям."
      },
      {
        "id": "tariff-month-bill",
        "title": "Разделить включённое и платное",
        "goal": "Начислить доплату только за превышение, учитывая целые пакеты.",
        "dependsOn": [
          "tariff-read",
          "tariff-condition"
        ],
        "foundations": [
          "word-change",
          "division-remainder",
          "decimal-multiply"
        ],
        "resources": [
          {
            "title": "Стоимость месяца",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
            "instruction": "Открой «Стоимость месяца». Запиши абонплату, сверхлимитные минуты и дополнительные интернет-пакеты отдельными строками.",
            "finish": "Один месячный счёт собран из нужных слагаемых."
          }
        ],
        "explain": {
          "prompt": "Почему нельзя умножить всю длительность разговоров на цену минуты сверх пакета?",
          "criteria": [
            "Вычти включённый объём; отрицательное превышение замени нулём.",
            "Для неделимых интернет-пакетов округли число пакетов вверх.",
            "Добавь абонплату ровно один раз."
          ]
        },
        "misconception": "Оплачивать повторно включённые услуги или покупать долю пакета.",
        "covers": [
          "bill"
        ],
        "finish": "Счёт проверен раздельными слагаемыми."
      },
      {
        "id": "tariff-percent",
        "title": "Рост и восстановление платы",
        "goal": "Выбрать старую базу процента или восстановить её по новой цене.",
        "dependsOn": [
          "tariff-month-bill"
        ],
        "foundations": [
          "percent-change",
          "percent-part-whole-rate"
        ],
        "resources": [
          {
            "title": "Изменение тарифа",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
            "instruction": "Выполни одну задачу «Проценты». В таблице запиши старое значение, изменение и новое значение.",
            "finish": "Одна задача на изменение платы решена и проверена."
          },
          {
            "title": "Проценты: таблица и проверка",
            "href": "/trainers/oge-1-5-trainers/percent-table-trainer.html",
            "instruction": "Открой «Проверить себя» и выбери «Базовая проверка». Закончи пять задач, затем разбери ошибки.",
            "finish": "Одна проверка завершена; неверно выбранное целое исправлено."
          }
        ],
        "explain": {
          "prompt": "Что нужно знать о базе процента перед сравнением двух тарифных платежей?",
          "criteria": [
            "Найди, какое значение названо исходным.",
            "Для роста раздели прибавку на исходное.",
            "Для обратного вопроса раздели новый платёж на коэффициент изменения."
          ]
        },
        "misconception": "Делить прибавку на новую плату или уменьшать новую цену на тот же процент.",
        "covers": [
          "percent"
        ],
        "finish": "Старое и новое значения проверены прямым пересчётом."
      },
      {
        "id": "tariff-annual",
        "title": "Сравнить одинаковый год",
        "goal": "Для каждого тарифа сложить расходы всех месяцев и разовые платежи.",
        "dependsOn": [
          "tariff-month-bill",
          "tariff-percent"
        ],
        "foundations": [
          "word-change",
          "data-mean"
        ],
        "resources": [
          {
            "title": "Смена тарифа",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
            "instruction": "Выбери «Смена тарифа». Рассчитай оба годовых итога и только затем назови абонплату выбранного тарифа.",
            "finish": "Выбор основан на годовых расходах, а ответ дан в форме вопроса."
          }
        ],
        "explain": {
          "prompt": "Может ли тариф с меньшей абонплатой оказаться дороже за год?",
          "criteria": [
            "Учти фактическое использование услуг по месяцам.",
            "Добавь все доплаты и разовые расходы, если они заданы.",
            "Различи годовую стоимость и абонплату, которую просят записать."
          ]
        },
        "misconception": "Выбирать только по абонплате или отвечать годовой суммой вместо требуемого тарифа.",
        "covers": [
          "switch"
        ],
        "finish": "Сравнены одинаковые услуги и срок."
      },
      {
        "id": "tariff-boundary",
        "title": "Проверить пограничный случай",
        "goal": "Проверить свой расчёт при точном лимите, небольшом превышении и смене тарифа.",
        "dependsOn": [
          "tariff-condition",
          "tariff-month-bill",
          "tariff-annual"
        ],
        "foundations": [
          "rounding",
          "division-remainder",
          "word-comparison"
        ],
        "resources": [
          {
            "title": "Другой вариант расчёта",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html",
            "instruction": "Перейди к новому варианту и реши «Стоимость месяца». Затем вручную проверь, что получится при использовании ровно по лимиту.",
            "finish": "Реальный счёт и граничный случай объясняются одной моделью."
          }
        ],
        "explain": {
          "prompt": "Что произойдёт со стоимостью, если интернет превысит границу пакета совсем немного?",
          "criteria": [
            "Проверь правило оплаты целого дополнительного блока.",
            "Сравни расход ровно на границе и сразу выше неё.",
            "Не округляй само использование до проверки лимита."
          ]
        },
        "misconception": "Заменять оплату пакетами непрерывной ценой за гигабайт.",
        "covers": [
          "bill",
          "switch"
        ],
        "finish": "Правило тарифа работает и в пограничных случаях."
      }
    ],
    "questions": [
      {
        "prompt": "По таблице выбери месяц с наибольшим числом минут разговоров.",
        "input": "choice",
        "answer": "Февраль",
        "choices": [
          "Март",
          "Январь",
          "Февраль"
        ],
        "hint": "Сравни числа в столбце минут, не интернета.",
        "explanation": "Максимум 330 минут относится к февралю.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "max",
            210,
            330,
            280
          ],
          "values": [
            280,
            210,
            330
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Месяц",
            "Минуты",
            "Интернет, ГБ"
          ],
          "rows": [
            [
              "Январь",
              210,
              6
            ],
            [
              "Февраль",
              330,
              4
            ],
            [
              "Март",
              280,
              8
            ]
          ]
        },
        "id": "practical-tariffs-practice-01",
        "nodeId": "tariff-read"
      },
      {
        "prompt": "За пять месяцев использовали 250, 300, 350, 420 и 310 минут. В скольких месяцах число минут было строго больше 300?",
        "input": "number",
        "answer": "3",
        "hint": "Месяц ровно с 300 минутами не удовлетворяет слову «больше».",
        "explanation": "Условие выполняется для 350, 420 и 310 минут — в трёх месяцах.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "max",
              [
                "cmp",
                250,
                300
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                300,
                300
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                350,
                300
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                420,
                300
              ],
              0
            ],
            [
              "max",
              [
                "cmp",
                310,
                300
              ],
              0
            ]
          ]
        },
        "id": "practical-tariffs-practice-02",
        "nodeId": "tariff-condition"
      },
      {
        "prompt": "Абонплата 350 рублей включает 300 минут. Каждая минута сверх пакета стоит 2 рубля. Использовано 340 минут, других доплат нет. Найди счёт за месяц.",
        "input": "number",
        "answer": "430",
        "hint": "Платными являются только минуты сверх включённого количества.",
        "explanation": "Превышение 40 минут; счёт 350 + 40 · 2 = 430 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            350,
            [
              "mul",
              [
                "max",
                [
                  "sub",
                  340,
                  300
                ],
                0
              ],
              2
            ]
          ]
        },
        "id": "practical-tariffs-practice-03",
        "nodeId": "tariff-month-bill"
      },
      {
        "prompt": "Абонплата выросла с 400 до 460 рублей. На сколько процентов она увеличилась?",
        "input": "number",
        "answer": "15",
        "hint": "Прибавку сравнивают с прежней платой.",
        "explanation": "Прибавка 60 руб.; 60 : 400 · 100 = 15%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                460,
                400
              ],
              400
            ],
            100
          ]
        },
        "id": "practical-tariffs-practice-04",
        "nodeId": "tariff-percent"
      },
      {
        "prompt": "Все 12 месяцев используется по 350 минут. А: 400 руб./мес, 500 минут включено. Б: 290 руб./мес, 300 минут включено, сверх пакета 2 руб./мин. Какой итог за год верен для более дешёвого тарифа?",
        "input": "choice",
        "answer": "Б: 4680 руб.",
        "choices": [
          "Б: 4680 руб.",
          "Б: 3480 руб.",
          "А: 4800 руб."
        ],
        "hint": "На тарифе Б в каждом месяце есть платное превышение.",
        "explanation": "А: 4800 руб. Б: 12 · (290 + 50 · 2) = 4680 руб. Б дешевле.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "mul",
              12,
              400
            ],
            [
              "mul",
              12,
              [
                "add",
                290,
                [
                  "mul",
                  [
                    "sub",
                    350,
                    300
                  ],
                  2
                ]
              ]
            ]
          ],
          "values": [
            4680,
            3480,
            4800
          ]
        },
        "id": "practical-tariffs-practice-05",
        "nodeId": "tariff-annual"
      },
      {
        "prompt": "Тариф стоит 300 рублей и включает 4 ГБ. Дополнительные пакеты по 0,5 ГБ стоят 60 рублей. Использовано ровно 4 ГБ. Какова плата при отсутствии других услуг?",
        "input": "number",
        "answer": "300",
        "hint": "Равенство лимиту не является превышением.",
        "explanation": "Превышение равно нулю; дополнительных пакетов нет. Плата 300 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            300,
            [
              "mul",
              [
                "ceil",
                [
                  "div",
                  [
                    "max",
                    [
                      "sub",
                      4,
                      4
                    ],
                    0
                  ],
                  "0.5"
                ]
              ],
              60
            ]
          ]
        },
        "id": "practical-tariffs-practice-06",
        "nodeId": "tariff-boundary"
      },
      {
        "prompt": "По диаграмме найди, на сколько гигабайтов использование интернета в марте больше, чем в январе.",
        "input": "number",
        "answer": "3",
        "hint": "Прочитай высоты столбцов именно двух названных месяцев.",
        "explanation": "В марте 7 ГБ, в январе 4 ГБ; разница 3 ГБ.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            7,
            4
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Янв",
            "Фев",
            "Мар"
          ],
          "values": [
            4,
            6,
            7
          ],
          "unit": "ГБ"
        },
        "id": "practical-tariffs-check-a-01",
        "nodeId": "tariff-read"
      },
      {
        "prompt": "Использование интернета по пяти месяцам: 4,8; 5,5; 6; 5; 7 ГБ. В скольких месяцах оно не превышало 5 ГБ?",
        "input": "number",
        "answer": "2",
        "hint": "«Не превышало» включает случай ровно на лимите.",
        "explanation": "Подходят 4,8 и 5 ГБ — два месяца.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              1,
              [
                "max",
                [
                  "cmp",
                  "4.8",
                  5
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
                  "5.5",
                  5
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
                  6,
                  5
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
                  5
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
                  7,
                  5
                ],
                0
              ]
            ]
          ]
        },
        "id": "practical-tariffs-check-a-02",
        "nodeId": "tariff-condition"
      },
      {
        "prompt": "Абонплата 400 рублей включает 5 ГБ. Сверх пакета интернет продаётся только целыми блоками по 0,5 ГБ за 80 рублей. Использовано 6,2 ГБ. Сколько заплатят без других доплат?",
        "input": "number",
        "answer": "640",
        "hint": "Найди превышение и проверь, сколько целых блоков его покроет.",
        "explanation": "Превышение 1,2 ГБ. Нужны 3 блока по 0,5 ГБ; счёт 400 + 240 = 640 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            400,
            [
              "mul",
              [
                "ceil",
                [
                  "div",
                  [
                    "sub",
                    "6.2",
                    5
                  ],
                  "0.5"
                ]
              ],
              80
            ]
          ]
        },
        "id": "practical-tariffs-check-a-03",
        "nodeId": "tariff-month-bill"
      },
      {
        "prompt": "После повышения абонплаты на 25% она стала равна 625 рублям. Найди прежнюю абонплату.",
        "input": "number",
        "answer": "500",
        "hint": "Новая плата составляет 125% прежней.",
        "explanation": "625 : 1,25 = 500 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            625,
            "1.25"
          ]
        },
        "id": "practical-tariffs-check-a-04",
        "nodeId": "tariff-percent"
      },
      {
        "prompt": "Услуги двух планов полностью покрывают потребности. А: подключение 1800 рублей и 300 рублей в месяц. Б: подключение бесплатно и 430 рублей в месяц. Выбери меньшие расходы за первые 12 месяцев.",
        "input": "choice",
        "answer": "Б: 5160 руб.",
        "choices": [
          "А: 5400 руб.",
          "А: 3600 руб.",
          "Б: 5160 руб."
        ],
        "hint": "Подключение оплачивается один раз и входит в первый год.",
        "explanation": "А: 1800 + 3600 = 5400 руб.; Б: 5160 руб. Дешевле Б.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "min",
            [
              "add",
              1800,
              [
                "mul",
                12,
                300
              ]
            ],
            [
              "mul",
              12,
              430
            ]
          ],
          "values": [
            5400,
            3600,
            5160
          ]
        },
        "id": "practical-tariffs-check-a-05",
        "nodeId": "tariff-annual"
      },
      {
        "prompt": "Абонплата 450 рублей включает 8 ГБ. Дополнительный блок 0,5 ГБ стоит 70 рублей и оплачивается целиком. Использовано 8,01 ГБ. Сколько рублей составит счёт?",
        "input": "number",
        "answer": "520",
        "hint": "Даже маленькое положительное превышение требует целого блока.",
        "explanation": "Превышение 0,01 ГБ покрывает один блок; 450 + 70 = 520 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            450,
            [
              "mul",
              [
                "ceil",
                [
                  "div",
                  [
                    "sub",
                    "8.01",
                    8
                  ],
                  "0.5"
                ]
              ],
              70
            ]
          ]
        },
        "id": "practical-tariffs-check-a-06",
        "nodeId": "tariff-boundary"
      },
      {
        "prompt": "В таблице рядом приведены минуты и интернет. Сколько гигабайтов использовано суммарно за апрель и май?",
        "input": "number",
        "answer": "7.75",
        "hint": "Сложи два значения нужного столбца.",
        "explanation": "3,5 + 4,25 = 7,75 ГБ.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "3.5",
            "4.25"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Месяц",
            "Минуты",
            "Интернет, ГБ"
          ],
          "rows": [
            [
              "Апрель",
              380,
              "3,5"
            ],
            [
              "Май",
              420,
              "4,25"
            ]
          ]
        },
        "id": "practical-tariffs-check-b-01",
        "nodeId": "tariff-read"
      },
      {
        "prompt": "Пакет включает 400 минут и 6 ГБ. В скольких месяцах по таблице одновременно не превышен ни один из этих лимитов?",
        "input": "number",
        "answer": "4",
        "hint": "Месяц подходит только тогда, когда выполнены оба условия.",
        "explanation": "Подходят месяцы 2, 4, 5 и 6. В 1 превышен интернет, в 3 — минуты.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              [
                "sub",
                1,
                [
                  "max",
                  [
                    "cmp",
                    350,
                    400
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
                    7,
                    6
                  ],
                  0
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
                    400,
                    400
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
                    6,
                    6
                  ],
                  0
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
                    420,
                    400
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
                    6
                  ],
                  0
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
                    280,
                    400
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
                    6
                  ],
                  0
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
                    390,
                    400
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
                    6,
                    6
                  ],
                  0
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
                    375,
                    400
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
                    3,
                    6
                  ],
                  0
                ]
              ]
            ]
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Месяц",
            "Минуты",
            "Интернет, ГБ"
          ],
          "rows": [
            [
              1,
              350,
              7
            ],
            [
              2,
              400,
              6
            ],
            [
              3,
              420,
              4
            ],
            [
              4,
              280,
              5
            ],
            [
              5,
              390,
              6
            ],
            [
              6,
              375,
              3
            ]
          ]
        },
        "id": "practical-tariffs-check-b-02",
        "nodeId": "tariff-condition"
      },
      {
        "prompt": "Абонплата 500 рублей включает 400 минут и 8 ГБ. Сверх пакета: 3 руб./мин и 90 рублей за целый блок 1 ГБ. Использовано 445 минут и 8,2 ГБ. Найди счёт.",
        "input": "number",
        "answer": "725",
        "hint": "Сверхлимитные минуты и интернет — два разных слагаемых.",
        "explanation": "Минуты: 45 · 3 = 135 руб.; интернет: один блок за 90 руб. Всего 725 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            500,
            [
              "mul",
              [
                "sub",
                445,
                400
              ],
              3
            ],
            [
              "mul",
              [
                "ceil",
                [
                  "sub",
                  "8.2",
                  8
                ]
              ],
              90
            ]
          ]
        },
        "id": "practical-tariffs-check-b-03",
        "nodeId": "tariff-month-bill"
      },
      {
        "prompt": "Абонплата снизилась с 720 до 612 рублей. На сколько процентов уменьшилась плата?",
        "input": "number",
        "answer": "15",
        "hint": "Уменьшение сравнивается с платой до снижения.",
        "explanation": "Уменьшение 108 руб.; 108 : 720 · 100 = 15%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                720,
                612
              ],
              720
            ],
            100
          ]
        },
        "id": "practical-tariffs-check-b-04",
        "nodeId": "tariff-percent"
      },
      {
        "prompt": "Тариф А стоит 480 руб./мес и покрывает все разговоры. Тариф Б: 320 руб./мес, 400 минут включено, сверх пакета 3 руб./мин. Шесть месяцев используют по 300 минут, остальные шесть — по 500. На сколько рублей Б дешевле А за год?",
        "input": "number",
        "answer": "120",
        "hint": "Не заменяй разные месяцы средним расходом: доплата появляется только в месяцы превышения.",
        "explanation": "А: 5760 руб. Б: 6 · 320 + 6 · 620 = 5640 руб. Разница 120 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              12,
              480
            ],
            [
              "add",
              [
                "mul",
                6,
                320
              ],
              [
                "mul",
                6,
                [
                  "add",
                  320,
                  [
                    "mul",
                    [
                      "sub",
                      500,
                      400
                    ],
                    3
                  ]
                ]
              ]
            ]
          ]
        },
        "id": "practical-tariffs-check-b-05",
        "nodeId": "tariff-annual"
      },
      {
        "prompt": "В тариф включено 2 ГБ. Сверх лимита покупают целые пакеты по 0,25 ГБ. Использовано 2,51 ГБ. Сколько дополнительных пакетов требуется?",
        "input": "number",
        "answer": "3",
        "hint": "Не округляй использование перед сравнением с границей пакета.",
        "explanation": "Превышение 0,51 ГБ; два пакета дают только 0,5 ГБ. Нужны три.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "ceil",
            [
              "div",
              [
                "sub",
                "2.51",
                2
              ],
              "0.25"
            ]
          ]
        },
        "id": "practical-tariffs-check-b-06",
        "nodeId": "tariff-boundary"
      }
    ]
  },
  {
    "id": "practical-paper",
    "taskNumbers": [
      1,
      2,
      3,
      4,
      5
    ],
    "title": "Листы бумаги",
    "goal": "Связать формат, число разрезов, площадь, стороны, массу и диагональ.",
    "transferGoal": "При новом формате восстанови число делений пополам; площадь меняется вдвое, а линейные размеры связаны подобием.",
    "source": {
      "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
      "title": "Листы бумаги",
      "trainerId": "practicePaperSheetsTrainer"
    },
    "inventory": {
      "sourcePath": "trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
      "selector": "#typeChips [data-idx]",
      "types": [
        {
          "id": "match",
          "title": "Соответствие форматов",
          "kind": "exam"
        },
        {
          "id": "count",
          "title": "Сколько листов",
          "kind": "exam"
        },
        {
          "id": "area",
          "title": "Площадь формата",
          "kind": "exam"
        },
        {
          "id": "ratio",
          "title": "Отношение сторон",
          "kind": "exam"
        },
        {
          "id": "mass",
          "title": "Масса пачки",
          "kind": "exam"
        },
        {
          "id": "diag",
          "title": "Диагональ и сторона",
          "kind": "exam"
        }
      ]
    },
    "nodes": [
      {
        "id": "paper-formats",
        "title": "Восстановить цепочку форматов",
        "goal": "Понять, что больший номер означает меньший лист той же серии.",
        "dependsOn": [],
        "foundations": [
          "fraction-meaning",
          "powers"
        ],
        "resources": [
          {
            "title": "Соответствие форматов",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
            "instruction": "Выбери «соответствие». Реши один пример и для каждой соседней пары объясни переход одним разрезом.",
            "finish": "Форматы сопоставлены по цепочке деления пополам."
          }
        ],
        "explain": {
          "prompt": "Почему A5 меньше A3, хотя число 5 больше 3?",
          "criteria": [
            "Назови количество разрезов между форматами.",
            "После каждого разреза площадь одного листа уменьшается вдвое.",
            "Сохрани порядок размеров при сопоставлении."
          ]
        },
        "misconception": "Считать больший номер обозначением большей площади.",
        "covers": [
          "match"
        ],
        "finish": "Порядок форматов объяснён разрезами."
      },
      {
        "id": "paper-count",
        "title": "Посчитать листы после разрезов",
        "goal": "Использовать удвоение количества при каждом переходе.",
        "dependsOn": [
          "paper-formats"
        ],
        "foundations": [
          "powers",
          "equal-groups"
        ],
        "resources": [
          {
            "title": "Сколько листов",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
            "instruction": "Выбери «сколько листов» и реши два задания с разными начальным и конечным форматами.",
            "finish": "Два количества проверены последовательным удвоением."
          }
        ],
        "explain": {
          "prompt": "Чем число разрезов отличается от числа полученных листов?",
          "criteria": [
            "Найди разность номеров форматов.",
            "Посчитай последовательные удвоения.",
            "При нескольких исходных листах умножь результат на их число."
          ]
        },
        "misconception": "Умножать на число разрезов вместо степени двойки.",
        "covers": [
          "count"
        ],
        "finish": "Количество связано с числом переходов."
      },
      {
        "id": "paper-area",
        "title": "Найти площадь формата",
        "goal": "Делить площадь пополам и переводить квадратные единицы.",
        "dependsOn": [
          "paper-count"
        ],
        "foundations": [
          "fraction-part-whole",
          "geometry-square-units"
        ],
        "resources": [
          {
            "title": "Площадь листа",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
            "instruction": "Выбери «площадь» и реши один пример. Проверь, что площадь всех полученных листов равна площади исходного.",
            "finish": "Одна площадь проверена сохранением общей площади."
          }
        ],
        "explain": {
          "prompt": "Какая величина сохраняется при разрезании без отходов?",
          "criteria": [
            "Запиши число полученных листов.",
            "Найди площадь одного листа.",
            "Умножь количество на площадь и восстанови исходную."
          ]
        },
        "misconception": "Путать долю одного листа с площадью всей пачки или переводить м² как метры.",
        "covers": [
          "area"
        ],
        "finish": "Площадь подтверждена обратным умножением."
      },
      {
        "id": "paper-sides",
        "title": "Стороны и подобие",
        "goal": "Различить отношение сторон и отношение площадей.",
        "dependsOn": [
          "paper-area"
        ],
        "foundations": [
          "ratio-common-units",
          "proportion-direct"
        ],
        "resources": [
          {
            "title": "Отношение сторон",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
            "instruction": "Выбери «отношение». В одном примере подпиши, какую сторону делишь на какую, и проверь, больше или меньше единицы результат.",
            "finish": "Одно отношение найдено в требуемом направлении."
          }
        ],
        "explain": {
          "prompt": "Почему отношение длинной стороны к короткой не совпадает с отношением площадей соседних форматов?",
          "criteria": [
            "Назови сравниваемые величины и приведи длины к одним единицам.",
            "Проверь порядок числителя и знаменателя.",
            "При подобии отличи коэффициент длин от квадрата этого коэффициента."
          ]
        },
        "misconception": "Принимать половину площади за половину каждой стороны.",
        "covers": [
          "ratio"
        ],
        "finish": "Направление и смысл отношения объяснены."
      },
      {
        "id": "paper-mass",
        "title": "Масса через площадь и плотность",
        "goal": "Умножить массу квадратного метра на общую площадь листов.",
        "dependsOn": [
          "paper-area"
        ],
        "foundations": [
          "geometry-mass-capacity",
          "proportion-direct"
        ],
        "resources": [
          {
            "title": "Масса пачки",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
            "instruction": "Выбери «масса пачки». Реши один пример, отдельно найдя площадь одного листа и площадь всей пачки.",
            "finish": "Масса получена с согласованными г, кг и м²."
          }
        ],
        "explain": {
          "prompt": "Что означает плотность бумаги 80 г/м²?",
          "criteria": [
            "Покажи, что это масса площади 1 м², а не одного любого листа.",
            "Умножь площадь одного листа на количество и на плотность.",
            "Переведи граммы в килограммы только после расчёта, если это требуется."
          ]
        },
        "misconception": "Умножать плотность только на число листов без учёта их площади.",
        "covers": [
          "mass"
        ],
        "finish": "Общая масса следует из общей площади."
      },
      {
        "id": "paper-diagonal",
        "title": "Диагональ и проверка отношения",
        "goal": "Построить прямоугольный треугольник из сторон и диагонали листа.",
        "dependsOn": [
          "paper-sides"
        ],
        "foundations": [
          "expression-powers-roots",
          "rounding"
        ],
        "resources": [
          {
            "title": "Диагональ и сторона",
            "href": "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html",
            "instruction": "Выбери «диагональ». Реши один пример; округли только после вычисления требуемого отношения.",
            "finish": "Диагональ больше каждой стороны, отношение записано в нужном направлении."
          }
        ],
        "explain": {
          "prompt": "Почему диагональ нельзя найти сложением длины и ширины?",
          "criteria": [
            "Укажи прямой угол между сторонами.",
            "Запиши квадрат диагонали как сумму квадратов.",
            "Проверь, что диагональ меньше суммы сторон и больше каждой из них."
          ]
        },
        "misconception": "Складывать стороны или округлять корень до деления на сторону.",
        "covers": [
          "diag"
        ],
        "finish": "Диагональ и её отношение проверены геометрически."
      }
    ],
    "questions": [
      {
        "prompt": "В модели форматов A каждый разрез пополам увеличивает номер формата на один. Лист A2 разрезали по этому правилу три раза подряд. Какой номер будет у полученного формата A…?",
        "input": "number",
        "answer": "5",
        "hint": "Проследи номера форматов, не число получившихся листов.",
        "explanation": "После A2 идут A3, A4, A5. Номер итогового формата — 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            3
          ]
        },
        "id": "practical-paper-practice-01",
        "nodeId": "paper-formats"
      },
      {
        "prompt": "Каждый переход к следующему формату удваивает число листов. Сколько листов A4 получается из одного A1 без отходов?",
        "input": "number",
        "answer": "8",
        "hint": "Найди число переходов и выполни столько удвоений.",
        "explanation": "От A1 до A4 три перехода: 2 · 2 · 2 = 8 листов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            2,
            [
              "sub",
              4,
              1
            ]
          ]
        },
        "id": "practical-paper-practice-02",
        "nodeId": "paper-count"
      },
      {
        "prompt": "В идеальной модели площадь A0 равна 1 м², каждый следующий формат имеет вдвое меньшую площадь. Найди площадь одного A3 в м². Можно записать дробью.",
        "input": "number",
        "answer": "1/8",
        "hint": "Площадь одного листа уменьшается вдвое при каждом переходе.",
        "explanation": "После трёх делений: 1 : 8 = 1/8 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "pow",
              2,
              3
            ]
          ]
        },
        "id": "practical-paper-practice-03",
        "nodeId": "paper-area"
      },
      {
        "prompt": "Даны размеры листа 210 × 297 мм. Найди отношение длинной стороны к короткой и округли до десятых.",
        "input": "number",
        "answer": "1.4",
        "hint": "Длинная сторона стоит в числителе. Округли только итог отношения.",
        "explanation": "297 : 210 ≈ 1,414; до десятых это 1,4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "round",
            [
              "div",
              297,
              210
            ],
            1
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 210,
          "height": 297,
          "unit": "мм"
        },
        "id": "practical-paper-practice-04",
        "nodeId": "paper-sides"
      },
      {
        "prompt": "В идеальной модели лист A4 имеет площадь 1/16 м². Плотность бумаги 80 г/м². В пачке 500 листов. Найди массу пачки в килограммах.",
        "input": "number",
        "answer": "2.5",
        "hint": "Сначала найди граммы одного листа, затем всей пачки.",
        "explanation": "Один лист весит 5 г; 500 листов — 2500 г = 2,5 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              "1/16",
              80,
              500
            ],
            1000
          ]
        },
        "id": "practical-paper-practice-05",
        "nodeId": "paper-mass"
      },
      {
        "prompt": "Вспомогательный прямоугольный лист бумаги имеет стороны 3 и 4 см. Найди его диагональ в сантиметрах.",
        "input": "number",
        "answer": "5",
        "hint": "Стороны листа — катеты, диагональ — гипотенуза.",
        "explanation": "Диагональ равна √(3² + 4²) = √25 = 5 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": [
            "add",
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
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 3,
          "height": 4,
          "unit": "см"
        },
        "id": "practical-paper-practice-06",
        "nodeId": "paper-diagonal"
      },
      {
        "prompt": "После четырёх последовательных переходов к следующему формату получили A7. Какой номер был у исходного формата A…?",
        "input": "number",
        "answer": "3",
        "hint": "Иди по цепочке форматов назад на четыре шага.",
        "explanation": "Исходный номер: 7 − 4 = 3, то есть A3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            7,
            4
          ]
        },
        "id": "practical-paper-check-a-01",
        "nodeId": "paper-formats"
      },
      {
        "prompt": "Из каждого листа получают следующий формат делением пополам. Сколько листов A5 получится из трёх листов A2 без отходов?",
        "input": "number",
        "answer": "24",
        "hint": "Сначала найди выход из одного исходного листа.",
        "explanation": "Из одного A2 получается 8 листов A5; из трёх — 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "pow",
              2,
              [
                "sub",
                5,
                2
              ]
            ]
          ]
        },
        "id": "practical-paper-check-a-02",
        "nodeId": "paper-count"
      },
      {
        "prompt": "В идеальной модели A0 имеет площадь 1 м², каждый следующий формат вдвое меньше. Найди площадь A5 в см².",
        "input": "number",
        "answer": "312.5",
        "hint": "В квадратном метре десять тысяч квадратных сантиметров.",
        "explanation": "1 м² : 32 = 10000 : 32 = 312,5 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            10000,
            [
              "pow",
              2,
              5
            ]
          ]
        },
        "id": "practical-paper-check-a-03",
        "nodeId": "paper-area"
      },
      {
        "prompt": "Прямоугольный образец имеет стороны 15 и 21 см. Другой лист подобен ему, короткая сторона равна 20 см. Найди длинную сторону нового листа в сантиметрах.",
        "input": "number",
        "answer": "28",
        "hint": "У подобных прямоугольников обе стороны меняются в одном отношении.",
        "explanation": "Коэффициент 20/15 = 4/3; длинная сторона 21 · 4/3 = 28 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            21,
            [
              "div",
              20,
              15
            ]
          ]
        },
        "id": "practical-paper-check-a-04",
        "nodeId": "paper-sides"
      },
      {
        "prompt": "Лист A5 имеет площадь 1/32 м², бумага весит 96 г на 1 м². Пачка весит 600 г. Сколько листов в пачке?",
        "input": "number",
        "answer": "200",
        "hint": "Найди массу одного листа и сравни с массой всей пачки.",
        "explanation": "Один лист весит 96 : 32 = 3 г; 600 : 3 = 200 листов.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            600,
            [
              "mul",
              "1/32",
              96
            ]
          ]
        },
        "id": "practical-paper-check-a-05",
        "nodeId": "paper-mass"
      },
      {
        "prompt": "Прямоугольный лист имеет стороны 6 и 8 см. Найди отношение его диагонали к короткой стороне. Запиши точную дробь.",
        "input": "number",
        "answer": "5/3",
        "hint": "Сначала найди диагональ по Пифагору, затем раздели на короткую сторону.",
        "explanation": "Диагональ 10 см; её отношение к 6 см равно 10/6 = 5/3.",
        "oracle": {
          "kind": "square-root",
          "radicand": [
            "div",
            [
              "add",
              [
                "pow",
                6,
                2
              ],
              [
                "pow",
                8,
                2
              ]
            ],
            [
              "pow",
              6,
              2
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 6,
          "height": 8,
          "unit": "см"
        },
        "id": "practical-paper-check-a-06",
        "nodeId": "paper-diagonal"
      },
      {
        "prompt": "В идеальной модели серии A площади соседних форматов отличаются вдвое. Выбери самый большой лист из предложенных.",
        "input": "choice",
        "answer": "A2",
        "choices": [
          "A4",
          "A2",
          "A3"
        ],
        "hint": "С увеличением номера площадь одного листа уменьшается.",
        "explanation": "Площади A4, A2 и A3 равны 1/16, 1/4 и 1/8 м²; наибольшая у A2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "max",
            "1/16",
            "1/4",
            "1/8"
          ],
          "values": [
            "1/16",
            "1/4",
            "1/8"
          ]
        },
        "id": "practical-paper-check-b-01",
        "nodeId": "paper-formats"
      },
      {
        "prompt": "Нужно получить 64 листа A6. Каждый переход к следующему формату — разрез пополам без отходов. Сколько листов A2 потребуется?",
        "input": "number",
        "answer": "4",
        "hint": "Определи выход A6 из одного A2, затем найди число исходных листов.",
        "explanation": "Из одного A2 получается 16 листов A6; 64 : 16 = 4 листа A2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            64,
            [
              "pow",
              2,
              [
                "sub",
                6,
                2
              ]
            ]
          ]
        },
        "id": "practical-paper-check-b-02",
        "nodeId": "paper-count"
      },
      {
        "prompt": "В идеальной модели A0 имеет площадь 1 м², каждый следующий формат вдвое меньше. Какова общая площадь четырёх листов A4 в м²?",
        "input": "number",
        "answer": "1/4",
        "hint": "Различи площадь одного листа и площадь всех четырёх.",
        "explanation": "Каждый A4 имеет 1/16 м²; четыре листа — 4/16 = 1/4 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            [
              "div",
              1,
              [
                "pow",
                2,
                4
              ]
            ]
          ]
        },
        "id": "practical-paper-check-b-03",
        "nodeId": "paper-area"
      },
      {
        "prompt": "Размеры листа указаны как 148 × 210 мм. Найди отношение короткой стороны к длинной и округли до сотых.",
        "input": "number",
        "answer": "0.7",
        "hint": "В числителе нужна короткая сторона; результат должен быть меньше единицы.",
        "explanation": "148 : 210 ≈ 0,70476; до сотых это 0,70.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "round",
            [
              "div",
              148,
              210
            ],
            2
          ]
        },
        "id": "practical-paper-check-b-04",
        "nodeId": "paper-sides"
      },
      {
        "prompt": "Лист A5 имеет площадь 1/32 м². Плотность бумаги 120 г/м², в пачке 400 листов. Найди массу пачки в килограммах.",
        "input": "number",
        "answer": "1.5",
        "hint": "Умножь общую площадь пачки на плотность, затем переведи массу.",
        "explanation": "Общая площадь 400/32 = 12,5 м²; масса 1500 г = 1,5 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              "1/32",
              120,
              400
            ],
            1000
          ]
        },
        "id": "practical-paper-check-b-05",
        "nodeId": "paper-mass"
      },
      {
        "prompt": "У идеального листа серии A длинная сторона b в √2 раза больше короткой a. Для диагонали D верно D² = a² + b². Выбери D/b, округлённое до десятых. Используй √1,5 ≈ 1,2247 и √3 ≈ 1,7321.",
        "input": "choice",
        "answer": "1,2",
        "choices": [
          "1,2",
          "1,4",
          "1,7"
        ],
        "hint": "Раздели равенство для D² на квадрат именно той стороны, которая стоит в знаменателе.",
        "explanation": "Так как a²/b² = 1/2, то D²/b² = 1,5. Поэтому D/b ≈ 1,2247, то есть 1,2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "round",
            "1.2247",
            1
          ],
          "values": [
            "1.2",
            "1.4",
            "1.7"
          ]
        },
        "id": "practical-paper-check-b-06",
        "nodeId": "paper-diagonal"
      }
    ]
  }
];
});
