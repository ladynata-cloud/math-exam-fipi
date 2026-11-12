/* Number sense foundations: 38 finite routes with three distinct six-question banks.
 * Existing trainer identities and links are preserved; visits are not mastery.
 * Oracles are exact arithmetic expressions, never executable strings.
 */
(function (root, factory) {
  'use strict';
  const routes = factory();
  if (typeof module === 'object' && module.exports) module.exports = routes;
  else root.FoundationNumberSenseRoutes = routes;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return [
  {
    "id": "decimal-place-value",
    "group": "decimals",
    "title": "Разряды дроби и полезные нули",
    "goal": "Читать десятые и сотые, сохранять разряды и объяснять равные записи.",
    "covers": [
      "public:decimal-cash",
      "public:decimal-intro",
      "public:v5-decimal-zeros"
    ],
    "prerequisites": [
      "path:pre7-place-value"
    ],
    "trainers": [
      {
        "title": "Касса разрядов",
        "href": "/trainers/decimal-cash-trainer.html",
        "kind": "Модель",
        "instruction": "Собери число из целых, десятых и сотых.",
        "finish": "Собери 3 разные суммы."
      },
      {
        "title": "Первые десятичные дроби",
        "href": "/trainers/desyatichnye-drobi-level-1.html",
        "kind": "По шагам",
        "instruction": "Прочитай дробь и соотнеси её цифры с разрядами.",
        "finish": "Реши 4 задания."
      },
      {
        "title": "Нули в записи дроби",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-decimal-zeros",
        "kind": "Другой способ",
        "instruction": "Сравни дробь до и после дописывания нуля справа.",
        "finish": "Объясни 3 равенства."
      }
    ],
    "questions": [
      {
        "prompt": "Запиши десятичной дробью 37 сотых.",
        "answer": "0.37",
        "input": "number",
        "hint": "Сто равных частей образуют единицу.",
        "explanation": "37 сотых = 37/100 = 0,37.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            37,
            100
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Целые",
            "Десятые",
            "Сотые"
          ],
          "rows": [
            [
              "0",
              "3",
              "7"
            ]
          ]
        },
        "id": "decimal-place-value-01",
        "answerFormat": "decimal"
      },
      {
        "prompt": "Каково значение цифры 4 в числе 3,04?",
        "answer": "1/25",
        "input": "number",
        "hint": "После запятой первый разряд — десятые, второй — сотые.",
        "explanation": "Цифра 4 стоит в разряде сотых и означает 4/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            4,
            100
          ]
        },
        "id": "decimal-place-value-02"
      },
      {
        "prompt": "Какая запись равна 4/10?",
        "answer": "0,4",
        "input": "choice",
        "choices": [
          "4,0",
          "0,4",
          "0,04"
        ],
        "hint": "Сравни значения разрядов, а не длину записи.",
        "explanation": "4/10 = 0,4. Ноль справа от дробной части можно дописать.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            4,
            10
          ],
          "values": [
            4,
            "2/5",
            "1/25"
          ]
        },
        "id": "decimal-place-value-03"
      },
      {
        "prompt": "Сколько сотых в числе 3,37?",
        "answer": "337",
        "input": "number",
        "hint": "Каждая целая единица содержит сто сотых.",
        "explanation": "3 целых — 300 сотых. Всего 300 + 37 = 337.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              100
            ],
            37
          ]
        },
        "id": "decimal-place-value-04"
      },
      {
        "prompt": "Цена — 3 рублей 4 копеек. Запиши её в рублях.",
        "answer": "76/25",
        "input": "number",
        "hint": "Копейка — одна сотая рубля.",
        "explanation": "3 руб. 4 коп. = 3 + 4/100 = 3,04 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            3,
            [
              "div",
              4,
              100
            ]
          ]
        },
        "id": "decimal-place-value-05"
      },
      {
        "prompt": "Ученик записал 37 сотых как 3,7. Какое действие переводит количество сотых в число?",
        "answer": "Разделить на 100",
        "input": "choice",
        "choices": [
          "Умножить на 100",
          "Разделить на 100",
          "Разделить на 10"
        ],
        "hint": "Название долей говорит, на сколько равных частей разделили целое.",
        "explanation": "Нужно разделить 37 на 100: одна сотая равна 1/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            37,
            "37/100"
          ],
          "values": [
            "1/100",
            100,
            10
          ]
        },
        "id": "decimal-place-value-06"
      },
      {
        "prompt": "Запиши десятичной дробью 64 сотых.",
        "answer": "0.64",
        "input": "number",
        "hint": "Сто равных частей образуют единицу.",
        "explanation": "64 сотых = 64/100 = 0,64.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            64,
            100
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Целые",
            "Десятые",
            "Сотые"
          ],
          "rows": [
            [
              "0",
              "6",
              "4"
            ]
          ]
        },
        "id": "decimal-place-value-07",
        "answerFormat": "decimal"
      },
      {
        "prompt": "Каково значение цифры 6 в числе 5,06?",
        "answer": "3/50",
        "input": "number",
        "hint": "После запятой первый разряд — десятые, второй — сотые.",
        "explanation": "Цифра 6 стоит в разряде сотых и означает 6/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            6,
            100
          ]
        },
        "id": "decimal-place-value-08"
      },
      {
        "prompt": "Какая запись равна 7/10?",
        "answer": "0,7",
        "input": "choice",
        "choices": [
          "7,0",
          "0,7",
          "0,07"
        ],
        "hint": "Сравни значения разрядов, а не длину записи.",
        "explanation": "7/10 = 0,7. Ноль справа от дробной части можно дописать.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            7,
            10
          ],
          "values": [
            7,
            "7/10",
            "7/100"
          ]
        },
        "id": "decimal-place-value-09"
      },
      {
        "prompt": "Сколько сотых в числе 5,64?",
        "answer": "564",
        "input": "number",
        "hint": "Каждая целая единица содержит сто сотых.",
        "explanation": "5 целых — 500 сотых. Всего 500 + 64 = 564.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              5,
              100
            ],
            64
          ]
        },
        "id": "decimal-place-value-10"
      },
      {
        "prompt": "Цена — 5 рублей 6 копеек. Запиши её в рублях.",
        "answer": "253/50",
        "input": "number",
        "hint": "Копейка — одна сотая рубля.",
        "explanation": "5 руб. 6 коп. = 5 + 6/100 = 5,06 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            5,
            [
              "div",
              6,
              100
            ]
          ]
        },
        "id": "decimal-place-value-11"
      },
      {
        "prompt": "Ученик записал 64 сотых как 6,4. Какое действие переводит количество сотых в число?",
        "answer": "Разделить на 100",
        "input": "choice",
        "choices": [
          "Умножить на 100",
          "Разделить на 100",
          "Разделить на 10"
        ],
        "hint": "Название долей говорит, на сколько равных частей разделили целое.",
        "explanation": "Нужно разделить 64 на 100: одна сотая равна 1/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            64,
            "16/25"
          ],
          "values": [
            "1/100",
            100,
            10
          ]
        },
        "id": "decimal-place-value-12"
      },
      {
        "prompt": "Запиши десятичной дробью 89 сотых.",
        "answer": "0.89",
        "input": "number",
        "hint": "Сто равных частей образуют единицу.",
        "explanation": "89 сотых = 89/100 = 0,89.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            89,
            100
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Целые",
            "Десятые",
            "Сотые"
          ],
          "rows": [
            [
              "0",
              "8",
              "9"
            ]
          ]
        },
        "id": "decimal-place-value-13",
        "answerFormat": "decimal"
      },
      {
        "prompt": "Каково значение цифры 8 в числе 7,08?",
        "answer": "2/25",
        "input": "number",
        "hint": "После запятой первый разряд — десятые, второй — сотые.",
        "explanation": "Цифра 8 стоит в разряде сотых и означает 8/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            8,
            100
          ]
        },
        "id": "decimal-place-value-14"
      },
      {
        "prompt": "Какая запись равна 9/10?",
        "answer": "0,9",
        "input": "choice",
        "choices": [
          "9,0",
          "0,9",
          "0,09"
        ],
        "hint": "Сравни значения разрядов, а не длину записи.",
        "explanation": "9/10 = 0,9. Ноль справа от дробной части можно дописать.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            9,
            10
          ],
          "values": [
            9,
            "9/10",
            "9/100"
          ]
        },
        "id": "decimal-place-value-15"
      },
      {
        "prompt": "Сколько сотых в числе 7,89?",
        "answer": "789",
        "input": "number",
        "hint": "Каждая целая единица содержит сто сотых.",
        "explanation": "7 целых — 700 сотых. Всего 700 + 89 = 789.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              7,
              100
            ],
            89
          ]
        },
        "id": "decimal-place-value-16"
      },
      {
        "prompt": "Цена — 7 рублей 8 копеек. Запиши её в рублях.",
        "answer": "177/25",
        "input": "number",
        "hint": "Копейка — одна сотая рубля.",
        "explanation": "7 руб. 8 коп. = 7 + 8/100 = 7,08 руб.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            7,
            [
              "div",
              8,
              100
            ]
          ]
        },
        "id": "decimal-place-value-17"
      },
      {
        "prompt": "Ученик записал 89 сотых как 8,9. Какое действие переводит количество сотых в число?",
        "answer": "Разделить на 100",
        "input": "choice",
        "choices": [
          "Умножить на 100",
          "Разделить на 100",
          "Разделить на 10"
        ],
        "hint": "Название долей говорит, на сколько равных частей разделили целое.",
        "explanation": "Нужно разделить 89 на 100: одна сотая равна 1/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            89,
            "89/100"
          ],
          "values": [
            "1/100",
            100,
            10
          ]
        },
        "id": "decimal-place-value-18"
      }
    ]
  },
  {
    "id": "decimal-compare",
    "group": "decimals",
    "title": "Сравниваем десятичные дроби",
    "goal": "Сравнивать по разрядам, даже когда после запятой разное число цифр.",
    "covers": [
      "path:pre7-decimal-compare"
    ],
    "prerequisites": [
      "public:decimal-cash"
    ],
    "trainers": [
      {
        "title": "Сравнение по разрядам",
        "href": "/ege-baza/path/index.html#lesson=pre7-decimal-compare",
        "kind": "По шагам",
        "instruction": "Сравни целые части, затем десятые и сотые.",
        "finish": "Выполни 3 сравнения."
      },
      {
        "title": "Нули не меняют величину",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-decimal-zeros",
        "kind": "Модель",
        "instruction": "Дополни записи нулями до одинаковой длины.",
        "finish": "Проверь 3 пары."
      }
    ],
    "questions": [
      {
        "prompt": "Сравни 2,04 и 2,4.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "При одинаковых целых частях сначала сравни десятые.",
        "explanation": "У 2,04 ноль десятых, а у 2,4 — 4 десятых. Первое число меньше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "51/25",
            "12/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-compare-01"
      },
      {
        "prompt": "Сравни 0,4 и 0,40.",
        "answer": "=",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Мысленно допиши ноль справа у короткой записи.",
        "explanation": "0,4 = 0,40: ноль в конце дробной части не меняет число.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "2/5",
            "2/5"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "decimal-compare-02"
      },
      {
        "prompt": "Какое число больше: 2,4 или 2,04?",
        "answer": "12/5",
        "input": "number",
        "hint": "Запиши оба числа в сотых.",
        "explanation": "2,4 = 2,40, поэтому оно больше 2,04.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            "12/5",
            "51/25"
          ]
        },
        "id": "decimal-compare-03"
      },
      {
        "prompt": "Сравни 0,57 и 0,6.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "Большее число сотых не всегда означает большее число десятых.",
        "explanation": "0,6 = 0,60, а 57 < 60.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "57/100",
            "3/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-compare-04"
      },
      {
        "prompt": "На шкале отмечены 2,40; 2,45; 2,42. Какое число расположено левее остальных?",
        "answer": "12/5",
        "input": "number",
        "hint": "Левее находится меньшее число.",
        "explanation": "Цифры целых и десятых одинаковы. Наименьшая цифра в разряде сотых — 0, поэтому наименьшее число 2,40.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "min",
            "12/5",
            "49/20",
            "121/50"
          ]
        },
        "id": "decimal-compare-05"
      },
      {
        "prompt": "Ученик считает, что 2,57 > 2,6, потому что 57 больше 6. Какой знак верен?",
        "answer": "<",
        "input": "choice",
        "choices": [
          "<",
          "=",
          ">"
        ],
        "hint": "Сравни цифры в одинаковых разрядах.",
        "explanation": "Сравниваем 2,57 и 2,60. Сотых в первом числе меньше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "257/100",
            "13/5"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "decimal-compare-06"
      },
      {
        "prompt": "Сравни 4,06 и 4,6.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "При одинаковых целых частях сначала сравни десятые.",
        "explanation": "У 4,06 ноль десятых, а у 4,6 — 6 десятых. Первое число меньше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "203/50",
            "23/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-compare-07"
      },
      {
        "prompt": "Сравни 0,6 и 0,60.",
        "answer": "=",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Мысленно допиши ноль справа у короткой записи.",
        "explanation": "0,6 = 0,60: ноль в конце дробной части не меняет число.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "3/5",
            "3/5"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "decimal-compare-08"
      },
      {
        "prompt": "Какое число больше: 4,6 или 4,06?",
        "answer": "23/5",
        "input": "number",
        "hint": "Запиши оба числа в сотых.",
        "explanation": "4,6 = 4,60, поэтому оно больше 4,06.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            "23/5",
            "203/50"
          ]
        },
        "id": "decimal-compare-09"
      },
      {
        "prompt": "Сравни 0,68 и 0,7.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "Большее число сотых не всегда означает большее число десятых.",
        "explanation": "0,7 = 0,70, а 68 < 70.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "17/25",
            "7/10"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-compare-10"
      },
      {
        "prompt": "На шкале отмечены 4,60; 4,65; 4,62. Какое число расположено левее остальных?",
        "answer": "23/5",
        "input": "number",
        "hint": "Левее находится меньшее число.",
        "explanation": "Цифры целых и десятых одинаковы. Наименьшая цифра в разряде сотых — 0, поэтому наименьшее число 4,60.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "min",
            "23/5",
            "93/20",
            "231/50"
          ]
        },
        "id": "decimal-compare-11"
      },
      {
        "prompt": "Ученик считает, что 4,68 > 4,7, потому что 68 больше 7. Какой знак верен?",
        "answer": "<",
        "input": "choice",
        "choices": [
          "<",
          "=",
          ">"
        ],
        "hint": "Сравни цифры в одинаковых разрядах.",
        "explanation": "Сравниваем 4,68 и 4,70. Сотых в первом числе меньше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "117/25",
            "47/10"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "decimal-compare-12"
      },
      {
        "prompt": "Сравни 7,08 и 7,8.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "При одинаковых целых частях сначала сравни десятые.",
        "explanation": "У 7,08 ноль десятых, а у 7,8 — 8 десятых. Первое число меньше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "177/25",
            "39/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-compare-13"
      },
      {
        "prompt": "Сравни 0,8 и 0,80.",
        "answer": "=",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Мысленно допиши ноль справа у короткой записи.",
        "explanation": "0,8 = 0,80: ноль в конце дробной части не меняет число.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "4/5",
            "4/5"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "decimal-compare-14"
      },
      {
        "prompt": "Какое число больше: 7,8 или 7,08?",
        "answer": "39/5",
        "input": "number",
        "hint": "Запиши оба числа в сотых.",
        "explanation": "7,8 = 7,80, поэтому оно больше 7,08.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            "39/5",
            "177/25"
          ]
        },
        "id": "decimal-compare-15"
      },
      {
        "prompt": "Сравни 0,79 и 0,8.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "Большее число сотых не всегда означает большее число десятых.",
        "explanation": "0,8 = 0,80, а 79 < 80.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "79/100",
            "4/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-compare-16"
      },
      {
        "prompt": "На шкале отмечены 7,80; 7,85; 7,82. Какое число расположено левее остальных?",
        "answer": "39/5",
        "input": "number",
        "hint": "Левее находится меньшее число.",
        "explanation": "Цифры целых и десятых одинаковы. Наименьшая цифра в разряде сотых — 0, поэтому наименьшее число 7,80.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "min",
            "39/5",
            "157/20",
            "391/50"
          ]
        },
        "id": "decimal-compare-17"
      },
      {
        "prompt": "Ученик считает, что 7,79 > 7,8, потому что 79 больше 8. Какой знак верен?",
        "answer": "<",
        "input": "choice",
        "choices": [
          "<",
          "=",
          ">"
        ],
        "hint": "Сравни цифры в одинаковых разрядах.",
        "explanation": "Сравниваем 7,79 и 7,80. Сотых в первом числе меньше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "779/100",
            "39/5"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "decimal-compare-18"
      }
    ]
  },
  {
    "id": "decimal-add-subtract",
    "group": "decimals",
    "title": "Запятая под запятой",
    "goal": "Складывать, вычитать и восстанавливать пропущенную десятичную дробь.",
    "covers": [
      "oge-basics:decimal-add-subtract",
      "path:grade7-b-decimal-place-align"
    ],
    "prerequisites": [
      "path:pre7-add-carry",
      "path:pre7-subtract-borrow"
    ],
    "trainers": [
      {
        "title": "Сложение и вычитание дробей",
        "href": "/trainers/oge-basics/decimal-add-subtract.html",
        "kind": "По шагам",
        "instruction": "Поставь запятые друг под другом и дополни недостающие разряды нулями.",
        "finish": "Реши 3 суммы и 3 разности."
      },
      {
        "title": "Разряд под разрядом",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-decimal-place-align",
        "kind": "Другой способ",
        "instruction": "Сначала выровняй разряды, затем выполни действие.",
        "finish": "Реши 3 задания."
      },
      {
        "title": "Арифметическая практика",
        "href": "/trainers/arifmetika.html?course=preoge&level=n5a",
        "kind": "Практика",
        "instruction": "Записывай весь ответ с запятой.",
        "finish": "Выполни 4 новых примера."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 2,45 + 0,78.",
        "answer": "323/100",
        "input": "number",
        "hint": "Сложи сотые с сотыми; при необходимости перенеси десяток.",
        "explanation": "245/100 + 78/100 = 323/100 = 3,23.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "49/20",
            "39/50"
          ]
        },
        "id": "decimal-add-subtract-01"
      },
      {
        "prompt": "Вычисли 5 − 0,78.",
        "answer": "211/50",
        "input": "number",
        "hint": "Запиши целое число с двумя нулями после запятой.",
        "explanation": "5,00 − 0,78 = 4,22.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            "39/50"
          ]
        },
        "id": "decimal-add-subtract-02"
      },
      {
        "prompt": "Найди пропуск: □ + 0,78 = 2,45.",
        "answer": "167/100",
        "input": "number",
        "hint": "Неизвестное слагаемое находится вычитанием.",
        "explanation": "□ = 2,45 − 0,78 = 1,67.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "49/20",
            "39/50"
          ]
        },
        "id": "decimal-add-subtract-03"
      },
      {
        "prompt": "Как правильно начать вычисление 5,4 + 0,05?",
        "answer": "Записать 5,40 + 0,05",
        "input": "choice",
        "choices": [
          "Записать 5,40 + 0,50",
          "Записать 5,40 + 0,05",
          "Записать 5,04 + 0,05"
        ],
        "hint": "Разные записи слагаемого должны сохранять его значение.",
        "explanation": "Дописанный справа ноль сохраняет 5,4 = 5,40. Сотые складываются с сотыми.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            "27/5",
            "1/20"
          ],
          "values": [
            [
              "add",
              "27/5",
              "1/2"
            ],
            [
              "add",
              "27/5",
              "1/20"
            ],
            [
              "add",
              "126/25",
              "1/20"
            ]
          ]
        },
        "id": "decimal-add-subtract-04"
      },
      {
        "prompt": "К отрезку длиной 2,45 м добавили 0,78 м. Какова общая длина в метрах?",
        "answer": "323/100",
        "input": "number",
        "hint": "Части одной длины складываются.",
        "explanation": "2,45 + 0,78 = 3,23 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "49/20",
            "39/50"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Отрезок",
            "Длина, м"
          ],
          "rows": [
            [
              "Первый",
              "2,45"
            ],
            [
              "Второй",
              "0,78"
            ]
          ]
        },
        "id": "decimal-add-subtract-05"
      },
      {
        "prompt": "Из ленты длиной 3,45 м отрезали 0,78 м. Сколько метров осталось?",
        "answer": "267/100",
        "input": "number",
        "hint": "Из всей длины вычти отрезанную часть.",
        "explanation": "3,45 − 0,78 = 2,67 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "69/20",
            "39/50"
          ]
        },
        "id": "decimal-add-subtract-06"
      },
      {
        "prompt": "Вычисли 3,68 + 0,57.",
        "answer": "17/4",
        "input": "number",
        "hint": "Сложи сотые с сотыми; при необходимости перенеси десяток.",
        "explanation": "368/100 + 57/100 = 425/100 = 4,25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "92/25",
            "57/100"
          ]
        },
        "id": "decimal-add-subtract-07"
      },
      {
        "prompt": "Вычисли 7 − 0,57.",
        "answer": "643/100",
        "input": "number",
        "hint": "Запиши целое число с двумя нулями после запятой.",
        "explanation": "7,00 − 0,57 = 6,43.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            7,
            "57/100"
          ]
        },
        "id": "decimal-add-subtract-08"
      },
      {
        "prompt": "Найди пропуск: □ + 0,57 = 3,68.",
        "answer": "311/100",
        "input": "number",
        "hint": "Неизвестное слагаемое находится вычитанием.",
        "explanation": "□ = 3,68 − 0,57 = 3,11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "92/25",
            "57/100"
          ]
        },
        "id": "decimal-add-subtract-09"
      },
      {
        "prompt": "Как правильно начать вычисление 7,4 + 0,06?",
        "answer": "Записать 7,40 + 0,06",
        "input": "choice",
        "choices": [
          "Записать 7,40 + 0,60",
          "Записать 7,40 + 0,06",
          "Записать 7,04 + 0,06"
        ],
        "hint": "Разные записи слагаемого должны сохранять его значение.",
        "explanation": "Дописанный справа ноль сохраняет 7,4 = 7,40. Сотые складываются с сотыми.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            "37/5",
            "3/50"
          ],
          "values": [
            [
              "add",
              "37/5",
              "3/5"
            ],
            [
              "add",
              "37/5",
              "3/50"
            ],
            [
              "add",
              "176/25",
              "3/50"
            ]
          ]
        },
        "id": "decimal-add-subtract-10"
      },
      {
        "prompt": "К отрезку длиной 3,68 м добавили 0,57 м. Какова общая длина в метрах?",
        "answer": "17/4",
        "input": "number",
        "hint": "Части одной длины складываются.",
        "explanation": "3,68 + 0,57 = 4,25 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "92/25",
            "57/100"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Отрезок",
            "Длина, м"
          ],
          "rows": [
            [
              "Первый",
              "3,68"
            ],
            [
              "Второй",
              "0,57"
            ]
          ]
        },
        "id": "decimal-add-subtract-11"
      },
      {
        "prompt": "Из ленты длиной 4,68 м отрезали 0,57 м. Сколько метров осталось?",
        "answer": "411/100",
        "input": "number",
        "hint": "Из всей длины вычти отрезанную часть.",
        "explanation": "4,68 − 0,57 = 4,11 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "117/25",
            "57/100"
          ]
        },
        "id": "decimal-add-subtract-12"
      },
      {
        "prompt": "Вычисли 4,79 + 0,86.",
        "answer": "113/20",
        "input": "number",
        "hint": "Сложи сотые с сотыми; при необходимости перенеси десяток.",
        "explanation": "479/100 + 86/100 = 565/100 = 5,65.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "479/100",
            "43/50"
          ]
        },
        "id": "decimal-add-subtract-13"
      },
      {
        "prompt": "Вычисли 9 − 0,86.",
        "answer": "407/50",
        "input": "number",
        "hint": "Запиши целое число с двумя нулями после запятой.",
        "explanation": "9,00 − 0,86 = 8,14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            "43/50"
          ]
        },
        "id": "decimal-add-subtract-14"
      },
      {
        "prompt": "Найди пропуск: □ + 0,86 = 4,79.",
        "answer": "393/100",
        "input": "number",
        "hint": "Неизвестное слагаемое находится вычитанием.",
        "explanation": "□ = 4,79 − 0,86 = 3,93.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "479/100",
            "43/50"
          ]
        },
        "id": "decimal-add-subtract-15"
      },
      {
        "prompt": "Как правильно начать вычисление 9,4 + 0,07?",
        "answer": "Записать 9,40 + 0,07",
        "input": "choice",
        "choices": [
          "Записать 9,40 + 0,70",
          "Записать 9,40 + 0,07",
          "Записать 9,04 + 0,07"
        ],
        "hint": "Разные записи слагаемого должны сохранять его значение.",
        "explanation": "Дописанный справа ноль сохраняет 9,4 = 9,40. Сотые складываются с сотыми.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            "47/5",
            "7/100"
          ],
          "values": [
            [
              "add",
              "47/5",
              "7/10"
            ],
            [
              "add",
              "47/5",
              "7/100"
            ],
            [
              "add",
              "226/25",
              "7/100"
            ]
          ]
        },
        "id": "decimal-add-subtract-16"
      },
      {
        "prompt": "К отрезку длиной 4,79 м добавили 0,86 м. Какова общая длина в метрах?",
        "answer": "113/20",
        "input": "number",
        "hint": "Части одной длины складываются.",
        "explanation": "4,79 + 0,86 = 5,65 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "479/100",
            "43/50"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Отрезок",
            "Длина, м"
          ],
          "rows": [
            [
              "Первый",
              "4,79"
            ],
            [
              "Второй",
              "0,86"
            ]
          ]
        },
        "id": "decimal-add-subtract-17"
      },
      {
        "prompt": "Из ленты длиной 5,79 м отрезали 0,86 м. Сколько метров осталось?",
        "answer": "493/100",
        "input": "number",
        "hint": "Из всей длины вычти отрезанную часть.",
        "explanation": "5,79 − 0,86 = 4,93 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "579/100",
            "43/50"
          ]
        },
        "id": "decimal-add-subtract-18"
      }
    ]
  },
  {
    "id": "decimal-multiply",
    "group": "decimals",
    "title": "Умножаем десятичные дроби",
    "goal": "Связывать умножение с площадью, масштабом разрядов и оценкой результата.",
    "covers": [
      "public:v5-decimal-multiply"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/multiplication-mixed"
    ],
    "trainers": [
      {
        "title": "Десятичное умножение",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-decimal-multiply",
        "kind": "По шагам",
        "instruction": "Сначала найди произведение целых чисел, затем верни разряды.",
        "finish": "Реши 4 примера."
      },
      {
        "title": "Арифметика: дроби и умножение",
        "href": "/trainers/arifmetika.html?course=preoge&level=n5c",
        "kind": "Практика",
        "instruction": "До вычисления оцени размер результата.",
        "finish": "Реши 4 новых задания."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 2,4 · 3.",
        "answer": "36/5",
        "input": "number",
        "hint": "Можно умножить количество десятых.",
        "explanation": "24 десятых · 3 = 72 десятых = 7,2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "12/5",
            3
          ]
        },
        "id": "decimal-multiply-01"
      },
      {
        "prompt": "Вычисли 2,4 · 0,6.",
        "answer": "36/25",
        "input": "number",
        "hint": "В двух множителях вместе два знака после запятой.",
        "explanation": "24 · 6 = 144; результат равен 144/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "12/5",
            "3/5"
          ]
        },
        "id": "decimal-multiply-02"
      },
      {
        "prompt": "Вычисли 0,24 · 10.",
        "answer": "12/5",
        "input": "number",
        "hint": "Каждый разряд увеличивается в десять раз.",
        "explanation": "24/100 · 10 = 24/10 = 2,4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "6/25",
            10
          ]
        },
        "id": "decimal-multiply-03"
      },
      {
        "prompt": "Вычисли 2,4 · 0,1.",
        "answer": "6/25",
        "input": "number",
        "hint": "Одна десятая от числа меньше самого числа.",
        "explanation": "24/10 · 1/10 = 24/100 = 0,24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "12/5",
            "1/10"
          ]
        },
        "id": "decimal-multiply-04"
      },
      {
        "prompt": "Сравни 2,4 · 0,6 и 2,4.",
        "answer": "Первое меньше",
        "input": "choice",
        "choices": [
          "Равны",
          "Первое больше",
          "Первое меньше"
        ],
        "hint": "Умножение положительного числа на долю единицы уменьшает его.",
        "explanation": "0 < 0,6 < 1, поэтому произведение меньше исходного положительного числа.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              "12/5",
              "3/5"
            ],
            "12/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-multiply-05"
      },
      {
        "prompt": "Прямоугольник имеет стороны 2,4 м и 0,6 м. Найди площадь в м².",
        "answer": "36/25",
        "input": "number",
        "hint": "Площадь прямоугольника — произведение его сторон.",
        "explanation": "S = 2,4 · 0,6 = 1,44 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "12/5",
            "3/5"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 2.4,
          "height": 0.6,
          "unit": "м"
        },
        "id": "decimal-multiply-06"
      },
      {
        "prompt": "Вычисли 3,5 · 4.",
        "answer": "14",
        "input": "number",
        "hint": "Можно умножить количество десятых.",
        "explanation": "35 десятых · 4 = 140 десятых = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "7/2",
            4
          ]
        },
        "id": "decimal-multiply-07"
      },
      {
        "prompt": "Вычисли 3,5 · 0,7.",
        "answer": "49/20",
        "input": "number",
        "hint": "В двух множителях вместе два знака после запятой.",
        "explanation": "35 · 7 = 245; результат равен 245/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "7/2",
            "7/10"
          ]
        },
        "id": "decimal-multiply-08"
      },
      {
        "prompt": "Вычисли 0,35 · 10.",
        "answer": "7/2",
        "input": "number",
        "hint": "Каждый разряд увеличивается в десять раз.",
        "explanation": "35/100 · 10 = 35/10 = 3,5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "7/20",
            10
          ]
        },
        "id": "decimal-multiply-09"
      },
      {
        "prompt": "Вычисли 3,5 · 0,1.",
        "answer": "7/20",
        "input": "number",
        "hint": "Одна десятая от числа меньше самого числа.",
        "explanation": "35/10 · 1/10 = 35/100 = 0,35.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "7/2",
            "1/10"
          ]
        },
        "id": "decimal-multiply-10"
      },
      {
        "prompt": "Сравни 3,5 · 0,7 и 3,5.",
        "answer": "Первое меньше",
        "input": "choice",
        "choices": [
          "Равны",
          "Первое больше",
          "Первое меньше"
        ],
        "hint": "Умножение положительного числа на долю единицы уменьшает его.",
        "explanation": "0 < 0,7 < 1, поэтому произведение меньше исходного положительного числа.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              "7/2",
              "7/10"
            ],
            "7/2"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-multiply-11"
      },
      {
        "prompt": "Прямоугольник имеет стороны 3,5 м и 0,7 м. Найди площадь в м².",
        "answer": "49/20",
        "input": "number",
        "hint": "Площадь прямоугольника — произведение его сторон.",
        "explanation": "S = 3,5 · 0,7 = 2,45 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "7/2",
            "7/10"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 3.5,
          "height": 0.7,
          "unit": "м"
        },
        "id": "decimal-multiply-12"
      },
      {
        "prompt": "Вычисли 4,6 · 5.",
        "answer": "23",
        "input": "number",
        "hint": "Можно умножить количество десятых.",
        "explanation": "46 десятых · 5 = 230 десятых = 23.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "23/5",
            5
          ]
        },
        "id": "decimal-multiply-13"
      },
      {
        "prompt": "Вычисли 4,6 · 0,8.",
        "answer": "92/25",
        "input": "number",
        "hint": "В двух множителях вместе два знака после запятой.",
        "explanation": "46 · 8 = 368; результат равен 368/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "23/5",
            "4/5"
          ]
        },
        "id": "decimal-multiply-14"
      },
      {
        "prompt": "Вычисли 0,46 · 10.",
        "answer": "23/5",
        "input": "number",
        "hint": "Каждый разряд увеличивается в десять раз.",
        "explanation": "46/100 · 10 = 46/10 = 4,6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "23/50",
            10
          ]
        },
        "id": "decimal-multiply-15"
      },
      {
        "prompt": "Вычисли 4,6 · 0,1.",
        "answer": "23/50",
        "input": "number",
        "hint": "Одна десятая от числа меньше самого числа.",
        "explanation": "46/10 · 1/10 = 46/100 = 0,46.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "23/5",
            "1/10"
          ]
        },
        "id": "decimal-multiply-16"
      },
      {
        "prompt": "Сравни 4,6 · 0,8 и 4,6.",
        "answer": "Первое меньше",
        "input": "choice",
        "choices": [
          "Равны",
          "Первое больше",
          "Первое меньше"
        ],
        "hint": "Умножение положительного числа на долю единицы уменьшает его.",
        "explanation": "0 < 0,8 < 1, поэтому произведение меньше исходного положительного числа.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              "23/5",
              "4/5"
            ],
            "23/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "decimal-multiply-17"
      },
      {
        "prompt": "Прямоугольник имеет стороны 4,6 м и 0,8 м. Найди площадь в м².",
        "answer": "92/25",
        "input": "number",
        "hint": "Площадь прямоугольника — произведение его сторон.",
        "explanation": "S = 4,6 · 0,8 = 3,68 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "23/5",
            "4/5"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 4.6,
          "height": 0.8,
          "unit": "м"
        },
        "id": "decimal-multiply-18"
      }
    ]
  },
  {
    "id": "decimal-divide-natural",
    "group": "decimals",
    "title": "Дробь делим на натуральное число",
    "goal": "Делить десятичную дробь, сохраняя разряды, и проверять умножением.",
    "covers": [
      "oge-basics:multiplication-division/decimal-division-natural"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/course-whole-simple"
    ],
    "trainers": [
      {
        "title": "Деление дроби уголком",
        "href": "/trainers/oge-basics/multiplication-division/decimal-division-natural.html",
        "kind": "По шагам",
        "instruction": "Дели разряд за разрядом и поставь запятую, когда перейдёшь к дробной части.",
        "finish": "Реши 3 деления."
      },
      {
        "title": "Десятичное делимое",
        "href": "/trainers/oge-basics/multiplication-division/course-decimal-natural.html",
        "kind": "Другой способ",
        "instruction": "Отвечай на один вопрос записи деления за раз.",
        "finish": "Заверши 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 7,2 : 3.",
        "answer": "12/5",
        "input": "number",
        "hint": "Раздели количество десятых на делитель.",
        "explanation": "72 десятых : 3 = 24 десятых = 2,4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "36/5",
            3
          ]
        },
        "id": "decimal-divide-natural-01"
      },
      {
        "prompt": "Вычисли 0,72 : 3.",
        "answer": "6/25",
        "input": "number",
        "hint": "Сотые при делении остаются сотыми.",
        "explanation": "72/100 : 3 = 24/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "18/25",
            3
          ]
        },
        "id": "decimal-divide-natural-02"
      },
      {
        "prompt": "Найди □: □ · 3 = 7,2.",
        "answer": "12/5",
        "input": "number",
        "hint": "Деление обращает умножение.",
        "explanation": "□ = 7,2 : 3 = 2,4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "36/5",
            3
          ]
        },
        "id": "decimal-divide-natural-03"
      },
      {
        "prompt": "Как проверить ответ 2,4 в делении 7,2 : 3?",
        "answer": "Умножить 2,4 на 3",
        "input": "choice",
        "choices": [
          "Прибавить 3 к 2,4",
          "Разделить 2,4 на 3",
          "Умножить 2,4 на 3"
        ],
        "hint": "Проверка должна восстановить делимое.",
        "explanation": "2,4 · 3 = 7,2 — получено исходное делимое.",
        "oracle": {
          "kind": "choice-expression",
          "expr": "36/5",
          "values": [
            [
              "add",
              "12/5",
              3
            ],
            [
              "div",
              "12/5",
              3
            ],
            [
              "mul",
              "12/5",
              3
            ]
          ]
        },
        "id": "decimal-divide-natural-04"
      },
      {
        "prompt": "В 3 одинаковых бутылках вместе 7,2 л. Сколько литров в одной бутылке?",
        "answer": "12/5",
        "input": "number",
        "hint": "Общий объём раздели поровну.",
        "explanation": "7,2 : 3 = 2,4 л.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "36/5",
            3
          ]
        },
        "id": "decimal-divide-natural-05"
      },
      {
        "prompt": "При делении 10,2 : 3 получили 34. Исправь запятую в ответе.",
        "answer": "17/5",
        "input": "number",
        "hint": "Умножь предполагаемый ответ на делитель и сравни с делимым.",
        "explanation": "Верно 3,4, потому что 3,4 · 3 = 10,2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "51/5",
            3
          ]
        },
        "id": "decimal-divide-natural-06"
      },
      {
        "prompt": "Вычисли 14 : 4.",
        "answer": "7/2",
        "input": "number",
        "hint": "Раздели количество десятых на делитель.",
        "explanation": "140 десятых : 4 = 35 десятых = 3,5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "14",
            4
          ]
        },
        "id": "decimal-divide-natural-07"
      },
      {
        "prompt": "Вычисли 1,4 : 4.",
        "answer": "7/20",
        "input": "number",
        "hint": "Сотые при делении остаются сотыми.",
        "explanation": "140/100 : 4 = 35/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "7/5",
            4
          ]
        },
        "id": "decimal-divide-natural-08"
      },
      {
        "prompt": "Найди □: □ · 4 = 14.",
        "answer": "7/2",
        "input": "number",
        "hint": "Деление обращает умножение.",
        "explanation": "□ = 14 : 4 = 3,5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "14",
            4
          ]
        },
        "id": "decimal-divide-natural-09"
      },
      {
        "prompt": "Как проверить ответ 3,5 в делении 14 : 4?",
        "answer": "Умножить 3,5 на 4",
        "input": "choice",
        "choices": [
          "Прибавить 4 к 3,5",
          "Разделить 3,5 на 4",
          "Умножить 3,5 на 4"
        ],
        "hint": "Проверка должна восстановить делимое.",
        "explanation": "3,5 · 4 = 14 — получено исходное делимое.",
        "oracle": {
          "kind": "choice-expression",
          "expr": "14",
          "values": [
            [
              "add",
              "7/2",
              4
            ],
            [
              "div",
              "7/2",
              4
            ],
            [
              "mul",
              "7/2",
              4
            ]
          ]
        },
        "id": "decimal-divide-natural-10"
      },
      {
        "prompt": "В 4 одинаковых бутылках вместе 14 л. Сколько литров в одной бутылке?",
        "answer": "7/2",
        "input": "number",
        "hint": "Общий объём раздели поровну.",
        "explanation": "14 : 4 = 3,5 л.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "14",
            4
          ]
        },
        "id": "decimal-divide-natural-11"
      },
      {
        "prompt": "При делении 18 : 4 получили 45. Исправь запятую в ответе.",
        "answer": "9/2",
        "input": "number",
        "hint": "Умножь предполагаемый ответ на делитель и сравни с делимым.",
        "explanation": "Верно 4,5, потому что 4,5 · 4 = 18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "18",
            4
          ]
        },
        "id": "decimal-divide-natural-12"
      },
      {
        "prompt": "Вычисли 28,2 : 6.",
        "answer": "47/10",
        "input": "number",
        "hint": "Раздели количество десятых на делитель.",
        "explanation": "282 десятых : 6 = 47 десятых = 4,7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "141/5",
            6
          ]
        },
        "id": "decimal-divide-natural-13"
      },
      {
        "prompt": "Вычисли 2,82 : 6.",
        "answer": "47/100",
        "input": "number",
        "hint": "Сотые при делении остаются сотыми.",
        "explanation": "282/100 : 6 = 47/100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "141/50",
            6
          ]
        },
        "id": "decimal-divide-natural-14"
      },
      {
        "prompt": "Найди □: □ · 6 = 28,2.",
        "answer": "47/10",
        "input": "number",
        "hint": "Деление обращает умножение.",
        "explanation": "□ = 28,2 : 6 = 4,7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "141/5",
            6
          ]
        },
        "id": "decimal-divide-natural-15"
      },
      {
        "prompt": "Как проверить ответ 4,7 в делении 28,2 : 6?",
        "answer": "Умножить 4,7 на 6",
        "input": "choice",
        "choices": [
          "Прибавить 6 к 4,7",
          "Разделить 4,7 на 6",
          "Умножить 4,7 на 6"
        ],
        "hint": "Проверка должна восстановить делимое.",
        "explanation": "4,7 · 6 = 28,2 — получено исходное делимое.",
        "oracle": {
          "kind": "choice-expression",
          "expr": "141/5",
          "values": [
            [
              "add",
              "47/10",
              6
            ],
            [
              "div",
              "47/10",
              6
            ],
            [
              "mul",
              "47/10",
              6
            ]
          ]
        },
        "id": "decimal-divide-natural-16"
      },
      {
        "prompt": "В 6 одинаковых бутылках вместе 28,2 л. Сколько литров в одной бутылке?",
        "answer": "47/10",
        "input": "number",
        "hint": "Общий объём раздели поровну.",
        "explanation": "28,2 : 6 = 4,7 л.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "141/5",
            6
          ]
        },
        "id": "decimal-divide-natural-17"
      },
      {
        "prompt": "При делении 34,2 : 6 получили 57. Исправь запятую в ответе.",
        "answer": "57/10",
        "input": "number",
        "hint": "Умножь предполагаемый ответ на делитель и сравни с делимым.",
        "explanation": "Верно 5,7, потому что 5,7 · 6 = 34,2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "171/5",
            6
          ]
        },
        "id": "decimal-divide-natural-18"
      }
    ]
  },
  {
    "id": "decimal-append-zeros",
    "group": "decimals",
    "title": "Продолжаем делить после запятой",
    "goal": "Дописывать нули к дробной части и получать точный конечный ответ.",
    "covers": [
      "oge-basics:multiplication-division/division-append-zeros"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/decimal-division-natural"
    ],
    "trainers": [
      {
        "title": "Дописываем нули в делимом",
        "href": "/trainers/oge-basics/multiplication-division/division-append-zeros.html",
        "kind": "По шагам",
        "instruction": "Продолжай остаток в следующем десятичном разряде.",
        "finish": "Заверши 3 деления до нулевого остатка."
      },
      {
        "title": "От остатка к десятичной дроби",
        "href": "/trainers/oge-basics/multiplication-division/course-append-zeros.html",
        "kind": "Другой способ",
        "instruction": "Свяжи остаток с десятыми и сотыми.",
        "finish": "Реши 3 новых примера."
      }
    ],
    "questions": [
      {
        "prompt": "Раздели 3 на 8. Ответ запиши точной дробью или десятичным числом.",
        "answer": "3/8",
        "input": "number",
        "hint": "Можно записать делимое с запятой и дописывать нули справа.",
        "explanation": "3 : 8 = 3/8 = 0,375.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            8
          ]
        },
        "id": "decimal-append-zeros-01"
      },
      {
        "prompt": "Как продолжить деление 3 : 8, если целая часть закончилась, а остаток ненулевой?",
        "answer": "Записать запятую и дописать ноль к дробной части делимого",
        "input": "choice",
        "choices": [
          "Записать запятую и дописать ноль к дробной части делимого",
          "Умножить исходное делимое на 10",
          "Просто отбросить остаток"
        ],
        "hint": "Запись числа может измениться, а его величина должна сохраниться.",
        "explanation": "3 = 3,0 = 3,00. Дописывание дробных нулей сохраняет делимое.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 3,
          "values": [
            3,
            [
              "mul",
              3,
              10
            ],
            0
          ]
        },
        "id": "decimal-append-zeros-02"
      },
      {
        "prompt": "Вычисли 3 : 4.",
        "answer": "3/4",
        "input": "number",
        "hint": "Остаток можно выразить в десятых и сотых.",
        "explanation": "3/4 = 0,75; проверка — умножение на 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            4
          ]
        },
        "id": "decimal-append-zeros-03"
      },
      {
        "prompt": "Сколько десятых содержит остаток 1 целых перед продолжением деления?",
        "answer": "10",
        "input": "number",
        "hint": "Одна целая единица содержит десять десятых.",
        "explanation": "1 целых = 10 десятых.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            1,
            10
          ]
        },
        "id": "decimal-append-zeros-04"
      },
      {
        "prompt": "Ленту длиной 3 м разделили на 8 равных частей. Сколько метров в каждой?",
        "answer": "3/8",
        "input": "number",
        "hint": "Одна часть — общая длина, делённая на количество частей.",
        "explanation": "3 : 8 = 3/8 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            8
          ]
        },
        "id": "decimal-append-zeros-05"
      },
      {
        "prompt": "Проверь деление обратным действием: 0,375 · 8 = ?",
        "answer": "3",
        "input": "number",
        "hint": "Правильное частное при умножении на делитель возвращает делимое.",
        "explanation": "3/8 · 8 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "3/8",
            8
          ]
        },
        "id": "decimal-append-zeros-06"
      },
      {
        "prompt": "Раздели 5 на 16. Ответ запиши точной дробью или десятичным числом.",
        "answer": "5/16",
        "input": "number",
        "hint": "Можно записать делимое с запятой и дописывать нули справа.",
        "explanation": "5 : 16 = 5/16 = 0,3125.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            16
          ]
        },
        "id": "decimal-append-zeros-07"
      },
      {
        "prompt": "Как продолжить деление 5 : 16, если целая часть закончилась, а остаток ненулевой?",
        "answer": "Записать запятую и дописать ноль к дробной части делимого",
        "input": "choice",
        "choices": [
          "Записать запятую и дописать ноль к дробной части делимого",
          "Умножить исходное делимое на 10",
          "Просто отбросить остаток"
        ],
        "hint": "Запись числа может измениться, а его величина должна сохраниться.",
        "explanation": "5 = 5,0 = 5,00. Дописывание дробных нулей сохраняет делимое.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 5,
          "values": [
            5,
            [
              "mul",
              5,
              10
            ],
            0
          ]
        },
        "id": "decimal-append-zeros-08"
      },
      {
        "prompt": "Вычисли 5 : 4.",
        "answer": "5/4",
        "input": "number",
        "hint": "Остаток можно выразить в десятых и сотых.",
        "explanation": "5/4 = 1,25; проверка — умножение на 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            4
          ]
        },
        "id": "decimal-append-zeros-09"
      },
      {
        "prompt": "Сколько десятых содержит остаток 2 целых перед продолжением деления?",
        "answer": "20",
        "input": "number",
        "hint": "Одна целая единица содержит десять десятых.",
        "explanation": "2 целых = 20 десятых.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            10
          ]
        },
        "id": "decimal-append-zeros-10"
      },
      {
        "prompt": "Ленту длиной 5 м разделили на 16 равных частей. Сколько метров в каждой?",
        "answer": "5/16",
        "input": "number",
        "hint": "Одна часть — общая длина, делённая на количество частей.",
        "explanation": "5 : 16 = 5/16 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            16
          ]
        },
        "id": "decimal-append-zeros-11"
      },
      {
        "prompt": "Проверь деление обратным действием: 0,3125 · 16 = ?",
        "answer": "5",
        "input": "number",
        "hint": "Правильное частное при умножении на делитель возвращает делимое.",
        "explanation": "5/16 · 16 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "5/16",
            16
          ]
        },
        "id": "decimal-append-zeros-12"
      },
      {
        "prompt": "Раздели 7 на 20. Ответ запиши точной дробью или десятичным числом.",
        "answer": "7/20",
        "input": "number",
        "hint": "Можно записать делимое с запятой и дописывать нули справа.",
        "explanation": "7 : 20 = 7/20 = 0,35.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            7,
            20
          ]
        },
        "id": "decimal-append-zeros-13"
      },
      {
        "prompt": "Как продолжить деление 7 : 20, если целая часть закончилась, а остаток ненулевой?",
        "answer": "Записать запятую и дописать ноль к дробной части делимого",
        "input": "choice",
        "choices": [
          "Записать запятую и дописать ноль к дробной части делимого",
          "Умножить исходное делимое на 10",
          "Просто отбросить остаток"
        ],
        "hint": "Запись числа может измениться, а его величина должна сохраниться.",
        "explanation": "7 = 7,0 = 7,00. Дописывание дробных нулей сохраняет делимое.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 7,
          "values": [
            7,
            [
              "mul",
              7,
              10
            ],
            0
          ]
        },
        "id": "decimal-append-zeros-14"
      },
      {
        "prompt": "Вычисли 7 : 4.",
        "answer": "7/4",
        "input": "number",
        "hint": "Остаток можно выразить в десятых и сотых.",
        "explanation": "7/4 = 1,75; проверка — умножение на 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            7,
            4
          ]
        },
        "id": "decimal-append-zeros-15"
      },
      {
        "prompt": "Сколько десятых содержит остаток 3 целых перед продолжением деления?",
        "answer": "30",
        "input": "number",
        "hint": "Одна целая единица содержит десять десятых.",
        "explanation": "3 целых = 30 десятых.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            10
          ]
        },
        "id": "decimal-append-zeros-16"
      },
      {
        "prompt": "Ленту длиной 7 м разделили на 20 равных частей. Сколько метров в каждой?",
        "answer": "7/20",
        "input": "number",
        "hint": "Одна часть — общая длина, делённая на количество частей.",
        "explanation": "7 : 20 = 7/20 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            7,
            20
          ]
        },
        "id": "decimal-append-zeros-17"
      },
      {
        "prompt": "Проверь деление обратным действием: 0,35 · 20 = ?",
        "answer": "7",
        "input": "number",
        "hint": "Правильное частное при умножении на делитель возвращает делимое.",
        "explanation": "7/20 · 20 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "7/20",
            20
          ]
        },
        "id": "decimal-append-zeros-18"
      }
    ]
  },
  {
    "id": "decimal-divisor-scale",
    "group": "decimals",
    "title": "Делитель без запятой",
    "goal": "Умножать делимое и делитель на одно число и понимать неизменность частного.",
    "covers": [
      "oge-basics:multiplication-division/decimal-divisor-shift",
      "path:grade7-b-decimal-divisor-scale",
      "public:decimal-linked"
    ],
    "prerequisites": [
      "public:v5-decimal-multiply",
      "oge-basics:multiplication-division/decimal-division-natural"
    ],
    "trainers": [
      {
        "title": "Две запятые передвигаем вместе",
        "href": "/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html",
        "kind": "Модель",
        "instruction": "Увеличь оба числа одинаково, чтобы делитель стал целым.",
        "finish": "Преобразуй 3 пары."
      },
      {
        "title": "Делитель без запятой",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-decimal-divisor-scale",
        "kind": "По шагам",
        "instruction": "Сначала назови множитель для обоих чисел, затем раздели.",
        "finish": "Реши 3 деления."
      },
      {
        "title": "Связанные разряды",
        "href": "/trainers/arifmetika.html?course=preoge&level=n5f",
        "kind": "Другой способ",
        "instruction": "Наблюдай, как одинаково меняются оба числа.",
        "finish": "Выполни 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 4,2 : 0,6.",
        "answer": "7",
        "input": "number",
        "hint": "Умножь делимое и делитель на десять.",
        "explanation": "4,2 : 0,6 = 42 : 6 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "21/5",
            "3/5"
          ]
        },
        "id": "decimal-divisor-scale-01"
      },
      {
        "prompt": "Вычисли 0,42 : 0,06.",
        "answer": "7",
        "input": "number",
        "hint": "Оба числа можно увеличить в сто раз.",
        "explanation": "42/100 : (6/100) = 42 : 6 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "21/50",
            "3/50"
          ]
        },
        "id": "decimal-divisor-scale-02"
      },
      {
        "prompt": "Какое деление равно 4,2 : 0,6?",
        "answer": "42 : 6",
        "input": "choice",
        "choices": [
          "42 : 0,6",
          "42 : 6",
          "4,2 : 6"
        ],
        "hint": "Меняй оба числа одним множителем.",
        "explanation": "Оба числа умножены на 10: частное сохранилось.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "21/5",
            "3/5"
          ],
          "values": [
            [
              "div",
              42,
              "3/5"
            ],
            [
              "div",
              42,
              6
            ],
            [
              "div",
              "21/5",
              6
            ]
          ]
        },
        "id": "decimal-divisor-scale-03"
      },
      {
        "prompt": "После увеличения делителя 0,06 в 100 раз каким станет делимое 0,42?",
        "answer": "42",
        "input": "number",
        "hint": "Делимое нужно увеличить тем же множителем.",
        "explanation": "42/100 · 100 = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "21/50",
            100
          ]
        },
        "id": "decimal-divisor-scale-04"
      },
      {
        "prompt": "Ученик в 4,2 : 0,6 изменил только делитель и получил 0,7. Запиши правильное частное.",
        "answer": "7",
        "input": "number",
        "hint": "Проверь, изменились ли оба числа одинаково.",
        "explanation": "Нужно увеличить оба числа: 42 : 6 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "21/5",
            "3/5"
          ]
        },
        "id": "decimal-divisor-scale-05"
      },
      {
        "prompt": "Одна порция весит 0,6 кг. Сколько порций получится из 4,2 кг?",
        "answer": "7",
        "input": "number",
        "hint": "Количество порций равно общему весу, делённому на вес одной.",
        "explanation": "4,2 : 0,6 = 7 порций.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "21/5",
            "3/5"
          ]
        },
        "id": "decimal-divisor-scale-06"
      },
      {
        "prompt": "Вычисли 7,2 : 0,8.",
        "answer": "9",
        "input": "number",
        "hint": "Умножь делимое и делитель на десять.",
        "explanation": "7,2 : 0,8 = 72 : 8 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "36/5",
            "4/5"
          ]
        },
        "id": "decimal-divisor-scale-07"
      },
      {
        "prompt": "Вычисли 0,72 : 0,08.",
        "answer": "9",
        "input": "number",
        "hint": "Оба числа можно увеличить в сто раз.",
        "explanation": "72/100 : (8/100) = 72 : 8 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "18/25",
            "2/25"
          ]
        },
        "id": "decimal-divisor-scale-08"
      },
      {
        "prompt": "Какое деление равно 7,2 : 0,8?",
        "answer": "72 : 8",
        "input": "choice",
        "choices": [
          "72 : 0,8",
          "72 : 8",
          "7,2 : 8"
        ],
        "hint": "Меняй оба числа одним множителем.",
        "explanation": "Оба числа умножены на 10: частное сохранилось.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "36/5",
            "4/5"
          ],
          "values": [
            [
              "div",
              72,
              "4/5"
            ],
            [
              "div",
              72,
              8
            ],
            [
              "div",
              "36/5",
              8
            ]
          ]
        },
        "id": "decimal-divisor-scale-09"
      },
      {
        "prompt": "После увеличения делителя 0,08 в 100 раз каким станет делимое 0,72?",
        "answer": "72",
        "input": "number",
        "hint": "Делимое нужно увеличить тем же множителем.",
        "explanation": "72/100 · 100 = 72.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "18/25",
            100
          ]
        },
        "id": "decimal-divisor-scale-10"
      },
      {
        "prompt": "Ученик в 7,2 : 0,8 изменил только делитель и получил 0,9. Запиши правильное частное.",
        "answer": "9",
        "input": "number",
        "hint": "Проверь, изменились ли оба числа одинаково.",
        "explanation": "Нужно увеличить оба числа: 72 : 8 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "36/5",
            "4/5"
          ]
        },
        "id": "decimal-divisor-scale-11"
      },
      {
        "prompt": "Одна порция весит 0,8 кг. Сколько порций получится из 7,2 кг?",
        "answer": "9",
        "input": "number",
        "hint": "Количество порций равно общему весу, делённому на вес одной.",
        "explanation": "7,2 : 0,8 = 9 порций.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "36/5",
            "4/5"
          ]
        },
        "id": "decimal-divisor-scale-12"
      },
      {
        "prompt": "Вычисли 13,2 : 1,2.",
        "answer": "11",
        "input": "number",
        "hint": "Умножь делимое и делитель на десять.",
        "explanation": "13,2 : 1,2 = 132 : 12 = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "66/5",
            "6/5"
          ]
        },
        "id": "decimal-divisor-scale-13"
      },
      {
        "prompt": "Вычисли 1,32 : 0,12.",
        "answer": "11",
        "input": "number",
        "hint": "Оба числа можно увеличить в сто раз.",
        "explanation": "132/100 : (12/100) = 132 : 12 = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "33/25",
            "3/25"
          ]
        },
        "id": "decimal-divisor-scale-14"
      },
      {
        "prompt": "Какое деление равно 13,2 : 1,2?",
        "answer": "132 : 12",
        "input": "choice",
        "choices": [
          "132 : 1,2",
          "132 : 12",
          "13,2 : 12"
        ],
        "hint": "Меняй оба числа одним множителем.",
        "explanation": "Оба числа умножены на 10: частное сохранилось.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "66/5",
            "6/5"
          ],
          "values": [
            [
              "div",
              132,
              "6/5"
            ],
            [
              "div",
              132,
              12
            ],
            [
              "div",
              "66/5",
              12
            ]
          ]
        },
        "id": "decimal-divisor-scale-15"
      },
      {
        "prompt": "После увеличения делителя 0,12 в 100 раз каким станет делимое 1,32?",
        "answer": "132",
        "input": "number",
        "hint": "Делимое нужно увеличить тем же множителем.",
        "explanation": "132/100 · 100 = 132.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "33/25",
            100
          ]
        },
        "id": "decimal-divisor-scale-16"
      },
      {
        "prompt": "Ученик в 13,2 : 1,2 изменил только делитель и получил 1,1. Запиши правильное частное.",
        "answer": "11",
        "input": "number",
        "hint": "Проверь, изменились ли оба числа одинаково.",
        "explanation": "Нужно увеличить оба числа: 132 : 12 = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "66/5",
            "6/5"
          ]
        },
        "id": "decimal-divisor-scale-17"
      },
      {
        "prompt": "Одна порция весит 1,2 кг. Сколько порций получится из 13,2 кг?",
        "answer": "11",
        "input": "number",
        "hint": "Количество порций равно общему весу, делённому на вес одной.",
        "explanation": "13,2 : 1,2 = 11 порций.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "66/5",
            "6/5"
          ]
        },
        "id": "decimal-divisor-scale-18"
      }
    ]
  },
  {
    "id": "fraction-meaning",
    "group": "fractions",
    "title": "Часть и целое на рисунке",
    "goal": "Различать число равных частей и количество выбранных частей.",
    "covers": [
      "oge-basics:fraction-meaning"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/multiplication-meaning"
    ],
    "trainers": [
      {
        "title": "Дробь на рисунке",
        "href": "/trainers/oge-basics/fraction-meaning.html",
        "kind": "Модель",
        "instruction": "Сначала посчитай все равные части, затем выбранные.",
        "finish": "Прочитай 4 рисунка."
      },
      {
        "title": "Часть, целое и доля",
        "href": "/trainers/fractions-part-whole-assignment.html",
        "kind": "Другой способ",
        "instruction": "Сопоставь рисунок и дробь с текстом задачи.",
        "finish": "Реши 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "На рисунке 8 равных частей. Какую долю прямоугольника закрасили?",
        "answer": "3/8",
        "input": "number",
        "hint": "Знаменатель считает все равные части, числитель — выбранные.",
        "explanation": "Всего 8 равных частей, закрашено 3. Доля равна 3/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            8
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 8,
          "shaded": 3
        },
        "id": "fraction-meaning-01"
      },
      {
        "prompt": "В записи 3/8 какое число показывает, на сколько равных частей разделили целое?",
        "answer": "8",
        "input": "number",
        "hint": "Это знаменатель, он записан под чертой.",
        "explanation": "Целое разделено на 8 равных частей.",
        "oracle": {
          "kind": "expression",
          "expr": 8
        },
        "id": "fraction-meaning-02"
      },
      {
        "prompt": "На рисунке из 8 частей какая доля осталась незакрашенной?",
        "answer": "5/8",
        "input": "number",
        "hint": "Из всех частей вычти закрашенные.",
        "explanation": "Незакрашено 8 − 3 = 5 частей из 8: 5/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            [
              "div",
              3,
              8
            ]
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 8,
          "shaded": 3
        },
        "id": "fraction-meaning-03"
      },
      {
        "prompt": "Весь пирог разделили на 8 равных частей. Взяли 4 части. Какая доля пирога взята?",
        "answer": "1/2",
        "input": "number",
        "hint": "Одна часть — одна доля; знаменатель не меняется.",
        "explanation": "Взято 4 из 8 равных частей: 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            4,
            8
          ]
        },
        "id": "fraction-meaning-04"
      },
      {
        "prompt": "Сравни 3/8 и половину целого.",
        "answer": "Меньше половины",
        "input": "choice",
        "choices": [
          "Больше половины",
          "Меньше половины",
          "Ровно половина"
        ],
        "hint": "Проверь, достаточно ли удвоенного числителя для целого.",
        "explanation": "3 · 2 = 6 < 8, поэтому 3/8 < 1/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "3/8",
            "1/2"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 8,
          "shaded": 3
        },
        "id": "fraction-meaning-05"
      },
      {
        "prompt": "Одна полоска составляет 1/8 целого. Сколько таких полосок нужно для двух целых?",
        "answer": "16",
        "input": "number",
        "hint": "На одно целое нужно столько долей, сколько указано в знаменателе.",
        "explanation": "Для одного целого нужно 8 полосок, для двух — 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            "1/8"
          ]
        },
        "id": "fraction-meaning-06"
      },
      {
        "prompt": "На рисунке 10 равных частей. Какую долю прямоугольника закрасили?",
        "answer": "2/5",
        "input": "number",
        "hint": "Знаменатель считает все равные части, числитель — выбранные.",
        "explanation": "Всего 10 равных частей, закрашено 4. Доля равна 4/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            4,
            10
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 10,
          "shaded": 4
        },
        "id": "fraction-meaning-07"
      },
      {
        "prompt": "В записи 4/10 какое число показывает, на сколько равных частей разделили целое?",
        "answer": "10",
        "input": "number",
        "hint": "Это знаменатель, он записан под чертой.",
        "explanation": "Целое разделено на 10 равных частей.",
        "oracle": {
          "kind": "expression",
          "expr": 10
        },
        "id": "fraction-meaning-08"
      },
      {
        "prompt": "На рисунке из 10 частей какая доля осталась незакрашенной?",
        "answer": "3/5",
        "input": "number",
        "hint": "Из всех частей вычти закрашенные.",
        "explanation": "Незакрашено 10 − 4 = 6 частей из 10: 3/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            [
              "div",
              4,
              10
            ]
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 10,
          "shaded": 4
        },
        "id": "fraction-meaning-09"
      },
      {
        "prompt": "Весь пирог разделили на 10 равных частей. Взяли 5 частей. Какая доля пирога взята?",
        "answer": "1/2",
        "input": "number",
        "hint": "Одна часть — одна доля; знаменатель не меняется.",
        "explanation": "Взято 5 из 10 равных частей: 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            10
          ]
        },
        "id": "fraction-meaning-10"
      },
      {
        "prompt": "Сравни 4/10 и половину целого.",
        "answer": "Меньше половины",
        "input": "choice",
        "choices": [
          "Больше половины",
          "Меньше половины",
          "Ровно половина"
        ],
        "hint": "Проверь, достаточно ли удвоенного числителя для целого.",
        "explanation": "4 · 2 = 8 < 10, поэтому 4/10 < 1/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "2/5",
            "1/2"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 10,
          "shaded": 4
        },
        "id": "fraction-meaning-11"
      },
      {
        "prompt": "Одна полоска составляет 1/10 целого. Сколько таких полосок нужно для двух целых?",
        "answer": "20",
        "input": "number",
        "hint": "На одно целое нужно столько долей, сколько указано в знаменателе.",
        "explanation": "Для одного целого нужно 10 полосок, для двух — 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            "1/10"
          ]
        },
        "id": "fraction-meaning-12"
      },
      {
        "prompt": "На рисунке 12 равных частей. Какую долю прямоугольника закрасили?",
        "answer": "5/12",
        "input": "number",
        "hint": "Знаменатель считает все равные части, числитель — выбранные.",
        "explanation": "Всего 12 равных частей, закрашено 5. Доля равна 5/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            12
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 12,
          "shaded": 5
        },
        "id": "fraction-meaning-13"
      },
      {
        "prompt": "В записи 5/12 какое число показывает, на сколько равных частей разделили целое?",
        "answer": "12",
        "input": "number",
        "hint": "Это знаменатель, он записан под чертой.",
        "explanation": "Целое разделено на 12 равных частей.",
        "oracle": {
          "kind": "expression",
          "expr": 12
        },
        "id": "fraction-meaning-14"
      },
      {
        "prompt": "На рисунке из 12 частей какая доля осталась незакрашенной?",
        "answer": "7/12",
        "input": "number",
        "hint": "Из всех частей вычти закрашенные.",
        "explanation": "Незакрашено 12 − 5 = 7 частей из 12: 7/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            [
              "div",
              5,
              12
            ]
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 12,
          "shaded": 5
        },
        "id": "fraction-meaning-15"
      },
      {
        "prompt": "Весь пирог разделили на 12 равных частей. Взяли 6 частей. Какая доля пирога взята?",
        "answer": "1/2",
        "input": "number",
        "hint": "Одна часть — одна доля; знаменатель не меняется.",
        "explanation": "Взято 6 из 12 равных частей: 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            6,
            12
          ]
        },
        "id": "fraction-meaning-16"
      },
      {
        "prompt": "Сравни 5/12 и половину целого.",
        "answer": "Меньше половины",
        "input": "choice",
        "choices": [
          "Больше половины",
          "Меньше половины",
          "Ровно половина"
        ],
        "hint": "Проверь, достаточно ли удвоенного числителя для целого.",
        "explanation": "5 · 2 = 10 < 12, поэтому 5/12 < 1/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "5/12",
            "1/2"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 12,
          "shaded": 5
        },
        "id": "fraction-meaning-17"
      },
      {
        "prompt": "Одна полоска составляет 1/12 целого. Сколько таких полосок нужно для двух целых?",
        "answer": "24",
        "input": "number",
        "hint": "На одно целое нужно столько долей, сколько указано в знаменателе.",
        "explanation": "Для одного целого нужно 12 полосок, для двух — 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            "1/12"
          ]
        },
        "id": "fraction-meaning-18"
      }
    ]
  },
  {
    "id": "fraction-number-line",
    "group": "fractions",
    "title": "Дроби на числовом луче",
    "goal": "Читать дробную координату и расстояние на луче.",
    "covers": [
      "path:pre7-fraction-line"
    ],
    "prerequisites": [
      "oge-basics:fraction-meaning"
    ],
    "trainers": [
      {
        "title": "Дробные координаты",
        "href": "/ege-baza/path/index.html#lesson=pre7-fraction-line",
        "kind": "Модель",
        "instruction": "Сначала определи цену одного промежутка от 0 до 1.",
        "finish": "Найди 4 координаты."
      },
      {
        "title": "Показываем доли",
        "href": "/trainers/arifmetika.html?course=preoge&level=f4a",
        "kind": "Другой способ",
        "instruction": "Сравни долю отрезка с долей целого на рисунке.",
        "finish": "Выполни 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Отрезок от 0 до 1 разделён на 4 равных промежутка. Точка A стоит на 3-й отметке после нуля. Найди её координату.",
        "answer": "3/4",
        "input": "number",
        "hint": "Один промежуток составляет одну долю единичного отрезка.",
        "explanation": "Цена промежутка 1/4; координата A равна 3/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            "1/4"
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 1,
          "step": 0.25,
          "points": [
            {
              "value": 0.75,
              "label": "A"
            }
          ]
        },
        "id": "fraction-number-line-01"
      },
      {
        "prompt": "Сколько нужно прибавить к 3/4, чтобы получить 1?",
        "answer": "1/4",
        "input": "number",
        "hint": "Представь единицу дробью с тем же знаменателем.",
        "explanation": "1 − 3/4 = 4/4 − 3/4 = 1/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "3/4"
          ]
        },
        "id": "fraction-number-line-02"
      },
      {
        "prompt": "На луче от 1 прошли вправо ещё 1/4. Где остановились?",
        "answer": "5/4",
        "input": "number",
        "hint": "К одному целому прибавь пройденную долю.",
        "explanation": "1 + 1/4 = 5/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            "1/4"
          ]
        },
        "id": "fraction-number-line-03"
      },
      {
        "prompt": "По какую сторону от 1 находится число 6/4?",
        "answer": "Справа от 1",
        "input": "choice",
        "choices": [
          "Справа от 1",
          "Слева от 1",
          "В точке 1"
        ],
        "hint": "Сравни числитель и знаменатель.",
        "explanation": "6/4 = 1 + 2/4, поэтому точка справа от 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "3/2",
            1
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-number-line-04"
      },
      {
        "prompt": "Найди расстояние между точками 1/4 и 3/4.",
        "answer": "1/2",
        "input": "number",
        "hint": "Расстояние — разность большей и меньшей координаты.",
        "explanation": "3/4 − 1/4 = 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "3/4",
            "1/4"
          ]
        },
        "id": "fraction-number-line-05"
      },
      {
        "prompt": "Между 0 и 2 отмечено 8 равных промежутков. Какова цена одного промежутка?",
        "answer": "1/4",
        "input": "number",
        "hint": "Раздели длину всего отрезка на число промежутков.",
        "explanation": "2 : 8 = 1/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            8
          ]
        },
        "id": "fraction-number-line-06"
      },
      {
        "prompt": "Отрезок от 0 до 1 разделён на 5 равных промежутков. Точка A стоит на 2-й отметке после нуля. Найди её координату.",
        "answer": "2/5",
        "input": "number",
        "hint": "Один промежуток составляет одну долю единичного отрезка.",
        "explanation": "Цена промежутка 1/5; координата A равна 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            "1/5"
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 1,
          "step": 0.2,
          "points": [
            {
              "value": 0.4,
              "label": "A"
            }
          ]
        },
        "id": "fraction-number-line-07"
      },
      {
        "prompt": "Сколько нужно прибавить к 2/5, чтобы получить 1?",
        "answer": "3/5",
        "input": "number",
        "hint": "Представь единицу дробью с тем же знаменателем.",
        "explanation": "1 − 2/5 = 5/5 − 2/5 = 3/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "2/5"
          ]
        },
        "id": "fraction-number-line-08"
      },
      {
        "prompt": "На луче от 1 прошли вправо ещё 2/5. Где остановились?",
        "answer": "7/5",
        "input": "number",
        "hint": "К одному целому прибавь пройденную долю.",
        "explanation": "1 + 2/5 = 7/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            "2/5"
          ]
        },
        "id": "fraction-number-line-09"
      },
      {
        "prompt": "По какую сторону от 1 находится число 7/5?",
        "answer": "Справа от 1",
        "input": "choice",
        "choices": [
          "Справа от 1",
          "Слева от 1",
          "В точке 1"
        ],
        "hint": "Сравни числитель и знаменатель.",
        "explanation": "7/5 = 1 + 2/5, поэтому точка справа от 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "7/5",
            1
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-number-line-10"
      },
      {
        "prompt": "Найди расстояние между точками 1/5 и 2/5.",
        "answer": "1/5",
        "input": "number",
        "hint": "Расстояние — разность большей и меньшей координаты.",
        "explanation": "2/5 − 1/5 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "2/5",
            "1/5"
          ]
        },
        "id": "fraction-number-line-11"
      },
      {
        "prompt": "Между 0 и 2 отмечено 10 равных промежутков. Какова цена одного промежутка?",
        "answer": "1/5",
        "input": "number",
        "hint": "Раздели длину всего отрезка на число промежутков.",
        "explanation": "2 : 10 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            10
          ]
        },
        "id": "fraction-number-line-12"
      },
      {
        "prompt": "Отрезок от 0 до 1 разделён на 6 равных промежутков. Точка A стоит на 5-й отметке после нуля. Найди её координату.",
        "answer": "5/6",
        "input": "number",
        "hint": "Один промежуток составляет одну долю единичного отрезка.",
        "explanation": "Цена промежутка 1/6; координата A равна 5/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            "1/6"
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 1,
          "step": 0.16666666666666666,
          "points": [
            {
              "value": 0.8333333333333334,
              "label": "A"
            }
          ]
        },
        "id": "fraction-number-line-13"
      },
      {
        "prompt": "Сколько нужно прибавить к 5/6, чтобы получить 1?",
        "answer": "1/6",
        "input": "number",
        "hint": "Представь единицу дробью с тем же знаменателем.",
        "explanation": "1 − 5/6 = 6/6 − 5/6 = 1/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "5/6"
          ]
        },
        "id": "fraction-number-line-14"
      },
      {
        "prompt": "На луче от 1 прошли вправо ещё 3/6. Где остановились?",
        "answer": "3/2",
        "input": "number",
        "hint": "К одному целому прибавь пройденную долю.",
        "explanation": "1 + 3/6 = 9/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            "1/2"
          ]
        },
        "id": "fraction-number-line-15"
      },
      {
        "prompt": "По какую сторону от 1 находится число 8/6?",
        "answer": "Справа от 1",
        "input": "choice",
        "choices": [
          "Справа от 1",
          "Слева от 1",
          "В точке 1"
        ],
        "hint": "Сравни числитель и знаменатель.",
        "explanation": "8/6 = 1 + 2/6, поэтому точка справа от 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "4/3",
            1
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-number-line-16"
      },
      {
        "prompt": "Найди расстояние между точками 1/6 и 5/6.",
        "answer": "2/3",
        "input": "number",
        "hint": "Расстояние — разность большей и меньшей координаты.",
        "explanation": "5/6 − 1/6 = 2/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "5/6",
            "1/6"
          ]
        },
        "id": "fraction-number-line-17"
      },
      {
        "prompt": "Между 0 и 2 отмечено 12 равных промежутков. Какова цена одного промежутка?",
        "answer": "1/6",
        "input": "number",
        "hint": "Раздели длину всего отрезка на число промежутков.",
        "explanation": "2 : 12 = 1/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            12
          ]
        },
        "id": "fraction-number-line-18"
      }
    ]
  },
  {
    "id": "fraction-equivalent",
    "group": "fractions",
    "title": "Равные дроби и сокращение",
    "goal": "Изменять числитель и знаменатель одним множителем и сохранять величину.",
    "covers": [
      "path:pre7-equivalent-fractions"
    ],
    "prerequisites": [
      "oge-basics:fraction-meaning",
      "path:pre7-divisibility"
    ],
    "trainers": [
      {
        "title": "Равные записи дроби",
        "href": "/ege-baza/path/index.html#lesson=pre7-equivalent-fractions",
        "kind": "По шагам",
        "instruction": "Умножай или дели оба числа дроби на одно и то же ненулевое число.",
        "finish": "Выполни 4 преобразования."
      },
      {
        "title": "Сокращаем дробь",
        "href": "/trainers/arifmetika.html?course=preoge&level=f6e",
        "kind": "Практика",
        "instruction": "Ищи общий делитель числителя и знаменателя.",
        "finish": "Сократи 4 дроби."
      }
    ],
    "questions": [
      {
        "prompt": "Сократи дробь 6/15.",
        "answer": "2/5",
        "input": "number",
        "hint": "Найди число, на которое делятся оба числа дроби.",
        "explanation": "Делим числитель и знаменатель на 3: 6/15 = 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            6,
            15
          ]
        },
        "id": "fraction-equivalent-01",
        "answerFormat": "fraction",
        "requireReduced": true
      },
      {
        "prompt": "Заполни числитель: 2/5 = □/15.",
        "answer": "6",
        "input": "number",
        "hint": "Во сколько увеличили знаменатель, во столько увеличивается числитель.",
        "explanation": "Знаменатель умножили на 3; числитель: 2 · 3 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "div",
              15,
              5
            ]
          ]
        },
        "id": "fraction-equivalent-02"
      },
      {
        "prompt": "Заполни знаменатель: 2/5 = 6/□.",
        "answer": "15",
        "input": "number",
        "hint": "У дроби оба числа изменяются одинаково.",
        "explanation": "Числитель умножили на 3; знаменатель равен 5 · 3 = 15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            [
              "div",
              6,
              2
            ]
          ]
        },
        "id": "fraction-equivalent-03"
      },
      {
        "prompt": "Какая дробь равна 2/5?",
        "answer": "4/10",
        "input": "choice",
        "choices": [
          "4/10",
          "4/7",
          "4/5"
        ],
        "hint": "Прибавление одного числа сверху и снизу обычно меняет дробь.",
        "explanation": "4/10 получена умножением числителя и знаменателя на 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            2,
            5
          ],
          "values": [
            "2/5",
            "4/7",
            "4/5"
          ]
        },
        "id": "fraction-equivalent-04"
      },
      {
        "prompt": "Ученик сократил 4/10 только сверху и получил 2/10. Запиши правильную сокращённую дробь.",
        "answer": "2/5",
        "input": "number",
        "hint": "Делить нужно и числитель, и знаменатель.",
        "explanation": "4/10 = (4:2)/(10:2) = 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            4,
            10
          ]
        },
        "id": "fraction-equivalent-05",
        "answerFormat": "fraction",
        "requireReduced": true
      },
      {
        "prompt": "В 15 равных клетках закрашено 6. Какую долю рисунка закрасили?",
        "answer": "2/5",
        "input": "number",
        "hint": "Доля сохраняется, если объединить одинаковое число клеток в группы.",
        "explanation": "6/15 = 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            6,
            15
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 15,
          "shaded": 6
        },
        "id": "fraction-equivalent-06"
      },
      {
        "prompt": "Сократи дробь 12/28.",
        "answer": "3/7",
        "input": "number",
        "hint": "Найди число, на которое делятся оба числа дроби.",
        "explanation": "Делим числитель и знаменатель на 4: 12/28 = 3/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            28
          ]
        },
        "id": "fraction-equivalent-07",
        "answerFormat": "fraction",
        "requireReduced": true
      },
      {
        "prompt": "Заполни числитель: 3/7 = □/28.",
        "answer": "12",
        "input": "number",
        "hint": "Во сколько увеличили знаменатель, во столько увеличивается числитель.",
        "explanation": "Знаменатель умножили на 4; числитель: 3 · 4 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "div",
              28,
              7
            ]
          ]
        },
        "id": "fraction-equivalent-08"
      },
      {
        "prompt": "Заполни знаменатель: 3/7 = 12/□.",
        "answer": "28",
        "input": "number",
        "hint": "У дроби оба числа изменяются одинаково.",
        "explanation": "Числитель умножили на 4; знаменатель равен 7 · 4 = 28.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7,
            [
              "div",
              12,
              3
            ]
          ]
        },
        "id": "fraction-equivalent-09"
      },
      {
        "prompt": "Какая дробь равна 3/7?",
        "answer": "6/14",
        "input": "choice",
        "choices": [
          "6/14",
          "5/9",
          "6/7"
        ],
        "hint": "Прибавление одного числа сверху и снизу обычно меняет дробь.",
        "explanation": "6/14 получена умножением числителя и знаменателя на 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            3,
            7
          ],
          "values": [
            "3/7",
            "5/9",
            "6/7"
          ]
        },
        "id": "fraction-equivalent-10"
      },
      {
        "prompt": "Ученик сократил 6/14 только сверху и получил 3/14. Запиши правильную сокращённую дробь.",
        "answer": "3/7",
        "input": "number",
        "hint": "Делить нужно и числитель, и знаменатель.",
        "explanation": "6/14 = (6:2)/(14:2) = 3/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            6,
            14
          ]
        },
        "id": "fraction-equivalent-11",
        "answerFormat": "fraction",
        "requireReduced": true
      },
      {
        "prompt": "В 28 равных клетках закрашено 12. Какую долю рисунка закрасили?",
        "answer": "3/7",
        "input": "number",
        "hint": "Доля сохраняется, если объединить одинаковое число клеток в группы.",
        "explanation": "12/28 = 3/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            28
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 28,
          "shaded": 12
        },
        "id": "fraction-equivalent-12"
      },
      {
        "prompt": "Сократи дробь 20/45.",
        "answer": "4/9",
        "input": "number",
        "hint": "Найди число, на которое делятся оба числа дроби.",
        "explanation": "Делим числитель и знаменатель на 5: 20/45 = 4/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            20,
            45
          ]
        },
        "id": "fraction-equivalent-13",
        "answerFormat": "fraction",
        "requireReduced": true
      },
      {
        "prompt": "Заполни числитель: 4/9 = □/45.",
        "answer": "20",
        "input": "number",
        "hint": "Во сколько увеличили знаменатель, во столько увеличивается числитель.",
        "explanation": "Знаменатель умножили на 5; числитель: 4 · 5 = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            [
              "div",
              45,
              9
            ]
          ]
        },
        "id": "fraction-equivalent-14"
      },
      {
        "prompt": "Заполни знаменатель: 4/9 = 20/□.",
        "answer": "45",
        "input": "number",
        "hint": "У дроби оба числа изменяются одинаково.",
        "explanation": "Числитель умножили на 5; знаменатель равен 9 · 5 = 45.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            9,
            [
              "div",
              20,
              4
            ]
          ]
        },
        "id": "fraction-equivalent-15"
      },
      {
        "prompt": "Какая дробь равна 4/9?",
        "answer": "8/18",
        "input": "choice",
        "choices": [
          "8/18",
          "6/11",
          "8/9"
        ],
        "hint": "Прибавление одного числа сверху и снизу обычно меняет дробь.",
        "explanation": "8/18 получена умножением числителя и знаменателя на 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            4,
            9
          ],
          "values": [
            "4/9",
            "6/11",
            "8/9"
          ]
        },
        "id": "fraction-equivalent-16"
      },
      {
        "prompt": "Ученик сократил 8/18 только сверху и получил 4/18. Запиши правильную сокращённую дробь.",
        "answer": "4/9",
        "input": "number",
        "hint": "Делить нужно и числитель, и знаменатель.",
        "explanation": "8/18 = (8:2)/(18:2) = 4/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            8,
            18
          ]
        },
        "id": "fraction-equivalent-17",
        "answerFormat": "fraction",
        "requireReduced": true
      },
      {
        "prompt": "В 45 равных клетках закрашено 20. Какую долю рисунка закрасили?",
        "answer": "4/9",
        "input": "number",
        "hint": "Доля сохраняется, если объединить одинаковое число клеток в группы.",
        "explanation": "20/45 = 4/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            20,
            45
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 45,
          "shaded": 20
        },
        "id": "fraction-equivalent-18"
      }
    ]
  },
  {
    "id": "fraction-compare",
    "group": "fractions",
    "title": "Сравниваем дроби",
    "goal": "Выбирать сравнение по смыслу долей или общему знаменателю.",
    "covers": [
      "path:pre7-fraction-compare"
    ],
    "prerequisites": [
      "path:pre7-equivalent-fractions"
    ],
    "trainers": [
      {
        "title": "Сравнение дробей",
        "href": "/ege-baza/path/index.html#lesson=pre7-fraction-compare",
        "kind": "По шагам",
        "instruction": "Сначала проверь, совпадают ли числители или знаменатели.",
        "finish": "Сравни 4 пары."
      },
      {
        "title": "Разные знаменатели",
        "href": "/trainers/arifmetika.html?course=preoge&level=f6c",
        "kind": "Практика",
        "instruction": "Сделай доли одинакового размера перед сравнением.",
        "finish": "Сравни ещё 4 пары."
      }
    ],
    "questions": [
      {
        "prompt": "Сравни 2/7 и 4/7.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "При одинаковых долях сравни их количество.",
        "explanation": "Знаменатели одинаковы, а 2 < 4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "2/7",
            "4/7"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "fraction-compare-01"
      },
      {
        "prompt": "Сравни 2/7 и 2/9.",
        "answer": ">",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Чем больше равных частей, тем меньше одна часть.",
        "explanation": "При одинаковом положительном числителе дробь с меньшим знаменателем больше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "2/7",
            "2/9"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-compare-02"
      },
      {
        "prompt": "Сравни 2/7 и 6/21.",
        "answer": "=",
        "input": "choice",
        "choices": [
          "<",
          "=",
          ">"
        ],
        "hint": "Проверь, одинаково ли изменились оба числа дроби.",
        "explanation": "Вторая дробь получена умножением числителя и знаменателя на 3, величина равна.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "2/7",
            "2/7"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "fraction-compare-03"
      },
      {
        "prompt": "Какое число больше: 1/2 или 2/7?",
        "answer": "1/2",
        "input": "number",
        "hint": "Сравни удвоенный числитель со знаменателем.",
        "explanation": "4 < 7, значит 2/7 < 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            "1/2",
            "2/7"
          ]
        },
        "id": "fraction-compare-04"
      },
      {
        "prompt": "Ученик решил, что 1/8 > 1/7, потому что 8 больше 7. Какой знак верен?",
        "answer": "<",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Представь один пирог, разделённый на разное число частей.",
        "explanation": "Часть 1/8 меньше части 1/7.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/8",
            "1/7"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-compare-05"
      },
      {
        "prompt": "Выбери наименьшую дробь: 2/7, 3/7, 5/7.",
        "answer": "2/7",
        "input": "number",
        "hint": "Все доли одинаковые: нужна наименьшая их численность.",
        "explanation": "Наименьший числитель — 2; ответ 2/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "min",
            "2/7",
            "3/7",
            "5/7"
          ]
        },
        "id": "fraction-compare-06"
      },
      {
        "prompt": "Сравни 3/9 и 5/9.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "При одинаковых долях сравни их количество.",
        "explanation": "Знаменатели одинаковы, а 3 < 5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/3",
            "5/9"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "fraction-compare-07"
      },
      {
        "prompt": "Сравни 3/9 и 3/11.",
        "answer": ">",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Чем больше равных частей, тем меньше одна часть.",
        "explanation": "При одинаковом положительном числителе дробь с меньшим знаменателем больше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/3",
            "3/11"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-compare-08"
      },
      {
        "prompt": "Сравни 3/9 и 9/27.",
        "answer": "=",
        "input": "choice",
        "choices": [
          "<",
          "=",
          ">"
        ],
        "hint": "Проверь, одинаково ли изменились оба числа дроби.",
        "explanation": "Вторая дробь получена умножением числителя и знаменателя на 3, величина равна.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/3",
            "1/3"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "fraction-compare-09"
      },
      {
        "prompt": "Какое число больше: 1/2 или 3/9?",
        "answer": "1/2",
        "input": "number",
        "hint": "Сравни удвоенный числитель со знаменателем.",
        "explanation": "6 < 9, значит 3/9 < 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            "1/2",
            "1/3"
          ]
        },
        "id": "fraction-compare-10"
      },
      {
        "prompt": "Ученик решил, что 1/10 > 1/9, потому что 10 больше 9. Какой знак верен?",
        "answer": "<",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Представь один пирог, разделённый на разное число частей.",
        "explanation": "Часть 1/10 меньше части 1/9.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/10",
            "1/9"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-compare-11"
      },
      {
        "prompt": "Выбери наименьшую дробь: 3/9, 4/9, 6/9.",
        "answer": "1/3",
        "input": "number",
        "hint": "Все доли одинаковые: нужна наименьшая их численность.",
        "explanation": "Наименьший числитель — 3; ответ 3/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "min",
            "1/3",
            "4/9",
            "2/3"
          ]
        },
        "id": "fraction-compare-12"
      },
      {
        "prompt": "Сравни 4/11 и 6/11.",
        "answer": "<",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "При одинаковых долях сравни их количество.",
        "explanation": "Знаменатели одинаковы, а 4 < 6.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "4/11",
            "6/11"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "fraction-compare-13"
      },
      {
        "prompt": "Сравни 4/11 и 4/13.",
        "answer": ">",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Чем больше равных частей, тем меньше одна часть.",
        "explanation": "При одинаковом положительном числителе дробь с меньшим знаменателем больше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "4/11",
            "4/13"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-compare-14"
      },
      {
        "prompt": "Сравни 4/11 и 12/33.",
        "answer": "=",
        "input": "choice",
        "choices": [
          "<",
          "=",
          ">"
        ],
        "hint": "Проверь, одинаково ли изменились оба числа дроби.",
        "explanation": "Вторая дробь получена умножением числителя и знаменателя на 3, величина равна.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "4/11",
            "4/11"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "fraction-compare-15"
      },
      {
        "prompt": "Какое число больше: 1/2 или 4/11?",
        "answer": "1/2",
        "input": "number",
        "hint": "Сравни удвоенный числитель со знаменателем.",
        "explanation": "8 < 11, значит 4/11 < 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            "1/2",
            "4/11"
          ]
        },
        "id": "fraction-compare-16"
      },
      {
        "prompt": "Ученик решил, что 1/12 > 1/11, потому что 12 больше 11. Какой знак верен?",
        "answer": "<",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Представь один пирог, разделённый на разное число частей.",
        "explanation": "Часть 1/12 меньше части 1/11.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/12",
            "1/11"
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "fraction-compare-17"
      },
      {
        "prompt": "Выбери наименьшую дробь: 4/11, 5/11, 7/11.",
        "answer": "4/11",
        "input": "number",
        "hint": "Все доли одинаковые: нужна наименьшая их численность.",
        "explanation": "Наименьший числитель — 4; ответ 4/11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "min",
            "4/11",
            "5/11",
            "7/11"
          ]
        },
        "id": "fraction-compare-18"
      }
    ]
  },
  {
    "id": "fraction-common-denominator",
    "group": "fractions",
    "title": "Общий знаменатель: сложить и вычесть",
    "goal": "Приводить к общим долям и складывать количество долей.",
    "covers": [
      "oge-basics:fraction-common-denominator"
    ],
    "prerequisites": [
      "path:pre7-equivalent-fractions",
      "public:v6-lcm-find"
    ],
    "trainers": [
      {
        "title": "Общие доли",
        "href": "/trainers/oge-basics/fraction-common-denominator.html",
        "kind": "Модель",
        "instruction": "Сделай доли одинаковыми, затем считай числители.",
        "finish": "Реши 3 суммы и 3 разности."
      },
      {
        "title": "Найди общий знаменатель",
        "href": "/trainers/arifmetika.html?course=preoge&level=f6a",
        "kind": "Другой способ",
        "instruction": "Подбери число, которое делится на оба знаменателя.",
        "finish": "Найди знаменатель для 4 пар."
      }
    ],
    "questions": [
      {
        "prompt": "Найди общий знаменатель для 1/3 и 1/4, равный произведению знаменателей.",
        "answer": "12",
        "input": "number",
        "hint": "Умножь знаменатели друг на друга.",
        "explanation": "3 · 4 = 12; это число делится на оба знаменателя.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            4
          ]
        },
        "id": "fraction-common-denominator-01"
      },
      {
        "prompt": "Вычисли 1/3 + 1/4.",
        "answer": "7/12",
        "input": "number",
        "hint": "Сначала вырази обе дроби в долях одного размера.",
        "explanation": "1/3 = 4/12, 1/4 = 3/12. Сумма 7/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/3",
            "1/4"
          ]
        },
        "id": "fraction-common-denominator-02"
      },
      {
        "prompt": "Вычисли 1/3 − 1/4.",
        "answer": "1/12",
        "input": "number",
        "hint": "После приведения вычти только числители.",
        "explanation": "4/12 − 3/12 = 1/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "1/3",
            "1/4"
          ]
        },
        "id": "fraction-common-denominator-03"
      },
      {
        "prompt": "Заполни пропуск: 2/3 = □/12.",
        "answer": "8",
        "input": "number",
        "hint": "Посмотри, во сколько раз увеличен знаменатель.",
        "explanation": "12:3 = 4; новый числитель 2 · 4 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "div",
              12,
              3
            ]
          ]
        },
        "id": "fraction-common-denominator-04"
      },
      {
        "prompt": "Как правильно сложить 1/3 и 1/4?",
        "answer": "4/12 + 3/12",
        "input": "choice",
        "choices": [
          "4/12 + 3/12",
          "2/7",
          "2/12"
        ],
        "hint": "Складываются количества одинаковых долей, а не знаменатели.",
        "explanation": "Приводим обе дроби к знаменателю 12; затем складываем числители.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            "1/3",
            "1/4"
          ],
          "values": [
            [
              "add",
              "1/3",
              "1/4"
            ],
            "2/7",
            "1/6"
          ]
        },
        "id": "fraction-common-denominator-05"
      },
      {
        "prompt": "За первую часть пути прошли 2/3 км, затем 1/4 км. Сколько километров прошли?",
        "answer": "11/12",
        "input": "number",
        "hint": "Сложи длины, предварительно сделав доли одинаковыми.",
        "explanation": "2/3 + 1/4 = 8/12 + 3/12 = 11/12 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "2/3",
            "1/4"
          ]
        },
        "id": "fraction-common-denominator-06"
      },
      {
        "prompt": "Найди общий знаменатель для 1/4 и 1/5, равный произведению знаменателей.",
        "answer": "20",
        "input": "number",
        "hint": "Умножь знаменатели друг на друга.",
        "explanation": "4 · 5 = 20; это число делится на оба знаменателя.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            5
          ]
        },
        "id": "fraction-common-denominator-07"
      },
      {
        "prompt": "Вычисли 1/4 + 1/5.",
        "answer": "9/20",
        "input": "number",
        "hint": "Сначала вырази обе дроби в долях одного размера.",
        "explanation": "1/4 = 5/20, 1/5 = 4/20. Сумма 9/20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/4",
            "1/5"
          ]
        },
        "id": "fraction-common-denominator-08"
      },
      {
        "prompt": "Вычисли 1/4 − 1/5.",
        "answer": "1/20",
        "input": "number",
        "hint": "После приведения вычти только числители.",
        "explanation": "5/20 − 4/20 = 1/20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "1/4",
            "1/5"
          ]
        },
        "id": "fraction-common-denominator-09"
      },
      {
        "prompt": "Заполни пропуск: 2/4 = □/20.",
        "answer": "10",
        "input": "number",
        "hint": "Посмотри, во сколько раз увеличен знаменатель.",
        "explanation": "20:4 = 5; новый числитель 2 · 5 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "div",
              20,
              4
            ]
          ]
        },
        "id": "fraction-common-denominator-10"
      },
      {
        "prompt": "Как правильно сложить 1/4 и 1/5?",
        "answer": "5/20 + 4/20",
        "input": "choice",
        "choices": [
          "5/20 + 4/20",
          "2/9",
          "2/20"
        ],
        "hint": "Складываются количества одинаковых долей, а не знаменатели.",
        "explanation": "Приводим обе дроби к знаменателю 20; затем складываем числители.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            "1/4",
            "1/5"
          ],
          "values": [
            [
              "add",
              "1/4",
              "1/5"
            ],
            "2/9",
            "1/10"
          ]
        },
        "id": "fraction-common-denominator-11"
      },
      {
        "prompt": "За первую часть пути прошли 2/4 км, затем 1/5 км. Сколько километров прошли?",
        "answer": "7/10",
        "input": "number",
        "hint": "Сложи длины, предварительно сделав доли одинаковыми.",
        "explanation": "2/4 + 1/5 = 10/20 + 4/20 = 7/10 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            "1/5"
          ]
        },
        "id": "fraction-common-denominator-12"
      },
      {
        "prompt": "Найди общий знаменатель для 1/5 и 1/6, равный произведению знаменателей.",
        "answer": "30",
        "input": "number",
        "hint": "Умножь знаменатели друг на друга.",
        "explanation": "5 · 6 = 30; это число делится на оба знаменателя.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            6
          ]
        },
        "id": "fraction-common-denominator-13"
      },
      {
        "prompt": "Вычисли 1/5 + 1/6.",
        "answer": "11/30",
        "input": "number",
        "hint": "Сначала вырази обе дроби в долях одного размера.",
        "explanation": "1/5 = 6/30, 1/6 = 5/30. Сумма 11/30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/5",
            "1/6"
          ]
        },
        "id": "fraction-common-denominator-14"
      },
      {
        "prompt": "Вычисли 1/5 − 1/6.",
        "answer": "1/30",
        "input": "number",
        "hint": "После приведения вычти только числители.",
        "explanation": "6/30 − 5/30 = 1/30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "1/5",
            "1/6"
          ]
        },
        "id": "fraction-common-denominator-15"
      },
      {
        "prompt": "Заполни пропуск: 2/5 = □/30.",
        "answer": "12",
        "input": "number",
        "hint": "Посмотри, во сколько раз увеличен знаменатель.",
        "explanation": "30:5 = 6; новый числитель 2 · 6 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "div",
              30,
              5
            ]
          ]
        },
        "id": "fraction-common-denominator-16"
      },
      {
        "prompt": "Как правильно сложить 1/5 и 1/6?",
        "answer": "6/30 + 5/30",
        "input": "choice",
        "choices": [
          "6/30 + 5/30",
          "2/11",
          "2/30"
        ],
        "hint": "Складываются количества одинаковых долей, а не знаменатели.",
        "explanation": "Приводим обе дроби к знаменателю 30; затем складываем числители.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            "1/5",
            "1/6"
          ],
          "values": [
            [
              "add",
              "1/5",
              "1/6"
            ],
            "2/11",
            "1/15"
          ]
        },
        "id": "fraction-common-denominator-17"
      },
      {
        "prompt": "За первую часть пути прошли 2/5 км, затем 1/6 км. Сколько километров прошли?",
        "answer": "17/30",
        "input": "number",
        "hint": "Сложи длины, предварительно сделав доли одинаковыми.",
        "explanation": "2/5 + 1/6 = 12/30 + 5/30 = 17/30 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "2/5",
            "1/6"
          ]
        },
        "id": "fraction-common-denominator-18"
      }
    ]
  },
  {
    "id": "fraction-product",
    "group": "fractions",
    "title": "Умножаем дроби и сокращаем множители",
    "goal": "Находить долю от доли и сокращать до умножения.",
    "covers": [
      "path:grade7-b-fraction-product-cancel"
    ],
    "prerequisites": [
      "path:pre7-equivalent-fractions"
    ],
    "trainers": [
      {
        "title": "Сокращение множителей",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-fraction-product-cancel",
        "kind": "По шагам",
        "instruction": "Сокращай общий множитель числителя и знаменателя до перемножения.",
        "finish": "Реши 4 произведения."
      },
      {
        "title": "Действия с дробями",
        "href": "/trainers/drobi-oge-trainer.html#practice=fraction-multiply",
        "kind": "Другой способ",
        "instruction": "В открывшемся умножении объясняй, какие множители сокращаешь.",
        "finish": "Выполни 3 произведения."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 2/5 · 5/3.",
        "answer": "2/3",
        "input": "number",
        "hint": "Знаменатель первой дроби совпадает с числителем второй.",
        "explanation": "2/5 · 5/3 = 2/3: множители 5 сокращаются.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "2/5",
            "5/3"
          ]
        },
        "id": "fraction-product-01"
      },
      {
        "prompt": "Найди 2/5 от 15.",
        "answer": "6",
        "input": "number",
        "hint": "Доля от числа находится умножением.",
        "explanation": "15 · 2/5 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            15,
            "2/5"
          ]
        },
        "id": "fraction-product-02"
      },
      {
        "prompt": "Вычисли 2/5 · 1/2.",
        "answer": "1/5",
        "input": "number",
        "hint": "Половина дроби — её произведение на одну вторую.",
        "explanation": "2/5 · 1/2 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "2/5",
            "1/2"
          ]
        },
        "id": "fraction-product-03"
      },
      {
        "prompt": "Какому произведению равно 2/5 · 3/6?",
        "answer": "6/30",
        "input": "choice",
        "choices": [
          "6/30",
          "5/11",
          "6/11"
        ],
        "hint": "При умножении перемножаются числители и отдельно знаменатели.",
        "explanation": "Получаем (2 · 3)/(5 · 6) = 1/5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "2/5",
            "1/2"
          ],
          "values": [
            "1/5",
            "5/11",
            "6/11"
          ]
        },
        "id": "fraction-product-04"
      },
      {
        "prompt": "Закрасили 2/5 листа. Половину закрашенной части покрыли узором. Какую долю всего листа занимает узор?",
        "answer": "1/5",
        "input": "number",
        "hint": "Нужна половина от уже выбранной доли.",
        "explanation": "Доля узора: 1/2 · 2/5 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "1/2",
            "2/5"
          ]
        },
        "id": "fraction-product-05"
      },
      {
        "prompt": "Проверь ошибку: при умножении 2/5 · 3/2 ученик сложил знаменатели. Запиши верное произведение.",
        "answer": "3/5",
        "input": "number",
        "hint": "Знаменатели при умножении тоже перемножаются.",
        "explanation": "2/5 · 3/2 = (2 · 3)/(5 · 2) = 3/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "2/5",
            "3/2"
          ]
        },
        "id": "fraction-product-06"
      },
      {
        "prompt": "Вычисли 3/7 · 7/4.",
        "answer": "3/4",
        "input": "number",
        "hint": "Знаменатель первой дроби совпадает с числителем второй.",
        "explanation": "3/7 · 7/4 = 3/4: множители 7 сокращаются.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "3/7",
            "7/4"
          ]
        },
        "id": "fraction-product-07"
      },
      {
        "prompt": "Найди 3/7 от 21.",
        "answer": "9",
        "input": "number",
        "hint": "Доля от числа находится умножением.",
        "explanation": "21 · 3/7 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            21,
            "3/7"
          ]
        },
        "id": "fraction-product-08"
      },
      {
        "prompt": "Вычисли 3/7 · 1/2.",
        "answer": "3/14",
        "input": "number",
        "hint": "Половина дроби — её произведение на одну вторую.",
        "explanation": "3/7 · 1/2 = 3/14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "3/7",
            "1/2"
          ]
        },
        "id": "fraction-product-09"
      },
      {
        "prompt": "Какому произведению равно 3/7 · 4/8?",
        "answer": "12/56",
        "input": "choice",
        "choices": [
          "12/56",
          "7/15",
          "12/15"
        ],
        "hint": "При умножении перемножаются числители и отдельно знаменатели.",
        "explanation": "Получаем (3 · 4)/(7 · 8) = 3/14.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "3/7",
            "1/2"
          ],
          "values": [
            "3/14",
            "7/15",
            "4/5"
          ]
        },
        "id": "fraction-product-10"
      },
      {
        "prompt": "Закрасили 3/7 листа. Половину закрашенной части покрыли узором. Какую долю всего листа занимает узор?",
        "answer": "3/14",
        "input": "number",
        "hint": "Нужна половина от уже выбранной доли.",
        "explanation": "Доля узора: 1/2 · 3/7 = 3/14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "1/2",
            "3/7"
          ]
        },
        "id": "fraction-product-11"
      },
      {
        "prompt": "Проверь ошибку: при умножении 3/7 · 4/2 ученик сложил знаменатели. Запиши верное произведение.",
        "answer": "6/7",
        "input": "number",
        "hint": "Знаменатели при умножении тоже перемножаются.",
        "explanation": "3/7 · 4/2 = (3 · 4)/(7 · 2) = 6/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "3/7",
            "2"
          ]
        },
        "id": "fraction-product-12"
      },
      {
        "prompt": "Вычисли 4/9 · 9/5.",
        "answer": "4/5",
        "input": "number",
        "hint": "Знаменатель первой дроби совпадает с числителем второй.",
        "explanation": "4/9 · 9/5 = 4/5: множители 9 сокращаются.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "4/9",
            "9/5"
          ]
        },
        "id": "fraction-product-13"
      },
      {
        "prompt": "Найди 4/9 от 27.",
        "answer": "12",
        "input": "number",
        "hint": "Доля от числа находится умножением.",
        "explanation": "27 · 4/9 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            27,
            "4/9"
          ]
        },
        "id": "fraction-product-14"
      },
      {
        "prompt": "Вычисли 4/9 · 1/2.",
        "answer": "2/9",
        "input": "number",
        "hint": "Половина дроби — её произведение на одну вторую.",
        "explanation": "4/9 · 1/2 = 2/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "4/9",
            "1/2"
          ]
        },
        "id": "fraction-product-15"
      },
      {
        "prompt": "Какому произведению равно 4/9 · 5/10?",
        "answer": "20/90",
        "input": "choice",
        "choices": [
          "20/90",
          "9/19",
          "20/19"
        ],
        "hint": "При умножении перемножаются числители и отдельно знаменатели.",
        "explanation": "Получаем (4 · 5)/(9 · 10) = 2/9.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "4/9",
            "1/2"
          ],
          "values": [
            "2/9",
            "9/19",
            "20/19"
          ]
        },
        "id": "fraction-product-16"
      },
      {
        "prompt": "Закрасили 4/9 листа. Половину закрашенной части покрыли узором. Какую долю всего листа занимает узор?",
        "answer": "2/9",
        "input": "number",
        "hint": "Нужна половина от уже выбранной доли.",
        "explanation": "Доля узора: 1/2 · 4/9 = 2/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "1/2",
            "4/9"
          ]
        },
        "id": "fraction-product-17"
      },
      {
        "prompt": "Проверь ошибку: при умножении 4/9 · 5/2 ученик сложил знаменатели. Запиши верное произведение.",
        "answer": "10/9",
        "input": "number",
        "hint": "Знаменатели при умножении тоже перемножаются.",
        "explanation": "4/9 · 5/2 = (4 · 5)/(9 · 2) = 10/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "4/9",
            "5/2"
          ]
        },
        "id": "fraction-product-18"
      }
    ]
  },
  {
    "id": "fraction-division",
    "group": "fractions",
    "title": "Делим дроби: сколько раз помещается",
    "goal": "Понимать частное и заменять деление умножением на обратную дробь.",
    "covers": [
      "path:grade7-b-fraction-division-meaning"
    ],
    "prerequisites": [
      "path:grade7-b-fraction-product-cancel"
    ],
    "trainers": [
      {
        "title": "Смысл деления дробей",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-fraction-division-meaning",
        "kind": "Модель",
        "instruction": "Спроси, сколько долей заданного размера помещается в величине.",
        "finish": "Реши 3 задачи."
      },
      {
        "title": "Практика действий с дробями",
        "href": "/trainers/oge-task6-fractions.html",
        "kind": "Практика",
        "instruction": "При делении переворачивай только дробь-делитель.",
        "finish": "Выполни 4 деления."
      }
    ],
    "questions": [
      {
        "prompt": "Сколько частей по 1/5 помещается в 3/5?",
        "answer": "3",
        "input": "number",
        "hint": "Здесь сравниваются одинаковые доли.",
        "explanation": "3/5 : (1/5) = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "3/5",
            "1/5"
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 5,
          "shaded": 3
        },
        "id": "fraction-division-01"
      },
      {
        "prompt": "Вычисли 3/5 : 2.",
        "answer": "3/10",
        "input": "number",
        "hint": "Разделить на два — взять половину.",
        "explanation": "3/5 : 2 = 3/5 · 1/2 = 3/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "3/5",
            2
          ]
        },
        "id": "fraction-division-02"
      },
      {
        "prompt": "Вычисли 2 : 3/5.",
        "answer": "10/3",
        "input": "number",
        "hint": "Заменяй деление умножением на дробь, обратную делителю.",
        "explanation": "2 · 5/3 = 10/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            "3/5"
          ]
        },
        "id": "fraction-division-03"
      },
      {
        "prompt": "Как правильно переписать 3/5 : 2/3?",
        "answer": "3/5 · 3/2",
        "input": "choice",
        "choices": [
          "5/3 · 2/3",
          "3/5 · 2/3",
          "3/5 · 3/2"
        ],
        "hint": "Первая дробь остаётся прежней, переворачивается только делитель.",
        "explanation": "Обратная дробь к 2/3 — 3/2, поэтому перемножаем 3/5 и 3/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "3/5",
            "2/3"
          ],
          "values": [
            [
              "mul",
              "5/3",
              "2/3"
            ],
            [
              "mul",
              "3/5",
              "2/3"
            ],
            [
              "mul",
              "3/5",
              "3/2"
            ]
          ]
        },
        "id": "fraction-division-04"
      },
      {
        "prompt": "Ленту длиной 3/5 м режут на кусочки по 1/10 м. Сколько кусочков получится?",
        "answer": "6",
        "input": "number",
        "hint": "Раздели всю длину на длину одного кусочка.",
        "explanation": "3/5 : (1/10) = 3/5 · 10 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "3/5",
            "1/10"
          ]
        },
        "id": "fraction-division-05"
      },
      {
        "prompt": "Найди неизвестное: □ · 2/3 = 3/5.",
        "answer": "9/10",
        "input": "number",
        "hint": "Неизвестный множитель находится делением произведения на известный.",
        "explanation": "□ = 3/5 : (2/3) = 9/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "3/5",
            "2/3"
          ]
        },
        "id": "fraction-division-06"
      },
      {
        "prompt": "Сколько частей по 1/7 помещается в 4/7?",
        "answer": "4",
        "input": "number",
        "hint": "Здесь сравниваются одинаковые доли.",
        "explanation": "4/7 : (1/7) = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "4/7",
            "1/7"
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 7,
          "shaded": 4
        },
        "id": "fraction-division-07"
      },
      {
        "prompt": "Вычисли 4/7 : 2.",
        "answer": "2/7",
        "input": "number",
        "hint": "Разделить на два — взять половину.",
        "explanation": "4/7 : 2 = 4/7 · 1/2 = 2/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "4/7",
            2
          ]
        },
        "id": "fraction-division-08"
      },
      {
        "prompt": "Вычисли 2 : 4/7.",
        "answer": "7/2",
        "input": "number",
        "hint": "Заменяй деление умножением на дробь, обратную делителю.",
        "explanation": "2 · 7/4 = 7/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            "4/7"
          ]
        },
        "id": "fraction-division-09"
      },
      {
        "prompt": "Как правильно переписать 4/7 : 2/3?",
        "answer": "4/7 · 3/2",
        "input": "choice",
        "choices": [
          "7/4 · 2/3",
          "4/7 · 2/3",
          "4/7 · 3/2"
        ],
        "hint": "Первая дробь остаётся прежней, переворачивается только делитель.",
        "explanation": "Обратная дробь к 2/3 — 3/2, поэтому перемножаем 4/7 и 3/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "4/7",
            "2/3"
          ],
          "values": [
            [
              "mul",
              "7/4",
              "2/3"
            ],
            [
              "mul",
              "4/7",
              "2/3"
            ],
            [
              "mul",
              "4/7",
              "3/2"
            ]
          ]
        },
        "id": "fraction-division-10"
      },
      {
        "prompt": "Ленту длиной 4/7 м режут на кусочки по 1/14 м. Сколько кусочков получится?",
        "answer": "8",
        "input": "number",
        "hint": "Раздели всю длину на длину одного кусочка.",
        "explanation": "4/7 : (1/14) = 4/7 · 14 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "4/7",
            "1/14"
          ]
        },
        "id": "fraction-division-11"
      },
      {
        "prompt": "Найди неизвестное: □ · 2/3 = 4/7.",
        "answer": "6/7",
        "input": "number",
        "hint": "Неизвестный множитель находится делением произведения на известный.",
        "explanation": "□ = 4/7 : (2/3) = 6/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "4/7",
            "2/3"
          ]
        },
        "id": "fraction-division-12"
      },
      {
        "prompt": "Сколько частей по 1/9 помещается в 5/9?",
        "answer": "5",
        "input": "number",
        "hint": "Здесь сравниваются одинаковые доли.",
        "explanation": "5/9 : (1/9) = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "5/9",
            "1/9"
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 9,
          "shaded": 5
        },
        "id": "fraction-division-13"
      },
      {
        "prompt": "Вычисли 5/9 : 2.",
        "answer": "5/18",
        "input": "number",
        "hint": "Разделить на два — взять половину.",
        "explanation": "5/9 : 2 = 5/9 · 1/2 = 5/18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "5/9",
            2
          ]
        },
        "id": "fraction-division-14"
      },
      {
        "prompt": "Вычисли 2 : 5/9.",
        "answer": "18/5",
        "input": "number",
        "hint": "Заменяй деление умножением на дробь, обратную делителю.",
        "explanation": "2 · 9/5 = 18/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2,
            "5/9"
          ]
        },
        "id": "fraction-division-15"
      },
      {
        "prompt": "Как правильно переписать 5/9 : 2/3?",
        "answer": "5/9 · 3/2",
        "input": "choice",
        "choices": [
          "9/5 · 2/3",
          "5/9 · 2/3",
          "5/9 · 3/2"
        ],
        "hint": "Первая дробь остаётся прежней, переворачивается только делитель.",
        "explanation": "Обратная дробь к 2/3 — 3/2, поэтому перемножаем 5/9 и 3/2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            "5/9",
            "2/3"
          ],
          "values": [
            [
              "mul",
              "9/5",
              "2/3"
            ],
            [
              "mul",
              "5/9",
              "2/3"
            ],
            [
              "mul",
              "5/9",
              "3/2"
            ]
          ]
        },
        "id": "fraction-division-16"
      },
      {
        "prompt": "Ленту длиной 5/9 м режут на кусочки по 1/18 м. Сколько кусочков получится?",
        "answer": "10",
        "input": "number",
        "hint": "Раздели всю длину на длину одного кусочка.",
        "explanation": "5/9 : (1/18) = 5/9 · 18 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "5/9",
            "1/18"
          ]
        },
        "id": "fraction-division-17"
      },
      {
        "prompt": "Найди неизвестное: □ · 2/3 = 5/9.",
        "answer": "5/6",
        "input": "number",
        "hint": "Неизвестный множитель находится делением произведения на известный.",
        "explanation": "□ = 5/9 : (2/3) = 5/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            "5/9",
            "2/3"
          ]
        },
        "id": "fraction-division-18"
      }
    ]
  },
  {
    "id": "fraction-mixed-add-subtract",
    "group": "fractions",
    "title": "Смешанные числа: сложение и размен",
    "goal": "Складывать целые части и доли, занимать целую единицу при вычитании.",
    "covers": [
      "path:grade7-b-mixed-borrow",
      "public:v6-mixed-add"
    ],
    "prerequisites": [
      "oge-basics:fraction-common-denominator"
    ],
    "trainers": [
      {
        "title": "Занимаем единицу",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-mixed-borrow",
        "kind": "По шагам",
        "instruction": "При нехватке долей замени одну целую нужным количеством долей.",
        "finish": "Выполни 3 размена и вычитания."
      },
      {
        "title": "Сложение смешанных чисел",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-mixed-add",
        "kind": "Другой способ",
        "instruction": "Складывай целые части и дробные, затем выдели целую часть из суммы долей.",
        "finish": "Реши 4 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Запиши 3 2/5 одной дробью.",
        "answer": "17/5",
        "input": "number",
        "hint": "В каждой целой единице столько долей, сколько показывает знаменатель.",
        "explanation": "3 2/5 = (3 · 5 + 2)/5 = 17/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            3,
            "2/5"
          ]
        },
        "id": "fraction-mixed-add-subtract-01",
        "answerFormat": "fraction"
      },
      {
        "prompt": "Вычисли 3 1/5 − 2/5.",
        "answer": "14/5",
        "input": "number",
        "hint": "У дробной части не хватает долей: размени одну целую.",
        "explanation": "3 1/5 = 2 6/5. После вычитания получаем 14/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              3,
              "1/5"
            ],
            "2/5"
          ]
        },
        "id": "fraction-mixed-add-subtract-02"
      },
      {
        "prompt": "Вычисли 1 2/5 + 2 4/5.",
        "answer": "21/5",
        "input": "number",
        "hint": "Сумма дробных частей может дать ещё одну целую.",
        "explanation": "Целые части дают 3, доли: (2+4)/5 = 1 + 1/5. Всего 21/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "add",
              1,
              "2/5"
            ],
            [
              "add",
              2,
              "4/5"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-03"
      },
      {
        "prompt": "При размене 3 целых сколько целых останется, если одну целую превратить в 5/5?",
        "answer": "2",
        "input": "number",
        "hint": "Разменивается ровно одна целая единица.",
        "explanation": "Из 3 целых одна перешла в доли; осталось 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            3,
            1
          ]
        },
        "id": "fraction-mixed-add-subtract-04"
      },
      {
        "prompt": "Какой записью удобно заменить 3 1/5 перед вычитанием 3/5?",
        "answer": "2 6/5",
        "input": "choice",
        "choices": [
          "2 6/5",
          "2 1/5",
          "3 6/5"
        ],
        "hint": "Значение смешанного числа должно сохраниться.",
        "explanation": "Одна целая равна 5/5, поэтому 3 1/5 = 2 6/5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            3,
            "1/5"
          ],
          "values": [
            [
              "add",
              2,
              "6/5"
            ],
            [
              "add",
              2,
              "1/5"
            ],
            [
              "add",
              3,
              "6/5"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-05"
      },
      {
        "prompt": "От ленты длиной 3 2/5 м отрезали 1 3/5 м. Сколько метров осталось?",
        "answer": "9/5",
        "input": "number",
        "hint": "При необходимости размени целую единицу или переведи обе длины в неправильные дроби.",
        "explanation": "(17 − 8)/5 = 9/5 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              3,
              "2/5"
            ],
            [
              "add",
              1,
              "3/5"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-06"
      },
      {
        "prompt": "Запиши 4 3/7 одной дробью.",
        "answer": "31/7",
        "input": "number",
        "hint": "В каждой целой единице столько долей, сколько показывает знаменатель.",
        "explanation": "4 3/7 = (4 · 7 + 3)/7 = 31/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            "3/7"
          ]
        },
        "id": "fraction-mixed-add-subtract-07",
        "answerFormat": "fraction"
      },
      {
        "prompt": "Вычисли 4 1/7 − 2/7.",
        "answer": "27/7",
        "input": "number",
        "hint": "У дробной части не хватает долей: размени одну целую.",
        "explanation": "4 1/7 = 3 8/7. После вычитания получаем 27/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              4,
              "1/7"
            ],
            "2/7"
          ]
        },
        "id": "fraction-mixed-add-subtract-08"
      },
      {
        "prompt": "Вычисли 1 3/7 + 2 5/7.",
        "answer": "29/7",
        "input": "number",
        "hint": "Сумма дробных частей может дать ещё одну целую.",
        "explanation": "Целые части дают 3, доли: (3+5)/7 = 1 + 1/7. Всего 29/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "add",
              1,
              "3/7"
            ],
            [
              "add",
              2,
              "5/7"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-09"
      },
      {
        "prompt": "При размене 4 целых сколько целых останется, если одну целую превратить в 7/7?",
        "answer": "3",
        "input": "number",
        "hint": "Разменивается ровно одна целая единица.",
        "explanation": "Из 4 целых одна перешла в доли; осталось 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            4,
            1
          ]
        },
        "id": "fraction-mixed-add-subtract-10"
      },
      {
        "prompt": "Какой записью удобно заменить 4 1/7 перед вычитанием 3/7?",
        "answer": "3 8/7",
        "input": "choice",
        "choices": [
          "3 8/7",
          "3 1/7",
          "4 8/7"
        ],
        "hint": "Значение смешанного числа должно сохраниться.",
        "explanation": "Одна целая равна 7/7, поэтому 4 1/7 = 3 8/7.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            4,
            "1/7"
          ],
          "values": [
            [
              "add",
              3,
              "8/7"
            ],
            [
              "add",
              3,
              "1/7"
            ],
            [
              "add",
              4,
              "8/7"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-11"
      },
      {
        "prompt": "От ленты длиной 4 3/7 м отрезали 1 4/7 м. Сколько метров осталось?",
        "answer": "20/7",
        "input": "number",
        "hint": "При необходимости размени целую единицу или переведи обе длины в неправильные дроби.",
        "explanation": "(31 − 11)/7 = 20/7 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              4,
              "3/7"
            ],
            [
              "add",
              1,
              "4/7"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-12"
      },
      {
        "prompt": "Запиши 5 4/9 одной дробью.",
        "answer": "49/9",
        "input": "number",
        "hint": "В каждой целой единице столько долей, сколько показывает знаменатель.",
        "explanation": "5 4/9 = (5 · 9 + 4)/9 = 49/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            5,
            "4/9"
          ]
        },
        "id": "fraction-mixed-add-subtract-13",
        "answerFormat": "fraction"
      },
      {
        "prompt": "Вычисли 5 1/9 − 2/9.",
        "answer": "44/9",
        "input": "number",
        "hint": "У дробной части не хватает долей: размени одну целую.",
        "explanation": "5 1/9 = 4 10/9. После вычитания получаем 44/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              5,
              "1/9"
            ],
            "2/9"
          ]
        },
        "id": "fraction-mixed-add-subtract-14"
      },
      {
        "prompt": "Вычисли 1 4/9 + 2 6/9.",
        "answer": "37/9",
        "input": "number",
        "hint": "Сумма дробных частей может дать ещё одну целую.",
        "explanation": "Целые части дают 3, доли: (4+6)/9 = 1 + 1/9. Всего 37/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "add",
              1,
              "4/9"
            ],
            [
              "add",
              2,
              "2/3"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-15"
      },
      {
        "prompt": "При размене 5 целых сколько целых останется, если одну целую превратить в 9/9?",
        "answer": "4",
        "input": "number",
        "hint": "Разменивается ровно одна целая единица.",
        "explanation": "Из 5 целых одна перешла в доли; осталось 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            1
          ]
        },
        "id": "fraction-mixed-add-subtract-16"
      },
      {
        "prompt": "Какой записью удобно заменить 5 1/9 перед вычитанием 3/9?",
        "answer": "4 10/9",
        "input": "choice",
        "choices": [
          "4 10/9",
          "4 1/9",
          "5 10/9"
        ],
        "hint": "Значение смешанного числа должно сохраниться.",
        "explanation": "Одна целая равна 9/9, поэтому 5 1/9 = 4 10/9.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            5,
            "1/9"
          ],
          "values": [
            [
              "add",
              4,
              "10/9"
            ],
            [
              "add",
              4,
              "1/9"
            ],
            [
              "add",
              5,
              "10/9"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-17"
      },
      {
        "prompt": "От ленты длиной 5 4/9 м отрезали 1 5/9 м. Сколько метров осталось?",
        "answer": "35/9",
        "input": "number",
        "hint": "При необходимости размени целую единицу или переведи обе длины в неправильные дроби.",
        "explanation": "(49 − 14)/9 = 35/9 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              5,
              "4/9"
            ],
            [
              "add",
              1,
              "5/9"
            ]
          ]
        },
        "id": "fraction-mixed-add-subtract-18"
      }
    ]
  },
  {
    "id": "fraction-mixed-divide",
    "group": "fractions",
    "title": "Делим смешанные числа",
    "goal": "Перед делением переходить к неправильным дробям и проверять частное.",
    "covers": [
      "public:v6-mixed-divide"
    ],
    "prerequisites": [
      "path:grade7-b-fraction-division-meaning",
      "path:grade7-b-mixed-borrow"
    ],
    "trainers": [
      {
        "title": "Деление смешанных чисел",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-mixed-divide",
        "kind": "По шагам",
        "instruction": "Переведи оба числа в неправильные дроби, затем замени деление умножением.",
        "finish": "Реши 4 примера."
      },
      {
        "title": "Сколько раз помещается дробь",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-fraction-division-meaning",
        "kind": "Другой способ",
        "instruction": "Проверь смысл частного через размер одной части.",
        "finish": "Реши 3 задачи."
      }
    ],
    "questions": [
      {
        "prompt": "Запиши 2 1/3 одной дробью.",
        "answer": "7/3",
        "input": "number",
        "hint": "Целые части переведи в доли, затем прибавь числитель.",
        "explanation": "2 1/3 = (2 · 3 + 1)/3 = 7/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            "1/3"
          ]
        },
        "id": "fraction-mixed-divide-01",
        "answerFormat": "fraction"
      },
      {
        "prompt": "Вычисли 2 1/3 : 1/3.",
        "answer": "7",
        "input": "number",
        "hint": "После перевода в неправильную дробь одинаковые знаменатели сократятся.",
        "explanation": "7/3 : (1/3) = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              2,
              "1/3"
            ],
            "1/3"
          ]
        },
        "id": "fraction-mixed-divide-02"
      },
      {
        "prompt": "Вычисли 2 1/3 : 2.",
        "answer": "7/6",
        "input": "number",
        "hint": "Разделить на 2 означает умножить на половину.",
        "explanation": "7/3 · 1/2 = 7/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              2,
              "1/3"
            ],
            2
          ]
        },
        "id": "fraction-mixed-divide-03"
      },
      {
        "prompt": "Как записать 2 1/3 : 1 1/3 без смешанных чисел?",
        "answer": "7/3 : 4/3",
        "input": "choice",
        "choices": [
          "7/3 : 4/3",
          "3/3 : 2/3",
          "7/3 · 4/3"
        ],
        "hint": "Переведи каждое смешанное число целиком; знак деления пока сохрани.",
        "explanation": "2 1/3 = 7/3, а 1 1/3 = 4/3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "add",
              2,
              "1/3"
            ],
            [
              "add",
              1,
              "1/3"
            ]
          ],
          "values": [
            [
              "div",
              "7/3",
              "4/3"
            ],
            [
              "div",
              "1",
              "2/3"
            ],
            [
              "mul",
              "7/3",
              "4/3"
            ]
          ]
        },
        "id": "fraction-mixed-divide-04"
      },
      {
        "prompt": "Вычисли 2 1/3 : 1 1/3.",
        "answer": "7/4",
        "input": "number",
        "hint": "После перехода к неправильным дробям переверни только делитель.",
        "explanation": "7/3 · 3/4 = 7/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              2,
              "1/3"
            ],
            [
              "add",
              1,
              "1/3"
            ]
          ]
        },
        "id": "fraction-mixed-divide-05"
      },
      {
        "prompt": "Из 3 1/3 л сока наполняют стаканы по 1/3 л. Сколько полных стаканов получится?",
        "answer": "10",
        "input": "number",
        "hint": "Здесь общая величина кратна размеру одного стакана.",
        "explanation": "10/3 : (1/3) = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              3,
              "1/3"
            ],
            "1/3"
          ]
        },
        "id": "fraction-mixed-divide-06"
      },
      {
        "prompt": "Запиши 3 1/4 одной дробью.",
        "answer": "13/4",
        "input": "number",
        "hint": "Целые части переведи в доли, затем прибавь числитель.",
        "explanation": "3 1/4 = (3 · 4 + 1)/4 = 13/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            3,
            "1/4"
          ]
        },
        "id": "fraction-mixed-divide-07",
        "answerFormat": "fraction"
      },
      {
        "prompt": "Вычисли 3 1/4 : 1/4.",
        "answer": "13",
        "input": "number",
        "hint": "После перевода в неправильную дробь одинаковые знаменатели сократятся.",
        "explanation": "13/4 : (1/4) = 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              3,
              "1/4"
            ],
            "1/4"
          ]
        },
        "id": "fraction-mixed-divide-08"
      },
      {
        "prompt": "Вычисли 3 1/4 : 2.",
        "answer": "13/8",
        "input": "number",
        "hint": "Разделить на 2 означает умножить на половину.",
        "explanation": "13/4 · 1/2 = 13/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              3,
              "1/4"
            ],
            2
          ]
        },
        "id": "fraction-mixed-divide-09"
      },
      {
        "prompt": "Как записать 3 1/4 : 1 1/4 без смешанных чисел?",
        "answer": "13/4 : 5/4",
        "input": "choice",
        "choices": [
          "13/4 : 5/4",
          "4/4 : 2/4",
          "13/4 · 5/4"
        ],
        "hint": "Переведи каждое смешанное число целиком; знак деления пока сохрани.",
        "explanation": "3 1/4 = 13/4, а 1 1/4 = 5/4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "add",
              3,
              "1/4"
            ],
            [
              "add",
              1,
              "1/4"
            ]
          ],
          "values": [
            [
              "div",
              "13/4",
              "5/4"
            ],
            [
              "div",
              "1",
              "1/2"
            ],
            [
              "mul",
              "13/4",
              "5/4"
            ]
          ]
        },
        "id": "fraction-mixed-divide-10"
      },
      {
        "prompt": "Вычисли 3 1/4 : 1 1/4.",
        "answer": "13/5",
        "input": "number",
        "hint": "После перехода к неправильным дробям переверни только делитель.",
        "explanation": "13/4 · 4/5 = 13/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              3,
              "1/4"
            ],
            [
              "add",
              1,
              "1/4"
            ]
          ]
        },
        "id": "fraction-mixed-divide-11"
      },
      {
        "prompt": "Из 4 1/4 л сока наполняют стаканы по 1/4 л. Сколько полных стаканов получится?",
        "answer": "17",
        "input": "number",
        "hint": "Здесь общая величина кратна размеру одного стакана.",
        "explanation": "17/4 : (1/4) = 17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              "1/4"
            ],
            "1/4"
          ]
        },
        "id": "fraction-mixed-divide-12"
      },
      {
        "prompt": "Запиши 4 1/5 одной дробью.",
        "answer": "21/5",
        "input": "number",
        "hint": "Целые части переведи в доли, затем прибавь числитель.",
        "explanation": "4 1/5 = (4 · 5 + 1)/5 = 21/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            "1/5"
          ]
        },
        "id": "fraction-mixed-divide-13",
        "answerFormat": "fraction"
      },
      {
        "prompt": "Вычисли 4 1/5 : 1/5.",
        "answer": "21",
        "input": "number",
        "hint": "После перевода в неправильную дробь одинаковые знаменатели сократятся.",
        "explanation": "21/5 : (1/5) = 21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              "1/5"
            ],
            "1/5"
          ]
        },
        "id": "fraction-mixed-divide-14"
      },
      {
        "prompt": "Вычисли 4 1/5 : 2.",
        "answer": "21/10",
        "input": "number",
        "hint": "Разделить на 2 означает умножить на половину.",
        "explanation": "21/5 · 1/2 = 21/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              "1/5"
            ],
            2
          ]
        },
        "id": "fraction-mixed-divide-15"
      },
      {
        "prompt": "Как записать 4 1/5 : 1 1/5 без смешанных чисел?",
        "answer": "21/5 : 6/5",
        "input": "choice",
        "choices": [
          "21/5 : 6/5",
          "5/5 : 2/5",
          "21/5 · 6/5"
        ],
        "hint": "Переведи каждое смешанное число целиком; знак деления пока сохрани.",
        "explanation": "4 1/5 = 21/5, а 1 1/5 = 6/5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "add",
              4,
              "1/5"
            ],
            [
              "add",
              1,
              "1/5"
            ]
          ],
          "values": [
            [
              "div",
              "21/5",
              "6/5"
            ],
            [
              "div",
              "1",
              "2/5"
            ],
            [
              "mul",
              "21/5",
              "6/5"
            ]
          ]
        },
        "id": "fraction-mixed-divide-16"
      },
      {
        "prompt": "Вычисли 4 1/5 : 1 1/5.",
        "answer": "7/2",
        "input": "number",
        "hint": "После перехода к неправильным дробям переверни только делитель.",
        "explanation": "21/5 · 5/6 = 7/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              "1/5"
            ],
            [
              "add",
              1,
              "1/5"
            ]
          ]
        },
        "id": "fraction-mixed-divide-17"
      },
      {
        "prompt": "Из 5 1/5 л сока наполняют стаканы по 1/5 л. Сколько полных стаканов получится?",
        "answer": "26",
        "input": "number",
        "hint": "Здесь общая величина кратна размеру одного стакана.",
        "explanation": "26/5 : (1/5) = 26.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              5,
              "1/5"
            ],
            "1/5"
          ]
        },
        "id": "fraction-mixed-divide-18"
      }
    ]
  },
  {
    "id": "fraction-part-whole",
    "group": "fractions",
    "title": "Дробь от числа и целое по части",
    "goal": "Различать поиск части и восстановление целого.",
    "covers": [
      "path:pre7-fraction-part-whole",
      "public:fraction-part-whole"
    ],
    "prerequisites": [
      "path:grade7-b-fraction-product-cancel",
      "path:grade7-b-fraction-division-meaning"
    ],
    "trainers": [
      {
        "title": "Доля, часть и целое",
        "href": "/ege-baza/path/index.html#lesson=pre7-fraction-part-whole",
        "kind": "По шагам",
        "instruction": "Назови целое и долю до выбора действия.",
        "finish": "Реши 3 задачи двух направлений."
      },
      {
        "title": "Задачи с моделью долей",
        "href": "/trainers/fractions-part-whole-assignment.html",
        "kind": "Модель",
        "instruction": "Отметь, что известно: всё количество или только часть.",
        "finish": "Реши 4 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Найди 2/5 от 30.",
        "answer": "12",
        "input": "number",
        "hint": "Сначала найди одну долю целого, затем нужное количество долей.",
        "explanation": "30:5 · 2 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            30,
            "2/5"
          ]
        },
        "id": "fraction-part-whole-01"
      },
      {
        "prompt": "2/5 числа равны 12. Найди всё число.",
        "answer": "30",
        "input": "number",
        "hint": "Раздели известную часть на числитель, затем умножь на знаменатель.",
        "explanation": "12:2 · 5 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            "2/5"
          ]
        },
        "id": "fraction-part-whole-02"
      },
      {
        "prompt": "Из 30 книг прочитали 12. Какую долю всех книг прочитали?",
        "answer": "2/5",
        "input": "number",
        "hint": "Сравни прочитанную часть с общим количеством.",
        "explanation": "12/30 = 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            30
          ]
        },
        "id": "fraction-part-whole-03"
      },
      {
        "prompt": "От 30 м провода отрезали 2/5. Сколько метров осталось?",
        "answer": "18",
        "input": "number",
        "hint": "Сначала найди отрезанную часть, затем вычти её из целого.",
        "explanation": "30 − 30 · 2/5 = 18 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            30,
            [
              "mul",
              30,
              "2/5"
            ]
          ]
        },
        "id": "fraction-part-whole-04"
      },
      {
        "prompt": "Как найти целое, если его 2/5 равны 12?",
        "answer": "12 : (2/5)",
        "input": "choice",
        "choices": [
          "12 + 2/5",
          "12 : (2/5)",
          "12 · 2/5"
        ],
        "hint": "При восстановлении целого исходная часть увеличивается до целого.",
        "explanation": "Целое = часть : доля = 12 : (2/5).",
        "oracle": {
          "kind": "choice-expression",
          "expr": 30,
          "values": [
            [
              "add",
              12,
              "2/5"
            ],
            [
              "div",
              12,
              "2/5"
            ],
            [
              "mul",
              12,
              "2/5"
            ]
          ]
        },
        "id": "fraction-part-whole-05"
      },
      {
        "prompt": "В коробке 40 карандашей, 2/5 из них синие. Сколько синих карандашей?",
        "answer": "16",
        "input": "number",
        "hint": "Доля относится ко всему новому количеству карандашей.",
        "explanation": "40:5 · 2 = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            40,
            "2/5"
          ]
        },
        "id": "fraction-part-whole-06"
      },
      {
        "prompt": "Найди 3/7 от 56.",
        "answer": "24",
        "input": "number",
        "hint": "Сначала найди одну долю целого, затем нужное количество долей.",
        "explanation": "56:7 · 3 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            56,
            "3/7"
          ]
        },
        "id": "fraction-part-whole-07"
      },
      {
        "prompt": "3/7 числа равны 24. Найди всё число.",
        "answer": "56",
        "input": "number",
        "hint": "Раздели известную часть на числитель, затем умножь на знаменатель.",
        "explanation": "24:3 · 7 = 56.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            24,
            "3/7"
          ]
        },
        "id": "fraction-part-whole-08"
      },
      {
        "prompt": "Из 56 книг прочитали 24. Какую долю всех книг прочитали?",
        "answer": "3/7",
        "input": "number",
        "hint": "Сравни прочитанную часть с общим количеством.",
        "explanation": "24/56 = 3/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            24,
            56
          ]
        },
        "id": "fraction-part-whole-09"
      },
      {
        "prompt": "От 56 м провода отрезали 3/7. Сколько метров осталось?",
        "answer": "32",
        "input": "number",
        "hint": "Сначала найди отрезанную часть, затем вычти её из целого.",
        "explanation": "56 − 56 · 3/7 = 32 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            56,
            [
              "mul",
              56,
              "3/7"
            ]
          ]
        },
        "id": "fraction-part-whole-10"
      },
      {
        "prompt": "Как найти целое, если его 3/7 равны 24?",
        "answer": "24 : (3/7)",
        "input": "choice",
        "choices": [
          "24 + 3/7",
          "24 : (3/7)",
          "24 · 3/7"
        ],
        "hint": "При восстановлении целого исходная часть увеличивается до целого.",
        "explanation": "Целое = часть : доля = 24 : (3/7).",
        "oracle": {
          "kind": "choice-expression",
          "expr": 56,
          "values": [
            [
              "add",
              24,
              "3/7"
            ],
            [
              "div",
              24,
              "3/7"
            ],
            [
              "mul",
              24,
              "3/7"
            ]
          ]
        },
        "id": "fraction-part-whole-11"
      },
      {
        "prompt": "В коробке 70 карандашей, 3/7 из них синие. Сколько синих карандашей?",
        "answer": "30",
        "input": "number",
        "hint": "Доля относится ко всему новому количеству карандашей.",
        "explanation": "70:7 · 3 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            70,
            "3/7"
          ]
        },
        "id": "fraction-part-whole-12"
      },
      {
        "prompt": "Найди 4/9 от 90.",
        "answer": "40",
        "input": "number",
        "hint": "Сначала найди одну долю целого, затем нужное количество долей.",
        "explanation": "90:9 · 4 = 40.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            90,
            "4/9"
          ]
        },
        "id": "fraction-part-whole-13"
      },
      {
        "prompt": "4/9 числа равны 40. Найди всё число.",
        "answer": "90",
        "input": "number",
        "hint": "Раздели известную часть на числитель, затем умножь на знаменатель.",
        "explanation": "40:4 · 9 = 90.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            "4/9"
          ]
        },
        "id": "fraction-part-whole-14"
      },
      {
        "prompt": "Из 90 книг прочитали 40. Какую долю всех книг прочитали?",
        "answer": "4/9",
        "input": "number",
        "hint": "Сравни прочитанную часть с общим количеством.",
        "explanation": "40/90 = 4/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            90
          ]
        },
        "id": "fraction-part-whole-15"
      },
      {
        "prompt": "От 90 м провода отрезали 4/9. Сколько метров осталось?",
        "answer": "50",
        "input": "number",
        "hint": "Сначала найди отрезанную часть, затем вычти её из целого.",
        "explanation": "90 − 90 · 4/9 = 50 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            [
              "mul",
              90,
              "4/9"
            ]
          ]
        },
        "id": "fraction-part-whole-16"
      },
      {
        "prompt": "Как найти целое, если его 4/9 равны 40?",
        "answer": "40 : (4/9)",
        "input": "choice",
        "choices": [
          "40 + 4/9",
          "40 : (4/9)",
          "40 · 4/9"
        ],
        "hint": "При восстановлении целого исходная часть увеличивается до целого.",
        "explanation": "Целое = часть : доля = 40 : (4/9).",
        "oracle": {
          "kind": "choice-expression",
          "expr": 90,
          "values": [
            [
              "add",
              40,
              "4/9"
            ],
            [
              "div",
              40,
              "4/9"
            ],
            [
              "mul",
              40,
              "4/9"
            ]
          ]
        },
        "id": "fraction-part-whole-17"
      },
      {
        "prompt": "В коробке 108 карандашей, 4/9 из них синие. Сколько синих карандашей?",
        "answer": "48",
        "input": "number",
        "hint": "Доля относится ко всему новому количеству карандашей.",
        "explanation": "108:9 · 4 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            108,
            "4/9"
          ]
        },
        "id": "fraction-part-whole-18"
      }
    ]
  },
  {
    "id": "fraction-order",
    "group": "fractions",
    "title": "Дроби в смешанных выражениях",
    "goal": "Сохранять порядок действий и выбирать подходящий приём для каждой операции.",
    "covers": [
      "public:fraction-practice",
      "public:fraction-more",
      "public:v6-fraction-order"
    ],
    "prerequisites": [
      "oge-basics:fraction-common-denominator",
      "path:grade7-b-fraction-product-cancel",
      "path:grade7-b-fraction-division-meaning",
      "oge-basics:order-of-operations"
    ],
    "trainers": [
      {
        "title": "Дроби и порядок действий",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-fraction-order",
        "kind": "По шагам",
        "instruction": "Назови первое действие до начала вычисления.",
        "finish": "Реши 4 выражения."
      },
      {
        "title": "Самостоятельные действия с дробями",
        "href": "/trainers/oge-task6-fractions.html",
        "kind": "Практика",
        "instruction": "Записывай промежуточные результаты и сокращай итог.",
        "finish": "Выполни 4 новых задания."
      },
      {
        "title": "Ещё один способ проверки",
        "href": "/trainers/drobi-oge-trainer.html",
        "kind": "Другой способ",
        "instruction": "Проверь обратным действием один сложный шаг.",
        "finish": "Реши 3 выражения."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 1/2 + 1/3 · 2.",
        "answer": "7/6",
        "input": "number",
        "hint": "Умножение выполняется до сложения.",
        "explanation": "Сначала 1/3 · 2 = 2/3. Затем 1/2 + 2/3 = 7/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            [
              "mul",
              "1/3",
              2
            ]
          ]
        },
        "id": "fraction-order-01"
      },
      {
        "prompt": "Вычисли (1/2 + 1/3) · 2.",
        "answer": "5/3",
        "input": "number",
        "hint": "Сначала действие внутри скобок.",
        "explanation": "1/2 + 1/3 = 5/6; умножаем на 2: 5/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              "1/2",
              "1/3"
            ],
            2
          ]
        },
        "id": "fraction-order-02"
      },
      {
        "prompt": "Вычисли 1 − 2/3 : 2.",
        "answer": "2/3",
        "input": "number",
        "hint": "Деление выполняется раньше вычитания.",
        "explanation": "2/3 : 2 = 1/3. Затем 1 − 1/3 = 2/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            [
              "div",
              "2/3",
              2
            ]
          ]
        },
        "id": "fraction-order-03"
      },
      {
        "prompt": "Какое число получится после первого действия в выражении 1/2 + 1/3 · 2?",
        "answer": "2/3",
        "input": "choice",
        "choices": [
          "2/4",
          "2/3",
          "1/3"
        ],
        "hint": "Первое действие — умножение.",
        "explanation": "1/3 · 2 = 2/3. Остальное сложение выполняется позже.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "1/3",
            2
          ],
          "values": [
            "2/4",
            "2/3",
            "1/3"
          ]
        },
        "id": "fraction-order-04"
      },
      {
        "prompt": "Исправь ответ ученика, который в 1/2 + 1/3 · 2 сначала сложил дроби. Запиши значение исходного выражения.",
        "answer": "7/6",
        "input": "number",
        "hint": "Без скобок умножение имеет преимущество перед сложением.",
        "explanation": "Сначала 1/3 · 2 = 2/3; итог 1/2 + 2/3 = 7/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            [
              "mul",
              "1/3",
              2
            ]
          ]
        },
        "id": "fraction-order-05"
      },
      {
        "prompt": "Вычисли (2/3 + 1/3) : 2.",
        "answer": "1/2",
        "input": "number",
        "hint": "В скобках одинаковые знаменатели; затем найди половину суммы.",
        "explanation": "(2+1)/3 : 2 = 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              "2/3",
              "1/3"
            ],
            2
          ]
        },
        "id": "fraction-order-06"
      },
      {
        "prompt": "Вычисли 1/2 + 1/4 · 3.",
        "answer": "5/4",
        "input": "number",
        "hint": "Умножение выполняется до сложения.",
        "explanation": "Сначала 1/4 · 3 = 3/4. Затем 1/2 + 3/4 = 5/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            [
              "mul",
              "1/4",
              3
            ]
          ]
        },
        "id": "fraction-order-07"
      },
      {
        "prompt": "Вычисли (1/2 + 1/4) · 3.",
        "answer": "9/4",
        "input": "number",
        "hint": "Сначала действие внутри скобок.",
        "explanation": "1/2 + 1/4 = 3/4; умножаем на 3: 9/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              "1/2",
              "1/4"
            ],
            3
          ]
        },
        "id": "fraction-order-08"
      },
      {
        "prompt": "Вычисли 1 − 3/4 : 2.",
        "answer": "5/8",
        "input": "number",
        "hint": "Деление выполняется раньше вычитания.",
        "explanation": "3/4 : 2 = 3/8. Затем 1 − 3/8 = 5/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            [
              "div",
              "3/4",
              2
            ]
          ]
        },
        "id": "fraction-order-09"
      },
      {
        "prompt": "Какое число получится после первого действия в выражении 1/2 + 1/4 · 3?",
        "answer": "3/4",
        "input": "choice",
        "choices": [
          "3/5",
          "3/4",
          "1/4"
        ],
        "hint": "Первое действие — умножение.",
        "explanation": "1/4 · 3 = 3/4. Остальное сложение выполняется позже.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "1/4",
            3
          ],
          "values": [
            "3/5",
            "3/4",
            "1/4"
          ]
        },
        "id": "fraction-order-10"
      },
      {
        "prompt": "Исправь ответ ученика, который в 1/2 + 1/4 · 2 сначала сложил дроби. Запиши значение исходного выражения.",
        "answer": "1",
        "input": "number",
        "hint": "Без скобок умножение имеет преимущество перед сложением.",
        "explanation": "Сначала 1/4 · 2 = 2/4; итог 1/2 + 2/4 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            [
              "mul",
              "1/4",
              2
            ]
          ]
        },
        "id": "fraction-order-11"
      },
      {
        "prompt": "Вычисли (3/4 + 1/4) : 2.",
        "answer": "1/2",
        "input": "number",
        "hint": "В скобках одинаковые знаменатели; затем найди половину суммы.",
        "explanation": "(3+1)/4 : 2 = 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              "3/4",
              "1/4"
            ],
            2
          ]
        },
        "id": "fraction-order-12"
      },
      {
        "prompt": "Вычисли 1/2 + 1/5 · 4.",
        "answer": "13/10",
        "input": "number",
        "hint": "Умножение выполняется до сложения.",
        "explanation": "Сначала 1/5 · 4 = 4/5. Затем 1/2 + 4/5 = 13/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            [
              "mul",
              "1/5",
              4
            ]
          ]
        },
        "id": "fraction-order-13"
      },
      {
        "prompt": "Вычисли (1/2 + 1/5) · 4.",
        "answer": "14/5",
        "input": "number",
        "hint": "Сначала действие внутри скобок.",
        "explanation": "1/2 + 1/5 = 7/10; умножаем на 4: 14/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              "1/2",
              "1/5"
            ],
            4
          ]
        },
        "id": "fraction-order-14"
      },
      {
        "prompt": "Вычисли 1 − 4/5 : 2.",
        "answer": "3/5",
        "input": "number",
        "hint": "Деление выполняется раньше вычитания.",
        "explanation": "4/5 : 2 = 2/5. Затем 1 − 2/5 = 3/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            [
              "div",
              "4/5",
              2
            ]
          ]
        },
        "id": "fraction-order-15"
      },
      {
        "prompt": "Какое число получится после первого действия в выражении 1/2 + 1/5 · 4?",
        "answer": "4/5",
        "input": "choice",
        "choices": [
          "4/6",
          "4/5",
          "1/5"
        ],
        "hint": "Первое действие — умножение.",
        "explanation": "1/5 · 4 = 4/5. Остальное сложение выполняется позже.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            "1/5",
            4
          ],
          "values": [
            "4/6",
            "4/5",
            "1/5"
          ]
        },
        "id": "fraction-order-16"
      },
      {
        "prompt": "Исправь ответ ученика, который в 1/2 + 1/5 · 2 сначала сложил дроби. Запиши значение исходного выражения.",
        "answer": "9/10",
        "input": "number",
        "hint": "Без скобок умножение имеет преимущество перед сложением.",
        "explanation": "Сначала 1/5 · 2 = 2/5; итог 1/2 + 2/5 = 9/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            [
              "mul",
              "1/5",
              2
            ]
          ]
        },
        "id": "fraction-order-17"
      },
      {
        "prompt": "Вычисли (4/5 + 1/5) : 2.",
        "answer": "1/2",
        "input": "number",
        "hint": "В скобках одинаковые знаменатели; затем найди половину суммы.",
        "explanation": "(4+1)/5 : 2 = 1/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              "4/5",
              "1/5"
            ],
            2
          ]
        },
        "id": "fraction-order-18"
      }
    ]
  },
  {
    "id": "signed-number-line",
    "group": "signed",
    "title": "Ноль, левее и правее",
    "goal": "Находить отрицательные числа на прямой и сравнивать их.",
    "covers": [
      "oge-basics:negative-number-line",
      "public:negative-line",
      "public:negative-marker"
    ],
    "prerequisites": [
      "path:pre7-natural-compare"
    ],
    "trainers": [
      {
        "title": "Числовая прямая: первый шаг",
        "href": "/trainers/oge-basics/negative-number-line.html",
        "kind": "Модель",
        "instruction": "Найди ноль и сравни положение точек слева и справа.",
        "finish": "Выполни 4 задания."
      },
      {
        "title": "Передвижение маркера",
        "href": "/trainers/negative-numbers-alternative.html",
        "kind": "Другой способ",
        "instruction": "Отметь начало движения и конечную точку.",
        "finish": "Выполни 3 перемещения."
      },
      {
        "title": "Числовая прямая отдельно",
        "href": "/trainers/negative-numbers-line.html",
        "kind": "Практика",
        "instruction": "Проследи перемещение от начального числа.",
        "finish": "Реши 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Точка A находится на 3 единицы левее нуля. Назови её координату.",
        "answer": "-3",
        "input": "number",
        "hint": "Положение слева от нуля записывается со знаком минус.",
        "explanation": "Координата A равна −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            3
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -10,
          "max": 10,
          "step": 1,
          "points": [
            {
              "value": -3,
              "label": "A"
            }
          ]
        },
        "id": "signed-number-line-01"
      },
      {
        "prompt": "Сравни −3 и −5.",
        "answer": ">",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "На прямой больше то число, которое расположено правее.",
        "explanation": "−3 правее −5, поэтому −3 > −5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            -3,
            -5
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-number-line-02"
      },
      {
        "prompt": "Из точки −3 прошли 2 единицы вправо. Назови конечную координату.",
        "answer": "-1",
        "input": "number",
        "hint": "Движение вправо увеличивает число.",
        "explanation": "−3 + 2 = -1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -3,
            2
          ]
        },
        "id": "signed-number-line-03"
      },
      {
        "prompt": "Из точки 2 прошли 5 единиц влево. Назови конечную координату.",
        "answer": "-3",
        "input": "number",
        "hint": "Движение влево уменьшает число.",
        "explanation": "2 − 5 = −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            2,
            5
          ]
        },
        "id": "signed-number-line-04"
      },
      {
        "prompt": "Как расположено число −3 относительно 0?",
        "answer": "Слева",
        "input": "choice",
        "choices": [
          "В той же точке",
          "Справа",
          "Слева"
        ],
        "hint": "Отметь данное число на прямой и сравни его положение с нулём.",
        "explanation": "−3 < 0, поэтому точка слева от нуля.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            -3,
            0
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-number-line-05"
      },
      {
        "prompt": "Какое число находится правее: −5, −3 или 2?",
        "answer": "2",
        "input": "number",
        "hint": "Правее расположено наибольшее число.",
        "explanation": "Положительное 2 больше обоих отрицательных чисел.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            -5,
            -3,
            2
          ]
        },
        "id": "signed-number-line-06"
      },
      {
        "prompt": "Точка A находится на 5 единиц левее нуля. Назови её координату.",
        "answer": "-5",
        "input": "number",
        "hint": "Положение слева от нуля записывается со знаком минус.",
        "explanation": "Координата A равна −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            5
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -10,
          "max": 10,
          "step": 1,
          "points": [
            {
              "value": -5,
              "label": "A"
            }
          ]
        },
        "id": "signed-number-line-07"
      },
      {
        "prompt": "Сравни −5 и −8.",
        "answer": ">",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "На прямой больше то число, которое расположено правее.",
        "explanation": "−5 правее −8, поэтому −5 > −8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            -5,
            -8
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-number-line-08"
      },
      {
        "prompt": "Из точки −5 прошли 3 единицы вправо. Назови конечную координату.",
        "answer": "-2",
        "input": "number",
        "hint": "Движение вправо увеличивает число.",
        "explanation": "−5 + 3 = -2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -5,
            3
          ]
        },
        "id": "signed-number-line-09"
      },
      {
        "prompt": "Из точки 3 прошли 8 единиц влево. Назови конечную координату.",
        "answer": "-5",
        "input": "number",
        "hint": "Движение влево уменьшает число.",
        "explanation": "3 − 8 = −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            3,
            8
          ]
        },
        "id": "signed-number-line-10"
      },
      {
        "prompt": "Как расположено число −5 относительно 0?",
        "answer": "Слева",
        "input": "choice",
        "choices": [
          "В той же точке",
          "Справа",
          "Слева"
        ],
        "hint": "Отметь данное число на прямой и сравни его положение с нулём.",
        "explanation": "−5 < 0, поэтому точка слева от нуля.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            -5,
            0
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-number-line-11"
      },
      {
        "prompt": "Какое число находится правее: −8, −5 или 3?",
        "answer": "3",
        "input": "number",
        "hint": "Правее расположено наибольшее число.",
        "explanation": "Положительное 3 больше обоих отрицательных чисел.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            -8,
            -5,
            3
          ]
        },
        "id": "signed-number-line-12"
      },
      {
        "prompt": "Точка A находится на 7 единиц левее нуля. Назови её координату.",
        "answer": "-7",
        "input": "number",
        "hint": "Положение слева от нуля записывается со знаком минус.",
        "explanation": "Координата A равна −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            7
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -10,
          "max": 10,
          "step": 1,
          "points": [
            {
              "value": -7,
              "label": "A"
            }
          ]
        },
        "id": "signed-number-line-13"
      },
      {
        "prompt": "Сравни −7 и −11.",
        "answer": ">",
        "input": "choice",
        "choices": [
          "=",
          ">",
          "<"
        ],
        "hint": "На прямой больше то число, которое расположено правее.",
        "explanation": "−7 правее −11, поэтому −7 > −11.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            -7,
            -11
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-number-line-14"
      },
      {
        "prompt": "Из точки −7 прошли 4 единицы вправо. Назови конечную координату.",
        "answer": "-3",
        "input": "number",
        "hint": "Движение вправо увеличивает число.",
        "explanation": "−7 + 4 = -3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -7,
            4
          ]
        },
        "id": "signed-number-line-15"
      },
      {
        "prompt": "Из точки 4 прошли 11 единиц влево. Назови конечную координату.",
        "answer": "-7",
        "input": "number",
        "hint": "Движение влево уменьшает число.",
        "explanation": "4 − 11 = −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            4,
            11
          ]
        },
        "id": "signed-number-line-16"
      },
      {
        "prompt": "Как расположено число −7 относительно 0?",
        "answer": "Слева",
        "input": "choice",
        "choices": [
          "В той же точке",
          "Справа",
          "Слева"
        ],
        "hint": "Отметь данное число на прямой и сравни его положение с нулём.",
        "explanation": "−7 < 0, поэтому точка слева от нуля.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            -7,
            0
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-number-line-17"
      },
      {
        "prompt": "Какое число находится правее: −11, −7 или 4?",
        "answer": "4",
        "input": "number",
        "hint": "Правее расположено наибольшее число.",
        "explanation": "Положительное 4 больше обоих отрицательных чисел.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "max",
            -11,
            -7,
            4
          ]
        },
        "id": "signed-number-line-18"
      }
    ]
  },
  {
    "id": "signed-opposite-absolute",
    "group": "signed",
    "title": "Противоположные числа и модуль",
    "goal": "Отличать положение числа от его расстояния до нуля.",
    "covers": [
      "public:absolute-compare"
    ],
    "prerequisites": [
      "oge-basics:negative-number-line"
    ],
    "trainers": [
      {
        "title": "Кто сильнее по модулю?",
        "href": "/trainers/who-is-stronger.html",
        "kind": "Модель",
        "instruction": "Сравни расстояния до нуля, затем назови знаки чисел.",
        "finish": "Сравни 4 пары."
      },
      {
        "title": "Противоположные числа",
        "href": "/trainers/archive-5-weeks/opposite-numbers-c45c9e7e.html",
        "kind": "Другой способ",
        "instruction": "Найди точку по другую сторону нуля на том же расстоянии.",
        "finish": "Найди 4 противоположных числа."
      },
      {
        "title": "Озеро нуля",
        "href": "/trainers/archive-5-weeks/zero-lake-1d5fb3a3.html",
        "kind": "Модель",
        "instruction": "Соедини пары противоположных чисел и наблюдай нулевую сумму.",
        "finish": "Собери 3 пары."
      },
      {
        "title": "Модуль — расстояние до нуля",
        "href": "/trainers/archive-5-weeks/module-distance-1-743ac077.html",
        "kind": "Модель",
        "instruction": "Сравни положение числа и длину пути до нуля.",
        "finish": "Исследуй 3 числа с разными знаками."
      }
    ],
    "questions": [
      {
        "prompt": "Назови число, противоположное −4.",
        "answer": "4",
        "input": "number",
        "hint": "У противоположного числа тот же модуль и другой знак.",
        "explanation": "Противоположное к −4 число — 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            -4
          ]
        },
        "id": "signed-opposite-absolute-01"
      },
      {
        "prompt": "Найди модуль числа −7.",
        "answer": "7",
        "input": "number",
        "hint": "Модуль — расстояние до нуля, оно неотрицательно.",
        "explanation": "|−7| = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            -7
          ]
        },
        "id": "signed-opposite-absolute-02"
      },
      {
        "prompt": "Вычисли 4 + (−4).",
        "answer": "0",
        "input": "number",
        "hint": "Противоположные числа взаимно компенсируют друг друга.",
        "explanation": "4 + (−4) = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            -4
          ]
        },
        "id": "signed-opposite-absolute-03"
      },
      {
        "prompt": "Найди расстояние от −4 до 3.",
        "answer": "7",
        "input": "number",
        "hint": "Путь проходит через ноль: складываются обе длины.",
        "explanation": "4 + 3 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              3,
              -4
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -12,
          "max": 12,
          "step": 1,
          "points": [
            {
              "value": -4,
              "label": "A"
            },
            {
              "value": 3,
              "label": "B"
            }
          ]
        },
        "id": "signed-opposite-absolute-04"
      },
      {
        "prompt": "Сравни |−4| и |3|.",
        "answer": ">",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Для сравнения модулей сравни расстояния до нуля.",
        "explanation": "4 > 3, поэтому |−4| > |3|.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "abs",
              -4
            ],
            [
              "abs",
              3
            ]
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-opposite-absolute-05"
      },
      {
        "prompt": "Ученик написал, что число, противоположное 4, равно |4|. Запиши правильное противоположное число.",
        "answer": "-4",
        "input": "number",
        "hint": "Модуль и противоположное число — разные действия.",
        "explanation": "|4| = 4, но противоположное число равно −4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            4
          ]
        },
        "id": "signed-opposite-absolute-06"
      },
      {
        "prompt": "Назови число, противоположное −6.",
        "answer": "6",
        "input": "number",
        "hint": "У противоположного числа тот же модуль и другой знак.",
        "explanation": "Противоположное к −6 число — 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            -6
          ]
        },
        "id": "signed-opposite-absolute-07"
      },
      {
        "prompt": "Найди модуль числа −11.",
        "answer": "11",
        "input": "number",
        "hint": "Модуль — расстояние до нуля, оно неотрицательно.",
        "explanation": "|−11| = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            -11
          ]
        },
        "id": "signed-opposite-absolute-08"
      },
      {
        "prompt": "Вычисли 6 + (−6).",
        "answer": "0",
        "input": "number",
        "hint": "Противоположные числа взаимно компенсируют друг друга.",
        "explanation": "6 + (−6) = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            6,
            -6
          ]
        },
        "id": "signed-opposite-absolute-09"
      },
      {
        "prompt": "Найди расстояние от −6 до 5.",
        "answer": "11",
        "input": "number",
        "hint": "Путь проходит через ноль: складываются обе длины.",
        "explanation": "6 + 5 = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              5,
              -6
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -12,
          "max": 12,
          "step": 1,
          "points": [
            {
              "value": -6,
              "label": "A"
            },
            {
              "value": 5,
              "label": "B"
            }
          ]
        },
        "id": "signed-opposite-absolute-10"
      },
      {
        "prompt": "Сравни |−6| и |5|.",
        "answer": ">",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Для сравнения модулей сравни расстояния до нуля.",
        "explanation": "6 > 5, поэтому |−6| > |5|.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "abs",
              -6
            ],
            [
              "abs",
              5
            ]
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-opposite-absolute-11"
      },
      {
        "prompt": "Ученик написал, что число, противоположное 6, равно |6|. Запиши правильное противоположное число.",
        "answer": "-6",
        "input": "number",
        "hint": "Модуль и противоположное число — разные действия.",
        "explanation": "|6| = 6, но противоположное число равно −6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            6
          ]
        },
        "id": "signed-opposite-absolute-12"
      },
      {
        "prompt": "Назови число, противоположное −9.",
        "answer": "9",
        "input": "number",
        "hint": "У противоположного числа тот же модуль и другой знак.",
        "explanation": "Противоположное к −9 число — 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            -9
          ]
        },
        "id": "signed-opposite-absolute-13"
      },
      {
        "prompt": "Найди модуль числа −16.",
        "answer": "16",
        "input": "number",
        "hint": "Модуль — расстояние до нуля, оно неотрицательно.",
        "explanation": "|−16| = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            -16
          ]
        },
        "id": "signed-opposite-absolute-14"
      },
      {
        "prompt": "Вычисли 9 + (−9).",
        "answer": "0",
        "input": "number",
        "hint": "Противоположные числа взаимно компенсируют друг друга.",
        "explanation": "9 + (−9) = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            9,
            -9
          ]
        },
        "id": "signed-opposite-absolute-15"
      },
      {
        "prompt": "Найди расстояние от −9 до 7.",
        "answer": "16",
        "input": "number",
        "hint": "Путь проходит через ноль: складываются обе длины.",
        "explanation": "9 + 7 = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              7,
              -9
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -12,
          "max": 12,
          "step": 1,
          "points": [
            {
              "value": -9,
              "label": "A"
            },
            {
              "value": 7,
              "label": "B"
            }
          ]
        },
        "id": "signed-opposite-absolute-16"
      },
      {
        "prompt": "Сравни |−9| и |7|.",
        "answer": ">",
        "input": "choice",
        "choices": [
          ">",
          "<",
          "="
        ],
        "hint": "Для сравнения модулей сравни расстояния до нуля.",
        "explanation": "9 > 7, поэтому |−9| > |7|.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "abs",
              -9
            ],
            [
              "abs",
              7
            ]
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-opposite-absolute-17"
      },
      {
        "prompt": "Ученик написал, что число, противоположное 9, равно |9|. Запиши правильное противоположное число.",
        "answer": "-9",
        "input": "number",
        "hint": "Модуль и противоположное число — разные действия.",
        "explanation": "|9| = 9, но противоположное число равно −9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            9
          ]
        },
        "id": "signed-opposite-absolute-18"
      }
    ]
  },
  {
    "id": "signed-add-negative",
    "group": "signed",
    "title": "Станция 1. Два отрицательных",
    "goal": "Складывать два отрицательных числа через долги и движение влево.",
    "covers": [],
    "prerequisites": [
      "public:absolute-compare"
    ],
    "trainers": [
      {
        "title": "Долги складываются",
        "href": "/trainers/archive-5-weeks/negative-plus-negative-debts-deepseek-a7c7c36a.html",
        "kind": "Модель",
        "instruction": "Сложи величины двух долгов и сохрани знак задолженности.",
        "finish": "Реши 4 примера."
      },
      {
        "title": "Тот же пример на прямой",
        "href": "/trainers/negative-numbers.html",
        "kind": "Другой способ",
        "instruction": "В режиме сложения проследи прибавление отрицательного числа влево.",
        "finish": "Выполни 3 перемещения."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −4 + (−3).",
        "answer": "-7",
        "input": "number",
        "hint": "Сложи расстояния до нуля и сохрани отрицательный знак.",
        "explanation": "−4 + (−3) = −(4+3) = −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -4,
            -3
          ]
        },
        "id": "signed-add-negative-01"
      },
      {
        "prompt": "Счёт был −40 рублей. С него списали ещё 30 рублей. Каким стал счёт?",
        "answer": "-70",
        "input": "number",
        "hint": "Каждое списание ещё уменьшает значение счёта.",
        "explanation": "−40 − 30 = −70 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -40,
            30
          ]
        },
        "id": "signed-add-negative-02"
      },
      {
        "prompt": "Каков знак суммы −4 + (−4)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Ноль",
          "Положительный",
          "Отрицательный"
        ],
        "hint": "Оба слагаемых находятся слева от нуля.",
        "explanation": "Сумма двух отрицательных чисел отрицательна.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              -4,
              -4
            ],
            0
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-add-negative-03"
      },
      {
        "prompt": "Найди пропуск: −4 + □ = −9.",
        "answer": "-5",
        "input": "number",
        "hint": "Определи, на сколько ещё нужно уменьшить первое число.",
        "explanation": "□ = −9 − (−4) = −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -9,
            -4
          ]
        },
        "id": "signed-add-negative-04"
      },
      {
        "prompt": "Ученик получил 7 в примере −4 + (−3). Исправь ответ.",
        "answer": "-7",
        "input": "number",
        "hint": "Модули сложены верно; проверь знак результата.",
        "explanation": "Оба числа отрицательны, поэтому правильный результат −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -4,
            -3
          ]
        },
        "id": "signed-add-negative-05"
      },
      {
        "prompt": "Из −5 прошли влево 5 единиц. Назови конечную координату.",
        "answer": "-10",
        "input": "number",
        "hint": "Влево означает прибавить отрицательное перемещение.",
        "explanation": "−5 + (−5) = −10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -5,
            -5
          ]
        },
        "id": "signed-add-negative-06"
      },
      {
        "prompt": "Вычисли −7 + (−5).",
        "answer": "-12",
        "input": "number",
        "hint": "Сложи расстояния до нуля и сохрани отрицательный знак.",
        "explanation": "−7 + (−5) = −(7+5) = −12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -7,
            -5
          ]
        },
        "id": "signed-add-negative-07"
      },
      {
        "prompt": "Счёт был −70 рублей. С него списали ещё 50 рублей. Каким стал счёт?",
        "answer": "-120",
        "input": "number",
        "hint": "Каждое списание ещё уменьшает значение счёта.",
        "explanation": "−70 − 50 = −120 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -70,
            50
          ]
        },
        "id": "signed-add-negative-08"
      },
      {
        "prompt": "Каков знак суммы −7 + (−6)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Ноль",
          "Положительный",
          "Отрицательный"
        ],
        "hint": "Оба слагаемых находятся слева от нуля.",
        "explanation": "Сумма двух отрицательных чисел отрицательна.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              -7,
              -6
            ],
            0
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-add-negative-09"
      },
      {
        "prompt": "Найди пропуск: −7 + □ = −14.",
        "answer": "-7",
        "input": "number",
        "hint": "Определи, на сколько ещё нужно уменьшить первое число.",
        "explanation": "□ = −14 − (−7) = −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -14,
            -7
          ]
        },
        "id": "signed-add-negative-10"
      },
      {
        "prompt": "Ученик получил 12 в примере −7 + (−5). Исправь ответ.",
        "answer": "-12",
        "input": "number",
        "hint": "Модули сложены верно; проверь знак результата.",
        "explanation": "Оба числа отрицательны, поэтому правильный результат −12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -7,
            -5
          ]
        },
        "id": "signed-add-negative-11"
      },
      {
        "prompt": "Из −8 прошли влево 7 единиц. Назови конечную координату.",
        "answer": "-15",
        "input": "number",
        "hint": "Влево означает прибавить отрицательное перемещение.",
        "explanation": "−8 + (−7) = −15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -8,
            -7
          ]
        },
        "id": "signed-add-negative-12"
      },
      {
        "prompt": "Вычисли −9 + (−8).",
        "answer": "-17",
        "input": "number",
        "hint": "Сложи расстояния до нуля и сохрани отрицательный знак.",
        "explanation": "−9 + (−8) = −(9+8) = −17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -9,
            -8
          ]
        },
        "id": "signed-add-negative-13"
      },
      {
        "prompt": "Счёт был −90 рублей. С него списали ещё 80 рублей. Каким стал счёт?",
        "answer": "-170",
        "input": "number",
        "hint": "Каждое списание ещё уменьшает значение счёта.",
        "explanation": "−90 − 80 = −170 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -90,
            80
          ]
        },
        "id": "signed-add-negative-14"
      },
      {
        "prompt": "Каков знак суммы −9 + (−9)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Ноль",
          "Положительный",
          "Отрицательный"
        ],
        "hint": "Оба слагаемых находятся слева от нуля.",
        "explanation": "Сумма двух отрицательных чисел отрицательна.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              -9,
              -9
            ],
            0
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "signed-add-negative-15"
      },
      {
        "prompt": "Найди пропуск: −9 + □ = −19.",
        "answer": "-10",
        "input": "number",
        "hint": "Определи, на сколько ещё нужно уменьшить первое число.",
        "explanation": "□ = −19 − (−9) = −10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -19,
            -9
          ]
        },
        "id": "signed-add-negative-16"
      },
      {
        "prompt": "Ученик получил 17 в примере −9 + (−8). Исправь ответ.",
        "answer": "-17",
        "input": "number",
        "hint": "Модули сложены верно; проверь знак результата.",
        "explanation": "Оба числа отрицательны, поэтому правильный результат −17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -9,
            -8
          ]
        },
        "id": "signed-add-negative-17"
      },
      {
        "prompt": "Из −10 прошли влево 10 единиц. Назови конечную координату.",
        "answer": "-20",
        "input": "number",
        "hint": "Влево означает прибавить отрицательное перемещение.",
        "explanation": "−10 + (−10) = −20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -10,
            -10
          ]
        },
        "id": "signed-add-negative-18"
      }
    ]
  },
  {
    "id": "signed-add-different",
    "group": "signed",
    "title": "Станция 2. Разные знаки",
    "goal": "Вычитать модули и определять знак по большему модулю.",
    "covers": [
      "oge-basics:negative-add-subtract",
      "public:negative-explore"
    ],
    "prerequisites": [
      "public:absolute-compare"
    ],
    "trainers": [
      {
        "title": "Сражение чисел",
        "href": "/trainers/archive-5-weeks/battle-numbers-2-7a0a8446.html",
        "kind": "Модель",
        "instruction": "Сопоставь положительные и отрицательные единицы, найди оставшиеся.",
        "finish": "Реши 4 примера."
      },
      {
        "title": "Сложение со знаками",
        "href": "/trainers/oge-basics/negative-add-subtract.html",
        "kind": "По шагам",
        "instruction": "Сначала сравни модули, затем вычисли разность.",
        "finish": "Реши 4 примера разных знаков."
      },
      {
        "title": "Прямая и движение",
        "href": "/trainers/negative-numbers.html",
        "kind": "Другой способ",
        "instruction": "Проверь сумму перемещением по прямой.",
        "finish": "Проверь 3 результата."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −7 + 4.",
        "answer": "-3",
        "input": "number",
        "hint": "Какого знака больше по модулю? Останутся единицы этого знака.",
        "explanation": "Отрицательных единиц больше: 7 − 4 = 3; ответ −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -7,
            4
          ]
        },
        "id": "signed-add-different-01"
      },
      {
        "prompt": "Вычисли 8 + (−4).",
        "answer": "4",
        "input": "number",
        "hint": "Модуль положительного слагаемого больше.",
        "explanation": "8 − 4 = 4; результат положителен.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            8,
            -4
          ]
        },
        "id": "signed-add-different-02"
      },
      {
        "prompt": "Вычисли −11 + 11.",
        "answer": "0",
        "input": "number",
        "hint": "Проверь, являются ли слагаемые противоположными.",
        "explanation": "Слагаемые противоположны, их сумма 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -11,
            11
          ]
        },
        "id": "signed-add-different-03"
      },
      {
        "prompt": "Каков знак суммы 4 + (−9)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Отрицательный",
          "Ноль",
          "Положительный"
        ],
        "hint": "Сравни модули слагаемых.",
        "explanation": "9 > 4; после взаимного уничтожения остаются отрицательные единицы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              4,
              -9
            ],
            0
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "signed-add-different-04"
      },
      {
        "prompt": "Температура была −4 °C и повысилась на 10 °C. Какой стала температура?",
        "answer": "6",
        "input": "number",
        "hint": "Повышение температуры означает положительное изменение.",
        "explanation": "−4 + 10 = 6 °C.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -4,
            10
          ]
        },
        "id": "signed-add-different-05"
      },
      {
        "prompt": "Ученик сложил модули в 7 + (−5) и получил 12. Запиши правильный ответ.",
        "answer": "2",
        "input": "number",
        "hint": "При разных знаках модули вычитаются.",
        "explanation": "7 + (−5) = 7 − 5 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            7,
            -5
          ]
        },
        "id": "signed-add-different-06"
      },
      {
        "prompt": "Вычисли −9 + 6.",
        "answer": "-3",
        "input": "number",
        "hint": "Какого знака больше по модулю? Останутся единицы этого знака.",
        "explanation": "Отрицательных единиц больше: 9 − 6 = 3; ответ −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -9,
            6
          ]
        },
        "id": "signed-add-different-07"
      },
      {
        "prompt": "Вычисли 10 + (−6).",
        "answer": "4",
        "input": "number",
        "hint": "Модуль положительного слагаемого больше.",
        "explanation": "10 − 6 = 4; результат положителен.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            10,
            -6
          ]
        },
        "id": "signed-add-different-08"
      },
      {
        "prompt": "Вычисли −15 + 15.",
        "answer": "0",
        "input": "number",
        "hint": "Проверь, являются ли слагаемые противоположными.",
        "explanation": "Слагаемые противоположны, их сумма 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -15,
            15
          ]
        },
        "id": "signed-add-different-09"
      },
      {
        "prompt": "Каков знак суммы 6 + (−11)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Отрицательный",
          "Ноль",
          "Положительный"
        ],
        "hint": "Сравни модули слагаемых.",
        "explanation": "11 > 6; после взаимного уничтожения остаются отрицательные единицы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              6,
              -11
            ],
            0
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "signed-add-different-10"
      },
      {
        "prompt": "Температура была −6 °C и повысилась на 12 °C. Какой стала температура?",
        "answer": "6",
        "input": "number",
        "hint": "Повышение температуры означает положительное изменение.",
        "explanation": "−6 + 12 = 6 °C.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -6,
            12
          ]
        },
        "id": "signed-add-different-11"
      },
      {
        "prompt": "Ученик сложил модули в 9 + (−7) и получил 16. Запиши правильный ответ.",
        "answer": "2",
        "input": "number",
        "hint": "При разных знаках модули вычитаются.",
        "explanation": "9 + (−7) = 9 − 7 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            9,
            -7
          ]
        },
        "id": "signed-add-different-12"
      },
      {
        "prompt": "Вычисли −12 + 8.",
        "answer": "-4",
        "input": "number",
        "hint": "Какого знака больше по модулю? Останутся единицы этого знака.",
        "explanation": "Отрицательных единиц больше: 12 − 8 = 4; ответ −4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -12,
            8
          ]
        },
        "id": "signed-add-different-13"
      },
      {
        "prompt": "Вычисли 13 + (−8).",
        "answer": "5",
        "input": "number",
        "hint": "Модуль положительного слагаемого больше.",
        "explanation": "13 − 8 = 5; результат положителен.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            13,
            -8
          ]
        },
        "id": "signed-add-different-14"
      },
      {
        "prompt": "Вычисли −20 + 20.",
        "answer": "0",
        "input": "number",
        "hint": "Проверь, являются ли слагаемые противоположными.",
        "explanation": "Слагаемые противоположны, их сумма 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -20,
            20
          ]
        },
        "id": "signed-add-different-15"
      },
      {
        "prompt": "Каков знак суммы 8 + (−14)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Отрицательный",
          "Ноль",
          "Положительный"
        ],
        "hint": "Сравни модули слагаемых.",
        "explanation": "14 > 8; после взаимного уничтожения остаются отрицательные единицы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              8,
              -14
            ],
            0
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "signed-add-different-16"
      },
      {
        "prompt": "Температура была −8 °C и повысилась на 15 °C. Какой стала температура?",
        "answer": "7",
        "input": "number",
        "hint": "Повышение температуры означает положительное изменение.",
        "explanation": "−8 + 15 = 7 °C.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -8,
            15
          ]
        },
        "id": "signed-add-different-17"
      },
      {
        "prompt": "Ученик сложил модули в 12 + (−9) и получил 21. Запиши правильный ответ.",
        "answer": "3",
        "input": "number",
        "hint": "При разных знаках модули вычитаются.",
        "explanation": "12 + (−9) = 12 − 9 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            12,
            -9
          ]
        },
        "id": "signed-add-different-18"
      }
    ]
  },
  {
    "id": "signed-subtraction",
    "group": "signed",
    "title": "Станция 3. Вычесть — прибавить противоположное",
    "goal": "Различать вычитание положительного и отрицательного числа.",
    "covers": [
      "public:v6-subtract-negative"
    ],
    "prerequisites": [
      "oge-basics:negative-add-subtract"
    ],
    "trainers": [
      {
        "title": "Вычитание как сложение",
        "href": "/trainers/archive-5-weeks/subtraction-as-addition-b5b0d37d.html",
        "kind": "Модель",
        "instruction": "Замени только вычитаемое противоположным и знак действия на плюс.",
        "finish": "Преобразуй и реши 4 примера."
      },
      {
        "title": "Вычитаем отрицательное число",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-subtract-negative",
        "kind": "По шагам",
        "instruction": "После замены проверь направление движения.",
        "finish": "Выполни 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 6 − (−4).",
        "answer": "10",
        "input": "number",
        "hint": "Вычесть отрицательное — прибавить противоположное.",
        "explanation": "6 − (−4) = 6 + 4 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            6,
            -4
          ]
        },
        "id": "signed-subtraction-01"
      },
      {
        "prompt": "Вычисли −6 − 5.",
        "answer": "-11",
        "input": "number",
        "hint": "Вычитается положительное число: движение влево.",
        "explanation": "−6 − 5 = −(6+5) = −11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -6,
            5
          ]
        },
        "id": "signed-subtraction-02"
      },
      {
        "prompt": "Вычисли −6 − (−4).",
        "answer": "-2",
        "input": "number",
        "hint": "После замены получится сложение разных знаков.",
        "explanation": "−6 − (−4) = −6 + 4 = -2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -6,
            -4
          ]
        },
        "id": "signed-subtraction-03"
      },
      {
        "prompt": "Как переписать 7 − (−6)?",
        "answer": "7 + 6",
        "input": "choice",
        "choices": [
          "7 − 6",
          "−7 + 6",
          "7 + 6"
        ],
        "hint": "Первое число не меняется; меняются действие и вычитаемое.",
        "explanation": "7 − (−6) = 7 + 6.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            7,
            -6
          ],
          "values": [
            [
              "sub",
              7,
              6
            ],
            [
              "add",
              -7,
              6
            ],
            [
              "add",
              7,
              6
            ]
          ]
        },
        "id": "signed-subtraction-04"
      },
      {
        "prompt": "Найди разность координат: 7 − (−8).",
        "answer": "15",
        "input": "number",
        "hint": "Отрицательное второе число нужно заменить противоположным.",
        "explanation": "7 + 8 = 15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            7,
            -8
          ]
        },
        "id": "signed-subtraction-05"
      },
      {
        "prompt": "Найди вычитаемое: 6 − □ = −4.",
        "answer": "10",
        "input": "number",
        "hint": "Вычитаемое равно уменьшаемому минус разность.",
        "explanation": "□ = 6 − (−4) = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            6,
            -4
          ]
        },
        "id": "signed-subtraction-06"
      },
      {
        "prompt": "Вычисли 9 − (−5).",
        "answer": "14",
        "input": "number",
        "hint": "Вычесть отрицательное — прибавить противоположное.",
        "explanation": "9 − (−5) = 9 + 5 = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            -5
          ]
        },
        "id": "signed-subtraction-07"
      },
      {
        "prompt": "Вычисли −9 − 6.",
        "answer": "-15",
        "input": "number",
        "hint": "Вычитается положительное число: движение влево.",
        "explanation": "−9 − 6 = −(9+6) = −15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -9,
            6
          ]
        },
        "id": "signed-subtraction-08"
      },
      {
        "prompt": "Вычисли −9 − (−5).",
        "answer": "-4",
        "input": "number",
        "hint": "После замены получится сложение разных знаков.",
        "explanation": "−9 − (−5) = −9 + 5 = -4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -9,
            -5
          ]
        },
        "id": "signed-subtraction-09"
      },
      {
        "prompt": "Как переписать 10 − (−7)?",
        "answer": "10 + 7",
        "input": "choice",
        "choices": [
          "10 − 7",
          "−10 + 7",
          "10 + 7"
        ],
        "hint": "Первое число не меняется; меняются действие и вычитаемое.",
        "explanation": "10 − (−7) = 10 + 7.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            10,
            -7
          ],
          "values": [
            [
              "sub",
              10,
              7
            ],
            [
              "add",
              -10,
              7
            ],
            [
              "add",
              10,
              7
            ]
          ]
        },
        "id": "signed-subtraction-10"
      },
      {
        "prompt": "Найди разность координат: 8 − (−11).",
        "answer": "19",
        "input": "number",
        "hint": "Отрицательное второе число нужно заменить противоположным.",
        "explanation": "8 + 11 = 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            8,
            -11
          ]
        },
        "id": "signed-subtraction-11"
      },
      {
        "prompt": "Найди вычитаемое: 9 − □ = −5.",
        "answer": "14",
        "input": "number",
        "hint": "Вычитаемое равно уменьшаемому минус разность.",
        "explanation": "□ = 9 − (−5) = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            -5
          ]
        },
        "id": "signed-subtraction-12"
      },
      {
        "prompt": "Вычисли 13 − (−8).",
        "answer": "21",
        "input": "number",
        "hint": "Вычесть отрицательное — прибавить противоположное.",
        "explanation": "13 − (−8) = 13 + 8 = 21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            13,
            -8
          ]
        },
        "id": "signed-subtraction-13"
      },
      {
        "prompt": "Вычисли −13 − 9.",
        "answer": "-22",
        "input": "number",
        "hint": "Вычитается положительное число: движение влево.",
        "explanation": "−13 − 9 = −(13+9) = −22.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -13,
            9
          ]
        },
        "id": "signed-subtraction-14"
      },
      {
        "prompt": "Вычисли −13 − (−8).",
        "answer": "-5",
        "input": "number",
        "hint": "После замены получится сложение разных знаков.",
        "explanation": "−13 − (−8) = −13 + 8 = -5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -13,
            -8
          ]
        },
        "id": "signed-subtraction-15"
      },
      {
        "prompt": "Как переписать 14 − (−10)?",
        "answer": "14 + 10",
        "input": "choice",
        "choices": [
          "14 − 10",
          "−14 + 10",
          "14 + 10"
        ],
        "hint": "Первое число не меняется; меняются действие и вычитаемое.",
        "explanation": "14 − (−10) = 14 + 10.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            14,
            -10
          ],
          "values": [
            [
              "sub",
              14,
              10
            ],
            [
              "add",
              -14,
              10
            ],
            [
              "add",
              14,
              10
            ]
          ]
        },
        "id": "signed-subtraction-16"
      },
      {
        "prompt": "Найди разность координат: 11 − (−15).",
        "answer": "26",
        "input": "number",
        "hint": "Отрицательное второе число нужно заменить противоположным.",
        "explanation": "11 + 15 = 26.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            11,
            -15
          ]
        },
        "id": "signed-subtraction-17"
      },
      {
        "prompt": "Найди вычитаемое: 13 − □ = −8.",
        "answer": "21",
        "input": "number",
        "hint": "Вычитаемое равно уменьшаемому минус разность.",
        "explanation": "□ = 13 − (−8) = 21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            13,
            -8
          ]
        },
        "id": "signed-subtraction-18"
      }
    ]
  },
  {
    "id": "signed-brackets",
    "group": "signed",
    "title": "Станция 4. Скобки и знаки подряд",
    "goal": "Сохранять знак числа и действие при раскрытии числовых скобок.",
    "covers": [],
    "prerequisites": [
      "public:v6-subtract-negative"
    ],
    "trainers": [
      {
        "title": "Скобки и знаки",
        "href": "/trainers/archive-5-weeks/brackets-and-signs-dc000366.html",
        "kind": "По шагам",
        "instruction": "Отдельно назови внешний знак и знак числа в скобках.",
        "finish": "Упрости 4 записи."
      },
      {
        "title": "Сначала перепиши",
        "href": "/trainers/archive-5-weeks/rewrite-before-calc-1-7e6bf87d.html",
        "kind": "Другой способ",
        "instruction": "Сначала получи простую запись без соседних знаков, потом вычисляй.",
        "finish": "Выполни 4 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −(8 − 3).",
        "answer": "-5",
        "input": "number",
        "hint": "Сначала можно вычислить скобку, затем взять противоположное число.",
        "explanation": "−(8 − 3) = −5 = -5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "sub",
              8,
              3
            ]
          ]
        },
        "id": "signed-brackets-01"
      },
      {
        "prompt": "Вычисли −(−8) + (−3).",
        "answer": "5",
        "input": "number",
        "hint": "Противоположное отрицательному числу положительно.",
        "explanation": "−(−8) + (−3) = 8 − 3 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "neg",
              -8
            ],
            -3
          ]
        },
        "id": "signed-brackets-02"
      },
      {
        "prompt": "Вычисли 8 + (−3) − (−2).",
        "answer": "7",
        "input": "number",
        "hint": "Перепиши каждую пару знаков отдельно.",
        "explanation": "8 − 3 + 2 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              8,
              -3
            ],
            -2
          ]
        },
        "id": "signed-brackets-03"
      },
      {
        "prompt": "Какая запись равна −(−8 − 3)?",
        "answer": "8 + 3",
        "input": "choice",
        "choices": [
          "8 − 3",
          "8 + 3",
          "−8 − 3"
        ],
        "hint": "Минус перед скобкой меняет знак каждого слагаемого внутри.",
        "explanation": "−(−8 − 3) = 8 + 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "sub",
              -8,
              3
            ]
          ],
          "values": [
            [
              "sub",
              8,
              3
            ],
            [
              "add",
              8,
              3
            ],
            [
              "sub",
              -8,
              3
            ]
          ]
        },
        "id": "signed-brackets-04"
      },
      {
        "prompt": "Вычисли +(−10).",
        "answer": "-10",
        "input": "number",
        "hint": "Плюс перед скобкой не меняет число в ней.",
        "explanation": "+(−10) = −10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            0,
            -10
          ]
        },
        "id": "signed-brackets-05"
      },
      {
        "prompt": "Ученик заменил 9 − (+4) на 9 + 4. Исправь результат.",
        "answer": "5",
        "input": "number",
        "hint": "Вычитается положительное число; плюс внутри скобки не отменяет вычитание.",
        "explanation": "9 − (+4) = 9 − 4 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            4
          ]
        },
        "id": "signed-brackets-06"
      },
      {
        "prompt": "Вычисли −(11 − 5).",
        "answer": "-6",
        "input": "number",
        "hint": "Сначала можно вычислить скобку, затем взять противоположное число.",
        "explanation": "−(11 − 5) = −6 = -6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "sub",
              11,
              5
            ]
          ]
        },
        "id": "signed-brackets-07"
      },
      {
        "prompt": "Вычисли −(−11) + (−5).",
        "answer": "6",
        "input": "number",
        "hint": "Противоположное отрицательному числу положительно.",
        "explanation": "−(−11) + (−5) = 11 − 5 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "neg",
              -11
            ],
            -5
          ]
        },
        "id": "signed-brackets-08"
      },
      {
        "prompt": "Вычисли 11 + (−5) − (−4).",
        "answer": "10",
        "input": "number",
        "hint": "Перепиши каждую пару знаков отдельно.",
        "explanation": "11 − 5 + 4 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              11,
              -5
            ],
            -4
          ]
        },
        "id": "signed-brackets-09"
      },
      {
        "prompt": "Какая запись равна −(−11 − 5)?",
        "answer": "11 + 5",
        "input": "choice",
        "choices": [
          "11 − 5",
          "11 + 5",
          "−11 − 5"
        ],
        "hint": "Минус перед скобкой меняет знак каждого слагаемого внутри.",
        "explanation": "−(−11 − 5) = 11 + 5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "sub",
              -11,
              5
            ]
          ],
          "values": [
            [
              "sub",
              11,
              5
            ],
            [
              "add",
              11,
              5
            ],
            [
              "sub",
              -11,
              5
            ]
          ]
        },
        "id": "signed-brackets-10"
      },
      {
        "prompt": "Вычисли +(−15).",
        "answer": "-15",
        "input": "number",
        "hint": "Плюс перед скобкой не меняет число в ней.",
        "explanation": "+(−15) = −15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            0,
            -15
          ]
        },
        "id": "signed-brackets-11"
      },
      {
        "prompt": "Ученик заменил 12 − (+6) на 12 + 6. Исправь результат.",
        "answer": "6",
        "input": "number",
        "hint": "Вычитается положительное число; плюс внутри скобки не отменяет вычитание.",
        "explanation": "12 − (+6) = 12 − 6 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            12,
            6
          ]
        },
        "id": "signed-brackets-12"
      },
      {
        "prompt": "Вычисли −(15 − 7).",
        "answer": "-8",
        "input": "number",
        "hint": "Сначала можно вычислить скобку, затем взять противоположное число.",
        "explanation": "−(15 − 7) = −8 = -8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "sub",
              15,
              7
            ]
          ]
        },
        "id": "signed-brackets-13"
      },
      {
        "prompt": "Вычисли −(−15) + (−7).",
        "answer": "8",
        "input": "number",
        "hint": "Противоположное отрицательному числу положительно.",
        "explanation": "−(−15) + (−7) = 15 − 7 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "neg",
              -15
            ],
            -7
          ]
        },
        "id": "signed-brackets-14"
      },
      {
        "prompt": "Вычисли 15 + (−7) − (−6).",
        "answer": "14",
        "input": "number",
        "hint": "Перепиши каждую пару знаков отдельно.",
        "explanation": "15 − 7 + 6 = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              15,
              -7
            ],
            -6
          ]
        },
        "id": "signed-brackets-15"
      },
      {
        "prompt": "Какая запись равна −(−15 − 7)?",
        "answer": "15 + 7",
        "input": "choice",
        "choices": [
          "15 − 7",
          "15 + 7",
          "−15 − 7"
        ],
        "hint": "Минус перед скобкой меняет знак каждого слагаемого внутри.",
        "explanation": "−(−15 − 7) = 15 + 7.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "sub",
              -15,
              7
            ]
          ],
          "values": [
            [
              "sub",
              15,
              7
            ],
            [
              "add",
              15,
              7
            ],
            [
              "sub",
              -15,
              7
            ]
          ]
        },
        "id": "signed-brackets-16"
      },
      {
        "prompt": "Вычисли +(−21).",
        "answer": "-21",
        "input": "number",
        "hint": "Плюс перед скобкой не меняет число в ней.",
        "explanation": "+(−21) = −21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            0,
            -21
          ]
        },
        "id": "signed-brackets-17"
      },
      {
        "prompt": "Ученик заменил 16 − (+8) на 16 + 8. Исправь результат.",
        "answer": "8",
        "input": "number",
        "hint": "Вычитается положительное число; плюс внутри скобки не отменяет вычитание.",
        "explanation": "16 − (+8) = 16 − 8 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            16,
            8
          ]
        },
        "id": "signed-brackets-18"
      }
    ]
  },
  {
    "id": "signed-multiplication",
    "group": "signed",
    "title": "Умножение: сначала знак, потом модуль",
    "goal": "Определять знак произведения и различать скобки при возведении в квадрат.",
    "covers": [
      "public:signed-multiply"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/multiplication-mixed",
      "public:absolute-compare"
    ],
    "trainers": [
      {
        "title": "Умножение чисел со знаками",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-multiply-sign",
        "kind": "По шагам",
        "instruction": "Сначала определи знак, затем умножь модули.",
        "finish": "Выполни 4 произведения."
      },
      {
        "title": "Знаки и порядок действий",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-properties-order",
        "kind": "Другой способ",
        "instruction": "Проверь знак каждого множителя, включая число в скобках.",
        "finish": "Реши 3 выражения."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли (−3) · 4.",
        "answer": "-12",
        "input": "number",
        "hint": "Разные знаки множителей дают отрицательное произведение.",
        "explanation": "Модули: 3 · 4 = 12; результат −12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -3,
            4
          ]
        },
        "id": "signed-multiplication-01"
      },
      {
        "prompt": "Вычисли (−4) · (−4).",
        "answer": "16",
        "input": "number",
        "hint": "Одинаковые отрицательные знаки дают положительное произведение.",
        "explanation": "(4) · 4 = 16; знак плюс.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -4,
            -4
          ]
        },
        "id": "signed-multiplication-02"
      },
      {
        "prompt": "Каков знак произведения (−3) · (−4) · (−2)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Положительный",
          "Отрицательный",
          "Ноль"
        ],
        "hint": "Сосчитай отрицательные множители; их пары дают плюс.",
        "explanation": "Три отрицательных множителя: одна пара даёт плюс, оставшийся минус делает произведение отрицательным.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              -3,
              -4,
              -2
            ],
            0
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-multiplication-03"
      },
      {
        "prompt": "Вычисли (−5)².",
        "answer": "25",
        "input": "number",
        "hint": "В квадрат возводится всё число вместе со знаком.",
        "explanation": "(−5) · (−5) = 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            -5,
            2
          ]
        },
        "id": "signed-multiplication-04"
      },
      {
        "prompt": "Вычисли −5². Скобок вокруг отрицательного числа нет.",
        "answer": "-25",
        "input": "number",
        "hint": "Степень относится к положительному основанию, затем применяется внешний минус.",
        "explanation": "−5² = −(5 · 5) = −25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "pow",
              5,
              2
            ]
          ]
        },
        "id": "signed-multiplication-05"
      },
      {
        "prompt": "Температура каждый час менялась на −3 °C. На сколько градусов она изменилась за 5 часов? Укажи знак изменения.",
        "answer": "-15",
        "input": "number",
        "hint": "Одинаковое изменение повторяется несколько раз.",
        "explanation": "Изменение равно (−3) · 5 = −15 °C.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -3,
            5
          ]
        },
        "id": "signed-multiplication-06"
      },
      {
        "prompt": "Вычисли (−5) · 6.",
        "answer": "-30",
        "input": "number",
        "hint": "Разные знаки множителей дают отрицательное произведение.",
        "explanation": "Модули: 5 · 6 = 30; результат −30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -5,
            6
          ]
        },
        "id": "signed-multiplication-07"
      },
      {
        "prompt": "Вычисли (−6) · (−6).",
        "answer": "36",
        "input": "number",
        "hint": "Одинаковые отрицательные знаки дают положительное произведение.",
        "explanation": "(6) · 6 = 36; знак плюс.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -6,
            -6
          ]
        },
        "id": "signed-multiplication-08"
      },
      {
        "prompt": "Каков знак произведения (−5) · (−6) · (−2)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Положительный",
          "Отрицательный",
          "Ноль"
        ],
        "hint": "Сосчитай отрицательные множители; их пары дают плюс.",
        "explanation": "Три отрицательных множителя: одна пара даёт плюс, оставшийся минус делает произведение отрицательным.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              -5,
              -6,
              -2
            ],
            0
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-multiplication-09"
      },
      {
        "prompt": "Вычисли (−7)².",
        "answer": "49",
        "input": "number",
        "hint": "В квадрат возводится всё число вместе со знаком.",
        "explanation": "(−7) · (−7) = 49.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            -7,
            2
          ]
        },
        "id": "signed-multiplication-10"
      },
      {
        "prompt": "Вычисли −7². Скобок вокруг отрицательного числа нет.",
        "answer": "-49",
        "input": "number",
        "hint": "Степень относится к положительному основанию, затем применяется внешний минус.",
        "explanation": "−7² = −(7 · 7) = −49.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "pow",
              7,
              2
            ]
          ]
        },
        "id": "signed-multiplication-11"
      },
      {
        "prompt": "Температура каждый час менялась на −5 °C. На сколько градусов она изменилась за 7 часов? Укажи знак изменения.",
        "answer": "-35",
        "input": "number",
        "hint": "Одинаковое изменение повторяется несколько раз.",
        "explanation": "Изменение равно (−5) · 7 = −35 °C.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -5,
            7
          ]
        },
        "id": "signed-multiplication-12"
      },
      {
        "prompt": "Вычисли (−7) · 8.",
        "answer": "-56",
        "input": "number",
        "hint": "Разные знаки множителей дают отрицательное произведение.",
        "explanation": "Модули: 7 · 8 = 56; результат −56.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -7,
            8
          ]
        },
        "id": "signed-multiplication-13"
      },
      {
        "prompt": "Вычисли (−8) · (−8).",
        "answer": "64",
        "input": "number",
        "hint": "Одинаковые отрицательные знаки дают положительное произведение.",
        "explanation": "(8) · 8 = 64; знак плюс.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -8,
            -8
          ]
        },
        "id": "signed-multiplication-14"
      },
      {
        "prompt": "Каков знак произведения (−7) · (−8) · (−2)?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Положительный",
          "Отрицательный",
          "Ноль"
        ],
        "hint": "Сосчитай отрицательные множители; их пары дают плюс.",
        "explanation": "Три отрицательных множителя: одна пара даёт плюс, оставшийся минус делает произведение отрицательным.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              -7,
              -8,
              -2
            ],
            0
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-multiplication-15"
      },
      {
        "prompt": "Вычисли (−9)².",
        "answer": "81",
        "input": "number",
        "hint": "В квадрат возводится всё число вместе со знаком.",
        "explanation": "(−9) · (−9) = 81.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            -9,
            2
          ]
        },
        "id": "signed-multiplication-16"
      },
      {
        "prompt": "Вычисли −9². Скобок вокруг отрицательного числа нет.",
        "answer": "-81",
        "input": "number",
        "hint": "Степень относится к положительному основанию, затем применяется внешний минус.",
        "explanation": "−9² = −(9 · 9) = −81.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "pow",
              9,
              2
            ]
          ]
        },
        "id": "signed-multiplication-17"
      },
      {
        "prompt": "Температура каждый час менялась на −7 °C. На сколько градусов она изменилась за 9 часов? Укажи знак изменения.",
        "answer": "-63",
        "input": "number",
        "hint": "Одинаковое изменение повторяется несколько раз.",
        "explanation": "Изменение равно (−7) · 9 = −63 °C.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -7,
            9
          ]
        },
        "id": "signed-multiplication-18"
      }
    ]
  },
  {
    "id": "signed-division",
    "group": "signed",
    "title": "Деление чисел со знаками",
    "goal": "Определять знак частного и проверять результат умножением.",
    "covers": [
      "public:signed-divide"
    ],
    "prerequisites": [
      "public:signed-multiply",
      "oge-basics:multiplication-division/tabular-division"
    ],
    "trainers": [
      {
        "title": "Знаки в частном",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-divide-sign",
        "kind": "По шагам",
        "instruction": "Определи знак результата, затем раздели модули.",
        "finish": "Реши 4 деления."
      },
      {
        "title": "Проверяем деление умножением",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-multiply-sign",
        "kind": "Другой способ",
        "instruction": "Умножь найденное частное на делитель.",
        "finish": "Проверь 3 частных."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −12 : 3.",
        "answer": "-4",
        "input": "number",
        "hint": "При разных знаках частное отрицательно.",
        "explanation": "−12 : 3 = −4; проверка: −4 · 3 = −12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -12,
            3
          ]
        },
        "id": "signed-division-01"
      },
      {
        "prompt": "Вычисли 15 : (−3).",
        "answer": "-5",
        "input": "number",
        "hint": "Знак частного определяется знаками делимого и делителя.",
        "explanation": "15 : (−3) = −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            15,
            -3
          ]
        },
        "id": "signed-division-02"
      },
      {
        "prompt": "Вычисли −18 : (−3).",
        "answer": "6",
        "input": "number",
        "hint": "Оба числа отрицательны, поэтому частное положительно.",
        "explanation": "−18 : (−3) = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -18,
            -3
          ]
        },
        "id": "signed-division-03"
      },
      {
        "prompt": "Как проверить частное −4 в примере 12 : (−3)?",
        "answer": "(−4) · (−3)",
        "input": "choice",
        "choices": [
          "(−4) + (−3)",
          "(−4) : (−3)",
          "(−4) · (−3)"
        ],
        "hint": "Проверка частного должна восстановить положительное делимое.",
        "explanation": "(−4) · (−3) = 12, исходное делимое восстановлено.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 12,
          "values": [
            [
              "add",
              -4,
              -3
            ],
            [
              "div",
              -4,
              -3
            ],
            [
              "mul",
              -4,
              -3
            ]
          ]
        },
        "id": "signed-division-04"
      },
      {
        "prompt": "Вычисли 0 : (−4).",
        "answer": "0",
        "input": "number",
        "hint": "Нулевое делимое можно делить на ненулевое число.",
        "explanation": "0 : (−4) = 0: произведение 0 на делитель равно 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            0,
            -4
          ]
        },
        "id": "signed-division-05"
      },
      {
        "prompt": "Вычисли −3 : 4. Ответ можно записать дробью.",
        "answer": "-3/4",
        "input": "number",
        "hint": "Если деление не целое, сохрани точную дробь.",
        "explanation": "−3 : 4 = -3/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -3,
            4
          ]
        },
        "id": "signed-division-06"
      },
      {
        "prompt": "Вычисли −30 : 5.",
        "answer": "-6",
        "input": "number",
        "hint": "При разных знаках частное отрицательно.",
        "explanation": "−30 : 5 = −6; проверка: −6 · 5 = −30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -30,
            5
          ]
        },
        "id": "signed-division-07"
      },
      {
        "prompt": "Вычисли 35 : (−5).",
        "answer": "-7",
        "input": "number",
        "hint": "Знак частного определяется знаками делимого и делителя.",
        "explanation": "35 : (−5) = −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            35,
            -5
          ]
        },
        "id": "signed-division-08"
      },
      {
        "prompt": "Вычисли −40 : (−5).",
        "answer": "8",
        "input": "number",
        "hint": "Оба числа отрицательны, поэтому частное положительно.",
        "explanation": "−40 : (−5) = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -40,
            -5
          ]
        },
        "id": "signed-division-09"
      },
      {
        "prompt": "Как проверить частное −6 в примере 30 : (−5)?",
        "answer": "(−6) · (−5)",
        "input": "choice",
        "choices": [
          "(−6) + (−5)",
          "(−6) : (−5)",
          "(−6) · (−5)"
        ],
        "hint": "Проверка частного должна восстановить положительное делимое.",
        "explanation": "(−6) · (−5) = 30, исходное делимое восстановлено.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 30,
          "values": [
            [
              "add",
              -6,
              -5
            ],
            [
              "div",
              -6,
              -5
            ],
            [
              "mul",
              -6,
              -5
            ]
          ]
        },
        "id": "signed-division-10"
      },
      {
        "prompt": "Вычисли 0 : (−6).",
        "answer": "0",
        "input": "number",
        "hint": "Нулевое делимое можно делить на ненулевое число.",
        "explanation": "0 : (−6) = 0: произведение 0 на делитель равно 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            0,
            -6
          ]
        },
        "id": "signed-division-11"
      },
      {
        "prompt": "Вычисли −5 : 6. Ответ можно записать дробью.",
        "answer": "-5/6",
        "input": "number",
        "hint": "Если деление не целое, сохрани точную дробь.",
        "explanation": "−5 : 6 = -5/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -5,
            6
          ]
        },
        "id": "signed-division-12"
      },
      {
        "prompt": "Вычисли −56 : 7.",
        "answer": "-8",
        "input": "number",
        "hint": "При разных знаках частное отрицательно.",
        "explanation": "−56 : 7 = −8; проверка: −8 · 7 = −56.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -56,
            7
          ]
        },
        "id": "signed-division-13"
      },
      {
        "prompt": "Вычисли 63 : (−7).",
        "answer": "-9",
        "input": "number",
        "hint": "Знак частного определяется знаками делимого и делителя.",
        "explanation": "63 : (−7) = −9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            63,
            -7
          ]
        },
        "id": "signed-division-14"
      },
      {
        "prompt": "Вычисли −70 : (−7).",
        "answer": "10",
        "input": "number",
        "hint": "Оба числа отрицательны, поэтому частное положительно.",
        "explanation": "−70 : (−7) = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -70,
            -7
          ]
        },
        "id": "signed-division-15"
      },
      {
        "prompt": "Как проверить частное −8 в примере 56 : (−7)?",
        "answer": "(−8) · (−7)",
        "input": "choice",
        "choices": [
          "(−8) + (−7)",
          "(−8) : (−7)",
          "(−8) · (−7)"
        ],
        "hint": "Проверка частного должна восстановить положительное делимое.",
        "explanation": "(−8) · (−7) = 56, исходное делимое восстановлено.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 56,
          "values": [
            [
              "add",
              -8,
              -7
            ],
            [
              "div",
              -8,
              -7
            ],
            [
              "mul",
              -8,
              -7
            ]
          ]
        },
        "id": "signed-division-16"
      },
      {
        "prompt": "Вычисли 0 : (−8).",
        "answer": "0",
        "input": "number",
        "hint": "Нулевое делимое можно делить на ненулевое число.",
        "explanation": "0 : (−8) = 0: произведение 0 на делитель равно 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            0,
            -8
          ]
        },
        "id": "signed-division-17"
      },
      {
        "prompt": "Вычисли −7 : 8. Ответ можно записать дробью.",
        "answer": "-7/8",
        "input": "number",
        "hint": "Если деление не целое, сохрани точную дробь.",
        "explanation": "−7 : 8 = -7/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -7,
            8
          ]
        },
        "id": "signed-division-18"
      }
    ]
  },
  {
    "id": "signed-fractions",
    "group": "signed",
    "title": "Дроби со знаками",
    "goal": "Сначала привести к общим долям, затем применить правила знаков.",
    "covers": [
      "path:grade7-b-signed-fraction-sum"
    ],
    "prerequisites": [
      "oge-basics:fraction-common-denominator",
      "oge-basics:negative-add-subtract",
      "public:v6-subtract-negative"
    ],
    "trainers": [
      {
        "title": "Общие доли со знаками",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-signed-fraction-sum",
        "kind": "По шагам",
        "instruction": "Сохрани знаки при приведении к общему знаменателю.",
        "finish": "Реши 4 суммы и разности."
      },
      {
        "title": "Знак разности дробей",
        "href": "/trainers/drobi-oge-trainer.html#practice=fraction-mixed",
        "kind": "Другой способ",
        "instruction": "Открой «Настроить упражнение» → «только вычитание». Приведи дроби к общим долям и проверь знак разности.",
        "finish": "Реши 3 разности."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −1/3 + 1/4.",
        "answer": "-1/12",
        "input": "number",
        "hint": "Приведи к общему знаменателю, не теряя минус.",
        "explanation": "−4/12 + 3/12 = -1/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "-1/3",
            "1/4"
          ]
        },
        "id": "signed-fractions-01"
      },
      {
        "prompt": "Вычисли 2/5 + (−1/5).",
        "answer": "1/5",
        "input": "number",
        "hint": "Доли одинаковые; выполни сложение целых числителей со знаками.",
        "explanation": "(2 − 1)/5 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "2/5",
            "-1/5"
          ]
        },
        "id": "signed-fractions-02"
      },
      {
        "prompt": "Вычисли −1/3 − 1/4.",
        "answer": "-7/12",
        "input": "number",
        "hint": "Это сумма двух отрицательных величин.",
        "explanation": "−4/12 − 3/12 = -7/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/3",
            "1/4"
          ]
        },
        "id": "signed-fractions-03"
      },
      {
        "prompt": "Каков знак суммы −2/3 + 1/3?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Положительный",
          "Отрицательный",
          "Ноль"
        ],
        "hint": "При одинаковых знаменателях сравни модули числителей.",
        "explanation": "2 > 1, значит отрицательная доля по модулю больше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              "-2/3",
              "1/3"
            ],
            0
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-fractions-04"
      },
      {
        "prompt": "Найди расстояние между точками −1/3 и 1/4.",
        "answer": "7/12",
        "input": "number",
        "hint": "Точки по разные стороны нуля: сложи расстояния до нуля.",
        "explanation": "1/3 + 1/4 = 7/12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              "1/4",
              "-1/3"
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -1,
          "max": 1,
          "step": 0.5,
          "points": [
            {
              "value": -0.3333333333333333,
              "label": "A"
            },
            {
              "value": 0.25,
              "label": "B"
            }
          ]
        },
        "id": "signed-fractions-05"
      },
      {
        "prompt": "Вычисли −2/5 − (−3/5).",
        "answer": "1/5",
        "input": "number",
        "hint": "Вычесть отрицательную дробь — прибавить противоположную.",
        "explanation": "−2/5 + 3/5 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-2/5",
            "-3/5"
          ]
        },
        "id": "signed-fractions-06"
      },
      {
        "prompt": "Вычисли −1/4 + 1/5.",
        "answer": "-1/20",
        "input": "number",
        "hint": "Приведи к общему знаменателю, не теряя минус.",
        "explanation": "−5/20 + 4/20 = -1/20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "-1/4",
            "1/5"
          ]
        },
        "id": "signed-fractions-07"
      },
      {
        "prompt": "Вычисли 3/6 + (−1/6).",
        "answer": "1/3",
        "input": "number",
        "hint": "Доли одинаковые; выполни сложение целых числителей со знаками.",
        "explanation": "(3 − 1)/6 = 1/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "1/2",
            "-1/6"
          ]
        },
        "id": "signed-fractions-08"
      },
      {
        "prompt": "Вычисли −1/4 − 1/5.",
        "answer": "-9/20",
        "input": "number",
        "hint": "Это сумма двух отрицательных величин.",
        "explanation": "−5/20 − 4/20 = -9/20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/4",
            "1/5"
          ]
        },
        "id": "signed-fractions-09"
      },
      {
        "prompt": "Каков знак суммы −3/4 + 1/4?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Положительный",
          "Отрицательный",
          "Ноль"
        ],
        "hint": "При одинаковых знаменателях сравни модули числителей.",
        "explanation": "3 > 1, значит отрицательная доля по модулю больше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              "-3/4",
              "1/4"
            ],
            0
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-fractions-10"
      },
      {
        "prompt": "Найди расстояние между точками −1/4 и 1/5.",
        "answer": "9/20",
        "input": "number",
        "hint": "Точки по разные стороны нуля: сложи расстояния до нуля.",
        "explanation": "1/4 + 1/5 = 9/20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              "1/5",
              "-1/4"
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -1,
          "max": 1,
          "step": 0.5,
          "points": [
            {
              "value": -0.25,
              "label": "A"
            },
            {
              "value": 0.2,
              "label": "B"
            }
          ]
        },
        "id": "signed-fractions-11"
      },
      {
        "prompt": "Вычисли −3/6 − (−4/6).",
        "answer": "1/6",
        "input": "number",
        "hint": "Вычесть отрицательную дробь — прибавить противоположную.",
        "explanation": "−3/6 + 4/6 = 1/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/2",
            "-2/3"
          ]
        },
        "id": "signed-fractions-12"
      },
      {
        "prompt": "Вычисли −1/5 + 1/6.",
        "answer": "-1/30",
        "input": "number",
        "hint": "Приведи к общему знаменателю, не теряя минус.",
        "explanation": "−6/30 + 5/30 = -1/30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "-1/5",
            "1/6"
          ]
        },
        "id": "signed-fractions-13"
      },
      {
        "prompt": "Вычисли 4/7 + (−1/7).",
        "answer": "3/7",
        "input": "number",
        "hint": "Доли одинаковые; выполни сложение целых числителей со знаками.",
        "explanation": "(4 − 1)/7 = 3/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            "4/7",
            "-1/7"
          ]
        },
        "id": "signed-fractions-14"
      },
      {
        "prompt": "Вычисли −1/5 − 1/6.",
        "answer": "-11/30",
        "input": "number",
        "hint": "Это сумма двух отрицательных величин.",
        "explanation": "−6/30 − 5/30 = -11/30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/5",
            "1/6"
          ]
        },
        "id": "signed-fractions-15"
      },
      {
        "prompt": "Каков знак суммы −4/5 + 1/5?",
        "answer": "Отрицательный",
        "input": "choice",
        "choices": [
          "Положительный",
          "Отрицательный",
          "Ноль"
        ],
        "hint": "При одинаковых знаменателях сравни модули числителей.",
        "explanation": "4 > 1, значит отрицательная доля по модулю больше.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "add",
              "-4/5",
              "1/5"
            ],
            0
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "signed-fractions-16"
      },
      {
        "prompt": "Найди расстояние между точками −1/5 и 1/6.",
        "answer": "11/30",
        "input": "number",
        "hint": "Точки по разные стороны нуля: сложи расстояния до нуля.",
        "explanation": "1/5 + 1/6 = 11/30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "abs",
            [
              "sub",
              "1/6",
              "-1/5"
            ]
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -1,
          "max": 1,
          "step": 0.5,
          "points": [
            {
              "value": -0.2,
              "label": "A"
            },
            {
              "value": 0.16666666666666666,
              "label": "B"
            }
          ]
        },
        "id": "signed-fractions-17"
      },
      {
        "prompt": "Вычисли −4/7 − (−5/7).",
        "answer": "1/7",
        "input": "number",
        "hint": "Вычесть отрицательную дробь — прибавить противоположную.",
        "explanation": "−4/7 + 5/7 = 1/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-4/7",
            "-5/7"
          ]
        },
        "id": "signed-fractions-18"
      }
    ]
  },
  {
    "id": "signed-mixed-check",
    "group": "signed",
    "title": "Станции 5–6. Смешанные выражения и проверка",
    "goal": "Сохранять порядок действий, находить ошибку и решать без подсказки.",
    "covers": [
      "public:v6-properties-order"
    ],
    "prerequisites": [
      "oge-basics:negative-add-subtract",
      "public:v6-subtract-negative",
      "public:signed-multiply",
      "public:signed-divide"
    ],
    "trainers": [
      {
        "title": "Смешанные выражения",
        "href": "/trainers/archive-5-weeks/mixed-expressions-58f0b76f.html",
        "kind": "Практика",
        "instruction": "Переписывай одну строку за раз и не пропускай знак числа.",
        "finish": "Реши 4 выражения."
      },
      {
        "title": "Найди ошибку",
        "href": "/trainers/archive-5-weeks/find-the-error-1-0a615cbc.html",
        "kind": "Другой способ",
        "instruction": "Укажи первый неверный переход, затем исправь его.",
        "finish": "Разбери 3 ошибки."
      },
      {
        "title": "Станция 6: проверка навыка",
        "href": "/trainers/archive-5-weeks/quick-skill-check-7668e263.html",
        "kind": "Практика",
        "instruction": "Пройди разогрев, затем отдельную проверку новых заданий.",
        "finish": "Заверши проверку из 10 примеров."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −7 + 3 − 2.",
        "answer": "-6",
        "input": "number",
        "hint": "Сложение и вычитание одного уровня выполняй по порядку.",
        "explanation": "−7 + 3 = -4; затем -4 − 2 = -6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              -7,
              3
            ],
            2
          ]
        },
        "id": "signed-mixed-check-01"
      },
      {
        "prompt": "Вычисли −7 − (−3) + 3.",
        "answer": "-1",
        "input": "number",
        "hint": "Сначала перепиши вычитание отрицательного числа.",
        "explanation": "−7 + 3 + 3 = -1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              -7,
              -3
            ],
            3
          ]
        },
        "id": "signed-mixed-check-02"
      },
      {
        "prompt": "Вычисли −7 + 3 · (−2).",
        "answer": "-13",
        "input": "number",
        "hint": "Умножение выполняется перед сложением.",
        "explanation": "3 · (−2) = −6; затем −7 − 6 = −13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -7,
            [
              "mul",
              3,
              -2
            ]
          ]
        },
        "id": "signed-mixed-check-03"
      },
      {
        "prompt": "Вычисли (−7 + 3) · (−2).",
        "answer": "8",
        "input": "number",
        "hint": "Сначала вычисли скобку, затем определи знак произведения.",
        "explanation": "Скобка равна -4; -4 · (−2) = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              -7,
              3
            ],
            -2
          ]
        },
        "id": "signed-mixed-check-04"
      },
      {
        "prompt": "Какой результат даёт первое действие в −7 − (−3) · 2?",
        "answer": "−6",
        "input": "choice",
        "choices": [
          "6",
          "-4",
          "−6"
        ],
        "hint": "Сначала выполняется умножение, минус перед всей второй частью пока не применён.",
        "explanation": "Первое действие: (−3) · 2 = −6. Затем этот результат вычитается.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            -3,
            2
          ],
          "values": [
            6,
            -4,
            -6
          ]
        },
        "id": "signed-mixed-check-05"
      },
      {
        "prompt": "Счёт был −70 рублей. Поступило 30 рублей, затем списали 20 рублей. Каково итоговое значение счёта?",
        "answer": "-60",
        "input": "number",
        "hint": "Запиши изменения по порядку: поступление — плюс, списание — минус.",
        "explanation": "−70 + 30 − 20 = -60 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              -70,
              30
            ],
            20
          ]
        },
        "id": "signed-mixed-check-06"
      },
      {
        "prompt": "Вычисли −11 + 5 − 4.",
        "answer": "-10",
        "input": "number",
        "hint": "Сложение и вычитание одного уровня выполняй по порядку.",
        "explanation": "−11 + 5 = -6; затем -6 − 4 = -10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              -11,
              5
            ],
            4
          ]
        },
        "id": "signed-mixed-check-07"
      },
      {
        "prompt": "Вычисли −11 − (−5) + 5.",
        "answer": "-1",
        "input": "number",
        "hint": "Сначала перепиши вычитание отрицательного числа.",
        "explanation": "−11 + 5 + 5 = -1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              -11,
              -5
            ],
            5
          ]
        },
        "id": "signed-mixed-check-08"
      },
      {
        "prompt": "Вычисли −11 + 5 · (−4).",
        "answer": "-31",
        "input": "number",
        "hint": "Умножение выполняется перед сложением.",
        "explanation": "5 · (−4) = −20; затем −11 − 20 = −31.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -11,
            [
              "mul",
              5,
              -4
            ]
          ]
        },
        "id": "signed-mixed-check-09"
      },
      {
        "prompt": "Вычисли (−11 + 5) · (−4).",
        "answer": "24",
        "input": "number",
        "hint": "Сначала вычисли скобку, затем определи знак произведения.",
        "explanation": "Скобка равна -6; -6 · (−4) = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              -11,
              5
            ],
            -4
          ]
        },
        "id": "signed-mixed-check-10"
      },
      {
        "prompt": "Какой результат даёт первое действие в −11 − (−5) · 2?",
        "answer": "−10",
        "input": "choice",
        "choices": [
          "10",
          "-6",
          "−10"
        ],
        "hint": "Сначала выполняется умножение, минус перед всей второй частью пока не применён.",
        "explanation": "Первое действие: (−5) · 2 = −10. Затем этот результат вычитается.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            -5,
            2
          ],
          "values": [
            10,
            -6,
            -10
          ]
        },
        "id": "signed-mixed-check-11"
      },
      {
        "prompt": "Счёт был −110 рублей. Поступило 50 рублей, затем списали 40 рублей. Каково итоговое значение счёта?",
        "answer": "-100",
        "input": "number",
        "hint": "Запиши изменения по порядку: поступление — плюс, списание — минус.",
        "explanation": "−110 + 50 − 40 = -100 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              -110,
              50
            ],
            40
          ]
        },
        "id": "signed-mixed-check-12"
      },
      {
        "prompt": "Вычисли −16 + 8 − 6.",
        "answer": "-14",
        "input": "number",
        "hint": "Сложение и вычитание одного уровня выполняй по порядку.",
        "explanation": "−16 + 8 = -8; затем -8 − 6 = -14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              -16,
              8
            ],
            6
          ]
        },
        "id": "signed-mixed-check-13"
      },
      {
        "prompt": "Вычисли −16 − (−8) + 7.",
        "answer": "-1",
        "input": "number",
        "hint": "Сначала перепиши вычитание отрицательного числа.",
        "explanation": "−16 + 8 + 7 = -1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              -16,
              -8
            ],
            7
          ]
        },
        "id": "signed-mixed-check-14"
      },
      {
        "prompt": "Вычисли −16 + 8 · (−6).",
        "answer": "-64",
        "input": "number",
        "hint": "Умножение выполняется перед сложением.",
        "explanation": "8 · (−6) = −48; затем −16 − 48 = −64.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -16,
            [
              "mul",
              8,
              -6
            ]
          ]
        },
        "id": "signed-mixed-check-15"
      },
      {
        "prompt": "Вычисли (−16 + 8) · (−6).",
        "answer": "48",
        "input": "number",
        "hint": "Сначала вычисли скобку, затем определи знак произведения.",
        "explanation": "Скобка равна -8; -8 · (−6) = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              -16,
              8
            ],
            -6
          ]
        },
        "id": "signed-mixed-check-16"
      },
      {
        "prompt": "Какой результат даёт первое действие в −16 − (−8) · 2?",
        "answer": "−16",
        "input": "choice",
        "choices": [
          "16",
          "-8",
          "−16"
        ],
        "hint": "Сначала выполняется умножение, минус перед всей второй частью пока не применён.",
        "explanation": "Первое действие: (−8) · 2 = −16. Затем этот результат вычитается.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            -8,
            2
          ],
          "values": [
            16,
            -8,
            -16
          ]
        },
        "id": "signed-mixed-check-17"
      },
      {
        "prompt": "Счёт был −160 рублей. Поступило 80 рублей, затем списали 60 рублей. Каково итоговое значение счёта?",
        "answer": "-140",
        "input": "number",
        "hint": "Запиши изменения по порядку: поступление — плюс, списание — минус.",
        "explanation": "−160 + 80 − 60 = -140 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              -160,
              80
            ],
            60
          ]
        },
        "id": "signed-mixed-check-18"
      }
    ]
  },
  {
    "id": "percent-meaning",
    "group": "percent",
    "title": "Процент — одна сотая",
    "goal": "Связывать проценты, дроби и части рисунка.",
    "covers": [
      "oge-basics:percentages/percent-meaning"
    ],
    "prerequisites": [
      "oge-basics:fraction-meaning",
      "public:decimal-intro"
    ],
    "trainers": [
      {
        "title": "100%, 1% и доля",
        "href": "/trainers/oge-basics/percentages/percent-meaning.html",
        "kind": "Модель",
        "instruction": "Сопоставь целое, одну сотую и заданную долю.",
        "finish": "Реши 4 задания."
      },
      {
        "title": "Наглядные проценты",
        "href": "/trainers/percent-part-whole-trainer.html",
        "kind": "Другой способ",
        "instruction": "Изменяй число процентов и наблюдай соответствующую часть целого.",
        "finish": "Сравни 3 доли."
      }
    ],
    "questions": [
      {
        "prompt": "Запиши 10% обычной или десятичной дробью.",
        "answer": "1/10",
        "input": "number",
        "hint": "Процент означает одну сотую.",
        "explanation": "10% = 10/100 = 1/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            10,
            100
          ]
        },
        "id": "percent-meaning-01"
      },
      {
        "prompt": "Найди 1% от 300.",
        "answer": "3",
        "input": "number",
        "hint": "Раздели целое на сто равных частей.",
        "explanation": "300:100 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            300,
            100
          ]
        },
        "id": "percent-meaning-02"
      },
      {
        "prompt": "На рисунке 20 равных частей, закрашено 2. Сколько процентов закрашено?",
        "answer": "10",
        "input": "number",
        "hint": "Одна из двадцати равных частей соответствует пяти процентам.",
        "explanation": "2/20 · 100% = 10%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              2,
              20
            ],
            100
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 20,
          "shaded": 2
        },
        "id": "percent-meaning-03"
      },
      {
        "prompt": "Закрашено 10%. Сколько процентов осталось незакрашенным?",
        "answer": "90",
        "input": "number",
        "hint": "Всё целое составляет сто процентов.",
        "explanation": "100% − 10% = 90%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            100,
            10
          ]
        },
        "id": "percent-meaning-04"
      },
      {
        "prompt": "Какая запись равна 15%?",
        "answer": "15/100",
        "input": "choice",
        "choices": [
          "15/10",
          "15/100",
          "15"
        ],
        "hint": "При переводе процентов в число дели на сто.",
        "explanation": "15% = 15/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            15,
            100
          ],
          "values": [
            "3/2",
            "3/20",
            15
          ]
        },
        "id": "percent-meaning-05"
      },
      {
        "prompt": "Сравни 10% и половину целого.",
        "answer": "Меньше половины",
        "input": "choice",
        "choices": [
          "Меньше половины",
          "Ровно половина",
          "Больше половины"
        ],
        "hint": "Половина целого соответствует пятидесяти процентам.",
        "explanation": "10 < 50, поэтому 10% меньше половины.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/10",
            "1/2"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "percent-meaning-06"
      },
      {
        "prompt": "Запиши 25% обычной или десятичной дробью.",
        "answer": "1/4",
        "input": "number",
        "hint": "Процент означает одну сотую.",
        "explanation": "25% = 25/100 = 1/4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            25,
            100
          ]
        },
        "id": "percent-meaning-07"
      },
      {
        "prompt": "Найди 1% от 500.",
        "answer": "5",
        "input": "number",
        "hint": "Раздели целое на сто равных частей.",
        "explanation": "500:100 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            500,
            100
          ]
        },
        "id": "percent-meaning-08"
      },
      {
        "prompt": "На рисунке 20 равных частей, закрашено 5. Сколько процентов закрашено?",
        "answer": "25",
        "input": "number",
        "hint": "Одна из двадцати равных частей соответствует пяти процентам.",
        "explanation": "5/20 · 100% = 25%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              5,
              20
            ],
            100
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 20,
          "shaded": 5
        },
        "id": "percent-meaning-09"
      },
      {
        "prompt": "Закрашено 25%. Сколько процентов осталось незакрашенным?",
        "answer": "75",
        "input": "number",
        "hint": "Всё целое составляет сто процентов.",
        "explanation": "100% − 25% = 75%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            100,
            25
          ]
        },
        "id": "percent-meaning-10"
      },
      {
        "prompt": "Какая запись равна 20%?",
        "answer": "20/100",
        "input": "choice",
        "choices": [
          "20/10",
          "20/100",
          "20"
        ],
        "hint": "При переводе процентов в число дели на сто.",
        "explanation": "20% = 20/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            20,
            100
          ],
          "values": [
            "2",
            "1/5",
            20
          ]
        },
        "id": "percent-meaning-11"
      },
      {
        "prompt": "Сравни 25% и половину целого.",
        "answer": "Меньше половины",
        "input": "choice",
        "choices": [
          "Меньше половины",
          "Ровно половина",
          "Больше половины"
        ],
        "hint": "Половина целого соответствует пятидесяти процентам.",
        "explanation": "25 < 50, поэтому 25% меньше половины.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "1/4",
            "1/2"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "percent-meaning-12"
      },
      {
        "prompt": "Запиши 40% обычной или десятичной дробью.",
        "answer": "2/5",
        "input": "number",
        "hint": "Процент означает одну сотую.",
        "explanation": "40% = 40/100 = 2/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            100
          ]
        },
        "id": "percent-meaning-13"
      },
      {
        "prompt": "Найди 1% от 800.",
        "answer": "8",
        "input": "number",
        "hint": "Раздели целое на сто равных частей.",
        "explanation": "800:100 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            800,
            100
          ]
        },
        "id": "percent-meaning-14"
      },
      {
        "prompt": "На рисунке 20 равных частей, закрашено 8. Сколько процентов закрашено?",
        "answer": "40",
        "input": "number",
        "hint": "Одна из двадцати равных частей соответствует пяти процентам.",
        "explanation": "8/20 · 100% = 40%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              8,
              20
            ],
            100
          ]
        },
        "visual": {
          "type": "fraction",
          "parts": 20,
          "shaded": 8
        },
        "id": "percent-meaning-15"
      },
      {
        "prompt": "Закрашено 40%. Сколько процентов осталось незакрашенным?",
        "answer": "60",
        "input": "number",
        "hint": "Всё целое составляет сто процентов.",
        "explanation": "100% − 40% = 60%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            100,
            40
          ]
        },
        "id": "percent-meaning-16"
      },
      {
        "prompt": "Какая запись равна 35%?",
        "answer": "35/100",
        "input": "choice",
        "choices": [
          "35/10",
          "35/100",
          "35"
        ],
        "hint": "При переводе процентов в число дели на сто.",
        "explanation": "35% = 35/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            35,
            100
          ],
          "values": [
            "7/2",
            "7/20",
            35
          ]
        },
        "id": "percent-meaning-17"
      },
      {
        "prompt": "Сравни 40% и половину целого.",
        "answer": "Меньше половины",
        "input": "choice",
        "choices": [
          "Меньше половины",
          "Ровно половина",
          "Больше половины"
        ],
        "hint": "Половина целого соответствует пятидесяти процентам.",
        "explanation": "40 < 50, поэтому 40% меньше половины.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "2/5",
            "1/2"
          ],
          "values": [
            -1,
            0,
            1
          ]
        },
        "id": "percent-meaning-18"
      }
    ]
  },
  {
    "id": "percent-part-whole-rate",
    "group": "percent",
    "title": "Три вопроса: часть, целое, процент",
    "goal": "Определять неизвестное и выбирать между умножением и делением.",
    "covers": [
      "oge-basics:percentages/percent-of-number-and-whole",
      "public:percent-model"
    ],
    "prerequisites": [
      "oge-basics:percentages/percent-meaning",
      "path:grade7-b-fraction-division-meaning"
    ],
    "trainers": [
      {
        "title": "Три вопроса о проценте",
        "href": "/trainers/oge-basics/percentages/percent-of-number-and-whole.html",
        "kind": "По шагам",
        "instruction": "До вычисления назови, что нужно найти: часть, целое или процент.",
        "finish": "Реши по 2 задачи каждого вида."
      },
      {
        "title": "Часть и целое на модели",
        "href": "/trainers/percent-part-whole-trainer.html",
        "kind": "Модель",
        "instruction": "Меняй неизвестную величину при одном соотношении.",
        "finish": "Проверь 3 взаимно обратные задачи."
      }
    ],
    "questions": [
      {
        "prompt": "Найди 20% от 150.",
        "answer": "30",
        "input": "number",
        "hint": "Чтобы найти часть, умножь целое на долю.",
        "explanation": "150 · 20/100 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            150,
            "1/5"
          ]
        },
        "id": "percent-part-whole-rate-01"
      },
      {
        "prompt": "20% числа равны 30. Найди всё число.",
        "answer": "150",
        "input": "number",
        "hint": "Известную часть раздели на её долю от целого.",
        "explanation": "30 : (20/100) = 150.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30,
            "1/5"
          ]
        },
        "id": "percent-part-whole-rate-02"
      },
      {
        "prompt": "Сколько процентов составляет 30 от 150?",
        "answer": "20",
        "input": "number",
        "hint": "Раздели часть на целое и переведи долю в проценты.",
        "explanation": "30/150 · 100% = 20%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              30,
              150
            ],
            100
          ]
        },
        "id": "percent-part-whole-rate-03"
      },
      {
        "prompt": "Как найти число, если его 20% равны 30?",
        "answer": "30 : (20/100)",
        "input": "choice",
        "choices": [
          "30 : 20",
          "30 : (20/100)",
          "30 · 20/100"
        ],
        "hint": "Сначала переведи проценты в долю единицы.",
        "explanation": "Целое равно 30 : (20/100) = 150.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            30,
            "1/5"
          ],
          "values": [
            [
              "div",
              30,
              20
            ],
            [
              "div",
              30,
              "1/5"
            ],
            [
              "mul",
              30,
              "1/5"
            ]
          ]
        },
        "id": "percent-part-whole-rate-04"
      },
      {
        "prompt": "В наборе 250 карточек. 20% карточек зелёные. Сколько зелёных карточек?",
        "answer": "50",
        "input": "number",
        "hint": "Число всех карточек — целое.",
        "explanation": "250 · 20/100 = 50.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            250,
            "1/5"
          ]
        },
        "id": "percent-part-whole-rate-05"
      },
      {
        "prompt": "Из 200 деталей 30 оказались нового образца. Сколько это процентов?",
        "answer": "15",
        "input": "number",
        "hint": "Нужна доля деталей нового образца от всех деталей.",
        "explanation": "30:200 · 100% = 15%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              30,
              200
            ],
            100
          ]
        },
        "id": "percent-part-whole-rate-06"
      },
      {
        "prompt": "Найди 25% от 240.",
        "answer": "60",
        "input": "number",
        "hint": "Чтобы найти часть, умножь целое на долю.",
        "explanation": "240 · 25/100 = 60.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            240,
            "1/4"
          ]
        },
        "id": "percent-part-whole-rate-07"
      },
      {
        "prompt": "25% числа равны 60. Найди всё число.",
        "answer": "240",
        "input": "number",
        "hint": "Известную часть раздели на её долю от целого.",
        "explanation": "60 : (25/100) = 240.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            60,
            "1/4"
          ]
        },
        "id": "percent-part-whole-rate-08"
      },
      {
        "prompt": "Сколько процентов составляет 60 от 240?",
        "answer": "25",
        "input": "number",
        "hint": "Раздели часть на целое и переведи долю в проценты.",
        "explanation": "60/240 · 100% = 25%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              60,
              240
            ],
            100
          ]
        },
        "id": "percent-part-whole-rate-09"
      },
      {
        "prompt": "Как найти число, если его 25% равны 60?",
        "answer": "60 : (25/100)",
        "input": "choice",
        "choices": [
          "60 : 25",
          "60 : (25/100)",
          "60 · 25/100"
        ],
        "hint": "Сначала переведи проценты в долю единицы.",
        "explanation": "Целое равно 60 : (25/100) = 240.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            60,
            "1/4"
          ],
          "values": [
            [
              "div",
              60,
              25
            ],
            [
              "div",
              60,
              "1/4"
            ],
            [
              "mul",
              60,
              "1/4"
            ]
          ]
        },
        "id": "percent-part-whole-rate-10"
      },
      {
        "prompt": "В наборе 340 карточек. 25% карточек зелёные. Сколько зелёных карточек?",
        "answer": "85",
        "input": "number",
        "hint": "Число всех карточек — целое.",
        "explanation": "340 · 25/100 = 85.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            340,
            "1/4"
          ]
        },
        "id": "percent-part-whole-rate-11"
      },
      {
        "prompt": "Из 200 деталей 70 оказались нового образца. Сколько это процентов?",
        "answer": "35",
        "input": "number",
        "hint": "Нужна доля деталей нового образца от всех деталей.",
        "explanation": "70:200 · 100% = 35%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              70,
              200
            ],
            100
          ]
        },
        "id": "percent-part-whole-rate-12"
      },
      {
        "prompt": "Найди 40% от 350.",
        "answer": "140",
        "input": "number",
        "hint": "Чтобы найти часть, умножь целое на долю.",
        "explanation": "350 · 40/100 = 140.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            350,
            "2/5"
          ]
        },
        "id": "percent-part-whole-rate-13"
      },
      {
        "prompt": "40% числа равны 140. Найди всё число.",
        "answer": "350",
        "input": "number",
        "hint": "Известную часть раздели на её долю от целого.",
        "explanation": "140 : (40/100) = 350.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            140,
            "2/5"
          ]
        },
        "id": "percent-part-whole-rate-14"
      },
      {
        "prompt": "Сколько процентов составляет 140 от 350?",
        "answer": "40",
        "input": "number",
        "hint": "Раздели часть на целое и переведи долю в проценты.",
        "explanation": "140/350 · 100% = 40%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              140,
              350
            ],
            100
          ]
        },
        "id": "percent-part-whole-rate-15"
      },
      {
        "prompt": "Как найти число, если его 40% равны 140?",
        "answer": "140 : (40/100)",
        "input": "choice",
        "choices": [
          "140 : 40",
          "140 : (40/100)",
          "140 · 40/100"
        ],
        "hint": "Сначала переведи проценты в долю единицы.",
        "explanation": "Целое равно 140 : (40/100) = 350.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            140,
            "2/5"
          ],
          "values": [
            [
              "div",
              140,
              40
            ],
            [
              "div",
              140,
              "2/5"
            ],
            [
              "mul",
              140,
              "2/5"
            ]
          ]
        },
        "id": "percent-part-whole-rate-16"
      },
      {
        "prompt": "В наборе 450 карточек. 40% карточек зелёные. Сколько зелёных карточек?",
        "answer": "180",
        "input": "number",
        "hint": "Число всех карточек — целое.",
        "explanation": "450 · 40/100 = 180.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            450,
            "2/5"
          ]
        },
        "id": "percent-part-whole-rate-17"
      },
      {
        "prompt": "Из 200 деталей 120 оказались нового образца. Сколько это процентов?",
        "answer": "60",
        "input": "number",
        "hint": "Нужна доля деталей нового образца от всех деталей.",
        "explanation": "120:200 · 100% = 60%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              120,
              200
            ],
            100
          ]
        },
        "id": "percent-part-whole-rate-18"
      }
    ]
  },
  {
    "id": "percent-read-question",
    "group": "percent",
    "title": "Выбираем действие по вопросу",
    "goal": "Различать задачи на часть, целое и долю по тексту и таблице.",
    "covers": [
      "oge-basics:percentages/percent-choose-question",
      "oge-basics:percentages/percent-final-checkpoint",
      "public:percent-table"
    ],
    "prerequisites": [
      "oge-basics:percentages/percent-of-number-and-whole"
    ],
    "trainers": [
      {
        "title": "Что спрашивают?",
        "href": "/trainers/oge-basics/percentages/percent-choose-question.html",
        "kind": "По шагам",
        "instruction": "Отметь известные величины и назови неизвестную до вычисления.",
        "finish": "Разбери 4 текста."
      },
      {
        "title": "Проценты в таблице",
        "href": "/trainers/oge-1-5-trainers/percent-table-trainer.html",
        "kind": "Другой способ",
        "instruction": "Соотнеси строки таблицы: целое, процент и часть.",
        "finish": "Заполни 3 таблицы."
      },
      {
        "title": "Смешанная проверка процентов",
        "href": "/trainers/oge-basics/percentages/percent-final-checkpoint.html",
        "kind": "Практика",
        "instruction": "Решай новые задачи без просмотра разбора.",
        "finish": "Заверши одну проверку."
      }
    ],
    "questions": [
      {
        "prompt": "В коробке 180 шариков, 25% из них синие. Что вычисляет 180 · 25/100?",
        "answer": "Количество синих шариков",
        "input": "choice",
        "choices": [
          "Количество синих шариков",
          "Количество всех шариков",
          "Число процентов синих шариков"
        ],
        "hint": "Умножение целого на долю даёт часть.",
        "explanation": "180 · 25/100 = 45 — количество синих шариков.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            180,
            "1/4"
          ],
          "values": [
            45,
            180,
            25
          ]
        },
        "id": "percent-read-question-01"
      },
      {
        "prompt": "45 синих шариков составляют 25% всех. Что вычисляет 45 : (25/100)?",
        "answer": "Количество всех шариков",
        "input": "choice",
        "choices": [
          "Количество синих шариков",
          "Число процентов",
          "Количество всех шариков"
        ],
        "hint": "Деление части на её долю восстанавливает целое.",
        "explanation": "45 : (25/100) = 180, это всё количество.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            45,
            "1/4"
          ],
          "values": [
            45,
            25,
            180
          ]
        },
        "id": "percent-read-question-02"
      },
      {
        "prompt": "Заполни таблицу: целое 180, процент 25, часть неизвестна.",
        "answer": "45",
        "input": "number",
        "hint": "Строка «часть» получается из целого и доли.",
        "explanation": "180 · 25/100 = 45.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            180,
            "1/4"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Величина",
            "Значение"
          ],
          "rows": [
            [
              "Целое",
              "180"
            ],
            [
              "Процент",
              "25"
            ],
            [
              "Часть",
              "?"
            ]
          ]
        },
        "id": "percent-read-question-03"
      },
      {
        "prompt": "В другой коробке 57 синих шариков из 260. Сколько процентов шариков синие? Ответ может быть дробным.",
        "answer": "285/13",
        "input": "number",
        "hint": "Не подставляй прежний процент: здесь другое целое.",
        "explanation": "(57/260) · 100% = 285/13%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              57,
              260
            ],
            100
          ]
        },
        "id": "percent-read-question-04"
      },
      {
        "prompt": "После выполнения 25% работы выполнено 45 одинаковых операций. Сколько операций во всей работе?",
        "answer": "180",
        "input": "number",
        "hint": "Известно количество выполненного и его процент от всего объёма.",
        "explanation": "45 : (25/100) = 180.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            45,
            "1/4"
          ]
        },
        "id": "percent-read-question-05"
      },
      {
        "prompt": "В наборе 180 карточек 25% красные. Сколько карточек НЕ красные?",
        "answer": "135",
        "input": "number",
        "hint": "Сначала найди красные карточки или используй оставшийся процент.",
        "explanation": "180 · (100 − 25)/100 = 135.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            180,
            [
              "div",
              [
                "sub",
                100,
                25
              ],
              100
            ]
          ]
        },
        "id": "percent-read-question-06"
      },
      {
        "prompt": "В коробке 240 шариков, 20% из них синие. Что вычисляет 240 · 20/100?",
        "answer": "Количество синих шариков",
        "input": "choice",
        "choices": [
          "Количество синих шариков",
          "Количество всех шариков",
          "Число процентов синих шариков"
        ],
        "hint": "Умножение целого на долю даёт часть.",
        "explanation": "240 · 20/100 = 48 — количество синих шариков.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            240,
            "1/5"
          ],
          "values": [
            48,
            240,
            20
          ]
        },
        "id": "percent-read-question-07"
      },
      {
        "prompt": "48 синих шариков составляют 20% всех. Что вычисляет 48 : (20/100)?",
        "answer": "Количество всех шариков",
        "input": "choice",
        "choices": [
          "Количество синих шариков",
          "Число процентов",
          "Количество всех шариков"
        ],
        "hint": "Деление части на её долю восстанавливает целое.",
        "explanation": "48 : (20/100) = 240, это всё количество.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            48,
            "1/5"
          ],
          "values": [
            48,
            20,
            240
          ]
        },
        "id": "percent-read-question-08"
      },
      {
        "prompt": "Заполни таблицу: целое 240, процент 20, часть неизвестна.",
        "answer": "48",
        "input": "number",
        "hint": "Строка «часть» получается из целого и доли.",
        "explanation": "240 · 20/100 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            240,
            "1/5"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Величина",
            "Значение"
          ],
          "rows": [
            [
              "Целое",
              "240"
            ],
            [
              "Процент",
              "20"
            ],
            [
              "Часть",
              "?"
            ]
          ]
        },
        "id": "percent-read-question-09"
      },
      {
        "prompt": "В другой коробке 60 синих шариков из 320. Сколько процентов шариков синие? Ответ может быть дробным.",
        "answer": "75/4",
        "input": "number",
        "hint": "Не подставляй прежний процент: здесь другое целое.",
        "explanation": "(60/320) · 100% = 75/4%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              60,
              320
            ],
            100
          ]
        },
        "id": "percent-read-question-10"
      },
      {
        "prompt": "После выполнения 20% работы выполнено 48 одинаковых операций. Сколько операций во всей работе?",
        "answer": "240",
        "input": "number",
        "hint": "Известно количество выполненного и его процент от всего объёма.",
        "explanation": "48 : (20/100) = 240.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            48,
            "1/5"
          ]
        },
        "id": "percent-read-question-11"
      },
      {
        "prompt": "В наборе 240 карточек 20% красные. Сколько карточек НЕ красные?",
        "answer": "192",
        "input": "number",
        "hint": "Сначала найди красные карточки или используй оставшийся процент.",
        "explanation": "240 · (100 − 20)/100 = 192.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            240,
            [
              "div",
              [
                "sub",
                100,
                20
              ],
              100
            ]
          ]
        },
        "id": "percent-read-question-12"
      },
      {
        "prompt": "В коробке 320 шариков, 15% из них синие. Что вычисляет 320 · 15/100?",
        "answer": "Количество синих шариков",
        "input": "choice",
        "choices": [
          "Количество синих шариков",
          "Количество всех шариков",
          "Число процентов синих шариков"
        ],
        "hint": "Умножение целого на долю даёт часть.",
        "explanation": "320 · 15/100 = 48 — количество синих шариков.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            320,
            "3/20"
          ],
          "values": [
            48,
            320,
            15
          ]
        },
        "id": "percent-read-question-13"
      },
      {
        "prompt": "48 синих шариков составляют 15% всех. Что вычисляет 48 : (15/100)?",
        "answer": "Количество всех шариков",
        "input": "choice",
        "choices": [
          "Количество синих шариков",
          "Число процентов",
          "Количество всех шариков"
        ],
        "hint": "Деление части на её долю восстанавливает целое.",
        "explanation": "48 : (15/100) = 320, это всё количество.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            48,
            "3/20"
          ],
          "values": [
            48,
            15,
            320
          ]
        },
        "id": "percent-read-question-14"
      },
      {
        "prompt": "Заполни таблицу: целое 320, процент 15, часть неизвестна.",
        "answer": "48",
        "input": "number",
        "hint": "Строка «часть» получается из целого и доли.",
        "explanation": "320 · 15/100 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            320,
            "3/20"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Величина",
            "Значение"
          ],
          "rows": [
            [
              "Целое",
              "320"
            ],
            [
              "Процент",
              "15"
            ],
            [
              "Часть",
              "?"
            ]
          ]
        },
        "id": "percent-read-question-15"
      },
      {
        "prompt": "В другой коробке 60 синих шариков из 400. Сколько процентов шариков синие? Ответ может быть дробным.",
        "answer": "15",
        "input": "number",
        "hint": "Не подставляй прежний процент: здесь другое целое.",
        "explanation": "(60/400) · 100% = 15%.",
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
        "id": "percent-read-question-16"
      },
      {
        "prompt": "После выполнения 15% работы выполнено 48 одинаковых операций. Сколько операций во всей работе?",
        "answer": "320",
        "input": "number",
        "hint": "Известно количество выполненного и его процент от всего объёма.",
        "explanation": "48 : (15/100) = 320.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            48,
            "3/20"
          ]
        },
        "id": "percent-read-question-17"
      },
      {
        "prompt": "В наборе 320 карточек 15% красные. Сколько карточек НЕ красные?",
        "answer": "272",
        "input": "number",
        "hint": "Сначала найди красные карточки или используй оставшийся процент.",
        "explanation": "320 · (100 − 15)/100 = 272.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            320,
            [
              "div",
              [
                "sub",
                100,
                15
              ],
              100
            ]
          ]
        },
        "id": "percent-read-question-18"
      }
    ]
  },
  {
    "id": "percent-change",
    "group": "percent",
    "title": "Цена меняется: каждый раз своё целое",
    "goal": "Различать величину изменения и новую величину, учитывать новую базу процента.",
    "covers": [
      "oge-basics:percentages/percent-change"
    ],
    "prerequisites": [
      "oge-basics:percentages/percent-of-number-and-whole"
    ],
    "trainers": [
      {
        "title": "Увеличение и уменьшение",
        "href": "/trainers/oge-basics/percentages/percent-change.html",
        "kind": "По шагам",
        "instruction": "Отдельно найди изменение и новое значение.",
        "finish": "Реши 4 задачи."
      },
      {
        "title": "Скидки и новое целое",
        "href": "/ege-baza/topics/izmenenie-tseny-procenty/",
        "kind": "Другой способ",
        "instruction": "Проверь, от какой цены считается второй процент.",
        "finish": "Разбери 3 изменения цены."
      }
    ],
    "questions": [
      {
        "prompt": "Цена 200 рублей выросла на 10%. Найди новую цену.",
        "answer": "220",
        "input": "number",
        "hint": "К ста процентам старой цены прибавь процент роста.",
        "explanation": "200 · (100+10)/100 = 220 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            200,
            "11/10"
          ]
        },
        "id": "percent-change-01"
      },
      {
        "prompt": "Цена 300 рублей снизилась на 10%. Найди новую цену.",
        "answer": "270",
        "input": "number",
        "hint": "После скидки остаётся меньше ста процентов исходной цены.",
        "explanation": "300 · (100−10)/100 = 270 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            300,
            "9/10"
          ]
        },
        "id": "percent-change-02"
      },
      {
        "prompt": "Цена изменилась с 200 до 220 рублей. На сколько процентов она выросла?",
        "answer": "10",
        "input": "number",
        "hint": "Разность цен сравни с первоначальной ценой.",
        "explanation": "(220−200)/200 · 100% = 10%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                220,
                200
              ],
              200
            ],
            100
          ]
        },
        "id": "percent-change-03"
      },
      {
        "prompt": "Цена 200 рублей выросла на 10%, затем новая цена снизилась на 10%. Найди итог.",
        "answer": "198",
        "input": "number",
        "hint": "Вторая скидка считается от уже увеличенной цены.",
        "explanation": "200 · 110/100 · 90/100 = 198 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            200,
            "11/10",
            "9/10"
          ]
        },
        "id": "percent-change-04"
      },
      {
        "prompt": "После роста и снижения на 10% от последовательно полученных цен итоговая цена по сравнению с исходной…",
        "answer": "Меньше",
        "input": "choice",
        "choices": [
          "Больше",
          "Меньше",
          "Равна"
        ],
        "hint": "Сравни произведение двух коэффициентов изменения с единицей.",
        "explanation": "(1+10/100)(1−10/100) = 1−(10/100)² < 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              "11/10",
              "9/10"
            ],
            1
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "percent-change-05"
      },
      {
        "prompt": "Как найти цену после скидки 10% на товар за 200 рублей?",
        "answer": "200 · 90/100",
        "input": "choice",
        "choices": [
          "200 · 90/100",
          "200 − 10",
          "200 · 10/100"
        ],
        "hint": "Процент скидки обозначает долю, а не столько же рублей.",
        "explanation": "Новая цена составляет 90% исходной: 200 · 90/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 180,
          "values": [
            [
              "mul",
              200,
              "9/10"
            ],
            [
              "sub",
              200,
              10
            ],
            [
              "mul",
              200,
              "1/10"
            ]
          ]
        },
        "id": "percent-change-06"
      },
      {
        "prompt": "Цена 300 рублей выросла на 20%. Найди новую цену.",
        "answer": "360",
        "input": "number",
        "hint": "К ста процентам старой цены прибавь процент роста.",
        "explanation": "300 · (100+20)/100 = 360 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            300,
            "6/5"
          ]
        },
        "id": "percent-change-07"
      },
      {
        "prompt": "Цена 400 рублей снизилась на 20%. Найди новую цену.",
        "answer": "320",
        "input": "number",
        "hint": "После скидки остаётся меньше ста процентов исходной цены.",
        "explanation": "400 · (100−20)/100 = 320 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            400,
            "4/5"
          ]
        },
        "id": "percent-change-08"
      },
      {
        "prompt": "Цена изменилась с 300 до 360 рублей. На сколько процентов она выросла?",
        "answer": "20",
        "input": "number",
        "hint": "Разность цен сравни с первоначальной ценой.",
        "explanation": "(360−300)/300 · 100% = 20%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                360,
                300
              ],
              300
            ],
            100
          ]
        },
        "id": "percent-change-09"
      },
      {
        "prompt": "Цена 300 рублей выросла на 20%, затем новая цена снизилась на 20%. Найди итог.",
        "answer": "288",
        "input": "number",
        "hint": "Вторая скидка считается от уже увеличенной цены.",
        "explanation": "300 · 120/100 · 80/100 = 288 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            300,
            "6/5",
            "4/5"
          ]
        },
        "id": "percent-change-10"
      },
      {
        "prompt": "После роста и снижения на 20% от последовательно полученных цен итоговая цена по сравнению с исходной…",
        "answer": "Меньше",
        "input": "choice",
        "choices": [
          "Больше",
          "Меньше",
          "Равна"
        ],
        "hint": "Сравни произведение двух коэффициентов изменения с единицей.",
        "explanation": "(1+20/100)(1−20/100) = 1−(20/100)² < 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              "6/5",
              "4/5"
            ],
            1
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "percent-change-11"
      },
      {
        "prompt": "Как найти цену после скидки 20% на товар за 300 рублей?",
        "answer": "300 · 80/100",
        "input": "choice",
        "choices": [
          "300 · 80/100",
          "300 − 20",
          "300 · 20/100"
        ],
        "hint": "Процент скидки обозначает долю, а не столько же рублей.",
        "explanation": "Новая цена составляет 80% исходной: 300 · 80/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 240,
          "values": [
            [
              "mul",
              300,
              "4/5"
            ],
            [
              "sub",
              300,
              20
            ],
            [
              "mul",
              300,
              "1/5"
            ]
          ]
        },
        "id": "percent-change-12"
      },
      {
        "prompt": "Цена 400 рублей выросла на 25%. Найди новую цену.",
        "answer": "500",
        "input": "number",
        "hint": "К ста процентам старой цены прибавь процент роста.",
        "explanation": "400 · (100+25)/100 = 500 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            400,
            "5/4"
          ]
        },
        "id": "percent-change-13"
      },
      {
        "prompt": "Цена 500 рублей снизилась на 25%. Найди новую цену.",
        "answer": "375",
        "input": "number",
        "hint": "После скидки остаётся меньше ста процентов исходной цены.",
        "explanation": "500 · (100−25)/100 = 375 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            500,
            "3/4"
          ]
        },
        "id": "percent-change-14"
      },
      {
        "prompt": "Цена изменилась с 400 до 500 рублей. На сколько процентов она выросла?",
        "answer": "25",
        "input": "number",
        "hint": "Разность цен сравни с первоначальной ценой.",
        "explanation": "(500−400)/400 · 100% = 25%.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              [
                "sub",
                500,
                400
              ],
              400
            ],
            100
          ]
        },
        "id": "percent-change-15"
      },
      {
        "prompt": "Цена 400 рублей выросла на 25%, затем новая цена снизилась на 25%. Найди итог.",
        "answer": "375",
        "input": "number",
        "hint": "Вторая скидка считается от уже увеличенной цены.",
        "explanation": "400 · 125/100 · 75/100 = 375 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            400,
            "5/4",
            "3/4"
          ]
        },
        "id": "percent-change-16"
      },
      {
        "prompt": "После роста и снижения на 25% от последовательно полученных цен итоговая цена по сравнению с исходной…",
        "answer": "Меньше",
        "input": "choice",
        "choices": [
          "Больше",
          "Меньше",
          "Равна"
        ],
        "hint": "Сравни произведение двух коэффициентов изменения с единицей.",
        "explanation": "(1+25/100)(1−25/100) = 1−(25/100)² < 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            [
              "mul",
              "5/4",
              "3/4"
            ],
            1
          ],
          "values": [
            1,
            -1,
            0
          ]
        },
        "id": "percent-change-17"
      },
      {
        "prompt": "Как найти цену после скидки 25% на товар за 400 рублей?",
        "answer": "400 · 75/100",
        "input": "choice",
        "choices": [
          "400 · 75/100",
          "400 − 25",
          "400 · 25/100"
        ],
        "hint": "Процент скидки обозначает долю, а не столько же рублей.",
        "explanation": "Новая цена составляет 75% исходной: 400 · 75/100.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 300,
          "values": [
            [
              "mul",
              400,
              "3/4"
            ],
            [
              "sub",
              400,
              25
            ],
            [
              "mul",
              400,
              "1/4"
            ]
          ]
        },
        "id": "percent-change-18"
      }
    ]
  },
  {
    "id": "percent-proportion",
    "group": "percent",
    "title": "Пропорция: сохраняем отношение",
    "goal": "Находить неизвестный член и проверять равенство отношений.",
    "covers": [
      "oge-basics:percentages/proportion",
      "path:grade7-b-percent-proportion"
    ],
    "prerequisites": [
      "path:pre7-equivalent-fractions",
      "oge-basics:percentages/percent-of-number-and-whole"
    ],
    "trainers": [
      {
        "title": "Четыре числа пропорции",
        "href": "/trainers/oge-basics/percentages/proportion.html",
        "kind": "По шагам",
        "instruction": "Сопоставь одинаковые величины в двух отношениях.",
        "finish": "Реши 4 пропорции."
      },
      {
        "title": "Проценты через пропорцию",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-percent-proportion",
        "kind": "Другой способ",
        "instruction": "Свяжи целое со 100%, часть — с заданным процентом.",
        "finish": "Реши 3 задачи."
      }
    ],
    "questions": [
      {
        "prompt": "Найди x: 3/5 = x/20.",
        "answer": "12",
        "input": "number",
        "hint": "Знаменатель увеличен в несколько раз; числитель изменяется так же.",
        "explanation": "x = 3 · 20/5 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              20
            ],
            5
          ]
        },
        "id": "percent-proportion-01"
      },
      {
        "prompt": "Найди x: 3/5 = 12/x.",
        "answer": "20",
        "input": "number",
        "hint": "Составь равенство произведений крест-накрест.",
        "explanation": "3 · x = 5 · 12; x = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              5,
              12
            ],
            3
          ]
        },
        "id": "percent-proportion-02"
      },
      {
        "prompt": "Верна ли пропорция 3/5 = 12/20?",
        "answer": "Отношения равны",
        "input": "choice",
        "choices": [
          "Отношения равны",
          "Первое отношение больше",
          "Первое отношение меньше"
        ],
        "hint": "Сравни отношения сокращением или перекрёстными произведениями.",
        "explanation": "Второе отношение получается умножением обоих чисел на 4, поэтому равно первому.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "3/5",
            "3/5"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "percent-proportion-03"
      },
      {
        "prompt": "Составили пропорцию x/200 = 15/100. Найди x.",
        "answer": "30",
        "input": "number",
        "hint": "Слева часть от целого, справа процент от ста.",
        "explanation": "x = 200 · 15/100 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            200,
            "3/20"
          ]
        },
        "id": "percent-proportion-04"
      },
      {
        "prompt": "Найди x: x/12 = 5/3.",
        "answer": "20",
        "input": "number",
        "hint": "После перекрёстного умножения раздели на коэффициент при x.",
        "explanation": "x = 12 · 5/3 = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            "5/3"
          ]
        },
        "id": "percent-proportion-05"
      },
      {
        "prompt": "Для 5 одинаковых деталей нужно 3 м материала. Сколько метров нужно для 25 деталей?",
        "answer": "15",
        "input": "number",
        "hint": "При одинаковых деталях расход и количество увеличиваются одинаково.",
        "explanation": "25:5 = 5; материала 3 · 5 = 15 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "div",
              25,
              5
            ]
          ]
        },
        "id": "percent-proportion-06"
      },
      {
        "prompt": "Найди x: 4/7 = x/42.",
        "answer": "24",
        "input": "number",
        "hint": "Знаменатель увеличен в несколько раз; числитель изменяется так же.",
        "explanation": "x = 4 · 42/7 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              42
            ],
            7
          ]
        },
        "id": "percent-proportion-07"
      },
      {
        "prompt": "Найди x: 4/7 = 24/x.",
        "answer": "42",
        "input": "number",
        "hint": "Составь равенство произведений крест-накрест.",
        "explanation": "4 · x = 7 · 24; x = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              7,
              24
            ],
            4
          ]
        },
        "id": "percent-proportion-08"
      },
      {
        "prompt": "Верна ли пропорция 4/7 = 24/42?",
        "answer": "Отношения равны",
        "input": "choice",
        "choices": [
          "Отношения равны",
          "Первое отношение больше",
          "Первое отношение меньше"
        ],
        "hint": "Сравни отношения сокращением или перекрёстными произведениями.",
        "explanation": "Второе отношение получается умножением обоих чисел на 6, поэтому равно первому.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "4/7",
            "4/7"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "percent-proportion-09"
      },
      {
        "prompt": "Составили пропорцию x/200 = 25/100. Найди x.",
        "answer": "50",
        "input": "number",
        "hint": "Слева часть от целого, справа процент от ста.",
        "explanation": "x = 200 · 25/100 = 50.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            200,
            "1/4"
          ]
        },
        "id": "percent-proportion-10"
      },
      {
        "prompt": "Найди x: x/24 = 7/4.",
        "answer": "42",
        "input": "number",
        "hint": "После перекрёстного умножения раздели на коэффициент при x.",
        "explanation": "x = 24 · 7/4 = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            24,
            "7/4"
          ]
        },
        "id": "percent-proportion-11"
      },
      {
        "prompt": "Для 7 одинаковых деталей нужно 4 м материала. Сколько метров нужно для 49 деталей?",
        "answer": "28",
        "input": "number",
        "hint": "При одинаковых деталях расход и количество увеличиваются одинаково.",
        "explanation": "49:7 = 7; материала 4 · 7 = 28 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            [
              "div",
              49,
              7
            ]
          ]
        },
        "id": "percent-proportion-12"
      },
      {
        "prompt": "Найди x: 5/9 = x/72.",
        "answer": "40",
        "input": "number",
        "hint": "Знаменатель увеличен в несколько раз; числитель изменяется так же.",
        "explanation": "x = 5 · 72/9 = 40.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              5,
              72
            ],
            9
          ]
        },
        "id": "percent-proportion-13"
      },
      {
        "prompt": "Найди x: 5/9 = 40/x.",
        "answer": "72",
        "input": "number",
        "hint": "Составь равенство произведений крест-накрест.",
        "explanation": "5 · x = 9 · 40; x = 72.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              9,
              40
            ],
            5
          ]
        },
        "id": "percent-proportion-14"
      },
      {
        "prompt": "Верна ли пропорция 5/9 = 40/72?",
        "answer": "Отношения равны",
        "input": "choice",
        "choices": [
          "Отношения равны",
          "Первое отношение больше",
          "Первое отношение меньше"
        ],
        "hint": "Сравни отношения сокращением или перекрёстными произведениями.",
        "explanation": "Второе отношение получается умножением обоих чисел на 8, поэтому равно первому.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "cmp",
            "5/9",
            "5/9"
          ],
          "values": [
            0,
            1,
            -1
          ]
        },
        "id": "percent-proportion-15"
      },
      {
        "prompt": "Составили пропорцию x/200 = 35/100. Найди x.",
        "answer": "70",
        "input": "number",
        "hint": "Слева часть от целого, справа процент от ста.",
        "explanation": "x = 200 · 35/100 = 70.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            200,
            "7/20"
          ]
        },
        "id": "percent-proportion-16"
      },
      {
        "prompt": "Найди x: x/40 = 9/5.",
        "answer": "72",
        "input": "number",
        "hint": "После перекрёстного умножения раздели на коэффициент при x.",
        "explanation": "x = 40 · 9/5 = 72.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            40,
            "9/5"
          ]
        },
        "id": "percent-proportion-17"
      },
      {
        "prompt": "Для 9 одинаковых деталей нужно 5 м материала. Сколько метров нужно для 81 деталей?",
        "answer": "45",
        "input": "number",
        "hint": "При одинаковых деталях расход и количество увеличиваются одинаково.",
        "explanation": "81:9 = 9; материала 5 · 9 = 45 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            [
              "div",
              81,
              9
            ]
          ]
        },
        "id": "percent-proportion-18"
      }
    ]
  },
  {
    "id": "ratio-common-units",
    "group": "percent",
    "title": "Отношение: сначала одни единицы",
    "goal": "Сравнивать величины после перевода в одинаковые единицы.",
    "covers": [
      "path:grade7-b-ratio-units"
    ],
    "prerequisites": [
      "oge-basics:units-length-time",
      "path:grade7-b-fraction-division-meaning"
    ],
    "trainers": [
      {
        "title": "Отношения и единицы",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-ratio-units",
        "kind": "По шагам",
        "instruction": "Переведи обе величины в одинаковые единицы перед делением.",
        "finish": "Реши 4 отношения."
      },
      {
        "title": "Длина и время",
        "href": "/trainers/oge-basics/units-length-time.html",
        "kind": "Другой способ",
        "instruction": "Потренируй перевод единиц, которые встречаются в отношениях.",
        "finish": "Выполни 3 перевода и вернись."
      }
    ],
    "questions": [
      {
        "prompt": "Найди отношение 2 м к 25 см.",
        "answer": "8",
        "input": "number",
        "hint": "Приведи метры и сантиметры к одной единице.",
        "explanation": "2 м = 200 см; отношение 200:25 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              2,
              100
            ],
            25
          ]
        },
        "id": "ratio-common-units-01"
      },
      {
        "prompt": "Найди отношение 2 ч к 30 мин.",
        "answer": "4",
        "input": "number",
        "hint": "Час содержит шестьдесят минут.",
        "explanation": "2 ч = 120 мин; 120:30 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              2,
              60
            ],
            30
          ]
        },
        "id": "ratio-common-units-02"
      },
      {
        "prompt": "Найди обратное отношение: 25 см к 2 м.",
        "answer": "1/8",
        "input": "number",
        "hint": "Порядок величин в отношении важен.",
        "explanation": "25:200 = 1/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            25,
            [
              "mul",
              2,
              100
            ]
          ]
        },
        "id": "ratio-common-units-03"
      },
      {
        "prompt": "Как правильно начать вычисление отношения 2 м к 25 см?",
        "answer": "200 см : 25 см",
        "input": "choice",
        "choices": [
          "200 см : 25 см",
          "2 : 25",
          "200 : 2500"
        ],
        "hint": "Нельзя делить числа в разных единицах без преобразования.",
        "explanation": "Переводим 2 м в 200 см. Обе величины теперь в сантиметрах.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            200,
            25
          ],
          "values": [
            [
              "div",
              200,
              25
            ],
            [
              "div",
              2,
              25
            ],
            [
              "div",
              200,
              2500
            ]
          ]
        },
        "id": "ratio-common-units-04"
      },
      {
        "prompt": "Ширина прямоугольника 25 см, длина 2 м. Во сколько раз длина больше ширины?",
        "answer": "8",
        "input": "number",
        "hint": "Вопрос «во сколько раз» требует отношения одинаковых единиц.",
        "explanation": "200:25 = 8 раз.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            200,
            25
          ]
        },
        "id": "ratio-common-units-05"
      },
      {
        "prompt": "Какую долю 2 м составляют 25 см?",
        "answer": "1/8",
        "input": "number",
        "hint": "В знаменателе должно стоять целое, выраженное в тех же единицах.",
        "explanation": "25 см из 200 см дают долю 1/8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            25,
            200
          ]
        },
        "id": "ratio-common-units-06"
      },
      {
        "prompt": "Найди отношение 3 м к 40 см.",
        "answer": "15/2",
        "input": "number",
        "hint": "Приведи метры и сантиметры к одной единице.",
        "explanation": "3 м = 300 см; отношение 300:40 = 15/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              100
            ],
            40
          ]
        },
        "id": "ratio-common-units-07"
      },
      {
        "prompt": "Найди отношение 3 ч к 40 мин.",
        "answer": "9/2",
        "input": "number",
        "hint": "Час содержит шестьдесят минут.",
        "explanation": "3 ч = 180 мин; 180:40 = 9/2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              60
            ],
            40
          ]
        },
        "id": "ratio-common-units-08"
      },
      {
        "prompt": "Найди обратное отношение: 40 см к 3 м.",
        "answer": "2/15",
        "input": "number",
        "hint": "Порядок величин в отношении важен.",
        "explanation": "40:300 = 2/15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            [
              "mul",
              3,
              100
            ]
          ]
        },
        "id": "ratio-common-units-09"
      },
      {
        "prompt": "Как правильно начать вычисление отношения 3 м к 40 см?",
        "answer": "300 см : 40 см",
        "input": "choice",
        "choices": [
          "300 см : 40 см",
          "3 : 40",
          "300 : 4000"
        ],
        "hint": "Нельзя делить числа в разных единицах без преобразования.",
        "explanation": "Переводим 3 м в 300 см. Обе величины теперь в сантиметрах.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            300,
            40
          ],
          "values": [
            [
              "div",
              300,
              40
            ],
            [
              "div",
              3,
              40
            ],
            [
              "div",
              300,
              4000
            ]
          ]
        },
        "id": "ratio-common-units-10"
      },
      {
        "prompt": "Ширина прямоугольника 40 см, длина 3 м. Во сколько раз длина больше ширины?",
        "answer": "15/2",
        "input": "number",
        "hint": "Вопрос «во сколько раз» требует отношения одинаковых единиц.",
        "explanation": "300:40 = 15/2 раза.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            300,
            40
          ]
        },
        "id": "ratio-common-units-11"
      },
      {
        "prompt": "Какую долю 3 м составляют 40 см?",
        "answer": "2/15",
        "input": "number",
        "hint": "В знаменателе должно стоять целое, выраженное в тех же единицах.",
        "explanation": "40 см из 300 см дают долю 2/15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            300
          ]
        },
        "id": "ratio-common-units-12"
      },
      {
        "prompt": "Найди отношение 5 м к 50 см.",
        "answer": "10",
        "input": "number",
        "hint": "Приведи метры и сантиметры к одной единице.",
        "explanation": "5 м = 500 см; отношение 500:50 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              5,
              100
            ],
            50
          ]
        },
        "id": "ratio-common-units-13"
      },
      {
        "prompt": "Найди отношение 4 ч к 48 мин.",
        "answer": "5",
        "input": "number",
        "hint": "Час содержит шестьдесят минут.",
        "explanation": "4 ч = 240 мин; 240:48 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              60
            ],
            48
          ]
        },
        "id": "ratio-common-units-14"
      },
      {
        "prompt": "Найди обратное отношение: 50 см к 5 м.",
        "answer": "1/10",
        "input": "number",
        "hint": "Порядок величин в отношении важен.",
        "explanation": "50:500 = 1/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            50,
            [
              "mul",
              5,
              100
            ]
          ]
        },
        "id": "ratio-common-units-15"
      },
      {
        "prompt": "Как правильно начать вычисление отношения 5 м к 50 см?",
        "answer": "500 см : 50 см",
        "input": "choice",
        "choices": [
          "500 см : 50 см",
          "5 : 50",
          "500 : 5000"
        ],
        "hint": "Нельзя делить числа в разных единицах без преобразования.",
        "explanation": "Переводим 5 м в 500 см. Обе величины теперь в сантиметрах.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            500,
            50
          ],
          "values": [
            [
              "div",
              500,
              50
            ],
            [
              "div",
              5,
              50
            ],
            [
              "div",
              500,
              5000
            ]
          ]
        },
        "id": "ratio-common-units-16"
      },
      {
        "prompt": "Ширина прямоугольника 50 см, длина 5 м. Во сколько раз длина больше ширины?",
        "answer": "10",
        "input": "number",
        "hint": "Вопрос «во сколько раз» требует отношения одинаковых единиц.",
        "explanation": "500:50 = 10 раз.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            500,
            50
          ]
        },
        "id": "ratio-common-units-17"
      },
      {
        "prompt": "Какую долю 5 м составляют 50 см?",
        "answer": "1/10",
        "input": "number",
        "hint": "В знаменателе должно стоять целое, выраженное в тех же единицах.",
        "explanation": "50 см из 500 см дают долю 1/10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            50,
            500
          ]
        },
        "id": "ratio-common-units-18"
      }
    ]
  },
  {
    "id": "ratio-split-whole",
    "group": "percent",
    "title": "Делим целое в отношении",
    "goal": "Считать все доли, находить цену одной доли и две части.",
    "covers": [
      "public:v6-ratio-split"
    ],
    "prerequisites": [
      "path:pre7-fraction-part-whole",
      "oge-basics:percentages/proportion"
    ],
    "trainers": [
      {
        "title": "Две части целого",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-ratio-split",
        "kind": "Модель",
        "instruction": "Посчитай сумму долей и найди размер одной доли.",
        "finish": "Раздели 3 целых в отношении."
      },
      {
        "title": "Часть, целое, доля",
        "href": "/trainers/part-whole-share-assignment.html",
        "kind": "Другой способ",
        "instruction": "Проверь, что найденные части складываются в заданное целое.",
        "finish": "Реши 3 задачи."
      }
    ],
    "questions": [
      {
        "prompt": "Число 40 делят в отношении 2:3. Сколько всего равных долей?",
        "answer": "5",
        "input": "number",
        "hint": "Сложи числа, указанные в отношении.",
        "explanation": "2+3 = 5 долей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            3
          ]
        },
        "id": "ratio-split-whole-01"
      },
      {
        "prompt": "Число 40 разделили в отношении 2:3. Чему равна одна доля?",
        "answer": "8",
        "input": "number",
        "hint": "Всё количество раздели на общее число долей.",
        "explanation": "40:(2+3) = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            [
              "add",
              2,
              3
            ]
          ]
        },
        "id": "ratio-split-whole-02"
      },
      {
        "prompt": "Число 40 разделили в отношении 2:3. Найди первую часть.",
        "answer": "16",
        "input": "number",
        "hint": "В первой части столько долей, сколько указано первым числом.",
        "explanation": "40:(2+3) · 2 = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              40,
              [
                "add",
                2,
                3
              ]
            ],
            2
          ]
        },
        "id": "ratio-split-whole-03"
      },
      {
        "prompt": "Число 45 разделили в отношении 2:3. Найди вторую часть.",
        "answer": "27",
        "input": "number",
        "hint": "Определи размер доли для нового целого, затем умножь на второе число отношения.",
        "explanation": "45:(2+3) · 3 = 27.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              45,
              [
                "add",
                2,
                3
              ]
            ],
            3
          ]
        },
        "id": "ratio-split-whole-04"
      },
      {
        "prompt": "Две части относятся как 2:3. Первая равна 16. Найди всё целое.",
        "answer": "40",
        "input": "number",
        "hint": "Первая часть состоит из нескольких долей; сначала найди одну.",
        "explanation": "16:2 · (2+3) = 40.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              16,
              2
            ],
            [
              "add",
              2,
              3
            ]
          ]
        },
        "id": "ratio-split-whole-05"
      },
      {
        "prompt": "Какую долю целого составляет первая часть при отношении 2:3?",
        "answer": "2/5",
        "input": "choice",
        "choices": [
          "2/5",
          "2/3",
          "3/5"
        ],
        "hint": "Знаменатель должен считать все доли, а не только вторую часть.",
        "explanation": "Первая часть — 2 доли из 5: 2/5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            2,
            [
              "add",
              2,
              3
            ]
          ],
          "values": [
            "2/5",
            "2/3",
            "3/5"
          ]
        },
        "id": "ratio-split-whole-06"
      },
      {
        "prompt": "Число 80 делят в отношении 3:5. Сколько всего равных долей?",
        "answer": "8",
        "input": "number",
        "hint": "Сложи числа, указанные в отношении.",
        "explanation": "3+5 = 8 долей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            3,
            5
          ]
        },
        "id": "ratio-split-whole-07"
      },
      {
        "prompt": "Число 80 разделили в отношении 3:5. Чему равна одна доля?",
        "answer": "10",
        "input": "number",
        "hint": "Всё количество раздели на общее число долей.",
        "explanation": "80:(3+5) = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            80,
            [
              "add",
              3,
              5
            ]
          ]
        },
        "id": "ratio-split-whole-08"
      },
      {
        "prompt": "Число 80 разделили в отношении 3:5. Найди первую часть.",
        "answer": "30",
        "input": "number",
        "hint": "В первой части столько долей, сколько указано первым числом.",
        "explanation": "80:(3+5) · 3 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              80,
              [
                "add",
                3,
                5
              ]
            ],
            3
          ]
        },
        "id": "ratio-split-whole-09"
      },
      {
        "prompt": "Число 88 разделили в отношении 3:5. Найди вторую часть.",
        "answer": "55",
        "input": "number",
        "hint": "Определи размер доли для нового целого, затем умножь на второе число отношения.",
        "explanation": "88:(3+5) · 5 = 55.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              88,
              [
                "add",
                3,
                5
              ]
            ],
            5
          ]
        },
        "id": "ratio-split-whole-10"
      },
      {
        "prompt": "Две части относятся как 3:5. Первая равна 30. Найди всё целое.",
        "answer": "80",
        "input": "number",
        "hint": "Первая часть состоит из нескольких долей; сначала найди одну.",
        "explanation": "30:3 · (3+5) = 80.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              30,
              3
            ],
            [
              "add",
              3,
              5
            ]
          ]
        },
        "id": "ratio-split-whole-11"
      },
      {
        "prompt": "Какую долю целого составляет первая часть при отношении 3:5?",
        "answer": "3/8",
        "input": "choice",
        "choices": [
          "3/8",
          "3/5",
          "5/8"
        ],
        "hint": "Знаменатель должен считать все доли, а не только вторую часть.",
        "explanation": "Первая часть — 3 доли из 8: 3/8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            3,
            [
              "add",
              3,
              5
            ]
          ],
          "values": [
            "3/8",
            "3/5",
            "5/8"
          ]
        },
        "id": "ratio-split-whole-12"
      },
      {
        "prompt": "Число 132 делят в отношении 4:7. Сколько всего равных долей?",
        "answer": "11",
        "input": "number",
        "hint": "Сложи числа, указанные в отношении.",
        "explanation": "4+7 = 11 долей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            7
          ]
        },
        "id": "ratio-split-whole-13"
      },
      {
        "prompt": "Число 132 разделили в отношении 4:7. Чему равна одна доля?",
        "answer": "12",
        "input": "number",
        "hint": "Всё количество раздели на общее число долей.",
        "explanation": "132:(4+7) = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            132,
            [
              "add",
              4,
              7
            ]
          ]
        },
        "id": "ratio-split-whole-14"
      },
      {
        "prompt": "Число 132 разделили в отношении 4:7. Найди первую часть.",
        "answer": "48",
        "input": "number",
        "hint": "В первой части столько долей, сколько указано первым числом.",
        "explanation": "132:(4+7) · 4 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              132,
              [
                "add",
                4,
                7
              ]
            ],
            4
          ]
        },
        "id": "ratio-split-whole-15"
      },
      {
        "prompt": "Число 143 разделили в отношении 4:7. Найди вторую часть.",
        "answer": "91",
        "input": "number",
        "hint": "Определи размер доли для нового целого, затем умножь на второе число отношения.",
        "explanation": "143:(4+7) · 7 = 91.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              143,
              [
                "add",
                4,
                7
              ]
            ],
            7
          ]
        },
        "id": "ratio-split-whole-16"
      },
      {
        "prompt": "Две части относятся как 4:7. Первая равна 48. Найди всё целое.",
        "answer": "132",
        "input": "number",
        "hint": "Первая часть состоит из нескольких долей; сначала найди одну.",
        "explanation": "48:4 · (4+7) = 132.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              48,
              4
            ],
            [
              "add",
              4,
              7
            ]
          ]
        },
        "id": "ratio-split-whole-17"
      },
      {
        "prompt": "Какую долю целого составляет первая часть при отношении 4:7?",
        "answer": "4/11",
        "input": "choice",
        "choices": [
          "4/11",
          "4/7",
          "7/11"
        ],
        "hint": "Знаменатель должен считать все доли, а не только вторую часть.",
        "explanation": "Первая часть — 4 доли из 11: 4/11.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            4,
            [
              "add",
              4,
              7
            ]
          ],
          "values": [
            "4/11",
            "4/7",
            "7/11"
          ]
        },
        "id": "ratio-split-whole-18"
      }
    ]
  },
  {
    "id": "proportion-direct",
    "group": "percent",
    "title": "Прямая пропорциональность",
    "goal": "Узнавать постоянную цену одной единицы и одинаковое изменение двух величин.",
    "covers": [
      "public:v6-direct"
    ],
    "prerequisites": [
      "oge-basics:percentages/proportion"
    ],
    "trainers": [
      {
        "title": "Прямая зависимость",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-direct",
        "kind": "Модель",
        "instruction": "Меняй количество и следи за постоянным значением на одну единицу.",
        "finish": "Заполни 3 таблицы."
      },
      {
        "title": "Задачи через пропорцию",
        "href": "/trainers/oge-basics/percentages/proportion.html",
        "kind": "По шагам",
        "instruction": "Сопоставь величины в одинаковом порядке.",
        "finish": "Реши 3 пропорции."
      }
    ],
    "questions": [
      {
        "prompt": "4 одинаковых блокнота стоят 28 рублей. Сколько стоит один?",
        "answer": "7",
        "input": "number",
        "hint": "Найди постоянную цену одной единицы.",
        "explanation": "28:4 = 7 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            28,
            4
          ]
        },
        "id": "proportion-direct-01"
      },
      {
        "prompt": "Один блокнот стоит 7 рублей. Сколько стоят 7 блокнотов?",
        "answer": "49",
        "input": "number",
        "hint": "Стоимость равна цене единицы, умноженной на количество.",
        "explanation": "7 · 7 = 49 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7,
            7
          ]
        },
        "id": "proportion-direct-02"
      },
      {
        "prompt": "При той же цене количество покупок увеличили в 2 раза. Во сколько раз увеличится стоимость?",
        "answer": "2",
        "input": "number",
        "hint": "Каждая дополнительная единица стоит столько же.",
        "explanation": "При постоянной цене увеличение количества в 2 раза увеличивает стоимость тоже в 2 раза.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              7,
              4,
              2
            ],
            [
              "mul",
              7,
              4
            ]
          ]
        },
        "id": "proportion-direct-03"
      },
      {
        "prompt": "Заполни таблицу стоимости одинаковых вещей. 4 вещей стоят 28 рублей; сколько стоят 6?",
        "answer": "42",
        "input": "number",
        "hint": "Сначала восстанови цену одной вещи.",
        "explanation": "28:4 · 6 = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              28,
              4
            ],
            6
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Количество",
            "Стоимость, руб."
          ],
          "rows": [
            [
              "4",
              "28"
            ],
            [
              "6",
              "?"
            ]
          ]
        },
        "id": "proportion-direct-04"
      },
      {
        "prompt": "На 56 рублей покупают вещи по 7 рублей. Сколько вещей можно купить?",
        "answer": "8",
        "input": "number",
        "hint": "Раздели всю сумму на цену одной вещи.",
        "explanation": "56:7 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            56,
            7
          ]
        },
        "id": "proportion-direct-05"
      },
      {
        "prompt": "Для прямой пропорциональности стоимости C и количества n при цене 7 рублей что равно 7?",
        "answer": "C : n",
        "input": "choice",
        "choices": [
          "C · n",
          "n : C",
          "C : n"
        ],
        "hint": "Цена одной единицы получается делением стоимости на количество.",
        "explanation": "C/n = 7. Это отношение постоянно.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 7,
          "values": [
            [
              "mul",
              28,
              4
            ],
            [
              "div",
              4,
              28
            ],
            [
              "div",
              28,
              4
            ]
          ]
        },
        "id": "proportion-direct-06"
      },
      {
        "prompt": "5 одинаковых блокнотов стоят 45 рублей. Сколько стоит один?",
        "answer": "9",
        "input": "number",
        "hint": "Найди постоянную цену одной единицы.",
        "explanation": "45:5 = 9 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            45,
            5
          ]
        },
        "id": "proportion-direct-07"
      },
      {
        "prompt": "Один блокнот стоит 9 рублей. Сколько стоят 8 блокнотов?",
        "answer": "72",
        "input": "number",
        "hint": "Стоимость равна цене единицы, умноженной на количество.",
        "explanation": "9 · 8 = 72 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            9,
            8
          ]
        },
        "id": "proportion-direct-08"
      },
      {
        "prompt": "При той же цене количество покупок увеличили в 3 раза. Во сколько раз увеличится стоимость?",
        "answer": "3",
        "input": "number",
        "hint": "Каждая дополнительная единица стоит столько же.",
        "explanation": "При постоянной цене увеличение количества в 3 раза увеличивает стоимость тоже в 3 раза.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              9,
              5,
              3
            ],
            [
              "mul",
              9,
              5
            ]
          ]
        },
        "id": "proportion-direct-09"
      },
      {
        "prompt": "Заполни таблицу стоимости одинаковых вещей. 5 вещей стоят 45 рублей; сколько стоят 7?",
        "answer": "63",
        "input": "number",
        "hint": "Сначала восстанови цену одной вещи.",
        "explanation": "45:5 · 7 = 63.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              45,
              5
            ],
            7
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Количество",
            "Стоимость, руб."
          ],
          "rows": [
            [
              "5",
              "45"
            ],
            [
              "7",
              "?"
            ]
          ]
        },
        "id": "proportion-direct-10"
      },
      {
        "prompt": "На 81 рублей покупают вещи по 9 рублей. Сколько вещей можно купить?",
        "answer": "9",
        "input": "number",
        "hint": "Раздели всю сумму на цену одной вещи.",
        "explanation": "81:9 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            81,
            9
          ]
        },
        "id": "proportion-direct-11"
      },
      {
        "prompt": "Для прямой пропорциональности стоимости C и количества n при цене 9 рублей что равно 9?",
        "answer": "C : n",
        "input": "choice",
        "choices": [
          "C · n",
          "n : C",
          "C : n"
        ],
        "hint": "Цена одной единицы получается делением стоимости на количество.",
        "explanation": "C/n = 9. Это отношение постоянно.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 9,
          "values": [
            [
              "mul",
              45,
              5
            ],
            [
              "div",
              5,
              45
            ],
            [
              "div",
              45,
              5
            ]
          ]
        },
        "id": "proportion-direct-12"
      },
      {
        "prompt": "6 одинаковых блокнотов стоят 72 рублей. Сколько стоит один?",
        "answer": "12",
        "input": "number",
        "hint": "Найди постоянную цену одной единицы.",
        "explanation": "72:6 = 12 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            72,
            6
          ]
        },
        "id": "proportion-direct-13"
      },
      {
        "prompt": "Один блокнот стоит 12 рублей. Сколько стоят 9 блокнотов?",
        "answer": "108",
        "input": "number",
        "hint": "Стоимость равна цене единицы, умноженной на количество.",
        "explanation": "12 · 9 = 108 рублей.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            9
          ]
        },
        "id": "proportion-direct-14"
      },
      {
        "prompt": "При той же цене количество покупок увеличили в 4 раза. Во сколько раз увеличится стоимость?",
        "answer": "4",
        "input": "number",
        "hint": "Каждая дополнительная единица стоит столько же.",
        "explanation": "При постоянной цене увеличение количества в 4 раза увеличивает стоимость тоже в 4 раза.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              12,
              6,
              4
            ],
            [
              "mul",
              12,
              6
            ]
          ]
        },
        "id": "proportion-direct-15"
      },
      {
        "prompt": "Заполни таблицу стоимости одинаковых вещей. 6 вещей стоят 72 рублей; сколько стоят 8?",
        "answer": "96",
        "input": "number",
        "hint": "Сначала восстанови цену одной вещи.",
        "explanation": "72:6 · 8 = 96.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              72,
              6
            ],
            8
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Количество",
            "Стоимость, руб."
          ],
          "rows": [
            [
              "6",
              "72"
            ],
            [
              "8",
              "?"
            ]
          ]
        },
        "id": "proportion-direct-16"
      },
      {
        "prompt": "На 120 рублей покупают вещи по 12 рублей. Сколько вещей можно купить?",
        "answer": "10",
        "input": "number",
        "hint": "Раздели всю сумму на цену одной вещи.",
        "explanation": "120:12 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            120,
            12
          ]
        },
        "id": "proportion-direct-17"
      },
      {
        "prompt": "Для прямой пропорциональности стоимости C и количества n при цене 12 рублей что равно 12?",
        "answer": "C : n",
        "input": "choice",
        "choices": [
          "C · n",
          "n : C",
          "C : n"
        ],
        "hint": "Цена одной единицы получается делением стоимости на количество.",
        "explanation": "C/n = 12. Это отношение постоянно.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 12,
          "values": [
            [
              "mul",
              72,
              6
            ],
            [
              "div",
              6,
              72
            ],
            [
              "div",
              72,
              6
            ]
          ]
        },
        "id": "proportion-direct-18"
      }
    ]
  },
  {
    "id": "proportion-inverse",
    "group": "percent",
    "title": "Обратная пропорциональность",
    "goal": "При неизменном объёме работы сохранять произведение величин.",
    "covers": [
      "public:v6-inverse"
    ],
    "prerequisites": [
      "oge-basics:percentages/proportion",
      "public:v6-direct"
    ],
    "trainers": [
      {
        "title": "Обратная зависимость",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-inverse",
        "kind": "Модель",
        "instruction": "Изменяй число одинаково производительных работников и сравни время.",
        "finish": "Разбери 3 пары условий."
      },
      {
        "title": "Пропорции: выбираем связь",
        "href": "/trainers/oge-basics/percentages/proportion.html",
        "kind": "Другой способ",
        "instruction": "Сначала реши, что сохраняется: отношение или произведение.",
        "finish": "Выполни 3 задачи."
      }
    ],
    "questions": [
      {
        "prompt": "3 одинаково производительных работника выполняют заказ за 8 ч. За сколько часов его выполнят 6 таких работников?",
        "answer": "4",
        "input": "number",
        "hint": "При двойном числе работников время вдвое меньше, если объём работы и производительность неизменны.",
        "explanation": "3 · 8 : 6 = 4 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              8
            ],
            6
          ]
        },
        "id": "proportion-inverse-01"
      },
      {
        "prompt": "3 работника выполняют заказ за 8 ч. Сколько таких работников нужно, чтобы выполнить его за 4 ч?",
        "answer": "6",
        "input": "number",
        "hint": "Сохраняется число человеко-часов для одного и того же заказа.",
        "explanation": "3 · 8 : 4 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              8
            ],
            "4"
          ]
        },
        "id": "proportion-inverse-02"
      },
      {
        "prompt": "При скорости 30 км/ч путь занимал 4 ч. Сколько часов займёт тот же путь при скорости 60 км/ч?",
        "answer": "2",
        "input": "number",
        "hint": "Сначала найди неизменное расстояние.",
        "explanation": "Путь 120 км. Время 120:60 = 2 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              30,
              4
            ],
            60
          ]
        },
        "id": "proportion-inverse-03"
      },
      {
        "prompt": "Для того же заказа число работников увеличили в 3 раза. Что произойдёт со временем?",
        "answer": "Уменьшится в 3 раза",
        "input": "choice",
        "choices": [
          "Уменьшится в 3 раза",
          "Увеличится в 3 раза",
          "Не изменится"
        ],
        "hint": "Работники одинаково производительны, объём заказа тот же.",
        "explanation": "Произведение числа работников и времени постоянно; множитель времени равен 1/3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            1,
            3
          ],
          "values": [
            "1/3",
            3,
            1
          ]
        },
        "id": "proportion-inverse-04"
      },
      {
        "prompt": "Заполни таблицу одного заказа: 3 работников — 8 ч; 12 работников — ? ч.",
        "answer": "2",
        "input": "number",
        "hint": "Увеличение числа работников должно компенсироваться уменьшением времени.",
        "explanation": "3 · 8 : 12 = 2 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              8
            ],
            12
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Работников",
            "Время, ч"
          ],
          "rows": [
            [
              "3",
              "8"
            ],
            [
              "12",
              "?"
            ]
          ]
        },
        "id": "proportion-inverse-05"
      },
      {
        "prompt": "Машина проходит путь за 4 ч со скоростью 30 км/ч. Какой должна быть скорость для того же пути за 6 ч?",
        "answer": "20",
        "input": "number",
        "hint": "Произведение скорости и времени равно неизменному пути.",
        "explanation": "v = 30 · 4 : 6 = 20 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              30,
              4
            ],
            6
          ]
        },
        "id": "proportion-inverse-06"
      },
      {
        "prompt": "4 одинаково производительных работника выполняют заказ за 10 ч. За сколько часов его выполнят 8 таких работников?",
        "answer": "5",
        "input": "number",
        "hint": "При двойном числе работников время вдвое меньше, если объём работы и производительность неизменны.",
        "explanation": "4 · 10 : 8 = 5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              10
            ],
            8
          ]
        },
        "id": "proportion-inverse-07"
      },
      {
        "prompt": "4 работника выполняют заказ за 10 ч. Сколько таких работников нужно, чтобы выполнить его за 5 ч?",
        "answer": "8",
        "input": "number",
        "hint": "Сохраняется число человеко-часов для одного и того же заказа.",
        "explanation": "4 · 10 : 5 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              10
            ],
            "5"
          ]
        },
        "id": "proportion-inverse-08"
      },
      {
        "prompt": "При скорости 40 км/ч путь занимал 6 ч. Сколько часов займёт тот же путь при скорости 80 км/ч?",
        "answer": "3",
        "input": "number",
        "hint": "Сначала найди неизменное расстояние.",
        "explanation": "Путь 240 км. Время 240:80 = 3 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              40,
              6
            ],
            80
          ]
        },
        "id": "proportion-inverse-09"
      },
      {
        "prompt": "Для того же заказа число работников увеличили в 4 раза. Что произойдёт со временем?",
        "answer": "Уменьшится в 4 раза",
        "input": "choice",
        "choices": [
          "Уменьшится в 4 раза",
          "Увеличится в 4 раза",
          "Не изменится"
        ],
        "hint": "Работники одинаково производительны, объём заказа тот же.",
        "explanation": "Произведение числа работников и времени постоянно; множитель времени равен 1/4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            1,
            4
          ],
          "values": [
            "1/4",
            4,
            1
          ]
        },
        "id": "proportion-inverse-10"
      },
      {
        "prompt": "Заполни таблицу одного заказа: 4 работников — 10 ч; 16 работников — ? ч.",
        "answer": "5/2",
        "input": "number",
        "hint": "Увеличение числа работников должно компенсироваться уменьшением времени.",
        "explanation": "4 · 10 : 16 = 5/2 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              10
            ],
            16
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Работников",
            "Время, ч"
          ],
          "rows": [
            [
              "4",
              "10"
            ],
            [
              "16",
              "?"
            ]
          ]
        },
        "id": "proportion-inverse-11"
      },
      {
        "prompt": "Машина проходит путь за 6 ч со скоростью 40 км/ч. Какой должна быть скорость для того же пути за 8 ч?",
        "answer": "30",
        "input": "number",
        "hint": "Произведение скорости и времени равно неизменному пути.",
        "explanation": "v = 40 · 6 : 8 = 30 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              40,
              6
            ],
            8
          ]
        },
        "id": "proportion-inverse-12"
      },
      {
        "prompt": "5 одинаково производительных работников выполняют заказ за 12 ч. За сколько часов его выполнят 10 таких работников?",
        "answer": "6",
        "input": "number",
        "hint": "При двойном числе работников время вдвое меньше, если объём работы и производительность неизменны.",
        "explanation": "5 · 12 : 10 = 6 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              5,
              12
            ],
            10
          ]
        },
        "id": "proportion-inverse-13"
      },
      {
        "prompt": "5 работников выполняют заказ за 12 ч. Сколько таких работников нужно, чтобы выполнить его за 6 ч?",
        "answer": "10",
        "input": "number",
        "hint": "Сохраняется число человеко-часов для одного и того же заказа.",
        "explanation": "5 · 12 : 6 = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              5,
              12
            ],
            "6"
          ]
        },
        "id": "proportion-inverse-14"
      },
      {
        "prompt": "При скорости 50 км/ч путь занимал 8 ч. Сколько часов займёт тот же путь при скорости 100 км/ч?",
        "answer": "4",
        "input": "number",
        "hint": "Сначала найди неизменное расстояние.",
        "explanation": "Путь 400 км. Время 400:100 = 4 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              50,
              8
            ],
            100
          ]
        },
        "id": "proportion-inverse-15"
      },
      {
        "prompt": "Для того же заказа число работников увеличили в 5 раз. Что произойдёт со временем?",
        "answer": "Уменьшится в 5 раз",
        "input": "choice",
        "choices": [
          "Уменьшится в 5 раз",
          "Увеличится в 5 раз",
          "Не изменится"
        ],
        "hint": "Работники одинаково производительны, объём заказа тот же.",
        "explanation": "Произведение числа работников и времени постоянно; множитель времени равен 1/5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            1,
            5
          ],
          "values": [
            "1/5",
            5,
            1
          ]
        },
        "id": "proportion-inverse-16"
      },
      {
        "prompt": "Заполни таблицу одного заказа: 5 работников — 12 ч; 20 работников — ? ч.",
        "answer": "3",
        "input": "number",
        "hint": "Увеличение числа работников должно компенсироваться уменьшением времени.",
        "explanation": "5 · 12 : 20 = 3 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              5,
              12
            ],
            20
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Работников",
            "Время, ч"
          ],
          "rows": [
            [
              "5",
              "12"
            ],
            [
              "20",
              "?"
            ]
          ]
        },
        "id": "proportion-inverse-17"
      },
      {
        "prompt": "Машина проходит путь за 8 ч со скоростью 50 км/ч. Какой должна быть скорость для того же пути за 10 ч?",
        "answer": "40",
        "input": "number",
        "hint": "Произведение скорости и времени равно неизменному пути.",
        "explanation": "v = 50 · 8 : 10 = 40 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              50,
              8
            ],
            10
          ]
        },
        "id": "proportion-inverse-18"
      }
    ]
  },
  {
    "id": "ratio-scale",
    "group": "percent",
    "title": "Масштаб: карта и настоящая длина",
    "goal": "Сохранять одинаковые единицы при переходе от рисунка к реальности и обратно.",
    "covers": [
      "public:v6-scale-real"
    ],
    "prerequisites": [
      "path:grade7-b-ratio-units",
      "oge-basics:percentages/proportion"
    ],
    "trainers": [
      {
        "title": "Масштаб карты",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-scale-real",
        "kind": "Модель",
        "instruction": "Прочитай масштаб как отношение длин в одинаковых единицах.",
        "finish": "Реши 3 задачи в оба направления."
      },
      {
        "title": "Единицы длины",
        "href": "/trainers/oge-basics/units-length-time.html",
        "kind": "Другой способ",
        "instruction": "Переводи сантиметры, метры и километры перед записью пропорции.",
        "finish": "Выполни 3 перевода."
      }
    ],
    "questions": [
      {
        "prompt": "Масштаб 1:1000. Длина на плане 3 см. Какова реальная длина в метрах?",
        "answer": "30",
        "input": "number",
        "hint": "Умножь длину на знаменатель масштаба, затем переведи сантиметры в метры.",
        "explanation": "3 · 1000 = 3000 см = 30 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              3,
              1000
            ],
            100
          ]
        },
        "id": "ratio-scale-01"
      },
      {
        "prompt": "Реальная длина 30 м. При масштабе 1:1000 сколько сантиметров будет на плане?",
        "answer": "3",
        "input": "number",
        "hint": "Сначала переведи реальную длину в сантиметры, затем раздели на знаменатель масштаба.",
        "explanation": "30 · 100 : 1000 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              30,
              100
            ],
            1000
          ]
        },
        "id": "ratio-scale-02"
      },
      {
        "prompt": "При масштабе 1:1000 сколько реальных метров соответствует 1 см?",
        "answer": "10",
        "input": "number",
        "hint": "Один сантиметр плана означает указанное масштабом число сантиметров.",
        "explanation": "1000 см = 10 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1000,
            100
          ]
        },
        "id": "ratio-scale-03"
      },
      {
        "prompt": "Каким действием найти реальную длину в сантиметрах по 3 см на плане масштаба 1:1000?",
        "answer": "3 · 1000",
        "input": "choice",
        "choices": [
          "3 : 1000",
          "3 + 1000",
          "3 · 1000"
        ],
        "hint": "Реальное расстояние больше длины на плане во столько раз, сколько показывает масштаб.",
        "explanation": "Умножаем 3 на 1000.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            3,
            1000
          ],
          "values": [
            [
              "div",
              3,
              1000
            ],
            [
              "add",
              3,
              1000
            ],
            [
              "mul",
              3,
              1000
            ]
          ]
        },
        "id": "ratio-scale-04"
      },
      {
        "prompt": "Объект длиной 30 м изображён в масштабе 1:2000. Какова длина на новом плане в сантиметрах?",
        "answer": "3/2",
        "input": "number",
        "hint": "При удвоенном знаменателе масштаба рисунок той же длины уменьшается вдвое.",
        "explanation": "30 · 100 : 2000 = 3/2 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              30,
              100
            ],
            2000
          ]
        },
        "id": "ratio-scale-05"
      },
      {
        "prompt": "Отрезок 5 см на плане соответствует 50 м. Найди знаменатель масштаба 1:□.",
        "answer": "1000",
        "input": "number",
        "hint": "Приведи реальную длину к сантиметрам и раздели на длину рисунка.",
        "explanation": "50 · 100 : 5 = 1000.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              "50",
              100
            ],
            5
          ]
        },
        "id": "ratio-scale-06"
      },
      {
        "prompt": "Масштаб 1:2000. Длина на плане 4 см. Какова реальная длина в метрах?",
        "answer": "80",
        "input": "number",
        "hint": "Умножь длину на знаменатель масштаба, затем переведи сантиметры в метры.",
        "explanation": "4 · 2000 = 8000 см = 80 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              4,
              2000
            ],
            100
          ]
        },
        "id": "ratio-scale-07"
      },
      {
        "prompt": "Реальная длина 80 м. При масштабе 1:2000 сколько сантиметров будет на плане?",
        "answer": "4",
        "input": "number",
        "hint": "Сначала переведи реальную длину в сантиметры, затем раздели на знаменатель масштаба.",
        "explanation": "80 · 100 : 2000 = 4 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              80,
              100
            ],
            2000
          ]
        },
        "id": "ratio-scale-08"
      },
      {
        "prompt": "При масштабе 1:2000 сколько реальных метров соответствует 1 см?",
        "answer": "20",
        "input": "number",
        "hint": "Один сантиметр плана означает указанное масштабом число сантиметров.",
        "explanation": "2000 см = 20 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            2000,
            100
          ]
        },
        "id": "ratio-scale-09"
      },
      {
        "prompt": "Каким действием найти реальную длину в сантиметрах по 4 см на плане масштаба 1:2000?",
        "answer": "4 · 2000",
        "input": "choice",
        "choices": [
          "4 : 2000",
          "4 + 2000",
          "4 · 2000"
        ],
        "hint": "Реальное расстояние больше длины на плане во столько раз, сколько показывает масштаб.",
        "explanation": "Умножаем 4 на 2000.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            4,
            2000
          ],
          "values": [
            [
              "div",
              4,
              2000
            ],
            [
              "add",
              4,
              2000
            ],
            [
              "mul",
              4,
              2000
            ]
          ]
        },
        "id": "ratio-scale-10"
      },
      {
        "prompt": "Объект длиной 80 м изображён в масштабе 1:4000. Какова длина на новом плане в сантиметрах?",
        "answer": "2",
        "input": "number",
        "hint": "При удвоенном знаменателе масштаба рисунок той же длины уменьшается вдвое.",
        "explanation": "80 · 100 : 4000 = 2 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              80,
              100
            ],
            4000
          ]
        },
        "id": "ratio-scale-11"
      },
      {
        "prompt": "Отрезок 6 см на плане соответствует 120 м. Найди знаменатель масштаба 1:□.",
        "answer": "2000",
        "input": "number",
        "hint": "Приведи реальную длину к сантиметрам и раздели на длину рисунка.",
        "explanation": "120 · 100 : 6 = 2000.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              "120",
              100
            ],
            6
          ]
        },
        "id": "ratio-scale-12"
      },
      {
        "prompt": "Масштаб 1:5000. Длина на плане 6 см. Какова реальная длина в метрах?",
        "answer": "300",
        "input": "number",
        "hint": "Умножь длину на знаменатель масштаба, затем переведи сантиметры в метры.",
        "explanation": "6 · 5000 = 30000 см = 300 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              6,
              5000
            ],
            100
          ]
        },
        "id": "ratio-scale-13"
      },
      {
        "prompt": "Реальная длина 300 м. При масштабе 1:5000 сколько сантиметров будет на плане?",
        "answer": "6",
        "input": "number",
        "hint": "Сначала переведи реальную длину в сантиметры, затем раздели на знаменатель масштаба.",
        "explanation": "300 · 100 : 5000 = 6 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              300,
              100
            ],
            5000
          ]
        },
        "id": "ratio-scale-14"
      },
      {
        "prompt": "При масштабе 1:5000 сколько реальных метров соответствует 1 см?",
        "answer": "50",
        "input": "number",
        "hint": "Один сантиметр плана означает указанное масштабом число сантиметров.",
        "explanation": "5000 см = 50 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5000,
            100
          ]
        },
        "id": "ratio-scale-15"
      },
      {
        "prompt": "Каким действием найти реальную длину в сантиметрах по 6 см на плане масштаба 1:5000?",
        "answer": "6 · 5000",
        "input": "choice",
        "choices": [
          "6 : 5000",
          "6 + 5000",
          "6 · 5000"
        ],
        "hint": "Реальное расстояние больше длины на плане во столько раз, сколько показывает масштаб.",
        "explanation": "Умножаем 6 на 5000.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            6,
            5000
          ],
          "values": [
            [
              "div",
              6,
              5000
            ],
            [
              "add",
              6,
              5000
            ],
            [
              "mul",
              6,
              5000
            ]
          ]
        },
        "id": "ratio-scale-16"
      },
      {
        "prompt": "Объект длиной 300 м изображён в масштабе 1:10000. Какова длина на новом плане в сантиметрах?",
        "answer": "3",
        "input": "number",
        "hint": "При удвоенном знаменателе масштаба рисунок той же длины уменьшается вдвое.",
        "explanation": "300 · 100 : 10000 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              300,
              100
            ],
            10000
          ]
        },
        "id": "ratio-scale-17"
      },
      {
        "prompt": "Отрезок 8 см на плане соответствует 400 м. Найди знаменатель масштаба 1:□.",
        "answer": "5000",
        "input": "number",
        "hint": "Приведи реальную длину к сантиметрам и раздели на длину рисунка.",
        "explanation": "400 · 100 : 8 = 5000.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              "400",
              100
            ],
            8
          ]
        },
        "id": "ratio-scale-18"
      }
    ]
  }
];
});
