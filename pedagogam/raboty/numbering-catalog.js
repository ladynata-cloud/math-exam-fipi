/* Permanent MathExam collection numbers. Filters select a saved collection;
 * they never assign or compact its numbers. No student data is used. */
(function () {
  'use strict';
  try {
  const data = document.getElementById('work-numbering-data');
  if (!data) throw new Error('Не удалось загрузить номера работ. Обновите страницу.');
  if (!window.MathExamNumberedDownloads) {
    throw new Error('Скачивание с номерами пока недоступно. Проверьте соединение и обновите страницу.');
  }
  const registry = JSON.parse(data.textContent);
  const grade = document.getElementById('grade');
  const book = document.getElementById('book');
  const search = document.getElementById('search');
  const catalog = document.getElementById('catalog');
  const cards = [...document.querySelectorAll('.pack')];
  const sections = [...document.querySelectorAll('[data-work-id]')];
  const isCatalog = Boolean(grade && book && search && catalog);
  const fixedGrade = Number(document.querySelector('[data-numbering-grade]')?.dataset.numberingGrade || 0);
  const topicParams = new URL(location.href).searchParams;
  const booksByTitle = new Map(registry.books.map(item => [item.title, item]));
  const norm = value => String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const names = { sr: 'Самостоятельная работа', kr: 'Контрольная работа' };
  const position = new Map();
  for (const collection of registry.collections) {
    for (const kind of ['sr', 'kr']) {
      collection[kind].forEach((id, index) => {
        const existing = position.get(id) || [];
        existing.push({ collectionId: collection.id, grade: collection.grade,
          bookId: collection.bookId, bookTitle: collection.bookTitle,
          number: index + 1, kind });
        position.set(id, existing);
      });
    }
  }

  function selection() {
    if (isCatalog) return { grade: Number.parseInt(grade.value, 10) || 0,
      bookId: book.value ? booksByTitle.get(book.value)?.id || '__unknown__' : null };
    const requestedGrade = Number(topicParams.get('grade'));
    const requestedBook = topicParams.get('book');
    return { grade: requestedGrade >= 5 && requestedGrade <= 11 ? requestedGrade : fixedGrade,
      bookId: requestedBook || null };
  }

  function activeCollections() {
    const selected = selection();
    return registry.collections.filter(item => (!selected.grade || item.grade === selected.grade)
      && (item.bookId || null) === selected.bookId);
  }

  function getContexts(id) {
    const selected = selection();
    return (position.get(id) || []).filter(item => (!selected.grade || item.grade === selected.grade)
      && (item.bookId || null) === selected.bookId).map(item => ({ ...item }));
  }

  function contextText(contexts) {
    return contexts.map(item => `${item.grade} класс — № ${item.number}`).join('; ');
  }

  function updateSection(section) {
    const id = section.dataset.workId;
    const work = registry.works[id];
    if (!work) throw new Error(`Unknown numbered work: ${id}`);
    const contexts = getContexts(id);
    section.hidden = contexts.length === 0;
    const heading = section.querySelector('.work-heading');
    if (heading) heading.textContent = names[work.kind]
      + (contexts.length === 1 ? ` № ${contexts[0].number}` : '')
      + (work.format === 'docx' ? ' · Word' : '') + ' · 4 варианта';
    const label = section.querySelector('.work-number-label');
    if (label) label.textContent = contextText(contexts);
    section.dataset.workNumbers = contexts.map(item => `${item.collectionId}:${item.number}`).join('|');
    for (const link of section.querySelectorAll('[data-numbered-role]')) {
      link.setAttribute('aria-label', `${names[work.kind]} ${contextText(contexts)}. ${work.title}. `
        + (link.dataset.numberedRole === 'teacher' ? 'Ответы и решения' : 'Задания')
        + (work.format === 'docx' ? ' Word' : ' PDF'));
    }
  }

  function queryParts(query) {
    let kind = null, number = null;
    const full = /(?:самостоятельная(?:\s+работа)?|контрольная(?:\s+работа)?|ср|кр)\s*(?:№\s*)?(\d+)\b/iu;
    const found = query.match(full);
    if (found) {
      kind = /^(?:кр|контрольная)/iu.test(found[0]) ? 'kr' : 'sr';
      number = Number(found[1]);
      query = query.replace(found[0], '');
    } else {
      const numeric = query.match(/№\s*(\d+)\b/u);
      if (numeric) { number = Number(numeric[1]); query = query.replace(numeric[0], ''); }
    }
    return { kind, number, tokens: norm(query).split(/\s+/u).filter(Boolean) };
  }

  function updateReferences(card) {
    const target = card.querySelector('.numbering-reference');
    if (!target) return;
    target.replaceChildren();
    const selected = activeCollections();
    const notes = new Set();
    if (selection().bookId) {
      for (const section of card.querySelectorAll('[data-work-id]')) {
        if (section.hidden) continue;
        for (const collection of selected) {
          const text = collection.references?.[section.dataset.workId];
          if (text) notes.add(text);
        }
      }
    }
    target.hidden = notes.size === 0;
    if (!target.hidden) {
      const heading = document.createElement('strong');
      heading.textContent = 'Соответствие выбранному учебнику';
      target.append(heading);
      for (const note of notes) {
        const paragraph = document.createElement('p');
        paragraph.textContent = note;
        target.append(paragraph);
      }
    }
  }

  function updateContents() {
    const target = document.getElementById('numbering-contents');
    const selected = activeCollections();
    if (!target) return;
    target.hidden = selected.length !== 1;
    if (target.hidden) return;
    const collection = selected[0];
    target.querySelector('summary').textContent = `Содержание подборки · ${collection.grade} класс`;
    const body = target.querySelector('.numbering-contents-body');
    body.replaceChildren();
    for (const kind of ['sr', 'kr']) {
      const title = document.createElement('h3');
      title.textContent = kind === 'sr' ? 'Самостоятельные работы' : 'Контрольные работы';
      const list = document.createElement('ol');
      list.className = 'numbering-list';
      list.dataset.kind = kind;
      collection[kind].forEach((id, index) => {
        const work = registry.works[id];
        if (!work) return;
        const item = document.createElement('li');
        item.value = index + 1;
        const link = document.createElement('a');
        link.href = `#${work.bankId}`;
        link.dataset.numberedContents = id;
        link.textContent = work.title + (work.format === 'docx' ? ' · Word' : '');
        item.append(link); list.append(item);
      });
      body.append(title, list);
    }
    const note = document.createElement('p');
    note.className = 'numbering-small';
    note.textContent = [collection.orderBasis, collection.scopeNote].filter(Boolean).join(' ')
      || 'Номера закреплены в подборке MathExam. Поиск их не меняет.';
    body.append(note);
  }

  function updateURL() {
    if (!isCatalog) return;
    const url = new URL(location.href);
    const selected = selection();
    url.searchParams.delete('class');
    if (selected.grade) url.searchParams.set('grade', String(selected.grade));
    else url.searchParams.delete('grade');
    if (selected.bookId) url.searchParams.set('book', selected.bookId);
    else url.searchParams.delete('book');
    if (search.value.trim()) url.searchParams.set('q', search.value.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    const link = document.getElementById('numbering-selection-link');
    if (link) link.href = url.pathname + url.search;
  }

  function topicLink(link, contexts) {
    const selected = selection();
    const url = new URL(link.href);
    url.search = '';
    const selectedGrade = selected.grade || (selected.bookId ? contexts[0]?.grade : null);
    if (selectedGrade) url.searchParams.set('grade', String(selectedGrade));
    if (selected.bookId) url.searchParams.set('book', selected.bookId);
    link.href = url.pathname + url.search + url.hash;
  }

  function refresh(updateAddress = true) {
    sections.forEach(updateSection);
    if (!isCatalog) {
      const note = document.getElementById('numbering-topic-note');
      const selected = activeCollections();
      const available = sections.some(section => !section.hidden);
      if (note) note.textContent = selected.length === 1 && available
        ? 'Номера и скачиваемые файлы: ' + selected[0].title + '.'
          + (selected[0].grade !== fixedGrade ? ` Методические рекомендации ниже подготовлены для ${fixedGrade} класса; перед работой проверьте указанные необходимые навыки.` : '')
        : 'Для этого сочетания класса и учебника работа не назначена. Выберите подборку в общем каталоге.';
      for (const link of document.querySelectorAll('[data-numbering-return]')) {
        topicLink(link, []);
      }
      if (available && selection().grade !== fixedGrade) {
        const title = document.querySelector('[data-numbered-title]');
        if (title) title.textContent = title.textContent.replace(/,?\s*(?:[5-9]|1[01])\s+класс(?![а-яё])/u, '');
        const eyebrow = document.querySelector('[data-numbered-grade-label]');
        if (eyebrow) eyebrow.textContent = eyebrow.textContent.replace(/^(?:[5-9]|1[01])\s+класс/u, selection().grade + ' класс');
      }
      for (const link of document.querySelectorAll('[data-numbered-pack]')) link.hidden = !available;
      return;
    }
    const query = queryParts(search.value);
    let count = 0;
    for (const card of cards) {
      const eligible = [...card.querySelectorAll('[data-work-id]')].filter(item => !item.hidden);
      const contexts = eligible.flatMap(item => getContexts(item.dataset.workId));
      const grades = [...new Set(contexts.map(item => item.grade))].sort((a, b) => a - b);
      const kicker = card.querySelector('.kicker');
      if (kicker && grades.length) kicker.textContent = grades.join(', ')
        + (grades.length === 1 ? ' класс' : ' классы') + ' · ' + card.dataset.subject;
      const haystack = norm(card.dataset.search + ' ' + contexts.map(item => `${item.grade} класс`).join(' '));
      const numberMatches = query.number === null || eligible.some(item => {
        const work = registry.works[item.dataset.workId];
        return (!query.kind || work.kind === query.kind)
          && getContexts(work.id).some(context => context.number === query.number);
      });
      card.hidden = !eligible.length || !numberMatches || !query.tokens.every(token => haystack.includes(token));
      if (!card.hidden) count++;
      updateReferences(card);
      for (const link of card.querySelectorAll('[data-numbered-topic]')) topicLink(link, contexts);
      for (const link of card.querySelectorAll('[data-numbered-pack]')) link.hidden = !eligible
        .some(section => registry.works[section.dataset.workId].format === 'pdf');
    }
    const rank = card => {
      const contexts = [...card.querySelectorAll('[data-work-id]')].flatMap(item => getContexts(item.dataset.workId));
      return contexts.length ? Math.min(...contexts.map(item => item.grade * 10000 + item.number)) : Infinity;
    };
    catalog.append(...[...cards].sort((left, right) => rank(left) - rank(right)
      || cards.indexOf(left) - cards.indexOf(right)));
    document.getElementById('count').textContent = `Комплектов: ${count}. Номера работ показаны для выбранной подборки.`;
    document.getElementById('empty').hidden = count > 0;
    for (const link of document.querySelectorAll('[data-numbered-archive]')) {
      link.hidden = visibleWorks(link.dataset.numberedArchive).length === 0;
    }
    const navigation = document.querySelector('[data-numbered-topic-nav]');
    if (navigation) {
      let visible = 0;
      for (const link of navigation.querySelectorAll('[data-numbered-bank-id]')) {
        const contexts = getContexts(link.dataset.numberedBankId + ':sr');
        link.closest('li').hidden = contexts.length === 0;
        if (contexts.length) { topicLink(link, contexts); visible++; }
      }
      navigation.hidden = visible === 0;
    }
    const selected = activeCollections();
    const note = document.getElementById('numbering-note');
    note.textContent = selected.length === 1
      ? `${selected[0].title}. Самостоятельных: ${selected[0].sr.length}; контрольных: ${selected[0].kr.length}.`
      : 'Выберите класс и учебник: у каждой подборки свои постоянные номера. В общем списке показаны номера по классам.';
    updateContents();
    if (updateAddress) updateURL();
  }

  function restoreURL() {
    if (!isCatalog) return;
    const params = new URL(location.href).searchParams;
    const selectedGrade = params.get('grade') || params.get('class');
    if (/^[5-9]$|^1[01]$/u.test(selectedGrade || '')) grade.value = `${selectedGrade} класс`;
    const selectedBook = registry.books.find(item => item.id === params.get('book'));
    if (selectedBook) book.value = selectedBook.title;
    if (params.has('q')) search.value = params.get('q');
  }

  let busy = false;
  const status = document.getElementById('numbering-download-status');
  function say(text, error = false) {
    if (!status) return;
    status.hidden = false;
    status.textContent = text;
    status.dataset.error = String(error);
  }

  function visibleWorks(format, bankId) {
    return [...new Set(sections.filter(section => !section.hidden
      && !section.closest('.pack')?.hidden
      && (!bankId || registry.works[section.dataset.workId].bankId === bankId))
      .map(section => section.dataset.workId))]
      .map(id => registry.works[id]).filter(work => !format || work.format === format);
  }

  async function download(link) {
    if (busy) { say('Подождите, предыдущая загрузка ещё готовится.'); return; }
    busy = true;
    if (status) status.setAttribute('aria-busy', 'true');
    try {
      if (!window.MathExamNumberedDownloads) throw new Error('Модуль загрузки не загрузился. Обновите страницу и повторите.');
      const exporter = window.MathExamNumberedDownloads;
      const section = link.closest('[data-work-id]');
      if (link.dataset.numberedRole && section) {
        const work = registry.works[section.dataset.workId];
        const contexts = getContexts(work.id);
        if (!contexts.length) throw new Error('Для этой работы нет выбранной подборки.');
        say(`Готовлю ${names[work.kind].toLocaleLowerCase('ru')} ${contextText(contexts)}…`);
        await exporter.download(work, link.dataset.numberedRole, contexts);
      } else {
        const format = link.dataset.numberedArchive || 'pdf';
        const bankId = link.dataset.numberedPack || null;
        const works = visibleWorks(format, bankId);
        if (!works.length) throw new Error('В выбранной подборке нет работ этого формата. Измените фильтры.');
        const entries = works.flatMap(work => ['student', 'teacher'].map(role => ({ work, role, contexts: getContexts(work.id) })));
        if (format === 'docx') entries.push({ unchanged: true,
          url: '/pedagogam/raboty/rabota-nad-oshibkami.docx', filename: 'rabota-nad-oshibkami.docx' });
        const selected = selection();
        const suffix = selected.bookId || (selected.grade ? `${selected.grade}-klass` : 'vse-klassy');
        say(`Готовлю архив с номерами: ${entries.length} файлов…`);
        await exporter.archive(entries, `mathexam-${bankId || suffix}-${format}.zip`, (done, total) => {
          const current = typeof done === 'object' ? done.completed ?? done.done ?? done.current ?? 0 : done;
          const length = typeof done === 'object' ? done.total ?? entries.length : total ?? entries.length;
          say(`Готовлю архив с номерами: ${current} из ${length} файлов…`);
        });
      }
      say('Готово. Файл с номерами работ передан в загрузки браузера.');
    } catch (error) {
      say(`Не удалось подготовить файл с номером. ${error.message || 'Повторите загрузку.'}`, true);
    } finally {
      busy = false;
      if (status) status.setAttribute('aria-busy', 'false');
    }
  }

  document.addEventListener('click', event => {
    if (event.button !== 0) return;
    const action = event.target.closest('button[data-numbered-role],button[data-numbered-archive],button[data-numbered-pack]');
    if (action) {
      event.preventDefault();
      if (!action.disabled && !action.closest('[hidden]')) void download(action);
      return;
    }
    const link = event.target.closest('a[data-numbered-contents]');
    if (link) {
      if (isCatalog) { search.value = ''; refresh(); }
    }
  });

  if (isCatalog) {
    restoreURL();
    for (const element of [grade, book, search]) element.addEventListener('input', () => refresh());
    document.querySelector('.filters').addEventListener('reset', event => {
      event.preventDefault(); grade.value = ''; book.value = ''; search.value = ''; refresh();
    });
    addEventListener('popstate', () => { grade.value = ''; book.value = ''; search.value = ''; restoreURL(); refresh(false); });
  }
  refresh();
  window.MathExamTeacherNumbering = Object.freeze({ registry, getContexts, refresh });
  for (const action of document.querySelectorAll('button[data-numbered-role],button[data-numbered-archive],button[data-numbered-pack]')) {
    action.disabled = false;
  }
  if (status) { status.hidden = true; status.setAttribute('aria-busy', 'false'); }
  document.documentElement.dataset.workNumberingReady = 'true';
  } catch (error) {
    for (const action of document.querySelectorAll('[data-numbered-role],[data-numbered-archive],[data-numbered-pack]')) {
      action.disabled = true;
    }
    document.documentElement.dataset.workNumberingReady = 'false';
    const status = document.getElementById('numbering-download-status');
    if (status) {
      status.hidden = false;
      status.dataset.error = 'true';
      status.setAttribute('aria-busy', 'false');
      status.textContent = 'Скачивание с номерами пока недоступно. Проверьте соединение и обновите страницу.';
    }
  }
}());
