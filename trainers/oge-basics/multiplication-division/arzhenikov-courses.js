/* Guided courses inside the existing offline Arzhenikov workshop. */
(() => {
  'use strict';
  const host = document.getElementById('arz-courses');
  const E = window.ArzhenikovCourseEngine;
  const tracks = [window.ArzhenikovCourseArithmetic, window.ArzhenikovCourseWritten,
    window.ArzhenikovCourseFractions, window.ArzhenikovCourseDecimals,
    window.ArzhenikovCourseConnections,
    window.ArzhenikovCourseAlgebra, window.ArzhenikovCourseGeometry].filter(Boolean);
  if (!host || !E || tracks.length < 3) return;
  const lessons = tracks.flatMap(track => track.lessons);
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const trackOf = lesson => tracks.find(track => track.lessons.includes(lesson));
  let state = E.fresh(), storageOK = true, storageNote = '', lastRoute = '';
  try {
    const raw = localStorage.getItem(E.key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.lessons || typeof parsed.lessons !== 'object' || Array.isArray(parsed.lessons)) throw new Error('unreadable course record');
      state = E.normalize(parsed, lessons);
    }
  } catch {
    storageOK = false;
    storageNote = 'Не удалось прочитать сохранение. Сейчас работа остаётся только в этой вкладке; прежняя запись сохранена без изменений.';
  }
  const el = (tag, cls, text) => {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const link = (text, href, cls = '') => { const a = el('a', cls, text); a.href = href; return a; };
  function button(text, action, handler, primary = false) {
    const b = el('button', primary ? 'course-primary' : '', text);
    b.type = 'button'; b.dataset.courseAction = action; b.addEventListener('click', handler); return b;
  }
  function save() {
    const active = host.dataset.courseLesson;
    if (byId.has(active) && state.lessons[active]) state.active = active;
    if (!storageOK) return;
    try { localStorage.setItem(E.key, JSON.stringify(state)); }
    catch { storageOK = false; storageNote = 'Браузер не разрешил сохранить работу. Можно продолжать в этой вкладке, но после её закрытия новые ответы могут потеряться.'; }
    document.querySelectorAll('.course-save-note').forEach(node => { node.textContent = storageNote || 'Прогресс сохраняется в этом браузере. Регистрация не нужна.'; });
    window.dispatchEvent(new CustomEvent('courses-progress'));
  }
  function obtain(lesson) {
    state.active = lesson.id;
    if (!state.lessons[lesson.id]) state.lessons[lesson.id] = E.record();
    return state.lessons[lesson.id];
  }
  function draftFor(lesson, rec, index) {
    const task = lesson.tasks[index];
    if (!rec.tasks[task.id]) rec.tasks[task.id] = E.taskRecord(task);
    return rec.tasks[task.id];
  }
  function feedback(message, kind = '') {
    const output = host.querySelector('#course-feedback');
    if (output) { output.textContent = message; output.dataset.kind = kind; }
  }
  const hrefLesson = lesson => '#course-' + lesson.id;
  const courseRoute = () => location.hash === '#courses' ||
    tracks.some(track => location.hash === '#courses-' + track.id) || location.hash.startsWith('#course-');
  let navigatorOrigin = null;
  function placeNavigator() {
    // Reuse the public navigator and its focus/dialog handlers. Only this
    // courses and spatial map use the header; older games keep their launcher.
    if (!document.body.classList.contains('arz-adventure')) return;
    const navigator = document.getElementById('maxexam-public-assistant');
    const menu = document.querySelector('body.arz-adventure > header nav');
    if (!navigator?.shadowRoot || !menu) return;
    if (!navigatorOrigin) navigatorOrigin = {parent: navigator.parentNode, next: navigator.nextSibling};
    const focused = document.activeElement === navigator ? navigator.shadowRoot.activeElement : null;
    if (courseRoute() || location.hash === '#journey' || location.hash.startsWith('#journey-')) {
      if (!navigator.shadowRoot.querySelector('[data-arzhenikov-course-navigation]')) {
        const style = document.createElement('style'); style.dataset.arzhenikovCourseNavigation = '';
        style.textContent =
          ':host([data-course-navigation]){display:inline-flex!important;position:static!important;contain:none!important;min-height:0!important;min-width:0;max-width:100%;align-self:center}' +
          ':host([data-course-navigation]) .launcher{position:static;inset:auto;z-index:auto;display:flex;width:auto;height:auto;min-height:44px;max-width:100%;padding:8px 12px;gap:8px;border-radius:12px;box-shadow:none}' +
          ':host([data-course-navigation]) .launcher-mark{width:24px;height:24px;flex:0 0 24px;font-size:20px}' +
          ':host([data-course-navigation]) .launcher-label{position:static;display:block;width:auto;height:auto;overflow:visible;clip-path:none;white-space:normal;line-height:1.3}' +
          ':host([data-course-navigation]) .launcher-label strong{font-size:16px}' +
          ':host([data-course-navigation]) .launcher-label>span{display:none}';
        navigator.shadowRoot.append(style);
      }
      navigator.dataset.courseNavigation = 'true';
      if (navigator.parentNode !== menu) menu.append(navigator);
    } else {
      navigator.removeAttribute('data-course-navigation');
      if (navigator.parentNode !== navigatorOrigin.parent && navigatorOrigin.parent?.isConnected) {
        const next = navigatorOrigin.next?.parentNode === navigatorOrigin.parent ? navigatorOrigin.next : null;
        navigatorOrigin.parent.insertBefore(navigator, next);
      }
    }
    if (focused && focused.isConnected) focused.focus({preventScroll: true});
  }
  const status = lesson => {
    const rec = state.lessons[lesson.id];
    return rec?.reviewedAt ? 'Урок и новая проверка завершены' : rec?.completedAt ? 'Урок пройден · есть новая проверка' : rec && rec.phase !== 'intro' ? 'Можно продолжить' : 'Начать';
  };
  function shell(trail) {
    host.replaceChildren();
    delete host.dataset.completionMode; delete host.dataset.completionItem;
    const nav = el('nav', 'course-breadcrumb'); nav.setAttribute('aria-label', 'Путь в курсе');
    nav.append(link('Все курсы', '#courses'));
    for (const [name, href] of trail) { nav.append(el('span', '', '›'), href ? link(name, href) : el('strong', '', name)); }
    host.append(nav);
    const note = el('p', 'course-save-note', storageNote || 'Прогресс сохраняется в этом браузере. Регистрация не нужна.');
    note.setAttribute('role', 'status');
    host.append(note);
  }
  function heading(title, kicker) {
    if (kicker) host.append(el('p', 'course-eyebrow', kicker));
    const h = el('h2', 'course-title', title); h.id = 'course-heading'; h.tabIndex = -1; host.append(h); return h;
  }
  function summaryText(track) {
    const done = track.lessons.filter(l => state.lessons[l.id]?.completedAt).length;
    return done + ' из ' + track.lessons.length + ' уроков пройдено';
  }
  function overview() {
    host.dataset.courseView = 'overview'; delete host.dataset.courseLesson; delete host.dataset.coursePhase;
    shell([]); heading('От действия — к уверенным вычислениям', 'Связный маршрут · ' + lessons.length + ' уроков');
    host.append(el('p', 'course-lead', 'Начни с понятного действия. Перейди к записи, потренируйся и проверь себя на новых числах. Основы, деление уголком и оба вида дробей ведут к алгебре и геометрии.'));
    const map = link('Открыть карту навыков с приближением →', '#journey', 'course-continue');
    host.append(map);
    const active = byId.get(state.active);
    const unfinished = active && state.lessons[active.id]?.phase !== 'summary' ? active :
      lessons.find(lesson => state.lessons[lesson.id]?.visits && state.lessons[lesson.id]?.phase !== 'summary');
    if (unfinished) {
      host.append(link('Продолжить: ' + unfinished.title + ' →', hrefLesson(unfinished), 'course-continue'));
    } else if (active) {
      const next = lessons.slice(lessons.indexOf(active) + 1).find(lesson => !state.lessons[lesson.id]?.completedAt);
      if (next) host.append(link('Следующий шаг: ' + next.title + ' →', hrefLesson(next), 'course-continue'));
    }
    for (const pending of window.ArzhenikovCompletion?.resumeLinks(lessons,state) || []) host.append(link(pending.text,pending.href,'course-continue'));
    const checkpoints = el('nav','completion-path'); checkpoints.setAttribute('aria-label','Вход, повторение и итог курса');
    for (const [mode,title,description] of [
      ['placement','С чего мне начать?','8 задач помогут выбрать подходящие уроки.'],
      ['review','Повторить изученное','До 6 задач только из начатых тем.'],
      ['final','Применить всё вместе','16 новых ситуаций: выбери способ сам.']
    ]) {
      const card = link('','#course-check-' + mode); card.append(el('strong','',title),el('span','',description)); checkpoints.append(card);
    }
    host.append(checkpoints);
    const route = el('nav', 'course-method-route'); route.setAttribute('aria-label', 'Последовательность арифметики');
    for (const [id, title] of [['arithmetic', '1. Числа и действия'], ['written', '2. Деление уголком'],
      ['fractions', '3. Обыкновенные дроби'], ['decimals', '4. Десятичные дроби'], ['connections','5. Связываем навыки']]) {
      if (tracks.some(track => track.id === id)) route.append(link(title, '#courses-' + id));
    }
    host.append(route, el('p', 'course-start-note', 'Можно начать с нужного места. Если действия с целыми уже знакомы, сразу выбери деление или дроби. Внутри урока есть возврат к необходимому навыку.'));
    const cards = el('div', 'course-track-grid');
    for (const [index, track] of tracks.entries()) {
      const card = link('', '#courses-' + track.id, 'course-track-card'); card.dataset.track = track.id;
      card.append(el('span', 'course-track-symbol', {arithmetic:'1 · 2 · 3', written:'824 : 4', fractions:'½ · ¾', decimals:'0,1 · 0,01', connections:'½ = 50%', algebra:'x + 3', geometry:'△ □'}[track.id]),
        el('span', 'course-eyebrow', track.lessons.length + ' уроков'), el('h3', '', track.title),
        el('p', '', track.description), el('strong', 'course-track-progress', summaryText(track)), el('span', 'course-card-link', 'Выбрать урок →'));
      cards.append(card);
    }
    host.append(cards);
    const note = el('section', 'course-method-note');
    note.append(el('h3', '', 'Сначала предметы. Затем запись.'),
      el('p', '', 'Урок начинается с примера и наглядной модели. После тренировки попробуй новые числа, затем выбери объяснение. Пошаговые проверки показывают выполнение способа. В отдельной итоговой работе нужно выбрать способ самому. Ошибку можно исправить, а подсказку — открыть в любой момент.'),
      el('p', '', 'Одна и та же величина связывает предмет, рисунок, дробь и запись вычисления. После двух задач с моделью идут тренировка, две проверочные задачи и выбор объяснения. Затем можно решить ещё две новые задачи. Помощь и первый ответ учитываются отдельно.'),
      el('p', '', 'Эти занятия созданы MathExam по мотивам практического подхода К. П. Арженикова. Исторические задачники задают ориентир; истории и интерактивные модели разработаны для современных учеников. Алгебра и геометрия здесь остаются вводными курсами.'),
      link('Как пройти цельный курс', '#course-methodology'), el('span', '', ' · '),
      link('Об Арженикове и источниках', '#arzhenikov-about'), el('span', '', ' · '),
      link('Скачать все занятия для работы без интернета', 'arzhenikov-offline.zip'));
    host.append(note);
  }
  function trackPage(track) {
    host.dataset.courseView = 'track'; delete host.dataset.courseLesson; delete host.dataset.coursePhase;
    shell([[track.title]]); heading(track.title, track.subtitle); host.append(el('p', 'course-lead', track.description));
    if (['written','fractions','decimals'].includes(track.id)) {
      const source = el('details', 'course-physical');
      source.append(el('summary', '', 'Методика и первоисточник'));
      source.append(el('p', '', track.id === 'written'
        ? 'Предметное деление связываем с разрядами и записью уголком. В задачнике Арженикова, часть III (1924), на с. 24 показано письменное деление с нулём в частном. Здесь каждый промежуточный шаг записывает ученик.'
        : track.id === 'fractions'
          ? 'От равных частей переходим к равным дробям, общему знаменателю и четырём действиям. Исторический ориентир — часть IV задачника Арженикова (1924), с. 5–33.'
          : 'Метрические меры помогают увидеть десятые, сотые и тысячные, затем объяснить четыре действия и переход между видами дробей. Исторический ориентир — часть IV задачника Арженикова (1924), с. 52–71.'));
      const a = link('Открыть первоисточник ↗', track.id === 'written' ? 'https://djvu.online/file/Zmmk0C6Gqh83D' : 'https://djvu.online/file/AIsMeWPu7uz8w');
      a.target = '_blank'; a.rel = 'noopener'; source.append(a); host.append(source);
    }
    if (track.id === 'connections') {
      const source = el('details','course-physical'); source.append(el('summary','','Методика и первоисточники'));
      source.append(el('p','','Дробь как частное, равные доли, измерения и житейская задача связывают способы вычисления. Новые условия и проверки — адаптация MathExam; страницы ниже показывают историческую опору каждого урока.'));
      const list = el('ul');
      for (const item of track.sources) {
        const row = el('li'), a = link(item.title + ' · ' + item.pages + ' ↗',item.href);
        a.target = '_blank'; a.rel = 'noopener'; row.append(a); list.append(row);
      }
      source.append(list); host.append(source);
    }
    const meter = el('div', 'course-track-meter');
    meter.append(el('strong', '', summaryText(track)));
    const bar = el('progress'); bar.max = track.lessons.length; bar.value = track.lessons.filter(l => state.lessons[l.id]?.completedAt).length;
    bar.setAttribute('aria-label', 'Пройденные уроки курса'); meter.append(bar); host.append(meter);
    for (const band of track.bands) {
      const section = el('section', 'course-band');
      section.append(el('h3', '', band.title), el('p', 'course-band-note', band.description));
      const list = el('ol', 'course-lesson-list');
      for (const lesson of track.lessons.filter(l => l.band === band.id)) {
        const li = el('li'), a = link('', hrefLesson(lesson), 'course-lesson-card');
        const num = el('span', 'course-lesson-number', String(track.lessons.indexOf(lesson) + 1)); num.setAttribute('aria-hidden', 'true');
        const content = el('span'); content.append(el('strong', '', lesson.title), el('span', 'course-lesson-goal', lesson.goal), el('small', 'course-lesson-status', status(lesson)));
        a.append(num, content); li.append(a); list.append(li);
      }
      section.append(list); host.append(section);
    }
    host.append(link('← Пространственная карта навыков', ['written','fractions','decimals'].includes(track.id) ? '#journey-' + track.id : '#journey', 'course-return'));
  }
  function lessonHeader(lesson, phase) {
    window.ArzhenikovCompletion?.lessonOpened({host,lessons,courseState:state,lessonId:lesson.id});
    const track = trackOf(lesson);
    host.dataset.courseView = 'lesson'; host.dataset.courseLesson = lesson.id; host.dataset.coursePhase = phase;
    shell([[track.title, '#courses-' + track.id], [lesson.title]]);
    heading(lesson.title, 'Урок ' + (track.lessons.indexOf(lesson) + 1) + ' из ' + track.lessons.length);
    const stages = el('ol', 'course-stages'); stages.setAttribute('aria-label', 'Шаги занятия');
    const rec = state.lessons[lesson.id];
    const stage = phase === 'intro' ? 0 : phase === 'task' ? (rec.cycle || rec.cursor >= 4 ? 2 : 1) : 3;
    ['Разберись', 'Действуй и решай', 'Проверь себя', 'Объясни'].forEach((name, i) => {
      const li = el('li', '', name); if (i === stage) li.setAttribute('aria-current', 'step'); stages.append(li);
    });
    host.append(stages);
  }
  function intro(lesson) {
    lessonHeader(lesson, 'intro');
    host.append(el('p', 'course-goal', lesson.goal), el('p', 'course-lead', lesson.intro));
    const example = el('section', 'course-example');
    example.append(el('h3', '', 'Разберём вместе'), el('p', '', lesson.worked.problem),
      el('p', 'course-equation', lesson.worked.expression), el('p', '', lesson.worked.explanation));
    host.append(example, el('p', 'course-rule', lesson.rule));
    const actions = el('div', 'course-actions');
    actions.append(button('Попробовать самому →', 'start', () => {
      const rec = obtain(lesson); rec.phase = 'task'; rec.visits += 1;
      draftFor(lesson, rec, E.order(rec)[rec.cursor]); save(); render(true);
    }, true)); host.append(actions);
    if (lesson.prerequisites.length) {
      const earlier = el('p', 'course-prerequisites', 'Если пока трудно, начни с темы: ');
      for (const [i, id] of lesson.prerequisites.entries()) {
        if (i) earlier.append(el('span', '', ' · '));
        if (byId.has(id)) earlier.append(link(byId.get(id).title, hrefLesson(byId.get(id))));
      }
      host.append(earlier);
    }
    physical(lesson);
    const support = {
      'a-add-hundred':['Письменное сложение и перенос разряда','arithmetic-foundations.html'],
      'a-sub-hundred':['Письменное вычитание и размен разряда','arithmetic-foundations.html'],
      'w-subtract':['Вычитание через нули','arithmetic-foundations.html'],
      'w-multiply':['Письменное умножение','course-column-one-digit.html'],
      'd-multiply':['Умножение столбиком на целых числах','course-column-two-digit.html']
    }[lesson.id];
    if (support) host.append(link('Дополнительная практика: ' + support[0] + ' →',support[1],'course-return'));
    for (const pending of window.ArzhenikovCompletion?.resumeLinks(lessons,state) || []) host.append(link(pending.text,pending.href,'course-return'));
  }
  function physical(lesson) {
    const details = el('details', 'course-physical');
    details.append(el('summary', '', 'Попробуй с настоящими предметами'), el('p', '', lesson.physical)); host.append(details);
  }
  function svgNode(tag, attrs, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function draw(model, values, container, solved = false) {
    if (window.ArzhenikovCourseNumbers?.draw(model, values, container)) return;
    container.replaceChildren();
    const description = el('p', 'course-model-description');
    const m = model.meta || {}, v = values;
    if (model.kind === 'groups') {
      const grid = el('div', 'course-groups');
      for (let g = 0; g < v.groups; g++) {
        const group = el('div', 'course-object-group'); group.setAttribute('aria-label', 'Группа ' + (g + 1) + ': ' + v.size + ' предметов');
        const count = el('span', 'course-group-label', 'Группа ' + (g + 1)); group.append(count);
        for (let i = 0; i < v.size; i++) { const dot = el('span', 'course-token'); dot.setAttribute('aria-hidden', 'true'); group.append(dot); }
        grid.append(group);
      }
      const groupWord = v.groups === 1 ? 'группа' : v.groups >= 2 && v.groups <= 4 ? 'группы' : 'групп';
      description.textContent = v.groups + ' ' + groupWord + ', в каждой по ' + v.size + '. Всего в группах: ' + v.groups * v.size + '.';
      if (Number.isFinite(m.stock)) {
        const rest = m.stock - v.groups * v.size;
        description.textContent += rest >= 0 ? ' Было ' + m.stock + '; вне полных групп: ' + rest + '.' : ' Предметов нужно больше, чем есть. Уменьши число полных групп.';
        if (rest >= 0 && rest <= 30) {
          const left = el('div', 'course-leftovers'); left.append(el('strong', '', 'Осталось: ' + rest));
          for (let i = 0; i < rest; i++) { const dot = el('span', 'course-token'); dot.setAttribute('aria-hidden', 'true'); left.append(dot); }
          grid.append(left);
        }
      }
      container.append(grid, description); return;
    }
    if (model.kind === 'place') {
      const places = el('div', 'course-places');
      for (const [id, name, value] of [['hundreds', 'Сотни', 100], ['tens', 'Десятки', 10], ['ones', 'Единицы', 1]]) {
        const part = el('div', 'course-place'); part.append(el('strong', '', name), el('b', '', String(v[id] || 0)), el('span', '', '× ' + value)); places.append(part);
      }
      description.textContent = 'Число: ' + ((v.hundreds || 0) * 100 + (v.tens || 0) * 10 + (v.ones || 0)) + '.';
      container.append(places, description); return;
    }
    if (model.kind === 'fraction') {
      const strip = el('div', 'course-fraction'); strip.style.setProperty('--parts', v.parts);
      for (let n = 0; n < v.parts; n++) { const cell = el('span', n < v.shaded ? 'is-shaded' : ''); cell.setAttribute('aria-hidden', 'true'); strip.append(cell); }
      description.textContent = 'Равных частей в целом: ' + v.parts + '. Выделено: ' + v.shaded + ' из ' + v.parts + '.';
      container.append(strip, description); return;
    }
    const svg = svgNode('svg', {viewBox: '0 0 360 230', role: 'img', 'aria-label': model.caption});
    const line = (x1, y1, x2, y2, cls = '') => svg.append(svgNode('line', {x1, y1, x2, y2, class: cls || 'course-svg-line'}));
    const text = (x, y, value, attrs = {}) => svg.append(svgNode('text', {x, y, 'text-anchor': 'middle', 'font-size': 19, ...attrs}, value));
    const square = (x, y, size = 12) => svg.append(svgNode('path', {d: `M ${x + size} ${y} v ${size} h ${-size}`, class: 'course-right-angle', 'data-course-right-angle': 'true'}));
    if (model.kind === 'line') {
      const end = v.start + v.move;
      let low = Math.min(0, v.start, end), high = Math.max(10, v.start, end);
      if (high === low) high += 10;
      const maxTicks = Math.max(Math.abs(low), Math.abs(high)) >= 100 ? 7 : 10;
      const desired = (high - low) / maxTicks;
      const step = [1, 2, 5, 10, 20, 50, 100, 200, 500].find(n => n >= desired) || Math.ceil(desired / 100) * 100;
      low = Math.floor(low / step) * step; high = Math.ceil(high / step) * step;
      const x = n => 25 + (n - low) / (high - low) * 310;
      line(20, 150, 340, 150);
      for (let n = low; n <= high; n += step) { line(x(n), 145, x(n), 155); text(x(n), 178, n, {'font-size': 20}); }
      svg.append(svgNode('path', {d: `M ${x(v.start)} 145 Q ${(x(v.start) + x(end)) / 2} 35 ${x(end)} 145`, class: 'course-svg-jump'}));
      svg.append(svgNode('circle', {cx: x(v.start), cy: 150, r: 5, class: 'course-svg-start'}));
      svg.append(svgNode('circle', {cx: x(end), cy: 150, r: 7, class: 'course-svg-end'}));
      const unit = m.unit ? ' ' + m.unit : '';
      text(180, 40, 'Начало ' + v.start + unit + ' · шаг ' + (v.move >= 0 ? '+' : '') + v.move + unit, {'font-size': 17});
      description.textContent = 'От ' + v.start + unit + ' двигаемся ' + (v.move < 0 ? 'влево' : 'вправо') + ' на ' + Math.abs(v.move) + unit + '. Получается ' + end + unit + '.' + (m.unit ? ' Это схема, а не линейка в натуральную величину.' : '');
    } else if (model.kind === 'balance') {
      const left = m.a * v.x + m.b, right = m.c;
      const tilt = left === right ? 0 : left > right ? 12 : -12;
      svg.append(svgNode('path', {d: 'M 160 190 L 180 125 L 200 190 Z', class: 'course-svg-support'}));
      line(65, 100 + tilt, 295, 100 - tilt);
      for (const [x, y, value] of [[75, 110 + tilt, left], [285, 110 - tilt, right]]) {
        line(x, y - 12, x, y + 35);
        svg.append(svgNode('path', {d: `M ${x - 43} ${y + 35} q 43 35 86 0`, class: 'course-svg-line'}));
        text(x, y + 26, value);
      }
      text(180, 35, 'x = ' + v.x);
      const expression = m.a === -1 ? m.b + ' − x' : (m.a === 1 ? 'x' : m.a + ' · x') +
        (m.b === 0 ? '' : m.b < 0 ? ' − ' + Math.abs(m.b) : ' + ' + m.b);
      text(90, 75, expression, {'font-size': 16});
      text(285, 75, String(m.c), {'font-size': 16});
      description.textContent = 'Слева ' + left + ', справа ' + right + '. ' + (left === right ? 'Равенство выполнено.' : 'Равенство пока не выполнено.');
    } else if (model.kind === 'rectangle') {
      const unit = Math.min(27, 280 / v.width, 135 / v.height), width = unit * v.width, height = unit * v.height;
      const x = (360 - width) / 2, y = (205 - height) / 2;
      for (let c = 0; c <= v.width; c++) line(x + c * unit, y, x + c * unit, y + height, 'course-svg-grid');
      for (let r = 0; r <= v.height; r++) line(x, y + r * unit, x + width, y + r * unit, 'course-svg-grid');
      svg.append(svgNode('rect', {x, y, width, height, class: 'course-svg-outline'}));
      square(x, y, Math.min(9, unit / 2));
      text(180, y + height + 25, v.width + ' ' + (m.unit || 'ед.'));
      text(Math.max(22, x - 22), y + height / 2 + 5, v.height, {'font-size': 16});
      description.textContent = 'Прямоугольник: ' + v.width + ' на ' + v.height + '. Каждая клетка — одна квадратная единица; стороны измерены в единицах длины.';
    } else if (model.kind === 'segments') {
      const unit = 300 / Math.max(1, v.a + v.b), x = 30, mid = x + v.a * unit, end = x + (v.a + v.b) * unit;
      line(x, 120, mid, 120, 'course-svg-first'); line(mid, 120, end, 120, 'course-svg-second');
      for (const [point, name] of [[x, 'A'], [mid, 'B'], [end, 'C']]) { svg.append(svgNode('circle', {cx: point, cy: 120, r: 4, class: 'course-svg-start'})); text(point, 153, name); }
      text((x + mid) / 2, 95, v.a); text((mid + end) / 2, 95, v.b);
      description.textContent = 'B находится между A и C. AB = ' + v.a + ', BC = ' + v.b + '. Длина AC равна сумме частей. Схема, не линейка на экране.';
    } else if (model.kind === 'angle') {
      const total = m.total || 180, degrees = v.angle, x = 180, y = 190, radius = 130;
      const ray = angle => [x + radius * Math.cos(angle * Math.PI / 180), y - radius * Math.sin(angle * Math.PI / 180)];
      const end = ray(degrees), whole = ray(total);
      line(x, y, x + radius, y); line(x, y, end[0], end[1], 'course-svg-first');
      if (m.total) line(x, y, whole[0], whole[1], 'course-svg-second');
      if (degrees === 90 || total === 90) svg.append(svgNode('path', {d: `M ${x + 14} ${y} v -14 h -14`, class: 'course-right-angle', 'data-course-right-angle': 'true'}));
      text(180, 25, degrees + '°');
      if (m.total) text(180, 50, 'Целый: ' + total + '°', {'font-size': 15});
      description.textContent = 'Выбран угол ' + degrees + '°.' + (m.total ? ' До угла ' + total + '° остаётся ' + (total - degrees) + '°.' : '');
    } else if (model.kind === 'triangle') {
      const a = v.alpha * Math.PI / 180, b = v.beta * Math.PI / 180, gamma = 180 - v.alpha - v.beta;
      const raw = [[0, 0], [1, 0], [Math.sin(b) / Math.sin(a + b) * Math.cos(a), -Math.sin(b) / Math.sin(a + b) * Math.sin(a)]];
      const minX = Math.min(...raw.map(p => p[0])), maxX = Math.max(...raw.map(p => p[0]));
      const minY = Math.min(...raw.map(p => p[1]));
      const scale = Math.min(270 / (maxX - minX), 135 / Math.max(.01, -minY));
      const points = raw.map(p => [45 + (p[0] - minX) * scale, 185 + p[1] * scale]);
      svg.append(svgNode('polygon', {points: points.map(p => p.join(',')).join(' '), class: 'course-svg-outline'}));
      const degrees = [v.alpha, v.beta, gamma];
      points.forEach((p, i) => {
        text(p[0], p[1] + (i === 2 ? -15 : 24), i === 2 && !solved ? '?' : degrees[i] + '°', {'font-size': 17});
        if (degrees[i] === 90 && (i < 2 || solved)) {
          const q = points[(i + 1) % 3], r = points[(i + 2) % 3];
          const u = [(q[0] - p[0]) / Math.hypot(q[0] - p[0], q[1] - p[1]), (q[1] - p[1]) / Math.hypot(q[0] - p[0], q[1] - p[1])];
          const w = [(r[0] - p[0]) / Math.hypot(r[0] - p[0], r[1] - p[1]), (r[1] - p[1]) / Math.hypot(r[0] - p[0], r[1] - p[1])];
          const size = 10;
          svg.append(svgNode('polyline', {points: [[p[0] + u[0] * size, p[1] + u[1] * size], [p[0] + (u[0] + w[0]) * size, p[1] + (u[1] + w[1]) * size], [p[0] + w[0] * size, p[1] + w[1] * size]].map(p => p.join(',')).join(' '), class: 'course-right-angle', 'data-course-right-angle': 'true'}));
        }
      });
      description.textContent = 'Два угла треугольника: ' + v.alpha + '° и ' + v.beta + '°. Третий дополняет их сумму до 180°.';
    }
    container.append(svg, description);
  }
  function modelPanel(task, draft, required, locked) {
    const panel = el('section', 'course-model'); panel.dataset.courseModelKind = task.model.kind;
    panel.append(el('h3', '', required ? 'Покажи условие на модели' : 'Модель в помощь'), el('p', '', task.model.caption));
    const picture = el('div', 'course-model-picture');
    const controls = el('div', 'course-model-controls');
    const redraw = () => draw(task.model, draft.model, picture, draft.solved);
    for (const control of task.model.controls) {
      const group = el('div', 'course-model-control'), label = el('label', '', control.label);
      const input = el('input'); input.type = 'number'; input.min = control.min; input.max = control.max; input.step = control.step;
      input.id = 'course-model-' + control.id; input.value = draft.model[control.id]; input.dataset.courseControl = control.id;
      const fixed = control.min === control.max;
      input.disabled = locked || fixed; label.htmlFor = input.id;
      function change(value) {
        if (locked || !Number.isFinite(value)) return;
        const next = {...draft.model, [control.id]: value};
        if (!E.valuesValid(task.model, next)) {
          input.value = draft.model[control.id];
          feedback(task.model.kind === 'triangle' ? 'Сумма двух углов должна быть меньше 180°. Попробуй меньшее значение.' : task.model.kind === 'fraction' ? 'Число выделенных частей не может быть больше числа всех частей.' : 'Выбери значение в пределах, указанных у поля.'); return;
        }
        if (draft.model[control.id] !== value) draft.moves += 1;
        draft.model = next; draft.modelReady = false; input.value = value;
        less.disabled = value <= control.min; more.disabled = value >= control.max;
        save(); redraw();
        if (required) {
          for (const selector of ['#course-answer', '#course-step-answer', '[data-course-action="check-answer"]', '[data-course-action="check-step"]']) {
            const field = host.querySelector(selector); if (field) field.disabled = true;
          }
        }
        feedback('');
      }
      input.addEventListener('change', () => change(Number(input.value)));
      const less = button('−', 'model-less', () => change(Number(draft.model[control.id]) - control.step));
      const more = button('+', 'model-more', () => change(Number(draft.model[control.id]) + control.step));
      for (const [buttonNode, delta, verb] of [[less, -1, 'Уменьшить'], [more, 1, 'Увеличить']]) {
        buttonNode.dataset.courseDelta = delta; buttonNode.dataset.courseControlId = control.id;
        buttonNode.setAttribute('aria-label', verb + ': ' + control.label);
        buttonNode.disabled = locked || fixed || (delta < 0 ? draft.model[control.id] <= control.min : draft.model[control.id] >= control.max);
      }
      const row = el('div', 'course-control-row'); row.append(less, input, more);
      group.append(label, row, el('small', '', fixed ? 'Известно из условия' : 'От ' + control.min + ' до ' + control.max)); controls.append(group);
    }
    panel.append(picture, controls);
    if (required && !locked) {
      const check = button(draft.modelReady ? 'Модель проверена ✓' : 'Проверить модель', 'check-model', () => {
        if (!E.modelMatches(task, draft)) { feedback('Сверь модель с условием: ' + task.model.caption, 'wrong'); return; }
        draft.modelReady = true; save(); render(false);
        feedback('Модель соответствует условию. Теперь запиши ответ.', 'correct');
        (host.querySelector('#course-step-answer') || host.querySelector('#course-answer'))?.focus({preventScroll: true});
      }); panel.append(check);
    }
    redraw(); return panel;
  }
  function taskPage(lesson, rec) {
    const index = E.order(rec)[rec.cursor], task = lesson.tasks[index], draft = draftFor(lesson, rec, index);
    const required = rec.cycle === 0 && index < 2;
    lessonHeader(lesson, 'task');
    const panel = el('section', 'course-task'); panel.dataset.courseTask = task.id; panel.dataset.courseTaskIndex = index;
    const subtitle = index < 2 ? 'Действуем с моделью' : index < 4 ? 'Тренировка' :
      task.steps?.length ? (rec.cycle ? 'Новая проверка по шагам' : 'Проверка по шагам') :
        (rec.cycle ? 'Новая проверка без готового плана' : 'Проверка без готового плана');
    panel.append(el('p', 'course-task-position', subtitle + ' · задание ' + (rec.cursor + 1) + ' из ' + E.order(rec).length));
    panel.append(el('h3', 'course-problem', task.prompt));
    if (index >= 4) panel.append(el('p', 'course-check-note', draft.attempts ? 'Первый ответ на эту задачу уже сохранён. Исправления помогают разобраться.' : 'Попробуй сначала без помощи. Если понадобится подсказка, её можно открыть.'));
    if (required || draft.modelShown) panel.append(modelPanel(task, draft, required, draft.solved));
    const steps = window.ArzhenikovCourseNumbers?.stepsPanel(task, draft, {save, render, disabled: required && !draft.modelReady});
    if (steps) panel.append(steps);
    const form = el('form', 'course-answer-form');
    const label = el('label', '', task.label + (task.unit ? ' (' + task.unit + ')' : ''));
    label.htmlFor = 'course-answer';
    const input = el('input'); input.id = 'course-answer'; input.type = 'text';
    input.inputMode = ['fraction','mixed','comparison'].includes(task.answerFormat) ? 'text' : 'decimal'; input.autocomplete = 'off'; input.maxLength = 40;
    const blocked = (required && !draft.modelReady) || !E.stepsComplete(task, draft);
    input.value = draft.input; input.disabled = blocked; input.readOnly = draft.solved;
    input.setAttribute('aria-describedby', 'course-answer-format course-feedback');
    input.addEventListener('input', () => { draft.input = input.value; save(); input.removeAttribute('aria-invalid'); });
    const submit = el('button', 'course-primary', draft.solved ? 'Ответ принят ✓' : 'Проверить ответ');
    submit.type = 'submit'; submit.dataset.courseAction = 'check-answer'; submit.disabled = draft.solved || blocked;
    const format = el('p', 'course-input-format', E.formatHelp(task)); format.id = 'course-answer-format';
    form.append(label, input, submit, format);
    if (task.answerFormat === 'comparison') {
      const choices = el('div', 'course-comparison-choices');
      for (const sign of ['<', '=', '>']) {
        const choice = button(sign, 'comparison', () => { draft.input = sign; input.value = sign; save(); input.focus(); });
        choice.disabled = blocked || draft.solved; choice.setAttribute('aria-label', {'<':'Меньше', '=':'Равно', '>':'Больше'}[sign]); choices.append(choice);
      }
      form.append(choices);
    }
    form.addEventListener('submit', event => {
      event.preventDefault(); if (draft.solved || blocked) return;
      draft.input = input.value; const result = E.assess(task, draft); save();
      if (result.kind === 'correct') { render(false); feedback(result.message, result.kind); host.querySelector('[data-course-action="next-task"]')?.focus({preventScroll: true}); }
      else { input.setAttribute('aria-invalid', 'true'); feedback(result.message, result.kind); input.focus({preventScroll: true}); }
    });
    panel.append(form);
    const output = el('p', 'course-feedback'); output.id = 'course-feedback'; output.setAttribute('aria-live', 'polite');
    if (draft.solved) { output.textContent = task.explanation; output.dataset.kind = 'correct'; }
    panel.append(output);
    if (!draft.solved) {
      const help = el('div', 'course-help-actions');
      help.append(button('Подсказка', 'hint', () => { draft.hint = true; draft.helpUsed = true; save(); render(false); feedback(task.hint); }));
      if (!required && !draft.modelShown) help.append(button('Показать модель', 'show-model', () => { draft.modelShown = true; draft.helpUsed = true; save(); render(false); }));
      panel.append(help);
      if (draft.hint) panel.append(el('p', 'course-hint', task.hint));
    } else {
      panel.append(button(rec.cursor + 1 === E.order(rec).length ? (rec.cycle ? 'Посмотреть результат →' : 'Объяснить свой выбор →') : 'Следующая задача →', 'next-task', () => {
        if (rec.cursor + 1 < E.order(rec).length) { rec.cursor += 1; draftFor(lesson, rec, E.order(rec)[rec.cursor]); }
        else if (rec.cycle) { rec.reviewedAt = Date.now(); rec.phase = 'summary'; }
        else rec.phase = 'reason';
        save(); render(true);
      }, true));
    }
    host.append(panel);
    if (draft.helpUsed) host.append(el('p', 'course-help-record', 'В этой задаче использована помощь. Это сохранено отдельно от самостоятельных ответов.'));
  }
  function reasonPage(lesson, rec) {
    lessonHeader(lesson, 'reason');
    const form = el('form', 'course-reason');
    const fieldset = el('fieldset'); fieldset.append(el('legend', '', lesson.reason.prompt));
    for (const option of lesson.reason.options) {
      const label = el('label', 'course-choice'), radio = el('input'); radio.type = 'radio'; radio.name = 'course-reason'; radio.value = option.id;
      radio.checked = rec.reason.choice === option.id;
      radio.addEventListener('change', () => { rec.reason.choice = option.id; save(); });
      label.append(radio, el('span', '', option.text)); fieldset.append(label);
    }
    const check = el('button', 'course-primary', 'Проверить объяснение'); check.type = 'submit'; check.dataset.courseAction = 'check-reason';
    const output = el('p', 'course-feedback'); output.id = 'course-feedback'; output.setAttribute('aria-live', 'polite');
    form.append(fieldset, check, output);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!rec.reason.choice) { feedback('Выбери объяснение, с которым согласен.'); return; }
      if (rec.reason.choice !== lesson.reason.answer) {
        rec.reason.wrong += 1; save(); feedback('Проверь выбранную мысль на разобранном примере: ' + lesson.worked.expression + '. Какое объяснение подходит к действию?', 'wrong'); return;
      }
      rec.reason.passed = true; rec.completedAt = rec.completedAt || Date.now(); rec.phase = 'summary'; save(); render(true);
    }); host.append(form);
  }
  function resultPage(lesson, rec) {
    lessonHeader(lesson, 'summary');
    const box = el('section', 'course-result');
    box.append(el('p', 'course-eyebrow', rec.cycle ? 'Новая проверка завершена' : 'Урок пройден'), el('h3', '', 'Ты выбрал верное объяснение'), el('p', '', lesson.reason.explanation),
      el('p','','Попробуй объяснить решение своими словами. Выбор готового ответа и собственное объяснение — разные действия.'));
    const checks = lesson.tasks.slice(4, rec.reviewedAt ? 8 : 6);
    const independent = checks.filter(t => rec.tasks[t.id]?.everSolved && rec.tasks[t.id]?.firstCorrect === true && rec.tasks[t.id].firstHelpUsed === false).length;
    box.append(el('p', 'course-result-score', 'Проверочные задачи урока с первого раза без открытой помощи: ' + independent + ' из ' + checks.length + '.'),
      el('p', '', 'Исправленные решения тоже сохранены. Этот результат показывает работу с заданиями урока, а не оценку способностей.'));
    const ul = el('ul', 'course-result-items');
    for (const [i, task] of lesson.tasks.entries()) {
      const result = rec.tasks[task.id]; if (!result?.everSolved) continue;
      const detail = result.firstHelpUsed ? 'помощь до первого ответа' : result.firstCorrect ? 'первый ответ верный, без помощи' : 'после исправления';
      ul.append(el('li', '', 'Задача ' + (i + 1) + ': ' + detail));
    }
    box.append(ul); host.append(box);
    const actions = el('div', 'course-actions');
    const track = trackOf(lesson), next = track.lessons[track.lessons.indexOf(lesson) + 1];
    if (next) actions.append(link('Следующий урок: ' + next.title + ' →', hrefLesson(next), 'course-primary'));
    else if (track.id === 'connections') actions.append(link('Применить всё вместе: итоговая работа →','#course-check-final','course-primary'));
    else {
      const nextId = {arithmetic:'written', written:'fractions', fractions:'decimals', decimals:'connections', connections:'algebra'}[track.id];
      const nextTrack = tracks.find(item => item.id === nextId);
      actions.append(link(nextTrack ? 'Дальше: ' + nextTrack.title + ' →' : 'Выбрать следующий курс →',
        nextTrack ? '#courses-' + nextTrack.id : '#courses', 'course-primary'));
    }
    if (!rec.reviewedAt) actions.append(button('Проверить себя на новых числах', 'new-check', () => { rec.cycle = 1; rec.cursor = 0; rec.phase = 'task'; draftFor(lesson, rec, 6); save(); render(true); }));
    actions.append(button('Повторить знакомые задачи', 'repeat', () => {
      for (const task of lesson.tasks.slice(0, 6)) rec.tasks[task.id] = E.resetDraft(task, draftFor(lesson, rec, lesson.tasks.indexOf(task)));
      rec.cycle = 0; rec.cursor = 0; rec.phase = 'intro'; save(); render(true);
    })); host.append(actions); physical(lesson);
    if (track.id === 'connections' && !next) host.append(link('После арифметики: вводные уроки алгебры →','#courses-algebra','course-return'));
    host.append(link('Коротко повторить изученные темы →','#course-check-review','course-return'));
    if (lesson.connections?.length) {
      const links = el('div', 'course-connections'); links.append(el('h3', '', 'Ещё одно применение'));
      for (const destination of lesson.connections) links.append(link(destination.label + ' →', destination.href));
      host.append(links);
    }
  }
  function render(focus = false) {
    const hash = location.hash;
    if (!courseRoute()) return;
    const track = tracks.find(t => hash === '#courses-' + t.id);
    const lesson = hash.startsWith('#course-') && byId.get(hash.slice(8));
    const completion = hash.match(/^#course-check-(placement|review|final)$/);
    if (completion && window.ArzhenikovCompletion) {
      window.ArzhenikovCompletion.render({host,mode:completion[1],lessons,courseState:state});
    } else if (lesson) {
      const rec = state.lessons[lesson.id];
      if (!rec || rec.phase === 'intro') intro(lesson);
      else if (rec.phase === 'task') taskPage(lesson, rec);
      else if (rec.phase === 'reason') reasonPage(lesson, rec);
      else resultPage(lesson, rec);
    } else if (track) trackPage(track);
    else overview();
    if (focus) {
      const title = host.querySelector('#course-heading'); title?.focus({preventScroll: true});
      host.scrollIntoView({block: 'start', behavior: 'instant'});
    }
    lastRoute = hash;
  }
  window.ArzhenikovCoursesProgress = () => E.progress(state, lessons);
  // The spatial map can be the initial route and loads before this API.
  // Refresh its caption from the restored record without changing that record.
  window.dispatchEvent(new CustomEvent('courses-progress'));
  window.addEventListener('hashchange', () => { placeNavigator(); render(location.hash !== lastRoute); });
  document.addEventListener('DOMContentLoaded', placeNavigator, {once: true});
  window.addEventListener('load', placeNavigator, {once: true});
  placeNavigator();
  render();
})();
