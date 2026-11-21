/* The map artwork is decorative. Every stop is an ordinary, labelled link. */
(() => {
  'use strict';
  const nav = document.getElementById('life-map');
  const places = window.ArzhenikovLife?.places;
  if (!nav || !places?.length) return;

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text) item.textContent = text;
    return item;
  }

  const drawer = element('details', 'wm-drawer');
  const summary = element('summary', 'wm-summary');
  const label = element('strong', '', 'Карта города');
  const progress = element('span', 'wm-progress');
  const preview = element('span', 'wm-preview');
  preview.setAttribute('aria-hidden', 'true');
  preview.textContent = places.slice(0, 2).map(place => place.icon).join(' ');
  summary.append(preview, label, progress);

  const board = element('div', 'wm-board');
  const canvas = element('canvas', 'wm-land');
  canvas.setAttribute('aria-hidden', 'true');
  const grid = element('div', 'wm-grid');
  const stops = places.map((place, i) => {
    const stop = element('a', 'wm-stop');
    const row = Math.floor(i / 2);
    const column = row % 2 === 0 ? i % 2 + 1 : 2 - i % 2;
    stop.style.gridColumn = column;
    stop.style.gridRow = row + 1;
    stop.href = '#workshop-' + place.id;
    const pin = element('span', 'wm-pin adv-scene', place.icon);
    pin.dataset.place = place.id;
    pin.setAttribute('aria-hidden', 'true');
    const title = element('strong', 'wm-place', place.name);
    const skill = element('span', 'wm-skill', place.skill);
    const count = element('span', 'wm-story-count');
    const badge = element('span', 'wm-badge');
    stop.append(pin, title, skill, count, badge);
    grid.append(stop);
    return stop;
  });

  const skills = element('details', 'wm-skills');
  skills.append(element('summary', '', 'Мои навыки'));
  const skillRows = [
    ['share', 'Раздаю поровну'],
    ['pack', 'Собираю полные наборы'],
    ['count', 'Считаю равными группами']
  ].map(([kind, name]) => {
    const total = places.reduce((sum, place) => sum + place.scenes.filter(scene => scene.kind === kind).length, 0);
    const row = element('div', 'wm-skill-row');
    row.dataset.skill = kind;
    const title = element('strong', '', name);
    const value = element('span', 'wm-skill-count');
    const meter = element('progress', 'wm-skill-meter');
    meter.max = total;
    meter.setAttribute('aria-label', name + '. Решено историй');
    row.append(title, value, meter);
    skills.append(row);
    return {kind, total, value, meter};
  });

  board.append(canvas, grid);
  drawer.append(summary, board, skills);
  nav.replaceChildren(drawer);

  function reflect() {
    const record = window.ArzhenikovWorkshopProgress?.() || {};
    const active = record.active || places[0].id;
    const done = places.filter(p => record.completed?.includes(p.id));
    progress.textContent = 'Открытки ' + done.length + '/' + places.length;
    for (const {kind, total, value, meter} of skillRows) {
      const solved = Math.min(total, Math.max(0, Number(record.skills?.[kind]) || 0));
      value.textContent = 'Решено ' + solved + ' из ' + total;
      meter.value = solved;
      meter.setAttribute('aria-valuetext', solved + ' из ' + total + ' историй');
    }
    places.forEach((place, i) => {
      const stop = stops[i], current = active === place.id;
      const complete = done.includes(place);
      if (current) stop.setAttribute('aria-current', 'location');
      else stop.removeAttribute('aria-current');
      stop.dataset.complete = String(complete);
      const solved = Math.min(place.scenes.length, Math.max(0, Number(record.placeCounts?.[place.id]?.solved) || 0));
      stop.querySelector('.wm-story-count').textContent = solved + '/' + place.scenes.length + ' историй';
      const badge = stop.lastElementChild;
      badge.textContent = complete ? '✓' : '';
      badge.setAttribute('aria-hidden', 'true');
      stop.setAttribute('aria-label', place.name + '. ' + place.skill + '. Решено ' + solved + ' из ' + place.scenes.length + ' историй' + (complete ? '. Открытка в альбоме' : ''));
    });
  }

  function focusTask() {
    const host = document.getElementById('workshop-play');
    if (!host) return;
    drawer.open = false;
    const heading = host.querySelector('.ws-title, h3, h2') || host;
    heading.tabIndex = -1;
    heading.focus({preventScroll: true});
    heading.scrollIntoView({block: 'start'});
  }

  let chosen = '';
  grid.addEventListener('click', event => {
    const stop = event.target.closest('a.wm-stop');
    if (!stop || event.defaultPrevented || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey || event.button !== 0) return;
    if (stop.getAttribute('aria-current') === 'location') {
      // The bare city URL already shows this place. Keep the live controls
      // when making its address explicit so the next key goes to the pupil's choice.
      if (location.hash !== stop.hash) history.pushState(history.state, '', stop.hash);
      event.preventDefault();
      chosen = '';
      focusTask();
      return;
    }
    chosen = stop.hash;
  });
  window.addEventListener('hashchange', () => {
    if (chosen && chosen === location.hash) focusTask();
    chosen = '';
  });
  window.addEventListener('workshop-progress', reflect);

  // Draw the footpath through the actual pin positions, even when a label wraps.
  function draw() {
    const w = board.clientWidth, h = board.clientHeight;
    if (!w || !h) return;
    const c = canvas.getContext('2d');
    if (!c) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    c.scale(ratio, ratio);
    const boardRect = board.getBoundingClientRect();
    const pins = stops.map(stop => {
      const p = stop.firstElementChild.getBoundingClientRect();
      return {x: p.left - boardRect.left + p.width / 2, y: p.top - boardRect.top + p.height / 2};
    });
    function ellipse(x, y, rx, ry, fill, angle = 0) {
      c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      c.fillStyle = fill; c.fill();
    }
    function stroke(path, color, width, dash = []) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash);
      c.stroke(path); c.setLineDash([]);
    }
    // Grounds, stream, and clumps of trees on the edge of the map.
    ellipse(w * .2, h * .14, w * .37, h * .15, '#dde8b9', -.22);
    ellipse(w * .78, h * .47, w * .36, h * .18, '#e5edc0', .15);
    ellipse(w * .26, h * .77, w * .36, h * .17, '#dce8b5', -.10);
    const stream = new Path2D();
    stream.moveTo(w * .89, -12);
    stream.bezierCurveTo(w * 1.05, h * .2, w * .8, h * .3, w * .93, h * .41);
    stream.bezierCurveTo(w * 1.22, h * .65, w * .66, h * .74, w * .9, h + 16);
    stroke(stream, '#adcdb9', 24); stroke(stream, '#b9dfdc', 18);
    stroke(stream, '#def4e9', 1.2, [9, 17]);
    function tree(x, y, s) {
      ellipse(x + 3*s, y + 5*s, 9*s, 3*s, '#b7c998', -.1);
      c.fillStyle = '#947b5a'; c.fillRect(x - 1.4*s, y, 2.8*s, 6*s);
      ellipse(x, y - 4*s, 7.4*s, 8*s, '#86b88e');
      ellipse(x - 2*s, y - 6*s, 5.5*s, 6*s, '#a2c899');
    }
    [[.07,.07,.9],[.12,.055,.75],[.055,.32,.75],[.49,.22,.9],[.52,.20,.7],
     [.04,.56,.8],[.08,.54,.65],[.49,.69,.9],[.53,.68,.8],[.95,.89,1],
     [.13,.96,1],[.18,.95,.8]].forEach(([x,y,s]) => tree(x*w, y*h, s));
    for (let i=0; i<39; i++) {
      const x=((i*211+73)%991)/991*w, y=((i*457+117)%983)/983*h;
      const grass = new Path2D();
      grass.moveTo(x-2,y); grass.lineTo(x,y+2); grass.lineTo(x+2,y-1);
      stroke(grass, '#acbe8e', 1.1);
    }
    const trail = new Path2D();
    trail.moveTo(pins[0].x, pins[0].y);
    for (let i=1; i<pins.length; i++) {
      const a = pins[i-1], b = pins[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        trail.bezierCurveTo(a.x + dx*.42, a.y-13, a.x + dx*.64, b.y+7, b.x, b.y);
      } else {
        const bend = a.x < w * .5 ? -35 : 35;
        trail.bezierCurveTo(a.x+bend, a.y+dy*.35, b.x+bend, a.y+dy*.65, b.x, b.y);
      }
    }
    stroke(trail, '#ceb990', 10); stroke(trail, '#fff1cb', 7);
    stroke(trail, '#b59562', 1.2, [2,5]);
  }
  let pending = 0;
  function redraw() {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(draw);
  }
  drawer.addEventListener('toggle', redraw);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(redraw).observe(board);
  else window.addEventListener('resize', redraw);
  reflect(); redraw();
})();
