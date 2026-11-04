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
  function functionValue(mode, x, k, b) {
    if (!finite(x, k, b)) return null;
    if (mode === 'linear') return k * x + b;
    if (mode === 'hyperbola') return x === 0 ? null : k / x || 0;
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
    const input = el('input'); input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value;
    lab.htmlFor = id; out.setAttribute('for', id);
    input.addEventListener('input', () => { const v = Number(input.value); out.textContent = n(v); changed(v); });
    box.append(lab, out, input); host.append(box);
    return { input, set(v) { input.value = String(v); out.textContent = n(v); } };
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
  function grid(label, range = 8) {
    const s = chart(label, 520, 400), x = v => 260 + v * 25, y = v => 200 - v * 21;
    for (let i = -range; i <= range; i += 2) {
      line(s, x(i), y(-range), x(i), y(range), { stroke: '#e1e8df', 'stroke-width': 1 });
      line(s, x(-range), y(i), x(range), y(i), { stroke: '#e1e8df', 'stroke-width': 1 });
      if (i) { text(s, x(i), y(0) + 22, n(i), { 'font-size': 15 }); text(s, x(0) - 13, y(i) + 5, n(i), { 'text-anchor': 'end', 'font-size': 15 }); }
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
  function rootModel(host, lesson) {
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
      text(s, 260, Math.min(285, top + size + 28), 'Сторона: √' + n(area) + ' = ' + n(side), { 'font-size': 20 });
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
    let mode = order === 8 || order === 45 ? 'hyperbola' : order === 14 ? 'sqrt' : order === 46 ? 'floor' : 'linear', k = systems ? 1 : 2, b = systems ? 1 : 0, point = 2;
    const ui = frame(host, systems ? 'Где встречаются два графика?' : 'Формула превращается в график', systems ? 'Зелёная прямая: y = kx + b. Коричневая: y = −x + 3. Общая точка удовлетворяет обоим уравнениям.' : 'Выбери функцию и двигай точку по оси x. Сравни значение по формуле и положение точки.');
    if (!systems) select(ui.controls, 'Функция', [['linear', 'Линейная: y = kx + b'], ['hyperbola', 'Обратная пропорциональность'], ['sqrt', 'Корень: y = √x'], ['square', 'Квадрат: y = x²'], ['floor', 'Целая часть: y = [x]']], mode, v => { mode = v; sync(); draw(); });
    const sk = slider(ui.controls, 'Коэффициент k', -4, 4, k, 1, v => { k = v; draw(); });
    const sb = slider(ui.controls, 'Свободный член b', -5, 5, b, 1, v => { b = v; draw(); });
    let sp;
    if (!systems) sp = slider(ui.controls, 'Аргумент x', -6, 6, point, 0.5, v => { point = v; draw(); });
    function sync() {
      sk.input.disabled = !systems && !['linear', 'hyperbola'].includes(mode);
      sb.input.disabled = !systems && mode !== 'linear';
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
      } else plot(g, x => functionValue(mode, x, k, b), GREEN, mode === 'hyperbola' ? [[-8, -0.01], [0.01, 8]] : mode === 'sqrt' ? [[0, 8]] : undefined);
      const value = functionValue(mode, point, k, b);
      const equationNode = mode === 'hyperbola' ? equation('y =', frac(n(k), 'x')) : equation(mode === 'linear' ? 'y = ' + n(k) + 'x ' + (b < 0 ? '− ' : '+ ') + n(Math.abs(b)) : mode === 'sqrt' ? 'y = √x' : mode === 'square' ? 'y = x²' : 'y = [x]');
      if (value !== null && Math.abs(value) <= 8) {
        line(g.s, g.x(point), g.y(0), g.x(point), g.y(value), { stroke: ORANGE, 'stroke-dasharray': '5 4' });
        circle(g.s, g.x(point), g.y(value), 5, ORANGE, ORANGE);
      }
      // The zero-coefficient rational function still excludes x = 0.
      if (mode === 'hyperbola' && k === 0) circle(g.s, g.x(0), g.y(0), 5, '#f7faf5');
      ui.visual.replaceChildren(equationNode, g.s);
      const domain = mode === 'hyperbola' ? 'Область определения: x ≠ 0.' : mode === 'sqrt' ? 'Область определения: x ≥ 0.' : 'Область определения: все действительные числа.';
      const p = el('p', '', value === null ? 'При x = ' + n(point) + ' значение не определено.' : 'При x = ' + n(point) + ' получаем y ' + (mode === 'sqrt' && !Number.isInteger(value) ? '≈ ' : '= ') + n(value) + '.');
      ui.result.replaceChildren(p, el('p', 'm8-note', domain));
      if (mode === 'hyperbola') ui.result.append(el('p', 'm8-note', k === 0 ? 'При k = 0 получаем y = 0 при x ≠ 0. Это уже не гипербола.' : 'Ветви не соединены: при x = 0 деление невозможно.'));
      if (mode === 'floor') ui.result.append(el('p', 'm8-note', '[x] — наибольшее целое число, не превосходящее x. Например, [−1,5] = −2. Пустой правый конец ступеньки не включён.'));
      if (value !== null && Math.abs(value) > 8) ui.result.append(el('p', 'm8-note', 'Точка находится за пределами показанного окна.'));
    }
    sync(); draw();
  }
  function powerModel(host, lesson) {
    const scientificMode = Number(lesson.order) === 49 || Number(lesson.order) === 50;
    const inverse = Number(lesson.order) === 51;
    const ui = frame(host, scientificMode ? 'Стандартный вид числа' : inverse ? 'Отрицательная степень в графике' : 'Отрицательная степень — обратное число', scientificMode ? 'Меняй показатель 10. Мантисса остаётся от 1 до 10, а запятая сдвигается.' : inverse ? 'Сравни x⁻¹ и x⁻². У обеих функций x ≠ 0; знак значений различается.' : 'Меняй целый показатель. Проследи переход через нуль и объясни, почему отрицательный показатель даёт дробь.');
    let a = scientificMode ? 3.2 : 2, power = scientificMode ? 4 : -2, inversePower = -1;
    if (inverse) {
      select(ui.controls, 'Показатель', [['-1', 'y = x⁻¹'], ['-2', 'y = x⁻²']], '-1', v => { inversePower = Number(v); draw(); });
    } else {
      slider(ui.controls, scientificMode ? 'Мантисса a' : 'Основание a', scientificMode ? 1 : 2, scientificMode ? 9.9 : 5, a, scientificMode ? 0.1 : 1, v => { a = v; draw(); });
      slider(ui.controls, 'Целый показатель n', -6, 6, power, 1, v => { power = v; draw(); });
    }
    function draw() {
      if (inverse) {
        const g = grid(inversePower === -1 ? 'График y = x в степени минус один' : 'График y = x в степени минус два');
        plot(g, x => x === 0 ? null : Math.pow(x, inversePower), GREEN, [[-8, -0.01], [0.01, 8]]);
        ui.visual.replaceChildren(equation('y =', exponent('x', inversePower), '=', frac('1', inversePower === -1 ? 'x' : 'x²')), g.s);
        ui.result.textContent = inversePower === -1 ? 'x ≠ 0. При x > 0 значения положительные, при x < 0 — отрицательные. График симметричен относительно начала координат.' : 'x ≠ 0. При любом допустимом x значение положительное. График симметричен относительно оси y. Значение 0 не достигается.';
        return;
      }
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
    style.textContent = '.m8-model{background:#f6faf5;border:1px solid #c7d8c9;border-radius:18px;padding:24px;color:#203b36;font:18px/1.6 system-ui,sans-serif;max-width:100%;box-sizing:border-box}.m8-model *{box-sizing:border-box}.m8-eyebrow{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#397258;margin:0 0 6px}.m8-title{font-size:1.35rem;line-height:1.3;margin:0 0 10px}.m8-instruction{margin:0 0 20px;max-width:70ch}.m8-controls{display:flex;flex-wrap:wrap;align-items:end;gap:14px 24px}.m8-control{display:grid;grid-template-columns:1fr auto;gap:5px 14px;flex:1 1 190px;max-width:370px}.m8-control label{font-size:16px;font-weight:600}.m8-value{font-weight:700}.m8-control input,.m8-control select{grid-column:1/-1;min-height:46px;width:100%;accent-color:#18725b}.m8-control select{font:inherit;color:inherit;background:white;border:1px solid #9cb7a8;border-radius:9px;padding:8px}.m8-button{font:inherit;color:#21543f;background:white;border:1px solid #9bb6a5;border-radius:10px;padding:10px 14px;min-height:46px;cursor:pointer}.m8-control input:focus-visible,.m8-control select:focus-visible,.m8-button:focus-visible{outline:3px solid #b07418;outline-offset:4px}.m8-control input:disabled{opacity:.35}.m8-visual{margin:22px 0;min-width:0}.m8-chart{display:block;width:100%;max-width:650px;max-height:430px;margin:0 auto;overflow:visible}.m8-equation{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;font-size:clamp(20px,3vw,29px);line-height:1.7;margin:18px 0}.m8-fraction{display:inline-flex;vertical-align:middle;flex-direction:column;text-align:center;line-height:1.25;max-width:100%;font-variant-numeric:tabular-nums}.m8-fraction>span:first-child{padding:2px 5px 4px;border-bottom:2px solid currentColor}.m8-fraction>span:last-child{padding:4px 5px 2px}.m8-result{border-top:1px solid #ccdbcd;padding-top:14px}.m8-result p{margin:8px 0}.m8-note{font-size:16px;color:#4d6958}.m8-roots{font-weight:700;font-size:1.18rem}.m8-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.m8-value-card{background:#fffef9;border:1px solid #d5e2d2;border-radius:12px;padding:14px;text-align:center;min-width:0}.m8-value-card .m8-equation{font-size:21px}.m8-place-value{display:flex;flex-wrap:wrap;justify-content:center;gap:9px}.m8-place{min-width:70px;border:1px solid #c8d9c7;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;background:white}.m8-current{background:#dcefdc;border-color:#18725b}.m8-nowrap{white-space:nowrap}.m8-model sup{font-size:.72em}@media(max-width:480px){.m8-model{padding:18px 12px;font-size:17px}.m8-controls{gap:12px}.m8-control{flex-basis:100%;max-width:none}.m8-comparison{grid-template-columns:1fr}.m8-equation{font-size:21px;gap:8px}.m8-note{font-size:15px}.m8-title{font-size:1.2rem}}';
    document.head.append(style);
  }
  function mount(container, lesson) {
    if (!container || !lesson || !renderers[lesson.model]) return () => {};
    styles();
    const host = el('section', 'm8-model'); host.setAttribute('aria-label', 'Интерактивная модель: ' + (lesson.title || 'Исследование'));
    container.replaceChildren(host); renderers[lesson.model](host, lesson);
    return () => host.remove();
  }
  return { mount, math: { quadratic, rational, rootValue, scaledInequality, scientific, functionValue } };
});
