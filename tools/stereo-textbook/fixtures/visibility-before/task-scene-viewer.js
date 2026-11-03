/* Derived from existing AtanasyanModel; render-only scene camera and labels. */
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
    const arrows = (source.arrows || []).map(a => checked(a,2,'вектор'));
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
    const baseNames = new Set(source.labelNames || [...edges.flat(), ...faces.flat(), ...(source.neutralPoints || [])]);
    if (!baseNames.size && !source.labelNames) Object.keys(points).forEach(name => baseNames.add(name));
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
    return { points, edges, arrows, faces: preparedFaces, views, baseNames, center, radius, adjacency, convex };
  }

  function mount(container, source, options = {}) {
    if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('Нужен контейнер модели.');
    const data = prepare(source);
    if (instances.has(container)) instances.get(container).destroy();
    const id = 'task-scene-model-' + (++serial);
    const shell = element('div', { class: 'atanasyan-model', 'data-model': 'task-bound' });
    const svg = element('svg', {
      class: 'am-svg', viewBox: '0 0 420 320', role: 'img', tabindex: '0',
      'aria-labelledby': id + '-title', 'aria-describedby': id + '-description ' + id + '-help'
    }, undefined, true);
    const focusNote = element('p', { class: 'am-focus', 'aria-live': 'polite', 'aria-atomic': 'true' });
    const controls = element('div', { class: 'am-controls', role: 'group', 'aria-label': 'Вращение пространственной модели' });
    const instructions = element('p', { class: 'am-help', id: id + '-help' }, source.planar ? 'Плоский чертёж. Данные условия подписаны на рисунке.' : 'Вращай модель пальцем, мышью или кнопками. Стрелки — поворот, Home — исходный вид.');
    const legend = element('p', { class: 'am-legend' });
    const lineKey = element('span', { class: 'am-line-key' }, 'Отрезки');
    const planeKey = element('span', { class: 'am-plane-key' }, 'Часть плоскости');
    legend.append(lineKey, planeKey);
    const note = element('p', { class: 'am-note' }, (source.note || 'Вращение не меняет геометрию. Рисунок не заменяет доказательство.') + ' ' + (data.convex ? 'Невидимые рёбра показаны штрихами.' : 'Вспомогательные линии показаны поверх схемы.'));
    const status = element('p', { class: 'am-sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    shell.append(svg, instructions, controls, focusNote, legend, note, status);
    container.replaceChildren(shell);
    const removers = [];
    let viewportWidth=420,viewportHeight=320,expanded=false,previousOverflow='',expansionOrigin=null;
    function fitViewport() {
      // One SVG unit is one content-box pixel, including in nested phone panels.
      // A minimum viewBox width would silently shrink the 20px label font.
      const bounds = svg.getBoundingClientRect();
      const style = typeof getComputedStyle === 'function' ? getComputedStyle(svg) : null;
      const borderX = (parseFloat(style?.borderLeftWidth) || 0) + (parseFloat(style?.borderRightWidth) || 0);
      const borderY = (parseFloat(style?.borderTopWidth) || 0) + (parseFloat(style?.borderBottomWidth) || 0);
      viewportWidth = svg.clientWidth || (bounds.width > borderX ? bounds.width - borderX : 420);
      viewportHeight = Math.max(360, Math.min(680, viewportWidth * .76));
      svg.style.height = (viewportHeight + borderY) + 'px';
      svg.setAttribute('viewBox', '0 0 ' + viewportWidth + ' ' + viewportHeight);
      render();
    }
    const initial = source.planar ? {yaw:0,pitch:-Math.PI/2} : DEFAULT;
    const saved = options.savedCamera;
    let yaw = !source.planar && Number.isFinite(saved?.yaw) ? saved.yaw % (2*Math.PI) : initial.yaw, pitch = !source.planar && Number.isFinite(saved?.pitch) ? clamp(saved.pitch,-Math.PI/2+.03,Math.PI/2-.03) : initial.pitch, selected = 'neutral', active = null, destroyed = false;
    const changed = () => options.onChange?.({yaw,pitch});
    const on = (node, type, fn) => { node.addEventListener(type, fn); removers.push(() => node.removeEventListener(type, fn)); };

    function rotated(point) {
      const [x, y, z] = point;
      const depth = x * Math.sin(yaw) + y * Math.cos(yaw);
      return [x * Math.cos(yaw) - y * Math.sin(yaw), z * Math.cos(pitch) - depth * Math.sin(pitch), z * Math.sin(pitch) + depth * Math.cos(pitch)];
    }
    function project(point) {
      const q = rotated(sub(point, data.center));
      const scale = Math.min(viewportWidth,viewportHeight)*.36 / data.radius;
      return [viewportWidth/2 + q[0] * scale, viewportHeight/2 - q[1] * scale, q[2]];
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
      const defs = element('defs',{},undefined,true), marker=element('marker',{id:id+'-arrow',viewBox:'0 0 10 10',refX:'8',refY:'5',markerWidth:'5',markerHeight:'5',orient:'auto-start-reverse'},undefined,true);marker.append(element('path',{d:'M0 0L10 5L0 10Z',fill:'#bd5724'},undefined,true));defs.append(marker);
      const drawing = element('g', { 'aria-hidden': 'true' }, undefined, true);
      // An edge-on face still exposes its boundary (a silhouette must be solid).
      const faces = data.faces.map((face, index) => ({ ...face, index, front: rotated(face.normal)[2] >= -1e-9, depth: rotated(sub(face.center, data.center))[2] }));
      faces.slice().sort((a, b) => a.depth - b.depth).forEach(face => drawing.append(drawPath(face.names, 'am-face' + (face.front ? ' am-face-front' : ''), true)));
      if (view.polygon.length) drawing.append(drawPath(view.polygon, 'am-plane', true, { 'data-highlight': 'plane' }));
      data.edges.forEach(edge => {
        const adjacent = data.adjacency.get(edgeKey(...edge));
        if(source.smooth && adjacent?.length===2 && dot(data.faces[adjacent[0]].normal,data.faces[adjacent[1]].normal)>.95 && faces[adjacent[0]].front===faces[adjacent[1]].front)return;
        const hidden = data.convex && adjacent && adjacent.length === 2 && adjacent.every(index => !faces[index].front);
        drawing.append(drawPath(edge, 'am-edge' + (hidden ? ' am-edge-hidden' : ''), false, { 'data-edge': edge.join('-'), 'data-hidden': String(!!hidden) }));
      });
      if (view.polygon.length) drawing.append(drawPath(view.polygon, 'am-plane-border', true));
      view.segments.forEach(segment => drawing.append(drawPath(segment, 'am-segment', false, { 'data-highlight': 'segment', 'data-segment': segment.join('-') })));
      data.arrows.forEach(segment=>drawing.append(drawPath(segment,'am-segment',false,{'marker-end':'url(#'+id+'-arrow)','data-vector':segment.join('-')})));
      const focused = new Set([...view.segments.flat(), ...view.polygon, ...view.points]);
      const visible = [...new Set([...data.baseNames, ...focused])].filter(name => !name.startsWith('_') || source.labels?.[name]);
      const projected = visible.map(name => ({ name, point: project(data.points[name]), focused: focused.has(name) }));
      // Measure the rendered font, including subscripts and mathematical labels.
      // The measurement group is attached but invisible; JSDOM uses a deliberately
      // generous fallback because it does not implement SVG text metrics.
      const measurement = element('g', { visibility: 'hidden', 'aria-hidden': 'true' }, undefined, true);
      svg.replaceChildren(title, description, defs, drawing, measurement);
      const labels = projected.map(item => {
        const text = source.labels?.[item.name] || displayName(item.name);
        const node = element('text', { x: 0, y: 0, class: 'am-label', 'data-label': item.name }, text, true);
        measurement.append(node);
        let bounds = null;
        try {
          const measured = node.getBBox?.();
          if (measured && [measured.x, measured.y, measured.width, measured.height].every(Number.isFinite) && measured.width > 0 && measured.height > 0) bounds = measured;
        } catch (_) { /* Detached/hidden SVG or a DOM without layout. */ }
        const metrics = bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } : { x: 0, y: -20, width: Math.max(16, [...text].length * 13), height: 26 };
        return { ...item, node, metrics };
      });
      // Reserve space for long given/unknown labels before placing short vertex
      // names. Collision-free positions always outrank avoiding nearby points.
      labels.sort((a, b) => Number(b.metrics.width >= 40) - Number(a.metrics.width >= 40) || Number(b.focused) - Number(a.focused) || b.metrics.width - a.metrics.width);
      const occupied = [], padding = 3, margin = 7;
      const leaders = element('g', { class: 'am-label-leaders' }, undefined, true);
      const marks = element('g', {}, undefined, true), textLayer = element('g', {}, undefined, true);
      drawing.append(leaders, marks, textLayer);
      const overlapArea = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      for (const item of labels) {
        const [x, y] = item.point, { width, height } = item.metrics;
        let best = null;
        const seen = new Set();
        function consider(left, top) {
          left = clamp(left, margin, Math.max(margin, viewportWidth - margin - width));
          top = clamp(top, margin, Math.max(margin, viewportHeight - margin - height));
          const key = left.toFixed(2) + ':' + top.toFixed(2);
          if (seen.has(key)) return;
          seen.add(key);
          const rect = { left: left - padding, top: top - padding, right: left + width + padding, bottom: top + height + padding };
          const overlap = occupied.reduce((sum, box) => sum + overlapArea(rect, box), 0);
          const coveredPoints = projected.reduce((sum, other) => sum + Number(other.point[0] >= rect.left && other.point[0] <= rect.right && other.point[1] >= rect.top && other.point[1] <= rect.bottom), 0);
          const endX = clamp(x, left, left + width), endY = clamp(y, top, top + height);
          const distance = Math.hypot(endX - x, endY - y);
          const candidate = { left, top, rect, overlap, coveredPoints, distance, endX, endY };
          if (!best || overlap < best.overlap - 1e-6 || Math.abs(overlap - best.overlap) <= 1e-6 && (coveredPoints < best.coveredPoints || coveredPoints === best.coveredPoints && distance < best.distance)) best = candidate;
        }
        for (const gap of [9, 16, 27, 42, 60, 84, 112]) {
          consider(x + gap, y - height - gap);
          consider(x - width - gap, y - height - gap);
          consider(x + gap, y + gap);
          consider(x - width - gap, y + gap);
          consider(x - width / 2, y - height - gap);
          consider(x - width / 2, y + gap);
          consider(x + gap, y - height / 2);
          consider(x - width - gap, y - height / 2);
        }
        // Free strips above/below existing labels cover crowded sections without
        // accepting overlaps just because all nearby candidates are occupied.
        if (!best || best.overlap > 0) {
          const xs = [margin, viewportWidth - margin - width, x - width / 2];
          const ys = [margin, viewportHeight - margin - height, y - height / 2];
          for (const box of occupied) {
            xs.push(box.right + padding, box.left - width - padding);
            ys.push(box.bottom + padding, box.top - height - padding);
          }
          for (const left of xs) for (const top of ys) consider(left, top);
        }
        occupied.push(best.rect);
        if (best.distance > 16) leaders.append(element('line', { x1: x.toFixed(3), y1: y.toFixed(3), x2: best.endX.toFixed(3), y2: best.endY.toFixed(3), class: 'am-label-leader', 'data-for-label': item.name }, undefined, true));
        if (!item.name.startsWith('_d') && !item.name.startsWith('_area')) marks.append(element('circle', { cx: x.toFixed(3), cy: y.toFixed(3), r: item.focused ? '2.2' : '1.7', class: 'am-point' + (item.focused ? ' am-point-focus' : ''), 'data-point': item.name }, undefined, true));
        item.node.setAttribute('x', (best.left - item.metrics.x).toFixed(3));
        item.node.setAttribute('y', (best.top - item.metrics.y).toFixed(3));
        textLayer.append(item.node);
      }
      measurement.remove();
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
      changed();
      if (speak) announce('Вид модели изменён. Геометрия осталась прежней.');
    }
    const expandButton=element('button',{type:'button',class:'am-button am-expand','aria-expanded':'false'},'Развернуть рисунок');controls.append(expandButton);
    function rememberExpansionOrigin() {
      const bounds=shell.getBoundingClientRect(),style=getComputedStyle(shell),ancestors=[],left=window.scrollX,top=window.scrollY;
      for(let node=shell.parentElement;node;node=node.parentElement)ancestors.push({node,left:node.scrollLeft,top:node.scrollTop});
      // A fixed shell leaves normal flow. Retain its complete original space so
      // document/dialog height cannot shrink and clamp their scroll positions.
      const placeholder=element('div',{class:'am-expansion-placeholder','aria-hidden':'true'});
      Object.assign(placeholder.style,{height:bounds.height+'px',boxSizing:'border-box',marginTop:style.marginTop,marginBottom:style.marginBottom,pointerEvents:'none'});
      shell.before(placeholder);
      return {placeholder,ancestors,left,top};
    }
    function restoreExpansionScroll(origin) {
      // Restore inner scroll containers before the document; this includes a
      // containing theory dialog. No deferred restore may affect later navigation.
      for(const saved of origin.ancestors){saved.node.scrollLeft=saved.left;saved.node.scrollTop=saved.top;}
      if(window.scrollX!==origin.left||window.scrollY!==origin.top)window.scrollTo({left:origin.left,top:origin.top,behavior:'instant'});
    }
    function toggleExpanded(force){
      const next=typeof force==='boolean'?force:!expanded;if(next===expanded)return;
      if(next)expansionOrigin=rememberExpansionOrigin();
      expanded=next;shell.classList.toggle('am-expanded',expanded);
      expandButton.textContent=expanded?'Закрыть рисунок':'Развернуть рисунок';expandButton.setAttribute('aria-expanded',String(expanded));
      if(expanded){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');shell.setAttribute('aria-label','Увеличенный рисунок задачи');}
      else{document.body.style.overflow=previousOverflow;shell.removeAttribute('role');shell.removeAttribute('aria-modal');shell.removeAttribute('aria-label');expansionOrigin.placeholder.remove();}
      fitViewport();expandButton.focus({preventScroll:true});
      if(!expanded){restoreExpansionScroll(expansionOrigin);expansionOrigin=null;}
    }
    on(expandButton,'click',()=>toggleExpanded());
    on(shell,'keydown',event=>{if(!expanded)return;if(event.key==='Escape'){event.preventDefault();toggleExpanded(false);}else if(event.key==='Tab'){const all=[...shell.querySelectorAll('button,[tabindex="0"]')],first=all[0],last=all.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
    function reset() { yaw = initial.yaw; pitch = initial.pitch; render(); changed(); announce('Исходный вид модели восстановлен.'); }
    [['←', 'Повернуть влево', () => rotate(-Math.PI / 12, 0, true)], ['→', 'Повернуть вправо', () => rotate(Math.PI / 12, 0, true)], ['↑', 'Наклонить вверх', () => rotate(0, Math.PI / 18, true)], ['↓', 'Наклонить вниз', () => rotate(0, -Math.PI / 18, true)], ['Сброс', 'Вернуть исходный вид', reset]].forEach(([text, label, action]) => {
      if (source.planar) return;
      const button = element('button', { type: 'button', class: 'am-button', 'aria-label': label, title: label }, text);
      on(button, 'click', action); controls.append(button);
    });
    on(svg, 'keydown', event => {
      if (source.planar) return;
      const moves = { ArrowLeft: [-Math.PI / 24, 0], ArrowRight: [Math.PI / 24, 0], ArrowUp: [0, Math.PI / 36], ArrowDown: [0, -Math.PI / 36] };
      if (moves[event.key]) { event.preventDefault(); rotate(...moves[event.key], true); }
      else if (event.key === 'Home') { event.preventDefault(); reset(); }
    });
    on(svg, 'pointerdown', event => {
      if (source.planar || event.button !== 0 || active) return;
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
      getState() { return { yaw, pitch }; },
      destroy() {
        if (destroyed) return;
        if(expanded)toggleExpanded(false);
        destroyed = true;
        if (active && svg.hasPointerCapture && svg.hasPointerCapture(active.id)) svg.releasePointerCapture(active.id);
        active = null;
        removers.forEach(remove => remove());
        shell.remove();
        if (instances.get(container) === api) instances.delete(container);
      }
    };
    instances.set(container, api);
    if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fitViewport);observer.observe(svg);removers.push(()=>observer.disconnect());}
    on(window,'resize',fitViewport);
    fitViewport();
    api.setView('neutral');
    return api;
  }

  root.TaskSceneViewer = { mount, prepare };
  if (typeof module !== 'undefined') module.exports = root.TaskSceneViewer;
})(typeof window !== 'undefined' ? window : globalThis);
