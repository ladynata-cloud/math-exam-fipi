(function (root) {
  'use strict';
  const ID = 'sections-from-zero';
  const PATH = '/trainers/sections-from-zero.html';
  const PREFIX = '~mathexam-text~';
  const WORK_FIELDS = ['mode', 'revealed', 'viewCount', 'approved', 'questionApproved', 'questionAttempts', 'planeAttempts',
    'calculationRevealed', 'calculationSeen', 'helpUsed', 'workedSeen', 'resultSeen', 'theoryOpen', 'notesOpen', 'justBuilt',
    'showResult', 'draft', 'draftOpen', 'glossaryOpen', 'answer', 'answerChecked', 'correctAnswer', 'answerInvalid',
    'selectedCheck', 'checkCorrect', 'proofChecks', 'independentSteps', 'hints', 'helpReasons', 'hintOpen',
    'showHelpers', 'cleanView', 'planeView', 'camera'];
  const BOOLEAN_FIELDS = ['calculationSeen', 'helpUsed', 'workedSeen', 'resultSeen', 'theoryOpen', 'notesOpen', 'justBuilt',
    'showResult', 'draftOpen', 'glossaryOpen', 'answerChecked', 'correctAnswer', 'answerInvalid', 'checkCorrect',
    'showHelpers', 'cleanView', 'planeView'];
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const fields = (value, names) => object(value) && Reflect.ownKeys(value).length === names.length && names.every(name => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    return descriptor && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  });
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const safeText = (value, max) => typeof value === 'string' && value.length <= max && !/<\/?[a-z][^>]*>/i.test(value);
  // The shared-board bridge rejects HTML-looking strings. A canonical escape
  // envelope preserves mathematical drafts exactly without changing that rule.
  function encodeText(value) {
    return /<\/?[a-z][^>]*>/i.test(value) || value.startsWith(PREFIX) ?
      PREFIX + JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') : value;
  }
  function decodeText(value) { return value.startsWith(PREFIX) ? JSON.parse(value.slice(PREFIX.length)) : value; }
  function draft(value, max) {
    if (!safeText(value, max * 6 + 20)) return false;
    const decoded = decodeText(value);
    return typeof decoded === 'string' && decoded.length <= max && encodeText(decoded) === value;
  }
  function json(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return safeText(value, 12020);
    if ((!object(value) && !Array.isArray(value)) || seen.has(value)) return false;
    seen.add(value);
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (value.length > 200 || Object.getPrototypeOf(value) !== Array.prototype ||
        keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean))) return false;
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) ||
          !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || !json(descriptor.value, depth + 1, seen)) return false;
    }
    seen.delete(value); return true;
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const unique = (value, max, item) => Array.isArray(value) && value.length <= max &&
    new Set(value).size === value.length && value.every(item);
  const stepKey = (key, count) => /^(0|[1-9]\d*)$/.test(key) && integer(Number(key), 0, count - 1);
  function planeEqual(model, left, right) {
    const pts = left.vertices.map(id => model.points[id]), others = right.vertices.map(id => model.points[id]);
    const sub = (a, b) => a.map((n, i) => n - b[i]);
    const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
    const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    let normal = null;
    for (let i = 1; i < pts.length - 1; i++) {
      const n = cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0])), len = Math.hypot(...n);
      if (len > 1e-10) { normal = n.map(x => x / len); break; }
    }
    if (!normal) return false;
    const scale = Math.max(1, ...pts.concat(others).map(p => Math.hypot(...sub(p, pts[0]))));
    return others.every(p => Math.abs(dot(normal, sub(p, pts[0]))) < scale * 1e-8);
  }
  function create(course) {
    if (!Array.isArray(course?.lessons) || course.lessons.length !== 186) throw new TypeError('Unexpected sections course');
    const lessons = new Map(course.lessons.map(lesson => [lesson.id, lesson]));
    const modules = new Set((course.modules || []).map(section => section.id));
    const memory = new Map();
    let api = null, registration = null, notify = () => {}, timer = null;
    const storage = Object.freeze({ getItem: key => memory.get(key) ?? null,
      setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) });
    function validateState(value) {
      try {
        if (!json(value) || new TextEncoder().encode(JSON.stringify(value)).length > 64 * 1024 ||
            !fields(value, ['version', 'courseId', 'route', 'lessonId', 'work', 'catalog', 'ui']) ||
            value.version !== 1 || value.courseId !== ID || value.route !== 'lessons') return false;
        const lesson = lessons.get(value.lessonId), w = value.work, c = value.catalog, u = value.ui;
        if (!lesson || !fields(w, WORK_FIELDS) || !BOOLEAN_FIELDS.every(key => typeof w[key] === 'boolean')) return false;
        const count = lesson.steps.length, calculations = (lesson.calculationSteps || []).length;
        if (!['choose', 'study', 'practice'].includes(w.mode) || !integer(w.revealed, 0, count) ||
            !integer(w.viewCount, 0, w.revealed) || !integer(w.calculationRevealed, 0, calculations) ||
            ![-1, ...(w.revealed < count ? [w.revealed] : [])].includes(w.approved) ||
            ![-1, ...(w.revealed < count && lesson.steps[w.revealed].question ? [w.revealed] : [])].includes(w.questionApproved) ||
            !integer(w.independentSteps, 0, w.revealed) || (w.justBuilt && !w.revealed) ||
            (w.showResult && (w.revealed !== count || w.calculationRevealed !== calculations)) ||
            (w.correctAnswer && !w.answerChecked) || (w.answerInvalid && (w.answerChecked || w.correctAnswer)) ||
            !draft(w.draft, 2000) || !draft(w.answer, 120)) return false;
        if (!fields(w.camera, ['yaw', 'pitch']) || !Number.isFinite(w.camera.yaw) || !Number.isFinite(w.camera.pitch) ||
            w.camera.yaw < -Math.PI || w.camera.yaw >= Math.PI || Math.abs(w.camera.pitch) > 1.45) return false;
        if (!Array.isArray(w.proofChecks) || w.proofChecks.length !== (lesson.proofChecklist || []).length ||
            !w.proofChecks.every(flag => typeof flag === 'boolean') ||
            !unique(w.hints, count, n => integer(n, 0, count - 1)) ||
            !Array.isArray(w.helpReasons) || w.helpReasons.length > 24 || !w.helpReasons.every(text => draft(text, 300)) ||
            !object(w.hintOpen) || !Object.entries(w.hintOpen).every(([key, flag]) => stepKey(key, count) && typeof flag === 'boolean')) return false;
        const check = lesson.check;
        if (!integer(w.selectedCheck, -1, check ? check.options.length - 1 : -1) ||
            w.checkCorrect !== !!(check && w.selectedCheck === check.correct)) return false;
        const planes = new Map();
        for (const plane of [...(lesson.model.faces || []), ...(lesson.model.planes || [])]) {
          if (plane.id) planes.set(plane.id, plane);
        }
        if (!object(w.planeAttempts) || !Object.entries(w.planeAttempts).every(([key, attempt]) => {
          if (!stepKey(key, count) || Number(key) > w.revealed || !fields(attempt, ['wrong', 'selected', 'correct'])) return false;
          const step = lesson.steps[Number(key)], target = planes.get(step.plane);
          const known = new Set([...(lesson.model.edges || []).flat(), ...(lesson.model.given || [])]);
          lesson.steps.slice(0, Number(key)).forEach(s => {
            (s.points || []).forEach(n => known.add(n));
            (s.segments || []).forEach(line => { known.add(line.a); known.add(line.b); });
          });
          const eligible = id => planes.has(id) && (!step.planeOptions || step.planeOptions.includes(id)) && planes.get(id).vertices.every(n => known.has(n));
          return eligible(attempt.selected) && typeof attempt.correct === 'boolean' &&
            attempt.correct === planeEqual(lesson.model, planes.get(attempt.selected), target) &&
            unique(attempt.wrong, planes.size, id => eligible(id) && !planeEqual(lesson.model, planes.get(id), target)) &&
            (attempt.correct || attempt.wrong.includes(attempt.selected));
        })) return false;
        if (!object(w.questionAttempts) || !Object.entries(w.questionAttempts).every(([key, attempt]) => {
          if (!stepKey(key, count) || Number(key) > w.revealed || !fields(attempt, ['wrong', 'selected', 'correct'])) return false;
          const question = lesson.steps[Number(key)].question;
          return !!question && integer(attempt.selected, 0, question.options.length - 1) &&
            attempt.correct === (attempt.selected === question.correct) &&
            unique(attempt.wrong, question.options.length - 1, n => integer(n, 0, question.options.length - 1) && n !== question.correct) &&
            (attempt.correct || attempt.wrong.includes(attempt.selected));
        })) return false;
        if ((w.approved >= 0 && !w.planeAttempts[w.approved]?.correct) ||
            (w.questionApproved >= 0 && !w.questionAttempts[w.questionApproved]?.correct)) return false;
        if (!fields(c, ['query', 'module', 'level', 'origin', 'open']) || !draft(c.query, 200) ||
            !(c.module === '' || modules.has(c.module)) || !['', 'A', 'B', 'C'].includes(c.level) ||
            !['', 'author', 'source'].includes(c.origin) || typeof c.open !== 'boolean') return false;
        if (!fields(u, ['principleOpen', 'modeOptionsOpen', 'repeatOptionsOpen', 'metadataOpen']) ||
            !Object.values(u).every(flag => typeof flag === 'boolean')) return false;
        const guidance = lesson.starter || lesson.scaffold;
        if ((u.modeOptionsOpen && (!guidance || w.mode !== 'choose')) ||
            (u.repeatOptionsOpen && (!guidance || w.mode === 'choose')) ||
            (u.metadataOpen && (!guidance || !lesson.source))) return false;
        return true;
      } catch (_) { return false; }
    }
    function attach(value) { api = value; }
    function schedule(event) {
      if (!api || (api.isApplying() && event?.type === 'toggle')) return;
      clearTimeout(timer);
      const publish = () => {
        if (api.isApplying()) { timer = setTimeout(publish, 0); return; }
        notify();
      };
      timer = setTimeout(publish, 0);
    }
    function start() {
      if (!api) throw new Error('Sections board hooks are unavailable');
      const debug = Object.freeze({ getState: api.getState, applyState: api.applyState, validateState, isApplying: api.isApplying });
      root.__sectionsBoard = debug;
      registration = root.MathExamBoard.register({ id: ID, version: '1.0.0', stateSchemaVersion: 1, parentOrigin: root.location.origin,
        getState() { const value = api.getState(); if (!validateState(value)) throw new TypeError('Invalid sections board state'); return clone(value); },
        applyState: api.applyState,
        subscribe(callback) {
          notify = callback;
          const events = ['click', 'input', 'change', 'submit', 'toggle', 'keydown', 'pointermove', 'pointerup', 'pointercancel', 'hashchange'];
          events.forEach(name => root.addEventListener(name, schedule, true));
          return () => { clearTimeout(timer); events.forEach(name => root.removeEventListener(name, schedule, true)); notify = () => {}; };
        }
      });
      return debug;
    }
    return { storage, validateState, encodeText, decodeText, attach, start,
      destroy() { clearTimeout(timer); registration?.destroy(); memory.clear(); } };
  }
  root.SectionsBoard = Object.freeze({ id: ID, path: PATH, create });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SectionsBoard;
  if (root.document?.body?.dataset.sectionsBoard === 'true') {
    if (root.location.pathname !== PATH) throw new Error('Sections board wrapper required');
    root.SECTIONS_BOARD_SESSION = create(root.COURSE);
  }
})(globalThis);
