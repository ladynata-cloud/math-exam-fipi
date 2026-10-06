(function () {
  'use strict';
  if (window.MathExamRemediationManaged) return;
  const G = window.DivisionGuided;
  const $ = id => document.getElementById(id);
  const KEY = 'mathExamBasics.guidedDivision.v1';
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topicIds = new Set(G.topics.map(t => t.id));
  const names = { start:'Выбираем первый блок', count:'Намечаем места для ответа', digit:'Находим цифру ответа', product:'Умножаем', subtract:'Вычитаем', 'remainder-check':'Проверяем остаток', bring:'Сносим одну цифру', partial:'Читаем новый блок', comma:'Ставим запятую', answer:'Читаем ответ', 'final-remainder':'Записываем остаток', verify:'Проверяем решение', 'shift-count':'Готовим делитель', 'shift-factor':'Меняем оба числа одинаково', 'shift-divisor':'Меняем делитель', 'shift-dividend':'Меняем делимое' };
  let state = {version:1, active:'start', serial:0, next:{}, sessions:{}, records:[]};
  let lastRaw = null, blocked = false, storageAvailable = true, helpOpen = false, revealOpen = false;
  let feedback = '', feedbackKind = '';

  function notice(text) { $('storage-notice').hidden = false; $('storage-notice').textContent = text; }
  function whole(value, max = 1000000) { return Number.isSafeInteger(value) && value >= 0 && value <= max; }
  function fingerprint(task) { return task.dividend + ':' + task.divisor; }
  function validate(raw) {
    if (!raw || raw.version !== 1 || !topicIds.has(raw.active) || !whole(raw.serial) || !raw.sessions || typeof raw.sessions !== 'object' || !raw.next || typeof raw.next !== 'object' || !Array.isArray(raw.records) || raw.records.length > 10000) throw Error('Неверная запись');
    const out = {version:1, active:raw.active, serial:raw.serial, next:{}, sessions:{}, records:[]};
    for (const [id, seq] of Object.entries(raw.next)) {
      if (!topicIds.has(id) || !whole(seq)) throw Error('Неверная тема');
      out.next[id] = seq;
    }
    for (const [id, s] of Object.entries(raw.sessions)) {
      if (!topicIds.has(id) || !s || s.task?.topicId !== id || !whole(s.id) || !whole(s.step, 200) || !Array.isArray(s.answers) || typeof s.accepted !== 'boolean' || typeof s.done !== 'boolean' || typeof s.repeated !== 'boolean' || typeof s.draft !== 'string' || s.draft.length > 30 || !['errors','hints','reveals'].every(k => whole(s[k]))) throw Error('Неверный шаг');
      const p = G.plan(s.task);
      const count = s.step + (s.accepted ? 1 : 0);
      if (s.step >= p.actions.length || count !== s.answers.length || s.done !== (count === p.actions.length) || !s.answers.every((v, i) => typeof v === 'string' && G.check(v, p.actions[i]))) throw Error('Ответы не совпали');
      out.sessions[id] = {id:s.id, task:p.task, step:s.step, answers:[...s.answers], accepted:s.accepted, done:s.done, draft:s.draft, errors:s.errors, hints:s.hints, reveals:s.reveals, repeated:s.repeated};
    }
    const ids = new Set();
    for (const r of raw.records) {
      if (!r || !whole(r.id) || ids.has(r.id) || !topicIds.has(r.topic) || !Number.isFinite(r.at) || typeof r.repeated !== 'boolean' || !['errors','hints','reveals'].every(k => whole(r[k]))) throw Error('Неверный итог');
      const p = G.plan(r.task);
      if (p.topicId !== r.topic) throw Error('Неверный итог темы');
      ids.add(r.id);
      out.records.push({id:r.id, task:p.task, topic:r.topic, at:r.at, errors:r.errors, hints:r.hints, reveals:r.reveals, repeated:r.repeated});
    }
    for (const s of Object.values(out.sessions)) {
      if (s.id > out.serial || (s.done && !ids.has(s.id))) throw Error('Незавершённый итог');
    }
    return out;
  }
  try {
    lastRaw = localStorage.getItem(KEY);
    if (lastRaw) state = validate(JSON.parse(lastRaw));
  } catch (e) {
    blocked = true;
    notice('Не удалось открыть сохранённую работу. Прежняя запись сохранена без изменений. Сейчас можно потренироваться и отправить снимок экрана учителю.');
  }
  function save() {
    if (blocked || !storageAvailable) return;
    try {
      if (localStorage.getItem(KEY) !== lastRaw) {
        blocked = true;
        notice('Работа изменилась в другой вкладке. Обнови эту страницу, чтобы продолжить с последнего сохранённого шага.');
        return;
      }
      const raw = JSON.stringify(state);
      localStorage.setItem(KEY, raw);
      lastRaw = raw;
    } catch (e) {
      storageAvailable = false;
      notice('Браузер не смог сохранить работу. Пока страницу не закрывай: реши пример и отправь учителю результат или снимок экрана.');
    }
  }
  function current() { return state.sessions[state.active]; }
  function newSession(id, repeat) {
    const old = state.sessions[id];
    const sequence = state.next[id] || 0;
    const task = repeat && old ? old.task : G.make(id, sequence);
    if (!repeat) state.next[id] = sequence + 1;
    const repeated = state.records.some(r => fingerprint(r.task) === fingerprint(task));
    state.serial++;
    state.sessions[id] = {id:state.serial, task, step:0, answers:[], accepted:false, done:false, draft:'', errors:0, hints:0, reveals:0, repeated};
    feedback = ''; helpOpen = false; revealOpen = false; save();
  }
  function independent(record) { return !record.errors && !record.hints && !record.reveals && !record.repeated; }

  // Like arifmetika.html's renderCorner: each digit has a fixed place, a comma
  // has a narrow column, and products are aligned by their last source digit.
  function renderNotebook(p, s) {
    const completed = s.step + (s.accepted ? 1 : 0);
    const a = p.actions[s.step];
    const visible = p.actions[completed]?.visibleBaseStep ?? p.baseActions.length;
    if (p.micropractice) {
      $('notebook').innerHTML = '<div class="microproblem">' + esc(p.task.dividend) + ' : ' + esc(p.task.divisor) + (s.done ? ' → ' + esc(p.actions[0].answer) : '') + '</div>';
      $('notebook-note').textContent = 'Подбираем одну цифру. Полный уголок здесь не нужен.';
      $('normalization').hidden = true;
      return;
    }
    const preparing = visible < p.normalizationEnd;
    $('normalization').hidden = !p.normalizationEnd;
    if (p.normalizationEnd) {
      const shift = p.baseActions.findIndex(x => x.kind === 'shift-factor');
      const factor = visible > shift ? p.baseActions[shift].answer : '?';
      const divisorDone = visible > p.baseActions.findIndex(x => x.kind === 'shift-divisor');
      const dividendDone = visible > p.baseActions.findIndex(x => x.kind === 'shift-dividend');
      $('normalization').innerHTML = '<p>Меняем оба числа одинаково: × ' + esc(factor) + '</p><p>Делимое: ' + esc(p.task.dividend) + ' → <b>' + (dividendDone ? esc(p.normalizedDividend) : '?') + '</b></p><p>Делитель: ' + esc(p.task.divisor) + ' → <b>' + (divisorDone ? p.normalizedDivisor : '?') + '</b></p>';
    }
    $('notebook').parentElement.hidden = preparing;
    if (preparing) {
      $('notebook-note').textContent = 'Начнём уголок, когда одинаково изменим оба числа.';
      return;
    }
    let length = p.originalLength;
    for (const b of p.baseActions.slice(0, visible)) if (b.kind === 'bring') length = Math.max(length, b.sourceIndex + 1);
    const hasComma = length > p.intLen;
    const columns = ['var(--cell)'];
    const digitColumn = [];
    for (let i = 0; i < length; i++) {
      if (hasComma && i === p.intLen) columns.push('calc(var(--cell) * .35)');
      digitColumn[i] = columns.length + 1;
      columns.push('var(--cell)');
    }
    const template = columns.join(' ');
    function row(text, end, cls, minus) {
      const start = end - String(text).length + 1;
      let cells = '';
      const minusColumn = hasComma && start === p.intLen ? digitColumn[start] - 2 : digitColumn[start] - 1;
      if (minus) cells += '<span class="minus" style="grid-column:' + minusColumn + '">−</span>';
      for (let j = 0; j < String(text).length; j++) cells += '<span class="' + cls + '" style="grid-column:' + digitColumn[start + j] + '">' + esc(String(text)[j]) + '</span>';
      if (cls.includes('subtraction') && hasComma && start < p.intLen && end >= p.intLen) cells += '<span class="subtraction" style="grid-column:' + (digitColumn[p.intLen] - 1) + '"></span>';
      return '<div class="number-row" style="--columns:' + template + '">' + cells + '</div>';
    }
    const activeCycle = Number.isInteger(a.cycle) ? a.cycle : p.cycles.findIndex(c => c.sourceIndex === a.sourceIndex);
    const activeIndex = a.sourceIndex ?? p.cycles[activeCycle]?.sourceIndex;
    const firstEnd = p.cycles[0].sourceIndex;
    let top = '';
    for (let i = 0; i < length; i++) {
      const inFirst = ['start','count'].includes(a.kind) && i <= firstEnd;
      const bringing = a.kind === 'bring' && i === a.sourceIndex;
      const firstActive = activeCycle === 0 && i <= firstEnd;
      const cls = !s.done && (inFirst || bringing || firstActive) ? 'current' : '';
      if (hasComma && i === p.intLen) top += '<span style="grid-column:' + (digitColumn[i] - 1) + '">,</span>';
      top += '<span class="' + cls + '" style="grid-column:' + digitColumn[i] + '">' + p.digits[i] + '</span>';
    }
    let rows = '<div class="number-row" style="--columns:' + template + '">' + top + '</div>';
    for (let i = 0; i < p.cycles.length; i++) {
      const c = p.cycles[i];
      if (visible <= c.productAction) break;
      if (c.qd > 0) rows += row(c.product, c.sourceIndex, 'subtraction', true);
      if (visible <= c.subtractAction) break;
      const next = p.cycles[i + 1];
      const bringIndex = next ? p.baseActions.findIndex(b => b.kind === 'bring' && b.sourceIndex === next.sourceIndex) : -1;
      const brought = next && visible > bringIndex;
      if (c.qd === 0 && i && !brought) continue;
      let value = String(c.remainder), end = c.sourceIndex;
      if (brought) {
        // Like the arithmetic suite, extend the remainder to the next partial
        // dividend without padding it with unfamiliar leading zeros (05, 00).
        value = String(next.partial); end = next.sourceIndex;
      }
      const isActive = !s.done && (brought ? activeIndex === next.sourceIndex || activeCycle === i + 1 : activeCycle === i);
      rows += row(value, end, isActive ? 'current' : '', false);
    }
    let quotient = '';
    for (const b of p.baseActions.slice(0, visible)) {
      if (b.kind === 'digit') quotient += b.answer;
      if (b.kind === 'comma') quotient += ',';
    }
    const countDone = p.actions.slice(0, completed).some(b => b.kind === 'count');
    const digitsDone = quotient.split(',')[0].length;
    const slots = countDone && digitsDone < p.integerDigitCount ? '·'.repeat(p.integerDigitCount - digitsDone) : '';
    $('notebook').innerHTML = '<div class="working">' + rows + '</div><div class="right-side"><div class="divisor">' + p.normalizedDivisor + '</div><div class="quotient">' + esc(quotient) + '<span class="slot">' + (slots || (!quotient ? '…' : '')) + '</span></div></div>';
    $('notebook-note').textContent = s.done ? 'Все строки решения остаются перед тобой.' : a.kind === 'bring' ? 'Сносим только одну следующую цифру — она выделена в верхней строке.' : countDone && !quotient ? 'Точки справа — места для цифр ответа.' : 'Выделен блок, с которым сейчас работаем.';
  }

  function renderResults() {
    const total = state.records.length;
    const alone = state.records.filter(independent).length;
    $('results-text').textContent = total ? 'Закончено примеров по шагам: ' + total + '. Новых, без ошибок и дополнительных подсказок: ' + alone + '. С помощью, исправлениями или повторно: ' + (total - alone) + '.' : 'Здесь появятся законченные примеры.';
  }
  function render() {
    const s = current(), p = G.plan(s.task), a = p.actions[s.step];
    const topic = G.topics.find(t => t.id === state.active);
    $('topic-label').textContent = topic.title;
    $('problem').textContent = s.task.dividend + ' : ' + s.task.divisor;
    $('step-counter').textContent = s.done ? 'Готово' : 'Шаг ' + (s.step + 1) + ' из ' + p.actions.length;
    $('notebook').parentElement.hidden = false;
    renderNotebook(p, s);
    $('question').hidden = s.done;
    $('completion').hidden = !s.done;
    $('step-name').textContent = names[a.kind];
    $('prompt').textContent = a.prompt;
    $('answer-note').textContent = a.kind === 'comma' ? 'Впиши число с запятой на конце, например 2,.' : a.kind === 'remainder-check' ? 'Выбери ответ, затем нажми «Проверить».' : a.kind === 'start' ? 'Впиши число из выделенных цифр слева.' : a.kind === 'count' ? 'На каждую цифру ответа наметим одно место.' : ['digit','bring'].includes(a.kind) ? 'Впиши одну цифру.' : 'Впиши число и нажми «Проверить».';
    $('answer').value = s.draft;
    $('answer').readOnly = s.accepted;
    $('answer').hidden = !!a.options;
    $('answer-label').hidden = !!a.options;
    $('answer-options').hidden = !a.options;
    $('answer-options').innerHTML = a.options ? a.options.map(o => '<button type="button" data-option="' + esc(o.value) + '" aria-pressed="' + (s.draft === o.value) + '" ' + (s.accepted ? 'disabled' : '') + '>' + esc(o.label) + '</button>').join('') : '';
    $('primary').textContent = s.accepted ? 'Дальше' : 'Проверить';
    $('feedback').textContent = feedback || (s.accepted ? 'Верно. Посмотри, что записалось в уголке.' : '');
    $('feedback').className = feedbackKind || (s.accepted ? 'good' : '');
    $('help-area').hidden = s.accepted;
    $('help-toggle').setAttribute('aria-expanded', String(helpOpen));
    $('help-content').hidden = !helpOpen;
    $('hint-text').textContent = a.hint;
    $('multiples').hidden = a.kind !== 'digit' && a.kind !== 'product';
    if (!$('multiples').hidden) $('multiples').innerHTML = Array.from({length:10}, (_, q) => '<span>' + p.normalizedDivisor + ' × ' + q + ' = ' + p.normalizedDivisor * q + '</span>').join('');
    $('revealed').textContent = revealOpen ? 'В этом шаге ответ: ' + a.answer + '. Впиши его и нажми «Проверить».' : '';
    if (s.done) {
      const answer = p.micropractice ? p.actions[0].answer : p.quotient + (s.task.level === 'remainder' ? ' (остаток ' + p.remainder + ')' : '');
      $('completion-text').textContent = (p.micropractice ? 'Подходящая цифра: ' : 'Ответ: ') + answer + '. ' + (independent(s) ? 'Получилось без ошибок и подсказок.' : s.repeated && !s.hints && !s.reveals && !s.errors ? 'Знакомый пример повторён.' : 'Пример пройден с помощью или исправлениями.');
    }
    $('save-note').textContent = blocked || !storageAvailable ? 'Можно закончить на сегодня. Отправь учителю результат или снимок экрана: сохранение сейчас недоступно.' : 'Можно закончить на сегодня. Результат сохранится в этом браузере.';
    renderResults();
  }
  function moveFocus() {
    const s = current(), a = G.plan(s.task).actions[s.step];
    const target = s.done ? $('next-example') : a.options ? $('answer-options').querySelector('button') : $('answer');
    target?.focus({preventScroll:true});
    const box = $('question').getBoundingClientRect();
    if (!s.done && (box.top < 0 || box.top > innerHeight - 220)) $('question').scrollIntoView({block:'start'});
  }
  function errorText(raw, p, a) {
    if (!raw.trim()) return 'Сначала впиши ответ.';
    if (a.kind === 'digit' && /^\d$/.test(raw)) {
      const c = p.cycles[a.cycle], q = Number(raw), value = q * p.normalizedDivisor;
      return value > c.partial ? q + ' — много: ' + p.normalizedDivisor + ' × ' + q + ' = ' + value + ', а у нас ' + c.partial + '. Попробуй меньшую цифру.' : q + ' — мало: после вычитания можно взять делитель ещё раз. Попробуй большую цифру.';
    }
    return 'Пока не совпало. Попробуй ещё раз или нажми «Помочь с этим шагом».';
  }
  $('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    const s = current(); if (s.done) return;
    if (s.accepted) {
      s.step++; s.accepted = false; s.draft = ''; feedback = ''; feedbackKind = ''; helpOpen = false; revealOpen = false;
      save(); render(); moveFocus(); return;
    }
    const p = G.plan(s.task), a = p.actions[s.step];
    const raw = a.options ? s.draft : $('answer').value.trim();
    s.draft = raw;
    if (!G.check(raw, a)) {
      if (raw) s.errors = Math.min(1000000, s.errors + 1);
      feedback = errorText(raw, p, a); feedbackKind = 'error'; save(); render(); return;
    }
    s.answers.push(raw); s.accepted = true; feedback = ''; feedbackKind = '';
    s.done = s.answers.length === p.actions.length;
    if (s.done && !state.records.some(r => r.id === s.id)) state.records.push({id:s.id, task:s.task, topic:state.active, at:Date.now(), errors:s.errors, hints:s.hints, reveals:s.reveals, repeated:s.repeated});
    save(); render();
    if (s.done) moveFocus(); else $('primary').focus({preventScroll:true});
  });
  $('answer').addEventListener('input', () => { current().draft = $('answer').value; save(); });
  $('answer-options').addEventListener('click', event => {
    const button = event.target.closest('button[data-option]');
    if (!button || current().accepted) return;
    current().draft = button.dataset.option; feedback = ''; feedbackKind = ''; save(); render();
    $('primary').focus({preventScroll:true});
  });
  $('help-toggle').onclick = () => {
    if (!helpOpen) current().hints = Math.min(1000000, current().hints + 1);
    helpOpen = !helpOpen; save(); render();
  };
  $('reveal').onclick = () => {
    if (!revealOpen) current().reveals = Math.min(1000000, current().reveals + 1);
    revealOpen = true; save(); render();
  };
  function showTopics() {
    $('topics-list').innerHTML = G.topics.map(t => '<button type="button" data-topic="' + t.id + '" aria-current="' + (state.active === t.id) + '">' + esc(t.title) + '<small>' + esc(t.description) + (state.sessions[t.id] && !state.sessions[t.id].done ? ' · Пример начат' : '') + '</small></button>').join('');
    $('topics-dialog').showModal();
    $('topics-close').focus();
  }
  $('topics-open').onclick = showTopics;
  $('topics-close').onclick = () => $('topics-dialog').close();
  $('topics-list').onclick = event => {
    const button = event.target.closest('button[data-topic]'); if (!button) return;
    state.active = button.dataset.topic;
    history.replaceState(null, '', location.pathname + location.search + '#' + state.active);
    if (!current()) newSession(state.active, false);
    helpOpen = false; revealOpen = false; feedback = ''; feedbackKind = '';
    save(); render(); $('topics-dialog').close(); $('problem').scrollIntoView({block:'start'});
  };
  $('next-example').onclick = () => { newSession(state.active, false); render(); $('problem').scrollIntoView({block:'start'}); };
  $('repeat-example').onclick = () => { newSession(state.active, true); render(); $('problem').scrollIntoView({block:'start'}); };
  function report() {
    const lines = ['Деление уголком · MathExam', $('results-text').textContent];
    for (const r of state.records.slice(-12)) {
      lines.push(r.task.dividend + ' : ' + r.task.divisor + ' — ' + (independent(r) ? 'пошагово без ошибок и дополнительных подсказок, новое условие' : r.repeated ? 'повтор знакомого примера' : 'с помощью или исправлениями'));
    }
    const s = current();
    if (!s.done) lines.push('Начато: ' + s.task.dividend + ' : ' + s.task.divisor + ', шаг ' + (s.step + 1) + '.');
    return lines.join('\n');
  }
  $('report-copy').onclick = async () => {
    const text = report(); $('report-text').value = text; $('report-text').hidden = false;
    try {
      if (!navigator.clipboard?.writeText) throw Error('Нет буфера');
      await navigator.clipboard.writeText(text);
      $('report-status').textContent = 'Скопировано. Теперь вставь текст в сообщение учителю.';
    } catch (e) {
      $('report-status').textContent = 'Выдели текст ниже и скопируй его. Можно отправить снимок экрана.';
      $('report-text').focus(); $('report-text').select();
    }
  };
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) { blocked = true; notice('Работа изменилась в другой вкладке. Обнови страницу, прежде чем продолжить.'); }
  });
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (!topicIds.has(id) || id === state.active) return;
    state.active = id;
    if (!current()) newSession(id, false);
    helpOpen = false; revealOpen = false; feedback = ''; feedbackKind = '';
    save(); render();
  });
  const requested = location.hash.slice(1);
  if (topicIds.has(requested)) state.active = requested;
  if (!current()) newSession(state.active, false);
  else save();
  render();
  window.__divisionGuidedDebug = {KEY, state:() => structuredClone(state), plan:() => G.plan(current().task)};
})();
