(function (root) {
  'use strict';
  const quality = root.Vilenkin5Quality;
  if (!root.document || !quality) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)');
  let view = null;
  function path(file) { return (root.location.protocol === 'file:' ? '' : '/school/') + file; }
  function current() {
    const scene = quality.getState().scene;
    return scene && view?.lesson === scene.id ? scene.media : null;
  }
  function paint() {
    if (!view?.host.isConnected) return;
    const state = current();
    if (!state) return;
    const open = state.id === view.item.id && state.open;
    const playing = open && state.playing;
    const moving = playing && (quality.memoryOnly || view.manualMotion) && (!reduced?.matches || view.manualMotion);
    const details = view.host.querySelector('details'), picture = view.host.querySelector('img');
    if (details.open !== open) details.open = open;
    const src = path(moving ? view.item.src : view.item.poster);
    if (picture.getAttribute('src') !== src) picture.src = src;
    const button = view.host.querySelector('[data-v5-gif-toggle]');
    button.setAttribute('aria-pressed', String(playing));
    button.textContent = playing ? '■ Остановить' : '▶ Посмотреть анимацию';
    view.host.querySelector('[data-v5-media-status]').textContent = moving
      ? 'Анимация повторяется. Останови её, чтобы спокойно прочитать объяснение.'
      : playing ? 'На общей доске анимация запущена. Здесь оставлен статичный кадр: включено уменьшение движения.'
      : 'Показан итоговый кадр. Движение начнётся по нажатию кнопки.';
  }
  function update(value, helped = false) {
    quality.updateMedia(value, helped);
    paint();
  }
  function mount() {
    const host = root.document.querySelector('[data-v5-media-host]');
    const scene = quality.getState().scene;
    if (!host || !scene) { view = null; return; }
    const lesson = root.WorkshopCurriculum.byId[scene.id];
    const id = 'u' + String(lesson.point).padStart(2, '0');
    const item = root.Vilenkin5MediaData?.find(row => row.id === id);
    if (!item) { view = null; return; }
    const old = view;
    view = { host, lesson: scene.id, item, manualMotion: old?.lesson === scene.id && old.manualMotion };
    const identity = view;
    host.innerHTML = '<details class="v5-media"><summary>Объяснение в движении · GIF</summary><div class="v5-media-body"><p class="eyebrow">Другой пример · исследуем способ</p><h3>' + esc(item.title) + '</h3><img width="' + item.width + '" height="' + item.height + '" alt="' + esc(item.description) + '" loading="lazy" decoding="async"><button type="button" class="quiet" data-v5-gif-toggle aria-pressed="false">▶ Посмотреть анимацию</button><p data-v5-media-status role="status"></p><p>' + esc(item.description) + '</p><p class="tiny">Открытое объяснение учитывается как помощь. Затем проверь способ на новом условии.</p></div></details>';
    const details = host.querySelector('details');
    details.addEventListener('toggle', () => {
      if (view !== identity) return;
      const state = current(); if (!state) return;
      const wasOpen = state.id === id && state.open;
      if (details.open === wasOpen) return;
      update({ id, frame: 0, open: details.open, playing: details.open && state.playing }, details.open);
    });
    host.querySelector('[data-v5-gif-toggle]').onclick = () => {
      if (view !== identity) return;
      const state = current(); if (!state) return;
      const playing = !state.playing;
      if (playing) view.manualMotion = true;
      update({ id, frame: 0, open: true, playing }, playing);
    };
    host.querySelector('img').onerror = () => {
      if (view !== identity) return;
      host.querySelector('[data-v5-media-status]').textContent = 'Изображение не загрузилось. Текстовое объяснение доступно ниже. Попробуй запустить анимацию ещё раз.';
    };
    // Personal reloads start quietly. A received classroom play state is kept.
    if (!quality.memoryOnly && scene.media.playing && !view.manualMotion) {
      root.setTimeout(() => {
        if (view === identity) update({ ...current(), id, playing: false });
      }, 0);
    }
    paint();
  }
  root.addEventListener('vilenkin5:scene-rendered', mount);
  quality.subscribe(paint);
  root.addEventListener('hashchange', () => { if (!view?.host.isConnected) view = null; });
  root.Vilenkin5Media = Object.freeze({ mount, refresh: paint });
})(window);
