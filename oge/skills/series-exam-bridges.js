(function () {
  "use strict";

  // Ordinary independent practice after, or without, an optional workshop.
  // No DOM, network, shared mutable state, or external dependencies.
  function validSeed(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 999) {
      throw new RangeError("seed должен быть целым числом от 0 до 999.");
    }
    return seed;
  }
  function randomFor(seed, salt) {
    var state = ((validSeed(seed) + 1) ^ salt) >>> 0;
    function next() {
      state = (state + 0x6d2b79f5) >>> 0;
      var x = state;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
    function int(min, max) { return min + Math.floor(next() * (max - min + 1)); }
    return {
      int: int,
      pick: function (items) { return items[int(0, items.length - 1)]; },
      shuffle: function (items) {
        var result = items.slice();
        for (var i = result.length - 1; i > 0; i--) {
          var j = int(0, i), value = result[i];
          result[i] = result[j]; result[j] = value;
        }
        return result;
      }
    };
  }
  function fmt(value) {
    if (Object.is(value, -0)) value = 0;
    return String(Number(value.toPrecision(12))).replace(/-/g, "−").replace(".", ",");
  }
  function countWord(value, one, few, many) {
    var lastTwo = Math.abs(value) % 100, last = Math.abs(value) % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return many;
    return last === 1 ? one : last >= 2 && last <= 4 ? few : many;
  }
  function diagnostics(answer, entries) {
    var result = [];
    entries.forEach(function (entry) {
      function close(x, y) { return Math.abs(x - y) <= 1e-8 * Math.max(1, Math.abs(x), Math.abs(y)); }
      if (Number.isFinite(entry.value) && !close(entry.value, answer) &&
          !result.some(function (other) { return close(entry.value, other.value); })) {
        result.push({value: entry.value, message: entry.message});
      }
    });
    return result;
  }
  function linear(a, b) {
    if (!a) return fmt(b);
    var text = a === 1 ? "x" : a === -1 ? "−x" : fmt(a) + "x";
    if (b) text += b < 0 ? " − " + fmt(-b) : " + " + fmt(b);
    return text;
  }
  var signs = {lt: "<", lte: "≤", gt: ">", gte: "≥"};
  function flip(op) { return {lt: "gt", lte: "gte", gt: "lt", gte: "lte"}[op]; }
  function inequalityText(spec) {
    return linear(spec.a, spec.b) + " " + signs[spec.op] + " " + linear(spec.c, spec.d);
  }
  function ray(direction, boundary, closed) {
    return direction === "lower" ?
      {from: boundary, to: null, fromClosed: closed, toClosed: false} :
      {from: null, to: boundary, fromClosed: false, toClosed: closed};
  }
  function rayRelation(segment) {
    return segment.from === null ? (segment.toClosed ? "lte" : "lt") : (segment.fromClosed ? "gte" : "gt");
  }
  function rayText(segment) {
    return "x " + signs[rayRelation(segment)] + " " + fmt(segment.from === null ? segment.to : segment.from);
  }
  function inequalityFor(segment, rng, pattern, negative) {
    var boundary = segment.from === null ? segment.to : segment.from;
    var magnitude = rng.pick(Number.isInteger(boundary) ? [1, 2, 3, 4, 5] : [2, 4, 6]);
    var coefficient = (negative ? -1 : 1) * magnitude;
    var b = pattern === 0 ? 0 : rng.int(-9, 9);
    var c = pattern === 2 ? rng.pick([-4, -3, -2, -1, 1, 2, 3, 4].filter(function (n) {
      return n !== -coefficient;
    })) : 0;
    var op = rayRelation(segment);
    if (coefficient < 0) op = flip(op);
    return {a: coefficient + c, b: b, op: op, c: c, d: b + coefficient * boundary};
  }
  function normalizeSegments(segments) {
    var list = segments.map(function (s) {
      return {
        from: s.from, to: s.to,
        fromClosed: s.from !== null && !!s.fromClosed,
        toClosed: s.to !== null && !!s.toClosed
      };
    }).filter(function (s) {
      return s.from === null || s.to === null || s.from < s.to ||
        (s.from === s.to && s.fromClosed && s.toClosed);
    }).sort(function (a, b) {
      var start = (a.from === null ? -Infinity : a.from) - (b.from === null ? -Infinity : b.from);
      return start || Number(b.fromClosed) - Number(a.fromClosed);
    });
    var result = [];
    list.forEach(function (s) {
      var last = result[result.length - 1];
      var connected = last && (last.to === null || s.from === null || s.from < last.to ||
        (s.from === last.to && (last.toClosed || s.fromClosed)));
      if (!connected) { result.push(s); return; }
      if (last.from === s.from) last.fromClosed = last.fromClosed || s.fromClosed;
      if (last.to === null) return;
      if (s.to === null || s.to > last.to) { last.to = s.to; last.toClosed = s.toClosed; }
      else if (s.to === last.to) last.toClosed = last.toClosed || s.toClosed;
    });
    return result;
  }
  function intersectRays(rays) {
    var result = {from: null, to: null, fromClosed: false, toClosed: false};
    rays.forEach(function (s) {
      if (s.from !== null) {
        if (result.from === null || s.from > result.from) {
          result.from = s.from; result.fromClosed = s.fromClosed;
        } else if (s.from === result.from) result.fromClosed = result.fromClosed && s.fromClosed;
      }
      if (s.to !== null) {
        if (result.to === null || s.to < result.to) {
          result.to = s.to; result.toClosed = s.toClosed;
        } else if (s.to === result.to) result.toClosed = result.toClosed && s.toClosed;
      }
    });
    return normalizeSegments([result]);
  }
  function setText(segments) {
    if (!segments.length) return "решений нет";
    return segments.map(function (s) {
      if (s.from === s.to && s.from !== null) return "только x = " + fmt(s.from);
      if (s.from === null && s.to === null) return "все действительные числа";
      if (s.from === null || s.to === null) return rayText(s);
      return fmt(s.from) + (s.fromClosed ? " ≤ x " : " < x ") + (s.toClosed ? "≤ " : "< ") + fmt(s.to);
    }).join(" или ");
  }
  function intervalChoices(rng, correct, candidates) {
    var correctKey = JSON.stringify(normalizeSegments(correct)), seen = new Set(), sets = [];
    [correct].concat(candidates).forEach(function (segments) {
      var normalized = normalizeSegments(segments), key = JSON.stringify(normalized);
      if (!seen.has(key)) { seen.add(key); sets.push({segments: normalized, correct: key === correctKey}); }
    });
    if (sets.length < 4) throw new Error("Нужны четыре различных множества решений.");
    sets = rng.shuffle(sets.slice(0, 4));
    var finite = [];
    sets.forEach(function (entry) { entry.segments.forEach(function (s) {
      if (s.from !== null) finite.push(s.from);
      if (s.to !== null) finite.push(s.to);
    }); });
    var extent = Math.max.apply(null, [4].concat(finite.map(function (value) { return Math.ceil(Math.abs(value)) + 2; })));
    return {
      options: sets.map(function (entry, i) { return {text: "Рисунок " + (i + 1), correct: entry.correct}; }),
      visual: {
        kind: "intervals", min: -extent, max: extent,
        label: "Четыре пронумерованных рисунка множеств на одинаковой числовой шкале.",
        rows: sets.map(function (entry, i) { return {label: String(i + 1), segments: entry.segments}; })
      }
    };
  }
  function correctNumber(options) {
    return options.findIndex(function (option) { return option.correct; }) + 1;
  }
  function complete(family, seed, task) {
    task.id = family.id + "-v" + String(validSeed(seed)).padStart(3, "0");
    task.title = task.title || family.title;
    task.skillId = family.skillId;
    task.familyId = family.id;
    task.seed = seed;
    task.witness = task.type === "number" ? {answer: String(task.answer)} : {
      selected: task.options.map(function (option, i) { return option.correct ? i : -1; }).filter(function (i) { return i >= 0; })
    };
    return task;
  }
  var families = [];
  function family(meta, generator) {
    var entry = Object.assign({mode: "quick"}, meta);
    entry.generate = function (seed) { return complete(entry, seed, generator(validSeed(seed))); };
    families.push(entry);
  }

  family({
    id: "exam-probability-remainder", topicId: "n10", title: "Остаток и подходящие исходы",
    skillId: "n10-ratio", goal: "Восстановить состав набора и самостоятельно вычислить вероятность составного события."
  }, function (seed) {
    var rng = randomFor(seed, 0x10107), total = rng.pick([40, 50, 80, 100, 125, 160, 200]);
    var each = rng.int(2, Math.floor(total / 6)), known = total - 2 * each;
    var red = rng.int(1, known - 2), blue = rng.int(1, known - red - 1), green = known - red - blue;
    var mode = seed % 4, event, favorable, missed, unhalved;
    if (mode === 0) { event = "красным или жёлтым"; favorable = red + each; missed = red; unhalved = red + 2 * each; }
    else if (mode === 1) { event = "синим или белым"; favorable = blue + each; missed = blue; unhalved = blue + 2 * each; }
    else if (mode === 2) { event = "жёлтым или белым"; favorable = 2 * each; missed = each; unhalved = each; }
    else { event = "красным, жёлтым или белым"; favorable = red + 2 * each; missed = red + each; unhalved = red + each; }
    var answer = favorable / total;
    return {
      type: "number", variant: ["known-and-unknown", "another-known-and-unknown", "both-unknown", "three-colors"][mode], answer: answer,
      prompt: "В мешке " + total + " одинаковых на ощупь жетонов пяти цветов. Красных — " + red + ", синих — " + blue +
        ", зелёных — " + green + ". Остальные — жёлтые и белые, поровну каждого цвета. Наудачу вынимают один жетон; все жетоны равновероятны. " +
        "Найди вероятность того, что он окажется " + event + ". Запиши ответ десятичной дробью.",
      hint: "Сначала вычти три известных количества из общего. Оставшиеся жетоны раздели на две равные группы. Затем посчитай жетоны всех подходящих цветов.",
      explanation: "Остаток: " + total + " − " + red + " − " + blue + " − " + green + " = " + (2 * each) +
        ". Число жёлтых и число белых одинаково: " + (2 * each) + " ÷ 2 = " + each + ". Подходящих жетонов " + favorable + " из " + total +
        ", поэтому вероятность равна " + favorable + "/" + total + " = " + fmt(answer) + ". Округление не требуется.",
      diagnostics: diagnostics(answer, [
        {value: missed / total, message: "Проверь, учтены ли все цвета, которые перечислены в событии."},
        {value: unhalved / total, message: "Проверь, сколько неизвестных цветовых групп входит в событие: одна или обе."},
        {value: favorable / known, message: "В знаменателе нужно общее число жетонов, включая жёлтые и белые."},
        {value: favorable, message: "Это количество подходящих жетонов. Вероятность — его доля от общего количества."}
      ])
    };
  });

  family({
    id: "exam-formula-resistance", topicId: "n12", title: "Неизвестная величина в формуле",
    skillId: "n12-isolate", goal: "Выразить R из P = I²R и выполнить вычисление с целыми или десятичными данными."
  }, function (seed) {
    var rng = randomFor(seed, 0x12119), mode = seed % 4;
    var currentTenths = mode % 2 === 0 ? 10 * rng.int(2, 5) : rng.pick([2, 3, 4, 5, 6, 8, 12, 15, 25]);
    var resistanceTenths = mode < 2 ? 10 * rng.int(2, 40) : 10 * rng.int(2, 39) + rng.int(1, 9);
    var current = currentTenths / 10, answer = resistanceTenths / 10;
    var power = currentTenths * currentTenths * resistanceTenths / 1000;
    return {
      type: "number", variant: ["integer-data", "decimal-current", "decimal-resistance", "decimal-current-and-resistance"][mode],
      answer: answer, unit: "Ом",
      prompt: "Мощность, выделяемую на резисторе, находят по формуле P = I²R, где P — мощность в ваттах, I — сила тока в амперах, " +
        "R — сопротивление в омах. Найди R, если P = " + fmt(power) + " Вт, а I = " + fmt(current) + " А. Ответ дай в омах.",
      hint: "R умножено на I². Чтобы выразить R, раздели P на весь множитель I²; сначала вычисли квадрат силы тока.",
      explanation: "Так как I ≠ 0, R = P ÷ I². Здесь I² = (" + fmt(current) + ")² = " + fmt(currentTenths * currentTenths / 100) +
        ". Поэтому R = " + fmt(power) + " ÷ " + fmt(currentTenths * currentTenths / 100) + " = " + fmt(answer) +
        " Ом. Обратная подстановка: (" + fmt(current) + ")² × " + fmt(answer) + " = " + fmt(power) + " Вт.",
      diagnostics: diagnostics(answer, [
        {value: power / current, message: "В формуле стоит квадрат силы тока. Нужно делить на I², а не на I."},
        {value: power * current * current, message: "Чтобы убрать множитель I² рядом с R, нужно разделить на него обе части."},
        {value: power / (2 * current), message: "I² означает I × I, а не 2 × I."}
      ])
    };
  });

  family({
    id: "exam-inequality-picture", topicId: "n13", title: "Неравенство и его рисунок",
    skillId: "n13-boundaries", goal: "Решить линейное неравенство и выбрать направление луча и тип его границы."
  }, function (seed) {
    var rng = randomFor(seed, 0x13121), boundary = rng.int(-12, 12) / 2;
    var direction = seed % 2 === 0 ? "lower" : "upper", closed = Math.floor(seed / 2) % 2 === 1;
    var negative = Math.floor(seed / 4) % 2 === 1, pattern = Math.floor(seed / 8) % 3;
    var correctRay = ray(direction, boundary, closed), spec = inequalityFor(correctRay, rng, pattern, negative);
    var choice = intervalChoices(rng, [correctRay], [
      [ray(direction, boundary, !closed)],
      [ray(direction === "lower" ? "upper" : "lower", boundary, closed)],
      [ray(direction === "lower" ? "upper" : "lower", boundary, !closed)]
    ]);
    return {
      type: "choice", variant: ["scale", "shift-and-scale", "variables-on-both-sides"][pattern],
      prompt: "Реши неравенство " + inequalityText(spec) + ". На каком рисунке показано множество его решений? Выбери один номер.",
      linearInequalities: [spec], options: choice.options, visual: choice.visual,
      hint: "Собери члены с x в одной части. При делении на отрицательное число поменяй знак неравенства. При строгом неравенстве граничное число не входит в множество решений.",
      explanation: "После переноса слагаемых: " + linear(spec.a - spec.c, 0) + " " + signs[spec.op] + " " + fmt(spec.d - spec.b) +
        ". Делим на " + fmt(spec.a - spec.c) + (negative ? " и меняем направление знака" : " без изменения направления знака") +
        ": " + rayText(correctRay) + ". Граница " + fmt(boundary) + (closed ? " включена" : " не включена") +
        ". Верный рисунок — " + correctNumber(choice.options) + "."
    };
  });

  family({
    id: "exam-inequality-system-picture", topicId: "n13", title: "Система и общее множество решений",
    skillId: "n13-intersection", goal: "Решить два линейных неравенства, пересечь их решения и выбрать рисунок."
  }, function (seed) {
    var rng = randomFor(seed, 0x13307), mode = seed % 8;
    var lower = rng.int(-10, 6) / 2, upper = lower + rng.int(1, 6) / 2, center = rng.int(-10, 10) / 2;
    var rays;
    if (mode === 0) rays = [ray("lower", lower, false), ray("upper", upper, false)];
    else if (mode === 1) { var leftClosed = Math.floor(seed / 8) % 2 === 0; rays = [ray("lower", lower, leftClosed), ray("upper", upper, !leftClosed)]; }
    else if (mode === 2) rays = [ray("lower", lower, true), ray("upper", upper, true)];
    else if (mode === 3) rays = [ray("lower", upper, seed % 3 === 0), ray("upper", lower, seed % 5 === 0)];
    else if (mode === 4) rays = [ray("lower", lower, seed % 3 === 0), ray("lower", upper, Math.floor(seed / 8) % 2 === 0)];
    else if (mode === 5) rays = [ray("upper", upper, seed % 3 === 0), ray("upper", lower, Math.floor(seed / 8) % 2 === 0)];
    else if (mode === 6) rays = [ray("lower", center, true), ray("upper", center, true)];
    else rays = [ray("lower", center, Math.floor(seed / 8) % 3 === 0), ray("upper", center, Math.floor(seed / 8) % 3 === 1)];
    rays = rng.shuffle(rays);
    var correct = intersectRays(rays), candidates = [];
    if (correct.length) {
      var changed = Object.assign({}, correct[0]);
      if (changed.from !== null) changed.fromClosed = !changed.fromClosed;
      else changed.toClosed = !changed.toClosed;
      candidates.push([changed]);
    }
    candidates.push([rays[0]], [rays[1]], rays, [], [{from: null, to: null, fromClosed: false, toClosed: false}]);
    var choice = intervalChoices(rng, correct, candidates);
    var specs = rays.map(function (s, i) { return inequalityFor(s, rng, (Math.floor(seed / 8) + i) % 3, (Math.floor(seed / 16) + i) % 2 === 1); });
    return {
      type: "choice", variant: ["open-interval", "mixed-interval", "closed-interval", "separated-empty", "lower-ray", "upper-ray", "single-point", "touching-empty"][mode],
      prompt: "Реши систему из двух неравенств: " + inequalityText(specs[0]) + "; " + inequalityText(specs[1]) +
        ". На каком рисунке показаны числа, которые удовлетворяют обоим условиям одновременно? Выбери один номер.",
      linearInequalities: specs, options: choice.options, visual: choice.visual,
      hint: "Сначала реши каждое неравенство отдельно. Затем оставь только общие решения. Если границы совпали, проверь, разрешено ли само граничное число в обоих условиях.",
      explanation: "Первое неравенство даёт " + rayText(rays[0]) + ", второе — " + rayText(rays[1]) +
        ". Их пересечение: " + setText(correct) + ". Нужны числа, подходящие сразу обоим условиям, поэтому верен рисунок " +
        correctNumber(choice.options) + "."
    };
  });

  family({
    id: "exam-geometric-time", topicId: "n14", title: "Изменение через равные промежутки",
    skillId: "n14-geometric-term", goal: "Перевести длительность в число переходов и найти значение геометрической прогрессии."
  }, function (seed) {
    var rng = randomFor(seed, 0x14149), ratios = [[2, 1], [3, 1], [1, 2], [1, 4], [3, 2], [4, 5]];
    var pair = ratios[seed % ratios.length], steps = seed % 10 === 0 ? 0 : rng.int(1, 4), period = rng.pick([2, 3, 4, 5, 6, 8]);
    var baseTenths = rng.int(10, 30), initial = baseTenths * Math.pow(pair[1], steps) / 10;
    var ratio = pair[0] / pair[1], elapsed = period * steps, answer = baseTenths * Math.pow(pair[0], steps) / 10;
    return {
      type: "number", variant: (ratio > 1 ? "growth" : "decay") + (steps === 0 ? "-zero-transitions" : "-timed-transitions"), answer: answer,
      prompt: "В начале процесса, при t = 0, величина равна " + fmt(initial) + ". В конце каждого полного промежутка длительностью " + period +
        " мин её значение умножается на " + fmt(ratio) + "; между этими моментами оно не меняется. Сначала определи число переходов. " +
        "Чему равна величина через " + elapsed + " мин? В ответ запиши только итоговое значение.",
      hint: "Число переходов равно прошедшему времени, делённому на длительность одного промежутка. Начальное значение соответствует нулю переходов.",
      explanation: "Число переходов за " + elapsed + " мин: " + elapsed + " ÷ " + period + " = " + steps +
        ". " + (steps === 0 ? "Ни одного изменения ещё не было: значение остаётся " + fmt(answer) + "." :
          "Умножаем начальное значение на " + fmt(ratio) + " ровно " + steps + " " + countWord(steps, "раз", "раза", "раз") + ": " + fmt(initial) + " × (" + fmt(ratio) +
          ")^" + steps + " = " + fmt(answer) + ". " + (ratio < 1 ? "Множитель меньше 1, поэтому величина уменьшилась." : "Множитель больше 1, поэтому величина выросла.")),
      diagnostics: diagnostics(answer, [
        {value: answer * ratio, message: "Проверь число переходов: в начальный момент ещё не было ни одного умножения."},
        {value: answer / ratio, message: steps === 0 ? "При t = 0 ещё не было ни одного изменения: значение остаётся исходным." : "Проверь, не пропущено ли последнее изменение в конце полного промежутка."},
        {value: initial + steps * ratio, message: "Задан постоянный множитель, а не постоянная прибавка."},
        {value: steps, message: "Число переходов — промежуточный результат. В вопросе требуется значение величины после этих переходов."}
      ])
    };
  });

  family({
    id: "exam-triangle-angle-chain", topicId: "n15", title: "Биссектриса и равные отрезки",
    skillId: "n15-angles", goal: "Соединить равенство углов равнобедренного треугольника, биссектрису и сумму углов."
  }, function (seed) {
    var rng = randomFor(seed, 0x15161), theta = rng.int(10, 118) / 2, answer = 180 - 3 * theta;
    return {
      type: "number", variant: answer > 90 ? "obtuse-B" : answer === 90 ? "right-B" : "acute-B", answer: answer, unit: "°",
      prompt: "В треугольнике ABC точка K лежит на стороне BC между B и C. Отрезок AK — биссектриса угла BAC, причём AK = CK. " +
        "Угол ACB равен " + fmt(theta) + "°. Найди угол ABC. Ответ дай в градусах.",
      hint: "Рассмотри сначала треугольник ACK: какие углы лежат напротив равных сторон AK и CK? Затем используй свойство биссектрисы.",
      explanation: "В треугольнике ACK стороны AK и CK равны, поэтому ∠KAC = ∠ACK = " + fmt(theta) +
        "°. Так как AK — биссектриса, ∠BAC = " + fmt(2 * theta) + "°. Тогда ∠ABC = 180° − " + fmt(2 * theta) +
        "° − " + fmt(theta) + "° = " + fmt(answer) + "°.",
      diagnostics: diagnostics(answer, [
        {value: 180 - 2 * theta, message: "Равный данному угол — только половина угла BAC. Учитывай обе части, разделённые биссектрисой."},
        {value: 180 - theta, message: "Из 180° нужно вычесть оба остальных угла треугольника ABC."},
        {value: 2 * theta, message: "Это угол BAC. В вопросе требуется угол ABC."},
        {value: theta, message: "Это данный угол C и половина угла A. Найди ещё оставшийся угол B."}
      ])
    };
  });

  family({
    id: "exam-circle-square-area", topicId: "n16", title: "Окружность и площадь квадрата",
    skillId: "n16-circle-polygons", goal: "Различить сторону и диагональ квадрата при двух расположениях относительно окружности."
  }, function (seed) {
    var rng = randomFor(seed, 0x16183), radius = rng.int(2, 24) / 2, outer = seed % 2 === 0;
    var answer = (outer ? 4 : 2) * radius * radius;
    return {
      type: "number", variant: outer ? "circumscribed-square" : "inscribed-square", answer: answer, unit: "см²",
      prompt: (outer ? "Квадрат описан около окружности" : "Квадрат вписан в окружность") +
        " радиуса " + fmt(radius) + " см. Найди площадь квадрата. Ответ дай в квадратных сантиметрах.",
      visual: {kind: "circleSquare", radius: radius, mode: outer ? "outer" : "inner",
        label: (outer ? "Четыре стороны квадрата касаются окружности." : "Все четыре вершины квадрата лежат на окружности.") +
          " Отмечен радиус " + fmt(radius) + " см."},
      hint: outer ? "Если окружность вписана в квадрат, расстояние между противоположными сторонами квадрата равно диаметру." :
        "Если квадрат вписан в окружность, его диагональ является диаметром. Свяжи квадрат диагонали с квадратом стороны.",
      explanation: outer ? "Сторона квадрата равна диаметру: a = 2r = " + fmt(2 * radius) + " см. Поэтому S = a² = " +
        fmt(2 * radius) + "² = " + fmt(answer) + " см²." :
        "Диагональ квадрата d = 2r = " + fmt(2 * radius) + " см. По теореме Пифагора d² = 2a², а S = a². " +
        "Поэтому S = d² ÷ 2 = " + fmt(2 * radius) + "² ÷ 2 = " + fmt(answer) + " см².",
      diagnostics: diagnostics(answer, [
        {value: (outer ? 2 : 4) * radius * radius, message: "Проверь расположение квадрата: диаметр совпадает со стороной описанного квадрата и с диагональю вписанного."},
        {value: radius * radius, message: "Радиус окружности не равен стороне этого квадрата. Сначала найди подходящую связь через диаметр."},
        {value: 2 * radius, message: "Это диаметр, то есть длина. В вопросе требуется площадь квадрата."}
      ])
    };
  });

  family({
    id: "exam-trapezoid-midline", topicId: "n17", title: "Диагональ делит среднюю линию",
    skillId: "n17-midline", goal: "Связать два отрезка средней линии трапеции с половинами соответствующих оснований."
  }, function (seed) {
    var rng = randomFor(seed, 0x17191), shortBase = rng.int(3, 15), longBase = shortBase + rng.int(2, 15), mode = seed % 5;
    var first = shortBase / 2, second = longBase / 2, middle = first + second;
    var intro = "В трапеции ABCD основания AB и CD параллельны, AB > CD. Точки M и N — середины боковых сторон AD и BC соответственно. " +
      "Диагональ AC пересекает среднюю линию MN в точке K. ";
    var question, answer, calculation, wrong;
    if (mode === 0 || mode === 1) {
      var askFirst = mode === 0;
      question = "AB = " + longBase + " см, CD = " + shortBase + " см. Найди " + (askFirst ? "MK" : "KN") + ".";
      answer = askFirst ? first : second;
      calculation = (askFirst ? "MK = CD ÷ 2 = " + shortBase : "KN = AB ÷ 2 = " + longBase) + " ÷ 2 = " + fmt(answer) + " см.";
      wrong = [
        {value: askFirst ? second : first, message: "Проверь, какому основанию параллелен отрезок в соответствующем треугольнике: MK связан с CD, а KN — с AB."},
        {value: middle, message: "Это длина всей средней линии MN. Нужна только одна её часть."},
        {value: 2 * answer, message: "Средняя линия треугольника равна половине параллельной ей стороны."}
      ];
    } else if (mode === 2 || mode === 3) {
      var askLong = mode === 2;
      question = "MK = " + fmt(first) + " см, KN = " + fmt(second) + " см. Найди основание " + (askLong ? "AB" : "CD") + ".";
      answer = askLong ? longBase : shortBase;
      calculation = (askLong ? "AB = 2 × KN = 2 × " + fmt(second) : "CD = 2 × MK = 2 × " + fmt(first)) + " = " + fmt(answer) + " см.";
      wrong = [
        {value: askLong ? shortBase : longBase, message: "Соотнеси отрезок с нужным основанием: KN — половина AB, MK — половина CD."},
        {value: answer / 2, message: "Это соответствующая часть средней линии. Основание вдвое больше этой части."},
        {value: answer / 4, message: "При восстановлении основания половину нужно удвоить, а не ещё раз разделить на два."}
      ];
    } else {
      question = "MN = " + fmt(middle) + " см, CD = " + shortBase + " см. Найди KN.";
      answer = second;
      calculation = "MK = CD ÷ 2 = " + fmt(first) + " см, поэтому KN = MN − MK = " + fmt(middle) + " − " + fmt(first) + " = " + fmt(answer) + " см.";
      wrong = [
        {value: middle - shortBase, message: "Из MN нужно вычесть половину основания CD, а не всё основание."},
        {value: first, message: "Это отрезок MK. Вычти его длину из всей средней линии MN."},
        {value: middle, message: "Это длина всей средней линии, а вопрос относится к отрезку KN."}
      ];
    }
    return {
      type: "number", variant: ["segment-near-M", "segment-near-N", "recover-AB", "recover-CD", "segment-from-whole-midline"][mode],
      answer: answer, unit: "см", prompt: intro + question + " Ответ дай в сантиметрах.",
      hint: "Отрезок MK — средняя линия треугольника ADC. Поэтому K — середина AC. Затем рассмотри KN в треугольнике ABC.",
      explanation: "Через середину AD проходит MK, параллельный CD, поэтому K — середина AC и MK = CD ÷ 2. " +
        "Тогда KN — средняя линия треугольника ABC, то есть KN = AB ÷ 2. " + calculation,
      diagnostics: diagnostics(answer, wrong)
    };
  });

  family({
    id: "exam-grid-distance", topicId: "n18", title: "Длина на сетке с масштабом",
    skillId: "n18-length", goal: "Самостоятельно прочитать два смещения на рисунке, найти длину отрезка AB и учесть размер клетки."
  }, function (seed) {
    var rng = randomFor(seed, 0x18209), triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]];
    var triple = triples[seed % triples.length], swap = Math.floor(seed / 5) % 2 === 1;
    var dx = (swap ? triple[1] : triple[0]) * (Math.floor(seed / 10) % 2 ? -1 : 1);
    var dy = (swap ? triple[0] : triple[1]) * (Math.floor(seed / 20) % 2 ? -1 : 1);
    var x = rng.int(-4, 4), y = rng.int(-4, 4), cell = rng.pick([0.5, 1, 1.5, 2, 2.5]), answer = triple[2] * cell;
    return {
      type: "number", variant: "grid-" + triple.join("-") + (swap ? "-rotated" : "-base"), answer: answer, unit: "см",
      prompt: "На квадратной сетке отмечены точки A и B. Сторона каждой клетки равна " + fmt(cell) +
        " см. Найди длину отрезка AB. Ответ дай в сантиметрах.",
      visual: {kind: "polygon", points: [[x, y], [x + dx, y + dy]], labels: ["A", "B"], grid: true,
        label: "Точка B расположена на " + Math.abs(dx) + " " + countWord(Math.abs(dx), "клетку", "клетки", "клеток") + " " + (dx > 0 ? "правее" : "левее") +
          " и на " + Math.abs(dy) + " " + countWord(Math.abs(dy), "клетку", "клетки", "клеток") + " " + (dy > 0 ? "выше" : "ниже") + " точки A. Сторона клетки " + fmt(cell) + " см."},
      hint: "Дострой прямоугольный треугольник: катеты идут вдоль линий сетки. Сначала найди длину в клетках, затем переведи её в сантиметры.",
      explanation: "Между точками по горизонтали " + Math.abs(dx) + " " + countWord(Math.abs(dx), "клетка", "клетки", "клеток") + ", по вертикали " + Math.abs(dy) +
        ". По теореме Пифагора длина в клетках: √(" + Math.abs(dx) + "² + " + Math.abs(dy) + "²) = √" +
        (dx * dx + dy * dy) + " = " + triple[2] + ". С учётом масштаба AB = " + triple[2] + " × " + fmt(cell) + " = " + fmt(answer) + " см.",
      diagnostics: diagnostics(answer, [
        {value: (Math.abs(dx) + Math.abs(dy)) * cell, message: "Сумма катетов — длина пути по двум сторонам. Наклонный отрезок находится по теореме Пифагора."},
        {value: triple[2], message: "Проверь масштаб: длину в клетках нужно умножить на сторону клетки в сантиметрах."},
        {value: triple[2] * cell * cell, message: "Это длина, поэтому нужен один множитель масштаба. Квадрат масштаба используется для площади."},
        {value: (dx * dx + dy * dy) * cell, message: "Сумма квадратов даёт квадрат длины в клетках. Нужно ещё извлечь квадратный корень."}
      ])
    };
  });

  // Every false universal statement has a valid explicit counterexample.
  var claimGroups = [
    {
      name: "similarity",
      yes: [
        {id: "sim-AA", text: "Если два угла одного треугольника равны двум углам другого, то эти треугольники подобны.",
          reason: "Это признак подобия по двум углам; третьи углы также равны по сумме углов треугольника."},
        {id: "sim-perimeters", text: "У подобных треугольников отношение периметров равно отношению соответствующих сторон.",
          reason: "Все три стороны умножаются на один коэффициент k, поэтому их сумма тоже умножается на k."},
        {id: "sim-area-square", text: "Если соответствующие стороны подобных треугольников относятся как 2 : 1, то их площади относятся как 4 : 1.",
          reason: "Основание и соответствующая высота увеличиваются вдвое. Их произведение, а значит и площадь, увеличивается вчетверо."}
      ],
      no: [
        {id: "sim-equal-perimeters", text: "Любые два треугольника с равными периметрами подобны.",
          reason: "Контрпример: треугольники со сторонами 3, 4, 5 и 2, 5, 5 существуют, оба имеют периметр 12, но их стороны не пропорциональны."},
        {id: "sim-equal-areas", text: "Любые два треугольника с равными площадями подобны.",
          reason: "Контрпример: прямоугольные треугольники с катетами 3 и 4, а также 2 и 6. Обе площади равны 6, но отношения меньшего катета к большему — 3/4 и 1/3 — различаются."},
        {id: "sim-area-linear", text: "Если соответствующие стороны подобных треугольников относятся как 3 : 1, то их площади относятся как 3 : 1.",
          reason: "Контрпример: прямоугольные треугольники со сторонами 9, 12, 15 и 3, 4, 5 подобны с коэффициентом 3. Их площади 54 и 6 относятся как 9 : 1."}
      ]
    },
    {
      name: "trigonometry",
      yes: [
        {id: "trig-tangent-definition", text: "Тангенс острого угла прямоугольного треугольника равен отношению противолежащего катета к прилежащему.",
          reason: "Это определение тангенса острого угла в прямоугольном треугольнике."},
        {id: "trig-sine-bound", text: "В прямоугольном треугольнике синус любого острого угла меньше 1.",
          reason: "Синус равен отношению противолежащего катета к гипотенузе. В невырожденном прямоугольном треугольнике катет короче гипотенузы."},
        {id: "trig-45-isosceles", text: "Если один острый угол прямоугольного треугольника равен 45°, то его катеты равны.",
          reason: "Другой острый угол тоже равен 45°. Напротив равных углов лежат равные стороны — катеты."}
      ],
      no: [
        {id: "trig-tangent-bound", text: "Тангенс любого острого угла меньше 1.",
          reason: "Контрпример: в прямоугольном треугольнике с катетами 3 и 4 тангенс угла напротив катета 4 равен 4/3, что больше 1."},
        {id: "trig-sine-adjacent", text: "Синус острого угла прямоугольного треугольника всегда равен отношению прилежащего катета к гипотенузе.",
          reason: "Контрпример: в треугольнике 3, 4, 5 для угла напротив катета 3 синус равен 3/5, а отношение прилежащего катета к гипотенузе равно 4/5."},
        {id: "trig-sine-equals-tangent", text: "Если синус острого угла равен 3/5, то тангенс этого угла тоже равен 3/5.",
          reason: "Контрпример: в прямоугольном треугольнике 3, 4, 5 угол напротив катета 3 имеет синус 3/5 и тангенс 3/4."}
      ]
    },
    {
      name: "quadrilaterals-and-circles",
      yes: [
        {id: "geo-rectangle-diagonals", text: "Диагонали любого прямоугольника равны.",
          reason: "Каждая диагональ — гипотенуза прямоугольного треугольника с катетами, равными сторонам прямоугольника; квадраты диагоналей одинаковы."},
        {id: "geo-rhombus-perpendicular", text: "Диагонали любого ромба перпендикулярны.",
          reason: "Диагонали ромба делятся пополам. Его стороны равны, поэтому прилегающие углы при пересечении диагоналей равны и в сумме дают 180°: каждый равен 90°."},
        {id: "geo-diameter-angle", text: "Вписанный угол, опирающийся на диаметр окружности, равен 90°.",
          reason: "Дуга полуокружности имеет меру 180°. Вписанный угол равен половине меры дуги, на которую он опирается."},
        {id: "geo-tangent-radius", text: "Радиус, проведённый в точку касания окружности и прямой, перпендикулярен этой прямой.",
          reason: "Это свойство касательной и радиуса, проведённого именно в точку касания."}
      ],
      no: [
        {id: "geo-parallelogram-rectangle", text: "Любой параллелограмм является прямоугольником.",
          reason: "Контрпример: ромб с углами 60° и 120° — параллелограмм, но прямых углов у него нет."},
        {id: "geo-rhombus-equal-diagonals", text: "Диагонали любого ромба равны.",
          reason: "Контрпример: ромб с вершинами (3; 0), (0; 4), (−3; 0), (0; −4). Все его стороны равны 5, а диагонали равны 6 и 8."},
        {id: "geo-chords-equal", text: "Все хорды одной окружности равны.",
          reason: "Контрпример: в окружности x² + y² = 25 диаметр имеет длину 10, а хорда с концами (−3; 4) и (3; 4) имеет длину 6."},
        {id: "geo-tangent-center", text: "Любая прямая, имеющая с окружностью ровно одну общую точку, проходит через её центр.",
          reason: "Контрпример: прямая x = 5 касается окружности x² + y² = 25 в точке (5; 0), но не проходит через её центр (0; 0)."}
      ]
    }
  ];
  family({
    id: "exam-geometry-one-true", topicId: "n19", title: "Ровно одно верное утверждение",
    skillId: "n19-conditions", goal: "Проверить смешанный набор геометрических утверждений и выбрать единственное верное."
  }, function (seed) {
    var rng = randomFor(seed, 0x19223), trueGroup = seed % claimGroups.length;
    var chosen = claimGroups.map(function (group, i) {
      return {claim: rng.pick(i === trueGroup ? group.yes : group.no), correct: i === trueGroup};
    });
    chosen = rng.shuffle(chosen);
    return {
      type: "choice", variant: "true-" + claimGroups[trueGroup].name,
      prompt: "Какое из трёх утверждений верно? Выбери ровно одно утверждение; его номер и есть ответ.",
      options: chosen.map(function (entry, i) { return {text: (i + 1) + ". " + entry.claim.text, correct: entry.correct, claimId: entry.claim.id}; }),
      hint: "Обрати внимание на слова «любой», «всегда» и на условия теоремы. Для опровержения общего утверждения достаточно одного допустимого примера.",
      explanation: "Верно утверждение " + (chosen.findIndex(function (entry) { return entry.correct; }) + 1) + ". " +
        chosen.map(function (entry, i) { return (i + 1) + ") " + entry.claim.reason; }).join(" ")
    };
  });

  var bundle = {families: families, routes: []};
  if (typeof module !== "undefined" && module.exports) module.exports = bundle;
  if (typeof window !== "undefined") (window.OGE_SERIES_PARTS ||= []).push(bundle);
})();
