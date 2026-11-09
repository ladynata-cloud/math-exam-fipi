/* SpaceMath editor: semantic state is the source of every dependent object. */
(function (root) {
  'use strict';
  const M = root.SpaceMathModel, $ = id => document.getElementById(id);
  const managed = root.MathExamLearning?.managed === true, standalone = root.parent === root && !managed;
  const STORAGE_KEY = 'mathexam.spacemath.draft.v1';
  const pointTypes = new Set(M.pointTypes), lineTypes = new Set(M.lineTypes);
  const names = { point: 'Точка', segment: 'Отрезок', line: 'Прямая', ray: 'Луч', circle: 'Окружность', polygon: 'Многоугольник', midpoint: 'Середина', intersection: 'Пересечение', parallel: 'Параллельная', perpendicular: 'Перпендикуляр', bisector: 'Биссектриса', distance: 'Расстояние', angle: 'Угол' };
  const hints = {
    move: 'Перетаскивайте свободные точки. Зависимые объекты следуют за ними.',
    point: 'Коснитесь свободного места на поле. Или задайте координаты справа.',
    segment: 'Выберите начало и конец отрезка. На свободном месте появится новая точка.',
    line: 'Выберите две точки прямой. На свободном месте появится новая точка.',
    ray: 'Выберите начало луча, затем точку его направления.',
    circle: 'Выберите центр окружности, затем точку на окружности.',
    polygon: 'Выберите вершины по порядку, затем нажмите «Замкнуть».',
    midpoint: 'Выберите две точки — найдём середину между ними.',
    intersection: 'Выберите две прямые, отрезка, луча или окружности.',
    parallel: 'Сначала выберите прямую, отрезок или луч, затем точку новой прямой.',
    perpendicular: 'Сначала выберите прямую, отрезок или луч, затем точку перпендикуляра.',
    bisector: 'Выберите три точки: на первой стороне, вершину угла, на второй стороне.',
    distance: 'Выберите две точки для измерения расстояния.',
    angle: 'Выберите три точки. Вторая точка — вершина измеряемого угла.'
  };
  let state = M.empty(), evaluated, board, drawings = {}, tool = 'move', pending = [], selected = null;
  let readOnly = managed, applying = false, rendering = false, dragBefore = null, dragId = null, lastDragEmit = 0, dragBoundsError = false;
  let history = [], future = [], viewBox = [-8, 6, 8, -6], localSaveWorks = true, uiFrame = null, interactionEpoch = 0;
  const listeners = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  const format = value => Number.isFinite(value) ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(Math.abs(value) < 1e-10 ? 0 : value) : 'не определено';
  function say(message, error = false) { $('feedback').textContent = message; $('feedback').classList.toggle('error', error); }
  function saveAndEmit() {
    if (applying || readOnly) return;
    if (standalone) {
      try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); localSaveWorks = true; }
      catch (_) { localSaveWorks = false; }
      updateSaveStatus();
    }
    for (const listener of listeners) listener();
  }
  function updateSaveStatus() {
    $('save-status').textContent = readOnly ? 'Просмотр · без изменений' : managed ? 'Работа в кабинете' : standalone ? (localSaveWorks ? 'Черновик сохранён в браузере' : 'Скачайте модель — автосохранение недоступно') : 'Общая доска';
  }
  function commit(change, message) {
    if (readOnly || applying) return false;
    const before = clone(state), candidate = clone(state);
    try {
      change(candidate);
      const normalized = M.normalize(candidate);
      if (JSON.stringify(before) === JSON.stringify(normalized)) return false;
      history.push(before); if (history.length > 60) history.shift(); future = [];
      interactionEpoch++; state = normalized; render(); saveAndEmit(); if (message) say(message); return true;
    } catch (error) { say(error.message || 'Не удалось изменить построение.', true); return false; }
  }
  function nextId() { let serial = 1; while (state.objects.some(o => o.id === 'o' + serial)) serial++; return 'o' + serial; }
  function pointLabel() {
    const used = new Set(state.objects.filter(o => pointTypes.has(o.type)).map(o => o.label));
    let i = 0, label;
    do { label = String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) : ''); i++; } while (used.has(label));
    return label;
  }
  function object(id) { return state.objects.find(o => o.id === id); }
  function label(id) { const item = object(id); return item?.label || names[item?.type] || id; }
  function addPoint(x, y, choose = true) {
    const id = nextId(), point = { id, type: 'point', label: pointLabel(), x, y };
    if (commit(s => s.objects.push(point), 'Добавлена точка ' + point.label + '.')) {
      if (choose) { selected = id; renderPanels(); }
      return id;
    }
    return null;
  }
  function expectedPoint() { return !['move', 'point', 'intersection'].includes(tool) && (!['parallel', 'perpendicular'].includes(tool) || pending.length === 1); }
  function accepts(item) {
    if (!item || pending.includes(item.id)) return false;
    if (tool === 'intersection') return lineTypes.has(item.type) || item.type === 'circle';
    if (['parallel', 'perpendicular'].includes(tool) && pending.length === 0) return lineTypes.has(item.type);
    return expectedPoint() && pointTypes.has(item.type);
  }
  function choose(id) {
    selected = id;
    if (!readOnly && tool !== 'move' && tool !== 'point') {
      if (!accepts(object(id))) { say('Этот объект сейчас не подходит. ' + hints[tool], true); renderPanels(); return; }
      pending.push(id);
      const needed = ['angle', 'bisector'].includes(tool) ? 3 : 2;
      if (tool !== 'polygon' && pending.length === needed) finishConstruction();
      else updateTool();
    }
    renderPanels();
  }
  function finishConstruction() {
    if (readOnly || !pending.length || tool === 'polygon' && pending.length < 3) return;
    const type = tool, parents = [...pending], id = nextId();
    const newObject = { id, type, label: pointTypes.has(type) ? pointLabel() : names[type] + ' ' + (state.objects.filter(o => o.type === type).length + 1), parents };
    if (type === 'intersection') newObject.branch = 0;
    const candidate = clone(state); candidate.objects.push(newObject);
    try {
      // Both algebraic roots are retained, including a currently missing root.
      // This keeps the second intersection recoverable when the model moves.
      if (type === 'intersection' && parents.some(parent => object(parent).type === 'circle')) {
        let suffix = 1; while (candidate.objects.some(o => o.id === 'o' + suffix)) suffix++;
        let secondLabel = newObject.label + '₂'; if (secondLabel.length > 30) secondLabel = 'Пересечение 2';
        candidate.objects.push({ id: 'o' + suffix, type, label: secondLabel, parents, branch: 1 });
      }
      M.normalize(candidate);
      pending = [];
      if (commit(s => { s.objects = candidate.objects; })) {
        selected = id;
        const result = val(id);
        say(result.defined ? names[type] + ': построение готово.' : names[type] + ': ' + undefinedReason(newObject, result), !result.defined);
      }
      updateTool();
    } catch (error) { say(error.message, true); }
  }
  function setTool(value) {
    if (readOnly) return;
    interactionEpoch++; tool = value; pending = []; updateTool();
    for (const item of state.objects) if (item.type === 'point') drawings[item.id]?.setAttribute({ fixed: tool !== 'move' });
    renderPanels();
  }
  function updateTool() {
    document.querySelectorAll('[data-tool]').forEach(button => { const active = button.dataset.tool === tool; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    $('tool-hint').textContent = readOnly ? 'Построение открыто для просмотра.' : hints[tool];
    $('pending-selection').textContent = pending.length ? 'Выбрано: ' + pending.map(label).join(' → ') : '';
    $('finish-polygon').hidden = tool !== 'polygon' || pending.length < 3;
    $('cancel-selection').hidden = !pending.length;
  }
  const val = id => evaluated[id];
  function renderBoard() {
    if (!root.JXG) { say('Не загрузился геометрический модуль. Обновите страницу.', true); return; }
    rendering = true;
    try {
      if (board) { viewBox = board.getBoundingBox(); root.JXG.JSXGraph.freeBoard(board); }
      drawings = {};
      // Initialize axes/grid around their origin, then restore the local view.
      // JSXGraph 1.14.3's first grid curve can fail when initialized entirely
      // outside its origin at very large offsets (e.g. x≈1e6 after Fit).
      board = root.JXG.JSXGraph.initBoard('geometry-board', {
        boundingbox: [-8, 6, 8, -6], keepaspectratio: true, axis: state.view.axes, grid: state.view.grid,
        showCopyright: false, showNavigation: false, showInfobox: false,
        pan: { enabled: true, needShift: true, needTwoFingers: true },
        zoom: { enabled: true, wheel: false, pinch: true, needShift: false },
        // A single observer below always targets the current board. The
        // library's deferred per-board observer can outlive freeBoard().
        keyboard: { enabled: false }, resize: { enabled: false }
      });
      board.setBoundingBox(viewBox, true);
      board.suspendUpdate();
      for (const item of state.objects) {
        const id = item.id, result = val(id), common = { name: '', withLabel: false, strokeColor: '#4c7161', highlightStrokeColor: '#c28b2d', strokeWidth: 2, fixed: true, visible: () => !!val(id)?.defined };
        let element;
        if (result.kind === 'point') {
          const free = item.type === 'point';
          element = board.create('point', free ? [item.x, item.y] : [() => val(id).defined ? val(id).x : NaN, () => val(id).defined ? val(id).y : NaN], {
            ...common, name: item.label, withLabel: true, label: { display: 'internal', useMathJax: false, parse: false, fontSize: 14, strokeColor: '#203a32' },
            size: free ? 4.5 : 4, strokeWidth: 2, fillColor: free ? '#23765a' : '#507db6', strokeColor: '#fff', highlightStrokeColor: '#c28b2d', fixed: !free || readOnly || tool !== 'move', snapToGrid: false
          });
          if (free) {
            element.on('down', () => { if (!readOnly && tool === 'move') { dragBefore = clone(state); dragId = id; dragBoundsError = false; selected = id; renderPanels(); } });
            element.on('drag', () => {
              const current = object(id);
              if (!current) return;
              const restore = () => { element.setPosition(root.JXG.COORDS_BY_USER, [current.x, current.y]); board.update(); };
              if (readOnly || tool !== 'move' || !dragBefore || dragId !== id) { restore(); return; }
              const x = element.X(), y = element.Y();
              if (![x, y].every(n => Number.isFinite(n) && Math.abs(n) <= M.MAX_COORD)) {
                restore(); dragBoundsError = true; say('Координаты должны быть в пределах от −1 000 000 до 1 000 000. Точка осталась в последнем допустимом положении.', true); return;
              }
              if (dragBoundsError) { say('Точка снова в допустимом диапазоне.'); dragBoundsError = false; }
              current.x = x; current.y = y; evaluated = M.evaluate(state);
              board.update(); schedulePanels();
              if (performance.now() - lastDragEmit > 120) { lastDragEmit = performance.now(); saveAndEmit(); }
            });
          }
        } else if (result.kind === 'line') {
          const a = axis => () => val(id).defined ? val(id).a[axis] : NaN;
          const b = axis => () => val(id).defined ? val(id).a[axis] + val(id).d[axis] : NaN;
          const isRay = item.type === 'ray' || item.type === 'bisector';
          element = board.create('line', [[a(0), a(1)], [b(0), b(1)]], { ...common, straightFirst: item.type !== 'segment' && !isRay, straightLast: item.type !== 'segment', lastArrow: isRay ? { type: 2, size: 5 } : false, dash: ['parallel', 'perpendicular', 'bisector'].includes(item.type) ? 2 : 0 });
        } else if (result.kind === 'circle') {
          element = board.create('circle', [[() => val(id).defined ? val(id).c[0] : NaN, () => val(id).defined ? val(id).c[1] : NaN], () => val(id).defined ? val(id).r : NaN], { ...common, strokeColor: '#779249', fillOpacity: 0 });
        } else if (result.kind === 'polygon') {
          element = board.create('polygon', item.parents.map(parent => drawings[parent]), { ...common, fillColor: '#a5c8ac', fillOpacity: .16, borders: { strokeColor: '#779775', strokeWidth: 2, highlightStrokeColor: '#c28b2d', fixed: true }, vertices: { visible: false }, hasInnerPoints: false });
        } else if (result.kind === 'measurement') {
          element = board.create('text', [() => val(id).defined ? val(id).position[0] + .15 : NaN, () => val(id).defined ? val(id).position[1] + .4 : NaN, () => val(id).defined ? item.label + ' ≈ ' + format(val(id).value) + val(id).unit : ''], { ...common, fontSize: 13, strokeColor: '#52689c', display: 'internal', parse: false, useMathJax: false, anchorX: 'left', anchorY: 'bottom' });
          if (item.type === 'angle') board.create('nonreflexangle', item.parents.map(parent => drawings[parent]), { ...common, name: '', radius: .7, fillColor: '#a6b9d8', fillOpacity: .2, strokeColor: '#7d95bd', strokeWidth: 1, orthoType: 'square' });
        }
        drawings[id] = element;
      }
      board.unsuspendUpdate();
      board.on('down', onBoardDown);
      board.on('up', finishDrag);
    } finally { rendering = false; }
  }
  function finishDrag() {
    if (!dragBefore) return;
    if (!readOnly && JSON.stringify(dragBefore) !== JSON.stringify(state)) {
      history.push(dragBefore); if (history.length > 60) history.shift(); future = []; saveAndEmit();
    }
    dragBefore = null; dragId = null; renderPanels();
  }
  function hitTest(x, y) {
    const threshold = 14 / Math.min(board.unitX, board.unitY);
    const matches = [];
    for (const item of state.objects) {
      const r = val(item.id); if (!r.defined) continue;
      let distance = Infinity;
      if (r.kind === 'point') distance = Math.hypot(x - r.x, y - r.y);
      else if (r.kind === 'circle') distance = Math.abs(Math.hypot(x - r.c[0], y - r.c[1]) - r.r);
      else if (r.kind === 'line') {
        const q = [x - r.a[0], y - r.a[1]], norm = r.d[0] ** 2 + r.d[1] ** 2;
        const t = Math.max(r.domain[0], Math.min(r.domain[1], (q[0] * r.d[0] + q[1] * r.d[1]) / norm));
        distance = Math.hypot(x - r.a[0] - t * r.d[0], y - r.a[1] - t * r.d[1]);
      }
      if (distance <= threshold && (tool === 'move' || accepts(item))) matches.push({ id: item.id, priority: r.kind === 'point' ? 0 : 1, distance });
    }
    matches.sort((a, b) => a.priority - b.priority || a.distance - b.distance);
    return matches[0]?.id;
  }
  function onBoardDown(event) {
    if (rendering || readOnly || event.shiftKey || (event.touches && event.touches.length > 1)) return;
    const position = board.getUsrCoordsOfMouse(event), x = position[0], y = position[1];
    if (![x, y].every(Number.isFinite)) return;
    // Defer mutations until JSXGraph finishes dispatching the pointer event.
    const hit = hitTest(x, y), epoch = interactionEpoch, activeTool = tool, activeBoard = board;
    if (tool === 'move') { if (hit) { selected = hit; schedulePanels(); } return; }
    root.setTimeout(() => {
      if (readOnly || epoch !== interactionEpoch || activeTool !== tool || activeBoard !== board) return;
      if (tool === 'point') addPoint(x, y);
      else if (hit) choose(hit);
      else if (expectedPoint()) { const id = addPoint(x, y, false); if (id) choose(id); }
      else say(hints[tool], true);
    }, 0);
  }
  function undefinedReason(item, result) {
    // There is no side selector in v1. Do not ask a learner to use a control
    // that does not exist when a straight angle has two possible half-rays.
    if (item.type === 'bisector' && result.reason === 'Для развёрнутого угла выберите сторону биссектрисы.') return 'Для угла 180° этот инструмент не выбирает сторону биссектрисы. Сдвиньте точку на стороне угла.';
    return result.reason;
  }
  function description(item) {
    const r = val(item.id), parents = (item.parents || []).map(label).join(', ');
    if (!r.defined) return 'Не определено · ' + undefinedReason(item, r);
    if (r.kind === 'point') return '(' + format(r.x) + '; ' + format(r.y) + ')' + (item.type === 'point' ? ' · свободная' : ' · ' + parents);
    if (r.kind === 'measurement') return '≈ ' + format(r.value) + r.unit + ' · ' + parents;
    if (r.kind === 'circle') return 'r ≈ ' + format(r.r) + ' · ' + parents;
    return parents;
  }
  function schedulePanels() { if (uiFrame === null) uiFrame = requestAnimationFrame(() => { uiFrame = null; renderPanels(); }); }
  function renderPanels() {
    $('object-count').textContent = state.objects.length + ' / ' + M.MAX_OBJECTS;
    $('empty-list').hidden = state.objects.length !== 0; $('canvas-empty').hidden = state.objects.length !== 0;
    const list = $('object-list'), active = document.activeElement?.dataset?.object;
    list.replaceChildren(...state.objects.map(item => {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'object-row'; row.dataset.object = item.id;
      row.classList.toggle('selected', selected === item.id); row.classList.toggle('pending', pending.includes(item.id)); row.setAttribute('aria-pressed', String(selected === item.id));
      const dot = document.createElement('span'); dot.className = 'object-dot' + (item.type === 'point' ? ' free' : '') + (!val(item.id).defined ? ' undefined' : ''); dot.setAttribute('aria-hidden', 'true');
      const info = document.createElement('span'); info.className = 'object-info'; const title = document.createElement('b'); title.textContent = (item.label || names[item.type]) + ' · ' + names[item.type];
      const sub = document.createElement('small'); sub.textContent = description(item); info.append(title, sub); row.append(dot, info); row.onclick = () => choose(item.id); return row;
    }));
    if (active) list.querySelector('[data-object="' + active + '"]')?.focus({ preventScroll: true });
    const item = object(selected); $('selected-panel').hidden = !item;
    if (item) {
      $('selected-heading').textContent = names[item.type] + ' ' + item.label;
      $('selected-description').textContent = description(item);
      if (document.activeElement !== $('object-label')) $('object-label').value = item.label;
      const free = item.type === 'point'; $('coordinate-editor').hidden = !free;
      $('edit-x').disabled = !free || readOnly; $('edit-y').disabled = !free || readOnly;
      if (free) {
        // These are editable model values, not rounded display measurements.
        // Number -> String -> Number preserves coordinates during label-only edits.
        if (document.activeElement !== $('edit-x')) $('edit-x').value = String(item.x);
        if (document.activeElement !== $('edit-y')) $('edit-y').value = String(item.y);
      }
    }
    $('undo').disabled = readOnly || !history.length; $('redo').disabled = readOnly || !future.length;
    updateTool();
  }
  function render() {
    evaluated = M.evaluate(state); selected = object(selected) ? selected : null; pending = pending.filter(id => !!object(id));
    $('model-title').value = state.title; $('show-axes').checked = state.view.axes; $('show-grid').checked = state.view.grid;
    renderBoard(); renderPanels(); updateSaveStatus();
  }
  function setReadOnly(value) {
    readOnly = value === true; document.documentElement.dataset.spacemathReadonly = String(readOnly);
    if (readOnly) { interactionEpoch++; dragBefore = null; dragId = null; pending = []; if ($('confirm-dialog').open) $('confirm-dialog').close('cancel'); }
    document.querySelectorAll('#tools button,#model-title,#show-axes,#show-grid,#add-point-form input,#add-point-form button,#edit-object-form input,#edit-object-form button,#delete-object,#new-model,#example,#import-json,#finish-polygon,#cancel-selection').forEach(control => { control.disabled = readOnly; });
    for (const item of state.objects) if (item.type === 'point') {
      drawings[item.id]?.setAttribute({ fixed: readOnly || tool !== 'move' });
      if (readOnly) drawings[item.id]?.setPosition(root.JXG.COORDS_BY_USER, [item.x, item.y]);
    }
    if (readOnly) board?.update();
    renderPanels(); updateSaveStatus();
  }
  function applyState(value) {
    const incoming = M.normalize(value); interactionEpoch++;
    if (JSON.stringify(incoming) === JSON.stringify(state)) return;
    applying = true;
    try { if ($('confirm-dialog').open) $('confirm-dialog').close('cancel'); state = incoming; history = []; future = []; pending = []; selected = null; dragBefore = null; dragId = null; render(); }
    finally { applying = false; }
  }
  function ask(title, message, accept, action) {
    if (readOnly) return;
    const dialog = $('confirm-dialog'), epoch = interactionEpoch; $('confirm-title').textContent = title; $('confirm-description').textContent = message; $('confirm-accept').textContent = accept;
    dialog.returnValue = 'cancel'; dialog.onclose = () => { dialog.onclose = null; if (dialog.returnValue === 'confirm' && !readOnly && epoch === interactionEpoch) action(); }; dialog.showModal();
  }
  function travel(redo) {
    if (readOnly) return; finishDrag();
    const source = redo ? future : history, destination = redo ? history : future;
    if (!source.length) return;
    interactionEpoch++; destination.push(clone(state)); state = source.pop(); pending = []; render(); saveAndEmit(); say(redo ? 'Действие повторено.' : 'Действие отменено.');
  }
  function fit() {
    const points = Object.values(evaluated).filter(item => item.kind === 'point' && item.defined);
    if (!points.length) viewBox = [-8, 6, 8, -6];
    else {
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      for (const item of Object.values(evaluated)) if (item.kind === 'circle' && item.defined) { xs.push(item.c[0] - item.r, item.c[0] + item.r); ys.push(item.c[1] - item.r, item.c[1] + item.r); }
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), pad = Math.max(1.5, (maxX - minX) * .15, (maxY - minY) * .15);
      viewBox = [minX - pad, maxY + pad, maxX + pad, minY - pad];
    }
    board?.setBoundingBox(viewBox, true); board?.fullUpdate();
  }
  function example() {
    const sample = M.empty(); sample.title = 'Медиана и высота треугольника';
    sample.objects = [
      { id: 'a', type: 'point', label: 'A', x: -4, y: -2 }, { id: 'b', type: 'point', label: 'B', x: 4, y: -2 }, { id: 'c', type: 'point', label: 'C', x: 1, y: 4 },
      { id: 'triangle', type: 'polygon', label: 'ABC', parents: ['a', 'b', 'c'] }, { id: 'base', type: 'line', label: 'AB', parents: ['a', 'b'] },
      { id: 'm', type: 'midpoint', label: 'M', parents: ['a', 'b'] }, { id: 'median', type: 'segment', label: 'Медиана CM', parents: ['c', 'm'] },
      { id: 'altitude', type: 'perpendicular', label: 'Прямая через C ⟂ AB', parents: ['base', 'c'] }, { id: 'h', type: 'intersection', label: 'H', parents: ['base', 'altitude'], branch: 0 },
      { id: 'altitude-segment', type: 'segment', label: 'Высота CH', parents: ['c', 'h'] },
      { id: 'height', type: 'distance', label: 'CH', parents: ['c', 'h'] }, { id: 'reading', type: 'angle', label: '∠CHB', parents: ['c', 'h', 'b'] }
    ];
    const install = () => { pending = []; selected = null; commit(s => Object.assign(s, sample), 'Перемещайте A, B или C. M остаётся серединой, CH — высотой.'); fit(); };
    if (state.objects.length) ask('Открыть пример?', 'Текущее построение заменится примером. Действие можно отменить.', 'Открыть пример', install); else install();
  }
  function localForm(form, action) {
    // Managed frames intentionally lack allow-forms. These are local editing
    // controls, so invoke them before any browser form-submission algorithm.
    const submit = event => {
      event.preventDefault();
      if (!readOnly && form.reportValidity()) action();
    };
    form.onsubmit = submit;
    form.querySelectorAll('button[type="submit"]').forEach(button => { button.onclick = submit; });
    form.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing && event.target.tagName === 'INPUT') submit(event);
    });
  }
  document.querySelectorAll('[data-tool]').forEach(button => { button.onclick = () => setTool(button.dataset.tool); });
  $('cancel-selection').onclick = () => { pending = []; updateTool(); renderPanels(); };
  $('finish-polygon').onclick = () => { finishConstruction(); renderPanels(); };
  $('undo').onclick = () => travel(false); $('redo').onclick = () => travel(true); $('fit-view').onclick = fit;
  $('model-title').onchange = () => { if (!commit(s => { s.title = $('model-title').value; })) $('model-title').value = state.title; };
  $('show-axes').onchange = () => commit(s => { s.view.axes = $('show-axes').checked; });
  $('show-grid').onchange = () => commit(s => { s.view.grid = $('show-grid').checked; });
  localForm($('add-point-form'), () => { const id = addPoint(Number($('point-x').value), Number($('point-y').value), false); if (id) { if (expectedPoint()) choose(id); else { selected = id; renderPanels(); } } });
  localForm($('edit-object-form'), () => {
    if (!object(selected)) return;
    const id = selected, newLabel = $('object-label').value, x = Number($('edit-x').value), y = Number($('edit-y').value);
    commit(s => { const item = s.objects.find(o => o.id === id); item.label = newLabel; if (item.type === 'point') { item.x = x; item.y = y; } }, 'Объект обновлён.');
  });
  $('confirm-dialog').querySelectorAll('button[value]').forEach(button => {
    button.onclick = event => { event.preventDefault(); $('confirm-dialog').close(button.value); };
  });
  $('delete-object').onclick = () => {
    if (readOnly || !object(selected)) return;
    const ids = M.descendants(state, selected), target = label(selected), dependent = ids.slice(1).map(label);
    ask('Удалить ' + target + '?', dependent.length ? 'Вместе с ним удалятся зависимые объекты: ' + dependent.join(', ') + '. Действие можно отменить.' : 'Удалится один объект. Действие можно отменить.', 'Удалить', () => { pending = []; commit(s => { s.objects = s.objects.filter(item => !ids.includes(item.id)); }, 'Объекты удалены.'); });
  };
  $('new-model').onclick = () => ask('Начать новое построение?', 'Текущую модель можно предварительно скачать. Очистку можно отменить.', 'Начать заново', () => { pending = []; commit(s => Object.assign(s, M.empty()), 'Открыто чистое поле.'); fit(); });
  $('example').onclick = example;
  $('export-json').onclick = () => {
    const blob = new Blob([JSON.stringify(M.normalize(state))], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'spacemath-construction.json'; document.body.append(link); link.click(); link.remove(); root.setTimeout(() => URL.revokeObjectURL(url), 1000); say('Построение скачано в формате JSON.');
  };
  $('import-json').onclick = () => { if (!readOnly) $('import-file').click(); };
  $('import-file').onchange = async () => {
    const file = $('import-file').files[0]; $('import-file').value = ''; if (!file || readOnly) return;
    const epoch = ++interactionEpoch;
    try {
      if (file.size > M.MAX_BYTES) throw new Error('Файл превышает 64 КБ.');
      const raw = await file.text();
      if (readOnly || epoch !== interactionEpoch) return;
      const imported = M.normalize(JSON.parse(raw));
      ask('Открыть построение?', 'Файл «' + file.name.slice(0, 100) + '» заменит текущую модель. Действие можно отменить.', 'Открыть', () => { pending = []; commit(s => Object.assign(s, imported), 'Построение открыто.'); fit(); });
    } catch (error) { say('Не удалось открыть файл: ' + error.message, true); }
  };
  document.addEventListener('keydown', event => {
    if (readOnly || $('confirm-dialog').open || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); travel(event.shiftKey); }
    else if (event.key === 'Escape') { setTool('move'); say('Выбор инструмента отменён.'); }
    else if (event.key === 'Delete' && selected) { event.preventDefault(); $('delete-object').click(); }
    else if (tool === 'move' && object(selected)?.type === 'point' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && (event.target.id === 'geometry-board' || event.target.dataset.object)) {
      event.preventDefault(); const step = event.shiftKey ? 1 : .1, dx = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0, dy = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
      commit(s => { const item = s.objects.find(o => o.id === selected); if (dx) item.x += dx; if (dy) item.y += dy; });
    }
  });
  root.addEventListener('pointerup', finishDrag);
  if (standalone) {
    try { const saved = root.localStorage.getItem(STORAGE_KEY); if (saved) state = M.normalize(JSON.parse(saved)); }
    catch (_) { localSaveWorks = false; say('Сохранённый черновик не удалось открыть. Можно загрузить файл построения.', true); }
  }
  $('export-json').hidden = managed;
  $('persistence-note').textContent = standalone ? 'Черновик сохраняется в этом браузере. Скачайте модель, чтобы перенести её на другое устройство.' : managed ? 'Модель сохраняется в работе кабинета. Статус сохранения показан над встроенным полем. Скачать построение можно в меню кабинета.' : 'Изменения передаются на общую доску. Скачайте модель для отдельной копии.';
  render(); setReadOnly(readOnly);
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[entries.length - 1].contentRect;
      if (rendering || !board?.renderer || width <= 0 || height <= 0) return;
      if (Math.abs(board.canvasWidth - width) > .5 || Math.abs(board.canvasHeight - height) > .5) board.resizeContainer(width, height, true, false);
    });
    observer.observe($('geometry-board'));
    root.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  root.SpaceMathApp = Object.freeze({ getState: () => M.normalize(state), applyState, setReadOnly, subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); }, getReadOnly: () => readOnly });
})(window);
