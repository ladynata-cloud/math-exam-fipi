/* The public download reuses the same trainer; only its outgoing links differ. */
(function () {
  'use strict';
  if (location.protocol !== 'file:' || !window.PreOgeArithmetic) return;
  const route = window.PreOgeArithmetic;
  for (const name of ['practiceURL', 'routeURL', 'guidedURL']) {
    const original = route[name];
    route[name] = function (level) {
      const value = original(level);
      return value ? new URL(value, 'https://mathexam.space/').href : value;
    };
  }
})();

/* These links open a supported joint exercise, independent of individual progress. */
(function () {
  'use strict';
  const cards = {
    start:'whole', oneDigit:'whole', zero:'whole',
    decimalNatural:'tenths', decimalDivisor:'shift'
  };
  const fileTopics = {
    'long-division-one-digit.html':'oneDigit',
    'decimal-division-natural.html':'decimalNatural',
    'decimal-divisor-shift.html':'decimalDivisor'
  };
  function boardHost() {
    try {
      if (parent !== window && parent.location.origin === location.origin &&
          /\/trainers\/(?:trainer-board|group-board)\.html$/.test(parent.location.pathname)) return parent;
    } catch (_) { /* Cabinet embeds can have a different origin. */ }
    return null;
  }
  function addBoardLink(container, topic) {
    const task = cards[topic] && 'ratio-division-' + cards[topic];
    const previous = container.querySelector('[data-division-board]');
    if (previous?.dataset.divisionBoard === task) return;
    previous?.remove();
    if (!task) return;
    const host = boardHost();
    const link = document.createElement(host ? 'button' : 'a');
    link.dataset.divisionBoard = task;
    link.className = 'button';
    link.textContent = 'На общую доску';
    if (host) {
      link.type = 'button';
      link.onclick = () => {
        if (host.openGrade6LessonTask?.(window, task)) return;
        let status = container.querySelector('[data-division-status]');
        if (!status) {
          status = document.createElement('span');
          status.dataset.divisionStatus = '';
          status.setAttribute('role', 'status');
          container.append(status);
        }
        status.textContent = 'Карточку выбирает учитель, когда доска подключена и управление у него.';
      };
    } else {
      const origin = location.protocol === 'file:' ? 'https://mathexam.space' : location.origin;
      const board = new URL('/trainers/trainer-board.html', origin);
      board.searchParams.set('trainer', '/trainers/vilenkin6-proportion/index.html?task=' + task);
      link.href = board.href;
      link.target = '_blank';
      link.rel = 'noopener';
    }
    container.append(link);
  }
  function showGuided(topic) {
    const nav = document.getElementById('division-learning-route');
    if (nav) addBoardLink(nav, topic);
  }
  document.addEventListener('mathexam:division-step', e => showGuided(e.detail?.topic));
  function initialize() {
    const state = window.__divisionGuidedDebug?.state();
    if (state) showGuided(state.active);
    for (const anchor of document.querySelectorAll('.path-step [data-guided]')) {
      addBoardLink(anchor.parentElement, anchor.dataset.guided);
    }
    const topic = fileTopics[location.pathname.split('/').pop()];
    const container = document.querySelector('.topbar-in');
    if (container && topic) addBoardLink(container, topic);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once:true});
  else initialize();
})();
