(function () {
  'use strict';
  const topics = window.MathExamCheatsheets;
  const ids = ['negative-numbers', 'fractions', 'brackets', 'linear-equation', 'proportions', 'percentages', 'adjacent-angles'];
  const $ = id => document.getElementById(id);
  const revision = 'history-tap-20261005';
  let activeTopic = null;
  const player = $('video-player');
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
    const mediaUrl = 'media/' + id + '.mp4?v=' + revision;
    $('video').href = mediaUrl;
    text('video-title', topic.title + ' — видео');
    $('topic-select').value = id;
    if (activeTopic !== id) {
      player.pause(); player.src = mediaUrl; player.load();
      activeTopic = id;
      text('video-status', 'Нажми «Смотреть видео». Ролик без голоса; шаги сопровождают мягкие щелчки.');
      text('play-video', '▶ Смотреть видео');
    }
    $('interactive').href = 'studio.html?task=' + id + '&preset=1';
    list('trainer-steps', guide.steps);
    $('trainer').href = guide.publicUrl;
    $('quick-trainer').href = guide.publicUrl;
    $('trainer').textContent = 'Попробовать: ' + guide.practiceLabel + ' ↗';
    $('cabinet-practice').href = 'https://mathexam-board-ladynata.amvera.io/learning/#learn=' + id;
    $('cabinet-practice').hidden = !guide.catalogId;
    $('quick-cabinet').href = $('cabinet-practice').href;
    $('quick-cabinet').hidden = !guide.catalogId;
    text('quick-progress', guide.progressNote || 'Без входа можно попробовать. Чтобы Наталья Михайловна увидела сохранённую работу, открой её в своём кабинете.');
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
    const option = document.createElement('option'); option.value = id;
    option.textContent = topics[id].title; $('topic-select').append(option);
  }
  $('topic-select').addEventListener('change', event => { location.hash = event.target.value; });
  $('play-video').addEventListener('click', async () => {
    if (!player.paused) { player.pause(); return; }
    try { await player.play(); }
    catch (_) { text('video-status', 'Не получилось запустить здесь. Открой MP4 отдельно по ссылке рядом.'); }
  });
  player.addEventListener('play', () => { text('play-video', 'Ⅱ Пауза'); text('video-status', 'Можно поставить на паузу, перемотать или развернуть видео на весь экран.'); });
  player.addEventListener('pause', () => text('play-video', player.ended ? '↻ Смотреть ещё раз' : '▶ Смотреть видео'));
  player.addEventListener('error', () => text('video-status', 'Видео не загрузилось. Проверь связь или открой MP4 отдельно по ссылке рядом.'));
  for (const id of ['quick-trainer', 'trainer', 'quick-cabinet', 'cabinet-practice', 'interactive']) $(id).addEventListener('click', () => player.pause());
  $('show-instructions').addEventListener('click', () => { player.pause(); $('practice-instructions').scrollIntoView({ behavior: 'auto', block: 'start' }); $('practice-instructions').focus({ preventScroll: true }); });
  $('print').addEventListener('click', () => { player.pause(); window.print(); });
  window.addEventListener('hashchange', show);
  show();
})();
