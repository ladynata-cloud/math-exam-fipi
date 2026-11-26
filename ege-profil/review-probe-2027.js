(function (root) {
  'use strict';

  const KEY = 'mathExamCourseProgress.v1';
  const HISTORY = 'full-exam-2027-v1';
  const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

  function latestAttempt(attempts, entries) {
    if (!Array.isArray(attempts)) return null;
    for (let i = attempts.length - 1; i >= 0; i--) {
      const attempt = attempts[i];
      if (!isObject(attempt) || attempt.test !== null ||
          !Number.isSafeInteger(attempt.ts) || attempt.ts <= 0 || attempt.ts > 8.64e15 ||
          !isObject(attempt.lines)) continue;

      const results = entries.map(entry => ({ entry, points: attempt.lines[entry.number] }));
      if (!results.every(({ entry, points }) => Number.isInteger(points) && points >= 0 && points <= entry.points) ||
          results.reduce((total, result) => total + result.points, 0) !== attempt.primary) continue;

      // #647 stores neither submitted answers nor explicit written zero marks.
      // A short zero proves only that no point was earned; a written zero does not prove a mark was set.
      const short = results.filter(({ entry }) => entry.part === 1);
      return {
        date: attempt.ts,
        shortPoints: short.reduce((total, result) => total + result.points, 0),
        losses: short.filter(({ points }) => points === 0),
        written: results.filter(({ entry }) => entry.part === 2),
      };
    }
    return null;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { latestAttempt };
    return;
  }

  const document = root.document;
  const container = document.getElementById('probe2027Result');
  let refreshVersion = 0;

  function node(tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function resultRow(result, status, map) {
    const { entry } = result;
    const row = node('div', '', 'row');
    const title = node('div');
    title.append(node('span', map.label(entry), 'pillline'), node('span', entry.title, 'name'));
    if (status) title.append(node('div', status, 'meta'));
    const link = node('a', 'Отработать тему', 'btn ghost');
    link.href = entry.part === 2 ? '/ege-profil/part-two/' + map.hash(entry) : map.href(entry);
    link.setAttribute('aria-label', 'Отработать задание № ' + entry.number + ' · ' + entry.title);
    row.append(title, link);
    return row;
  }

  function render(attempt, map) {
    if (!attempt) {
      container.replaceChildren(node('p', 'Разбор появится после завершения пробника в этом браузере.', 'small muted'));
      return;
    }
    const short = node('p', new Date(attempt.date).toLocaleDateString('ru-RU') +
      ' · Краткие ответы: ' + attempt.shortPoints + ' из 12', 'small muted');
    short.dataset.probeAttempt = '';
    const losses = node('div');
    if (attempt.losses.length) {
      losses.append(node('h3', 'Краткие ответы без балла'));
      losses.append(...attempt.losses.map(result => resultRow(result, '', map)));
    } else {
      losses.append(node('p', 'Все краткие ответы зачтены.', 'small okline'));
    }
    const scored = attempt.written.filter(({ points }) => points > 0).length;
    const pending = attempt.written.length - scored;
    const written = node('details', '', 'part-two-review-group');
    written.append(node('summary', 'Письменные задания · к проверке ' + pending + ' · самооценка ' + scored));
    if (pending) written.append(node('p', 'Пробник сохраняет одинаковый ноль для выставленных 0 баллов и отсутствия оценки. Эти задания остаются к проверке.', 'small muted'));
    written.append(...attempt.written.map(result => resultRow(result, result.points > 0
      ? 'Самооценка · ' + result.points + ' из ' + result.entry.points
      : 'К проверке', map)));
    container.replaceChildren(short, losses, written);
  }

  async function refresh() {
    const version = ++refreshVersion;
    try {
      const attempts = JSON.parse(root.localStorage.getItem(KEY) || 'null')?.[HISTORY]?.attempts;
      if (!Array.isArray(attempts) || !attempts.length) {
        render(null);
        return;
      }
      if (!root.ProfileExamMap) await import('./exam-map.js');
      if (version !== refreshVersion) return;
      const map = root.ProfileExamMap;
      render(latestAttempt(attempts, map.entries), map);
    } catch (_) {
      if (version === refreshVersion) container.replaceChildren(node('p', 'Не удалось открыть разбор пробника 2027.', 'small muted'));
    }
  }

  root.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) void refresh();
  });
  root.addEventListener('pageshow', event => {
    if (event.persisted) void refresh();
  });
  void refresh();
})(typeof globalThis === 'object' ? globalThis : this);
