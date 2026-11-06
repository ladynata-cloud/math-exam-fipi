/* Read-only entries to the existing profile lessons on a shared board.
 * No pupil, assignment, grade or independent-progress data belongs here. */
(function (root, factory) {
  'use strict';
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.LearningProfileSharedBoard = value;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const E = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const wrappers = Object.freeze({
    start: '/trainers/ege-profile-log-trig.html',
    circle: '/trainers/ege-profile-circle.html'
  });
  const boardURL = (source, hash) => 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent(wrappers[source] + hash);
  // Only route identifiers and labels are copied; the course owns all tasks,
  // answers and models. Circle addresses tasks; START addresses lesson/mode.
  const definitions = [
    ['expr-logarithms','start','Логарифмы: вычислить по определению'],
    ['algebra-logarithmic','start','Логарифмическое уравнение и ОДЗ'],
    ['fn-explog','start','Показательный и логарифмический графики'],
    ['before-circle','circle','Что делает окружность единичной','prep-radius'],
    ['before-radians','circle','Число превращается в путь','prep-negative'],
    ['trig-angle','start','Угол: поворот, градусы и радианы'],
    ['trig-coordinates','start','Синус и косинус — координаты точки'],
    ['m5-coordinates','circle','Координаты точки единичной окружности','m5-1-a'],
    ['m6-axis','circle','Синус, косинус и тангенс на осях','m6-1-a'],
    ['trig-special','start','Точные значения и симметрия'],
    ['trig-tangent','start','Тангенс: отношение и границы определения'],
    ['m6-calculation','circle','Вычисления: сначала функции, затем действия','m6-6-a'],
    ['m6-identities','circle','Тождества и область определения','m6-10-a'],
    ['algebra-cosine','start','Восстановить косинус по синусу и четверти'],
    ['algebra-double-angle','start','Двойной угол: узнать произведение'],
    ['m6-equations','circle','Простейшие уравнения: все точки и все обороты','m6-16-a']
  ];
  const lessons = Object.freeze(definitions.map(([id, source, title, firstTask]) => Object.freeze({
    id, source, title, firstTask: firstTask || null,
    boardURL: boardURL(source, '#lesson/' + id),
    practiceURL: boardURL(source, source === 'circle' ? '#task/' + firstTask + '/guided' : '#practice/' + id + '/guided')
  })));
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const groups = Object.freeze([
    Object.freeze({title:'Логарифмы',ids:Object.freeze(definitions.slice(0,3).map(item => item[0]))}),
    Object.freeze({title:'Тригонометрия с нуля',ids:Object.freeze(definitions.slice(3,11).map(item => item[0]))}),
    Object.freeze({title:'Тригонометрия: вычисления и применение',ids:Object.freeze(definitions.slice(11).map(item => item[0]))})
  ]);
  function link(lesson, practice, text, primary = false) {
    return `<a class="button${primary ? ' primary' : ' small'}" data-attached-course-board data-profile-shared-open data-profile-shared-lesson="${lesson.id}" data-profile-shared-mode="${practice ? 'guided' : 'lesson'}" href="${E(practice ? lesson.practiceURL : lesson.boardURL)}" target="_blank" rel="noopener noreferrer" aria-label="${E(text + ': ' + lesson.title)}">${E(text)} →</a>`;
  }
  function markup({teacher = false, heading = 'h2'} = {}) {
    const tag = ['h2','h3','h4'].includes(heading) ? heading : 'h2';
    return `<section class="panel profile-shared-board" data-profile-shared-board>
      <${tag}>Логарифмы и тригонометрия · решать вместе</${tag}>
      <p>Выбери тему или открой первое задание по шагам. На доске можно менять задачи и разбирать решение вместе.</p>
      <p class="form-hint" data-profile-shared-room>${teacher ? 'На доске нажмите «Участники» → «Создать комнату» и передайте ученику ссылку комнаты.' : 'Для совместного урока открой ссылку комнаты преподавателя. Кнопки ниже открывают отдельную доску с выбранной темой.'}</p>
      <div class="actions profile-shared-start">${link(byId.get('expr-logarithms'), false, 'Логарифмы на доске', true)}${link(byId.get('before-circle'), false, 'Тригонометрия с нуля на доске', true)}</div>
      <div class="profile-shared-groups">${groups.map(group => `<details class="profile-shared-group"><summary>${E(group.title)} · ${group.ids.length} тем${group.ids.length === 3 ? 'ы' : ''}</summary><ol>${group.ids.map(id => {
        const lesson = byId.get(id);
        return `<li data-profile-shared-item="${id}"><span>${E(lesson.title)}${id === 'm6-equations' ? ' · дополнительно' : ''}</span><div class="actions">${link(lesson, false, 'Открыть тему на доске')}${link(lesson, true, 'Решать по шагам')}</div></li>`;
      }).join('')}</ol></details>`).join('')}</div>
      <p class="form-hint" data-profile-shared-storage>Совместный разбор не отмечается как самостоятельная работа в кабинете.</p>
    </section>`;
  }
  return Object.freeze({lessons, groups, markup});
});
