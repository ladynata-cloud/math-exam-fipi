/* One opt-in animation at a time. No storage, telemetry or external requests. */
(function () {
  'use strict';
  var active = null;
  function stop() {
    if (!active) return;
    var previous = active;
    active = null;
    clearTimeout(previous.timer);
    previous.img.src = previous.poster;
    previous.button.textContent = '▶ Смотреть пример';
    previous.button.setAttribute('aria-pressed', 'false');
  }
  document.querySelectorAll('[data-me-preview]').forEach(function (container) {
    var img = container.querySelector('img');
    var button = container.querySelector('button');
    if (!img || !button || !img.dataset.gif) return;
    var poster = img.getAttribute('src');
    button.hidden = false;
    button.addEventListener('click', function () {
      var same = active && active.button === button;
      stop();
      if (same) return;
      active = {img: img, button: button, poster: poster, container: container};
      button.textContent = '■ Остановить';
      button.setAttribute('aria-pressed', 'true');
      img.src = img.dataset.gif;
    });
    img.addEventListener('load', function () {
      if (!active || active.img !== img || !img.src.endsWith('.gif')) return;
      clearTimeout(active.timer);
      active.timer = setTimeout(stop, Number(container.dataset.duration) || 11000);
    });
    img.addEventListener('error', function () {
      if (active && active.img === img) stop();
    });
  });
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (active && entry.target === active.container && !entry.isIntersecting) stop();
      });
    });
    document.querySelectorAll('[data-me-preview]').forEach(function (el) { observer.observe(el); });
  }
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.addEventListener) motion.addEventListener('change', stop);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  function openLinkedExample() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    var target = document.getElementById(id);
    if (!target || !target.matches('[data-me-preview]')) return;
    var details = target.closest('details');
    if (details) { details.open = true; target.scrollIntoView(); }
  }
  window.addEventListener('hashchange', openLinkedExample);
  openLinkedExample();
}());
