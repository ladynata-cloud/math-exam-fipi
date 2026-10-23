(function (global) {
  'use strict';

  const PATH = '/trainers/atanasyan-7-9.html';
  const LESSON_ID = 'atanasyan-7-9-main-92-part-1';
  const THEORY_IDS = [14, 4, 1, 5].map(n => `atanasyan-7-9-theory-${n}-part-1`);
  const CANONICAL = 'https://mathexam.space/geometry-course/textbook/#' + LESSON_ID;
  const clone = value => JSON.parse(JSON.stringify(value));
  const selected = camera => ({ viewId: camera.viewId, zoom: camera.zoom, maxStep: camera.maxStep });
  const camera = view => ({ yaw: 0, pitch: 0, ...view });

  // The public course never executes this adapter. It has its own local work.
  // This wrapper has one lesson, four authored references and no personal store.
  function create(host, bundle, options = {}) {
    const doc = host.ownerDocument, win = doc.defaultView;
    const contract = options.contract || win.AtanasyanLearningContracts;
    const engine = options.engine || win.GeometryTextbook;
    const planar = options.viewer || win.PlanarViewer;
    const math = options.math || win.StereoMath;
    const ids = new Set([LESSON_ID, ...THEORY_IDS]);
    const lessons = bundle.lessons.filter(lesson => ids.has(lesson.id));
    const catalog = { ...bundle.catalog, entries: bundle.catalog.entries.filter(entry => ids.has(entry.id)) };
    const inspected = engine.inspectBundle(catalog, lessons, { sceneViewer: planar });
    if (inspected.available.size !== ids.size || inspected.issues.length ||
        lessons.find(lesson => lesson.id === LESSON_ID)?.answer?.mode !== 'manual') {
      throw new Error('The reviewed task and its theory are unavailable');
    }
    const known = inspected.available, main = known.get(LESSON_ID);
    const key = `mathExamTextbook.v1:${catalog.book.id}:${LESSON_ID}:r${main.revision}`;
    const memory = new Map(), listeners = new Set(), restoredToggles = new WeakSet();
    let app = null, mainViewer = null, dialogViewer = null, dialog = null;
    let theory = [], submitted = false, applying = false, destroyed = false, readOnly = false;
    let pending = null, notifyTimer = null, lastSent = '', lastFocus = null;

    function el(tag, text, attributes = {}) {
      const node = doc.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
      if (text !== undefined) math.appendText(node, String(text));
      return node;
    }
    function work() {
      const raw = memory.get(key);
      return raw ? JSON.parse(raw) : { draft: '', stepDrafts: {}, revealed: 0, assisted: false, checked: false };
    }
    function detailsOf(root) {
      return [...root.querySelectorAll('details')].flatMap((node, index) => node.open ? [index] : []);
    }
    function readTheory() {
      if (dialog && theory.length) {
        const frame = theory[theory.length - 1];
        frame.view = selected(dialogViewer.getState());
        frame.openDetails = detailsOf(dialog);
      }
      return clone(theory);
    }
    function getState() {
      const value = work();
      return {
        lessonId: LESSON_ID, draft: value.draft, stepDrafts: clone(value.stepDrafts),
        revealed: value.revealed, assisted: value.assisted, checked: false, submitted,
        mainView: selected(mainViewer.getState()),
        openDetails: detailsOf(host.querySelector('main')), theory: readTheory()
      };
    }
    function validateState(value) {
      try { contract.normalizeState(value); return true; } catch (_) { return false; }
    }
    function emit(kind = 'input') {
      if (applying || destroyed || readOnly) return;
      pending = pending === 'reference' || kind === 'reference' ? 'reference' :
        pending === 'hint' || kind === 'hint' ? 'hint' : kind;
      if (notifyTimer !== null) return;
      notifyTimer = win.setTimeout(() => {
        notifyTimer = null;
        if (applying || destroyed || readOnly) { pending = null; return; }
        const state = contract.normalizeState(getState()), serialized = JSON.stringify(state);
        const eventKind = pending; pending = null;
        if (serialized === lastSent) return;
        lastSent = serialized;
        for (const listener of listeners) listener({ kind: eventKind, details: {}, state: clone(state) });
      }, 0);
    }
    const storage = {
      getItem: name => memory.get(name) ?? null,
      setItem(name, value) {
        if (name !== key) throw new Error('Out-of-scope work');
        memory.set(name, String(value)); emit('input');
      }
    };
    const sceneViewer = {
      validateModel: planar.validateModel,
      mount(root, model, config) {
        const viewer = planar.mount(root, model, {
          ...config,
          onChange(value) { config.onChange?.(value); emit('model'); }
        });
        mainViewer = viewer;
        return viewer;
      }
    };
    function restoreDetails(root, indices) {
      [...root.querySelectorAll('details')].forEach((node, index) => {
        // Engine.open can already have queued a native toggle for restored help.
        // Stop that event before the engine's listeners, rather than replaying UI.
        if (node.open || node.open !== indices.includes(index)) restoredToggles.add(node);
        node.open = indices.includes(index);
      });
    }
    function destroyDialog() {
      dialogViewer?.destroy(); dialogViewer = null;
      if (dialog) {
        if (typeof dialog.close === 'function' && dialog.open) dialog.close();
        dialog.remove(); dialog = null;
      }
    }
    function scopeMain() {
      host.querySelector('main > header > button')?.remove();
      const permalink = host.querySelector('.lesson-permalink');
      if (permalink) { permalink.href = CANONICAL; permalink.target = '_blank'; permalink.rel = 'noopener'; }
      const input = host.querySelector('#final-answer');
      input.maxLength = 8000;
      const save = host.querySelector('[data-final-form] button');
      // Managed iframes intentionally omit allow-forms. Saving is a local
      // semantic action, not a form navigation, so it must not rely on submit.
      save.type = 'button'; save.dataset.manualSave = '';
      for (const button of host.querySelectorAll('button')) {
        const lesson = [...known.values()].find(item => item.kind === 'theory' && button.textContent === 'Почему? ' + item.title);
        if (lesson) button.dataset.theoryLink = lesson.id;
      }
      if (submitted) host.querySelector('[data-final-feedback]').textContent = 'Рассуждение сохранено. Его обоснованность нужно обсудить с учителем.';
    }
    function render(value) {
      destroyDialog(); app?.destroy();
      memory.clear();
      memory.set(key, JSON.stringify({
        draft: value.draft, stepDrafts: value.stepDrafts, revealed: value.revealed,
        assisted: value.assisted, checked: false, camera: camera(value.mainView)
      }));
      submitted = value.submitted; theory = clone(value.theory);
      win.history.replaceState(null, '', '#' + LESSON_ID);
      app = engine.createApp(host, { catalog, lessons, storage, sceneViewer, math });
      scopeMain(); restoreDetails(host.querySelector('main'), value.openDetails);
      if (theory.length) renderTheory();
      setReadOnly(readOnly);
    }
    function applyState(value) {
      // Validate every nested frame and clone before touching DOM, storage or hash.
      const state = contract.normalizeState(value);
      applying = true;
      win.clearTimeout(notifyTimer); notifyTimer = null; pending = null;
      try { render(state); lastSent = JSON.stringify(state); }
      finally { applying = false; }
    }
    function sourceText(source) {
      return catalog.book.edition + ' · стр. ' + source.printedPages.join(', ') +
        ' · PDF ' + source.pdfPages.join(', ') + (source.point ? ' · пункт ' + source.point : '');
    }
    function theoryButton(id) {
      if (!THEORY_IDS.includes(id)) throw new Error('Out-of-scope theory');
      return el('button', 'Почему? ' + known.get(id).title, { type: 'button', 'data-theory-link': id });
    }
    function renderTheory() {
      destroyDialog();
      const frame = theory[theory.length - 1], lesson = known.get(frame.id);
      dialog = el('dialog', undefined, { class: 'theory-dialog', 'data-theory': frame.id, 'aria-labelledby': 'theory-dialog-title' });
      const current = dialog;
      const back = el('button', theory.length > 1 ? 'Назад к объяснению' : 'Вернуться к задаче', { type: 'button', 'data-theory-back': '' });
      const close = el('button', 'Закрыть теорию', { type: 'button', 'data-theory-close': '' });
      const model = el('div', undefined, { class: 'textbook-model task-scene', 'data-theory-model': '' });
      const source = el('details'); source.append(el('summary', 'Где это в учебнике?'), el('p', sourceText(lesson.source)));
      dialog.append(back, close, el('h2', lesson.title, { id: 'theory-dialog-title' }),
        el('p', lesson.statement.text), model, el('p', lesson.statement.goal), el('p', lesson.visualization.caption), source);
      function changeView(id) {
        if (dialog !== current || applying || readOnly) return;
        dialogViewer.setView(id); emit('reference');
      }
      function help(items, parent) {
        for (const item of items) {
          const detail = el('details', undefined, { 'data-help': item.id });
          detail.append(el('summary', item.question), el('p', item.text));
          for (const id of item.theoryIds || []) detail.append(theoryButton(id));
          help(item.children || [], detail);
          detail.addEventListener('toggle', () => { if (detail.open) changeView(item.view || 'neutral'); });
          parent.append(detail);
        }
      }
      help(lesson.help, dialog);
      for (const step of lesson.steps) {
        const detail = el('details', undefined, { 'data-theory-step': step.id });
        detail.append(el('summary', step.title), el('p', step.prompt), el('p', step.explanation));
        const reasons = el('details'); reasons.append(el('summary', 'Почему этот переход верен?'));
        for (const item of step.justifications) {
          reasons.append(el('p', item.text));
          if (item.source) reasons.append(el('small', sourceText(item.source)));
          if (item.theoryId) reasons.append(theoryButton(item.theoryId));
        }
        detail.append(reasons);
        detail.addEventListener('toggle', () => { if (detail.open) changeView(step.view || 'neutral'); });
        dialog.append(detail);
      }
      host.append(dialog);
      dialogViewer = planar.mount(model, lesson.visualization.model, {
        savedCamera: camera(frame.view), maxStep: frame.view.maxStep, onChange: () => emit('reference')
      });
      restoreDetails(dialog, frame.openDetails);
      dialog.addEventListener('cancel', event => { event.preventDefault(); if (!readOnly) closeTheory(false); });
      dialog.addEventListener('keydown', event => {
        if (event.defaultPrevented) return;
        if (event.key === 'Escape') { event.preventDefault(); if (!readOnly) closeTheory(false); }
        if (event.key === 'Tab') {
          const nodes = [...dialog.querySelectorAll('button,summary,[tabindex="0"]')].filter(node => {
            if (node.disabled || node.closest('[hidden]')) return false;
            for (let parent = node.parentElement; parent !== dialog; parent = parent.parentElement) {
              if (parent.tagName === 'DETAILS' && !parent.open && !parent.querySelector(':scope > summary')?.contains(node)) return false;
            }
            return true;
          });
          if (event.shiftKey && doc.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
          else if (!event.shiftKey && doc.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
        }
      });
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.open = true;
      if (!applying) back.focus();
    }
    function openTheory(id, from) {
      const state = getState(), parent = state.theory.at(-1)?.id || LESSON_ID;
      const valid = parent === LESSON_ID ? THEORY_IDS.slice(0, 2) : parent === THEORY_IDS[0] ? THEORY_IDS.slice(2) : [];
      if (!valid.includes(id)) return;
      if (!state.theory.length) lastFocus = from?.dataset.theoryLink || null;
      state.assisted = true;
      state.theory.push({ id, view: { viewId: 'neutral', zoom: 1, maxStep: 0 }, openDetails: [] });
      // Main engine state is private. Re-seed it through its documented storage
      // option so assistance cannot cause a stale-cache conflict on the next edit.
      const previous = lastSent; applyState(state); lastSent = previous;
      dialog.querySelector('[data-theory-back]').focus(); emit('reference');
    }
    function closeTheory(back) {
      readTheory();
      if (back && theory.length > 1) { theory.pop(); renderTheory(); }
      else {
        theory = []; destroyDialog();
        if (lastFocus) [...host.querySelectorAll('[data-theory-link]')].find(node => node.dataset.theoryLink === lastFocus)?.focus();
      }
      emit('reference');
    }
    function setReadOnly(value) {
      readOnly = !!value; doc.documentElement.dataset.boardReadonly = String(readOnly);
      for (const input of host.querySelectorAll('input,textarea')) input.readOnly = readOnly;
      // Native disabled buttons would also disable model zoom controls forever
      // after handoff. The capture guard below blocks work while preserving them.
      host.setAttribute('aria-disabled', String(readOnly));
    }
    function guard(event) {
      if (readOnly && !(event.type === 'keydown' && ['Tab', 'PageUp', 'PageDown'].includes(event.key))) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    }
    function click(event) {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-manual-save')) {
        saveManual(event);
      } else if (button.dataset.theoryLink) {
        event.preventDefault(); event.stopImmediatePropagation(); openTheory(button.dataset.theoryLink, button);
      } else if (button.hasAttribute('data-theory-back') || button.hasAttribute('data-theory-close')) {
        event.preventDefault(); event.stopImmediatePropagation(); closeTheory(button.hasAttribute('data-theory-back'));
      } else if (button.closest('.textbook-help')) { win.queueMicrotask(scopeMain); emit('hint'); }
    }
    function toggle(event) {
      if (restoredToggles.has(event.target)) {
        restoredToggles.delete(event.target); event.stopImmediatePropagation(); return;
      }
      if (readOnly) return;
      emit(event.target.closest('.theory-dialog') ? 'reference' : event.target.closest('.textbook-help') ? 'hint' : 'input');
    }
    function input(event) {
      if (event.target.id === 'final-answer') {
        if (!plainDraft(event)) return;
        if (event.target.value.length > 8000) event.target.value = event.target.value.slice(0, 8000);
        submitted = false;
        const feedback = host.querySelector('[data-final-feedback]'); if (feedback) feedback.textContent = '';
      }
      emit('input');
    }
    function plainDraft(event) {
      if (!/<\/?[a-z][^>]*>/i.test(host.querySelector('#final-answer').value)) return true;
      event.preventDefault(); event.stopImmediatePropagation();
      host.querySelector('[data-final-feedback]').textContent = 'Эта запись пока не сохранена. Сохранение поддерживает обычный текст: замените фрагменты вида <...> словами или математическими символами.';
      return false;
    }
    function submit(event) {
      if (event.target.matches('[data-final-form]')) saveManual(event);
    }
    function saveManual(event) {
      if (!plainDraft(event)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const state = getState();
      state.draft = host.querySelector('#final-answer').value;
      state.submitted = true;
      state.assisted ||= state.openDetails.some(index => index >= 1);
      // Rehydrate the engine's private draft through its storage option. This
      // also handles text entered by a browser without a preceding input event.
      const previous = lastSent; applyState(state); lastSent = previous;
      host.querySelector('[data-manual-save]').focus(); emit('input');
    }
    function hash() {
      // A task iframe cannot turn into the course catalog or a different lesson.
      if (win.location.hash !== '#' + LESSON_ID) {
        win.history.replaceState(null, '', '#' + LESSON_ID);
      }
    }
    const guarded = ['pointerdown', 'click', 'dblclick', 'keydown', 'beforeinput', 'input', 'change', 'submit', 'drop', 'paste'];
    guarded.forEach(type => host.addEventListener(type, guard, true));
    host.addEventListener('click', click, true); host.addEventListener('toggle', toggle, true);
    host.addEventListener('input', input, true); host.addEventListener('submit', submit, true);
    // Register before the engine so a forged hash is normalized first.
    win.addEventListener('hashchange', hash);
    applyState(contract.fresh());
    return Object.freeze({
      getState, applyState, validateState, setReadOnly,
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      destroy() {
        destroyed = true; win.clearTimeout(notifyTimer); destroyDialog(); app?.destroy(); listeners.clear(); memory.clear();
        guarded.forEach(type => host.removeEventListener(type, guard, true));
        host.removeEventListener('click', click, true); host.removeEventListener('toggle', toggle, true);
        host.removeEventListener('input', input, true); host.removeEventListener('submit', submit, true);
        win.removeEventListener('hashchange', hash);
      }
    });
  }

  async function boot() {
    const host = global.document.getElementById('textbook-app');
    const response = await global.fetch('/geometry-course/textbook/data/course.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Cannot load the reviewed course');
    const adapter = create(host, await response.json());
    global.__atanasyanBoard = adapter;
    const managed = new URLSearchParams(global.location.search).get('learning') === '1';
    const note = global.document.querySelector('[data-work-context]');
    if (managed) {
      note.textContent = 'Задача 92а · работа в личном кабинете';
      adapter.setReadOnly(true);
      global.MathExamLearning.register({
        trainerId: 'atanasyan-7-9', contentVersion: 1,
        getState: adapter.getState, setReadOnly: adapter.setReadOnly,
        // The existing cabinet reference action only stores a reference id.
        // These dialogs are work state, so save them through its input action.
        subscribe: listener => adapter.subscribe(change => listener({ ...change,
          kind: change.kind === 'reference' ? 'input' : change.kind })),
        applyState({ taskSpec, state }) {
          const normalized = global.AtanasyanLearningContracts.normalize(taskSpec, state);
          adapter.applyState(normalized);
        }
      });
    } else {
      global.MathExamBoard.register({
        id: 'atanasyan-7-9', version: '1.0.0', stateSchemaVersion: 1,
        parentOrigin: global.location.origin, getState: adapter.getState,
        applyState: adapter.applyState, subscribe: adapter.subscribe
      });
    }
    return adapter;
  }
  const api = Object.freeze({ create, LESSON_ID, THEORY_IDS: Object.freeze(THEORY_IDS), PATH, CANONICAL });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global.document && global.location.pathname === PATH && global.document.body?.dataset.atanasyanBoard === '92a') {
    global.__atanasyanReady = boot().catch(error => {
      global.document.getElementById('textbook-app').textContent = 'Задачу не удалось открыть. Обновите страницу или вернитесь к преподавателю.';
      throw error;
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
