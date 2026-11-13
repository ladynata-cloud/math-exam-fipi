(() => {
  'use strict';

  const catalog = globalThis.ProfileAlphabetCatalog;
  const lessons = globalThis.ProfileAlphabetLessons;
  const engine = globalThis.ProfileAlphabetEngine;
  const main = document.querySelector('#alphabet-main');
  const site = main.dataset.mathSite || '';
  const base = location.pathname;
  let storage;
  try { storage = localStorage; } catch { /* The page can still be used for the current session. */ }
  const store = engine.create(storage);
  const params = new URLSearchParams(location.search);
  const number = Number(params.get('exam'));
  const back = catalog.safeBack(params.get('back'));
  const inCabinet = Boolean(site);
  const teacher = inCabinet && params.get('mode') === 'teacher';
  const keyFor = (alphabetId, skillId) => (teacher ? 'teacher/' : '') + alphabetId + '/' + skillId;
  const status = {
    new: 'Можно начать', started: 'В работе', supported: 'Нужна новая проверка',
    verified: 'Самостоятельно'
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, letter =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[letter]);
  const linkTo = (id, skill) => {
    const url = new URL(catalog.href(id, skill, number, back, base), location.origin);
    if (teacher) url.searchParams.set('mode', 'teacher');
    return url.pathname + url.search + url.hash;
  };
  const examLink = n => site + catalog.examHref(n);
  const labels = { wrong: 'Ошибка', hint: 'Подсказка', correct: 'Верно', repeat: 'Начато повторение' };
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function statusOf(alphabetId, skillId) {
    const lesson = lessons[alphabetId][skillId];
    return engine.progress(store.read(keyFor(alphabetId, skillId)), lesson);
  }

  function returnLinks(alphabet) {
    const selected = alphabet?.numbers.includes(number) ? number : null;
    const returnLink = back ? '<a class="az-button secondary" href="' + escape(site + back) + '">Вернуться к исходному заданию</a>' :
      selected ? '<a class="az-button secondary" href="' + examLink(selected) + '">Вернуться к №' + selected + '</a>' : '';
    return '<nav class="az-navigation" aria-label="Навигация по теме">' +
      '<a href="' + escape(linkTo('')) + '">← К списку тем</a>' +
      (alphabet && location.hash.split('/').length === 3 ? '<a href="' + escape(linkTo(alphabet.id)) + '">К навыкам темы</a>' : '') +
      returnLink + '</nav>';
  }

  function modeLink(alphabet, id) {
    if (!inCabinet) return '';
    const query = new URLSearchParams(params);
    if (teacher) query.delete('mode');
    else query.set('mode', 'teacher');
    const href = base + (query.size ? '?' + query : '') + '#/' + alphabet.id + '/' + id;
    return '<a class="az-button secondary" href="' + escape(href) + '">' +
      (teacher ? 'Самостоятельно' : 'Разобрать с преподавателем') + '</a>';
  }

  function resources(alphabet) {
    return '<section class="az-panel az-resources"><h2>Задачи ЕГЭ</h2><div class="az-numbers">' +
      alphabet.numbers.map(n => '<a href="' + examLink(n) + '">№' + n + '</a>').join('') +
      '</div><h2>Материалы MathExam</h2><ul>' +
      alphabet.refs.map(([label, url]) => '<li><a href="' + site + url + '">' + label + '</a></li>').join('') +
      '</ul></section>';
  }

  function routeStart(alphabet, ids) {
    const available = ids.map(id => {
      const record = store.read(keyFor(alphabet.id, id));
      return { id, record };
    }).filter(({ id, record }) => engine.question(record, lessons[alphabet.id][id]));
    return available.find(({ record }) => record.phase || record.attempts.length || record.draft || record.helped)?.id ??
      available.find(({ record }) => !record.independent)?.id ?? ids[0];
  }

  function routeContinuation(alphabet, current) {
    if (!alphabet.route) return '';
    const ids = Object.keys(alphabet.skills);
    const nextId = ids[ids.indexOf(current) + 1];
    const target = nextId ? linkTo(alphabet.id, nextId) : alphabet.next ?
      linkTo(alphabet.next) : examLink(alphabet.numbers[0]);
    const label = nextId ? 'Следующий шаг' : alphabet.next ? 'К методам решения задач с параметром' :
      'К экзаменационным задачам №' + alphabet.numbers[0];
    return '<a class="az-button primary" href="' + escape(target) + '">' + label + '</a>';
  }

  function renderCatalog() {
    const selected = catalog.forNumber(number);
    const title = selected.length ? 'Основы для №' + number : 'Основы и методы';
    main.innerHTML = (selected.length ? '<nav class="az-navigation" aria-label="Навигация по теме"><a href="' +
      escape(base) + '">← Все темы</a><a class="az-button secondary" href="' + examLink(number) + '">К заданию №' +
      number + '</a></nav>' : '') + '<p class="az-kicker">ЕГЭ профиль · 2027</p><h1>' + title + '</h1>' +
      '<p class="az-lead">Разбери один приём, проверь себя на другом примере и переходи к задачам ЕГЭ.</p>' +
      '<div class="az-catalog">' + (selected.length ? selected : catalog.list).map(alphabet => {
        const total = Object.keys(alphabet.skills).length;
        const count = Object.keys(alphabet.skills).filter(id => statusOf(alphabet.id, id) === 'verified').length;
        return '<a class="az-panel az-card" href="' + escape(linkTo(alphabet.id)) + '"><span class="az-kicker">' +
          alphabet.numbers.map(n => '№' + n).join(' · ') + '</span><h2>' + alphabet.title + '</h2><p>' +
          alphabet.description + '</p><span class="az-count">Самостоятельно: ' + count + ' из ' + total + '</span></a>';
      }).join('') + '</div>';
  }

  function skillList(alphabet, current) {
    const entries = Object.entries(alphabet.skills);
    const relevant = entries.filter(([, skill]) => skill.numbers.includes(number));
    const items = [...relevant, ...entries.filter(entry => !entry[1].numbers.includes(number))];
    return '<section class="az-panel az-skill-list"><h2>Карта навыков</h2><ul>' +
      items.map(([id, skill]) => {
        const state = statusOf(alphabet.id, id);
        return '<li><a href="' + escape(linkTo(alphabet.id, id)) + '"' + (id === current ? ' aria-current="page"' : '') +
        '><strong>' + skill.title + '</strong><span class="az-status az-' + state + '">' + status[state] + '</span></a></li>';
      }).join('') + '</ul></section>';
  }

  function journal(record) {
    const entries = record.events.filter(event => Object.hasOwn(labels, event.type));
    if (!entries.length) return '';
    return '<details class="az-panel az-history"><summary>Журнал попыток</summary><ol>' +
      [...entries].reverse().map(event => {
        const time = new Date(event.at);
        return '<li><span>' + (Number.isFinite(+time) ? date.format(time) + ' · ' : '') + labels[event.type] +
          (event.answer ? ' · ' + escape(event.answer) : '') + (event.helped ? ' · с подсказкой' : '') + '</span></li>';
      }).join('') + '</ol></details>';
  }

  function exerciseMarkup(record, lesson, alphabet, id) {
    const current = engine.question(record, lesson);
    if (!current) {
      return '<section class="az-panel az-exercise"><h2>' +
        (record.independent ? 'Самостоятельная проверка пройдена' : 'Тренировка завершена') + '</h2><p>' +
        (record.independent ? 'Ключевой шаг получился на отдельном условии с первой попытки без подсказки.' :
          'В проверке были ошибки или подсказки. К навыку можно вернуться и потренироваться ещё.') +
        '</p><div class="az-actions">' + routeContinuation(alphabet, id) +
        '<button class="az-button secondary" type="button" data-restart>Повторить навык</button></div></section>';
    }
    const solved = record.attempts.at(-1) === true;
    const stage = record.phase ? (teacher ? 'Проверка после разбора' : 'Самопроверка') : (teacher ? 'Шаг для урока' : 'Учебный шаг');
    const diagram = globalThis.ProfileAlphabetDiagram(current.diagram);
    const support = !record.phase ? '<details class="az-support"><summary>Правило и пример</summary><p>' +
      lesson.rule + '</p><p>' + lesson.example + '</p></details>' : '';
    const message = solved ? 'Верно. ' + current.explanation : record.attempts.includes(false) ?
      'Пока не сходится. ' + (record.attempts.length >= 2 ? 'Можно открыть подсказку.' : 'Сверь запись с условием.') : '';
    return '<section class="az-panel az-exercise" aria-label="' + stage + '"><p class="az-kicker">' + stage + '</p>' +
      '<h2 id="az-question" tabindex="-1">' + current.prompt + '</h2>' + diagram +
      '<form id="az-form" novalidate><label for="az-answer">' + current.label + '</label>' +
      '<input id="az-answer" name="answer" type="text" maxlength="120" autocomplete="off" spellcheck="false" value="' +
      escape(record.draft) + '"' + (solved ? ' readonly' : '') + ' aria-describedby="az-feedback">' +
      '<p id="az-feedback" role="status" class="az-feedback ' + (solved ? 'ok' : message ? 'retry' : '') + '">' + message + '</p>' +
      (record.helped && !solved ? '<p class="az-hint">' + current.hint + '</p>' : '') +
      '<div class="az-actions">' + (solved ? '<button class="az-button primary" type="button" data-advance>' +
        (record.phase ? record.independent || record.phase === lesson.checks.length ? 'Завершить' : 'Решить другое условие' : 'Проверить себя на новом условии') +
        '</button>' : '<button class="az-button primary" type="submit">Проверить</button>' +
        (record.helped ? '' : '<button class="az-button secondary" type="button" data-hint>Подсказка</button>')) +
      '</div></form>' + support + '</section>';
  }

  function renderSkill(alphabet, id) {
    const lesson = lessons[alphabet.id][id];
    const key = keyFor(alphabet.id, id);
    const record = store.read(key);
    main.innerHTML = returnLinks(alphabet) + '<p class="az-kicker">' + alphabet.short + '</p><h1>' +
      alphabet.skills[id].title + '</h1><div class="az-grid"><div class="az-work">' +
      exerciseMarkup(record, lesson, alphabet, id) + (teacher || alphabet.id === 'written-solution' ?
        '<section class="az-panel az-notes"><h2>Запиши обоснование</h2><label for="az-note">Запиши свой ход рассуждений. Затем сверь существенный шаг с разбором.</label>' +
        '<textarea id="az-note" maxlength="4000">' + escape(record.note) + '</textarea><p>Запись сохраняется в браузере. Полное доказательство можно проверить с преподавателем.</p></section>' : '') +
      journal(record) + '</div><aside class="az-aside">' +
      modeLink(alphabet, id) + skillList(alphabet, id) + resources(alphabet) + '</aside></div>';
    const form = main.querySelector('#az-form');
    const input = main.querySelector('#az-answer');

    function update(change, focus) {
      const latest = store.read(key);
      if (latest.phase === record.phase) {
        store.save(key, change(latest) ?? latest);
      }
      const open = main.querySelector('.az-support')?.open;
      renderSkill(alphabet, id);
      const detail = main.querySelector('.az-support');
      if (detail && open) detail.open = true;
      main.querySelector(focus)?.focus({ preventScroll: true });
      updateStorageMessage();
    }

    input?.addEventListener('input', () => {
      const latest = store.read(key);
      if (latest.phase !== record.phase || latest.attempts.at(-1) === true) return;
      latest.draft = input.value;
      store.save(key, latest);
      updateStorageMessage();
    });
    main.querySelector('#az-note')?.addEventListener('input', event => {
      const latest = store.read(key);
      latest.note = event.target.value;
      store.save(key, latest);
      updateStorageMessage();
    });
    form?.addEventListener('submit', event => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        const feedback = main.querySelector('#az-feedback');
        feedback.className = 'az-feedback retry';
        feedback.textContent = 'Введи ответ, чтобы проверить шаг.';
        input.focus();
        return;
      }
      const correct = engine.matches(value, engine.question(record, lesson).answers);
      update(latest => { engine.check(latest, lesson, value); }, correct ? '[data-advance]' : '#az-answer');
    });
    main.querySelector('[data-hint]')?.addEventListener('click', () => {
      update(latest => engine.hint(latest, lesson), '#az-answer');
    });
    main.querySelector('[data-advance]')?.addEventListener('click', () => {
      update(latest => engine.advance(latest, lesson), '#az-question, [data-restart]');
    });
    main.querySelector('[data-restart]')?.addEventListener('click', () => {
      update(engine.restart, '#az-question');
    });
  }

  function updateStorageMessage() {
    document.querySelector('#az-storage').hidden = store.available();
  }

  function renderRoute(alphabet) {
    const nav = alphabet.route ? (() => {
      const ids = Object.keys(alphabet.skills);
      const done = ids.filter(id => statusOf(alphabet.id, id) === 'verified').length;
      const id = routeStart(alphabet, ids);
      const records = ids.map(skill => store.read(keyFor(alphabet.id, skill)));
      const inProgress = records.some(record => record.draft || record.attempts.length || record.helped);
      const label = done === ids.length && !inProgress ? 'Повторить маршрут' :
        ids.some(skill => statusOf(alphabet.id, skill) !== 'new') ? 'Продолжить маршрут' : 'Начать маршрут';
      return '<div class="az-actions"><a class="az-button primary" href="' + escape(linkTo(alphabet.id, id)) + '">' +
        label + '</a><span class="az-count">Самостоятельно: ' + done + ' из ' + ids.length + '</span></div>';
    })() : '';
    const atlas = alphabet.atlas ? '<div data-az-atlas></div>' : '';
    main.innerHTML = returnLinks(alphabet) + '<p class="az-kicker">ЕГЭ профиль · 2027</p><h1>' +
      alphabet.title + '</h1><p class="az-lead">' + alphabet.description + '</p>' + nav + atlas + '<div class="az-grid">' +
      skillList(alphabet) + resources(alphabet) + '</div>';
    if (alphabet.atlas) globalThis.ProfileFunctionAtlas?.mount(main.querySelector('[data-az-atlas]'));
  }

  function render() {
    const [id, skill] = location.hash.replace(/^#\/?/, '').split('/');
    const alphabet = Object.hasOwn(catalog.index, id) ? catalog.index[id] : null;
    if (!alphabet) renderCatalog();
    else if (Object.hasOwn(alphabet.skills, skill)) renderSkill(alphabet, skill);
    else renderRoute(alphabet);
    updateStorageMessage();
    document.title = main.querySelector('h1').textContent + ' · MathExam';
  }

  addEventListener('hashchange', () => {
    render();
    scrollTo(0, 0);
    main.focus({ preventScroll: true });
  });
  addEventListener('pageshow', event => { if (event.persisted) render(); });
  render();
})();
