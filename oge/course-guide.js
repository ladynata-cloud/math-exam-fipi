/* A short, optional guide to the real course controls. No navigation or storage writes. */
(function () {
  'use strict';
  var primary = document.getElementById('course-continue');
  var topic = document.getElementById('course-next-title');
  var panel = document.getElementById('course-guide-panel');
  var launchers = Array.from(document.querySelectorAll('button[data-course-guide]'));
  if (!primary || !topic || !panel || !launchers.length) return;

  var motion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var duration = 2300;
  var mode = null, phase = 0, state = 'closed', timer = null, deadline = 0, remaining = duration, opener = null;

  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function button(action, text) {
    var element = node('button', 'course-guide-control', text);
    element.type = 'button';
    element.dataset.courseGuideAction = action;
    return element;
  }
  var heading = node('h3', 'course-guide-heading');
  heading.id = 'course-guide-title';
  heading.tabIndex = -1;
  var topicLabel = node('p', 'course-guide-topic');
  topicLabel.id = 'course-guide-topic';
  var steps = node('ol', 'course-guide-steps');
  steps.setAttribute('aria-label', 'Шаги подсказки');
  ['Выбери тему', 'Найди кнопку', 'Твой ход'].forEach(function (text) {
    steps.appendChild(node('li', '', text));
  });
  var message = node('p', 'course-guide-message');
  message.id = 'course-guide-message';
  message.setAttribute('aria-live', 'polite');
  message.setAttribute('aria-atomic', 'true');
  var controls = node('div', 'course-guide-controls');
  var nextButton = button('next', 'Далее');
  var pauseButton = button('pause', 'Пауза');
  var repeatButton = button('repeat', 'Повторить');
  var closeButton = button('close', 'Закрыть');
  [nextButton, pauseButton, repeatButton, closeButton].forEach(function (element) { controls.appendChild(element); });
  panel.replaceChildren(heading, topicLabel, steps, message, controls);
  panel.classList.add('course-guide-panel');
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', heading.id);
  panel.hidden = true;
  panel.dataset.guideState = 'closed';

  function reduced() { return !!(motion && motion.matches); }
  function label() { return primary.textContent.trim().replace(/\s*[→↗]\s*$/, ''); }
  function hasContinuation() { return !/^Начать(?:\s|$)/i.test(label()); }
  function stopTimer() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  }
  function instructions() {
    var action = '«' + label() + '»';
    if (mode === 'resume' && !hasContinuation()) return [
      'Тема для продолжения пока не найдена. Начни с темы выше или выбери другую линию на карте.',
      'Зелёная кнопка ' + action + ' откроет эту тему.',
      'Теперь нажми ' + action + ', чтобы открыть первую тему. Или выбери другую тему на карте ниже.'
    ];
    if (mode === 'resume') return [
      'Выше — тема, к которой можно вернуться по сохранённому выбору или результатам в этом браузере.',
      'Найди зелёную кнопку ' + action + '. Она открывает указанную тему.',
      'Теперь нажми ' + action + '. Откроется тема; продолжение с конкретного задания зависит от тренажёра.'
    ];
    return [
      'Начни с темы выше или выбери другую учебную линию на карте.',
      'Зелёная кнопка ' + action + ' откроет эту тему.',
      'Теперь нажми ' + action + ', чтобы открыть тему. Читай условие и пробуй решить задание.'
    ];
  }
  function refresh() {
    if (!mode) return;
    var isReduced = reduced();
    heading.textContent = mode === 'resume' ? 'Как продолжить обучение' : 'Как начать обучение';
    topicLabel.textContent = 'Тема: ' + topic.textContent.trim();
    message.textContent = instructions()[phase];
    panel.dataset.guideMode = mode;
    panel.dataset.guideStep = String(phase + 1);
    panel.dataset.guideState = state;
    panel.dataset.reducedMotion = String(isReduced);
    Array.from(steps.children).forEach(function (element, index) {
      element.dataset.active = String(index === phase);
      if (index === phase) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
    });
    if ((isReduced || state === 'finished') && document.activeElement === pauseButton) nextButton.focus({preventScroll:true});
    pauseButton.hidden = isReduced || state === 'finished';
    pauseButton.textContent = state === 'paused' ? 'Продолжить показ' : 'Пауза';
    pauseButton.setAttribute('aria-pressed', String(state === 'paused'));
    nextButton.textContent = phase < 2 ? 'Далее' : 'К кнопке курса';
    primary.classList.toggle('course-guide-target', phase > 0);
    primary.dataset.guideMotion = !isReduced && phase === 1 && state !== 'finished' ? 'active' : 'none';
    primary.dataset.guidePaused = String(state !== 'playing');
  }
  function schedule() {
    stopTimer();
    if (state !== 'playing' || reduced()) return;
    deadline = Date.now() + remaining;
    timer = window.setTimeout(function () {
      timer = null;
      remaining = duration;
      if (phase < 2) {
        phase++;
        refresh();
        schedule();
      } else {
        state = 'finished';
        refresh();
      }
    }, remaining);
  }
  function pause() {
    if (state !== 'playing') return;
    remaining = Math.max(0, deadline - Date.now());
    stopTimer();
    state = 'paused';
    refresh();
  }
  function start(selectedMode, source) {
    stopTimer();
    mode = selectedMode;
    phase = 0;
    remaining = duration;
    opener = source || opener;
    state = reduced() ? 'manual' : 'playing';
    panel.hidden = false;
    launchers.forEach(function (element) { element.setAttribute('aria-expanded', String(element.dataset.courseGuide === mode)); });
    refresh();
    schedule();
  }
  function close(restoreFocus) {
    stopTimer();
    mode = null;
    state = 'closed';
    panel.hidden = true;
    panel.dataset.guideState = state;
    primary.classList.remove('course-guide-target');
    primary.removeAttribute('data-guide-motion');
    primary.removeAttribute('data-guide-paused');
    launchers.forEach(function (element) { element.setAttribute('aria-expanded', 'false'); });
    if (restoreFocus && opener && opener.isConnected) opener.focus({preventScroll:true});
  }

  launchers.forEach(function (element) {
    if (element.dataset.courseGuide !== 'start' && element.dataset.courseGuide !== 'resume') return;
    element.hidden = false;
    element.setAttribute('aria-controls', panel.id);
    element.setAttribute('aria-expanded', 'false');
    element.addEventListener('click', function () {
      start(element.dataset.courseGuide, element);
      heading.focus({preventScroll:true});
      var entry = primary.closest('.course-next');
      if (entry && typeof entry.scrollIntoView === 'function') entry.scrollIntoView({block:'start', behavior:'auto'});
    });
  });
  controls.addEventListener('click', function (event) {
    var target = event.target.closest('button[data-course-guide-action]');
    if (!target || !mode) return;
    var action = target.dataset.courseGuideAction;
    if (action === 'close') close(true);
    else if (action === 'repeat') start(mode);
    else if (action === 'pause') {
      if (state === 'playing') pause();
      else if (state === 'paused') { state = 'playing'; refresh(); schedule(); }
    } else if (action === 'next') {
      stopTimer();
      remaining = duration;
      if (phase < 2) { phase++; refresh(); schedule(); }
      else { state = 'finished'; refresh(); primary.focus(); }
    }
  });
  document.addEventListener('keydown', function (event) {
    if (mode && event.key === 'Escape') { close(true); event.preventDefault(); }
  });
  primary.addEventListener('click', function () { if (mode) close(false); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('pagehide', function () { close(false); });
  function motionChanged() {
    if (!mode) return;
    stopTimer();
    remaining = duration;
    state = reduced() ? 'manual' : 'paused';
    refresh();
  }
  if (motion && typeof motion.addEventListener === 'function') motion.addEventListener('change', motionChanged);
  else if (motion && typeof motion.addListener === 'function') motion.addListener(motionChanged);
  if (typeof MutationObserver === 'function') {
    var observer = new MutationObserver(function () { if (mode) refresh(); });
    observer.observe(primary, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['href']});
    observer.observe(topic, {childList:true, subtree:true, characterData:true});
  }
})();
