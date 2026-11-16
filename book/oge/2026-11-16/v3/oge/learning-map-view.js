(function () {
  'use strict';
  var model = window.OgeLearningMap;
  var root = document.getElementById('learning-map');
  if (!model || !root) return;
  var CURSOR_KEY = 'mathexam.oge.course-navigation.v1';
  var storage;
  try { storage = window.localStorage; } catch (_) { storage = null; }
  var memoryCursor = null;
  function readCursor() {
    if (memoryCursor) return memoryCursor;
    try {
      var value = JSON.parse(storage.getItem(CURSOR_KEY));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (_) { return null; }
  }
  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function render() {
    var data = model.snapshot(storage);
    var next = model.recommend(data, readCursor());
    var list = document.getElementById('course-track-list');
    var open = Array.from(list.querySelectorAll('details[open]')).map(function (el) { return el.dataset.trackId; });
    var focus = document.activeElement;
    var focusContinue = focus && focus.id === 'course-continue';
    var focusStep = !focusContinue && focus && focus.getAttribute('data-course-step');
    var focusTrack = focus && focus.tagName === 'SUMMARY' && focus.parentElement.dataset.trackId;
    var fragment = document.createDocumentFragment();
    data.tracks.forEach(function (track) {
      var card = node('details', 'course-track');
      card.dataset.trackId = track.id;
      card.open = open.indexOf(track.id) !== -1;
      var summary = node('summary');
      summary.appendChild(node('strong', 'course-track-title', track.title));
      summary.appendChild(node('span', 'course-track-description', track.summary));
      var started = track.steps.filter(function (step) { return step.started; }).length;
      var meter = node('span', 'course-track-meter');
      meter.setAttribute('aria-hidden', 'true');
      var fill = node('span');
      fill.style.width = (data.storageAvailable ? 100 * started / track.steps.length : 0) + '%';
      meter.appendChild(fill);
      summary.appendChild(meter);
      summary.appendChild(node('span', 'course-track-count', data.storageAvailable ? 'Начато тем: ' + started + ' из ' + track.steps.length : 'Результаты сейчас недоступны'));
      card.appendChild(summary);
      var steps = node('ol', 'course-steps');
      track.steps.forEach(function (step) {
        var li = node('li');
        var a = node('a', 'course-step');
        a.href = step.href;
        a.dataset.courseStep = step.id;
        a.dataset.started = String(step.started);
        if (next && next.step.id === step.id) a.dataset.current = 'true';
        var text = node('span');
        text.appendChild(node('span', 'course-step-title', step.title));
        text.appendChild(node('span', 'course-step-status', data.storageAvailable ? step.label : 'Открыть тему'));
        a.appendChild(text);
        li.appendChild(a);
        steps.appendChild(li);
      });
      card.appendChild(steps);
      fragment.appendChild(card);
    });
    list.replaceChildren(fragment);
    document.getElementById('course-progress-summary').textContent = data.storageAvailable ? 'Начато ' + data.totals.started + ' из ' + data.totals.total + ' тем' : 'Все темы доступны';
    document.getElementById('course-storage-note').textContent = data.storageAvailable && data.invalidData ? 'Часть сохранённых результатов не удалось прочитать. Здесь показаны доступные данные; прежние записи не изменены. Полоски показывают начатые темы, а не самостоятельное освоение.' : data.storageAvailable ? 'Здесь — практика в этом браузере. Полоски показывают начатые темы; результаты с подсказкой не подтверждают самостоятельное освоение.' : 'Не удалось прочитать результаты в этом браузере. Можно открыть любую тему; сохранённые данные не изменены.';
    if (next) {
      var link = document.getElementById('course-continue');
      link.href = next.step.href;
      link.dataset.courseStep = next.step.id;
      link.textContent = next.reason === 'start' ? 'Начать обучение →' : 'Продолжить →';
      document.getElementById('course-next-title').textContent = next.step.title;
      document.getElementById('course-next-note').textContent = next.reason === 'start' ? 'Начни с короткой практики. Если тема знакома, выбери другую линию ниже.' : 'Вернись к этой теме. После разбора попробуй новый пример без подсказки.';
    }
    if (focusContinue) {
      document.getElementById('course-continue').focus({preventScroll:true});
    } else if (focusStep) {
      var replacement = Array.from(list.querySelectorAll('[data-course-step]')).find(function (el) { return el.dataset.courseStep === focusStep; });
      if (replacement) replacement.focus({preventScroll:true});
    } else if (focusTrack) {
      var parent = Array.from(list.querySelectorAll('[data-track-id]')).find(function (el) { return el.dataset.trackId === focusTrack; });
      if (parent) parent.querySelector('summary').focus({preventScroll:true});
    }
  }
  // Save only a validated navigation choice. Never write trainer results.
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('a[data-course-step]');
    if (!target || event.defaultPrevented || (event.button !== undefined && event.button !== 0)) return;
    var id = target.dataset.courseStep;
    var allowed = model.tracks.some(function (track) { return track.steps.some(function (step) { return step.id === id; }); });
    if (!allowed) return;
    memoryCursor = {stepId:id, at:Date.now()};
    try { storage.setItem(CURSOR_KEY, JSON.stringify(memoryCursor)); } catch (_) {}
  });
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', function () { memoryCursor = null; render(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
  render();
})();
