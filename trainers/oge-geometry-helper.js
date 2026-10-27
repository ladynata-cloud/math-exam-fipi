/* Explicit public-condition handoff. No pupil state, answer key, drawing, or
 * model call leaves this page. Assistance stays in each native trainer. */
(function (root, doc) {
  'use strict';
  if (root.MathExamOgeGeometryHelper) return;
  const routes = Object.freeze({
    '/trainers/oge-task15-triangles.html': ['oge-task15-triangles', 'oge-triangles', 15],
    '/trainers/oge-task16-circle.html': ['oge-task16-circle', 'oge-circle', 16],
    '/trainers/oge-task17-quadrilaterals.html': ['oge-task17-quadrilaterals', 'oge-quadrilaterals', 17],
    '/trainers/oge-task18-grid.html': ['oge-task18-grid', 'oge-grid', 18],
    '/trainers/task19-trainer.html': ['task19-trainer', 'oge-statements', 19]
  });
  const spec = routes[root.location.pathname];
  const params = new URLSearchParams(root.location.search);
  const localDevelopment = ['localhost', '127.0.0.1', '[::1]'].includes(root.location.hostname)
    && root.location.protocol === 'http:';
  // Shared/managed frames retain their established control and help protocol.
  if (!spec || (root.location.origin !== 'https://mathexam.space' && !localDevelopment)
      || root.parent !== root || params.has('selftest') || params.get('board') === '1'
      || /^(?:quiz|exam|diagnostic)$/i.test(params.get('mode') || '')
      || root.OgeGeometryBoardMode === true || root.__oge15?.boardMode) return;

  const [trainerId, topicId, number] = spec;
  const cabinet = 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/';
  const byId = id => doc.getElementById(id);
  const make = (tag, text, className) => {
    const element = doc.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const normalize = text => String(text || '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
  function plainMath(source) {
    // Read only the fixed condition node (or an authored native hint). A clone
    // prevents any alteration to the original figure, input or live handlers.
    const copy = source.cloneNode(true);
    copy.querySelectorAll('script,style,svg,img,button,input,textarea,select,[hidden],[contenteditable]').forEach(node => node.remove());
    for (const fraction of Array.from(copy.querySelectorAll('.frac,.fraction')).reverse()) {
      const numerator = fraction.querySelector('.fn,.num,.numerator,.up');
      const denominator = fraction.querySelector('.fd,.den,.denominator,.dn');
      if (numerator && denominator) fraction.replaceWith(doc.createTextNode('(' + numerator.textContent + ')/(' + denominator.textContent + ')'));
    }
    copy.querySelectorAll('sup').forEach(node => node.replaceWith(doc.createTextNode('^(' + node.textContent + ')')));
    copy.querySelectorAll('sub').forEach(node => node.replaceWith(doc.createTextNode('_' + node.textContent)));
    copy.querySelectorAll('br').forEach(node => node.replaceWith(doc.createTextNode(' ')));
    return normalize(copy.textContent);
  }
  function authoredHint(value) {
    // Parsing stays inert; none of this markup is inserted into the document.
    const parsed = new root.DOMParser().parseFromString(String(value || ''), 'text/html');
    return plainMath(parsed.body);
  }
  function current() {
    if (number === 15) {
      const debug = root.__oge15?.debug?.(), condition = byId('taskText');
      if (!condition || debug?.TAB !== 'train' || !debug.tr || debug.tr.done
          || typeof root.trHelp !== 'function') return null;
      return { condition, anchor: condition, native: debug.tr, text: plainMath(condition) };
    }
    if (number === 19) {
      const condition = byId('statement'), hint = byId('hintToggle'), panel = byId('hintPanel');
      if (!condition || !hint || !panel || hint.hidden || hint.disabled || byId('answerActions')?.hidden
          || byId('btnTrue')?.disabled || byId('btnFalse')?.disabled
          || !root.Task19Data?.cards?.some(card => card.text === condition.textContent)) return null;
      return { condition, anchor: panel, hint, panel, text: 'Верно ли утверждение: ' + plainMath(condition) };
    }
    const selector = number === 16 ? '#main .grid .task' : number === 17 ? '#tzone .qtext' : '#main > .card > .task';
    const condition = doc.querySelector(selector), hint = byId('courseHintToggle'), panel = byId('courseHintPanel');
    const answer = byId(number === 18 ? 'ansIn' : 'ans');
    if (!condition || !hint || !panel || hint.disabled || !answer || answer.disabled
        || typeof root.OgeGeometryHelpUsed !== 'boolean') return null;
    return { condition, anchor: panel, hint, panel, text: plainMath(condition) };
  }
  function sameTask(before, after) {
    return after && before.condition === after.condition && before.text === after.text
      && (number !== 15 || before.native === after.native);
  }
  function markAssistance(snapshot, keepPanel) {
    if (number === 15) {
      root.trHelp('hint');
      return sameTask(snapshot, current()) && snapshot.native.hinted === true;
    }
    const wasOpen = !snapshot.panel.hidden;
    // Invoke the actual controls. Their existing handlers record sticky help,
    // including task19's saved current card and 16–18's native grading flag.
    if (wasOpen && keepPanel) snapshot.hint.click();
    if (snapshot.panel.hidden) snapshot.hint.click();
    const opened = !snapshot.panel.hidden && snapshot.hint.getAttribute('aria-expanded') === 'true';
    if (keepPanel && !wasOpen && opened) snapshot.hint.click();
    return opened && sameTask(snapshot, current()) && (number === 19 || root.OgeGeometryHelpUsed === true);
  }
  function safeQuestion(text) {
    return text.length >= 5 && text.length <= 1000 && !/[<>]/.test(text)
      && !/(?:https?:|javascript:|data:|www\.|\S+@\S+)/i.test(text);
  }

  let section = null, conditionSeen = null, nativeSeen = null, questionSeen = '', timer = null, forceRefresh = false;
  function build(snapshot) {
    const details = make('details', undefined, 'oge-geometry-helper');
    details.dataset.ogeGeometryHelper = trainerId;
    details.append(make('summary', 'Помощник MathExam'));
    const body = make('div', undefined, 'oge-geometry-helper-body');
    body.append(make('p', 'Можно открыть подсказку к этой задаче или задать вопрос помощнику в своём кабинете.'));
    const actions = make('div', undefined, 'oge-geometry-helper-actions');
    const hint = make('button', 'Подсказка в этой задаче'); hint.type = 'button'; hint.dataset.ogeHelperHint = '';
    const transfer = make('button', 'Передать условие помощнику'); transfer.type = 'button'; transfer.dataset.ogeHelperTransfer = '';
    actions.append(hint, transfer); body.append(actions);
    const shown = make('div', undefined, 'oge-geometry-helper-hint'); shown.dataset.ogeHelperShown = ''; shown.hidden = true;
    body.append(shown);
    body.append(make('p', 'Передаётся только текст условия. Рисунок, твой ответ и изменения задачи в другой вкладке помощник не видит. Проверь условие в кабинете и добавь недостающие данные рисунка.', 'oge-geometry-helper-note'));
    body.append(make('p', 'Использование помощника отмечается как помощь. Для самостоятельной проверки затем реши новую похожую задачу.', 'oge-geometry-helper-note'));
    const message = make('p', '', 'oge-geometry-helper-status'); message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
    body.append(message); details.append(body);
    function unavailable() { message.textContent = 'Эта задача уже изменилась. Открой помощника под текущим условием.'; schedule(); }
    hint.addEventListener('click', () => {
      const live = current();
      if (!details.isConnected || !live || !sameTask(snapshot, live)) { unavailable(); return; }
      if (!markAssistance(live, false)) { unavailable(); return; }
      if (number === 15) {
        const steps = live.native.t.steps || [];
        const index = live.native.ladder ? Math.max(0, doc.querySelectorAll('#lad .lstep').length - 1) : 0;
        const step = steps[index];
        if (step && !shown.querySelector('[data-helper-step="' + index + '"]')) {
          const retained = make('div'); retained.dataset.helperStep = String(index);
          retained.append(make('p', 'Шаг ' + (index + 1) + '. ' + authoredHint(step.q)));
          const clue = authoredHint(step.hint || live.native.t.sub?.law);
          if (clue) retained.append(make('p', clue));
          shown.append(retained);
        } else if (!step && !shown.childElementCount) shown.append(make('p', 'Сверь известные величины и вопрос задачи. Можно продолжить через «Решить по шагам».'));
        shown.hidden = false;
      } else live.panel.scrollIntoView?.({ block: 'nearest' });
      message.textContent = 'Подсказка относится к текущей задаче. Твой ввод остаётся на месте.';
    });
    transfer.addEventListener('click', () => {
      const live = current();
      if (!details.isConnected || !live || !sameTask(snapshot, live)) { unavailable(); return; }
      if (!safeQuestion(live.text)) {
        message.textContent = 'Это условие не удалось передать целиком. Открой кабинет и впиши только нужные математические данные вручную.';
        return;
      }
      if (!markAssistance(live, true)) { unavailable(); return; }
      const url = new URL(cabinet);
      url.hash = new URLSearchParams({ 'geometry-help': topicId, from: trainerId, question: live.text }).toString();
      root.open(url.href, '_blank', 'noopener,noreferrer');
      message.textContent = 'В новой вкладке проверь перенесённое условие. Запрос помощнику отправляется только после твоего нажатия в кабинете.';
    });
    return details;
  }
  function refresh() {
    timer = null;
    const live = current();
    if (!live) {
      doc.querySelectorAll('[data-oge-geometry-helper]').forEach(node => node.remove());
      section = null; conditionSeen = null; nativeSeen = null; questionSeen = ''; forceRefresh = false;
      return;
    }
    if (!forceRefresh && section?.isConnected && conditionSeen === live.condition
        && nativeSeen === live.native && questionSeen === live.text) return;
    doc.querySelectorAll('[data-oge-geometry-helper]').forEach(node => node.remove());
    section = build(live); live.anchor.insertAdjacentElement('afterend', section);
    conditionSeen = live.condition; nativeSeen = live.native; questionSeen = live.text; forceRefresh = false;
  }
  function schedule() { if (timer === null) timer = root.setTimeout(refresh, 0); }
  const host = byId('main') || doc.querySelector('main');
  if (!host) return;
  const observer = new root.MutationObserver(records => {
    // Replacing a statement with the same words still starts a new attempt.
    if (conditionSeen && records.some(record => record.target === conditionSeen
        || (record.type === 'characterData' && conditionSeen.contains(record.target)))) forceRefresh = true;
    schedule();
  });
  observer.observe(host, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
  root.MathExamOgeGeometryHelper = Object.freeze({ version: 1 });
  refresh();
})(window, document);
