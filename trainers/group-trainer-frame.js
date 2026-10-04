(function (global) {
  'use strict';

  // The pilot deliberately supports only the two already bridged trainers.
  const TRAINERS = Object.freeze({
    'negative-numbers-line': Object.freeze({ path: '/trainers/negative-numbers-line.html', title: 'Отрицательные числа', version: '1.0.0' }),
    'linear-inequalities-stepwise': Object.freeze({ path: '/trainers/linear-inequalities-stepwise.html', title: 'Линейные неравенства', version: '1.0.0' })
  });
  const TIMEOUT_MS = 10000;
  const MAX_BYTES = 64 * 1024;
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

  function validateState(state) {
    if (global.MathExamBoard && typeof global.MathExamBoard.validateState === 'function') {
      const result = global.MathExamBoard.validateState(state);
      if (!result.ok) throw new TypeError('Некорректное состояние тренажёра: ' + result.code);
      return JSON.parse(result.serialized);
    }
    const seen = new Set();
    function visit(value, depth) {
      if (depth > 8) throw new TypeError('Слишком сложное состояние тренажёра');
      if (value === null || typeof value === 'boolean') return;
      if (typeof value === 'number' && Number.isFinite(value)) return;
      if (typeof value === 'string' && !/<\/?[a-z][^>]*>/i.test(value)) return;
      if (!value || typeof value !== 'object' || seen.has(value)) throw new TypeError('Некорректное состояние тренажёра');
      seen.add(value);
      if (Array.isArray(value)) {
        if (value.length > 2000) throw new TypeError('Слишком большое состояние тренажёра');
        value.forEach(item => visit(item, depth + 1));
      } else {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Некорректный объект состояния');
        for (const key of Object.keys(value)) {
          if (['__proto__', 'constructor', 'prototype'].includes(key) || /html$/i.test(key) ||
              (depth === 1 && ['protocolVersion', 'trainerVersion', 'stateSchemaVersion'].includes(key))) {
            throw new TypeError('Недопустимое поле состояния');
          }
          visit(value[key], depth + 1);
        }
      }
      seen.delete(value);
    }
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('Требуется объект состояния');
    visit(state, 1);
    const serialized = JSON.stringify(state);
    if (new TextEncoder().encode(serialized).length > MAX_BYTES) throw new TypeError('Слишком большое состояние тренажёра');
    return JSON.parse(serialized);
  }

  // Stable comparison also deduplicates state returned with reordered JSON keys.
  function stateKey(value) {
    if (Array.isArray(value)) return '[' + value.map(stateKey).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stateKey(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }

  class GroupTrainerFrame {
    constructor(host, options) {
      options = options || {};
      if (!host || typeof host.appendChild !== 'function') throw new TypeError('Требуется место для тренажёра');
      if (!hasOwn(TRAINERS, options.trainerId)) throw new TypeError('Этот тренажёр пока не поддерживает групповую доску');
      if (typeof options.assignmentId !== 'string' || !options.assignmentId || options.assignmentId.length > 200) throw new TypeError('Требуется идентификатор задания');
      if (location.origin === 'null') throw new Error('Откройте доску через сайт');
      this.trainerId = options.trainerId;
      this.assignmentId = options.assignmentId;
      this.preview = options.preview === true;
      this.readOnly = options.readOnly !== false || this.preview;
      this.onState = typeof options.onState === 'function' ? options.onState : null;
      this.onStatus = typeof options.onStatus === 'function' ? options.onStatus : null;
      this._config = TRAINERS[this.trainerId];
      this._origin = location.origin;
      this._destroyed = false;
      this._document = null;
      this._bridgeId = null;
      this._hydrated = false;
      this._ready = false;
      this._failed = false;
      this._state = null;
      this._key = null;
      this._pendingSnapshot = false;
      this._stateRevision = 0;
      this._snapshotRevision = 0;
      this._waiters = [];
      this._timer = null;
      this._diagnosticWindow = null;
      this._contentObserver = null;
      this._fitRequest = null;
      this._onDiagnostic = event => {
        const detail = event.detail;
        if (!detail || detail.trainerId !== this.trainerId || detail.bridgeInstanceId !== this._bridgeId) return;
        if (['hydration-timeout', 'hydrate-apply-failed', 'remote-apply-failed', 'get-state-failed'].includes(detail.code) || /^state-/.test(detail.code)) {
          this._fail('Не удалось восстановить работу в тренажёре. Обновите страницу.');
        }
      };
      if (options.state != null) this._remember(options.state);

      this.element = document.createElement('div');
      this.element.className = 'group-trainer-frame';
      this.element.dataset.trainerId = this.trainerId;
      this.element.dataset.assignmentId = this.assignmentId;
      this.element.dataset.status = 'loading';
      Object.assign(this.element.style, { position: 'relative', width: '100%', height: '100%', minHeight: this.preview ? '0' : '120px', overflow: 'hidden' });
      this.viewport = document.createElement('div');
      this.viewport.className = 'group-trainer-viewport';
      Object.assign(this.viewport.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'group-trainer-iframe';
      this.iframe.title = this._config.title + (this.preview ? ' — просмотр работы' : ' — задание');
      this.iframe.referrerPolicy = 'no-referrer';
      Object.assign(this.iframe.style, { display: 'block', width: '100%', height: '100%', border: '0', transformOrigin: '0 0' });
      const url = new URL(this._config.path, this._origin);
      url.searchParams.set('groupLesson', '1');
      this.iframe.src = url.href;
      this.overlay = document.createElement('div');
      this.overlay.className = 'group-trainer-overlay';
      this.overlay.setAttribute('aria-hidden', 'true');
      Object.assign(this.overlay.style, { position: 'absolute', inset: '0', zIndex: '1', background: 'transparent' });
      this.viewport.appendChild(this.iframe);
      this.element.append(this.viewport, this.overlay);

      this._onMessage = event => this._receive(event);
      this._onLoad = () => this._loaded();
      this._onFrameError = () => this._fail('Не удалось загрузить тренажёр. Обновите страницу.');
      this._onResize = () => this._fit();
      global.addEventListener('message', this._onMessage);
      this.iframe.addEventListener('load', this._onLoad);
      this.iframe.addEventListener('error', this._onFrameError);
      this._setAccess();
      host.appendChild(this.element);
      if (typeof ResizeObserver === 'function') {
        this._resizeObserver = new ResizeObserver(this._onResize);
        this._resizeObserver.observe(this.element);
      } else global.addEventListener('resize', this._onResize);
      this._fit();
      this._startTimer();
      this._status('Загружаем тренажёр…');
    }

    _status(text) {
      if (this._destroyed || text === this._statusText) return;
      this._statusText = text;
      if (this.onStatus) this.onStatus(text);
    }

    _startTimer() {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this._fail('Тренажёр не подтвердил связь. Обновите страницу.'), TIMEOUT_MS);
    }

    _fail(text) {
      if (this._destroyed) return;
      clearTimeout(this._timer);
      this._failed = true;
      this._ready = false;
      this.element.dataset.status = 'error';
      this._setAccess();
      this._status(text);
      this._waiters.splice(0).forEach(waiter => waiter.reject(new Error(text)));
    }

    _remember(state) {
      const clean = validateState(state);
      this._state = clean;
      this._key = stateKey(clean);
      return clean;
    }

    _currentDocument() {
      try {
        const url = new URL(this.iframe.contentWindow.location.href);
        if (url.origin !== this._origin || url.pathname !== this._config.path || url.searchParams.get('groupLesson') !== '1') return null;
        return this.iframe.contentDocument;
      } catch (_error) { return null; }
    }

    _loaded() {
      if (this._destroyed) return;
      const doc = this._currentDocument();
      if (!doc) { this._fail('Открыта неподдерживаемая страница тренажёра.'); return; }
      this._useDocument(doc);
      if (!this._ready) this._status('Подключаем тренажёр…');
    }

    _useDocument(doc) {
      if (doc !== this._document) {
        if (this._diagnosticWindow) this._diagnosticWindow.removeEventListener('mathexam:bridge-diagnostic', this._onDiagnostic);
        if (this._contentObserver) this._contentObserver.disconnect();
        this._document = doc;
        this._diagnosticWindow = doc.defaultView;
        this._diagnosticWindow.addEventListener('mathexam:bridge-diagnostic', this._onDiagnostic);
        this._bridgeId = null;
        this._hydrated = false;
        this._ready = false;
        this._failed = false;
        this._pendingSnapshot = false;
        this.element.dataset.status = 'loading';
        this._startTimer();
        if (this.preview && typeof MutationObserver === 'function') {
          this._contentObserver = new MutationObserver(() => this._scheduleFit());
          this._contentObserver.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
        }
      }
      if (!doc.getElementById('group-trainer-presentation')) {
        const style = doc.createElement('style');
        style.id = 'group-trainer-presentation';
        // Solo statistics are device-local, not this student's group results.
        style.textContent = '.download-panel,.back{display:none!important}' +
          (this.trainerId === 'negative-numbers-line'
            ? '.page>.card~.card{display:none!important}.top{display:none!important}body{padding:10px!important}.card{margin-bottom:0!important}'
            : '.grid>aside{display:none!important}.grid{display:block!important}.hero{display:none!important}.page{padding:10px!important}.card{margin-bottom:0!important}') +
          (this.preview ? 'html{overflow:hidden!important}body{min-height:0!important}.card{padding:10px!important;border-radius:12px!important}' +
            (this.trainerId === 'negative-numbers-line'
              ? '.controls,.exprLabel,.btns{display:none!important}.expr{font-size:46px!important;margin:0 0 4px!important}.instr{font-size:18px!important;padding:6px!important;margin-bottom:4px!important}.svgWrap{padding:0!important}.nl{height:160px!important;min-width:0!important;width:100%!important}.hint{padding:6px!important;margin:4px 0!important}.answer{margin-top:4px!important}.answer input{font-size:23px!important;padding:5px!important}.feedback{font-size:18px!important;min-height:0!important;margin-top:4px!important}'
              : '.card>.row,.choices,#check{display:none!important}.grid>div.card{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:6px 12px;align-items:start}.ineq{grid-column:1;grid-row:1;font-size:33px!important;margin:3px 0!important}.steps{grid-column:1;grid-row:2 / span 2;padding:7px!important}.step{font-size:17px!important;padding:6px!important;margin:4px 0!important}.answer{grid-column:2;grid-row:1;margin:0!important;gap:6px!important}.answer input,.answer select{font-size:20px!important;padding:6px!important}.answer input{width:90px!important}.line{grid-column:2;grid-row:2;width:520px!important;height:70px!important;zoom:.65;margin:0!important}.line:empty{display:none!important}.fb{grid-column:2;grid-row:3;font-size:17px!important;padding:7px!important}') : '');
        doc.head.appendChild(style);
      }
      this._setAccess();
      this._fit();
    }

    _scheduleFit() {
      if (this._destroyed || !this.preview || this._fitRequest !== null) return;
      this._fitRequest = global.requestAnimationFrame(() => {
        this._fitRequest = null;
        this._fit();
      });
    }

    _setAccess() {
      const locked = this.readOnly || !this._ready || this._failed;
      this.element.dataset.readOnly = String(locked);
      this.viewport.inert = locked;
      this.iframe.tabIndex = locked ? -1 : 0;
      this.iframe.style.pointerEvents = locked ? 'none' : 'auto';
      this.overlay.style.display = locked ? 'block' : 'none';
      if (this._document && this._document.body) {
        this._document.body.inert = locked;
        if (locked && this._document.activeElement && typeof this._document.activeElement.blur === 'function') this._document.activeElement.blur();
      }
      if (locked && document.activeElement === this.iframe) this.iframe.blur();
    }

    _fit() {
      if (this._destroyed || !this.preview) return;
      const width = this.element.clientWidth;
      const height = this.element.clientHeight;
      if (!width || !height) return;
      const nativeWidth = this.trainerId === 'negative-numbers-line' ? 800 : 850;
      this.iframe.style.width = nativeWidth + 'px';
      const page = this._document && this._document.querySelector('main.page');
      // Measure actual task content, not body.scrollHeight (which includes the old
      // iframe viewport and would create an ever-shrinking resize feedback loop).
      const contentHeight = page ? Math.ceil(page.getBoundingClientRect().bottom + 12) : 360;
      const scale = Math.min(width / nativeWidth, height / Math.max(1, contentHeight));
      this.iframe.style.height = Math.max(1, contentHeight) + 'px';
      this.iframe.style.transform = 'scale(' + scale + ')';
      this.iframe.style.marginLeft = Math.max(0, (width - nativeWidth * scale) / 2) + 'px';
    }

    _matches(data) {
      return data && data.protocolVersion === 1 && data.trainerId === this.trainerId &&
        data.trainerVersion === this._config.version && data.stateSchemaVersion === 1 &&
        typeof data.bridgeInstanceId === 'string' && data.bridgeInstanceId.length > 0 && data.bridgeInstanceId.length <= 128;
    }

    _send(type, extra) {
      if (this._destroyed || this._failed || !this._bridgeId) return;
      this.iframe.contentWindow.postMessage(Object.assign({
        type, protocolVersion: 1, trainerId: this.trainerId, trainerVersion: this._config.version,
        stateSchemaVersion: 1, bridgeInstanceId: this._bridgeId
      }, extra || {}), this._origin);
    }

    _requestSnapshot() {
      if (!this._hydrated || this._pendingSnapshot || this._failed || this._destroyed) return;
      this._pendingSnapshot = true;
      this._snapshotRevision = this._stateRevision;
      this._startTimer();
      this._send('mathexam:request-trainer-state');
    }

    _receive(event) {
      if (this._destroyed || event.source !== this.iframe.contentWindow || event.origin !== this._origin) return;
      const data = event.data;
      if (!data || (data.type !== 'mathexam:trainer-ready' && data.type !== 'mathexam:trainer-state')) return;
      if (!this._matches(data)) {
        if (data.type === 'mathexam:trainer-ready') this._fail('Версия тренажёра несовместима с групповой доской.');
        return;
      }
      const doc = this._currentDocument();
      if (!doc) return;
      this._useDocument(doc);
      if (data.type === 'mathexam:trainer-ready') {
        // A second bridge cannot replace an established bridge in the same document.
        if (this._ready || (this._bridgeId === data.bridgeInstanceId && this._hydrated) || this._failed) return;
        this._bridgeId = data.bridgeInstanceId;
        this._send('mathexam:hydrate', this._state ? { mode: 'state', state: this._state } : { mode: 'empty' });
        this._hydrated = true;
        this._pendingSnapshot = false;
        this._requestSnapshot();
        return;
      }
      if (!this._hydrated || this._failed || data.bridgeInstanceId !== this._bridgeId) return;
      let clean;
      try { clean = validateState(data.state); } catch (_error) {
        this._fail('Тренажёр передал некорректное состояние. Обновите страницу.');
        return;
      }
      const key = stateKey(clean);
      const changed = key !== this._key;
      const wasSnapshot = this._pendingSnapshot;
      const wasReady = this._ready;
      this._pendingSnapshot = false;
      // A newer server state may have arrived while the old request was in flight.
      // Do not let its late response restore that obsolete state in this wrapper.
      if (wasSnapshot && this._snapshotRevision !== this._stateRevision) {
        this._requestSnapshot();
        return;
      }
      this._state = clean;
      this._key = key;
      this._ready = true;
      clearTimeout(this._timer);
      this.element.dataset.status = 'ready';
      this._setAccess();
      this._status(this.readOnly ? 'Просмотр работы' : 'Тренажёр подключён');
      this._waiters.splice(0).forEach(waiter => waiter.resolve(JSON.parse(JSON.stringify(clean))));
      // A requested snapshot can include input not yet sent by the child's debounce.
      // Publish that input as well; equal remote applies and initial snapshots never echo.
      if (changed && wasReady && !this.readOnly && !this.preview && this.onState) this.onState(JSON.parse(JSON.stringify(clean)));
    }

    update(options) {
      if (this._destroyed) return;
      options = options || {};
      if (hasOwn(options, 'readOnly')) this.readOnly = options.readOnly !== false || this.preview;
      if (hasOwn(options, 'state') && options.state != null) {
        let clean;
        try { clean = validateState(options.state); } catch (_error) {
          this._fail('Получено некорректное сохранённое состояние тренажёра.');
          return;
        }
        const key = stateKey(clean);
        if (key !== this._key) {
          this._stateRevision += 1;
          this._state = clean;
          this._key = key;
          if (this._hydrated && !this._failed) {
            this._send('mathexam:apply-trainer-state', { state: clean });
          }
        }
      }
      this._setAccess();
      if (this._ready) this._status(this.readOnly ? 'Просмотр работы' : 'Тренажёр подключён');
    }

    getState() {
      if (this._destroyed) return Promise.reject(new Error('Тренажёр закрыт'));
      if (this._failed) return Promise.reject(new Error(this._statusText || 'Тренажёр недоступен'));
      return new Promise((resolve, reject) => {
        this._waiters.push({ resolve, reject });
        this._requestSnapshot();
      });
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      clearTimeout(this._timer);
      global.removeEventListener('message', this._onMessage);
      global.removeEventListener('resize', this._onResize);
      this.iframe.removeEventListener('load', this._onLoad);
      this.iframe.removeEventListener('error', this._onFrameError);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._contentObserver) this._contentObserver.disconnect();
      if (this._fitRequest !== null) global.cancelAnimationFrame(this._fitRequest);
      if (this._diagnosticWindow) this._diagnosticWindow.removeEventListener('mathexam:bridge-diagnostic', this._onDiagnostic);
      this._waiters.splice(0).forEach(waiter => waiter.reject(new Error('Тренажёр закрыт')));
      this.element.dataset.status = 'destroyed';
      this.element.remove();
      this.onState = null;
      this.onStatus = null;
      this._document = null;
      this._diagnosticWindow = null;
    }
  }

  global.GroupTrainerFrame = GroupTrainerFrame;
})(window);
