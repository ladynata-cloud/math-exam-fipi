(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CollegeLogarithmsPlot = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FRAME = Object.freeze({width: 640, height: 400, left: 54, right: 616, top: 28, bottom: 350});
  const INK = '#233b43', GREEN = '#13845e', AMBER = '#b77918', GRID = '#e4ece9';
  let sequence = 0;

  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function escape(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  }
  function rounded(value) {
    if (!finite(value)) throw new TypeError('SVG coordinates must be finite numbers.');
    return String(Number(value.toFixed(7)));
  }
  function config(model) {
    if (!model || typeof model !== 'object' || Array.isArray(model)) throw new TypeError('A logarithm model is required.');
    const m = {base: model.base, h: model.h === undefined ? 0 : model.h,
      k: model.k === undefined ? 0 : model.k, sign: model.sign === undefined ? 1 : model.sign};
    if (!finite(m.base) || m.base <= 0 || m.base === 1 || !finite(m.h) || !finite(m.k) ||
        Math.abs(m.h) > 1000 || Math.abs(m.k) > 1000 || ![1, -1].includes(m.sign)) {
      throw new RangeError('Use a positive base other than 1, finite shifts and a sign of 1 or -1.');
    }
    return m;
  }

  // A common origin and a visible asymptote make the shifts readable. The
  // viewport is independent of target points, so an exercise never leaks them.
  function bounds(model) {
    const m = config(model);
    return {xmin: Math.min(-2, m.h - 2), xmax: Math.max(10, m.h + 10),
      ymin: Math.min(-4, m.k - 4), ymax: Math.max(4, m.k + 4)};
  }
  function pixel(x, y, b) {
    return {x: FRAME.left + (x - b.xmin) / (b.xmax - b.xmin) * (FRAME.right - FRAME.left),
      y: FRAME.bottom - (y - b.ymin) / (b.ymax - b.ymin) * (FRAME.bottom - FRAME.top)};
  }
  function toPixel(x, y, model) {
    if (!finite(x) || !finite(y)) throw new TypeError('Point coordinates must be finite numbers.');
    return pixel(x, y, bounds(model));
  }
  function toData(svgX, svgY, model) {
    if (!finite(svgX) || !finite(svgY)) throw new TypeError('Point coordinates must be finite numbers.');
    const b = bounds(model);
    return {x: b.xmin + (svgX - FRAME.left) / (FRAME.right - FRAME.left) * (b.xmax - b.xmin),
      y: b.ymin + (FRAME.bottom - svgY) / (FRAME.bottom - FRAME.top) * (b.ymax - b.ymin)};
  }
  function valueAt(x, model) {
    const m = config(model);
    if (!finite(x) || x <= m.h) return NaN;
    return m.sign * Math.log(x - m.h) / Math.log(m.base) + m.k;
  }

  // Sampling the inverse x=h+a^((y-k)/sign) resolves the steep part of the
  // logarithm near its asymptote. We sample only the visible domain; no segment
  // is ever drawn from the forbidden half-plane to the valid branch.
  function curvePoints(model, viewport) {
    const m = config(model), b = viewport || bounds(m);
    const right = b.xmax - m.h;
    if (!(right > 0)) return [];
    const increasing = m.sign / Math.log(m.base) > 0;
    const leftY = b.xmin > m.h ? valueAt(b.xmin, m) : (increasing ? -Infinity : Infinity);
    const rightY = valueAt(b.xmax, m);
    const lo = Math.max(b.ymin, Math.min(leftY, rightY));
    const hi = Math.min(b.ymax, Math.max(leftY, rightY));
    if (!finite(lo) || !finite(hi) || hi <= lo) return [];
    const count = Math.min(640, Math.max(64, Math.ceil((hi - lo) * 48)));
    const points = [];
    for (let i = 0; i <= count; i++) {
      const y = lo + (hi - lo) * i / count;
      const x = m.h + Math.pow(m.base, (y - m.k) / m.sign);
      if (!finite(x) || x <= m.h || x < b.xmin - 1e-9 || x > b.xmax + 1e-9) continue;
      points.push({x: Math.min(b.xmax, Math.max(b.xmin, x)), y});
    }
    return points;
  }
  function pathInFrame(model, viewport) {
    const m = config(model), b = viewport || bounds(m), edge = pixel(m.h, 0, b).x;
    const values = curvePoints(m, b).map(p => pixel(p.x, p.y, b)).filter(p => Number(rounded(p.x)) > Number(rounded(edge)));
    if (values.length < 2) return '';
    return values.map((p, i) => (i ? 'L' : 'M') + rounded(p.x) + ' ' + rounded(p.y)).join(' ');
  }
  function curvePath(model) { return pathInFrame(model, bounds(model)); }

  function niceStep(span, lines) {
    const raw = span / lines, magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 5, 10].find(n => n * magnitude >= raw) * magnitude;
  }
  function ticks(lo, hi, step) {
    const result = [];
    for (let n = Math.ceil(lo / step) * step, i = 0; n <= hi + step * 1e-7 && i < 100; n += step, i++) {
      result.push(Math.abs(n) < step * 1e-7 ? 0 : n);
    }
    return result;
  }
  function rational(value) {
    if (!finite(value)) return null;
    for (let d = 1; d <= 100; d++) {
      const n = Math.round(value * d);
      if (Math.abs(value - n / d) <= 1e-10) return {n, d};
    }
    return null;
  }
  function number(value) {
    if (Math.abs(value) < 1e-10) return '0';
    const r = rational(value);
    if (r && r.d !== 1 && ![2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 100].includes(r.d)) {
      return String(r.n).replace('-', '−') + '/' + r.d;
    }
    const n = Number(value.toFixed(6));
    return (Math.abs(n - value) > 1e-9 ? '≈' : '') + String(n).replace('.', ',').replace('-', '−');
  }
  function text(x, y, content, attrs) {
    const extra = Object.entries(attrs || {}).map(([key, value]) => ' ' + key + '="' + escape(value) + '"').join('');
    return '<text x="' + rounded(x) + '" y="' + rounded(y) + '" font-family="system-ui,sans-serif" fill="' + INK + '"' + extra + '>' + escape(content) + '</text>';
  }
  function numberLabel(value, x, y, color, size) {
    const r = rational(value), fontSize = size || 17;
    if (r && r.d !== 1 && ![2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 100].includes(r.d)) {
      const numerator = String(r.n).replace('-', '−'), denominator = String(r.d);
      const half = Math.max(numerator.length, denominator.length) * fontSize * .27 + 2;
      return '<g data-fraction="' + escape(r.n + '/' + r.d) + '" aria-label="' + escape(number(value)) + '">' +
        text(x, y - 6, numerator, {'text-anchor': 'middle', 'font-size': fontSize * .85, style: 'fill:' + color}) +
        '<line x1="' + rounded(x - half) + '" x2="' + rounded(x + half) + '" y1="' + rounded(y - 2) + '" y2="' + rounded(y - 2) + '" stroke="' + color + '" stroke-width="1.3"/>' +
        text(x, y + 12, denominator, {'text-anchor': 'middle', 'font-size': fontSize * .85, style: 'fill:' + color}) + '</g>';
    }
    return text(x, y + 5, number(value), {'text-anchor': 'middle', 'font-size': fontSize, style: 'fill:' + color});
  }
  function safePoint(p) { return p && finite(p.x) && finite(p.y) && Math.abs(p.x) <= 1e6 && Math.abs(p.y) <= 1e6; }
  function renderGraph(model, options) {
    options = options || {};
    const m = config(model), b = bounds(m), id = 'college-log-plot-' + (++sequence);
    const showCurve = options.showCurve === undefined ? model.showCurve !== false : options.showCurve === true;
    const origin = pixel(0, 0, b), edge = pixel(m.h, 0, b).x;
    const width = FRAME.right - FRAME.left, height = FRAME.bottom - FRAME.top;
    const visible = p => safePoint(p) && p.x >= b.xmin && p.x <= b.xmax && p.y >= b.ymin && p.y <= b.ymax;
    const describedPoints = (options.revealPoints === true && Array.isArray(model.points) ? model.points.slice(0, 100) : [])
      .concat(Array.isArray(options.markedPoints) ? options.markedPoints.slice(0, 100) : []).filter(visible);
    // Describe the visible evidence, not the hidden model parameters: a task
    // may ask the learner to infer the base or a shift from the given graph.
    const ariaText = 'Координатная плоскость. Область определения: x больше ' + number(m.h) +
      '. Пунктирная вертикальная прямая не входит в график.' + (showCurve ?
        (m.sign / Math.log(m.base) > 0 ? ' График возрастает.' : ' График убывает.') :
        ' График пока скрыт: отметьте вычисленные точки.') +
      (describedPoints.length ? ' Отмеченные точки: ' + describedPoints.map(p => '(' + number(p.x) + '; ' + number(p.y) + ')').join(', ') + '.' : '') +
      (visible(options.candidate) ? ' Выбранная точка: (' + number(options.candidate.x) + '; ' + number(options.candidate.y) + ').' : '');
    const parts = ['<svg xmlns="http://www.w3.org/2000/svg" data-log-graph="true" class="log-graph" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="' + id + '-title ' + id + '-desc">',
      '<title id="' + id + '-title">' + escape(showCurve ? 'Логарифмическая функция' : 'Построение логарифмической функции по точкам') + '</title>',
      '<desc id="' + id + '-desc">' + escape(ariaText) + '</desc>',
      '<defs><clipPath id="' + id + '-clip"><rect x="' + FRAME.left + '" y="' + FRAME.top + '" width="' + width + '" height="' + height + '"/></clipPath></defs>',
      '<rect x="' + FRAME.left + '" y="' + FRAME.top + '" width="' + width + '" height="' + height + '" fill="#fff" stroke="#d6e4de"/>',
      '<rect data-domain="excluded" x="' + FRAME.left + '" y="' + FRAME.top + '" width="' + rounded(edge - FRAME.left) + '" height="' + height + '" fill="#f0f3f2"/>'];
    const gx = niceStep(b.xmax - b.xmin, 18), gy = niceStep(b.ymax - b.ymin, 16);
    parts.push('<g stroke="' + GRID + '" stroke-width="1" aria-hidden="true">');
    ticks(b.xmin, b.xmax, gx).forEach(x => {
      const sx = rounded(pixel(x, 0, b).x);
      parts.push('<line x1="' + sx + '" x2="' + sx + '" y1="' + FRAME.top + '" y2="' + FRAME.bottom + '"/>');
    });
    ticks(b.ymin, b.ymax, gy).forEach(y => {
      const sy = rounded(pixel(0, y, b).y);
      parts.push('<line x1="' + FRAME.left + '" x2="' + FRAME.right + '" y1="' + sy + '" y2="' + sy + '"/>');
    });
    parts.push('</g><g stroke="' + INK + '" stroke-width="1.6" aria-hidden="true">',
      '<line x1="' + FRAME.left + '" x2="' + (FRAME.right + 6) + '" y1="' + rounded(origin.y) + '" y2="' + rounded(origin.y) + '"/>',
      '<path d="M' + (FRAME.right + 6) + ' ' + rounded(origin.y) + ' l-8 -4 v8 z" fill="' + INK + '" stroke="none"/>',
      '<line x1="' + rounded(origin.x) + '" x2="' + rounded(origin.x) + '" y1="' + FRAME.bottom + '" y2="' + (FRAME.top - 6) + '"/>',
      '<path d="M' + rounded(origin.x) + ' ' + (FRAME.top - 6) + ' l-4 8 h8 z" fill="' + INK + '" stroke="none"/>', '</g>');
    const tx = niceStep(b.xmax - b.xmin, 9), ty = niceStep(b.ymax - b.ymin, 9);
    ticks(b.xmin, b.xmax, tx).forEach(x => {
      const px = pixel(x, 0, b).x;
      parts.push(text(x === 0 ? px - 7 : px, origin.y + 21, number(x), {'text-anchor': x === 0 ? 'end' : 'middle', 'font-size': 16}));
    });
    ticks(b.ymin, b.ymax, ty).filter(y => y !== 0).forEach(y => parts.push(text(origin.x - 9, pixel(0, y, b).y + 5, number(y), {'text-anchor': 'end', 'font-size': 16})));
    parts.push(text(FRAME.right + 10, origin.y - 8, 'x', {'font-size': 20}), text(origin.x + 9, FRAME.top - 8, 'y', {'font-size': 20}));
    parts.push('<g clip-path="url(#' + id + '-clip)">');
    if (options.referenceModel && showCurve) {
      const reference = pathInFrame(options.referenceModel, b);
      if (reference) parts.push('<path data-curve="reference" d="' + reference + '" fill="none" stroke="#849b91" stroke-width="2" stroke-dasharray="7 5"/>');
    }
    if (finite(model.guideY) && model.guideY >= b.ymin && model.guideY <= b.ymax) {
      const sy = pixel(0, model.guideY, b).y;
      parts.push('<line data-guide="horizontal" x1="' + FRAME.left + '" x2="' + FRAME.right + '" y1="' + rounded(sy) + '" y2="' + rounded(sy) + '" stroke="#397da4" stroke-width="2" stroke-dasharray="6 5"/>');
      parts.push(text(FRAME.right - 8, Math.max(FRAME.top + 18, sy - 8), 'y = ' + number(model.guideY), {'text-anchor': 'end', 'font-size': 16, style: 'fill:#296789;paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round'}));
    }
    parts.push('<line data-asymptote="true" data-x="' + rounded(m.h) + '" x1="' + rounded(edge) + '" x2="' + rounded(edge) + '" y1="' + FRAME.top + '" y2="' + FRAME.bottom + '" stroke="' + AMBER + '" stroke-width="2" stroke-dasharray="6 5"/>');
    if (showCurve) {
      const path = pathInFrame(m, b);
      if (path) parts.push('<path data-curve="function" d="' + path + '" fill="none" stroke="' + GREEN + '" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    function mark(p, kind) {
      if (!safePoint(p) || p.x < b.xmin || p.x > b.xmax || p.y < b.ymin || p.y > b.ymax) return;
      const q = pixel(p.x, p.y, b), candidate = kind === 'candidate';
      const color = candidate ? AMBER : kind === 'reference' ? '#778e85' : GREEN;
      const label = '(' + number(p.x) + '; ' + number(p.y) + ')';
      parts.push('<circle data-point="' + kind + '" data-x="' + rounded(p.x) + '" data-y="' + rounded(p.y) + '" cx="' + rounded(q.x) + '" cy="' + rounded(q.y) + '" r="' + (candidate ? 6.5 : 5.5) + '" fill="' + (candidate ? '#fff' : color) + '" stroke="' + (candidate ? color : '#fff') + '" stroke-width="2.2"><title>' + escape((candidate ? 'Выбранная точка ' : 'Отмеченная точка ') + label) + '</title></circle>');
      if (candidate) parts.push('<path d="M' + rounded(q.x - 3) + ' ' + rounded(q.y) + ' h6 M' + rounded(q.x) + ' ' + rounded(q.y - 3) + ' v6" stroke="' + color + '" stroke-width="1.5"/>');
      const rightAlign = q.x > FRAME.right - 115;
      const labelY = q.y < FRAME.top + 32 ? q.y + 24 : q.y - 12;
      parts.push(text(rightAlign ? q.x - 10 : q.x + 10, labelY, label,
        {'text-anchor': rightAlign ? 'end' : 'start', 'font-size': 16, style: 'fill:' + color + ';paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round'}));
    }
    if (options.revealPoints === true && Array.isArray(model.points)) model.points.slice(0, 100).forEach(p => mark(p, 'reference'));
    if (Array.isArray(options.markedPoints)) options.markedPoints.slice(0, 100).forEach(p => mark(p, 'checked'));
    if (options.candidate) mark(options.candidate, 'candidate');
    parts.push('</g>');
    parts.push(text(FRAME.left, 385, 'Аргумент положителен: x > ' + number(m.h), {'font-size': 17, style: 'fill:#476159'}));
    parts.push(text(FRAME.right, 385, 'Пунктир: x = ' + number(m.h), {'text-anchor': 'end', 'font-size': 17, style: 'fill:' + AMBER}));
    parts.push('</svg>');
    return parts.join('');
  }

  function intervalValue(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('A single interval is required.');
    const lo = value.lo, hi = value.hi;
    if ((lo !== null && (!finite(lo) || Math.abs(lo) > 1e9)) ||
        (hi !== null && (!finite(hi) || Math.abs(hi) > 1e9)) ||
        typeof value.loClosed !== 'boolean' || typeof value.hiClosed !== 'boolean' ||
        (lo === null && value.loClosed) || (hi === null && value.hiClosed) ||
        (lo !== null && hi !== null && lo > hi)) throw new RangeError('Use finite ordered bounds; infinity is always open.');
    return {lo, hi, loClosed: value.loClosed, hiClosed: value.hiClosed};
  }
  function intervalText(v) {
    if (v.lo === v.hi && v.lo !== null) return v.loClosed && v.hiClosed ? '{' + number(v.lo) + '}' : '∅';
    return (v.loClosed ? '[' : '(') + (v.lo === null ? '−∞' : number(v.lo)) + '; ' +
      (v.hi === null ? '+∞' : number(v.hi)) + (v.hiClosed ? ']' : ')');
  }
  function renderInterval(interval, options) {
    options = options || {};
    const main = interval === null || interval === undefined ? null : intervalValue(interval);
    const candidate = options.candidate === null || options.candidate === undefined ? null : intervalValue(options.candidate);
    const values = [main, candidate].filter(Boolean).flatMap(v => [v.lo, v.hi]).filter(v => v !== null);
    const min = values.length ? Math.min(...values) : -4, max = values.length ? Math.max(...values) : 4;
    const pad = min === max ? 3 : Math.max(1, (max - min) * .2);
    const lo = values.length ? Math.floor(min - pad) : -4, hi = values.length ? Math.ceil(max + pad) : 4;
    const y = 70, id = 'college-log-line-' + (++sequence), px = x => FRAME.left + (x - lo) / (hi - lo) * (FRAME.right - FRAME.left);
    const pieces = ['<svg xmlns="http://www.w3.org/2000/svg" data-log-interval="true" class="log-interval" viewBox="0 0 640 158" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="' + id + '-title ' + id + '-desc">',
      '<title id="' + id + '-title">Промежуток на числовой прямой</title>',
      '<desc id="' + id + '-desc">' + escape((main ? 'Решение: ' + intervalText(main) + '. ' : 'Отметьте границы промежутка. ') + (candidate ? 'Ваш выбор: ' + intervalText(candidate) + '.' : '')) + '</desc>',
      '<line x1="' + FRAME.left + '" x2="' + (FRAME.right + 6) + '" y1="' + y + '" y2="' + y + '" stroke="' + INK + '" stroke-width="1.7"/>',
      '<path d="M' + (FRAME.right + 6) + ' ' + y + ' l-8 -4 v8 z" fill="' + INK + '"/>',
      text(FRAME.right + 10, y - 9, 'x', {'font-size': 20})];
    const step = niceStep(hi - lo, 10);
    ticks(lo, hi, step).forEach(n => {
      const x = px(n);
      pieces.push('<line x1="' + rounded(x) + '" x2="' + rounded(x) + '" y1="' + (y - 4) + '" y2="' + (y + 4) + '" stroke="' + INK + '"/>');
      if (!values.some(v => Math.abs(v - n) < step * .2)) pieces.push(text(x, y + 25, number(n), {'text-anchor': 'middle', 'font-size': 16}));
    });
    function draw(v, kind) {
      const isCandidate = kind === 'candidate', cy = isCandidate ? y - 22 : y;
      const color = isCandidate ? AMBER : GREEN;
      const empty = v.lo !== null && v.lo === v.hi && !(v.loClosed && v.hiClosed);
      if (empty) {
        pieces.push(text(FRAME.left, isCandidate ? 24 : 142, (isCandidate ? 'Ваш выбор: ' : '') + 'нет решений', {'font-size': 17, style: 'fill:' + color}));
        return;
      }
      const x1 = v.lo === null ? FRAME.left : px(v.lo), x2 = v.hi === null ? FRAME.right : px(v.hi);
      pieces.push('<g data-interval="' + kind + '">');
      if (x1 !== x2) pieces.push('<line data-solution-segment="' + kind + '" x1="' + rounded(x1) + '" x2="' + rounded(x2) + '" y1="' + cy + '" y2="' + cy + '" stroke="' + color + '" stroke-width="' + (isCandidate ? '3.5' : '6') + '"' + (isCandidate ? ' stroke-dasharray="7 4"' : '') + '/>');
      for (const side of ['lo', 'hi']) {
        const value = v[side], closed = v[side + 'Closed'], x = side === 'lo' ? x1 : x2;
        if (value === null) {
          const dir = side === 'lo' ? 1 : -1;
          pieces.push('<path data-ray="' + (side === 'lo' ? 'left' : 'right') + '" d="M' + rounded(x) + ' ' + cy + ' l' + (dir * 11) + ' -6 v12 z" fill="' + color + '"/>');
        } else {
          if (side === 'hi' && v.lo === v.hi) continue;
          pieces.push('<circle data-bound="' + side + '" data-value="' + rounded(value) + '" data-closed="' + closed + '" cx="' + rounded(x) + '" cy="' + cy + '" r="6.5" fill="' + (closed ? color : '#fff') + '" stroke="' + color + '" stroke-width="2.7"/>');
          pieces.push(numberLabel(value, x, isCandidate ? cy - 20 : cy + 34, color, 18));
        }
      }
      pieces.push('</g>');
      if (isCandidate) pieces.push(text(FRAME.left, 22, 'Ваш промежуток', {'font-size': 16, style: 'fill:' + AMBER}));
    }
    if (main) draw(main, 'solution');
    if (candidate) draw(candidate, 'candidate');
    if (main && !(main.lo !== null && main.lo === main.hi && !(main.loClosed && main.hiClosed))) {
      pieces.push(text(FRAME.left, 143, '● граница входит     ○ граница не входит', {'font-size': 16, style: 'fill:#476159'}));
    }
    pieces.push('</svg>');
    return pieces.join('');
  }

  return {renderGraph, renderInterval, bounds, toPixel, toData, valueAt, curvePoints, curvePath, frame: FRAME};
}));
