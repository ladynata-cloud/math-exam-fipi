(function (root) {
  'use strict';
  const MAX_BYTES = 64 * 1024;
  const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
  const STATE_KEYS = ['version', 'view', 'attempt', 'feedback', 'panels'];
  const ATTEMPT_KEYS = ['taskId', 'mode', 'answers', 'solved', 'mistakes', 'hints', 'shown', 'notes', 'updated', 'plotPoints'];
  const PANEL_KEYS = ['theory', 'notes', 'plot', 'mobileLessons'];
  const clone = value => JSON.parse(JSON.stringify(value));

  // Reject accessors before reading values; only dense, bounded plain JSON is
  // accepted. The SDK repeats its transport checks on the resulting snapshot.
  function safeJSON(value, depth = 0, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return value.length <= 10000 && !/<\/?[a-z][^>]*>/i.test(value);
    if (typeof value !== 'object' || seen.has(value)) return false;
    const proto = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return false;
    const keys = Reflect.ownKeys(value);
    if (keys.some(key => typeof key !== 'string' || FORBIDDEN.has(key))) return false;
    if (Array.isArray(value)) {
      if (value.length > 2000 || keys.length !== value.length + 1 || !keys.includes('length')) return false;
      for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) return false;
    }
    seen.add(value);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') ||
          (key !== 'length' && !descriptor.enumerable) ||
          !safeJSON(descriptor.value, depth + 1, seen)) { seen.delete(value); return false; }
    }
    seen.delete(value);
    return true;
  }

  function exact(value, keys) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  }

  function bytes(value) {
    const text = JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
    // encodeURIComponent throws for unpaired surrogates; JSON.stringify has
    // already escaped those, so this also works in older browser DOM fixtures.
    return encodeURIComponent(text).replace(/%[0-9A-F]{2}|./g, 'x').length;
  }

  function createValidator(data, core, plot) {
    const routes = new Map(data.routes.map(route => [route.id, route]));
    const lessons = new Map(data.lessons.map(lesson => [lesson.id, lesson]));
    const tasks = new Map(data.lessons.flatMap(lesson => lesson.tasks.map(task => [task.id, { lesson, task }])));
    return function validateState(state) {
      try {
        if (!safeJSON(state) || !exact(state, STATE_KEYS) || state.version !== 1 || bytes(state) > MAX_BYTES) return false;
        const view = state.view, panels = state.panels;
        if (!exact(panels, PANEL_KEYS) || PANEL_KEYS.some(key => typeof panels[key] !== 'boolean')) return false;
        if (view?.view === 'home') {
          return exact(view, ['view']) && state.attempt === null && state.feedback === null && !PANEL_KEYS.some(key => panels[key]);
        }
        const route = routes.get(view?.route);
        if (!route) return false;
        if (view.view === 'route') {
          return exact(view, ['view', 'route']) && state.attempt === null && state.feedback === null && !PANEL_KEYS.some(key => panels[key]);
        }
        if (view.view !== 'lesson' || !exact(view, ['view', 'route', 'lesson', 'task', 'mode']) || !['learn', 'solo'].includes(view.mode)) return false;
        const lesson = lessons.get(view.lesson), entry = tasks.get(view.task);
        if (!lesson || !entry || entry.lesson !== lesson || !lesson.routes.includes(view.route) ||
            (route.lessonIds && !route.lessonIds.includes(view.lesson))) return false;
        const task = entry.task, attempt = state.attempt;
        if (!exact(attempt, ATTEMPT_KEYS) || !core.validate(attempt, task, view.mode) || !Number.isSafeInteger(attempt.updated)) return false;
        const current = core.stage(attempt, task), done = core.done(attempt, task);
        for (let i = 0; i < task.steps.length; i++) {
          const answer = attempt.answers[i], step = task.steps[i];
          if (step.answer.kind === 'choice') {
            if (answer !== '' && (!Number.isInteger(answer) || answer < 0 || answer >= step.options.length)) return false;
          } else if (typeof answer !== 'string') return false;
          if (attempt.hints[i] && attempt.mistakes[i] < 2) return false;
          if (attempt.shown[i] && (!attempt.solved[i] || !attempt.hints[i])) return false;
          // Future steps and the hidden intermediate answers in final-answer
          // practice cannot carry hidden work from another mode or task.
          const hidden = view.mode === 'solo' && !task.assessAllSteps && i < task.steps.length - 1;
          const future = !done && i > current;
          if ((hidden || future) && (answer !== '' || attempt.solved[i] || attempt.mistakes[i] || attempt.hints[i] || attempt.shown[i])) return false;
        }
        if (!Array.isArray(attempt.plotPoints) || (task.plot ? !plot.validPoints(attempt.plotPoints, task.plot) : attempt.plotPoints.length !== 0)) return false;
        if (view.mode === 'solo' && (panels.theory || panels.plot)) return false;
        if (!task.plot && panels.plot) return false;
        if (state.feedback !== null) {
          const feedback = state.feedback;
          if (!exact(feedback, ['task', 'index', 'text']) || done || feedback.task !== task.id ||
              feedback.index !== current || typeof feedback.text !== 'string' || !feedback.text || feedback.text.length > 500) return false;
        }
        return true;
      } catch (_) { return false; }
    };
  }

  function create(hooks) {
    if (typeof hooks?.read !== 'function' || typeof hooks?.write !== 'function') throw new TypeError('VPR board requires read and write hooks');
    const validateState = createValidator(root.VPR_DATA, root.VPRCore, root.VPRPlot);
    let notify = null, applying = false, bridge = null, destroyed = false;
    function canWrite() {
      if (destroyed) return false;
      if (!root.VPRBoardMode) return true;
      if (typeof root.MathExamBoard?.register !== 'function') return false;
      try {
        const doc = root.document, frame = root.frameElement;
        if (doc.body?.inert || doc.documentElement.inert) return false;
        if (frame && (frame.inert || frame.hasAttribute?.('inert') || frame.style?.pointerEvents === 'none' || frame.closest?.('[inert]'))) return false;
        // Same-origin board hosts lock their frame or its document when the
        // participant has no control. An inaccessible embedded host fails closed.
        return root.parent === root || !!frame;
      } catch (_) { return false; }
    }
    function getState() {
      const state = hooks.read();
      if (!validateState(state)) throw new TypeError('Invalid VPR board state');
      return clone(state);
    }
    function applyState(value) {
      if (!root.VPRBoardMode || destroyed || !validateState(value)) throw new TypeError('Invalid VPR board state');
      applying = true;
      try { hooks.write(clone(value)); } finally { applying = false; }
    }
    const api = {
      getState, applyState, validateState, canWrite,
      changed() { if (!destroyed && !applying && canWrite() && notify) notify(); },
      destroy() { destroyed = true; notify = null; bridge?.destroy(); }
    };
    root.getBoardTrainerState = getState;
    root.applyBoardTrainerState = applyState;
    root.VPRBoard = api;
    if (root.VPRBoardMode && root.MathExamBoard) {
      bridge = root.MathExamBoard.register({
        id: 'vpr-math', version: '1.0.0', stateSchemaVersion: 1, parentOrigin: root.location.origin,
        getState, applyState,
        subscribe(fn) { notify = fn; return () => { if (notify === fn) notify = null; }; }
      });
    }
    return api;
  }

  root.VPRBoardAdapter = Object.freeze({ create, createValidator });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.VPRBoardAdapter;
})(typeof window !== 'undefined' ? window : globalThis);
