/* A local practice introduction: no account data, progress writes or submissions. */
(function () {
  'use strict';
  const SEEN_KEY = 'mathexam-welcome-v1';
  const VIDEO_ORIGIN = 'https://mathexam.space';
  const VIDEO_REVISION = 'pre7-20261006';
  const VIDEOS = Object.freeze({
    'negative-numbers': { title: 'Отрицательные числа' },
    'fractions': { title: 'Действия с дробями' },
    'brackets': { title: 'Раскрытие скобок' },
    'proportions': { title: 'Пропорции' },
    'percentages': { title: 'Проценты' },
    'linear-equation': { title: 'Линейное уравнение: шаг за шагом' },
    'adjacent-angles': { title: 'Смежные углы: читаем рисунок' },
    'numeric-expressions': { title: 'Числовые выражения' },
    'variable-expressions': { title: 'Выражения с переменными' },
    'compare-expressions': { title: 'Сравнение значений выражений' },
    'arithmetic-properties': { title: 'Свойства действий' },
    'identities': { title: 'Тождества и преобразования' },
    'equation-roots': { title: 'Корень уравнения' },
    'linear-cases': { title: 'Линейное уравнение: три случая' },
    'equation-word-problems': { title: 'Задача с помощью уравнения' },
    'grade7-a-opposite-expression': { title: 'Минус перед выражением' },
    'grade7-a-two-variable-collect': { title: 'Подобные слагаемые с двумя буквами' },
    'grade7-a-equation-two-brackets': { title: 'Уравнение со скобками в обеих частях' },
    'grade7-a-equation-denominators': { title: 'Уравнение: убираем знаменатели' },
    'grade7-a-equation-decimals': { title: 'Уравнение с десятичными числами' },
    'grade7-g-segment-order': { title: 'Отрезки: порядок точек' },
    'grade7-g-midpoint-chain': { title: 'Середина отрезка' },
    'grade7-g-angle-addition': { title: 'Сложение углов' },
    'grade7-g-angle-bisector': { title: 'Биссектриса угла' },
    'grade7-g-adjacent-equation': { title: 'Смежные углы и уравнение' },
    'grade7-b-mixed-borrow': { title: 'Смешанные числа: занимаем единицу' },
    'grade7-b-fraction-product-cancel': { title: 'Умножение дробей: сокращаем множители' },
    'grade7-b-decimal-divisor-scale': { title: 'Деление на десятичную дробь' },
    'grade7-b-signed-fraction-sum': { title: 'Дроби с разными знаками' },
    'grade7-b-percent-proportion': { title: 'Проценты через пропорцию' },
    'pre7-place-value': { title: 'Разряды числа и важные нули' },
    'pre7-natural-compare': { title: 'Сравниваем натуральные числа' },
    'pre7-add-carry': { title: 'Сложение с переносом разряда' },
    'pre7-subtract-borrow': { title: 'Вычитание с разменом через нули' },
    'pre7-smart-calculation': { title: 'Считаем удобным способом' },
    'pre7-inverse-components': { title: 'Находим неизвестный компонент' },
    'pre7-divisibility': { title: 'Признаки делимости' },
    'pre7-scale-reading': { title: 'Шкала: деления и отметки' },
    'pre7-comparison-stories': { title: 'Задачи: на сколько и во сколько' },
    'pre7-fraction-line': { title: 'Дроби на числовом луче' },
    'pre7-equivalent-fractions': { title: 'Равные дроби и сокращение' },
    'pre7-fraction-compare': { title: 'Сравниваем обыкновенные дроби' },
    'pre7-fraction-part-whole': { title: 'Доля, часть и целое' },
    'pre7-decimal-compare': { title: 'Сравниваем десятичные дроби' },
    'pre7-mass-capacity': { title: 'Масса и вместимость' },
    'pre7-ruler-length': { title: 'Измеряем длину по линейке' },
    'pre7-perimeter': { title: 'Периметр: обходим границу' },
    'pre7-grid-area': { title: 'Площадь по клеткам' },
    'grade7-g-core-point-line-ray': { title: 'Точка, прямая, луч и отрезок' },
    'grade7-g-core-perpendicular': { title: 'Перпендикулярные прямые' },
    'grade7-g-core-angle-measure': { title: 'Измеряем угол' },
    'grade7-g-core-triangle-elements': { title: 'Элементы треугольника' },
    'grade7-g-core-triangle-perimeter': { title: 'Периметр треугольника' },
    'grade7-g-core-sas': { title: 'Первый признак равенства треугольников' },
    'grade7-g-core-median': { title: 'Медиана треугольника' },
    'grade7-g-core-bisector': { title: 'Биссектриса треугольника' },
    'grade7-g-core-altitude': { title: 'Высота треугольника' },
    'grade7-g-core-isosceles-elements': { title: 'Равнобедренный треугольник' },
    'grade7-g-core-isosceles-base-angles': { title: 'Углы при основании' },
    'grade7-g-core-isosceles-vertex-line': { title: 'Линия к основанию' },
    'grade7-g-practice-segment-equation': { title: 'Отрезки: равенство из частей' },
    'grade7-g-practice-angle-parts': { title: 'Лучи и биссектрисы: части угла' },
    'grade7-g-practice-vertical-proof': { title: 'Почему вертикальные углы равны' },
    'grade7-g-practice-sas-common-side': { title: 'Первый признак: общая сторона' },
    'grade7-g-practice-sas-vertical': { title: 'Первый признак и вертикальные углы' },
    'grade7-g-practice-cevian-reason': { title: 'Медиана, биссектриса или высота' },
    'grade7-g-practice-isosceles-perimeter': { title: 'Равнобедренный треугольник: периметр' },
    'grade7-g-practice-isosceles-proof': { title: 'Доказательство свойства равнобедренного треугольника' }
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
      title: 'Онлайн — на сайте, тетрадь — в MAX',
      text: 'Бумажную домашнюю работу сфотографируй и пришли Наталье Михайловне в вашем чате в MAX. Работа в тренажёре сохраняется на сайте.',
      body: '<p>Кнопка ниже показывает отдельную сдачу через кабинет. В MAX фотографии отправляешь сама; эта кнопка не отправляет сообщения.</p><button type="button" class="primary mw-demo-submit" data-mw-submit>Попробовать сдачу · учебный пример</button>',
      next: 'Дальше'
    },
    {
      title: 'Если связь пропала — сохрани свою работу',
      text: 'Смотри на подтверждение сохранения и сдачи. Если связи нет, не закрывай вкладку с несохранённым ответом.',
      body: '<p>Задание на бумаге можно решить в тетради и сфотографировать. Когда связь появится, отправь фото Наталье Михайловне в MAX.</p><p>Короткие видео можно скачать заранее. Текстовый разбор доступен отдельно от видео.</p>',
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
  let hintUsed = false, answered = false, submitted = false;
  const $ = selector => modal?.querySelector(selector);
  function readSeen() { try { return localStorage.getItem(SEEN_KEY) === 'seen'; } catch (_) { return false; } }
  function markSeen() { seenThisVisit = true; try { localStorage.setItem(SEEN_KEY, 'seen'); } catch (_) {} }
  function disposeMedia() {
    const video = $('video');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  }
  function cleanup() {
    if (!modal) return;
    disposeMedia();
    const old = modal, focusTarget = opener;
    modal = null; mode = null; opener = null;
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
    $('[data-mw-content]').innerHTML = `<p class="mw-step">Знакомство с кабинетом · шаг ${step + 1} из ${steps.length}</p><progress class="mw-progress" value="${step + 1}" max="${steps.length}" aria-label="Шаг знакомства"></progress><h2 id="mw-title" class="mw-title" tabindex="-1"></h2><p class="mw-instruction"></p><div class="mw-practice" data-mw-practice></div><p class="mw-feedback" data-mw-feedback role="status" aria-live="polite"></p><div class="mw-navigation"><button type="button" data-mw-back ${step === 0 ? 'disabled' : ''}>Назад</button><button type="button" class="primary" data-mw-next></button></div><p class="mw-silent-note">Без звука. Все инструкции остаются на экране.</p>`;
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
    $('[data-mw-back]').addEventListener('click', () => { if (step > 0) { step -= 1; showStep(); } });
    $('[data-mw-next]').addEventListener('click', () => { if (step === steps.length - 1) close(); else { step += 1; showStep(); } });
    $('[data-mw-hint]')?.addEventListener('click', event => {
      hintUsed = true; hintText.hidden = false;
      event.currentTarget.setAttribute('aria-expanded', 'true');
      $('[data-mw-feedback]').textContent = 'Подсказка открыта. Теперь выбери свой ответ.';
    });
    const hintButton = $('[data-mw-hint]');
    if (hintButton) { hintText.id = 'mw-hint'; hintButton.setAttribute('aria-controls', 'mw-hint'); hintButton.setAttribute('aria-expanded', String(hintUsed)); }
    modal.querySelectorAll('[data-mw-answer]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.mwAnswer === '5') { answered = true; $('[data-mw-feedback]').textContent = 'Верно: 5 + 3 = 8. Можно идти дальше.'; }
      else { answered = false; $('[data-mw-feedback]').textContent = button.dataset.mwAnswer === '4' ? 'Проверь: 4 + 3 = 7, а нужно 8. Попробуй ещё раз или открой подсказку.' : 'Проверь: 11 + 3 = 14, а нужно 8. Попробуй ещё раз или открой подсказку.'; }
    }));
    $('[data-mw-submit]')?.addEventListener('click', () => { submitted = true; $('[data-mw-feedback]').textContent = 'Ты попробовала сдачу. Это учебный пример; работа учителю не отправлялась.'; });
    if (focusHeading) $('#mw-title').focus({ preventScroll: true });
    modal.scrollTop = 0;
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
  function openVideo(key, requestedKind = 'math') {
    if (!Object.prototype.hasOwnProperty.call(VIDEOS, key)) return false;
    const video = VIDEOS[key];
    if (!createDialog('Два коротких видео · без звука')) return false;
    mode = 'video'; modal.classList.add('mw-video-dialog');
    $('[data-mw-close]').setAttribute('aria-label', 'Закрыть видео');
    $('[data-mw-content]').innerHTML = '<h2 id="mw-title" class="mw-title mw-video-title" tabindex="-1"></h2><p class="mw-video-summary"></p><div class="mw-video-modes" role="group" aria-label="Что посмотреть"><button type="button" data-mw-video-kind="math" aria-pressed="true">Разбор задачи</button><button type="button" data-mw-video-kind="trainer" aria-pressed="false">Как работать в тренажёре</button></div><video class="mw-video" controls playsinline preload="none"></video><p class="mw-video-error" role="status" hidden>Видео не загрузилось. Попробуй позже или открой текстовый разбор.</p><p>Выбери разбор задачи или показ действий в тренажёре. Оба видео без звука: все объяснения написаны на экране. Можно поставить на паузу или повторить. Просмотр не меняет твой учебный прогресс.</p><div class="mw-video-links"><a target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-mw-text>Открыть текст и шаги ↗</a><a target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-mw-download>Открыть MP4 для сохранения ↗</a></div><p class="mw-download-note">На странице видео выбери «Скачать» в меню проигрывателя или браузера. Сохрани заранее, если связь нестабильна.</p>';
    const player = $('.mw-video');
    function selectKind(kind) {
      const usage = kind === 'trainer';
      player.pause();
      // Setting src resets the previous media without forcing a download.
      // Keep preload=none: a learner with weak connectivity presses play first.
      player.src = `${VIDEO_ORIGIN}/video-lessons/media/${usage ? 'using-' : ''}${key}.mp4?v=${VIDEO_REVISION}`;
      $('#mw-title').textContent = video.title + (usage ? ' · как работать' : ' · разбор задачи');
      $('.mw-video-summary').textContent = 'Без звука · загрузка начнётся после нажатия ▶';
      player.setAttribute('aria-label', video.title + (usage ? ' — как работать в тренажёре' : ' — разбор задачи'));
      $('.mw-video-error').hidden = true;
      modal.querySelectorAll('[data-mw-video-kind]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mwVideoKind === (usage ? 'trainer' : 'math'))));
      $('[data-mw-text]').href = usage
        ? `${VIDEO_ORIGIN}/video-lessons/cheatsheets.html?type=trainer#${key}`
        : `${VIDEO_ORIGIN}/video-lessons/studio.html?task=${key}&preset=1`;
      $('[data-mw-text]').textContent = usage ? 'Инструкция к тренажёру ↗' : 'Открыть текст и шаги ↗';
      $('[data-mw-download]').href = player.src;
    }
    player.addEventListener('error', () => { const error = $('.mw-video-error'); if (error && player === $('.mw-video')) error.hidden = false; });
    modal.querySelectorAll('[data-mw-video-kind]').forEach(button => button.addEventListener('click', () => selectKind(button.dataset.mwVideoKind)));
    selectKind(requestedKind);
    $('#mw-title').focus({ preventScroll: true });
    return true;
  }
  window.addEventListener('pagehide', cleanup);
  window.addEventListener('hashchange', () => { if (modal) close(); });
  window.MathExamWelcome = Object.freeze({ open, maybeOpen, openVideo, cleanup });
})();
