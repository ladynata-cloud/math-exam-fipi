(function (root) {
  'use strict';
  if (new URLSearchParams(location.search).get('learning') !== '1') return;
  const D = root.PathData, S = root.PathManagedState, main = document.getElementById('main');
  const E = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const stageLabels = ['Понять', 'Исследовать', 'Решить по шагам', 'Самостоятельно', 'Объяснить'];
  let taskSpec = null, state = null, task = null, model = null, readonly = true, applying = false, notify = () => {};
  document.body.classList.add('learning-managed');
  main.innerHTML = '<p class="notice" role="status">Открываем сохранённое задание…</p>';
  main.inert = true;

  function getState() {
    if (!state) return null;
    if (model) state.work.model = model.getState();
    return clone(state);
  }
  function emit(kind, details = {}) {
    if (applying || readonly || !state) return;
    notify({ kind, details, state: getState() });
  }
  function showFeedback(text, kind = 'info') {
    state.view.feedback = text;
    state.view.feedbackKind = kind;
    const box = document.getElementById('feedback');
    if (box) { box.textContent = text; box.className = 'feedback ' + kind; }
  }
  function setReadOnly(value) {
    readonly = value === true;
    main.inert = readonly || !state;
    main.dataset.readOnly = String(readonly);
    model?.setReadOnly?.(readonly);
  }
  function applyState(envelope) {
    if (!envelope || !envelope.taskSpec) throw new TypeError('Не передано условие задачи.');
    const spec = envelope.taskSpec, id = spec.id || spec.contentId;
    if (spec.trainerId !== 'ege-path' || !D.meta.some(m => m.id === id) || spec.contentVersion !== 1 || !Number.isSafeInteger(spec.seed) || spec.seed < 0 || !spec.task || spec.task.id !== id) throw new TypeError('Неизвестная версия задания.');
    const incoming = S.validate(envelope.state, spec);
    const same = taskSpec && taskSpec.id === id && taskSpec.seed === spec.seed && JSON.stringify(incoming) === JSON.stringify(getState());
    setReadOnly(envelope.readOnly === true);
    if (same) return;
    const active = document.activeElement, focusId = active && main.contains(active) ? active.id : null;
    const selection = active && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
    applying = true;
    try {
      taskSpec = clone({ ...spec, id }); task = taskSpec.task; state = incoming;
      render();
      if (!readonly && focusId) {
        const field = document.getElementById(focusId);
        if (field && !field.disabled) {
          // A new task may replace a text answer with a hidden choice value.
          // Only text controls support restoring a caret/selection range.
          const target = field.type === 'hidden' ? main.querySelector('[data-answer-choice]') : field;
          target?.focus({ preventScroll: true });
          if (selection && typeof field.selectionStart === 'number' && typeof field.setSelectionRange === 'function') field.setSelectionRange(...selection);
        }
      }
    } finally { applying = false; }
  }
  function changeStage(stage) {
    if (readonly || stage === state.work.stage) return;
    if (model) state.work.model = model.getState();
    state.work.stage = stage;
    state.view.feedback = ''; state.view.feedbackKind = ''; state.view.hintText = ''; state.view.supportOpen = [];
    if (stage < 3) state.work.help = true;
    render();
    emit(stage < 3 ? 'hint' : 'navigate', stage < 3 ? { level: 1, stage } : { stage });
  }
  function newTask(stage = 3) { emit('new-task', { contentId: taskSpec.id, stage }); }
  function form() {
    return root.PathPracticeView.answerForm(state.work.stage===2?task.steps[state.work.step]:task);
  }
  function bindAnswer(scope) {
    const input = document.getElementById('answer'), work = state.work;
    if (!input) return;
    input.value = work.draft;
    root.PathPracticeView.bindChoices(main, value => { if (readonly) return; work.draft=value; emit('input', { field:'answer' }); });
    input.oninput = () => { work.draft = input.value.slice(0, 4000); emit('input', { field: 'answer' }); };
    // Managed frames deliberately have no allow-forms sandbox capability.
    // Check via a local command, so native form navigation cannot swallow it.
    const formElement=document.getElementById('answerForm');
    const checkAnswer = event => {
      event.preventDefault(); if (readonly) return;
      const answer = input.value;
      if (!answer.trim()) { showFeedback('Сначала введи ответ.', 'bad'); emit('input', { field: 'answer' }); return; }
      if (scope === 'final' && work.done) { showFeedback('Этот вариант уже решён. Возьми новую похожую задачу.'); emit('input', { field: 'answer' }); return; }
      const step = work.step, answers = [...work.answers], correct = D.correct(scope === 'step' ? task.steps[step] : task, answer);
      work.draft = answer; work.attempted = true;
      if (scope === 'step') {
        work.help = true;
        if (correct) { work.answers.push(answer); work.step++; work.done = work.step === task.steps.length; work.draft = ''; state.view.hintText = ''; state.view.feedback = ''; state.view.feedbackKind = ''; render(); showFeedback(work.step === task.steps.length ? 'Разбор завершён. Для самостоятельной проверки возьми новый вариант.' : 'Верно. Продолжай со следующего шага.', 'good'); document.getElementById('answer')?.focus(); }
        else showFeedback('Проверь именно этот шаг. ' + task.steps[step].why, 'bad');
      } else {
        if (correct) { work.done = true; showFeedback(work.help ? 'Верно. Этот вариант решён после разбора или помощи.' : 'Верно! Результат будет сохранён в истории работы.', 'good'); }
        else showFeedback('Пока неверно. Проверь знак, единицы и то, что спрашивается. Можно разобрать этот вариант по шагам.', 'bad');
      }
      emit('check', scope === 'step' ? { scope, step, answer, answers } : { scope, answer });
    };
    formElement.onsubmit=checkAnswer;
    const checkButton=formElement.querySelector('button[type=submit]');
    checkButton.type='button';checkButton.onclick=checkAnswer;
    input.onkeydown=event=>{if(event.key==='Enter'&&!event.isComposing&&event.keyCode!==229){event.preventDefault();if(!event.repeat)checkAnswer(event);}};
  }
  function supportDetails() {
    // Only semantic open/closed panel state is recorded, never page markup.
    const details = [...main.querySelectorAll('.task-support details, #model #construction details')];
    details.forEach((el, index) => {
      el.open = state.view.supportOpen.includes(index);
      el.ontoggle = () => {
        if (applying || !el.isConnected) return;
        const present = state.view.supportOpen.includes(index);
        if (present === el.open) return;
        state.view.supportOpen = el.open ? [...state.view.supportOpen, index] : state.view.supportOpen.filter(i => i !== index);
        emit('navigate', { panel: index, open: el.open });
      };
    });
  }
  function render() {
    const work = state.work, meta = D.meta.find(m => m.id === taskSpec.id);
    model = null; document.title = meta.title + ' · Моя работа';
    main.innerHTML = `<p class="eyebrow">${meta.pre7?'Основы до 7 класса':meta.grade7?'7 класс · '+E(({algebra:'Алгебра',geometry:'Геометрия',foundation:'Базовая математика'})[meta.subject]||'Математика'):'ЕГЭ база · Задание '+meta.pos}</p><h1>${E(meta.title)}</h1><nav class="stage-nav" aria-label="Шаги урока">${stageLabels.map((label, i) => `<button data-stage="${i}" ${i === work.stage ? 'aria-current="step"' : ''}>${i + 1}. ${label}</button>`).join('')}</nav><div id="lesson"></div><p id="feedback" class="feedback" role="status"></p><p class="muted managed-note">Это одна сохранённая попытка. Разбор и подсказки остаются в её истории. Для самостоятельного закрепления открой новый вариант.</p>`;
    main.querySelectorAll('[data-stage]').forEach(button => button.onclick = () => changeStage(+button.dataset.stage));
    const box = document.getElementById('lesson');
    const condition = `<p class="task">${E(task.q)}</p>`;
    const support = root.PathPracticeView.markup(task, work.stage === 1 && ['polygon-build','pre7-lab','grade7-construction'].includes(task.model.kind));
    if (work.stage === 0) {
      box.innerHTML = `<section class="panel"><h2>Главная идея</h2><p class="lead">${E(meta.idea)}</p><div class="callout"><b>Перед вычислением спроси себя</b><p>Что дано, что неизвестно и какая связь между ними? Какие единицы нужны в ответе?</p></div>${condition}${support}<button id="next" class="primary">Исследовать модель →</button></section>`;
      document.getElementById('next').onclick = () => changeStage(1);
    } else if (work.stage === 1) {
      box.innerHTML = `<section class="panel">${condition}${support}${task.model.expansion ? `<p class="callout">${E(task.model.expansion)}</p>` : ''}<div id="model"></div><button id="next" class="primary">Перейти к решению →</button></section>`;
      model = root.PathModels.mount(document.getElementById('model'), task, { state: work.model, onChange(value) { if (!document.getElementById('model') || applying) return; work.model = value; supportDetails(); emit('model', { modelKind: task.model.kind }); } });
      work.model = model.getState();
      document.getElementById('next').onclick = () => changeStage(2);
    } else if (work.stage === 2) {
      const finished = work.step >= task.steps.length;
      box.innerHTML = `<section class="panel">${condition}${support}<ol class="steps">${task.steps.slice(0, work.step).map(step => `<li>${E(step.q)} <b>${E(step.a === undefined ? 'Условия выполнены' : root.PathPracticeView.answerText(step))}</b><br>${E(step.why)}</li>`).join('')}</ol>${finished ? '<h2>Разбор завершён</h2><p>Проверь себя на новом условии.</p><button id="new" class="primary">Новый самостоятельный вариант</button>' : `<div class="callout"><b>Шаг ${work.step + 1}/${task.steps.length}</b><p>${E(task.steps[work.step].q)}</p></div>${form()}<button id="hint">Подсказать смысл шага</button><p id="hintText"></p>`}<details id="gap"><summary>Мешает пробел в основе?</summary><p>Обсуди с Натальей Михайловной, какое действие затрудняет решение: знак, дробь, единицы или выбор формулы. Эта попытка сохранит текущий шаг.</p></details></section>`;
      if (finished) document.getElementById('new').onclick = () => newTask();
      else {
        bindAnswer('step'); document.getElementById('hintText').textContent = state.view.hintText;
        document.getElementById('hint').onclick = () => { work.help = true; state.view.hintText = task.steps[work.step].why; document.getElementById('hintText').textContent = state.view.hintText; emit('hint', { level: 1, step: work.step }); };
      }
      const gap = document.getElementById('gap'); gap.open = state.view.gapOpen;
      gap.ontoggle = () => { if (applying || !gap.isConnected || gap.open === state.view.gapOpen) return; state.view.gapOpen = gap.open; emit('navigate', { panel: 'gap', open: gap.open }); };
    } else if (work.stage === 3) {
      box.innerHTML = `<section class="panel"><span class="badge">${work.help ? 'Продолжение после разбора' : 'Реши самостоятельно'}</span>${condition}${support}${form()}<div class="actions"><button id="explain">Разобрать этот вариант</button><button id="new">Новая похожая задача</button><button id="next">Объяснить своими словами →</button></div></section>`;
      bindAnswer('final'); document.getElementById('explain').onclick = () => changeStage(2); document.getElementById('new').onclick = () => newTask(); document.getElementById('next').onclick = () => changeStage(4);
    } else {
      box.innerHTML = `<section class="panel">${condition}<h2>Объясни ход мысли</h2><p>Какую связь ты использовал? Почему действие допустимо? Как проверить ответ другим способом?</p><label for="note">Моё объяснение</label><textarea id="note" maxlength="4000" placeholder="Я выбрал(а)… потому что… Проверил(а)…"></textarea><p class="muted">Объяснение сохраняется для обсуждения с преподавателем. Автоматическая проверка не оценивает его качество.</p><button id="new" class="primary">Новая похожая задача</button></section>`;
      const note = document.getElementById('note'); note.value = work.note; note.oninput = () => { work.note = note.value.slice(0, 4000); emit('input', { field: 'note' }); }; document.getElementById('new').onclick = () => newTask();
    }
    showFeedback(state.view.feedback, state.view.feedbackKind); supportDetails(); setReadOnly(readonly);
  }
  if (!root.MathExamLearning || typeof root.MathExamLearning.register !== 'function') {
    main.innerHTML = '<p class="notice" role="alert">Не удалось подключиться к кабинету. Обновите страницу задания.</p>'; return;
  }
  root.MathExamLearning.register({ trainerId: 'ege-path', contentVersion: 1, getState, applyState, setReadOnly,
    subscribe(callback) { notify = callback; return () => { notify = () => {}; }; } });
})(window);
