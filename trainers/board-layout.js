/* Local presentation only: no trainer, drawing, room or account state. */
(function () {
  'use strict';

  const lesson = document.getElementById('lesson');
  const divider = document.getElementById('boardDivider');
  const layout = document.getElementById('boardLayout');
  if (!lesson || !divider || !layout || !document.getElementById('trainerFrame')) return;
  if (divider.dataset.layoutReady === 'true') return;
  divider.dataset.layoutReady = 'true';

  const preferenceKey = 'mathexam.trainerBoard.split.v1';
  const viewPreferenceKey = 'mathexam.trainerBoard.view.v1';
  const presets = Object.freeze({ balanced: 50, trainer: 62, board: 38 });
  const views = ['split', 'trainer', 'board'];
  const modeGroup = document.getElementById('workspaceModes');
  const modeButtons = modeGroup ? Array.from(modeGroup.querySelectorAll('[data-workspace-view]')) : [];
  const workspaceHeader = modeGroup?.closest('.workspace-bar');
  const wide = window.matchMedia('(min-width: 901px)');
  let percent = 50;
  let view = 'split';
  let drag = null;
  let resizeFrame = 0;

  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.disabled = true;
  custom.hidden = true;
  layout.append(custom);

  divider.setAttribute('role', 'separator');
  divider.setAttribute('aria-orientation', 'vertical');
  divider.setAttribute('aria-valuemin', '30');
  divider.setAttribute('aria-valuemax', '70');
  if (!divider.hasAttribute('aria-label')) divider.setAttribute('aria-label', 'Ширина тренажёра и доски');
  if (!divider.hasAttribute('title')) divider.title = 'Перетащите или используйте стрелки ← →. Home — поровну.';

  function readPreference() {
    try {
      const value = localStorage.getItem(preferenceKey);
      return typeof value === 'string' && /^(?:[3-6]\d|70)$/.test(value) ? Number(value) : 50;
    } catch (_) { return 50; }
  }

  function savePreference() {
    try { localStorage.setItem(preferenceKey, String(percent)); } catch (_) {}
  }

  function readViewPreference() {
    try {
      const value = localStorage.getItem(viewPreferenceKey);
      return views.includes(value) ? value : 'split';
    } catch (_) { return 'split'; }
  }

  function visibleView() {
    if (lesson.classList.contains('hide-trainer')) return 'board';
    return lesson.classList.contains('trainer-only') ? 'trainer' : 'split';
  }

  function reflectView() {
    modeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.workspaceView === view));
    });
    ['toggleTrainer', 'toggleTrainerBoard'].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.textContent = view === 'board' ? 'Показать тренажёр' : 'Скрыть тренажёр';
    });
    updateAvailability();
  }

  function saveViewPreference() {
    try { localStorage.setItem(viewPreferenceKey, view); } catch (_) {}
  }

  function changeView(next, persist = false) {
    if (!views.includes(next)) return;
    const changed = next !== visibleView();
    if (changed) {
      document.dispatchEvent(new CustomEvent('board:view-changing', { detail: { view: next } }));
      finish(true);
      lesson.classList.toggle('hide-trainer', next === 'board');
      lesson.classList.toggle('trainer-only', next === 'trainer');
    }
    view = next;
    reflectView();
    if (persist) saveViewPreference();
    if (changed) queueResize();
  }

  function measureHeader() {
    if (!workspaceHeader) return;
    const height = Math.ceil(workspaceHeader.getBoundingClientRect().height);
    if (!Number.isFinite(height) || height <= 0) return;
    const value = height + 'px';
    if (lesson.style.getPropertyValue('--workspace-header-height') === value) return;
    lesson.style.setProperty('--workspace-header-height', value);
    queueResize();
  }

  function queueResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      window.dispatchEvent(new Event('resize'));
    });
  }

  function apply(value, persist = false) {
    if (!Number.isFinite(value)) return;
    const next = Math.min(70, Math.max(30, Math.round(value)));
    const changed = next !== percent;
    percent = next;
    lesson.style.setProperty('--trainer-share', percent + 'fr');
    lesson.style.setProperty('--board-share', (100 - percent) + 'fr');
    divider.setAttribute('aria-valuenow', String(percent));
    divider.setAttribute('aria-valuetext', 'Тренажёр ' + percent + '%, доска ' + (100 - percent) + '%');
    const preset = Object.keys(presets).find(key => presets[key] === percent);
    custom.hidden = !!preset;
    custom.textContent = 'Своя ширина: ' + percent + '% / ' + (100 - percent) + '%';
    layout.value = preset || 'custom';
    lesson.dataset.layout = preset || 'custom';
    if (persist) savePreference();
    if (changed) queueResize();
  }

  function available() {
    return wide.matches && visibleView() === 'split';
  }

  function finish(cancelled) {
    if (!drag) return;
    const previous = drag;
    drag = null;
    previous.shield.remove();
    document.body.classList.remove('board-divider-dragging');
    divider.classList.remove('is-dragging');
    try {
      if (divider.hasPointerCapture(previous.id)) divider.releasePointerCapture(previous.id);
    } catch (_) {}
    if (cancelled) apply(previous.startPercent);
    else savePreference();
  }

  function updateAvailability() {
    const enabled = available();
    if (!enabled) finish(true);
    divider.hidden = !enabled;
    divider.tabIndex = enabled ? 0 : -1;
    divider.setAttribute('aria-disabled', String(!enabled));
    layout.disabled = !enabled;
  }

  function move(event) {
    if (!drag || event.pointerId !== drag.id || !Number.isFinite(event.clientX)) return;
    if (!available()) { finish(true); return; }
    event.preventDefault();
    const rect = lesson.getBoundingClientRect();
    const style = getComputedStyle(lesson);
    const number = name => parseFloat(style[name]) || 0;
    const left = number('paddingLeft') + number('borderLeftWidth');
    const right = number('paddingRight') + number('borderRightWidth');
    const dividerWidth = divider.getBoundingClientRect().width;
    const width = rect.width - left - right - dividerWidth;
    if (width <= 0) return;
    const trainerWidth = event.clientX - drag.offset - rect.left - left - dividerWidth / 2;
    apply(trainerWidth / width * 100);
  }

  divider.addEventListener('pointerdown', event => {
    if (!available() || drag || event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    divider.focus({ preventScroll: true });
    const rect = divider.getBoundingClientRect();
    const shield = document.createElement('div');
    shield.className = 'board-divider-shield';
    shield.setAttribute('aria-hidden', 'true');
    drag = { id: event.pointerId, startPercent: percent, offset: event.clientX - rect.left - rect.width / 2, shield };
    document.body.append(shield);
    document.body.classList.add('board-divider-dragging');
    divider.classList.add('is-dragging');
    try { divider.setPointerCapture(event.pointerId); } catch (_) {}
  });
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.id) return;
    move(event);
    finish(false);
  });
  window.addEventListener('pointercancel', event => {
    if (drag && event.pointerId === drag.id) finish(true);
  });
  divider.addEventListener('lostpointercapture', event => {
    if (drag && event.pointerId === drag.id) finish(true);
  });
  window.addEventListener('blur', () => finish(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish(true);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finish(true);
    }
  });
  divider.addEventListener('keydown', event => {
    if (!available() || drag || event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    const step = event.shiftKey ? 5 : 1;
    if (event.key === 'ArrowLeft') next = percent - step;
    else if (event.key === 'ArrowRight') next = percent + step;
    else if (event.key === 'Home') next = presets.balanced;
    else return;
    event.preventDefault();
    apply(next, true);
  });

  // BoardPicker installs the original preset handler first. Keep one owner for
  // both presets and the divider so a preset cannot leave a stale CSS ratio.
  layout.onchange = () => {
    const value = layout.value;
    if (!available() || !Object.prototype.hasOwnProperty.call(presets, value)) return;
    finish(true);
    apply(presets[value], true);
    queueResize();
  };
  wide.addEventListener('change', () => { updateAvailability(); queueResize(); });
  new MutationObserver(() => {
    // The older hide/show controls still own their action. Reflect their class
    // change locally without touching the room snapshot or reloading its iframe.
    const next = visibleView();
    if (modeGroup && next !== view) {
      view = next;
      saveViewPreference();
      reflectView();
      queueResize();
    } else updateAvailability();
  }).observe(lesson, { attributes: true, attributeFilter: ['class'] });
  modeButtons.forEach(button => {
    button.addEventListener('click', () => changeView(button.dataset.workspaceView, true));
  });
  if (workspaceHeader) {
    if (typeof ResizeObserver === 'function') new ResizeObserver(measureHeader).observe(workspaceHeader);
    window.addEventListener('resize', measureHeader);
  }

  apply(readPreference());
  if (modeGroup) changeView(readViewPreference());
  measureHeader();
  updateAvailability();
  queueResize();
})();
