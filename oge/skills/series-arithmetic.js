(function () {
  "use strict";

  // The returned tasks are fresh data objects. This module does not read the DOM,
  // use network resources, or maintain state between generate(seed) calls.
  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function randomFor(seed, salt) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 999) {
      throw new RangeError("Seed must be an integer from 0 to 999.");
    }
    var state = (Math.imul(seed + 1, 0x9e3779b1) ^ salt) >>> 0;
    if (!state) state = 0x6d2b79f5;
    function next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    }
    function int(min, max) { return min + Math.floor(next() * (max - min + 1)); }
    return {
      int: int,
      pick: function (items) { return items[int(0, items.length - 1)]; },
      shuffle: function (items) {
        var result = items.slice();
        for (var i = result.length - 1; i > 0; i--) {
          var j = int(0, i), temp = result[i];
          result[i] = result[j]; result[j] = temp;
        }
        return result;
      }
    };
  }
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function fmt(x) {
    return String(Number(x.toPrecision(12))).replace(/-/g, "−").replace(".", ",");
  }
  function operand(x) { return x < 0 ? "(" + fmt(x) + ")" : fmt(x); }
  function countForm(n, one, few, many) {
    var last = Math.abs(n) % 100;
    if (last >= 11 && last <= 14) return many;
    return last % 10 === 1 ? one : last % 10 >= 2 && last % 10 <= 4 ? few : many;
  }
  function counted(n, one, few, many) { return n + " " + countForm(n, one, few, many); }
  function signedUnits(n, negative) {
    return negative ? counted(n, "отрицательная единица", "отрицательные единицы", "отрицательных единиц") :
      counted(n, "положительная единица", "положительные единицы", "положительных единиц");
  }
  function remainingUnits(n, negative) {
    return countForm(n, "Остаётся ", "Остаются ", "Остаётся ") + signedUnits(n, negative);
  }
  function reducedEquality(n, d) {
    return fraction(n, d) === rawFraction(n, d) ? "" : " = " + fraction(n, d);
  }
  function rawFraction(n, d) { return fmt(n) + "/" + d; }
  function fraction(n, d) {
    if (!n) return "0";
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? fmt(n) : rawFraction(n, d);
  }
  function approximatelyEqual(a, b) {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  function diagnostics(answer, entries) {
    var result = [];
    entries.forEach(function (entry) {
      if (Number.isFinite(entry.value) &&
          !approximatelyEqual(entry.value, answer) &&
          !result.some(function (other) { return approximatelyEqual(other.value, entry.value); })) {
        result.push({value: entry.value, message: entry.message});
      }
    });
    return result;
  }
  function integerField(name, label, min, max, initial) {
    return {name: name, label: label, min: min, max: max, step: 1, integer: true, initial: initial};
  }
  function defineFamily(meta, generate) {
    var salt = hash(meta.id);
    return Object.assign({}, meta, {
      generate: function (seed) {
        var generated = generate(seed, randomFor(seed, salt));
        return Object.assign({id: meta.id + "-" + seed, skillId: meta.skillId}, generated);
      }
    });
  }

  var families = [
    defineFamily({
      id: "arith-signed-plain", topicId: "base", title: "Суммы и разности со знаком",
      skillId: "base-sign", mode: "quick",
      goal: "Вычислять обычные суммы и разности, различая знак числа и знак действия."
    }, function (seed, rng) {
      var m = rng.int(2, 12), n = rng.int(1, 12), mode = seed % 4;
      var expression, answer, hint, explanation, wrong;
      if (mode === 0) {
        expression = fmt(-m) + " + " + n; answer = n - m;
        hint = "У слагаемых разные знаки. Сначала выясни, каких единиц после компенсации останется больше.";
        explanation = "Убираем " + counted(Math.min(m, n), "пару", "пары", "пар") + " +1 и −1. " +
          (answer === 0 ? "Все единицы погасились: сумма равна 0." :
            remainingUnits(Math.abs(answer), answer < 0) + ". Сумма равна " + fmt(answer) + ".");
        wrong = [
          {value: -(m + n), message: "Так получается при сложении двух отрицательных чисел. Здесь второе слагаемое положительно."},
          {value: m - n, message: "Проверь знак: он определяется тем, каких единиц осталось больше."}
        ];
      } else if (mode === 1) {
        expression = fmt(-m) + " + " + operand(-n); answer = -m - n;
        hint = "Оба слагаемых направлены в отрицательную сторону. Их модули складываются.";
        explanation = "Складываем два отрицательных числа. Складываем их модули: " + m + " + " + n + " = " +
          (m + n) + ", затем ставим знак минус: " + expression + " = " + fmt(answer) + ".";
        wrong = [
          {value: m + n, message: "Количество единиц найдено, но оба слагаемых отрицательны. Проверь знак суммы."},
          {value: n - m, message: "Встречные пары здесь не гасятся: оба слагаемых одного знака."}
        ];
      } else if (mode === 2) {
        var a = rng.pick([-m, m]);
        expression = fmt(a) + " − " + operand(-n); answer = a + n;
        hint = "Вычесть отрицательное число — значит прибавить противоположное ему положительное число.";
        explanation = expression + " = " + fmt(a) + " + " + n + " = " + fmt(answer) +
          ". Проверка: " + fmt(answer) + " + " + operand(-n) + " = " + fmt(a) + ".";
        wrong = [
          {value: a - n, message: "Вычитаемое отрицательно. При переходе к сложению его нужно заменить противоположным числом."},
          {value: -answer, message: "После переписывания проверь направление изменения и знак результата."}
        ];
      } else {
        expression = fmt(-m) + " − " + n; answer = -m - n;
        hint = "Вычитание положительного числа передвигает точку ещё левее.";
        explanation = expression + " = " + fmt(-m) + " + " + operand(-n) + " = " + fmt(answer) +
          ". Отрицательная величина по модулю увеличилась.";
        wrong = [
          {value: n - m, message: "Здесь вычитается положительное число. Сравни результат с исходным отрицательным числом."},
          {value: m + n, message: "Проверь знак результата: движение началось левее нуля и продолжилось влево."}
        ];
      }
      return {
        type: "number", title: "Вычисли и проверь знак", variant: ["opposite-signs", "same-negative-signs", "subtract-negative", "subtract-positive"][mode],
        prompt: "Вычисли: " + expression + ".", answer: answer,
        hint: hint, explanation: explanation, diagnostics: diagnostics(answer, wrong)
      };
    }),

    defineFamily({
      id: "arith-decimal-plain", topicId: "n6", title: "Десятичные действия без лишних шагов",
      skillId: "n6-decimal", mode: "quick",
      goal: "Самостоятельно вычислять с десятичными числами и проверять разряд результата."
    }, function (seed, rng) {
      var mode = seed % 4, a, b, answer, prompt, hint, explanation, wrong;
      if (mode === 0) {
        var firstCents = rng.int(0, 5) * 100 + rng.int(1, 8) * 10;
        var secondCents = rng.int(1, 99);
        a = firstCents / 100; b = secondCents / 100; answer = (firstCents + secondCents) / 100;
        prompt = "Вычисли: " + fmt(a) + " + " + fmt(b) + ".";
        hint = "Вырази оба числа в сотых. Разряды должны складываться с одноимёнными разрядами.";
        explanation = "Считаем в сотых: " + firstCents + " + " + secondCents + " = " +
          (firstCents + secondCents) + ". Возвращаемся к десятичной записи: " + fmt(answer) + ".";
        wrong = [{value: (firstCents + secondCents * 10) / 100, message: "Проверь размер единиц второго слагаемого: сотые не становятся десятыми."}];
      } else if (mode === 1) {
        var minuend = rng.int(1, 6) * 100 + rng.int(0, 9) * 10;
        var subtrahend = rng.int(1, 9) * 10 + rng.int(1, 9);
        a = minuend / 100; b = subtrahend / 100; answer = (minuend - subtrahend) / 100;
        prompt = "Вычисли: " + fmt(a) + " − " + fmt(b) + ".";
        hint = "У первого числа можно дописать ноль в разряде сотых. При необходимости выполни размен.";
        explanation = "Считаем в сотых: " + minuend + " − " + subtrahend + " = " +
          (minuend - subtrahend) + ". Ответ: " + fmt(answer) +
          ". Проверка: " + fmt(answer) + " + " + fmt(b) + " = " + fmt(a) + ".";
        wrong = [
          {value: (minuend + subtrahend) / 100, message: "Проверь действие: из первой величины убирают вторую."},
          {value: (minuend - subtrahend * 10) / 100, message: "Сначала приведи оба числа к сотым, затем вычитай."}
        ];
      } else if (mode === 2) {
        var cents = rng.int(11, 99), factor = rng.int(2, 9);
        a = cents / 100; b = factor; answer = cents * factor / 100;
        prompt = "Вычисли: " + fmt(a) + " × " + factor + ".";
        hint = "Умножь количество сотых. Каждая такая единица остаётся сотой.";
        explanation = "Считаем в сотых: " + cents + " × " + factor + " = " + (cents * factor) +
          ". Возвращаемся к десятичной записи: " + fmt(answer) + ".";
        wrong = [
          {value: answer * 10, message: "Проверь запятую. В исходном числе считались сотые, а не десятые."},
          {value: answer / 10, message: "Сравни произведение с исходным положительным числом: умножение на целое больше 1 увеличивает его."}
        ];
      } else {
        var divisorCents = rng.pick([4, 5, 8, 12, 15, 20, 25, 40, 50, 75]), quotient = rng.int(2, 9);
        a = divisorCents * quotient / 100; b = divisorCents / 100; answer = quotient;
        prompt = "Вычисли: " + fmt(a) + " ÷ " + fmt(b) + ".";
        hint = "Посчитай, сколько одинаковых мерок длиной " + fmt(b) + " содержится в " + fmt(a) + ".";
        explanation = "Выражаем оба числа в сотых и делим: " + (divisorCents * quotient) + " ÷ " + divisorCents + " = " +
          quotient + ". Проверка: " + quotient + " × " + fmt(b) + " = " + fmt(a) + ".";
        wrong = [
          {value: quotient / 10, message: "При переводе обоих чисел в сотые частное не уменьшается в десять раз."},
          {value: 1 / quotient, message: "Проверь порядок: делимое больше делителя, поэтому частное здесь больше 1."}
        ];
      }
      return {
        type: "number", title: "Сохрани разряды", variant: ["decimal-add", "decimal-subtract", "decimal-times-integer", "decimal-divide"][mode],
        prompt: prompt, answer: answer, hint: hint, explanation: explanation,
        diagnostics: diagnostics(answer, wrong)
      };
    }),

    defineFamily({
      id: "arith-division-plain", topicId: "base", title: "Частное и остаток",
      skillId: "base-division", mode: "quick",
      goal: "Различать число полных групп и остаток; проверять, что остаток меньше делителя."
    }, function (seed, rng) {
      var mode = seed % 4, d = rng.int(3, 15), q = rng.int(3, 24), r = mode === 0 ? 0 : rng.int(1, d - 1);
      if (mode === 3) q = 0;
      var total = d * q + r;
      // Keep both questions for exact division and for a dividend smaller than
      // the divisor. In particular, zero must occur as a requested answer.
      var alternateQuestion = Math.floor(seed / 4) % 2 === 1;
      var asksQuotient = mode === 2 || (mode === 0 && !alternateQuestion) || (mode === 3 && alternateQuestion);
      var answer = asksQuotient ? q : r;
      var variant = mode === 0 ? (asksQuotient ? "exact-quotient" : "zero-remainder") :
        mode === 3 ? (asksQuotient ? "zero-quotient" : "dividend-smaller") :
        mode === 1 ? "nonzero-remainder" : "quotient-with-remainder";
      return {
        type: "number", title: asksQuotient ? "Сколько полных групп?" : "Что останется?",
        variant: variant,
        prompt: asksQuotient ?
          "Раздели " + total + " на " + d + ". В ответе укажи целое частное — число полных групп." :
          "Раздели " + total + " на " + d + ". В ответе укажи только остаток.",
        answer: answer,
        hint: "Найди наибольшее кратное " + d + ", которое не превосходит " + total + ". Остаток должен быть меньше " + d + ".",
        explanation: total + " = " + d + " × " + q + " + " + r + ". Полных групп " + q +
          ", остаток " + r + "; 0 ≤ " + r + " < " + d + ". " +
          (asksQuotient ? "Спрашивали целое частное: " + q + "." : "Спрашивали остаток: " + r + "."),
        diagnostics: diagnostics(answer, [
          {value: asksQuotient ? r : q, message: asksQuotient ? "В ответе нужно число полных групп, а не остаток." : "В ответе нужен остаток, а не число полных групп."},
          {value: total / d, message: "При делении с остатком указывают целое частное и оставшуюся часть отдельно."},
          {value: asksQuotient ? q + 1 : r + d, message: asksQuotient ? "Проверь, хватит ли исходного количества ещё на одну полную группу." : "Из такого остатка можно выделить ещё одну полную группу. Остаток должен быть меньше делителя."}
        ])
      };
    }),

    defineFamily({
      id: "arith-fraction-plain", topicId: "n6", title: "Сложение и вычитание дробей",
      skillId: "n6-common", mode: "quick",
      goal: "Самостоятельно вычислять с одинаковыми и разными знаменателями, включая переход через единицу."
    }, function (seed, rng) {
      var mode = seed % 4, da, db, na, nb, operation;
      if (mode === 2) {
        da = rng.int(3, 12); db = da; na = rng.int(1, da - 1); nb = rng.int(1, db - 1); operation = "+";
      } else if (mode === 3) {
        da = rng.int(2, 8); na = rng.int(1, da - 1);
        var scale = rng.int(2, 4); db = da * scale; nb = na * scale; operation = "−";
      } else {
        var pair = rng.pick([[2, 3], [3, 4], [4, 6], [5, 10], [4, 8], [6, 9]]);
        da = pair[0]; db = pair[1]; na = rng.int(1, da - 1); nb = rng.int(1, db - 1);
        operation = mode === 0 ? "+" : "−";
        if (mode === 1 && na * db < nb * da) {
          var swap = na; na = nb; nb = swap;
          swap = da; da = db; db = swap;
        }
      }
      var denominator = lcm(da, db), ca = na * denominator / da, cb = nb * denominator / db;
      var numerator = operation === "+" ? ca + cb : ca - cb, answer = numerator / denominator;
      var wrongNumerator = operation === "+" ? na + nb : na - nb;
      return {
        type: "number", title: "Вычисли без обязательной модели",
        variant: ["add-different-denominators", "subtract-different-denominators", "add-same-denominator", "equal-fractions-difference"][mode],
        prompt: "Вычисли: " + rawFraction(na, da) + " " + operation + " " + rawFraction(nb, db) +
          ". Ответ можно записать дробью через /.",
        answer: answer,
        hint: mode === 3 ? "Посмотри, не обозначают ли обе записи одну величину." :
          "Перед сложением или вычитанием выбери одинаковые доли одного целого.",
        explanation: "Общая мерка — 1/" + denominator + ": " + ca + "/" + denominator + " " +
          operation + " " + cb + "/" + denominator + " = " + numerator + "/" + denominator +
          reducedEquality(numerator, denominator) + ".",
        diagnostics: diagnostics(answer, [
          {value: wrongNumerator / (da + db), message: "Знаменатель задаёт размер доли. При сложении или вычитании его не складывают: сначала нужна общая мерка."},
          {value: wrongNumerator / da, message: "Проверь, были ли исходные доли одинакового размера. Одних числителей недостаточно."}
        ])
      };
    }),

    defineFamily({
      id: "arith-battle-balance", topicId: "base", title: "Битва модулей: компенсация",
      skillId: "base-sign", mode: "creative",
      goal: "Предсказать знак, погасить противоположные пары и связать оставшиеся единицы с суммой."
    }, function (seed, rng) {
      var mode = seed % 3, small = rng.int(1, 9), gap = rng.int(1, 4);
      var negative = mode === 0 ? small + gap : small, positive = mode === 1 ? small + gap : small;
      var a = seed % 2 ? positive : -negative, b = seed % 2 ? -negative : positive;
      var sum = a + b, cancelled = Math.min(negative, positive);
      return {
        type: "battle", title: mode === 2 ? "Битва модулей: равные силы" : "Битва модулей: кто останется?",
        variant: ["negative-survives", "positive-survives", "complete-cancellation"][mode],
        prompt: "Найди сумму " + fmt(a) + " + " + operand(b) +
          ". Сначала предположи знак, затем убери пары +1 и −1. Укажи оставшуюся сумму.",
        a: a, b: b,
        hint: "Каждая встречная пара даёт ноль. Оставшийся знак определяется тем, каких единиц после компенсации больше.",
        explanation: "Убираем " + counted(cancelled, "встречную пару", "встречные пары", "встречных пар") + ". " +
          (sum === 0 ? "Ничего не осталось: сумма равна 0." :
            remainingUnits(Math.abs(sum), sum < 0) + ": сумма равна " + fmt(sum) + ".") +
          " Эта модель относится к сложению чисел разных знаков."
      };
    }),

    defineFamily({
      id: "arith-decimal-exchange", topicId: "base", title: "Размен перед вычитанием",
      skillId: "base-place", mode: "creative",
      goal: "Сохранить величину числа при размене и подготовить нужные разрядные единицы для вычитания."
    }, function (seed, rng) {
      var mode = seed % 3, u = rng.int(1, 5), t, h, takeT, takeH;
      if (mode === 0) {
        t = rng.int(3, 8); h = rng.int(0, 4); takeT = rng.int(1, t - 1); takeH = rng.int(h + 1, 9);
      } else if (mode === 1) {
        t = rng.int(0, 3); h = rng.int(0, 4); takeT = rng.int(t + 1, 9); takeH = rng.int(h + 1, 9);
      } else {
        t = 0; h = 0; takeT = rng.int(1, 9); takeH = rng.int(1, 9);
      }
      var cents = 100 * u + 10 * t + h, removed = 10 * takeT + takeH;
      var witness = mode === 0 ? {u: u, t: t - 1, h: h + 10} : {u: u - 1, t: t + 9, h: h + 10};
      return {
        type: "build", title: mode === 2 ? "Размен через нули" : "Размен без потерь",
        variant: ["one-tenth-exchange", "unit-and-tenth-exchange", "across-zero-digits"][mode],
        identityPrompt: "Подготовь " + fmt(cents / 100) + " к вычитанию " + fmt(removed / 100) +
          ". Сохрани исходную величину, но получи не меньше " + takeT + " десятых и " + takeH +
          " сотых. Здесь требуется размен, саму разность пока вводить не нужно.",
        prompt: "Подготовь " + fmt(cents / 100) + " к вычитанию " + fmt(removed / 100) +
          ". Сохрани исходную величину, но получи количество десятых не меньше " + takeT + ", а количество сотых — не меньше " + takeH +
          ". Здесь требуется размен, саму разность пока вводить не нужно.",
        fields: [
          integerField("u", "Единицы", 0, u, u),
          integerField("t", "Десятые", 0, t + 10, t),
          integerField("h", "Сотые", 0, h + 10, h)
        ],
        constants: {totalCents: cents, neededTenths: takeT, neededHundredths: takeH},
        conditions: [
          {left: "100*u+10*t+h", op: "eq", right: "totalCents"},
          {left: "t", op: "gte", right: "neededTenths"},
          {left: "h", op: "gte", right: "neededHundredths"}
        ],
        exampleSolution: witness,
        hint: "Одну единицу можно заменить десятью десятыми, одну десятую — десятью сотыми. Общее число сотых не меняется.",
        explanation: "Подойдёт: " + counted(witness.u, "единица", "единицы", "единиц") + ", " +
          counted(witness.t, "десятая", "десятых", "десятых") + " и " + counted(witness.h, "сотая", "сотых", "сотых") +
          ". Проверка в сотых: 100 × " + witness.u + " + 10 × " + witness.t + " + " + witness.h + " = " + cents +
          ". После вычитания в сотых получаем: " + cents + " − " + removed + " = " + (cents - removed) +
          ". В десятичной записи ответ равен " + fmt((cents - removed) / 100) +
          ". Другие размены в доступных диапазонах тоже принимаются, если сохраняют величину и дают нужные единицы."
      };
    }),

    defineFamily({
      id: "arith-packages-inverse", topicId: "base", title: "Упаковки: восстанови условие",
      skillId: "base-division", mode: "creative",
      goal: "Использовать связь делимого, делителя, частного и остатка в прямой, обратной и конструкторской задаче."
    }, function (seed, rng) {
      var mode = seed % 3, d = rng.int(4, 14), q = rng.int(3, 18), r = rng.int(1, d - 1);
      var total = d * q + r;
      if (mode === 0) {
        return {
          type: "build", title: "Заполни коробки", variant: "recover-quotient-and-remainder",
          identityPrompt: "Есть " + total + " деталей и коробки по " + d +
            ". Найди число полных коробок q и остаток r. Остатка не должно хватать на ещё одну коробку.",
          prompt: "Есть " + counted(total, "деталь", "детали", "деталей") + " и коробки вместимостью по " +
            counted(d, "детали", "детали", "деталей") + ". Найди число полных коробок q и остаток r. Остатка не должно хватать на ещё одну коробку.",
          fields: [integerField("q", "Полных коробок q", 0, q + 3, 0), integerField("r", "Остаток r", 0, d + 2, 0)],
          constants: {total: total, capacity: d},
          conditions: [
            {left: "capacity*q+r", op: "eq", right: "total"},
            {left: "r", op: "gte", right: "0"},
            {left: "r", op: "lt", right: "capacity"}
          ],
          exampleSolution: {q: q, r: r},
          hint: "Выбери ближайшее снизу кратное вместимости коробки. Проверь одновременно общее количество и границу остатка.",
          explanation: total + " = " + d + " × " + q + " + " + r + ". Подходят q = " + q + ", r = " + r +
            ". Если r ≥ " + d + ", можно заполнить ещё одну коробку, и запись деления с остатком ещё не закончена."
        };
      }
      if (mode === 1) {
        return {
          type: "build", title: "Сколько в одной коробке?", variant: "recover-divisor",
          identityPrompt: total + " деталей дали " + q + " полных одинаковых коробок и остаток " + r +
            ". Восстанови вместимость d одной коробки. Остаток должен быть меньше вместимости.",
          prompt: "Всего деталей: " + total + ". Их разложили по одинаковым коробкам. Полных коробок: " + q +
            "; остаток: " + r + ". Восстанови вместимость d одной коробки. Остаток должен быть меньше вместимости.",
          fields: [integerField("d", "Деталей в коробке d", 1, 20, 1)],
          constants: {total: total, boxes: q, remainder: r},
          conditions: [
            {left: "d*boxes+remainder", op: "eq", right: "total"},
            {left: "remainder", op: "lt", right: "d"}
          ],
          exampleSolution: {d: d},
          hint: "Сначала отдели известный остаток. Остальные детали распределены по всем полным коробкам поровну.",
          explanation: "Число деталей в полных коробках: " + total + " − " + r + " = " + (total - r) +
            ". Вместимость: " + (total - r) + " ÷ " + q + " = " + d +
            ". Остаток " + r + " действительно меньше " + d + "."
        };
      }
      var low = rng.int(2, 6), high = low + rng.int(2, 4), witnessQ = low + 1;
      return {
        type: "build", title: "Придумай подходящий заказ", variant: "construct-dividend",
        identityPrompt: "Выбери количество деталей N, чтобы в коробки по " + d + " поместилось от " + low + " до " + high +
          " полных коробок и осталось ровно " + r + " деталей. Укажи также число полных коробок q.",
        prompt: "Выбери количество деталей N, чтобы при раскладывании по " + counted(d, "детали", "детали", "деталей") +
          " в коробку получилось от " + low + " до " + high + " полных коробок и остаток составлял ровно " +
          counted(r, "деталь", "детали", "деталей") + ". Укажи также число полных коробок q.",
        fields: [
          integerField("N", "Всего деталей N", 0, d * high + r, d * low),
          integerField("q", "Полных коробок q", low, high, low)
        ],
        constants: {capacity: d, remainder: r},
        conditions: [
          {left: "capacity*q+remainder", op: "eq", right: "N"},
          {left: "remainder", op: "lt", right: "capacity"}
        ],
        exampleSolution: {N: d * witnessQ + r, q: witnessQ},
        hint: "Сначала выбери допустимое число полных коробок. Затем добавь к их содержимому заданный остаток.",
        explanation: "Например, q = " + witnessQ + " даёт N = " + d + " × " + witnessQ + " + " + r +
          " = " + (d * witnessQ + r) + ". Можно выбрать другое q из указанного диапазона и получить другой правильный заказ."
      };
    }),

    defineFamily({
      id: "arith-common-measure", topicId: "n6", title: "Общая мерка дробей",
      skillId: "n6-common", mode: "creative",
      goal: "Преобразовать две доли одного целого в одинаковые единицы и объяснить общий знаменатель."
    }, function (seed, rng) {
      var mode = seed % 3, groups = [
        [[2, 3], [3, 4], [4, 5], [3, 8]],
        [[2, 4], [3, 6], [4, 8], [5, 10]],
        [[4, 6], [6, 9], [6, 8]]
      ];
      var ds = rng.pick(groups[mode]), da = ds[0], db = ds[1], possibilities = [];
      for (var a = 1; a < da; a++) for (var b = 1; b < db; b++) {
        if (a * db + b * da <= da * db) possibilities.push([a, b]);
      }
      var ns = rng.pick(possibilities), na = ns[0], nb = ns[1], common = lcm(da, db);
      var ca = na * common / da, cb = nb * common / db;
      return {
        type: "fraction", title: "Подбери размер кусочка",
        variant: ["coprime-denominators", "one-denominator-divides-other", "shared-factor-denominators"][mode],
        prompt: "Сложи " + rawFraction(na, da) + " и " + rawFraction(nb, db) +
          " одного и того же целого. Выбери общую мерку, затем укажи число таких частей в сумме.",
        numeratorA: na, denominatorA: da, numeratorB: nb, denominatorB: db,
        hint: "Размер маленькой доли должен подходить обеим полоскам. Произведение знаменателей — возможный, но не всегда самый удобный выбор.",
        explanation: "Для мерки 1/" + common + " первая доля содержит " + counted(ca, "часть", "части", "частей") + ", вторая — " + cb +
          ". Вместе " + counted(ca + cb, "часть", "части", "частей") + ": " + (ca + cb) + "/" + common +
          reducedEquality(ca + cb, common) + ". При более мелкой общей мерке число частей увеличится, но сама величина суммы сохранится."
      };
    }),

    defineFamily({
      id: "arith-restore-whole", topicId: "base", title: "Восстанови целое и долю",
      skillId: "base-unit", mode: "creative",
      goal: "Восстанавливать целое по доле, задавать долю отношением и различать величины меньше и больше целого."
    }, function (seed, rng) {
      var mode = seed % 3, q = rng.int(3, 8), p, possible = [];
      for (var n = 1; n < q; n++) if (gcd(n, q) === 1) possible.push(n);
      p = rng.pick(possible);
      if (mode === 2) p += q;
      var unit = rng.int(2, 12), known = p * unit, whole = q * unit;
      if (mode === 1) {
        return {
          type: "build", title: "Верни дробь на этикетку", variant: "recover-fraction",
          prompt: "Длина всей ленты " + whole + " см, выделено " + known +
            " см. Подбери целые p и q в записи доли p/q. Можно использовать любую равную дробь в доступных диапазонах.",
          fields: [integerField("p", "Числитель p", 1, 15, 1), integerField("q", "Знаменатель q", 2, 16, 2)],
          constants: {whole: whole, marked: known},
          conditions: [
            {left: "p*whole", op: "eq", right: "q*marked"},
            {left: "p", op: "lt", right: "q"}
          ],
          exampleSolution: {p: p, q: q},
          hint: "Доля равна отношению выделенной длины ко всей длине. Числитель и знаменатель можно уменьшать или увеличивать одним множителем.",
          explanation: known + "/" + whole + " = " + fraction(p, q) + ". Подойдут также равные дроби, если их числитель и знаменатель входят в доступные диапазоны."
        };
      }
      return {
        type: "build", title: mode === 2 ? "Отрезок больше целого" : "Верни целое",
        variant: mode === 2 ? "whole-from-improper-multiple" : "whole-from-proper-part",
        prompt: "Отрезок длиной " + known + " см составляет " + rawFraction(p, q) +
          " выбранного целого. Восстанови длину одного целого W.",
        fields: [integerField("W", "Длина целого W, см", 1, q * 15, mode === 0 ? known : 1)],
        constants: {numerator: p, denominator: q, known: known},
        conditions: [{left: "numerator*W", op: "eq", right: "denominator*known"}],
        exampleSolution: {W: whole},
        hint: "Сначала найди длину одной из " + q + " равных долей: известный отрезок содержит " + p + " таких долей.",
        explanation: "Одна доля имеет длину " + known + " ÷ " + p + " = " + unit + " см. Целое содержит " +
          q + " долей: W = " + unit + " × " + q + " = " + whole + " см. " +
          (mode === 2 ? "Дробь больше 1, поэтому известный отрезок длиннее восстановленного целого." :
            "Дробь меньше 1, поэтому известный отрезок короче восстановленного целого.")
      };
    }),

    defineFamily({
      id: "arith-estimate-change", topicId: "n6", title: "Больше, меньше или столько же",
      skillId: "n6-estimate", mode: "creative",
      goal: "Предсказывать изменение положительной величины при умножении и делении, прежде чем считать."
    }, function (seed, rng) {
      var mode = seed % 3, denominator = rng.int(3, 9), numerator = rng.int(1, denominator - 1);
      var baseN = rng.int(1, 9), baseD = rng.int(1, 7), base = baseN / baseD;
      var small = numerator / denominator, large = denominator / numerator, name = fraction(baseN, baseD);
      var raw = [
        {text: name + " ÷ (" + rawFraction(numerator, denominator) + ")", factor: large},
        {text: name + " × (" + rawFraction(numerator, denominator) + ")", factor: small},
        {text: name + " ÷ (" + rawFraction(denominator, numerator) + ")", factor: small},
        {text: name + " × (" + rawFraction(denominator, numerator) + ")", factor: large},
        {text: name + " × (" + denominator + "/" + denominator + ")", factor: 1}
      ];
      var target = ["увеличится", "уменьшится", "останется прежней"][mode];
      return {
        type: "multi", title: "Предскажи изменение", variant: ["increase", "decrease", "preserve"][mode],
        prompt: "Исходная величина положительна и равна " + name +
          ". Выбери ВСЕ выражения, после вычисления которых эта величина " + target +
          ". Попробуй сначала оценить без полного вычисления.",
        options: rng.shuffle(raw).map(function (o) {
          return {text: o.text, correct: mode === 0 ? o.factor > 1 : mode === 1 ? o.factor < 1 : o.factor === 1};
        }),
        hint: "Для положительного числа умножение на число больше 1 увеличивает величину. А деление на число меньше 1 показывает большее количество маленьких мерок.",
        explanation: "Дробь " + rawFraction(numerator, denominator) + " меньше 1, обратная ей " +
          rawFraction(denominator, numerator) + " больше 1. Деление на первую и умножение на вторую увеличивают " +
          name + "; два обратных действия уменьшают. Умножение на " + denominator + "/" + denominator +
          " сохраняет величину. Например, " + name + " × " + rawFraction(denominator, numerator) +
          " = " + fraction(baseN * denominator, baseD * numerator) + " > " + name + ".",
        exampleStartingValue: base
      };
    }),

    defineFamily({
      id: "arith-coordinate-restore", topicId: "n7", title: "Восстанови точку по условию",
      skillId: "n7-distance", mode: "creative",
      goal: "Находить координату из отношения расстояний или обратного перемещения, различая координату и расстояние."
    }, function (seed, rng) {
      var mode = seed % 3, c = rng.int(-5, 5), d = rng.int(2, 6), a, b, answer, prompt, identityPrompt, hint, explanation, wrong;
      if (mode === 0) {
        a = c - d; b = c + d; answer = c;
        prompt = "Концы отрезка имеют координаты " + fmt(a) + " и " + fmt(b) +
          ". Отметь его середину: она должна быть одинаково удалена от обоих концов.";
        hint = "Расстояние между концами равно " + (b - a) + ". Отсчитай половину этого расстояния от одного конца.";
        explanation = "Середина имеет координату (" + fmt(a) + " + " + operand(b) + ") ÷ 2 = " +
          fmt(c) + ". Расстояние от неё до каждого конца равно " + d + ".";
        wrong = [
          {value: a + b, message: "Сумма координат ещё не является координатой середины. Нужна половина этой суммы."},
          {value: d, message: "Полурасстояние найдено. Теперь отсчитай его от координаты одного из концов."}
        ];
      } else if (mode === 1) {
        var direction = rng.pick([-1, 1]);
        a = c + direction * d; b = c - direction * d; answer = b;
        prompt = "Точку A с координатой " + fmt(a) + " отражают относительно точки C с координатой " +
          fmt(c) + ". Найди координату отражённой точки.";
        hint = "Точка C должна стать серединой между исходной и отражённой точками.";
        explanation = "От A до C расстояние " + d + ". На таком же расстоянии с другой стороны от C находится точка " +
          fmt(b) + ". Проверка: (" + fmt(a) + " + " + operand(b) + ") ÷ 2 = " + fmt(c) + ".";
        wrong = [
          {value: -a, message: "Смена знака отражает относительно нуля. Здесь центр отражения указан отдельно."},
          {value: c + a, message: "Сначала найди расстояние до центра, затем отложи его по другую сторону."}
        ];
      } else {
        var move = rng.pick([-1, 1]);
        a = c - move * d; b = c; answer = a;
        identityPrompt = "После перемещения на " + d + " единиц " + (move > 0 ? "вправо" : "влево") +
          " точка оказалась в " + fmt(c) + ". Отметь её исходную координату.";
        prompt = "После перемещения на " + counted(d, "единицу", "единицы", "единиц") + " " + (move > 0 ? "вправо" : "влево") +
          " точка оказалась в " + fmt(c) + ". Отметь её исходную координату.";
        hint = "От известного конца выполни обратное перемещение.";
        explanation = "Исходная координата " + fmt(a) + ". Проверка движения: " + fmt(a) +
          (move > 0 ? " + " : " − ") + d + " = " + fmt(c) + ".";
        wrong = [{value: c + move * d, message: "Это продолжение движения. Для восстановления начала нужно двигаться обратно."}];
      }
      return {
        type: "numberline", title: ["Встреча посередине", "Зеркало с новым центром", "Найди начало пути"][mode],
        variant: ["midpoint", "reflection-about-center", "reverse-displacement"][mode],
        prompt: prompt, identityPrompt: identityPrompt, min: Math.min(-2, a - 2, b - 2), max: Math.max(2, a + 2, b + 2),
        answer: answer, hint: hint, explanation: explanation, diagnostics: diagnostics(answer, wrong)
      };
    }),

    defineFamily({
      id: "arith-root-counterexample", topicId: "n8", title: "Испытание правила корней",
      skillId: "n8-counterexample", mode: "creative",
      goal: "Подобрать допустимый контрпример, увидеть границы преобразования и восстановить корректное правило."
    }, function (seed, rng) {
      var mode = seed % 4, k, a, c, witness;
      if (mode === 0) {
        witness = -rng.int(1, 12);
        return {
          type: "counterexample", title: "Квадрат и корень исчезают?", variant: "square-root-needs-absolute",
          identityPrompt: "Утверждают: √(x²) = x при любом действительном x. Найди значение x, при котором стороны различаются.",
          prompt: "Утверждают: √(x²) = x при любом действительном x. Найди значение x, при котором части равенства различаются.",
          left: "sqrt(x^2)", right: "x", field: "x", exampleCounterexample: witness,
          counterexampleWhen: [{left: "x", op: "lt", right: "0"}],
          comparisonLeft: "abs(x)", comparisonRight: "x",
          criterionExplanation: "√(x²) = |x|. Модуль отличается от самого числа ровно при x < 0.",
          hint: "Проверь число, расположенное левее нуля. Арифметический корень неотрицателен.",
          explanation: "Например, при x = " + fmt(witness) + " левая часть равна " + Math.abs(witness) +
            ", а правая — " + fmt(witness) + ". Корректная запись: √(x²) = |x|."
        };
      }
      if (mode === 1) {
        var triple = rng.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13]]);
        k = triple[0]; a = triple[1]; c = a * a; witness = k * k;
        return {
          type: "counterexample", title: "Корень распределяется по сумме?", variant: "root-of-sum",
          prompt: "Проверь утверждение √(x + " + c + ") = √x + " + a +
            ". Выбери x ≥ 0, при котором равенство неверно.",
          left: "sqrt(x+" + c + ")", right: "sqrt(x)+" + a, field: "x",
          domain: {min: 0}, exampleCounterexample: witness,
          constants: {a: a, c: c},
          counterexampleWhen: [{left: "x", op: "gt", right: "0"}],
          comparisonLeft: "sqrt(x+c)", comparisonRight: "sqrt(x)+a",
          criterionExplanation: "При x > 0 в квадрате правой части появляется дополнительное положительное слагаемое " +
            (2 * a) + "√x. Поэтому правая часть больше левой. При x = 0 части равны.",
          hint: "При x = 0 части равны. Для контрпримера проверь положительное число.",
          explanation: "При x = " + witness + " слева √" + (witness + c) + " = " + triple[2] +
            ", справа " + k + " + " + a + " = " + (k + a) +
            ". Корень суммы в общем случае не равен сумме корней."
        };
      }
      if (mode === 2) {
        c = rng.int(-4, 4); var distance = rng.int(1, 6); witness = c - distance;
        var writtenDifference = "x − " + operand(c), asciiDifference = "(x-(" + c + "))";
        return {
          type: "counterexample", title: "Знак внутри выражения", variant: "shifted-square-root",
          prompt: "Утверждают, что √((" + writtenDifference + ")²) = " + writtenDifference +
            " при любом x. Найди контрпример.",
          left: "sqrt(" + asciiDifference + "^2)", right: asciiDifference, field: "x",
          exampleCounterexample: witness,
          constants: {c: c},
          counterexampleWhen: [{left: "x", op: "lt", right: "c"}],
          comparisonLeft: "abs(x-c)", comparisonRight: "x-c",
          criterionExplanation: "Корень из квадрата выражения равен его модулю. Части равенства различаются ровно тогда, когда " +
            writtenDifference + " < 0, то есть x < " + fmt(c) + ".",
          hint: "Сделай выражение под квадратом отрицательным.",
          explanation: "При x = " + fmt(witness) + " выражение " + writtenDifference + " равно " + fmt(-distance) +
            ". Корень из его квадрата равен " + distance + ", поэтому части равенства различаются. Правильно: √((" +
            writtenDifference + ")²) = |" + writtenDifference + "|."
        };
      }
      a = rng.int(2, 6); k = rng.int(2, 6); c = a * a; witness = c * k * k;
      return {
        type: "counterexample", title: "Знаменатель тоже под корнем", variant: "root-of-quotient",
        identityPrompt: "Проверь равенство √(x/" + c + ") = √x/" + c +
          ". Найди допустимое x ≥ 0, при котором стороны различаются.",
        prompt: "Проверь равенство √(x/" + c + ") = √x/" + c +
          ". Найди допустимое x ≥ 0, при котором части равенства различаются.",
        left: "sqrt(x/" + c + ")", right: "sqrt(x)/" + c, field: "x",
        domain: {min: 0}, exampleCounterexample: witness,
        constants: {a: a},
        counterexampleWhen: [{left: "x", op: "gt", right: "0"}],
        comparisonLeft: "sqrt(x)/a", comparisonRight: "sqrt(x)/(a*a)",
        criterionExplanation: "Для x > 0 число √x положительно. Деление его на " + a + " и на " + c +
          " даёт разные значения. При x = 0 обе части равны нулю.",
        hint: "Если корень разделяют по частному, он относится и к числителю, и к знаменателю.",
        explanation: "При x = " + witness + " левая часть равна " + k + ", правая — " +
          fraction(k, a) + ". Для x ≥ 0 правильно √(x/" + c + ") = √x/" + a +
          ", потому что √" + c + " = " + a + "."
      };
    })
  ];

  var routes = [
    {
      id: "route-arith-signs", topicId: "base", title: "Сумма разных знаков",
      goal: "Две обычные суммы чисел разных знаков. Между ними можно исследовать компенсацию в Битве модулей; мастерская по желанию.",
      steps: [
        {familyId: "arith-signed-plain", label: "Обычный вход: сумма разных знаков", variants:["opposite-signs"]},
        {familyId: "arith-battle-balance", label: "По желанию: увидеть компенсацию"},
        {familyId: "arith-signed-plain", label: "Самостоятельный выход: новая сумма", variants:["opposite-signs"]}
      ]
    },
    {
      id: "route-arith-division", topicId: "base", title: "Деление: группы, остаток и проверка",
      goal: "Различить частное и остаток. По желанию восстановить условие упаковки, затем самостоятельно выполнить новое деление.",
      steps: [
        {familyId: "arith-division-plain", label: "Обычный вход: что спрашивается?"},
        {familyId: "arith-packages-inverse", label: "По желанию: восстановить упаковки"},
        {familyId: "arith-division-plain", label: "Самостоятельный выход: новое деление"}
      ]
    },
    {
      id: "route-arith-fractions", topicId: "n6", title: "Сложение дробей и общая мерка",
      goal: "Две обычные суммы с разными знаменателями. Между ними можно построить общую мерку; восстановление целого доступно отдельно.",
      steps: [
        {familyId: "arith-fraction-plain", label: "Обычный вход: сложить дроби", variants:["add-different-denominators"]},
        {familyId: "arith-common-measure", label: "По желанию: подобрать общую мерку"},
        {familyId: "arith-fraction-plain", label: "Самостоятельный выход: новая сумма", variants:["add-different-denominators"]}
      ]
    },
    {
      id: "route-arith-place-value", topicId: "base", title: "Десятичное вычитание и размен",
      goal: "Две обычные задачи на вычитание с разменом. Между ними можно подготовить разрядные единицы, сохранив величину.",
      steps: [
        {familyId: "arith-decimal-plain", label: "Обычный вход: вычитание", variants:["decimal-subtract"]},
        {familyId: "arith-decimal-exchange", label: "По желанию: размен без потери величины"},
        {familyId: "arith-decimal-plain", label: "Самостоятельный выход: новое вычитание", variants:["decimal-subtract"]}
      ]
    }
  ];

  var bundle = {families: families, routes: routes};
  if (typeof module !== "undefined" && module.exports) module.exports = bundle;
  if (typeof window !== "undefined") (window.OGE_SERIES_PARTS ||= []).push(bundle);
}());
