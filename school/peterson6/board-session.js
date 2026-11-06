(function (root) {
  'use strict';

  // This adapter is a transport projection, not a personal-progress store.
  // It never reads storage and never accepts independent-credit claims.
  const LIMITS = Object.freeze({ workBytes: 48 * 1024, snapshotBytes: 60 * 1024, records: 2000, draft: 200, note: 2000 });
  const PART_MAX = Object.freeze({ 1: 497, 2: 589, 3: 778 });
  const generatedTask = id => /^(?:practice|check):/.test(id);
  const TASK_FIELDS = ['value', 'values', 'step', 'guided', 'assisted', 'hint', 'stepHints', 'reveals', 'attempts', 'correct', 'independent', 'note', 'feedback', 'signature', 'repeated', 'completion'];
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  const text = (value, max) => typeof value === 'string' && value.length <= max && !/<\/?[a-z][^>]*>/i.test(value);
  const matchExact = (pattern, value) => {
    const result = typeof value === 'string' && pattern.exec(value);
    return result && result[0] === value ? result : null;
  };
  const fields = (value, names) => object(value) && Reflect.ownKeys(value).length === names.length && names.every(name => {
    const property = Object.getOwnPropertyDescriptor(value, name);
    return property && property.enumerable && has(property, 'value');
  });
  const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
  const copy = value => JSON.parse(JSON.stringify(value));

  // Inspect descriptors before reading values. In particular, validation must
  // not run an incoming getter or an inherited toJSON implementation.
  function safeJson(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return text(value, 15000);
    if ((!object(value) && !Array.isArray(value)) || seen.has(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > LIMITS.records ||
        keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, i) => has(value, i)).every(Boolean))) return false;
    seen.add(value);
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const property = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) ||
          !property.enumerable || !has(property, 'value') || !safeJson(property.value, depth + 1, seen)) return false;
    }
    seen.delete(value);
    return true;
  }

  function create({ lessons, math, models }) {
    const lessonIds = Array.from({ length: Array.isArray(lessons) ? lessons.length : 0 }, (_, i) => 'p' + String(i + 1).padStart(2, '0'));
    if (!Array.isArray(lessons) || lessons.length < 14 || lessons.length > 58 || new Set(lessons.map(l => l.id)).size !== lessons.length ||
        !lessonIds.every(id => lessons.some(l => l.id === id)) || !math?.check || !math?.generate || !models?.validateBoardState)
      throw new TypeError('Incomplete Peterson board course');
    const known = new Map(lessons.map(l => [l.id, l]));
    const tasks = new Map(lessons.flatMap(l => l.tasks.map(t => [t.id, t])));
    const taskLessons = new Map(lessons.flatMap(l => l.tasks.map(t => [t.id, l])));
    const skills = new Set(math.skills.map(s => s.id));
    const generated = new Map();
    function practiceKey(key) {
      const match = matchExact(/^([a-z-]+):([123])$/, key);
      return match && skills.has(match[1]) ? match : null;
    }
    function resolveTask(id) {
      if (tasks.has(id)) return tasks.get(id);
      const match = matchExact(/^(practice|check):([a-z-]+):([123]):([1-9]\d{0,5})$/, id);
      if (!match || !skills.has(match[2])) return null;
      if (!generated.has(id)) {
        if (generated.size >= LIMITS.records) generated.clear();
        generated.set(id, { ...math.generate(match[2], Number(match[4]), Number(match[3])), id });
      }
      return generated.get(id);
    }
    function validRoute(hash) {
      if (['#home', '#skills', '#progress', '#diagnostic'].includes(hash)) return true;
      if (typeof hash !== 'string') return false;
      let match = matchExact(/^#lesson\/(p\d{2})(?:\/(0|[1-9]\d?))?$/, hash);
      if (match) return known.has(match[1]) && Number(match[2] || 0) < known.get(match[1]).tasks.length;
      match = matchExact(/^#(?:practice|check)\/([a-z-]+)\/([123])$/, hash);
      return !!match && skills.has(match[1]);
    }
    function activeTask(route, work) {
      const [page, id, position] = route.slice(1).split('/');
      if (page === 'lesson') return known.get(id).tasks[Number(position || 0)];
      if (page === 'practice' || page === 'check') {
        const seed = work.practice[id + ':' + position];
        return seed ? resolveTask(page + ':' + id + ':' + position + ':' + seed) : null;
      }
      return null;
    }
    const signature = task => task.prompt + '\u241f' + task.answer + '\u241f' + (task.answerFormat || '');
    const check = (value, task) => task.kind === 'instruction' ? value === 'done' : task.kind === 'manual' ? false : task.kind === 'choice' ? value === task.answer : math.check(value, task.answer, task.answerFormat);
    const feedback = task => task.kind === 'manual' ? ['', 'Записано для проверки.', 'Сначала запиши рассуждение или укажи, что оно находится в тетради.'] : [
      '', task.kind === 'choice' ? 'Сначала выбери ответ.' : 'Сначала введи результат.',
      'Пока не совпало. ' + (task.kind === 'choice' ? 'Проверь смысл каждого варианта.' : task.answerFormat ?
        'Проверь вычисление и требуемую запись ответа.' : task.id.startsWith('check:') ? 'Проверь действие и вычисление. Для помощи вернись к тренировке.' : 'Проверь действие и вычисление. Можно открыть подсказку или отдельную тренировку.'),
      ...(generatedTask(task.id) ? ['В этой подборке пока не нашёлся новый пример. Выбери другую сложность или другой навык.'] : [])
    ];
    const freshTuple = () => ['', [], 0, 0, [], [], 0, '', '', false];
    function sortedIndices(value, total, step) {
      return Array.isArray(value) && value.length <= total && value.every((index, i) =>
        integer(index, 0, total - 1) && index <= step && (!i || value[i - 1] < index));
    }
    function tupleValid(value, task) {
      if (!Array.isArray(value) || value.length !== 10) return false;
      const [answer, values, step, flags, hints, reveals, attempts, note, message, repeated] = value;
      if (!text(answer, LIMITS.draft) || !Array.isArray(values) || values.length > task.steps.length ||
          !values.every(v => text(v, LIMITS.draft)) || !integer(step, 0, task.steps.length) ||
          values.length < step || values.length > step + 1 || !integer(flags, 0, 15) ||
          !sortedIndices(hints, task.steps.length, step) || !sortedIndices(reveals, task.steps.length, step) ||
          !integer(attempts, 0, 1000000) || !text(note, LIMITS.note) || !feedback(task).includes(message) ||
          typeof repeated !== 'boolean' || (!generatedTask(task.id) && repeated)) return false;
      const guided = !!(flags & 1), assisted = !!(flags & 2), hint = !!(flags & 4), correct = !!(flags & 8);
      if (task.kind === 'manual' && (!['', 'recorded'].includes(answer) || correct || attempts !== 0 || (answer === 'recorded' && !note.trim()))) return false;
      if (task.id.startsWith('check:') && (guided || assisted || hint || step || values.length || hints.length || reveals.length || repeated)) return false;
      if ((!task.steps.length && guided) || (step && !values.slice(0, step).every((v, i) => check(v, task.steps[i]))) ||
          (!correct && (guided || hint || step || hints.length || reveals.length) && !assisted) ||
          (correct && (!attempts || !check(answer, task) || (message !== '' &&
            (!generatedTask(task.id) || message !== feedback(task)[3]))))) return false;
      if (task.kind === 'choice' && answer !== '' && !task.choices.includes(answer)) return false;
      return true;
    }
    function workValid(work) {
      if (!safeJson(work) || !fields(work, ['tasks', 'practice', 'last', 'origin', 'models']) || !object(work.tasks) ||
          !object(work.practice) || !object(work.models) || Object.keys(work.models).length > LIMITS.records || Object.keys(work.tasks).length > LIMITS.records ||
          Object.keys(work.practice).length > skills.size * 3 || bytes(work) > LIMITS.workBytes) return false;
      const seen = new Set();
      for (const [id, tuple] of Object.entries(work.tasks)) {
        const task = resolveTask(id);
        if (!task || !tupleValid(tuple, task)) return false;
        if (generatedTask(id)) {
          const token = signature(task);
          if (tuple[9] !== seen.has(token)) return false;
          seen.add(token);
          const [, skill, level, seed] = id.split(':');
          if (!integer(work.practice[skill + ':' + level], Number(seed), 999999)) return false;
        }
      }
      for (const [id, value] of Object.entries(work.models)) {
        if (!tasks.has(id) || !models.validateBoardState(taskLessons.get(id), value, tasks.get(id))) return false;
      }
      for (const [key, seed] of Object.entries(work.practice)) if (!practiceKey(key) || !integer(seed, 1, 999999)) return false;
      if (work.last !== null && (!validRoute(work.last) || !/^#(?:lesson|practice|check)\//.test(work.last))) return false;
      if (work.origin !== null && (!fields(work.origin, ['hash', 'scroll']) || !validRoute(work.origin.hash) ||
          !work.origin.hash.startsWith('#lesson/') || !Number.isFinite(work.origin.scroll) || work.origin.scroll < 0 || work.origin.scroll > 10000000)) return false;
      return true;
    }
    function pack(state) {
      if (!safeJson(state) || !fields(state, ['version', 'tasks', 'practice', 'last', 'origin', 'models']) || state.version !== 1 ||
          !object(state.tasks) || !object(state.practice) || !object(state.models)) throw new TypeError('Invalid Peterson runtime state');
      const work = { tasks: {}, practice: {}, last: state.last?.hash || null, origin: state.origin ? copy(state.origin) : null, models: copy(state.models) };
      for (const [id, record] of Object.entries(state.tasks)) {
        const task = resolveTask(id);
        if (!task || !fields(record, TASK_FIELDS) || (task.kind === 'manual' && (record.independent || record.completion !== null))) throw new TypeError('Invalid Peterson task record');
        const indices = map => {
          if (!object(map) || !Object.entries(map).every(([key, value]) => /^(0|[1-9]\d?)$/.test(key) &&
              Number(key) < task.steps.length && typeof value === 'boolean')) throw new TypeError('Invalid step help');
          return Object.keys(map).filter(key => map[key]).map(Number).sort((a, b) => a - b);
        };
        for (const flag of ['guided', 'assisted', 'hint', 'correct', 'independent', 'repeated'])
          if (typeof record[flag] !== 'boolean') throw new TypeError('Invalid task flag');
        const tuple = [record.value, [...record.values], record.step,
          Number(record.guided) + 2 * Number(record.assisted) + 4 * Number(record.hint) + 8 * Number(record.correct),
          indices(record.stepHints), indices(record.reveals), record.attempts, record.note, record.feedback, record.repeated];
        if (generatedTask(id) || JSON.stringify(tuple) !== JSON.stringify(freshTuple())) work.tasks[id] = tuple;
      }
      for (const [key, value] of Object.entries(state.practice)) {
        if (!fields(value, ['seed'])) throw new TypeError('Invalid practice seed record');
        work.practice[key] = value.seed;
      }
      if (!workValid(work)) throw new TypeError('Invalid or oversized Peterson board work');
      return work;
    }
    function unpack(work) {
      if (!workValid(work)) throw new TypeError('Invalid Peterson board work');
      const state = { version: 1, tasks: {}, practice: {}, last: work.last ? { hash: work.last } : null, origin: work.origin ? copy(work.origin) : null, models: copy(work.models) };
      for (const [id, tuple] of Object.entries(work.tasks)) {
        const [value, values, step, flags, hints, reveals, attempts, note, message, repeated] = tuple;
        const assisted = !!(flags & 2), correct = !!(flags & 8);
        state.tasks[id] = {
          value, values: [...values], step, guided: !!(flags & 1), assisted, hint: !!(flags & 4),
          stepHints: Object.fromEntries(hints.map(i => [i, true])), reveals: Object.fromEntries(reveals.map(i => [i, true])),
          attempts, correct, independent: false, note, feedback: message,
          signature: generatedTask(id) ? signature(resolveTask(id)) : '', repeated,
          completion: correct ? { attempts, assisted, independent: false } : null
        };
      }
      for (const [key, seed] of Object.entries(work.practice)) state.practice[key] = { seed };
      return state;
    }
    function sameModel(a, b) {
      if (a === b) return true;
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
      const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
      return ak.length === bk.length && ak.every((key, i) => key === bk[i] && sameModel(a[key], b[key]));
    }
    function validateState(value) {
      try {
        if (!safeJson(value) || !fields(value, ['route', 'work', 'view']) || !validRoute(value.route) ||
            bytes(value) > LIMITS.snapshotBytes || !workValid(value.work) ||
            !fields(value.view, ['model', 'details', 'stepFeedback', 'number'])) return false;
        const [page, id] = value.route.slice(1).split('/'), view = value.view;
        const task = activeTask(value.route, value.work), record = task ? value.work.tasks[task.id] || freshTuple() : null;
        if ((page === 'practice' || page === 'check') && (!task || !has(value.work.tasks, task.id))) return false;
        if (page === 'lesson' && value.work.last !== '#lesson/' + id + '/' + known.get(id).tasks.indexOf(task)) return false;
        if ((page === 'practice' || page === 'check') && value.work.origin === null && value.work.last !== value.route) return false;
        if (page === 'lesson' ? (!models.validateBoardState(known.get(id), view.model, task) || !has(value.work.models, task.id) || !sameModel(view.model, value.work.models[task.id])) : view.model !== null) return false;
        const detailCount = page === 'home' ? 1 : page === 'lesson' ? 4 : (page === 'practice' || page === 'check') ? 1 : 0;
        if (!Array.isArray(view.details) || view.details.length !== detailCount || !view.details.every(v => typeof v === 'boolean') ||
            !['', 'empty', 'wrong'].includes(view.stepFeedback)) return false;
        if (page === 'lesson' && (view.details[2] || view.details[3]) && !(record[3] & 2) && !(record[3] & 8)) return false;
        if (view.stepFeedback && (!record || !(record[3] & 1) || record[2] >= task.steps.length)) return false;
        if (!fields(view.number, ['draft', 'submitted', 'part']) || !integer(view.number.part, 1, 3) || !matchExact(/^\d{0,3}$/, view.number.draft) ||
            (view.number.submitted !== null && view.number.submitted !== 'invalid' && !integer(view.number.submitted, 1, PART_MAX[view.number.part]))) return false;
        if (page !== 'home' && (view.number.draft !== '' || view.number.submitted !== null)) return false;
        return true;
      } catch (_) { return false; }
    }
    function readDetails(main) { return [...main.querySelectorAll('details')].map(element => element.open); }
    function applyDetails(main, values) {
      const elements = [...main.querySelectorAll('details')];
      if (!Array.isArray(values) || values.length !== elements.length || !values.every(v => typeof v === 'boolean'))
        throw new TypeError('Invalid Peterson disclosures');
      elements.forEach((element, i) => { element.open = values[i]; });
    }
    return Object.freeze({ validRoute, pack, unpack, validateState, validateWork: work => { try { return workValid(work); } catch (_) { return false; } }, resolveTask, readDetails, applyDetails });
  }
  const api = Object.freeze({ id: 'peterson6', path: '/trainers/peterson6.html', marker: 'part1', defaultRoute: '#home', limits: LIMITS, create });
  root.PetersonBoard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
