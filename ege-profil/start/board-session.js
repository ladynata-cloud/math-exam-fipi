(function (root) {
  'use strict';

  // Only these registered wrappers activate a board session. The ordinary
  // course keeps its existing browser storage and navigation. Configurations
  // are fixed here; routes or messages cannot extend any course boundary.
  const EXPRESSIONS = Object.freeze({
    id: 'ege-profile-expressions', marker: 'expressions', number: 8,
    path: '/trainers/ege-profile-expressions.html', debugKey: '__profileExpressionsBoard',
    lessonIds: Object.freeze(['expr-powers', 'expr-roots', 'expr-fractions', 'expr-logarithms', 'algebra-cosine', 'algebra-double-angle'])
  });
  const STEREOMETRY = Object.freeze({
    id: 'ege-profile-stereometry', marker: 'stereometry', number: 3,
    path: '/trainers/ege-profile-stereometry.html', debugKey: '__profileStereoBoard',
    lessonIds: Object.freeze(['stereo-box', 'stereo-cube', 'stereo-prism', 'stereo-pyramid', 'stereo-cylinder', 'stereo-cone', 'stereo-sphere', 'stereo-compound'])
  });
  const PLANIMETRY = Object.freeze({
    id: 'ege-profile-planimetry', marker: 'planimetry', number: 1,
    path: '/trainers/ege-profile-planimetry.html', debugKey: '__profilePlanimetryBoard',
    lessonIds: Object.freeze(['geo-angles', 'geo-right', 'geo-similarity', 'geo-area', 'geo-quadrilaterals', 'geo-circle'])
  });
  const VECTORS = Object.freeze({
    id: 'ege-profile-vectors', marker: 'vectors', number: 2,
    path: '/trainers/ege-profile-vectors.html', debugKey: '__profileVectorsBoard',
    lessonIds: Object.freeze(['vec-coordinates', 'vec-length', 'vec-operations', 'vec-dot'])
  });
  const PROBABILITY = Object.freeze({
    id: 'ege-profile-probability', marker: 'probability', number: 4,
    path: '/trainers/ege-profile-probability.html', debugKey: '__profileProbabilityBoard',
    lessonIds: Object.freeze(['prob-count', 'prob-complement', 'prob-range'])
  });
  const RANDOM_VARIABLES = Object.freeze({
    id: 'ege-profile-random-variables', marker: 'random-variables', number: 6,
    path: '/trainers/ege-profile-random-variables.html', debugKey: '__profileRandomVariablesBoard',
    lessonIds: Object.freeze(['prob-distribution', 'prob-variance', 'prob-continuous'])
  });
  const EQUATIONS = Object.freeze({
    id: 'ege-profile-equations', marker: 'equations', number: 7,
    path: '/trainers/ege-profile-equations.html', debugKey: '__profileEquationsBoard',
    lessonIds: Object.freeze(['algebra-exponential', 'algebra-logarithmic', 'eq-linear', 'eq-rational', 'eq-quadratic', 'eq-root'])
  });
  const MODES = ['guided', 'plan', 'independent'];
  const PROGRESS_KEY = 'mathexam.profileStart2027.v1';
  const PREFERENCES_KEY = 'mathexam.profileCalmPreferences.v1';
  const DETAIL_SELECTORS = Object.freeze({
    lab: '#explore-lab', materials: '.extra-help', foundation: '.task-foundation',
    simpler: '.task-foundation details', numberInput: '.number-help', extraSupport: '.support-details',
    calmBasics: '.calm-number-foundations', trigBasics: '.calm-trig-foundations'
  });
  // Additive disclosures: older room snapshots omitted these closed panels.
  const OPTIONAL_DETAIL_SELECTORS = Object.freeze({
    theory: 'details.theory', startHelp: '.calm-start-help', resources: '.course-resources'
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const fields = (value, keys) => object(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
    const property = Object.getOwnPropertyDescriptor(value, key);
    return property && property.enumerable && Object.hasOwn(property, 'value');
  });
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const text = value => typeof value === 'string' && value.length <= 200 && !/<\/?[a-z][^>]*>/i.test(value);
  function validRoute(hash, config) {
    if (hash === '#exam/' + config.number || hash === '#calm/' + config.number) return true;
    const match = /^#(lesson|example|practice|repair|pause)\/([a-z0-9-]+)(?:\/(guided|plan|independent))?$/.exec(hash || '');
    return !!match && config.lessonIds.includes(match[2]) &&
      (['lesson', 'example'].includes(match[1]) ? !match[3] : !!match[3]);
  }
  function safeJson(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return text(value);
    if ((!object(value) && !Array.isArray(value)) || seen.has(value)) return false;
    seen.add(value);
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (value.length > 2000 || Object.getPrototypeOf(value) !== Array.prototype ||
        keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean))) return false;
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key) ||
          !descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || !safeJson(descriptor.value, depth + 1, seen)) return false;
    }
    seen.delete(value);
    return true;
  }
  function create(lessons, config) {
    const LESSON_IDS = config.lessonIds;
    const routeValid = hash => validRoute(hash, config);
    const known = new Map(lessons.filter(l => LESSON_IDS.includes(l.id)).map(l => [l.id, l]));
    const tasks = new Map([...known.values()].flatMap(l => l.tasks.map(t => [t.id, t])));
    if (known.size !== LESSON_IDS.length) throw new Error('Incomplete ' + config.marker + ' course');
    const memory = new Map();
    const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
    const subset = (source, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(source, key)).map(key => [key, clone(source[key])]));
    function progress(data) {
      return {
        version: 1,
        records: Object.fromEntries(LESSON_IDS.map(id => [id, clone(data.records[id] || { guided: [], independent: [], attempts: 0 })])),
        seen: subset(data.seen, [...tasks.keys()]),
        sessions: subset(data.sessions, LESSON_IDS.flatMap(id => MODES.map(mode => id + ':' + mode)))
      };
    }
    function preferences(prefs) {
      return { version: 1, enabled: prefs.enabled, examples: subset(prefs.examples, LESSON_IDS), micro: {} };
    }
    function sessionValid(key, value) {
      if (!fields(value, ['taskId', 'step', 'wrong', 'assisted', 'familiar', 'done', 'draft', 'answers', 'started', 'registered'])) return false;
      const [id, mode, extra] = key.split(':'), lesson = known.get(id), task = lesson?.tasks.find(t => t.id === value.taskId);
      if (extra !== undefined || !MODES.includes(mode) || !task || !integer(value.step, 0, task.steps.length - 1) ||
          !['wrong', 'assisted', 'familiar', 'done', 'registered'].every(flag => typeof value[flag] === 'boolean') ||
          !text(value.draft) || !Array.isArray(value.answers) || !value.answers.every(text) ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.started) || !Number.isFinite(Date.parse(value.started)) ||
          new Date(value.started).toISOString() !== value.started) return false;
      const guided = mode === 'guided', total = guided ? task.steps.length : 1;
      if (value.answers.length > total || (guided ? value.answers.length < value.step || value.answers.length > value.step + 1 : value.step !== 0) ||
          value.done !== value.registered || (value.done && value.answers.length !== total) || (mode !== 'independent' && !value.assisted)) return false;
      if (mode === 'independent' && !lesson.tasks.slice(-3).includes(task)) return false;
      return value.answers.every((answer, index) => {
        const question = guided ? task.steps[index] : task;
        return root.ProfileCheck.check(question.answer, answer, question.choices);
      });
    }
    function context(value) {
      const [page, id, mode] = value.route.slice(1).split('/'), lesson = known.get(id);
      const session = value.progress.sessions[id + ':' + mode];
      const task = page === 'example' ? lesson.tasks[0] : session ? tasks.get(session.taskId) : null;
      const live = page === 'practice' && !session.done;
      const solved = live && session.answers.length > (mode === 'guided' ? session.step : 0);
      const question = live ? (mode === 'guided' ? task.steps[session.step] : task) : null;
      const model = page === 'lesson' ? root.ProfileModels?.[lesson.model] :
        ['example', 'practice'].includes(page) ? root.ProfileTaskModels?.[task.id] : null;
      // Match the existing renderer's semantic context. In particular, worked
      // examples and completed tasks hide the in-drawing walkthrough entirely.
      const modelContext = page === 'example' ? { mode: 'independent', strict: true, step: 0, solved: false, completed: 0, hideWalkthrough: true } :
        page === 'practice' ? live ? { step: session.step, solved, mode: mode === 'plan' ? 'independent' : mode, completed: session.answers.length } :
          { mode: 'independent', step: 0, completed: 0, solved: false, hideWalkthrough: true } : undefined;
      const inlineSolution = config.number === 1 && live && !!model &&
        ['geo-right-sine', 'geo-right-cosine', 'geo-right-tangent'].includes(task.id);
      return { page, id, mode, lesson, session, task, live, solved, question, model, modelContext, inlineSolution };
    }
    function validateState(value) {
      try {
        if (!safeJson(value) || new TextEncoder().encode(JSON.stringify(value)).length > 64 * 1024 ||
            !fields(value, ['route', 'returnToTask', 'progress', 'preferences', 'view']) || !routeValid(value.route)) return false;
        const data = value.progress, prefs = value.preferences, view = value.view;
        if (!fields(data, ['version', 'records', 'seen', 'sessions']) || data.version !== 1 || !fields(data.records, LESSON_IDS) ||
            !object(data.seen) || !object(data.sessions) || Object.keys(data.sessions).length > LESSON_IDS.length * MODES.length) return false;
        for (const id of LESSON_IDS) {
          const record = data.records[id], lesson = known.get(id);
          const optional = ['recovered', 'checkpointIndependent', 'mistakes'].filter(key => Object.hasOwn(record, key));
          if (!fields(record, ['guided', 'independent', 'attempts', ...optional]) || !integer(record.attempts, 0, 100000)) return false;
          for (const kind of ['guided', 'independent', ...optional]) {
            const list = record[kind], pool = ['independent', 'recovered', 'checkpointIndependent'].includes(kind) ? lesson.tasks.slice(-3) : lesson.tasks;
            if (!Array.isArray(list) || list.length > pool.length || new Set(list).size !== list.length || !list.every(id => pool.some(t => t.id === id))) return false;
          }
        }
        if (!Object.entries(data.seen).every(([id, n]) => tasks.has(id) && integer(n, 0, 100000)) ||
            !Object.entries(data.sessions).every(([key, session]) => sessionValid(key, session) && data.seen[session.taskId] >= 1)) return false;
        if (!fields(prefs, ['version', 'enabled', 'examples', 'micro']) || prefs.version !== 1 || typeof prefs.enabled !== 'boolean' ||
            !object(prefs.examples) || !fields(prefs.micro, []) || !Object.entries(prefs.examples).every(([id, n]) =>
              known.has(id) && integer(n, 0, root.ProfileSolutions.steps(known.get(id).tasks[0]).length - 1))) return false;
        const [page, id, mode] = value.route.slice(1).split('/');
        if (['practice', 'repair', 'pause'].includes(page) && !data.sessions[id + ':' + mode]) return false;
        if (['calm', 'example'].includes(page) && !prefs.enabled) return false;
        if (value.returnToTask !== null) {
          if (!routeValid(value.returnToTask) || !value.returnToTask.startsWith('#practice/') || value.returnToTask === value.route) return false;
          const [, lessonId, returnMode] = value.returnToTask.slice(1).split('/');
          if (!data.sessions[lessonId + ':' + returnMode]) return false;
        }
        if (!fields(view, ['hintOpen', 'difficultyOpen', 'feedback', 'details', 'help', 'model', 'solution']) ||
            typeof view.hintOpen !== 'boolean' || typeof view.difficultyOpen !== 'boolean' ||
            !['none', 'empty', 'format', 'wrong', 'right'].includes(view.feedback) ||
            !fields(view.details, [...Object.keys(DETAIL_SELECTORS), 'earned', ...Object.keys(OPTIONAL_DETAIL_SELECTORS).filter(key => Object.hasOwn(view.details, key))]) ||
            !Object.keys(DETAIL_SELECTORS).every(key => typeof view.details[key] === 'boolean') ||
            !Object.keys(OPTIONAL_DETAIL_SELECTORS).every(key => !Object.hasOwn(view.details, key) || typeof view.details[key] === 'boolean') || !Array.isArray(view.details.earned)) return false;
        const c = context(value), d = view.details;
        if ((!c.live && (view.hintOpen || view.difficultyOpen || view.feedback !== 'none' || view.help !== null)) ||
            (c.live && ((view.feedback === 'right') !== c.solved || (view.difficultyOpen && (!c.session.wrong || c.solved)) ||
              (view.feedback === 'wrong' && !c.session.wrong)))) return false;
        if ((d.lab && (c.page !== 'lesson' || !c.model)) || (d.materials && c.page !== 'lesson') ||
            (d.foundation && !c.live) || (d.simpler && (!c.live || !c.lesson.prereq?.text)) ||
            (d.numberInput && (!c.live || c.question.choices)) || (d.extraSupport && !c.live) ||
            (d.calmBasics && c.page !== 'calm') || (d.trigBasics && (c.page !== 'calm' || config.number !== 8)) ||
            (d.theory && c.page !== 'lesson') || (d.startHelp && c.page !== 'calm') || (d.resources && !['exam', 'calm'].includes(c.page)) ||
            new Set(d.earned).size !== d.earned.length || !d.earned.every(index => c.page === 'practice' && c.mode === 'guided' &&
              prefs.enabled && integer(index, 0, c.session.answers.length - 1))) return false;
        if (view.help !== null && (!fields(view.help, ['kind', 'controlIndex']) ||
            !['model', 'solution'].includes(view.help.kind) || !integer(view.help.controlIndex, -1, 16) ||
            (view.help.kind === 'model' && !c.model) || (view.help.kind === 'solution' && c.inlineSolution))) return false;
        if (c.model ? !c.model.validateBoardState?.(view.model, c.modelContext) : view.model !== null) return false;
        if (c.inlineSolution) {
          if (view.solution !== null) return false;
        } else if (['practice', 'example'].includes(c.page)) {
          if (!root.ProfileSolutions.validateBoardState(c.task, view.solution)) return false;
          if (c.page === 'example' && (view.solution.count < 1 || prefs.examples[c.id] !== view.solution.count - 1)) return false;
        } else if (view.solution !== null) return false;
        return true;
      } catch (_) { return false; }
    }
    function replace(value) {
      if (!validateState(value)) throw new TypeError('Invalid ' + config.marker + ' board state');
      memory.clear();
      storage.setItem(PROGRESS_KEY, JSON.stringify(value.progress));
      storage.setItem(PREFERENCES_KEY, JSON.stringify(value.preferences));
    }
    function readDetails(main) {
      const values = Object.fromEntries(Object.entries({ ...DETAIL_SELECTORS, ...OPTIONAL_DETAIL_SELECTORS }).map(([key, selector]) => [key, !!main.ownerDocument.querySelector(selector)?.open]));
      values.earned = [...main.querySelectorAll('.earned-explanation')].flatMap((element, index) => element.open ? [index] : []);
      return values;
    }
    function applyDetails(main, value) {
      for (const [key, selector] of Object.entries({ ...DETAIL_SELECTORS, ...OPTIONAL_DETAIL_SELECTORS })) {
        const element = main.ownerDocument.querySelector(selector);
        if (element) element.open = value[key] === true;
      }
      [...main.querySelectorAll('.earned-explanation')].forEach((element, index) => { element.open = value.earned.includes(index); });
    }
    // Resolve authored course-relative links against the canonical course, not
    // against /trainers/. Only this wrapper's registered topics stay in the room.
    function scopeLinks(main) {
      const canonical = new URL('/ege-profil/start/index.html', location.origin);
      for (const link of main.querySelectorAll('a[href]')) {
        const href = link.getAttribute('href');
        if (href.startsWith('#') && (routeValid(href) || ['#task-model', '#task-solution', '#main'].includes(href))) continue;
        const url = new URL(href, canonical);
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        link.href = url.href;
        link.target = '_blank'; link.rel = 'noopener';
      }
    }
    return { storage, progress, preferences, validateState, replace, readDetails, applyDetails, scopeLinks };
  }
  function api(config) {
    return Object.freeze({
      LESSON_IDS: config.lessonIds, id: config.id, marker: config.marker,
      path: config.path, debugKey: config.debugKey, defaultRoute: '#exam/' + config.number,
      validRoute: hash => validRoute(hash, config), create: lessons => create(lessons, config)
    });
  }
  const expressions = api(EXPRESSIONS), stereometry = api(STEREOMETRY), planimetry = api(PLANIMETRY),
    vectors = api(VECTORS), probability = api(PROBABILITY), randomVariables = api(RANDOM_VARIABLES), equations = api(EQUATIONS);
  root.ProfileExpressionsBoard = expressions;
  root.ProfileStereoBoard = stereometry;
  root.ProfilePlanimetryBoard = planimetry;
  root.ProfileVectorsBoard = vectors;
  root.ProfileProbabilityBoard = probability;
  root.ProfileRandomVariablesBoard = randomVariables;
  root.ProfileEquationsBoard = equations;
  // Preserve the published №8 default and №3 named CommonJS APIs.
  if (typeof module !== 'undefined' && module.exports) module.exports = Object.freeze({ ...expressions, stereometry,
    planimetry, vectors, probability, randomVariables, equations });
})(globalThis);
