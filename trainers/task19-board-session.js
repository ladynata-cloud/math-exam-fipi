/* Closed semantic room state. No HTML, personal progress or credit claims. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Task19BoardSession = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const plain = value => value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const fields = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && descriptor.enumerable && own(descriptor, 'value');
  });
  function safe(value, depth = 0, seen = new Set()) {
    if (depth > 7) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return value.length <= 200 && !/[<>\u0000-\u001f]/.test(value);
    if ((!plain(value) && !Array.isArray(value)) || seen.has(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 300 || keys.length !== value.length + 1 ||
        !Array.from({ length: value.length }, (_, index) => own(value, String(index))).every(Boolean))) return false;
    seen.add(value);
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      if (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(String(key))) return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) ||
          !descriptor.enumerable || !own(descriptor, 'value') || !safe(descriptor.value, depth + 1, seen)) return false;
    }
    seen.delete(value);
    return true;
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  function create(cards, visuals, reference) {
    const byId = new Map(cards.map(card => [card.id, card]));
    const topics = new Set(cards.map(card => card.theme));
    function model(hint, value) {
      if (value === null) return null;
      if (!fields(value, ['params', 'measured']) || !plain(value.params) || typeof value.measured !== 'boolean') throw new TypeError('Invalid model');
      const restored = visuals.restoreModel(hint, value);
      const controls = visuals.controlsFor(hint.model, restored.params);
      if (!fields(value.params, controls.map(control => control.key))) throw new TypeError('Invalid model parameters');
      const params = {};
      for (const { key } of controls) {
        const raw = value.params[key], normalized = restored.params[key];
        if (typeof raw !== 'number' || Math.abs(raw - normalized) > 1e-8 * Math.max(1, Math.abs(normalized))) throw new TypeError('Invalid model range');
        params[key] = normalized;
      }
      return { params, measured: value.measured };
    }
    function validate(value) {
      if (!safe(value) || !fields(value, ['topic', 'review', 'current', 'answers', 'view']) ||
          (value.topic !== '' && !topics.has(value.topic)) || typeof value.review !== 'boolean' ||
          !Array.isArray(value.answers) || value.answers.length > cards.length ||
          !fields(value.view, ['settings', 'textbook', 'reference']) ||
          typeof value.view.settings !== 'boolean' || typeof value.view.textbook !== 'boolean' ||
          !Array.isArray(value.view.reference) || !value.view.reference.every(v => typeof v === 'boolean')) throw new TypeError('Invalid task 19 room state');
      const seen = new Set();
      for (const tuple of value.answers) {
        if (!Array.isArray(tuple) || tuple.length !== 3 || !byId.has(tuple[0]) || seen.has(tuple[0]) ||
            typeof tuple[1] !== 'boolean' || typeof tuple[2] !== 'boolean') throw new TypeError('Invalid room answer');
        seen.add(tuple[0]);
      }
      const current = value.current;
      if (current === null) {
        if (!value.review || value.view.textbook || value.view.reference.length || value.answers.some(tuple =>
          (!value.topic || byId.get(tuple[0]).theme === value.topic) && (tuple[1] !== byId.get(tuple[0]).truth || tuple[2]))) throw new TypeError('Invalid empty review');
      } else {
        if (!fields(current, ['id', 'answer', 'hintOpen', 'helpUsed', 'modelState']) || !byId.has(current.id) ||
            (current.answer !== null && typeof current.answer !== 'boolean') || typeof current.hintOpen !== 'boolean' ||
            typeof current.helpUsed !== 'boolean' || ((current.hintOpen || current.modelState !== null || value.view.textbook) && !current.helpUsed)) throw new TypeError('Invalid current assertion');
        const card = byId.get(current.id);
        if (value.topic && value.topic !== card.theme) throw new TypeError('Invalid topic');
        if (current.hintOpen && current.modelState === null) throw new TypeError('Missing model');
        model(card.hint, current.modelState);
        const count = current.modelState === null ? 0 : reference.forCard(card).length;
        if (value.view.reference.length !== (count ? count + 1 : 0)) throw new TypeError('Invalid reference disclosures');
        const answered = value.answers.find(tuple => tuple[0] === current.id);
        if (typeof current.answer === 'boolean' && (!answered || answered[1] !== current.answer || answered[2] && !current.helpUsed)) throw new TypeError('Answer history mismatch');
      }
      if (JSON.stringify(value).length > 48000) throw new TypeError('Room state too large');
      return copy(value);
    }
    return Object.freeze({ validate });
  }
  function isBoard(window) {
    if (window.parent === window) return false;
    if (new URLSearchParams(window.location.search).get('board') === '1') return true;
    try {
      return window.parent.location.origin === window.location.origin &&
        /^\/trainers\/(?:trainer-board|group-board)\.html$/.test(window.parent.location.pathname);
    } catch (_) { return false; }
  }
  return Object.freeze({ id: 'oge-task19', version: '1.0.0', create, isBoard });
});
