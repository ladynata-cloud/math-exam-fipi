/* Public UI contract: __logTrainer.getState() returns {schema:1, taskId, work,
 * history}. work[taskId] has mode, stage (0..5), accepted, domain, transform,
 * critical, signs (atom-indexed ''/'-1'/'1'), answer (atom indices), errors,
 * helps, complete. Independent stages: 2 then 4. Guided stages: 0..4.
 * applyState validates remote data and never writes storage or emits changes.
 * Controls: #check-step, #continue-step, select[data-sign], button[data-cell].
 */
(function () {
  'use strict';
  const E = window.LogInequalities;
  const $ = id => document.getElementById(id);
  if (!E || !Array.isArray(E.tasks) || !E.tasks.length) {
    $('exercise').innerHTML = '<p class="loading-error">Не удалось загрузить задачи. Обновите страницу, когда появится связь.</p>';
    return;
  }
  const STORAGE_KEY = 'mathExam.profileLogInequalities.v1';
  const MODES = ['example', 'guided', 'independent'];
  const KEYS = ['domain', 'transform', 'critical', 'signs', 'answer'];
  const TITLES = ['Область определения', 'Преобразование', 'Критические точки', 'Знаки на интервалах', 'Запись ответа'];
  const SHORT = ['ОДЗ', 'Переход', 'Точки', 'Знаки', 'Ответ'];
  const taskMap = new Map(E.tasks.map(task => [task.id, task]));
  const familyMap = new Map(E.families.map(family => [family.id, family]));
  const embedded = window.parent !== window || new URLSearchParams(location.search).get('groupLesson') === '1';
  const listeners = new Set();
  let observedStorage = null;
  let storageLocked = false;
  let storageUnavailable = false;
  let stale = false;
  let newerState = null;
  let pendingMode = null;
  let state = { schema: 1, taskId: E.tasks[0].id, work: {}, history: [] };

  function blank(task, mode) {
    return { mode: mode || 'guided', stage: mode === 'independent' ? 2 : 0,
      accepted: false, domain: [], transform: '', critical: '',
      signs: Array(task.domainCells.length).fill(''), answer: [], errors: 0,
      helps: 0, complete: false, hintOpen: false, preparationOpen: false, emptyDeclared: false, familiar: false, feedback: { kind: '', message: '' } };
  }
  function task() { return taskMap.get(state.taskId); }
  function attempt() {
    if (!state.work[state.taskId]) state.work[state.taskId] = blank(task());
    return state.work[state.taskId];
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function plain(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }
  function exactKeys(value, expected) {
    return plain(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
  }
  function uniqueArray(value, max, valid) {
    return Array.isArray(value) && value.length <= max && new Set(value).size === value.length && value.every(valid);
  }
  function boundedCounter(value) { return Number.isInteger(value) && value >= 0 && value <= 9999; }
  function validate(value) {
    try {
      if (new Blob([JSON.stringify(value)]).size > 59000 || !exactKeys(value, ['schema', 'taskId', 'work', 'history']) || value.schema !== 1 || !taskMap.has(value.taskId) || !plain(value.work)) return false;
      if (Object.keys(value.work).length > E.tasks.length || !Object.hasOwn(value.work, value.taskId)) return false;
      for (const [id, a] of Object.entries(value.work)) {
        const t = taskMap.get(id);
        if (!t || !exactKeys(a, ['mode', 'stage', 'accepted', 'domain', 'transform', 'critical', 'signs', 'answer', 'errors', 'helps', 'complete', 'hintOpen', 'preparationOpen', 'emptyDeclared', 'familiar', 'feedback'])) return false;
        if (!MODES.includes(a.mode) || !Number.isInteger(a.stage) || a.stage < 0 || a.stage > 5 || typeof a.accepted !== 'boolean' || typeof a.complete !== 'boolean') return false;
        if (a.complete !== (a.stage === 5) || (a.complete && a.accepted) || (a.mode === 'independent' && ![2, 4, 5].includes(a.stage))) return false;
        if (!uniqueArray(a.domain, t.domainChoices.length, id2 => typeof id2 === 'string' && t.domainChoices.some(c => c.id === id2))) return false;
        if (typeof a.transform !== 'string' || (a.transform && !t.transformChoices.some(c => c.id === a.transform))) return false;
        if (typeof a.critical !== 'string' || a.critical.length > 160 || /[<>\u0000-\u0008]/.test(a.critical)) return false;
        if (!Array.isArray(a.signs) || a.signs.length !== t.domainCells.length || !a.signs.every(sign => ['', '-1', '1'].includes(sign))) return false;
        if (!uniqueArray(a.answer, t.domainCells.length, index => Number.isInteger(index) && index >= 0 && index < t.domainCells.length && t.domainCells[index])) return false;
        if (!boundedCounter(a.errors) || !boundedCounter(a.helps) || typeof a.hintOpen !== 'boolean' || typeof a.preparationOpen !== 'boolean' || typeof a.emptyDeclared !== 'boolean' || typeof a.familiar !== 'boolean') return false;
        if (!exactKeys(a.feedback, ['kind', 'message']) || !['', 'success', 'error'].includes(a.feedback.kind) || typeof a.feedback.message !== 'string' || a.feedback.message.length > 500 || /<\/?[a-z][^>]*>/i.test(a.feedback.message) || /[\u0000-\u0008]/.test(a.feedback.message)) return false;
      }
      if (!uniqueArray(value.history.map(record => record.taskId), E.tasks.length, id => taskMap.has(id))) return false;
      for (const r of value.history) {
        if (!exactKeys(r, ['taskId', 'mode', 'assisted', 'errors', 'helps', 'familiar']) || !MODES.includes(r.mode) || typeof r.assisted !== 'boolean' || typeof r.familiar !== 'boolean' || !boundedCounter(r.errors) || !boundedCounter(r.helps)) return false;
      }
      return true;
    } catch (_) { return false; }
  }
  function notice(text) {
    $('storage-notice').textContent = text;
    $('storage-notice').hidden = !text;
  }
  function decode(raw) {
    try {
      const parsed = JSON.parse(raw);
      return validate(parsed) ? parsed : null;
    } catch (_) { return null; }
  }
  function load() {
    if (embedded) return;
    try {
      observedStorage = localStorage.getItem(STORAGE_KEY);
      if (observedStorage === null) return;
      const saved = decode(observedStorage);
      if (saved) state = saved;
      else {
        storageLocked = true;
        notice('Сохранённая работа имеет другой или повреждённый формат. Она оставлена без изменений. Сейчас можно решать и скачать отчёт; эта новая работа не сохраняется в браузере.');
      }
    } catch (_) {
      storageUnavailable = true;
      notice('Браузер не разрешил сохранять работу. Решать можно; перед закрытием страницы скачайте отчёт.');
    }
  }
  function persist() {
    if (embedded || storageLocked || storageUnavailable || stale) return;
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current !== observedStorage) {
        observeOther(current);
        return;
      }
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
      observedStorage = serialized;
    } catch (_) {
      storageUnavailable = true;
      notice('Не получилось сохранить последние изменения. Не закрывайте страницу до скачивания отчёта.');
      updateSaveStatus();
    }
  }
  function changed() {
    persist();
    for (const listener of listeners) listener();
    updateReport();
  }
  function observeOther(raw) {
    if (raw === observedStorage || embedded) return;
    stale = true;
    newerState = decode(raw);
    $('load-newer').hidden = !newerState;
    notice(newerState ? 'В другой вкладке есть более новая работа. Эта вкладка приостановлена, чтобы её не затереть. Откройте новую работу кнопкой ниже.' : 'Сохранение изменилось в другой вкладке. Эта вкладка приостановлена, чтобы не затереть данные. Можно скачать текущий отчёт.');
    lockControls();
    updateSaveStatus();
  }
  function lockControls() {
    document.querySelectorAll('#exercise button, #exercise input, #exercise select, #topics button[data-task], .mode-bar button').forEach(control => { if (stale) control.disabled = true; });
  }
  function updateSaveStatus() {
    $('save-status').textContent = embedded ? 'Работа открыта на доске. Локальное сохранение в браузере отключено.' : stale ? 'Эта вкладка приостановлена: сохранение изменилось.' : storageLocked || storageUnavailable ? 'Эта работа сейчас не сохраняется в браузере. Скачайте отчёт.' : 'Прогресс хранится только в этом браузере. В другой браузер он автоматически не переносится.';
  }
  function node(tag, text, className) {
    const result = document.createElement(tag);
    if (text !== undefined && text !== null) result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  function htmlNode(tag, html, className) {
    const result = node(tag, null, className);
    result.innerHTML = html;
    return result;
  }
  function shuffled(choices, salt) {
    let seed = 2166136261;
    for (const char of `${state.taskId}:${salt}`) { seed ^= char.charCodeAt(0); seed = Math.imul(seed, 16777619) >>> 0; }
    const result = choices.slice();
    for (let i = result.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  function pointLabel(index) { return task().criticalPoints[index].label; }
  function atomLabel(index) {
    const n = task().criticalPoints.length;
    if (index % 2) return `x = ${pointLabel((index - 1) / 2)}`;
    const gap = index / 2;
    return `(${gap === 0 ? '−∞' : pointLabel(gap - 1)}; ${gap === n ? '+∞' : pointLabel(gap)})`;
  }
  function currentSet() {
    const selected = new Set(attempt().answer);
    return E.formatSet(task(), task().domainCells.map((_, index) => selected.has(index)));
  }
  function readNumber(text) {
    const cleaned = text.trim().replace(/−/g, '-').replace(/,/g, '.').replace(/\s/g, '');
    const parts = cleaned.split('/');
    if (!parts.length || parts.length > 2 || !parts.every(part => /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(part))) return null;
    const result = parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(parts[0]);
    return Number.isFinite(result) ? result : null;
  }
  function criticalValues(raw) {
    const parts = raw.trim().split(';');
    if (!raw.trim() || parts.some(part => !part.trim())) return null;
    const values = parts.map(readNumber);
    if (values.some(value => value === null)) return null;
    values.sort((a, b) => a - b);
    return values;
  }
  function checkStage(t, a) {
    if (a.stage === 0) {
      const wrong = t.domainChoices.find(choice => a.domain.includes(choice.id) && !choice.correct);
      if (wrong) return { ok: false, message: wrong.why || 'Это условие не требуется для исходного неравенства. Проверьте определение логарифма.' };
      const missing = t.domainChoices.find(choice => choice.correct && !a.domain.includes(choice.id));
      if (missing) return { ok: false, message: 'Не все ограничения отмечены. Проверьте каждый аргумент и каждое основание логарифма, а также знаменатели.' };
      return { ok: true };
    }
    if (a.stage === 1) {
      const choice = t.transformChoices.find(item => item.id === a.transform);
      if (!choice) return { ok: false, message: 'Выберите одно преобразование.' };
      return { ok: !!choice.correct, message: choice.why || 'Проверьте, что при преобразовании сохранены знак неравенства и все ограничения ОДЗ.' };
    }
    if (a.stage === 2) {
      const values = criticalValues(a.critical);
      if (!values) return { ok: false, message: 'Запишите числа через точку с запятой. Дробь можно написать как 3/2 или 1,5. Например: −2; 0; 1,5.' };
      const expected = t.criticalPoints.map(point => point.value);
      const matches = values.map(value => expected.findIndex(point => Math.abs(value - point) < 1e-9 * Math.max(1, Math.abs(point))));
      if (matches.includes(-1)) return { ok: false, message: 'Есть точка, которая не является нулём выражения или границей ОДЗ. Проверьте уравнения, из которых получились эти значения.' };
      if (new Set(matches).size !== matches.length) return { ok: false, message: 'Одинаковую точку нужно записать один раз, даже если она получилась из нескольких условий.' };
      const required = expected.map((_, index) => index).filter(index => t.domainCells[2 * index] || t.domainCells[2 * index + 1] || t.domainCells[2 * index + 2]);
      if (!required.every(index => matches.includes(index))) return { ok: false, message: `Здесь нужно учесть ${required.length} различных точек, важных внутри ОДЗ или на её границе. Проверьте нули и запрещённые граничные значения. Точки целиком вне ОДЗ можно не записывать.` };
      return { ok: true };
    }
    if (a.stage === 3) {
      const permitted = t.domainCells.map((allowed, index) => allowed && index % 2 === 0 ? index : -1).filter(index => index >= 0);
      if (permitted.some(index => !a.signs[index])) return { ok: false, message: 'Поставьте знак на каждом разрешённом интервале. Серые интервалы уже исключены по ОДЗ.' };
      const wrong = permitted.find(index => Number(a.signs[index]) !== t.rationalSigns[index]);
      if (wrong !== undefined) return { ok: false, message: `На интервале ${atomLabel(wrong)} знак другой. Возьмите любое внутреннее значение x и определите знаки множителей. Чётная степень не меняет знак при переходе через нуль.` };
      return { ok: true };
    }
    if (a.stage === 4) {
      if (!a.answer.length && !a.emptyDeclared) return { ok: false, message: 'Выберите интервалы и точки ответа. Если решений нет, нажмите «Нет решений».' };
      const selected = new Set(a.answer);
      const wrong = t.solutionCells.findIndex((solves, index) => solves !== selected.has(index));
      if (wrong >= 0) return { ok: false, message: wrong % 2 ? 'Проверьте отдельные граничные точки. При строгом неравенстве нуль не включают; при нестрогом его можно включить только внутри ОДЗ.' : 'Проверьте выбранные интервалы: нужны одновременно подходящий знак и выполнение ОДЗ. Отдельные границы выбираются своей кнопкой.' };
      return { ok: true };
    }
    return { ok: false, message: 'Этот шаг уже завершён.' };
  }
  function fillChoices(kind) {
    const a = attempt();
    const choices = kind === 'domain' ? task().domainChoices : task().transformChoices;
    const list = node('fieldset', null, 'choices');
    const legend = node('legend', kind === 'domain' ? 'Отметьте все необходимые условия' : 'Выберите равносильный переход на ОДЗ');
    list.append(legend);
    for (const choice of shuffled(choices, kind)) {
      const label = node('label', null, 'choice');
      const input = document.createElement('input');
      input.type = kind === 'domain' ? 'checkbox' : 'radio';
      input.name = kind;
      input.value = choice.id;
      input.checked = kind === 'domain' ? a.domain.includes(choice.id) : a.transform === choice.id;
      input.disabled = a.accepted || stale;
      input.addEventListener('change', () => {
        if (stale || a.accepted) return;
        if (kind === 'domain') a.domain = [...list.querySelectorAll('input:checked')].map(item => item.value);
        else a.transform = input.value;
        clearFeedback(); changed();
      });
      const content = htmlNode('span', choice.html, 'choice-content');
      label.append(input, content); list.append(label);
    }
    $('stage-fields').append(list);
  }
  function fillCritical() {
    const label = node('label', 'Критические точки, от меньшей к большей', 'text-label');
    label.htmlFor = 'critical-input';
    const input = document.createElement('input');
    input.id = 'critical-input'; input.className = 'text-input'; input.type = 'text';
    input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 160;
    input.value = attempt().critical; input.disabled = attempt().accepted || stale;
    input.setAttribute('aria-describedby', 'critical-help');
    input.addEventListener('input', () => { if (stale || attempt().accepted) return; attempt().critical = input.value.replace(/[<>\u0000-\u0008]/g, ''); clearFeedback(); changed(); });
    const help = node('p', 'Разделяйте числа точкой с запятой. Дроби: 3/2 или 1,5. Найдите нули и границы ОДЗ. Точки целиком вне ОДЗ можно пропустить.', 'input-help'); help.id = 'critical-help';
    $('stage-fields').append(label, input, help);
  }
  function signsTable(showAnswers) {
    const t = task(); const a = attempt();
    const wrapper = node('div'); const table = node('div', null, 'sign-table');
    for (let index = 0; index < t.domainCells.length; index += 2) {
      const row = node('div', null, `sign-row${t.domainCells[index] ? '' : ' forbidden'}`);
      row.append(node('span', atomLabel(index), 'interval-label'));
      if (!t.domainCells[index]) row.append(node('span', 'Вне ОДЗ', 'cell-note'));
      else if (showAnswers) row.append(node('strong', t.rationalSigns[index] > 0 ? '+' : '−'));
      else {
        const select = document.createElement('select'); select.dataset.sign = String(index);
        select.setAttribute('aria-label', `Знак на интервале ${atomLabel(index)}`);
        for (const [value, label] of [['', 'Знак?'], ['1', '+'], ['-1', '−']]) { const option = node('option', label); option.value = value; select.append(option); }
        select.value = a.signs[index]; select.disabled = a.accepted || stale;
        select.addEventListener('change', () => { if (stale || a.accepted) return; a.signs[index] = select.value; clearFeedback(); changed(); });
        row.append(select);
      }
      table.append(row);
    }
    wrapper.append(table);
    const notes = node('div', null, 'point-notes');
    notes.append(node('strong', 'Отдельные точки'));
    for (let index = 1; index < t.domainCells.length; index += 2) {
      notes.append(node('div', `${atomLabel(index)}: ${!t.domainCells[index] ? 'не входит в ОДЗ' : t.rationalSigns[index] === 0 ? 'значение выражения равно нулю' : `выражение имеет знак «${t.rationalSigns[index] > 0 ? '+' : '−'}»`}.`));
    }
    wrapper.append(notes); return wrapper;
  }
  function fillAnswer() {
    const a = attempt(); const t = task();
    const list = node('div', null, 'answer-cells'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Интервалы и отдельные точки ответа');
    for (let index = 0; index < t.domainCells.length; index++) {
      const button = node('button', atomLabel(index)); button.type = 'button';
      button.dataset.cell = String(index); button.dataset.cellType = index % 2 ? 'point' : 'interval';
      button.setAttribute('aria-pressed', String(a.answer.includes(index)));
      button.disabled = !t.domainCells[index] || a.accepted || stale;
      if (!t.domainCells[index]) { button.append(node('span', ' · вне ОДЗ', 'cell-note')); }
      button.addEventListener('click', () => {
        if (stale || a.accepted) return;
        if (a.answer.includes(index)) a.answer = a.answer.filter(value => value !== index);
        else a.answer.push(index);
        a.answer.sort((x, y) => x - y); a.emptyDeclared = false;
        $('no-solutions').setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-pressed', String(a.answer.includes(index)));
        $('answer-preview').textContent = `Ответ: ${currentSet()}`;
        clearFeedback(); changed();
      });
      list.append(button);
    }
    const noSolutions = node('button', 'Нет решений'); noSolutions.id = 'no-solutions'; noSolutions.type = 'button'; noSolutions.disabled = a.accepted || stale; noSolutions.setAttribute('aria-pressed', String(a.emptyDeclared));
    noSolutions.addEventListener('click', () => { if (stale || a.accepted) return; a.answer = []; a.emptyDeclared = !a.emptyDeclared; clearFeedback(); changed(); render(); });
    const preview = node('div', a.answer.length || a.emptyDeclared ? `Ответ: ${currentSet()}` : 'Ответ пока не выбран', 'answer-preview'); preview.id = 'answer-preview'; preview.setAttribute('aria-live', 'polite');
    const note = node('p', 'Нажмите нужные интервалы и отдельно нужные точки. Повторное нажатие снимает выбор. Если решений нет, нажмите «Нет решений».', 'input-help');
    $('stage-fields').append(list, noSolutions, preview, note);
  }
  function solutionPart(stage) {
    const t = task(); const fragment = document.createDocumentFragment();
    if (stage === 0) {
      for (const choice of t.domainChoices.filter(item => item.correct)) fragment.append(htmlNode('div', choice.html));
    } else if (stage === 1) fragment.append(htmlNode('div', t.transformChoices.find(item => item.correct).html));
    else if (stage === 2) {
      fragment.append(node('p', t.criticalPoints.map(point => point.label).join('; ')));
      if (t.criticalPoints.some((_, index) => !t.domainCells[2 * index] && !t.domainCells[2 * index + 1] && !t.domainCells[2 * index + 2])) fragment.append(node('p', 'Точки целиком вне ОДЗ здесь приведены для полноты. В своём решении их можно не выписывать.', 'small muted'));
    }
    else if (stage === 3) fragment.append(signsTable(true));
    else fragment.append(node('p', t.answerText, 'final-answer'));
    fragment.append(node('p', t.explanation[KEYS[stage]]));
    return fragment;
  }
  function renderNotebook() {
    const a = attempt(); const list = $('notebook'); list.replaceChildren();
    const stages = a.mode === 'independent' ? [2, 4] : [0, 1, 2, 3, 4];
    for (const stage of stages) {
      if (!(stage < a.stage || (stage === a.stage && a.accepted))) continue;
      const item = node('li'); item.append(node('h4', `${stage + 1}. ${TITLES[stage]}`));
      if (a.mode === 'independent' && stage === 2) item.append(node('p', a.critical));
      else item.append(solutionPart(stage));
      list.append(item);
    }
    $('notebook-section').hidden = list.children.length === 0;
  }
  function renderTrack() {
    const a = attempt(); $('step-track').replaceChildren();
    for (let stage = 0; stage < 5; stage++) {
      const item = node('li', `${stage + 1}. ${SHORT[stage]}`);
      if (stage < a.stage || stage === a.stage && a.accepted) item.className = 'done';
      if (stage === a.stage && !a.accepted) { item.className = 'current'; item.setAttribute('aria-current', 'step'); }
      if (a.mode === 'independent' && [0, 1, 3].includes(stage)) { item.className = ''; item.title = 'Этот этап выполните самостоятельно на бумаге'; }
      $('step-track').append(item);
    }
  }
  function renderStage() {
    const a = attempt(); const t = task();
    document.querySelector('.current-step').hidden = a.complete;
    $('completion').hidden = !a.complete;
    if (a.complete) {
      $('completion-answer').textContent = `Ответ: ${t.answerText}`;
      $('completion-status').textContent = outcomeText(a);
      return;
    }
    $('stage-counter').textContent = a.mode === 'example' ? `Разбор · шаг ${a.stage + 1} из 5` : a.mode === 'independent' ? 'Самостоятельное решение' : `Шаг ${a.stage + 1} из 5`;
    $('stage-title').textContent = TITLES[a.stage];
    const descriptions = [
      'Логарифм существует, если его аргумент положителен, основание положительно и не равно 1. Проверьте также знаменатели.',
      'При сравнении аргументов учтите основание: при основании больше 1 знак сохраняется, при основании между 0 и 1 — меняется. Рационализация учитывает оба случая. Обозначения и нужные правила — в «Что нужно вспомнить».',
      'Найдите нули внутри ОДЗ и границы области определения. Точки целиком вне ОДЗ можно не записывать: для решения они не нужны.',
      'Определите знак полученного выражения внутри каждого допустимого интервала. Запрещённые по ОДЗ интервалы уже отмечены.',
      'Выберите части числовой прямой, которые одновременно подходят по знаку неравенства и принадлежат ОДЗ.'
    ];
    $('stage-description').textContent = a.mode === 'example' ? 'Нажмите кнопку, чтобы открыть этот шаг. Каждый открытый шаг останется выше, в записи решения.' : a.mode === 'independent' && a.stage === 2 ? 'Решите неравенство на бумаге. Здесь сначала запишите необходимые критические точки, затем соберите ответ. Промежуточные преобразования выполните самостоятельно.' : descriptions[a.stage];
    $('stage-fields').replaceChildren();
    if (a.mode !== 'example') {
      if (a.stage === 0) fillChoices('domain');
      else if (a.stage === 1) fillChoices('transform');
      else if (a.stage === 2) fillCritical();
      else if (a.stage === 3) $('stage-fields').append(signsTable(false));
      else fillAnswer();
    }
    $('check-step').hidden = a.mode === 'example' || a.accepted;
    $('check-step').textContent = a.stage === 4 ? 'Проверить ответ' : 'Проверить шаг';
    $('continue-step').hidden = a.mode !== 'example' && !a.accepted;
    $('continue-step').textContent = a.mode === 'example' ? `Открыть шаг ${a.stage + 1}` : a.stage === 4 ? 'Завершить решение' : 'Продолжить';
    $('hint-button').hidden = a.mode === 'example' || a.accepted;
    $('hint').textContent = t.hints[KEYS[a.stage]];
    $('hint').hidden = !a.hintOpen;
    $('feedback').textContent = a.feedback.message || (a.accepted ? 'Верно. Запись сохранена выше. Продолжайте, когда будете готовы.' : '');
    $('feedback').dataset.kind = a.feedback.kind || (a.accepted ? 'success' : '');
  }
  function renderTopics() {
    $('topic-list').replaceChildren();
    E.families.forEach((family, index) => {
      const section = node('section', null, 'topic-card'); section.dataset.family = family.id;
      section.append(node('h3', `${index + 1}. ${family.title}`), node('p', family.goal));
      const actions = node('div', null, 'topic-actions');
      for (const t of E.tasks.filter(item => item.familyId === family.id)) {
        const saved = state.work[t.id];
        const button = node('button', `Задача ${t.variant + 1}${saved?.complete ? ' ✓' : saved ? ' · начата' : ''}`);
        button.type = 'button'; button.dataset.task = t.id; button.setAttribute('aria-current', String(t.id === state.taskId));
        button.disabled = stale;
        button.addEventListener('click', () => { $('topics').close(); chooseTask(t.id); });
        actions.append(button);
      }
      section.append(actions); $('topic-list').append(section);
    });
  }
  function render() {
    const t = task(); const a = attempt(); const family = familyMap.get(t.familyId);
    $('task-position').textContent = `Тема ${E.families.findIndex(item => item.id === t.familyId) + 1} из ${E.families.length} · задача ${t.variant + 1} из 4`;
    $('task-title').textContent = family.title;
    $('task-goal').textContent = family.goal;
    $('current-formula').innerHTML = t.formulaHtml;
    $('progress-chip').textContent = a.complete ? 'Завершено' : a.mode === 'example' ? 'Разбираем пример' : 'Можно идти в своём темпе';
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === a.mode)));
    $('mode-description').textContent = a.mode === 'example' ? 'Смотрю решение по одному шагу. Этот результат отметится как разобранный пример.' : a.mode === 'guided' ? 'Решаю сам с вопросами по каждому шагу. Можно попросить подсказку.' : 'Выполняю решение на бумаге и проверяю границы и ответ. Подсказка будет отмечена в результате.';
    $('preparation-content').replaceChildren();
    for (const part of t.preparation) {
      const section = node('div'); section.append(node('h3', part.title));
      if (part.html) section.append(htmlNode('div', part.html));
      else if (part.text) section.append(node('p', part.text));
      $('preparation-content').append(section);
    }
    $('preparation').open = a.preparationOpen;
    renderTrack(); renderNotebook(); renderStage(); renderTopics(); updateReport(); updateSaveStatus(); lockControls();
  }
  function clearFeedback() {
    attempt().feedback = { kind: '', message: '' };
    $('feedback').textContent = ''; $('feedback').dataset.kind = '';
  }
  function refreshStep() { render(); (attempt().complete ? $('completion-title') : $('stage-title')).focus({ preventScroll: true }); }
  function outcomeText(a) {
    if (a.familiar) return 'Повтор знакомой задачи. Результат не считается новой самостоятельной проверкой.';
    if (a.mode === 'example') return 'Разобран пример. Теперь можно проверить себя на похожей задаче.';
    if (a.mode === 'guided') return a.helps ? 'Решено по шагам с подсказкой.' : 'Решено по шагам без дополнительных подсказок.';
    return a.helps ? 'Решено с подсказкой.' : a.errors ? 'Решено самостоятельно после исправления ошибок.' : 'Решено самостоятельно.';
  }
  function finish() {
    const a = attempt(); a.stage = 5; a.complete = true; a.accepted = false;
    const record = { taskId: state.taskId, mode: a.mode, assisted: a.mode !== 'independent' || a.helps > 0, errors: a.errors, helps: a.helps, familiar: a.familiar };
    const previous = state.history.findIndex(item => item.taskId === state.taskId);
    if (previous < 0) state.history.push(record);
    else {
      const score = r => r.familiar ? 0 : r.mode === 'independent' && !r.assisted ? 5 : r.mode === 'guided' && !r.helps ? 3 : r.mode !== 'example' ? 2 : 1;
      if (score(record) >= score(state.history[previous])) state.history[previous] = record;
    }
  }
  function nextStage() {
    if (stale) return;
    const a = attempt();
    if (a.complete || (a.mode !== 'example' && !a.accepted)) return;
    clearFeedback(); a.hintOpen = false;
    if (a.stage === 4) finish();
    else { a.stage = a.mode === 'independent' ? 4 : a.stage + 1; a.accepted = false; }
    changed(); refreshStep();
  }
  function chooseTask(id, replaceHash) {
    if (stale || !taskMap.has(id)) return;
    state.taskId = id; attempt(); pendingMode = null;
    $('mode-confirm').hidden = true;
    if (replaceHash !== false) { try { history.replaceState(null, '', `#task/${encodeURIComponent(id)}`); } catch (_) {} }
    changed(); render(); $('task-title').focus();
  }
  function hasDraft(a) {
    return a.stage !== (a.mode === 'independent' ? 2 : 0) || a.accepted || a.domain.length || a.transform || a.critical || a.signs.some(Boolean) || a.answer.length || a.errors || a.helps;
  }
  function changeMode(mode) {
    if (stale || !MODES.includes(mode)) return;
    const previous = attempt();
    const familiar = previous.familiar || previous.complete || state.history.some(r => r.taskId === state.taskId) || previous.helps > 0 || previous.errors > 0 || previous.accepted || previous.stage > (previous.mode === 'independent' ? 2 : 0);
    state.work[state.taskId] = blank(task(), mode); state.work[state.taskId].familiar = familiar; pendingMode = null; clearFeedback();
    $('mode-confirm').hidden = true; changed(); refreshStep();
  }
  function updateReport() {
    const completed = state.history.length;
    const independent = state.history.filter(item => item.mode === 'independent' && !item.assisted && !item.familiar).length;
    $('progress-summary').textContent = `Завершено разных задач: ${completed} из ${E.tasks.length}. Из них самостоятельно: ${independent}.`;
    const lines = ['Логарифмические неравенства · MathExam', `Разных завершённых задач: ${completed} из ${E.tasks.length}`, `Самостоятельно: ${independent}`, ''];
    for (const r of state.history) {
      const t = taskMap.get(r.taskId); const family = familyMap.get(t.familyId);
      lines.push(`${family.title}, задача ${t.variant + 1} (${t.id})`, t.formulaText,
        `${outcomeText(r)} Проверок с ошибкой: ${r.errors}. Обращений за помощью: ${r.helps}.`, '');
    }
    const a = attempt();
    if (!a.complete) {
      lines.push(`Сейчас начато: ${familyMap.get(task().familyId).title}, задача ${task().variant + 1}.`, task().formulaText,
        `Режим: ${a.mode === 'example' ? 'разбор примера' : a.mode === 'guided' ? 'по шагам' : 'самостоятельно'}. Шаг ${a.stage + 1}: ${TITLES[a.stage]}.`,
        `Проверок с ошибкой: ${a.errors}. Обращений за помощью: ${a.helps}.`);
    }
    lines.push('', 'Повтор одной задачи не увеличивает число разных завершённых задач. В списке сохранён лучший результат каждой задачи.', `${location.origin}${location.pathname}`);
    $('report-text').value = lines.join('\n');
  }
  function applyState(next) {
    if (!validate(next)) throw new Error('Invalid trainer state');
    state = clone(next); pendingMode = null;
    $('mode-confirm').hidden = true; render(); return true;
  }
  function openTopics() { renderTopics(); if (!$('topics').open) $('topics').showModal(); }

  load(); attempt();
  const initialHash = location.hash.match(/^#task\/(.+)$/);
  if (initialHash) { try { const id = decodeURIComponent(initialHash[1]); if (taskMap.has(id)) { state.taskId = id; attempt(); } } catch (_) {} }
  render();
  $('topics-toggle').addEventListener('click', openTopics);
  $('completion-topics').addEventListener('click', openTopics);
  $('topics-close').addEventListener('click', () => $('topics').close());
  $('topics').addEventListener('click', event => { if (event.target === $('topics')) { const box = $('topics').getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('topics').close(); } });
  $('stage-form').addEventListener('submit', event => {
    event.preventDefault(); const a = attempt();
    if (stale || a.accepted || a.complete || a.mode === 'example') return;
    const result = checkStage(task(), a);
    if (result.ok) { a.accepted = true; a.feedback = { message: 'Верно. Запись сохранена выше. Продолжайте, когда будете готовы.', kind: 'success' }; a.hintOpen = false; }
    else { a.errors = Math.min(9999, a.errors + 1); a.feedback = { message: result.message, kind: 'error' }; }
    changed(); render();
    if (result.ok) $('continue-step').focus({ preventScroll: true });
  });
  $('continue-step').addEventListener('click', nextStage);
  $('hint-button').addEventListener('click', () => {
    if (stale || attempt().accepted || attempt().complete) return;
    if (!attempt().hintOpen) { attempt().helps = Math.min(9999, attempt().helps + 1); attempt().hintOpen = true; changed(); }
    $('hint').hidden = false;
  });
  $('preparation').addEventListener('toggle', () => {
    const a = attempt(); const open = $('preparation').open;
    if (stale || a.preparationOpen === open) return;
    a.preparationOpen = open;
    if (open && !a.complete) a.helps = Math.min(9999, a.helps + 1);
    changed();
  });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    if (stale || button.dataset.mode === attempt().mode) return;
    if (hasDraft(attempt()) && !attempt().complete) { pendingMode = button.dataset.mode; $('mode-confirm').hidden = false; }
    else changeMode(button.dataset.mode);
  }));
  $('confirm-mode').addEventListener('click', () => changeMode(pendingMode));
  $('cancel-mode').addEventListener('click', () => { pendingMode = null; $('mode-confirm').hidden = true; });
  $('next-task').addEventListener('click', () => {
    const family = E.tasks.filter(item => item.familyId === task().familyId);
    const next = family[(family.findIndex(item => item.id === state.taskId) + 1) % family.length];
    const previousMode = attempt().mode;
    const unseen = !state.work[next.id];
    chooseTask(next.id);
    if (unseen) { state.work[next.id].mode = previousMode === 'example' ? 'guided' : previousMode; state.work[next.id].stage = previousMode === 'independent' ? 2 : 0; changed(); render(); }
  });
  $('retry-task').addEventListener('click', () => changeMode(attempt().mode === 'example' ? 'guided' : attempt().mode));
  $('copy-report').addEventListener('click', async () => {
    updateReport();
    try { await navigator.clipboard.writeText($('report-text').value); $('report-notice').textContent = 'Отчёт скопирован. Вставьте его в сообщение учителю.'; }
    catch (_) { $('report-notice').textContent = 'Браузер не разрешил автоматическое копирование. Текст выделен ниже — скопируйте его вручную.'; $('report-text').focus(); $('report-text').select(); }
  });
  $('download-report').addEventListener('click', () => {
    updateReport(); const url = URL.createObjectURL(new Blob([$('report-text').value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'logarithms-results.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); $('report-notice').textContent = 'Отчёт подготовлен для скачивания. Его можно приложить к сообщению учителю.';
  });
  $('load-newer').addEventListener('click', () => {
    if (!newerState || embedded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY); const current = decode(raw);
      if (!current) return;
      observedStorage = raw; stale = false; newerState = null; $('load-newer').hidden = true; notice('');
      document.querySelectorAll('#exercise button, #exercise input, #exercise select').forEach(control => { control.disabled = false; });
      applyState(current);
    } catch (_) { notice('Не удалось открыть сохранённую работу. Скачайте отчёт из этой вкладки.'); }
  });
  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY && !embedded) observeOther(event.newValue); });
  window.addEventListener('hashchange', () => { const match = location.hash.match(/^#task\/(.+)$/); if (match) { try { chooseTask(decodeURIComponent(match[1]), false); } catch (_) {} } });
  window.__logTrainer = Object.freeze({ getState: () => clone(state), applyState, getTask: task, storageKey: STORAGE_KEY });
  if (window.MathExamBoard) window.MathExamBoard.register({
    id: 'profile-log-inequalities', version: '1.0.0', stateSchemaVersion: 1,
    parentOrigin: location.origin, getState: () => clone(state), applyState,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  });
})();
