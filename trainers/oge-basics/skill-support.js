/* Short prerequisite detours. Source trainers remain responsible for progress. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (!root.MathExamSkillSupport) {
    root.MathExamSkillSupport = api;
    api.mount(root);
  }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const base = '/trainers/oge-basics/multiplication-division/';
  const skills = Object.freeze([
    { id: 'subtract', title: 'Трудно вычитать', label: 'Вычитание по шагам', url: base + 'arithmetic-foundations.html#sub-columns' },
    { id: 'multiply', title: 'Трудно умножать', label: 'Умножение столбиком', url: base + 'course-column-one-digit.html' },
    { id: 'table', title: 'Не помню таблицу', label: 'Таблица с опорой', url: base + 'multiplication-pythagoras-table.html' }
  ]);
  const tablePractice = Object.freeze([
    { label: 'Смешанная тренировка', url: base + 'multiplication-mixed.html' },
    { label: 'Удобные приёмы', url: base + 'multiplication-tricks.html' },
    { label: 'Лестница умножения', url: base + 'multiplication-ladder.html' }
  ]);

  function localPath(value, origin) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.length > 1800 || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
    let decoded;
    try { decoded = decodeURIComponent(value); } catch (_) { return null; }
    // Never accept encoded slashes, dot segments, credentials or non-course destinations.
    if (/[\\\u0000-\u001f\u007f]/.test(decoded) || /^\/\//.test(decoded) || /(?:^|\/)\.\.(?:\/|$)/.test(decoded.split(/[?#]/)[0])) return null;
    try {
      const url = new URL(value, origin);
      if (url.origin !== new URL(origin).origin || url.username || url.password || !/^\/(?:trainers|courses|school|oge)\//.test(url.pathname)) return null;
      return url.pathname + url.search + url.hash;
    } catch (_) { return null; }
  }

  function linksFor(currentHref, saved) {
    const current = new URL(currentHref), params = current.searchParams;
    const online = /^https?:$/.test(current.protocol);
    const origin = online ? current.origin : 'https://mathexam.space';
    // A second detour returns to the original exercise, not to a growing chain.
    const returnPath = online ? localPath(params.get('skillReturn'), origin) || localPath(current.pathname + current.search + current.hash, origin) : null;
    const mode = !online || params.get('skillReturnMode') === 'tab' || !saved ? 'tab' : 'same';
    return { mode, returnPath, urlFor(target) {
      const url = new URL(target, origin);
      if (mode === 'tab') url.searchParams.set('skillReturnMode', 'tab');
      else if (returnPath) url.searchParams.set('skillReturn', returnPath);
      return online ? url.pathname + url.search + url.hash : url.href;
    } };
  }

  function mount(w) {
    const d = w.document;
    if (!d || w.MathExamBookEdition || new URLSearchParams(w.location.search).get('learning') === '1') return;
    function ready() {
      if (d.querySelector('[data-skill-support]')) return;
      const online = /^https?:$/.test(w.location.protocol);
      const saved = online && !!(d.body.dataset.skillSupportSaved === 'true' || d.getElementById('guided-division') || d.body.dataset.courseId || (w.ArithmeticFoundations && d.getElementById('exercise')));
      const params = new URLSearchParams(w.location.search);
      const back = localPath(params.get('skillReturn'), w.location.origin);
      const tabReturn = params.get('skillReturnMode') === 'tab';
      const currentPath = w.location.pathname;
      if (!d.querySelector('link[data-skill-support-style],link[href*="/trainers/oge-basics/skill-support.css"],style[data-inline-source="/trainers/oge-basics/skill-support.css"]')) {
        const style = d.createElement('link'); style.rel = 'stylesheet'; style.href = '/trainers/oge-basics/skill-support.css?v=20261110'; style.dataset.skillSupportStyle = ''; d.head.append(style);
      }
      const element = (tag, cls, text) => { const el = d.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = text; return el; };
      const main = d.querySelector('main,.course-public-container') || d.body;
      if ((back || tabReturn) && !d.querySelector('[data-skill-return]')) {
        const banner = element('aside', 'skill-return'); banner.dataset.skillReturn = ''; banner.setAttribute('aria-label', 'Возврат после тренировки');
        if (tabReturn) {
          banner.append(element('p', '', 'Твой пример остался в предыдущей вкладке.'));
          const button = element('button', '', 'Закрыть помощь и вернуться'); button.type = 'button';
          button.onclick = () => { w.close(); const note = banner.querySelector('p'); note.textContent = 'Если вкладка не закрылась, закрой её и вернись к своему примеру в предыдущей вкладке.'; };
          banner.append(button);
        } else {
          const link = element('a', '', '← Вернуться к моему примеру'); link.href = back; banner.append(link);
          banner.append(element('p', '', 'После короткой тренировки продолжи с того же шага.'));
        }
        main.prepend(banner);
      }

      const section = element('section', 'skill-support'); section.dataset.skillSupport = ''; section.setAttribute('aria-labelledby', 'skill-support-title');
      const title = element('h2', '', 'Застрял на действии?'); title.id = 'skill-support-title'; section.append(title);
      const lead = element('p', 'skill-support-note', saved ? 'Потренируй нужный навык и вернись к своему примеру.' : 'Помощь откроется в новой вкладке; твой пример останется здесь.'); section.append(lead);
      const choices = element('div', 'skill-support-choices'); section.append(choices);
      function linkFor(skill, item, extra) {
        const link = element('a', extra ? 'skill-support-extra' : 'skill-support-choice');
        link.dataset.skill = skill;
        if (item.title) link.append(element('span', 'skill-support-label', item.title));
        link.append(element('span', '', item.label + ' →'));
        link.addEventListener('click', () => {
          // If the optional task-first enhancement failed to load, the legacy
          // trainer's own hint control still records that help was requested.
          if (!saved && !d.body.dataset.basicsStandalone) {
            const state = w.__trainerDebug?.state?.();
            if ((state?.current || state?.task) && state.phase !== 'done') d.querySelector('#hint1:not(:disabled)')?.click();
          }
          const event = new w.CustomEvent('mathexam:skill-support', { cancelable: true, detail: { skill, href: link.href } });
          const persistent = d.dispatchEvent(event);
          // Storage failure must not discard the source work by navigating away.
          const route = linksFor(w.location.href, saved && persistent);
          link.href = route.urlFor(item.url);
          if (route.mode === 'tab') { link.target = '_blank'; link.rel = 'noopener'; }
          else { link.removeAttribute('target'); link.removeAttribute('rel'); }
        });
        const route = linksFor(w.location.href, saved);
        link.href = route.urlFor(item.url);
        if (route.mode === 'tab') { link.target = '_blank'; link.rel = 'noopener'; }
        return link;
      }
      for (const skill of skills) choices.append(linkFor(skill.id, skill));
      const more = element('details', 'skill-support-more'); more.append(element('summary', '', 'Ещё тренажёры таблицы умножения'));
      const extras = element('div', 'skill-support-extras'); for (const item of tablePractice) extras.append(linkFor('table', item, true)); more.append(extras); section.append(more);
      const pathLink = element('a', 'skill-support-path', 'Все ступени деления →'); pathLink.href = (online ? '' : 'https://mathexam.space') + base + 'division-path.html'; section.append(pathLink);
      const slot = d.querySelector('[data-skill-support-slot]');
      const anchor = d.querySelector('#guided-division .help-actions') || d.getElementById('learning-remediation-root') || d.getElementById('course-local-root') || d.getElementById('exercise') || d.getElementById('view-practice');
      if (slot) slot.append(section); else if (anchor) anchor.after(section); else main.append(section);

      function highlight(kind) {
        const skill = /subtract|remainder/.test(kind) ? 'subtract' : /product|multiply/.test(kind) ? 'multiply' : /digit|table/.test(kind) ? 'table' : '';
        for (const link of choices.children) link.classList.toggle('is-relevant', link.dataset.skill === skill);
      }
      d.addEventListener('mathexam:division-step', e => highlight(e.detail?.kind || ''));
      function refreshLinks() {
        const route = linksFor(w.location.href, saved);
        const allItems = [...skills.map(item => [item.id, item]), ...tablePractice.map(item => ['table', item])];
        for (const [i, link] of [...section.querySelectorAll('a[data-skill]')].entries()) link.href = route.urlFor(allItems[i][1].url);
        const prompt = d.querySelector('#question,#phaseText')?.textContent || [...d.querySelectorAll('.lm-prompt')].at(-1)?.textContent || '';
        highlight(/выч|разност/i.test(prompt) ? 'subtract' : /умнож/i.test(prompt) ? 'product' : /цифру.*(?:ответ|частн)|сколько раз/i.test(prompt) ? 'digit' : '');
      }
      w.addEventListener('hashchange', refreshLinks);
      // Dynamic native renderers replace their question, but not this sibling panel.
      if (w.MutationObserver && anchor && !anchor.classList.contains('help-actions')) new w.MutationObserver(refreshLinks).observe(anchor, { childList: true, subtree: true });
      refreshLinks();
      return { section, saved, currentPath };
    }
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
  }
  return Object.freeze({ skills, tablePractice, localPath, linksFor, mount });
});
