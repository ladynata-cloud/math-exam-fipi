(function (root) {
  'use strict';
  // These drawings belong to the current problem. Neither lengths nor answers
  // are calculated for display: every visible value comes from diagram.labels.
  const taskModels = root.ProfileTaskModels = root.ProfileTaskModels || {};
  const labs = root.ProfileModels = root.ProfileModels || {};
  const TAU = Math.PI * 2;
  const BOARD_YAW_LIMIT = 1e6;
  const boardFields = ['taskId', 'yaw', 'pitch', 'extraOpen', 'announcement', 'announcedYaw', 'announcedPitch'];
  const C = { ink: '#264b48', edge: '#48736b', hidden: '#81978f', base: '#bfe3d5', height: '#ae5428', section: '#bcd9f1', face: '#e7f0eb', radius: '#855b98' };
  const names = { box: 'Прямоугольный параллелепипед', cube: 'Куб', prism: 'Призма', pyramid: 'Пирамида', cylinder: 'Цилиндр', cone: 'Конус', sphere: 'Шар', compound: 'Составное тело' };
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, k) => a.map(v => v * k);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mid = (a, b) => mul(add(a, b), 0.5);
  const mean = points => mul(points.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / points.length);
  const finitePositive = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
  const validCamera = (yaw, pitch) => Number.isFinite(yaw) && Math.abs(yaw) <= BOARD_YAW_LIMIT &&
    Number.isFinite(pitch) && pitch >= 0.14 && pitch <= 1.25;
  // Keep ordinary cumulative rotations and their spoken degrees unchanged. Only
  // an extreme accumulated angle is reduced by whole turns before publication.
  const boundedYaw = value => Math.abs(value) > BOARD_YAW_LIMIT ? value % TAU : value;
  function readBoardState(taskId, value) {
    try {
      if (value === null || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
        Reflect.ownKeys(value).length !== boardFields.length) return null;
      const state = {};
      for (const key of boardFields) {
        const property = Object.getOwnPropertyDescriptor(value, key);
        if (!property || !property.enumerable || !Object.hasOwn(property, 'value')) return null;
        state[key] = property.value;
      }
      if (state.taskId !== taskId || !validCamera(state.yaw, state.pitch) || typeof state.extraOpen !== 'boolean' ||
        !['none', 'rotate', 'reset', 'top', 'side'].includes(state.announcement)) return null;
      if (state.announcement === 'rotate' ? !validCamera(state.announcedYaw, state.announcedPitch) :
        state.announcedYaw !== null || state.announcedPitch !== null) return null;
      return state;
    } catch (_) { return null; }
  }
  function shown(key, value) {
    const text = String(value);
    if (key === 'scale' || key === 'cut' || text === key || /=|основан|поверх|объём|объем|площадь|радиус|высота|ребро|сторон/i.test(text)) return text;
    return `${({ area: 'S основания', volume: 'V', a: 'a', b: 'b', h: 'h', r: 'r', l: 'l', d: 'd', diameter: 'd', inner: 'r', coneHeight: 'h конуса' })[key] || key} = ${text}`;
  }
  // BEGIN GENERATED PROFILE VISIBILITY FALLBACK
  function visibilityParts(a, b, surfaces, tolerance) {
    const delta = sub(b, a), cross2 = (u, v) => u[0] * v[1] - u[1] * v[0];
    const parameterTolerance = Math.min(1e-7, tolerance / Math.max(Math.hypot(...delta), tolerance));
    const at = t => add(a, mul(delta, t));
    const hidden = [];
    for (const face of surfaces) {
      if (face.sphere) {
        const { center, radius } = face.sphere, offset = sub(a, center), cuts = [0, 1];
        const roots = (A, B, C) => {
          if (Math.abs(A) < 1e-20) { if (Math.abs(B) > 1e-20) cuts.push(-C / B); return; }
          let discriminant = B * B - 4 * A * C;
          if (Math.abs(discriminant) <= 1e-12 * (B * B + Math.abs(4 * A * C))) discriminant = 0;
          if (discriminant >= 0) { const d = Math.sqrt(discriminant); cuts.push((-B - d) / (2 * A), (-B + d) / (2 * A)); }
        };
        if (face.surface) {
          // Great circles are stored as short chords. Only the explicitly
          // reviewed ring strokes represent arcs on this sphere's surface.
          if (Math.abs(delta[2]) > tolerance) cuts.push(-offset[2] / delta[2]);
        } else {
          roots(delta[0] ** 2 + delta[1] ** 2, 2 * (offset[0] * delta[0] + offset[1] * delta[1]), offset[0] ** 2 + offset[1] ** 2 - radius ** 2);
          roots(dot(delta, delta), 2 * dot(offset, delta), dot(offset, offset) - radius ** 2);
        }
        const sorted = cuts.filter(t => t >= 0 && t <= 1).sort((x, y) => x - y);
        for (let i = 1; i < sorted.length; i++) {
          const start = sorted[i - 1], end = sorted[i];
          if (end - start < 1e-10) continue;
          const p = sub(at((start + end) / 2), center), radial2 = p[0] ** 2 + p[1] ** 2;
          const covered = face.surface ? p[2] < -tolerance
            : radial2 < radius ** 2 * (1 - 1e-12) && Math.sqrt(Math.max(0, radius ** 2 - radial2)) > p[2] + tolerance;
          if (covered) hidden.push([start, end]);
        }
        continue;
      }
      const { vertices, normal } = face;
      if (Math.abs(normal[2]) < 1e-10) continue; // An edge-on face covers no area.
      const depthDifference = p => dot(normal, sub(vertices[0], p)) / normal[2];
      const da = depthDifference(a), db = depthDifference(b);
      if (Math.max(da, db) <= tolerance) continue; // On or in front of this face.
      const cuts = [0, 1];
      if ((da - tolerance) * (db - tolerance) < 0) cuts.push((tolerance - da) / (db - da));
      const length2 = delta[0] ** 2 + delta[1] ** 2;
      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i], q = vertices[(i + 1) % vertices.length];
        const edge = sub(q, p), offset = sub(p, a), denominator = cross2(delta, edge);
        const scale = Math.sqrt(length2 * (edge[0] ** 2 + edge[1] ** 2));
        if (Math.abs(denominator) > scale * 1e-12) {
          const t = cross2(offset, edge) / denominator, u = cross2(offset, delta) / denominator;
          if (t > 0 && t < 1 && u >= -1e-10 && u <= 1 + 1e-10) cuts.push(t);
        } else if (length2 > tolerance ** 2 && Math.abs(cross2(offset, delta)) <= tolerance * Math.sqrt(length2)) {
          for (const v of [p, q]) {
            const t = ((v[0] - a[0]) * delta[0] + (v[1] - a[1]) * delta[1]) / length2;
            if (t > 0 && t < 1) cuts.push(t);
          }
        }
      }
      function inside(p) {
        let enclosed = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
          const v = vertices[j], w = vertices[i], e = sub(w, v), relative = sub(p, v);
          const len = Math.hypot(e[0], e[1]);
          if (len > tolerance && Math.abs(cross2(e, relative)) <= tolerance * len
              && relative[0] * e[0] + relative[1] * e[1] >= -tolerance * len
              && relative[0] * e[0] + relative[1] * e[1] <= len * len + tolerance * len) return true;
          if ((v[1] > p[1]) !== (w[1] > p[1])
              && p[0] < (w[0] - v[0]) * (p[1] - v[1]) / (w[1] - v[1]) + v[0]) enclosed = !enclosed;
        }
        return enclosed;
      }
      cuts.sort((x, y) => x - y);
      for (let i = 1; i < cuts.length; i++) {
        const start = cuts[i - 1], end = cuts[i];
        if (end - start < 1e-10) continue;
        const p = at((start + end) / 2);
        if (depthDifference(p) > tolerance && inside(p)) hidden.push([start, end]);
      }
    }
    hidden.sort((x, y) => x[0] - y[0]);
    const merged = [];
    for (const interval of hidden) {
      // Coordinate rounding must not create a zero-pixel phantom dash at a
      // vertex. Discard only intervals below the same world-space tolerance
      // used for depth, and keep an exact partition of the remaining line.
      if (interval[1] - interval[0] <= parameterTolerance) continue;
      if (interval[0] < parameterTolerance) interval[0] = 0;
      if (interval[1] > 1 - parameterTolerance) interval[1] = 1;
      const last = merged[merged.length - 1];
      if (last && interval[0] <= last[1] + parameterTolerance) last[1] = Math.max(last[1], interval[1]);
      else merged.push(interval.slice());
    }
    const result = [];
    let start = 0;
    for (const [from, to] of merged) {
      if (from > start + 1e-10) result.push({ start, end: from, hidden: false });
      result.push({ start: from, end: to, hidden: true });
      start = to;
    }
    if (start < 1 - 1e-10) result.push({ start, end: 1, hidden: false });
    return result;
  }

  // END GENERATED PROFILE VISIBILITY FALLBACK
  function drawing(container, task, context) {
    const diagram = task.diagram || {};
    const shape = diagram.shape || 'box';
    const labels = diagram.labels || {};
    const step = context && context.step;
    const independent = !!(context && context.mode === 'independent' && !context.solved);
    const stepData = typeof step === 'object' ? step : (task.steps || [])[Number(step) || 0];
    const focus = independent ? (diagram.focus || 'neutral') : (stepData && stepData.focus) || diagram.focus || 'base';
    const saved = container._profileStereoView;
    const savedCamera = saved && saved.task === task.id && Number.isFinite(saved.yaw) &&
      Number.isFinite(saved.pitch) && saved.pitch >= 0.14 && saved.pitch <= 1.25;
    let yaw = savedCamera ? boundedYaw(saved.yaw) : -0.65;
    let pitch = savedCamera ? saved.pitch : 0.40;
    let active = null;
    let disposed = false, announcement = 'none', announcedYaw = null, announcedPitch = null;
    const listeners = [];
    const has = key => Object.prototype.hasOwnProperty.call(labels, key);
    const numbers = diagram.dimensions || [];
    // An unknown dimension is a drawing aid, not the solution of a hidden equation.
    const known = numbers.filter(finitePositive);
    const fallback = known.length ? known.reduce((s, n) => s + n, 0) / known.length : 4;
    const raw = n => finitePositive(numbers[n]) ? numbers[n] : fallback;
    const largest = Math.max(...numbers.filter(finitePositive), fallback, 0.001);
    const size = (n, ratio = 1) => clamp(raw(n) / largest * ratio, 0.18, 2);
    let a = size(0), b = size(1), h = size(2);
    if (shape === 'cube') b = h = a;
    if (shape === 'pyramid') { b = a; h = size(1); }
    if (shape === 'cylinder' || shape === 'cone') { a = size(0); h = size(1); }
    if (shape === 'sphere') a = size(0);
    if (shape === 'compound' && ['tube', 'cylinder-cone'].includes(diagram.variant)) h = size(1);
    const coneHeight = shape === 'compound' && diagram.variant === 'cylinder-cone' ? size(2) : 0;
    const radiusBound = shape === 'sphere' ? a : ['cylinder', 'cone'].includes(shape) || (shape === 'compound' && ['tube', 'cylinder-cone'].includes(diagram.variant)) ? Math.hypot(a, (h + coneHeight) / 2) : Math.hypot(a / 2, b / 2, h / 2);
    const scale = 122 / Math.max(radiusBound, 0.01);
    const title = names[shape] || names.compound;
    const schematicNote = (shape === 'prism' || shape === 'pyramid') && has('area') && !has('a') ? 'Форма основания показана условно: в задаче дана его площадь.' : 'Чертёж схематический. Используй числа из условия, не измеряй рисунок.';
    const baseNote = independent ? schematicNote : (diagram.note || schematicNote);
    const unknownLength = numbers.some(n => n === null) || ['a', 'b', 'h', 'r', 'l', 'd'].some(key => labels[key] === '?');
    const problemNote = unknownLength && !baseNote.includes('Схема не в масштабе.') ? `${baseNote} Схема не в масштабе.` : baseNote;
    const focusDescriptions = {
      base: 'Зелёным выделено основание.',
      height: 'Оранжевая линия — высота. Она перпендикулярна основанию.',
      section: 'Голубым выделено сечение, которое нужно для решения.',
      surface: 'Поверхность состоит из всех наружных граней или поверхностей.',
      volume: 'Для объёма выделены основание и высота.',
      scale: 'Вращение меняет только вид. Размеры из условия остаются прежними.',
      radius: 'Фиолетовый отрезок соединяет центр с точкой на окружности.'
    };
    let description = focusDescriptions[focus] || focusDescriptions.base;
    if (shape === 'sphere') description = focus === 'surface' ? 'Контур показывает поверхность шара. Радиус идёт от центра до поверхности.' : 'Радиус соединяет центр шара с точкой на его поверхности.';
    if (shape === 'compound') description = diagram.variant === 'tube' ? 'Внутри цилиндра — сквозное отверстие. Материал занимает кольцо между окружностями.' : diagram.variant === 'cylinder-cone' ? 'Цилиндр снизу, конус сверху. Высоту каждой части считаем отдельно.' : 'В верхнем углу вырезан куб. Оранжевые грани — границы выреза.';
    if (diagram.target === 'lateral') description = 'Голубым выделена боковая поверхность. Основания в неё не входят.';
    if (has('diameter')) description = 'Диаметр проходит через центр от одного края до другого. Радиус — половина этого отрезка.';
    if (independent) description = 'Данные — на рисунке. Поверни фигуру, если нужно.';
    const labelList = Object.entries(labels).map(([key, value]) => `<span data-known-label="${esc(key)}" style="border:1px solid #d5e4dc;border-radius:8px;padding:5px 9px;background:#fff;overflow-wrap:anywhere">${esc(shown(key, value))}</span>`).join('');
    container.innerHTML = `<div class="geometry-lab stereo-task-model" data-model="stereometry" data-shape="${esc(shape)}" data-focus="${esc(focus)}" style="min-width:0"><svg xmlns="http://www.w3.org/2000/svg" class="lab-svg" data-stereo-view viewBox="0 0 420 330" role="img" tabindex="0" aria-label="${esc(title)}. Вращение: стрелки на клавиатуре. Home — исходный вид." style="display:block;width:100%;height:auto;max-width:100%;background:#f6faf7;border:1px solid #d5e4dc;border-radius:12px;touch-action:pan-y;user-select:none;cursor:grab"></svg><div class="stereo-labels" style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;font-size:1rem">${labelList}</div><p class="stereo-focus-note" style="margin:8px 0;font-size:1rem">${esc(description)}</p><p class="stereo-problem-note" style="margin:6px 0;font-size:.85rem;color:#536b62">${esc(problemNote)}</p><div class="lab-controls stereo-controls" role="group" aria-label="Вращение модели" style="display:flex;flex-wrap:wrap;gap:7px"></div><details style="margin-top:8px"><summary style="cursor:pointer;min-height:34px;padding:6px 0">Другой вид</summary><div class="stereo-extra-controls" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:7px"></div></details><p class="stereo-rotation-status" role="status" aria-live="polite" aria-atomic="true" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"></p></div>`;
    const svg = container.querySelector('svg');
    const controls = container.querySelector('.stereo-controls');
    const extraControls = container.querySelector('.stereo-extra-controls');
    const extraView = extraControls.closest('details');
    const status = container.querySelector('.stereo-rotation-status');
    function on(el, name, handler) { el.addEventListener(name, handler); listeners.push(() => el.removeEventListener(name, handler)); }
    function renderAnnouncement() {
      status.textContent = announcement === 'rotate'
        ? `Вид изменён. Поворот ${Math.round(announcedYaw * 180 / Math.PI)} градусов; наклон ${Math.round(announcedPitch * 180 / Math.PI)} градусов.`
        : ({ none: '', reset: 'Исходный вид.', top: 'Вид сверху под углом.', side: 'Вид сбоку под небольшим углом.' })[announcement];
    }
    function announce(mode) {
      announcement = mode;
      announcedYaw = mode === 'rotate' ? yaw : null;
      announcedPitch = mode === 'rotate' ? pitch : null;
      renderAnnouncement();
    }
    function rotate(dx, dy, shouldAnnounce) {
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      yaw = boundedYaw(yaw + dx); pitch = clamp(pitch + dy, 0.14, 1.25); render();
      if (shouldAnnounce) announce('rotate');
    }
    function reset() { yaw = -0.65; pitch = 0.40; render(); announce('reset'); }
    function button(text, action, options = {}) {
      const el = document.createElement('button'); el.type = 'button'; el.textContent = text;
      el.style.cssText = 'min-height:44px;max-width:100%;padding:8px 11px;border:1px solid #8aada0;border-radius:8px;background:#fff;color:#164c41;font:inherit;cursor:pointer';
      if (options.label) el.setAttribute('aria-label', options.label);
      on(el, 'click', action); (options.extra ? extraControls : controls).append(el);
    }
    button('← Повернуть', () => rotate(-Math.PI / 9, 0, true), { label: 'Повернуть влево' });
    button('Повернуть →', () => rotate(Math.PI / 9, 0, true), { label: 'Повернуть вправо' });
    button('Посмотреть сверху', () => { pitch = 1.04; render(); announce('top'); }, { extra: true });
    button('Посмотреть сбоку', () => { pitch = 0.14; render(); announce('side'); }, { extra: true });
    button('Исходный вид', reset, { extra: true });
    on(svg, 'keydown', e => {
      const moves = { ArrowLeft: [-Math.PI / 18, 0], ArrowRight: [Math.PI / 18, 0], ArrowUp: [0, 0.10], ArrowDown: [0, -0.10] };
      if (moves[e.key]) { e.preventDefault(); rotate(...moves[e.key], true); }
      else if (e.key === 'Home') { e.preventDefault(); reset(); }
    });
    on(svg, 'pointerdown', e => {
      if (e.button !== 0 || active) return;
      active = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId); } catch (_) { /* A detached SVG cannot capture a pointer. */ }
      svg.style.cursor = 'grabbing';
    });
    on(svg, 'pointermove', e => {
      if (!active || active.id !== e.pointerId) return;
      const dx = e.clientX - active.x, dy = e.clientY - active.y;
      active.x = e.clientX; active.y = e.clientY;
      rotate(dx * 0.012, -dy * 0.007, false);
    });
    function stopDrag() {
      const pointer = active;
      active = null; svg.style.cursor = 'grab';
      try {
        if (pointer && svg.releasePointerCapture && (!svg.hasPointerCapture || svg.hasPointerCapture(pointer.id))) svg.releasePointerCapture(pointer.id);
      } catch (_) { /* Capture may already be lost during a board rerender. */ }
    }
    function release(e) { if (active && e.pointerId === active.id) stopDrag(); }
    on(svg, 'pointerup', release); on(svg, 'pointercancel', release);
    on(svg, 'lostpointercapture', () => { active = null; svg.style.cursor = 'grab'; });

    function rotated(p) {
      const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
      const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
      return [x, p[1] * Math.cos(pitch) - z * Math.sin(pitch), p[1] * Math.sin(pitch) + z * Math.cos(pitch)];
    }
    function project(p) { const q = rotated(p); return [210 + q[0] * scale, 162 - q[1] * scale]; }
    const xy = p => project(p).map(v => v.toFixed(2)).join(' ');
    const path = points => points.map((p, i) => `${i ? 'L' : 'M'} ${xy(p)}`).join(' ');
    const surfaces = [], roundBodies = [], strokes = [];
    const tolerance = 1e-7;
    function faceSurface(points, owner) {
      const vertices = points.map(rotated);
      const normal = cross(sub(vertices[1], vertices[0]), sub(vertices[2], vertices[0]));
      if (Math.hypot(...normal) > 1e-12) surfaces.push({ vertices, normal, owner });
    }
    function line3(p, q, color = C.edge, attrs = '', surface = null) {
      strokes.push({ p, q, color, attrs, surface });
      return '';
    }
    function curve3(points, color, attrs = '', surface = null) {
      const compare = (p, q) => {
        for (let i = 0; i < 3; i++) if (Math.abs(p[i] - q[i]) > tolerance) return p[i] - q[i];
        return 0;
      };
      const orientation = compare(points[0], points.at(-1)) || compare(points[1], points.at(-2));
      const forward = orientation <= 0;
      const lengths = points.slice(1).map((p, i) => Math.hypot(...sub(project(p), project(points[i]))));
      const total = lengths.reduce((sum, length) => sum + length, 0);
      let distance = 0;
      for (let i = 1; i < points.length; i++) {
        line3(points[i - 1], points[i], color, attrs, surface);
        strokes.at(-1).curvePhase = { forward, start: forward ? distance : total - distance, length: lengths[i - 1] };
        distance += lengths[i - 1];
      }
      return '';
    }
    function roundSurface(isCone, radius, height, yOffset, options = {}) {
      const body = { isCone, radius, height, low: -height / 2 + yOffset,
        high: height / 2 + yOffset, top: options.top !== false,
        bottom: options.bottom !== false, inner: options.inner || 0 };
      roundBodies.push(body); return body;
    }
    // Exact ray/quadric intervals for round bodies. A faceted occluder would
    // leave small solid pieces at the ends of otherwise hidden radii.
    function roundVisibilityParts(p, q, body, direction) {
      const delta = sub(q, p), k = body.isCone ? body.radius / body.height : 0;
      const roots = (a, b, c) => {
        if (Math.abs(a) < 1e-13) return Math.abs(b) < 1e-13 ? [] : [-c / b];
        const discriminant = b * b - 4 * a * c;
        if (discriminant <= 1e-12 * (b * b + Math.abs(4 * a * c))) return [];
        const root = Math.sqrt(discriminant);
        return [(-b - root) / (2 * a), (-b + root) / (2 * a)];
      };
      const coefficients = (point, vector, radius) => [
        vector[0] ** 2 + vector[2] ** 2 - k * k * vector[1] ** 2,
        2 * (point[0] * vector[0] + point[2] * vector[2] + k * k * (body.high - point[1]) * vector[1]),
        point[0] ** 2 + point[2] ** 2 - (body.isCone ? k * k * (body.high - point[1]) ** 2 : radius ** 2)
      ];
      const radii = body.inner ? [body.radius, body.inner] : [body.radius], cuts = [0, 1];
      for (const radius of radii) {
        const [aa, ab, ac] = coefficients(p, direction, radius);
        const [, bb] = coefficients(q, direction, radius), bd = bb - ab;
        const [ca, cb] = coefficients(p, delta, radius);
        // The stroke crosses the physical side, or its viewing ray is tangent.
        cuts.push(...roots(ca, cb, ac));
        cuts.push(...roots(bd * bd - 4 * aa * ca, 2 * ab * bd - 4 * aa * cb, ab * ab - 4 * aa * ac));
        for (const height of [body.low, body.high]) {
          if (Math.abs(delta[1]) > 1e-13) cuts.push((height - p[1]) / delta[1]);
          if (Math.abs(direction[1]) < 1e-13) continue;
          const t = (height - p[1]) / direction[1];
          const start = add(p, mul(direction, t));
          const step = sub(delta, mul(direction, delta[1] / direction[1]));
          const capRadius = body.isCone ? body.radius * (body.high - height) / body.height : radius;
          cuts.push(...roots(step[0] ** 2 + step[2] ** 2, 2 * (start[0] * step[0] + start[2] * step[2]), start[0] ** 2 + start[2] ** 2 - capRadius ** 2));
        }
      }
      const hiddenAt = point => {
        for (const radius of radii) {
          if (roots(...coefficients(point, direction, radius)).some(t => t > tolerance &&
            point[1] + t * direction[1] >= body.low - tolerance && point[1] + t * direction[1] <= body.high + tolerance)) return true;
        }
        for (const [height, enabled] of [[body.low, body.bottom], [body.high, body.top && !body.isCone]]) {
          if (!enabled || Math.abs(direction[1]) < 1e-13) continue;
          const t = (height - point[1]) / direction[1];
          if (t <= tolerance) continue;
          const hit = add(point, mul(direction, t)), r2 = hit[0] ** 2 + hit[2] ** 2;
          if (r2 <= body.radius ** 2 + 1e-10 && r2 >= body.inner ** 2 - 1e-10) return true;
        }
        return false;
      };
      const sorted = [...new Set(cuts.filter(t => Number.isFinite(t) && t >= 0 && t <= 1))].sort((a, b) => a - b), parts = [];
      for (let i = 1; i < sorted.length; i++) {
        const start = sorted[i - 1], end = sorted[i];
        if (end - start < 1e-10) continue;
        const hidden = hiddenAt(add(p, mul(delta, (start + end) / 2))), last = parts.at(-1);
        if (last && last.hidden === hidden) last.end = end; else parts.push({ start, end, hidden });
      }
      return parts;
    }
    function renderStrokes() {
      const direction = [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
      const layers = [[], []];
      const sideValue = (body, p) => dot([p[0], body.isCone ? body.radius ** 2 / body.height ** 2 * (body.high - p[1]) : 0, p[2]], direction);
      const onSide = (body, p) => p[1] >= body.low - tolerance && p[1] <= body.high + tolerance &&
        Math.abs(Math.hypot(p[0], p[2]) - body.radius * (body.isCone ? (body.high - p[1]) / body.height : 1)) < tolerance;
      strokes.forEach((stroke, index) => {
        const { p, q, color } = stroke, a = rotated(p), b = rotated(q);
        // A straight generator belongs to the smooth surface; sampled arcs are
        // explicitly marked. Interior chords and radii must not get this exemption.
        const owner = stroke.surface?.body || (!stroke.surface && roundBodies.find(body =>
          onSide(body, p) && onSide(body, q) && onSide(body, mid(p, q))));
        const sourceSurfaces = surfaces.map(face =>
          face.sphere && stroke.surface?.sphere === face.sphere ? { ...face, surface: true } : face);
        const parts = visibilityParts(a, b, sourceSurfaces, tolerance);
        roundBodies.filter(body => body !== owner).forEach(body => parts.push(...roundVisibilityParts(p, q, body, direction)));
        const cuts = [0, 1, ...parts.flatMap(part => [part.start, part.end])];
        let ownHidden = () => false;
        if (owner) {
          const cap = stroke.surface?.cap;
          const frontCap = cap === 'top' && owner.top || cap === 'bottom' && owner.bottom && direction[1] < 0;
          if (!frontCap) {
            const va = sideValue(owner, p), vb = sideValue(owner, q);
            if (va * vb < 0) cuts.push(va / (va - vb));
            ownHidden = t => va + (vb - va) * t < -tolerance;
          }
        }
        const sorted = [...new Set(cuts)].sort((x, y) => x - y), intervals = [];
        for (let i = 1; i < sorted.length; i++) {
          const start = sorted[i - 1], end = sorted[i], t = (start + end) / 2;
          if (end - start < 1e-10) continue;
          const hidden = ownHidden(t) || parts.some(part => part.hidden && t >= part.start && t <= part.end);
          const last = intervals.at(-1);
          if (last && last.hidden === hidden) last.end = end; else intervals.push({ start, end, hidden });
        }
        intervals.forEach(part => {
          const from = add(p, mul(sub(q, p), part.start)), to = add(p, mul(sub(q, p), part.end));
          const x = project(from), y = project(to), dx = y[0] - x[0], dy = y[1] - x[1], length = Math.hypot(dx, dy);
          if (length < .0001) return;
          const sign = Math.abs(dx) > length * 1e-10 ? Math.sign(dx) : Math.sign(dy);
          const along = (x[0] * dx + x[1] * dy) / length * sign;
          const phase = stroke.curvePhase;
          // Sampled curved paths keep one arclength phase through every chord.
          // Canonical direction also aligns a reversed copy of the same curve.
          const curveAlong = phase && phase.start + (phase.forward ? 1 : -1) * phase.length * part.start;
          const offset = phase ? (phase.forward ? curveAlong : 5 - curveAlong) % 10 : (sign > 0 ? along : 5 - along) % 10;
          const ghost = /data-ghost="true"/.test(stroke.attrs), dashed = part.hidden || ghost;
          const attrs = stroke.attrs.replace(/\s*stroke-dasharray="[^"]*"/g, '');
          const markup = `<path d="${path([from, to])}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" ${attrs} data-source-stroke="${index}" data-hidden="${part.hidden}" data-part-start="${part.start}" data-part-end="${part.end}"${dashed ? ` stroke-dasharray="5 5" stroke-dashoffset="${offset}"` : ''}/>`;
          layers[part.hidden ? 0 : 1].push(markup);
        });
      });
      return `<g data-visibility-layer="hidden">${layers[0].join('')}</g><g data-visibility-layer="visible">${layers[1].join('')}</g>`;
    }
    function polygon(points, color, attrs = '') { return `<path d="${path(points)} Z" fill="${color}" ${attrs}/>`; }
    function circlePoints(r, y, from = 0, to = TAU, n = 64) { return Array.from({ length: n + 1 }, (_, i) => { const t = from + (to - from) * i / n; return [r * Math.cos(t), y, r * Math.sin(t)]; }); }
    const features = [];
    const annotations = [];
    function feature(name, from, to, key, color, dashed) {
      if ((name === 'height' || name === 'cone-height') && !['height', 'volume', 'section'].includes(focus)) color = C.hidden;
      features.push(line3(from, to, color, `data-feature="${name}" style="stroke-width:${name === 'height' ? 3 : 2.5}"${dashed ? ' stroke-dasharray="6 4"' : ''}`));
      if (key && has(key)) annotations.push({ point: mid(from, to), text: shown(key, labels[key]), color: color === C.hidden ? '#52695f' : color, name });
    }
    function rightAngle(origin, alongA, alongB) {
      const unit = v => mul(v, 0.09 / Math.max(Math.hypot(...v), 0.001));
      const u = unit(alongA), v = unit(alongB);
      return curve3([add(origin, u), add(add(origin, u), v), add(origin, v)], C.height, 'style="stroke-width:1.8" data-feature="right-angle"');
    }
    function solid(vertices, faces) {
      const center = mean(vertices);
      const prepared = faces.map(face => {
        const points = face.indices.map(i => vertices[i]);
        faceSurface(points);
        let normal = face.normal || cross(sub(points[1], points[0]), sub(points[2], points[0]));
        if (!face.normal && dot(normal, sub(mean(points), center)) < 0) normal = mul(normal, -1);
        const front = rotated(normal)[2] > 1e-8;
        const depth = mean(points.map(rotated))[2];
        return { ...face, points, front, depth };
      });
      const edges = new Map();
      prepared.forEach(face => face.indices.forEach((i, k) => {
        const j = face.indices[(k + 1) % face.indices.length], key = [i, j].sort((x, y) => x - y).join('-');
        const edge = edges.get(key) || { i, j, front: false };
        edge.front = edge.front || face.front; edges.set(key, edge);
      }));
      const body = prepared.sort((u, v) => u.depth - v.depth).map(face => {
        const highlighted = face.base || (focus === 'surface' && face.front);
        const fill = face.cut ? '#f5d8c1' : face.base ? C.base : focus === 'surface' || diagram.target === 'lateral' ? (face.side ? '#dbe6f4' : '#cbe7d9') : C.face;
        return polygon(face.points, fill, `fill-opacity="${face.front ? '.87' : '.13'}"${face.base ? ' data-feature="base"' : face.cut ? ' data-feature="cut"' : ''}${highlighted ? ' data-highlighted="true"' : ''}`);
      }).join('');
      const outline = [...edges.values()].map(edge => line3(vertices[edge.i], vertices[edge.j], edge.front ? C.edge : C.hidden, edge.front ? '' : 'stroke-dasharray="5 5"')).join('');
      let baseHighlight = '';
      if (focus === 'base' || focus === 'volume') prepared.filter(face => face.base).forEach(face => {
        baseHighlight += polygon(face.points, '#64bc91', 'fill-opacity=".30" data-feature="base-highlight"');
        face.indices.forEach((i, k) => {
          const j = face.indices[(k + 1) % face.indices.length], key = [i, j].sort((x, y) => x - y).join('-');
          baseHighlight += line3(vertices[i], vertices[j], '#237856', edges.get(key).front ? '' : 'stroke-dasharray="5 5"');
        });
      });
      return body + outline + baseHighlight;
    }
    function boxData(x = a, z = b, y = h, ox = 0, oy = 0, oz = 0) {
      const vertices = [[-x / 2, -y / 2, -z / 2], [x / 2, -y / 2, -z / 2], [x / 2, -y / 2, z / 2], [-x / 2, -y / 2, z / 2], [-x / 2, y / 2, -z / 2], [x / 2, y / 2, -z / 2], [x / 2, y / 2, z / 2], [-x / 2, y / 2, z / 2]].map(p => add(p, [ox, oy, oz]));
      const faces = [{ indices: [0, 1, 2, 3], base: true }, { indices: [4, 5, 6, 7] }, { indices: [0, 1, 5, 4], side: true }, { indices: [1, 2, 6, 5], side: true }, { indices: [2, 3, 7, 6], side: true }, { indices: [3, 0, 4, 7], side: true }];
      return { vertices, faces };
    }
    function box() {
      const data = boxData(), v = data.vertices;
      let out = solid(v, data.faces);
      feature('edge-a', v[3], v[2], 'a', C.ink);
      if (shape !== 'cube') feature('edge-b', v[2], v[1], 'b', C.ink);
      feature('height', v[2], v[6], shape === 'cube' ? null : 'h', C.height);
      if (diagram.target !== 'diagonal') out += rightAngle(v[2], sub(v[3], v[2]), sub(v[6], v[2]));
      if (diagram.target === 'diagonal') {
        if (!independent) {
          feature('base-diagonal', v[0], v[2], null, '#237856', true);
          out += rightAngle(v[2], sub(v[0], v[2]), sub(v[6], v[2]));
        }
        feature('diagonal', v[0], v[6], 'd', '#855b98', true);
        if (focus === 'section') out += polygon([v[0], v[2], v[6]], C.section, 'fill-opacity=".6" data-feature="section"');
      }
      return out;
    }
    function prism() {
      const v = [[-a / 2, -h / 2, -b / 2], [a / 2, -h / 2, -b / 2], [-a / 2, -h / 2, b / 2], [-a / 2, h / 2, -b / 2], [a / 2, h / 2, -b / 2], [-a / 2, h / 2, b / 2]];
      const faces = [{ indices: [0, 1, 2], base: true }, { indices: [3, 4, 5] }, { indices: [0, 1, 4, 3], side: true }, { indices: [1, 2, 5, 4], side: true }, { indices: [2, 0, 3, 5], side: true }];
      let out = solid(v, faces);
      feature('edge-a', v[0], v[1], 'a', C.ink); feature('edge-b', v[0], v[2], 'b', C.ink);
      feature('height', v[2], v[5], 'h', C.height);
      if (has('c')) feature('hypotenuse', v[1], v[2], 'c', C.ink);
      out += rightAngle(v[0], sub(v[1], v[0]), sub(v[2], v[0]));
      out += rightAngle(v[2], sub(v[0], v[2]), sub(v[5], v[2]));
      return out;
    }
    function pyramid() {
      const v = [[-a / 2, -h / 2, -a / 2], [a / 2, -h / 2, -a / 2], [a / 2, -h / 2, a / 2], [-a / 2, -h / 2, a / 2], [0, h / 2, 0]], O = [0, -h / 2, 0];
      const faces = [{ indices: [0, 1, 2, 3], base: true }, { indices: [0, 1, 4], side: true }, { indices: [1, 2, 4], side: true }, { indices: [2, 3, 4], side: true }, { indices: [3, 0, 4], side: true }];
      let out = solid(v, faces);
      feature('edge-a', v[3], v[2], 'a', C.ink); feature('height', O, v[4], 'h', C.height, true);
      out += rightAngle(O, [1, 0, 0], [0, 1, 0]);
      if (has('l')) feature('slant', mid(v[2], v[3]), v[4], 'l', '#855b98');
      if (focus === 'section') out += polygon([mid(v[0], v[1]), mid(v[2], v[3]), v[4]], C.section, 'fill-opacity=".55" data-feature="section"');
      return out;
    }
    function roundBody(isCone, radius = a, height = h, yOffset = 0, cut = false, options = {}) {
      const low = -height / 2 + yOffset, high = height / 2 + yOffset;
      const lower = circlePoints(radius, low), upper = isCone ? null : circlePoints(radius, high), tip = [0, high, 0];
      const surface = roundSurface(isCone, radius, height, yOffset, options);
      const topColor = focus === 'surface' ? '#cce8d9' : C.face;
      let out = polygon(lower, C.base, 'fill-opacity=".72" data-feature="base"');
      const panels = [];
      for (let i = 0; i < 48; i++) {
        const t0 = TAU * i / 48, t1 = TAU * (i + 1) / 48;
        const l = [radius * Math.cos(t0), low, radius * Math.sin(t0)], r = [radius * Math.cos(t1), low, radius * Math.sin(t1)];
        const tl = isCone ? tip : [l[0], high, l[2]], tr = isCone ? tip : [r[0], high, r[2]];
        const points = isCone ? [l, r, tip] : [l, r, tr, tl];
        panels.push({ points, depth: mean(points.map(rotated))[2] });
      }
      out += panels.sort((u, v) => u.depth - v.depth).map(panel => polygon(panel.points, cut ? '#f1dfcd' : focus === 'surface' ? '#dde6f3' : C.face, 'fill-opacity=".88"')).join('');
      if (!isCone) out += polygon(upper, topColor, 'fill-opacity=".9"');
      const tangentRatio = isCone ? radius / height * Math.tan(pitch) : 0;
      const angleOffset = Math.asin(clamp(tangentRatio, -1, 1));
      const tLeft = yaw - angleOffset, tRight = yaw + Math.PI + angleOffset;
      if (tangentRatio < 1) {
        out += curve3(circlePoints(radius, low, tRight, tLeft + TAU, 32), C.edge, '', { body: surface, cap: 'bottom' });
        out += curve3(circlePoints(radius, low, tLeft, tRight, 32), C.edge, '', { body: surface, cap: 'bottom' });
        [tLeft, tRight].forEach(t => { const p = [radius * Math.cos(t), low, radius * Math.sin(t)]; out += line3(p, isCone ? tip : [p[0], high, p[2]], C.edge, '', { body: surface }); });
      } else out += curve3(lower, C.edge, '', { body: surface, cap: 'bottom' });
      if (!isCone && options.top !== false) out += curve3(upper, C.edge, '', { body: surface, cap: 'top' });
      if ((focus === 'base' || focus === 'volume') && diagram.variant !== 'tube') out += polygon(lower, '#64bc91', 'fill-opacity=".28" data-feature="base-highlight"');
      return out;
    }
    function cylinderOrCone() {
      const cone = shape === 'cone';
      const O = [0, -h / 2, 0], T = [0, h / 2, 0];
      const E = [a * Math.cos(yaw), -h / 2, a * Math.sin(yaw)];
      let out = roundBody(cone);
      const showHeight = !cone || has('h') || focus === 'section';
      if (showHeight) feature('height', O, T, 'h', C.height, true);
      if (has('diameter')) { const F = [-E[0], E[1], -E[2]]; feature('diameter', F, E, 'diameter', C.radius); }
      else feature('radius', O, E, 'r', C.radius);
      if (showHeight) out += rightAngle(O, sub(E, O), sub(T, O));
      if (cone && has('l')) feature('slant', E, T, 'l', C.ink);
      if (focus === 'section' || diagram.target === 'diagonal') {
        const F = mul(E, -1); F[1] = -h / 2;
        const cut = cone ? [O, E, T] : [E, F, [F[0], h / 2, F[2]], [E[0], h / 2, E[2]]];
        out += polygon(cut, C.section, 'fill-opacity=".55" data-feature="section"');
      }
      return out;
    }
    function sphere() {
      const O = [0, 0, 0], center = project(O), R = a * scale;
      const sphere = { center: rotated(O), radius: a }; surfaces.push({ sphere });
      let out = `<circle cx="${center[0]}" cy="${center[1]}" r="${R}" fill="${focus === 'surface' ? '#d8e8f4' : '#e1f0e7'}" stroke="${C.edge}" stroke-width="2.4" data-feature="surface"/>`;
      out += curve3(circlePoints(a, 0, 0, TAU, 128), C.edge, 'style="stroke-width:1.7" data-feature="equator"', { sphere });
      // The endpoint is on the sphere; this is one radius, never a diameter.
      const E = [a, 0, 0];
      if (has('diameter')) feature('diameter', [-a, 0, 0], E, 'diameter', C.radius);
      else feature('radius', O, E, 'r', C.radius, rotated(E)[2] < 0);
      out += `<circle cx="${center[0]}" cy="${center[1]}" r="3.5" fill="${C.ink}"/><text x="${center[0] - 12}" y="${center[1] + 20}" font-size="17" fill="${C.ink}">O</text>`;
      return out;
    }
    function compound() {
      if (diagram.variant === 'tube') return tube();
      if (diagram.variant === 'cylinder-cone') return cylinderCone();
      return cutBox();
    }
    function cutBox() {
      const cutSize = finitePositive(diagram.cut) ? diagram.cut / largest : Math.min(a, b, h) / 3;
      const c = Math.min(cutSize, Math.min(a, b, h) * 0.9);
      const x0 = -a / 2, x1 = a / 2, z0 = -b / 2, z1 = b / 2, y0 = -h / 2, y1 = h / 2;
      const xi = x1 - c, zi = z1 - c, yi = y1 - c;
      const v = [], faces = [];
      function face(points, normal, extra) {
        const indices = points.map(point => {
          let i = v.findIndex(p => p.every((n, axis) => n === point[axis]));
          if (i < 0) { i = v.length; v.push(point); } return i;
        });
        faces.push({ indices, normal, ...(extra || {}) });
      }
      face([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]], [0,-1,0], { base: true });
      face([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]], [0,0,-1]);
      face([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]], [-1,0,0]);
      face([[x0,y1,z0],[x1,y1,z0],[x1,y1,zi],[xi,y1,zi],[xi,y1,z1],[x0,y1,z1]], [0,1,0]);
      face([[x1,y0,z0],[x1,y1,z0],[x1,y1,zi],[x1,yi,zi],[x1,yi,z1],[x1,y0,z1]], [1,0,0]);
      face([[x0,y0,z1],[x1,y0,z1],[x1,yi,z1],[xi,yi,z1],[xi,y1,z1],[x0,y1,z1]], [0,0,1]);
      face([[xi,yi,zi],[x1,yi,zi],[x1,yi,z1],[xi,yi,z1]], [0,1,0], { cut: true });
      face([[xi,yi,zi],[xi,y1,zi],[xi,y1,z1],[xi,yi,z1]], [1,0,0], { cut: true });
      face([[xi,yi,zi],[x1,yi,zi],[x1,y1,zi],[xi,y1,zi]], [0,0,1], { cut: true });
      let out = solid(v, faces);
      feature('edge-a', [x0,y0,z1], [x1,y0,z1], 'a', C.ink);
      feature('edge-b', [x1,y0,z1], [x1,y0,z0], 'b', C.ink);
      feature('height', [x0,y0,z1], [x0,y1,z1], 'h', C.height);
      if (focus === 'section') {
        out += line3([x1,y1,z1], [xi,y1,z1], C.height, 'data-ghost="true" data-feature="removed"');
        out += line3([x1,y1,z1], [x1,yi,z1], C.height, 'data-ghost="true" data-feature="removed"');
        out += line3([x1,y1,z1], [x1,y1,zi], C.height, 'data-ghost="true" data-feature="removed"');
      }
      return out;
    }
    function tube() {
      const inner = finitePositive(diagram.inner) ? clamp(diagram.inner / largest, 0.05, a * .95) : a * .5;
      let out = roundBody(false, a, h, 0, false, { inner });
      const surface = roundBodies.at(-1);
      const topOuter = circlePoints(a, h / 2), topInner = circlePoints(inner, h / 2);
      const clipId = `stereo-hole-${String(task.id).replace(/[^a-z0-9-]/gi, '')}`;
      out += `<defs><clipPath id="${clipId}">${polygon(topInner, '#fff')}</clipPath></defs>`;
      out += polygon(topInner, '#f6faf7');
      const innerWalls = [];
      for (let i = 0; i < 32; i++) {
        const t0 = yaw + Math.PI + Math.PI * i / 32, t1 = yaw + Math.PI + Math.PI * (i + 1) / 32;
        const p = [inner * Math.cos(t0), h / 2, inner * Math.sin(t0)], q = [inner * Math.cos(t1), h / 2, inner * Math.sin(t1)];
        innerWalls.push(polygon([p,q,[q[0],-h/2,q[2]],[p[0],-h/2,p[2]]], '#c4d6cd'));
      }
      out += `<g clip-path="url(#${clipId})" data-feature="hole">${innerWalls.join('')}</g>`;
      out += `<path d="${path(topOuter)} Z ${path(topInner.slice().reverse())} Z" fill="${C.base}" fill-rule="evenodd" data-feature="base"/>`;
      out += curve3(topInner, C.edge, 'data-feature="inner-rim"', { body: surface, cap: 'top', radius: inner });
      const E = [a * Math.cos(yaw + .45), h / 2, a * Math.sin(yaw + .45)], I = [inner * Math.cos(yaw + 2.3), h / 2, inner * Math.sin(yaw + 2.3)];
      feature('radius', [0,h/2,0], E, 'r', C.radius);
      feature('inner-radius', [0,h/2,0], I, 'inner', C.height);
      const side = [a * Math.cos(yaw), -h / 2, a * Math.sin(yaw)];
      feature('height', side, [side[0],h/2,side[2]], 'h', C.height);
      return out;
    }
    function cylinderCone() {
      const bottom = -(h + coneHeight) / 2, seam = bottom + h, top = (h + coneHeight) / 2;
      let out = roundBody(false, a, h, -coneHeight / 2, false, { top: false });
      out += roundBody(true, a, coneHeight, h / 2, focus === 'section', { bottom: false });
      const E = [a * Math.cos(yaw), bottom, a * Math.sin(yaw)];
      feature('radius', [0,bottom,0], E, 'r', C.radius);
      const side = [a * Math.cos(yaw), bottom, a * Math.sin(yaw)];
      feature('height', side, [side[0],seam,side[2]], 'h', C.height);
      feature('cone-height', [0,seam,0], [0,top,0], 'coneHeight', C.height, true);
      return out;
    }
    function renderAnnotations() {
      const occupied = [];
      return annotations.map(item => {
        const p = project(item.point), width = Math.max(42, item.text.length * 9 + 16), half = Math.min(width / 2, 180);
        let dx = p[0] < 210 ? -22 : 22, dy = p[1] < 162 ? -19 : 22;
        if (item.name === 'height' || item.name === 'cone-height') { dx = p[0] > 235 ? 30 : -35; dy = 0; }
        if (item.name === 'slant') { dx = 29; dy = -12; }
        if (item.name === 'radius' || item.name === 'diameter') { dx = 4; dy = 26; }
        let x = clamp(p[0] + dx, half + 8, 412 - half), y = clamp(p[1] + dy, 25, 307);
        const overlaps = () => occupied.some(box => Math.abs(x - box.x) < half + box.half + 5 && Math.abs(y - box.y) < 26);
        let tries = 0;
        while (overlaps() && tries < 12) { y = clamp(y + (tries < 6 ? 26 : -26 * (tries - 4)), 25, 307); tries++; }
        occupied.push({ x, y, half });
        return `<g data-model-label="true"><path d="M ${p[0].toFixed(2)} ${p[1].toFixed(2)} L ${x.toFixed(2)} ${(y - 6).toFixed(2)}" fill="none" stroke="${item.color}" stroke-width="1" opacity=".55"/><rect x="${x - half}" y="${y - 18}" width="${half * 2}" height="25" rx="5" fill="#fff" fill-opacity=".96"/><text x="${x}" y="${y}" text-anchor="middle" fill="${item.color}" font-size="18" font-weight="600">${esc(item.text)}</text></g>`;
      }).join('');
    }
    function render() {
      features.length = 0; annotations.length = 0;
      surfaces.length = 0; roundBodies.length = 0; strokes.length = 0;
      let body;
      if (shape === 'box' || shape === 'cube') body = box();
      else if (shape === 'prism') body = prism();
      else if (shape === 'pyramid') body = pyramid();
      else if (shape === 'cylinder' || shape === 'cone') body = cylinderOrCone();
      else if (shape === 'sphere') body = sphere();
      else body = compound();
      svg.innerHTML = `<title>${esc(title)}</title><desc>${esc(description)} ${esc(Object.entries(labels).map(([key, value]) => shown(key, value)).join('; '))}. ${esc(problemNote)}</desc>${body}${renderStrokes()}${renderAnnotations()}`;
      svg.dataset.yaw = String(yaw); svg.dataset.pitch = String(pitch);
      svg.dataset.focus = focus; svg.dataset.shape = shape;
      container._profileStereoView = { task: task.id, yaw, pitch };
    }
    render();
    const cleanup = () => {
      disposed = true; listeners.splice(0).forEach(remove => remove()); stopDrag();
    };
    cleanup.getBoardState = () => ({ taskId: task.id, yaw, pitch, extraOpen: extraView.open, announcement, announcedYaw, announcedPitch });
    cleanup.applyBoardState = value => {
      const state = !disposed && readBoardState(task.id, value);
      if (!state) throw new TypeError('Invalid stereometry board state');
      // A remote snapshot restores presentation only. Pointer gestures and
      // learner callbacks are never replayed, and cannot survive hydration.
      stopDrag();
      yaw = state.yaw; pitch = state.pitch;
      announcement = state.announcement; announcedYaw = state.announcedYaw; announcedPitch = state.announcedPitch;
      render(); extraView.open = state.extraOpen; renderAnnouncement();
    };
    return cleanup;
  }
  (root.ProfileLessons || []).filter(lesson => lesson.group === 'stereometry').forEach(lesson => {
    (lesson.tasks || []).forEach(task => {
      if (!task.diagram) return;
      taskModels[task.id] = (container, current, context) => drawing(container, current || task, context || {});
      taskModels[task.id].validateBoardState = value => !!readBoardState(task.id, value);
    });
    if (lesson.model && lesson.tasks && lesson.tasks[0]) {
      labs[lesson.model] = container => drawing(container, lesson.tasks[0], { step: 0, mode: 'introduction' });
      labs[lesson.model].validateBoardState = value => !!readBoardState(lesson.tasks[0].id, value);
    }
  });
})(globalThis);
