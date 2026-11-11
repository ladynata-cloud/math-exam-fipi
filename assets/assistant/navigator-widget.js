/* Shared home return. Also bundled verbatim at the start of navigator-widget.js. */
(function (root) {
  'use strict';
  function mountHomeLink() {
    const document = root.document;
    if (root.self !== root.top || !document.body || document.getElementById('mathexam-home-navigation')) return;
    const pathname = root.location.pathname;
    if (pathname === '/' || pathname === '/index.html' || /^\/(?:book|b|learning|board-server|assistant-service|downloads|docs|tools|assets)\//.test(pathname)) return;
    const params = new URLSearchParams(root.location.search);
    if (['embed', 'embedded'].some(key => /^(?:1|true)$/.test(params.get(key) || ''))) return;
    const host = document.createElement('div');
    host.id = 'mathexam-home-navigation';
    // Shadow styles keep existing trainer button/nav rules away from this link.
    host.style.cssText = 'display:block;flex:none;grid-column:1 / -1;align-self:stretch;box-sizing:border-box;width:100%;max-width:100%;min-width:0;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{color-scheme:light}*{box-sizing:border-box}nav{display:block;margin:0;padding:6px 12px;background:#f5f8f5;border-bottom:1px solid #d9e5dd;text-align:left;font:600 14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}a{display:inline-flex;align-items:center;gap:7px;min-height:44px;max-width:100%;padding:8px 12px;border:1px solid #b7cebf;border-radius:10px;background:#fff;color:#175d42;text-decoration:none;touch-action:manipulation}a:hover{background:#e8f3ed}a:focus-visible{outline:3px solid #176d49;outline-offset:2px}@media print{:host{display:none!important}}';
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Переход на главную');
    const link = document.createElement('a');
    link.href = '/';
    link.target = '_self';
    link.setAttribute('aria-label', 'На главную MathExam');
    link.textContent = '← На главную';
    nav.append(link);
    shadow.append(style, nav);
    // Keep authored first-screen conditions, diagrams and videos at their
    // existing coordinates. The return follows the content in document flow,
    // and stays inside the sole content column of a centered flex-row shell.
    let container = document.body;
    const bodyStyle = root.getComputedStyle(document.body);
    if (bodyStyle.display === 'flex' && /^row/.test(bodyStyle.flexDirection)) {
      container = document.body.querySelector('main') || Array.from(document.body.children).find(node => /^(?:DIV|ARTICLE|SECTION)$/.test(node.tagName)) || document.body;
    }
    container.append(host);
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mountHomeLink, { once: true });
  else mountHomeLink();
})(window);

/* Public navigation only. No account, answer, URL-query or persistent context. */
(function (root) {
  'use strict';
  const HOST_ID = 'maxexam-public-assistant';
  const CSS = '/assets/assistant/widget.css?v=20261111-oge1';
  const SITE = 'https://mathexam.space';
  const CABINET = 'https://mathexam-board-ladynata.msk1.amvera.tech';
  const privateClasses = 'ym-hide-content ym-disable-clickmap';
  const boardShells = new Set([
    '/trainers/atanasyan-7-9.html', '/trainers/peterson6.html', '/trainers/merzlyak-10-base.html',
    '/trainers/ege-baza-11.html', '/trainers/ege-baza-13.html',
    ...['planimetry', 'vectors', 'stereometry', 'probability', 'random-variables', 'expressions', 'equations']
      .map(name => '/trainers/ege-profile-' + name + '.html')
  ]);
  // These public courses already have a task-aware helper. Keep its launcher,
  // current-step explanations and assistance accounting as the only helper UI.
  const taskHelpPages = new Set([
    '/school/peterson6/', '/school/peterson6/index.html',
    '/trainers/maxim-peterson6/', '/trainers/maxim-peterson6/index.html'
  ]);
  function permittedPath(pathname) {
    let path;
    try { path = decodeURIComponent(pathname).toLowerCase(); } catch (_) { return false; }
    if (!path.startsWith('/') || /[\\\u0000-\u001f\u007f]/.test(path)) return false;
    if (/(?:^|\/)(?:learning|assistant-service|board-server|video-worker|tools|tests?|fixtures?|docs|assets|sources?|src|private|archives?|archive-5-weeks|drafts|downloads?|exports?|admin|accounts?)(?:\/|$)/.test(path)) return false;
    if (/(?:^|\/)(?:[^/]*[-_.])?(?:board|teacher|parent|student|login|invite|preview|offline|export|print|testing-hub|404)(?:[-_.][^/]*)?(?:\.html)?$/.test(path)) return false;
    if (/\/(?:yandex_[a-z0-9]+|google[a-z0-9]+)\.html$/.test(path) || boardShells.has(path) || taskHelpPages.has(path) || path === '/video-lessons/studio.html') return false;
    return path !== '/courses/vilenkin-6-part-1/' && path !== '/courses/vilenkin-6-part-1/index.html';
  }
  function element(tag, text, attributes = {}) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    return node;
  }
  function safeLink(value) {
    if (typeof value !== 'string' || value.length > 600 || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
    if (!value.startsWith('/') && !value.startsWith('https://')) return null;
    if (value.startsWith('//')) return null;
    try {
      const url = new URL(value, SITE);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
      if (url.origin === SITE && !url.pathname.startsWith('//')) return url.pathname + url.search + url.hash;
      if (url.origin === CABINET && url.pathname === '/learning/' && !url.search && url.hash === '#route') return url.href;
    } catch (_) { /* Ignore malformed destinations; keep the existing page usable. */ }
    return null;
  }
  function mount() {
    if (root.self !== root.top || !permittedPath(root.location.pathname) || document.getElementById(HOST_ID)) return;
    const data = root.MathExamPublicAssistantData;
    if (!data || typeof data.welcome !== 'function' || typeof data.respond !== 'function' || !document.body) return;
    let open = false, greeted = false, difficultyCount = 0, referralShown = false;
    let dialog = null, welcomeCard = null;
    const host = element('div', undefined, { id: HOST_ID, class: privateClasses });
    const shadow = host.attachShadow({ mode: 'open' });
    const stylesheet = element('link', undefined, { rel: 'stylesheet', href: CSS });
    const launcher = element('button', undefined, {
      type: 'button', class: 'launcher ym-disable-clickmap', 'aria-label': 'Открыть навигатор по MathExam',
      'aria-expanded': 'false', 'aria-controls': 'maxexam-public-panel',
      title: 'Найти тему, тренажёр или учебник на MathExam'
    });
    launcher.append(element('span', '∑', { class: 'launcher-mark', 'aria-hidden': 'true' }));
    const launcherText = element('span', undefined, { class: 'launcher-label' });
    launcherText.append(element('strong', 'Навигатор'), element('span', 'Найти тему или учебник'));
    launcher.append(launcherText);
    const panel = element('section', undefined, {
      id: 'maxexam-public-panel', class: 'panel ' + privateClasses, role: 'dialog', 'aria-modal': 'false',
      'aria-labelledby': 'maxexam-public-title', hidden: ''
    });
    const header = element('header', undefined, { class: 'header' });
    const title = element('div');
    title.append(element('h2', 'Навигатор MathExam', { id: 'maxexam-public-title' }), element('p', 'Навигатор по материалам сайта', { class: 'role-label' }));
    const close = element('button', '×', { type: 'button', class: 'icon-button', 'aria-label': 'Закрыть помощника' });
    header.append(title, close);
    const log = element('div', undefined, {
      class: 'log ' + privateClasses, role: 'log', 'aria-label': 'Разговор с навигатором', 'aria-live': 'polite',
      'aria-relevant': 'additions', tabindex: '0'
    });
    const form = element('form', undefined, { class: 'form ym-disable-submit ' + privateClasses, autocomplete: 'off' });
    const label = element('label', 'Что хотите найти?', { for: 'maxexam-public-question' });
    const input = element('textarea', undefined, {
      id: 'maxexam-public-question', name: 'navigation-question', rows: '2', maxlength: '400',
      placeholder: 'Например: 6 класс, путаюсь в дробях', autocomplete: 'off', spellcheck: 'false',
      class: 'ym-disable-keys ' + privateClasses
    });
    const submit = element('button', 'Найти материал', { type: 'button', class: 'send' });
    const controls = element('div', undefined, { class: 'form-controls' });
    controls.append(element('small', 'Достаточно темы и класса.'), submit);
    const status = element('p', '', { role: 'status', class: 'status', 'aria-live': 'polite' });
    form.append(label, input, controls, status);
    const footer = element('footer', undefined, { class: 'footer' });
    const clear = element('button', 'Очистить чат', { type: 'button', class: 'clear' });
    footer.append(element('small', 'История только на этой странице.'), clear);
    panel.append(header, log, form, footer);
    shadow.append(stylesheet, panel, launcher);
    // On a narrow OGE screen the launcher belongs beside the route back to
    // the course, in document flow. A floating circle can cover the learner's
    // current answer or next-step button at any scroll position.
    const courseNav = /^\/trainers\/(?:oge[-\d]|task19-trainer\.html)/.test(root.location.pathname)
      ? Array.from(document.body.children).find(node => node.matches('nav.oge-wayfinding') && !node.hidden) : null;
    if (courseNav) {
      host.setAttribute('data-course-navigation', 'true');
      courseNav.insertAdjacentElement('afterend', host);
    } else document.body.append(host);

    function addMessage(text, visitor) {
      const article = element('article', undefined, { class: 'message ' + (visitor ? 'visitor' : 'navigator') + ' ' + privateClasses });
      article.append(element('p', visitor ? 'Вы' : 'Навигатор', { class: 'speaker' }), element('p', text, { class: 'message-text' }));
      log.append(article);
      // Bound document memory without persisting a transcript elsewhere.
      while (log.children.length > 40) log.firstElementChild.remove();
      return article;
    }
    function showResponse(response) {
      if (!response || typeof response.text !== 'string') throw Error('UNAVAILABLE');
      const article = addMessage(response.text.slice(0, 3000), false);
      if (response.kind === 'welcome') welcomeCard = article;
      if (Array.isArray(response.links)) {
        const links = element('div', undefined, { class: 'links' });
        for (const row of response.links.slice(0, 6)) {
          const href = safeLink(row?.url);
          if (!href || typeof row.title !== 'string') continue;
          const link = element('a', row.title.slice(0, 160), { href, class: 'route-link ym-disable-tracklink ym-disable-clickmap' });
          if (href.startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
          // A chosen lesson can be a route within the current document. Give
          // its workspace back to the visitor without changing the link action.
          link.addEventListener('click', () => setOpen(false));
          links.append(link);
        }
        if (links.childElementCount) article.append(links);
      }
      if (Array.isArray(response.actions)) {
        const actions = element('div', undefined, { class: 'actions' });
        for (const action of response.actions.slice(0, 4)) {
          if (typeof action?.label !== 'string' || typeof action.text !== 'string' || action.text.length > 400) continue;
          const option = element('button', action.label.slice(0, 100), { type: 'button', class: 'choice ym-disable-clickmap' });
          option.addEventListener('click', () => { input.value = action.text; send(); });
          actions.append(option);
        }
        if (actions.childElementCount) article.append(actions);
      }
      if (Number.isInteger(response.difficultyCount)) difficultyCount = Math.max(0, Math.min(20, response.difficultyCount));
      if (typeof response.referralShown === 'boolean') referralShown = referralShown || response.referralShown;
      // Start with the new reply, including its explanation. Jumping to the
      // very bottom can leave only action buttons visible for a long reply.
      log.scrollTop += article.getBoundingClientRect().top - log.getBoundingClientRect().top - 12;
    }
    function greet() {
      if (greeted) return;
      try { showResponse(data.welcome(root.location.pathname)); greeted = true; }
      catch (_) { status.textContent = 'Навигатор пока не готов. Материалы сайта доступны как обычно.'; }
    }
    function setOpen(value, returnFocus = true) {
      if (value && !permittedPath(root.location.pathname)) return;
      open = value; panel.hidden = !value; launcher.setAttribute('aria-expanded', String(value));
      launcher.setAttribute('aria-label', value ? 'Закрыть навигатор' : 'Открыть навигатор по MathExam');
      if (value) { greet(); input.focus(); }
      else if (returnFocus) launcher.focus();
    }
    function send() {
      if (!open || !permittedPath(root.location.pathname)) return;
      let text = input.value.trim();
      if (!text) { status.textContent = 'Напишите тему или выберите подсказку.'; input.focus(); return; }
      if (text.length > 400) { status.textContent = 'Сократите вопрос до 400 символов.'; return; }
      input.value = ''; status.textContent = '';
      try {
        const response = data.respond({ text, pathname: root.location.pathname, difficultyCount, referralShown, dialog });
        dialog = response.dialog || null;
        if (welcomeCard) {
          welcomeCard.querySelectorAll('.actions, .links').forEach(row => row.remove());
          welcomeCard = null;
        }
        addMessage(response?.kind === 'privacy' ? 'Сообщение с личными данными скрыто.' : text, true);
        text = ''; showResponse(response);
      } catch (_) {
        text = ''; status.textContent = 'Не удалось подобрать материал. Попробуйте написать тему и класс.';
      }
      input.focus();
    }
    function reset(showWelcome) {
      input.value = ''; log.replaceChildren(); status.textContent = '';
      greeted = false; difficultyCount = 0; referralShown = false; dialog = null; welcomeCard = null;
      if (showWelcome) greet();
    }
    // Navigation is a local action. Preview frames may allow JavaScript while
    // blocking native form submission before a submit event ever reaches us.
    function handleSend(event) {
      event.preventDefault();
      event.stopPropagation();
      send();
    }
    submit.addEventListener('click', handleSend);
    form.addEventListener('submit', handleSend);
    launcher.addEventListener('click', () => setOpen(!open));
    close.addEventListener('click', () => setOpen(false));
    clear.addEventListener('click', () => { reset(open); input.focus(); });
    // Some existing diagram viewers listen on document in capture phase.
    // Intercept only this host's keys before those listeners; keys elsewhere
    // keep their original path and never enter the helper's shortcuts.
    root.addEventListener('keydown', event => {
      const path = event.composedPath();
      if (!path.includes(host)) return;
      event.stopPropagation();
      if (event.key === 'Escape' && open && !event.isComposing) { event.preventDefault(); setOpen(false); }
      else if (event.key === 'Enter' && path[0] === input && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
        handleSend(event);
      }
    }, true);
    for (const name of ['keyup', 'keypress']) root.addEventListener(name, event => {
      if (event.composedPath().includes(host)) event.stopPropagation();
    }, true);
    root.addEventListener('pagehide', () => { reset(false); setOpen(false, false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})(window);
