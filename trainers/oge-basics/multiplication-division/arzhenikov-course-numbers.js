/* Models and pupil-written steps for the existing Arzhenikov course engine. */
(() => {
  'use strict';
  const E = window.ArzhenikovCourseEngine;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const decimal = value => String(value).replace('.', ',');
  function fraction(numerator, denominator) {
    const result = el('span', 'course-rational');
    result.setAttribute('role', 'math');
    result.setAttribute('aria-label', numerator + ' / ' + denominator);
    result.append(el('span', 'course-numerator', String(numerator)), el('span', 'course-denominator', String(denominator)));
    return result;
  }
  function strip(parent, numerator, parts, label, variant = '') {
    const figure = el('figure', 'course-number-strip ' + variant);
    const caption = el('figcaption', '', label ? label + ': ' : '');
    caption.append(fraction(numerator, parts)); figure.append(caption);
    const count = Math.max(1, Math.ceil(numerator / parts));
    // One outlined row always represents ONE whole, including improper fractions.
    for (let whole = 0; whole < count; whole++) {
      const row = el('div', 'course-fraction'); row.style.setProperty('--parts', parts);
      row.setAttribute('aria-label', 'Целое ' + (whole + 1) + ': ' + Math.min(parts, Math.max(0, numerator - whole * parts)) + ' из ' + parts + ' частей');
      for (let i = 0; i < parts; i++) {
        const cell = el('span', whole * parts + i < numerator ? 'is-shaded' : '');
        cell.setAttribute('aria-hidden', 'true'); row.append(cell);
      }
      figure.append(row);
    }
    parent.append(figure);
  }
  function draw(model, v, container) {
    const m = model.meta || {};
    if (model.kind === 'division-prefix') {
      container.replaceChildren();
      const value = String(m.dividend), split = Math.max(1, Math.min(v.digits, value.length));
      const prefix = value.slice(0, split), rest = value.slice(split);
      const line = el('div', 'course-prefix-model');
      line.append(el('mark', '', prefix), el('span', '', rest), el('span', '', ' : ' + m.divisor));
      const tooMany = split > 1 && Number(value.slice(0, split - 1)) >= m.divisor;
      const note = Number(prefix) < m.divisor ? 'Этого блока пока мало. Возьми ещё одну цифру справа.'
        : tooMany ? 'Достаточно более короткого блока слева. Уменьши число выбранных цифр.'
        : 'Этот первый блок уже можно делить. Более короткого блока не хватило бы.';
      container.append(line, el('p', 'course-model-description', note)); return true;
    }
    if (model.kind === 'decimal-operation') {
      container.replaceChildren();
      const scale = m.scale || 10;
      const value = count => {
        const sign = count < 0 ? '−' : '', n = Math.abs(count);
        const whole = Math.floor(n / scale), rest = String(n % scale).padStart(Math.round(Math.log10(scale)), '0').replace(/0+$/, '');
        return sign + whole + (rest ? ',' + rest : '');
      };
      const unit = m.unit ? ' ' + m.unit : '';
      function bar(label, count, maximum, cls = '') {
        const row = el('div', 'course-measure-row');
        row.append(el('strong', '', label + ': ' + value(count) + unit));
        const track = el('div', 'course-measure-bar ' + cls);
        const filled = el('span'); filled.style.width = Math.max(0, Math.min(100, 100 * count / Math.max(1, maximum))) + '%';
        track.setAttribute('role', 'img'); track.setAttribute('aria-label', label + ': ' + value(count) + unit);
        track.append(filled); row.append(track); container.append(row);
      }
      if (m.operation === 'add' || m.operation === 'subtract') {
        const subtract = m.operation === 'subtract', result = subtract ? v.left - v.right : v.left + v.right;
        const maximum = Math.max(v.left, v.right, Math.abs(result), scale);
        bar(subtract ? 'Было' : 'Первая часть', v.left, maximum);
        bar(subtract ? 'Отделяем' : 'Присоединяем', v.right, maximum, 'course-measure-second');
        if (result >= 0) bar(subtract ? 'Осталось' : 'Вместе', result, maximum, 'course-measure-result');
        else container.append(el('p', 'course-model-description', 'Отделить столько пока нельзя: исходной величины не хватает.'));
      } else if (m.operation === 'repeat') {
        for (let i = 0; i < v.copies; i++) bar('Одинаковая часть ' + (i + 1), v.size, Math.max(v.size, scale));
        container.append(el('p', 'course-model-description', 'Частей: ' + v.copies + '. В каждой ' + value(v.size) + unit +
          '; вместе ' + value(v.size * v.copies) + unit + '.'));
      } else if (m.operation === 'share') {
        for (let i = 0; i < m.groups; i++) bar('Получатель ' + (i + 1), v.each, Math.max(m.total, scale));
        const rest = m.total - m.groups * v.each;
        container.append(el('p', 'course-model-description', 'Поровну между ' + m.groups + ' получателями. ' +
          (rest >= 0 ? 'Ещё осталось распределить: ' + value(rest) + unit + '.' : 'Раздали лишнее: ' + value(-rest) + unit + '. Уменьши долю каждого.')));
      } else if (m.operation === 'measure') {
        bar('Всего', m.total, Math.max(m.total, scale));
        for (let i = 0; i < v.groups; i++) bar('Отмеренная часть ' + (i + 1), m.size, Math.max(m.total, scale), 'course-measure-second');
        const rest = m.total - v.groups * m.size;
        container.append(el('p', 'course-model-description', 'Мерка: ' + value(m.size) + unit + '. Таких частей: ' + v.groups + '. ' +
          (rest >= 0 ? 'Осталось: ' + value(rest) + unit + '.' : 'Взято лишнее: ' + value(-rest) + unit + '. Убери одну мерку.')));
      }
      container.append(el('p', 'course-model-caption', 'Все полосы в этой модели используют одну мерку. Один шаг управления — 1/' + scale + (m.unit ? ' ' + m.unit : ' целого') + ', кроме счётчика одинаковых частей.'));
      return true;
    }
    if (model.kind === 'fraction-strip') {
      container.replaceChildren();
      strip(container, v.numerator, v.parts, m.label || 'Выделенная часть');
      container.append(el('p', 'course-model-description', 'Один обведённый ряд — одно целое. В каждом целом ' + v.parts + ' равных частей; выделено ' + v.numerator + ' таких частей.'));
      return true;
    }
    if (model.kind === 'fraction-pair') {
      container.replaceChildren();
      strip(container, v.left, v.parts, m.leftLabel || 'Первая величина');
      strip(container, v.right, v.parts, m.rightLabel || 'Вторая величина', 'course-strip-second');
      container.append(el('p', 'course-model-description', 'Целые одинакового размера. Обе полосы разделены на ' + v.parts + ' равных частей в каждом целом. Теперь можно сравнивать и считать одинаковые доли.'));
      return true;
    }
    if (model.kind === 'fraction-area') {
      container.replaceChildren();
      const grid = el('div', 'course-fraction-area');
      grid.style.setProperty('--cols', v.cols); grid.style.setProperty('--rows', v.rows);
      grid.setAttribute('role', 'img');
      grid.setAttribute('aria-label', 'Целое разделено на ' + v.rows + ' рядов и ' + v.cols + ' столбцов. Пересечение содержит ' + v.width * v.height + ' клеток.');
      for (let row = 0; row < v.rows; row++) for (let col = 0; col < v.cols; col++) {
        grid.append(el('span', col < v.width && row < v.height ? 'is-overlap' : col < v.width ? 'is-first' : row < v.height ? 'is-second' : ''));
      }
      container.append(grid, el('p', 'course-model-description',
        'По ширине взяли ' + v.width + '/' + v.cols + ' целого; по высоте — ' + v.height + '/' + v.rows +
        '. Пересечение: ' + v.width * v.height + ' из ' + v.cols * v.rows + ' равных клеток.'));
      return true;
    }
    if (model.kind === 'decimal-place') {
      container.replaceChildren();
      const places = el('div', 'course-decimal-places');
      for (const [key, label, size] of [['whole', 'Целые', '1'], ['tenths', 'Десятые', '1/10'],
        ['hundredths', 'Сотые', '1/100'], ['thousandths', 'Тысячные', '1/1000']]) {
        if (!(key in v)) continue;
        const place = el('div', 'course-place');
        place.append(el('strong', '', label), el('b', '', String(v[key])), el('span', '', '× ' + size)); places.append(place);
      }
      const text = (v.whole || 0) + ',' + (v.tenths || 0) + (v.hundredths || 0) + (v.thousandths || 0);
      container.append(places, el('p', 'course-decimal-value', text + (m.unit ? ' ' + m.unit : '')),
        el('p', 'course-model-description', 'Каждый следующий разряд в десять раз мельче. Ноль сохраняет место отсутствующего разряда.'));
      // A square represents one whole. A hundredth is shown as a cell; the
      // thousandth strip subdivides one such cell instead of suggesting another whole.
      const tenths = el('div', 'course-decimal-tape');
      tenths.setAttribute('aria-label', 'Дробная часть: десятые и сотые в одном целом');
      const count = (v.tenths || 0) * 10 + (v.hundredths || 0);
      for (let i = 0; i < 100; i++) tenths.append(el('span', i < count ? 'is-shaded' : ''));
      container.append(tenths, el('p', 'course-model-caption', 'Квадрат — одно целое; клетка — одна сотая.'));
      if ('thousandths' in v) {
        const tiny = el('div', 'course-decimal-thousandths');
        for (let i = 0; i < 10; i++) tiny.append(el('span', i < v.thousandths ? 'is-shaded' : ''));
        container.append(tiny, el('p', 'course-model-caption', 'Увеличенная одна сотая: в ней 10 тысячных.'));
      }
      return true;
    }
    if (model.kind === 'quotient') {
      container.replaceChildren();
      const product = v.digit * m.divisor, next = (v.digit + 1) * m.divisor;
      const row = el('div', 'course-trial-model');
      row.append(el('strong', '', 'Делим ' + m.partial + ' на ' + m.divisor),
        el('p', '', v.digit + ' × ' + m.divisor + ' = ' + product),
        el('p', '', (v.digit + 1) + ' × ' + m.divisor + ' = ' + next));
      const relation = product > m.partial ? 'Цифра слишком велика: произведение больше неполного делимого.'
        : next <= m.partial ? 'Следующее произведение тоже помещается: попробуй большую цифру.'
        : 'Произведение помещается, а следующее уже больше неполного делимого. Цифра подходит.';
      row.append(el('p', 'course-model-description', relation));
      const ruler = el('div', 'course-multiples');
      for (let i = 0; i <= 9; i++) {
        const cell = el('span', i === v.digit ? 'is-selected' : '');
        cell.append(el('small', '', String(i)), el('strong', '', String(i * m.divisor))); ruler.append(cell);
      }
      container.append(row, ruler); return true;
    }
    return false;
  }
  function writtenBoard(task, draft) {
    const data = task.written;
    if (!data) return null;
    const board = el('section', 'course-written');
    board.setAttribute('aria-label', 'Деление уголком: твои проверенные записи');
    board.append(el('h4', '', 'Твоя запись уголком'));
    const accepted = (task.steps || []).filter(step => draft.steps?.[step.id]?.solved);
    const needsScale = String(data.divisor).includes('.');
    const scaled = !needsScale || accepted.some(step => step.role === 'scale-divisor') &&
      accepted.some(step => step.role === 'scale-dividend');
    const dividend = scaled ? data.normalizedDividend || data.dividend : data.dividend;
    const divisor = scaled ? data.normalizedDivisor || data.divisor : data.divisor;
    const sourceDigits = String(dividend).replace(/[.,]/g, '');
    const endColumn = Math.max(sourceDigits.length - 1, ...accepted.map(step => Number.isInteger(step.column) ? step.column : 0));
    const width = endColumn + 1;
    const paper = el('div', 'course-written-paper'), left = el('div', 'course-written-left'), right = el('div', 'course-written-right');
    const integerPlaces = String(dividend).split(/[.,]/)[0].length;
    const decimalAt = /[.,]/.test(String(dividend)) || width > sourceDigits.length ? integerPlaces : null;
    // One shared grid gives every decimal place the same coordinate. The comma
    // has its own narrow column; accepted appended zeroes extend the dividend.
    const grid = ['1ch'];
    for (let column = 0; column < width; column++) {
      if (column === decimalAt) grid.push('.45ch');
      grid.push('1ch');
    }
    left.style.setProperty('--written-grid', grid.join(' '));
    const gridColumn = column => column + 2 + (decimalAt !== null && column >= decimalAt ? 1 : 0);
    function putDigits(row, value, end, product = false) {
      const characters = String(value).split(''), first = end - characters.length + 1;
      characters.forEach((digit, index) => {
        const column = first + index, cell = el('span', 'course-written-digit', digit);
        cell.dataset.column = String(column); cell.style.gridColumn = String(gridColumn(column));
        if (product && index === 0) cell.prepend(el('span', 'course-written-minus', '−'));
        row.append(cell);
      });
      if (product) {
        const rule = el('span', 'course-written-rule'); rule.setAttribute('aria-hidden', 'true');
        rule.style.gridColumn = gridColumn(first) + ' / ' + (gridColumn(end) + 1);
        row.append(rule);
      }
    }
    const heading = el('div', 'course-written-dividend'), displayedDigits = sourceDigits.padEnd(width, '0');
    putDigits(heading, displayedDigits, endColumn);
    if (decimalAt !== null) {
      const comma = el('span', 'course-written-comma', ','); comma.style.gridColumn = String(decimalAt + 2);
      heading.insertBefore(comma, heading.querySelector('[data-column="' + decimalAt + '"]'));
    }
    const displayedDividend = decimalAt === null ? displayedDigits : displayedDigits.slice(0, decimalAt) + ',' + displayedDigits.slice(decimalAt);
    heading.setAttribute('role', 'img');
    heading.setAttribute('aria-label', 'Делимое ' + displayedDividend + (width > sourceDigits.length ? '. Дописанные нули не меняют величину.' : ''));
    left.append(heading);
    let quotient = '';
    for (const step of accepted) {
      const parsed = E.parseRational(draft.steps[step.id].input);
      const value = parsed?.d === 1 ? String(parsed.n) : draft.steps[step.id].input.trim();
      if (step.role === 'digit') quotient += value;
      if (step.role === 'decimal-point' && !quotient.includes(',')) quotient += ',';
      if (!['product', 'remainder', 'bring'].includes(step.role)) continue;
      const row = el('div', 'course-written-row course-written-' + step.role);
      row.setAttribute('role', 'img');
      row.setAttribute('aria-label', step.label + ': ' + value);
      putDigits(row, value, Number.isInteger(step.column) ? step.column : endColumn, step.role === 'product');
      left.append(row);
    }
    right.append(el('div', 'course-written-divisor', decimal(divisor)), el('div', 'course-written-quotient', quotient || '…'));
    paper.append(left, right); board.append(paper);
    board.append(el('p', 'course-model-caption', 'Здесь появляются только записанные и проверенные тобой шаги.'));
    return board;
  }
  function stepsPanel(task, draft, callbacks) {
    if (!task.steps?.length) return null;
    const block = el('section', 'course-written-steps');
    block.setAttribute('aria-label', 'Промежуточные вычисления');
    const board = writtenBoard(task, draft);
    if (board) block.append(board);
    const solved = task.steps.filter(step => draft.steps[step.id].solved);
    if (solved.length) {
      const history = el('details', 'course-step-history');
      history.append(el('summary', '', 'Проверенные шаги: ' + solved.length + ' из ' + task.steps.length));
      const list = el('ol');
      for (const step of solved) list.append(el('li', '', step.label + ' — ' + decimal(draft.steps[step.id].input)));
      history.append(list); block.append(history);
    }
    const index = task.steps.findIndex(step => !draft.steps[step.id].solved);
    if (index < 0) {
      block.append(el('p', 'course-steps-complete', 'Все промежуточные шаги проверены. Запиши итоговый ответ.')); return block;
    }
    const step = task.steps[index], entry = draft.steps[step.id];
    const form = el('form', 'course-answer-form course-step-form'); form.dataset.courseStep = step.id;
    form.append(el('p', 'course-step-position', 'Шаг ' + (index + 1) + ' из ' + task.steps.length));
    const label = el('label', '', step.label); label.htmlFor = 'course-step-answer';
    const input = el('input'); input.id = 'course-step-answer'; input.type = 'text'; input.autocomplete = 'off';
    input.inputMode = ['fraction', 'mixed', 'comparison'].includes(step.answerFormat) ? 'text' : 'decimal';
    input.maxLength = 40; input.value = entry.input; input.disabled = callbacks.disabled;
    const hint = el('p', 'course-input-format', E.formatHelp(step)); hint.id = 'course-step-format';
    const feedback = el('p', 'course-feedback'); feedback.id = 'course-step-feedback'; feedback.setAttribute('aria-live', 'polite');
    input.setAttribute('aria-describedby', 'course-step-format course-step-feedback');
    input.addEventListener('input', () => { entry.input = input.value; callbacks.save(); input.removeAttribute('aria-invalid'); });
    const submit = el('button', 'course-primary', 'Проверить шаг'); submit.type = 'submit';
    submit.dataset.courseAction = 'check-step'; submit.disabled = callbacks.disabled;
    form.append(label, input, submit, hint, feedback);
    form.addEventListener('submit', event => {
      event.preventDefault(); if (callbacks.disabled) return;
      entry.input = input.value;
      const result = E.assessStep(task, draft, step.id); callbacks.save();
      if (result.kind === 'correct') {
        callbacks.render(false);
        const next = document.getElementById('course-step-answer') || document.getElementById('course-answer');
        next?.focus({preventScroll: false});
        const note = document.getElementById('course-step-feedback') || document.getElementById('course-feedback');
        if (note) { note.textContent = result.message; note.dataset.kind = 'correct'; }
      } else {
        feedback.textContent = result.message; feedback.dataset.kind = result.kind;
        input.setAttribute('aria-invalid', 'true'); input.focus({preventScroll: true});
      }
    });
    const help = el('button', '', 'Подсказка к этому шагу'); help.type = 'button'; help.dataset.courseAction = 'step-hint';
    help.disabled = callbacks.disabled;
    help.addEventListener('click', () => {
      draft.helpUsed = true; entry.hint = true; callbacks.save();
      feedback.textContent = step.hint; feedback.dataset.kind = '';
    });
    form.append(help);
    if (entry.hint) feedback.textContent = step.hint;
    block.append(form); return block;
  }
  window.ArzhenikovCourseNumbers = {draw, stepsPanel, writtenBoard, fraction};
})();
