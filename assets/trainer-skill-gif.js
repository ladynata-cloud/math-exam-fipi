/* A worked example with optional motion and independently browsable frames. */
(function (root) {
  'use strict';

  const assetPath = '/assets/trainer-skill-gifs/';
  let manifestRequest;
  let stopPlaying;

  function element(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    return node;
  }

  function manifest() {
    if (!manifestRequest) {
      manifestRequest = root.fetch(assetPath + 'index.json?v=20261111').then(response => {
        if (!response.ok) throw new Error('GIF examples unavailable');
        return response.json();
      }).catch(error => {
        manifestRequest = null;
        throw error;
      });
    }
    return manifestRequest;
  }

  function render(details, slug, example) {
    const { title, steps } = example;
    const panel = element('div', '', { class: 'trainer-skill-gif-panel' });
    const viewport = element('div', '', { class: 'trainer-skill-gif-viewport' });
    const image = element('img', '', { alt: '', width: '640', height: '360', decoding: 'async' });
    viewport.append(image);

    const caption = element('p', '', { class: 'trainer-skill-gif-caption', 'aria-live': 'polite' });
    const controls = element('div', '', { class: 'trainer-skill-gif-controls', role: 'group', 'aria-label': title });
    const play = element('button', 'Воспроизвести GIF', { type: 'button', 'aria-pressed': 'false' });
    const previous = element('button', 'Назад', { type: 'button', 'aria-label': 'Предыдущий кадр' });
    const next = element('button', 'Дальше', { type: 'button', 'aria-label': 'Следующий кадр' });
    controls.append(play, previous, next);

    const transcript = element('details', '', { class: 'trainer-skill-gif-transcript' });
    const list = element('ol');
    for (const text of steps) list.append(element('li', text));
    transcript.append(element('summary', 'Все шаги текстом'), list);
    panel.append(viewport, caption, controls, transcript);
    details.querySelector('[data-trainer-gif-status]')?.remove();
    details.append(panel);

    const framesPath = `${assetPath}${slug}.png`;
    const gifPath = `${assetPath}${slug}.gif`;
    let frame = 0;
    let playing = false;

    function showFrame() {
      image.style.top = `${-100 * frame}%`;
      if (image.getAttribute('src') !== framesPath) image.src = framesPath;
      caption.textContent = `Кадр ${frame + 1} из ${steps.length}. ${steps[frame]}`;
      previous.disabled = frame === 0;
      next.disabled = frame === steps.length - 1;
    }

    function stop() {
      if (!playing) return;
      playing = false;
      if (stopPlaying === stop) stopPlaying = null;
      play.textContent = 'Воспроизвести GIF';
      play.setAttribute('aria-pressed', 'false');
      showFrame();
    }

    play.addEventListener('click', () => {
      if (playing) { stop(); return; }
      stopPlaying?.();
      stopPlaying = stop;
      playing = true;
      image.style.top = '0';
      image.src = gifPath;
      play.textContent = 'Остановить GIF';
      play.setAttribute('aria-pressed', 'true');
      caption.textContent = title;
    });
    previous.addEventListener('click', () => { stop(); frame -= 1; showFrame(); });
    next.addEventListener('click', () => { stop(); frame += 1; showFrame(); });
    image.addEventListener('error', () => {
      stop();
      caption.textContent = 'Изображение не загрузилось. Можно прочитать шаги ниже.';
    });
    details.addEventListener('toggle', () => { if (!details.open) stop(); });
    showFrame();
  }

  async function mount(details, slug) {
    const data = await manifest();
    const example = data[slug];
    if (!example || typeof example.title !== 'string' || !Array.isArray(example.steps)) {
      throw new Error('GIF example missing');
    }
    if (details.isConnected) render(details, slug, example);
  }

  root.addEventListener('pagehide', () => stopPlaying?.());
  root.addEventListener('hashchange', () => stopPlaying?.());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlaying?.(); });
  root.MathExamTrainerSkillGif = { mount };
})(window);
