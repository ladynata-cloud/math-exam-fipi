(function () {
  'use strict';
  // Operator-only enhancement. No credentials or job data enter a pupil account.
  const form = document.getElementById('mp4-form');
  if (!form) return;
  const api = 'https://mathexam-video-ladynata.amvera.io';
  const status = document.getElementById('mp4-status');
  const tokenField = document.getElementById('mp4-token');
  const submit = document.getElementById('mp4-submit');
  const download = document.getElementById('mp4-download');
  const jobLabel = document.getElementById('mp4-job');
  const pendingStorageKey = 'mathexam-school-video-pending-v1';
  let pending = null;
  let active = null;
  let polling = false;
  let timer = null;
  let stopped = false;
  const labels = { queued: 'В очереди', synthesizing: 'Подготовка озвучки', rendering: 'Сборка видео', ready: 'Видео готово', failed: 'Сборка остановилась с ошибкой' };

  function say(message) { status.textContent = message; }
  function savePending() {
    // Only the authored request and deduplication key persist. Never the token.
    try {
      if (pending) sessionStorage.setItem(pendingStorageKey, JSON.stringify(pending));
      else sessionStorage.removeItem(pendingStorageKey);
    } catch (_) { /* The in-memory retry still works if storage is unavailable. */ }
  }
  function readPending() {
    try {
      const value = JSON.parse(sessionStorage.getItem(pendingStorageKey));
      if (!value || typeof value.body !== 'string' || value.body.length > 1000 || !/^[A-Za-z0-9-]{20,80}$/.test(value.key)) return null;
      const data = JSON.parse(value.body);
      if (!['homework-help', 'linear-equation', 'adjacent-angles'].includes(data.task)
        || ![1, 2, 3].includes(data.preset) || !['16:9', '9:16'].includes(data.format)
        || !['voice', 'clicks', 'silent'].includes(data.audioMode)
        || data.captions !== true || data.videoType !== 'ideal-solution'
        || Object.keys(data).some(k => !['task', 'preset', 'format', 'audioMode', 'captions', 'videoType'].includes(k))) return null;
      return { body: value.body, key: value.key, uncertain: true };
    } catch (_) { return null; }
  }
  function lockRequest(locked) {
    for (const id of ['task', 'preset', 'mp4-format', 'mp4-audio']) document.getElementById(id).disabled = locked;
  }
  function rejected(message, code) {
    const error = new Error(message);
    error.requestRejected = [400, 401, 403, 404, 413, 429, 507].includes(code);
    return error;
  }
  function key() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(20)), b => b.toString(16).padStart(2, '0')).join('');
  }
  function token() {
    const value = tokenField.value.trim();
    if (value.length < 32 || value.length > 512 || /[\r\n]/.test(value)) throw new Error('Введите действующий код доступа к видеостудии.');
    return value;
  }
  async function call(path, options) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(api + path, {
        ...options,
        credentials: 'omit', cache: 'no-store', redirect: 'error',
        headers: { Authorization: 'Bearer ' + token(), ...(options && options.headers) },
        signal: controller.signal,
      });
      if (!response.ok) {
        let message = '';
        try { const data = await response.json(); message = typeof data.error === 'string' ? data.error : ''; } catch (_) {}
        if (response.status === 401) throw rejected('Код доступа не подошёл. Проверьте его в настройках видеосервера.', response.status);
        if (response.status === 400) throw rejected(message || 'Сервер пока не поддерживает выбранный сценарий или режим озвучки.', response.status);
        throw rejected(message || 'Видеосервер сейчас недоступен. Повторите проверку позже.', response.status);
      }
      return response;
    } finally { clearTimeout(deadline); }
  }
  function render(job) {
    if (!job || !/^vid_[A-Za-z0-9_-]{20,40}$/.test(job.id)) throw new Error('Сервер вернул непонятный номер задания.');
    active = job;
    jobLabel.textContent = 'Номер сборки: ' + job.id;
    const progress = job.progress && Number.isInteger(job.progress.current) && Number.isInteger(job.progress.total)
      ? ' · ' + job.progress.current + ' из ' + job.progress.total : '';
    say((labels[job.status] || 'Проверяем сборку') + (['rendering', 'synthesizing'].includes(job.status) ? progress : ''));
    download.hidden = job.status !== 'ready';
    submit.disabled = false;
    lockRequest(['queued', 'synthesizing', 'rendering'].includes(job.status));
    if (['ready', 'failed'].includes(job.status)) { pending = null; savePending(); }
    submit.textContent = ['queued', 'synthesizing', 'rendering'].includes(job.status) ? 'Проверить эту сборку' : 'Создать ещё одно видео';
  }
  async function poll() {
    if (!active || stopped || polling) return;
    polling = true;
    try {
      const response = await call('/api/v1/jobs/' + active.id);
      const body = await response.json();
      render(body.job || body);
      if (['queued', 'synthesizing', 'rendering'].includes(active.status) && !stopped) timer = setTimeout(poll, 3500);
    } catch (_) {
      say('Не удалось проверить сборку. Она могла продолжиться на сервере. Нажмите «Проверить эту сборку».');
      submit.disabled = false;
    } finally { polling = false; }
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearTimeout(timer);
    if (active && ['queued', 'synthesizing', 'rendering'].includes(active.status)) { await poll(); return; }
    try { token(); } catch (error) { say(error.message); return; }
    const request = {
      task: document.getElementById('task').value,
      preset: Number(document.getElementById('preset').value),
      format: document.getElementById('mp4-format').value,
      audioMode: document.getElementById('mp4-audio').value,
      captions: true, videoType: 'ideal-solution',
    };
    const encoded = JSON.stringify(request);
    // Reusing this key after a lost reply prevents a duplicate paid render.
    if (!pending) pending = { body: encoded, key: key(), uncertain: false };
    savePending();
    // While acknowledgement is unknown, even a programmatic selector change
    // cannot replace the first request and create a second paid job.
    lockRequest(true);
    submit.disabled = true;
    download.hidden = true;
    try {
      token();
      say('Передаём проверенный сценарий на сборку…');
      const response = await call('/api/v1/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': pending.key }, body: pending.body,
      });
      const body = await response.json();
      render(body.job || body);
      await poll();
    } catch (error) {
      if (error.requestRejected && !pending?.uncertain) { pending = null; lockRequest(false); }
      else if (pending) pending.uncertain = true;
      savePending();
      say(error.name === 'AbortError' || error instanceof TypeError
        ? 'Ответ не получен. Вариант зафиксирован. Повторите отправку в этой вкладке: тот же запрос не создаст вторую сборку.'
        : error.message);
      submit.disabled = false;
      if (pending) submit.textContent = 'Повторить этот запрос';
    }
  });
  download.addEventListener('click', async function () {
    if (!active || active.status !== 'ready') return;
    download.disabled = true;
    try {
      const response = await call('/api/v1/jobs/' + active.id + '/video');
      const blob = await response.blob();
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = (active.task || active.request && active.request.task || 'mathexam-lesson') + '.mp4';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      say('Видео скачано. Сохраните его отдельно: очередь видеосервера не является постоянным архивом курса.');
    } catch (_) { say('Скачать видео не удалось. Повторите попытку; повторная сборка не нужна.'); }
    finally { download.disabled = false; }
  });
  document.getElementById('mp4-clear').addEventListener('click', function () {
    tokenField.value = ''; clearTimeout(timer); say('Код доступа удалён из этой вкладки. Сборка на сервере не отменена.');
  });
  window.addEventListener('pagehide', function () {
    stopped = true; clearTimeout(timer); tokenField.value = '';
  });
  window.addEventListener('pageshow', function () { stopped = false; });
  pending = readPending();
  if (pending) {
    const request = JSON.parse(pending.body);
    document.getElementById('task').value = request.task;
    document.getElementById('preset').value = String(request.preset);
    document.getElementById('mp4-format').value = request.format;
    document.getElementById('mp4-audio').value = request.audioMode;
    document.getElementById('task').dispatchEvent(new Event('change'));
    lockRequest(true);
    submit.textContent = 'Повторить этот запрос';
    say('Сохранён незавершённый запрос сборки. Введите код доступа и повторите этот запрос: новая платная сборка не создастся.');
  }
}());
