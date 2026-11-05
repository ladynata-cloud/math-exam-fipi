(function () {
  'use strict';
  const TASK = 'soviet-motion-time';
  const TOPIC = 'motion-time';
  const API = 'https://mathexam-video-ladynata.msk1.amvera.tech';
  const STORAGE_KEY = 'mathexam-soviet-video-pending-v1';
  const $ = id => document.getElementById(id);
  const studioMode = new URLSearchParams(location.search).get('studio') === '1';
  if (studioMode) document.documentElement.classList.add('studio-mode');
  let plan, topic, source, scenes = [], selected = 0, preset = 1, animation;

  function checkTask(tab) {
    if (tab !== TASK && tab !== 't' + TASK) throw new Error('Неизвестный учебный сценарий');
  }
  function checkType(type) {
    if (type !== undefined && type !== 'ideal-solution') throw new Error('Доступен только разбор решения');
  }
  function duration(text, minimum) {
    const words = String(text).match(/[А-Яа-яЁёA-Za-z0-9]+(?:-[А-Яа-яЁёA-Za-z0-9]+)*/g) || [];
    return Math.round(Math.min(30, Math.max(minimum, words.length / 2 + 1.5)) * 1000);
  }
  function scene(id, narration, title, completed, activeStep, reveal, minimum, action) {
    if (typeof narration !== 'string' || !narration.trim()) throw new Error('В сценарии пропущено объяснение');
    return { id, narration, title, completed, activeStep, reveal, action, click: false,
      duration_hint_ms: duration(narration, minimum), ...(reveal ? { motion_ms: 2400 } : {}) };
  }
  function draw(progress = 1) {
    const current = scenes[selected];
    window.SovietBoard.draw($('board'), plan, current.completed, {
      title: topic.title, source: source.label, activeStep: current.activeStep,
      reveal: current.reveal, camera: current.reveal ? 'detail' : 'overview',
      progress, transition: progress,
    });
    $('board').setAttribute('aria-label', plan.prompt + ' ' + current.narration);
  }
  function renderReader() {
    const current = scenes[selected];
    $('scene-label').textContent = (selected + 1) + ' / ' + scenes.length + ' · ' + current.title;
    $('narration').textContent = current.narration;
    $('previous').disabled = selected === 0;
    $('next').disabled = selected === scenes.length - 1;
    $('motion').disabled = !current.motion_ms;
  }
  function prepare(tab, requestedPreset, type) {
    checkTask(tab); checkType(type);
    const n = Number(requestedPreset);
    if (!Number.isInteger(n) || n < 1 || n > 3) throw new Error('Выберите вариант 1, 2 или 3');
    cancelAnimationFrame(animation);
    topic = window.SovietMath.topics.find(item => item.id === TOPIC);
    plan = window.SovietMath.make(TOPIC, n - 1);
    source = window.SovietSources.forTopic(TOPIC);
    const speech = plan.narration;
    if (!topic || !source || !speech || speech.steps.length !== plan.steps.length) {
      throw new Error('Учебный пример и сценарий не совпадают');
    }
    scenes = [scene('intro', speech.intro, 'Читаем условие', 0, 0, false, 8, 'observe')];
    plan.steps.forEach((step, index) => {
      scenes.push(scene('step-' + (index + 1) + '-question', speech.steps[index].question,
        'Сначала подумай', index, index, false, 3.5, 'observe'));
      scenes.push(scene('step-' + (index + 1) + '-explanation', speech.steps[index].explanation,
        index === plan.steps.length - 1 ? 'Проверяем решение' : 'Разбираем шаг', index, index, true, 8, 'correct'));
    });
    scenes.push(scene('final', speech.final, 'Решение целиком', plan.steps.length,
      plan.steps.length - 1, false, 8, 'final'));
    if (scenes.length > 30) throw new Error('Сценарий превышает допустимое число сцен');
    preset = n; selected = 0; $('preset').value = String(n);
    $('transcript').replaceChildren(...scenes.map(item => {
      const row = document.createElement('li');
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = item.title + '. ' + item.narration;
      button.addEventListener('click', () => show(TASK, item.id));
      row.append(button); return row;
    }));
    draw(); renderReader();
    return { format: 'mathexam-video-manifest', tab: 't' + TASK, videoType: 'ideal-solution',
      scenes: scenes.map(({ id, narration, duration_hint_ms, action, click, motion_ms }) => ({
        id, narration, duration_hint_ms, action, click, ...(motion_ms ? { motion_ms } : {}),
      })) };
  }
  function show(tab, id, type) {
    checkTask(tab); checkType(type);
    const index = scenes.findIndex(item => item.id === id);
    if (index < 0) throw new Error('Неизвестный шаг сценария');
    cancelAnimationFrame(animation); selected = index; draw(); renderReader();
    return { sceneId: id };
  }
  function seekMotion(progress) {
    const value = Number(progress);
    if (!Number.isFinite(value)) throw new Error('Некорректная позиция движения');
    cancelAnimationFrame(animation); draw(Math.max(0, Math.min(1, value)));
    return { sceneId: scenes[selected].id, progress: Math.max(0, Math.min(1, value)) };
  }
  function playMotion() {
    cancelAnimationFrame(animation);
    if (!scenes[selected].motion_ms || matchMedia('(prefers-reduced-motion: reduce)').matches) return draw();
    const start = performance.now(), milliseconds = scenes[selected].motion_ms;
    function frame(now) {
      const progress = Math.min(1, (now - start) / milliseconds); draw(progress);
      if (progress < 1) animation = requestAnimationFrame(frame);
    }
    draw(0); animation = requestAnimationFrame(frame);
  }
  $('picker').addEventListener('submit', event => event.preventDefault());
  $('preset').addEventListener('change', () => prepare(TASK, Number($('preset').value)));
  $('previous').addEventListener('click', () => { if (selected > 0) show(TASK, scenes[selected - 1].id); });
  $('next').addEventListener('click', () => {
    if (selected < scenes.length - 1) { show(TASK, scenes[selected + 1].id); playMotion(); }
  });
  $('motion').addEventListener('click', playMotion);
  const queryPreset = Number(new URLSearchParams(location.search).get('preset') || 1);
  prepare(TASK, [1, 2, 3].includes(queryPreset) ? queryPreset : 1);
  window.MathExamVideoStudio = Object.freeze({ prepare, show, seekMotion });
  window.__MATH_EXAM_VIDEO_READY__ = true;
  // Rendering never loads pupil progress and never initializes the operator API.
  if (studioMode) return;

  const labels = { queued: 'В очереди', synthesizing: 'Подготовка кадров', rendering: 'Сборка видео',
    ready: 'Видео готово', failed: 'Сборка остановилась с ошибкой' };
  let pending = null, active = null, timer, polling = false, stopped = false;
  const say = text => { $('mp4-status').textContent = text; };
  const lock = value => { for (const id of ['task', 'preset', 'mp4-format']) $(id).disabled = value; };
  function savePending() {
    try {
      if (pending) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) { /* In-memory retries retain the same request and key. */ }
  }
  function readPending() {
    try {
      const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      if (!value || !/^[A-Za-z0-9-]{20,80}$/.test(value.key) || typeof value.body !== 'string' || value.body.length > 1000) return null;
      const body = JSON.parse(value.body);
      if (body.task !== TASK || ![1, 2, 3].includes(body.preset) || body.format !== '16:9'
        || body.captions !== true || body.videoType !== 'ideal-solution' || body.audioMode !== 'silent'
        || Object.keys(body).some(key => !['task', 'preset', 'format', 'captions', 'videoType', 'audioMode'].includes(key))) return null;
      return { key: value.key, body: value.body, uncertain: true };
    } catch (_) { return null; }
  }
  function token() {
    const value = $('mp4-token').value.trim();
    if (value.length < 32 || value.length > 512 || /[\r\n]/.test(value)) throw new Error('Введите действующий код доступа к видеостудии.');
    return value;
  }
  async function call(path, options = {}) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(API + path, { ...options, credentials: 'omit', cache: 'no-store', redirect: 'error',
        headers: { Authorization: 'Bearer ' + token(), ...options.headers }, signal: controller.signal });
      if (!response.ok) {
        let message = '';
        try { const body = await response.json(); if (typeof body.error === 'string') message = body.error; } catch (_) {}
        const error = new Error(response.status === 401 ? 'Код доступа не подошёл. Проверьте его в настройках видеосервера.'
          : message || 'Видеосервер сейчас недоступен. Повторите проверку позже.');
        error.requestRejected = [400, 401, 403, 404, 413, 429, 507].includes(response.status);
        throw error;
      }
      return response;
    } finally { clearTimeout(deadline); }
  }
  function renderJob(job) {
    if (!job || !/^vid_[A-Za-z0-9_-]{20,40}$/.test(job.id) || !Object.hasOwn(labels, job.status)) {
      throw new Error('Видеосервер вернул непонятный результат.');
    }
    active = job; $('mp4-job').textContent = 'Номер сборки: ' + job.id;
    const working = ['queued', 'synthesizing', 'rendering'].includes(job.status);
    const progress = working && Number.isInteger(job.progress?.current) && Number.isInteger(job.progress?.total)
      ? ' · ' + job.progress.current + ' из ' + job.progress.total : '';
    say(labels[job.status] + progress); lock(working);
    $('mp4-download').hidden = job.status !== 'ready'; $('mp4-submit').disabled = false;
    $('mp4-submit').textContent = working ? 'Проверить эту сборку' : 'Создать ещё одно видео';
    if (!working) { pending = null; savePending(); }
  }
  async function poll() {
    if (!active || stopped || polling) return;
    polling = true;
    try {
      const body = await (await call('/api/v1/jobs/' + active.id)).json(); renderJob(body.job);
      if (['queued', 'synthesizing', 'rendering'].includes(active.status) && !stopped) timer = setTimeout(poll, 3500);
    } catch (_) {
      say('Не удалось проверить сборку. Она могла продолжиться на сервере. Нажмите «Проверить эту сборку».');
      $('mp4-submit').disabled = false;
    } finally { polling = false; }
  }
  $('mp4-form').addEventListener('submit', async event => {
    event.preventDefault(); clearTimeout(timer);
    if (active && ['queued', 'synthesizing', 'rendering'].includes(active.status)) { await poll(); return; }
    try { token(); } catch (error) { say(error.message); return; }
    if (!pending) {
      const key = typeof crypto.randomUUID === 'function' ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(20)), b => b.toString(16).padStart(2, '0')).join('');
      pending = { key, uncertain: false, body: JSON.stringify({ task: TASK, preset,
        format: '16:9', audioMode: 'silent', captions: true, videoType: 'ideal-solution' }) };
    }
    savePending(); lock(true); $('mp4-submit').disabled = true; $('mp4-download').hidden = true;
    try {
      say('Передаём выбранный сценарий на сборку…');
      const body = await (await call('/api/v1/jobs', { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pending.key }, body: pending.body })).json();
      renderJob(body.job); await poll();
    } catch (error) {
      if (error.requestRejected && !pending?.uncertain) { pending = null; lock(false); }
      else if (pending) pending.uncertain = true;
      savePending(); $('mp4-submit').disabled = false;
      say(error.name === 'AbortError' || error instanceof TypeError
        ? 'Ответ не получен. Повторите отправку в этой вкладке: тот же запрос не создаст вторую сборку.' : error.message);
    }
  });
  $('mp4-download').addEventListener('click', async () => {
    if (!active || active.status !== 'ready') return;
    $('mp4-download').disabled = true;
    try {
      const response = await call('/api/v1/jobs/' + active.id + '/video');
      if (!String(response.headers.get('Content-Type')).startsWith('video/mp4')) throw new Error('Ожидался видеофайл');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'soviet-motion-time.mp4';
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
      say('Видео скачано. Сохраните его отдельно: очередь сборки не является постоянным архивом.');
    } catch (_) { say('Скачать видео не удалось. Повторите попытку; новая сборка не нужна.'); }
    finally { $('mp4-download').disabled = false; }
  });
  $('mp4-clear').addEventListener('click', () => {
    $('mp4-token').value = ''; clearTimeout(timer); say('Код удалён из вкладки. Сборка на сервере не отменена.');
  });
  window.addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); $('mp4-token').value = ''; });
  window.addEventListener('pageshow', () => { stopped = false; });
  pending = readPending();
  if (pending) {
    prepare(TASK, JSON.parse(pending.body).preset); lock(true);
    $('mp4-submit').textContent = 'Повторить этот запрос';
    say('Сохранён незавершённый запрос. Введите код и повторите его: будет использован тот же номер запроса.');
  }
}());
