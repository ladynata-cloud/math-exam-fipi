(function () {
  'use strict';

  const { scenes, reviews } = window.LinearBasicsData;
  const key = 'mathexam.linearPilot.basics.v1';
  const routeKey = key + '.route';
  const screen = document.getElementById('basics-screen');
  const storageMessage = document.getElementById('basics-storage');
  const basics = document.getElementById('basics-content');
  const advanced = document.getElementById('advanced-content');
  const basicsRoute = document.getElementById('basics-route');
  const advancedRoute = document.getElementById('advanced-route');

  const initialState = () => ({ phase: 'welcome', scene: 0, visited: 0, steps: {}, turn: 0, question: 0, answers: [], reviewAttempts: {}, reviewHistory: {}, reviewEvidenceKnown: true });
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const isNumber = value => typeof value === 'string' && /^[+\-−]?\d+$/.test(value.trim());
  const correctAnswer = (value, expected) => isNumber(value) && Number(value.trim().replace('−', '-')) === expected;
  const isStepMap = value => value && typeof value === 'object' && Object.values(value).every(step => step && typeof step === 'object');
  const attemptLimit = 40, reviewLimit = 24;
  const recentWithFirst = (items, limit) => items.length > limit ? [items[0], ...items.slice(1 - limit)] : items;
  const boundedCount = (value, minimum) => Number.isSafeInteger(value) && value >= minimum ? value : minimum;
  function cleanAttempts(source, kind) {
    if (!Array.isArray(source)) return [];
    return recentWithFirst(source, attemptLimit).filter(item => item && Number.isFinite(item.at) && item.at >= 0 &&
      (kind === 'choice' ? Number.isInteger(item.option) && item.option >= 0 && item.option <= 8 && typeof item.assisted === 'boolean' :
        typeof item.answer === 'string' && item.answer.length <= 20))
      .map(item => kind === 'choice' ? {option:item.option, assisted:item.assisted, at:item.at} : {answer:item.answer, at:item.at});
  }
  function cleanReviewAttempts(source) {
    const result = {};
    if (!source || typeof source !== 'object') return result;
    for (let i = 0; i < reviews[0].length; i++) {
      const entries = cleanAttempts(source[i], 'answer');
      if (entries.length) result[i] = entries;
    }
    return result;
  }
  function normalizeEvidence(saved) {
    for (const steps of [saved.steps, saved.remediationSteps].filter(Boolean)) {
      for (const [index, step] of Object.entries(steps)) if (step.attempts !== undefined) {
        const raw = step.attempts, entries = cleanAttempts(raw, 'choice').filter(a => scenes[index]?.question?.options[a.option]);
        step.historyKnown = step.historyKnown === true && Array.isArray(raw) && entries.length > 0 && entries[0].option === raw[0]?.option;
        step.attemptCount = boundedCount(step.attemptCount, Array.isArray(raw) ? raw.length : entries.length);
        step.attempts = entries;
      }
    }
    const rawReviewAttempts = saved.reviewAttempts;
    const invalidReviewAttempts = rawReviewAttempts !== undefined && (!rawReviewAttempts || typeof rawReviewAttempts !== 'object' ||
      Object.values(rawReviewAttempts).some(rows => !Array.isArray(rows) || cleanAttempts(rows, 'answer').length !== Math.min(rows.length, attemptLimit)));
    saved.reviewAttempts = cleanReviewAttempts(rawReviewAttempts);
    const counts = saved.reviewAttemptCounts || {};
    saved.reviewAttemptCounts = Object.fromEntries(Object.entries(saved.reviewAttempts).map(([i, entries]) => [i,boundedCount(counts[i],entries.length)]));
    const records = Object.values(saved.reviewHistory || {}).filter(item => item && Number.isSafeInteger(item.turn) && item.turn >= 0 &&
      Number.isInteger(item.form) && reviews[item.form] && Number.isInteger(item.score) && item.score >= 0 && item.score <= reviews[item.form].length &&
      Number.isFinite(item.completedAt) && item.completedAt >= 0 &&
      Array.isArray(item.equations) && item.equations.length === reviews[item.form].length && item.equations.every(x => typeof x === 'string' && x.length <= 200) &&
      Array.isArray(item.answers) && item.answers.length === reviews[item.form].length && item.answers.every(x => typeof x === 'string' && x.length <= 20))
      .sort((a,b) => a.turn - b.turn);
    saved.reviewHistoryCount = boundedCount(saved.reviewHistoryCount, records.length);
    saved.reviewHistory = Object.fromEntries(recentWithFirst(records, reviewLimit).map(item => {
      const attempts = cleanReviewAttempts(item.attempts);
      const sameForm = item.equations.every((math,i) => math === reviews[item.form][i].math);
      const intactFirst = item.answers.every((_,i) => Array.isArray(item.attempts?.[i]) && attempts[i]?.length &&
        attempts[i][0].answer === item.attempts[i][0]?.answer && attempts[i][0].at === item.attempts[i][0]?.at &&
        attempts[i].length === Math.min(item.attempts[i].length, attemptLimit));
      return [item.turn, {turn:item.turn,form:item.form,equations:item.equations.slice(),answers:item.answers.slice(),attempts,
        attemptCounts:Object.fromEntries(Object.entries(attempts).map(([i,rows]) => [i,boundedCount(item.attemptCounts?.[i],rows.length)])),
        provenance:item.provenance === 'recorded' && sameForm && intactFirst ? 'recorded':'unknown',
        score:sameForm ? item.answers.filter((answer,i) => correctAnswer(answer,reviews[item.form][i].answer)).length : item.score,completedAt:item.completedAt}];
    }));
    saved.reviewEvidenceKnown = saved.reviewEvidenceKnown === true && !invalidReviewAttempts;
  }
  const button = (action, label, extra = '') => `<button type="button" data-basics="${action}" ${extra}>${label}</button>`;

  let state = initialState();
  let dirty = false;
  let route = 'basics';
  let visibleReviewAnswer = '';

  function storageError() {
    storageMessage.textContent = 'Браузер не сохранил последние шаги. Пока вкладка открыта, можно продолжать.';
  }

  function load() {
    if (dirty) return;
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && Number.isInteger(saved.scene) && scenes[saved.scene] &&
          Number.isInteger(saved.visited) && saved.visited >= 0 && saved.visited <= scenes.length &&
          Number.isSafeInteger(saved.turn) && saved.turn >= 0 &&
          Number.isInteger(saved.question) && reviews[saved.turn % reviews.length][saved.question] &&
          Array.isArray(saved.answers) && saved.answers.every(answer => typeof answer === 'string') &&
          isStepMap(saved.steps) && (saved.remediationSteps === undefined || isStepMap(saved.remediationSteps)) &&
          ['welcome', 'lesson', 'review', 'summary', 'complete'].includes(saved.phase)) {
        state = saved;
        normalizeEvidence(state);
      }
    } catch {
      storageError();
    }
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      dirty = false;
      storageMessage.textContent = '';
    } catch {
      dirty = true;
      storageError();
    }
  }

  function setRoute(next, persist = true) {
    route = next;
    basics.hidden = next !== 'basics';
    advanced.hidden = next !== 'advanced';
    basicsRoute.setAttribute('aria-pressed', String(!basics.hidden));
    advancedRoute.setAttribute('aria-pressed', String(!advanced.hidden));
    if (persist) {
      try {
        localStorage.setItem(routeKey, next);
      } catch {
        storageError();
      }
    }
  }

  function getInitialRoute() {
    try {
      const savedRoute = localStorage.getItem(routeKey);
      if (savedRoute === 'basics' || savedRoute === 'advanced') return savedRoute;
      return window.LinearPilotStore.create(localStorage).state().events.length ? 'advanced' : 'basics';
    } catch {
      return 'basics';
    }
  }

  function updateAdvancedCount() {
    const completed = Number(document.getElementById('position').dataset.completedLessons);
    document.getElementById('advanced-count').textContent = Number.isInteger(completed) && completed >= 0 && completed <= 4
      ? `${completed} из 4 занятий` : 'Прогресс недоступен';
  }

  function balanceView(balance) {
    if (!balance) return '';
    const tilt = balance.tilt || 0;
    const position = { '-1': 'Левая чаша ниже.', 0: 'Чаши на одном уровне.', 1: 'Правая чаша ниже.' }[tilt];
    const tiles = items => items.map(item =>
      `<span class="basics-tile" ${/[x□]/.test(item) ? 'data-box' : ''}>${escape(item)}</span>`).join('');
    const caption = `Слева ${balance.left.join(', ') || 'пусто'}. Справа ${balance.right.join(', ') || 'пусто'}. ${position}`;
    return `<div class="basics-balance" data-basics-balance data-tilt="${tilt}" role="img" aria-label="${escape(caption)}">
      <div class="basics-tray"><b>Слева</b><div class="basics-tiles">${tiles(balance.left)}</div></div>
      <div class="basics-tray"><b>Справа</b><div class="basics-tiles">${tiles(balance.right)}</div></div>
      <div class="basics-beam"></div>
    </div>`;
  }

  function welcomeView() {
    return `<section class="card basics-card"><p class="eyebrow">Первый урок</p>
      <h2>Как найти неизвестное число?</h2>
      <p>Сначала посмотрим на весы и разберём, что означает знак равенства. Потом решим несколько уравнений вместе. В конце ты попробуешь новые примеры самостоятельно.</p>
      <div class="actions">${button('begin', 'Начать урок с нуля')}</div>
      <p class="saved">Можно остановиться и продолжить в этом браузере.</p>
    </section>`;
  }

  function lessonSteps() {
    return state.remediation === undefined ? state.steps : (state.remediationSteps ||= {});
  }

  function lessonView() {
    const index = state.scene;
    const scene = scenes[index];
    const step = lessonSteps()[index] || {};
    const { question, experiment } = scene;
    const after = experiment && step.showExperiment;
    const solved = question && step.option === question.correct;
    const canContinue = (!experiment || step.triedExperiment) && (!question || solved);
    const choice = question?.options[step.option];
    const questionHtml = question && (!experiment || step.triedExperiment) ? `<h3>${escape(question.prompt)}</h3>
      <div class="basics-options">${question.options.map((option, i) => button('choose', escape(option.text),
        `class="secondary" data-option="${i}" aria-pressed="${step.option === i}" ${solved ? 'disabled' : ''} ${solved && step.option === i ? 'data-correct' : ''}`)).join('')}</div>
      <div id="basics-feedback" class="feedback${choice && !solved ? ' error' : ''}" tabindex="-1" role="status">${escape(solved ? question.success : choice?.feedback)}</div>
      ${Array.isArray(step.attempts) && step.attempts.length ? `<details class="basics-history"><summary>История ответов (${step.attemptCount || step.attempts.length})</summary><p class="saved">${step.historyKnown ? `Первая попытка: «${escape(question.options[step.attempts[0].option]?.text)}».` : 'Ранние попытки не были записаны.'} ${(step.attemptCount || 0) > step.attempts.length ? 'Показаны первая и последние попытки. ' : ''}${step.hint ? 'Подсказка открыта.' : step.historyKnown ? 'Подсказка не открывалась.' : 'Ранняя помощь неизвестна.'}</p><ol>${step.attempts.map(attempt => `<li>${escape(question.options[attempt.option]?.text)}${attempt.assisted ? ' · с подсказкой' : ''}</li>`).join('')}</ol></details>` : ''}
      ${step.hint ? `<p class="hint" id="basics-hint" tabindex="-1">${escape(question.hint)}</p>` : ''}
      ${!solved && !step.hint ? button('hint', 'Подсказка', 'class="secondary"') : ''}` : '';
    const nextLabel = state.remediation !== undefined && nextRemediationScene() === -1
      ? 'К результатам' : index === scenes.length - 1 && state.remediation === undefined
        ? 'К самостоятельной проверке' : 'Дальше';

    return `<section class="card basics-card">
      <p class="eyebrow">${state.remediation !== undefined ? 'Повторяем шаг' : `Шаг ${index + 1} из ${scenes.length}`}</p>
      <progress class="basics-progress" max="${scenes.length}" value="${index + 1}" aria-label="Текущий шаг урока"></progress>
      <h2>${escape(scene.title)}</h2>
      <p>${escape(scene.text)}</p>
      <div class="basics-math" data-basics-math>${escape(after ? experiment.math : scene.math)}</div>
      ${balanceView(after ? experiment.balance : scene.balance)}
      ${experiment ? `<div class="actions">${button('experiment', escape(after ? 'Показать до действия' : experiment.label), 'class="secondary"')}</div>
        <p id="basics-experiment" class="feedback" tabindex="-1" role="status">${escape(after ? experiment.text : '')}</p>` : ''}
      ${questionHtml}
      <div class="actions">${button('back', 'Назад', 'class="secondary"')}${button('next', nextLabel, canContinue ? '' : 'disabled')}</div>
    </section>`;
  }

  function currentForm() {
    return reviews[state.turn % reviews.length];
  }

  function nextRemediationScene() {
    return scenes.findIndex((scene, index) => index > state.scene && scene.group === state.remediation);
  }

  function finishRemediation() {
    delete state.remediation;
    delete state.remediationSteps;
    state.phase = 'summary';
  }

  function reviewView() {
    const form = currentForm();
    const index = state.question;
    const item = form[index];
    const label = state.turn < reviews.length ? 'Самостоятельно' : 'Повтор знакомой формы';
    return `<section class="card basics-card">
      <p class="eyebrow">${label} · пример ${index + 1} из ${form.length}</p>
      <h2>Найди значение x</h2>
      <p>Реши на черновике и подставь число вместо x, чтобы проверить себя. Результаты появятся после всей работы.</p>
      <div class="basics-math" data-basics-math>${escape(item.math)}</div>
      <form data-basics-review novalidate>
        <label for="basics-answer">Чему равно x?</label>
        <input id="basics-answer" name="answer" inputmode="numeric" autocomplete="off" maxlength="20" value="${escape(state.answers[index])}" aria-describedby="basics-feedback">
        <p class="feedback error" id="basics-feedback" role="status"></p>
        <div class="actions">${index ? button('back', 'Назад', 'class="secondary"') : ''}
          <button type="submit">${index === form.length - 1 ? 'Проверить работу' : 'Дальше'}</button>
        </div>
      </form>
    </section>`;
  }

  function archiveReview() {
    state.reviewHistory ||= {};
    if (state.reviewHistory[state.turn]) return;
    const form = currentForm();
    state.reviewHistory[state.turn] = {
      turn: state.turn, form: state.turn % reviews.length,
      equations: form.map(item => item.math), answers: state.answers.slice(),
      attempts: JSON.parse(JSON.stringify(state.reviewAttempts || {})),
      attemptCounts: {...state.reviewAttemptCounts},
      provenance: state.reviewEvidenceKnown ? 'recorded' : 'unknown',
      score: form.filter((item, i) => correctAnswer(state.answers[i] || '', item.answer)).length,
      completedAt: Date.now()
    };
    state.reviewHistoryCount = boundedCount(state.reviewHistoryCount, Object.keys(state.reviewHistory).length - 1) + 1;
    const records = Object.values(state.reviewHistory).sort((a,b) => a.turn - b.turn);
    state.reviewHistory = Object.fromEntries(recentWithFirst(records, reviewLimit).map(item => [item.turn,item]));
  }

  function historyView() {
    const records = Object.values(state.reviewHistory || {}).filter(item =>
      item && Number.isInteger(item.turn) && Array.isArray(item.equations) && Array.isArray(item.answers));
    if (!records.length) return '';
    return `<details class="basics-history"><summary>Мои проверенные работы (${state.reviewHistoryCount || records.length})</summary>${state.reviewHistoryCount > records.length ? '<p class="saved">Показаны первая и последние 23 работы.</p>' : ''}${records.map(item =>
      `<section><h3>Работа ${item.turn + 1} · ${item.score} из ${item.equations.length}</h3>
        <p class="saved">${item.provenance === 'recorded' ? 'Первые ответы и исправления сохранены.' : 'Старая запись: первые попытки и помощь неизвестны.'} ${item.turn >= reviews.length ? 'Знакомая форма.' : ''}</p>
        <ol>${item.equations.map((math, i) => `<li>${escape(math)} · ответ ${escape(item.answers[i])}${Array.isArray(item.attempts?.[i]) && item.attempts[i].length ?
          `<br>${(item.attemptCounts?.[i] || 0) > item.attempts[i].length ? 'Первая и последние попытки' : 'Записанные ответы'}: ${item.attempts[i].map(attempt => escape(attempt.answer)).join(' → ')}` : ''}</li>`).join('')}</ol></section>`).join('')}</details>`;
  }

  function resultView() {
    const form = currentForm();
    const passed = state.phase === 'complete';
    const score = form.filter((item, i) => correctAnswer(state.answers[i] || '', item.answer)).length;
    const rows = form.map((item, i) => {
      const answer = state.answers[i];
      const correct = correctAnswer(answer || '', item.answer);
      return `<li><strong>${escape(item.math)}</strong> · твой ответ ${escape(answer)}. ${correct
        ? `Верно. ${escape(item.solution)}`
        : `Проверь это действие. <br>${button('remediate', 'Повторить разбор', `class="secondary" data-group="${item.group}"`)}`}</li>`;
    }).join('');
    return `<section class="card basics-card">
      <p class="eyebrow">${state.turn < reviews.length ? 'Самостоятельная проверка' : 'Повтор знакомой формы'}</p>
      <h2>Верно ${score} из ${form.length}</h2>
      <p>${passed ? 'Теперь можно закрепить эти действия в тренажёре простых уравнений.' : 'Вернись к шагу, который вызвал затруднение. После разбора попробуй другой набор примеров.'}</p>
      ${!state.reviewEvidenceKnown ? '<p class="saved">Старая запись: первые попытки и помощь неизвестны.</p>' : ''}
      <ul class="basics-results">${rows}</ul>
      ${historyView()}
      <div class="actions">${passed
        ? '<a class="basics-button" id="basics-trainer" href="../../trainers/simple-equations-stepwise.html">Перейти к тренажёру</a>'
        : button('retry', state.turn + 1 < reviews.length ? 'Решить другой вариант' : 'Повторить знакомую форму')}</div>
    </section>`;
  }

  function render(focus = false) {
    const view = { welcome: welcomeView, lesson: lessonView, review: reviewView, summary: resultView, complete: resultView };
    screen.dataset.phase = state.phase;
    screen.dataset.turn = state.turn;
    document.getElementById('basics-count').textContent = `${state.visited} из ${scenes.length} шагов`;
    delete screen.dataset.scene;
    delete screen.dataset.question;
    if (state.phase === 'lesson') screen.dataset.scene = state.scene;
    if (state.phase === 'review') {
      screen.dataset.question = state.question;
      visibleReviewAnswer = state.answers[state.question] ?? '';
    }
    screen.innerHTML = view[state.phase]();
    if (focus) screen.focus();
  }

  function showReview() {
    state.phase = 'review';
    state.question = 0;
    state.answers = [];
    state.reviewAttempts = {};
    state.reviewAttemptCounts = {};
    state.reviewEvidenceKnown = true;
  }

  function handleLessonAction(control) {
    const action = control.dataset.basics;
    const step = lessonSteps()[state.scene] ||= {};
    const scene = scenes[state.scene];

    if (action === 'experiment' && scene.experiment) {
      step.triedExperiment = true;
      step.showExperiment = !step.showExperiment;
    } else if (action === 'choose' && scene.question) {
      const option = Number(control.dataset.option);
      if (!scene.question.options[option] || step.option === scene.question.correct) return false;
      if (!Array.isArray(step.attempts)) {
        step.historyKnown = !Number.isInteger(step.option);
        step.attempts = [];
      }
      step.attemptCount = boundedCount(step.attemptCount, step.attempts.length) + 1;
      step.attempts = recentWithFirst([...step.attempts, { option, assisted: !!step.hint, at: Date.now() }], attemptLimit);
      step.option = option;
    } else if (action === 'hint' && scene.question) {
      step.hint = true;
    } else if (action === 'back') {
      if (state.remediation !== undefined) {
        const previous = scenes.findLastIndex((item, i) => i < state.scene && item.group === state.remediation);
        if (previous === -1) {
          finishRemediation();
        } else {
          state.scene = previous;
        }
      } else if (state.scene === 0) {
        state.phase = 'welcome';
      } else {
        state.scene--;
      }
    } else if (action === 'next' && (!scene.experiment || step.triedExperiment) &&
        (!scene.question || step.option === scene.question.correct)) {
      if (state.remediation !== undefined) {
        const next = nextRemediationScene();
        if (next === -1) {
          finishRemediation();
        } else {
          state.scene = next;
        }
      } else {
        state.visited = Math.max(state.visited, state.scene + 1);
        if (state.scene === scenes.length - 1) {
          showReview();
        } else {
          state.scene++;
        }
      }
    } else {
      return false;
    }
    return true;
  }

  screen.addEventListener('click', event => {
    const control = event.target.closest('[data-basics]');
    if (!control) return;
    const action = control.dataset.basics;
    const visiblePhase = screen.dataset.phase;
    const visibleTurn = Number(screen.dataset.turn);
    load();
    if (state.phase !== visiblePhase || state.turn !== visibleTurn ||
        (state.phase === 'lesson' && Number(screen.dataset.scene) !== state.scene) ||
        (state.phase === 'review' && Number(screen.dataset.question) !== state.question)) {
      render(true);
      return;
    }
    if (state.phase === 'welcome' && action === 'begin') {
      state.phase = 'lesson';
      state.scene = 0;
    } else if (state.phase === 'lesson') {
      if (!handleLessonAction(control)) return;
    } else if (state.phase === 'review' && action === 'back' && state.question > 0) {
      state.question--;
    } else if (state.phase === 'summary' && action === 'retry') {
      archiveReview();
      state.turn++;
      showReview();
    } else if (state.phase === 'summary' && action === 'remediate') {
      const group = Number(control.dataset.group);
      const first = scenes.findIndex(scene => scene.group === group);
      if (first === -1) return;
      state.remediation = group;
      state.remediationSteps = {};
      state.scene = first;
      state.phase = 'lesson';
    } else {
      return;
    }
    save();
    const target = { choose: 'basics-feedback', hint: 'basics-hint', experiment: 'basics-experiment' }[action];
    render(!target);
    if (target) {
      const focus = document.getElementById(target);
      const destination = focus?.textContent ? focus : screen.querySelector('[data-basics="experiment"]');
      destination?.focus({ preventScroll: true });
      destination?.scrollIntoView({ block: 'nearest' });
    }
  });

  function syncReviewAnswer(input, submitting = false) {
    load();
    if (state.phase !== 'review' || Number(screen.dataset.turn) !== state.turn ||
        Number(screen.dataset.question) !== state.question ||
        (submitting && input.value === visibleReviewAnswer && input.value !== (state.answers[state.question] ?? ''))) {
      render(true);
      return false;
    }
    state.answers[state.question] = input.value;
    visibleReviewAnswer = input.value;
    save();
    return true;
  }

  screen.addEventListener('input', event => {
    if (event.target.id === 'basics-answer') syncReviewAnswer(event.target);
  });

  screen.addEventListener('submit', event => {
    if (!event.target.matches('[data-basics-review]')) return;
    event.preventDefault();
    const input = event.target.elements.answer;
    if (!syncReviewAnswer(input, true)) return;
    if (!isNumber(input.value)) {
      document.getElementById('basics-feedback').textContent = 'Впиши целое число, например 3. Можно вернуться к этому примеру позже, открыв урок в том же браузере.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    state.reviewAttempts ||= {};
    const attempts = state.reviewAttempts[state.question] ||= [];
    state.reviewAttemptCounts ||= {};
    state.reviewAttemptCounts[state.question] = boundedCount(state.reviewAttemptCounts[state.question], attempts.length) + 1;
    state.reviewAttempts[state.question] = recentWithFirst([...attempts, { answer: input.value, at: Date.now() }], attemptLimit);
    const form = currentForm();
    if (state.question < form.length - 1) {
      state.question++;
    } else {
      state.phase = form.every((item, i) => correctAnswer(state.answers[i] || '', item.answer)) ? 'complete' : 'summary';
      archiveReview();
    }
    save();
    render(true);
  });

  basicsRoute.addEventListener('click', () => {
    load();
    setRoute('basics');
    render(true);
  });
  advancedRoute.addEventListener('click', () => {
    setRoute('advanced');
    document.getElementById('screen').focus();
  });
  window.addEventListener('storage', event => {
    if (event.key === key && route === 'basics' && !dirty && document.activeElement?.id !== 'basics-answer') {
      load();
      render();
    }
  });
  new MutationObserver(updateAdvancedCount).observe(document.getElementById('position'), { attributes: true, attributeFilter: ['data-completed-lessons'] });

  load();
  render();
  updateAdvancedCount();
  setRoute(getInitialRoute(), false);
})();
