/* The album is a view of existing workshop progress, never a second save file. */
(() => {
  'use strict';
  const places = window.ArzhenikovLife?.places;
  const album = document.getElementById('adventure-album');
  if (!places?.length || !album) return;

  const byId = id => document.getElementById(id);
  const names = window.ArzhenikovWorkshopProgress?.().postcards || {};
  const legacy = new Set(['count','share','pack','inverse','bridge','zero','remainder','transfer']);
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  const cards = places.map(place => {
    const card = element('a', 'adv-postcard');
    card.href = '#workshop-' + place.id;
    card.dataset.place = place.id;
    const art = element('span', 'adv-postcard-art adv-scene', place.icon);
    art.dataset.place = place.id;
    art.setAttribute('aria-hidden', 'true');
    const title = element('strong', 'adv-postcard-title', names[place.id] || place.name);
    const status = element('span', 'adv-postcard-status');
    const count = element('span', 'adv-postcard-count');
    card.append(art, title, status, count);
    byId('adventure-postcards').append(card);
    return {place, card, status, count};
  });

  function reflect() {
    const record = window.ArzhenikovWorkshopProgress?.() || {};
    const total = places.reduce((sum, place) => sum + place.scenes.length, 0);
    const solved = Math.max(0, Math.min(total, Number(record.storyCount) || 0));
    const done = places.filter(place => record.completed?.includes(place.id));
    byId('adventure-story-count').textContent = solved + ' из ' + total;
    byId('adventure-postcard-count').textContent = done.length + ' из ' + places.length;
    byId('adventure-album-count').textContent = done.length + ' из ' + places.length + ' открыток';
    for (const {place, card, status, count} of cards) {
      const earned = record.completed?.includes(place.id) || false;
      const completed = Math.max(0, Math.min(place.scenes.length, Number(record.placeCounts?.[place.id]?.solved) || 0));
      card.dataset.earned = String(earned);
      if (record.active === place.id) card.setAttribute('aria-current', 'location');
      else card.removeAttribute('aria-current');
      status.textContent = earned ? '✓ В альбоме' : 'Открытка ждёт тебя';
      count.textContent = 'Историй: ' + completed + ' из ' + place.scenes.length;
    }
    byId('adventure-album-message').textContent = solved === total
      ? 'Все ' + total + ' историй с предметами решены! Можно закончить записи, выбрать любимую историю или попробовать новые задачи.'
      : done.length === places.length
        ? 'Все 8 открыток в альбоме! Решено ' + solved + ' из ' + total + ' историй. В городе ещё есть дела — выбирай место и продолжай.'
        : 'Можно выбирать любое место и возвращаться к нему. Каждая открытка остаётся в альбоме.';
  }

  function reflectMode() {
    const hash = location.hash.slice(1);
    const mode = /^(?:courses(?:-(?:arithmetic|written|fractions|decimals|connections|algebra|geometry))?|course-.+)$/.test(hash) ? 'courses'
      : /^journey(?:-.*)?$/.test(hash) ? 'journey'
      : /^discoveries(?:-.*)?$/.test(hash) ? 'discoveries'
        : hash === 'next-course' ? 'bridge'
          : /^harbor(?:-\d+)?$/.test(hash) ? 'harbor' : hash.startsWith('garden-') ? 'garden' : legacy.has(hash) ? 'skills' : 'city';
    document.body.dataset.adventureMode = mode;
    album.hidden = mode !== 'city';
    byId('adventure-harbor-link').hidden = mode !== 'city';
    byId('division-harbor').hidden = mode !== 'harbor';
    if (byId('journey-map')) byId('journey-map').hidden = mode !== 'journey';
    if (byId('discoveries')) byId('discoveries').hidden = mode !== 'discoveries';
    if (byId('next-course')) byId('next-course').hidden = mode !== 'bridge';
    if (byId('journey-entry')) byId('journey-entry').hidden = mode !== 'city';
    if (byId('arz-courses')) byId('arz-courses').hidden = mode !== 'courses';
    if (byId('course-entry')) byId('course-entry').hidden = mode !== 'city';
    if (['harbor','journey','discoveries','bridge','courses'].includes(mode)) {
      byId('workshop').hidden = true;
      byId('garden').hidden = true;
      document.querySelector('.layout').hidden = true;
      document.querySelector('.intro .meter').hidden = true;
      document.querySelectorAll('.life-modes a').forEach(link => {
        const current = {harbor:'#harbor',journey:'#journey',discoveries:'#discoveries',bridge:'#next-course',courses:'#courses'}[mode];
        if (link.hash === current) link.setAttribute('aria-current','page');
        else link.removeAttribute('aria-current');
      });
    }
    byId('adventure-title').textContent = mode === 'courses' ? 'Математика шаг за шагом' : mode === 'city' ? 'Город маленьких дел'
      : mode === 'journey' ? 'Математика: карта путешествий'
        : mode === 'discoveries' ? 'Бюро открытий'
          : mode === 'bridge' ? 'Дальше — алгебра и геометрия'
            : mode === 'harbor' ? 'Порт отправлений' : mode === 'garden' ? 'Оранжерея равных групп' : 'Деление по шагам';
    byId('adventure-eyebrow').textContent = mode === 'city' ? 'Игра с математикой' : 'Математическая мастерская';
    byId('adventure-subtitle').textContent = mode === 'courses' ? 'Разберись. Покажи. Реши. Объясни.' : mode === 'city'
      ? 'Помоги друзьям. Собери 8 открыток.'
      : mode === 'journey' ? 'Приблизь интересное место. Исследуй. Вернись к целому.'
        : mode === 'discoveries' ? 'Предскажи. Проверь действием. Объясни.'
          : mode === 'bridge' ? 'От предметного действия — к неизвестному числу и свойствам фигур.'
            : mode === 'harbor' ? 'Полные наборы, остаток и место для всего груза.'
        : mode === 'garden' ? 'Выращивай растения, решай новые задачи и проверяй себя.'
        : 'От равных групп к делению уголком. Выбери навык на карте.';
  }

  // Opening the album must not replace the current mission hash or saved run.
  byId('adventure-album-link').addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    album.open = true;
    album.querySelector('summary').focus({preventScroll:true});
    album.scrollIntoView({block:'start',behavior:'auto'});
  });
  album.addEventListener('toggle', () => byId('adventure-album-link').setAttribute('aria-expanded', String(album.open)));
  function focusMission() {
    const heading = byId('workshop-play').querySelector('.ws-title');
    if (!heading) return;
    album.open = false;
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:'auto'});
  }
  let selectedPlace = '';
  byId('adventure-postcards').addEventListener('click', event => {
    const card = event.target.closest('a.adv-postcard');
    if (!card || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    selectedPlace = card.hash;
    if (location.hash === selectedPlace) {
      selectedPlace = '';
      requestAnimationFrame(focusMission);
    }
  });
  window.addEventListener('workshop-progress', reflect);
  window.addEventListener('workshop-render', reflect);
  function reflectHarbor() {
    const record = window.ArzhenikovHarborProgress?.();
    if (record) byId('adventure-harbor-count').textContent = record.completed.length
      ? 'Решено отправок: ' + record.completed.length + ' из ' + record.total
      : '12 новых миссий и своя задача';
  }
  window.addEventListener('harbor-progress', reflectHarbor);
  window.addEventListener('hashchange', () => {
    reflectMode();
    if (selectedPlace && selectedPlace === location.hash) requestAnimationFrame(focusMission);
    selectedPlace = '';
  });
  reflect();
  reflectHarbor();
  reflectMode();
})();
