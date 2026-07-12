(function (global) {
  'use strict';

  const PROTOCOL_VERSION = 1;
  const DEFAULT_HYDRATION_TIMEOUT_MS = 10000;
  const MAX_STATE_BYTES = 64 * 1024;
  const MAX_STATE_DEPTH = 8;
  const MAX_ARRAY_LENGTH = 2000;
  const VERSION_STATE_KEYS = new Set([
    'protocolVersion',
    'trainerVersion',
    'stateSchemaVersion'
  ]);
  const MESSAGE_TYPES = new Set([
    'mathexam:hydrate',
    'mathexam:request-trainer-state',
    'mathexam:apply-trainer-state'
  ]);
  let activeRegistration = null;

  function utf8Size(value) {
    if (typeof TextEncoder === 'function') {
      return new TextEncoder().encode(value).length;
    }
    return unescape(encodeURIComponent(value)).length;
  }

  function looksLikeHtml(value) {
    return /<\/?[a-z][^>]*>/i.test(value);
  }

  function validateState(state, options) {
    const allowHtml = options && options.allowHtml === true;
    const seen = new Set();

    function visit(value, depth, key) {
      if (depth > MAX_STATE_DEPTH) return 'state-too-deep';
      if (value === null) return '';
      const type = typeof value;
      if (type === 'string') {
        return !allowHtml && looksLikeHtml(value) ? 'state-html-not-allowed' : '';
      }
      if (type === 'number') return Number.isFinite(value) ? '' : 'state-number-invalid';
      if (type === 'boolean') return '';
      if (type !== 'object') return 'state-value-not-json-safe';
      if (seen.has(value)) return 'state-cycle';
      seen.add(value);
      if (Array.isArray(value)) {
        if (value.length > MAX_ARRAY_LENGTH) return 'state-array-too-large';
        for (let index = 0; index < value.length; index += 1) {
          const error = visit(value[index], depth + 1, String(index));
          if (error) return error;
        }
        seen.delete(value);
        return '';
      }
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) return 'state-object-invalid';
      for (const entry of Object.keys(value)) {
        if (entry === '__proto__' || entry === 'prototype' || entry === 'constructor') {
          return 'state-key-invalid';
        }
        if (depth === 1 && VERSION_STATE_KEYS.has(entry)) return 'state-version-in-body';
        if (!allowHtml && /html$/i.test(entry)) return 'state-html-not-allowed';
        const error = visit(value[entry], depth + 1, entry);
        if (error) return error;
      }
      seen.delete(value);
      return '';
    }

    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return { ok: false, code: 'state-object-required' };
    }
    const code = visit(state, 1, 'state');
    if (code) return { ok: false, code };
    try {
      const serialized = JSON.stringify(state);
      if (utf8Size(serialized) > MAX_STATE_BYTES) {
        return { ok: false, code: 'state-too-large' };
      }
      return { ok: true, serialized };
    } catch (_error) {
      return { ok: false, code: 'state-serialize-failed' };
    }
  }

  function createInstanceId() {
    try {
      if (global.crypto && typeof global.crypto.randomUUID === 'function') {
        return global.crypto.randomUUID();
      }
      if (global.crypto && typeof global.crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        global.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }
    } catch (_error) {
      // Fall through to a non-cryptographic identity used only for message correlation.
    }
    return `bridge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function inertHandle() {
    return Object.freeze({
      notifyStateChanged() {},
      isApplyingRemoteState() { return false; },
      destroy() {}
    });
  }

  function requireCoreConfig(config) {
    if (!config || typeof config !== 'object') throw new TypeError('Bridge config is required');
    if (typeof config.id !== 'string' || !config.id.trim()) throw new TypeError('Bridge id is required');
    if (typeof config.version !== 'string' || !config.version.trim()) throw new TypeError('Bridge version is required');
    if (!Number.isInteger(config.stateSchemaVersion) || config.stateSchemaVersion < 1) {
      throw new TypeError('Bridge stateSchemaVersion must be a positive integer');
    }
    if (typeof config.getState !== 'function') throw new TypeError('Bridge getState is required');
    if (typeof config.applyState !== 'function') throw new TypeError('Bridge applyState is required');
    if (config.subscribe !== undefined && typeof config.subscribe !== 'function') {
      throw new TypeError('Bridge subscribe must be a function');
    }
    if (typeof config.parentOrigin !== 'string' || !config.parentOrigin.trim() || config.parentOrigin === '*') {
      throw new TypeError('Bridge parentOrigin must be an exact trusted origin');
    }
  }

  function requireConfig(config) {
    requireCoreConfig(config);
    let parentOrigin;
    try {
      parentOrigin = new URL(config.parentOrigin).origin;
    } catch (_error) {
      throw new TypeError('Bridge parentOrigin is invalid');
    }
    if (parentOrigin === 'null' || parentOrigin !== config.parentOrigin.trim()) {
      throw new TypeError('Bridge parentOrigin must contain only the origin');
    }
    return {
      id: config.id.trim(),
      version: config.version.trim(),
      stateSchemaVersion: config.stateSchemaVersion,
      parentOrigin,
      getState: config.getState,
      applyState: config.applyState,
      subscribe: config.subscribe,
      hydrationTimeoutMs: Number.isFinite(Number(config.hydrationTimeoutMs))
        ? Math.max(1, Number(config.hydrationTimeoutMs))
        : DEFAULT_HYDRATION_TIMEOUT_MS
    };
  }

  function register(input) {
    if (!global.parent || global.parent === global) {
      requireCoreConfig(input);
      return inertHandle();
    }
    if (input && typeof input.parentOrigin === 'string' && input.parentOrigin.trim() === 'null') {
      requireCoreConfig(input);
      return inertHandle();
    }
    const config = requireConfig(input);
    if (activeRegistration && !activeRegistration.destroyed) {
      throw new Error('A trainer bridge is already registered');
    }

    const registration = {
      config,
      bridgeInstanceId: createInstanceId(),
      hydrated: false,
      timedOut: false,
      applyingRemoteState: false,
      destroyed: false,
      hydrationTimer: null,
      notifyTimer: null,
      subscribeCleanup: null,
      lastSerializedState: null,
      listener: null
    };
    activeRegistration = registration;

    function envelope(type, extra) {
      return Object.assign({
        type,
        protocolVersion: PROTOCOL_VERSION,
        trainerId: config.id,
        trainerVersion: config.version,
        stateSchemaVersion: config.stateSchemaVersion,
        bridgeInstanceId: registration.bridgeInstanceId
      }, extra || {});
    }

    function diagnostic(code, detail) {
      const payload = {
        code,
        detail: detail ? String(detail) : '',
        trainerId: config.id,
        bridgeInstanceId: registration.bridgeInstanceId
      };
      try {
        if (global.console && typeof global.console.warn === 'function') {
          global.console.warn('[MathExamBoard]', code, payload.detail);
        }
      } catch (_error) {}
      try {
        global.dispatchEvent(new CustomEvent('mathexam:bridge-diagnostic', { detail: payload }));
      } catch (_error) {}
    }

    function post(type, extra) {
      if (registration.destroyed) return false;
      try {
        global.parent.postMessage(envelope(type, extra), config.parentOrigin);
        return true;
      } catch (error) {
        diagnostic('post-message-failed', error && error.message);
        return false;
      }
    }

    function envelopeMatches(data) {
      return data
        && data.protocolVersion === PROTOCOL_VERSION
        && data.trainerId === config.id
        && data.trainerVersion === config.version
        && data.stateSchemaVersion === config.stateSchemaVersion
        && data.bridgeInstanceId === registration.bridgeInstanceId;
    }

    function currentState(force) {
      if (!registration.hydrated || registration.timedOut || registration.destroyed) return;
      let state;
      try {
        state = config.getState();
      } catch (error) {
        diagnostic('get-state-failed', error && error.message);
        return;
      }
      const validation = validateState(state);
      if (!validation.ok) {
        diagnostic(validation.code);
        return;
      }
      if (!force && validation.serialized === registration.lastSerializedState) return;
      registration.lastSerializedState = validation.serialized;
      post('mathexam:trainer-state', { state });
    }

    function applyRemoteState(state, initial) {
      const validation = validateState(state);
      if (!validation.ok) {
        diagnostic(validation.code);
        return false;
      }
      registration.applyingRemoteState = true;
      try {
        config.applyState(state);
        registration.lastSerializedState = validation.serialized;
        return true;
      } catch (error) {
        diagnostic(initial ? 'hydrate-apply-failed' : 'remote-apply-failed', error && error.message);
        return false;
      } finally {
        registration.applyingRemoteState = false;
      }
    }

    registration.listener = event => {
      const data = event.data;
      if (!data || !MESSAGE_TYPES.has(data.type)) return;
      if (event.source !== global.parent) {
        diagnostic('source-mismatch');
        return;
      }
      if (event.origin !== config.parentOrigin) {
        diagnostic('origin-mismatch');
        return;
      }
      if (!envelopeMatches(data)) {
        diagnostic('envelope-mismatch');
        return;
      }
      if (registration.timedOut || registration.destroyed) return;

      if (data.type === 'mathexam:hydrate') {
        if (registration.hydrated) return;
        if (data.mode === 'state') {
          if (!applyRemoteState(data.state, true)) return;
        } else if (data.mode !== 'empty') {
          diagnostic('hydrate-mode-invalid');
          return;
        }
        registration.hydrated = true;
        clearTimeout(registration.hydrationTimer);
        return;
      }

      if (!registration.hydrated) {
        diagnostic('message-before-hydration');
        return;
      }
      if (data.type === 'mathexam:request-trainer-state') {
        currentState(true);
        return;
      }
      applyRemoteState(data.state, false);
    };

    global.addEventListener('message', registration.listener);
    if (config.subscribe) {
      try {
        const cleanup = config.subscribe(() => {
          if (registration.applyingRemoteState || registration.destroyed || registration.timedOut) return;
          clearTimeout(registration.notifyTimer);
          registration.notifyTimer = setTimeout(() => currentState(false), 40);
        });
        if (typeof cleanup === 'function') registration.subscribeCleanup = cleanup;
      } catch (error) {
        diagnostic('subscribe-failed', error && error.message);
      }
    }

    post('mathexam:trainer-ready');
    registration.hydrationTimer = setTimeout(() => {
      if (registration.hydrated || registration.destroyed) return;
      registration.timedOut = true;
      diagnostic('hydration-timeout');
    }, config.hydrationTimeoutMs);

    return Object.freeze({
      notifyStateChanged() {
        if (registration.applyingRemoteState || registration.destroyed || registration.timedOut) return;
        clearTimeout(registration.notifyTimer);
        registration.notifyTimer = setTimeout(() => currentState(false), 40);
      },
      isApplyingRemoteState() {
        return registration.applyingRemoteState;
      },
      destroy() {
        if (registration.destroyed) return;
        registration.destroyed = true;
        clearTimeout(registration.hydrationTimer);
        clearTimeout(registration.notifyTimer);
        global.removeEventListener('message', registration.listener);
        if (registration.subscribeCleanup) {
          try { registration.subscribeCleanup(); } catch (_error) {}
        }
        if (activeRegistration === registration) activeRegistration = null;
      }
    });
  }

  global.MathExamBoard = Object.freeze({
    PROTOCOL_VERSION,
    DEFAULT_HYDRATION_TIMEOUT_MS,
    validateState,
    register
  });
})(window);
