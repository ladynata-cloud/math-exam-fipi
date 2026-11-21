(function (root) {
  'use strict';
  // The wrapper is a fixed teaching selection. Loading this module on the
  // ordinary course never activates a room or reads a personal save.
  const LESSON_IDS = Object.freeze(['before-circle', 'before-radians', 'm5-coordinates', 'm6-axis', 'm6-calculation', 'm6-identities', 'm6-equations']);
  const MODES = Object.freeze(['guided', 'independent']);
  const KEY = 'mathexam.mordkovichCircle.v1';
  const MAX_SESSIONS = 16, MAX_PROGRESS_BYTES = 48 * 1024;
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const fields = (value, names) => object(value) && Reflect.ownKeys(value).length === names.length && names.every(name => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    return descriptor && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  });
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const text = (value, max = 200) => typeof value === 'string' && value.length <= max && !/<\/?[a-z][^>]*>/i.test(value);
  const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
  function safeJson(value, depth = 1, ancestors = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return text(value);
    if ((!object(value) && !Array.isArray(value)) || ancestors.has(value)) return false;
    ancestors.add(value);
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (value.length > 2000 || Object.getPrototypeOf(value) !== Array.prototype || keys.length !== value.length + 1 ||
      !Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean))) return false;
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) || !descriptor.enumerable ||
        !Object.hasOwn(descriptor, 'value') || !safeJson(descriptor.value, depth + 1, ancestors)) return false;
    }
    ancestors.delete(value);
    return true;
  }
  function create(allLessons) {
    const lessons = allLessons.filter(lesson => LESSON_IDS.includes(lesson.id));
    const known = new Map(lessons.map(lesson => [lesson.id, lesson]));
    if (known.size !== LESSON_IDS.length) throw new Error('Incomplete Circle board selection');
    const tasks = new Map(lessons.flatMap(lesson => lesson.tasks.map(task => [task.id, { task, lesson }])));
    const books = new Set([...tasks.values()].map(({ task }) => task.book).filter(book => /^\d/.test(book)));
    const checker = root.MordCheck;
    const memory = new Map();
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
    function validRoute(hash) {
      if (['#home', '#progress', '#sources'].includes(hash)) return true;
      let match = /^#lesson\/([a-z0-9-]+)(?:\/([a-z0-9-]+)\/(guided|independent))?$/.exec(hash || '');
      if (match) return known.has(match[1]) && (!match[2] || tasks.get(match[2])?.lesson.id === match[1]);
      match = /^#task\/([a-z0-9-]+)\/(guided|independent)$/.exec(hash || '');
      if (match) return tasks.has(match[1]);
      match = /^#number\/(\d+\.\d+)$/.exec(hash || '');
      return !!match && books.has(match[1]);
    }
    function activeKey(route) {
      const [page, id, mode, extra] = route.slice(1).split('/');
      return page === 'task' ? id + ':' + mode : page === 'lesson' && mode ? mode + ':' + extra : null;
    }
    function question(task, mode, step) {
      return mode === 'guided' && step < task.steps.length ? task.steps[step] : { fields: task.fields };
    }
    function draftValid(draft, list, complete = false) {
      if (!object(draft)) return false;
      const allowed = list.flatMap(field => field.kind === 'multi' ? [field.id, field.id + 'None'] : [field.id]);
      if (!Object.keys(draft).every(key => allowed.includes(key))) return false;
      for (const field of list) {
        const answer = draft[field.id];
        if (answer === undefined) { if (complete) return false; else continue; }
        if (['number', 'point', 'choice'].includes(field.kind)) {
          if (!text(answer)) return false;
          if (field.kind === 'point' && answer !== '' && (!Number.isFinite(Number(answer)) || Math.abs(Number(answer)) > 1000 * Math.PI)) return false;
          if (field.kind === 'choice' && answer !== '' && !field.options.some(option => option.value === answer)) return false;
        } else if (!Array.isArray(answer) || answer.length > field.options.length || new Set(answer).size !== answer.length ||
          !answer.every(value => field.options.some(option => option.value === value))) return false;
        if (field.kind === 'multi' && Object.hasOwn(draft, field.id + 'None') &&
          (!['', 'yes'].includes(draft[field.id + 'None']) || (draft[field.id + 'None'] === 'yes' && answer.length !== 0))) return false;
        if (complete && !checker.check(field, answer)) return false;
      }
      return true;
    }
    function sessionValid(key, session) {
      if (!fields(session, ['taskId', 'mode', 'step', 'draft', 'solved', 'done', 'assisted', 'wrong', 'familiar', 'angle', 'started', 'registered', 'updatedAt', 'answers'])) return false;
      const [id, mode, extra] = key.split(':'), task = tasks.get(id)?.task;
      if (extra !== undefined || !task || !MODES.includes(mode) || session.taskId !== id || session.mode !== mode ||
        !integer(session.step, 0, mode === 'guided' ? task.steps.length : 0) ||
        !['solved', 'done', 'assisted', 'wrong', 'familiar', 'registered'].every(flag => typeof session[flag] === 'boolean') ||
        !Number.isFinite(session.angle) || Math.abs(session.angle) > 1000 * Math.PI ||
        !integer(session.updatedAt, 0, Number.MAX_SAFE_INTEGER) ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(session.started) || !Number.isFinite(Date.parse(session.started)) ||
        new Date(session.started).toISOString() !== session.started || (mode === 'guided' && !session.assisted)) return false;
      const total = mode === 'guided' ? task.steps.length + 1 : 1;
      if (!Array.isArray(session.answers) || session.answers.length !== session.step + Number(session.solved) ||
        session.done !== session.registered || (session.done && (!session.solved || session.step !== total - 1)) ||
        !draftValid(session.draft, question(task, mode, session.step).fields, session.solved)) return false;
      if (!session.answers.every((answer, index) => draftValid(answer, question(task, mode, index).fields, true))) return false;
      return !session.solved || JSON.stringify(session.answers[session.step]) === JSON.stringify(session.draft);
    }
    // Completed counts survive for the complete fixed selection. Keep recent
    // attempts, including the active/return attempt, within the bridge's 64 KiB
    // message limit even after a long joint lesson with many unfinished drafts.
    function progress(data, route) {
      const ids = [...tasks.keys()], active = activeKey(route);
      const subset = source => Object.fromEntries(ids.filter(id => Object.hasOwn(source, id)).map(id => [id, clone(source[id])]));
      const sessions = Object.entries(data.sessions).filter(([key]) => tasks.has(key.split(':')[0])).sort(([a, x], [b, y]) =>
        a === active ? -1 : b === active ? 1 : y.updatedAt - x.updatedAt || a.localeCompare(b)).slice(0, MAX_SESSIONS);
      const result = { version: 1, seen: subset(data.seen), records: subset(data.records), sessions: Object.fromEntries(sessions.map(([key, session]) => [key, clone(session)])) };
      while (bytes(result) > MAX_PROGRESS_BYTES && sessions.length > 1) {
        const [key] = sessions.pop();
        delete result.sessions[key];
      }
      return result;
    }
    function context(value) {
      const [page, id, mode] = value.route.slice(1).split('/');
      const session = page === 'task' ? value.progress.sessions[id + ':' + mode] : null;
      const pair = tasks.get(id), lesson = page === 'lesson' ? known.get(id) : pair?.lesson;
      const live = page === 'task' && session && !session.done;
      return { page, id, mode, session, task: pair?.task, lesson, live,
        question: live ? question(pair.task, mode, session.step) : null,
        model: page === 'lesson' || live, config: live ? pair.task.lab || lesson.lab || { mode: 'angle' } : lesson?.lab || { mode: 'angle' } };
    }
    function validateState(value) {
      try {
        if (!safeJson(value) || bytes(value) > 64 * 1024 || !fields(value, ['route', 'progress', 'view']) || !validRoute(value.route)) return false;
        const data = value.progress, view = value.view;
        if (!fields(data, ['version', 'seen', 'records', 'sessions']) || data.version !== 1 || !object(data.seen) || !object(data.records) || !object(data.sessions) ||
          Object.keys(data.sessions).length > MAX_SESSIONS || bytes(data) > MAX_PROGRESS_BYTES) return false;
        if (!Object.entries(data.seen).every(([id, count]) => tasks.has(id) && integer(count, 1, 100000))) return false;
        for (const [id, record] of Object.entries(data.records)) {
          if (!tasks.has(id) || !data.seen[id] || !fields(record, ['guided', 'independent', 'practised']) ||
            !Object.values(record).every(flag => typeof flag === 'boolean') || ((record.guided || record.independent) && !record.practised)) return false;
        }
        for (const [key, session] of Object.entries(data.sessions)) {
          if (!sessionValid(key, session) || !data.seen[session.taskId] || (session.familiar && data.seen[session.taskId] < 2)) return false;
          if (session.done && (!data.records[session.taskId]?.practised || (session.mode === 'guided' && !data.records[session.taskId].guided))) return false;
        }
        const key = activeKey(value.route);
        if (key && !data.sessions[key]) return false;
        if (!fields(view, ['hintOpen', 'feedback', 'feedbackField', 'solutionOpen', 'model', 'jumpDraft', 'jumpError']) ||
          !['hintOpen', 'solutionOpen', 'jumpError'].every(flag => typeof view[flag] === 'boolean') ||
          !['none', 'empty', 'format', 'wrong', 'right'].includes(view.feedback) || !text(view.jumpDraft, 24)) return false;
        const c = context(value);
        if (!c.live && (view.hintOpen || view.feedback !== 'none' || view.feedbackField !== null)) return false;
        if (c.live) {
          if ((view.feedback === 'right') !== c.session.solved || (view.hintOpen && !c.session.assisted) || (view.feedback === 'wrong' && !c.session.wrong)) return false;
          const field = c.question.fields.find(field => field.id === view.feedbackField);
          if (['wrong', 'format'].includes(view.feedback) ? !field || (view.feedback === 'format' && field.kind !== 'number') : view.feedbackField !== null) return false;
        }
        if (view.solutionOpen && (c.page !== 'task' || !c.session.done)) return false;
        if (!['home', 'number'].includes(c.page) && (view.jumpDraft !== '' || view.jumpError)) return false;
        if (c.model) {
          if (!root.MordLab.validateBoardState(view.model, { practice: !!c.live, config: c.config }) ||
            (c.live && (view.model.angle !== c.session.angle || (view.model.revealed && !c.session.assisted)))) return false;
        } else if (view.model !== null) return false;
        return true;
      } catch (_) { return false; }
    }
    function replace(value) {
      if (!validateState(value)) throw new TypeError('Invalid Circle board state');
      memory.clear();
      storage.setItem(KEY, JSON.stringify(value.progress));
    }
    function scopeLinks(container) {
      const canonical = new URL('/ege-profil/circle/index.html', root.location.origin);
      for (const link of container.querySelectorAll('a[href]')) {
        const href = link.getAttribute('href');
        if (href.startsWith('#') && (validRoute(href) || ['#main', '#practice'].includes(href))) continue;
        const url = new URL(href, canonical);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        link.href = url.href; link.target = '_blank'; link.rel = 'noopener';
      }
    }
    return { storage, progress, validRoute, validateState, replace, scopeLinks };
  }
  const api = Object.freeze({ id: 'ege-profile-circle', marker: 'circle', path: '/trainers/ege-profile-circle.html', debugKey: '__profileCircleBoard', defaultRoute: '#home', LESSON_IDS, create });
  root.CircleBoard = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
