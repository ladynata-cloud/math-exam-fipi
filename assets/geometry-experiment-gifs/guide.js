/* Optional recordings of the real geometry controls. Never operates the pupil's model. */
(function (root) {
  'use strict';

  const mounted = new WeakMap();
  let stopOtherPlayback = null;

  function element(tag, text, attrs) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
    return node;
  }

  function mount(host, config, surface) {
    if (!host) return { destroy() {}, stop() {} };
    mounted.get(host)?.destroy();
    const source = config?.clips || [];
    const catalogue = Array.isArray(source) ? Object.fromEntries(source.map(clip => [clip.id, clip])) : source;
    const ids = config?.[surface || 'manual'] || [];
    const clips = ids.map(id => catalogue[id]).filter(clip => clip && Array.isArray(clip.steps) && clip.steps.length);
    if (!clips.length) return { destroy() {}, stop() {} };

    const section = element('section', '', { class: 'geometry-experiment-guide', 'aria-label': 'Как выполнить эксперимент' });
    const heading = element('div', '', { class: 'geg-heading' });
    heading.append(element('h3', 'Как выполнить эксперимент'), element('span', 'GIF · по шагам', { class: 'geg-badge' }));
    section.append(heading);
    let chooser;
    if (clips.length > 1) {
      const label = element('label', 'Выбери пример', { class: 'geg-choose' });
      chooser = element('select', '', { 'aria-label': 'Пример действия на чертеже' });
      for (const clip of clips) chooser.append(element('option', clip.title, { value: clip.id }));
      label.append(chooser);
      section.append(label);
    }

    const layout = element('div', '', { class: 'geg-layout' });
    const preview = element('button', '', { type: 'button', class: 'geg-preview', 'aria-label': 'Открыть пример крупно', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' });
    let image = element('img', '', { alt: '', decoding: 'async', loading: 'lazy' });
    preview.append(image);
    const body = element('div', '', { class: 'geg-body' });
    const title = element('p', '', { class: 'geg-title' });
    const caption = element('p', '', { class: 'geg-caption', 'aria-live': 'polite', 'aria-atomic': 'true' });
    const controls = element('div', '', { class: 'geg-controls', role: 'group', 'aria-label': 'Просмотр инструкции' });
    const play = element('button', 'Смотреть GIF', { type: 'button', class: 'geg-play', 'aria-pressed': 'false' });
    const previous = element('button', '← Шаг', { type: 'button', 'aria-label': 'Предыдущий шаг инструкции' });
    const next = element('button', 'Шаг →', { type: 'button', 'aria-label': 'Следующий шаг инструкции' });
    const repeat = element('button', 'Сначала', { type: 'button', 'aria-label': 'Повторить инструкцию с начала' });
    const size = element('button', 'Крупно', { type: 'button', class: 'geg-enlarge', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' });
    controls.append(play, previous, next, repeat, size);
    const note = element('p', '', { class: 'geg-note' });
    const status = element('p', '', { class: 'geg-status', role: 'status' });
    body.append(title, caption, controls, note, status);
    layout.append(preview, body);
    section.append(layout);
    const transcript = element('details', '', { class: 'geg-transcript' });
    const list = element('ol');
    transcript.append(element('summary', 'Все шаги текстом'), list);
    section.append(transcript);

    const dialog = element('dialog', '', { class: 'geg-dialog', 'aria-label': 'Крупный просмотр инструкции' });
    const dialogHeader = element('div', '', { class: 'geg-dialog-header' });
    const dialogTitle = element('h3');
    const close = element('button', 'Закрыть', { type: 'button', class: 'geg-dialog-close', autofocus: '' });
    dialogHeader.append(dialogTitle, close);
    const dialogCaption = element('p', '', { class: 'geg-dialog-caption', 'aria-live': 'polite', 'aria-atomic': 'true' });
    const dialogControls = element('div', '', { class: 'geg-controls geg-dialog-controls', role: 'group', 'aria-label': 'Крупный просмотр по шагам' });
    const dialogPlay = element('button', 'Смотреть GIF крупно', { type: 'button', class: 'geg-dialog-play', 'aria-pressed': 'false' });
    const dialogPrevious = element('button', '← Шаг', { type: 'button', 'aria-label': 'Предыдущий шаг крупно' });
    const dialogNext = element('button', 'Шаг →', { type: 'button', 'aria-label': 'Следующий шаг крупно' });
    const zoomOut = element('button', '−', { type: 'button', 'aria-label': 'Уменьшить изображение' });
    const zoomValue = element('output', '', { class: 'geg-zoom-value', 'aria-label': 'Масштаб изображения' });
    const zoomIn = element('button', '+', { type: 'button', 'aria-label': 'Увеличить изображение' });
    const fit = element('button', 'Вместить', { type: 'button' });
    dialogControls.append(dialogPlay, dialogPrevious, dialogNext, zoomOut, zoomValue, zoomIn, fit);
    const scroll = element('div', '', { class: 'geg-dialog-scroll', tabindex: '0', 'aria-label': 'Изображение: при увеличении прокручивай его пальцем или стрелками' });
    let dialogImage = element('img', '', { alt: '', decoding: 'async' });
    scroll.append(dialogImage);
    const dialogStatus = element('p', '', { class: 'geg-status', role: 'status' });
    dialog.append(dialogHeader, dialogCaption, dialogControls, scroll, dialogStatus);
    section.append(dialog);
    host.append(section);

    const media = root.matchMedia?.('(prefers-reduced-motion: reduce)');
    let clip = clips[0], frame = 0, playing = false, destroyed = false, zoom = 1, opener = null;
    const removers = [];
    const listen = (node, type, handler, options) => {
      node.addEventListener(type, handler, options);
      removers.push(() => node.removeEventListener(type, handler, options));
    };
    const stepText = index => typeof clip.steps[index] === 'string' ? clip.steps[index] : clip.steps[index]?.caption || '';
    const frameSource = index => {
      const item = clip.frames?.[index];
      return (typeof item === 'string' ? item : item?.src) || clip.poster || '';
    };
    const naturalWidth = () => Number(clip.width) || 720;
    const fitZoom = () => Math.min(1, Math.max(1, scroll.clientWidth - 2) / naturalWidth());

    function setZoom(value) {
      zoom = Math.max(fitZoom(), Math.min(2, value));
      dialogImage.style.width = Math.round(naturalWidth() * zoom) + 'px';
      zoomValue.textContent = Math.round(zoom * 100) + '%';
      zoomOut.disabled = zoom <= fitZoom() + .001;
      zoomIn.disabled = zoom >= 2;
    }

    function showFrame() {
      const src = frameSource(frame);
      for (const picture of [image, dialogImage]) {
        picture.alt = `Шаг ${frame + 1}. ${stepText(frame)}`;
        picture.hidden = !src;
        if (src && picture.getAttribute('src') !== src) picture.src = src;
      }
      caption.textContent = dialogCaption.textContent = `Шаг ${frame + 1} из ${clip.steps.length}. ${stepText(frame)}`;
      previous.disabled = dialogPrevious.disabled = frame === 0;
      next.disabled = dialogNext.disabled = frame === clip.steps.length - 1;
      section.dataset.playing = 'false';
    }

    function stop() {
      if (destroyed) return;
      if (stopOtherPlayback === stop) stopOtherPlayback = null;
      playing = false;
      play.textContent = 'Смотреть GIF';
      dialogPlay.textContent = 'Смотреть GIF крупно';
      play.setAttribute('aria-pressed', 'false');
      dialogPlay.setAttribute('aria-pressed', 'false');
      section.dataset.expanded = 'false';
      showFrame();
    }

    function playFromStart() {
      if (destroyed || !clip.gif || media?.matches || document.hidden) return;
      stopOtherPlayback?.();
      stopOtherPlayback = stop;
      frame = 0;
      showFrame();
      playing = true;
      // Animate only the visible view, using a new image to restart without cache-busting.
      const picture = element('img', '', { alt: clip.title + '. Порядок действий в записи.', decoding: 'async' });
      picture.src = clip.gif;
      if (dialog.open) {
        dialogImage = picture;
        scroll.replaceChildren(picture);
        setZoom(zoom);
      } else {
        image = picture;
        preview.replaceChildren(picture);
        section.dataset.expanded = 'true';
      }
      play.textContent = 'Остановить GIF';
      dialogPlay.textContent = 'Остановить GIF крупно';
      play.setAttribute('aria-pressed', 'true');
      dialogPlay.setAttribute('aria-pressed', 'true');
      caption.textContent = dialogCaption.textContent = 'Посмотри порядок действий. Затем повтори их на своём чертеже.';
      previous.disabled = dialogPrevious.disabled = true;
      next.disabled = dialogNext.disabled = clip.steps.length < 2;
      section.dataset.playing = 'true';
      status.textContent = dialogStatus.textContent = '';
    }

    function closeDialog() {
      if (dialog.open) dialog.close();
      stop();
    }

    function openDialog() {
      stop();
      if (typeof dialog.showModal !== 'function') {
        transcript.open = true;
        status.textContent = 'Все шаги доступны текстом и отдельными кадрами.';
        return;
      }
      opener = document.activeElement;
      dialog.showModal();
      size.setAttribute('aria-expanded', 'true');
      preview.setAttribute('aria-expanded', 'true');
      setZoom(fitZoom());
      scroll.scrollTop = scroll.scrollLeft = 0;
      close.focus();
    }

    function motionPreference() {
      if (media?.matches) stop();
      play.disabled = dialogPlay.disabled = !!media?.matches || !clip.gif;
      status.textContent = dialogStatus.textContent = media?.matches ? 'Включён режим без анимации. Смотри неподвижные шаги кнопками «Шаг».' : '';
    }

    function selectClip(value) {
      stop();
      clip = clips.find(item => item.id === value) || clips[0];
      frame = 0;
      section.dataset.clip = clip.id;
      title.textContent = dialogTitle.textContent = clip.title;
      list.replaceChildren(...clip.steps.map((step, index) => element('li', stepText(index))));
      note.textContent = clip.note || 'Это отдельный пример. Твоё построение и записи остаются на месте.';
      showFrame();
      motionPreference();
      if (dialog.open) setZoom(fitZoom());
    }

    const backward = () => { stop(); frame = Math.max(0, frame - 1); showFrame(); };
    const forward = () => { stop(); frame = Math.min(clip.steps.length - 1, frame + 1); showFrame(); };
    listen(play, 'click', () => playing ? stop() : playFromStart());
    listen(dialogPlay, 'click', () => playing ? stop() : playFromStart());
    listen(previous, 'click', backward);
    listen(dialogPrevious, 'click', backward);
    listen(next, 'click', forward);
    listen(dialogNext, 'click', forward);
    listen(repeat, 'click', () => { const wasPlaying = playing; stop(); frame = 0; showFrame(); if (wasPlaying) playFromStart(); });
    listen(preview, 'click', openDialog);
    listen(size, 'click', openDialog);
    listen(close, 'click', closeDialog);
    listen(dialog, 'close', () => {
      stop();
      size.setAttribute('aria-expanded', 'false');
      preview.setAttribute('aria-expanded', 'false');
      if (!destroyed && opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    });
    listen(dialog, 'cancel', stop);
    listen(dialog, 'keydown', event => {
      if (event.key !== 'Tab' || !dialog.open) return;
      const targets = Array.from(dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]'));
      const first = targets[0], last = targets[targets.length - 1];
      // Native modal inertness protects the page; keep Tab from taking an extra
      // turn through the browser chrome at either end of this compact viewer.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    listen(zoomIn, 'click', () => setZoom(zoom + .25));
    listen(zoomOut, 'click', () => setZoom(zoom - .25));
    listen(fit, 'click', () => { setZoom(fitZoom()); scroll.scrollTop = scroll.scrollLeft = 0; });
    listen(root, 'resize', () => { if (dialog.open) setZoom(Math.max(zoom, fitZoom())); });
    if (chooser) listen(chooser, 'change', () => selectClip(chooser.value));
    listen(section, 'error', event => {
      if (destroyed || ![image, dialogImage].includes(event.target)) return;
      if (playing) stop();
      else event.target.hidden = true;
      status.textContent = dialogStatus.textContent = 'Изображение не загрузилось. Все действия можно прочитать ниже.';
      transcript.open = true;
    }, true);
    // Keep guide controls out of lesson-level answer, progress and construction handlers.
    for (const type of ['click', 'input', 'change', 'submit']) listen(section, type, event => event.stopPropagation());
    listen(document, 'visibilitychange', () => { if (document.hidden) stop(); });
    listen(root, 'pagehide', closeDialog);
    listen(root, 'hashchange', closeDialog);
    listen(document, 'toggle', event => {
      if (event.target?.tagName === 'DETAILS' && !event.target.open && event.target.contains(section)) closeDialog();
    }, true);
    if (media?.addEventListener) listen(media, 'change', motionPreference);
    else if (media?.addListener) {
      media.addListener(motionPreference);
      removers.push(() => media.removeListener(motionPreference));
    }

    const api = {
      stop,
      destroy() {
        if (destroyed) return;
        closeDialog();
        destroyed = true;
        removers.splice(0).forEach(remove => remove());
        section.remove();
        if (mounted.get(host) === api) mounted.delete(host);
      }
    };
    mounted.set(host, api);
    selectClip(clip.id);
    return api;
  }

  const attached = new WeakMap();
  // Observe the existing stage containers instead of replacing either lesson engine.
  // The harmonized topic experiment and its retained manual board are distinct surfaces.
  function attach(lesson, config) {
    if (!lesson || !config) return { destroy() {} };
    attached.get(lesson)?.destroy();
    const active = new Map();
    let stopped = false, scheduled = false;
    const rules = [
      ['manual', '#geo-board', 'canvas'],
      ['experiments', '#extra-model', 'input,select,canvas,svg'],
      ['investigations', '#topic-investigation', '.topic-investigation']
    ];
    function reconcile() {
      scheduled = false;
      if (stopped) return;
      for (const [anchor, entry] of active) {
        if (!lesson.contains(anchor) || !entry.host.isConnected) {
          entry.instance.destroy();
          entry.host.remove();
          active.delete(anchor);
        }
      }
      for (const [surface, selector, content] of rules) {
        const anchor = lesson.querySelector(selector);
        if (!anchor || !anchor.querySelector(content) || !config[surface]?.length || active.has(anchor)) continue;
        const host = element('div', '', { 'data-geometry-guide-surface': surface });
        anchor.before(host);
        active.set(anchor, { host, instance: mount(host, config, surface) });
      }
    }
    const observer = new MutationObserver(() => {
      if (!scheduled && !stopped) {
        scheduled = true;
        queueMicrotask(reconcile);
      }
    });
    observer.observe(lesson, { childList: true, subtree: true });
    reconcile();
    const api = { destroy() {
      stopped = true;
      observer.disconnect();
      for (const entry of active.values()) { entry.instance.destroy(); entry.host.remove(); }
      active.clear();
      if (attached.get(lesson) === api) attached.delete(lesson);
    } };
    attached.set(lesson, api);
    return api;
  }

  root.MathExamGeometryExperimentGifs = { mount, attach };
})(window);
