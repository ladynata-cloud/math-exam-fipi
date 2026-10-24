/* Classic board drawing UI. Loaded before the page's existing shared state.
   View transforms are local. Existing strokes/events are preserved; screenshots
   add a bounded image object through the existing generic drawing transport. */
'use strict';

const inkCanvas = document.createElement('canvas');
const inkContext = inkCanvas.getContext('2d');
let camera = { scale: 1, x: 0, y: 0 };
let fitViewport = false, cameraPageId = null, activePointerId = null;
let gestureStart = null, gestureTool = null, gesturePageId = null, panOrigin = null, textStyle = null;
let renderRequest = 0, sharedRedo = [], historyIdentity = '', pendingHistory = null;
let historyTimer = null;
let importingImage = false, messageTimer = null, imageImportEpoch = 0;
const toolWidths = { pen: 5, marker: 16, eraser: 24, line: 3, rect: 3,
  arrow: 3, ellipse: 3, triangle: 3, text: 5 };
const pathShapes = new Set(['arrow', 'ellipse', 'triangle']);

function announceBoard(message) {
  $('boardAnnouncement').textContent = message;
}

function boardMessage(message, temporary = false) {
  clearTimeout(messageTimer);
  const output = $('boardMessage');
  output.textContent = message;
  output.hidden = !message;
  if (temporary) messageTimer = setTimeout(() => { output.hidden = true; }, 7000);
}

async function insertBoardImage(file) {
  if (!file || !canWrite() || pendingHistory || importingImage || activePointerId !== null) return;
  finishText();
  const targetId = page().id, owner = shared.me?.participantId, roomId = shared.roomId;
  const controlVersion = shared.controlVersion, epoch = imageImportEpoch;
  importingImage = true;
  buttons();
  boardMessage('Подготавливаем снимок…');
  try {
    const image = await BoardImages.importFile(file);
    if (!canWrite() || pendingHistory || activePointerId !== null || page().id !== targetId
      || shared.me?.participantId !== owner || shared.roomId !== roomId
      || shared.controlVersion !== controlVersion || imageImportEpoch !== epoch) {
      throw new Error('Лист или право писать изменились. Выберите снимок ещё раз.');
    }
    const scale = Math.min(1, Math.max(1, view.w - 48) / image.width,
      Math.max(1, view.h - 64) / image.height);
    const width = image.width * scale, height = image.height * scale;
    const position = BoardInk.screenToWorld({ x: (view.w - width) / 2, y: (view.h - height) / 2 }, camera);
    const stroke = { ...newObjectMeta(), ...image, kind: 'image', tool: 'image',
      x: position.x, y: position.y, width: width / camera.scale, height: height / camera.scale };
    const budget = BoardImages.checkBudget(publicSnapshot(), stroke);
    if (!budget.ok) throw new Error(budget.error);
    fitViewport = false;
    addStroke(stroke);
    setTool('pen');
    canvas.focus({ preventScroll: true });
    boardMessage('Снимок добавлен. Пишите поверх него; ластик убирает только пометки.', true);
  } catch (error) {
    boardMessage(error.message || 'Не удалось открыть снимок. Попробуйте PNG, JPG или WebP.');
  } finally {
    importingImage = false;
    $('boardImageFile').value = '';
    buttons();
  }
}

function syncHistoryIdentity() {
  const identity = `${shared.roomId}:${shared.me?.participantId || ''}`;
  if (identity !== historyIdentity) {
    historyIdentity = identity;
    sharedRedo = [];
    clearPendingHistory();
  }
}

function clearPendingHistory() {
  clearTimeout(historyTimer);
  pendingHistory = null;
}

function pruneSharedRedo() {
  sharedRedo = sharedRedo.filter(entry => {
    const sheet = state.pages.find(item => item.id === entry.pageId);
    return sheet && !sheet.strokes.some(stroke => stroke.objectId === entry.stroke.objectId);
  });
}

function forgetPageRedo(pageId, authorId) {
  if (!authorId || authorId === shared.me?.participantId) {
    sharedRedo = sharedRedo.filter(entry => entry.pageId !== pageId);
  }
}

function acknowledgeHistory() {
  if (pendingHistory) {
    const sheet = state.pages.find(item => item.id === pendingHistory.pageId);
    const present = sheet?.strokes.some(stroke => stroke.objectId === pendingHistory.objectId);
    if (!sheet || present === (pendingHistory.kind === 'redo')) {
      if (pendingHistory.kind === 'redo' && sheet) {
        announceBoard(`Штрих возвращён на лист ${state.pages.indexOf(sheet) + 1}.`);
      }
      clearPendingHistory();
    }
  }
  // A pending undo still has its original object until the server acknowledges it.
  if (!pendingHistory) pruneSharedRedo();
}

function beginHistory(kind, entry) {
  pendingHistory = { kind, pageId: entry.pageId, objectId: entry.stroke.objectId };
  historyTimer = setTimeout(() => {
    // Keep mutations blocked until an authoritative state arrives. Otherwise a
    // delayed undo acknowledgement could overwrite a newly finished stroke.
    announceBoard('Ждём подтверждения. Обновляем состояние общей доски.');
    if (shared.connected) shared.socket.emit('room:state');
  }, 5000);
  buttons();
  emitWriter(kind === 'undo' ? 'board:stroke-undo' : 'board:stroke-redo', { pageIndex: state.current });
}

function ownUndoIndex() {
  if (!shared.connected) return page().strokes.length - 1;
  return page().strokes.findLastIndex(stroke => stroke.authorId === shared.me?.participantId);
}

function syncPenControls() {
  sizeText.textContent = `${size.value} px`;
  document.querySelectorAll('[data-pen-size]').forEach(button => {
    button.setAttribute('aria-pressed', String(+button.dataset.penSize === +size.value));
  });
  document.querySelectorAll('[data-pen-color]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.penColor === color.value));
  });
}

function setTool(next) {
  if (activePointerId !== null) return;
  if (canWrite()) finishText(); else closeTextEditor();
  if (tool !== 'hand') toolWidths[tool] = +size.value;
  tool = next;
  if (tool !== 'hand') size.value = toolWidths[tool] || 5;
  document.querySelectorAll('[data-tool]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.tool === tool));
  });
  const shapes = document.querySelector('.shape-menu');
  shapes.open = false;
  shapes.classList.toggle('selected', pathShapes.has(tool));
  canvas.style.cursor = tool === 'hand' ? 'grab' : readonly() ? 'default'
    : tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair';
  syncPenControls();
}

function screenPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: Math.min(Math.max(event.clientX - rect.left, 0), view.w),
    y: Math.min(Math.max(event.clientY - rect.top, 0), view.h) };
}

function point(event) { return BoardInk.screenToWorld(screenPoint(event), camera); }

function fitCamera() {
  camera = BoardInk.fitToBounds(BoardInk.drawingBounds(page().strokes, inkContext),
    { width: view.w, height: view.h }, { padding: 32, minScale: 0.02, maxScale: 1 });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  dpr = Math.max(1, devicePixelRatio || 1);
  view = { w: rect.width, h: rect.height };
  const width = Math.round(view.w * dpr), height = Math.round(view.h * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = inkCanvas.width = width;
    canvas.height = inkCanvas.height = height;
  }
  render();
}

function background(kind) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fffdf8';
  // CSS sizes may be fractional; cover the entire rounded backing bitmap.
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (kind === 'blank') return;
  const first = BoardInk.screenToWorld({ x: 0, y: 0 }, camera);
  const last = BoardInk.screenToWorld({ x: view.w, y: view.h }, camera);
  ctx.setTransform(dpr * camera.scale, 0, 0, dpr * camera.scale, dpr * camera.x, dpr * camera.y);
  ctx.lineWidth = 1 / camera.scale;
  const line = (x1, y1, x2, y2, colorValue) => {
    ctx.strokeStyle = colorValue;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  if (kind === 'grid') {
    // Keep the grid readable when fitting a large page, rather than drawing a solid tint.
    const step = camera.scale >= 0.35 ? 28 : camera.scale >= 0.07 ? 140 : 700;
    for (let x = Math.floor(first.x / step) * step; x <= last.x; x += step) {
      line(x + .5, first.y, x + .5, last.y, x % 140 === 0 ? '#d5ddeb' : '#e8edf5');
    }
    for (let y = Math.floor(first.y / step) * step; y <= last.y; y += step) {
      line(first.x, y + .5, last.x, y + .5, y % 140 === 0 ? '#d5ddeb' : '#e8edf5');
    }
  } else {
    const step = camera.scale >= .2 ? 34 : 170;
    for (let y = Math.floor((first.y - 42) / step) * step + 42; y <= last.y; y += step) {
      line(first.x, y + .5, last.x, y + .5, '#dce5f2');
    }
  }
  line(56.5, first.y, 56.5, last.y, 'rgba(190,18,60,.35)');
}

function render() {
  if (cameraPageId !== page().id) {
    cameraPageId = page().id;
    camera = { scale: 1, x: 0, y: 0 };
    fitViewport = false;
  }
  if (fitViewport && !drawing && !current) fitCamera();
  background(page().bg);
  ctx.setTransform(dpr * camera.scale, 0, 0, dpr * camera.scale, dpr * camera.x, dpr * camera.y);
  BoardImages.drawImages(ctx, page().strokes, scheduleRender);
  inkContext.setTransform(dpr * camera.scale, 0, 0, dpr * camera.scale, dpr * camera.x, dpr * camera.y);
  BoardInk.renderLayer(inkContext, page().strokes, current);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(inkCanvas, 0, 0);
  $('zoomReset').textContent = `${Math.round(camera.scale * 100)}%`;
  $('zoomReset').setAttribute('aria-label', `Масштаб ${Math.round(camera.scale * 100)} процентов. Вернуться к 100 процентам`);
  $('zoomIn').disabled = camera.scale >= BoardInk.MAX_SCALE;
  $('zoomOut').disabled = camera.scale <= BoardInk.MIN_SCALE;
  buttons();
}

function scheduleRender() {
  if (!renderRequest) renderRequest = requestAnimationFrame(() => { renderRequest = 0; render(); });
}

function changeView(action) {
  if (activePointerId !== null) return;
  finishText();
  fitViewport = action === 'fit';
  if (action === 'reset') camera = { scale: 1, x: 0, y: 0 };
  else if (action !== 'fit') camera = BoardInk.zoomAt(camera,
    { x: view.w / 2, y: view.h / 2 }, action === 'in' ? 1.25 : .8);
  render();
}

function addStroke(stroke, remote = false, pageIndex = state.current) {
  const sheet = state.pages[pageIndex];
  if (!stroke || !sheet || (!remote && pendingHistory)) return;
  // Reconnection/snapshot delivery must not duplicate a completed object.
  if (!stroke.objectId || !sheet.strokes.some(item => item.objectId === stroke.objectId)) sheet.strokes.push(stroke);
  sheet.redo = [];
  forgetPageRedo(sheet.id, remote ? stroke.authorId : shared.me?.participantId);
  render();
  save();
  if (!remote) emitWriter(stroke.kind === 'text' ? 'board:text-add' : 'board:stroke-end',
    { stroke, pageIndex });
}

function down(event) {
  if (activePointerId !== null || event.button !== 0 || (event.pointerType === 'touch' && !event.isPrimary)) return;
  if (tool !== 'hand' && (!canWrite() || pendingHistory)) return;
  finishText();
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  if (tool === 'text') { openText(point(event)); return; }
  activePointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  fitViewport = false;
  gestureTool = tool;
  if (tool === 'hand') {
    panOrigin = { point: screenPoint(event), camera: { ...camera } };
    canvas.style.cursor = 'grabbing';
    return;
  }
  drawing = true;
  gesturePageId = page().id;
  gestureStart = point(event);
  const common = { ...newObjectMeta(), color: color.value, size: +size.value };
  if (pathShapes.has(tool)) current = { ...common, kind: 'path', tool: 'pen',
    points: BoardInk.shapePoints(tool, gestureStart, gestureStart) };
  else if (['pen', 'marker', 'eraser'].includes(tool)) current = { ...common, kind: 'path', tool, points: [gestureStart] };
  else current = { ...common, kind: tool === 'rect' ? 'rect' : 'line', tool, start: gestureStart, end: gestureStart };
  emitWriter('board:stroke-start', { stroke: current, pageIndex: state.current });
  scheduleRender();
}

function move(event, final = false) {
  if (event.pointerId !== activePointerId) return;
  event.preventDefault();
  if (panOrigin) {
    const next = screenPoint(event);
    camera = BoardInk.pan(panOrigin.camera, next.x - panOrigin.point.x, next.y - panOrigin.point.y);
    scheduleRender();
    return;
  }
  if (!canWrite() || !drawing || !current) return;
  if (pathShapes.has(gestureTool)) {
    current.points = BoardInk.shapePoints(gestureTool, gestureStart, point(event), { shift: event.shiftKey });
    // A shape preview replaces points; existing stroke-points deliberately only appends.
    emitWriter('board:stroke-start', { stroke: current, pageIndex: state.current });
  } else if (current.kind === 'path') {
    const samples = event.getCoalescedEvents?.() || [];
    const events = [...samples.slice(-63), event];
    const added = [];
    for (const sample of events) {
      const next = point(sample), last = current.points.at(-1);
      const distance = Math.hypot(next.x - last.x, next.y - last.y);
      if (distance > (final ? .01 : 1.5 / camera.scale)) { current.points.push(next); added.push(next); }
    }
    if (added.length) emitWriter('board:stroke-points', { kind: 'path', points: added, pageIndex: state.current });
  } else {
    current.end = BoardInk.constrainEnd(gestureTool, gestureStart, point(event), event.shiftKey);
    emitWriter('board:stroke-points', { kind: current.kind, end: current.end, pageIndex: state.current });
  }
  scheduleRender();
}

function cancelGesture(commit = false) {
  const wasPan = !!panOrigin;
  const remotePreview = wasPan && !drawing ? current : null;
  const pointerId = activePointerId, done = drawing && canWrite() && commit ? current : null;
  const pageIndex = state.pages.findIndex(sheet => sheet.id === gesturePageId);
  activePointerId = null; drawing = false; current = null;
  gestureStart = null; gestureTool = null; gesturePageId = null; panOrigin = null;
  if (commit && wasPan) current = remotePreview;
  if (pointerId !== null) { try { canvas.releasePointerCapture(pointerId); } catch (_) {} }
  canvas.style.cursor = tool === 'hand' ? 'grab' : readonly() ? 'default'
    : tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair';
  if (done && pageIndex >= 0) addStroke(done, false, pageIndex); else render();
}

function up(event) {
  if (event.pointerId !== activePointerId) return;
  move(event, true);
  cancelGesture(true);
}

function openText(position) {
  const wr = wrap.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
  const screen = BoardInk.worldToScreen(position, camera);
  textPoint = position;
  textStyle = { color: color.value, size: +size.value };
  editor.value = '';
  editor.style.left = `${cr.left - wr.left + Math.max(0, Math.min(screen.x, view.w - 180))}px`;
  editor.style.top = `${cr.top - wr.top + Math.max(0, Math.min(screen.y, view.h - 60))}px`;
  editor.style.maxWidth = `${Math.max(170, view.w - 20)}px`;
  editor.style.color = textStyle.color;
  editor.style.fontSize = `${Math.max(12, (textStyle.size * 3 + 12) * camera.scale)}px`;
  editor.classList.remove('hidden');
  editor.focus();
}

function finishText() {
  if (editor.classList.contains('hidden')) return;
  if (!canWrite() || pendingHistory) { closeTextEditor(); return; }
  const value = editor.value.trim();
  if (value && textPoint) addStroke({ ...newObjectMeta(), kind: 'text', tool: 'text',
    x: textPoint.x, y: textPoint.y, text: value, ...textStyle });
  closeTextEditor();
}

function undo() {
  if (!canWrite() || activePointerId !== null || pendingHistory) return;
  finishText();
  const index = ownUndoIndex();
  if (index < 0) return;
  if (shared.connected) {
    const entry = { pageId: page().id, stroke: page().strokes[index] };
    sharedRedo.push(entry);
    beginHistory('undo', entry);
  } else {
    page().redo.push(page().strokes.splice(index, 1)[0]);
    render(); save();
  }
}

function redo() {
  if (!canWrite() || activePointerId !== null || pendingHistory) return;
  finishText();
  if (shared.connected) {
    pruneSharedRedo();
    const entry = sharedRedo.at(-1);
    if (entry) beginHistory('redo', entry);
  } else {
    const stroke = page().redo.pop();
    if (stroke) { page().strokes.push(stroke); render(); save(); }
  }
}

function clearPage() {
  if (!canWrite() || pendingHistory || activePointerId !== null) return;
  finishText();
  if (!page().strokes.length || confirm('Очистить текущий лист?')) {
    imageImportEpoch++;
    forgetPageRedo(page().id);
    clearPendingHistory();
    page().strokes = []; page().redo = [];
    render(); save();
    emitWriter('board:clear-page', { pageIndex: state.current });
  }
}

async function exportPng() {
  finishText();
  const sheet = page();
  const images = sheet.strokes.filter(stroke => stroke.kind === 'image');
  const ready = await BoardImages.whenReady(images);
  const currentImages = sheet.strokes.filter(stroke => stroke.kind === 'image');
  if (page() !== sheet || images.length !== currentImages.length || images.some((image, index) => image !== currentImages[index])) {
    boardMessage('Лист изменился. Повторите сохранение PNG.'); return;
  }
  if (!ready) { boardMessage('Снимок ещё не загрузился. Повторите сохранение PNG.'); return; }
  render();
  const link = document.createElement('a');
  link.download = `mathexam-board-sheet-${state.current + 1}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function sync(doSave = true) {
  bg.value = page().bg;
  render();
  if (doSave) save();
}

function addSheet() {
  if (shared.role !== 'teacher' || !canWrite() || pendingHistory || activePointerId !== null) return;
  finishText();
  imageImportEpoch++;
  cancelGesture(false);
  const next = blank(); ensurePageId(next);
  state.pages.splice(state.current + 1, 0, next); state.current++;
  sync();
  emit('board:page-add', { pageIndex: state.current, page: { id: next.id, bg: next.bg } });
}

function delSheet() {
  if (shared.role !== 'teacher' || !canWrite() || pendingHistory || activePointerId !== null) return;
  finishText();
  if (!confirm('Удалить текущий лист и все записи на нём?')) return;
  imageImportEpoch++;
  cancelGesture(false);
  const pageIndex = state.current;
  forgetPageRedo(page().id);
  clearPendingHistory();
  if (state.pages.length === 1) { state.pages[0] = blank(); state.current = 0; }
  else { state.pages.splice(pageIndex, 1); state.current = Math.min(pageIndex, state.pages.length - 1); }
  sync(); emit('board:page-delete', { pageIndex });
}

function switchSheet(delta) {
  if (shared.role !== 'teacher' || !canWrite() || pendingHistory || activePointerId !== null) return;
  finishText();
  const index = state.current + delta;
  if (index < 0 || index >= state.pages.length) return;
  imageImportEpoch++;
  cancelGesture(false);
  state.current = index; sync();
  emit('board:page-switch', { pageIndex: state.current });
}

function buttons() {
  syncHistoryIdentity();
  const writable = canWrite() && !pendingHistory;
  sheetCount.textContent = `Лист ${state.current + 1} из ${state.pages.length}`;
  $('prevSheet').disabled = !writable || state.current === 0;
  $('nextSheet').disabled = !writable || state.current === state.pages.length - 1;
  $('addSheet').disabled = $('deleteSheet').disabled = bg.disabled = !writable;
  document.querySelectorAll('[data-tool]').forEach(button => { button.disabled = button.dataset.tool !== 'hand' && !writable; });
  document.querySelectorAll('[data-pen-color],[data-pen-size]').forEach(button => { button.disabled = !writable; });
  color.disabled = size.disabled = !writable;
  $('undo').disabled = !writable || !!pendingHistory || ownUndoIndex() < 0;
  $('redo').disabled = !writable || !!pendingHistory || (shared.connected ? sharedRedo.length === 0 : page().redo.length === 0);
  $('clear').disabled = !writable;
  $('addBoardImage').disabled = !writable || importingImage;
}

function bindBoardWriting() {
  $('addBoardImage').onclick = () => { if (canWrite()) $('boardImageFile').click(); };
  $('boardImageFile').onchange = event => insertBoardImage(event.target.files[0]);
  document.querySelector('.board').addEventListener('paste', event => {
    if (event.target.closest('input,textarea,[contenteditable="true"]') || !canWrite()) return;
    const item = [...(event.clipboardData?.items || [])].find(entry => entry.kind === 'file' && entry.type.startsWith('image/'));
    if (!item) return;
    event.preventDefault();
    insertBoardImage(item.getAsFile());
  });
  document.addEventListener('board:view-changing', () => { imageImportEpoch++; finishText(); cancelGesture(true); });
  document.querySelectorAll('[data-tool]').forEach(button => { button.onclick = () => setTool(button.dataset.tool); });
  document.querySelectorAll('[data-pen-color]').forEach(button => {
    button.onclick = () => { if (!canWrite()) return; finishText(); color.value = button.dataset.penColor; syncPenControls(); };
  });
  document.querySelectorAll('[data-pen-size]').forEach(button => {
    button.onclick = () => { if (!canWrite()) return; finishText(); size.value = button.dataset.penSize; toolWidths[tool] = +size.value; syncPenControls(); };
  });
  size.oninput = () => { finishText(); toolWidths[tool] = +size.value; syncPenControls(); };
  color.oninput = color.onchange = () => { finishText(); syncPenControls(); };
  canvas.onpointerdown = down; canvas.onpointermove = move; canvas.onpointerup = up;
  canvas.onpointercancel = event => { if (event.pointerId === activePointerId) cancelGesture(true); };
  canvas.onlostpointercapture = event => { if (event.pointerId === activePointerId) cancelGesture(true); };
  canvas.oncontextmenu = event => event.preventDefault();
  $('zoomIn').onclick = () => changeView('in');
  $('zoomOut').onclick = () => changeView('out');
  $('zoomReset').onclick = () => changeView('reset');
  $('fitBoard').onclick = () => changeView('fit');
  editor.onblur = finishText;
  editor.onkeydown = event => {
    if (event.key === 'Escape') { event.preventDefault(); closeTextEditor(); canvas.focus(); }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); finishText(); canvas.focus(); }
  };
  document.querySelector('.board').addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog[open]')) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.code === 'KeyZ') { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
    if (modifier && event.code === 'KeyY') { event.preventDefault(); redo(); return; }
    if (modifier || event.altKey) return;
    const shortcuts = { KeyP: 'pen', KeyE: 'eraser', KeyH: 'hand', KeyT: 'text', KeyL: 'line' };
    if (shortcuts[event.code] && (canWrite() || event.code === 'KeyH')) { event.preventDefault(); setTool(shortcuts[event.code]); }
  });
  if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(resize)).observe(canvas);
  addEventListener('resize', () => requestAnimationFrame(resize));
}
