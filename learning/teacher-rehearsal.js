(function (root) {
  'use strict';

  // These drafts never use storage or the attempt mutation API. They belong to
  // the current teacher in this document and are cleared at account boundaries.
  const copies = new Map(), mounts = new Set();
  const MAX_COPIES = 12, MAX_STATE = 140000, MAX_SPEC = 300000;
  const MAX_STROKES = 500, MAX_DRAWING = 400000;
  let epoch = 0;
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  function boundedCopy(value, limit) {
    const text = JSON.stringify(value);
    if (!text || text.length > limit || !value || typeof value !== 'object' || Array.isArray(value)) throw Error('REHEARSAL_STATE_INVALID');
    return JSON.parse(text);
  }
  function sourceOf(value) {
    if (typeof value?.attemptId === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value.attemptId)) return { attemptId: value.attemptId };
    if (typeof value?.trainerId !== 'string' || !value.trainerId || value.trainerId.length > 160 ||
      typeof value?.contentId !== 'string' || !value.contentId || value.contentId.length > 300) throw Error('LEARNING_TASK_INVALID');
    const result = { trainerId: value.trainerId, contentId: value.contentId };
    if (value.seed !== undefined) {
      if (!Number.isSafeInteger(value.seed) || value.seed < 0 || value.seed > 1000000000) throw Error('LEARNING_TASK_INVALID');
      result.seed = value.seed;
    }
    return result;
  }
  function remember(key, entry) {
    copies.delete(key); copies.set(key, entry);
    while (copies.size > MAX_COPIES) copies.delete(copies.keys().next().value);
  }
  function clear() {
    epoch++; copies.clear();
    for (const cleanup of [...mounts]) cleanup();
  }

  async function mount(host, context) {
    const account = context.account, source = sourceOf(context.source), started = epoch;
    if (!host || account?.role !== 'teacher' || !account.id || typeof context.post !== 'function') throw Error('LEARNING_FORBIDDEN');
    const baseKey = JSON.stringify([account.id, 'source', source]);
    const section = document.createElement('section');
    section.className = 'teacher-rehearsal'; section.setAttribute('data-teacher-rehearsal', '');
    host.replaceChildren(section);
    let disposed = false, frame = null, drawing = null, frameGeneration = 0, requestGeneration = 0;
    let entry = null, activeKey = baseKey, original = null, busy = false;
    const current = () => !disposed && epoch === started && account.role === 'teacher' &&
      section.isConnected && section.parentElement === host && (context.isCurrent?.() ?? true);
    const canInteract = () => current() && (context.canInteract?.() ?? true);
    function destroyTools() {
      frameGeneration++; frame?.destroy(); drawing?.destroy(); frame = null; drawing = null;
    }
    function cleanup() {
      if (disposed) return;
      disposed = true; requestGeneration++; destroyTools(); mounts.delete(cleanup); section.remove();
    }
    mounts.add(cleanup);
    function message(text, error = false) {
      if (!current()) return;
      const output = section.querySelector('[data-rehearsal-status]');
      if (output) { output.textContent = text; output.classList.toggle('rehearsal-error', error); }
    }
    function keep() { if (current() && entry) remember(activeKey, entry); }
    function material() {
      const result = { trainerId: entry.attempt.trainerId, contentId: entry.attempt.contentId, title: entry.title };
      if (entry.sourceAttemptId) result.sourceAttemptId = entry.sourceAttemptId;
      else if (Number.isSafeInteger(entry.attempt.taskSpec.seed)) result.seed = entry.attempt.taskSpec.seed;
      return result;
    }
    function fromResponse(response, request) {
      const value = response?.attempt;
      if (!value) throw Error('LEARNING_TASK_INVALID');
      const trainerId = value.trainerId || value.taskSpec?.trainerId;
      const contentId = value.contentId || value.taskSpec?.contentId || value.taskSpec?.id;
      const item = context.catalog?.items?.find(row => row.trainerId === trainerId && row.contentId === contentId && row.url);
      if (!item || trainerId === 'board') throw Error('LEARNING_TRAINER_UNKNOWN');
      if (!request.attemptId && (request.trainerId !== trainerId || request.contentId !== contentId)) throw Error('LEARNING_TASK_INVALID');
      const taskSpec = boundedCopy(value.taskSpec, MAX_SPEC), state = boundedCopy(value.state, MAX_STATE);
      return {
        item, sourceAttemptId: request.attemptId || null,
        title: String(value.title || item.title).slice(0, 500),
        initialState: clone(state),
        attempt: { trainerId, contentId, taskSpec, state, version: 0, strokes: [] }
      };
    }
    function loading() {
      section.innerHTML = '<div class="rehearsal-loading" role="status">Открываем личную копию задания…</div>';
    }
    function failed() {
      if (!current()) return;
      section.innerHTML = '<div class="panel"><h1>Порешать самой</h1><p role="alert">Не удалось открыть личную копию. Проверьте соединение и доступ к заданию.</p><div class="actions"><button type="button" data-rehearsal-retry>Попробовать ещё раз</button><button type="button" data-rehearsal-back>Вернуться</button></div></div>';
      section.querySelector('[data-rehearsal-retry]').onclick = () => { if (canInteract()) loadOriginal(); };
      section.querySelector('[data-rehearsal-back]').onclick = () => { if (canInteract()) context.onBack?.(); };
    }
    function updateDrawing() {
      drawing?.update(entry.attempt.strokes);
      const undo = section.querySelector('[data-rehearsal-undo]');
      if (undo) undo.disabled = busy || !entry.attempt.strokes.length;
    }
    function render() {
      if (!current() || !entry) return;
      destroyTools();
      const generation = frameGeneration, local = entry;
      const live = () => canInteract() && generation === frameGeneration && entry === local && !busy;
      const variant = activeKey !== baseKey;
      section.innerHTML = `<header class="rehearsal-heading"><div><p class="rehearsal-label">Порешать самой</p><h1 data-rehearsal-title>${escape(entry.title)}</h1><p data-rehearsal-source>${variant ? 'Новый вариант для подготовки' : entry.sourceAttemptId ? 'Точное условие из работы ученика' : 'Личная подготовка к занятию'}</p></div><button type="button" data-rehearsal-back>Вернуться</button></header>
        <div class="rehearsal-private" data-rehearsal-private><strong>Личная копия · видна только вам</strong><span>Работа остаётся в этой вкладке.</span></div>
        <div class="rehearsal-columns"><section class="rehearsal-panel"><h2>Тренажёр</h2><div class="trainer-host" data-rehearsal-frame></div></section><section class="rehearsal-panel rehearsal-sheet"><header><h2>Мой лист для решения</h2><div class="rehearsal-drawing-tools" role="group" aria-label="Инструменты личного листа"><button type="button" data-rehearsal-tool="pen" aria-pressed="true">Перо</button><button type="button" data-rehearsal-tool="eraser" aria-pressed="false">Ластик</button><button type="button" data-rehearsal-undo>Отменить штрих</button></div></header><div class="drawing-host" data-rehearsal-drawing></div></section></div>
        <footer class="rehearsal-footer"><p role="status" aria-live="polite" data-rehearsal-status>Личная копия открыта.</p><div class="rehearsal-actions"><button type="button" class="primary" data-rehearsal-lesson>На урок с учеником</button><button type="button" data-rehearsal-assign>Выдать домашнее задание</button>${variant ? '<button type="button" data-rehearsal-original>Вернуться к исходному заданию</button>' : ''}<button type="button" data-rehearsal-reset>Начать свою копию заново</button></div><details class="rehearsal-details"><summary>О личной работе</summary><p>Можно решать, проверять ответы, брать подсказки и писать на листе. Работа ученика и его результаты не меняются.</p><p>Последние 12 личных копий остаются в этой вкладке до обновления страницы или выхода из аккаунта.</p></details></footer>`;
      section.querySelector('[data-rehearsal-back]').onclick = () => { if (live()) context.onBack?.(); };
      section.querySelector('[data-rehearsal-lesson]').onclick = () => { if (live()) context.onLesson?.(clone(material())); };
      section.querySelector('[data-rehearsal-assign]').onclick = () => { if (live()) context.onAssign?.(entry.item.id); };
      section.querySelector('[data-rehearsal-original]')?.addEventListener('click', () => {
        if (!live()) return;
        keep(); activeKey = baseKey; entry = original; remember(activeKey, entry); render();
      });
      section.querySelector('[data-rehearsal-reset]').onclick = () => {
        if (!live()) return;
        entry.attempt.state = clone(entry.initialState); entry.attempt.strokes = []; entry.attempt.version++;
        keep(); render(); message('Ваша копия начата заново с тем же условием.');
      };
      frame = new root.LearningTrainerFrame(section.querySelector('[data-rehearsal-frame]'), {
        item: entry.item, attempt: clone(entry.attempt), readOnly: false,
        onChange(change) {
          if (!live() || !change || typeof change.kind !== 'string') return;
          if (change.kind === 'newtask' || change.kind === 'new-task') { newVariant(); return; }
          if (change.kind === 'navigate' && change.details?.target === 'vilenkin-textbook-catalog') {
            frame.update(clone(entry.attempt), { readOnly: false, force: true });
            message('Для другого задания вернитесь в каталог кабинета.'); return;
          }
          try {
            entry.attempt.state = boundedCopy(change.state, MAX_STATE); entry.attempt.version++;
            // Updating the local frame reference does not rehydrate its own
            // input or send a pupil check, hint, state or result action.
            frame.attempt = clone(entry.attempt); keep();
            message('Ваша работа изменена только в этой вкладке.');
          } catch (_) {
            frame.update(clone(entry.attempt), { readOnly: false, force: true });
            message('Изменение слишком большое. Предыдущая личная работа сохранена в этой вкладке.', true);
          }
        }
      });
      drawing = new root.LearningDrawing(section.querySelector('[data-rehearsal-drawing]'), {
        actorId: account.id, color: '#16804c',
        onStroke(stroke) {
          if (!live() || !stroke || typeof stroke.id !== 'string' || stroke.id.length > 160 ||
            !Array.isArray(stroke.points) || !stroke.points.length || stroke.points.length > 500 ||
            !stroke.points.every(p => Number.isFinite(p.x) && p.x >= 0 && p.x <= 1 && Number.isFinite(p.y) && p.y >= 0 && p.y <= 1)) return;
          const saved = { id: stroke.id, author: account.id, color: '#16804c', width: 3, points: clone(stroke.points) };
          const next = [...entry.attempt.strokes, saved];
          if (next.length > MAX_STROKES || JSON.stringify(next).length > MAX_DRAWING) { message('Лист заполнен. Удалите ненужные штрихи, чтобы продолжить.', true); return; }
          entry.attempt.strokes = next; keep(); updateDrawing(); message('Штрих оставлен только на вашем личном листе.');
        },
        onErase(id) {
          if (!live()) return;
          entry.attempt.strokes = entry.attempt.strokes.filter(stroke => stroke.id !== id); keep(); updateDrawing();
        }
      });
      section.querySelectorAll('[data-rehearsal-tool]').forEach(button => {
        button.onclick = () => {
          if (!live()) return;
          drawing.tool = button.dataset.rehearsalTool;
          section.querySelectorAll('[data-rehearsal-tool]').forEach(tool => tool.setAttribute('aria-pressed', String(tool === button)));
        };
      });
      section.querySelector('[data-rehearsal-undo]').onclick = () => {
        if (!live() || !entry.attempt.strokes.length) return;
        entry.attempt.strokes.pop(); keep(); updateDrawing();
      };
      updateDrawing();
    }
    async function loadOriginal() {
      if (!current() || busy) return;
      busy = true; const request = ++requestGeneration; loading();
      try {
        const cached = copies.get(baseKey), body = clone(source);
        if (!body.attemptId && body.seed === undefined && Number.isSafeInteger(cached?.attempt.taskSpec.seed)) body.seed = cached.attempt.taskSpec.seed;
        const response = await context.post('/teacher/rehearsal', body);
        if (!current() || request !== requestGeneration) return;
        const fresh = fromResponse(response, body);
        entry = cached && JSON.stringify(cached.attempt.taskSpec) === JSON.stringify(fresh.attempt.taskSpec) ? cached : fresh;
        original = entry; activeKey = baseKey; remember(baseKey, entry); busy = false; render();
      } catch (_) { if (current() && request === requestGeneration) { busy = false; failed(); } }
    }
    async function newVariant() {
      if (!canInteract() || busy || !entry) return;
      busy = true; const request = ++requestGeneration;
      const body = { trainerId: entry.attempt.trainerId, contentId: entry.attempt.contentId };
      frame?.update(clone(entry.attempt), { readOnly: true, force: true });
      section.querySelectorAll('button').forEach(button => { button.disabled = true; });
      message('Готовим другой вариант для вашей личной работы…');
      try {
        const response = await context.post('/teacher/rehearsal', body);
        if (!current() || request !== requestGeneration) return;
        const next = fromResponse(response, body);
        // A variant must never overwrite the source attempt's exact draft.
        const key = JSON.stringify([account.id, 'variant', next.attempt.trainerId, next.attempt.contentId, next.attempt.taskSpec.seed]);
        activeKey = key; entry = next; remember(key, entry); busy = false; render();
      } catch (_) {
        if (current() && request === requestGeneration) { busy = false; render(); message('Не удалось открыть новый вариант. Ваша предыдущая работа осталась на месте.', true); }
      }
    }
    await loadOriginal();
    return cleanup;
  }

  root.LearningTeacherRehearsal = Object.freeze({ mount, clear });
})(window);
