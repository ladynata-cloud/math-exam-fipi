(function () {
  'use strict';
  if (window.MathExamRemediationManaged) return;
  const G = window.DivisionGuided;
  const route = window.PreOgeArithmetic;
  const inCourse = new URLSearchParams(location.search).get('course') === 'preoge';
  const $ = id => document.getElementById(id);
  const KEY = 'mathExamBasics.guidedDivision.v1';
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topicIds = new Set(G.topics.map(t => t.id));
  const names = { start:'Первое неполное делимое', count:'Намечаем места для ответа', digit:'Находим цифру ответа', product:'Умножаем', subtract:'Вычитаем', 'remainder-check':'Проверяем остаток', bring:'Сносим одну цифру', partial:'Читаем новое неполное делимое', comma:'Ставим запятую', answer:'Читаем ответ', 'final-remainder':'Записываем остаток', verify:'Проверяем решение', 'shift-count':'Готовим делитель', 'shift-factor':'Меняем оба числа одинаково', 'shift-divisor':'Меняем делитель', 'shift-dividend':'Меняем делимое' };
  let state = {version:1, active:'start', serial:0, next:{}, sessions:{}, records:[]};
  let lastRaw = null, blocked = false, storageAvailable = true, helpOpen = false, revealOpen = false;
  let feedback = '', feedbackKind = '';
  let decimalShift = null, decimalShiftKey = '', normalizationKey = '';
  let multiplicationRefresh = null;

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

  // Like arifmetika.html's renderCorner: every digit keeps its own column.
  // Visual choices only fill the existing draft; checking remains deliberate.
  function selectedPrefix(p, s) {
    const a = p.actions[s.step];
    if (a.kind === 'start' && s.accepted) return a.sourceIndex;
    if (a.kind !== 'start') return p.actions.slice(0, s.step).some(b => b.kind === 'start') ? p.cycles[0].sourceIndex : -1;
    const draft = s.draft.trim();
    for (let i = 0; i < p.intLen; i++) if (p.digits.slice(0, i + 1).join('') === draft) return i;
    return -1;
  }
  function drawNotebookMarks() {
    const notebook = $('notebook'), svg = notebook.querySelector('.notebook-marks');
    if (!svg || notebook.parentElement.hidden) return;
    const box = notebook.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    const archEnd = Number(notebook.dataset.selectedEnd);
    let marks = '';
    if (Number.isInteger(archEnd) && archEnd >= 0) {
      const first = notebook.querySelector('[data-source-digit="0"]')?.getBoundingClientRect();
      const last = notebook.querySelector('[data-source-digit="' + archEnd + '"]')?.getBoundingClientRect();
      if (first && last) {
        const x1 = first.left - box.left + 3, x2 = last.right - box.left - 3, y = first.top - box.top - 4;
        marks += '<path class="first-arch" data-first-arch data-selected-end="' + archEnd + '" d="M ' + x1 + ' ' + y + ' Q ' + ((x1 + x2) / 2) + ' ' + (y - 22) + ' ' + x2 + ' ' + y + '"/>';
      }
    }
    const target = notebook.querySelector('[data-bring-target]');
    if (target) {
      const index = target.dataset.bringTarget;
      const source = notebook.querySelector('[data-source-digit="' + index + '"]');
      if (source) {
        const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
        const x1 = from.left + from.width / 2 - box.left, y1 = from.bottom - box.top + 2;
        const x2 = to.left + to.width / 2 - box.left, y2 = to.top - box.top - 3;
        marks += '<defs><marker id="bring-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs><path data-bring-arrow data-source-index="' + index + '" class="bring-arrow" pathLength="1" marker-end="url(#bring-arrowhead)" d="M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + '"/>';
      }
    }
    svg.innerHTML = marks;
  }
  function renderNotebook(p, s) {
    const completed = s.step + (s.accepted ? 1 : 0);
    const a = p.actions[s.step];
    const visible = p.actions[completed]?.visibleBaseStep ?? p.baseActions.length;
    if (p.micropractice) {
      $('notebook').innerHTML = '<div class="microproblem">' + esc(p.task.dividend) + ' : ' + esc(p.task.divisor) + (s.done ? ' → ' + esc(p.actions[0].answer) : '') + '</div>';
      $('notebook-note').textContent = 'Подбираем одну цифру. Полный уголок здесь не нужен.';
      $('normalization').hidden = true;
      $('decimal-note').hidden = true;
      return;
    }
    const preparing = visible < p.normalizationEnd;
    $('normalization').hidden = !p.normalizationEnd;
    if (p.normalizationEnd) {
      const shift = p.baseActions.findIndex(x => x.kind === 'shift-factor');
      const factorDone = visible > shift;
      const factor = factorDone ? p.baseActions[shift].answer : '?';
      const divisorDone = visible > p.baseActions.findIndex(x => x.kind === 'shift-divisor');
      const dividendDone = visible > p.baseActions.findIndex(x => x.kind === 'shift-dividend');
      const pair = (id, label, original, result, earned) => '<div class="normalization-row" data-normalization="' + id + '" data-earned="' + earned + '"><span class="normalization-label">' + label + '</span><div class="normalization-equation"><span class="original-number" data-original>' + esc(original) + '</span><span class="transform-arrow"><small data-factor data-earned="' + factorDone + '">× ' + esc(factor) + '</small><svg viewBox="0 0 100 14" aria-hidden="true"><path d="M2 7H94M87 1L95 7L87 13"/></svg></span><strong class="changed-number ' + (earned ? 'earned' : 'pending') + '" data-normalized aria-label="' + (earned ? 'Получилось ' + esc(result) : 'Пока не вычислено') + '">' + (earned ? esc(result) : '?') + '</strong></div></div>';
      $('normalization').innerHTML = '<p class="normalization-title">Умножаем оба числа на одно и то же число.</p><div class="normalization-pair">' + pair('dividend', 'Делимое', p.task.dividend, p.normalizedDividend, dividendDone) + pair('divisor', 'Делитель', p.task.divisor, p.normalizedDivisor, divisorDone) + '</div>';
    }
    $('notebook').parentElement.hidden = preparing;
    if (preparing) {
      $('notebook-note').textContent = 'Начнём уголок, когда одинаково изменим оба числа.';
      $('decimal-note').hidden = true;
      return;
    }
    let length = p.originalLength;
    for (const b of p.baseActions.slice(0, visible)) if (b.kind === 'bring') length = Math.max(length, b.sourceIndex + 1);
    const earnedLength = length;
    const bringing = !s.done && ['bring', 'partial'].includes(a.kind);
    if (bringing) length = Math.max(length, a.sourceIndex + 1);
    const hasComma = length > p.intLen;
    const columns = ['var(--cell)'];
    const digitColumn = [];
    for (let i = 0; i < length; i++) {
      if (hasComma && i === p.intLen) columns.push('calc(var(--cell) * .35)');
      digitColumn[i] = columns.length + 1;
      columns.push('var(--cell)');
    }
    const template = columns.join(' ');
    function row(text, end, cls, minus, targetIndex = -1, pendingIndex = -1) {
      const start = end - String(text).length + 1;
      let cells = '';
      const minusColumn = hasComma && start === p.intLen ? digitColumn[start] - 2 : digitColumn[start] - 1;
      if (minus) cells += '<span class="minus" style="grid-column:' + minusColumn + '">−</span>';
      for (let j = 0; j < String(text).length; j++) cells += '<span class="' + cls + '" ' + (start + j === targetIndex ? 'data-bring-target="' + targetIndex + '" ' : '') + 'style="grid-column:' + digitColumn[start + j] + '">' + esc(String(text)[j]) + '</span>';
      if (pendingIndex >= 0) cells += '<span class="pending-digit" data-bring-target="' + pendingIndex + '" aria-label="Место для снесённой цифры" style="grid-column:' + digitColumn[pendingIndex] + '"></span>';
      if (cls.includes('subtraction') && hasComma && start < p.intLen && end >= p.intLen) cells += '<span class="subtraction" style="grid-column:' + (digitColumn[p.intLen] - 1) + '"></span>';
      return '<div class="number-row" style="--columns:' + template + '">' + cells + '</div>';
    }
    const activeCycle = Number.isInteger(a.cycle) ? a.cycle : p.cycles.findIndex(c => c.sourceIndex === a.sourceIndex);
    const activeIndex = a.sourceIndex ?? p.cycles[activeCycle]?.sourceIndex;
    const firstEnd = p.cycles[0].sourceIndex;
    const chosenEnd = selectedPrefix(p, s);
    const choosing = !s.accepted && a.kind === 'start';
    let top = '';
    for (let i = 0; i < length; i++) {
      const inFirst = ['start','count'].includes(a.kind) && i <= chosenEnd;
      const bringSource = bringing && i === a.sourceIndex;
      const firstActive = activeCycle === 0 && a.kind !== 'start' && i <= firstEnd;
      const cls = !s.done && (inFirst || bringSource || firstActive) ? 'current' : '';
      if (hasComma && i === p.intLen) top += '<span class="dividend-comma" data-dividend-comma style="grid-column:' + (digitColumn[i] - 1) + '">,</span>';
      const attrs = ' data-source-digit="' + i + '"' + (i >= p.originalLength ? ' data-append-zero data-earned="' + (i < earnedLength) + '"' : '') + ' style="grid-column:' + digitColumn[i] + '"';
      if (choosing && i < p.intLen) top += '<button type="button" class="prefix-digit ' + cls + '" data-prefix-end="' + i + '" aria-label="Начать с числа ' + p.digits.slice(0, i + 1).join('') + '" aria-pressed="' + (i <= chosenEnd) + '"' + attrs + '>' + p.digits[i] + '</button>';
      else top += '<span class="' + cls + (i >= earnedLength ? ' pending-digit' : '') + '"' + attrs + '>' + (i < earnedLength ? p.digits[i] : '') + '</span>';
    }
    let rows = '<div class="number-row" style="--columns:' + template + '">' + top + '</div>';
    for (let i = 0; i < p.cycles.length; i++) {
      const c = p.cycles[i];
      if (visible <= c.productAction) break;
      rows += row(c.product, c.sourceIndex, 'subtraction', true);
      if (visible <= c.subtractAction) break;
      const next = p.cycles[i + 1];
      const bringIndex = next ? p.baseActions.findIndex(b => b.kind === 'bring' && b.sourceIndex === next.sourceIndex) : -1;
      const brought = next && visible > bringIndex;
      const pending = next && bringing && a.kind === 'bring' && !s.accepted && a.sourceIndex === next.sourceIndex;
      let value = String(c.remainder), end = c.sourceIndex;
      if (brought) {
        // Like the arithmetic suite, extend the remainder to the next partial
        // dividend without padding it with unfamiliar leading zeros (05, 00).
        value = String(next.partial); end = next.sourceIndex;
      }
      const isActive = !s.done && (brought ? activeIndex === next.sourceIndex || activeCycle === i + 1 : activeCycle === i);
      rows += row(value, end, isActive ? 'current' : '', false, bringing && brought && a.sourceIndex === next?.sourceIndex ? next.sourceIndex : -1, pending ? next.sourceIndex : -1);
    }
    let quotient = '';
    for (const b of p.baseActions.slice(0, visible)) {
      if (b.kind === 'digit') quotient += b.answer;
      if (b.kind === 'comma') quotient += ',';
    }
    const countDone = p.actions.slice(0, completed).some(b => b.kind === 'count');
    const digitsDone = quotient.split(',')[0].length;
    const slotCount = countDone ? Math.max(0, p.integerDigitCount - digitsDone) : 0;
    let slots = Array.from({length:slotCount}, (_, i) => '<span class="slot' + (i === 0 && a.kind === 'digit' && !s.accepted ? ' next-slot' : '') + '" data-quotient-slot aria-label="Место для цифры ответа">·</span>').join('');
    if (!slotCount && a.kind === 'digit' && !s.accepted && quotient.includes(',')) slots = '<span class="slot next-slot" data-quotient-slot aria-label="Место для следующей цифры ответа">·</span>';
    if (!quotient && !slots) slots = '<span class="slot uncounted" aria-label="Здесь будет ответ">?</span>';
    const writtenQuotient = esc(quotient).replace(',', '<span data-quotient-comma class="quotient-comma">,</span>');
    $('notebook').dataset.selectedEnd = String(chosenEnd);
    $('notebook').innerHTML = '<div class="working">' + rows + '</div><div class="right-side"><div class="divisor">' + p.normalizedDivisor + '</div><div class="quotient">' + writtenQuotient + slots + '</div></div><svg class="notebook-marks" aria-hidden="true"></svg>';
    $('notebook-note').textContent = s.done ? 'Все строки решения остаются перед тобой.' : a.kind === 'start' ? s.accepted ? 'Первое неполное делимое выбрано. Можно продолжать.' : chosenEnd < 0 ? 'Нажми на последнюю цифру числа, с которого начнёшь делить.' : 'Дуга показывает твой выбор. Теперь проверь его.' : a.kind === 'shift-dividend' && s.accepted ? 'Числа подготовлены. Теперь начнём деление уголком.' : a.kind === 'bring' ? 'По стрелке сносим одну цифру к остатку.' : a.kind === 'digit' && !s.accepted ? 'Новую цифру ответа запишем справа, на отмеченном месте.' : countDone && !quotient ? 'Точки справа — места для цифр ответа.' : 'Выделено число, с которым сейчас работаем.';
    const appended = earnedLength - p.originalLength;
    const commaAction = a.kind === 'comma';
    const appendAction = bringing && p.baseActions.some(b => b.kind === 'bring' && b.sourceIndex === a.sourceIndex && b.appended);
    $('decimal-note').hidden = !(commaAction || appendAction || appended > 0);
    let cue = commaAction ? '<p>Цифры целой части делимого закончились. Перед делением десятых поставим запятую в ответе.</p>' + (quotient.startsWith('0') ? '<p>Ноль перед запятой сохраняем.</p>' : '') : appendAction ? '<p>Справа после запятой можно дописать ноль. Число останется тем же.</p>' : '';
    if (appended > 0) {
      const original = p.normalizedDividend;
      const extended = original + (original.includes(',') ? '' : ',');
      cue += '<p class="decimal-equality" data-zero-equality>' + esc(original) + ' = ' + Array.from({length:appended}, (_, i) => esc(extended + '0'.repeat(i + 1))).join(' = ') + '</p>';
    }
    $('decimal-note').innerHTML = cue;
    requestAnimationFrame(drawNotebookMarks);
  }

  function renderResults() {
    const total = state.records.length;
    const alone = state.records.filter(independent).length;
    $('results-text').textContent = total ? 'Закончено примеров по шагам: ' + total + '. Новых, без ошибок и дополнительных подсказок: ' + alone + '. С помощью, исправлениями или повторно: ' + (total - alone) + '.' : 'Здесь появятся законченные примеры.';
  }
  function renderRouteLinks() {
    const level = route?.levelForGuided(state.active);
    const returnURL = level ? route.routeURL(level) : '../arithmetic-route.html';
    $('course-navigation').hidden = !inCourse;
    $('course-return').href = returnURL;
    $('course-return-completion').href = returnURL;
    $('course-return-completion').hidden = !inCourse;
    if (level) {
      $('arithmetic-link').href = route.practiceURL(level);
      $('arithmetic-link').textContent = 'Потренироваться в арифметике: ' + G.topics.find(t => t.id === state.active).title.toLowerCase();
    }
  }
  // The comma position is another way to enter the existing shift-count draft.
  // Moving it never accepts an answer or skips one of the four preparation steps.
  function renderDecimalShift(p, s) {
    const a = p.actions[s.step];
    const completed = s.step + Number(s.accepted);
    const preparing = (p.actions[completed]?.visibleBaseStep ?? p.baseActions.length) < p.normalizationEnd;
    const show = preparing && !!window.DecimalShift;
    $('decimal-shift').hidden = !show;
    $('normalization-record').hidden = !p.normalizationEnd;
    const recordKey = s.id + ':' + String(show);
    if (normalizationKey !== recordKey) {
      $('normalization-record').open = !show;
      normalizationKey = recordKey;
    }
    if (!show) {
      decimalShift?.destroy(); decimalShift = null; decimalShiftKey = '';
      return;
    }
    const countIndex = p.actions.findIndex(action => action.kind === 'shift-count');
    const raw = a.kind === 'shift-count' ? s.draft.trim() : s.answers[countIndex];
    const value = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : 0;
    const locked = a.kind !== 'shift-count' || s.accepted;
    const key = s.id + ':' + fingerprint(s.task);
    if (key !== decimalShiftKey) {
      decimalShift?.destroy();
      decimalShift = window.DecimalShift.create($('decimal-shift'), {
        dividend:s.task.dividend, divisor:s.task.divisor, value, locked,
        onChange(k) {
          const active = current();
          if (active.id !== s.id || active.accepted || active.done || G.plan(active.task).actions[active.step].kind !== 'shift-count') return;
          active.draft = String(k);
          $('answer').value = active.draft;
          feedback = ''; feedbackKind = '';
          $('feedback').textContent = ''; $('feedback').className = '';
          save();
        }
      });
      decimalShiftKey = key;
    } else {
      decimalShift.setValue(value);
      decimalShift.setLocked(locked);
    }
  }
  function render() {
    const s = current(), p = G.plan(s.task), a = p.actions[s.step];
    const topic = G.topics.find(t => t.id === state.active);
    $('topic-label').textContent = topic.title;
    $('problem').textContent = s.task.dividend + ' : ' + s.task.divisor;
    $('step-counter').textContent = s.done ? 'Готово' : 'Шаг ' + (s.step + 1) + ' из ' + p.actions.length;
    const percent = Math.round(100 * (s.step + Number(s.accepted)) / p.actions.length);
    $('step-progress').style.width = percent + '%';
    $('step-progress').parentElement.setAttribute('aria-valuenow', String(percent));
    const topicFinished = state.records.filter(r => r.topic === state.active).length;
    $('topic-progress').textContent = topicFinished ? 'В этой теме закончено примеров: ' + topicFinished : 'Первый пример в этой теме';
    $('question').parentElement.classList.toggle('lesson-complete', s.done);
    $('notebook').parentElement.hidden = false;
    renderDecimalShift(p, s);
    renderNotebook(p, s);
    $('question').hidden = s.done;
    $('completion').hidden = !s.done;
    $('step-name').textContent = names[a.kind];
    $('prompt').textContent = a.kind === 'shift-count' && decimalShift ? 'Передвинь обе запятые вправо, чтобы делитель стал целым.' : a.kind === 'shift-factor' && decimalShift ? 'Во сколько раз увеличились оба числа?' : a.kind === 'shift-divisor' && decimalShift ? 'Запиши новый делитель.' : a.kind === 'shift-dividend' && decimalShift ? 'Запиши новое делимое.' : a.prompt;
    $('answer-note').textContent = a.kind === 'shift-count' && decimalShift ? 'Возьми любую запятую и потяни вправо. Обе переместятся вместе. Потом нажми «Проверить».' : a.kind === 'shift-divisor' && decimalShift ? 'Найди строку «Делитель» и перепиши новое число.' : a.kind === 'shift-dividend' && decimalShift ? 'Найди строку «Делимое» и перепиши новое число.' : a.kind === 'comma' ? 'Перепиши целую часть ответа. Сразу после неё поставь запятую.' : a.kind === 'remainder-check' ? 'Выбери ответ, затем нажми «Проверить».' : a.kind === 'start' ? 'Выбери цифры слева в уголке или впиши число здесь.' : a.kind === 'count' ? 'На каждую цифру ответа наметим одно место.' : ['digit','bring'].includes(a.kind) ? 'Впиши одну цифру.' : 'Впиши число и нажми «Проверить».';
    $('answer-label').textContent = a.kind === 'shift-count' ? 'На сколько мест сдвинули запятые?' : 'Твой ответ';
    $('answer').value = s.draft;
    $('answer').readOnly = s.accepted;
    $('answer').hidden = !!a.options;
    $('answer-label').hidden = !!a.options;
    $('answer-options').hidden = !a.options;
    $('answer-options').innerHTML = a.options ? a.options.map(o => '<button type="button" data-option="' + esc(o.value) + '" aria-pressed="' + (s.draft === o.value) + '" ' + (s.accepted ? 'disabled' : '') + '>' + esc(o.label) + '</button>').join('') : '';
    $('primary').textContent = s.accepted ? 'Дальше' : 'Проверить';
    $('feedback').textContent = feedback || (s.accepted ? a.kind.startsWith('shift-') ? 'Верно. Оба числа изменяются одинаково.' : 'Верно. Посмотри, что записалось в уголке.' : '');
    $('feedback').className = feedbackKind || (s.accepted ? 'good' : '');
    $('help-area').hidden = s.accepted;
    $('multiplication-refresh').hidden = !window.MultiplicationRefresh;
    $('help-toggle').setAttribute('aria-expanded', String(helpOpen));
    $('help-content').hidden = !helpOpen;
    $('hint-text').textContent = a.hint;
    $('multiples').hidden = a.kind !== 'digit' && a.kind !== 'product';
    if (!$('multiples').hidden) $('multiples').innerHTML = '<p class="table-note">Нажми на строку, чтобы подставить ' + (a.kind === 'digit' ? 'цифру' : 'произведение') + '. Затем проверь ответ.</p>' + Array.from({length:10}, (_, q) => '<button type="button" data-multiple="' + (a.kind === 'digit' ? q : p.normalizedDivisor * q) + '">' + p.normalizedDivisor + ' × <b>' + q + '</b> = ' + p.normalizedDivisor * q + '</button>').join('');
    $('revealed').textContent = revealOpen ? 'В этом шаге ответ: ' + a.answer + '. Впиши его и нажми «Проверить».' : '';
    if (s.done) {
      const answer = p.micropractice ? p.actions[0].answer : p.quotient + (s.task.level === 'remainder' ? ' (остаток ' + p.remainder + ')' : '');
      $('completion-text').textContent = (p.micropractice ? 'Подходящая цифра: ' : 'Ответ: ') + answer + '. ' + (independent(s) ? 'Получилось без ошибок и подсказок.' : s.repeated && !s.hints && !s.reveals && !s.errors ? 'Знакомый пример повторён.' : 'Пример пройден с помощью или исправлениями.');
    }
    const nextTopic = followingTopic();
    $('next-topic').hidden = !s.done || !nextTopic;
    if (nextTopic) $('next-topic').textContent = (state.sessions[nextTopic.id] && !state.sessions[nextTopic.id].done ? 'Продолжить тему: ' : 'Следующая тема: ') + nextTopic.title;
    $('save-note').textContent = blocked || !storageAvailable ? 'Можно закончить на сегодня. Отправь учителю результат или снимок экрана: сохранение сейчас недоступно.' : 'Можно закончить на сегодня. Результат сохранится в этом браузере.';
    renderResults();
    renderRouteLinks();
  }
  function moveFocus() {
    const s = current(), a = G.plan(s.task).actions[s.step];
    const target = s.done ? $('next-example') : a.options ? $('answer-options').querySelector('button') : $('answer');
    target?.focus({preventScroll:true});
    const box = $('question').getBoundingClientRect();
    if (!s.done && (box.top < 0 || box.top > innerHeight - 220)) $('question').scrollIntoView({block:'start'});
  }
  function errorText(raw, p, a) {
    if (!raw.trim()) return a.options ? 'Сначала выбери «Да» или «Нет».' : 'Сначала впиши ответ.';
    if (a.kind === 'start') {
      const end = selectedPrefix(p, {...current(), draft:raw});
      if (end < 0) return 'Начинаем с первой цифры слева. Можно взять несколько цифр подряд: нажми на последнюю из них в уголке.';
      if (end < a.sourceIndex) return raw + ' меньше делителя ' + p.normalizedDivisor + '. Возьми ещё одну цифру справа.';
      return 'Здесь взято слишком много цифр. Попробуй взять меньше: нам нужно самое короткое число слева, с которого можно начать деление.';
    }
    if (a.kind === 'digit' && /^\d$/.test(raw)) {
      const c = p.cycles[a.cycle], q = Number(raw), value = q * p.normalizedDivisor;
      return value > c.partial ? q + ' — много: ' + p.normalizedDivisor + ' × ' + q + ' = ' + value + ', а у нас ' + c.partial + '. Попробуй меньшую цифру.' : q + ' — мало: после вычитания можно взять делитель ещё раз. Попробуй большую цифру.';
    }
    if (a.kind === 'remainder-check') return 'Осталось ' + a.remainder + ', а делитель — ' + a.divisor + '. ' + a.remainder + ' меньше ' + a.divisor + (a.remainder === 0 ? ': ноль тоже подходит.' : '. Значит, ещё целый делитель взять нельзя.');
    if (a.kind === 'shift-dividend') {
      const factor = p.baseActions.find(b => b.kind === 'shift-factor').answer;
      return G.equal(raw, p.task.dividend) ? 'Это прежнее делимое. Оба числа умножаем на ' + factor + '. Прочитай новое делимое после переноса запятой.' : 'Оба числа меняем одинаково. Умножь ' + p.task.dividend + ' на ' + factor + ': перенеси запятую вправо на столько же мест, как у делителя.';
    }
    if (a.kind === 'shift-divisor') return 'Меняем именно делитель ' + p.task.divisor + '. Перенеси его запятую вправо на выбранное число мест: в новом делителе запятой не останется.';
    if (a.kind === 'shift-count') {
      const chosen = Number(raw);
      if (!Number.isSafeInteger(chosen) || chosen < 0) return 'Укажи целое число мест. Можно передвинуть запятые мышью или кнопками.';
      if (Number.isSafeInteger(chosen) && chosen > Number(a.answer)) return 'Так частное тоже не меняется, но достаточно меньшего сдвига: только до конца дробной части делителя. Верни обе запятые немного влево.';
      return 'В делителе ' + p.task.divisor + ' ещё остаются цифры после запятой. Сдвинь обе запятые ещё вправо. Остановись сразу после последней цифры делителя.';
    }
    if (a.kind === 'shift-factor') return 'Вспомни перенос запятой: одно место вправо — умножить на 10, два — на 100, три — на 1000.';
    if (a.kind === 'comma') {
      const clean = raw.trim().replace('.', ',');
      if (a.answer === '0,' && (clean === ',' || !clean.startsWith('0'))) return 'Ответ меньше единицы. Перед запятой нужен ноль. Запиши «0,» — без цифр после запятой.';
      if (!clean.includes(',') && clean === a.answer.slice(0, -1)) return 'Целая часть записана. Добавь запятую сразу после её последней цифры: дальше будем делить десятые.';
      return 'Сначала перепиши целую часть ' + a.answer.slice(0, -1) + '. Запятая должна стоять сразу после неё, в самом конце записи.';
    }
    if (a.kind === 'subtract') {
      const c = p.cycles[a.cycle];
      return 'Вычитаем ' + c.product + ' из ' + c.partial + '. Проверь свой результат: если прибавить к нему ' + c.product + ', должно получиться ' + c.partial + '.';
    }
    if (a.kind === 'final-remainder') return 'Остаток — самое нижнее число после вычитания. Посмотри на него в уголке. Число справа под чертой — это частное.';
    if (a.kind === 'bring') return a.appended ? 'Дописываем именно ноль после запятой. Затем сносим эту одну цифру к остатку.' : 'Сносим только одну выделенную цифру из верхней строки. Остаток к ней пока не приписывай: это следующий шаг.';
    if (a.kind === 'partial') return 'Прочитай нижнее выделенное число целиком: остаток и снесённую цифру справа. Если в начале получился ноль, его не пишем.';
    if (a.kind === 'product') return 'Сейчас нужно произведение: ' + p.normalizedDivisor + ' × ' + p.cycles[a.cycle].qd + '. Найденная цифра ответа уже записана справа под чертой.';
    if (a.kind === 'count') return 'Считай места от последней цифры выбранного числа до конца целой части делимого. Каждое место даст одну цифру ответа.';
    if (a.kind === 'digit') return 'Для одного места в ответе нужна одна цифра: от 0 до 9.';
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
  $('answer').addEventListener('input', () => {
    const s = current(); s.draft = $('answer').value; save();
    const p = G.plan(s.task);
    if (p.actions[s.step].kind === 'start') renderNotebook(p, s);
    if (p.actions[s.step].kind === 'shift-count') renderDecimalShift(p, s);
  });
  function fillDraft(value) {
    const s = current(); if (s.accepted || s.done) return;
    s.draft = String(value); feedback = ''; feedbackKind = ''; save(); render();
  }
  $('notebook').addEventListener('click', event => {
    const digit = event.target.closest('[data-prefix-end]');
    if (!digit) return;
    const s = current(), p = G.plan(s.task);
    if (p.actions[s.step].kind !== 'start' || s.accepted) return;
    const index = Number(digit.dataset.prefixEnd);
    fillDraft(p.digits.slice(0, index + 1).join(''));
    $('notebook').querySelector('[data-prefix-end="' + index + '"]')?.focus({preventScroll:true});
  });
  $('multiples').addEventListener('click', event => {
    const option = event.target.closest('[data-multiple]');
    if (!option) return;
    fillDraft(option.dataset.multiple);
    $('answer').focus({preventScroll:true});
  });
  $('answer-options').addEventListener('click', event => {
    const button = event.target.closest('button[data-option]');
    if (!button || current().accepted) return;
    current().draft = button.dataset.option; feedback = ''; feedbackKind = ''; save(); render();
    $('primary').focus({preventScroll:true});
  });
  $('multiplication-refresh').onclick = () => {
    if (!window.MultiplicationRefresh) return;
    if (!multiplicationRefresh) multiplicationRefresh = window.MultiplicationRefresh.create({onHelp() {
      const s = current();
      if (!s || s.done) return;
      s.hints = Math.min(1000000, s.hints + 1);
      save();
    }});
    const p = G.plan(current().task);
    multiplicationRefresh?.open(p.normalizedDivisor >= 2 && p.normalizedDivisor <= 9 ? p.normalizedDivisor : undefined);
  };
  $('help-toggle').onclick = () => {
    if (!helpOpen) current().hints = Math.min(1000000, current().hints + 1);
    helpOpen = !helpOpen; save(); render();
  };
  $('reveal').onclick = () => {
    if (!revealOpen) current().reveals = Math.min(1000000, current().reveals + 1);
    revealOpen = true; save(); render();
  };
  function followingTopic() {
    const route = G.topics.filter(t => !t.optional), index = route.findIndex(t => t.id === state.active);
    return index >= 0 ? route[index + 1] : null;
  }
  function showTopics() {
    const groups = [{title:'Целые числа', ids:['start','oneDigit','zero','remainder','twoDigit']}, {title:'Десятичные дроби', ids:['decimalNatural','appendZeros','decimalDivisor']}, {title:'Короткая тренировка', ids:['quotientDigit']}];
    $('topics-list').innerHTML = groups.map(group => '<section class="topic-group"><h3>' + group.title + '</h3>' + group.ids.map(id => {
      const t = G.topics.find(item => item.id === id), session = state.sessions[id];
      const finished = state.records.filter(r => r.topic === id).length;
      const progress = (finished ? 'Закончено примеров: ' + finished + '.' : 'Ещё нет законченных примеров.') + (session && !session.done ? ' Начат пример — шаг ' + (session.step + 1) + ' из ' + G.plan(session.task).actions.length + '.' : '');
      return '<button type="button" data-topic="' + t.id + '" aria-current="' + (state.active === t.id) + '">' + esc(t.title) + '<small>' + esc(t.description) + '</small><small class="topic-progress" data-topic-progress="' + t.id + '">' + progress + '</small></button>';
    }).join('') + '</section>').join('');
    $('topics-dialog').showModal();
    $('topics-close').focus();
  }
  $('topics-open').onclick = showTopics;
  $('topics-close').onclick = () => $('topics-dialog').close();
  function activateTopic(id) {
    state.active = id;
    history.replaceState(null, '', location.pathname + location.search + '#' + state.active);
    if (!current()) newSession(state.active, false);
    helpOpen = false; revealOpen = false; feedback = ''; feedbackKind = '';
    save(); render(); $('topics-dialog').close(); $('problem').scrollIntoView({block:'start'});
  }
  $('topics-list').onclick = event => {
    const button = event.target.closest('button[data-topic]'); if (!button) return;
    activateTopic(button.dataset.topic);
  };
  $('next-topic').onclick = () => { const next = followingTopic(); if (next) activateTopic(next.id); };
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
  window.addEventListener('resize', () => requestAnimationFrame(drawNotebookMarks));
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
