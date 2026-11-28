(function () {
  'use strict';
  if (typeof document === 'undefined' || window.top !== window) return;
  const lab = document.getElementById('condition-lab');
  if (!lab) return;
  const work = document.getElementById('condition-work');
  const lesson = document.getElementById('lesson');
  const entry = document.getElementById('condition-entry');
  const {cards, transfers, model, checkAnswer} = window.TyurinConditionData;
  const eligible = ['113-35', '114-10', '114-12'];
  const key = 'math:tyurin-condition:v1';
  const independentOverlap = model(cards).independentBoth;
  const stages = ['predict', 'condition', 'independent', 'disjoint', 'rule', 'transfer', 'result'];
  const relations = {
    independent: 'События независимы',
    dependent: 'События совместны и зависимы',
    disjoint: 'События несовместны и зависимы'
  };
  const fresh = () => ({
    stage: 'predict', direction: '', filtered: false, answer: '', overlap: cards.both,
    variant: 0, base: '', given: '', relation: '', attempts: 0, history: {},
    feedback: '', draws: 0, stars: 0, hits: 0
  });
  let state = fresh(), stored = null, storageNotice = '';
  function valid(s) {
    const integer = (x, max) => Number.isSafeInteger(x) && x >= 0 && x <= max;
    return s && stages.includes(s.stage) && ['', 'up', 'down', 'same'].includes(s.direction)
      && typeof s.filtered === 'boolean' && integer(s.overlap, cards.b)
      && integer(s.variant, transfers.length - 1) && integer(s.attempts, 10000)
      && [s.answer, s.base, s.given].every(v => typeof v === 'string' && v.length <= 60)
      && (s.relation === '' || Object.hasOwn(relations, s.relation))
      && ['', 'missing', 'wrong', 'right'].includes(s.feedback)
      && s.history && typeof s.history === 'object' && !Array.isArray(s.history)
      && Object.entries(s.history).every(([k,v]) => transfers.some(t => t.id === k)
        && ['first', 'corrected'].includes(v))
      && integer(s.draws, 100000) && integer(s.stars, s.draws) && integer(s.hits, s.stars);
  }
  try {
    stored = localStorage.getItem(key);
    if (stored) {
      let saved;
      try { saved = JSON.parse(stored); } catch { /* A damaged draft starts fresh. */ }
      if (valid(saved)) state = saved;
    }
  } catch { storageNotice = 'Сохранение недоступно. Можно заниматься в этой вкладке.'; }

  function save() {
    if (storageNotice) return;
    try {
      if (stored !== localStorage.getItem(key)) {
        storageNotice = 'В другой вкладке уже есть более свежая запись. Здесь можно продолжать без сохранения.';
      } else {
        const next = JSON.stringify(state);
        localStorage.setItem(key, next);
        stored = next;
      }
    } catch { storageNotice = 'Сохранение недоступно. Можно заниматься в этой вкладке.'; }
    const note = work.querySelector('.condition-storage');
    if (note) note.textContent = storageNotice;
  }

  const esc = value => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
  const command = (id, label, submit = false) =>
    '<button type="' + (submit ? 'submit' : 'button') + '" data-cmd="' + id + '">' + label + '</button>';
  const field = (id, label, value, disabled = false) =>
    '<label for="condition-' + id + '">' + label + '</label><input type="text" maxlength="60" autocomplete="off" ' +
    (disabled ? 'readonly ' : '') + 'id="condition-' + id + '" value="' + esc(value) + '">';
  function deck(overlap, filtered) {
    const cells = [];
    for (let i = 0; i < cards.total; i++) {
      const geo = i < cards.a;
      const star = geo ? i < overlap : i < cards.a + cards.b - overlap;
      const mark = filtered && !star ? '—' : (geo ? '△' : '+') + (star ? ' ★' : '');
      cells.push('<span class="condition-card" data-geometry="' + geo + '" data-star="' + star +
        '" data-muted="' + (filtered && !star) + '">' + mark + '</span>');
    }
    return '<div class="condition-deck" aria-hidden="true">' + cells.join('') + '</div>';
  }
  function counts(m) {
    return '<table class="condition-table"><caption>Сколько карточек каждого вида</caption><thead><tr>' +
      '<th scope="col">Задача</th><th scope="col">Со звездой</th><th scope="col">Без звезды</th>' +
      '<th scope="col">Всего</th></tr></thead><tbody><tr><th scope="row">Геометрия</th><td>' + m.both +
      '</td><td>' + m.onlyA + '</td><td>' + m.a + '</td></tr><tr><th scope="row">Арифметика</th><td>' +
      m.onlyB + '</td><td>' + m.neither + '</td><td>' + (m.total - m.a) +
      '</td></tr></tbody><tfoot><tr><th scope="row">Всего</th><td>' + m.b + '</td><td>' +
      (m.total - m.b) + '</td><td>' + m.total + '</td></tr></tfoot></table>';
  }
  const legend = '<p class="condition-legend">△ — геометрия, + — арифметика, ★ — отметка на карточке.</p>';
  const status = message => '<p class="condition-result" id="condition-response" role="status">' + esc(message || '') + '</p>';
  function prediction() {
    const options = [['up', 'Станет больше'], ['down', 'Станет меньше'], ['same', 'Останется таким же']];
    return '<h3 tabindex="-1">Как звезда меняет шанс?</h3><p>Из 24 перемешанных карточек наугад вытягивают одну. ' +
      'На 9 карточках задача по геометрии, на остальных — по арифметике. Каждая карточка может выпасть с одинаковой вероятностью.</p>' +
      legend + deck(cards.both, false) + counts(model(cards)) +
      '<form data-submit="predict"><fieldset><legend>Ты узнал, что на вытянутой карточке звезда. Как изменится шанс получить геометрию?</legend>' +
      options.map(([v,t]) => '<label><input type="radio" name="direction" value="' + v + '"' +
        (state.direction === v ? ' checked' : '') + '> ' + t + '</label>').join('') +
      '</fieldset>' + command('predict','Проверить прогноз на карточках',true) + '</form>' +
      status(state.feedback === 'missing' ? 'Сначала отметь свой прогноз.' : '');
  }
  function conditional() {
    let message = '';
    if (state.feedback === 'missing') message = 'Введи число или дробь.';
    if (state.feedback === 'wrong') message = checkAnswer(state.answer, model(cards), 'givenB').message;
    if (state.feedback === 'right') message = 'Верно. Со звездой осталось 8 карточек, из них 6 с геометрией. Шанс вырос с 9/24 до 6/8.';
    const predicted = {up:'шанс станет больше', down:'шанс станет меньше', same:'шанс останется таким же'};
    const right = state.feedback === 'right';
    return '<h3 tabindex="-1">Оставь исходы, подходящие под условие</h3><p>Твой прогноз — ' +
      predicted[state.direction] + '. В полной колоде геометрия встречается на 9 из 24 карточек. ' +
      'Теперь известно, что на выбранной карточке есть звезда. Обозначим геометрию буквой A, а звезду — буквой B.</p>' + legend + deck(cards.both, state.filtered) +
      '<div class="condition-controls"><button type="button" data-cmd="filter" aria-pressed="' + state.filtered + '">' +
      (state.filtered ? 'Показать всю колоду' : 'Оставить только карточки со звездой') + '</button></div>' +
      (state.filtered ? '<p>В отборе 8 карточек со звездой. Среди них 6 с треугольником и 2 с плюсом.</p>' : '') +
      (state.filtered || right ? '<form data-submit="answer">' + field('answer',
        'Какова вероятность геометрии среди оставленных карточек? Введи дробь или число.', state.answer, right) +
        (right ? '' : command('answer', 'Проверить дробь', true)) + '</form>' : '') +
      status(message) + (right ? command('explore', 'Изменить расположение звёзд') : '');
  }
  function experiment() {
    const m = model(cards, state.overlap);
    const disjoint = state.stage === 'disjoint', right = state.feedback === 'right';
    let message = '';
    if (right) message = disjoint
      ? 'Верно. Со звездой нет ни одной задачи по геометрии. Вместе события невозможны. Известие о звезде изменило шанс с 9/24 до нуля, поэтому события зависимы.'
      : 'Верно. Среди всех карточек геометрия встречается в 9 случаях из 24, а среди отмеченных — в 3 из 8. Эти доли равны.';
    if (state.feedback === 'wrong') message = disjoint
      ? 'Посмотри, осталась ли хотя бы одна карточка с треугольником и звездой одновременно.'
      : 'Сравни долю геометрии среди отмеченных с 9/24 во всей колоде. Можно изменить ещё одну отметку.';
    return '<h3 tabindex="-1">' + (disjoint ? 'Могут ли события стать несовместными?' : 'Когда звезда перестаёт давать подсказку?') +
      '</h3><p>Передвигая ползунок на одно деление, ты переносишь звезду с одной карточки на другую. ' +
      'Всего по-прежнему 8 звёзд и 9 геометрических задач.</p><p>' +
      (disjoint ? 'Расположи звёзды так, чтобы ни одна геометрическая задача не могла оказаться отмеченной.' :
      'Расположи звёзды так, чтобы среди отмеченных доля геометрии стала такой же, как во всей колоде.') +
      '</p><label for="condition-overlap">Геометрических карточек со звездой: <output id="condition-x">' + state.overlap +
      '</output></label><input type="range" min="0" max="8" step="1" id="condition-overlap" value="' + state.overlap +
      '"><div class="condition-observation">' + observation(m) + '</div>' +
      command('check-overlap', 'Проверить расположение') + status(message) +
      (right ? command('next', disjoint ? 'Записать правило' : 'Исследовать несовместность') : '');
  }
  function observation(m) {
    return deck(m.both, false) + counts(m) + '<p>Во всей колоде доля геометрии — 9/24. ' +
      'Среди карточек со звездой — <strong>' + m.both + '/8</strong>.</p>';
  }
  function frequencyText() {
    if (!state.draws) return 'Пока ни одной попытки.';
    return 'Вытягиваний: ' + state.draws + '. Со звездой: ' + state.stars + '. Из них с геометрией: ' + state.hits +
      '. ' + (state.stars ? 'Частота геометрии среди отмеченных: ' + state.hits + '/' + state.stars + '.' :
      'Отмеченные карточки пока не выпадали, вычислить частоту в этой группе ещё нельзя.');
  }
  function rule() {
    return '<h3 tabindex="-1">Запиши наблюдение в виде формулы</h3>' +
      '<p>Пусть A — «геометрия», B — «есть звезда». Запись P(A | B) читают «вероятность A при условии B». ' +
      'В знаменателе считаем только подходящие под условие исходы.</p>' +
      '<p class="condition-formula">P(A | B) = P(A ∩ B) / P(B), если P(B) &gt; 0.</p>' +
      '<p>В первой колоде P(A ∩ B) = 6/24 и P(B) = 8/24. Их отношение равно 6/8. ' +
      'При обратном условии «уже известно, что это геометрия» знаменатель другой: P(B | A) = 6/9.</p>' +
      '<p>События независимы, когда <strong>P(A ∩ B) = P(A) · P(B)</strong>. Если P(B) &gt; 0, это равносильно ' +
      'P(A | B) = P(A). При трёх геометрических карточках со звездой получаем 3/24 = (9/24) · (8/24).</p>' +
      '<p>Несовместность означает, что общих исходов нет. При положительных вероятностях обоих событий ' +
      'она исключает независимость. Если карточек со звездой вообще нет, условную вероятность при B вычислить нельзя.</p>' +
      '<details><summary>Сравнить вероятность с частотой</summary><p>Возьми найденную независимую колоду: ' +
      '3 карточки из 8 отмеченных — с геометрией. После каждого вытягивания верни карточку и снова перемешай колоду. ' +
      'Совпадёт ли частота в твоей серии с точной вероятностью 3/8?</p><div class="condition-controls">' +
      command('draw-one','Вытянуть одну') + command('draw-many','Вытянуть 24 раза') +
      command('draw-reset','Начать новую серию') +
      '</div><p id="condition-frequency" role="status">' + esc(frequencyText()) + '</p>' +
      '<p>В короткой серии отмеченных карточек может выпасть совсем мало. Каждая новая такая карточка ' +
      'заметно меняет долю. В длинной серии доля обычно ближе к 3/8, хотя на очередном шаге она может и отдалиться.</p></details>' +
      command('transfer','Решить новую задачу самостоятельно');
  }
  function relationOf(m) {
    return m.independent ? 'independent' : m.disjoint ? 'disjoint' : 'dependent';
  }
  function transferErrors() {
    const m = model(transfers[state.variant]);
    const problems = [];
    for (const [field, answer, label] of [['pA', state.base, 'P(A)'], ['givenB', state.given, 'P(A | B)']]) {
      const check = checkAnswer(answer, m, field);
      if (!check.ok) problems.push(label + ': ' + check.message);
    }
    if (state.relation !== relationOf(m)) {
      problems.push('Связь событий: посмотри, есть ли общие исходы. Затем сравни долю A среди B и во всей группе.');
    }
    return problems;
  }
  function transfer() {
    const t = transfers[state.variant];
    return '<h3 tabindex="-1">' + esc(t.title) + '</h3><p>' + esc(t.story) +
      '</p><p><strong>A</strong> — ' + esc(t.eventA) + '. <strong>B</strong> — ' + esc(t.eventB) + '.</p>' +
      '<form data-submit="check-transfer">' +
      field('base','Найди P(A) до получения дополнительной информации.',state.base) +
      field('given','Теперь известно, что событие B произошло. Найди P(A | B).',state.given) +
      '<label for="condition-relation">Как связаны события?</label><select id="condition-relation">' +
      '<option value="">Выбери утверждение</option>' + Object.entries(relations).map(([v,t]) =>
        '<option value="' + v + '"' + (v === state.relation ? ' selected' : '') + '>' + t + '</option>').join('') +
      '</select>' + command('check-transfer', 'Проверить три ответа', true) + '</form>' +
      status(state.feedback === 'missing' ? 'Заполни оба числа и выбери утверждение.' :
        state.feedback === 'wrong' ? transferErrors().join(' ') : '');
  }
  function result() {
    const t = transfers[state.variant], m = model(t);
    const relation = relationOf(m);
    return '<h3 tabindex="-1">' + esc(t.title) + ' · результат</h3>' +
      status(state.attempts === 1 ? 'Все три ответа верны с первой попытки в этом прохождении.' :
        'Все три ответа верны после исправления.') +
      '<p>До получения информации P(A) = ' + m.a + '/' + m.total + ' = ' + m.pA +
      '. При условии B остаётся ' + m.b + ' исходов, из них подходят под A и B вместе ' + m.both +
      '. Поэтому P(A | B) = ' + m.both + '/' + m.b + ' = ' + m.givenB + '. ' + relations[relation] + '.</p>' +
      '<p>Самостоятельные задачи: ' + Object.keys(state.history).length + ' из ' + transfers.length +
      '. С первой проверки при знакомстве с задачей: ' + Object.values(state.history).filter(x => x === 'first').length + '.</p>' +
      command('again', 'Решить следующий вариант') +
      '<p class="condition-links">Дальше по курсу: <a href="#lesson/114-10">совместное распределение</a> и ' +
      '<a href="#lesson/114-12">независимость случайных величин</a>. Попробуй другую модель — ' +
      '<a href="../../school/index.html#lesson/sec-conditional">дерево двух выборов</a>.</p>' +
      command('revisit','Вернуться к опыту с карточками');
  }
  const renderStage = {predict:prediction, condition:conditional, independent:experiment,
    disjoint:experiment, rule, transfer, result};
  function render(focus) {
    work.innerHTML = '<section class="condition-step" data-stage="' + state.stage + '">' +
      renderStage[state.stage]() + '</section><p class="condition-storage" role="status">' + esc(storageNotice) + '</p>';
    syncLessonCycleEntry();
    if (focus === 'heading') work.querySelector('h3').focus();
    else if (focus) work.querySelector(focus)?.focus();
  }
  function next(stage) {
    state.stage = stage;
    state.feedback = '';
    save();
    render('heading');
  }
  function syncLessonCycleEntry() {
    window.MathExamLessonCycleEntry?.mount(lab, 'prob', {
      visible: !lab.hidden && lab.open && state.stage !== 'transfer'
    });
  }
  function sync() {
    const show = eligible.includes(lesson.value);
    lab.hidden = !show;
    if (entry) entry.hidden = lesson.value !== lesson.options[0]?.value;
    syncLessonCycleEntry();
    if (show) {
      if (lab.open) render();
    }
  }
  lab.addEventListener('toggle', () => { if (lab.open && !lab.hidden) render(); });
  lesson.addEventListener('change', sync);
  window.addEventListener('hashchange', sync);
  work.addEventListener('input', e => {
    const input = e.target;
    if (input.id === 'condition-overlap') {
      state.overlap = Number(input.value);
      state.feedback = '';
      work.querySelector('#condition-x').value = state.overlap;
      work.querySelector('.condition-observation').innerHTML = observation(model(cards, state.overlap));
      work.querySelector('.condition-result').textContent = '';
      work.querySelector('[data-cmd=next]')?.remove();
    } else if (input.name === 'direction') {
      state.direction = input.value;
    } else {
      const id = input.id.replace('condition-', '');
      if (!['answer', 'base', 'given', 'relation'].includes(id)) return;
      state[id] = input.value;
    }
    state.feedback = '';
    const notice = work.querySelector('.condition-result');
    if (notice) notice.textContent = '';
    save();
  });
  work.addEventListener('submit', e => {
    e.preventDefault();
    switch (e.target.dataset.submit) {
      case 'predict':
        if (state.direction) { next('condition'); return; }
        state.feedback = 'missing';
        break;
      case 'answer':
        if (!state.filtered || state.feedback === 'right') return;
        state.feedback = !state.answer.trim() ? 'missing' :
          checkAnswer(state.answer, model(cards), 'givenB').ok ? 'right' : 'wrong';
        break;
      case 'check-transfer': {
        if (!state.base.trim() || !state.given.trim() || !state.relation) { state.feedback = 'missing'; break; }
        const t = transfers[state.variant];
        state.attempts = Math.min(10000, state.attempts + 1);
        if (!transferErrors().length) {
          if (!Object.hasOwn(state.history, t.id)) state.history[t.id] = state.attempts === 1 ? 'first' : 'corrected';
          next('result'); return;
        }
        state.feedback = 'wrong';
        break;
      }
      default: return;
    }
    save();
    render(state.stage === 'condition' ? (state.feedback === 'right' ? '[data-cmd=explore]' : '#condition-answer') :
      state.stage === 'transfer' ? '#condition-base' : '[name=direction]');
  });
  work.addEventListener('click', e => {
    const cmd = e.target.closest('button')?.dataset.cmd;
    if (cmd === 'filter') {
      state.filtered = !state.filtered;
      save(); render('[data-cmd=filter]');
    } else if (cmd === 'explore' && state.feedback === 'right') {
      state.overlap = cards.both;
      next('independent');
    } else if (cmd === 'check-overlap') {
      const m = model(cards,state.overlap);
      state.feedback = (state.stage === 'independent' ? m.independent : m.disjoint) ? 'right' : 'wrong';
      save(); render(state.feedback === 'right' ? '[data-cmd=next]' : '#condition-overlap');
    } else if (cmd === 'next' && state.feedback === 'right') {
      next(state.stage === 'independent' ? 'disjoint' : 'rule');
    } else if (cmd === 'draw-reset') {
      Object.assign(state,{draws:0, stars:0, hits:0});
      save();
      work.querySelector('#condition-frequency').textContent = frequencyText();
    } else if (cmd === 'draw-one' || cmd === 'draw-many') {
      const n = Math.min(cmd === 'draw-one' ? 1 : 24, 100000 - state.draws);
      for (let i = 0; i < n; i++) {
        const card = Math.floor(Math.random() * cards.total);
        // At independence the eight marked cards contain three geometry cards.
        if (card < cards.b) state.stars++;
        if (card < independentOverlap) state.hits++;
      }
      state.draws += n;
      save();
      work.querySelector('#condition-frequency').textContent = frequencyText();
    } else if (cmd === 'transfer' || cmd === 'again') {
      if (cmd === 'again') state.variant = (state.variant + 1) % transfers.length;
      Object.assign(state,{base:'', given:'', relation:'', attempts:0});
      next('transfer');
    } else if (cmd === 'revisit') {
      Object.assign(state,{direction:'', filtered:false, answer:'', overlap:cards.both, draws:0, stars:0, hits:0});
      next('predict');
    }
  });
  work.addEventListener('click', e => {
    if (e.target.closest('.condition-links a')) {
      lab.open = false;
      lesson.focus();
    }
  });
  if (eligible.includes(lesson.value) && new URLSearchParams(location.search).get('lab') === 'condition') lab.open = true;
  sync();
  if (window.top === window && /^https?:$/.test(location.protocol) && !['board','learning'].some(key => new URLSearchParams(location.search).get(key) === '1')) {
    const cycleScript = document.createElement('script');
    cycleScript.src = '../lesson-cycle/entry.js';
    cycleScript.onload = syncLessonCycleEntry;
    cycleScript.onerror = () => cycleScript.remove();
    document.head.append(cycleScript);
  }
})();

/* WORK-12: additional standalone probability practice, separate from board state. */
(function mountProbabilityBridges() {
  'use strict';
  if (typeof document === 'undefined' || typeof window === 'undefined' || window.top !== window) return;
  const anchor = document.getElementById('condition-entry');
  if (!anchor || document.getElementById('probability-bridges')) return;
  const section = document.createElement('section');
  section.id = 'probability-bridges';
  section.setAttribute('aria-label', 'Дополнительные практикумы по вероятности');
  section.innerHTML = '<h2>От случайного опыта к распределению и сумме</h2>' +
    '<p>Дополнительные занятия для самостоятельной работы. Они не меняют результаты основного курса и не синхронизируются с доской.</p>' +
    '<ol><li><a href="./discrete-lab.html">От исходов опыта к распределению</a> — перед пунктами 55 и 57 (7–9 классы).</li>' +
    '<li><a href="./sum-dependence-lab.html">Ожидание и дисперсия суммы: что меняет зависимость?</a> — после пункта 11 (10–11 классы).</li></ol>';
  anchor.insertAdjacentElement('afterend', section);
})();
