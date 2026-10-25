/* A bounded projection of the current task-first course for the classic board.
   No personal store is read, written, imported or credited. */
(function (root) {
  'use strict';
  const LESSONS = Object.freeze({
    11: Object.freeze(['box', 'practice-displacement', 'practice-pour', 'practice-joined-surface', 'practice-faces']),
    13: Object.freeze(['roundbody', 'pyramid', 'scale', 'practice-cone-area', 'practice-pyramid-lateral', 'practice-box-diagonal', 'practice-similar-volume'])
  });
  const MAX_SEED = 999999;
  const copy = value => JSON.parse(JSON.stringify(value));
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const fields = (value, names) => object(value) && Reflect.ownKeys(value).length === names.length && names.every(name => own(value, name));
  const integer = (value, lo, hi) => Number.isSafeInteger(value) && value >= lo && value <= hi;
  const text = (value, max) => typeof value === 'string' && value.length <= max && !/<\/?[a-z][^>]*>/i.test(value);
  function safe(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return text(value, 4000);
    if ((!object(value) && !Array.isArray(value)) || seen.has(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 30 || keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, i) => own(value, i)).every(Boolean))) return false;
    seen.add(value);
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const prop = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key) || !prop.enumerable || !own(prop, 'value') || !safe(prop.value, depth + 1, seen)) return false;
    }
    seen.delete(value); return true;
  }
  function routeValid(route, position) {
    return route === '#map' || LESSONS[position]?.some(id => route === '#lesson=' + id) === true;
  }
  function fresh(seed) {
    return { seed, stage: 3, step: 0, help: false, attempted: false, done: false, independent: 0, guided: 0, note: '', draft: '', checks: [],
      taskFirst: { version: 1, seed, finalDraft: '', stepDraft: '', legacyDraft: '', feedback: '', stepFeedback: '', stepAnswers: [], feedbackKind: '', helpOpen: false, modelOpen: false, stepsOpen: false, whyOpen: false, noteOpen: false, model: null } };
  }
  function create(position, data, modelState) {
    if (!LESSONS[position] || !data?.task || !modelState?.model) throw TypeError('Incomplete base EGE board');
    function validateState(value) {
      try {
        if (!safe(value) || new TextEncoder().encode(JSON.stringify(value)).length > 56000 ||
            !fields(value, ['version', 'position', 'route', 'serial', 'work', 'optionsOpen']) || value.version !== 1 || value.position !== position ||
            !routeValid(value.route, position) || !integer(value.serial, 11, MAX_SEED) || typeof value.optionsOpen !== 'boolean') return false;
        if (value.route === '#map') return value.work === null && !value.optionsOpen;
        const work = value.work;
        if (!fields(work, ['seed', 'step', 'help', 'attempted', 'done', 'note', 'ui']) || !integer(work.seed, 11, value.serial) ||
            !text(work.note, 4000) || !['help', 'attempted', 'done'].every(key => typeof work[key] === 'boolean')) return false;
        const task = data.task(value.route.slice(8), work.seed), ui = work.ui;
        if (!integer(work.step, 0, task.steps.length) || !fields(ui, ['finalDraft', 'stepDraft', 'feedback', 'stepFeedback', 'stepAnswers', 'feedbackKind', 'helpOpen', 'modelOpen', 'stepsOpen', 'whyOpen', 'noteOpen', 'model']) ||
            !['finalDraft', 'stepDraft'].every(key => text(ui[key], 200)) || !text(ui.feedback, 2000) || !text(ui.stepFeedback, 2000) ||
            !['', 'good', 'bad'].includes(ui.feedbackKind) || !['helpOpen', 'modelOpen', 'stepsOpen', 'whyOpen', 'noteOpen'].every(key => typeof ui[key] === 'boolean') ||
            !Array.isArray(ui.stepAnswers) || ui.stepAnswers.length !== work.step || !ui.stepAnswers.every((answer, i) => text(answer, 200) && data.correct(task.steps[i], answer)) ||
            ((work.step || ui.helpOpen || ui.modelOpen || ui.stepsOpen || ui.whyOpen || ui.model !== null) && !work.help) ||
            (work.done && (!work.attempted || !data.correct(task, ui.finalDraft)))) return false;
        modelState.model(ui.model, task);
        return true;
      } catch (_) { return false; }
    }
    function pack(route, serial, lesson, optionsOpen) {
      if (route === '#map') return { version: 1, position, route, serial, work: null, optionsOpen: false };
      const u = lesson.taskFirst;
      const ui = Object.fromEntries(['finalDraft', 'stepDraft', 'feedback', 'stepFeedback', 'stepAnswers', 'feedbackKind', 'helpOpen', 'modelOpen', 'stepsOpen', 'whyOpen', 'noteOpen', 'model'].map(key => [key, u[key]]));
      return copy({ version: 1, position, route, serial, work: { seed: lesson.seed, step: lesson.step, help: lesson.help, attempted: lesson.attempted, done: lesson.done, note: lesson.note, ui }, optionsOpen });
    }
    function unpack(value) {
      if (!validateState(value)) throw TypeError('Invalid base EGE board state');
      if (!value.work) return null;
      const w = value.work, lesson = fresh(w.seed);
      Object.assign(lesson, { step: w.step, help: w.help, attempted: w.attempted, done: w.done, note: w.note, draft: w.ui.finalDraft });
      Object.assign(lesson.taskFirst, copy(w.ui));
      return lesson;
    }
    return Object.freeze({ validateState, pack, unpack });
  }
  const exported = Object.freeze({ LESSONS, routeValid, create, fresh });
  root.BazaBoard = exported;
  if (typeof module !== 'undefined') module.exports = exported;
  if (!root.document) return;
  const position = Number(root.document.body.dataset.bazaBoard);
  if (!LESSONS[position] || root.location.pathname !== '/trainers/ege-baza-' + position + '.html') return;
  const D = root.PathData, api = create(position, D, root.PathManagedState), main = root.document.getElementById('main');
  let route = routeValid(root.location.hash, position) ? root.location.hash : '#map';
  let serial = 11, lesson = route === '#map' ? null : fresh(serial), optionsOpen = false, applying = false, rendering = false, notify = () => {}, last = '';
  const getState = () => api.pack(route, serial, lesson, optionsOpen);
  function save() {
    if (lesson) {
      lesson.independent = 0; lesson.guided = 0; lesson.checks = [];
      for (const key of ['finalDraft', 'stepDraft']) lesson.taskFirst[key] = lesson.taskFirst[key].slice(0, 200);
      lesson.note = lesson.note.slice(0, 4000); lesson.draft = lesson.taskFirst.finalDraft;
      if (lesson.done && !D.correct(D.task(route.slice(8), lesson.seed), lesson.taskFirst.finalDraft)) {
        lesson.done = false; lesson.taskFirst.feedback = ''; lesson.taskFirst.feedbackKind = '';
        const feedback = main.querySelector('#feedback'); if (feedback) feedback.textContent = '';
      }

      // The common controller's answer feedback must not claim personal credit.
      if (lesson.done && lesson.taskFirst.feedbackKind === 'good') {
        lesson.taskFirst.feedback = 'Верно. Решение выполнено на общей доске.';
        const feedback = main.querySelector('#feedback'); if (feedback) feedback.textContent = lesson.taskFirst.feedback;
      }
    }
    if (applying || rendering) return;
    const snapshot = getState(), serialized = JSON.stringify(snapshot);
    if (serialized === last) return;
    if (!api.validateState(snapshot)) throw TypeError('Base EGE board produced invalid state');
    last = serialized; notify();
  }
  function updateRoute() {
    const oldURL = root.location.href;
    root.history.replaceState(null, '', route);
    if (oldURL !== root.location.href) root.dispatchEvent(new root.HashChangeEvent('hashchange', { oldURL, newURL: root.location.href }));
  }
  function navigate(next, newVariant = false) {
    if (!routeValid(next, position)) next = '#map';
    if (next === route && !newVariant) return;
    route = next; optionsOpen = false;
    if (route === '#map') lesson = null;
    else { serial = serial === MAX_SEED ? 11 : serial + 1; lesson = fresh(serial); }
    updateRoute(); render(); save();
  }
  function render() {
    rendering = true;
    try {
      if (route === '#map') {
        main.innerHTML = '<p class="eyebrow">ЕГЭ 2027 · Базовый уровень · Общая доска</p><h1>Задание №' + position + '</h1><p class="lead">Выберите тип задачи. Ответы, подсказки и работа с моделью будут общими.</p><div class="cards">' + LESSONS[position].map(id => {
          const meta = D.meta.find(item => item.id === id);
          return '<section class="card"><h2><a href="#lesson=' + id + '">' + root.PathPracticeView.math(meta.title) + '</a></h2><p>' + root.PathPracticeView.math(meta.idea) + '</p></section>';
        }).join('') + '</div>';
        return;
      }
      const id = route.slice(8), meta = D.meta.find(item => item.id === id), task = D.task(id, lesson.seed);
      root.PathTaskFirst.mount(main, { meta, task, lesson, save, seen: () => lesson.help || lesson.attempted, expose() {}, fresh: () => navigate(route, true),
        remediationId: () => '', equationPracticeLinks: () => '', fractionPracticeLink: () => '', setHash: value => navigate('#' + value) });
      main.querySelectorAll('input').forEach(el => { if (el.type !== 'range') el.maxLength = 200; });
      main.querySelector('#note').maxLength = 4000;
      const options = main.querySelector('.task-first-options'); options.open = optionsOpen;
      options.ontoggle = () => { if (!options.isConnected) return; optionsOpen = options.open; save(); };
      const report = main.querySelector('a[href="#report"]'); if (report) { report.href = '#map'; report.textContent = 'Типы этого задания'; }
      const source = main.querySelector('a[href^="../sources/"]'); if (source) { source.href = '/ege-baza/sources/index.html#p' + position; source.target = '_blank'; source.rel = 'noopener'; }
      const note = main.querySelector('.task-first-options .muted'); if (note) note.textContent = 'Авторские учебные задачи из актуального курса. Совместное решение не начисляет личный прогресс.';
      if (lesson.taskFirst.stepFeedback) main.querySelector('#stepFeedback')?.classList.add('bad');
    } finally { rendering = false; }
  }
  // Wrong-answer support in the shared lesson is already contextual in the
  // common controller. Never create a personal remedial detour from this mode.
  root.EgeRemediation = { show() {} };
  main.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]'); if (!link) return;
    event.preventDefault(); navigate(link.getAttribute('href'));
  });
  // The common task view recreates its step field after each accepted answer.
  // Delegate the bound before its input handler so both the visible value and
  // the exported snapshot use the same limit, including paste and new fields.
  function boundInput(event) {
    const field = event.target, limit = field.id === 'note' ? 4000 : ['answer', 'stepAnswer'].includes(field.id) ? 200 : null;
    if (limit === null) return;
    field.maxLength = limit;
    if (field.value.length > limit) field.value = field.value.slice(0, limit);
  }
  main.addEventListener('input', boundInput, true);
  main.addEventListener('focusin', boundInput, true);
  main.addEventListener('submit', () => {
    const message = main.querySelector('#stepFeedback');
    if (lesson && message && message.textContent !== lesson.taskFirst.stepFeedback) lesson.taskFirst.stepFeedback = message.textContent;
    save();
  });
  root.addEventListener('hashchange', () => { if (root.location.hash !== route) navigate(root.location.hash); });
  function applyState(value) {
    const restored = api.unpack(value); applying = true;
    try {
      route = value.route; serial = value.serial; lesson = restored; optionsOpen = value.optionsOpen;
      updateRoute(); render(); last = JSON.stringify(getState());
    } finally { applying = false; }
  }
  render(); last = JSON.stringify(getState());
  root.__bazaBoard = Object.freeze({ getState, applyState, validateState: api.validateState, navigate });
  root.MathExamBoard.register({ id: 'ege-baza-' + position, version: '1.0.0', stateSchemaVersion: 1, parentOrigin: root.location.origin, getState, applyState,
    subscribe(callback) { notify = callback; return () => { notify = () => {}; }; } });
})(typeof window !== 'undefined' ? window : globalThis);
