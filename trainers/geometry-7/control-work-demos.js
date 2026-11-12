(() => {
  'use strict';

  function markup(id, label, attributes) {
    const demo = window.GeometryControlDemoData?.[id];
    if (!demo) return '';
    return `<details class="written-details control-demo" ${attributes} data-demo="${id}">
      <summary>${label} <span class="demo-format">GIF</span></summary>
      <figure>
        <img width="640" height="428" loading="lazy" alt="${demo.title}">
        <figcaption>
          <button class="btn" type="button" data-demo-toggle aria-pressed="false">Воспроизвести GIF</button>
        </figcaption>
      </figure>
      <ol class="demo-steps">${demo.steps.map(step => `<li>${step}</li>`).join('')}</ol>
    </details>`;
  }

  function setPlaying(details, playing) {
    const id = details.dataset.demo;
    if (!id) return;
    const button = details.querySelector('[data-demo-toggle]');
    const image = details.querySelector('img');
    if (details.open) {
      const source = `control-work-gifs/${id}.${playing ? 'gif' : 'webp'}`;
      if (image.getAttribute('src') !== source) image.src = source;
    } else image.removeAttribute('src');
    button.setAttribute('aria-pressed', String(playing));
    button.textContent = playing ? 'Остановить GIF' : 'Воспроизвести GIF';
  }

  window.GeometryControlDemos = { markup, setPlaying };
})();
