/* Presentation of a teacher-selected public course. Uses the existing focus
 * note; never changes profiles, creates attempts or assigns personal credit. */
(function(root, factory) {
  'use strict';
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.LearningAttachedCourse = value;
})(typeof globalThis === 'undefined' ? this : globalThis, function() {
  'use strict';
  const course = Object.freeze({
    id: 'merzlyak-10-base',
    title: '10 класс · Геометрия Мерзляк',
    url: 'https://mathexam.space/stereo-course/merzlyak-10-base/',
    boardURL: 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent('/trainers/merzlyak-10-base.html')
  });
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function selected(profile) {
    if (typeof profile?.focus !== 'string') return null;
    for (const match of profile.focus.matchAll(/https:\/\/[^\s<>"']+/g)) {
      if (match.index && !/[\s([{:;]/.test(profile.focus[match.index - 1])) continue;
      if (match[0].replace(/[.,;:!?)\]}]+$/, '') === course.url) return course;
    }
    return null;
  }
  function markup(profile, {heading = 'h1'} = {}) {
    if (!selected(profile)) return '';
    const tag = heading === 'h1' ? 'h1' : 'h2';
    return `<section class="panel attached-course" data-attached-course="${course.id}"><p class="eyebrow">МОЙ КУРС · БАЗОВЫЙ УРОВЕНЬ</p><${tag}>${course.title}</${tag}><p>Полный курс по учебнику: теория, решения задач, самопроверка и пространственные модели.</p><div class="actions"><a class="button primary" data-attached-course-open href="${course.url}">Открыть полный курс →</a><a class="button" data-attached-course-board href="${course.boardURL}">Открыть курс на доске →</a></div><p class="form-hint">На совместном уроке используйте ссылку комнаты преподавателя.</p><p class="form-hint" data-attached-course-storage>Личные решения курса сохраняются в браузере. Работа на общей доске не записывается как самостоятельное решение в кабинете.</p></section>`;
  }
  function note(profile) {
    return profile?.focus ? `<section class="panel"><h2>От преподавателя</h2><p class="prep-focus">${escape(profile.focus)}</p></section>` : '';
  }
  return Object.freeze({selected, markup, note});
});
