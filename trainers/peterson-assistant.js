/* Optional local task help. Reads only the course's current authored material.
   No account, network, model, chat input or independent progress store. */
(function (root) {
  'use strict';
  function mount(options) {
    if (!root.document || typeof options?.getTask !== 'function') return null;
    const doc = root.document;
    const make = (tag, text, className) => {
      const element = doc.createElement(tag);
      if (text !== undefined) element.textContent = text;
      if (className) element.className = className;
      return element;
    };
    function mathText(host, value) {
      const text = String(value || '');
      const token = /\{\{(frac|mix):([^{}:\n]+):([^{}:\n]+)(?::([\d]+))?\}\}/g;
      let start = 0, match;
      while ((match = token.exec(text))) {
        host.append(doc.createTextNode(text.slice(start, match.index)));
        const fraction = make('span', undefined, 'peterson-help-fraction');
        if (match[1] === 'mix' && match[4]) host.append(doc.createTextNode(match[2] + ' '));
        const numerator = match[1] === 'mix' && match[4] ? match[3] : match[2];
        const denominator = match[1] === 'mix' && match[4] ? match[4] : match[3];
        fraction.setAttribute('aria-label', numerator + ' делить на ' + denominator);
        fraction.append(make('span', numerator), make('span', denominator));
        host.append(fraction); start = token.lastIndex;
      }
      host.append(doc.createTextNode(text.slice(start)));
    }
    const host = make('aside', undefined, 'peterson-help');
    host.setAttribute('aria-label', 'Подсказки к задаче');
    const launcher = make('button', 'Нужна подсказка?', 'peterson-help-launcher');
    launcher.type = 'button'; launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'peterson-help-panel');
    const panel = make('section', undefined, 'peterson-help-panel');
    panel.id = 'peterson-help-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'peterson-help-title');
    const header = make('div', undefined, 'peterson-help-header');
    const heading = make('h2', 'Подсказки по заданию'); heading.id = 'peterson-help-title';
    const close = make('button', 'Закрыть', 'peterson-help-close'); close.type = 'button';
    header.append(heading, close);
    const body = make('div', undefined, 'peterson-help-body');
    const note = make('p', 'Подсказки из материалов курса. Начни с одного шага или открой весь разбор.', 'peterson-help-note');
    const title = make('h3', ''), condition = make('p', '', 'peterson-help-condition');
    const actions = make('div', undefined, 'peterson-help-actions');
    const buttons = [['hint', 'Подскажи следующий шаг'], ['simpler', 'Объясни проще'], ['full', 'Показать разбор']].map(([mode, label]) => {
      const button = make('button', label); button.type = 'button'; button.dataset.petersonHelp = mode;
      button.addEventListener('click', () => answer(mode)); actions.append(button); return button;
    });
    const message = make('p', '', 'peterson-help-message');
    message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
    const log = make('div', undefined, 'peterson-help-log');
    body.append(note, title, condition, actions, message, log); panel.append(header, body);
    host.append(panel, launcher); doc.body.append(host); doc.body.classList.add('peterson-help-ready');
    let currentId = null, currentStep = -1, alive = true;
    const shown = new Set();
    function read() {
      try {
        const task = options.getTask();
        return task && typeof task.id === 'string' && task.id && typeof task.onHelp === 'function'
          && Array.isArray(task.steps) ? task : null;
      } catch (_) { return null; }
    }
    function sync() {
      if (!alive) return null;
      const task = read(), id = task?.id || null;
      if (id !== currentId) { log.replaceChildren(); shown.clear(); message.textContent = ''; currentId = id; currentStep = -1; }
      title.textContent = task?.title || 'Сначала открой задачу';
      condition.replaceChildren(); mathText(condition, task?.condition || 'Выбери тему и пример. Здесь появятся подсказки именно к нему.');
      buttons.forEach(button => { button.disabled = !task; });
      if (task && currentStep !== task.stepIndex) {
        currentStep = task.stepIndex;
        message.textContent = task.complete ? 'Задача решена. Можно вернуться к её разбору.' : 'Подсказка относится к текущему шагу. Предыдущие подсказки остаются ниже.';
      }
      return task;
    }
    function answer(mode) {
      const task = sync(); if (!task) return;
      const index = Math.max(0, Math.min(task.steps.length - 1, Number.isInteger(task.stepIndex) ? task.stepIndex : 0));
      const step = task.steps[index];
      const paragraphs = mode === 'full'
        ? task.steps.flatMap((item, i) => ['Шаг ' + (i + 1) + '. ' + item.title, item.explanation || item.hint, item.answer ? 'Ответ шага: ' + item.answer : '']).concat(task.explanation || '')
        : mode === 'simpler' ? [step?.title, step?.hint || task.hint]
          : [step?.hint || task.hint];
      const content = paragraphs.filter(value => typeof value === 'string' && value.trim());
      if (!content.length) { message.textContent = 'В материалах курса нет отдельной подсказки к этому шагу. Обсуди его с преподавателем.'; return; }
      const key = JSON.stringify([task.id, index, mode, content]);
      if (shown.has(key)) { message.textContent = 'Эта подсказка уже показана ниже.'; return; }
      try {
        // The course records assistance before any source explanation is shown.
        if (task.onHelp({ mode, stepIndex: index }) === false || read()?.id !== task.id) { sync(); return; }
      } catch (_) { message.textContent = 'Не удалось отметить помощь. Попробуй ещё раз.'; return; }
      const entry = make('article', undefined, 'peterson-help-answer');
      entry.append(make('h3', mode === 'full' ? 'Разбор задачи' : 'Шаг ' + (index + 1) + (mode === 'simpler' ? ' · по порядку' : ' · подсказка')));
      for (const value of content) { const paragraph = make('p'); mathText(paragraph, value); entry.append(paragraph); }
      log.append(entry); shown.add(key);
      message.textContent = task.complete ? 'Разбор добавлен. Сохранённый результат не изменён.' : 'Подсказка добавлена. Эта работа будет учитываться с помощью.';
      // Scroll only the helper transcript; do not move the learner's page.
      body.scrollTop += entry.getBoundingClientRect().top - body.getBoundingClientRect().top;
    }
    function hide() { panel.hidden = true; launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); }
    launcher.addEventListener('click', () => {
      if (!panel.hidden) { hide(); return; }
      sync(); panel.hidden = false; launcher.setAttribute('aria-expanded', 'true'); close.focus();
    });
    close.addEventListener('click', hide);
    const escape = event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); hide(); } };
    doc.addEventListener('keydown', escape);
    const routeChanged = () => sync(); root.addEventListener('hashchange', routeChanged);
    sync();
    return Object.freeze({ sync, destroy() { alive = false; doc.removeEventListener('keydown', escape); root.removeEventListener('hashchange', routeChanged); host.remove(); doc.body.classList.remove('peterson-help-ready'); } });
  }
  root.PetersonTaskHelp = Object.freeze({ mount });
})(typeof window === 'undefined' ? globalThis : window);
