(function (root) {
  'use strict';

  // Only the currently displayed Vilenkin 5 scene crosses the existing bridge.
  // The quality API owns semantic validation; this layer owns transport bounds,
  // shared-work attribution and the canonical registration. It has no storage.
  const ID = 'vilenkin5', PATH = '/trainers/vilenkin5.html', VERSION = '1.0.0', SCHEMA = 1;
  const MAX_BYTES = 60 * 1024, SHARED_SUCCESS = 'Верно. Совместный разбор.';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const noHtml = value => !/<\/?[a-z][^>]*>/i.test(value);
  const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
  const copy = value => JSON.parse(JSON.stringify(value));
  const stable = value => Array.isArray(value) ? value.map(stable) : plain(value) ?
    Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  const equal = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
  function routeSyntax(route) {
    if (route === '#course/vilenkin5') return true;
    if (typeof route !== 'string') return false;
    const unit = /^#v5-unit\/([1-9]\d?)$/.exec(route);
    if (unit && unit[0] === route) return Number(unit[1]) <= 53;
    const lesson = /^#lesson\/v5f-[a-z0-9]+(?:-[a-z0-9]+)*$/.exec(route);
    return !!lesson && lesson[0] === route;
  }

  // Read descriptors before values. A rejected payload cannot execute a getter
  // or an inherited JSON hook while the adapter inspects or clones it.
  function safeJson(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return value.length <= 15000 && noHtml(value);
    if ((!plain(value) && !Array.isArray(value)) || seen.has(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 2000 ||
        keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, i) => own(value, i)).every(Boolean))) return false;
    seen.add(value);
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) ||
          !descriptor.enumerable || !own(descriptor, 'value') || !safeJson(descriptor.value, depth + 1, seen)) return false;
    }
    seen.delete(value);
    return true;
  }

  function transportShape(raw) {
    return safeJson(raw) && plain(raw) && raw.version === 1 && routeSyntax(raw.route) &&
      Object.keys(raw).length === 3 && own(raw, 'scene') && (raw.scene === null || plain(raw.scene)) && bytes(raw) <= MAX_BYTES;
  }

  function create(quality) {
    if (!quality || !['getState', 'validateState', 'applyState', 'subscribe'].every(key => typeof quality[key] === 'function'))
      throw new TypeError('The Vilenkin 5 scene API is required');
    let applying = false;

    function pack(raw) {
      if (!transportShape(raw)) throw new TypeError('Unsafe or oversized Vilenkin 5 scene');
      const normalized = quality.validateState(copy(raw));
      if (!transportShape(normalized)) throw new TypeError('Invalid Vilenkin 5 normalized scene');
      const value = copy(normalized);
      if (value.scene) {
        value.scene.assisted = true;
        if (value.scene.firstAttempt) value.scene.firstAttempt.assisted = true;
        if (value.scene.correct && value.scene.mode !== 'learn') value.scene.message = SHARED_SUCCESS;
      }
      if (!transportShape(value)) throw new TypeError('Invalid Vilenkin 5 shared scene');
      return value;
    }

    function validateState(raw) {
      try { return transportShape(raw) && equal(raw, pack(raw)); }
      catch (_) { return false; }
    }
    const getState = () => pack(quality.getState());
    function unpack(raw) {
      if (!validateState(raw)) throw new TypeError('Invalid Vilenkin 5 shared scene');
      return copy(raw);
    }
    function applyState(raw) {
      const value = unpack(raw);
      applying = true;
      try { quality.applyState(value); }
      finally { applying = false; }
    }
    function subscribe(callback) {
      if (typeof callback !== 'function') throw new TypeError('A scene listener is required');
      return quality.subscribe(() => { if (!applying) callback(); });
    }
    return Object.freeze({ pack, unpack, getState, applyState, validateState, subscribe });
  }

  function connect(windowObject) {
    const body = windowObject.document?.body;
    if (!body?.hasAttribute('data-vilenkin5-board')) return null;
    if (windowObject.location.pathname !== PATH || !windowObject.MathExamBoard || windowObject.Vilenkin5Quality?.memoryOnly !== true)
      throw new Error('The shared Vilenkin 5 course requires its registered wrapper');
    if (windowObject.__vilenkin5Board) return windowObject.__vilenkin5Board;
    const session = create(windowObject.Vilenkin5Quality);
    // Validate once before registering so a missing or incomplete quality API
    // cannot appear as a healthy mirrored trainer.
    session.getState();
    windowObject.__vilenkin5Board = session;
    windowObject.MathExamBoard.register({ id: ID, version: VERSION, stateSchemaVersion: SCHEMA,
      parentOrigin: windowObject.location.origin, getState: session.getState,
      applyState: session.applyState, subscribe: session.subscribe });
    return session;
  }

  const api = Object.freeze({ id: ID, path: PATH, marker: 'data-vilenkin5-board', version: VERSION,
    stateSchemaVersion: SCHEMA, maxBytes: MAX_BYTES, sharedSuccess: SHARED_SUCCESS, create, connect });
  root.Vilenkin5Board = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => connect(root), { once: true });
  else connect(root);
})(typeof window !== 'undefined' ? window : globalThis);
