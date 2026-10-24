(function (window, document) {
  'use strict';

  const math = window.NumberTheoryMath;
  const kind = document.body.dataset.kind;
  if (!math || !['nok', 'nod'].includes(kind)) return;
  const root = document.getElementById('trainer');
  const name = kind === 'nok' ? 'НОК' : 'НОД';
  const fullName = kind === 'nok' ? 'Наименьшее общее кратное' : 'Наибольший общий делитель';
  const definition = kind === 'nok'
    ? 'Самое маленькое положительное число, которое делится на оба данных числа без остатка.'
    : 'Самое большое число, на которое оба данных числа делятся без остатка.';
  const levels = ['Первые шаги', 'Больше множителей', 'Закрепление'];
  const taskMap = new Map(math.bank.map(function (task) { return [task.id, task]; }));
  const feedbackCodes = {
    none: ['none'],
    'factor-a': ['empty', 'integer', 'prime', 'not-divisor', 'quotient', 'divisor-ok', 'row-ok'],
    'factor-b': ['empty', 'integer', 'prime', 'not-divisor', 'quotient', 'divisor-ok', 'row-ok'],
    pairs: ['different', 'missing', 'paired', 'undone', 'ready'],
    build: ['missing', 'extra', 'ready'],
    answer: ['check']
  };
  let notify = function () {};

  function initial(taskId, mode) {
    return {
      kind: kind, taskId: taskId, mode: mode || 'guided', stage: 'factor',
      rowsA: [], rowsB: [], activeA: null, activeB: null,
      divisorDraftA: '', quotientDraftA: '', divisorDraftB: '', quotientDraftB: '',
      pairs: [], pendingA: null, pendingB: null, selected: [], answer: '',
      hintOpen: false, hintLevel: 1, hintUsed: false,
      guidedUsed: mode !== 'independent', settingsOpen: false,
      feedback: { scope: 'none', code: 'none' }
    };
  }
  const requested = new URLSearchParams(window.location.search).get('task');
  let state = initial(taskMap.has(requested) ? requested : math.bank[0].id, 'guided');

  function fail() { throw new Error('Invalid number theory trainer state'); }
  function record(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) fail();
    if (Object.getOwnPropertySymbols(value).length) fail();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(descriptors).length !== keys.length) fail();
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(descriptors, key)) fail();
      if (!Object.prototype.hasOwnProperty.call(descriptors[key], 'value') || !descriptors[key].enumerable) fail();
    }
  }
  function list(value, max) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype ||
        value.length > max || Object.getOwnPropertySymbols(value).length) fail();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(descriptors).length !== value.length + 1) fail();
    for (let i = 0; i < value.length; i += 1) {
      if (!descriptors[i] || !Object.prototype.hasOwnProperty.call(descriptors[i], 'value') || !descriptors[i].enumerable) fail();
    }
  }
  function text(value) {
    if (typeof value !== 'string' || value.length > 24 || /[<>\u0000-\u001f]/.test(value)) fail();
  }
  function isPrime(value) { return Number.isInteger(value) && math.primes.includes(value); }
  function current(rows, original) { return rows.length ? rows[rows.length - 1].quotient : original; }
  function complete(rows, original) { return current(rows, original) === 1; }
  function validateRows(rows, original) {
    list(rows, 8);
    let remainder = original;
    for (const row of rows) {
      record(row, ['divisor', 'quotient']);
      if (remainder <= 1 || !isPrime(row.divisor) || remainder % row.divisor !== 0 ||
          !Number.isInteger(row.quotient) || row.quotient !== remainder / row.divisor) fail();
      remainder = row.quotient;
    }
    return remainder;
  }
  function buildSide(task) { return kind === 'nod' || task.a < task.b ? 'a' : 'b'; }
  function requiredIndexes(value, task, analysis) {
    if (kind === 'nod') return value.pairs.map(function (pair) { return pair.a; });
    const side = buildSide(task);
    const factors = side === 'a' ? analysis.aFactors : analysis.bFactors;
    const paired = new Set(value.pairs.map(function (pair) { return pair[side]; }));
    return factors.map(function (_, index) { return index; }).filter(function (index) { return !paired.has(index); });
  }
  function sameIndexes(a, b) {
    return a.length === b.length && a.every(function (index) { return b.includes(index); });
  }
  function validateState(value) {
    record(value, Object.keys(initial(math.bank[0].id, 'guided')));
    if (value.kind !== kind || typeof value.taskId !== 'string' || !taskMap.has(value.taskId) ||
        !['guided', 'independent'].includes(value.mode) ||
        !['factor', 'pairs', 'build', 'answer'].includes(value.stage)) fail();
    for (const key of ['hintOpen', 'hintUsed', 'guidedUsed', 'settingsOpen']) {
      if (typeof value[key] !== 'boolean') fail();
    }
    if (![1, 2].includes(value.hintLevel) || ((value.hintOpen || value.hintLevel === 2) && !value.hintUsed) ||
        (value.mode === 'guided' && !value.guidedUsed)) fail();
    for (const key of ['divisorDraftA', 'quotientDraftA', 'divisorDraftB', 'quotientDraftB', 'answer']) text(value[key]);
    const task = taskMap.get(value.taskId);
    const analysis = math.analyze(task.a, task.b);
    const restA = validateRows(value.rowsA, task.a);
    const restB = validateRows(value.rowsB, task.b);
    for (const entry of [['activeA', restA], ['activeB', restB]]) {
      const chosen = value[entry[0]];
      if (chosen !== null && (!isPrime(chosen) || entry[1] <= 1 || entry[1] % chosen !== 0)) fail();
    }
    if (restA !== 1 && (value.rowsB.length || value.activeB !== null)) fail();
    if ((value.stage === 'factor') === (restA === 1 && restB === 1)) fail();
    if (value.stage !== 'factor' && (restA !== 1 || restB !== 1 || value.activeA !== null || value.activeB !== null)) fail();
    if (!value.guidedUsed && (value.rowsA.length || value.rowsB.length || value.activeA !== null || value.activeB !== null)) fail();
    list(value.pairs, 8);
    const seenA = new Set();
    const seenB = new Set();
    for (const pair of value.pairs) {
      record(pair, ['a', 'b']);
      if (!Number.isInteger(pair.a) || !Number.isInteger(pair.b) || pair.a < 0 || pair.b < 0 ||
          pair.a >= analysis.aFactors.length || pair.b >= analysis.bFactors.length ||
          seenA.has(pair.a) || seenB.has(pair.b) || analysis.aFactors[pair.a] !== analysis.bFactors[pair.b]) fail();
      seenA.add(pair.a); seenB.add(pair.b);
    }
    if (value.stage === 'factor' && value.pairs.length) fail();
    if (['build', 'answer'].includes(value.stage) && value.pairs.length !== analysis.commonFactors.length) fail();
    for (const entry of [['pendingA', analysis.aFactors, seenA], ['pendingB', analysis.bFactors, seenB]]) {
      const index = value[entry[0]];
      if (index !== null && (value.stage !== 'pairs' || !Number.isInteger(index) || index < 0 ||
          index >= entry[1].length || entry[2].has(index))) fail();
    }
    list(value.selected, 8);
    const options = buildSide(task) === 'a' ? analysis.aFactors : analysis.bFactors;
    if (new Set(value.selected).size !== value.selected.length || value.selected.some(function (index) {
      return !Number.isInteger(index) || index < 0 || index >= options.length;
    })) fail();
    if (!['build', 'answer'].includes(value.stage) && value.selected.length) fail();
    if (value.stage === 'answer' && !sameIndexes(value.selected, requiredIndexes(value, task, analysis))) fail();
    record(value.feedback, ['scope', 'code']);
    if (typeof value.feedback.scope !== 'string' || typeof value.feedback.code !== 'string' ||
        !Object.prototype.hasOwnProperty.call(feedbackCodes, value.feedback.scope) ||
        !feedbackCodes[value.feedback.scope].includes(value.feedback.code)) fail();
    // All data properties have now been checked. Copy only this closed schema.
    return JSON.parse(JSON.stringify(value));
  }

  function getState() { return JSON.parse(JSON.stringify(state)); }
  function applyState(value) {
    const next = validateState(value);
    state = next;
    render();
  }
  function task() { return taskMap.get(state.taskId); }
  function analysis() { const item = task(); return math.analyze(item.a, item.b); }
  function activeSide() { return complete(state.rowsA, task().a) ? 'b' : 'a'; }
  function clearFeedback() { state.feedback = { scope: 'none', code: 'none' }; }
  function feedback(scope, code) { state.feedback = { scope: scope, code: code }; }
  function advanceHint() { state.hintLevel = 1; }
  function commit(focus) { render(focus); notify(); }
  function positiveInteger(raw) {
    if (!/^[0-9]+$/.test(raw.trim())) return null;
    const n = Number(raw.trim());
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }
  function factorStep(side) {
    if (state.mode !== 'guided' || state.stage !== 'factor' || side !== activeSide()) return;
    const upper = side.toUpperCase();
    const rows = state['rows' + upper];
    const rest = current(rows, task()[side]);
    const active = state['active' + upper];
    const key = (active === null ? 'divisorDraft' : 'quotientDraft') + upper;
    const raw = state[key];
    const entered = positiveInteger(raw);
    const scope = 'factor-' + side;
    if (!raw.trim()) feedback(scope, 'empty');
    else if (entered === null) feedback(scope, 'integer');
    else if (active === null) {
      if (!isPrime(entered)) feedback(scope, 'prime');
      else if (rest % entered !== 0) feedback(scope, 'not-divisor');
      else {
        state['active' + upper] = entered;
        feedback(scope, 'divisor-ok');
        advanceHint();
        commit('quotient-' + side);
        return;
      }
    } else if (entered !== rest / active) feedback(scope, 'quotient');
    else {
      rows.push({ divisor: active, quotient: entered });
      state['active' + upper] = null;
      state['divisorDraft' + upper] = '';
      state['quotientDraft' + upper] = '';
      feedback(scope, 'row-ok');
      advanceHint();
      if (complete(state.rowsA, task().a) && complete(state.rowsB, task().b)) {
        state.stage = 'pairs';
        clearFeedback();
        commit('confirm-pairs');
      } else commit('divisor-' + activeSide());
      return;
    }
    commit(active === null ? 'divisor-' + side : 'quotient-' + side);
  }
  function selectPair(side, index) {
    if (state.mode !== 'guided' || state.stage !== 'pairs') return;
    if (state.pairs.some(function (pair) { return pair[side] === index; })) return;
    const key = 'pending' + side.toUpperCase();
    state[key] = state[key] === index ? null : index;
    clearFeedback();
    if (state.pendingA !== null && state.pendingB !== null) {
      const info = analysis();
      if (info.aFactors[state.pendingA] !== info.bFactors[state.pendingB]) feedback('pairs', 'different');
      else {
        state.pairs.push({ a: state.pendingA, b: state.pendingB });
        state.pendingA = null; state.pendingB = null;
        feedback('pairs', 'paired'); advanceHint();
      }
    }
    commit();
  }
  function confirmPairs() {
    if (state.mode !== 'guided' || state.stage !== 'pairs') return;
    if (state.pairs.length !== analysis().commonFactors.length) feedback('pairs', 'missing');
    else {
      state.stage = 'build'; state.pendingA = null; state.pendingB = null;
      feedback('pairs', 'ready'); advanceHint();
    }
    commit();
  }
  function selectBuild(index) {
    if (state.mode !== 'guided' || state.stage !== 'build') return;
    if (state.selected.includes(index)) state.selected = state.selected.filter(function (value) { return value !== index; });
    else state.selected.push(index);
    state.selected.sort(function (a, b) { return a - b; });
    clearFeedback(); commit();
  }
  function confirmBuild() {
    if (state.mode !== 'guided' || state.stage !== 'build') return;
    const expected = requiredIndexes(state, task(), analysis());
    if (state.selected.some(function (index) { return !expected.includes(index); })) feedback('build', 'extra');
    else if (!sameIndexes(state.selected, expected)) feedback('build', 'missing');
    else {
      state.stage = 'answer'; feedback('build', 'ready'); advanceHint();
      commit('answer-input'); return;
    }
    commit();
  }
  function checkAnswer() {
    if (state.mode !== 'independent' && state.stage !== 'answer') return;
    feedback('answer', 'check'); commit('answer-input');
  }
  function chooseTask(offset, mode, level) {
    const entries = math.bank.filter(function (entry) { return entry.level === (level || task().level); });
    let index = entries.findIndex(function (entry) { return entry.id === state.taskId; });
    if (level) index = 0;
    else index = (index + offset + entries.length) % entries.length;
    const open = state.settingsOpen;
    state = initial(entries[index].id, mode || state.mode);
    state.settingsOpen = open;
    commit();
  }

  function h(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function button(id, label, className) {
    const node = h('button', className, label);
    node.type = 'button';
    if (id) node.id = id;
    return node;
  }
  function paragraph(content, className) { return h('p', className || '', content); }
  function expression(factors) { return factors.join(' × '); }
  function heading(number, title, subtitle) {
    const wrap = h('div', 'stage-heading');
    wrap.append(h('span', 'stage-number', number));
    const body = h('div'); body.append(h('h2', '', title));
    if (subtitle) body.append(paragraph(subtitle, 'stage-subtitle'));
    wrap.append(body); return wrap;
  }
  function input(id, value, labelText) {
    const wrap = h('div');
    const label = h('label', '', labelText); label.htmlFor = id;
    const field = h('input', 'number-input');
    field.id = id; field.type = 'text'; field.inputMode = 'numeric';
    field.autocomplete = 'off'; field.maxLength = 24; field.value = value;
    field.setAttribute('spellcheck', 'false');
    wrap.append(label);
    const row = h('div', 'input-row'); row.append(field); wrap.append(row);
    return { wrap: wrap, row: row, field: field };
  }
  function feedbackText() {
    const f = state.feedback;
    if (f.scope === 'none') return null;
    if (f.scope === 'answer') {
      const result = math.evaluateAnswer(kind, task().a, task().b, state.answer);
      let message = result.message;
      if (result.status === 'correct') {
        message += state.guidedUsed ? ' Этот пример разобран по шагам.' :
          state.hintUsed ? ' В этом примере использована подсказка.' : ' Ответ получен без подсказок.';
      }
      return { text: message, tone: result.status === 'correct' ? 'success' : 'error' };
    }
    const factorMessages = {
      empty: 'Впиши число, затем нажми «Проверить шаг».',
      integer: 'Нужно целое положительное число. Впиши его цифрами.',
      prime: 'Нужен простой делитель: у него ровно два делителя — 1 и само число. Число 1 не является простым.',
      'not-divisor': 'На этот делитель число не делится без остатка. Попробуй другой простой делитель.',
      quotient: 'Проверь деление. Впиши, сколько получится; выбранный делитель и предыдущие строки остаются.',
      'divisor-ok': 'Делитель подходит. Теперь выполни деление.',
      'row-ok': 'Верно. Новая строка записана в столбик.'
    };
    if (f.scope.startsWith('factor-')) return { text: factorMessages[f.code], tone: f.code.endsWith('-ok') ? 'success' : 'error' };
    if (f.scope === 'pairs') {
      const messages = {
        different: 'Для пары нужны одинаковые множители. Выбери другое число в одной из строк.',
        missing: 'Ещё остались одинаковые множители без пары. Каждое число можно использовать только один раз.',
        paired: 'Пара найдена. Эти два множителя уже использованы.',
        undone: 'Последняя пара отменена. Остальные пары сохранены.',
        ready: 'Все общие множители найдены.'
      };
      return { text: messages[f.code], tone: ['different', 'missing'].includes(f.code) ? 'error' : 'success' };
    }
    const messages = {
      missing: kind === 'nod' ? 'Возьми по одному множителю из каждой пары. Ещё не все выбраны.' : 'Для меньшего числа ещё не хватает множителей. Выбери все недостающие.',
      extra: kind === 'nod' ? 'Этот множитель не вошёл в общую пару. Для НОД берём только общие множители.' : 'Один из выбранных множителей уже есть в большем числе. Не будем добавлять его второй раз.',
      ready: 'Множители выбраны верно. Осталось вычислить результат.'
    };
    return { text: messages[f.code], tone: f.code === 'ready' ? 'success' : 'error' };
  }
  function feedbackNode(scope) {
    const node = h('div', 'feedback'); node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite');
    node.dataset.feedbackScope = scope;
    if (state.feedback.scope === scope) {
      const f = feedbackText();
      if (f) { node.classList.add(f.tone); node.textContent = f.text; }
    }
    return node;
  }
  function helpControl(container) {
    const row = h('div', 'task-bottom');
    const toggle = button('hint-toggle', state.hintOpen ? 'Закрыть подсказку' : 'Хочешь подсказку?', 'quiet');
    toggle.setAttribute('aria-expanded', String(state.hintOpen)); toggle.setAttribute('aria-controls', 'current-hint');
    row.append(toggle);
    if (state.hintUsed) row.append(h('span', 'help-marker', 'Подсказка использована'));
    container.append(row);
    if (!state.hintOpen) return;
    const hint = h('section', 'hint-box'); hint.id = 'current-hint'; hint.setAttribute('aria-label', 'Подсказка к текущему шагу');
    const info = analysis();
    let clue; let detail;
    if (state.mode === 'independent') {
      clue = definition;
      detail = kind === 'nod' ? 'Проверь, делятся ли оба исходных числа на твой ответ. Среди общих делителей выбери наибольший.' :
        'Проверь, делится ли твой ответ на оба исходных числа. Среди положительных общих кратных выбери наименьшее.';
    } else if (state.stage === 'factor') {
      const side = activeSide(); const upper = side.toUpperCase(); const remainder = current(state['rows' + upper], task()[side]);
      const divisor = state['active' + upper];
      if (divisor === null) {
        clue = 'Найди простой делитель числа ' + remainder + '. Сначала можно проверить 2, потом 3, 5, 7. Деление должно получиться без остатка.';
        detail = 'Один подходящий делитель — ' + math.factorize(remainder)[0] + '. Впиши его справа от черты.';
      } else {
        clue = 'Сколько раз по ' + divisor + ' содержится в числе ' + remainder + '? Можно проверить умножением.';
        detail = remainder + ' : ' + divisor + ' = ' + (remainder / divisor) + '. Запиши частное следующей строкой слева.';
      }
    } else if (state.stage === 'pairs') {
      clue = 'Нажми одинаковый множитель в первой и во второй строке. Каждому экземпляру нужна отдельная пара: одна двойка не может заменить две.';
      let next = null;
      for (let a = 0; a < info.aFactors.length; a += 1) {
        if (state.pairs.some(function (pair) { return pair.a === a; })) continue;
        if (info.bFactors.some(function (factor, b) { return factor === info.aFactors[a] && !state.pairs.some(function (pair) { return pair.b === b; }); })) {
          next = info.aFactors[a]; break;
        }
      }
      detail = next === null ? 'Одинаковых множителей без пары больше нет. Можно переходить к следующему шагу.' : 'Поищи ещё по одному множителю ' + next + ' в каждой строке.';
    } else if (state.stage === 'build') {
      clue = kind === 'nod' ? 'Из каждой общей пары берём один множитель. Второй такой же множитель из пары больше не нужен.' :
        'Берём все множители большего числа. К ним добавляем умножением только то, чего не хватает для меньшего числа.';
      const expected = requiredIndexes(state, task(), info);
      const factors = buildSide(task()) === 'a' ? info.aFactors : info.bFactors;
      detail = expected.length ? 'Нужны множители: ' + expression(expected.map(function (index) { return factors[index]; })) + '.' :
        kind === 'nod' ? 'Общих простых множителей нет. В этом случае НОД равен 1.' : 'Ничего добавлять не нужно: большее число уже делится на меньшее.';
    } else {
      clue = kind === 'nod' ? 'Перемножь выбранные общие множители. Затем проверь, что оба числа делятся на результат.' :
        'Умножь большее число на недостающие множители. Затем проверь деление результата на каждое исходное число.';
      detail = 'Запись для вычисления: ' + resultExpression() + '. В поле ответа впиши только полученное число.';
    }
    hint.append(paragraph(clue));
    if (state.hintLevel === 2) hint.append(paragraph(detail, 'hint-detail'));
    else hint.append(button('hint-step', 'Подсказка к одному действию', 'quiet'));
    if (state.mode === 'independent') hint.append(button('show-guided-help', 'Разобрать этот пример по шагам', 'secondary'));
    container.append(hint);
  }
  function renderTask() {
    const item = task();
    const card = h('section', 'task-card');
    card.append(paragraph(fullName, 'eyebrow'));
    const title = h('h1', '', 'Найди ' + name + ' чисел');
    title.append(h('span', 'task-numbers', item.a + ' и ' + item.b)); card.append(title);
    card.append(paragraph(definition, 'definition'));
    const modes = h('div', 'mode-controls'); modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', 'Способ тренировки');
    const guided = button('mode-guided', 'По шагам'); guided.setAttribute('aria-pressed', String(state.mode === 'guided'));
    const independent = button('mode-independent', 'Попробовать самостоятельно'); independent.setAttribute('aria-pressed', String(state.mode === 'independent'));
    modes.append(guided, independent); card.append(modes);
    return card;
  }
  function renderSettings() {
    const details = h('details', 'settings'); details.id = 'task-settings'; details.open = state.settingsOpen;
    const entries = math.bank.filter(function (entry) { return entry.level === task().level; });
    const index = entries.findIndex(function (entry) { return entry.id === state.taskId; });
    details.append(h('summary', '', levels[task().level - 1] + ' · пример ' + (index + 1) + ' из ' + entries.length + ' · выбрать другой'));
    const grid = h('div', 'settings-grid');
    const group = h('div'); const label = h('label', '', 'Сложность'); label.htmlFor = 'level-select';
    const select = h('select'); select.id = 'level-select';
    levels.forEach(function (level, i) { const option = h('option', '', (i + 1) + '. ' + level); option.value = String(i + 1); option.selected = task().level === i + 1; select.append(option); });
    group.append(label, select); grid.append(group);
    const nav = h('div', 'task-nav'); nav.append(button('previous-task', '← Предыдущий'), button('next-task', 'Другой пример →'));
    grid.append(nav); details.append(grid); return details;
  }
  function renderColumn(side) {
    const upper = side.toUpperCase(); const rows = state['rows' + upper]; const original = task()[side];
    const done = complete(rows, original); const active = state.stage === 'factor' && side === activeSide();
    const column = h('div', 'factor-column' + (active ? ' active' : '') + (done ? ' done' : ''));
    column.dataset.column = side;
    const title = h('div', 'column-heading'); title.append(h('span', '', 'Число ' + original));
    if (done) title.append(h('span', 'done-label', '✓ Готово'));
    column.append(title);
    const table = h('table', 'ladder'); table.setAttribute('aria-label', 'Разложение числа ' + original + ' на простые множители');
    const body = h('tbody'); let remainder = original;
    rows.forEach(function (row) {
      const tr = h('tr'); const cell = h('th', '', remainder); cell.scope = 'row';
      tr.append(cell, h('td', '', row.divisor)); body.append(tr); remainder = row.quotient;
    });
    const last = h('tr', done ? 'last' : active ? 'current' : '');
    const num = h('th', '', remainder); num.scope = 'row';
    last.append(num, h('td', '', state['active' + upper] === null ? (done ? '' : '·') : state['active' + upper])); body.append(last);
    table.append(body); column.append(table);
    if (done) {
      column.append(paragraph(original + ' = ' + expression(math.factorize(original)), 'factor-expression'));
      column.append(paragraph('Дошли до 1. Единицу в произведение не записываем.', 'terminal-note'));
    }
    return column;
  }
  function renderFactorization() {
    const card = h('section', 'work-card'); card.id = 'factorization-section';
    card.append(heading(1, 'Разложи на простые множители', 'Делитель — справа от черты. Частное — следующей строкой слева.'));
    const columns = h('div', 'factor-columns'); columns.append(renderColumn('a'), renderColumn('b')); card.append(columns);
    if (state.stage !== 'factor') return card;
    const side = activeSide(); const upper = side.toUpperCase(); const remainder = current(state['rows' + upper], task()[side]);
    const chosen = state['active' + upper]; const calculation = h('div', 'active-calculation');
    let field;
    if (chosen === null) {
      field = input('divisor-' + side, state['divisorDraft' + upper], 'На какой простой делитель разделим ' + remainder + '?');
      field.row.append(button('accept-' + side, 'Проверить шаг', 'primary'));
      calculation.append(field.wrap);
      if (task().level === 1) {
        const choices = h('div', 'prime-choices'); choices.append(h('span', '', 'Можно выбрать:'));
        [2, 3, 5, 7].forEach(function (prime) {
          const choice = button('', prime); choice.dataset.prime = String(prime); choice.dataset.side = side;
          choice.setAttribute('aria-label', 'Выбрать простой делитель ' + prime); choices.append(choice);
        });
        calculation.append(choices);
      }
    } else {
      calculation.append(paragraph('Делитель ' + chosen + ' записан справа.', 'accepted-divisor'));
      field = input('quotient-' + side, state['quotientDraft' + upper], 'Сколько получится: ' + remainder + ' : ' + chosen + '?');
      field.row.append(button('accept-' + side, 'Проверить шаг', 'primary')); calculation.append(field.wrap);
      calculation.append(button('change-divisor-' + side, 'Выбрать другой делитель', 'quiet'));
    }
    calculation.append(feedbackNode('factor-' + side)); card.append(calculation); helpControl(card);
    return card;
  }
  function renderFactors(side, interactive) {
    const factors = side === 'a' ? analysis().aFactors : analysis().bFactors;
    const row = h('div', 'factor-row'); row.append(h('span', 'factor-row-label', task()[side] + ' ='));
    factors.forEach(function (value, index) {
      if (index) row.append(h('span', 'times', '×'));
      const pairIndex = state.pairs.findIndex(function (pair) { return pair[side] === index; });
      const chip = interactive ? button('', value, 'factor-chip') : h('span', 'factor-chip', value);
      if (pairIndex !== -1) { chip.classList.add('paired'); chip.append(h('small', '', 'ПАРА ' + (pairIndex + 1))); }
      if (interactive) {
        chip.dataset.factorSide = side; chip.dataset.factorIndex = String(index);
        chip.setAttribute('aria-label', 'Множитель ' + value + ', число ' + task()[side] + ', место ' + (index + 1) + (pairIndex === -1 ? '' : ', пара ' + (pairIndex + 1)));
        chip.disabled = pairIndex !== -1;
        const pending = state['pending' + side.toUpperCase()] === index;
        chip.setAttribute('aria-pressed', String(pending)); if (pending) chip.classList.add('pending');
      }
      row.append(chip);
    });
    return row;
  }
  function renderPairs() {
    const card = h('section', 'work-card'); card.id = 'pairs-section';
    card.append(heading(2, 'Собери пары одинаковых множителей', 'Нажми одно число сверху и такое же снизу. Каждый множитель — только в одной паре.'));
    const active = state.stage === 'pairs'; card.append(renderFactors('a', active), renderFactors('b', active));
    if (state.pairs.length) {
      const listNode = h('div', 'pair-list');
      state.pairs.forEach(function (pair, index) { listNode.append(h('span', 'pair-tag', 'Пара ' + (index + 1) + ': ' + analysis().aFactors[pair.a] + ' и ' + analysis().bFactors[pair.b])); });
      card.append(listNode);
    }
    if (active) {
      const controls = h('div', 'confirmation-row'); controls.append(button('confirm-pairs', 'Все общие множители найдены', 'primary'));
      if (state.pairs.length) controls.append(button('undo-pair', 'Отменить последнюю пару', 'quiet'));
      card.append(controls, feedbackNode('pairs')); helpControl(card);
    } else {
      const caption = state.pairs.length ? 'Общие пары сохранены.' : 'Общих простых множителей нет.';
      card.append(paragraph('✓ ' + caption, 'accepted-caption'));
    }
    return card;
  }
  function resultExpression() {
    const info = analysis(); const side = buildSide(task()); const factors = side === 'a' ? info.aFactors : info.bFactors;
    const values = state.selected.map(function (index) { return factors[index]; });
    if (kind === 'nod') return name + '(' + task().a + ', ' + task().b + ') = ' + (values.length ? expression(values) : '1');
    return name + '(' + task().a + ', ' + task().b + ') = ' + info.larger + (values.length ? ' × ' + expression(values) : '');
  }
  function renderBuild() {
    const info = analysis(); const side = buildSide(task()); const factors = side === 'a' ? info.aFactors : info.bFactors;
    const card = h('section', 'work-card'); card.id = 'build-section';
    card.append(heading(3, kind === 'nod' ? 'Возьми общие множители' : 'Дополни большее число',
      kind === 'nod' ? 'Из каждой пары нужен один множитель.' : 'Берём ' + info.larger + '. Выбери множители, которых ему не хватает.'));
    const rule = h('div', 'rule-box');
    if (kind === 'nok') rule.append(paragraph('Берём все множители числа ' + info.larger + ': ' + expression(math.factorize(info.larger)) + '.'));
    else rule.append(paragraph(state.pairs.length ? 'Выбери общие множители в строке числа ' + task().a + '. Множитель из второй строки той же пары повторно не берём.' : 'Общих простых множителей нет. Значит, общий делитель только 1.'));
    card.append(rule);
    if (state.stage === 'build') {
      if (kind === 'nok' || state.pairs.length) {
        const row = h('div', 'factor-row'); row.append(h('span', 'factor-row-label', task()[side] + ' ='));
        factors.forEach(function (value, index) {
          if (index) row.append(h('span', 'times', '×'));
          const chip = button('', value, 'factor-chip'); chip.dataset.buildIndex = String(index);
          chip.setAttribute('aria-label', 'Взять множитель ' + value + ', место ' + (index + 1));
          chip.setAttribute('aria-pressed', String(state.selected.includes(index)));
          if (state.selected.includes(index)) chip.classList.add('selected');
          const pairIndex = state.pairs.findIndex(function (pair) { return pair[side] === index; });
          if (pairIndex !== -1) chip.append(h('small', '', 'ПАРА ' + (pairIndex + 1)));
          row.append(chip);
        });
        card.append(row);
      }
      const selected = state.selected.map(function (index) { return factors[index]; });
      card.append(paragraph(selected.length ? 'Выбраны: ' + expression(selected) : 'Пока ничего не выбрано.', 'selection-explanation'));
      if (kind === 'nok' && requiredIndexes(state, task(), info).length === 0) {
        card.append(paragraph('Если ничего добавлять не нужно, оставь множители невыбранными и нажми «Проверить выбор».', 'selection-explanation'));
      }
      const control = button(kind === 'nod' ? 'confirm-common' : 'confirm-missing', 'Проверить выбор', 'primary');
      card.append(control, feedbackNode('build')); helpControl(card);
    } else {
      card.append(paragraph(resultExpression(), 'result-expression'));
      card.append(paragraph('✓ Выбранные множители сохранены.', 'accepted-caption'));
    }
    return card;
  }
  function renderAnswer() {
    const card = h('section', 'work-card'); card.id = 'answer-section';
    card.append(heading(state.mode === 'guided' ? 4 : '→', 'Вычисли ' + name + ' и проверь'));
    if (state.mode === 'independent') {
      card.append(paragraph(state.guidedUsed || state.hintUsed ? 'В этом примере открывалась поддержка. Можно закончить его или выбрать другой для самостоятельной проверки.' : 'Реши на листе или в уме. Разбор текущего примера можно открыть в любой момент.', 'independent-note'));
    }
    const entry = input('answer-input', state.answer, name + '(' + task().a + ', ' + task().b + ') — впиши одно целое число:');
    entry.row.append(button('check-answer', 'Проверить', 'primary')); card.append(entry.wrap, feedbackNode('answer'));
    const checked = state.feedback.scope === 'answer' && math.evaluateAnswer(kind, task().a, task().b, state.answer).status === 'correct';
    if (checked) {
      const value = Number(state.answer.trim());
      const proof = kind === 'nod' ? task().a + ' : ' + value + ' = ' + (task().a / value) + ';  ' + task().b + ' : ' + value + ' = ' + (task().b / value) :
        value + ' : ' + task().a + ' = ' + (value / task().a) + ';  ' + value + ' : ' + task().b + ' = ' + (value / task().b);
      card.append(paragraph('Проверка: ' + proof + '.', 'answer-proof'));
    }
    helpControl(card);
    const fresh = h('div', 'fresh-row');
    fresh.append(button('fresh-independent', 'Другой пример самостоятельно →', 'secondary'));
    card.append(fresh); return card;
  }
  function render(focus) {
    const activeId = focus || (document.activeElement && root.contains(document.activeElement) ? document.activeElement.id : '');
    const selection = !focus && document.activeElement && typeof document.activeElement.selectionStart === 'number' ? document.activeElement.selectionStart : null;
    const fragment = document.createDocumentFragment();
    fragment.append(renderTask(), renderSettings());
    if (state.mode === 'guided') {
      fragment.append(renderFactorization());
      if (state.stage !== 'factor') fragment.append(renderPairs());
      if (['build', 'answer'].includes(state.stage)) fragment.append(renderBuild());
      if (state.stage === 'answer') fragment.append(renderAnswer());
    } else fragment.append(renderAnswer());
    root.replaceChildren(fragment);
    const target = activeId && document.getElementById(activeId);
    if (target && !target.disabled) {
      target.focus({ preventScroll: true });
      if (selection !== null && typeof target.setSelectionRange === 'function') target.setSelectionRange(selection, selection);
    }
  }

  root.addEventListener('click', function (event) {
    const target = event.target.closest('button');
    if (!target || !root.contains(target) || target.disabled) return;
    if (target.dataset.prime) {
      const side = target.dataset.side;
      state['divisorDraft' + side.toUpperCase()] = target.dataset.prime;
      factorStep(side); return;
    }
    if (target.dataset.factorSide) { selectPair(target.dataset.factorSide, Number(target.dataset.factorIndex)); return; }
    if (target.dataset.buildIndex !== undefined) { selectBuild(Number(target.dataset.buildIndex)); return; }
    const id = target.id;
    if (id === 'accept-a' || id === 'accept-b') { factorStep(id.slice(-1)); return; }
    if (id.startsWith('change-divisor-')) {
      state['active' + id.slice(-1).toUpperCase()] = null; clearFeedback(); advanceHint(); commit('divisor-' + id.slice(-1)); return;
    }
    if (id === 'mode-guided' || id === 'show-guided-help') {
      state.mode = 'guided'; state.guidedUsed = true;
      if (id === 'show-guided-help') state.hintUsed = true;
      clearFeedback(); commit(); return;
    }
    if (id === 'mode-independent') { state.mode = 'independent'; clearFeedback(); commit('answer-input'); return; }
    if (id === 'next-task' || id === 'previous-task') { chooseTask(id === 'next-task' ? 1 : -1); return; }
    if (id === 'fresh-independent') { chooseTask(1, 'independent'); return; }
    if (id === 'hint-toggle') { state.hintOpen = !state.hintOpen; if (state.hintOpen) state.hintUsed = true; commit('hint-toggle'); return; }
    if (id === 'hint-step') { state.hintLevel = 2; state.hintUsed = true; commit(); return; }
    if (id === 'confirm-pairs') { confirmPairs(); return; }
    if (id === 'undo-pair') {
      state.pairs.pop(); state.pendingA = null; state.pendingB = null;
      feedback('pairs', 'undone'); advanceHint(); commit(); return;
    }
    if (id === 'confirm-common' || id === 'confirm-missing') { confirmBuild(); return; }
    if (id === 'check-answer') checkAnswer();
  });
  root.addEventListener('input', function (event) {
    const target = event.target;
    const fields = { 'divisor-a': 'divisorDraftA', 'quotient-a': 'quotientDraftA', 'divisor-b': 'divisorDraftB', 'quotient-b': 'quotientDraftB', 'answer-input': 'answer' };
    if (!Object.prototype.hasOwnProperty.call(fields, target.id)) return;
    const value = target.value.replace(/[<>\u0000-\u001f]/g, '').slice(0, 24);
    if (target.value !== value) target.value = value;
    state[fields[target.id]] = value;
    clearFeedback();
    root.querySelectorAll('.feedback').forEach(function (node) { node.textContent = ''; node.className = 'feedback'; });
    const proof = root.querySelector('.answer-proof'); if (proof) proof.remove();
    notify();
  });
  root.addEventListener('change', function (event) {
    if (event.target.id === 'level-select') chooseTask(0, state.mode, Number(event.target.value));
  });
  root.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    const id = event.target.id;
    if (id === 'answer-input') { event.preventDefault(); checkAnswer(); }
    else if (/^(divisor|quotient)-[ab]$/.test(id)) { event.preventDefault(); factorStep(id.slice(-1)); }
  });
  root.addEventListener('toggle', function (event) {
    if (event.target.id !== 'task-settings' || !root.contains(event.target) || state.settingsOpen === event.target.open) return;
    state.settingsOpen = event.target.open; notify();
  }, true);

  if (window.parent !== window) document.body.classList.add('embedded');
  window.NumberTheoryTrainer = Object.freeze({ getState: getState, applyState: applyState, validateState: validateState });
  window.getBoardTrainerState = getState;
  window.applyBoardTrainerState = applyState;
  render();
  if (window.MathExamBoard) {
    window.MathExamBoard.register({
      id: 'grade6-' + kind, version: '1.0.0', stateSchemaVersion: 1,
      parentOrigin: window.location.origin, getState: getState, applyState: applyState,
      subscribe: function (callback) { notify = callback; return function () { notify = function () {}; }; }
    });
  }
})(window, document);
