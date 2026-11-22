/* Local course records. These records never write another trainer's progress. */
(function (root) {
  'use strict';
  const key = 'mathexam.arzhenikov.courses.v1';
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const integer = (value, min, max, fallback = min) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  const short = value => typeof value === 'string' ? value.slice(0, 80) : '';
  const fresh = () => ({version: 1, active: '', lessons: {}});
  const record = () => ({phase: 'intro', cursor: 0, cycle: 0, visits: 0, tasks: {},
    reason: {choice: '', wrong: 0, passed: false}, completedAt: null, reviewedAt: null});
  function taskRecord(task) {
    return {input: '', model: Object.fromEntries(task.model.controls.map(c => [c.id, c.initial])),
      moves: 0, modelReady: false, modelShown: false, hint: false, helpUsed: false,
      attempts: 0, firstCorrect: null, firstHelpUsed: null, wrong: 0, solved: false, everSolved: false};
  }
  function valuesValid(model, values) {
    if (!object(values)) return false;
    if (!model.controls.every(c => Number.isFinite(values[c.id]) && values[c.id] >= c.min && values[c.id] <= c.max &&
      Math.abs((values[c.id] - c.min) / c.step - Math.round((values[c.id] - c.min) / c.step)) < 1e-8)) return false;
    if (model.kind === 'fraction' && values.shaded > values.parts) return false;
    if (model.kind === 'triangle' && values.alpha + values.beta >= 180) return false;
    return true;
  }
  function modelMatches(task, draft) {
    return draft.moves > 0 && valuesValid(task.model, draft.model) &&
      task.model.controls.every(c => draft.model[c.id] === c.target);
  }
  function normalize(saved, lessons) {
    const state = fresh();
    if (!object(saved) || saved.version !== 1 || !object(saved.lessons)) return state;
    const ids = new Set(lessons.map(l => l.id));
    if (ids.has(saved.active)) state.active = saved.active;
    for (const lesson of lessons) {
      const source = saved.lessons[lesson.id];
      if (!object(source)) continue;
      const rec = record();
      rec.phase = ['intro', 'task', 'reason', 'summary'].includes(source.phase) ? source.phase : 'intro';
      rec.cycle = source.cycle === 1 ? 1 : 0;
      rec.cursor = integer(source.cursor, 0, rec.cycle ? 1 : 5);
      rec.visits = integer(source.visits, 0, 100000);
      for (const [index, task] of lesson.tasks.entries()) {
        const raw = object(source.tasks) && source.tasks[task.id];
        if (!object(raw)) continue;
        const item = taskRecord(task);
        item.input = short(raw.input);
        if (valuesValid(task.model, raw.model)) {
          item.model = Object.fromEntries(task.model.controls.map(c => [c.id, raw.model[c.id]]));
        }
        item.moves = integer(raw.moves, 0, 1000000);
        item.modelShown = raw.modelShown === true;
        item.hint = raw.hint === true;
        item.helpUsed = raw.helpUsed === true || item.hint || (index >= 2 && item.modelShown);
        item.attempts = integer(raw.attempts, 0, 1000000);
        item.wrong = integer(raw.wrong, 0, item.attempts);
        item.firstCorrect = item.attempts > 0 && typeof raw.firstCorrect === 'boolean' ? raw.firstCorrect : null;
        item.firstHelpUsed = item.firstCorrect === null ? null : typeof raw.firstHelpUsed === 'boolean' ? raw.firstHelpUsed : item.helpUsed;
        item.modelReady = raw.modelReady === true && modelMatches(task, item);
        item.everSolved = raw.everSolved === true && item.attempts > item.wrong && item.firstCorrect !== null;
        item.solved = raw.solved === true && item.everSolved && parseNumber(item.input) === task.answer;
        rec.tasks[task.id] = item;
      }
      const reason = object(source.reason) ? source.reason : {};
      rec.reason.choice = lesson.reason.options.some(o => o.id === reason.choice) ? reason.choice : '';
      rec.reason.wrong = integer(reason.wrong, 0, 1000000);
      rec.reason.passed = reason.passed === true && rec.reason.choice === lesson.reason.answer;
      const learned = lesson.tasks.slice(0, 6).every(t => rec.tasks[t.id]?.everSolved) && rec.reason.passed;
      rec.completedAt = learned ? integer(source.completedAt, 1, Number.MAX_SAFE_INTEGER, 1) : null;
      const reviewed = learned && lesson.tasks.slice(6).every(t => rec.tasks[t.id]?.everSolved);
      rec.reviewedAt = reviewed ? integer(source.reviewedAt, 1, Number.MAX_SAFE_INTEGER, 1) : null;
      if (rec.cycle === 1 && !learned) { rec.cycle = 0; rec.cursor = 0; rec.phase = 'intro'; }
      if ((rec.phase === 'summary' && !(rec.cycle ? reviewed : learned)) ||
          (rec.phase === 'reason' && !lesson.tasks.slice(0, 6).every(t => rec.tasks[t.id]?.everSolved))) rec.phase = 'intro';
      state.lessons[lesson.id] = rec;
    }
    return state;
  }
  function parseNumber(value) {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim().replace(/[\s\u00a0\u202f]/g, '').replace(/\u2212/g, '-');
    if (!/^[+-]?\d+(?:[.,]0+)?$/.test(cleaned)) return null;
    const number = Number(cleaned.replace(',', '.'));
    return Number.isSafeInteger(number) ? number : null;
  }
  function assess(task, draft) {
    const number = parseNumber(draft.input);
    if (number === null) return {kind: 'format', message: 'Введи целое число в поле ответа. Можно использовать знак минус.'};
    const correct = number === task.answer;
    if (draft.firstCorrect === null) { draft.firstCorrect = correct; draft.firstHelpUsed = draft.helpUsed; }
    draft.attempts += 1;
    if (!correct) draft.wrong += 1;
    draft.solved = correct;
    draft.everSolved = draft.everSolved || correct;
    return {kind: correct ? 'correct' : 'wrong', message: correct ? task.explanation : task.hint};
  }
  function resetDraft(task, draft) {
    const newDraft = taskRecord(task);
    for (const field of ['helpUsed', 'attempts', 'firstCorrect', 'firstHelpUsed', 'wrong', 'everSolved']) newDraft[field] = draft[field];
    return newDraft;
  }
  const order = rec => rec.cycle === 1 ? [6, 7] : [0, 1, 2, 3, 4, 5];
  function progress(state, lessons) {
    const completed = [], independent = [];
    let attempted = 0;
    for (const lesson of lessons) {
      const rec = state.lessons[lesson.id];
      if (!rec) continue;
      if (rec.completedAt) completed.push(lesson.id);
      lesson.tasks.forEach((task, index) => {
        const result = rec.tasks[task.id];
        if (result?.attempts) attempted += 1;
        if (index >= 4 && result?.everSolved && result.attempts > 0 && result.firstCorrect === true && result.firstHelpUsed === false) independent.push(task.id);
      });
    }
    return {completed, total: lessons.length, independent, attempted, active: state.active};
  }
  const api = {key, fresh, record, taskRecord, valuesValid, modelMatches, normalize, parseNumber, assess, resetDraft, order, progress};
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ArzhenikovCourseEngine = api;
})(typeof window === 'object' ? window : globalThis);
