/* Interactive experiments for Makarychev 8. No network or learner records. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MakarychevModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', GREEN = '#18725b', ORANGE = '#b56a27';
  let sequence = 0;
  function finite(...xs) { return xs.every(Number.isFinite); }
  function quadratic(a, b, c) {
    if (!finite(a, b, c)) return { type: 'invalid', roots: [] };
    if (a === 0) return b === 0 ? { type: c === 0 ? 'all' : 'none', roots: [] } : { type: 'linear', roots: [-c / b] };
    const d = b * b - 4 * a * c;
    if (d < 0) return { type: 'quadratic', d, roots: [] };
    const roots = d === 0 ? [-b / (2 * a)] : [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)].sort((x, y) => x - y);
    return { type: 'quadratic', d, roots };
  }
  function rational(x, a) {
    if (!finite(x, a) || x === a) return { defined: false, value: null };
    return { defined: true, value: (x * x - a * a) / (x - a) || 0, simplified: x + a };
  }
  function rootValue(area) { return Number.isFinite(area) && area >= 0 ? Math.sqrt(area) : null; }
  function scaledInequality(boundary, multiplier, inclusive) {
    if (!finite(boundary, multiplier) || multiplier === 0) return null;
    return { boundary: boundary * multiplier, direction: multiplier > 0 ? 'left' : 'right', sign: multiplier > 0 ? (inclusive ? '≤' : '<') : (inclusive ? '≥' : '>') };
  }
  function scientific(value) {
    if (!Number.isFinite(value) || value === 0) return null;
    let exponent = Math.floor(Math.log10(Math.abs(value)));
    let mantissa = value / Math.pow(10, exponent);
    if (Math.abs(mantissa) >= 10 - 1e-12) { mantissa /= 10; exponent++; }
    return { mantissa, exponent };
  }
  function functionValue(mode, x, k, b, a = 0) {
    if (!finite(x, k, b, a)) return null;
    if (mode === 'linear') return k * x + b;
    if (mode === 'hyperbola') return x === -a ? null : k / (x + a) + b;
    if (mode === 'sqrt') return x < 0 ? null : Math.sqrt(x);
    if (mode === 'square') return x * x;
    if (mode === 'floor') return Math.floor(x);
    if (mode === 'inverse-square') return x === 0 ? null : 1 / (x * x);
    return null;
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function svg(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function n(value, digits = 3) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(Object.is(value, -0) ? 0 : value); }
  function frac(top, bottom) {
    const box = el('span', 'm8-fraction');
    box.setAttribute('aria-label', top + ' делить на ' + bottom);
    box.append(el('span', '', top), el('span', '', bottom));
    return box;
  }
  function exponent(base, power) { const s = el('span', 'm8-nowrap', base); s.append(el('sup', '', power)); return s; }
  function equation(...parts) {
    const box = el('div', 'm8-equation');
    parts.forEach(part => box.append(typeof part === 'object' ? part : el('span', '', part)));
    return box;
  }
  function slider(host, label, min, max, value, step, changed) {
    const box = el('div', 'm8-control'), id = 'm8-control-' + (++sequence), lab = el('label', '', label), out = el('output', 'm8-value', n(value));
    const input = el('input'), numeric = el('input'); input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value;
    numeric.type = 'number'; numeric.min = min; numeric.max = max; numeric.step = step; numeric.value = value; numeric.setAttribute('aria-label', label + ': точное значение');
    lab.htmlFor = id; out.setAttribute('for', id);
    function update(v) { input.value = String(v); numeric.value = input.value; out.textContent = n(Number(input.value)); changed(Number(input.value)); }
    input.addEventListener('input', () => update(Number(input.value)));
    numeric.addEventListener('input', () => { const v = Number(numeric.value); if (numeric.value.trim() && Number.isFinite(v) && v >= min && v <= max && Math.abs((v-min)/step-Math.round((v-min)/step))<1e-8) update(v); });
    numeric.addEventListener('change', () => { numeric.value=input.value; });
    box.append(lab, out, input, numeric); host.append(box);
    return { input, numeric, set(v) { input.value = String(v); numeric.value=input.value; out.textContent = n(Number(input.value)); }, disable(v) { input.disabled=v; numeric.disabled=v; } };
  }
  function select(host, label, values, value, changed) {
    const box = el('div', 'm8-control'), id = 'm8-select-' + (++sequence), lab = el('label', '', label), node = el('select');
    node.id = id; lab.htmlFor = id;
    values.forEach(([v, title]) => { const o = el('option', '', title); o.value = v; node.append(o); });
    node.value = value; node.addEventListener('change', () => changed(node.value));
    box.append(lab, node); host.append(box); return node;
  }
  function button(host, label, changed) { const b = el('button', 'm8-button', label); b.type = 'button'; b.addEventListener('click', changed); host.append(b); return b; }
  function text(host, x, y, value, opts) {
    const t = svg('text', Object.assign({ x, y, fill: '#203b36', 'text-anchor': 'middle', 'font-size': 17, 'font-family': 'system-ui,sans-serif' }, opts || {}));
    t.textContent = value; host.append(t); return t;
  }
  function line(host, x1, y1, x2, y2, opts) { const l = svg('line', Object.assign({ x1, y1, x2, y2, stroke: '#a4b5a9', 'stroke-width': 1.5 }, opts || {})); host.append(l); return l; }
  function circle(host, x, y, r, fill, color) { const c = svg('circle', { cx: x, cy: y, r, fill, stroke: color || GREEN, 'stroke-width': 2 }); host.append(c); return c; }
  function chart(label, width = 520, height = 350) { return svg('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': label, class: 'm8-chart' }); }
  function frame(host, title, instruction) {
    host.append(el('p', 'm8-eyebrow', 'Попробуй на модели'), el('h3', 'm8-title', title), el('p', 'm8-instruction', instruction));
    const controls = el('div', 'm8-controls'), visual = el('div', 'm8-visual'), result = el('div', 'm8-result');
    result.setAttribute('aria-live', 'polite'); result.setAttribute('aria-atomic', 'true');
    host.append(controls, visual, result); return { controls, visual, result };
  }
  function grid(label, range = 8, { yLabelsAtEdge = false } = {}) {
    const s = chart(label, 520, 440), x = v => 260 + v * 25, y = v => 220 - v * 25;
    for (let i = -range; i <= range; i += 2) {
      line(s, x(i), y(-range), x(i), y(range), { stroke: '#e1e8df', 'stroke-width': 1 });
      line(s, x(-range), y(i), x(range), y(i), { stroke: '#e1e8df', 'stroke-width': 1 });
      if (i) { text(s, x(i), y(0) + 22, n(i), { 'font-size': 15 }); text(s, yLabelsAtEdge ? x(-range) - 6 : x(0) - 13, y(i) + 5, n(i), { 'text-anchor': 'end', 'font-size': 15 }); }
    }
    line(s, x(-range) - 12, y(0), x(range) + 15, y(0), { stroke: '#7f9486' });
    line(s, x(0), y(-range) + 12, x(0), y(range) - 15, { stroke: '#7f9486' });
    text(s, x(range) + 26, y(0) + 6, 'x'); text(s, x(0) + 18, y(range) - 10, 'y');
    text(s, x(0) - 12, y(0) + 22, '0', { 'font-size': 15 });
    return { s, x, y, range };
  }
  function plot(g, fn, color = GREEN, intervals) {
    const spans = intervals || [[-g.range, g.range]];
    spans.forEach(([lo, hi]) => {
      let d = '', drawing = false;
      for (let i = 0; i <= 480; i++) {
        const vx = lo + (hi - lo) * i / 480, vy = fn(vx);
        if (vy === null || !Number.isFinite(vy) || Math.abs(vy) > g.range) { drawing = false; continue; }
        d += (drawing ? ' L ' : ' M ') + g.x(vx).toFixed(2) + ' ' + g.y(vy).toFixed(2); drawing = true;
      }
      if (d) g.s.append(svg('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    });
  }
  function rationalModel(host) {
    const ui = frame(host, 'Сокращение сохраняет ограничение', 'Меняй x. Затем выбери значение, которое обращает знаменатель в нуль. Сравни исходную дробь и сокращённую запись.');
    let x = 4, a = 2;
    const sx = slider(ui.controls, 'Значение x', -6, 6, x, 0.5, v => { x = v; draw(); });
    slider(ui.controls, 'Число a', 1, 5, a, 1, v => { a = v; draw(); });
    button(ui.controls, 'Проверить x = a', () => { x = a; sx.set(x); draw(); });
    function draw() {
      const value = rational(x, a), factors = frac('(x − ' + a + ')(x + ' + a + ')', 'x − ' + a);
      ui.visual.replaceChildren(equation(frac('x² − ' + a * a, 'x − ' + a), '=', factors), equation('= x + ' + a, 'только при x ≠ ' + a));
      const values = el('div', 'm8-comparison');
      const left = el('div', 'm8-value-card'), right = el('div', 'm8-value-card');
      left.append(el('p', 'm8-note', 'Исходная дробь'), equation(frac(n(x * x - a * a), n(x - a)), '=', value.defined ? n(value.value) : 'не определена'));
      right.append(el('p', 'm8-note', 'Выражение x + ' + a), equation(n(x) + ' + ' + a + ' = ' + n(x + a)));
      values.append(left, right); ui.visual.append(values);
      ui.result.textContent = value.defined ? 'Знаменатель не равен нулю. Оба выражения дали ' + n(value.value) + '. Сокращаем общий множитель целиком, а не отдельные слагаемые.' : 'При x = ' + a + ' знаменатель равен 0. Исходная дробь не имеет значения. Число ' + n(x + a) + ' из сокращённой записи не устраняет запрет x ≠ ' + a + '.';
    }
    draw();
  }
  function squareEquationModel(host) {
    const ui = frame(host, 'Какие числа в квадрате дают a?', 'Меняй правую часть уравнения. Точка на числовой прямой отмечает каждое подходящее значение x.');
    let a = 16;
    slider(ui.controls, 'Правая часть a', -16, 100, a, 1, value => { a = value; draw(); });
    function draw() {
      const side = rootValue(a);
      const roots = side === null ? [] : side === 0 ? [0] : [-side, side];
      const label = 'Корни уравнения x² = ' + n(a);
      const axis = chart(label, 520, 100), x = value => 260 + 21 * value;
      line(axis, x(-11), 45, x(11), 45);
      for (let tick = -10; tick <= 10; tick += 2) {
        line(axis, x(tick), 40, x(tick), 50);
        text(axis, x(tick), 77, n(tick));
      }
      text(axis, x(11), 32, 'x');
      roots.forEach(value => circle(axis, x(value), 45, 6, GREEN));
      ui.visual.replaceChildren(equation('x² = ' + n(a)), axis);
      if (a < 0) {
        ui.result.textContent = 'Действительных корней нет. Квадрат любого действительного числа больше или равен нулю.';
      } else if (a === 0) {
        ui.result.textContent = 'Один корень: x = 0. Только ноль при возведении в квадрат даёт ноль.';
      } else {
        const exact = Number.isInteger(side);
        const rootsText = exact ? 'x₁ = ' + n(-side) + ', x₂ = ' + n(side) + '.'
          : 'x₁ = −√' + n(a) + ' ≈ ' + n(-side) + ', x₂ = √' + n(a) + ' ≈ ' + n(side) + '.';
        ui.result.replaceChildren(el('p', 'm8-roots', 'Два корня: ' + rootsText),
          el('p', '', 'Два противоположных числа дают один и тот же квадрат. Знак √ обозначает только неотрицательный корень.'));
      }
    }
    draw();
  }
  function rootModel(host, lesson) {
    if (Number(lesson.order) === 12) return squareEquationModel(host);
    const signed = [16, 17, 18].includes(Number(lesson.order));
    const ui = frame(host, signed ? 'Корень из квадрата — модуль' : 'Площадь известна. Найди сторону.', signed ? 'Сдвинь число через нуль. Длина стороны остаётся неотрицательной.' : 'Меняй площадь квадрата. Проследи, как меняются длина стороны и ближайшие целые числа.');
    let value = signed ? -4 : 16;
    slider(ui.controls, signed ? 'Число a' : 'Площадь S', signed ? -10 : 0, signed ? 10 : 100, value, 1, v => { value = v; draw(); });
    function draw() {
      const area = signed ? value * value : value, side = Math.sqrt(area), size = side * 22, s = chart('Квадрат: площадь ' + n(area) + ', сторона ' + n(side), 520, 300);
      const left = 260 - size / 2, top = 140 - size / 2;
      if (size > 0) s.append(svg('rect', { x: left, y: top, width: size, height: size, fill: '#e1eedf', stroke: GREEN, 'stroke-width': 3 }));
      else circle(s, 260, 140, 4, GREEN);
      text(s, 260, 145, 'S = ' + n(area), { 'font-size': 23, 'font-weight': 600 });
      text(s, 260, Math.min(285, top + size + 28), 'Сторона: √' + n(area) + (Number.isInteger(side) ? ' = ' : ' ≈ ') + n(side), { 'font-size': 20 });
      ui.visual.replaceChildren(s, equation(signed ? '√((' + n(value) + ')²) = |' + n(value) + '| = ' + n(side) : '√' + n(area) + (Number.isInteger(side) ? ' = ' : ' ≈ ') + n(side)));
      ui.result.textContent = signed ? (value < 0 ? 'Число a отрицательное, поэтому |a| = −a = ' + n(side) + '. √(a²) не равно a в этом случае.' : 'При a ≥ 0 модуль равен самому числу: |a| = a. Арифметический корень всегда неотрицателен.') : area === 0 ? '√0 = 0. Квадрат со стороной 0 вырождается в точку.' : Number.isInteger(side) ? side + '² = ' + area + ', поэтому √' + area + ' = ' + side + '.' : Math.floor(side) + '² < ' + area + ' < ' + Math.ceil(side) + '². Значит, ' + Math.floor(side) + ' < √' + area + ' < ' + Math.ceil(side) + '. Показанное десятичное значение округлено.';
    }
    draw();
  }
  function quadraticModel(host) {
    const ui = frame(host, 'Сколько корней у уравнения?', 'Меняй коэффициенты. Корни — точки пересечения графика с осью x. Попробуй получить два корня, один корень и ни одного.');
    let a = 1, b = -2, c = -3;
    slider(ui.controls, 'a — при x²', -3, 3, a, 1, v => { a = v; draw(); });
    slider(ui.controls, 'b — при x', -8, 8, b, 1, v => { b = v; draw(); });
    slider(ui.controls, 'c — свободный член', -8, 8, c, 1, v => { c = v; draw(); });
    function draw() {
      const q = quadratic(a, b, c), formula = n(a) + 'x² ' + (b >= 0 ? '+ ' : '− ') + n(Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' : '− ') + n(Math.abs(c));
      const g = grid('График y = ' + formula); plot(g, x => a * x * x + b * x + c);
      q.roots.filter(x => Math.abs(x) <= 8).forEach(x => circle(g.s, g.x(x), g.y(0), 5, ORANGE, ORANGE));
      ui.visual.replaceChildren(equation(formula + ' = 0'), g.s);
      const p = el('p');
      if (q.type === 'quadratic') {
        p.textContent = 'D = b² − 4ac = ' + n(q.d) + '. ' + (q.roots.length === 0 ? 'D < 0: действительных корней нет.' : q.roots.length === 1 ? 'D = 0: один корень.' : 'D > 0: два корня.');
      } else p.textContent = 'a = 0: уравнение уже не квадратное. ' + (q.type === 'linear' ? 'Решаем линейное уравнение.' : q.type === 'all' ? 'Получили 0 = 0: подходит любое действительное число.' : 'Получили неверное равенство: корней нет.');
      ui.result.replaceChildren(p);
      if (q.roots.length) ui.result.append(el('p', 'm8-roots', q.roots.map((x, i) => 'x' + (i ? '₂' : '₁') + (Number.isInteger(x) ? ' = ' : ' ≈ ') + n(x)).join('; ')));
      ui.result.append(el('p', 'm8-note', 'Окно графика: от −8 до 8 по обеим осям. Корни вне этого окна перечислены в ответе; десятичные приближения округлены.'));
    }
    draw();
  }
  function numberRay(label, boundary, direction, inclusive, range) {
    const s = chart(label, 520, 130), left = 45, right = 475, mid = 65, x = v => 260 + v * 215 / range;
    line(s, left, mid, right, mid, { stroke: '#6c8375', 'stroke-width': 2 });
    for (const v of [-range, 0, range]) { line(s, x(v), mid - 5, x(v), mid + 5); text(s, x(v), mid + 29, n(v), { 'font-size': 16 }); }
    const end = x(boundary), other = direction === 'left' ? left : right;
    line(s, end, mid - 13, other, mid - 13, { stroke: GREEN, 'stroke-width': 5 });
    const arrow = direction === 'left' ? [[other + 10, mid - 22], [other, mid - 13], [other + 10, mid - 4]] : [[other - 10, mid - 22], [other, mid - 13], [other - 10, mid - 4]];
    s.append(svg('polyline', { points: arrow.map(p => p.join(',')).join(' '), fill: 'none', stroke: GREEN, 'stroke-width': 3 }));
    line(s, end, mid - 7, end, mid + 5); circle(s, end, mid - 13, 6, inclusive ? GREEN : '#f7faf5');
    text(s, end, mid - 32, n(boundary), { fill: GREEN, 'font-weight': 650 });
    text(s, 42, 22, label, { 'text-anchor': 'start', 'font-size': 16 });
    return s;
  }
  function inequalityModel(host) {
    const ui = frame(host, 'Отрицательный множитель меняет знак', 'Начинаем с x < a. Умножаем обе части на m. На втором луче показано новое число y = m·x.');
    let a = 2, m = -2, inclusive = false;
    slider(ui.controls, 'Граница a', -4, 4, a, 1, v => { a = v; draw(); });
    slider(ui.controls, 'Множитель m', -4, 4, m, 1, v => { m = v; draw(); });
    select(ui.controls, 'Граница включена?', [['no', 'Нет: x < a'], ['yes', 'Да: x ≤ a']], 'no', v => { inclusive = v === 'yes'; draw(); });
    function draw() {
      const r = scaledInequality(a, m, inclusive), sign = inclusive ? '≤' : '<';
      ui.visual.replaceChildren(equation('x ' + sign + ' ' + n(a)), numberRay('Исходные числа x', a, 'left', inclusive, 6));
      if (!r) { ui.visual.append(equation('m = 0')); ui.result.textContent = 'При умножении на 0 все числа превращаются в 0. Такое действие теряет исходное условие: равносильное неравенство так не получаем. Выбери ненулевой множитель.'; return; }
      ui.visual.append(equation('(' + n(m) + ')x ' + r.sign + ' ' + n(r.boundary)), numberRay('Новые числа y = ' + n(m) + 'x', r.boundary, r.direction, inclusive, 20));
      ui.result.textContent = m < 0 ? 'm < 0: знак ' + sign + ' заменяем на ' + r.sign + '. Числа левее границы после умножения оказываются правее новой границы.' : 'm > 0: знак ' + sign + ' сохраняем. Числа левее границы остаются левее новой границы.';
      if (inclusive) ui.result.append(el('p', 'm8-note', 'Закрашенная точка означает, что граничное значение включено.'));
      else ui.result.append(el('p', 'm8-note', 'Пустая точка означает, что граничное значение не включено.'));
    }
    draw();
  }
  function graphModel(host, lesson) {
    const order = Number(lesson.order), systems = order >= 28 && order <= 32;
    let mode = order === 8 || order === 45 ? 'hyperbola' : order === 14 ? 'sqrt' : order === 46 ? 'floor' : 'linear', k = systems ? 1 : 2, b = systems ? 1 : 0, a = 0, point = 2;
    const ui = frame(host, systems ? 'Где встречаются два графика?' : 'Формула превращается в график', systems ? 'Зелёная прямая: y = kx + b. Коричневая: y = −x + 3. Общая точка удовлетворяет обоим уравнениям.' : 'Выбери функцию и двигай точку по оси x. Сравни значение по формуле и положение точки.');
    if (!systems) select(ui.controls, 'Функция', [['linear', 'Линейная: y = kx + b'], ['hyperbola', 'Рациональная: y = k/(x + a) + b'], ['sqrt', 'Корень: y = √x'], ['square', 'Квадрат: y = x²'], ['floor', 'Целая часть: y = [x]']], mode, v => { mode = v; sync(); draw(); });
    const sk = slider(ui.controls, 'Коэффициент k', -4, 4, k, 1, v => { k = v; draw(); });
    const sb = slider(ui.controls, 'Свободный член b', -5, 5, b, 1, v => { b = v; draw(); });
    const sa = !systems ? slider(ui.controls, 'Сдвиг в знаменателе a', -4, 4, a, 0.5, v => { a = v; draw(); }) : null;
    let sp;
    if (!systems) sp = slider(ui.controls, 'Аргумент x', -6, 6, point, 0.5, v => { point = v; draw(); });
    function sync() {
      sk.disable(!systems && !['linear', 'hyperbola'].includes(mode));
      sb.disable(!systems && !['linear', 'hyperbola'].includes(mode));
      if(sa) sa.disable(mode !== 'hyperbola');
    }
    function draw() {
      const g = grid(systems ? 'Графики двух линейных уравнений' : 'График выбранной функции');
      if (systems) {
        plot(g, x => k * x + b); plot(g, x => -x + 3, ORANGE);
        const sameSlope = k === -1;
        ui.visual.replaceChildren(equation('y = ' + n(k) + 'x ' + (b < 0 ? '− ' : '+ ') + n(Math.abs(b))), g.s);
        if (sameSlope) ui.result.textContent = b === 3 ? 'Обе записи задают одну прямую. Общих точек бесконечно много: все точки y = −x + 3.' : 'Прямые параллельны и различны. Общих точек нет, система не имеет решений.';
        else {
          const x = (3 - b) / (k + 1), y = -x + 3;
          if (Math.abs(x) <= 8 && Math.abs(y) <= 8) circle(g.s, g.x(x), g.y(y), 6, ORANGE, '#fff');
          const rounded = Math.abs(x - Number(x.toFixed(3))) > 1e-10 || Math.abs(y - Number(y.toFixed(3))) > 1e-10;
          ui.result.textContent = 'Общая точка: x ' + (rounded ? '≈ ' : '= ') + n(x) + ', y ' + (rounded ? '≈ ' : '= ') + n(y) + '. ' + (rounded ? 'Десятичные значения округлены. ' : 'Подставь эту пару в оба уравнения. ') + (Math.abs(x) > 8 || Math.abs(y) > 8 ? 'Точка находится за пределами показанного окна.' : '');
        }
        return;
      }
      if (mode === 'floor') {
        for (let i = -8; i < 8; i++) { line(g.s, g.x(i), g.y(i), g.x(i + 1), g.y(i), { stroke: GREEN, 'stroke-width': 3 }); circle(g.s, g.x(i), g.y(i), 3.5, GREEN); circle(g.s, g.x(i + 1), g.y(i), 3.5, '#f7faf5'); }
      } else plot(g, x => functionValue(mode, x, k, b, a), GREEN, mode === 'hyperbola' ? [[-8, -a - 0.01], [-a + 0.01, 8]] : mode === 'sqrt' ? [[0, 8]] : undefined);
      const value = functionValue(mode, point, k, b, a);
      const equationNode = mode === 'hyperbola' ? equation('y =', frac(n(k), a === 0 ? 'x' : 'x ' + (a < 0 ? '− ' : '+ ') + n(Math.abs(a))), b === 0 ? '' : (b < 0 ? '− ' : '+ ') + n(Math.abs(b))) : equation(mode === 'linear' ? 'y = ' + n(k) + 'x ' + (b < 0 ? '− ' : '+ ') + n(Math.abs(b)) : mode === 'sqrt' ? 'y = √x' : mode === 'square' ? 'y = x²' : 'y = [x]');
      if (value !== null && Math.abs(value) <= 8) {
        line(g.s, g.x(point), g.y(0), g.x(point), g.y(value), { stroke: ORANGE, 'stroke-dasharray': '5 4' });
        circle(g.s, g.x(point), g.y(value), 5, ORANGE, ORANGE);
      }
      // The zero-coefficient rational function still excludes x = 0.
      if (mode === 'hyperbola' && k === 0) circle(g.s, g.x(-a), g.y(b), 5, '#f7faf5');
      if (mode === 'hyperbola' && k !== 0) {
        line(g.s,g.x(-a),g.y(-8),g.x(-a),g.y(8),{stroke:ORANGE,'stroke-dasharray':'5 5','data-asymptote':'vertical'});
        line(g.s,g.x(-8),g.y(b),g.x(8),g.y(b),{stroke:ORANGE,'stroke-dasharray':'5 5','data-asymptote':'horizontal'});
      }
      ui.visual.replaceChildren(equationNode, g.s);
      const domain = mode === 'hyperbola' ? 'Область определения: x ≠ ' + n(-a) + '.' : mode === 'sqrt' ? 'Область определения: x ≥ 0.' : 'Область определения: все действительные числа.';
      const p = el('p', '', value === null ? 'При x = ' + n(point) + ' значение не определено.' : 'При x = ' + n(point) + ' получаем y ' + (Math.abs(value-Number(value.toFixed(3))) > 1e-10 ? '≈ ' : '= ') + n(value) + '.');
      ui.result.replaceChildren(p, el('p', 'm8-note', domain));
      const table=el('table','m8-value-table'), header=el('tr'); ['x','y'].forEach(v=>header.append(el('th','',v))); table.append(header); table.setAttribute('aria-label','Таблица значений по той же формуле');
      const xs=mode==='hyperbola'?[-a-2,-a-1,-a,-a+1,-a+2]:[-2,-1,0,1,2];
      xs.forEach(x=>{const y=functionValue(mode,x,k,b,a),row=el('tr');row.append(el('td','',n(x)),el('td','',y===null?'не определено':(Math.abs(y-Number(y.toFixed(3)))>1e-10?'≈ ':'')+n(y)));table.append(row);});ui.visual.append(table);

      if (mode === 'hyperbola') ui.result.append(el('p', 'm8-note', k === 0 ? 'При k = 0 получаем y = ' + n(b) + ' при x ≠ ' + n(-a) + '. Выколотая точка сохраняется; вертикальной асимптоты нет.' : 'Асимптоты: x = ' + n(-a) + ' и y = ' + n(b) + '. Ветви не соединены: при x = ' + n(-a) + ' деление невозможно.'));
      if (mode === 'floor') ui.result.append(el('p', 'm8-note', '[x] — наибольшее целое число, не превосходящее x. Например, [−1,5] = −2. Пустой правый конец ступеньки не включён.'));
      if (value !== null && Math.abs(value) > 8) ui.result.append(el('p', 'm8-note', 'Точка находится за пределами показанного окна.'));
    }
    sync(); draw();
  }
  function compareReciprocals(host) {
    const ui = frame(host, 'Два графика при одном x', 'Выбери значение x. Круг отмечает 1/x, квадрат отмечает 1/x². Сравни высоту точек сначала при x = 0,5, затем при x = 2.');
    let power = -1, x = 1;
    select(ui.controls, 'Исследуемая функция', [['-1', 'y = x⁻¹'], ['-2', 'y = x⁻²']], '-1', value => { power = Number(value); draw(); });
    const values = [-2, -1, -0.5, 0, 0.5, 1, 2];
    select(ui.controls, 'Общая абсцисса x', values.map(value => [String(value), n(value)]), String(x), value => { x = Number(value); draw(); });
    function draw() {
      const graph = grid('Графики 1/x и 1/x² на одних осях', 4, { yLabelsAtEdge: true });
      graph.s.setAttribute('viewBox', '125 85 275 270');
      const branches = [[-4, -0.01], [0.01, 4]];
      plot(graph, value => 1 / value, GREEN, branches);
      plot(graph, value => 1 / (value * value), ORANGE, branches);
      graph.s.querySelectorAll('path').forEach(curve => {
        const square = curve.getAttribute('stroke') === ORANGE;
        if (square) curve.setAttribute('stroke-dasharray', '7 4');
        curve.setAttribute('stroke-width', (square ? -2 : -1) === power ? '3' : '1.8');
      });
      ui.visual.replaceChildren(equation('y =', exponent('x', power), '=', frac('1', power === -1 ? 'x' : 'x²')), graph.s);
      if (x === 0) {
        ui.result.textContent = 'При x = 0 обе дроби имеют ноль в знаменателе. Ни у одного графика на этой вертикали нет точки.';
        return;
      }
      const first = 1 / x, second = 1 / (x * x);
      line(graph.s, graph.x(x), graph.y(-4), graph.x(x), graph.y(4), {stroke: '#71837c', 'stroke-dasharray': '3 4'});
      const mark = circle(graph.s, graph.x(x), graph.y(first), 5.5, 'white', GREEN);
      mark.setAttribute('data-reciprocal-value', String(first));
      graph.s.append(svg('rect', {x: graph.x(x) - 3, y: graph.y(second) - 3, width: 6, height: 6, fill: ORANGE, 'data-square-reciprocal-value': second}));
      const relation = first === second ? 'Обе точки совпали.' : first > second ? 'Круг выше квадрата.' : 'Квадрат выше круга.';
      ui.result.textContent = 'При x = ' + n(x) + ' получаем 1/x = ' + n(first) + ' и 1/x² = ' + n(second) + '. ' + relation;
    }
    draw();
  }
  function powerModel(host, lesson) {
    if (Number(lesson.order) === 51) return compareReciprocals(host);
    const scientificMode = Number(lesson.order) === 49 || Number(lesson.order) === 50;
    const ui = frame(host, scientificMode ? 'Стандартный вид числа' : 'Отрицательная степень — обратное число', scientificMode ? 'Меняй показатель 10. Мантисса остаётся от 1 до 10, а запятая сдвигается.' : 'Меняй целый показатель. Проследи переход через нуль и объясни, почему отрицательный показатель даёт дробь.');
    let a = scientificMode ? 3.2 : 2, power = scientificMode ? 4 : -2;
    slider(ui.controls, scientificMode ? 'Мантисса a' : 'Основание a', scientificMode ? 1 : 2, scientificMode ? 9.9 : 5, a, scientificMode ? 0.1 : 1, v => { a = v; draw(); });
    slider(ui.controls, 'Целый показатель n', -6, 6, power, 1, v => { power = v; draw(); });
    function draw() {
      const value = scientificMode ? a * Math.pow(10, power) : Math.pow(a, power);
      if (scientificMode) {
        ui.visual.replaceChildren(equation(n(a, 1), '×', exponent('10', power), '=', n(value, 8)));
        const positions = el('div', 'm8-place-value');
        for (let i = -3; i <= 3; i++) { const item = el('div', 'm8-place'); if (i === power) item.classList.add('m8-current'); item.append(exponent('10', i)); positions.append(item); }
        ui.visual.append(positions);
        ui.result.textContent = '1 ≤ a < 10: запись ' + n(a, 1) + ' × 10ⁿ является стандартным видом положительного числа. ' + (power > 0 ? 'Положительный показатель сдвигает запятую вправо на ' + power + '.' : power < 0 ? 'Отрицательный показатель сдвигает запятую влево на ' + Math.abs(power) + '.' : '10⁰ = 1: число остаётся равным мантиссе.');
      } else {
        const expr = power < 0 ? frac('1', String(Math.pow(a, -power))) : n(value, 8);
        ui.visual.replaceChildren(equation(exponent(String(a), power), '=', expr), equation('Десятичное значение ' + (Number.isInteger(value * 100000000) ? '= ' : '≈ ') + n(value, 8)));
        const strip = el('div', 'm8-place-value');
        for (let i = -2; i <= 2; i++) { const item = el('div', 'm8-place'); if (i === power) item.classList.add('m8-current'); item.append(exponent(String(a), i), i < 0 ? frac('1', String(Math.pow(a, -i))) : el('span', '', n(Math.pow(a, i)))); strip.append(item); }
        ui.visual.append(strip);
        ui.result.textContent = power === 0 ? 'Для любого ненулевого a: a⁰ = 1. Это согласуется с делением соседних степеней на a.' : power < 0 ? 'Знак минус в показателе означает переход к обратному числу, а не отрицательный результат. Основание не должно быть равно нулю.' : 'При положительном целом показателе перемножаем ' + power + ' одинаковых множителей, равных ' + a + '. При уменьшении показателя на 1 значение делится на ' + a + '.';
      }
    }
    draw();
  }
  const renderers = { rational: rationalModel, root: rootModel, quadratic: quadraticModel, inequalities: inequalityModel, graph: graphModel, power: powerModel };
  function styles() {
    if (document.getElementById('makarychev8-model-styles')) return;
    const style = el('style'); style.id = 'makarychev8-model-styles';
    style.textContent = '.m8-model [hidden]{display:none!important}.m8-question{display:block;font-weight:600;margin:12px 0}.m8-question select{display:block;width:100%;max-width:100%;font:inherit;white-space:normal;min-height:48px}.m8-reflection{border-top:1px solid #ccdbcd;margin-top:20px;padding-top:10px}.m8-value-table{width:100%;max-width:360px;margin:12px auto;border-collapse:collapse}.m8-value-table th,.m8-value-table td{padding:5px;border-bottom:1px solid #ccdbcd;text-align:center}.m8-control input[type=number]{width:100%;font:inherit} .m8-model{background:#f6faf5;border:1px solid #c7d8c9;border-radius:18px;padding:24px;color:#203b36;font:18px/1.6 system-ui,sans-serif;max-width:100%;box-sizing:border-box}.m8-model *{box-sizing:border-box}.m8-eyebrow{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#397258;margin:0 0 6px}.m8-title{font-size:1.35rem;line-height:1.3;margin:0 0 10px}.m8-instruction{margin:0 0 20px;max-width:70ch}.m8-controls{display:flex;flex-wrap:wrap;align-items:end;gap:14px 24px}.m8-control{display:grid;grid-template-columns:1fr auto;gap:5px 14px;flex:1 1 190px;max-width:370px}.m8-control label{font-size:16px;font-weight:600}.m8-value{font-weight:700}.m8-control input,.m8-control select{grid-column:1/-1;min-height:46px;width:100%;accent-color:#18725b}.m8-control select{font:inherit;color:inherit;background:white;border:1px solid #9cb7a8;border-radius:9px;padding:8px}.m8-button{font:inherit;color:#21543f;background:white;border:1px solid #9bb6a5;border-radius:10px;padding:10px 14px;min-height:46px;cursor:pointer}.m8-control input:focus-visible,.m8-control select:focus-visible,.m8-button:focus-visible{outline:3px solid #b07418;outline-offset:4px}.m8-control input:disabled{opacity:.35}.m8-visual{margin:22px 0;min-width:0}.m8-chart{display:block;width:100%;max-width:650px;max-height:430px;margin:0 auto;overflow:visible}.m8-equation{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;font-size:clamp(20px,3vw,29px);line-height:1.7;margin:18px 0}.m8-fraction{display:inline-flex;vertical-align:middle;flex-direction:column;text-align:center;line-height:1.25;max-width:100%;font-variant-numeric:tabular-nums}.m8-fraction>span:first-child{padding:2px 5px 4px;border-bottom:2px solid currentColor}.m8-fraction>span:last-child{padding:4px 5px 2px}.m8-result{border-top:1px solid #ccdbcd;padding-top:14px}.m8-result p{margin:8px 0}.m8-note{font-size:16px;color:#4d6958}.m8-roots{font-weight:700;font-size:1.18rem}.m8-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.m8-value-card{background:#fffef9;border:1px solid #d5e2d2;border-radius:12px;padding:14px;text-align:center;min-width:0}.m8-value-card .m8-equation{font-size:21px}.m8-place-value{display:flex;flex-wrap:wrap;justify-content:center;gap:9px}.m8-place{min-width:70px;border:1px solid #c8d9c7;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;background:white}.m8-current{background:#dcefdc;border-color:#18725b}.m8-nowrap{white-space:nowrap}.m8-model sup{font-size:.72em}@media(max-width:480px){.m8-model{padding:18px 12px;font-size:17px}.m8-controls{gap:12px}.m8-control{flex-basis:100%;max-width:none}.m8-comparison{grid-template-columns:1fr}.m8-equation{font-size:21px;gap:8px}.m8-note{font-size:15px}.m8-title{font-size:1.2rem}}';
    document.head.append(style);
  }
  function experiment(lesson) {
    const order=Number(lesson.order);
    if(lesson.model==='rational')return { question:'После сокращения (x² − a²)/(x − a) можно подставить x = a?', options:['Можно: осталось x + a.','Нельзя: исходный знаменатель равен нулю.'], answer:1, challenge:'Выбери a, затем нажми «Проверить x = a». Сравни две записи.', explanation:'Почему запрет сохраняется?', choices:['Мы сравниваем значения исходного выражения; при x = a его нет.','Сокращение определяет дробь в любой точке.'], correct:0, goal:v=>Number(v[0])===Number(v[1])};
    if(lesson.model==='root'&&[16,17,18].includes(order))return {question:'При a < 0 чему равно √(a²)?',options:['a','−a'],answer:1,challenge:'Введи отрицательное a, отличное от начального. Сравни число и сторону квадрата.',explanation:'Почему результат не отрицательный?',choices:['Арифметический корень равен |a|, а длина неотрицательна.','Возведение в квадрат сохраняет знак a.'],correct:0,goal:v=>Number(v[0])<0};
    if (lesson.model === 'root' && order === 12) return {
      question: 'Если положительное a в уравнении x² = a увеличить в 4 раза, как изменится положительный корень?',
      options: ['Увеличится в 2 раза.', 'Увеличится в 4 раза.'], answer: 0,
      challenge: 'Сравни положительные корни при a = 4 и a = 16. Можно также проверить, сколько корней останется при нуле и при отрицательном a.',
      explanation: 'Как найти положительный корень уравнения x² = a при a > 0?',
      choices: ['Взять арифметический квадратный корень из a.', 'Разделить a пополам.'], correct: 0,
      goal: v => [4, 16].includes(Number(v[0]))
    };
    if(lesson.model==='root')return {question:'Если площадь увеличить в 4 раза, как изменится сторона квадрата?',options:['Увеличится в 2 раза.','Увеличится в 4 раза.'],answer:0,challenge:'Сравни площади 4 и 16. Запиши наблюдение о сторонах.',explanation:'Как объяснить найденную связь?',choices:['Сторона равна квадратному корню из площади.','Сторона равна половине площади.'],correct:0,goal:v=>[4,16].includes(Number(v[0]))};
    if(lesson.model==='quadratic')return {question:'При a = 0 уравнение ax² + bx + c = 0 всегда имеет два корня?',options:['Да.','Нет: нужно исследовать bx + c = 0.'],answer:1,challenge:'Поставь a = 0. Затем меняй b и c; проверь один корень, отсутствие корней и тождество.',explanation:'Почему формула с делением на 2a здесь не подходит?',choices:['Нельзя делить на 0; это уже не квадратное уравнение.','Любое уравнение без x² не имеет корней.'],correct:0,goal:v=>Number(v[0])===0};
    if(lesson.model==='inequalities')return {question:'Можно ли умножить неравенство на 0 и получить равносильное?',options:['Можно.','Нельзя: разные числа станут одинаковыми.'],answer:1,challenge:'Поставь m = 0, затем сравни положительный и отрицательный множители.',explanation:'При отрицательном множителе…',choices:['направление неравенства меняется.','направление неравенства сохраняется.'],correct:0,goal:v=>Number(v[1])<0};
    if(lesson.model==='graph'&&order>=28&&order<=32)return {question:'У двух прямых с одинаковым наклоном всегда нет общих точек?',options:['Да.','Нет: они могут совпасть.'],answer:1,challenge:'Поставь k = −1. Сравни b = 3 и другое b.',explanation:'Что означает совпадение прямых?',choices:['Каждая точка прямой решает оба уравнения.','Общих решений нет.'],correct:0,goal:v=>Number(v[0])===-1&&Number(v[1])===3};
    if(lesson.model==='graph'&&order===14)return {question:'Есть ли у y = √x значение при x = −1?',options:['Нет.','Да, y = −1.'],answer:0,challenge:'Поставь x = −1 и x = 0. Сравни график и таблицу.',explanation:'Какое ограничение требуется?',choices:['x ≥ 0','x ≠ 0'],correct:0,goal:v=>v[0]==='sqrt'&&Number(v[4])<0};
    if(lesson.model==='graph'&&order===46)return {question:'Чему равна целая часть числа −1,5?',options:['−2','−1'],answer:0,challenge:'Введи x = −1,5 и сравни ближайшие целые числа.',explanation:'[x] — это…',choices:['наибольшее целое, не превосходящее x.','число без дробных цифр.'],correct:0,goal:v=>v[0]==='floor'&&Number(v[4])===-1.5};
    if(lesson.model==='graph')return {question:'При k = 0 в y = k/(x + a) + b исчезает запрет x = −a?',options:['Исчезает.','Остаётся.'],answer:1,challenge:'Выбери рациональную функцию. Поставь k = 0 и изменяй a и b. Найди выколотую точку.',explanation:'Чем становится график при k = 0?',choices:['Прямой y = b без точки (−a; b), без вертикальной асимптоты.','Полной прямой y = b.'],correct:0,goal:v=>v[0]==='hyperbola'&&Number(v[1])===0};
    if(order===51)return {question:'Может ли x⁻² быть отрицательным?',options:['Нет.','Да, при x < 0.'],answer:0,challenge:'Выдели x⁻² и поставь отрицательное x. Сравни знаки значений у круга и квадрата. Почему квадрат остаётся выше оси x?',explanation:'Почему значения положительные?',choices:['1/x² > 0 для любого x ≠ 0.','Отрицательный показатель даёт отрицательное число.'],correct:0,goal:v=>v[0]==='-2'&&Number(v[1])<0};
    if(order===49||order===50)return {question:'Если показатель 10 уменьшить на 1, число…',options:['уменьшится в 10 раз.','уменьшится на 10.'],answer:0,challenge:'Измени показатель на соседнее целое. Сравни числа при той же мантиссе.',explanation:'Как связаны соседние значения?',choices:['Каждый шаг показателя означает умножение или деление на 10.','Каждый шаг означает прибавление или вычитание 10.'],correct:0,goal:()=>true};
    return {question:'Знак минус в показателе a⁻² означает отрицательный результат?',options:['Да.','Нет: это 1/a² при a ≠ 0.'],answer:1,challenge:'Поставь n = 0, затем n = −1 и n = −2. Сравни соседние степени.',explanation:'При уменьшении целого показателя на 1 значение…',choices:['делится на основание a.','уменьшается на a.'],correct:0,goal:v=>Number(v[1])<0};
  }
  function mount(container, lesson, options) {
    if (!container || !lesson || !renderers[lesson.model]) return () => {};
    styles(); options=options||{};
    const record=options.state||{}, spec=experiment(lesson), host=el('section','m8-model'), before=el('div','m8-prediction'), body=el('div'), after=el('div','m8-reflection');
    host.setAttribute('aria-label','Интерактивная модель: '+(lesson.title||'Исследование')); container.replaceChildren(host);host.append(before,body,after);
    const controls=()=>Array.from(body.querySelectorAll('.m8-controls input[type=range],.m8-controls select'));
    let mounted=false;
    function ensureBody(){if(mounted)return;mounted=true;renderers[lesson.model](body,lesson);
    if(Array.isArray(record.parameters))controls().forEach((node,i)=>{const value=record.parameters[i];if(typeof value!=='string')return;if(node.tagName==='SELECT'){if(!Array.from(node.options).some(o=>o.value===value))return;node.value=value;node.dispatchEvent(new Event('change'));}else{const v=Number(value);if(!Number.isFinite(v)||v<Number(node.min)||v>Number(node.max)||Math.abs((v-Number(node.min))/Number(node.step)-Math.round((v-Number(node.min))/Number(node.step)))>1e-8)return;node.value=value;node.dispatchEvent(new Event('input'));}});
    }
    if(record.started)ensureBody();
    function save(){if(options.onChange)options.onChange(record);}
    function values(){return controls().map(node=>node.value);}
    function choose(parent,label,items,current){const box=el('label','m8-question',label),node=el('select');node.append(new Option('Выбери ответ',''));items.forEach((text,i)=>node.append(new Option(text,String(i))));node.value=Number.isInteger(current)?String(current):'';box.append(node);parent.append(box);return node;}
    before.append(el('p','m8-eyebrow','Прогноз → опыт → объяснение'));
    const prediction=choose(before,spec.question,spec.options,record.prediction),status=el('p','m8-note');status.setAttribute('role','status');
    const start=button(before,'Сохранить прогноз и исследовать',()=>{if(prediction.value===''){status.textContent='Сначала выбери своё предположение.';return;}record.prediction=Number(prediction.value);record.started=true;ensureBody();body.hidden=false;after.hidden=false;prediction.disabled=true;start.hidden=true;status.textContent='Прогноз записан. '+spec.challenge;save();});before.append(status);
    after.append(el('p','m8-instruction',spec.challenge));
    const explanation=choose(after,spec.explanation,spec.choices,record.explanation),feedback=el('p','m8-note');feedback.setAttribute('role','status');
    button(after,'Проверить объяснение',()=>{if(!record.changed||!spec.goal(values())){feedback.textContent='Сначала выполни опыт: '+spec.challenge;return;}if(explanation.value===''){feedback.textContent='Выбери объяснение наблюдения.';return;}record.explanation=Number(explanation.value);record.explanationAttempts=Math.min(1000,(record.explanationAttempts||0)+1);record.explained=record.explanation===spec.correct;feedback.textContent=record.explained?(record.prediction===spec.answer?'Прогноз подтвердился. ':'Прогноз уточнён. ')+'Объяснение верно. Теперь реши новое условие самостоятельно.':'Сравни объяснение с моделью и попробуй ещё раз.';save();});after.append(feedback);
    function changed(){record.parameters=values();record.changed=true;record.observation=(body.querySelector('.m8-result')?.textContent||'').slice(0,2000);record.explained=false;feedback.textContent='Модель изменилась. Сравни с прогнозом и объясни результат.';save();}
    body.addEventListener('input',event=>{if(event.target.type==='number'&&event.target.value!==event.target.parentElement.querySelector('input[type=range]').value)return;changed();});body.addEventListener('change',event=>{if(event.target.tagName==='SELECT')changed();});body.addEventListener('click',event=>{if(event.target.closest('button'))changed();});
    body.hidden=!record.started;after.hidden=!record.started;if(record.started){prediction.disabled=true;start.hidden=true;status.textContent='Твой прогноз сохранён. '+spec.challenge;}if(record.explained)feedback.textContent='Объяснение проверено. Для самостоятельного результата реши новое условие.';
    return () => host.remove();
  }
  const quadraticPractice={
    id:'incomplete-quadratic',title:'Неполные квадратные уравнения',
    description:'Выбери, вынести ли общий множитель или выразить квадрат, и проверь все действительные корни.'
  };
  function practiceQuadratic(seed,level){
    const branch=level===1?'factor':level===2?'square':['factor','square','none','zero'][seed%4];
    const a=2+seed%7,root=2+seed%11;
    const coefficient=a*root,constant=a*root*root,sign=seed%2?1:-1;
    const factor=branch==='factor',negative=branch==='none',onlyZero=branch==='zero';
    const signed=(sign,term)=>(sign>0?' + ':' − ')+term;
    const expression=a+'x²'+(factor?signed(sign,coefficient+'x'):onlyZero?'':signed(negative?1:-1,constant))+' = 0';
    const answer=factor?'0;'+(-sign*root):negative?'нет':onlyZero?'0':(-root)+';'+root;
    const method=factor?'Вынести общий множитель x':'Выразить x²';
    const hint=factor?'Прежде чем делить на x, проверь x = 0. Другой корень даёт линейный множитель.':'Раздели равенство на коэффициент при x² и сравни правую часть с нулём.';
    const reduced=onlyZero?0:(negative?-1:1)*root*root;
    return {title:'Найди все действительные корни',prompt:'Реши '+expression,kind:'set',answer,
      finalLabel:'Все корни',inputNote:'Запиши корни через точку с запятой или «нет».',skills:[],
      source:{type:'authored',reference:'Авторская тренировка по неполным квадратным уравнениям'},
      hint,correction:hint,explanation:factor?'После вынесения x один корень нулевой, а второй равен '+(-sign*root)+'.':
        'После деления x² = '+reduced+'. '+(negative?'Такого действительного числа нет.':onlyZero?'Единственный корень равен 0.':'Два корня противоположны.'),
      steps:[
        {prompt:'Какое первое действие здесь удобнее?',kind:'choice',answer:method,
         choices:['Выразить x²','Вынести общий множитель x'],hint,explanation:method+'.'},
        {prompt:factor?'Какой корень даёт линейный множитель?':'Чему равно x²?',kind:'number',
         answer:String(factor?-sign*root:reduced),hint,explanation:factor?'Раздели свободный коэффициент линейного множителя с обратным знаком на '+a+'.':'Квадрат неизвестного равен '+reduced+'.'}
      ]};
  }

  const formulaPractice={
    id:'quadratic-formula',title:'Дискриминант и формула корней',
    description:'Составь дискриминант, выбери число корней и проверь точные решения на новых коэффициентах.'
  };
  function practiceFormula(seed,level){
    const h=3+seed%9,offset=(seed%13)+2,a=level===1?1:2+seed%4;
    // At level 3, all three discriminant signs occur and a positive one can be irrational.
    const delta=level===1?(1+seed%7)**2:level===2?(seed%3?offset**2:0):[0,-offset,2+seed%6][seed%3];
    const b=-2*a*h,c=a*(h*h-delta),disc=b*b-4*a*c;
    const root=Math.sqrt(delta);
    const answer=delta<0?'нет':delta===0?String(h):Number.isInteger(root)?(h-root)+';'+(h+root):
      h+'-√'+delta+';'+h+'+√'+delta;
    const equation=(a===1?'':a)+'x² − '+(-b)+'x'+(c?' '+(c<0?'−':'+')+' '+Math.abs(c):'')+' = 0';
    const hint='Возведи b в квадрат вместе со знаком. При D > 0 выпиши обе записи с разными знаками.';
    return {title:'Реши по формуле корней',prompt:'Найди все действительные корни: '+equation,kind:'quadratic-roots',
      answer,quadraticCoefficients:[a,b,c],finalLabel:'Все действительные корни',inputNote:'Введи корни через точку с запятой, одно число или «нет».',
      hint,correction:hint,explanation:'D = '+disc+'. '+(disc<0?'Действительных решений нет.':disc===0?'Один корень: '+h+'.':'Квадрат разности (x − '+h+')² равен '+delta+'. Отсюда '+answer.replace(';',' и ')+'.'),
      source:{type:'authored',reference:'Авторская тренировка по дискриминанту'},skills:[quadraticPractice.id],
      steps:[
        {prompt:'Какие a, b, c получаются в стандартной записи?',kind:'graph-values',answer:[a,b,c].join(';'),
         hint:'Не потеряй минус перед членом первой степени.',explanation:'Коэффициенты: '+[a,b,c].join('; ')+'.'},
        {prompt:'Вычисли b² − 4ac.',kind:'number',answer:String(disc),hint,explanation:'Из '+b*b+' вычитаем '+4*a*c+', получается '+disc+'.'}
      ]};
  }

  const storyPractice={id:'quadratic-story-problems',title:'Составить квадратное уравнение по условию',
    description:'Переведи размеры или подсчёт пар в уравнение, отбери решение и проверь единицы.'};
  function practiceStory(seed,level){
    const x=3+seed%15,delta=2+seed%7;
    const rectangle=level===1,meeting=level===2;
    const length=x+delta,total=rectangle?x*length:meeting?x*(x-1)/2:4*x+2*delta;
    const prompt=rectangle?'У прямоугольного плаката площадь '+total+' см². Длина на '+delta+' см больше ширины. Найди периметр в сантиметрах.':
      meeting?'На кружке каждая пара обменялась одной карточкой. Всего состоялось '+total+' обменов. Сколько ребят было в кружке?':
      'Периметр участка '+total+' м, длинная сторона на '+delta+' м больше короткой. Найди площадь участка в м².';
    const answer=rectangle?2*(x+length):meeting?x:x*length;
    const hint=rectangle?'Произведение сторон даёт площадь; в периметре каждую длину считают два раза.':
      meeting?'У каждого n − 1 партнёров. Два участника описывают один и тот же обмен.':
      'Половина периметра — сумма соседних сторон; разность равна '+delta+' м.';
    const choices=rectangle?['u(u + '+delta+') = '+total,'2u + '+delta+' = '+total]:
      meeting?['u(u − 1) = '+total,'u(u − 1)/2 = '+total]:
      ['2(u + u + '+delta+') = '+total,'u(u + '+delta+') = '+total];
    return {title:'Выбери величину, составь модель и ответь на вопрос',prompt,kind:'number',answer:String(answer),
      finalLabel:rectangle?'Периметр, см':meeting?'Число ребят':'Площадь, м²',hint,correction:hint,
      explanation:meeting?x+' ребят дают '+x+' · '+(x-1)+'/2 = '+total+' обменов.':
        'Стороны '+x+' и '+length+'. Периметр '+2*(x+length)+', площадь '+x*length+'.',
      source:{type:'authored',reference:'Новые условия для составления математической модели'},skills:[formulaPractice.id],
      steps:[{prompt:meeting?'Обозначь число ребят буквой u и выбери равенство.':'Обозначь короткую сторону буквой u и выбери равенство.',
        kind:'choice',choices,answer:choices[meeting?1:0],hint,explanation:hint},
        {prompt:meeting?'Найди число партнёров одного участника.':'Найди ширину.',kind:'number',answer:String(meeting?x-1:x),hint,
          explanation:meeting?x+' участникам доступны по '+(x-1)+' партнёров.':'Короткая сторона равна '+x+'.'}]};
  }

  const vietaPractice={id:'vieta-roots',title:'Сумма и произведение корней',
    description:'Подбери корни по двум соотношениям или восстанови коэффициент у нового уравнения.'};
  function practiceVieta(seed,level){
    const r=2+seed%7,s=(seed%2?1:-1)*(r+1+seed%5),a=level===1?1:2+seed%5,b=-a*(r+s),c=a*r*s;
    const term=(n,symbol)=>n===0?'':(n<0?' − ':' + ')+(symbol&&Math.abs(n)===1?'':Math.abs(n))+symbol;
    const expression=(a===1?'':a)+'x²'+term(b,'x')+term(c,'')+' = 0';
    const prompt=level===1?'Найди сумму и произведение корней уравнения '+expression:
      level===2?'Подбери корни и проверь оба соотношения Виета: '+expression:
      'Один корень уравнения '+a+'x² + bx'+term(c,'')+' = 0 равен '+r+'. Найди второй корень и b.';
    const answer=level===1?[r+s,r*s]:level===2?[r,s]:[s,b];
    const hint='У ax² + bx + c = 0 сумма корней равна −b/a, а произведение c/a. Проверить нужно оба отношения.';
    return {title:'Восстанови связь между коэффициентами и корнями',prompt,kind:level===2?'set':'graph-values',answer:answer.join(';'),
      finalLabel:level===1?'Сумма; произведение':level===2?'Оба корня':'Второй корень; коэффициент b',hint,correction:hint,
      explanation:'Корни '+r+' и '+s+' дают сумму '+(r+s)+' и произведение '+r*s+'. Коэффициент b = '+b+'.',
      graph:level===1?{type:'vieta-relations',sum:String(r+s),product:String(r*s)}:undefined,
      source:{type:'authored',reference:'Новая пара корней и коэффициентов'},skills:[formulaPractice.id],
      steps:[
        {prompt:'Укажи старший и свободный коэффициенты.',kind:'graph-values',answer:[a,c].join(';'),hint:'Посмотри на член с x² и слагаемое без x.',explanation:'a = '+a+', c = '+c+'.'},
        {prompt:'Чему равно произведение корней?',kind:'number',answer:String(r*s),hint:'Раздели свободный член на старший коэффициент.',explanation:c+' : '+a+' = '+r*s+'.'}
      ]};
  }

  const trinomialPractice={id:'trinomial-square',title:'Выделить квадрат и найти вершину',
    description:'Построй квадрат двучлена и исследуй экстремум на новых коэффициентах.'};
  function practiceTrinomial(seed,level){
    const a=level===1?1:(seed%2?-1:1)*(2+seed%4),h=(seed%3?-1:1)*(1+seed%8),k=seed%13-5,b=-2*a*h,c=a*h*h+k;
    const term=(n,s)=>!n?'':(n<0?' − ':' + ')+(s&&Math.abs(n)===1?'':Math.abs(n))+s;
    const source=(a===1?'':a===-1?'−':a)+'x²'+term(b,'x')+term(c,'');
    const vertexQuestion=level===3;
    const prompt='Дан трёхчлен '+source+'. '+(vertexQuestion?'Найди x и '+(a>0?'минимум':'максимум')+' трёхчлена.':'Приведи к виду A(x − h)² + k. Найди A, h и k.');
    const hint='Сравни b с −2Ah. После нахождения h подставь его в исходный трёхчлен, чтобы найти k.';
    return {title:'Квадрат двучлена и вершина',prompt,kind:'graph-values',answer:(vertexQuestion?[h,k]:[a,h,k]).join(';'),
      finalLabel:vertexQuestion?'Аргумент; значение':'A; h; k',hint,correction:hint,
      explanation:'A = '+a+', h = '+h+', k = '+k+'. При x = '+h+' квадрат исчезает.',
      graph:{type:'vertex-form',a,h,k,mode:vertexQuestion?'point':'formula'},
      source:{type:'authored',reference:'Авторская тренировка по выделению квадрата'},skills:[formulaPractice.id],
      steps:[{prompt:'Чему равен старший коэффициент?',kind:'number',answer:String(a),hint:'Прочитай множитель при x².',explanation:'A = '+a+'.'},
        {prompt:'Какой линейный коэффициент должен дать раскрытый квадрат?',kind:'number',answer:String(b),hint:'Он равен исходному коэффициенту при x.',explanation:'−2Ah = '+b+'.'}]};
  }

  const factorsPractice={id:'trinomial-factors',title:'Разложить трёхчлен на линейные множители',
    description:'Выдели старший коэффициент, используй оба корня и проверь разложение раскрытием.'};
  function practiceFactors(seed,level){
    const a=level===1?1:(seed%2?-1:1)*(2+seed%4),r=2+seed%9,s=level===3?r:-(1+seed%6);
    const b=-a*(r+s),c=a*r*s;
    const signed=(n,symbol)=>(n<0?' − ':' + ')+(symbol&&Math.abs(n)===1?'':Math.abs(n))+symbol;
    const prompt='Разложи '+(a===1?'':a)+'x²'+(b?signed(b,'x'):'')+signed(c,'')+' на линейные множители.';
    const factor=z=>'(x'+(z>0?'-':'+')+Math.abs(z)+')',answer=(a===1?'':a+'*')+factor(r)+(r===s?'^2':'*'+factor(s));
    const hint='Найди корни r, s. В произведении a(x − r)(x − s) старший коэффициент сохраняется.';
    return {title:'Корни и старший коэффициент',prompt,kind:'text',factorizedAnswer:true,answer,finalLabel:'Твоё разложение',
      hint,correction:hint,explanation:'После раскрытия восстанавливаются коэффициенты '+a+', '+b+', '+c+'.',
      source:{type:'authored',reference:'Тренировка с новыми корнями'},skills:[vietaPractice.id],
      steps:[{prompt:'Каков старший коэффициент?',kind:'number',answer:String(a),hint:'Посмотри на множитель при x².',explanation:'a = '+a+'.'},
        {prompt:'Найди сумму и произведение корней.',kind:'graph-values',answer:[r+s,r*s].join(';'),hint:'Используй −b/a и c/a.',
          explanation:'Сумма равна '+(r+s)+', произведение '+r*s+'.'}]};
  }

  const rationalEquationPractice={id:'rational-equation',title:'Дробное уравнение и посторонние корни',
    description:'Найди запреты и проверь кандидатов в исходных знаменателях.'};
  function practiceRationalEquation(seed,level){
    const hole=1+seed%9,r=hole+1+seed%5,s=-(1+seed%7);
    const factor=z=>'(x '+(z>0?'−':'+')+' '+Math.abs(z)+')';
    const top=level===1?factor(r):level===2?factor(hole)+factor(r):factor(r)+factor(s);
    const answer=level<3?String(r):s+';'+r,banned=level<3?String(hole):hole+';'+(-r-8);
    const den=level<3?factor(hole):factor(hole)+factor(-r-8);
    return {title:'Отдели корни от запрещённых значений',prompt:'Реши ('+top+') / ('+den+') = 0.',kind:'quadratic-roots',
      answer,excludedRoots:banned,graph:{type:'rational-equation-check',excluded:banned,solutions:answer},
      finalLabel:'Все допустимые корни',hint:'Дробь равна нулю, если числитель равен нулю и знаменатель отличен от нуля.',
      explanation:'Нули знаменателя: '+banned+'. После проверки остаются '+answer+'.',
      source:{type:'authored',reference:'Авторская тренировка по области допустимых значений'},skills:[vietaPractice.id],
      steps:[{prompt:'Запиши все нули исходного знаменателя.',kind:'quadratic-roots',answer:banned,hint:'Обнуляй каждый множитель знаменателя отдельно.',explanation:'Исходные запреты: '+banned+'.'},
        {prompt:'Каков положительный корень, который не запрещён?',kind:'number',answer:String(r),hint:'Проверь положительные нули числителя в знаменателе.',explanation:'x = '+r+' сохраняет знаменатель ненулевым.'}]};
  }

  const ratePractice={id:'rational-stories',title:'Две величины и дробное уравнение',
    description:'Переведи условие о двух поездках или общей сумме на язык дробей. Проверь смысл каждого корня.'};
  function practiceRates(seed,level){
    let prompt,answer,explanation,kind='number',min=0,integer=false,varName,unit,rows,steps;
    const row=(label,total,offset)=>({label,total,slope:1,offset,denominator:offset===0?'x':'x '+(offset>0?'+ ':'− ')+Math.abs(offset)});
    const step=(prompt,answer,hint,explanation)=>({prompt,kind:'number',answer:String(answer),hint,explanation});
    if(level===1){
      const slow=3+seed%9,extra=1+Math.floor(seed/3)%4,m=1+seed%3,distance=slow*(slow+extra)*m;
      const saving=extra*m;
      prompt='На маршруте длиной '+distance+' км второй велосипедист движется на '+extra+' км/ч быстрее первого и тратит на '+saving+' ч меньше. Какова скорость первого?';
      answer=String(slow);varName='скорость первого';unit='ч';
      rows=[row('Первый велосипедист',distance,0),row('Второй велосипедист',distance,extra)];
      steps=[step('Каков числитель обеих дробей времени?',distance,'Путь у них одинаковый.','Оба проходят '+distance+' км.'),
        step('Чему равно время первого минус время второго?',saving,'Более медленный едет дольше.','Разность равна '+saving+' ч.')];
      explanation='При x = '+slow+' получаем '+distance/slow+' и '+distance/(slow+extra)+' ч. Их разность '+saving+' ч. Второй корень −'+(slow+extra)+' нарушает x > 0.';
    }else if(level===2){
      const group=6+seed%12,out=1+seed%4,m=2+Math.floor(seed/4)%4,total=group*(group-out)*m,extra=out*m;
      integer=true;min=out;varName='первоначальное число участников';unit='р.';
      prompt='Группа делила поровну '+total+' р. Затем '+out+' человек отказались, и каждый из оставшихся внёс на '+extra+' р. больше. Сколько человек было первоначально?';
      answer=String(group);rows=[row('Первоначальный взнос',total,0),row('Новый взнос',total,-out)];
      steps=[step('На сколько уменьшился делитель при новом взносе?',out,'Делитель — это число участников.','Новый делитель x − '+out+'.'),
        step('Чему равен новый взнос минус первоначальный?',extra,'Общая сумма сохранилась, плательщиков стало меньше.','Разность положительна и равна '+extra+' р.')];
      explanation='При '+group+' участниках первоначальный взнос '+total/group+' р., новый '+total/(group-out)+' р. Другой корень '+(out-group)+' не даёт положительного количества участников.';
    }else{
      const r=4+2*(seed%6),s=r+2+2*(Math.floor(seed/4)%3),lake=r*s/2,up=lake+2-r-s;
      kind='set';min=2;varName='скорость на озере';unit='ч';
      prompt='Гребец проходит '+up+' км против течения (2 км/ч) на один час быстрее, чем '+lake+' км по озеру. Найди все возможные скорости на озере.';
      answer=r+';'+s;rows=[row('Против течения',up,-2),row('По озеру',lake,0)];
      steps=[step('При какой скорости на озере движение против течения прекращается?',2,'Речная скорость равна x − 2.','Нужно x > 2.'),
        step('Каково произведение корней после устранения знаменателей?',2*lake,'Умножь '+lake+'/x − '+up+'/(x − 2) = 1 на x(x − 2) и собери квадратное уравнение.','Свободный член после приведения равен 2 · '+lake+'.')];
      explanation='Уравнение сводится к x² − '+(r+s)+'x + '+r*s+' = 0. Оба значения '+r+' и '+s+' больше скорости течения и дают разность времён в один час.';
    }
    const hint='Составь дробь для каждой строки таблицы. Порядок вычитания выбери по условию, а каждый корень проверь по смыслу.';
    return {title:ratePractice.title,prompt,kind,answer,hint,correction:hint,steps,explanation,
      graph:{type:'rate-table',rows,min,integer,all:level===3,varName,unit},finalLabel:level===3?'Все возможные скорости, км/ч':level===2?'Число участников':'Скорость первого, км/ч',
      source:{type:'authored',reference:'Тренировка по составлению дробных уравнений'},skills:[rationalEquationPractice.id]};
  }

  const planePractice={id:'plane-lines',title:'Построить прямую по своим точкам',
    description:'Выбери точки и построй график, включая вертикальную прямую и объединение двух прямых.'};
  function practicePlane(seed,level){
    const h=seed%11-5,k=(seed%2?-1:1)*(1+seed%4),b=(Math.floor(seed/3)%9)-4;
    const pair=(x,y)=>'('+x+';'+y+')',row=(p,q)=>p+', '+q;
    const vertical=row(pair(h,-1),pair(h,2)),sloped=row(pair(0,b),pair(1,k+b));
    const label='y = '+k+'x '+(b<0?'− ':'+ ')+Math.abs(b);
    const lines=level===1?[[1,0,h]]:level===2?[[k,-1,-b]]:[[1,0,h],[k,-1,-b]];
    const steps=[{prompt:'Сколько различных прямых нужно построить?',kind:'number',answer:String(lines.length),
      hint:'Посчитай отдельные линейные условия.',explanation:'Нужно построить '+lines.length+' прямых.'},
      {prompt:level===1?'Какую абсциссу надо оставить постоянной?':'Какова ордината наклонной прямой при x = 0?',kind:'number',answer:String(level===1?h:b),
       hint:level===1?'На вертикали меняется только y.':'Подставь x = 0 в линейную зависимость.',explanation:level===1?'У всех её точек x = '+h+'.':'Пересечение оси y происходит на уровне '+b+'.'}];
    const hint='Для каждой прямой найди две разные точки. Если прямая вертикальна, у них одинаковый x; если наклонна, проверь обе ординаты.';
    return {title:planePractice.title,kind:'construct-lines',prompt:'Построй график: '+(level===1?'x = '+h:level===2?label:'x = '+h+' или '+label)+'.',
      answer:level===1?vertical:level===2?sloped:vertical+' | '+sloped,lines,graph:{type:'own-lines'},steps,hint,correction:hint,
      explanation:'Верно, если твои точки задают каждую требуемую прямую целиком.',finalLabel:'Точки для построения',
      inputNote:'Введи (x;y), (x;y) для каждой прямой. Две группы разделяй чертой |.',
      source:{type:'authored',reference:'Тренировка на новых прямых'},skills:[]};
  }

  const systemPractice={id:'system-lines',title:'Сколько решений у двух прямых',
    description:'Исследуй на новых коэффициентах пересечение, параллельность и совпадение двух прямых.'};
  function practiceSystem(seed,level){
    const k=(seed%2?-1:1)*(1+seed%4),b=(Math.floor(seed/3)%13)-6,delta=(seed%3)+1;
    const example=seed%3,otherK=example===0?k+(level===1?1:delta):k,otherB=example===1?b+delta:b;
    const scale=level===1?1:level===2?2+seed%3:-(2+seed%3);
    const equations=[[k,-1,-b],[scale*otherK,-scale,-scale*otherB]];
    const asText=([a,c,d])=>a+'x '+(c<0?'− ':'+ ')+Math.abs(c)+'y = '+d;
    const choices=['Одно решение','Нет решений','Бесконечно много решений'];
    const hint='Вырази y в каждом уравнении. При равных наклонах сравни, где прямые пересекают ось y.';
    const steps=[{prompt:'Укажи два наклона через ;.',kind:'graph-values',answer:k+';'+otherK,hint,explanation:'После деления на коэффициент при y наклоны равны '+k+' и '+otherK+'.'},
      {prompt:'Укажи две ординаты пересечений с осью y через ;.',kind:'graph-values',answer:b+';'+otherB,hint:'Подставь x = 0.',explanation:'При x = 0 получаем '+b+' и '+otherB+'.'}];
    return {title:systemPractice.title,prompt:'Сколько решений имеет система '+equations.map(asText).join(' и ')+'?',kind:'choice',choices,answer:choices[example],hint,correction:hint,steps,
      finalLabel:'Число решений',explanation:example===0?'Наклоны различны: ровно одна общая точка.':example===1?'Наклоны равны, свободные члены различны: общих точек нет.':'Совпадают и наклоны, и свободные члены: решениями являются все точки одной прямой.',
      graph:{type:'line-figure',lines:equations,distinguish:true,bounds:Math.max(6,Math.abs(b)+1,Math.abs(otherB)+1)},source:{type:'authored',reference:'Тренировка на новых системах'},skills:[planePractice.id]};
  }

  const graphicPractice={id:'graphical-systems',title:'Общие точки прямой и параболы',
    description:'Построй графики на новых данных, проверь координаты и число общих точек.'};
  function practiceGraphical(seed,level){
    const r=1+seed%4,s=level===1?-(1+Math.floor(seed/4)%4):r,delta=level===3?1+Math.floor(seed/3)%4:0;
    const k=r+s,b=-r*s-delta,zero=level===3,count=zero?0:r===s?1:2,points=zero?[]:[r,...(r===s?[]:[s])];
    const expression='y = '+(k?k+'x '+(b<0?'− ':'+ ')+Math.abs(b):String(b));
    const answer=zero?'0':points.map(x=>'('+x+';'+x*x+')').join(', ');
    const hint='В общей точке x² = kx + b. Для найденной абсциссы вычисли ординату и проверь её на обеих кривых.';
    return {title:graphicPractice.title,prompt:'Рассмотри параболу y = x² и прямую '+expression+'. '+(zero?'Сколько у них общих точек?':'Запиши все общие точки (x; y).'),
      kind:zero?'number':'integer-pairs',answer,finalLabel:zero?'Число общих точек':'Пары координат',hint,correction:hint,
      explanation:zero?'После переноса получится (x − '+r+')² + '+delta+' = 0. Левая часть всегда положительна.':
        'После приравнивания ординат найдено различных абсцисс: '+count+'. Проверь координаты '+answer+'.',
      graph:{type:'root-plane',learnerIntersections:!zero,curves:[{kind:'quadratic',a:1,b:0,c:0},{kind:'line',k,b,dashed:true}],xRange:[-6,6],yRange:[Math.min(-3,b-1),Math.max(18,b+3)]},
      steps:[{prompt:'Каков наклон прямой?',kind:'number',answer:String(k),hint:'Прочти коэффициент при x. У горизонтали он равен нулю.',explanation:'Наклон равен '+k+'.'},
        {prompt:'Какова ордината прямой при x = 0?',kind:'number',answer:String(b),hint:'При x = 0 остаётся только свободное слагаемое.',explanation:'Пересечение с вертикальной осью имеет ординату '+b+'.'}],
      source:{type:'authored',reference:'Тренировка на новых прямых и параболе'},skills:[systemPractice.id]};
  }

  const substitutionPractice={id:'system-substitution',title:'Подстановка и проверка пары',
    description:'Вырази переменную, найди все корни и проверь соответствие координат в исходной системе.'};
  function practiceSubstitution(seed,level){
    const r=1+seed%5,s=level===2?r:-(1+Math.floor(seed/4)%5),h=1+seed%4,b=level===3?2-r*s:-r*s;
    const points=[r,...(r===s?[]:[s])].map(x=>[x,h*x+b]),answer=points.map(([x,y])=>'('+x+';'+y+')').join(', ');
    // x² − (r + s)x + rs = 0 follows from y = hx + b and y = x² + (h − r − s)x + b + rs.
    const linear=h-r-s,constant=b+r*s;
    const expr=n=>(n<0?' − ':' + ')+Math.abs(n);
    const eq1='y = '+h+'x'+expr(b),eq2='y = x²'+(linear?expr(linear)+'x':'')+(constant?expr(constant):'');
    const graph={type:'system-pair-audit',equations:[eq1,eq2],symbols:['x','y'],excludeZero:false,
      terms:[[[String(h),1,0],['-1',0,1],[String(b),0,0]],[['1',2,0],[String(linear),1,0],['-1',0,1],[String(constant),0,0]]]};
    const hint='Приравняй два выражения для y. Каждую найденную абсциссу подставь в первое уравнение.';
    const answers=points.map(p=>p[0]).join(';');
    return {title:substitutionPractice.title,prompt:'Реши систему '+eq1+' и '+eq2+'. Запиши пары (x; y).',kind:'algebra-pairs',answer,graph,steps:[
      {prompt:'После приведения к старшему коэффициенту 1 чему равны B и C в x² + Bx + C = 0?',kind:'graph-values',answer:[-(r+s),r*s].join(';'),hint,explanation:'Линейный коэффициент равен '+(-(r+s))+', свободный член '+r*s+'.'},
      {prompt:'Укажи все абсциссы решения.',kind:'quadratic-roots',answer:answers,hint:'Разложи полученный трёхчлен.',explanation:'Корни: '+answers+'.'}],
      hint,correction:hint,finalLabel:'Все пары координат',inputNote:'Впиши пары в скобках через запятую, например (1;2), (3;4).',
      explanation:'После решения квадратного уравнения координаты восстанавливаются согласованными парами: '+answer+'.',
      source:{type:'authored',reference:'Авторская тренировка по подстановке'},skills:[graphicPractice.id]};
  }

  const balancePractice={id:'models-of-systems',title:'Проверить две величины по двум условиям',
    description:'Составь систему по новому сюжету и проверь оба числа в предметной модели.'};
  function practiceBalance(seed,level){
    const x=3+seed%11,y=2+Math.floor(seed/3)%9;
    let labels,prompt,unit,checks,restriction='natural';
    const row=(label,a,b,rhs)=>({label,coeff:[String(a),String(b)],rhs:String(rhs)});
    if(level===1){
     const price=3+seed%3,other=price+2,total=x*price+y*other;
     labels=['малые альбомы','большие альбомы'];unit='шт.';
     prompt='Продали '+(x+y)+' альбомов — маленькие по '+price+' р. и большие по '+other+' р. Получили '+total+' р. Сколько маленьких и больших альбомов?';
     checks=[row('Число альбомов',1,1,x+y),row('Выручка, р.',price,other,total)];
    }else if(level===2){
     const width=x,length=x+y;
     labels=['ширина','длина'];unit='см';restriction='positive';
     const perimeter=2*(width+length);
     prompt='Периметр прямоугольника '+perimeter+' см, длина на '+y+' см больше ширины. Определи ширину и длину.';
     checks=[row('Периметр, см',2,2,perimeter),row('Разность сторон, см',-1,1,y)];
    }else{
     const first=5*x,second=5*y,total=first+second,after=6*x+4*y;
     labels=['в первой коробке','во второй коробке'];unit='шт.';
     prompt='Первоначально в двух коробках '+total+' деталей. В первую добавили 20% её количества, из второй убрали 20% её количества, и всего стало '+after+'. Сколько деталей было в каждой сначала?';
     checks=[row('Первоначально всего',1,1,total),row('Всего после изменения','6/5','4/5',after)];
    }
    const answer=(level===2?[x,x+y]:level===3?[5*x,5*y]:[x,y]).join(';'),hint='Обозначь два искомых количества разными буквами. Проверь свою пару и по сумме, и по второму отношению.';
    return {title:balancePractice.title,prompt,kind:'graph-values',answer,hint,correction:hint,finalLabel:'Первое и второе число',
     explanation:'Для пары '+answer+' выполнены обе строки таблицы.',graph:{type:'story-balance',labels,checks,restriction,mode:'pair',unit},
     steps:[{prompt:'Запиши правые части двух уравнений в порядке таблицы.',kind:'graph-values',answer:checks.map(r=>r.rhs).join(';'),hint,explanation:'Исходные значения справа: '+checks.map(r=>r.rhs).join(';')+'.'},
       {prompt:'Сколько единиц первой величины получается из системы?',kind:'number',answer:answer.split(';')[0],hint,explanation:'Первое значение '+answer.split(';')[0]+'.'}],
     source:{type:'authored',reference:'Тренировка по составлению систем'},skills:[systemPractice.id]};
  }

  const parameterPractice={id:'parameter-equations',title:'Исследовать уравнение с параметром',description:'Разбери специальное значение, проверь число корней и найди общий ответ.'};
  function practiceParameter(seed,level){
    const h=1+seed%8,m=2+Math.floor(seed/3)%7,trial={kind:'parameter-sample',answer:'0',prompt:'Выбери для опыта значение t от −24 до 24 с шагом 1/8.',hint:'Можешь начать с 0.',explanation:'График изображает уравнение с твоим параметром.'};
    let prompt,kind,answer,graph,reason,hint;
    if(level===1){
      prompt='При каком t уравнение (t − '+h+')x = '+m+'(t − '+h+') допускает любое x?';
      kind='number';answer=String(h);graph=[[0],[-h,1],[m*h,-m]];
      hint='Для тождества нужны нули с обеих сторон.';
      reason={kind:'number',answer:String(m),prompt:'Каков единственный корень при t, отличном от особого значения?',hint:'Раздели обе части на t − '+h+'.',explanation:'Корень x = '+m+'.'};
    }else if(level===2){
      prompt='При каких t уравнение x² − 2tx + '+h*h+' = 0 имеет ровно один действительный корень?';
      kind='set';answer=(-h)+';'+h;graph=[[1],[0,-2],[h*h]];
      hint='Старший коэффициент равен 1. Приравняй дискриминант к нулю и учти оба знака t.';
      reason={kind:'number',answer:String(h*h),prompt:'Какому числу должно равняться t²?',hint:'Раздели дискриминант на четыре.',explanation:'D = 4(t² − '+h*h+').'};
    }else{
      prompt='Найди все t, при которых tx² − '+2*h+'x + 1 = 0 имеет единственный действительный корень.';
      kind='set';answer='0;'+h*h;graph=[[0,1],[-2*h],[1]];hint='Отдельно проверь t = 0, затем реши D = 0 для параболы.';
      reason={kind:'number',answer:'1/'+(2*h),prompt:'Какой корень остаётся при t = 0?',hint:'Отбрось исчезнувший квадратный член.',explanation:'Линейное уравнение даёт x = 1/'+(2*h)+'.'};
    }
    return {title:parameterPractice.title,prompt,kind,answer,hint,correction:hint,explanation:hint+' Все нужные значения: '+answer+'.',steps:[trial,reason],
      graph:{type:'parameter-polynomial',symbol:'t',coefficients:graph},skills:[parameterPractice.id],source:{type:'authored',reference:'Авторская тренировка по уравнениям с параметром'}};
  }

  const squarePractice={id:'square-certificates',title:'Доказать положительность квадратичного выражения',description:'Представь трёхчлен полным квадратом с положительным остатком.'};
  function practiceCertificate(seed,level){
    const k=level===1?1:2+seed%4,h=seed%13-6,r=2+Math.floor(seed/3)%11;
    const a=k,b=-2*k*h,c=k*h*h+r,sign=n=>n<0?' − '+Math.abs(n):' + '+n,answer=[k,h,r].join(';');
    return {title:squarePractice.title,prompt:'Докажи, что '+a+'x²'+sign(b)+'x'+sign(c)+' всегда положительно. Подбери K; H; R для записи K(x − H)² + R.',
      kind:'graph-values',answer,hint:'Сравни коэффициент при x с −2KH.',correction:'Проверь знак H и остаток R после раскрытия скобок.',
      explanation:'Коэффициенты '+answer+' возвращают исходный трёхчлен и R > 0.',graph:{type:'square-certificate',targets:[[a,b,c]],labels:['трёхчлен'],symbol:'x'},
      steps:[{kind:'number',answer:String(k),prompt:'Чему равно K?',hint:'Посмотри на старший коэффициент.',explanation:'K = '+k+'.'},
       {kind:'number',answer:String(h),prompt:'В какой точке квадрат обращается в нуль?',hint:'Используй −B/(2A).',explanation:'H = '+h+'.'}],
      skills:[squarePractice.id],source:{type:'authored',reference:'Тренировка по доказательству положительности'}};
  }

  const appliedPractice={id:'applied-quadratic-review',title:'Отобрать решения по смыслу задачи',description:'Проверь целые числа, шаг последовательности и исходную разность степеней.'};
  function practiceAppliedReview(seed,level){
    const first=2+seed%16,stride=level===1?1:2,power=level===3?3:2;
    const second=first+stride,target=second**power-first**power,answer=first+';'+second;
    return {title:appliedPractice.title,prompt:'Два натуральных числа отличаются на '+stride+'. Разность '+(power===2?'их квадратов':'их кубов')+' равна '+target+'. Найди числа по возрастанию.',
      kind:'graph-values',answer,hint:'Обозначь меньшее число x и запиши большее как x + '+stride+'.',
      correction:'Проверь шаг, положительность и разность степеней.',explanation:'Для пары '+answer+' разность степеней равна '+target+'.',
      steps:[{kind:'text',answer:'x+'+stride,reducedExpression:true,prompt:'Как выразить второе число через первое x?',hint:'Прибавь шаг.',explanation:'Второе число больше на '+stride+'.'},
       {kind:'number',answer:String(first),prompt:'Какое натуральное значение имеет меньшее число?',hint:'Раскрой степени и реши полученное уравнение.',explanation:'Меньшее равно '+first+'.'}],
      graph:{type:'number-sequence',size:2,stride,power,weights:[-1,1],target,natural:true},skills:[appliedPractice.id],source:{type:'authored',reference:'Тренировка по отбору решений'}};
  }

  const invariantPractice={id:'vieta-invariants',title:'Проверить сумму и произведение корней',description:'Восстанови две связи по коэффициентам и проверь свою пару, включая иррациональные числа.'};
  function practiceInvariants(seed,level){
    const h=2+seed%9,k=1+Math.floor(seed/3)%7,rad=level===1?'':level===2?'√2':'√3';
    const first=level===1?String(-k):h+'-'+k+rad,second=level===1?String(h):h+'+'+k+rad;
    const total=level===1?h-k:2*h,product=level===1?-h*k:h*h-(level===2?2:3)*k*k,answer=first+';'+second;
    const signed=n=>n<0?' − '+Math.abs(n):' + '+n;
    return {title:invariantPractice.title,prompt:'Найди пару корней уравнения x²'+signed(-total)+'x'+signed(product)+' = 0 и проверь обе связи Виета.',
     kind:'quadratic-roots',answer,hint:'Нужны сумма '+total+' и произведение '+product+'.',correction:'Совпадения одной связи ещё недостаточно.',
     explanation:'Числа '+first+' и '+second+' вместе дают нужные сумму и произведение.',
     steps:[{kind:'number',answer:String(total),prompt:'Чему равна сумма корней?',hint:'Возьми коэффициент при x с обратным знаком.',explanation:'S = '+total+'.'},
      {kind:'number',answer:String(product),prompt:'Чему равно произведение?',hint:'У приведённого уравнения это свободный член.',explanation:'P = '+product+'.'}],
     graph:{type:'vieta-audit',sum:String(total),product:String(product)},skills:[invariantPractice.id],source:{type:'authored',reference:'Тренировка по Виету'}};
  }

  const fractionDomainPractice={id:'fraction-domain-review',title:'Сохранить область исходной дроби',description:'Найди исключённые точки до сокращения и проверь их подстановкой.'};
  function practiceFractionDomain(seed,level){
    const h=1+seed%8,k=h+1+Math.floor(seed/3)%5,offset=level+1;
    const linear=n=>['-','x',String(n)],cancel=linear(h),den=linear(k),num=['+','x',String(offset)];
    const answer=h+';'+k,hint='Найди нули обоих исходных множителей знаменателя. Сокращение не возвращает первый из них.';
    return {title:fractionDomainPractice.title,prompt:'Назови все запреты для дроби ((x − '+h+')(x + '+offset+')) / ((x − '+h+')(x − '+k+')).',
      kind:'set',answer,hint,correction:hint,explanation:'Точки '+h+' и '+k+' запрещены. В первой сокращённая формула имеет значение, а исходная дробь нет.',
      graph:{type:'source-fraction',symbols:['x'],original:['/',['*',cancel,num],['*',cancel,den]],reduced:['/',num,den]},
      steps:[{kind:'fraction-sample',probeCount:1,answer:String(h),prompt:'Испытай любое рациональное x от −100 до 100.',hint:'Попробуй один из нулей знаменателя.',explanation:'Обе формы проверены при твоём значении.'},
       {kind:'number',answer:String(h),prompt:'Какое запрещённое значение перестало быть видимым в сокращённом знаменателе?',hint:'Посмотри на общий множитель.',explanation:'У сокращённого множителя нуль '+h+'.'}],
      skills:[fractionDomainPractice.id],source:{type:'authored',reference:'Тренировка по сохранению области дроби'}};
  }

  const auditPractice={id:'rational-root-audit',title:'Отобрать корни дробного уравнения',description:'Сравни нули числителя с запретами исходного знаменателя.'};
  function practiceRationalAudit(seed,level){
    const h=1+seed%8,k=h+1+Math.floor(seed/2)%6,r=level===3?-k:k;
    const numerator=level===1?'(x − '+r+')':'(x − '+h+')(x '+(r<0?'+ '+(-r):'− '+r)+')';
    return {title:auditPractice.title,prompt:'Реши '+numerator+' / (x − '+h+') = 0. При проверке сохрани исходный запрет.',
      kind:'quadratic-roots',answer:String(r),hint:'Сначала исключи нуль знаменателя. Затем найди нули числителя.',
      correction:'Проверь, разрешено ли найденное x в исходном знаменателе.',explanation:'Допустим только '+r+'.',
      graph:{type:'rational-root-audit',coefficients:level===1?[0,1,-r]:[1,-h-r,h*r],excluded:[String(h)],symbol:'x'},
      steps:[{kind:'number',answer:String(h),prompt:'При каком x знаменатель нулевой?',hint:'Реши x − '+h+' = 0.',explanation:'Исключается '+h+'.'},
       {kind:'number',answer:String(r),prompt:'Какой нуль числителя остаётся допустимым?',hint:'Отбери значение, отличное от '+h+'.',explanation:'Остаётся '+r+'.'}],
      skills:[auditPractice.id],source:{type:'authored',reference:'Тренировка по проверке дробного уравнения'}};
  }

  return { mount, experiment, auditPractice, practiceRationalAudit, fractionDomainPractice, practiceFractionDomain, invariantPractice, practiceInvariants, appliedPractice, practiceAppliedReview, squarePractice, practiceCertificate, parameterPractice, practiceParameter, balancePractice, practiceBalance, substitutionPractice, practiceSubstitution, graphicPractice, practiceGraphical, systemPractice, practiceSystem, planePractice, practicePlane, ratePractice, practiceRates, rationalEquationPractice, practiceRationalEquation, factorsPractice, practiceFactors, trinomialPractice, practiceTrinomial, vietaPractice, practiceVieta, storyPractice, practiceStory, quadraticPractice, practiceQuadratic, formulaPractice, practiceFormula, math: { quadratic, rational, rootValue, scaledInequality, scientific, functionValue } };
});
