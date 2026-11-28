/* Optional help for the eight standalone article entries. No learner storage. */
(function () {
  'use strict';
  function boot() {
  if (window.top !== window.self || window.__mathExamHabrHelp) return;
  window.__mathExamHabrHelp = true;
  const root = '/assets/habr-entry-gifs/';
  const routes = [
    ['habr-negative-line', '/trainers/negative-numbers-line.html?seed=habr-311', 'main > section.card:first-of-type'],
    ['habr-percent-80', '/trainers/percent-part-whole-trainer.html?percent=80#exercise', '#exercise'],
    ['habr-battle-balance', '/oge/skills/?topic=base&route=family%3Aarith-battle-balance', '#mathexam-skill-lab .task'],
    ['habr-circle-fractional-turns', '/ege-profil/circle/index.html?route=trigonometry&unit=m4-fractional-turns#lesson/m4-fractional-turns', '#lab'],
    ['habr-sine-wave', '/ege-profil/trainers/trigonometry.html#sine-wave', '#sine-wave'],
    ['habr-stereo-literacy', '/stereo-course/literacy/#atanasyan2024-theory-001', '.literacy-model'],
    ['habr-sections-starter18', '/stereo-course/sections/#starter-18', '.workbench'],
    ['habr-sections-authcore05', '/stereo-course/sections/#auth-core-05', '.workbench']
  ];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let panel = null, current = null, request = null, timer = null, scheduled = false, ended = false, raf = null;
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function stop() {
    clearTimeout(timer); timer = null;
    if (!current) return;
    const animation = current.animation;
    if (animation) {
      current.animation = null;
      animation.onload = animation.onerror = null;
      if (animation.isConnected) animation.replaceWith(current.image);
      animation.removeAttribute('src');
    }
    if (!current.failed) current.image.src = root + current.id + '/' + current.clip.frames[current.index].file;
    current.play.textContent = 'Воспроизвести GIF';
    current.play.setAttribute('aria-pressed', 'false');
    if (current.describe) current.describe();
  }
  function teardown() {
    stop(); if (request) request.abort(); request = null;
    if (current?.observer) current.observer.disconnect();
    current = null; panel?.remove(); panel = null;
  }
  function validClip(manifest, route) {
    if (!manifest || manifest.schemaVersion !== 1 || manifest.complete !== true || !Array.isArray(manifest.clips)) return null;
    const matches = manifest.clips.filter(c => c.id === route[0]);
    if (matches.length !== 1) return null;
    const clip = matches[0];
    if (clip.complete !== true || clip.sourcePage !== route[1] || !Array.isArray(clip.frames) || clip.frames.length < 3) return null;
    if (clip.frameCount !== clip.frames.length || !clip.files?.[route[0] + '.gif']) return null;
    if (!clip.frames.every(f => /^frame-\d{2}\.png$/.test(f.file) && typeof f.caption === 'string' && f.caption.length > 0 && Number.isInteger(f.durationMs) && f.durationMs > 0 && clip.files[f.file])) return null;
    return clip;
  }
  function mountFrames(host, route, clip) {
    const image = el('img'); image.alt = clip.frames[0].caption; image.loading = 'lazy'; image.decoding = 'async';
    const caption = el('p', '', 'habr-gif-caption'); caption.setAttribute('aria-live', 'polite');
    const controls = el('div', undefined, 'habr-gif-controls');
    function button(text, fn) { const b = el('button', text); b.type = 'button'; b.addEventListener('click', fn); controls.append(b); return b; }
    const previous = button('← Предыдущий кадр', () => show(current.index - 1));
    const play = button('Воспроизвести GIF', () => {
      if (current !== state || !panel.open || reduced.matches || state.failed) return;
      if (state.animation) { stop(); return; }
      show(0);
      const animation = el('img');
      state.animation = animation;
      animation.alt = 'Анимация всех шагов примера. Текст шагов находится ниже.';
      caption.textContent = 'Загружаем анимацию…';
      play.textContent = 'Остановить GIF'; play.setAttribute('aria-pressed', 'true');
      function active() {
        return current === state && state.animation === animation && host.isConnected && panel.open;
      }
      function failed() {
        if (!active()) return;
        stop();
        caption.textContent = 'Не удалось загрузить анимацию. Можно повторить или посмотреть отдельные кадры.';
      }
      animation.onerror = failed;
      animation.onload = async () => {
        try { if (animation.decode) await animation.decode(); }
        catch { failed(); return; }
        if (!active()) return;
        image.replaceWith(animation);
        caption.textContent = 'Анимация всех ' + clip.frames.length + ' шагов. Можно остановить и перейти к отдельным кадрам.';
        const duration = clip.frames.reduce((total, frame) => total + frame.durationMs, 0);
        timer = setTimeout(() => { if (active()) stop(); }, duration);
      };
      animation.src = root + route[0] + '/' + route[0] + '.gif';
    });
    play.setAttribute('aria-pressed', 'false');
    const next = button('Следующий кадр →', () => show(current.index + 1));
    const motionNote = el('p', '', 'habr-gif-note');
    function motion() {
      if (current !== state) return;
      stop(); play.disabled = reduced.matches || current.failed;
      motionNote.textContent = reduced.matches ? 'Уменьшение движения включено. Используй отдельные кадры и текст шагов.' : 'Анимация запускается только по кнопке. Можно смотреть каждый кадр отдельно.';
    }
    const transcript = el('details', undefined, 'habr-gif-transcript');
    transcript.append(el('summary', 'Текст всех шагов'));
    const list = el('ol'); for (const frame of clip.frames) list.append(el('li', frame.caption)); transcript.append(list);
    host.replaceChildren(image, caption, controls, motionNote, transcript);
    const state = {id: route[0], clip, image, play, index: 0, animation: null, motion};
    current = state;
    state.describe = () => {
      const frame = clip.frames[state.index]; image.alt = frame.caption;
      caption.textContent = (state.index + 1) + ' из ' + clip.frames.length + '. ' + frame.caption;
    };
    function show(index) {
      if (current !== state) return;
      stop(); current.index = Math.max(0, Math.min(clip.frames.length - 1, index));
      const frame = clip.frames[current.index];
      image.src = root + route[0] + '/' + frame.file;
      image.alt = frame.caption;
      caption.textContent = (current.index + 1) + ' из ' + clip.frames.length + '. ' + frame.caption;
      previous.disabled = current.index === 0; next.disabled = current.index === clip.frames.length - 1;
    }
    image.addEventListener('error', () => {
      if (current !== state || !image.isConnected) return;
      current.failed = true; stop(); image.removeAttribute('src'); image.hidden = true;
      caption.textContent = 'Изображение не загрузилось. Текст всех шагов доступен ниже.';
      play.disabled = true;
    });
    if ('IntersectionObserver' in window) {
      current.observer = new IntersectionObserver(entries => { if (current === state && host.isConnected && entries.some(entry => !entry.isIntersecting)) stop(); });
      current.observer.observe(host);
    }
    motion(); show(0);
  }
  async function load(host, route) {
    if (host.dataset.loaded === 'true' || request) return;
    host.textContent = 'Открываем пример…';
    const controller = new AbortController(); request = controller;
    try {
      const response = await fetch(root + 'media.json', {signal: controller.signal, cache: 'no-cache'});
      if (!response.ok) throw Error('Media unavailable');
      const clip = validClip(await response.json(), route);
      if (!clip) throw Error('Media incomplete');
      if (controller.signal.aborted || !host.isConnected) return;
      mountFrames(host, route, clip); host.dataset.loaded = 'true';
      if (!panel.open) stop();
    } catch (error) {
      if (controller.signal.aborted || !host.isConnected) return;
      host.textContent = 'Видеоинструкция готовится. Тренажёр доступен: выполняй действия по его подсказкам.';
    } finally {if (request === controller) request = null;}
  }
  function refresh() {
    scheduled = false;
    const address = location.pathname + location.search + location.hash;
    const route = routes.find(r => r[1] === address);
    if (!route) {if (panel) teardown(); return;}
    const target = document.querySelector(route[2]);
    if (!target) {if (panel) teardown(); return;}
    if (panel?.dataset.habrGif !== route[0]) teardown();
    if (!panel) {
      panel = el('details', undefined, 'habr-gif-help'); panel.dataset.habrGif = route[0];
      panel.append(el('summary', 'Как работать — пример по шагам'));
      const host = el('div', undefined, 'habr-gif-content'); panel.append(host);
      const ownPanel = panel;
      ownPanel.addEventListener('toggle', () => {if (panel !== ownPanel) return; if (ownPanel.open) load(host, route); else stop();});
    }
    if (target.nextElementSibling !== panel) {stop(); target.after(panel);}
  }
  function schedule() { if (!ended && !scheduled) {scheduled = true; raf = requestAnimationFrame(refresh);} }
  const mutations = new MutationObserver(schedule);
  mutations.observe(document.body, {childList: true, subtree: true});
  window.addEventListener('hashchange', schedule); window.addEventListener('popstate', schedule);
  window.addEventListener('pagehide', event => {
    stop();
    if (!event.persisted) {ended = true; mutations.disconnect(); cancelAnimationFrame(raf); if (request) request.abort();}
  });
  document.addEventListener('visibilitychange', () => {if (document.hidden) stop();});
  reduced.addEventListener('change', () => {if (current) current.motion();});
  refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
}());
