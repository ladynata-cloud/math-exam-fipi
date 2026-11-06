(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(null, require('./data.js'), require('./engine.js'));
  } else {
    root.CollegeLogarithmsBoardAdapter = factory(root, root.CollegeLogarithmsData, root.CollegeLogarithmsEngine);
  }
})(typeof window !== 'undefined' ? window : null, function (root, D, E) {
  'use strict';
  const stateKeys = ['taskId', 'stage', 'drafts', 'errors', 'helpUsed', 'hintOpen', 'feedback', 'graph', 'panels'];
  const graphKeys = ['base', 'h', 'k', 'sign'];
  const panelKeys = ['theory', 'lab', 'route'];
  const feedbackCodes = ['none', 'wrong', 'invalid', 'correct', 'complete'];
  const graphBases = [0.25, 1 / 3, 0.5, 2, 3, 4, 5];
  const eventNames = ['input', 'change', 'click', 'keydown', 'toggle', 'close', 'cancel'];
  const MAX_STATE_BYTES = 64 * 1024;

  // Reject extra, inherited, symbol and accessor properties before reading values.
  // Room snapshots carry small, explicit data records; never markup or callbacks.
  function record(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return false;
    const own = Reflect.ownKeys(value);
    return own.length === keys.length && own.every(key => {
      if (typeof key !== 'string' || !keys.includes(key)) return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable;
    });
  }
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const safeDraft = value => typeof value === 'string' && value.length <= 160 && !/[<>\u0000-\u001f\u007f]/.test(value);
  function validGraph(value) {
    return record(value, graphKeys) && graphBases.includes(value.base) &&
      Number.isFinite(value.h) && Math.abs(value.h) <= 4 &&
      Number.isFinite(value.k) && Math.abs(value.k) <= 4 && (value.sign === 1 || value.sign === -1);
  }
  function bytes(text) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).length;
    return unescape(encodeURIComponent(text)).length;
  }
  function checkState(value) {
    if (!record(value, stateKeys) || typeof value.taskId !== 'string' || !/^[a-z0-9-]{1,64}$/.test(value.taskId)) return false;
    const task = D.getTask(value.taskId);
    if (!task || !integer(value.stage, 0, task.steps.length)) return false;
    const stepIds = task.steps.map(step => step.id);
    if (!record(value.drafts, stepIds) || !record(value.errors, stepIds)) return false;
    for (const step of task.steps) {
      const draft = value.drafts[step.id];
      if (!safeDraft(draft) || !integer(value.errors[step.id], 0, 100000)) return false;
      if (step.kind === 'choice' && draft !== '' && !step.options.some(option => option.value === draft)) return false;
    }
    if (typeof value.helpUsed !== 'boolean' || typeof value.hintOpen !== 'boolean' || !feedbackCodes.includes(value.feedback)) return false;
    if (!validGraph(value.graph) || !record(value.panels, panelKeys) || !panelKeys.every(key => typeof value.panels[key] === 'boolean')) return false;
    const completed = value.stage === task.steps.length;
    if ((value.hintOpen && (!value.helpUsed || completed)) || (value.panels.theory && !value.helpUsed)) return false;
    if (value.feedback === 'complete' && !completed) return false;
    if (value.feedback === 'correct' && value.stage === 0) return false;
    if (['wrong', 'invalid'].includes(value.feedback) && completed) return false;
    if (value.feedback === 'wrong' && value.errors[task.steps[value.stage].id] === 0) return false;

    // A completed step is proved by a checked answer. Trusted course data rebuilds
    // accepted summaries and plotted points; a remote sender cannot supply them.
    for (let i = 0; i < value.stage; i++) {
      const step = task.steps[i];
      if (!E.checkStep(step, value.drafts[step.id]).correct) return false;
    }
    const current = task.steps[value.stage];
    if (current && current.kind === 'transform') {
      const draft = E.parseTransform(value.drafts[current.id]);
      if (!validGraph(draft) || !graphKeys.every(key => draft[key] === value.graph[key])) return false;
    }
    if (!task.graph) {
      const original = E.graphParams(task);
      if (value.panels.lab || !graphKeys.every(key => value.graph[key] === original[key])) return false;
    } else if (!E.isAssessment(task) && !value.panels.lab && (!current || current.kind !== 'transform')) {
      // After accepting a transformation, later point questions refer to that
      // curve. Closing the lab must restore it, not the task's initial model.
      const accepted = task.steps.slice(0, value.stage).filter(step => step.kind === 'transform').at(-1);
      const baseline = accepted ? accepted.answer : E.graphParams(task);
      if (!graphKeys.every(key => value.graph[key] === baseline[key])) return false;
    }
    if (E.isAssessment(task)) {
      if (value.helpUsed || value.hintOpen || value.panels.theory || value.panels.lab) return false;
      const original = E.graphParams(task);
      if (!graphKeys.every(key => value.graph[key] === original[key])) return false;
    }
    return bytes(JSON.stringify(value)) <= MAX_STATE_BYTES;
  }
  function validateState(value) {
    try { return checkState(value); } catch (_) { return false; }
  }
  const clone = value => JSON.parse(JSON.stringify(value));

  function create(hooks, environment) {
    const host = environment || root;
    if (!host || !host.document || !host.location || typeof host.setTimeout !== 'function' ||
        !hooks || typeof hooks.read !== 'function' || typeof hooks.write !== 'function') {
      throw new TypeError('Board adapter needs a browser host and read/write hooks');
    }
    let notify = null, applying = false, pending = null, destroyed = false, bridge = null;
    function getState() {
      const state = hooks.read();
      if (!validateState(state)) throw new TypeError('Invalid local college-logarithms board state');
      return clone(state);
    }
    let last = JSON.stringify(getState());
    function applyState(value) {
      if (!validateState(value)) throw new TypeError('Invalid college-logarithms board state');
      const state = clone(value);
      applying = true;
      try {
        hooks.write(state);
        last = JSON.stringify(getState());
      } finally { applying = false; }
    }
    function changed() {
      if (destroyed || applying || pending !== null) return;
      // A Promise microtask can run between native capture and application
      // listeners. A following task reads the settled input/graph/answer state.
      pending = host.setTimeout(() => {
        pending = null;
        if (destroyed || applying) return;
        const state = hooks.read();
        if (!validateState(state)) return; // Never send a malformed local draft.
        const serialized = JSON.stringify(state);
        if (serialized === last) return;
        last = serialized;
        if (notify) notify();
      }, 0);
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (pending !== null) host.clearTimeout(pending);
      pending = null; notify = null;
      eventNames.forEach(name => host.document.removeEventListener(name, changed, true));
      if (bridge && typeof bridge.destroy === 'function') bridge.destroy();
    }
    const api = Object.freeze({ getState, applyState, validateState, changed, destroy });
    host.CollegeLogarithmsBoard = api;
    host.getBoardTrainerState = getState;
    host.applyBoardTrainerState = applyState;
    eventNames.forEach(name => host.document.addEventListener(name, changed, true));
    if (host.MathExamBoard && typeof host.MathExamBoard.register === 'function') {
      try {
        bridge = host.MathExamBoard.register({
          id: 'college-logarithms', version: '1.0.0', stateSchemaVersion: 1, parentOrigin: host.location.origin,
          getState, applyState,
          subscribe(callback) {
            notify = callback;
            return () => { if (notify === callback) notify = null; };
          }
        });
      } catch (error) { destroy(); throw error; }
    }
    return api;
  }
  return Object.freeze({ create, validateState, graphBases: Object.freeze(graphBases.slice()), MAX_STATE_BYTES });
});
