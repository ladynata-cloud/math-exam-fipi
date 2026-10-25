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
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  // An explicit presentation choice in the existing versioned focus note.
  // URLs or a pupil's identity never opt a profile into this mode.
  const numberTheoryMarker = 'Индивидуальный маршрут: только НОК и НОД.';
  const numberTheory = Object.freeze({id:'grade6-number-theory-only', kind:'trainer-set', title:'НОК и НОД'});
  const lines = value => typeof value === 'string' ? value.split(/\r?\n/) : [];
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
    for (const match of profile.focus.matchAll(/https:\/\/[^\s<>"']+/g)) {
      if (match.index && !/[\s([{:;]/.test(profile.focus[match.index - 1])) continue;
      if (match[0].replace(/[.,;:!?)\]}]+$/, '') === course.url) return course;
    }
    return null;
  }
  function markup(profile, {heading = 'h1', teacher = false} = {}) {
    if (!selected(profile)) return '';
    const tag = heading === 'h1' ? 'h1' : 'h2';
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
