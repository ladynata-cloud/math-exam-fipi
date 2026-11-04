/* Local geometry and rendering for the classic board. Stored coordinates stay unchanged. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoardInk = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MIN_SCALE = 0.2;
  const MAX_SCALE = 4;
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const point = value => value && finite(value.x) && finite(value.y);
  const copyPoint = value => ({ x: value.x, y: value.y });
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lineSize = stroke => Math.max(1, finite(stroke.size) && stroke.size ? stroke.size : 4);
  const textSize = stroke => Math.max(16, (finite(stroke.size) && stroke.size ? stroke.size : 5) * 3 + 12);
  const textLines = stroke => String(stroke.text || '').split(/\r\n|\r|\n|\\n/);

  function constrainEnd(tool, start, end, shift) {
    if (!point(start) || !point(end)) return null;
    if (!shift) return copyPoint(end);
    const dx = end.x - start.x, dy = end.y - start.y;
    if (tool === 'line' || tool === 'arrow') {
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
      const length = Math.hypot(dx, dy);
      return { x: start.x + length * Math.cos(angle), y: start.y + length * Math.sin(angle) };
    }
    if (tool === 'rect' || tool === 'ellipse') {
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      return { x: start.x + (dx < 0 ? -side : side), y: start.y + (dy < 0 ? -side : side) };
    }
    return copyPoint(end);
  }

  // All new figures are ordinary {kind:'path', tool:'pen', points:[...]} strokes.
  function shapePoints(tool, start, end, options = {}) {
    const finish = constrainEnd(tool, start, end, options.shift);
    if (!finish) return [];
    if (tool === 'arrow') {
      const dx = finish.x - start.x, dy = finish.y - start.y;
      const length = Math.hypot(dx, dy);
      if (!length) return [copyPoint(start)];
      const ux = dx / length, uy = dy / length;
      const head = Math.min(22, length * 0.3), wing = head * 0.5;
      return [copyPoint(start), finish,
        { x: finish.x - head * ux - wing * uy, y: finish.y - head * uy + wing * ux },
        copyPoint(finish),
        { x: finish.x - head * ux + wing * uy, y: finish.y - head * uy - wing * ux }];
    }
    const minX = Math.min(start.x, finish.x), maxX = Math.max(start.x, finish.x);
    const minY = Math.min(start.y, finish.y), maxY = Math.max(start.y, finish.y);
    if (tool === 'triangle') {
      const top = { x: (minX + maxX) / 2, y: minY };
      return [top, { x: maxX, y: maxY }, { x: minX, y: maxY }, copyPoint(top)];
    }
    if (tool === 'ellipse') {
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const rx = (maxX - minX) / 2, ry = (maxY - minY) / 2;
      const points = [];
      for (let i = 0; i < 64; i++) {
        const angle = i * Math.PI / 32;
        points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
      }
      points.push(copyPoint(points[0]));
      return points;
    }
    return [];
  }

  function textFont(stroke) {
    return `700 ${textSize(stroke)}px Inter, system-ui, sans-serif`;
  }

  // The caller sets the world-to-screen transform, including devicePixelRatio.
  function drawStroke(ctx, stroke) {
    if (!stroke || typeof stroke !== 'object') return false;
    ctx.save();
    try {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = lineSize(stroke);
      ctx.strokeStyle = stroke.color || '#172033';
      ctx.fillStyle = stroke.color || '#172033';
      ctx.globalAlpha = stroke.tool === 'marker' ? 0.32 : 1;
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      if (stroke.kind === 'path') {
        const points = Array.isArray(stroke.points) ? stroke.points.filter(point) : [];
        if (!points.length) return false;
        ctx.beginPath();
        if (points.length === 1) {
          ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
        return true;
      }
      if ((stroke.kind === 'line' || stroke.kind === 'rect') && point(stroke.start) && point(stroke.end)) {
        if (stroke.kind === 'line') {
          ctx.beginPath();
          ctx.moveTo(stroke.start.x, stroke.start.y);
          ctx.lineTo(stroke.end.x, stroke.end.y);
          ctx.stroke();
        } else {
          ctx.strokeRect(Math.min(stroke.start.x, stroke.end.x), Math.min(stroke.start.y, stroke.end.y),
            Math.abs(stroke.start.x - stroke.end.x), Math.abs(stroke.start.y - stroke.end.y));
        }
        return true;
      }
      if (stroke.kind === 'text' && point(stroke)) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.font = textFont(stroke);
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        textLines(stroke).forEach((line, i) => ctx.fillText(line, stroke.x, stroke.y + i * textSize(stroke) * 1.25));
        return true;
      }
      return false;
    } finally {
      ctx.restore();
    }
  }

  // Use a dedicated transparent canvas. Composite this layer over the background afterwards.
  function renderLayer(ctx, strokes, current) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    if (Array.isArray(strokes)) strokes.forEach(stroke => drawStroke(ctx, stroke));
    if (current) drawStroke(ctx, current);
    return ctx.canvas;
  }

  function strokeBounds(stroke, ctx) {
    if (!stroke || stroke.tool === 'eraser') return null;
    let points = [];
    if (stroke.kind === 'path' && Array.isArray(stroke.points)) points = stroke.points.filter(point);
    else if (stroke.kind === 'image' && point(stroke) && finite(stroke.width) && finite(stroke.height)
      && stroke.width > 0 && stroke.height > 0) {
      return { minX: stroke.x, minY: stroke.y, maxX: stroke.x + stroke.width, maxY: stroke.y + stroke.height };
    }
    else if ((stroke.kind === 'line' || stroke.kind === 'rect') && point(stroke.start) && point(stroke.end)) {
      points = [stroke.start, stroke.end];
    } else if (stroke.kind === 'text' && point(stroke)) {
      const lines = textLines(stroke), fontSize = textSize(stroke);
      if (lines.every(line => !line)) return null;
      let width = 0, left = 0;
      if (ctx && typeof ctx.measureText === 'function') {
        ctx.save();
        try {
          ctx.font = textFont(stroke);
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          for (const line of lines) {
            const metrics = ctx.measureText(line);
            width = Math.max(width, metrics.width || 0, metrics.actualBoundingBoxRight || 0);
            left = Math.max(left, metrics.actualBoundingBoxLeft || 0);
          }
        } finally {
          ctx.restore();
        }
      } else {
        // Conservative fallback before a canvas context is available, including wide glyphs.
        for (const line of lines) width = Math.max(width, Array.from(line).length * fontSize);
      }
      return { minX: stroke.x - left - 2, minY: stroke.y - 2,
        maxX: stroke.x + width + 2, maxY: stroke.y + lines.length * fontSize * 1.25 + 2 };
    }
    if (!points.length) return null;
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const p of points) {
      bounds.minX = Math.min(bounds.minX, p.x);
      bounds.minY = Math.min(bounds.minY, p.y);
      bounds.maxX = Math.max(bounds.maxX, p.x);
      bounds.maxY = Math.max(bounds.maxY, p.y);
    }
    const pad = lineSize(stroke) / 2;
    return { minX: bounds.minX - pad, minY: bounds.minY - pad,
      maxX: bounds.maxX + pad, maxY: bounds.maxY + pad };
  }

  // Erasure is not reconstructed here: bounds conservatively include every non-eraser object.
  function drawingBounds(strokes, ctx) {
    let bounds = null;
    for (const stroke of Array.isArray(strokes) ? strokes : []) {
      const next = strokeBounds(stroke, ctx);
      if (!next) continue;
      if (!bounds) bounds = { ...next };
      else {
        bounds.minX = Math.min(bounds.minX, next.minX);
        bounds.minY = Math.min(bounds.minY, next.minY);
        bounds.maxX = Math.max(bounds.maxX, next.maxX);
        bounds.maxY = Math.max(bounds.maxY, next.maxY);
      }
    }
    return bounds;
  }

  function viewport(value = {}) {
    value = value || {};
    return { scale: finite(value.scale) && value.scale > 0 ? value.scale : 1,
      x: finite(value.x) ? value.x : 0, y: finite(value.y) ? value.y : 0 };
  }

  function screenToWorld(p, view) {
    const v = viewport(view);
    return { x: (p.x - v.x) / v.scale, y: (p.y - v.y) / v.scale };
  }

  function worldToScreen(p, view) {
    const v = viewport(view);
    return { x: p.x * v.scale + v.x, y: p.y * v.scale + v.y };
  }

  function scaleLimits(options) {
    const min = finite(options.minScale) && options.minScale > 0 ? options.minScale : MIN_SCALE;
    const max = finite(options.maxScale) && options.maxScale >= min ? options.maxScale : Math.max(min, MAX_SCALE);
    return { min, max };
  }

  function fitToBounds(bounds, size, options = {}) {
    if (!bounds || !['minX', 'minY', 'maxX', 'maxY'].every(key => finite(bounds[key]))
      || bounds.maxX < bounds.minX || bounds.maxY < bounds.minY
      || !size || !finite(size.width) || !finite(size.height) || size.width <= 0 || size.height <= 0) return viewport();
    const padding = finite(options.padding) ? Math.max(0, options.padding) : 24;
    const availableWidth = Math.max(1, size.width - padding * 2);
    const availableHeight = Math.max(1, size.height - padding * 2);
    const limits = scaleLimits(options);
    const scale = clamp(Math.min(availableWidth / Math.max(1, bounds.maxX - bounds.minX),
      availableHeight / Math.max(1, bounds.maxY - bounds.minY)), limits.min, limits.max);
    return { scale, x: size.width / 2 - (bounds.minX + bounds.maxX) / 2 * scale,
      y: size.height / 2 - (bounds.minY + bounds.maxY) / 2 * scale };
  }

  function pan(view, dx, dy) {
    const next = viewport(view);
    next.x += finite(dx) ? dx : 0;
    next.y += finite(dy) ? dy : 0;
    return next;
  }

  function zoomAt(view, screenPoint, factor, options = {}) {
    const next = viewport(view);
    if (!point(screenPoint) || !finite(factor) || factor <= 0) return next;
    const anchor = screenToWorld(screenPoint, next), limits = scaleLimits(options);
    next.scale = clamp(next.scale * factor, limits.min, limits.max);
    next.x = screenPoint.x - anchor.x * next.scale;
    next.y = screenPoint.y - anchor.y * next.scale;
    return next;
  }

  return Object.freeze({ MIN_SCALE, MAX_SCALE, constrainEnd, shapePoints, drawStroke, renderLayer,
    strokeBounds, drawingBounds, screenToWorld, worldToScreen, fitToBounds, pan, zoomAt });
});
