/* Native, source-mapped course view. The public entry has no authenticated API. */
(function (root) {
  'use strict';
  const COURSE = 'atanasyan-first-steps';
  const clone = value => JSON.parse(JSON.stringify(value));
  const partLabel = lesson => lesson.source.subpart ? String(lesson.source.subpart).replace(/[)\s]+$/g, '') : '';
  const shortName = lesson => lesson.kind === 'theory' ? 'Теория · ' + lesson.source.point
    : '№' + lesson.source.exercise + partLabel(lesson);
  function validateBundle(bundle) {
    if (!bundle || bundle.schemaVersion !== 1 || bundle.id !== COURSE || bundle.lessons?.length !== 255
      || bundle.sections?.length !== 12 || bundle.counters?.exerciseNumbers !== 160
      || !bundle.source?.sha256 || !bundle.catalog?.book) throw Error('INVALID_COURSE_BUNDLE');
    const ids = new Set();
    for (const lesson of bundle.lessons) {
      if (ids.has(lesson.id) || lesson.status !== 'reviewed' || !lesson.steps?.length
        || !lesson.visualization?.model?.views?.neutral) throw Error('INVALID_COURSE_CARD');
      ids.add(lesson.id);
    }
    const route = bundle.sections.flatMap(section => section.lessonIds);
    if (route.length !== ids.size || new Set(route).size !== ids.size || route.some(id => !ids.has(id))) throw Error('INVALID_COURSE_ROUTE');
    return bundle;
  }
  // The original validator and default storage namespace remain sealed. A
  // second reviewed source supplies a trusted code adapter, never URL options.
  const defaultDefinition = Object.freeze({
    id: COURSE, validateBundle, shortName, namespace: 'mathExamAtanasyanFirstSteps.v1', legacy: true,
    bundleUrl: '/learning/atanasyan-first-steps/course.json',
    sourceText: lesson => 'К учебнику Атанасяна · 7–9 классы · 2023 · стр. ' + lesson.source.printedPages.join(', ')
      + (lesson.kind === 'theory' ? ' · пункт ' + lesson.source.point : ' · задача ' + lesson.source.exercise + partLabel(lesson)),
    sourceLink: lesson => ({ href: 'https://mathexam.space/geometry-course/textbook/#' + lesson.id, title: 'Этот номер в общем курсе' }),
    filters: [['all', 'Все материалы'], ['tasks', 'Задачи учебника'], ['theory', 'Теория'], ['work', 'Мои записи']],
    matchesFilter: (lesson, filter) => filter !== 'tasks' && filter !== 'theory' || lesson.kind === (filter === 'tasks' ? 'exercise' : 'theory'),
    matchesSearch(lesson, query, section, statement) {
      const numbered = /^(\d+)\s*([а-яa-z])?$/.exec(query);
      return numbered ? lesson.kind === 'exercise' && lesson.source.exercise === numbered[1]
        && (!numbered[2] || partLabel(lesson).toLowerCase() === numbered[2])
        : (section.title + ' ' + lesson.title + ' ' + statement).toLocaleLowerCase('ru').replace(/ё/g, 'е').includes(query);
    },
    labels: () => ({
      eyebrow: 'КУРС К УЧЕБНИКУ · 7 КЛАСС', title: 'Геометрия: с начала до построений',
      intro: 'От точек и прямых — к равенству треугольников, циркулю и линейке. Выбирай номер из учебника или проходи разделы по порядку.',
      scope: '12 разделов · 160 номеров · 232 задания с подпунктами · теория 1–23',
      searchPlaceholder: 'Например: 92, 159б, окружность', sourceSummary: 'Номер и издание учебника',
      noResults: 'В этом курсе нет подходящих карточек. Здесь задачи №1–160 и теория 1–23.',
      boundary: 'Этот номер не входит в курс до элементарных построений. Выбери задачу №1–160.',
      end: 'Ты дошёл до конца курса: элементарные построения. Можно вернуться к нужному номеру.',
      exportTitle: 'Курс к учебнику Атанасяна: начало — элементарные построения',
      exportFormat: 'mathexam-atanasyan-first-steps-work', exportFilename: 'atanasyan-my-work',
      companionLabel: 'Самостоятельные и контрольные · Иченская', companionHref: '/geometry-course/ichenskaya-7-works/'
    })
  });
  function mountCourse(host, options, definition) {
    const doc = host.ownerDocument, win = doc.defaultView;
    let alive = true, bundle, labels, current = null, state = null, viewer = null, dialog = null, dialogViewer = null;
    const shortName = definition.shortName;
    let helperDispose = () => {}, currentSerial = 0, locked = false, rebuilding = false, store, lastSavePersisted = false;
    let routeSearch = '', routeFilter = 'all', pendingNotice = '', returnFocus = null;
    const readOnly = options.readOnly === true, lifetime = new AbortController();
    const valid = () => alive && host.isConnected && (!options.isCurrent || options.isCurrent());
    const byId = new Map();
    host.classList.add('atanasyan-first-steps');
    const notices = doc.createElement('div'), body = doc.createElement('div');
    notices.className = 'afs-notices'; notices.setAttribute('aria-live', 'polite');
    body.className = 'afs-body'; host.replaceChildren(notices, body);
    const math = root.StereoMath;
    function node(tag, text, attrs = {}) {
      const item = doc.createElement(tag);
      for (const [key, value] of Object.entries(attrs)) item.setAttribute(key, String(value));
      if (text !== undefined && text !== null) {
        if (math?.appendText) math.appendText(item, String(text)); else item.textContent = String(text);
      }
      return item;
    }
    function button(text, action, attrs = {}) {
      const item = node('button', text, { type: 'button', ...attrs });
      item.addEventListener('click', event => { if (valid()) action(event); }); return item;
    }
    function notice(text, kind = 'info') {
      if (!valid()) return;
      if (![...notices.children].some(item => item.dataset.kind === kind && item.textContent === text)) {
        const item = node('p', text, { 'data-kind': kind }); notices.append(item);
      }
      if (kind === 'conflict' || kind === 'invalid') lock();
    }
    function clearLesson() {
      currentSerial++; helperDispose(); helperDispose = () => {};
      closeTheory(); viewer?.destroy(); viewer = null; current = null; state = null; locked = false;
    }
    function displayStatement(lesson) { return bundle.displayOverrides?.[lesson.id]?.statementText || lesson.statement.text; }
    function sourceText(lesson) {
      return definition.sourceText(lesson, bundle);
    }
    function navigate(id) {
      if (options.onNavigate) options.onNavigate(id || null);
      else win.history?.replaceState(null, '', win.location.pathname + win.location.search + (id ? '#' + id : ''));
    }
    function sourceBox(lesson) {
      const details = node('details', undefined, { class: 'afs-source' });
      details.append(node('summary', labels.sourceSummary), node('p', sourceText(lesson)), node('p', bundle.book.edition));
      return details;
    }
    function statusText(record, lesson) {
      if (lesson.kind === 'theory') return record.read ? 'Прочитано' : record.revealed ? 'Начато' : 'Теория';
      if (record.submitted) return record.assisted ? 'Запись с помощью · обсудить с учителем' : 'Есть решение · обсудить с учителем';
      if (record.draft || Object.values(record.stepDrafts).some(Boolean)) return record.assisted ? 'Есть запись · с помощью' : 'Есть запись';
      return record.assisted || record.revealed ? 'Разбираем по шагам' : 'Можно начать';
    }
    function updateStatus() {
      if (!current || !state) return;
      const label = body.querySelector('[data-work-status]');
      if (label) label.textContent = statusText(state, current);
      const mark = body.querySelector('[data-assistance-status]');
      if (mark) mark.textContent = state.assisted ? 'В этой работе использована помощь. Эта отметка сохранится после закрытия подсказки.'
        : 'Подсказки пока не открывались. Доказательство всё равно нужно обсудить с учителем.';
    }
    function save() {
      lastSavePersisted = false;
      if (!valid() || !current || !state || locked) return false;
      if (readOnly) return true; // Preview changes live only in this mounted view.
      state.model.maxStep = state.revealed;
      const result = store.write(current, state);
      lastSavePersisted = result.saved === true;
      state.updatedAt = store.read(current).updatedAt;
      updateStatus();
      if (result.conflict) { lock(); return false; }
      return !result.readOnly;
    }
    function markAssisted() {
      if (!valid() || locked || !current) return false;
      state.assisted = true; return save();
    }
    function lock() {
      // A malformed saved record may be detected before the new lesson DOM is
      // mounted. Reapply the lock and recovery controls after that mount.
      if (!current) return;
      locked = true; helperDispose(); helperDispose = () => {};
      for (const field of body.querySelectorAll('textarea,input')) field.readOnly = true;
      for (const control of body.querySelectorAll('[data-mutation]')) control.disabled = true;
      if (!body.querySelector('[data-reload-record]')) {
        const section = node('section', undefined, { class: 'afs-conflict' });
        section.append(node('p', 'Сначала скачай или скопируй свои записи. Открытие сохранённой версии заменит только показанный сейчас текст.'),
          button('Скачать мои записи', exportWork),
          button('Открыть сохранённую версию', () => { const id = current.id; store.reload(current); openLesson(id); }, { 'data-reload-record': '' }));
        body.prepend(section);
      }
    }
    function download(value, filename, type) {
      const blob = new win.Blob([value], { type });
      if (typeof win.URL?.createObjectURL !== 'function') {
        const area = node('textarea', undefined, { readonly: '', rows: 8, 'aria-label': 'Записи для копирования' });
        area.value = value; notices.append(area); area.focus(); area.select();
        notice('Автоматическое скачивание недоступно. Скопируй записи из поля выше.', 'download'); return;
      }
      const url = win.URL.createObjectURL(blob), link = node('a', 'Скачать', { href: url, download: filename });
      doc.body.append(link); link.click(); link.remove(); win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
    }
    function exportWork() {
      if (!bundle || readOnly) return;
      const records = store.all(bundle.lessons);
      if (current && state) {
        const index = records.findIndex(record => record.lessonId === current.id);
        if (index >= 0) records[index] = clone(state); else if (state.draft || state.revealed) records.push(clone(state));
      }
      download(JSON.stringify({ format: labels.exportFormat, version: 1,
        exportedAt: new Date().toISOString(), sourceSha256: bundle.source.sha256,
        note: 'Личные записи. Доказательства не проверены автоматически.', records }, null, 2), labels.exportFilename + '.json', 'application/json');
    }
    function exportText() {
      if (!bundle || readOnly) return;
      const lines = [labels.exportTitle, 'Личные записи; доказательства требуют проверки учителя.', ''];
      for (const record of store.all(bundle.lessons)) {
        const lesson = byId.get(record.lessonId);
        lines.push(shortName(lesson) + ' · стр. ' + lesson.source.printedPages.join(', '), statusText(record, lesson));
        if (record.draft) lines.push('Моё решение: ' + record.draft);
        for (const step of lesson.steps) if (record.stepDrafts[step.id]) lines.push(step.title + ': ' + record.stepDrafts[step.id]);
        lines.push('');
      }
      download(lines.join('\n'), labels.exportFilename + '.txt', 'text/plain;charset=utf-8');
    }
    function workTools() {
      if (readOnly) return node('p', 'Просмотр преподавателя: личные записи ученика на этом устройстве не открываются.', { class: 'afs-storage-note' });
      const details = node('details', undefined, { class: 'afs-work-tools' });
      details.append(node('summary', 'Мои записи и сохранение'), node('p', options.role === 'public'
        ? 'Записи публичного курса сохраняются в этом браузере. Работа внутри кабинета хранится отдельно; учителю она не передаётся автоматически.'
        : 'Записи этого курса сохраняются в этом браузере отдельно для текущего кабинета. Они не передаются учителю автоматически.'),
        button('Скачать записи для учителя', exportText), button('Скачать резервную копию', exportWork));
      return details;
    }
    function home() {
      if (!valid() || !bundle) return;
      clearLesson(); body.replaceChildren(); navigate(null);
      const header = node('header', undefined, { class: 'afs-header' });
      header.append(node('p', labels.eyebrow, { class: 'afs-eyebrow' }), node('h1', labels.title),
        node('p', labels.intro), node('p', labels.scope, { class: 'afs-scope' }));
      if (labels.boundaryNote) header.append(node('p', labels.boundaryNote, { class: 'afs-scope', 'data-course-boundary': '' }));
      if (options.onExit) header.append(button('← В кабинет', options.onExit));
      const last = store.last(bundle.lessons), continueTo = last ? byId.get(last) : bundle.lessons[0];
      header.append(button(last ? 'Продолжить: ' + shortName(continueTo) : 'Начать с первой темы', () => openLesson(continueTo.id), { class: 'afs-primary', 'data-continue': '' }));
      if (options.onCompanion) header.append(button(labels.companionLabel, options.onCompanion, { 'data-companion-course': '' }));
      else if (labels.companionHref) {
        const link = node('p'); link.append(node('a', labels.companionLabel + ' →', { href: labels.companionHref, 'data-companion-course': '' })); header.append(link);
      }
      const progress = store.all(bundle.lessons), submitted = progress.filter(record => record.submitted).length;
      if (progress.length) header.append(node('p', 'Есть записи: ' + progress.length + '. Решений для обсуждения с учителем: ' + submitted + '.', { 'data-course-progress': '' }));
      body.append(header, workTools());
      const controls = node('div', undefined, { class: 'afs-filters' }), searchLabel = node('label', 'Найти задачу или тему');
      const search = node('input', undefined, { type: 'search', placeholder: labels.searchPlaceholder, 'data-course-search': '' });
      search.value = routeSearch; searchLabel.append(search); controls.append(searchLabel);
      const filterLabel = node('label', 'Показать'), filter = node('select', undefined, { 'data-course-filter': '' });
      for (const [value, title] of definition.filters) filter.append(node('option', title, { value }));
      filter.value = routeFilter; filterLabel.append(filter); controls.append(filterLabel);
      const route = node('div', undefined, { class: 'afs-route', 'aria-live': 'polite' }); body.append(controls, route);
      function drawRoute() {
        route.replaceChildren(); let found = 0;
        const query = routeSearch.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/^№\s*/, '');
        for (const [sectionIndex, section] of bundle.sections.entries()) {
          const entries = section.lessonIds.map(id => byId.get(id)).filter(lesson => {
            const record = store.read(lesson);
            if (!definition.matchesFilter(lesson, routeFilter)
              || routeFilter === 'work' && !record.updatedAt && !record.draft && !record.revealed) return false;
            if (!query) return true;
            return definition.matchesSearch(lesson, query, section, displayStatement(lesson));
          });
          if (!entries.length) continue;
          found += entries.length;
          const sectionNode = node('details', undefined, { class: 'afs-route-section', 'data-route-section': section.id });
          sectionNode.open = !!query || routeFilter !== 'all' || sectionIndex === 0;
          const summary = node('summary'); summary.append(node('span', String(sectionIndex + 1).padStart(2, '0'), { class: 'afs-section-number' }), node('span', section.title));
          sectionNode.append(summary, node('p', 'Страницы ' + section.printedPages.join('–') + ' · ' + entries.length + ' карточек', { class: 'afs-section-meta' }));
          if (definition.sectionNote) sectionNode.append(node('p', definition.sectionNote(section), { class: 'afs-section-meta', 'data-section-boundary': '' }));
          const cards = node('div', undefined, { class: 'afs-card-grid' });
          for (const lesson of entries) {
            const record = store.read(lesson), card = button('', () => openLesson(lesson.id), { class: 'afs-route-card', 'data-lesson-id': lesson.id });
            card.append(node('strong', shortName(lesson)), node('span', lesson.kind === 'theory' ? lesson.title.replace(/^Теория\s*\d*[.·:]?\s*/, '') : statusText(record, lesson)));
            card.dataset.started = String(!!(record.updatedAt || record.revealed || record.draft)); cards.append(card);
          }
          sectionNode.append(cards); route.append(sectionNode);
        }
        if (!found) route.append(node('p', labels.noResults));
      }
      search.addEventListener('input', () => { routeSearch = search.value; drawRoute(); });
      filter.addEventListener('change', () => { routeFilter = filter.value; drawRoute(); }); drawRoute();
    }
    function closeTheory() {
      dialogViewer?.destroy(); dialogViewer = null;
      if (dialog) { if (dialog.open && typeof dialog.close === 'function') dialog.close(); dialog.remove(); dialog = null; }
      returnFocus?.focus(); returnFocus = null;
    }
    function openTheory(id, from) {
      const theory = byId.get(id); if (!theory || theory.kind !== 'theory' || !markAssisted()) return;
      closeTheory(); returnFocus = from;
      dialog = node('dialog', undefined, { class: 'afs-theory-dialog', 'aria-labelledby': 'afs-theory-title' });
      const model = node('div', undefined, { class: 'afs-model' });
      dialog.append(button('Вернуться к задаче', closeTheory), node('h2', theory.title, { id: 'afs-theory-title' }),
        node('p', displayStatement(theory)), model, sourceBox(theory));
      for (const step of theory.steps) {
        const detail = node('details'); detail.append(node('summary', step.prompt || step.title), node('p', step.explanation));
        for (const reason of step.justifications) detail.append(node('p', reason.text, { class: 'afs-reason' }));
        detail.addEventListener('toggle', () => { if (detail.open) dialogViewer?.setView(step.view || 'neutral'); }); dialog.append(detail);
      }
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeTheory(); }); host.append(dialog);
      dialogViewer = root.PlanarViewer.mount(model, theory.visualization.model, { maxStep: theory.steps.length });
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      dialog.querySelector('button').focus();
    }
    function openLesson(id) {
      if (!valid() || !bundle) return;
      const lesson = byId.get(id);
      if (!lesson) { notice(labels.boundary, 'boundary'); home(); return; }
      clearLesson(); current = lesson; state = store.read(lesson); const serial = currentSerial;
      let helperStep = Math.max(0, state.revealed - 1);
      body.replaceChildren(); store.remember(lesson); navigate(id);
      const header = node('header', undefined, { class: 'afs-task-header' });
      header.append(button('← Все разделы курса', home), node('p', sourceText(lesson), { class: 'afs-eyebrow' }),
        node('h1', lesson.kind === 'theory' ? lesson.title : 'Тренажёр к задаче ' + shortName(lesson)),
        node('p', statusText(state, lesson), { class: 'afs-work-status', 'data-work-status': '' }));
      if (definition.lessonNote) header.append(node('p', definition.lessonNote(lesson), { class: 'afs-small', 'data-lesson-boundary': '' }));
      body.append(header);
      const layout = node('div', undefined, { class: 'afs-task-layout' }), task = node('section', undefined, { class: 'afs-task-card' }),
        side = node('section', undefined, { class: 'afs-work-card', 'aria-label': 'Мои записи и помощь' }), model = node('div', undefined, { class: 'afs-model', 'data-course-model': '' });
      task.append(node('h2', lesson.kind === 'theory' ? 'Разбираемся в теме' : 'Условие целиком'),
        node('p', displayStatement(lesson), { class: 'afs-condition', 'data-full-condition': '' }));
      if (lesson.statement.givens?.length) { const list = node('ul'); for (const given of lesson.statement.givens) list.append(node('li', given)); task.append(list); }
      if (lesson.statement.goal && !/Сначала предложи своё решение/.test(lesson.statement.goal)) task.append(node('p', lesson.statement.goal, { class: 'afs-goal' }));
      task.append(model, node('p', 'Чертёж помогает увидеть условие. Размеры на экране не заменяют данные и доказательство.', { class: 'afs-model-note' }), sourceBox(lesson));
      const sourceLink = definition.sourceLink?.(lesson, bundle);
      if (sourceLink) task.append(node('a', sourceLink.title, { href: sourceLink.href, target: '_blank', rel: 'noopener noreferrer', class: 'afs-original-link' }));
      layout.append(task, side); body.append(layout);
      const work = node('div', undefined, { class: 'afs-written-work' });
      if (lesson.kind === 'exercise') {
        const label = node('label', 'Моё решение и объяснение', { for: 'afs-answer' }), answer = node('textarea', undefined,
          { id: 'afs-answer', rows: 5, maxlength: 8000, 'data-final-answer': '' });
        answer.value = state.draft; answer.readOnly = readOnly;
        answer.addEventListener('input', () => { if (!readOnly && !locked) { state.draft = answer.value; state.submitted = false; save(); } });
        label.append(answer); work.append(node('h2', 'Сначала попробуй сам'), label,
          node('p', 'Запиши, что известно, что нужно найти или доказать, и почему каждый шаг верен.', { class: 'afs-small' }));
        const feedback = node('p', '', { role: 'status', 'data-save-status': '' });
        const saveButton = button('Сохранить решение', () => {
          if (readOnly || locked) return;
          state.draft = answer.value;
          if (!state.draft.trim()) { feedback.textContent = 'Сначала запиши хотя бы первый шаг решения.'; answer.focus(); return; }
          state.submitted = true;
          if (save()) feedback.textContent = lastSavePersisted
            ? 'Запись сохранена на этом устройстве. Правильность доказательства нужно обсудить с учителем.'
            : 'Запись остаётся только в открытой странице. Скачай её перед закрытием. Правильность доказательства нужно обсудить с учителем.';
        }, { class: 'afs-primary', 'data-mutation': '', 'data-save-work': '' });
        saveButton.disabled = readOnly; work.append(saveButton, feedback);
      } else {
        work.append(node('h2', 'Изучи правило и чертёж'), node('p', 'В разборе ниже можно увидеть, как применяется это правило.'));
        const read = button('Я прочитал этот пункт', () => { state.read = true; save(); updateStatus(); }, { class: 'afs-primary', 'data-mutation': '', 'data-read-theory': '' });
        read.disabled = readOnly; work.append(read);
      }
      side.append(work);
      const help = node('details', undefined, { class: 'afs-guided', 'data-guided-help': '' }), summary = node('summary', 'Хочешь подсказку?');
      const stepsHost = node('div', undefined, { 'data-guided-steps': '' }), next = button('Показать первый шаг', revealNext, { class: 'afs-primary', 'data-next-step': '', 'data-mutation': '' });
      help.append(summary, node('p', 'Сделай маленький шаг сам. Если трудно — открой объяснение. Предыдущие шаги останутся видны.'), stepsHost, next);
      summary.addEventListener('click', event => { if (!help.open && !markAssisted()) event.preventDefault(); });
      help.addEventListener('toggle', () => { if (valid() && help.isConnected && help.open && !rebuilding) markAssisted(); });
      side.append(help, node('p', '', { class: 'afs-assistance-status', 'data-assistance-status': '' }));
      function showSteps() {
        rebuilding = true; stepsHost.replaceChildren();
        for (let index = 0; index < state.revealed; index++) {
          const step = lesson.steps[index], card = node('article', undefined, { class: 'afs-step', 'data-step-index': index });
          card.append(node('h3', 'Шаг ' + (index + 1)), node('p', step.prompt, { class: 'afs-step-question' }));
          const label = node('label', 'Мой шаг', { for: 'afs-step-' + index }), input = node('textarea', undefined,
            { id: 'afs-step-' + index, rows: 2, maxlength: 2000, 'data-step-draft': step.id });
          input.value = state.stepDrafts[step.id] || ''; input.readOnly = readOnly || locked;
          input.addEventListener('input', () => { if (!readOnly && !locked) { state.stepDrafts[step.id] = input.value; state.submitted = false; save(); } });
          label.append(input); card.append(label);
          const explain = node('details', undefined, { 'data-step-explanation': index });
          explain.append(node('summary', 'Объясни этот шаг'), node('p', step.explanation)); explain.open = state.explained.includes(index);
          const why = node('details', undefined, { 'data-step-reason': index }); why.append(node('summary', 'Почему это верно?')); why.open = state.justified.includes(index);
          for (const reason of step.justifications) {
            why.append(node('p', reason.text));
            if (reason.theoryId && byId.has(reason.theoryId)) why.append(button('Вспомнить правило', event => openTheory(reason.theoryId, event.currentTarget)));
          }
          for (const [detail, field] of [[explain, 'explained'], [why, 'justified']]) {
            detail.querySelector('summary').addEventListener('click', event => { if (!detail.open && !markAssisted()) event.preventDefault(); });
            detail.addEventListener('toggle', () => {
              if (!detail.isConnected || rebuilding || !valid() || locked || current?.id !== id) return;
              if (detail.open && !markAssisted()) return;
              state[field] = detail.open ? [...new Set([...state[field], index])].sort((a, b) => a - b) : state[field].filter(n => n !== index);
              save();
            });
          }
          card.append(explain, why, button('Показать на чертеже', () => {
            if (markAssisted()) {
              helperStep = index; viewer?.setView(step.view || 'neutral'); helperDispose.refresh?.();
            }
          }, { 'data-mutation': '' }));
          stepsHost.append(card);
        }
        next.hidden = state.revealed >= lesson.steps.length;
        next.textContent = state.revealed ? 'Следующий шаг' : 'Показать первый шаг';
        if (state.revealed >= lesson.steps.length) {
          const result = lesson.help.find(item => item.id === 'compare-result');
          if (result) {
            const compare = node('details', undefined, { 'data-compare-result': '' });
            compare.append(node('summary', 'Сверить итог с разбором'), node('p', result.text)); compare.open = state.compared;
            compare.querySelector('summary').addEventListener('click', event => {
              if (!compare.open) { if (!markAssisted()) { event.preventDefault(); return; } state.compared = true; save(); }
            }); stepsHost.append(compare);
          }
          stepsHost.append(node('p', 'Все шаги разобраны. Запиши своё решение выше и обсуди обоснование с учителем.', { class: 'afs-small' }));
        }
        rebuilding = false;
      }
      function revealNext() {
        if (locked || !markAssisted() || state.revealed >= lesson.steps.length) return;
        state.revealed++; state.model.maxStep = state.revealed;
        if (!save()) return; help.open = true; showSteps();
        helperStep = state.revealed - 1; helperDispose.refresh?.();
        viewer?.setView(lesson.steps[state.revealed - 1].view || 'neutral');
      }
      showSteps(); if (state.revealed) help.open = true;
      const refs = [...new Set(lesson.help.flatMap(item => item.theoryIds || []))].filter(ref => byId.has(ref));
      if (refs.length) {
        const rules = node('details', undefined, { class: 'afs-rules' }); rules.append(node('summary', 'Какое правило пригодится?'));
        for (const ref of refs) rules.append(button(byId.get(ref).title, event => openTheory(ref, event.currentTarget)));
        side.append(rules);
      }
      const helper = node('details', undefined, { class: 'afs-helper', 'data-course-assistant': '' });
      helper.append(node('summary', 'Помощник MaxExam 0.0'));
      const helperHost = node('div', undefined, { 'data-course-assistant-host': '' }); helper.append(helperHost); side.append(helper);
      if (options.api && options.role === 'student' && root.LearningAssistant && !readOnly) {
        let connected = false;
        helper.addEventListener('toggle', () => {
          if (!helper.open || connected || !valid() || locked) return;
          connected = true;
          helperDispose = root.LearningAssistant.mount(helperHost, {
            api: options.api, role: 'student',
            isCurrent: () => valid() && serial === currentSerial && current?.id === id,
            canAsk: () => !locked && !readOnly && (!options.canAsk || options.canAsk()),
            courseContext: () => ({ courseId: definition.id, lessonId: id, stepIndex: helperStep }),
            courseTaskLabel: shortName(lesson), courseTaskPrompt: displayStatement(lesson),
            onBeforeAsk: () => !readOnly && markAssisted(), onAnswer: updateStatus
          });
        });
      } else {
        helperHost.append(node('p', readOnly ? 'Это просмотр преподавателя. Личные обращения к помощнику здесь не отправляются.'
          : 'Здесь работают подсказки из проверенного разбора. Помощник кабинета видит текущий номер и шаг, когда курс открыт внутри твоего кабинета.'),
          button('Разобрать текущую задачу по шагам', () => { if (!markAssisted()) return; help.open = true; if (!state.revealed) revealNext(); help.scrollIntoView?.({ block: 'nearest' }); }));
      }
      side.append(workTools());
      if (!readOnly && definition.legacy) {
        const legacyBox = node('details', undefined, { class: 'afs-legacy' });
        legacyBox.append(node('summary', 'Раньше решал этот номер в общем курсе?'), node('p', 'По твоей команде можно перенести прежнюю запись из общего курса в этом браузере. Убедись, что это твоя работа. Исходная запись останется на месте.'));
        legacyBox.append(button('Перенести мою прежнюю запись', () => {
          if (locked) return;
          if (state.draft || state.revealed || Object.values(state.stepDrafts).some(Boolean) || state.submitted) {
            notice('В этом задании уже есть записи. Скачай их; перенос не будет заменять начатую работу.', 'import'); return;
          }
          const previous = store.legacy(lesson, bundle.book.id);
          if (!previous) { notice('Для этого номера нет прежней записи в данном браузере.', 'import'); return; }
          state = previous; if (save()) openLesson(id);
        }, { 'data-mutation': '', 'data-import-legacy': '' })); side.append(legacyBox);
      }
      viewer = root.PlanarViewer.mount(model, lesson.visualization.model, {
        maxStep: state.revealed, savedCamera: state.model,
        onChange: value => {
          if (!valid() || serial !== currentSerial || locked || !state) return;
          state.model = { viewId: value.viewId, zoom: value.zoom, maxStep: state.revealed }; save();
          const shownStep = /^step-(\d+)$/.exec(value.viewId);
          if (shownStep) { helperStep = Number(shownStep[1]) - 1; helperDispose.refresh?.(); }
        }
      });
      updateStatus();
      const index = bundle.lessons.findIndex(item => item.id === id), nav = node('nav', undefined, { class: 'afs-lesson-nav', 'aria-label': 'Порядок курса' });
      if (index > 0) nav.append(button('← ' + shortName(bundle.lessons[index - 1]), () => openLesson(bundle.lessons[index - 1].id)));
      nav.append(button('Все разделы', home));
      if (index < bundle.lessons.length - 1) nav.append(button(shortName(bundle.lessons[index + 1]) + ' →', () => openLesson(bundle.lessons[index + 1].id)));
      else nav.append(node('p', labels.end));
      body.append(nav);
      if (store.hasConflict(lesson)) lock();
      if (pendingNotice) { notice(pendingNotice); pendingNotice = ''; }
    }
    function storageEvent(event) {
      if (current && event.key === store.keyFor(current) && store.hasConflict(current)) {
        notice('Запись этого задания изменена в другом окне. Текущий текст остаётся доступен для копирования.', 'conflict');
      }
    }
    function start(data) {
      if (!valid()) return;
      bundle = definition.validateBundle(data); labels = definition.labels(bundle);
      for (const lesson of bundle.lessons) byId.set(lesson.id, lesson);
      let storage = options.storage;
      if (storage === undefined && !readOnly) { try { storage = win.localStorage; } catch (_) { storage = null; } }
      store = root.AtanasyanFirstStepsState.createStore({ storage, scope: options.storageScope || 'public', namespace: definition.namespace, readOnly, onNotice: notice });
      win.addEventListener('storage', storageEvent);
      if (options.initialLessonId) openLesson(options.initialLessonId); else home();
    }
    body.append(node('p', 'Открываем курс к учебнику…', { role: 'status' }));
    if (options.bundle) {
      try { start(options.bundle); } catch (_) { body.replaceChildren(node('p', 'Не удалось открыть материалы курса. Обнови страницу.')); }
    } else {
      (options.fetch || win.fetch.bind(win))(options.bundleUrl || definition.bundleUrl,
        { credentials: 'same-origin', cache: 'no-cache', signal: lifetime.signal })
        .then(response => { if (!response.ok) throw Error('COURSE_UNAVAILABLE'); return response.json(); })
        .then(start).catch(() => {
          if (valid()) body.replaceChildren(node('p', 'Не удалось открыть материалы курса. Твои сохранённые записи остаются на устройстве.'),
            button('Попробовать ещё раз', () => win.location.reload()));
        });
    }
    return function destroy() {
      if (!alive) return;
      alive = false; lifetime.abort(); clearLesson(); win.removeEventListener('storage', storageEvent);
      host.replaceChildren(); host.classList.remove('atanasyan-first-steps');
    };
  }
  function mount(host, options = {}) { return mountCourse(host, options, defaultDefinition); }
  root.AtanasyanFirstSteps = Object.freeze({ mount, validateBundle, shortName });
  root.LearningGeometryCourseRuntime = Object.freeze({
    createRenderer(definition) {
      if (!definition || definition.id !== 'ichenskaya-grade7-works' || definition.namespace !== 'mathExamIchenskayaGrade7Works.v1'
        || ['validateBundle', 'shortName', 'sourceText', 'matchesFilter', 'matchesSearch', 'labels'].some(key => typeof definition[key] !== 'function')) throw Error('INVALID_COURSE_ADAPTER');
      return Object.freeze({ mount: (host, options = {}) => mountCourse(host, options, definition), validateBundle: definition.validateBundle, shortName: definition.shortName });
    }
  });
})(typeof window === 'undefined' ? globalThis : window);
