(function (root) {
  'use strict';

  function assessed(attempt, task, equation) {
    if (!attempt.answers.length || attempt.answers.some(answer => !answer.trim())) return false;
    if (attempt.kind === 'final') {
      return attempt.answers.length === task.final.length ||
        (Boolean(task.independentFinal) && attempt.answers.length === 1) ||
        (Boolean(equation) && attempt.answers.length === equation.fields.length);
    }
    const step = /^step-(0|[1-9]\d*)$/.exec(attempt.kind);
    return Boolean(step) && Number(step[1]) < task.steps.length && attempt.answers.length === 1;
  }

  function collectErrors(storage, catalog, state, equationFields) {
    const items = [];
    for (const { lesson, label } of catalog) {
      for (const [index, task] of lesson.tasks.entries()) {
        try {
          const record = JSON.parse(storage.getItem(state.PREFIX + task.id));
          if (!state.valid(record, task.id) || record.solvedSteps.length > task.steps.length ||
              record.drafts.steps.length > task.steps.length || record.drafts.final.length > task.final.length ||
              record.solutionSteps > task.solution.length) continue;

          const equation = equationFields?.forTask(lesson, task, 'independent', index >= 3);
          const pending = new Map();
          let mistakes = 0;
          let lastWrong;
          for (const attempt of record.attempts) {
            if (!assessed(attempt, task, equation)) continue;
            if (!attempt.correct) {
              mistakes++;
              lastWrong = attempt;
              pending.set(attempt.kind, attempt);
            } else if (attempt.kind === 'final') {
              pending.clear();
            } else {
              pending.delete(attempt.kind);
            }
          }
          if (!lastWrong) continue;

          const latest = pending.size
            ? record.attempts.findLast(attempt => pending.get(attempt.kind) === attempt)
            : lastWrong;
          const isStep = latest.kind !== 'final';
          const mode = isStep ? 'guided' : 'independent';
          items.push({
            label,
            title: lesson.title,
            index: index + 1,
            mistakes,
            stage: isStep ? 'Шаг ' + (Number(latest.kind.slice(5)) + 1) : 'Итоговый ответ',
            date: latest.at > 0 && latest.at <= 8.64e15 ? latest.at : 0,
            corrected: pending.size === 0,
            href: 'part-two/#task/' + encodeURIComponent(task.id) + '/' + mode,
          });
        } catch (_) {
          // An unreadable record cannot obscure other tasks or the older journal.
        }
      }
    }
    return items.sort((a, b) => b.date - a.date || a.href.localeCompare(b.href));
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { collectErrors };
    return;
  }

  const document = root.document;
  const list = document.getElementById('partTwoMistakeList');
  const state = root.ProfilePartTwoState;
  let catalog;
  let refreshVersion = 0;

  function make(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function rows(heading, items, open) {
    const details = make('details', '', 'part-two-review-group');
    details.open = open;
    details.append(make('summary', heading + ' · ' + items.length));
    for (const item of items) {
      const row = make('div', '', 'row');
      const body = make('div');
      body.append(
        make('span', item.label, 'pillline'),
        make('span', item.title, 'name'),
        make('div', 'Условие ' + item.index + ' · ' + item.stage +
          ' · промахов в истории: ' + item.mistakes +
          (item.date ? ' · ' + new Date(item.date).toLocaleDateString('ru-RU') : ''), 'meta')
      );
      const link = make('a', 'Вернуться к условию', 'btn ghost');
      link.href = item.href;
      link.setAttribute('aria-label', 'Вернуться к условию ' + item.index + ' · ' + item.title);
      row.append(body, link);
      details.append(row);
    }
    return details;
  }

  function getCatalog() {
    return catalog ??= Promise.all([
      import('./exam-map.js'),
      import('./part-two/content-algebra.js'),
      import('./part-two/content-geometry.js'),
      import('./part-two/content-models.js'),
      import('./part-two/content-finance.js'),
      import('./part-two/equation-fields.js'),
    ]).then(() => {
      const map = root.ProfileExamMap;
      const practice = root.ProfilePartTwoLessons.flatMap(lesson => {
        const entry = map.fromLegacyPartTwo(lesson.exam);
        return entry?.lessonIds.includes(lesson.id) ? [{ lesson, label: map.label(entry) }] : [];
      });
      const finance = root.ProfileFinanceWrittenLessons.map(lesson => ({ lesson, label: map.label(16) }));
      return practice.concat(finance);
    }).catch(error => {
      catalog = undefined;
      throw error;
    });
  }

  async function refresh() {
    const version = ++refreshVersion;
    try {
      const storage = root.localStorage;
      let hasPartTwo = false;
      for (let i = 0; i < storage.length && !hasPartTwo; i++) {
        hasPartTwo = storage.key(i)?.startsWith(state.PREFIX);
      }
      const items = hasPartTwo ? collectErrors(storage, await getCatalog(), state, root.ProfileEquationFields) : [];
      if (version !== refreshVersion) return;
      const remaining = items.filter(item => !item.corrected);
      const corrected = items.filter(item => item.corrected);
      const groups = [];
      if (remaining.length) groups.push(rows('К повтору', remaining, true));
      if (corrected.length) groups.push(rows('Исправлено', corrected, false));
      list.replaceChildren(...(groups.length ? groups :
        [make('p', 'В этом браузере ещё нет сохранённых ошибок второй части.', 'small muted')]));
    } catch (_) {
      if (version === refreshVersion) list.replaceChildren(
        make('p', 'Не удалось открыть историю второй части. Попробуйте обновить страницу.', 'small muted')
      );
    }
  }

  root.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith(state.PREFIX)) void refresh();
  });
  root.addEventListener('pageshow', event => {
    if (event.persisted) void refresh();
  });
  void refresh();
})(typeof globalThis === 'object' ? globalThis : this);
