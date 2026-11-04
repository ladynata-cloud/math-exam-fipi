(function (root) {
  'use strict';
  const ID = 'merzlyak-10-base';
  const PATH = '/trainers/merzlyak-10-base.html';
  const BOOK = 'merzlyak-2022-10-base';
  // The bridge deliberately rejects HTML-looking strings. Keep the user's
  // mathematical text untouched in the form and transport only those strings
  // through a canonical, lossless JSON escape envelope.
  const PREFIX = '~mathexam-text~';
  function encodeText(value) {
    return /<\/?[a-z][^>]*>/i.test(value) || value.startsWith(PREFIX) ?
      PREFIX + JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') : value;
  }
  function decodeText(value) { return value.startsWith(PREFIX) ? JSON.parse(value.slice(PREFIX.length)) : value; }
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const fields = (value, names) => object(value) && Reflect.ownKeys(value).length === names.length && names.every(name => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    return descriptor && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  });
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const text = (value, max = 2000) => typeof value === 'string' && value.length <= max && !/<\/?[a-z][^>]*>/i.test(value);
  function json(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return text(value, 12020);
    if ((!object(value) && !Array.isArray(value)) || seen.has(value)) return false;
    seen.add(value);
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (value.length > 2000 || Object.getPrototypeOf(value) !== Array.prototype || keys.length !== value.length + 1 || !Array.from({ length:value.length },(_,i)=>Object.hasOwn(value,i)).every(Boolean))) return false;
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const d = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) || !d.enumerable || !Object.hasOwn(d, 'value') || !json(d.value, depth + 1, seen)) return false;
    }
    seen.delete(value); return true;
  }
  const helpCount = items => items.reduce((sum, item) => sum + 1 + helpCount(item.children || []), 0);
  function create(bundle) {
    if (bundle.catalog.book.id !== BOOK) throw new TypeError('Unexpected board textbook');
    const lessons = root.StereoTextbook.inspectBundle(bundle.catalog, bundle.lessons, bundle).available;
    const memory = new Map();
    let api = null, registration = null, notify = () => {}, timer = null;
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
    const clearStorage = () => memory.clear();
    function camera(value, lesson) {
      if (!fields(value, ['yaw', 'pitch']) || !Number.isFinite(value.yaw) || !Number.isFinite(value.pitch)) return false;
      return lesson.visualization.model.planar ? value.yaw === 0 && value.pitch === -Math.PI / 2 :
        Math.abs(value.yaw) < 2 * Math.PI && Math.abs(value.pitch) <= Math.PI / 2 - .03;
    }
    function opened(value, count) {
      return Array.isArray(value) && value.length <= count && new Set(value).size === value.length && value.every((n, i) => integer(n, 0, count - 1) && (!i || value[i - 1] < n));
    }
    function theory(value) {
      const lesson = lessons.get(value?.id);
      return lesson?.kind === 'theory' && fields(value, ['id', 'camera', 'view', 'opened', 'announcement']) && camera(value.camera, lesson) &&
        Object.hasOwn(lesson.visualization.model.views, value.view) && ['none', 'rotate', 'reset'].includes(value.announcement) &&
        opened(value.opened, 1 + helpCount(lesson.help) + lesson.steps.length * 2);
    }
    function draft(value, max=2000) {
      if (!text(value, max*6+20)) return false;
      const decoded=decodeText(value);
      return typeof decoded==='string' && decoded.length<=max && encodeText(decoded)===value;
    }
    function readyCount(catalog) {
      const names={main:'Основные задачи',ege:'ЕГЭ в учебнике',practical:'Практические задачи',research:'Исследования',selfcheck:'Вопросы для самопроверки',theory:'Теория',example:'Разобранные примеры'};
      const q=decodeText(catalog.search).trim().toLocaleLowerCase('ru').replace(/ё/g,'е'),number=q.match(/^(?:№\s*)?(\d+(?:\.\d+)?)$/)?.[1];
      return [...lessons.values()].filter(entry=>{
        const s=entry.source;
        if(catalog.kind&&entry.kind!==catalog.kind||catalog.collection&&s.collection!==catalog.collection||catalog.chapter&&s.chapter!==catalog.chapter)return false;
        if(!q)return true;if(number)return (entry.kind==='theory'?s.point:s.exercise)===number;
        return [entry.title,s.exercise,s.point,s.subpart,s.chapter,names[s.collection],s.examTask?'ЕГЭ '+s.examTask:''].filter(Boolean).join(' ').toLocaleLowerCase('ru').replace(/ё/g,'е').includes(q);
      }).length;
    }
    function validateState(value) {
      try {
        if (!json(value) || new TextEncoder().encode(JSON.stringify(value)).length > 64 * 1024 ||
            !fields(value, ['version', 'bookId', 'lessonId', 'work', 'catalog', 'view']) || value.version !== 1 || value.bookId !== BOOK) return false;
        const c = value.catalog;
        if (!fields(c, ['search', 'kind', 'collection', 'chapter', 'readyPage', 'pendingPage']) || !draft(c.search, 200) ||
            !['', 'exercise', 'theory'].includes(c.kind) || !['', ...new Set(bundle.catalog.entries.map(x => x.source.collection))].includes(c.collection) ||
            !['', ...new Set(bundle.catalog.entries.map(x => x.source.chapter || ''))].includes(c.chapter) ||
            !integer(c.readyPage, 0, Math.max(0,Math.ceil(readyCount(c)/24)-1)) || c.pendingPage!==0) return false;
        if (value.lessonId === null) return value.work === null && value.view === null;
        const lesson = lessons.get(value.lessonId), work = value.work, view = value.view;
        if (!lesson || !fields(work, ['draft', 'stepDrafts', 'revealed', 'assisted', 'checked', 'camera']) ||
            !draft(work.draft) || !object(work.stepDrafts) || !integer(work.revealed, 0, lesson.steps.length) ||
            !['assisted', 'checked'].every(key => typeof work[key] === 'boolean') || !camera(work.camera, lesson) ||
            (work.revealed > 0 && !work.assisted)) return false;
        const steps = new Map(lesson.steps.map(step => [step.id, step]));
        if (!Object.entries(work.stepDrafts).every(([id, value]) => steps.get(id)?.input && draft(value))) return false;
        if (!fields(view, ['model', 'opened', 'feedback', 'theory']) || !fields(view.model, ['camera', 'view', 'announcement']) ||
            !camera(view.model.camera, lesson) || work.camera.yaw!==view.model.camera.yaw || work.camera.pitch!==view.model.camera.pitch ||
            !Object.hasOwn(lesson.visualization.model.views, view.model.view) || !['none', 'rotate', 'reset'].includes(view.model.announcement) ||
            !opened(view.opened, 2 + helpCount(lesson.help) + work.revealed * 2) ||
            !fields(view.feedback, ['final', 'steps']) || !['none', 'manual', 'already', 'assisted', 'independent', 'wrong'].includes(view.feedback.final) ||
            !object(view.feedback.steps) || !Object.entries(view.feedback.steps).every(([id, status]) =>
              lesson.steps.slice(0, work.revealed).some(step => step.id === id && step.input) && ['none', 'correct', 'wrong'].includes(status))) return false;
        if ((!lesson.answer && view.feedback.final !== 'none') || (lesson.answer?.mode !== 'manual' && view.feedback.final === 'manual') ||
            (lesson.answer?.mode === 'manual' && !['none', 'manual'].includes(view.feedback.final))) return false;
        if (!fields(view.theory, ['active', 'trail']) || !Array.isArray(view.theory.trail) || view.theory.trail.length > 8 ||
            (view.theory.active === null ? view.theory.trail.length !== 0 : !theory(view.theory.active)) || !view.theory.trail.every(theory)) return false;
        return true;
      } catch (_) { return false; }
    }
    function attach(value) { api = value; }
    function schedule(event) {
      if (!api || (api.isApplying() && event?.type === 'toggle')) return;
      // Native disclosure toggles settle asynchronously after a remote render.
      // A real input/click arriving meanwhile must be published after that
      // settlement; it must not disappear along with the suppressed toggles.
      clearTimeout(timer);
      const publish = () => {
        if (api.isApplying()) { timer = setTimeout(publish, 0); return; }
        notify();
      };
      timer = setTimeout(publish, 0);
    }
    function start() {
      if (!api) throw new Error('Textbook board hooks are unavailable');
      const debug = Object.freeze({ getState: api.getState, applyState: api.applyState, validateState, isApplying: api.isApplying });
      root.__merzlyakBoard = debug;
      registration = root.MathExamBoard.register({ id: ID, version: '1.0.0', stateSchemaVersion: 1, parentOrigin: root.location.origin,
        getState() { const value = api.getState(); if (!validateState(value)) throw new TypeError('Invalid textbook board state'); return value; },
        applyState: api.applyState,
        subscribe(callback) {
          notify = callback;
          const events = ['click', 'input', 'change', 'submit', 'toggle', 'keydown', 'pointermove', 'pointerup'];
          events.forEach(name => root.document.addEventListener(name, schedule, true));
          return () => { clearTimeout(timer); events.forEach(name => root.document.removeEventListener(name, schedule, true)); notify = () => {}; };
        }
      });
      return debug;
    }
    return { storage, clearStorage, validateState, encodeText, decodeText, attach, start, destroy() { clearTimeout(timer); registration?.destroy(); memory.clear(); } };
  }
  function boot(bundle, element) {
    if (root.location.pathname !== PATH || root.document.body.dataset.merzlyakBoard !== 'true') throw new Error('Board wrapper required');
    const session = create(bundle);
    const app = root.StereoTextbook.createApp(element, { ...bundle, storage: session.storage, boardSession: session });
    session.start(); return { app, session };
  }
  root.MerzlyakBoard = Object.freeze({ id: ID, path: PATH, create, boot });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MerzlyakBoard;
})(globalThis);
