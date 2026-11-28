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
      attempts: 0, firstCorrect: null, firstHelpUsed: null, wrong: 0, solved: false, everSolved: false,
      steps: Object.fromEntries((task.steps || []).map(step => [step.id, {input: '', attempts: 0, wrong: 0, solved: false, hint: false}]))};
  }
  function valuesValid(model, values) {
    if (!object(values)) return false;
    if (!model.controls.every(c => Number.isFinite(values[c.id]) && values[c.id] >= c.min && values[c.id] <= c.max &&
      Math.abs((values[c.id] - c.min) / c.step - Math.round((values[c.id] - c.min) / c.step)) < 1e-8)) return false;
    if (model.kind === 'fraction' && values.shaded > values.parts) return false;
    if (model.kind === 'fraction-area' && (values.width > values.cols || values.height > values.rows)) return false;
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
        let previousSolved = true;
        for (const step of task.steps || []) {
          const sourceStep = object(raw.steps) && raw.steps[step.id];
          if (!object(sourceStep)) { previousSolved = false; continue; }
          const entry = item.steps[step.id];
          entry.input = short(sourceStep.input);
          entry.hint = sourceStep.hint === true;
          if (entry.hint) item.helpUsed = true;
          entry.attempts = integer(sourceStep.attempts, 0, 1000000);
          entry.wrong = integer(sourceStep.wrong, 0, entry.attempts);
          entry.solved = previousSolved && sourceStep.solved === true && entry.attempts > entry.wrong &&
            checkAnswer(step, entry.input).kind === 'correct';
          previousSolved = entry.solved;
          if (entry.wrong && item.firstCorrect === null) item.firstCorrect = false;
        }
        if (item.firstCorrect !== null && typeof raw.firstHelpUsed !== 'boolean') item.firstHelpUsed = item.helpUsed;
        item.everSolved = raw.everSolved === true && item.attempts > item.wrong && item.firstCorrect !== null;
        item.solved = raw.solved === true && item.everSolved && stepsComplete(task, item) &&
          checkAnswer(task, item.input).kind === 'correct';
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
  const gcd = (a, b) => { a = Math.abs(a); while (b) { const next = a % b; a = b; b = next; } return a || 1; };
  // Exact reduced integers, never an eval or a binary-float tolerance.
  // Keep the original notation as well: equivalent values are not yet a
  // completed "reduce" or "use this denominator" transformation.
  function parseRational(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value).trim().replace(/\u2212/g, '-').replace(/[\u00a0\u202f]/g, ' ');
    if (!text || text.length > 80) return null;
    let n, d, notation, rawNumerator, rawDenominator;
    const mixed = text.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    const fraction = text.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    const decimal = text.replace(/\s/g, '').match(/^([+-]?)(\d+)(?:[.,](\d+))?$/);
    if (mixed) {
      const whole = Number(mixed[2]), part = Number(mixed[3]);
      d = Number(mixed[4]);
      if (part >= d || d <= 0) return null;
      n = (whole * d + part) * (mixed[1] === '-' ? -1 : 1);
      notation = 'mixed'; rawNumerator = part; rawDenominator = d;
    } else if (fraction) {
      n = Number(fraction[1]); d = Number(fraction[2]); notation = 'fraction';
      rawNumerator = n; rawDenominator = d;
    } else if (decimal) {
      const digits = decimal[3] || '';
      if (digits.length > 9) return null;
      d = 10 ** digits.length;
      n = Number(decimal[2] + digits) * (decimal[1] === '-' ? -1 : 1);
      notation = digits.length ? 'decimal' : 'integer';
      rawNumerator = n; rawDenominator = d;
    } else return null;
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d <= 0) return null;
    const divisor = gcd(n, d);
    return {n: n / divisor, d: d / divisor, notation, rawNumerator, rawDenominator};
  }
  function formatHelp(item) {
    const format = item.answerFormat || 'integer';
    if (format === 'comparison') return 'Выбери знак <, > или =.';
    if (format === 'mixed') return 'Смешанное число запиши так: 1 1/2. Для целого ответа достаточно числа.';
    if (format === 'fraction') return 'Дробь запиши так: 3/4; смешанное число — 1 1/2.';
    if (format === 'decimal') return 'Можно поставить запятую или точку: например, 0,25.';
    return 'Введи целое число. Можно использовать знак минус.';
  }
  function checkAnswer(item, input) {
    const format = item.answerFormat || 'integer';
    if (format === 'comparison') {
      const value = typeof input === 'string' ? input.trim() : '';
      if (!['<', '>', '='].includes(value)) return {kind: 'format', message: formatHelp(item)};
      return {kind: value === item.answer ? 'correct' : 'wrong'};
    }
    const value = format === 'integer'
      ? (parseNumber(String(input)) === null ? null : parseRational(input))
      : parseRational(input);
    const expected = parseRational(item.answer);
    if (!value) return {kind: 'format', message: formatHelp(item)};
    if (!expected || value.n !== expected.n || value.d !== expected.d) return {kind: 'wrong'};
    if (format === 'decimal' && ['fraction', 'mixed'].includes(value.notation)) {
      return {kind: 'format', message: 'Значение верное. Теперь запиши его десятичной дробью: с запятой или точкой.'};
    }
    if (format === 'mixed' && value.d !== 1 && Math.abs(value.n) > value.d && value.notation !== 'mixed') {
      return {kind: 'format', message: 'Значение верное. Выдели целую часть и запиши смешанное число, например 1 1/2.'};
    }
    if (format === 'fraction' && value.notation === 'decimal') {
      return {kind: 'format', message: 'Значение верное. Запиши обыкновенную дробь через /, например 3/4.'};
    }
    if (item.requiredDenominator && (value.notation !== 'fraction' || value.rawDenominator !== item.requiredDenominator)) {
      return {kind: 'format', message: 'Значение верное. В этом шаге нужен знаменатель ' + item.requiredDenominator + '. Найди соответствующий числитель.'};
    }
    if (item.requireReduced && gcd(value.rawNumerator, value.rawDenominator) !== 1) {
      return {kind: 'format', message: 'Значение верное. Сократи числитель и знаменатель на общий делитель.'};
    }
    return {kind: 'correct'};
  }
  const stepsComplete = (task, draft) => (task.steps || []).every(step =>
    draft.steps?.[step.id]?.solved && checkAnswer(step, draft.steps[step.id].input).kind === 'correct');
  function assessStep(task, draft, id) {
    const index = (task.steps || []).findIndex(step => step.id === id);
    if (index < 0 || task.steps.slice(0, index).some(step => !draft.steps[step.id]?.solved)) {
      return {kind: 'blocked', message: 'Сначала закончи предыдущий шаг.'};
    }
    const step = task.steps[index], entry = draft.steps[id];
    if (entry.solved) return {kind: 'correct', message: step.explanation};
    const result = checkAnswer(step, entry.input);
    if (result.kind === 'format') return result;
    const correct = result.kind === 'correct';
    entry.attempts += 1; draft.attempts += 1;
    if (!correct) {
      entry.wrong += 1; draft.wrong += 1;
      if (draft.firstCorrect === null) { draft.firstCorrect = false; draft.firstHelpUsed = draft.helpUsed; }
    }
    entry.solved = correct;
    return {kind: correct ? 'correct' : 'wrong', message: correct ? step.explanation : step.hint};
  }
  function assess(task, draft) {
    if (!stepsComplete(task, draft)) return {kind: 'blocked', message: 'Запиши и проверь промежуточные шаги, затем итоговый ответ.'};
    const result = checkAnswer(task, draft.input);
    if (result.kind === 'format') return result;
    const correct = result.kind === 'correct';
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
  const api = {key, fresh, record, taskRecord, valuesValid, modelMatches, normalize, parseNumber,
    parseRational, checkAnswer, formatHelp, stepsComplete, assessStep, assess, resetDraft, order, progress};
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ArzhenikovCourseEngine = api;
})(typeof window === 'object' ? window : globalThis);
