(function () {
  'use strict';

  const { guided, homework, predictions, truncatedPyramid, checkAnswer } = window.PyramidLesson;
  const get = id => document.getElementById(id);
  const storagePrefix = 'mathexam.college-stereometry.pyramids.v1.';
  const session = new Map();
  let storageAvailable = true;
  let route;
  let viewer;

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function lostStorage() {
    storageAvailable = false;
    get('storage-note').textContent = 'Браузер сохраняет ответы только до закрытия или обновления этой страницы.';
    get('storage-note').hidden = false;
  }

  function read(key) {
    if (!storageAvailable) return session.get(key);
    try {
      const raw = localStorage.getItem(storagePrefix + key);
      if (!raw) return undefined;
      const value = JSON.parse(raw);
      session.set(key, value);
      return value;
    } catch (error) {
      if (!(error instanceof SyntaxError)) lostStorage();
      return session.get(key);
    }
  }

  function write(key, value) {
    session.set(key, value);
    if (!storageAvailable) return;
    try {
      localStorage.setItem(storagePrefix + key, JSON.stringify(value));
    } catch {
      lostStorage();
    }
  }

  const angles = [[-.56, .38], [.75, .47], [-.93, .5]];
  let camera = 0;
  const cutPosition = get('cut-position');
  const showMeasures = get('show-measures');
  const svgNamespace = 'http://www.w3.org/2000/svg';

  function drawCut() {
    const height = Number(cutPosition.value);
    const side = 8 - height;
    const { points } = truncatedPyramid(8, side, height);
    points.P = [0, 0, 8];
    const [yaw, pitch] = angles[camera];
    const xDepth = Math.sin(yaw), yDepth = Math.cos(yaw);
    const projected = Object.fromEntries(Object.entries(points).map(([name, [x, y, z]]) => [name, [
      180 + 24 * (x * yDepth - y * xDepth),
      190 - 20.5 * (z * Math.cos(pitch) - (x * xDepth + y * yDepth) * Math.sin(pitch))
    ]]));
    const fragment = document.createDocumentFragment();
    function shape(tag, className, names) {
      const element = document.createElementNS(svgNamespace, tag);
      element.setAttribute('class', className);
      element.setAttribute('points', names.map(name => projected[name].join(',')).join(' '));
      fragment.append(element);
    }
    function label(name, text, dx, dy) {
      const element = document.createElementNS(svgNamespace, 'text');
      const [x, y] = projected[name];
      element.setAttribute('class', 'cut-text');
      element.setAttribute('x', x + dx);
      element.setAttribute('y', y + dy);
      element.textContent = text;
      fragment.append(element);
    }
    const base = ['A', 'B', 'C', 'D'];
    const top = base.map(name => name + '1');
    shape('polygon', 'cut-hidden', base);
    for (const name of base) {
      shape('polyline', 'cut-hidden', [name, name + '1']);
      shape('polyline', 'cut-apex', [name + '1', 'P']);
    }
    const sideEdge = xDepth > 0 ? ['D', 'A'] : ['B', 'C'];
    for (const [i, [a, b]] of [sideEdge, ['A', 'B']].entries()) {
      shape('polygon', i ? 'cut-body cut-front' : 'cut-body', [a, b, b + '1', a + '1']);
    }
    shape('polygon', 'cut-plane', top);
    if (showMeasures.checked) {
      shape('polyline', 'cut-height-line', ['O', 'O1']);
      label('O1', 'h', 8, 19);
    }
    label('P', 'P', 10, 4);
    const front = xDepth > 0 ? 'A' : 'B';
    label(front, front, xDepth > 0 ? 8 : -22, 10);
    get('cut-shapes').replaceChildren(fragment);
    const textHeight = `${height} см`;
    cutPosition.setAttribute('aria-valuetext', textHeight);
    get('cut-height').textContent = textHeight;
    get('cut-desc').textContent = `Вершина P на высоте 8 см. Сечение находится на высоте ${textHeight} от основания. Зелёная часть под сечением — усечённая пирамида.`;
    const measures = get('cut-measures');
    measures.hidden = !showMeasures.checked;
    measures.textContent = `Нижняя сторона 8 см · верхняя ${side} см · до вершины ${8 - height} см`;
  }

  cutPosition.addEventListener('input', drawCut);
  showMeasures.addEventListener('change', drawCut);
  get('turn-lab').addEventListener('click', () => {
    camera = (camera + 1) % angles.length;
    drawCut();
  });
  drawCut();

  function showPrediction(group, selected) {
    group.querySelectorAll('[data-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.choice) === selected));
    });
    const info = predictions[group.dataset.explore];
    const feedback = group.querySelector('.feedback');
    feedback.hidden = selected === undefined;
    feedback.dataset.result = selected === info.correct ? 'good' : 'bad';
    feedback.textContent = selected === undefined ? '' : selected === info.correct ? info.yes : info.no;
  }

  for (const group of get('predictions').querySelectorAll('[data-explore]')) {
    const key = `research.${group.dataset.explore}`;
    showPrediction(group, read(key));
    group.addEventListener('click', event => {
      const button = event.target.closest('[data-choice]');
      if (!button) return;
      const selected = Number(button.dataset.choice);
      write(key, selected);
      showPrediction(group, selected);
    });
  }

  function taskState(task) {
    const stored = read(`answer.${task.id}`);
    return {
      helped: stored?.helped === true,
      fields: task.steps.map((_, i) => {
        const saved = stored?.fields?.[i];
        return {
          value: typeof saved?.value === 'string' ? saved.value.slice(0, 48) : '',
          done: saved?.done === true,
          wrong: Number.isSafeInteger(saved?.wrong) ? saved.wrong : 0,
          hint: saved?.hint === true
        };
      })
    };
  }

  function saveTask(task, state) {
    write(`answer.${task.id}`, state);
  }

  function resolveRoute() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('task-')) {
      const id = hash.slice(5);
      const task = guided.find(item => item.id === id) || homework.find(item => item.id === id);
      if (task) {
        const mode = guided.includes(task) ? 'practice' : 'homework';
        return { mode, task, list: mode === 'practice' ? guided : homework };
      }
    }
    if (hash === 'practice' || hash === 'homework') {
      const list = hash === 'practice' ? guided : homework;
      const last = read(`last.${hash}`);
      return { mode: hash, task: list.find(item => item.id === last) || list[0], list };
    }
    return { mode: hash === 'rules' ? 'rules' : 'research' };
  }

  function updateProgress() {
    if (!route.task) return;
    let complete = 0, independent = 0;
    for (const [i, task] of route.list.entries()) {
      const state = taskState(task);
      const done = state.fields.every(field => field.done);
      const link = get('exercise-nav').children[i];
      link.dataset.complete = String(done);
      link.setAttribute('aria-label', `${i + 1}. ${task.title}${done ? '. Решено' : ''}`);
      if (done) {
        complete++;
        if (!state.helped) independent++;
      }
    }
    get('work-progress').textContent = `Решено ${complete} из ${route.list.length} · без подсказок ${independent}`;
  }

  function fieldNote(step) {
    return typeof step.answer === 'number'
      ? 'Введи число. Можно использовать запятую или дробь.'
      : 'Введи точное значение с корнем. Подойдут √13 и sqrt(13).';
  }

  const messages = {
    wrong: 'Проверь вычисление и попробуй ещё раз.',
    radical: 'Здесь нужно точное значение с корнем. Подойдут √13 и sqrt(13).',
    format: 'Проверь запись числа или корня. Единицу измерения вводить не нужно.',
    empty: 'Введи ответ для проверки.'
  };

  function renderAnswers(state, results = {}) {
    const { mode, task } = route;
    const isGuided = mode === 'practice';
    const firstOpen = state.fields.findIndex(field => !field.done);
    const finished = firstOpen === -1;
    const form = get('answer-form');
    const content = document.createDocumentFragment();
    const shown = isGuided && !finished ? task.steps.slice(0, firstOpen + 1) : task.steps;
    for (const [i, step] of shown.entries()) {
      const field = state.fields[i];
      const row = node('div', '', 'answer-row');
      const label = node('label', step.label);
      label.htmlFor = `answer-${i}`;
      const input = node('input');
      input.id = label.htmlFor;
      input.dataset.index = i;
      input.maxLength = 48;
      input.type = 'text';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.value = field.value;
      input.disabled = field.done;
      const entry = node('div', '', 'answer-field');
      entry.append(input, node('span', step.unit));
      if (!field.done && typeof step.answer !== 'number') {
        const radical = node('button', '√');
        radical.type = 'button';
        radical.dataset.radical = i;
        radical.setAttribute('aria-label', 'Вставить знак корня');
        entry.append(radical);
      }
      row.append(label, entry);
      const feedback = node('p', '', 'feedback');
      feedback.id = `answer-feedback-${i}`;
      feedback.setAttribute('role', 'status');
      const noteId = `answer-note-${i}`;
      input.setAttribute('aria-describedby', field.done ? feedback.id : `${noteId} ${feedback.id}`);
      if (field.done) {
        feedback.dataset.result = 'good';
        feedback.textContent = isGuided ? `Верно. ${step.explanation}` : 'Верно.';
      } else {
        const note = node('p', fieldNote(step), 'field-note');
        note.id = noteId;
        row.append(note);
        if (results[i]) {
          input.setAttribute('aria-invalid', 'true');
          feedback.dataset.result = 'bad';
          feedback.textContent = messages[results[i]];
        }
      }
      row.append(feedback);
      if (!field.done && field.hint) {
        row.append(node('p', step.hint, 'hint'));
      } else if (!field.done && field.wrong >= 2) {
        const actions = node('div', '', 'answer-actions');
        const hint = node('button', 'Показать подсказку');
        hint.type = 'button';
        hint.dataset.hint = i;
        actions.append(hint);
        row.append(actions);
      }
      content.append(row);
    }
    if (finished) {
      const done = node('p', state.helped ? 'Задача решена с подсказкой.' : 'Задача решена без подсказок.', 'exercise-complete');
      done.tabIndex = -1;
      done.setAttribute('role', 'status');
      content.append(done);
    } else {
      const actions = node('div', '', 'answer-actions');
      const submit = node('button', isGuided ? 'Проверить шаг' : 'Проверить ответы', 'primary');
      submit.type = 'submit';
      actions.append(submit);
      content.append(actions);
    }
    form.replaceChildren(content);
    if (isGuided) viewer.setView(task.steps[firstOpen < 0 ? task.steps.length - 1 : firstOpen].focus);
    updateProgress();
  }

  function showRoute(moveFocus) {
    route = resolveRoute();
    document.body.dataset.stage = route.mode;
    get('research').hidden = route.mode !== 'research';
    get('rules').hidden = route.mode !== 'rules';
    get('work').hidden = !route.task;
    for (const phase of document.querySelectorAll('.route a')) {
      if (phase.hash === `#${route.mode}`) phase.setAttribute('aria-current', 'location');
      else phase.removeAttribute('aria-current');
    }
    viewer?.destroy();
    viewer = undefined;
    if (!route.task) {
      if (moveFocus) get(`${route.mode}-title`).focus({ preventScroll: true });
      return;
    }
    const { mode, task, list } = route;
    write(`last.${mode}`, task.id);
    const index = list.indexOf(task);
    get('work-title').textContent = mode === 'practice' ? 'Вместе с учителем' : 'Домашняя работа';
    get('exercise-title').textContent = task.title;
    get('exercise-condition').textContent = task.condition;
    get('exercise-nav').replaceChildren(...list.map((item, i) => {
      const link = node('a', String(i + 1));
      link.href = `#task-${item.id}`;
      if (item === task) link.setAttribute('aria-current', 'step');
      return link;
    }));
    get('previous-task').disabled = index === 0;
    get('next-task').hidden = index === list.length - 1;
    get('print-homework').hidden = mode !== 'homework';
    get('solution').open = false;
    get('solution-steps').replaceChildren(...task.steps.map(step => node('li', step.explanation)));
    viewer = window.TaskSceneViewer.mount(get('exercise-figure'), task.figure());
    renderAnswers(taskState(task));
    if (moveFocus) get('exercise-title').focus({ preventScroll: true });
  }

  get('answer-form').addEventListener('input', event => {
    const i = Number(event.target.dataset.index);
    if (!route.task || !Number.isInteger(i)) return;
    const state = taskState(route.task);
    if (state.fields[i].done) return;
    state.fields[i].value = event.target.value;
    saveTask(route.task, state);
    event.target.removeAttribute('aria-invalid');
    get(`answer-feedback-${i}`).textContent = '';
  });

  get('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    const { task, mode } = route;
    const state = taskState(task);
    const errors = {};
    for (const input of event.currentTarget.querySelectorAll('input:not(:disabled)')) {
      const i = Number(input.dataset.index), field = state.fields[i];
      if (field.done) continue;
      field.value = input.value;
      const result = field.value.trim() ? checkAnswer(field.value, task.steps[i].answer) : 'empty';
      if (result === 'correct') {
        field.done = true;
        continue;
      }
      errors[i] = result;
      if (result !== 'wrong') continue;
      field.wrong++;
      if (mode === 'practice' && field.wrong >= 2) {
        field.hint = true;
        state.helped = true;
      }
    }
    saveTask(task, state);
    renderAnswers(state, errors);
    const pending = get('answer-form').querySelector('[aria-invalid="true"], input:not(:disabled), .exercise-complete');
    pending?.focus();
  });

  get('answer-form').addEventListener('click', event => {
    const radical = event.target.closest('button[data-radical]');
    if (radical) {
      const input = get(`answer-${radical.dataset.radical}`);
      if (input.value.length < input.maxLength || input.selectionStart !== input.selectionEnd) {
        input.setRangeText('√', input.selectionStart, input.selectionEnd, 'end');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      input.focus();
      return;
    }
    const button = event.target.closest('button[data-hint]');
    if (!button) return;
    const i = Number(button.dataset.hint);
    const state = taskState(route.task);
    if (state.fields[i].done) return;
    state.fields[i].hint = true;
    state.helped = true;
    saveTask(route.task, state);
    viewer.setView(route.task.steps[i].focus);
    renderAnswers(state);
    get(`answer-${i}`).focus();
  });

  get('solution').querySelector('summary').addEventListener('click', () => {
    if (get('solution').open || !route.task) return;
    const state = taskState(route.task);
    if (!state.fields.every(field => field.done)) {
      state.helped = true;
      saveTask(route.task, state);
    }
  });

  function moveTask(offset) {
    const target = route.list[route.list.indexOf(route.task) + offset];
    if (target) location.hash = `task-${target.id}`;
  }

  get('previous-task').addEventListener('click', () => moveTask(-1));
  get('next-task').addEventListener('click', () => moveTask(1));
  get('print-list').replaceChildren(...homework.map(task => node('li', task.condition)));
  get('print-homework').addEventListener('click', () => window.print());
  window.addEventListener('hashchange', () => {
    showRoute(true);
    window.scrollTo(0, 0);
  });
  window.addEventListener('storage', updateProgress);
  showRoute(false);
})();
