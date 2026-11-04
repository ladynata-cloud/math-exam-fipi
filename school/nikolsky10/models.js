/* Topic illustrations for Nikolsky 10 (2022). No network, timers or learner records. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NikolskyModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', GREEN = '#166753', ORANGE = '#ad6428';
  let sequence = 0;
  function factorial(n) { if (!Number.isInteger(n) || n < 0 || n > 170) return NaN; let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; }
  function choose(n, k) { if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n || n > 170) return 0; let p = 1; for (let i = 1; i <= Math.min(k, n - k); i++) p = p * (n - i + 1) / i; return Math.round(p); }
  function binomial(n, p) { if (!Number.isInteger(n) || n < 0 || n > 100 || !Number.isFinite(p) || p < 0 || p > 1) return []; return Array.from({ length: n + 1 }, (_, k) => choose(n, k) * p ** k * (1 - p) ** (n - k)); }
  function root(x, n) { if (!Number.isFinite(x) || !Number.isInteger(n) || n < 1 || (x < 0 && n % 2 === 0)) return null; return Math.sign(x) * Math.abs(x) ** (1 / n); }
  function logarithm(x, a) { return x > 0 && a > 0 && a !== 1 && Number.isFinite(x) && Number.isFinite(a) ? Math.log(x) / Math.log(a) : null; }
  function trigValue(kind, x) { if (!Number.isFinite(x)) return null; if (kind === 'cos') return Math.cos(x); if (kind === 'sin') return Math.sin(x); if (kind === 'tan') return Math.abs(Math.cos(x)) < 1e-10 ? null : Math.tan(x); if (kind === 'cot') return Math.abs(Math.sin(x)) < 1e-10 ? null : 1 / Math.tan(x); return null; }
  function poles(kind, lo, hi) { const points = []; if (kind !== 'tan' && kind !== 'cot') return points; const shift = kind === 'tan' ? Math.PI / 2 : 0; for (let k = Math.ceil((lo - shift) / Math.PI); k <= Math.floor((hi - shift) / Math.PI); k++) points.push(shift + k * Math.PI); return points; }
  function curveSegments(fn, lo, hi, breaks, yMax, count) {
    if (typeof fn !== 'function' || !Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) return [];
    yMax = yMax || 6; count = count || 360;
    const cuts = [lo].concat((breaks || []).filter(v => v > lo && v < hi).sort((a, b) => a - b), [hi]);
    const out = [];
    for (let j = 1; j < cuts.length; j++) {
      let segment = [];
      for (let i = 0; i <= count; i++) {
        const x = cuts[j - 1] + (cuts[j] - cuts[j - 1]) * i / count;
        const y = fn(x);
        if (y === null || !Number.isFinite(y) || Math.abs(y) > yMax || (breaks || []).some(v => Math.abs(v - x) < 1e-9)) {
          if (segment.length > 1) out.push(segment); segment = []; continue;
        }
        segment.push([x, y]);
      }
      if (segment.length > 1) out.push(segment);
    }
    return out;
  }
  function trigRoots(kind, a, lo, hi) {
    lo = lo === undefined ? -2 * Math.PI : lo; hi = hi === undefined ? 2 * Math.PI : hi;
    if (!Number.isFinite(a) || !Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi || !['sin', 'cos'].includes(kind) || Math.abs(a) > 1) return [];
    const angle = kind === 'sin' ? Math.asin(a) : Math.acos(a), bases = kind === 'sin' ? [angle, Math.PI - angle] : [angle, -angle], out = [];
    for (const b of bases) for (let k = Math.ceil((lo - b) / (2 * Math.PI) - 1e-10); k <= Math.floor((hi - b) / (2 * Math.PI) + 1e-10); k++) {
      const x = b + 2 * Math.PI * k;
      if (x >= lo - 1e-9 && x <= hi + 1e-9 && !out.some(v => Math.abs(v - x) < 1e-8)) out.push(Math.abs(x) < 1e-10 ? 0 : x);
    }
    return out.sort((a, b) => a - b);
  }
  function conditional(red, blue, firstRed) { const total = red + blue; if (![red, blue].every(Number.isInteger) || red < 0 || blue < 0 || total <= 1 || (firstRed && red === 0) || (!firstRed && blue === 0)) return null; return (red - (firstRed ? 1 : 0)) / (total - 1); }
  function modelFor(lesson) {
    const code = String(lesson.section || lesson.id || lesson.number || '1.1').replace(/\*/g, ''), major = Number(code.split('.')[0]);
    if (code === '1.3') return 'induction';
    if (['1.4', '1.5', '1.6'].includes(code)) return 'counting';
    if (code === '1.7') return 'amgm';
    if (['1.8', '1.9'].includes(code)) return 'division';
    if (code === '1.10') return 'integer';
    if (major === 1) return 'numberline';
    if (major === 2) return Number(code.split('.')[1]) >= 8 ? 'interval' : 'polynomial';
    if (major === 3) return Number(code.split('.')[1]) >= 3 ? 'root' : 'power';
    if (['4.3', '4.4', '4.6'].includes(code)) return 'sequence';
    if (code === '4.5') return 'geometric';
    if (major === 4) return 'exponential';
    if (major === 5) return code === '5.5' ? 'power' : 'logarithm';
    if (major === 6) return 'equivalence';
    if (major >= 7 && major <= 9) return 'circle';
    if (major === 10) return 'triggraph';
    if (major === 11) return 'trigroots';
    if (major === 12) return 'probability';
    if (code === '13.1') return 'frequency';
    if (code === '13.2') return 'conditional';
    if (major === 14) return 'binomial';
    return 'numberline';
  }
  function mount(host, lesson) {
    if (!host || !host.ownerDocument) return function () {};
    const document = host.ownerDocument, removed = [], code = String(lesson.section || lesson.id || lesson.number || '1.1').replace(/\*/g, ''), kind = modelFor(lesson);
    function el(tag, value) { const n = document.createElement(tag); if (value !== undefined) n.textContent = value; return n; }
    function svg(tag, attrs, value) { const n = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, String(v))); if (value !== undefined) n.textContent = value; return n; }
    function fmt(v, digits) { return !Number.isFinite(v) ? 'не определено' : new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits === undefined ? 4 : digits }).format(Math.abs(v) < 1e-10 ? 0 : v); }
    function listen(node, event, action) { node.addEventListener(event, action); removed.push(() => node.removeEventListener(event, action)); }
    const box = el('section'); box.className = 'n10-model'; box.style.cssText = 'margin:1rem 0;padding:1rem;border:1px solid #d7dfd5;border-radius:18px;background:#fffef9';
    const title = el('h3', 'Иллюстрация к теме'), note = el('p'), controls = el('div'), visual = el('div'), result = el('div');
    title.style.margin = '0 0 .5rem'; note.style.cssText = 'font-size:1rem;margin:.5rem 0 1rem'; controls.style.cssText = 'display:flex;flex-wrap:wrap;gap:1rem;align-items:end';
    result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite'); result.style.cssText = 'font-size:1.1rem;line-height:1.8;padding-top:.6rem;min-height:3em';
    box.append(title, note, controls, visual, result); host.replaceChildren(box);
    function setTitle(t, hint) { title.textContent = 'Иллюстрация: ' + t; note.textContent = hint || 'Меняйте значение и наблюдайте одну связь. Это отдельная модель темы, а не рисунок к выбранной задаче.'; }
    function say(message) { result.textContent = message; }
    function fraction(a, b) { const s = el('span'), top = el('span', a), bottom = el('span', b); s.style.cssText = 'display:inline-flex;vertical-align:middle;flex-direction:column;text-align:center;line-height:1.3;margin:0 .35em'; top.style.cssText = 'border-bottom:1px solid currentColor;padding:0 .2em'; bottom.style.padding = '0 .2em'; s.setAttribute('aria-label', a + ' делить на ' + b); s.append(top, bottom); return s; }
    function slider(label, min, max, value, step, change) {
      const wrap = el('div'), lab = el('label', label + ': '), out = el('output', fmt(value)), input = el('input'), id = 'n10-model-' + (++sequence);
      wrap.style.cssText = 'flex:1 1 200px;min-width:0'; input.type = 'range'; input.id = id; input.min = min; input.max = max; input.step = step; input.value = value; input.style.cssText = 'display:block;width:100%;min-height:36px;accent-color:#166753'; lab.htmlFor = id; out.setAttribute('for', id); lab.append(out); wrap.append(lab, input); controls.append(wrap);
      listen(input, 'input', () => { const v = Number(input.value); out.textContent = fmt(v); change(v); }); return input;
    }
    function select(label, entries, value, change) {
      const wrap = el('div'), lab = el('label', label), input = el('select'), id = 'n10-model-' + (++sequence); input.id = id; lab.htmlFor = id;
      input.style.cssText = 'display:block;padding:.4rem;max-width:100%;border:1px solid #aabdaf;border-radius:8px;background:white';
      entries.forEach(([v, label]) => { const o = el('option', label); o.value = v; input.append(o); }); input.value = value; wrap.append(lab, input); controls.append(wrap); listen(input, 'change', () => change(input.value)); return input;
    }
    function chart(label, h) { const s = svg('svg', { viewBox: '0 0 600 ' + (h || 330), role: 'img', 'aria-label': label }); s.style.cssText = 'width:100%;height:auto;display:block;max-height:440px;margin-top:12px'; visual.replaceChildren(s); return s; }
    function text(s, x, y, str, extra) { s.append(svg('text', Object.assign({ x, y, fill: '#203b36', 'font-size': 18, 'font-family': 'system-ui,sans-serif', 'text-anchor': 'middle' }, extra || {}), str)); }
    function line(s, x1, y1, x2, y2, color, width, dash) { s.append(svg('line', { x1, y1, x2, y2, stroke: color || '#b4c2b7', 'stroke-width': width || 1.5, 'stroke-dasharray': dash || '' })); }
    function dot(s, x, y, open, color) { s.append(svg('circle', { cx: x, cy: y, r: 5, fill: open ? '#fffef9' : color || GREEN, stroke: color || GREEN, 'stroke-width': 2 })); }
    function graph(label, lo, hi, ymax, fn, breaks, point, second) {
      const s = chart(label, 370), X = x => 48 + (x - lo) / (hi - lo) * 504, Y = y => 175 - y / ymax * 128;
      const x0 = Math.max(48, Math.min(552, X(0)));
      line(s, 48, Y(0), 558, Y(0), '#657c70'); line(s, x0, 35, x0, 310, '#657c70');
      for (let i = 0; i <= 4; i++) { const x = lo + (hi - lo) * i / 4; line(s, X(x), 42, X(x), 303, '#e3e8df'); text(s, X(x), 334, fmt(x, 2), { 'font-size': 15 }); }
      for (let i = -1; i <= 1; i++) { const y = i * ymax; text(s, 33, Y(y) + 6, fmt(y), { 'text-anchor': 'end', 'font-size': 15 }); }
      text(s, 574, 181, 'x'); text(s, x0 + 17, 28, 'y');
      function paint(f, br, color) { curveSegments(f, lo, hi, br, ymax, 360).forEach(points => s.append(svg('path', { d: points.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(2) + ' ' + Y(p[1]).toFixed(2)).join(' '), fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linejoin': 'round' }))); }
      (breaks || []).filter(v => v >= lo && v <= hi).forEach(v => line(s, X(v), 43, X(v), 303, ORANGE, 1.5, '5 5'));
      paint(fn, breaks, GREEN); if (second) paint(second, [], ORANGE);
      if (point && point[1] !== null && Number.isFinite(point[1]) && point[1] >= -ymax && point[1] <= ymax) { line(s, X(point[0]), Y(0), X(point[0]), Y(point[1]), ORANGE, 1.5, '4 4'); dot(s, X(point[0]), Y(point[1]), false, ORANGE); }
      return { s, X, Y };
    }
    function bars(values, labels, label) {
      const s = chart(label, 300), max = Math.max(...values, 1e-9), gap = 480 / values.length;
      line(s, 50, 235, 550, 235); values.forEach((v, i) => { const x = 55 + i * gap, h = v / max * 170; s.append(svg('rect', { x, y: 235 - h, width: Math.max(4, gap - 12), height: h, rx: 3, fill: GREEN })); text(s, x + (gap - 12) / 2, 260, String(labels[i]), { 'font-size': 16 }); text(s, x + (gap - 12) / 2, 225 - h, fmt(v, 3), { 'font-size': 15 }); }); return s;
    }
    if (kind === 'numberline') {
      setTitle('рациональное число на прямой'); let a = 3, b = 4;
      slider('Числитель', -8, 8, a, 1, v => { a = v; draw(); }); slider('Знаменатель', 1, 8, b, 1, v => { b = v; draw(); });
      function draw() { const s = chart('Точка a/b на числовой прямой', 180), value = a / b, range = Math.max(2, Math.ceil(Math.abs(value))), X = x => 300 + 240 * x / range; line(s, 48, 85, 552, 85, '#657c70', 2); for (let i = -range; i <= range; i++) { line(s, X(i), 80, X(i), 90); text(s, X(i), 117, i, { 'font-size': 16 }); } dot(s, X(value), 85, false); text(s, X(value), 54, fmt(value)); result.replaceChildren(fraction(String(a), String(b)), el('span', ' ≈ ' + fmt(value) + '. Знаменатель всегда положителен.')); } draw();
    } else if (kind === 'induction') {
      setTitle('сумма первых нечётных чисел', 'Двигая n, сравните сумму с n². Наблюдение помогает понять формулу; доказательство требует базы и перехода.'); let n = 4;
      slider('Количество слагаемых n', 1, 8, n, 1, v => { n = v; draw(); });
      function draw() { bars(Array.from({ length: n }, (_, i) => 2 * i + 1), Array.from({ length: n }, (_, i) => i + 1), 'Первые n нечётных чисел'); say(Array.from({ length: n }, (_, i) => 2 * i + 1).join(' + ') + ' = ' + n * n + ' = ' + n + '². Следующее слагаемое: ' + (2 * n + 1) + '.'); } draw();
    } else if (kind === 'counting') {
      setTitle(code === '1.4' ? 'перестановки' : code === '1.5' ? 'размещения' : 'сочетания'); let n = 5, k = 2;
      slider('Всего объектов n', 2, 8, n, 1, v => { n = v; draw(); }); if (code !== '1.4') slider('Выбираем объектов k', 1, 8, k, 1, v => { k = v; draw(); });
      function draw() { const s = chart('Выбор объектов из n различных объектов', 180); for (let i = 0; i < n; i++) { s.append(svg('circle', { cx: 75 + i * 62, cy: 78, r: 22, fill: code === '1.4' || i < k ? GREEN : '#e4eee5' })); text(s, 75 + i * 62, 85, i + 1, { fill: code === '1.4' || i < k ? 'white' : GREEN }); } if (k > n && code !== '1.4') { say('Выбрать ' + k + ' различных объектов из ' + n + ' без повторений нельзя: способов 0.'); return; } const value = code === '1.4' ? factorial(n) : code === '1.5' ? factorial(n) / factorial(n - k) : choose(n, k); say((code === '1.4' ? n + '! = ' : code === '1.5' ? 'A(' + n + ', ' + k + ') = ' : 'C(' + n + ', ' + k + ') = ') + value + '. ' + (code === '1.6' ? 'Порядок выбранных объектов не учитываем.' : 'Порядок объектов имеет значение.')); } draw();
    } else if (kind === 'amgm') {
      setTitle('при постоянной сумме произведение ограничено'); let a = 3;
      slider('Первое положительное число', .5, 9.5, a, .5, v => { a = v; draw(); });
      function draw() { const b = 10 - a; bars([a * b, 25], ['ab', '25'], 'Сравнение произведения с квадратом полусуммы'); say('a = ' + fmt(a) + ', b = ' + fmt(b) + '. a + b = 10; ab = ' + fmt(a * b) + ' ≤ 25. Разность 25 − ab = ' + fmt((a - b) ** 2 / 4) + '.'); } draw();
    } else if (kind === 'division') {
      setTitle('деление с остатком'); let a = 17, m = 5;
      slider('Целое число a', -20, 30, a, 1, v => { a = v; draw(); }); slider('Модуль m', 2, 8, m, 1, v => { m = v; draw(); });
      function draw() { const q = Math.floor(a / m), r = a - m * q, s = chart('Остатки от нуля до m − 1', 180); for (let i = 0; i < m; i++) { s.append(svg('circle', { cx: 75 + i * 62, cy: 78, r: 22, fill: i === r ? GREEN : '#e4eee5' })); text(s, 75 + i * 62, 85, i, { fill: i === r ? 'white' : GREEN }); } say(a + ' = ' + m + ' · (' + q + ') + ' + r + '. Поэтому ' + a + ' ≡ ' + r + ' (mod ' + m + '), 0 ≤ остаток < ' + m + '.'); } draw();
    } else if (kind === 'integer') {
      setTitle('целые неотрицательные решения 3x + 2y = N'); let total = 12;
      slider('Правая часть N', 1, 24, total, 1, v => { total = v; draw(); });
      function draw() { const points = []; for (let x = 0; x <= total / 3; x++) { const y = (total - 3 * x) / 2; if (Number.isInteger(y)) points.push([x, y]); } const g = graph('Прямая 3x + 2y = N и целочисленные точки', 0, 9, 13, x => (total - 3 * x) / 2); points.forEach(p => dot(g.s, g.X(p[0]), g.Y(p[1]), false, ORANGE)); say(points.length ? 'Решения при x ≥ 0, y ≥ 0: ' + points.map(p => '(' + p[0] + '; ' + p[1] + ')').join(', ') + '.' : 'Целых неотрицательных решений нет.'); } draw();
    } else if (kind === 'polynomial') {
      setTitle('нули многочлена и его значение', 'Исследуем P(x) = (x − 1)(x + 2). При делении на x − a остаток равен P(a).'); let a = 0;
      slider('Значение a', -3, 3, a, .25, v => { a = v; draw(); });
      function draw() { const p = x => (x - 1) * (x + 2); graph('График P(x) = (x − 1)(x + 2)', -4, 4, 9, p, [], [a, p(a)]); say('P(' + fmt(a) + ') = ' + fmt(p(a)) + '. Корни: −2 и 1. Остаток при делении P(x) на x − (' + fmt(a) + ') равен ' + fmt(p(a)) + '.'); } draw();
    } else if (kind === 'interval') {
      setTitle('знак дроби на промежутках', 'Исследуем (x + 2)/(x − 1). Нуль числителя и нуль знаменателя выполняют разные роли.'); let x = 0;
      slider('Пробная точка x', -4, 4, x, .25, v => { x = v; draw(); });
      function draw() { const g = graph('График дроби (x + 2)/(x − 1)', -4, 4, 6, t => Math.abs(t - 1) < 1e-9 ? null : (t + 2) / (t - 1), [1], [x, x === 1 ? null : (x + 2) / (x - 1)]); dot(g.s, g.X(-2), g.Y(0), false); if (x === 1) say('При x = 1 знаменатель равен нулю: значение не существует. Точка 1 исключается при любом знаке неравенства.'); else say('При x = ' + fmt(x) + ' значение ' + fmt((x + 2) / (x - 1)) + '. Дробь > 0 на (−∞; −2) ∪ (1; +∞); равна нулю при x = −2.'); } draw();
    } else if (kind === 'power' || kind === 'root') {
      setTitle(kind === 'root' ? 'корень и обратная проверка' : 'целая степень и её график'); let n = 3, x = 2;
      slider('Натуральная степень n', 1, 6, n, 1, v => { n = v; draw(); }); slider('Значение x', -4, 4, x, .25, v => { x = v; draw(); });
      function draw() { const f = t => kind === 'root' ? root(t, n) : t ** n, value = f(x); graph(kind === 'root' ? 'График корня n-й степени' : 'График y = x в степени n', -4, 4, 6, f, [], [x, value]); say(value === null ? 'Чётный корень из отрицательного числа не определён в действительных числах.' : kind === 'root' ? 'Корень степени ' + n + ' из ' + fmt(x) + ' ≈ ' + fmt(value) + '. Проверка: возведение результата в степень ' + n + ' возвращает ' + fmt(x) + '.' : fmt(x) + ' в степени ' + n + ' = ' + fmt(value) + '. ' + (n % 2 ? 'При нечётной степени знак сохраняется.' : 'При чётной степени результат неотрицателен.')); } draw();
    } else if (kind === 'sequence') {
      setTitle(code === '4.6' ? 'последовательность приближается к e' : 'последовательность приближается к пределу', 'Точки показывают отдельные члены последовательности. Конечное наблюдение иллюстрирует предел, но не заменяет его доказательство.'); let n = 8;
      slider('Число n', 1, 40, n, 1, v => { n = v; draw(); });
      function draw() { const f = k => code === '4.6' ? (1 + 1 / k) ** k : 1 + 1 / k, limit = code === '4.6' ? Math.E : 1, s = chart('Члены последовательности', 300), Y = y => 235 - y * 65; line(s, 50, Y(limit), 550, Y(limit), ORANGE, 2, '5 5'); for (let k = 1; k <= n; k++) dot(s, 50 + k * 490 / 40, Y(f(k)), false); text(s, 545, Y(limit) - 12, code === '4.6' ? 'e' : '1', { 'text-anchor': 'end' }); text(s, 300, 275, 'Номер члена n'); say((code === '4.6' ? '(1 + 1/n)ⁿ' : '1 + 1/n') + ' при n = ' + n + ' ≈ ' + fmt(f(n), 6) + '; предел ' + (code === '4.6' ? 'e ≈ 2,718282' : '1') + '.'); } draw();
    } else if (kind === 'geometric') {
      setTitle('частичная сумма геометрической прогрессии'); let q = .5, n = 5;
      slider('Знаменатель q', -.8, .8, q, .1, v => { q = v; draw(); }); slider('Число слагаемых n', 1, 12, n, 1, v => { n = v; draw(); });
      function draw() { const sums = Array.from({ length: n }, (_, i) => (1 - q ** (i + 1)) / (1 - q)); bars(sums, sums.map((_, i) => i + 1), 'Частичные суммы прогрессии с первым членом 1'); say('S' + n + ' = (1 − qⁿ)/(1 − q) ≈ ' + fmt(sums[n - 1]) + '. При |q| < 1 сумма бесконечной прогрессии S = 1/(1 − q) ≈ ' + fmt(1 / (1 - q)) + '.'); } draw();
    } else if (kind === 'exponential' || kind === 'logarithm' || kind === 'equivalence') {
      const isLog = kind === 'logarithm'; setTitle(isLog ? 'логарифм — показатель степени' : kind === 'equivalence' ? 'показательная и логарифмическая записи' : 'основание определяет возрастание'); let a = 2, x = isLog ? 2 : 1;
      select('Основание a', [['0.5', '1/2'], ['2', '2'], ['3', '3'], ['10', '10']], '2', v => { a = Number(v); draw(); }); slider(isLog ? 'Положительный аргумент x' : 'Показатель x', isLog ? .25 : -3, isLog ? 6 : 3, x, .25, v => { x = v; draw(); });
      function draw() { const value = isLog ? logarithm(x, a) : a ** x; graph(isLog ? 'График логарифмической функции' : 'График показательной функции', isLog ? 0 : -4, isLog ? 7 : 4, 6, t => isLog ? logarithm(t, a) : a ** t, isLog ? [0] : [], [x, value]); say(isLog ? 'logₐ(' + fmt(x) + ') ≈ ' + fmt(value) + ', потому что ' + fmt(a) + ' в этой степени даёт ' + fmt(x) + '. Область определения: x > 0.' : fmt(a) + ' в степени ' + fmt(x) + ' ≈ ' + fmt(value) + '; logₐ(' + fmt(value) + ') = ' + fmt(x) + '. ' + (a > 1 ? 'При a > 1 функция возрастает: знак неравенства сохраняется.' : 'При 0 < a < 1 функция убывает: знак неравенства меняется.')); } draw();
    } else if (kind === 'circle') {
      setTitle('поворот на единичной окружности', 'Зелёный радиус показывает поворот. Горизонтальная координата — cos α, вертикальная — sin α.'); let deg = 30;
      slider('Угол α, градусы', -360, 360, deg, 15, v => { deg = v; draw(); });
      function draw() { const a = deg * Math.PI / 180, c = Math.abs(Math.cos(a)) < 1e-10 ? 0 : Math.cos(a), sn = Math.abs(Math.sin(a)) < 1e-10 ? 0 : Math.sin(a), s = chart('Единичная окружность и проекции радиуса', 370), cx = 300, cy = 175, r = 128, px = cx + r * c, py = cy - r * sn;
        s.append(svg('circle', { cx, cy, r, fill: 'none', stroke: '#a9bcb0', 'stroke-width': 2 })); line(s, 125, cy, 475, cy); line(s, cx, 22, cx, 330); line(s, cx, cy, px, py, GREEN, 3); line(s, px, py, px, cy, ORANGE, 2, '5 5'); line(s, px, py, cx, py, ORANGE, 2, '5 5'); dot(s, px, py, false); text(s, 495, cy + 6, 'cos α'); text(s, cx + 40, 28, 'sin α'); text(s, cx - 15, cy + 23, '0'); text(s, cx + r, cy + 24, '1'); text(s, cx - r, cy + 24, '−1'); text(s, cx - 16, cy - r, '1'); text(s, cx - 22, cy + r, '−1');
        result.replaceChildren(el('span', 'α = ' + deg + '° ≈ ' + fmt(a) + ' рад; cos α ≈ ' + fmt(c) + '; sin α ≈ ' + fmt(sn) + '. '));
        if (['8.4', '8.5', '8.6'].includes(code)) { result.append(el('span', 'ctg α = '), fraction('cos α', 'sin α'), el('span', sn === 0 ? ' — не определён: sin α = 0.' : ' ≈ ' + fmt(c / sn) + '; arcctg(ctg α) = ' + fmt(Math.atan2(1, c / sn) * 180 / Math.PI) + '° ∈ (0°; 180°).')); }
        else if (code.startsWith('8.') || code === '9.7') { result.append(el('span', 'tg α = '), fraction('sin α', 'cos α'), el('span', c === 0 ? ' — не определён: cos α = 0.' : ' ≈ ' + fmt(sn / c) + (code === '8.3' ? '; arctg(tg α) = ' + fmt(Math.atan(sn / c) * 180 / Math.PI) + '° ∈ (−90°; 90°).' : '.'))); }
        else if (code === '7.5' || code === '7.7' || code === '7.8') result.append(el('span', 'arcsin(sin α) = ' + fmt(Math.asin(sn) * 180 / Math.PI) + '° ∈ [−90°; 90°].'));
        else if (code === '7.6') result.append(el('span', 'arccos(cos α) = ' + fmt(Math.acos(c) * 180 / Math.PI) + '° ∈ [0°; 180°].'));
        else result.append(el('span', 'sin² α + cos² α = 1.'));
      } draw();
    } else if (kind === 'triggraph') {
      const modes = { '10.1': 'sin', '10.2': 'cos', '10.3': 'tan', '10.4': 'cot' }, mode = modes[code] || 'sin', name = { sin: 'sin', cos: 'cos', tan: 'tg', cot: 'ctg' }[mode]; let x = 0;
      setTitle('график y = ' + name + ' x', 'Аргумент x дан в радианах. Пунктир показывает исключённые значения; ветви через них не соединяются.'); slider('Аргумент x / π', -2, 2, x, .125, v => { x = v; draw(); });
      function draw() { const v = trigValue(mode, x * Math.PI); graph('График ' + name + ' x', -2 * Math.PI, 2 * Math.PI, mode === 'sin' || mode === 'cos' ? 1.5 : 4, t => trigValue(mode, t), poles(mode, -2 * Math.PI, 2 * Math.PI), [x * Math.PI, v]); say('x = ' + fmt(x) + 'π рад; ' + name + ' x ' + (v === null ? 'не определён.' : '≈ ' + fmt(v) + '.') + ' Период: ' + (mode === 'sin' || mode === 'cos' ? '2π.' : 'π.')); } draw();
    } else if (kind === 'trigroots') {
      setTitle('корни на единичной окружности', 'Окружность показывает углы по модулю 2π. Под рисунком перечислены все корни выбранного уравнения на [−2π; 2π].'); let a = .5, mode = 'sin';
      select('Функция', [['sin', 'sin x'], ['cos', 'cos x']], mode, v => { mode = v; draw(); }); slider('Правая часть a', -1, 1, a, .25, v => { a = v; draw(); });
      function draw() { const roots = trigRoots(mode, a), s = chart('Единичная окружность: ' + mode + ' x = ' + a, 370), cx = 300, cy = 175, r = 128;
        s.append(svg('circle', { cx, cy, r, fill: 'none', stroke: '#a9bcb0', 'stroke-width': 2 })); line(s, 125, cy, 475, cy); line(s, cx, 22, cx, 330);
        if (mode === 'sin') line(s, 140, cy - a * r, 460, cy - a * r, ORANGE, 2); else line(s, cx + a * r, 26, cx + a * r, 325, ORANGE, 2);
        const angles = [];
        roots.forEach(x => { const c = Math.cos(x), sn = Math.sin(x); if (!angles.some(p => Math.abs(p[0] - c) < 1e-8 && Math.abs(p[1] - sn) < 1e-8)) { angles.push([c, sn]); line(s, cx, cy, cx + r * c, cy - r * sn, GREEN, 2); dot(s, cx + r * c, cy - r * sn, false, GREEN); } });
        text(s, 495, cy + 6, 'cos x'); text(s, cx + 40, 28, 'sin x'); text(s, 300, 357, mode + ' x = ' + fmt(a));
        say('На [−2π; 2π] найдено корней: ' + roots.length + '. x ≈ ' + roots.map(x => fmt(x, 3)).join('; ') + ' рад. К каждому корню можно прибавлять 2πk, k — целое.'); } draw();
    } else if (kind === 'probability' || kind === 'conditional') {
      setTitle(kind === 'conditional' ? 'второе извлечение без возвращения' : 'равновозможные исходы'); let red = 3, blue = 5, first = 'red';
      slider('Красные шары', 1, 8, red, 1, v => { red = v; draw(); }); slider('Синие шары', 1, 8, blue, 1, v => { blue = v; draw(); }); if (kind === 'conditional') select('Первый вынутый шар', [['red', 'Красный'], ['blue', 'Синий']], first, v => { first = v; draw(); });
      function draw() { const r = red - (kind === 'conditional' && first === 'red' ? 1 : 0), b = blue - (kind === 'conditional' && first === 'blue' ? 1 : 0), total = r + b, s = chart('Число оставшихся красных и синих шаров', 210); for (let i = 0; i < total; i++) { const color = i < r ? '#a85040' : '#387597'; s.append(svg('circle', { cx: 65 + (i % 8) * 64, cy: 62 + Math.floor(i / 8) * 70, r: 20, fill: color })); text(s, 65 + (i % 8) * 64, 68 + Math.floor(i / 8) * 70, i < r ? 'К' : 'С', { fill: 'white', 'font-size': 16 }); } result.replaceChildren(el('span', (kind === 'conditional' ? 'После известного первого исхода: ' : '') + 'P(красный) = '), fraction(String(r), String(total)), el('span', ' ≈ ' + fmt(r / total) + '. Все оставшиеся шары равновероятны при извлечении.')); } draw();
    } else if (kind === 'frequency') {
      setTitle('частота и теоретическая вероятность', 'Задайте наблюдённые числа. Частота — доля успехов в этой серии; она не обязана равняться вероятности 1/2.'); let n = 20, successes = 11;
      slider('Число испытаний n', 10, 100, n, 10, v => { n = v; draw(); }); slider('Число успехов m', 0, 100, successes, 1, v => { successes = v; draw(); });
      function draw() { if (successes > n) { visual.replaceChildren(); say('Число успехов не может превышать число испытаний. Уменьшите m или увеличьте n.'); return; } bars([successes / n, .5], ['Частота', 'P = 1/2'], 'Сравнение наблюдённой частоты с вероятностью'); result.replaceChildren(el('span', 'Частота = '), fraction(String(successes), String(n)), el('span', ' = ' + fmt(successes / n) + '. Отклонение от 1/2: ' + fmt(Math.abs(successes / n - .5)) + '.')); } draw();
    } else if (kind === 'binomial') {
      setTitle('число успехов в независимых испытаниях', 'Каждое из n независимых испытаний имеет одну и ту же вероятность успеха p. Столбцы показывают точные вероятности P(X = k), подписи округлены.'); let n = 5, p = .5;
      slider('Испытаний n', 1, 10, n, 1, v => { n = v; draw(); }); slider('Вероятность успеха p', 0, 1, p, .1, v => { p = v; draw(); });
      function draw() { const probabilities = binomial(n, p); bars(probabilities, probabilities.map((_, i) => i), 'Биномиальное распределение числа успехов'); say('M(X) = np = ' + fmt(n * p) + '. Сумма вероятностей всех исходов = 1. Ожидание — среднее в большом числе повторений, а не гарантированный результат одного опыта.'); } draw();
    }
    return function cleanup() { removed.forEach(fn => fn()); box.remove(); };
  }
  return { mount, modelFor, factorial, choose, binomial, root, logarithm, trigValue, poles, curveSegments, trigRoots, conditional };
});
