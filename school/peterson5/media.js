(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let view = null, topic = null, playing = false, manualMotion = false;
  const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)');
  function path(file) { return (location.protocol === 'file:' ? '' : '/school/peterson5/') + file; }
  function paint() {
    if (!view) return;
    const moving = playing && (!reduced?.matches || manualMotion);
    const image = view.host.querySelector('img'), button = view.host.querySelector('[data-p5-gif-toggle]');
    image.src = path(moving ? view.item.src : view.item.poster);
    button.setAttribute('aria-pressed', String(playing));
    button.textContent = playing ? '■ Остановить' : '▶ Посмотреть анимацию';
    view.host.querySelector('[data-p5-media-status]').textContent = playing && !moving
      ? 'На общей доске анимация запущена. Здесь показан статичный кадр: в настройках включено уменьшение движения.'
      : moving ? 'Анимация повторяется. Можно остановить её и спокойно прочитать объяснение.' : 'Статичный кадр. Движение начнётся только по нажатию кнопки.';
  }
  function mount(host, id, options = {}) {
    const item = root.Peterson5MediaData?.find(row => row.id === id);
    if (!host || !item) return () => {};
    if (topic !== id) { playing = false; manualMotion = false; }
    topic = id; view = { host, item };
    host.innerHTML = '<details class="p5-media"><summary>Объяснение в движении · GIF</summary><div class="p5-media-body"><p class="eyebrow">Другой пример · исследуем способ</p><h3>' + esc(item.title) + '</h3><img width="' + item.width + '" height="' + item.height + '" alt="' + esc(item.description) + '" loading="lazy" decoding="async"><button type="button" class="quiet" data-p5-gif-toggle aria-pressed="false">▶ Посмотреть анимацию</button><p data-p5-media-status class="small" role="status"></p><p class="p5-media-description">' + esc(item.description) + '</p></div></details>';
    const identity = view;
    host.querySelector('[data-p5-gif-toggle]').onclick = () => {
      if (view !== identity) return;
      playing = !playing; if (playing) { manualMotion = true; options.onHelp?.(); }
      paint(); root.dispatchEvent(new CustomEvent('peterson5:change'));
    };
    host.querySelector('details').addEventListener('toggle', event => {
      if (view === identity && event.target.open) options.onHelp?.();
    });
    host.querySelector('img').onerror = () => {
      if (view !== identity) return;
      playing = false;
      host.querySelector('[data-p5-media-status]').textContent = 'Изображение не загрузилось. Текстовое объяснение остаётся доступным ниже. Попробуй открыть анимацию ещё раз.';
      const button = host.querySelector('[data-p5-gif-toggle]'); button.setAttribute('aria-pressed', 'false'); button.textContent = 'Повторить загрузку';
    };
    paint();
    return () => { if (view === identity) view = null; };
  }
  root.Peterson5Media = Object.freeze({ mount, getState: () => ({ gifPlaying: !!view && playing }),
    applyState(state) { playing = !!view && state?.gifPlaying === true; manualMotion = false; paint(); },
    cleanup() { view = null; topic = null; playing = false; manualMotion = false; }
  });
})(window);
