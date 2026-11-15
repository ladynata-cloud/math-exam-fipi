/* Read-only course projection. Existing trainer saves remain the source of truth. */
(function (root) {
  'use strict';
  const PATH_KEY = 'mathexam.ege-baza.path.v1';
  const definitions = [
    ['m01', 'Числа, деньги и проценты', [1, 2, 6, 14, 15]],
    ['m02', 'Данные, графики и логика', [3, 5, 7, 8]],
    ['m03', 'Выражения и уравнения', [4, 16, 17, 18]],
    ['m04', 'Геометрия на плоскости', [9, 10, 12]],
    ['m05', 'Геометрия в пространстве', [11, 13]],
    ['m06', 'Задачи и рассуждения', [19, 20, 21]],
    ['m07', 'Экзаменационная практика', []]
  ];
  const legacyPaths = { m01: '/trainers/ege-baza/course/', m02: '/trainers/ege-baza/data-course/' };
  const legacyKeys = { m01: 'mathexam.ege-baza.foundation.v1', m02: 'mathexam.ege-baza.data.v1' };
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const integer = (value, max = 1e9) => Number.isSafeInteger(value) && value >= 0 && value <= max;
  const string = (value, max = 10000) => typeof value === 'string' && value.length <= max;
  const token = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
  const lineHref = id => '/ege-baza/index.html#line?line=' + id;
  const lessonHref = id => '/ege-baza/path/index.html#lesson=' + id;
  const checkHref = kind => '/ege-baza/path/index.html#' + kind;
  const metadata = supplied => Array.isArray(supplied) ? supplied : root.PathData?.meta || [];
  function catalog(supplied) {
    const seen = new Set();
    const meta = metadata(supplied).filter(item => item && !item.grade7 && !item.pre7 && token(item.id) && !seen.has(item.id) && seen.add(item.id));
    return definitions.map(([id, title, positions]) => ({ id, title, href: lineHref(id), positions: positions.slice(),
      items: positions.flatMap(pos => meta.filter(item => item.pos === pos).map(item => ({ id: item.id, title: item.title, href: lessonHref(item.id), lineId: id }))) }));
  }
  function lineForLesson(id, supplied) {
    const line = catalog(supplied).find(item => item.items.some(lesson => lesson.id === id));
    return line ? { id: line.id, title: line.title, href: line.href } : null;
  }
  function nextLesson(id, supplied) {
    const line = catalog(supplied).find(item => item.items.some(lesson => lesson.id === id));
    if (!line) return null;
    return line.items[line.items.findIndex(item => item.id === id) + 1] || null;
  }
  function sourceStatus(statuses) {
    if (statuses.every(status => status === 'blocked')) return 'blocked';
    if (statuses.every(status => status === 'unreadable')) return 'unreadable';
    if (statuses.some(status => ['blocked', 'unreadable', 'partial'].includes(status))) return 'partial';
    return statuses.some(status => status === 'saved') ? 'saved' : 'empty';
  }
  function read(storage, key) {
    try {
      const text = storage.getItem(key);
      if (text === null) return { status: 'empty', text: null, raw: null };
      if (typeof text !== 'string' || text.length > 5 * 1024 * 1024) throw new TypeError('save');
      return { status: 'saved', text, raw: JSON.parse(text) };
    } catch (error) {
      return { status: error instanceof SyntaxError || error instanceof TypeError && error.message === 'save' ? 'unreadable' : 'blocked', text: null, raw: null };
    }
  }
  function unknown(item, source) {
    return { ...item, source, status: 'unknown', started: null, independent: null, confirmed: null, resume: false };
  }
  function taskFirstValid(value) {
    if (value === undefined) return true;
    return plain(value) && value.version === 1 && integer(value.seed) && string(value.finalDraft) && string(value.stepDraft) &&
      (value.legacyDraft === undefined || string(value.legacyDraft)) && string(value.feedback, 4000) && string(value.stepFeedback, 4000) &&
      (value.mistakes === undefined || integer(value.mistakes, 1000)) &&
      ['ideaOpen', 'repeatedVariant'].every(key => value[key] === undefined || typeof value[key] === 'boolean') &&
      Array.isArray(value.stepAnswers) && value.stepAnswers.length <= 20 && value.stepAnswers.every(answer => string(answer)) &&
      ['', 'good', 'bad'].includes(value.feedbackKind) && ['helpOpen', 'modelOpen', 'stepsOpen', 'whyOpen', 'noteOpen'].every(key => typeof value[key] === 'boolean') &&
      (value.model === null || plain(value.model) && JSON.stringify(value.model).length <= 16000);
  }
  function lessonValid(value, id) {
    if (!plain(value) || !integer(value.seed) || !integer(value.stage, 4) || !integer(value.step, 20) || !integer(value.independent) || !integer(value.guided) ||
      !string(value.note) || !string(value.draft) || typeof value.help !== 'boolean' || typeof value.attempted !== 'boolean' ||
      !Array.isArray(value.checks) || value.checks.length > 100 || value.done !== undefined && typeof value.done !== 'boolean' || !taskFirstValid(value.taskFirst)) return false;
    try {
      // The writer keeps done/checks when a pupil edits the input after success.
      // This editable draft is not the historical answer that earned the count.
      const task = root.PathData.task(id, value.seed);
      return value.step <= task.steps.length;
    } catch (error) { return false; }
  }
  function pathItem(item, value, source) {
    if (['unreadable', 'blocked'].includes(source.status)) return unknown(item, 'path');
    if (value === undefined) return { ...item, source: 'path', status: 'unstarted', started: false, independent: false, confirmed: false, resume: false };
    if (!lessonValid(value, item.id)) { source.status = 'partial'; return unknown(item, 'path'); }
    const ui = value.taskFirst?.seed === value.seed ? value.taskFirst : null;
    const work = !!(value.draft || value.step || value.attempted || value.help || value.note || ui?.finalDraft || ui?.stepDraft || ui?.legacyDraft);
    const independent = value.independent > 0, guided = value.guided > 0;
    const resume = !value.done && work;
    return { ...item, source: 'path', status: independent ? 'independent' : guided || value.done ? 'guided' : work ? 'started' : 'unstarted',
      started: work || independent || guided || value.done === true, independent, confirmed: false, resume,
      independentCount: value.independent, guidedCount: value.guided };
  }
  function pathRootValid(value) {
    return plain(value) && value.version === 1 && integer(value.serial) && plain(value.lessons) && plain(value.seen) &&
      Object.keys(value.seen).length < 20000 && Object.values(value.seen).every(item => item === true) && Array.isArray(value.runs) && value.runs.length <= 200;
  }
  function loaderCompatibility(value, knownIds) {
    if (!pathRootValid(value)) return 'rejected';
    let unverified = false;
    const known = id => { if (!knownIds.has(id)) unverified = true; return typeof id === 'string'; };
    // path/app.js loads the complete document or rejects it. A readable EGE
    // row alone cannot promise resume if a sibling would make that loader fail.
    const lessonShape = row => plain(row) && integer(row.seed) && integer(row.stage, 4) && integer(row.step, 20) &&
      integer(row.independent) && integer(row.guided) && string(row.note) && string(row.draft) && typeof row.help === 'boolean' &&
      typeof row.attempted === 'boolean' && Array.isArray(row.checks) && taskFirstValid(row.taskFirst);
    const runShape = run => plain(run) && ['exam', 'diagnostic'].includes(run.kind) && Array.isArray(run.ids) && run.ids.length === 21 &&
      run.ids.every(known) && Array.isArray(run.answers) && run.answers.length <= 21 && run.answers.every(answer => plain(answer) &&
        known(answer.id) && integer(answer.seed) && typeof answer.value === 'string' && answer.value.length < 10000 && typeof answer.correct === 'boolean') &&
      integer(run.seed) && integer(run.i, 21) && Number.isFinite(run.start) && (run.draft === undefined || string(run.draft));
    if (!Object.entries(value.lessons).every(([id, row]) => known(id) && lessonShape(row)) || !value.runs.every(runShape) || value.active && !runShape(value.active)) return 'rejected';
    // The lightweight home catalog intentionally excludes other school courses.
    // Their readable records remain visible through EGE projection, but without
    // the full catalog we cannot establish that every foreign ID is supported.
    return unverified ? 'unverified' : 'compatible';
  }
  function checkValid(run, ids, active) {
    if (!plain(run) || !['diagnostic', 'exam'].includes(run.kind) || !Array.isArray(run.ids) || run.ids.length !== 21 || !run.ids.every(id => ids.has(id)) ||
      !Array.isArray(run.answers) || run.answers.length > 21 || !integer(run.seed) || !integer(run.i, 21) || !Number.isFinite(run.start) || run.start < 0 ||
      run.draft !== undefined && !string(run.draft) || run.assisted !== undefined && typeof run.assisted !== 'boolean' ||
      run.interrupted !== undefined && typeof run.interrupted !== 'boolean') return false;
    if (active ? run.answers.length !== run.i : !Number.isFinite(run.finished) || run.finished <= 0 || run.answers.length !== 21) return false;
    return run.answers.every((answer, index) => {
      if (!plain(answer) || answer.id !== run.ids[index] || answer.seed !== run.seed + index || !string(answer.value) || typeof answer.correct !== 'boolean' ||
        answer.previouslySeen !== undefined && typeof answer.previouslySeen !== 'boolean' || answer.skipped !== undefined && typeof answer.skipped !== 'boolean') return false;
      try { return answer.correct === (answer.value.trim() !== '' && root.PathData.correct(root.PathData.task(answer.id, answer.seed), answer.value)); }
      catch (error) { return false; }
    });
  }
  function counts(items) {
    const known = name => items.filter(item => item[name] === true).length;
    const result = { total: items.length };
    for (const name of ['started', 'independent', 'confirmed']) {
      result[name] = items.some(item => item[name] === null) ? null : known(name);
      result['known' + name[0].toUpperCase() + name.slice(1)] = known(name);
    }
    return result;
  }
  function action(item, kind, reason, label) {
    return { href: item.resumeHref || item.href, label: label || (kind === 'resume' ? 'Продолжить' : 'Начать тему'), title: item.title, reason, kind };
  }
  function legacyProjection(id, source, now) {
    const engine = root.EgeBazaCourseState?.forModule(id), module = root.EgeBazaRegistry?.modules.find(item => item.id === id);
    const lessons = module?.lessons || [];
    const base = lessons.map(item => ({ id: item.id, title: item.title, href: legacyPaths[id] + '#learn-' + item.skill, source: id, skill: item.skill }));
    const unavailable = () => ({ source: id, title: 'Ранний учебный модуль', status: source.status, items: base.map(item => unknown(item, id)), checks: [], ...counts(base.map(item => unknown(item, id))) });
    if (['unreadable', 'blocked'].includes(source.status)) return unavailable();
    if (!engine || !root.EgeBazaBackup?.forModule(id)) { source.status = 'unreadable'; return unavailable(); }
    try { if (source.raw !== null) root.EgeBazaBackup.forModule(id).validateState(source.raw); }
    catch (error) { source.status = 'unreadable'; return unavailable(); }
    const state = engine.snapshot(source.text, now), checks = [];
    const correct = (task, answer) => typeof answer === 'string' && Math.abs(Number(answer.trim().replace(/,/g, '.').replace(/^−/, '-')) - task.answer) < 1e-8;
    const items = base.map(item => {
      const skill = state.skills.find(value => value.id === item.skill), repeat = state.runs.repeat, checkpoint = state.runs.checkpoint;
      const repeatFailed = repeat.finished && (!checkpoint.finished || repeat.at >= checkpoint.at) &&
        engine.bank.tasks.filter(task => task.phase === 'repeat' && task.skill === item.skill && correct(task, repeat.answers[task.id])).length < 2;
      const confirmed = !repeatFailed && skill.level >= 3;
      const resume = skill.started && skill.next >= 0;
      return { ...item, status: repeatFailed ? 'need-review' : skill.level === 4 ? 'repeated' : confirmed ? 'confirmed' : skill.solo > 0 ? 'independent' : skill.done ? 'guided' : skill.started ? 'started' : 'unstarted',
        started: skill.started || skill.done > 0 || confirmed || repeatFailed, independent: skill.solo > 0, confirmed, resume,
        resumeHref: resume ? legacyPaths[id] + '#practice-' + item.skill + '-' + skill.next : null, independentCount: skill.solo, solved: skill.done };
    });
    for (const phase of ['repeat', 'checkpoint', 'diagnostic']) {
      const run = state.runs[phase];
      if (run.started && !run.finished && (phase !== 'repeat' || state.repeatReady)) checks.push({ href: legacyPaths[id] + '#test-' + phase,
        label: 'Продолжить проверку', title: module.title, reason: 'В раннем модуле сохранена незавершённая проверка: ' + run.count + ' из ' + run.total + ' ответов.', kind: 'resume-check' });
    }
    return { source: id, title: 'Ранний учебный модуль', status: source.status, items, checks, ...counts(items), repeatAt: state.repeatAt, repeatReady: state.repeatReady };
  }
  function snapshot(storage, now = Date.now()) {
    if (storage === undefined) { try { storage = root.localStorage; } catch (error) { storage = null; } }
    const sources = { path: read(storage, PATH_KEY), m01: read(storage, legacyKeys.m01), m02: read(storage, legacyKeys.m02) };
    const lines = catalog(), path = sources.path;
    if (path.status === 'saved') path.raw = root.PathData?.practice?.expandTask21Progress?.(path.raw) ?? path.raw;
    if (path.status === 'saved' && !pathRootValid(path.raw)) path.status = 'unreadable';
    const allKnownIds = new Set(metadata().map(item => item.id));
    const compatibility = path.status === 'empty' ? 'compatible' : path.status === 'saved' ? loaderCompatibility(path.raw, allKnownIds) : 'rejected';
    if (path.status === 'saved' && compatibility !== 'compatible') path.status = 'partial';
    const rows = ['saved', 'partial'].includes(path.status) ? path.raw.lessons : {};
    const legacy = { m01: legacyProjection('m01', sources.m01, now), m02: legacyProjection('m02', sources.m02, now) };
    for (const line of lines.slice(0, 6)) {
      const items = line.items.map(item => pathItem(item, rows[item.id], path));
      const group = { source: 'path', title: 'Практика по типам задач', items, status: items.some(item => item.status === 'unknown') ? 'partial' : path.status, ...counts(items) };
      Object.assign(line, counts(items));
      line.groups = [group, ...(legacy[line.id] ? [legacy[line.id]] : [])];
      line.items = line.groups.flatMap(value => value.items);
      line.status = sourceStatus(line.groups.map(value => value.status));
    }
    const ids = new Set(lines.slice(0, 6).flatMap(line => line.groups[0].items.map(item => item.id)));
    let active = null, checksUnknown = ['unreadable', 'blocked'].includes(path.status), runs = [];
    if (!checksUnknown && path.raw) {
      if (path.raw.active != null) {
        if (checkValid(path.raw.active, ids, true)) active = path.raw.active;
        else { checksUnknown = true; path.status = 'partial'; }
      }
      for (const run of path.raw.runs) {
        if (checkValid(run, ids, false)) runs.push(run);
        else { checksUnknown = true; path.status = 'partial'; }
      }
    }
    const checkItems = ['diagnostic', 'exam'].map(kind => {
      const item = { id: kind, title: kind === 'diagnostic' ? 'Стартовая диагностика' : 'Пробная работа', href: checkHref(kind), source: 'path' };
      if (checksUnknown) return unknown(item, 'path');
      const run = runs.filter(value => value.kind === kind).at(-1), resume = active?.kind === kind;
      return { ...item, status: resume ? 'started' : run ? 'completed' : 'unstarted', started: resume || !!run, independent: false, confirmed: false, resume,
        completed: !!run, result: run ? { correct: run.answers.filter(answer => answer.correct).length, total: 21, assisted: run.assisted === true,
          interrupted: run.interrupted === true, previouslySeen: run.answers.some(answer => answer.previouslySeen), at: run.finished } : null };
    });
    const exam = lines[6];
    Object.assign(exam, counts(checkItems), { items: checkItems, groups: [], status: checksUnknown ? 'unreadable' : path.status,
      completed: checksUnknown ? null : checkItems.filter(item => item.completed).length, completionTotal: 2 });
    const canResume = compatibility === 'compatible' && ['saved', 'empty'].includes(path.status);
    const recovery = line => ({ href: line.href, label: 'Посмотреть доступные результаты', title: line.title,
      reason: 'Часть сохранения недоступна для проверки. Точное продолжение сейчас не гарантировано; читаемые результаты остаются на карте.', kind: 'recovery' });
    if (!canResume) for (const line of lines) for (const item of line.items) if (item.source === 'path') item.resume = false;
    for (const line of lines) {
      const legacyCheck = legacy[line.id]?.checks[0];
      const pending = line.items.find(item => item.resume), review = line.items.find(item => item.status === 'need-review');
      const untouched = line.items.find(item => item.source === 'path' && item.status === 'unstarted');
      const practice = line.items.find(item => item.source === 'path' && item.independent === false && item.status !== 'unknown');
      line.next = legacyCheck || (pending ? action(pending, 'resume', 'Сохранены незавершённая работа или ответы. Продолжение сохранит текущее условие.') :
        review ? action(review, 'review', 'В повторной проверке возникли затруднения. Вернитесь к этому навыку.', 'Повторить навык') :
        !canResume ? recovery(line) :
        untouched || practice ? action(untouched || practice, 'learn', 'Следующая доступная тема этой учебной линии.') :
        { href: line.href, label: 'Выбрать тему', title: line.title, reason: 'Выберите тему для нового самостоятельного решения.', kind: 'choose' });
    }
    const activeCheck = active && !checksUnknown && canResume ? { href: checkHref(active.kind), label: 'Продолжить проверку',
      title: active.kind === 'exam' ? 'Пробная работа' : 'Стартовая диагностика', reason: 'Сохранена незавершённая проверка: ' + active.i + ' из 21 ответов.', kind: 'resume-check' } : null;
    const oldCheck = legacy.m01.checks[0] || legacy.m02.checks[0];
    const pendingLine = lines.find(line => line.next.kind === 'resume');
    const reviewLine = lines.find(line => line.next.kind === 'review');
    const learnedLine = lines.slice(0, 6).find(line => line.items.some(item => item.started === true));
    const recommendation = activeCheck || oldCheck || pendingLine?.next || reviewLine?.next || learnedLine?.next ||
      (!canResume ? recovery(lines[0]) : lines[0].next);
    return { status: sourceStatus(Object.values(sources).map(value => value.status)), lines, recommendation,
      sources: Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, { status: value.status,
        ...(key === 'path' ? { resumeCompatible: canResume, resumeStatus: compatibility === 'compatible' && !canResume ? 'unverified' : compatibility } : {}) }])),
      checks: { active: activeCheck, latest: checksUnknown ? null : runs.at(-1) ? checkItems.find(item => item.id === runs.at(-1).kind).result : null } };
  }
  root.EgeBazaJourney = { snapshot, catalog, lineForLesson, nextLesson, keys: { path: PATH_KEY, ...legacyKeys } };
  if (typeof module !== 'undefined') module.exports = root.EgeBazaJourney;
})(typeof window === 'undefined' ? globalThis : window);
