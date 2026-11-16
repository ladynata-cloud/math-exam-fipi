(function () {
  'use strict';
  const host = document.getElementById('formula-alphabet');
  if (!host) return;
  const params = new URLSearchParams(location.search);
  if (params.get('legacy') === '1') {
    // The retained derivations are in-course help even when opened by URL.
    try {
      const F = window.MathExamFormulaState, D = window.MathExamFormulaData;
      const saved = JSON.parse(localStorage.getItem(F.KEY) || 'null');
      if (saved?.alphabet?.version === 1) {
        const previous = F.createStore(localStorage, D);
        for (const id of Object.keys(previous.state.activeByTask)) {
          if (!previous.current(id)?.closed) previous.help(id);
        }
        if (!previous.ensureCurrent()) {
          host.innerHTML = '<h1>Курс открыт ещё в одной вкладке</h1><p>Обнови страницу, чтобы сохранить отметку о помощи перед просмотром выводов.</p><button type="button" id="fa-reload">Обновить страницу</button>';
          host.querySelector('#fa-reload').addEventListener('click', () => location.reload());
          return;
        }
      }
    } catch (_) { /* The legacy view still works when storage is unavailable. */ }
    document.body.classList.add('formula-legacy-mode'); host.hidden = true;
    const legacy = document.getElementById('app'); if (legacy) legacy.hidden = false;
    const source = document.getElementById('formula-legacy-source');
    if (source) { const script = document.createElement('script'); script.textContent = source.textContent; document.body.appendChild(script); }
    return;
  }
  document.body.classList.add('formula-alphabet-mode');
  const D = window.MathExamFormulaData, F = window.MathExamFormulaState;
  if (!D || !F) { host.innerHTML = '<p>Не удалось загрузить курс. Обнови страницу или открой скачанную автономную версию.</p>'; return; }
  const mods = new Map(D.modules.map(m => [m.id, m])), skills = new Map(), tasks = new Map();
  D.modules.forEach(m => m.skills.forEach(s => { skills.set(s.id, { ...s, moduleId: m.id }); s.tasks.forEach(t => tasks.set(t.id, { ...t, skillId: s.id, moduleId: m.id })); }));
  let storage; try { storage = localStorage; } catch (_) { storage = null; }
  const store = F.createStore(storage, D);
  const route = { basics: { title: 'Начинаю с основ', start: 1, end: 18 }, formulas: { title: 'Путаю формулы', start: 7, end: 14 }, equations: { title: 'Готовлюсь к уравнениям', start: 9, end: 16 } };
  const diagnostic = ['m01-s1', 'm03-s1', 'm04-s3', 'm06-s2', 'm07-s1', 'm10-s2'].map(id => skills.get(id)?.tasks[4]?.id).filter(Boolean);
  let ui = { answer: '', blocks: [], feedback: '', feedbackType: '', hint: false, solution: false, demo: 0, playing: false };
  let demoTimer = null;
  let labState = { a: 30, b: 30, prediction: null, observed: false, feedback: '' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function mathText(s) {
    return esc(s).replace(/\bpi\b/g, 'π').replace(/\bsqrt\(/g, '√(').replace(/\*/g, ' · ').replace(/\^([234])(?!\d)/g, '<sup>$1</sup>').replace(/!=/g, ' ≠ ').replace(/>=/g, ' ≥ ').replace(/<=/g, ' ≤ ');
  }
  // Presentation only: a bounded parser preserves grouping and operator order.
  // It never evaluates, simplifies, or treats a numerical match as a proof.
  // Unsupported/ambiguous text falls back intact instead of guessing its meaning.
  function fractionMarkup(source) {
    if (!source.includes('/') || source.length > 1000 || /\d,\d/.test(source)) return null;
    const text = source.replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4');
    const tokens = [], functions = new Set(['sin','cos','tan','cot','tg','ctg','arcsin','arccos','arctan','sqrt','abs']);
    let pos = 0, cursor = 0, depth = 0;
    const node = (tag, content, attrs = '') => '<' + tag + attrs + '>' + content + '</' + tag + '>';
    const row = content => node('mrow', content);
    const op = value => node('mo', esc(({ '*':'·', '!=':'≠', '<=':'≤', '>=':'≥', '-':'−' })[value] || value));
    function push(value, type) { tokens.push({ value, type }); if (tokens.length > 220) throw new Error('long'); }
    try {
      while (pos < text.length) {
        const rest = text.slice(pos), space = /^\s+/.exec(rest);
        if (space) { pos += space[0].length; continue; }
        const number = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(rest);
        if (number) { push(number[0], 'number'); pos += number[0].length; continue; }
        const word = /^[A-Za-z]+/.exec(rest);
        if (word) {
          const value = word[0]; pos += value.length;
          if (functions.has(value)) push(value, 'function');
          else if (value === 'pi') push('π', 'variable');
          else if (value.length === 1) push(value, 'variable');
          else {
            const compact = /^(sin|cos|tan|cot|tg|ctg)([abxyutpq])$/.exec(value);
            if (!compact) throw new Error('word');
            push(compact[1], 'function'); push(compact[2], 'variable');
          }
          continue;
        }
        if (/^[α-ωΑ-Ωℤ∞]/u.test(rest)) { push(rest[0], 'variable'); pos++; continue; }
        if (rest[0] === '√') { push('sqrt', 'function'); pos++; continue; }
        const operator = /^(?:!=|<=|>=|[+\-*/·×=<>≠≤≥±∓^()[\]{},;°∈])/.exec(rest);
        if (!operator) throw new Error('symbol');
        push(operator[0], 'operator'); pos += operator[0].length;
      }
      const peek = () => tokens[cursor];
      const is = value => peek()?.value === value;
      const begins = token => token && (token.type !== 'operator' || ['(','[','{'].includes(token.value));
      function exponent() {
        let sign = '';
        if (is('+') || is('-')) sign = op(tokens[cursor++].value);
        return row(sign + primary());
      }
      function group() {
        const open = tokens[cursor++].value, close = { '(':')', '[':']', '{':'}' }[open];
        const inside = relation();
        if (!is(close)) throw new Error('bracket');
        cursor++;
        return { content: inside, markup: row(op(open) + inside + op(close)) };
      }
      function primary() {
        if (++depth > 18) throw new Error('depth');
        const token = tokens[cursor++]; if (!token) throw new Error('empty');
        let markup;
        if (['(','[','{'].includes(token.value)) { cursor--; markup = group().markup; }
        else if (token.type === 'number') markup = node('mn', esc(token.value));
        else if (token.type === 'variable') markup = node('mi', esc(token.value));
        else if (token.type === 'function') {
          let power = null;
          if (is('^')) { cursor++; power = exponent(); }
          let argument, argumentContent;
          if (is('(')) { const g = group(); argument = g.markup; argumentContent = g.content; }
          else {
            const first = peek();
            argument = unary();
            // Bare sin 2x means sin(2x); stop before the next function.
            if (first?.type === 'number' && peek()?.type === 'variable') argument = row(argument + primary());
            // A bare sin π/6 or sin 2x/3 is ambiguous in linear text. Keep it
            // linear; authored sin(π/6) has explicit grouping and is rendered.
            if (token.value !== 'sqrt' && token.value !== 'abs' && is('/') && tokens[cursor + 1]?.type === 'number') throw new Error('bare-fraction');
            argumentContent = argument;
          }
          if (token.value === 'sqrt') markup = node('msqrt', argumentContent);
          else if (token.value === 'abs') markup = row(op('|') + argumentContent + op('|'));
          else {
            const name = node('mi', esc(token.value), ' mathvariant="normal"');
            markup = row((power ? node('msup', name + power) : name) + op('\u2061') + argument);
          }
          if (power && (token.value === 'sqrt' || token.value === 'abs')) markup = node('msup', markup + power);
        } else throw new Error('primary');
        if (is('^')) { cursor++; markup = node('msup', markup + exponent()); }
        if (is('°')) { cursor++; markup = row(markup + op('°')); }
        depth--;
        return markup;
      }
      function unary() {
        if (is('+') || is('-') || is('±') || is('∓')) return row(op(tokens[cursor++].value) + unary());
        return primary();
      }
      function product() {
        let left = unary();
        while (peek()) {
          if (is('/')) { cursor++; left = node('mfrac', row(left) + row(unary())); }
          else if (is('*') || is('·') || is('×')) left = row(left + op(tokens[cursor++].value) + unary());
          else if (begins(peek())) left = row(left + op('\u2062') + unary());
          else break;
        }
        return left;
      }
      function sum() {
        let result = product();
        while (is('+') || is('-') || is('±') || is('∓')) result = row(result + op(tokens[cursor++].value) + product());
        return result;
      }
      function relation() {
        let result = sum();
        while (peek() && ['=','!=','<','>','<=','>=','≠','≤','≥','∈',',',';'].includes(peek().value)) result = row(result + op(tokens[cursor++].value) + sum());
        return result;
      }
      const markup = relation();
      if (cursor !== tokens.length || !markup.includes('<mfrac>')) return null;
      return '<span class="fa-math-wrap"><math xmlns="http://www.w3.org/1998/Math/MathML" display="inline" displaystyle="true" aria-label="' + esc(source) + '">' + markup + '</math></span>';
    } catch (_) { return null; }
  }
  function math(s) {
    // Russian prose is never parsed as algebra. Only complete mathematical
    // fragments between words are eligible; punctuation and wording stay put.
    return String(s == null ? '' : s).split(/([\u0400-\u04ff]+)/u).map(part => {
      if (/[\u0400-\u04ff]/u.test(part)) return esc(part);
      const pieces = /^((?:\s|[:;!?]|[.,](?!\d))*)([\s\S]*?)([\s:;,.!?]*)$/.exec(part);
      if (!pieces || !pieces[2]) return mathText(part);
      const rendered = fractionMarkup(pieces[2]);
      return rendered ? esc(pieces[1]) + rendered + esc(pieces[3]) : mathText(part);
    }).join('');
  }
  const button = (label, action, extra = '', cls = '') => `<button type="button" class="fa-button ${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const badge = (label, cls = '') => `<span class="fa-badge ${cls}">${esc(label)}</span>`;
  const pad = n => String(n).padStart(2, '0');
  const formatDate = n => new Date(n).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  function shuffle(list) { const out = list.slice(); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
  function completed(skillId) { const r = store.state.skills[skillId]; return r.independent.length >= 2 && r.kinds.length >= 2; }
  function skillLabel(id) {
    const r = store.state.skills[id];
    if (r.recalled.length) return 'Вспомнил после перерыва';
    if (completed(id)) return 'Два разных задания самостоятельно';
    if (r.independent.length) return 'Есть самостоятельный ответ';
    if (r.corrected.length) return 'После исправления';
    if (r.assisted.length) return 'С подсказкой';
    if (r.studied) return 'Разобрал с объяснением';
    return 'Ещё не начинали';
  }
  function activeHelp(skillId) {
    const selectedSkill = typeof skillId === 'string' ? skillId : null;
    for (const taskId of Object.keys(store.state.activeByTask)) {
      const a = store.current(taskId);
      if (a && !a.closed && (!selectedSkill || a.skillId === selectedSkill)) store.help(taskId);
    }
  }
  function go(screen, values = {}) {
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
    if ((screen === 'module' || screen === 'home') && !Object.prototype.hasOwnProperty.call(values, 'route')) values = { ...values, route:'' };
    if (screen === 'study') activeHelp(values.skillId || store.state.view.skillId);
    if (screen === 'reference' || screen === 'guide') activeHelp();
    if (screen === 'lab') {
      const lab = D.investigations.find(item => item.id === values.investigationId);
      for (const moduleId of lab?.modules || []) for (const skill of mods.get(moduleId)?.skills || []) activeHelp(skill.id);
    }
    store.state.view = { ...store.state.view, ...values, screen };
    ui = { answer: '', blocks: [], feedback: '', feedbackType: '', hint: false, solution: false, demo: 0, playing: false };
    if (screen === 'task') {
      const task = tasks.get(values.taskId || store.state.view.taskId);
      if (!task) { store.state.view.screen = 'home'; }
      else { const a = store.begin(task.id, task.skillId, store.state.view.route === 'review' ? 'review' : 'learn'); ui.answer = a.draft || ''; store.state.view.skillId = task.skillId; store.state.view.moduleId = task.moduleId; }
    }
    store.persist(); render(true);
  }
  function chooseTask(skillId, exclude) {
    const s = skills.get(skillId);
    if (!s) return null;
    const next = s.tasks.find(t => t.id !== exclude && !store.current(t.id)) || s.tasks.find(t => t.id !== exclude && !store.current(t.id)?.closed) || s.tasks.find(t => t.id !== exclude) || s.tasks[0];
    return next ? tasks.get(next.id) : null;
  }
  function startTask(skillId, taskId, mode = 'learn') {
    const task = taskId ? tasks.get(taskId) : chooseTask(skillId);
    if (!task) return;
    if (mode === 'review' || store.current(task.id)?.closed) store.repeat(task.id, task.skillId, mode);
    go('task', { taskId: task.id, route: mode === 'review' ? 'review' : route[store.state.view.route] ? store.state.view.route : '' });
  }

  function shell(content) {
    const s = store.summary();
    return `<header class="fa-top"><a class="fa-brand" href="/">m<span>MathExam</span></a><nav aria-label="Возврат"><a href="../index.html">Курс профиля</a><a href="../teacher.html">В кабинет</a><a href="/">На главную</a></nav></header>
      <div class="fa-toolbar" aria-label="Разделы азбуки">${button('Азбука формул', 'home', '', 'fa-text')}${button('Карта тем', 'map', '', 'fa-text')}${button('Повторить сегодня' + (s.due ? ' · ' + s.due : ''), 'review', '', 'fa-text')}${button('Справочник', 'reference', '', 'fa-text')}${button('Учителю', 'teacher', '', 'fa-text')}</div>
      ${store.warning ? `<p class="fa-notice" role="status">${esc(store.warning)}</p>` : ''}
      <div id="fa-content" tabindex="-1">${content}</div>
      <footer class="fa-footer"><span>Результаты сохраняются в этом браузере.</span><span>Пример с подсказкой остаётся примером с помощью.</span><a href="?legacy=1">Пошаговый вывод четырёх формул</a>${window.MathExamTrainerOffline ? '' : '<a href="#download">Скачать курс и материалы</a>'}</footer>`;
  }
  function home() {
    const s = store.summary();
    const legacy = store.state.legacy;
    const prior = Object.keys(legacy.profile || {}).length || Object.keys(legacy.standalone || {}).length;
    return `<section class="fa-hero"><div><p class="fa-kicker">Тригонометрия · опора для ЕГЭ профиль</p><h1>Азбука<br><em>формул</em></h1><p class="fa-lead">Понять. Восстановить. Применить.</p><p>Один навык за раз: короткий опыт, понятный разбор и новый пример для тебя.</p><div class="fa-actions">${button('Подобрать начало · 6 вопросов', 'diagnostic', '', 'fa-primary')}${button('Как здесь заниматься', 'guide')}</div></div><div class="fa-hero-art" aria-hidden="true">${circle(35, 65)}<div class="fa-art-caption">Угол меняется.<br>Связи остаются.</div></div></section>
      <section class="fa-routes" aria-label="Выбери свой вход">
      ${[['basics','01','Начинаю с основ','Запись, окружность, значения и знаки.'],['formulas','02','Путаю формулы','Сложение, двойной угол, сумма и произведение.'],['equations','03','Готовлюсь к уравнениям','Узнать формулу и выбрать следующий шаг.'],['review','04','Повторить сегодня',s.due ? 'Пора вернуться к ' + s.due + ' умениям.' : 'Короткая тренировка по твоим результатам.']].map(([id,n,title,text]) => `<button type="button" class="fa-route" data-action="route" data-route="${id}"><span class="fa-route-no">${n}</span><strong>${title}</strong><span>${esc(text)}</span><span class="fa-arrow" aria-hidden="true">↗</span></button>`).join('')}
      </section><section class="fa-progress-summary"><h2>Мой прогресс</h2><div class="fa-stats"><div><strong>${s.studied}</strong><span>умений разобрано</span></div><div><strong>${s.independent}<small> / ${s.totalSkills}</small></strong><span>два задания самостоятельно</span></div><div><strong>${s.recalled}</strong><span>вспомнил после перерыва</span></div></div>${prior ? '<p class="fa-muted">Прежний прогресс сохранён как «ранее изучено». Новые самостоятельные умения проверяются отдельно.</p>' : ''}</section>
      <section><div class="fa-section-heading"><h2>Вся азбука</h2><span>16 основных тем + 2 для углубления</span></div>${moduleGrid()}</section>`;
  }
  function moduleGrid(selectedRoute) {
    const r = route[selectedRoute];
    return `<div class="fa-module-grid">${D.modules.filter((m,i) => !r || i + 1 >= r.start && i + 1 <= r.end).map(m => { const n = Number(m.id.slice(1)), count = m.skills.filter(s => completed(s.id)).length; return `<button type="button" class="fa-module" data-action="module" data-module="${m.id}"><span class="fa-module-no">${pad(n)}</span><span><strong>${esc(m.title)}</strong><span class="fa-module-desc">${esc(m.summary)}</span><span class="fa-small">${m.level === 'extension' ? 'Углубление · ' : ''}${count ? count + ' из 3 умений самостоятельно' : '3 умения · 18 разных заданий'}</span></span><span aria-hidden="true">→</span></button>`; }).join('')}</div>`;
  }
  function mapView() { const r = route[store.state.view.route]; return `<p class="fa-kicker">Твой маршрут</p><h1>${esc(r ? r.title : 'Карта тем')}</h1><p class="fa-lead">Открой нужную тему. Уже знакомые основы можно пропустить.</p>${moduleGrid(store.state.view.route)}`; }
  function moduleView() {
    const m = mods.get(store.state.view.moduleId); if (!m) return home();
    const labs = (D.investigations || []).filter(l => l.modules.includes(m.id));
    return `<p class="fa-kicker">Тема ${Number(m.id.slice(1))} из 18${m.level === 'extension' ? ' · углубление' : ''}</p><h1>${esc(m.title)}</h1><p class="fa-lead">${esc(m.summary)}</p>
      ${labs.length ? `<section class="fa-lab-invitation"><div><span class="fa-kicker">Сначала проверь идею</span><h2>${esc(labs[0].title)}</h2><p>${esc(labs[0].question)}</p></div>${button('Открыть исследование', 'lab', `data-lab="${labs[0].id}"`, 'fa-primary')}${labs.slice(1).map(l => button(esc(l.title), 'lab', `data-lab="${l.id}"`)).join('')}</section>` : ''}
      <section class="fa-skill-list">${m.skills.map((s,i) => `<article class="fa-skill"><span class="fa-step-no">${i+1}</span><div><h2>${esc(s.title)}</h2><p class="fa-muted">${esc(skillLabel(s.id))}</p><div class="fa-actions">${button('Потренироваться', 'practice', `data-skill="${s.id}"`, 'fa-primary')}${button('Разобраться по шагам', 'study', `data-skill="${s.id}"`)}</div></div></article>`).join('')}</section>
      ${/m1[23]/.test(m.id) ? `<p class="fa-note"><a href="?legacy=1">Вывести четыре формулы через полусумму и полуразность →</a></p>` : ''}
      ${m.id === 'm16' ? equationBridge() : ''}`;
  }
  function studyView() {
    const s = skills.get(store.state.view.skillId); if (!s) return home();
    store.study(s.id);
    return `<p class="fa-kicker">${esc(mods.get(s.moduleId).title)} · разбор</p><h1>${esc(s.title)}</h1><p class="fa-lead">${esc(s.explanation)}</p><div class="fa-formula">${math(s.formula)}</div><article class="fa-worked"><h2>Посмотрим на одном примере</h2><p>${esc(s.worked.prompt)}</p><ol class="fa-steps">${s.worked.steps.map(step => `<li>${math(step)}</li>`).join('')}</ol><div class="fa-formula">${math(s.worked.answer)}</div></article><p class="fa-note">Этот разбор не засчитывается как самостоятельный ответ. Теперь попробуй другой пример.</p><div class="fa-actions">${button('Попробовать самостоятельно', 'practice', `data-skill="${s.id}"`, 'fa-primary')}${button('К трём умениям темы', 'module', `data-module="${s.moduleId}"`)}</div>`;
  }
  const feedbackLabels = { independent: 'Верно, самостоятельно.', assisted: 'Верно, с помощью.', corrected: 'Верно после исправления.', familiar: 'Верно: знакомый пример.', recalled: 'Вспомнил после перерыва.' };
  function taskView() {
    const t = tasks.get(store.state.view.taskId); if (!t) return home();
    const s = skills.get(t.skillId), a = store.begin(t.id, t.skillId), r = store.state.skills[t.skillId];
    if (ui.taskId !== t.id) { ui.taskId = t.id; ui.blocks = (a.blocks || []).slice(); ui.answer = a.draft || ''; }
    const sequence = s.tasks.findIndex(item => item.id === t.id) + 1;
    const di = diagnostic.indexOf(t.id), isDiagnostic = store.state.view.route === 'diagnostic';
    const label = isDiagnostic ? `Подбираем начало · ${di + 1} из ${diagnostic.length}` : store.state.view.route === 'review' ? 'Повторение после перерыва' : `${mods.get(t.moduleId).title} · ${sequence} / 6`;
    let input;
    if (t.kind === 'choice') {
      // Persist the order within this attempt; reload cannot reveal a fixed correct slot.
      if (!Array.isArray(a.optionOrder) || a.optionOrder.length !== t.options.length) { a.optionOrder = shuffle(t.options.map((_,i) => i)); store.persist(); }
      input = `<fieldset class="fa-choices"><legend>Выбери ответ</legend>${a.optionOrder.map(i => `<label class="fa-option"><input type="radio" name="fa-answer" value="${esc(t.options[i])}" ${ui.answer === t.options[i] || a.draft === t.options[i] ? 'checked' : ''} ${a.closed ? 'disabled' : ''}><span>${math(t.options[i])}</span></label>`).join('')}</fieldset>`;
    } else if (t.kind === 'assemble') {
      input = `<p class="fa-input-label">Собери ответ: нажимай на части внизу. Нажми на выбранную часть, чтобы убрать её.</p><div class="fa-slots" aria-label="Твоя формула">${ui.blocks.length ? ui.blocks.map((text,i) => `<button type="button" class="fa-token selected" data-remove="${i}" aria-label="Убрать ${esc(text)}" ${a.closed ? 'disabled' : ''}>${math(text)}</button>`).join('') : `<span class="fa-placeholder">${a.closed || a.draft ? math(a.draft) : 'Здесь появится твоя формула'}</span>`}</div><div class="fa-token-bank" aria-label="Части формулы">${(t.tokens || []).map(token => `<button type="button" class="fa-token" data-token="${esc(token)}" ${a.closed ? 'disabled' : ''}>${math(token)}</button>`).join('')}</div><div class="fa-actions">${button('↶ Убрать последнюю', 'undo', a.closed ? 'disabled' : '', 'fa-text')}${button('Очистить запись', 'clear', a.closed ? 'disabled' : '', 'fa-text')}</div>`;
    } else input = `<label class="fa-input-label" for="fa-answer">Твоя запись</label><input id="fa-answer" class="fa-answer" type="text" autocomplete="off" spellcheck="false" value="${esc(ui.answer || a.draft)}" placeholder="Запиши ответ" ${a.closed ? 'disabled' : ''}><div class="fa-keypad" aria-label="Вставить знак">${['sin(', 'cos(', 'tan(', 'pi', 'sqrt(', '^2', '(', ')', '*', '/', '!='].map(token => `<button type="button" data-insert="${esc(token)}" ${a.closed ? 'disabled' : ''}>${math(token)}</button>`).join('')}</div><p class="fa-small">Пиши со скобками: sin(2x), sqrt(3), pi. Точку умножения можно заменить на *.</p>`;
    const feedback = a.closed ? feedbackLabels[a.status] : ui.feedback;
    const exhausted = s.tasks.every(item => { const attempt = store.current(item.id); return attempt && (attempt.closed || attempt.familiar); });
    const assistLabel = a.assisted ? 'Подсказка открыта · текущая попытка с помощью' : a.wrong ? 'Можно исправить ответ · первая ошибка сохранена' : a.familiar ? 'Повторяем знакомый пример' : 'Новый пример';
    return `<p class="fa-kicker">${esc(label)}</p><div class="fa-task-heading"><h1>${esc(s.title)}</h1>${badge(assistLabel, a.assisted ? 'helped' : '')}</div><article class="fa-task" data-task-id="${t.id}"><p class="fa-prompt">${esc(t.prompt)}</p>${t.expression ? `<div class="fa-formula fa-question">${math(t.expression)}</div>` : ''}<form id="fa-task-form">${input}<div class="fa-actions"><button type="submit" class="fa-button fa-primary" id="fa-check" ${a.closed ? 'disabled' : ''}>Проверить</button>${button('Подсказка', 'hint')}${button('Показать разбор', 'solution')}</div></form>
      <div class="fa-feedback ${a.closed ? 'ok' : ui.feedbackType}" role="status" aria-live="polite">${esc(feedback || '')}</div>
      ${exhausted ? '<p class="fa-note">Все шесть примеров этого умения уже знакомы. Сейчас тренируем знакомые; после перерыва проверим вспоминание. Новые самостоятельные примеры не добавляются.</p>' : ''}
      ${ui.hint ? `<aside class="fa-help"><strong>Один шаг</strong><p>${math(t.hint)}</p></aside>` : ''}
      ${ui.solution ? `<aside class="fa-help"><strong>Разбор</strong><p>${math(t.solution)}</p><div class="fa-formula">${math(t.answers[0])}</div></aside>` : ''}
      ${a.closed ? `<div class="fa-actions">${button(isDiagnostic && di === diagnostic.length - 1 ? 'Посмотреть подходящий маршрут' : 'Следующий пример →', 'next', '', 'fa-primary')}${button('К теме', 'module', `data-module="${t.moduleId}"`)}</div><p class="fa-small">${!exhausted && (a.status === 'assisted' || a.status === 'corrected') ? 'Для самостоятельной проверки возьмём другое задание на это умение.' : r.dueAt ? 'Вернёмся к умению ' + formatDate(r.dueAt) + '. Можно продолжать практику сейчас.' : ''}</p>` : `<div class="fa-actions">${button('Другой пример', 'next', '', 'fa-text')}${isDiagnostic ? button('Пока не знаю — дальше', 'skip', '', 'fa-text') : ''}</div>`}
      </article><details class="fa-reference" id="fa-task-reference"><summary>Вспомнить формулу и объяснение</summary><div class="fa-formula">${math(s.formula)}</div><p>${esc(s.explanation)}</p></details><p class="fa-small">Открытая справка помечает эту попытку как работу с помощью.</p>`;
  }
  function nextTask(skip = false) {
    const t = tasks.get(store.state.view.taskId); if (!t) return;
    if (skip) store.help(t.id);
    if (store.state.view.route === 'diagnostic') {
      const index = diagnostic.indexOf(t.id);
      if (index >= diagnostic.length - 1) return go('diagnostic-result');
      return go('task', { taskId: diagnostic[index + 1], route: 'diagnostic' });
    }
    const next = chooseTask(t.skillId, t.id); if (!next) return;
    if (store.current(next.id)?.closed) store.repeat(next.id, next.skillId, 'practice');
    go('task', { taskId: next.id, route: store.state.view.route === 'review' ? '' : store.state.view.route });
  }
  function diagnosticResult() {
    const first = diagnostic.map(id => ({ t: tasks.get(id), a: store.current(id) })).find(x => !x.a?.closed || x.a.status !== 'independent');
    const moduleId = first ? first.t.moduleId : 'm09';
    return `<p class="fa-kicker">Подобрали начало</p><h1>${first ? 'Начни с этой опоры' : 'Можно перейти к преобразованиям'}</h1><p class="fa-lead">${esc(mods.get(moduleId).title)}</p><p>Это рекомендация по шести вопросам. Все темы остаются открыты — можно выбрать другую.</p><div class="fa-actions">${button('Открыть тему', 'module', `data-module="${moduleId}"`, 'fa-primary')}${button('Вся карта', 'map')}</div>`;
  }
  function reviewView() {
    const due = store.due();
    const future = Object.values(store.state.skills).map(r => r.dueAt).filter(n => typeof n === 'number' && n > Date.now()).sort((a,b) => a-b)[0];
    return `<p class="fa-kicker">Короткое повторение</p><h1>Вспомнить сегодня</h1><p class="fa-lead">Сначала попробуй без справки. Если не вспомнишь, разберём ещё раз.</p>${due.length ? `<div class="fa-skill-list">${due.slice(0, 12).map(id => `<article class="fa-skill"><div><h2>${esc(skills.get(id).title)}</h2><p>${esc(skillLabel(id))}</p>${button('Вспомнить на примере', 'review-skill', `data-skill="${id}"`, 'fa-primary')}</div></article>`).join('')}</div>` : `<div class="fa-note"><h2>На сегодня очередь свободна</h2><p>${future ? 'Ближайшее повторение — ' + formatDate(future) + '.' : 'После первых ответов здесь появятся умения для повторения.'}</p><p>Для новой тренировки открой любую тему.</p>${button('Выбрать тему', 'map', '', 'fa-primary')}</div>`}<p class="fa-small">Первые интервалы: 1, 3, 7, 14 и 30 дней. Ошибка возвращает умение к ближайшему повторению. Пропущенные дни не стирают результат.</p>`;
  }
  function referenceView() {
    return `<p class="fa-kicker">Опора под рукой</p><h1>Справочник формул</h1><p class="fa-lead">Здесь можно подсмотреть и распечатать. Самостоятельность проверим на другом примере.</p>${button('Распечатать', 'print')}<div class="fa-formula-atlas">${D.modules.map(m => `<section><h2>${Number(m.id.slice(1))}. ${esc(m.title)}</h2>${m.skills.map(s => `<div class="fa-atlas-row"><h3>${esc(s.title)}</h3><div class="fa-formula">${math(s.formula)}</div><p>${esc(s.explanation)}</p></div>`).join('')}</section>`).join('')}</div>`;
  }
  function teacherView() {
    const s = store.summary();
    return `<p class="fa-kicker">В этом браузере</p><h1>Прогресс ученика</h1><p class="fa-lead">Виден способ выполнения: объяснение, помощь, самостоятельный ответ и повторение.</p><div class="fa-actions">${button('Скачать отчёт', 'export', '', 'fa-primary')}${button('Распечатать', 'print')}</div><p class="fa-note">Отчёт можно передать учителю самостоятельно. Он не импортирует результаты в кабинет и не отправляет их автоматически.</p><div class="fa-stats"><div><strong>${s.independent}/${s.totalSkills}</strong><span>два разных задания самостоятельно</span></div><div><strong>${s.applied}</strong><span>умений применено самостоятельно</span></div><div><strong>${s.recalled}</strong><span>вспомнил после перерыва</span></div></div><div class="fa-table-scroll"><table class="fa-table"><thead><tr><th>Умение</th><th>Самостоятельно</th><th>С помощью</th><th>После исправления</th><th>Следующее повторение</th></tr></thead><tbody>${[...skills].map(([id,s]) => { const r = store.state.skills[id]; return `<tr><th>${esc(s.title)}</th><td>${r.independent.length}</td><td>${r.assisted.length}</td><td>${r.corrected.length}</td><td>${r.dueAt ? formatDate(r.dueAt) : '—'}</td></tr>`; }).join('')}</tbody></table></div><p class="fa-small">Знакомые повторные ответы не увеличивают число новых самостоятельных примеров. Старые отметки сохранены отдельно.</p>`;
  }
  function guideView() {
    const steps = ['Выбери часть формулы — она появится в строке ответа.', 'Нужную часть можно использовать ещё раз.', 'Ошибся при сборке? Нажми на выбранную часть или «Убрать последнюю».', 'Нажми «Проверить». Подсказка доступна в любой момент.'];
    const blocks = [[], ['sin(a)'], ['sin(a)', '*', 'cos(b)'], ['sin(a)', '*', 'cos(b)', '+', 'cos(a)', '*', 'sin(b)']][ui.demo];
    return `<p class="fa-kicker">Четыре коротких шага</p><h1>Как собирать формулу</h1><p class="fa-lead">${steps[ui.demo]}</p><div class="fa-demo" aria-live="polite"><div class="fa-formula">sin(a + b) = ${blocks.map(b => `<span class="fa-demo-block">${math(b)}</span>`).join('') || '…'}</div><div class="fa-demo-track">${steps.map((_,i) => `<span class="${i === ui.demo ? 'active' : ''}">${i+1}</span>`).join('')}</div></div><div class="fa-actions">${button('← Назад', 'demo-back', ui.demo === 0 ? 'disabled' : '')}${button(ui.playing ? 'Пауза' : 'Показать автоматически', 'demo-play')}${button('Дальше →', 'demo-next', ui.demo === 3 ? 'disabled' : '', 'fa-primary')}</div><p class="fa-note">Перетаскивать ничего не нужно. Все части доступны кнопками и с клавиатуры.</p>${button('Выбрать тему', 'map')}`;
  }
  function equationBridge() { return `<aside class="fa-bridge"><h2>Готов к следующему шагу</h2><p>Формулы помогли подготовить уравнение. Теперь можно решать его и отбирать корни в основном курсе.</p><a class="fa-button fa-primary" href="trigonometry.html?topic=equations">К тригонометрическим уравнениям →</a><a class="fa-button" href="../part-two/">К задачам второй части</a></aside>`; }

  function circle(a, b) {
    const cx = 200, cy = 165, r = 108, rad = a * Math.PI / 180;
    const x = cx + r * Math.cos(rad), y = cy - r * Math.sin(rad);
    const second = b === undefined ? null : { x: cx + r * Math.cos(b * Math.PI / 180), y: cy - r * Math.sin(b * Math.PI / 180) };
    return `<svg viewBox="0 0 400 330" role="img" aria-label="Единичная окружность. Угол ${a} градусов. Масштаб осей одинаковый."><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#b7c9c8" stroke-width="2"/><path d="M45 165H355M200 310V20" fill="none" stroke="#7d9495" stroke-width="1.4"/><path d="M348 160l7 5-7 5M195 27l5-7 5 7" fill="none" stroke="#7d9495"/><text x="360" y="172" class="fa-svg-label">cos</text><text x="209" y="29" class="fa-svg-label">sin</text><text x="209" y="184" class="fa-svg-small">0</text><text x="304" y="186" class="fa-svg-small">1</text><text x="180" y="58" class="fa-svg-small">1</text><text x="79" y="185" class="fa-svg-small">−1</text><text x="175" y="287" class="fa-svg-small">−1</text>
      ${second ? `<line x1="200" y1="165" x2="${second.x}" y2="${second.y}" stroke="#bb7945" stroke-width="3" stroke-dasharray="6 5"/><circle cx="${second.x}" cy="${second.y}" r="5" fill="#bb7945"/>` : ''}<path d="M${x} ${cy}V${y}H${cx}" fill="none" stroke="#64a6aa" stroke-width="1.5" stroke-dasharray="5 5"/><line x1="200" y1="165" x2="${x}" y2="${y}" stroke="#087f83" stroke-width="3.5"/><line x1="200" y1="165" x2="${x}" y2="165" stroke="#e29b50" stroke-width="5"/><line x1="200" y1="165" x2="200" y2="${y}" stroke="#087f83" stroke-width="5"/><circle cx="${x}" cy="${y}" r="6" fill="#087f83" stroke="#fff" stroke-width="2"/><text x="${x + (x > 280 ? -13 : 13)}" y="${y - 12}" text-anchor="${x > 280 ? 'end' : 'start'}" class="fa-svg-label">P</text></svg>`;
  }
  const num = x => Math.abs(x) < 0.00005 ? '0' : x.toFixed(3).replace(/\.?0+$/, '');
  function readings(kind, a, b) {
    const rad = x => x * Math.PI / 180, sin = x => Math.sin(rad(x)), cos = x => Math.cos(rad(x));
    if (kind === 'radians') return [`${a}° = ${num(a / 180)}π рад`, '180° = π рад; 360° = 2π рад'];
    if (kind === 'identity') return [`cos² ${a}° + sin² ${a}° = ${num(cos(a)**2 + sin(a)**2)}`, 'Сумма квадратов координат сохраняется.'];
    if (kind === 'parity') return [`sin(−${a}°) = ${num(sin(-a))}; sin ${a}° = ${num(sin(a))}`, `cos(−${a}°) = cos ${a}° = ${num(cos(a))}`];
    if (kind === 'reduction') return [`sin(${a}° + 90°) = ${num(sin(a+90))}`, `cos ${a}° = ${num(cos(a))}`];
    if (kind === 'nonadditive') return [`sin(${a}° + ${b}°) = ${num(sin(a+b))}`, `sin ${a}° + sin ${b}° = ${num(sin(a)+sin(b))}`];
    if (kind === 'addition') return [`sin(${a}° + ${b}°) = ${num(sin(a+b))}`, `sin α cos β + cos α sin β = ${num(sin(a)*cos(b)+cos(a)*sin(b))}`, `cos(α + β) = cos α cos β − sin α sin β = ${num(cos(a+b))}`];
    if (kind === 'double') return [`sin(2 · ${a}°) = ${num(sin(2*a))}`, `2 sin ${a}° cos ${a}° = ${num(2*sin(a)*cos(a))}`];
    if (kind === 'cosdouble') return [`cos(2 · ${a}°) = ${num(cos(2*a))}`, `cos² α − sin² α = ${num(cos(a)**2-sin(a)**2)}`, `1 − 2 sin² α = ${num(1-2*sin(a)**2)}; 2 cos² α − 1 = ${num(2*cos(a)**2-1)}`];
    if (kind === 'halfsum') return [`p = (α + β)/2 = ${(a+b)/2}°; q = (α − β)/2 = ${(a-b)/2}°`, `p + q = ${a}°; p − q = ${b}°`, `sin α + sin β = ${num(sin(a)+sin(b))}; 2 sin p cos q = ${num(2*sin((a+b)/2)*cos((a-b)/2))}`];
    if (kind === 'cosdifference') return [`cos α − cos β = ${num(cos(a)-cos(b))}`, `−2 sin((α+β)/2) sin((α−β)/2) = ${num(-2*sin((a+b)/2)*sin((a-b)/2))}`, `2 sin((α+β)/2) sin((β−α)/2) = ${num(2*sin((a+b)/2)*sin((b-a)/2))}`];
    if (kind === 'domain') return [`(1 − cos 2α) / sin α: ${Math.abs(sin(a)) < 1e-10 ? 'не определено' : num((1-cos(2*a))/sin(a))}`, `2 sin α = ${num(2*sin(a))}`, 'У исходной дроби: sin α ≠ 0.'];
    return [`cos ${a}° = ${num(cos(a))} — координата по горизонтали`, `sin ${a}° = ${num(sin(a))} — координата по вертикали`];
  }
  function comparisonAngle(kind, a, b) {
    if (['nonadditive','addition','halfsum','cosdifference'].includes(kind)) return a + b;
    if (kind === 'parity') return -a;
    if (kind === 'reduction') return a + 90;
    if (kind === 'double' || kind === 'cosdouble') return 2 * a;
    return undefined;
  }
  function labView() {
    const l = (D.investigations || []).find(l => l.id === store.state.view.investigationId); if (!l) return home();
    const two = ['nonadditive','addition','halfsum','cosdifference'].includes(l.kind);
    const sceneAngle = l.kind === 'domain' ? labState.a : labState.a;
    const second = comparisonAngle(l.kind, labState.a, labState.b);
    return `<p class="fa-kicker">Исследование · сначала твой прогноз</p><h1>${esc(l.title)}</h1><p class="fa-lead">${esc(l.question)}</p><div class="fa-prediction">${l.predictions.map((label,i) => button(esc(label),'predict',`data-prediction="${i}" aria-pressed="${labState.prediction === i}"`, labState.prediction === i ? 'fa-primary' : '')).join('')}</div>
      ${labState.prediction === null ? '<p class="fa-note">Выбери предположение. Потом проверим его на модели.</p>' : `<section class="fa-lab-model"><div>${circle(sceneAngle,second)}<p class="fa-small">Зелёный луч: α.${second !== undefined ? ' Пунктир: второй угол для сравнения.' : ''} Оси имеют одинаковый масштаб.</p></div><div><label class="fa-slider-label">Угол α <strong id="fa-angle-a">${labState.a}°</strong><input type="range" id="fa-angle-slider-a" min="-180" max="360" step="15" value="${labState.a}"></label>${two ? `<label class="fa-slider-label">Угол β <strong id="fa-angle-b">${labState.b}°</strong><input type="range" id="fa-angle-slider-b" min="-180" max="360" step="15" value="${labState.b}"></label>` : ''}<p class="fa-note">${esc(l.instruction)}</p><div class="fa-readings">${readings(l.kind,labState.a,labState.b).map(s => `<p>${math(s)}</p>`).join('')}</div>${button('Проверить вывод', 'observe', '', 'fa-primary')}</div></section>`}
      ${labState.observed ? `<section class="fa-conclusion"><h2>Какой вывод выдержал проверку?</h2>${l.conclusions.map((text,i) => button(math(text),'conclude',`data-conclusion="${i}"`)).join('')}<p role="status" class="fa-feedback ${labState.feedback.startsWith('Верно') ? 'ok' : ''}">${esc(labState.feedback)}</p>${store.state.investigations[l.id] ? `<p>${esc(l.explanation)}</p><p class="fa-small">Числовой опыт помогает заметить связь; общая формула требует вывода.</p>${button('К умениям темы', 'module', `data-module="${store.state.view.moduleId || l.modules[0]}"`, 'fa-primary')}` : ''}</section>` : ''}`;
  }
  function render(focus) {
    const previous = document.activeElement;
    const owned = previous && host.contains(previous);
    const identity = !focus && owned ? { id: previous.id, tag: previous.tagName, data: { ...previous.dataset }, name: previous.getAttribute('name'), value: previous.value, details: previous.tagName === 'SUMMARY' ? previous.parentElement.id : null } : null;
    const views = { home, map: mapView, module: moduleView, study: studyView, task: taskView, review: reviewView, reference: referenceView, teacher: teacherView, guide: guideView, lab: labView, 'diagnostic-result': diagnosticResult };
    const fresh = store.ensureCurrent();
    const draft = store.current(store.state.view.taskId)?.draft || ui.answer || '';
    const conflict = `<h1>Продолжить с актуальными данными</h1><p>В другой вкладке уже сохранена работа. Обнови эту страницу, чтобы продолжить обучение и открыть помощь с сохранением её отметки.</p>${draft ? `<label class="fa-input-label" for="fa-conflict-draft">Твоя последняя запись — её можно скопировать перед обновлением</label><input class="fa-answer" id="fa-conflict-draft" readonly value="${esc(draft)}">` : ''}<div class="fa-actions">${button('Обновить страницу','reload','','fa-primary')}</div>`;
    const content = fresh ? (views[store.state.view.screen] || home)() : conflict;
    host.innerHTML = shell(store.ensureCurrent() ? content : conflict);
    host.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => action(el)));
    bindTask(); bindLab();
    if (identity) {
      const target = [...host.querySelectorAll('button,input,summary,a,[tabindex]')].find(node => {
        if (node.disabled || node.tagName !== identity.tag) return false;
        if (identity.id) return node.id === identity.id;
        if (identity.details) return node.parentElement.id === identity.details;
        if (identity.name) return node.getAttribute('name') === identity.name && node.value === identity.value;
        return Object.keys(identity.data).length > 0 && Object.entries(identity.data).every(([key,value]) => node.dataset[key] === value);
      });
      (target || host.querySelector('#fa-content'))?.focus({ preventScroll:true });
    }
    if (focus) { const h = host.querySelector('#fa-content'); h.focus({ preventScroll: true }); host.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }
  function bindTask() {
    const t = tasks.get(store.state.view.taskId);
    const form = host.querySelector('#fa-task-form'); if (!form || !t) return;
    const a = store.current(t.id);
    const input = host.querySelector('#fa-answer');
    if (input) input.addEventListener('input', () => { ui.answer = input.value; a.draft = input.value.slice(0,350); store.persist(); });
    host.querySelectorAll('input[name="fa-answer"]').forEach(el => el.addEventListener('change', () => { ui.answer = el.value; a.draft = el.value; store.persist(); }));
    host.querySelectorAll('[data-token]').forEach(el => el.addEventListener('click', () => { if(a.closed || ui.blocks.length >= 80) return; ui.blocks.push(el.dataset.token); ui.answer = ui.blocks.join(' '); a.draft = ui.answer; a.blocks = ui.blocks.slice(); store.persist(); render(false); host.querySelector('[data-token]')?.focus(); }));
    host.querySelectorAll('[data-remove]').forEach(el => el.addEventListener('click', () => { if(a.closed) return; ui.blocks.splice(Number(el.dataset.remove),1); ui.answer = ui.blocks.join(' '); a.draft = ui.answer; a.blocks = ui.blocks.slice(); store.persist(); render(false); host.querySelector('[data-token]')?.focus(); }));
    host.querySelectorAll('[data-insert]').forEach(el => el.addEventListener('click', () => { if (!input || a.closed) return; const pos = input.selectionStart || 0; input.setRangeText(el.dataset.insert, pos, input.selectionEnd || pos, 'end'); ui.answer = input.value; a.draft = input.value; store.persist(); input.focus(); }));
    const reference = host.querySelector('#fa-task-reference');
    reference?.querySelector('summary')?.addEventListener('click', e => {
      if (!reference.open) {
        store.help(t.id);
        if (!store.ensureCurrent()) { e.preventDefault(); render(false); }
      }
    });
    reference?.addEventListener('toggle', e => {
      if (e.target.open) {
        store.help(t.id);
        if (!store.ensureCurrent()) { e.target.open = false; render(false); return; }
        const b = host.querySelector('.fa-task-heading .fa-badge');
        if (b && !a.closed) b.textContent = 'Справка открыта · текущая попытка с помощью';
      }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const raw = t.kind === 'choice' ? host.querySelector('input[name="fa-answer"]:checked')?.value || '' : t.kind === 'assemble' ? ui.blocks.length ? ui.blocks.join(' ') : a.draft || '' : input?.value || '';
      const result = store.submit(t.id, raw, t);
      ui.feedback = result.status === 'conflict' ? 'В другой вкладке уже сохранена работа. Обнови эту страницу, чтобы продолжить с актуальной попыткой. Этот ответ не засчитан.' : result.status === 'format' ? 'Проверь запись: заполни ответ и закрой скобки. Эта отправка не считается математической ошибкой.' : result.status === 'form' ? 'Выражение равносильно ответу. Теперь выполни действие из условия: запиши требуемую форму и упрости аргументы. Математической ошибки здесь нет.' : result.status === 'wrong' ? 'Пока не сходится. Проверь знак, функцию и весь аргумент. Можно исправить запись или попросить подсказку.' : feedbackLabels[result.status];
      ui.feedbackType = result.status === 'wrong' ? 'wrong' : ['format','form','conflict'].includes(result.status) ? 'format' : 'ok';
      render(false); host.querySelector('.fa-feedback')?.scrollIntoView({ block:'nearest' });
      if (!result.correct) (host.querySelector('#fa-answer') || host.querySelector('input[name="fa-answer"]:checked') || host.querySelector('[data-token]'))?.focus(); else host.querySelector('[data-action="next"]')?.focus();
    });
  }
  function bindLab() {
    for (const name of ['a','b']) host.querySelector('#fa-angle-slider-' + name)?.addEventListener('input', e => {
      const value = Number(e.target.value); labState[name] = value; labState.observed = false; labState.feedback = '';
      if (!store.ensureCurrent()) return render(false);
      const lab = D.investigations.find(item => item.id === store.state.view.investigationId);
      if (!lab) return;
      // Keep the actual range input mounted during dragging and key repeats.
      const label = host.querySelector('#fa-angle-' + name); if (label) label.textContent = value + '°';
      const figure = host.querySelector('.fa-lab-model svg');
      if (figure) figure.outerHTML = circle(labState.a, comparisonAngle(lab.kind,labState.a,labState.b));
      const panel = host.querySelector('.fa-readings');
      if (panel) panel.innerHTML = readings(lab.kind,labState.a,labState.b).map(s => `<p>${math(s)}</p>`).join('');
      host.querySelector('.fa-conclusion')?.remove();
    });
  }
  function action(el) {
    const v = store.state.view, act = el.dataset.action;
    if (act === 'reload') return location.reload();
    if (act === 'home') return go('home');
    if (act === 'map') return go('map', { route: '' });
    if (act === 'module') return go('module', { moduleId: el.dataset.module });
    if (act === 'route') return el.dataset.route === 'review' ? go('review', { route:'review' }) : go('map', { route:el.dataset.route });
    if (act === 'study') return go('study', { skillId:el.dataset.skill });
    if (act === 'practice') return startTask(el.dataset.skill);
    if (act === 'diagnostic') return go('task', { taskId:diagnostic[0], route:'diagnostic' });
    if (act === 'next') return nextTask();
    if (act === 'skip') return nextTask(true);
    if (act === 'review-skill') return startTask(el.dataset.skill, undefined, 'review');
    if (['review','reference','teacher','guide'].includes(act)) return go(act, act === 'review' ? { route:'review' } : {});
    if (act === 'hint' || act === 'solution') { store.help(v.taskId); ui[act] = true; render(false); return; }
    if (act === 'undo' || act === 'clear') { const a = store.current(v.taskId); if (a?.closed) return; if (act === 'undo') ui.blocks.pop(); else ui.blocks = []; ui.answer = ui.blocks.join(' '); if (a) { a.draft = ui.answer; a.blocks = ui.blocks.slice(); } store.persist(); render(false); host.querySelector('[data-action="'+act+'"]')?.focus(); return; }
    if (act === 'print') return window.print();
    if (act === 'export') {
      if (!store.ensureCurrent()) return render(false);
      const blob = new Blob([JSON.stringify(store.report(),null,2)], { type:'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'mathexam-formula-progress.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000); return;
    }
    if (act.startsWith('demo-')) {
      if (act === 'demo-play') { ui.playing = !ui.playing; if (demoTimer) { clearInterval(demoTimer); demoTimer = null; } if (ui.playing) demoTimer = setInterval(() => { ui.demo = (ui.demo+1)%4; render(false); }, 2600); }
      else { if (demoTimer) { clearInterval(demoTimer); demoTimer=null; } ui.playing=false; ui.demo = Math.max(0,Math.min(3,ui.demo+(act === 'demo-next' ? 1 : -1))); }
      return render(false);
    }
    if (act === 'lab') { labState = { a:30,b:30,prediction:null,observed:false,feedback:'' }; const l = D.investigations.find(l => l.id === el.dataset.lab); if (l?.kind === 'domain') labState.a=0; return go('lab', { investigationId:el.dataset.lab }); }
    if (act === 'predict') { labState.prediction = Number(el.dataset.prediction); return render(false); }
    if (act === 'observe') { labState.observed = true; return render(false); }
    if (act === 'conclude') {
      const l = D.investigations.find(l => l.id === v.investigationId);
      if (Number(el.dataset.conclusion) === l.correct) { store.state.investigations[l.id] = true; store.persist(); labState.feedback = 'Верно. Ты проверил идею на модели.'; }
      else labState.feedback = 'Проверь ещё раз: сравни значения и положение точки. Можно изменить угол.';
      return render(false);
    }
  }
  document.addEventListener('profile-course-help-requested', () => { activeHelp(); if (store.conflicted) render(false); });
  window.addEventListener('storage', event => { if (event.key === F.KEY || event.key === null) render(false); });
  if (params.has('module') && mods.has(params.get('module'))) store.state.view = { screen:'module', moduleId:params.get('module') };
  else if (params.has('skill') && skills.has(params.get('skill'))) { activeHelp(params.get('skill')); store.state.view = { screen:'study', skillId:params.get('skill') }; }
  else if (params.get('view') === 'teacher') store.state.view = { screen:'teacher' };
  else if (params.get('view') === 'home') store.state.view = { screen:'home' };
  window.MathExamFormulaApp = { store, go, startTask, shuffle };
  render(false);
})();
