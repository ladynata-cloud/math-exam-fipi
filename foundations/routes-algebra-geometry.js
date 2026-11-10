/* Foundations course: expressions, equations, word problems, data and geometry.
 * 54 routes preserve existing trainer sources. Every route contains 6 learning
 * questions and two disjoint 6-question checks. Local evidence is handled by
 * the course; this content neither reads accounts nor migrates saved work.
 */
(function (root, factory) {
  'use strict';
  const routes = factory();
  if (typeof module === 'object' && module.exports) module.exports = routes;
  else root.FoundationAlgebraGeometryRoutes = routes;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  return [
  {
    "id": "expression-structure",
    "group": "expressions",
    "title": "Порядок внутри выражения",
    "goal": "Увидеть отдельные слагаемые и множители и выбрать порядок вычислений.",
    "covers": [
      "path:grade7-a-expression-structure"
    ],
    "prerequisites": [
      "oge-basics:order-of-operations"
    ],
    "trainers": [
      {
        "title": "Как устроено выражение",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-expression-structure",
        "kind": "По шагам",
        "instruction": "Раздели запись на слагаемые; затем найди множители внутри каждого.",
        "finish": "Разбери 3 выражения."
      },
      {
        "title": "Порядок действий без путаницы",
        "href": "/trainers/oge-basics/order-of-operations.html",
        "kind": "Другой способ",
        "instruction": "Сначала отметь действие, которое выполняется первым; вычисляй по очереди.",
        "finish": "Реши 3 примера без пропуска скобок."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли 4 + 4 · 3.",
        "answer": "16",
        "input": "number",
        "hint": "Умножение выполняют раньше сложения.",
        "explanation": "4 · 3 = 12; затем 4 + 12 = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            [
              "mul",
              4,
              3
            ]
          ]
        },
        "id": "expression-structure-01"
      },
      {
        "prompt": "Вычисли (5 + 5) · 4.",
        "answer": "40",
        "input": "number",
        "hint": "Скобки меняют порядок действий.",
        "explanation": "Сначала 5 + 5 = 10; затем 10 · 4 = 40.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              5,
              5
            ],
            4
          ]
        },
        "id": "expression-structure-02"
      },
      {
        "prompt": "В выражении 6 + 6 · (1 + 2) чему равно слагаемое с умножением?",
        "answer": "18",
        "input": "number",
        "hint": "Нужно найти только второе слагаемое, а не всё выражение.",
        "explanation": "Второе слагаемое: 6 · (1 + 2) = 18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            [
              "add",
              1,
              2
            ]
          ]
        },
        "id": "expression-structure-03"
      },
      {
        "prompt": "Ученик выполнил сложение первым в 7 + 2 · 2. Выбери правильный результат.",
        "answer": "11",
        "input": "choice",
        "hint": "Найди произведение; первое число пока не меняй.",
        "explanation": "2 · 2 = 4; 7 + 4 = 11.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            7,
            [
              "mul",
              2,
              2
            ]
          ],
          "values": [
            "11",
            "18",
            "9"
          ]
        },
        "choices": [
          "11",
          "18",
          "9"
        ],
        "id": "expression-structure-04"
      },
      {
        "prompt": "Тетрадь стоит 8 ₽. Купили 3 тетради и ручку за 11 ₽. Какова стоимость покупки?",
        "answer": "35",
        "input": "number",
        "hint": "Сначала найди стоимость всех тетрадей.",
        "explanation": "8 · 3 + 11 = 35 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              8,
              3
            ],
            11
          ]
        },
        "id": "expression-structure-05"
      },
      {
        "prompt": "Вычисли 36 : 4 + 4.",
        "answer": "13",
        "input": "number",
        "hint": "Деление выполняют раньше сложения.",
        "explanation": "36 : 4 = 9; 9 + 4 = 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              36,
              4
            ],
            4
          ]
        },
        "id": "expression-structure-06"
      },
      {
        "prompt": "Вычисли 10 + 5 · 1.",
        "answer": "15",
        "input": "number",
        "hint": "Умножение выполняют раньше сложения.",
        "explanation": "5 · 1 = 5; затем 10 + 5 = 15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            10,
            [
              "mul",
              5,
              1
            ]
          ]
        },
        "id": "expression-structure-07"
      },
      {
        "prompt": "Вычисли (11 + 6) · 2.",
        "answer": "34",
        "input": "number",
        "hint": "Скобки меняют порядок действий.",
        "explanation": "Сначала 11 + 6 = 17; затем 17 · 2 = 34.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              11,
              6
            ],
            2
          ]
        },
        "id": "expression-structure-08"
      },
      {
        "prompt": "В выражении 12 + 2 · (3 + 2) чему равно слагаемое с умножением?",
        "answer": "10",
        "input": "number",
        "hint": "Нужно найти только второе слагаемое, а не всё выражение.",
        "explanation": "Второе слагаемое: 2 · (3 + 2) = 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              3,
              2
            ]
          ]
        },
        "id": "expression-structure-09"
      },
      {
        "prompt": "Ученик выполнил сложение первым в 13 + 3 · 2. Выбери правильный результат.",
        "answer": "19",
        "input": "choice",
        "hint": "Найди произведение; первое число пока не меняй.",
        "explanation": "3 · 2 = 6; 13 + 6 = 19.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            13,
            [
              "mul",
              3,
              2
            ]
          ],
          "values": [
            "19",
            "32",
            "16"
          ]
        },
        "choices": [
          "19",
          "32",
          "16"
        ],
        "id": "expression-structure-10"
      },
      {
        "prompt": "Тетрадь стоит 14 ₽. Купили 4 тетради и ручку за 9 ₽. Какова стоимость покупки?",
        "answer": "65",
        "input": "number",
        "hint": "Сначала найди стоимость всех тетрадей.",
        "explanation": "14 · 4 + 9 = 65 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              14,
              4
            ],
            9
          ]
        },
        "id": "expression-structure-11"
      },
      {
        "prompt": "Вычисли 75 : 5 + 2.",
        "answer": "17",
        "input": "number",
        "hint": "Деление выполняют раньше сложения.",
        "explanation": "75 : 5 = 15; 15 + 2 = 17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              75,
              5
            ],
            2
          ]
        },
        "id": "expression-structure-12"
      },
      {
        "prompt": "Вычисли 16 + 6 · 3.",
        "answer": "34",
        "input": "number",
        "hint": "Умножение выполняют раньше сложения.",
        "explanation": "6 · 3 = 18; затем 16 + 18 = 34.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            16,
            [
              "mul",
              6,
              3
            ]
          ]
        },
        "id": "expression-structure-13"
      },
      {
        "prompt": "Вычисли (17 + 2) · 4.",
        "answer": "76",
        "input": "number",
        "hint": "Скобки меняют порядок действий.",
        "explanation": "Сначала 17 + 2 = 19; затем 19 · 4 = 76.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              17,
              2
            ],
            4
          ]
        },
        "id": "expression-structure-14"
      },
      {
        "prompt": "В выражении 18 + 3 · (1 + 2) чему равно слагаемое с умножением?",
        "answer": "9",
        "input": "number",
        "hint": "Нужно найти только второе слагаемое, а не всё выражение.",
        "explanation": "Второе слагаемое: 3 · (1 + 2) = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "add",
              1,
              2
            ]
          ]
        },
        "id": "expression-structure-15"
      },
      {
        "prompt": "Ученик выполнил сложение первым в 19 + 4 · 2. Выбери правильный результат.",
        "answer": "27",
        "input": "choice",
        "hint": "Найди произведение; первое число пока не меняй.",
        "explanation": "4 · 2 = 8; 19 + 8 = 27.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            19,
            [
              "mul",
              4,
              2
            ]
          ],
          "values": [
            "27",
            "46",
            "23"
          ]
        },
        "choices": [
          "27",
          "46",
          "23"
        ],
        "id": "expression-structure-16"
      },
      {
        "prompt": "Тетрадь стоит 20 ₽. Купили 5 тетрадей и ручку за 11 ₽. Какова стоимость покупки?",
        "answer": "111",
        "input": "number",
        "hint": "Сначала найди стоимость всех тетрадей.",
        "explanation": "20 · 5 + 11 = 111 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              20,
              5
            ],
            11
          ]
        },
        "id": "expression-structure-17"
      },
      {
        "prompt": "Вычисли 126 : 6 + 4.",
        "answer": "25",
        "input": "number",
        "hint": "Деление выполняют раньше сложения.",
        "explanation": "126 : 6 = 21; 21 + 4 = 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              126,
              6
            ],
            4
          ]
        },
        "id": "expression-structure-18"
      }
    ]
  },
  {
    "id": "expression-minus",
    "group": "expressions",
    "title": "Минус перед скобками",
    "goal": "Менять знак каждого слагаемого при раскрытии скобок.",
    "covers": [
      "path:grade7-a-opposite-expression"
    ],
    "prerequisites": [
      "oge-basics:negative-add-subtract"
    ],
    "trainers": [
      {
        "title": "Минус перед выражением",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-opposite-expression",
        "kind": "По шагам",
        "instruction": "Назови противоположное каждому слагаемому внутри скобок.",
        "finish": "Раскрой 3 пары скобок."
      },
      {
        "title": "Подобные слагаемые: исследование",
        "href": "/trainers/like-terms-lab.html",
        "kind": "Модель",
        "instruction": "Сравни выражение и противоположное ему при нескольких значениях буквы.",
        "finish": "Проверь 3 подстановки."
      }
    ],
    "questions": [
      {
        "prompt": "Вычисли −(4 − 3).",
        "answer": "-1",
        "input": "number",
        "hint": "Минус перед скобками меняет знаки обоих слагаемых.",
        "explanation": "−(4 − 3) = −4 + 3 = −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "sub",
              4,
              3
            ]
          ]
        },
        "id": "expression-minus-01"
      },
      {
        "prompt": "Раскрой скобки в −(5x + 4). Какой коэффициент получится при x?",
        "answer": "-5",
        "input": "number",
        "hint": "Минус действует и на буквенное слагаемое.",
        "explanation": "Получится −5x − 4; коэффициент при x равен −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            5
          ]
        },
        "id": "expression-minus-02"
      },
      {
        "prompt": "В 6 − (x − 5) после раскрытия скобок получится −x + c. Найди c.",
        "answer": "11",
        "input": "number",
        "hint": "Второй минус внутри скобок тоже меняется.",
        "explanation": "6 − x + 5 = −x + 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            6,
            5
          ]
        },
        "id": "expression-minus-03"
      },
      {
        "prompt": "Вычисли −(−7 − 1).",
        "answer": "8",
        "input": "choice",
        "hint": "Противоположное отрицательному числу положительно.",
        "explanation": "−(−7 − 1) = 7 + 1 = 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "sub",
              -7,
              1
            ]
          ],
          "values": [
            "-8",
            "6",
            "8"
          ]
        },
        "choices": [
          "-8",
          "6",
          "8"
        ],
        "id": "expression-minus-04"
      },
      {
        "prompt": "Подставь x = 6 в выражение −(x + 2).",
        "answer": "-8",
        "input": "number",
        "hint": "Сначала можно найти сумму в скобках.",
        "explanation": "−(6 + 2) = −8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "add",
              6,
              2
            ]
          ]
        },
        "id": "expression-minus-05"
      },
      {
        "prompt": "Упрости 9x − (3x − 5). Какой коэффициент при x?",
        "answer": "6",
        "input": "number",
        "hint": "Раскрой скобки, затем собери слагаемые с x.",
        "explanation": "9x − 3x + 5 = 6x + 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            3
          ]
        },
        "id": "expression-minus-06"
      },
      {
        "prompt": "Вычисли −(10 − 4).",
        "answer": "-6",
        "input": "number",
        "hint": "Минус перед скобками меняет знаки обоих слагаемых.",
        "explanation": "−(10 − 4) = −10 + 4 = −6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "sub",
              10,
              4
            ]
          ]
        },
        "id": "expression-minus-07"
      },
      {
        "prompt": "Раскрой скобки в −(11x + 5). Какой коэффициент получится при x?",
        "answer": "-11",
        "input": "number",
        "hint": "Минус действует и на буквенное слагаемое.",
        "explanation": "Получится −11x − 5; коэффициент при x равен −11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            11
          ]
        },
        "id": "expression-minus-08"
      },
      {
        "prompt": "В 12 − (x − 1) после раскрытия скобок получится −x + c. Найди c.",
        "answer": "13",
        "input": "number",
        "hint": "Второй минус внутри скобок тоже меняется.",
        "explanation": "12 − x + 1 = −x + 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            12,
            1
          ]
        },
        "id": "expression-minus-09"
      },
      {
        "prompt": "Вычисли −(−13 − 2).",
        "answer": "15",
        "input": "choice",
        "hint": "Противоположное отрицательному числу положительно.",
        "explanation": "−(−13 − 2) = 13 + 2 = 15.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "sub",
              -13,
              2
            ]
          ],
          "values": [
            "-15",
            "11",
            "15"
          ]
        },
        "choices": [
          "-15",
          "11",
          "15"
        ],
        "id": "expression-minus-10"
      },
      {
        "prompt": "Подставь x = 12 в выражение −(x + 3).",
        "answer": "-15",
        "input": "number",
        "hint": "Сначала можно найти сумму в скобках.",
        "explanation": "−(12 + 3) = −15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "add",
              12,
              3
            ]
          ]
        },
        "id": "expression-minus-11"
      },
      {
        "prompt": "Упрости 15x − (4x − 5). Какой коэффициент при x?",
        "answer": "11",
        "input": "number",
        "hint": "Раскрой скобки, затем собери слагаемые с x.",
        "explanation": "15x − 4x + 5 = 11x + 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            15,
            4
          ]
        },
        "id": "expression-minus-12"
      },
      {
        "prompt": "Вычисли −(16 − 5).",
        "answer": "-11",
        "input": "number",
        "hint": "Минус перед скобками меняет знаки обоих слагаемых.",
        "explanation": "−(16 − 5) = −16 + 5 = −11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "sub",
              16,
              5
            ]
          ]
        },
        "id": "expression-minus-13"
      },
      {
        "prompt": "Раскрой скобки в −(17x + 1). Какой коэффициент получится при x?",
        "answer": "-17",
        "input": "number",
        "hint": "Минус действует и на буквенное слагаемое.",
        "explanation": "Получится −17x − 1; коэффициент при x равен −17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            17
          ]
        },
        "id": "expression-minus-14"
      },
      {
        "prompt": "В 18 − (x − 2) после раскрытия скобок получится −x + c. Найди c.",
        "answer": "20",
        "input": "number",
        "hint": "Второй минус внутри скобок тоже меняется.",
        "explanation": "18 − x + 2 = −x + 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            18,
            2
          ]
        },
        "id": "expression-minus-15"
      },
      {
        "prompt": "Вычисли −(−19 − 3).",
        "answer": "22",
        "input": "choice",
        "hint": "Противоположное отрицательному числу положительно.",
        "explanation": "−(−19 − 3) = 19 + 3 = 22.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "sub",
              -19,
              3
            ]
          ],
          "values": [
            "-22",
            "16",
            "22"
          ]
        },
        "choices": [
          "-22",
          "16",
          "22"
        ],
        "id": "expression-minus-16"
      },
      {
        "prompt": "Подставь x = 18 в выражение −(x + 4).",
        "answer": "-22",
        "input": "number",
        "hint": "Сначала можно найти сумму в скобках.",
        "explanation": "−(18 + 4) = −22.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "add",
              18,
              4
            ]
          ]
        },
        "id": "expression-minus-17"
      },
      {
        "prompt": "Упрости 21x − (5x − 5). Какой коэффициент при x?",
        "answer": "16",
        "input": "number",
        "hint": "Раскрой скобки, затем собери слагаемые с x.",
        "explanation": "21x − 5x + 5 = 16x + 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            21,
            5
          ]
        },
        "id": "expression-minus-18"
      }
    ]
  },
  {
    "id": "expression-like-terms",
    "group": "expressions",
    "title": "Подобные слагаемые",
    "goal": "Собирать отдельно слагаемые с одинаковой буквенной частью.",
    "covers": [
      "path:grade7-a-two-variable-collect",
      "public:like-lab",
      "public:like-factory",
      "public:like-practice"
    ],
    "prerequisites": [
      "path:grade7-a-expression-structure"
    ],
    "trainers": [
      {
        "title": "Подобные слагаемые: собрать группы",
        "href": "/trainers/like-terms-factory.html",
        "kind": "Модель",
        "instruction": "Распредели слагаемые по группам с одинаковыми буквами.",
        "finish": "Собери 3 выражения."
      },
      {
        "title": "Подобные слагаемые: исследование",
        "href": "/trainers/like-terms-lab.html",
        "kind": "Другой способ",
        "instruction": "Меняй значения букв и сравнивай исходное и собранное выражения.",
        "finish": "Проверь 2 выражения на трёх подстановках."
      },
      {
        "title": "Подобные слагаемые: практика",
        "href": "/trainers/like-terms-trainer.html",
        "kind": "Практика",
        "instruction": "Собирай коэффициенты со знаком; разные буквы оставляй раздельно.",
        "finish": "Упрости 4 выражения."
      }
    ],
    "questions": [
      {
        "prompt": "Упрости 4x + 4x. Введи коэффициент при x.",
        "answer": "8",
        "input": "number",
        "hint": "Буквенная часть одинакова; складываются коэффициенты.",
        "explanation": "4x + 4x = 8x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            4
          ]
        },
        "id": "expression-like-terms-01"
      },
      {
        "prompt": "Упрости 5x + 5y − 4x. Введи коэффициент при x.",
        "answer": "1",
        "input": "number",
        "hint": "Слагаемое с y в группу x не входит.",
        "explanation": "(5 − 4)x + 5y = 1x + 5y.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            4
          ]
        },
        "id": "expression-like-terms-02"
      },
      {
        "prompt": "В выражении 6a − 6b + 1b какой коэффициент получится при b? Введи только число.",
        "answer": "-5",
        "input": "number",
        "hint": "Сохрани минус у первого слагаемого с b.",
        "explanation": "Коэффициент: −6 + 1 = −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -6,
            1
          ]
        },
        "id": "expression-like-terms-03"
      },
      {
        "prompt": "Какой коэффициент при x в 7x − x + 2x?",
        "answer": "8",
        "input": "choice",
        "hint": "У одиночной буквы коэффициент равен 1.",
        "explanation": "7 − 1 + 2 = 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "sub",
              7,
              1
            ],
            2
          ],
          "values": [
            "10",
            "8",
            "9"
          ]
        },
        "choices": [
          "10",
          "8",
          "9"
        ],
        "id": "expression-like-terms-04"
      },
      {
        "prompt": "После объединения 8x + 3 + 3x − 2 чему равен свободный член?",
        "answer": "1",
        "input": "number",
        "hint": "Свободные числа складываются отдельно от слагаемых с x.",
        "explanation": "Свободный член: 3 − 2 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            3,
            2
          ]
        },
        "id": "expression-like-terms-05"
      },
      {
        "prompt": "Упрости 9x + 4x и найди значение при x = 2.",
        "answer": "26",
        "input": "number",
        "hint": "Сначала можно сложить коэффициенты, затем подставить x.",
        "explanation": "(9 + 4) · 2 = 26.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              9,
              4
            ],
            2
          ]
        },
        "id": "expression-like-terms-06"
      },
      {
        "prompt": "Упрости 10x + 5x. Введи коэффициент при x.",
        "answer": "15",
        "input": "number",
        "hint": "Буквенная часть одинакова; складываются коэффициенты.",
        "explanation": "10x + 5x = 15x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            10,
            5
          ]
        },
        "id": "expression-like-terms-07"
      },
      {
        "prompt": "Упрости 11x + 6y − 2x. Введи коэффициент при x.",
        "answer": "9",
        "input": "number",
        "hint": "Слагаемое с y в группу x не входит.",
        "explanation": "(11 − 2)x + 6y = 9x + 6y.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            11,
            2
          ]
        },
        "id": "expression-like-terms-08"
      },
      {
        "prompt": "В выражении 12a − 2b + 3b какой коэффициент получится при b? Введи только число.",
        "answer": "1",
        "input": "number",
        "hint": "Сохрани минус у первого слагаемого с b.",
        "explanation": "Коэффициент: −2 + 3 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -2,
            3
          ]
        },
        "id": "expression-like-terms-09"
      },
      {
        "prompt": "Какой коэффициент при x в 13x − x + 3x?",
        "answer": "15",
        "input": "choice",
        "hint": "У одиночной буквы коэффициент равен 1.",
        "explanation": "13 − 1 + 3 = 15.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "sub",
              13,
              1
            ],
            3
          ],
          "values": [
            "17",
            "15",
            "16"
          ]
        },
        "choices": [
          "17",
          "15",
          "16"
        ],
        "id": "expression-like-terms-10"
      },
      {
        "prompt": "После объединения 14x + 4 + 1x − 2 чему равен свободный член?",
        "answer": "2",
        "input": "number",
        "hint": "Свободные числа складываются отдельно от слагаемых с x.",
        "explanation": "Свободный член: 4 − 2 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            4,
            2
          ]
        },
        "id": "expression-like-terms-11"
      },
      {
        "prompt": "Упрости 15x + 5x и найди значение при x = 2.",
        "answer": "40",
        "input": "number",
        "hint": "Сначала можно сложить коэффициенты, затем подставить x.",
        "explanation": "(15 + 5) · 2 = 40.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              15,
              5
            ],
            2
          ]
        },
        "id": "expression-like-terms-12"
      },
      {
        "prompt": "Упрости 16x + 6x. Введи коэффициент при x.",
        "answer": "22",
        "input": "number",
        "hint": "Буквенная часть одинакова; складываются коэффициенты.",
        "explanation": "16x + 6x = 22x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            16,
            6
          ]
        },
        "id": "expression-like-terms-13"
      },
      {
        "prompt": "Упрости 17x + 2y − 4x. Введи коэффициент при x.",
        "answer": "13",
        "input": "number",
        "hint": "Слагаемое с y в группу x не входит.",
        "explanation": "(17 − 4)x + 2y = 13x + 2y.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            17,
            4
          ]
        },
        "id": "expression-like-terms-14"
      },
      {
        "prompt": "В выражении 18a − 3b + 1b какой коэффициент получится при b? Введи только число.",
        "answer": "-2",
        "input": "number",
        "hint": "Сохрани минус у первого слагаемого с b.",
        "explanation": "Коэффициент: −3 + 1 = −2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -3,
            1
          ]
        },
        "id": "expression-like-terms-15"
      },
      {
        "prompt": "Какой коэффициент при x в 19x − x + 4x?",
        "answer": "22",
        "input": "choice",
        "hint": "У одиночной буквы коэффициент равен 1.",
        "explanation": "19 − 1 + 4 = 22.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "sub",
              19,
              1
            ],
            4
          ],
          "values": [
            "24",
            "22",
            "23"
          ]
        },
        "choices": [
          "24",
          "22",
          "23"
        ],
        "id": "expression-like-terms-16"
      },
      {
        "prompt": "После объединения 20x + 5 + 3x − 2 чему равен свободный член?",
        "answer": "3",
        "input": "number",
        "hint": "Свободные числа складываются отдельно от слагаемых с x.",
        "explanation": "Свободный член: 5 − 2 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            2
          ]
        },
        "id": "expression-like-terms-17"
      },
      {
        "prompt": "Упрости 21x + 6x и найди значение при x = 2.",
        "answer": "54",
        "input": "number",
        "hint": "Сначала можно сложить коэффициенты, затем подставить x.",
        "explanation": "(21 + 6) · 2 = 54.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              21,
              6
            ],
            2
          ]
        },
        "id": "expression-like-terms-18"
      }
    ]
  },
  {
    "id": "expression-substitution",
    "group": "expressions",
    "title": "Подстановка со знаком и дробью",
    "goal": "Подставлять число вместо буквы в скобках, сохраняя знак и порядок действий.",
    "covers": [
      "path:grade7-a-substitution-negative-fraction"
    ],
    "prerequisites": [
      "path:grade7-a-opposite-expression",
      "path:pre7-equivalent-fractions"
    ],
    "trainers": [
      {
        "title": "Подстановка отрицательной дроби",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-substitution-negative-fraction",
        "kind": "По шагам",
        "instruction": "Запиши отрицательное значение буквы в скобках и выполни действия.",
        "finish": "Сделай 3 подстановки."
      },
      {
        "title": "Подобные слагаемые: исследование",
        "href": "/trainers/like-terms-lab.html",
        "kind": "Модель",
        "instruction": "Сравни значение исходного и упрощённого выражения при отрицательном x.",
        "finish": "Проверь 3 отрицательных значения."
      }
    ],
    "questions": [
      {
        "prompt": "Найди 4x + 3, если x = −1/4.",
        "answer": "2",
        "input": "number",
        "hint": "Подставь дробь в скобках. Множитель и знаменатель сокращаются.",
        "explanation": "4 · (−1/4) + 3 = −1 + 3 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              4,
              "-1/4"
            ],
            3
          ]
        },
        "id": "expression-substitution-01"
      },
      {
        "prompt": "Найди x − 4, если x = −1/5.",
        "answer": "-21/5",
        "input": "number",
        "hint": "Из отрицательной дроби вычитается положительное число.",
        "explanation": "−1/5 − 4 = −21/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/5",
            4
          ]
        },
        "id": "expression-substitution-02"
      },
      {
        "prompt": "Найди −2x, если x = −5/2.",
        "answer": "5",
        "input": "number",
        "hint": "Произведение двух отрицательных чисел положительно.",
        "explanation": "−2 · (−5/2) = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -2,
            "-5/2"
          ]
        },
        "id": "expression-substitution-03"
      },
      {
        "prompt": "При x = −6 чему равно x²?",
        "answer": "36",
        "input": "choice",
        "hint": "Квадрат означает произведение числа на себя.",
        "explanation": "(−6) · (−6) = 36.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            -6,
            2
          ],
          "values": [
            "36",
            "-36",
            "12"
          ]
        },
        "choices": [
          "36",
          "-36",
          "12"
        ],
        "id": "expression-substitution-04"
      },
      {
        "prompt": "Найди 2x + 7, если x = −6/2.",
        "answer": "1",
        "input": "number",
        "hint": "Умножь дробь на 2, затем прибавь число.",
        "explanation": "2 · (−6/2) + 7 = −6 + 7 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              2,
              "-6/2"
            ],
            7
          ]
        },
        "id": "expression-substitution-05"
      },
      {
        "prompt": "Найди x : 5, если x = −8.",
        "answer": "-8/5",
        "input": "number",
        "hint": "Сохрани отрицательный знак; ответ можно записать дробью.",
        "explanation": "−8 : 5 = −8/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -8,
            5
          ]
        },
        "id": "expression-substitution-06"
      },
      {
        "prompt": "Найди 2x + 9, если x = −1/2.",
        "answer": "8",
        "input": "number",
        "hint": "Подставь дробь в скобках. Множитель и знаменатель сокращаются.",
        "explanation": "2 · (−1/2) + 9 = −1 + 9 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              2,
              "-1/2"
            ],
            9
          ]
        },
        "id": "expression-substitution-07"
      },
      {
        "prompt": "Найди x − 10, если x = −1/3.",
        "answer": "-31/3",
        "input": "number",
        "hint": "Из отрицательной дроби вычитается положительное число.",
        "explanation": "−1/3 − 10 = −31/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/3",
            10
          ]
        },
        "id": "expression-substitution-08"
      },
      {
        "prompt": "Найди −4x, если x = −11/4.",
        "answer": "11",
        "input": "number",
        "hint": "Произведение двух отрицательных чисел положительно.",
        "explanation": "−4 · (−11/4) = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -4,
            "-11/4"
          ]
        },
        "id": "expression-substitution-09"
      },
      {
        "prompt": "При x = −12 чему равно x²?",
        "answer": "144",
        "input": "choice",
        "hint": "Квадрат означает произведение числа на себя.",
        "explanation": "(−12) · (−12) = 144.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            -12,
            2
          ],
          "values": [
            "144",
            "-144",
            "24"
          ]
        },
        "choices": [
          "144",
          "-144",
          "24"
        ],
        "id": "expression-substitution-10"
      },
      {
        "prompt": "Найди 2x + 13, если x = −12/2.",
        "answer": "1",
        "input": "number",
        "hint": "Умножь дробь на 2, затем прибавь число.",
        "explanation": "2 · (−12/2) + 13 = −12 + 13 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              2,
              "-12/2"
            ],
            13
          ]
        },
        "id": "expression-substitution-11"
      },
      {
        "prompt": "Найди x : 3, если x = −14.",
        "answer": "-14/3",
        "input": "number",
        "hint": "Сохрани отрицательный знак; ответ можно записать дробью.",
        "explanation": "−14 : 3 = −14/3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -14,
            3
          ]
        },
        "id": "expression-substitution-12"
      },
      {
        "prompt": "Найди 4x + 15, если x = −1/4.",
        "answer": "14",
        "input": "number",
        "hint": "Подставь дробь в скобках. Множитель и знаменатель сокращаются.",
        "explanation": "4 · (−1/4) + 15 = −1 + 15 = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              4,
              "-1/4"
            ],
            15
          ]
        },
        "id": "expression-substitution-13"
      },
      {
        "prompt": "Найди x − 16, если x = −1/5.",
        "answer": "-81/5",
        "input": "number",
        "hint": "Из отрицательной дроби вычитается положительное число.",
        "explanation": "−1/5 − 16 = −81/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            "-1/5",
            16
          ]
        },
        "id": "expression-substitution-14"
      },
      {
        "prompt": "Найди −2x, если x = −17/2.",
        "answer": "17",
        "input": "number",
        "hint": "Произведение двух отрицательных чисел положительно.",
        "explanation": "−2 · (−17/2) = 17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -2,
            "-17/2"
          ]
        },
        "id": "expression-substitution-15"
      },
      {
        "prompt": "При x = −18 чему равно x²?",
        "answer": "324",
        "input": "choice",
        "hint": "Квадрат означает произведение числа на себя.",
        "explanation": "(−18) · (−18) = 324.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            -18,
            2
          ],
          "values": [
            "324",
            "-324",
            "36"
          ]
        },
        "choices": [
          "324",
          "-324",
          "36"
        ],
        "id": "expression-substitution-16"
      },
      {
        "prompt": "Найди 2x + 19, если x = −18/2.",
        "answer": "1",
        "input": "number",
        "hint": "Умножь дробь на 2, затем прибавь число.",
        "explanation": "2 · (−18/2) + 19 = −18 + 19 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              2,
              "-18/2"
            ],
            19
          ]
        },
        "id": "expression-substitution-17"
      },
      {
        "prompt": "Найди x : 5, если x = −20.",
        "answer": "-4",
        "input": "number",
        "hint": "Сохрани отрицательный знак; ответ можно записать дробью.",
        "explanation": "−20 : 5 = −4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            -20,
            5
          ]
        },
        "id": "expression-substitution-18"
      }
    ]
  },
  {
    "id": "expression-multiply-brackets",
    "group": "expressions",
    "title": "Число перед скобками",
    "goal": "Умножать на каждый член суммы и проверять раскрытие подстановкой.",
    "covers": [
      "public:v6-brackets-factor"
    ],
    "prerequisites": [
      "path:grade7-a-expression-structure"
    ],
    "trainers": [
      {
        "title": "Число перед скобками",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-brackets-factor",
        "kind": "Модель",
        "instruction": "Раздели прямоугольник или сумму на части и умножь каждую часть.",
        "finish": "Раскрой 3 скобки."
      },
      {
        "title": "Уравнения со скобками",
        "href": "/ege-baza/path/index.html#lesson=equations-brackets",
        "kind": "По шагам",
        "instruction": "В первом шаге уравнения раскрой скобки, не теряя второе произведение.",
        "finish": "Разбери начало 3 уравнений."
      }
    ],
    "questions": [
      {
        "prompt": "Раскрой 4(x + 3). Какое число стоит без x?",
        "answer": "12",
        "input": "number",
        "hint": "Внешний множитель умножается на оба слагаемых.",
        "explanation": "4(x + 3) = 4x + 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            3
          ]
        },
        "id": "expression-multiply-brackets-01"
      },
      {
        "prompt": "Раскрой 5(4x − 1). Введи коэффициент при x.",
        "answer": "20",
        "input": "number",
        "hint": "Умножь коэффициент при x на число перед скобками.",
        "explanation": "5 · 4x = 20x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            4
          ]
        },
        "id": "expression-multiply-brackets-02"
      },
      {
        "prompt": "Вычисли удобным способом 6(5 + 2).",
        "answer": "42",
        "input": "number",
        "hint": "Можно умножить каждое слагаемое и сложить произведения.",
        "explanation": "6 · 5 + 6 · 2 = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            [
              "add",
              5,
              2
            ]
          ]
        },
        "id": "expression-multiply-brackets-03"
      },
      {
        "prompt": "В −2(x − 6) какой свободный член после раскрытия скобок?",
        "answer": "12",
        "input": "choice",
        "hint": "Второе произведение содержит два минуса.",
        "explanation": "−2 · (−6) = 12.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            -2,
            -6
          ],
          "values": [
            "-12",
            "6",
            "12"
          ]
        },
        "choices": [
          "-12",
          "6",
          "12"
        ],
        "id": "expression-multiply-brackets-04"
      },
      {
        "prompt": "В 3(x + 7) − 1x какой коэффициент при x?",
        "answer": "2",
        "input": "number",
        "hint": "Сначала раскрой скобки, затем собери слагаемые с x.",
        "explanation": "3x + 21 − 1x = 2x + 21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            3,
            1
          ]
        },
        "id": "expression-multiply-brackets-05"
      },
      {
        "prompt": "Стороны прямоугольника 4 см и (8 + 2) см. Найди площадь.",
        "answer": "40",
        "input": "number",
        "hint": "Площадь можно получить как сумму площадей двух частей.",
        "explanation": "4 · (8 + 2) = 40 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            [
              "add",
              8,
              2
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 10,
          "height": 4,
          "unit": "см"
        },
        "id": "expression-multiply-brackets-06"
      },
      {
        "prompt": "Раскрой 5(x + 9). Какое число стоит без x?",
        "answer": "45",
        "input": "number",
        "hint": "Внешний множитель умножается на оба слагаемых.",
        "explanation": "5(x + 9) = 5x + 45.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            9
          ]
        },
        "id": "expression-multiply-brackets-07"
      },
      {
        "prompt": "Раскрой 6(10x − 1). Введи коэффициент при x.",
        "answer": "60",
        "input": "number",
        "hint": "Умножь коэффициент при x на число перед скобками.",
        "explanation": "6 · 10x = 60x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            10
          ]
        },
        "id": "expression-multiply-brackets-08"
      },
      {
        "prompt": "Вычисли удобным способом 2(11 + 2).",
        "answer": "26",
        "input": "number",
        "hint": "Можно умножить каждое слагаемое и сложить произведения.",
        "explanation": "2 · 11 + 2 · 2 = 26.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              11,
              2
            ]
          ]
        },
        "id": "expression-multiply-brackets-09"
      },
      {
        "prompt": "В −3(x − 12) какой свободный член после раскрытия скобок?",
        "answer": "36",
        "input": "choice",
        "hint": "Второе произведение содержит два минуса.",
        "explanation": "−3 · (−12) = 36.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            -3,
            -12
          ],
          "values": [
            "-36",
            "12",
            "36"
          ]
        },
        "choices": [
          "-36",
          "12",
          "36"
        ],
        "id": "expression-multiply-brackets-10"
      },
      {
        "prompt": "В 4(x + 13) − 1x какой коэффициент при x?",
        "answer": "3",
        "input": "number",
        "hint": "Сначала раскрой скобки, затем собери слагаемые с x.",
        "explanation": "4x + 52 − 1x = 3x + 52.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            4,
            1
          ]
        },
        "id": "expression-multiply-brackets-11"
      },
      {
        "prompt": "Стороны прямоугольника 5 см и (14 + 2) см. Найди площадь.",
        "answer": "80",
        "input": "number",
        "hint": "Площадь можно получить как сумму площадей двух частей.",
        "explanation": "5 · (14 + 2) = 80 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            [
              "add",
              14,
              2
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 16,
          "height": 5,
          "unit": "см"
        },
        "id": "expression-multiply-brackets-12"
      },
      {
        "prompt": "Раскрой 6(x + 15). Какое число стоит без x?",
        "answer": "90",
        "input": "number",
        "hint": "Внешний множитель умножается на оба слагаемых.",
        "explanation": "6(x + 15) = 6x + 90.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            15
          ]
        },
        "id": "expression-multiply-brackets-13"
      },
      {
        "prompt": "Раскрой 2(16x − 1). Введи коэффициент при x.",
        "answer": "32",
        "input": "number",
        "hint": "Умножь коэффициент при x на число перед скобками.",
        "explanation": "2 · 16x = 32x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            16
          ]
        },
        "id": "expression-multiply-brackets-14"
      },
      {
        "prompt": "Вычисли удобным способом 3(17 + 2).",
        "answer": "57",
        "input": "number",
        "hint": "Можно умножить каждое слагаемое и сложить произведения.",
        "explanation": "3 · 17 + 3 · 2 = 57.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "add",
              17,
              2
            ]
          ]
        },
        "id": "expression-multiply-brackets-15"
      },
      {
        "prompt": "В −4(x − 18) какой свободный член после раскрытия скобок?",
        "answer": "72",
        "input": "choice",
        "hint": "Второе произведение содержит два минуса.",
        "explanation": "−4 · (−18) = 72.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            -4,
            -18
          ],
          "values": [
            "-72",
            "18",
            "72"
          ]
        },
        "choices": [
          "-72",
          "18",
          "72"
        ],
        "id": "expression-multiply-brackets-16"
      },
      {
        "prompt": "В 5(x + 19) − 1x какой коэффициент при x?",
        "answer": "4",
        "input": "number",
        "hint": "Сначала раскрой скобки, затем собери слагаемые с x.",
        "explanation": "5x + 95 − 1x = 4x + 95.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            1
          ]
        },
        "id": "expression-multiply-brackets-17"
      },
      {
        "prompt": "Стороны прямоугольника 6 см и (20 + 2) см. Найди площадь.",
        "answer": "132",
        "input": "number",
        "hint": "Площадь можно получить как сумму площадей двух частей.",
        "explanation": "6 · (20 + 2) = 132 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            [
              "add",
              20,
              2
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 22,
          "height": 6,
          "unit": "см"
        },
        "id": "expression-multiply-brackets-18"
      }
    ]
  },
  {
    "id": "expression-common-factor",
    "group": "expressions",
    "title": "Общий множитель",
    "goal": "Увидеть общий множитель в слагаемых и восстановить скобки.",
    "covers": [
      "public:v6-properties-factor"
    ],
    "prerequisites": [
      "public:v6-brackets-factor",
      "path:pre7-divisibility"
    ],
    "trainers": [
      {
        "title": "Общий множитель",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-properties-factor",
        "kind": "Модель",
        "instruction": "Найди, сколько одинаковых групп есть в обоих слагаемых.",
        "finish": "Вынеси множитель в 3 выражениях."
      },
      {
        "title": "Число перед скобками",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-brackets-factor",
        "kind": "Другой способ",
        "instruction": "Проверь обратным действием: раскрой получившиеся скобки.",
        "finish": "Сравни 3 исходные и раскрытые записи."
      }
    ],
    "questions": [
      {
        "prompt": "Вынеси 4 в 12x + 16: 4(…x + 4). Какое число пропущено?",
        "answer": "3",
        "input": "number",
        "hint": "Раздели коэффициент первого слагаемого на общий множитель.",
        "explanation": "12 : 4 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            4
          ]
        },
        "id": "expression-common-factor-01"
      },
      {
        "prompt": "Вынеси 5 в 20x − 25: 5(4x − …). Найди пропуск.",
        "answer": "5",
        "input": "number",
        "hint": "Оба слагаемых делятся на один и тот же множитель.",
        "explanation": "25 : 5 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            25,
            5
          ]
        },
        "id": "expression-common-factor-02"
      },
      {
        "prompt": "Вычисли 6 · 5 + 6 · 2, сначала вынеся 6.",
        "answer": "42",
        "input": "number",
        "hint": "Общий множитель позволяет сложить оставшиеся числа.",
        "explanation": "6(5 + 2) = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            [
              "add",
              5,
              2
            ]
          ]
        },
        "id": "expression-common-factor-03"
      },
      {
        "prompt": "В 12x + 2 после вынесения 2 чему равен свободный член внутри скобок?",
        "answer": "1",
        "input": "choice",
        "hint": "Раздели свободное слагаемое на вынесенный множитель.",
        "explanation": "12x + 2 = 2(6x + 1).",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            2,
            2
          ],
          "values": [
            "2",
            "1",
            "0"
          ]
        },
        "choices": [
          "2",
          "1",
          "0"
        ],
        "id": "expression-common-factor-04"
      },
      {
        "prompt": "В записи 3(7x + 4) коэффициент при x после раскрытия равен какому числу?",
        "answer": "21",
        "input": "number",
        "hint": "Это обратная проверка вынесенного множителя.",
        "explanation": "3 · 7 = 21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            7
          ]
        },
        "id": "expression-common-factor-05"
      },
      {
        "prompt": "Вынеси −4 из −32x + 20. Внутри скобок свободный член равен чему?",
        "answer": "-5",
        "input": "number",
        "hint": "Деление положительного числа на отрицательное даёт минус.",
        "explanation": "20 : (−4) = −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            20,
            -4
          ]
        },
        "id": "expression-common-factor-06"
      },
      {
        "prompt": "Вынеси 5 в 45x + 10: 5(…x + 2). Какое число пропущено?",
        "answer": "9",
        "input": "number",
        "hint": "Раздели коэффициент первого слагаемого на общий множитель.",
        "explanation": "45 : 5 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            45,
            5
          ]
        },
        "id": "expression-common-factor-07"
      },
      {
        "prompt": "Вынеси 6 в 60x − 18: 6(10x − …). Найди пропуск.",
        "answer": "3",
        "input": "number",
        "hint": "Оба слагаемых делятся на один и тот же множитель.",
        "explanation": "18 : 6 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            18,
            6
          ]
        },
        "id": "expression-common-factor-08"
      },
      {
        "prompt": "Вычисли 2 · 11 + 2 · 4, сначала вынеся 2.",
        "answer": "30",
        "input": "number",
        "hint": "Общий множитель позволяет сложить оставшиеся числа.",
        "explanation": "2(11 + 4) = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              11,
              4
            ]
          ]
        },
        "id": "expression-common-factor-09"
      },
      {
        "prompt": "В 36x + 3 после вынесения 3 чему равен свободный член внутри скобок?",
        "answer": "1",
        "input": "choice",
        "hint": "Раздели свободное слагаемое на вынесенный множитель.",
        "explanation": "36x + 3 = 3(12x + 1).",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            3,
            3
          ],
          "values": [
            "3",
            "1",
            "0"
          ]
        },
        "choices": [
          "3",
          "1",
          "0"
        ],
        "id": "expression-common-factor-10"
      },
      {
        "prompt": "В записи 4(13x + 2) коэффициент при x после раскрытия равен какому числу?",
        "answer": "52",
        "input": "number",
        "hint": "Это обратная проверка вынесенного множителя.",
        "explanation": "4 · 13 = 52.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            13
          ]
        },
        "id": "expression-common-factor-11"
      },
      {
        "prompt": "Вынеси −5 из −70x + 15. Внутри скобок свободный член равен чему?",
        "answer": "-3",
        "input": "number",
        "hint": "Деление положительного числа на отрицательное даёт минус.",
        "explanation": "15 : (−5) = −3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            15,
            -5
          ]
        },
        "id": "expression-common-factor-12"
      },
      {
        "prompt": "Вынеси 6 в 90x + 24: 6(…x + 4). Какое число пропущено?",
        "answer": "15",
        "input": "number",
        "hint": "Раздели коэффициент первого слагаемого на общий множитель.",
        "explanation": "90 : 6 = 15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            90,
            6
          ]
        },
        "id": "expression-common-factor-13"
      },
      {
        "prompt": "Вынеси 2 в 32x − 10: 2(16x − …). Найди пропуск.",
        "answer": "5",
        "input": "number",
        "hint": "Оба слагаемых делятся на один и тот же множитель.",
        "explanation": "10 : 2 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            10,
            2
          ]
        },
        "id": "expression-common-factor-14"
      },
      {
        "prompt": "Вычисли 3 · 17 + 3 · 2, сначала вынеся 3.",
        "answer": "57",
        "input": "number",
        "hint": "Общий множитель позволяет сложить оставшиеся числа.",
        "explanation": "3(17 + 2) = 57.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            [
              "add",
              17,
              2
            ]
          ]
        },
        "id": "expression-common-factor-15"
      },
      {
        "prompt": "В 72x + 4 после вынесения 4 чему равен свободный член внутри скобок?",
        "answer": "1",
        "input": "choice",
        "hint": "Раздели свободное слагаемое на вынесенный множитель.",
        "explanation": "72x + 4 = 4(18x + 1).",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            4,
            4
          ],
          "values": [
            "4",
            "1",
            "0"
          ]
        },
        "choices": [
          "4",
          "1",
          "0"
        ],
        "id": "expression-common-factor-16"
      },
      {
        "prompt": "В записи 5(19x + 4) коэффициент при x после раскрытия равен какому числу?",
        "answer": "95",
        "input": "number",
        "hint": "Это обратная проверка вынесенного множителя.",
        "explanation": "5 · 19 = 95.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            19
          ]
        },
        "id": "expression-common-factor-17"
      },
      {
        "prompt": "Вынеси −6 из −120x + 30. Внутри скобок свободный член равен чему?",
        "answer": "-5",
        "input": "number",
        "hint": "Деление положительного числа на отрицательное даёт минус.",
        "explanation": "30 : (−6) = −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30,
            -6
          ]
        },
        "id": "expression-common-factor-18"
      }
    ]
  },
  {
    "id": "expression-identities",
    "group": "expressions",
    "title": "Квадрат суммы и разность квадратов",
    "goal": "Различать квадрат суммы и сумму квадратов и узнавать произведение сопряжённых скобок.",
    "covers": [
      "public:identities"
    ],
    "prerequisites": [
      "public:v6-brackets-factor",
      "public:v5-power-read"
    ],
    "trainers": [
      {
        "title": "Формулы сокращённого умножения",
        "href": "/trainers/formuly-sokrashchennogo-umnozheniya-trainer.html",
        "kind": "Модель",
        "instruction": "Сравни площади частей квадрата и каждое слагаемое формулы.",
        "finish": "Разбери 3 разных формулы."
      },
      {
        "title": "Подобные слагаемые: практика",
        "href": "/trainers/like-terms-trainer.html",
        "kind": "Практика",
        "instruction": "После умножения скобок собери подобные слагаемые и проверь знак.",
        "finish": "Упрости 3 выражения после раскрытия."
      }
    ],
    "questions": [
      {
        "prompt": "В (x + 4)² коэффициент при x равен чему?",
        "answer": "8",
        "input": "number",
        "hint": "Среднее слагаемое — удвоенное произведение.",
        "explanation": "(x + 4)² = x² + 8x + 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            4
          ]
        },
        "id": "expression-identities-01"
      },
      {
        "prompt": "В (x − 5)² коэффициент при x равен чему?",
        "answer": "-10",
        "input": "number",
        "hint": "В квадрате разности средний член отрицательный.",
        "explanation": "(x − 5)² = x² − 10x + 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -2,
            5
          ]
        },
        "id": "expression-identities-02"
      },
      {
        "prompt": "Вычисли (6 − 1)(6 + 1) через разность квадратов.",
        "answer": "35",
        "input": "number",
        "hint": "Сопряжённые скобки дают квадрат первого числа минус квадрат второго.",
        "explanation": "6² − 1² = 35.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              6,
              2
            ],
            [
              "pow",
              1,
              2
            ]
          ]
        },
        "id": "expression-identities-03"
      },
      {
        "prompt": "Сколько нужно прибавить к 7² + 2², чтобы получить (7 + 2)²?",
        "answer": "28",
        "input": "choice",
        "hint": "В сумме квадратов недостаёт среднего члена.",
        "explanation": "Нужно прибавить 2 · 7 · 2 = 28.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            7,
            2
          ],
          "values": [
            "28",
            "14",
            "18"
          ]
        },
        "choices": [
          "28",
          "14",
          "18"
        ],
        "id": "expression-identities-04"
      },
      {
        "prompt": "Упрости (x − 8)(x + 8). В записи x² + c найди c.",
        "answer": "-64",
        "input": "number",
        "hint": "Второй квадрат вычитается.",
        "explanation": "(x − 8)(x + 8) = x² − 64; c = −64.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "pow",
              8,
              2
            ]
          ]
        },
        "id": "expression-identities-05"
      },
      {
        "prompt": "Вычисли (9 + 1)² − 9².",
        "answer": "19",
        "input": "number",
        "hint": "Раскрой квадрат суммы и сократи одинаковые квадраты.",
        "explanation": "9² + 18 + 1 − 9² = 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              10,
              2
            ],
            [
              "pow",
              9,
              2
            ]
          ]
        },
        "id": "expression-identities-06"
      },
      {
        "prompt": "В (x + 10)² коэффициент при x равен чему?",
        "answer": "20",
        "input": "number",
        "hint": "Среднее слагаемое — удвоенное произведение.",
        "explanation": "(x + 10)² = x² + 20x + 100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            10
          ]
        },
        "id": "expression-identities-07"
      },
      {
        "prompt": "В (x − 11)² коэффициент при x равен чему?",
        "answer": "-22",
        "input": "number",
        "hint": "В квадрате разности средний член отрицательный.",
        "explanation": "(x − 11)² = x² − 22x + 121.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -2,
            11
          ]
        },
        "id": "expression-identities-08"
      },
      {
        "prompt": "Вычисли (12 − 3)(12 + 3) через разность квадратов.",
        "answer": "135",
        "input": "number",
        "hint": "Сопряжённые скобки дают квадрат первого числа минус квадрат второго.",
        "explanation": "12² − 3² = 135.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              12,
              2
            ],
            [
              "pow",
              3,
              2
            ]
          ]
        },
        "id": "expression-identities-09"
      },
      {
        "prompt": "Сколько нужно прибавить к 13² + 4², чтобы получить (13 + 4)²?",
        "answer": "104",
        "input": "choice",
        "hint": "В сумме квадратов недостаёт среднего члена.",
        "explanation": "Нужно прибавить 2 · 13 · 4 = 104.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            13,
            4
          ],
          "values": [
            "104",
            "52",
            "34"
          ]
        },
        "choices": [
          "104",
          "52",
          "34"
        ],
        "id": "expression-identities-10"
      },
      {
        "prompt": "Упрости (x − 14)(x + 14). В записи x² + c найди c.",
        "answer": "-196",
        "input": "number",
        "hint": "Второй квадрат вычитается.",
        "explanation": "(x − 14)(x + 14) = x² − 196; c = −196.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "pow",
              14,
              2
            ]
          ]
        },
        "id": "expression-identities-11"
      },
      {
        "prompt": "Вычисли (15 + 1)² − 15².",
        "answer": "31",
        "input": "number",
        "hint": "Раскрой квадрат суммы и сократи одинаковые квадраты.",
        "explanation": "15² + 30 + 1 − 15² = 31.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              16,
              2
            ],
            [
              "pow",
              15,
              2
            ]
          ]
        },
        "id": "expression-identities-12"
      },
      {
        "prompt": "В (x + 16)² коэффициент при x равен чему?",
        "answer": "32",
        "input": "number",
        "hint": "Среднее слагаемое — удвоенное произведение.",
        "explanation": "(x + 16)² = x² + 32x + 256.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            16
          ]
        },
        "id": "expression-identities-13"
      },
      {
        "prompt": "В (x − 17)² коэффициент при x равен чему?",
        "answer": "-34",
        "input": "number",
        "hint": "В квадрате разности средний член отрицательный.",
        "explanation": "(x − 17)² = x² − 34x + 289.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            -2,
            17
          ]
        },
        "id": "expression-identities-14"
      },
      {
        "prompt": "Вычисли (18 − 1)(18 + 1) через разность квадратов.",
        "answer": "323",
        "input": "number",
        "hint": "Сопряжённые скобки дают квадрат первого числа минус квадрат второго.",
        "explanation": "18² − 1² = 323.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              18,
              2
            ],
            [
              "pow",
              1,
              2
            ]
          ]
        },
        "id": "expression-identities-15"
      },
      {
        "prompt": "Сколько нужно прибавить к 19² + 2², чтобы получить (19 + 2)²?",
        "answer": "76",
        "input": "choice",
        "hint": "В сумме квадратов недостаёт среднего члена.",
        "explanation": "Нужно прибавить 2 · 19 · 2 = 76.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            19,
            2
          ],
          "values": [
            "76",
            "38",
            "42"
          ]
        },
        "choices": [
          "76",
          "38",
          "42"
        ],
        "id": "expression-identities-16"
      },
      {
        "prompt": "Упрости (x − 20)(x + 20). В записи x² + c найди c.",
        "answer": "-400",
        "input": "number",
        "hint": "Второй квадрат вычитается.",
        "explanation": "(x − 20)(x + 20) = x² − 400; c = −400.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            [
              "pow",
              20,
              2
            ]
          ]
        },
        "id": "expression-identities-17"
      },
      {
        "prompt": "Вычисли (21 + 1)² − 21².",
        "answer": "43",
        "input": "number",
        "hint": "Раскрой квадрат суммы и сократи одинаковые квадраты.",
        "explanation": "21² + 42 + 1 − 21² = 43.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              22,
              2
            ],
            [
              "pow",
              21,
              2
            ]
          ]
        },
        "id": "expression-identities-18"
      }
    ]
  },
  {
    "id": "expression-powers-roots",
    "group": "expressions",
    "title": "Степень и квадратный корень",
    "goal": "Отличать знак числа от степени и понимать неотрицательный квадратный корень.",
    "covers": [
      "public:powers-roots"
    ],
    "prerequisites": [
      "public:v5-power-read",
      "public:signed-multiply"
    ],
    "trainers": [
      {
        "title": "Что означает степень",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-power-read",
        "kind": "Модель",
        "instruction": "Замени степень произведением одинаковых множителей.",
        "finish": "Разверни и вычисли 3 степени."
      },
      {
        "title": "Степени и квадратные корни",
        "href": "/trainers/oge-task8-powers-roots.html",
        "kind": "По шагам",
        "instruction": "Проверь, какое неотрицательное число в квадрате даёт подкоренное.",
        "finish": "Реши 4 задания на степени и корни."
      }
    ],
    "questions": [
      {
        "prompt": "Найди 2².",
        "answer": "4",
        "input": "number",
        "hint": "Квадрат — произведение числа на себя.",
        "explanation": "2 · 2 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            2,
            2
          ]
        },
        "id": "expression-powers-roots-01"
      },
      {
        "prompt": "Найди √16.",
        "answer": "4",
        "input": "number",
        "hint": "Ответ — неотрицательное число, квадрат которого дан.",
        "explanation": "4² = 16, поэтому корень равен 4.",
        "oracle": {
          "kind": "square-root",
          "radicand": 16
        },
        "id": "expression-powers-roots-02"
      },
      {
        "prompt": "Вычисли (−4)².",
        "answer": "16",
        "input": "number",
        "hint": "Основание степени целиком находится в скобках.",
        "explanation": "(−4) · (−4) = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            -4,
            2
          ]
        },
        "id": "expression-powers-roots-03"
      },
      {
        "prompt": "Чему равно −5² без скобок вокруг отрицательного числа?",
        "answer": "-25",
        "input": "choice",
        "hint": "Сначала степень, затем минус перед результатом.",
        "explanation": "−5² = −(5 · 5) = −25.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "pow",
              5,
              2
            ]
          ],
          "values": [
            "25",
            "-10",
            "-25"
          ]
        },
        "choices": [
          "25",
          "-10",
          "-25"
        ],
        "id": "expression-powers-roots-04"
      },
      {
        "prompt": "Сократи 3⁵ : 3³ и вычисли.",
        "answer": "9",
        "input": "number",
        "hint": "При делении степеней с одинаковым ненулевым основанием показатели вычитают.",
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
        },
        "id": "expression-powers-roots-05"
      },
      {
        "prompt": "Квадрат имеет площадь 49 см². Какова длина его стороны в сантиметрах?",
        "answer": "7",
        "input": "number",
        "hint": "Длина положительна; её квадрат равен площади.",
        "explanation": "√49 = 7 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": 49
        },
        "id": "expression-powers-roots-06"
      },
      {
        "prompt": "Найди 8².",
        "answer": "64",
        "input": "number",
        "hint": "Квадрат — произведение числа на себя.",
        "explanation": "8 · 8 = 64.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            8,
            2
          ]
        },
        "id": "expression-powers-roots-07"
      },
      {
        "prompt": "Найди √100.",
        "answer": "10",
        "input": "number",
        "hint": "Ответ — неотрицательное число, квадрат которого дан.",
        "explanation": "10² = 100, поэтому корень равен 10.",
        "oracle": {
          "kind": "square-root",
          "radicand": 100
        },
        "id": "expression-powers-roots-08"
      },
      {
        "prompt": "Вычисли (−10)².",
        "answer": "100",
        "input": "number",
        "hint": "Основание степени целиком находится в скобках.",
        "explanation": "(−10) · (−10) = 100.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            -10,
            2
          ]
        },
        "id": "expression-powers-roots-09"
      },
      {
        "prompt": "Чему равно −11² без скобок вокруг отрицательного числа?",
        "answer": "-121",
        "input": "choice",
        "hint": "Сначала степень, затем минус перед результатом.",
        "explanation": "−11² = −(11 · 11) = −121.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "pow",
              11,
              2
            ]
          ],
          "values": [
            "121",
            "-22",
            "-121"
          ]
        },
        "choices": [
          "121",
          "-22",
          "-121"
        ],
        "id": "expression-powers-roots-10"
      },
      {
        "prompt": "Сократи 4⁵ : 4³ и вычисли.",
        "answer": "16",
        "input": "number",
        "hint": "При делении степеней с одинаковым ненулевым основанием показатели вычитают.",
        "explanation": "4⁵ : 4³ = 4² = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "pow",
              4,
              5
            ],
            [
              "pow",
              4,
              3
            ]
          ]
        },
        "id": "expression-powers-roots-11"
      },
      {
        "prompt": "Квадрат имеет площадь 169 см². Какова длина его стороны в сантиметрах?",
        "answer": "13",
        "input": "number",
        "hint": "Длина положительна; её квадрат равен площади.",
        "explanation": "√169 = 13 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": 169
        },
        "id": "expression-powers-roots-12"
      },
      {
        "prompt": "Найди 14².",
        "answer": "196",
        "input": "number",
        "hint": "Квадрат — произведение числа на себя.",
        "explanation": "14 · 14 = 196.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            14,
            2
          ]
        },
        "id": "expression-powers-roots-13"
      },
      {
        "prompt": "Найди √256.",
        "answer": "16",
        "input": "number",
        "hint": "Ответ — неотрицательное число, квадрат которого дан.",
        "explanation": "16² = 256, поэтому корень равен 16.",
        "oracle": {
          "kind": "square-root",
          "radicand": 256
        },
        "id": "expression-powers-roots-14"
      },
      {
        "prompt": "Вычисли (−16)².",
        "answer": "256",
        "input": "number",
        "hint": "Основание степени целиком находится в скобках.",
        "explanation": "(−16) · (−16) = 256.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "pow",
            -16,
            2
          ]
        },
        "id": "expression-powers-roots-15"
      },
      {
        "prompt": "Чему равно −17² без скобок вокруг отрицательного числа?",
        "answer": "-289",
        "input": "choice",
        "hint": "Сначала степень, затем минус перед результатом.",
        "explanation": "−17² = −(17 · 17) = −289.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "neg",
            [
              "pow",
              17,
              2
            ]
          ],
          "values": [
            "289",
            "-34",
            "-289"
          ]
        },
        "choices": [
          "289",
          "-34",
          "-289"
        ],
        "id": "expression-powers-roots-16"
      },
      {
        "prompt": "Сократи 5⁵ : 5³ и вычисли.",
        "answer": "25",
        "input": "number",
        "hint": "При делении степеней с одинаковым ненулевым основанием показатели вычитают.",
        "explanation": "5⁵ : 5³ = 5² = 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "pow",
              5,
              5
            ],
            [
              "pow",
              5,
              3
            ]
          ]
        },
        "id": "expression-powers-roots-17"
      },
      {
        "prompt": "Квадрат имеет площадь 361 см². Какова длина его стороны в сантиметрах?",
        "answer": "19",
        "input": "number",
        "hint": "Длина положительна; её квадрат равен площади.",
        "explanation": "√361 = 19 см.",
        "oracle": {
          "kind": "square-root",
          "radicand": 361
        },
        "id": "expression-powers-roots-18"
      }
    ]
  },
  {
    "id": "equation-inverse",
    "group": "equations",
    "title": "Неизвестный компонент",
    "goal": "Выбирать обратное действие для неизвестного слагаемого, множителя, делимого или делителя.",
    "covers": [
      "path:pre7-inverse-components",
      "public:equation-simple"
    ],
    "prerequisites": [
      "path:pre7-add-carry",
      "oge-basics:multiplication-division/tabular-division"
    ],
    "trainers": [
      {
        "title": "Находим неизвестный компонент",
        "href": "/ege-baza/path/index.html#lesson=pre7-inverse-components",
        "kind": "По шагам",
        "instruction": "Назови неизвестный компонент, затем выбери обратное действие.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Самые простые уравнения по шагам",
        "href": "/trainers/simple-equations-stepwise.html",
        "kind": "Другой способ",
        "instruction": "Проверь ответ подстановкой исходного равенства.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши x + 4 = 9.",
        "answer": "5",
        "input": "number",
        "hint": "Неизвестное слагаемое найди вычитанием известного слагаемого из суммы.",
        "explanation": "x = 9 − 4 = 5. Проверка: 5 + 4 = 9.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 4,
          "c": 9
        },
        "id": "equation-inverse-01"
      },
      {
        "prompt": "Реши 5x = 30.",
        "answer": "6",
        "input": "number",
        "hint": "Чтобы найти неизвестный множитель, раздели произведение на известный множитель.",
        "explanation": "x = 30 : 5 = 6. Проверка: 5 · 6 = 30.",
        "oracle": {
          "kind": "linear",
          "a": 5,
          "b": 0,
          "c": 30
        },
        "id": "equation-inverse-02"
      },
      {
        "prompt": "Реши x − 6 = 1.",
        "answer": "7",
        "input": "number",
        "hint": "Неизвестное уменьшаемое равно сумме разности и вычитаемого.",
        "explanation": "x = 1 + 6 = 7. Проверка: 7 − 6 = 1.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -6,
          "c": 1
        },
        "id": "equation-inverse-03"
      },
      {
        "prompt": "Реши 15 − x = 7.",
        "answer": "8",
        "input": "number",
        "hint": "Чтобы найти вычитаемое, вычти известную разность из уменьшаемого.",
        "explanation": "x = 15 − 7 = 8. Проверка: 15 − 8 = 7.",
        "oracle": {
          "kind": "linear",
          "a": -1,
          "b": 15,
          "c": 7
        },
        "id": "equation-inverse-04"
      },
      {
        "prompt": "Реши x : 8 = 9.",
        "answer": "72",
        "input": "number",
        "hint": "Неизвестное делимое равно произведению частного и делителя.",
        "explanation": "x = 9 · 8 = 72. Проверка: 72 : 8 = 9.",
        "oracle": {
          "kind": "linear",
          "a": "1/8",
          "b": 0,
          "c": 9
        },
        "id": "equation-inverse-05"
      },
      {
        "prompt": "Реши 20 : x = 2.",
        "answer": "10",
        "input": "number",
        "hint": "Чтобы найти делитель, раздели делимое на известное частное. Делитель не может быть нулём.",
        "explanation": "x = 20 : 2 = 10. Проверка: 20 : 10 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            20,
            2
          ]
        },
        "id": "equation-inverse-06"
      },
      {
        "prompt": "Реши x + 3 = 14.",
        "answer": "11",
        "input": "number",
        "hint": "Неизвестное слагаемое найди вычитанием известного слагаемого из суммы.",
        "explanation": "x = 14 − 3 = 11. Проверка: 11 + 3 = 14.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 3,
          "c": 14
        },
        "id": "equation-inverse-07"
      },
      {
        "prompt": "Реши 4x = 48.",
        "answer": "12",
        "input": "number",
        "hint": "Чтобы найти неизвестный множитель, раздели произведение на известный множитель.",
        "explanation": "x = 48 : 4 = 12. Проверка: 4 · 12 = 48.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 0,
          "c": 48
        },
        "id": "equation-inverse-08"
      },
      {
        "prompt": "Реши x − 5 = 8.",
        "answer": "13",
        "input": "number",
        "hint": "Неизвестное уменьшаемое равно сумме разности и вычитаемого.",
        "explanation": "x = 8 + 5 = 13. Проверка: 13 − 5 = 8.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -5,
          "c": 8
        },
        "id": "equation-inverse-09"
      },
      {
        "prompt": "Реши 20 − x = 6.",
        "answer": "14",
        "input": "number",
        "hint": "Чтобы найти вычитаемое, вычти известную разность из уменьшаемого.",
        "explanation": "x = 20 − 6 = 14. Проверка: 20 − 14 = 6.",
        "oracle": {
          "kind": "linear",
          "a": -1,
          "b": 20,
          "c": 6
        },
        "id": "equation-inverse-10"
      },
      {
        "prompt": "Реши x : 7 = 15.",
        "answer": "105",
        "input": "number",
        "hint": "Неизвестное делимое равно произведению частного и делителя.",
        "explanation": "x = 15 · 7 = 105. Проверка: 105 : 7 = 15.",
        "oracle": {
          "kind": "linear",
          "a": "1/7",
          "b": 0,
          "c": 15
        },
        "id": "equation-inverse-11"
      },
      {
        "prompt": "Реши 128 : x = 8.",
        "answer": "16",
        "input": "number",
        "hint": "Чтобы найти делитель, раздели делимое на известное частное. Делитель не может быть нулём.",
        "explanation": "x = 128 : 8 = 16. Проверка: 128 : 16 = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            128,
            8
          ]
        },
        "id": "equation-inverse-12"
      },
      {
        "prompt": "Реши x + 2 = 19.",
        "answer": "17",
        "input": "number",
        "hint": "Неизвестное слагаемое найди вычитанием известного слагаемого из суммы.",
        "explanation": "x = 19 − 2 = 17. Проверка: 17 + 2 = 19.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 2,
          "c": 19
        },
        "id": "equation-inverse-13"
      },
      {
        "prompt": "Реши 3x = 54.",
        "answer": "18",
        "input": "number",
        "hint": "Чтобы найти неизвестный множитель, раздели произведение на известный множитель.",
        "explanation": "x = 54 : 3 = 18. Проверка: 3 · 18 = 54.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 0,
          "c": 54
        },
        "id": "equation-inverse-14"
      },
      {
        "prompt": "Реши x − 4 = 15.",
        "answer": "19",
        "input": "number",
        "hint": "Неизвестное уменьшаемое равно сумме разности и вычитаемого.",
        "explanation": "x = 15 + 4 = 19. Проверка: 19 − 4 = 15.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -4,
          "c": 15
        },
        "id": "equation-inverse-15"
      },
      {
        "prompt": "Реши 25 − x = 5.",
        "answer": "20",
        "input": "number",
        "hint": "Чтобы найти вычитаемое, вычти известную разность из уменьшаемого.",
        "explanation": "x = 25 − 5 = 20. Проверка: 25 − 20 = 5.",
        "oracle": {
          "kind": "linear",
          "a": -1,
          "b": 25,
          "c": 5
        },
        "id": "equation-inverse-16"
      },
      {
        "prompt": "Реши x : 6 = 21.",
        "answer": "126",
        "input": "number",
        "hint": "Неизвестное делимое равно произведению частного и делителя.",
        "explanation": "x = 21 · 6 = 126. Проверка: 126 : 6 = 21.",
        "oracle": {
          "kind": "linear",
          "a": "1/6",
          "b": 0,
          "c": 21
        },
        "id": "equation-inverse-17"
      },
      {
        "prompt": "Реши 154 : x = 7.",
        "answer": "22",
        "input": "number",
        "hint": "Чтобы найти делитель, раздели делимое на известное частное. Делитель не может быть нулём.",
        "explanation": "x = 154 : 7 = 22. Проверка: 154 : 22 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            154,
            7
          ]
        },
        "id": "equation-inverse-18"
      }
    ]
  },
  {
    "id": "equation-linear",
    "group": "equations",
    "title": "Линейное уравнение",
    "goal": "Сохранять равенство при обратных действиях и проверять найденный корень.",
    "covers": [
      "path:equations-linear",
      "public:equation-builder"
    ],
    "prerequisites": [
      "path:pre7-inverse-components"
    ],
    "trainers": [
      {
        "title": "Собираем решение уравнения",
        "href": "/trainers/equations-builder.html",
        "kind": "По шагам",
        "instruction": "Собери цепочку равносильных строк и объясни каждое действие.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Простые линейные уравнения",
        "href": "/ege-baza/path/index.html#lesson=equations-linear",
        "kind": "Другой способ",
        "instruction": "Решай уравнение и подставляй корень в обе части.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши 4x + 3 = 23.",
        "answer": "5",
        "input": "number",
        "hint": "Вычти свободное число, затем раздели на коэффициент.",
        "explanation": "4x = 20; x = 5.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 3,
          "c": 23
        },
        "id": "equation-linear-01"
      },
      {
        "prompt": "В 5x + 4 = 34 вычли 4 из обеих частей. Что получилось справа?",
        "answer": "30",
        "input": "number",
        "hint": "В обеих частях выполняют одно действие.",
        "explanation": "34 − 4 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            34,
            4
          ]
        },
        "id": "equation-linear-02"
      },
      {
        "prompt": "Реши 6x − 5 = 37.",
        "answer": "7",
        "input": "number",
        "hint": "Прибавь вычтенное число к обеим частям.",
        "explanation": "6x = 42; x = 7.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": -5,
          "c": 37
        },
        "id": "equation-linear-03"
      },
      {
        "prompt": "Выбери корень 7x + 1 = 57.",
        "answer": "8",
        "input": "choice",
        "hint": "Подстановка должна дать равенство.",
        "explanation": "7 · 8 + 1 = 57.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              57,
              1
            ],
            7
          ],
          "values": [
            "8",
            "9",
            "7"
          ]
        },
        "choices": [
          "8",
          "9",
          "7"
        ],
        "id": "equation-linear-04"
      },
      {
        "prompt": "После переноса: 8x = 72. Найди x.",
        "answer": "9",
        "input": "number",
        "hint": "Раздели обе части на коэффициент при x.",
        "explanation": "72 : 8 = 9.",
        "oracle": {
          "kind": "linear",
          "a": 8,
          "b": 0,
          "c": 72
        },
        "id": "equation-linear-05"
      },
      {
        "prompt": "За 2 ручки и пакет за 3 ₽ заплатили 23 ₽. Сколько стоит ручка?",
        "answer": "10",
        "input": "number",
        "hint": "Убери цену пакета, затем раздели стоимость ручек.",
        "explanation": "(23 − 3) : 2 = 10 ₽.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": 3,
          "c": 23
        },
        "id": "equation-linear-06"
      },
      {
        "prompt": "Реши 3x + 4 = 37.",
        "answer": "11",
        "input": "number",
        "hint": "Вычти свободное число, затем раздели на коэффициент.",
        "explanation": "3x = 33; x = 11.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 4,
          "c": 37
        },
        "id": "equation-linear-07"
      },
      {
        "prompt": "В 4x + 5 = 53 вычли 5 из обеих частей. Что получилось справа?",
        "answer": "48",
        "input": "number",
        "hint": "В обеих частях выполняют одно действие.",
        "explanation": "53 − 5 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            53,
            5
          ]
        },
        "id": "equation-linear-08"
      },
      {
        "prompt": "Реши 5x − 1 = 64.",
        "answer": "13",
        "input": "number",
        "hint": "Прибавь вычтенное число к обеим частям.",
        "explanation": "5x = 65; x = 13.",
        "oracle": {
          "kind": "linear",
          "a": 5,
          "b": -1,
          "c": 64
        },
        "id": "equation-linear-09"
      },
      {
        "prompt": "Выбери корень 6x + 2 = 86.",
        "answer": "14",
        "input": "choice",
        "hint": "Подстановка должна дать равенство.",
        "explanation": "6 · 14 + 2 = 86.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              86,
              2
            ],
            6
          ],
          "values": [
            "14",
            "15",
            "13"
          ]
        },
        "choices": [
          "14",
          "15",
          "13"
        ],
        "id": "equation-linear-10"
      },
      {
        "prompt": "После переноса: 7x = 105. Найди x.",
        "answer": "15",
        "input": "number",
        "hint": "Раздели обе части на коэффициент при x.",
        "explanation": "105 : 7 = 15.",
        "oracle": {
          "kind": "linear",
          "a": 7,
          "b": 0,
          "c": 105
        },
        "id": "equation-linear-11"
      },
      {
        "prompt": "За 8 ручек и пакет за 4 ₽ заплатили 132 ₽. Сколько стоит ручка?",
        "answer": "16",
        "input": "number",
        "hint": "Убери цену пакета, затем раздели стоимость ручек.",
        "explanation": "(132 − 4) : 8 = 16 ₽.",
        "oracle": {
          "kind": "linear",
          "a": 8,
          "b": 4,
          "c": 132
        },
        "id": "equation-linear-12"
      },
      {
        "prompt": "Реши 2x + 5 = 39.",
        "answer": "17",
        "input": "number",
        "hint": "Вычти свободное число, затем раздели на коэффициент.",
        "explanation": "2x = 34; x = 17.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": 5,
          "c": 39
        },
        "id": "equation-linear-13"
      },
      {
        "prompt": "В 3x + 1 = 55 вычли 1 из обеих частей. Что получилось справа?",
        "answer": "54",
        "input": "number",
        "hint": "В обеих частях выполняют одно действие.",
        "explanation": "55 − 1 = 54.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            55,
            1
          ]
        },
        "id": "equation-linear-14"
      },
      {
        "prompt": "Реши 4x − 2 = 74.",
        "answer": "19",
        "input": "number",
        "hint": "Прибавь вычтенное число к обеим частям.",
        "explanation": "4x = 76; x = 19.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": -2,
          "c": 74
        },
        "id": "equation-linear-15"
      },
      {
        "prompt": "Выбери корень 5x + 3 = 103.",
        "answer": "20",
        "input": "choice",
        "hint": "Подстановка должна дать равенство.",
        "explanation": "5 · 20 + 3 = 103.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              103,
              3
            ],
            5
          ],
          "values": [
            "20",
            "21",
            "19"
          ]
        },
        "choices": [
          "20",
          "21",
          "19"
        ],
        "id": "equation-linear-16"
      },
      {
        "prompt": "После переноса: 6x = 126. Найди x.",
        "answer": "21",
        "input": "number",
        "hint": "Раздели обе части на коэффициент при x.",
        "explanation": "126 : 6 = 21.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": 0,
          "c": 126
        },
        "id": "equation-linear-17"
      },
      {
        "prompt": "За 7 ручек и пакет за 5 ₽ заплатили 159 ₽. Сколько стоит ручка?",
        "answer": "22",
        "input": "number",
        "hint": "Убери цену пакета, затем раздели стоимость ручек.",
        "explanation": "(159 − 5) : 7 = 22 ₽.",
        "oracle": {
          "kind": "linear",
          "a": 7,
          "b": 5,
          "c": 159
        },
        "id": "equation-linear-18"
      }
    ]
  },
  {
    "id": "equation-signed",
    "group": "equations",
    "title": "Уравнение со знаками",
    "goal": "Сохранять отрицательные коэффициенты и находить отрицательные корни.",
    "covers": [
      "path:equations-signs"
    ],
    "prerequisites": [
      "oge-basics:negative-add-subtract",
      "path:equations-linear"
    ],
    "trainers": [
      {
        "title": "Уравнения со знаками",
        "href": "/ege-baza/path/index.html#lesson=equations-signs",
        "kind": "По шагам",
        "instruction": "Записывай действие вместе со знаком, особенно деление.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Собираем решение уравнения",
        "href": "/trainers/equations-builder.html",
        "kind": "Другой способ",
        "instruction": "Собери допустимую цепочку строк при отрицательном коэффициенте.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши −4x + 3 = 11.",
        "answer": "-2",
        "input": "number",
        "hint": "Делить придётся на отрицательное число.",
        "explanation": "−4x = 8; x = −2.",
        "oracle": {
          "kind": "linear",
          "a": -4,
          "b": 3,
          "c": 11
        },
        "id": "equation-signed-01"
      },
      {
        "prompt": "Реши 5x + 4 = -11.",
        "answer": "-3",
        "input": "number",
        "hint": "После переноса справа останется отрицательное число.",
        "explanation": "5x = -15; x = −3.",
        "oracle": {
          "kind": "linear",
          "a": 5,
          "b": 4,
          "c": -11
        },
        "id": "equation-signed-02"
      },
      {
        "prompt": "Найди корень −6x = -24.",
        "answer": "4",
        "input": "choice",
        "hint": "Минус делится на минус.",
        "explanation": "-24 : (−6) = 4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            -24,
            -6
          ],
          "values": [
            "4",
            "-4",
            "5"
          ]
        },
        "choices": [
          "4",
          "-4",
          "5"
        ],
        "id": "equation-signed-03"
      },
      {
        "prompt": "В −7x + 1 = -13 вычти 1. Что получится справа?",
        "answer": "-14",
        "input": "number",
        "hint": "Вычитание выполняют и у отрицательного числа.",
        "explanation": "-13 − 1 = −14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -13,
            1
          ]
        },
        "id": "equation-signed-04"
      },
      {
        "prompt": "Подставь x = −6 в −8x + 2.",
        "answer": "50",
        "input": "number",
        "hint": "Произведение двух отрицательных положительно.",
        "explanation": "−8 · (−6) + 2 = 50.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              -8,
              -6
            ],
            2
          ]
        },
        "id": "equation-signed-05"
      },
      {
        "prompt": "Реши 3 − 2x = -5.",
        "answer": "4",
        "input": "number",
        "hint": "Коэффициент при x отрицателен.",
        "explanation": "−2x = -8; x = 4.",
        "oracle": {
          "kind": "linear",
          "a": -2,
          "b": 3,
          "c": -5
        },
        "id": "equation-signed-06"
      },
      {
        "prompt": "Реши −3x + 4 = 28.",
        "answer": "-8",
        "input": "number",
        "hint": "Делить придётся на отрицательное число.",
        "explanation": "−3x = 24; x = −8.",
        "oracle": {
          "kind": "linear",
          "a": -3,
          "b": 4,
          "c": 28
        },
        "id": "equation-signed-07"
      },
      {
        "prompt": "Реши 4x + 5 = -31.",
        "answer": "-9",
        "input": "number",
        "hint": "После переноса справа останется отрицательное число.",
        "explanation": "4x = -36; x = −9.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 5,
          "c": -31
        },
        "id": "equation-signed-08"
      },
      {
        "prompt": "Найди корень −5x = -50.",
        "answer": "10",
        "input": "choice",
        "hint": "Минус делится на минус.",
        "explanation": "-50 : (−5) = 10.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            -50,
            -5
          ],
          "values": [
            "10",
            "-10",
            "11"
          ]
        },
        "choices": [
          "10",
          "-10",
          "11"
        ],
        "id": "equation-signed-09"
      },
      {
        "prompt": "В −6x + 2 = -46 вычти 2. Что получится справа?",
        "answer": "-48",
        "input": "number",
        "hint": "Вычитание выполняют и у отрицательного числа.",
        "explanation": "-46 − 2 = −48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -46,
            2
          ]
        },
        "id": "equation-signed-10"
      },
      {
        "prompt": "Подставь x = −12 в −7x + 3.",
        "answer": "87",
        "input": "number",
        "hint": "Произведение двух отрицательных положительно.",
        "explanation": "−7 · (−12) + 3 = 87.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              -7,
              -12
            ],
            3
          ]
        },
        "id": "equation-signed-11"
      },
      {
        "prompt": "Реши 4 − 8x = -76.",
        "answer": "10",
        "input": "number",
        "hint": "Коэффициент при x отрицателен.",
        "explanation": "−8x = -80; x = 10.",
        "oracle": {
          "kind": "linear",
          "a": -8,
          "b": 4,
          "c": -76
        },
        "id": "equation-signed-12"
      },
      {
        "prompt": "Реши −2x + 5 = 33.",
        "answer": "-14",
        "input": "number",
        "hint": "Делить придётся на отрицательное число.",
        "explanation": "−2x = 28; x = −14.",
        "oracle": {
          "kind": "linear",
          "a": -2,
          "b": 5,
          "c": 33
        },
        "id": "equation-signed-13"
      },
      {
        "prompt": "Реши 3x + 1 = -44.",
        "answer": "-15",
        "input": "number",
        "hint": "После переноса справа останется отрицательное число.",
        "explanation": "3x = -45; x = −15.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 1,
          "c": -44
        },
        "id": "equation-signed-14"
      },
      {
        "prompt": "Найди корень −4x = -64.",
        "answer": "16",
        "input": "choice",
        "hint": "Минус делится на минус.",
        "explanation": "-64 : (−4) = 16.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            -64,
            -4
          ],
          "values": [
            "16",
            "-16",
            "17"
          ]
        },
        "choices": [
          "16",
          "-16",
          "17"
        ],
        "id": "equation-signed-15"
      },
      {
        "prompt": "В −5x + 3 = -67 вычти 3. Что получится справа?",
        "answer": "-70",
        "input": "number",
        "hint": "Вычитание выполняют и у отрицательного числа.",
        "explanation": "-67 − 3 = −70.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -67,
            3
          ]
        },
        "id": "equation-signed-16"
      },
      {
        "prompt": "Подставь x = −18 в −6x + 4.",
        "answer": "112",
        "input": "number",
        "hint": "Произведение двух отрицательных положительно.",
        "explanation": "−6 · (−18) + 4 = 112.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              -6,
              -18
            ],
            4
          ]
        },
        "id": "equation-signed-17"
      },
      {
        "prompt": "Реши 5 − 7x = -107.",
        "answer": "16",
        "input": "number",
        "hint": "Коэффициент при x отрицателен.",
        "explanation": "−7x = -112; x = 16.",
        "oracle": {
          "kind": "linear",
          "a": -7,
          "b": 5,
          "c": -107
        },
        "id": "equation-signed-18"
      }
    ]
  },
  {
    "id": "equation-brackets",
    "group": "equations",
    "title": "Уравнение с одними скобками",
    "goal": "Раскрывать скобки, собирать слагаемые и решать линейное уравнение.",
    "covers": [
      "path:equations-brackets"
    ],
    "prerequisites": [
      "public:v6-brackets-factor",
      "path:equations-linear"
    ],
    "trainers": [
      {
        "title": "Число перед скобками",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-brackets-factor",
        "kind": "По шагам",
        "instruction": "Умножь на каждое слагаемое внутри скобок.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Уравнения со скобками",
        "href": "/ege-baza/path/index.html#lesson=equations-brackets",
        "kind": "Другой способ",
        "instruction": "Раскрой скобки, затем выполни обратные действия.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши 4(x + 3) = 32.",
        "answer": "5",
        "input": "number",
        "hint": "Можно сначала разделить на число перед скобками.",
        "explanation": "x + 3 = 8; x = 5.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 12,
          "c": 32
        },
        "id": "equation-brackets-01"
      },
      {
        "prompt": "В 5(x + 4) после раскрытия какой свободный член?",
        "answer": "20",
        "input": "number",
        "hint": "Множитель умножается на каждое слагаемое.",
        "explanation": "5 · 4 = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            4
          ]
        },
        "id": "equation-brackets-02"
      },
      {
        "prompt": "Реши 6(x − 5) = 12.",
        "answer": "7",
        "input": "number",
        "hint": "Раздели на множитель и прибавь вычтенное число.",
        "explanation": "x − 5 = 2; x = 7.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": -30,
          "c": 12
        },
        "id": "equation-brackets-03"
      },
      {
        "prompt": "Выбери корень 7(x + 1) = 63.",
        "answer": "8",
        "input": "choice",
        "hint": "После деления останется убрать слагаемое.",
        "explanation": "63 : 7 − 1 = 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            [
              "div",
              63,
              7
            ],
            1
          ],
          "values": [
            "7",
            "8",
            "9"
          ]
        },
        "choices": [
          "7",
          "8",
          "9"
        ],
        "id": "equation-brackets-04"
      },
      {
        "prompt": "Реши 8(x + 2) − 6 = 82.",
        "answer": "9",
        "input": "number",
        "hint": "Сначала верни вычтенное число.",
        "explanation": "8(x + 2) = 88; x = 9.",
        "oracle": {
          "kind": "linear",
          "a": 8,
          "b": 10,
          "c": 82
        },
        "id": "equation-brackets-05"
      },
      {
        "prompt": "В 2(x + 3) + x после раскрытия какой коэффициент при x?",
        "answer": "3",
        "input": "number",
        "hint": "Учти ещё одно x вне скобок.",
        "explanation": "2x + x = 3x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            1
          ]
        },
        "id": "equation-brackets-06"
      },
      {
        "prompt": "Реши 3(x + 4) = 45.",
        "answer": "11",
        "input": "number",
        "hint": "Можно сначала разделить на число перед скобками.",
        "explanation": "x + 4 = 15; x = 11.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 12,
          "c": 45
        },
        "id": "equation-brackets-07"
      },
      {
        "prompt": "После раскрытия скобок в 4(x + 6) чему равен свободный член?",
        "answer": "24",
        "input": "number",
        "hint": "Множитель умножается на каждое слагаемое.",
        "explanation": "4(x + 6) = 4x + 24. Свободный член — 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            6
          ]
        },
        "id": "equation-brackets-08"
      },
      {
        "prompt": "Реши 5(x − 1) = 60.",
        "answer": "13",
        "input": "number",
        "hint": "Раздели на множитель и прибавь вычтенное число.",
        "explanation": "x − 1 = 12; x = 13.",
        "oracle": {
          "kind": "linear",
          "a": 5,
          "b": -5,
          "c": 60
        },
        "id": "equation-brackets-09"
      },
      {
        "prompt": "Выбери корень 6(x + 2) = 96.",
        "answer": "14",
        "input": "choice",
        "hint": "После деления останется убрать слагаемое.",
        "explanation": "96 : 6 − 2 = 14.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            [
              "div",
              96,
              6
            ],
            2
          ],
          "values": [
            "12",
            "14",
            "16"
          ]
        },
        "choices": [
          "12",
          "14",
          "16"
        ],
        "id": "equation-brackets-10"
      },
      {
        "prompt": "Реши 7(x + 3) − 12 = 114.",
        "answer": "15",
        "input": "number",
        "hint": "Сначала верни вычтенное число.",
        "explanation": "7(x + 3) = 126; x = 15.",
        "oracle": {
          "kind": "linear",
          "a": 7,
          "b": 9,
          "c": 114
        },
        "id": "equation-brackets-11"
      },
      {
        "prompt": "В 8(x + 4) + x после раскрытия какой коэффициент при x?",
        "answer": "9",
        "input": "number",
        "hint": "Учти ещё одно x вне скобок.",
        "explanation": "8x + x = 9x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            8,
            1
          ]
        },
        "id": "equation-brackets-12"
      },
      {
        "prompt": "Реши 2(x + 5) = 44.",
        "answer": "17",
        "input": "number",
        "hint": "Можно сначала разделить на число перед скобками.",
        "explanation": "x + 5 = 22; x = 17.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": 10,
          "c": 44
        },
        "id": "equation-brackets-13"
      },
      {
        "prompt": "В 3(x + 1) после раскрытия какой свободный член?",
        "answer": "3",
        "input": "number",
        "hint": "Множитель умножается на каждое слагаемое.",
        "explanation": "3 · 1 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            1
          ]
        },
        "id": "equation-brackets-14"
      },
      {
        "prompt": "Реши 4(x − 2) = 68.",
        "answer": "19",
        "input": "number",
        "hint": "Раздели на множитель и прибавь вычтенное число.",
        "explanation": "x − 2 = 17; x = 19.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": -8,
          "c": 68
        },
        "id": "equation-brackets-15"
      },
      {
        "prompt": "Выбери корень 5(x + 3) = 115.",
        "answer": "20",
        "input": "choice",
        "hint": "После деления останется убрать слагаемое.",
        "explanation": "115 : 5 − 3 = 20.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            [
              "div",
              115,
              5
            ],
            3
          ],
          "values": [
            "17",
            "20",
            "23"
          ]
        },
        "choices": [
          "17",
          "20",
          "23"
        ],
        "id": "equation-brackets-16"
      },
      {
        "prompt": "Реши 6(x + 4) − 18 = 132.",
        "answer": "21",
        "input": "number",
        "hint": "Сначала верни вычтенное число.",
        "explanation": "6(x + 4) = 150; x = 21.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": 6,
          "c": 132
        },
        "id": "equation-brackets-17"
      },
      {
        "prompt": "В 7(x + 5) + x после раскрытия какой коэффициент при x?",
        "answer": "8",
        "input": "number",
        "hint": "Учти ещё одно x вне скобок.",
        "explanation": "7x + x = 8x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            7,
            1
          ]
        },
        "id": "equation-brackets-18"
      }
    ]
  },
  {
    "id": "equation-fraction-answer",
    "group": "equations",
    "title": "Дробный корень",
    "goal": "Принимать точную дробь как корень и проверять её умножением.",
    "covers": [
      "path:equations-fractions"
    ],
    "prerequisites": [
      "path:pre7-equivalent-fractions",
      "path:equations-linear"
    ],
    "trainers": [
      {
        "title": "Дробный ответ",
        "href": "/ege-baza/path/index.html#lesson=equations-fractions",
        "kind": "По шагам",
        "instruction": "Оставляй точную дробь, если результат деления не целый.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Самые простые уравнения по шагам",
        "href": "/trainers/simple-equations-stepwise.html",
        "kind": "Другой способ",
        "instruction": "Подставь дробь в исходное равенство и сократи множители.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши 4x = 9.",
        "answer": "9/4",
        "input": "number",
        "hint": "Запиши деление точной дробью.",
        "explanation": "x = 9/4.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 0,
          "c": 9
        },
        "id": "equation-fraction-answer-01"
      },
      {
        "prompt": "Реши 5x + 4 = 20.",
        "answer": "16/5",
        "input": "number",
        "hint": "Убери свободное число, затем раздели.",
        "explanation": "5x = 16; x = 16/5.",
        "oracle": {
          "kind": "linear",
          "a": 5,
          "b": 4,
          "c": 20
        },
        "id": "equation-fraction-answer-02"
      },
      {
        "prompt": "Реши −6x = 25.",
        "answer": "-25/6",
        "input": "number",
        "hint": "Корень будет отрицательной дробью.",
        "explanation": "x = −25/6.",
        "oracle": {
          "kind": "linear",
          "a": -6,
          "b": 0,
          "c": 25
        },
        "id": "equation-fraction-answer-03"
      },
      {
        "prompt": "Выбери точный корень 7x = 36.",
        "answer": "36/7",
        "input": "choice",
        "hint": "Округление здесь не требуется.",
        "explanation": "7 · (36/7) = 36.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            36,
            7
          ],
          "values": [
            "36/7",
            "5",
            "37/7"
          ]
        },
        "choices": [
          "36/7",
          "5",
          "37/7"
        ],
        "id": "equation-fraction-answer-04"
      },
      {
        "prompt": "Подставь x = 49/8 в 8x.",
        "answer": "49",
        "input": "number",
        "hint": "Сократи множитель со знаменателем.",
        "explanation": "8 · (49/8) = 49.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            8,
            "49/8"
          ]
        },
        "id": "equation-fraction-answer-05"
      },
      {
        "prompt": "Реши 2x − 3 = 12.",
        "answer": "15/2",
        "input": "number",
        "hint": "Прибавь вычтенное число.",
        "explanation": "2x = 15; x = 15/2.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": -3,
          "c": 12
        },
        "id": "equation-fraction-answer-06"
      },
      {
        "prompt": "Реши 3x = 25.",
        "answer": "25/3",
        "input": "number",
        "hint": "Запиши деление точной дробью.",
        "explanation": "x = 25/3.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 0,
          "c": 25
        },
        "id": "equation-fraction-answer-07"
      },
      {
        "prompt": "Реши 4x + 5 = 42.",
        "answer": "37/4",
        "input": "number",
        "hint": "Убери свободное число, затем раздели.",
        "explanation": "4x = 37; x = 37/4.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 5,
          "c": 42
        },
        "id": "equation-fraction-answer-08"
      },
      {
        "prompt": "Реши −5x = 51.",
        "answer": "-51/5",
        "input": "number",
        "hint": "Корень будет отрицательной дробью.",
        "explanation": "x = −51/5.",
        "oracle": {
          "kind": "linear",
          "a": -5,
          "b": 0,
          "c": 51
        },
        "id": "equation-fraction-answer-09"
      },
      {
        "prompt": "Выбери точный корень 6x = 67.",
        "answer": "67/6",
        "input": "choice",
        "hint": "Округление здесь не требуется.",
        "explanation": "6 · (67/6) = 67.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            67,
            6
          ],
          "values": [
            "67/6",
            "11",
            "34/3"
          ]
        },
        "choices": [
          "67/6",
          "11",
          "34/3"
        ],
        "id": "equation-fraction-answer-10"
      },
      {
        "prompt": "Подставь x = 85/7 в 7x.",
        "answer": "85",
        "input": "number",
        "hint": "Сократи множитель со знаменателем.",
        "explanation": "7 · (85/7) = 85.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7,
            "85/7"
          ]
        },
        "id": "equation-fraction-answer-11"
      },
      {
        "prompt": "Реши 8x − 4 = 101.",
        "answer": "105/8",
        "input": "number",
        "hint": "Прибавь вычтенное число.",
        "explanation": "8x = 105; x = 105/8.",
        "oracle": {
          "kind": "linear",
          "a": 8,
          "b": -4,
          "c": 101
        },
        "id": "equation-fraction-answer-12"
      },
      {
        "prompt": "Реши 2x = 29.",
        "answer": "29/2",
        "input": "number",
        "hint": "Запиши деление точной дробью.",
        "explanation": "x = 29/2.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": 0,
          "c": 29
        },
        "id": "equation-fraction-answer-13"
      },
      {
        "prompt": "Реши 3x + 1 = 47.",
        "answer": "46/3",
        "input": "number",
        "hint": "Убери свободное число, затем раздели.",
        "explanation": "3x = 46; x = 46/3.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": 1,
          "c": 47
        },
        "id": "equation-fraction-answer-14"
      },
      {
        "prompt": "Реши −4x = 65.",
        "answer": "-65/4",
        "input": "number",
        "hint": "Корень будет отрицательной дробью.",
        "explanation": "x = −65/4.",
        "oracle": {
          "kind": "linear",
          "a": -4,
          "b": 0,
          "c": 65
        },
        "id": "equation-fraction-answer-15"
      },
      {
        "prompt": "Выбери точный корень 5x = 86.",
        "answer": "86/5",
        "input": "choice",
        "hint": "Округление здесь не требуется.",
        "explanation": "5 · (86/5) = 86.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            86,
            5
          ],
          "values": [
            "86/5",
            "17",
            "87/5"
          ]
        },
        "choices": [
          "86/5",
          "17",
          "87/5"
        ],
        "id": "equation-fraction-answer-16"
      },
      {
        "prompt": "Подставь x = 109/6 в 6x.",
        "answer": "109",
        "input": "number",
        "hint": "Сократи множитель со знаменателем.",
        "explanation": "6 · (109/6) = 109.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            "109/6"
          ]
        },
        "id": "equation-fraction-answer-17"
      },
      {
        "prompt": "Реши 7x − 5 = 129.",
        "answer": "134/7",
        "input": "number",
        "hint": "Прибавь вычтенное число.",
        "explanation": "7x = 134; x = 134/7.",
        "oracle": {
          "kind": "linear",
          "a": 7,
          "b": -5,
          "c": 129
        },
        "id": "equation-fraction-answer-18"
      }
    ]
  },
  {
    "id": "equation-two-brackets",
    "group": "equations",
    "title": "Уравнение с двумя скобками",
    "goal": "Раскрывать обе скобки и сохранять знак перед второй группой.",
    "covers": [
      "path:grade7-a-equation-two-brackets"
    ],
    "prerequisites": [
      "path:grade7-a-opposite-expression",
      "path:equations-brackets"
    ],
    "trainers": [
      {
        "title": "Уравнение с двумя скобками",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-equation-two-brackets",
        "kind": "По шагам",
        "instruction": "Отдельно раскрой первую и вторую скобки; затем собери слагаемые.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Собираем решение уравнения",
        "href": "/trainers/equations-builder.html",
        "kind": "Другой способ",
        "instruction": "Собери равносильные строки, проверяя знак каждого слагаемого.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши 7(x + 3) − 3(x − 4) = 25.",
        "answer": "-2",
        "input": "number",
        "hint": "Вторая скобка умножается на отрицательное число.",
        "explanation": "4x + 33 = 25; x = −2.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 33,
          "c": 25
        },
        "id": "equation-two-brackets-01"
      },
      {
        "prompt": "Какой коэффициент при x в 6(x + 4) − 1(x − 5)?",
        "answer": "5",
        "input": "number",
        "hint": "Собери только слагаемые с x.",
        "explanation": "6x − 1x = 5x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            6,
            1
          ]
        },
        "id": "equation-two-brackets-02"
      },
      {
        "prompt": "Какой свободный член в 4(x + 5) − 2(x − 2)?",
        "answer": "24",
        "input": "number",
        "hint": "Последнее произведение двух отрицательных положительно.",
        "explanation": "20 + 4 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              4,
              5
            ],
            [
              "mul",
              2,
              2
            ]
          ]
        },
        "id": "equation-two-brackets-03"
      },
      {
        "prompt": "Выбери корень 6(x + 1) − 3(x − 3) = 18.",
        "answer": "1",
        "input": "choice",
        "hint": "Проверь раскрытие обеих скобок.",
        "explanation": "3x + 15 = 18; x = 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              18,
              15
            ],
            3
          ],
          "values": [
            "2",
            "0",
            "1"
          ]
        },
        "choices": [
          "2",
          "0",
          "1"
        ],
        "id": "equation-two-brackets-04"
      },
      {
        "prompt": "Реши 5(x − 2) + 1(x + 4) = 6.",
        "answer": "2",
        "input": "number",
        "hint": "При плюсе перед второй скобкой знаки сохраняются.",
        "explanation": "6x + (−6) = 6; x = 2.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": -6,
          "c": 6
        },
        "id": "equation-two-brackets-05"
      },
      {
        "prompt": "Подставь x = 3 в 7(x + 3) − 2(x − 5).",
        "answer": "46",
        "input": "number",
        "hint": "Вычисли каждую скобку, затем произведения.",
        "explanation": "7 · (6) − 2 · (-2) = 46.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              7,
              [
                "add",
                3,
                3
              ]
            ],
            [
              "mul",
              2,
              [
                "sub",
                3,
                5
              ]
            ]
          ]
        },
        "id": "equation-two-brackets-06"
      },
      {
        "prompt": "Реши 5(x + 4) − 3(x − 2) = 34.",
        "answer": "4",
        "input": "number",
        "hint": "Вторая скобка умножается на отрицательное число.",
        "explanation": "2x + 26 = 34; x = 4.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": 26,
          "c": 34
        },
        "id": "equation-two-brackets-07"
      },
      {
        "prompt": "Какой коэффициент при x в 4(x + 5) − 1(x − 3)?",
        "answer": "3",
        "input": "number",
        "hint": "Собери только слагаемые с x.",
        "explanation": "4x − 1x = 3x.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            4,
            1
          ]
        },
        "id": "equation-two-brackets-08"
      },
      {
        "prompt": "Какой свободный член в 6(x + 1) − 2(x − 4)?",
        "answer": "14",
        "input": "number",
        "hint": "Последнее произведение двух отрицательных положительно.",
        "explanation": "6 + 8 = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              6,
              1
            ],
            [
              "mul",
              2,
              4
            ]
          ]
        },
        "id": "equation-two-brackets-09"
      },
      {
        "prompt": "Выбери корень 8(x + 2) − 3(x − 5) = 66.",
        "answer": "7",
        "input": "choice",
        "hint": "Проверь раскрытие обеих скобок.",
        "explanation": "5x + 31 = 66; x = 7.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              66,
              31
            ],
            5
          ],
          "values": [
            "8",
            "6",
            "7"
          ]
        },
        "choices": [
          "8",
          "6",
          "7"
        ],
        "id": "equation-two-brackets-10"
      },
      {
        "prompt": "Реши 3(x − 3) + 1(x + 2) = 25.",
        "answer": "8",
        "input": "number",
        "hint": "При плюсе перед второй скобкой знаки сохраняются.",
        "explanation": "4x + (−7) = 25; x = 8.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": -7,
          "c": 25
        },
        "id": "equation-two-brackets-11"
      },
      {
        "prompt": "Подставь x = 9 в 5(x + 4) − 2(x − 3).",
        "answer": "53",
        "input": "number",
        "hint": "Вычисли каждую скобку, затем произведения.",
        "explanation": "5 · (13) − 2 · (6) = 53.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              5,
              [
                "add",
                9,
                4
              ]
            ],
            [
              "mul",
              2,
              [
                "sub",
                9,
                3
              ]
            ]
          ]
        },
        "id": "equation-two-brackets-12"
      },
      {
        "prompt": "Реши 7(x + 5) − 3(x − 4) = 87.",
        "answer": "10",
        "input": "number",
        "hint": "Вторая скобка умножается на отрицательное число.",
        "explanation": "4x + 47 = 87; x = 10.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 47,
          "c": 87
        },
        "id": "equation-two-brackets-13"
      },
      {
        "prompt": "Какой коэффициент при x в 6(x + 1) − 2(x − 5)? Введи только число.",
        "answer": "4",
        "input": "number",
        "hint": "Собери только слагаемые с x.",
        "explanation": "После раскрытия скобок слагаемые с x дают 6x − 2x = 4x. Коэффициент — 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            6,
            2
          ]
        },
        "id": "equation-two-brackets-14"
      },
      {
        "prompt": "Какой свободный член в 4(x + 2) − 2(x − 2)?",
        "answer": "12",
        "input": "number",
        "hint": "Последнее произведение двух отрицательных положительно.",
        "explanation": "8 + 4 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              4,
              2
            ],
            [
              "mul",
              2,
              2
            ]
          ]
        },
        "id": "equation-two-brackets-15"
      },
      {
        "prompt": "Выбери корень 6(x + 3) − 3(x − 3) = 66.",
        "answer": "13",
        "input": "choice",
        "hint": "Проверь раскрытие обеих скобок.",
        "explanation": "3x + 27 = 66; x = 13.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              66,
              27
            ],
            3
          ],
          "values": [
            "14",
            "12",
            "13"
          ]
        },
        "choices": [
          "14",
          "12",
          "13"
        ],
        "id": "equation-two-brackets-16"
      },
      {
        "prompt": "Реши 5(x − 4) + 1(x + 4) = 68.",
        "answer": "14",
        "input": "number",
        "hint": "При плюсе перед второй скобкой знаки сохраняются.",
        "explanation": "6x + (−16) = 68; x = 14.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": -16,
          "c": 68
        },
        "id": "equation-two-brackets-17"
      },
      {
        "prompt": "Подставь x = 15 в 7(x + 5) − 2(x − 5).",
        "answer": "120",
        "input": "number",
        "hint": "Вычисли каждую скобку, затем произведения.",
        "explanation": "7 · (20) − 2 · (10) = 120.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              7,
              [
                "add",
                15,
                5
              ]
            ],
            [
              "mul",
              2,
              [
                "sub",
                15,
                5
              ]
            ]
          ]
        },
        "id": "equation-two-brackets-18"
      }
    ]
  },
  {
    "id": "equation-denominators",
    "group": "equations",
    "title": "Уравнение со знаменателями",
    "goal": "Умножать все слагаемые обеих частей на общий знаменатель.",
    "covers": [
      "path:grade7-a-equation-denominators"
    ],
    "prerequisites": [
      "oge-basics:fraction-common-denominator",
      "path:equations-brackets"
    ],
    "trainers": [
      {
        "title": "Уравнение: убираем знаменатели",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-equation-denominators",
        "kind": "По шагам",
        "instruction": "Умножь каждое слагаемое на общий знаменатель.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Дроби: общий знаменатель и сложение",
        "href": "/trainers/oge-basics/fraction-common-denominator.html",
        "kind": "Другой способ",
        "instruction": "Проверь, во сколько раз изменяется размер каждой доли.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши x/4 + 3 = 6.",
        "answer": "12",
        "input": "number",
        "hint": "Умножь на знаменатель каждое слагаемое.",
        "explanation": "x + 12 = 24; x = 12.",
        "oracle": {
          "kind": "linear",
          "a": "1/4",
          "b": 3,
          "c": 6
        },
        "id": "equation-denominators-01"
      },
      {
        "prompt": "Умножь x/5 + 4 = 8 на 5. Каким станет свободный член слева?",
        "answer": "20",
        "input": "number",
        "hint": "Целое число тоже умножается.",
        "explanation": "4 · 5 = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            5
          ]
        },
        "id": "equation-denominators-02"
      },
      {
        "prompt": "Реши (x + 5)/6 = 6.",
        "answer": "31",
        "input": "number",
        "hint": "Умножение на знаменатель убирает деление у всего числителя.",
        "explanation": "x + 5 = 36; x = 31.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 5,
          "c": 36
        },
        "id": "equation-denominators-03"
      },
      {
        "prompt": "Найди x, если x/2 = 6.",
        "answer": "12",
        "input": "choice",
        "hint": "Неизвестное делимое находят умножением.",
        "explanation": "x = 2 · 6 = 12.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            6
          ],
          "values": [
            "3",
            "12",
            "6"
          ]
        },
        "choices": [
          "3",
          "12",
          "6"
        ],
        "id": "equation-denominators-04"
      },
      {
        "prompt": "Реши x/3 + x/6 = 21.",
        "answer": "42",
        "input": "number",
        "hint": "Найди общий знаменатель обеих дробей и умножь на него все слагаемые обеих частей.",
        "explanation": "2x + x = 126; x = 42.",
        "oracle": {
          "kind": "linear",
          "a": "3/6",
          "b": 0,
          "c": 21
        },
        "id": "equation-denominators-05"
      },
      {
        "prompt": "Реши x/4 − 3 = 8.",
        "answer": "44",
        "input": "number",
        "hint": "Прибавь вычтенное число, затем умножь.",
        "explanation": "x/4 = 11; x = 44.",
        "oracle": {
          "kind": "linear",
          "a": "1/4",
          "b": -3,
          "c": 8
        },
        "id": "equation-denominators-06"
      },
      {
        "prompt": "Реши x/5 + 4 = 13.",
        "answer": "45",
        "input": "number",
        "hint": "Умножь на знаменатель каждое слагаемое.",
        "explanation": "x + 20 = 65; x = 45.",
        "oracle": {
          "kind": "linear",
          "a": "1/5",
          "b": 4,
          "c": 13
        },
        "id": "equation-denominators-07"
      },
      {
        "prompt": "Умножь x/6 + 5 = 15 на 6. Каким станет свободный член слева?",
        "answer": "30",
        "input": "number",
        "hint": "Целое число тоже умножается.",
        "explanation": "5 · 6 = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            6
          ]
        },
        "id": "equation-denominators-08"
      },
      {
        "prompt": "Реши (x + 1)/2 = 12.",
        "answer": "23",
        "input": "number",
        "hint": "Умножение на знаменатель убирает деление у всего числителя.",
        "explanation": "x + 1 = 24; x = 23.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 1,
          "c": 24
        },
        "id": "equation-denominators-09"
      },
      {
        "prompt": "Найди x, если x/3 = 12.",
        "answer": "36",
        "input": "choice",
        "hint": "Неизвестное делимое находят умножением.",
        "explanation": "x = 3 · 12 = 36.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            3,
            12
          ],
          "values": [
            "4",
            "36",
            "12"
          ]
        },
        "choices": [
          "4",
          "36",
          "12"
        ],
        "id": "equation-denominators-10"
      },
      {
        "prompt": "Реши x/4 + x/8 = 39.",
        "answer": "104",
        "input": "number",
        "hint": "Найди общий знаменатель обеих дробей и умножь на него все слагаемые обеих частей.",
        "explanation": "2x + x = 312; x = 104.",
        "oracle": {
          "kind": "linear",
          "a": "3/8",
          "b": 0,
          "c": 39
        },
        "id": "equation-denominators-11"
      },
      {
        "prompt": "Реши x/5 − 4 = 14.",
        "answer": "90",
        "input": "number",
        "hint": "Прибавь вычтенное число, затем умножь.",
        "explanation": "x/5 = 18; x = 90.",
        "oracle": {
          "kind": "linear",
          "a": "1/5",
          "b": -4,
          "c": 14
        },
        "id": "equation-denominators-12"
      },
      {
        "prompt": "Реши x/6 + 5 = 20.",
        "answer": "90",
        "input": "number",
        "hint": "Умножь на знаменатель каждое слагаемое.",
        "explanation": "x + 30 = 120; x = 90.",
        "oracle": {
          "kind": "linear",
          "a": "1/6",
          "b": 5,
          "c": 20
        },
        "id": "equation-denominators-13"
      },
      {
        "prompt": "Умножь x/2 + 1 = 17 на 2. Каким станет свободный член слева?",
        "answer": "2",
        "input": "number",
        "hint": "Целое число тоже умножается.",
        "explanation": "1 · 2 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            1,
            2
          ]
        },
        "id": "equation-denominators-14"
      },
      {
        "prompt": "Реши (x + 2)/3 = 18.",
        "answer": "52",
        "input": "number",
        "hint": "Умножение на знаменатель убирает деление у всего числителя.",
        "explanation": "x + 2 = 54; x = 52.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 2,
          "c": 54
        },
        "id": "equation-denominators-15"
      },
      {
        "prompt": "Найди x, если x/4 = 18.",
        "answer": "72",
        "input": "choice",
        "hint": "Неизвестное делимое находят умножением.",
        "explanation": "x = 4 · 18 = 72.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            4,
            18
          ],
          "values": [
            "9/2",
            "72",
            "18"
          ]
        },
        "choices": [
          "9/2",
          "72",
          "18"
        ],
        "id": "equation-denominators-16"
      },
      {
        "prompt": "Реши x/5 + x/10 = 57.",
        "answer": "190",
        "input": "number",
        "hint": "Найди общий знаменатель обеих дробей и умножь на него все слагаемые обеих частей.",
        "explanation": "2x + x = 570; x = 190.",
        "oracle": {
          "kind": "linear",
          "a": "3/10",
          "b": 0,
          "c": 57
        },
        "id": "equation-denominators-17"
      },
      {
        "prompt": "Реши x/6 − 5 = 20.",
        "answer": "150",
        "input": "number",
        "hint": "Прибавь вычтенное число, затем умножь.",
        "explanation": "x/6 = 25; x = 150.",
        "oracle": {
          "kind": "linear",
          "a": "1/6",
          "b": -5,
          "c": 20
        },
        "id": "equation-denominators-18"
      }
    ]
  },
  {
    "id": "equation-decimals",
    "group": "equations",
    "title": "Уравнение с десятичными дробями",
    "goal": "Убирать запятые одинаковым множителем во всех слагаемых.",
    "covers": [
      "path:grade7-a-equation-decimals"
    ],
    "prerequisites": [
      "oge-basics:decimal-add-subtract",
      "path:equations-linear"
    ],
    "trainers": [
      {
        "title": "Уравнение с десятичными дробями",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-equation-decimals",
        "kind": "По шагам",
        "instruction": "Умножь все слагаемые на 10 или 100, затем реши уравнение.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Деление десятичных: делитель без запятой",
        "href": "/ege-baza/path/index.html#lesson=grade7-b-decimal-divisor-scale",
        "kind": "Другой способ",
        "instruction": "Сдвинь запятые вместе и объясни сохранение отношения.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши 0,4x + 0,3 = 1,5.",
        "answer": "3",
        "input": "number",
        "hint": "Умножь обе части на 10.",
        "explanation": "4x + 3 = 15; x = 3.",
        "oracle": {
          "kind": "linear",
          "a": "0.4",
          "b": "0.3",
          "c": "1.5"
        },
        "id": "equation-decimals-01"
      },
      {
        "prompt": "Умножь 0,5x + 0,4 = 2,4 на 10. Каким станет коэффициент при x?",
        "answer": "5",
        "input": "number",
        "hint": "Запятая сдвигается на один разряд вправо.",
        "explanation": "0,5 · 10 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "0.5",
            10
          ]
        },
        "id": "equation-decimals-02"
      },
      {
        "prompt": "Реши 0,6x = 3,0.",
        "answer": "5",
        "input": "number",
        "hint": "Можно сначала убрать запятые.",
        "explanation": "6x = 30; x = 5.",
        "oracle": {
          "kind": "linear",
          "a": "0.6",
          "b": 0,
          "c": "3.0"
        },
        "id": "equation-decimals-03"
      },
      {
        "prompt": "Выбери корень 0,7x + 0,6 = 4,8.",
        "answer": "6",
        "input": "choice",
        "hint": "Проверь выбранное число в исходной записи.",
        "explanation": "0,7 · 6 + 0,6 = 4,8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              "4.8",
              "0.6"
            ],
            "0.7"
          ],
          "values": [
            "6",
            "7",
            "5"
          ]
        },
        "choices": [
          "6",
          "7",
          "5"
        ],
        "id": "equation-decimals-04"
      },
      {
        "prompt": "Умножь 0,8x + 0,7 = 6,3 на 10. Каким станет число справа?",
        "answer": "63",
        "input": "number",
        "hint": "Обе части меняются в одинаковое число раз.",
        "explanation": "6,3 · 10 = 63.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "6.3",
            10
          ]
        },
        "id": "equation-decimals-05"
      },
      {
        "prompt": "Реши 0,2x − 0,8 = 0,8.",
        "answer": "8",
        "input": "number",
        "hint": "Верни вычтенное число, затем раздели на коэффициент.",
        "explanation": "2x − 8 = 8; x = 8.",
        "oracle": {
          "kind": "linear",
          "a": "0.2",
          "b": "-0.8",
          "c": "0.8"
        },
        "id": "equation-decimals-06"
      },
      {
        "prompt": "Реши 0,3x + 0,9 = 1,2.",
        "answer": "1",
        "input": "number",
        "hint": "Умножь обе части на 10.",
        "explanation": "3x + 9 = 12; x = 1.",
        "oracle": {
          "kind": "linear",
          "a": "0.3",
          "b": "0.9",
          "c": "1.2"
        },
        "id": "equation-decimals-07"
      },
      {
        "prompt": "Умножь 0,4x + 1,0 = 1,8 на 10. Каким станет коэффициент при x?",
        "answer": "4",
        "input": "number",
        "hint": "Запятая сдвигается на один разряд вправо.",
        "explanation": "0,4 · 10 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "0.4",
            10
          ]
        },
        "id": "equation-decimals-08"
      },
      {
        "prompt": "Реши 0,5x = 1,5.",
        "answer": "3",
        "input": "number",
        "hint": "Можно сначала убрать запятые.",
        "explanation": "5x = 15; x = 3.",
        "oracle": {
          "kind": "linear",
          "a": "0.5",
          "b": 0,
          "c": "1.5"
        },
        "id": "equation-decimals-09"
      },
      {
        "prompt": "Выбери корень 0,6x + 1,2 = 3,6.",
        "answer": "4",
        "input": "choice",
        "hint": "Проверь выбранное число в исходной записи.",
        "explanation": "0,6 · 4 + 1,2 = 3,6.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              "3.6",
              "1.2"
            ],
            "0.6"
          ],
          "values": [
            "4",
            "5",
            "3"
          ]
        },
        "choices": [
          "4",
          "5",
          "3"
        ],
        "id": "equation-decimals-10"
      },
      {
        "prompt": "Умножь 0,7x + 1,3 = 4,8 на 10. Каким станет число справа?",
        "answer": "48",
        "input": "number",
        "hint": "Обе части меняются в одинаковое число раз.",
        "explanation": "4,8 · 10 = 48.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "4.8",
            10
          ]
        },
        "id": "equation-decimals-11"
      },
      {
        "prompt": "Реши 0,8x − 1,4 = 3,4.",
        "answer": "6",
        "input": "number",
        "hint": "Верни вычтенное число, затем раздели на коэффициент.",
        "explanation": "8x − 14 = 34; x = 6.",
        "oracle": {
          "kind": "linear",
          "a": "0.8",
          "b": "-1.4",
          "c": "3.4"
        },
        "id": "equation-decimals-12"
      },
      {
        "prompt": "Реши 0,2x + 1,5 = 2,9.",
        "answer": "7",
        "input": "number",
        "hint": "Умножь обе части на 10.",
        "explanation": "2x + 15 = 29; x = 7.",
        "oracle": {
          "kind": "linear",
          "a": "0.2",
          "b": "1.5",
          "c": "2.9"
        },
        "id": "equation-decimals-13"
      },
      {
        "prompt": "Умножь 0,3x + 1,6 = 4,0 на 10. Каким станет коэффициент при x?",
        "answer": "3",
        "input": "number",
        "hint": "Запятая сдвигается на один разряд вправо.",
        "explanation": "0,3 · 10 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "0.3",
            10
          ]
        },
        "id": "equation-decimals-14"
      },
      {
        "prompt": "Реши 0,4x = 0,4.",
        "answer": "1",
        "input": "number",
        "hint": "Можно сначала убрать запятые.",
        "explanation": "4x = 4; x = 1.",
        "oracle": {
          "kind": "linear",
          "a": "0.4",
          "b": 0,
          "c": "0.4"
        },
        "id": "equation-decimals-15"
      },
      {
        "prompt": "Выбери корень 0,5x + 1,8 = 2,8.",
        "answer": "2",
        "input": "choice",
        "hint": "Проверь выбранное число в исходной записи.",
        "explanation": "0,5 · 2 + 1,8 = 2,8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              "2.8",
              "1.8"
            ],
            "0.5"
          ],
          "values": [
            "2",
            "3",
            "1"
          ]
        },
        "choices": [
          "2",
          "3",
          "1"
        ],
        "id": "equation-decimals-16"
      },
      {
        "prompt": "Умножь 0,6x + 1,9 = 3,7 на 10. Каким станет число справа?",
        "answer": "37",
        "input": "number",
        "hint": "Обе части меняются в одинаковое число раз.",
        "explanation": "3,7 · 10 = 37.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "3.7",
            10
          ]
        },
        "id": "equation-decimals-17"
      },
      {
        "prompt": "Реши 0,7x − 2,0 = 0,8.",
        "answer": "4",
        "input": "number",
        "hint": "Верни вычтенное число, затем раздели на коэффициент.",
        "explanation": "7x − 20 = 8; x = 4.",
        "oracle": {
          "kind": "linear",
          "a": "0.7",
          "b": "-2.0",
          "c": "0.8"
        },
        "id": "equation-decimals-18"
      }
    ]
  },
  {
    "id": "inequality-number-line",
    "group": "equations",
    "title": "Неравенство и числовая прямая",
    "goal": "Различать строгие и нестрогие границы и проверять принадлежность промежутку.",
    "covers": [
      "public:inequality-read",
      "public:inequality-model"
    ],
    "prerequisites": [
      "oge-basics:negative-number-line"
    ],
    "trainers": [
      {
        "title": "Читаем условия на числовой прямой",
        "href": "/trainers/inequalities-number-line-reader.html",
        "kind": "По шагам",
        "instruction": "Прочитай луч и проверь, включена ли граничная точка.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "От условия к промежутку",
        "href": "/trainers/inequalities-number-line.html",
        "kind": "Другой способ",
        "instruction": "Построй промежуток по условию и проверь крайние числа.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Наименьшее целое x при x > −8?",
        "answer": "-7",
        "input": "number",
        "hint": "Строгая граница не включается.",
        "explanation": "Первое целое справа — −7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -8,
            1
          ]
        },
        "id": "inequality-number-line-01"
      },
      {
        "prompt": "Наибольшее целое x при x < −7?",
        "answer": "-8",
        "input": "number",
        "hint": "Выбери ближайшее целое слева.",
        "explanation": "Это −8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -7,
            1
          ]
        },
        "id": "inequality-number-line-02"
      },
      {
        "prompt": "Сколько целых чисел удовлетворяют −6 ≤ x ≤ −2?",
        "answer": "5",
        "input": "number",
        "hint": "Включи обе границы.",
        "explanation": "−6, −5, −4, −3, −2: пять.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              -2,
              -6
            ],
            1
          ]
        },
        "id": "inequality-number-line-03"
      },
      {
        "prompt": "Выбери число из −5 < x < −3.",
        "answer": "-4",
        "input": "choice",
        "hint": "Граничные числа не подходят.",
        "explanation": "Подходит −4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            -5,
            1
          ],
          "values": [
            "-5",
            "-3",
            "-4"
          ]
        },
        "choices": [
          "-5",
          "-3",
          "-4"
        ],
        "id": "inequality-number-line-04"
      },
      {
        "prompt": "Наименьшее целое x при x ≥ −4?",
        "answer": "-4",
        "input": "number",
        "hint": "Нестрогая граница включается.",
        "explanation": "Число −4 разрешено.",
        "oracle": {
          "kind": "expression",
          "expr": -4
        },
        "id": "inequality-number-line-05"
      },
      {
        "prompt": "Сколько целых чисел строго между −3 и 2?",
        "answer": "4",
        "input": "number",
        "hint": "Исключи обе границы.",
        "explanation": "Останутся −2, −1, 0, 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              2,
              -3
            ],
            1
          ]
        },
        "id": "inequality-number-line-06"
      },
      {
        "prompt": "Наименьшее целое x при x > −2?",
        "answer": "-1",
        "input": "number",
        "hint": "Строгая граница не включается.",
        "explanation": "Первое целое справа — −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -2,
            1
          ]
        },
        "id": "inequality-number-line-07"
      },
      {
        "prompt": "Наибольшее целое x при x < −1?",
        "answer": "-2",
        "input": "number",
        "hint": "Выбери ближайшее целое слева.",
        "explanation": "Это −2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            -1,
            1
          ]
        },
        "id": "inequality-number-line-08"
      },
      {
        "prompt": "Сколько целых чисел удовлетворяют 0 ≤ x ≤ 4?",
        "answer": "5",
        "input": "number",
        "hint": "Включи обе границы.",
        "explanation": "0, 1, 2, 3, 4: пять.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              4,
              0
            ],
            1
          ]
        },
        "id": "inequality-number-line-09"
      },
      {
        "prompt": "Выбери число из 1 < x < 3.",
        "answer": "2",
        "input": "choice",
        "hint": "Граничные числа не подходят.",
        "explanation": "Подходит 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            1,
            1
          ],
          "values": [
            "1",
            "3",
            "2"
          ]
        },
        "choices": [
          "1",
          "3",
          "2"
        ],
        "id": "inequality-number-line-10"
      },
      {
        "prompt": "Наименьшее целое x при x ≥ 2?",
        "answer": "2",
        "input": "number",
        "hint": "Нестрогая граница включается.",
        "explanation": "Число 2 разрешено.",
        "oracle": {
          "kind": "expression",
          "expr": 2
        },
        "id": "inequality-number-line-11"
      },
      {
        "prompt": "Сколько целых чисел строго между 3 и 8?",
        "answer": "4",
        "input": "number",
        "hint": "Исключи обе границы.",
        "explanation": "Останутся 4, 5, 6, 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              8,
              3
            ],
            1
          ]
        },
        "id": "inequality-number-line-12"
      },
      {
        "prompt": "Наименьшее целое x при x > 4?",
        "answer": "5",
        "input": "number",
        "hint": "Строгая граница не включается.",
        "explanation": "Первое целое справа — 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            1
          ]
        },
        "id": "inequality-number-line-13"
      },
      {
        "prompt": "Наибольшее целое x при x < 5?",
        "answer": "4",
        "input": "number",
        "hint": "Выбери ближайшее целое слева.",
        "explanation": "Это 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            1
          ]
        },
        "id": "inequality-number-line-14"
      },
      {
        "prompt": "Сколько целых чисел удовлетворяют 6 ≤ x ≤ 10?",
        "answer": "5",
        "input": "number",
        "hint": "Включи обе границы.",
        "explanation": "6, 7, 8, 9, 10: пять.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "sub",
              10,
              6
            ],
            1
          ]
        },
        "id": "inequality-number-line-15"
      },
      {
        "prompt": "Выбери число из 7 < x < 9.",
        "answer": "8",
        "input": "choice",
        "hint": "Граничные числа не подходят.",
        "explanation": "Подходит 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            7,
            1
          ],
          "values": [
            "7",
            "9",
            "8"
          ]
        },
        "choices": [
          "7",
          "9",
          "8"
        ],
        "id": "inequality-number-line-16"
      },
      {
        "prompt": "Наименьшее целое x при x ≥ 8?",
        "answer": "8",
        "input": "number",
        "hint": "Нестрогая граница включается.",
        "explanation": "Число 8 разрешено.",
        "oracle": {
          "kind": "expression",
          "expr": 8
        },
        "id": "inequality-number-line-17"
      },
      {
        "prompt": "Сколько целых чисел строго между 9 и 14?",
        "answer": "4",
        "input": "number",
        "hint": "Исключи обе границы.",
        "explanation": "Останутся 10, 11, 12, 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              14,
              9
            ],
            1
          ]
        },
        "id": "inequality-number-line-18"
      }
    ]
  },
  {
    "id": "inequality-linear",
    "group": "equations",
    "title": "Линейное неравенство",
    "goal": "Следить за сменой знака при делении на отрицательное число.",
    "covers": [
      "public:inequality-linear"
    ],
    "prerequisites": [
      "path:equations-signs",
      "public:inequality-read"
    ],
    "trainers": [
      {
        "title": "Линейные неравенства по шагам",
        "href": "/trainers/linear-inequalities-stepwise.html",
        "kind": "По шагам",
        "instruction": "Выполняй обратные действия и отдельно проверяй знак при делении.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "От условия к промежутку",
        "href": "/trainers/inequalities-number-line.html",
        "kind": "Другой способ",
        "instruction": "Покажи полученный луч; выбери подходящее и неподходящее число.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Найди наименьшее целое решение 4x + 3 > -21.",
        "answer": "-5",
        "input": "number",
        "hint": "При делении на положительное знак не меняется.",
        "explanation": "x > −6; ответ −5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "sub",
                -21,
                3
              ],
              4
            ],
            1
          ]
        },
        "id": "inequality-linear-01"
      },
      {
        "prompt": "Найди наименьшее целое решение −5x < 25.",
        "answer": "-4",
        "input": "number",
        "hint": "При делении на отрицательное знак меняется.",
        "explanation": "x > −5; ответ −4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -5,
            1
          ]
        },
        "id": "inequality-linear-02"
      },
      {
        "prompt": "Найди наибольшее целое решение 6x − 5 ≤ -29.",
        "answer": "-4",
        "input": "number",
        "hint": "Нестрогая граница включается.",
        "explanation": "x ≤ −4; ответ −4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              -29,
              5
            ],
            6
          ]
        },
        "id": "inequality-linear-03"
      },
      {
        "prompt": "Какое число подходит к −7x > 21?",
        "answer": "-4",
        "input": "choice",
        "hint": "Раздели на отрицательный коэффициент.",
        "explanation": "x < −3; подходит −4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            -3,
            1
          ],
          "values": [
            "-2",
            "-4",
            "-3"
          ]
        },
        "choices": [
          "-2",
          "-4",
          "-3"
        ],
        "id": "inequality-linear-04"
      },
      {
        "prompt": "Найди наименьшее целое решение −8x ≤ 16.",
        "answer": "-2",
        "input": "number",
        "hint": "После деления получится «больше или равно».",
        "explanation": "x ≥ −2; ответ −2.",
        "oracle": {
          "kind": "expression",
          "expr": -2
        },
        "id": "inequality-linear-05"
      },
      {
        "prompt": "Найди наибольшее целое решение −2x + 3 ≥ 5.",
        "answer": "-1",
        "input": "number",
        "hint": "Перенеси свободное число; при делении смени знак.",
        "explanation": "x ≤ −1; ответ −1.",
        "oracle": {
          "kind": "expression",
          "expr": -1
        },
        "id": "inequality-linear-06"
      },
      {
        "prompt": "Найди наименьшее целое решение 3x + 4 > 4.",
        "answer": "1",
        "input": "number",
        "hint": "При делении на положительное знак не меняется.",
        "explanation": "x > 0; ответ 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "sub",
                4,
                4
              ],
              3
            ],
            1
          ]
        },
        "id": "inequality-linear-07"
      },
      {
        "prompt": "Найди наименьшее целое решение −4x < -4.",
        "answer": "2",
        "input": "number",
        "hint": "При делении на отрицательное знак меняется.",
        "explanation": "x > 1; ответ 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            1
          ]
        },
        "id": "inequality-linear-08"
      },
      {
        "prompt": "Найди наибольшее целое решение 5x − 1 ≤ 9.",
        "answer": "2",
        "input": "number",
        "hint": "Нестрогая граница включается.",
        "explanation": "x ≤ 2; ответ 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              9,
              1
            ],
            5
          ]
        },
        "id": "inequality-linear-09"
      },
      {
        "prompt": "Какое число подходит к −6x > -18?",
        "answer": "2",
        "input": "choice",
        "hint": "Раздели на отрицательный коэффициент.",
        "explanation": "x < 3; подходит 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            3,
            1
          ],
          "values": [
            "4",
            "2",
            "3"
          ]
        },
        "choices": [
          "4",
          "2",
          "3"
        ],
        "id": "inequality-linear-10"
      },
      {
        "prompt": "Найди наименьшее целое решение −7x ≤ -28.",
        "answer": "4",
        "input": "number",
        "hint": "После деления получится «больше или равно».",
        "explanation": "x ≥ 4; ответ 4.",
        "oracle": {
          "kind": "expression",
          "expr": 4
        },
        "id": "inequality-linear-11"
      },
      {
        "prompt": "Найди наибольшее целое решение −8x + 4 ≥ -36.",
        "answer": "5",
        "input": "number",
        "hint": "Перенеси свободное число; при делении смени знак.",
        "explanation": "x ≤ 5; ответ 5.",
        "oracle": {
          "kind": "expression",
          "expr": 5
        },
        "id": "inequality-linear-12"
      },
      {
        "prompt": "Найди наименьшее целое решение 2x + 5 > 17.",
        "answer": "7",
        "input": "number",
        "hint": "При делении на положительное знак не меняется.",
        "explanation": "x > 6; ответ 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              [
                "sub",
                17,
                5
              ],
              2
            ],
            1
          ]
        },
        "id": "inequality-linear-13"
      },
      {
        "prompt": "Найди наименьшее целое решение −3x < -21.",
        "answer": "8",
        "input": "number",
        "hint": "При делении на отрицательное знак меняется.",
        "explanation": "x > 7; ответ 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            7,
            1
          ]
        },
        "id": "inequality-linear-14"
      },
      {
        "prompt": "Найди наибольшее целое решение 4x − 2 ≤ 30.",
        "answer": "8",
        "input": "number",
        "hint": "Нестрогая граница включается.",
        "explanation": "x ≤ 8; ответ 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              30,
              2
            ],
            4
          ]
        },
        "id": "inequality-linear-15"
      },
      {
        "prompt": "Какое число подходит к −5x > -45?",
        "answer": "8",
        "input": "choice",
        "hint": "Раздели на отрицательный коэффициент.",
        "explanation": "x < 9; подходит 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            9,
            1
          ],
          "values": [
            "10",
            "8",
            "9"
          ]
        },
        "choices": [
          "10",
          "8",
          "9"
        ],
        "id": "inequality-linear-16"
      },
      {
        "prompt": "Найди наименьшее целое решение −6x ≤ -60.",
        "answer": "10",
        "input": "number",
        "hint": "После деления получится «больше или равно».",
        "explanation": "x ≥ 10; ответ 10.",
        "oracle": {
          "kind": "expression",
          "expr": 10
        },
        "id": "inequality-linear-17"
      },
      {
        "prompt": "Найди наибольшее целое решение −7x + 5 ≥ -72.",
        "answer": "11",
        "input": "number",
        "hint": "Перенеси свободное число; при делении смени знак.",
        "explanation": "x ≤ 11; ответ 11.",
        "oracle": {
          "kind": "expression",
          "expr": 11
        },
        "id": "inequality-linear-18"
      }
    ]
  },
  {
    "id": "equation-exam-transfer",
    "group": "equations",
    "title": "От основ к уравнениям ОГЭ",
    "goal": "Выбирать способ для линейного и простого квадратного уравнения; проверять заданный корень.",
    "covers": [
      "public:equation-exam"
    ],
    "prerequisites": [
      "path:equations-fractions",
      "public:identities"
    ],
    "trainers": [
      {
        "title": "Уравнения: применение в ОГЭ",
        "href": "/trainers/oge-task9-equations.html",
        "kind": "По шагам",
        "instruction": "Выбери знакомое семейство и сравни с соседним типом уравнений.",
        "finish": "Разбери 3 задания."
      },
      {
        "title": "Собираем решение уравнения",
        "href": "/trainers/equations-builder.html",
        "kind": "Другой способ",
        "instruction": "Восстанови цепочку линейного решения перед возвращением к ОГЭ.",
        "finish": "Реши и проверь 3 примера."
      }
    ],
    "questions": [
      {
        "prompt": "Реши 4x − 2 = 18.",
        "answer": "5",
        "input": "number",
        "hint": "Линейное уравнение решается обратными действиями.",
        "explanation": "4x = 20; x = 5.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": -2,
          "c": 18
        },
        "id": "equation-exam-transfer-01"
      },
      {
        "prompt": "Найди положительный корень x² = 9.",
        "answer": "3",
        "input": "number",
        "hint": "Выбери положительный из двух противоположных корней.",
        "explanation": "Корни ±3; положительный — 3.",
        "oracle": {
          "kind": "square-root",
          "radicand": 9
        },
        "id": "equation-exam-transfer-02"
      },
      {
        "prompt": "Найди ненулевой корень x(x − 4) = 0.",
        "answer": "4",
        "input": "number",
        "hint": "Обнули каждый множитель отдельно.",
        "explanation": "Корни 0 и 4; ненулевой — 4.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -4,
          "c": 0
        },
        "id": "equation-exam-transfer-03"
      },
      {
        "prompt": "Найди больший корень (x − 5)(x + 6) = 0.",
        "answer": "5",
        "input": "choice",
        "hint": "Сравни корни двух линейных множителей.",
        "explanation": "Корни 5 и −6; больший — 5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            5,
            0
          ],
          "values": [
            "5",
            "-6",
            "0"
          ]
        },
        "choices": [
          "5",
          "-6",
          "0"
        ],
        "id": "equation-exam-transfer-04"
      },
      {
        "prompt": "Реши 8(x − 1) = 48.",
        "answer": "7",
        "input": "number",
        "hint": "Раздели обе части на множитель.",
        "explanation": "x − 1 = 6; x = 7.",
        "oracle": {
          "kind": "linear",
          "a": 8,
          "b": -8,
          "c": 48
        },
        "id": "equation-exam-transfer-05"
      },
      {
        "prompt": "Подставь x = 7 в x² − 49. Что получится?",
        "answer": "0",
        "input": "number",
        "hint": "Подставь число, сначала вычисли квадрат, затем выполни вычитание.",
        "explanation": "7² − 49 = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              7,
              2
            ],
            49
          ]
        },
        "id": "equation-exam-transfer-06"
      },
      {
        "prompt": "Реши 3x − 8 = 25.",
        "answer": "11",
        "input": "number",
        "hint": "Линейное уравнение решается обратными действиями.",
        "explanation": "3x = 33; x = 11.",
        "oracle": {
          "kind": "linear",
          "a": 3,
          "b": -8,
          "c": 25
        },
        "id": "equation-exam-transfer-07"
      },
      {
        "prompt": "Найди положительный корень x² = 81.",
        "answer": "9",
        "input": "number",
        "hint": "Выбери положительный из двух противоположных корней.",
        "explanation": "Корни ±9; положительный — 9.",
        "oracle": {
          "kind": "square-root",
          "radicand": 81
        },
        "id": "equation-exam-transfer-08"
      },
      {
        "prompt": "Найди ненулевой корень x(x − 10) = 0.",
        "answer": "10",
        "input": "number",
        "hint": "Обнули каждый множитель отдельно.",
        "explanation": "Корни 0 и 10; ненулевой — 10.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -10,
          "c": 0
        },
        "id": "equation-exam-transfer-09"
      },
      {
        "prompt": "Найди больший корень (x − 11)(x + 12) = 0.",
        "answer": "11",
        "input": "choice",
        "hint": "Сравни корни двух линейных множителей.",
        "explanation": "Корни 11 и −12; больший — 11.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            11,
            0
          ],
          "values": [
            "11",
            "-12",
            "0"
          ]
        },
        "choices": [
          "11",
          "-12",
          "0"
        ],
        "id": "equation-exam-transfer-10"
      },
      {
        "prompt": "Реши 7(x − 1) = 84.",
        "answer": "13",
        "input": "number",
        "hint": "Раздели обе части на множитель.",
        "explanation": "x − 1 = 12; x = 13.",
        "oracle": {
          "kind": "linear",
          "a": 7,
          "b": -7,
          "c": 84
        },
        "id": "equation-exam-transfer-11"
      },
      {
        "prompt": "Подставь x = 13 в x² − 169. Что получится?",
        "answer": "0",
        "input": "number",
        "hint": "Подставь число, сначала вычисли квадрат, затем выполни вычитание.",
        "explanation": "13² − 169 = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              13,
              2
            ],
            169
          ]
        },
        "id": "equation-exam-transfer-12"
      },
      {
        "prompt": "Реши 2x − 14 = 20.",
        "answer": "17",
        "input": "number",
        "hint": "Линейное уравнение решается обратными действиями.",
        "explanation": "2x = 34; x = 17.",
        "oracle": {
          "kind": "linear",
          "a": 2,
          "b": -14,
          "c": 20
        },
        "id": "equation-exam-transfer-13"
      },
      {
        "prompt": "Найди положительный корень x² = 225.",
        "answer": "15",
        "input": "number",
        "hint": "Выбери положительный из двух противоположных корней.",
        "explanation": "Корни ±15; положительный — 15.",
        "oracle": {
          "kind": "square-root",
          "radicand": 225
        },
        "id": "equation-exam-transfer-14"
      },
      {
        "prompt": "Найди ненулевой корень x(x − 16) = 0.",
        "answer": "16",
        "input": "number",
        "hint": "Обнули каждый множитель отдельно.",
        "explanation": "Корни 0 и 16; ненулевой — 16.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": -16,
          "c": 0
        },
        "id": "equation-exam-transfer-15"
      },
      {
        "prompt": "Найди больший корень (x − 17)(x + 18) = 0.",
        "answer": "17",
        "input": "choice",
        "hint": "Сравни корни двух линейных множителей.",
        "explanation": "Корни 17 и −18; больший — 17.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            17,
            0
          ],
          "values": [
            "17",
            "-18",
            "0"
          ]
        },
        "choices": [
          "17",
          "-18",
          "0"
        ],
        "id": "equation-exam-transfer-16"
      },
      {
        "prompt": "Реши 6(x − 1) = 108.",
        "answer": "19",
        "input": "number",
        "hint": "Раздели обе части на множитель.",
        "explanation": "x − 1 = 18; x = 19.",
        "oracle": {
          "kind": "linear",
          "a": 6,
          "b": -6,
          "c": 108
        },
        "id": "equation-exam-transfer-17"
      },
      {
        "prompt": "Подставь x = 19 в x² − 361. Что получится?",
        "answer": "0",
        "input": "number",
        "hint": "Подставь число, сначала вычисли квадрат, затем выполни вычитание.",
        "explanation": "19² − 361 = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "pow",
              19,
              2
            ],
            361
          ]
        },
        "id": "equation-exam-transfer-18"
      }
    ]
  },
  {
    "id": "word-comparison",
    "group": "word",
    "title": "На сколько и во сколько",
    "goal": "Различать разность и отношение в тексте задачи.",
    "covers": [
      "path:pre7-comparison-stories"
    ],
    "prerequisites": [
      "path:pre7-subtract-borrow",
      "oge-basics:multiplication-division/tabular-division"
    ],
    "trainers": [
      {
        "title": "Задачи: на сколько и во сколько",
        "href": "/ege-baza/path/index.html#lesson=pre7-comparison-stories",
        "kind": "По шагам",
        "instruction": "Отметь известное количество и смысл сравнения.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Часть, целое и доля: разные вопросы",
        "href": "/trainers/part-whole-share-assignment.html",
        "kind": "Другой способ",
        "instruction": "Покажи меньшую и большую части на модели.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "В одной коробке 5 карандашей, в другой 9. На сколько во второй больше?",
        "answer": "4",
        "input": "number",
        "hint": "«На сколько» требует найти разность.",
        "explanation": "9 − 5 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            5
          ]
        },
        "id": "word-comparison-01"
      },
      {
        "prompt": "В первой пачке 6 листов, во второй 30. Во сколько раз во второй больше?",
        "answer": "5",
        "input": "number",
        "hint": "«Во сколько раз» требует найти отношение.",
        "explanation": "30 : 6 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30,
            6
          ]
        },
        "id": "word-comparison-02"
      },
      {
        "prompt": "На первой полке 7 книг, на второй на 6 меньше. Сколько на второй?",
        "answer": "1",
        "input": "number",
        "hint": "Известное количество уменьшается на разность.",
        "explanation": "7 − 6 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            7,
            6
          ]
        },
        "id": "word-comparison-03"
      },
      {
        "prompt": "В первой корзине 8 яблок, во второй в 3 раза больше. Сколько во второй?",
        "answer": "24",
        "input": "choice",
        "hint": "Различай «в несколько раз» и «на несколько».",
        "explanation": "8 · 3 = 24.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            8,
            3
          ],
          "values": [
            "11",
            "5",
            "24"
          ]
        },
        "choices": [
          "11",
          "5",
          "24"
        ],
        "id": "word-comparison-04"
      },
      {
        "prompt": "В первой пачке 36 деталей — в 4 раза больше, чем во второй. Сколько во второй?",
        "answer": "9",
        "input": "number",
        "hint": "Ищется меньшее количество.",
        "explanation": "36 : 4 = 9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            36,
            4
          ]
        },
        "id": "word-comparison-05"
      },
      {
        "prompt": "Первый отрезок 10 см, второй на 4 см длиннее. Какова общая длина?",
        "answer": "24",
        "input": "number",
        "hint": "Сначала найди второй отрезок.",
        "explanation": "10 + (10 + 4) = 24 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            10,
            [
              "add",
              10,
              4
            ]
          ]
        },
        "id": "word-comparison-06"
      },
      {
        "prompt": "В одной коробке 11 карандашей, в другой 16. На сколько во второй больше?",
        "answer": "5",
        "input": "number",
        "hint": "«На сколько» требует найти разность.",
        "explanation": "16 − 11 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            16,
            11
          ]
        },
        "id": "word-comparison-07"
      },
      {
        "prompt": "В первой пачке 12 листов, во второй 36. Во сколько раз во второй больше?",
        "answer": "3",
        "input": "number",
        "hint": "«Во сколько раз» требует найти отношение.",
        "explanation": "36 : 12 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            36,
            12
          ]
        },
        "id": "word-comparison-08"
      },
      {
        "prompt": "На первой полке 13 книг, на второй на 2 меньше. Сколько на второй?",
        "answer": "11",
        "input": "number",
        "hint": "Известное количество уменьшается на разность.",
        "explanation": "13 − 2 = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            13,
            2
          ]
        },
        "id": "word-comparison-09"
      },
      {
        "prompt": "В первой корзине 14 яблок, во второй в 5 раза больше. Сколько во второй?",
        "answer": "70",
        "input": "choice",
        "hint": "Различай «в несколько раз» и «на несколько».",
        "explanation": "14 · 5 = 70.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            14,
            5
          ],
          "values": [
            "19",
            "9",
            "70"
          ]
        },
        "choices": [
          "19",
          "9",
          "70"
        ],
        "id": "word-comparison-10"
      },
      {
        "prompt": "В первой пачке 30 деталей — в 2 раза больше, чем во второй. Сколько во второй?",
        "answer": "15",
        "input": "number",
        "hint": "Ищется меньшее количество.",
        "explanation": "30 : 2 = 15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30,
            2
          ]
        },
        "id": "word-comparison-11"
      },
      {
        "prompt": "Первый отрезок 16 см, второй на 5 см длиннее. Какова общая длина?",
        "answer": "37",
        "input": "number",
        "hint": "Сначала найди второй отрезок.",
        "explanation": "16 + (16 + 5) = 37 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            16,
            [
              "add",
              16,
              5
            ]
          ]
        },
        "id": "word-comparison-12"
      },
      {
        "prompt": "В одной коробке 17 карандашей, в другой 23. На сколько во второй больше?",
        "answer": "6",
        "input": "number",
        "hint": "«На сколько» требует найти разность.",
        "explanation": "23 − 17 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            23,
            17
          ]
        },
        "id": "word-comparison-13"
      },
      {
        "prompt": "В первой пачке 18 листов, во второй 90. Во сколько раз во второй больше?",
        "answer": "5",
        "input": "number",
        "hint": "«Во сколько раз» требует найти отношение.",
        "explanation": "90 : 18 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            90,
            18
          ]
        },
        "id": "word-comparison-14"
      },
      {
        "prompt": "На первой полке 19 книг, на второй на 3 меньше. Сколько на второй?",
        "answer": "16",
        "input": "number",
        "hint": "Известное количество уменьшается на разность.",
        "explanation": "19 − 3 = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            19,
            3
          ]
        },
        "id": "word-comparison-15"
      },
      {
        "prompt": "В первой корзине 20 яблок, во второй в 3 раза больше. Сколько во второй?",
        "answer": "60",
        "input": "choice",
        "hint": "Различай «в несколько раз» и «на несколько».",
        "explanation": "20 · 3 = 60.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            20,
            3
          ],
          "values": [
            "23",
            "17",
            "60"
          ]
        },
        "choices": [
          "23",
          "17",
          "60"
        ],
        "id": "word-comparison-16"
      },
      {
        "prompt": "В первой пачке 84 деталей — в 4 раза больше, чем во второй. Сколько во второй?",
        "answer": "21",
        "input": "number",
        "hint": "Ищется меньшее количество.",
        "explanation": "84 : 4 = 21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            84,
            4
          ]
        },
        "id": "word-comparison-17"
      },
      {
        "prompt": "Первый отрезок 22 см, второй на 6 см длиннее. Какова общая длина?",
        "answer": "50",
        "input": "number",
        "hint": "Сначала найди второй отрезок.",
        "explanation": "22 + (22 + 6) = 50 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            22,
            [
              "add",
              22,
              6
            ]
          ]
        },
        "id": "word-comparison-18"
      }
    ]
  },
  {
    "id": "word-change",
    "group": "word",
    "title": "Покупка и сдача",
    "goal": "Составлять стоимость покупки и восстанавливать сдачу или исходную сумму.",
    "covers": [
      "path:practice-change"
    ],
    "prerequisites": [
      "path:pre7-add-carry"
    ],
    "trainers": [
      {
        "title": "Покупка и сдача",
        "href": "/ege-baza/path/index.html#lesson=practice-change",
        "kind": "По шагам",
        "instruction": "Запиши цену и количество отдельно.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Касса разрядов",
        "href": "/trainers/decimal-cash-trainer.html",
        "kind": "Другой способ",
        "instruction": "Собери сумму разрядными монетами.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Купили 4 ручки по 25 ₽. Сколько заплатили?",
        "answer": "100",
        "input": "number",
        "hint": "Стоимость равна цене, умноженной на количество.",
        "explanation": "25 · 4 = 100 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            25,
            4
          ]
        },
        "id": "word-change-01"
      },
      {
        "prompt": "За покупку на 150 ₽ дали 205 ₽. Сколько сдачи?",
        "answer": "55",
        "input": "number",
        "hint": "Найди разность переданной суммы и стоимости.",
        "explanation": "205 − 150 = 55 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            205,
            150
          ]
        },
        "id": "word-change-02"
      },
      {
        "prompt": "Купили 2 тетради по 35 ₽ и ластик за 16 ₽. Найди стоимость.",
        "answer": "86",
        "input": "number",
        "hint": "Сначала найди стоимость всех тетрадей.",
        "explanation": "35 · 2 + 16 = 86 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              35,
              2
            ],
            16
          ]
        },
        "id": "word-change-03"
      },
      {
        "prompt": "Из 172 ₽ потратили 3 · 40 ₽. Какая сдача верна?",
        "answer": "52",
        "input": "choice",
        "hint": "Сначала произведение, затем вычитание.",
        "explanation": "172 − 120 = 52 ₽.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            172,
            [
              "mul",
              3,
              40
            ]
          ],
          "values": [
            "169",
            "52",
            "132"
          ]
        },
        "choices": [
          "169",
          "52",
          "132"
        ],
        "id": "word-change-04"
      },
      {
        "prompt": "За 4 одинаковые тетради заплатили 180 ₽. Сколько стоит одна?",
        "answer": "45",
        "input": "number",
        "hint": "Стоимость делится на количество.",
        "explanation": "180 : 4 = 45 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            180,
            4
          ]
        },
        "id": "word-change-05"
      },
      {
        "prompt": "После покупки за 250 ₽ осталось 34 ₽. Сколько денег было?",
        "answer": "284",
        "input": "number",
        "hint": "Восстанови целое из двух частей.",
        "explanation": "250 + 34 = 284 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            250,
            34
          ]
        },
        "id": "word-change-06"
      },
      {
        "prompt": "Купили 2 ручки по 55 ₽. Сколько заплатили?",
        "answer": "110",
        "input": "number",
        "hint": "Стоимость равна цене, умноженной на количество.",
        "explanation": "55 · 2 = 110 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            55,
            2
          ]
        },
        "id": "word-change-07"
      },
      {
        "prompt": "За покупку на 180 ₽ дали 236 ₽. Сколько сдачи?",
        "answer": "56",
        "input": "number",
        "hint": "Найди разность переданной суммы и стоимости.",
        "explanation": "236 − 180 = 56 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            236,
            180
          ]
        },
        "id": "word-change-08"
      },
      {
        "prompt": "Купили 4 тетради по 65 ₽ и ластик за 12 ₽. Найди стоимость.",
        "answer": "272",
        "input": "number",
        "hint": "Сначала найди стоимость всех тетрадей.",
        "explanation": "65 · 4 + 12 = 272 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              65,
              4
            ],
            12
          ]
        },
        "id": "word-change-09"
      },
      {
        "prompt": "Из 403 ₽ потратили 5 · 70 ₽. Какая сдача верна?",
        "answer": "53",
        "input": "choice",
        "hint": "Сначала произведение, затем вычитание.",
        "explanation": "403 − 350 = 53 ₽.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            403,
            [
              "mul",
              5,
              70
            ]
          ],
          "values": [
            "398",
            "53",
            "333"
          ]
        },
        "choices": [
          "398",
          "53",
          "333"
        ],
        "id": "word-change-10"
      },
      {
        "prompt": "За 2 одинаковые тетради заплатили 150 ₽. Сколько стоит одна?",
        "answer": "75",
        "input": "number",
        "hint": "Стоимость делится на количество.",
        "explanation": "150 : 2 = 75 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            150,
            2
          ]
        },
        "id": "word-change-11"
      },
      {
        "prompt": "После покупки за 240 ₽ осталось 35 ₽. Сколько денег было?",
        "answer": "275",
        "input": "number",
        "hint": "Восстанови целое из двух частей.",
        "explanation": "240 + 35 = 275 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            240,
            35
          ]
        },
        "id": "word-change-12"
      },
      {
        "prompt": "Купили 4 ручки по 85 ₽. Сколько заплатили?",
        "answer": "340",
        "input": "number",
        "hint": "Стоимость равна цене, умноженной на количество.",
        "explanation": "85 · 4 = 340 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            85,
            4
          ]
        },
        "id": "word-change-13"
      },
      {
        "prompt": "За покупку на 450 ₽ дали 502 ₽. Сколько сдачи?",
        "answer": "52",
        "input": "number",
        "hint": "Найди разность переданной суммы и стоимости.",
        "explanation": "502 − 450 = 52 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            502,
            450
          ]
        },
        "id": "word-change-14"
      },
      {
        "prompt": "Купили 2 тетради по 95 ₽ и ластик за 13 ₽. Найди стоимость.",
        "answer": "203",
        "input": "number",
        "hint": "Сначала найди стоимость всех тетрадей.",
        "explanation": "95 · 2 + 13 = 203 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              95,
              2
            ],
            13
          ]
        },
        "id": "word-change-15"
      },
      {
        "prompt": "Из 354 ₽ потратили 3 · 100 ₽. Какая сдача верна?",
        "answer": "54",
        "input": "choice",
        "hint": "Сначала произведение, затем вычитание.",
        "explanation": "354 − 300 = 54 ₽.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            354,
            [
              "mul",
              3,
              100
            ]
          ],
          "values": [
            "351",
            "54",
            "254"
          ]
        },
        "choices": [
          "351",
          "54",
          "254"
        ],
        "id": "word-change-16"
      },
      {
        "prompt": "За 4 одинаковые тетради заплатили 420 ₽. Сколько стоит одна?",
        "answer": "105",
        "input": "number",
        "hint": "Стоимость делится на количество.",
        "explanation": "420 : 4 = 105 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            420,
            4
          ]
        },
        "id": "word-change-17"
      },
      {
        "prompt": "После покупки за 550 ₽ осталось 36 ₽. Сколько денег было?",
        "answer": "586",
        "input": "number",
        "hint": "Восстанови целое из двух частей.",
        "explanation": "550 + 36 = 586 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            550,
            36
          ]
        },
        "id": "word-change-18"
      }
    ]
  },
  {
    "id": "word-afford",
    "group": "word",
    "title": "Сколько целых покупок получится",
    "goal": "Выбирать целое количество при ограниченном запасе и проверять остаток.",
    "covers": [
      "path:practice-afford"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/division-with-remainder"
    ],
    "trainers": [
      {
        "title": "На сколько покупок хватит денег",
        "href": "/ege-baza/path/index.html#lesson=practice-afford",
        "kind": "По шагам",
        "instruction": "Проверь, хватит ли на ещё один предмет.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Деление с остатком: частное, остаток и проверка",
        "href": "/trainers/oge-basics/multiplication-division/division-with-remainder.html",
        "kind": "Другой способ",
        "instruction": "Раздели с остатком и сравни его с делителем.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Есть 58 ₽. Тетрадь стоит 9 ₽. Сколько тетрадей можно купить максимум?",
        "answer": "6",
        "input": "number",
        "hint": "Нужен целый результат: остатка на ещё один предмет не хватает.",
        "explanation": "58 = 9 · 6 + 4; 4 < 9.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 58,
          "divisor": 9
        },
        "id": "word-afford-01"
      },
      {
        "prompt": "За 75 ₽ купили максимум билетов по 10 ₽. Сколько рублей осталось?",
        "answer": "5",
        "input": "number",
        "hint": "Вычти стоимость целого числа билетов.",
        "explanation": "75 − 10 · 7 = 5 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            75,
            [
              "mul",
              10,
              7
            ]
          ]
        },
        "id": "word-afford-02"
      },
      {
        "prompt": "Нужно 5 тетрадь по 11 ₽, есть 50 ₽. Сколько рублей не хватает?",
        "answer": "5",
        "input": "number",
        "hint": "Сравни нужную стоимость со всеми деньгами.",
        "explanation": "11 · 5 − 50 = 5 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              11,
              5
            ],
            50
          ]
        },
        "id": "word-afford-03"
      },
      {
        "prompt": "На какое максимальное число покупок по 12 ₽ хватит 62 ₽?",
        "answer": "5",
        "input": "choice",
        "hint": "Проверь цену выбранного количества и ещё одной покупки.",
        "explanation": "На 5 хватит, на 6 нужно 72 ₽.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              62,
              2
            ],
            12
          ],
          "values": [
            "5",
            "6",
            "4"
          ]
        },
        "choices": [
          "5",
          "6",
          "4"
        ],
        "id": "word-afford-04"
      },
      {
        "prompt": "Есть 81 см ленты. На бантик уходит 13 см. Сколько целых бантиков получится?",
        "answer": "6",
        "input": "number",
        "hint": "Нужен целый результат: остатка на ещё один предмет не хватает.",
        "explanation": "81 = 13 · 6 + 3; 3 < 13.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 81,
          "divisor": 13
        },
        "id": "word-afford-05"
      },
      {
        "prompt": "Упаковка стоит 14 ₽. Сколько денег нужно для 7 упаковок?",
        "answer": "98",
        "input": "number",
        "hint": "Умножь цену на количество.",
        "explanation": "14 · 7 = 98 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            14,
            7
          ]
        },
        "id": "word-afford-06"
      },
      {
        "prompt": "Есть 65 ₽. Тетрадь стоит 15 ₽. Сколько тетрадей можно купить максимум?",
        "answer": "4",
        "input": "number",
        "hint": "Нужен целый результат: остатка на ещё один предмет не хватает.",
        "explanation": "65 = 15 · 4 + 5; 5 < 15.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 65,
          "divisor": 15
        },
        "id": "word-afford-07"
      },
      {
        "prompt": "За 86 ₽ купили максимум билетов по 16 ₽. Сколько рублей осталось?",
        "answer": "6",
        "input": "number",
        "hint": "Вычти стоимость целого числа билетов.",
        "explanation": "86 − 16 · 5 = 6 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            86,
            [
              "mul",
              16,
              5
            ]
          ]
        },
        "id": "word-afford-08"
      },
      {
        "prompt": "Нужно 7 тетрадь по 17 ₽, есть 104 ₽. Сколько рублей не хватает?",
        "answer": "15",
        "input": "number",
        "hint": "Сравни нужную стоимость со всеми деньгами.",
        "explanation": "17 · 7 − 104 = 15 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              17,
              7
            ],
            104
          ]
        },
        "id": "word-afford-09"
      },
      {
        "prompt": "На какое максимальное число покупок по 18 ₽ хватит 129 ₽?",
        "answer": "7",
        "input": "choice",
        "hint": "Проверь цену выбранного количества и ещё одной покупки.",
        "explanation": "На 7 хватит, на 8 нужно 144 ₽.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              129,
              3
            ],
            18
          ],
          "values": [
            "7",
            "8",
            "6"
          ]
        },
        "choices": [
          "7",
          "8",
          "6"
        ],
        "id": "word-afford-10"
      },
      {
        "prompt": "Есть 80 см ленты. На бантик уходит 19 см. Сколько целых бантиков получится?",
        "answer": "4",
        "input": "number",
        "hint": "Нужен целый результат: остатка на ещё один предмет не хватает.",
        "explanation": "80 = 19 · 4 + 4; 4 < 19.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 80,
          "divisor": 19
        },
        "id": "word-afford-11"
      },
      {
        "prompt": "Упаковка стоит 20 ₽. Сколько денег нужно для 5 упаковок?",
        "answer": "100",
        "input": "number",
        "hint": "Умножь цену на количество.",
        "explanation": "20 · 5 = 100 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            20,
            5
          ]
        },
        "id": "word-afford-12"
      },
      {
        "prompt": "Есть 132 ₽. Тетрадь стоит 21 ₽. Сколько тетрадей можно купить максимум?",
        "answer": "6",
        "input": "number",
        "hint": "Нужен целый результат: остатка на ещё один предмет не хватает.",
        "explanation": "132 = 21 · 6 + 6; 6 < 21.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 132,
          "divisor": 21
        },
        "id": "word-afford-13"
      },
      {
        "prompt": "За 156 ₽ купили максимум билетов по 22 ₽. Сколько рублей осталось?",
        "answer": "2",
        "input": "number",
        "hint": "Вычти стоимость целого числа билетов.",
        "explanation": "156 − 22 · 7 = 2 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            156,
            [
              "mul",
              22,
              7
            ]
          ]
        },
        "id": "word-afford-14"
      },
      {
        "prompt": "Нужно 5 тетрадь по 23 ₽, есть 95 ₽. Сколько рублей не хватает?",
        "answer": "20",
        "input": "number",
        "hint": "Сравни нужную стоимость со всеми деньгами.",
        "explanation": "23 · 5 − 95 = 20 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              23,
              5
            ],
            95
          ]
        },
        "id": "word-afford-15"
      },
      {
        "prompt": "На какое максимальное число покупок по 24 ₽ хватит 124 ₽?",
        "answer": "5",
        "input": "choice",
        "hint": "Проверь цену выбранного количества и ещё одной покупки.",
        "explanation": "На 5 хватит, на 6 нужно 144 ₽.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              124,
              4
            ],
            24
          ],
          "values": [
            "5",
            "6",
            "4"
          ]
        },
        "choices": [
          "5",
          "6",
          "4"
        ],
        "id": "word-afford-16"
      },
      {
        "prompt": "Есть 155 см ленты. На бантик уходит 25 см. Сколько целых бантиков получится?",
        "answer": "6",
        "input": "number",
        "hint": "Нужен целый результат: остатка на ещё один предмет не хватает.",
        "explanation": "155 = 25 · 6 + 5; 5 < 25.",
        "oracle": {
          "kind": "floor-division",
          "dividend": 155,
          "divisor": 25
        },
        "id": "word-afford-17"
      },
      {
        "prompt": "Упаковка стоит 26 ₽. Сколько денег нужно для 7 упаковок?",
        "answer": "182",
        "input": "number",
        "hint": "Умножь цену на количество.",
        "explanation": "26 · 7 = 182 ₽.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            26,
            7
          ]
        },
        "id": "word-afford-18"
      }
    ]
  },
  {
    "id": "word-perimeter-equation",
    "group": "word",
    "title": "Текст о периметре — в уравнение",
    "goal": "Переводить связь сторон в выражение периметра и находить неизвестную сторону.",
    "covers": [
      "path:grade7-a-equation-word-perimeter"
    ],
    "prerequisites": [
      "path:pre7-perimeter",
      "path:equations-linear"
    ],
    "trainers": [
      {
        "title": "Периметр: составляем уравнение",
        "href": "/ege-baza/path/index.html#lesson=grade7-a-equation-word-perimeter",
        "kind": "По шагам",
        "instruction": "Подпиши стороны через x, затем обойди границу.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Периметр: обходим границу",
        "href": "/ege-baza/path/index.html#lesson=pre7-perimeter",
        "kind": "Другой способ",
        "instruction": "Отдели периметр от площади и проверь сумму длин.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Стороны прямоугольника x и x + 4 см. Периметр 20 см. Найди x.",
        "answer": "3",
        "input": "number",
        "hint": "В периметре две короткие и две длинные стороны.",
        "explanation": "2x + 2(x + 4) = 20; x = 3.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 8,
          "c": 20
        },
        "id": "word-perimeter-equation-01"
      },
      {
        "prompt": "Периметр прямоугольника 26 см. Чему равна сумма двух соседних сторон?",
        "answer": "13",
        "input": "number",
        "hint": "Периметр удваивает эту сумму.",
        "explanation": "26 : 2 = 13 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            26,
            2
          ]
        },
        "id": "word-perimeter-equation-02"
      },
      {
        "prompt": "Стороны прямоугольника x и x + 6. В выражении периметра 4x + c найди c.",
        "answer": "12",
        "input": "number",
        "hint": "Добавка встречается у двух длинных сторон.",
        "explanation": "2x + 2(x + 6) = 4x + 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            6
          ]
        },
        "id": "word-perimeter-equation-03"
      },
      {
        "prompt": "Длина прямоугольника 8, ширина 6 см. Какой периметр верен?",
        "answer": "28",
        "input": "choice",
        "hint": "Нужна сумма границ, а не площадь.",
        "explanation": "2 · (8 + 6) = 28 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              8,
              6
            ]
          ],
          "values": [
            "14",
            "49",
            "28"
          ]
        },
        "choices": [
          "14",
          "49",
          "28"
        ],
        "id": "word-perimeter-equation-04"
      },
      {
        "prompt": "Одна сторона прямоугольника 7 см, периметр 34 см. Найди длину соседней стороны.",
        "answer": "10",
        "input": "number",
        "hint": "Из половины периметра вычти сторону.",
        "explanation": "34 : 2 − 7 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              34,
              2
            ],
            7
          ]
        },
        "id": "word-perimeter-equation-05"
      },
      {
        "prompt": "Периметр квадрата 32 см. Какова сторона?",
        "answer": "8",
        "input": "number",
        "hint": "У квадрата четыре равные стороны.",
        "explanation": "32 : 4 = 8 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            32,
            4
          ]
        },
        "id": "word-perimeter-equation-06"
      },
      {
        "prompt": "Стороны прямоугольника x и x + 5 см. Периметр 46 см. Найди x.",
        "answer": "9",
        "input": "number",
        "hint": "В периметре две короткие и две длинные стороны.",
        "explanation": "2x + 2(x + 5) = 46; x = 9.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 10,
          "c": 46
        },
        "id": "word-perimeter-equation-07"
      },
      {
        "prompt": "Периметр прямоугольника 52 см. Чему равна сумма двух соседних сторон?",
        "answer": "26",
        "input": "number",
        "hint": "Периметр удваивает эту сумму.",
        "explanation": "52 : 2 = 26 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            52,
            2
          ]
        },
        "id": "word-perimeter-equation-08"
      },
      {
        "prompt": "Стороны прямоугольника x и x + 2. В выражении периметра 4x + c найди c.",
        "answer": "4",
        "input": "number",
        "hint": "Добавка встречается у двух длинных сторон.",
        "explanation": "2x + 2(x + 2) = 4x + 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            2
          ]
        },
        "id": "word-perimeter-equation-09"
      },
      {
        "prompt": "Длина прямоугольника 15, ширина 12 см. Какой периметр верен?",
        "answer": "54",
        "input": "choice",
        "hint": "Нужна сумма границ, а не площадь.",
        "explanation": "2 · (15 + 12) = 54 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              15,
              12
            ]
          ],
          "values": [
            "27",
            "181",
            "54"
          ]
        },
        "choices": [
          "27",
          "181",
          "54"
        ],
        "id": "word-perimeter-equation-10"
      },
      {
        "prompt": "Одна сторона прямоугольника 13 см, периметр 60 см. Найди длину соседней стороны.",
        "answer": "17",
        "input": "number",
        "hint": "Из половины периметра вычти сторону.",
        "explanation": "60 : 2 − 13 = 17 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              60,
              2
            ],
            13
          ]
        },
        "id": "word-perimeter-equation-11"
      },
      {
        "prompt": "Периметр квадрата 56 см. Какова сторона?",
        "answer": "14",
        "input": "number",
        "hint": "У квадрата четыре равные стороны.",
        "explanation": "56 : 4 = 14 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            56,
            4
          ]
        },
        "id": "word-perimeter-equation-12"
      },
      {
        "prompt": "Стороны прямоугольника x и x + 6 см. Периметр 72 см. Найди x.",
        "answer": "15",
        "input": "number",
        "hint": "В периметре две короткие и две длинные стороны.",
        "explanation": "2x + 2(x + 6) = 72; x = 15.",
        "oracle": {
          "kind": "linear",
          "a": 4,
          "b": 12,
          "c": 72
        },
        "id": "word-perimeter-equation-13"
      },
      {
        "prompt": "Периметр прямоугольника 68 см. Чему равна сумма двух соседних сторон?",
        "answer": "34",
        "input": "number",
        "hint": "Периметр удваивает эту сумму.",
        "explanation": "68 : 2 = 34 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            68,
            2
          ]
        },
        "id": "word-perimeter-equation-14"
      },
      {
        "prompt": "Стороны прямоугольника x и x + 3. В выражении периметра 4x + c найди c.",
        "answer": "6",
        "input": "number",
        "hint": "Добавка встречается у двух длинных сторон.",
        "explanation": "2x + 2(x + 3) = 4x + 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            3
          ]
        },
        "id": "word-perimeter-equation-15"
      },
      {
        "prompt": "Длина прямоугольника 22, ширина 18 см. Какой периметр верен?",
        "answer": "80",
        "input": "choice",
        "hint": "Нужна сумма границ, а не площадь.",
        "explanation": "2 · (22 + 18) = 80 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              22,
              18
            ]
          ],
          "values": [
            "40",
            "397",
            "80"
          ]
        },
        "choices": [
          "40",
          "397",
          "80"
        ],
        "id": "word-perimeter-equation-16"
      },
      {
        "prompt": "Одна сторона прямоугольника 19 см, периметр 86 см. Найди длину соседней стороны.",
        "answer": "24",
        "input": "number",
        "hint": "Из половины периметра вычти сторону.",
        "explanation": "86 : 2 − 19 = 24 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              86,
              2
            ],
            19
          ]
        },
        "id": "word-perimeter-equation-17"
      },
      {
        "prompt": "Периметр квадрата 80 см. Какова сторона?",
        "answer": "20",
        "input": "number",
        "hint": "У квадрата четыре равные стороны.",
        "explanation": "80 : 4 = 20 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            80,
            4
          ]
        },
        "id": "word-perimeter-equation-18"
      }
    ]
  },
  {
    "id": "word-distance",
    "group": "word",
    "title": "Скорость, время и расстояние",
    "goal": "Находить каждую из трёх величин и следить за единицами времени.",
    "covers": [
      "public:v5-formula-distance"
    ],
    "prerequisites": [
      "oge-basics:units-length-time"
    ],
    "trainers": [
      {
        "title": "Скорость, время и расстояние",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-formula-distance",
        "kind": "По шагам",
        "instruction": "Заполни таблицу скорость — время — путь.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Движение навстречу",
        "href": "/ege-baza/path/index.html#lesson=practice-meeting",
        "kind": "Другой способ",
        "instruction": "Рассмотри отдельно путь каждого участника.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Велосипедист ехал 4 ч со скоростью 6 км/ч. Сколько километров проехал?",
        "answer": "24",
        "input": "number",
        "hint": "Путь равен произведению скорости и времени.",
        "explanation": "6 · 4 = 24 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Скорость, км/ч",
            "Время, ч",
            "Путь, км"
          ],
          "rows": [
            [
              6,
              4,
              "?"
            ]
          ]
        },
        "id": "word-distance-01"
      },
      {
        "prompt": "Путь 35 км пройден за 5 ч. Найди скорость в км/ч.",
        "answer": "7",
        "input": "number",
        "hint": "Скорость — путь за единицу времени.",
        "explanation": "35 : 5 = 7 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            35,
            5
          ]
        },
        "id": "word-distance-02"
      },
      {
        "prompt": "При скорости 8 км/ч сколько часов нужно для 16 км?",
        "answer": "2",
        "input": "number",
        "hint": "Время равно пути, делённому на скорость.",
        "explanation": "16 : 8 = 2 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            16,
            8
          ]
        },
        "id": "word-distance-03"
      },
      {
        "prompt": "Движутся со скоростью 9 км/ч. Какой путь за полчаса?",
        "answer": "9/2",
        "input": "choice",
        "hint": "Полчаса — половина часа.",
        "explanation": "9 · 1/2 = 9/2 км.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            9,
            "1/2"
          ],
          "values": [
            "18",
            "9/2",
            "9"
          ]
        },
        "choices": [
          "18",
          "9/2",
          "9"
        ],
        "id": "word-distance-04"
      },
      {
        "prompt": "За первый участок прошли 40 км, за второй 10 км. Каков весь путь?",
        "answer": "50",
        "input": "number",
        "hint": "Складываются пути участков.",
        "explanation": "40 + 10 = 50 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            40,
            10
          ]
        },
        "id": "word-distance-05"
      },
      {
        "prompt": "Скорость 55 км/ч. За сколько минут пройдут 27,5 км?",
        "answer": "30",
        "input": "number",
        "hint": "Найди долю часа и переведи в минуты.",
        "explanation": "(27,5 : 55) · 60 = 30 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              "27.5",
              55
            ],
            60
          ]
        },
        "id": "word-distance-06"
      },
      {
        "prompt": "Велосипедист ехал 2 ч со скоростью 12 км/ч. Сколько километров проехал?",
        "answer": "24",
        "input": "number",
        "hint": "Путь равен произведению скорости и времени.",
        "explanation": "12 · 2 = 24 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            2
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Скорость, км/ч",
            "Время, ч",
            "Путь, км"
          ],
          "rows": [
            [
              12,
              2,
              "?"
            ]
          ]
        },
        "id": "word-distance-07"
      },
      {
        "prompt": "Путь 39 км пройден за 3 ч. Найди скорость в км/ч.",
        "answer": "13",
        "input": "number",
        "hint": "Скорость — путь за единицу времени.",
        "explanation": "39 : 3 = 13 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            39,
            3
          ]
        },
        "id": "word-distance-08"
      },
      {
        "prompt": "При скорости 14 км/ч сколько часов нужно для 56 км?",
        "answer": "4",
        "input": "number",
        "hint": "Время равно пути, делённому на скорость.",
        "explanation": "56 : 14 = 4 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            56,
            14
          ]
        },
        "id": "word-distance-09"
      },
      {
        "prompt": "Движутся со скоростью 15 км/ч. Какой путь за полчаса?",
        "answer": "15/2",
        "input": "choice",
        "hint": "Полчаса — половина часа.",
        "explanation": "15 · 1/2 = 15/2 км.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            15,
            "1/2"
          ],
          "values": [
            "30",
            "15/2",
            "15"
          ]
        },
        "choices": [
          "30",
          "15/2",
          "15"
        ],
        "id": "word-distance-10"
      },
      {
        "prompt": "За первый участок прошли 32 км, за второй 16 км. Каков весь путь?",
        "answer": "48",
        "input": "number",
        "hint": "Складываются пути участков.",
        "explanation": "32 + 16 = 48 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            32,
            16
          ]
        },
        "id": "word-distance-11"
      },
      {
        "prompt": "Скорость 85 км/ч. За сколько минут пройдут 42,5 км?",
        "answer": "30",
        "input": "number",
        "hint": "Найди долю часа и переведи в минуты.",
        "explanation": "(42,5 : 85) · 60 = 30 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              "42.5",
              85
            ],
            60
          ]
        },
        "id": "word-distance-12"
      },
      {
        "prompt": "Велосипедист ехал 4 ч со скоростью 18 км/ч. Сколько километров проехал?",
        "answer": "72",
        "input": "number",
        "hint": "Путь равен произведению скорости и времени.",
        "explanation": "18 · 4 = 72 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            18,
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Скорость, км/ч",
            "Время, ч",
            "Путь, км"
          ],
          "rows": [
            [
              18,
              4,
              "?"
            ]
          ]
        },
        "id": "word-distance-13"
      },
      {
        "prompt": "Путь 95 км пройден за 5 ч. Найди скорость в км/ч.",
        "answer": "19",
        "input": "number",
        "hint": "Скорость — путь за единицу времени.",
        "explanation": "95 : 5 = 19 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            95,
            5
          ]
        },
        "id": "word-distance-14"
      },
      {
        "prompt": "При скорости 20 км/ч сколько часов нужно для 40 км?",
        "answer": "2",
        "input": "number",
        "hint": "Время равно пути, делённому на скорость.",
        "explanation": "40 : 20 = 2 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            40,
            20
          ]
        },
        "id": "word-distance-15"
      },
      {
        "prompt": "Движутся со скоростью 21 км/ч. Какой путь за полчаса?",
        "answer": "21/2",
        "input": "choice",
        "hint": "Полчаса — половина часа.",
        "explanation": "21 · 1/2 = 21/2 км.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            21,
            "1/2"
          ],
          "values": [
            "42",
            "21/2",
            "21"
          ]
        },
        "choices": [
          "42",
          "21/2",
          "21"
        ],
        "id": "word-distance-16"
      },
      {
        "prompt": "За первый участок прошли 88 км, за второй 22 км. Каков весь путь?",
        "answer": "110",
        "input": "number",
        "hint": "Складываются пути участков.",
        "explanation": "88 + 22 = 110 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            88,
            22
          ]
        },
        "id": "word-distance-17"
      },
      {
        "prompt": "Скорость 115 км/ч. За сколько минут пройдут 57,5 км?",
        "answer": "30",
        "input": "number",
        "hint": "Найди долю часа и переведи в минуты.",
        "explanation": "(57,5 : 115) · 60 = 30 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              "57.5",
              115
            ],
            60
          ]
        },
        "id": "word-distance-18"
      }
    ]
  },
  {
    "id": "word-meeting",
    "group": "word",
    "title": "Встреча и догонка",
    "goal": "Различать сложение скоростей при встрече и разность при догонке.",
    "covers": [
      "path:practice-meeting",
      "public:v6-motion-meeting"
    ],
    "prerequisites": [
      "public:v5-formula-distance"
    ],
    "trainers": [
      {
        "title": "Встреча и догонка на модели",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-motion-meeting",
        "kind": "По шагам",
        "instruction": "Подвигай участников и проследи изменение расстояния.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Движение навстречу",
        "href": "/ege-baza/path/index.html#lesson=practice-meeting",
        "kind": "Другой способ",
        "instruction": "Найди скорость сближения, затем время или путь.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Идут навстречу со скоростями 5 и 4 км/ч. На сколько километров за час сокращается расстояние?",
        "answer": "9",
        "input": "number",
        "hint": "Оба уменьшают расстояние.",
        "explanation": "5 + 4 = 9 км за час.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            5,
            4
          ]
        },
        "id": "word-meeting-01"
      },
      {
        "prompt": "Расстояние 55 км. Движутся навстречу со скоростями 6 и 5 км/ч. Через сколько часов встреча?",
        "answer": "5",
        "input": "number",
        "hint": "Раздели расстояние на скорость сближения.",
        "explanation": "55 : (6 + 5) = 5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            55,
            [
              "add",
              6,
              5
            ]
          ]
        },
        "id": "word-meeting-02"
      },
      {
        "prompt": "Два участника одновременно начали двигаться навстречу друг другу со скоростями 7 и 6 км/ч и встретились через 2 ч. Каково начальное расстояние между ними?",
        "answer": "26",
        "input": "number",
        "hint": "Общий путь равен сумме двух путей.",
        "explanation": "(7 + 6) · 2 = 26 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              7,
              6
            ],
            2
          ]
        },
        "id": "word-meeting-03"
      },
      {
        "prompt": "Задний движется 10 км/ч, передний 2 км/ч в том же направлении. Какова скорость сближения?",
        "answer": "8",
        "input": "choice",
        "hint": "При догонке скорости вычитают.",
        "explanation": "10 − 2 = 8 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            10,
            2
          ],
          "values": [
            "8",
            "12",
            "2"
          ]
        },
        "choices": [
          "8",
          "12",
          "2"
        ],
        "id": "word-meeting-04"
      },
      {
        "prompt": "Скорости 12 и 3 км/ч, отрыв 36 км. Через сколько часов быстрый догонит медленного?",
        "answer": "4",
        "input": "number",
        "hint": "Найди уменьшение отрыва за час.",
        "explanation": "36 : (12 − 3) = 4 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            36,
            [
              "sub",
              12,
              3
            ]
          ]
        },
        "id": "word-meeting-05"
      },
      {
        "prompt": "Двигаясь навстречу друг другу, до встречи первый прошёл 50 км, а второй — 20 км. Каково начальное расстояние между ними?",
        "answer": "70",
        "input": "number",
        "hint": "Они прошли весь промежуток между стартами.",
        "explanation": "50 + 20 = 70 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            50,
            20
          ]
        },
        "id": "word-meeting-06"
      },
      {
        "prompt": "Идут навстречу со скоростями 11 и 5 км/ч. На сколько километров за час сокращается расстояние?",
        "answer": "16",
        "input": "number",
        "hint": "Оба уменьшают расстояние.",
        "explanation": "11 + 5 = 16 км за час.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            11,
            5
          ]
        },
        "id": "word-meeting-07"
      },
      {
        "prompt": "Расстояние 54 км. Движутся навстречу со скоростями 12 и 6 км/ч. Через сколько часов встреча?",
        "answer": "3",
        "input": "number",
        "hint": "Раздели расстояние на скорость сближения.",
        "explanation": "54 : (12 + 6) = 3 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            54,
            [
              "add",
              12,
              6
            ]
          ]
        },
        "id": "word-meeting-08"
      },
      {
        "prompt": "Два участника одновременно начали двигаться навстречу друг другу со скоростями 13 и 2 км/ч и встретились через 4 ч. Каково начальное расстояние между ними?",
        "answer": "60",
        "input": "number",
        "hint": "Общий путь равен сумме двух путей.",
        "explanation": "(13 + 2) · 4 = 60 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              13,
              2
            ],
            4
          ]
        },
        "id": "word-meeting-09"
      },
      {
        "prompt": "Задний движется 17 км/ч, передний 3 км/ч в том же направлении. Какова скорость сближения?",
        "answer": "14",
        "input": "choice",
        "hint": "При догонке скорости вычитают.",
        "explanation": "17 − 3 = 14 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            17,
            3
          ],
          "values": [
            "14",
            "20",
            "3"
          ]
        },
        "choices": [
          "14",
          "20",
          "3"
        ],
        "id": "word-meeting-10"
      },
      {
        "prompt": "Скорости 19 и 4 км/ч, отрыв 30 км. Через сколько часов быстрый догонит медленного?",
        "answer": "2",
        "input": "number",
        "hint": "Найди уменьшение отрыва за час.",
        "explanation": "30 : (19 − 4) = 2 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30,
            [
              "sub",
              19,
              4
            ]
          ]
        },
        "id": "word-meeting-11"
      },
      {
        "prompt": "Двигаясь навстречу друг другу, до встречи первый прошёл 48 км, а второй — 15 км. Каково начальное расстояние между ними?",
        "answer": "63",
        "input": "number",
        "hint": "Они прошли весь промежуток между стартами.",
        "explanation": "48 + 15 = 63 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            48,
            15
          ]
        },
        "id": "word-meeting-12"
      },
      {
        "prompt": "Идут навстречу со скоростями 17 и 6 км/ч. На сколько километров за час сокращается расстояние?",
        "answer": "23",
        "input": "number",
        "hint": "Оба уменьшают расстояние.",
        "explanation": "17 + 6 = 23 км за час.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            17,
            6
          ]
        },
        "id": "word-meeting-13"
      },
      {
        "prompt": "Расстояние 100 км. Движутся навстречу со скоростями 18 и 2 км/ч. Через сколько часов встреча?",
        "answer": "5",
        "input": "number",
        "hint": "Раздели расстояние на скорость сближения.",
        "explanation": "100 : (18 + 2) = 5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            100,
            [
              "add",
              18,
              2
            ]
          ]
        },
        "id": "word-meeting-14"
      },
      {
        "prompt": "Два участника одновременно начали двигаться навстречу друг другу со скоростями 19 и 3 км/ч и встретились через 2 ч. Каково начальное расстояние между ними?",
        "answer": "44",
        "input": "number",
        "hint": "Общий путь равен сумме двух путей.",
        "explanation": "(19 + 3) · 2 = 44 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "add",
              19,
              3
            ],
            2
          ]
        },
        "id": "word-meeting-15"
      },
      {
        "prompt": "Задний движется 24 км/ч, передний 4 км/ч в том же направлении. Какова скорость сближения?",
        "answer": "20",
        "input": "choice",
        "hint": "При догонке скорости вычитают.",
        "explanation": "24 − 4 = 20 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            24,
            4
          ],
          "values": [
            "20",
            "28",
            "4"
          ]
        },
        "choices": [
          "20",
          "28",
          "4"
        ],
        "id": "word-meeting-16"
      },
      {
        "prompt": "Скорости 26 и 5 км/ч, отрыв 84 км. Через сколько часов быстрый догонит медленного?",
        "answer": "4",
        "input": "number",
        "hint": "Найди уменьшение отрыва за час.",
        "explanation": "84 : (26 − 5) = 4 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            84,
            [
              "sub",
              26,
              5
            ]
          ]
        },
        "id": "word-meeting-17"
      },
      {
        "prompt": "Двигаясь навстречу друг другу, до встречи первый прошёл 110 км, а второй — 30 км. Каково начальное расстояние между ними?",
        "answer": "140",
        "input": "number",
        "hint": "Они прошли весь промежуток между стартами.",
        "explanation": "110 + 30 = 140 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            110,
            30
          ]
        },
        "id": "word-meeting-18"
      }
    ]
  },
  {
    "id": "word-work",
    "group": "word",
    "title": "Совместная работа",
    "goal": "Складывать доли работы за час и связывать производительность с временем.",
    "covers": [
      "path:practice-work"
    ],
    "prerequisites": [
      "path:grade7-b-fraction-division-meaning",
      "oge-basics:fraction-common-denominator"
    ],
    "trainers": [
      {
        "title": "Совместная работа",
        "href": "/ege-baza/path/index.html#lesson=practice-work",
        "kind": "По шагам",
        "instruction": "Прими работу за единицу и найди часовую долю каждого.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Часть, целое и доля: разные вопросы",
        "href": "/trainers/part-whole-share-assignment.html",
        "kind": "Другой способ",
        "instruction": "Раздели целое на равные части и восстанови число долей.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Исполнитель делает всю работу за 4 ч. Какую долю работы он делает за 1 ч?",
        "answer": "1/4",
        "input": "number",
        "hint": "Всю работу принимают за единицу.",
        "explanation": "За час — 1/4 работы.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            4
          ]
        },
        "id": "word-work-01"
      },
      {
        "prompt": "Отдельно работу делают за 6 и 9 ч. Какую долю сделают вместе за 1 ч?",
        "answer": "5/18",
        "input": "number",
        "hint": "Складываются часовые доли, а не полные времена.",
        "explanation": "1/6 + 1/9 = 5/18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              1,
              6
            ],
            [
              "div",
              1,
              9
            ]
          ]
        },
        "id": "word-work-02"
      },
      {
        "prompt": "Насосы отдельно заполняют бассейн за 8 и 12 ч. За сколько часов заполнят вместе?",
        "answer": "24/5",
        "input": "number",
        "hint": "Раздели единицу на суммарную часовую долю.",
        "explanation": "1 : (1/8 + 1/12) = 24/5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "add",
              [
                "div",
                1,
                8
              ],
              [
                "div",
                1,
                12
              ]
            ]
          ]
        },
        "id": "word-work-03"
      },
      {
        "prompt": "Работу выполняют за 10 ч. Какую долю выполнят за 5 ч?",
        "answer": "1/2",
        "input": "choice",
        "hint": "Время умножается на часовую долю.",
        "explanation": "5 : 10 = 1/2 работы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            5,
            10
          ],
          "values": [
            "1/3",
            "2",
            "1/2"
          ]
        },
        "choices": [
          "1/3",
          "2",
          "1/2"
        ],
        "id": "word-work-04"
      },
      {
        "prompt": "Исполнитель делает 1/12 работы за час. За сколько часов выполнит всю работу?",
        "answer": "12",
        "input": "number",
        "hint": "Сколько часовых долей составляют единицу?",
        "explanation": "1 : (1/12) = 12 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            "1/12"
          ]
        },
        "id": "word-work-05"
      },
      {
        "prompt": "Вместе делают 5/42 работы в час. Какую долю сделают за 7 ч?",
        "answer": "5/6",
        "input": "number",
        "hint": "Умножь часовую долю на время.",
        "explanation": "5/42 · 7 = 5/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "5/42",
            7
          ]
        },
        "id": "word-work-06"
      },
      {
        "prompt": "Исполнитель делает всю работу за 16 ч. Какую долю работы он делает за 1 ч?",
        "answer": "1/16",
        "input": "number",
        "hint": "Всю работу принимают за единицу.",
        "explanation": "За час — 1/16 работы.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            16
          ]
        },
        "id": "word-work-07"
      },
      {
        "prompt": "Отдельно работу делают за 18 и 27 ч. Какую долю сделают вместе за 1 ч?",
        "answer": "5/54",
        "input": "number",
        "hint": "Складываются часовые доли, а не полные времена.",
        "explanation": "1/18 + 1/27 = 5/54.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              1,
              18
            ],
            [
              "div",
              1,
              27
            ]
          ]
        },
        "id": "word-work-08"
      },
      {
        "prompt": "Насосы отдельно заполняют бассейн за 20 и 30 ч. За сколько часов заполнят вместе?",
        "answer": "12",
        "input": "number",
        "hint": "Раздели единицу на суммарную часовую долю.",
        "explanation": "1 : (1/20 + 1/30) = 12 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "add",
              [
                "div",
                1,
                20
              ],
              [
                "div",
                1,
                30
              ]
            ]
          ]
        },
        "id": "word-work-09"
      },
      {
        "prompt": "Работу выполняют за 22 ч. Какую долю выполнят за 11 ч?",
        "answer": "1/2",
        "input": "choice",
        "hint": "Время умножается на часовую долю.",
        "explanation": "11 : 22 = 1/2 работы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            11,
            22
          ],
          "values": [
            "1/3",
            "2",
            "1/2"
          ]
        },
        "choices": [
          "1/3",
          "2",
          "1/2"
        ],
        "id": "word-work-10"
      },
      {
        "prompt": "Исполнитель делает 1/24 работы за час. За сколько часов выполнит всю работу?",
        "answer": "24",
        "input": "number",
        "hint": "Сколько часовых долей составляют единицу?",
        "explanation": "1 : (1/24) = 24 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            "1/24"
          ]
        },
        "id": "word-work-11"
      },
      {
        "prompt": "Вместе делают 5/78 работы в час. Какую долю сделают за 13 ч?",
        "answer": "5/6",
        "input": "number",
        "hint": "Умножь часовую долю на время.",
        "explanation": "5/78 · 13 = 5/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "5/78",
            13
          ]
        },
        "id": "word-work-12"
      },
      {
        "prompt": "Исполнитель делает всю работу за 28 ч. Какую долю работы он делает за 1 ч?",
        "answer": "1/28",
        "input": "number",
        "hint": "Всю работу принимают за единицу.",
        "explanation": "За час — 1/28 работы.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            28
          ]
        },
        "id": "word-work-13"
      },
      {
        "prompt": "Отдельно работу делают за 30 и 45 ч. Какую долю сделают вместе за 1 ч?",
        "answer": "1/18",
        "input": "number",
        "hint": "Складываются часовые доли, а не полные времена.",
        "explanation": "1/30 + 1/45 = 1/18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "div",
              1,
              30
            ],
            [
              "div",
              1,
              45
            ]
          ]
        },
        "id": "word-work-14"
      },
      {
        "prompt": "Насосы отдельно заполняют бассейн за 32 и 48 ч. За сколько часов заполнят вместе?",
        "answer": "96/5",
        "input": "number",
        "hint": "Раздели единицу на суммарную часовую долю.",
        "explanation": "1 : (1/32 + 1/48) = 96/5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            [
              "add",
              [
                "div",
                1,
                32
              ],
              [
                "div",
                1,
                48
              ]
            ]
          ]
        },
        "id": "word-work-15"
      },
      {
        "prompt": "Работу выполняют за 34 ч. Какую долю выполнят за 17 ч?",
        "answer": "1/2",
        "input": "choice",
        "hint": "Время умножается на часовую долю.",
        "explanation": "17 : 34 = 1/2 работы.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            17,
            34
          ],
          "values": [
            "1/3",
            "2",
            "1/2"
          ]
        },
        "choices": [
          "1/3",
          "2",
          "1/2"
        ],
        "id": "word-work-16"
      },
      {
        "prompt": "Исполнитель делает 1/36 работы за час. За сколько часов выполнит всю работу?",
        "answer": "36",
        "input": "number",
        "hint": "Сколько часовых долей составляют единицу?",
        "explanation": "1 : (1/36) = 36 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1,
            "1/36"
          ]
        },
        "id": "word-work-17"
      },
      {
        "prompt": "Вместе делают 5/114 работы в час. Какую долю сделают за 19 ч?",
        "answer": "5/6",
        "input": "number",
        "hint": "Умножь часовую долю на время.",
        "explanation": "5/114 · 19 = 5/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            "5/114",
            19
          ]
        },
        "id": "word-work-18"
      }
    ]
  },
  {
    "id": "word-river",
    "group": "word",
    "title": "Движение по реке",
    "goal": "Различать собственную скорость, течение и скорость относительно берега.",
    "covers": [
      "path:practice-river"
    ],
    "prerequisites": [
      "public:v5-formula-distance"
    ],
    "trainers": [
      {
        "title": "Движение по реке",
        "href": "/ege-baza/path/index.html#lesson=practice-river",
        "kind": "По шагам",
        "instruction": "Сравни движение по течению и против.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Встреча и догонка на модели",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-motion-meeting",
        "kind": "Другой способ",
        "instruction": "Проследи, когда скорости складываются и вычитаются.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Лодка в стоячей воде 9 км/ч, течение 3 км/ч. Найди скорость по течению.",
        "answer": "12",
        "input": "number",
        "hint": "Течение прибавляет скорость.",
        "explanation": "9 + 3 = 12 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            9,
            3
          ]
        },
        "id": "word-river-01"
      },
      {
        "prompt": "Собственная скорость лодки — 10 км/ч, скорость течения — 4 км/ч. Найди скорость против течения.",
        "answer": "6",
        "input": "number",
        "hint": "Течение уменьшает скорость относительно берега.",
        "explanation": "10 − 4 = 6 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            10,
            4
          ]
        },
        "id": "word-river-02"
      },
      {
        "prompt": "По течению скорость 12 км/ч. Какой путь за 2 ч?",
        "answer": "24",
        "input": "number",
        "hint": "Используй скорость относительно берега.",
        "explanation": "12 · 2 = 24 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            2
          ]
        },
        "id": "word-river-03"
      },
      {
        "prompt": "По течению скорость 14, против 10 км/ч. Какова скорость течения?",
        "answer": "2",
        "input": "choice",
        "hint": "Разность содержит течение дважды.",
        "explanation": "(14 − 10) : 2 = 2 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              14,
              10
            ],
            2
          ],
          "values": [
            "12",
            "2",
            "4"
          ]
        },
        "choices": [
          "12",
          "2",
          "4"
        ],
        "id": "word-river-04"
      },
      {
        "prompt": "По течению скорость 16, против 10 км/ч. Найди собственную скорость.",
        "answer": "13",
        "input": "number",
        "hint": "Среднее двух скоростей убирает течение.",
        "explanation": "(16 + 10) : 2 = 13 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              16,
              10
            ],
            2
          ]
        },
        "id": "word-river-05"
      },
      {
        "prompt": "Против течения нужно пройти 50 км со скоростью 10 км/ч. Сколько часов?",
        "answer": "5",
        "input": "number",
        "hint": "Путь делится на скорость относительно берега.",
        "explanation": "50 : 10 = 5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            50,
            10
          ]
        },
        "id": "word-river-06"
      },
      {
        "prompt": "Лодка в стоячей воде 15 км/ч, течение 1 км/ч. Найди скорость по течению.",
        "answer": "16",
        "input": "number",
        "hint": "Течение прибавляет скорость.",
        "explanation": "15 + 1 = 16 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            15,
            1
          ]
        },
        "id": "word-river-07"
      },
      {
        "prompt": "Собственная скорость лодки — 16 км/ч, скорость течения — 2 км/ч. Найди скорость против течения.",
        "answer": "14",
        "input": "number",
        "hint": "Течение уменьшает скорость относительно берега.",
        "explanation": "16 − 2 = 14 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            16,
            2
          ]
        },
        "id": "word-river-08"
      },
      {
        "prompt": "По течению скорость 20 км/ч. Какой путь за 4 ч?",
        "answer": "80",
        "input": "number",
        "hint": "Используй скорость относительно берега.",
        "explanation": "20 · 4 = 80 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            20,
            4
          ]
        },
        "id": "word-river-09"
      },
      {
        "prompt": "По течению скорость 22, против 14 км/ч. Какова скорость течения?",
        "answer": "4",
        "input": "choice",
        "hint": "Разность содержит течение дважды.",
        "explanation": "(22 − 14) : 2 = 4 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              22,
              14
            ],
            2
          ],
          "values": [
            "18",
            "4",
            "8"
          ]
        },
        "choices": [
          "18",
          "4",
          "8"
        ],
        "id": "word-river-10"
      },
      {
        "prompt": "По течению скорость 20, против 18 км/ч. Найди собственную скорость.",
        "answer": "19",
        "input": "number",
        "hint": "Среднее двух скоростей убирает течение.",
        "explanation": "(20 + 18) : 2 = 19 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              20,
              18
            ],
            2
          ]
        },
        "id": "word-river-11"
      },
      {
        "prompt": "Против течения нужно пройти 54 км со скоростью 18 км/ч. Сколько часов?",
        "answer": "3",
        "input": "number",
        "hint": "Путь делится на скорость относительно берега.",
        "explanation": "54 : 18 = 3 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            54,
            18
          ]
        },
        "id": "word-river-12"
      },
      {
        "prompt": "Лодка в стоячей воде 21 км/ч, течение 3 км/ч. Найди скорость по течению.",
        "answer": "24",
        "input": "number",
        "hint": "Течение прибавляет скорость.",
        "explanation": "21 + 3 = 24 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            21,
            3
          ]
        },
        "id": "word-river-13"
      },
      {
        "prompt": "Собственная скорость лодки — 22 км/ч, скорость течения — 4 км/ч. Найди скорость против течения.",
        "answer": "18",
        "input": "number",
        "hint": "Течение уменьшает скорость относительно берега.",
        "explanation": "22 − 4 = 18 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            22,
            4
          ]
        },
        "id": "word-river-14"
      },
      {
        "prompt": "По течению скорость 24 км/ч. Какой путь за 2 ч?",
        "answer": "48",
        "input": "number",
        "hint": "Используй скорость относительно берега.",
        "explanation": "24 · 2 = 48 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            24,
            2
          ]
        },
        "id": "word-river-15"
      },
      {
        "prompt": "По течению скорость 26, против 22 км/ч. Какова скорость течения?",
        "answer": "2",
        "input": "choice",
        "hint": "Разность содержит течение дважды.",
        "explanation": "(26 − 22) : 2 = 2 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              26,
              22
            ],
            2
          ],
          "values": [
            "24",
            "2",
            "4"
          ]
        },
        "choices": [
          "24",
          "2",
          "4"
        ],
        "id": "word-river-16"
      },
      {
        "prompt": "По течению скорость 28, против 22 км/ч. Найди собственную скорость.",
        "answer": "25",
        "input": "number",
        "hint": "Среднее двух скоростей убирает течение.",
        "explanation": "(28 + 22) : 2 = 25 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              28,
              22
            ],
            2
          ]
        },
        "id": "word-river-17"
      },
      {
        "prompt": "Против течения нужно пройти 110 км со скоростью 22 км/ч. Сколько часов?",
        "answer": "5",
        "input": "number",
        "hint": "Путь делится на скорость относительно берега.",
        "explanation": "110 : 22 = 5 ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            110,
            22
          ]
        },
        "id": "word-river-18"
      }
    ]
  },
  {
    "id": "word-average-speed",
    "group": "word",
    "title": "Средняя скорость",
    "goal": "Делить весь путь на всё время; различать равные пути и равные времена.",
    "covers": [
      "path:practice-average-speed"
    ],
    "prerequisites": [
      "public:v5-formula-distance",
      "path:grade7-b-fraction-division-meaning"
    ],
    "trainers": [
      {
        "title": "Средняя скорость",
        "href": "/ege-baza/path/index.html#lesson=practice-average-speed",
        "kind": "По шагам",
        "instruction": "Запиши путь и время каждого участка; сложи столбцы.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Скорость, время и расстояние",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-formula-distance",
        "kind": "Другой способ",
        "instruction": "Проверь время отдельного участка формулой пути.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Первый час ехали 4 км/ч, второй час 6 км/ч. Найди среднюю скорость.",
        "answer": "5",
        "input": "number",
        "hint": "Найди весь путь и раздели на два часа.",
        "explanation": "(4 + 6) : 2 = 5 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              6
            ],
            2
          ]
        },
        "id": "word-average-speed-01"
      },
      {
        "prompt": "Проехали 30 км за 5 ч и 9 км за 1 ч. Найди среднюю скорость.",
        "answer": "13/2",
        "input": "number",
        "hint": "Сложи пути и времена отдельно.",
        "explanation": "(30 + 9) : (5 + 1) = 13/2 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              30,
              9
            ],
            [
              "add",
              5,
              1
            ]
          ]
        },
        "id": "word-average-speed-02"
      },
      {
        "prompt": "По 24 км проехали со скоростями 8 и 12 км/ч. Найди среднюю скорость всего пути.",
        "answer": "48/5",
        "input": "number",
        "hint": "Равные расстояния не означают равные времена.",
        "explanation": "Времена 3 ч и 2 ч; 48 : 5 = 48/5 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            48,
            [
              "add",
              [
                "div",
                24,
                8
              ],
              [
                "div",
                24,
                12
              ]
            ]
          ]
        },
        "id": "word-average-speed-03"
      },
      {
        "prompt": "За 2 ч прошли 10 км и ещё 1 ч отдыхали. Какова средняя скорость за всё время?",
        "answer": "10/3",
        "input": "choice",
        "hint": "Всё время включает остановку.",
        "explanation": "10 : 3 = 10/3 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            10,
            3
          ],
          "values": [
            "10/3",
            "5",
            "10"
          ]
        },
        "choices": [
          "10/3",
          "5",
          "10"
        ],
        "id": "word-average-speed-04"
      },
      {
        "prompt": "Весь путь 66 км, всё время 5 ч. Найди среднюю скорость.",
        "answer": "66/5",
        "input": "number",
        "hint": "В определении используется весь путь и всё время.",
        "explanation": "66 : 5 = 66/5 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            66,
            5
          ]
        },
        "id": "word-average-speed-05"
      },
      {
        "prompt": "Средняя скорость 7 км/ч. За 5 ч какой путь пройден?",
        "answer": "35",
        "input": "number",
        "hint": "Определение можно использовать в обратную сторону.",
        "explanation": "7 · 5 = 35 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7,
            5
          ]
        },
        "id": "word-average-speed-06"
      },
      {
        "prompt": "Первый час ехали 16 км/ч, второй час 24 км/ч. Найди среднюю скорость.",
        "answer": "20",
        "input": "number",
        "hint": "Найди весь путь и раздели на два часа.",
        "explanation": "(16 + 24) : 2 = 20 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              16,
              24
            ],
            2
          ]
        },
        "id": "word-average-speed-07"
      },
      {
        "prompt": "Проехали 54 км за 3 ч и 27 км за 1 ч. Найди среднюю скорость.",
        "answer": "81/4",
        "input": "number",
        "hint": "Сложи пути и времена отдельно.",
        "explanation": "(54 + 27) : (3 + 1) = 81/4 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              54,
              27
            ],
            [
              "add",
              3,
              1
            ]
          ]
        },
        "id": "word-average-speed-08"
      },
      {
        "prompt": "По 60 км проехали со скоростями 20 и 30 км/ч. Найди среднюю скорость всего пути.",
        "answer": "24",
        "input": "number",
        "hint": "Равные расстояния не означают равные времена.",
        "explanation": "Времена 3 ч и 2 ч; 120 : 5 = 24 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            120,
            [
              "add",
              [
                "div",
                60,
                20
              ],
              [
                "div",
                60,
                30
              ]
            ]
          ]
        },
        "id": "word-average-speed-09"
      },
      {
        "prompt": "За 2 ч прошли 22 км и ещё 1 ч отдыхали. Какова средняя скорость за всё время?",
        "answer": "22/3",
        "input": "choice",
        "hint": "Всё время включает остановку.",
        "explanation": "22 : 3 = 22/3 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            22,
            3
          ],
          "values": [
            "22/3",
            "11",
            "22"
          ]
        },
        "choices": [
          "22/3",
          "11",
          "22"
        ],
        "id": "word-average-speed-10"
      },
      {
        "prompt": "Весь путь 84 км, всё время 3 ч. Найди среднюю скорость.",
        "answer": "28",
        "input": "number",
        "hint": "В определении используется весь путь и всё время.",
        "explanation": "84 : 3 = 28 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            84,
            3
          ]
        },
        "id": "word-average-speed-11"
      },
      {
        "prompt": "Средняя скорость 13 км/ч. За 3 ч какой путь пройден?",
        "answer": "39",
        "input": "number",
        "hint": "Определение можно использовать в обратную сторону.",
        "explanation": "13 · 3 = 39 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            13,
            3
          ]
        },
        "id": "word-average-speed-12"
      },
      {
        "prompt": "Первый час ехали 28 км/ч, второй час 42 км/ч. Найди среднюю скорость.",
        "answer": "35",
        "input": "number",
        "hint": "Найди весь путь и раздели на два часа.",
        "explanation": "(28 + 42) : 2 = 35 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              28,
              42
            ],
            2
          ]
        },
        "id": "word-average-speed-13"
      },
      {
        "prompt": "Проехали 150 км за 5 ч и 45 км за 1 ч. Найди среднюю скорость.",
        "answer": "65/2",
        "input": "number",
        "hint": "Сложи пути и времена отдельно.",
        "explanation": "(150 + 45) : (5 + 1) = 65/2 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              150,
              45
            ],
            [
              "add",
              5,
              1
            ]
          ]
        },
        "id": "word-average-speed-14"
      },
      {
        "prompt": "По 96 км проехали со скоростями 32 и 48 км/ч. Найди среднюю скорость всего пути.",
        "answer": "192/5",
        "input": "number",
        "hint": "Равные расстояния не означают равные времена.",
        "explanation": "Времена 3 ч и 2 ч; 192 : 5 = 192/5 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            192,
            [
              "add",
              [
                "div",
                96,
                32
              ],
              [
                "div",
                96,
                48
              ]
            ]
          ]
        },
        "id": "word-average-speed-15"
      },
      {
        "prompt": "За 2 ч прошли 34 км и ещё 1 ч отдыхали. Какова средняя скорость за всё время?",
        "answer": "34/3",
        "input": "choice",
        "hint": "Всё время включает остановку.",
        "explanation": "34 : 3 = 34/3 км/ч.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            34,
            3
          ],
          "values": [
            "34/3",
            "17",
            "34"
          ]
        },
        "choices": [
          "34/3",
          "17",
          "34"
        ],
        "id": "word-average-speed-16"
      },
      {
        "prompt": "Весь путь 198 км, всё время 5 ч. Найди среднюю скорость.",
        "answer": "198/5",
        "input": "number",
        "hint": "В определении используется весь путь и всё время.",
        "explanation": "198 : 5 = 198/5 км/ч.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            198,
            5
          ]
        },
        "id": "word-average-speed-17"
      },
      {
        "prompt": "Средняя скорость 19 км/ч. За 5 ч какой путь пройден?",
        "answer": "95",
        "input": "number",
        "hint": "Определение можно использовать в обратную сторону.",
        "explanation": "19 · 5 = 95 км.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            19,
            5
          ]
        },
        "id": "word-average-speed-18"
      }
    ]
  },
  {
    "id": "word-remainder-whole",
    "group": "word",
    "title": "Целое по оставшейся части",
    "goal": "Отделять израсходованную долю от оставшейся и восстанавливать целое.",
    "covers": [
      "public:v6-whole-from-remainder",
      "public:part-whole"
    ],
    "prerequisites": [
      "path:pre7-fraction-part-whole"
    ],
    "trainers": [
      {
        "title": "Восстанавливаем целое по остатку",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-whole-from-remainder",
        "kind": "По шагам",
        "instruction": "Покажи оставшуюся после расхода долю.",
        "finish": "Разбери 3 задачи."
      },
      {
        "title": "Часть, целое и доля: разные вопросы",
        "href": "/trainers/part-whole-share-assignment.html",
        "kind": "Другой способ",
        "instruction": "Сравни вопросы: часть, целое и доля.",
        "finish": "Проверь 3 разных условия."
      }
    ],
    "questions": [
      {
        "prompt": "Прочитали 4/5 книги. Какая доля осталась?",
        "answer": "1/5",
        "input": "number",
        "hint": "Из целого вычти прочитанную долю.",
        "explanation": "1 − 4/5 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "4/5"
          ]
        },
        "id": "word-remainder-whole-01"
      },
      {
        "prompt": "Прочитали 5/6 книги, осталось 5 страниц. Сколько страниц в книге?",
        "answer": "30",
        "input": "number",
        "hint": "Остаток — одна из равных долей.",
        "explanation": "5 : (1/6) = 30.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            [
              "sub",
              1,
              "5/6"
            ]
          ]
        },
        "id": "word-remainder-whole-02"
      },
      {
        "prompt": "В книге 42 страниц. Прочитали 6/7. Сколько страниц осталось?",
        "answer": "6",
        "input": "number",
        "hint": "Найди оставшуюся долю целого.",
        "explanation": "42 · (1/7) = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            42,
            [
              "sub",
              1,
              "6/7"
            ]
          ]
        },
        "id": "word-remainder-whole-03"
      },
      {
        "prompt": "После расхода 2/3 запаса осталось 7 кг. Каков был весь запас?",
        "answer": "21",
        "input": "choice",
        "hint": "Остаток соответствует доле, а не целому.",
        "explanation": "7 · 3 = 21 кг.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            7,
            3
          ],
          "values": [
            "22",
            "9",
            "21"
          ]
        },
        "choices": [
          "22",
          "9",
          "21"
        ],
        "id": "word-remainder-whole-04"
      },
      {
        "prompt": "Из 32 м ткани использовали 3/4. Сколько метров использовали?",
        "answer": "24",
        "input": "number",
        "hint": "Найди одну долю, затем нужное число долей.",
        "explanation": "32 : 4 · 3 = 24 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              32,
              4
            ],
            3
          ]
        },
        "id": "word-remainder-whole-05"
      },
      {
        "prompt": "Осталось 9 деталей — 1/5 всех. Сколько уже использовали?",
        "answer": "36",
        "input": "number",
        "hint": "Восстанови целое, затем вычти оставшееся.",
        "explanation": "9 · 5 − 9 = 36.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              9,
              5
            ],
            9
          ]
        },
        "id": "word-remainder-whole-06"
      },
      {
        "prompt": "Прочитали 5/6 книги. Какая доля осталась?",
        "answer": "1/6",
        "input": "number",
        "hint": "Из целого вычти прочитанную долю.",
        "explanation": "1 − 5/6 = 1/6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "5/6"
          ]
        },
        "id": "word-remainder-whole-07"
      },
      {
        "prompt": "Прочитали 3/5 книги, осталось 12 страниц. Сколько страниц в книге?",
        "answer": "30",
        "input": "number",
        "hint": "Сначала найди оставшуюся долю. Число страниц в этой доле раздели на её величину.",
        "explanation": "Осталось 1 − 3/5 = 2/5 книги. Всего 12 : (2/5) = 30 страниц.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            [
              "sub",
              1,
              "3/5"
            ]
          ]
        },
        "id": "word-remainder-whole-08"
      },
      {
        "prompt": "В книге 36 страниц. Прочитали 2/3. Сколько страниц осталось?",
        "answer": "12",
        "input": "number",
        "hint": "Найди оставшуюся долю целого.",
        "explanation": "36 · (1/3) = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            36,
            [
              "sub",
              1,
              "2/3"
            ]
          ]
        },
        "id": "word-remainder-whole-09"
      },
      {
        "prompt": "После расхода 5/7 запаса осталось 8 кг. Каков был весь запас?",
        "answer": "28",
        "input": "choice",
        "hint": "Остаток соответствует доле, а не целому.",
        "explanation": "Осталось 2/7 запаса. Весь запас: 8 : (2/7) = 28 кг.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            8,
            [
              "sub",
              1,
              "5/7"
            ]
          ],
          "values": [
            "20",
            "56",
            "28"
          ]
        },
        "choices": [
          "20",
          "56",
          "28"
        ],
        "id": "word-remainder-whole-10"
      },
      {
        "prompt": "Из 70 м ткани использовали 4/5. Сколько метров использовали?",
        "answer": "56",
        "input": "number",
        "hint": "Найди одну долю, затем нужное число долей.",
        "explanation": "70 : 5 · 4 = 56 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              70,
              5
            ],
            4
          ]
        },
        "id": "word-remainder-whole-11"
      },
      {
        "prompt": "Осталось 16 деталей — 2/5 всех. Сколько деталей уже использовали?",
        "answer": "24",
        "input": "number",
        "hint": "Восстанови целое, затем вычти оставшееся.",
        "explanation": "Всего 16 : (2/5) = 40 деталей. Использовали 40 − 16 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              16,
              "2/5"
            ],
            16
          ]
        },
        "id": "word-remainder-whole-12"
      },
      {
        "prompt": "Прочитали 6/7 книги. Какая доля осталась?",
        "answer": "1/7",
        "input": "number",
        "hint": "Из целого вычти прочитанную долю.",
        "explanation": "1 − 6/7 = 1/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "6/7"
          ]
        },
        "id": "word-remainder-whole-13"
      },
      {
        "prompt": "Прочитали 4/7 книги, осталось 18 страниц. Сколько страниц в книге?",
        "answer": "42",
        "input": "number",
        "hint": "Сначала найди оставшуюся долю. Число страниц в этой доле раздели на её величину.",
        "explanation": "Осталось 1 − 4/7 = 3/7 книги. Всего 18 : (3/7) = 42 страницы.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            18,
            [
              "sub",
              1,
              "4/7"
            ]
          ]
        },
        "id": "word-remainder-whole-14"
      },
      {
        "prompt": "В книге 72 страниц. Прочитали 3/4. Сколько страниц осталось?",
        "answer": "18",
        "input": "number",
        "hint": "Найди оставшуюся долю целого.",
        "explanation": "72 · (1/4) = 18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            72,
            [
              "sub",
              1,
              "3/4"
            ]
          ]
        },
        "id": "word-remainder-whole-15"
      },
      {
        "prompt": "После расхода 3/8 запаса осталось 25 кг. Каков был весь запас?",
        "answer": "40",
        "input": "choice",
        "hint": "Остаток соответствует доле, а не целому.",
        "explanation": "Осталось 5/8 запаса. Весь запас: 25 : (5/8) = 40 кг.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            25,
            [
              "sub",
              1,
              "3/8"
            ]
          ],
          "values": [
            "200",
            "40",
            "15"
          ]
        },
        "choices": [
          "200",
          "40",
          "15"
        ],
        "id": "word-remainder-whole-16"
      },
      {
        "prompt": "Из 120 м ткани использовали 5/6. Сколько метров использовали?",
        "answer": "100",
        "input": "number",
        "hint": "Найди одну долю, затем нужное число долей.",
        "explanation": "120 : 6 · 5 = 100 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "div",
              120,
              6
            ],
            5
          ]
        },
        "id": "word-remainder-whole-17"
      },
      {
        "prompt": "Осталась 21 деталь — 3/8 всех. Сколько деталей уже использовали?",
        "answer": "35",
        "input": "number",
        "hint": "Восстанови целое, затем вычти оставшееся.",
        "explanation": "Всего 21 : (3/8) = 56 деталей. Использовали 56 − 21 = 35.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "div",
              21,
              "3/8"
            ],
            21
          ]
        },
        "id": "word-remainder-whole-18"
      }
    ]
  },
  {
    "id": "data-scales",
    "group": "data",
    "title": "Цена деления шкалы",
    "goal": "Считать промежутки между отметками и находить значение нужного штриха.",
    "covers": [
      "path:pre7-scale-reading"
    ],
    "prerequisites": [
      "path:pre7-natural-compare"
    ],
    "trainers": [
      {
        "title": "Шкала: деления и отметки",
        "href": "/ege-baza/path/index.html#lesson=pre7-scale-reading",
        "kind": "По шагам",
        "instruction": "Найди два подписанных штриха и посчитай промежутки.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Измеряем длину по линейке",
        "href": "/ege-baza/path/index.html#lesson=pre7-ruler-length",
        "kind": "Модель",
        "instruction": "Проверь цену деления при измерении от ненулевой отметки.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "Между отметками 20 и 36 четыре равных промежутка. Какова цена деления?",
        "answer": "4",
        "input": "number",
        "hint": "Считай промежутки между штрихами.",
        "explanation": "(36 − 20) : 4 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              36,
              20
            ],
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Левая отметка",
            "Правая отметка",
            "Промежутков"
          ],
          "rows": [
            [
              20,
              36,
              4
            ]
          ]
        },
        "id": "data-scales-01"
      },
      {
        "prompt": "На шкале после 30 каждый следующий штрих увеличивает число на 5. Какое число у третьего штриха справа?",
        "answer": "45",
        "input": "number",
        "hint": "От начальной отметки нужно сделать три шага.",
        "explanation": "30 + 3 · 5 = 45.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            30,
            [
              "mul",
              3,
              5
            ]
          ]
        },
        "id": "data-scales-02"
      },
      {
        "prompt": "Цена деления 2. На сколько отличаются отметки через 7 промежутков?",
        "answer": "14",
        "input": "number",
        "hint": "Каждый промежуток добавляет одинаковую величину.",
        "explanation": "7 · 2 = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7,
            2
          ]
        },
        "id": "data-scales-03"
      },
      {
        "prompt": "На шкале 50 и 62, между ними 4 промежутка. Какая цена деления верна?",
        "answer": "3",
        "input": "choice",
        "hint": "Число штрихов на единицу больше числа промежутков.",
        "explanation": "Разность 12 делим на 4: 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              62,
              50
            ],
            4
          ],
          "values": [
            "4",
            "3",
            "12"
          ]
        },
        "choices": [
          "4",
          "3",
          "12"
        ],
        "id": "data-scales-04"
      },
      {
        "prompt": "От отметки 76 отступили на 2 деления влево. Цена деления 4. Какое число?",
        "answer": "68",
        "input": "number",
        "hint": "Движение влево уменьшает число.",
        "explanation": "76 − 2 · 4 = 68.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            76,
            [
              "mul",
              2,
              4
            ]
          ]
        },
        "id": "data-scales-05"
      },
      {
        "prompt": "На линейке штрихи от 70 до 100 разделены на 6 равных промежутков. Какова цена деления?",
        "answer": "5",
        "input": "number",
        "hint": "Нужна величина одного промежутка.",
        "explanation": "30 : 6 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              100,
              70
            ],
            6
          ]
        },
        "id": "data-scales-06"
      },
      {
        "prompt": "Между отметками 80 и 88 четыре равных промежутка. Какова цена деления?",
        "answer": "2",
        "input": "number",
        "hint": "Считай промежутки между штрихами.",
        "explanation": "(88 − 80) : 4 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              88,
              80
            ],
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Левая отметка",
            "Правая отметка",
            "Промежутков"
          ],
          "rows": [
            [
              80,
              88,
              4
            ]
          ]
        },
        "id": "data-scales-07"
      },
      {
        "prompt": "На шкале после 90 каждый следующий штрих увеличивает число на 3. Какое число у третьего штриха справа?",
        "answer": "99",
        "input": "number",
        "hint": "От начальной отметки нужно сделать три шага.",
        "explanation": "90 + 3 · 3 = 99.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            90,
            [
              "mul",
              3,
              3
            ]
          ]
        },
        "id": "data-scales-08"
      },
      {
        "prompt": "Цена деления 4. На сколько отличаются отметки через 13 промежутков?",
        "answer": "52",
        "input": "number",
        "hint": "Каждый промежуток добавляет одинаковую величину.",
        "explanation": "13 · 4 = 52.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            13,
            4
          ]
        },
        "id": "data-scales-09"
      },
      {
        "prompt": "На шкале 110 и 130, между ними 4 промежутка. Какая цена деления верна?",
        "answer": "5",
        "input": "choice",
        "hint": "Число штрихов на единицу больше числа промежутков.",
        "explanation": "Разность 20 делим на 4: 5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              130,
              110
            ],
            4
          ],
          "values": [
            "6",
            "5",
            "20"
          ]
        },
        "choices": [
          "6",
          "5",
          "20"
        ],
        "id": "data-scales-10"
      },
      {
        "prompt": "От отметки 128 отступили на 2 деления влево. Цена деления 2. Какое число?",
        "answer": "124",
        "input": "number",
        "hint": "Движение влево уменьшает число.",
        "explanation": "128 − 2 · 2 = 124.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            128,
            [
              "mul",
              2,
              2
            ]
          ]
        },
        "id": "data-scales-11"
      },
      {
        "prompt": "На линейке штрихи от 130 до 148 разделены на 6 равных промежутков. Какова цена деления?",
        "answer": "3",
        "input": "number",
        "hint": "Нужна величина одного промежутка.",
        "explanation": "18 : 6 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              148,
              130
            ],
            6
          ]
        },
        "id": "data-scales-12"
      },
      {
        "prompt": "Между отметками 140 и 156 четыре равных промежутка. Какова цена деления?",
        "answer": "4",
        "input": "number",
        "hint": "Считай промежутки между штрихами.",
        "explanation": "(156 − 140) : 4 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              156,
              140
            ],
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Левая отметка",
            "Правая отметка",
            "Промежутков"
          ],
          "rows": [
            [
              140,
              156,
              4
            ]
          ]
        },
        "id": "data-scales-13"
      },
      {
        "prompt": "На шкале после 150 каждый следующий штрих увеличивает число на 5. Какое число у третьего штриха справа?",
        "answer": "165",
        "input": "number",
        "hint": "От начальной отметки нужно сделать три шага.",
        "explanation": "150 + 3 · 5 = 165.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            150,
            [
              "mul",
              3,
              5
            ]
          ]
        },
        "id": "data-scales-14"
      },
      {
        "prompt": "Цена деления 2. На сколько отличаются отметки через 19 промежутков?",
        "answer": "38",
        "input": "number",
        "hint": "Каждый промежуток добавляет одинаковую величину.",
        "explanation": "19 · 2 = 38.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            19,
            2
          ]
        },
        "id": "data-scales-15"
      },
      {
        "prompt": "На шкале 170 и 182, между ними 4 промежутка. Какая цена деления верна?",
        "answer": "3",
        "input": "choice",
        "hint": "Число штрихов на единицу больше числа промежутков.",
        "explanation": "Разность 12 делим на 4: 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "sub",
              182,
              170
            ],
            4
          ],
          "values": [
            "4",
            "3",
            "12"
          ]
        },
        "choices": [
          "4",
          "3",
          "12"
        ],
        "id": "data-scales-16"
      },
      {
        "prompt": "От отметки 196 отступили на 2 деления влево. Цена деления 4. Какое число?",
        "answer": "188",
        "input": "number",
        "hint": "Движение влево уменьшает число.",
        "explanation": "196 − 2 · 4 = 188.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            196,
            [
              "mul",
              2,
              4
            ]
          ]
        },
        "id": "data-scales-17"
      },
      {
        "prompt": "На линейке штрихи от 190 до 220 разделены на 6 равных промежутков. Какова цена деления?",
        "answer": "5",
        "input": "number",
        "hint": "Нужна величина одного промежутка.",
        "explanation": "30 : 6 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              220,
              190
            ],
            6
          ]
        },
        "id": "data-scales-18"
      }
    ]
  },
  {
    "id": "data-tables",
    "group": "data",
    "title": "Читаем и сравниваем таблицу",
    "goal": "Находить нужную ячейку, максимум, минимум и место результата.",
    "covers": [
      "path:data",
      "path:practice-chart",
      "path:practice-ranking"
    ],
    "prerequisites": [
      "path:pre7-natural-compare"
    ],
    "trainers": [
      {
        "title": "Читаем таблицу и диаграмму",
        "href": "/ege-baza/path/index.html#lesson=data",
        "kind": "По шагам",
        "instruction": "Выбери нужные строку и столбец; прочитай единицы.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Максимум и минимум на диаграмме",
        "href": "/ege-baza/path/index.html#lesson=practice-chart",
        "kind": "Модель",
        "instruction": "Сравни высоты столбцов, затем проверь разность значений.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "Сколько баллов у группы В в таблице?",
        "answer": "3",
        "input": "number",
        "hint": "Найди строку нужной группы и столбец баллов.",
        "explanation": "В строке В указано 3.",
        "oracle": {
          "kind": "table-stat",
          "operation": "cell",
          "values": [
            5,
            10,
            3,
            7
          ],
          "index": 2
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              5
            ],
            [
              "Б",
              10
            ],
            [
              "В",
              3
            ],
            [
              "Г",
              7
            ]
          ]
        },
        "id": "data-tables-01"
      },
      {
        "prompt": "Каков наибольший результат в таблице?",
        "answer": "11",
        "input": "number",
        "hint": "Сравни все четыре числа.",
        "explanation": "Наибольшее значение — 11.",
        "oracle": {
          "kind": "table-stat",
          "operation": "max",
          "values": [
            6,
            11,
            4,
            8
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              6
            ],
            [
              "Б",
              11
            ],
            [
              "В",
              4
            ],
            [
              "Г",
              8
            ]
          ]
        },
        "id": "data-tables-02"
      },
      {
        "prompt": "Каков наименьший результат в таблице?",
        "answer": "5",
        "input": "number",
        "hint": "Сравни все четыре числа.",
        "explanation": "Наименьшее значение — 5.",
        "oracle": {
          "kind": "table-stat",
          "operation": "min",
          "values": [
            7,
            12,
            5,
            9
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              7
            ],
            [
              "Б",
              12
            ],
            [
              "В",
              5
            ],
            [
              "Г",
              9
            ]
          ]
        },
        "id": "data-tables-03"
      },
      {
        "prompt": "На сколько баллов результат Б больше результата А?",
        "answer": "5",
        "input": "choice",
        "hint": "Сравнение «на сколько» требует вычитания.",
        "explanation": "13 − 8 = 5.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            13,
            8
          ],
          "values": [
            "5",
            "21",
            "13"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              8
            ],
            [
              "Б",
              13
            ],
            [
              "В",
              6
            ],
            [
              "Г",
              10
            ]
          ]
        },
        "choices": [
          "5",
          "21",
          "13"
        ],
        "id": "data-tables-04"
      },
      {
        "prompt": "Какое место у группы А, если больше баллов означает более высокое место?",
        "answer": "3",
        "input": "number",
        "hint": "Посчитай группы с результатом строго выше.",
        "explanation": "Б и Г выше группы А: перед ней две группы, поэтому место 3.",
        "oracle": {
          "kind": "table-stat",
          "operation": "rank",
          "values": [
            9,
            14,
            7,
            11
          ],
          "index": 0
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              9
            ],
            [
              "Б",
              14
            ],
            [
              "В",
              7
            ],
            [
              "Г",
              11
            ]
          ]
        },
        "id": "data-tables-05"
      },
      {
        "prompt": "Сколько баллов суммарно у групп В и Г?",
        "answer": "20",
        "input": "number",
        "hint": "Возьми только две указанные строки.",
        "explanation": "8 + 12 = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            8,
            12
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              10
            ],
            [
              "Б",
              15
            ],
            [
              "В",
              8
            ],
            [
              "Г",
              12
            ]
          ]
        },
        "id": "data-tables-06"
      },
      {
        "prompt": "Сколько баллов у группы В в таблице?",
        "answer": "16",
        "input": "number",
        "hint": "Найди строку нужной группы и столбец баллов.",
        "explanation": "В строке В указано 16.",
        "oracle": {
          "kind": "table-stat",
          "operation": "cell",
          "values": [
            12,
            7,
            16,
            9
          ],
          "index": 2
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              12
            ],
            [
              "Б",
              7
            ],
            [
              "В",
              16
            ],
            [
              "Г",
              9
            ]
          ]
        },
        "id": "data-tables-07"
      },
      {
        "prompt": "Каков наибольший результат в таблице?",
        "answer": "17",
        "input": "number",
        "hint": "Сравни все четыре числа.",
        "explanation": "Наибольшее значение — 17.",
        "oracle": {
          "kind": "table-stat",
          "operation": "max",
          "values": [
            14,
            8,
            10,
            17
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              14
            ],
            [
              "Б",
              8
            ],
            [
              "В",
              10
            ],
            [
              "Г",
              17
            ]
          ]
        },
        "id": "data-tables-08"
      },
      {
        "prompt": "Каков наименьший результат в таблице?",
        "answer": "13",
        "input": "number",
        "hint": "Сравни все четыре числа.",
        "explanation": "Наименьшее значение — 13.",
        "oracle": {
          "kind": "table-stat",
          "operation": "min",
          "values": [
            13,
            18,
            20,
            15
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              13
            ],
            [
              "Б",
              18
            ],
            [
              "В",
              20
            ],
            [
              "Г",
              15
            ]
          ]
        },
        "id": "data-tables-09"
      },
      {
        "prompt": "На сколько баллов результат А больше результата Б?",
        "answer": "7",
        "input": "choice",
        "hint": "Сравнение «на сколько» требует вычитания.",
        "explanation": "19 − 12 = 7.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            19,
            12
          ],
          "values": [
            "31",
            "7",
            "19"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              19
            ],
            [
              "Б",
              12
            ],
            [
              "В",
              15
            ],
            [
              "Г",
              9
            ]
          ]
        },
        "choices": [
          "31",
          "7",
          "19"
        ],
        "id": "data-tables-10"
      },
      {
        "prompt": "Какое место у группы А, если больше баллов означает более высокое место?",
        "answer": "1",
        "input": "number",
        "hint": "Посчитай группы с результатом строго выше.",
        "explanation": "Выше результата А нет ни одного результата: группа А занимает место 1.",
        "oracle": {
          "kind": "table-stat",
          "operation": "rank",
          "values": [
            23,
            15,
            13,
            17
          ],
          "index": 0
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              23
            ],
            [
              "Б",
              15
            ],
            [
              "В",
              13
            ],
            [
              "Г",
              17
            ]
          ]
        },
        "id": "data-tables-11"
      },
      {
        "prompt": "Сколько баллов суммарно у групп В и Г?",
        "answer": "29",
        "input": "number",
        "hint": "Возьми только две указанные строки.",
        "explanation": "18 + 11 = 29.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            18,
            11
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              16
            ],
            [
              "Б",
              21
            ],
            [
              "В",
              18
            ],
            [
              "Г",
              11
            ]
          ]
        },
        "id": "data-tables-12"
      },
      {
        "prompt": "Сколько баллов у группы В в таблице?",
        "answer": "17",
        "input": "number",
        "hint": "Найди строку нужной группы и столбец баллов.",
        "explanation": "В строке В указано 17.",
        "oracle": {
          "kind": "table-stat",
          "operation": "cell",
          "values": [
            19,
            22,
            17,
            25
          ],
          "index": 2
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              19
            ],
            [
              "Б",
              22
            ],
            [
              "В",
              17
            ],
            [
              "Г",
              25
            ]
          ]
        },
        "id": "data-tables-13"
      },
      {
        "prompt": "Каков наибольший результат в таблице?",
        "answer": "23",
        "input": "number",
        "hint": "Сравни все четыре числа.",
        "explanation": "Наибольшее значение — 23.",
        "oracle": {
          "kind": "table-stat",
          "operation": "max",
          "values": [
            23,
            18,
            16,
            20
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              23
            ],
            [
              "Б",
              18
            ],
            [
              "В",
              16
            ],
            [
              "Г",
              20
            ]
          ]
        },
        "id": "data-tables-14"
      },
      {
        "prompt": "Каков наименьший результат в таблице?",
        "answer": "17",
        "input": "number",
        "hint": "Сравни все четыре числа.",
        "explanation": "Наименьшее значение — 17.",
        "oracle": {
          "kind": "table-stat",
          "operation": "min",
          "values": [
            19,
            24,
            21,
            17
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              19
            ],
            [
              "Б",
              24
            ],
            [
              "В",
              21
            ],
            [
              "Г",
              17
            ]
          ]
        },
        "id": "data-tables-15"
      },
      {
        "prompt": "На сколько баллов результат В больше результата А?",
        "answer": "9",
        "input": "choice",
        "hint": "Сравнение «на сколько» требует вычитания.",
        "explanation": "29 − 20 = 9.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            29,
            20
          ],
          "values": [
            "29",
            "49",
            "9"
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              20
            ],
            [
              "Б",
              18
            ],
            [
              "В",
              29
            ],
            [
              "Г",
              22
            ]
          ]
        },
        "choices": [
          "29",
          "49",
          "9"
        ],
        "id": "data-tables-16"
      },
      {
        "prompt": "Какое место у группы А, если больше баллов означает более высокое место?",
        "answer": "4",
        "input": "number",
        "hint": "Посчитай группы с результатом строго выше.",
        "explanation": "Б, В и Г набрали больше баллов, чем А. Перед А три группы, поэтому место 4.",
        "oracle": {
          "kind": "table-stat",
          "operation": "rank",
          "values": [
            17,
            26,
            19,
            23
          ],
          "index": 0
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              17
            ],
            [
              "Б",
              26
            ],
            [
              "В",
              19
            ],
            [
              "Г",
              23
            ]
          ]
        },
        "id": "data-tables-17"
      },
      {
        "prompt": "Сколько баллов суммарно у групп В и Г?",
        "answer": "51",
        "input": "number",
        "hint": "Возьми только две указанные строки.",
        "explanation": "27 + 24 = 51.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            27,
            24
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Группа",
            "Баллы"
          ],
          "rows": [
            [
              "А",
              22
            ],
            [
              "Б",
              20
            ],
            [
              "В",
              27
            ],
            [
              "Г",
              24
            ]
          ]
        },
        "id": "data-tables-18"
      }
    ]
  },
  {
    "id": "data-time-interval",
    "group": "data",
    "title": "Данные за промежуток",
    "goal": "Выбирать только указанные дни или участки и учитывать обе границы промежутка.",
    "covers": [
      "path:practice-interval-data"
    ],
    "prerequisites": [
      "path:data"
    ],
    "trainers": [
      {
        "title": "Данные за нужный промежуток",
        "href": "/ege-baza/path/index.html#lesson=practice-interval-data",
        "kind": "По шагам",
        "instruction": "Отметь начало и конец нужного промежутка.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Максимум и минимум на диаграмме",
        "href": "/ege-baza/path/index.html#lesson=practice-chart",
        "kind": "Модель",
        "instruction": "Сложи выбранные столбцы и сравни две суммы.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "По диаграмме найди сумму книг за вторник и среду.",
        "answer": "12",
        "input": "number",
        "hint": "Выбери два указанных столбца.",
        "explanation": "5 + 7 = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            5,
            7
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            3,
            5,
            7,
            4,
            6
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-01"
      },
      {
        "prompt": "Сколько книг взяли со среды по пятницу включительно?",
        "answer": "20",
        "input": "number",
        "hint": "Включи оба дня на границах промежутка.",
        "explanation": "8 + 5 + 7 = 20.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            8,
            5,
            7
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            4,
            6,
            8,
            5,
            7
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-02"
      },
      {
        "prompt": "На сколько больше книг взяли в среду, чем в понедельник?",
        "answer": "4",
        "input": "number",
        "hint": "Нужна разность двух столбцов.",
        "explanation": "9 − 5 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            9,
            5
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            5,
            7,
            9,
            6,
            8
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-03"
      },
      {
        "prompt": "Сколько книг взяли только в четверг и пятницу?",
        "answer": "16",
        "input": "choice",
        "hint": "Не включай в сумму среду.",
        "explanation": "7 + 9 = 16.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            7,
            9
          ],
          "values": [
            "26",
            "9",
            "16"
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            6,
            8,
            10,
            7,
            9
          ],
          "unit": "книг"
        },
        "choices": [
          "26",
          "9",
          "16"
        ],
        "id": "data-time-interval-04"
      },
      {
        "prompt": "Сколько книг взяли за всю неделю с понедельника по пятницу?",
        "answer": "45",
        "input": "number",
        "hint": "Включи все пять столбцов.",
        "explanation": "7 + 9 + 11 + 8 + 10 = 45.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            7,
            9,
            11,
            8,
            10
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            7,
            9,
            11,
            8,
            10
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-05"
      },
      {
        "prompt": "На сколько сумма за вторник и среду больше суммы за четверг и пятницу?",
        "answer": "2",
        "input": "number",
        "hint": "Сначала найди две суммы, затем их разность.",
        "explanation": "22 − 20 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              10,
              12
            ],
            [
              "add",
              9,
              11
            ]
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            8,
            10,
            12,
            9,
            11
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-06"
      },
      {
        "prompt": "По диаграмме найди сумму книг за вторник и среду.",
        "answer": "24",
        "input": "number",
        "hint": "Выбери два указанных столбца.",
        "explanation": "11 + 13 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            11,
            13
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            9,
            11,
            13,
            10,
            12
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-07"
      },
      {
        "prompt": "Сколько книг взяли со среды по пятницу включительно?",
        "answer": "38",
        "input": "number",
        "hint": "Включи оба дня на границах промежутка.",
        "explanation": "14 + 11 + 13 = 38.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            14,
            11,
            13
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            10,
            12,
            14,
            11,
            13
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-08"
      },
      {
        "prompt": "На сколько больше книг взяли в среду, чем в понедельник?",
        "answer": "4",
        "input": "number",
        "hint": "Нужна разность двух столбцов.",
        "explanation": "15 − 11 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            15,
            11
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            11,
            13,
            15,
            12,
            14
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-09"
      },
      {
        "prompt": "Сколько книг взяли только в четверг и пятницу?",
        "answer": "28",
        "input": "choice",
        "hint": "Не включай в сумму среду.",
        "explanation": "13 + 15 = 28.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            13,
            15
          ],
          "values": [
            "44",
            "15",
            "28"
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            12,
            14,
            16,
            13,
            15
          ],
          "unit": "книг"
        },
        "choices": [
          "44",
          "15",
          "28"
        ],
        "id": "data-time-interval-10"
      },
      {
        "prompt": "Сколько книг взяли за всю неделю с понедельника по пятницу?",
        "answer": "75",
        "input": "number",
        "hint": "Включи все пять столбцов.",
        "explanation": "13 + 15 + 17 + 14 + 16 = 75.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            13,
            15,
            17,
            14,
            16
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            13,
            15,
            17,
            14,
            16
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-11"
      },
      {
        "prompt": "На сколько сумма за вторник и среду больше суммы за четверг и пятницу?",
        "answer": "2",
        "input": "number",
        "hint": "Сначала найди две суммы, затем их разность.",
        "explanation": "34 − 32 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              16,
              18
            ],
            [
              "add",
              15,
              17
            ]
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            14,
            16,
            18,
            15,
            17
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-12"
      },
      {
        "prompt": "По диаграмме найди сумму книг за вторник и среду.",
        "answer": "36",
        "input": "number",
        "hint": "Выбери два указанных столбца.",
        "explanation": "17 + 19 = 36.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            17,
            19
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            15,
            17,
            19,
            16,
            18
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-13"
      },
      {
        "prompt": "Сколько книг взяли со среды по пятницу включительно?",
        "answer": "56",
        "input": "number",
        "hint": "Включи оба дня на границах промежутка.",
        "explanation": "20 + 17 + 19 = 56.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            20,
            17,
            19
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            16,
            18,
            20,
            17,
            19
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-14"
      },
      {
        "prompt": "На сколько больше книг взяли в среду, чем в понедельник?",
        "answer": "4",
        "input": "number",
        "hint": "Нужна разность двух столбцов.",
        "explanation": "21 − 17 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            21,
            17
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            17,
            19,
            21,
            18,
            20
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-15"
      },
      {
        "prompt": "Сколько книг взяли только в четверг и пятницу?",
        "answer": "40",
        "input": "choice",
        "hint": "Не включай в сумму среду.",
        "explanation": "19 + 21 = 40.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            19,
            21
          ],
          "values": [
            "62",
            "21",
            "40"
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            18,
            20,
            22,
            19,
            21
          ],
          "unit": "книг"
        },
        "choices": [
          "62",
          "21",
          "40"
        ],
        "id": "data-time-interval-16"
      },
      {
        "prompt": "Сколько книг взяли за всю неделю с понедельника по пятницу?",
        "answer": "105",
        "input": "number",
        "hint": "Включи все пять столбцов.",
        "explanation": "19 + 21 + 23 + 20 + 22 = 105.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            19,
            21,
            23,
            20,
            22
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            19,
            21,
            23,
            20,
            22
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-17"
      },
      {
        "prompt": "На сколько сумма за вторник и среду больше суммы за четверг и пятницу?",
        "answer": "2",
        "input": "number",
        "hint": "Сначала найди две суммы, затем их разность.",
        "explanation": "46 − 44 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              22,
              24
            ],
            [
              "add",
              21,
              23
            ]
          ]
        },
        "visual": {
          "type": "bars",
          "labels": [
            "Пн",
            "Вт",
            "Ср",
            "Чт",
            "Пт"
          ],
          "values": [
            20,
            22,
            24,
            21,
            23
          ],
          "unit": "книг"
        },
        "id": "data-time-interval-18"
      }
    ]
  },
  {
    "id": "data-probability",
    "group": "data",
    "title": "Вероятность: подходящие и все",
    "goal": "Считать подходящие равновозможные исходы и выбирать правильное целое.",
    "covers": [
      "path:probability"
    ],
    "prerequisites": [
      "path:pre7-fraction-part-whole"
    ],
    "trainers": [
      {
        "title": "Доля подходящих исходов",
        "href": "/ege-baza/path/index.html#lesson=probability",
        "kind": "По шагам",
        "instruction": "Сосчитай подходящие исходы и все возможные отдельно.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Часть и целое: наглядная модель процентов",
        "href": "/trainers/percent-part-whole-trainer.html",
        "kind": "Модель",
        "instruction": "Покажи долю подходящих объектов от целого набора.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "В мешке 3 красных и 4 синих шаров. Один выбирают случайно; все шары равновозможны. Какова вероятность красного?",
        "answer": "3/7",
        "input": "number",
        "hint": "Раздели число подходящих шаров на число всех.",
        "explanation": "3/(3 + 4) = 3/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            7
          ]
        },
        "id": "data-probability-01"
      },
      {
        "prompt": "В мешке 4 красных и 5 синих равновозможных шаров. Какова вероятность синего?",
        "answer": "5/9",
        "input": "number",
        "hint": "Подходящими считаются только синие; в знаменателе все.",
        "explanation": "5/9 = 5/9.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            9
          ]
        },
        "id": "data-probability-02"
      },
      {
        "prompt": "В лотерее 7 равновозможных билетов, 5 выигрышных. Какова вероятность проигрыша?",
        "answer": "2/7",
        "input": "number",
        "hint": "Сначала посчитай невыигрышные билеты.",
        "explanation": "(7 − 5)/7 = 2/7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              7,
              5
            ],
            7
          ]
        },
        "id": "data-probability-03"
      },
      {
        "prompt": "Случайно выбирают одно из 9 чисел от 1 до 9. Вероятность выбрать 1 равна чему?",
        "answer": "1/9",
        "input": "choice",
        "hint": "Подходит ровно один исход.",
        "explanation": "1/9.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            1,
            9
          ],
          "values": [
            "1",
            "1/9",
            "9"
          ]
        },
        "choices": [
          "1",
          "1/9",
          "9"
        ],
        "id": "data-probability-04"
      },
      {
        "prompt": "Из 11 равновозможных карточек 4 отмечены звездой. Сколько карточек без звезды?",
        "answer": "7",
        "input": "number",
        "hint": "Это подготовка к подсчёту противоположного события.",
        "explanation": "11 − 4 = 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            11,
            4
          ]
        },
        "id": "data-probability-05"
      },
      {
        "prompt": "Вероятность события 8/13. Какова вероятность противоположного события?",
        "answer": "5/13",
        "input": "number",
        "hint": "Сумма вероятностей противоположных событий равна единице.",
        "explanation": "1 − 8/13 = 5/13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "8/13"
          ]
        },
        "id": "data-probability-06"
      },
      {
        "prompt": "В мешке 9 красных и 2 синих шаров. Один выбирают случайно; все шары равновозможны. Какова вероятность красного?",
        "answer": "9/11",
        "input": "number",
        "hint": "Раздели число подходящих шаров на число всех.",
        "explanation": "9/(9 + 2) = 9/11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            9,
            11
          ]
        },
        "id": "data-probability-07"
      },
      {
        "prompt": "В мешке 10 красных и 3 синих равновозможных шаров. Какова вероятность синего?",
        "answer": "3/13",
        "input": "number",
        "hint": "Подходящими считаются только синие; в знаменателе все.",
        "explanation": "3/13 = 3/13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            3,
            13
          ]
        },
        "id": "data-probability-08"
      },
      {
        "prompt": "В лотерее 15 равновозможных билетов, 11 выигрышных. Какова вероятность проигрыша?",
        "answer": "4/15",
        "input": "number",
        "hint": "Сначала посчитай невыигрышные билеты.",
        "explanation": "(15 − 11)/15 = 4/15.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              15,
              11
            ],
            15
          ]
        },
        "id": "data-probability-09"
      },
      {
        "prompt": "Случайно выбирают одно из 17 чисел от 1 до 17. Вероятность выбрать 1 равна чему?",
        "answer": "1/17",
        "input": "choice",
        "hint": "Подходит ровно один исход.",
        "explanation": "1/17.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            1,
            17
          ],
          "values": [
            "1",
            "1/17",
            "17"
          ]
        },
        "choices": [
          "1",
          "1/17",
          "17"
        ],
        "id": "data-probability-10"
      },
      {
        "prompt": "Из 15 равновозможных карточек 2 отмечены звездой. Сколько карточек без звезды?",
        "answer": "13",
        "input": "number",
        "hint": "Это подготовка к подсчёту противоположного события.",
        "explanation": "15 − 2 = 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            15,
            2
          ]
        },
        "id": "data-probability-11"
      },
      {
        "prompt": "Вероятность события 14/17. Какова вероятность противоположного события?",
        "answer": "3/17",
        "input": "number",
        "hint": "Сумма вероятностей противоположных событий равна единице.",
        "explanation": "1 − 14/17 = 3/17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "14/17"
          ]
        },
        "id": "data-probability-12"
      },
      {
        "prompt": "В мешке 15 красных и 4 синих шаров. Один выбирают случайно; все шары равновозможны. Какова вероятность красного?",
        "answer": "15/19",
        "input": "number",
        "hint": "Раздели число подходящих шаров на число всех.",
        "explanation": "15/(15 + 4) = 15/19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            15,
            19
          ]
        },
        "id": "data-probability-13"
      },
      {
        "prompt": "В мешке 16 красных и 5 синих равновозможных шаров. Какова вероятность синего?",
        "answer": "5/21",
        "input": "number",
        "hint": "Подходящими считаются только синие; в знаменателе все.",
        "explanation": "5/21 = 5/21.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            5,
            21
          ]
        },
        "id": "data-probability-14"
      },
      {
        "prompt": "В лотерее 19 равновозможных билетов, 17 выигрышных. Какова вероятность проигрыша?",
        "answer": "2/19",
        "input": "number",
        "hint": "Сначала посчитай невыигрышные билеты.",
        "explanation": "(19 − 17)/19 = 2/19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              19,
              17
            ],
            19
          ]
        },
        "id": "data-probability-15"
      },
      {
        "prompt": "Случайно выбирают одно из 21 чисел от 1 до 21. Вероятность выбрать 1 равна чему?",
        "answer": "1/21",
        "input": "choice",
        "hint": "Подходит ровно один исход.",
        "explanation": "1/21.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            1,
            21
          ],
          "values": [
            "1",
            "1/21",
            "21"
          ]
        },
        "choices": [
          "1",
          "1/21",
          "21"
        ],
        "id": "data-probability-16"
      },
      {
        "prompt": "Из 23 равновозможных карточек 4 отмечены звездой. Сколько карточек без звезды?",
        "answer": "19",
        "input": "number",
        "hint": "Это подготовка к подсчёту противоположного события.",
        "explanation": "23 − 4 = 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            23,
            4
          ]
        },
        "id": "data-probability-17"
      },
      {
        "prompt": "Вероятность события 4/5. Какова вероятность противоположного события?",
        "answer": "1/5",
        "input": "number",
        "hint": "Сумма вероятностей противоположных событий равна единице.",
        "explanation": "1 − 4/5 = 1/5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            "4/5"
          ]
        },
        "id": "data-probability-18"
      }
    ]
  },
  {
    "id": "data-coordinates",
    "group": "data",
    "title": "Точка по двум координатам",
    "goal": "Различать горизонтальную и вертикальную координаты и изменение каждой из них.",
    "covers": [
      "public:v6-coordinates-place"
    ],
    "prerequisites": [
      "oge-basics:negative-number-line"
    ],
    "trainers": [
      {
        "title": "Ставим точку по координатам",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-coordinates-place",
        "kind": "По шагам",
        "instruction": "Сначала пройди по оси x, затем по оси y.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Читаем значение по графику",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-graph-read",
        "kind": "Модель",
        "instruction": "Считай координаты готовых точек в обратном порядке действий.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "Прочитай абсциссу x точки A на рисунке.",
        "answer": "-1",
        "input": "number",
        "hint": "Абсциссу читают по горизонтальной оси.",
        "explanation": "Для точки A x = −1.",
        "oracle": {
          "kind": "expression",
          "expr": -1
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -1,
              "y": 1,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-01"
      },
      {
        "prompt": "Прочитай ординату y точки A на рисунке.",
        "answer": "3",
        "input": "number",
        "hint": "Ординату читают по вертикальной оси.",
        "explanation": "Для точки A y = 3.",
        "oracle": {
          "kind": "expression",
          "expr": 3
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 0,
              "y": 3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-02"
      },
      {
        "prompt": "Точку A(1; −2) передвинули на 2 единицы вправо. Какой стал x?",
        "answer": "3",
        "input": "number",
        "hint": "Горизонтальное движение меняет только x.",
        "explanation": "1 + 2 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 1,
              "y": -2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-03"
      },
      {
        "prompt": "Точку A(2; 0) передвинули на 3 единицы вверх. Какой стал y?",
        "answer": "3",
        "input": "choice",
        "hint": "Вертикальное движение меняет только y.",
        "explanation": "0 + 3 = 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            0,
            3
          ],
          "values": [
            "3",
            "-3",
            "2"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 2,
              "y": 0,
              "label": "A"
            }
          ],
          "segments": []
        },
        "choices": [
          "3",
          "-3",
          "2"
        ],
        "id": "data-coordinates-04"
      },
      {
        "prompt": "Точка A(3; 2). Через неё провели вертикальную прямую. Чему равна координата y точки пересечения этой прямой с осью x?",
        "answer": "0",
        "input": "number",
        "hint": "Все точки горизонтальной оси имеют нулевую ординату.",
        "explanation": "На оси x координата y равна 0.",
        "oracle": {
          "kind": "expression",
          "expr": 0
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 3,
              "y": 2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-05"
      },
      {
        "prompt": "Точка A(−3; −3) перенесена горизонтально на ось y. Чему равна новая координата x?",
        "answer": "0",
        "input": "number",
        "hint": "Все точки вертикальной оси имеют нулевую абсциссу.",
        "explanation": "На оси y координата x равна 0.",
        "oracle": {
          "kind": "expression",
          "expr": 0
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -3,
              "y": -3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-06"
      },
      {
        "prompt": "Прочитай абсциссу x точки A на рисунке.",
        "answer": "-2",
        "input": "number",
        "hint": "Абсциссу читают по горизонтальной оси.",
        "explanation": "Для точки A x = −2.",
        "oracle": {
          "kind": "expression",
          "expr": -2
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -2,
              "y": -1,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-07"
      },
      {
        "prompt": "Прочитай ординату y точки A на рисунке.",
        "answer": "1",
        "input": "number",
        "hint": "Ординату читают по вертикальной оси.",
        "explanation": "Для точки A y = 1.",
        "oracle": {
          "kind": "expression",
          "expr": 1
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -1,
              "y": 1,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-08"
      },
      {
        "prompt": "Точку A(0; 3) передвинули на 2 единицы вправо. Какой стал x?",
        "answer": "2",
        "input": "number",
        "hint": "Горизонтальное движение меняет только x.",
        "explanation": "0 + 2 = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            0,
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 0,
              "y": 3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-09"
      },
      {
        "prompt": "Точку A(1; −2) передвинули на 3 единицы вверх. Какой стал y?",
        "answer": "1",
        "input": "choice",
        "hint": "Вертикальное движение меняет только y.",
        "explanation": "−2 + 3 = 1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            -2,
            3
          ],
          "values": [
            "1",
            "-5"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 1,
              "y": -2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "choices": [
          "1",
          "-5"
        ],
        "id": "data-coordinates-10"
      },
      {
        "prompt": "Точка A(2; 0). Через неё провели вертикальную прямую. Чему равна координата y точки пересечения этой прямой с осью x?",
        "answer": "0",
        "input": "number",
        "hint": "Все точки горизонтальной оси имеют нулевую ординату.",
        "explanation": "На оси x координата y равна 0.",
        "oracle": {
          "kind": "expression",
          "expr": 0
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 2,
              "y": 0,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-11"
      },
      {
        "prompt": "Точка A(3; 2) перенесена горизонтально на ось y. Чему равна новая координата x?",
        "answer": "0",
        "input": "number",
        "hint": "Все точки вертикальной оси имеют нулевую абсциссу.",
        "explanation": "На оси y координата x равна 0.",
        "oracle": {
          "kind": "expression",
          "expr": 0
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 3,
              "y": 2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-12"
      },
      {
        "prompt": "Прочитай абсциссу x точки A на рисунке.",
        "answer": "-3",
        "input": "number",
        "hint": "Абсциссу читают по горизонтальной оси.",
        "explanation": "Для точки A x = −3.",
        "oracle": {
          "kind": "expression",
          "expr": -3
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -3,
              "y": -3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-13"
      },
      {
        "prompt": "Прочитай ординату y точки A на рисунке.",
        "answer": "-1",
        "input": "number",
        "hint": "Ординату читают по вертикальной оси.",
        "explanation": "Для точки A y = −1.",
        "oracle": {
          "kind": "expression",
          "expr": -1
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -2,
              "y": -1,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-14"
      },
      {
        "prompt": "Точку A(−1; 1) передвинули на 2 единицы вправо. Какой стал x?",
        "answer": "1",
        "input": "number",
        "hint": "Горизонтальное движение меняет только x.",
        "explanation": "−1 + 2 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            -1,
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": -1,
              "y": 1,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-15"
      },
      {
        "prompt": "Точку A(0; 3) передвинули на 3 единицы вверх. Какой стал y?",
        "answer": "6",
        "input": "choice",
        "hint": "Вертикальное движение меняет только y.",
        "explanation": "3 + 3 = 6.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            3,
            3
          ],
          "values": [
            "6",
            "0"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 0,
              "y": 3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "choices": [
          "6",
          "0"
        ],
        "id": "data-coordinates-16"
      },
      {
        "prompt": "Точка A(1; −2). Через неё провели вертикальную прямую. Чему равна координата y точки пересечения этой прямой с осью x?",
        "answer": "0",
        "input": "number",
        "hint": "Все точки горизонтальной оси имеют нулевую ординату.",
        "explanation": "На оси x координата y равна 0.",
        "oracle": {
          "kind": "expression",
          "expr": 0
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 1,
              "y": -2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-17"
      },
      {
        "prompt": "Точка A(2; 0) перенесена горизонтально на ось y. Чему равна новая координата x?",
        "answer": "0",
        "input": "number",
        "hint": "Все точки вертикальной оси имеют нулевую абсциссу.",
        "explanation": "На оси y координата x равна 0.",
        "oracle": {
          "kind": "expression",
          "expr": 0
        },
        "visual": {
          "type": "graph",
          "xmin": -4,
          "xmax": 4,
          "ymin": -4,
          "ymax": 4,
          "step": 1,
          "points": [
            {
              "x": 2,
              "y": 0,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "data-coordinates-18"
      }
    ]
  },
  {
    "id": "data-graph-reading",
    "group": "data",
    "title": "Читаем прямую на сетке",
    "goal": "Находить координату по графику и сравнивать изменение y.",
    "covers": [
      "public:v6-graph-read"
    ],
    "prerequisites": [
      "public:v6-coordinates-place"
    ],
    "trainers": [
      {
        "title": "Читаем значение по графику",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-graph-read",
        "kind": "По шагам",
        "instruction": "Проведи мысленно вертикаль от x до графика и горизонталь к y.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Прямая: как меняют график коэффициенты",
        "href": "/trainers/linear-function-lab.html",
        "kind": "Модель",
        "instruction": "Сравни, как меняется высота графика за шаг вправо.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "По графику найди y при x = 0.",
        "answer": "0",
        "input": "number",
        "hint": "От значения x поднимись до прямой, затем прочитай y.",
        "explanation": "При x = 0 на графике y = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              0
            ],
            0
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -9,
              "x2": 3,
              "y2": 9
            }
          ]
        },
        "id": "data-graph-reading-01"
      },
      {
        "prompt": "По графику найди значение y в точке пересечения с осью y.",
        "answer": "1",
        "input": "number",
        "hint": "На оси y абсцисса равна нулю.",
        "explanation": "Прямая пересекает ось при y = 1.",
        "oracle": {
          "kind": "expression",
          "expr": 1
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -2,
              "x2": 3,
              "y2": 4
            }
          ]
        },
        "id": "data-graph-reading-02"
      },
      {
        "prompt": "По графику найди x точки с y = 6.",
        "answer": "2",
        "input": "number",
        "hint": "От отметки y двигайся горизонтально до прямой.",
        "explanation": "На прямой этому y соответствует x = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              6,
              2
            ],
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -4,
              "x2": 3,
              "y2": 8
            }
          ]
        },
        "id": "data-graph-reading-03"
      },
      {
        "prompt": "На сколько увеличивается y на графике при увеличении x на 1?",
        "answer": "3",
        "input": "choice",
        "hint": "Сравни две точки с соседними целыми x.",
        "explanation": "Шаг вправо на 1 поднимает график на 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 3,
          "values": [
            "4",
            "-3",
            "3"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -11,
              "x2": 3,
              "y2": 7
            }
          ]
        },
        "choices": [
          "4",
          "-3",
          "3"
        ],
        "id": "data-graph-reading-04"
      },
      {
        "prompt": "По графику найди разность значений y при x = 1 и x = 0.",
        "answer": "1",
        "input": "number",
        "hint": "Найди две ординаты и вычти вторую из первой.",
        "explanation": "0 − (−1) = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              1,
              -1
            ],
            -1
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -4,
              "x2": 3,
              "y2": 2
            }
          ]
        },
        "id": "data-graph-reading-05"
      },
      {
        "prompt": "Прочитай значение y на прямой при x = −1.",
        "answer": "-2",
        "input": "number",
        "hint": "От −1 на горизонтальной оси проведи вертикаль к прямой.",
        "explanation": "y = −2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            0,
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -6,
              "x2": 3,
              "y2": 6
            }
          ]
        },
        "id": "data-graph-reading-06"
      },
      {
        "prompt": "По графику найди y при x = 1.",
        "answer": "4",
        "input": "number",
        "hint": "От значения x поднимись до прямой, затем прочитай y.",
        "explanation": "При x = 1 на графике y = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              1
            ],
            1
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -8,
              "x2": 3,
              "y2": 10
            }
          ]
        },
        "id": "data-graph-reading-07"
      },
      {
        "prompt": "По графику найди значение y в точке пересечения с осью y.",
        "answer": "2",
        "input": "number",
        "hint": "На оси y абсцисса равна нулю.",
        "explanation": "Прямая пересекает ось при y = 2.",
        "oracle": {
          "kind": "expression",
          "expr": 2
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -1,
              "x2": 3,
              "y2": 5
            }
          ]
        },
        "id": "data-graph-reading-08"
      },
      {
        "prompt": "По графику найди x точки с y = −6.",
        "answer": "-2",
        "input": "number",
        "hint": "От отметки y двигайся горизонтально до прямой.",
        "explanation": "На прямой этому y соответствует x = −2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              -6,
              -2
            ],
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -8,
              "x2": 3,
              "y2": 4
            }
          ]
        },
        "id": "data-graph-reading-09"
      },
      {
        "prompt": "На сколько увеличивается y на графике при увеличении x на 1?",
        "answer": "3",
        "input": "choice",
        "hint": "Сравни две точки с соседними целыми x.",
        "explanation": "Шаг вправо на 1 поднимает график на 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 3,
          "values": [
            "4",
            "-3",
            "3"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -10,
              "x2": 3,
              "y2": 8
            }
          ]
        },
        "choices": [
          "4",
          "-3",
          "3"
        ],
        "id": "data-graph-reading-10"
      },
      {
        "prompt": "По графику найди разность значений y при x = 1 и x = 0.",
        "answer": "1",
        "input": "number",
        "hint": "Найди две ординаты и вычти вторую из первой.",
        "explanation": "1 − (0) = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              1,
              0
            ],
            0
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -3,
              "x2": 3,
              "y2": 3
            }
          ]
        },
        "id": "data-graph-reading-11"
      },
      {
        "prompt": "Прочитай значение y на прямой при x = −1.",
        "answer": "-1",
        "input": "number",
        "hint": "От −1 на горизонтальной оси проведи вертикаль к прямой.",
        "explanation": "y = −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            1,
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -5,
              "x2": 3,
              "y2": 7
            }
          ]
        },
        "id": "data-graph-reading-12"
      },
      {
        "prompt": "По графику найди y при x = 2.",
        "answer": "8",
        "input": "number",
        "hint": "От значения x поднимись до прямой, затем прочитай y.",
        "explanation": "При x = 2 на графике y = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              2
            ],
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -7,
              "x2": 3,
              "y2": 11
            }
          ]
        },
        "id": "data-graph-reading-13"
      },
      {
        "prompt": "По графику найди значение y в точке пересечения с осью y.",
        "answer": "-2",
        "input": "number",
        "hint": "На оси y абсцисса равна нулю.",
        "explanation": "Прямая пересекает ось при y = −2.",
        "oracle": {
          "kind": "expression",
          "expr": -2
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -5,
              "x2": 3,
              "y2": 1
            }
          ]
        },
        "id": "data-graph-reading-14"
      },
      {
        "prompt": "По графику найди x точки с y = −3.",
        "answer": "-1",
        "input": "number",
        "hint": "От отметки y двигайся горизонтально до прямой.",
        "explanation": "На прямой этому y соответствует x = −1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              -3,
              -1
            ],
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -7,
              "x2": 3,
              "y2": 5
            }
          ]
        },
        "id": "data-graph-reading-15"
      },
      {
        "prompt": "На сколько увеличивается y на графике при увеличении x на 1?",
        "answer": "3",
        "input": "choice",
        "hint": "Сравни две точки с соседними целыми x.",
        "explanation": "Шаг вправо на 1 поднимает график на 3.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 3,
          "values": [
            "4",
            "-3",
            "3"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -9,
              "x2": 3,
              "y2": 9
            }
          ]
        },
        "choices": [
          "4",
          "-3",
          "3"
        ],
        "id": "data-graph-reading-16"
      },
      {
        "prompt": "По графику найди разность значений y при x = 1 и x = 0.",
        "answer": "1",
        "input": "number",
        "hint": "Найди две ординаты и вычти вторую из первой.",
        "explanation": "2 − (1) = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "add",
              1,
              1
            ],
            1
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -2,
              "x2": 3,
              "y2": 4
            }
          ]
        },
        "id": "data-graph-reading-17"
      },
      {
        "prompt": "Прочитай значение y на прямой при x = −1.",
        "answer": "0",
        "input": "number",
        "hint": "От −1 на горизонтальной оси проведи вертикаль к прямой.",
        "explanation": "y = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            2,
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -3,
          "xmax": 3,
          "ymin": -12,
          "ymax": 12,
          "step": 1,
          "points": [],
          "segments": [
            {
              "x1": -3,
              "y1": -4,
              "x2": 3,
              "y2": 8
            }
          ]
        },
        "id": "data-graph-reading-18"
      }
    ]
  },
  {
    "id": "data-graph-building",
    "group": "data",
    "title": "От таблицы к графику",
    "goal": "Заполнять таблицу функции, сверять точки и понимать роль коэффициентов прямой.",
    "covers": [
      "public:v6-graph-build",
      "public:linear-function"
    ],
    "prerequisites": [
      "public:v6-coordinates-place",
      "path:grade7-a-substitution-negative-fraction"
    ],
    "trainers": [
      {
        "title": "Строим график по таблице",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-graph-build",
        "kind": "По шагам",
        "instruction": "Вычисли несколько пар координат и построй точки.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Прямая: как меняют график коэффициенты",
        "href": "/trainers/linear-function-lab.html",
        "kind": "Модель",
        "instruction": "Меняй один коэффициент и сравнивай график с таблицей.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "Для y = 3x + 0 заполни y при x = 0.",
        "answer": "0",
        "input": "number",
        "hint": "Подставь x в формулу, соблюдая знак.",
        "explanation": "3 · (0) + (0) = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              0
            ],
            0
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
              "?"
            ]
          ]
        },
        "id": "data-graph-building-01"
      },
      {
        "prompt": "Для y = 1x + 1 какое y у точки на оси y?",
        "answer": "1",
        "input": "number",
        "hint": "На оси y значение x равно нулю.",
        "explanation": "y = 1 · 0 + (1) = 1.",
        "oracle": {
          "kind": "expression",
          "expr": 1
        },
        "id": "data-graph-building-02"
      },
      {
        "prompt": "График задан формулой y = 2x + 2. Значение x увеличили на 2. На сколько увеличится y?",
        "answer": "4",
        "input": "number",
        "hint": "Коэффициент при x показывает изменение за один шаг.",
        "explanation": "2 · 2 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            2
          ]
        },
        "id": "data-graph-building-03"
      },
      {
        "prompt": "Какая ордината подходит точке с x = −2 на y = 3x − 2?",
        "answer": "-8",
        "input": "choice",
        "hint": "Проверь пару координат подстановкой.",
        "explanation": "Получается y = −8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              -2
            ],
            -2
          ],
          "values": [
            "-9",
            "-8",
            "-7"
          ]
        },
        "choices": [
          "-9",
          "-8",
          "-7"
        ],
        "id": "data-graph-building-04"
      },
      {
        "prompt": "Для y = 1x − 1 чему равно y при x = 1?",
        "answer": "0",
        "input": "number",
        "hint": "Подставь единицу вместо x.",
        "explanation": "y = 1 + (−1) = 0.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            -1
          ]
        },
        "id": "data-graph-building-05"
      },
      {
        "prompt": "У прямой y = 2x + 0 свободный член увеличили на 3. Каким станет y при x = 0?",
        "answer": "3",
        "input": "number",
        "hint": "На оси y остаётся только свободный член.",
        "explanation": "0 + 3 = 3.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            0,
            3
          ]
        },
        "id": "data-graph-building-06"
      },
      {
        "prompt": "Для y = 3x + 1 заполни y при x = 1.",
        "answer": "4",
        "input": "number",
        "hint": "Подставь x в формулу, соблюдая знак.",
        "explanation": "3 · (1) + (1) = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              1
            ],
            1
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
              "?"
            ]
          ]
        },
        "id": "data-graph-building-07"
      },
      {
        "prompt": "Для y = 1x + 2 какое y у точки на оси y?",
        "answer": "2",
        "input": "number",
        "hint": "На оси y значение x равно нулю.",
        "explanation": "y = 1 · 0 + (2) = 2.",
        "oracle": {
          "kind": "expression",
          "expr": 2
        },
        "id": "data-graph-building-08"
      },
      {
        "prompt": "График задан формулой y = 2x − 2. Значение x увеличили на 2. На сколько увеличится y?",
        "answer": "4",
        "input": "number",
        "hint": "Коэффициент при x показывает изменение за один шаг.",
        "explanation": "2 · 2 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            2
          ]
        },
        "id": "data-graph-building-09"
      },
      {
        "prompt": "Какая ордината подходит точке с x = −1 на y = 3x − 1?",
        "answer": "-4",
        "input": "choice",
        "hint": "Проверь пару координат подстановкой.",
        "explanation": "Получается y = −4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              -1
            ],
            -1
          ],
          "values": [
            "-5",
            "-4",
            "-3"
          ]
        },
        "choices": [
          "-5",
          "-4",
          "-3"
        ],
        "id": "data-graph-building-10"
      },
      {
        "prompt": "Для y = 1x + 0 чему равно y при x = 1?",
        "answer": "1",
        "input": "number",
        "hint": "Подставь единицу вместо x.",
        "explanation": "y = 1 + (0) = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            0
          ]
        },
        "id": "data-graph-building-11"
      },
      {
        "prompt": "У прямой y = 2x + 1 свободный член увеличили на 3. Каким станет y при x = 0?",
        "answer": "4",
        "input": "number",
        "hint": "На оси y остаётся только свободный член.",
        "explanation": "1 + 3 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            3
          ]
        },
        "id": "data-graph-building-12"
      },
      {
        "prompt": "Для y = 3x + 2 заполни y при x = 2.",
        "answer": "8",
        "input": "number",
        "hint": "Подставь x в формулу, соблюдая знак.",
        "explanation": "3 · (2) + (2) = 8.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              2
            ],
            2
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
              2,
              "?"
            ]
          ]
        },
        "id": "data-graph-building-13"
      },
      {
        "prompt": "Для y = 1x − 2 какое y у точки на оси y?",
        "answer": "-2",
        "input": "number",
        "hint": "На оси y значение x равно нулю.",
        "explanation": "y = 1 · 0 + (−2) = −2.",
        "oracle": {
          "kind": "expression",
          "expr": -2
        },
        "id": "data-graph-building-14"
      },
      {
        "prompt": "График задан формулой y = 2x − 1. Значение x увеличили на 2. На сколько увеличится y?",
        "answer": "4",
        "input": "number",
        "hint": "Коэффициент при x показывает изменение за один шаг.",
        "explanation": "2 · 2 = 4.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            2
          ]
        },
        "id": "data-graph-building-15"
      },
      {
        "prompt": "Какая ордината подходит точке с x = −1 на графике y = 4x + 3?",
        "answer": "-1",
        "input": "choice",
        "hint": "Проверь пару координат подстановкой.",
        "explanation": "y = 4 · (−1) + 3 = −1.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              4,
              -1
            ],
            3
          ],
          "values": [
            "0",
            "-1",
            "-2"
          ]
        },
        "choices": [
          "0",
          "-1",
          "-2"
        ],
        "id": "data-graph-building-16"
      },
      {
        "prompt": "Для y = 1x + 1 чему равно y при x = 1?",
        "answer": "2",
        "input": "number",
        "hint": "Подставь единицу вместо x.",
        "explanation": "y = 1 + (1) = 2.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            1
          ]
        },
        "id": "data-graph-building-17"
      },
      {
        "prompt": "У прямой y = 2x + 2 свободный член увеличили на 3. Каким станет y при x = 0?",
        "answer": "5",
        "input": "number",
        "hint": "На оси y остаётся только свободный член.",
        "explanation": "2 + 3 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            2,
            3
          ]
        },
        "id": "data-graph-building-18"
      }
    ]
  },
  {
    "id": "data-mean",
    "group": "data",
    "title": "Среднее арифметическое",
    "goal": "Делить сумму на количество значений и восстанавливать неизвестное по среднему.",
    "covers": [
      "public:v6-mean-calculate"
    ],
    "prerequisites": [
      "path:pre7-add-carry",
      "oge-basics:multiplication-division/tabular-division"
    ],
    "trainers": [
      {
        "title": "Среднее арифметическое",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-mean-calculate",
        "kind": "По шагам",
        "instruction": "Сложи значения и пересчитай, сколько их.",
        "finish": "Разбери 3 набора данных."
      },
      {
        "title": "Читаем таблицу и диаграмму",
        "href": "/ege-baza/path/index.html#lesson=data",
        "kind": "Модель",
        "instruction": "Выбери числовой столбец таблицы и проверь среднее его значений.",
        "finish": "Проверь 3 своих ответа."
      }
    ],
    "questions": [
      {
        "prompt": "Найди среднее арифметическое 3, 5, 7.",
        "answer": "5",
        "input": "number",
        "hint": "Сумму делят на количество чисел.",
        "explanation": "(3 + 5 + 7) : 3 = 5.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              3,
              5,
              7
            ],
            3
          ]
        },
        "id": "data-mean-01"
      },
      {
        "prompt": "Найди среднее четырёх чисел 4, 6, 8, 10.",
        "answer": "7",
        "input": "number",
        "hint": "Чисел четыре; делитель равен четырём.",
        "explanation": "Сумма 28; среднее 7.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              6,
              8,
              10
            ],
            4
          ]
        },
        "id": "data-mean-02"
      },
      {
        "prompt": "Среднее трёх чисел 8. Какова их сумма?",
        "answer": "24",
        "input": "number",
        "hint": "Восстанови сумму обратным действием.",
        "explanation": "8 · 3 = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            8
          ]
        },
        "id": "data-mean-03"
      },
      {
        "prompt": "Среднее чисел 5 и 11 равно чему?",
        "answer": "8",
        "input": "choice",
        "hint": "Сложи оба числа, затем раздели на два.",
        "explanation": "(5 + 11) : 2 = 8.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "add",
              5,
              11
            ],
            2
          ],
          "values": [
            "8",
            "16",
            "11"
          ]
        },
        "choices": [
          "8",
          "16",
          "11"
        ],
        "id": "data-mean-04"
      },
      {
        "prompt": "Среднее чисел 6, 8 и x равно 9. Найди x.",
        "answer": "13",
        "input": "number",
        "hint": "Найди общую сумму, затем вычти известные числа.",
        "explanation": "3 · 9 − 6 − 8 = 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              3,
              9
            ],
            [
              "add",
              6,
              8
            ]
          ]
        },
        "id": "data-mean-05"
      },
      {
        "prompt": "Три числа 7, 9, 11 увеличили каждое на 1. Каким станет среднее?",
        "answer": "10",
        "input": "number",
        "hint": "Среднее увеличится на ту же величину.",
        "explanation": "Новое среднее 10.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              8,
              10,
              12
            ],
            3
          ]
        },
        "id": "data-mean-06"
      },
      {
        "prompt": "Найди среднее арифметическое 9, 11, 13.",
        "answer": "11",
        "input": "number",
        "hint": "Сумму делят на количество чисел.",
        "explanation": "(9 + 11 + 13) : 3 = 11.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              9,
              11,
              13
            ],
            3
          ]
        },
        "id": "data-mean-07"
      },
      {
        "prompt": "Найди среднее четырёх чисел 10, 12, 14, 16.",
        "answer": "13",
        "input": "number",
        "hint": "Чисел четыре; делитель равен четырём.",
        "explanation": "Сумма 52; среднее 13.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              10,
              12,
              14,
              16
            ],
            4
          ]
        },
        "id": "data-mean-08"
      },
      {
        "prompt": "Среднее трёх чисел 14. Какова их сумма?",
        "answer": "42",
        "input": "number",
        "hint": "Восстанови сумму обратным действием.",
        "explanation": "14 · 3 = 42.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            14
          ]
        },
        "id": "data-mean-09"
      },
      {
        "prompt": "Среднее чисел 11 и 17 равно чему?",
        "answer": "14",
        "input": "choice",
        "hint": "Сложи оба числа, затем раздели на два.",
        "explanation": "(11 + 17) : 2 = 14.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "add",
              11,
              17
            ],
            2
          ],
          "values": [
            "14",
            "28",
            "17"
          ]
        },
        "choices": [
          "14",
          "28",
          "17"
        ],
        "id": "data-mean-10"
      },
      {
        "prompt": "Среднее чисел 12, 14 и x равно 15. Найди x.",
        "answer": "19",
        "input": "number",
        "hint": "Найди общую сумму, затем вычти известные числа.",
        "explanation": "3 · 15 − 12 − 14 = 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              3,
              15
            ],
            [
              "add",
              12,
              14
            ]
          ]
        },
        "id": "data-mean-11"
      },
      {
        "prompt": "Три числа 13, 15, 17 увеличили каждое на 1. Каким станет среднее?",
        "answer": "16",
        "input": "number",
        "hint": "Среднее увеличится на ту же величину.",
        "explanation": "Новое среднее 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              14,
              16,
              18
            ],
            3
          ]
        },
        "id": "data-mean-12"
      },
      {
        "prompt": "Найди среднее арифметическое 15, 17, 19.",
        "answer": "17",
        "input": "number",
        "hint": "Сумму делят на количество чисел.",
        "explanation": "(15 + 17 + 19) : 3 = 17.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              15,
              17,
              19
            ],
            3
          ]
        },
        "id": "data-mean-13"
      },
      {
        "prompt": "Найди среднее четырёх чисел 16, 18, 20, 22.",
        "answer": "19",
        "input": "number",
        "hint": "Чисел четыре; делитель равен четырём.",
        "explanation": "Сумма 76; среднее 19.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              16,
              18,
              20,
              22
            ],
            4
          ]
        },
        "id": "data-mean-14"
      },
      {
        "prompt": "Среднее трёх чисел 20. Какова их сумма?",
        "answer": "60",
        "input": "number",
        "hint": "Восстанови сумму обратным действием.",
        "explanation": "20 · 3 = 60.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            20
          ]
        },
        "id": "data-mean-15"
      },
      {
        "prompt": "Среднее чисел 17 и 23 равно чему?",
        "answer": "20",
        "input": "choice",
        "hint": "Сложи оба числа, затем раздели на два.",
        "explanation": "(17 + 23) : 2 = 20.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            [
              "add",
              17,
              23
            ],
            2
          ],
          "values": [
            "20",
            "40",
            "23"
          ]
        },
        "choices": [
          "20",
          "40",
          "23"
        ],
        "id": "data-mean-16"
      },
      {
        "prompt": "Среднее чисел 18, 20 и x равно 21. Найди x.",
        "answer": "25",
        "input": "number",
        "hint": "Найди общую сумму, затем вычти известные числа.",
        "explanation": "3 · 21 − 18 − 20 = 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              3,
              21
            ],
            [
              "add",
              18,
              20
            ]
          ]
        },
        "id": "data-mean-17"
      },
      {
        "prompt": "Три числа 19, 21, 23 увеличили каждое на 1. Каким станет среднее?",
        "answer": "22",
        "input": "number",
        "hint": "Среднее увеличится на ту же величину.",
        "explanation": "Новое среднее 22.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              20,
              22,
              24
            ],
            3
          ]
        },
        "id": "data-mean-18"
      }
    ]
  },
  {
    "id": "geometry-ruler",
    "group": "geometry",
    "title": "Длина по линейке",
    "goal": "Измерять разность отметок, в том числе когда отрезок начинается не с нуля.",
    "covers": [
      "path:pre7-ruler-length"
    ],
    "prerequisites": [
      "path:pre7-subtract-borrow"
    ],
    "trainers": [
      {
        "title": "Измеряем длину по линейке",
        "href": "/ege-baza/path/index.html#lesson=pre7-ruler-length",
        "kind": "Модель",
        "instruction": "Прочитай отметки обоих концов; затем найди разность.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Шкала: деления и отметки",
        "href": "/ege-baza/path/index.html#lesson=pre7-scale-reading",
        "kind": "По шагам",
        "instruction": "Проверь цену одного деления и число промежутков.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Концы отрезка стоят у 3 и 7 см. Какова длина?",
        "answer": "4",
        "input": "number",
        "hint": "Начало отрезка не обязательно совпадает с нулём.",
        "explanation": "7 − 3 = 4 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            7,
            3
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 9,
          "points": [
            {
              "value": 3,
              "label": "A"
            },
            {
              "value": 7,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-ruler-01"
      },
      {
        "prompt": "Отрезок длиной 3 см начинается у отметки 4 см на линейке и направлен вправо. У какой отметки он заканчивается?",
        "answer": "7",
        "input": "number",
        "hint": "Прибавь длину к начальной отметке.",
        "explanation": "4 + 3 = 7 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            3
          ]
        },
        "id": "geometry-ruler-02"
      },
      {
        "prompt": "Правый конец у 11 см, длина 4 см. Где левый конец?",
        "answer": "7",
        "input": "number",
        "hint": "От правого конца отсчитай длину влево.",
        "explanation": "11 − 4 = 7 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            11,
            4
          ]
        },
        "id": "geometry-ruler-03"
      },
      {
        "prompt": "От 1 до 8 см: какую длину надо записать?",
        "answer": "7",
        "input": "choice",
        "hint": "Показание правого конца — не сама длина.",
        "explanation": "8 − 1 = 7 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            8,
            1
          ],
          "values": [
            "8",
            "9",
            "7"
          ]
        },
        "choices": [
          "8",
          "9",
          "7"
        ],
        "id": "geometry-ruler-04"
      },
      {
        "prompt": "Лента от отметки 2 до 10 см. Сколько это миллиметров?",
        "answer": "80",
        "input": "number",
        "hint": "Сначала измерь длину, затем переведи сантиметры в миллиметры.",
        "explanation": "(10 − 2) · 10 = 80 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "sub",
              10,
              2
            ],
            10
          ]
        },
        "id": "geometry-ruler-05"
      },
      {
        "prompt": "Отрезок длиной 9 см передвинули вправо на 5 см. Какой стала его длина?",
        "answer": "9",
        "input": "number",
        "hint": "Перенос меняет положение, но не длину.",
        "explanation": "Длина осталась 9 см.",
        "oracle": {
          "kind": "expression",
          "expr": 9
        },
        "id": "geometry-ruler-06"
      },
      {
        "prompt": "Концы отрезка стоят у 4 и 14 см. Какова длина?",
        "answer": "10",
        "input": "number",
        "hint": "Начало отрезка не обязательно совпадает с нулём.",
        "explanation": "14 − 4 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            14,
            4
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 16,
          "points": [
            {
              "value": 4,
              "label": "A"
            },
            {
              "value": 14,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-ruler-07"
      },
      {
        "prompt": "Отрезок длиной 9 см начинается у отметки 5 см на линейке и направлен вправо. У какой отметки он заканчивается?",
        "answer": "14",
        "input": "number",
        "hint": "Прибавь длину к начальной отметке.",
        "explanation": "5 + 9 = 14 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            5,
            9
          ]
        },
        "id": "geometry-ruler-08"
      },
      {
        "prompt": "Правый конец у 13 см, длина 10 см. Где левый конец?",
        "answer": "3",
        "input": "number",
        "hint": "От правого конца отсчитай длину влево.",
        "explanation": "13 − 10 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            13,
            10
          ]
        },
        "id": "geometry-ruler-09"
      },
      {
        "prompt": "От 2 до 15 см: какую длину надо записать?",
        "answer": "13",
        "input": "choice",
        "hint": "Показание правого конца — не сама длина.",
        "explanation": "15 − 2 = 13 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            15,
            2
          ],
          "values": [
            "15",
            "17",
            "13"
          ]
        },
        "choices": [
          "15",
          "17",
          "13"
        ],
        "id": "geometry-ruler-10"
      },
      {
        "prompt": "Лента от отметки 3 до 17 см. Сколько это миллиметров?",
        "answer": "140",
        "input": "number",
        "hint": "Сначала измерь длину, затем переведи сантиметры в миллиметры.",
        "explanation": "(17 − 3) · 10 = 140 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "sub",
              17,
              3
            ],
            10
          ]
        },
        "id": "geometry-ruler-11"
      },
      {
        "prompt": "Отрезок длиной 15 см передвинули вправо на 3 см. Какой стала его длина?",
        "answer": "15",
        "input": "number",
        "hint": "Перенос меняет положение, но не длину.",
        "explanation": "Длина осталась 15 см.",
        "oracle": {
          "kind": "expression",
          "expr": 15
        },
        "id": "geometry-ruler-12"
      },
      {
        "prompt": "Концы отрезка стоят у 5 и 21 см. Какова длина?",
        "answer": "16",
        "input": "number",
        "hint": "Начало отрезка не обязательно совпадает с нулём.",
        "explanation": "21 − 5 = 16 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            21,
            5
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 23,
          "points": [
            {
              "value": 5,
              "label": "A"
            },
            {
              "value": 21,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-ruler-13"
      },
      {
        "prompt": "Отрезок длиной 15 см начинается у отметки 1 см на линейке и направлен вправо. У какой отметки он заканчивается?",
        "answer": "16",
        "input": "number",
        "hint": "Прибавь длину к начальной отметке.",
        "explanation": "1 + 15 = 16 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            1,
            15
          ]
        },
        "id": "geometry-ruler-14"
      },
      {
        "prompt": "Правый конец у 20 см, длина 16 см. Где левый конец?",
        "answer": "4",
        "input": "number",
        "hint": "От правого конца отсчитай длину влево.",
        "explanation": "20 − 16 = 4 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            20,
            16
          ]
        },
        "id": "geometry-ruler-15"
      },
      {
        "prompt": "От 3 до 22 см: какую длину надо записать?",
        "answer": "19",
        "input": "choice",
        "hint": "Показание правого конца — не сама длина.",
        "explanation": "22 − 3 = 19 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            22,
            3
          ],
          "values": [
            "22",
            "25",
            "19"
          ]
        },
        "choices": [
          "22",
          "25",
          "19"
        ],
        "id": "geometry-ruler-16"
      },
      {
        "prompt": "Лента от отметки 4 до 24 см. Сколько это миллиметров?",
        "answer": "200",
        "input": "number",
        "hint": "Сначала измерь длину, затем переведи сантиметры в миллиметры.",
        "explanation": "(24 − 4) · 10 = 200 мм.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "sub",
              24,
              4
            ],
            10
          ]
        },
        "id": "geometry-ruler-17"
      },
      {
        "prompt": "Отрезок длиной 21 см передвинули вправо на 5 см. Какой стала его длина?",
        "answer": "21",
        "input": "number",
        "hint": "Перенос меняет положение, но не длину.",
        "explanation": "Длина осталась 21 см.",
        "oracle": {
          "kind": "expression",
          "expr": 21
        },
        "id": "geometry-ruler-18"
      }
    ]
  },
  {
    "id": "geometry-units",
    "group": "geometry",
    "title": "Длина и время: перевод единиц",
    "goal": "Выбирать множитель перевода длины и времени и не путать десятичные и шестидесятичные единицы.",
    "covers": [
      "oge-basics:units-length-time"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/tabular-division"
    ],
    "trainers": [
      {
        "title": "Единицы длины и времени",
        "href": "/trainers/oge-basics/units-length-time.html",
        "kind": "Модель",
        "instruction": "Запиши, сколько малых единиц содержит одна большая.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Скорость, время и расстояние",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-formula-distance",
        "kind": "По шагам",
        "instruction": "Согласуй время и скорость в одной задаче о движении.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Переведи 2 м в сантиметры.",
        "answer": "200",
        "input": "number",
        "hint": "В одном метре сто сантиметров.",
        "explanation": "2 · 100 = 200 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            100
          ]
        },
        "id": "geometry-units-01"
      },
      {
        "prompt": "Переведи 30 см в метры.",
        "answer": "3/10",
        "input": "number",
        "hint": "Большая единица содержит сто малых.",
        "explanation": "30 : 100 = 3/10 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30,
            100
          ]
        },
        "id": "geometry-units-02"
      },
      {
        "prompt": "Сколько минут в 4 ч?",
        "answer": "240",
        "input": "number",
        "hint": "Каждый час содержит 60 минут.",
        "explanation": "4 · 60 = 240 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            60
          ]
        },
        "id": "geometry-units-03"
      },
      {
        "prompt": "Сколько минут в 3 ч 5 мин?",
        "answer": "185",
        "input": "choice",
        "hint": "Переведи часы и прибавь оставшиеся минуты.",
        "explanation": "3 · 60 + 5 = 185 мин.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              60
            ],
            5
          ],
          "values": [
            "8",
            "185",
            "305"
          ]
        },
        "choices": [
          "8",
          "185",
          "305"
        ],
        "id": "geometry-units-04"
      },
      {
        "prompt": "Переведи 6 км в метры.",
        "answer": "6000",
        "input": "number",
        "hint": "В одном километре тысяча метров.",
        "explanation": "6 · 1000 = 6000 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            1000
          ]
        },
        "id": "geometry-units-05"
      },
      {
        "prompt": "Сколько секунд в 7 мин?",
        "answer": "420",
        "input": "number",
        "hint": "В каждой минуте 60 секунд.",
        "explanation": "7 · 60 = 420 с.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            7,
            60
          ]
        },
        "id": "geometry-units-06"
      },
      {
        "prompt": "Переведи 8 м в сантиметры.",
        "answer": "800",
        "input": "number",
        "hint": "В одном метре сто сантиметров.",
        "explanation": "8 · 100 = 800 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            8,
            100
          ]
        },
        "id": "geometry-units-07"
      },
      {
        "prompt": "Переведи 90 см в метры.",
        "answer": "9/10",
        "input": "number",
        "hint": "Большая единица содержит сто малых.",
        "explanation": "90 : 100 = 9/10 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            90,
            100
          ]
        },
        "id": "geometry-units-08"
      },
      {
        "prompt": "Сколько минут в 10 ч?",
        "answer": "600",
        "input": "number",
        "hint": "Каждый час содержит 60 минут.",
        "explanation": "10 · 60 = 600 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            10,
            60
          ]
        },
        "id": "geometry-units-09"
      },
      {
        "prompt": "Сколько минут в 5 ч 11 мин?",
        "answer": "311",
        "input": "choice",
        "hint": "Переведи часы и прибавь оставшиеся минуты.",
        "explanation": "5 · 60 + 11 = 311 мин.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              5,
              60
            ],
            11
          ],
          "values": [
            "16",
            "311",
            "511"
          ]
        },
        "choices": [
          "16",
          "311",
          "511"
        ],
        "id": "geometry-units-10"
      },
      {
        "prompt": "Переведи 12 км в метры.",
        "answer": "12000",
        "input": "number",
        "hint": "В одном километре тысяча метров.",
        "explanation": "12 · 1000 = 12000 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            1000
          ]
        },
        "id": "geometry-units-11"
      },
      {
        "prompt": "Сколько секунд в 13 мин?",
        "answer": "780",
        "input": "number",
        "hint": "В каждой минуте 60 секунд.",
        "explanation": "13 · 60 = 780 с.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            13,
            60
          ]
        },
        "id": "geometry-units-12"
      },
      {
        "prompt": "Переведи 14 м в сантиметры.",
        "answer": "1400",
        "input": "number",
        "hint": "В одном метре сто сантиметров.",
        "explanation": "14 · 100 = 1400 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            14,
            100
          ]
        },
        "id": "geometry-units-13"
      },
      {
        "prompt": "Переведи 150 см в метры.",
        "answer": "3/2",
        "input": "number",
        "hint": "Большая единица содержит сто малых.",
        "explanation": "150 : 100 = 3/2 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            150,
            100
          ]
        },
        "id": "geometry-units-14"
      },
      {
        "prompt": "Сколько минут в 16 ч?",
        "answer": "960",
        "input": "number",
        "hint": "Каждый час содержит 60 минут.",
        "explanation": "16 · 60 = 960 мин.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            16,
            60
          ]
        },
        "id": "geometry-units-15"
      },
      {
        "prompt": "Сколько минут в 3 ч 17 мин?",
        "answer": "197",
        "input": "choice",
        "hint": "Переведи часы и прибавь оставшиеся минуты.",
        "explanation": "3 · 60 + 17 = 197 мин.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              3,
              60
            ],
            17
          ],
          "values": [
            "20",
            "197",
            "317"
          ]
        },
        "choices": [
          "20",
          "197",
          "317"
        ],
        "id": "geometry-units-16"
      },
      {
        "prompt": "Переведи 18 км в метры.",
        "answer": "18000",
        "input": "number",
        "hint": "В одном километре тысяча метров.",
        "explanation": "18 · 1000 = 18000 м.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            18,
            1000
          ]
        },
        "id": "geometry-units-17"
      },
      {
        "prompt": "Сколько секунд в 19 мин?",
        "answer": "1140",
        "input": "number",
        "hint": "В каждой минуте 60 секунд.",
        "explanation": "19 · 60 = 1140 с.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            19,
            60
          ]
        },
        "id": "geometry-units-18"
      }
    ]
  },
  {
    "id": "geometry-perimeter",
    "group": "geometry",
    "title": "Периметр многоугольника",
    "goal": "Складывать длины границы прямоугольника, квадрата и треугольника.",
    "covers": [
      "path:pre7-perimeter",
      "path:grade7-g-core-triangle-perimeter"
    ],
    "prerequisites": [
      "path:pre7-add-carry"
    ],
    "trainers": [
      {
        "title": "Периметр: обходим границу",
        "href": "/ege-baza/path/index.html#lesson=pre7-perimeter",
        "kind": "Модель",
        "instruction": "Обойди границу и отметь каждую учтённую сторону.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Периметр треугольника",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-triangle-perimeter",
        "kind": "По шагам",
        "instruction": "Сложи три стороны; восстанови неизвестную из периметра.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Прямоугольник со сторонами 4 и 4 см. Найди периметр.",
        "answer": "16",
        "input": "number",
        "hint": "Обойди все четыре стороны.",
        "explanation": "2 · (4 + 4) = 16 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              4,
              4
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 4,
          "height": 4,
          "unit": "см"
        },
        "id": "geometry-perimeter-01"
      },
      {
        "prompt": "Квадрат со стороной 5 см. Найди периметр.",
        "answer": "20",
        "input": "number",
        "hint": "Все четыре стороны равны.",
        "explanation": "4 · 5 = 20 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            5
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 5,
          "height": 5,
          "unit": "см"
        },
        "id": "geometry-perimeter-02"
      },
      {
        "prompt": "Стороны треугольника 6, 7, 8 см. Найди периметр.",
        "answer": "21",
        "input": "number",
        "hint": "Сложи длины всех трёх сторон.",
        "explanation": "6 + 7 + 8 = 21 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            6,
            7,
            8
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Сторона",
            "Длина, см"
          ],
          "rows": [
            [
              "AB",
              6
            ],
            [
              "BC",
              7
            ],
            [
              "CA",
              8
            ]
          ]
        },
        "id": "geometry-perimeter-03"
      },
      {
        "prompt": "Прямоугольник 7 на 3 см. Какое значение — периметр?",
        "answer": "20",
        "input": "choice",
        "hint": "Площадь и периметр — разные величины.",
        "explanation": "Периметр 2(7 + 3) = 20 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              7,
              3
            ]
          ],
          "values": [
            "20",
            "10",
            "22"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 7,
          "height": 3,
          "unit": "см"
        },
        "choices": [
          "20",
          "10",
          "22"
        ],
        "id": "geometry-perimeter-04"
      },
      {
        "prompt": "Периметр треугольника 27 см. Две стороны 8 и 9 см. Найди третью.",
        "answer": "10",
        "input": "number",
        "hint": "Вычти обе известные стороны из периметра.",
        "explanation": "27 − 8 − 9 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              27,
              8
            ],
            9
          ]
        },
        "id": "geometry-perimeter-05"
      },
      {
        "prompt": "У прямоугольника длину 9 см увеличили на 5 см, ширину оставили прежней. На сколько вырос периметр?",
        "answer": "10",
        "input": "number",
        "hint": "Увеличились две противоположные стороны.",
        "explanation": "2 · 5 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            5
          ]
        },
        "id": "geometry-perimeter-06"
      },
      {
        "prompt": "Прямоугольник со сторонами 10 и 2 см. Найди периметр.",
        "answer": "24",
        "input": "number",
        "hint": "Обойди все четыре стороны.",
        "explanation": "2 · (10 + 2) = 24 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              10,
              2
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 10,
          "height": 2,
          "unit": "см"
        },
        "id": "geometry-perimeter-07"
      },
      {
        "prompt": "Квадрат со стороной 11 см. Найди периметр.",
        "answer": "44",
        "input": "number",
        "hint": "Все четыре стороны равны.",
        "explanation": "4 · 11 = 44 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            11
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 11,
          "height": 11,
          "unit": "см"
        },
        "id": "geometry-perimeter-08"
      },
      {
        "prompt": "Стороны треугольника 12, 13, 14 см. Найди периметр.",
        "answer": "39",
        "input": "number",
        "hint": "Сложи длины всех трёх сторон.",
        "explanation": "12 + 13 + 14 = 39 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            12,
            13,
            14
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Сторона",
            "Длина, см"
          ],
          "rows": [
            [
              "AB",
              12
            ],
            [
              "BC",
              13
            ],
            [
              "CA",
              14
            ]
          ]
        },
        "id": "geometry-perimeter-09"
      },
      {
        "prompt": "Прямоугольник 13 на 5 см. Какое значение — периметр?",
        "answer": "36",
        "input": "choice",
        "hint": "Площадь и периметр — разные величины.",
        "explanation": "Периметр 2(13 + 5) = 36 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              13,
              5
            ]
          ],
          "values": [
            "36",
            "18",
            "66"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 13,
          "height": 5,
          "unit": "см"
        },
        "choices": [
          "36",
          "18",
          "66"
        ],
        "id": "geometry-perimeter-10"
      },
      {
        "prompt": "Периметр треугольника 45 см. Две стороны 14 и 15 см. Найди третью.",
        "answer": "16",
        "input": "number",
        "hint": "Вычти обе известные стороны из периметра.",
        "explanation": "45 − 14 − 15 = 16 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              45,
              14
            ],
            15
          ]
        },
        "id": "geometry-perimeter-11"
      },
      {
        "prompt": "У прямоугольника длину 15 см увеличили на 3 см, ширину оставили прежней. На сколько вырос периметр?",
        "answer": "6",
        "input": "number",
        "hint": "Увеличились две противоположные стороны.",
        "explanation": "2 · 3 = 6 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            3
          ]
        },
        "id": "geometry-perimeter-12"
      },
      {
        "prompt": "Прямоугольник со сторонами 16 и 4 см. Найди периметр.",
        "answer": "40",
        "input": "number",
        "hint": "Обойди все четыре стороны.",
        "explanation": "2 · (16 + 4) = 40 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              16,
              4
            ]
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 16,
          "height": 4,
          "unit": "см"
        },
        "id": "geometry-perimeter-13"
      },
      {
        "prompt": "Квадрат со стороной 17 см. Найди периметр.",
        "answer": "68",
        "input": "number",
        "hint": "Все четыре стороны равны.",
        "explanation": "4 · 17 = 68 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            17
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 17,
          "height": 17,
          "unit": "см"
        },
        "id": "geometry-perimeter-14"
      },
      {
        "prompt": "Стороны треугольника 18, 19, 20 см. Найди периметр.",
        "answer": "57",
        "input": "number",
        "hint": "Сложи длины всех трёх сторон.",
        "explanation": "18 + 19 + 20 = 57 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            18,
            19,
            20
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Сторона",
            "Длина, см"
          ],
          "rows": [
            [
              "AB",
              18
            ],
            [
              "BC",
              19
            ],
            [
              "CA",
              20
            ]
          ]
        },
        "id": "geometry-perimeter-15"
      },
      {
        "prompt": "Прямоугольник 19 на 3 см. Какое значение — периметр?",
        "answer": "44",
        "input": "choice",
        "hint": "Площадь и периметр — разные величины.",
        "explanation": "Периметр 2(19 + 3) = 44 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            2,
            [
              "add",
              19,
              3
            ]
          ],
          "values": [
            "44",
            "22",
            "58"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 19,
          "height": 3,
          "unit": "см"
        },
        "choices": [
          "44",
          "22",
          "58"
        ],
        "id": "geometry-perimeter-16"
      },
      {
        "prompt": "Периметр треугольника 63 см. Две стороны 20 и 21 см. Найди третью.",
        "answer": "22",
        "input": "number",
        "hint": "Вычти обе известные стороны из периметра.",
        "explanation": "63 − 20 − 21 = 22 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "sub",
              63,
              20
            ],
            21
          ]
        },
        "id": "geometry-perimeter-17"
      },
      {
        "prompt": "У прямоугольника длину 21 см увеличили на 5 см, ширину оставили прежней. На сколько вырос периметр?",
        "answer": "10",
        "input": "number",
        "hint": "Увеличились две противоположные стороны.",
        "explanation": "2 · 5 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            5
          ]
        },
        "id": "geometry-perimeter-18"
      }
    ]
  },
  {
    "id": "geometry-area",
    "group": "geometry",
    "title": "Площадь и клетки",
    "goal": "Считать квадратные единицы, использовать ряды и столбцы и отличать площадь от периметра.",
    "covers": [
      "path:pre7-grid-area",
      "public:geometry-grid"
    ],
    "prerequisites": [
      "oge-basics:multiplication-division/multiplication-meaning"
    ],
    "trainers": [
      {
        "title": "Площадь по клеткам",
        "href": "/ege-baza/path/index.html#lesson=pre7-grid-area",
        "kind": "Модель",
        "instruction": "Сосчитай клетки рядами; проверь умножением.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Фигуры на клетчатой бумаге",
        "href": "/trainers/oge-task18-grid.html",
        "kind": "По шагам",
        "instruction": "Разбей фигуру на прямоугольники или вычти вырезанную часть.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Прямоугольник 4 на 4 см. Найди площадь в см².",
        "answer": "16",
        "input": "number",
        "hint": "Число квадратных единиц равно произведению сторон.",
        "explanation": "4 · 4 = 16 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            4
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 4,
          "height": 4,
          "unit": "см"
        },
        "id": "geometry-area-01"
      },
      {
        "prompt": "Прямоугольная сетка: 5 ряда по 5 клеток. Сколько всего клеток?",
        "answer": "25",
        "input": "number",
        "hint": "Сосчитай одинаковые ряды.",
        "explanation": "5 · 5 = 25.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            5
          ]
        },
        "visual": {
          "type": "array",
          "rows": 5,
          "columns": 5
        },
        "id": "geometry-area-02"
      },
      {
        "prompt": "Площадь прямоугольника 12 см², одна сторона 2 см. Найди другую сторону.",
        "answer": "6",
        "input": "number",
        "hint": "Неизвестный множитель находится делением.",
        "explanation": "12 : 2 = 6 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            12,
            2
          ]
        },
        "id": "geometry-area-03"
      },
      {
        "prompt": "Квадрат со стороной 7 см. Какая площадь верна?",
        "answer": "49",
        "input": "choice",
        "hint": "Умножь сторону на себя.",
        "explanation": "7 · 7 = 49 см².",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            7,
            2
          ],
          "values": [
            "50",
            "29",
            "49"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 7,
          "height": 7,
          "unit": "см"
        },
        "choices": [
          "50",
          "29",
          "49"
        ],
        "id": "geometry-area-04"
      },
      {
        "prompt": "В прямоугольнике 8 на 4 клеток убрали 4 клетки одного крайнего столбца. Сколько клеток осталось?",
        "answer": "28",
        "input": "number",
        "hint": "Из всей площади вычти один столбец.",
        "explanation": "32 − 4 = 28.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              8,
              4
            ],
            4
          ]
        },
        "id": "geometry-area-05"
      },
      {
        "prompt": "Прямоугольник 9 на 5 см разрезали пополам на две равные части. Найди площадь одной.",
        "answer": "45/2",
        "input": "number",
        "hint": "Половина площади — половина числа квадратных единиц.",
        "explanation": "45 : 2 = 45/2 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              9,
              5
            ],
            2
          ]
        },
        "id": "geometry-area-06"
      },
      {
        "prompt": "Прямоугольник 10 на 2 см. Найди площадь в см².",
        "answer": "20",
        "input": "number",
        "hint": "Число квадратных единиц равно произведению сторон.",
        "explanation": "10 · 2 = 20 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            10,
            2
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 10,
          "height": 2,
          "unit": "см"
        },
        "id": "geometry-area-07"
      },
      {
        "prompt": "Прямоугольная сетка: 3 ряда по 11 клеток. Сколько всего клеток?",
        "answer": "33",
        "input": "number",
        "hint": "Сосчитай одинаковые ряды.",
        "explanation": "3 · 11 = 33.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            3,
            11
          ]
        },
        "visual": {
          "type": "array",
          "rows": 3,
          "columns": 11
        },
        "id": "geometry-area-08"
      },
      {
        "prompt": "Площадь прямоугольника 48 см², одна сторона 4 см. Найди другую сторону.",
        "answer": "12",
        "input": "number",
        "hint": "Неизвестный множитель находится делением.",
        "explanation": "48 : 4 = 12 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            48,
            4
          ]
        },
        "id": "geometry-area-09"
      },
      {
        "prompt": "Квадрат со стороной 13 см. Какая площадь верна?",
        "answer": "169",
        "input": "choice",
        "hint": "Умножь сторону на себя.",
        "explanation": "13 · 13 = 169 см².",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            13,
            2
          ],
          "values": [
            "170",
            "53",
            "169"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 13,
          "height": 13,
          "unit": "см"
        },
        "choices": [
          "170",
          "53",
          "169"
        ],
        "id": "geometry-area-10"
      },
      {
        "prompt": "В прямоугольнике 14 на 2 клеток убрали 2 клетки одного крайнего столбца. Сколько клеток осталось?",
        "answer": "26",
        "input": "number",
        "hint": "Из всей площади вычти один столбец.",
        "explanation": "28 − 2 = 26.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              14,
              2
            ],
            2
          ]
        },
        "id": "geometry-area-11"
      },
      {
        "prompt": "Прямоугольник 15 на 3 см разрезали пополам на две равные части. Найди площадь одной.",
        "answer": "45/2",
        "input": "number",
        "hint": "Половина площади — половина числа квадратных единиц.",
        "explanation": "45 : 2 = 45/2 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              15,
              3
            ],
            2
          ]
        },
        "id": "geometry-area-12"
      },
      {
        "prompt": "Прямоугольник 16 на 4 см. Найди площадь в см².",
        "answer": "64",
        "input": "number",
        "hint": "Число квадратных единиц равно произведению сторон.",
        "explanation": "16 · 4 = 64 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            16,
            4
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 16,
          "height": 4,
          "unit": "см"
        },
        "id": "geometry-area-13"
      },
      {
        "prompt": "Прямоугольная сетка: 5 ряда по 17 клеток. Сколько всего клеток?",
        "answer": "85",
        "input": "number",
        "hint": "Сосчитай одинаковые ряды.",
        "explanation": "5 · 17 = 85.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            5,
            17
          ]
        },
        "visual": {
          "type": "array",
          "rows": 5,
          "columns": 17
        },
        "id": "geometry-area-14"
      },
      {
        "prompt": "Площадь прямоугольника 36 см², одна сторона 2 см. Найди другую сторону.",
        "answer": "18",
        "input": "number",
        "hint": "Неизвестный множитель находится делением.",
        "explanation": "36 : 2 = 18 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            36,
            2
          ]
        },
        "id": "geometry-area-15"
      },
      {
        "prompt": "Квадрат со стороной 19 см. Какая площадь верна?",
        "answer": "361",
        "input": "choice",
        "hint": "Умножь сторону на себя.",
        "explanation": "19 · 19 = 361 см².",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            19,
            2
          ],
          "values": [
            "362",
            "77",
            "361"
          ]
        },
        "visual": {
          "type": "rectangle",
          "width": 19,
          "height": 19,
          "unit": "см"
        },
        "choices": [
          "362",
          "77",
          "361"
        ],
        "id": "geometry-area-16"
      },
      {
        "prompt": "В прямоугольнике 20 на 4 клеток убрали 4 клетки одного крайнего столбца. Сколько клеток осталось?",
        "answer": "76",
        "input": "number",
        "hint": "Из всей площади вычти один столбец.",
        "explanation": "80 − 4 = 76.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              20,
              4
            ],
            4
          ]
        },
        "id": "geometry-area-17"
      },
      {
        "prompt": "Прямоугольник 21 на 5 см разрезали пополам на две равные части. Найди площадь одной.",
        "answer": "105/2",
        "input": "number",
        "hint": "Половина площади — половина числа квадратных единиц.",
        "explanation": "105 : 2 = 105/2 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "mul",
              21,
              5
            ],
            2
          ]
        },
        "id": "geometry-area-18"
      }
    ]
  },
  {
    "id": "geometry-square-units",
    "group": "geometry",
    "title": "Квадратные единицы",
    "goal": "Применять коэффициент перевода дважды и согласовывать единицы сторон.",
    "covers": [
      "oge-basics:units-area"
    ],
    "prerequisites": [
      "oge-basics:units-length-time",
      "path:pre7-grid-area"
    ],
    "trainers": [
      {
        "title": "Квадратные единицы без ловушек",
        "href": "/trainers/oge-basics/units-area.html",
        "kind": "Модель",
        "instruction": "Раздели квадратную единицу на меньшие квадраты.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Площадь по клеткам",
        "href": "/ege-baza/path/index.html#lesson=pre7-grid-area",
        "kind": "По шагам",
        "instruction": "Проверь число маленьких клеток по двум направлениям.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Сколько квадратных сантиметров в 2 м²?",
        "answer": "20000",
        "input": "number",
        "hint": "Метр содержит сто сантиметров по каждому из двух направлений.",
        "explanation": "2 · 100 · 100 = 20000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            10000
          ]
        },
        "id": "geometry-square-units-01"
      },
      {
        "prompt": "Переведи 30000 см² в м².",
        "answer": "3",
        "input": "number",
        "hint": "На один квадратный метр приходится десять тысяч квадратных сантиметров.",
        "explanation": "30000 : 10000 = 3 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            30000,
            10000
          ]
        },
        "id": "geometry-square-units-02"
      },
      {
        "prompt": "Сколько квадратных сантиметров в 4 дм²?",
        "answer": "400",
        "input": "number",
        "hint": "Дециметр равен десяти сантиметрам; площадь меняется в сто раз.",
        "explanation": "4 · 10 · 10 = 400 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            100
          ]
        },
        "id": "geometry-square-units-03"
      },
      {
        "prompt": "Сколько квадратных миллиметров в 5 см²?",
        "answer": "500",
        "input": "choice",
        "hint": "Масштаб длины нужно применить дважды.",
        "explanation": "5 · 100 = 500 мм².",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            5,
            100
          ],
          "values": [
            "5000",
            "500",
            "50"
          ]
        },
        "choices": [
          "5000",
          "500",
          "50"
        ],
        "id": "geometry-square-units-04"
      },
      {
        "prompt": "Прямоугольник 6 м на 50 см. Найди площадь в см².",
        "answer": "30000",
        "input": "number",
        "hint": "Приведи обе стороны к сантиметрам.",
        "explanation": "600 · 50 = 30000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "mul",
              6,
              100
            ],
            50
          ]
        },
        "id": "geometry-square-units-05"
      },
      {
        "prompt": "Переведи 700 см² в дм².",
        "answer": "7",
        "input": "number",
        "hint": "Делитель для квадратных единиц тоже квадратный.",
        "explanation": "700 : 100 = 7 дм².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            700,
            100
          ]
        },
        "id": "geometry-square-units-06"
      },
      {
        "prompt": "Сколько квадратных сантиметров в 8 м²?",
        "answer": "80000",
        "input": "number",
        "hint": "Метр содержит сто сантиметров по каждому из двух направлений.",
        "explanation": "8 · 100 · 100 = 80000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            8,
            10000
          ]
        },
        "id": "geometry-square-units-07"
      },
      {
        "prompt": "Переведи 90000 см² в м².",
        "answer": "9",
        "input": "number",
        "hint": "На один квадратный метр приходится десять тысяч квадратных сантиметров.",
        "explanation": "90000 : 10000 = 9 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            90000,
            10000
          ]
        },
        "id": "geometry-square-units-08"
      },
      {
        "prompt": "Сколько квадратных сантиметров в 10 дм²?",
        "answer": "1000",
        "input": "number",
        "hint": "Дециметр равен десяти сантиметрам; площадь меняется в сто раз.",
        "explanation": "10 · 10 · 10 = 1000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            10,
            100
          ]
        },
        "id": "geometry-square-units-09"
      },
      {
        "prompt": "Сколько квадратных миллиметров в 11 см²?",
        "answer": "1100",
        "input": "choice",
        "hint": "Масштаб длины нужно применить дважды.",
        "explanation": "11 · 100 = 1100 мм².",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            11,
            100
          ],
          "values": [
            "11000",
            "1100",
            "110"
          ]
        },
        "choices": [
          "11000",
          "1100",
          "110"
        ],
        "id": "geometry-square-units-10"
      },
      {
        "prompt": "Прямоугольник 12 м на 50 см. Найди площадь в см².",
        "answer": "60000",
        "input": "number",
        "hint": "Приведи обе стороны к сантиметрам.",
        "explanation": "1200 · 50 = 60000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "mul",
              12,
              100
            ],
            50
          ]
        },
        "id": "geometry-square-units-11"
      },
      {
        "prompt": "Переведи 1300 см² в дм².",
        "answer": "13",
        "input": "number",
        "hint": "Делитель для квадратных единиц тоже квадратный.",
        "explanation": "1300 : 100 = 13 дм².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1300,
            100
          ]
        },
        "id": "geometry-square-units-12"
      },
      {
        "prompt": "Сколько квадратных сантиметров в 14 м²?",
        "answer": "140000",
        "input": "number",
        "hint": "Метр содержит сто сантиметров по каждому из двух направлений.",
        "explanation": "14 · 100 · 100 = 140000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            14,
            10000
          ]
        },
        "id": "geometry-square-units-13"
      },
      {
        "prompt": "Переведи 150000 см² в м².",
        "answer": "15",
        "input": "number",
        "hint": "На один квадратный метр приходится десять тысяч квадратных сантиметров.",
        "explanation": "150000 : 10000 = 15 м².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            150000,
            10000
          ]
        },
        "id": "geometry-square-units-14"
      },
      {
        "prompt": "Сколько квадратных сантиметров в 16 дм²?",
        "answer": "1600",
        "input": "number",
        "hint": "Дециметр равен десяти сантиметрам; площадь меняется в сто раз.",
        "explanation": "16 · 10 · 10 = 1600 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            16,
            100
          ]
        },
        "id": "geometry-square-units-15"
      },
      {
        "prompt": "Сколько квадратных миллиметров в 17 см²?",
        "answer": "1700",
        "input": "choice",
        "hint": "Масштаб длины нужно применить дважды.",
        "explanation": "17 · 100 = 1700 мм².",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "mul",
            17,
            100
          ],
          "values": [
            "17000",
            "1700",
            "170"
          ]
        },
        "choices": [
          "17000",
          "1700",
          "170"
        ],
        "id": "geometry-square-units-16"
      },
      {
        "prompt": "Прямоугольник 18 м на 50 см. Найди площадь в см².",
        "answer": "90000",
        "input": "number",
        "hint": "Приведи обе стороны к сантиметрам.",
        "explanation": "1800 · 50 = 90000 см².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            [
              "mul",
              18,
              100
            ],
            50
          ]
        },
        "id": "geometry-square-units-17"
      },
      {
        "prompt": "Переведи 1900 см² в дм².",
        "answer": "19",
        "input": "number",
        "hint": "Делитель для квадратных единиц тоже квадратный.",
        "explanation": "1900 : 100 = 19 дм².",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1900,
            100
          ]
        },
        "id": "geometry-square-units-18"
      }
    ]
  },
  {
    "id": "geometry-angle-measure",
    "group": "geometry",
    "title": "Измеряем угол",
    "goal": "Выбирать шкалу транспортира от правильного нуля и читать величину угла.",
    "covers": [
      "path:grade7-g-core-angle-measure"
    ],
    "prerequisites": [
      "path:pre7-scale-reading"
    ],
    "trainers": [
      {
        "title": "Измеряем угол транспортиром",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-angle-measure",
        "kind": "Модель",
        "instruction": "Совмести центр с вершиной, а ноль — с одной стороной угла.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Название угла и его вершина",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-angle-naming",
        "kind": "По шагам",
        "instruction": "Перед измерением назови вершину и два луча.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "30",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 30°.",
        "oracle": {
          "kind": "expression",
          "expr": 30
        },
        "visual": {
          "type": "angle",
          "degrees": 30,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-01"
      },
      {
        "prompt": "Измерь показанный угол. Начальный луч направлен вправо, поэтому используй ноль справа. Ответ дай в градусах.",
        "answer": "40",
        "input": "number",
        "hint": "Центр шкалы совпадает с вершиной; читай от начального луча.",
        "explanation": "Второй луч проходит через отметку 40°.",
        "oracle": {
          "kind": "expression",
          "expr": 40
        },
        "visual": {
          "type": "angle",
          "degrees": 40,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-02"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "50",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 50°.",
        "oracle": {
          "kind": "expression",
          "expr": 50
        },
        "visual": {
          "type": "angle",
          "degrees": 50,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-03"
      },
      {
        "prompt": "На транспортире угол равен 60°. До развёрнутого угла сколько градусов не хватает?",
        "answer": "120",
        "input": "choice",
        "hint": "Развёрнутый угол содержит 180 градусов.",
        "explanation": "180 − 60 = 120°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            180,
            60
          ],
          "values": [
            "120",
            "60",
            "240"
          ]
        },
        "choices": [
          "120",
          "60",
          "240"
        ],
        "id": "geometry-angle-measure-04"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "70",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 70°.",
        "oracle": {
          "kind": "expression",
          "expr": 70
        },
        "visual": {
          "type": "angle",
          "degrees": 70,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-05"
      },
      {
        "prompt": "Угол измерили как 80°. Его повернули целиком, не меняя лучи друг относительно друга. Какой стала величина?",
        "answer": "80",
        "input": "number",
        "hint": "Поворот не меняет раскрытие между лучами.",
        "explanation": "Угол остался 80°.",
        "oracle": {
          "kind": "expression",
          "expr": 80
        },
        "id": "geometry-angle-measure-06"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "90",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 90°.",
        "oracle": {
          "kind": "expression",
          "expr": 90
        },
        "visual": {
          "type": "angle",
          "degrees": 90,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-07"
      },
      {
        "prompt": "Измерь показанный угол. Начальный луч направлен вправо, поэтому используй ноль справа. Ответ дай в градусах.",
        "answer": "100",
        "input": "number",
        "hint": "Центр шкалы совпадает с вершиной; читай от начального луча.",
        "explanation": "Второй луч проходит через отметку 100°.",
        "oracle": {
          "kind": "expression",
          "expr": 100
        },
        "visual": {
          "type": "angle",
          "degrees": 100,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-08"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "110",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 110°.",
        "oracle": {
          "kind": "expression",
          "expr": 110
        },
        "visual": {
          "type": "angle",
          "degrees": 110,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-09"
      },
      {
        "prompt": "На транспортире угол равен 120°. До развёрнутого угла сколько градусов не хватает?",
        "answer": "60",
        "input": "choice",
        "hint": "Развёрнутый угол содержит 180 градусов.",
        "explanation": "180 − 120 = 60°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            180,
            120
          ],
          "values": [
            "60",
            "120",
            "300"
          ]
        },
        "choices": [
          "60",
          "120",
          "300"
        ],
        "id": "geometry-angle-measure-10"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "130",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 130°.",
        "oracle": {
          "kind": "expression",
          "expr": 130
        },
        "visual": {
          "type": "angle",
          "degrees": 130,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-11"
      },
      {
        "prompt": "Угол измерили как 140°. Его повернули целиком, не меняя лучи друг относительно друга. Какой стала величина?",
        "answer": "140",
        "input": "number",
        "hint": "Поворот не меняет раскрытие между лучами.",
        "explanation": "Угол остался 140°.",
        "oracle": {
          "kind": "expression",
          "expr": 140
        },
        "id": "geometry-angle-measure-12"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "150",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 150°.",
        "oracle": {
          "kind": "expression",
          "expr": 150
        },
        "visual": {
          "type": "angle",
          "degrees": 150,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-13"
      },
      {
        "prompt": "Измерь показанный угол. Начальный луч направлен вправо, поэтому используй ноль справа. Ответ дай в градусах.",
        "answer": "20",
        "input": "number",
        "hint": "Центр шкалы совпадает с вершиной; читай от начального луча.",
        "explanation": "Второй луч проходит через отметку 20°.",
        "oracle": {
          "kind": "expression",
          "expr": 20
        },
        "visual": {
          "type": "angle",
          "degrees": 20,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-14"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "160",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через отметку 160°.",
        "oracle": {
          "kind": "expression",
          "expr": 160
        },
        "visual": {
          "type": "angle",
          "degrees": 160,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-15"
      },
      {
        "prompt": "На транспортире угол равен 50°. До развёрнутого угла сколько градусов не хватает?",
        "answer": "130",
        "input": "choice",
        "hint": "Развёрнутый угол содержит 180 градусов.",
        "explanation": "180 − 50 = 130°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            180,
            50
          ],
          "values": [
            "130",
            "50",
            "230"
          ]
        },
        "choices": [
          "130",
          "50",
          "230"
        ],
        "id": "geometry-angle-measure-16"
      },
      {
        "prompt": "Измерь угол транспортиром на рисунке. Начни читать от 0 справа. Введи градусы.",
        "answer": "60",
        "input": "number",
        "hint": "Следуй той шкале, у которой ноль на начальном правом луче.",
        "explanation": "Второй луч проходит через деление 60°.",
        "oracle": {
          "kind": "expression",
          "expr": 60
        },
        "visual": {
          "type": "angle",
          "degrees": 60,
          "label": "?",
          "protractor": true
        },
        "id": "geometry-angle-measure-17"
      },
      {
        "prompt": "Угол измерили как 70°. Его повернули целиком, не меняя лучи друг относительно друга. Какой стала величина?",
        "answer": "70",
        "input": "number",
        "hint": "Поворот не меняет раскрытие между лучами.",
        "explanation": "Угол остался 70°.",
        "oracle": {
          "kind": "expression",
          "expr": 70
        },
        "id": "geometry-angle-measure-18"
      }
    ]
  },
  {
    "id": "geometry-mass-capacity",
    "group": "geometry",
    "title": "Масса и вместимость",
    "goal": "Переводить граммы, килограммы, тонны, литры и миллилитры в общую единицу.",
    "covers": [
      "path:pre7-mass-capacity"
    ],
    "prerequisites": [
      "oge-basics:units-length-time"
    ],
    "trainers": [
      {
        "title": "Масса и вместимость",
        "href": "/ege-baza/path/index.html#lesson=pre7-mass-capacity",
        "kind": "Модель",
        "instruction": "Запиши величины в общей единице и сравни.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Касса разрядов",
        "href": "/trainers/decimal-cash-trainer.html",
        "kind": "По шагам",
        "instruction": "Собери десятичное число по разрядам перед обратным переводом.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Переведи 2 кг в граммы.",
        "answer": "2000",
        "input": "number",
        "hint": "В килограмме тысяча граммов.",
        "explanation": "2 · 1000 = 2000 г.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            1000
          ]
        },
        "id": "geometry-mass-capacity-01"
      },
      {
        "prompt": "Переведи 300 г в килограммы.",
        "answer": "3/10",
        "input": "number",
        "hint": "Граммы делятся на тысячу.",
        "explanation": "300 : 1000 = 3/10 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            300,
            1000
          ]
        },
        "id": "geometry-mass-capacity-02"
      },
      {
        "prompt": "Сколько миллилитров в 4 л?",
        "answer": "4000",
        "input": "number",
        "hint": "Литр содержит тысячу миллилитров.",
        "explanation": "4 · 1000 = 4000 мл.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            1000
          ]
        },
        "id": "geometry-mass-capacity-03"
      },
      {
        "prompt": "В бутылке 5 л и ещё 250 мл. Сколько всего миллилитров?",
        "answer": "5250",
        "input": "choice",
        "hint": "Сначала переведи литры, затем сложи.",
        "explanation": "5000 + 250 = 5250 мл.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              5,
              1000
            ],
            250
          ],
          "values": [
            "255",
            "750",
            "5250"
          ]
        },
        "choices": [
          "255",
          "750",
          "5250"
        ],
        "id": "geometry-mass-capacity-04"
      },
      {
        "prompt": "Сколько килограммов в 6 т?",
        "answer": "6000",
        "input": "number",
        "hint": "В тонне тысяча килограммов.",
        "explanation": "6 · 1000 = 6000 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            6,
            1000
          ]
        },
        "id": "geometry-mass-capacity-05"
      },
      {
        "prompt": "Из 7 л воды использовали 500 мл. Сколько миллилитров осталось?",
        "answer": "6500",
        "input": "number",
        "hint": "Сначала вырази объёмы в одной единице.",
        "explanation": "7000 − 500 = 6500 мл.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              7,
              1000
            ],
            500
          ]
        },
        "id": "geometry-mass-capacity-06"
      },
      {
        "prompt": "Переведи 8 кг в граммы.",
        "answer": "8000",
        "input": "number",
        "hint": "В килограмме тысяча граммов.",
        "explanation": "8 · 1000 = 8000 г.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            8,
            1000
          ]
        },
        "id": "geometry-mass-capacity-07"
      },
      {
        "prompt": "Переведи 900 г в килограммы.",
        "answer": "9/10",
        "input": "number",
        "hint": "Граммы делятся на тысячу.",
        "explanation": "900 : 1000 = 9/10 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            900,
            1000
          ]
        },
        "id": "geometry-mass-capacity-08"
      },
      {
        "prompt": "Сколько миллилитров в 10 л?",
        "answer": "10000",
        "input": "number",
        "hint": "Литр содержит тысячу миллилитров.",
        "explanation": "10 · 1000 = 10000 мл.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            10,
            1000
          ]
        },
        "id": "geometry-mass-capacity-09"
      },
      {
        "prompt": "В бутылке 11 л и ещё 250 мл. Сколько всего миллилитров?",
        "answer": "11250",
        "input": "choice",
        "hint": "Сначала переведи литры, затем сложи.",
        "explanation": "11000 + 250 = 11250 мл.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              11,
              1000
            ],
            250
          ],
          "values": [
            "261",
            "1350",
            "11250"
          ]
        },
        "choices": [
          "261",
          "1350",
          "11250"
        ],
        "id": "geometry-mass-capacity-10"
      },
      {
        "prompt": "Сколько килограммов в 12 т?",
        "answer": "12000",
        "input": "number",
        "hint": "В тонне тысяча килограммов.",
        "explanation": "12 · 1000 = 12000 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            12,
            1000
          ]
        },
        "id": "geometry-mass-capacity-11"
      },
      {
        "prompt": "Из 13 л воды использовали 500 мл. Сколько миллилитров осталось?",
        "answer": "12500",
        "input": "number",
        "hint": "Сначала вырази объёмы в одной единице.",
        "explanation": "13000 − 500 = 12500 мл.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              13,
              1000
            ],
            500
          ]
        },
        "id": "geometry-mass-capacity-12"
      },
      {
        "prompt": "Переведи 14 кг в граммы.",
        "answer": "14000",
        "input": "number",
        "hint": "В килограмме тысяча граммов.",
        "explanation": "14 · 1000 = 14000 г.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            14,
            1000
          ]
        },
        "id": "geometry-mass-capacity-13"
      },
      {
        "prompt": "Переведи 1500 г в килограммы.",
        "answer": "3/2",
        "input": "number",
        "hint": "Граммы делятся на тысячу.",
        "explanation": "1500 : 1000 = 3/2 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            1500,
            1000
          ]
        },
        "id": "geometry-mass-capacity-14"
      },
      {
        "prompt": "Сколько миллилитров в 16 л?",
        "answer": "16000",
        "input": "number",
        "hint": "Литр содержит тысячу миллилитров.",
        "explanation": "16 · 1000 = 16000 мл.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            16,
            1000
          ]
        },
        "id": "geometry-mass-capacity-15"
      },
      {
        "prompt": "В бутылке 17 л и ещё 250 мл. Сколько всего миллилитров?",
        "answer": "17250",
        "input": "choice",
        "hint": "Сначала переведи литры, затем сложи.",
        "explanation": "17000 + 250 = 17250 мл.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            [
              "mul",
              17,
              1000
            ],
            250
          ],
          "values": [
            "267",
            "1950",
            "17250"
          ]
        },
        "choices": [
          "267",
          "1950",
          "17250"
        ],
        "id": "geometry-mass-capacity-16"
      },
      {
        "prompt": "Сколько килограммов в 18 т?",
        "answer": "18000",
        "input": "number",
        "hint": "В тонне тысяча килограммов.",
        "explanation": "18 · 1000 = 18000 кг.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            18,
            1000
          ]
        },
        "id": "geometry-mass-capacity-17"
      },
      {
        "prompt": "Из 19 л воды использовали 500 мл. Сколько миллилитров осталось?",
        "answer": "18500",
        "input": "number",
        "hint": "Сначала вырази объёмы в одной единице.",
        "explanation": "19000 − 500 = 18500 мл.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            [
              "mul",
              19,
              1000
            ],
            500
          ]
        },
        "id": "geometry-mass-capacity-18"
      }
    ]
  },
  {
    "id": "geometry-segments",
    "group": "geometry",
    "title": "Целый отрезок и части",
    "goal": "Учитывать порядок точек и складывать только соседние части одного отрезка.",
    "covers": [
      "path:grade7-g-segment-order"
    ],
    "prerequisites": [
      "path:pre7-ruler-length"
    ],
    "trainers": [
      {
        "title": "Отрезки: целое и части",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-segment-order",
        "kind": "Модель",
        "instruction": "Покажи, какая точка лежит между какими.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Середина отрезка: подвижная модель",
        "href": "/trainers/jsxgraph-midpoint.html",
        "kind": "По шагам",
        "instruction": "Перемести середину и сравни часть с целым отрезком.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Точки A, B, C идут в этом порядке на прямой. AB=4 см, BC=4 см. Найди AC.",
        "answer": "8",
        "input": "number",
        "hint": "B находится внутри целого отрезка.",
        "explanation": "AC = AB + BC = 8 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            4,
            4
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 8,
          "points": [
            {
              "value": 0,
              "label": "A"
            },
            {
              "value": 4,
              "label": "B"
            },
            {
              "value": 8,
              "label": "C"
            }
          ],
          "step": 1
        },
        "id": "geometry-segments-01"
      },
      {
        "prompt": "B между A и C. AC=10 см, AB=5 см. Найди BC.",
        "answer": "5",
        "input": "number",
        "hint": "Из целого вычти известную часть.",
        "explanation": "BC = 10 − 5 = 5 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            10,
            5
          ]
        },
        "id": "geometry-segments-02"
      },
      {
        "prompt": "Точки A, B, C, D расположены на одной прямой в этом порядке. AB=6, BC=2, CD=4 см. Найди AD.",
        "answer": "12",
        "input": "number",
        "hint": "Целый отрезок состоит из трёх соседних частей.",
        "explanation": "AD = 6 + 2 + 4 = 12 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            6,
            2,
            4
          ]
        },
        "id": "geometry-segments-03"
      },
      {
        "prompt": "B между A и C, AB=7, BC=3 см. Какой длине равен AC?",
        "answer": "10",
        "input": "choice",
        "hint": "Внутренняя точка разбивает отрезок на части.",
        "explanation": "7 + 3 = 10 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            7,
            3
          ],
          "values": [
            "22",
            "10",
            "4"
          ]
        },
        "choices": [
          "22",
          "10",
          "4"
        ],
        "id": "geometry-segments-04"
      },
      {
        "prompt": "AB=8 см. Точка C лежит дальше B на том же луче, BC=4 см. Найди AC.",
        "answer": "12",
        "input": "number",
        "hint": "Оба отрезка идут подряд, без перекрытия.",
        "explanation": "AC = 8 + 4 = 12 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            8,
            4
          ]
        },
        "id": "geometry-segments-05"
      },
      {
        "prompt": "На числовой прямой A имеет координату -7, B имеет 5. Найди AB.",
        "answer": "12",
        "input": "number",
        "hint": "Расстояние — разность большей и меньшей координат.",
        "explanation": "5 − (−7) = 12.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            -7
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -7,
          "max": 5,
          "points": [
            {
              "value": -7,
              "label": "A"
            },
            {
              "value": 5,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-segments-06"
      },
      {
        "prompt": "Точки A, B, C идут в этом порядке на прямой. AB=10 см, BC=2 см. Найди AC.",
        "answer": "12",
        "input": "number",
        "hint": "B находится внутри целого отрезка.",
        "explanation": "AC = AB + BC = 12 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            10,
            2
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 12,
          "points": [
            {
              "value": 0,
              "label": "A"
            },
            {
              "value": 10,
              "label": "B"
            },
            {
              "value": 12,
              "label": "C"
            }
          ],
          "step": 1
        },
        "id": "geometry-segments-07"
      },
      {
        "prompt": "B между A и C. AC=14 см, AB=11 см. Найди BC.",
        "answer": "3",
        "input": "number",
        "hint": "Из целого вычти известную часть.",
        "explanation": "BC = 14 − 11 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            14,
            11
          ]
        },
        "id": "geometry-segments-08"
      },
      {
        "prompt": "Точки A, B, C, D расположены на одной прямой в этом порядке. AB=12, BC=4, CD=10 см. Найди AD.",
        "answer": "26",
        "input": "number",
        "hint": "Целый отрезок состоит из трёх соседних частей.",
        "explanation": "AD = 12 + 4 + 10 = 26 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            12,
            4,
            10
          ]
        },
        "id": "geometry-segments-09"
      },
      {
        "prompt": "B между A и C, AB=13, BC=5 см. Какой длине равен AC?",
        "answer": "18",
        "input": "choice",
        "hint": "Внутренняя точка разбивает отрезок на части.",
        "explanation": "13 + 5 = 18 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            13,
            5
          ],
          "values": [
            "66",
            "18",
            "8"
          ]
        },
        "choices": [
          "66",
          "18",
          "8"
        ],
        "id": "geometry-segments-10"
      },
      {
        "prompt": "AB=14 см. Точка C лежит дальше B на том же луче, BC=2 см. Найди AC.",
        "answer": "16",
        "input": "number",
        "hint": "Оба отрезка идут подряд, без перекрытия.",
        "explanation": "AC = 14 + 2 = 16 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            14,
            2
          ]
        },
        "id": "geometry-segments-11"
      },
      {
        "prompt": "На числовой прямой A имеет координату -13, B имеет 3. Найди AB.",
        "answer": "16",
        "input": "number",
        "hint": "Расстояние — разность большей и меньшей координат.",
        "explanation": "3 − (−13) = 16.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            3,
            -13
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -13,
          "max": 3,
          "points": [
            {
              "value": -13,
              "label": "A"
            },
            {
              "value": 3,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-segments-12"
      },
      {
        "prompt": "Точки A, B, C идут в этом порядке на прямой. AB=16 см, BC=4 см. Найди AC.",
        "answer": "20",
        "input": "number",
        "hint": "B находится внутри целого отрезка.",
        "explanation": "AC = AB + BC = 20 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            16,
            4
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 0,
          "max": 20,
          "points": [
            {
              "value": 0,
              "label": "A"
            },
            {
              "value": 16,
              "label": "B"
            },
            {
              "value": 20,
              "label": "C"
            }
          ],
          "step": 1
        },
        "id": "geometry-segments-13"
      },
      {
        "prompt": "B между A и C. AC=22 см, AB=17 см. Найди BC.",
        "answer": "5",
        "input": "number",
        "hint": "Из целого вычти известную часть.",
        "explanation": "BC = 22 − 17 = 5 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            22,
            17
          ]
        },
        "id": "geometry-segments-14"
      },
      {
        "prompt": "Точки A, B, C, D расположены на одной прямой в этом порядке. AB=18, BC=2, CD=16 см. Найди AD.",
        "answer": "36",
        "input": "number",
        "hint": "Целый отрезок состоит из трёх соседних частей.",
        "explanation": "AD = 18 + 2 + 16 = 36 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            18,
            2,
            16
          ]
        },
        "id": "geometry-segments-15"
      },
      {
        "prompt": "B между A и C, AB=19, BC=3 см. Какой длине равен AC?",
        "answer": "22",
        "input": "choice",
        "hint": "Внутренняя точка разбивает отрезок на части.",
        "explanation": "19 + 3 = 22 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "add",
            19,
            3
          ],
          "values": [
            "58",
            "22",
            "16"
          ]
        },
        "choices": [
          "58",
          "22",
          "16"
        ],
        "id": "geometry-segments-16"
      },
      {
        "prompt": "AB=20 см. Точка C лежит дальше B на том же луче, BC=4 см. Найди AC.",
        "answer": "24",
        "input": "number",
        "hint": "Оба отрезка идут подряд, без перекрытия.",
        "explanation": "AC = 20 + 4 = 24 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            20,
            4
          ]
        },
        "id": "geometry-segments-17"
      },
      {
        "prompt": "На числовой прямой A имеет координату -19, B имеет 5. Найди AB.",
        "answer": "24",
        "input": "number",
        "hint": "Расстояние — разность большей и меньшей координат.",
        "explanation": "5 − (−19) = 24.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            5,
            -19
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": -19,
          "max": 5,
          "points": [
            {
              "value": -19,
              "label": "A"
            },
            {
              "value": 5,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-segments-18"
      }
    ]
  },
  {
    "id": "geometry-midpoint",
    "group": "geometry",
    "title": "Середина отрезка",
    "goal": "Использовать две равные половины и находить координату середины.",
    "covers": [
      "path:grade7-g-midpoint-chain",
      "public:midpoint"
    ],
    "prerequisites": [
      "path:grade7-g-segment-order"
    ],
    "trainers": [
      {
        "title": "Середина отрезка: подвижная модель",
        "href": "/trainers/jsxgraph-midpoint.html",
        "kind": "Модель",
        "instruction": "Двигай концы отрезка и сравни его равные половины.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Середина отрезка и половины",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-midpoint-chain",
        "kind": "По шагам",
        "instruction": "Проследи цепочку середин и каждый раз дели нужный отрезок пополам.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "M — середина AB, AB=8 см. Найди AM.",
        "answer": "4",
        "input": "number",
        "hint": "Середина делит отрезок на две равные части.",
        "explanation": "8 : 2 = 4 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            8,
            2
          ]
        },
        "id": "geometry-midpoint-01"
      },
      {
        "prompt": "M — середина AB, AM=5 см. Найди AB.",
        "answer": "10",
        "input": "number",
        "hint": "Целый отрезок состоит из двух равных половин.",
        "explanation": "2 · 5 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            5
          ]
        },
        "id": "geometry-midpoint-02"
      },
      {
        "prompt": "A имеет координату 4, B — 8. Найди координату середины.",
        "answer": "6",
        "input": "number",
        "hint": "Координата середины равна среднему координат концов.",
        "explanation": "(4 + 8) : 2 = 6.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              4,
              8
            ],
            2
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 4,
          "max": 8,
          "points": [
            {
              "value": 4,
              "label": "A"
            },
            {
              "value": 8,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-midpoint-03"
      },
      {
        "prompt": "M — середина AB, AM=7 см. Какова длина MB?",
        "answer": "7",
        "input": "choice",
        "hint": "Обе части равны по определению середины.",
        "explanation": "MB = AM = 7 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 7,
          "values": [
            "7",
            "14",
            "7/2"
          ]
        },
        "choices": [
          "7",
          "14",
          "7/2"
        ],
        "id": "geometry-midpoint-04"
      },
      {
        "prompt": "AB=32 см. M — середина AB, N — середина AM. Найди AN.",
        "answer": "8",
        "input": "number",
        "hint": "Дважды раздели пополам.",
        "explanation": "32 : 2 : 2 = 8 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "div",
              32,
              2
            ],
            2
          ]
        },
        "id": "geometry-midpoint-05"
      },
      {
        "prompt": "Концы отрезка имеют координаты −7 и 9. Найди координату середины.",
        "answer": "1",
        "input": "number",
        "hint": "Среднее координат работает и для отрицательных чисел.",
        "explanation": "(−7 + 9) : 2 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              -7,
              9
            ],
            2
          ]
        },
        "id": "geometry-midpoint-06"
      },
      {
        "prompt": "M — середина AB, AB=20 см. Найди AM.",
        "answer": "10",
        "input": "number",
        "hint": "Середина делит отрезок на две равные части.",
        "explanation": "20 : 2 = 10 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            20,
            2
          ]
        },
        "id": "geometry-midpoint-07"
      },
      {
        "prompt": "M — середина AB, AM=11 см. Найди AB.",
        "answer": "22",
        "input": "number",
        "hint": "Целый отрезок состоит из двух равных половин.",
        "explanation": "2 · 11 = 22 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            11
          ]
        },
        "id": "geometry-midpoint-08"
      },
      {
        "prompt": "A имеет координату 10, B — 18. Найди координату середины.",
        "answer": "14",
        "input": "number",
        "hint": "Координата середины равна среднему координат концов.",
        "explanation": "(10 + 18) : 2 = 14.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              10,
              18
            ],
            2
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 10,
          "max": 18,
          "points": [
            {
              "value": 10,
              "label": "A"
            },
            {
              "value": 18,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-midpoint-09"
      },
      {
        "prompt": "M — середина AB, AM=13 см. Какова длина MB?",
        "answer": "13",
        "input": "choice",
        "hint": "Обе части равны по определению середины.",
        "explanation": "MB = AM = 13 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 13,
          "values": [
            "13",
            "26",
            "13/2"
          ]
        },
        "choices": [
          "13",
          "26",
          "13/2"
        ],
        "id": "geometry-midpoint-10"
      },
      {
        "prompt": "AB=56 см. M — середина AB, N — середина AM. Найди AN.",
        "answer": "14",
        "input": "number",
        "hint": "Дважды раздели пополам.",
        "explanation": "56 : 2 : 2 = 14 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "div",
              56,
              2
            ],
            2
          ]
        },
        "id": "geometry-midpoint-11"
      },
      {
        "prompt": "Концы отрезка имеют координаты −13 и 15. Найди координату середины.",
        "answer": "1",
        "input": "number",
        "hint": "Среднее координат работает и для отрицательных чисел.",
        "explanation": "(−13 + 15) : 2 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              -13,
              15
            ],
            2
          ]
        },
        "id": "geometry-midpoint-12"
      },
      {
        "prompt": "M — середина AB, AB=32 см. Найди AM.",
        "answer": "16",
        "input": "number",
        "hint": "Середина делит отрезок на две равные части.",
        "explanation": "32 : 2 = 16 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            32,
            2
          ]
        },
        "id": "geometry-midpoint-13"
      },
      {
        "prompt": "M — середина AB, AM=17 см. Найди AB.",
        "answer": "34",
        "input": "number",
        "hint": "Целый отрезок состоит из двух равных половин.",
        "explanation": "2 · 17 = 34 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            17
          ]
        },
        "id": "geometry-midpoint-14"
      },
      {
        "prompt": "A имеет координату 16, B — 20. Найди координату середины.",
        "answer": "18",
        "input": "number",
        "hint": "Координата середины равна среднему координат концов.",
        "explanation": "(16 + 20) : 2 = 18.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              16,
              20
            ],
            2
          ]
        },
        "visual": {
          "type": "numberLine",
          "min": 16,
          "max": 20,
          "points": [
            {
              "value": 16,
              "label": "A"
            },
            {
              "value": 20,
              "label": "B"
            }
          ],
          "step": 1
        },
        "id": "geometry-midpoint-15"
      },
      {
        "prompt": "M — середина AB, AM=19 см. Какова длина MB?",
        "answer": "19",
        "input": "choice",
        "hint": "Обе части равны по определению середины.",
        "explanation": "MB = AM = 19 см.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 19,
          "values": [
            "19",
            "38",
            "19/2"
          ]
        },
        "choices": [
          "19",
          "38",
          "19/2"
        ],
        "id": "geometry-midpoint-16"
      },
      {
        "prompt": "AB=80 см. M — середина AB, N — середина AM. Найди AN.",
        "answer": "20",
        "input": "number",
        "hint": "Дважды раздели пополам.",
        "explanation": "80 : 2 : 2 = 20 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "div",
              80,
              2
            ],
            2
          ]
        },
        "id": "geometry-midpoint-17"
      },
      {
        "prompt": "Концы отрезка имеют координаты −19 и 21. Найди координату середины.",
        "answer": "1",
        "input": "number",
        "hint": "Среднее координат работает и для отрицательных чисел.",
        "explanation": "(−19 + 21) : 2 = 1.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "add",
              -19,
              21
            ],
            2
          ]
        },
        "id": "geometry-midpoint-18"
      }
    ]
  },
  {
    "id": "geometry-angle-naming",
    "group": "geometry",
    "title": "Название угла и вершина",
    "goal": "Читать трёхбуквенное название угла и находить общее начало его сторон.",
    "covers": [
      "path:grade7-g-angle-naming"
    ],
    "prerequisites": [
      "path:grade7-g-segment-order"
    ],
    "trainers": [
      {
        "title": "Название угла и его вершина",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-angle-naming",
        "kind": "Модель",
        "instruction": "Назови вершину прежде, чем стороны угла.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Измеряем угол транспортиром",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-angle-measure",
        "kind": "По шагам",
        "instruction": "Установи центр транспортира на найденную вершину.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Какой буквой обозначена вершина угла ABC?",
        "answer": "B",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — B. Лучи начинаются в B.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "ABC"
        },
        "choices": [
          "B",
          "C",
          "A"
        ],
        "id": "geometry-angle-naming-01"
      },
      {
        "prompt": "Угол записан ∠MLK. Какая буква обозначает его вершину?",
        "answer": "L",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — L. Лучи начинаются в L.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "MLK"
        },
        "choices": [
          "M",
          "K",
          "L"
        ],
        "id": "geometry-angle-naming-02"
      },
      {
        "prompt": "Лучи QP и QR образуют угол. Назови его вершину.",
        "answer": "Q",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — Q. Лучи начинаются в Q.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "PQR"
        },
        "choices": [
          "P",
          "Q",
          "R"
        ],
        "id": "geometry-angle-naming-03"
      },
      {
        "prompt": "Угол DEF образуют два луча с общим началом. Какая буква обозначает общее начало?",
        "answer": "E",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — E. Лучи начинаются в E.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "DEF"
        },
        "choices": [
          "E",
          "F",
          "D"
        ],
        "id": "geometry-angle-naming-04"
      },
      {
        "prompt": "В записи ∠STU какую букву надо поставить на вершине рисунка?",
        "answer": "T",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — T. Лучи начинаются в T.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "STU"
        },
        "choices": [
          "U",
          "S",
          "T"
        ],
        "id": "geometry-angle-naming-05"
      },
      {
        "prompt": "Угол записали в обратном порядке: ∠ZYX. Назови его вершину.",
        "answer": "Y",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — Y. Лучи начинаются в Y.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "ZYX"
        },
        "choices": [
          "X",
          "Y",
          "Z"
        ],
        "id": "geometry-angle-naming-06"
      },
      {
        "prompt": "Какой буквой обозначена вершина угла FGH?",
        "answer": "G",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — G. Лучи начинаются в G.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "FGH"
        },
        "choices": [
          "G",
          "H",
          "F"
        ],
        "id": "geometry-angle-naming-07"
      },
      {
        "prompt": "Угол записан ∠XWV. Какая буква обозначает его вершину?",
        "answer": "W",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — W. Лучи начинаются в W.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "XWV"
        },
        "choices": [
          "X",
          "V",
          "W"
        ],
        "id": "geometry-angle-naming-08"
      },
      {
        "prompt": "Лучи CB и CD образуют угол. Назови его вершину.",
        "answer": "C",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — C. Лучи начинаются в C.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "BCD"
        },
        "choices": [
          "B",
          "C",
          "D"
        ],
        "id": "geometry-angle-naming-09"
      },
      {
        "prompt": "Угол HJK образуют два луча с общим началом. Какая буква обозначает общее начало?",
        "answer": "J",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — J. Лучи начинаются в J.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "HJK"
        },
        "choices": [
          "J",
          "K",
          "H"
        ],
        "id": "geometry-angle-naming-10"
      },
      {
        "prompt": "В записи ∠LMN какую букву надо поставить на вершине рисунка?",
        "answer": "M",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — M. Лучи начинаются в M.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "LMN"
        },
        "choices": [
          "N",
          "L",
          "M"
        ],
        "id": "geometry-angle-naming-11"
      },
      {
        "prompt": "Угол записали в обратном порядке: ∠SRP. Назови его вершину.",
        "answer": "R",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — R. Лучи начинаются в R.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "SRP"
        },
        "choices": [
          "P",
          "R",
          "S"
        ],
        "id": "geometry-angle-naming-12"
      },
      {
        "prompt": "Какой буквой обозначена вершина угла UVW?",
        "answer": "V",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — V. Лучи начинаются в V.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "UVW"
        },
        "choices": [
          "V",
          "W",
          "U"
        ],
        "id": "geometry-angle-naming-13"
      },
      {
        "prompt": "Угол записан ∠DCA. Какая буква обозначает его вершину?",
        "answer": "C",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — C. Лучи начинаются в C.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "DCA"
        },
        "choices": [
          "D",
          "A",
          "C"
        ],
        "id": "geometry-angle-naming-14"
      },
      {
        "prompt": "Лучи NK и NP образуют угол. Назови его вершину.",
        "answer": "N",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — N. Лучи начинаются в N.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "KNP"
        },
        "choices": [
          "K",
          "N",
          "P"
        ],
        "id": "geometry-angle-naming-15"
      },
      {
        "prompt": "Угол MRS образуют два луча с общим началом. Какая буква обозначает общее начало?",
        "answer": "R",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — R. Лучи начинаются в R.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "MRS"
        },
        "choices": [
          "R",
          "S",
          "M"
        ],
        "id": "geometry-angle-naming-16"
      },
      {
        "prompt": "В записи ∠ADE какую букву надо поставить на вершине рисунка?",
        "answer": "D",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — D. Лучи начинаются в D.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "ADE"
        },
        "choices": [
          "E",
          "A",
          "D"
        ],
        "id": "geometry-angle-naming-17"
      },
      {
        "prompt": "Угол записали в обратном порядке: ∠HFC. Назови его вершину.",
        "answer": "F",
        "input": "choice",
        "hint": "В названии угла вершина находится в середине. Для лучей это их общее начало.",
        "explanation": "Вершина — F. Лучи начинаются в F.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "angle-vertex",
          "name": "HFC"
        },
        "choices": [
          "C",
          "F",
          "H"
        ],
        "id": "geometry-angle-naming-18"
      }
    ]
  },
  {
    "id": "geometry-angle-parts",
    "group": "geometry",
    "title": "Угол и его части",
    "goal": "Складывать соседние части угла и восстанавливать неизвестную часть.",
    "covers": [
      "path:grade7-g-angle-addition"
    ],
    "prerequisites": [
      "path:grade7-g-core-angle-measure"
    ],
    "trainers": [
      {
        "title": "Сложение и вычитание углов",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-angle-addition",
        "kind": "Модель",
        "instruction": "Отметь внутренний луч и две соседние части.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Строим биссектрису угла",
        "href": "/trainers/bisector-trainer-v2.html",
        "kind": "По шагам",
        "instruction": "Сравни общий угол с равными половинами.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Луч внутри угла разделил его на 16° и 7°. Найди весь угол.",
        "answer": "23",
        "input": "number",
        "hint": "Соседние части внутри угла складываются.",
        "explanation": "16 + 7 = 23°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            16,
            7
          ]
        },
        "id": "geometry-angle-parts-01"
      },
      {
        "prompt": "Угол 27° разделён внутренним лучом. Первая часть 19°. Найди вторую.",
        "answer": "8",
        "input": "number",
        "hint": "Из всего угла вычти известную часть.",
        "explanation": "27 − 19 = 8°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            27,
            19
          ]
        },
        "id": "geometry-angle-parts-02"
      },
      {
        "prompt": "Один из смежных углов 22°. Найди другой.",
        "answer": "158",
        "input": "number",
        "hint": "Смежные углы вместе дают развёрнутый.",
        "explanation": "180 − 22 = 158°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            180,
            22
          ]
        },
        "id": "geometry-angle-parts-03"
      },
      {
        "prompt": "Прямой угол разделён на 25° и неизвестную часть. Найди часть.",
        "answer": "65",
        "input": "choice",
        "hint": "Прямой угол равен 90 градусам.",
        "explanation": "90 − 25 = 65°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            90,
            25
          ],
          "values": [
            "25",
            "65",
            "115"
          ]
        },
        "choices": [
          "25",
          "65",
          "115"
        ],
        "id": "geometry-angle-parts-04"
      },
      {
        "prompt": "Два соседних угла внутри одного имеют величины 28° и 11°. На сколько первый больше второго?",
        "answer": "17",
        "input": "number",
        "hint": "Сравнение «на сколько» требует вычитания.",
        "explanation": "28 − 11 = 17°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            28,
            11
          ]
        },
        "id": "geometry-angle-parts-05"
      },
      {
        "prompt": "Весь угол 43°, одна часть 12°. Какова другая?",
        "answer": "31",
        "input": "number",
        "hint": "Проверь, что сумма частей вернёт весь угол.",
        "explanation": "43 − 12 = 31°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            43,
            12
          ]
        },
        "id": "geometry-angle-parts-06"
      },
      {
        "prompt": "Луч внутри угла разделил его на 34° и 13°. Найди весь угол.",
        "answer": "47",
        "input": "number",
        "hint": "Соседние части внутри угла складываются.",
        "explanation": "34 + 13 = 47°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            34,
            13
          ]
        },
        "id": "geometry-angle-parts-07"
      },
      {
        "prompt": "Угол 51° разделён внутренним лучом. Первая часть 37°. Найди вторую.",
        "answer": "14",
        "input": "number",
        "hint": "Из всего угла вычти известную часть.",
        "explanation": "51 − 37 = 14°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            51,
            37
          ]
        },
        "id": "geometry-angle-parts-08"
      },
      {
        "prompt": "Один из смежных углов 40°. Найди другой.",
        "answer": "140",
        "input": "number",
        "hint": "Смежные углы вместе дают развёрнутый.",
        "explanation": "180 − 40 = 140°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            180,
            40
          ]
        },
        "id": "geometry-angle-parts-09"
      },
      {
        "prompt": "Прямой угол разделён на 43° и неизвестную часть. Найди часть.",
        "answer": "47",
        "input": "choice",
        "hint": "Прямой угол равен 90 градусам.",
        "explanation": "90 − 43 = 47°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            90,
            43
          ],
          "values": [
            "43",
            "47",
            "133"
          ]
        },
        "choices": [
          "43",
          "47",
          "133"
        ],
        "id": "geometry-angle-parts-10"
      },
      {
        "prompt": "Два соседних угла внутри одного имеют величины 46° и 17°. На сколько первый больше второго?",
        "answer": "29",
        "input": "number",
        "hint": "Сравнение «на сколько» требует вычитания.",
        "explanation": "46 − 17 = 29°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            46,
            17
          ]
        },
        "id": "geometry-angle-parts-11"
      },
      {
        "prompt": "Весь угол 67°, одна часть 18°. Какова другая?",
        "answer": "49",
        "input": "number",
        "hint": "Проверь, что сумма частей вернёт весь угол.",
        "explanation": "67 − 18 = 49°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            67,
            18
          ]
        },
        "id": "geometry-angle-parts-12"
      },
      {
        "prompt": "Луч внутри угла разделил его на 52° и 19°. Найди весь угол.",
        "answer": "71",
        "input": "number",
        "hint": "Соседние части внутри угла складываются.",
        "explanation": "52 + 19 = 71°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "add",
            52,
            19
          ]
        },
        "id": "geometry-angle-parts-13"
      },
      {
        "prompt": "Угол 75° разделён внутренним лучом. Первая часть 55°. Найди вторую.",
        "answer": "20",
        "input": "number",
        "hint": "Из всего угла вычти известную часть.",
        "explanation": "75 − 55 = 20°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            75,
            55
          ]
        },
        "id": "geometry-angle-parts-14"
      },
      {
        "prompt": "Один из смежных углов 58°. Найди другой.",
        "answer": "122",
        "input": "number",
        "hint": "Смежные углы вместе дают развёрнутый.",
        "explanation": "180 − 58 = 122°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            180,
            58
          ]
        },
        "id": "geometry-angle-parts-15"
      },
      {
        "prompt": "Прямой угол разделён на 61° и неизвестную часть. Найди часть.",
        "answer": "29",
        "input": "choice",
        "hint": "Прямой угол равен 90 градусам.",
        "explanation": "90 − 61 = 29°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "sub",
            90,
            61
          ],
          "values": [
            "61",
            "29",
            "151"
          ]
        },
        "choices": [
          "61",
          "29",
          "151"
        ],
        "id": "geometry-angle-parts-16"
      },
      {
        "prompt": "Два соседних угла внутри одного имеют величины 64° и 23°. На сколько первый больше второго?",
        "answer": "41",
        "input": "number",
        "hint": "Сравнение «на сколько» требует вычитания.",
        "explanation": "64 − 23 = 41°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            64,
            23
          ]
        },
        "id": "geometry-angle-parts-17"
      },
      {
        "prompt": "Весь угол 91°, одна часть 24°. Какова другая?",
        "answer": "67",
        "input": "number",
        "hint": "Проверь, что сумма частей вернёт весь угол.",
        "explanation": "91 − 24 = 67°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            91,
            24
          ]
        },
        "id": "geometry-angle-parts-18"
      }
    ]
  },
  {
    "id": "geometry-bisector",
    "group": "geometry",
    "title": "Биссектриса угла",
    "goal": "Связывать биссектрису с равными половинами и проверять, действительно ли луч делит угол поровну.",
    "covers": [
      "path:grade7-g-angle-bisector",
      "public:bisector"
    ],
    "prerequisites": [
      "path:grade7-g-angle-addition"
    ],
    "trainers": [
      {
        "title": "Строим биссектрису угла",
        "href": "/trainers/bisector-trainer-v2.html",
        "kind": "Модель",
        "instruction": "Построй луч и сравни два полученных угла.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Биссектриса: две равные части",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-angle-bisector",
        "kind": "По шагам",
        "instruction": "Восстанови половину или целый угол по определению.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Биссектриса делит угол 44°. Найди одну половину.",
        "answer": "22",
        "input": "number",
        "hint": "Биссектриса делит угол на равные части.",
        "explanation": "44 : 2 = 22°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            44,
            2
          ]
        },
        "id": "geometry-bisector-01"
      },
      {
        "prompt": "Между стороной угла и его биссектрисой 23°. Найди весь угол.",
        "answer": "46",
        "input": "number",
        "hint": "Данная часть — половина угла.",
        "explanation": "2 · 23 = 46°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            23
          ]
        },
        "id": "geometry-bisector-02"
      },
      {
        "prompt": "Биссектриса делит угол 58°. Одна часть обозначена x. Найди x.",
        "answer": "29",
        "input": "number",
        "hint": "Две равные части составляют исходный угол.",
        "explanation": "58 : 2 = 29°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            58,
            2
          ]
        },
        "id": "geometry-bisector-03"
      },
      {
        "prompt": "В угле 50° провели биссектрису. Какая величина половины верна?",
        "answer": "25",
        "input": "choice",
        "hint": "Две равные части должны дать исходный угол.",
        "explanation": "25 + 25 = 50°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            50,
            2
          ],
          "values": [
            "25",
            "50",
            "26"
          ]
        },
        "choices": [
          "25",
          "50",
          "26"
        ],
        "id": "geometry-bisector-04"
      },
      {
        "prompt": "Угол 52° разделили на 25° и 27°. На сколько отличаются части?",
        "answer": "2",
        "input": "number",
        "hint": "Равенство частей — обязательное условие биссектрисы.",
        "explanation": "27 − 25 = 2°. Этот луч не биссектриса.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            27,
            25
          ]
        },
        "id": "geometry-bisector-05"
      },
      {
        "prompt": "В угле 68° провели биссектрису. Одну из полученных половин угла снова разделили пополам. Найди величину одного из двух новых углов.",
        "answer": "17",
        "input": "number",
        "hint": "Деление пополам выполняется дважды.",
        "explanation": "68 : 2 : 2 = 17°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "div",
              68,
              2
            ],
            2
          ]
        },
        "id": "geometry-bisector-06"
      },
      {
        "prompt": "Биссектриса делит угол 56°. Найди одну половину.",
        "answer": "28",
        "input": "number",
        "hint": "Биссектриса делит угол на равные части.",
        "explanation": "56 : 2 = 28°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            56,
            2
          ]
        },
        "id": "geometry-bisector-07"
      },
      {
        "prompt": "Между стороной угла и его биссектрисой 29°. Найди весь угол.",
        "answer": "58",
        "input": "number",
        "hint": "Данная часть — половина угла.",
        "explanation": "2 · 29 = 58°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            29
          ]
        },
        "id": "geometry-bisector-08"
      },
      {
        "prompt": "Биссектриса делит угол 70°. Одна часть обозначена x. Найди x.",
        "answer": "35",
        "input": "number",
        "hint": "Две равные части составляют исходный угол.",
        "explanation": "70 : 2 = 35°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            70,
            2
          ]
        },
        "id": "geometry-bisector-09"
      },
      {
        "prompt": "В угле 62° провели биссектрису. Какая величина половины верна?",
        "answer": "31",
        "input": "choice",
        "hint": "Две равные части должны дать исходный угол.",
        "explanation": "31 + 31 = 62°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            62,
            2
          ],
          "values": [
            "31",
            "62",
            "32"
          ]
        },
        "choices": [
          "31",
          "62",
          "32"
        ],
        "id": "geometry-bisector-10"
      },
      {
        "prompt": "Угол 64° разделили на 31° и 33°. На сколько отличаются части?",
        "answer": "2",
        "input": "number",
        "hint": "Равенство частей — обязательное условие биссектрисы.",
        "explanation": "33 − 31 = 2°. Этот луч не биссектриса.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            33,
            31
          ]
        },
        "id": "geometry-bisector-11"
      },
      {
        "prompt": "В угле 92° провели биссектрису. Одну из полученных половин угла снова разделили пополам. Найди величину одного из двух новых углов.",
        "answer": "23",
        "input": "number",
        "hint": "Деление пополам выполняется дважды.",
        "explanation": "92 : 2 : 2 = 23°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "div",
              92,
              2
            ],
            2
          ]
        },
        "id": "geometry-bisector-12"
      },
      {
        "prompt": "Биссектриса делит угол 68°. Найди одну половину.",
        "answer": "34",
        "input": "number",
        "hint": "Биссектриса делит угол на равные части.",
        "explanation": "68 : 2 = 34°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            68,
            2
          ]
        },
        "id": "geometry-bisector-13"
      },
      {
        "prompt": "Между стороной угла и его биссектрисой 35°. Найди весь угол.",
        "answer": "70",
        "input": "number",
        "hint": "Данная часть — половина угла.",
        "explanation": "2 · 35 = 70°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            35
          ]
        },
        "id": "geometry-bisector-14"
      },
      {
        "prompt": "Биссектриса делит угол 82°. Одна часть обозначена x. Найди x.",
        "answer": "41",
        "input": "number",
        "hint": "Две равные части составляют исходный угол.",
        "explanation": "82 : 2 = 41°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            82,
            2
          ]
        },
        "id": "geometry-bisector-15"
      },
      {
        "prompt": "В угле 74° провели биссектрису. Какая величина половины верна?",
        "answer": "37",
        "input": "choice",
        "hint": "Две равные части должны дать исходный угол.",
        "explanation": "37 + 37 = 74°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "div",
            74,
            2
          ],
          "values": [
            "37",
            "74",
            "38"
          ]
        },
        "choices": [
          "37",
          "74",
          "38"
        ],
        "id": "geometry-bisector-16"
      },
      {
        "prompt": "Угол 76° разделили на 37° и 39°. На сколько отличаются части?",
        "answer": "2",
        "input": "number",
        "hint": "Равенство частей — обязательное условие биссектрисы.",
        "explanation": "39 − 37 = 2°. Этот луч не биссектриса.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            39,
            37
          ]
        },
        "id": "geometry-bisector-17"
      },
      {
        "prompt": "В угле 116° провели биссектрису. Одну из полученных половин угла снова разделили пополам. Найди величину одного из двух новых углов.",
        "answer": "29",
        "input": "number",
        "hint": "Деление пополам выполняется дважды.",
        "explanation": "116 : 2 : 2 = 29°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "div",
              116,
              2
            ],
            2
          ]
        },
        "id": "geometry-bisector-18"
      }
    ]
  },
  {
    "id": "geometry-perpendicular",
    "group": "geometry",
    "title": "Перпендикулярные прямые",
    "goal": "Связывать перпендикулярность с прямым углом и вычислять его части.",
    "covers": [
      "path:grade7-g-core-perpendicular"
    ],
    "prerequisites": [
      "path:grade7-g-core-angle-measure"
    ],
    "trainers": [
      {
        "title": "Перпендикулярные прямые",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-perpendicular",
        "kind": "Модель",
        "instruction": "Построй пересечение под прямым углом и проверь все углы.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Измеряем угол транспортиром",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-angle-measure",
        "kind": "По шагам",
        "instruction": "Измерь угол от правильного нуля и сравни с 90°.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Прямой угол разделили на 12° и неизвестную часть. Найди эту часть.",
        "answer": "78",
        "input": "number",
        "hint": "Весь прямой угол равен 90 градусам.",
        "explanation": "90 − 12 = 78°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            12
          ]
        },
        "id": "geometry-perpendicular-01"
      },
      {
        "prompt": "Лучи перпендикулярны. Между первым лучом и внутренним лучом 16°. Найди угол между внутренним и вторым лучом.",
        "answer": "74",
        "input": "number",
        "hint": "Из прямого угла вычти известную часть.",
        "explanation": "90 − 16 = 74°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            16
          ]
        },
        "id": "geometry-perpendicular-02"
      },
      {
        "prompt": "Для поворота из направления одного перпендикулярного луча в другой осталось 14°. На сколько градусов уже повернулись?",
        "answer": "76",
        "input": "number",
        "hint": "Полный нужный поворот составляет прямой угол.",
        "explanation": "90 − 14 = 76°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            14
          ]
        },
        "id": "geometry-perpendicular-03"
      },
      {
        "prompt": "Из углов 90°, 105° и 75° какой образуют перпендикулярные прямые?",
        "answer": "90",
        "input": "choice",
        "hint": "Перпендикулярные прямые образуют прямой угол.",
        "explanation": "Прямой угол равен 90°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 90,
          "values": [
            "105",
            "75",
            "90"
          ]
        },
        "choices": [
          "105",
          "75",
          "90"
        ],
        "id": "geometry-perpendicular-04"
      },
      {
        "prompt": "Угол между двумя лучами 106°. На сколько градусов его надо уменьшить до прямого?",
        "answer": "16",
        "input": "number",
        "hint": "Сравни имеющуюся величину с 90 градусами.",
        "explanation": "106 − 90 = 16°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            106,
            90
          ]
        },
        "id": "geometry-perpendicular-05"
      },
      {
        "prompt": "Угол 73°. На сколько градусов его надо увеличить, чтобы стороны стали перпендикулярными?",
        "answer": "17",
        "input": "number",
        "hint": "Найди недостающую часть до 90 градусов.",
        "explanation": "90 − 73 = 17°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            73
          ]
        },
        "id": "geometry-perpendicular-06"
      },
      {
        "prompt": "Прямой угол разделили на 18° и неизвестную часть. Найди эту часть.",
        "answer": "72",
        "input": "number",
        "hint": "Весь прямой угол равен 90 градусам.",
        "explanation": "90 − 18 = 72°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            18
          ]
        },
        "id": "geometry-perpendicular-07"
      },
      {
        "prompt": "Лучи перпендикулярны. Между первым лучом и внутренним лучом 22°. Найди угол между внутренним и вторым лучом.",
        "answer": "68",
        "input": "number",
        "hint": "Из прямого угла вычти известную часть.",
        "explanation": "90 − 22 = 68°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            22
          ]
        },
        "id": "geometry-perpendicular-08"
      },
      {
        "prompt": "Для поворота из направления одного перпендикулярного луча в другой осталось 20°. На сколько градусов уже повернулись?",
        "answer": "70",
        "input": "number",
        "hint": "Полный нужный поворот составляет прямой угол.",
        "explanation": "90 − 20 = 70°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            20
          ]
        },
        "id": "geometry-perpendicular-09"
      },
      {
        "prompt": "Из углов 90°, 111° и 69° какой образуют перпендикулярные прямые?",
        "answer": "90",
        "input": "choice",
        "hint": "Перпендикулярные прямые образуют прямой угол.",
        "explanation": "Прямой угол равен 90°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 90,
          "values": [
            "111",
            "69",
            "90"
          ]
        },
        "choices": [
          "111",
          "69",
          "90"
        ],
        "id": "geometry-perpendicular-10"
      },
      {
        "prompt": "Угол между двумя лучами 112°. На сколько градусов его надо уменьшить до прямого?",
        "answer": "22",
        "input": "number",
        "hint": "Сравни имеющуюся величину с 90 градусами.",
        "explanation": "112 − 90 = 22°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            112,
            90
          ]
        },
        "id": "geometry-perpendicular-11"
      },
      {
        "prompt": "Угол 67°. На сколько градусов его надо увеличить, чтобы стороны стали перпендикулярными?",
        "answer": "23",
        "input": "number",
        "hint": "Найди недостающую часть до 90 градусов.",
        "explanation": "90 − 67 = 23°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            67
          ]
        },
        "id": "geometry-perpendicular-12"
      },
      {
        "prompt": "Прямой угол разделили на 24° и неизвестную часть. Найди эту часть.",
        "answer": "66",
        "input": "number",
        "hint": "Весь прямой угол равен 90 градусам.",
        "explanation": "90 − 24 = 66°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            24
          ]
        },
        "id": "geometry-perpendicular-13"
      },
      {
        "prompt": "Лучи перпендикулярны. Между первым лучом и внутренним лучом 28°. Найди угол между внутренним и вторым лучом.",
        "answer": "62",
        "input": "number",
        "hint": "Из прямого угла вычти известную часть.",
        "explanation": "90 − 28 = 62°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            28
          ]
        },
        "id": "geometry-perpendicular-14"
      },
      {
        "prompt": "Для поворота из направления одного перпендикулярного луча в другой осталось 26°. На сколько градусов уже повернулись?",
        "answer": "64",
        "input": "number",
        "hint": "Полный нужный поворот составляет прямой угол.",
        "explanation": "90 − 26 = 64°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            26
          ]
        },
        "id": "geometry-perpendicular-15"
      },
      {
        "prompt": "Из углов 90°, 117° и 63° какой образуют перпендикулярные прямые?",
        "answer": "90",
        "input": "choice",
        "hint": "Перпендикулярные прямые образуют прямой угол.",
        "explanation": "Прямой угол равен 90°.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 90,
          "values": [
            "117",
            "63",
            "90"
          ]
        },
        "choices": [
          "117",
          "63",
          "90"
        ],
        "id": "geometry-perpendicular-16"
      },
      {
        "prompt": "Угол между двумя лучами 118°. На сколько градусов его надо уменьшить до прямого?",
        "answer": "28",
        "input": "number",
        "hint": "Сравни имеющуюся величину с 90 градусами.",
        "explanation": "118 − 90 = 28°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            118,
            90
          ]
        },
        "id": "geometry-perpendicular-17"
      },
      {
        "prompt": "Угол 61°. На сколько градусов его надо увеличить, чтобы стороны стали перпендикулярными?",
        "answer": "29",
        "input": "number",
        "hint": "Найди недостающую часть до 90 градусов.",
        "explanation": "90 − 61 = 29°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "sub",
            90,
            61
          ]
        },
        "id": "geometry-perpendicular-18"
      }
    ]
  },
  {
    "id": "geometry-sas",
    "group": "geometry",
    "title": "Две стороны и угол между ними",
    "goal": "Выбирать именно угол между данными сторонами и читать соответствие равных треугольников.",
    "covers": [
      "path:grade7-g-core-sas"
    ],
    "prerequisites": [
      "path:grade7-g-angle-naming"
    ],
    "trainers": [
      {
        "title": "Первый признак равенства: две стороны и угол",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-sas",
        "kind": "Модель",
        "instruction": "Отметь две стороны и угол между ними в каждой фигуре.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Собери доказательство свойства равнобедренного треугольника",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-practice-isosceles-proof",
        "kind": "По шагам",
        "instruction": "Найди, где в доказательстве используются три условия первого признака.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "В треугольниках ABC и DEF даны AB = DE, AC = DF. Какое равенство углов дополнит первый признак равенства?",
        "answer": "∠BAC = ∠EDF",
        "input": "choice",
        "hint": "Нужен угол между двумя указанными сторонами в каждом треугольнике.",
        "explanation": "У сторон AB, AC общая вершина A; у соответствующих сторон общая вершина D. Поэтому нужны ∠BAC и ∠EDF.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "sas-included-angle",
          "sidesA": [
            "AB",
            "AC"
          ],
          "sidesB": [
            "DE",
            "DF"
          ],
          "triangles": [
            "ABC",
            "DEF"
          ]
        },
        "choices": [
          "∠ACB = ∠DFE",
          "∠BAC = ∠EDF",
          "∠ABC = ∠DEF"
        ],
        "id": "geometry-sas-01"
      },
      {
        "prompt": "Треугольники KLM и PQR равны по двум сторонам и углу между ними; вершины соответствуют по порядку. ∠LKM = 28°. Чему равен ∠QPR?",
        "answer": "28",
        "input": "number",
        "hint": "Соответствующие углы равных треугольников равны.",
        "explanation": "∠QPR = ∠LKM = 28°.",
        "oracle": {
          "kind": "expression",
          "expr": 28
        },
        "id": "geometry-sas-02"
      },
      {
        "prompt": "При доказанном равенстве треугольников PQR и KLM по порядку вершин сторона PQ = 9 см. Найди KL.",
        "answer": "9",
        "input": "number",
        "hint": "Запись равенства треугольников задаёт соответствие вершин.",
        "explanation": "PQ соответствует KL, поэтому длина 9 см.",
        "oracle": {
          "kind": "expression",
          "expr": 9
        },
        "id": "geometry-sas-03"
      },
      {
        "prompt": "В треугольниках DEF и ABC даны DE = AB, DF = AC. Какое равенство углов дополнит первый признак равенства?",
        "answer": "∠EDF = ∠BAC",
        "input": "choice",
        "hint": "Нужен угол между двумя указанными сторонами в каждом треугольнике.",
        "explanation": "У сторон DE, DF общая вершина D; у соответствующих сторон общая вершина A. Поэтому нужны ∠EDF и ∠BAC.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "sas-included-angle",
          "sidesA": [
            "DE",
            "DF"
          ],
          "sidesB": [
            "AB",
            "AC"
          ],
          "triangles": [
            "DEF",
            "ABC"
          ]
        },
        "choices": [
          "∠DFE = ∠ACB",
          "∠EDF = ∠BAC",
          "∠DEF = ∠ABC"
        ],
        "id": "geometry-sas-04"
      },
      {
        "prompt": "В равных треугольниках STU и XYZ соответствующие стороны имеют длины x + 6 и 15 см. Найди x.",
        "answer": "9",
        "input": "number",
        "hint": "Приравняй длины соответствующих сторон.",
        "explanation": "x + 6 = 15; x = 9.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 6,
          "c": 15
        },
        "id": "geometry-sas-05"
      },
      {
        "prompt": "В треугольниках XYZ и STU равны две стороны и углы между ними. Периметр первого 33 см. Найди периметр второго.",
        "answer": "33",
        "input": "number",
        "hint": "Первый признак даёт равенство всех соответствующих сторон.",
        "explanation": "Равные треугольники имеют равные периметры: 33 см.",
        "oracle": {
          "kind": "expression",
          "expr": 33
        },
        "id": "geometry-sas-06"
      },
      {
        "prompt": "В треугольниках FGH и KLP даны FG = KL, FH = KP. Какое равенство углов дополнит первый признак равенства?",
        "answer": "∠GFH = ∠LKP",
        "input": "choice",
        "hint": "Нужен угол между двумя указанными сторонами в каждом треугольнике.",
        "explanation": "У сторон FG, FH общая вершина F; у соответствующих сторон общая вершина K. Поэтому нужны ∠GFH и ∠LKP.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "sas-included-angle",
          "sidesA": [
            "FG",
            "FH"
          ],
          "sidesB": [
            "KL",
            "KP"
          ],
          "triangles": [
            "FGH",
            "KLP"
          ]
        },
        "choices": [
          "∠FHG = ∠KPL",
          "∠GFH = ∠LKP",
          "∠FGH = ∠KLP"
        ],
        "id": "geometry-sas-07"
      },
      {
        "prompt": "Треугольники VWX и ABC равны по двум сторонам и углу между ними; вершины соответствуют по порядку. ∠WVX = 34°. Чему равен ∠BAC?",
        "answer": "34",
        "input": "number",
        "hint": "Соответствующие углы равных треугольников равны.",
        "explanation": "∠BAC = ∠WVX = 34°.",
        "oracle": {
          "kind": "expression",
          "expr": 34
        },
        "id": "geometry-sas-08"
      },
      {
        "prompt": "При доказанном равенстве треугольников BCD и RST по порядку вершин сторона BC = 15 см. Найди RS.",
        "answer": "15",
        "input": "number",
        "hint": "Запись равенства треугольников задаёт соответствие вершин.",
        "explanation": "BC соответствует RS, поэтому длина 15 см.",
        "oracle": {
          "kind": "expression",
          "expr": 15
        },
        "id": "geometry-sas-09"
      },
      {
        "prompt": "В треугольниках HJK и PQR даны HJ = PQ, HK = PR. Какое равенство углов дополнит первый признак равенства?",
        "answer": "∠JHK = ∠QPR",
        "input": "choice",
        "hint": "Нужен угол между двумя указанными сторонами в каждом треугольнике.",
        "explanation": "У сторон HJ, HK общая вершина H; у соответствующих сторон общая вершина P. Поэтому нужны ∠JHK и ∠QPR.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "sas-included-angle",
          "sidesA": [
            "HJ",
            "HK"
          ],
          "sidesB": [
            "PQ",
            "PR"
          ],
          "triangles": [
            "HJK",
            "PQR"
          ]
        },
        "choices": [
          "∠HKJ = ∠PRQ",
          "∠JHK = ∠QPR",
          "∠HJK = ∠PQR"
        ],
        "id": "geometry-sas-10"
      },
      {
        "prompt": "В равных треугольниках LMN и ABC соответствующие стороны имеют длины x + 12 и 27 см. Найди x.",
        "answer": "15",
        "input": "number",
        "hint": "Приравняй длины соответствующих сторон.",
        "explanation": "x + 12 = 27; x = 15.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 12,
          "c": 27
        },
        "id": "geometry-sas-11"
      },
      {
        "prompt": "В треугольниках PRS и DEF равны две стороны и углы между ними. Периметр первого 51 см. Найди периметр второго.",
        "answer": "51",
        "input": "number",
        "hint": "Первый признак даёт равенство всех соответствующих сторон.",
        "explanation": "Равные треугольники имеют равные периметры: 51 см.",
        "oracle": {
          "kind": "expression",
          "expr": 51
        },
        "id": "geometry-sas-12"
      },
      {
        "prompt": "В треугольниках UVW и ABC даны UV = AB, UW = AC. Какое равенство углов дополнит первый признак равенства?",
        "answer": "∠VUW = ∠BAC",
        "input": "choice",
        "hint": "Нужен угол между двумя указанными сторонами в каждом треугольнике.",
        "explanation": "У сторон UV, UW общая вершина U; у соответствующих сторон общая вершина A. Поэтому нужны ∠VUW и ∠BAC.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "sas-included-angle",
          "sidesA": [
            "UV",
            "UW"
          ],
          "sidesB": [
            "AB",
            "AC"
          ],
          "triangles": [
            "UVW",
            "ABC"
          ]
        },
        "choices": [
          "∠UWV = ∠ACB",
          "∠VUW = ∠BAC",
          "∠UVW = ∠ABC"
        ],
        "id": "geometry-sas-13"
      },
      {
        "prompt": "Треугольники ACD и KLM равны по двум сторонам и углу между ними; вершины соответствуют по порядку. ∠CAD = 40°. Чему равен ∠LKM?",
        "answer": "40",
        "input": "number",
        "hint": "Соответствующие углы равных треугольников равны.",
        "explanation": "∠LKM = ∠CAD = 40°.",
        "oracle": {
          "kind": "expression",
          "expr": 40
        },
        "id": "geometry-sas-14"
      },
      {
        "prompt": "При доказанном равенстве треугольников KNP и ABC по порядку вершин сторона KN = 21 см. Найди AB.",
        "answer": "21",
        "input": "number",
        "hint": "Запись равенства треугольников задаёт соответствие вершин.",
        "explanation": "KN соответствует AB, поэтому длина 21 см.",
        "oracle": {
          "kind": "expression",
          "expr": 21
        },
        "id": "geometry-sas-15"
      },
      {
        "prompt": "В треугольниках MRS и DEF даны MR = DE, MS = DF. Какое равенство углов дополнит первый признак равенства?",
        "answer": "∠RMS = ∠EDF",
        "input": "choice",
        "hint": "Нужен угол между двумя указанными сторонами в каждом треугольнике.",
        "explanation": "У сторон MR, MS общая вершина M; у соответствующих сторон общая вершина D. Поэтому нужны ∠RMS и ∠EDF.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "sas-included-angle",
          "sidesA": [
            "MR",
            "MS"
          ],
          "sidesB": [
            "DE",
            "DF"
          ],
          "triangles": [
            "MRS",
            "DEF"
          ]
        },
        "choices": [
          "∠MSR = ∠DFE",
          "∠RMS = ∠EDF",
          "∠MRS = ∠DEF"
        ],
        "id": "geometry-sas-16"
      },
      {
        "prompt": "В равных треугольниках ADE и KLM соответствующие стороны имеют длины x + 18 и 39 см. Найди x.",
        "answer": "21",
        "input": "number",
        "hint": "Приравняй длины соответствующих сторон.",
        "explanation": "x + 18 = 39; x = 21.",
        "oracle": {
          "kind": "linear",
          "a": 1,
          "b": 18,
          "c": 39
        },
        "id": "geometry-sas-17"
      },
      {
        "prompt": "В треугольниках CFH и PQR равны две стороны и углы между ними. Периметр первого 69 см. Найди периметр второго.",
        "answer": "69",
        "input": "number",
        "hint": "Первый признак даёт равенство всех соответствующих сторон.",
        "explanation": "Равные треугольники имеют равные периметры: 69 см.",
        "oracle": {
          "kind": "expression",
          "expr": 69
        },
        "id": "geometry-sas-18"
      }
    ]
  },
  {
    "id": "geometry-proof-links",
    "group": "geometry",
    "title": "Понимаем шаги доказательства",
    "goal": "Находить данные, общую сторону и углы при основании; связывать их с шагами доказательства. Короткая проверка не заменяет письменное доказательство.",
    "covers": [
      "path:grade7-g-practice-isosceles-proof"
    ],
    "prerequisites": [
      "path:grade7-g-core-sas",
      "path:grade7-g-angle-bisector"
    ],
    "trainers": [
      {
        "title": "Собери доказательство свойства равнобедренного треугольника",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-practice-isosceles-proof",
        "kind": "Модель",
        "instruction": "Собери доказательство и объясни, откуда взялось каждое равенство.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Первый признак равенства: две стороны и угол",
        "href": "/ege-baza/path/index.html#lesson=grade7-g-core-sas",
        "kind": "По шагам",
        "instruction": "Проверь, что равны две стороны и именно угол между ними.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "В треугольнике ABC стороны AB и AC равны. Какое равенство углов при основании следует доказать?",
        "answer": "∠ABC = ∠BCA",
        "input": "choice",
        "hint": "Основание соединяет концы равных боковых сторон; углы при нём лежат напротив этих сторон.",
        "explanation": "Основание BC; углы при B и C равны.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "isosceles-base-angles",
          "triangle": "ABC",
          "equalSides": [
            "AB",
            "AC"
          ]
        },
        "choices": [
          "∠ABC = ∠BCA",
          "∠BAC = ∠ABC",
          "∠BAC = ∠BCA"
        ],
        "id": "geometry-proof-links-01"
      },
      {
        "prompt": "В равнобедренном KLM проведена биссектриса KN к основанию. Для сравнения двух полученных треугольников какое равенство выражает их общую сторону?",
        "answer": "KN = KN",
        "input": "choice",
        "hint": "Один отрезок принадлежит обоим треугольникам и равен самому себе.",
        "explanation": "Общая сторона KN даёт равенство KN = KN.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "common-segment",
          "segment": "KN"
        },
        "choices": [
          "KL = LM",
          "KM = LM",
          "KN = KN"
        ],
        "id": "geometry-proof-links-02"
      },
      {
        "prompt": "В равнобедренном PQR угол при вершине P равен 48°. Биссектриса делит его пополам. Найди каждую часть.",
        "answer": "24",
        "input": "number",
        "hint": "Равенство двух углов — один из шагов доказательства по первому признаку.",
        "explanation": "48 : 2 = 24°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            48,
            2
          ]
        },
        "id": "geometry-proof-links-03"
      },
      {
        "prompt": "В равнобедренном DEF угол при вершине между равными сторонами равен 30°. Найди угол при основании.",
        "answer": "75",
        "input": "number",
        "hint": "Вычти угол при вершине из 180°, остаток раздели поровну.",
        "explanation": "(180 − 30) : 2 = 75°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              180,
              30
            ],
            2
          ]
        },
        "id": "geometry-proof-links-04"
      },
      {
        "prompt": "В STU равны ST и SU. Если ST = 13 см, какова SU?",
        "answer": "13",
        "input": "number",
        "hint": "Используй данное равенство сторон, не свойство рисунка.",
        "explanation": "SU = ST = 13 см.",
        "oracle": {
          "kind": "expression",
          "expr": 13
        },
        "id": "geometry-proof-links-05"
      },
      {
        "prompt": "В треугольнике XYZ стороны XY и XZ равны. Какое равенство углов при основании следует доказать?",
        "answer": "∠XYZ = ∠YZX",
        "input": "choice",
        "hint": "Основание соединяет концы равных боковых сторон; углы при нём лежат напротив этих сторон.",
        "explanation": "Основание YZ; углы при Y и Z равны.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "isosceles-base-angles",
          "triangle": "XYZ",
          "equalSides": [
            "XY",
            "XZ"
          ]
        },
        "choices": [
          "∠YXZ = ∠YZX",
          "∠XYZ = ∠YZX",
          "∠YXZ = ∠XYZ"
        ],
        "id": "geometry-proof-links-06"
      },
      {
        "prompt": "В треугольнике FGH стороны FG и FH равны. Какое равенство углов при основании следует доказать?",
        "answer": "∠FGH = ∠GHF",
        "input": "choice",
        "hint": "Основание соединяет концы равных боковых сторон; углы при нём лежат напротив этих сторон.",
        "explanation": "Основание GH; углы при G и H равны.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "isosceles-base-angles",
          "triangle": "FGH",
          "equalSides": [
            "FG",
            "FH"
          ]
        },
        "choices": [
          "∠FGH = ∠GHF",
          "∠GFH = ∠FGH",
          "∠GFH = ∠GHF"
        ],
        "id": "geometry-proof-links-07"
      },
      {
        "prompt": "В равнобедренном VWX проведена биссектриса VN к основанию. Для сравнения двух полученных треугольников какое равенство выражает их общую сторону?",
        "answer": "VN = VN",
        "input": "choice",
        "hint": "Один отрезок принадлежит обоим треугольникам и равен самому себе.",
        "explanation": "Общая сторона VN даёт равенство VN = VN.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "common-segment",
          "segment": "VN"
        },
        "choices": [
          "VW = WX",
          "VX = WX",
          "VN = VN"
        ],
        "id": "geometry-proof-links-08"
      },
      {
        "prompt": "В равнобедренном BCD угол при вершине B равен 60°. Биссектриса делит его пополам. Найди каждую часть.",
        "answer": "30",
        "input": "number",
        "hint": "Равенство двух углов — один из шагов доказательства по первому признаку.",
        "explanation": "60 : 2 = 30°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            60,
            2
          ]
        },
        "id": "geometry-proof-links-09"
      },
      {
        "prompt": "В равнобедренном HJK угол при вершине между равными сторонами равен 42°. Найди угол при основании.",
        "answer": "69",
        "input": "number",
        "hint": "Вычти угол при вершине из 180°, остаток раздели поровну.",
        "explanation": "(180 − 42) : 2 = 69°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              180,
              42
            ],
            2
          ]
        },
        "id": "geometry-proof-links-10"
      },
      {
        "prompt": "В LMN равны LM и LN. Если LM = 19 см, какова LN?",
        "answer": "19",
        "input": "number",
        "hint": "Используй данное равенство сторон, не свойство рисунка.",
        "explanation": "LN = LM = 19 см.",
        "oracle": {
          "kind": "expression",
          "expr": 19
        },
        "id": "geometry-proof-links-11"
      },
      {
        "prompt": "В треугольнике PRS стороны PR и PS равны. Какое равенство углов при основании следует доказать?",
        "answer": "∠PRS = ∠RSP",
        "input": "choice",
        "hint": "Основание соединяет концы равных боковых сторон; углы при нём лежат напротив этих сторон.",
        "explanation": "Основание RS; углы при R и S равны.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "isosceles-base-angles",
          "triangle": "PRS",
          "equalSides": [
            "PR",
            "PS"
          ]
        },
        "choices": [
          "∠RPS = ∠RSP",
          "∠PRS = ∠RSP",
          "∠RPS = ∠PRS"
        ],
        "id": "geometry-proof-links-12"
      },
      {
        "prompt": "В треугольнике UVW стороны UV и UW равны. Какое равенство углов при основании следует доказать?",
        "answer": "∠UVW = ∠VWU",
        "input": "choice",
        "hint": "Основание соединяет концы равных боковых сторон; углы при нём лежат напротив этих сторон.",
        "explanation": "Основание VW; углы при V и W равны.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "isosceles-base-angles",
          "triangle": "UVW",
          "equalSides": [
            "UV",
            "UW"
          ]
        },
        "choices": [
          "∠UVW = ∠VWU",
          "∠VUW = ∠UVW",
          "∠VUW = ∠VWU"
        ],
        "id": "geometry-proof-links-13"
      },
      {
        "prompt": "В равнобедренном ACD проведена биссектриса AN к основанию. Для сравнения двух полученных треугольников какое равенство выражает их общую сторону?",
        "answer": "AN = AN",
        "input": "choice",
        "hint": "Один отрезок принадлежит обоим треугольникам и равен самому себе.",
        "explanation": "Общая сторона AN даёт равенство AN = AN.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "common-segment",
          "segment": "AN"
        },
        "choices": [
          "AC = CD",
          "AD = CD",
          "AN = AN"
        ],
        "id": "geometry-proof-links-14"
      },
      {
        "prompt": "В равнобедренном KNP угол при вершине K равен 72°. Биссектриса делит его пополам. Найди каждую часть.",
        "answer": "36",
        "input": "number",
        "hint": "Равенство двух углов — один из шагов доказательства по первому признаку.",
        "explanation": "72 : 2 = 36°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            72,
            2
          ]
        },
        "id": "geometry-proof-links-15"
      },
      {
        "prompt": "В равнобедренном MRS угол при вершине между равными сторонами равен 54°. Найди угол при основании.",
        "answer": "63",
        "input": "number",
        "hint": "Вычти угол при вершине из 180°, остаток раздели поровну.",
        "explanation": "(180 − 54) : 2 = 63°.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            [
              "sub",
              180,
              54
            ],
            2
          ]
        },
        "id": "geometry-proof-links-16"
      },
      {
        "prompt": "В ADE равны AD и AE. Если AD = 25 см, какова AE?",
        "answer": "25",
        "input": "number",
        "hint": "Используй данное равенство сторон, не свойство рисунка.",
        "explanation": "AE = AD = 25 см.",
        "oracle": {
          "kind": "expression",
          "expr": 25
        },
        "id": "geometry-proof-links-17"
      },
      {
        "prompt": "В треугольнике CFH стороны CF и CH равны. Какое равенство углов при основании следует доказать?",
        "answer": "∠CFH = ∠FHC",
        "input": "choice",
        "hint": "Основание соединяет концы равных боковых сторон; углы при нём лежат напротив этих сторон.",
        "explanation": "Основание FH; углы при F и H равны.",
        "oracle": {
          "kind": "geometry-fact",
          "rule": "isosceles-base-angles",
          "triangle": "CFH",
          "equalSides": [
            "CF",
            "CH"
          ]
        },
        "choices": [
          "∠FCH = ∠FHC",
          "∠CFH = ∠FHC",
          "∠FCH = ∠CFH"
        ],
        "id": "geometry-proof-links-18"
      }
    ]
  },
  {
    "id": "geometry-volume",
    "group": "geometry",
    "title": "Объём: слои кубиков",
    "goal": "Считать одинаковые слои и находить объём прямоугольной коробки и куба.",
    "covers": [
      "public:v5-volume-layers"
    ],
    "prerequisites": [
      "path:pre7-grid-area"
    ],
    "trainers": [
      {
        "title": "Объём: считаем слои кубиков",
        "href": "/school/index.html?course=vilenkin5#lesson/v5f-volume-layers",
        "kind": "Модель",
        "instruction": "Сосчитай кубики одного слоя и число слоёв.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Площадь по клеткам",
        "href": "/ege-baza/path/index.html#lesson=pre7-grid-area",
        "kind": "По шагам",
        "instruction": "Проверь площадь основания по рядам и столбцам.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "Коробка имеет форму прямоугольного параллелепипеда. Её длина — 4, ширина — 4, высота — 4 см. Найди объём в см³.",
        "answer": "64",
        "input": "number",
        "hint": "Сначала площадь одного слоя, затем число слоёв.",
        "explanation": "4 · 4 · 4 = 64 см³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            4,
            4,
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Длина, см",
            "Ширина, см",
            "Высота, см"
          ],
          "rows": [
            [
              4,
              4,
              4
            ]
          ]
        },
        "id": "geometry-volume-01"
      },
      {
        "prompt": "В одном слое 25 единичных кубиков, слоёв 2. Сколько кубиков всего?",
        "answer": "50",
        "input": "number",
        "hint": "Слои одинаковы.",
        "explanation": "25 · 2 = 50.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            25,
            2
          ]
        },
        "id": "geometry-volume-02"
      },
      {
        "prompt": "Объём прямоугольного параллелепипеда 36 см³, площадь основания 12 см². Найди высоту.",
        "answer": "3",
        "input": "number",
        "hint": "Объём делится на площадь одного слоя.",
        "explanation": "36 : 12 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            36,
            12
          ]
        },
        "id": "geometry-volume-03"
      },
      {
        "prompt": "Куб с ребром 2 см. Каков объём в см³?",
        "answer": "8",
        "input": "choice",
        "hint": "Все три измерения куба равны.",
        "explanation": "2 · 2 · 2 = 8 см³.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            2,
            3
          ],
          "values": [
            "4",
            "7",
            "8"
          ]
        },
        "choices": [
          "4",
          "7",
          "8"
        ],
        "id": "geometry-volume-04"
      },
      {
        "prompt": "Длину прямоугольного параллелепипеда увеличили вдвое; прежний объём 64 см³, остальные измерения прежние. Найди новый объём.",
        "answer": "128",
        "input": "number",
        "hint": "Изменилась только одна длина в произведении.",
        "explanation": "2 · 64 = 128 см³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            8,
            4,
            2
          ]
        },
        "id": "geometry-volume-05"
      },
      {
        "prompt": "Прямоугольное основание 9 на 5 клеток, каждый столбик высотой 3 кубиков. Сколько кубиков?",
        "answer": "135",
        "input": "number",
        "hint": "Количество в основании умножается на высоту.",
        "explanation": "45 · 3 = 135.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            9,
            5,
            3
          ]
        },
        "id": "geometry-volume-06"
      },
      {
        "prompt": "Коробка имеет форму прямоугольного параллелепипеда. Её длина — 10, ширина — 2, высота — 4 см. Найди объём в см³.",
        "answer": "80",
        "input": "number",
        "hint": "Сначала площадь одного слоя, затем число слоёв.",
        "explanation": "10 · 2 · 4 = 80 см³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            10,
            2,
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Длина, см",
            "Ширина, см",
            "Высота, см"
          ],
          "rows": [
            [
              10,
              2,
              4
            ]
          ]
        },
        "id": "geometry-volume-07"
      },
      {
        "prompt": "В одном слое 33 единичных кубиков, слоёв 2. Сколько кубиков всего?",
        "answer": "66",
        "input": "number",
        "hint": "Слои одинаковы.",
        "explanation": "33 · 2 = 66.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            33,
            2
          ]
        },
        "id": "geometry-volume-08"
      },
      {
        "prompt": "Объём прямоугольного параллелепипеда 144 см³, площадь основания 48 см². Найди высоту.",
        "answer": "3",
        "input": "number",
        "hint": "Объём делится на площадь одного слоя.",
        "explanation": "144 : 48 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            144,
            48
          ]
        },
        "id": "geometry-volume-09"
      },
      {
        "prompt": "Куб с ребром 3 см. Каков объём в см³?",
        "answer": "27",
        "input": "choice",
        "hint": "Все три измерения куба равны.",
        "explanation": "3 · 3 · 3 = 27 см³.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            3,
            3
          ],
          "values": [
            "9",
            "10",
            "27"
          ]
        },
        "choices": [
          "9",
          "10",
          "27"
        ],
        "id": "geometry-volume-10"
      },
      {
        "prompt": "Длину прямоугольного параллелепипеда увеличили вдвое; прежний объём 56 см³, остальные измерения прежние. Найди новый объём.",
        "answer": "112",
        "input": "number",
        "hint": "Изменилась только одна длина в произведении.",
        "explanation": "2 · 56 = 112 см³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            14,
            2,
            2
          ]
        },
        "id": "geometry-volume-11"
      },
      {
        "prompt": "Прямоугольное основание 15 на 3 клеток, каждый столбик высотой 3 кубиков. Сколько кубиков?",
        "answer": "135",
        "input": "number",
        "hint": "Количество в основании умножается на высоту.",
        "explanation": "45 · 3 = 135.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            15,
            3,
            3
          ]
        },
        "id": "geometry-volume-12"
      },
      {
        "prompt": "Коробка имеет форму прямоугольного параллелепипеда. Её длина — 16, ширина — 4, высота — 4 см. Найди объём в см³.",
        "answer": "256",
        "input": "number",
        "hint": "Сначала площадь одного слоя, затем число слоёв.",
        "explanation": "16 · 4 · 4 = 256 см³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            16,
            4,
            4
          ]
        },
        "visual": {
          "type": "table",
          "headers": [
            "Длина, см",
            "Ширина, см",
            "Высота, см"
          ],
          "rows": [
            [
              16,
              4,
              4
            ]
          ]
        },
        "id": "geometry-volume-13"
      },
      {
        "prompt": "В одном слое 85 единичных кубиков, слоёв 2. Сколько кубиков всего?",
        "answer": "170",
        "input": "number",
        "hint": "Слои одинаковы.",
        "explanation": "85 · 2 = 170.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            85,
            2
          ]
        },
        "id": "geometry-volume-14"
      },
      {
        "prompt": "Объём прямоугольного параллелепипеда 108 см³, площадь основания 36 см². Найди высоту.",
        "answer": "3",
        "input": "number",
        "hint": "Объём делится на площадь одного слоя.",
        "explanation": "108 : 36 = 3 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "div",
            108,
            36
          ]
        },
        "id": "geometry-volume-15"
      },
      {
        "prompt": "Куб с ребром 4 см. Каков объём в см³?",
        "answer": "64",
        "input": "choice",
        "hint": "Все три измерения куба равны.",
        "explanation": "4 · 4 · 4 = 64 см³.",
        "oracle": {
          "kind": "choice-expression",
          "expr": [
            "pow",
            4,
            3
          ],
          "values": [
            "16",
            "13",
            "64"
          ]
        },
        "choices": [
          "16",
          "13",
          "64"
        ],
        "id": "geometry-volume-16"
      },
      {
        "prompt": "Длину прямоугольного параллелепипеда увеличили вдвое; прежний объём 160 см³, остальные измерения прежние. Найди новый объём.",
        "answer": "320",
        "input": "number",
        "hint": "Изменилась только одна длина в произведении.",
        "explanation": "2 · 160 = 320 см³.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            20,
            4,
            2
          ]
        },
        "id": "geometry-volume-17"
      },
      {
        "prompt": "Прямоугольное основание 21 на 5 клеток, каждый столбик высотой 3 кубиков. Сколько кубиков?",
        "answer": "315",
        "input": "number",
        "hint": "Количество в основании умножается на высоту.",
        "explanation": "105 · 3 = 315.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            21,
            5,
            3
          ]
        },
        "id": "geometry-volume-18"
      }
    ]
  },
  {
    "id": "geometry-symmetry",
    "group": "geometry",
    "title": "Симметрия относительно оси",
    "goal": "Сохранять расстояние до оси и понимать изменение координат отражённой точки.",
    "covers": [
      "public:v6-symmetry-axis"
    ],
    "prerequisites": [
      "public:v6-coordinates-place",
      "path:grade7-g-midpoint-chain"
    ],
    "trainers": [
      {
        "title": "Симметрия на клетках",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-symmetry-axis",
        "kind": "Модель",
        "instruction": "Построй образ точки по другую сторону оси на таком же расстоянии.",
        "finish": "Выполни 3 построения или измерения."
      },
      {
        "title": "Ставим точку по координатам",
        "href": "/school/index.html?course=vilenkin6#lesson/v6f-coordinates-place",
        "kind": "По шагам",
        "instruction": "Проверь координаты исходной точки и её образа.",
        "finish": "Разбери 3 задания."
      }
    ],
    "questions": [
      {
        "prompt": "A(3; 3) отражают относительно оси y. Какой x у образа?",
        "answer": "-3",
        "input": "number",
        "hint": "Ось y сохраняет высоту и меняет знак горизонтальной координаты.",
        "explanation": "Новая точка (−3; 3).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            3
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 3,
              "y": 3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "geometry-symmetry-01"
      },
      {
        "prompt": "A(4; 4) отражают относительно оси x. Какой y у образа?",
        "answer": "-4",
        "input": "number",
        "hint": "Высота меняет знак, горизонтальная координата сохраняется.",
        "explanation": "Новая точка (4; −4).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            4
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 4,
              "y": 4,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "geometry-symmetry-02"
      },
      {
        "prompt": "Точка на 5 клетки справа от вертикальной оси. Где её образ по другую сторону: на сколько клеток от оси?",
        "answer": "5",
        "input": "number",
        "hint": "Расстояние до оси сохраняется.",
        "explanation": "Образ на 5 клетки слева.",
        "oracle": {
          "kind": "expression",
          "expr": 5
        },
        "id": "geometry-symmetry-03"
      },
      {
        "prompt": "A(1; 2) отражена относительно оси y. Какой y у образа?",
        "answer": "2",
        "input": "choice",
        "hint": "Вертикальная координата при этом отражении сохраняется.",
        "explanation": "y остаётся 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 2,
          "values": [
            "3",
            "2",
            "-2"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 1,
              "y": 2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "choices": [
          "3",
          "2",
          "-2"
        ],
        "id": "geometry-symmetry-04"
      },
      {
        "prompt": "Точка на расстоянии 2 см от оси симметрии. Каково расстояние между точкой и её образом?",
        "answer": "4",
        "input": "number",
        "hint": "Ось находится посередине перпендикулярного отрезка.",
        "explanation": "2 + 2 = 4 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            2
          ]
        },
        "id": "geometry-symmetry-05"
      },
      {
        "prompt": "После двух отражений относительно одной оси точка вернулась обратно. Если её исходная x-координата 3, какова итоговая?",
        "answer": "3",
        "input": "number",
        "hint": "Одно и то же отражение дважды возвращает точку.",
        "explanation": "Итоговая координата x = 3.",
        "oracle": {
          "kind": "expression",
          "expr": 3
        },
        "id": "geometry-symmetry-06"
      },
      {
        "prompt": "A(4; 1) отражают относительно оси y. Какой x у образа?",
        "answer": "-4",
        "input": "number",
        "hint": "Ось y сохраняет высоту и меняет знак горизонтальной координаты.",
        "explanation": "Новая точка (−4; 1).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            4
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 4,
              "y": 1,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "geometry-symmetry-07"
      },
      {
        "prompt": "A(5; 2) отражают относительно оси x. Какой y у образа?",
        "answer": "-2",
        "input": "number",
        "hint": "Высота меняет знак, горизонтальная координата сохраняется.",
        "explanation": "Новая точка (5; −2).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            2
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 5,
              "y": 2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "geometry-symmetry-08"
      },
      {
        "prompt": "Точка на 1 клетки справа от вертикальной оси. Где её образ по другую сторону: на сколько клеток от оси?",
        "answer": "1",
        "input": "number",
        "hint": "Расстояние до оси сохраняется.",
        "explanation": "Образ на 1 клетки слева.",
        "oracle": {
          "kind": "expression",
          "expr": 1
        },
        "id": "geometry-symmetry-09"
      },
      {
        "prompt": "A(2; 4) отражена относительно оси y. Какой y у образа?",
        "answer": "4",
        "input": "choice",
        "hint": "Вертикальная координата при этом отражении сохраняется.",
        "explanation": "y остаётся 4.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 4,
          "values": [
            "6",
            "4",
            "-4"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 2,
              "y": 4,
              "label": "A"
            }
          ],
          "segments": []
        },
        "choices": [
          "6",
          "4",
          "-4"
        ],
        "id": "geometry-symmetry-10"
      },
      {
        "prompt": "Точка на расстоянии 3 см от оси симметрии. Каково расстояние между точкой и её образом?",
        "answer": "6",
        "input": "number",
        "hint": "Ось находится посередине перпендикулярного отрезка.",
        "explanation": "3 + 3 = 6 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            3
          ]
        },
        "id": "geometry-symmetry-11"
      },
      {
        "prompt": "После двух отражений относительно одной оси точка вернулась обратно. Если её исходная x-координата 4, какова итоговая?",
        "answer": "4",
        "input": "number",
        "hint": "Одно и то же отражение дважды возвращает точку.",
        "explanation": "Итоговая координата x = 4.",
        "oracle": {
          "kind": "expression",
          "expr": 4
        },
        "id": "geometry-symmetry-12"
      },
      {
        "prompt": "A(5; 3) отражают относительно оси y. Какой x у образа?",
        "answer": "-5",
        "input": "number",
        "hint": "Ось y сохраняет высоту и меняет знак горизонтальной координаты.",
        "explanation": "Новая точка (−5; 3).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            5
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 5,
              "y": 3,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "geometry-symmetry-13"
      },
      {
        "prompt": "A(1; 4) отражают относительно оси x. Какой y у образа?",
        "answer": "-4",
        "input": "number",
        "hint": "Высота меняет знак, горизонтальная координата сохраняется.",
        "explanation": "Новая точка (1; −4).",
        "oracle": {
          "kind": "expression",
          "expr": [
            "neg",
            4
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 1,
              "y": 4,
              "label": "A"
            }
          ],
          "segments": []
        },
        "id": "geometry-symmetry-14"
      },
      {
        "prompt": "Точка на 2 клетки справа от вертикальной оси. Где её образ по другую сторону: на сколько клеток от оси?",
        "answer": "2",
        "input": "number",
        "hint": "Расстояние до оси сохраняется.",
        "explanation": "Образ на 2 клетки слева.",
        "oracle": {
          "kind": "expression",
          "expr": 2
        },
        "id": "geometry-symmetry-15"
      },
      {
        "prompt": "A(3; 2) отражена относительно оси y. Какой y у образа?",
        "answer": "2",
        "input": "choice",
        "hint": "Вертикальная координата при этом отражении сохраняется.",
        "explanation": "y остаётся 2.",
        "oracle": {
          "kind": "choice-expression",
          "expr": 2,
          "values": [
            "5",
            "2",
            "-2"
          ]
        },
        "visual": {
          "type": "graph",
          "xmin": -6,
          "xmax": 6,
          "ymin": -6,
          "ymax": 6,
          "step": 1,
          "points": [
            {
              "x": 3,
              "y": 2,
              "label": "A"
            }
          ],
          "segments": []
        },
        "choices": [
          "5",
          "2",
          "-2"
        ],
        "id": "geometry-symmetry-16"
      },
      {
        "prompt": "Точка на расстоянии 4 см от оси симметрии. Каково расстояние между точкой и её образом?",
        "answer": "8",
        "input": "number",
        "hint": "Ось находится посередине перпендикулярного отрезка.",
        "explanation": "4 + 4 = 8 см.",
        "oracle": {
          "kind": "expression",
          "expr": [
            "mul",
            2,
            4
          ]
        },
        "id": "geometry-symmetry-17"
      },
      {
        "prompt": "После двух отражений относительно одной оси точка вернулась обратно. Если её исходная x-координата 5, какова итоговая?",
        "answer": "5",
        "input": "number",
        "hint": "Одно и то же отражение дважды возвращает точку.",
        "explanation": "Итоговая координата x = 5.",
        "oracle": {
          "kind": "expression",
          "expr": 5
        },
        "id": "geometry-symmetry-18"
      }
    ]
  }
];
});
