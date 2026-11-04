/* Shared practice uses the reviewed triangle bank, never transported HTML or personal results. */
(function (window, document) {
  'use strict';
  const bank = window.__oge15;
  if (!bank || !bank.boardMode) return;
  const root = document.getElementById('main');
  const variants = new Map(bank.TASK_VARIANTS.map(v => [v.id, v]));
  const topics = Object.keys(bank.TOPICS);
  const cache = new Map();
  const copy = value => JSON.parse(JSON.stringify(value));
  const fail = () => { throw new TypeError('Invalid triangle board state'); };
  const text = value => typeof value === 'string' && value.length <= 96 && !/[<>\u0000-\u001f]/.test(value);
  const int = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  const record = (value, names) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail();
    const properties = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(properties).length !== names.length || Object.getOwnPropertySymbols(value).length) fail();
    for (const name of names) if (!properties[name] || !properties[name].enumerable ||
        !Object.prototype.hasOwnProperty.call(properties[name], 'value')) fail();
  };
  const array = value => {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > 16 ||
        Object.getOwnPropertySymbols(value).length) fail();
    const properties = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(properties).length !== value.length + 1) fail();
    for (let i = 0; i < value.length; i++) if (!properties[i] || !properties[i].enumerable ||
        !Object.prototype.hasOwnProperty.call(properties[i], 'value')) fail();
  };
  const freshStep = () => ({ draft: '', checked: false, hint: false, revealed: false });
  function fresh(variantId, seed, topic = 'all') {
    return { variantId, seed, topic, answer: '', checked: false, hintOpen: false,
      helpUsed: false, guided: false, steps: [], referenceOpen: false, settingsOpen: false };
  }
  function taskFor(value) {
    const key = value.variantId + '/' + value.seed;
    if (!cache.has(key)) {
      if (cache.size >= 128) cache.clear();
      cache.set(key, bank.buildSeeded(value.variantId, value.seed));
    }
    return cache.get(key);
  }
  function stepCorrect(raw, expected) {
    const number = bank.parseAns(raw);
    const finiteDecimal = Math.abs(Math.round(expected * 1e4) - expected * 1e4) < 1e-6;
    return bank.eqAns(number, expected) || (!finiteDecimal && Number.isFinite(number) && Math.abs(number - expected) <= .005);
  }
  function resolved(entry, step) { return entry.revealed || (entry.checked && stepCorrect(entry.draft, step.a)); }
  function validateState(value) {
    record(value, Object.keys(fresh('bisIso:B', 1)));
    if (!variants.has(value.variantId) || !int(value.seed, 1, 2147483647) ||
        !['all', ...topics].includes(value.topic) ||
        (value.topic !== 'all' && variants.get(value.variantId).topic !== value.topic) || !text(value.answer)) fail();
    for (const key of ['checked', 'hintOpen', 'helpUsed', 'guided', 'referenceOpen', 'settingsOpen']) {
      if (typeof value[key] !== 'boolean') fail();
    }
    array(value.steps);
    const task = taskFor(value);
    if (value.steps.length > task.steps.length || (!value.guided && value.steps.length) ||
        (value.guided && !value.steps.length) || ((value.hintOpen || value.referenceOpen) && !value.helpUsed)) fail();
    for (let i = 0; i < value.steps.length; i++) {
      const entry = value.steps[i];
      record(entry, ['draft', 'checked', 'hint', 'revealed']);
      if (!text(entry.draft) || typeof entry.checked !== 'boolean' || typeof entry.hint !== 'boolean' ||
          typeof entry.revealed !== 'boolean' || ((entry.hint || entry.revealed) && !value.helpUsed) ||
          (entry.hint && !task.steps[i].hint) || (entry.revealed && entry.checked)) fail();
      if (i < value.steps.length - 1 && !resolved(entry, task.steps[i])) fail();
    }
    if (value.guided && value.steps.length < task.steps.length && resolved(value.steps.at(-1), task.steps[value.steps.length - 1])) fail();
    return copy(value);
  }
  let state = fresh('bisIso:B', 2027);
  let notify = function () {};
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const format = value => String(Number(value.toFixed(8))).replace('.', ',');
  const plain = value => { const node = document.createElement('div'); node.innerHTML = value; return node.textContent; };
  function finalCorrect() { return state.checked && bank.eqAns(bank.parseAns(state.answer), taskFor(state).ans); }
  function allStepsDone() {
    const task = taskFor(state);
    return state.guided && state.steps.length === task.steps.length && state.steps.every((entry, i) => resolved(entry, task.steps[i]));
  }
  function feedback(raw, expected, checked) {
    if (!checked) return '';
    if (!Number.isFinite(bank.parseAns(raw))) return 'Введите число: целое или дробь. Десятичную дробь можно записать через запятую.';
    if (bank.eqAns(bank.parseAns(raw), expected)) return state.helpUsed ? 'Верно. Решение с подсказкой.' : 'Верно.';
    return 'Пока не совпало. Проверьте условие и вычисления. Можно открыть подсказку.';
  }
  function render(keepFocus) {
    const focused = keepFocus && root.contains(document.activeElement) ? document.activeElement : null;
    const focusId = focused?.id;
    const selection = focused && typeof focused.selectionStart === 'number' ? focused.selectionStart : null;
    const task = taskFor(state), done = finalCorrect() || allStepsDone();
    const steps = state.guided ? state.steps.map((entry, index) => {
      const step = task.steps[index], accepted = resolved(entry, step);
      const message = entry.revealed ? step.show : entry.checked && stepCorrect(entry.draft, step.a) ? 'Верно. ' + step.show :
        entry.checked ? escape(feedback(entry.draft, step.a, true)) : '';
      return `<section class="lstep${accepted ? ' board-completed' : ''}" data-board-step="${index}"><div class="q"><b>Шаг ${index + 1}.</b> ${step.q}</div>
        <label class="board-answer-label" for="board-step-${index}">Введите результат этого шага${/[°]|градус/.test(plain(step.q)) ? ' в градусах' : ''}:</label>
        <div class="row"><input id="board-step-${index}" class="ans" data-step-draft="${index}" value="${escape(entry.draft)}" inputmode="decimal" autocomplete="off" ${accepted ? 'disabled' : ''}>
        <button type="button" data-step-check="${index}" ${accepted ? 'disabled' : ''}>Проверить шаг</button>
        ${step.hint ? `<button type="button" class="soft" data-step-hint="${index}" aria-expanded="${entry.hint}">${entry.hint ? 'Скрыть подсказку' : 'Хочешь подсказку?'}</button>` : ''}
        <button type="button" class="sec" data-step-reveal="${index}" ${accepted ? 'disabled' : ''}>Показать шаг</button></div>
        ${entry.hint ? `<div class="hintbox">${step.hint}</div>` : ''}
        ${message ? `<div class="fb show${accepted && !entry.revealed ? ' ok' : ''}" role="status">${message}</div>` : ''}</section>`;
    }).join('') : '';
    const finalMessage = allStepsDone() ? `Все шаги разобраны. Ответ: ${format(task.ans)}.${state.helpUsed ? ' Использовалась подсказка.' : ''}` : feedback(state.answer, task.ans, state.checked);
    const reference = bank.REFS.find(item => item.id === task.sub.ref);
    root.innerHTML = `<div class="grid"><div><div class="diagram" tabindex="0" role="region" aria-label="Чертёж задачи; при необходимости прокрутите горизонтально">${task.fig.svg}</div>${task.fig.cap ? `<p class="figcap">${task.fig.cap}</p>` : ''}</div><div>
      <div class="task" id="taskText">${task.text}</div>
      <label class="board-answer-label" for="board-answer">${escape((plain(task.text).match(/(?:Найдите|Вычислите|Чему рав(?:ен|на|но))[^.!?]+/i) || ['Ответ на вопрос задачи'])[0])}. Введите число${/градус/.test(plain(task.text)) ? ' в градусах' : ''}:</label>
      <div class="controls"><input id="board-answer" class="ans" inputmode="decimal" autocomplete="off" value="${escape(state.answer)}" ${done ? 'disabled' : ''}>
      <button type="button" id="board-check" ${done ? 'disabled' : ''}>Проверить</button></div>
      ${finalMessage ? `<div class="fb show${done ? ' ok' : ''}" id="board-feedback" role="status">${escape(finalMessage)}</div>` : ''}
      <div class="rowbtns"><button type="button" class="soft" id="board-hint" aria-expanded="${state.hintOpen}">${state.hintOpen ? 'Скрыть подсказку' : 'Хочешь подсказку?'}</button>
      ${!state.guided && !done ? '<button type="button" class="soft" id="board-guide">Решить по шагам</button>' : ''}</div>
      ${state.hintOpen ? `<div class="hintbox board-help">${task.sub.law}</div>` : ''}
      ${steps ? `<div class="ladder">${steps}</div>` : ''}
      ${reference ? `<div class="board-help"><button type="button" class="sec" id="board-reference" aria-expanded="${state.referenceOpen}">${state.referenceOpen ? 'Скрыть правило' : 'Правило: ' + escape(reference.name)}</button>
      ${state.referenceOpen ? `<div class="law">${reference.fx}${(reference.notes || []).map(note => `<p>${note}</p>`).join('')}</div>` : ''}</div>` : ''}
      <div class="rowbtns"><button type="button" id="board-next">Другой пример →</button></div>
      <p class="smallnote">Совместная тренировка. Работа на доске не записывается как самостоятельный результат в кабинете.</p>
      </div></div>
      <details class="oge15-board-settings" id="board-settings" ${state.settingsOpen ? 'open' : ''}><summary>Выбрать тему и способ решения</summary>
      <label for="board-topic">Тема:</label><select id="board-topic"><option value="all">Все темы</option>${topics.map(key => `<option value="${key}" ${key === state.topic ? 'selected' : ''}>${escape(bank.TOPICS[key])}</option>`).join('')}</select>
      <label for="board-variant">Способ решения:</label><select id="board-variant">${bank.TASK_VARIANTS.filter(v => state.topic === 'all' || v.topic === state.topic).map(v => `<option value="${v.id}" ${v.id === state.variantId ? 'selected' : ''}>${escape(v.name)}</option>`).join('')}</select></details>`;
    const target = focusId && document.getElementById(focusId);
    if (target && !target.disabled) {
      target.focus({ preventScroll: true });
      if (selection !== null && target.setSelectionRange) target.setSelectionRange(selection, selection);
    }
  }
  function commit() { render(true); notify(); }
  function advanceStep(index) {
    const task = taskFor(state);
    if (index === state.steps.length - 1 && resolved(state.steps[index], task.steps[index]) && index + 1 < task.steps.length) state.steps.push(freshStep());
  }
  const nextSeed = () => state.seed >= 2147483647 ? 1 : state.seed + 1;
  function choose(variantId, topic = state.topic) {
    const settingsOpen = state.settingsOpen;
    state = fresh(variantId, nextSeed(), topic);
    state.settingsOpen = settingsOpen;
    commit();
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || !root.contains(button)) return;
    const id = button.id;
    if (id === 'board-check') state.checked = true;
    else if (id === 'board-hint') { state.hintOpen = !state.hintOpen; if (state.hintOpen) state.helpUsed = true; }
    else if (id === 'board-reference') { state.referenceOpen = !state.referenceOpen; if (state.referenceOpen) state.helpUsed = true; }
    else if (id === 'board-guide') { state.guided = true; state.steps = [freshStep()]; }
    else if (id === 'board-next') { choose(state.variantId); return; }
    else if (button.dataset.stepCheck !== undefined) {
      const i = Number(button.dataset.stepCheck); state.steps[i].checked = true; advanceStep(i);
    } else if (button.dataset.stepHint !== undefined) {
      const i = Number(button.dataset.stepHint); state.steps[i].hint = !state.steps[i].hint;
      if (state.steps[i].hint) state.helpUsed = true;
    } else if (button.dataset.stepReveal !== undefined) {
      const i = Number(button.dataset.stepReveal); state.steps[i].revealed = true; state.steps[i].checked = false;
      state.helpUsed = true; advanceStep(i);
    } else return;
    commit();
  });
  root.addEventListener('input', event => {
    const input = event.target;
    if (input.id !== 'board-answer' && input.dataset.stepDraft === undefined) return;
    const value = input.value.replace(/[<>\u0000-\u001f]/g, '').slice(0, 96);
    if (input.id === 'board-answer') { state.answer = value; state.checked = false; }
    else {
      const entry = state.steps[Number(input.dataset.stepDraft)];
      if (!entry || input.disabled) return;
      entry.draft = value; entry.checked = false;
    }
    commit();
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (event.target.id === 'board-answer') { event.preventDefault(); root.querySelector('#board-check').click(); }
    else if (event.target.dataset.stepDraft !== undefined) {
      event.preventDefault(); root.querySelector(`[data-step-check="${event.target.dataset.stepDraft}"]`).click();
    }
  });
  root.addEventListener('change', event => {
    if (event.target.id === 'board-topic') {
      const topic = event.target.value;
      choose(bank.TASK_VARIANTS.find(v => topic === 'all' || v.topic === topic).id, topic);
    } else if (event.target.id === 'board-variant') choose(event.target.value);
  });
  root.addEventListener('toggle', event => {
    if (event.target.id !== 'board-settings' || event.target.open === state.settingsOpen) return;
    state.settingsOpen = event.target.open; notify();
  }, true);
  function getState() { return copy(state); }
  function applyState(value) { const next = validateState(value); state = next; render(false); }
  document.body.classList.add('oge15-board-mode');
  render(false);
  window.OGE15Board = Object.freeze({ getState, applyState, validateState });
  window.getBoardTrainerState = getState;
  window.applyBoardTrainerState = applyState;
  if (window.MathExamBoard) window.MathExamBoard.register({
    id: 'oge-task15-triangles', version: '1.0.0', stateSchemaVersion: 1,
    parentOrigin: window.location.origin, getState, applyState,
    subscribe(callback) { notify = callback; return () => { notify = function () {}; }; }
  });
})(window, document);
