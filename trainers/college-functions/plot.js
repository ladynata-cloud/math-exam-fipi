(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.CollegeFunctionsPlot = factory(root.CollegeFunctionsData);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Data) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const FRAME = Object.freeze({ width: 640, height: 460, left: 56, right: 618, top: 26, bottom: 418 });
  let sequence = 0;

  function bounds(task) {
    const v = task.viewport;
    if (!Array.isArray(v) || v.length !== 4 || !v.every(Number.isFinite) || v[1] <= v[0] || v[3] <= v[2]) {
      throw new Error('The graph requires a finite increasing viewport.');
    }
    return v;
  }

  function toScreen(task, x, y) {
    const [xmin, xmax, ymin, ymax] = bounds(task);
    return {
      x: FRAME.left + (x - xmin) / (xmax - xmin) * (FRAME.right - FRAME.left),
      y: FRAME.bottom - (y - ymin) / (ymax - ymin) * (FRAME.bottom - FRAME.top)
    };
  }

  function fromScreen(task, x, y) {
    const [xmin, xmax, ymin, ymax] = bounds(task);
    return {
      x: xmin + (x - FRAME.left) / (FRAME.right - FRAME.left) * (xmax - xmin),
      y: ymin + (FRAME.bottom - y) / (FRAME.bottom - FRAME.top) * (ymax - ymin)
    };
  }

  function pointFromEvent(svg, event, task) {
    const clientX = Number(event.clientX), clientY = Number(event.clientY);
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    let screen;
    // An inverse SVG matrix includes CSS transforms and preserveAspectRatio.
    try {
      const matrix = svg.getScreenCTM && svg.getScreenCTM();
      if (matrix && svg.createSVGPoint) {
        const p = svg.createSVGPoint(); p.x = clientX; p.y = clientY;
        screen = p.matrixTransform(matrix.inverse());
      }
    } catch (_) { /* Detached SVGs use the measured fallback below. */ }
    if (!screen) {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const scale = Math.min(rect.width / FRAME.width, rect.height / FRAME.height);
      const offsetX = (rect.width - FRAME.width * scale) / 2;
      const offsetY = (rect.height - FRAME.height * scale) / 2;
      screen = { x: (clientX - rect.left - offsetX) / scale, y: (clientY - rect.top - offsetY) / scale };
    }
    if (screen.x < FRAME.left || screen.x > FRAME.right || screen.y < FRAME.top || screen.y > FRAME.bottom) return null;
    return fromScreen(task, screen.x, screen.y);
  }

  function el(document, name, attrs, content) {
    const node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(key => node.setAttribute(key, String(attrs[key])));
    if (content !== undefined) node.textContent = String(content);
    return node;
  }

  function number(n) {
    if (Math.abs(n) < 1e-9) return '0';
    return String(Number(n.toFixed(5))).replace('.', ',').replace('-', '−');
  }

  function gridStep(span, maxLines) {
    const raw = Math.max(1, span / maxLines);
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].find(factor => factor * magnitude >= raw) * magnitude;
  }

  function ticks(lo, hi, step) {
    const result = [];
    for (let n = Math.ceil(lo / step) * step, i = 0; n <= hi + 1e-9 && i < 80; n += step, i++) result.push(n);
    return result;
  }

  function round(n) { return Number(n.toFixed(3)); }

  function render(svg, task, options) {
    options = options || {};
    const v = bounds(task), document = svg.ownerDocument;
    const [xmin, xmax, ymin, ymax] = v;
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 640 460');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Координатная плоскость. ' + (options.showCurve ? 'График функции ' + (task.formulaText || task.id || '') : 'Отметьте вычисленные точки'));
    const add = (name, attrs, content, parent) => {
      const child = el(document, name, attrs, content); (parent || svg).appendChild(child); return child;
    };
    add('title', {}, options.showCurve ? 'График функции' : 'Построение по точкам');
    const clipId = 'college-functions-plot-' + (++sequence);
    const defs = add('defs', {});
    const clip = add('clipPath', { id: clipId }, undefined, defs);
    add('rect', { x: FRAME.left, y: FRAME.top, width: FRAME.right - FRAME.left, height: FRAME.bottom - FRAME.top }, undefined, clip);
    add('rect', { x: FRAME.left, y: FRAME.top, width: FRAME.right - FRAME.left, height: FRAME.bottom - FRAME.top, fill: '#fff', stroke: '#d6e3df' });
    const gx = gridStep(xmax - xmin, 16), gy = gridStep(ymax - ymin, 14);
    const xAxis = ymin <= 0 && ymax >= 0 ? toScreen(task, 0, 0).y : FRAME.bottom;
    const yAxis = xmin <= 0 && xmax >= 0 ? toScreen(task, 0, 0).x : FRAME.left;
    const grid = add('g', { stroke: '#e2ebe7', 'stroke-width': 1, 'aria-hidden': 'true' });
    ticks(xmin, xmax, gx).forEach(x => {
      const p = toScreen(task, x, 0);
      add('line', { x1: round(p.x), x2: round(p.x), y1: FRAME.top, y2: FRAME.bottom }, undefined, grid);
    });
    ticks(ymin, ymax, gy).forEach(y => {
      const p = toScreen(task, 0, y);
      add('line', { x1: FRAME.left, x2: FRAME.right, y1: round(p.y), y2: round(p.y) }, undefined, grid);
    });
    const axes = add('g', { stroke: '#40564e', 'stroke-width': 1.6, fill: '#40564e', 'aria-hidden': 'true' });
    add('line', { x1: FRAME.left, x2: FRAME.right + 5, y1: round(xAxis), y2: round(xAxis) }, undefined, axes);
    add('path', { d: `M${FRAME.right + 5} ${round(xAxis)} l-7 -4 v8 z`, stroke: 'none' }, undefined, axes);
    add('line', { x1: round(yAxis), x2: round(yAxis), y1: FRAME.bottom, y2: FRAME.top - 5 }, undefined, axes);
    add('path', { d: `M${round(yAxis)} ${FRAME.top - 5} l-4 7 h8 z`, stroke: 'none' }, undefined, axes);
    const textAttrs = { fill: '#40564e', 'font-family': 'system-ui, sans-serif', 'font-size': 14, 'aria-hidden': 'true' };
    const tx = gridStep(xmax - xmin, 9), ty = gridStep(ymax - ymin, 9);
    ticks(xmin, xmax, tx).forEach(x => {
      const p = toScreen(task, x, 0);
      add('text', { ...textAttrs, x: round(p.x - (Math.abs(x) < 1e-9 ? 8 : 0)), y: Math.min(FRAME.bottom + 22, xAxis + 21), 'text-anchor': Math.abs(x) < 1e-9 ? 'end' : 'middle' }, number(x));
    });
    ticks(ymin, ymax, ty).forEach(y => {
      if (Math.abs(y) < 1e-9) return;
      const p = toScreen(task, 0, y);
      add('text', { ...textAttrs, x: yAxis - 9, y: round(p.y + 5), 'text-anchor': 'end' }, number(y));
    });
    add('text', { ...textAttrs, x: FRAME.right + 10, y: Math.min(FRAME.bottom + 19, xAxis - 7), 'font-size': 17 }, 'x');
    add('text', { ...textAttrs, x: yAxis + 9, y: FRAME.top - 8, 'font-size': 17 }, 'y');
    const clipped = add('g', { 'clip-path': `url(#${clipId})` });

    if (options.showCurve && options.showGuides) {
      (task.asymptotes || []).forEach(guide => {
        const axis = guide.axis, value = guide.value;
        if (!Number.isFinite(value)) return;
        if (axis === 'x' && value >= xmin && value <= xmax) {
          const p = toScreen(task, value, 0);
          add('line', { x1: round(p.x), x2: round(p.x), y1: FRAME.top, y2: FRAME.bottom, stroke: '#bb7d26', 'stroke-width': 1.6, 'stroke-dasharray': '6 5', 'data-guide': 'x' }, undefined, clipped);
        } else if (axis === 'y' && value >= ymin && value <= ymax) {
          const p = toScreen(task, 0, value);
          add('line', { x1: FRAME.left, x2: FRAME.right, y1: round(p.y), y2: round(p.y), stroke: '#bb7d26', 'stroke-width': 1.6, 'stroke-dasharray': '6 5', 'data-guide': 'y' }, undefined, clipped);
        }
      });
    }

    if (options.showCurve) {
      curvePaths(task).forEach(d => add('path', { d, fill: 'none', stroke: '#176c96', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-curve': 'true' }, undefined, clipped));
      const unique = new Map();
      (task.endpoints || []).forEach(point => {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
        const key = point.x + ',' + point.y;
        const old = unique.get(key);
        unique.set(key, { x: point.x, y: point.y, closed: Boolean(point.closed || (old && old.closed)) });
      });
      unique.forEach(point => {
        const p = toScreen(task, point.x, point.y);
        add('circle', { cx: round(p.x), cy: round(p.y), r: point.closed ? 4 : 4.6, fill: point.closed ? '#176c96' : '#fff', stroke: '#176c96', 'stroke-width': 2, 'data-endpoint': point.closed ? 'closed' : 'open' }, undefined, clipped);
      });
    }

    (options.points || []).forEach(point => {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      const p = toScreen(task, point.x, point.y);
      add('circle', { cx: round(p.x), cy: round(p.y), r: 4, fill: '#12815c', stroke: '#fff', 'stroke-width': 1.2, 'data-point': 'checked' }, undefined, clipped);
      if (point.label) add('text', { ...textAttrs, x: Math.min(FRAME.right - 5, Math.max(FRAME.left + 6, p.x + 9)), y: Math.max(FRAME.top + 18, p.y - 9), 'text-anchor': p.x > FRAME.right - 90 ? 'end' : 'start', fill: '#0b6d4b' }, point.label, clipped);
    });
    return svg;
  }

  // Every piece is sampled separately, including its one-sided boundary value.
  // In particular, the limit from an open branch must not use the next branch.
  function curvePaths(task) {
    const [xmin, xmax] = bounds(task), paths = [];
    const bound = value => value === '-inf' ? -Infinity : value === 'inf' ? Infinity : value;
    const domain = task.domain && task.domain.intervals ? task.domain.intervals : [{lo: '-inf', hi: 'inf'}];
    const branches = task.model.kind === 'piecewise' ? task.model.branches : [{model: task.model, lo: '-inf', hi: 'inf'}];
    branches.forEach(branch => domain.forEach(interval => {
      const lo = Math.max(xmin, bound(branch.lo), bound(interval.lo));
      const hi = Math.min(xmax, bound(branch.hi), bound(interval.hi));
      if (!(hi > lo)) return;
      const count = Math.max(2, Math.ceil(900 * (hi - lo) / (xmax - xmin)));
      let path = '', pointCount = 0;
      const flush = () => {
        if (pointCount >= 2) paths.push(path.trim());
        path = ''; pointCount = 0;
      };
      for (let i = 0; i <= count; i++) {
        const x = i === count ? hi : lo + (hi - lo) * i / count;
        const y = Data.evalModel(branch.model, x);
        if (!Number.isFinite(y)) { flush(); continue; }
        const p = toScreen(task, x, y);
        // Clip is handled by SVG. The cap only prevents pathological numerical
        // coordinates from creating an unbounded SVG path or invalid rendering.
        const sy = Math.max(-1000000, Math.min(1000000, p.y));
        path += (pointCount ? ' L' : 'M') + round(p.x) + ' ' + round(sy);
        pointCount++;
      }
      flush();
    }));
    return paths;
  }

  return { render, pointFromEvent, toScreen, fromScreen, curvePaths, frame: FRAME };
}));
