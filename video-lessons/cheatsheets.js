(function () {
  'use strict';
  const topics = window.MathExamCheatsheets;
  const ids = ['negative-numbers', 'fractions', 'brackets', 'linear-equation', 'proportions', 'percentages', 'adjacent-angles'];
  const $ = id => document.getElementById(id);
  const revision = 'history-tap-20261005';
  const text = (id, value) => { $(id).textContent = value; };
  function list(id, lines) {
    $(id).replaceChildren(...lines.map(line => {
      const row = document.createElement('li'); row.textContent = line; return row;
    }));
  }
  function show() {
    const requested = location.hash.slice(1);
    const id = ids.includes(requested) ? requested : 'linear-equation';
    const topic = topics[id], guide = window.LearningTopicGuides.get(id);
    document.title = topic.title + ' · шпаргалка MathExam';
    text('sheet-number', 'Опора ' + (ids.indexOf(id) + 1) + ' из ' + ids.length);
    text('sheet-title', topic.title);
    list('rules', topic.rule); list('example', topic.example);
    $('angle-figure').hidden = id !== 'adjacent-angles';
    text('check', topic.check); text('warning', topic.warning);
    text('practice', topic.practice.prompt); text('practice-note', topic.practice.instruction);
    $('video').href = 'media/' + id + '.mp4?v=' + revision;
    $('interactive').href = 'studio.html?task=' + id + '&preset=1';
    list('trainer-steps', guide.steps);
    $('trainer').href = guide.publicUrl;
    $('trainer').textContent = 'Попробовать: ' + guide.practiceLabel + ' ↗';
    $('cabinet-practice').href = 'https://mathexam-board-ladynata.amvera.io/learning/#learn=' + id;
    $('cabinet-practice').hidden = !guide.catalogId;
    text('trainer-progress', guide.progressNote || 'Здесь можно попробовать без входа. Чтобы работа сохранилась для Натальи Михайловны, открой этот тренажёр через свой кабинет.');
    for (const link of $('topics').querySelectorAll('a')) {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }
  for (const [index, id] of ids.entries()) {
    const link = document.createElement('a'); link.href = '#' + id;
    const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('strong'); label.textContent = topics[id].title;
    link.append(number, label); $('topics').append(link);
  }
  $('print').addEventListener('click', () => window.print());
  window.addEventListener('hashchange', show);
  show();
})();
