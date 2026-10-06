(function (root) {
  'use strict';

  // Coordinates belong to the problem and never change. Only the orthographic
  // camera rotates. Coordinates use the usual order [x, y, z], with z vertical.
  const NS = 'http://www.w3.org/2000/svg';
  const DEFAULT = { yaw: -0.62, pitch: 0.43 };
  const instances = new WeakMap();
  let serial = 0;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const add = (a, b) => a.map((n, i) => n + b[i]);
  const sub = (a, b) => a.map((n, i) => n - b[i]);
  const mul = (a, k) => a.map(n => n * k);
  const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mean = points => mul(points.reduce(add, [0, 0, 0]), 1 / points.length);
  const edgeKey = (a, b) => JSON.stringify([a, b].sort());
  const displayName = name => String(name).replace(/_?([0-9]+)$/g, digits => digits.replace('_', '').replace(/[0-9]/g, n => '₀₁₂₃₄₅₆₇₈₉'[n]));

  function element(tag, attrs, text, svg) {
    const node = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function prepare(source) {
    if (!source || !source.points || !Object.keys(source.points).length) throw new TypeError('У модели нет точек.');
    const points = {};
    Object.entries(source.points).forEach(([name, point]) => {
      if (!Array.isArray(point) || point.length !== 3 || !point.every(Number.isFinite)) throw new TypeError('Некорректные координаты точки ' + name);
      points[name] = point.slice();
    });
    const exists = name => Object.prototype.hasOwnProperty.call(points, name);
    const checked = (names, minimum, kind) => {
      if (!Array.isArray(names) || names.length < minimum || !names.every(exists)) throw new TypeError('Некорректные точки: ' + kind);
      return names.slice();
    };
    const edges = (source.edges || []).map(edge => {
      if (!Array.isArray(edge) || edge.length !== 2) throw new TypeError('Ребро должно соединять две точки.');
      return checked(edge, 2, 'ребро');
    });
    const faces = (source.faces || []).map(face => checked(face, 3, 'грань'));
    const views = {};
    Object.entries(source.views || {}).forEach(([key, view]) => {
      views[key] = {
        label: String(view.label || ''),
        segments: (view.segments || []).map(segment => {
          if (!Array.isArray(segment) || segment.length !== 2) throw new TypeError('Отрезок должен соединять две точки.');
          return checked(segment, 2, 'выделенный отрезок');
        }),
        polygon: view.polygon && view.polygon.length ? checked(view.polygon, 3, 'выделенная плоскость') : [],
        points: view.points && view.points.length ? checked(view.points, 1, 'точки вида') : []
      };
    });
    if (!views.neutral) views.neutral = { label: 'Исходная фигура.', segments: [], polygon: [], points: [] };
    const baseNames = new Set([...edges.flat(), ...faces.flat(), ...(source.neutralPoints || [])]);
    if (!baseNames.size) Object.keys(points).forEach(name => baseNames.add(name));
    if (![...baseNames].every(exists)) throw new TypeError('Неизвестная точка исходной фигуры.');
    const values = Object.values(points);
    const center = [0, 1, 2].map(i => (Math.min(...values.map(p => p[i])) + Math.max(...values.map(p => p[i]))) / 2);
    const radius = Math.max(...values.map(p => Math.hypot(...sub(p, center))), 0.001);
    const bodyNames = [...new Set(faces.flat())];
    const bodyCenter = bodyNames.length ? mean(bodyNames.map(name => points[name])) : center;
    const adjacency = new Map();
    let convex = faces.length >= 4;
    const preparedFaces = faces.map((names, index) => {
      const vertices = names.map(name => points[name]);
      let normal = [0, 0, 0];
      for (let i = 1; i < vertices.length - 1; i++) {
        normal = cross(sub(vertices[i], vertices[0]), sub(vertices[i + 1], vertices[0]));
        if (Math.hypot(...normal) > radius * radius * 1e-10) break;
      }
      const length = Math.hypot(...normal);
      if (length < radius * radius * 1e-10) convex = false;
      normal = mul(normal, 1 / Math.max(length, 1e-20));
      const faceCenter = mean(vertices);
      if (dot(normal, sub(faceCenter, bodyCenter)) < 0) normal = mul(normal, -1);
      if (vertices.some(p => Math.abs(dot(normal, sub(p, vertices[0]))) > radius * 1e-8)) convex = false;
      if (bodyNames.some(name => dot(normal, sub(points[name], vertices[0])) > radius * 1e-8)) convex = false;
      names.forEach((name, i) => {
        const key = edgeKey(name, names[(i + 1) % names.length]);
        if (!adjacency.has(key)) adjacency.set(key, []);
        adjacency.get(key).push(index);
      });
      return { names, normal, center: faceCenter };
    });
    if ([...adjacency.values()].some(indices => indices.length !== 2)) convex = false;
    return { points, edges, faces: preparedFaces, views, baseNames, center, radius, adjacency, convex };
  }

  function mount(container, source) {
    if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('Нужен контейнер модели.');
    const data = prepare(source);
    if (instances.has(container)) instances.get(container).destroy();
    const id = 'atanasyan-model-' + (++serial);
    const shell = element('div', { class: 'atanasyan-model', 'data-model': 'atanasyan-exact' });
    const svg = element('svg', {
      class: 'am-svg', viewBox: '0 0 420 320', role: 'img', tabindex: '0',
      'aria-labelledby': id + '-title', 'aria-describedby': id + '-description ' + id + '-help'
    }, undefined, true);
    const focusNote = element('p', { class: 'am-focus', 'aria-live': 'polite', 'aria-atomic': 'true' });
    const controls = element('div', { class: 'am-controls', role: 'group', 'aria-label': 'Вращение пространственной модели' });
    const instructions = element('p', { class: 'am-help', id: id + '-help' }, 'Перетаскивай модель или используй стрелки. Home — исходный вид.');
    const legend = element('p', { class: 'am-legend' });
    const lineKey = element('span', { class: 'am-line-key' }, 'Отрезки');
    const planeKey = element('span', { class: 'am-plane-key' }, 'Часть плоскости');
    legend.append(lineKey, planeKey);
    const note = element('p', { class: 'am-note' }, 'Вращение не меняет геометрию. Вид на экране не доказывает равенство или перпендикулярность. ' + (data.convex ? 'Невидимые рёбра показаны штрихами.' : 'Схема: все рёбра показаны сплошными линиями.'));
    const status = element('p', { class: 'am-sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    shell.append(svg, instructions, controls, focusNote, legend, note, status);
    container.replaceChildren(shell);
    const removers = [];
    let yaw = DEFAULT.yaw, pitch = DEFAULT.pitch, selected = 'neutral', active = null, destroyed = false;
    const on = (node, type, fn) => { node.addEventListener(type, fn); removers.push(() => node.removeEventListener(type, fn)); };

    function rotated(point) {
      const [x, y, z] = point;
      const depth = x * Math.sin(yaw) + y * Math.cos(yaw);
      return [x * Math.cos(yaw) - y * Math.sin(yaw), z * Math.cos(pitch) - depth * Math.sin(pitch), z * Math.sin(pitch) + depth * Math.cos(pitch)];
    }
    function project(point) {
      const q = rotated(sub(point, data.center));
      const scale = 125 / data.radius;
      return [210 + q[0] * scale, 155 - q[1] * scale, q[2]];
    }
    function path(names) {
      return names.map((name, i) => {
        const p = project(data.points[name]);
        return (i ? 'L' : 'M') + p[0].toFixed(3) + ' ' + p[1].toFixed(3);
      }).join(' ');
    }
    function drawPath(names, className, closed, extra) {
      return element('path', Object.assign({ d: path(names) + (closed ? ' Z' : ''), class: className }, extra || {}), undefined, true);
    }

    function render() {
      if (destroyed) return;
      const view = data.views[selected];
      const title = element('title', { id: id + '-title' }, source.title || 'Пространственная модель задачи', true);
      const description = element('desc', { id: id + '-description' }, [view.label, view.segments.length ? 'Выделены отрезки: ' + view.segments.map(segment => segment.map(displayName).join(' — ')).join(', ') + '.' : '', view.polygon.length ? 'Выделена часть плоскости: ' + view.polygon.map(displayName).join(', ') + '.' : '', 'Это проекция точной пространственной конфигурации.'].filter(Boolean).join(' '), true);
      const drawing = element('g', { 'aria-hidden': 'true' }, undefined, true);
      // An edge-on face still exposes its boundary (a silhouette must be solid).
      const faces = data.faces.map((face, index) => ({ ...face, index, front: rotated(face.normal)[2] >= -1e-9, depth: rotated(sub(face.center, data.center))[2] }));
      faces.slice().sort((a, b) => a.depth - b.depth).forEach(face => drawing.append(drawPath(face.names, 'am-face' + (face.front ? ' am-face-front' : ''), true)));
      if (view.polygon.length) drawing.append(drawPath(view.polygon, 'am-plane', true, { 'data-highlight': 'plane' }));
      data.edges.forEach(edge => {
        const adjacent = data.adjacency.get(edgeKey(...edge));
        const hidden = data.convex && adjacent && adjacent.length === 2 && adjacent.every(index => !faces[index].front);
        drawing.append(drawPath(edge, 'am-edge' + (hidden ? ' am-edge-hidden' : ''), false, { 'data-edge': edge.join('-'), 'data-hidden': String(!!hidden) }));
      });
      if (view.polygon.length) drawing.append(drawPath(view.polygon, 'am-plane-border', true));
      view.segments.forEach(segment => drawing.append(drawPath(segment, 'am-segment', false, { 'data-highlight': 'segment', 'data-segment': segment.join('-') })));
      const focused = new Set([...view.segments.flat(), ...view.polygon, ...view.points]);
      const visible = [...new Set([...data.baseNames, ...focused])];
      const projected = visible.map(name => ({ name, point: project(data.points[name]), focused: focused.has(name) }));
      // Greedy screen-space label placement avoids fixed offsets that overlap at
      // particular angles. Labels never change the actual point positions.
      const occupied = [];
      projected.sort((a, b) => Number(b.focused) - Number(a.focused)).forEach(item => {
        const [x, y] = item.point;
        const name = displayName(item.name);
        const width = Math.max(13, [...name].length * 9.5);
        const candidates = [[11, -12], [-width - 9, -12], [11, 18], [-width - 9, 18], [-width / 2, -18], [-width / 2, 25], [20, 3], [-width - 20, 3]];
        let best = null;
        candidates.forEach(([dx, dy], order) => {
          const left = clamp(x + dx, 8, 412 - width), baseline = clamp(y + dy, 19, 307);
          const rect = { left: left - 3, top: baseline - 16, right: left + width + 3, bottom: baseline + 5 };
          const overlaps = occupied.reduce((sum, box) => sum + Math.max(0, Math.min(box.right, rect.right) - Math.max(box.left, rect.left)) * Math.max(0, Math.min(box.bottom, rect.bottom) - Math.max(box.top, rect.top)), 0);
          const nearPoints = projected.reduce((sum, other) => sum + (other.point[0] >= rect.left && other.point[0] <= rect.right && other.point[1] >= rect.top && other.point[1] <= rect.bottom ? 400 : 0), 0);
          const score = overlaps + nearPoints + order * 0.2;
          if (!best || score < best.score) best = { left, baseline, rect, score };
        });
        occupied.push(best.rect);
        drawing.append(element('circle', { cx: x.toFixed(3), cy: y.toFixed(3), r: item.focused ? '2.2' : '1.7', class: 'am-point' + (item.focused ? ' am-point-focus' : ''), 'data-point': item.name }, undefined, true));
        drawing.append(element('text', { x: best.left.toFixed(3), y: best.baseline.toFixed(3), class: 'am-label', 'data-label': item.name }, name, true));
      });
      svg.replaceChildren(title, description, drawing);
      svg.dataset.view = selected;
      svg.dataset.yaw = yaw.toFixed(5);
      svg.dataset.pitch = pitch.toFixed(5);
      shell.dataset.view = selected;
    }

    function announce(message) { status.textContent = message; }
    function rotate(dx, dy, speak) {
      yaw = ((yaw + dx) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      pitch = clamp(pitch + dy, -Math.PI / 2 + 0.03, Math.PI / 2 - 0.03);
      render();
      if (speak) announce('Вид модели изменён. Геометрия осталась прежней.');
    }
    function reset() { yaw = DEFAULT.yaw; pitch = DEFAULT.pitch; render(); announce('Исходный вид модели восстановлен.'); }
    [['←', 'Повернуть влево', () => rotate(-Math.PI / 12, 0, true)], ['→', 'Повернуть вправо', () => rotate(Math.PI / 12, 0, true)], ['↑', 'Наклонить вверх', () => rotate(0, Math.PI / 18, true)], ['↓', 'Наклонить вниз', () => rotate(0, -Math.PI / 18, true)], ['Сброс', 'Вернуть исходный вид', reset]].forEach(([text, label, action]) => {
      const button = element('button', { type: 'button', class: 'am-button', 'aria-label': label, title: label }, text);
      on(button, 'click', action); controls.append(button);
    });
    on(svg, 'keydown', event => {
      const moves = { ArrowLeft: [-Math.PI / 24, 0], ArrowRight: [Math.PI / 24, 0], ArrowUp: [0, Math.PI / 36], ArrowDown: [0, -Math.PI / 36] };
      if (moves[event.key]) { event.preventDefault(); rotate(...moves[event.key], true); }
      else if (event.key === 'Home') { event.preventDefault(); reset(); }
    });
    on(svg, 'pointerdown', event => {
      if (event.button !== 0 || active) return;
      active = { id: event.pointerId, x: event.clientX, y: event.clientY };
      svg.classList.add('am-dragging');
      if (svg.setPointerCapture) svg.setPointerCapture(event.pointerId);
    });
    on(svg, 'pointermove', event => {
      if (!active || active.id !== event.pointerId) return;
      const dx = event.clientX - active.x, dy = event.clientY - active.y;
      active.x = event.clientX; active.y = event.clientY;
      rotate(dx * 0.009, -dy * 0.007, false);
    });
    function release(event) {
      if (!active || active.id !== event.pointerId) return;
      active = null; svg.classList.remove('am-dragging');
      if (svg.hasPointerCapture && svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    }
    on(svg, 'pointerup', release); on(svg, 'pointercancel', release);
    on(svg, 'lostpointercapture', () => { active = null; svg.classList.remove('am-dragging'); });
    const api = {
      setView(key) {
        if (destroyed) return false;
        const known = Object.prototype.hasOwnProperty.call(data.views, key);
        selected = known ? key : 'neutral';
        focusNote.textContent = data.views[selected].label || 'Исходная фигура.';
        legend.hidden = !data.views[selected].segments.length && !data.views[selected].polygon.length;
        lineKey.hidden = !data.views[selected].segments.length;
        planeKey.hidden = !data.views[selected].polygon.length;
        render();
        return known;
      },
      reset,
      getState() { return { view: selected, yaw, pitch }; },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (active && svg.hasPointerCapture && svg.hasPointerCapture(active.id)) svg.releasePointerCapture(active.id);
        active = null;
        removers.forEach(remove => remove());
        shell.remove();
        if (instances.get(container) === api) instances.delete(container);
      }
    };
    instances.set(container, api);
    api.setView('neutral');
    return api;
  }

  root.AtanasyanModel = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
