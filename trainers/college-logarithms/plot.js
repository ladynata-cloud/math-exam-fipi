(function (root) {
  'use strict';
  const E = root.LogCourseCore.E;
  const width = 600, height = 380;
  // A fixed window lets learners compare translations on the same grid.
  const xmin = -5, xmax = 10, ymin = -6, ymax = 6;
  const top = 30, bottom = 340, scale = (bottom - top) / (ymax - ymin);
  const left = (width - (xmax - xmin) * scale) / 2;
  const right = left + (xmax - xmin) * scale;
  const X = x => left + (x - xmin) * scale;
  const Y = y => top + (ymax - y) * scale;

  function render(svg, p, points = [], curve = true) {
    const clip = svg.id + '-clip';
    let s = `<defs><clipPath id="${clip}"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}"/></clipPath></defs>`;
    for (let x = xmin; x <= xmax; x++) {
      s += `<path d="M${X(x)} ${top}V${bottom}" stroke="#dce7df"/><text x="${X(x)}" y="${bottom + 20}" font-size="16" text-anchor="middle" fill="#466158">${x}</text>`;
    }
    for (let y = ymin; y <= ymax; y++) {
      s += `<path d="M${left} ${Y(y)}H${right}" stroke="#dce7df"/><text x="${left - 13}" y="${Y(y) + 5}" font-size="16" text-anchor="end" fill="#466158">${y}</text>`;
    }
    s += `<path d="M${X(0)} ${top}V${bottom}M${left} ${Y(0)}H${right}" fill="none" stroke="#627d70" stroke-width="2"/>`;
    s += `<text x="${right + 10}" y="${Y(0) + 5}" font-size="16">x</text><text x="${left - 20}" y="22" font-size="16">y</text>`;
    if (curve) {
      s += `<path data-asymptote d="M${X(p.h)} ${top}V${bottom}" stroke="#bc712b" stroke-width="2" stroke-dasharray="6 5"/><text x="${X(p.h) + 7}" y="22" font-size="15" fill="#97551c">x = ${p.h}</text>`;
      // Sample by y so the curve approaches the asymptote from its defined side.
      let d = '';
      for (let i = 0; i <= 400; i++) {
        const y = ymin + (ymax - ymin) * i / 400, x = p.h + p.a ** (y - p.k);
        d += (i ? 'L' : 'M') + X(x).toFixed(2) + ' ' + Y(y).toFixed(2);
      }
      s += `<path data-curve d="${d}" clip-path="url(#${clip})" stroke="#14664d" stroke-width="3" fill="none"/>`;
    }
    for (const [x, y] of points) {
      const label = E.escapeHTML('(' + E.formatNumber(x) + '; ' + E.formatNumber(y) + ')');
      s += `<g data-point><circle cx="${X(x)}" cy="${Y(y)}" r="6" fill="#14664d" stroke="white" stroke-width="2"/><text x="${X(x) + 9}" y="${Y(y) - 10}" fill="#183c36" font-size="16">${label}</text></g>`;
    }
    svg.innerHTML = s;
    svg.setAttribute('aria-label', `Логарифмический график, основание ${E.formatNumber(p.a)}, сдвиги ${p.h} и ${p.k}. Отмечено точек: ${points.length}.`);
  }

  function coordinates(svg, event) {
    const rect = svg.getBoundingClientRect(), displayScale = Math.min(rect.width / width, rect.height / height);
    if (!displayScale) return null;
    const x = (event.clientX - rect.left - (rect.width - width * displayScale) / 2) / displayScale;
    const y = (event.clientY - rect.top - (rect.height - height * displayScale) / 2) / displayScale;
    // Accept a rounded click on the outer grid line and snap it back to the grid.
    const edgePixel = 1 / displayScale;
    if (x <= left - edgePixel || x >= right + edgePixel || y <= top - edgePixel || y >= bottom + edgePixel) return null;
    const graphX = Math.min(right, Math.max(left, x)), graphY = Math.min(bottom, Math.max(top, y));
    return [Math.round((xmin + (graphX - left) / scale) * 4) / 4, Math.round((ymax - (graphY - top) / scale) * 4) / 4];
  }

  root.LogCoursePlot = { render, coordinates };
})(window);
