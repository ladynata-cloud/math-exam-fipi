(function (root) {
  'use strict';

  const { lessons, links } = root.EgeMethodCourse;
  const S = root.EgeMethodState;
  const main = document.getElementById('main');
  const warning = document.getElementById('save-warning');
  const embedded = root.parent !== root;
  const isChoice = input => input.tagName === 'SELECT';
  const esc = value => String(value).replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const display = number => String(number).replace(/^-/, '−');
  const href = (page, id) => '#' + page + (id ? '/' + id : '');
  const courseLink = (page, id, label, style = '') =>
    `<a class="${style}" href="${href(page, id)}" data-course-nav>${label}</a>`;
  const title = 'Оценка плюс пример';
  let view = S.route(location.hash);
  let generation = 0;
  let records = {};
  let bridge;
  let storage;

  if (!embedded) {
    try { storage = root.localStorage; } catch { /* The store reports a failure on save. */ }
  } else {
    document.body.classList.add('embedded');
    document.querySelector('.brand').removeAttribute('href');
    document.querySelector('.header-inner a[href="#progress"]').textContent = 'Ход работы';
  }

  const progress = S.createProgress(storage, root.navigator.locks, () => {
    warning.textContent = 'Часть работы не удалось сохранить в браузере. Введённые данные доступны в этой вкладке.';
    warning.hidden = false;
  });

  function recordFor(lesson) {
    return embedded ? (records[lesson.id] || S.empty(lesson)) : progress.read(lesson);
  }

  async function change(lesson, edit, updateView) {
    const revision = generation;
    let record;
    if (embedded) {
      record = recordFor(lesson);
      edit(record);
      records[lesson.id] = record;
      bridge?.notifyStateChanged();
    } else {
      record = await progress.update(lesson, edit);
    }
    if (generation === revision) updateView?.(record);
  }

  function totals() {
    const entries = lessons.map(lesson => ({ lesson, record: recordFor(lesson) }));
    return {
      entries,
      guided: entries.filter(({ lesson, record }) => record.guide.solved.length === lesson.steps.length).length,
      checked: entries.filter(({ record }) => record.practice.done).length
    };
  }

  function progressBar({ guided, checked }) {
    return `<div class="meters">
      <label for="guided-progress">Уроки по шагам <strong>${guided} из ${lessons.length}</strong></label>
      <progress id="guided-progress" value="${guided}" max="${lessons.length}"></progress>
      <label for="practice-progress">Самопроверки <strong>${checked} из ${lessons.length}</strong></label>
      <progress id="practice-progress" value="${checked}" max="${lessons.length}"></progress>
    </div>`;
  }

  function examinerLinks(items) {
    if (embedded || !items.length) return '';
    return `<section class="transfer" aria-labelledby="transfer-title"><h2 id="transfer-title">Применить на ЕГЭ</h2>
      <ul>${items.map(item => `<li><a href="${item.href}">${esc(item.title)}</a></li>`).join('')}</ul></section>`;
  }

  function map() {
    const summary = totals();
    const openPractice = summary.entries.find(({ record: { practice } }) =>
      !practice.done && (practice.attempts || practice.proof || practice.drafts.some(Boolean)));
    const openLesson = summary.entries.find(({ lesson, record: { guide } }) =>
      guide.solved.length < lesson.steps.length && (guide.solved.length || guide.draft || guide.misses));
    const next = openPractice || openLesson || summary.entries.find(({ lesson, record }) =>
      !record.practice.done || record.guide.solved.length < lesson.steps.length);
    const go = next && (openPractice === next || next.record.guide.solved.length === next.lesson.steps.length ? 'practice' : 'lesson');
    const started = summary.guided > 0 || summary.checked > 0 || Boolean(openPractice || openLesson);
    const practiceEntry = href('practice', 'maximum');
    const showPracticeEntry = !embedded && (!next || href(go, next.lesson.id) !== practiceEntry);
    main.innerHTML = `<section class="hero" aria-labelledby="course-title">
      <div><p class="eyebrow">ЕГЭ · профиль №20 и база №21</p><h1 id="course-title">${title}</h1>
        <p class="lead">Находи границы, отбирай целые значения и строй примеры. Затем проверь себя на новом условии.</p>
        <div class="actions">${next ? courseLink(go, next.lesson.id, started ? 'Продолжить' : 'Начать с оценок', 'button primary') : courseLink('progress', null, 'Посмотреть прогресс', 'button primary')}
        ${showPracticeEntry ? courseLink('practice', 'maximum', 'Самопроверка по максимуму', 'button secondary') : ''}
        ${embedded ? '' : '<a class="button secondary" href="/trainers/trainer-board.html?trainer=ege-methods.html">Открыть на общей доске</a>'}</div>
      </div><aside class="progress-panel"><h2>${embedded ? 'Ход работы на доске' : 'Мой прогресс'}</h2>${progressBar(summary)}</aside>
    </section>
    <section aria-labelledby="route-title"><h2 id="route-title">Учебный маршрут</h2><ol class="lesson-list">
      ${summary.entries.map(({ lesson, record }, index) => `<li class="lesson-card">
        <span class="lesson-number" aria-hidden="true">${index + 1}</span>
        <div><h3>${courseLink('lesson', lesson.id, esc(lesson.title))}</h3><p>${esc(lesson.goal)}</p>
        ${record.guide.solved.length === lesson.steps.length ? '<span class="completion">Урок пройден</span>' :
          record.guide.solved.length ? `<span class="completion">${record.guide.solved.length} из ${lesson.steps.length} шагов</span>` : ''}
        ${record.practice.done ? '<span class="completion">Самопроверка пройдена</span>' : ''}</div>
      </li>`).join('')}
    </ol></section>${examinerLinks([links.extremum, links.whole])}`;
  }

  function progressView() {
    const summary = totals();
    main.innerHTML = `${courseLink('map', null, '← Все уроки', 'back')}
      <h1>${embedded ? 'Ход работы на доске' : 'Мой прогресс'}</h1>
      <p class="lead">${embedded ? 'На доске отображается ход работы в текущей комнате.' : 'Работа сохраняется в этом браузере. Самопроверка засчитывается после верных ответов на отдельную задачу.'}</p>
      <section class="panel">${progressBar(summary)}</section>
      <ol class="progress-list">${summary.entries.map(({ lesson, record }) => `<li>
        <div><h2>${courseLink('lesson', lesson.id, esc(lesson.title))}</h2>
        <p>${record.guide.solved.length} из ${lesson.steps.length} шагов · ${record.practice.done ? 'самопроверка пройдена' : 'самопроверка впереди'}
        ${record.practice.attempts ? ` · попыток: ${record.practice.attempts}` : ''}</p></div>
        ${courseLink('practice', lesson.id, record.practice.done ? 'Открыть работу' : 'К самопроверке', 'button secondary')}
      </li>`).join('')}</ol>`;
  }

  function fieldMarkup(field, value, index) {
    const id = 'answer-' + index;
    if (field.kind === 'choice') {
      return `<label class="field" for="${id}"><span>${esc(field.label)}</span>
        <select id="${id}" name="${id}" data-answer="${index}">
          <option value="">Выбери ответ</option>
          ${field.options.map(([key, label]) => `<option value="${key}"${key === value ? ' selected' : ''}>${esc(label)}</option>`).join('')}
        </select></label>`;
    }
    return `<label class="field" for="${id}"><span>${esc(field.label)}</span>
      <input id="${id}" name="${id}" data-answer="${index}" type="text" maxlength="${S.inputLimit}"
        autocomplete="off" spellcheck="false" value="${esc(value)}"></label>`;
  }

  const formatMessage = field => field.kind === 'list' ?
    'Введи целые числа через точку с запятой.' : 'Введи целое число.';
  function message(step, record) {
    switch (record.feedback) {
      case 'missing': return 'Введи ответ или выбери вариант.';
      case 'format': return formatMessage(step.field);
      case 'wrong': return step.error || 'Проверь вычисление и ещё раз сверься с условием.';
      default: return '';
    }
  }

  function model(lesson) {
    if (!lesson.model) return '';
    if (lesson.model === 'packs') {
      return `<figure class="model" aria-labelledby="model-title"><figcaption id="model-title">Собери набор</figcaption>
        <p>Нажми на пакет, чтобы поменять 2 наклейки на 3 или обратно.</p>
        <div class="packs">${Array.from({ length: 5 }, (_, i) =>
          `<button type="button" data-model="${i}" aria-pressed="false"><span class="pack-count"></span><span class="dots" aria-hidden="true"></span></button>`).join('')}</div>
        <output id="model-output" aria-live="polite"></output></figure>`;
    }
    const intersection = lesson.model === 'intersection';
    const low = intersection ? 3 : -3;
    const count = intersection ? 10 : 7;
    const ranges = intersection ? `<div class="range-labels"><span>Первая команда</span><span>Условие для второй команды</span></div>
      <div class="intersection-tracks" aria-hidden="true"><i></i><i></i></div>` :
      `<p>−2 &lt; n ≤ 2,5. Нажми на целое деление, чтобы его проверить.</p>
      <div class="axis" aria-hidden="true"><i></i></div>`;
    return `<figure class="model" aria-labelledby="model-title"><figcaption id="model-title">${intersection ? 'Где отрезки пересекаются' : 'Проверь число на прямой'}</figcaption>
      ${ranges}<div class="ticks ${intersection ? 'ten' : ''}">${Array.from({ length: count }, (_, i) => {
        const number = low + i;
        return `<button type="button" data-model="${number}" aria-label="Проверить ${intersection ? 'x' : 'n'} = ${display(number)}" aria-pressed="false">${display(number)}</button>`;
      }).join('')}</div><output id="model-output" aria-live="polite"></output></figure>`;
  }

  function updateModel(lesson, value) {
    if (!lesson.model) return;
    const output = document.getElementById('model-output');
    for (const button of main.querySelectorAll('[data-model]')) {
      const number = Number(button.dataset.model);
      if (lesson.model === 'packs') {
        const larger = !!(value & (1 << number));
        const size = larger ? 3 : 2;
        button.setAttribute('aria-pressed', String(larger));
        button.setAttribute('aria-label', 'Пакет ' + (number + 1) + ', ' + size + ' наклейки');
        button.querySelector('.pack-count').textContent = size;
        button.querySelector('.dots').textContent = '●'.repeat(size);
      } else {
        button.setAttribute('aria-pressed', String(value === number));
      }
    }
    if (lesson.model === 'packs') {
      const larger = main.querySelectorAll('[data-model][aria-pressed="true"]').length;
      output.textContent = `Всего наклеек: ${2 * (5 - larger) + 3 * larger}.`;
    } else if (value === null) {
      output.textContent = lesson.model === 'intersection' ? 'Выбери число x и проверь оба условия.' : 'Выбери одно целое число.';
    } else if (lesson.model === 'line') {
      const fits = value > -2 && value <= 2.5;
      output.textContent = `${display(value)} ${fits ? 'подходит: обе границы соблюдены.' : 'не подходит: число вне заданных границ.'}`;
    } else {
      const first = value >= 5 && value <= 12;
      const second = 18 - value >= 8 && 18 - value <= 15;
      output.textContent = `При x = ${value} во второй команде ${18 - value}. Первое условие: ${first ? 'да' : 'нет'}. Второе: ${second ? 'да' : 'нет'}.`;
    }
  }

  function guideView(lesson, { guide }) {
    const index = guide.solved.length;
    const step = lesson.steps[index];
    const number = lessons.indexOf(lesson) + 1;
    main.innerHTML = `<div class="lesson-head">${courseLink('map', null, '← Все уроки', 'back')}
      <p class="eyebrow">Урок ${number} из ${lessons.length}</p><h1>${esc(lesson.title)}</h1></div>
      <div class="lesson-grid${lesson.model ? ' with-model' : ''}">
        <section class="panel problem"><h2>Задача</h2><p>${esc(lesson.story)}</p>
          <button class="text-button" type="button" data-action="theory" aria-controls="theory" aria-expanded="${guide.theory}">Как работает метод</button>
          <p id="theory" class="note"${guide.theory ? '' : ' hidden'}>${esc(lesson.idea)}</p>
        </section>${model(lesson)}
        <section class="panel work" aria-labelledby="active-step">
          ${index ? `<ol class="solved">${lesson.steps.slice(0, index).map(item => `<li>${esc(item.explain)}</li>`).join('')}</ol>` : ''}
          ${step ? `<p class="eyebrow">Шаг ${index + 1} из ${lesson.steps.length}</p>
          <h2 id="active-step" tabindex="-1">${esc(step.title)}</h2>
          <form id="guide-form" data-step="${index}">${fieldMarkup(step.field, guide.draft, 0)}
            <div class="actions"><button class="button primary" type="submit">Проверить шаг</button>
            <button class="button secondary" type="button" data-action="hint" aria-expanded="${guide.hint}" aria-controls="hint-text">Подсказка</button></div>
            <p id="guide-feedback" class="feedback" role="status">${esc(message(step, guide))}</p>
            <p id="hint-text" class="note" role="status"${guide.hint ? '' : ' hidden'}>${esc(step.hint)}</p>
          </form>` : `<h2 id="active-step" tabindex="-1">Задача разобрана</h2>
          <p>Примени тот же метод в новой задаче.</p>${courseLink('practice', lesson.id, 'К самопроверке', 'button primary')}`}
        </section>
      </div>`;
    updateModel(lesson, guide.model);
  }

  function practiceMessages(lesson, practice) {
    const checks = lesson.practice.fields.map((field, index) => S.check(field, practice.drafts[index]));
    const missing = checks.indexOf('missing');
    if (missing >= 0) return { index: missing, text: 'Заполни все поля ответа.' };
    const format = checks.indexOf('format');
    if (format >= 0) return { index: format, text: formatMessage(lesson.practice.fields[format]) };
    return { index: checks.indexOf('wrong'), text: 'Проверь ответы в отмеченных полях и попробуй ещё раз.' };
  }

  function practiceView(lesson, { practice }) {
    const next = lessons[lessons.indexOf(lesson) + 1];
    const { fields, story, proof, review } = lesson.practice;
    main.innerHTML = `${courseLink('lesson', lesson.id, '← К уроку', 'back')}
      <p class="eyebrow">Самопроверка</p><h1>${esc(lesson.title)}</h1>
      <section class="panel practice" aria-labelledby="practice-title"><h2 id="practice-title">Новая задача</h2>
        <p>${esc(story)}</p><form id="practice-form">
          <fieldset class="answer-group"${practice.done ? ' disabled' : ''}><legend class="sr-only">Ответы</legend>
          ${fields.map((field, index) => fieldMarkup(field, practice.drafts[index], index)).join('')}</fieldset>
          ${proof ? `<label class="field" for="proof-draft"><span>Черновик обоснования</span><small>${esc(proof)} Полное решение можно сверить с образцом или обсудить с учителем.</small>
            <textarea id="proof-draft" maxlength="${S.proofLimit}" rows="3">${esc(practice.proof)}</textarea></label>` : ''}
          ${practice.done ? '' : '<div class="actions"><button class="button primary" type="submit">Проверить ответы</button></div>'}
          <p id="practice-feedback" class="feedback" role="status"></p>
        </form>
        ${practice.done ? `<div class="result"><h2 id="practice-complete" tabindex="-1">Ответы верны</h2>
          <button class="text-button" type="button" data-action="review" aria-expanded="${practice.review}" aria-controls="sample">${practice.review ? 'Скрыть разбор' : 'Показать разбор'}</button>
          <p class="note" id="sample"${practice.review ? '' : ' hidden'}>${esc(review)}</p></div>
          <div class="actions">${next ? courseLink('lesson', next.id, 'Следующий урок', 'button primary') :
            courseLink('progress', null, 'Посмотреть прогресс', 'button primary')}</div>` : ''}
      </section>${practice.done ? examinerLinks(lesson.links) : ''}`;
    if (practice.checked && !practice.done) updatePracticeFeedback(lesson, practice);
  }

  function updatePracticeFeedback(lesson, practice, focus = false) {
    const result = practiceMessages(lesson, practice);
    const feedback = document.getElementById('practice-feedback');
    feedback.textContent = result.text;
    for (const input of main.querySelectorAll('[data-answer]')) {
      const index = Number(input.dataset.answer);
      const check = S.check(lesson.practice.fields[index], practice.drafts[index]);
      if (check !== 'correct') input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (focus) document.getElementById('answer-' + result.index)?.focus();
  }

  function render(focus) {
    generation++;
    const lesson = S.byId.get(view.id);
    if (view.page === 'lesson') guideView(lesson, recordFor(lesson));
    else if (view.page === 'practice') practiceView(lesson, recordFor(lesson));
    else if (view.page === 'progress') progressView();
    else map();
    if (focus) document.getElementById(focus)?.focus();
  }

  function move(next) {
    if (view.page === next.page && view.id === next.id) return;
    view = next;
    render('main');
    root.scrollTo(0, 0);
    if (embedded) bridge?.notifyStateChanged();
  }

  function reveal(button, show) {
    button.setAttribute('aria-expanded', String(show));
    document.getElementById(button.getAttribute('aria-controls')).hidden = !show;
    if (button.dataset.action === 'review') button.textContent = show ? 'Скрыть разбор' : 'Показать разбор';
  }

  document.addEventListener('click', event => {
    const navigation = event.target.closest('[data-course-nav]');
    if (navigation && embedded) {
      event.preventDefault();
      move(S.route(navigation.hash));
    }
    const lesson = S.byId.get(view.id);
    const button = event.target.closest('[data-action], [data-model]');
    if (!lesson || !button) return;
    if (button.dataset.model !== undefined) {
      const value = Number(button.dataset.model);
      change(lesson, record => {
        record.guide.model = lesson.model === 'packs' ? record.guide.model ^ (1 << value) : value;
      }, record => updateModel(lesson, record.guide.model));
      return;
    }
    const action = button.dataset.action;
    if (action === 'hint' || action === 'theory') {
      const index = Number(document.getElementById('guide-form')?.dataset.step);
      change(lesson, ({ guide }) => {
        if (action === 'theory' || guide.solved.length === index) guide[action] = !guide[action];
      }, ({ guide }) => { if (button.isConnected) reveal(button, guide[action]); });
    } else if (action === 'review') {
      change(lesson, ({ practice }) => { practice.review = !practice.review; },
        ({ practice }) => { if (button.isConnected) reveal(button, practice.review); });
    }
  });

  function saveDraft(event) {
    const input = event.target;
    if ((event.type === 'change') !== isChoice(input)) return;
    const lesson = S.byId.get(view.id);
    if (!lesson) return;
    if (input.id === 'proof-draft') {
      const value = S.cleanProof(input.value);
      if (input.value !== value) input.value = value;
      change(lesson, ({ practice }) => { practice.proof = value; });
      return;
    }
    if (!input.hasAttribute('data-answer')) return;
    const value = S.cleanInput(input.value);
    if (input.value !== value) input.value = value;
    input.removeAttribute('aria-invalid');
    const form = input.form;
    if (form.id === 'guide-form') {
      const index = Number(form.dataset.step);
      document.getElementById('guide-feedback').textContent = '';
      change(lesson, ({ guide }) => {
        if (guide.solved.length === index) Object.assign(guide, { draft: value, feedback: '' });
      });
    } else {
      const index = Number(input.dataset.answer);
      document.getElementById('practice-feedback').textContent = '';
      change(lesson, ({ practice }) => {
        if (!practice.done) {
          practice.drafts[index] = value;
          practice.checked = false;
        }
      });
    }
  }
  main.addEventListener('input', saveDraft);
  main.addEventListener('change', saveDraft);

  main.addEventListener('submit', event => {
    event.preventDefault();
    const lesson = S.byId.get(view.id);
    const form = event.target;
    if (!lesson) return;
    if (form.id === 'guide-form') {
      const index = Number(form.dataset.step);
      const input = form.elements['answer-0'];
      const value = input.value;
      change(lesson, record => S.answerGuide(record, lesson, index, value), ({ guide }) => {
        if (guide.solved.length !== index) {
          render('active-step');
          return;
        }
        const hint = form.querySelector('[data-action="hint"]');
        reveal(hint, guide.hint);
        document.getElementById('guide-feedback').textContent = message(lesson.steps[index], guide);
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      });
    } else if (form.id === 'practice-form') {
      const drafts = lesson.practice.fields.map((_, i) => form.elements['answer-' + i].value);
      change(lesson, record => S.answerPractice(record, lesson, drafts), ({ practice }) => {
        if (practice.done) render('practice-complete');
        else updatePracticeFeedback(lesson, practice, true);
      });
    }
  });

  if (!embedded) {
    root.addEventListener('hashchange', () => move(S.route(location.hash)));
    root.addEventListener('storage', event => {
      if (event.key?.startsWith(S.prefix) && (view.page === 'map' || view.page === 'progress')) render();
    });
  } else {
    let onBoard = false;
    try {
      onBoard = root.parent.location.origin === location.origin && root.parent.location.pathname === '/trainers/trainer-board.html';
    } catch { /* The course is usable in an unrelated frame without sharing data. */ }
    if (onBoard) {
      bridge = root.MathExamBoard.register({
        id: 'ege-methods', version: '1.0.0', stateSchemaVersion: 1, parentOrigin: location.origin,
        // Comparison signs in a written draft are plain text in the shared bridge.
        getState: () => ({ work: JSON.stringify({ view, records }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') }),
        applyState: wire => {
          if (typeof wire.work !== 'string') throw TypeError('Invalid room state');
          const state = JSON.parse(wire.work);
          if (!S.validRoom(state)) throw TypeError('Invalid room state');
          const changedPage = view.page !== state.view.page || view.id !== state.view.id;
          ({ view, records } = state);
          render();
          if (changedPage) root.scrollTo(0, 0);
        }
      });
    }
  }
  render();
})(window);
