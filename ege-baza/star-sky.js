/* Star atlas for the existing EGE base course: no progress writes or remote dependencies. */
(function installStarSky(root) {
  'use strict';
  // Decorative navigation. Existing course stores are read by the caller only.
  const groups = [
    { name: 'Числа и расчёты', positions: [1, 2, 6, 14, 15], color: '#f5d79b' },
    { name: 'Данные и логика', positions: [3, 5, 7, 8], color: '#a9d8ef' },
    { name: 'Алгебра', positions: [4, 16, 17, 18], color: '#c4b5ed' },
    { name: 'Планиметрия', positions: [9, 10, 12], color: '#99dcc9' },
    { name: 'Стереометрия', positions: [11, 13], color: '#a7bff6' },
    { name: 'Рассуждения', positions: [19, 20, 21], color: '#f1bacb' }
  ];
  // Percent coordinates: desktop x/y, narrow screen x/y.
  const points = {
    1: [8, 18, 9, 13], 2: [19, 9, 29, 8], 6: [28, 24, 49, 16],
    14: [13, 39, 69, 10], 15: [30, 45, 89, 18],
    3: [44, 11, 14, 34], 5: [54, 28, 38, 29],
    7: [44, 49, 62, 36], 8: [62, 46, 86, 31],
    4: [71, 13, 10, 50], 16: [85, 10, 34, 55],
    17: [92, 31, 58, 49], 18: [78, 45, 84, 54],
    9: [9, 68, 9, 69], 10: [23, 83, 29, 75],
    12: [35, 68, 49, 68], 11: [49, 80, 69, 76],
    13: [61, 89, 89, 69], 19: [73, 70, 22, 91],
    20: [87, 65, 50, 89], 21: [90, 88, 78, 92]
  };
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const mounted = new WeakMap();
  let selectedPosition = 1;
  let motionChoice = null;
  function tasksOnly(tasks) {
    const seen = new Set();
    return (Array.isArray(tasks) ? tasks : []).filter(task => task &&
      Number.isInteger(task.pos) && points[task.pos] && !seen.has(task.pos) && seen.add(task.pos)
    ).slice().sort((a, b) => a.pos - b.pos);
  }
  function knownCount(value, total) {
    return Number.isSafeInteger(value) && value >= 0 && Number.isSafeInteger(total) && total >= value;
  }
  function status(task) {
    if (!knownCount(task.independent, task.total) || !knownCount(task.started, task.total)) return 'unknown';
    return task.independent > 0 ? 'independent' : task.started > 0 ? 'started' : 'unstarted';
  }
  function progressText(task) {
    return knownCount(task.independent, task.total)
      ? 'Тем с самостоятельным решением: ' + task.independent + ' из ' + task.total + '.'
      : 'Часть результатов сейчас недоступна.';
  }
  function detail(task) {
    if (!task) return '';
    const count = Number.isSafeInteger(task.total) && task.total >= 0 ? task.total : null;
    return `<p class="sky-detail-number">Задание №${task.pos}</p>
      <h3>${escape(task.title)}</h3>
      <p class="sky-detail-description">${escape(task.description)}</p>
      ${count === null ? '' : `<p class="sky-detail-count">Тренажёров: <strong>${count}</strong></p>`}
      <p class="sky-detail-progress">${escape(progressText(task))}</p>
      <div class="sky-detail-actions">
        <a class="sky-action" data-sky-open href="#task?pos=${task.pos}">Открыть темы <span aria-hidden="true">↗</span></a>
        <a class="sky-action sky-action-secondary" data-sky-skills href="#task?pos=${task.pos}&amp;skills=1">Карта навыков</a>
      </div>`;
  }
  function lines(narrow, available) {
    const offset = narrow ? 2 : 0;
    return `<svg class="sky-lines ${narrow ? 'sky-lines-narrow' : 'sky-lines-wide'}" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      ${groups.map(group => {
        const sequence = group.positions.filter(pos => available.has(pos));
        return sequence.length < 2 ? '' : `<polyline points="${sequence.map(pos => points[pos][offset] * 10 + ',' + points[pos][offset + 1] * 10).join(' ')}" stroke="${group.color}" vector-effect="non-scaling-stroke" />`;
      }).join('')}
    </svg>`;
  }
  function markup(rawTasks) {
    const tasks = tasksOnly(rawTasks);
    if (!tasks.length) return '';
    const selection = tasks.find(task => task.pos === selectedPosition) || tasks[0];
    const available = new Set(tasks.map(task => task.pos));
    const total = tasks.reduce((sum, task) => sum + (Number.isSafeInteger(task.total) ? task.total : 0), 0);
    return `<section class="star-sky" aria-labelledby="sky-title" data-motion="paused" data-sky-paused="false">
      <div class="sky-header">
        <div><p class="sky-eyebrow">От первых шагов к экзамену</p><h2 id="sky-title">Звёздная карта курса</h2><p class="sky-intro">Выбери номер задания — откроются его темы и навыки.</p></div>
        <button class="sky-pause" type="button" data-sky-pause aria-pressed="false" aria-label="Остановить движение метеоритов и кометы"><span aria-hidden="true">Ⅱ</span> Пауза</button>
      </div>
      <div class="sky-layout">
        <div class="sky-chart" role="group" aria-label="Звёзды — номера заданий базового ЕГЭ">
          <canvas class="sky-canvas" aria-hidden="true"></canvas>
          ${lines(false, available)}${lines(true, available)}
          ${tasks.map(task => {
            const p = points[task.pos], state = status(task), current = task.pos === selection.pos;
            return `<button class="sky-point sky-point-${state}" type="button" data-star-position="${task.pos}" aria-pressed="${current}" aria-controls="sky-detail" aria-label="Задание №${task.pos}: ${escape(task.title)}. ${escape(progressText(task))}" style="--star-x:${p[0]}%;--star-y:${p[1]}%;--star-mobile-x:${p[2]}%;--star-mobile-y:${p[3]}%">
              <span class="sky-point-number">${task.pos}</span>${state === 'independent' ? '<span class="sky-point-evidence" aria-hidden="true">✓</span>' : ''}
            </button>`;
          }).join('')}
        </div>
        <div id="sky-detail" class="sky-detail" data-sky-detail aria-live="polite" aria-atomic="true">${detail(selection)}</div>
      </div>
      <div class="sky-footer">
        <div class="sky-legend" aria-label="Отметки результатов"><span><i class="sky-key sky-key-unstarted" aria-hidden="true"></i>Ещё не начато</span><span><i class="sky-key sky-key-started" aria-hidden="true"></i>Есть работа</span><span><i class="sky-key sky-key-independent" aria-hidden="true"></i>Есть самостоятельное решение</span></div>
        <p class="sky-caption">Заданий: ${tasks.length} · тренажёров: ${total}. Отметки относятся к отдельным темам, а не к готовности ко всему номеру.</p>
      </div>
    </section>`;
  }
  function mount(host, rawTasks) {
    const sky = host && (host.matches && host.matches('.star-sky') ? host : host.querySelector && host.querySelector('.star-sky'));
    if (!sky) return () => {};
    const previous = mounted.get(sky);
    if (previous) previous();
    const tasks = tasksOnly(rawTasks), buttons = Array.from(sky.querySelectorAll('[data-star-position]'));
    const panel = sky.querySelector('[data-sky-detail]'), pause = sky.querySelector('[data-sky-pause]');
    const canvas = sky.querySelector('canvas'), chart = sky.querySelector('.sky-chart');
    if (!tasks.length || !panel || !pause || !canvas || !chart) return () => {};
    const doc = sky.ownerDocument || root.document;
    const media = typeof root.matchMedia === 'function' ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
    let disposed = false, inView = true, raf = 0, width = 1, height = 1, lastPaint = 0;
    let context = null;
    // A DOM implementation may expose a canvas element without a rendering engine.
    // Check the rendering capability before getContext, which otherwise reports an error.
    if (typeof root.CanvasRenderingContext2D === 'function') {
      try { context = canvas.getContext('2d'); } catch (error) { /* Static CSS stars remain visible. */ }
    }
    const effectivePause = () => motionChoice === null ? !!(media && media.matches) : motionChoice;
    function select(pos) {
      const task = tasks.find(item => item.pos === pos);
      if (!task) return;
      selectedPosition = task.pos;
      for (const button of buttons) button.setAttribute('aria-pressed', String(Number(button.dataset.starPosition) === task.pos));
      panel.innerHTML = detail(task);
    }
    function onClick(event) {
      const button = event.target && event.target.closest ? event.target.closest('[data-star-position]') : null;
      if (button && sky.contains(button)) select(Number(button.dataset.starPosition));
    }
    // Native buttons remain usable with Tab, Enter and Space; arrow keys are a convenience.
    function onKey(event) {
      const button = event.target && event.target.closest ? event.target.closest('[data-star-position]') : null;
      if (!button || !sky.contains(button) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const current = buttons.indexOf(button);
      let next = -1;
      if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (current + buttons.length - 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next < 0) return;
      event.preventDefault();
      buttons[next].focus();
      select(Number(buttons[next].dataset.starPosition));
    }
    function paint(seconds) {
      if (!context || disposed) return;
      context.clearRect(0, 0, width, height);
      // Fixed positions avoid a distracting reshuffle after resize or course refresh.
      for (let i = 0; i < 84; i++) {
        const x = ((i * 149 + 29) % 997) / 997 * width;
        const y = ((i * i * 31 + 113) % 991) / 991 * height;
        const r = i % 13 === 0 ? 1.25 : i % 3 === 0 ? .8 : .55;
        const alpha = .22 + (i % 5) * .09 + .045 * Math.sin(seconds * .45 + i);
        context.fillStyle = 'rgba(220,233,255,' + alpha.toFixed(3) + ')';
        context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
      }
      if (effectivePause()) return;
      // A short meteor passes occasionally; the slower comet has a broad, soft tail.
      const meteor = seconds % 9;
      if (meteor < 1.35) {
        const band = Math.floor(seconds / 9) % 3;
        const x = width * (.12 + band * .22) + meteor * (width * .31 + 100);
        const y = -25 + meteor * (height * .33 + 45);
        const tail = 62, dx = tail * .83, dy = tail * .56;
        const gradient = context.createLinearGradient(x - dx, y - dy, x, y);
        gradient.addColorStop(0, 'rgba(227,240,255,0)');
        gradient.addColorStop(1, 'rgba(241,247,255,.85)');
        context.strokeStyle = gradient; context.lineWidth = 1.5;
        context.beginPath(); context.moveTo(x - dx, y - dy); context.lineTo(x, y); context.stroke();
      }
      const phase = (seconds + 7) % 31;
      if (phase < 14) {
        const u = phase / 14, x = -130 + u * (width + 320), y = height * (.19 + .42 * u);
        const length = Math.min(150, width * .32), gradient = context.createLinearGradient(x - length, y - 34, x, y);
        gradient.addColorStop(0, 'rgba(126,189,255,0)');
        gradient.addColorStop(.78, 'rgba(153,210,242,.15)');
        gradient.addColorStop(1, 'rgba(213,237,248,.55)');
        context.fillStyle = gradient;
        context.beginPath(); context.moveTo(x, y); context.lineTo(x - length, y - 43); context.quadraticCurveTo(x - length * .65, y + 2, x, y); context.fill();
        const glow = context.createRadialGradient(x, y, 0, x, y, 11);
        glow.addColorStop(0, 'rgba(248,247,227,.9)'); glow.addColorStop(.15, 'rgba(213,242,250,.65)'); glow.addColorStop(1, 'rgba(129,201,252,0)');
        context.fillStyle = glow; context.beginPath(); context.arc(x, y, 11, 0, Math.PI * 2); context.fill();
      }
    }
    function sizeCanvas() {
      if (disposed || !context) return;
      const box = chart.getBoundingClientRect();
      width = Math.max(1, box.width); height = Math.max(1, box.height);
      const ratio = Math.min(1.5, Math.max(1, Number(root.devicePixelRatio) || 1));
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint(0);
    }
    function canRun() {
      return !disposed && !!context && !effectivePause() && inView && !(doc && doc.hidden) && typeof root.requestAnimationFrame === 'function';
    }
    function frame(now) {
      raf = 0;
      if (!canRun()) { syncMotion(); return; }
      if (!lastPaint || now - lastPaint >= 1000 / 30) { paint(now / 1000); lastPaint = now; }
      raf = root.requestAnimationFrame(frame);
    }
    function syncMotion() {
      if (disposed) return;
      const paused = effectivePause();
      sky.dataset.skyPaused = String(paused);
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? 'Включить движение метеоритов и кометы' : 'Остановить движение метеоритов и кометы');
      pause.innerHTML = paused ? '<span aria-hidden="true">▷</span> Движение' : '<span aria-hidden="true">Ⅱ</span> Пауза';
      const running = canRun();
      sky.dataset.motion = running ? 'running' : 'paused';
      if (!running && raf) { root.cancelAnimationFrame(raf); raf = 0; }
      if (running && !raf) raf = root.requestAnimationFrame(frame);
      if (!running) paint(0);
    }
    function toggleMotion() { motionChoice = !effectivePause(); syncMotion(); }
    function onVisibility() { syncMotion(); }
    function onPreference() { syncMotion(); }
    sky.addEventListener('click', onClick);
    sky.addEventListener('keydown', onKey);
    pause.addEventListener('click', toggleMotion);
    if (doc) doc.addEventListener('visibilitychange', onVisibility);
    if (media && media.addEventListener) media.addEventListener('change', onPreference);
    else if (media && media.addListener) media.addListener(onPreference);
    let resizeObserver = null, intersectionObserver = null;
    if (typeof root.ResizeObserver === 'function') {
      resizeObserver = new root.ResizeObserver(sizeCanvas); resizeObserver.observe(chart);
    } else if (root.addEventListener) root.addEventListener('resize', sizeCanvas);
    if (typeof root.IntersectionObserver === 'function') {
      const box = chart.getBoundingClientRect();
      inView = box.bottom > 0 && box.top < (root.innerHeight || 1000);
      intersectionObserver = new root.IntersectionObserver(entries => {
        const entry = entries.find(item => item.target === sky);
        if (entry) { inView = entry.isIntersecting; syncMotion(); }
      }, { threshold: 0 });
      intersectionObserver.observe(sky);
    }
    select((tasks.find(task => task.pos === selectedPosition) || tasks[0]).pos);
    sizeCanvas();
    if (!context) pause.hidden = true;
    syncMotion();
    function cleanup() {
      if (disposed) return;
      disposed = true;
      if (raf) root.cancelAnimationFrame(raf);
      raf = 0; sky.dataset.motion = 'paused';
      sky.removeEventListener('click', onClick); sky.removeEventListener('keydown', onKey);
      pause.removeEventListener('click', toggleMotion);
      if (doc) doc.removeEventListener('visibilitychange', onVisibility);
      if (media && media.removeEventListener) media.removeEventListener('change', onPreference);
      else if (media && media.removeListener) media.removeListener(onPreference);
      if (resizeObserver) resizeObserver.disconnect();
      else if (root.removeEventListener) root.removeEventListener('resize', sizeCanvas);
      if (intersectionObserver) intersectionObserver.disconnect();
      mounted.delete(sky);
    }
    mounted.set(sky, cleanup);
    return cleanup;
  }
  root.EgeBazaStarSky = Object.freeze({ markup, mount });
})(typeof globalThis === "object" ? globalThis : this);
