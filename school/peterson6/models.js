(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const MODEL_LESSONS = Object.freeze({
    logic: ['p01', 'p02', 'p03', 'p06', 'p07'], variable: ['p04', 'p05'],
    fractions: ['p08'], river: ['p09'], mean: ['p10'], percent: ['p11', 'p12'], growth: ['p13', 'p14']
  });
  const MODEL_FIELDS = Object.freeze({
    logic: ['chosen', 'mode'], variable: ['x'], fractions: ['a', 'b'], river: ['own', 'current'],
    mean: ['piles', 'from', 'to', 'notice'], percent: ['whole', 'p'], growth: ['initial', 'rate', 'years']
  });
  function fields(value, names) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
    const keys = Reflect.ownKeys(value);
    return keys.length === names.length && names.every(key => {
      const property = Object.getOwnPropertyDescriptor(value, key);
      return property && property.enumerable && Object.prototype.hasOwnProperty.call(property, 'value');
    });
  }
  function integers(value, length, min, max) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== length ||
        Reflect.ownKeys(value).length !== length + 1) return false;
    for (let i = 0; i < length; i++) {
      const property = Object.getOwnPropertyDescriptor(value, String(i));
      if (!property || !property.enumerable || !Object.prototype.hasOwnProperty.call(property, 'value') ||
          !Number.isInteger(property.value) || property.value < min || property.value > max) return false;
    }
    return true;
  }
  function stepped(value, min, max, step = 1) {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max &&
      Number.isInteger((value - min) / step);
  }
  function validateBoardState(lesson, value) {
    try {
      const kind = lesson?.model, id = lesson?.id;
      if (!MODEL_LESSONS[kind]?.includes(id) || !fields(value, ['lessonId', 'kind', ...MODEL_FIELDS[kind]]) ||
          value.lessonId !== id || value.kind !== kind) return false;
      if (kind === 'logic') return Array.isArray(value.chosen) && integers(value.chosen, value.chosen.length, 1, 8) && value.chosen.length <= 8 &&
        value.chosen.every((n, index) => !index || value.chosen[index - 1] < n) &&
        (id !== 'p01' || value.chosen.length === 1) &&
        (['p06', 'p07'].includes(id) ? ['all', 'exists'].includes(value.mode) : value.mode === (id === 'p03' ? 'exists' : 'all'));
      if (kind === 'variable') return stepped(value.x, 0, 8);
      if (kind === 'fractions') return stepped(value.a, 0, 5) && stepped(value.b, 0, 4);
      if (kind === 'river') return stepped(value.own, 6, 20) && stepped(value.current, 0, 5, 0.5);
      if (kind === 'mean') return integers(value.piles, 3, 0, 15) && value.piles.reduce((a, b) => a + b, 0) === 15 &&
        stepped(value.from, 0, 2) && stepped(value.to, 0, 2) && ['none', 'same', 'empty'].includes(value.notice);
      if (kind === 'percent') return stepped(value.whole, 20, 400, 20) && stepped(value.p, 0, 200, 5);
      return stepped(value.initial, 100, 2000, 100) && stepped(value.rate, 5, 25, 5) && stepped(value.years, 1, 6);
    } catch (_) { return false; }
  }
  let sequence = 0;
  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, String(v)));
    return n;
  }
  function number(n) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n); }
  function fraction(a, b) {
    const wrap = el('span', 'pm-fraction');
    wrap.setAttribute('aria-label', a + ' делить на ' + b);
    wrap.append(el('span', '', String(a)), el('span', '', String(b)));
    return wrap;
  }
  function output() {
    const n = el('div', 'pm-result');
    n.setAttribute('aria-live', 'polite');
    n.setAttribute('aria-atomic', 'true');
    return n;
  }
  function button(text, handler) {
    const n = el('button', 'pm-button', text);
    n.type = 'button';
    n.addEventListener('click', handler);
    return n;
  }
  function slider(host, label, min, max, value, step, onChange) {
    const box = el('div', 'pm-control');
    const id = 'pm-control-' + (++sequence);
    const lab = el('label', '', label);
    lab.htmlFor = id;
    const val = el('output', 'pm-value', number(value));
    val.setAttribute('for', id);
    const input = el('input');
    input.type = 'range'; input.id = id;
    input.min = min; input.max = max; input.value = value; input.step = step;
    input.addEventListener('input', () => { val.textContent = number(+input.value); onChange(+input.value); });
    box.append(lab, val, input); host.append(box);
    return { input, val, set(v) { input.value = String(v); val.textContent = number(v); } };
  }
  function field(host, label, values, onChange) {
    const box = el('div', 'pm-control');
    const id = 'pm-select-' + (++sequence);
    const lab = el('label', '', label); lab.htmlFor = id;
    const select = el('select'); select.id = id;
    values.forEach((v, i) => { const opt = el('option', '', v); opt.value = String(i); select.append(opt); });
    select.addEventListener('change', () => onChange(+select.value));
    box.append(lab, select); host.append(box);
    return select;
  }
  function chart(label, width, height) {
    const n = svg('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': label, class: 'pm-chart' });
    return n;
  }
  function textSvg(host, x, y, value, opts) {
    const n = svg('text', Object.assign({ x, y, 'text-anchor': 'middle', fill: '#234436', 'font-size': 17, 'font-family': 'system-ui, sans-serif' }, opts || {}));
    n.textContent = value; host.append(n); return n;
  }
  function basics(host, title, instruction) {
    host.append(el('h3', 'pm-title', title), el('p', 'pm-instruction', instruction));
    const controls = el('div', 'pm-controls');
    const visual = el('div', 'pm-visual');
    const result = output();
    host.append(controls, visual, result);
    return { controls, visual, result };
  }
  function logic(host, lesson) {
    const simple = lesson.id === 'p01';
    const modeDefault = lesson.id === 'p03' ? 'exists' : 'all';
    let mode = modeDefault;
    const chosen = new Set(simple ? [4] : [2, 4, 6]);
    const ui = basics(host, simple ? 'Утверждение и его отрицание' : 'Проверь утверждение на своём наборе', simple ? 'Выбери одно число. Проверь, могут ли утверждение и его отрицание быть истинны одновременно.' : 'Нажимай на числа, чтобы включать и исключать их из набора. Попробуй добавить один контрпример.');
    let selector = null;
    if (!simple && (lesson.id === 'p06' || lesson.id === 'p07')) {
      selector = field(ui.controls, 'Какое утверждение проверяем?', ['Все выбранные числа чётные', 'Есть хотя бы одно чётное число'], v => { mode = v === 0 ? 'all' : 'exists'; draw(); });
    }
    const buttons = [];
    for (let i = 1; i <= 8; i++) {
      const b = button(String(i), () => {
        if (simple) { chosen.clear(); chosen.add(i); }
        else if (chosen.has(i)) chosen.delete(i); else chosen.add(i);
        draw();
      });
      b.setAttribute('aria-label', simple ? 'Выбрать число ' + i : 'Число ' + i + ': включить или исключить');
      buttons.push(b); ui.controls.append(b);
    }
    function draw() {
      buttons.forEach((b, i) => { const active = chosen.has(i + 1); b.setAttribute('aria-pressed', String(active)); b.classList.toggle('pm-selected', active); });
      const values = [...chosen].sort((a, b) => a - b);
      ui.visual.replaceChildren(el('p', 'pm-set', '{ ' + values.join('; ') + ' }'));
      if (!values.length) {
        ui.result.textContent = 'Выбери хотя бы одно число: в этой модели исследуем непустые наборы.';
        return;
      }
      const evens = values.filter(v => v % 2 === 0);
      const odds = values.filter(v => v % 2 !== 0);
      let statement, negation, truth, explanation;
      if (simple) {
        statement = values[0] + ' — чётное число.';
        negation = values[0] + ' — нечётное число.';
        truth = evens.length === 1;
        explanation = 'Для целого числа «не чётное» означает «нечётное». Истинно ровно одно из этих двух высказываний.';
      } else if (mode === 'all') {
        statement = 'Все выбранные числа чётные.';
        negation = 'Среди выбранных чисел есть хотя бы одно нечётное.';
        truth = !odds.length;
        explanation = odds.length ? 'Контрпример: ' + odds[0] + '. Одного нечётного числа достаточно, чтобы опровергнуть слово «все».' : 'Проверь каждый элемент: пока нечётных нет. Добавь 3 и посмотри, что изменится.';
      } else {
        statement = 'Среди выбранных чисел есть хотя бы одно чётное.';
        negation = 'Все выбранные числа нечётные.';
        truth = evens.length > 0;
        explanation = evens.length ? 'Свидетель: ' + evens[0] + '. Одного чётного числа достаточно для слова «существует».' : 'Проверены все элементы: ни одного чётного числа нет.';
      }
      ui.result.replaceChildren(el('p', '', 'Утверждение: ' + statement + ' — ' + (truth ? 'верно.' : 'неверно.')), el('p', '', 'Отрицание: ' + negation + ' — ' + (!truth ? 'верно.' : 'неверно.')), el('p', 'pm-note', explanation));
    }
    draw();
    return {
      getState: () => ({ chosen: [...chosen].sort((a, b) => a - b), mode }),
      applyState(value) {
        chosen.clear(); value.chosen.forEach(n => chosen.add(n)); mode = value.mode;
        if (selector) selector.value = mode === 'all' ? '0' : '1';
        draw();
      }
    };
  }
  function variable(host, lesson) {
    const predicate = lesson.id === 'p05';
    const ui = basics(host, predicate ? 'Когда предложение становится верным?' : 'Одна переменная — разные значения', predicate ? 'Меняй x. Найди все целые значения от 0 до 8, при которых 2 · x + 3 < 12.' : 'Меняй x и подставляй его на одно и то же место. Посмотри, как меняется значение выражения 2 · x + 3.');
    let x = 2;
    const control = slider(ui.controls, 'Значение x', 0, 8, x, 1, v => { x = v; draw(); });
    function draw() {
      const formula = el('div', 'pm-equation', '2 · ' + x + ' + 3 = ' + (2 * x + 3));
      const table = el('table', 'pm-table');
      const cap = el('caption', '', predicate ? 'Проверяем целые значения x от 0 до 8' : 'Таблица значений');
      const head = el('thead'); const hr = el('tr');
      ['x', '2 · x + 3', ...(predicate ? ['Меньше 12?'] : [])].forEach(t => { const th = el('th', '', t); th.scope = 'col'; hr.append(th); });
      head.append(hr); const body = el('tbody');
      for (let k = 0; k <= 8; k++) {
        const tr = el('tr', k === x ? 'pm-active-row' : '');
        [String(k), String(2 * k + 3), ...(predicate ? [2 * k + 3 < 12 ? 'Да' : 'Нет'] : [])].forEach(t => tr.append(el('td', '', t)));
        body.append(tr);
      }
      table.append(cap, head, body); ui.visual.replaceChildren(formula, table);
      ui.result.textContent = predicate ? 'При x = ' + x + ': ' + (2 * x + 3) + ' < 12 — ' + (2 * x + 3 < 12 ? 'верно.' : 'неверно.') + ' Здесь проверяем только целые значения из заданного набора.' : 'Сначала умножаем выбранное x на 2, затем прибавляем 3. При увеличении x на 1 значение выражения увеличивается на 2.';
    }
    draw();
    return { getState: () => ({ x }), applyState(value) { x = value.x; control.set(x); draw(); } };
  }
  function fractions(host) {
    const ui = basics(host, 'Доля от доли — умножение', 'Меняй выделенные столбцы и строки. Зелёное пересечение показывает, какую часть целого занимает доля от доли.');
    let a = 2, b = 3;
    const columns = slider(ui.controls, 'Из 5 столбцов выделено', 0, 5, a, 1, v => { a = v; draw(); });
    const rows = slider(ui.controls, 'Из 4 строк выделено', 0, 4, b, 1, v => { b = v; draw(); });
    function draw() {
      const s = chart('Сетка 5 на 4. Пересечение: ' + (a * b) + ' клеток из 20.', 440, 300);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
        const both = col < a && row < b;
        s.append(svg('rect', { x: 54 + col * 65, y: 25 + row * 51, width: 61, height: 47, rx: 5, fill: both ? '#187e59' : col < a ? '#bddbd0' : row < b ? '#f3d28c' : '#f5f4ec', stroke: both ? '#0d563b' : '#aebdb4' }));
        if (both) textSvg(s, 84 + col * 65, 57 + row * 51, '•', { fill: '#fff', 'font-size': 28 });
      }
      textSvg(s, 216, 260, 'Всего 5 · 4 = 20 равных клеток');
      const equation = el('div', 'pm-equation');
      equation.append(fraction(a, 5), document.createTextNode(' · '), fraction(b, 4), document.createTextNode(' = '), fraction(a * b, 20));
      ui.visual.replaceChildren(s, equation);
      ui.result.textContent = 'В пересечении ' + a + ' · ' + b + ' = ' + (a * b) + ' клеток. Числители перемножаем, чтобы узнать число выделенных частей. Знаменатели перемножаем, чтобы узнать число всех равных частей.';
    }
    draw();
    return { getState: () => ({ a, b }), applyState(value) { a = value.a; b = value.b; columns.set(a); rows.set(b); draw(); } };
  }
  function river(host) {
    const ui = basics(host, 'Течение помогает и мешает', 'Измени скорость лодки и течения. Сравни две скорости относительно берега.');
    let own = 10, current = 2;
    const ownControl = slider(ui.controls, 'Собственная скорость лодки, км/ч', 6, 20, own, 1, v => { own = v; draw(); });
    const currentControl = slider(ui.controls, 'Скорость течения, км/ч', 0, 5, current, 0.5, v => { current = v; draw(); });
    function draw() {
      const s = chart('Скорость по течению ' + number(own + current) + ', против течения ' + number(own - current) + ' километров в час.', 590, 242);
      const scale = 16; const start = 65;
      textSvg(s, start, 29, 'По течению: ' + number(own + current) + ' км/ч', { 'text-anchor': 'start' });
      s.append(svg('rect', { x: start, y: 43, width: own * scale, height: 34, fill: '#2e8f73', rx: 4 }));
      if (current) s.append(svg('rect', { x: start + own * scale, y: 43, width: current * scale, height: 34, fill: '#e9b34b', rx: 4 }));
      textSvg(s, start, 115, 'Против течения: ' + number(own - current) + ' км/ч', { 'text-anchor': 'start' });
      s.append(svg('rect', { x: start, y: 129, width: (own - current) * scale, height: 34, fill: '#2e8f73', rx: 4 }));
      if (current) s.append(svg('rect', { x: start + (own - current) * scale, y: 129, width: current * scale, height: 34, fill: '#fff6dd', stroke: '#bd8425', 'stroke-dasharray': '5 4', rx: 4 }));
      textSvg(s, 295, 214, 'Жёлтое: течение прибавили или вычли.', { 'font-size': 16 });
      ui.visual.replaceChildren(s);
      ui.result.replaceChildren(el('p', 'pm-equation', number(own) + ' + ' + number(current) + ' = ' + number(own + current) + ' км/ч'), el('p', 'pm-equation', number(own) + ' − ' + number(current) + ' = ' + number(own - current) + ' км/ч'), el('p', '', 'Разность: ' + number(own + current) + ' − ' + number(own - current) + ' = ' + number(2 * current) + ' = 2 · ' + number(current) + ' км/ч.'), el('p', 'pm-note', 'В одном случае течение прибавили, в другом вычли. Поэтому разность равна двум скоростям течения. Плот плывёт со скоростью самого течения.'));
    }
    draw();
    return { getState: () => ({ own, current }), applyState(value) { own = value.own; current = value.current; ownControl.set(own); currentControl.set(current); draw(); } };
  }
  function mean(host) {
    const ui = basics(host, 'Собрать и распределить поровну', 'Перекладывай по одному кружку между коробками. Следи за суммой и средним: число коробок не меняется.');
    let piles = [2, 8, 5], from = 1, to = 0, noticeKind = 'none';
    const source = field(ui.controls, 'Из какой коробки?', ['Коробка 1', 'Коробка 2', 'Коробка 3'], v => { from = v; }); source.value = '1';
    const destination = field(ui.controls, 'В какую коробку?', ['Коробка 1', 'Коробка 2', 'Коробка 3'], v => { to = v; });
    const notice = el('p', 'pm-note'); notice.setAttribute('aria-live', 'polite');
    function showNotice(kind) {
      noticeKind = kind;
      notice.textContent = kind === 'same' ? 'Выбери две разные коробки.' : kind === 'empty' ? 'Эта коробка пуста. Выбери другую.' : '';
    }
    ui.controls.append(button('Переложить 1 кружок', () => {
      if (from === to) { showNotice('same'); return; }
      if (!piles[from]) { showNotice('empty'); return; }
      piles[from]--; piles[to]++; showNotice('none'); draw();
    }), button('Начать заново', () => { piles = [2, 8, 5]; showNotice('none'); draw(); }), notice);
    function draw() {
      const s = chart('В коробках ' + piles.join(', ') + ' кружков. Всего 15.', 510, 300);
      piles.forEach((amount, i) => {
        s.append(svg('rect', { x: 12 + i * 170, y: 38, width: 150, height: 213, fill: '#f5faf5', stroke: '#9eb3a7', rx: 10 }));
        for (let k = 0; k < amount; k++) s.append(svg('circle', { cx: 41 + i * 170 + (k % 3) * 45, cy: 227 - Math.floor(k / 3) * 39, r: 13, fill: '#25835e' }));
        textSvg(s, 87 + i * 170, 24, 'Коробка ' + (i + 1));
        textSvg(s, 87 + i * 170, 280, String(amount), { 'font-size': 24, 'font-weight': 'bold' });
      });
      ui.visual.replaceChildren(s);
      ui.result.replaceChildren(el('p', 'pm-equation', piles.join(' + ') + ' = 15'), el('p', '', 'Среднее: 15 : 3 = 5 кружков.'), el('p', 'pm-note', piles.every(n => n === 5) ? 'Получилось поровну! В каждой коробке по 5. Сумма осталась 15.' : 'Сумма остаётся 15, среднее остаётся 5. Постарайся получить по 5 в каждой коробке.'));
    }
    draw();
    return {
      getState: () => ({ piles: piles.slice(), from, to, notice: noticeKind }),
      applyState(value) {
        piles = value.piles.slice(); from = value.from; to = value.to;
        source.value = String(from); destination.value = String(to); showNotice(value.notice); draw();
      }
    };
  }
  function percent(host, lesson) {
    let whole = 200, p = lesson.id === 'p12' ? 25 : 35;
    const ui = basics(host, 'Одно целое — 100 процентов', 'Меняй целое и процент. Сравни: процент тот же, а количество может измениться. Процент бывает больше 100.');
    const wholeControl = slider(ui.controls, 'Целое: принято за 100%', 20, 400, whole, 20, v => { whole = v; draw(); });
    const percentControl = slider(ui.controls, 'Сколько процентов?', 0, 200, p, 5, v => { p = v; draw(); });
    function draw() {
      const groups = p > 100 ? 2 : 1;
      const grids = el('div', 'pm-percent-grids');
      for (let g = 0; g < groups; g++) {
        const shaded = Math.min(100, Math.max(0, p - g * 100));
        const s = chart('Квадрат ' + (g + 1) + ': закрашено ' + shaded + ' из 100 клеток. Один квадрат — ' + whole + '.', 340, 348);
        const x0 = 28;
        for (let k = 0; k < 100; k++) s.append(svg('rect', { x: x0 + k % 10 * 26, y: 28 + Math.floor(k / 10) * 26, width: 23, height: 23, rx: 2, fill: k < shaded ? '#27855f' : '#edf0e7', stroke: '#b7c4b9' }));
        textSvg(s, x0 + 128, 318, '100% = ' + whole);
        const card = el('div', 'pm-percent-card'); card.append(s); grids.append(card);
      }
      ui.visual.replaceChildren(grids);
      ui.result.replaceChildren(el('p', 'pm-equation', '1% = ' + whole + ' : 100 = ' + number(whole / 100)), el('p', 'pm-equation', p + '% = ' + number(whole / 100) + ' · ' + p + ' = ' + number(whole * p / 100)), el('p', 'pm-note', p > 100 ? 'Здесь нужно больше одного целого: ' + p + '% — это 100% и ещё ' + (p - 100) + '%.' : 'Каждая клетка — одна сотая выбранного целого. Она равна 1%, а не обязательно одному предмету.'));
    }
    draw();
    return { getState: () => ({ whole, p }), applyState(value) { whole = value.whole; p = value.p; wholeControl.set(whole); percentControl.set(p); draw(); } };
  }
  function growth(host, lesson) {
    const simpleLesson = lesson.id === 'p13';
    let rate = 10, years = 3, initial = 1000;
    const ui = basics(host, simpleLesson ? 'Одна и та же прибавка каждый год' : 'Проценты от нового количества', 'Сравни два правила роста. При простом росте процент считают от начала, при сложном — от результата предыдущего года.');
    const initialControl = slider(ui.controls, 'Начальное количество', 100, 2000, initial, 100, v => { initial = v; draw(); });
    const rateControl = slider(ui.controls, 'Рост за один год, %', 5, 25, rate, 5, v => { rate = v; draw(); });
    const yearsControl = slider(ui.controls, 'Прошло лет', 1, 6, years, 1, v => { years = v; draw(); });
    function draw() {
      const table = el('table', 'pm-table');
      table.append(el('caption', '', 'Сравниваем при одинаковом начале и проценте'));
      const head = el('thead'); const row = el('tr');
      ['Год', 'Простой рост', 'Сложный рост'].forEach(v => { const th = el('th', '', v); th.scope = 'col'; row.append(th); }); head.append(row);
      const body = el('tbody');
      let compound = initial;
      for (let i = 0; i <= years; i++) {
        if (i) compound *= 1 + rate / 100;
        const r = el('tr', i === years ? 'pm-active-row' : '');
        [i, number(initial * (1 + i * rate / 100)), number(compound)].forEach(v => r.append(el('td', '', String(v))));
        body.append(r);
      }
      table.append(head, body); ui.visual.replaceChildren(table);
      const simple = initial * (1 + years * rate / 100);
      ui.result.replaceChildren(el('p', '', 'Простой рост: каждый год прибавляется ' + number(initial * rate / 100) + '. Через ' + years + ' лет: ' + number(simple) + '.'), el('p', '', 'Сложный рост: каждый год умножаем предыдущий результат на ' + number(1 + rate / 100) + '. Через ' + years + ' лет: ' + number(compound) + '.'), el('p', 'pm-note', 'Значения показаны с округлением до сотых; промежуточные вычисления сохраняются без такого округления. При положительном росте со второго года правила дают разные результаты.'));
    }
    draw();
    return { getState: () => ({ initial, rate, years }), applyState(value) { initial = value.initial; rate = value.rate; years = value.years; initialControl.set(initial); rateControl.set(rate); yearsControl.set(years); draw(); } };
  }
  const renderers = { logic, variable, fractions, river, mean, percent, growth };
  function addStyles() {
    if (document.getElementById('peterson-model-styles')) return;
    const style = el('style'); style.id = 'peterson-model-styles';
    style.textContent = `
.pm-model{background:#f6faf5;border:1px solid #c7d8c9;border-radius:18px;padding:22px;color:#234436;font:17px/1.55 system-ui,sans-serif;max-width:100%;box-sizing:border-box}
.pm-model *{box-sizing:border-box}.pm-title{font-size:1.3rem;line-height:1.3;margin:0 0 10px}.pm-instruction{margin:0 0 18px;max-width:60ch}.pm-controls{display:flex;align-items:end;flex-wrap:wrap;gap:14px 20px}.pm-control{display:grid;grid-template-columns:1fr auto;gap:4px 12px;flex:1 1 210px;max-width:360px}.pm-control label{font-weight:600}.pm-control input,.pm-control select{grid-column:1/-1;width:100%;min-height:44px;accent-color:#187e59}.pm-control select{font:inherit;border:1px solid #9cb7a8;border-radius:9px;padding:8px;background:white;color:inherit}.pm-value{font-size:1.15rem;font-weight:700;min-width:3ch;text-align:right}.pm-button{font:inherit;line-height:1.3;min-height:46px;min-width:46px;border:1px solid #9bb6a5;border-radius:10px;padding:10px 14px;background:white;color:#21543f;cursor:pointer}.pm-button:hover{background:#e1eee3}.pm-button.pm-selected{background:#187e59;color:white;border-color:#187e59}.pm-button:focus-visible,.pm-control input:focus-visible,.pm-control select:focus-visible{outline:3px solid #b07418;outline-offset:4px}.pm-visual{margin:18px 0;overflow:auto}.pm-chart{display:block;width:100%;max-width:650px;max-height:380px;margin:0 auto;min-width:260px}.pm-percent-grids{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}.pm-percent-card{flex:1 1 260px;max-width:340px;min-width:0}.pm-set{font-size:2rem;font-weight:700;letter-spacing:.08em;text-align:center}.pm-equation{font-size:clamp(20px,4vw,27px);font-weight:650;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:10px;line-height:1.55;margin:14px 0}.pm-fraction{display:inline-flex;vertical-align:middle;flex-direction:column;align-items:stretch;line-height:1.25;min-width:1.2em;text-align:center;margin:0 3px}.pm-fraction>span:first-child{padding:0 4px 3px;border-bottom:2px solid currentColor}.pm-fraction>span:last-child{padding:3px 4px 0}.pm-result{border-top:1px solid #ccdbcd;padding-top:12px}.pm-result p{margin:8px 0}.pm-note{font-size:.94em;color:#45624e;max-width:70ch}.pm-table{border-collapse:collapse;width:100%;max-width:630px;margin:0 auto;font-variant-numeric:tabular-nums}.pm-table caption{text-align:left;font-size:.92em;padding:0 0 12px}.pm-table td,.pm-table th{padding:9px 12px;border-bottom:1px solid #c7d8c9;text-align:center}.pm-table th{background:#eaf2e8}.pm-active-row{background:#dcefdc;font-weight:700}@media(max-width:480px){.pm-model{padding:16px 12px}.pm-controls{gap:12px}.pm-control{flex-basis:100%;max-width:none}.pm-table td,.pm-table th{padding:8px 5px;font-size:15px}.pm-chart{min-width:240px}.pm-set{font-size:1.6rem}.pm-equation{font-size:21px}.pm-result{font-size:16px}}
`;
    document.head.append(style);
  }
  root.PetersonModels = {
    validateBoardState,
    mount(container, lesson) {
      if (!container || !lesson || !renderers[lesson.model]) return function () {};
      addStyles();
      const host = el('section', 'pm-model');
      host.setAttribute('aria-label', 'Модель: ' + (lesson.title || 'Исследование'));
      container.replaceChildren(host);
      const controller = renderers[lesson.model](host, lesson);
      function cleanup() { host.remove(); }
      cleanup.getBoardState = () => ({ lessonId: lesson.id, kind: lesson.model, ...controller.getState() });
      cleanup.validateBoardState = value => validateBoardState(lesson, value);
      cleanup.applyBoardState = value => {
        if (!validateBoardState(lesson, value)) throw new TypeError('Invalid Peterson model board state');
        controller.applyState(value);
      };
      return cleanup;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
