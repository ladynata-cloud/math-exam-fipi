/* Shared state for the three existing diagnostic/reading engines.
 * The native closures regenerate questions and feedback. No peer markup,
 * answer key, score, timer handle or personal progress is accepted. */
(function (root, doc) {
  'use strict';
  const active = root.OgeCourseSharedMode === true;
  function plain(value) { return value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)); }
  function exact(value, keys) {
    if (!plain(value) || Reflect.ownKeys(value).length !== keys.length) return false;
    return keys.every(key => { const p = Object.getOwnPropertyDescriptor(value, key); return p && p.enumerable && Object.prototype.hasOwnProperty.call(p, 'value'); });
  }
  function safe(value, depth = 0) {
    if (depth > 7) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return value.length <= 160 && !/[<>\u0000-\u001f]/.test(value);
    if (!plain(value) && !Array.isArray(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 20 || keys.length !== value.length + 1 || !Array.from({length:value.length}, (_, i) => Object.prototype.hasOwnProperty.call(value, i)).every(Boolean))) return false;
    return keys.every(key => {
      if (Array.isArray(value) && key === 'length') return true;
      const p = Object.getOwnPropertyDescriptor(value, key);
      return typeof key === 'string' && !['__proto__', 'constructor', 'prototype'].includes(key) && p.enumerable && Object.prototype.hasOwnProperty.call(p, 'value') && safe(p.value, depth + 1);
    });
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  const bools = (value, n) => Array.isArray(value) && value.length === n && value.every(x => typeof x === 'boolean');
  const text = value => typeof value === 'string' && value.length <= 80 && !/[<>\u0000-\u001f]/.test(value);
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  function connect(native) {
    if (!active) return;
    function init() {
      let notify = function () {}, applying = false, pending = false, last = '';
      const disclosures = () => Array.from(doc.querySelectorAll('details.pm-details'));
      const getState = () => ({native: native.getState(), disclosures: disclosures().map(node => node.open)});
      function prepare(value) {
        if (!safe(value) || !exact(value, ['native', 'disclosures']) || !bools(value.disclosures, disclosures().length) || value.disclosures.length > 16 || !native.validateState(value.native)) throw new TypeError('Invalid practical diagnostic state');
        return copy(value);
      }
      function applyState(value) {
        const next = prepare(value);
        applying = true;
        try { native.applyState(next.native); disclosures().forEach((node, i) => { node.open = next.disclosures[i]; }); last = JSON.stringify(getState()); }
        finally { applying = false; }
      }
      function changed() {
        if (pending || applying) return;
        pending = true;
        Promise.resolve().then(() => { pending = false; if (applying) return; const current = JSON.stringify(getState()); if (current !== last) { last = current; notify(); } });
      }
      doc.addEventListener('input', event => {
        if (applying) return;
        if (event.target.matches('input:not([type=range]),textarea')) event.target.value = event.target.value.replace(/[<>\u0000-\u001f]/g, '').slice(0, 80);
        changed();
      }, true);
      ['change', 'click', 'keydown', 'toggle'].forEach(type => doc.addEventListener(type, changed, true));
      const notice = doc.createElement('p'); notice.className = 'practical-board-note'; notice.setAttribute('role', 'note');
      notice.textContent = 'Совместная работа на доске. Ответы и разбор видны обоим участникам. Таймер отключён; результат не записывается как личная диагностика или самостоятельный зачёт.';
      notice.style.cssText = 'max-width:1100px;margin:14px auto;padding:12px 18px;background:#edf5ef;border-radius:10px;line-height:1.6';
      (doc.querySelector('main') || doc.body).prepend(notice);
      doc.querySelectorAll('#copy,#copy-btn').forEach(node => { node.hidden = true; });
      root.PracticalDiagnosticBoard = Object.freeze({getState, applyState, validateState(value) { try { prepare(value); return true; } catch (_) { return false; } }});
      root.getBoardTrainerState = getState; root.applyBoardTrainerState = applyState;
      last = JSON.stringify(getState());
      if (root.MathExamBoard) root.MathExamBoard.register({id:native.id,version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe(callback) { notify = callback; return () => { notify = function () {}; }; }});
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => root.setTimeout(init, 0), {once:true}); else root.setTimeout(init, 0);
  }
  root.PracticalDiagnosticBridge = Object.freeze({active, exact, safe, copy, bools, text, integer, connect});
})(window, document);
