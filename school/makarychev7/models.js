/* Grade-7 mathematical experiments. No network or learner records. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MakarychevModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', GREEN = '#18725b', ORANGE = '#b56a27';
  let sequence = 0;
  const finite = (...xs) => xs.every(Number.isFinite);
  const clean = v => Object.is(v, -0) ? 0 : v;
  function intervalContains(x, a, b, leftClosed, rightClosed) {
    return finite(x, a, b) && (leftClosed ? x >= a : x > a) && (rightClosed ? x <= b : x < b);
  }
  function linearSolution(a, b, c) {
    if (!finite(a, b, c)) return { type: 'invalid' };
    if (a === 0) return { type: b === c ? 'all' : 'none' };
    return { type: 'one', x: clean((c - b) / a) };
  }
  function functionValue(mode, x, k = 1, b = 0) {
    if (!finite(x, k, b)) return null;
    if (mode === 'linear') return clean(k * x + b);
    if (mode === 'proportional') return clean(k * x);
    if (mode === 'square') return x * x;
    if (mode === 'cube') return clean(x * x * x);
    if (mode === 'piecewise') return x < 0 ? -x : x + 1;
    return null;
  }
  function naturalPower(a, p) { return Number.isFinite(a) && Number.isInteger(p) && p >= 1 && p <= 12 ? clean(a ** p) : null; }
  function primeFactors(n) {
    if (!Number.isSafeInteger(n) || n < 1) return null;
    const factors = [];
    for (let p = 2; p * p <= n; p++) while (n % p === 0) { factors.push(p); n /= p; }
    if (n > 1) factors.push(n);
    return factors;
  }
  function euclideanDivision(a, b) {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || b <= 0) return null;
    const q = Math.floor(a / b); return { q, r: a - b * q };
  }
  function polynomialProduct(a, b, c, d) { return finite(a, b, c, d) ? [clean(a * c), clean(a * d + b * c), clean(b * d)] : null; }
  function binomialCoefficients(p) {
    if (!Number.isInteger(p) || p < 0 || p > 12) return null;
    const row = [1]; for (let k = 1; k <= p; k++) row.push(row[k - 1] * (p - k + 1) / k); return row;
  }
  function binomialValue(a, b, p) {
    const row = binomialCoefficients(p);
    if (!row || !finite(a, b)) return null;
    return row.reduce((sum, c, k) => sum + c * a ** (p - k) * b ** k, 0);
  }
  function solveSystem(a, b, c, d, e, f) {
    if (!finite(a, b, c, d, e, f)) return { type: 'invalid' };
    const firstZero = a === 0 && b === 0, secondZero = d === 0 && e === 0;
    if ((firstZero && c !== 0) || (secondZero && f !== 0)) return { type: 'none' };
    if (firstZero && secondZero) return { type: 'all' };
    if (firstZero || secondZero) return { type: 'line' };
    const determinant = a * e - b * d;
    if (determinant !== 0) return { type: 'one', x: clean((c * e - b * f) / determinant), y: clean((a * f - c * d) / determinant) };
    return { type: a * f === c * d && b * f === c * e ? 'line' : 'none' };
  }
  function halfplaneContains(a, b, c, x, y, sign) {
    if (!finite(a, b, c, x, y)) return false;
    const left = a * x + b * y;
    if (sign === '≤') return left <= c;
    if (sign === '<') return left < c;
    if (sign === '≥') return left >= c;
    if (sign === '>') return left > c;
    return false;
  }
  // The filled polygon includes its geometric edge; dashed boundary denotes strictness.
  function clipHalfplane(points, a, b, c, sign) {
    if (!finite(a, b, c) || !['≤', '<', '≥', '>'].includes(sign)) return [];
    if (a === 0 && b === 0) return halfplaneContains(a, b, c, 0, 0, sign) ? points.map(p => p.slice()) : [];
    const direction = sign === '≤' || sign === '<' ? 1 : -1;
    const value = p => direction * (a * p[0] + b * p[1] - c);
    const result = [];
    for (let i = 0; i < points.length; i++) {
      const from = points[i], to = points[(i + 1) % points.length], u = value(from), v = value(to);
      const inFrom = u <= 0, inTo = v <= 0;
      if (inFrom) result.push(from.slice());
      if (inFrom !== inTo) { const t = u / (u - v); result.push([from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1])]); }
    }
    return result;
  }
  function el(tag, cls, value) { const node = document.createElement(tag); if (cls) node.className = cls; if (value !== undefined) node.textContent = String(value); return node; }
  function svg(tag, attrs = {}) { const node = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v))); return node; }
  function n(v, digits = 3) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(clean(v)); }
  function signed(v) { return (v < 0 ? ' − ' : ' + ') + n(Math.abs(v)); }
  function factor(v) { return v < 0 ? '(' + n(v) + ')' : n(v); }
  function mathText(value) { const span = el('span'), source = String(value); let start = 0; for (const match of source.matchAll(/\^(\d+)/g)) { span.append(document.createTextNode(source.slice(start, match.index)), el('sup', '', match[1])); start = match.index + match[0].length; } span.append(document.createTextNode(source.slice(start))); return span; }
  function frac(top, bottom) { const f = el('span', 'm7-fraction'); f.setAttribute('aria-label', top + ' делить на ' + bottom); f.append(mathText(top), mathText(bottom)); return f; }
  function power(base, p) { const f = el('span', 'm7-nowrap', base); if (p !== 1) f.append(el('sup', '', p)); return f; }
  function eq(...parts) { const box = el('div', 'm7-equation'); parts.forEach(p => box.append(typeof p === 'object' ? p : mathText(p))); return box; }
  function slider(host, label, min, max, value, step, changed) {
    const box = el('div', 'm7-control'), id = 'm7-control-' + (++sequence), lab = el('label', '', label), out = el('output', 'm7-value', n(value)), input = el('input');
    input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value; lab.htmlFor = id; out.setAttribute('for', id);
    input.addEventListener('input', () => { const raw = Number(input.value), v = Math.min(max, Math.max(min, min + Math.round(((Number.isFinite(raw) ? raw : value) - min) / step) * step)); input.value = String(v); out.textContent = n(v); changed(v); });
    box.append(lab, out, input); host.append(box);
    return { input, box, set(v) { input.value = String(v); out.textContent = n(v); } };
  }
  function select(host, label, values, value, changed) {
    const box = el('div', 'm7-control'), id = 'm7-select-' + (++sequence), lab = el('label', '', label), node = el('select');
    node.id = id; lab.htmlFor = id; values.forEach(([v, title]) => { const option = el('option', '', title); option.value = v; node.append(option); }); node.value = value;
    node.addEventListener('change', () => changed(node.value)); box.append(lab, node); host.append(box); return node;
  }
  function button(host, label, changed) { const node = el('button', 'm7-button', label); node.type = 'button'; node.addEventListener('click', changed); host.append(node); return node; }
  function frame(host, title, instruction) {
    host.append(el('p', 'm7-eyebrow', 'Попробуй на модели'), el('h3', 'm7-title', title), el('p', 'm7-instruction', instruction));
    const controls = el('div', 'm7-controls'), visual = el('div', 'm7-visual'), result = el('div', 'm7-result');
    result.setAttribute('aria-live', 'polite'); result.setAttribute('aria-atomic', 'true'); host.append(controls, visual, result); return { controls, visual, result };
  }
  function chart(label, width = 520, height = 380) { return svg('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': label, class: 'm7-chart' }); }
  function text(s, x, y, value, attrs = {}) { const t = svg('text', Object.assign({ x, y, fill: '#203b36', 'text-anchor': 'middle', 'font-size': 17, 'font-family': 'system-ui,sans-serif' }, attrs)); t.textContent = value; s.append(t); return t; }
  function line(s, x1, y1, x2, y2, attrs = {}) { s.append(svg('line', Object.assign({ x1, y1, x2, y2, stroke: '#a4b5a9', 'stroke-width': 1.5 }, attrs))); }
  function dot(s, x, y, color = GREEN, closed = true, radius = 5) { s.append(svg('circle', { cx: x, cy: y, r: radius, fill: closed ? color : '#fffef8', stroke: color, 'stroke-width': 2.5 })); }
  function grid(label, range = 8) {
    const s = chart(label, 520, 440), x = v => 260 + v * 25, y = v => 220 - v * 25;
    for (let i = -range; i <= range; i++) {
      line(s, x(i), y(-range), x(i), y(range), { stroke: '#e1e8df', 'stroke-width': 1 }); line(s, x(-range), y(i), x(range), y(i), { stroke: '#e1e8df', 'stroke-width': 1 });
      if (i && i % 2 === 0) { text(s, x(i), y(0) + 22, i, { 'font-size': 14 }); text(s, x(0) - 12, y(i) + 5, i, { 'text-anchor': 'end', 'font-size': 14 }); }
    }
    line(s, x(-range) - 10, y(0), x(range) + 16, y(0), { stroke: '#738c7e' }); line(s, x(0), y(-range) + 10, x(0), y(range) - 12, { stroke: '#738c7e' });
    text(s, x(range) + 30, y(0) + 5, 'x'); text(s, x(0) + 16, y(range) - 5, 'y'); text(s, x(0) - 12, y(0) + 21, '0', { 'font-size': 14 });
    return { s, x, y, range };
  }
  function plot(g, fn, color = GREEN, spans = [[-8, 8]], dashed = false) {
    for (const [lo, hi] of spans) {
      let d = '', drawing = false;
      for (let i = 0; i <= 400; i++) {
        const x = lo + (hi - lo) * i / 400, y = fn(x);
        if (!Number.isFinite(y) || Math.abs(y) > g.range) { drawing = false; continue; }
        d += (drawing ? ' L ' : ' M ') + g.x(x).toFixed(2) + ' ' + g.y(y).toFixed(2); drawing = true;
      }
      if (d) g.s.append(svg('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-dasharray': dashed ? '7 5' : 'none' }));
    }
  }
  function cards(host, pairs) { const row = el('div', 'm7-cards'); pairs.forEach(([title, value]) => { const card = el('div', 'm7-card'); card.append(el('span', 'm7-note', title), eq(value)); row.append(card); }); host.append(row); }
  function table(headers, rows) {
    const wrap = el('div', 'm7-table-wrap'), t = el('table', 'm7-table'), head = el('thead'), hr = el('tr'), body = el('tbody');
    headers.forEach(v => { const th = el('th', '', v); th.scope = 'col'; hr.append(th); }); head.append(hr);
    rows.forEach(row => { const tr = el('tr'); row.forEach(v => tr.append(el('td', '', v))); body.append(tr); }); t.append(head, body); wrap.append(t); return wrap;
  }
  function numberlineModel(host, lesson) {
    const ui = frame(host, 'Число и его место на прямой', 'Меняй числа. Сравни их положение; затем проверь, входят ли концы в выбранный промежуток.');
    let a = -3, b = 4, x = 1, mode = Number(lesson.order) === 11 ? 'interval' : 'compare', ends = 'closed';
    select(ui.controls, 'Что исследуем', [['compare', 'Сравнение чисел'], ['interval', 'Числовой промежуток']], mode, v => { mode = v; draw(); });
    slider(ui.controls, 'Число a / левая граница', -8, 8, a, 0.5, v => { a = v; draw(); }); slider(ui.controls, 'Число b / правая граница', -8, 8, b, 0.5, v => { b = v; draw(); });
    const sx = slider(ui.controls, 'Проверяем число x', -8, 8, x, 0.5, v => { x = v; draw(); });
    const se = select(ui.controls, 'Включаем концы', [['closed', 'Оба: [a; b]'], ['open', 'Ни один: (a; b)'], ['left', 'Только левый: [a; b)'], ['right', 'Только правый: (a; b]']], ends, v => { ends = v; draw(); });
    function draw() {
      sx.box.hidden = mode !== 'interval'; se.parentElement.hidden = mode !== 'interval';
      const s = chart('Числовая прямая от −8 до 8', 520, 200), X = v => 260 + v * 27, y = 102;
      line(s, 30, y, 490, y, { stroke: '#7f9486', 'stroke-width': 2 });
      for (let i = -8; i <= 8; i++) { line(s, X(i), y - 5, X(i), y + 5); if (i % 2 === 0) text(s, X(i), y + 28, i, { 'font-size': 15 }); }
      if (mode === 'compare') {
        dot(s, X(a), y, GREEN); dot(s, X(b), y, ORANGE); text(s, X(a), y - 24, 'a = ' + n(a), { fill: GREEN }); text(s, X(b), y + 60, 'b = ' + n(b), { fill: ORANGE });
        ui.visual.replaceChildren(s, eq(n(a) + (a < b ? ' < ' : a > b ? ' > ' : ' = ') + n(b)));
        ui.result.textContent = a === b ? 'Одинаковые числа занимают одну точку. Расстояние между ними равно 0.' : 'Большее число находится правее. Расстояние между a и b равно |a − b| = ' + n(Math.abs(a - b)) + '. Модуль числа a — расстояние от a до нуля: ' + n(Math.abs(a)) + '.';
      } else {
        const left = ends === 'closed' || ends === 'left', right = ends === 'closed' || ends === 'right', empty = a > b || (a === b && !(left && right));
        if (!empty) { line(s, X(a), y, X(b), y, { stroke: GREEN, 'stroke-width': 6 }); dot(s, X(a), y, GREEN, left); dot(s, X(b), y, GREEN, right); }
        dot(s, X(x), y - 38, ORANGE); line(s, X(x), y - 31, X(x), y - 8, { stroke: ORANGE, 'stroke-dasharray': '3 4' });
        const inside = intervalContains(x, a, b, left, right), label = (left ? '[' : '(') + n(a) + '; ' + n(b) + (right ? ']' : ')');
        ui.visual.replaceChildren(s, eq('x = ' + n(x), inside ? '∈' : '∉', label));
        ui.result.textContent = empty ? 'Этот промежуток пуст: левая граница больше правой либо равные границы не включены с обеих сторон.' : 'Закрашенная точка включена, пустая — исключена. ' + (inside ? 'Число x удовлетворяет обоим ограничениям.' : 'Число x не удовлетворяет хотя бы одному ограничению.') + (a === b ? ' Получилась единственная точка.' : '');
      }
    }
    draw();
  }
  function expressionModel(host, lesson) {
    const ui = frame(host, 'Порядок действий и раскрытие скобок', 'Меняй числа и сравни две записи. В каждой карточке виден результат отдельного действия.');
    let a = 3, b = 2, x = 4, mode = Number(lesson.order) === 2 ? 'order' : 'distribute';
    select(ui.controls, 'Исследование', [['order', 'Порядок действий'], ['distribute', 'Распределительное свойство'], ['wrong', 'Найти ошибку в раскрытии скобок']], mode, v => { mode = v; draw(); });
    slider(ui.controls, 'Число a', -5, 5, a, 1, v => { a = v; draw(); }); slider(ui.controls, 'Число b', -5, 5, b, 1, v => { b = v; draw(); }); slider(ui.controls, 'Значение x', -5, 5, x, 0.5, v => { x = v; draw(); });
    function draw() {
      ui.visual.replaceChildren();
      if (mode === 'order') {
        ui.visual.append(eq('a + b · x = ' + n(a + b * x), '(a + b) · x = ' + n((a + b) * x)));
        cards(ui.visual, [['Без скобок: сначала b · x', n(b * x)], ['Со скобками: сначала a + b', n(a + b)]]);
        ui.result.textContent = 'В первой записи сначала выполняем умножение, затем сложение. Во второй сначала находим сумму в скобках. Совпадение при отдельных числах не делает эти записи тождественно равными.';
      } else {
        const correct = a * (x + b), other = mode === 'wrong' ? a * x + b : a * x + a * b;
        ui.visual.append(eq('a(x + b) = ' + n(correct), (mode === 'wrong' ? 'ax + b' : 'ax + ab') + ' = ' + n(other)));
        cards(ui.visual, [['Умножаем a на x', n(a * x)], [mode === 'wrong' ? 'Ошибочно оставили b' : 'Умножаем a на b', n(mode === 'wrong' ? b : a * b)]]);
        ui.result.textContent = mode === 'wrong' ? (correct === other ? 'При этих параметрах числа случайно совпали. Измени a и b: одного совпадения недостаточно для тождества.' : 'Значения различны. Число a нужно умножить на каждое слагаемое в скобках, в том числе на b.') : 'Распределительное свойство даёт a(x + b) = ax + ab для любых допустимых значений. Числовая подстановка иллюстрирует правило; само тождество следует из свойства умножения.';
      }
    }
    draw();
  }
  function equationModel(host, lesson) {
    const formula = Number(lesson.order) === 10;
    const ui = frame(host, formula ? 'Выражаем неизвестное из формулы' : 'Одно действие с обеими частями', formula ? 'Начальная запись ax = c соответствует формуле площади: сторона a, неизвестная сторона x и площадь c. Вырази x; затем исследуй более общий вид ax + b = c.' : 'Исследуй ax + b = c. Вычти b из обеих частей, затем раздели обе части на a, если a ≠ 0.');
    let a = formula ? 3 : 2, b = formula ? 0 : 3, c = formula ? 12 : 9, x = 1, stage = 0;
    const update = (key, value) => { if (key === 'a') a = value; if (key === 'b') b = value; if (key === 'c') c = value; stage = 0; draw(); };
    slider(ui.controls, 'Коэффициент a', -4, 4, a, 1, v => update('a', v)); slider(ui.controls, 'Слагаемое b', -8, 8, b, 1, v => update('b', v)); slider(ui.controls, 'Правая часть c', -12, 12, c, 1, v => update('c', v));
    slider(ui.controls, 'Проверяем значение x', -6, 6, x, 0.5, v => { x = v; draw(); });
    const subtract = button(ui.controls, '1. Вычесть b', () => { stage = Math.max(stage, 1); draw(); });
    const divide = button(ui.controls, '2. Разделить на a', () => { if (a !== 0 && stage >= 1) stage = 2; draw(); });
    button(ui.controls, 'Вернуться к началу', () => { stage = 0; draw(); });
    function draw() {
      subtract.disabled = stage >= 1; divide.disabled = a === 0 || stage < 1 || stage >= 2;
      const solution = linearSolution(a, b, c), list = el('ol', 'm7-steps'); list.append(el('li', '', n(a) + 'x' + signed(b) + ' = ' + n(c)));
      if (stage >= 1) list.append(el('li', '', 'Вычли ' + n(b) + ' из обеих частей: ' + n(a) + 'x = ' + n(c - b)));
      if (stage >= 2) { const li = el('li'); li.append('Разделили на ' + n(a) + ': x = ', frac(n(c - b), n(a)), ' ≈ ' + n(solution.x)); list.append(li); }
      ui.visual.replaceChildren(list); cards(ui.visual, [['Левая часть при x = ' + n(x), n(a * x + b)], ['Правая часть', n(c)]]);
      if (solution.type === 'all') ui.result.textContent = 'Получилось верное равенство ' + n(b) + ' = ' + n(c) + ', не зависящее от x. Подходит любое число. Делить на a = 0 нельзя.';
      else if (solution.type === 'none') ui.result.textContent = 'Получилось неверное равенство ' + n(b) + ' = ' + n(c) + ', не зависящее от x. Корней нет. Делить на a = 0 нельзя.';
      else ui.result.textContent = (a * x + b === c ? 'Выбранное x — корень: обе части равны.' : 'Выбранное x не является корнем: части имеют разные значения.') + ' При одинаковом допустимом действии с обеими частями корень сохраняется.';
    }
    draw();
  }
  function functionModel(host, lesson) {
    const ui = frame(host, 'Формула, таблица и график', 'Выбери x. Найди y по формуле и проверь соответствующую точку на графике.');
    let mode = Number(lesson.order) === 15 ? 'proportional' : Number(lesson.order) === 17 ? 'piecewise' : Number(lesson.order) === 23 ? 'square' : 'linear', x = 2, k = 1, b = 1;
    select(ui.controls, 'Функция', [['linear', 'y = kx + b'], ['proportional', 'y = kx'], ['square', 'y = x²'], ['cube', 'y = x³'], ['piecewise', 'Функция из двух частей']], mode, v => { mode = v; draw(); });
    slider(ui.controls, 'Аргумент x', -6, 6, x, 0.5, v => { x = v; draw(); });
    const sk = slider(ui.controls, 'Коэффициент k', -3, 3, k, 0.5, v => { k = v; draw(); }); const sb = slider(ui.controls, 'Число b', -5, 5, b, 1, v => { b = v; draw(); });
    function draw() {
      sk.box.hidden = !['linear', 'proportional'].includes(mode); sb.box.hidden = mode !== 'linear';
      const y = functionValue(mode, x, k, b), g = grid('График выбранной функции');
      let formula = mode === 'linear' ? 'y = ' + n(k) + 'x' + signed(b) : mode === 'proportional' ? 'y = ' + n(k) + 'x' : mode === 'square' ? 'y = x²' : mode === 'cube' ? 'y = x³' : 'x < 0: y = −x; x ≥ 0: y = x + 1';
      if (mode === 'piecewise') { plot(g, v => -v, GREEN, [[-8, 0]]); plot(g, v => v + 1, GREEN, [[0, 8]]); dot(g.s, g.x(0), g.y(0), GREEN, false); dot(g.s, g.x(0), g.y(1), GREEN, true); }
      else plot(g, v => functionValue(mode, v, k, b));
      if (Math.abs(y) <= 8) { line(g.s, g.x(x), g.y(0), g.x(x), g.y(y), { stroke: ORANGE, 'stroke-dasharray': '5 4' }); dot(g.s, g.x(x), g.y(y), ORANGE, true, 6); }
      ui.visual.replaceChildren(eq(formula), g.s, table(['x', 'y'], [-2, -1, 0, 1, 2].map(v => [n(v), n(functionValue(mode, v, k, b))])));
      ui.result.textContent = 'При x = ' + n(x) + ' получаем y = ' + n(y) + '. Точка (' + n(x) + '; ' + n(y) + ') ' + (Math.abs(y) > 8 ? 'лежит за пределами показанного окна.' : 'принадлежит графику.') + (mode === 'piecewise' ? ' При x = 0 берём вторую формулу. Пустой кружок первой ветви не принадлежит графику.' : mode === 'proportional' ? ' График всегда проходит через начало координат, в том числе при k = 0.' : '');
    }
    draw();
  }
  function powerModel(host, lesson) {
    const ui = frame(host, 'Одинаковые множители и степени', 'Меняй основание и показатели. Сравни исходную запись с результатом применения свойства.');
    let a = -2, p = 2, q = 3, mode = [21, 22].includes(Number(lesson.order)) ? 'monomial' : Number(lesson.order) === 19 ? 'multiply' : Number(lesson.order) === 20 ? 'power' : 'definition', c = 2, d = -3;
    select(ui.controls, 'Свойство', [['definition', 'Определение степени'], ['multiply', 'Умножение степеней'], ['divide', 'Деление степеней'], ['power', 'Степень степени'], ['product', 'Степень произведения'], ['monomial', 'Коэффициент и степени одночлена']], mode, v => { mode = v; draw(); });
    const sa = slider(ui.controls, 'Основание a', -3, 3, a, 1, v => { a = v; draw(); }); slider(ui.controls, 'Показатель p', 1, 5, p, 1, v => { p = v; draw(); }); const sq = slider(ui.controls, 'Показатель q', 1, 4, q, 1, v => { q = v; draw(); });
    const sc = slider(ui.controls, 'Число c', -4, 4, c, 1, v => { c = v; draw(); }); const sd = slider(ui.controls, 'Число d', -4, 4, d, 1, v => { d = v; draw(); });
    function draw() {
      sa.box.hidden = mode === 'monomial'; sq.box.hidden = mode === 'definition' || mode === 'product'; sc.box.hidden = !['monomial', 'product'].includes(mode); sd.box.hidden = mode !== 'monomial';
      ui.visual.replaceChildren();
      if (mode === 'definition') { ui.visual.append(eq(power(factor(a), p), '=', Array(p).fill(factor(a)).join(' · '), '=', n(a ** p))); ui.result.textContent = 'Показатель показывает число одинаковых множителей. Отрицательное основание заключаем в скобки. При чётном показателе знак положительный, при нечётном сохраняется знак основания; нуль остаётся нулём.'; }
      else if (mode === 'multiply') { ui.visual.append(eq(power(factor(a), p), '·', power(factor(a), q), '=', power(factor(a), p + q), '=', n(a ** (p + q)))); ui.result.textContent = 'Одинаковое основание сохраняем, показатели складываем: ' + p + ' + ' + q + ' = ' + (p + q) + '.'; }
      else if (mode === 'divide') {
        ui.visual.append(eq(frac(factor(a) + '^' + (p + q), factor(a) + '^' + q), a === 0 ? 'не определено' : '= ' + factor(a) + '^' + p + ' = ' + n(a ** p)));
        ui.result.textContent = a === 0 ? 'Знаменатель равен нулю. Делить на нуль нельзя, правило сокращения здесь не применяется.' : 'Основание отлично от нуля. Из большего показателя вычитаем меньший: ' + (p + q) + ' − ' + q + ' = ' + p + '.';
      } else if (mode === 'power') { ui.visual.append(eq(power('(' + factor(a) + '^' + p + ')', q), '=', power(factor(a), p * q), '=', n(a ** (p * q)))); ui.result.textContent = 'Степень повторяется q раз, поэтому показатель p умножаем на q: ' + p + ' · ' + q + ' = ' + (p * q) + '.'; }
      else if (mode === 'product') { ui.visual.append(eq(power('(' + n(a) + ' · ' + factor(c) + ')', p), '=', power(factor(a), p), '·', power(factor(c), p), '=', n((a * c) ** p))); ui.result.textContent = 'В степень возводим каждый множитель произведения. Складывать степени вместо умножения нельзя.'; }
      else { ui.visual.append(eq(Number(lesson.order) === 21 ? n(c) + ' · x^' + p + ' · ' + factor(d) + ' · y^' + q + ' · x^' + q + ' · y^' + p : '(' + n(c) + 'x^' + p + 'y^' + q + ')(' + n(d) + 'x^' + q + 'y^' + p + ')'), eq('= ' + n(c * d) + 'x^' + (p + q) + 'y^' + (p + q))); cards(ui.visual, [['Коэффициент: c · d', n(c * d)], ['Показатель при x и при y', p + ' + ' + q + ' = ' + (p + q)]]); ui.result.textContent = 'Числовые множители перемножаем отдельно. У каждой буквы складываем только её собственные показатели. Получаем стандартный вид: коэффициент и степени различных букв. Если коэффициент равен нулю, весь одночлен равен нулю.'; }
    }
    draw();
  }
  function divisibilityModel(host, lesson) {
    const ui = frame(host, 'Делители и остаток', 'Измени целые числа. Проверь разложение на простые множители или равенство деления с остатком.');
    let a = 30, b = 7, mode = Number(lesson.order) === 31 ? 'remainder' : 'prime';
    select(ui.controls, 'Исследование', [['prime', 'Простые множители'], ['remainder', 'Деление с остатком']], mode, v => { mode = v; draw(); });
    slider(ui.controls, 'Число a', 1, 100, a, 1, v => { a = v; draw(); }); const sb = slider(ui.controls, 'Делитель b', 1, 12, b, 1, v => { b = v; draw(); });
    function draw() {
      sb.box.hidden = mode === 'prime'; ui.visual.replaceChildren();
      if (mode === 'prime') {
        const factors = primeFactors(a), divisors = []; for (let i = 1; i <= a; i++) if (a % i === 0) divisors.push(i);
        ui.visual.append(eq(a === 1 ? '1' : a + ' = ' + factors.join(' · '))); cards(ui.visual, [['Положительные делители', divisors.join('; ')], ['Число делителей', divisors.length]]);
        ui.result.textContent = a === 1 ? 'Число 1 не является ни простым, ни составным. У него ровно один положительный делитель.' : factors.length === 1 ? 'Число простое: у него ровно два положительных делителя — 1 и само число.' : 'Число составное: кроме 1 и самого числа есть другие положительные делители. Все множители в разложении простые.';
      } else {
        const { q, r } = euclideanDivision(a, b), s = chart('Остаток ' + r + ' меньше делителя ' + b, 520, 180);
        for (let i = 0; i < b; i++) { const cx = 52 + i * 36; dot(s, cx, 70, i < r ? ORANGE : '#b5c5b8', i < r, 10); }
        text(s, 260, 130, r + ' занятых мест из ' + b + ': остаток меньше делителя');
        ui.visual.append(eq(n(a) + ' = ' + n(b) + ' · ' + q + ' + ' + r), s); cards(ui.visual, [['Неполное частное q', q], ['Остаток r', r]]);
        ui.result.textContent = 'Проверка: bq + r = ' + (b * q + r) + '. Всегда 0 ≤ r < b. ' + (r === 0 ? 'Остаток нулевой: a делится на b нацело.' : 'Ещё одной полной группы из b элементов не хватает.');
      }
    }
    draw();
  }
  function polynomialText(coeffs) {
    const terms = [];
    coeffs.forEach((v, i) => { if (!v) return; const degree = coeffs.length - 1 - i, abs = Math.abs(v), body = (degree && abs === 1 ? '' : n(abs)) + (degree === 2 ? 'x²' : degree === 1 ? 'x' : ''); terms.push((terms.length ? v < 0 ? ' − ' : ' + ' : v < 0 ? '−' : '') + body); });
    return terms.join('') || '0';
  }
  function polynomialModel(host, lesson) {
    const order = Number(lesson.order), ui = frame(host, 'Собираем слагаемые по степеням', 'Измени коэффициенты. Умножай каждый член на каждый или объединяй только подобные слагаемые.');
    let a = 2, b = order === 27 ? 0 : 3, c = 1, d = -2, mode = order === 25 || order === 26 ? 'sum' : order === 28 ? 'factor' : order === 30 ? 'group' : 'product';
    select(ui.controls, 'Действие', [['sum', 'Сложение'], ['difference', 'Вычитание'], ['product', 'Умножение'], ['factor', 'Общий множитель'], ['group', 'Группировка']], mode, v => { mode = v; draw(); });
    slider(ui.controls, 'Коэффициент a', -5, 5, a, 1, v => { a = v; draw(); }); slider(ui.controls, 'Число b', -5, 5, b, 1, v => { b = v; draw(); }); const sc = slider(ui.controls, 'Коэффициент c', -5, 5, c, 1, v => { c = v; draw(); }); const sd = slider(ui.controls, 'Число d', -5, 5, d, 1, v => { d = v; draw(); });
    function draw() {
      sc.box.hidden = sd.box.hidden = mode === 'factor';
      const first = polynomialText([a, b]), second = polynomialText([c, d]); ui.visual.replaceChildren();
      if (mode === 'sum' || mode === 'difference') {
        const sign = mode === 'sum' ? 1 : -1, coeffs = [a + sign * c, b + sign * d];
        ui.visual.append(eq('(' + first + ')' + (sign === 1 ? ' + ' : ' − ') + '(' + second + ')'), table(['Слагаемые с x', 'Свободные слагаемые'], [[n(a) + 'x', n(b)], [n(sign * c) + 'x', n(sign * d)], [n(coeffs[0]) + 'x', n(coeffs[1])]]), eq('= ' + polynomialText(coeffs)));
        ui.result.textContent = sign === 1 ? 'Складываем коэффициенты при x отдельно от свободных слагаемых.' : 'Минус перед второй скобкой меняет знак каждого её члена. После этого складываем подобные слагаемые.';
      } else if (mode === 'factor') {
        ui.visual.append(eq(polynomialText([a, a * b]), '=', n(a) + '(x' + signed(b) + ')'));
        cards(ui.visual, [['Первый член', n(a) + ' · x'], ['Второй член', n(a) + ' · ' + factor(b)]]);
        ui.result.textContent = a === 0 ? 'Получилось 0 = 0. Разложение верно, но делить члены на нулевой общий множитель нельзя.' : 'Оба слагаемых содержат множитель ' + n(a) + '. Выносим его за скобки, а в скобках остаётся сумма x' + signed(b) + '.';
      } else {
        const product = polynomialProduct(a, b, c, d);
        ui.visual.append(eq('(' + first + ')(' + second + ')'), table(['×', n(c) + 'x', n(d)], [[n(a) + 'x', n(a * c) + 'x²', n(a * d) + 'x'], [n(b), n(b * c) + 'x', n(b * d)]]), eq('= ' + polynomialText(product)));
        if (mode === 'group') ui.visual.append(eq('= ' + n(a) + 'x(' + second + ') ' + (b < 0 ? '− ' : '+ ') + n(Math.abs(b)) + '(' + second + ')'));
        ui.result.textContent = mode === 'group' ? 'Объедини первые две и последние две клетки. В каждой группе вынеси общий множитель. Затем вынеси одинаковую скобку: остаётся произведение двух двучленов. Строки таблицы показывают именно эту группировку.' : 'В таблице четыре произведения. Два слагаемых с x объединяем, а x² и свободный член оставляем отдельно.';
      }
    }
    draw();
  }
  function identityModel(host, lesson) {
    const order = Number(lesson.order), ui = frame(host, 'Из каких частей получается формула', 'Меняй a и b. Сравни значение целого выражения с суммой его частей.');
    let a = 5, b = 2, p = 4, mode = order === 34 || order === 35 ? 'difference-squares' : order === 36 ? 'cube-sum' : order === 39 ? 'binomial' : 'square-sum';
    select(ui.controls, 'Формула', [['square-sum', 'Квадрат суммы'], ['square-difference', 'Квадрат разности'], ['difference-squares', 'Разность квадратов'], ['cube-sum', 'Сумма кубов'], ['cube-difference', 'Разность кубов'], ['cube-binomial', 'Куб суммы'], ['cube-binomial-difference', 'Куб разности'], ['binomial', 'Степень двучлена']], mode, v => { mode = v; draw(); });
    slider(ui.controls, 'Число a', 1, 8, a, 1, v => { a = v; draw(); }); slider(ui.controls, 'Число b', 0, 6, b, 1, v => { b = v; draw(); }); const sp = slider(ui.controls, 'Показатель n', 1, 6, p, 1, v => { p = v; draw(); });
    function draw() {
      sp.box.hidden = mode !== 'binomial'; ui.visual.replaceChildren();
      if (mode === 'square-sum') {
        const s = chart('Квадрат со стороной a + b разбит на четыре части', 520, 380), scale = 280 / (a + b), A = a * scale, B = b * scale, left = 120, top = 45;
        const regions = [[left, top, A, A, 'a²', '#d5e9d8'], [left + A, top, B, A, 'ab', '#f3e0bc'], [left, top + A, A, B, 'ab', '#f3e0bc'], [left + A, top + A, B, B, 'b²', '#dce9f0']];
        regions.forEach(([x, y, w, h, label, fill]) => { if (!w || !h) return; s.append(svg('rect', { x, y, width: w, height: h, fill, stroke: '#73917d', 'stroke-width': 1.5 })); text(s, x + w / 2, y + h / 2 + 6, label, { 'font-size': 18 }); });
        text(s, left + A / 2, top - 12, 'a = ' + a); if (B) text(s, left + A + B / 2, top - 12, 'b = ' + b); text(s, 260, 355, 'a + b = ' + (a + b));
        ui.visual.append(s, eq('(a + b)² = a² + 2ab + b²'), eq((a + b) ** 2 + ' = ' + a * a + ' + ' + 2 * a * b + ' + ' + b * b));
        ui.result.textContent = 'Два одинаковых прямоугольника дают 2ab. Поэтому квадрат суммы не равен сумме квадратов. Площадная модель использует a > 0 и b ≥ 0; сама формула верна для любых a и b.';
      } else if (mode === 'square-difference') {
        ui.visual.append(eq('(a − b)² = a² − 2ab + b²'), eq((a - b) ** 2 + ' = ' + a * a + ' − ' + 2 * a * b + ' + ' + b * b)); cards(ui.visual, [['Квадрат a', a * a], ['Вычитаем удвоенное произведение', 2 * a * b], ['Прибавляем квадрат b', b * b]]);
        ui.result.textContent = 'Последний член положительный: (−b)² = b². Средний член равен −2ab. Формула верна и при b > a: квадрат отрицательной разности неотрицателен.';
      } else if (mode === 'difference-squares') {
        ui.visual.append(eq('a² − b² = (a − b)(a + b)'), eq(a * a - b * b + ' = ' + factor(a - b) + ' · ' + (a + b))); cards(ui.visual, [['Разность a − b', a - b], ['Сумма a + b', a + b]]);
        ui.result.textContent = 'После раскрытия скобок слагаемые +ab и −ab уничтожаются. Если a = b, произведение равно нулю; если b > a, разность квадратов отрицательна.';
      } else if (mode === 'cube-sum' || mode === 'cube-difference') {
        const plus = mode === 'cube-sum', second = a * a + (plus ? -a * b : a * b) + b * b, first = plus ? a + b : a - b, value = plus ? a ** 3 + b ** 3 : a ** 3 - b ** 3;
        ui.visual.append(eq(plus ? 'a³ + b³ = (a + b)(a² − ab + b²)' : 'a³ − b³ = (a − b)(a² + ab + b²)'), eq(value + ' = ' + factor(first) + ' · ' + second));
        cards(ui.visual, [[plus ? 'Сумма a + b' : 'Разность a − b', first], ['Неполный квадрат', second]]);
        ui.result.textContent = 'Знак перед ab в большой скобке противоположен знаку между кубами. Коэффициент при ab равен 1: это неполный квадрат, а не квадрат суммы или разности.';
      } else {
        const exponent = mode.startsWith('cube-binomial') ? 3 : p, signedB = mode === 'cube-binomial-difference' ? -b : b, row = binomialCoefficients(exponent), terms = row.map((coef, i) => coef * a ** (exponent - i) * signedB ** i), sum = terms.map((v, i) => i ? signed(v) : n(v)).join('');
        ui.visual.append(eq('(a ' + (signedB < 0 ? '−' : '+') + ' b)^' + exponent + ' = ' + (a + signedB) ** exponent), table(['Номер слагаемого', 'Коэффициент', 'Значение'], terms.map((value, i) => [i + 1, row[i], value])), eq(sum + ' = ' + binomialValue(a, signedB, exponent)));
        ui.result.textContent = 'Коэффициенты строки: ' + row.join(', ') + '. Степень a уменьшается от ' + exponent + ' до 0, степень b увеличивается от 0 до ' + exponent + '. В каждом члене сумма показателей равна ' + exponent + '. Для разности подставляем −b вместо b.';
      }
    }
    draw();
  }
  function systemModel(host, lesson) {
    const ui = frame(host, 'Общее решение двух уравнений', 'Меняй наклон и свободный член прямых. Решение системы должно принадлежать обоим графикам.');
    let k = 1, b = 1, m = -1, d = 3, single = Number(lesson.order) <= 41;
    select(ui.controls, 'Показываем', [['one', 'Одно линейное уравнение'], ['two', 'Систему двух уравнений']], single ? 'one' : 'two', v => { single = v === 'one'; draw(); });
    const sk = slider(ui.controls, 'Наклон первой прямой k', -3, 3, k, 0.5, v => { k = v; draw(); }); const sb = slider(ui.controls, 'Свободный член первой b', -5, 5, b, 1, v => { b = v; draw(); });
    const sm = slider(ui.controls, 'Наклон второй прямой m', -3, 3, m, 0.5, v => { m = v; draw(); }); const sd = slider(ui.controls, 'Свободный член второй d', -5, 5, d, 1, v => { d = v; draw(); });
    const parallel = button(ui.controls, 'Параллельные прямые', () => { single = false; m = k; d = b === 5 ? 4 : b + 1; sm.set(m); sd.set(d); ui.controls.querySelector('select').value = 'two'; draw(); });
    const same = button(ui.controls, 'Совпадающие прямые', () => { single = false; m = k; d = b; sm.set(m); sd.set(d); ui.controls.querySelector('select').value = 'two'; draw(); });
    function draw() {
      sm.box.hidden = sd.box.hidden = single; parallel.hidden = same.hidden = single;
      const g = grid(single ? 'Одна прямая' : 'Две прямые системы'), solution = solveSystem(-k, 1, b, -m, 1, d); plot(g, x => k * x + b);
      if (!single) plot(g, x => m * x + d, ORANGE, [[-8, 8]], solution.type === 'line');
      ui.visual.replaceChildren(eq('y = ' + n(k) + 'x' + signed(b)));
      if (!single) ui.visual.append(eq('y = ' + n(m) + 'x' + signed(d)));
      if (!single && solution.type === 'one' && Math.abs(solution.x) <= 8 && Math.abs(solution.y) <= 8) dot(g.s, g.x(solution.x), g.y(solution.y), '#283d88', true, 6);
      ui.visual.append(g.s);
      if (single) { ui.visual.append(table(['x', 'y'], [-2, 0, 2].map(x => [x, n(k * x + b)]))); ui.result.textContent = 'Каждая точка прямой даёт пару (x; y), удовлетворяющую уравнению. Здесь решений бесконечно много. Модель показывает вид y = kx + b. Уравнение x = c задаёт вертикальную прямую и в таком виде не записывается.'; }
      else if (solution.type === 'one') {
        if (Number(lesson.order) === 44) ui.visual.append(eq('(' + n(m) + ' − ' + factor(k) + ')x = ' + n(b) + ' − ' + factor(d)));
        else ui.visual.append(eq(n(k) + 'x' + signed(b) + ' = ' + n(m) + 'x' + signed(d)));
        ui.visual.append(eq('x ≈ ' + n(solution.x), 'y ≈ ' + n(solution.y)));
        ui.result.textContent = 'Прямые пересекаются в единственной точке. ' + (Number(lesson.order) === 44 ? 'Запишем обе строки в виде −kx + y = b и −mx + y = d. Умножим вторую строку на −1 и сложим: y исчезнет.' : 'Подставляем две формулы для y друг в друга. Находим x, затем y.') + (Math.abs(solution.x) > 8 || Math.abs(solution.y) > 8 ? ' Точка пересечения находится за пределами окна графика.' : '') + ' Показанные десятичные значения округлены.';
      } else if (solution.type === 'line') ui.result.textContent = 'Уравнения задают одну и ту же прямую. Каждая её точка удовлетворяет обоим уравнениям: решений бесконечно много. Пунктир второй линии лежит поверх первой.';
      else ui.result.textContent = 'Наклоны равны, свободные члены различны. Прямые параллельны и не имеют общей точки: система не имеет решений.';
    }
    draw();
  }
  function halfplaneModel(host) {
    const ui = frame(host, 'Точка и область решений', 'Проверь пару (x; y) подстановкой. Закраска показывает область, где выполнено неравенство.');
    let a = 1, b = 1, c = 3, x = 1, y = 1, sign = '≤', system = false;
    select(ui.controls, 'Знак', [['≤', '≤'], ['<', '<'], ['≥', '≥'], ['>', '>']], sign, v => { sign = v; draw(); });
    select(ui.controls, 'Условия', [['one', 'Одно неравенство'], ['two', 'Ещё условие y ≥ 0']], 'one', v => { system = v === 'two'; draw(); });
    slider(ui.controls, 'Коэффициент при x', -3, 3, a, 1, v => { a = v; draw(); }); slider(ui.controls, 'Коэффициент при y', -3, 3, b, 1, v => { b = v; draw(); }); slider(ui.controls, 'Правая часть', -6, 6, c, 1, v => { c = v; draw(); });
    slider(ui.controls, 'Координата x точки', -6, 6, x, 0.5, v => { x = v; draw(); }); slider(ui.controls, 'Координата y точки', -6, 6, y, 0.5, v => { y = v; draw(); });
    function draw() {
      const g = grid('Область решений неравенства'), value = a * x + b * y, inside = halfplaneContains(a, b, c, x, y, sign) && (!system || y >= 0);
      let polygon = clipHalfplane([[-8, -8], [8, -8], [8, 8], [-8, 8]], a, b, c, sign);
      if (a === 0 && b === 0 && !halfplaneContains(a, b, c, 0, 0, sign)) polygon = [];
      if (system) polygon = clipHalfplane(polygon, 0, 1, 0, '≥');
      if (polygon.length) { const shape = svg('polygon', { points: polygon.map(p => g.x(p[0]) + ',' + g.y(p[1])).join(' '), fill: '#94c8a3', opacity: 0.32 }); g.s.insertBefore(shape, g.s.firstChild); }
      const strict = sign === '<' || sign === '>';
      if (b !== 0) plot(g, v => (c - a * v) / b, GREEN, [[-8, 8]], strict);
      else if (a !== 0 && Math.abs(c / a) <= 8) line(g.s, g.x(c / a), g.y(-8), g.x(c / a), g.y(8), { stroke: GREEN, 'stroke-width': 3, 'stroke-dasharray': strict ? '7 5' : 'none' });
      if (system) line(g.s, g.x(-8), g.y(0), g.x(8), g.y(0), { stroke: ORANGE, 'stroke-width': 3 });
      dot(g.s, g.x(x), g.y(y), inside ? GREEN : ORANGE, true, 6);
      ui.visual.replaceChildren(eq(n(a) + 'x' + signed(b) + 'y ' + sign + ' ' + n(c), system ? 'и y ≥ 0' : ''), g.s, eq('В точке (' + n(x) + '; ' + n(y) + '): ' + n(value) + ' ' + sign + ' ' + n(c)));
      ui.result.textContent = (inside ? 'Точка входит в область решений.' : 'Точка не входит в область решений.') + (a === 0 && b === 0 ? ' Переменные исчезли: первое условие задаёт всю плоскость либо пустое множество.' : strict ? ' Пунктирная граница исключена: равенство не подходит.' : ' Сплошная граница включена: равенство подходит.') + (system ? ' Для системы должны одновременно выполняться оба условия; закрашено их пересечение.' : '');
    }
    draw();
  }
  const renderers = { numberline: numberlineModel, expression: expressionModel, equation: equationModel, function: functionModel, power: powerModel, divisibility: divisibilityModel, polynomial: polynomialModel, identity: identityModel, system: systemModel, halfplane: halfplaneModel };
  function styles() {
    if (document.getElementById('makarychev7-model-styles')) return;
    const style = el('style'); style.id = 'makarychev7-model-styles';
    style.textContent = '.m7-model{background:#f6faf5;border:1px solid #c7d8c9;border-radius:18px;padding:24px;color:#203b36;font:18px/1.6 system-ui,sans-serif;max-width:100%;box-sizing:border-box}.m7-model *{box-sizing:border-box}.m7-eyebrow{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#397258;margin:0 0 6px}.m7-title{font-size:1.35rem;line-height:1.3;margin:0 0 10px}.m7-instruction{margin:0 0 20px}.m7-controls{display:flex;flex-wrap:wrap;align-items:end;gap:14px 24px}.m7-control{display:grid;grid-template-columns:1fr auto;gap:5px 14px;flex:1 1 190px;max-width:370px}.m7-control label{font-size:16px;font-weight:600}.m7-value{font-weight:700}.m7-control input,.m7-control select{grid-column:1/-1;min-height:46px;width:100%;accent-color:#18725b}.m7-control select{font:inherit;color:inherit;background:white;border:1px solid #9cb7a8;border-radius:9px;padding:8px}.m7-button{font:inherit;color:#21543f;background:white;border:1px solid #9bb6a5;border-radius:10px;padding:10px 14px;min-height:46px;cursor:pointer}.m7-button:disabled{opacity:.5;cursor:default}.m7-control input:focus-visible,.m7-control select:focus-visible,.m7-button:focus-visible{outline:3px solid #b07418;outline-offset:4px}.m7-control[hidden],.m7-button[hidden]{display:none}.m7-visual{margin:22px 0;min-width:0}.m7-chart{display:block;width:100%;max-width:650px;max-height:480px;margin:0 auto}.m7-equation{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;font-size:clamp(20px,3vw,27px);line-height:1.7;margin:18px 0;overflow-wrap:anywhere}.m7-fraction{display:inline-flex;vertical-align:middle;flex-direction:column;text-align:center;line-height:1.25;max-width:100%;font-variant-numeric:tabular-nums}.m7-fraction>span:first-child{padding:2px 5px 4px;border-bottom:2px solid currentColor}.m7-fraction>span:last-child{padding:4px 5px 2px}.m7-result{border-top:1px solid #ccdbcd;padding-top:14px}.m7-note{font-size:16px;color:#4d6958}.m7-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.m7-card{background:#fffef9;border:1px solid #d5e2d2;border-radius:12px;padding:14px;text-align:center;min-width:0;overflow-wrap:anywhere}.m7-card .m7-equation{font-size:21px}.m7-steps{padding-left:28px}.m7-steps li{padding:10px 0}.m7-table-wrap{overflow:auto;margin:18px 0}.m7-table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}.m7-table th,.m7-table td{border:1px solid #c8d9c7;padding:10px;text-align:center}.m7-table th{background:#e6efe4}.m7-nowrap{white-space:nowrap}.m7-model sup{font-size:.72em}@media(max-width:480px){.m7-model{padding:18px 12px;font-size:17px}.m7-controls{gap:12px}.m7-control{flex-basis:100%;max-width:none}.m7-cards{grid-template-columns:1fr}.m7-equation{font-size:20px;gap:8px}.m7-note{font-size:15px}.m7-title{font-size:1.2rem}.m7-table th,.m7-table td{padding:8px 5px}}';
    document.head.append(style);
  }
  function mount(container, lesson) {
    if (!container || !lesson || !renderers[lesson.model]) return () => {};
    styles(); const host = el('section', 'm7-model'); host.setAttribute('aria-label', 'Интерактивная модель: ' + (lesson.title || 'Исследование'));
    container.replaceChildren(host); renderers[lesson.model](host, lesson); return () => host.remove();
  }
  return { mount, modelIds: Object.keys(renderers), math: { intervalContains, linearSolution, functionValue, naturalPower, primeFactors, euclideanDivision, polynomialProduct, binomialCoefficients, binomialValue, solveSystem, halfplaneContains, clipHalfplane } };
});
