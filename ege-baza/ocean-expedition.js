(function () {
  'use strict';

  const width = 1040;
  const height = 550;
  const tasksPerStation = 3;
  const stations = [
    { name: 'Поверхность океана', x: 132, y: 77, color: '#9ce9ef', description: 'Рассчитай запасы перед погружением, переведи единицы и прочитай данные приборов.' },
    { name: 'Коралловый риф', x: 283, y: 179, color: '#ffc4ae', description: 'Вычисли значения по формулам, оцени вероятность и сравни варианты маршрута.' },
    { name: 'Водоворот', x: 478, y: 103, color: '#9ce9ef', description: 'Разберись, как меняется график, проверь логический вывод и найди площадь на сетке.' },
    { name: 'Затонувшие корабли', x: 627, y: 233, color: '#f8d596', description: 'Читай план в масштабе, рассчитывай объём и решай задачи на свойства фигур.' },
    { name: 'Атлантида', x: 362, y: 337, color: '#9be8cc', description: 'Исследуй объёмные фигуры, потренируйся считать с дробями, долями и процентами.' },
    { name: 'Логово чудовищ', x: 747, y: 348, color: '#d8c9ff', description: 'Упрости выражения, реши уравнения и отметь допустимые числа на оси.' },
    { name: 'Марианская впадина', x: 882, y: 467, color: '#f8d596', description: 'Спустись в батискафе к заданиям на делимость, движение и поиск закономерностей.', labelLeft: true }
  ];
  const missions = [
    {
      pos: 1, answer: 9,
      prompt: 'На лодку нужно погрузить 65 порций. В одной герметичной упаковке 8 порций. Сколько целых упаковок нужно взять?',
      hint: 'Сравни 8 × 8 с числом нужных порций.',
      explanation: 'В восьми упаковках 64 порции. Чтобы порций хватило, нужна девятая упаковка.'
    },
    {
      pos: 5, answer: 3,
      prompt: 'Для съёмки наугад выбирают одну из 20 точек. Все точки равновероятны. Сейчас 7 точек подходят для наблюдения. Сколько из оставшихся точек нужно сделать подходящими, чтобы вероятность выбрать подходящую точку стала равна 1/2?',
      hint: 'Чтобы вероятность была равна 1/2, подходить должна половина всех точек.',
      explanation: 'Половина от 20 — это 10. Из них 7 уже подходят, остаётся 10 − 7 = 3 точки.'
    },
    {
      pos: 7, answer: 8,
      prompt: 'На прямолинейном участке графика глубина за 4 минуты увеличилась с 36 до 68 м. На сколько метров в минуту увеличивалась глубина?',
      hint: 'Раздели изменение глубины на время.',
      explanation: 'Глубина увеличилась на 68 − 36 = 32 м за 4 минуты. За минуту она увеличивалась на 32 : 4 = 8 м.'
    },
    {
      pos: 10, answer: 36,
      prompt: 'На плане масштаба 1:200 длина корпуса корабля 18 см. Какова длина корабля в метрах?',
      hint: 'Один сантиметр на плане соответствует 200 см в действительности.',
      explanation: 'Длина корабля 18 × 200 = 3600 см, то есть 36 м.'
    },
    {
      pos: 15, answer: 70,
      prompt: 'После чистки видно 60% мозаики Атлантиды. Это 42 плитки. Сколько плиток во всей мозаике?',
      hint: 'Запиши 60% десятичной дробью. Раздели число видимых плиток на эту дробь.',
      explanation: 'Если 0,6 от числа плиток равно 42, то всего плиток 42 : 0,6 = 70.'
    },
    {
      pos: 17, answer: 7,
      prompt: 'У логова чудовищ лодка поймала эхо. Компьютер записал уравнение 3x + 8 = 29, где x — время прихода эха в секундах. Через сколько секунд пришло эхо?',
      hint: 'Вычти 8 из обеих частей уравнения, затем раздели обе части на 3.',
      explanation: 'Из 3x + 8 = 29 получаем 3x = 21 и x = 7.'
    },
    {
      pos: 20, answer: 12,
      prompt: 'Батискаф с глубины 6000 м спускается на 30 м/мин, а зонд с глубины 6600 м поднимается на 20 м/мин. Через сколько минут они окажутся на одной глубине?',
      hint: 'На сколько метров уменьшается разность глубин за одну минуту?',
      explanation: 'Между батискафом и зондом 600 м по вертикали. Разность глубин уменьшается на 30 + 20 = 50 м в минуту, поэтому они окажутся на одной глубине через 600 : 50 = 12 минут.'
    }
  ];

  const number = index => String(index + 1).padStart(2, '0');
  const taskRange = index => '№' + (index * tasksPerStation + 1) + '–' + ((index + 1) * tasksPerStation);
  const escape = value => String(value).replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));

  function markup(tasks) {
    if (tasks.length !== stations.length * tasksPerStation) return '';
    return `<section class="ocean-expedition" aria-labelledby="ocean-expedition-title">
      <div class="ocean-expedition-header">
        <div><h2 id="ocean-expedition-title">Подводная экспедиция</h2><p>Выбери место на карте, чтобы направить лодку к заданиям ЕГЭ.</p></div>
        <button class="ocean-expedition-motion" type="button" hidden>Пауза анимации</button>
      </div>
      <div class="ocean-expedition-chart">
        <canvas aria-hidden="true"></canvas>
        <div class="ocean-expedition-pins" role="group" aria-label="Станции экспедиции">
          ${stations.map((station, index) => `<button type="button" class="ocean-expedition-pin${station.labelLeft ? ' ocean-expedition-pin-left' : ''}"
            style="--x:${station.x / width * 100}%;--y:${station.y / height * 100}%;--station-color:${station.color}"
            data-ocean-station="${index}" aria-pressed="${index === selected}" aria-label="${station.name}, задания ${taskRange(index)}">
            <span class="ocean-expedition-pin-dot" aria-hidden="true">${number(index)}</span>
            <span class="ocean-expedition-pin-name" aria-hidden="true">${station.name}</span>
          </button>`).join('')}
        </div>
      </div>
      <div class="ocean-expedition-controls">
        <label class="ocean-expedition-mobile-select">Станция
          <select>${stations.map((station, index) => `<option value="${index}" ${index === selected ? 'selected' : ''}>${station.name}</option>`).join('')}</select>
        </label>
        <div class="ocean-expedition-step" role="group" aria-label="По порядку">
          <button type="button" data-ocean-step="-1" aria-label="Предыдущая станция">←</button>
          <button type="button" data-ocean-step="1" aria-label="Следующая станция">→</button>
        </div>
      </div>
      <div class="ocean-expedition-info">${stationMarkup(tasks, selected)}</div>
      <span class="ocean-expedition-announcement" role="status"></span>
    </section>`;
  }

  function stationMarkup(tasks, index) {
    const station = stations[index];
    const mission = missions[index];
    const group = tasks.slice(index * tasksPerStation, (index + 1) * tasksPerStation);
    const progress = group.every(task => Number.isInteger(task.independent))
      ? `<p class="ocean-expedition-progress">Темы с самостоятельным решением: ${group.reduce((sum, task) => sum + task.independent, 0)} из ${group.reduce((sum, task) => sum + task.total, 0)}</p>`
      : '';
    return `<div class="ocean-expedition-station">
      <p class="ocean-expedition-craft">${index === stations.length - 1 ? 'Батискаф' : 'Подводная лодка'}</p>
      <h3>${station.name}</h3><p class="ocean-expedition-description">${station.description}</p>${progress}
    </div>
    <ul class="ocean-expedition-tasks" aria-label="Задания этой станции">
      ${group.map(task => `<li><a href="${escape(task.href)}"><span class="ocean-expedition-task-number">№${task.pos}</span><span class="ocean-expedition-task-title">${escape(task.title)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}
    </ul>
    <details class="ocean-expedition-mission">
      <summary>Задача экспедиции <span>№${mission.pos}</span></summary>
      <p id="ocean-expedition-mission-prompt">${mission.prompt}</p>
      <form data-ocean-mission>
        <label>Ответ <input name="answer" inputmode="numeric" autocomplete="off" aria-describedby="ocean-expedition-mission-prompt"></label>
        <button type="submit">Проверить</button>
      </form>
      <p role="status" data-ocean-mission-feedback></p>
    </details>`;
  }

  let selected = 0;
  let motionChoice;

  function mount(main, tasks) {
    const section = main.querySelector('.ocean-expedition');
    if (!section) return () => {};
    const canvas = section.querySelector('canvas');
    const context = land && typeof CanvasRenderingContext2D === 'function' ? canvas.getContext('2d') : null;
    const chart = section.querySelector('.ocean-expedition-chart');
    const info = section.querySelector('.ocean-expedition-info');
    const announcement = section.querySelector('.ocean-expedition-announcement');
    const motion = section.querySelector('.ocean-expedition-motion');
    const selector = section.querySelector('select');
    const pins = [...section.querySelectorAll('[data-ocean-station]')];
    const previous = section.querySelector('[data-ocean-step="-1"]');
    const next = section.querySelector('[data-ocean-step="1"]');
    const preference = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const paused = () => motionChoice ?? preference?.matches ?? false;
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let position = craftPosition(stations[selected]);
    let animation = 0;
    let lastTime = 0;
    let time = 0;
    let visible = true;

    function paint(now) {
      animation = 0;
      if (!context || !canvas.width || !canvas.height) return;
      const dt = lastTime ? Math.min(40, now - lastTime) : 0;
      lastTime = now;
      if (!paused()) time += dt / 1000;
      const target = craftPosition(stations[selected]);
      const speed = paused() ? 1 : 1 - Math.exp(-dt / 190);
      position = position.map((value, index) => value + (target[index] - value) * speed);
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      drawOcean(context, time, position);
      if (!paused() && visible && !document.hidden) animation = requestAnimationFrame(paint);
    }

    function refreshMotion() {
      if (!context) return;
      cancelAnimationFrame(animation);
      lastTime = 0;
      motion.textContent = paused() ? 'Включить анимацию' : 'Пауза анимации';
      paint(performance.now());
    }

    function resize() {
      const { width: chartWidth, height: chartHeight } = chart.getBoundingClientRect();
      if (!chartWidth || !chartHeight) return;
      const scale = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(chartWidth * scale);
      canvas.height = Math.round(chartHeight * scale);
      refreshMotion();
    }

    function updateControls() {
      for (const [index, pin] of pins.entries()) pin.setAttribute('aria-pressed', String(index === selected));
      selector.value = selected;
      previous.setAttribute('aria-disabled', String(selected === 0));
      next.setAttribute('aria-disabled', String(selected === stations.length - 1));
    }

    function choose(index) {
      if (index === selected || !stations[index]) return;
      selected = index;
      updateControls();
      info.innerHTML = stationMarkup(tasks, selected);
      announcement.textContent = stations[selected].name + '. Задания ' + taskRange(index) + '.';
      if (paused() || !animation) refreshMotion();
    }

    for (const pin of pins) pin.addEventListener('click', () => choose(Number(pin.dataset.oceanStation)), options);
    for (const step of [previous, next]) step.addEventListener('click', () => choose(selected + Number(step.dataset.oceanStep)), options);
    selector.addEventListener('change', () => choose(Number(selector.value)), options);
    info.addEventListener('submit', event => {
      if (!event.target.matches('[data-ocean-mission]')) return;
      event.preventDefault();
      const { answer, hint, explanation } = missions[selected];
      const raw = event.target.elements.answer.value.trim().replace(',', '.');
      const feedback = info.querySelector('[data-ocean-mission-feedback]');
      const valid = /^[+-]?\d+(?:\.\d+)?$/.test(raw);
      const correct = valid && Number(raw) === answer;
      feedback.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = correct ? 'Верно. ' + explanation : valid ? hint : 'Введи число в поле «Ответ».';
    }, options);
    motion.addEventListener('click', () => { motionChoice = !paused(); refreshMotion(); }, options);
    preference?.addEventListener?.('change', () => { motionChoice = undefined; refreshMotion(); }, options);
    document.addEventListener('visibilitychange', refreshMotion, options);
    updateControls();

    const sizeObserver = context && typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    const viewObserver = context && typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refreshMotion(); })
      : null;
    if (context) {
      motion.hidden = false;
      if (sizeObserver) sizeObserver.observe(chart);
      else window.addEventListener('resize', resize, options);
      viewObserver?.observe(chart);
      resize();
    }
    return () => {
      listeners.abort();
      sizeObserver?.disconnect();
      viewObserver?.disconnect();
      if (animation) cancelAnimationFrame(animation);
    };
  }

  function craftPosition(station) {
    return [station.x - 48, station.y + 34, station === stations[stations.length - 1] ? 1 : 0];
  }

  // Keep the illustrated geometry in scene coordinates, shared with the DOM pins.
  const path = shape => new Path2D(shape);
  const land = typeof Path2D === 'function' ? {
    distant: path('M0 172 Q68 166 139 204 T283 256 Q369 227 447 274 T576 299 Q644 251 708 312 T825 343 Q865 351 880 428 L939 415 Q999 388 1040 399 V550 H0 Z'),
    floor: path('M0 239 Q77 225 144 273 T312 331 Q361 322 423 356 T548 413 Q618 402 677 433 Q741 405 790 445 L829 503 L859 523 L899 536 L930 510 L975 436 Q1004 416 1040 424 V550 H0 Z'),
    ledge: path('M0 352 Q103 336 180 380 Q219 404 282 398 Q370 409 457 467 T642 514 L794 550 H0 Z'),
    trench: path('M785 458 L815 469 L842 505 L866 517 L878 542 L905 548 L923 522 L956 505 L984 465 L1040 446 V550 H785 Z'),
    submarine: path('M-40 3 Q-32-13-8-16 L18-15 Q34-15 41-5 Q49 3 41 11 Q33 19 11 19 H-13 Q-35 17-40 7 Z'),
    face: path('M-4 4 Q0 1 4 4 L6 9 H-6 Z'),
    coral: path('M0 0 Q2-11 0-22 Q-2-35 2-43 M0-21 Q-8-22-13-32 M1-17 Q12-23 14-37 M11-26 L21-30 M-10-29 L-10-38 M0-9 Q-11-12-17-20'),
    wreckHull: path('M-77-5 L-54 3 L-24 0 L-13 8 L2 1 L16 5 L24 0 L67-9 L54 12 L36 23 L-34 24 L-55 15 Z'),
    brokenSail: path('M-13-63 L-14-20 L-3-25 L-7-33 L14-30 L7-49 L14-55 Z'),
    templeTowers: path('M-110 7 H-63 V-23 H-104 V-36 H-79 V-53 H-72 V-30 H-62 V-4 H62 V-26 H71 V-48 H78 V-28 H105 V-15 H73 V11 H108 V21 H-110 Z'),
    templeRoof: path('M-69-29 L0-65 L65-30 L57-22 L-62-22 Z'),
    templeFrieze: path('M-48-31 L0-55 L45-31 Z'),
    angler: path('M-36 0 Q-33-17-7-13 Q20-17 28 0 L44-10 L42 14 L26 7 Q1 23-22 13 L-36 10 L-25 5 Z'),
    hair: path('M-4-2 Q-6-7 0-7 Q6-7 4-1 Q3-5 1-4 Q-2-2-4-2 Z'),
    subBeam: path('M39-5 L138-23 L145 43 L39 11 Z'),
    subTail: path('M-40-4 L-54-11 L-54 14 L-39 9 Z'),
    subShade: path('M-35 10 Q-21 13 7 12 Q30 10 39 4 Q37 17 11 19 H-13 Q-29 18-35 10 Z'),
    subBridge: path('M-16-15 V-22 Q-15-26-10-26 H7 Q12-26 12-22 V-15 Z'),
    bathBeam: path('M10-3 L89 0 L86 50 L10 6 Z')
  } : null;

  function fill(ctx, color, shape) {
    ctx.fillStyle = color;
    ctx.fill(shape);
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(ctx, color, lineWidth, points) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  const grains = Array.from({ length: 95 }, (_, i) => ({
    x: (i * 229 + 17) % width,
    y: 46 + (i * 97) % 495,
    radius: 0.8 + (i % 7) * 0.27,
    color: i % 4 ? 'rgba(178,239,235,.25)' : 'rgba(159,247,223,.55)'
  }));

  function water(ctx, time) {
    const sea = ctx.createLinearGradient(0, 0, 0, height);
    sea.addColorStop(0, '#2395a5');
    sea.addColorStop(0.19, '#14617a');
    sea.addColorStop(0.52, '#112f50');
    sea.addColorStop(1, '#060c25');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, width, height);

    const light = ctx.createRadialGradient(144, 0, 6, 145, 0, 580);
    light.addColorStop(0, 'rgba(151,247,225,.51)');
    light.addColorStop(1, 'rgba(119,236,226,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    for (let x = 18; x < width; x += 118) {
      const drift = Math.sin(time * 0.35 + x) * 13;
      ctx.moveTo(x, 15);
      ctx.lineTo(x + 21, 12);
      ctx.lineTo(x + 247 + drift, 399);
      ctx.lineTo(x + 165 + drift, 342);
      ctx.closePath();
    }
    const rays = ctx.createLinearGradient(0, 0, 0, 410);
    rays.addColorStop(0, 'rgba(199,255,239,.18)');
    rays.addColorStop(1, 'rgba(155,250,228,0)');
    ctx.fillStyle = rays;
    ctx.fill();

    for (let row = 0; row < 5; row++) {
      ctx.beginPath();
      for (let x = -10; x <= width + 10; x += 9) {
        const y = 8 + 7 * row + 4 * Math.sin(x / 49 + time * (1 + row * 0.08) + row);
        if (x === -10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(193,249,238,.37)';
      ctx.lineWidth = row === 0 ? 2.4 : 1.15;
      ctx.stroke();
    }

    for (const grain of grains) ellipse(ctx, grain.x + 9 * Math.sin(grain.y + time * .45), grain.y - 7 * Math.sin(time * .24 + grain.x), grain.radius, grain.radius, grain.color);
  }

  function reef(ctx) {
    ctx.save();
    ctx.translate(262, 221);
    ellipse(ctx, 0, 9, 102, 16, '#235268');
    for (const [x, y, scale, angle, color] of [
      [-80, 11, .7, -.35, '#6fb4ad'], [-57, 12, 1.06, -.37, '#ee967f'],
      [-33, 11, .72, .18, '#f6b495'], [-11, 10, 1.14, .15, '#e895b3'],
      [14, 13, .76, .3, '#f3b092'], [32, 10, .91, -.09, '#ee967f'],
      [61, 10, 1.19, .27, '#75b6b2'], [80, 13, .6, .36, '#d891bc']
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.stroke(land.coral);
      ctx.restore();
    }
    ctx.restore();
  }

  function whirlpool(ctx, time) {
    ctx.save();
    ctx.translate(488, 60);
    ctx.scale(1, .36);
    ctx.lineCap = 'round';
    for (let band = 0; band < 3; band++) {
      ctx.beginPath();
      for (let step = 0; step <= 89; step++) {
        const radius = 8 + step * .74;
        const angle = step * .07 + time * .7 + band * Math.PI * 2 / 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ['#b3f6e7', '#73d8da', '#48a7bd'][band];
      ctx.lineWidth = 3.8 - band * .8;
      ctx.stroke();
    }
    ctx.restore();
  }

  function wreck(ctx, x, y, scale, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    fill(ctx, color, land.wreckHull);
    line(ctx, '#758d98', 2, [[-61, 4], [-39, 11], [29, 11], [55, 2]]);
    line(ctx, color, 5, [[-15, 4], [-13, -65]]);
    line(ctx, color, 4, [[25, 3], [24, -43]]);
    line(ctx, '#758d98', 2, [[-38, -50], [5, -51]]);
    fill(ctx, '#466878', land.brokenSail);
    for (const x of [-33, -13, 7, 26, 44]) ellipse(ctx, x, 15, 3, 2, '#182d43');
    ctx.restore();
  }

  function temple(ctx) {
    ctx.save();
    ctx.translate(369, 370);
    ellipse(ctx, 2, 15, 110, 22, '#244b61');
    fill(ctx, '#4a8490', land.templeTowers);
    fill(ctx, '#8fc3bf', land.templeRoof);
    fill(ctx, '#55909c', land.templeFrieze);
    for (const x of [-50, -25, 0, 25, 50]) {
      ctx.fillStyle = '#85b5b2';
      ctx.fillRect(x - 3, -21, 6, 27);
      ctx.fillStyle = '#b9d5c4';
      ctx.fillRect(x - 6, -21, 12, 3);
      ctx.fillRect(x - 6, 3, 12, 3);
    }
    line(ctx, '#7aadae', 4, [[-65, 9], [66, 9]]);
    line(ctx, '#61979f', 3, [[-73, 14], [74, 14]]);
    ctx.restore();
  }

  function creatures(ctx, time) {
    ctx.save();
    ctx.translate(757, 388 + Math.sin(time * 1.2) * 3);
    ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, 1);
      ctx.bezierCurveTo(i * 13, 18, i * 29 + Math.sin(time * 1.8 + i) * 9, 21, i * 24, 43 + Math.sin(time + i) * 6);
      ctx.strokeStyle = i % 2 ? '#776ca0' : '#a08bb3';
      ctx.lineWidth = 7 - Math.abs(i);
      ctx.stroke();
    }
    ellipse(ctx, 0, -11, 28, 26, '#8274a7');
    ellipse(ctx, -10, -9, 5, 6, '#e2dcf7');
    ellipse(ctx, 10, -9, 5, 6, '#e2dcf7');
    ellipse(ctx, -9, -8, 2.5, 3, '#1a2340');
    ellipse(ctx, 9, -8, 2.5, 3, '#1a2340');
    ctx.restore();

    ctx.save();
    ctx.translate(954, 351 + Math.sin(time + .7) * 5);
    fill(ctx, '#33485f', land.angler);
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.quadraticCurveTo(-15, -34, -36, -23);
    ctx.strokeStyle = '#6b9eaf';
    ctx.lineWidth = 2;
    ctx.stroke();
    ellipse(ctx, -36, -23, 4, 4, '#b5f9df');
    ellipse(ctx, -20, -5, 3, 2.5, '#e2efad');
    ctx.restore();
  }

  function pilot(ctx, x, y, radius) {
    ellipse(ctx, x, y, radius + 2.7, radius + 2.7, '#85583c');
    ellipse(ctx, x, y, radius, radius, '#233d55');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius / 10, radius / 10);
    fill(ctx, '#65b4c2', land.face);
    ellipse(ctx, 0, -2, 4, 5, '#f1b888');
    fill(ctx, '#694d58', land.hair);
    ellipse(ctx, -4.5, -6, 1.25, 1.25, '#9fdee5');
    ctx.restore();
  }

  function vessel(ctx, position, time) {
    const [x, baseY, deployment] = position;
    const y = baseY + Math.sin(time * 2.1) * 3;
    const subX = x - 36 * deployment;
    const subY = y - 62 * deployment;
    const bathX = x - 7 + 25 * deployment;
    const bathY = y + 25 - 11 * deployment;
    ctx.beginPath();
    ctx.moveTo(subX - 8, subY + 13);
    ctx.quadraticCurveTo(subX - 1, bathY + 4, bathX, bathY);
    ctx.strokeStyle = '#9ac5c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(subX, subY);
    const beam = ctx.createLinearGradient(41, 0, 131, 11);
    beam.addColorStop(0, 'rgba(255,235,162,.46)');
    beam.addColorStop(1, 'rgba(255,235,162,0)');
    fill(ctx, beam, land.subBeam);
    fill(ctx, '#ac7049', land.subTail);
    fill(ctx, '#ffdc92', land.submarine);
    fill(ctx, '#d09058', land.subShade);
    fill(ctx, '#ffdc92', land.subBridge);
    line(ctx, '#f4bb71', 3, [[-4, -26], [-4, -37], [4, -37]]);
    ellipse(ctx, -18, 0, 5, 5, '#3e5869');
    if (deployment < .55) pilot(ctx, 12, 0, 10);
    else ellipse(ctx, 12, 0, 10, 10, '#526979');
    ellipse(ctx, 40, 1, 3, 4, '#fff7cb');
    ctx.restore();

    ctx.save();
    ctx.translate(bathX, bathY);
    const bathBeam = ctx.createLinearGradient(10, 1, 85, 25);
    bathBeam.addColorStop(0, 'rgba(171,242,239,.43)');
    bathBeam.addColorStop(1, 'rgba(171,242,239,0)');
    fill(ctx, bathBeam, land.bathBeam);
    ellipse(ctx, 0, 0, 15, 12, '#d7a66f');
    if (deployment >= .55) pilot(ctx, 2, 0, 8);
    else ellipse(ctx, 2, 0, 7, 6, '#476377');
    ellipse(ctx, 14, 1, 3, 3, '#e6ffed');
    line(ctx, '#edbf83', 2, [[-9, 11], [-11, 15], [11, 15]]);
    ctx.restore();
  }

  function drawOcean(ctx, time, position) {
    water(ctx, time);
    fill(ctx, 'rgba(28,65,86,.72)', land.distant);
    fill(ctx, '#1b3a53', land.floor);
    fill(ctx, '#172e48', land.ledge);
    fill(ctx, '#101c38', land.trench);
    line(ctx, '#3a5870', 2, [[787, 458], [816, 471], [842, 505], [866, 517], [878, 542]]);
    line(ctx, '#365773', 2, [[911, 545], [928, 518], [956, 505], [984, 465], [1040, 446]]);
    reef(ctx);
    whirlpool(ctx, time);
    wreck(ctx, 645, 272, 1, -.13, '#577a89');
    wreck(ctx, 706, 282, .58, .24, '#416172');
    temple(ctx);
    creatures(ctx, time);
    ctx.save();
    ctx.setLineDash([2.5, 8]);
    ctx.lineCap = 'round';
    line(ctx, 'rgba(199,237,224,.52)', 2, stations.map(station => [station.x, station.y]));
    ctx.restore();
    vessel(ctx, position, time);
  }

  globalThis.EgeBazaOceanExpedition = Object.freeze({ markup, mount });
})();
