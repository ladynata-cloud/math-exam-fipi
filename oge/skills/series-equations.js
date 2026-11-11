(function (browserRoot) {
  "use strict";

  // Deterministic, bounded variants. No network, eval, or Math.random.
  var ROOT_HALVES = [-14, -10, -7, -4, -2, -1, 0, 1, 3, 4, 8, 12, 16];
  var INTEGER_ROOTS = [-6, -4, -2, -1, 0, 1, 3, 5, 7];
  var NONZERO_COEFFICIENTS = [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9];
  var EVEN_COEFFICIENTS = [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10];

  function randomFor(seed, salt) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 999) {
      throw new RangeError("Номер варианта должен быть целым числом от 0 до 999.");
    }
    var hash = 2166136261;
    for (var i = 0; i < salt.length; i++) hash = Math.imul(hash ^ salt.charCodeAt(i), 16777619) >>> 0;
    var state = (hash ^ Math.imul(seed + 1, 2654435761)) >>> 0;
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  function int(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
  function pick(rng, values) { return values[int(rng, 0, values.length - 1)]; }
  function nonzero(rng, min, max) {
    var values = [];
    for (var i = min; i <= max; i++) if (i !== 0) values.push(i);
    return pick(rng, values);
  }
  function shuffle(values, rng) {
    var result = values.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = int(rng, 0, i), item = result[i];
      result[i] = result[j]; result[j] = item;
    }
    return result;
  }
  function differentOrder(values, rng) {
    var result = shuffle(values, rng);
    if (result.every(function (v, i) { return v === values[i]; })) result.push(result.shift());
    return result;
  }
  function fmt(value) {
    if (Object.is(value, -0)) value = 0;
    return String(Number(value.toPrecision(12))).replace(/-/g, "−").replace(".", ",");
  }
  function atom(value) { return value < 0 ? "(" + fmt(value) + ")" : fmt(value); }
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var rem = a % b; a = b; b = rem; }
    return a;
  }
  function fraction(numerator, denominator) {
    if (denominator === 0) throw new Error("Внутренняя ошибка: нулевой знаменатель.");
    if (denominator < 0) { numerator = -numerator; denominator = -denominator; }
    var divisor = gcd(numerator, denominator);
    numerator /= divisor; denominator /= divisor;
    return denominator === 1 ? fmt(numerator) : fmt(numerator) + "/" + fmt(denominator);
  }
  function linear(a, b) {
    if (!a) return fmt(b);
    var text = a === 1 ? "x" : a === -1 ? "−x" : fmt(a) + "x";
    if (b) text += b > 0 ? " + " + fmt(b) : " − " + fmt(-b);
    return text;
  }
  function shiftedX(offset) { return linear(1, offset); }
  function bracket(a, b) {
    return (a === 1 ? "" : a === -1 ? "−" : fmt(a)) + "(" + shiftedX(b) + ")";
  }
  function quadratic(a, b, c) {
    var result = "";
    [[a, "x²"], [b, "x"], [c, ""]].forEach(function (term) {
      var value = term[0], suffix = term[1];
      if (!value) return;
      result += result ? (value < 0 ? " − " : " + ") : (value < 0 ? "−" : "");
      result += suffix && Math.abs(value) === 1 ? suffix : fmt(Math.abs(value)) + suffix;
    });
    return result || "0";
  }
  function coefficientFor(rng, root) {
    return pick(rng, Number.isInteger(root) ? NONZERO_COEFFICIENTS : EVEN_COEFFICIENTS);
  }
  function uniqueNumbers(values) {
    var found = [];
    values.forEach(function (v) {
      if (Number.isFinite(v) && !found.some(function (x) { return Math.abs(x - v) < 1e-10; })) found.push(v);
    });
    return found;
  }
  function diagnostics(answer, entries) {
    var result = [];
    entries.forEach(function (entry) {
      if (!Number.isFinite(entry.value) || Math.abs(entry.value - answer) < 1e-8) return;
      if (result.some(function (old) { return Math.abs(old.value - entry.value) < 1e-8; })) return;
      result.push(entry);
    });
    return result;
  }
  function family(id, title, skillId, goal, mode, maker) {
    return {
      id: id, topicId: "n9", title: title, skillId: skillId, goal: goal, mode: mode,
      generate: function (seed) {
        var rng = randomFor(seed, id);
        return Object.assign({
          id: id + "-v" + String(seed).padStart(3, "0"),
          familyId: id, topicId: "n9", variantSeed: seed,
          title: title, skillId: skillId
        }, maker(seed, rng));
      }
    };
  }

  var families = [
    family("eq-root-meaning", "Корень проходит проверку", "n9-root",
      "Понимать корень как значение, при котором две части исходного уравнения равны.", "quick",
      function (seed, rng) {
        var root = pick(rng, INTEGER_ROOTS), a = nonzero(rng, -7, 7), b = int(rng, -9, 9);
        var c = a * root + b;
        var candidates = uniqueNumbers([root, root + 1, root - 2, -root, c, b, root + 3]).slice(0, 4);
        return {
          type: "choice",
          prompt: "Какое значение является корнем уравнения " + linear(a, b) + " = " + fmt(c) + "? Проверь кандидатов подстановкой.",
          options: shuffle(candidates.map(function (value) {
            return {text: "x = " + fmt(value), correct: value === root, value: value};
          }), rng),
          hint: "Чтобы проверить корень, подставь число в обе части уравнения. По одному знаку числа вывод сделать нельзя.",
          explanation: "При x = " + fmt(root) + " левая часть равна " + fmt(a) + " · " + atom(root) + (b < 0 ? " − " + fmt(-b) : " + " + fmt(b)) + " = " + fmt(c) + ". Это равно правой части, поэтому " + fmt(root) + " — корень.",
          verification: {kind: "linear-equation", leftA: a, leftB: b, rightA: 0, rightB: c}
        };
      }),

    family("eq-linear-balance", "Линейное уравнение без шаблона", "n9-linear",
      "Находить корень при разных коэффициентах, расположениях неизвестного и дробной записи.", "quick",
      function (seed, rng) {
        var root = pick(rng, ROOT_HALVES) / 2, a = coefficientFor(rng, root), form = seed % 3;
        var b = nonzero(rng, -10, 10), c, d, prompt, explanation, entries, model;
        if (form === 0) {
          c = a * root + b;
          prompt = "Реши уравнение: " + linear(a, b) + " = " + fmt(c) + ".";
          explanation = "Вычитаем " + atom(b) + " из обеих частей: " + linear(a, 0) + " = " + fmt(c - b) + ". Делим на " + atom(a) + ": x = " + fmt(root) + ". При подстановке обе части равны " + fmt(c) + ".";
          entries = [
            {value: (c + b) / a, message: "Такой ответ получится, если прибавить свободное слагаемое вместо вычитания. Проверь одинаковое действие с обеими частями."},
            {value: c / a, message: "Так получится, если не учесть свободное слагаемое " + fmt(b) + ". Сначала освободи произведение с x."},
            {value: c - b, message: "Это значение произведения " + linear(a, 0) + ", а не самого x. Осталось разделить на коэффициент."}
          ];
          model = {kind: "linear-equation", leftA: a, leftB: b, rightA: 0, rightB: c};
        } else if (form === 1) {
          c = pick(rng, NONZERO_COEFFICIENTS.filter(function (v) { return v + a !== 0; }));
          d = a * root + b;
          prompt = "Реши уравнение: " + linear(a + c, b) + " = " + linear(c, d) + ".";
          explanation = "Вычитаем " + linear(c, 0) + " из обеих частей: " + linear(a, b) + " = " + fmt(d) + ". Затем " + linear(a, 0) + " = " + fmt(d - b) + ", поэтому x = " + fmt(root) + ". Подстановка в исходное уравнение даёт " + fmt((a + c) * root + b) + " в каждой части.";
          entries = [
            {value: (d + b) / a, message: "Этот ответ получается при неверном знаке свободного слагаемого. Из правой части нужно вычесть " + atom(b) + "."},
            {value: d - b, message: "Ты получил правую часть после переноса слагаемых. Перед x ещё остаётся коэффициент " + fmt(a) + "."}
          ];
          if (a + 2 * c !== 0) entries.push({value: (d - b) / (a + 2 * c), message: "Такой результат получается при сложении коэффициентов вместо вычитания. Чтобы убрать " + linear(c, 0) + " справа, вычти его из обеих частей."});
          model = {kind: "linear-equation", leftA: a + c, leftB: b, rightA: c, rightB: d};
        } else {
          d = int(rng, 2, 6); c = int(rng, -9, 9); b = d * c - a * root;
          prompt = "Реши уравнение: (" + linear(a, b) + ")/" + fmt(d) + " = " + fmt(c) + ".";
          explanation = "Умножаем обе части на " + fmt(d) + ": " + linear(a, b) + " = " + fmt(d * c) + ". Затем " + linear(a, 0) + " = " + fmt(d * c - b) + ". Получаем x = " + fmt(root) + ". Проверка: " + fmt(d * c) + "/" + fmt(d) + " = " + fmt(c) + ".";
          entries = [
            {value: (c - b) / a, message: "Такой ответ получится, если забыть умножить правую часть на знаменатель " + fmt(d) + "."},
            {value: (d * c + b) / a, message: "Знаменатель учтён, но проверь действие со свободным слагаемым: из обеих частей нужно вычесть " + atom(b) + "."},
            {value: d * c - b, message: "После удаления знаменателя и свободного слагаемого получилось значение " + linear(a, 0) + ". Коэффициент перед x ещё нужно учесть."}
          ];
          model = {kind: "constant-denominator-linear", a: a, b: b, denominator: d, right: c};
        }
        var probe = root + 1;
        var probeLeft = model.kind === "constant-denominator-linear" ? (model.a * probe + model.b) / model.denominator : model.leftA * probe + model.leftB;
        var probeRight = model.kind === "constant-denominator-linear" ? model.right : model.rightA * probe + model.rightB;
        entries.push({value: probe, message: "При подстановке этого значения слева получается " + fmt(probeLeft) + ", а справа " + fmt(probeRight) + ". Проверь, на каком преобразовании могло измениться равенство."});
        return {
          type: "number", answer: root, prompt: prompt,
          hint: "Выбери действие, которое уберёт одно препятствие: знаменатель, слагаемое с x справа или свободное слагаемое. Выполняй его с обеими частями.",
          explanation: explanation, diagnostics: diagnostics(root, entries), verification: model
        };
      }),

    family("eq-equivalent-actions", "Сохрани решения при преобразовании", "n9-equality",
      "Сравнивать допустимые действия и восстанавливать один явно заданный путь решения.", "creative",
      function (seed, rng) {
        var a = pick(rng, NONZERO_COEFFICIENTS), b = nonzero(rng, -5, 5);
        var roots = INTEGER_ROOTS.filter(function (r) { return r + b !== 0; });
        var root = pick(rng, roots), c = a * (root + b), expanded = a * b;
        var source = bracket(a, b) + " = " + fmt(c);
        var explanation = "Обе части можно разделить на ненулевое число " + atom(a) + ": " + shiftedX(b) + " = " + fmt(c / a) + ". После вычитания " + atom(b) + " получаем x = " + fmt(root) + ". Раскрытие скобок также допустимо. Деление только одной части меняет решения; умножение на ноль превращает уравнение в равенство, верное при любом x.";
        if (seed % 2 === 0) {
          var options = [
            {text: "Разделить обе части на " + atom(a) + ": " + shiftedX(b) + " = " + fmt(c / a), correct: true, equation: {leftA: 1, leftB: b, rightA: 0, rightB: c / a}},
            {text: "Раскрыть скобки: " + linear(a, expanded) + " = " + fmt(c), correct: true, equation: {leftA: a, leftB: expanded, rightA: 0, rightB: c}},
            {text: "Вычесть " + atom(expanded) + " из обеих частей; после упрощения: " + linear(a, 0) + " = " + fmt(c - expanded), correct: true, equation: {leftA: a, leftB: 0, rightA: 0, rightB: c - expanded}},
            {text: "Разделить на " + atom(a) + " только левую часть: " + shiftedX(b) + " = " + fmt(c), correct: false, equation: {leftA: 1, leftB: b, rightA: 0, rightB: c}},
            {text: "Умножить на коэффициент только x: " + linear(a, b) + " = " + fmt(c), correct: false, equation: {leftA: a, leftB: b, rightA: 0, rightB: c}},
            {text: "Умножить обе части на ноль и заменить исходное уравнение равенством 0 = 0.", correct: false, equation: {leftA: 0, leftB: 0, rightA: 0, rightB: 0}}
          ];
          return {
            type: "multi", prompt: "Для уравнения " + source + " выбери ВСЕ первые преобразования, которые сохраняют именно множество его решений.",
            options: shuffle(options, rng),
            hint: "Сохранить истинное равенство и сохранить всё множество решений — разные требования. Умножение на ноль требует особого внимания.",
            explanation: explanation,
            verification: {kind: "equivalent-linear-actions", original: {leftA: a, leftB: expanded, rightA: 0, rightB: c}}
          };
        }
        var answer = [
          "Делим обе части на " + atom(a) + ": " + shiftedX(b) + " = " + fmt(c / a) + ".",
          "Вычитаем " + atom(b) + " из обеих частей: x = " + fmt(c / a) + " − " + atom(b) + ".",
          "Вычисляем правую часть: x = " + fmt(root) + ".",
          "Проверяем в исходном уравнении: " + fmt(a) + " · (" + fmt(root) + (b < 0 ? " − " + fmt(-b) : " + " + fmt(b)) + ") = " + fmt(c) + "."
        ];
        return {
          type: "order", identityPrompt: "Уравнение: " + source + ". Восстанови именно этот короткий путь: сначала разделить обе части на внешний коэффициент, затем убрать свободное слагаемое, вычислить ответ и проверить его. Другие верные способы решения существуют.",
          prompt: "Уравнение: " + source + ". Восстанови именно этот короткий путь: сначала разделить обе части на множитель перед скобками, затем убрать свободное слагаемое, вычислить ответ и проверить его. Другие верные способы решения существуют.",
          items: differentOrder(answer, rng), answer: answer,
          hint: "Ориентируйся на названный порядок действий. Подстановка относится к уже найденному ответу.",
          explanation: explanation,
          verification: {kind: "ordered-linear-actions", a: a, offset: b, right: c}
        };
      }),

    family("eq-brackets", "Скобки: выбери удобный путь", "n9-brackets",
      "Решать уравнения со скобками, включая отрицательный множитель и два выражения в скобках.", "quick",
      function (seed, rng) {
        var root = pick(rng, INTEGER_ROOTS), a = pick(rng, NONZERO_COEFFICIENTS), b = nonzero(rng, -5, 5);
        var form = seed % 3, c, d, e, difference, prompt, explanation, model, entries;
        if (form === 0) {
          d = a * (root + b);
          prompt = "Реши уравнение: " + bracket(a, b) + " = " + fmt(d) + ".";
          explanation = "Удобно сначала разделить обе части на " + atom(a) + ": " + shiftedX(b) + " = " + fmt(d / a) + ". Затем x = " + fmt(d / a) + " − " + atom(b) + " = " + fmt(root) + ". Раскрытие скобок даёт тот же корень.";
          entries = [
            {value: (d - b) / a, message: "Этот ответ получится из неверного раскрытия " + bracket(a, b) + " как " + linear(a, b) + ". Внешний множитель относится к обоим слагаемым."},
            {value: d / a + b, message: "После деления осталось убрать слагаемое " + atom(b) + ". Его нужно вычесть из обеих частей."},
            {value: d - b, message: "Такой ответ получается, если убрать скобки без деления на множитель перед ними. Сначала учти множитель " + atom(a) + "."}
          ];
          model = {kind: "bracket-linear", a: a, offset: b, rightA: 0, rightB: d};
        } else if (form === 1) {
          c = pick(rng, NONZERO_COEFFICIENTS.filter(function (v) { return v !== a; }));
          difference = a - c; d = difference * root + a * b;
          prompt = "Реши уравнение: " + bracket(a, b) + " = " + linear(c, d) + ".";
          explanation = "После раскрытия скобок: " + linear(a, a * b) + " = " + linear(c, d) + ". Собираем слагаемые: " + linear(difference, 0) + " = " + fmt(d - a * b) + ", поэтому x = " + fmt(root) + ". Подстановка даёт " + fmt(a * (root + b)) + " с обеих сторон.";
          entries = [
            {value: (d - b) / difference, message: "Такой корень получается, если внешний множитель не умножил свободное слагаемое в скобках."},
            {value: (d + a * b) / difference, message: "Проверь знак при переносе постоянного слагаемого после раскрытия скобок: его вычитают из обеих частей."},
            {value: d - a * b, message: "Это правая часть после сбора слагаемых. Осталось разделить на коэффициент " + atom(difference) + "."}
          ];
          model = {kind: "bracket-linear", a: a, offset: b, rightA: c, rightB: d};
        } else {
          c = pick(rng, NONZERO_COEFFICIENTS.filter(function (v) { return v !== a; }));
          e = nonzero(rng, -5, 5); difference = a - c; d = difference * root + a * b - c * e;
          prompt = "Реши уравнение: " + bracket(a, b) + " = " + bracket(c, e) + (d < 0 ? " − " + fmt(-d) : d > 0 ? " + " + fmt(d) : "") + ".";
          explanation = "Раскрываем обе пары скобок: " + linear(a, a * b) + " = " + linear(c, c * e + d) + ". Получаем " + linear(difference, 0) + " = " + fmt(c * e + d - a * b) + ", затем x = " + fmt(root) + ". При подстановке обе исходные части равны " + fmt(a * (root + b)) + ".";
          entries = [
            {value: (c * e + d - b) / difference, message: "Так получается, если раскрыть левую скобку, не умножив её свободное слагаемое на множитель перед скобками."},
            {value: (e + d - a * b) / difference, message: "Проверь правые скобки: коэффициент " + atom(c) + " умножает и x, и число " + atom(e) + "."},
            {value: c * e + d - a * b, message: "Слагаемые собраны, но перед x ещё стоит коэффициент " + fmt(difference) + "."}
          ];
          model = {kind: "two-bracket-linear", leftA: a, leftOffset: b, rightA: c, rightOffset: e, rightExtra: d};
        }
        var probe = root + 1, probeLeft = a * (probe + b), probeRight = form === 0 ? d : form === 1 ? c * probe + d : c * (probe + e) + d;
        entries.push({value: probe, message: "Подстановка в исходную запись даёт " + fmt(probeLeft) + " слева и " + fmt(probeRight) + " справа. Сохрани скобки при проверке и сравни обе части."});
        return {
          type: "number", answer: root, prompt: prompt,
          hint: "Если вся часть уравнения — произведение, можно начать с деления. Если раскрываешь скобки, умножай каждый их член, особенно при отрицательном внешнем множителе.",
          explanation: explanation, diagnostics: diagnostics(root, entries), verification: model
        };
      }),

    family("eq-create-root", "Закажи корень, создай уравнение", "n9-root",
      "Сконструировать уравнение с заданным единственным корнем и принять разные правильные конструкции.", "creative",
      function (seed, rng) {
        var root = pick(rng, [-10, -6, -2, -1, 0, 1, 3, 4, 8, 10]) / 2;
        var variant = seed % 3, sign = seed % 2 === 0 ? 1 : -1;
        var a = pick(rng, variant === 0 ? (sign > 0 ? [2, 4, 6] : [-6, -4, -2]) : [-6, -4, -2, 2, 4, 6]);
        var b, c, fields, constants = {r: root}, prompt, hint;
        var aField = {name: "a", label: "Коэффициент a", min: -6, max: 6, step: 1, integer: true, initial: 0};
        var conditions = [{left: variant === 0 ? "a" : "abs(a)", op: variant === 0 && sign < 0 ? "lt" : "gt", right: "0"}, {left: "a*r+b", op: "eq", right: "c"}];
        var witness;
        if (variant === 0) {
          b = int(rng, -6, 6); c = a * root + b;
          fields = [aField,
            {name: "b", label: "Свободное слагаемое b", min: -40, max: 40, step: 1, integer: true, initial: 0},
            {name: "c", label: "Правая часть c", min: -40, max: 40, step: 1, integer: true, initial: 0}];
          witness = {a: a, b: b, c: c};
          prompt = "Создай уравнение ax + b = c с единственным корнем x = " + fmt(root) + ". Коэффициент a должен быть " + (sign > 0 ? "положительным" : "отрицательным") + ". Выбирай целые числа в указанных диапазонах. Разных правильных уравнений может быть много.";
          hint = "Выбери коэффициент a нужного знака и число b. Подставь заказанный корень: получившееся значение станет правой частью c. При дробном корне проверь целочисленность c.";
        } else if (variant === 1) {
          c = int(rng, -18, 18); b = c - a * root; constants.c = c;
          fields = [aField, {name: "b", label: "Свободное слагаемое b", min: -60, max: 60, step: 1, integer: true, initial: 0}];
          witness = {a: a, b: b};
          prompt = "Правая часть уже заказана: ax + b = " + fmt(c) + ". Подбери целые a и b так, чтобы единственным корнем был x = " + fmt(root) + ". Коэффициент a не должен равняться нулю. Найди любой допустимый вариант.";
          hint = "Правая часть фиксирована. Выбери ненулевой a, подставь заданный корень и определи, какое b нужно добавить до указанной правой части.";
        } else {
          b = int(rng, -12, 12); c = a * root + b; constants.b = b;
          fields = [aField, {name: "c", label: "Правая часть c", min: -60, max: 60, step: 1, integer: true, initial: 0}];
          witness = {a: a, c: c};
          prompt = "Свободное слагаемое менять нельзя: ax" + (b < 0 ? " − " + fmt(-b) : b > 0 ? " + " + fmt(b) : "") + " = c. Подбери целые a и c, чтобы единственным корнем был x = " + fmt(root) + ". Требуется a ≠ 0; разных решений заказа может быть несколько.";
          hint = "Выбери ненулевой a. Подставь заказанный корень, сохрани фиксированное свободное слагаемое и вычисли нужную правую часть c.";
        }
        return {
          type: "build",
          prompt: prompt, fields: fields, constants: constants, conditions: conditions,
          exampleSolution: witness, hint: hint,
          explanation: "Один пример: " + linear(a, b) + " = " + fmt(c) + ". Подстановка x = " + fmt(root) + " даёт равенство. Коэффициент a ненулевой, поэтому корень единственный. Другие наборы принимаются, если выполняют те же условия; образец не является единственным ответом.",
          verification: {kind: "construct-linear-root", requestedRoot: root, fixedB: variant === 2 ? b : null, fixedRight: variant === 1 ? c : null, coefficientSign: variant === 0 ? sign : 0}
        };
      }),

    family("eq-first-error", "Найди первую ошибочную строку", "n9-brackets",
      "Отличать источник ошибки от дальнейших шагов, правильно выполненных уже для неверной строки.", "creative",
      function (seed, rng) {
        var variant = seed % 3, a = pick(rng, NONZERO_COEFFICIENTS), b = nonzero(rng, -4, 4);
        var c = pick(rng, NONZERO_COEFFICIENTS.filter(function (v) { return v !== a && (variant !== 2 || v !== -a); }));
        var root = pick(rng, INTEGER_ROOTS.filter(function (v) { return variant !== 2 || v !== 0; }));
        var difference = a - c, expanded = a * b, d = difference * root + expanded;
        var lines, equations, reason;
        if (variant === 0) {
          lines = [linear(a, b) + " = " + linear(c, d), linear(difference, 0) + " = " + fmt(d - b), "x = " + fraction(d - b, difference)];
          equations = [{leftA: a, leftB: b, rightA: c, rightB: d}, {leftA: difference, leftB: 0, rightA: 0, rightB: d - b}, {leftA: 1, leftB: 0, rightA: 0, rightB: (d - b) / difference}];
          reason = "Ошибка уже в строке 1: внешний множитель должен умножить также свободное слагаемое. Вместо " + fmt(b) + " получается " + fmt(a) + " · " + atom(b) + " = " + fmt(expanded) + ".";
        } else if (variant === 1) {
          lines = [linear(a, expanded) + " = " + linear(c, d), linear(difference, 0) + " = " + fmt(d + expanded), "x = " + fraction(d + expanded, difference)];
          equations = [{leftA: a, leftB: expanded, rightA: c, rightB: d}, {leftA: difference, leftB: 0, rightA: 0, rightB: d + expanded}, {leftA: 1, leftB: 0, rightA: 0, rightB: (d + expanded) / difference}];
          reason = "Первая ошибка в строке 2: постоянное слагаемое " + atom(expanded) + " нужно вычесть из обеих частей, а не прибавить к правой части.";
        } else {
          lines = [linear(a, expanded) + " = " + linear(c, d), linear(difference, 0) + " = " + fmt(d - expanded), "x = " + fraction(d - expanded, a + c)];
          equations = [{leftA: a, leftB: expanded, rightA: c, rightB: d}, {leftA: difference, leftB: 0, rightA: 0, rightB: d - expanded}, {leftA: 1, leftB: 0, rightA: 0, rightB: (d - expanded) / (a + c)}];
          reason = "Первые две строки верны. В строке 3 нужно разделить на коэффициент " + atom(difference) + ", который стоит перед x во второй строке; вместо него использовали " + atom(a + c) + ".";
        }
        var options = [1, 2, 3].map(function (lineNumber) { return {text: "Первая ошибка — строка " + lineNumber, correct: lineNumber === variant + 1, lineNumber: lineNumber}; });
        options.push({text: "Все три строки верны", correct: false, lineNumber: 0});
        return {
          type: "choice",
          prompt: "Исходное уравнение: " + bracket(a, b) + " = " + linear(c, d) + ". Найди ПЕРВУЮ ошибочную строку в записанном решении.\n" + lines.map(function (line, i) { return (i + 1) + ") " + line; }).join("\n"),
          options: shuffle(options, rng),
          hint: "Сравнивай каждую строку с предыдущей, начиная с исходного уравнения. Поздняя строка может быть верным следствием уже испорченной записи.",
          explanation: reason + " Правильная цепочка приводит к " + linear(difference, 0) + " = " + fmt(d - expanded) + ", то есть x = " + fmt(root) + ".",
          verification: {kind: "first-linear-error", original: {leftA: a, leftB: expanded, rightA: c, rightB: d}, rows: equations, firstErrorLine: variant + 1}
        };
      }),

    family("eq-lost-zero-root", "Куда исчез нулевой корень?", "n9-quadratic",
      "Замечать, что деление на выражение с неизвестным может убрать допустимый корень.", "creative",
      function (seed, rng) {
        var root = pick(rng, [-6, -4, -3, -2, -1, -0.5, 0.5, 1, 2, 3, 5]);
        var a = coefficientFor(rng, root), b = -a * root;
        var candidates = uniqueNumbers([0, root, -root, root + 1, root - 1, 2 * root + 2]).slice(0, 4);
        return {
          type: "multi",
          prompt: "Исходное уравнение: " + quadratic(a, b, 0) + " = 0. Ученик разделил обе части на x и оставил только " + linear(a, b) + " = 0. Отметь ВСЕ корни исходного уравнения, чтобы проверить, не потерялось ли решение.",
          options: shuffle(candidates.map(function (value) { return {text: "x = " + fmt(value), correct: value === 0 || value === root, value: value}; }), rng),
          hint: "Сначала отдельно проверь x = 0 в исходной записи. Для остальных значений можно исследовать второй множитель.",
          explanation: "Разложим левую часть на множители: x · (" + linear(a, b) + ") = 0. Поэтому x = 0 или x = " + fmt(root) + ". Деление на x допустимо только при x ≠ 0; без отдельной проверки оно теряет нулевой корень.",
          verification: {kind: "quadratic-root-set", a: a, b: b, c: 0}
        };
      }),

    family("eq-quadratic-roots", "Квадратное уравнение: корни и выбор ответа", "n9-quadratic",
      "Различать два корня, один повторяющийся корень и отсутствие действительных корней; отвечать именно на вопрос условия.", "quick",
      function (seed, rng) {
        var variant = seed % 4, a = int(rng, 1, 4), b, c, r1, r2, answer, prompt, explanation, entries;
        if (variant === 0) {
          r1 = int(rng, -7, 7); r2 = pick(rng, Array.from({length: 15}, function (_, i) { return i - 7; }).filter(function (v) { return v !== r1; }));
          b = -a * (r1 + r2); c = a * r1 * r2;
          var smaller = int(rng, 0, 1) === 0;
          answer = smaller ? Math.min(r1, r2) : Math.max(r1, r2);
          var other = smaller ? Math.max(r1, r2) : Math.min(r1, r2), requested = smaller ? "меньший" : "больший";
          prompt = "Реши уравнение " + quadratic(a, b, c) + " = 0. В ответ запиши " + requested + " корень.";
          explanation = "Левая часть раскладывается как " + (a === 1 ? "" : fmt(a) + " · ") + "(" + shiftedX(-r1) + ") · (" + shiftedX(-r2) + "). Корни: " + fmt(r1) + " и " + fmt(r2) + ". По условию нужен " + requested + ": " + fmt(answer) + ".";
          entries = [
            {value: other, message: fmt(other) + " тоже является корнем, но условие просит " + requested + " корень. Сравни оба числа, учитывая их знаки."},
            {value: r1 + r2, message: "Это сумма двух корней. В условии требуется один из корней, выбранный после сравнения."},
            {value: r1 * r2, message: "Это произведение корней. Подставлять его вместо одного из корней нельзя без проверки."}
          ];
        } else if (variant === 1) {
          answer = int(rng, -6, 6); b = -2 * a * answer; c = a * answer * answer;
          prompt = "Найди единственный действительный корень уравнения " + quadratic(a, b, c) + " = 0.";
          explanation = "Левая часть равна " + (a === 1 ? "" : fmt(a) + " · ") + "(" + shiftedX(-answer) + ")². Квадрат равен нулю только при " + shiftedX(-answer) + " = 0, поэтому x = " + fmt(answer) + ". Повторение одного корня не даёт двух разных значений.";
          entries = [
            {value: -answer, message: "Проверь знак в выражении, возводимом в квадрат. Само это выражение должно обратиться в ноль."},
            {value: answer * answer, message: "Здесь записан квадрат нужного значения, а не значение x. Реши линейное условие внутри квадрата."}
          ];
        } else if (variant === 2) {
          var magnitude = int(rng, 1, 9), negative = int(rng, 0, 1) === 0;
          b = 0; c = -a * magnitude * magnitude; answer = negative ? -magnitude : magnitude;
          prompt = "Найди " + (negative ? "отрицательный" : "положительный") + " корень уравнения " + quadratic(a, b, c) + " = 0.";
          explanation = "После деления на " + fmt(a) + " получаем x² = " + fmt(magnitude * magnitude) + ". Корни " + fmt(-magnitude) + " и " + fmt(magnitude) + ". Нужный по условию корень: " + fmt(answer) + ".";
          entries = [
            {value: -answer, message: "Этот корень удовлетворяет уравнению, но не условию о знаке ответа."},
            {value: magnitude * magnitude, message: "Это значение x², а требуется само x нужного знака."},
            {value: 0, message: "При x = 0 левая часть равна " + fmt(c) + ", а не нулю."}
          ];
        } else {
          var positive = int(rng, 1, 9); b = 0; c = a * positive * positive;
          return {
            type: "choice",
            prompt: "Какие решения среди действительных чисел имеет уравнение " + quadratic(a, b, c) + " = 0?",
            options: shuffle([
              {text: "Действительных корней нет", correct: true},
              {text: "Только x = 0", correct: false},
              {text: "Два корня: " + fmt(-positive) + " и " + fmt(positive), correct: false},
              {text: "Подходит любое действительное число", correct: false}
            ], rng),
            hint: "Квадрат действительного числа неотрицателен. Проверь знак коэффициента перед квадратом и свободного слагаемого.",
            explanation: "При любом действительном x слагаемое " + (a === 1 ? "x²" : fmt(a) + "x²") + " неотрицательно. К нему прибавляется положительное число " + fmt(c) + ". Левая часть строго положительна, поэтому равняться нулю не может.",
            verification: {kind: "quadratic-no-real-roots", a: a, b: b, c: c}
          };
        }
        var probe = answer + 1;
        if (a * probe * probe + b * probe + c === 0) probe = answer + 2;
        entries.push({value: probe, message: "При таком значении левая часть равна " + fmt(a * probe * probe + b * probe + c) + ". Проверь подстановку в исходное уравнение."});
        return {
          type: "number", answer: answer, prompt: prompt,
          hint: "Найди все действительные корни рассматриваемого уравнения, затем проверь, какое значение просит условие. Два одинаковых результата — один различный корень.",
          explanation: explanation, diagnostics: diagnostics(answer, entries),
          verification: {kind: "quadratic-selected-root", a: a, b: b, c: c, request: variant === 0 ? requested : variant === 1 ? "единственный" : negative ? "отрицательный" : "положительный"}
        };
      }),

    family("eq-rational-domain", "Сократи запись, сохрани ограничение", "n9-domain",
      "Сохранять область допустимых значений при сокращении и отклонять запрещённый кандидат в корни.", "creative",
      function (seed, rng) {
        var excluded = int(rng, -6, 6), candidate = seed % 4 === 0 ? excluded : pick(rng, Array.from({length: 15}, function (_, i) { return i - 7; }).filter(function (v) { return v !== excluded; }));
        var factor = shiftedX(-excluded), other = shiftedX(-candidate), hasRoot = candidate !== excluded;
        var options = [
          {text: "Значение x = " + fmt(excluded) + " запрещено в исходном уравнении.", correct: true},
          {text: "После сокращения нужно сохранить условие x ≠ " + fmt(excluded) + ".", correct: true},
          {text: "Можно забыть ограничение, когда одинаковые множители сокращены.", correct: false}
        ];
        if (hasRoot) {
          options.push({text: "Единственный корень исходного уравнения: x = " + fmt(candidate) + ".", correct: true});
          options.push({text: "x = " + fmt(excluded) + " тоже является корнем, потому что числитель равен нулю.", correct: false});
        } else {
          options.push({text: "У исходного уравнения нет корней.", correct: true});
          options.push({text: "x = " + fmt(excluded) + " — единственный корень исходного уравнения.", correct: false});
        }
        return {
          type: "multi",
          prompt: "Дано уравнение [(" + factor + ") · (" + other + ")]/(" + factor + ") = 0. Выбери ВСЕ верные утверждения о сокращении и решениях исходного уравнения.",
          options: shuffle(options, rng),
          hint: "Сначала проверь знаменатель. Сокращение упрощает запись только при допустимых x и не возвращает исключённое значение.",
          explanation: "В исходной записи x ≠ " + fmt(excluded) + ". На этой области после сокращения получаем " + other + " = 0, то есть кандидат x = " + fmt(candidate) + ". " + (hasRoot ? "Он допустим: знаменатель равен " + fmt(candidate - excluded) + ", поэтому это единственный корень." : "Но это запрещённое значение. В исходном выражении получается деление на ноль, поэтому корней нет."),
          verification: {kind: "cancelled-rational", excluded: excluded, numeratorSecondRoot: candidate}
        };
      }),

    family("eq-rational-solve", "Рациональное уравнение: вернись к исходной записи", "n9-domain",
      "Решать простое рациональное уравнение и проверять допустимость найденного значения.", "quick",
      function (seed, rng) {
        var root = pick(rng, ROOT_HALVES) / 2, difference = coefficientFor(rng, root);
        var excluded = pick(rng, Array.from({length: 13}, function (_, i) { return i - 6; }).filter(function (v) { return v !== root; }));
        var rightChoices = seed % 5 === 0 ? [0] : [-4, -3, -2, 2, 3, 4];
        rightChoices = rightChoices.filter(function (v) { return v + difference !== 0; });
        var c = pick(rng, rightChoices), a = difference + c, b = -difference * root - c * excluded;
        var entries = [
          {value: excluded, message: "При этом значении знаменатель равен нулю. Оно не может быть корнем исходного уравнения, даже если появляется в промежуточной записи."},
          {value: (c * excluded - b) / difference, message: "Такой ответ получается при неверном знаке постоянного слагаемого после раскрытия правой скобки. Проверь произведение правой части на знаменатель."},
          {value: -b / difference, message: "Этот результат получится, если при умножении на знаменатель потерять его постоянное слагаемое."},
          {value: -b - c * excluded, message: "Это значение произведения " + linear(difference, 0) + ". Нужно ещё разделить на коэффициент при x."}
        ];
        var probe = root + 1 === excluded ? root - 1 : root + 1;
        entries.push({value: probe, message: "Подставь это значение именно в исходную дробь. Получится " + fraction(2 * (a * probe + b), 2 * (probe - excluded)) + ", тогда как справа стоит " + fmt(c) + "."});
        return {
          type: "number", answer: root,
          prompt: "Реши уравнение (" + linear(a, b) + ")/(" + shiftedX(-excluded) + ") = " + fmt(c) + ". Найденный корень должен быть допустим в исходной записи.",
          hint: "Исключи значение, обращающее знаменатель в ноль. Для остальных x умножь обе части на знаменатель, реши линейное уравнение и вернись к исходной дроби.",
          explanation: "Область допустимых значений: x ≠ " + fmt(excluded) + ". После умножения на знаменатель: " + linear(a, b) + " = " + bracket(c, -excluded) + ". Получаем " + linear(difference, 0) + " = " + fmt(-b - c * excluded) + ", поэтому x = " + fmt(root) + ". Знаменатель при этом равен " + fmt(root - excluded) + " и не равен нулю; значение исходной дроби — " + fmt(c) + ".",
          diagnostics: diagnostics(root, entries),
          verification: {kind: "linear-rational", numeratorA: a, numeratorB: b, denominatorRoot: excluded, right: c}
        };
      })
  ];

  var routes = [
    {
      id: "route-eq-linear-foundation", topicId: "n9", title: "От проверки корня к своему уравнению",
      goal: "Короткий линейный маршрут: проверить смысл ответа, исследовать преобразования и закончить новым обычным уравнением. Квадратные и рациональные уравнения здесь не требуются.",
      steps: [
        {familyId: "eq-root-meaning", label: "Вход: проверь кандидата в корни"},
        {familyId: "eq-equivalent-actions", label: "По желанию: сохрани решения при преобразовании"},
        {familyId: "eq-create-root", label: "По желанию: создай уравнение с заказанным корнем"},
        {familyId: "eq-linear-balance", label: "Новая обычная задача без готовой цепочки"}
      ]
    },
    {
      id: "route-eq-brackets-and-repair", topicId: "n9", title: "Скобки и проверка каждого перехода",
      goal: "Решить уравнение со скобками, по желанию сравнить действия и найти источник ошибки, затем решить другое уравнение со скобками без готовой цепочки.",
      steps: [
        {familyId: "eq-brackets", label: "Вход: реши уравнение со скобками"},
        {familyId: "eq-equivalent-actions", label: "По желанию: сравни действия или собери выбранный путь"},
        {familyId: "eq-first-error", label: "По желанию: найди первую ошибочную строку"},
        {familyId: "eq-brackets", label: "Новая обычная проверка со скобками"}
      ]
    },
    {
      id: "route-eq-roots-and-domain", topicId: "n9", title: "Все корни и допустимые значения",
      goal: "Дополнительный маршрут после линейного: различать число корней, не терять нулевой корень и не принимать значение с нулевым знаменателем.",
      steps: [
        {familyId: "eq-quadratic-roots", label: "Вход: реши обычное квадратное уравнение"},
        {familyId: "eq-lost-zero-root", label: "По желанию: верни потерянный корень"},
        {familyId: "eq-rational-domain", label: "По желанию: сохрани ограничение после сокращения"},
        {familyId: "eq-rational-solve", label: "Новая обычная проверка с дробью и неизвестным знаменателем"}
      ]
    }
  ];

  var bundle = {families: families, routes: routes};
  if (typeof module !== "undefined" && module.exports) module.exports = bundle;
  if (browserRoot) (browserRoot.OGE_SERIES_PARTS || (browserRoot.OGE_SERIES_PARTS = [])).push(bundle);
}(typeof window !== "undefined" ? window : null));
