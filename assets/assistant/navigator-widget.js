/* Public navigation, worked examples and lesson contacts. */
(function (root) {
  'use strict';
  const HOST_ID = 'maxexam-public-assistant';
  const CSS = '/assets/assistant/widget.css?v=20261105-site1';
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
    document.body.append(host);

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
  let skillGifPlayer;

  function loadSkillGifPlayer() {
    if (!skillGifPlayer) {
      skillGifPlayer = new Promise((resolve, reject) => {
        const script = element('script', undefined, { src: '/assets/trainer-skill-gif.js?v=20261112' });
        script.addEventListener('load', () => {
          if (root.MathExamTrainerSkillGif) resolve(root.MathExamTrainerSkillGif);
          else reject(new Error('GIF player unavailable'));
        }, { once: true });
        script.addEventListener('error', reject, { once: true });
        document.head.append(script);
      }).catch(error => {
        skillGifPlayer = null;
        throw error;
      });
    }
    return skillGifPlayer;
  }

  function skillGif(slug, label = 'Наглядный разбор (GIF)') {
    const details = element('details', undefined, { class: 'trainer-skill-gif', 'data-trainer-skill-gif': slug });
    const summary = element('summary', label);
    const status = element('p', '', { 'data-trainer-gif-status': '', role: 'status' });
    details.append(summary, status);
    let pending = false;
    let ready = false;
    details.addEventListener('toggle', async () => {
      if (!details.open || pending || ready) return;
      pending = true;
      status.textContent = 'Загружается пример…';
      try {
        const player = await loadSkillGifPlayer();
        await player.mount(details, slug);
        ready = true;
      } catch (_) {
        status.textContent = 'Разбор не загрузился. Закройте и откройте его ещё раз.';
      } finally {
        pending = false;
      }
    });
    return details;
  }

  function baseSkillGif(anchor) {
    const href = anchor.querySelector('a[href]')?.pathname || '';
    if (href.startsWith('/trainers/oge-basics/percentages/')) return 'base-percent';
    if (href.startsWith('/trainers/oge-basics/fraction-')) return 'fractions';
    if (href.startsWith('/trainers/oge-basics/negative-')) return 'negatives';
    if (href === '/trainers/simple-equations-stepwise.html') return 'oge-equations';
    return null;
  }

  function standaloneTrainer() {
    if (root.self !== root.top || !/^https?:$/.test(root.location.protocol) || root.MathExamBookEdition ||
        root.OgeCourseSharedMode || root.MathExamLearning?.managed || document.body.dataset.profileBoard) return false;
    const params = new URLSearchParams(root.location.search);
    return !['learning', 'board', 'groupLesson', 'g7-board'].some(key => params.get(key) === '1');
  }

  function learningOptionsStyle() {
    if (document.querySelector('[data-lesson-contact-style]')) return;
    document.head.append(element('link', undefined, {
      rel: 'stylesheet', href: '/assets/trainer-lesson-choice.css?v=20261112-entry', 'data-lesson-contact-style': ''
    }));
  }

  function mountLessonChoices() {
    if (!standaloneTrainer()) return;

    // The placements are public page choices; none is a trainer hint or action.
    // Keep the edition snapshots and existing trainer source files intact.
    const path = root.location.pathname.replace(/\/index\.html$/, '/');
    const dialogRoute = 'dialog[data-profile-skill-dialog] .profile-skill-route';
    const geometry = {
      1: ['На занятии с Натальей Михайловной можно разобрать, как читать чертёж и выбирать свойства фигур.', 'profile-planimetry'],
      2: ['С Натальей Михайловной можно разобрать векторы: как читать рисунок, находить координаты и длину.', 'profile-vectors'],
      3: ['С Натальей Михайловной можно разобрать чертёж объёмной фигуры и понять, какие отрезки понадобятся в решении.', 'profile-stereometry']
    };
    const placements = new Map([
      ['/trainers/long-division-stepwise.html', ['[data-skill-support]', 'beforeend',
        'Наталья Михайловна поможет разобрать деление уголком: от первого неполного делимого до выбора цифры частного.', '#guided-division', 'division']],
      ['/trainers/negative-numbers.html', ['#negative-options', 'beforeend',
        'Хотите разобраться со знаками на числовой прямой? Это можно сделать на занятии с Натальей Михайловной.', null, 'negatives']],
      ['/trainers/oge-task6-fractions.html', ['#settings aside[aria-label="Повторить дроби"]', 'afterend',
        'На занятии с Натальей Михайловной можно разобраться со смыслом дроби, общим знаменателем и порядком действий.', null, 'fractions']],
      ['/trainers/oge-task9-equations.html', ['.generated-help .generated-return', 'beforebegin',
        'Наталья Михайловна поможет разобрать преобразования уравнения и выбрать способ решения.', '.wrap', 'oge-equations']],
      ['/trainers/oge-task11-graphs-trainer.html', ['#task11-more .settings-content > nav', 'afterend',
        'На занятии с Натальей Михайловной можно разобрать, как связаны формула и график.', null, 'oge-graphs']],
      ['/trainers/oge13-inequalities-series.html', ['#hintReturn', 'beforebegin',
        'Наталья Михайловна поможет разобраться, когда меняется знак неравенства и как выбрать нужные промежутки.', null, 'oge-inequalities']],
      ['/trainers/oge-task21-word-problems.html', ['#task21Help', 'beforeend',
        'На занятии с Натальей Михайловной можно потренироваться составлять уравнение по условию задачи.', '#content', 'oge-word-problems']],
      // Keep the remediation panel's single lesson-return link intact.
      ['/ege-baza/path/', ['#ege-remediation', 'afterend',
        'Эту задачу и нужные для неё навыки можно разобрать на занятии с Натальей Михайловной.', '#main', baseSkillGif]],
      ['/ege-profil/start/', [dialogRoute, 'beforeend', anchor => {
        const dialog = anchor.closest('dialog');
        const number = dialog.querySelector('[data-profile-skill-select]')?.value ||
          dialog.querySelector('.profile-skill-subtitle')?.textContent.match(/^№([123])(?:\s|$)/)?.[1];
        return geometry[number];
      }, '#main']],
      ['/ege-profil/trainers/trigonometry.html', [dialogRoute, 'beforeend',
        'Наталья Михайловна поможет разобраться с тригонометрической окружностью, формулами и уравнениями.', '#profile-course-nav', 'profile-trigonometry']]
    ]);
    const placement = placements.get(path);
    if (!placement) return;
    const [selector, position, context, watch, example] = placement;
    const scope = watch ? document.querySelector(watch) : document;
    if (!scope) return;
    const adjacentChoices = new Map();

    function addChoices() {
      for (const [anchor, options] of adjacentChoices) {
        if (scope.contains(anchor)) continue;
        options.remove();
        adjacentChoices.delete(anchor);
      }
      for (const anchor of scope.querySelectorAll(selector)) {
        const neighbor = position === 'beforeend' ? anchor.querySelector(':scope > [data-trainer-learning-options]') :
          position === 'afterend' ? anchor.nextElementSibling : anchor.previousElementSibling;
        if (neighbor?.hasAttribute('data-trainer-learning-options')) continue;
        const [description, slug] = typeof context === 'function' ? (context(anchor) || []) :
          [context, typeof example === 'function' ? example(anchor) : example];
        if (!description) continue;
        learningOptionsStyle();
        const options = element('div', undefined, { 'data-trainer-learning-options': '' });
        if (slug) options.append(skillGif(slug));
        const choice = element('aside', undefined, { class: 'trainer-lesson-choice', 'data-lesson-contact': '' });
        choice.append(element('p', description), element('a', 'Контакты и запись →', {
          href: '/lessons/#contact', target: '_blank', rel: 'noopener noreferrer'
        }));
        options.append(choice);
        anchor.insertAdjacentElement(position, options);
        if (watch && position !== 'beforeend') adjacentChoices.set(anchor, options);
      }
    }

    addChoices();
    if (watch) new root.MutationObserver(addChoices).observe(scope, { childList: true, subtree: true });
  }

  function mountTrainerEntrances() {
    if (!standaloneTrainer()) return;
    const path = root.location.pathname.replace(/\/index\.html$/, '/');
    const divisionTopic = ['/topics/delenie-ugolkom/', 'Разбор деления'];
    const divisionPath = ['/trainers/oge-basics/multiplication-division/division-path.html', 'Ступени деления'];
    const fractionTopic = ['/topics/obyknovennye-drobi/', 'Разбор дробей'];
    const percentTopic = ['/topics/procenty/', 'Разбор процентов'];
    const percentPath = ['/trainers/oge-basics/percentages/', 'Все навыки по процентам'];
    const equationsTopic = ['/topics/lineynye-uravneniya/', 'Разбор уравнений'];
    const geometryTopic = ['/topics/oge-geometriya/', 'Разбор геометрии ОГЭ'];
    const geometryPath = ['/trainers/oge-course/#geometry', 'Задания по геометрии ОГЭ'];
    const gradeSeven = ['/geometry-course/grade7/', 'Курс геометрии 7 класса'];
    const geoRightDemo = ['/lessons/#demo-ege', 'К примеру на странице занятий'];
    const routes = new Map();
    const add = (paths, links, options = {}) => {
      for (const name of paths) routes.set(name, { links, ...options });
    };

    add(['/trainers/long-division-stepwise.html'], [divisionTopic, divisionPath, ['/lessons/#demo-division', 'К примеру на странице занятий']], { lesson: false });
    add(['/trainers/long-division-claude.html'], [divisionTopic, divisionPath], { anchor: 'main .hero' });
    add([divisionPath[0]], [divisionTopic, ['/trainers/long-division-stepwise.html', 'Деление по шагам']], { anchor: '.path-hero' });
    add(['/trainers/oge-basics/multiplication-division/quotient-estimate.html'], [divisionTopic,
      ['/trainers/oge-basics/multiplication-division/division-path.html#stage-twoDigit', 'Деление на двузначное число']], { anchor: '#view-practice' });
    add(['/trainers/rounding-stepwise.html'], [divisionTopic, ['/trainers/oge-basics/multiplication-division/quotient-estimate.html', 'Подбор цифры частного']], { anchor: 'main .hero' });

    add(['/trainers/oge-task6-fractions.html'], [fractionTopic,
      ['/trainers/oge-basics/fraction-common-denominator.html', 'Общий знаменатель']], { lesson: false });
    add(['/trainers/oge-basics/fraction-meaning.html'], [fractionTopic,
      ['/trainers/oge-basics/fraction-common-denominator.html', 'Дальше: общий знаменатель']]);
    add(['/trainers/oge-basics/fraction-common-denominator.html'], [fractionTopic, ['/trainers/oge-task6-fractions.html', 'Дроби в ОГЭ №6']]);

    add([percentPath[0]], [percentTopic, ['/trainers/oge-basics/percentages/percent-of-number-and-whole.html', 'Найти процент от числа']]);
    add(['/trainers/oge-basics/percentages/percent-of-number-and-whole.html'], [percentTopic, percentPath]);
    add(['/trainers/oge-1-5-trainers/percent-table-trainer.html'], [percentTopic, percentPath], { anchor: '#result-details' });
    add(['/trainers/simple-equations-stepwise.html'], [equationsTopic, ['/trainers/oge-task9-equations.html', 'Уравнения в ОГЭ №9']], { anchor: 'main .hero' });
    add(['/trainers/oge-task9-equations.html'], [equationsTopic, ['/trainers/simple-equations-stepwise.html', 'Простые уравнения по шагам']], { lesson: false });
    add(['/trainers/oge-task11-graphs-trainer.html'], [['/lessons/#demo-graphs', 'К примеру на странице занятий'],
      ['/trainers/oge-course/', 'Все задания ОГЭ']], { lesson: false });

    add(['/trainers/oge-task15-triangles.html', '/trainers/oge-task16-circle.html', '/trainers/oge-task17-quadrilaterals.html',
      '/trainers/oge-task18-grid.html', '/trainers/task19-trainer.html'], [geometryTopic, geometryPath]);
    add(['/oge/geometry/task-15-external-angle.html'], [geometryTopic,
      ['/trainers/oge-task15-triangles.html', 'Решать задачи №15']]);
    add(['/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html'], [
      ['/trainers/oge-1-5-trainers/practice-1-5-map.html', 'Выбрать сюжет заданий №1–5'], ['/oge/', 'Подготовка к ОГЭ']], { anchor: '#result .result-actions' });

    add(['/stereo-course/textbook/'], [['/lessons/#demo-cone', 'К примеру на странице занятий'],
      ['/stereo-course/', 'Курс стереометрии']], {
      anchor: '.textbook-help', watch: '#textbook-app', match: hash => hash === '#ex-main-0346'
    });
    add(['/ege-profil/start/'], [geoRightDemo, ['/ege-profil/', 'Все задания профильного ЕГЭ']], {
      anchor: '#main', position: 'afterbegin', lesson: false, watch: '#main',
      match: hash => /^#(?:practice\/geo-right\/(?:guided|plan|independent)|(?:exam|calm)\/1)$/.test(hash)
    });

    add(['/geometry-course/trainers/ch4-p1-t2-proof-angle-sum.html'], [gradeSeven,
      ['/geometry-course/trainers/ch4-p1-t1-angle-sum-lab.html', 'Исследовать сумму углов']], { anchor: '#bar' });
    add(['/geometry-course/trainers/ch2-p3-t2-proof-asa.html'], [gradeSeven,
      ['/geometry-course/trainers/ch2-p3-t1-overlay-asa.html', 'Увидеть второй признак на чертеже']], { anchor: '#bar' });
    add(['/trainers/ege-profile/log-inequalities/nested.html'], [
      ['/trainers/ege-profile/log-inequalities/index.html#nested-example-title', 'Разбор вложенных логарифмов'],
      ['/trainers/ege-profile/log-inequalities/lesson.html', 'Логарифмические неравенства по шагам']], { anchor: '#current .bottom-actions', watch: '#current' });
    add(['/trainers/negative-numbers-alternative.html'], [
      ['/trainers/oge-basics/negative-number-line.html', 'Потренировать числовую прямую'],
      ['/trainers/negative-numbers.html', 'Сложение и вычитание со знаками']], { anchor: 'main.page > section.card:first-of-type', position: 'beforeend' });

    const examples = new Map();
    const addExamples = (paths, first, second) => {
      for (const name of paths) examples.set(name, [first, second]);
    };
    const division = ['division', 'Деление уголком'];
    const remainder = ['division-remainder', 'Проверка остатка'];
    const denominator = ['fractions', 'Общий знаменатель'];
    const percent = ['base-percent', 'Процент от числа'];
    const whole = ['percent-whole', 'Число по его проценту'];
    const equations = ['oge-equations', 'Преобразование уравнения'];
    const triangle = ['triangle-sum', 'Третий угол треугольника'];
    const exterior = ['triangle-exterior', 'Внешний угол треугольника'];
    const percentTable = ['percent-table', 'Проценты в таблице'];

    addExamples(['/trainers/long-division-stepwise.html', '/trainers/long-division-claude.html', divisionTopic[0]], division, remainder);
    addExamples([divisionPath[0]], division, ['division-zero', 'Ноль в частном']);
    addExamples(['/trainers/oge-basics/multiplication-division/quotient-estimate.html'], ['quotient-estimate', 'Подбор цифры частного'], remainder);
    addExamples(['/trainers/rounding-stepwise.html'], ['rounding-nearest', 'Округление до сотен'], ['rounding-place', 'Округление до тысяч']);
    addExamples(['/trainers/oge-task6-fractions.html'], denominator, ['fraction-multiply', 'Умножение дробей']);
    addExamples(['/trainers/oge-basics/fraction-meaning.html'], ['fraction-parts', 'Что показывают числитель и знаменатель'], ['fraction-of-number', 'Дробь от числа']);
    addExamples(['/trainers/oge-basics/fraction-common-denominator.html', fractionTopic[0]], denominator, ['fraction-subtraction', 'Вычитание дробей']);
    addExamples([percentPath[0], '/trainers/oge-basics/percentages/percent-of-number-and-whole.html', percentTopic[0]], percent, whole);
    addExamples(['/trainers/oge-1-5-trainers/percent-table-trainer.html'], percentTable, ['percent-change', 'Скидка и новая цена']);
    addExamples(['/trainers/simple-equations-stepwise.html', equationsTopic[0]], equations, ['linear-balance', 'Одинаковое действие в обеих частях']);
    addExamples(['/trainers/oge-task9-equations.html'], equations, ['equation-distribute', 'Раскрытие скобок']);
    addExamples(['/trainers/oge-task11-graphs-trainer.html'], ['oge-graphs', 'Коэффициенты линейной функции'], ['graph-points', 'Точки линейной функции']);
    addExamples(['/trainers/oge-task15-triangles.html', '/oge/geometry/task-15-external-angle.html',
      '/geometry-course/trainers/ch4-p1-t2-proof-angle-sum.html', geometryTopic[0]], triangle, exterior);
    addExamples(['/trainers/oge-task16-circle.html'], ['circle-inscribed', 'Вписанный угол'], ['circle-tangent', 'Радиус и касательная']);
    addExamples(['/trainers/oge-task17-quadrilaterals.html'], ['quad-area', 'Площадь трапеции'], ['quad-midline', 'Средняя линия трапеции']);
    addExamples(['/trainers/oge-task18-grid.html'], ['grid-area', 'Площадь треугольника на клетках'], ['grid-diagonal', 'Длина отрезка по клеткам']);
    addExamples(['/trainers/task19-trainer.html'], triangle, ['geometry-statement', 'Контрпример к утверждению']);
    addExamples(['/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html'], percentTable, ['diagnostic-tariff', 'Сравнение тарифов']);
    addExamples(['/stereo-course/textbook/'], ['cone-volume', 'Объём конуса'], ['cone-scale', 'Как меняется объём конуса']);
    addExamples(['/ege-profil/start/'], ['profile-planimetry', 'Теорема Пифагора'], ['profile-area', 'Площадь прямоугольного треугольника']);
    addExamples(['/geometry-course/trainers/ch2-p3-t2-proof-asa.html'], ['triangle-asa', 'Второй признак равенства треугольников'], ['triangle-asa-apply', 'Соответствие сторон равных треугольников']);
    addExamples(['/trainers/ege-profile/log-inequalities/nested.html'], ['log-domain', 'Область допустимых значений'], ['log-decreasing', 'Убывающий логарифм']);
    addExamples(['/trainers/negative-numbers-alternative.html'], ['negatives', 'Сложение на числовой прямой'], ['negative-subtract', 'Вычитание отрицательного числа']);

    const pair = examples.get(path);
    if (!pair) return;

    function exampleGroup() {
      const group = element('section', undefined, {
        class: 'trainer-entry-examples', 'aria-label': 'Наглядные разборы (GIF)', 'data-trainer-entry-examples': ''
      });
      for (const [slug, label] of pair) group.append(skillGif(slug, label));
      return group;
    }

    const route = routes.get(path);
    if (!route) {
      const hero = document.querySelector('.topic-hero');
      if (hero) {
        learningOptionsStyle();
        hero.after(exampleGroup());
      }
      return;
    }
    const { links, anchor: selector = 'nav.oge-wayfinding', position = 'afterend', match, watch, lesson = true } = route;
    let menu;
    let examplesNode;
    let previousAnchor;

    function addLinks() {
      const anchor = document.querySelector(selector);
      if (!anchor || (match && !match(root.location.hash))) {
        menu?.remove();
        examplesNode?.remove();
        return;
      }
      if (menu?.isConnected && examplesNode?.isConnected && previousAnchor === anchor) return;
      menu?.remove();
      examplesNode?.remove();
      learningOptionsStyle();
      menu = element('nav', undefined, { class: 'trainer-entry-links', 'aria-label': 'Переходы по теме', 'data-trainer-entry-links': '' });
      for (const [href, label] of links) {
        menu.append(element('a', label, { href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${label} (в новой вкладке)` }));
      }
      if (lesson) {
        menu.append(element('a', 'Разобрать с репетитором', {
          href: '/lessons/#contact', target: '_blank', rel: 'noopener noreferrer', class: 'trainer-entry-lesson',
          'aria-label': 'Разобрать тему с Натальей Михайловной (в новой вкладке)'
        }));
      }
      previousAnchor = anchor;
      examplesNode = exampleGroup();
      anchor.insertAdjacentElement(position, menu);
      menu.after(examplesNode);
    }

    addLinks();
    const observed = watch && document.querySelector(watch);
    if (observed) new root.MutationObserver(addLinks).observe(observed, { childList: true, subtree: true });
    if (match) root.addEventListener('hashchange', addLinks);
  }

  function start() {
    mount();
    mountLessonChoices();
    mountTrainerEntrances();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
