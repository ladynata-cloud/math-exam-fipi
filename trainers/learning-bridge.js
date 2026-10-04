/* Credential-free semantic bridge for managed learning attempts. */
(function (root) {
  'use strict';
  const PROTOCOL = 'mathexam-learning';
  const VERSION = 1;
  const params = new URLSearchParams(root.location.search);
  const managed = params.get('learning') === '1';
  const channel = params.get('channel') || '';
  const parentOrigin = params.get('parentOrigin') || '';
  const allowedParents = new Set(['https://mathexam-board-ladynata.amvera.io']);
  let parentAllowed = false;
  try {
    const url = new URL(parentOrigin);
    parentAllowed = url.origin === parentOrigin && (allowedParents.has(url.origin) ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
  } catch (_) { /* fail closed */ }
  const enabled = managed && parentAllowed && /^[A-Za-z0-9_-]{16,96}$/.test(channel) && root.parent !== root;
  const random = new Uint8Array(18);
  root.crypto.getRandomValues(random);
  const instance = Array.from(random, n => n.toString(16).padStart(2, '0')).join('');
  let adapter = null;
  let hydrated = false;
  let applying = false;
  let readOnly = true;
  let pending = null;
  let readyTimer = null;
  let notice = null;

  function clone(value, limit = 65536) {
    const json = JSON.stringify(value);
    if (typeof json !== 'string' || new TextEncoder().encode(json).length > limit) throw new Error('STATE_TOO_LARGE');
    return JSON.parse(json, (key, item) => {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('INVALID_KEY');
      if (typeof item === 'number' && !Number.isFinite(item)) throw new Error('INVALID_NUMBER');
      return item;
    });
  }

  function showNotice(message) {
    if (!document.body) return document.addEventListener('DOMContentLoaded', () => showNotice(message), { once: true });
    if (!notice) {
      notice = document.createElement('div');
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'padding:14px 18px;margin:10px;border-radius:12px;background:#fff5d6;color:#503b13;font:15px/1.5 system-ui';
      document.body.prepend(notice);
    }
    notice.textContent = message;
  }

  function post(type, payload) {
    if (!enabled) return;
    root.parent.postMessage({ protocol: PROTOCOL, version: VERSION, channel, instance, type, payload }, parentOrigin);
  }

  function announce() {
    if (adapter && !hydrated) post('ready', { trainerId: adapter.trainerId, contentVersion: adapter.contentVersion });
  }

  function setReadOnly(value) {
    readOnly = !!value;
    document.documentElement.dataset.learningReadonly = String(readOnly);
    adapter?.setReadOnly?.(readOnly);
  }

  function emit(change = {}) {
    if (!enabled || !hydrated || applying || readOnly || !adapter) return;
    const allowed = ['input', 'model', 'navigate', 'check', 'hint', 'reference', 'new-task'];
    if (!allowed.includes(change.kind)) return;
    try {
      const state = clone(change.state === undefined ? adapter.getState() : change.state);
      const details = clone(change.details || {}, 65536);
      post('change', { kind: change.kind, details, state });
    } catch (_) {
      showNotice('Изменение слишком велико для сохранения. Вернитесь в кабинет и сохраните копию работы.');
    }
  }

  async function apply(payload) {
    if (applying) { pending = payload; return; }
    applying = true;
    try {
      // Only JSON task/work enters an adapter. No executable HTML or credentials.
      const taskSpec = clone(payload.taskSpec, 131072);
      const state = clone(payload.state);
      setReadOnly(true);
      await adapter.applyState({ taskSpec, state, readOnly: !!payload.readOnly });
      hydrated = true;
      clearInterval(readyTimer);
      if (notice) notice.remove();
      notice = null;
      setReadOnly(payload.readOnly);
      post('applied', { trainerId: adapter.trainerId, height: Math.min(12000, document.documentElement.scrollHeight) });
    } catch (_) {
      setReadOnly(true);
      post('applied', { trainerId: adapter.trainerId, error: 'RESTORE_FAILED' });
      showNotice('Не удалось восстановить эту попытку. Обновите кабинет; подтверждённая работа сохранена на сервере.');
    } finally {
      applying = false;
      if (pending) { const next = pending; pending = null; apply(next); }
    }
  }

  root.addEventListener('message', event => {
    if (!enabled || !adapter || event.source !== root.parent || event.origin !== parentOrigin) return;
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL || message.version !== VERSION || message.channel !== channel ||
        message.instance !== instance || message.type !== 'hydrate' || !message.payload || typeof message.payload.readOnly !== 'boolean') return;
    apply(message.payload);
  });

  // Read-only previews can scroll and receive state, but never interact with work.
  const block = event => {
    if (!managed || (!readOnly && hydrated) || applying) return;
    if (event.type === 'keydown' && ['Tab', 'Escape', 'PageUp', 'PageDown'].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  ['pointerdown', 'click', 'dblclick', 'keydown', 'beforeinput', 'input', 'change', 'submit', 'drop', 'paste']
    .forEach(type => document.addEventListener(type, block, true));

  root.MathExamLearning = Object.freeze({
    managed,
    enabled,
    register(config) {
      if (!managed) return () => {};
      if (!enabled) {
        showNotice('Откройте эту работу из личного кабинета ученика или преподавателя.');
        return () => {};
      }
      if (adapter || !config || typeof config.trainerId !== 'string' || !Number.isInteger(config.contentVersion) ||
          typeof config.getState !== 'function' || typeof config.applyState !== 'function' || typeof config.subscribe !== 'function') {
        throw new Error('INVALID_LEARNING_ADAPTER');
      }
      adapter = config;
      setReadOnly(true);
      const unsubscribe = config.subscribe(emit);
      announce();
      readyTimer = setInterval(announce, 1500);
      return () => { clearInterval(readyTimer); if (typeof unsubscribe === 'function') unsubscribe(); adapter = null; };
    }
  });
})(window);
