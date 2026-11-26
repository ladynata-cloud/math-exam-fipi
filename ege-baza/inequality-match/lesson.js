(function () {
  'use strict';

  const LETTERS = ['А', 'Б', 'В', 'Г'];
  const VARIANTS = 24;
  const STORAGE_KEY = 'mathexam.ege-baza.inequality-match.control.v1';
  const numberText = n => String(n).replace('-', '−').replace('.', ',');
  const interval = (lower, upper, includeLower = false, includeUpper = false) =>
    ({ lower, upper, includeLower, includeUpper });

  function intervalText(s) {
    const left = s.lower === null ? '−∞' : numberText(s.lower);
    const right = s.upper === null ? '+∞' : numberText(s.upper);
    return (s.includeLower ? '[' : '(') + left + '; ' + right + (s.includeUpper ? ']' : ')');
  }

  function permutation(rank) {
    const available = [0, 1, 2, 3];
    return [6, 2, 1, 1].map(divisor => {
      const index = Math.floor(rank / divisor);
      rank %= divisor;
      return available.splice(index, 1)[0];
    });
  }

  function makeRow(kind, base, level, boundary, direction, closed) {
    const factor = base >= 1 ? base : Math.round(1 / base);
    const baseLabel = base >= 1 ? String(factor) : '1/' + factor;
    const power = factor ** Math.abs(level);
    const reciprocal = (base < 1) !== (level < 0);
    const rightLabel = kind === 'log' ? numberText(level) : reciprocal ? '1/' + power : String(power);
    const powerValue = reciprocal ? 1 / power : power;
    const shift = boundary - (kind === 'log' ? powerValue : level);
    const argument = shift === 0 ? 'x' : shift > 0 ? 'x − ' + shift : 'x + ' + (-shift);
    const increasing = base > 1;
    const greater = (direction === 'right') === increasing;
    const relation = greater ? (closed ? '≥' : '>') : (closed ? '≤' : '<');
    const leftEnd = kind === 'log' ? shift : null;
    const solution = direction === 'right'
      ? interval(boundary, null, closed, false)
      : interval(leftEnd, boundary, false, closed);
    const expression = kind === 'log'
      ? 'log[' + baseLabel + '](' + argument + ') ' + relation + ' ' + rightLabel
      : (base < 1 ? '(' + baseLabel + ')' : baseLabel) + '^(' + argument + ') ' + relation + ' ' + rightLabel;
    const growth = increasing ? 'возрастает' : 'убывает';
    const hint = kind === 'log'
      ? 'Запиши, когда ' + argument + ' > 0. Функция с основанием ' + baseLabel + ' ' + growth
        + '. Сравни аргумент со степенью основания и пересечи результат с областью определения.'
      : 'Представь ' + rightLabel + ' как степень числа ' + baseLabel + '. Функция с таким основанием '
        + growth + '. Как связаны показатели, когда значения удовлетворяют исходному знаку?';
    return { kind, base, shift, level, relation, solution, expression, argument, baseLabel, rightLabel, hint };
  }

  function linearText(coefficient, constant) {
    if (coefficient === 0) return numberText(constant);
    const term = coefficient === 1 ? 'x' : coefficient === -1 ? '−x' : numberText(coefficient) + 'x';
    if (constant === 0) return term;
    return term + (constant < 0 ? ' − ' : ' + ') + Math.abs(constant);
  }

  function linearRow(boundary, serial) {
    const coefficient = [2, -3, -2, 3][serial % 4];
    const constant = 3 - serial;
    const right = coefficient * boundary + constant;
    const goesRight = serial % 3 !== 1;
    const closed = serial % 2 === 1;
    const greater = goesRight === (coefficient > 0);
    const relation = greater ? (closed ? '≥' : '>') : (closed ? '≤' : '<');
    const leftLabel = linearText(coefficient, constant);
    const rightLabel = numberText(right);
    return {
      kind: 'linear', coefficient, constant, right, relation, leftLabel, rightLabel,
      expression: leftLabel + ' ' + relation + ' ' + rightLabel,
      solution: goesRight ? interval(boundary, null, closed, false) : interval(null, boundary, false, closed),
      hint: 'Убери свободное слагаемое одним действием в обеих частях. Затем раздели обе части на '
        + numberText(coefficient) + '. Сохраняется ли направление неравенства при таком делении?'
    };
  }

  function rationalRow(boundary, serial) {
    const bounded = serial % 2 === 0;
    let numeratorSlope, numeratorConstant, pole, relation, solution;
    if (bounded) {
      // Between the two critical points the linear factors have opposite signs.
      const left = boundary - (2 + serial / 2);
      const rootFirst = serial % 4 === 0;
      const root = rootFirst ? left : boundary;
      pole = rootFirst ? boundary : left;
      numeratorSlope = serial % 4 === 0 ? 1 : -1;
      numeratorConstant = -numeratorSlope * root;
      const closedAtRoot = serial < 4;
      relation = numeratorSlope > 0 ? (closedAtRoot ? '≤' : '<') : (closedAtRoot ? '≥' : '>');
      solution = interval(left, boundary, rootFirst && closedAtRoot, !rootFirst && closedAtRoot);
    } else {
      // A nonzero constant numerator leaves one critical point, the pole.
      pole = boundary + 8 + (serial - 1);
      numeratorSlope = 0;
      numeratorConstant = serial < 4 ? -3 : 2;
      const goesRight = serial % 4 === 1;
      const greater = goesRight === (numeratorConstant > 0);
      relation = greater ? (serial < 4 ? '≥' : '>') : (serial < 4 ? '≤' : '<');
      solution = goesRight ? interval(pole, null) : interval(null, pole);
    }
    const numeratorLabel = linearText(numeratorSlope, numeratorConstant);
    const denominatorLabel = linearText(1, -pole);
    return {
      kind: 'rational', numeratorSlope, numeratorConstant, pole, relation,
      numeratorLabel, denominatorLabel, rightLabel: '0', solution,
      expression: '(' + numeratorLabel + ')/(' + denominatorLabel + ') ' + relation + ' 0',
      hint: bounded
        ? 'Отметь нуль числителя и нуль знаменателя. Проверь знак дроби в каждом из трёх промежутков. Какую граничную точку нужно исключить при любом знаке неравенства?'
        : 'Числитель имеет постоянный знак. Где знаменатель положителен, а где отрицателен? В точке, где знаменатель равен нулю, дробь не определена.'
    };
  }

  function createSet(mode, variant) {
    if (!['practice', 'check'].includes(mode) || !Number.isSafeInteger(variant) || variant < 0 || variant >= VARIANTS) {
      throw new RangeError('Нет такого варианта');
    }
    // The primary boundary separates practice from control even when the same family recurs.
    const check = mode === 'check' ? 1 : 0;
    const boundary = -4 + 2 * (variant % 6) + check;
    const style = (Math.floor(variant / 6) + variant % 6 + check) % 4;
    const logBase = [2, 0.5, 3, 1 / 3][style];
    const expBase = [3, 0.5, 0.25, 2][(style + variant % 3) % 4];
    const otherExpBase = expBase > 1 ? 0.5 : 3;
    const otherLogBase = logBase > 1 ? 0.5 : 2;
    const logLevel = (logBase > 1 ? 1 : -1) * (1 + variant % 2);
    const rightBound = boundary + 2 * (variant % 3);
    const closedRight = (variant + check) % 2 === 0;
    let items = [
      makeRow('log', logBase, logLevel, boundary, 'left', variant % 3 !== 1),
      makeRow('exp', expBase, [-2, 1, 2, -1][style], boundary, 'left', variant % 3 !== 2),
      makeRow('exp', otherExpBase, [1, -2, -1, 2][style], rightBound, 'right', closedRight),
      makeRow('log', otherLogBase, otherLogBase > 1 ? 1 : -1,
        rightBound + (variant % 2 ? 2 : 0), 'right', !closedRight)
    ];
    if (variant % 3 === 2) {
      const serial = Math.floor(variant / 3);
      const exp = items[serial % 4 < 2 ? 1 : 2];
      const log = items[serial % 4 === 0 || serial % 4 === 3 ? 3 : 0];
      items = [exp, log, linearRow(boundary - 8, serial), rationalRow(boundary + 2, serial)];
    }
    const rows = permutation((variant * 11 + 3 + 8 * check) % VARIANTS).map(i => items[i]);
    const order = permutation((variant * 7 + 9 + 6 * check) % VARIANTS);
    const choices = order.map(i => rows[i].solution);
    const answer = rows.map(row => choices.indexOf(row.solution) + 1).join('');
    return { rows, choices, answer };
  }

  function modelAt(base, x) {
    const boundary = 1 + base;
    const defined = x > 1;
    return {
      defined,
      matches: defined ? (base > 1 ? x <= boundary : x >= boundary) : null,
      value: defined ? Math.log(x - 1) / Math.log(base) : null,
      boundary,
      solution: base > 1 ? interval(1, boundary, false, true) : interval(boundary, null, true, false)
    };
  }

  function mountModel() {
    const baseSelect = document.getElementById('base-select');
    const slider = document.getElementById('test-x');
    const svg = document.getElementById('model-line');
    const readout = document.getElementById('model-readout');
    svg.setAttribute('viewBox', '0 0 640 126');
    svg.setAttribute('aria-hidden', 'true');
    const X = v => 44 + (v + 1) * 92;

    function draw() {
      const x = Number(slider.value), base = Number(baseSelect.value);
      const m = modelAt(base, x);
      const start = X(m.solution.lower);
      const end = m.solution.upper === null ? 615 : X(m.solution.upper);
      let marks = '';
      for (let n = -1; n <= 5; n++) {
        marks += '<path d="M' + X(n) + ' 62v10" stroke="#435b64"/>'
          + '<text x="' + X(n) + '" y="99" text-anchor="middle" font-size="20">' + numberText(n) + '</text>';
      }
      const tick = X(m.boundary);
      svg.innerHTML = '<path d="M24 63H618" stroke="#435b64" stroke-width="2"/>' + marks
        + '<path d="M' + start + ' 63H' + end + '" stroke="#16745b" stroke-width="8"/>'
        + (m.solution.upper === null ? '<path d="m604 54 14 9-14 9" fill="none" stroke="#16745b" stroke-width="4"/>' : '')
        + '<circle cx="' + X(1) + '" cy="63" r="7" fill="white" stroke="#435b64" stroke-width="3"/>'
        + '<circle cx="' + tick + '" cy="63" r="7" fill="#16745b" stroke="#114f40" stroke-width="2"/>'
        + (base < 1 ? '<text x="' + tick + '" y="117" font-size="18" text-anchor="middle">1,5</text>' : '')
        + '<path d="M' + X(x) + ' 35v16m-6-6 6 7 6-7" stroke="#923a16" stroke-width="3" fill="none"/>'
        + '<text x="' + X(x) + '" y="24" font-size="20" fill="#783315" text-anchor="middle">x</text>';
      const point = 'x = ' + numberText(x) + '. ';
      let outcome;
      if (!m.defined) {
        outcome = 'Аргумент ' + numberText(x - 1) + ' не положителен. Логарифм не определён.';
      } else {
        const rounded = Math.round(m.value * 1000) / 1000;
        const value = (Number.isInteger(m.value) ? '= ' : '≈ ') + numberText(rounded);
        outcome = 'Значение логарифма ' + value + '. ' + (m.matches ? 'Неравенство выполнено.' : 'Неравенство не выполнено.');
      }
      readout.textContent = point + outcome + ' При x = ' + numberText(m.boundary)
        + ' логарифм равен 1. С учётом x > 1 получаем ' + intervalText(m.solution) + '.';
      slider.setAttribute('aria-valuetext', numberText(x));
    }
    slider.addEventListener('input', draw);
    baseSelect.addEventListener('change', draw);
    draw();
  }

  function feedbackFor(row, chosen) {
    if (row.solution.lower === chosen.lower && row.solution.upper === chosen.upper) {
      return 'Проверь граничную точку. Допускает ли знак ' + row.relation
        + ' равенство? Подставь точку в исходное неравенство и выбери скобку.';
    }
    if (row.kind === 'rational') {
      return 'Проверь знаменатель при x = ' + numberText(row.pole) + ': делить на ноль нельзя. '
        + 'Подставь по одному числу из соседних промежутков и сравни знак дроби с требуемым.';
    }
    if (row.kind === 'log' && (chosen.lower === null || chosen.lower < row.shift
        || chosen.lower === row.shift && chosen.includeLower)) {
      return 'Проверь область определения. При каких x аргумент ' + row.argument
        + ' строго положителен? Исключи из промежутка все остальные точки.';
    }
    return row.hint;
  }

  function readCheckState() {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      if (s && Number.isInteger(s.variant) && s.variant >= 0 && s.variant < VARIANTS
          && typeof s.draft === 'string' && s.draft.length <= 4
          && typeof s.submitted === 'boolean' && (!s.submitted || validCode(s.draft))) return s;
    } catch { /* The exercise also works when session storage is unavailable. */ }
    return { variant: 0, draft: '', submitted: false };
  }

  function validCode(text) {
    return /^[1-4]{4}$/.test(text) && new Set(text).size === 4;
  }

  function rowMath(row) {
    // All labels below are constructed from numeric task parameters.
    let left;
    if (row.kind === 'log') left = 'log<sub>' + row.baseLabel + '</sub>(' + row.argument + ')';
    if (row.kind === 'exp') left = (row.base < 1 ? '(' + row.baseLabel + ')' : row.baseLabel) + '<sup>' + row.argument + '</sup>';
    if (row.kind === 'linear') left = row.leftLabel;
    if (row.kind === 'rational') left = '(' + row.numeratorLabel + ')/(' + row.denominatorLabel + ')';
    return left + ' ' + row.relation.replace('<', '&lt;') + ' ' + row.rightLabel;
  }

  function mountExercise(mode) {
    const check = mode === 'check';
    const panel = document.getElementById(mode + '-panel').querySelector('[data-exercise]');
    let state = check ? readCheckState() : { variant: 0, draft: '', submitted: false };
    function save() {
      if (check) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* In-memory fallback. */ }
      }
    }
    function draw(moveFocus = false) {
      const set = createSet(mode, state.variant);
      const rowList = set.rows.map((row, i) => '<li><b>' + LETTERS[i] + '.</b> ' + rowMath(row) + '</li>').join('');
      const options = set.choices.map((s, i) => '<li><b>' + (i + 1) + '.</b> ' + intervalText(s) + '</li>').join('');
      const hintControls = check ? '' : '<div class="hint-controls"><label>Помощь для строки <select data-hint-row>'
        + LETTERS.map((l, i) => '<option value="' + i + '">' + l + '</option>').join('')
        + '</select></label> <button type="button" data-hint>Подсказка</button></div>';
      panel.innerHTML = '<p tabindex="-1" data-variant>Вариант ' + (state.variant + 1) + ' из ' + VARIANTS
        + '. Каждому неравенству подбери один промежуток.</p>'
        + '<div class="match-columns"><div><h3>Неравенства</h3><ul class="match-rows">' + rowList
        + '</ul></div><div><h3>Промежутки</h3><ul class="match-options">' + options
        + '</ul></div></div><form><label class="answer-label">Четыре цифры по порядку А, Б, В, Г '
        + '<input type="text" name="answer" inputmode="numeric" autocomplete="off" maxlength="4"></label>'
        + '<div class="exercise-actions"><button type="submit">Проверить ответ</button>'
        + '<button type="button" data-next>Следующий вариант</button></div></form>' + hintControls
        + '<p class="exercise-feedback" data-feedback role="status" aria-live="polite"></p>';
      const input = panel.querySelector('[name=answer]'), submit = panel.querySelector('[type=submit]');
      const next = panel.querySelector('[data-next]'), message = panel.querySelector('[data-feedback]');
      input.value = state.draft;
      function result() {
        const correct = state.draft === set.answer;
        if (check) {
          input.disabled = submit.disabled = true;
          next.disabled = state.variant === VARIANTS - 1;
          message.textContent = (correct ? 'Верно. Все четыре промежутка выбраны правильно.'
            : 'Ответ принят. В сопоставлении есть ошибка.')
            + (next.disabled ? ' Все варианты контроля в этой вкладке пройдены.' : ' Можно перейти к новому варианту.');
        } else if (correct) {
          message.textContent = 'Верно. Все четыре промежутка выбраны правильно. Попробуй следующий вариант.';
        } else {
          const i = [...state.draft].findIndex((digit, index) => digit !== set.answer[index]);
          panel.querySelector('[data-hint-row]').value = String(i);
          message.textContent = 'Проверь строку ' + LETTERS[i] + '. ' + feedbackFor(set.rows[i], set.choices[Number(state.draft[i]) - 1]);
        }
      }
      if (check) {
        next.disabled = !state.submitted;
        if (state.submitted) result();
      } else {
        panel.querySelector('[data-hint]').onclick = () => {
          const i = Number(panel.querySelector('[data-hint-row]').value);
          message.textContent = 'Строка ' + LETTERS[i] + '. ' + set.rows[i].hint;
        };
      }
      input.oninput = () => {
        if (state.submitted) return;
        state.draft = input.value;
        message.textContent = '';
        save();
      };
      panel.querySelector('form').onsubmit = e => {
        e.preventDefault();
        if (check && state.submitted) return;
        state.draft = input.value.trim();
        if (!validCode(state.draft)) {
          message.textContent = 'Введи четыре цифры от 1 до 4 без пробелов и повторов, по одной для каждой буквы.';
          return;
        }
        state.submitted = check;
        save();
        result();
      };
      next.onclick = () => {
        if (check && (!state.submitted || state.variant === VARIANTS - 1)) return;
        state = { variant: (state.variant + 1) % VARIANTS, draft: '', submitted: false };
        save();
        draw(true);
      };
      if (moveFocus) panel.querySelector('[data-variant]').focus();
    }
    draw();
  }

  if (typeof module === 'object' && module.exports) module.exports = { createSet, intervalText, modelAt, VARIANTS };
  if (typeof document !== 'undefined') {
    mountModel();
    mountExercise('practice');
    mountExercise('check');
    for (const id of ['model-panel', 'practice-panel', 'check-panel']) document.getElementById(id).hidden = false;
  }
})();
