(function () {
  'use strict';
  const grid = document.querySelector('main > .grid');
  if (!grid || document.getElementById('course-finder')) return;
  const cards = [...grid.querySelectorAll(':scope > .card')];
  if (!cards.length) return;
  const normalize = value => String(value).toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[–−—]/g, '-').replace(/\s+/g, ' ').trim();
  const rows = cards.map(card => {
    const title = card.querySelector('h2')?.textContent || '';
    const label = card.querySelector('.eyebrow')?.textContent || '';
    const path = card.querySelector('h2 a')?.getAttribute('href') || '';
    const text = normalize(card.textContent);
    const geometry = /^\/(?:geometry-|stereo-course)/.test(path) || /геометри|планиметри|стереометри/.test(normalize(title + ' ' + label));
    const exam = /^\/(?:ege-|vpr\/|trainers\/oge-course)/.test(path) && !/percent|work-rate/.test(path);
    const basics = /основ|базовые действия|деление столбиком|уравнения:/.test(normalize(title)) || path === '/soviet-math/';
    return {card, text, geometry, exam, basics};
  });
  const finder = document.createElement('section');
  finder.id = 'course-finder';
  finder.setAttribute('aria-label', 'Найти учебный курс');
  finder.innerHTML = '<label for="course-query">Учебник, класс или тема</label><div class="course-find-row"><input id="course-query" type="search" maxlength="100" placeholder="Например: Макарычев, 6 класс, проценты" autocomplete="off"><button type="button" id="course-clear">Сбросить поиск</button></div><div class="course-filters" role="group" aria-label="Направление"><button type="button" data-course-filter="all" aria-pressed="true">Все курсы</button><button type="button" data-course-filter="basics" aria-pressed="false">Начать с основ</button><button type="button" data-course-filter="exam" aria-pressed="false">Экзамены и ВПР</button><button type="button" data-course-filter="geometry" aria-pressed="false">Геометрия</button></div><p id="course-count" role="status" aria-live="polite"></p><p id="course-empty" hidden>Подходящего курса пока не найдено. Попробуй название учебника или сбрось поиск.</p>';
  grid.before(finder);
  let filter = 'all';
  const input = finder.querySelector('input');
  function refresh() {
    const words = normalize(input.value).split(' ').filter(Boolean);
    let visible = 0;
    for (const row of rows) {
      row.card.hidden = !(filter === 'all' || row[filter]) || !words.every(word => row.text.includes(word));
      if (!row.card.hidden) visible++;
    }
    finder.querySelector('#course-count').textContent = 'Найдено курсов: ' + visible + ' из ' + rows.length + '.';
    finder.querySelector('#course-empty').hidden = visible !== 0;
    finder.querySelectorAll('[data-course-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.courseFilter === filter));
  }
  input.addEventListener('input', refresh);
  finder.addEventListener('click', event => {
    const button = event.target.closest('[data-course-filter]');
    if (button) { filter = button.dataset.courseFilter; refresh(); }
  });
  finder.querySelector('#course-clear').addEventListener('click', () => { input.value = ''; filter = 'all'; refresh(); input.focus(); });
  refresh();
})();
