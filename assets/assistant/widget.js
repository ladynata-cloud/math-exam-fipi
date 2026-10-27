/* Public navigation only. No account, answer, URL-query or persistent context. */
(function (root) {
  'use strict';
  const HOST_ID = 'maxexam-public-assistant';
  const CSS = '/assets/assistant/widget.css?v=public-assistant-20261027';
  const SITE = 'https://mathexam.space';
  const CABINET = 'https://mathexam-board-ladynata.msk1.amvera.tech';
  const privateClasses = 'ym-hide-content ym-disable-clickmap';
  const boardShells = new Set([
    '/trainers/atanasyan-7-9.html', '/trainers/peterson6.html', '/trainers/merzlyak-10-base.html',
    '/trainers/ege-baza-11.html', '/trainers/ege-baza-13.html',
    ...['planimetry', 'vectors', 'stereometry', 'probability', 'random-variables', 'expressions', 'equations']
      .map(name => '/trainers/ege-profile-' + name + '.html')
  ]);
  function permittedPath(pathname) {
    let path;
    try { path = decodeURIComponent(pathname).toLowerCase(); } catch (_) { return false; }
    if (!path.startsWith('/') || /[\\\u0000-\u001f\u007f]/.test(path)) return false;
    if (/(?:^|\/)(?:learning|assistant-service|board-server|video-worker|tools|tests?|fixtures?|docs|assets|sources?|src|private|archives?|archive-5-weeks|drafts|downloads?|exports?|admin|accounts?)(?:\/|$)/.test(path)) return false;
    if (/(?:^|\/)(?:[^/]*[-_.])?(?:board|teacher|parent|student|login|invite|preview|offline|export|print|studio|testing-hub|404)(?:[-_.][^/]*)?(?:\.html)?$/.test(path)) return false;
    if (/\/(?:yandex_[a-z0-9]+|google[a-z0-9]+)\.html$/.test(path) || boardShells.has(path)) return false;
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
    const host = element('div', undefined, { id: HOST_ID, class: privateClasses });
    const shadow = host.attachShadow({ mode: 'open' });
    const stylesheet = element('link', undefined, { rel: 'stylesheet', href: CSS });
    const launcher = element('button', undefined, {
      type: 'button', class: 'launcher ym-disable-clickmap', 'aria-label': 'Открыть MaxExam 0.0, помощник по сайту',
      'aria-expanded': 'false', 'aria-controls': 'maxexam-public-panel'
    });
    launcher.append(element('span', '∑', { class: 'launcher-mark', 'aria-hidden': 'true' }));
    const launcherText = element('span', undefined, { class: 'launcher-label' });
    launcherText.append(element('strong', 'MaxExam 0.0'), element('span', 'Помощь по сайту'));
    launcher.append(launcherText);
    const panel = element('section', undefined, {
      id: 'maxexam-public-panel', class: 'panel ' + privateClasses, role: 'dialog', 'aria-modal': 'false',
      'aria-labelledby': 'maxexam-public-title', hidden: ''
    });
    const header = element('header', undefined, { class: 'header' });
    const title = element('div');
    title.append(element('h2', 'MaxExam 0.0', { id: 'maxexam-public-title' }), element('p', 'Навигатор по материалам сайта', { class: 'role-label' }));
    const close = element('button', '×', { type: 'button', class: 'icon-button', 'aria-label': 'Закрыть помощника' });
    header.append(title, close);
    const log = element('div', undefined, {
      class: 'log ' + privateClasses, role: 'log', 'aria-label': 'Разговор с навигатором', 'aria-live': 'polite',
      'aria-relevant': 'additions', tabindex: '0'
    });
    const form = element('form', undefined, { class: 'form ym-disable-submit ' + privateClasses, autocomplete: 'off' });
    const label = element('label', 'Какую тему или тренажёр ищешь?', { for: 'maxexam-public-question' });
    const input = element('textarea', undefined, {
      id: 'maxexam-public-question', name: 'navigation-question', rows: '2', maxlength: '400',
      placeholder: 'Например: десятичные дроби, геометрия ОГЭ', autocomplete: 'off', spellcheck: 'false',
      class: 'ym-disable-keys ' + privateClasses
    });
    const submit = element('button', 'Найти материал', { type: 'submit', class: 'send' });
    const controls = element('div', undefined, { class: 'form-controls' });
    controls.append(element('small', 'Не указывай имя, контакты или пароль.'), submit);
    const status = element('p', '', { role: 'status', class: 'status', 'aria-live': 'polite' });
    form.append(label, input, controls, status);
    const footer = element('footer', undefined, { class: 'footer' });
    const clear = element('button', 'Очистить чат', { type: 'button', class: 'clear' });
    footer.append(element('small', 'История только на этой странице.'), clear);
    panel.append(header, log, form, footer);
    shadow.append(stylesheet, panel, launcher);
    document.body.append(host);

    function addMessage(text, visitor) {
      const article = element('article', undefined, { class: 'message ' + (visitor ? 'visitor' : 'navigator') + ' ' + privateClasses });
      article.append(element('p', visitor ? 'Ты' : 'MaxExam 0.0', { class: 'speaker' }), element('p', text, { class: 'message-text' }));
      log.append(article);
      // Bound document memory without persisting a transcript elsewhere.
      while (log.children.length > 40) log.firstElementChild.remove();
      return article;
    }
    function showResponse(response) {
      if (!response || typeof response.text !== 'string') throw Error('UNAVAILABLE');
      const article = addMessage(response.text.slice(0, 3000), false);
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
      launcher.setAttribute('aria-label', value ? 'Закрыть MaxExam 0.0' : 'Открыть MaxExam 0.0, помощник по сайту');
      if (value) { greet(); input.focus(); }
      else if (returnFocus) launcher.focus();
    }
    function send() {
      if (!open || !permittedPath(root.location.pathname)) return;
      let text = input.value.trim();
      if (!text) { status.textContent = 'Напиши тему или выбери подсказку в чате.'; input.focus(); return; }
      if (text.length > 400) { status.textContent = 'Сократи вопрос до 400 символов.'; return; }
      input.value = ''; status.textContent = '';
      try {
        const response = data.respond({ text, pathname: root.location.pathname, difficultyCount, referralShown });
        addMessage(response?.kind === 'privacy' ? 'Сообщение с личными данными скрыто.' : text, true);
        text = ''; showResponse(response);
      } catch (_) {
        text = ''; status.textContent = 'Не удалось подобрать материал. Попробуй написать только название темы.';
      }
      input.focus();
    }
    function reset(showWelcome) {
      input.value = ''; log.replaceChildren(); status.textContent = '';
      greeted = false; difficultyCount = 0; referralShown = false;
      if (showWelcome) greet();
    }
    form.addEventListener('submit', event => { event.preventDefault(); event.stopPropagation(); send(); });
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
      else if (event.key === 'Enter' && path[0] === input && !event.shiftKey && !event.isComposing) {
        event.preventDefault(); form.requestSubmit();
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
