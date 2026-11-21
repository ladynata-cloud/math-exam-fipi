(function () {
  "use strict";

  // Self-contained deterministic generators. No DOM, storage or network access.
  function validSeed(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 999) {
      throw new RangeError("seed должен быть целым числом от 0 до 999.");
    }
    return seed;
  }
  function randomFor(seed, salt) {
    var state = ((validSeed(seed) + 1) ^ salt) >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var x = state;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(rng, values) { return values[Math.floor(rng() * values.length)]; }
  function shuffled(rng, values) {
    var result = values.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var value = result[i]; result[i] = result[j]; result[j] = value;
    }
    return result;
  }
  function fmt(value) {
    if (Object.is(value, -0)) value = 0;
    return String(value).replace(/-/g, "−").replace(".", ",");
  }
  function coordinate(x, y) { return "(" + fmt(x) + "; " + fmt(y) + ")"; }
  function signedTerm(value, symbol, first) {
    if (!value) return "";
    var magnitude = Math.abs(value);
    var body = symbol && magnitude === 1 ? symbol : fmt(magnitude) + symbol;
    if (first) return (value < 0 ? "−" : "") + body;
    return (value < 0 ? " − " : " + ") + body;
  }
  function linear(k, b) {
    var expression = signedTerm(k, "x", true);
    expression += signedTerm(b, "", !expression);
    return "y = " + (expression || "0");
  }
  function quadratic(a, b, c) {
    var expression = signedTerm(a, "x²", true);
    expression += signedTerm(b, "x", !expression);
    expression += signedTerm(c, "", !expression);
    return "y = " + (expression || "0");
  }
  function uniquePairs(values) {
    var seen = new Set();
    return values.filter(function (value) {
      var key = value.join("/");
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  function lineChoices(rng, k, b, candidates) {
    var all = uniquePairs([[k, b]].concat(candidates || [
      [-k, b], [k, -b], [k + 1, b], [k, b + 1], [k, b - 1], [k - 1, b]
    ])).slice(0, 4);
    if (all.length !== 4) throw new Error("Недостаточно различных формул.");
    return shuffled(rng, all.map(function (pair) {
      return {text: linear(pair[0], pair[1]), correct: pair[0] === k && pair[1] === b};
    }));
  }
  function diagnosticList(answer, candidates) {
    var seen = new Set();
    return candidates.filter(function (entry) {
      if (!Number.isFinite(entry.value) || entry.value === answer || seen.has(entry.value)) return false;
      seen.add(entry.value); return true;
    });
  }
  function complete(family, seed, task) {
    task.id = family.id + "-v" + String(validSeed(seed)).padStart(3, "0");
    task.title = task.title || family.title;
    task.skillId = family.skillId;
    task.familyId = family.id;
    task.seed = seed;
    if (task.type === "choice" || task.type === "multi") {
      task.witness = {selected: task.options.map(function (option, i) { return option.correct ? i : -1; }).filter(function (i) { return i >= 0; })};
    } else if (task.type === "number") {
      task.witness = {answer: String(task.answer)};
    } else if (task.type === "graph") {
      task.exampleSolution = {k: task.k, b: task.b};
      task.witness = {k: task.k, b: task.b};
    } else if (task.type === "build") {
      task.witness = {values: Object.assign({}, task.exampleSolution)};
    } else if (task.type === "match") {
      task.witness = {matches: Object.fromEntries(task.pairs.map(function (pair, i) { return [i, pair.right]; }))};
    }
    return task;
  }
  function lineVisual(k, b, points, bounds) {
    return Object.assign({
      kind: "graph", k: k, b: b, points: points,
      label: "Координатная плоскость с прямой. Две точки этой прямой: " +
        coordinate(0, b) + " и " + coordinate(2, 2 * k + b) + ".",
      xMin: -4, xMax: 4, yMin: -10, yMax: 10
    }, bounds || {});
  }

  var families = [];
  function family(config, generator) {
    var entry = Object.assign({topicId: "n11"}, config);
    entry.generate = function (seed) { return complete(entry, seed, generator(validSeed(seed))); };
    families.push(entry);
    return entry;
  }

  family({
    id: "func-point-membership", title: "Какая точка подходит?",
    skillId: "n11-coordinates", goal: "Проверить принадлежность точки прямой подстановкой обеих координат.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0x13021);
    var k = pick(rng, [-3, -2, -1, 1, 2, 3]), b = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    var x = pick(rng, [-3, -2, -1, 1, 2, 3]), y = k * x + b;
    var wrong = uniquePairs([
      [y, x], [x, -k * x + b], [x, k * x - b], [x, k + x + b],
      [x, y + 1], [x, y - 1], [-x, y]
    ]).filter(function (pair) { return pair[1] !== k * pair[0] + b; }).slice(0, 3);
    var options = [{text: coordinate(x, y), correct: true}].concat(wrong.map(function (pair) {
      return {text: coordinate(pair[0], pair[1]), correct: false};
    }));
    return {
      type: "choice",
      prompt: "Какая из точек принадлежит графику " + linear(k, b) + "?",
      options: shuffled(rng, options),
      hint: "Первая координата — x. Подставь её в формулу и сравни результат со второй координатой.",
      explanation: "Для точки " + coordinate(x, y) + " получается " + fmt(k) + " · (" + fmt(x) +
        ") + (" + fmt(b) + ") = " + fmt(y) + ". Обе координаты согласованы с формулой."
    };
  });

  family({
    id: "func-substitution", title: "Значение по формуле",
    skillId: "n11-coordinates", goal: "Самостоятельно вычислить значение линейной функции, сохранив знак аргумента.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0x2af57);
    var k = pick(rng, [-4, -3, -2, -1, -0.5, 0.5, 1, 2, 3, 4]);
    var b = pick(rng, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
    var x = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]), answer = k * x + b;
    return {
      type: "number", answer: answer,
      prompt: "Функция задана формулой " + linear(k, b) + ". Найди y при x = " + fmt(x) + ".",
      hint: "Сначала вычисли произведение коэффициента и x, затем прибавь свободный член с его знаком.",
      explanation: "Подставляем x = " + fmt(x) + ": " + fmt(k) + " · (" + fmt(x) + ") + (" + fmt(b) +
        ") = " + fmt(k * x) + " + (" + fmt(b) + ") = " + fmt(answer) + ".",
      diagnostics: diagnosticList(answer, [
        {value: k + x + b, message: "Коэффициент при x нужно умножить на x, а не прибавить к нему."},
        {value: k * x - b, message: "Проверь знак свободного члена: он уже указан в формуле."},
        {value: -k * x + b, message: "Проверь знак подставленного x и знак произведения."},
        {value: k * x, message: "Произведение найдено. Осталось учесть свободный член."}
      ])
    };
  });

  family({
    id: "func-table-rule", title: "Правило по таблице",
    skillId: "n11-linear", goal: "Восстановить одну линейную зависимость по нескольким парам значений.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0x377d3);
    var k = pick(rng, [-3, -2, -1, -0.5, 0.5, 1, 2, 3]), b = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    var x0 = pick(rng, [-4, -2, 0]), dx = pick(rng, [1, 2, 3]);
    var rows = [0, 1, 2].map(function (i) { var x = x0 + i * dx; return [x, k * x + b]; });
    return {
      type: "choice", table: {headers: ["x", "y"], rows: rows},
      prompt: "Таблица задаёт линейную функцию: " + rows.map(function (p) { return "x = " + fmt(p[0]) + " → y = " + fmt(p[1]); }).join("; ") +
        ". Какая формула подходит ко всем строкам?",
      options: lineChoices(rng, k, b),
      hint: "Раздели изменение y на изменение x. Затем проверь свободный член по одной строке.",
      explanation: "Между соседними строками x изменяется на " + fmt(dx) + ", а y — на " + fmt(k * dx) +
        ". Поэтому k = " + fmt(k * dx) + "/" + fmt(dx) + " = " + fmt(k) +
        ". Подстановка любой строки даёт b = " + fmt(b) + ". Получается " + linear(k, b) + "."
    };
  });

  family({
    id: "func-graph-formula", title: "Формула по прямой",
    skillId: "n11-linear", goal: "Прочитать график и проверить формулу по наклону и точке.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0x485c9);
    var k = pick(rng, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]);
    var b = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    var points = seed % 2 ? [[0, b], [2, 2 * k + b]] : [];
    return {
      type: "choice", visual: lineVisual(k, b, points),
      prompt: "Какая формула задаёт изображённую прямую? Используй подписи осей и при необходимости проверь одну точку.",
      options: lineChoices(rng, k, b),
      hint: "Найди значение при x = 0. Затем сравни изменение y и изменение x между двумя точками.",
      explanation: "При x = 0 получаем b = " + fmt(b) + ". От x = 0 до x = 2 значение y изменяется на " +
        fmt(2 * k) + ", поэтому k = " + fmt(2 * k) + "/2 = " + fmt(k) + ". Формула: " + linear(k, b) + "."
    };
  });

  family({
    id: "func-parameter-change", title: "Наклон или сдвиг?",
    skillId: "n11-linear", goal: "Отделить изменение наклона от изменения пересечения с осью y.",
    mode: "creative"
  }, function (seed) {
    var rng = randomFor(seed, 0x5e16b);
    var k = pick(rng, [-3, -2, -1, 1, 2, 3]), b = pick(rng, [-3, -2, -1, 0, 1, 2, 3]);
    if (seed % 2 === 0) {
      var shift = pick(rng, [-3, -2, -1, 1, 2, 3]), nextB = b + shift;
      return {
        type: "choice", visual: lineVisual(k, b, []),
        prompt: "Исходная прямая: " + linear(k, b) + ". Её сдвинули " + (shift > 0 ? "вверх" : "вниз") +
          " на " + fmt(Math.abs(shift)) + ", сохранив наклон. Какая формула получилась?",
        options: lineChoices(rng, k, nextB, [[k + shift, b], [k, b - shift], [-k, nextB], [k, nextB + 1]]),
        hint: "При одинаковом вертикальном сдвиге всех точек коэффициент k сохраняется. Изменяется b.",
        explanation: "Наклон остался k = " + fmt(k) + ". Свободный член изменился с " + fmt(b) + " на " + fmt(nextB) +
          ". Получается " + linear(k, nextB) + ". На рисунке показана исходная прямая."
      };
    }
    var newK = pick(rng, [-3, -2, -1, 1, 2, 3].filter(function (value) { return value !== k; }));
    return {
      type: "choice", visual: lineVisual(k, b, []),
      prompt: "Исходная прямая: " + linear(k, b) + ". Пересечение с осью y сохраняют. Теперь при увеличении x на 1 значение y " +
        (newK > 0 ? "увеличивается" : "уменьшается") + " на " + fmt(Math.abs(newK)) + ". Выбери новую формулу.",
      options: lineChoices(rng, newK, b, [[k, b + newK], [-newK, b], [newK, b + 1], [k, b], [newK, -b]]),
      hint: "Значение при x = 0 сохраняется. Изменение y за один шаг по x определяет новый k.",
      explanation: "Свободный член остаётся b = " + fmt(b) + ". Новое изменение за один шаг даёт k = " + fmt(newK) +
        ". Получается " + linear(newK, b) + ". На рисунке показана исходная прямая."
    };
  });

  family({
    id: "func-line-builder", title: "Прямая через две точки",
    skillId: "n11-linear", goal: "Самому построить прямую по двум точкам и связать управление с коэффициентами.",
    mode: "creative"
  }, function (seed) {
    var rng = randomFor(seed, 0x66a41);
    var k = pick(rng, [-3, -2, -1, -0.5, 0.5, 1, 2, 3]), b = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    var x1 = pick(rng, [-2, -1, 0]), dx = pick(rng, [1, 2, 3]), x2 = x1 + dx;
    var y1 = k * x1 + b, y2 = k * x2 + b;
    return {
      type: "graph", k: k, b: b, points: [[x1, y1], [x2, y2]],
      prompt: "Настрой k и b в y = kx + b так, чтобы прямая прошла через " + coordinate(x1, y1) +
        " и " + coordinate(x2, y2) + ". Перед движением регулятора предположи, что изменится.",
      hint: "Изменение y между точками раздели на изменение x. После этого найди b подстановкой одной точки.",
      explanation: "k = (" + fmt(y2) + " − (" + fmt(y1) + "))/(" + fmt(x2) + " − (" + fmt(x1) + ")) = " +
        fmt(k) + ". Затем b = " + fmt(y1) + " − (" + fmt(k) + ") · (" + fmt(x1) + ") = " + fmt(b) +
        ". Обе точки лежат на прямой " + linear(k, b) + "."
    };
  });

  family({
    id: "func-reverse-recovery", title: "Восстанови коэффициенты линейной функции",
    skillId: "n11-linear", goal: "Найти k и b по двум значениям функции при известных значениях аргумента.",
    mode: "creative"
  }, function (seed) {
    var rng = randomFor(seed, 0x7bd31);
    var k = pick(rng, [-3, -2, -1, -0.5, 0.5, 1, 2, 3]), b = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    var x1 = pick(rng, [-3, -2, -1, 0, 1]), x2 = x1 + pick(rng, [1, 2, 3, 4]);
    var y1 = k * x1 + b, y2 = k * x2 + b;
    return {
      type: "build",
      // Retain the existing mathematical history across this wording change.
      identityPrompt: "Известно, что f(x) = kx + b. Сканер получил f(" + fmt(x1) + ") = " + fmt(y1) +
        " и f(" + fmt(x2) + ") = " + fmt(y2) + ". Восстанови оба коэффициента.",
      prompt: "Известно, что f(x) = kx + b, f(" + fmt(x1) + ") = " + fmt(y1) +
        " и f(" + fmt(x2) + ") = " + fmt(y2) + ". Найди коэффициенты k и b.",
      table: {headers: ["x", "f(x)"], rows: [[x1, y1], [x2, y2]]},
      fields: [
        {name: "k", label: "Коэффициент k", min: -4, max: 4, step: 0.5, initial: 0},
        {name: "b", label: "Свободный член b", min: -6, max: 6, step: 1, initial: 0}
      ],
      constants: {},
      conditions: [
        {left: "k*(" + x1 + ")+b", op: "eq", right: String(y1)},
        {left: "k*(" + x2 + ")+b", op: "eq", right: String(y2)}
      ],
      exampleSolution: {k: k, b: b},
      hint: "Найди отношение изменения значения функции к изменению аргумента. Так можно найти k, затем b.",
      explanation: "Разность результатов равна " + fmt(y2 - y1) + ", разность аргументов — " + fmt(x2 - x1) +
        ". Их отношение даёт k = " + fmt(k) + ". Подстановка одной из пар значений даёт b = " + fmt(b) +
        ". Проверенная зависимость: " + linear(k, b) + "."
    };
  });

  family({
    id: "func-axis-scale", title: "Координаты важнее угла",
    skillId: "n11-rate", goal: "Вычислить угловой коэффициент по координатам при изменённом масштабе осей.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0x8c297);
    var k = pick(rng, [-2, -1, -0.5, 0.5, 1, 2]), b = pick(rng, [-3, -2, -1, 0, 1, 2, 3]);
    var dx = pick(rng, [2, 4]), y2 = b + k * dx;
    var xMin = seed % 2 ? -8 : -4, xMax = seed % 2 ? 8 : 6;
    var yMin = Math.min(-4, b, y2) - 2, yMax = Math.max(4, b, y2) + 2;
    return {
      type: "number", answer: k,
      visual: lineVisual(k, b, [[0, b], [dx, y2]], {
        xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax,
        label: "Прямая с отмеченными точками " + coordinate(0, b) + " и " + coordinate(dx, y2) +
          ". Масштабы осей подписаны отдельно."
      }),
      prompt: "Найди коэффициент k прямой по отмеченным точкам. Пользуйся координатами и подписями осей; видимый угол зависит от масштаба.",
      hint: "k — отношение изменения y к изменению x. Одного изменения y недостаточно.",
      explanation: "Между точками изменение x равно " + fmt(dx) + ", изменение y равно " + fmt(y2 - b) +
        ". Поэтому k = " + fmt(y2 - b) + "/" + fmt(dx) + " = " + fmt(k) +
        ". Изменение масштаба рисунка не меняет это отношение координат.",
      diagnostics: diagnosticList(k, [
        {value: y2 - b, message: "Это изменение y. Раздели его ещё на изменение x между точками."},
        {value: 1 / k, message: "Проверь порядок деления: изменение y делится на изменение x."},
        {value: Math.abs(k), message: "Линейная функция убывает: при положительном изменении x изменение y отрицательно."},
        {value: b, message: "Значение при x = 0 — это b. Для k нужны изменения обеих координат."}
      ])
    };
  });

  family({
    id: "func-parabola-formula", title: "Формула по параболе",
    skillId: "n11-quadratic", goal: "Выбрать квадратичную формулу по направлению ветвей и проверить её по точкам.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0x9d5e7);
    var a = pick(rng, [-2, -1, 1, 2]), h = pick(rng, [-2, -1, 0, 1, 2]);
    var v = pick(rng, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    var b = -2 * a * h, c = a * h * h + v;
    var candidates = uniquePairs([[a, b, c], [-a, b, c], [a, -b, c], [a, b, -c], [a, b, c + 2], [a, b + 1, c]]).slice(0, 4);
    var options = shuffled(rng, candidates.map(function (coefficients) {
      return {text: quadratic(coefficients[0], coefficients[1], coefficients[2]),
        correct: coefficients[0] === a && coefficients[1] === b && coefficients[2] === c};
    }));
    var points = [[h, v], [h + 1, v + a]];
    var yMin = a > 0 ? Math.min(-2, v - 1) : Math.min(-6, v - 4 * Math.abs(a) - 1);
    var yMax = a > 0 ? Math.max(6, v + 4 * Math.abs(a) + 1) : Math.max(2, v + 1);
    return {
      type: "choice", options: options,
      prompt: "Какая формула задаёт изображённую параболу? Проверь направление ветвей и отмеченные точки.",
      visual: {
        kind: "function", family: "quadratic", a: a, b: b, c: c, points: points,
        xMin: h - 3, xMax: h + 3, yMin: yMin, yMax: yMax,
        label: "Парабола, ветви направлены " + (a > 0 ? "вверх" : "вниз") +
          ". Вершина " + coordinate(h, v) + "; ещё одна отмеченная точка " + coordinate(h + 1, v + a) + "."
      },
      hint: "Знак при x² определяет направление ветвей. Затем подставь координаты одной или двух отмеченных точек.",
      explanation: "Ветви направлены " + (a > 0 ? "вверх" : "вниз") + ". Формула " + quadratic(a, b, c) +
        " даёт y = " + fmt(v) + " при x = " + fmt(h) + " и y = " + fmt(v + a) +
        " при x = " + fmt(h + 1) + ". Её вершина совпадает с вершиной изображённой параболы."
    };
  });

  family({
    id: "func-inverse-coefficient", title: "Секрет гиперболы",
    skillId: "n11-inverse", goal: "Восстановить коэффициент обратной пропорциональности как произведение координат.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0xaf209);
    var x = pick(rng, [-4, -3, -2, 2, 3, 4]), y = pick(rng, [-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]);
    var k = x * y;
    return {
      type: "number", answer: k,
      identityPrompt: "Изображён график y = k/x. Найди k по отмеченной точке. Значение x = 0 в эту зависимость не входит.",
      prompt: "Изображён график y = k/x. Найди k по отмеченной точке. Функция не определена при x = 0.",
      visual: {
        kind: "function", family: "inverse", k: k, points: [[x, y]],
        xMin: -6, xMax: 6, yMin: -8, yMax: 8,
        label: "Две ветви гиперболы. Отмечена точка " + coordinate(x, y) +
          ". График не пересекает оси."
      },
      hint: "В равенстве y = k/x умножь обе части на ненулевое x: получится k = x · y.",
      explanation: "По точке " + coordinate(x, y) + " получаем k = (" + fmt(x) + ") · (" + fmt(y) +
        ") = " + fmt(k) + ". Проверка: " + fmt(k) + "/(" + fmt(x) + ") = " + fmt(y) + ".",
      diagnostics: diagnosticList(k, [
        {value: y / x, message: "Отношение y/x относится к другой зависимости. Здесь y = k/x, поэтому k = x · y."},
        {value: x / y, message: "Для восстановления k нужно произведение координат, а не их отношение."},
        {value: -k, message: "Проверь знак произведения двух координат."},
        {value: y, message: "Это координата y. Чтобы найти k, умножь её на ненулевую координату x."}
      ])
    };
  });

  family({
    id: "func-graph-match", title: "Три графика — три формулы",
    skillId: "n11-coordinates", goal: "Самостоятельно сопоставить прямую, параболу и гиперболу с формулами.",
    mode: "quick"
  }, function (seed) {
    var rng = randomFor(seed, 0xb51c3);
    var kLine = pick(rng, [-2, -1, -0.5, 0.5, 1, 2]), bLine = pick(rng, [-3, -2, -1, 0, 1, 2, 3]);
    var a = pick(rng, [-1, 1]), h = pick(rng, [-1, 0, 1]), v = pick(rng, [-2, -1, 0, 1, 2]);
    var bQuad = -2 * a * h, cQuad = a * h * h + v;
    var xInv = pick(rng, [-3, -2, 2, 3]), yInv = pick(rng, [-3, -2, -1, 1, 2, 3]), kInv = xInv * yInv;
    var entries = shuffled(rng, [
      {
        formula: linear(kLine, bLine),
        visual: lineVisual(kLine, bLine, [[0, bLine], [2, 2 * kLine + bLine]])
      },
      {
        formula: quadratic(a, bQuad, cQuad),
        visual: {
          kind: "function", family: "quadratic", a: a, b: bQuad, c: cQuad,
          points: [[h, v], [h + 1, v + a]],
          xMin: -4, xMax: 4, yMin: -7, yMax: 7,
          label: "Парабола с вершиной " + coordinate(h, v) + " и отмеченной точкой " + coordinate(h + 1, v + a) + "."
        }
      },
      {
        formula: "y = " + fmt(kInv) + "/x",
        visual: {
          kind: "function", family: "inverse", k: kInv,
          points: [[xInv, yInv]], xMin: -5, xMax: 5, yMin: -6, yMax: 6,
          label: "Две ветви гиперболы с отмеченной точкой " + coordinate(xInv, yInv) + "."
        }
      }
    ]);
    var letters = ["А", "Б", "В"];
    var pairs = entries.map(function (entry, i) { return {left: letters[i], right: entry.formula}; });
    var plots = entries.map(function (entry, i) {
      return Object.assign({}, entry.visual, {label: letters[i], ariaLabel: letters[i] + ". " + entry.visual.label});
    });
    return {
      type: "match", pairs: pairs,
      matchOptions: shuffled(rng, pairs.map(function (pair) { return pair.right; })),
      visual: {kind: "graphs", plots: plots, label: "Три графика с обозначениями А, Б и В. Сопоставьте каждый с одной формулой."},
      prompt: "Установи соответствие между графиками А, Б, В и формулами. Каждому графику соответствует одна формула.",
      hint: "Сначала различи прямую, параболу и гиперболу. Затем проверь знак коэффициента и одну отмеченную точку.",
      explanation: pairs.map(function (pair) { return pair.left + " — " + pair.right; }).join("; ") +
        ". Проверка: линейная формула задаёт прямую, ненулевой коэффициент при x² — параболу, а ненулевое k в y = k/x — гиперболу."
    };
  });

  var routes = [
    {
      id: "route-func-point-line", topicId: "n11", title: "Точка, формула, прямая",
      goal: "Проверить точку, построить прямую и самостоятельно выбрать её формулу. Карта не обязательна.",
      steps: [
        {familyId: "func-point-membership", label: "Проверить одну точку"},
        {familyId: "func-substitution", label: "Вычислить значение"},
        {familyId: "func-line-builder", label: "Построить прямую по двум точкам"},
        {familyId: "func-graph-formula", label: "Самостоятельно узнать формулу"}
      ]
    },
    {
      id: "route-func-hidden-rule", topicId: "n11", title: "Восстановить скрытое правило",
      goal: "Восстановить линейное правило по данным, по желанию исследовать коэффициенты и самостоятельно восстановить правило по новой таблице.",
      steps: [
        {familyId: "func-table-rule", label: "Прочитать таблицу"},
        {familyId: "func-reverse-recovery", label: "Восстановить два коэффициента"},
        {familyId: "func-parameter-change", label: "Различить наклон и сдвиг"},
        {familyId: "func-table-rule", label: "Самостоятельно восстановить правило по новой таблице"}
      ]
    },
    {
      id: "route-func-slope-scale", topicId: "n11", title: "Наклон без угадывания",
      goal: "Проверить смысл коэффициента наклона, включая изменённый масштаб рисунка.",
      steps: [
        {familyId: "func-graph-formula", label: "Начать с обычного графика"},
        {familyId: "func-parameter-change", label: "Исследовать изменение параметра"},
        {familyId: "func-line-builder", label: "Проверить управление прямой"},
        {familyId: "func-point-membership", label: "Проверить формулу точкой"},
        {familyId: "func-axis-scale", label: "Самостоятельно учесть масштаб"}
      ]
    },
    {
      id: "route-func-three-graphs", topicId: "n11", title: "Сопоставить три вида графиков",
      goal: "Необязательное продолжение после отдельных тем: обычная практика по прямой, параболе и гиперболе с итоговым сопоставлением.",
      steps: [
        {familyId: "func-graph-formula", label: "Проверить прямую"},
        {familyId: "func-parabola-formula", label: "Проверить параболу"},
        {familyId: "func-inverse-coefficient", label: "Проверить гиперболу"},
        {familyId: "func-graph-match", label: "Самостоятельно сопоставить все три"}
      ]
    }
  ];
  var bundle = {families: families, routes: routes};
  if (typeof module !== "undefined" && module.exports) module.exports = bundle;
  if (typeof window !== "undefined") {
    (window.OGE_SERIES_PARTS || (window.OGE_SERIES_PARTS = [])).push(bundle);
  }
})();
