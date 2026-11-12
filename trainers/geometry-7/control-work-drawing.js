(() => {
  'use strict';

  const G = window.GeoMath;
  if (!G) return;
  const width = 640;
  const height = 420;
  const primary = ['point', 'segment', 'ray', 'line', 'move'];
  const tools = {
    point: ['Точка', 'Нажми на поле. Рядом с линией точка встанет на неё.'],
    segment: ['Отрезок', 'Выбери два конца отрезка.', 2],
    ray: ['Луч', 'Выбери начало луча, затем точку на нём.', 2],
    line: ['Прямая', 'Выбери две точки прямой.', 2],
    move: ['Двигать', 'Потяни точку или нажми на неё, чтобы изменить подпись.'],
    intersection: ['Пересечение', 'Нажми на две линии в стороне от пересечения.', 2],
    midpoint: ['Середина', 'Выбери два конца отрезка.', 2],
    bisector: ['Биссектриса', 'Выбери точку первого луча, вершину, затем точку второго луча.', 3],
    perpendicular: ['Перпендикуляр', 'Выбери точку, затем две точки линии, к которой опускаешь перпендикуляр.', 3],
    arc: ['Дуга угла', 'Выбери точку на стороне, вершину и точку на другой стороне.', 3],
    tick: ['Засечка', 'Выбери два конца отрезка, который хочешь отметить.', 2],
    label: ['Подпись', 'Впиши обозначение и нажми на поле.']
  };

  function createRecord(saved) {
    const board = new G.Board({ points: [], objects: [] });
    if (Array.isArray(saved?.points) && saved.points.length <= 150 &&
        saved.points.every(p => p && typeof p.id === 'string' && Number.isFinite(p.x) && Number.isFinite(p.y)) &&
        Array.isArray(saved.objects) && saved.objects.length <= 175 &&
        saved.objects.every(o => o && typeof o.id === 'string' && typeof o.a === 'string' && typeof o.b === 'string')) {
      board.points = saved.points;
      board.objects = saved.objects;
      board.update();
    }
    const marks = Array.isArray(saved?.marks) ? saved.marks.filter(mark => mark && typeof mark === 'object').slice(0, 150) : [];
    return { board, marks, history: [] };
  }

  function svgNode(tag, attributes, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const at = (a, b, t) => G.add(a, G.mul(G.sub(b, a), t));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const finite = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const valid = p => finite(p) && p.valid !== false;
  const nameOf = p => p.label || p.id;
  const extentBounds = extent => [extent === 'line' ? -Infinity : 0, extent === 'segment' ? 1 : Infinity];
  const parameter = (geometry, p) => {
    const direction = G.sub(geometry.q, geometry.p);
    return G.dot(G.sub(p, geometry.p), direction) / G.dot(direction, direction);
  };

  function clip(geometry, extent) {
    let [min, max] = extentBounds(extent);
    for (const [axis, limit] of [['x', width], ['y', height]]) {
      const start = geometry.p[axis];
      const direction = geometry.q[axis] - start;
      if (Math.abs(direction) < G.EPS) {
        if (start < 7 || start > limit - 7) return null;
        continue;
      }
      const sides = [(7 - start) / direction, (limit - 7 - start) / direction];
      min = Math.max(min, Math.min(...sides));
      max = Math.min(max, Math.max(...sides));
    }
    return min < max ? [at(geometry.p, geometry.q, min), at(geometry.p, geometry.q, max)] : null;
  }

  function mount(el, record, names, onChange) {
    const { board, history } = record;
    let tool = 'point';
    let selected = [];
    let editing = null;
    let drag = null;
    let cursor = null;

    const buttons = ids => ids.map(id =>
      `<button class="btn drawing-tool" type="button" data-tool="${id}" aria-pressed="false">${tools[id][0]}</button>`
    ).join('');
    el.innerHTML = `
      <div class="drawing-tools" role="group" aria-label="Основные инструменты">${buttons(primary)}</div>
      <details class="written-details drawing-extra">
        <summary>Другие инструменты</summary>
        <div class="drawing-tools" role="group" aria-label="Другие инструменты">${buttons(Object.keys(tools).filter(id => !primary.includes(id)))}</div>
      </details>
      <p class="drawing-instruction" id="drawing-instruction" aria-live="polite"></p>
      <svg class="drawing-surface" viewBox="0 0 ${width} ${height}" role="group" tabindex="0"
           aria-label="Поле чертежа" aria-describedby="drawing-instruction drawing-keys"></svg>
      <p id="drawing-keys" class="visually-hidden">Стрелки перемещают курсор. Enter выполняет действие. Escape отменяет выбор. Ctrl+Z отменяет последнее действие.</p>
      <div class="drawing-name">
        <label for="drawing-text">Имя точки</label>
        <input id="drawing-text" type="text" maxlength="24" autocomplete="off" spellcheck="false">
        <button class="btn" type="button" data-drawing="rename" hidden>Переименовать</button>
      </div>
      <div class="drawing-actions">
        <button class="btn" type="button" data-drawing="undo">↶ Отменить</button>
        <button class="btn" type="button" data-drawing="clear">Очистить чертёж</button>
      </div>
      <p class="drawing-feedback" role="status"></p>`;
    const svg = el.querySelector('svg');
    const input = el.querySelector('input');
    const nameRow = el.querySelector('.drawing-name');
    const instruction = el.querySelector('.drawing-instruction');
    const feedback = el.querySelector('.drawing-feedback');
    const undoButton = el.querySelector('[data-drawing="undo"]');
    const clearButton = el.querySelector('[data-drawing="clear"]');
    const renameButton = el.querySelector('[data-drawing="rename"]');
    const preferredNames = [...new Set([...names, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'])];

    const capture = () => ({ points: board.points, objects: board.objects, marks: record.marks });
    const snapshot = () => JSON.stringify(capture());
    function restore(value) {
      const saved = JSON.parse(value);
      board.points = saved.points;
      board.objects = saved.objects;
      record.marks = saved.marks;
      board.update();
    }

    function nextName() {
      return preferredNames.find(name => board.points.every(p => nameOf(p) !== name)) ?? `P${board.points.length + 1}`;
    }

    function setName(p, value) {
      if (!/^[\p{L}\p{N}′'₀-₉]{1,6}$/u.test(value)) throw new Error('Имя точки должно содержать от 1 до 6 букв или цифр.');
      if (board.points.some(other => other !== p && nameOf(other) === value)) throw new Error(`Точка ${value} уже есть на чертеже.`);
      p.label = value;
    }

    function syncControls() {
      const chosen = selected.map(id => {
        const point = board.point(id);
        if (point) return nameOf(point);
        const object = board.object(id);
        return object ? nameOf(board.point(object.a)) + nameOf(board.point(object.b)) : id;
      });
      instruction.textContent = tools[tool][1] + (chosen.length ? ` Выбрано: ${chosen.join(', ')}.` : '');
      undoButton.disabled = !history.length && !selected.length;
      clearButton.disabled = !board.points.length && !record.marks.length;
      el.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tool === tool)));
      const editingPoint = tool === 'move' && board.point(editing);
      nameRow.hidden = tool !== 'point' && tool !== 'label' && !editingPoint;
      renameButton.hidden = !editingPoint;
      nameRow.querySelector('label').textContent = tool === 'label' ? 'Текст на чертеже' : 'Имя точки';
      input.placeholder = tool === 'point' ? nextName() : tool === 'label' ? 'Например, 68°' : '';
    }

    function remember(before) {
      history.push(before);
      if (history.length > 80) history.shift();
      board.history.length = 0;
      onChange(capture());
    }

    function mutate(apply, message) {
      const before = snapshot();
      try {
        apply();
      } catch (error) {
        restore(before);
        board.history.length = 0;
        feedback.textContent = error.message;
        return false;
      }
      remember(before);
      feedback.textContent = message;
      return true;
    }

    const scale = () => width / (svg.clientWidth || width);

    function lineNode(a, b, className) {
      return svgNode('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: className });
    }

    function drawMark(mark, size) {
      if (mark.kind === 'label') {
        return finite(mark) && typeof mark.text === 'string'
          ? svgNode('text', { x: mark.x, y: mark.y, 'font-size': 14 * size, class: 'drawing-annotation' }, mark.text)
          : null;
      }
      if (!Array.isArray(mark.ids)) return null;
      const [a, b, c] = mark.ids.map(id => board.point(id));
      if (!valid(a) || !valid(b)) return null;
      if (mark.kind === 'tick') {
        const mid = at(a, b, 0.5);
        const step = G.mul(G.unit(G.rot(G.sub(b, a))), 5 * size);
        return lineNode(G.sub(mid, step), G.add(mid, step), 'drawing-mark');
      }
      if (!valid(c)) return null;
      if (mark.kind === 'right') {
        const start = G.dist(a, b) > G.EPS ? a : board.point(mark.other);
        if (!valid(start)) return null;
        const side = Math.min(10 * size, G.dist(b, c) / 3);
        const u = G.mul(G.unit(G.sub(start, b)), side);
        const v = G.mul(G.unit(G.sub(c, b)), side);
        const points = [G.add(b, u), G.add(G.add(b, u), v), G.add(b, v)];
        return svgNode('polyline', { points: points.map(p => `${p.x},${p.y}`).join(' '), class: 'drawing-mark' });
      }
      if (mark.kind !== 'arc') return null;
      const angle = G.angle(a, b, c);
      if (angle === null || angle < G.EPS) return null;
      const radius = Math.min(20 * size, G.dist(a, b) * 0.7, G.dist(b, c) * 0.7);
      const from = at(b, a, radius / G.dist(a, b));
      const to = at(b, c, radius / G.dist(b, c));
      const sweep = G.cross(G.sub(a, b), G.sub(c, b)) >= 0 ? 1 : 0;
      return svgNode('path', {
        d: `M${from.x},${from.y} A${radius},${radius} 0 0 ${sweep} ${to.x},${to.y}`,
        class: 'drawing-mark'
      });
    }

    function draw() {
      const size = scale();
      const picture = document.createDocumentFragment();
      for (const object of board.objects) {
        const geometry = board.geometry(object);
        if (!geometry || geometry.type !== 'line') continue;
        const ends = clip(geometry, object.extent);
        if (!ends) continue;
        const [a, b] = ends;
        const className = selected.includes(object.id) ? 'drawing-line selected' : 'drawing-line';
        picture.append(lineNode(a, b, className));
        if (object.extent === 'ray' && G.dist(a, b) > 15 * size) {
          const direction = G.unit(G.sub(b, a));
          const base = G.sub(b, G.mul(direction, 8 * size));
          const side = G.mul(G.rot(direction), 3.5 * size);
          picture.append(lineNode(b, G.add(base, side), className), lineNode(b, G.sub(base, side), className));
        }
      }
      for (const mark of record.marks) {
        const node = drawMark(mark, size);
        if (node) picture.append(node);
      }
      for (const point of board.points.filter(valid)) {
        const chosen = selected.includes(point.id) || point.id === editing;
        picture.append(svgNode('circle', {
          cx: point.x, cy: point.y, r: (chosen ? 5.5 : 3.6) * size,
          class: chosen ? 'drawing-point selected' : 'drawing-point'
        }));
        const font = 13 * size;
        const label = nameOf(point);
        const x = clamp(point.x + 6 * size, 0, width - (label.length * 9 + 4) * size);
        picture.append(svgNode('text', { x, y: Math.max(font, point.y - 6 * size), 'font-size': font, class: 'drawing-annotation' }, label));
      }
      if (cursor) {
        const arm = 7 * size;
        picture.append(svgNode('path', {
          d: `M${cursor.x - arm},${cursor.y}h${2 * arm} M${cursor.x},${cursor.y - arm}v${2 * arm}`,
          class: 'drawing-cursor'
        }));
      }
      svg.replaceChildren(picture);
    }

    function nearbyPoint(position) {
      const size = scale();
      return board.points.filter(valid)
        .map(p => ({ p, distance: Math.min(G.dist(p, position), G.dist({ x: p.x + 10 * size, y: p.y - 9 * size }, position)) }))
        .sort((a, b) => a.distance - b.distance)
        .find(({ distance }) => distance <= 13 * size)?.p;
    }

    function nearbyLine(position) {
      const candidates = [];
      for (const object of board.objects) {
        const geometry = board.geometry(object);
        if (!geometry || geometry.type !== 'line') continue;
        const t = parameter(geometry, position);
        const [min, max] = extentBounds(object.extent);
        if (t < min || t > max) continue;
        const distance = G.dist(position, at(geometry.p, geometry.q, t));
        if (distance <= 10 * scale()) candidates.push({ object, t, distance });
      }
      return candidates.sort((a, b) => a.distance - b.distance)[0];
    }

    function construct() {
      if (tool === 'arc' || tool === 'tick') {
        if (record.marks.length >= 150) throw new Error('На чертеже уже 150 отметок.');
        const [a, b, c] = selected.map(id => board.point(id));
        if (tool === 'arc' && !G.angle(a, b, c)) throw new Error('Выбери точки на разных сторонах угла.');
        record.marks.push({ kind: tool, ids: selected.slice() });
        return;
      }
      if (tool === 'intersection') {
        const objects = selected.map(id => board.object(id));
        const geometries = objects.map(object => board.geometry(object));
        const [crossing] = G.intersections(...geometries);
        if (!crossing || !geometries.every((geometry, index) => {
          const t = parameter(geometry, crossing);
          const [min, max] = extentBounds(objects[index].extent);
          return t >= min - G.EPS && t <= max + G.EPS;
        })) throw new Error('Выбранные линии не пересекаются на своих показанных частях.');
        if (board.points.length >= 150) throw new Error('На чертеже уже 150 точек.');
      }
      const name = nextName();
      const objectCount = board.objects.length;
      const [id] = board.make(tool === 'ray' ? 'line' : tool, selected);
      const object = board.objects[objectCount];
      if (tool === 'ray') object.extent = 'ray';
      if (['intersection', 'midpoint', 'bisector', 'perpendicular'].includes(tool)) {
        const point = board.point(id);
        point.label = name;
        if (tool === 'perpendicular' && point.kind === 'foot') {
          object.extent = 'segment';
          delete object.construction;
          record.marks.push({ kind: 'right', ids: [selected[1], id, selected[0]], other: selected[2] });
        }
      }
    }

    function pick(id) {
      const sharedEndpoint = tool === 'perpendicular' && id === selected[0] && id !== selected[1];
      if (!id || (selected.includes(id) && !sharedEndpoint)) {
        feedback.textContent = id ? 'Выбери другую точку или линию.' : tool === 'intersection' ? 'Нажми на линию.' : 'Нажми на обозначенную точку.';
        return;
      }
      feedback.textContent = '';
      selected.push(id);
      if (selected.length < tools[tool][2]) return;
      if (mutate(construct, 'Построение добавлено.')) selected = [];
      else selected.pop();
    }

    function act(position, point) {
      if (tool === 'point') {
        if (point) {
          feedback.textContent = `Здесь уже есть точка ${nameOf(point)}. Выбери другое место.`;
          return;
        }
        const name = input.value.trim() || nextName();
        const snap = nearbyLine(position);
        if (mutate(() => {
          const p = board.point(board.addPoint(position.x, position.y));
          setName(p, name);
          if (snap) {
            const { id, a, b } = snap.object;
            // Store the parameter on the defining line so the point follows it.
            const axis = { p: board.point(a), q: board.point(b) };
            Object.assign(p, { kind: 'affine', a, b, k: parameter(axis, at(board.geometry(id).p, board.geometry(id).q, snap.t)), host: id });
            board.update();
          }
        }, `Точка ${name} добавлена.`)) input.value = '';
      } else if (tool === 'label') {
        const text = input.value.trim();
        if (!text) feedback.textContent = 'Сначала напиши текст подписи.';
        else if (mutate(() => {
          if (record.marks.length >= 150) throw new Error('На чертеже уже 150 отметок.');
          record.marks.push({ kind: 'label', x: position.x, y: Math.max(16 * scale(), position.y), text });
        }, 'Подпись добавлена.')) input.value = '';
      } else if (tool === 'move') {
        editing = point?.id ?? null;
        input.value = point ? nameOf(point) : '';
        feedback.textContent = '';
      } else {
        pick(tool === 'intersection' ? nearbyLine(position)?.object.id : point?.id);
      }
    }

    function undo() {
      if (selected.length) selected.pop();
      else if (history.length) {
        restore(history.pop());
        editing = null;
        input.value = '';
        onChange(capture());
      }
      feedback.textContent = 'Последнее действие отменено.';
    }

    function rename() {
      const p = board.point(editing);
      if (p) mutate(() => setName(p, input.value.trim()), 'Имя точки изменено.');
    }

    function repaint() {
      syncControls();
      draw();
    }

    function coordinates(event) {
      return new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    }

    function movePoint(p, position) {
      if (p.kind === 'affine') {
        const host = board.object(p.host);
        const a = board.point(p.a);
        const b = board.point(p.b);
        if (!valid(a) || !valid(b) || G.dist(a, b) < G.EPS || !host) return false;
        p.k = clamp(parameter({ p: a, q: b }, position), ...extentBounds(host.extent));
        board.update();
        return true;
      }
      return board.move(p.id, position.x, position.y);
    }

    svg.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      svg.focus({ preventScroll: true });
      cursor = null;
      const position = coordinates(event);
      const point = nearbyPoint(position);
      act(position, point);
      if (tool === 'move' && point) {
        drag = { pointer: event.pointerId, point, before: snapshot(), offset: G.sub(point, position), changed: false };
        svg.setPointerCapture(event.pointerId);
      }
      repaint();
    });
    svg.addEventListener('pointermove', event => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const target = G.add(coordinates(event), drag.offset);
      if (G.dist(target, drag.point) < 0.5) return;
      if (movePoint(drag.point, target)) {
        drag.changed = true;
        draw();
      } else feedback.textContent = 'Эта точка зависит от других. Передвинь исходную точку.';
    });
    function endDrag(event) {
      if (!drag || (event && event.pointerId !== drag.pointer)) return;
      if (drag.changed) remember(drag.before);
      drag = null;
      repaint();
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) svg.addEventListener(event, endDrag);

    svg.addEventListener('keydown', event => {
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (direction) {
        const step = event.shiftKey ? 28 : 7;
        cursor ||= { x: width / 2, y: height / 2 };
        cursor = { x: clamp(cursor.x + direction[0] * step, 10, width - 10), y: clamp(cursor.y + direction[1] * step, 18, height - 18) };
      } else if (event.key === 'Enter' || event.key === ' ') {
        cursor ||= { x: width / 2, y: height / 2 };
        act(cursor, nearbyPoint(cursor));
      } else if (event.key === 'Escape') {
        selected = [];
        cursor = null;
        feedback.textContent = '';
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') undo();
      else return;
      event.preventDefault();
      repaint();
    });

    el.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.tool) {
        tool = button.dataset.tool;
        selected = [];
        editing = null;
        input.value = '';
        feedback.textContent = '';
      }
      if (button.dataset.drawing === 'undo') undo();
      if (button.dataset.drawing === 'rename') rename();
      if (button.dataset.drawing === 'clear') {
        mutate(() => {
          board.reset();
          record.marks = [];
          selected = [];
          editing = null;
          input.value = '';
          tool = 'point';
        }, 'Чертёж очищен. Действие можно отменить.');
      }
      repaint();
    });
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (!renameButton.hidden) rename();
      else svg.focus();
      repaint();
    });

    const observer = new ResizeObserver(draw);
    observer.observe(svg);
    repaint();
    return { destroy() { endDrag(); observer.disconnect(); } };
  }

  window.GeometryControlDrawing = { createRecord, mount };
})();
