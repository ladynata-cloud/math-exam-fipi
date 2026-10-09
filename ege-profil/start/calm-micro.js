(function (root) {
  'use strict';
  // Optional guided questions only. The authored task, its steps and all
  // progress/answer keys stay untouched. The caller records help separately.
  const f = value => String(Number(value.toFixed(8))).replace('.', ',').replace('-', '−');
  const question = (prompt, answer, hint, why, choices) => {
    const result = { prompt, answer, hint, why };
    if (choices) result.choices = choices;
    return result;
  };
  const positive = (...values) => values.every(value => Number.isFinite(value) && value > 0);

  function timeDifference(meta) {
    const moving = meta.kind === 'motion';
    const amount = moving ? meta.distance : meta.amount;
    const d = meta.difference;
    if (!positive(amount, d, meta.gap)) return [];
    const a = f(amount), difference = f(d);
    const small = `${a}/x`, large = `${a}/(x + ${difference})`;
    const denominator = `x(x + ${difference})`;
    const meaning = moving ? 'Меньшая скорость, км/ч' : 'Число деталей второго мастера за час';
    return [
      question('Начнём с обозначения. Что здесь означает x?', meaning,
        moving ? 'Мы обозначаем скорость того, кто едет медленнее.' : 'Первый мастер делает больше за час. x относится ко второму.',
        moving ? `Меньшая скорость — x. Большая — x + ${difference}.` : `Второй делает x деталей за час. Первый — x + ${difference}.`,
        moving ? ['Время в пути, ч', meaning, 'Пройденный путь, км'] : ['Время работы второго мастера', 'Число деталей всего заказа', meaning]),
      question(`x > 0. Какое время больше: ${small} или ${large}?`, small,
        moving ? 'Одинаковый путь при меньшей скорости занимает больше времени.' : 'Одинаковый заказ при меньшем числе деталей за час выполняют дольше.',
        `У первой дроби меньше знаменатель. Поэтому ${small} > ${large}. Из большего времени вычитаем меньшее.`,
        [small, large, 'Времена одинаковые']),
      question(`В разности ${small} − ${large} выбери общий знаменатель.`, denominator,
        'Нужен знаменатель, который делится и на x, и на (x + ' + difference + ').',
        `Общий знаменатель — ${denominator}. Числители станут ${a}(x + ${difference}) и ${a}x.`,
        [`x + ${difference}`, `2x + ${difference}`, denominator]),
      question(`В числителе ${a}(x + ${difference}) − ${a}x. После раскрытия скобок слагаемые с x сократятся. Вычисли оставшееся: ${a} · ${difference}.`, amount * d,
        `${a}x − ${a}x = 0. Остаётся произведение двух известных чисел.`,
        `В числителе осталось ${f(amount * d)}. После умножения на знаменатель получаем ${f(amount * d)} = ${f(meta.gap)} · ${denominator}. Теперь вернись к обычному вопросу и раздели на ${f(meta.gap)}.`)
    ];
  }

  function twoMixtures(meta) {
    if (!positive(meta.low, meta.high, meta.addedMass, meta.replacement, meta.firstPercent, meta.secondPercent) ||
        meta.high <= meta.low || meta.secondPercent <= meta.firstPercent) return [];
    const total = meta.addedMass * meta.replacement / (meta.secondPercent - meta.firstPercent);
    const original = total - meta.addedMass;
    const salt100 = total * meta.firstPercent;
    if (!positive(original) || !Number.isFinite(salt100)) return [];
    const low = f(meta.low), high = f(meta.high), mass = f(original), salt = f(salt100);
    const equation = `${low}x + ${high}(${mass} − x) = ${salt}`;
    const constant = meta.high * original;
    return [
      question(`x кг — ${low}%-й раствор. Другого раствора ${mass} − x кг. Как записать массу соли, умножив уравнение на 100?`, equation,
        'Вклад каждого раствора: его масса × процент. Складываем два вклада.',
        `Получаем ${equation}. Справа — найденная ранее масса соли, умноженная на 100.`,
        [`${low}x + ${high}x = ${salt}`, equation, `${low}x + ${high}(${mass} + x) = ${salt}`]),
      question(`Раскроем скобки: ${high}(${mass} − x). Найди числовую часть: ${high} · ${mass}.`, constant,
        'Умножаем число перед скобкой на первый член в скобках.',
        `${high}(${mass} − x) = ${f(constant)} − ${high}x.`),
      question(`Соберём слагаемые с x: ${low}x − ${high}x = (${low} − ${high})x. Вычисли ${low} − ${high}.`, meta.low - meta.high,
        'Из меньшего числа вычитаем большее. Коэффициент будет отрицательным.',
        `Получаем (${f(meta.low - meta.high)})x + ${f(constant)} = ${salt}. Переносим число вправо: (${f(meta.low - meta.high)})x = ${salt} − ${f(constant)}.`),
      question('На какое число умножить обе части уравнения, чтобы поменять все знаки?', -1,
        'Положительное станет отрицательным, а отрицательное — положительным.',
        `Получаем ${f(meta.high - meta.low)}x = ${f(constant)} − ${salt}. Теперь в обычном вопросе вычисли правую часть.`,
        ['−1', '1', '0'])
    ];
  }

  function equalLoan(meta) {
    if (!positive(meta.amount, meta.rate) || ![2, 3].includes(meta.years)) return [];
    const q = 1 + meta.rate / 100;
    const first = meta.amount * q;
    const debt = `${f(first)} − x`;
    const charged = `(${debt}) · ${f(q)}`;
    return [
      question(`Перед первым платежом долг ${f(first)} руб. Платёж равен x. Какой долг останется?`, debt,
        'Внесённый платёж уменьшает долг.',
        `После первого платежа осталось ${debt} руб. Без значения x это выражение, а не готовое число.`,
        [`${f(first)} + x`, debt, f(first)]),
      question(`Во втором году проценты начисляют на весь остаток. Выбери запись долга перед вторым платежом.`, charged,
        `В скобках остаётся весь долг после первого платежа. На ${f(q)} умножаются оба его слагаемых.`,
        `Сначала начисление: ${charged}. Второй платёж здесь ещё не вычтен.`,
        [`${f(first)} · ${f(q)} − x`, `(${f(first)} + x) · ${f(q)}`, charged]),
      question(`Раскрываем скобки (${debt}) · ${f(q)}. Слагаемое −x тоже умножается на ${f(q)}. Какое положительное число будет стоять перед x после знака «−»?`, q,
        `−x · ${f(q)} = −(1 · ${f(q)})x.`,
        `Часть с платежом стала −${f(q)}x. Числовую часть вычисли в обычном вопросе.`)
    ];
  }

  function steps(task, stepIndex) {
    if (!task || !task.meta || !Number.isInteger(stepIndex) || stepIndex < 0) return [];
    const meta = task.meta;
    if ((meta.kind === 'motion' || meta.kind === 'production') && stepIndex === 0) return timeDifference(meta);
    // Earlier operations already have their own authored questions.
    if (meta.kind === 'two-mixtures' && stepIndex === 4) return twoMixtures(meta);
    if (meta.kind === 'loan-equal' && stepIndex === 2) return equalLoan(meta);
    return [];
  }

  const api = { steps };
  root.ProfileCalmMicro = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
