/* Presentation of a teacher-selected public course. Uses the existing focus
 * note; never changes profiles, creates attempts or assigns personal credit. */
(function(root, factory) {
  'use strict';
  const value = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.LearningAttachedCourse = value;
})(typeof globalThis === 'undefined' ? this : globalThis, function(root) {
  'use strict';
  const course = Object.freeze({
    id: 'merzlyak-10-base',
    title: '10 класс · Геометрия Мерзляк',
    url: 'https://mathexam.space/stereo-course/merzlyak-10-base/',
    boardURL: 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent('/trainers/merzlyak-10-base.html')
  });
  const collegeFunctions = Object.freeze({
    id: 'college-functions',
    title: 'Колледж · Графики функций',
    url: 'https://mathexam.space/trainers/college-functions/',
    boardURL: 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent('/trainers/college-functions/index.html')
  });
  const atanasyanFirstSteps = Object.freeze({
    id: 'atanasyan-first-steps',
    kind: 'native-course',
    title: 'Атанасян · От начала до построений',
    url: 'https://mathexam.space/geometry-course/first-steps/'
  });
  const petersonPair = Object.freeze({id:'peterson6-pair', kind:'public-course-pair', title:'Петерсон · 6 класс · курс и линейка'});
  const petersonCourses = Object.freeze({
    'peterson-course': Object.freeze({id:'peterson6', title:'Петерсон · 6 класс · часть 1', path:'/school/peterson6/', url:'https://mathexam.space/school/peterson6/',
      description:'14 тем: условия задач, модели и разборы по шагам. Для трудных вычислений есть отдельные тренировки.'}),
    'peterson-line': Object.freeze({id:'maxim-peterson6', title:'Линейка Максима · Петерсон', path:'/trainers/maxim-peterson6/', url:'https://mathexam.space/trainers/maxim-peterson6/',
      description:'13 тренажёров по движению, процентам, совместной работе и вычислениям. Шпаргалки, домашняя работа и отчёт о тренировке.'})
  });
  const publicCourse = route => typeof route === 'string' && Object.hasOwn(petersonCourses, route) ? petersonCourses[route] : null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  // An explicit presentation choice in the existing versioned focus note.
  // URLs or a pupil's identity never opt a profile into this mode.
  const numberTheoryMarker = 'Индивидуальный маршрут: только НОК и НОД.';
  const vilenkinTextbookMarker = 'Курс в кабинете: Виленкин, 6 класс, часть 1 — задания учебника.';
  const vilenkinTextbook = Object.freeze({id:'vilenkin6-textbook',kind:'cloud-textbook-course',title:'Виленкин · 6 класс · задания учебника'});
  const numberTheory = Object.freeze({id:'grade6-number-theory-only', kind:'trainer-set', title:'НОК и НОД'});
  const egeBase = Object.freeze({id:'ege-base-11-13', kind:'trainer-set', title:'ЕГЭ база · №11 и №13'});
  const egeBaseLessons = Object.freeze([
    Object.freeze({id:'box', number:11, title:'№11 · Пространственные тела', description:'Объём, поверхность, вода в сосудах и внешние грани. Выбирай тип задачи и разбирай трудные места по шагам.'}),
    Object.freeze({id:'roundbody', number:13, title:'№13 · Стереометрия', description:'Цилиндр, конус, шар, призма и пирамида. Подобие, площади и объёмы с чертежами и подсказками.'})
  ]);
  const egeBasePath = id => '/ege-baza/path/index.html#lesson=' + id;
  const egeBaseURL = id => 'https://mathexam.space' + egeBasePath(id);
  const lines = value => typeof value === 'string' ? value.split(/\r?\n/) : [];
  function focusURLs(value) {
    const urls = new Set();
    if (typeof value !== 'string') return urls;
    for (const match of value.matchAll(/https:\/\/[^\s<>"']+/g)) {
      if (match.index && !/[\s([{:;]/.test(value[match.index - 1])) continue;
      urls.add(match[0].replace(/[.,;:!?)\]}]+$/, ''));
    }
    return urls;
  }
  function numberTheoryOnly(profile) {
    return lines(profile?.focus).includes(numberTheoryMarker);
  }
  function focusComment(value) {
    if (typeof value !== 'string') return '';
    if (!lines(value).some(line => line === numberTheoryMarker || line === vilenkinTextbookMarker)) return value;
    return lines(value).filter(line => line !== numberTheoryMarker && line !== vilenkinTextbookMarker).join('\n');
  }
  function withNumberTheoryOnly(value, enabled) {
    const comment = focusComment(value).trim();
    return enabled ? (comment ? comment + '\n' : '') + numberTheoryMarker : comment;
  }
  function routeMode(profile){return numberTheoryOnly(profile)?'number-theory-only':lines(profile?.focus).includes(vilenkinTextbookMarker)?'vilenkin-textbook':'ordinary';}
  function withRouteMode(value,mode){
    const comment=focusComment(value).trim(),marker=mode==='number-theory-only'?numberTheoryMarker:mode==='vilenkin-textbook'?vilenkinTextbookMarker:'';
    return marker?(comment?comment+'\n':'')+marker:comment;
  }
  function selected(profile) {
    if (typeof profile?.focus !== 'string') return null;
    if (numberTheoryOnly(profile)) return numberTheory;
    if (routeMode(profile)==='vilenkin-textbook') return vilenkinTextbook;
    const urls = focusURLs(profile.focus);
    if (urls.has(course.url)) return course;
    if (urls.has(collegeFunctions.url)) return collegeFunctions;
    if (profile.course === 'ege' && egeBaseLessons.every(lesson => urls.has(egeBaseURL(lesson.id)))) return egeBase;
    if (urls.has(atanasyanFirstSteps.url)) return atanasyanFirstSteps;
    // Only an explicit paired selection changes the primary cabinet route.
    // A Peterson link in an older mixed plan remains a supplementary link.
    if (Object.values(petersonCourses).every(item => urls.has(item.url))) return petersonPair;
    return null;
  }
  function markup(profile, {heading = 'h1', teacher = false, previewStudentId = ''} = {}) {
    const active = selected(profile);
    if (!active) return '';
    const tag = heading === 'h1' ? 'h1' : 'h2';
    if(active===vilenkinTextbook){
      const href=teacher?'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html':'#vilenkin-textbook';
      return `<section class="panel" data-attached-course="vilenkin6-textbook"><p class="eyebrow">К УЧЕБНИКУ · 6 КЛАСС · ЧАСТЬ 1</p><${tag}>Курс Виленкина · задания учебника</${tag}><p>Все 23 пункта первой части и повторение: правило, разбор по шагам и самостоятельные задания с номерами и страницами учебника. Авторское дополнение MathExam учит находить НОК трёх и более чисел двумя способами.</p><div class="actions"><a class="button primary" data-attached-course-open href="${href}"${teacher?' target="_blank" rel="noopener noreferrer"':''}>${teacher?'Посмотреть материалы':'Открыть мой курс'} →</a></div><p class="form-hint">В кабинете каждое задание сохраняется отдельной работой. Прежние 27 модулей и их результаты остаются доступны.</p>${teacher?'<p class="form-hint">Этот просмотр открывает общедоступный курс без личных решений ученика.</p>':''}</section>`;
    }
    if (active === petersonPair) {
      const preview = teacher || !!previewStudentId;
      const cardTag = tag === 'h1' ? 'h2' : 'h3';
      const cards = Object.entries(petersonCourses).map(([route, item]) => {
        const href = preview ? item.url : '#' + route;
        const external = preview ? ' target="_blank" rel="noopener noreferrer"' : '';
        const board = item.id === 'peterson6' && teacher ? `<a class="button" data-attached-course-board href="https://mathexam.space/trainers/trainer-board.html?trainer=%2Fschool%2Fpeterson6%2F" target="_blank" rel="noopener noreferrer">Открыть на доске</a>` : '';
        return `<article class="card" data-peterson-course="${item.id}"><${cardTag}>${item.title}</${cardTag}><p>${item.description}</p><div class="actions"><a class="button primary" data-attached-course-open href="${href}"${external}>${preview ? 'Посмотреть материалы' : 'Открыть в кабинете'} →</a>${preview ? '' : `<a class="button" href="${item.url}" target="_blank" rel="noopener noreferrer">В отдельной вкладке</a>`}${board}</div></article>`;
      }).join('');
      return `<section data-attached-course="${petersonPair.id}"><div class="page-heading"><div><p class="eyebrow">МОИ МАТЕРИАЛЫ · 6 КЛАСС</p><${tag}>${petersonPair.title}</${tag}><p>Выбери курс или отдельную тренировку. Помощник справа внизу подсказывает по текущему заданию, когда ты его открываешь.</p></div></div><div class="cards">${cards}</div><p class="form-hint" data-attached-course-storage>Решения и подсказки этих материалов сохраняются в этом браузере, отдельно от истории кабинета. На общем устройстве записи курса могут быть общими; для преподавателя можно скачать отчёт из курса.</p>${preview ? '<p class="form-hint" data-peterson-preview>Здесь показаны ссылки на общедоступные материалы. Они открываются отдельно; личные решения ученика в этом просмотре не загружаются.</p>' : ''}</section>`;
    }
    if (active === atanasyanFirstSteps) {
      const preview = typeof previewStudentId === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(previewStudentId) ? previewStudentId : '';
      const href = preview ? '#atanasyan-course&preview=' + encodeURIComponent(preview) : teacher ? atanasyanFirstSteps.url : '#atanasyan-course';
      const external = teacher && !preview ? ' target="_blank" rel="noopener noreferrer"' : '';
      const primaryMarkup = `<section class="panel attached-course" data-attached-course="${atanasyanFirstSteps.id}"><p class="eyebrow">КУРС К УЧЕБНИКУ · 7 КЛАСС</p><${tag}>${atanasyanFirstSteps.title}</${tag}><p>Теория 1–23 и все задачи №1–160 с подпунктами: условие, отдельный чертёж и разбор небольшими шагами. Три признака равенства треугольников и элементарные построения.</p><div class="actions"><a class="button primary" data-attached-course-open href="${escape(href)}"${external}>${teacher || preview ? 'Посмотреть курс' : 'Открыть мой курс'} →</a></div><p class="form-hint" data-attached-course-storage>Записи этого курса сохраняются в браузере для текущего пользователя. Их можно скачать для передачи преподавателю. Эти записи не входят в серверную историю работ кабинета.</p><p class="form-hint" data-atanasyan-assistant>Помощник MaxExam 0.0 доступен внутри задачи после подключения к этому кабинету. Рассуждения и доказательства проверяет преподаватель.</p></section>`;
      const companionHref = preview ? '#ichenskaya-course&preview=' + encodeURIComponent(preview) : teacher
        ? 'https://mathexam.space/geometry-course/ichenskaya-7-works/' : '#ichenskaya-course';
      const companionTag = tag === 'h1' ? 'h2' : 'h3';
      const companionMarkup = `<section class="panel attached-course" data-attached-course="ichenskaya-grade7-works" data-attached-companion="atanasyan-first-steps"><p class="eyebrow">САМОСТОЯТЕЛЬНЫЕ И КОНТРОЛЬНЫЕ · 7 КЛАСС</p><${companionTag}>Работы Иченской · задачи по вариантам</${companionTag}><p>17 самостоятельных и 6 контрольных работ, по два варианта: 110 задач с чертежами, своими записями и разбором по шагам.</p><p>С-1–С-10 и К-1–К-2 подходят к основному курсу до построений. Остальные работы посвящены следующим темам 7 класса и отмечены отдельно.</p><div class="actions"><a class="button" data-attached-course-open data-companion-course-open href="${escape(companionHref)}"${external}>${teacher || preview ? 'Посмотреть сборник' : 'Открыть самостоятельные и контрольные'} →</a></div><p class="form-hint" data-attached-course-storage>Записи этого сборника сохраняются отдельно для текущего пользователя в этом браузере. Их можно скачать для преподавателя; в серверную историю кабинета они не входят. Решения и доказательства проверяет преподаватель.</p></section>`;
      return primaryMarkup + companionMarkup;
    }
    if (active === collegeFunctions) {
      return `<section class="panel attached-course" data-attached-course="${collegeFunctions.id}"><p class="eyebrow">МОЙ КУРС · КОЛЛЕДЖ</p><${tag}>${collegeFunctions.title}</${tag}><p>40 задач по графикам: корни, параболы, показательные и логарифмические функции, функции по частям. Стройте по точкам и исследуйте свойства шаг за шагом.</p><div class="actions"><a class="button primary" data-attached-course-open href="${collegeFunctions.url}" target="_blank" rel="noopener noreferrer">Открыть тренажёр →</a>${teacher ? `<a class="button" data-attached-course-board href="${collegeFunctions.boardURL}" target="_blank" rel="noopener noreferrer">Открыть на общей доске →</a>` : ''}</div><p class="form-hint" data-college-functions-room>${teacher ? 'Для совместного занятия откройте тренажёр на доске и передайте ученику ссылку этой комнаты.' : 'Для совместного занятия открой ссылку комнаты, которую пришлёт преподаватель.'}</p><p class="form-hint" data-attached-course-storage>Личные решения курса сохраняются в браузере. Работа на общей доске не записывается как самостоятельное решение в кабинете.</p></section>`;
    }
    if (active === egeBase) {
      const cardTag = tag === 'h1' ? 'h2' : 'h3';
      const cards = egeBaseLessons.map(lesson => {
        const boardURL = 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent(egeBasePath(lesson.id));
        return `<article class="card" data-ege-base-position="${lesson.number}"><${cardTag}>${lesson.title}</${cardTag}><p>${lesson.description}</p><div class="actions"><a class="button primary" data-attached-course-open href="${egeBaseURL(lesson.id)}" target="_blank" rel="noopener noreferrer">Открыть задание №${lesson.number} →</a>${teacher ? `<a class="button" data-attached-course-board href="${boardURL}" target="_blank" rel="noopener noreferrer">Открыть №${lesson.number} на доске</a>` : ''}</div></article>`;
      }).join('');
      return `<section data-attached-course="${egeBase.id}"><div class="page-heading"><div><p class="eyebrow">МОИ ТРЕНАЖЁРЫ · ЕГЭ БАЗА</p><${tag}>${egeBase.title}</${tag}><p>Сначала попробуй решить задачу. Если трудно, открой «Хочешь подсказку?» — твои записи останутся на месте.</p></div></div><div class="cards">${cards}</div><p class="form-hint" data-ege-base-room>${teacher ? 'Для совместного занятия откройте нужный номер на доске и передайте ученику ссылку этой комнаты.' : 'Для совместного занятия открой ссылку комнаты, которую пришлёт преподаватель.'}</p><p class="form-hint" data-attached-course-storage>Личные решения курса сохраняются в браузере. Работа на общей доске не записывается как самостоятельное решение в кабинете.</p><p><a class="button" data-ege-base-full-course href="https://mathexam.space/ege-baza/" target="_blank" rel="noopener noreferrer">Весь курс ЕГЭ базы →</a></p></section>`;
    }
    if (numberTheoryOnly(profile)) {
      const cards = root.LearningPreparationUI?.numberTheoryCardsMarkup?.({teacher});
      return `<section data-attached-course="${numberTheory.id}" data-number-theory-only><div class="page-heading"><div><p class="eyebrow">МОИ ТРЕНАЖЁРЫ · 6 КЛАСС</p><${tag}>${numberTheory.title}</${tag}><p>Выбери тему и решай примеры самостоятельно или вместе с преподавателем.</p></div></div><div class="cards">${cards || '<p role="status">Тренажёры пока не загрузились. Обновите страницу.</p>'}</div><p class="form-hint" data-number-theory-room>${teacher ? 'Для совместного занятия откройте тренажёр на доске и передайте ученику ссылку комнаты.' : 'Для совместного занятия открой ссылку комнаты, которую пришлёт преподаватель.'}</p></section>`;
    }
    return `<section class="panel attached-course" data-attached-course="${course.id}"><p class="eyebrow">МОЙ КУРС · БАЗОВЫЙ УРОВЕНЬ</p><${tag}>${course.title}</${tag}><p>Полный курс по учебнику: теория, решения задач, самопроверка и пространственные модели.</p><div class="actions"><a class="button primary" data-attached-course-open href="${course.url}">Открыть полный курс →</a><a class="button" data-attached-course-board href="${course.boardURL}">Открыть курс на доске →</a></div><p class="form-hint">На совместном уроке используйте ссылку комнаты преподавателя.</p><p class="form-hint" data-attached-course-storage>Личные решения курса сохраняются в браузере. Работа на общей доске не записывается как самостоятельное решение в кабинете.</p></section>`;
  }
  function note(profile) {
    const comment = focusComment(profile?.focus);
    return comment ? `<section class="panel"><h2>От преподавателя</h2><p class="prep-focus">${escape(comment)}</p></section>` : '';
  }
  return Object.freeze({selected, markup, note, publicCourse, numberTheoryOnly, focusComment, withNumberTheoryOnly,routeMode,withRouteMode});
});
