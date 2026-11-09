/* SpaceMath editor: semantic state is the source of every dependent object. */
(function (root) {
  'use strict';
  const M = root.SpaceMathModel, Expression = root.SpaceMathExpression, C = root.SpaceMathConstructions, $ = id => document.getElementById(id);
  const managed = root.MathExamLearning?.managed === true, standalone = root.parent === root && !managed;
  const STORAGE_KEY = 'mathexam.spacemath.draft.v1';
  const pointTypes = new Set(M.pointTypes), lineTypes = new Set(M.lineTypes), circleTypes = new Set(M.circleTypes), vectorTypes = new Set(M.vectorTypes || ['vector']);
  const inputKinds = {
    segment: ['point', 'point'], line: ['point', 'point'], ray: ['point', 'point'], circle: ['point', 'point'],
    midpoint: ['point', 'point'], perpendicularBisector: ['point', 'point'], distance: ['point', 'point'], reflectPoint: ['shape', 'point'], rotate: ['shape', 'point'], dilate: ['shape', 'point'],
    parallel: ['line', 'point'], perpendicular: ['line', 'point'], projection: ['line', 'point'], reflectLine: ['line', 'shape'],
    angle: ['point', 'point', 'point'], bisector: ['point', 'point', 'point'], circle3: ['point', 'point', 'point'],
    intersection: ['curve', 'curve'], area: ['surface'], perimeter: ['polygon'], circumference: ['circle'],
    pointOn: ['path'], vector: ['point', 'point'], translate: ['shape', 'vector'],
    circleRadius: ['point'], circleCenter: ['circle'], tangent: ['circle', 'point'], functionRoot: ['graph'], functionIntersection: ['graph', 'graph'],
    fixedLength: ['point', 'point'], fixedAngle: ['point', 'point'], regularPolygon: ['point', 'point']
  };
  const names = {
    point: 'Точка', pointOn: 'Точка на объекте', segment: 'Отрезок', line: 'Прямая', ray: 'Луч',
    circle: 'Окружность', circle3: 'Окружность через 3 точки', circleRadius: 'Окружность по радиусу', tangent: 'Касательная',
    polygon: 'Многоугольник', midpoint: 'Середина', intersection: 'Пересечение', projection: 'Проекция',
    parallel: 'Параллельная', perpendicular: 'Перпендикуляр', perpendicularBisector: 'Серединный перпендикуляр', bisector: 'Биссектриса',
    reflectPoint: 'Симметрия относительно точки', reflectLine: 'Симметрия относительно прямой', rotate: 'Поворот', dilate: 'Гомотетия',
    vector: 'Вектор', translate: 'Перенос по вектору', distance: 'Расстояние', angle: 'Угол', area: 'Площадь',
    perimeter: 'Периметр', circumference: 'Длина окружности', slider: 'Параметр',
    functionGraph: 'График функции', functionTable: 'Таблица значений', functionRoot: 'Корень функции', functionIntersection: 'Пересечение графиков',
    fixedLength: 'Отрезок заданной длины', fixedAngle: 'Угол заданной величины', regularPolygon: 'Правильный многоугольник',
    fixedDistance: 'Точка на заданном расстоянии', regularVertex: 'Вершина правильного многоугольника',
    transformation: 'Преобразование фигуры', transformedPoint: 'Образ точки', circleCenter: 'Центр окружности',
    transformedCircle: 'Образ окружности', transformedLine: 'Образ линии', transformedVector: 'Образ вектора'
  };
  const toolParameters = {
    rotate: { key: 'angle', label: 'Угол, °', min: -36000, max: 36000, initial: 90 },
    dilate: { key: 'factor', label: 'Коэффициент', min: -1000, max: 1000, initial: 2 },
    circleRadius: { key: 'radius', label: 'Радиус', min: 0, max: M.MAX_COORD, initial: 2 },
    fixedLength: { key: 'length', label: 'Длина', min: 0, max: M.MAX_COORD, initial: 3 },
    fixedDistance: { key: 'length', label: 'Длина', min: 0, max: M.MAX_COORD, initial: 3 },
    fixedAngle: { key: 'angle', label: 'Угол, °', min: -180, max: 180, initial: 60 },
    regularPolygon: { key: 'sides', label: 'Число вершин', min: 3, max: 30, initial: 4, step: 1 }
  };
  const hints = {
    move: 'Перетаскивайте свободные точки и точки на объектах. Остальные построения обновятся.',
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
    angle: 'Выберите три точки. Вторая точка — вершина измеряемого угла.',
    perpendicularBisector: 'Выберите два конца отрезка. Построим прямую через середину под прямым углом.',
    projection: 'Выберите прямую, отрезок или луч, затем точку. Проекция строится на содержащую их прямую.',
    reflectPoint: 'Выберите точку или фигуру, затем центр симметрии.',
    reflectLine: 'Выберите ось — прямую, отрезок или луч, затем отражаемую точку или фигуру.',
    rotate: 'Задайте угол. Выберите точку или фигуру, затем центр поворота. Положительный угол — против часовой стрелки.',
    dilate: 'Задайте коэффициент. Выберите точку или фигуру, затем центр гомотетии.',
    circle3: 'Выберите три точки окружности. Они не должны лежать на одной прямой.',
    area: 'Выберите многоугольник или окружность. Измерим площадь фигуры.',
    perimeter: 'Выберите многоугольник для измерения периметра.',
    circumference: 'Выберите окружность для измерения её длины.',
    pointOn: 'Коснитесь линии, окружности или графика. Точку можно будет двигать вдоль выбранного объекта.',
    vector: 'Выберите начало вектора, затем его конец.',
    translate: 'Выберите исходную точку или фигуру, затем вектор переноса.',
    circleRadius: 'Введите радиус и выберите центр окружности.',
    circleCenter: 'Выберите окружность — построим её зависимый центр.',
    tangent: 'Выберите окружность, затем точку, через которую пройдут касательные.',
    functionRoot: 'Выберите график прямой или параболы на поле или в списке. Найдём точки на оси x. Например: a*x^2+b*x+c.',
    functionIntersection: 'Выберите два графика прямых или парабол на поле или в списке. Точки пересчитаются при изменении формул и параметров.',
    fixedLength: 'Задайте длину. Выберите начало A, затем точку B, задающую направление отрезка. Двигайте B, чтобы повернуть отрезок.',
    fixedAngle: 'Задайте угол от −180° до 180°. Выберите точку первой стороны, затем вершину. Положительный угол — против часовой стрелки.',
    regularPolygon: 'Задайте число вершин от 3 до 30. Выберите A и B — сторону многоугольника. Остальные вершины будут слева от направления A → B.'
  };
  let state = M.empty(), evaluated, board, drawings = {}, tool = 'move', pending = [], selected = null;
  let readOnly = managed, applying = false, rendering = false, dragBefore = null, dragId = null, lastDragEmit = 0, dragBoundsError = false;
  let history = [], future = [], settingViewport = false, viewTimer = null, localSaveWorks = true, uiFrame = null, interactionEpoch = 0;
  const listeners = new Set(), limitedGraphs = new Set();
  let sliderBefore = null, sliderId = null, lastSliderEmit = 0, inspectorRevision = null, accessInitialized = false;
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
  function nextId(model = state) { let serial = 1; while (model.objects.some(o => o.id === 'o' + serial)) serial++; return 'o' + serial; }
  function pointLabel(model = state) {
    const used = new Set(model.objects.filter(o => pointTypes.has(o.type)).map(o => o.label));
    let i = 0, label;
    do { label = String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) : ''); i++; } while (used.has(label));
    return label;
  }
  function object(id) { return state.objects.find(o => o.id === id); }
  function label(id) { const item = object(id); return item?.label || names[item?.type] || id; }
  function parameterSettings(item) {
    return item.type === 'pointOn' ? pathParameter(object(item.parents[0]))
      : item.type === 'transformation' ? toolParameters[item.mode] : toolParameters[item.type];
  }
  function appearanceDefaults(item) {
    const point = pointTypes.has(item.type), measure = ['distance', 'angle', 'area', 'perimeter', 'circumference'].includes(item.type);
    return { visible: true, labelVisible: point || measure,
      color: point ? (item.type === 'point' ? '#23765a' : '#507db6')
        : item.type === 'polygon' ? '#779775' : circleTypes.has(item.type) ? '#779249'
        : ['vector', 'functionGraph'].includes(item.type) ? '#7453b8' : measure ? '#52689c' : '#4c7161',
      width: 2, dash: ['parallel', 'perpendicular', 'bisector', 'perpendicularBisector'].includes(item.type) ? 2 : 0,
      fillOpacity: item.type === 'polygon' ? .16 : item.type === 'angle' ? .2 : 0 };
  }
  function appearance(item) { return { ...appearanceDefaults(item), ...item.appearance }; }
  const appearanceFields = { visible: 'appearance-visible', labelVisible: 'appearance-label', color: 'appearance-color',
    width: 'appearance-width', dash: 'appearance-dash', fillOpacity: 'appearance-fill' };
  function saveAppearance(item) {
    const defaults = appearanceDefaults(item), next = { ...item.appearance };
    for (const [key, id] of Object.entries(appearanceFields)) {
      const input = $(id);
      if (!input || input.disabled) continue;
      const value = ['visible', 'labelVisible'].includes(key) ? input.checked : key === 'color' ? input.value : Number(input.value);
      if (value === defaults[key]) delete next[key]; else next[key] = value;
    }
    if (Object.keys(next).length) item.appearance = next; else delete item.appearance;
  }
  function movablePoint(item) { return item?.type === 'point' || item?.type === 'pointOn'; }
  function pathParameter(parent) {
    let source = parent;
    while (source?.type === 'transformedLine') source = object(source.parents[0]);
    const sourceType = source?.type;
    if (circleTypes.has(parent.type)) return { key: 'parameter', label: 'Доля оборота', min: 0, max: 1, initial: 0, step: 1 / 36, largeStep: 1 / 12 };
    if (sourceType === 'segment') return { key: 'parameter', label: 'Доля отрезка', min: 0, max: 1, initial: .5, step: .01, largeStep: .1 };
    if (parent.type === 'functionGraph') return { key: 'parameter', label: 'Координата x', min: -M.MAX_COORD, max: M.MAX_COORD, initial: Math.max(-M.MAX_COORD, Math.min(M.MAX_COORD, state.view.viewport.x)), step: .1, largeStep: 1 };
    const min = sourceType === 'ray' || sourceType === 'bisector' ? 0 : -M.MAX_COORD;
    return { key: 'parameter', label: 'Параметр t', min, max: M.MAX_COORD, initial: 0, step: .1, largeStep: 1 };
  }
  function setParameterInput(input, caption, settings, value) {
    input.min = String(settings.min);
    input.max = String(settings.max);
    input.step = String(settings.step ?? 'any');
    caption.textContent = settings.label;
    if (value !== undefined) input.value = String(value);
  }
  function addPoint(x, y, choose = true) {
    const id = nextId(), point = { id, type: 'point', label: pointLabel(), x, y };
    if (commit(s => s.objects.push(point), 'Добавлена точка ' + point.label + '.')) {
      if (choose) { selected = id; renderPanels(); }
      return id;
    }
    return null;
  }
  function expectedKind() { return tool === 'polygon' ? 'point' : inputKinds[tool]?.[pending.length]; }
  function expectedPoint() { return expectedKind() === 'point'; }
  function accepts(item) {
    if (!item || (tool !== 'vector' && pending.includes(item.id))) return false;
    const kind = expectedKind();
    if (kind === 'point') return pointTypes.has(item.type);
    if (kind === 'shape') return pointTypes.has(item.type) || lineTypes.has(item.type) || circleTypes.has(item.type) || vectorTypes.has(item.type) || item.type === 'polygon';
    if (kind === 'line') return lineTypes.has(item.type);
    if (kind === 'circle') return circleTypes.has(item.type);
    if (kind === 'curve') return lineTypes.has(item.type) || circleTypes.has(item.type);
    if (kind === 'path') return lineTypes.has(item.type) || circleTypes.has(item.type) || item.type === 'functionGraph';
    if (kind === 'vector') return vectorTypes.has(item.type);
    if (kind === 'graph') return item.type === 'functionGraph';
    if (kind === 'surface') return item.type === 'polygon' || circleTypes.has(item.type);
    return kind === 'polygon' && item.type === 'polygon';
  }
  function choose(id, position) {
    selected = id;
    if (!readOnly && tool !== 'move' && tool !== 'point') {
      if (!accepts(object(id))) { say('Этот объект сейчас не подходит. ' + hints[tool], true); renderPanels(); return; }
      pending.push(id);
      const needed = inputKinds[tool]?.length;
      if (tool !== 'polygon' && pending.length === needed) finishConstruction(position);
      else updateTool();
    }
    renderPanels();
  }
  function finishConstruction(position) {
    if (readOnly || !pending.length || tool === 'polygon' && pending.length < 3) return;
    const type = tool, parents = [...pending], id = nextId();
    const shapeIndex = type === 'reflectLine' ? 1 : 0;
    const wholeFigure = ['rotate', 'dilate', 'reflectPoint', 'reflectLine', 'translate'].includes(type)
      && !pointTypes.has(object(parents[shapeIndex])?.type);
    if (wholeFigure || ['fixedLength', 'fixedAngle', 'regularPolygon'].includes(type)) {
      const parameter = toolParameters[type], input = $('tool-parameter');
      if (parameter && !input.reportValidity()) { pending = []; updateTool(); return; }
      try {
        const options = parameter ? { [parameter.key]: Number(input.value) } : {};
        const batch = wholeFigure
          ? C.build(state, 'transformFigure', [parents[shapeIndex], parents[1 - shapeIndex]], { mode: type, ...options })
          : C.build(state, type, parents, options);
        pending = [];
        if (commit(s => { s.objects = batch.objects; })) {
          selected = batch.parameterId || batch.selectedId;
          const result = val(batch.selectedId);
          say(result.defined ? names[type] + ': построение готово.' : names[type] + ': ' + result.reason, !result.defined);
          renderPanels();
        }
      } catch (error) { pending = []; say(error.message || 'Не удалось построить фигуру.', true); }
      updateTool(); return;
    }
    const newObject = { id, type, label: pointTypes.has(type) ? pointLabel() : names[type].slice(0, 26) + ' ' + (state.objects.filter(o => o.type === type).length + 1), parents };
    if (['intersection', 'tangent', 'functionRoot', 'functionIntersection'].includes(type)) newObject.branch = 0;
    const parameter = toolParameters[type];
    if (parameter) {
      const input = $('tool-parameter');
      if (!input.reportValidity()) { pending = []; updateTool(); return; }
      newObject[parameter.key] = Number(input.value);
    }
    if (type === 'pointOn') {
      const projected = position ? M.projectParameter(val(parents[0]), ...position) : null;
      newObject.parameter = projected ?? pathParameter(object(parents[0])).initial;
    }
    const candidate = clone(state); candidate.objects.push(newObject);
    try {
      // Both branches remain in the model, including a currently missing one.
      // This lets a second intersection or tangent recover when the model moves.
      if (['tangent', 'functionRoot', 'functionIntersection'].includes(type) || type === 'intersection' && parents.some(parent => circleTypes.has(object(parent).type))) {
        let suffix = 1; while (candidate.objects.some(o => o.id === 'o' + suffix)) suffix++;
        let secondLabel = newObject.label + '₂'; if (secondLabel.length > 30) secondLabel = names[type] + ' 2';
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
    } catch (error) { pending = []; updateTool(); say(error.message, true); }
  }
  function setTool(value) {
    if (readOnly) return;
    finishSlider(); interactionEpoch++; tool = value; pending = [];
    document.querySelectorAll('.tool-group').forEach(group => { group.open = false; });
    const parameter = toolParameters[value];
    if (parameter) setParameterInput($('tool-parameter'), $('tool-parameter-label'), parameter, parameter.initial);
    updateTool();
    for (const item of state.objects) if (movablePoint(item)) drawings[item.id]?.setAttribute({ fixed: tool !== 'move' });
    renderPanels();
  }
  function updateTool() {
    document.querySelectorAll('[data-tool]').forEach(button => { const active = button.dataset.tool === tool; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    $('tool-hint').textContent = readOnly ? 'Построение открыто для просмотра.' : hints[tool];
    $('pending-selection').textContent = pending.length ? 'Выбрано: ' + pending.map(label).join(' → ') : '';
    $('finish-polygon').hidden = tool !== 'polygon' || pending.length < 3;
    $('cancel-selection').hidden = !pending.length;
    $('transformation-parameter').hidden = !toolParameters[tool];
  }
  const val = id => evaluated[id];
  function placePoint(element, result) {
    if (result.defined) element?.setPosition(root.JXG.COORDS_BY_USER, [result.x, result.y]);
  }
  function updateDrawings() {
    for (const item of state.objects) {
      if (item.type === 'pointOn') placePoint(drawings[item.id], val(item.id));
    }
    board?.update();
  }
  function pointChange(item, x, y) {
    if (item.type === 'pointOn') {
      const parameter = M.projectParameter(val(item.parents[0]), x, y);
      return parameter === null ? null : { parameter };
    }
    return [x, y].every(n => Number.isFinite(n) && Math.abs(n) <= M.MAX_COORD) ? { x, y } : null;
  }
  function bindPointDrag(element, id) {
    element.on('down', () => {
      if (readOnly || tool !== 'move') return;
      dragBefore = clone(state);
      dragId = id;
      dragBoundsError = false;
      selected = id;
      renderPanels();
    });
    element.on('drag', () => {
      const current = object(id);
      if (!current) return;
      const restore = () => { placePoint(element, val(id)); board.update(); };
      if (readOnly || tool !== 'move' || !dragBefore || dragId !== id) { restore(); return; }
      const change = pointChange(current, element.X(), element.Y());
      const candidate = clone(state);
      if (change) Object.assign(candidate.objects.find(item => item.id === id), change);
      let next;
      try { next = change && M.evaluate(candidate); }
      catch (error) { restore(); say(error.message, true); return; }
      if (!next || !next[id].defined) {
        restore();
        dragBoundsError = true;
        const message = current.type === 'pointOn'
          ? 'На этом участке точка не определена. Сохранили последнее положение.'
          : 'Координаты должны быть в пределах от −1 000 000 до 1 000 000. Точка осталась в последнем допустимом положении.';
        say(message, true);
        return;
      }
      if (dragBoundsError) { say('Точка снова в допустимом положении.'); dragBoundsError = false; }
      state = candidate;
      evaluated = next;
      updateDrawings();
      schedulePanels();
      if (performance.now() - lastDragEmit > 120) { lastDragEmit = performance.now(); saveAndEmit(); }
    });
  }
  function renderBoard() {
    if (!root.JXG) { say('Не загрузился геометрический модуль. Обновите страницу.', true); return; }
    rendering = true;
    try {
      if (board) root.JXG.JSXGraph.freeBoard(board);
      drawings = {}; limitedGraphs.clear(); $('graph-warning').hidden = true;
      // Initialize axes/grid around their origin, then restore the shared view.
      // JSXGraph 1.14.3's first grid curve can fail when initialized entirely
      // outside its origin at very large offsets (e.g. x≈1e6 after Fit).
      board = root.JXG.JSXGraph.initBoard('geometry-board', {
        boundingbox: [-8, 6, 8, -6], keepaspectratio: true, axis: state.view.axes, grid: state.view.grid,
        showCopyright: false, showNavigation: false, showInfobox: false,
        pan: { enabled: !readOnly, needShift: true, needTwoFingers: true },
        zoom: { enabled: !readOnly, wheel: false, pinch: true, needShift: false },
        // A single observer below always targets the current board. The
        // library's deferred per-board observer can outlive freeBoard().
        keyboard: { enabled: false }, resize: { enabled: false }
      });
      restoreViewport();
      board.suspendUpdate();
      for (const item of state.objects) {
        const id = item.id, result = val(id), look = appearance(item), shown = () => !!val(id)?.defined && look.visible;
        const common = { name: item.label, withLabel: look.labelVisible,
          label: { display: 'internal', useMathJax: false, parse: false, fontSize: 14, strokeColor: '#203a32' },
          strokeColor: look.color, highlightStrokeColor: '#c28b2d', strokeWidth: look.width, dash: look.dash, fixed: true, visible: shown };
        let element;
        if (result.kind === 'point') {
          const free = item.type === 'point', movable = movablePoint(item);
          const coordinates = movable
            ? [result.x ?? 0, result.y ?? 0]
            : [() => val(id).defined ? val(id).x : NaN, () => val(id).defined ? val(id).y : NaN];
          element = board.create('point', coordinates, {
            ...common, size: movable ? 4.5 : 4, fillColor: look.color, strokeColor: '#fff', highlightStrokeColor: '#c28b2d', fixed: !movable || readOnly || tool !== 'move', snapToGrid: false
          });
          if (movable) bindPointDrag(element, id);
        } else if (result.kind === 'line' || result.kind === 'vector') {
          const vector = result.kind === 'vector', bounded = result.domain?.[0] === 0 && result.domain?.[1] === 1 || vector;
          const isRay = !bounded && result.domain?.[0] === 0;
          const a = axis => () => val(id).defined ? val(id).a[axis] : NaN;
          const b = axis => () => {
            const current = val(id); if (!current.defined) return NaN;
            // Infinite lines/rays need a representable second display point.
            // Normalizing the direction changes no mathematical line or domain.
            const scale = bounded ? 1 : Math.max(Math.abs(current.d[0]), Math.abs(current.d[1]));
            return current.a[axis] + current.d[axis] / scale;
          };
          element = board.create('line', [[a(0), a(1)], [b(0), b(1)]], {
            ...common, straightFirst: !bounded && !isRay, straightLast: !bounded,
            lastArrow: isRay || vector ? { type: 2, size: 5 } : false
          });
        } else if (result.kind === 'circle') {
          element = board.create('circle', [[() => val(id).defined ? val(id).c[0] : NaN, () => val(id).defined ? val(id).c[1] : NaN], () => val(id).defined ? val(id).r : NaN], { ...common, fillColor: look.color, fillOpacity: look.fillOpacity });
        } else if (result.kind === 'polygon') {
          element = board.create('polygon', item.parents.map(parent => drawings[parent]), { ...common, fillColor: look.color, fillOpacity: look.fillOpacity,
            borders: { strokeColor: look.color, strokeWidth: look.width, dash: look.dash, highlightStrokeColor: '#c28b2d', fixed: true, visible: shown }, vertices: { visible: false }, hasInnerPoints: false });
        } else if (result.kind === 'functionGraph') {
          const program = Expression.parse(item.expression);
          element = board.create('curve', [[], []], { ...common, doAdvancedPlot: false });
          element.updateDataArray = function () {
            const box = board.getBoundingBox(), current = val(id);
            const samples = Expression.sample(program, current.parameters, { left: box[0], right: box[2], bottom: box[3], top: box[1], points: 256 });
            this.dataX = samples.x; this.dataY = samples.y;
            if (samples.limited) limitedGraphs.add(id); else limitedGraphs.delete(id);
            $('graph-warning').hidden = limitedGraphs.size === 0;
          };
        } else if (result.kind === 'measurement') {
          element = board.create('text', [() => val(id).defined ? val(id).position[0] + .15 : NaN, () => val(id).defined ? val(id).position[1] + .4 : NaN, () => val(id).defined ? item.label + ' ≈ ' + format(val(id).value) + val(id).unit : ''], { ...common, name: '', withLabel: false, visible: () => shown() && look.labelVisible, fontSize: 13, display: 'internal', parse: false, useMathJax: false, anchorX: 'left', anchorY: 'bottom' });
          if (item.type === 'angle') board.create('nonreflexangle', item.parents.map(parent => drawings[parent]), { ...common, name: '', withLabel: false, radius: .7, fillColor: look.color, fillOpacity: look.fillOpacity, orthoType: 'square' });
        }
        drawings[id] = element;
      }
      board.unsuspendUpdate();
      board.on('down', onBoardDown);
      board.on('up', () => { finishDrag(); finishSlider(); flushViewport(); });
      board.on('boundingbox', captureViewport);
    } finally { rendering = false; }
  }
  function restoreViewport() {
    if (!board) return;
    settingViewport = true;
    try {
      const { x, y, span } = state.view.viewport;
      const ratio = board.canvasWidth / board.canvasHeight;
      const width = span * Math.max(1, ratio), height = span * Math.max(1, 1 / ratio);
      board.setBoundingBox([x - width / 2, y + height / 2, x + width / 2, y - height / 2], true);
    } finally { settingViewport = false; }
  }
  function flushViewport() {
    if (viewTimer === null) return;
    root.clearTimeout(viewTimer); viewTimer = null;
    if (!readOnly && !applying && !rendering) saveAndEmit();
  }
  function captureViewport() {
    if (settingViewport || rendering || applying || readOnly || !board) return;
    const box = board.getBoundingBox();
    const viewport = { x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2, span: Math.min(box[2] - box[0], box[1] - box[3]) };
    const old = state.view.viewport;
    if (['x', 'y', 'span'].every(key => Math.abs(viewport[key] - old[key]) <= Number.EPSILON * Math.max(1, Math.abs(old[key])) * 64)) return;
    try { const candidate = clone(state); candidate.view.viewport = viewport; state = M.normalize(candidate); }
    catch (_) { restoreViewport(); return; }
    if (viewTimer === null) viewTimer = root.setTimeout(flushViewport, 100);
  }
  function zoomView(factor) {
    if (readOnly) return;
    commit(s => { s.view.viewport.span = Math.max(1e-9, Math.min(8 * M.MAX_COORD, s.view.viewport.span * factor)); });
  }
  function updateSlider(id, value) {
    if (readOnly || applying || !object(id)) return;
    if (sliderId && sliderId !== id) finishSlider();
    if (!sliderBefore) { sliderBefore = clone(state); sliderId = id; }
    try {
      const candidate = clone(state); candidate.objects.find(item => item.id === id).value = value;
      state = M.normalize(candidate); evaluated = M.evaluate(state); updateDrawings(); renderFunctionTable(object(selected));
      for (const item of state.objects.filter(o => ['functionRoot', 'functionIntersection'].includes(o.type))) {
        const row = $('object-list').querySelector('[data-object="' + item.id + '"]');
        if (row) { row.querySelector('small').textContent = description(item); row.querySelector('.object-dot').classList.toggle('undefined', !val(item.id).defined); }
        if (selected === item.id) $('selected-description').textContent = description(item);
      }
      if (performance.now() - lastSliderEmit > 120) { lastSliderEmit = performance.now(); saveAndEmit(); }
    } catch (error) { say(error.message, true); }
  }
  function finishSlider() {
    if (!sliderBefore) return;
    if (!readOnly && JSON.stringify(sliderBefore) !== JSON.stringify(state)) {
      history.push(sliderBefore); if (history.length > 60) history.shift(); future = []; saveAndEmit();
    }
    sliderBefore = null; sliderId = null; renderPanels();
  }
  function graphParents(source, candidate, createMissing) {
    const program = Expression.parse(source), parents = [];
    for (const name of program.variables.filter(variable => variable !== 'x')) {
      let parameter = candidate.objects.find(item => item.type === 'slider' && item.name === name);
      if (!parameter && createMissing) {
        parameter = { id: nextId(candidate), type: 'slider', label: name, parents: [], name, min: -5, max: 5, step: .1, value: 1 };
        candidate.objects.push(parameter);
      }
      if (!parameter) throw new Error('Сначала добавьте параметр ' + name + '.');
      parents.push(parameter.id);
    }
    return { expression: program.source, parents };
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
      const r = val(item.id);
      if (!r.defined || item.appearance?.visible === false || (tool !== 'move' && !accepts(item))) continue;
      let distance = Infinity;
      if (r.kind === 'point') distance = Math.hypot(x - r.x, y - r.y);
      else if (r.kind === 'circle') distance = Math.abs(Math.hypot(x - r.c[0], y - r.c[1]) - r.r);
      else if (r.kind === 'polygon' && (['move', 'area', 'perimeter'].includes(tool) || expectedKind() === 'shape')) {
        const vertices = r.vertices; let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
          const a = vertices[i], b = vertices[j];
          if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
        }
        distance = inside ? 0 : Infinity;
      } else if (r.kind === 'line' || r.kind === 'vector') {
        const q = [x - r.a[0], y - r.a[1]], size = Math.hypot(...r.d);
        if (size === 0) distance = Math.hypot(...q);
        else {
          const direction = [r.d[0] / size, r.d[1] / size], domain = r.kind === 'vector' ? [0, 1] : r.domain;
          const along = Math.max(domain[0] * size, Math.min(domain[1] * size, q[0] * direction[0] + q[1] * direction[1]));
          distance = Math.hypot(q[0] - along * direction[0], q[1] - along * direction[1]);
        }
      } else if (r.kind === 'functionGraph') {
        const ordinate = Expression.evaluate(r.expression, x, r.parameters);
        if (Number.isFinite(ordinate)) distance = Math.abs(y - ordinate);
      }
      if (distance <= threshold) matches.push({ id: item.id, priority: r.kind === 'point' ? 0 : 1, distance });
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
      else if (hit) choose(hit, position);
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
    if (item.type === 'functionRoot' || item.type === 'functionIntersection') {
      const coordinate = value => new Intl.NumberFormat('ru-RU', { maximumSignificantDigits: 12, notation: value !== 0 && Math.abs(value) < 1e-6 ? 'scientific' : 'standard' }).format(value);
      return '≈ (' + coordinate(r.x) + '; ' + coordinate(r.y) + ') · ' + (r.relation === 'tangent' ? 'касание · ' : '') + parents;
    }
    if (r.kind === 'point') return '(' + format(r.x) + '; ' + format(r.y) + ')' + (item.type === 'point' ? ' · свободная' : ' · ' + parents);
    if (r.kind === 'measurement') return '≈ ' + format(r.value) + r.unit + ' · ' + parents;
    if (r.kind === 'slider') return r.name + ' = ' + String(r.value) + ' · от ' + String(r.min) + ' до ' + String(r.max);
    if (r.kind === 'functionGraph') return 'f(x) = ' + r.expression;
    if (r.kind === 'functionTable') return parents + ' · x от ' + tableNumber(item.start) + ' до ' + tableNumber(item.end) + ' · шаг ' + tableNumber(item.step);
    if (r.kind === 'vector') return '(' + format(r.d[0]) + '; ' + format(r.d[1]) + ') · ' + parents;
    if (r.kind === 'circle') return 'r ≈ ' + format(r.r) + ' · ' + parents;
    if (r.kind === 'transformation') return names[item.mode] + ' · ' + (item.mode === 'rotate' ? item.angle + '° · ' : item.mode === 'dilate' ? 'k = ' + item.factor + ' · ' : '') + parents;
    return parents;
  }
  const tableNumber = value => String(value).replace('.', ',');
  function tableOrdinate(value) {
    if (value === null) return '—';
    const rounded = Number(value.toPrecision(10));
    return (rounded === value ? '' : '≈ ') + tableNumber(rounded);
  }
  function renderFunctionTable(item) {
    const result = item?.type === 'functionTable' ? val(item.id) : null;
    const visible = result?.defined === true;
    $('function-table-output').hidden = !visible;
    $('function-table-note').hidden = !visible || !result.rows.some(row => row.y === null);
    if (!visible) { $('function-table-body').replaceChildren(); return; }
    $('function-table-caption').textContent = 'Значения функции ' + label(item.parents[0]);
    $('function-table-body').replaceChildren(...result.rows.map(({ x, y }) => {
      const row = document.createElement('tr');
      const argument = document.createElement('td'), ordinate = document.createElement('td');
      argument.textContent = tableNumber(x);
      ordinate.textContent = tableOrdinate(y);
      row.append(argument, ordinate);
      return row;
    }));
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
      const sub = document.createElement('small'); sub.textContent = (item.appearance?.visible === false ? 'Скрыт · ' : '') + description(item); info.append(title, sub); row.append(dot, info); row.onclick = () => choose(item.id); return row;
    }));
    if (active) list.querySelector('[data-object="' + active + '"]')?.focus({ preventScroll: true });
    const activeSlider = document.activeElement?.dataset?.slider;
    const sliders = state.objects.filter(item => item.type === 'slider');
    $('slider-list').replaceChildren(...sliders.map(parameter => {
      const control = document.createElement('label'); control.className = 'slider-control';
      const caption = document.createElement('span'); caption.textContent = parameter.name;
      const output = document.createElement('output'); output.textContent = String(parameter.value);
      const range = document.createElement('input'); range.type = 'range'; range.dataset.slider = parameter.id;
      range.min = parameter.min; range.max = parameter.max; range.step = parameter.step; range.value = parameter.value; range.disabled = readOnly;
      range.setAttribute('aria-label', 'Параметр ' + parameter.name);
      range.oninput = () => { if (!readOnly) { updateSlider(parameter.id, Number(range.value)); output.textContent = String(Number(range.value)); } };
      range.onchange = finishSlider; control.append(caption, output, range); return control;
    }));
    if (activeSlider) $('slider-list').querySelector('[data-slider="' + activeSlider + '"]')?.focus({ preventScroll: true });
    const item = object(selected); $('selected-panel').hidden = !item;
    const revision = item ? JSON.stringify(item) : null, inspectorChanged = revision !== inspectorRevision;
    inspectorRevision = revision;
    if (item) {
      $('selected-heading').textContent = names[item.type] + ' ' + item.label;
      const graph = item.type === 'functionGraph', slider = item.type === 'slider', table = item.type === 'functionTable';
      $('selected-expression').hidden = !graph; $('edit-expression').disabled = !graph || readOnly;
      if (graph && inspectorChanged) $('edit-expression').value = item.expression;
      $('add-function-table').hidden = !graph;
      $('add-function-table').disabled = readOnly;
      $('selected-table-settings').hidden = !table;
      for (const field of ['start', 'end', 'step']) {
        const input = $('edit-table-' + field);
        input.disabled = !table || readOnly;
        if (table && inspectorChanged) input.value = String(item[field]);
      }
      $('selected-slider-settings').hidden = !slider;
      for (const field of ['min', 'max', 'step', 'value']) {
        const input = $('edit-slider-' + field); input.disabled = !slider || readOnly;
        if (slider && inspectorChanged) input.value = String(item[field]);
      }
      $('selected-description').textContent = description(item);
      if (inspectorChanged) $('object-label').value = item.label;
      const free = item.type === 'point'; $('coordinate-editor').hidden = !free;
      const parameter = parameterSettings(item);
      $('selected-parameter').hidden = !parameter;
      $('edit-parameter').disabled = !parameter || readOnly;
      if (parameter && inspectorChanged) setParameterInput($('edit-parameter'), $('selected-parameter-label'), parameter, item[parameter.key]);
      $('edit-x').disabled = !free || readOnly; $('edit-y').disabled = !free || readOnly;
      if (free) {
        // These are editable model values, not rounded display measurements.
        // Number -> String -> Number preserves coordinates during label-only edits.
        if (inspectorChanged) $('edit-x').value = String(item.x);
        if (inspectorChanged) $('edit-y').value = String(item.y);
      }
      const look = appearance(item), hasDrawing = !['slider', 'functionTable', 'transformation'].includes(item.type);
      document.querySelector('.appearance-fields').hidden = !hasDrawing;
      for (const [key, id] of Object.entries(appearanceFields)) {
        const input = $(id); if (!input) continue;
        input.disabled = readOnly || !hasDrawing;
        if (inspectorChanged) {
          if (['visible', 'labelVisible'].includes(key)) input.checked = look[key];
          else input.value = String(look[key]);
        }
      }
    }
    renderFunctionTable(item);
    $('undo').disabled = readOnly || !history.length; $('redo').disabled = readOnly || !future.length;
    updateTool();
  }
  function render() {
    evaluated = M.evaluate(state); selected = object(selected) ? selected : null; pending = pending.filter(id => !!object(id));
    $('model-title').value = state.title; $('show-axes').checked = state.view.axes; $('show-grid').checked = state.view.grid;
    renderBoard(); renderPanels(); updateSaveStatus();
  }
  function setReadOnly(value) {
    const next = value === true;
    if (accessInitialized && readOnly === next) return;
    accessInitialized = true; readOnly = next; document.documentElement.dataset.spacemathReadonly = String(readOnly);
    if (readOnly) { if (viewTimer !== null) { root.clearTimeout(viewTimer); viewTimer = null; } interactionEpoch++; dragBefore = null; dragId = null; sliderBefore = null; sliderId = null; pending = []; inspectorRevision = null; if ($('confirm-dialog').open) $('confirm-dialog').close('cancel'); }
    document.querySelectorAll('#tools button,#add-function-form input,#add-function-form button,#add-slider-form input,#add-slider-form select,#add-slider-form button,#tool-parameter,#fit-view,#zoom-in,#zoom-out,#model-title,#show-axes,#show-grid,#add-point-form input,#add-point-form button,#edit-object-form input,#edit-object-form select,#edit-object-form button,#delete-object,#new-model,#example,#import-json,#finish-polygon,#cancel-selection').forEach(control => { control.disabled = readOnly; });
    for (const item of state.objects) if (movablePoint(item)) {
      drawings[item.id]?.setAttribute({ fixed: readOnly || tool !== 'move' });
      if (readOnly) placePoint(drawings[item.id], val(item.id));
    }
    if (board) { board.setAttribute({ pan: { enabled: !readOnly }, zoom: { enabled: !readOnly } }); if (readOnly) { restoreViewport(); board.update(); } }
    renderPanels(); updateSaveStatus();
  }
  function applyState(value) {
    const incoming = M.normalize(value); interactionEpoch++;
    if (viewTimer !== null) { root.clearTimeout(viewTimer); viewTimer = null; }
    if (JSON.stringify(incoming) === JSON.stringify(state)) return;
    // Inspection is local UI state. Preserve a surviving object while another
    // participant edits its parents; this never grants model write access.
    const selectedType = object(selected)?.type;
    const keepResult = selectedType && incoming.objects.some(item => item.id === selected && item.type === selectedType);
    applying = true;
    try { if ($('confirm-dialog').open) $('confirm-dialog').close('cancel'); state = incoming; history = []; future = []; pending = []; if (!keepResult) selected = null; dragBefore = null; dragId = null; sliderBefore = null; sliderId = null; render(); }
    finally { applying = false; }
  }
  function ask(title, message, accept, action) {
    if (readOnly) return;
    const dialog = $('confirm-dialog'), epoch = interactionEpoch; $('confirm-title').textContent = title; $('confirm-description').textContent = message; $('confirm-accept').textContent = accept;
    dialog.returnValue = 'cancel'; dialog.onclose = () => { dialog.onclose = null; if (dialog.returnValue === 'confirm' && !readOnly && epoch === interactionEpoch) action(); }; dialog.showModal();
  }
  function travel(redo) {
    if (readOnly) return; finishDrag(); finishSlider();
    const source = redo ? future : history, destination = redo ? history : future;
    if (!source.length) return;
    interactionEpoch++; destination.push(clone(state)); state = source.pop(); pending = []; render(); saveAndEmit(); say(redo ? 'Действие повторено.' : 'Действие отменено.');
  }
  function fit() {
    if (readOnly) return;
    const points = Object.values(evaluated).filter(item => item.kind === 'point' && item.defined);
    let viewport = { x: 0, y: 0, span: 12 };
    if (points.length) {
      const xs = points.map(p => p.x), ys = points.map(p => p.y);
      for (const item of Object.values(evaluated)) if (item.kind === 'circle' && item.defined) { xs.push(item.c[0] - item.r, item.c[0] + item.r); ys.push(item.c[1] - item.r, item.c[1] + item.r); }
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), pad = Math.max(1.5, (maxX - minX) * .15, (maxY - minY) * .15);
      const ratio = board ? board.canvasWidth / board.canvasHeight : 1;
      viewport = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, span: Math.max((maxX - minX + 2 * pad) / Math.max(1, ratio), (maxY - minY + 2 * pad) / Math.max(1, 1 / ratio)) };
    }
    commit(s => { s.view.viewport = viewport; });
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
  $('zoom-in').onclick = () => zoomView(.8); $('zoom-out').onclick = () => zoomView(1.25);
  $('model-title').onchange = () => { if (!commit(s => { s.title = $('model-title').value; })) $('model-title').value = state.title; };
  $('show-axes').onchange = () => commit(s => { s.view.axes = $('show-axes').checked; });
  $('show-grid').onchange = () => commit(s => { s.view.grid = $('show-grid').checked; });
  localForm($('add-point-form'), () => { const id = addPoint(Number($('point-x').value), Number($('point-y').value), false); if (id) { if (expectedPoint()) choose(id); else { selected = id; renderPanels(); } } });
  localForm($('edit-object-form'), () => {
    const selectedObject = object(selected);
    if (!selectedObject) return;
    const id = selected, newLabel = $('object-label').value, x = Number($('edit-x').value), y = Number($('edit-y').value);
    const parameter = parameterSettings(selectedObject);
    commit(s => {
      const item = s.objects.find(o => o.id === id);
      item.label = newLabel;
      saveAppearance(item);
      if (item.type === 'point') { item.x = x; item.y = y; }
      if (parameter) item[parameter.key] = Number($('edit-parameter').value);
      if (item.type === 'slider') for (const field of ['min', 'max', 'step', 'value']) item[field] = Number($('edit-slider-' + field).value);
      if (item.type === 'functionTable') for (const field of ['start', 'end', 'step']) item[field] = Number($('edit-table-' + field).value);
      if (item.type === 'functionGraph') {
        Object.assign(item, graphParents($('edit-expression').value, s, true));
        // Only a newly referenced slider can move before this graph. Existing
        // points and tables must stay after their parent when its formula changes.
        const index = s.objects.indexOf(item);
        const following = s.objects.slice(index + 1);
        const required = new Set(item.parents);
        s.objects = [
          ...s.objects.slice(0, index),
          ...following.filter(o => required.has(o.id)),
          item,
          ...following.filter(o => !required.has(o.id))
        ];
      }
    }, 'Объект обновлён.');
  });
  localForm($('add-function-form'), () => {
    let id;
    const source = $('function-expression').value.trim().replace(/^(?:y|f\(x\))\s*=\s*/i, '');
    if (commit(s => {
      const definition = graphParents(source, s, true); id = nextId(s);
      s.objects.push({ id, type: 'functionGraph', label: 'f' + (s.objects.filter(o => o.type === 'functionGraph').length + 1), ...definition });
    }, 'График построен. Параметры меняют его форму у всех участников.')) { selected = id; renderPanels(); }
  });
  localForm($('add-slider-form'), () => {
    const id = nextId();
    if (commit(s => s.objects.push({ id, type: 'slider', label: $('slider-name').value, parents: [], name: $('slider-name').value, min: Number($('slider-min').value), max: Number($('slider-max').value), step: Number($('slider-step').value), value: Number($('slider-value').value) }), 'Параметр добавлен. Используйте его имя в формуле.')) { selected = id; renderPanels(); }
  });
  $('add-function-table').onclick = () => {
    const graph = object(selected);
    if (readOnly || graph?.type !== 'functionGraph') return;
    const id = nextId();
    const table = { id, type: 'functionTable', label: 'Значения ' + graph.label.slice(0, 20), parents: [graph.id], start: -3, end: 3, step: 1 };
    if (commit(s => s.objects.push(table), 'Таблица добавлена. Задайте нужный диапазон x.')) {
      selected = id;
      renderPanels();
      $('edit-table-start').focus({ preventScroll: true });
    }
  };
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
      ask('Открыть построение?', 'Файл «' + file.name.slice(0, 100) + '» заменит текущую модель. Действие можно отменить.', 'Открыть', () => { pending = []; commit(s => Object.assign(s, imported), 'Построение открыто.'); });
    } catch (error) { say('Не удалось открыть файл: ' + error.message, true); }
  };
  document.addEventListener('keydown', event => {
    if (readOnly || $('confirm-dialog').open || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); travel(event.shiftKey); }
    else if (event.key === 'Escape') { setTool('move'); say('Выбор инструмента отменён.'); }
    else if (event.key === 'Delete' && selected) { event.preventDefault(); $('delete-object').click(); }
    else if (tool === 'move' && movablePoint(object(selected)) && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && (event.target.id === 'geometry-board' || event.target.dataset.object)) {
      event.preventDefault();
      const selectedObject = object(selected);
      if (selectedObject.type === 'pointOn') {
        const parent = object(selectedObject.parents[0]), settings = pathParameter(parent);
        const sign = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1;
        let parameter = selectedObject.parameter + sign * (event.shiftKey ? settings.largeStep : settings.step);
        if (circleTypes.has(parent.type)) parameter = ((parameter % 1) + 1) % 1;
        else parameter = Math.max(settings.min, Math.min(settings.max, parameter));
        commit(s => {
          const point = s.objects.find(o => o.id === selectedObject.id);
          point.parameter = parameter;
          if (!M.evaluate(s)[point.id].defined) throw new Error('На этом участке точка не определена.');
        });
      } else {
        const step = event.shiftKey ? 1 : .1;
        const dx = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
        const dy = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
        commit(s => { const item = s.objects.find(o => o.id === selectedObject.id); if (dx) item.x += dx; if (dy) item.y += dy; });
      }
    }
  });
  root.addEventListener('pointerup', () => { finishDrag(); finishSlider(); flushViewport(); });
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
      if (Math.abs(board.canvasWidth - width) > .5 || Math.abs(board.canvasHeight - height) > .5) {
        settingViewport = true;
        try { board.resizeContainer(width, height, true, false); restoreViewport(); }
        finally { settingViewport = false; }
      }
    });
    observer.observe($('geometry-board'));
    root.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  root.SpaceMathApp = Object.freeze({ getState: () => M.normalize(state), applyState, setReadOnly, subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); }, getReadOnly: () => readOnly });
})(window);
