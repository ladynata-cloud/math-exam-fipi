(function () {
  'use strict';
  const topics = window.MathExamCheatsheets;
  const guides = window.LearningTopicGuides;
  const groups = [
    { title: 'Алгебра · начало 7 класса', ids: ['numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties', 'identities', 'brackets', 'equation-roots', 'linear-equation', 'linear-cases', 'equation-word-problems'] },
    { title: 'Вспомнить основы', ids: ['negative-numbers', 'fractions', 'proportions', 'percentages'] },
    { title: 'Геометрия · углы', ids: ['adjacent-angles'] }
  ];
  const ids = groups.flatMap(group => group.ids).filter(id => guides.get(id));
  const $ = id => document.getElementById(id);
  const revision = 'grade7-silent-motion-20261005';
  let activeVideo = null;
  let videoKind = new URLSearchParams(location.search).get('type') === 'trainer' ? 'trainer' : 'math';
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
    const mediaUrl = 'media/' + (videoKind === 'trainer' ? 'using-' : '') + id + '.mp4?v=' + revision;
    $('video').href = mediaUrl;
    text('video-title', videoKind === 'trainer' ? 'Как работать в тренажёре' : 'Разбор задачи по шагам');
    player.setAttribute('aria-label', topic.title + (videoKind === 'trainer' ? ' — как работать в тренажёре' : ' — разбор задачи'));
    for (const kind of ['math', 'trainer']) $('video-kind-' + kind).setAttribute('aria-pressed', String(videoKind === kind));
    $('topic-select').value = id;
    if (activeVideo !== mediaUrl) {
      player.pause(); player.src = mediaUrl; player.load();
      activeVideo = mediaUrl;
      text('video-status', videoKind === 'trainer' ? 'Нажми «Смотреть видео». Увидишь, куда нажать и как ответить в этом тренажёре. Без звука.' : 'Нажми «Смотреть видео». Пошаговый разбор без звука; предыдущие строки остаются на экране.');
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
  for (const group of groups) {
    const section = document.createElement('div'); section.className = 'topic-group';
    const heading = document.createElement('h3'); heading.textContent = group.title;
    section.append(heading);
    const options = document.createElement('optgroup'); options.label = group.title;
    for (const id of group.ids.filter(value => ids.includes(value))) {
      const link = document.createElement('a'); link.href = '#' + id;
      const number = document.createElement('span'); number.textContent = String(ids.indexOf(id) + 1).padStart(2, '0');
      const label = document.createElement('strong'); label.textContent = topics[id].title;
      link.append(number, label); section.append(link);
      const option = document.createElement('option'); option.value = id;
      option.textContent = topics[id].title; options.append(option);
    }
    $('topics').append(section); $('topic-select').append(options);
  }
  for (const kind of ['math', 'trainer']) $('video-kind-' + kind).addEventListener('click', () => {
    videoKind = kind;
    const url = new URL(location.href);
    if (kind === 'trainer') url.searchParams.set('type', 'trainer'); else url.searchParams.delete('type');
    history.replaceState(null, '', url);
    show();
  });
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
