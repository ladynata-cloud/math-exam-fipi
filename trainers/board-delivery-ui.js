/* Public room delivery UI; group lessons and cabinet storage are independent. */
'use strict';
let inkOutbox = null, inkDeliveryCapability = false, inkDeliveryTimer = null;
let inkDeliveryUnavailable = false, inkStructurePending = false, inkRoomTtlMs = null;
let gestureInkContext = null, textInkContext = null;

function deliveryScopeMatches() {
  return inkOutbox && inkOutbox.scope.server === shared.server
    && inkOutbox.scope.roomId === shared.roomId
    && inkOutbox.scope.participantId === shared.me?.participantId;
}
function deliveryContext() {
  return inkDeliveryCapability && deliveryScopeMatches() ? {
    pageId: page().id, pageEpoch: page().pageEpoch || 0,
    controlVersion: shared.controlVersion, outbox: inkOutbox
  } : null;
}
function deliveryPending() { return !!inkOutbox && (!!inkOutbox.fault || inkOutbox.active().length > 0); }
function deliveryBlocksWriting() {
  return inkStructurePending || (!!inkOutbox && (inkOutbox.blocked() || inkDeliveryUnavailable
    || (deliveryPending() && (!deliveryScopeMatches() || !inkDeliveryCapability))));
}
function deliveryAllowsHistory() {
  if (deliveryPending()) {
    boardMessage('Дождитесь сохранения штрихов. Если отправка отклонена, скачайте локальную копию.');
    return false;
  }
  return true;
}
function updateInkDeliveryStatus() {
  const output = document.getElementById('inkSaveStatus');
  if (!output) return;
  let message = '', kind = '';
  if (inkDeliveryUnavailable) { message = 'Сервер не подтверждает сохранение. Записи остаются в локальной копии.'; kind = 'bad'; }
  else if (inkOutbox?.fault) { message = 'Локальная копия не записана. Оставьте вкладку открытой или скачайте записи.'; kind = 'bad'; }
  else if (inkOutbox?.rejected().length) { message = 'Есть неотправленные записи: лист или право писать изменились. Скачайте копию.'; kind = 'bad'; }
  else if (inkOutbox?.pending().length) { message = `Ждут сохранения: ${inkOutbox.pending().length}`; kind = 'wait'; }
  else if (drawing || (!editor.classList.contains('hidden') && editor.value.trim())) { message = 'Запись ещё не завершена'; kind = 'wait'; }
  else if (shared.roomId && !shared.connected) { message = 'Нет связи с комнатой'; kind = 'wait'; }
  else if (shared.roomId && (!roomStateReceived || pendingHistory || inkStructurePending)) { message = 'Ждём подтверждения комнаты'; kind = 'wait'; }
  else if (inkOutbox?.list().some(record => record.status === 'archived')) { message = 'Неотправленные записи оставлены в локальной копии'; kind = 'wait'; }
  else if (shared.roomId && inkDeliveryCapability) { message = 'Штрихи сохранены на сервере'; kind = 'ok'; }
  else if (shared.roomId) { message = 'Временная комната: сохраните лист в PNG'; kind = 'wait'; }
  else message = 'Локальная доска';
  const panel = document.getElementById('inkDeliveryPanel');
  if (panel) panel.hidden = !shared.roomId && !(inkOutbox?.records.size || inkOutbox?.fault);
  const retention = document.getElementById('inkRetentionNote');
  retention.hidden = !inkDeliveryCapability || !Number.isFinite(inkRoomTtlMs);
  if (!retention.hidden) retention.textContent = `Комната хранится ${Math.round(inkRoomTtlMs / 3600000 * 10) / 10} ч без участников. Для архива скачайте PNG.`;
  output.textContent = message; output.className = `status ${kind}`.trim();
  output.dataset.delivery = kind === 'ok' ? 'saved' : kind === 'bad' ? 'blocked' : 'pending';
  document.getElementById('downloadPendingInk').hidden = !(inkOutbox?.records.size || inkOutbox?.fault);
  document.getElementById('retryPendingInk').hidden = !deliveryPending();
  document.getElementById('archiveRejectedInk').hidden = !inkOutbox?.rejected().length;
}
function activateInkDelivery(payload) {
  if (Number.isFinite(payload?.state?.roomTtlMs)) inkRoomTtlMs = payload.state.roomTtlMs;
  const capability = payload?.state?.inkDelivery || payload?.inkDelivery;
  const durable = capability?.version === 1 && capability.durable === true;
  inkDeliveryUnavailable = !durable && ((inkDeliveryCapability || inkDeliveryUnavailable || deliveryPending()) && deliveryScopeMatches());
  inkDeliveryCapability = durable;
  if (!shared.me?.participantId || !shared.roomId) return;
  if (!deliveryScopeMatches()) {
    // A failed room's memory-only records must remain exportable.
    if (deliveryPending()) { updateInkDeliveryStatus(); return; }
    inkOutbox?.close();
    inkOutbox = new BoardDelivery.Outbox({
      storage: { get length() { return localStorage.length; }, key: i => localStorage.key(i),
        getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: key => localStorage.removeItem(key) },
      scope: { server: shared.server, roomId: shared.roomId, participantId: shared.me.participantId },
      id: genObjectId, changed: () => { updateInkDeliveryStatus(); scheduleRender(); }
    });
  }
  updateInkDeliveryStatus();
  if (payload?.state && !inkDeliveryTimer) flushPendingInk();
}
function queueCompletedInk(stroke, context) {
  if (!context) return false;
  const queue = context.outbox;
  const record = queue.enqueue({ pageId: context.pageId, pageEpoch: context.pageEpoch,
    controlVersion: context.controlVersion,
    eventName: stroke.kind === 'text' ? 'board:text-add' : 'board:stroke-end', stroke });
  if (!record) {
    // This path is only possible when storage failed during an already active
    // gesture. Keep that final gesture in memory for export, without sending.
    const held = { version: 1, scope: { ...queue.scope }, opId: genObjectId(), ...context,
      eventName: stroke.kind === 'text' ? 'board:text-add' : 'board:stroke-end',
      stroke: JSON.parse(JSON.stringify(stroke)), status: 'pending', createdAt: Date.now() };
    delete held.outbox;
    queue.records.set(held.opId, held); queue.fault = 'storage';
  }
  updateInkDeliveryStatus(); scheduleRender(); flushPendingInk(); return true;
}
function strokesWithPendingInk(sheet) {
  if (!deliveryScopeMatches()) return sheet.strokes;
  const ids = new Set(sheet.strokes.map(stroke => stroke.objectId));
  return sheet.strokes.concat(inkOutbox.pending().filter(record => record.pageId === sheet.id
    && record.pageEpoch === (sheet.pageEpoch || 0) && !ids.has(record.stroke.objectId)).map(record => record.stroke));
}
async function flushPendingInk() {
  clearTimeout(inkDeliveryTimer);
  if (!inkDeliveryCapability || !deliveryScopeMatches() || !shared.connected || !roomStateReceived
    || inkOutbox.busy || inkOutbox.closed || inkOutbox.fault || !inkOutbox.pending().length) return;
  const queue = inkOutbox, socket = shared.socket, roomId = shared.roomId;
  await queue.flush(record => new Promise((resolve, reject) => {
    if (shared.socket !== socket || !shared.connected || shared.roomId !== roomId || !deliveryScopeMatches()) { reject(new Error('disconnected')); return; }
    const { opId, pageId, pageEpoch, controlVersion, eventName, stroke } = record;
    socket.timeout(5000).emit('board:ink-commit', roomPayload({ role: shared.role,
      opId, pageId, pageEpoch, controlVersion, eventName, stroke }), (error, ack) => error ? reject(error) : resolve(ack));
  }));
  if (queue !== inkOutbox || !shared.connected) return;
  if (shared.socket !== socket) {
    // A reconnect can finish before the old socket's ACK timeout. The new
    // room:state saw busy=true; explicitly resume its queue once that ends.
    if (deliveryScopeMatches()) inkDeliveryTimer = setTimeout(() => { inkDeliveryTimer = null; flushPendingInk(); }, 0);
    return;
  }
  if (queue.pending().length && !queue.fault) inkDeliveryTimer = setTimeout(() => { inkDeliveryTimer = null; flushPendingInk(); }, 2500);
  socket.emit('room:state');
}
function downloadPendingInk() {
  if (!inkOutbox) return;
  const blob = new Blob([JSON.stringify(inkOutbox.export(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'mathexam-unsent-ink.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function bindInkDelivery() {
  document.getElementById('downloadPendingInk').onclick = downloadPendingInk;
  document.getElementById('retryPendingInk').onclick = () => { inkOutbox?.retryStorage(); flushPendingInk(); };
  document.getElementById('archiveRejectedInk').onclick = () => { inkOutbox?.archiveRejected(); updateInkDeliveryStatus(); scheduleRender(); };
  editor.addEventListener('input', updateInkDeliveryStatus);
  addEventListener('storage', event => {
    if (inkOutbox && (!event.key || event.key.startsWith(inkOutbox.prefix))) {
      inkOutbox.load(); updateInkDeliveryStatus(); scheduleRender(); flushPendingInk();
    }
  });
  addEventListener('beforeunload', event => {
    if (deliveryPending() || drawing || (!editor.classList.contains('hidden') && editor.value.trim())) {
      event.preventDefault(); event.returnValue = '';
    }
  });
  updateInkDeliveryStatus();
}

function markInkStructurePending(name) {
  if (inkDeliveryCapability && ['board:page-add','board:page-delete','board:clear-page','board:stroke-undo','board:stroke-redo','board:bg-change'].includes(name)) {
    inkStructurePending = true; updateInkDeliveryStatus(); return true;
  }
  return false;
}
