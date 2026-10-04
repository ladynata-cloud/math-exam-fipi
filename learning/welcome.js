/* A local practice introduction: no account data, progress writes or submissions. */
(function () {
  'use strict';
  const SEEN_KEY = 'mathexam-welcome-v1';
  const VIDEO_ORIGIN = 'https://mathexam.space';
  const VIDEOS = Object.freeze({
    'homework-help': { title: 'Как пользоваться подсказками', length: '1 мин 24 с', size: '844 КБ' },
    'linear-equation': { title: 'Линейное уравнение: шаг за шагом', length: '1 мин 19 с', size: '598 КБ' },
    'adjacent-angles': { title: 'Смежные углы: читаем рисунок', length: '1 мин 7 с', size: '525 КБ' }
  });
  const steps = [
    {
      title: 'Здесь можно идти в своём темпе',
      text: 'Выбирай тему в своём маршруте. Если трудно — открой подготовительную тему и вернись к своей задаче.',
      body: '<div class="mw-route"><span>Моя тема</span><span aria-hidden="true">↙ ↖</span><span>Вспомнить основу</span></div><p>Не обязательно проходить всё подряд. Домашнее задание Натальи Михайловны можно открыть отдельно.</p>',
      next: 'Попробовать на примере'
    },
    {
      title: 'Попробуй. Если трудно — открой подсказку',
      text: 'Учебный пример: какое число нужно прибавить к трём, чтобы получилось восемь?',
      body: '<p class="mw-equation" aria-label="Икс плюс три равно восьми">x + 3 = 8</p><div class="mw-answer-row" role="group" aria-label="Выбери значение икс"><button type="button" data-mw-answer="4">x = 4</button><button type="button" data-mw-answer="5">x = 5</button><button type="button" data-mw-answer="11">x = 11</button></div><button type="button" class="mw-hint-button" data-mw-hint>Подсказка: с чего начать?</button><p class="mw-hint" data-mw-hint-text hidden>Из обеих частей вычти 3: x = 8 − 3. Проверь своё число: прибавь к нему 3.</p>',
      next: 'Дальше'
    },
    {
      title: 'Прогресс показывает, как ты решала',
      text: 'Решение с подсказкой и самостоятельное решение — разные шаги. После разбора попробуй похожую задачу сама.',
      body: '<div class="mw-example-progress"><span class="mw-example-status"></span><p>Это только пример отметки. Упражнение знакомства не попадает в твои результаты.</p></div><p>В настоящих заданиях смотри на сохранённые отметки. Просмотр видео сам по себе не означает, что тема освоена.</p>',
      next: 'Как сдать работу'
    },
    {
      title: 'Готовую работу можно сдать одной кнопкой',
      text: 'В настоящем задании проверь решение, добавь фото тетради, если оно нужно, и нажми «Сдать Наталье Михайловне».',
      body: '<p>Попробуй кнопку ниже. Сейчас это учебный пример: учителю ничего не отправляется.</p><button type="button" class="primary mw-demo-submit" data-mw-submit>Попробовать сдачу · учебный пример</button>',
      next: 'Дальше'
    },
    {
      title: 'Если связь пропала — сохрани свою работу',
      text: 'Смотри на подтверждение сохранения и сдачи. Если связи нет, не закрывай вкладку с несохранённым ответом.',
      body: '<p>Задание на бумаге можно решить в тетради и сфотографировать. Когда связь появится, загрузи фото и дождись подтверждения отправки.</p><p>Короткие видео можно скачать заранее. Текстовый разбор доступен отдельно от видео.</p>',
      next: 'Всё понятно'
    },
    {
      title: 'Теперь выбирай, с чего начать',
      text: 'Открой свой маршрут или домашнее задание. Ты можешь вернуться к этой инструкции кнопкой «Как здесь заниматься».',
      body: '<div class="mw-finish"><span aria-hidden="true">✓</span><p>Знакомство завершено.<br>Твоя настоящая работа начинается в кабинете.</p></div>',
      next: 'Перейти в кабинет'
    }
  ];
  let modal = null, opener = null, mode = null, step = 0, seenThisVisit = false;
  let clicks = false, voice = false, audioContext = null, hintUsed = false, answered = false, submitted = false;
  let speechGeneration = 0;
  const $ = selector => modal?.querySelector(selector);
  const speechAvailable = () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  function readSeen() { try { return localStorage.getItem(SEEN_KEY) === 'seen'; } catch (_) { return false; } }
  function markSeen() { seenThisVisit = true; try { localStorage.setItem(SEEN_KEY, 'seen'); } catch (_) {} }
  function stopSpeech() { speechGeneration += 1; if (speechAvailable()) window.speechSynthesis.cancel(); }
  function audioMessage(message) { const note = $('[data-mw-audio-status]'); if (note) note.textContent = message; }
  function clickSound() {
    if (!clicks) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { clicks = false; refreshAudio(); audioMessage('Щелчки недоступны в этом браузере. Текст работает без звука.'); return; }
      if (!audioContext) audioContext = new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = 720;
      gain.gain.setValueAtTime(0.025, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + 0.05);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch (_) { clicks = false; refreshAudio(); audioMessage('Звук не удалось включить. Все инструкции остаются на экране.'); }
  }
  function refreshAudio() {
    const clickButton = $('[data-mw-clicks]'), voiceButton = $('[data-mw-voice]');
    if (clickButton) { clickButton.setAttribute('aria-pressed', String(clicks)); clickButton.textContent = clicks ? 'Щелчки включены' : 'Включить щелчки'; }
    if (voiceButton) { voiceButton.setAttribute('aria-pressed', String(voice)); voiceButton.textContent = voice ? 'Выключить голос' : 'Включить голос'; voiceButton.disabled = !speechAvailable(); }
  }
  function speakStep() {
    stopSpeech();
    if (!voice || mode !== 'intro' || !speechAvailable()) return;
    const voices = window.speechSynthesis.getVoices();
    const russian = voices.find(item => /^ru(?:-|_|$)/i.test(item.lang));
    if (!russian) { voice = false; refreshAudio(); audioMessage('Русский голос пока не доступен в браузере. Можно попробовать снова или читать текст.'); return; }
    const current = speechGeneration;
    const utterance = new window.SpeechSynthesisUtterance(`${steps[step].title}. ${steps[step].text}`);
    utterance.voice = russian; utterance.lang = 'ru-RU'; utterance.rate = 0.93;
    utterance.onerror = () => {
      if (speechGeneration !== current) return;
      voice = false; refreshAudio(); audioMessage('Голос не удалось воспроизвести. Продолжай по тексту; он содержит всю инструкцию.');
    };
    audioMessage('Читает голос браузера. Для некоторых голосов нужен интернет.');
    try { window.speechSynthesis.speak(utterance); } catch (_) { voice = false; refreshAudio(); audioMessage('Озвучка недоступна. Продолжай по тексту.'); }
  }
  function disposeMedia() {
    stopSpeech();
    const video = $('video');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    if (audioContext) { const context = audioContext; audioContext = null; context.close().catch(() => {}); }
  }
  function cleanup() {
    if (!modal) return;
    disposeMedia();
    const old = modal, focusTarget = opener;
    modal = null; mode = null; opener = null; clicks = false; voice = false;
    if (old.open) old.close();
    old.remove();
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  }
  function close() { if (mode === 'intro') markSeen(); cleanup(); }
  function createDialog(label) {
    if (modal) cleanup();
    // Never cover a pending task, auth form or an existing teacher dialog.
    if (document.querySelector('dialog[open]')) return false;
    const element = document.createElement('dialog');
    if (typeof element.showModal !== 'function') return false;
    opener = document.activeElement;
    element.className = 'mw-dialog'; element.setAttribute('aria-labelledby', 'mw-title');
    element.innerHTML = `<div class="mw-shell"><header class="mw-top"><span class="mw-kicker"></span><button type="button" data-mw-close aria-label="Закрыть инструкцию">Закрыть</button></header><div data-mw-content></div></div>`;
    element.querySelector('.mw-kicker').textContent = label;
    modal = element;
    $('[data-mw-close]').addEventListener('click', close);
    element.addEventListener('cancel', event => { event.preventDefault(); close(); });
    element.addEventListener('close', () => { if (modal === element) close(); });
    document.body.append(element);
    element.showModal();
    return true;
  }
  function showStep(focusHeading = true) {
    const current = steps[step];
    $('[data-mw-content]').innerHTML = `<p class="mw-step">Знакомство с кабинетом · шаг ${step + 1} из ${steps.length}</p><progress class="mw-progress" value="${step + 1}" max="${steps.length}" aria-label="Шаг знакомства"></progress><h2 id="mw-title" class="mw-title" tabindex="-1"></h2><p class="mw-instruction"></p><div class="mw-practice" data-mw-practice></div><p class="mw-feedback" data-mw-feedback role="status" aria-live="polite"></p><div class="mw-navigation"><button type="button" data-mw-back ${step === 0 ? 'disabled' : ''}>Назад</button><button type="button" class="primary" data-mw-next></button></div><div class="mw-audio"><span>Звук — по желанию:</span><button type="button" data-mw-clicks aria-pressed="false">Включить щелчки</button><button type="button" data-mw-voice aria-pressed="false">Включить голос</button></div><p class="mw-audio-status" data-mw-audio-status role="status">${speechAvailable() ? 'Текст работает без звука. Голос включается только по твоему нажатию.' : 'Голос в этом браузере недоступен. Вся инструкция есть в тексте.'}</p>`;
    $('#mw-title').textContent = current.title;
    $('.mw-instruction').textContent = current.text;
    $('[data-mw-practice]').innerHTML = current.body;
    $('[data-mw-next]').textContent = current.next;
    const hintText = $('[data-mw-hint-text]');
    if (hintText) hintText.hidden = !hintUsed;
    const status = $('.mw-example-status');
    if (status) status.textContent = answered ? (hintUsed ? 'Учебный пример · решено с подсказкой' : 'Учебный пример · решено самостоятельно') : 'Учебный пример · начато';
    if (step === 1 && answered) $('[data-mw-feedback]').textContent = 'Верно: 5 + 3 = 8. Можно идти дальше.';
    if (step === 3 && submitted) $('[data-mw-feedback]').textContent = 'Ты попробовала сдачу. Это учебный пример; работа учителю не отправлялась.';
    $('[data-mw-back]').addEventListener('click', () => { clickSound(); if (step > 0) { step -= 1; showStep(); } });
    $('[data-mw-next]').addEventListener('click', () => { clickSound(); if (step === steps.length - 1) close(); else { step += 1; showStep(); } });
    $('[data-mw-hint]')?.addEventListener('click', event => {
      clickSound(); hintUsed = true; hintText.hidden = false;
      event.currentTarget.setAttribute('aria-expanded', 'true');
      $('[data-mw-feedback]').textContent = 'Подсказка открыта. Теперь выбери свой ответ.';
    });
    const hintButton = $('[data-mw-hint]');
    if (hintButton) { hintText.id = 'mw-hint'; hintButton.setAttribute('aria-controls', 'mw-hint'); hintButton.setAttribute('aria-expanded', String(hintUsed)); }
    modal.querySelectorAll('[data-mw-answer]').forEach(button => button.addEventListener('click', () => {
      clickSound();
      if (button.dataset.mwAnswer === '5') { answered = true; $('[data-mw-feedback]').textContent = 'Верно: 5 + 3 = 8. Можно идти дальше.'; }
      else { answered = false; $('[data-mw-feedback]').textContent = button.dataset.mwAnswer === '4' ? 'Проверь: 4 + 3 = 7, а нужно 8. Попробуй ещё раз или открой подсказку.' : 'Проверь: 11 + 3 = 14, а нужно 8. Попробуй ещё раз или открой подсказку.'; }
    }));
    $('[data-mw-submit]')?.addEventListener('click', () => { clickSound(); submitted = true; $('[data-mw-feedback]').textContent = 'Ты попробовала сдачу. Это учебный пример; работа учителю не отправлялась.'; });
    $('[data-mw-clicks]').addEventListener('click', () => { clicks = !clicks; refreshAudio(); clickSound(); });
    $('[data-mw-voice]').addEventListener('click', () => { voice = !voice; refreshAudio(); if (voice) speakStep(); else { stopSpeech(); audioMessage('Голос выключен. Продолжай по тексту.'); } });
    refreshAudio();
    if (focusHeading) $('#mw-title').focus({ preventScroll: true });
    modal.scrollTop = 0;
    if (voice) speakStep();
  }
  function open() {
    if (!createDialog('Учебный пример · ничего не отправляется')) return false;
    mode = 'intro'; step = 0; hintUsed = false; answered = false; submitted = false;
    $('[data-mw-close]').textContent = 'Пропустить';
    $('[data-mw-close]').setAttribute('aria-label', 'Пропустить знакомство');
    seenThisVisit = true;
    showStep();
    return true;
  }
  function maybeOpen(account) {
    if (account?.role !== 'student' || seenThisVisit || readSeen() || modal) return false;
    const route = location.hash.slice(1).split(/[?&=]/)[0];
    if (route && route !== 'home' && route !== 'route') return false;
    return open();
  }
  function openVideo(key) {
    if (!Object.prototype.hasOwnProperty.call(VIDEOS, key)) return false;
    const video = VIDEOS[key];
    if (!createDialog('Короткий разбор · текст и щелчки')) return false;
    mode = 'video'; modal.classList.add('mw-video-dialog');
    $('[data-mw-close]').setAttribute('aria-label', 'Закрыть видео');
    $('[data-mw-content]').innerHTML = '<h2 id="mw-title" class="mw-title mw-video-title" tabindex="-1"></h2><p class="mw-video-summary"></p><video class="mw-video" controls playsinline preload="none"></video><p class="mw-video-error" role="status" hidden>Видео не загрузилось. Попробуй позже или открой текстовый разбор.</p><p>В этих коротких примерах — текст и щелчки, без озвучки. Можно выключить звук: все шаги написаны на экране. Просмотр не меняет твой учебный прогресс.</p><div class="mw-video-links"><a target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-mw-text>Открыть текст и шаги ↗</a><a target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-mw-download>Открыть MP4 для сохранения ↗</a></div><p class="mw-download-note">На странице видео выбери «Скачать» в меню проигрывателя или браузера. Сохрани заранее, если связь нестабильна.</p>';
    $('#mw-title').textContent = video.title;
    $('.mw-video-summary').textContent = `${video.length} · ${video.size} · загрузка начнётся после нажатия ▶`;
    const player = $('.mw-video');
    player.setAttribute('aria-label', video.title);
    player.src = `${VIDEO_ORIGIN}/video-lessons/media/${key}.mp4`;
    player.addEventListener('error', () => { const error = $('.mw-video-error'); if (error && player === $('.mw-video')) error.hidden = false; });
    $('[data-mw-text]').href = `${VIDEO_ORIGIN}/video-lessons/studio.html?task=${key}&preset=1`;
    $('[data-mw-download]').href = player.src;
    $('#mw-title').focus({ preventScroll: true });
    return true;
  }
  window.addEventListener('pagehide', cleanup);
  window.addEventListener('hashchange', () => { if (modal) close(); });
  window.MathExamWelcome = Object.freeze({ open, maybeOpen, openVideo, cleanup });
})();
