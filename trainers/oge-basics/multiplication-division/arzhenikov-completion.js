/* Entry, visited-topic review and final transfer inside the existing course. */
(() => {
  'use strict';
  const E = window.ArzhenikovCompletionEngine;
  const B = window.ArzhenikovCompletionBank;
  const checkAnswer = window.ArzhenikovCourseEngine?.checkAnswer;
  if (!E || !B || !checkAnswer) return;
  const titles = {placement:'С чего мне начать?', review:'Повторить изученное', final:'Применить всё вместе'};
  let state = null, storageOK = true, note = '', context = null;
  const el = (tag, cls = '', text) => {
    const node = document.createElement(tag); if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text; return node;
  };
  const link = (text, href, cls = '') => { const a = el('a', cls, text); a.href = href; return a; };
  function button(text, action, fn, primary = false) {
    const b = el('button', primary ? 'course-primary' : '', text); b.type = 'button';
    b.dataset.completionAction = action; b.addEventListener('click', fn); return b;
  }
  function prose(tag, cls, text) {
    const node = el(tag, cls); const regex = /(?:(\d+)\s+)?(\d+)\/(\d+)/g;
    let at = 0;
    for (const match of String(text).matchAll(regex)) {
      node.append(document.createTextNode(text.slice(at, match.index)));
      if (match[1]) node.append(document.createTextNode(match[1] + ' '));
      const fraction = el('span', 'completion-fraction'); fraction.setAttribute('role','math');
      fraction.setAttribute('aria-label',match[2] + ' делённое на ' + match[3]);
      const top = el('span','',match[2]), bottom = el('span','',match[3]);
      top.setAttribute('aria-hidden','true'); bottom.setAttribute('aria-hidden','true');
      fraction.append(top,bottom); node.append(fraction); at = match.index + match[0].length;
    }
    node.append(document.createTextNode(text.slice(at))); return node;
  }
  const bank = () => B.withLessons(context.lessons, context.courseState);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function initialize() {
    if (state) return;
    state = E.fresh();
    try {
      const source = localStorage.getItem(E.key);
      if (source !== null) {
        const raw = JSON.parse(source);
        if (!raw || raw.version !== 1 || !raw.sessions || typeof raw.sessions !== 'object' ||
            !raw.history || typeof raw.history !== 'object' || Array.isArray(raw.sessions) || Array.isArray(raw.history)) throw new Error('unreadable record');
        state = E.normalize(raw, bank(), checkAnswer);
        // Normalization can recover other modes, but must not silently replace
        // the original text when a saved session or its queued entries was lost.
        // Optional v1 evidence fields may still be absent in an older valid save.
        if (Object.entries(raw.sessions).some(([mode, session]) => session !== null &&
          (!Object.prototype.hasOwnProperty.call(state.sessions,mode) || !state.sessions[mode] ||
            !object(session.entries) || session.itemIds.some(id =>
              !object(session.entries[id]) || session.entries[id].id !== id)))) throw new Error('damaged session');
      }
    } catch {
      storageOK = false;
      note = 'Не удалось прочитать сохранение проверок. Можно работать в этой вкладке; прежняя запись остаётся без изменений.';
    }
  }
  function save() {
    if (!storageOK) return;
    try { localStorage.setItem(E.key, JSON.stringify(state)); }
    catch { storageOK = false; note = 'Сейчас ответы остаются только в этой вкладке: браузер не разрешил сохранить проверку.'; }
    const message = context.host.querySelector('.completion-save-note');
    if (message) message.textContent = note || 'Ответы и черновик сохраняются в этом браузере. Можно прерваться и продолжить.';
  }
  function feedback(message, kind = '') {
    const output = context.host.querySelector('#completion-feedback');
    if (output) { output.textContent = message; output.dataset.kind = kind; }
  }
  function heading(title, kicker) {
    if (kicker) context.host.append(el('p','course-eyebrow',kicker));
    const h = el('h2','course-title',title); h.id = 'course-heading'; h.tabIndex = -1;
    context.host.append(h);
  }
  function rerender(focus = false) {
    render(context);
    if (focus) context.host.querySelector('#course-heading')?.focus({preventScroll:true});
  }
  function launch(mode) {
    const data = bank(), ids = E.selectItems(mode, data, {courseState:context.courseState, history:state.history});
    if (!ids.length) return;
    E.start(state, {mode, itemIds:ids, now:Date.now()}, data); save(); rerender(true);
  }
  function welcome(mode) {
    const ids = E.selectItems(mode, bank(), {courseState:context.courseState, history:state.history});
    heading(titles[mode], mode === 'placement' ? 'Выбираем удобный вход' : mode === 'review' ? 'Короткое повторение' : 'Итог базовой арифметики');
    const text = {
      placement:'Восемь коротких задач помогут выбрать, что потренировать сначала. Это ориентир по отдельным умениям: все темы курса здесь не проверяются. Можно попросить помощь или ответить «Пока не знаю». После первого набора можно выбрать ещё восемь других задач.',
      review:'До шести задач из тем, в которых ты уже начал работу. В первую очередь возвращаемся к затруднениям. Просмотр карты или названия урока не добавляет тему в повторение.',
      final:'Шестнадцать разных ситуаций. Выбери действие сам: условие не даёт готового плана. Можно считать на бумаге, сделать свой рисунок, попросить подсказку или открыть разбор. Помощь сохранится отдельно от первого ответа.'
    };
    context.host.append(el('p','course-lead',text[mode]));
    if (mode === 'final') {
      const arithmetic = context.lessons.filter(lesson => !/^[bg]-/.test(lesson.id));
      const done = arithmetic.filter(lesson => context.courseState.lessons[lesson.id]?.completedAt).length;
      context.host.append(el('p','course-start-note','В базовом маршруте пройдено ' + done + ' из ' + arithmetic.length + ' уроков. Итоговую работу можно открыть сейчас или после занятий. Прохождение уроков и решение новых задач — разные результаты.'));
    }
    if (!ids.length) {
      context.host.append(el('p','completion-empty','Сначала начни любой урок. Тогда здесь появятся задачи именно по знакомым темам.'),
        link('Начать с первого урока →','#course-a-count','course-primary'));
    } else {
      const actions = el('div','course-actions');
      actions.append(button(mode === 'review' ? 'Повторить · задач: ' + ids.length : 'Начать · задач: ' + ids.length,'start',() => launch(mode),true));
      if (mode === 'placement') actions.append(link('Сразу к первому уроку','#course-a-count'));
      context.host.append(actions);
    }
    context.host.append(link('Выбрать любой урок →','#courses','course-return'));
  }
  function helpSection(item, entry) {
    const section = el('section','completion-help'); section.setAttribute('aria-label','Помощь по желанию');
    const actions = el('div','course-actions');
    for (const [kind, title] of [['hint','Небольшая подсказка'],['solution','Посмотреть разбор']]) {
      if (!entry.help[kind] && !entry.skipped && !(entry.solved && entry.reason.solved)) {
        actions.append(button(title,kind,() => { E.useHelp(state,kind); save(); rerender();
          context.host.querySelector('[data-completion-help="' + kind + '"]')?.focus({preventScroll:true}); }));
      }
    }
    section.append(actions);
    for (const kind of ['hint','solution']) if (entry.help[kind]) {
      const box = el('div','course-example'); box.dataset.completionHelp = kind; box.tabIndex = -1;
      box.append(el('h3','',kind === 'hint' ? 'Подсказка' : 'Разбор'), prose('p','',kind === 'hint' ? item.hint : item.explanation));
      if (kind === 'solution' && item.reason) box.append(prose('p','',item.reason.explanation));
      section.append(box);
    }
    if (entry.helpUsed) section.append(el('p','course-start-note','Помощь открыта. Продолжай решение: работа с опорой тоже полезна.'));
    return section;
  }
  function exercise(mode, session, entry, item) {
    heading('Задача ' + (session.cursor + 1) + ' из ' + session.itemIds.length, titles[mode]);
    context.host.dataset.completionItem = item.id;
    const meter = el('progress','completion-progress'); meter.max = session.itemIds.length; meter.value = session.cursor;
    meter.setAttribute('aria-label','Завершено задач'); context.host.append(meter);
    if (entry.presentation > 1) context.host.append(el('p','completion-familiar','Ты уже встречал это условие. Это тренировка; новый самостоятельный результат за него не начисляется.'));
    if (item.familiarPractice) context.host.append(el('p','course-start-note','Учебное повторение. Здесь проверяется итоговое число. Все промежуточные шаги можно пройти в уроке.'));
    context.host.append(prose('p','completion-prompt',item.prompt));
    const form = el('form','completion-answer-form'); form.noValidate = true;
    const label = el('label','','Твой ответ' + (item.unit ? ' · ' + item.unit : '')); label.htmlFor = 'completion-answer';
    const input = el('input'); input.id = 'completion-answer'; input.type = 'text'; input.autocomplete = 'off';
    input.inputMode = item.answerFormat === 'integer' ? 'numeric' : 'text'; input.maxLength = 40;
    input.value = entry.input; input.disabled = entry.solved || entry.skipped;
    input.setAttribute('aria-describedby','completion-format completion-feedback');
    input.addEventListener('input',() => { E.setInput(state,input.value); save(); });
    const format = el('p','completion-format',item.answerFormat === 'integer' ? 'Введи целое число.' : item.answerFormat === 'comparison' ? 'Введи знак <, > или =.' : item.answerFormat === 'decimal' ? 'Запиши десятичное число. Можно использовать запятую или точку.' : 'Числитель и знаменатель раздели знаком /. У смешанного числа целую часть отдели пробелом.');
    format.id = 'completion-format';
    const submit = el('button','course-primary','Проверить ответ'); submit.type = 'submit'; submit.dataset.completionAction = 'answer';
    submit.disabled = entry.solved || entry.skipped;
    form.append(label,input,format,submit);
    form.addEventListener('submit',event => {
      event.preventDefault(); E.setInput(state,input.value);
      const result = E.submit(state,bank(),checkAnswer); save();
      if (result.kind === 'correct') { rerender(); feedback('Числовой ответ верный.', 'correct');
        context.host.querySelector('[name="completion-reason"], [data-completion-action="next"]')?.focus(); }
      else feedback(result.kind === 'format' ? format.textContent + ' Проверь требуемую запись в условии.' : result.message || 'Пока ответ не совпал. Проверь, что спрашивается, или открой помощь.',result.kind);
    });
    context.host.append(form);
    const output = el('p','course-feedback'); output.id = 'completion-feedback'; output.setAttribute('role','status'); output.setAttribute('aria-live','polite');
    if (entry.skipped) output.textContent = 'Задача отложена. В результате будет ссылка на подходящий урок.';
    else if (entry.solved) output.textContent = 'Числовой ответ верный.';
    context.host.append(output);
    if (entry.solved && item.reason && !entry.skipped) {
      const reasonForm = el('form','completion-reason');
      const fieldset = el('fieldset'); fieldset.append(prose('legend','',item.reason.prompt));
      for (const option of item.reason.options) {
        const choice = el('label','completion-choice'), radio = el('input'); radio.type = 'radio';
        radio.name = 'completion-reason'; radio.value = option.id; radio.checked = entry.reason.choice === option.id;
        radio.disabled = entry.reason.solved;
        radio.addEventListener('change',() => { E.setReason(state,radio.value); save(); });
        choice.append(radio,prose('span','',option.text)); fieldset.append(choice);
      }
      const check = el('button','','Проверить объяснение'); check.type = 'submit'; check.dataset.completionAction = 'reason'; check.disabled = entry.reason.solved;
      reasonForm.append(fieldset,check);
      reasonForm.addEventListener('submit',event => {
        event.preventDefault(); const result = E.submit(state,bank(),checkAnswer,{field:'reason'}); save();
        if (result.kind === 'correct') { rerender(); feedback('Выбрано верное объяснение. Попробуй пересказать его своими словами.','correct');
          context.host.querySelector('[data-completion-action="next"]')?.focus(); }
        else feedback(result.message || 'Проверь смысл чисел в условии. Можно открыть разбор.',result.kind);
      });
      context.host.append(reasonForm);
    }
    context.host.append(helpSection(item,entry));
    const actions = el('div','course-actions');
    if (entry.skipped || (entry.solved && entry.reason.solved)) {
      actions.append(button(session.cursor + 1 === session.itemIds.length ? 'Посмотреть результат →' : 'Следующая задача →','next',() => { E.next(state,bank()); save(); rerender(true); },true));
    } else actions.append(button('Пока не знаю — отложить','skip',() => { E.skip(state); save(); rerender(); }));
    if (item.lessonId) {
      const helpLink = link('Открыть объяснение в уроке →','#course-' + item.lessonId);
      helpLink.addEventListener('click',() => { E.useHelp(state,'hint'); save(); });
      actions.append(helpLink);
    }
    actions.append(link('Пауза · к курсам','#courses'));
    context.host.append(actions,el('p','course-start-note','Любую проверку можно продолжить позже: очередь задач и черновик останутся на месте.'));
  }
  function resultPage(mode) {
    const report = E.summary(state,bank(),mode);
    heading(mode === 'placement' ? 'Твой следующий шаг' : 'Работа сохранена',titles[mode]);
    const box = el('section','course-result');
    box.append(el('h3','','Что получилось в этой работе'),
      el('p','','Верных числовых ответов: ' + report.correct + ' из ' + report.total + '. Из них после исправления: ' + report.corrected + '.'),
      el('p','','Новых условий с первым верным ответом без открытой помощи: ' + report.independent + '.'),
      el('p','','Задач с помощью: ' + report.helped + '. Отложено: ' + report.skipped + '. Знакомых условий: ' + report.familiar + '.'));
    if (report.reasonTotal) box.append(el('p','','Верных выбранных объяснений: ' + report.reasonCorrect + ' из ' + report.reasonTotal + '. Объяснений с первого раза без помощи: ' + report.reasonIndependent + '.'));
    box.append(el('p','course-start-note','Числовой ответ и выбор объяснения учитываются отдельно. Это результат конкретных задач, а не доказательство устойчивого владения всей арифметикой.'));
    context.host.append(box);
    const recommendations = report.recommendedLessonIds.filter(id => context.lessons.some(lesson => lesson.id === id));
    const next = el('section','completion-recommendations'); next.append(el('h3','',recommendations.length ? 'К чему полезно вернуться' : 'Можно двигаться дальше'));
    if (recommendations.length) {
      const list = el('ul');
      for (const id of recommendations) {
        const lesson = context.lessons.find(value => value.id === id), li = el('li'); li.append(link(lesson.title + ' →','#course-' + id)); list.append(li);
      }
      next.append(list,el('p','','Выбери одну тему, разбери пример и затем вернись к смешанным задачам.'));
    } else next.append(el('p','', mode === 'placement' ? 'В этих восьми задачах затруднений не осталось. Выбери ещё не изученные связующие темы или попробуй итоговую работу.' : 'Ответы этой работы разобраны. Попробуй объяснить одно решение своими словами и придумать похожую задачу с другими числами.'));
    context.host.append(next);
    const details = el('details','completion-record'); details.append(el('summary','','Мои ответы и помощь'));
    for (const row of report.results) {
      const item = bank().items.find(value => value.id === row.id), part = el('section');
      part.append(prose('h3','',item.prompt),el('p','','Первый числовой ответ: ' + (row.firstInput === null ? 'не дан' : row.firstInput) + '. ' + (row.firstHelpUsed ? 'До него была открыта помощь.' : row.firstCorrect === null ? '' : 'До него помощь не открывалась.')),
        el('p','','Текущий ответ: ' + (row.input || 'не дан') + '. ' + (row.skipped ? 'Задача отложена.' : row.complete ? 'Решение завершено.' : 'Объяснение ещё не завершено.')));
      const solution = el('details'); solution.append(el('summary','','Разобрать решение'),prose('p','',item.explanation)); part.append(solution); details.append(part);
    }
    context.host.append(details);
    const actions = el('div','course-actions'); actions.append(link('К маршруту →','#courses','course-primary'));
    if (mode === 'placement') actions.append(link('Связываем навыки','#courses-connections'),link('Попробовать итоговую работу','#course-check-final'));
    actions.append(button(mode === 'review' ? 'Следующий короткий повтор' : mode === 'placement' ? 'Ещё 8 входных задач' : 'Повторить эти условия как тренировку','repeat',() => launch(mode)));
    context.host.append(actions);
  }
  function render(ctx) {
    context = ctx; initialize();
    const {host,mode} = context;
    host.replaceChildren(); host.dataset.courseView = 'completion'; host.dataset.completionMode = mode;
    delete host.dataset.courseLesson; delete host.dataset.coursePhase; delete host.dataset.completionItem;
    const trail = el('nav','course-breadcrumb'); trail.setAttribute('aria-label','Путь в курсе');
    trail.append(link('Все курсы','#courses'),el('span','','›'),el('strong','',titles[mode]));
    const message = el('p','course-save-note completion-save-note',note || 'Ответы и черновик сохраняются в этом браузере. Можно прерваться и продолжить.'); message.setAttribute('role','status');
    host.append(trail,message);
    const session = state.sessions[mode];
    if (!session) return welcome(mode);
    state.active = mode;
    if (session.completedAt !== null) return resultPage(mode);
    const entry = E.current(state), item = bank().items.find(value => value.id === entry?.id);
    if (entry && item) exercise(mode,session,entry,item); else welcome(mode);
  }
  function resumeLinks(lessons, courseState) {
    context = {...context,lessons,courseState}; initialize();
    return Object.entries(state.sessions).filter(([,session]) => session && session.completedAt === null)
      .map(([mode,session]) => ({href:'#course-check-' + mode, text:'Продолжить: ' + titles[mode] + ' · задача ' + (session.cursor + 1) + ' из ' + session.itemIds.length}));
  }
  function lessonOpened(ctx) {
    context = {...context,...ctx}; initialize();
    if (E.useLessonHelp(state,ctx.lessonId,bank())) save();
  }
  window.ArzhenikovCompletion = {render,resumeLinks,lessonOpened};
})();
