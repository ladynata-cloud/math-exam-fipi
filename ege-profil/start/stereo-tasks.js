(function (root) {
  'use strict';
  // These drawings belong to the current problem. Neither lengths nor answers
  // are calculated for display: every visible value comes from diagram.labels.
  const taskModels = root.ProfileTaskModels = root.ProfileTaskModels || {};
  const labs = root.ProfileModels = root.ProfileModels || {};
  const TAU = Math.PI * 2;
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
  function shown(key, value) {
    const text = String(value);
    if (key === 'scale' || key === 'cut' || text === key || /=|основан|поверх|объём|объем|площадь|радиус|высота|ребро|сторон/i.test(text)) return text;
    return `${({ area: 'S основания', volume: 'V', a: 'a', b: 'b', h: 'h', r: 'r', l: 'l', d: 'd', diameter: 'd', inner: 'r', coneHeight: 'h конуса' })[key] || key} = ${text}`;
  }
  function drawing(container, task, context) {
    const diagram = task.diagram || {};
    const shape = diagram.shape || 'box';
    const labels = diagram.labels || {};
    const step = context && context.step;
    const independent = !!(context && context.mode === 'independent' && !context.solved);
    const stepData = typeof step === 'object' ? step : (task.steps || [])[Number(step) || 0];
    const focus = independent ? (diagram.focus || 'neutral') : (stepData && stepData.focus) || diagram.focus || 'base';
    const saved = container._profileStereoView;
    let yaw = saved && saved.task === task.id ? saved.yaw : -0.65;
    let pitch = saved && saved.task === task.id ? saved.pitch : 0.40;
    let active = null;
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
    const status = container.querySelector('.stereo-rotation-status');
    function on(el, name, handler) { el.addEventListener(name, handler); listeners.push(() => el.removeEventListener(name, handler)); }
    function rotate(dx, dy, announce) {
      yaw += dx; pitch = clamp(pitch + dy, 0.14, 1.25); render();
      if (announce) status.textContent = `Вид изменён. Поворот ${Math.round(yaw * 180 / Math.PI)} градусов; наклон ${Math.round(pitch * 180 / Math.PI)} градусов.`;
    }
    function reset() { yaw = -0.65; pitch = 0.40; render(); status.textContent = 'Исходный вид.'; }
    function button(text, action, options = {}) {
      const el = document.createElement('button'); el.type = 'button'; el.textContent = text;
      el.style.cssText = 'min-height:44px;max-width:100%;padding:8px 11px;border:1px solid #8aada0;border-radius:8px;background:#fff;color:#164c41;font:inherit;cursor:pointer';
      if (options.label) el.setAttribute('aria-label', options.label);
      on(el, 'click', action); (options.extra ? extraControls : controls).append(el);
    }
    button('← Повернуть', () => rotate(-Math.PI / 9, 0, true), { label: 'Повернуть влево' });
    button('Повернуть →', () => rotate(Math.PI / 9, 0, true), { label: 'Повернуть вправо' });
    button('Посмотреть сверху', () => { pitch = 1.04; render(); status.textContent = 'Вид сверху под углом.'; }, { extra: true });
    button('Посмотреть сбоку', () => { pitch = 0.14; render(); status.textContent = 'Вид сбоку под небольшим углом.'; }, { extra: true });
    button('Исходный вид', reset, { extra: true });
    on(svg, 'keydown', e => {
      const moves = { ArrowLeft: [-Math.PI / 18, 0], ArrowRight: [Math.PI / 18, 0], ArrowUp: [0, 0.10], ArrowDown: [0, -0.10] };
      if (moves[e.key]) { e.preventDefault(); rotate(...moves[e.key], true); }
      else if (e.key === 'Home') { e.preventDefault(); reset(); }
    });
    on(svg, 'pointerdown', e => {
      if (e.button !== 0 || active) return;
      active = { id: e.pointerId, x: e.clientX, y: e.clientY };
      if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
      svg.style.cursor = 'grabbing';
    });
    on(svg, 'pointermove', e => {
      if (!active || active.id !== e.pointerId) return;
      const dx = e.clientX - active.x, dy = e.clientY - active.y;
      active.x = e.clientX; active.y = e.clientY;
      rotate(dx * 0.012, -dy * 0.007, false);
    });
    function release(e) {
      if (active && e.pointerId === active.id) {
        active = null; svg.style.cursor = 'grab';
        if (svg.hasPointerCapture && svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      }
    }
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
    function line3(p, q, color = C.edge, attrs = '') { return `<path d="${path([p, q])}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" ${attrs}/>`; }
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
      return `<path d="${path([add(origin, u), add(add(origin, u), v), add(origin, v)])}" fill="none" stroke="${C.height}" stroke-width="1.8" data-feature="right-angle"/>`;
    }
    function solid(vertices, faces) {
      const center = mean(vertices);
      const prepared = faces.map(face => {
        const points = face.indices.map(i => vertices[i]);
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
    function roundBody(isCone, radius = a, height = h, yOffset = 0, cut = false) {
      const low = -height / 2 + yOffset, high = height / 2 + yOffset;
      const lower = circlePoints(radius, low), upper = isCone ? null : circlePoints(radius, high), tip = [0, high, 0];
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
        out += `<path d="${path(circlePoints(radius, low, tRight, tLeft + TAU, 32))}" fill="none" stroke="${C.hidden}" stroke-width="2" stroke-dasharray="5 5"/>`;
        out += `<path d="${path(circlePoints(radius, low, tLeft, tRight, 32))}" fill="none" stroke="${C.edge}" stroke-width="2.4"/>`;
        [tLeft, tRight].forEach(t => { const p = [radius * Math.cos(t), low, radius * Math.sin(t)]; out += line3(p, isCone ? tip : [p[0], high, p[2]]); });
      } else out += `<path d="${path(lower)}" fill="none" stroke="${C.edge}" stroke-width="2.4"/>`;
      if (!isCone) out += `<path d="${path(upper)}" fill="none" stroke="${C.edge}" stroke-width="2.4"/>`;
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
      let out = `<circle cx="${center[0]}" cy="${center[1]}" r="${R}" fill="${focus === 'surface' ? '#d8e8f4' : '#e1f0e7'}" stroke="${C.edge}" stroke-width="2.4" data-feature="surface"/>`;
      out += `<path d="${path(circlePoints(a, 0, yaw + Math.PI, yaw + TAU, 32))}" fill="none" stroke="${C.hidden}" stroke-width="1.7" stroke-dasharray="5 5"/>`;
      out += `<path d="${path(circlePoints(a, 0, yaw, yaw + Math.PI, 32))}" fill="none" stroke="${C.edge}" stroke-width="1.7"/>`;
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
        out += line3([x1,y1,z1], [xi,y1,z1], C.height, 'stroke-dasharray="5 5" data-feature="removed"');
        out += line3([x1,y1,z1], [x1,yi,z1], C.height, 'stroke-dasharray="5 5"');
        out += line3([x1,y1,z1], [x1,y1,zi], C.height, 'stroke-dasharray="5 5"');
      }
      return out;
    }
    function tube() {
      const inner = finitePositive(diagram.inner) ? clamp(diagram.inner / largest, 0.05, a * .95) : a * .5;
      let out = roundBody(false);
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
      out += `<path d="${path(topOuter)} Z ${path(topInner.slice().reverse())} Z" fill="${C.base}" fill-rule="evenodd" stroke="${C.edge}" stroke-width="2.2" data-feature="base"/>`;
      const E = [a * Math.cos(yaw + .45), h / 2, a * Math.sin(yaw + .45)], I = [inner * Math.cos(yaw + 2.3), h / 2, inner * Math.sin(yaw + 2.3)];
      feature('radius', [0,h/2,0], E, 'r', C.radius);
      feature('inner-radius', [0,h/2,0], I, 'inner', C.height);
      const side = [a * Math.cos(yaw), -h / 2, a * Math.sin(yaw)];
      feature('height', side, [side[0],h/2,side[2]], 'h', C.height);
      return out;
    }
    function cylinderCone() {
      const bottom = -(h + coneHeight) / 2, seam = bottom + h, top = (h + coneHeight) / 2;
      let out = roundBody(false, a, h, -coneHeight / 2);
      out += roundBody(true, a, coneHeight, h / 2, focus === 'section');
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
      let body;
      if (shape === 'box' || shape === 'cube') body = box();
      else if (shape === 'prism') body = prism();
      else if (shape === 'pyramid') body = pyramid();
      else if (shape === 'cylinder' || shape === 'cone') body = cylinderOrCone();
      else if (shape === 'sphere') body = sphere();
      else body = compound();
      svg.innerHTML = `<title>${esc(title)}</title><desc>${esc(description)} ${esc(Object.entries(labels).map(([key, value]) => shown(key, value)).join('; '))}. ${esc(problemNote)}</desc>${body}${features.join('')}${renderAnnotations()}`;
      svg.dataset.yaw = String(yaw); svg.dataset.pitch = String(pitch);
      svg.dataset.focus = focus; svg.dataset.shape = shape;
      container._profileStereoView = { task: task.id, yaw, pitch };
    }
    render();
    return () => { active = null; listeners.splice(0).forEach(remove => remove()); };
  }
  (root.ProfileLessons || []).filter(lesson => lesson.group === 'stereometry').forEach(lesson => {
    (lesson.tasks || []).forEach(task => { if (task.diagram) taskModels[task.id] = (container, current, context) => drawing(container, current || task, context || {}); });
    if (lesson.model && lesson.tasks && lesson.tasks[0]) labs[lesson.model] = container => drawing(container, lesson.tasks[0], { step: 0, mode: 'introduction' });
  });
})(globalThis);
