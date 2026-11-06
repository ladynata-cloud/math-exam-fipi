(function () {
  'use strict';
  const D = window.CollegeLogarithmsData, E = window.CollegeLogarithmsEngine, P = window.CollegeLogarithmsPlot;
  const Adapter = window.CollegeLogarithmsBoardAdapter;
  const $ = id => document.getElementById(id);
  if (!D || !E || !P || !Adapter) { $('condition').textContent = 'Не удалось загрузить курс. Обновите страницу.'; return; }
  const BOARD = !!window.CollegeLogarithmsBoardMode, STORE = 'mathExam.collegeLogarithms.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cleanDraft = value => String(value).replace(/[<>\u0000-\u001f\u007f]/g, '').slice(0, 160);
  const numHtml = n => { const text = E.formatNumber(n); if (!text.includes('/')) return esc(text); const parts = text.split('/'); return '<span class="fraction"><span class="top">' + esc(parts[0]) + '</span><span class="bottom">' + esc(parts[1]) + '</span></span>'; };
  let store = { version: 1, lastTask: 'meaning-01', attempts: {}, results: {} }, state, bridge, storageFailed = false;
  function load() {
    if (BOARD) return;
    try {
      const raw = window.localStorage.getItem(STORE);
      if (!raw || raw.length > 900000) return;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.attempts || !saved.results) return;
      if (D.getTask(saved.lastTask)) store.lastTask = saved.lastTask;
      D.tasks.forEach(t => {
        const a = saved.attempts[t.id], r = saved.results[t.id];
        if (a && a.taskId === t.id && Adapter.validateState(a)) store.attempts[t.id] = a;
        if (r && r.completed === true && typeof r.helpUsed === 'boolean' && typeof r.firstTry === 'boolean')
          store.results[t.id] = { completed: true, helpUsed: r.helpUsed, firstTry: r.firstTry };
      });
    } catch (_) { storageFailed = true; }
  }
  load();
  const params = new URLSearchParams(window.location.search);
  const requested = D.getTask(params.get('task'));
  const topic = D.getModule(params.get('topic'));
  const first = requested ? requested.id : topic ? D.tasks.find(t => t.moduleId === topic.id).id : BOARD ? 'meaning-01' : store.lastTask;
  state = store.attempts[first] ? clone(store.attempts[first]) : E.initialState(first);
  function task() { return D.getTask(state.taskId); }
  function module() { return D.getModule(task().moduleId); }
  function step() { return task().steps[state.stage] || null; }
  function done() { return state.stage === task().steps.length; }
  function baselineGraph() {
    const accepted = task().steps.slice(0, state.stage).findLast(s => s.kind === 'transform');
    return accepted ? { ...accepted.answer } : E.graphParams(task());
  }
  function sumErrors(s) { return Object.values(s.errors).reduce((a, b) => a + b, 0); }
  function persist() {
    if (BOARD) return;
    store.lastTask = state.taskId; store.attempts[state.taskId] = clone(state);
    try { window.localStorage.setItem(STORE, JSON.stringify(store)); }
    catch (_) { storageFailed = true; $('storage-note').hidden = false; }
  }
  function changed() { persist(); if (bridge) bridge.changed(); }
  function updateUrl() {
    const url = new URL(window.location.href); url.searchParams.delete('topic'); url.searchParams.set('task', state.taskId);
    try { window.history.replaceState(null, '', url.href); } catch (_) { /* A local file can still teach. */ }
    const src = '/trainers/college-logarithms/index.html?task=' + encodeURIComponent(state.taskId);
    $('open-board').href = '../trainer-board.html?trainer=' + encodeURIComponent(src);
  }
  function openTask(id) {
    if (!D.getTask(id)) return;
    persist();
    state = !BOARD && store.attempts[id] ? clone(store.attempts[id]) : E.initialState(id);
    state.panels.route = false;
    render(); changed();
  }
  function renderRoute() {
    $('route-toggle').setAttribute('aria-expanded', String(state.panels.route)); $('route').hidden = !state.panels.route;
    $('route').innerHTML = D.modules.map((m, i) => {
      const tasks = D.tasks.filter(t => t.moduleId === m.id), solved = tasks.filter(t => store.results[t.id]).length;
      const label = m.kind === 'diagnostic' ? '?' : m.kind === 'base' ? 'Б' : m.kind === 'profile' ? 'П' : String(i);
      return '<button type="button" data-module="' + esc(m.id) + '" aria-current="' + (module().id === m.id) + '"><span class="route-number">' + label + '</span><span><span class="route-title">' + esc(m.title) + '</span><span class="route-sub">' + tasks.length + ' заданий' + (!BOARD && solved ? ' · ' + solved + ' пройдено' : '') + '</span></span></button>';
    }).join('');
  }
  function renderChoices(s) {
    return '<div class="choices" role="radiogroup" aria-label="Выберите ответ">' + s.options.map(o => '<button type="button" class="choice" role="radio" aria-checked="' + (state.drafts[s.id] === o.value) + '" data-choice="' + esc(o.value) + '"><span class="choice-dot" aria-hidden="true"></span><span>' + o.labelHtml + '</span></button>').join('') + '</div>';
  }
  function intervalFields(raw) {
    const m = /^([[(])(.*);(.*)([)\]])$/.exec(raw), left = m ? m[1] : '(', right = m ? m[4] : ')';
    return '<div class="interval-fields"><label>Скобка<select id="interval-left" aria-label="Левая скобка"><option value="("' + (left === '(' ? ' selected' : '') + '>(</option><option value="["' + (left === '[' ? ' selected' : '') + '>[</option></select></label><label>Левая граница<input class="answer-input" id="interval-lo" value="' + esc(m ? m[2] : '') + '" aria-label="Левая граница промежутка" autocomplete="off"></label><label>Правая граница<input class="answer-input" id="interval-hi" value="' + esc(m ? m[3] : '') + '" aria-label="Правая граница промежутка" autocomplete="off"></label><label>Скобка<select id="interval-right" aria-label="Правая скобка"><option value=")"' + (right === ')' ? ' selected' : '') + '>)</option><option value="]"' + (right === ']' ? ' selected' : '') + '>]</option></select></label></div><div class="interval-shortcuts"><button type="button" class="quiet" data-infinity="lo">Слева −∞</button><button type="button" class="quiet" data-infinity="hi">Справа +∞</button></div><p class="input-help">Квадратная скобка включает границу. Круглая — исключает.</p>';
  }
  function renderStep() {
    const s = step();
    $('answer-form').hidden = !s; $('completion').hidden = !!s;
    $('step-counter').textContent = s ? 'Шаг ' + (state.stage + 1) + ' из ' + task().steps.length : 'Задание выполнено';
    $('step-progress').style.width = (state.stage / task().steps.length * 100) + '%';
    $('assistance').textContent = BOARD ? 'Совместная работа' : state.helpUsed ? 'С помощью' : E.isAssessment(task()) ? 'Без подсказок' : '';
    $('hint-toggle').hidden = E.isAssessment(task());
    $('hint-toggle').textContent = s && state.errors[s.id] >= 2 && !state.hintOpen ? 'Хочешь подсказку?' : state.hintOpen ? 'Скрыть подсказку' : 'Подсказка';
    $('hint-toggle').setAttribute('aria-expanded', String(state.hintOpen));
    $('check').disabled = !!s && state.panels.lab && s.kind !== 'transform';
    $('hint').hidden = !s || !state.hintOpen || E.isAssessment(task());
    $('hint').innerHTML = s && state.hintOpen ? '<span class="hint-label">Один шаг дальше</span>' + s.hint : '';
    if (!s) {
      $('current-step').innerHTML = '';
      $('completion').innerHTML = '<h3>Получилось!</h3><p>' + (BOARD ? 'Решение осталось на доске. Можно перейти к следующему примеру.' : state.helpUsed ? 'Вы разобрали задание с помощью. Попробуйте следующий пример самостоятельно.' : sumErrors(state) ? 'Вы нашли решение самостоятельно и исправили ошибки.' : 'Все шаги верны с первого раза.') + '</p>';
    } else {
      let body = '';
      if (s.kind === 'choice') body = renderChoices(s);
      if (s.kind === 'number') body = '<label class="input-label" for="answer">Число в ответе</label><input class="answer-input" id="answer" value="' + esc(state.drafts[s.id]) + '" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text"><p class="input-help">Дробь можно ввести как 1/2, десятичное число — как 0,5.</p>';
      if (s.kind === 'point') {
        const pair = state.drafts[s.id].split(';');
        body = '<div class="point-fields"><label><span class="input-label">Координата x</span><input class="answer-input" id="point-x" value="' + esc(pair[0] || '') + '" autocomplete="off"></label><label><span class="input-label">Координата y</span><input class="answer-input" id="point-y" value="' + esc(pair[1] || '') + '" autocomplete="off"></label></div><p class="input-help">Можно нажать на координатную плоскость или ввести обе координаты. Затем нажмите «Проверить».</p>';
      }
      if (s.kind === 'interval') body = intervalFields(state.drafts[s.id]);
      if (s.kind === 'transform') body = '<p class="input-help">Используйте настройки под графиком. Ползунки можно двигать клавишами ← →.</p>';
      $('current-step').innerHTML = '<p class="step-prompt">' + (s.promptHtml || esc(s.prompt)) + '</p>' + body;
    }
    renderFeedback();
    $('next-task').classList.toggle('ready', done());
    const peers = D.tasks.filter(t => t.moduleId === module().id), last = peers.at(-1).id === state.taskId;
    $('next-task').textContent = last ? 'Итог темы →' : 'Следующее задание →';
    $('restart').hidden = E.isAssessment(task()) && !done();
    renderHistory();
  }
  function renderFeedback() {
    const s = step(); let message = '';
    if (state.feedback === 'invalid' && s) message = s.kind === 'interval' ? 'Заполните обе границы и проверьте скобки. У бесконечности скобка круглая.' : s.kind === 'point' ? 'Введите обе координаты. Подойдут целые числа, дроби или десятичные числа.' : s.kind === 'choice' ? 'Сначала выберите один ответ.' : 'Введите число целиком. Подойдут 3, −2, 0,5 или 1/2.';
    if (state.feedback === 'wrong' && s) message = E.isAssessment(task()) ? 'Пока не совпало. Проверьте вычисление; можно перейти дальше и вернуться к этому заданию.' : s.kind === 'interval' ? 'Проверьте ОДЗ, направление неравенства и включение границ.' : s.kind === 'point' ? 'Эта точка пока не подходит. Сопоставьте x, степень основания и y.' : s.kind === 'transform' ? 'Сравните основание, направление и оба сдвига с условием.' : 'Пока не совпало. Проверьте выбранное свойство и вычисление.';
    if (state.feedback === 'correct' && s) message = 'Верно. Продолжим следующим шагом.';
    $('feedback').textContent = message; $('feedback').dataset.kind = state.feedback;
  }
  function answerHtml(s) {
    if (s.kind === 'choice') return s.options.find(o => o.value === s.answer).labelHtml;
    if (s.kind === 'number') return numHtml(s.answer);
    if (s.kind === 'point') return '(' + numHtml(s.answer.x) + '; ' + numHtml(s.answer.y) + ')';
    if (s.kind === 'interval') return esc(E.intervalText(s.answer));
    return 'Основание ' + numHtml(s.answer.base) + ', h = ' + numHtml(s.answer.h) + ', k = ' + numHtml(s.answer.k) + ', ' + (s.answer.sign === -1 ? 'минус' : 'плюс') + ' перед логарифмом';
  }
  function renderHistory() {
    const completed = task().steps.slice(0, state.stage);
    $('history').innerHTML = completed.length ? '<h3>Ваши шаги сохранены</h3>' + completed.map((s, i) => '<div class="history-item"><span class="history-check" aria-hidden="true">✓</span><div><p class="accepted">' + (i + 1) + '. ' + answerHtml(s) + '</p><p>' + s.explanation + '</p></div></div>').join('') : '';
  }
  function activeGraph() {
    const t = task(), g = t.graph;
    if (!g) return null;
    return { ...g, ...state.graph, showCurve: !!g.showCurve || done() || state.panels.lab || (step() && step().kind === 'transform') || (t.steps.some(s => s.kind === 'point') && E.getMarks(t, state).length === t.steps.filter(s => s.kind === 'point').length) };
  }
  function renderVisual() {
    const t = task(), s = step(), graph = activeGraph(), assessment = E.isAssessment(t);
    const intervalStep = s && s.kind === 'interval' ? s : t.steps.slice(0, state.stage).findLast(x => x.kind === 'interval');
    const interval = intervalStep ? E.parseInterval(state.drafts[intervalStep.id]) : null;
    const pendingInterval = !!s && s.kind === 'interval';
    const intervalDiagram = interval ? P.renderInterval(pendingInterval ? null : interval, pendingInterval ? { candidate: interval } : {}) : '';
    $('visual').hidden = !graph && !interval;
    if (graph) {
      const candidate = s && s.kind === 'point' ? E.parsePoint(state.drafts[s.id]) : null;
      $('visual').innerHTML = P.renderGraph(graph, { markedPoints: state.panels.lab ? [] : E.getMarks(t, state), candidate: state.panels.lab ? null : candidate, showCurve: graph.showCurve, revealPoints: assessment && !!t.graph.revealPoints, referenceModel: !assessment && t.targetGraph ? t.graph : undefined });
      if (interval) $('visual').insertAdjacentHTML('beforeend', '<p class="graph-caption">' + (pendingInterval ? 'Ваш вариант промежутка' : done() ? 'Решение на числовой прямой' : 'Принятый промежуток') + '</p>' + intervalDiagram);
    } else $('visual').innerHTML = interval ? '<p class="graph-caption">' + (pendingInterval ? 'Ваш вариант промежутка' : done() ? 'Решение на числовой прямой' : 'Принятый промежуток') + '</p>' + intervalDiagram : '';
    $('graph-caption').hidden = !graph;
    $('graph-caption').textContent = graph ? (s && s.kind === 'point' ? 'Точки появляются по мере построения. Пунктир — граница области определения.' : t.targetGraph ? 'Сравните исходный и изменённый графики. Пунктирная вертикаль — асимптота.' : 'Аргумент логарифма положителен. Пунктирная вертикаль не входит в график.') : '';
    const transform = !!s && s.kind === 'transform';
    $('lab').hidden = !graph || assessment || (!state.panels.lab && !transform);
    $('lab-toggle').hidden = !graph || assessment || transform;
    $('lab-toggle').textContent = state.panels.lab ? 'Вернуться к задаче' : 'Исследовать график';
    $('lab-label').textContent = state.panels.lab && !transform ? 'Исследуйте модель, затем нажмите «Вернуться к задаче».' : 'Измени график по условию';
    $('lab-toggle').setAttribute('aria-expanded', String(state.panels.lab));
    ['base', 'h', 'k', 'sign'].forEach(key => { $('graph-' + key).value = String(state.graph[key]); });
    $('graph-h-value').textContent = E.formatNumber(state.graph.h); $('graph-k-value').textContent = E.formatNumber(state.graph.k);
    const g = state.graph, arg = g.h === 0 ? 'x' : 'x ' + (g.h > 0 ? '− ' : '+ ') + numHtml(Math.abs(g.h));
    $('graph-formula').innerHTML = assessment ? '' : 'y = ' + (g.sign < 0 ? '−' : '') + 'log<sub>' + numHtml(g.base) + '</sub>(' + arg + ')' + (g.k === 0 ? '' : ' ' + (g.k > 0 ? '+ ' : '− ') + numHtml(Math.abs(g.k)));
  }
  function renderProgress() {
    $('personal-progress').hidden = BOARD;
    const results = Object.values(store.results), independent = results.filter(r => !r.helpUsed).length;
    $('progress-summary').textContent = results.length + ' из 102 выполнено · ' + independent + ' самостоятельно · ' + (results.length - independent) + ' с помощью';
  }
  function render() {
    const t = task(), m = module(), peers = D.tasks.filter(x => x.moduleId === m.id);
    updateUrl(); renderRoute();
    $('module-name').textContent = m.title;
    $('task-select').innerHTML = peers.map((p, i) => '<option value="' + esc(p.id) + '"' + (p.id === t.id ? ' selected' : '') + '>Задание ' + (i + 1) + ' из ' + peers.length + '</option>').join('');
    $('task-label').textContent = m.kind === 'learn' ? 'Учимся' : m.kind === 'diagnostic' ? 'Проверим основу' : m.kind === 'base' ? 'ЕГЭ · база' : 'ЕГЭ · профиль: краткий ответ';
    $('task-position').textContent = (peers.findIndex(x => x.id === t.id) + 1) + ' / ' + peers.length;
    $('task-title').textContent = t.title || m.title; $('condition').innerHTML = t.promptHtml;
    $('mode-note').textContent = BOARD ? 'Общая доска · выбранное задание и шаги видны участникам.' : E.isAssessment(t) ? 'Самостоятельная проверка без подсказок. Все темы доступны через меню.' : 'Один небольшой шаг за раз. Готовые шаги остаются на экране.';
    $('theory-toggle').hidden = E.isAssessment(t); $('theory-toggle').setAttribute('aria-expanded', String(state.panels.theory));
    $('theory-toggle').textContent = state.panels.theory ? 'Закрыть памятку' : 'Короткая памятка';
    $('theory').hidden = !state.panels.theory || E.isAssessment(t); $('theory').innerHTML = m.lessonHtml || '';
    $('module-result').hidden = true; $('storage-note').hidden = !storageFailed;
    renderStep(); renderVisual(); renderProgress();
  }
  function submit() {
    const s = step(); if (!s) return;
    if (state.panels.lab && s.kind !== 'transform') return;
    const result = E.checkStep(s, state.drafts[s.id]);
    if (!result.correct) {
      if (result.valid) state.errors[s.id] = Math.min(100000, state.errors[s.id] + 1);
      state.feedback = result.valid ? 'wrong' : 'invalid'; renderStep(); changed(); return;
    }
    state.stage++; state.hintOpen = false; state.feedback = done() ? 'complete' : 'correct';
    if (step() && step().kind === 'transform') state.drafts[step().id] = E.graphDraft(state.graph);
    if (done() && !BOARD) {
      const prior = store.results[state.taskId];
      if (!prior) store.results[state.taskId] = { completed: true, helpUsed: state.helpUsed, firstTry: sumErrors(state) === 0 };
    }
    renderStep(); renderVisual(); renderProgress(); changed();
  }
  function next() {
    const peers = D.tasks.filter(t => t.moduleId === module().id), index = peers.findIndex(t => t.id === state.taskId);
    if (index + 1 < peers.length) { openTask(peers[index + 1].id); return; }
    const m = module(), nextModule = D.modules[D.modules.indexOf(m) + 1];
    if (BOARD) { openTask(D.tasks.find(t => t.moduleId === (nextModule ? nextModule.id : 'meaning')).id); return; }
    const finished = peers.filter(t => store.results[t.id]).length;
    const firstTry = peers.filter(t => store.results[t.id] && store.results[t.id].firstTry).length;
    $('module-result').hidden = false;
    $('module-result').innerHTML = '<h2>' + esc(m.title) + ': итог</h2><p>' + (BOARD ? 'Можно повторить пример или выбрать следующую тему.' : 'Выполнено ' + finished + ' из ' + peers.length + '; с первого раза — ' + firstTry + '.') + '</p>' + (m.kind === 'diagnostic' ? '<p>' + (firstTry >= 5 ? 'Основа уверенная. Начните со смысла логарифма и переходите дальше в удобном темпе.' : 'Начните с темы «Смысл логарифма». Если трудно со степенями, откройте короткую памятку и проговорите, что означает показатель.') + '</p>' : '') + (nextModule ? '<button class="primary" data-module="' + esc(nextModule.id) + '">Перейти: ' + esc(nextModule.title) + ' →</button>' : '<button class="primary" data-module="meaning">Вернуться к учебным темам</button>');
    $('module-result').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function readDraft() {
    const s = step(); if (!s) return;
    if (s.kind === 'number') { $('answer').value = cleanDraft($('answer').value); state.drafts[s.id] = $('answer').value; }
    if (s.kind === 'point') { ['point-x', 'point-y'].forEach(id => { $(id).value = cleanDraft($(id).value).slice(0, 65); }); state.drafts[s.id] = $('point-x').value + ';' + $('point-y').value; }
    if (s.kind === 'interval') { ['interval-lo', 'interval-hi'].forEach(id => { $(id).value = cleanDraft($(id).value).slice(0, 65); }); state.drafts[s.id] = $('interval-left').value + $('interval-lo').value + ';' + $('interval-hi').value + $('interval-right').value; }
    state.feedback = 'none'; renderFeedback(); renderVisual(); changed();
  }
  $('answer-form').addEventListener('submit', e => { e.preventDefault(); submit(); });
  $('current-step').addEventListener('input', readDraft);
  $('current-step').addEventListener('change', readDraft);
  document.addEventListener('click', e => {
    const target = e.target.closest('button'); if (!target) return;
    if (target.dataset.module) { const t = D.tasks.find(t => t.moduleId === target.dataset.module); if (t) openTask(t.id); return; }
    if (target.dataset.choice && step()) {
      state.drafts[step().id] = target.dataset.choice; state.feedback = 'none';
      document.querySelectorAll('[data-choice]').forEach(b => b.setAttribute('aria-checked', String(b === target)));
      renderFeedback(); changed(); return;
    }
    if (target.dataset.infinity) {
      $('interval-' + target.dataset.infinity).value = target.dataset.infinity === 'lo' ? '−∞' : '+∞';
      $(target.dataset.infinity === 'lo' ? 'interval-left' : 'interval-right').value = target.dataset.infinity === 'lo' ? '(' : ')'; readDraft();
    }
  });
  $('task-select').addEventListener('change', () => openTask($('task-select').value));
  $('route-toggle').addEventListener('click', () => { state.panels.route = !state.panels.route; renderRoute(); changed(); });
  $('diagnose').addEventListener('click', () => openTask('diagnostic-01'));
  $('next-task').addEventListener('click', next);
  $('restart').addEventListener('click', () => { const used = state.helpUsed, errors = { ...state.errors }; state = E.initialState(state.taskId); state.helpUsed = used; state.errors = errors; render(); changed(); });
  $('hint-toggle').addEventListener('click', () => { if (!step() || E.isAssessment(task())) return; state.hintOpen = !state.hintOpen; if (state.hintOpen) state.helpUsed = true; renderStep(); changed(); });
  $('theory-toggle').addEventListener('click', () => { if (E.isAssessment(task())) return; state.panels.theory = !state.panels.theory; if (state.panels.theory) state.helpUsed = true; render(); changed(); });
  $('lab-toggle').addEventListener('click', () => { if (E.isAssessment(task())) return; state.panels.lab = !state.panels.lab; if (state.panels.lab) state.helpUsed = true; if (!state.panels.lab) state.graph = baselineGraph(); renderStep(); renderVisual(); changed(); });
  function graphChanged() {
    if (!task().graph || E.isAssessment(task())) return;
    ['base', 'h', 'k', 'sign'].forEach(key => { state.graph[key] = Number($('graph-' + key).value); });
    if (step() && step().kind === 'transform') state.drafts[step().id] = E.graphDraft(state.graph);
    state.feedback = 'none'; renderFeedback(); renderVisual(); changed();
  }
  ['graph-base', 'graph-h', 'graph-k', 'graph-sign'].forEach(id => $(id).addEventListener(id === 'graph-h' || id === 'graph-k' ? 'input' : 'change', graphChanged));
  $('visual').addEventListener('click', e => {
    if (!step() || step().kind !== 'point' || state.panels.lab) return;
    const svg = e.target.closest('svg[data-log-graph]'); if (!svg) return;
    let px, py;
    if (svg.createSVGPoint && svg.getScreenCTM()) { const point = svg.createSVGPoint(); point.x = e.clientX; point.y = e.clientY; const q = point.matrixTransform(svg.getScreenCTM().inverse()); px = q.x; py = q.y; }
    else { const r = svg.getBoundingClientRect(); px = (e.clientX - r.left) * 640 / r.width; py = (e.clientY - r.top) * 400 / r.height; }
    const p = P.toData(px, py, activeGraph());
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const snap = n => { const half = Math.round(n * 2) / 2; return Math.abs(half - n) < .18 ? half : Number(n.toFixed(2)); };
    // The x coordinate is given in the question, including exact thirds.
    // Snap only that known coordinate; the learner still chooses y.
    const givenX = step().answer.x, x = Math.abs(p.x - givenX) < .2 ? givenX : snap(p.x);
    $('point-x').value = String(x); $('point-y').value = String(snap(p.y)); readDraft();
  });
  render();
  bridge = Adapter.create({ read: () => state, write: value => { state = value; render(); } });
  window.CollegeLogarithmsApp = Object.freeze({ snapshot: () => clone(state), openTask, storageKey: STORE });
})();
