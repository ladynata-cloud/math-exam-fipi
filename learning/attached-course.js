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
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  // An explicit presentation choice in the existing versioned focus note.
  // URLs or a pupil's identity never opt a profile into this mode.
  const numberTheoryMarker = 'Индивидуальный маршрут: только НОК и НОД.';
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
    if (!lines(value).includes(numberTheoryMarker)) return typeof value === 'string' ? value : '';
    return lines(value).filter(line => line !== numberTheoryMarker).join('\n');
  }
  function withNumberTheoryOnly(value, enabled) {
    const comment = focusComment(value).trim();
    return enabled ? (comment ? comment + '\n' : '') + numberTheoryMarker : comment;
  }
  function selected(profile) {
    if (typeof profile?.focus !== 'string') return null;
    if (numberTheoryOnly(profile)) return numberTheory;
    const urls = focusURLs(profile.focus);
    if (urls.has(course.url)) return course;
    if (urls.has(collegeFunctions.url)) return collegeFunctions;
    if (profile.course === 'ege' && egeBaseLessons.every(lesson => urls.has(egeBaseURL(lesson.id)))) return egeBase;
    return null;
  }
  function markup(profile, {heading = 'h1', teacher = false} = {}) {
    const active = selected(profile);
    if (!active) return '';
    const tag = heading === 'h1' ? 'h1' : 'h2';
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
  return Object.freeze({selected, markup, note, numberTheoryOnly, focusComment, withNumberTheoryOnly});
});
