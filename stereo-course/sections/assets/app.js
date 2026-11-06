
(function () {
  'use strict';

  const C = window.COURSE;
  const board = window.SECTIONS_BOARD_SESSION || null;
  const storage = board ? board.storage : { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };
  let boardApplying = false, boardSettle = null;
  const wrapYaw = value => value >= -Math.PI && value < Math.PI ? value :
    ((value + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const host = document.getElementById('sections-app');
  if (!C || !Array.isArray(C.lessons) || !C.lessons.length) {
    host.replaceChildren(document.createTextNode('В этом файле не найдены материалы курса.'));
    return;
  }
  const NS = 'http://www.w3.org/2000/svg';
  const KEY = typeof C.storageKey === 'string' && C.storageKey.trim() ? C.storageKey : 'mathexam.sections.master.v1';
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, s) => a.map(v => v * s);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => Math.hypot(...a);
  const unit = a => mul(a, 1 / Math.max(norm(a), 1e-14));
  const mean = arr => arr.length ? mul(arr.reduce(add, [0, 0, 0]), 1 / arr.length) : [0, 0, 0];
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const edgeKey = (a, b) => [a, b].sort().join('|');
  const displayName = x => String(x).replace(/_?([0-9]+)$/g, m => m.replace('_', '').replace(/[0-9]/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]));
  const lessonMap = new Map(C.lessons.map(l => [l.id, l]));
  const moduleMap = new Map((C.modules || []).map(m => [m.id, m]));
  const skillMap = new Map((Array.isArray(C.skills) ? C.skills : []).map(s => [s.id, s.label || s.title || s.id]));

  // A short scaffold uses the same calm presentation without becoming a starter.
  function guidanceFor(lesson) { return lesson?.starter || lesson?.scaffold || null; }
  function guidanceNames(lesson) { return lesson.starter ? lesson.starterVisibleNames : lesson.scaffoldVisibleNames; }

  function frozenCopy(value) {
    const copy = JSON.parse(JSON.stringify(value));
    const freeze = object => {
      if (!object || typeof object !== 'object' || Object.isFrozen(object)) return object;
      Object.values(object).forEach(freeze); return Object.freeze(object);
    };
    return freeze(copy);
  }
  function sourceReference(reference) {
    if (!reference) return '';
    if (typeof reference === 'string') return reference;
    if (Array.isArray(reference)) return reference.map(sourceReference).filter(Boolean).join('; ');
    if (typeof reference === 'object') return [reference.authors, reference.title || reference.name, reference.part ? 'часть ' + reference.part : '', reference.section, reference.task ? '№ ' + reference.task : '', reference.page ? 'с. ' + reference.page : '', reference.year].filter(Boolean).join(' · ');
    return '';
  }
  function sourceLabel(lesson, short) {
    const src = lesson.source;
    if (typeof src === 'string') return src;
    if (!src) return '';
    if (src.kind === 'author') return ['Авторская задача', short ? '' : sourceReference(src.reference)].filter(Boolean).join(' · ');
    return [src.reference ? sourceReference(src.reference) : '', src.section, src.task ? '№ ' + src.task : '', src.page ? (short ? 'с. ' : 'печатная с. ') + src.page : '', !short && src.scanPage ? 'страница файла ' + src.scanPage : ''].filter(Boolean).join(' · ');
  }
  function lessonSkills(lesson) {
    const skills = lesson.skills || (lesson.skill ? [lesson.skill] : []);
    return (Array.isArray(skills) ? skills : [skills]).filter(Boolean).map(s => typeof s === 'string' ? skillMap.get(s) || s : s.label || s.title || s.id).filter(Boolean);
  }

  function el(tag, attrs, text, svg) {
    const n = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v;
      else if (k === 'checked' && !svg) n.checked = !!v;
      else if (k === 'disabled' && !svg) n.disabled = !!v;
      else n.setAttribute(k, String(v));
    }
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function svgEl(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, String(v));
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function math(text) {
    const f = document.createDocumentFragment();
    const parts = String(text || '').split(/(\[\[frac:[^\[\]]+\|[^\[\]]+\]\]|\n)/g);
    for (const part of parts) {
      if (!part) continue;
      const match = part.match(/^\[\[frac:([^|]+)\|([^\]]+)\]\]$/);
      if (match) {
        const span = el('span', { class: 'fraction', role: 'math', 'aria-label': match[1] + ' делить на ' + match[2] });
        span.append(el('span', { class: 'numerator', 'aria-hidden': 'true' }, match[1]), el('span', { class: 'denominator', 'aria-hidden': 'true' }, match[2]));
        f.append(span);
      } else if (part === '\n') f.append(el('br'));
      else f.append(document.createTextNode(part));
    }
    return f;
  }
  function para(text, className) { const p = el('p', className ? { class: className } : {}); p.append(math(text)); return p; }
  function button(text, fn, cls, attrs) {
    const b = el('button', { type: 'button', ...(attrs || {}), ...(cls ? { class: cls } : {}) }, text);
    b.addEventListener('click', fn);
    return b;
  }
  function details(label, children, onOpen, open) {
    const d = el('details'); if (open) d.open = true;
    // A queued toggle from a replaced card must not update the new scene.
    if (board) d.addEventListener('toggle', event => { if (!d.isConnected) event.stopImmediatePropagation(); }, true);
    d.append(el('summary', {}, label));
    for (const child of children) d.append(child);
    if (onOpen) d.addEventListener('toggle', () => { if (d.open && !boardApplying) onOpen(); });
    return d;
  }
  function planesFor(lesson) {
    const f = (lesson.model.faces || []).map((face, i) => Array.isArray(face) ? { id: 'face-' + i, label: face.map(displayName).join(''), vertices: face } : face);
    const map = new Map(f.map(p => [p.id, p]));
    for (const p of lesson.model.planes || []) map.set(p.id, p);
    return map;
  }
  function samePlane(lesson, a, b) {
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    const pts = a.vertices.map(n => lesson.model.points[n]).filter(Boolean);
    const other = b.vertices.map(n => lesson.model.points[n]).filter(Boolean);
    if (pts.length < 3 || other.length < 3) return false;
    let normal = null;
    for (let i = 1; i < pts.length - 1; i++) {
      const n = cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0]));
      if (norm(n) > 1e-10) { normal = unit(n); break; }
    }
    if (!normal) return false;
    const scale = Math.max(1, ...pts.concat(other).map(p => norm(sub(p, pts[0]))));
    return other.every(p => Math.abs(dot(normal, sub(p, pts[0]))) < scale * 1e-8);
  }
  function knownNames(lesson, count) {
    const names = new Set((lesson.model.edges || []).flat().concat(lesson.model.given || []));
    lesson.steps.slice(0, count).forEach(step => {
      (step.points || []).forEach(n => names.add(n));
      (step.segments || []).forEach(line => { names.add(line.a); names.add(line.b); });
    });
    return names;
  }
  function choicePlanes(lesson, step, planes, count) {
    const known = knownNames(lesson, count);
    const candidates = Array.isArray(step.planeOptions) ? step.planeOptions.map(id => planes.get(id)).filter(Boolean) : [...planes.values()];
    return candidates.filter(p => p.vertices.every(n => known.has(n)));
  }
  function plannedAction(step, plane) {
    // The intended operation must be visible before a plane can be chosen.
    // Hide the expected plane's name if the author's wording repeats it.
    const text = String(step.action || '');
    const labels = [plane.label, ...(String(plane.label || '').match(/\([^()]+\)/g) || [])].filter(Boolean);
    return labels.reduce((out, name) => out.split(name).join('(название выбери ниже)'), text);
  }
  function numericValue(input) {
    const raw = String(input).trim().replace(/\s/g, '').replace(/,/g, '.').replace(/−/g, '-');
    const simple = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
    if (simple.test(raw)) return Number(raw);
    const pieces = raw.split('/');
    if (pieces.length === 2 && pieces.every(x => simple.test(x)) && Number(pieces[1]) !== 0) return Number(pieces[0]) / Number(pieces[1]);
    return NaN;
  }

  let stored = {};
  let storageFailed = false;
  try { stored = JSON.parse(storage.getItem(KEY) || '{}'); } catch (_) { stored = {}; }
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};
  let current = C.lessons[0].id;
  try { const h = decodeURIComponent(location.hash.slice(1)); if (lessonMap.has(h)) current = h; else if (lessonMap.has(stored.current)) current = stored.current; } catch (_) {}
  const state = { version: 1, current, tasks: stored.tasks && typeof stored.tasks === 'object' && !Array.isArray(stored.tasks) ? stored.tasks : {} };
  let catalogFilter = '';
  let catalogQuery = '';
  let catalogLevel = '';
  let catalogOrigin = '';
  let catalogOpen = window.innerWidth > 760;
  let renderer = null;
  let currentMain = null;
  let catalogList = null;
  let catalogCount = null;
  let live = null;
  let frame = null;
  let lastRenderedId = null;
  let avoidHash = false;

  function taskState(lesson) {
    let s = state.tasks[lesson.id];
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = state.tasks[lesson.id] = {};
    s.mode = ['choose', 'study', 'practice'].includes(s.mode) ? s.mode : 'choose';
    s.revealed = Number.isInteger(s.revealed) ? clamp(s.revealed, 0, lesson.steps.length) : 0;
    s.viewCount = Number.isInteger(s.viewCount) ? clamp(s.viewCount, 0, s.revealed) : s.revealed;
    s.approved = s.approved === s.revealed ? s.approved : -1;
    s.questionApproved = s.questionApproved === s.revealed ? s.questionApproved : -1;
    s.questionAttempts = s.questionAttempts && typeof s.questionAttempts === 'object' && !Array.isArray(s.questionAttempts) ? s.questionAttempts : {};
    s.planeAttempts = s.planeAttempts && typeof s.planeAttempts === 'object' && !Array.isArray(s.planeAttempts) ? s.planeAttempts : {};
    s.calculationRevealed = Number.isInteger(s.calculationRevealed) ? clamp(s.calculationRevealed, 0, (lesson.calculationSteps || []).length) : 0;
    s.calculationSeen = !!s.calculationSeen;
    s.helpUsed = !!s.helpUsed; s.workedSeen = !!s.workedSeen; s.resultSeen = !!s.resultSeen;
    s.theoryOpen = !!s.theoryOpen;
    s.notesOpen = !!s.notesOpen;
    s.justBuilt = !!s.justBuilt && s.revealed > 0;
    s.showResult = !!s.showResult && s.revealed === lesson.steps.length && s.calculationRevealed === (lesson.calculationSteps || []).length;
    s.draft = typeof s.draft === 'string' ? s.draft.slice(0, board ? 2000 : 30000) : '';
    s.draftOpen = !!s.draftOpen;
    s.glossaryOpen = !!s.glossaryOpen;
    s.answer = typeof s.answer === 'string' ? s.answer.slice(0, 120) : '';
    s.answerChecked = !!s.answerChecked;
    s.correctAnswer = !!s.correctAnswer;
    s.answerInvalid = !!s.answerInvalid && !s.answerChecked;
    s.selectedCheck = Number.isInteger(s.selectedCheck) ? s.selectedCheck : -1;
    s.checkCorrect = !!s.checkCorrect;
    s.proofChecks = Array.isArray(s.proofChecks) ? Array.from({length:(lesson.proofChecklist || []).length}, (_, index) => !!s.proofChecks[index]) : (lesson.proofChecklist || []).map(() => false);
    s.independentSteps = Number.isInteger(s.independentSteps) ? clamp(s.independentSteps, 0, lesson.steps.length) : 0;
    s.hints = Array.isArray(s.hints) ? s.hints.filter(Number.isInteger) : [];
    s.helpReasons = Array.isArray(s.helpReasons) ? s.helpReasons.filter(x => typeof x === 'string').slice(board ? -24 : -100) : [];
    s.hintOpen = s.hintOpen && typeof s.hintOpen === 'object' && !Array.isArray(s.hintOpen) ? s.hintOpen : {};
    s.showHelpers = s.showHelpers !== false;
    s.cleanView = !!s.cleanView;
    s.planeView = !!s.planeView;
    const initial = lesson.model.initialCamera || { yaw: -.65, pitch: .46 };
    s.camera = s.camera && Number.isFinite(s.camera.yaw) && Number.isFinite(s.camera.pitch) ? { yaw: board ? wrapYaw(s.camera.yaw) : s.camera.yaw, pitch: clamp(s.camera.pitch, -1.45, 1.45) } : { ...initial };
    return s;
  }
  function save() {
    try { storage.setItem(KEY, JSON.stringify(state)); }
    catch (_) {
      if (!storageFailed) {
        storageFailed = true;
        const alert = para('Браузер не разрешил сохранить прогресс. Пока эта вкладка открыта, ответы и шаги сохраняются в ней.', 'storage-alert');
        alert.setAttribute('role', 'status'); host.prepend(alert);
      }
    }
  }
  function announce(text) { if (live) live.textContent = text; }
  function markHelp(id, reason) {
    const lesson = lessonMap.get(id); if (!lesson) return false;
    const s = taskState(lesson); s.helpUsed = true;
    if (typeof reason === 'string' && reason.trim() && !s.helpReasons.includes(reason)) s.helpReasons.push(reason.slice(0, 300));
    save(); refreshStatus(lesson, s); renderCatalog(); return true;
  }
  function statusText(s, lesson) {
    if (s.revealed === lesson.steps.length && s.revealed > 0) {
      if(s.calculationRevealed<(lesson.calculationSteps || []).length)return s.helpUsed?'Построено с подсказкой':'Построение завершено';
      if (s.helpUsed) return 'Разобрано с подсказкой';
      if (s.workedSeen || s.resultSeen) return 'Разобрано';
      return 'Построение выполнено';
    }
    if (s.mode === 'practice' && guidanceFor(lesson)?.phase === 'guided') return 'Пробуем с опорой';
    if (s.mode === 'practice' && (s.workedSeen || s.helpUsed || s.resultSeen)) return 'Проверка после помощи';
    if (s.mode === 'practice') return 'Самостоятельная попытка';
    if (s.mode === 'study') return 'Разбор по шагам';
    return 'Выбери способ работы';
  }
  function modeNote(s, lesson) {
    if (guidanceFor(lesson)) {
      if (s.mode === 'study') return 'Сначала смотрим вместе. Затем будет другой пример для твоей попытки.';
      if (guidanceFor(lesson).phase === 'guided') return 'В этой попытке есть опора. В следующем примере попробуем без неё.';
      return (s.workedSeen || s.helpUsed || s.resultSeen) ? 'Помощь сохранена. После разбора возьмём новый пример.' : 'Новый пример. Назови плоскость и объясни свой выбор.';
    }
    if (s.mode !== 'practice') return 'Разбор показывает основания построения. Его просмотр не считается самостоятельным решением.';
    return (s.workedSeen || s.helpUsed || s.resultSeen) ? 'Эта попытка идёт после разбора или помощи. Для независимой проверки выбери новую аналогичную задачу.' : 'Самостоятельная попытка: выбирай плоскость и объясняй каждый шаг. Подсказку можно открыть в любой момент; её использование сохранится.';
  }
  function refreshStatus(lesson, s) {
    if (lesson.id !== state.current) return;
    const badge = document.querySelector('.learning-status'); if (badge) badge.textContent = statusText(s, lesson);
    const note = document.querySelector('.mode-note'); if (note) note.textContent = modeNote(s, lesson);
  }
  function boardLink(lesson) {
    const origin = /^https?:$/.test(location.protocol) ? location.origin : 'https://mathexam.space';
    const target = new URL('/trainers/trainer-board.html', origin);
    target.searchParams.set('trainer', '/trainers/sections-from-zero.html#' + encodeURIComponent(lesson.id));
    const link = el('a', {
      class: 'sections-board-open', href: target.href, 'data-sections-board-open': '',
      title: 'Открыть это задание рядом с доской'
    }, 'На доску →');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      // A course opened over an existing board returns to that same room.
      // Only the public card ID is offered; personal work and cabinet routes
      // never become board state or URL parameters.
      const request = new CustomEvent('sections:board-request', { cancelable: true, detail: { lessonId: lesson.id } });
      if (!window.dispatchEvent(request)) event.preventDefault();
    });
    return link;
  }
  function switchLesson(id, moveFocus) {
    if (!lessonMap.has(id)) return;
    if (board && id !== state.current) state.tasks = {};
    state.current = id; save();
    try { avoidHash = true; history.replaceState(null, '', '#' + encodeURIComponent(id)); } catch (_) { location.hash = encodeURIComponent(id); }
    avoidHash = false;
    renderLesson(); renderCatalog();
    if (moveFocus) {
      const target = document.getElementById('lesson-title');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  window.addEventListener('hashchange', () => {
    if (avoidHash) return;
    try { const id = decodeURIComponent(location.hash.slice(1)); if (lessonMap.has(id) && id !== state.current) switchLesson(id, false); } catch (_) {}
  });

  class Scene {
    constructor(container, lesson, onCamera) {
      this.lesson = lesson; this.data = lesson.model; this.onCamera = typeof onCamera === 'function' ? onCamera : () => {};
      this.planes = planesFor(lesson); this.faces = [...this.planes.values()].filter(p => (this.data.faces || []).some(f => f.id === p.id));
      if (!this.faces.length) this.faces = (this.data.faces || []).map((f, i) => Array.isArray(f) ? { id: 'face-' + i, vertices: f } : f);
      this.bodyNames = [...new Set((this.data.edges || []).flat().concat(this.faces.flatMap(f => f.vertices || [])))];
      this.bodyCenter = mean(this.bodyNames.map(n => this.data.points[n]).filter(Boolean));
      this.bodyRadius = Math.max(1e-4, ...this.bodyNames.map(n => norm(sub(this.data.points[n], this.bodyCenter))));
      this.adjacency = new Map();
      this.faceInfo = this.faces.map((face, index) => {
        const pts = face.vertices.map(n => this.data.points[n]);
        const n = this.normal(pts); const center = mean(pts);
        const outward = dot(n, sub(center, this.bodyCenter)) < 0 ? mul(n, -1) : n;
        face.vertices.forEach((v, i) => { const key = edgeKey(v, face.vertices[(i + 1) % face.vertices.length]); if (!this.adjacency.has(key)) this.adjacency.set(key, []); this.adjacency.get(key).push(index); });
        return { ...face, normal: outward, center };
      });
      this.svg = svgEl('svg', { class: 'model-svg', viewBox: '0 0 600 420', tabindex: 0, role: 'img', 'aria-label': 'Пространственная модель. Стрелки поворачивают, Home возвращает исходный вид.' });
      container.append(this.svg);
      this.width = 600; this.height = 420; this.current = null; this.drag = null; this.raf = null; this.labelMetrics = new Map();
      this.svg.addEventListener('pointerdown', e => {
        if (this.current?.planeView) return;
        this.drag = { x: e.clientX, y: e.clientY, yaw: this.current.camera.yaw, pitch: this.current.camera.pitch, id: e.pointerId };
        this.svg.setPointerCapture(e.pointerId);
      });
      this.svg.addEventListener('pointermove', e => {
        if (!this.drag || this.drag.id !== e.pointerId) return;
        this.current.camera.yaw = this.drag.yaw + (e.clientX - this.drag.x) * .008;
        this.current.camera.pitch = clamp(this.drag.pitch - (e.clientY - this.drag.y) * .006, -1.45, 1.45);
        if (board) this.onCamera({ ...this.current.camera, yaw: wrapYaw(this.current.camera.yaw) });
        this.requestDraw();
      });
      const release = e => { if (this.drag && this.drag.id === e.pointerId) { this.drag = null; this.onCamera({ ...this.current.camera }); } };
      this.svg.addEventListener('pointerup', release); this.svg.addEventListener('pointercancel', release);
      this.svg.addEventListener('keydown', e => {
        const turns = { ArrowLeft: [-.16, 0], ArrowRight: [.16, 0], ArrowUp: [0, .12], ArrowDown: [0, -.12] };
        if (turns[e.key]) { e.preventDefault(); this.turn(...turns[e.key]); }
        if (e.key === 'Home') { e.preventDefault(); this.reset(); }
      });
      this.observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.resize()) : null;
      this.observer?.observe(this.svg); this.resize();
    }
    normal(pts) {
      for (let i = 1; i < pts.length - 1; i++) { const n = cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0])); if (norm(n) > 1e-10) return unit(n); }
      return [0, 0, 1];
    }
    resize() {
      this.width = Math.max(220, this.svg.clientWidth || 600); this.height = this.svg.clientHeight || 420;
      this.labelMetrics.clear();
      this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`); this.requestDraw();
    }
    requestDraw() { if (this.raf !== null) return; this.raf = requestAnimationFrame(() => { this.raf = null; this.draw(); }); }
    destroy() { this.observer?.disconnect(); if (this.raf !== null) cancelAnimationFrame(this.raf); }
    update(current) { this.current = current; this.svg.classList.toggle('plane-view', !!current.planeView); this.draw(); }
    turn(yaw, pitch) {
      if (!this.current || this.current.planeView) return;
      this.current.camera.yaw += yaw; this.current.camera.pitch = clamp(this.current.camera.pitch + pitch, -1.45, 1.45);
      this.onCamera({ ...this.current.camera }); this.draw();
    }
    reset() {
      if (!this.current) return;
      this.current.camera = { ...(this.data.initialCamera || { yaw: -.65, pitch: .46 }) };
      this.onCamera({ ...this.current.camera }); this.draw();
    }
    measureLabel(label, focused) {
      const key = (focused ? 'focus|' : 'normal|') + label;
      if (this.labelMetrics.has(key)) return this.labelMetrics.get(key);
      const probe = svgEl('text', { x: 0, y: 0, class: 'model-label' + (focused ? ' focused' : ''), opacity: 0, 'aria-hidden': 'true' }, label);
      this.svg.append(probe);
      const style = getComputedStyle(probe);
      const box = probe.getBBox();
      let metrics = { x: box.x, y: box.y, width: box.width, height: box.height };
      // getBBox measures the actual SVG font, including Unicode subscripts.
      // A detached/hidden portal may have no SVG box yet; Canvas uses the same font.
      if (!(metrics.width > 0 && metrics.height > 0)) {
        const context = document.createElement('canvas').getContext('2d');
        context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(' ');
        const m = context.measureText(label), size = parseFloat(style.fontSize) || 20;
        metrics = { x: -(m.actualBoundingBoxLeft || 0), y: -(m.actualBoundingBoxAscent || size), width: Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0)), height: (m.actualBoundingBoxAscent || size) + (m.actualBoundingBoxDescent || size * .2) };
      }
      probe.remove(); this.labelMetrics.set(key, metrics); return metrics;
    }
    draw() {
      if (!this.current) return;
      const c = this.current, points = this.data.points;
      const plane = c.planeId ? this.planes.get(c.planeId) : null;
      const planePts = plane ? plane.vertices.map(n => points[n]).filter(Boolean) : [];
      const nPlane = planePts.length > 2 ? this.normal(planePts) : null;
      const originPlane = planePts[0] || [0, 0, 0];
      const inPlane = p => !nPlane || Math.abs(dot(nPlane, sub(p, originPlane))) < this.bodyRadius * 1e-7;
      const flat = c.planeView && !!nPlane;
      let known = new Set([...this.bodyNames, ...(this.data.given || [])]);
      let segments = [];
      for (let i = 0; i < c.viewCount; i++) {
        const step = this.lesson.steps[i];
        (step.points || []).forEach(p => known.add(p));
        for (const seg of step.segments || []) { known.add(seg.a); known.add(seg.b); segments.push({ ...seg, step: i, plane: step.plane }); }
      }
      known = new Set([...known].filter(name => points[name] && (!flat || inPlane(points[name]))));
      segments = segments.filter(s => (!flat || (inPlane(points[s.a]) && inPlane(points[s.b]))) && ((c.showHelpers && !c.cleanView) || s.kind !== 'helper' || s.step === c.viewCount - 1));
      if (!c.showHelpers || c.cleanView) {
        const useful = new Set(this.bodyNames.concat(this.data.given || [], segments.flatMap(s => [s.a, s.b]), plane ? plane.vertices : []));
        known = new Set([...known].filter(n => useful.has(n)));
      }
      const priority = new Set((c.viewCount ? this.lesson.steps[c.viewCount - 1].points || [] : []).concat(c.viewCount ? (this.lesson.steps[c.viewCount - 1].segments || []).flatMap(s => [s.a, s.b]) : this.data.given || []));
      let labelNames = c.cleanView ? new Set([...(this.data.given || []), ...segments.flatMap(s => [s.a, s.b]), ...(plane?.vertices || []), ...priority]) : known;
      if (guidanceFor(this.lesson) && Array.isArray(guidanceNames(this.lesson))) {
        const relevant = new Set(guidanceNames(this.lesson));
        this.lesson.steps.slice(0, c.viewCount).forEach(step => {
          (step.points || []).forEach(name => relevant.add(name));
          (step.segments || []).forEach(line => { relevant.add(line.a); relevant.add(line.b); });
        });
        const focusStep = this.lesson.steps[Math.max(0, c.viewCount - 1)];
        (c.focusNames || focusStep?.focusNames || []).forEach(name => relevant.add(name));
        labelNames = new Set([...relevant].filter(name => known.has(name)));
      }
      const yaw = c.camera.yaw, pitch = c.camera.pitch;
      const rotate = p => {
        const d = p[0] * Math.sin(yaw) + p[1] * Math.cos(yaw);
        return [p[0] * Math.cos(yaw) - p[1] * Math.sin(yaw), p[2] * Math.cos(pitch) - d * Math.sin(pitch), p[2] * Math.sin(pitch) + d * Math.cos(pitch)];
      };
      let u = [1, 0, 0], v = [0, 1, 0];
      if (flat) { u = unit(sub(planePts.find(p => norm(sub(p, originPlane)) > 1e-8) || add(originPlane, [1, 0, 0]), originPlane)); v = unit(cross(nPlane, u)); }
      const raw = p => flat ? [dot(sub(p, originPlane), u), dot(sub(p, originPlane), v), 0] : rotate(sub(p, this.bodyCenter));
      const extent = [...known].map(n => raw(points[n]));
      if (planePts.length) extent.push(...planePts.map(raw));
      if (!extent.length) extent.push([0, 0, 0]);
      const xmin = Math.min(...extent.map(p => p[0])), xmax = Math.max(...extent.map(p => p[0]));
      const ymin = Math.min(...extent.map(p => p[1])), ymax = Math.max(...extent.map(p => p[1]));
      const scale = Math.min((this.width - 90) / Math.max(xmax - xmin, this.bodyRadius * .3), (this.height - 95) / Math.max(ymax - ymin, this.bodyRadius * .3));
      const center = [(xmin + xmax) / 2, (ymin + ymax) / 2];
      const project = p => { const r = raw(p); return [this.width / 2 + (r[0] - center[0]) * scale, this.height / 2 - (r[1] - center[1]) * scale, r[2]]; };
      const path = names => names.map((name, i) => { const p = project(points[name]); return `${i ? 'L' : 'M'}${p[0].toFixed(3)} ${p[1].toFixed(3)}`; }).join(' ');
      const line = (a, b, cls, attrs) => { const pa = project(points[a]), pb = project(points[b]); return svgEl('line', { x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1], class: cls, ...(attrs || {}) }); };
      const title = svgEl('title', {}, this.lesson.title);
      const desc = svgEl('desc', {}, (plane ? 'Работаем в плоскости ' + plane.label + '. ' : '') + 'Показано шагов: ' + c.viewCount + ' из ' + this.lesson.steps.length + '. ' + (flat ? 'Плоский вид этой плоскости.' : 'Точная пространственная конфигурация, которую можно вращать.'));
      const g = svgEl('g', { 'aria-hidden': 'true' });
      if (!flat) {
        this.faceInfo.slice().sort((a, b) => raw(a.center)[2] - raw(b.center)[2]).forEach(face => {
          const front = rotate(face.normal)[2] >= -1e-8;
          g.append(svgEl('path', { d: path(face.vertices) + ' Z', fill: front ? '#f0f6f1' : '#f7faf7', 'fill-opacity': front ? '.53' : '.16', stroke: 'none' }));
        });
      }
      if (planePts.length >= 3) g.append(svgEl('path', { d: path(plane.vertices) + ' Z', class: 'model-plane', 'data-active-plane': plane.id }));
      if (c.showResult && this.lesson.result?.polygon?.length >= 3) {
        const poly = this.lesson.result.polygon;
        if (!flat || poly.every(name => inPlane(points[name]))) g.append(svgEl('path', { d: path(poly) + ' Z', class: 'model-final', 'data-section-polygon': poly.join('-') }));
      }
      for (const [a, b] of this.data.edges || []) {
        if (flat && !(inPlane(points[a]) && inPlane(points[b]))) continue;
        const adjacent = this.adjacency.get(edgeKey(a, b)) || [];
        const hidden = !flat && adjacent.length === 2 && adjacent.every(i => rotate(this.faceInfo[i].normal)[2] < -1e-8);
        g.append(line(a, b, 'model-edge' + (hidden ? ' hidden' : ''), { 'data-edge': a + '-' + b, 'data-hidden': hidden }));
      }
      // Repeated construction of an already visible segment changes its focus, not its geometry.
      const visibleSegments = new Map();
      segments.forEach(s => {
        const key = edgeKey(s.a, s.b), old = visibleSegments.get(key);
        // A later auxiliary reuse must not turn a verified section boundary
        // into a dashed helper. Preserve its section role and latest focus.
        visibleSegments.set(key, old?.kind === 'section' && s.kind === 'helper' ? { ...s, kind: 'section' } : s);
      });
      for (const s of visibleSegments.values()) g.append(line(s.a, s.b, 'model-segment' + (s.kind === 'helper' ? ' helper' : '') + (s.step === c.viewCount - 1 ? ' current' : ''), { 'data-segment': s.a + '-' + s.b, 'data-kind': s.kind || 'section', 'data-step': s.step + 1 }));
      const allProjected = [...known].map(name => ({ name, p: project(points[name]), focused: priority.has(name) }));
      const projected = allProjected.filter(p => labelNames.has(p.name));
      const textGroup = svgEl('g');
      const pointBoxes = allProjected.map(({ p }) => [p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5]);
      const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
      const lineObstacles = [...(this.data.edges || []), ...[...visibleSegments.values()].map(s => [s.a, s.b])].filter(([a,b]) => !flat || (inPlane(points[a]) && inPlane(points[b]))).map(([a,b]) => [project(points[a]), project(points[b])]);
      const hitsBox = (a,b,box) => {
        let low=0,high=1;
        for(let axis=0;axis<2;axis++) {
          const d=b[axis]-a[axis];
          if(Math.abs(d)<1e-9) { if(a[axis]<box[axis] || a[axis]>box[axis+2]) return false; }
          else { const u=(box[axis]-a[axis])/d,v=(box[axis+2]-a[axis])/d;low=Math.max(low,Math.min(u,v));high=Math.min(high,Math.max(u,v));if(low>high)return false; }
        }
        return true;
      };
      const placements = [];
      projected.sort((a, b) => Number(b.focused) - Number(a.focused) || a.name.localeCompare(b.name)).forEach(item => {
        const {name,p,focused}=item, label=displayName(name), metric=this.measureLabel(label,focused);
        const w=metric.width+7,h=metric.height+7,padding=7;
        const outward=Math.atan2(p[1]-this.height/2,p[0]-this.width/2), candidates=[];
        for(const gap of [9,19,32,48,68,92]) for(let k=0;k<16;k++) {
          const angle=outward+k*Math.PI/8, dx=Math.cos(angle),dy=Math.sin(angle);
          const cx=p[0]+dx*(w/2+gap),cy=p[1]+dy*(h/2+gap);
          const left=clamp(cx-w/2,padding,Math.max(padding,this.width-padding-w));
          const top=clamp(cy-h/2,padding,Math.max(padding,this.height-padding-h));
          const box=[left,top,left+w,top+h];
          candidates.push({box,x:left+3.5-metric.x,y:top+3.5-metric.y,distance:Math.hypot(left+w/2-p[0],top+h/2-p[1]),anglePenalty:k===0?0:1});
        }
        const cost=(candidate,others)=>others.reduce((sum,other)=>sum+overlap(candidate.box,other.box)*1200,0)+pointBoxes.reduce((sum,box)=>sum+overlap(candidate.box,box)*220,0)+lineObstacles.reduce((sum,[a,b])=>sum+(hitsBox(a,b,candidate.box)?23:0),0)+candidate.distance*.55+candidate.anglePenalty;
        let best=candidates[0],bestCost=Infinity;
        for(const candidate of candidates){const cst=cost(candidate,placements);if(cst<bestCost){best=candidate;bestCost=cst;}}
        placements.push({...item,label,metric,candidates,cost,...best});
      });
      // A second pass lets an earlier label move when a later one has few options.
      for(let pass=0;pass<2;pass++) for(let i=placements.length-1;i>=0;i--) {
        const item=placements[i],others=placements.filter((_,j)=>j!==i);
        let best=item,bestCost=item.cost(item,others);
        for(const candidate of item.candidates){const cst=item.cost(candidate,others);if(cst<bestCost-.01){best=candidate;bestCost=cst;}}
        if(best!==item)Object.assign(item,best);
      }
      for(const {name,p,focused,label,x,y,box,distance} of placements) {
        const endX=clamp(p[0],box[0],box[2]),endY=clamp(p[1],box[1],box[3]);
        if (distance > 36) textGroup.append(svgEl('line', { x1: p[0], y1: p[1], x2: endX, y2: endY, class: 'model-leader' }));
        textGroup.append(svgEl('circle', { cx: p[0], cy: p[1], r: focused ? 3.5 : 2.7, class: 'model-point' + (focused ? ' focused' : ''), 'data-point': name }));
        textGroup.append(svgEl('text', { x, y, 'text-anchor': 'start', class: 'model-label' + (focused ? ' focused' : ''), 'data-label': name }, label));
      }
      g.append(textGroup); this.svg.replaceChildren(title, desc, g);
    }
  }

  function renderShell() {
    const header = el('header', { class: 'app-header' });
    const title = el('div'); title.append(para('ГЕОМЕТРИЯ · ПОСТРОЕНИЯ', 'eyebrow'), el('h1', {}, C.title || 'Сечения: от плоскости к доказательству'), para(C.subtitle || 'Сначала плоскость. Затем прямая.', 'subtitle'));
    header.append(title, el('div', { class: 'brand' }, 'MathExam'));
    const rule = el('details', { class: 'principle principle-compact' });
    rule.append(el('summary', {}, 'Сначала плоскость, затем линия'), para('Назови рабочую плоскость. Объясни, почему нужные точки лежат в ней. Только после этого проводи прямую.'), para('Каждая сторона сечения лежит в одной грани тела и в секущей плоскости. Вспомогательная прямая может продолжаться за пределы тела.'));
    const layout = el('div', { class: 'layout' });
    const catalog = el('details', { class: 'catalog' }); catalog.open = catalogOpen;
    catalog.append(el('summary', {}, 'Уроки и задачи'));
    catalog.addEventListener('toggle', () => { catalogOpen = catalog.open; });
    catalog.append(el('label', { for: 'catalog-query', class: 'catalog-search-label' }, 'Тема, навык или номер'));
    const query = el('input', { id: 'catalog-query', type: 'search', placeholder: 'Например: куб, 14, след', autocomplete: 'off', maxlength: 200 });
    query.addEventListener('input', () => { catalogQuery = query.value.slice(0, 200); renderCatalog(); });
    const filter = el('select', { 'aria-label': 'Раздел курса' }); filter.append(el('option', { value: '' }, 'Все разделы'));
    for (const m of C.modules || []) filter.append(el('option', { value: m.id }, m.title));
    filter.addEventListener('change', () => { catalogFilter = filter.value; renderCatalog(); });
    const filterBox=el('div',{class:'catalog-filters'});
    const level=el('select',{'aria-label':'Уровень задачи','data-catalog-filter':'level'});
    [['','Все уровни'],['A','Уровень A'],['B','Уровень B'],['C','Уровень C']].forEach(([value,label])=>level.append(el('option',{value},label)));
    level.addEventListener('change',()=>{catalogLevel=level.value;renderCatalog();});
    const origin=el('select',{'aria-label':'Происхождение задачи','data-catalog-filter':'origin'});
    [['','Все источники'],['author','Авторские'],['source','Пособия']].forEach(([value,label])=>origin.append(el('option',{value},label)));
    origin.addEventListener('change',()=>{catalogOrigin=origin.value;renderCatalog();});
    filterBox.append(level,origin);
    catalogCount = para('', 'catalog-count'); catalogList = el('div', { class: 'catalog-list' });
    catalog.append(query, filter, filterBox, catalogCount, catalogList);
    currentMain = el('main', { class: 'course-main' }); layout.append(catalog, currentMain);
    const source = C.source || {};
    const footer = el('footer', { class: 'app-footer' });
    const sourceText=typeof source==='string'?source:[source.authors,source.title,source.publisher,source.year].filter(Boolean).join(' · ');
    if(sourceText)footer.append(para(sourceText));
    footer.append(para(board ? 'Общий разбор не меняет личный прогресс. При выборе другой карточки начинается новое построение. Ответы на доказательства проверяются с преподавателем.' : 'Прогресс и черновик сохраняются в этом браузере. Поворот модели меняет вид, но не геометрию. Ответы на доказательства проверяются с преподавателем.'));
    if (!board && location.protocol !== 'file:') footer.append(el('a', { href: '/stereo-course/sections/download/Sections_From_Zero.html', download: 'Sections_From_Zero.html' }, 'Скачать весь курс для работы без интернета'));
    live = el('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
    host.replaceChildren(header, rule, layout, footer, live);
    renderCatalog(); renderLesson();
  }

  function renderCatalog() {
    if (!catalogList) return;
    const matching = C.lessons.filter(l => (!catalogFilter || l.module === catalogFilter) && (!catalogLevel || String(l.level || '').toUpperCase()===catalogLevel) && (!catalogOrigin || (l.source?.kind==='author'?'author':'source')===catalogOrigin) && (!catalogQuery || [l.title, l.id, l.condition, sourceLabel(l,false),...lessonSkills(l)].filter(v => v !== undefined).join(' ').toLowerCase().includes(catalogQuery.trim().toLowerCase())));
    catalogCount.textContent = matching.length + ' из ' + C.lessons.length + ' карточек';
    const frag = document.createDocumentFragment();
    for (const l of matching) {
      const s = taskState(l);
      const b = button('', () => switchLesson(l.id, true), 'catalog-item' + (l.id === state.current ? ' current' : ''), { 'aria-current': l.id === state.current ? 'page' : 'false', 'data-lesson-id': l.id });
      const title = el('span');
      if (s.revealed === l.steps.length && s.revealed) title.append(el('span', { class: 'progress-dot', 'aria-label': 'Построение завершено' }));
      title.append(document.createTextNode(l.title));
      b.append(title, el('small', {}, [l.level?'Уровень '+l.level:'',sourceLabel(l,true)].filter(Boolean).join(' · ')));
      frag.append(b);
    }
    if (!matching.length) frag.append(para('Таких карточек не найдено. Попробуй другой номер или слово.', 'muted small'));
    catalogList.replaceChildren(frag);
  }

  function activePlane(lesson, s) {
    if (s.mode === 'choose') return null;
    if (s.viewCount < s.revealed) return s.viewCount ? lesson.steps[s.viewCount - 1].plane : null;
    if (s.justBuilt && s.revealed) return lesson.steps[s.revealed - 1].plane;
    const upcoming = lesson.steps[s.revealed];
    if (upcoming && (s.mode === 'study' || s.approved === s.revealed)) return upcoming.plane;
    if (s.viewCount) return lesson.steps[s.viewCount - 1].plane;
    return null;
  }
  function updateScene(lesson, s, caption) {
    const id = activePlane(lesson, s), p = planesFor(lesson).get(id);
    caption.textContent = p ? (s.planeView ? 'Плоский вид: ' : 'Плоскость шага: ') + p.label : 'Исходная фигура';
    const focusStep=s.viewCount<s.revealed?(s.viewCount?lesson.steps[s.viewCount-1]:lesson.steps[0]):s.justBuilt?lesson.steps[s.revealed-1]:lesson.steps[Math.min(s.revealed,lesson.steps.length-1)];
    renderer?.update({ viewCount: s.viewCount, planeId: id, planeView: s.planeView && !!p, camera: { ...s.camera }, showHelpers: s.showHelpers, cleanView:s.cleanView, showResult: s.showResult && s.viewCount === lesson.steps.length,focusNames:focusStep?.focusNames || [] });
  }
  function renderLesson() {
    const lesson = lessonMap.get(state.current), s = taskState(lesson), planes = planesFor(lesson);
    const starter = guidanceFor(lesson);
    document.querySelector('.layout')?.classList.toggle('starter-layout', !!starter);
    currentMain.classList.toggle('starter-lesson', !!starter);
    if (starter && lastRenderedId !== lesson.id) { const catalog = document.querySelector('.catalog'); if (catalog) catalog.open = false; }
    const oldScroll = window.scrollY;
    renderer?.destroy(); renderer = null;
    const fragment = document.createDocumentFragment();
    const topbar = el('div', { class: 'lesson-topbar' });
    topbar.append(el('span', { class: 'breadcrumbs' }, lesson.starter ? 'Первые шаги · ступень ' + lesson.starter.stage + ' из 6' : lesson.scaffold ? 'К основным задачам' : moduleMap.get(lesson.module)?.title || lesson.module || 'Курс'), el('span', { class: 'lesson-position' }, (C.lessons.indexOf(lesson) + 1) + ' / ' + C.lessons.length));
    const header = el('section', { class: 'lesson-header' });
    header.append(el('h2', { id: 'lesson-title', tabindex: '-1' }, lesson.title), para(lesson.condition, 'lesson-condition'));
    if (!board) header.append(boardLink(lesson));
    const labels=el('div',{class:'lesson-tags'});
    if(lesson.level)labels.append(el('span',{class:'level-tag'},'Уровень '+lesson.level));
    for(const skill of lessonSkills(lesson))labels.append(el('span',{class:'skill-tag'},skill));
    if(labels.childNodes.length && !starter)header.append(labels);
    if (lesson.source && !starter) {
      header.append(para(sourceLabel(lesson,false), 'source-line'));
    }
    if (starter) {
      header.prepend(para(({model:'Смотрим вместе',guided:'Пробуем с опорой',transfer:'Новый пример: пробую сам'})[starter.phase] || (lesson.scaffold?'Новый приём':'Первые шаги'),'starter-phase'));
      if (starter.glossary?.length) {
        const words=el('div',{class:'starter-glossary'});
        starter.glossary.forEach(item=>{const row=para('');row.append(el('strong',{},item.term+' — '),math(item.text));words.append(row);});
        const dictionary=details('Новые слова',[words],()=>{if(starter.phase!=='model')markHelp(lesson.id,'Словарь новых слов');},s.glossaryOpen);
        dictionary.addEventListener('toggle',()=>{s.glossaryOpen=dictionary.open;save();});header.append(dictionary);
      }
    }
    const work = el('section', { class: 'workbench', 'aria-label': 'Модель и пошаговое построение' });
    const modelPanel = el('div', { class: 'model-panel' });
    frame = el('div', { class: 'model-frame' }); const caption = el('div', { class: 'model-caption', 'aria-live': 'polite' }); frame.append(caption);
    modelPanel.append(frame, para(starter ? 'Можно повернуть модель пальцем или мышью.' : 'Поворачивай мышью, пальцем или стрелками. Home — исходный вид.', 'model-help'));
    if (lesson.goal) modelPanel.append(para(lesson.goal, 'lesson-goal'));
    const controls = el('div', { class: 'model-controls', role: 'group', 'aria-label': 'Управление моделью' });
    if (!starter) [['←', -.17, 0, 'Повернуть влево'], ['→', .17, 0, 'Повернуть вправо'], ['↑', 0, .12, 'Повернуть вверх'], ['↓', 0, -.12, 'Повернуть вниз']].forEach(([label, a, b, aria]) => controls.append(button(label, () => renderer?.turn(a, b), 'rotation', { 'aria-label': aria, disabled: s.planeView })));
    controls.append(button('Исходный вид', () => { s.camera = { ...(lesson.model.initialCamera || { yaw: -.65, pitch: .46 }) }; save(); renderer?.reset(); }, 'reset-camera'));
    const planeButton = button(s.planeView ? 'Объёмная модель' : 'В этой плоскости', () => { s.planeView = !s.planeView; save(); renderLesson(); }, 'plane-toggle', { 'aria-pressed': s.planeView, disabled: !activePlane(lesson, s) });
    controls.append(planeButton); modelPanel.append(controls);
    const extras = el('div', { class: 'model-extras' });
    const helperLabel = el('label'); const helperCheck = el('input', { type: 'checkbox', checked: s.showHelpers });
    helperCheck.addEventListener('change', () => { s.showHelpers = helperCheck.checked; save(); updateScene(lesson, s, caption); });
    helperLabel.append(helperCheck, document.createTextNode('Вспомогательные линии')); extras.append(helperLabel); if (!starter) modelPanel.append(extras);
    extras.append(button('Чистый вид',()=>{s.cleanView=!s.cleanView;save();renderLesson();},'clean-view',{ 'aria-pressed':s.cleanView,'data-action':'clean-view',title:'Оставить подписи и линии, нужные для текущего построения'}));
    const legend = el('div', { class: 'legend', 'aria-label': 'Обозначения на модели' });
    [['plane', 'Плоскость'], ['current', 'Текущий шаг'], ['', 'Построено'], ['aux', 'Помощь']].forEach(([cls, text]) => legend.append(el('span', { class: cls }, text)));
    modelPanel.append(legend);
    if (!starter) modelPanel.append(para('Штрихи на рёбрах обозначают невидимую часть фигуры. Чертёж помогает рассуждать; совпадение линий на экране не доказывает их пересечение.', 'model-note'));
    if ((lesson.theory || []).length) {
      const theory = details('Нужная теория', lesson.theory.map(t => para(t)), () => { s.helpUsed = true; s.theoryOpen = true; save(); refreshStatus(lesson, s); }, s.theoryOpen);
      theory.addEventListener('toggle', () => { s.theoryOpen = theory.open; save(); }); theory.classList.add('theory-details'); modelPanel.append(theory);
    }
    const stepPanel = el('div', { class: 'step-panel' });
    renderStepPanel(stepPanel, lesson, s, planes);
    if(lesson.practiceTopic && !starter && !board)stepPanel.append(button('Потренировать этот шаг',()=>{
      save(); window.dispatchEvent(new CustomEvent('sections:practice',{detail:{topic:lesson.practiceTopic,lessonId:lesson.id,step:s.revealed}}));
    },'practice-step ghost',{'data-action':'practice-step'}));
    work.append(modelPanel, stepPanel);
    fragment.append(topbar, header, work);
    if ((lesson.notes || []).length) {
      const notes = details(lesson.source?.kind==='author'?'Уточнения к задаче и модели':'Уточнения к пособию и модели', lesson.notes.map(n => para(n)), () => {
        s.notesOpen = true; s.helpUsed = true; save(); refreshStatus(lesson, s);
      }, s.notesOpen);
      notes.classList.add('task-notes');
      notes.addEventListener('toggle', () => { s.notesOpen = notes.open; save(); });
      fragment.append(notes);
    }
    if (!starter || s.revealed) fragment.append(renderHistory(lesson, s, planes));
    if(s.revealed===lesson.steps.length && s.revealed>0 && lesson.calculationSteps?.length)fragment.append(renderCalculations(lesson,s));
    const bottom = renderBottom(lesson, s); if (bottom.childNodes.length) fragment.append(bottom);
    if (starter && lesson.source) { const metadata=details('Сведения о карточке',[para(sourceLabel(lesson,false),'source-line')]);metadata.classList.add('starter-metadata');fragment.append(metadata); }
    const navigation = el('nav', { class: 'lesson-navigation', 'aria-label': 'Переход между заданиями' });
    const i = C.lessons.indexOf(lesson);
    const returnToStage=()=>{if(board){const catalog=document.querySelector('.catalog');catalog.open=true;catalog.querySelector('summary').focus();catalog.scrollIntoView({block:'start'});}else window.dispatchEvent(new CustomEvent('sections:route',{detail:lesson.pathStageId?{stageId:lesson.pathStageId}:{}}));};
    if (lesson.pathStageId) {
      const previous=lesson.pathPreviousId && lessonMap.has(lesson.pathPreviousId),next=lesson.pathNextId && lessonMap.has(lesson.pathNextId);
      navigation.append(button(previous?'← Предыдущий пример':board?'Все задания':'К моему этапу',previous?()=>switchLesson(lesson.pathPreviousId,true):returnToStage,'ghost',{'data-action':previous?'path-previous':'starter-route','data-path-action':'previous'}));
      navigation.append(button(next?'Следующий пример →':board?'Все задания':'К проверке этапа →',next?()=>switchLesson(lesson.pathNextId,true):returnToStage,s.revealed===lesson.steps.length?'primary':'ghost',{'data-action':starter?'starter-next':'path-next','data-path-action':'next'}));
    } else if (starter) {
      navigation.append(button(board?'Все задания':'К моему маршруту',returnToStage,'ghost',{'data-action':'starter-route'}));
      if (starter.nextId && lessonMap.has(starter.nextId)) navigation.append(button(s.revealed===lesson.steps.length?'К следующему примеру →':'Следующий пример →',()=>switchLesson(starter.nextId,true),s.revealed===lesson.steps.length?'primary':'ghost',{'data-action':'starter-next'}));
      else navigation.append(button(board?'Все задания':'Продолжить курс →',returnToStage,'primary',{'data-action':'starter-next'}));
    } else navigation.append(button('← Предыдущее задание', () => switchLesson(C.lessons[i - 1].id, true), 'ghost', { disabled: i === 0 }), button('Следующее задание →', () => switchLesson(C.lessons[i + 1].id, true), 'ghost', { disabled: i === C.lessons.length - 1 }));
    fragment.append(navigation);
    currentMain.replaceChildren(fragment);
    renderer = new Scene(frame, lesson, camera => { s.camera = camera; save(); }); updateScene(lesson, s, caption);
    if (lastRenderedId === lesson.id) window.scrollTo({ top: oldScroll, behavior: 'auto' });
    lastRenderedId = lesson.id;
    window.dispatchEvent(new CustomEvent('sections:lesson',{detail:{id:lesson.id,lessonId:lesson.id}}));
  }

  function renderStepPanel(panel, lesson, s, planes) {
    if (s.mode === 'choose') {
      const choice = el('div', { class: 'mode-choice' });
      const startStudy=()=>{s.mode='study';s.workedSeen=true;save();renderLesson();renderCatalog();};
      const startPractice=()=>{s.mode='practice';if(guidanceFor(lesson)?.phase==='guided')markHelp(lesson.id,'Учебная попытка с опорой');save();renderLesson();};
      if (guidanceFor(lesson)) {
        const phase=guidanceFor(lesson).phase,model=phase==='model';
        choice.append(el('h3',{},model?(lesson.scaffold?'Разберём новый приём':'Посмотрим одно действие'):phase==='guided'?'Теперь попробуем с опорой':'Теперь новый пример'),para(guidanceFor(lesson).intro || (lesson.scaffold?'Назовём рабочую плоскость. Затем обоснуем каждую новую линию.':'Сначала назовём плоскость. Потом выполним одно действие.')));
        choice.append(button(model?'Сделаем вместе':phase==='guided'?'Попробую с опорой':'Попробую сам',model?startStudy:startPractice,'primary',{'data-action':model?'start-study':'start-practice'}));
        const other=details('Другой способ работы',[button(model?'Попробую сам':'Посмотреть разбор',model?startPractice:startStudy,'ghost',{'data-action':model?'start-practice':'start-study'})]);other.classList.add('starter-other-mode');choice.append(other);
      } else {
        choice.append(el('h3', {}, 'Как будем строить?'), para('В обоих режимах сначала определяем плоскость. Новые линии появляются только после твоего действия.'));
        choice.append(button('Разобрать по шагам', startStudy, 'primary', { 'data-action': 'start-study' }));
        choice.append(button('Построить самостоятельно', startPractice, '', { 'data-action': 'start-practice' }));
      }
      if (s.workedSeen || s.helpUsed || s.resultSeen) choice.append(para('Разбор или подсказки этой задачи уже открывались. Новая попытка сохранит эту отметку.', 'small muted'));
      panel.append(choice); return;
    }
    const meter = el('div', { class: 'step-meter' });
    meter.append(el('span', {}, (guidanceFor(lesson)?'Сделано: ':'Построено: ') + s.revealed + ' из ' + lesson.steps.length), el('span', { class: 'learning-status' }, statusText(s, lesson)));
    const progress = el('div', { class: 'step-progress', role: 'progressbar', 'aria-valuenow': s.revealed, 'aria-valuemin': 0, 'aria-valuemax': lesson.steps.length, 'aria-label': 'Выполненные шаги' }); const fill = el('span'); fill.style.width = (100 * s.revealed / Math.max(1, lesson.steps.length)) + '%'; progress.append(fill);
    panel.append(meter, progress);
    if (s.viewCount < s.revealed) {
      const box = el('div', { class: 'step-card' });
      box.append(el('h3', {}, s.viewCount ? 'Рисунок после шага ' + s.viewCount : 'Исходный рисунок'), para('Построенные шаги и ответы сохранены. Сейчас ты рассматриваешь более ранний вид модели.'));
      box.append(button('Вернуться к текущему построению', () => { s.viewCount = s.revealed; save(); renderLesson(); }, 'primary'));
      panel.append(box); return;
    }
    const step = lesson.steps[s.revealed];
    if (s.justBuilt && step) {
      const completed = lesson.steps[s.revealed - 1];
      const box = el('div', { class: 'step-card' });
      box.append(el('h3', {}, 'Шаг ' + s.revealed + ' выполнен'), para('Плоскость: ' + (planes.get(completed.plane)?.label || completed.plane), 'plane-tag'), para(completed.action));
      box.append(para(guidanceFor(lesson) && !(completed.segments||[]).length?'Посмотри на результат этого шага. Объяснение осталось ниже.':'Посмотри, где лежит новая линия. Предыдущие построения сохранены.', 'small'));
      box.append(button('К следующему шагу', () => { s.justBuilt = false; save(); renderLesson(); }, 'primary action-button', { 'data-action': 'next-step' }));
      panel.append(box);
    } else if (!step) {
      const box = el('div', { class: 'step-card' });
      box.append(el('h3', {}, guidanceFor(lesson)?'Этот пример закончен':'Построение завершено'), para(guidanceFor(lesson)?(guidanceFor(lesson).recall || 'Расскажи своими словами, что мы сделали и в какой плоскости работали.'):'Проверь, в какой плоскости находится каждая линия и как получены новые точки. Для сечения дополнительно проверь, что его граница замкнута.'));
      if (!guidanceFor(lesson)) box.append(para('Все шаги остались ниже. Объясни вслух, в какой плоскости проведена каждая новая прямая.', 'small'));
      if (guidanceFor(lesson) && lesson.check) box.append(button('Ответить на короткий вопрос',()=>document.getElementById('starter-check')?.scrollIntoView({block:'start',behavior:'auto'}),'primary',{'data-action':'starter-check-scroll'}));
      if(lesson.calculationSteps?.length)box.append(para('Теперь можно завершить решение самостоятельно или открыть его продолжение по одному шагу ниже.','small'));
      panel.append(box);
    } else {
      const box = el('div', { class: 'step-card', 'data-current-step': s.revealed + 1 });
      const plane = planes.get(step.plane);
      if (!plane) { box.append(para('Плоскость этого шага не найдена в данных. Построение остановлено.', 'feedback retry')); panel.append(box); return; }
      const approved = s.mode === 'study' || s.approved === s.revealed;
      const question=step.question;
      const questionReady=s.mode==='study' || !question || s.questionApproved===s.revealed;
      box.append(el('h3', {}, (s.revealed + 1) + '. ' + (approved ? questionReady?step.title:'Обоснуй построение' : 'Выбери плоскость действия')));
      if (!approved) {
        if (guidanceFor(lesson)?.phase==='guided' && (step.support || guidanceFor(lesson).support)) box.append(para(step.support || guidanceFor(lesson).support,'starter-support'));
        box.append(para(plannedAction(step, plane), 'action-text'));
        box.append(para(guidanceFor(lesson)?'В какой плоскости работаем?':'В какой плоскости выполним следующий шаг? Назови её, прежде чем проводить линию.'));
        const candidates = el('div', { class: 'plane-choice', role: 'group', 'aria-label': 'Выбери плоскость следующего построения' });
        const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        const planeAttempt=s.planeAttempts[s.revealed];
        if(planeAttempt?.wrong?.length){feedback.className='feedback retry';feedback.textContent=lesson.starter?'Вернись к условию. Найди грань, в которой находятся нужные точки.':lesson.scaffold?'Вернись к условию. Найди названную плоскость, которой принадлежат нужные точки или в которой задано направление.':'Проверь, где лежат обе нужные точки или точка и заданное направление. Пересечение изображений линий само по себе не доказывает их пересечение в пространстве.';}
        for (const p of choicePlanes(lesson, step, planes, s.revealed)) {
          const b = button(step.planeChoiceLabels?.[p.id] || p.label, () => {
            if (samePlane(lesson, p, plane)) {
              const attempt=s.planeAttempts[s.revealed] || {wrong:[]};attempt.selected=p.id;attempt.correct=true;s.planeAttempts[s.revealed]=attempt;
              s.approved = s.revealed; save(); renderLesson(); announce(question?'Плоскость выбрана. Выбери обоснование, прежде чем выполнять построение.':'Плоскость выбрана. Теперь объясни принадлежность точек и выполни построение.');
            } else {
              const attempt=s.planeAttempts[s.revealed] || {wrong:[]};attempt.selected=p.id;attempt.correct=false;if(!Array.isArray(attempt.wrong))attempt.wrong=[];if(!attempt.wrong.includes(p.id))attempt.wrong.push(p.id);s.planeAttempts[s.revealed]=attempt;
              markHelp(lesson.id,'Ошибка выбора плоскости, шаг '+(s.revealed+1));
              renderLesson(); announce('Для этого шага нужна другая плоскость. Проверь, где лежат нужные точки.');
            }
          }, planeAttempt?.wrong?.includes(p.id)?'incorrect':'', { 'data-plane-choice': p.id }); candidates.append(b);
        }
        box.append(candidates, feedback);
      } else {
        const tag = el('div', { class: 'plane-tag' }); tag.append(el('span', { class: 'plane-label' }, 'Работаем в плоскости'), document.createTextNode(plane.label));
        box.append(tag);
        if(!questionReady) {
          const questionBox=el('div',{class:'step-question','data-step-question':s.revealed+1});
          if(!Array.isArray(question.options) || !Number.isInteger(question.correct) || question.correct<0 || question.correct>=question.options.length) {
            questionBox.append(para('Вопрос этого шага требует уточнения в данных курса. Построение пока недоступно.','feedback retry'));
          } else {
            questionBox.append(para(plannedAction(step,plane),'action-text'),el('h4',{},'Почему это допустимо?'),para(question.prompt));
            const choices=el('div',{class:'reason-choice',role:'group','aria-label':question.prompt || 'Обоснование построения'});
            const attempt=s.questionAttempts[s.revealed];
            question.options.forEach((option,index)=>{
              const selected=attempt?.selected===index;
              const b=button('',()=>{
                const previous=s.questionAttempts[s.revealed] || {wrong:[]};
                previous.selected=index;previous.correct=index===question.correct;
                if(!Array.isArray(previous.wrong))previous.wrong=[];
                if(!previous.correct && !previous.wrong.includes(index))previous.wrong.push(index);
                s.questionAttempts[s.revealed]=previous;
                if(previous.correct){s.questionApproved=s.revealed;save();renderLesson();announce('Обоснование выбрано. Прочитай основания и выполни построение.');}
                else {markHelp(lesson.id,'Ошибка обоснования, шаг '+(s.revealed+1));renderLesson();announce('Это основание не подтверждает действие. '+(question.explanation || 'Проверь принадлежность точек и условие применяемого свойства.'));}
              },selected?'incorrect':'',{'data-reason-choice':index,'aria-pressed':selected});b.append(math(option));choices.append(b);
            });
            questionBox.append(choices);
            if(attempt && !attempt.correct)questionBox.append(para('Это основание не подтверждает действие. '+(question.explanation || 'Проверь принадлежность точек и условие применяемого свойства.'),'feedback retry'));
          }
          box.append(questionBox);
        } else {
        if (plane.description && !lesson.steps.slice(0, s.revealed).some(old => old.plane === step.plane)) box.append(para(plane.description, 'plane-definition'));
        box.append(para(step.reason, 'membership'), para(step.action, 'action-text'));
        if(question && s.mode==='practice' && question.explanation && !guidanceFor(lesson))box.append(para(question.explanation,'reason-explanation'));
        if (step.note) box.append(para(step.note, 'step-note'));
        box.append(button((step.segments || []).length ? 'Выполнить построение' : 'Выполнить этот шаг', () => {
          if (s.mode === 'practice' && s.approved !== s.revealed) return;
          if(s.mode==='practice' && question && s.questionApproved!==s.revealed)return;
          if (s.mode === 'study') s.workedSeen = true;
          if (s.mode === 'practice' && !s.workedSeen && !s.helpUsed && !s.resultSeen) s.independentSteps += 1;
          s.revealed += 1; s.viewCount = s.revealed; s.justBuilt = true; s.approved = -1; s.questionApproved=-1; save(); renderLesson(); renderCatalog();
          announce('Шаг выполнен. ' + (s.revealed < lesson.steps.length ? 'Теперь выбираем плоскость следующего шага.' : 'Построение завершено.'));
        }, 'primary action-button', { 'data-action': 'construct' }));
        }
      }
      const hintIndex = s.revealed;
      const hint = details('Хочешь подсказку?', [para(step.hint || step.reason)], () => {
        s.helpUsed = true; s.hintOpen[hintIndex] = true; if (!s.hints.includes(hintIndex)) s.hints.push(hintIndex); save(); refreshStatus(lesson, s);
      }, !!s.hintOpen[hintIndex]);
      hint.addEventListener('toggle', () => { s.hintOpen[hintIndex] = hint.open; save(); });
      hint.classList.add('step-hint'); box.append(hint); panel.append(box);
    }
    const nav = el('div', { class: 'step-navigation' });
    nav.append(button('Предыдущий вид', () => { s.viewCount = Math.max(0, s.viewCount - 1); save(); renderLesson(); }, 'ghost', { disabled: s.viewCount === 0 }));
    nav.append(button(s.mode === 'practice' ? 'Перейти к разбору' : 'Проверить себя', () => {
      s.mode = s.mode === 'practice' ? 'study' : 'practice'; if (s.mode === 'study') s.workedSeen = true;
      s.approved = -1; s.questionApproved=-1; save(); renderLesson();
    }, 'ghost'));
    if (s.revealed) nav.append(button('Начать построение заново', () => { s.revealed = 0; s.viewCount = 0; s.justBuilt = false; s.approved = -1; s.questionApproved=-1; s.planeAttempts={};s.questionAttempts={}; s.calculationRevealed=0; s.showResult = false; s.independentSteps = 0; s.mode = 'choose'; save(); renderLesson(); renderCatalog(); }, 'ghost', { 'data-action': 'restart' }));
    if (guidanceFor(lesson)) { const extra=details('Повторить или сменить способ',[nav]);extra.classList.add('starter-repeat');panel.append(extra); } else panel.append(nav);
    panel.append(para(modeNote(s,lesson), 'mode-note'));
  }

  function renderHistory(lesson, s, planes) {
    const section = el('section', { class: 'history', 'aria-label': 'Предыдущие шаги решения' });
    section.append(el('h3', {}, guidanceFor(lesson)?'Что уже сделали':'Ход построения'));
    if (!s.revealed) { section.append(para('Здесь будут оставаться выполненные шаги. Предыдущие объяснения не исчезают.', 'history-empty')); return section; }
    const list = el('ol', { class: 'history-list' });
    lesson.steps.slice(0, s.revealed).forEach((step, i) => {
      const item = el('li', { class: 'history-step' + (i === s.viewCount - 1 ? ' current-history' : ''), 'data-history-step': i + 1 });
      item.append(el('strong', {}, (i + 1) + '. ' + step.title), para('Плоскость: ' + (planes.get(step.plane)?.label || step.plane), 'history-plane'), para(step.reason), para(step.action));
      if (step.note) item.append(para(step.note, 'small muted'));
      item.append(button('Посмотреть этот шаг на модели', () => { s.viewCount = i + 1; save(); renderLesson(); document.querySelector('.model-frame').scrollIntoView({ block: 'start', behavior: 'auto' }); }));
      list.append(item);
    });
    section.append(list); return section;
  }

  function renderCalculations(lesson,s) {
    const steps=lesson.calculationSteps || [],section=el('section',{class:'calculations history',id:'calculation-steps','aria-label':'Вычисления и доказательство'});
    section.append(el('h3',{},'Вычисления и доказательство'),para('Открыто '+s.calculationRevealed+' из '+steps.length+' шагов. '+(lesson.result?.numeric?'Численный ответ можно проверить самостоятельно в поле ниже.':'Сначала запиши своё рассуждение в черновике.'),'small muted'));
    const list=el('ol',{class:'history-list calculation-list'});
    steps.slice(0,s.calculationRevealed).forEach((step,index)=>{
      const item=el('li',{class:'calculation-step history-step','data-calculation-step':index+1});
      item.append(el('strong',{},(index+1)+'. '+(typeof step==='object' && step.title?step.title:'Разбор шага')));
      if(typeof step==='string')item.append(para(step));
      else {
        const seen=new Set();
        for(const field of ['text','body','reason','expression','formula','action','explanation','conclusion']) {
          const entries=Array.isArray(step[field])?step[field]:[step[field]];
          for(const text of entries)if(typeof text==='string' && text.trim() && !seen.has(text)) {
            seen.add(text);item.append(para(text,['expression','formula'].includes(field)?'calculation-expression':''));
          }
        }
      }
      list.append(item);
    });
    if(s.calculationRevealed)section.append(list);
    if(s.calculationRevealed<steps.length) {
      if(s.mode==='practice')section.append(para('Открытие готового шага сохранится как помощь. Свой ход вычислений можно записать в черновике.','teacher-note'));
      section.append(button('Открыть шаг '+(s.calculationRevealed+1)+' из '+steps.length,()=>{
        s.calculationRevealed+=1;s.calculationSeen=true;
        if(s.mode==='practice')markHelp(lesson.id,'Просмотр вычислений и доказательства');else s.workedSeen=true;
        save();renderLesson();renderCatalog();announce('Открыт шаг вычислений '+s.calculationRevealed+'. Предыдущие шаги сохранены.');
      },'primary calculation-next',{'data-action':'next-calculation'}));
    } else section.append(para('Разбор вычислений открыт полностью. Объясни переходы своими словами и проверь итог ниже.','small'));
    return section;
  }

  function renderBottom(lesson, s) {
    const bottom = el('div', { class: 'task-bottom' });
    const ready = s.revealed === lesson.steps.length && s.revealed > 0;
    const calculationsReady=s.calculationRevealed===(lesson.calculationSteps || []).length;
    if (ready) {
      const result = el('section'); result.append(el('h3', {}, guidanceFor(lesson)?'Что получилось':'Проверка результата'));
      if (lesson.result?.numeric) {
        const num = lesson.result.numeric;
        const form = el('form', { class: 'answer-form' });
        const label = el('label', { for: 'numeric-answer' }, num.prompt || ('Введи численный результат' + (num.unit ? ' (' + num.unit + ')' : '')));
        const row = el('div', { class: 'input-row' });
        const input = el('input', { id: 'numeric-answer', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-describedby': 'answer-format', maxlength: 120 }); input.value = s.answer;
        input.addEventListener('input', () => { s.answer = input.value.slice(0, 120); s.answerChecked = false; s.correctAnswer = false; s.answerInvalid = false; save(); drawFeedback(); });
        const submit = button('Проверить', checkAnswer, 'primary', { 'data-action': 'check-numeric-answer' }); row.append(input, submit);
        const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        const drawFeedback = () => {
          if (s.answerInvalid) { feedback.className = 'feedback retry'; feedback.textContent = 'Введи число (например, 1,33) или обычную дробь вида 4/3. Корень можно вычислить и ввести десятичное приближение.'; return; }
          if (!s.answerChecked) { feedback.className = 'feedback'; feedback.textContent = ''; return; }
          feedback.className = 'feedback ' + (s.correctAnswer ? 'good' : 'retry');
          feedback.textContent = s.correctAnswer ? 'Численный результат совпал. Теперь объясни вычисления и построение.' : 'Пока результат не совпал. Проверь искомую величину, отношения отрезков и единицы.';
        };
        function checkAnswer() {
          const value = numericValue(input.value);
          if (!Number.isFinite(value)) { s.answer = input.value.slice(0, 120); s.answerInvalid = true; s.answerChecked = false; s.correctAnswer = false; save(); drawFeedback(); return; }
          s.answer = input.value.slice(0, 120); s.answerInvalid = false; s.answerChecked = true; s.correctAnswer = Math.abs(value - num.value) <= (num.tolerance || 1e-6); save(); drawFeedback();
        }
        // Cabinet frames forbid native form submission; checking stays local.
        input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); checkAnswer(); } });
        form.addEventListener('submit', e => { e.preventDefault(); checkAnswer(); });
        const toleranceText = num.tolerance && num.tolerance >= .001 ? ' Достаточно приближения с указанной в условии точностью.' : '';
        form.append(label, row, para('Введи число' + (num.unit ? ' в единицах «' + num.unit + '»' : '') + '; запятая, точка и дробь вида 4/3 допустимы.' + toleranceText, 'answer-format'), feedback);
        form.querySelector('.answer-format').id = 'answer-format'; drawFeedback(); result.append(form);
      }
      if (lesson.result?.text && calculationsReady) {
        const d = details('Показать вывод и ответ', [para(lesson.result.text)], () => {
          s.resultSeen = true; s.helpUsed = true; s.showResult = true; save(); refreshStatus(lesson, s);
          const caption = document.querySelector('.model-caption'); if (caption) updateScene(lesson, s, caption);
        }, s.showResult); d.classList.add('result-details');
        d.addEventListener('toggle', () => { if (!d.open) { s.showResult = false; save(); const caption = document.querySelector('.model-caption'); if (caption) updateScene(lesson, s, caption); } });
        result.append(d);
      } else if(lesson.result?.text && !calculationsReady) {
        result.append(para('Готовый вывод появится после последовательного разбора решения.'+(lesson.result?.numeric?' До этого можно проверить свой численный ответ.':''),'teacher-note'));
      }
      result.append(para(guidanceFor(lesson)?'Объясни свой ответ вслух. Можно рассказать преподавателю или записать ниже.':'Совпадение ответа не проверяет доказательство. Для полного решения объясни, почему каждая линия лежит в названной плоскости.', 'teacher-note'));
      bottom.append(result);
      if (lesson.check) {
        const check = lesson.check;
        const section = el('section',guidanceFor(lesson)?{id:'starter-check'}:{}); section.append(el('h3', {}, guidanceFor(lesson)?'Один короткий вопрос':'Проверь понимание'), para(check.question));
        const options = el('div', { class: 'check-options', role: 'group', 'aria-label': check.question });
        const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        function feedbackText() {
          if (s.selectedCheck < 0) return;
          feedback.className = 'feedback ' + (s.checkCorrect ? 'good' : 'retry');
          feedback.replaceChildren(math((s.checkCorrect ? 'Верно. ' : 'Подумай ещё. ') + check.explanation));
        }
        check.options.forEach((option, index) => {
          const b = button('', () => {
            s.selectedCheck = index; s.checkCorrect = index === check.correct;
            if (!s.checkCorrect) s.helpUsed = true;
            save(); refreshStatus(lesson, s); [...options.children].forEach((node, j) => node.classList.toggle('selected', j === index)); feedbackText();
          }, s.selectedCheck === index ? 'selected' : '', { 'data-check-option': index }); b.append(math(option)); options.append(b);
        }); feedbackText(); section.append(options, feedback); if (guidanceFor(lesson)) bottom.prepend(section); else bottom.append(section);
      }
      if(lesson.takeaway && calculationsReady) {
        const takeaway=el('section',{class:'takeaway wide'});takeaway.append(el('h3',{},guidanceFor(lesson)?'Запомним одну идею':'Что взять в следующую задачу'));
        (Array.isArray(lesson.takeaway)?lesson.takeaway:[lesson.takeaway]).forEach(text=>takeaway.append(para(text)));
        bottom.append(takeaway);
      }
    }
    const draft = el('section', { class: ready && lesson.check ? 'wide' : '' });
    draft.append(el('h3', {}, 'Мои рассуждения'), el('label', { for: 'proof-draft' }, 'Запиши плоскости, основания построений и вычисления'));
    const area = el('textarea', { id: 'proof-draft', maxlength: board ? 2000 : 30000, placeholder: 'Например: работаю в плоскости … . Точки … и … лежат в ней, потому что … .' }); area.value = s.draft;
    area.addEventListener('input', () => { s.draft = area.value.slice(0, board ? 2000 : 30000); save(); });
    draft.append(area, para(board ? 'Черновик виден участникам общего разбора. При выборе другой карточки начинается новая работа.' : 'Черновик сохраняется при переходе к другой задаче и после обновления страницы. Его проверяет преподаватель.', 'teacher-note'));
    if(lesson.proofChecklist?.length) {
      const list=el('div',{class:'proof-checklist'});
      list.append(el('h4',{},'Самопроверка записи'),para('Эти отметки — памятка для тебя. Они не оценивают правильность доказательства.','teacher-note'));
      lesson.proofChecklist.forEach((text,index)=>{
        const label=el('label'),check=el('input',{type:'checkbox',checked:!!s.proofChecks[index],'data-proof-check':index});
        check.addEventListener('change',()=>{s.proofChecks[index]=check.checked;save();});
        const words=el('span');words.append(math(text));label.append(check,words);list.append(label);
      });
      draft.append(list);
    }
    if (guidanceFor(lesson)) { const optional=details('Моя запись — можно ответить устно',[draft],null,s.draftOpen);optional.classList.add('starter-draft');optional.addEventListener('toggle',()=>{s.draftOpen=optional.open;save();});bottom.append(optional); } else bottom.append(draft); return bottom;
  }

  function getSharedState() {
    const lesson = lessonMap.get(state.current), work = JSON.parse(JSON.stringify(taskState(lesson)));
    work.draft = board.encodeText(work.draft); work.answer = board.encodeText(work.answer);
    work.helpReasons = work.helpReasons.map(board.encodeText);
    return { version: 1, courseId: 'sections-from-zero', route: 'lessons', lessonId: state.current, work,
      catalog: { query: board.encodeText(catalogQuery), module: catalogFilter, level: catalogLevel, origin: catalogOrigin,
        open: !!document.querySelector('.catalog')?.open },
      ui: { principleOpen: !!document.querySelector('.principle')?.open, modeOptionsOpen: !!document.querySelector('.starter-other-mode')?.open,
        repeatOptionsOpen: !!document.querySelector('.starter-repeat')?.open, metadataOpen: !!document.querySelector('.starter-metadata')?.open }
    };
  }
  function applySharedState(value) {
    if (!board.validateState(value)) throw new TypeError('Invalid sections board state');
    if (JSON.stringify(getSharedState()) === JSON.stringify(value)) return;
    clearTimeout(boardSettle); boardApplying = true;
    try {
      const copy = JSON.parse(JSON.stringify(value)), work = copy.work;
      work.draft = board.decodeText(work.draft); work.answer = board.decodeText(work.answer);
      work.helpReasons = work.helpReasons.map(board.decodeText);
      state.current = copy.lessonId; state.tasks = { [copy.lessonId]: work };
      catalogQuery = board.decodeText(copy.catalog.query); catalogFilter = copy.catalog.module;
      catalogLevel = copy.catalog.level; catalogOrigin = copy.catalog.origin;
      renderLesson(); renderCatalog();
      document.getElementById('catalog-query').value = catalogQuery;
      document.querySelector('select[aria-label="Раздел курса"]').value = catalogFilter;
      document.querySelector('[data-catalog-filter="level"]').value = catalogLevel;
      document.querySelector('[data-catalog-filter="origin"]').value = catalogOrigin;
      document.querySelector('.catalog').open = catalogOpen = copy.catalog.open;
      for (const [key, selector] of Object.entries({ principleOpen: '.principle', modeOptionsOpen: '.starter-other-mode',
          repeatOptionsOpen: '.starter-repeat', metadataOpen: '.starter-metadata' })) {
        const element = document.querySelector(selector); if (element) element.open = copy.ui[key];
      }
      history.replaceState(null, '', '#' + encodeURIComponent(copy.lessonId)); save();
    } finally {
      // Setting <details open> queues native toggle events. Keep remote renders
      // muted through their settlement, while the session preserves real input.
      boardSettle = setTimeout(() => { boardApplying = false; }, 0);
    }
  }

  try {
    renderShell();
    const publicLessons=frozenCopy(C.lessons),publicLessonMap=new Map(publicLessons.map(lesson=>[lesson.id,lesson]));
    window.SECTIONS_APP = Object.freeze({
      getState: () => JSON.parse(JSON.stringify(state)),
      selectLesson: id => switchLesson(id, false),
      lessons:publicLessons,
      getCurrentLesson:()=>publicLessonMap.get(state.current),
      createScene:(container,lesson,onCamera)=>new Scene(container,lesson,onCamera),
      markHelp
    });
    if (board) {
      document.documentElement.dataset.sectionsView = 'lessons';
      board.attach({getState:getSharedState, applyState:applySharedState, isApplying:()=>boardApplying, numericValue});
      board.start();
    }
  } catch (error) {
    const box = el('div', { class: 'app-error' }); box.append(el('h2', {}, 'Не удалось открыть эту карточку'), para('Проверь, что файл курса сохранён целиком. Техническая причина: ' + error.message)); host.replaceChildren(box);
    throw error;
  }
})();

/* Pure data and exact-coordinate activities. No network, eval or dependencies. */
(function (root) {
  'use strict';
  const topics = [
    ['incidence','Выбрать рабочую плоскость','Две точки → общая плоскость → линия.'],
    ['trace','След и вспомогательная точка','Не путать прямую ребра с конечным ребром.'],
    ['projection','Вспомогательная плоскость','Полностью задать точку и перенести принадлежность.'],
    ['ratio','Отношения отрезков','Доля целого, отношения и точка деления.'],
    ['similarity','Подобие, площадь, объём','Различать коэффициенты k, k² и k³.'],
    ['area','Площади и длины','Плоская фигура внутри пространственной задачи.'],
    ['angles','Углы и перпендикуляры','Выбирать нужную проекцию и два перпендикуляра.'],
    ['coordinates','Координаты и параметр ребра','Подстановка, линейная интерполяция, 0≤t≤1.'],
    ['proof','Проверить доказательство','Находить пропущенное условие и неверный вывод.'],
    ['strategy','Выбрать следующий шаг','Планировать построение, сравнивать методы.'],
    ['topology','Форма и полнота сечения','Считать разные вершины, учитывать границы и касания.'],
    ['fluency','Вычислительная разминка','Дроби, теорема Пифагора, простые преобразования.']
  ].map(([id,title,description])=>({id,title,description}));
  const rand = seed => {let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};};
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0), sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), mul=(a,s)=>a.map(v=>v*s), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>Math.hypot(...a), unit=a=>mul(a,1/norm(a));
  const f=n=>Number(n.toFixed(4)).toString().replace('.',','), display=s=>s.replace(/[0-9]+/g,m=>m.replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]));
  const frac=(a,b)=>'[[frac:'+a+'|'+b+']]';
  const edgesOf=faces=>{const seen=new Set(),out=[];for(const vs of faces)for(let i=0;i<vs.length;i++){const e=[vs[i],vs[(i+1)%vs.length]],k=e.slice().sort().join('|');if(!seen.has(k)){seen.add(k);out.push(e);}}return out;};
  function solid(kind='cube',height=1) {
    let points,faces;
    if(kind==='tetra') {
      points={A:[0,0,0],B:[1,0,0],C:[0,1,0],S:[0,0,1]};faces=[['A','B','C'],['S','A','B'],['S','B','C'],['S','C','A']];
    } else if(kind==='pyramid') {
      points={A:[-1,-1,0],B:[-1,1,0],C:[1,1,0],D:[1,-1,0],S:[0,0,2]};faces=[['A','B','C','D'],['S','A','B'],['S','B','C'],['S','C','D'],['S','D','A']];
    } else {
      const shift=kind==='oblique'?.5:0;
      points={A:[0,0,0],B:[0,1,0],C:[1,1,0],D:[1,0,0],A1:[shift,0,height],B1:[shift,1,height],C1:[1+shift,1,height],D1:[1+shift,0,height]};
      faces=[['A','B','C','D'],['A1','B1','C1','D1'],['A','A1','B1','B'],['B','B1','C1','C'],['C','C1','D1','D'],['D','D1','A1','A']];
    }
    const fs=faces.map(v=>({id:v.join(''),label:'('+v.map(display).join('')+')',vertices:v,description:'Плоскость грани '+v.map(display).join('')+'. Вершины тела уже заданы.'}));
    return {points,faces:fs,planes:fs.map(x=>({...x})),edges:edgesOf(faces),given:[]};
  }
  const logic = {
    trace:[
      ['Прямые MN и AB пересеклись в T за концом ребра AB. Что можно заключить?',['T не принадлежит плоскости основания.','T принадлежит прямой AB и её плоскости; принадлежность самому ребру проверяем отдельно.','T обязательно вершина сечения.'],1,'Плоскость содержит всю прямую, а не только ребро.','Вспомогательная точка может лежать вне тела. Для вершины сечения нужно попадание на его поверхность.'],
      ['След секущей на основании параллелен AB. Можно ли искать их конечную точку пересечения?',['Да, если сильнее продлить.','Нет: в евклидовой геометрии параллельные различные прямые не пересекаются.','Да, их изображения должны пересечься.'],1,'Проверь параллельность до поиска точки.','Используй другое ребро, параллельность следов или вспомогательную плоскость; не создавай фиктивную точку.'],
      ['T лежит на уже построенном следе α∩β и на прямой общего ребра плоскостей β и γ. Что верно?',['T принадлежит α и γ.','T обязательно лежит внутри ребра.','Любая точка γ принадлежит α.'],0,'Проследи две независимые цепочки принадлежности.','Из T∈α∩β следует T∈α. Из принадлежности прямой общего ребра β,γ следует T∈γ.'],
      ['M∈α∩β и N∈α∩β, M≠N. Плоскости α,β различны. Чему равно их пересечение?',['Прямой MN.','Только отрезку MN.','Любой плоскости через MN.'],0,'Пересечение двух различных плоскостей — прямая.','Конечный отрезок станет стороной сечения лишь после ограничения гранью тела.']
    ],
    projection:[
      ['Внутри изображения призмы поставлена точка M без других условий. Однозначно ли задана пространственная точка?',['Да, её видно.','Нет: нужны дополнительные пространственные данные, например вторичная проекция и связь с ней.','Да, если точка красная.'],1,'Одна экранная отметка может изображать разные точки пространства.','Для внутренней точки укажи, на какой линии или в какой плоскости она лежит, либо задай проекцию и направление.'],
      ['M лежит на явно названной плоской грани. Нужно ли всегда давать ещё и вторичную проекцию, чтобы понять M?',['Да, без исключений.','Нет: принадлежность грани уже задаёт её плоскость; при невырожденном изображении точку в этой грани можно определить.','Нет: можно вообще не указывать грань.'],1,'Различай внутреннюю точку тела и точку известной грани.','Дополнительные данные требуются при пространственной неоднозначности; точку известной грани можно проецировать уже после её задания.'],
      ['В прямой призме MM₀ ∥ AA₁, M₀ лежит в основании. Через M,M₀,N₀ задана вспомогательная плоскость. Почему NN₀ ∥ AA₁ через N₀ лежит в ней?',['Плоскость содержит MM₀ и N₀ вне неё; прямая через N₀, параллельная MM₀, принадлежит ей.','Потому что NN₀ вертикальна на экране.','Любая прямая через N₀ лежит в плоскости.'],0,'Используй точку и направление внутри заданной плоскости.','Теперь M,N и их вторичные проекции можно связывать плоскими построениями в одной конкретной плоскости.'],
      ['При параллельном проецировании что сохраняется для отрезков одной прямой, если проекция невырождена?',['Отношение длин этих отрезков.','Все пространственные углы.','Все абсолютные длины.'],0,'Не путай аффинные и метрические свойства.','Параллельная проекция сохраняет отношения на одной прямой, но обычно искажает длины и углы.']
    ],
    proof:[
      ['Ученик пишет: «Прямые лежат в разных плоскостях, значит не пересекаются». Что не так?',['Принадлежность разным плоскостям не исключает общей точки.','Любые две пространственные прямые пересекаются.','Разные плоскости всегда параллельны.'],0,'Например, AB и BC лежат в разных боковых гранях куба, но имеют B.','Нужно доказать невозможность общей точки: например, принадлежность различным параллельным плоскостям.'],
      ['Прямая l перпендикулярна одной прямой m плоскости α. Следует ли l⊥α?',['Да.','Нет: нужен полный признак с двумя пересекающимися прямыми α.','Да, если m длинная.'],1,'Один перпендикуляр не определяет нормаль плоскости.','Проверяем l⊥m, l⊥n, m,n⊂α, m∩n существует.'],
      ['На модели сечение выглядит ромбом. Что является доказательством?',['Равенство четырёх сторон, выведенное из условия.','Похожий вид на одном ракурсе.','Равные экранные расстояния.'],0,'Измерение в перспективе не переносится в пространство.','Найди стороны в гранях и обоснуй их равенство, например по средним линиям или теореме Пифагора.'],
      ['Ломаная замкнута, каждое её звено лежит на грани. Достаточно ли этого?',['Нет: все звенья ещё должны принадлежать одной секущей плоскости и образовывать полную границу.','Да, всегда.','Достаточно любых трёх звеньев.'],0,'Замкнутая пространственная ломаная может быть неплоской.','Проверь принадлежность общей плоскости, расположение вершин на рёбрах и отсутствие пропущенных частей границы.'],
      ['Для двугранного угла построены два отрезка из одной точки его ребра. Что ещё обязательно?',['Оба должны лежать каждый в своей грани и быть перпендикулярны ребру.','Достаточно одного перпендикуляра.','Достаточно одинаковой длины.'],0,'Линейный угол имеет точное определение.','Только два перпендикуляра к ребру, построенные в соответствующих полуплоскостях, дают нужный линейный угол.'],
      ['Три точки A,M,B лежат на одной прямой. Ученик называет единственную плоскость (AMB). Верно ли это?',['Нет: три коллинеарные точки не определяют единственную плоскость.','Да: любые три буквы определяют плоскость.','Верно только для куба.'],0,'В аксиоме есть условие «не лежат на одной прямой».','Укажи третью точку вне AB или две пересекающиеся прямые.']
    ],
    strategy:[
      ['Две данные точки секущей лежат на одной грани. Какой первый шаг обоснован?',['Назвать плоскость этой грани и провести прямую через эти точки.','Соединить все данные точки замкнутой ломаной.','Нарисовать предполагаемый многоугольник по виду.'],0,'Начни с двух известных общих точек двух плоскостей.','После первой линии ищи её пересечения с рёбрами или их продолжениями внутри той же плоскости.'],
      ['Основной след оказался далеко от тела и ухудшает читаемость. Что разумно?',['Проверить вспомогательное сечение или параллельные следы как другой законный путь.','Перенести точку ближе вручную.','Признать задачу неразрешимой.'],0,'Способ решения можно менять, геометрию — нельзя.','Сравни методы: каждый должен дать ту же плоскость и тот же многоугольник. Длина чертежа не заменяет доказательства.'],
      ['Нужна точка l∩α, а у l нет очевидной общей грани с исходными точками α. Как действовать?',['Ввести содержащую l вспомогательную плоскость β, построить α∩β и пересечь с l внутри β.','Пересечь изображения l и произвольного ребра.','Провести l сразу в α.'],0,'Создай конкретную общую плоскость для будущего пересечения прямых.','Последнее действие станет обычным плоским пересечением двух прямых β.'],
      ['После построения сечения требуется его площадь. Какой переход полезен?',['Выделить плоскую фигуру сечения, доказать её свойства и найти необходимые длины.','Измерить закрашенную область экрана.','Перемножить любые два ребра тела.'],0,'Сначала выясни тип фигуры и нужную формулу.','Прямоугольность, равенство сторон, высота трапеции и масштаб подобия требуют обоснования.']
    ],
    topology:[
      ['Сколько сторон максимально у невырожденного сечения тетраэдра?',['Три.','Четыре.','Шесть.'],1,'У тетраэдра четыре выпуклые грани.','Каждая грань даёт не более одной стороны; поэтому верхняя граница — четыре.'],
      ['Плоскость пересекает три рёбра, выходящие из одной вершины, в одной и той же вершине. Сколько разных точек получено?',['Три.','Одну.','Зависит от цвета.'],1,'Считай точки, а не записи пересечения с рёбрами.','Совпадающие координаты и одна пространственная вершина не становятся тремя вершинами многоугольника.'],
      ['У выпуклой n-угольной призмы сколько граней и, следовательно, какова верхняя граница числа сторон сечения?',['n.','n+2.','2n.'],1,'Добавь к боковым граням два основания.','У призмы n боковых граней и два основания; одна грань даёт не более одной стороны.'],
      ['Камера повернулась, и две подписи поменялись местами. Изменилось ли сечение?',['Нет: изменилось только изображение.','Да: появилась новая вершина.','Да: изменились длины.'],0,'Разделяй преобразование вида и изменение геометрических данных.','Настоящее изменение сечения требует изменения плоскости или тела.'],
      ['Плоскость совпадает с гранью куба. Как описать результат точно?',['Пересечение — квадратная грань; это опорный, предельный случай.','Пересечения нет.','Это всегда внутренний разрез куба.'],0,'Проверь, есть ли точки тела по обе стороны плоскости.','При совпадении с гранью весь куб расположен в одном замкнутом полупространстве.']
    ]
  };
  function shuffled(q,rng) {
    if(q.kind!=='choice')return q;
    const entries=q.options.map((text,i)=>({text,yes:i===q.answer}));
    for(let i=entries.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];}
    return {...q,options:entries.map(x=>x.text),answer:entries.findIndex(x=>x.yes)};
  }
  function makeDrill(topic,index=0) {
    index=Number.isFinite(Number(index))?Math.max(0,Math.floor(Number(index))):0;
    if(!topics.some(t=>t.id===topic))topic='incidence';
    const seed=Array.from(topic).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),17)+Math.imul(index+1,104729),rng=rand(seed),pick=(a,b)=>a+Math.floor(rng()*(b-a+1));
    const base={id:topic+'-'+index,topic,index,tolerance:.00051,unit:'',hint:'Назови известные величины и нужное правило.',rule:'Сначала объяснение, затем действие.',steps:[]};let q;
    if(topic==='incidence') {
      const m=solid(),faces=m.faces,face=faces[index%faces.length],vs=face.vertices,a=vs[0],b=vs[1],c=vs[vs.length-1],t=pick(2,8)/10,u=pick(2,8)/10;
      m.points.M=add(m.points[a],mul(sub(m.points[b],m.points[a]),t));m.points.N=add(m.points[a],mul(sub(m.points[c],m.points[a]),u));m.given=['M','N'];
      const scene={id:'drill-'+index,title:'Рабочая плоскость',model:m,steps:[{plane:face.id,points:[],segments:[{a:'M',b:'N',kind:'helper'}],reason:'M и N принадлежат одной указанной грани.',action:'Проводим MN в '+face.label+'.'}],result:{}};
      q={kind:'choice',prompt:'В кубе M∈'+display(a+b)+', N∈'+display(a+c)+'. В какой из названных плоскостей можно провести MN?',options:[face.label,faces[(index+2)%6].label,faces[(index+4)%6].label],answer:0,scene,scenePlane:face.id,hint:'Найди грань, которая содержит оба ребра.',rule:'Две точки прямой в плоскости ⇒ вся прямая в плоскости.',steps:['Ребро '+display(a+b)+' принадлежит '+face.label+'.','Ребро '+display(a+c)+' тоже принадлежит '+face.label+'.','Значит M,N∈'+face.label+' и MN лежит в ней.']};
    } else if(logic[topic]) {
      const item=logic[topic][index%logic[topic].length];q={kind:'choice',prompt:item[0],options:item[1].slice(),answer:item[2],hint:item[3],rule:item[4],steps:[item[3],item[4]]};
    } else if(topic==='ratio') {
      const p=pick(1,5),r=pick(1,6),k=pick(2,9),L=(p+r)*k,part=index%3;
      if(part===0)q={kind:'number',prompt:'M∈AB, AM:MB='+p+':'+r+', AB='+L+'. Найди AM.',answer:p*k,hint:'Целый отрезок содержит '+(p+r)+' равных частей.',rule:'Доля AM в AB равна '+frac(p,p+r)+'.',steps:['Всего частей: '+p+'+'+r+'='+(p+r)+'.','Одна часть: '+frac(L,p+r)+'='+k+'.','AM='+p+'·'+k+'='+p*k+'.']};
      else if(part===1)q={kind:'number',prompt:'M∈AB, AM:MB='+p+':'+r+'. В записи M=A+t(B−A) найди t. Ответ — дробь или число до тысячных.',answer:p/(p+r),hint:'t — доля AM от целого AB, не отношение AM к MB.',rule:'t=AM/AB.',steps:['AB состоит из '+(p+r)+' частей.','На AM приходится '+p+' частей.','t='+frac(p,p+r)+'≈'+f(p/(p+r))+'.']};
      else q={kind:'number',prompt:'M∈AB, AM='+p*k+', MB='+r*k+'. Во сколько раз AB больше AM? Ответ — дробь или число до тысячных.',answer:(p+r)/p,hint:'Сначала найди целый AB.',rule:'Не заменяй целый отрезок одной его частью.',steps:['AB='+p*k+'+'+r*k+'='+L+'.','Искомое отношение AB:AM='+frac(L,p*k)+'='+frac(p+r,p)+'.']};
    } else if(topic==='similarity') {
      const p=pick(1,3),r=p+pick(1,3),k=p/r,power=index%3+1,baseValue=Math.pow(r,power)*pick(2,5),names={1:'сторона',2:'площадь',3:'объём'},unit={1:'ед.',2:'кв. ед.',3:'куб. ед.'};
      q={kind:'number',prompt:'Сечение пирамиды параллельно основанию. Отношение расстояния от вершины до секущей к полной высоте равно '+p+':'+r+'. '+(power===3?'Объём исходной пирамиды':power===2?'Площадь основания':'Сторона основания')+' равен '+baseValue+'. Найди '+(power===3?'объём малой пирамиды у вершины':power===2?'площадь сечения':'соответствующую сторону сечения')+'.',answer:baseValue*Math.pow(k,power),unit:unit[power],hint:'Для '+names[power]+' коэффициент изменения равен k'+(power===1?'':power===2?'²':'³')+'.',rule:'Длины изменяются в k раз, площади — в k², объёмы — в k³.',steps:['k='+frac(p,r)+'.','Искомая величина = '+baseValue+'·('+frac(p,r)+')'+(power===1?'':power===2?'²':'³')+'.','Получаем '+f(baseValue*Math.pow(k,power))+' '+unit[power]]};
    } else if(topic==='area') {
      const a=pick(2,9),b=pick(2,8),h=pick(2,7),variant=index%4;
      if(variant===0)q={kind:'number',prompt:'В сечении доказан прямоугольный треугольник с катетами '+a+' и '+b+'. Найди его площадь.',answer:a*b/2,unit:'кв. ед.',hint:'Половина произведения перпендикулярных катетов.',rule:'S=ab/2.',steps:['Катеты перпендикулярны; один — основание, другой — высота.','S='+frac(a+'·'+b,2)+'='+f(a*b/2)+'.']};
      else if(variant===1)q={kind:'number',prompt:'Сечение — трапеция с основаниями '+a+' и '+(a+b)+' и высотой '+h+'. Найди площадь.',answer:(2*a+b)*h/2,unit:'кв. ед.',hint:'Высота — перпендикуляр к основаниям, не боковая сторона.',rule:'S=(a+b)h/2.',steps:['Сумма оснований: '+a+'+'+(a+b)+'='+(2*a+b)+'.','S='+frac((2*a+b)+'·'+h,2)+'='+f((2*a+b)*h/2)+'.']};
      else if(variant===2)q={kind:'number',prompt:'Сечение — равносторонний треугольник со стороной '+a+'√2. Найди площадь, округли до тысячных.',answer:a*a*Math.sqrt(3)/2,unit:'кв. ед.',hint:'Сначала возведи сторону в квадрат: (a√2)²=2a².',rule:'S=√3·сторона²/4.',steps:['('+a+'√2)²='+(2*a*a)+'.','S='+frac((2*a*a)+'√3',4)+'≈'+f(a*a*Math.sqrt(3)/2)+'.']};
      else q={kind:'number',prompt:'Площадь ортогональной проекции сечения равна '+a*b+'. Острый угол плоскостей равен 60°. Найди площадь самого сечения.',answer:2*a*b,unit:'кв. ед.',hint:'Площадь проекции равна S·cos60°, а не S/cos60°.',rule:'Sпроекции=S·cosφ, 0≤φ<90°.',steps:['cos60°=1/2.','S='+a*b+' ÷ '+frac(1,2)+'='+(2*a*b)+'.','Само сечение не меньше своей ортогональной проекции.']};
    } else if(topic==='angles') {
      const pairs=[[1,1],[1,Math.sqrt(3)],[Math.sqrt(3),1],[2,3],[3,4]], [vertical,projection]=pairs[index%pairs.length],k=pick(2,6),v=vertical*k,p=projection*k;
      q={kind:'number',prompt:'В плоскости, содержащей отрезок и его ортогональную проекцию на основание, получен прямоугольный треугольник. Перпендикулярная составляющая равна '+(vertical===Math.sqrt(3)?k+'√3':f(v))+', проекция — '+(projection===Math.sqrt(3)?k+'√3':f(p))+'. Найди угол отрезка с плоскостью в градусах до тысячных.',answer:Math.atan2(v,p)*180/Math.PI,unit:'°',hint:'Угол прямой с плоскостью — угол с её ненулевой ортогональной проекцией.',rule:'tanφ=перпендикулярная составляющая / длина проекции.',steps:['tanφ='+frac(vertical===Math.sqrt(3)?k+'√3':f(v),projection===Math.sqrt(3)?k+'√3':f(p))+'.','φ=arctan('+frac(vertical===Math.sqrt(3)?k+'√3':f(v),projection===Math.sqrt(3)?k+'√3':f(p))+')≈'+f(Math.atan2(v,p)*180/Math.PI)+'°. Промежуточное отношение не округляем.', 'Угол с нормалью был бы дополнительным до 90°.']};
    } else if(topic==='coordinates') {
      const fA=pick(-6,4),fB=fA+pick(2,9),t=[-.5,.25,.5,.75,1.5][index%5],c=fA+t*(fB-fA);
      if(index%2===0)q={kind:'number',prompt:'На ребре AB значение линейного выражения F=ax+by+cz равно '+fA+' в A и '+fB+' в B. Плоскость задана F='+f(c)+'. Найди t в A+t(B−A).',answer:t,hint:'F(A+t(B−A))=F(A)+t(F(B)−F(A)).',rule:'t=(c−F(A))/(F(B)−F(A)); затем проверь 0≤t≤1.',steps:[fA+'+t·('+(fB-fA)+')='+f(c)+'.','t='+frac(f(c-fA),fB-fA)+'='+f(t)+'.',t<0||t>1?'Пересечение с продолжением, не с ребром.':'Точка лежит на конечном ребре.']};
      else q={kind:'choice',prompt:'При пересечении плоскости с прямой ребра AB получили t='+f(t)+' в A+t(B−A). Где точка?',options:['На конечном ребре AB.','На продолжении за A.','На продолжении за B.'],answer:t<0?1:t>1?2:0,hint:'У A параметр 0, у B параметр 1.',rule:'Ребро: 0≤t≤1; за A: t<0; за B: t>1.',steps:['Сравни '+f(t)+' с 0 и 1.',t<0?'Параметр отрицательный: за A.':t>1?'Параметр больше 1: за B.':'Параметр внутри [0;1]: на ребре.']};
    } else {
      const a=pick(2,8),b=pick(2,9),variant=index%3;
      if(variant===0)q={kind:'number',prompt:'В грани построен прямоугольный треугольник с катетами '+a+' и '+b+'. Найди гипотенузу до тысячных.',answer:Math.hypot(a,b),hint:'Складываются квадраты, не сами катеты.',rule:'c=√(a²+b²).',steps:['c²='+a+'²+'+b+'²='+(a*a+b*b)+'.','c=√'+(a*a+b*b)+'≈'+f(Math.hypot(a,b))+'.']};
      else if(variant===1)q={kind:'number',prompt:'Вычисли '+frac(a,b)+'·'+frac(b,a+1)+'. Введи обычную дробь или число до тысячных.',answer:a/(a+1),hint:'Сократи общий множитель '+b+' в числителе и знаменателе.',rule:'Умножаем числители и знаменатели, сокращаем общие ненулевые множители.',steps:[frac(a+'·'+b,b+'·'+(a+1))+'='+frac(a,a+1)+'.']};
      else q={kind:'number',prompt:'Длина стороны подобной фигуры уменьшилась в '+b+' раз. Площадь исходной фигуры '+(a*b*b)+'. Найди новую площадь.',answer:a,hint:'Для площади коэффициент длины нужно возвести в квадрат.',rule:'Sновая=Sисходная/b².',steps:[frac(a*b*b,b+'²')+'='+a+'.']};
    }
    return shuffled({...base,...q},rng);
  }
  const labFamilies=[
    {id:'cube-sum',title:'Куб · параллельное движение',kind:'cube',normal:[1,1,1],initial:1.5,description:'Единичный куб: AD — x, AB — y, AA₁ — z. Исследуй x+y+z=t. Отличай изменение плоскости от поворота камеры.',question:'На каких уровнях треугольник превращается в шестиугольник? Что происходит точно на границе?'},
    {id:'cube-weighted',title:'Куб · от трёх до шести сторон',kind:'cube',normal:[2,3,4],initial:4.5,description:'Единичный куб. Плоскости 2x+3y+4z=t параллельны друг другу. Не делай вывод о форме только по числу заданных точек.',question:'Найди интервалы с 3,4,5,6 сторонами. Почему критические значения связаны с вершинами куба?'},
    {id:'cube-horizontal',title:'Куб · внутреннее сечение и касание',kind:'cube',normal:[0,0,1],initial:.5,description:'Исследуем z=t: параллельные основаниям плоскости.',question:'Как отличить квадрат внутри куба от совпадения с его гранью? Когда пересечение пусто?'},
    {id:'tetra-parallel',title:'Тетраэдр · подобие и степени',kind:'tetra',normal:[0,0,1],initial:.4,description:'A(0;0;0), B(1;0;0), C(0;1;0), S(0;0;1). Сечение z=t параллельно ABC.',question:'Почему площади изменяются как (1−t)², а объём малой пирамиды — как (1−t)³?'},
    {id:'tetra-oblique',title:'Тетраэдр · треугольник или четырёхугольник',kind:'tetra',normal:[1,-1,1],initial:.4,description:'Тот же тетраэдр; теперь x−y+z=t. Не всякое сечение тетраэдра треугольное.',question:'Найди четырёхугольник. Докажи, почему пятиугольника быть не может.'},
    {id:'pyramid-parallel',title:'Пирамида · сечение и отсечённый объём',kind:'pyramid',normal:[0,0,1],initial:1,description:'Квадратное основание: −1≤x,y≤1, z=0. Вершина S(0;0;2). Сечение z=t.',question:'Если расстояние до вершины уменьшилось вдвое, во сколько раз уменьшились сторона, площадь и объём?'},
    {id:'pyramid-vertical',title:'Пирамида · плоскость проходит мимо вершины',kind:'pyramid',normal:[1,0,0],initial:.3,description:'Плоскости x=t перпендикулярны основанию квадратной пирамиды.',question:'Почему при t=0 сечение треугольное, а при 0<|t|<1 — четырёхугольное? Что при |t|=1?'},
    {id:'oblique-normal',title:'Косая призма · полное нормальное сечение',kind:'oblique',normal:[.5,0,1],initial:.8,description:'Основание — единичный квадрат. Боковое ребро v=(0,5;0;h). Секущая 0,5x+hz=t перпендикулярна боковым рёбрам.',question:'Когда сечение пересекает все четыре боковых ребра? Что меняется при малой высоте h?',height:true}
  ];
  function labBounds(familyId,height=1){const spec=labFamilies.find(x=>x.id===familyId)||labFamilies[0],m=solid(spec.kind,height),n=spec.height?[.5,0,height]:spec.normal,values=Object.values(m.points).map(p=>dot(n,p)),critical=[...new Set(values.map(x=>Number(x.toFixed(10))))].sort((a,b)=>a-b),span=Math.max(1,critical.at(-1)-critical[0]);return{min:critical[0]-.12*span,max:critical.at(-1)+.12*span,critical,normal:n};}
  function makeLab(familyId,level,height=1) {
    const spec=labFamilies.find(x=>x.id===familyId)||labFamilies[0],model=solid(spec.kind,height),n=spec.height?[.5,0,height]:spec.normal,t=Number(level),eps=1e-8,bodyNames=Object.keys(model.points),values=bodyNames.map(k=>dot(n,model.points[k])-t),hits=[];
    const nameAt=p=>{for(const [name,q]of Object.entries(model.points))if(norm(sub(p,q))<eps)return name;const pool='P Q R T U V W X Y Z E F G H J K L M N'.split(' ');const name=pool.find(x=>!model.points[x]);model.points[name]=p;return name;};
    for(const [a,b]of model.edges){const pa=model.points[a],pb=model.points[b],da=dot(n,pa)-t,db=dot(n,pb)-t;if(Math.abs(da)<eps)hits.push(a);if(Math.abs(db)<eps)hits.push(b);if(da*db<-eps*eps)hits.push(nameAt(add(pa,mul(sub(pb,pa),da/(da-db)))));}
    let polygon=[...new Set(hits)],dimension=polygon.length?0:-1;
    if(polygon.length>1)dimension=1;
    if(polygon.length>2){const a=model.points[polygon[0]],v=sub(model.points[polygon[1]],a);if(polygon.slice(2).some(k=>{const w=sub(model.points[k],a);return norm(w)>eps && norm(cross(v,w))>1e-9*norm(v)*norm(w);} ))dimension=2;}
    if(dimension===2){const center=mul(polygon.map(k=>model.points[k]).reduce(add,[0,0,0]),1/polygon.length),u=unit(sub(model.points[polygon[0]],center)),w=cross(unit(n),u);polygon.sort((a,b)=>Math.atan2(dot(sub(model.points[a],center),w),dot(sub(model.points[a],center),u))-Math.atan2(dot(sub(model.points[b],center),w),dot(sub(model.points[b],center),u)));}
    const positive=values.some(x=>x>eps),negative=values.some(x=>x<-eps),inside=positive&&negative;
    const classification=dimension<0?'Пустое пересечение':dimension===0?'Касание в точке':dimension===1?'Касание по отрезку':inside?'Внутреннее сечение · сторон: '+polygon.length:'Опорное пересечение: совпадение с гранью';
    const edgeRows=model.edges.map(([a,b])=>{const va=dot(n,model.points[a]),vb=dot(n,model.points[b]),den=vb-va;return {edge:display(a+b),from:va,to:vb,parameter:Math.abs(den)<eps?null:(t-va)/den,coplanar:Math.abs(den)<eps&&Math.abs(t-va)<eps};});
    const steps=model.faces.map(face=>{
      const fp=face.vertices.map(k=>model.points[k]),fn=unit(cross(sub(fp[1],fp[0]),sub(fp[2],fp[0]))),on=polygon.filter(k=>Math.abs(dot(fn,sub(model.points[k],fp[0])))<eps),all=face.vertices.every(k=>Math.abs(dot(n,model.points[k])-t)<eps);let segments=[];
      if(all&&dimension===2)segments=face.vertices.map((a,i)=>({a,b:face.vertices[(i+1)%face.vertices.length],kind:'section'}));
      else if(on.length===2)segments=[{a:on[0],b:on[1],kind:'section'}];
      const action=segments.length?'В '+face.label+' строим '+segments.map(s=>display(s.a+s.b)).join(', ')+'.':on.length?'В '+face.label+' получаем точку '+display(on[0])+', но отдельной стороны здесь нет.':'В этой грани пересечений нет: её вершины лежат строго по одну сторону уровня.';
      return {title:'Рассматриваем '+face.label,plane:face.id,reason:'Рабочая плоскость '+face.label+' определена вершинами этой грани. На каждом её ребре вычисляем параметр tребра=(уровень−F(A))/(F(B)−F(A)); берём только 0≤tребра≤1. Формулу деления используем при F(B)≠F(A). Если F(B)=F(A), всё ребро лежит в секущей при равенстве уровню, иначе пересечения нет. '+(all?'Все вершины грани удовлетворяют уравнению секущей.':segments.length?'Концы найденного отрезка удовлетворяют и уравнению секущей, и плоскости грани.':on.length?'Единственная общая точка не образует отдельной стороны в этой грани.':'Все значения в вершинах грани находятся строго по одну сторону уровня; внутри выпуклой грани нового пересечения нет.'),action,points:on,segments};
    });
    let area=0,perimeter=0;
    if(dimension===2){const p0=model.points[polygon[0]];for(let i=1;i<polygon.length-1;i++)area+=norm(cross(sub(model.points[polygon[i]],p0),sub(model.points[polygon[i+1]],p0)))/2;for(let i=0;i<polygon.length;i++)perimeter+=norm(sub(model.points[polygon[i]],model.points[polygon[(i+1)%polygon.length]]));}
    const extra=[];
    if(spec.id==='tetra-parallel'&&t>=0&&t<=1)extra.push({label:'Коэффициент подобия от вершины',value:1-t},{label:'Площадь по формуле',value:.5*(1-t)**2},{label:'Объём малой пирамиды',value:(1-t)**3/6});
    if(spec.id==='pyramid-parallel'&&t>=0&&t<=2)extra.push({label:'Коэффициент подобия от вершины',value:1-t/2},{label:'Площадь по формуле',value:4*(1-t/2)**2},{label:'Объём малой пирамиды',value:8/3*(1-t/2)**3});
    let normalInfo=null;
    if(spec.height){const low=.5,high=.25+height*height,parameters=['A','B','C','D'].map(k=>(t-.5*model.points[k][0])/high);normalInfo={low,high,exists:low<=high+eps,full:parameters.every(x=>x>=-eps&&x<=1+eps),parameters};}
    return {id:'lab-'+spec.id,title:spec.title,model,steps,result:dimension===2?{polygon}: {},spec,normal:n,level:t,height,classification,dimension,inside,polygon,area,perimeter,edgeRows,extra,normalInfo,equation:n.map((c,i)=>c?(Math.abs(c)===1?(c<0?'−':''):f(c)+'·')+['x','y','z'][i]:null).filter(Boolean).join(' + ').replaceAll('+ −','− ').replaceAll('+ -','− ')+' = '+f(t)};
  }
  const assessments=[
    {id:'entry',title:'Входная диагностика',description:'Пять коротких вопросов. Выясняем, с какого умения начать; это не экзаменационная отметка.',topics:['incidence','projection','ratio','proof','topology'],proof:'Назови одну пространственную ситуацию, где пересечение изображений не означает пересечения прямых.'},
    {id:'basic',title:'Контроль 1 · Законность построений',description:'Плоскость, след, перенос точки и полнота сечения.',topics:['incidence','trace','projection','strategy','proof'],proof:'На новой задаче из главы «Следы» запиши для каждой линии плоскость и два основания принадлежности точек.'},
    {id:'metric',title:'Контроль 2 · От построения к вычислению',description:'Отношения, подобие, площадь, угол и ограничения координат.',topics:['ratio','similarity','area','angles','coordinates'],proof:'Выбери вычислительную задачу и объясни, какая плоская фигура дала нужную формулу. Докажи, что взята именно её высота.'},
    {id:'research',title:'Контроль 3 · Особые случаи и доказательства',description:'Проверяем границы применимости метода и полноту аргумента.',topics:['topology','proof','projection','coordinates','strategy'],proof:'Предскажи изменение числа сторон в одной лаборатории. Отдельно запиши наблюдение и доказательство критических значений.'},
    {id:'final',title:'Итоговая работа',description:'Пять автоматически проверяемых заданий и отдельное построение с доказательством для преподавателя.',topics:['incidence','trace','similarity','area','proof'],proof:'Построй новую задачу из главы «Выбор метода» или «Сложные построения». Назови плоскость каждой линии, обоснуй границу, вычисли указанную величину и проверь результат другим способом.'}
  ];
  function makeExam(id,run=0){const spec=assessments.find(x=>x.id===id)||assessments[0];return{...spec,run,questions:spec.topics.map((t,i)=>makeDrill(t,41+run*131+i*17))};}
  const api={topics,makeDrill,labFamilies,labBounds,makeLab,assessments,makeExam,solid,formatNumber:f};
  root.SECTION_ACTIVITIES=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

(function () {
  'use strict';
  if(window.SECTIONS_BOARD_SESSION)return;
  const C=window.COURSE,api=window.SECTIONS_APP,A=window.SECTION_ACTIVITIES;
  if(!C||!api||!A)return;
  const KEY='mathexam.sections.master.activities.v1',layout=document.querySelector('.layout'),host=document.getElementById('sections-app');
  const defaults={view:'map',route:'full',path:{stageId:'begin-01',readiness:{}},practice:{topic:'incidence',topics:{},returnTo:null},labs:{family:'cube-sum',states:{}},exams:{},examId:'entry'};
  let state;try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){state={...defaults};}
  state.practice={...defaults.practice,...state.practice};state.labs={...defaults.labs,...state.labs};state.exams=state.exams||{};state.path={...defaults.path,...state.path};state.path.readiness=state.path.readiness||{};
  let visual=null,nav,portal,storageOK=true;
  const lessonById=new Map(C.lessons.map(x=>[x.id,x])),moduleById=new Map(C.modules.map(x=>[x.id,x]));
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){storageOK=false;}}
  function el(tag,attrs={},text){const x=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')x.className=v;else if(k==='value')x.value=v;else if(k==='disabled')x.disabled=!!v;else if(k==='checked')x.checked=!!v;else x.setAttribute(k,String(v));}if(text!==undefined)x.textContent=text;return x;}
  function math(text){const f=document.createDocumentFragment();for(const part of String(text||'').split(/(\[\[frac:[^\[\]]+\|[^\[\]]+\]\]|\n)/g)){const m=part.match(/^\[\[frac:([^|]+)\|([^\]]+)\]\]$/);if(m){const span=el('span',{class:'fraction',role:'math','aria-label':m[1]+' делить на '+m[2]});span.append(el('span',{class:'numerator','aria-hidden':true},m[1]),el('span',{class:'denominator','aria-hidden':true},m[2]));f.append(span);}else if(part==='\n')f.append(el('br'));else f.append(document.createTextNode(part));}return f;}
  function p(text,cls){const x=el('p',cls?{class:cls}:{});x.append(math(text));return x;}
  function btn(text,fn,cls='',attrs={}){const x=el('button',{type:'button',class:cls,...attrs},text);x.addEventListener('click',fn);return x;}
  function disclosure(title,children,cls=''){const x=el('details',{class:cls});x.append(el('summary',{},title),...children);return x;}
  function list(items){const ul=el('ul');items.forEach(t=>{const li=el('li');li.append(math(t));ul.append(li);});return ul;}
  function title(text,eyebrow,description){const h=el('header',{class:'master-section-heading'});if(eyebrow)h.append(p(eyebrow,'eyebrow'));h.append(el('h2',{tabindex:'-1'},text));if(description)h.append(p(description,'muted'));return h;}
  function parse(text){const s=String(text).trim().replace(/\s+/g,'').replace(/,/g,'.').replace(/−/g,'-');if(!s)return NaN;const pieces=s.split('/'),num=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;if(pieces.length===1&&num.test(s))return Number(s);if(pieces.length===2&&pieces.every(x=>num.test(x))&&Number(pieces[1])!==0)return Number(pieces[0])/Number(pieces[1]);return NaN;}
  function correct(q,answer){return q.kind==='choice'?Number(answer)===q.answer:Number.isFinite(parse(answer))&&Math.abs(parse(answer)-q.answer)<=q.tolerance;}
  function answerText(q){return q.kind==='choice'?q.options[q.answer]:A.formatNumber(q.answer)+(q.unit?' '+q.unit:'');}
  function markExamHelp(reason,exceptId=null){for(const[id,exam]of Object.entries(state.exams)){if(exam.started&&!exam.finished&&id!==exceptId){exam.assisted=true;exam.helpReason=reason;}}}
  function show(view,focus=true){
    if(view==='control')markExamHelp('Во время работы открыт другой набор.',state.examId);else markExamHelp('Во время работы открыты учебные материалы или другой раздел.');
    if(visual){visual.destroy();visual=null;}
    state.view=view;document.documentElement.dataset.sectionsView=view;save();document.querySelector('.skip-link')?.setAttribute('href',view==='lessons'?'#lesson-title':'#master-portal');layout.hidden=view!=='lessons';portal.hidden=view==='lessons';
    nav.querySelectorAll('button').forEach(b=>{const yes=b.dataset.view===view;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));});
    if(view!=='lessons'){
      portal.replaceChildren();
      ({map:renderMap,practice:renderPractice,labs:renderLabs,control:renderControl,teacher:renderTeacher}[view]||renderMap)();
      if(!storageOK)portal.prepend(p('Браузер не разрешил постоянное сохранение. Пока вкладка открыта, работа остаётся здесь.','storage-alert'));
      if(focus)portal.querySelector('h2')?.focus({preventScroll:true});
    }
    if(focus)window.scrollTo({top:nav.offsetTop-8,behavior:'auto'});
  }
  function openLesson(id){if(!lessonById.has(id))return;const stageId=lessonById.get(id).pathStageId;if(stageId)state.path.stageId=stageId;show('lessons',false);api.selectLesson(id);document.getElementById('lesson-title')?.focus({preventScroll:true});document.getElementById('lesson-title')?.scrollIntoView({block:'start'});}
  function openModule(id){const m=moduleById.get(id),first=m?.coreIds?.[0]||C.lessons.find(l=>l.module===id)?.id;if(!first)return;openLesson(first);const filter=document.querySelector('select[aria-label="Раздел курса"]');if(filter){filter.value=id;filter.dispatchEvent(new Event('change'));}}
  function openPractice(topic,context=null){state.practice.topic=A.topics.some(x=>x.id===topic)?topic:'incidence';state.practice.returnTo=context;if(context?.lessonId)api.markHelp(context.lessonId,'Отдельная тренировка умения: '+state.practice.topic);show('practice');}
  function openLab(id){state.labs.family=id;show('labs');}
  function openExam(id){state.examId=id;show('control');}
  function stageStats(){const tasks=api.getState().tasks||{},started=C.lessons.filter(l=>(tasks[l.id]?.revealed||0)>0),built=started.filter(l=>tasks[l.id].revealed===l.steps.length),help=started.filter(l=>tasks[l.id].helpUsed||tasks[l.id].workedSeen||tasks[l.id].resultSeen);return{started:started.length,built:built.length,help:help.length};}
  function renderMap(){
    const path=C.learningPath||[];
    if(!path.length){renderFullMap();return;}
    let index=path.findIndex(x=>x.id===state.path.stageId);if(index<0)index=0;
    const stage=path[index],tasks=api.getState().tasks||{},manual=state.path.readiness[stage.id]||(state.path.readiness[stage.id]=[]);
    const completed=id=>{const lesson=lessonById.get(id),s=tasks[id];return !!s&&s.revealed===lesson.steps.length;};
    const lessonStatus=id=>{const l=lessonById.get(id),s=tasks[id];if(!s||!s.revealed)return 'Ещё не выполняли';if(!completed(id))return 'В работе: '+s.revealed+' из '+l.steps.length+' действий';if(s.workedSeen||s.helpUsed||s.resultSeen)return 'Построено с разбором или помощью';return 'Построено; объяснение проверяем отдельно';};
    portal.append(title('Мой путь',null,'Сначала вместе, затем с опорой и на новом примере самостоятельно.'));
    const box=el('section',{class:'master-panel gentle-stage','data-stage-id':stage.id});
    const kindStages=path.filter(s=>s.kind===stage.kind),kindIndex=kindStages.findIndex(s=>s.id===stage.id)+1,kindLabel=stage.kind==='starter'?'Начальная ступень':stage.kind==='bridge'?'Подготовка к методу':'Основной этап';
    box.append(p(kindLabel+' '+kindIndex+' из '+kindStages.length,'eyebrow'),el('h3',{},stage.title),p(stage.newIdea,'gentle-new-idea'));
    const nextId=stage.lessons.find(id=>!completed(id))||stage.lessons[stage.lessons.length-1];
    const stageStarted=stage.lessons.some(id=>tasks[id] && (tasks[id].revealed>0 || tasks[id].mode==='study' || tasks[id].mode==='practice'));
    const startLabel=stage.lessons.every(completed)?'Повторить последний пример':stageStarted?'Продолжить занятие':index===0?'Начать с первой грани':'Начать этот этап';
    box.append(btn(startLabel,()=>openLesson(nextId),'primary gentle-start',{'data-action':'path-start'}),p(lessonById.get(nextId).title,'small muted next-lesson-label'));
    const rows=el('ol',{class:'gentle-lesson-list'});
    stage.lessons.forEach((id,i)=>{const l=lessonById.get(id),row=el('li'),guidance=l.starter||l.scaffold,role=guidance?({model:'Сделаем вместе',guided:'Попробуем с опорой',transfer:'Новый пример самостоятельно'})[guidance.phase]:'Задание '+(i+1);row.append(btn(role+' · '+l.title,()=>openLesson(id),'ghost',{'data-path-lesson':id}),p(lessonStatus(id),'small muted'));rows.append(row);});box.append(disclosure('Примеры этого этапа',[rows],'stage-examples'));
    if(stage.reserveLesson){const reserve=stage.reserveLesson,extra=disclosure('Если понадобилась помощь',[p('Сначала разберись в трудном действии. Для следующей самостоятельной попытки есть отдельный пример с другими точками или гранью. Повтор открытого разбора сохраняется как работа после помощи.'),btn('Новый пример без прежнего разбора',()=>openLesson(reserve),'ghost',{'data-action':'path-reserve'}),p(lessonStatus(reserve),'small muted')]);box.append(extra);}
    else box.append(disclosure('Опора перед этим этапом',[p(stage.entrySupport),btn('Потренировать нужное умение',()=>openPractice(stage.practice),'ghost')]));
    portal.append(box);
    const readiness=el('section',{class:'master-panel gentle-readiness',id:'path-readiness'});readiness.append(el('h3',{},'Когда двигаться дальше'),p('Выполни новое задание на бумаге или доске и объясни каждый шаг. Кнопки тренируют выбор плоскости; собственный чертёж и объяснение проверяй отдельно.','small'),p('Отмечай только то, что уже получается без разбора. Эти отметки сохраняются как самопроверка.','small muted'));
    stage.readiness.forEach((text,i)=>{const label=el('label',{class:'gentle-ready-check'}),input=el('input',{type:'checkbox',checked:!!manual[i],'data-readiness':i});input.addEventListener('change',()=>{manual[i]=input.checked;save();show('map',false);});label.append(input,el('span',{},text));readiness.append(label);});
    const ready=stage.readiness.every((_,i)=>manual[i]);readiness.append(p(ready?'Критерии отмечены вручную. Можно переходить к следующему этапу; это не автоматическая оценка полного доказательства.':'Если действие пока не получается, вернись к одному короткому примеру. Темп можно менять.','small muted'));
    if(index+1<path.length){const go=()=>{state.path.stageId=path[index+1].id;save();show('map');};if(ready)readiness.append(btn('К следующему этапу: '+path[index+1].title,go,'primary',{'data-action':'path-next-stage'}));else readiness.append(disclosure('Выбрать следующий этап по решению преподавателя',[p('Переход оставит критерии готовности неотмеченными.'),btn('Открыть следующий этап',go,'ghost',{'data-action':'path-next-stage'})]));}
    else readiness.append(p('Путь пройден до последнего этапа. Итог - новая смешанная задача с собственным построением, доказательством, вычислениями и разбором случаев.','step-note'));
    portal.append(readiness);
    const all=el('ol',{class:'gentle-path-list'});path.forEach((stage,i)=>{const li=el('li'),checked=(state.path.readiness[stage.id]||[]).filter(Boolean).length;li.append(btn((i+1)+'. '+stage.title,()=>{state.path.stageId=stage.id;save();show('map');},stage.id===state.path.stageId?'selected':'ghost',{'data-path-stage':stage.id}),p(checked?'Критерии отмечены вручную: '+checked+' из '+stage.readiness.length:'Готовность ещё не отмечена','small muted'));all.append(li);});portal.append(disclosure('Весь путь: от первого действия до исследования',[p('Шесть начальных ступеней, шесть коротких переходов к методам и четырнадцать основных этапов. Все сложные темы сохранены; к каждой ведут подготовительные действия.'),all]));
    const start=portal.childNodes.length;renderFullMap();const oldNodes=Array.from(portal.childNodes).slice(start);portal.append(disclosure('Другие маршруты и полный банк задач',oldNodes,'gentle-full-catalog'));
  }
  function renderFullMap(){
    portal.append(title('От первого следа к собственному доказательству','КАРТА КУРСА','Выберите маршрут или начните с короткой диагностики. Темп можно менять; каждая задача сохраняет свой ход работы.'));
    const hero=el('section',{class:'master-hero'}),intro=el('div');intro.append(el('h3',{},'Плоскость → основание → действие → вывод'),p('Не угадываем линию по рисунку. Сначала определяем, где разрешено строить, затем объясняем переход. После построения отдельно доказываем форму сечения и выполняем вычисления.'));
    const actions=el('div',{class:'master-actions'});actions.append(btn('Начать с диагностики',()=>openExam('entry'),'primary'),btn('Продолжить задачу',()=>openLesson(api.getState().current),'ghost'));intro.append(actions);
    const stats=el('div',{class:'master-stat-grid'});[[C.modules.filter(m=>m.id!=='onboarding').length,'основных глав'],[C.lessons.length,'карточек с моделями'],[A.topics.length,'отдельных умений'],[A.labFamilies.length,'лабораторий']].forEach(([n,label])=>{const box=el('div');box.append(el('strong',{},n),el('span',{},label));stats.append(box);});hero.append(intro,stats);portal.append(hero);
    const routeGrid=el('div',{class:'master-grid'});for(const route of C.routes||[]){const card=el('section',{class:'master-card'});card.append(p(route.level,'eyebrow'),el('h3',{},route.title),p(route.description),p(route.lessons.length+' опорных карточек. Остальной банк доступен в «Задачах».','small muted'),btn('Открыть маршрут',()=>{state.route=route.id;save();renderRoute();document.getElementById('route-detail')?.scrollIntoView({block:'start'});},'ghost',{'data-route':route.id}));routeGrid.append(card);}portal.append(routeGrid);
    const routeBox=el('section',{id:'route-detail',class:'master-panel'});portal.append(routeBox);renderRoute();
    portal.append(el('h3',{class:'master-divider-title'},'Все главы'));
    const grid=el('div',{class:'master-grid chapter-grid'});for(const m of C.modules){const card=el('section',{class:'master-card',id:'chapter-'+m.id});card.append(p('Уровень '+m.level+' · '+C.lessons.filter(l=>l.module===m.id).length+' карточек','eyebrow'),el('h3',{},m.title),p(m.description),list((m.outcomes||[]).slice(0,3)));const more=disclosure('Идея главы и выходная проверка',[p(m.intro),list(m.rules||[]),p('Типичная ошибка: '+m.error),p('Выход из главы: '+m.exit)],'chapter-detail');card.append(more,btn('К задачам главы',()=>openModule(m.id),'primary'),btn('Тренировка умения',()=>openPractice(m.practice),'ghost'));grid.append(card);}portal.append(grid);
    const progress=stageStats();portal.append(p('В этом браузере: начато '+progress.started+', построения завершены в '+progress.built+' карточках, разбор или помощь использованы в '+progress.help+'. Это история работы, а не автоматическая оценка доказательств.','master-footnote'));
  }
  function renderRoute(){const box=document.getElementById('route-detail');if(!box)return;const route=(C.routes||[]).find(r=>r.id===state.route)||(C.routes||[])[0];if(!route)return;box.replaceChildren(el('h3',{},route.title),p(route.guidance||route.description));const links=el('div',{class:'route-links'});route.lessons.forEach((id,i)=>{const l=lessonById.get(id);if(l)links.append(btn((i+1)+'. '+l.title,()=>openLesson(id),'route-link'));});box.append(disclosure('Показать последовательность карточек', [links]),btn('Начать маршрут',()=>openLesson(route.lessons[0]),'primary'));}
  function practiceState(topic){if(!state.practice.topics[topic])state.practice.topics[topic]={index:0,answer:'',checked:false,correct:false,hint:0,drawn:false,history:[]};const s=state.practice.topics[topic];s.history=s.history||[];return s;}
  function archivePractice(s,q){if(s.answer!==''||s.hint||s.checked)s.history.push({prompt:q.prompt,answer:q.kind==='choice'&&s.answer!==''?q.options[Number(s.answer)]:s.answer,rawAnswer:s.answer,correct:s.checked?s.correct:null,help:s.hint>0||s.hadError,solution:s.hint>1?q.steps:[],expected:s.checked?answerText(q):null});}
  function renderPractice(){
    const topic=state.practice.topic,s=practiceState(topic),q=A.makeDrill(topic,s.index),spec=A.topics.find(x=>x.id===topic);
    const lessonState=api.getState(),contextId=lessonState.current,contextLesson=lessonById.get(contextId),contextTask=lessonState.tasks?.[contextId];
    if(state.practice.returnTo&&state.practice.returnTo.lessonId!==contextId){state.practice.returnTo=null;save();}
    if(contextLesson?.practiceTopic===topic&&contextTask?.mode==='practice'&&contextTask.revealed<contextLesson.steps.length){if(!state.practice.returnTo)state.practice.returnTo={lessonId:contextId,scroll:window.scrollY};api.markHelp(contextId,'Отдельная тренировка умения: '+topic);save();}
    portal.append(title('Потренировать одно действие','ПРАКТИКУМ','Новые примеры помогают отработать конкретное умение. Возврат к исходной задаче сохраняет построение, ракурс и черновик.'));
    if(state.practice.returnTo){const context=state.practice.returnTo;portal.append(btn('← Вернуться к сохранённой задаче',()=>{state.practice.returnTo=null;save();openLesson(context.lessonId);if(Number.isFinite(context.scroll))window.scrollTo({top:context.scroll});},'primary return-task',{'data-action':'return-task'}));}
    const select=el('select',{'aria-label':'Тренируемое умение'});A.topics.forEach(x=>select.append(el('option',{value:x.id},x.title)));select.value=topic;select.addEventListener('change',()=>{state.practice.topic=select.value;save();show('practice',false);});portal.append(select);
    const card=el('section',{class:'master-panel drill-card'});card.append(p('Пример '+(s.index+1)+' · '+spec.title,'eyebrow'),p(q.prompt,'drill-prompt'));
    if(q.scene){const frame=el('div',{class:'model-frame drill-model'});frame.append(el('div',{class:'model-caption'},s.checked&&s.correct?'Рабочая плоскость: '+q.scene.model.planes.find(p=>p.id===q.scenePlane).label:'Исходная фигура: сначала выбери плоскость'));card.append(frame);visual=api.createScene(frame,q.scene,()=>{});visual.update({viewCount:s.drawn?1:0,planeId:s.checked&&s.correct?q.scenePlane:null,planeView:false,camera:{yaw:-.65,pitch:.46},showHelpers:true,showResult:false});}
    const feedback=el('div',{class:'feedback',role:'status'});
    if(q.kind==='choice'){
      const choices=el('div',{class:'check-options'});q.options.forEach((value,index)=>{const b=btn('',()=>{s.answer=index;s.checked=true;s.correct=correct(q,index);if(!s.correct)s.hadError=true;save();show('practice',false);},s.answer!==''&&Number(s.answer)===index?'selected':'',{'data-drill-option':index,disabled:s.checked&&s.correct});b.append(math(value));choices.append(b);});card.append(choices);
    }else{
      const form=el('form',{class:'drill-form'}),label=el('label',{for:'drill-answer'},'Ответ'+(q.unit?' ('+q.unit+')':'')),input=el('input',{id:'drill-answer',type:'text',inputmode:'decimal',autocomplete:'off',value:s.answer});
      input.addEventListener('input',()=>{s.answer=input.value;s.checked=false;s.correct=false;feedback.replaceChildren();feedback.className='feedback';save();});
      const checkAnswer=()=>{if(!Number.isFinite(parse(s.answer))){feedback.className='feedback retry';feedback.textContent='Введи число или простую дробь с ненулевым знаменателем.';return;}s.checked=true;s.correct=correct(q,s.answer);if(!s.correct)s.hadError=true;save();show('practice',false);};
      input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();checkAnswer();}});
      form.append(label,input,btn('Проверить',checkAnswer,'primary',{'data-action':'check-drill-answer'}),p('Запятая, точка и дробь вида 4/3 допустимы. Если требуется приближение — до тысячных.','small muted'));
      form.addEventListener('submit',e=>{e.preventDefault();checkAnswer();});card.append(form);
    }
    if(s.checked){feedback.className='feedback '+(s.correct?'good':'retry');feedback.append(p(s.correct?'Ответ совпал. Объясни, какое правило использовано.':'Пока не совпало. '+q.hint));if(s.correct)feedback.append(p(q.rule));}card.append(feedback);
    if(q.scene&&s.checked&&s.correct&&!s.drawn)card.append(btn('Показать действие в выбранной плоскости',()=>{s.drawn=true;save();show('practice',false);},'primary',{'data-action':'drill-draw'}));
    const help=el('div',{class:'master-actions'});help.append(btn('Короткая подсказка',()=>{s.hint=Math.max(s.hint,1);save();show('practice',false);},'ghost',{'data-action':'drill-hint'}),btn('Разобрать этот пример',()=>{s.hint=2;save();show('practice',false);},'ghost',{'data-action':'drill-solution'}));card.append(help);
    if(s.hint){card.append(p(q.hint,'step-note'));if(s.hint>1){const ol=el('ol',{class:'drill-solution'});q.steps.forEach(t=>{const li=el('li');li.append(math(t));ol.append(li);});card.append(ol,p('Этот пример разобран с помощью. Для новой самостоятельной попытки возьми следующий.','teacher-note'));}}
    card.append(btn('Новый похожий пример',()=>{archivePractice(s,q);s.index++;Object.assign(s,{answer:'',checked:false,correct:false,hint:0,drawn:false,hadError:false});save();show('practice',false);},'primary next-drill',{'data-action':'next-drill'}));portal.append(card);
    if(s.history.length){const history=el('div');s.history.slice().reverse().forEach((h,i)=>{const row=el('article',{class:'drill-history-row'});row.append(p(h.prompt),p('Твой ответ: '+(h.answer===''?'не введён':h.answer)+' · '+(h.correct===null?'проверка не завершена':h.correct?'ответ совпал':'нужна доработка')+(h.help?' · использована помощь':''),'small'));if(h.solution.length)row.append(list(h.solution));history.append(row);});portal.append(disclosure('Предыдущие примеры этого умения ('+s.history.length+')',[history]));}
  }
  function labState(id){if(!state.labs.states[id]){const family=A.labFamilies.find(x=>x.id===id);state.labs.states[id]={level:family.initial,height:1,revealed:0,justBuilt:false,prediction:'',predictionLocked:false,notes:'',flat:false,camera:{yaw:-.65,pitch:.46},history:[]};}const s=state.labs.states[id];s.predictionLocked=!!s.predictionLocked||s.revealed>0;return s;}
  function archiveLab(s,model){if(s.revealed||s.prediction||s.notes)s.history.push({level:s.level,height:s.height,revealed:s.revealed,justBuilt:s.justBuilt,prediction:s.prediction,predictionLocked:!!s.predictionLocked,notes:s.notes,result:s.revealed===model.steps.length?model.classification:'Не завершено',area:s.revealed===model.steps.length?model.area:null});}
  function changeLab(s,model,updates){archiveLab(s,model);Object.assign(s,updates,{revealed:0,justBuilt:false,prediction:'',predictionLocked:false,notes:''});save();show('labs',false);}
  function predictionKey(model){return model.dimension<0?'empty':model.dimension===0?'point':model.dimension===1?'segment':String(model.polygon.length);}
  function predictionLabel(value){return({'empty':'пусто','point':'точка','segment':'отрезок','3':'треугольник','4':'четырёхугольник','5':'пятиугольник','6':'шестиугольник'})[value]||'не записан';}
  function renderLabs(){
    const id=state.labs.family,s=labState(id),model=A.makeLab(id,s.level,s.height),spec=model.spec,bounds=A.labBounds(id,s.height);s.revealed=Math.max(0,Math.min(s.revealed,model.steps.length));
    portal.append(title('Изменяй условие, проверяй гипотезу','ЛАБОРАТОРИИ','Сначала прогноз, затем построение по граням, затем вывод. Наблюдение помогает открыть закономерность; доказательство записывается отдельно.'));
    const select=el('select',{'aria-label':'Семейство сечений'});A.labFamilies.forEach(f=>select.append(el('option',{value:f.id},f.title)));select.value=id;select.addEventListener('change',()=>{state.labs.family=select.value;save();show('labs',false);});portal.append(select,p(spec.description),p(spec.question,'lab-question'));
    const controls=el('section',{class:'master-panel lab-settings'});controls.append(el('h3',{},'Плоскость: '+model.equation));
    const rangeId='lab-level',range=el('input',{id:rangeId,type:'range',min:bounds.min,max:bounds.max,step:.01,value:s.level}),value=el('output',{'for':rangeId},'Уровень '+A.formatNumber(s.level));controls.append(el('label',{'for':rangeId},'Переместить секущую плоскость'),range,value);
    range.addEventListener('input',()=>{value.textContent='Новый уровень '+A.formatNumber(Number(range.value))+' — отпусти ползунок, чтобы начать новый опыт.';});range.addEventListener('change',()=>changeLab(s,model,{level:Number(range.value)}));
    const exact=el('div',{class:'critical-levels'});exact.append(p('Критические уровни в вершинах:','small'));bounds.critical.forEach(t=>exact.append(btn(A.formatNumber(t),()=>changeLab(s,model,{level:t}),'ghost',{'data-critical':t})));controls.append(exact);
    if(spec.height){const h=el('input',{id:'lab-height',type:'range',min:.2,max:1.5,step:.05,value:s.height}),out=el('output',{'for':'lab-height'},'h='+A.formatNumber(s.height));controls.append(el('label',{'for':'lab-height'},'Высота косой призмы'),h,out);h.addEventListener('input',()=>out.textContent='h='+A.formatNumber(Number(h.value)));h.addEventListener('change',()=>{const height=Number(h.value),b=A.labBounds(id,height);changeLab(s,model,{height,level:Math.max(b.min,Math.min(b.max,s.level))});});}
    const prediction=el('select',{'aria-label':'Прогноз пересечения',disabled:s.predictionLocked});[['','Сначала мой прогноз…'],['empty','Пересечение пусто'],['point','Только точка'],['segment','Только отрезок'],['3','Треугольник'],['4','Четырёхугольник'],['5','Пятиугольник'],['6','Шестиугольник']].forEach(([v,t])=>prediction.append(el('option',{value:v},t)));prediction.value=s.prediction;prediction.addEventListener('change',()=>{if(s.predictionLocked)return;s.prediction=prediction.value;save();});controls.append(el('label',{},'Какое пересечение ожидаешь?'),prediction);if(s.predictionLocked)controls.append(p('Прогноз зафиксирован при начале построения. Для новой гипотезы начни опыт с другими данными; первоначальный прогноз останется в журнале.','small'));portal.append(controls);
    const work=el('section',{class:'lab-workbench'}),modelPanel=el('div',{class:'master-panel lab-model-panel'}),frame=el('div',{class:'model-frame'}),stepIndex=s.justBuilt&&s.revealed?s.revealed-1:Math.min(s.revealed,model.steps.length-1),step=model.steps[stepIndex],plane=model.model.planes.find(p=>p.id===step.plane);
    frame.append(el('div',{class:'model-caption'},'Рабочая плоскость: '+plane.label));modelPanel.append(frame,p('Вращение меняет только вид. Новые отрезки появляются после отдельного действия в указанной плоскости.','model-help'));visual=api.createScene(frame,model,camera=>{s.camera=camera;save();});
    visual.update({viewCount:s.revealed,planeId:step.plane,planeView:s.flat,camera:s.camera,showHelpers:true,showResult:s.revealed===model.steps.length});
    const modelControls=el('div',{class:'model-controls'});modelControls.append(btn(s.flat?'Объёмная модель':'В этой плоскости',()=>{s.flat=!s.flat;save();show('labs',false);},'plane-toggle',{'data-action':'lab-flat'}),btn('Исходный вид',()=>{s.camera={yaw:-.65,pitch:.46};save();show('labs',false);},'reset-camera'));modelPanel.append(modelControls);
    const panel=el('div',{class:'master-panel lab-step-panel'});panel.append(p('Рассмотрено граней: '+s.revealed+' из '+model.steps.length,'eyebrow'));
    if(s.justBuilt&&s.revealed<model.steps.length){panel.append(el('h3',{},'Действие выполнено в '+plane.label),p(step.action),p('Новая линия остаётся в своей рабочей плоскости. Перейди к следующей грани отдельным действием.','small'),btn('К следующей грани',()=>{s.justBuilt=false;save();show('labs',false);},'primary',{'data-action':'lab-advance'}));}else if(s.revealed<model.steps.length){panel.append(el('h3',{},step.title),p(plane.description,'plane-tag'),p(step.reason),p(step.action,'step-note'),btn('Выполнить действие в этой плоскости',()=>{s.revealed++;s.justBuilt=true;s.predictionLocked=true;save();show('labs',false);},'primary',{'data-action':'lab-next'}));}else{
      panel.append(el('h3',{},model.classification));if(s.prediction)panel.append(p(s.prediction===predictionKey(model)?'Прогноз совпал. Теперь объясни, почему.':'Результат отличается от прогноза. Найди, где изменились пересечения рёбер.','feedback '+(s.prediction===predictionKey(model)?'good':'retry')));
      if(model.dimension===2)panel.append(p('Площадь: '+A.formatNumber(model.area)+' · периметр: '+A.formatNumber(model.perimeter),'lab-measures'),p('Числа вычислены по пространственным координатам. Они служат проверкой, а не доказательством общей формулы.','teacher-note'));
      for(const row of model.extra)panel.append(p(row.label+': '+A.formatNumber(row.value)));
      if(model.normalInfo){const n=model.normalInfo;panel.append(p(n.full?'Сечение пересекает все четыре боковых ребра.':'Не все боковые рёбра пересечены: это не полное нормальное сечение для формулы боковой поверхности.','step-note'),p('Для пересечения всех боковых рёбер требуется '+A.formatNumber(n.low)+' ≤ уровень ≤ '+A.formatNumber(n.high)+'. '+(!n.exists?'Нижняя граница больше верхней: при этой высоте полного нормального сечения внутри данной призмы нет.':'')))}
      panel.append(btn('Повторить построение при тех же данных',()=>{archiveLab(s,model);s.revealed=0;s.justBuilt=false;s.notes='';save();show('labs',false);},'ghost',{'data-action':'lab-restart'}));
    }
    work.append(modelPanel,panel);portal.append(work);
    if(s.revealed){const old=el('ol');model.steps.slice(0,s.revealed).forEach(st=>{const li=el('li');li.append(el('strong',{},st.title),p(st.action),p(st.reason,'small'));old.append(li);});portal.append(disclosure('Выполненные действия по граням',[old]));}
    if(s.revealed===model.steps.length){const table=el('table',{class:'master-table'}),head=el('thead'),hr=el('tr');['Ребро','F в начале','F в конце','Параметр / случай'].forEach(x=>hr.append(el('th',{},x)));head.append(hr);table.append(head);const body=el('tbody');model.edgeRows.forEach(row=>{const tr=el('tr');[row.edge,A.formatNumber(row.from),A.formatNumber(row.to),row.parameter===null?(row.coplanar?'всё ребро в плоскости':'пересечения нет'):A.formatNumber(row.parameter)+(row.parameter<0||row.parameter>1?' — за ребром':' — на ребре')].forEach(x=>tr.append(el('td',{},x)));body.append(tr);});table.append(body);portal.append(disclosure('Проверить пересечения каждого конечного ребра',[elWrap(table,'table-scroll')]));}
    const notes=el('section',{class:'master-panel'});notes.append(el('label',{'for':'lab-notes'},'Мой вывод: наблюдение отдельно, доказательство отдельно'));const area=el('textarea',{id:'lab-notes',placeholder:'Наблюдаю: …\nПредполагаю: …\nОбосновываю: …'});area.value=s.notes;area.addEventListener('input',()=>{s.notes=area.value;save();});notes.append(area,p('При изменении параметра выполненная работа автоматически остаётся в журнале опытов.','teacher-note'));portal.append(notes);
    if(s.history.length){const history=el('div');s.history.slice().reverse().forEach(h=>{const row=el('article',{class:'drill-history-row'});row.append(p('Уровень '+A.formatNumber(h.level)+(spec.height?', h='+A.formatNumber(h.height):'')+' · '+h.result),p('Первоначальный прогноз: '+predictionLabel(h.prediction)+'.','small'),p(h.notes||'Вывод не записан.','small'),btn('Вернуться к этому опыту',()=>{archiveLab(s,model);Object.assign(s,{level:h.level,height:h.height,revealed:h.revealed,justBuilt:!!h.justBuilt,prediction:h.prediction,predictionLocked:!!h.predictionLocked||h.revealed>0,notes:h.notes});save();show('labs',false);},'ghost'));history.append(row);});portal.append(disclosure('Журнал опытов ('+s.history.length+')',[history]));}
  }
  function elWrap(child,cls){const x=el('div',{class:cls});x.append(child);return x;}
  function renderControl(){
    portal.append(title('Проверяем на новом наборе','САМОСТОЯТЕЛЬНАЯ РАБОТА','Пять заданий без сообщения о верности по ходу. После завершения — результат, объяснения и подходящие тренировки. Письменное доказательство проверяется отдельно.'));
    const select=el('select',{'aria-label':'Самостоятельная работа'});A.assessments.forEach(x=>select.append(el('option',{value:x.id},x.title)));select.value=state.examId;select.addEventListener('change',()=>{state.examId=select.value;save();show('control',false);});portal.append(select);
    const id=state.examId,s=state.exams[id]||(state.exams[id]={run:0,started:false,finished:false,answers:{},proof:'',assisted:false,history:[]}),exam=A.makeExam(id,s.run);
    if(!s.started){const box=el('section',{class:'master-panel'});box.append(el('h3',{},exam.title),p(exam.description),p('Таймера нет. Ответы можно менять до отправки. Если во время работы открыть материалы курса, это сохранится как помощь.'),btn('Начать пять заданий',()=>{s.started=true;s.position=0;save();show('control',false);},'primary',{'data-action':'exam-start'}));portal.append(box);return;}
    if(s.finished){const score=exam.questions.reduce((n,q,i)=>n+Number(correct(q,s.answers[i])),0),box=el('section',{class:'master-panel'});box.append(el('h3',{},'Автоматическая часть: '+score+' из '+exam.questions.length),p(s.assisted?'Во время этой попытки открывались другие материалы. Результат сохранён как работа с помощью.':'В этой попытке переходы к помощи не зафиксированы. Это результат короткой автоматической части, а не оценка полного доказательства.'),p('Самостоятельная работа завершена. Для следующей проверки будет подготовлен новый набор.','teacher-note'));
      exam.questions.forEach((q,i)=>{const good=correct(q,s.answers[i]),row=el('article',{class:'exam-review '+(good?'correct':'needs-work')});row.append(el('h4',{},(i+1)+'. '+(good?'Ответ совпал':'Нужно разобрать')),p(q.prompt),p('Твой ответ: '+(q.kind==='choice'?q.options[Number(s.answers[i])]:s.answers[i])),p('Верный ответ: '+answerText(q)),p(q.rule));if(!good)row.append(btn('Потренировать это умение',()=>openPractice(q.topic),'ghost'));box.append(row);});
      box.append(el('h3',{},'Письменная часть для преподавателя'),p(exam.proof),p(s.proof||'Текст доказательства пока не записан.','proof-record'),p('Автоматическая оценка доказательства не выставляется. Обсудите плоскость каждого действия, перенос принадлежности, полноту границы и вычисления.','teacher-note'),btn('Новая попытка с новым набором',()=>{s.history.push({run:s.run,score,assisted:s.assisted,answers:s.answers,proof:s.proof});Object.assign(s,{run:s.run+1,started:false,finished:false,answers:{},proof:'',assisted:false,helpReason:'',position:0});save();show('control',false);},'primary',{'data-action':'exam-new'}));portal.append(box);return;
    }
    s.position=Math.max(0,Math.min(s.position||0,exam.questions.length-1));const i=s.position,q=exam.questions[i],card=el('section',{class:'master-panel exam-question'});card.append(p('Задание '+(i+1)+' из '+exam.questions.length+' · сохранено ответов '+Object.keys(s.answers).filter(k=>String(s.answers[k]).trim()!=='').length,'eyebrow'),p(q.prompt,'drill-prompt'));
    if(q.scene){const frame=el('div',{class:'model-frame drill-model'});frame.append(el('div',{class:'model-caption'},'Исходная фигура'));card.append(frame);visual=api.createScene(frame,q.scene,()=>{});visual.update({viewCount:0,planeId:null,planeView:false,camera:{yaw:-.65,pitch:.46},showHelpers:true,showResult:false});}
    if(q.kind==='choice'){const choices=el('div',{class:'check-options'});q.options.forEach((answer,index)=>{const b=btn('',()=>{s.answers[i]=index;save();show('control',false);},s.answers[i]!==undefined&&Number(s.answers[i])===index?'selected':'',{'data-exam-option':index});b.append(math(answer));choices.append(b);});card.append(choices);}else{const input=el('input',{id:'exam-answer',type:'text',inputmode:'decimal',autocomplete:'off',value:s.answers[i]??''});card.append(el('label',{'for':'exam-answer'},'Ответ'+(q.unit?' ('+q.unit+')':'')),input,p('Можно вводить десятичное число или дробь 4/3.','small muted'));input.addEventListener('input',()=>{s.answers[i]=input.value;save();});}
    card.append(p('Ответ сохраняется. Верность будет показана только после отправки всех пяти заданий.','teacher-note'));
    const navigation=el('div',{class:'master-actions'});navigation.append(btn('← Предыдущее',()=>{s.position--;save();show('control',false);},'ghost',{disabled:i===0}),btn('Следующее →',()=>{s.position++;save();show('control',false);},'primary',{disabled:i===exam.questions.length-1}));card.append(navigation);portal.append(card);
    const proof=el('section',{class:'master-panel'});proof.append(el('h3',{},'Отдельное построение и доказательство'),p(exam.proof));const draft=el('textarea',{id:'exam-proof',placeholder:'Дано и цель…\nРабочие плоскости и основания…\nГраница сечения…\nВычисления и проверка…'});draft.value=s.proof;draft.addEventListener('input',()=>{s.proof=draft.value;save();});proof.append(draft,p('Эта часть не входит в автоматический счёт 0–5 и проверяется преподавателем.','teacher-note'));portal.append(proof);
    const notice=el('p',{class:'feedback',role:'status'}),finish=btn('Отправить все пять ответов',()=>{const missing=exam.questions.findIndex((x,j)=>s.answers[j]===undefined||String(s.answers[j]).trim()===''||(x.kind==='number'&&!Number.isFinite(parse(s.answers[j]))));if(missing>=0){notice.className='feedback retry';notice.textContent='Заполни ответ к заданию '+(missing+1)+' в допустимом формате. Верность пока не оценивается.';return;}s.finished=true;save();show('control',false);},'primary',{'data-action':'exam-finish'});portal.append(finish,notice);
  }
  function renderTeacher(){
    portal.append(title('Как проводить курс','ДЛЯ ПРЕПОДАВАТЕЛЯ','Порядок обучения задаёт путь из '+(C.learningPath||[]).length+' этапов. Для основных тем предложен ориентир нагрузки: 32 занятия по 55 минут. Время на вводные ступени, переходные упражнения и возвращение к пробелам добавляется по готовности ученика.'));
    const principles=el('div',{class:'master-grid'});for(const [name,text]of C.teachingPrinciples||[]){const card=el('section',{class:'master-card'});card.append(el('h3',{},name),p(text));principles.append(card);}portal.append(principles);
    const plan=el('table',{class:'master-table'}),head=el('tr');['Число занятий','Фокус','Работа','Выход'].forEach(t=>head.append(el('th',{},t)));plan.append(head);for(const row of C.sessionPlan||[]){const tr=el('tr'),range=String(row[0]).match(/\d+/g)?.map(Number)||[],duration=range.length>1?range[range.length-1]-range[0]+1:range[0]||row[0];[duration,...row.slice(1)].forEach(x=>tr.append(el('td',{},x)));plan.append(tr);}portal.append(disclosure('Ориентировочное время по темам',[p('Таблица показывает нагрузку по темам. Последовательность заданий и подготовительных действий смотрите в разделе «Мой путь».'),elWrap(plan,'table-scroll')]));
    const rubric=el('div');for(const [label,text]of C.rubric||[])rubric.append(el('h4',{},label),p(text));portal.append(disclosure('Критерии проверки доказательства',[p('По каждому пункту: обосновано / требуется уточнение / пока отсутствует. Чекбокс ученика — самоотчёт, не автоматическая проверка.'),rubric]));
    const sources=el('div');for(const src of C.sources||[]){const box=el('article',{class:'source-card'});box.append(el('h4',{},src.title),p(src.detail,'small muted'),p(src.used),p(src.coverage,'small'));sources.append(box);}portal.append(disclosure('Как использованы пять комплектов материалов',[p('Курс организован по умениям. Авторские условия, сохранённые задачи пособия и лаборатории обозначены отдельно.'),sources]));
    if(C.sourceNotes?.length)portal.append(disclosure('Уточнения и ошибки источников',C.sourceNotes.map(x=>p(x))));
    const session=el('section',{class:'master-panel'});session.append(el('h3',{},'Ритм одного занятия'),list(['5–7 минут: вспомнить нужное правило на коротком новом примере.','8–12 минут: разобрать одну идею с моделью, выполняя по одному действию.','15–20 минут: самостоятельное построение и объяснение плоскостей.','5–10 минут: при затруднении потренировать отдельное умение и вернуться.','5–8 минут: новая короткая задача на перенос и запись вывода.']),p('Слабому ученику можно оставить один полноценный разбор и один новый аналог. Более сильному — предложить второй метод, обратную задачу или исследование параметра.','teacher-note'));portal.append(session);
    const stats=stageStats();portal.append(p('История этого браузера: '+stats.started+' начатых карточек, '+stats.built+' законченных построений. Состояние отдельных задач, практикума, лабораторий и контрольных сохраняется локально. Для переноса между устройствами можно выгрузить отчёт, но совместная доска этим файлом не синхронизируется.'));
    portal.append(btn('Скачать отчёт о ходе работы',()=>{const blob=new Blob([JSON.stringify({course:C.title,version:C.version,exportedAt:new Date().toISOString(),lessons:api.getState(),activities:state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=el('a',{href:url,download:'Sections_Learning_Progress.json'});link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'ghost'));
  }
  nav=el('nav',{class:'master-nav',role:'tablist','aria-label':'Разделы большого курса'});for(const[id,label]of [['map','Мой путь'],['lessons','Задачи'],['practice','Практика'],['labs','Опыты'],['control','Контроль'],['teacher','Учителю']])nav.append(btn(label,()=>show(id),'',{'data-view':id,role:'tab','aria-selected':false}));
  portal=el('main',{class:'master-portal',id:'master-portal',tabindex:'-1'});host.insertBefore(nav,layout);host.insertBefore(portal,layout);
  window.addEventListener('sections:practice',e=>openPractice(e.detail.topic,{lessonId:e.detail.lessonId,scroll:window.scrollY}));
  window.addEventListener('sections:lesson',e=>{const lesson=lessonById.get(e.detail?.id||e.detail?.lessonId||api.getState().current);if(lesson?.pathStageId){state.path.stageId=lesson.pathStageId;save();}if(state.view!=='lessons')show('lessons',false);});
  window.addEventListener('sections:route',e=>{const stageId=e.detail?.stageId||lessonById.get(api.getState().current)?.pathStageId;if((C.learningPath||[]).some(x=>x.id===stageId))state.path.stageId=stageId;show('map');});
  window.SECTIONS_MASTER=Object.freeze({getState:()=>JSON.parse(JSON.stringify(state)),show,openLesson,openPractice,openLab,openExam});
  // A shared exercise link must open that exercise, not hide it behind the map.
  let linkedLesson=null;
  try { linkedLesson=lessonById.get(decodeURIComponent(location.hash.slice(1))) || null; } catch (_) {}
  if(linkedLesson){
    state.view='lessons';
    if(linkedLesson.pathStageId)state.path.stageId=linkedLesson.pathStageId;
  }
  show(['map','lessons','practice','labs','control','teacher'].includes(state.view)?state.view:'map',false);
})();
