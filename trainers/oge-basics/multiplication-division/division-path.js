(function () {
  'use strict';
  const G = window.DivisionGuided;
  const KEY = 'mathExamBasics.guidedDivision.v1';
  const topics = ['start','oneDigit','zero','remainder','twoDigit','decimalNatural','appendZeros','decimalDivisor'];
  const counts = Object.fromEntries(topics.map(id => [id, new Set()]));
  function render() {
    for (const set of Object.values(counts)) set.clear();
    let raw, saved, unavailable = false;
    try {
      raw = localStorage.getItem(KEY);
      saved = raw ? JSON.parse(raw) : null;
      if (saved && (saved.version !== 1 || !Array.isArray(saved.records) || saved.records.length > 10000)) throw Error('format');
      for (const record of saved?.records || []) {
        if (!record || !record.task || !topics.includes(record.topic)) continue;
        if (![record.errors,record.hints,record.reveals].every(n => Number.isSafeInteger(n) && n >= 0)) continue;
        if (record.errors || record.hints || record.reveals || record.repeated !== false) continue;
        const plan = G.plan(record.task);
        if (plan.topicId === record.topic) counts[record.topic].add(record.task.dividend + ':' + record.task.divisor);
      }
    } catch (_) { unavailable = true; }
    let practised = 0;
    topics.forEach(id => {
      const n = counts[id].size, el = document.querySelector('[data-progress="' + id + '"]');
      if (n >= 3) practised++;
      el.textContent = unavailable ? 'Сохранённый результат сейчас недоступен.' : n ? 'По шагам без ошибок и подсказок: ' + n + '. Ориентир — 3 разных примера.' : 'Пока нет примеров без ошибок и подсказок.';
      document.querySelector('[data-topic="' + id + '"]').classList.toggle('is-practised', !unavailable && n >= 3);
    });
    const notice = document.getElementById('progress-notice');
    notice.hidden = !unavailable;
    notice.textContent = 'Не удалось прочитать весь сохранённый прогресс. Прежние записи оставлены без изменений; упражнения доступны.';
    document.getElementById('path-summary').textContent = unavailable ? 'Прогресс не пересчитан.' : 'По 3 разных примера без ошибок и подсказок: ' + practised + ' из 8 ступеней. Это тренировка по шагам, а не итоговая проверка.';
    const link = document.getElementById('continue-division'), note = document.getElementById('continue-note');
    const active = saved?.active, s = saved?.sessions?.[active];
    let resumable = false;
    try {
      if (s && topics.includes(active) && s.task?.topicId === active && s.done === false && Number.isInteger(s.step) && s.step >= 0 && Array.isArray(s.answers)) {
        const p = G.plan(s.task);
        resumable = s.step < p.actions.length && s.answers.length === s.step + (s.accepted === true ? 1 : 0) && s.answers.every((v,i) => G.check(v,p.actions[i]));
      }
    } catch (_) {}
    if (!unavailable && resumable) {
      link.href = '/trainers/long-division-stepwise.html#' + active;
      link.textContent = 'Продолжить начатый пример';
      note.textContent = 'Продолжим с сохранённого шага. Выбрать другую ступень можно ниже.';
    } else {
      const next = topics.find(id => counts[id].size < 3);
      link.href = next ? '/trainers/long-division-stepwise.html#' + next : 'division-checkpoint.html';
      link.textContent = next ? (practised ? 'К следующей ступени' : 'Начать с простого') : 'Проверить себя самостоятельно';
      note.textContent = 'Можно начать с любого шага. Предварительная проверка необязательна.';
    }
  }
  function revealLinkedSkill() {
    const map = document.getElementById('division-skill-map');
    if (!map) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch (_) { return; }
    const target = id && document.getElementById(id);
    if (target && (target === map || map.contains(target))) map.open = true;
  }
  render();
  revealLinkedSkill();
  window.addEventListener('hashchange', revealLinkedSkill);
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) render(); });
})();
