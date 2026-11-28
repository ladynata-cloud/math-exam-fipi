/* Standalone practice. The cabinet and shared board retain their existing lesson contract. */
(function () {
  'use strict';

  const entry = document.getElementById('motion-model-entry');
  const host = document.getElementById('motion-model-lab');
  const route = document.getElementById('motion-model-route');
  if (!entry || !host || window.self !== window.top || new URLSearchParams(location.search).get('learning') === '1') return;

  const course = window.MotionModelData;
  const builder = window.MotionModelBuilder;
  if (!course || !builder) return;
  const cases = course.cases;
  const storageKey = 'motion-model-lab-v1';
  const steps = ['read', 'build', 'model', 'solve', 'verify', 'done'];
  const titles = {
    read: 'Что требуется найти?',
    build: 'Построй модель и испытай её',
    model: 'Запиши связь между величинами',
    solve: 'Найди время по своей записи',
    verify: 'Проверь, что произошло на дороге',
    done: 'Результат задачи'
  };
  const resultLabels = { assisted: 'С подсказкой', corrected: 'С исправлениями', independent: 'Самостоятельно' };
  const rank = { assisted: 1, corrected: 2, independent: 3 };
  const fieldKeys = ['question', 'convert', 'reason', 'equation', 'answer', 'answer-unit', 'verify-a', 'verify-b'];
  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  let storageFailed = false;
  function readStore() {
    try {
      const record = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (record && record.version === 1 && record.drafts && typeof record.drafts === 'object' &&
          !Array.isArray(record.drafts) && record.results && typeof record.results === 'object' && !Array.isArray(record.results)) return record;
    } catch { storageFailed = true; }
    return { version: 1, active: cases[0].id, drafts: {}, results: {} };
  }
  const state = readStore();
  let scenario = cases.find(item => item.id === state.active) || cases[0];
  let draft = loadDraft(scenario);
  let releaseBuilder;
  let open = false;
  function loadDraft(item) {
    const saved = state.drafts[item.id] || {};
    return {
      stage: steps.includes(saved.stage) ? saved.stage : 'read',
      fields: Object.fromEntries(fieldKeys.map(key => [key, typeof saved.fields?.[key] === 'string' ? saved.fields[key] : ''])),
      builder: saved.builder && typeof saved.builder === 'object' && !Array.isArray(saved.builder) ? saved.builder : {},
      hints: Array.isArray(saved.hints) ? saved.hints.filter(step => steps.includes(step)) : [],
      revised: saved.revised === true
    };
  }
  function better(a, b) { return (rank[a] || 0) >= (rank[b] || 0) ? a : b; }
  function save() {
    state.active = scenario.id;
    state.drafts[scenario.id] = draft;
    try {
      const latest = readStore();
      // Preserve another tab's drafts and strongest completed result for other cases.
      latest.drafts[scenario.id] = draft;
      latest.active = scenario.id;
      const best = better(state.results[scenario.id], latest.results[scenario.id]);
      if (best) latest.results[scenario.id] = best;
      localStorage.setItem(storageKey, JSON.stringify(latest));
      Object.assign(state.drafts, latest.drafts);
      Object.assign(state.results, latest.results);
    } catch {
      storageFailed = true;
      const notice = host.querySelector('#mm-storage');
      if (notice) notice.hidden = false;
    }
  }
  function option(value, label, selected) {
    return '<option value="' + escape(value) + '"' + (value === selected ? ' selected' : '') + '>' + escape(label) + '</option>';
  }
  function select(key, label, choices) {
    const selected = choices.find(choice => choice.value === draft.fields[key]);
    const caption = key === 'answer-unit' ? '' : '<span class="mm-choice-text" aria-hidden="true">' + escape(selected?.label) + '</span>';
    return '<label class="mm-field" for="mm-' + key + '"><span>' + escape(label) + '</span><select id="mm-' + key + '">' +
      option('', 'Выбери ответ', draft.fields[key]) + choices.map(o => option(o.value, o.label, draft.fields[key])).join('') + '</select>' + caption + '</label>';
  }
  function input(key, label, unit, symbolic) {
    return '<label class="mm-field" for="mm-' + key + '"><span>' + escape(label) +
      '</span><span class="mm-input-row"><input id="mm-' + key + '" type="text" autocomplete="off" spellcheck="false"' +
      (symbolic ? '' : ' inputmode="decimal"') + ' maxlength="' + (symbolic ? 140 : 40) + '" value="' + escape(draft.fields[key]) + '">' +
      (unit ? '<span>' + escape(unit) + '</span>' : '') + '</span></label>';
  }
  function mode() {
    return draft.hints.length ? 'assisted' : (draft.revised || draft.builder.revised === true) ? 'corrected' : 'independent';
  }
  function stepBody() {
    switch (draft.stage) {
      case 'read':
        return select('question', 'Выбери неизвестную величину.', scenario.unknownChoices) +
          input('convert', scenario.unitPrompt, scenario.unitLabel);
      case 'build':
        return '<div id="model-builder">' + builder.markup(scenario, draft.builder) + '</div>';
      case 'model':
        return select('reason', 'Как меняется расстояние между участниками? Объясни почему.', scenario.reasonChoices) +
          input('equation', 'Запиши выражение для времени или составь уравнение. В уравнении обозначь время в часах буквой x или х.', '', true) +
          '<p class="mm-note">Можно писать 2x или 2*x, использовать скобки, дроби и десятичную запятую.</p>';
      case 'solve':
        return '<p class="mm-record"><strong>' + (draft.fields.equation.includes('=') ? 'Твоё уравнение' : 'Твоё выражение') +
          '</strong> <span>' + escape(draft.fields.equation) + '</span></p>' +
          input('answer', 'Сколько времени прошло?', '') +
          select('answer-unit', 'В каких единицах получено время?', ['км', 'мин', 'ч', 'км/ч'].map(unit => ({ value: unit, label: unit })));
      case 'verify':
        return '<p class="mm-record"><strong>Твой ответ</strong> ' + escape(draft.fields.answer) + ' ч.</p><p>' + escape(scenario.sensePrompt) + '</p>' +
          input('verify-a', scenario.senseLabels[0], '') + input('verify-b', scenario.senseLabels[1], '');
      default:
        return '<p class="mm-record"><strong>' + escape(resultLabels[mode()]) + '</strong> · ' + escape(draft.fields.equation) +
          ' · Время — ' + escape(draft.fields.answer) + ' ч.</p><p>' + escape(scenario.checkText) + '</p>';
    }
  }
  function hint() {
    return { read: scenario.unitHint, build: scenario.hints.model, model: scenario.hints.equation,
      solve: draft.fields.equation.includes('=')
        ? 'Выполни одинаковые преобразования в обеих частях уравнения. Затем подставь найденное значение вместо x.'
        : 'Начни с действий в скобках. Проверь, что при делении километров на километры в час получаются часы.',
      verify: scenario.hints.check }[draft.stage] || '';
  }
  function progressLabel(item) {
    const result = state.results[item.id];
    if (rank[result]) return ' · ' + resultLabels[result].toLocaleLowerCase('ru');
    const step = state.drafts[item.id]?.stage;
    return step && step !== 'read' ? ' · в работе' : '';
  }
  function unbind() {
    if (releaseBuilder) releaseBuilder();
    releaseBuilder = null;
  }
  function render(focusId) {
    unbind();
    const index = cases.indexOf(scenario);
    const stepIndex = steps.indexOf(draft.stage);
    const done = draft.stage === 'done';
    const showHint = draft.hints.includes(draft.stage);
    const headings = ['Условие', 'Схема или таблица', 'Связь величин', 'Вычисление', 'Проверка'];
    host.innerHTML =
      '<div class="mm-wrap"><div class="mm-toolbar"><button type="button" id="mm-course">← К занятиям</button>' +
      '<label for="mm-case">Задача <select id="mm-case">' +
      cases.map((item, i) => option(item.id, (i + 1) + '. ' + item.title + progressLabel(item), scenario.id)).join('') +
      '</select></label></div><p id="mm-storage" class="mm-warn" role="status"' + (storageFailed ? '' : ' hidden') +
      '>Черновик доступен до закрытия страницы. Браузер не разрешил сохранить его.</p>' +
      '<h1 id="mm-title" tabindex="-1">Составь модель движения</h1><section class="mm-story" aria-labelledby="mm-story-title">' +
      '<h2 id="mm-story-title" tabindex="-1">' + escape(scenario.title) + '</h2><p>' + escape(scenario.story) + '</p><p class="mm-question"><strong>' + escape(scenario.question) + '</strong></p></section>' +
      '<ol class="mm-steps" aria-label="Шаги решения">' + headings.map((label, i) =>
        '<li' + (i === stepIndex ? ' aria-current="step"' : '') + '>' + (i < stepIndex ? '✓ ' : '') + escape(label) + '</li>').join('') +
      '</ol><section id="mm-stage" class="mm-work" data-step="' + draft.stage + '" aria-labelledby="mm-step-title">' +
      '<h2 id="mm-step-title" tabindex="-1">' + escape(titles[draft.stage]) + '</h2>' + stepBody() +
      '<p id="mm-feedback" class="mm-feedback" role="status" aria-live="polite" aria-atomic="true"></p>' +
      (done ? (index < cases.length - 1 ? '<button class="primary" type="button" id="mm-transfer">Следующая задача →</button>' :
        '<p>Ты дошёл до последней задачи. Результат каждой задачи отмечен в списке вверху.</p>') :
        '<div class="mm-actions"><button type="button" class="primary" id="mm-next">' +
        (draft.stage === 'verify' ? 'Проверить по условию' : 'Проверить и продолжить') + '</button>' +
        (stepIndex > 0 ? '<button type="button" id="mm-back">Назад на шаг</button>' : '') +
        '<button type="button" id="mm-hint" aria-expanded="' + showHint + '" aria-controls="mm-help">' +
        (showHint ? 'Скрыть подсказку' : 'Открыть подсказку') + '</button></div><p id="mm-help" class="mm-help"' +
        (showHint ? '' : ' hidden') + '>' + escape(hint()) + '</p>') +
      '</section><details class="mm-restart"><summary>Начать эту задачу заново</summary>' +
      '<p>Будут очищены твои поля и схема в этой задаче. Лучший результат останется в списке.</p>' +
      '<button type="button" id="mm-reset">Очистить черновик этой задачи</button></details></div>';
    if (draft.stage === 'build') releaseBuilder = builder.bind(host.querySelector('#model-builder'), scenario, draft.builder, () => {
      host.querySelector('#mm-feedback').textContent = '';
      save();
    });
    if (focusId) host.querySelector('#' + focusId)?.focus();
  }
  function selectCase(id) {
    const item = cases.find(c => c.id === id);
    if (!item) return;
    unbind();
    scenario = item;
    draft = loadDraft(item);
    save();
    render('mm-story-title');
  }
  function choiceError(key, choices, correct, blank) {
    const value = draft.fields[key];
    if (value === correct) return '';
    return choices.find(o => o.value === value)?.feedback || blank;
  }
  function issue(key, message) { return [key && 'mm-' + key, message]; }
  function validate() {
    const f = draft.fields;
    let message = '';
    if (draft.stage === 'read') {
      message = choiceError('question', scenario.unknownChoices, scenario.unknown, 'Сначала обозначь, какую величину спрашивают.');
      if (message) return issue('question', message);
      if (!course.checkNumber(f.convert, scenario.unitAnswer)) return issue('convert', f.convert ? scenario.unitHint : 'Запиши величину в указанных единицах.');
    }
    if (draft.stage === 'build') {
      const result = builder.check(scenario, draft.builder);
      if (!result.ok) {
        if (result.incorrect) draft.revised = true;
        return issue(null, result.message);
      }
    }
    if (draft.stage === 'model') {
      message = choiceError('reason', scenario.reasonChoices, scenario.reason, 'Выбери объяснение для своего рисунка или таблицы.');
      if (message) return issue('reason', message);
      const result = course.checkEquation(scenario, f.equation);
      if (!result.ok) return issue('equation', result.message);
    }
    if (draft.stage === 'solve') {
      if (!course.checkNumber(f.answer, scenario.answer)) return issue('answer', f.answer ?
        (f.equation.includes('=')
          ? 'Уравнение уже проверено. Подставь своё число вместо x и сравни две части.'
          : 'Выражение уже проверено. Пересчитай его по действиям, начиная со скобок.') : 'Впиши найденное время.');
      if (f['answer-unit'] !== scenario.answerUnit) return issue('answer-unit', 'Вернись к вопросу задачи. В каких единицах нужно назвать время?');
    }
    if (draft.stage === 'verify') {
      for (const [i, key] of ['verify-a', 'verify-b'].entries()) {
        if (!course.checkNumber(f[key], scenario.senseAnswers[i])) return issue(key,
          'Проверь отметку для участника «' + scenario.actors[i].label + '». Учти положение в начале отсчёта, направление и путь за найденное время.');
      }
    }
    return null;
  }
  function advance() {
    const error = validate();
    if (error) {
      // Missing fields are an invitation to finish a step, not a mathematical error.
      if (error[0] && draft.fields[error[0].slice(3)]) draft.revised = true;
      save();
      const status = host.querySelector('#mm-feedback');
      status.textContent = error[1];
      if (error[0]) {
        const input = host.querySelector('#' + error[0]);
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', 'mm-feedback');
        input.focus();
      }
      return;
    }
    draft.stage = steps[steps.indexOf(draft.stage) + 1];
    if (draft.stage === 'done') state.results[scenario.id] = better(mode(), state.results[scenario.id]);
    save();
    render('mm-step-title');
  }
  function rememberField(event) {
    const control = event.target;
    const key = control.id?.slice(3);
    if (!control.id?.startsWith('mm-') || !fieldKeys.includes(key)) return;
    draft.fields[key] = control.value;
    const caption = control.parentElement?.querySelector('.mm-choice-text');
    if (caption && control.selectedOptions) caption.textContent = control.value ? control.selectedOptions[0].textContent : '';
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
    host.querySelector('#mm-feedback').textContent = '';
    save();
  }
  host.addEventListener('input', rememberField);
  host.addEventListener('change', event => {
    if (event.target.id === 'mm-case') selectCase(event.target.value);
    else rememberField(event);
  });
  host.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing && event.target.matches('input[id^="mm-"]')) {
      event.preventDefault();
      advance();
    }
  });
  host.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    switch (button.id) {
      case 'mm-next': advance(); break;
      case 'mm-back':
        draft.stage = steps[steps.indexOf(draft.stage) - 1];
        save();
        render('mm-step-title');
        break;
      case 'mm-hint': {
        const panel = host.querySelector('#mm-help');
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        button.textContent = panel.hidden ? 'Открыть подсказку' : 'Скрыть подсказку';
        if (!draft.hints.includes(draft.stage)) draft.hints.push(draft.stage);
        save();
        break;
      }
      case 'mm-reset':
        delete state.drafts[scenario.id];
        draft = loadDraft(scenario);
        save();
        render('mm-step-title');
        break;
      case 'mm-transfer':
        selectCase(cases[cases.indexOf(scenario) + 1]?.id);
        break;
      case 'mm-course':
        if (typeof history.state?.motionModelFrom === 'string') history.back();
        else {
          location.hash = '';
          syncView();
        }
        break;
    }
  });
  function syncView() {
    const active = location.hash === '#model';
    if (active === open) return;
    open = active;
    if (open) {
      const play = document.getElementById('play');
      if (play && play.textContent.includes('Пауза')) play.click();
    }
    document.body.classList.toggle('motion-model-open', open);
    host.hidden = !open;
    if (route) route.hidden = !open;
    if (open) render('mm-title');
    else {
      unbind();
      host.replaceChildren();
      entry.focus();
    }
  }
  entry.hidden = false;
  entry.addEventListener('click', () => {
    try {
      history.pushState({ motionModelFrom: location.hash }, '', '#model');
    } catch { location.hash = 'model'; }
    syncView();
  });
  window.addEventListener('hashchange', syncView);
  window.addEventListener('popstate', syncView);
  syncView();
})();
