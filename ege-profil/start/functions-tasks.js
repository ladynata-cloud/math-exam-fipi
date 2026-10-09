(function (root) {
  'use strict';
  const C = { ink: '#243c4b', graph: '#176b80', tangent: '#a14a26', positive: '#26754c', negative: '#a14a26', grid: '#e2e9ed', muted: '#536674' };
  const fmt = n => String(Number(n.toFixed(5))).replace(/-/g, '−').replace('.', ',');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const finite = Number.isFinite;
  let serial = 0;

  function functionFor(m) {
    switch (m.kind) {
      case 'tangent': { const slope = (m.b[1] - m.a[1]) / (m.b[0] - m.a[0]); return x => m.value + slope * (x - m.x0) + m.curve * (x - m.x0) ** 2; }
      case 'derivative-sign': return x => m.coefficient * (x - m.left) * (x - m.right);
      case 'derivative-touch': return x => m.coefficient * (x - m.zero) ** 2;
      case 'graph-negative-count': return x => m.scale * (x ** 3 - 3 * m.a * m.a * x);
      case 'integral-line': case 'primitive-value': return x => m.slope * x + m.intercept;
      case 'integral-crossing': return x => m.slope * (x - m.zero);
      case 'derivative-quadratic': return x => m.a * x * x + m.b * x + m.c;
      case 'derivative-cubic': return x => m.a * x ** 3 + m.b * x;
      case 'derivative-reciprocal': return x => x !== 0 ? m.a / x : NaN;
      case 'derivative-exponential': return x => m.a * Math.exp(x);
      case 'derivative-logarithm': return x => x > 0 ? m.a * Math.log(x) : NaN;
      case 'derivative-root': return x => x >= 0 ? m.a * Math.sqrt(x) : NaN;
      case 'extreme-quadratic': return x => m.a * (x - m.h) ** 2 + m.k;
      case 'extreme-cubic': return x => x ** 3 - 3 * m.a ** 2 * x;
      case 'line-value': { const slope = (m.b[1] - m.a[1]) / (m.b[0] - m.a[0]); return x => m.a[1] + slope * (x - m.a[0]); }
      case 'parabola-value': { const coeff = (m.py - m.k) / (m.px - m.h) ** 2; return x => coeff * (x - m.h) ** 2 + m.k; }
      case 'hyperbola-value': { const coeff = (m.py - m.b) * (m.px - m.h); return x => x !== m.h ? coeff / (x - m.h) + m.b : NaN; }
      case 'exponential-value': return x => m.base ** x + m.shift;
      case 'logarithm-value': return x => x > 0 ? Math.log(x) / Math.log(m.base) + m.shift : NaN;
      default: throw Error('Unknown function model: ' + m.kind);
    }
  }
  function niceStep(span, count) {
    const raw = Math.max(span / count, 1e-6), power = 10 ** Math.floor(Math.log10(raw)), q = raw / power;
    return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 5 ? 5 : 10) * power;
  }
  function sceneFor(task, context, options) {
    context = context || {}; options = options || {};
    const m = task.meta, fn = functionFor(m), independent = context.mode === 'independent';
    const completedCount = Number(context.completed) || 0;
    const complete = independent ? !!context.solved : completedCount >= task.steps.length || ((Number(context.step) || 0) + (context.solved ? 1 : 0) >= task.steps.length);
    const help = !!options.help || complete;
    const derivativeGraph = ['derivative-sign', 'derivative-touch'].includes(m.kind);
    const s = { fn, label: derivativeGraph ? 'y = f′(x) — производная' : 'y = f(x) — функция', derivativeGraph, curves: [{ fn, color: C.graph, name: derivativeGraph ? 'derivative' : 'function' }], points: [], guides: [], breaks: [], signs: [], help, complete, target: null, interval: null, minX: -4, maxX: 6, minY: null, maxY: null, caption: '', cursorDomain: null };
    const given = (x, y, name, coordinates = true) => s.points.push({ x, y, name, coordinates, given: true });
    const range = xs => { s.minX = Math.min(0, ...xs) - 1; s.maxX = Math.max(0, ...xs) + 1; };
    switch (m.kind) {
      case 'tangent': {
        range([m.a[0], m.b[0], m.x0]);
        const slope = (m.b[1] - m.a[1]) / (m.b[0] - m.a[0]), line = x => m.a[1] + slope * (x - m.a[0]);
        s.curves.push({ fn: line, color: C.tangent, name: 'tangent' });
        given(m.a[0], m.a[1], 'A'); given(m.b[0], m.b[1], 'B'); given(m.x0, fn(m.x0), 'Касание', false);
        if (help) s.triangle = [m.a, [m.b[0], m.a[1]], m.b];
        s.caption = 'Синяя линия — функция. Оранжевая прямая — касательная. A и B лежат на касательной.';
        s.helperLabel = 'Показать два движения по касательной';
        s.helperText = 'От A идём по горизонтали, затем по вертикали до B. Производная — отношение изменения y к изменению x.';
        break;
      }
      case 'derivative-sign': {
        s.minX = m.left - 2; s.maxX = m.right + 2;
        if (help) {
          s.guides.push(m.left, m.right);
          const sign = m.coefficient > 0 ? '+' : '−', middle = m.coefficient > 0 ? '−' : '+';
          s.signs.push([m.left - 1, sign], [(m.left + m.right) / 2, middle], [m.right + 1, sign]);
        }
        s.caption = 'Здесь показана производная f′. Пересечения с осью x читаем по сетке. Экстремум самой функции ищем по смене знака.';
        s.helperLabel = 'Показать знаки производной';
        s.helperText = 'Выше оси: f′ > 0, функция возрастает. Ниже оси: f′ < 0, функция убывает.';
        break;
      }
      case 'derivative-touch': {
        s.minX = m.zero - 3; s.maxX = m.zero + 3;
        if (help) { s.guides.push(m.zero); s.signs.push([m.zero - 1.5, m.coefficient > 0 ? '+' : '−'], [m.zero + 1.5, m.coefficient > 0 ? '+' : '−']); }
        s.caption = 'Это график производной f′. В точке касания производная равна нулю. Проверь, меняется ли её знак.';
        s.helperLabel = 'Показать знаки по обе стороны'; s.helperText = 'Одинаковые знаки слева и справа: направление изменения функции сохраняется.';
        break;
      }
      case 'graph-negative-count': {
        s.minX = Math.min(...m.marked) - .5; s.maxX = Math.max(...m.marked) + .5;
        m.marked.forEach((x, i) => given(x, fn(x), String(i + 1), false));
        if (help) s.markedTangents = m.marked.map(x => ({ x, y: fn(x), slope: m.scale * (3 * x * x - 3 * m.a * m.a) }));
        s.caption = 'Показана сама функция f. Номера точек идут слева направо в том же порядке, что и значения x в условии.';
        s.helperLabel = 'Показать наклон в отмеченных точках';
        s.helperText = 'Касательная идёт вниз слева направо — производная отрицательна. Горизонтальная касательная означает ноль.';
        break;
      }
      case 'integral-line': case 'integral-crossing': {
        s.minX = Math.min(0, m.left) - .5; s.maxX = Math.max(0, m.right) + .5; s.interval = [m.left, m.right];
        const middle = m.kind === 'integral-crossing' ? m.zero : null;
        s.areas = middle === null ? [[m.left, m.right]] : [[m.left, middle], [middle, m.right]];
        given(m.left, fn(m.left), 'a', false); given(m.right, fn(m.right), 'b', false);
        if (help) { s.guides.push(m.left, m.right); if (middle !== null) s.guides.push(middle); }
        s.caption = 'Закрашена фигура, площадь которой требуется найти. Площадь каждой части положительна.';
        s.helperLabel = 'Выделить границы частей';
        s.helperText = middle === null ? 'На данном отрезке график выше оси x. Площадь равна F(b) − F(a).' : 'Слева и справа от пересечения получились две части. Их площади складываем.';
        break;
      }
      case 'primitive-value': {
        range([m.x0, m.target]); s.label = 'y = f(x) = F′(x)';
        s.caption = 'Здесь график f — производной искомой F. Условие F(' + fmt(m.x0) + ') = ' + fmt(m.y0) + ' относится к другой функции, поэтому на этой прямой оно не отмечено.';
        s.helperLabel = 'Напомнить связь f и F'; s.helperText = 'Производная F должна дать эту прямую f. Постоянная C на производную не влияет.';
        break;
      }
      case 'extreme-quadratic': case 'extreme-cubic': {
        s.minX = m.left - .7; s.maxX = m.right + .7; s.interval = [m.left, m.right];
        given(m.left, fn(m.left), 'Левый конец', false); given(m.right, fn(m.right), 'Правый конец', false);
        if (help) {
          const critical = m.kind === 'extreme-quadratic' ? [m.h] : [-m.a, m.a];
          critical.filter(x => x > m.left && x < m.right).forEach(x => { s.guides.push(x); s.points.push({ x, y: fn(x), name: 'f′ = 0', given: false, coordinates: complete }); });
        }
        s.caption = 'Светлая полоса — данный отрезок. Два отмеченных конца входят в него. Сравниваем значения f(x), то есть высоты точек.';
        s.helperLabel = 'Отметить точки для проверки'; s.helperText = 'Проверяем оба конца и только те точки f′ = 0, которые лежат внутри отрезка.';
        break;
      }
      case 'line-value':
        range([m.a[0], m.b[0], m.target]); given(m.a[0], m.a[1], 'A'); given(m.b[0], m.b[1], 'B'); s.target = m.target;
        if (help) s.triangle = [m.a, [m.b[0], m.a[1]], m.b];
        s.caption = 'Точки A и B взяты из условия. Прямая проходит через обе.';
        s.helperLabel = 'Показать изменение x и y'; s.helperText = 'Одинаковый порядок в двух разностях: координата B минус координата A.';
        break;
      case 'parabola-value':
        range([m.h, m.px, m.target]); given(m.h, m.k, 'Вершина'); given(m.px, m.py, 'A'); s.target = m.target;
        if (help) s.guides.push(m.h);
        s.caption = 'Вершина и точка A заданы в условии. Пунктир можно включить, чтобы увидеть ось симметрии.';
        s.helperLabel = 'Показать ось симметрии'; s.helperText = 'Ось симметрии проходит через вершину. Одинаковое расстояние от неё даёт одинаковые значения y.';
        break;
      case 'hyperbola-value':
        range([m.h, m.px, m.target]); given(m.px, m.py, 'A'); s.target = m.target; s.breaks = [m.h];
        s.minY = Math.min(0, m.b - 8, m.py - 2); s.maxY = Math.max(0, m.b + 8, m.py + 2); s.asymptotes = { x: m.h, y: m.b };
        s.caption = 'Две ветви не соединяются. Вертикальный пунктир: знаменатель равен нулю. На этой прямой точек графика нет.';
        s.helperLabel = 'Выделить асимптоты'; s.helperText = 'Вертикальная асимптота x = ' + fmt(m.h) + '; горизонтальная y = ' + fmt(m.b) + '.';
        break;
      case 'exponential-value':
        range([m.px, m.target]); given(m.px, m.py, 'A'); s.target = m.target;
        s.minY = Math.min(0, m.shift - 2); s.maxY = Math.max(m.py, fn(m.target), m.shift) + 3;
        s.asymptotes = { y: m.shift };
        s.caption = 'Показательная функция определена при любом x. Горизонтальный пунктир показывает сдвиг графика.';
        s.helperLabel = 'Выделить известную точку'; s.helperText = 'У точки A первая координата равна 1. Поэтому aˣ здесь превращается в a.';
        break;
      case 'logarithm-value':
        s.minX = -1; s.maxX = Math.max(m.px, m.target) + Math.max(1, Math.max(m.px, m.target) * .12);
        given(m.px, m.py, 'A'); s.target = m.target; s.breaks = [0]; s.cursorDomain = [.25, s.maxX];
        s.minY = Math.min(0, m.shift - 3); s.maxY = Math.max(m.py, fn(m.target)) + 2;
        s.caption = 'Логарифмический график есть только при x > 0. Точка A задана в условии.';
        s.helperLabel = 'Показать координаты точки на осях'; s.helperText = 'Подставляем обе координаты A в одну формулу. Сначала вычитаем число вне логарифма.';
        break;
      default: {
        range([m.x - 2, m.x + 2]);
        if (m.kind === 'derivative-logarithm' || m.kind === 'derivative-root') { s.minX = -1; s.maxX = m.x + 3; s.cursorDomain = [.25, s.maxX]; }
        if (m.kind === 'derivative-logarithm') s.breaks = [0];
        if (m.kind === 'derivative-reciprocal') { s.breaks = [0]; s.minY = -Math.max(8, Math.abs(fn(m.x)) * 2); s.maxY = -s.minY; s.asymptotes = { x: 0, y: 0 }; }
        given(m.x, fn(m.x), 'x = ' + fmt(m.x), false);
        s.caption = 'Это исходная функция f(x). Требуется наклон касательной f′ в отмеченной точке, а не её высота.';
        s.helperLabel = 'Показать касательную'; s.helperText = 'Касательная касается графика в точке с заданным x. Её наклон — значение производной.';
        if (help) {
          const x = m.x, derivative = m.kind === 'derivative-quadratic' ? 2 * m.a * x + m.b : m.kind === 'derivative-cubic' ? 3 * m.a * x * x + m.b : m.kind === 'derivative-reciprocal' ? -m.a / (x * x) : m.kind === 'derivative-exponential' ? m.a * Math.exp(x) : m.kind === 'derivative-logarithm' ? m.a / x : m.a / (2 * Math.sqrt(x));
          s.curves.push({ fn: p => fn(x) + derivative * (p - x), color: C.tangent, name: 'tangent' });
        }
      }
    }
    if (independent && !help) {
      // The graph and its givens remain available. Reading the task must not
      // silently disclose which theorem, sign change or construction to use.
      s.caption = derivativeGraph ? 'На рисунке дан график производной f′(x).' : 'На рисунке дан график из условия задачи.';
      s.helperLabel = 'Показать подсказку к рисунку';
    }
    if (help && ['exponential-value', 'logarithm-value'].includes(m.kind)) s.projections = [[m.px, m.py]];
    if (help && s.target !== null) s.guides.push(s.target);
    // A graph may legitimately contain the answer geometrically. Numeric answer
    // labels are reserved for an accepted answer or an explicitly opened helper.
    if (complete && s.target !== null) s.points.push({ x: s.target, y: fn(s.target), name: 'Найдено', coordinates: true, given: false });
    if (s.minY === null || s.maxY === null) {
      const values = [0, ...s.points.map(p => p.y)];
      for (const curve of s.curves) for (let i = 0; i <= 120; i++) {
        const x = s.minX + (s.maxX - s.minX) * i / 120, y = curve.fn(x); if (finite(y)) values.push(y);
      }
      const lo = Math.min(...values), hi = Math.max(...values), pad = Math.max(1, (hi - lo) * .12);
      s.minY = lo - pad; s.maxY = hi + pad;
    }
    s.tickX = niceStep(s.maxX - s.minX, 9); s.tickY = niceStep(s.maxY - s.minY, 7);
    s.cursorDomain = s.cursorDomain || [s.minX, s.maxX];
    return s;
  }
  function curveSegments(scene, curve, samples = 300) {
    // Split at every asymptote before sampling: a straight segment must never
    // connect different branches of a hyperbola or cross an undefined x.
    const boundaries = [scene.minX, ...scene.breaks.filter(x => x > scene.minX && x < scene.maxX), scene.maxX].sort((a, b) => a - b);
    const segments = [];
    for (let part = 0; part < boundaries.length - 1; part++) {
      const width = boundaries[part + 1] - boundaries[part], epsilon = width / (samples * 8);
      const from = boundaries[part] + (scene.breaks.includes(boundaries[part]) ? epsilon : 0), to = boundaries[part + 1] - (scene.breaks.includes(boundaries[part + 1]) ? epsilon : 0);
      let current = [];
      for (let i = 0; i <= samples; i++) {
        const x = from + (to - from) * i / samples, y = curve.fn(x);
        if (finite(y)) current.push([x, y]); else if (current.length) { segments.push(current); current = []; }
      }
      if (current.length) segments.push(current);
    }
    return segments;
  }
  function svgFor(task, context, options, id) {
    const s = sceneFor(task, context, options), W = 480, H = 358, box = { left: 48, right: 444, top: 42, bottom: 306 };
    const px = x => box.left + (x - s.minX) / (s.maxX - s.minX) * (box.right - box.left);
    const py = y => box.bottom - (y - s.minY) / (s.maxY - s.minY) * (box.bottom - box.top);
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const zeroX = clamp(px(0), box.left, box.right), zeroY = clamp(py(0), box.top, box.bottom);
    const text = (x, y, value, attrs = '') => '<text x="' + x + '" y="' + y + '" font-family="system-ui,sans-serif" font-size="14" fill="' + C.ink + '" ' + attrs + '>' + escape(value) + '</text>';
    const line = (x1, y1, x2, y2, color, extra = '') => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" ' + extra + '/>';
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + escape(s.label + '. ' + s.caption) + '" data-function-kind="' + task.meta.kind + '" style="width:100%;height:auto;display:block"><title>' + escape(s.label) + '</title><defs><clipPath id="' + id + '"><rect x="48" y="42" width="396" height="264"/></clipPath></defs><rect width="480" height="358" fill="#fff"/>';
    svg += text(16, 24, s.label, 'font-weight="700"');
    if (s.interval) svg += '<rect x="' + px(s.interval[0]) + '" y="42" width="' + (px(s.interval[1]) - px(s.interval[0])) + '" height="264" fill="#e9f3ed" data-given-interval="true"/>';
    const xStart = Math.ceil(s.minX / s.tickX) * s.tickX, yStart = Math.ceil(s.minY / s.tickY) * s.tickY;
    for (let i = 0, x = xStart; x <= s.maxX + 1e-8 && i < 30; x = xStart + (++i) * s.tickX) {
      svg += line(px(x), box.top, px(x), box.bottom, C.grid, 'stroke-width="1"');
      svg += text(px(x), box.bottom + 19, fmt(x), 'text-anchor="middle" font-size="13"');
    }
    for (let i = 0, y = yStart; y <= s.maxY + 1e-8 && i < 30; y = yStart + (++i) * s.tickY) {
      svg += line(box.left, py(y), box.right, py(y), C.grid, 'stroke-width="1"');
      svg += text(box.left - 7, py(y) + 4, fmt(y), 'text-anchor="end" font-size="13"');
    }
    svg += line(box.left, zeroY, box.right + 6, zeroY, C.muted, 'stroke-width="1.6"');
    // Do not mislabel a clipped vertical line as x=0: the plotted y-axis exists
    // only when zero is in the displayed x interval.
    if (s.minX <= 0 && s.maxX >= 0) svg += line(zeroX, box.bottom, zeroX, box.top - 5, C.muted, 'stroke-width="1.6"');
    svg += text(box.right + 11, zeroY + 5, 'x');
    svg += text(s.minX <= 0 && s.maxX >= 0 ? zeroX + 8 : box.left + 8, 38, s.derivativeGraph ? 'f′' : 'y');
    svg += '<g clip-path="url(#' + id + ')">';
    if (s.areas) for (const [left, right] of s.areas) {
      const fill = s.fn((left + right) / 2) < 0 ? '#e8b59e' : '#a7d5bb';
      const d = 'M' + px(left) + ' ' + py(0) + ' L' + px(left) + ' ' + py(s.fn(left)) + ' L' + px(right) + ' ' + py(s.fn(right)) + ' L' + px(right) + ' ' + py(0) + ' Z';
      svg += '<path d="' + d + '" fill="' + fill + '" fill-opacity=".6" data-area-left="' + left + '" data-area-right="' + right + '"/>';
    }
    if (s.asymptotes) {
      const color = s.help ? C.tangent : '#7d8c95';
      if (finite(s.asymptotes.x)) svg += line(px(s.asymptotes.x), box.top, px(s.asymptotes.x), box.bottom, color, 'stroke-width="1.6" stroke-dasharray="5 5" data-asymptote="vertical"');
      if (finite(s.asymptotes.y)) svg += line(box.left, py(s.asymptotes.y), box.right, py(s.asymptotes.y), color, 'stroke-width="1.6" stroke-dasharray="5 5" data-asymptote="horizontal"');
    }
    for (const curve of s.curves) for (const points of curveSegments(s, curve)) {
      const d = points.map((p, i) => (i ? 'L' : 'M') + px(p[0]).toFixed(3) + ' ' + py(p[1]).toFixed(3)).join(' ');
      svg += '<path d="' + d + '" fill="none" stroke="' + curve.color + '" stroke-width="2.6" data-curve="' + curve.name + '"/>';
    }
    if (s.help) {
      svg += '<g data-helper="true">';
      for (const t of s.markedTangents || []) {
        const dx = .3, color = t.slope < 0 ? C.negative : t.slope > 0 ? C.positive : C.muted;
        svg += line(px(t.x - dx), py(t.y - t.slope * dx), px(t.x + dx), py(t.y + t.slope * dx), color, 'stroke-width="3.2" data-marked-tangent="true"');
      }
      for (const x of s.guides) svg += line(px(x), box.top, px(x), box.bottom, C.tangent, 'stroke-width="1.5" stroke-dasharray="5 5"');
      if (s.triangle) for (let i = 0; i < 2; i++) { const a = s.triangle[i], b = s.triangle[i + 1]; svg += line(px(a[0]), py(a[1]), px(b[0]), py(b[1]), C.tangent, 'stroke-width="2.5" stroke-dasharray="6 4" data-movement="' + (i ? 'y' : 'x') + '"'); }
      for (const [x, y] of s.projections || []) { svg += line(px(x), py(y), px(x), zeroY, C.tangent, 'stroke-dasharray="4 4"'); svg += line(px(x), py(y), zeroX, py(y), C.tangent, 'stroke-dasharray="4 4"'); }
      for (const [x, sign] of s.signs) svg += text(px(x), clamp(zeroY + 32, box.top + 22, box.bottom - 10), sign, 'text-anchor="middle" font-size="24" font-weight="700"');
      svg += '</g>';
    }
    for (const point of s.points) {
      const x = px(point.x), y = py(point.y);
      svg += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + (point.given ? C.ink : C.tangent) + '" data-given="' + String(point.given) + '" data-x="' + point.x + '" data-y="' + point.y + '"/>';
    }
    if (options && options.explore) {
      const x = Number(options.cursor), y = s.fn(x);
      if (finite(x) && finite(y)) {
        svg += line(px(x), zeroY, px(x), py(y), C.tangent, 'stroke-width="1.5" stroke-dasharray="4 4"');
        svg += '<circle cx="' + px(x) + '" cy="' + py(y) + '" r="5" fill="#fff" stroke="' + C.tangent + '" stroke-width="2.5" data-cursor="true"/>';
      }
    }
    svg += '</g>';
    // Labels outside the clip remain readable; long coordinate labels go into
    // the HTML legend, avoiding collisions and cropped text on a narrow screen.
    for (const point of s.points) {
      const x = px(point.x), y = py(point.y);
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
      const name = point.name === 'Левый конец' ? 'a' : point.name === 'Правый конец' ? 'b' : point.name === 'Вершина' ? 'V' : point.name === 'Касание' ? 'T' : point.name;
      svg += text(clamp(x + 8, box.left + 5, box.right - 65), clamp(y - 10, box.top + 14, box.bottom - 4), name, 'font-weight="600"');
    }
    svg += text(16, 350, 'Числа на сетке задают масштаб по каждой оси.', 'font-size="12" fill="' + C.muted + '"') + '</svg>';
    return { svg, scene: s };
  }
  function render(container, task, context) {
    context = context || {};
    const doc = container.ownerDocument || document, id = 'function-plot-' + (++serial), options = { help: false, explore: false, cursor: 0 };
    const wrap = doc.createElement('div'); wrap.className = 'function-task-model';
    const plot = doc.createElement('div'), legend = doc.createElement('p'), caption = doc.createElement('p'), controls = doc.createElement('div'), helperText = doc.createElement('p');
    caption.className = 'small'; legend.className = 'small'; controls.className = 'model-controls'; helperText.className = 'small'; helperText.hidden = true; helperText.setAttribute('aria-live', 'polite');
    const button = doc.createElement('button'); button.type = 'button'; button.className = 'button quiet'; button.dataset.modelAction = 'function-help'; button.setAttribute('aria-pressed', 'false'); controls.append(button);
    const details = doc.createElement('details'), summary = doc.createElement('summary'), label = doc.createElement('label'), slider = doc.createElement('input'), output = doc.createElement('p');
    const independent = context.mode === 'independent' && !context.solved;
    details.className = 'extra-help'; summary.textContent = independent ? 'Показать значения на графике (подсказка)' : 'Исследовать график'; details.append(summary);
    label.textContent = 'Переместить точку по оси x'; label.style.display = 'block'; slider.type = 'range'; slider.setAttribute('aria-label', 'Координата x подвижной точки'); slider.style.width = '100%'; output.className = 'small'; output.setAttribute('aria-live', 'polite'); label.append(slider); details.append(label, output);
    wrap.append(plot, legend, caption, controls, helperText, details); container.replaceChildren(wrap);
    const initial = sceneFor(task, context, options);
    options.cursor = task.meta.x ?? task.meta.x0 ?? task.meta.a?.[0] ?? task.meta.px ?? (initial.cursorDomain[0] + initial.cursorDomain[1]) / 2;
    slider.min = String(initial.cursorDomain[0]); slider.max = String(initial.cursorDomain[1]); slider.step = String(niceStep(initial.cursorDomain[1] - initial.cursorDomain[0], 50) / 2); slider.value = String(options.cursor);
    function assist() { if (independent && typeof context.onHelp === 'function') context.onHelp(); }
    function paint() {
      const result = svgFor(task, context, options, id), s = result.scene;
      plot.innerHTML = result.svg; caption.textContent = s.caption;
      legend.textContent = s.points.filter(p => p.coordinates).map(p => p.name + '(' + fmt(p.x) + '; ' + fmt(p.y) + ')').join(' · '); legend.hidden = !legend.textContent;
      button.textContent = independent ? (options.help ? 'Скрыть подсказку' : 'Показать подсказку к рисунку') : (s.helperLabel || 'Показать вспомогательные линии'); button.setAttribute('aria-pressed', String(options.help));
      helperText.textContent = s.helperText; helperText.hidden = !options.help;
      if (options.explore) {
        const x = options.cursor, y = s.fn(x);
        output.textContent = 'x = ' + fmt(x) + '. ' + (finite(y) ? (s.derivativeGraph ? 'f′(x)' : 'f(x)') + ' = ' + fmt(y) + '.' : 'При этом x функция не определена.');
        output.dataset.revealedValue = 'true';
      } else { output.textContent = ''; delete output.dataset.revealedValue; }
    }
    button.onclick = () => { if (!options.help) assist(); options.help = !options.help; paint(); };
    details.ontoggle = () => { if (details.open && !options.explore) assist(); options.explore = details.open; paint(); };
    slider.oninput = () => { options.cursor = Number(slider.value); options.explore = details.open; paint(); };
    paint();
    return () => { button.onclick = null; details.ontoggle = null; slider.oninput = null; };
  }
  const lessons = (root.ProfileLessons || []).filter(l => ['calculus', 'functions'].includes(l.group) && /^(calc-|fn-)/.test(l.id));
  root.ProfileTaskModels = root.ProfileTaskModels || {}; root.ProfileModels = root.ProfileModels || {};
  lessons.forEach(l => {
    l.tasks.forEach(task => { root.ProfileTaskModels[task.id] = render; });
    root.ProfileModels[l.model] = container => render(container, l.tasks[0], { mode: 'guided', step: 0 });
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = { functionFor, sceneFor, curveSegments, svgFor, render };
})(globalThis);
